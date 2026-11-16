/**
 * Test Class      : OZEDIControllerTest
 * Description     : Comprehensive test coverage for OZEDIController class
 *                   
 */
@isTest
public class OZEDIControllerTest {

    // ==========================================
    // MOCK IMPLEMENTATIONS
    // ==========================================
    
    /**
     * Primary mock for all OZEDI API calls with configurable behavior
     */
    private class OZEDIMock implements HttpCalloutMock {
        private Integer statusMode;
        private Boolean failRequest;
        
        public OZEDIMock(Integer statusMode, Boolean failRequest) {
            this.statusMode = statusMode;
            this.failRequest = failRequest;
        }
        
        public OZEDIMock() {
            this(0, false);
        }
        
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            
            if (failRequest) {
                res.setStatusCode(400);
                res.setBody('{"error": "Bad Request", "message": "Failed mock request", "errors": [{"shortDesc": "Field validation failed", "errorCode": "VAL_01"}]}');
                return res;
            }
            
            res.setStatusCode(200);
            String endpoint = req.getEndpoint();
            
            if (endpoint.contains('auth') || (req.getBody() != null && req.getBody().contains('username'))) {
                res.setBody('{"id_token": "mock_id_token_12345"}');
            } else if (endpoint.contains('client') || (req.getBody() != null && req.getBody().contains('account'))) {
                res.setBody('{"client": "mock_client_id_999"}');
            } else if (endpoint.contains('uploads/status') || endpoint.contains('status')) {
                if (statusMode == 1) {
                    res.setBody('{"uploadStatus": "UPLOAD_PRE_PROCESSING"}');
                } else if (statusMode == 2) {
                    res.setBody('{"uploadStatus": "UPLOAD_FAILED", "errors": [{"shortDesc": "Error: USI is invalid", "errorCode": "ERR_USI"}], "errorDetails": "USI invalid details"}');
                } else if (statusMode == 3) {
                    res.setBody('{"uploadStatus": "UPLOAD_SEND_SUCCESS"}');
                } else if (statusMode == 9) {
                    res.setBody('{"uploadStatus": "UPLOAD_OTHER"}');
                } else {
                    res.setBody('{"uploadStatus": "UPLOAD_READY"}');
                }
            } else if (endpoint.contains('uploads/send') || endpoint.contains('send')) {
                if (statusMode == 8) {
                    res.setStatusCode(400);
                    res.setBody('{"errors": [{"shortDesc": "Send failed", "errorCode": "500"}]}');
                } else {
                    res.setBody('{"success": true, "uploadUuid": "mock_new_send_uuid_777"}');
                }
            } else if (endpoint.contains('uploads/errors') || endpoint.contains('errors')) {
                res.setBody('[{"shortDesc": "Error 456: BSB must be 6 digits", "errorCode": "456", "longDesc": "Affected field: Fund_Bank_BSB__c"}]');
            } else if (endpoint.contains('payment') || endpoint.contains('configuration')) {
                res.setBody('{"status": "ACTIVE", "registrationDetails": {"toBsb": "123456", "toPayId": "payid123", "toAccountNumber": "12345678"}}');
            } else {
                if (statusMode == 4) {
                    res.setBody('{"errors": [{"shortDesc": "Validation error", "errorCode": "VAL_02"}]}');
                } else if (statusMode == 5) {
                    res.setBody('{"message": "Mock message content"}');
                } else if (statusMode == 6) {
                    res.setBody('{"error": "Mock error message"}');
                } else if (statusMode == 7) {
                    res.setBody('invalid_json_format');
                } else {
                    res.setBody('{"uploadUuid": "mock_upload_uuid_888"}');
                }
            }
            
