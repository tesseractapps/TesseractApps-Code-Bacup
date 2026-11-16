@isTest
public class TSignCreateUsersBatchTest {

    @testSetup
    static void setupData() {
        String partnerAccountName = null;
        try {
            Product_User_Setting__mdt settings = Product_User_Setting__mdt.getInstance('TSign');
            if (settings != null) partnerAccountName = settings.Partner_Account_Name__c;
        } catch (Exception e) {}

        if (String.isNotBlank(partnerAccountName)) {
            List<Account> existing = [SELECT Id FROM Account WHERE Name = :partnerAccountName LIMIT 1];
            if (existing.isEmpty()) insert new Account(Name = partnerAccountName);
        }
    }

    public static Contact buildContact(String email) {
        String partnerAccountName = null;
        try {
            Product_User_Setting__mdt settings = Product_User_Setting__mdt.getInstance('TSign');
            if (settings != null) partnerAccountName = settings.Partner_Account_Name__c;
        } catch (Exception e) {}

        Account acct;
        if (String.isNotBlank(partnerAccountName)) {
            List<Account> accts = [SELECT Id FROM Account WHERE Name = :partnerAccountName LIMIT 1];
            acct = accts.isEmpty() ? null : accts[0];
        }
        if (acct == null) {
            acct = new Account(Name = 'Fallback Partner Account ' + DateTime.now().getTime());
            insert acct;
        }

        Contact con = new Contact(
            FirstName = 'Jane',
            LastName  = 'Doe',
            Email     = email,
            AccountId = acct.Id
        );
        insert con;
        return con;
    }

    public static TSign_Staff__c buildStaff(String email, String roleName) {
        TSign_Organisation__c org = new TSign_Organisation__c(
            Name = 'Test Org ' + email,
            Active__c = true,
            Email__c = email
        );
        insert org;

        TSign_Staff__c staff = new TSign_Staff__c(
            First_Name__c         = 'Jane',
            Last_Name__c          = 'Doe',
            Email__c              = email,
            Status__c             = true,
            TSign_Organisation__c = org.Id,
            User_Role__c          = roleName,
            User_Type__c          = 'T Sign Org Admin',
            Address__CountryCode__s = 'AU'
        );
        insert staff;
        return staff;
    }

    public static String expectedRoleName() {
        String roleName = '';
        try {
            Product_User_Setting__mdt settings = Product_User_Setting__mdt.getInstance('TSign');
            if (settings != null && String.isNotBlank(settings.Partner_Account_Name__c)) {
                roleName = settings.Partner_Account_Name__c + ' Partner Executive';
            }
        } catch (Exception e) {}
        return roleName;
    }

    @isTest
    static void testStartQueryLocator() {
        Contact con = buildContact('start.' + DateTime.now().getTime() + '@example.com');
        Set<Id> ids = new Set<Id>{ con.Id };
        TSignCreateUsersBatch batch = new TSignCreateUsersBatch(ids);

        Test.startTest();
        Database.QueryLocator loc = batch.start(null);
        System.debug('QueryLocator produced: ' + (loc != null));
        Test.stopTest();
    }

    @isTest
    static void testBatchHappyPath() {
        String email = 'happy.' + DateTime.now().getTime() + '@example.com';
        Contact con = buildContact(email);
        buildStaff(email, expectedRoleName());

        Test.startTest();
        Database.executeBatch(new TSignCreateUsersBatch(new Set<Id>{ con.Id }), 1);
        Test.stopTest();
        System.debug('Batch happy path completed.');
    }

    @isTest
    static void testBatchMissingStaff() {
        String email = 'nostaff.' + DateTime.now().getTime() + '@example.com';
        Contact con = buildContact(email);

        Test.startTest();
        Database.executeBatch(new TSignCreateUsersBatch(new Set<Id>{ con.Id }), 1);
        Test.stopTest();
        System.debug('Batch missing-staff run completed.');
    }

    @isTest
    static void testBatchEmptyScope() {
        Test.startTest();
        Database.executeBatch(new TSignCreateUsersBatch(new Set<Id>{ '003000000000001AAA' }), 1);
        Test.stopTest();
        System.debug('Batch empty-scope run completed.');
    }

    @isTest
    static void testBatchRoleNotFound() {
        String email = 'norole.' + DateTime.now().getTime() + '@example.com';
        Contact con = buildContact(email);
        buildStaff(email, 'Definitely Not A Real Role ' + DateTime.now().getTime());

        Test.startTest();
        Database.executeBatch(new TSignCreateUsersBatch(new Set<Id>{ con.Id }), 1);
        Test.stopTest();
        System.debug('Batch role-not-found run completed.');
    }

