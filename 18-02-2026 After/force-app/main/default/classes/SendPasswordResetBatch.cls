/*global class SendPasswordResetBatch implements Database.Batchable<SObject>, Database.Stateful {

    global Database.QueryLocator start(Database.BatchableContext BC) {
        // Query Contacts where the checkbox is checked
        return Database.getQueryLocator([
            SELECT Id, Email_Address__c, Send_Password_Reset__c 
            FROM Staff__c 
            WHERE Send_Password_Reset__c = TRUE AND Email_Address__c != NULL
        ]);
    }

    global void execute(Database.BatchableContext BC, List<staff__C> staffList) {
        Map<String, Staff__c> staffEmailMap = new Map<String, Staff__c>();

        // Create a map of Contact emails
        for (Staff__c staff : staffList) {
            staffEmailMap.put(staff.Email_Address__c, staff);
        }

        // Query Users where the email matches the Contact's email
        List<User> matchedUsers = [SELECT Id, Email FROM User WHERE Email IN :staffEmailMap.keySet()];

        List<Staff__c> staffToUpdate = new List<Staff__c>();
        Set<Id> staffIdsToUpdate = new Set<Id>();

        for (User user : matchedUsers) {
            try {
                // Reset the checkbox on the matching Contact
                Staff__c staff = staffEmailMap.get(user.Email);
                if (staff != null && !staffIdsToUpdate.contains(staff.Id)) {
                    System.resetPassword(user.Id, true); // Send password reset email
                    staff.Send_Password_Reset__c = false;
                    staffToUpdate.add(staff);
                    staffIdsToUpdate.add(staff.Id);
                }
            } catch (Exception e) {
                System.debug('Error resetting password for User: ' + user.Email + ' - ' + e.getMessage());
            }
        }

        // Update Contacts to reset checkbox
        if (!staffToUpdate.isEmpty()) {
            update staffToUpdate;
        }
    }

    global void finish(Database.BatchableContext BC) {
        System.debug('Batch Execution Completed');
    }
}*/

global class SendPasswordResetBatch implements Database.Batchable<SObject>, Database.Stateful {

    global Database.QueryLocator start(Database.BatchableContext BC) {
        System.debug('▶ START method invoked - Preparing query for Staff__c records.');

        // This query runs in SYSTEM CONTEXT - bypasses all permissions
        Database.QueryLocator qLocator = Database.getQueryLocator([
            SELECT Id, Email_Address__c, Send_Password_Reset__c 
            FROM Staff__c 
            WHERE Send_Password_Reset__c = TRUE AND Email_Address__c != NULL
        ]);

        System.debug('✅ QueryLocator created. Will fetch Staff__c records with Send_Password_Reset__c = TRUE and non-null emails.');
        return qLocator;
    }

    global void execute(Database.BatchableContext BC, List<Staff__c> staffList) {
        System.debug('▶ EXECUTE method invoked for batch. Number of Staff__c records received: ' + staffList.size());
        
        Map<String, Staff__c> staffEmailMap = new Map<String, Staff__c>();
        List<String> staffEmails = new List<String>();

        // Collect staff emails
        for (Staff__c staff : staffList) {
            String emailLower = staff.Email_Address__c != null ? staff.Email_Address__c.toLowerCase() : null;
            System.debug('📌 Processing Staff__c record - Id: ' + staff.Id + ', Email: ' + staff.Email_Address__c + ', Send_Password_Reset__c: ' + staff.Send_Password_Reset__c);

            if (emailLower != null) {
                staffEmailMap.put(emailLower, staff);
                staffEmails.add(emailLower);
            }
        }
        System.debug('✅ Collected ' + staffEmails.size() + ' staff emails for lookup. Emails: ' + staffEmails);

        // Query Users in SYSTEM CONTEXT - can see all users regardless of permissions
        List<User> matchedUsers = [
            SELECT Id, Email, IsActive 
            FROM User 
            WHERE Email IN :staffEmails AND IsActive = true
        ];
        System.debug('✅ Matched Users retrieved: ' + matchedUsers.size());
        for (User u : matchedUsers) {
            System.debug('📌 Matched User - Id: ' + u.Id + ', Email: ' + u.Email + ', Active: ' + u.IsActive);
        }

        List<Staff__c> staffToUpdate = new List<Staff__c>();
        Set<Id> processedStaffIds = new Set<Id>();

        for (User user : matchedUsers) {
            try {
                String userEmail = user.Email != null ? user.Email.toLowerCase() : null;
                Staff__c staff = staffEmailMap.get(userEmail);

                if (staff != null && !processedStaffIds.contains(staff.Id)) {
                    System.debug('▶ Attempting password reset for User Id: ' + user.Id + ', Email: ' + user.Email);

                    // SYSTEM CONTEXT: Can reset password for any user
                    System.resetPassword(user.Id, true); // Send password reset email
                    System.debug('✅ Password reset successfully triggered for User Email: ' + user.Email);

                    staff.Send_Password_Reset__c = false;
                    staffToUpdate.add(staff);
                    processedStaffIds.add(staff.Id);

                    System.debug('📌 Staff record marked for update - Id: ' + staff.Id + ', Email: ' + staff.Email_Address__c);
                } else {
                    System.debug('⚠ No matching Staff found for User Email: ' + user.Email + ' OR Staff already processed.');
                }
            } catch (Exception e) {
                System.debug('❌ ERROR resetting password for User Id: ' + user.Id + ', Email: ' + user.Email + '. Exception: ' + e.getMessage() + ' - StackTrace: ' + e.getStackTraceString());
            }
        }

        // Update Staff records in SYSTEM CONTEXT - bypasses all permissions
        if (!staffToUpdate.isEmpty()) {
            System.debug('▶ Updating ' + staffToUpdate.size() + ' Staff__c records to clear Send_Password_Reset__c flag.');
            try {
                update staffToUpdate;
                System.debug('✅ Successfully updated Staff__c records: ' + staffToUpdate);
            } catch (Exception e) {
                System.debug('❌ ERROR updating Staff__c records. Exception: ' + e.getMessage() + ' - StackTrace: ' + e.getStackTraceString());
            }
        } else {
            System.debug('ℹ No Staff__c records to update in this batch execution.');
        }
    }

    global void finish(Database.BatchableContext BC) {
        System.debug('▶ FINISH method invoked - SendPasswordResetBatch completed execution.');
        // Optional: You could add an AsyncApexJob query here for logging/notifications
        System.debug('✅ SendPasswordResetBatch finished successfully in system context.');
    }
}