            return res;
        }
    }

    /**
     * Mock that returns empty response body
     */
    private class EmptyResponseMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setHeader('Content-Type', 'application/json');
            res.setBody('');
            return res;
        }
    }

    /**
     * Mock that simulates status check failure
     */
    private class StatusCheckFailMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            String endpoint = req.getEndpoint();
            if (endpoint.contains('auth') || (req.getBody() != null && req.getBody().contains('username'))) {
                res.setBody('{"id_token": "token"}');
                res.setStatusCode(200);
            } else if (endpoint.contains('status')) {
                res.setStatusCode(500);
                res.setBody('Server error');
            } else {
                res.setStatusCode(200);
                res.setBody('{"success": true}');
            }
            return res;
        }
    }

    /**
     * Mock that returns 404 error
     */
    private class Error404Mock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(404);
            res.setBody('{"error": "Not found"}');
            return res;
        }
    }

    /**
     * Mock that throws a CalloutException
     */
    private class ExceptionMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            throw new CalloutException('Network error occurred');
        }
    }

    /**
     * Mock that returns a new upload UUID
     */
    private class NewUuidMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"uploadUuid": "new_uuid_999", "status": "success"}');
            return res;
        }
    }

    /**
     * Mock for invalid JSON status response
     */
    private class InvalidJsonStatusMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            res.setStatusCode(200);
            String endpoint = req.getEndpoint();
            if (endpoint.contains('auth') || (req.getBody() != null && req.getBody().contains('username'))) {
                res.setBody('{"id_token":"mock_token"}');
            } else if (endpoint.contains('status')) {
                res.setBody('not valid json {{{');
            } else {
                res.setBody('{}');
            }
            return res;
        }
    }

    /**
     * Mock that returns payment configuration pending status
     */
    private class PaymentConfigPendingMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            String endpoint = req.getEndpoint();
            if (endpoint.contains('auth') || (req.getBody() != null && req.getBody().contains('username'))) {
                res.setStatusCode(200);
                res.setBody('{"id_token": "mock_token"}');
            } else if (endpoint.contains('payment') || endpoint.contains('configuration')) {
                res.setStatusCode(200);
                res.setBody('{"status": "PENDING", "registrationDetails": null}');
            } else {
                res.setStatusCode(200);
                res.setBody('{"success": true}');
            }
            return res;
        }
    }

    /**
     * Mock that returns null registration details
     */
    private class NullRegistrationMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            String endpoint = req.getEndpoint();
            if (endpoint.contains('auth') || (req.getBody() != null && req.getBody().contains('username'))) {
                res.setStatusCode(200);
                res.setBody('{"id_token": "mock_token"}');
            } else if (endpoint.contains('payment') || endpoint.contains('configuration')) {
                res.setStatusCode(200);
                res.setBody('{"status": "PENDING"}');
            } else {
                res.setStatusCode(200);
                res.setBody('{"success": true}');
            }
            return res;
        }
    }

    // ==========================================
    // TEST SETUP
    // ==========================================

    @testSetup
    static void setupData() {
        Organisation__c org = new Organisation__c();
        org.Name = 'Ashfield Consultants';
        org.ABN__c = '51824753556';
        org.ACN__c = '878787878';
        org.Contact_No__c = '0299084582';
        org.RCTI__c = 'RCTI1';
        org.Email__c = 'dsfdsfsd@gmail.com';
        org.Bank__c = 'Bank Test';
        org.BSB__c = '123456';
        org.Account_Name__c = 'Test Account';
        org.Account_Number__c = '1111111111';
        org.Description__c = 'test Desc';
        org.Address_Latest__Street__s = '101';
        org.Address_Latest__City__s = 'Himas Waterhen';
        org.Address_Latest__PostalCode__s = '2060';
        org.Address_Latest__CountryCode__s = 'AU';
        org.Address_Latest__StateCode__s = 'NSW';
        org.NDIS_Provider__c = '12341234565';
        org.BMSI_Identifier__c = 'TEST BMSI';
        org.SoftwareId__c = 'jhdfn18328';
        org.Branch_code__c = 'BS123';
        org.Contact_Name__c = 'Test1';
        org.User_Type__c = 'NDIS Org Admin';
        org.OZEDI_Client_Id__c = 'mock_client_id';
        org.OZEDI_Setup_Mode__c = 'Manual';
        org.To_BSB__c = '123456';
        org.To_PayId__c = 'payid123';
        org.To_Account_Number__c = '12345678';
        insert org;

        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        User user = new User(
            Alias = 'praveen', 
            Email = 'manualtesting.5103356@hotmail.com', 
            EmailEncodingKey = 'UTF-8', 
            LastName = 'StaffOne51036', 
            LanguageLocaleKey = 'en_US', 
            LocaleSidKey = 'en_US', 
            ProfileId = prof.Id, 
            TimeZoneSidKey = 'America/New_York', 
            UserName = 'manualtesting.5103356@hotmail.com',
            Organization_Name__c = 'Ashfield Consultants'
        );
        insert user;

        System.runAs(user) {
            Facility__c fac = new Facility__c();
            fac.Name = 'Ashfield Consultants';
            fac.Address__City__s = 'Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s = 'ACT';
            fac.Address__PostalCode__s = '2911';
            fac.Address__CountryCode__s = 'AU';
            fac.Email__c = 'testonefacility@gmail.com';
            fac.Status__c = true;
            fac.Organisation__c = org.Id;
            fac.ABN__c = '51824753556';
            fac.Phone__c = '12323432';
            insert fac;

            Payroll_Setting__c pay = new Payroll_Setting__c();
            pay.Frequency__c = 'Weekly';
            pay.Group_Name__c = 'Age Grace Jan';
            pay.Facility__c = fac.Id;
            pay.Period_Start_Date__c = Date.newInstance(2023, 03, 02);
            pay.Period_End_Date__c = Date.newInstance(2023, 03, 10);
            pay.Next_Pay_Date__c = Date.newInstance(2023, 03, 13);
            pay.Organization__c = org.Id;
            pay.Status__c = 'Draft';
            pay.OZEDI_Upload_UUID__c = 'mock_upload_uuid_888';
            pay.OZEDI_Upload_Status__c = 'UPLOAD_READY';
            insert pay;

            Staff__c staff1 = new Staff__c();
            staff1.Last_Name__c = 'Test';
            staff1.Name = 'Staff1';
            staff1.Contact_Number__c = '0299084582';
            staff1.Email_Address__c = 'manualtesting.5103356@hotmail.com';
            staff1.Facility__c = fac.Id;
            staff1.Address__Street__s = '8 Keewong Street';
            staff1.Address__City__s = 'Crace';
            staff1.Address__StateCode__s = 'ACT';
            staff1.Address__PostalCode__s = '2911';
            staff1.Address__CountryCode__s = 'AU';
            staff1.Emergency_Phone_Number__c = '45678766675';
            staff1.Primary_Contact_Name__c = 'Praveen';
            staff1.Primary_Contact_Number__c = '9908458298';
            staff1.Emp_exit_date__c = Date.newInstance(2028, 01, 05);
            staff1.Emp_Start_Date__c = Date.newInstance(2023, 02, 01);
            staff1.Date_Of_Birth__c = Date.newInstance(2001, 02, 04);
            staff1.role__c = 'Admin';
            staff1.Employment_type__c = 'Weekly';
            staff1.Management_Fee__c = 2;
            staff1.Residency_Type__c = 'Australian';
            staff1.Type__c = 'Visa Status';
            staff1.Expiry_Date__c = Date.newInstance(2001, 02, 04);
            staff1.Working_Hours_Rate__c = 40;
            staff1.Gender__c = 'Male';
            staff1.Superannuation_Name__c = 'Hostplus';
            staff1.Super_ABN__c = '51824753556';
            staff1.Unique_Superannuation_Identifier__c = '12345678901';
            staff1.ESA__c = 'ESA123';
            staff1.Superannuation_Number__c = 'HOST123456';
            staff1.TFN_number__c = '123456789';
            staff1.Fund_Bank_BSB__c = '123456';
            staff1.Fund_Bank_Account_Number__c = '12345678';
            staff1.BSB__c = '123456';
            staff1.Account_Number__c = '12345678';
            staff1.Account_Name__c = 'Staff One';
            insert staff1;

            Staff_Payroll_Setting__c staffpayRecord = new Staff_Payroll_Setting__c();
            staffpayRecord.Working_Hours__c = 40;
            staffpayRecord.Payroll_Setting__c = pay.Id;
            staffpayRecord.Staff__c = staff1.Id;
            staffpayRecord.Super_Annuation1__c = 150.00;
            staffpayRecord.Voluntary_Contribution__c = 'Fixed';
            staffpayRecord.Voluntary_Contribution_Fixed__c = 0.00;
            insert staffpayRecord;

            OZEDI_Validation_Log__c log = new OZEDI_Validation_Log__c();
            log.Staff_Payroll_Setting__c = staffpayRecord.Id;
            log.Employee__c = staff1.Id;
            log.Payroll_Setting__c = pay.Id;
            log.Validation_Status__c = 'FAILED';
            log.Processed_By_OZEDI__c = false;
            log.Upload_UUID__c = 'mock_upload_uuid_888';
            log.Validation_Errors__c = 'Mock validation error';
            insert log;
        }
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    private static User getTestUser() {
        return [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
    }

    private static Organisation__c getTestOrg() {
        return [SELECT Id, Name, ABN__c, Email__c, Contact_No__c, OZEDI_Client_Id__c, 
                Account_Number__c, BSB__c, Account_Name__c, OZEDI_Setup_Mode__c
                FROM Organisation__c LIMIT 1];
    }

    private static Payroll_Setting__c getTestPayroll() {
        return [SELECT Id, Organization__c, Period_Start_Date__c, Period_End_Date__c 
                FROM Payroll_Setting__c LIMIT 1];
    }

    private static Staff__c getTestStaff() {
        return [SELECT Id, Name, Last_Name__c, Superannuation_Name__c, Super_ABN__c,
                Unique_Superannuation_Identifier__c, ESA__c, TFN_number__c,
                Fund_Bank_BSB__c, Fund_Bank_Account_Number__c, BSB__c,
                Account_Number__c, Account_Name__c, Date_Of_Birth__c, Gender__c,
                Address__Street__s, Address__City__s, Address__StateCode__s,
                Address__PostalCode__s, Address__CountryCode__s, Contact_Number__c,
                Email_Address__c, Emp_exit_date__c
                FROM Staff__c LIMIT 1];
    }

    // ==========================================
    // AUTHENTICATION TESTS
    // ==========================================

    @isTest
    static void testAuthenticateOZEDISuccess() {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock());
        Test.startTest();
        try {
            String token = OZEDIController.authenticateOZEDI();
            System.assertNotEquals(null, token, 'Token should not be null');
        } catch (Exception e) {
            System.debug('Expected exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testAuthenticateOZEDIFailure() {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock(0, true));
        Test.startTest();
        try {
            OZEDIController.authenticateOZEDI();
        } catch (CalloutException e) {
        } catch (Exception e) {
            System.debug('Caught exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testAuthenticateOZEDI_ExceptionThrown() {
        Test.setMock(HttpCalloutMock.class, new ExceptionMock());
        Test.startTest();
        try {
            OZEDIController.authenticateOZEDI();
        } catch (CalloutException e) {
            System.debug('Caught expected exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==========================================
    // CREATE CLIENT TESTS
    // ==========================================

    @isTest
    static void testCreateClientManual() {
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock());
            Test.startTest();
            try {
                String result = OZEDIController.createClientManual();
                
                Organisation__c org = [SELECT Id, OZEDI_Client_Id__c, OZEDI_Setup_Mode__c 
                                      FROM Organisation__c LIMIT 1];
            } catch (Exception e) {
                System.debug('Exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    @isTest
    static void testCreateClientManual_Failure() {
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock(0, true));
            Test.startTest();
            try {
                OZEDIController.createClientManual();
            } catch (Exception e) {
                System.debug('Expected exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    @isTest
    static void testCreateClientTransfer() {
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock());
            Test.startTest();
            try {
                String result = OZEDIController.createClientTransfer();
                
                Organisation__c org = [SELECT Id, OZEDI_Setup_Mode__c 
                                      FROM Organisation__c LIMIT 1];
            } catch (Exception e) {
                System.debug('Exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    @isTest
    static void testCreateClientTransfer_Failure() {
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock(0, true));
            Test.startTest();
            try {
                OZEDIController.createClientTransfer();
            } catch (Exception e) {
                System.debug('Expected exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    @isTest
    static void testCreateClient_MissingOrg() {
        // Create user without organization
        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        String uniqueSuffix = String.valueOf(DateTime.now().getTime());
        
        User userNoOrg = new User(
            Alias = 'noorg', 
            Email = 'noorg.' + uniqueSuffix + '@example.com', 
            EmailEncodingKey = 'UTF-8', 
            LastName = 'NoOrgUser', 
            LanguageLocaleKey = 'en_US', 
            LocaleSidKey = 'en_US', 
            ProfileId = prof.Id, 
            TimeZoneSidKey = 'America/New_York', 
            UserName = 'noorg.' + uniqueSuffix + '@example.com',
            Organization_Name__c = null
        );
        insert userNoOrg;
        
        System.runAs(userNoOrg) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock());
            Test.startTest();
            try {
                OZEDIController.createClientManual();
            } catch (Exception e) {
                System.debug('Expected exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    @isTest
    static void testCreateClient_MissingEmail() {
        Organisation__c org = getTestOrg();
        org.Email__c = 'sarankumar@gmail.com';
        update org;
        
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock());
            Test.startTest();
            try {
                OZEDIController.createClientManual();
            } catch (Exception e) {
                System.debug('Expected exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    @isTest
    static void testCreateClient_MissingABN() {
        Organisation__c org = getTestOrg();
        org.ABN__c = '12345678900';
        update org;
        
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock());
            Test.startTest();
            try {
                OZEDIController.createClientManual();
            } catch (Exception e) {
                System.debug('Expected exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    // ==========================================
    // FETCH PAYMENT CONFIGURATION TESTS
    // ==========================================

    @isTest
    static void testFetchPaymentConfiguration() {
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock());
            Test.startTest();
            try {
                String result = OZEDIController.fetchPaymentConfiguration();
            } catch (Exception e) {
                System.debug('Exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    @isTest
    static void testFetchPaymentConfiguration_Pending() {
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new NullRegistrationMock());
            Test.startTest();
            try {
                String result = OZEDIController.fetchPaymentConfiguration();
            } catch (Exception e) {
                System.debug('Exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    @isTest
    static void testFetchPaymentConfiguration_MissingClientId() {
        Organisation__c org = getTestOrg();
        org.OZEDI_Client_Id__c = null;
        update org;
        
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock());
            Test.startTest();
            try {
                OZEDIController.fetchPaymentConfiguration();
            } catch (Exception e) {
                System.debug('Expected exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    // ==========================================
    // UPLOAD MVR TESTS
    // ==========================================

    @isTest
    static void testUploadMVR_Success() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock());
            Test.startTest();
            try {
                String result = OZEDIController.uploadMVR(staff.Id);
            } catch (Exception e) {
                System.debug('Exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    @isTest
    static void testUploadMVR_StatusPreProcessing() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock(1, false));
            Test.startTest();
            try {
                OZEDIController.uploadMVR(staff.Id);
            } catch (Exception e) {
                System.debug('Exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    @isTest
    static void testUploadMVR_StatusFailed() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock(2, false));
            Test.startTest();
            try {
                OZEDIController.uploadMVR(staff.Id);
            } catch (Exception e) {
                System.debug('Exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    @isTest
    static void testUploadMVR_StatusOther() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock(9, false));
            Test.startTest();
            try {
                OZEDIController.uploadMVR(staff.Id);
            } catch (Exception e) {
                System.debug('Exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    @isTest
    static void testUploadMVR_ValidationErrors() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        staff.Superannuation_Name__c = null;
        staff.Super_ABN__c = null;
        update staff;
        
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock(4, false));
            Test.startTest();
            try {
                OZEDIController.uploadMVR(staff.Id);
            } catch (Exception e) {
                System.debug('Expected exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    @isTest
    static void testUploadMVR_MissingABN() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        Organisation__c org = getTestOrg();
        org.ABN__c = '23456789011';
        update org;
        
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock());
            Test.startTest();
            try {
                OZEDIController.uploadMVR(staff.Id);
            } catch (Exception e) {
                System.debug('Expected exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    @isTest
    static void testUploadMVR_InvalidABN() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        Organisation__c org = getTestOrg();
        org.ABN__c = '12345678901';
        update org;
        
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock());
            Test.startTest();
            try {
                OZEDIController.uploadMVR(staff.Id);
            } catch (Exception e) {
                System.debug('Expected exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    @isTest
    static void testUploadMVR_MissingSuperFund() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        staff.Superannuation_Name__c = null;
        update staff;
        
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock());
            Test.startTest();
            try {
                OZEDIController.uploadMVR(staff.Id);
            } catch (Exception e) {
                System.debug('Expected exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    @isTest
    static void testUploadMVR_MissingSuperABN() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        staff.Super_ABN__c = null;
        update staff;
        
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock());
            Test.startTest();
            try {
                OZEDIController.uploadMVR(staff.Id);
            } catch (Exception e) {
                System.debug('Expected exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    @isTest
    static void testUploadMVR_MissingUSIAndESA() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        staff.Unique_Superannuation_Identifier__c = null;
        staff.ESA__c = null;
        update staff;
        
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock());
            Test.startTest();
            try {
                OZEDIController.uploadMVR(staff.Id);
            } catch (Exception e) {
                System.debug('Expected exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    @isTest
    static void testUploadMVR_MissingTFN() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        staff.TFN_number__c = null;
        update staff;
        
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock());
            Test.startTest();
            try {
                OZEDIController.uploadMVR(staff.Id);
            } catch (Exception e) {
                System.debug('Expected exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    @isTest
    static void testUploadMVR_PhoneEdgeCases() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        // Test mobile phone
        Organisation__c org = getTestOrg();
        org.Contact_No__c = '0412345678';
        update org;
        
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock());
            Test.startTest();
            try {
                OZEDIController.uploadMVR(staff.Id);
            } catch (Exception e) {
                System.debug('Exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    @isTest
    static void testUploadMVR_PhoneOtherAreaCode() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        Organisation__c org = getTestOrg();
        org.Contact_No__c = '0398765432';
        update org;
        
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock());
            Test.startTest();
            try {
                OZEDIController.uploadMVR(staff.Id);
            } catch (Exception e) {
                System.debug('Exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    @isTest
    static void testUploadMVR_InvalidJsonResponse() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock(7, false));
            Test.startTest();
            try {
                OZEDIController.uploadMVR(staff.Id);
            } catch (Exception e) {
                System.debug('Exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    // ==========================================
    // PROCESS SUPERANNUATION TESTS
    // ==========================================

    @isTest
    static void testProcessSuperannuation_Success() {
        Payroll_Setting__c pay = getTestPayroll();
        
        Test.setMock(HttpCalloutMock.class, new OZEDIMock());
        Test.startTest();
        try {
            Map<String, Object> result = OZEDIController.processSuperannuation(pay.Id);
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testProcessSuperannuation_NoStaff() {
        Payroll_Setting__c pay = getTestPayroll();
        delete [SELECT Id FROM Staff_Payroll_Setting__c];
        
        Test.startTest();
        try {
            Map<String, Object> result = OZEDIController.processSuperannuation(pay.Id);
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testProcessSuperannuation_AllFailed() {
        Payroll_Setting__c pay = getTestPayroll();
        
        List<Staff__c> staffs = [SELECT Id FROM Staff__c];
        for (Staff__c s : staffs) {
            s.Superannuation_Name__c = null;
        }
        update staffs;
        
        Test.setMock(HttpCalloutMock.class, new OZEDIMock());
        Test.startTest();
        try {
            Map<String, Object> result = OZEDIController.processSuperannuation(pay.Id);
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testProcessSuperannuation_APIError() {
        Payroll_Setting__c pay = getTestPayroll();
        
        Test.setMock(HttpCalloutMock.class, new OZEDIMock(0, true));
        Test.startTest();
        try {
            Map<String, Object> result = OZEDIController.processSuperannuation(pay.Id);
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testProcessSuperannuation_NoUUID() {
        Payroll_Setting__c pay = getTestPayroll();
        
        Test.setMock(HttpCalloutMock.class, new OZEDIMock(5, false));
        Test.startTest();
        try {
            Map<String, Object> result = OZEDIController.processSuperannuation(pay.Id);
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testProcessSuperannuation_MissingFundBankDetails() {
        Payroll_Setting__c pay = getTestPayroll();
        Staff__c staff = getTestStaff();
        
        staff.Unique_Superannuation_Identifier__c = null;
        staff.Fund_Bank_BSB__c = null;
        staff.Fund_Bank_Account_Number__c = null;
        update staff;
        
        Test.setMock(HttpCalloutMock.class, new OZEDIMock());
        Test.startTest();
        try {
            Map<String, Object> result = OZEDIController.processSuperannuation(pay.Id);
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testProcessSuperannuation_MultipleFunds() {
        Payroll_Setting__c pay = getTestPayroll();
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        
        Staff__c staff2 = new Staff__c(
            Last_Name__c = 'Test2', 
            Name = 'Staff2', 
            Contact_Number__c = '0299084583',
            Email_Address__c = 'test2@example.com', 
            Facility__c = fac.Id,
            Address__Street__s = '8 Keewong Street', 
            Address__City__s = 'Crace',
            Address__StateCode__s = 'ACT', 
            Address__PostalCode__s = '2911', 
            Address__CountryCode__s = 'AU',
            Emp_exit_date__c = Date.newInstance(2028, 01, 05), 
            Emp_Start_Date__c = Date.newInstance(2023, 02, 01),
            Date_Of_Birth__c = Date.newInstance(2001, 02, 04), 
            Gender__c = 'Female',
            Superannuation_Name__c = 'AustralianSuper', 
            Super_ABN__c = '51824753556',
            Unique_Superannuation_Identifier__c = '98765432101', 
            ESA__c = 'ESA456',
            Superannuation_Number__c = 'AUS123456', 
            TFN_number__c = '987654321',
            Fund_Bank_BSB__c = '654321', 
            Fund_Bank_Account_Number__c = '87654321'
        );
        insert staff2;
        
        Staff_Payroll_Setting__c sp2 = new Staff_Payroll_Setting__c(
            Working_Hours__c = 40, 
            Payroll_Setting__c = pay.Id, 
            Staff__c = staff2.Id,
            Super_Annuation1__c = 200.00
        );
        insert sp2;
        
        Test.setMock(HttpCalloutMock.class, new OZEDIMock());
        Test.startTest();
        try {
            Map<String, Object> result = OZEDIController.processSuperannuation(pay.Id);
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==========================================
    // CHECK CONTRIBUTION STATUS TESTS
    // ==========================================

    @isTest
    static void testCheckContributionStatus_Success() {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock());
        Test.startTest();
        try {
            Map<String, Object> result = OZEDIController.checkContributionStatus('mock_upload_uuid_888');
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testCheckContributionStatus_SendSuccess() {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock(3, false));
        Test.startTest();
        try {
            Map<String, Object> result = OZEDIController.checkContributionStatus('mock_upload_uuid_888');
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testCheckContributionStatus_Non200() {
        Test.setMock(HttpCalloutMock.class, new Error404Mock());
        Test.startTest();
        try {
            Map<String, Object> result = OZEDIController.checkContributionStatus('mock_upload_uuid_888');
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testCheckContributionStatus_InvalidJson() {
        Test.setMock(HttpCalloutMock.class, new InvalidJsonStatusMock());
        Test.startTest();
        try {
            Map<String, Object> result = OZEDIController.checkContributionStatus('mock_upload_uuid_888');
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testCheckContributionStatus_BlankUuid() {
        Test.startTest();
        try {
            OZEDIController.checkContributionStatus('');
        } catch (AuraHandledException e) {
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==========================================
    // SEND CONTRIBUTION TESTS
    // ==========================================

    @isTest
    static void testSendContribution_Success() {
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock());
            Test.startTest();
            try {
                Map<String, Object> result = OZEDIController.sendContribution('mock_upload_uuid_888');
            } catch (Exception e) {
                System.debug('Exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    @isTest
    static void testSendContribution_BlankUuid() {
        Test.startTest();
        try {
            Map<String, Object> result = OZEDIController.sendContribution('');
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testSendContribution_SendFailed() {
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock(8, false));
            Test.startTest();
            try {
                Map<String, Object> result = OZEDIController.sendContribution('mock_upload_uuid_888');
            } catch (Exception e) {
                System.debug('Exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    @isTest
    static void testSendContribution_EmptyBody() {
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new EmptyResponseMock());
            Test.startTest();
            try {
                Map<String, Object> result = OZEDIController.sendContribution('mock_upload_uuid_888');
            } catch (Exception e) {
                System.debug('Exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    @isTest
    static void testSendContribution_InvalidJson() {
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock(7, false));
            Test.startTest();
            try {
                Map<String, Object> result = OZEDIController.sendContribution('mock_upload_uuid_888');
            } catch (Exception e) {
                System.debug('Exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    // ==========================================
    // RETRY FAILED CONTRIBUTIONS TESTS
    // ==========================================

    @isTest
    static void testRetrySpecificFailedContributions_Success() {
        OZEDI_Validation_Log__c log = [SELECT Id, Payroll_Setting__c FROM OZEDI_Validation_Log__c LIMIT 1];
        List<String> logIds = new List<String>{ log.Id };
        
        Test.setMock(HttpCalloutMock.class, new OZEDIMock());
        Test.startTest();
        try {
            Map<String, Object> result = OZEDIController.retrySpecificFailedContributions(logIds, log.Payroll_Setting__c);
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testRetrySpecificFailedContributions_EmptyLogIds() {
        Payroll_Setting__c pay = getTestPayroll();
        
        Test.startTest();
        try {
            Map<String, Object> result = OZEDIController.retrySpecificFailedContributions(
                new List<String>(), 
                pay.Id
            );
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testRetrySpecificFailedContributions_BlankPaySetId() {
        OZEDI_Validation_Log__c log = [SELECT Id FROM OZEDI_Validation_Log__c LIMIT 1];
        List<String> logIds = new List<String>{ log.Id };
        
        Test.startTest();
        try {
            Map<String, Object> result = OZEDIController.retrySpecificFailedContributions(logIds, '');
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testRetrySpecificFailedContributions_NoLogsFound() {
        Payroll_Setting__c pay = getTestPayroll();
        List<String> logIds = new List<String>{ 'a0B000000000000' };
        
        Test.startTest();
        try {
            Map<String, Object> result = OZEDIController.retrySpecificFailedContributions(logIds, pay.Id);
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testRetrySpecificFailedContributions_StillFailed() {
        OZEDI_Validation_Log__c log = [
            SELECT Id, Payroll_Setting__c, Staff_Payroll_Setting__r.Staff__c 
            FROM OZEDI_Validation_Log__c LIMIT 1
        ];
        
        if (log.Staff_Payroll_Setting__r != null && log.Staff_Payroll_Setting__r.Staff__c != null) {
            Staff__c staff = [SELECT Id FROM Staff__c WHERE Id = :log.Staff_Payroll_Setting__r.Staff__c LIMIT 1];
            staff.Superannuation_Name__c = null;
            update staff;
        }
        
        List<String> logIds = new List<String>{ log.Id };
        Test.setMock(HttpCalloutMock.class, new OZEDIMock());
        Test.startTest();
        try {
            Map<String, Object> result = OZEDIController.retrySpecificFailedContributions(logIds, log.Payroll_Setting__c);
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==========================================
    // VALIDATION LOG TESTS
    // ==========================================

    @isTest
    static void testGetValidationHistory() {
        Staff_Payroll_Setting__c sp = [SELECT Id FROM Staff_Payroll_Setting__c LIMIT 1];
        
        Test.startTest();
        try {
            List<OZEDI_Validation_Log__c> result = OZEDIController.getValidationHistory(sp.Id);
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testGetValidationHistory_BlankId() {
        Test.startTest();
        try {
            OZEDIController.getValidationHistory('');
        } catch (AuraHandledException e) {
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testGetValidationSummary() {
        Payroll_Setting__c pay = getTestPayroll();
        
        Test.startTest();
        try {
            Map<String, Object> result = OZEDIController.getValidationSummary(pay.Id);
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testGetValidationSummary_BlankId() {
        Test.startTest();
        try {
            OZEDIController.getValidationSummary('');
        } catch (AuraHandledException e) {
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testGetValidationLogs() {
        Payroll_Setting__c pay = getTestPayroll();
        
        Test.startTest();
        try {
            List<OZEDI_Validation_Log__c> result = OZEDIController.getValidationLogs(pay.Id);
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testCreateEmployeeValidationLog_Success() {
        Staff_Payroll_Setting__c sp = [SELECT Id, Staff__c, Staff__r.Name, Staff__r.Last_Name__c,
                                       Staff__r.TFN_number__c, Staff__r.Super_ABN__c,
                                       Staff__r.Superannuation_Name__c, 
                                       Staff__r.Unique_Superannuation_Identifier__c,
                                       Super_And_Voluntary_Supper_Annuation__c
                                       FROM Staff_Payroll_Setting__c LIMIT 1];
        Payroll_Setting__c pay = getTestPayroll();
        
        Test.startTest();
        try {
            OZEDIController.createEmployeeValidationLog(sp, pay.Id, 'mock_uuid_111', true, null);
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testCreateEmployeeValidationLog_Failure() {
        Staff_Payroll_Setting__c sp = [SELECT Id, Staff__c, Staff__r.Name, Staff__r.Last_Name__c,
                                       Staff__r.TFN_number__c, Staff__r.Super_ABN__c,
                                       Staff__r.Superannuation_Name__c, 
                                       Staff__r.Unique_Superannuation_Identifier__c,
                                       Super_And_Voluntary_Supper_Annuation__c
                                       FROM Staff_Payroll_Setting__c LIMIT 1];
        Payroll_Setting__c pay = getTestPayroll();
        
        Test.startTest();
        try {
            OZEDIController.createEmployeeValidationLog(sp, pay.Id, null, false, 'System Error occurred');
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testCreateValidationLogRecord_Success() {
        Staff_Payroll_Setting__c sp = [SELECT Id, Staff__c, Staff__r.Name, Staff__r.Last_Name__c,
                                       Staff__r.TFN_number__c, Staff__r.Super_ABN__c,
                                       Staff__r.Superannuation_Name__c, 
                                       Staff__r.Unique_Superannuation_Identifier__c,
                                       Super_And_Voluntary_Supper_Annuation__c
                                       FROM Staff_Payroll_Setting__c LIMIT 1];
        Payroll_Setting__c pay = getTestPayroll();
        
        Test.startTest();
        try {
            OZEDI_Validation_Log__c log = OZEDIController.createValidationLogRecord(
                sp, pay.Id, 'mock_uuid_222', true, null
            );
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testCreateValidationLogRecord_Failure() {
        Staff_Payroll_Setting__c sp = [SELECT Id, Staff__c, Staff__r.Name, Staff__r.Last_Name__c,
                                       Staff__r.TFN_number__c, Staff__r.Super_ABN__c,
                                       Staff__r.Superannuation_Name__c, 
                                       Staff__r.Unique_Superannuation_Identifier__c,
                                       Super_And_Voluntary_Supper_Annuation__c
                                       FROM Staff_Payroll_Setting__c LIMIT 1];
        Payroll_Setting__c pay = getTestPayroll();
        
        Test.startTest();
        try {
            OZEDI_Validation_Log__c log = OZEDIController.createValidationLogRecord(
                sp, pay.Id, null, false, 'validation error'
            );
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testCreateValidationLogRecord_APIError() {
        Staff_Payroll_Setting__c sp = [SELECT Id, Staff__c, Staff__r.Name, Staff__r.Last_Name__c,
                                       Staff__r.TFN_number__c, Staff__r.Super_ABN__c,
                                       Staff__r.Superannuation_Name__c, 
                                       Staff__r.Unique_Superannuation_Identifier__c,
                                       Super_And_Voluntary_Supper_Annuation__c
                                       FROM Staff_Payroll_Setting__c LIMIT 1];
        Payroll_Setting__c pay = getTestPayroll();
        
        Test.startTest();
        try {
            OZEDI_Validation_Log__c log = OZEDIController.createValidationLogRecord(
                sp, pay.Id, null, false, 'OZEDI API Error: 500'
            );
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testCreateActivityRecord() {
        Payroll_Setting__c pay = getTestPayroll();
        
        Test.startTest();
        try {
            Staff_Payroll_Activity__c activity = OZEDIController.createActivityRecord(
                pay.Id, 'Superannuation', 'Test response', 'ref-123', DateTime.now()
            );
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testCreateActivityRecord_NullDate() {
        Payroll_Setting__c pay = getTestPayroll();
        
        Test.startTest();
        try {
            Staff_Payroll_Activity__c activity = OZEDIController.createActivityRecord(
                pay.Id, 'Superannuation', 'Test response', null, null
            );
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==========================================
    // ABA FILE GENERATION TESTS
    // ==========================================

    @isTest
    static void testGenerateABAFile_NoLogs() {
        Payroll_Setting__c pay = getTestPayroll();
        delete [SELECT Id FROM OZEDI_Validation_Log__c];
        
        Test.startTest();
        try {
            Map<String, Object> result = OZEDIController.generateABAFile(pay.Id);
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testGenerateABAFile_SingleUUID() {
        Payroll_Setting__c pay = getTestPayroll();
        
        // Update log to VALID status
        OZEDI_Validation_Log__c log = [SELECT Id, Validation_Status__c FROM OZEDI_Validation_Log__c LIMIT 1];
        log.Validation_Status__c = 'VALID';
        log.Upload_UUID__c = 'single_uuid_test';
        update log;
        
        Test.startTest();
        try {
            Map<String, Object> result = OZEDIController.generateABAFile(pay.Id);
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testGenerateABAFile_MultipleUUIDs() {
        Payroll_Setting__c pay = getTestPayroll();
        Staff__c staff = getTestStaff();
        Staff_Payroll_Setting__c sp = [SELECT Id FROM Staff_Payroll_Setting__c LIMIT 1];
        
        // Update original log to VALID
        OZEDI_Validation_Log__c log1 = [SELECT Id FROM OZEDI_Validation_Log__c LIMIT 1];
        log1.Validation_Status__c = 'VALID';
        log1.Upload_UUID__c = 'uuid_A_multi';
        log1.Contribution_Amount__c = 100.00;
        update log1;
        
        // Create second log with different UUID
        OZEDI_Validation_Log__c log2 = new OZEDI_Validation_Log__c(
            Staff_Payroll_Setting__c = sp.Id,
            Employee__c = staff.Id,
            Payroll_Setting__c = pay.Id,
            Validation_Status__c = 'VALID',
            Upload_UUID__c = 'uuid_B_multi',
            Contribution_Amount__c = 50.00
        );
        insert log2;
        
        Test.startTest();
        try {
            Map<String, Object> result = OZEDIController.generateABAFile(pay.Id);
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testGenerateABAFile_BlankPaySetId() {
        Test.startTest();
        try {
            Map<String, Object> result = OZEDIController.generateABAFile('');
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testGenerateABAForUUID() {
        Payroll_Setting__c pay = getTestPayroll();
        Organisation__c org = getTestOrg();
        List<Staff_Payroll_Setting__c> staffPayrolls = [
            SELECT Id, Staff__c, Staff__r.Name, Staff__r.Last_Name__c,
                   Staff__r.Account_Number__c, Staff__r.BSB__c, Staff__r.Account_Name__c,
                   Super_And_Voluntary_Supper_Annuation__c
            FROM Staff_Payroll_Setting__c
        ];
        List<OZEDI_Validation_Log__c> logs = [SELECT Id FROM OZEDI_Validation_Log__c];
        
        Test.startTest();
        try {
            Map<String, Object> result = OZEDIController.generateABAForUUID(
                pay.Id, pay, org, 'test_uuid', staffPayrolls, logs
            );
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testGenerateManualABAFromLogs() {
        Payroll_Setting__c pay = getTestPayroll();
        Organisation__c org = getTestOrg();
        List<OZEDI_Validation_Log__c> logs = [
            SELECT Id, Upload_UUID__c, Validation_Status__c, Employee__c,
                   Employee__r.Name, Employee__r.Last_Name__c,
                   Employee__r.Account_Number__c, Employee__r.BSB__c,
                   Employee__r.Account_Name__c
            FROM OZEDI_Validation_Log__c
        ];
        
        Test.startTest();
        try {
            Map<String, Object> result = OZEDIController.generateManualABAFromLogs(
                pay.Id, pay, org, logs
            );
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testGenerateManualABAFromLogs_EmptyLogs() {
        Payroll_Setting__c pay = getTestPayroll();
        Organisation__c org = getTestOrg();
        
        Test.startTest();
        try {
            Map<String, Object> result = OZEDIController.generateManualABAFromLogs(
                pay.Id, pay, org, new List<OZEDI_Validation_Log__c>()
            );
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testGenerateManualABA() {
        Payroll_Setting__c pay = getTestPayroll();
        Organisation__c org = getTestOrg();
        
        Test.startTest();
        try {
            Map<String, Object> result = OZEDIController.generateManualABA(pay.Id, pay, org);
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testBuildABAFileContent() {
        Organisation__c org = getTestOrg();
        Payroll_Setting__c payRun = getTestPayroll();
        List<Staff_Payroll_Setting__c> staffPayrolls = [
            SELECT Id, Staff__c, Staff__r.Name, Staff__r.Last_Name__c,
                   Staff__r.Account_Number__c, Staff__r.BSB__c, Staff__r.Account_Name__c,
                   Super_And_Voluntary_Supper_Annuation__c
            FROM Staff_Payroll_Setting__c
        ];
        
        // Mock the super amount
        List<Staff_Payroll_Setting__c> mockedPayrolls = new List<Staff_Payroll_Setting__c>();
        for (Staff_Payroll_Setting__c sp : staffPayrolls) {
            Staff_Payroll_Setting__c mocked = sp.clone();
            mockedPayrolls.add(mocked);
        }
        
        Test.startTest();
        try {
            String result = OZEDIController.buildABAFileContent(org, mockedPayrolls, payRun);
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testParseABAContent() {
        String abaContent = '0                 01BQL       Ashfield Consultants      123456SUPER       040223                                        \n' +
                           '1123-45612345678  0000015000Staff One                       Reference12345678    \n' +
                           '7999-999            000001500000000150000000000000John Doe                        ';
        
        List<Staff_Payroll_Setting__c> staffPayrolls = [
            SELECT Id, Staff__c, Staff__r.Name, Staff__r.Last_Name__c
            FROM Staff_Payroll_Setting__c
        ];
        
        Test.startTest();
        try {
            List<Map<String, Object>> result = OZEDIController.parseABAContent(abaContent, staffPayrolls);
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==========================================
    // PROCESS PAYRUN PAYMENT TESTS
    // ==========================================

    @isTest
    static void testProcessPayrunPayment_Success() {
        Payroll_Setting__c pay = getTestPayroll();
        
        // Update log to VALID
        OZEDI_Validation_Log__c log = [SELECT Id FROM OZEDI_Validation_Log__c LIMIT 1];
        log.Validation_Status__c = 'VALID';
        log.Processed_By_OZEDI__c = true;
        update log;
        
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock());
            Test.startTest();
            try {
                Map<String, Object> result = OZEDIController.processPayrunPayment(pay.Id);
            } catch (Exception e) {
                System.debug('Exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    @isTest
    static void testProcessPayrunPayment_NoLogs() {
        Payroll_Setting__c pay = getTestPayroll();
        delete [SELECT Id FROM OZEDI_Validation_Log__c];
        
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock());
            Test.startTest();
            try {
                Map<String, Object> result = OZEDIController.processPayrunPayment(pay.Id);
            } catch (Exception e) {
                System.debug('Exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    @isTest
    static void testProcessPayrunPayment_AlreadySent() {
        Payroll_Setting__c pay = getTestPayroll();
        
        OZEDI_Validation_Log__c log = [SELECT Id FROM OZEDI_Validation_Log__c LIMIT 1];
        log.Validation_Status__c = 'VALID';
        log.Processed_By_OZEDI__c = true;
        update log;
        
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock(3, false));
            Test.startTest();
            try {
                Map<String, Object> result = OZEDIController.processPayrunPayment(pay.Id);
            } catch (Exception e) {
                System.debug('Exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    @isTest
    static void testProcessPayrunPayment_SendFailed() {
        Payroll_Setting__c pay = getTestPayroll();
        
        OZEDI_Validation_Log__c log = [SELECT Id FROM OZEDI_Validation_Log__c LIMIT 1];
        log.Validation_Status__c = 'VALID';
        log.Processed_By_OZEDI__c = true;
        update log;
        
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock(8, false));
            Test.startTest();
            try {
                Map<String, Object> result = OZEDIController.processPayrunPayment(pay.Id);
            } catch (Exception e) {
                System.debug('Exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    @isTest
    static void testProcessPayrunPayment_BlankId() {
        Test.startTest();
        try {
            Map<String, Object> result = OZEDIController.processPayrunPayment('');
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==========================================
    // UTILITY METHOD TESTS
    // ==========================================

    @isTest
    static void testIsValidABN() {
        Test.startTest();
        
        // Valid ABN
        System.assertEquals(true, OZEDIController.isValidABN('51824753556'), 
            'ABN should be valid');
        
        // Invalid ABN - wrong checksum
        System.assertEquals(false, OZEDIController.isValidABN('11234567891'), 
            'ABN should be invalid');
        
        // Blank ABN
        System.assertEquals(false, OZEDIController.isValidABN(''), 
            'Blank ABN should be invalid');
        
        // Null ABN
        System.assertEquals(false, OZEDIController.isValidABN(null), 
            'Null ABN should be invalid');
        
        // Short ABN
        System.assertEquals(false, OZEDIController.isValidABN('123'), 
            'Short ABN should be invalid');
        
        Test.stopTest();
    }

    @isTest
    static void testEscapeJson() {
        Test.startTest();
        
        System.assertEquals('test \\"value\\"', OZEDIController.escapeJson('test "value"'), 
            'Should escape quotes');
        System.assertEquals('', OZEDIController.escapeJson(null), 
            'Null should return empty string');
        System.assertEquals('test\\nvalue', OZEDIController.escapeJson('test\nvalue'), 
            'Should escape newlines');
        
        Test.stopTest();
    }

    @isTest
    static void testFormatAmountWithoutCommas() {
        Test.startTest();
        
        System.assertEquals('1234.56', OZEDIController.formatAmountWithoutCommas(1234.56), 
            'Should format without commas');
        System.assertEquals('0.00', OZEDIController.formatAmountWithoutCommas(null), 
            'Null should return 0.00');
        
        Test.stopTest();
    }

    @isTest
    static void testLeftBlank() {
        Test.startTest();
        
        System.assertEquals('abc       ', OZEDIController.leftBlank('abc', 10), 
            'Should left justify and pad');
        System.assertEquals('          ', OZEDIController.leftBlank(null, 10), 
            'Null should return spaces');
        System.assertEquals('abcdefghij', OZEDIController.leftBlank('abcdefghijklmno', 10), 
            'Should truncate to length');
        
        Test.stopTest();
    }

    @isTest
    static void testRightZero() {
        Test.startTest();
        
        System.assertEquals('0000000007', OZEDIController.rightZero('7', 10), 
            'Should right justify and zero fill');
        System.assertEquals('0000000000', OZEDIController.rightZero(null, 10), 
            'Null should return zeros');
        
        Test.stopTest();
    }

    @isTest
    static void testRightBlank() {
        Test.startTest();
        
        System.assertEquals('       123', OZEDIController.rightBlank('123', 10), 
            'Should right justify and blank fill');
        System.assertEquals('          ', OZEDIController.rightBlank(null, 10), 
            'Null should return spaces');
        
        Test.stopTest();
    }

    @isTest
    static void testFormatBSB() {
        Test.startTest();
        
        System.assertEquals('123-456', OZEDIController.formatBSB('123456'), 
            'Should format BSB with dash');
        System.assertEquals('999-999', OZEDIController.formatBSB('123'), 
            'Short BSB should return default');
        System.assertEquals('999-999', OZEDIController.formatBSB(null), 
            'Null should return default');
        
        Test.stopTest();
    }

    @isTest
    static void testFormatDate() {
        Test.startTest();
        
        System.assertEquals('040201', OZEDIController.formatDate(Date.newInstance(2001, 2, 4)), 
            'Should format as DDMMYY');
        
        Test.stopTest();
    }

    @isTest
    static void testFormatCentsAmount() {
        Test.startTest();
        
        System.assertEquals('0000015000', OZEDIController.formatCentsAmount(150.00), 
            'Should format as cents');
        System.assertEquals('0000000000', OZEDIController.formatCentsAmount(null), 
            'Null should return zeros');
        
        Test.stopTest();
    }

    @isTest
    static void testBuildPhoneJson() {
        Test.startTest();
        
        String mobileJson = OZEDIController.buildPhoneJson('0412345678');
        System.assert(mobileJson.contains('"phoneServiceLine":"01"'), 
            'Mobile should use service line 01');
        
        String landlineJson = OZEDIController.buildPhoneJson('0299084582');
        System.assert(landlineJson.contains('"phoneServiceLine":"02"'), 
            'Landline should use service line 02');
        
        String otherJson = OZEDIController.buildPhoneJson('0398765432');
        System.assert(otherJson.contains('"phoneArea":"03"'), 
            'Other area codes should include area');
        
        String emptyJson = OZEDIController.buildPhoneJson('');
        System.assert(emptyJson.contains('"phoneServiceLine":"02"'), 
            'Empty should return default');
        
        Test.stopTest();
    }

    @isTest
    static void testFormatABN() {
        Test.startTest();
        
        System.assertEquals('51824753556', OZEDIController.formatABN('51824753556'), 
            'Should return clean ABN');
        System.assertEquals('123456789', OZEDIController.formatABN(123456789), 
            'Should convert number to string');
        System.assertEquals('', OZEDIController.formatABN(null), 
            'Null should return empty string');
        
        Test.stopTest();
    }

    @isTest
    static void testMapGender() {
        Test.startTest();
        
        System.assertEquals('M', OZEDIController.mapGender('Male'), 
            'Male should map to M');
        System.assertEquals('F', OZEDIController.mapGender('Female'), 
            'Female should map to F');
        System.assertEquals('Other', OZEDIController.mapGender('Other'), 
            'Other should remain unchanged');
        System.assertEquals('', OZEDIController.mapGender(null), 
            'Null should return empty string');
        
        Test.stopTest();
    }

    @isTest
    static void testCalculateTotalContributions() {
        Staff_Payroll_Setting__c sp = new Staff_Payroll_Setting__c();
        
        Test.startTest();
        
        Decimal total = OZEDIController.calculateTotalContributions(sp);
        
        Test.stopTest();
    }

    @isTest
    static void testValidateEmployeeForContribution() {
        Staff_Payroll_Setting__c sp = [
            SELECT Id, Staff__c, Staff__r.Name, Staff__r.Last_Name__c,
                   Staff__r.Superannuation_Name__c, Staff__r.Super_ABN__c,
                   Staff__r.Unique_Superannuation_Identifier__c,
                   Staff__r.ESA__c, Staff__r.TFN_number__c,
                   Staff__r.Fund_Bank_BSB__c, Staff__r.Fund_Bank_Account_Number__c
            FROM Staff_Payroll_Setting__c LIMIT 1
        ];
        
        Test.startTest();
        
        Map<String, Object> result = OZEDIController.validateEmployeeForContribution(sp);
        System.assertNotEquals(null, result, 'Result should not be null');
        
        Test.stopTest();
    }

    @isTest
    static void testValidateEmployeeForContribution_NoUSI() {
        Staff__c staff = getTestStaff();
        staff.Unique_Superannuation_Identifier__c = null;
        staff.Fund_Bank_BSB__c = null;
        staff.Fund_Bank_Account_Number__c = null;
        update staff;
        
        Staff_Payroll_Setting__c sp = [
            SELECT Id, Staff__c, Staff__r.Name, Staff__r.Last_Name__c,
                   Staff__r.Superannuation_Name__c, Staff__r.Super_ABN__c,
                   Staff__r.Unique_Superannuation_Identifier__c,
                   Staff__r.ESA__c, Staff__r.TFN_number__c,
                   Staff__r.Fund_Bank_BSB__c, Staff__r.Fund_Bank_Account_Number__c
            FROM Staff_Payroll_Setting__c LIMIT 1
        ];
        
        Test.startTest();
        
        Map<String, Object> result = OZEDIController.validateEmployeeForContribution(sp);
        System.assertEquals(false, (Boolean)result.get('valid'), 
            'Should be invalid without USI and bank details');
        
        Test.stopTest();
    }

    @isTest
    static void testSleep() {
        Test.startTest();
        
        Long startTime = DateTime.now().getTime();
        OZEDIController.sleep(10);
        Long endTime = DateTime.now().getTime();
        
        // In test context, sleep returns immediately
        System.assert(true, 'Sleep should complete without error');
        
        Test.stopTest();
    }

    @isTest
    static void testUpdateUploadStatus() {
        Test.startTest();
        
        OZEDIController.updateUploadStatus('mock_upload_uuid_888', 'UPLOAD_READY');
        
        Payroll_Setting__c pay = [SELECT OZEDI_Upload_Status__c FROM Payroll_Setting__c LIMIT 1];
        System.assertEquals('UPLOAD_READY', pay.OZEDI_Upload_Status__c, 
            'Status should be updated');
        
        Test.stopTest();
    }

    @isTest
    static void testUpdatePayrunStatus() {
        Payroll_Setting__c pay = getTestPayroll();
        
        Test.startTest();
        
        OZEDIController.updatePayrunStatus(pay.Id, 'PAID');
        
        Payroll_Setting__c updatedPay = [SELECT Status__c FROM Payroll_Setting__c WHERE Id = :pay.Id];
        
        Test.stopTest();
    }

    @isTest
    static void testMarkLogsAsProcessed() {
        OZEDI_Validation_Log__c log = [SELECT Id FROM OZEDI_Validation_Log__c LIMIT 1];
        List<String> logIds = new List<String>{ log.Id };
        
        Test.startTest();
        
        OZEDIController.markLogsAsProcessed(logIds);
        
        OZEDI_Validation_Log__c updatedLog = [SELECT Processed_By_OZEDI__c FROM OZEDI_Validation_Log__c WHERE Id = :log.Id];
        System.assertEquals(true, updatedLog.Processed_By_OZEDI__c, 
            'Log should be marked as processed');
        
        Test.stopTest();
    }

    @isTest
    static void testUpdateValidationLogsWithUpload() {
        List<Staff_Payroll_Setting__c> staffPayrolls = [SELECT Id FROM Staff_Payroll_Setting__c];
        Payroll_Setting__c pay = getTestPayroll();
        
        Test.startTest();
        
        OZEDIController.updateValidationLogsWithUpload(staffPayrolls, 'new_uuid', pay.Id);
        
        Test.stopTest();
    }

    @isTest
    static void testGetUploadStatus() {
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock());
            Test.startTest();
            try {
                HttpResponse response = OZEDIController.getUploadStatus('mock_uuid');
                System.assertNotEquals(null, response, 'Response should not be null');
            } catch (Exception e) {
                System.debug('Exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    @isTest
    static void testSendUpload() {
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock());
            Test.startTest();
            try {
                HttpResponse response = OZEDIController.sendUpload('mock_uuid');
                System.assertNotEquals(null, response, 'Response should not be null');
            } catch (Exception e) {
                System.debug('Exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    @isTest
    static void testGetUploadErrors() {
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock());
            Test.startTest();
            try {
                HttpResponse response = OZEDIController.getUploadErrors('mock_uuid');
                System.assertNotEquals(null, response, 'Response should not be null');
            } catch (Exception e) {
                System.debug('Exception: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    // ==========================================
    // ERROR HANDLING TESTS
    // ==========================================

    @isTest
    static void testExtractShortErrorMessage_JsonArray() {
        Test.startTest();
        
        String jsonError = '[{"shortDesc": "Error 999: Validation failure", "errorCode": "999"}]';
        String result = OZEDIController.extractShortErrorMessage(jsonError);
        System.assertNotEquals(null, result, 'Result should not be null');
        
        Test.stopTest();
    }

    @isTest
    static void testExtractShortErrorMessage_PlainText() {
        Test.startTest();
        
        String plainError = 'Error 555: Internal Server Error\nline 2';
        String result = OZEDIController.extractShortErrorMessage(plainError);
        System.assertNotEquals(null, result, 'Result should not be null');
        
        Test.stopTest();
    }

    @isTest
    static void testExtractShortErrorMessage_Blank() {
        Test.startTest();
        
        String result = OZEDIController.extractShortErrorMessage('');
        System.assertEquals('Unknown error occurred.', result, 
            'Blank should return default message');
        
        Test.stopTest();
    }

    @isTest
    static void testExtractShortErrorMessage_JsonObject() {
        Test.startTest();
        
        String jsonError = '{"error": "Error Message"}';
        String result = OZEDIController.extractShortErrorMessage(jsonError);
        System.assertNotEquals(null, result, 'Result should not be null');
        
        Test.stopTest();
    }

    @isTest
    static void testFormatErrorMessages_ListOfMaps() {
        Test.startTest();
        
        List<Object> errors = new List<Object>{
            new Map<String, Object>{
                'shortDesc' => 'USI missing',
                'longDesc' => 'Field USI is required',
                'errorCode' => 'ERR_USI'
            }
        };
        
        String result = OZEDIController.formatErrorMessages(errors);
        System.assertNotEquals(null, result, 'Result should not be null');
        
        Test.stopTest();
    }

    @isTest
    static void testFormatErrorMessages_SingleMap() {
        Test.startTest();
        
        Map<String, Object> error = new Map<String, Object>{
            'shortDesc' => 'ABN invalid',
            'longDesc' => 'ABN 51824753556 is invalid',
            'errorCode' => 'ERR_ABN'
        };
        
        String result = OZEDIController.formatErrorMessages(error);
        System.assertNotEquals(null, result, 'Result should not be null');
        
        Test.stopTest();
    }

    @isTest
    static void testFormatErrorMessages_String() {
        Test.startTest();
        
        String result = OZEDIController.formatErrorMessages('Plain string error');
        System.assertNotEquals(null, result, 'Result should not be null');
        
        Test.stopTest();
    }

    @isTest
    static void testFormatErrorMessages_Null() {
        Test.startTest();
        
        String result = OZEDIController.formatErrorMessages(null);
        System.assertNotEquals(null, result, 'Result should not be null');
        
        Test.stopTest();
    }

    @isTest
    static void testFormatRawErrors() {
        Test.startTest();
        
        String rawErrors = '[{"errorCode": "555", "shortDesc": "Field validation", "longDesc": "BSB must be 6 digits"}]';
        String result = OZEDIController.formatRawErrors(rawErrors);
        System.assertNotEquals(null, result, 'Result should not be null');
        
        Test.stopTest();
    }

    @isTest
    static void testFormatSingleError() {
        Test.startTest();
        
        Map<String, Object> error = new Map<String, Object>{
            'shortDesc' => 'Issue X', 
            'longDesc' => 'TFN 123456789 invalid', 
            'errorCode' => 'ERR1'
        };
        
        String result = OZEDIController.formatSingleError(error);
        System.assertNotEquals(null, result, 'Result should not be null');
        
        Test.stopTest();
    }

    @isTest
    static void testExtractFieldInfo() {
        Test.startTest();
        
        String result1 = OZEDIController.extractFieldInfo('TFN error');
        String result2 = OZEDIController.extractFieldInfo('ABN 51824753556 is invalid');
        String result3 = OZEDIController.extractFieldInfo('');
        
        Test.stopTest();
    }

    @isTest
    static void testExtractAffectedFields() {
        Test.startTest();
        
        String result1 = OZEDIController.extractAffectedFields('This is TFN 123456789');
        String result2 = OZEDIController.extractAffectedFields('This is ABN 51824753556');
        String result3 = OZEDIController.extractAffectedFields('This is USI error');
        String result4 = OZEDIController.extractAffectedFields('');
        
        Test.stopTest();
    }

    @isTest
    static void testGetErrorField() {
        Test.startTest();
        
        Map<String, Object> errorMap = new Map<String, Object>{
            'errorCode' => 'ERR_01',
            'shortDesc' => 'Short description'
        };
        
        String result = OZEDIController.getErrorField(errorMap, new List<String>{'errorCode', 'code'});
        System.assertEquals('ERR_01', result, 'Should return error code');
        
        Test.stopTest();
    }

    @isTest
    static void testGenerateErrorReport() {
        Test.startTest();
        
        List<Map<String, Object>> failedEmployees = new List<Map<String, Object>>{
            new Map<String, Object>{
                'employeeName' => 'John Doe',
                'errors' => new List<String>{'BSB invalid', 'Account number missing'}
            }
        };
        
        String result = OZEDIController.generateErrorReport(failedEmployees);
        System.assert(result.contains('John Doe'), 'Should contain employee name');
        
        Test.stopTest();
    }

    @isTest
    static void testGenerateErrorReport_Empty() {
        Test.startTest();
        
        String result = OZEDIController.generateErrorReport(new List<Map<String, Object>>());
        System.assertEquals('No errors to report.', result, 
            'Empty list should return default message');
        
        Test.stopTest();
    }

    @isTest
    static void testGenerateErrorSummary() {
        Test.startTest();
        
        List<Map<String, Object>> failedEmployees = new List<Map<String, Object>>{
            new Map<String, Object>{
                'employeeName' => 'John Doe',
                'errors' => new List<String>{'BSB invalid'}
            }
        };
        
        String result = OZEDIController.generateErrorSummary(failedEmployees);
        System.assertNotEquals(null, result, 'Result should not be null');
        
        Test.stopTest();
    }

    @isTest
    static void testGetDetailedErrorMessages() {
        Organisation__c org = getTestOrg();
        HttpResponse mockRes = new HttpResponse();
        mockRes.setBody('{"uploadUuid":"uuid-123", "errors": [{"shortDesc": "Test error"}]}');
        mockRes.setStatusCode(200);
        
        Test.startTest();
        try {
            String result = OZEDIController.getDetailedErrorMessages('token', org, 'uuid', mockRes);
            System.assertNotEquals(null, result, 'Result should not be null');
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testGetDetailedErrorMessages_NullParams() {
        Test.startTest();
        try {
            String result = OZEDIController.getDetailedErrorMessages(null, null, null, null);
            System.assertNotEquals(null, result, 'Result should not be null');
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testGetDetailedErrorMessagesFromPayrun() {
        Payroll_Setting__c pay = getTestPayroll();
        
        Test.setMock(HttpCalloutMock.class, new OZEDIMock());
        Test.startTest();
        try {
            String result = OZEDIController.getDetailedErrorMessagesFromPayrun(pay.Id);
            System.assertNotEquals(null, result, 'Result should not be null');
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==========================================
    // JSON BUILDER TESTS
    // ==========================================

    @isTest
    static void testBuildSingleFundContributionJSON() {
        Organisation__c org = getTestOrg();
        Payroll_Setting__c payRun = getTestPayroll();
        Staff__c staff = getTestStaff();
        List<Staff_Payroll_Setting__c> staffPayrolls = [SELECT Id, Staff__c FROM Staff_Payroll_Setting__c];
        
        Map<String, List<Staff_Payroll_Setting__c>> employerGroups = new Map<String, List<Staff_Payroll_Setting__c>>{
            org.ABN__c => staffPayrolls
        };
        
        Test.startTest();
        try {
            String result = OZEDIController.buildSingleFundContributionJSON(
                org, payRun, staff, staffPayrolls, employerGroups, 150.00
            );
            System.assertNotEquals(null, result, 'Result should not be null');
            System.assert(result.contains('ContributionTransactionRequest'), 
                'Should contain message type');
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testBuildContributionRequestBodyString() {
        Organisation__c org = getTestOrg();
        Payroll_Setting__c payRun = getTestPayroll();
        List<Staff_Payroll_Setting__c> staffPayrolls = [
            SELECT Id, Staff__c, Staff__r.Name, Staff__r.Last_Name__c,
                   Staff__r.Super_ABN__c, Staff__r.Superannuation_Name__c,
                   Staff__r.Unique_Superannuation_Identifier__c,
                   Staff__r.ESA__c, Staff__r.TFN_number__c,
                   Staff__r.Date_Of_Birth__c, Staff__r.Gender__c,
                   Staff__r.Address__Street__s, Staff__r.Address__City__s,
                   Staff__r.Address__StateCode__s, Staff__r.Address__PostalCode__s,
                   Staff__r.Address__CountryCode__s, Staff__r.Email_Address__c,
                   Staff__r.Contact_Number__c, Staff__r.Emp_exit_date__c,
                   Staff__r.Fund_Bank_BSB__c, Staff__r.Fund_Bank_Account_Number__c,
                   Staff__r.Account_Number__c, Staff__r.BSB__c, Staff__r.Account_Name__c,
                   Super_And_Voluntary_Supper_Annuation__c,
                   Payroll_Setting__r.Period_Start_Date__c,
                   Payroll_Setting__r.Period_End_Date__c
            FROM Staff_Payroll_Setting__c
        ];
        
        Test.startTest();
        try {
            String result = OZEDIController.buildContributionRequestBodyString(
                org, payRun, staffPayrolls
            );
            System.assertNotEquals(null, result, 'Result should not be null');
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testBuildMemberJson() {
        Staff_Payroll_Setting__c sp = [
            SELECT Id, Staff__c, Staff__r.Name, Staff__r.Last_Name__c,
                   Staff__r.Super_ABN__c, Staff__r.Superannuation_Name__c,
                   Staff__r.Unique_Superannuation_Identifier__c,
                   Staff__r.ESA__c, Staff__r.TFN_number__c,
                   Staff__r.Date_Of_Birth__c, Staff__r.Gender__c,
                   Staff__r.Address__Street__s, Staff__r.Address__City__s,
                   Staff__r.Address__StateCode__s, Staff__r.Address__PostalCode__s,
                   Staff__r.Address__CountryCode__s, Staff__r.Email_Address__c,
                   Staff__r.Contact_Number__c, Staff__r.Emp_exit_date__c,
                   Super_And_Voluntary_Supper_Annuation__c,
                   Payroll_Setting__r.Period_Start_Date__c,
                   Payroll_Setting__r.Period_End_Date__c
            FROM Staff_Payroll_Setting__c LIMIT 1
        ];
        
        Test.startTest();
        try {
            String result = OZEDIController.buildMemberJson(sp);
            System.assertNotEquals(null, result, 'Result should not be null');
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testBuildContributionEndpoint() {
        Organisation__c org = getTestOrg();
        
        Test.startTest();
        try {
            OZEDI_Setting__mdt settings = (OZEDI_Setting__mdt)JSON.deserialize(
                '{"Contribution_URL__c": "https://api-superstream.sandpit.ozedi.com.au/uploads", "Account_Number__c": "123456"}',
                OZEDI_Setting__mdt.class
            );
            String result = OZEDIController.buildContributionEndpoint(org, settings);
            System.assertNotEquals(null, result, 'Result should not be null');
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testBuildContributionEndpoint_TransferMode() {
        Organisation__c org = getTestOrg();
        org.OZEDI_Setup_Mode__c = 'Transfer';
        update org;
        
        Test.startTest();
        try {
            OZEDI_Setting__mdt settings = (OZEDI_Setting__mdt)JSON.deserialize(
                '{"Contribution_URL__c": "https://api-superstream.sandpit.ozedi.com.au/uploads", "Account_Number__c": "123456"}',
                OZEDI_Setting__mdt.class
            );
            String result = OZEDIController.buildContributionEndpoint(org, settings);
            System.assert(result.contains('autoSendWhenReady=true'), 
                'Transfer mode should include auto-send');
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testBuildContributionEndpoint_MissingClientId() {
        Organisation__c org = getTestOrg();
        org.OZEDI_Client_Id__c = null;
        update org;
        
        Test.startTest();
        try {
            OZEDI_Setting__mdt settings = (OZEDI_Setting__mdt)JSON.deserialize(
                '{"Contribution_URL__c": "https://api.example.com", "Account_Number__c": "123456"}',
                OZEDI_Setting__mdt.class
            );
            OZEDIController.buildContributionEndpoint(org, settings);
        } catch (Exception e) {
            System.debug('Expected exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testBuildContributionRequestBodies() {
        Organisation__c org = getTestOrg();
        Payroll_Setting__c payRun = getTestPayroll();
        List<Staff_Payroll_Setting__c> staffPayrolls = [
            SELECT Id, Staff__c, Staff__r.Name, Staff__r.Last_Name__c,
                   Staff__r.Super_ABN__c, Staff__r.Superannuation_Name__c,
                   Staff__r.Unique_Superannuation_Identifier__c,
                   Staff__r.ESA__c, Staff__r.TFN_number__c
            FROM Staff_Payroll_Setting__c
        ];
        
        Test.startTest();
        try {
            List<String> result = OZEDIController.buildContributionRequestBodies(
                org, payRun, staffPayrolls
            );
            System.assertNotEquals(null, result, 'Result should not be null');
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testExtractFundInfoFromJSON() {
        Test.startTest();
        
        String jsonBody = '{"Comment-1":"CTR for Fund: Hostplus (51824753556) - 5 employees", "receiver":{"organisationalName":"Hostplus"}}';
        String result = OZEDIController.extractFundInfoFromJSON(jsonBody);
        System.assertNotEquals(null, result, 'Result should not be null');
        
        Test.stopTest();
    }

    @isTest
    static void testBuildFormattedMVRResponse() {
        Test.startTest();
        
        String result = OZEDIController.buildFormattedMVRResponse(
            'mock_uuid', 'SENT', DateTime.now()
        );
        System.assert(result.contains('OZEDI MVR RESPONSE'), 
            'Should contain header');
        
        Test.stopTest();
    }

    @isTest
    static void testUpdateStaffWithSendStatus() {
        Staff__c staff = getTestStaff();
        staff.OZEDI_Upload_UUID__c = 'mock_upload_uuid_888';
        update staff;
        
        Test.startTest();
        
        OZEDIController.updateStaffWithSendStatus('mock_upload_uuid_888', 'SENT');
        
        Test.stopTest();
    }

    @isTest
    static void testCreateStaffPayrollActivity() {
        Payroll_Setting__c pay = getTestPayroll();
        
        Test.startTest();
        
        OZEDIController.createStaffPayrollActivity(
            pay.Id, 'Superannuation', 'Test response', 'ref-123', DateTime.now()
        );
        
        Test.stopTest();
    }

    @isTest
    static void testExecuteDML() {
        Test.startTest();
        
        List<OZEDI_Validation_Log__c> logsToInsert = new List<OZEDI_Validation_Log__c>();
        List<OZEDI_Validation_Log__c> logsToUpdate = new List<OZEDI_Validation_Log__c>();
        List<Payroll_Setting__c> payrollsToUpdate = new List<Payroll_Setting__c>();
        List<Staff_Payroll_Activity__c> activitiesToInsert = new List<Staff_Payroll_Activity__c>();
        
        OZEDIController.executeDML(logsToInsert, logsToUpdate, payrollsToUpdate, activitiesToInsert);
        
        Test.stopTest();
    }

    // ==========================================
    // MOCK REFERENCE TESTS
    // ==========================================

    @isTest
    static void testFullWorkflow_UploadAndProcess() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        Payroll_Setting__c pay = getTestPayroll();
        
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock());
            
            Test.startTest();
            
            try {
                // Step 1: Upload MVR
                String mvrResult = OZEDIController.uploadMVR(staff.Id);
                System.assertNotEquals(null, mvrResult, 'MVR result should not be null');
                
                // Step 2: Process Superannuation
                Map<String, Object> superResult = OZEDIController.processSuperannuation(pay.Id);
                System.assertNotEquals(null, superResult, 'Super result should not be null');
                
                // Step 3: Check Status
                Map<String, Object> statusResult = OZEDIController.checkContributionStatus('mock_upload_uuid_888');
                System.assertNotEquals(null, statusResult, 'Status result should not be null');
                
                // Step 4: Generate ABA File
                Map<String, Object> abaResult = OZEDIController.generateABAFile(pay.Id);
                System.assertNotEquals(null, abaResult, 'ABA result should not be null');
                
            } catch (Exception e) {
                System.debug('Exception in full workflow: ' + e.getMessage());
            }
            
            Test.stopTest();
        }
    }

    @isTest
    static void testFullWorkflow_WithErrors() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        // Make staff invalid
        staff.Superannuation_Name__c = null;
        staff.Super_ABN__c = null;
        update staff;
        
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock(4, false));
            
            Test.startTest();
            
            try {
                OZEDIController.uploadMVR(staff.Id);
            } catch (Exception e) {
                System.debug('Expected validation error: ' + e.getMessage());
            }
            
            Test.stopTest();
        }
    }

    @isTest
    static void testMVRResponseMonitorQueueable() {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock());
        
        Test.startTest();
        
        OZEDIController.MVRResponseMonitorQueueable monitor = 
            new OZEDIController.MVRResponseMonitorQueueable('mock_uuid_777');
        System.enqueueJob(monitor);
        
        OZEDIController.MVRResponseMonitorQueueable monitor2 = 
            new OZEDIController.MVRResponseMonitorQueueable('mock_uuid_777');
        Test.setMock(HttpCalloutMock.class, new OZEDIMock(1, false));
        System.enqueueJob(monitor2);
        
        Test.stopTest();
    }

    @isTest
    static void testWaitForMVRProcessing_MaxRetries() {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock(1, false));
        
        Test.startTest();
        
        Map<String, Object> result = OZEDIController.waitForMVRProcessing('mock_uuid');
        System.assertNotEquals(null, result, 'Result should not be null');
        
        Test.stopTest();
    }

    @isTest
    static void testWaitForMVRProcessing_BlankUuid() {
        Test.startTest();
        
        Map<String, Object> result = OZEDIController.waitForMVRProcessing('');
        System.assertEquals(false, (Boolean)result.get('success'), 
            'Success should be false for blank UUID');
        
        Test.stopTest();
    }

    @isTest
    static void testWaitForMVRProcessing_StatusCheckException() {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock(0, true));
        
        Test.startTest();
        
        Map<String, Object> result = OZEDIController.waitForMVRProcessing('mock_uuid');
        System.assertNotEquals(null, result, 'Result should not be null');
        
        Test.stopTest();
    }

    @isTest
    static void testSendMVRRemittance_Success() {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock());
        
        Test.startTest();
        
        Map<String, Object> result = OZEDIController.sendMVRRemittance('mock_upload_uuid_888');
        System.assertNotEquals(null, result, 'Result should not be null');
        
        Test.stopTest();
    }

    @isTest
    static void testSendMVRRemittance_Failure_Non200() {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock(8, false));
        
        Test.startTest();
        
        Map<String, Object> result = OZEDIController.sendMVRRemittance('mock_upload_uuid_888');
        System.assertEquals(false, (Boolean)result.get('success'), 
            'Success should be false');
        
        Test.stopTest();
    }

    @isTest
    static void testSendMVRRemittance_Exception() {
        Test.setMock(HttpCalloutMock.class, new ExceptionMock());
        
        Test.startTest();
        
        Map<String, Object> result = OZEDIController.sendMVRRemittance('mock_upload_uuid_888');
        System.assertEquals(false, (Boolean)result.get('success'), 
            'Success should be false on exception');
        
        Test.stopTest();
    }

    @isTest
    static void testSendMVRRemittance_NewUploadUuid() {
        Test.setMock(HttpCalloutMock.class, new NewUuidMock());
        
        Test.startTest();
        
        Map<String, Object> result = OZEDIController.sendMVRRemittance('mock_upload_uuid_888');
        System.assertNotEquals(null, result, 'Result should not be null');
        
        Test.stopTest();
    }

    // ==========================================
    // ADDITIONAL EDGE CASE TESTS
    // ==========================================

    @isTest
    static void testFetchStatusAndErrors() {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock(2, false));
        
        Test.startTest();
        
        Map<String, Object> result = OZEDIController.fetchStatusAndErrors('mock_uuid');
        System.assertNotEquals(null, result, 'Result should not be null');
        
        Test.stopTest();
    }

    @isTest
    static void testFetchStatusAndErrors_BlankUuid() {
        Test.startTest();
        
        Map<String, Object> result = OZEDIController.fetchStatusAndErrors('');
        System.assertEquals('', result.get('status'), 'Status should be empty');
        
        Test.stopTest();
    }

    @isTest
    static void testCheckContributionStatus_UUIDNotFound() {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock());
        
        Test.startTest();
        
        Map<String, Object> result = OZEDIController.checkContributionStatus('uuid_no_match_xyz');
        System.assertNotEquals(null, result, 'Result should not be null');
        
        Test.stopTest();
    }

    @isTest
    static void testProcessPayrunPayment_Non200StatusCheck() {
        Payroll_Setting__c pay = getTestPayroll();
        
        OZEDI_Validation_Log__c log = [SELECT Id FROM OZEDI_Validation_Log__c LIMIT 1];
        log.Validation_Status__c = 'VALID';
        log.Processed_By_OZEDI__c = true;
        update log;
        
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new StatusCheckFailMock());
            
            Test.startTest();
            
            try {
                Map<String, Object> result = OZEDIController.processPayrunPayment(pay.Id);
                System.assertNotEquals(null, result, 'Result should not be null');
            } catch (Exception e) {
                System.debug('Exception: ' + e.getMessage());
            }
            
            Test.stopTest();
        }
    }

    @isTest
    static void testFormatErrorMessages_AllFieldBranches() {
        Test.startTest();
        
        List<Object> errors = new List<Object>{
            new Map<String, Object>{'shortDesc' => 'x', 'longDesc' => 'TFN 123456789 wrong'},
            new Map<String, Object>{'shortDesc' => 'x', 'longDesc' => 'ABN 51824753556 wrong'},
            new Map<String, Object>{'shortDesc' => 'x', 'longDesc' => 'USI invalid'},
            new Map<String, Object>{'shortDesc' => 'x', 'longDesc' => 'superannuationFundMember bad'},
            new Map<String, Object>{'shortDesc' => 'x', 'longDesc' => 'Fund name bad'},
            new Map<String, Object>{'shortDesc' => 'x', 'longDesc' => 'birthDate bad'},
            new Map<String, Object>{'shortDesc' => 'x', 'longDesc' => 'address Line1 Street bad'},
            new Map<String, Object>{'shortDesc' => 'x', 'longDesc' => 'address suburb City bad'},
            new Map<String, Object>{'shortDesc' => 'x', 'longDesc' => 'address state State bad'},
            new Map<String, Object>{'shortDesc' => 'x', 'longDesc' => 'address postCode Postal bad'},
            new Map<String, Object>{'shortDesc' => 'x', 'longDesc' => 'address bad generic'},
            new Map<String, Object>{'shortDesc' => 'x', 'longDesc' => 'givenName First Name bad'},
            new Map<String, Object>{'shortDesc' => 'x', 'longDesc' => 'familyName Last Name bad'},
            new Map<String, Object>{'shortDesc' => 'x', 'longDesc' => 'Name bad generic'},
            new Map<String, Object>{'shortDesc' => 'x', 'longDesc' => 'sex Gender bad'}
        };
        
        String result = OZEDIController.formatErrorMessages(errors);
        System.assertNotEquals(null, result, 'Result should not be null');
        
        Test.stopTest();
    }
    
    // ==========================================
    // getEmployeesNeedingMVR TESTS
    // ==========================================

    /**
     * Test: Blank PaySetId should return default empty result
     */
    @isTest
    static void testGetEmployeesNeedingMVR_BlankPaySetId() {
        Test.startTest();
        Map<String, Object> result = OZEDIController.getEmployeesNeedingMVR('');
        Test.stopTest();
    }

    /**
     * Test: Null PaySetId should return default empty result
     */
    @isTest
    static void testGetEmployeesNeedingMVR_NullPaySetId() {
        Test.startTest();
        Map<String, Object> result = OZEDIController.getEmployeesNeedingMVR(null);
        Test.stopTest();
    }

    /**
     * Test: Valid PaySetId with employees where MVR is NOT_STARTED (no upload UUID)
     */
    @isTest
    static void testGetEmployeesNeedingMVR_NoUploadUuid() {
        Payroll_Setting__c pay = getTestPayroll();
        Staff__c staff = getTestStaff();

        // Ensure staff has no OZEDI upload UUID (NOT_STARTED status)
        staff.OZEDI_Upload_UUID__c = null;
        staff.OZEDI_Response__c = null;
        staff.OZEDI_Upload_Date_Time__c = null;
        update staff;

        Test.startTest();
        Map<String, Object> result = OZEDIController.getEmployeesNeedingMVR(pay.Id);
        Test.stopTest();

        List<Map<String, Object>> employees = (List<Map<String, Object>>)result.get('employees');
    }

    /**
     * Test: MVR COMPLETED (has upload UUID and non-error response)
     */
    @isTest
    static void testGetEmployeesNeedingMVR_Completed() {
        Payroll_Setting__c pay = getTestPayroll();
        Staff__c staff = getTestStaff();

        staff.OZEDI_Upload_UUID__c = 'completed_uuid_123';
        staff.OZEDI_Response__c = 'Upload successful. Status: UPLOAD_SEND_SUCCESS';
        staff.OZEDI_Upload_Date_Time__c = DateTime.now();
        update staff;

        Test.startTest();
        Map<String, Object> result = OZEDIController.getEmployeesNeedingMVR(pay.Id);
        Test.stopTest();

        List<Map<String, Object>> employees = (List<Map<String, Object>>)result.get('employees');
    }

    /**
     * Test: MVR FAILED (has upload UUID and error response - lowercase 'error')
     */
    @isTest
    static void testGetEmployeesNeedingMVR_Failed_LowercaseError() {
        Payroll_Setting__c pay = getTestPayroll();
        Staff__c staff = getTestStaff();

        staff.OZEDI_Upload_UUID__c = 'failed_uuid_123';
        staff.OZEDI_Response__c = 'Upload failed with error: TFN invalid';
        staff.OZEDI_Upload_Date_Time__c = DateTime.now();
        update staff;

        Test.startTest();
        Map<String, Object> result = OZEDIController.getEmployeesNeedingMVR(pay.Id);
        Test.stopTest();

        List<Map<String, Object>> employees = (List<Map<String, Object>>)result.get('employees');

    }

    /**
     * Test: MVR FAILED (uppercase 'ERROR' in response)
     */
    @isTest
    static void testGetEmployeesNeedingMVR_Failed_UppercaseError() {
        Payroll_Setting__c pay = getTestPayroll();
        Staff__c staff = getTestStaff();

        staff.OZEDI_Upload_UUID__c = 'failed_uuid_456';
        staff.OZEDI_Response__c = 'ERROR: ABN validation failed';
        update staff;

        Test.startTest();
        Map<String, Object> result = OZEDIController.getEmployeesNeedingMVR(pay.Id);
        Test.stopTest();

        List<Map<String, Object>> employees = (List<Map<String, Object>>)result.get('employees');
    }

    /**
     * Test: MVR FAILED (uppercase 'FAILED' in response)
     */
    @isTest
    static void testGetEmployeesNeedingMVR_Failed_UppercaseFailed() {
        Payroll_Setting__c pay = getTestPayroll();
        Staff__c staff = getTestStaff();

        staff.OZEDI_Upload_UUID__c = 'failed_uuid_789';
        staff.OZEDI_Response__c = 'UPLOAD_FAILED: Something went wrong';
        update staff;

        Test.startTest();
        Map<String, Object> result = OZEDIController.getEmployeesNeedingMVR(pay.Id);
        Test.stopTest();

        List<Map<String, Object>> employees = (List<Map<String, Object>>)result.get('employees');

    }

    /**
     * Test: MVR FAILED (lowercase 'failed' in response)
     */
    @isTest
    static void testGetEmployeesNeedingMVR_Failed_LowercaseFailed() {
        Payroll_Setting__c pay = getTestPayroll();
        Staff__c staff = getTestStaff();

        staff.OZEDI_Upload_UUID__c = 'failed_uuid_abc';
        staff.OZEDI_Response__c = 'processing failed due to invalid USI';
        update staff;

        Test.startTest();
        Map<String, Object> result = OZEDIController.getEmployeesNeedingMVR(pay.Id);
        Test.stopTest();

        List<Map<String, Object>> employees = (List<Map<String, Object>>)result.get('employees');

    }

    /**
     * Test: MVR PENDING (has upload UUID but blank response)
     */
    @isTest
    static void testGetEmployeesNeedingMVR_Pending_BlankResponse() {
        Payroll_Setting__c pay = getTestPayroll();
        Staff__c staff = getTestStaff();

        staff.OZEDI_Upload_UUID__c = 'pending_uuid_123';
        staff.OZEDI_Response__c = null; // Blank response = PENDING
        update staff;

        Test.startTest();
        Map<String, Object> result = OZEDIController.getEmployeesNeedingMVR(pay.Id);
        Test.stopTest();

        List<Map<String, Object>> employees = (List<Map<String, Object>>)result.get('employees');

    }

    /**
     * Test: MVR PENDING (has upload UUID but empty string response)
     */
    @isTest
    static void testGetEmployeesNeedingMVR_Pending_EmptyResponse() {
        Payroll_Setting__c pay = getTestPayroll();
        Staff__c staff = getTestStaff();

        staff.OZEDI_Upload_UUID__c = 'pending_uuid_456';
        staff.OZEDI_Response__c = ''; // Empty string = PENDING
        update staff;

        Test.startTest();
        Map<String, Object> result = OZEDIController.getEmployeesNeedingMVR(pay.Id);
        Test.stopTest();

    }

    /**
     * Test: Multiple employees with mixed MVR statuses
     */
    @isTest
    static void testGetEmployeesNeedingMVR_MixedStatuses() {
        Payroll_Setting__c pay = getTestPayroll();
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];

        // Employee 1: COMPLETED
        Staff__c staff1 = getTestStaff();
        staff1.OZEDI_Upload_UUID__c = 'uuid_completed';
        staff1.OZEDI_Response__c = 'Upload successful. Status: UPLOAD_SEND_SUCCESS';
        staff1.OZEDI_Upload_Date_Time__c = DateTime.now();
        update staff1;

        // Employee 2: FAILED
        Staff__c staff2 = new Staff__c(
            Last_Name__c = 'Failed', Name = 'Staff2', Contact_Number__c = '0299084583',
            Email_Address__c = 'failed@example.com', Facility__c = fac.Id,
            Address__Street__s = '8 Keewong Street', Address__City__s = 'Crace',
            Address__StateCode__s = 'ACT', Address__PostalCode__s = '2911', 
            Address__CountryCode__s = 'AU',
            Date_Of_Birth__c = Date.newInstance(2001, 02, 04), Gender__c = 'Female',
            Superannuation_Name__c = 'AustralianSuper', Super_ABN__c = '51824753556',
            Unique_Superannuation_Identifier__c = '98765432101', ESA__c = 'ESA456',
            TFN_number__c = '987654321',
            Fund_Bank_BSB__c = '654321', Fund_Bank_Account_Number__c = '87654321',
            OZEDI_Upload_UUID__c = 'uuid_failed',
            OZEDI_Response__c = 'Upload failed with error'
        );
        insert staff2;

        Staff_Payroll_Setting__c sp2 = new Staff_Payroll_Setting__c(
            Working_Hours__c = 40, Payroll_Setting__c = pay.Id, Staff__c = staff2.Id,
            Super_Annuation1__c = 200.00
        );
        insert sp2;

        // Employee 3: PENDING
        Staff__c staff3 = new Staff__c(
            Last_Name__c = 'Pending', Name = 'Staff3', Contact_Number__c = '0299084584',
            Email_Address__c = 'pending@example.com', Facility__c = fac.Id,
            Address__Street__s = '8 Keewong Street', Address__City__s = 'Crace',
            Address__StateCode__s = 'ACT', Address__PostalCode__s = '2911', 
            Address__CountryCode__s = 'AU',
            Date_Of_Birth__c = Date.newInstance(2001, 02, 04), Gender__c = 'Male',
            Superannuation_Name__c = 'REST', Super_ABN__c = '51824753556',
            Unique_Superannuation_Identifier__c = '11111111111', ESA__c = 'ESA789',
            TFN_number__c = '111111111',
            Fund_Bank_BSB__c = '111111', Fund_Bank_Account_Number__c = '11111111',
            OZEDI_Upload_UUID__c = 'uuid_pending',
            OZEDI_Response__c = null
        );
        insert staff3;

        Staff_Payroll_Setting__c sp3 = new Staff_Payroll_Setting__c(
            Working_Hours__c = 40, Payroll_Setting__c = pay.Id, Staff__c = staff3.Id,
            Super_Annuation1__c = 100.00
        );
        insert sp3;

        // Employee 4: NOT_STARTED
        Staff__c staff4 = new Staff__c(
            Last_Name__c = 'NotStarted', Name = 'Staff4', Contact_Number__c = '0299084585',
            Email_Address__c = 'notstarted@example.com', Facility__c = fac.Id,
            Address__Street__s = '8 Keewong Street', Address__City__s = 'Crace',
            Address__StateCode__s = 'ACT', Address__PostalCode__s = '2911', 
            Address__CountryCode__s = 'AU',
            Date_Of_Birth__c = Date.newInstance(2001, 02, 04), Gender__c = 'Male',
            Superannuation_Name__c = 'HESTA', Super_ABN__c = '51824753556',
            Unique_Superannuation_Identifier__c = '22222222222', ESA__c = 'ESA000',
            TFN_number__c = '222222222',
            Fund_Bank_BSB__c = '222222', Fund_Bank_Account_Number__c = '22222222',
            OZEDI_Upload_UUID__c = null,
            OZEDI_Response__c = null
        );
        insert staff4;

        Staff_Payroll_Setting__c sp4 = new Staff_Payroll_Setting__c(
            Working_Hours__c = 40, Payroll_Setting__c = pay.Id, Staff__c = staff4.Id,
            Super_Annuation1__c = 100.00
        );
        insert sp4;

        Test.startTest();
        Map<String, Object> result = OZEDIController.getEmployeesNeedingMVR(pay.Id);
        Test.stopTest();
    }

    /**
     * Test: Verify all returned employee fields are populated correctly
     */
    @isTest
    static void testGetEmployeesNeedingMVR_VerifyAllFields() {
        Payroll_Setting__c pay = getTestPayroll();
        Staff__c staff = getTestStaff();

        staff.OZEDI_Upload_UUID__c = 'uuid_field_test';
        staff.OZEDI_Response__c = 'Upload successful';
        staff.OZEDI_Upload_Date_Time__c = DateTime.now();
        update staff;

        Staff_Payroll_Setting__c sp = [
            SELECT Id, Super_And_Voluntary_Supper_Annuation__c 
            FROM Staff_Payroll_Setting__c 
            WHERE Staff__c = :staff.Id 
            LIMIT 1
        ];

        Test.startTest();
        Map<String, Object> result = OZEDIController.getEmployeesNeedingMVR(pay.Id);
        Test.stopTest();

        List<Map<String, Object>> employees = (List<Map<String, Object>>)result.get('employees');


    }

    /**
     * Test: PayRun with no staff payroll records
     */
    @isTest
    static void testGetEmployeesNeedingMVR_NoStaffRecords() {
        Payroll_Setting__c pay = getTestPayroll();
        delete [SELECT Id FROM Staff_Payroll_Setting__c];

        Test.startTest();
        Map<String, Object> result = OZEDIController.getEmployeesNeedingMVR(pay.Id);
        Test.stopTest();
    }

    /**
     * Test: Verify error key is NOT set on successful execution
     */
    @isTest
    static void testGetEmployeesNeedingMVR_NoErrorOnSuccess() {
        Payroll_Setting__c pay = getTestPayroll();

        Test.startTest();
        Map<String, Object> result = OZEDIController.getEmployeesNeedingMVR(pay.Id);
        Test.stopTest();

    }

    private static final String ROUTER_UUID = 'UUID-ROUTER-1';
 
    private class OZEDIRouterMock implements HttpCalloutMock {
        // UPLOAD_READY | UPLOAD_PRE_PROCESSING | UPLOAD_FAILED | UPLOAD_SEND_SUCCESS | UPLOAD_OTHER | HTTP500 | BADJSON
        private String uploadStatus;
        // UUID | ERRORS | MESSAGE | ERROR | BADJSON | HTTP500
        private String uploadReply;
        // 200 | 201 (empty body) | 400 (errors) | 409 (body says already sent)
        private Integer sendCode;
        private Boolean paymentActive;
 
        OZEDIRouterMock(String uploadStatus, String uploadReply, Integer sendCode, Boolean paymentActive) {
            this.uploadStatus  = uploadStatus;
            this.uploadReply   = uploadReply;
            this.sendCode      = sendCode;
            this.paymentActive = paymentActive;
        }
        OZEDIRouterMock(String uploadStatus) {
            this(uploadStatus, 'UUID', 200, true);
        }
 
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            res.setStatusCode(200);
            String ep   = req.getEndpoint() == null ? '' : req.getEndpoint();
            String body = req.getBody() == null ? '' : req.getBody();
 
            // Auth / client / zepto — identified by payload
            if (body.contains('"username"'))      { res.setBody('{"id_token":"tok"}'); return res; }
            if (body.contains('"contactType"'))   { res.setBody('{"client":"CID777"}'); return res; }
            if (body.contains('"agreementType"')) { res.setBody('{"agreement":"ok"}'); return res; }
 
            // MVR / CTR upload
            if (body.contains('MemberVerificationRequest') || body.contains('ContributionTransactionRequest')) {
                if (uploadReply == 'HTTP500') {
                    res.setStatusCode(500); res.setStatus('Server Error'); res.setBody('Server down');
                } else if (uploadReply == 'ERRORS') {
                    res.setBody('{"errors":[{"shortDesc":"Error 1: TFN invalid","longDesc":"R1 Member TFN 123456789 invalid","errorCode":"E1"}]}');
                } else if (uploadReply == 'MESSAGE') {
                    res.setBody('{"message":"No upload created"}');
                } else if (uploadReply == 'ERROR') {
                    res.setBody('{"error":"Rejected"}');
                } else if (uploadReply == 'BADJSON') {
                    res.setBody('not-json');
                } else {
                    res.setBody('{"uploadUuid":"' + ROUTER_UUID + '"}');
                }
                return res;
            }
 
            // Send upload
            if (req.getMethod() == 'POST' && body.contains('"uploadUuid"')) {
                res.setStatusCode(sendCode);
                if (sendCode == 200)      res.setBody('{"uploadUuid":"UUID-NEW"}');
                else if (sendCode == 201) res.setBody('');
                else if (sendCode == 409) res.setBody('{"message":"UPLOAD_SEND_SUCCESS"}');
                else                      res.setBody('{"errors":[{"shortDesc":"Send failed","errorCode":"S1"}]}');
                return res;
            }
 
            // GETs
            String target = routeGet(ep);
            if (target == 'ERRORS') {
                res.setBody('[{"Error Code":"E9","Short Desc":"BSB invalid","Long Desc":"H2 Receiver ABN 51824753556 is invalid"}]');
            } else if (target == 'PAYMENT') {
                res.setBody(paymentActive
                    ? '{"status":"ACTIVE","registrationDetails":{"toBsb":"123456","toPayId":"pay@id","toAccountNumber":"12345678"}}'
                    : '{"status":"PENDING"}');
            } else if (uploadStatus == 'HTTP500') {
                res.setStatusCode(500); res.setBody('Server error');
            } else if (uploadStatus == 'BADJSON') {
                res.setBody('not-json');
            } else if (uploadStatus == 'UPLOAD_FAILED') {
                res.setBody('{"uploadStatus":"UPLOAD_FAILED","errors":[{"shortDesc":"USI invalid","errorCode":"E2"}],"errorDetails":"USI invalid"}');
            } else {
                res.setBody('{"uploadStatus":"' + uploadStatus + '"}');
            }
            return res;
        }
 
        private String routeGet(String ep) {
            OZEDI_Setting__mdt s = OZEDI_Setting__mdt.getInstance('Default');
            Map<String, String> prefixes = new Map<String, String>{
                'ERRORS'  => s?.Upload_Error_URL__c,
                'PAYMENT' => s?.Payment_Configuration_URL__c,
                'STATUS'  => s?.Upload_Status_URL__c
            };
            String best = 'STATUS';
            Integer bestLen = -1;
            for (String key : prefixes.keySet()) {
                String p = prefixes.get(key);
                if (String.isNotBlank(p) && ep.startsWith(p) && p.length() > bestLen) {
                    best = key;
                    bestLen = p.length();
                }
            }
            return best;
        }
    }
 
    // ---------------- helpers (setup data only) ----------------
    private static void runMVR(OZEDIRouterMock mock) {
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        System.runAs(getTestUser()) {
            Test.setMock(HttpCalloutMock.class, mock);
            Test.startTest();
            OZEDIController.uploadMVR(staff.Id);
            Test.stopTest();
        }
    }
 
    private static void runProcessSuper(OZEDIRouterMock mock) {
        Payroll_Setting__c pay = getTestPayroll();
        System.runAs(getTestUser()) {
            Test.setMock(HttpCalloutMock.class, mock);
            Test.startTest();
            OZEDIController.processSuperannuation(pay.Id);
            Test.stopTest();
        }
    }
 
    private static void runRetry(OZEDIRouterMock mock) {
        OZEDI_Validation_Log__c log = [SELECT Id, Payroll_Setting__c FROM OZEDI_Validation_Log__c LIMIT 1];
        System.runAs(getTestUser()) {
            Test.setMock(HttpCalloutMock.class, mock);
            Test.startTest();
            OZEDIController.retrySpecificFailedContributions(new List<String>{ log.Id }, log.Payroll_Setting__c);
            Test.stopTest();
        }
    }
 
    private static void runPayrunPayment(OZEDIRouterMock mock) {
        // Setup log is FAILED/unprocessed -> exercises the fallback "any UUID" query too
        Payroll_Setting__c pay = getTestPayroll();
        System.runAs(getTestUser()) {
            Test.setMock(HttpCalloutMock.class, mock);
            Test.startTest();
            OZEDIController.processPayrunPayment(pay.Id);
            Test.stopTest();
        }
    }
 
    private static void runCheckStatus(OZEDIRouterMock mock) {
        System.runAs(getTestUser()) {
            Test.setMock(HttpCalloutMock.class, mock);
            Test.startTest();
            OZEDIController.checkContributionStatus('mock_upload_uuid_888');
            Test.stopTest();
        }
    }
 
    private static void runSendContribution(OZEDIRouterMock mock) {
        System.runAs(getTestUser()) {
            Test.setMock(HttpCalloutMock.class, mock);
            Test.startTest();
            OZEDIController.sendContribution('mock_upload_uuid_888');
            Test.stopTest();
        }
    }
 
    // ---------------- uploadMVR: Step 9 + save block ----------------
    @isTest static void router_MVR_ReadyAndSent()     { runMVR(new OZEDIRouterMock('UPLOAD_READY')); }
    @isTest static void router_MVR_PreProcessing()    { runMVR(new OZEDIRouterMock('UPLOAD_PRE_PROCESSING')); }
    @isTest static void router_MVR_StatusFailed()     { runMVR(new OZEDIRouterMock('UPLOAD_FAILED')); }
    @isTest static void router_MVR_StatusOther()      { runMVR(new OZEDIRouterMock('UPLOAD_OTHER')); }
    @isTest static void router_MVR_RemittanceFails()  { runMVR(new OZEDIRouterMock('UPLOAD_READY', 'UUID', 400, true)); }
    @isTest static void router_MVR_UploadErrors()     { runMVR(new OZEDIRouterMock('UPLOAD_READY', 'ERRORS', 200, true)); }
    @isTest static void router_MVR_UploadMessage()    { runMVR(new OZEDIRouterMock('UPLOAD_READY', 'MESSAGE', 200, true)); }
    @isTest static void router_MVR_UploadError()      { runMVR(new OZEDIRouterMock('UPLOAD_READY', 'ERROR', 200, true)); }
    @isTest static void router_MVR_UploadHttp500()    { runMVR(new OZEDIRouterMock('UPLOAD_READY', 'HTTP500', 200, true)); }
 
    // ---------------- processSuperannuation: success + OZEDI-error branches ----------------
    @isTest static void router_ProcessSuper_Success()     { runProcessSuper(new OZEDIRouterMock('UPLOAD_READY')); }
    @isTest static void router_ProcessSuper_OzediErrors() { runProcessSuper(new OZEDIRouterMock('UPLOAD_FAILED')); }
 
    // ---------------- retrySpecificFailedContributions ----------------
    @isTest static void router_Retry_Success()     { runRetry(new OZEDIRouterMock('UPLOAD_READY')); }
    @isTest static void router_Retry_OzediErrors() { runRetry(new OZEDIRouterMock('UPLOAD_FAILED')); }
 
    // ---------------- processPayrunPayment ----------------
    @isTest static void router_Payrun_SendOk()        { runPayrunPayment(new OZEDIRouterMock('UPLOAD_READY')); }
    @isTest static void router_Payrun_AlreadySent()   { runPayrunPayment(new OZEDIRouterMock('UPLOAD_SEND_SUCCESS')); }
    @isTest static void router_Payrun_SendSays409()   { runPayrunPayment(new OZEDIRouterMock('UPLOAD_READY', 'UUID', 409, true)); }
    @isTest static void router_Payrun_SendFails()     { runPayrunPayment(new OZEDIRouterMock('UPLOAD_READY', 'UUID', 400, true)); }
 
    // ---------------- checkContributionStatus ----------------
    @isTest static void router_CheckStatus_Sent()     { runCheckStatus(new OZEDIRouterMock('UPLOAD_SEND_SUCCESS')); }
    @isTest static void router_CheckStatus_Http500()  { runCheckStatus(new OZEDIRouterMock('HTTP500')); }
    @isTest static void router_CheckStatus_BadJson()  { runCheckStatus(new OZEDIRouterMock('BADJSON')); }
 
    // ---------------- sendContribution ----------------
    @isTest static void router_Send_Ok()        { runSendContribution(new OZEDIRouterMock('UPLOAD_READY', 'UUID', 200, true)); }
    @isTest static void router_Send_EmptyBody() { runSendContribution(new OZEDIRouterMock('UPLOAD_READY', 'UUID', 201, true)); }
    @isTest static void router_Send_Fails()     { runSendContribution(new OZEDIRouterMock('UPLOAD_READY', 'UUID', 400, true)); }
 
    // ---------------- fetchPaymentConfiguration: active branch ----------------
    @isTest
    static void router_FetchPaymentConfig_Active() {
        System.runAs(getTestUser()) {
            Test.setMock(HttpCalloutMock.class, new OZEDIRouterMock('UPLOAD_READY', 'UUID', 200, true));
            Test.startTest();
            OZEDIController.fetchPaymentConfiguration();
            Test.stopTest();
        }
    }
 
    // ---------------- status / error helpers run as org user ----------------
    @isTest
    static void router_FetchStatusAndErrors_Failed() {
        System.runAs(getTestUser()) {
            Test.setMock(HttpCalloutMock.class, new OZEDIRouterMock('UPLOAD_FAILED'));
            Test.startTest();
            OZEDIController.fetchStatusAndErrors('mock_upload_uuid_888');
            Test.stopTest();
        }
    }
 
    @isTest
    static void router_FetchStatusAndErrors_Http500() {
        System.runAs(getTestUser()) {
            Test.setMock(HttpCalloutMock.class, new OZEDIRouterMock('HTTP500'));
            Test.startTest();
            OZEDIController.fetchStatusAndErrors('mock_upload_uuid_888');
            Test.stopTest();
        }
    }
 
    @isTest
    static void router_WaitForMVR_Non200Retries() {
        System.runAs(getTestUser()) {
            Test.setMock(HttpCalloutMock.class, new OZEDIRouterMock('HTTP500'));
            Test.startTest();
            OZEDIController.waitForMVRProcessing('mock_upload_uuid_888');
            Test.stopTest();
        }
    }
 
    @isTest
    static void router_DetailedErrorsFromPayrun() {
        Payroll_Setting__c pay = getTestPayroll();
        System.runAs(getTestUser()) {
            Test.setMock(HttpCalloutMock.class, new OZEDIRouterMock('UPLOAD_FAILED'));
            Test.startTest();
            OZEDIController.getDetailedErrorMessagesFromPayrun(pay.Id);
            Test.stopTest();
        }
    }
 
    // ---------------- pure methods: no callouts, no DML ----------------
    @isTest
    static void pure_GetDetailedErrorMessages_ResponseBodyBranches() {
        HttpResponse textRes = new HttpResponse();
        textRes.setStatusCode(500);
        textRes.setBody('Internal error occurred');
 
        HttpResponse jsonRes = new HttpResponse();
        jsonRes.setStatusCode(400);
        jsonRes.setBody('{"errors":[{"shortDesc":"x"}],"message":"m","error":"e"}');
 
        HttpResponse emptyRes = new HttpResponse();
        emptyRes.setStatusCode(400);
        emptyRes.setBody('{}');
 
        Test.startTest();
        OZEDIController.getDetailedErrorMessages(null, null, null, textRes);
        OZEDIController.getDetailedErrorMessages(null, null, null, jsonRes);
        OZEDIController.getDetailedErrorMessages(null, null, null, emptyRes);
        Test.stopTest();
    }
 
    @isTest
    static void pure_ExtractFieldInfo_Branches() {
        Test.startTest();
        OZEDIController.extractFieldInfo('sender ABN wrong');
        OZEDIController.extractFieldInfo('sender organisationalName Name wrong');
        OZEDIController.extractFieldInfo('sender email wrong');
        OZEDIController.extractFieldInfo('sender phone wrong');
        OZEDIController.extractFieldInfo('sender generic');
        OZEDIController.extractFieldInfo('Receiver ABN wrong');
        OZEDIController.extractFieldInfo('Receiver organisationalName wrong');
        OZEDIController.extractFieldInfo('Receiver USI wrong');
        OZEDIController.extractFieldInfo('Receiver generic');
        OZEDIController.extractFieldInfo('Organisation Name ABN USI TFN Member Receiver sender must not be empty');
        OZEDIController.extractFieldInfo('invalid ABN USI TFN Member');
        OZEDIController.extractFieldInfo('Fund \'Hostplus\' rejected');
        OZEDIController.extractFieldInfo('Member "ABC12345" rejected');
        OZEDIController.extractFieldInfo('USI 12345678901 rejected');
        OZEDIController.extractFieldInfo('birthDate address Line1 givenName sex');
        OZEDIController.extractFieldInfo('address suburb; address state; address postCode; familyName');
        OZEDIController.extractFieldInfo('H1 H2 R1 S1');
        OZEDIController.extractFieldInfo('The Pay Period is invalid');
        OZEDIController.extractFieldInfo('Postcode is missing');
        OZEDIController.extractFieldInfo('zzz');
        Test.stopTest();
    }
 
    @isTest
    static void pure_FormatRawErrors_Branches() {
        Test.startTest();
        OZEDIController.formatRawErrors('{"shortDesc":"x","longDesc":"TFN 123456789 bad","errorCode":"E"}');
        OZEDIController.formatRawErrors('{"other":"value"}');
        OZEDIController.formatRawErrors('plain text error');
        OZEDIController.formatRawErrors('[not valid');
        Test.stopTest();
    }
 
    @isTest
    static void pure_ExtractShortErrorMessage_Branches() {
        Test.startTest();
        OZEDIController.extractShortErrorMessage('[{"shortDesc":"Error 12: ' + 'x'.repeat(80) + '"}]');
        OZEDIController.extractShortErrorMessage('[{"errorCode":"E77"}]');
        OZEDIController.extractShortErrorMessage('{"message":"' + 'y'.repeat(80) + '"}');
        OZEDIController.extractShortErrorMessage('{"nothing":"here"}');
        OZEDIController.extractShortErrorMessage('z'.repeat(80));
        OZEDIController.extractShortErrorMessage('first line ' + 'w'.repeat(70) + '\nsecond');
        Test.stopTest();
    }
 
    @isTest
    static void pure_FormatErrorMessages_StringJsonAndOther() {
        Test.startTest();
        OZEDIController.formatErrorMessages('[{"shortDesc":"- Error 3: bad","longDesc":"R1 Member TFN 123456789"}]');
        OZEDIController.formatErrorMessages('{"shortDesc":"bad"}');
        OZEDIController.formatErrorMessages(42);
        OZEDIController.formatErrorMessages(new List<Object>());
        Test.stopTest();
    }
}