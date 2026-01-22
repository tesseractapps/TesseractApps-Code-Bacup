/*global class CreateUsersBatch implements Database.Batchable<sObject>, Database.AllowsCallouts {
    
    public Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator(
            'SELECT Id, FirstName, LastName, Email, Portal_User_Created__c, AccountId FROM Contact WHERE Portal_User_Created__c = true AND AccountId != null AND Email != null'
        );
    }
    
    public void execute(Database.BatchableContext bc, List<Contact> scope) {
        Set<String> contactEmails = new Set<String>();
        for (Contact contact : scope) {
            contactEmails.add(contact.Email);
        }
        
        // Query related Staff__c records
        Map<String, Staff__c> staffByEmail = new Map<String, Staff__c>();
        for (Staff__c staff : [
            SELECT Id, Email_Address__c, Organization_Full_Name__c, Type_of_User__c, TimeZoneSidKey__c, LocaleSidKey__c, 
            User_Role__c, EmailEncodingKey__c, Status__c, User_Type__c, LanguageLocaleKey__c
            FROM Staff__c
            WHERE Email_Address__c IN :contactEmails
        ]) {
            staffByEmail.put(staff.Email_Address__c, staff);
        }
        
        // Retrieve Profile ID for portal users
        Id portalProfileId = [SELECT Id FROM Profile WHERE Name = 'Channel Account User1' LIMIT 1].Id;
        
        List<User> usersToInsert = new List<User>();
        List<Id> contactIdsToUpdate = new List<Id>();
        
        // Iterate over each contact and create user based on Staff__c data
        for (Contact contact : scope) {
            Staff__c relatedStaff = staffByEmail.get(contact.Email);
            System.debug('relatedStaff >>'+ relatedStaff);
            if (relatedStaff != null) {
                System.debug('relatedStaff.User_Role__c >>'+ relatedStaff.User_Role__c);
                Id roleId = [SELECT Id FROM UserRole WHERE Name = :relatedStaff.User_Role__c LIMIT 1].Id;
                System.debug('roleId >>'+ roleId);
                
                User portalUser = null;

                String baseNickname = (contact.FirstName + ' ' + contact.LastName).trim();
                String uniqueSuffix = contact.Email != null ? contact.Email.substringBefore('@') : String.valueOf(Math.abs(Crypto.getRandomInteger()));
                String communityNickname = baseNickname + '_' + uniqueSuffix;
                
                // Create user based on NDIS or ICT type
                if (relatedStaff.Type_of_User__c == 'NDIS User') {
                    portalUser = new User(
                        Username = contact.Email,
                        Email = contact.Email,
                        LastName = contact.LastName,
                        FirstName = contact.FirstName,
                        Alias = contact.Email.substring(0, Math.min(contact.Email.length(), 8)),
                        ProfileId = portalProfileId,
                        TimeZoneSidKey = relatedStaff.TimeZoneSidKey__c,
                        LocaleSidKey = relatedStaff.LocaleSidKey__c,
                        EmailEncodingKey = relatedStaff.EmailEncodingKey__c,
                        LanguageLocaleKey = relatedStaff.LanguageLocaleKey__c,
                        ContactId = contact.Id,
                        Organization_Name__c = relatedStaff.Organization_Full_Name__c,
                        UserRoleId = roleId,
                        IsActive = relatedStaff.Status__c,
                        User_Type__c = relatedStaff.User_Type__c,
                        CommunityNickname = communityNickname,
                        Type_of_User__c = 'NDIS'
                    );
                } else if (relatedStaff.Type_of_User__c == 'ICT User') {
                    portalUser = new User(
                        Username = contact.Email,
                        Email = contact.Email,
                        LastName = contact.LastName,
                        FirstName = contact.FirstName,
                        Alias = contact.Email.substring(0, Math.min(contact.Email.length(), 8)),
                        ProfileId = portalProfileId,
                        TimeZoneSidKey = relatedStaff.TimeZoneSidKey__c,
                        LocaleSidKey = relatedStaff.LocaleSidKey__c,
                        EmailEncodingKey = relatedStaff.EmailEncodingKey__c,
                        LanguageLocaleKey = relatedStaff.LanguageLocaleKey__c,
                        ContactId = contact.Id,
                        Organization_Name__c = relatedStaff.Organization_Full_Name__c,
                        UserRoleId = roleId,
                        IsActive = relatedStaff.Status__c,
                        User_Type__c = relatedStaff.User_Type__c,
                        CommunityNickname = communityNickname,
                        Type_of_User__c = 'ICT'
                    );
                }
                
                // If portalUser is created, add to list
                if (portalUser != null) {
                    usersToInsert.add(portalUser);
                    contactIdsToUpdate.add(contact.Id);
                } else {
                    System.debug('Failed to create user for contact: ' + contact.Id);
                }
            } else {
                System.debug('No related staff found for contact: ' + contact.Email);
            }
        }
        
        // Perform bulk DML on User (Setup Object)
        if (!usersToInsert.isEmpty()) {
            try {
                insert usersToInsert;
                System.enqueueJob(new UpdateContactJob(contactIdsToUpdate));  // Queueable call to update contact records
            } catch (DmlException e) {
                System.debug('Error inserting Portal Users: ' + e.getMessage());
            }
        }
    }
    
    
    public void finish(Database.BatchableContext bc) {
        System.debug('Batch processing completed.');
    }
}*/


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
            SELECT Id, Email_Address__c, Organization_Full_Name__c,
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