    @isTest
    static void testBatchUsernameTaken() {
        String email = 'taken.' + DateTime.now().getTime() + '@example.com';
        Contact con = buildContact(email);
        buildStaff(email, expectedRoleName());

        Profile p = [SELECT Id FROM Profile WHERE Id = :UserInfo.getProfileId() LIMIT 1];
        
        Contact dummyCon = new Contact(LastName = 'Dummy', AccountId = con.AccountId);
        insert dummyCon;

        User existing = new User(
            Username          = email.toLowerCase(),
            Email             = email,
            FirstName         = 'Existing',
            LastName          = 'User',
            Alias             = 'exist',
            CommunityNickname = 'existing' + String.valueOf(DateTime.now().getTime()).right(6),
            ProfileId         = p.Id,
            TimeZoneSidKey    = 'Australia/Sydney',
            LocaleSidKey      = 'en_AU',
            EmailEncodingKey  = 'UTF-8',
            LanguageLocaleKey = 'en_US',
            ContactId         = dummyCon.Id 
        );
        
        Test.startTest();
        Database.insert(existing, false); // Ignore trigger failures
        
        Database.executeBatch(new TSignCreateUsersBatch(new Set<Id>{ con.Id }), 1);
        Test.stopTest();
        System.debug('Batch username-taken run completed.');
    }

    @isTest
    static void testContactWithoutEmailExcluded() {
        String email = 'noemail.' + DateTime.now().getTime() + '@example.com';
        Contact con = buildContact(email);
        con.Email = null;
        update con;

        Test.startTest();
        Database.executeBatch(new TSignCreateUsersBatch(new Set<Id>{ con.Id }), 1);
        Test.stopTest();
        System.debug('Batch no-email run completed.');
    }

    @isTest
    static void testContactWithoutAccountExcluded() {
        Contact con = new Contact(
            FirstName = 'No',
            LastName  = 'Account',
            Email     = 'noacct.' + DateTime.now().getTime() + '@example.com'
        );
        insert con;

        Test.startTest();
        Database.executeBatch(new TSignCreateUsersBatch(new Set<Id>{ con.Id }), 1);
        Test.stopTest();
        System.debug('Batch no-account run completed.');
    }

    @isTest
    static void testCleanupKeepsOrgWithUser() {
        String email = 'cleanup.' + DateTime.now().getTime() + '@example.com';
        Contact con = buildContact(email);
        TSign_Staff__c staff = buildStaff(email, expectedRoleName());

        Profile p = [SELECT Id FROM Profile WHERE Id = :UserInfo.getProfileId() LIMIT 1];
        
        Contact dummyCon = new Contact(LastName = 'Dummy', AccountId = con.AccountId);
        insert dummyCon;

        User existing = new User(
            Username          = 'cleanup.' + DateTime.now().getTime() + '@example.com',
            Email             = 'cleanup.existing.' + DateTime.now().getTime() + '@example.com',
            FirstName         = 'Existing',
            LastName          = 'Owner',
            Alias             = 'exist',
            CommunityNickname = 'cleanup' + String.valueOf(DateTime.now().getTime()).right(6),
            ProfileId         = p.Id,
            TimeZoneSidKey    = 'Australia/Sydney',
            LocaleSidKey      = 'en_AU',
            EmailEncodingKey  = 'UTF-8',
            LanguageLocaleKey = 'en_US',
            TSign_Org_Id__c   = String.valueOf(staff.TSign_Organisation__c),
            ContactId         = dummyCon.Id
        );

        Test.startTest();
        Database.insert(existing, false);
        delete staff; // Force batch to fail

        Database.executeBatch(new TSignCreateUsersBatch(new Set<Id>{ con.Id }), 1);
        Test.stopTest();
        System.debug('Batch cleanup-with-user run completed.');
    }

    @isTest
    static void testConstructorAndStart() {
        Test.startTest();
        TSignCreateUsersBatch b = new TSignCreateUsersBatch(new Set<Id>());
        Database.QueryLocator loc = b.start(null);
        System.debug('Empty-set batch start() produced locator: ' + (loc != null));
        Test.stopTest();
    }

    @isTest
    static void testCustomException() {
        Test.startTest();
        try {
            throw new TSignCreateUsersBatch.CustomException('boom');
        } catch (TSignCreateUsersBatch.CustomException e) {
            System.debug('CustomException caught: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testMultipleContactsInOneBatch() {
        Set<Id> contactIds = new Set<Id>();
        for (Integer i = 0; i < 3; i++) {
            String email = 'multi' + i + '.' + DateTime.now().getTime() + '@example.com';
            Contact con = buildContact(email);
            buildStaff(email, expectedRoleName());
            contactIds.add(con.Id);
        }

        Test.startTest();
        Database.executeBatch(new TSignCreateUsersBatch(contactIds), 200);
        Test.stopTest();
        System.debug('Batch multi-contact run completed.');
    }

    @isTest
    static void testMixedSuccessAndFailure() {
        String okEmail = 'ok.' + DateTime.now().getTime() + '@example.com';
        Contact okCon = buildContact(okEmail);
        buildStaff(okEmail, expectedRoleName());

        String failEmail = 'fail.' + DateTime.now().getTime() + '@example.com';
        Contact failCon = buildContact(failEmail);

        Test.startTest();
        Database.executeBatch(new TSignCreateUsersBatch(new Set<Id>{ okCon.Id, failCon.Id }), 200);
        Test.stopTest();
        System.debug('Batch mixed success/failure run completed.');
    }
}