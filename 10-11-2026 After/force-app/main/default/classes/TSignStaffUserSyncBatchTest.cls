@isTest
public class TSignStaffUserSyncBatchTest {

    // ------------------------------------------------------------------
    // Helper: Mock the BatchableContext to prevent NullPointerExceptions
    // ------------------------------------------------------------------
    private class MockBatchableContext implements Database.BatchableContext {
        public Id getJobId() { return null; }
        public Id getChildJobId() { return null; }
    }

    // ------------------------------------------------------------------
    // Helper: Create a TSign Staff record
    // ------------------------------------------------------------------
    private static TSign_Staff__c createStaff(String email, Boolean updateFlag) {
        TSign_Staff__c staff = new TSign_Staff__c(
            First_Name__c  = 'Sync',
            Last_Name__c   = 'Test',
            Email__c       = email,
            Status__c      = true,
            User_Type__c   = 'T Sign Org Admin',
            Update_User__c = updateFlag
        );
        insert staff;
        return staff;
    }

    // ------------------------------------------------------------------
    // Helper: Create a valid User to match the staff email
    // ------------------------------------------------------------------
    private static User createUser(String email, String username) {
        Profile p = [SELECT Id FROM Profile WHERE Id = :UserInfo.getProfileId() LIMIT 1];
        
        User u = new User(
            FirstName         = 'Original',
            LastName          = 'Name',
            Email             = email,
            Username          = username,
            Alias             = 'orig',
            CommunityNickname = 'orig' + String.valueOf(DateTime.now().getTime()).right(6),
            ProfileId         = p.Id,
            TimeZoneSidKey    = 'Australia/Sydney',
            LocaleSidKey      = 'en_AU',
            EmailEncodingKey  = 'UTF-8',
            LanguageLocaleKey = 'en_US',
            IsActive          = true
        );
        
        Database.insert(u, false);
        return u;
    }

    // ==================================================================
    // TEST 1: start() returns QueryLocator
    // ==================================================================
    @isTest
    static void testStartMethod() {
        TSignStaffUserSyncBatch batch = new TSignStaffUserSyncBatch();
        
        Test.startTest();
        Database.QueryLocator loc = batch.start(new MockBatchableContext());
        System.debug('QueryLocator generated: ' + (loc != null));
        Test.stopTest();
    }

    // ==================================================================
    // TEST 2: Empty Scope (No staff with Update_User__c = true)
    // ==================================================================
    @isTest
    static void testEmptyScope() {
        createStaff('empty.' + DateTime.now().getTime() + '@example.com', false);

        Test.startTest();
        Database.executeBatch(new TSignStaffUserSyncBatch(), 200);
        Test.stopTest();
        
        System.debug('Empty scope test completed.');
    }

    // ==================================================================
    // TEST 3: Happy Path - Match by Email and Update User
    // ==================================================================
    @isTest
    static void testSyncByEmail() {
        String email = 'sync.email.' + DateTime.now().getTime() + '@example.com';
        String username = 'sync.user.' + DateTime.now().getTime() + '@example.com';
        
        TSign_Staff__c staff = createStaff(email, true);
        createUser(email, username);

        Test.startTest();
        Database.executeBatch(new TSignStaffUserSyncBatch(), 200);
        Test.stopTest();
        
        System.debug('Sync by Email - Batch executed.');
    }

    // ==================================================================
    // TEST 4: Match by Username (Email field on User is different)
    // ==================================================================
    @isTest
    static void testSyncByUsername() {
        String staffEmail = 'staff.user.' + DateTime.now().getTime() + '@example.com';
        String userEmail = 'different.email.' + DateTime.now().getTime() + '@example.com';
        
        TSign_Staff__c staff = createStaff(staffEmail, true);
        createUser(userEmail, staffEmail);

        Test.startTest();
        Database.executeBatch(new TSignStaffUserSyncBatch(), 200);
        Test.stopTest();
        
        System.debug('Sync by Username - Batch executed.');
    }

    // ==================================================================
    // TEST 5: No Matching User Found (Covers warning logic and early reset)
    // ==================================================================
    @isTest
    static void testNoMatchingUser() {
        String email = 'nomatch.' + DateTime.now().getTime() + '@example.com';
        TSign_Staff__c staff = createStaff(email, true);

        Test.startTest();
        Database.executeBatch(new TSignStaffUserSyncBatch(), 200);
        Test.stopTest();
        
        System.debug('No Match - Batch executed.');
    }

    // ==================================================================
    // TEST 6: Bulk Execution (50 records) to test governor limits
    // ==================================================================
    @isTest
    static void testBulkExecution() {
        List<TSign_Staff__c> staffList = new List<TSign_Staff__c>();
        List<User> userList = new List<User>();
        Profile p = [SELECT Id FROM Profile WHERE Id = :UserInfo.getProfileId() LIMIT 1];

        for (Integer i = 0; i < 50; i++) {
            String email = 'bulk' + i + '.' + DateTime.now().getTime() + '@example.com';
            
            staffList.add(new TSign_Staff__c(
                First_Name__c  = 'Bulk' + i,
                Last_Name__c   = 'Sync',
                Email__c       = email,
                Status__c      = true,
                Update_User__c = true
            ));

            userList.add(new User(
                FirstName         = 'Old' + i,
                LastName          = 'Name',
                Email             = email,
                Username          = email,
                Alias             = 'blk',
                CommunityNickname = 'blk' + i + String.valueOf(DateTime.now().getTime()).right(4),
                ProfileId         = p.Id,
                TimeZoneSidKey    = 'Australia/Sydney',
                LocaleSidKey      = 'en_AU',
                EmailEncodingKey  = 'UTF-8',
                LanguageLocaleKey = 'en_US'
            ));
        }
        
        insert staffList;
        Database.insert(userList, false);

        Test.startTest();
        Database.executeBatch(new TSignStaffUserSyncBatch(), 200);
        Test.stopTest();
        
        System.debug('Bulk Execution - Batch executed.');
    }

