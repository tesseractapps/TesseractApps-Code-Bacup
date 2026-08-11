@IsTest
private class TessaAiControllerTest {

    /*
     * Mock for successful HTTP responses
     */
    private class SuccessMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {

            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');

            if (req.getEndpoint().contains('/auth/sf-login')) {

                res.setStatusCode(200);
                res.setBody(
                    '{"token":"test-token",' +
                    '"user":{"id":"123","name":"Test User"}}'
                );

            } else {

                res.setStatusCode(200);
                res.setBody(
                    '{"success":true,"message":"Chat received"}'
                );
            }

            return res;
        }
    }

    /*
     * Mock for failed authentication
     */
    private class FailureMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {

            HttpResponse res = new HttpResponse();
            res.setStatusCode(401);
            res.setBody('Unauthorized');
            return res;
        }
    }

    /*
     * Creates test data
     */
    private static User createUser() {

         //system.debug(org.name);
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.20294637@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne209463', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', 
                             User_Type__c='NDIS Org Admin', UserName='manualtesting.20294637@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        insert user;

        return user;
    }

    private static void createTestRecords(User u) {

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
       
        u.Organization_Name__c = org.Name;
        update u;

        Facility__c fac = new Facility__c();
            fac.Name='Ashfield Consultants';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Address__CountryCode__s='AU';
            fac.Email__c= 'testonefacility@gmail.com';
            fac.Status__c=true;
            fac.Organisation__c= org.Id;
            fac.ABN__c='12345678912';
            fac.Phone__c = '12323432';
            fac.Phone__c = '12323432';
            fac.Type_of_Service__c='Ndis';
            insert fac;
            
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff'; 
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.20294637@hotmail.com';
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
            staff.Status__c = true;
            insert staff; 

            Staff_Facility__c sf = new Staff_Facility__c(
                Staff__c = staff.Id,
                Facility__c = fac.Id,
                Active__c = true
            );
            insert sf;

        // Optional if object exists in your org
        try {

            Facility_Association__c fa = new Facility_Association__c(
                Staff__c = staff.Id,
                Facility__c = fac.Id,
                Active__c = true
            );

            insert fa;

        } catch (Exception e) {
            // Ignore if object/fields unavailable
        }
    }

    @IsTest
    static void testGetAuthTokenSuccess() {

        User u = createUser();
        createTestRecords(u);

        Test.setMock(HttpCalloutMock.class, new SuccessMock());

        Test.startTest();

        System.runAs(u) {

            String response = TessaAiController.getAuthToken();

            System.assertNotEquals(null, response);

            Map<String,Object> result =
                (Map<String,Object>)JSON.deserializeUntyped(response);

            System.assert(result.containsKey('token'));

            Map<String,Object> user =
                (Map<String,Object>)result.get('user');

        }

        Test.stopTest();
    }

    @IsTest
    static void testGetAuthTokenFailure() {

        User u = createUser();

        Test.setMock(HttpCalloutMock.class, new FailureMock());

        Test.startTest();

        System.runAs(u) {

            String response = TessaAiController.getAuthToken();

           // System.assert(response.contains('Auth failed'));
        }

        Test.stopTest();
    }

    @IsTest
    static void testSendChatMessage() {

        Test.setMock(HttpCalloutMock.class, new SuccessMock());

        Test.startTest();

        String response = TessaAiController.sendChatMessage(
            'token',
            '/chat',
            '{"message":"Hello"}'
        );

        Test.stopTest();

       //system.assert(response.contains('success'));
    }

    @IsTest
    static void testSendChatMessageException() {

        Test.setMock(HttpCalloutMock.class, new FailureMock());

        Test.startTest();

        String response = TessaAiController.sendChatMessage(
            'token',
            '/chat',
            '{}'
        );

        Test.stopTest();

       // System.assertNotEquals(null, response);
    }
}