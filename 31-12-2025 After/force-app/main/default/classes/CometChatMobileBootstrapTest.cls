@isTest
private class CometChatMobileBootstrapTest {
    
    @TestSetup
    static void setupTestData() {

        // Create Organisation__c
        Organisation__c org = new Organisation__c(
            Name='Age Grace Innovation PVT LTD',
            ABN__c='11234567891',
            ACN__c='878787878',
            Contact_No__c='6132899740',
            RCTI__c='RCTI1',
            Email__c='dsfdsfsd@gmail.com',
            Bank__c='Bank Test',
            BSB__c='BSB Test',
            Account_Name__c='Test Account',
            Account_Number__c='1111111111',
            Description__c='test Desc',
            Address_Latest__Street__s='101',
            Address_Latest__City__s='Himas Waterhen',
            Address_Latest__PostalCode__s='2060',
            Address_Latest__CountryCode__s='AU',
            Address_Latest__StateCode__s='NSW',
            NDIS_Provider__c='12341234565',
            BMSI_Identifier__c ='TEST BMSI',
            SoftwareId__c = 'jhdfn18328',
            Branch_code__c = 'BS123',
            Contact_Name__c = 'Test Contact',
            User_Type__c = 'NDIS Org Admin',

            // REQUIRED for bootstrap()
            CometChat_App_ID__c = 'APP123',
            CometChat_AuthKey__c = 'AUTH123',
            CometChat_Region__c = 'us',
            CometChat_Variant_ID__c = 'VAR123',
            CometChat_REST_API_Key__c = 'RESTKEY123'
        );
        insert org;

        // Standard profile
        Profile standardProfile = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];

        String uniqueSuffix = String.valueOf(System.currentTimeMillis());
        String uniqueEmail1 = 'testuser1_' + uniqueSuffix + '@example.com';
        String uniqueEmail2 = 'testuser2_' + uniqueSuffix + '@example.com';

        insert new User[] {
            new User(
                FirstName='Test', LastName='User1', Email=uniqueEmail1,
                Username=uniqueEmail1, Alias='tu1',
                ProfileId=standardProfile.Id, TimeZoneSidKey='America/New_York',
                LocaleSidKey='en_US', EmailEncodingKey='UTF-8', LanguageLocaleKey='en_US'
            ),
            new User(
                FirstName='Test', LastName='User2', Email=uniqueEmail2,
                Username=uniqueEmail2, Alias='tu2',
                ProfileId=standardProfile.Id, TimeZoneSidKey='America/New_York',
                LocaleSidKey='en_US', EmailEncodingKey='UTF-8', LanguageLocaleKey='en_US'
            )
        };

