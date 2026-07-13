@IsTest
private class MobileTLearnerOnboardingAPITest {

    /* =========================================================
       TEST SETUP - Runs Once For Entire Class
    ========================================================= */
    @testSetup
    static void setupData() {

        // Create Organisations
        //insert new Organisation__c(Name = 'Test Org');
        //insert new Organisation__c(Name = 'Admin Org');
        Organisation__c org = new Organisation__c();
        org.Name='Ashfield Consultants';
        org.ABN__c='11234567891';
        org.ACN__c='878787878';
        org.Contact_No__c='6132899740';
        org.RCTI__c='RCTI1';
        org.Email__c='dsfdsfsd@gmail.com';
        org.Bank__c='Bank Test';
        org.BSB__c='BSB Test';
        org.Account_Name__c='Test Account';
        org.Account_Number__c='1111111111';
        org.Description__c='test Desc';
        org.Address_Latest__Street__s='101';
        org.Address_Latest__City__s='Himas Waterhen';
        org.Address_Latest__PostalCode__s='2060';
        org.Address_Latest__CountryCode__s='AU';
        org.Address_Latest__StateCode__s='NSW';
        org.NDIS_Provider__c='12341234565';
        org.BMSI_Identifier__c ='TEST BMSI';
        org.SoftwareId__c = 'jhdfn18328';
        org.Branch_code__c = 'BS123';
        org.Contact_Name__c = 'Test Contact';
        org.User_Type__c = 'NDIS Org Admin';
        insert org;
        
        Organisation__c org1 = new Organisation__c();
        org1.Name='Ashfield Consultants1';
        org1.ABN__c='11234567891';
        org1.ACN__c='878787878';
        org1.Contact_No__c='6132899740';
        org1.RCTI__c='RCTI1';
        org1.Email__c='dsfdsfsd@gmail.com';
        org1.Bank__c='Bank Test';
        org1.BSB__c='BSB Test';
        org1.Account_Name__c='Test Account';
        org1.Account_Number__c='1111111111';
        org1.Description__c='test Desc';
        org1.Address_Latest__Street__s='101';
        org1.Address_Latest__City__s='Himas Waterhen';
        org1.Address_Latest__PostalCode__s='2060';
        org1.Address_Latest__CountryCode__s='AU';
        org1.Address_Latest__StateCode__s='NSW';
        org1.NDIS_Provider__c='12341234565';
        org1.BMSI_Identifier__c ='TEST BMSI';
        org1.SoftwareId__c = 'jhdfn18328';
        org1.Branch_code__c = 'BS123';
        org1.Contact_Name__c = 'Test Contact';
        org1.User_Type__c = 'NDIS Org Admin';
        insert org1;

        // Get org Ids
        Id testOrgId = [SELECT Id FROM Organisation__c WHERE Name = 'Ashfield Consultants' LIMIT 1].Id;
        Id adminOrgId = [SELECT Id FROM Organisation__c WHERE Name = 'Ashfield Consultants1' LIMIT 1].Id;

        // Create TLearner Records for Test Org
        insert new Tlearner__c(
            Title__c = 'Welcome Staff',
            Platform__c = 'Mobile Application',
            Role__c = 'Staff',
            Organization__c = testOrgId,
            Expire_Date__c = Date.today().addDays(5)
        );

        insert new Tlearner__c(
            Title__c = 'Welcome Admin',
            Platform__c = 'Mobile Application',
            Role__c = 'Admin',
            Organization__c = testOrgId,
            Expire_Date__c = Date.today().addDays(5)
        );

        // Expired record (should never return)
        insert new Tlearner__c(
            Title__c = 'Old',
            Platform__c = 'Mobile Application',
            Role__c = 'Staff',
            Organization__c = adminOrgId,
            Expire_Date__c = Date.today().addDays(-5)
        );

        // Valid records for Admin Org
        insert new Tlearner__c(
            Title__c = 'Staff Guide',
            Platform__c = 'Mobile Application',
            Role__c = 'Staff',
            Organization__c = adminOrgId,
            Expire_Date__c = Date.today().addDays(5)
        );

        insert new Tlearner__c(
            Title__c = 'Admin Guide',
            Platform__c = 'Mobile Application',
            Role__c = 'Admin',
            Organization__c = adminOrgId,
            Expire_Date__c = Date.today().addDays(5)
        );
    }

