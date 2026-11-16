global class TSignCreateUsersBatchfromProtal
    implements Database.Batchable<SObject>, Database.AllowsCallouts, Database.Stateful {

    // Saved in finish(): a User with a role and normal records cannot be
    // saved in the same transaction (mixed DML), so errors wait until then.
    private List<TSign_Error_handling__c> errorsToLog = new List<TSign_Error_handling__c>();

    global TSignCreateUsersBatchfromProtal() {
    }

    // =========================================================
    // START
    // =========================================================
    global Database.QueryLocator start(Database.BatchableContext context) {
        return Database.getQueryLocator([
            SELECT Id, First_Name__c, Last_Name__c, Email__c,
                   TSign_Organisation__c, User_Role__c, User_Type__c,
                   Address__CountryCode__s
            FROM TSign_Staff__c
            WHERE Create_User__c = true
              AND Email__c != null
        ]);
    }

    // =========================================================
    // EXECUTE
    // =========================================================
    global void execute(Database.BatchableContext context, List<SObject> scope) {
        if (scope == null || scope.isEmpty()) return;

        List<TSign_Staff__c> staffList = new List<TSign_Staff__c>();
        Set<String> emails = new Set<String>();
        Set<String> roleNames = new Set<String>();
        Map<String, String> errorByEmail = new Map<String, String>();
        Map<String, Id> staffIdByEmail = new Map<String, Id>();

        // 1. Collect staff, emails, role names
        for (SObject record : scope) {
            TSign_Staff__c staff = (TSign_Staff__c) record;
            staffList.add(staff);
            if (!String.isBlank(staff.Email__c)) {
                String key = staff.Email__c.trim().toLowerCase();
                emails.add(key);
                staffIdByEmail.put(key, staff.Id);
            }
            if (!String.isBlank(staff.User_Role__c)) {
                roleNames.add(staff.User_Role__c.trim());
            }
        }

        if (staffList.isEmpty() || emails.isEmpty()) return;

        Product_User_Setting__mdt settings = getTSignSettings();

        // 2. Query roles — if multiple share a name, take the first one found
        Map<String, Id> roleNameToId = new Map<String, Id>();
        if (!roleNames.isEmpty()) {
            for (UserRole ur : [
                SELECT Id, Name, ParentRoleId
                FROM UserRole
                WHERE Name IN :roleNames
            ]) {
                String roleKey = ur.Name.trim().toLowerCase();
                if (!roleNameToId.containsKey(roleKey)) {
                    roleNameToId.put(roleKey, ur.Id);
                }
            }
        }

        // 3. Query portal profile
        Profile portalProfile = null;
        String profileError;
        try {
            List<Profile> profiles = [
                SELECT Id, Name
                FROM Profile
                WHERE Name = :settings.Profile_Name__c
                LIMIT 1
            ];
            if (profiles.isEmpty()) { profileError = 'Profile "' + settings.Profile_Name__c + '" not found.';
            } else {
                portalProfile = profiles[0]; } } catch (Exception e) { profileError = 'Unable to query portal profile: ' + e.getMessage();
        }

        // 4. Query Contacts by email. Contacts that already have a login (for example
        // an NDIS user with the same email) are skipped. If more than one is left,
        // the one under the TSign partner account is used.
        Set<Id> tsignAccountIds = getTSignAccountIds(settings);
        List<Contact> emailContacts = [
            SELECT Id, FirstName, LastName, Email, AccountId
            FROM Contact
            WHERE Email IN :emails
        ];
        Set<Id> contactsWithUser = new Set<Id>();
        for (User u : [SELECT ContactId FROM User WHERE ContactId IN :emailContacts]) { contactsWithUser.add(u.ContactId);
        }

        Map<String, List<Contact>> freeContactsByEmail = new Map<String, List<Contact>>();
        for (Contact con : emailContacts) {
            if (String.isBlank(con.Email) || contactsWithUser.contains(con.Id)) continue;
            String emailKey = con.Email.trim().toLowerCase();
            if (!freeContactsByEmail.containsKey(emailKey)) {
                freeContactsByEmail.put(emailKey, new List<Contact>());
            }
            freeContactsByEmail.get(emailKey).add(con);
        }

        Map<String, Contact> contactByEmail = new Map<String, Contact>();
        for (String emailKey : freeContactsByEmail.keySet()) {
            List<Contact> freeContacts = freeContactsByEmail.get(emailKey);
            List<Contact> tsignContacts = new List<Contact>();
            for (Contact con : freeContacts) {
                if (tsignAccountIds.contains(con.AccountId)) {
                    tsignContacts.add(con);
                }
            }
            if (tsignContacts.size() == 1) {
                contactByEmail.put(emailKey, tsignContacts[0]);
            } else if (tsignContacts.isEmpty() && freeContacts.size() == 1) { contactByEmail.put(emailKey, freeContacts[0]);
            } else {
                errorByEmail.put(emailKey,
                    'Multiple Contacts without a user found with this email.');
            }
        }

        // 5. Usernames already taken (email, or email + suffix)
        Set<String> takenUsernames = findTakenUsernames(emails, settings);

        // 6. Emails that already have a TSign user. An NDIS user with the same
        // email is fine: the TSign user then gets the suffixed username.
        Set<String> existingTSignEmails = new Set<String>();
        for (User u : [SELECT Email FROM User WHERE Email IN :emails AND TSign_Org_Id__c != null]) { if (!String.isBlank(u.Email)) { existingTSignEmails.add(u.Email.trim().toLowerCase());
            }
        }

        // 7. Build User records
        List<User> usersToInsert = new List<User>();
        List<String> userEmailKeys = new List<String>();

        for (TSign_Staff__c staff : staffList) {
            if (String.isBlank(staff.Email__c)) continue;
            String emailKey = staff.Email__c.trim().toLowerCase();

            try {
                if (errorByEmail.containsKey(emailKey)) continue;

                Contact con = contactByEmail.get(emailKey);
                if (con == null) {
                    throw new CustomException(
                        'No Contact without a user found for email: ' + staff.Email__c);
                }

                if (portalProfile == null) { throw new CustomException( profileError == null ? 'Portal profile not found.' : profileError);
                }

                if (existingTSignEmails.contains(emailKey)) { throw new CustomException( 'A TSign user already exists with Email: ' + staff.Email__c);
                }

                Id roleId;
                if (!String.isBlank(staff.User_Role__c)) {
                    String roleKey = staff.User_Role__c.trim().toLowerCase();
                    roleId = roleNameToId.get(roleKey);
                    // The partner roles of a new partner account only exist after its
                    // first user is created. Without a role Salesforce gives the user
                    // the account's default partner role, so creation still succeeds.
                    if (roleId == null) {
                        logError(emailKey,
                            'UserRole not found: ' + staff.User_Role__c + '; the user gets the default partner role.');
                    }
                } else {
                    throw new CustomException(
                        'User_Role__c is blank for ' + staff.Email__c);
                }

                User u = new User();
                u.Username = usernameFor(con.Email, settings, takenUsernames);
                u.Email = con.Email.trim();
                u.FirstName = con.FirstName;
                u.LastName = con.LastName;
                u.Alias = buildAlias(con);
                u.CommunityNickname = buildCommunityNickname(con);
                u.ProfileId = portalProfile.Id;
                u.ContactId = con.Id;

                String countryCode = staff.Address__CountryCode__s;
                u.TimeZoneSidKey = getTimeZone(countryCode, null);
                u.LocaleSidKey = getLocale(countryCode, null);
                u.EmailEncodingKey = 'UTF-8';
                u.LanguageLocaleKey = 'en_US';
                u.TSign_Org_Id__c = staff.TSign_Organisation__c;
                u.User_Type__c = staff.User_Type__c;
                if (roleId != null) {
                    u.UserRoleId = roleId;
                }
                u.IsActive = true;

                usersToInsert.add(u);
                userEmailKeys.add(emailKey);

                existingTSignEmails.add(emailKey);

            } catch (Exception e) {
                errorByEmail.put(emailKey, e.getMessage());
                System.debug(LoggingLevel.ERROR,
                    'User preparation failed for ' + emailKey + ': ' + e.getMessage());
            }
        }

        // 8. Insert Users with partial success
        Set<String> successfullyCreatedEmails = new Set<String>();
        List<User> createdUsers = new List<User>();
        List<User> retryUsers = new List<User>();
        List<String> retryEmailKeys = new List<String>();
        if (!usersToInsert.isEmpty()) {
            Database.SaveResult[] results = Database.insert(usersToInsert, false);
            for (Integer i = 0; i < results.size(); i++) {
                String emailKey = userEmailKeys[i];
                User currentUser = usersToInsert[i];
                if (results[i].isSuccess()) {
                    successfullyCreatedEmails.add(emailKey);
                    createdUsers.add(currentUser);
                    errorByEmail.remove(emailKey);
                } else if (isDuplicateUsername(results[i]) && !String.isBlank(settings.Username_Suffix__c) && !currentUser.Username.endsWith(settings.Username_Suffix__c)) { User retryUser = currentUser.clone(false, true); retryUser.Username = currentUser.Username + settings.Username_Suffix__c; retryUsers.add(retryUser); retryEmailKeys.add(emailKey);
                } else {
                    String msg = errorText(results[i]);
                    errorByEmail.put(emailKey, msg);
                    System.debug(LoggingLevel.ERROR,
                        'User insert failed for ' + emailKey + ': ' + msg);
                }
            }
        }

        if (!retryUsers.isEmpty()) { Database.SaveResult[] retryResults = Database.insert(retryUsers, false); for (Integer i = 0; i < retryResults.size(); i++) { String emailKey = retryEmailKeys[i]; if (retryResults[i].isSuccess()) { successfullyCreatedEmails.add(emailKey); createdUsers.add(retryUsers[i]); errorByEmail.remove(emailKey); } else { errorByEmail.put(emailKey, errorText(retryResults[i]));
                }
            }
        }

        // Give new users the TSign permission set
        Map<Id, String> permissionErrors = assignPermissionSet(createdUsers, settings);
        for (User u : createdUsers) {
            if (permissionErrors.containsKey(u.Id)) {
                logError(u.Email.toLowerCase(), permissionErrors.get(u.Id));
            }
        }

        // 9. Clear Create_User__c only for successfully created Users
        List<TSign_Staff__c> staffToClear = new List<TSign_Staff__c>();
        for (TSign_Staff__c staff : staffList) {
            if (String.isBlank(staff.Email__c)) continue;
            if (successfullyCreatedEmails.contains(staff.Email__c.trim().toLowerCase())) {
                staffToClear.add(new TSign_Staff__c(Id = staff.Id, Create_User__c = false));
            }
        }
        if (!staffToClear.isEmpty()) {
            Database.update(staffToClear, false);
        }

        // 10. Enqueue queueable to reset Update_User__c on successful staff
        if (!successfullyCreatedEmails.isEmpty()) {
            List<Id> staffIdsToReset = new List<Id>();
            for (String emailKey : successfullyCreatedEmails) {
                Id staffId = staffIdByEmail.get(emailKey);
                if (staffId != null) {
                    staffIdsToReset.add(staffId);
                }
            }
            if (!staffIdsToReset.isEmpty()) {
                System.enqueueJob(new TSignStaffResetFlagQueueable(staffIdsToReset));
            }
        }

        // 11. Log failed emails. Nothing is deleted: Contacts are looked up by
        // email, so deleting by email could remove another product's records.
        // Create_User__c stays true, so the next run retries once the cause is fixed.
        for (String emailKey : errorByEmail.keySet()) {
            System.debug(LoggingLevel.ERROR,
                '[TSignCreateUsersBatchfromProtal] User not created. Email=' + emailKey +
                ', Reason=' + errorByEmail.get(emailKey));
            logError(emailKey, errorByEmail.get(emailKey));
        }
    }

    private void logError(String email, String message) {
        errorsToLog.add(new TSign_Error_handling__c(
            Email__c         = email,
            Error_Message__c = message
        ));
    }

    // =========================================================
    // FINISH
    // =========================================================
    global void finish(Database.BatchableContext context) {
        if (!errorsToLog.isEmpty()) {
            Database.insert(errorsToLog, false);
        }
        System.debug(LoggingLevel.INFO,
            'TSignCreateUsersBatchfromProtal finished. Job ID: ' + context.getJobId());
    }

    // =========================================================
    // CUSTOM EXCEPTION
    // =========================================================
    public class CustomException extends Exception {}

    // =========================================================
    // TSIGN SETTINGS HELPERS
    // =========================================================

    // Profile, partner account, permission set and username suffix for TSign users
    // (Setup → Custom Metadata Types → Product User Setting → record TSign).
    private static Product_User_Setting__mdt getTSignSettings() {
        Product_User_Setting__mdt settings = Product_User_Setting__mdt.getInstance('TSign');
        if (settings == null) { throw new CustomException('Product_User_Setting__mdt record "TSign" was not found.');
        }
        return settings;
    }

    private static Set<Id> getTSignAccountIds(Product_User_Setting__mdt settings) {
        Set<Id> accountIds = new Set<Id>();
        for (Account acc : [SELECT Id FROM Account WHERE Name = :settings.Partner_Account_Name__c]) {
            accountIds.add(acc.Id);
        }
        return accountIds;
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

    // =========================================================
    // TIME ZONE HELPER
    // =========================================================
    public static String getTimeZone(String countryCode, String countryName) {
        String country = !String.isBlank(countryCode)
            ? countryCode.trim().toUpperCase()
            : countryName;

        if (String.isBlank(country)) return 'Australia/Sydney';
        if (country == 'IN' || country.equalsIgnoreCase('India')) return 'Asia/Kolkata';
        if (country == 'AU' || country.equalsIgnoreCase('Australia')) return 'Australia/Sydney';
        if (country == 'US' || country.equalsIgnoreCase('United States')) return 'America/New_York';
        if (country == 'GB' || country.equalsIgnoreCase('United Kingdom')) return 'Europe/London'; return 'Australia/Sydney';
    }

    // =========================================================
    // LOCALE HELPER
    // =========================================================
    public static String getLocale(String countryCode, String countryName) {
        String country = !String.isBlank(countryCode)
            ? countryCode.trim().toUpperCase()
            : countryName;

        if (String.isBlank(country)) return 'en_AU';
        if (country == 'IN' || country.equalsIgnoreCase('India')) return 'en_IN';
        if (country == 'AU' || country.equalsIgnoreCase('Australia')) return 'en_AU';
        if (country == 'GB' || country.equalsIgnoreCase('United Kingdom')) return 'en_GB'; return 'en_US';
    }

    // =========================================================
    // ALIAS HELPER
    // =========================================================
    public static String buildAlias(Contact con) {
        String source = !String.isBlank(con.FirstName)
            ? con.FirstName
            : con.LastName;

        if (String.isBlank(source)) source = 'tsign';

        source = source.replaceAll('[^a-zA-Z0-9]', '');
        if (source.length() > 8) source = source.substring(0, 8);
        return source.toLowerCase();
    }

    // =========================================================
    // COMMUNITY NICKNAME HELPER
    // =========================================================
    public static String buildCommunityNickname(Contact con) {
        String baseName =
            (con.FirstName == null ? '' : con.FirstName) +
            (con.LastName == null ? '' : con.LastName);

        baseName = baseName.replaceAll('[^a-zA-Z0-9]', '');
        if (String.isBlank(baseName)) baseName = 'tsignuser';

        return baseName + String.valueOf(con.Id).right(6);
    }
}