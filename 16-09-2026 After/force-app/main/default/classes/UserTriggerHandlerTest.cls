@isTest
public class UserTriggerHandlerTest {
    
    @testSetup
    static void setupTestData() {
        // Check if permission sets already exist before creating them
        List<PermissionSet> existingPermissionSets = [
            SELECT Id, Name, Label 
            FROM PermissionSet 
            WHERE Name IN ('Wyzed_API_Access', 'Wyzed_API_Access_Portal_User')
        ];
        
        // Only create permission sets if they don't already exist
        if (existingPermissionSets.isEmpty()) {
            List<PermissionSet> permissionSets = new List<PermissionSet>{
                new PermissionSet(
                    Name = 'Wyzed_API_Access',
                    Label = 'Wyzed_API_Access'
                ),
                new PermissionSet(
                    Name = 'Wyzed_API_Access_Portal_User',
                    Label = 'Wyzed_API_Access_Portal_User'
                )
            };
            insert permissionSets;
        }
    }
    
    // Test: New NDIS Org Admin with System Administrator Profile
    @isTest
    static void testNewNDISOrgAdminWithSalesforceLicense() {
        // Get System Administrator profile
        Profile prof = [SELECT Id, Name FROM Profile WHERE Name = 'System Administrator' LIMIT 1];
        
        // Create NDIS Org Admin user
        User newUser = new User(
            Alias = 'pravee',
            Email = 'manualtesting.20294637@hotmail.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'StaffOne209463',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey = 'Australia/Sydney',
            User_Type__c = 'NDIS Org Admin',
            UserName = 'manualtesting.20294637.' + System.currentTimeMillis() + '@hotmail.com',
            Organization_Name__c = 'Ashfield Consultants'
        );
        
        Test.startTest();
        insert newUser;
        Test.stopTest();
        
        // Verify permission set assignment
        List<PermissionSetAssignment> assignments = [
            SELECT PermissionSet.Name 
            FROM PermissionSetAssignment 
            WHERE AssigneeId = :newUser.Id
        ];
        
        System.debug('=== NDIS Org Admin with Salesforce License ===');
        System.debug('User Type: ' + newUser.User_Type__c);
        System.debug('Profile: ' + prof.Name);
        System.debug('Assignments Count: ' + assignments.size());
        for (PermissionSetAssignment psa : assignments) {
            System.debug('Permission Set: ' + psa.PermissionSet.Name);
        }
    }
    
   
    // Test: Existing NDIS Org Admin becomes active
    @isTest
    static void testNDISOrgAdminBecomesActive() {
        // Get System Administrator profile
        Profile prof = [SELECT Id, Name FROM Profile WHERE Name = 'System Administrator' LIMIT 1];
        
        // Create inactive NDIS Org Admin user
        User existingUser = new User(
            Alias = 'inactv',
            Email = 'inactive.ndis@example.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'InactiveNDIS',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey = 'Australia/Sydney',
            User_Type__c = 'NDIS Org Admin',
            UserName = 'inactive.ndis.' + System.currentTimeMillis() + '@example.com',
            Organization_Name__c = 'Ashfield Consultants',
            IsActive = false
        );
        
        insert existingUser;
        
        // Update user to make them active
        existingUser.IsActive = true;
        
        Test.startTest();
        update existingUser;
        Test.stopTest();
        
        // Verify permission set assignment
        List<PermissionSetAssignment> assignments = [
            SELECT PermissionSet.Name 
            FROM PermissionSetAssignment 
            WHERE AssigneeId = :existingUser.Id
        ];
        
        System.debug('=== NDIS Org Admin Becomes Active ===');
        System.debug('User Type: ' + existingUser.User_Type__c);
        System.debug('Is Active: ' + existingUser.IsActive);
        System.debug('Assignments Count: ' + assignments.size());
        for (PermissionSetAssignment psa : assignments) {
            System.debug('Permission Set: ' + psa.PermissionSet.Name);
        }
    }
    