    /* =========================================================
       TEST 1 : User Without Organisation
    ========================================================= */
    @IsTest
    static void testUserWithoutOrganisation() {

        Profile p = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
        String unique = String.valueOf(DateTime.now().getTime());

        User u = new User(
            FirstName = 'Test',
            LastName = 'NoOrg',
            Email = 'noorg' + unique + '@test.com',
            Username = 'noorg' + unique + '@test.com',
            Alias = 'noorg',
            TimeZoneSidKey = 'Asia/Kolkata',
            LocaleSidKey = 'en_US',
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'en_US',
            ProfileId = p.Id,
            Organization_Name__c = 'Ashfield Consultants1'
        );
        insert u;

        Test.startTest();
        System.runAs(u){
            RestRequest req = new RestRequest();
            req.requestURI = '/services/apexrest/v1/mobile/tlearner/onboarding';
            req.httpMethod = 'GET';
            RestContext.request = req;
            RestContext.response = new RestResponse();

            MobileTLearnerOnboardingAPI.fetchOnboardingTutorials();
        }
        Test.stopTest();

    }

    /* =========================================================
       TEST 2 : Organisation Not Found
    ========================================================= */
    @IsTest
    static void testOrganisationNotFound() {

        Profile p = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
        String unique = String.valueOf(DateTime.now().getTime());

        User u = new User(
            FirstName = 'Test',
            LastName = 'InvalidOrg',
            Email = 'invalid' + unique + '@test.com',
            Username = 'invalid' + unique + '@test.com',
            Alias = 'invorg',
            TimeZoneSidKey = 'Asia/Kolkata',
            LocaleSidKey = 'en_US',
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'en_US',
            ProfileId = p.Id,
            Organization_Name__c = 'Ashfield Consultants1'
        );
        insert u;

        Test.startTest();
        System.runAs(u){
            RestRequest req = new RestRequest();
            req.httpMethod = 'GET';
            RestContext.request = req;
            RestContext.response = new RestResponse();

            MobileTLearnerOnboardingAPI.fetchOnboardingTutorials();
        }
        Test.stopTest();

    }

    /* =========================================================
       TEST 3 : Portal User → Staff Only
    ========================================================= */
    @IsTest
    static void testPortalUserRoleFiltering() {

        Profile p = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
        String unique = String.valueOf(DateTime.now().getTime());

        User u = new User(
            FirstName = 'Test',
            LastName = 'PortalUser',
            Email = 'portal' + unique + '@test.com',
            Username = 'portal' + unique + '@test.com',
            Alias = 'portal',
            TimeZoneSidKey = 'Asia/Kolkata',
            LocaleSidKey = 'en_US',
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'en_US',
            ProfileId = p.Id,
            Organization_Name__c = 'Ashfield Consultants1'
        );
        insert u;

        Test.startTest();
        System.runAs(u){
            RestRequest req = new RestRequest();
            req.httpMethod = 'GET';
            RestContext.request = req;
            RestContext.response = new RestResponse();

            MobileTLearnerOnboardingAPI.fetchOnboardingTutorials();
        }
        Test.stopTest();

        String response = RestContext.response.responseBody.toString();
    }

    /* =========================================================
       TEST 4 : Privileged User → See All
    ========================================================= */
    @IsTest
    static void testPrivilegedUserSeesAll() {

        Profile p = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
        String unique = String.valueOf(DateTime.now().getTime());

        User u = new User(
            FirstName = 'Test',
            LastName = 'AdminUser',
            Email = 'admin' + unique + '@test.com',
            Username = 'admin' + unique + '@test.com',
            Alias = 'admin',
            TimeZoneSidKey = 'Asia/Kolkata',
            LocaleSidKey = 'en_US',
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'en_US',
            ProfileId = p.Id,
            Organization_Name__c = 'Ashfield Consultants1'
        );
        insert u;

        Test.startTest();
        System.runAs(u){
            RestRequest req = new RestRequest();
            req.httpMethod = 'GET';
            RestContext.request = req;
            RestContext.response = new RestResponse();

            MobileTLearnerOnboardingAPI.fetchOnboardingTutorials();
        }
        Test.stopTest();

        String response = RestContext.response.responseBody.toString();

    }
}