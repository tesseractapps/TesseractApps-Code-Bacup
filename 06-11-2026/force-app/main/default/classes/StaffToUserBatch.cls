public without sharing class StaffToUserBatch implements Database.Batchable<SObject>, Database.Stateful {
    
    // Query to fetch all Staff records
    public Database.QueryLocator start(Database.BatchableContext BC) {
        return Database.getQueryLocator('SELECT Id, Name,Last_Name__c,Status__c, Email_Address__c, User_Role__c, User_Type__c,User_Update__c FROM Staff__c WHERE Email_Address__c != NULL AND User_Update__c = true');
    }
    
    // Executes in chunks
    public void execute(Database.BatchableContext BC, List<SObject> scope) {
        // Collect Staff emails
        Set<String> staffEmails = new Set<String>();
        Set<String> roleNames = new Set<String>();
        Map<String, Staff__c> emailToStaffMap = new Map<String, Staff__c>();
        
        for (Staff__c staff : (List<Staff__c>) scope) {
            staffEmails.add(staff.Email_Address__c);
            emailToStaffMap.put(staff.Email_Address__c, staff);
            roleNames.add(staff.User_Role__c);            
        }
        
        // Fetch existing Users with matching emails
        Map<String, User> existingUsersMap = new Map<String, User>();
        List<User> usersToUpdate = new List<User>();
        List<String> userEmailToUpdate = new List<String>();
        
        for (User user : [
            SELECT Id, Email, LastName, Title, UserType 
            FROM User 
            WHERE Email IN :staffEmails
        ]) {
            existingUsersMap.put(user.Email, user);
        }
        
        // Query UserRole once
        Map<String, Id> userRoleMap = new Map<String, Id>();
        for (UserRole ur : [SELECT Id, Name FROM UserRole WHERE Name IN :roleNames]) {
            userRoleMap.put(ur.Name, ur.Id);
            system.debug('userRoleMap===>'+userRoleMap);
        }
        
        // Update matching Users with Staff info
        for (String email : staffEmails) {
            if (existingUsersMap.containsKey(email)) {
                User userToUpdate = existingUsersMap.get(email);
                Staff__c staff = emailToStaffMap.get(email);
                userToUpdate.FirstName = staff.Name;
                userToUpdate.LastName = staff.Last_Name__c;
                userToUpdate.User_Type__c = staff.User_Type__c;
                userToUpdate.IsActive = staff.Status__c;
                userToUpdate.UserRoleId = [SELECT Id, Name FROM UserRole WHERE Name =:staff.User_Role__c LIMIT 1].Id;
                usersToUpdate.add(userToUpdate);
                userEmailToUpdate.add(userToUpdate.Email);
            }
        }
        
        // Update User records
        if (!usersToUpdate.isEmpty()) {
            try {
                update usersToUpdate;
                System.enqueueJob(new UpdateStaffModulesQueueable(userEmailToUpdate));
            } catch (DmlException ex) {
                System.debug('Error updating Users: ' + ex.getMessage());
            }
        }
    }
    
    // Final logic after the batch finishes
    public void finish(Database.BatchableContext BC) {
        System.debug('Batch processing completed.');
    }
}