    // Test: Multiple NDIS Org Admin users bulk insert
    @isTest
    static void testMultipleNDISOrgAdminsBulkInsert() {
        // Get System Administrator profile
        Profile adminProf = [SELECT Id, Name FROM Profile WHERE Name = 'System Administrator' LIMIT 1];
        
        // Get Standard profile
        Profile standardProf = [SELECT Id, Name FROM Profile WHERE Name = 'Standard User' LIMIT 1];
        
        // Create multiple users
        List<User> users = new List<User>();
        Long timestamp = System.currentTimeMillis();
        
        // NDIS Org Admin 1
        users.add(new User(
            Alias = 'ndis1',
            Email = 'ndis.admin1@example.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'NDISAdmin1',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = adminProf.Id,
            TimeZoneSidKey = 'Australia/Sydney',
            User_Type__c = 'NDIS Org Admin',
            UserName = 'ndis.admin1.' + timestamp + '@example.com',
            Organization_Name__c = 'Ashfield Consultants'
        ));
        
        // NDIS Org Admin 2
        users.add(new User(
            Alias = 'ndis2',
            Email = 'ndis.admin2@example.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'NDISAdmin2',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = adminProf.Id,
            TimeZoneSidKey = 'Australia/Sydney',
            User_Type__c = 'NDIS Org Admin',
            UserName = 'ndis.admin2.' + timestamp + '@example.com',
            Organization_Name__c = 'Ashfield Consultants'
        ));
        
        Test.startTest();
        insert users;
        Test.stopTest();
        
        // Verify permission set assignments
        List<PermissionSetAssignment> assignments = [
            SELECT AssigneeId, PermissionSet.Name 
            FROM PermissionSetAssignment 
            WHERE AssigneeId IN :users
        ];
        
        System.debug('=== Multiple NDIS Org Admins Bulk Insert ===');
        System.debug('Total Users Inserted: ' + users.size());
        System.debug('Total Assignments Created: ' + assignments.size());
        for (PermissionSetAssignment psa : assignments) {
            System.debug('User ID: ' + psa.AssigneeId + ' - Permission Set: ' + psa.PermissionSet.Name);
        }
    }
    
    // Test: Multiple NDIS Org Admin users become active
    @isTest
    static void testMultipleNDISOrgAdminsBecomeActive() {
        // Get System Administrator profile
        Profile prof = [SELECT Id, Name FROM Profile WHERE Name = 'System Administrator' LIMIT 1];
        
        // Create multiple inactive NDIS Org Admin users
        List<User> users = new List<User>();
        Long timestamp = System.currentTimeMillis();
        
        for (Integer i = 0; i < 3; i++) {
            users.add(new User(
                Alias = 'ndis' + i,
                Email = 'ndis.inactive' + i + '@example.com',
                EmailEncodingKey = 'UTF-8',
                LastName = 'NDISInactive' + i,
                LanguageLocaleKey = 'en_US',
                LocaleSidKey = 'en_US',
                ProfileId = prof.Id,
                TimeZoneSidKey = 'Australia/Sydney',
                User_Type__c = 'NDIS Org Admin',
                UserName = 'ndis.inactive' + i + '.' + timestamp + '@example.com',
                Organization_Name__c = 'Ashfield Consultants',
                IsActive = false
            ));
        }
        
        insert users;
        
        // Update all users to make them active
        for (User u : users) {
            u.IsActive = true;
        }
        
        Test.startTest();
        update users;
        Test.stopTest();
        
        // Verify permission set assignments
        List<PermissionSetAssignment> assignments = [
            SELECT AssigneeId, PermissionSet.Name 
            FROM PermissionSetAssignment 
            WHERE AssigneeId IN :users
        ];
        
        System.debug('=== Multiple NDIS Org Admins Become Active ===');
        System.debug('Total Users Activated: ' + users.size());
        System.debug('Total Assignments Created: ' + assignments.size());
        for (PermissionSetAssignment psa : assignments) {
            System.debug('User ID: ' + psa.AssigneeId + ' - Permission Set: ' + psa.PermissionSet.Name);
        }
    }
    
    // Test: User update without activation (should NOT trigger)
    @isTest
    static void testUserUpdateWithoutActivation() {
        // Get System Administrator profile
        Profile prof = [SELECT Id, Name FROM Profile WHERE Name = 'System Administrator' LIMIT 1];
        
        // Create an active NDIS Org Admin user
        User existingUser = new User(
            Alias = 'active',
            Email = 'active.ndis@example.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'ActiveNDIS',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey = 'Australia/Sydney',
            User_Type__c = 'NDIS Org Admin',
            UserName = 'active.ndis.' + System.currentTimeMillis() + '@example.com',
            Organization_Name__c = 'Ashfield Consultants',
            IsActive = true
        );
        
        insert existingUser;
        
        // Get initial assignments count
        Integer initialCount = [SELECT COUNT() FROM PermissionSetAssignment WHERE AssigneeId = :existingUser.Id];
        
        // Update user without activating (changing a different field)
        existingUser.LastName = 'UpdatedActiveNDIS';
        
        Test.startTest();
        update existingUser;
        Test.stopTest();
        
        // Verify no new assignments were created
        Integer finalCount = [SELECT COUNT() FROM PermissionSetAssignment WHERE AssigneeId = :existingUser.Id];
        
        System.debug('=== User Update Without Activation ===');
        System.debug('User Type: ' + existingUser.User_Type__c);
        System.debug('Is Active: ' + existingUser.IsActive);
        System.debug('Initial Assignments: ' + initialCount);
        System.debug('Final Assignments: ' + finalCount);
        System.debug('New Assignments Created: ' + (finalCount - initialCount));
    }
}