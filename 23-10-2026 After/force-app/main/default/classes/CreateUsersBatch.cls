global class CreateUsersBatch
    implements Database.Batchable<SObject>, Database.AllowsCallouts {

    /* =========================================================
       START
    ========================================================= */
    global Database.QueryLocator start(Database.BatchableContext bc) {

        return Database.getQueryLocator(
            'SELECT Id, FirstName, LastName, Email, Portal_User_Created__c, AccountId ' +
            'FROM Contact ' +
            'WHERE Portal_User_Created__c = true ' +
            'AND AccountId != null ' +
            'AND Email != null'
        );
    }

    /* =========================================================
       EXECUTE
    ========================================================= */
    global void execute(Database.BatchableContext bc, List<Contact> scope) {

        /* -----------------------------
           1️⃣ Collect Emails
        ----------------------------- */
        Set<String> emails = new Set<String>();
        for (Contact c : scope) {
            emails.add(c.Email);
        }

        /* -----------------------------
           2️⃣ Query Staff
        ----------------------------- */
        Map<String, Staff__c> staffByEmail = new Map<String, Staff__c>();

        for (Staff__c s : [
            SELECT Id, Email_Address__c, Organization_Full_Name__c,Participant_Type__c,
                   Type_of_User__c, TimeZoneSidKey__c, LocaleSidKey__c,
                   User_Role__c, EmailEncodingKey__c, Status__c,
                   User_Type__c, LanguageLocaleKey__c
            FROM Staff__c
            WHERE Email_Address__c IN :emails
        ]) {
            staffByEmail.put(s.Email_Address__c, s);
        }

        /* -----------------------------
           3️⃣ Roles
        ----------------------------- */
        Set<String> roleNames = new Set<String>();
        for (Staff__c s : staffByEmail.values()) {
            if (s.User_Role__c != null) {
                roleNames.add(s.User_Role__c);
            }
        }

        Map<String, Id> roleNameToId = new Map<String, Id>();
        if (!roleNames.isEmpty()) {
            for (UserRole ur : [
                SELECT Id, Name FROM UserRole WHERE Name IN :roleNames
            ]) {
                roleNameToId.put(ur.Name, ur.Id);
            }
        }

        /* -----------------------------
           4️⃣ Profile
        ----------------------------- */
        Id portalProfileId = [
            SELECT Id
            FROM Profile
            WHERE Name = 'Channel Account User1'
            LIMIT 1
        ].Id;

        /* -----------------------------
           5️⃣ Prepare Containers
        ----------------------------- */
        List<User> usersToInsert = new List<User>();
        Map<Id, String> staffErrors = new Map<Id, String>();
        Set<Id> contactIdsToUpdate = new Set<Id>();

        /* -----------------------------
           6️⃣ Build Users
        ----------------------------- */
        for (Contact c : scope) {

            Staff__c staff = staffByEmail.get(c.Email);
            if (staff == null) continue;

            Id roleId = roleNameToId.get(staff.User_Role__c);
            if (roleId == null) {
                staffErrors.put(
                    staff.Id,
                    'User role is not configured correctly.'
                );
                continue;
            }

            try {
                String nickname =
                    c.FirstName.replace(' ', '') + '_' +
                    DateTime.now().getTime();

                usersToInsert.add(new User(
                    Username             = c.Email,
                    Email                = c.Email,
                    FirstName            = c.FirstName,
                    LastName             = c.LastName,
                    Alias                = c.Email.substring(0, Math.min(8, c.Email.length())),
                    ProfileId            = portalProfileId,
                    TimeZoneSidKey       = staff.TimeZoneSidKey__c,
                    LocaleSidKey         = staff.LocaleSidKey__c,
                    EmailEncodingKey     = staff.EmailEncodingKey__c,
                    LanguageLocaleKey    = staff.LanguageLocaleKey__c,
                    ContactId            = c.Id,
                    Organization_Name__c = staff.Organization_Full_Name__c,
                    UserRoleId           = roleId,
                    IsActive             = staff.Status__c,
                    User_Type__c         = staff.User_Type__c,
                    CommunityNickname    = nickname,
                    Participant_Type__c  = staff.Participant_Type__c,
                    Type_of_User__c      =
                    staff.Type_of_User__c == 'NDIS User' ? 'NDIS' : 'ICT'
                ));

            } catch (Exception ex) {
                staffErrors.put(
                    staff.Id,
                    'User build failed due to invalid configuration.'
                );
            }
        }

        /* -----------------------------
           7️⃣ Insert Users
        ----------------------------- */
        if (!usersToInsert.isEmpty()) {

            Database.SaveResult[] results =
                Database.insert(usersToInsert, false);

            for (Integer i = 0; i < results.size(); i++) {

                User u = usersToInsert[i];
                Staff__c staff = staffByEmail.get(u.Email);

                if (!results[i].isSuccess()) {

                    Database.Error err = results[i].getErrors()[0];
                    staffErrors.put(
                        staff.Id,
                        getUserFriendlyError(err)
                    );

                } else {
                    if (u.ContactId != null) {
                        contactIdsToUpdate.add(u.ContactId);
                    }
                }
            }
        }

        /* -----------------------------
           8️⃣ Queueable Calls (SAFE)
        ----------------------------- */

        // 🔹 Update Contacts
        if (!contactIdsToUpdate.isEmpty()) {
            System.enqueueJob(
                new UpdateContactJob(new List<Id>(contactIdsToUpdate))
            );
        }

        // 🔹 Update Staff Errors (Mixed DML safe)
        if (!staffErrors.isEmpty()) {
            System.enqueueJob(
                new UpdateStaffErrorJob(staffErrors)
            );
        }
    }

    /* =========================================================
       ERROR MAPPER
    ========================================================= */
    private static String getUserFriendlyError(Database.Error err) {

        if (err.getStatusCode() == StatusCode.LICENSE_LIMIT_EXCEEDED) {
            return 'No Channel Account User licenses are available.';
        }
        if (err.getStatusCode() == StatusCode.DUPLICATE_USERNAME) {
            return 'A user already exists with this email address.';
        }
        if (err.getMessage().contains('UserRole')) {
            return 'User role configuration is invalid.';
        }
        if (err.getMessage().contains('Profile')) {
            return 'User profile configuration issue.';
        }
        return 'User creation failed due to system configuration.';
    }

    /* =========================================================
       FINISH
    ========================================================= */
    global void finish(Database.BatchableContext bc) {
        System.debug('🏁 CreateUsersBatch FINISHED');
    }
}