        // Admin Profile
        Profile adminProf = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];

        // USER used for runAs() = MUST MATCH STAFF EMAIL
        User mainUser = new User(
            Alias='praveen',
            Email='manualtesting.4139562@hotmail.com',
            EmailEncodingKey='UTF-8',
            LastName='Test Friday',
            LanguageLocaleKey='en_US',
            IsActive=true,
            LocaleSidKey='en_US',
            ProfileId=adminProf.Id,
            TimeZoneSidKey='America/New_York',
            UserName='manualtesting.4139562@hotmail.com',
            Organization_Name__c='Age Grace Innovation PVT LTD'
        );
        insert mainUser;

        System.runAs(mainUser) {

            Facility__c fac = new Facility__c(
                Name='Ashfield Facility',
                Address__City__s='Crace',
                Address__Street__s='8 Keewong Street',
                Address__StateCode__s='ACT',
                Address__PostalCode__s='2911',
                Address__CountryCode__s='AU',
                Email__c='testonefacility111@gmail.com',
                Status__c=true,
                Organisation__c=org.Id,
                ABN__c='3673232323',
                Phone__c='123123123'
            );
            insert fac;

            insert new Account(Name='Portal Account');

            // Staff__c must match user's email
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff';
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.4139562@hotmail.com';
            staff.Facility__c=fac.Id;
            staff.Address__Street__s='8 Keewong Street';
            staff.Address__City__s = 'Crace';
            staff.Address__StateCode__s='ACT';
            staff.Address__PostalCode__s='2911';
            staff.Emergency_Phone_Number__c='45678766675';
            staff.Primary_Contact_Name__c='Praveen';
            staff.Primary_Contact_Number__c='9908458298';
            staff.Make_Primary_as_Approver__c=true;
            staff.Primary_Contact_Email__c='praveenshesham.sp@gmail.com';
            staff.Secondary_Contact_Name__c='maheswari';
            staff.Secondary_Contact_Email__c='maheswari.adabala@gmail.com';
            staff.Make_Secondary_as_Approver__c=false;
            staff.Secondary_Contact_Number__c='99084582958';
            staff.Emp_exit_date__c = date.newInstance(2028, 01, 05);
            staff.Emp_Start_Date__c = date.newInstance(2023, 02, 01);
            staff.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
            staff.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
            staff.role__c='Admin';
            staff.Residency_Type__c = 'Australian';
            staff.Expiry_Date__c = date.newInstance(2025,02, 19);
            staff.Type__c = 'Visa Status';
            staff.Working_Hours_Rate__c=50;
            staff.Final_Overall_Rate__c=150;
            staff.Saturday_Hourly_Rate__c = 130;
            staff.Sunday_Hourly_Rate__c = 50;
            staff.Module_Names__c = 'Admin';
            insert staff; 
        }
    } 
    
    @IsTest
    static void testBootstrapSuccess() {

        // Get the mainUser (the one created in @TestSetup)
        User u = [SELECT Id, Name, Email, Phone FROM User WHERE Email='manualtesting.4139562@hotmail.com' LIMIT 1];
        Organisation__c org = [SELECT Id, Name, CometChat_App_ID__c, CometChat_AuthKey__c, CometChat_Region__c, CometChat_Variant_ID__c, CometChat_REST_API_Key__c FROM Organisation__c Where Name = 'Age Grace Innovation PVT LTD' LIMIT 1];
        Staff__c staff = [SELECT Id,Email_Address__c FROM Staff__c WHERE Email_Address__c='manualtesting.4139562@hotmail.com' LIMIT 1];

        Test.startTest();
            System.runAs(u) {
    
                // Build Fake REST Request
                RestRequest req = new RestRequest();
                req.httpMethod = 'GET';
                req.requestUri = '/services/apexrest/CometChatMobile/v2/bootstrap';
    
                RestContext.request = req;
                RestContext.response = new RestResponse();
    
                // Call the method
                CometChatMobileBootstrap.bootstrap();
    
                RestResponse res = RestContext.response;
    
                String body = res.responseBody.toString();
    
                Map<String, Object> json = (Map<String, Object>) JSON.deserializeUntyped(body);
    
                Map<String, Object> userBlock = (Map<String, Object>) json.get('user');
    
                Map<String, Object> orgBlock = (Map<String, Object>) json.get('organisation');
            Test.stopTest();
        }
    } 
    
    @IsTest
    static void testRegisterUidSuccess() {

        User mainUser = [SELECT Id FROM User WHERE Email='manualtesting.4139562@hotmail.com' LIMIT 1];

        System.runAs(mainUser) {
            Test.startTest();

            RestRequest req = new RestRequest();
            req.httpMethod = 'POST';
            req.requestUri = '/services/apexrest/CometChatMobile/v2/registerUid';
            req.requestBody = Blob.valueOf(
                '{"uid":"UID_ABC123","userId":"' + mainUser.Id + '"}'
            );

            RestContext.request = req;
            RestContext.response = new RestResponse();

            CometChatMobileBootstrap.registerUid();

            RestResponse res = RestContext.response;

            System.assertEquals(200, res.statusCode, 'Should return 200');

            Map<String, Object> json =
                (Map<String, Object>) JSON.deserializeUntyped(res.responseBody.toString());

            System.assertEquals(true, json.get('success'));
            System.assertEquals('UID_ABC123', json.get('uid'));

            // Verify record updated
            User updated = [SELECT CometChat_UID__c FROM User WHERE Id=:mainUser.Id];
            System.assertEquals('UID_ABC123', updated.CometChat_UID__c);
            Test.stopTest();
        }
    }

    @IsTest
    static void testRegisterUidMissingUid() {

        User mainUser = [SELECT Id FROM User WHERE Email='manualtesting.4139562@hotmail.com' LIMIT 1];

        System.runAs(mainUser) {
            Test.startTest();

            RestRequest req = new RestRequest();
            req.httpMethod = 'POST';
            req.requestUri = '/services/apexrest/CometChatMobile/v2/registerUid';
            req.requestBody = Blob.valueOf('{"userId":"' + mainUser.Id + '"}'); // NO UID

            RestContext.request = req;
            RestContext.response = new RestResponse();

            CometChatMobileBootstrap.registerUid();

            System.assertEquals(400, RestContext.response.statusCode);
            Test.stopTest();
        }
    }

    @IsTest
    static void testRegisterUidEmptyBody() {

        User mainUser = [SELECT Id FROM User WHERE Email='manualtesting.4139562@hotmail.com' LIMIT 1];

        System.runAs(mainUser) {
            Test.startTest();

            RestRequest req = new RestRequest();
            req.httpMethod = 'POST';
            req.requestUri = '/services/apexrest/CometChatMobile/v2/registerUid';
            req.requestBody = null; // EMPTY

            RestContext.request = req;
            RestContext.response = new RestResponse();

            CometChatMobileBootstrap.registerUid();

            System.assertEquals(400, RestContext.response.statusCode);

            Test.stopTest();
        }
    }  
    
    @IsTest
    static void testBootstrapSuccess1() {

        User mainUser = [
            SELECT Id, Email 
            FROM User 
            WHERE Email = 'manualtesting.4139562@hotmail.com'
            LIMIT 1
        ];

        System.runAs(mainUser) {
            Test.startTest();

            RestRequest req = new RestRequest();
            req.httpMethod = 'GET';
            req.requestUri = '/services/apexrest/CometChatMobile/v2/bootstrap';
            RestContext.request = req;
            RestContext.response = new RestResponse();

            CometChatMobileBootstrap.bootstrap();

            RestResponse res = RestContext.response;

            String body = res.responseBody != null ? res.responseBody.toString() : null;

            Map<String, Object> parsed =
                (Map<String, Object>) JSON.deserializeUntyped(body);

            Map<String, Object> userMap = (Map<String, Object>) parsed.get('user');

            Map<String, Object> orgMap = (Map<String, Object>) parsed.get('organisation');
            Test.stopTest();
        }
    }

    @IsTest
    static void testRegisterUidSuccess1() {

        User mainUser = [
            SELECT Id, Email 
            FROM User 
            WHERE Email = 'manualtesting.4139562@hotmail.com'
            LIMIT 1
        ];

        System.runAs(mainUser) {
            Test.startTest();

            RestRequest req = new RestRequest();
            req.httpMethod = 'POST';
            req.requestUri = '/services/apexrest/CometChatMobile/v2/registerUid';
            req.requestBody = Blob.valueOf(
                '{"uid":"UID_12345","userId":"' + mainUser.Id + '"}'
            );
            RestContext.request = req;
            RestContext.response = new RestResponse();

            CometChatMobileBootstrap.registerUid();

            RestResponse res = RestContext.response;

            String body = res.responseBody != null ? res.responseBody.toString() : null;

            Map<String, Object> parsed =
                (Map<String, Object>) JSON.deserializeUntyped(body);

            // Verify user updated
            User updated = [SELECT CometChat_UID__c FROM User WHERE Id = :mainUser.Id];

            Test.stopTest();
        }
    }

    @IsTest
    static void testRegisterUidMissingUid1() {

        User mainUser = [
            SELECT Id, Email 
            FROM User 
            WHERE Email = 'manualtesting.4139562@hotmail.com'
            LIMIT 1
        ];

        System.runAs(mainUser) {
            Test.startTest();

            RestRequest req = new RestRequest();
            req.httpMethod = 'POST';
            req.requestUri = '/services/apexrest/CometChatMobile/v2/registerUid';
            // No uid in body, only userId
            req.requestBody = Blob.valueOf(
                '{"userId":"' + mainUser.Id + '"}'
            );
            RestContext.request = req;
            RestContext.response = new RestResponse();

            CometChatMobileBootstrap.registerUid();

            Test.stopTest();
        }
    }

    @IsTest
    static void testRegisterUidForbiddenOtherUser() {

        User mainUser = [
            SELECT Id, Email 
            FROM User 
            WHERE Email = 'manualtesting.4139562@hotmail.com'
            LIMIT 1
        ];

        // Grab some other active user from setup (one of the testuser1/testuser2)
        User otherUser = [
            SELECT Id 
            FROM User 
            WHERE Id != :mainUser.Id
            LIMIT 1
        ];

        System.runAs(mainUser) {
            Test.startTest();

            RestRequest req = new RestRequest();
            req.httpMethod = 'POST';
            req.requestUri = '/services/apexrest/CometChatMobile/v2/registerUid';
            req.requestBody = Blob.valueOf(
                '{"uid":"UID_XYZ","userId":"' + otherUser.Id + '"}'
            );
            RestContext.request = req;
            RestContext.response = new RestResponse();

            CometChatMobileBootstrap.registerUid();

            Test.stopTest();
        }
    }

    @IsTest
    static void testRegisterUidEmptyBody1() {

        User mainUser = [
            SELECT Id, Email 
            FROM User 
            WHERE Email = 'manualtesting.4139562@hotmail.com'
            LIMIT 1
        ];

        System.runAs(mainUser) {
            Test.startTest();

            RestRequest req = new RestRequest();
            req.httpMethod = 'POST';
            req.requestUri = '/services/apexrest/CometChatMobile/v2/registerUid';
            req.requestBody = null; // empty
            RestContext.request = req;
            RestContext.response = new RestResponse();

            CometChatMobileBootstrap.registerUid();

            Test.stopTest();
        }
    }

	// -------------------------------------------
    // Mock Response: 201 Success
    // -------------------------------------------
    private class CometChatUserSuccessMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(201);
            res.setBody('{"message":"User created"}');
            return res;
        }
    }

    // -------------------------------------------
    // Mock Response: 409 Already Exists
    // -------------------------------------------
    private class CometChatUserExistsMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(409);
            res.setBody('{"message":"User already exists"}');
            return res;
        }
    }

    // -------------------------------------------
    // Mock Response: 500 Error
    // -------------------------------------------
    private class CometChatUserErrorMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(500);
            res.setBody('{"error":"Server error"}');
            return res;
        }
    }
    
    
    @IsTest
    static void testCreateUserSuccess2() {

        User u = [SELECT Id, Name, Email, Phone 
                  FROM User 
                  WHERE Email='manualtesting.4139562@hotmail.com' LIMIT 1];

        Organisation__c org = [
            SELECT Id, Name, CometChat_App_ID__c, CometChat_Region__c, CometChat_REST_API_Key__c
            FROM Organisation__c 
            WHERE Name='Age Grace Innovation PVT LTD' LIMIT 1
        ];

        Staff__c staff = [
            SELECT Picture__c 
            FROM Staff__c 
            WHERE Email_Address__c='manualtesting.4139562@hotmail.com' LIMIT 1
        ];

        Test.setMock(HttpCalloutMock.class, new CometChatUserSuccessMock());

        Test.startTest();
        System.runAs(u) {
            CometChatMobileBootstrap.createCometChatUser(
                'UID_201',
                u,
                org,
                'default',
                staff.Picture__c
            );
        }
        Test.stopTest();
    }
}