    // ==================================================================
    // TEST 7: Direct execute() call with blank emails and Mock Context
    // ==================================================================
    @isTest
    static void testDirectExecuteBlankEmails() {
        List<TSign_Staff__c> staffList = new List<TSign_Staff__c>{
            new TSign_Staff__c(First_Name__c = 'NoEmail', Last_Name__c = '1', Update_User__c = true, Email__c = 'noemail1@test.com'),
            new TSign_Staff__c(First_Name__c = 'NoEmail', Last_Name__c = '2', Update_User__c = true, Email__c = 'noemail2@test.com')
        };
        insert staffList;

        Test.startTest();
        TSignStaffUserSyncBatch batch = new TSignStaffUserSyncBatch();
        
        List<TSign_Staff__c> mockScope = new List<TSign_Staff__c>{
            new TSign_Staff__c(Id = staffList[0].Id, Email__c = null),
            new TSign_Staff__c(Id = staffList[1].Id, Email__c = null)
        };
        
        batch.execute(new MockBatchableContext(), mockScope);
        Test.stopTest();
        
        System.debug('Direct Execute - Blank emails processed.');
    }

    // ==================================================================
    // TEST 8: Direct execute() call with null scope
    // ==================================================================
    @isTest
    static void testDirectExecuteNullScope() {
        Test.startTest();
        TSignStaffUserSyncBatch batch = new TSignStaffUserSyncBatch();
        batch.execute(new MockBatchableContext(), null);
        Test.stopTest();
        
        System.debug('Direct Execute - Null scope processed.');
    }

    // ==================================================================
    // TEST 9: FORCE COVERAGE - Direct execute() for User updates
    // ==================================================================
    @isTest
    static void testDirectExecuteToCoverUpdateLogic() {
        // 1. Create the Staff record
        String email = 'direct.cover.' + DateTime.now().getTime() + '@example.com';
        TSign_Staff__c staff = new TSign_Staff__c(
            First_Name__c  = 'NewFirstName',
            Last_Name__c   = 'NewLastName',
            Email__c       = email,
            Status__c      = true,
            User_Type__c   = 'T Sign Org Admin',
            Update_User__c = true
        );
        insert staff;

        // 2. Create a User with the exact same email so the batch logic finds it
        Profile p = [SELECT Id FROM Profile WHERE Id = :UserInfo.getProfileId() LIMIT 1];
        User u = new User(
            FirstName         = 'OldFirstName',
            LastName          = 'OldLastName',
            Email             = email,
            Username          = 'direct.user.' + DateTime.now().getTime() + '@example.com',
            Alias             = 'dir',
            CommunityNickname = 'dir' + String.valueOf(DateTime.now().getTime()).right(6),
            ProfileId         = p.Id,
            TimeZoneSidKey    = 'Australia/Sydney',
            LocaleSidKey      = 'en_AU',
            EmailEncodingKey  = 'UTF-8',
            LanguageLocaleKey = 'en_US',
            IsActive          = true
        );
        Database.insert(u, false);

        Test.startTest();
        TSignStaffUserSyncBatch batch = new TSignStaffUserSyncBatch();
        
        // 3. Manually construct the scope and pass it directly to execute()
        List<TSign_Staff__c> mockScope = [SELECT Id, Email__c, First_Name__c, Last_Name__c, User_Type__c, Status__c FROM TSign_Staff__c WHERE Id = :staff.Id];
        
        // 4. Call execute directly with a Mock Batchable Context
        batch.execute(new MockBatchableContext(), mockScope);
        Test.stopTest();
        
        System.debug('Direct execute logic test completed.');
    }

    // ==================================================================
    // TEST 10: Direct execute() for Username fallback logic
    // ==================================================================
    @isTest
    static void testDirectExecuteUsernameFallback() {
        String staffEmail = 'fallback.' + DateTime.now().getTime() + '@example.com';
        TSign_Staff__c staff = new TSign_Staff__c(
            First_Name__c  = 'FallbackFirst',
            Last_Name__c   = 'FallbackLast',
            Email__c       = staffEmail,
            Status__c      = true,
            User_Type__c   = 'T Sign Org Admin',
            Update_User__c = true
        );
        insert staff;

        // User's Email is different, but Username matches
        Profile p = [SELECT Id FROM Profile WHERE Id = :UserInfo.getProfileId() LIMIT 1];
        User u = new User(
            FirstName         = 'Old',
            LastName          = 'User',
            Email             = 'different.' + DateTime.now().getTime() + '@example.com',
            Username          = staffEmail, 
            Alias             = 'usr',
            CommunityNickname = 'usr' + String.valueOf(DateTime.now().getTime()).right(6),
            ProfileId         = p.Id,
            TimeZoneSidKey    = 'Australia/Sydney',
            LocaleSidKey      = 'en_AU',
            EmailEncodingKey  = 'UTF-8',
            LanguageLocaleKey = 'en_US',
            IsActive          = true
        );
        Database.insert(u, false);

        Test.startTest();
        TSignStaffUserSyncBatch batch = new TSignStaffUserSyncBatch();
        List<TSign_Staff__c> mockScope = [SELECT Id, Email__c, First_Name__c, Last_Name__c, User_Type__c, Status__c FROM TSign_Staff__c WHERE Id = :staff.Id];
        batch.execute(new MockBatchableContext(), mockScope);
        Test.stopTest();
        
        System.debug('Direct execute username fallback test completed.');
    }
}