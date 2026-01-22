public class StaffBatchUpdate implements Database.Batchable<SObject>, Database.Stateful {
    
    public Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator([
            SELECT Id, Name, Last_Name__c, Status__c, User_Role__c, User_Type__c, Email_Address__c 
            FROM Staff__c 
            WHERE LastModifiedDate = LAST_N_DAYS:1 AND Email_Address__c != NULL
        ]);
    }

    public void execute(Database.BatchableContext bc, List<Staff__c> staffList) {
        Map<String, Staff__c> staffByEmail = new Map<String, Staff__c>();
        Set<String> roleNames = new Set<String>();
        Set<String> emails = new Set<String>();

        // Store staff records by email
        for (Staff__c staff : staffList) {
            staffByEmail.put(staff.Email_Address__c, staff);
            emails.add(staff.Email_Address__c);
            if (staff.User_Role__c != null) {
                roleNames.add(staff.User_Role__c);
            }
        }

        // Fetch Users based on Email
        Map<String, User> usersToUpdate = new Map<String, User>();
        for (User user : [SELECT Id, Email, FirstName, LastName, IsActive, UserRoleId, User_Type__c 
                          FROM User WHERE Email IN :emails]) {
            Staff__c staff = staffByEmail.get(user.Email);

            if (staff != null) {
                if (staff.Name != null) user.FirstName = staff.Name;
                if (staff.Last_Name__c != null) user.LastName = staff.Last_Name__c;
                if (staff.Status__c != null) user.IsActive = staff.Status__c;
                if (staff.User_Type__c != null) user.User_Type__c = staff.User_Type__c;

                usersToUpdate.put(user.Id, user);
            }
        }

        // Fetch UserRole Ids
        Map<String, Id> userRoleMap = new Map<String, Id>();
        if (!roleNames.isEmpty()) {
            for (UserRole role : [SELECT Id, Name FROM UserRole WHERE Name IN :roleNames]) {
                userRoleMap.put(role.Name, role.Id);
            }
        }

        // Assign UserRoleId if User_Role__c is changed
        for (User user : usersToUpdate.values()) {
            Staff__c staff = staffByEmail.get(user.Email);
            if (staff != null && staff.User_Role__c != null) {
                user.UserRoleId = userRoleMap.get(staff.User_Role__c);
            }
        }

        if (!usersToUpdate.isEmpty()) {
            update usersToUpdate.values();
        }
    }

    public void finish(Database.BatchableContext bc) {
        System.debug('Batch Job Completed Successfully.');
    }
}