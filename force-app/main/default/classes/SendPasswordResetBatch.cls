global class SendPasswordResetBatch implements Database.Batchable<SObject>, Database.Stateful {

    global Database.QueryLocator start(Database.BatchableContext BC) {
        // Query Contacts where the checkbox is checked
        return Database.getQueryLocator([
            SELECT Id, Email, Send_Password_Reset__c 
            FROM Contact 
            WHERE Send_Password_Reset__c = TRUE AND Email != NULL
        ]);
    }

    global void execute(Database.BatchableContext BC, List<Contact> contactList) {
        Map<String, Contact> contactEmailMap = new Map<String, Contact>();

        // Create a map of Contact emails
        for (Contact con : contactList) {
            contactEmailMap.put(con.Email, con);
        }

        // Query Users where the email matches the Contact's email
        List<User> matchedUsers = [SELECT Id, Email FROM User WHERE Email IN :contactEmailMap.keySet()];

        List<Contact> contactsToUpdate = new List<Contact>();

        for (User user : matchedUsers) {
            try {
                System.resetPassword(user.Id, true); // Send password reset email

                // Reset the checkbox on the matching Contact
                Contact con = contactEmailMap.get(user.Email);
                if (con != null) {
                    con.Send_Password_Reset__c = false;
                    contactsToUpdate.add(con);
                }
            } catch (Exception e) {
                System.debug('Error resetting password for User: ' + user.Email + ' - ' + e.getMessage());
            }
        }

        // Update Contacts to reset checkbox
        if (!contactsToUpdate.isEmpty()) {
            update contactsToUpdate;
        }
    }

    global void finish(Database.BatchableContext BC) {
        System.debug('Batch Execution Completed');
    }
}