global class CreateUsersBatch implements Database.Batchable<sObject>, Database.AllowsCallouts {

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

            if (relatedStaff != null) {Id roleId = [SELECT Id FROM UserRole WHERE Name = :relatedStaff.User_Role__c LIMIT 1].Id;User portalUser;

                // Create user based on NDIS or ICT type
                if (relatedStaff.Type_of_User__c == 'NDIS User') {
                    portalUser = new User(
                        Username = contact.Email + '.NDIS',
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
                        CommunityNickname = contact.FirstName + ' ' + contact.LastName +'.NDIS',
                        Type_of_User__c = 'NDIS'
                    );
                } else if (relatedStaff.Type_of_User__c == 'ICT User') {
                    portalUser = new User(
                        Username = contact.Email + '.ICT',
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
                        CommunityNickname = contact.FirstName + ' ' + contact.LastName +'.ICT',
                        Type_of_User__c = 'ICT'
                    );
                }

                // Add the user to the list for insertion
                usersToInsert.add(portalUser);
                contactIdsToUpdate.add(contact.Id);
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
}