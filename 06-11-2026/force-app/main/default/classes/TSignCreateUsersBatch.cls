global without sharing class TSignCreateUsersBatch implements Database.Batchable<SObject>, Database.Stateful {

    private Set<Id> contactIds;

    // Saved in finish(): a User with a role and normal records cannot be
    // saved in the same transaction (mixed DML), so errors wait until then.
    private List<TSign_Error_handling__c> errorsToLog = new List<TSign_Error_handling__c>();
    

    // Sign-ups whose user could not be created. Removed in finish() so no
    // duplicate organisation, facility, staff or contact is left behind.
    private Set<Id> failedContactIds = new Set<Id>();
    private Map<Id, Id> failedOrgIdByContactId = new Map<Id, Id>();
    private List<Object> successEmailsToSend = new List<Object>();
    private List<Object> failureEmailsToSend = new List<Object>();

    global TSignCreateUsersBatch(Set<Id> contactIds) {
        this.contactIds = contactIds;
    }

    global Database.QueryLocator start(Database.BatchableContext context) {
        return Database.getQueryLocator([
            SELECT Id, FirstName, LastName, Email, AccountId
            FROM Contact
            WHERE Id IN :contactIds AND AccountId != null AND Email != null
        ]);
    }

    global void execute(Database.BatchableContext context, List<SObject> scope) {
        List<Contact> contacts = new List<Contact>();
        Set<String> emails = new Set<String>();

        for (SObject record : scope) {
            Contact con = (Contact) record;
            contacts.add(con);
            if (!String.isBlank(con.Email)) {
                emails.add(con.Email.toLowerCase());
            }
        }

        // Catch empty scope and log to error object
        if (contacts.isEmpty()) { logError('system@unknown.com', 'Batch execute triggered, but the scope of contacts was empty. No users could be created.'); return;
        }

        Product_User_Setting__mdt settings = getTSignSettings();

        // 1. Fetch configuration data
        Map<String, TSign_Staff__c> staffByEmail = new Map<String, TSign_Staff__c>();
        for (TSign_Staff__c staff : [
            SELECT Id, First_Name__c, Email__c, TSign_Organisation__c, User_Role__c, User_Type__c, Address__CountryCode__s
            FROM TSign_Staff__c
            WHERE Email__c IN :emails
        ]) {
            if (!String.isBlank(staff.Email__c)) {
                staffByEmail.put(staff.Email__c.toLowerCase(), staff);
            }
        }

        Set<String> roleNames = new Set<String>();
        for (TSign_Staff__c staff : staffByEmail.values()) {
            if (!String.isBlank(staff.User_Role__c)) {
                roleNames.add(staff.User_Role__c);
            }
        }

        Map<String, Id> roleNameToId = new Map<String, Id>();
        if (!roleNames.isEmpty()) {
            for (UserRole roleRecord : [SELECT Id, Name FROM UserRole WHERE Name IN :roleNames]) {
                roleNameToId.put(roleRecord.Name, roleRecord.Id);
            }
        }
         system.debug('roleNameToId==>'+roleNameToId);

        List<Profile> profiles = [SELECT Id, Name FROM Profile WHERE Name = :settings.Profile_Name__c LIMIT 1];
        Profile portalProfile = profiles.isEmpty() ? null : profiles[0];

        // A person who already has an NDIS login keeps that username,
        // so the TSign user gets email + suffix (e.g. jane@abc.com.tsign).
        Set<String> takenUsernames = findTakenUsernames(emails, settings);

        // 2. Build Users and catch specific configuration missing errors
        List<User> usersToInsert = new List<User>();
        Map<String, Contact> contactByEmail = new Map<String, Contact>();
        Map<String, String> errorByEmail = new Map<String, String>(); // Track errors before DML

        for (Contact con : contacts) {
            String emailKey = con.Email.toLowerCase();
            TSign_Staff__c staff = staffByEmail.get(emailKey);
            contactByEmail.put(emailKey, con);

            try {
                if (staff == null) {
                    throw new CustomException('No TSign Staff found for email: ' + con.Email);
                }

                if (portalProfile == null) { throw new CustomException('Profile "' + settings.Profile_Name__c + '" was not found in Salesforce.');
                }

                // The partner roles of a new partner account only exist after its
                // first user is created. Without a role Salesforce gives the user
                // the account's default partner role, so creation still succeeds.
                Id roleId = roleNameToId.get(staff.User_Role__c);
                if (roleId == null) {
                    logError(emailKey, 'Role "' + staff.User_Role__c + '" was not found; the user gets the default partner role.');
                }

                User portalUser = new User();
                portalUser.Username = usernameFor(con.Email, settings, takenUsernames);
                portalUser.Email = con.Email;
                portalUser.FirstName = con.FirstName;
                portalUser.LastName = con.LastName;
                portalUser.Alias = buildAlias(con);
                portalUser.CommunityNickname = buildCommunityNickname(con);
                portalUser.ProfileId = portalProfile.Id;
                portalUser.ContactId = con.Id;

                String countryCode = staff.Address__CountryCode__s;
                portalUser.TimeZoneSidKey = getTimeZone(countryCode, null);
                portalUser.LocaleSidKey = getLocale(countryCode, null);
                portalUser.EmailEncodingKey = 'UTF-8';
                portalUser.LanguageLocaleKey = 'en_US';
               // portalUser.Organization_Name__c = staff.TSign_Organisation__c != null ? getOrganisationName(staff.TSign_Organisation__c) : null;
                portalUser.TSign_Org_Id__c=staff.TSign_Organisation__c;
                if (roleId != null) {
                    portalUser.UserRoleId = roleId;
                }
                portalUser.IsActive = true;
                portalUser.User_Type__c = staff.User_Type__c;

                usersToInsert.add(portalUser);

            } catch (Exception e) {
                // Catch configuration errors here
                errorByEmail.put(emailKey, e.getMessage());
            }
        }

        // 3. Insert Users with partial success (catch DML errors)
        List<User> createdUsers = new List<User>();
        List<User> retryUsers = new List<User>();
        if (!usersToInsert.isEmpty()) {
            Database.SaveResult[] results = Database.insert(usersToInsert, false);
            for (Integer i = 0; i < results.size(); i++) {
                User currentUser = usersToInsert[i];
                if (results[i].isSuccess()) {
                    createdUsers.add(currentUser);
                    System.debug(LoggingLevel.INFO, 'Portal User created successfully. User Id: ' + results[i].getId());
                } else if (isDuplicateUsername(results[i]) && !String.isBlank(settings.Username_Suffix__c) && !currentUser.Username.endsWith(settings.Username_Suffix__c)) { User retryUser = currentUser.clone(false, true); retryUser.Username = currentUser.Username + settings.Username_Suffix__c; retryUsers.add(retryUser);
                } else {
                    errorByEmail.put(currentUser.Email.toLowerCase(), errorText(results[i]));
                }
            }
        }

        if (!retryUsers.isEmpty()) { Database.SaveResult[] retryResults = Database.insert(retryUsers, false); for (Integer i = 0; i < retryResults.size(); i++) { if (retryResults[i].isSuccess()) { createdUsers.add(retryUsers[i]); } else { errorByEmail.put(retryUsers[i].Email.toLowerCase(), errorText(retryResults[i]));
                }
            }
        }

        // 4. Give new users the TSign permission set
        Map<Id, String> permissionErrors = assignPermissionSet(createdUsers, settings);
        for (User u : createdUsers) {
            if (permissionErrors.containsKey(u.Id)) {
                logError(u.Email.toLowerCase(), permissionErrors.get(u.Id));
            }
        }
        
  
        // ==========================================
        // NEW: COLLECT SUCCESS EMAILS
        // ==========================================
        for (User createdUser : createdUsers) {
            TSign_Staff__c staff = staffByEmail.get(createdUser.Email.toLowerCase());
            String orgName = staff != null && staff.TSign_Organisation__c != null ? getOrganisationName(staff.TSign_Organisation__c) : 'TSign Organisation';
            
            String body = 'Hi Support Team,<br/><br/>' +
                'This is an automated notification to inform you that a new TSign portal user has been successfully created.<br/><br/>' +
                '<b>User Details:</b><br/>' +
                '<b>• Name:</b> ' + createdUser.FirstName + ' ' + createdUser.LastName + '<br/>' +
                '<b>• Email:</b> ' + createdUser.Email + '<br/>' +
                '<b>• Username:</b> ' + createdUser.Username + '<br/>' +
                '<b>• Organisation:</b> ' + orgName + '<br/><br/>' +
                'Please contact this person to welcome them and provide any necessary next steps.<br/><br/>' +
                'Thanks and Regards,<br/>' +
                '<b>TSign System Administrator</b>';
            
            successEmailsToSend.add(buildEmailPayload('SUCCESS: TSign Portal User Created', body));
        }
        // ==========================================


        // 5. Log errors and mark the sign-up for removal in finish()
        for (String failedEmail : errorByEmail.keySet()) {
            logError(failedEmail, errorByEmail.get(failedEmail));

            Contact con = contactByEmail.get(failedEmail);
            if (con != null) {
                failedContactIds.add(con.Id);
                TSign_Staff__c staff = staffByEmail.get(failedEmail);
                if (staff != null && staff.TSign_Organisation__c != null) {
                    failedOrgIdByContactId.put(con.Id, staff.TSign_Organisation__c);
                }

                // ==========================================
                // NEW: COLLECT FAILURE EMAILS
                // ==========================================
                String fullName = con.FirstName + ' ' + con.LastName;
                String errorMsg = errorByEmail.get(failedEmail);
                
                String body = 'Hi Support Team,<br/><br/>' +
                    'This is an automated notification to inform you that a TSign portal user creation has failed.<br/><br/>' +
                    '<b>Candidate Details:</b><br/>' +
                    '<b>• Name:</b> ' + fullName + '<br/>' +
                    '<b>• Email:</b> ' + failedEmail + '<br/><br/>' +
                    '<b>Error Details:</b><br/>' +
                    '<span style="color: #d9534f;">' + errorMsg + '</span><br/><br/>' +
                    'The temporary records have been rolled back. Please review the error and contact the candidate.<br/><br/>' +
                    'Thanks and Regards,<br/>' +
                    '<b>TSign System Administrator</b>';
                              
                failureEmailsToSend.add(buildEmailPayload('ALERT: TSign Portal User Creation FAILED', body));
                // ==========================================
            }
        }

        // 5. Log errors and mark the sign-up for removal in finish()
        for (String failedEmail : errorByEmail.keySet()) {
            logError(failedEmail, errorByEmail.get(failedEmail));

            Contact con = contactByEmail.get(failedEmail);
            if (con != null) {
                failedContactIds.add(con.Id);
                TSign_Staff__c staff = staffByEmail.get(failedEmail);
                if (staff != null && staff.TSign_Organisation__c != null) {
                    failedOrgIdByContactId.put(con.Id, staff.TSign_Organisation__c);
                }
            }
        }
    }

    global void finish(Database.BatchableContext context) {
        // Deletes run here, in their own transaction, for the same mixed DML reason.
        cleanUpFailedSignUps();

        if (!errorsToLog.isEmpty()) {
            Database.insert(errorsToLog, false);
        }
        
        List<Object> allEmailsToSend = new List<Object>();
        allEmailsToSend.addAll(successEmailsToSend);
        allEmailsToSend.addAll(failureEmailsToSend);
        
        if (!allEmailsToSend.isEmpty()) {
            Id jobId = System.enqueueJob(new EmailRelayQueueable(allEmailsToSend));
            System.debug('✅ Emails queued from Batch finish. Job ID: ' + jobId);
        }
        System.debug(LoggingLevel.INFO, 'TSign portal User batch completed.');
    }

    // Removes a failed sign-up completely — staff-facility links, staff, facilities,
    // organisation contacts, the Contact and the organisation — so no duplicate data is
    // left and the customer can sign up again. The error log keeps the email, the
    // organisation name and the Stripe details for support.
    // An organisation that already has a TSign user is never removed.
    private void cleanUpFailedSignUps() {
        if (failedContactIds.isEmpty()) return;

        Set<Id> candidateOrgIds = new Set<Id>(failedOrgIdByContactId.values());
        Set<String> candidateOrgIdText = new Set<String>();
        for (Id orgId : candidateOrgIds) {
            candidateOrgIdText.add(String.valueOf(orgId));
        }
        Set<String> orgsWithUsers = new Set<String>();
        if (!candidateOrgIdText.isEmpty()) {
            for (User u : [SELECT TSign_Org_Id__c FROM User WHERE TSign_Org_Id__c IN :candidateOrgIdText]) { orgsWithUsers.add(u.TSign_Org_Id__c);
            }
        }

        Set<Id> orgIdsToDelete = new Set<Id>();
        Set<Id> contactIdsToDelete = new Set<Id>();
        for (Id contactId : failedContactIds) {
            Id orgId = failedOrgIdByContactId.get(contactId);
            if (orgId != null && orgsWithUsers.contains(String.valueOf(orgId))) { logError('system@cleanup.com', 'Sign-up records for organisation ' + orgId + ' were kept because it already has a TSign user.'); continue;
            }
            contactIdsToDelete.add(contactId);
            if (orgId != null) {
                orgIdsToDelete.add(orgId);
            }
        }

        List<TSign_Organisation__c> orgs = [
            SELECT Id, Name, Email__c, Meta_Data_Deatils__c
            FROM TSign_Organisation__c
            WHERE Id IN :orgIdsToDelete
        ];
        for (TSign_Organisation__c org : orgs) {
            String stripeDetails = String.isBlank(org.Meta_Data_Deatils__c) ? '' : org.Meta_Data_Deatils__c;
            if (stripeDetails.length() > 30000) { stripeDetails = stripeDetails.left(30000);
            }
            logError(String.isBlank(org.Email__c) ? 'system@cleanup.com' : org.Email__c,
                'Sign-up removed because the user could not be created. Organisation: ' + org.Name +
                '. Stripe details: ' + stripeDetails);
        }

        List<TSign_Staff__c> staffToDelete = [
            SELECT Id FROM TSign_Staff__c WHERE TSign_Organisation__c IN :orgIdsToDelete
        ];
        List<TSign_Facility__c> facilitiesToDelete = [
            SELECT Id FROM TSign_Facility__c WHERE TSign_Organisation__c IN :orgIdsToDelete
        ];
        List<TSign_Staff_Facility__c> linksToDelete = [
            SELECT Id FROM TSign_Staff_Facility__c
            WHERE TSign_Staff__c IN :staffToDelete OR TSign_Facility__c IN :facilitiesToDelete
        ];
        List<TSign_Org_Contact__c> orgContactsToDelete = [
            SELECT Id FROM TSign_Org_Contact__c WHERE TSign_Organisation__c IN :orgIdsToDelete
        ];
        List<Contact> contactsToDelete = [
            SELECT Id FROM Contact WHERE Id IN :contactIdsToDelete
        ];

        deleteAndLog(linksToDelete);
        deleteAndLog(staffToDelete);
        deleteAndLog(facilitiesToDelete);
        deleteAndLog(orgContactsToDelete);
        deleteAndLog(contactsToDelete);
        deleteAndLog(orgs);
    }

    private void deleteAndLog(List<SObject> records) {
        if (records.isEmpty()) return;
        Database.DeleteResult[] results = Database.delete(records, false);
        for (Integer i = 0; i < results.size(); i++) {
            if (!results[i].isSuccess()) { String message = ''; for (Database.Error err : results[i].getErrors()) { message += err.getStatusCode() + ': ' + err.getMessage() + ' '; } logError('system@cleanup.com', 'Failed to delete ' + records[i].Id + ' during sign-up clean-up: ' + message.trim());
            }
        }
    }

    private void logError(String email, String message) {
        errorsToLog.add(new TSign_Error_handling__c(
            Email__c         = email,
            Error_Message__c = message
        ));
    }

    // Custom Exception Class
    public class CustomException extends Exception {}

    // --- HELPER METHODS ---

    // Profile, permission set and username suffix for TSign users
    // (Setup → Custom Metadata Types → Product User Setting → record TSign).
    private static Product_User_Setting__mdt getTSignSettings() {
        Product_User_Setting__mdt settings = Product_User_Setting__mdt.getInstance('TSign');
        if (settings == null) { throw new CustomException('Product_User_Setting__mdt record "TSign" was not found.');
        }
        return settings;
    }

    // Usernames (lower case) already taken in this org: each email and email + suffix.
    private static Set<String> findTakenUsernames(Set<String> emails, Product_User_Setting__mdt settings) {
        Set<String> candidates = new Set<String>();
        for (String email : emails) {
            if (String.isBlank(email)) continue;
            String key = email.trim().toLowerCase();
            candidates.add(key);
            if (!String.isBlank(settings.Username_Suffix__c)) {
                candidates.add(key + settings.Username_Suffix__c);
            }
        }

        Set<String> taken = new Set<String>();
        if (candidates.isEmpty()) return taken;
        for (User u : [SELECT Username FROM User WHERE Username IN :candidates]) { taken.add(u.Username.toLowerCase());
        }
        return taken;
    }

    // The email itself, or email + suffix when the email is already a username.
    private static String usernameFor(String email, Product_User_Setting__mdt settings, Set<String> takenUsernames) {
        String username = email.trim().toLowerCase();
        if (takenUsernames.contains(username) && !String.isBlank(settings.Username_Suffix__c)) { username = username + settings.Username_Suffix__c;
        }
        takenUsernames.add(username);
        return username;
    }

    private static Boolean isDuplicateUsername(Database.SaveResult result) {
        for (Database.Error err : result.getErrors()) {
            if (err.getStatusCode() == StatusCode.DUPLICATE_USERNAME) { return true;
            }
        }
        return false;
    }

    private static String errorText(Database.SaveResult result) {
        String message = '';
        for (Database.Error err : result.getErrors()) {
            message += err.getStatusCode() + ': ' + err.getMessage() + ' ';
        }
        return message.trim();
    }

    // Gives each new user the TSign permission set. Returns errors by user Id.
    private static Map<Id, String> assignPermissionSet(List<User> users, Product_User_Setting__mdt settings) {
        Map<Id, String> errorByUserId = new Map<Id, String>();
        if (users.isEmpty() || String.isBlank(settings.Permission_Set_Name__c)) return errorByUserId;

        List<PermissionSet> permissionSets = [
            SELECT Id FROM PermissionSet WHERE Name = :settings.Permission_Set_Name__c LIMIT 1
        ];
        if (permissionSets.isEmpty()) { for (User u : users) { errorByUserId.put(u.Id, 'Permission set "' + settings.Permission_Set_Name__c + '" not found; user created without it.'); } return errorByUserId;
        }

        List<PermissionSetAssignment> assignments = new List<PermissionSetAssignment>();
        for (User u : users) {
            assignments.add(new PermissionSetAssignment(
                AssigneeId      = u.Id,
                PermissionSetId = permissionSets[0].Id
            ));
        }

        Database.SaveResult[] results = Database.insert(assignments, false);
        for (Integer i = 0; i < results.size(); i++) {
            if (!results[i].isSuccess()) {
                errorByUserId.put(assignments[i].AssigneeId,
                    'Permission set not assigned: ' + errorText(results[i]));
            }
        }
        return errorByUserId;
    }

    private static String getTimeZone(String countryCode, String countryName) {
        String country = !String.isBlank(countryCode) ? countryCode.trim().toUpperCase() : countryName;
        if (String.isBlank(country)) return 'Australia/Sydney';
        if (country == 'IN' || country.equalsIgnoreCase('India')) return 'Asia/Kolkata';
        if (country == 'AU' || country.equalsIgnoreCase('Australia')) return 'Australia/Sydney'; if (country == 'US' || country.equalsIgnoreCase('United States')) return 'America/New_York'; if (country == 'GB' || country.equalsIgnoreCase('United Kingdom')) return 'Europe/London'; return 'Australia/Sydney';
    }

    private static String getLocale(String countryCode, String countryName) {
        String country = !String.isBlank(countryCode) ? countryCode.trim().toUpperCase() : countryName;
        if (String.isBlank(country)) return 'en_AU';
        if (country == 'IN' || country.equalsIgnoreCase('India')) return 'en_IN';
        if (country == 'AU' || country.equalsIgnoreCase('Australia')) return 'en_AU'; if (country == 'GB' || country.equalsIgnoreCase('United Kingdom')) return 'en_GB'; return 'en_US';
    }

    private static String buildAlias(Contact con) {
        String source = !String.isBlank(con.FirstName) ? con.FirstName : con.LastName;
        if (String.isBlank(source)) source = 'tsign';
        source = source.replaceAll('[^a-zA-Z0-9]', '');
        if (source.length() > 8) source = source.substring(0, 8);
        return source.toLowerCase();
    }

    private static String buildCommunityNickname(Contact con) {
        String baseName = (con.FirstName == null ? '' : con.FirstName) + (con.LastName == null ? '' : con.LastName);
        baseName = baseName.replaceAll('[^a-zA-Z0-9]', '');
        if (String.isBlank(baseName)) baseName = 'tsignuser';
        String suffix = String.valueOf(con.Id).right(6);
        return baseName + suffix;
    }

    private static String getOrganisationName(Id organisationId) {
        List<TSign_Organisation__c> organisations = [SELECT Id, Name FROM TSign_Organisation__c WHERE Id = :organisationId LIMIT 1];
        return organisations.isEmpty() ? null : organisations[0].Name;
    }
        // Single helper method to build the email payload for the Queueable
    private Map<String, Object> buildEmailPayload(String subject, String bodyHtml) {
        Map<String, Object> emailPayload = new Map<String, Object>();
        
        // Add support team email
        String fromEmailLabel = Label.TSign_Support_From_Email; 
        String toEmailLabel = Label.TSign_Support_To_Email;
        
        emailPayload.put('fromEmail', fromEmailLabel);
        
        // Note: If your custom label contains multiple emails separated by commas (e.g., "a@a.com,b@b.com"), 
        // you will need to split them into a list. If it's just one email, the code below handles it.
        emailPayload.put('toEmail', new List<String>{ toEmailLabel });
        emailPayload.put('subject', subject);
        emailPayload.put('body', bodyHtml);
        
        // If you need attachments, you can add them here similarly to your reference code
        // List<String> attachments = new List<String>();
        // if (!attachments.isEmpty()) { emailPayload.put('attachment', attachments); }
        
        return emailPayload;
    }
}