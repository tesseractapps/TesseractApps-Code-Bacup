global class SendPasswordResetBatch implements Database.Batchable<SObject>, Database.Stateful {

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
        List<User> matchedUsers = [SELECT Id, Email, IsActive FROM User WHERE Email IN :staffEmailMap.keySet() AND IsActive = true];

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
                    staffIdsToUpdate.add(staff.Id);}
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
}