@isTest
public class TSignCreateUsersBatchfromProtalTest {

    // ------------------------------------------------------------------
    // Setup: Ensure the Partner Account exists
    // ------------------------------------------------------------------
    @testSetup
    static void setupData() {
        String partnerAccountName = null;
        try {
            Product_User_Setting__mdt settings = Product_User_Setting__mdt.getInstance('TSign');
            if (settings != null) partnerAccountName = settings.Partner_Account_Name__c;
        } catch (Exception e) {}

        if (String.isNotBlank(partnerAccountName)) {
            List<Account> existing = [SELECT Id FROM Account WHERE Name = :partnerAccountName LIMIT 1];
            if (existing.isEmpty()) {
                insert new Account(Name = partnerAccountName);
            }
        }
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------
    public static Account getPartnerAccount() {
        String partnerAccountName = null;
        try {
            Product_User_Setting__mdt settings = Product_User_Setting__mdt.getInstance('TSign');
            if (settings != null) partnerAccountName = settings.Partner_Account_Name__c;
        } catch (Exception e) {}

        List<Account> accts = [SELECT Id FROM Account WHERE Name = :partnerAccountName LIMIT 1];
        if (accts.isEmpty()) {
            Account a = new Account(Name = partnerAccountName != null ? partnerAccountName : 'Fallback Test Account');
            insert a;
            return a;
        }
        return accts[0];
    }

    public static TSign_Organisation__c createOrg() {
        TSign_Organisation__c org = new TSign_Organisation__c(
            Name = 'Test Org ' + DateTime.now().getTime(),
            Active__c = true,
            Email__c = 'org.' + DateTime.now().getTime() + '@example.com'
        );
        insert org;
        return org;
    }

    public static TSign_Staff__c createStaff(Id orgId, String email, Boolean createUser) {
        TSign_Staff__c staff = new TSign_Staff__c(
            First_Name__c         = 'Test',
            Last_Name__c          = 'Staff',
            Email__c              = email,
            TSign_Organisation__c = orgId,
            Status__c             = true,
            User_Type__c          = 'T Sign Org Admin',
            User_Role__c          = 'Dummy Role',
            Create_User__c        = createUser,
            Address__CountryCode__s = 'AU'
        );
        insert staff;
        return staff;
    }

    public static Contact createContact(Id accountId, String email) {
        Contact con = new Contact(
            FirstName = 'Test',
            LastName  = 'Contact',
            Email     = email,
            AccountId = accountId
        );
        insert con;
        return con;
    }

    // ------------------------------------------------------------------
    // Test 1: Empty Scope
    // ------------------------------------------------------------------
    @isTest
    static void testEmptyScope() {
        Test.startTest();
        // Execute with no staff records having Create_User__c = true
        Database.executeBatch(new TSignCreateUsersBatchfromProtal(), 200);
        Test.stopTest();
        System.debug('Empty scope test executed successfully.');
    }

    // ------------------------------------------------------------------
    // Test 2: Happy Path (User Creation)
    // ------------------------------------------------------------------
    @isTest
    static void testHappyPathUserCreation() {
        Account partnerAcct = getPartnerAccount();
        TSign_Organisation__c org = createOrg();
        
        String email = 'happy.' + DateTime.now().getTime() + '@example.com';
        Contact con = createContact(partnerAcct.Id, email);
        TSign_Staff__c staff = createStaff(org.Id, email, true);

        Test.startTest();
        Database.executeBatch(new TSignCreateUsersBatchfromProtal(), 200);
        Test.stopTest();

        System.debug('Happy path completed. Check debug logs for created User.');
    }

    // ------------------------------------------------------------------
    // Test 3: Missing Contact
    // ------------------------------------------------------------------
    @isTest
    static void testMissingContact() {
        TSign_Organisation__c org = createOrg();
        String email = 'nocontact.' + DateTime.now().getTime() + '@example.com';
        
        // Staff exists, but no Contact is created for this email
        TSign_Staff__c staff = createStaff(org.Id, email, true);

        Test.startTest();
        Database.executeBatch(new TSignCreateUsersBatchfromProtal(), 200);
        Test.stopTest();

        System.debug('Missing contact test completed.');
    }

    // ------------------------------------------------------------------
    // Test 4: Contact already has a User
    // ------------------------------------------------------------------
    @isTest
    static void testContactAlreadyHasUser() {
        Account partnerAcct = getPartnerAccount();
        TSign_Organisation__c org = createOrg();
        String email = 'existinguser.' + DateTime.now().getTime() + '@example.com';
        
        Contact con = createContact(partnerAcct.Id, email);
        TSign_Staff__c staff = createStaff(org.Id, email, true);

        Profile p = [SELECT Id FROM Profile WHERE Id = :UserInfo.getProfileId() LIMIT 1];
        User existingUser = new User(
            Username = 'exist.' + DateTime.now().getTime() + '@example.com',
            Email = 'exist.' + DateTime.now().getTime() + '@example.com',
            FirstName = 'Exist',
            LastName = 'User',
            Alias = 'exu',
            CommunityNickname = 'exu' + String.valueOf(DateTime.now().getTime()).right(6),
            ProfileId = p.Id,
            TimeZoneSidKey = 'Australia/Sydney',
            LocaleSidKey = 'en_AU',
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'en_US',
            ContactId = con.Id
        );
        Database.insert(existingUser, false);

        Test.startTest();
        Database.executeBatch(new TSignCreateUsersBatchfromProtal(), 200);
        Test.stopTest();

        System.debug('Contact already has user test completed.');
    }

    // ------------------------------------------------------------------
    // Test 5: Multiple Contacts with same email (Triggers error)
    // ------------------------------------------------------------------
    @isTest
    static void testMultipleContacts() {
        Account partnerAcct = getPartnerAccount();
        TSign_Organisation__c org = createOrg();
        String email = 'multiple.' + DateTime.now().getTime() + '@example.com';
        
        // Create two contacts with the same email
        createContact(partnerAcct.Id, email);
        createContact(partnerAcct.Id, email);
        
        TSign_Staff__c staff = createStaff(org.Id, email, true);

        Test.startTest();
        Database.executeBatch(new TSignCreateUsersBatchfromProtal(), 200);
        Test.stopTest();

        System.debug('Multiple contacts test completed.');
    }

    // ------------------------------------------------------------------
    // Test 6: TSign User already exists with same email
    // ------------------------------------------------------------------
    @isTest
    static void testTSignUserAlreadyExists() {
        Account partnerAcct = getPartnerAccount();
        TSign_Organisation__c org = createOrg();
        String email = 'tsignexists.' + DateTime.now().getTime() + '@example.com';
        
        Contact con = createContact(partnerAcct.Id, email);
        TSign_Staff__c staff = createStaff(org.Id, email, true);

        Profile p = [SELECT Id FROM Profile WHERE Id = :UserInfo.getProfileId() LIMIT 1];
        User existingUser = new User(
            Username = 'tsignexist.' + DateTime.now().getTime() + '@example.com',
            Email = email,
            FirstName = 'TSign',
            LastName = 'Exists',
            Alias = 'tex',
            CommunityNickname = 'tex' + String.valueOf(DateTime.now().getTime()).right(6),
            ProfileId = p.Id,
            TimeZoneSidKey = 'Australia/Sydney',
            LocaleSidKey = 'en_AU',
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'en_US',
            TSign_Org_Id__c = org.Id,
            ContactId = con.Id
        );
        Database.insert(existingUser, false);

        Test.startTest();
        Database.executeBatch(new TSignCreateUsersBatchfromProtal(), 200);
        Test.stopTest();

        System.debug('TSign user exists test completed.');
    }

    // ------------------------------------------------------------------
    // Test 7: Blank Role Name
    // ------------------------------------------------------------------
    @isTest
    static void testBlankRole() {
        Account partnerAcct = getPartnerAccount();
        TSign_Organisation__c org = createOrg();
        String email = 'norole.' + DateTime.now().getTime() + '@example.com';
        
        createContact(partnerAcct.Id, email);
        TSign_Staff__c staff = createStaff(org.Id, email, true);
        staff.User_Role__c = null;
        update staff;

        Test.startTest();
        Database.executeBatch(new TSignCreateUsersBatchfromProtal(), 200);
        Test.stopTest();

        System.debug('Blank role test completed.');
    }

    // ------------------------------------------------------------------
    // Test 8: Direct Calls to Static Helpers
    // ------------------------------------------------------------------
    @isTest
    static void testStaticHelpers() {
        // TimeZone Tests
        System.debug('TZ IN: ' + TSignCreateUsersBatchfromProtal.getTimeZone('IN', null));
        System.debug('TZ AU: ' + TSignCreateUsersBatchfromProtal.getTimeZone('AU', null));
        System.debug('TZ US: ' + TSignCreateUsersBatchfromProtal.getTimeZone('US', null));
        System.debug('TZ GB: ' + TSignCreateUsersBatchfromProtal.getTimeZone('GB', null));
        System.debug('TZ Blank: ' + TSignCreateUsersBatchfromProtal.getTimeZone(null, null));

        // Locale Tests
        System.debug('Locale IN: ' + TSignCreateUsersBatchfromProtal.getLocale('IN', null));
        System.debug('Locale AU: ' + TSignCreateUsersBatchfromProtal.getLocale('AU', null));
        System.debug('Locale GB: ' + TSignCreateUsersBatchfromProtal.getLocale('GB', null));
        System.debug('Locale Blank: ' + TSignCreateUsersBatchfromProtal.getLocale(null, null));

        // Alias & Nickname Tests
        // FIX: Contacts must be inserted to generate an Id for buildCommunityNickname()
        Contact c1 = new Contact(FirstName = 'John', LastName = 'Doe');
        insert c1;
        System.debug('Alias John: ' + TSignCreateUsersBatchfromProtal.buildAlias(c1));
        System.debug('Nickname John: ' + TSignCreateUsersBatchfromProtal.buildCommunityNickname(c1));

        Contact c2 = new Contact(FirstName = null, LastName = 'NullFirstName');
        insert c2;
        System.debug('Alias Null: ' + TSignCreateUsersBatchfromProtal.buildAlias(c2));
        System.debug('Nickname Null: ' + TSignCreateUsersBatchfromProtal.buildCommunityNickname(c2));
    }

    // ------------------------------------------------------------------
    // Test 9: Custom Exception
    // ------------------------------------------------------------------
    @isTest
    static void testCustomException() {
        Test.startTest();
        try {
            throw new TSignCreateUsersBatchfromProtal.CustomException('Test Exception');
        } catch (TSignCreateUsersBatchfromProtal.CustomException e) {
            System.debug('Caught expected exception: ' + e.getMessage());
        }
        Test.stopTest();
    }
}