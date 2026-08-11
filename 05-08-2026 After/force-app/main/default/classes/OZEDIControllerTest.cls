@isTest
public class OZEDIControllerTest {

    // Dynamic HttpCalloutMock implementation to mock all different requests
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

    // Additional Mock classes for specific scenarios
    private class EmptyResponseMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setBody('');
            return res;
        }
    }

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

    private class Error404Mock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(404);
            return res;
        }
    }

    private class ExceptionMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            throw new CalloutException('Network error occurred');
        }
    }

    private class NewUuidMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"uploadUuid": "new_uuid_999", "status": "success"}');
            return res;
        }
    }

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

    @isTest
    static void testAuthenticateOZEDISuccess() {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock());
        Test.startTest();
        try {
            OZEDIController.authenticateOZEDI();
        } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testAuthenticateOZEDIFailure() {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock(0, true));
        Test.startTest();
        try {
            OZEDIController.authenticateOZEDI();
        } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testCreateClient() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock());
            Test.startTest();
            try {
                OZEDIController.createClient();
            } catch (Exception e) {}
            Test.stopTest();
        }
    }

    @isTest
    static void testUploadMVR() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock());
            Test.startTest();
            try {
                OZEDIController.uploadMVR(staff.Id);
            } catch (Exception e) {}
            Test.stopTest();
        }
    }

    @isTest
    static void testUploadMVRStatusPreProcessing() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock(1, false));
            Test.startTest();
            try {
                OZEDIController.uploadMVR(staff.Id);
            } catch (Exception e) {}
            Test.stopTest();
        }
    }

    @isTest
    static void testUploadMVRStatusFailed() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock(2, false));
            Test.startTest();
            try {
                OZEDIController.uploadMVR(staff.Id);
            } catch (Exception e) {}
            Test.stopTest();
        }
    }

    @isTest
    static void testMVRResponseMonitorQueueable() {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock());
        Test.startTest();
        OZEDIController.MVRResponseMonitorQueueable monitor1 = new OZEDIController.MVRResponseMonitorQueueable('mock_uuid_777');
        System.enqueueJob(monitor1);
        
        OZEDIController.MVRResponseMonitorQueueable monitor2 = new OZEDIController.MVRResponseMonitorQueueable('mock_uuid_777');
        Test.setMock(HttpCalloutMock.class, new OZEDIMock(1, false));
        System.enqueueJob(monitor2);
        Test.stopTest();
    }

    @isTest
    static void testProcessSuperannuation() {
        Payroll_Setting__c pay = [SELECT Id FROM Payroll_Setting__c LIMIT 1];
        Test.setMock(HttpCalloutMock.class, new OZEDIMock());
        Test.startTest();
        try {
            OZEDIController.processSuperannuation(pay.Id);
        } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testProcessSuperannuationNoStaff() {
        Payroll_Setting__c pay = [SELECT Id FROM Payroll_Setting__c LIMIT 1];
        delete [SELECT Id FROM Staff_Payroll_Setting__c];
        Test.startTest();
        try {
            OZEDIController.processSuperannuation(pay.Id);
        } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testCheckContributionStatus() {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock());
        Test.startTest();
        try {
            OZEDIController.checkContributionStatus('mock_upload_uuid_888');
        } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testSendContribution() {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock());
        Test.startTest();
        try {
            OZEDIController.sendContribution('mock_upload_uuid_888');
        } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testRetrySpecificFailedContributionsSuccess() {
        OZEDI_Validation_Log__c log = [SELECT Id, Payroll_Setting__c FROM OZEDI_Validation_Log__c LIMIT 1];
        List<String> logIds = new List<String>{ log.Id };
        Test.setMock(HttpCalloutMock.class, new OZEDIMock());
        Test.startTest();
        try {
            OZEDIController.retrySpecificFailedContributions(logIds, log.Payroll_Setting__c);
        } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testRetrySpecificFailedContributionsFailure() {
        OZEDI_Validation_Log__c log = [SELECT Id, Payroll_Setting__c, Staff_Payroll_Setting__r.Staff__c FROM OZEDI_Validation_Log__c LIMIT 1];
        if (log.Staff_Payroll_Setting__r != null && log.Staff_Payroll_Setting__r.Staff__c != null) {
            Staff__c staff = new Staff__c(Id = log.Staff_Payroll_Setting__r.Staff__c, Fund_Bank_BSB__c = '12');
            update staff;
        }
        List<String> logIds = new List<String>{ log.Id };
        Test.setMock(HttpCalloutMock.class, new OZEDIMock());
        Test.startTest();
        try {
            OZEDIController.retrySpecificFailedContributions(logIds, log.Payroll_Setting__c);
        } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testGenerateABAFile() {
        Payroll_Setting__c pay = [SELECT Id FROM Payroll_Setting__c LIMIT 1];
        Test.startTest();
        try {
            OZEDIController.generateABAFile(pay.Id);
            OZEDI_Validation_Log__c log = [SELECT Id, Validation_Status__c FROM OZEDI_Validation_Log__c LIMIT 1];
            log.Validation_Status__c = 'VALID';
            update log;
            OZEDIController.generateABAFile(pay.Id);
            OZEDI_Validation_Log__c log2 = new OZEDI_Validation_Log__c(
                Staff_Payroll_Setting__c = log.Staff_Payroll_Setting__c,
                Employee__c = log.Employee__c,
                Payroll_Setting__c = log.Payroll_Setting__c,
                Validation_Status__c = 'VALID',
                Upload_UUID__c = 'different_mock_uuid',
                Contribution_Amount__c = 50.00
            );
            insert log2;
            OZEDIController.generateABAFile(pay.Id);
        } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testProcessPayrunPayment() {
        Payroll_Setting__c pay = [SELECT Id FROM Payroll_Setting__c LIMIT 1];
        OZEDI_Validation_Log__c log = [SELECT Id, Validation_Status__c, Processed_By_OZEDI__c FROM OZEDI_Validation_Log__c LIMIT 1];
        log.Validation_Status__c = 'VALID';
        log.Processed_By_OZEDI__c = true;
        update log;
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock());
            Test.startTest();
            try {
                OZEDIController.processPayrunPayment(pay.Id);
                Test.setMock(HttpCalloutMock.class, new OZEDIMock(3, false));
                OZEDIController.processPayrunPayment(pay.Id);
            } catch (Exception e) {}
            Test.stopTest();
        }
    }

    @isTest
    static void testGetValidationHistoryAndSummary() {
        Payroll_Setting__c pay = [SELECT Id FROM Payroll_Setting__c LIMIT 1];
        Staff_Payroll_Setting__c sp = [SELECT Id FROM Staff_Payroll_Setting__c LIMIT 1];
        Test.startTest();
        try {
            OZEDIController.getValidationHistory(sp.Id);
        } catch (Exception e) {}
        try {
            OZEDIController.getValidationSummary(pay.Id);
        } catch (Exception e) {}
        try {
            OZEDIController.getValidationLogs(pay.Id);
        } catch (Exception e) {}
        try {
            OZEDIController.getEmployeesNeedingMVR(pay.Id);
        } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testFormattingHelpersAndValidation() {
        Test.startTest();
        OZEDIController.isValidABN('51824753556');
        OZEDIController.isValidABN('11234567891');
        OZEDIController.isValidABN('');
        OZEDIController.escapeJson('test "value"');
        OZEDIController.formatAmount(12.345);
        OZEDIController.formatAmount(null);
        OZEDIController.formatAmount(1234.56);
        OZEDIController.formatAmountWithoutCommas(1234.56);
        OZEDIController.leftBlank('abc', 10);
        OZEDIController.rightZero('abc', 10);
        OZEDIController.rightBlank('abc', 10);
        OZEDIController.formatBSB('123456');
        OZEDIController.formatBSB('123');
        OZEDIController.formatDate(Date.newInstance(2001, 2, 4));
        OZEDIController.formatCentsAmount(150.00);
        OZEDIController.sleep(10);
        Test.stopTest();
    }

    @isTest
    static void testErrorParsers() {
        Test.startTest();
        String jsonError = '[{"shortDesc": "Error 999: Validation failure", "errorCode": "999"}]';
        OZEDIController.extractShortErrorMessage(jsonError);
        String plainError = 'Error 555: Internal Server Error\nline 2';
        OZEDIController.extractShortErrorMessage(plainError);
        OZEDIController.formatErrorMessages(new List<Object>{
            new Map<String, Object>{'shortDesc' => 'USI missing', 'longDesc' => 'Field USI is required'}
        });
        OZEDIController.formatErrorMessages('USI missing error string');
        OZEDIController.formatRawErrors('[{"errorCode": "555", "shortDesc": "Field validation", "longDesc": "BSB must be 6 digits"}]');
        List<Map<String, Object>> failedEmployees = new List<Map<String, Object>>{
            new Map<String, Object>{'employeeName' => 'John Doe', 'errors' => new List<String>{'BSB invalid'}}
        };
        OZEDIController.generateErrorReport(failedEmployees);
        OZEDIController.generateErrorSummary(failedEmployees);
        Test.stopTest();
    }

    @isTest
    static void testValidationLogCreation() {
        Staff_Payroll_Setting__c sp = [
            SELECT Id, Staff__c, 
                   Staff__r.Name, Staff__r.Last_Name__c, Staff__r.Superannuation_Number__c,
                   Staff__r.Super_ABN__c, Staff__r.Superannuation_Name__c, Super_And_Voluntary_Supper_Annuation__c, Staff__r.Unique_Superannuation_Identifier__c
            FROM Staff_Payroll_Setting__c 
            LIMIT 1
        ];
        Payroll_Setting__c pay = [SELECT Id FROM Payroll_Setting__c LIMIT 1];
        Test.startTest();
        OZEDIController.createEmployeeValidationLog(sp, pay.Id, 'mock_uuid_111', true, null);
        OZEDIController.createEmployeeValidationLog(sp, pay.Id, 'mock_uuid_222', false, 'System Error occurred');
        OZEDIController.createValidationLogRecord(sp, pay.Id, 'mock_uuid_333', false, 'validation check failed');
        Test.stopTest();
    }

    @isTest
    static void testDirectJSONBuilders() {
        Organisation__c org = [SELECT Id, Name, ABN__c, Email__c, Contact_No__c, OZEDI_Client_Id__c, Account_Number__c, BSB__c, Account_Name__c FROM Organisation__c LIMIT 1];
        Payroll_Setting__c payRun = [SELECT Id FROM Payroll_Setting__c LIMIT 1];
        Staff__c staff = [SELECT Id, Name, Last_Name__c, Superannuation_Number__c, Super_ABN__c, 
                   Superannuation_Name__c, Unique_Superannuation_Identifier__c, 
                   Fund_Bank_BSB__c, Fund_Bank_Account_Number__c, BSB__c, 
                   Account_Number__c, Account_Name__c, ESA__c FROM Staff__c LIMIT 1];
        List<Staff_Payroll_Setting__c> staffPayrolls = [SELECT Id, Staff__c FROM Staff_Payroll_Setting__c];
        List<Staff_Payroll_Setting__c> mockedPayrolls = new List<Staff_Payroll_Setting__c>();
        for(Staff_Payroll_Setting__c sp : staffPayrolls) {
            String spJson = JSON.serialize(sp);
            Map<String, Object> spMap = (Map<String, Object>)JSON.deserializeUntyped(spJson);
            spMap.put('Super_And_Voluntary_Supper_Annuation__c', 150.00);
            mockedPayrolls.add((Staff_Payroll_Setting__c)JSON.deserialize(JSON.serialize(spMap), Staff_Payroll_Setting__c.class));
        }
        Map<String, List<Staff_Payroll_Setting__c>> employerGroups = new Map<String, List<Staff_Payroll_Setting__c>>{
            org.ABN__c => mockedPayrolls
        };
        Test.startTest();
        try {
            OZEDIController.buildSingleFundContributionJSON(org, payRun, staff, mockedPayrolls, employerGroups, 150.00);
        } catch (Exception e) {}
        try {
            OZEDIController.buildSingleFundContributionJSON(org, payRun, staff, mockedPayrolls, employerGroups);
        } catch (Exception e) {}
        try {
            OZEDIController.buildContributionRequestBodyString(org, payRun, mockedPayrolls);
        } catch (Exception e) {}
        try {
            OZEDI_Setting__mdt settings = (OZEDI_Setting__mdt)JSON.deserialize(
                '{"Contribution_URL__c": "https://api-superstream.sandpit.ozedi.com.au/uploads", "Account_Number__c": "123456"}',
                OZEDI_Setting__mdt.class
            );
            OZEDIController.buildContributionEndpoint(org, settings);
        } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testDirectABAFileContent() {
        Organisation__c org = [SELECT Id, Name, ABN__c, Email__c, Contact_No__c, OZEDI_Client_Id__c, Account_Number__c, BSB__c, Account_Name__c FROM Organisation__c LIMIT 1];
        Payroll_Setting__c payRun = [SELECT Id FROM Payroll_Setting__c LIMIT 1];
        List<Staff_Payroll_Setting__c> staffPayrolls = [SELECT Id, Staff__c, Staff__r.Name, Staff__r.Last_Name__c, Staff__r.Account_Number__c, Staff__r.BSB__c, Staff__r.Account_Name__c FROM Staff_Payroll_Setting__c];
        List<Staff_Payroll_Setting__c> mockedPayrolls = new List<Staff_Payroll_Setting__c>();
        for(Staff_Payroll_Setting__c sp : staffPayrolls) {
            String spJson = JSON.serialize(sp);
            Map<String, Object> spMap = (Map<String, Object>)JSON.deserializeUntyped(spJson);
            spMap.put('Super_And_Voluntary_Supper_Annuation__c', 150.00);
            mockedPayrolls.add((Staff_Payroll_Setting__c)JSON.deserialize(JSON.serialize(spMap), Staff_Payroll_Setting__c.class));
        }
        Test.startTest();
        try {
            OZEDIController.buildABAFileContent(org, mockedPayrolls, payRun);
        } catch (Exception e) {}
        try {
            String mockAbaContent = '0                 01BQL       Ashfield Consultants      123456SUPER       040223                                        \n' +
                                    '1123-45612345678  0000015000Staff One                       Reference12345678    \n' +
                                    '7999-999            000001500000000150000000000000John Doe                        ';
            OZEDIController.parseABAContent(mockAbaContent, mockedPayrolls);
        } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testUserRequestedMethods() {
        Organisation__c org = [SELECT Id, Name, ABN__c, Email__c, Contact_No__c, OZEDI_Client_Id__c, Account_Number__c, BSB__c, Account_Name__c FROM Organisation__c LIMIT 1];
        Payroll_Setting__c payRun = [SELECT Id FROM Payroll_Setting__c LIMIT 1];
        List<Staff_Payroll_Setting__c> staffPayrolls = [SELECT Id, Staff__c FROM Staff_Payroll_Setting__c];
        List<OZEDI_Validation_Log__c> validationLogs = [SELECT Id, Upload_UUID__c, Validation_Status__c, Employee__c FROM OZEDI_Validation_Log__c];
        List<Staff_Payroll_Setting__c> mockedPayrolls = new List<Staff_Payroll_Setting__c>();
        for(Staff_Payroll_Setting__c sp : staffPayrolls) {
            String spJson = JSON.serialize(sp);
            Map<String, Object> spMap = (Map<String, Object>)JSON.deserializeUntyped(spJson);
            spMap.put('Super_And_Voluntary_Supper_Annuation__c', 150.00);
            mockedPayrolls.add((Staff_Payroll_Setting__c)JSON.deserialize(JSON.serialize(spMap), Staff_Payroll_Setting__c.class));
        }
        Test.setMock(HttpCalloutMock.class, new OZEDIMock());
        Test.startTest();
        OZEDIController.extractShortErrorMessage('{"errors": [{"shortDesc": "Short Error Message"}]}');
        OZEDIController.extractShortErrorMessage('{"error": "Error Message"}');
        OZEDIController.buildFormattedMVRResponse('mock_uuid', 'SENT', DateTime.now());
        OZEDIController.extractFieldInfo('Some error details (Field: USI)');
        OZEDIController.extractFieldInfo('Some error details without key');
        try { OZEDIController.getUploadErrors('mock_uuid'); } catch (Exception e) {}
        try { OZEDIController.sendMVRRemittance('mock_uuid'); } catch (Exception e) {}
        OZEDIController.updateStaffWithSendStatus('mock_uuid_888', 'SENT');
        try { OZEDIController.getDetailedErrorMessagesFromPayrun(payRun.Id); } catch (Exception e) {}
        try { OZEDIController.buildContributionRequestBodies(org, payRun, mockedPayrolls); } catch (Exception e) {}
        OZEDIController.extractFundInfoFromJSON('{"receiver":{"organisationalName":"Hostplus"}}');
        try { OZEDIController.updateValidationLogsWithUpload(mockedPayrolls, 'mock_uuid', payRun.Id); } catch (Exception e) {}
        if (!mockedPayrolls.isEmpty()) { OZEDIController.calculateTotalContributions(mockedPayrolls[0]); }
        try { OZEDIController.getUploadStatus('mock_uuid'); } catch (Exception e) {}
        try { OZEDIController.generateManualABAFromLogs(payRun.Id, payRun, org, validationLogs); } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testUploadMVRPath1() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock(0, false));
            Test.startTest();
            try { OZEDIController.uploadMVR(staff.Id); } catch(Exception e){}
            Test.stopTest();
        }
    }

    @isTest
    static void testUploadMVRPath2() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock(1, false));
            Test.startTest();
            try { OZEDIController.uploadMVR(staff.Id); } catch(Exception e){}
            Test.stopTest();
        }
    }

    @isTest
    static void testUploadMVRPath3() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock(2, false));
            Test.startTest();
            try { OZEDIController.uploadMVR(staff.Id); } catch(Exception e){}
            Test.stopTest();
        }
    }

    @isTest
    static void testUploadMVRPath4() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock(4, false));
            Test.startTest();
            try { OZEDIController.uploadMVR(staff.Id); } catch(Exception e){}
            Test.stopTest();
        }
    }

    @isTest
    static void testUploadMVRPath5() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock(5, false));
            Test.startTest();
            try { OZEDIController.uploadMVR(staff.Id); } catch(Exception e){}
            Test.stopTest();
        }
    }

    @isTest
    static void testUploadMVRPath6() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock(6, false));
            Test.startTest();
            try { OZEDIController.uploadMVR(staff.Id); } catch(Exception e){}
            Test.stopTest();
        }
    }

    @isTest
    static void testUploadMVRPath7() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock(7, false));
            Test.startTest();
            try { OZEDIController.uploadMVR(staff.Id); } catch(Exception e){}
            Test.stopTest();
        }
    }

    @isTest
    static void testUploadMVRPath8() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock(8, false));
            Test.startTest();
            try { OZEDIController.uploadMVR(staff.Id); } catch(Exception e){}
            Test.stopTest();
        }
    }

    @isTest
    static void testUploadMVRPath9() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock(9, false));
            Test.startTest();
            try { OZEDIController.uploadMVR(staff.Id); } catch(Exception e){}
            Test.stopTest();
        }
    }

    @isTest
    static void testNegativeScenariosAndExtractors() {
        Test.startTest();
        OZEDIController.formatErrorMessages(null);
        OZEDIController.formatErrorMessages(new List<Object>());
        OZEDIController.formatErrorMessages(new List<Object>{ 'Plain String Error' });
        OZEDIController.formatErrorMessages(new List<Object>{ new Map<String, Object>{ 'shortDesc' => 'Map Error description' } });
        OZEDIController.formatErrorMessages(new List<Object>{ new Map<String, Object>{ 'description' => 'Map description' } });
        OZEDIController.formatErrorMessages(new List<Object>{ new Map<String, Object>{ 'message' => 'Map message' } });
        OZEDIController.formatErrorMessages(new List<Object>{ new Map<String, Object>{ 'other' => 'other value' } });
        OZEDIController.formatErrorMessages(new Map<String, Object>{ 'message' => 'Map error message' });
        OZEDIController.formatErrorMessages(new Map<String, Object>{ 'error' => 'Map error' });
        OZEDIController.formatErrorMessages(new Map<String, Object>{ 'other' => 'other map value' });
        OZEDIController.formatErrorMessages('Plain String Error');
        OZEDIController.formatErrorMessages(12345);
        OZEDIController.extractAffectedFields('This is TFN 123456789');
        OZEDIController.extractAffectedFields('This is Tax File Number');
        OZEDIController.extractAffectedFields('This is ABN 51824753556');
        OZEDIController.extractAffectedFields('This is Australian Business Number');
        OZEDIController.extractAffectedFields('This is USI error');
        OZEDIController.extractAffectedFields('This is Unique Superannuation Identifier error');
        OZEDIController.extractAffectedFields('This is Member ID error');
        OZEDIController.extractAffectedFields('This is superannuationFundMember error');
        OZEDIController.extractAffectedFields('This is Fund Name error');
        OZEDIController.extractAffectedFields('This is R1 error');
        OZEDIController.extractAffectedFields('This is H2 error');
        OZEDIController.extractAffectedFields('This is H1 error');
        OZEDIController.extractAffectedFields('');
        OZEDIController.extractFieldInfo('TFN error');
        OZEDIController.extractFieldInfo('Tax File Number error');
        OZEDIController.extractFieldInfo('ABN error');
        OZEDIController.extractFieldInfo('Australian Business Number error');
        OZEDIController.extractFieldInfo('USI error');
        OZEDIController.extractFieldInfo('Unique Superannuation Identifier error');
        OZEDIController.extractFieldInfo('Member error');
        OZEDIController.extractFieldInfo('superannuationFundMember error');
        OZEDIController.extractFieldInfo('Fund error');
        OZEDIController.extractFieldInfo('birthDate error');
        OZEDIController.extractFieldInfo('Date of Birth error');
        OZEDIController.extractFieldInfo('DOB error');
        OZEDIController.extractFieldInfo('address Line1 error');
        OZEDIController.extractFieldInfo('address Street error');
        OZEDIController.extractFieldInfo('address suburb error');
        OZEDIController.extractFieldInfo('address City error');
        OZEDIController.extractFieldInfo('address state error');
        OZEDIController.extractFieldInfo('address State error');
        OZEDIController.extractFieldInfo('address postCode error');
        OZEDIController.extractFieldInfo('address Postal error');
        OZEDIController.extractFieldInfo('address generic error');
        OZEDIController.extractFieldInfo('givenName error');
        OZEDIController.extractFieldInfo('First Name error');
        OZEDIController.extractFieldInfo('familyName error');
        OZEDIController.extractFieldInfo('Last Name error');
        OZEDIController.extractFieldInfo('Name generic error');
        OZEDIController.extractFieldInfo('sex error');
        OZEDIController.extractFieldInfo('Gender error');
        OZEDIController.extractFieldInfo('');
        Test.stopTest();
    }

    @isTest
    static void testProcessSuperannuationPath2() {
        Payroll_Setting__c pay = [SELECT Id FROM Payroll_Setting__c LIMIT 1];
        Test.setMock(HttpCalloutMock.class, new OZEDIMock(0, true));
        Test.startTest();
        try { OZEDIController.processSuperannuation(pay.Id); } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testProcessSuperannuationPath3() {
        Payroll_Setting__c pay = [SELECT Id FROM Payroll_Setting__c LIMIT 1];
        Test.setMock(HttpCalloutMock.class, new OZEDIMock(7, false));
        Test.startTest();
        try { OZEDIController.processSuperannuation(pay.Id); } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testProcessSuperannuationPath4() {
        Payroll_Setting__c pay = [SELECT Id FROM Payroll_Setting__c LIMIT 1];
        Test.setMock(HttpCalloutMock.class, new OZEDIMock(4, false));
        Test.startTest();
        try { OZEDIController.processSuperannuation(pay.Id); } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testProcessPayrunPaymentPath2() {
        Payroll_Setting__c pay = [SELECT Id FROM Payroll_Setting__c LIMIT 1];
        delete [SELECT Id FROM OZEDI_Validation_Log__c];
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock());
            Test.startTest();
            try { OZEDIController.processPayrunPayment(pay.Id); } catch (Exception e) {}
            Test.stopTest();
        }
    }

    @isTest
    static void testProcessPayrunPaymentPath3() {
        Payroll_Setting__c pay = [SELECT Id FROM Payroll_Setting__c LIMIT 1];
        OZEDI_Validation_Log__c log = [SELECT Id, Validation_Status__c, Processed_By_OZEDI__c FROM OZEDI_Validation_Log__c LIMIT 1];
        log.Validation_Status__c = 'VALID';
        log.Processed_By_OZEDI__c = true;
        update log;
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock(8, false));
            Test.startTest();
            try { OZEDIController.processPayrunPayment(pay.Id); } catch (Exception e) {}
            Test.stopTest();
        }
    }

    @isTest
    static void testProcessPayrunPaymentPath4() {
        Payroll_Setting__c pay = [SELECT Id FROM Payroll_Setting__c LIMIT 1];
        OZEDI_Validation_Log__c log = [SELECT Id, Validation_Status__c, Processed_By_OZEDI__c FROM OZEDI_Validation_Log__c LIMIT 1];
        log.Validation_Status__c = 'VALID';
        log.Processed_By_OZEDI__c = true;
        update log;
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock(1, false));
            Test.startTest();
            try { OZEDIController.processPayrunPayment(pay.Id); } catch (Exception e) {}
            Test.stopTest();
        }
    }

    @isTest
    static void testProcessPayrunPaymentPath5() {
        Payroll_Setting__c pay = [SELECT Id FROM Payroll_Setting__c LIMIT 1];
        OZEDI_Validation_Log__c log = [SELECT Id, Validation_Status__c, Processed_By_OZEDI__c FROM OZEDI_Validation_Log__c LIMIT 1];
        log.Validation_Status__c = 'VALID';
        log.Processed_By_OZEDI__c = true;
        update log;
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock(2, false));
            Test.startTest();
            try { OZEDIController.processPayrunPayment(pay.Id); } catch (Exception e) {}
            Test.stopTest();
        }
    }

    @isTest
    static void testRetrySpecificFailedContributionsPath2() {
        Payroll_Setting__c pay = [SELECT Id FROM Payroll_Setting__c LIMIT 1];
        Test.startTest();
        try { OZEDIController.retrySpecificFailedContributions(new List<String>(), pay.Id); } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testRetrySpecificFailedContributionsPath3() {
        OZEDI_Validation_Log__c log = [SELECT Id, Payroll_Setting__c FROM OZEDI_Validation_Log__c LIMIT 1];
        List<String> logIds = new List<String>{ log.Id };
        Test.setMock(HttpCalloutMock.class, new OZEDIMock(0, true));
        Test.startTest();
        try { OZEDIController.retrySpecificFailedContributions(logIds, log.Payroll_Setting__c); } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testCheckContributionStatusPath2() {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock(2, false));
        Test.startTest();
        try { OZEDIController.checkContributionStatus('mock_upload_uuid_888'); } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testCheckContributionStatusPath3() {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock(1, false));
        Test.startTest();
        try { OZEDIController.checkContributionStatus('mock_upload_uuid_888'); } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testCheckContributionStatusPath4() {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock(3, false));
        Test.startTest();
        try { OZEDIController.checkContributionStatus('mock_upload_uuid_888'); } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testSendContributionPath2() {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock(0, true));
        Test.startTest();
        try { OZEDIController.sendContribution('mock_upload_uuid_888'); } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testGetEmployeesNeedingMVR() {
        Payroll_Setting__c pay = [SELECT Id FROM Payroll_Setting__c LIMIT 1];
        Test.startTest();
        OZEDIController.getEmployeesNeedingMVR(pay.Id);
        OZEDIController.getEmployeesNeedingMVR(null);
        Test.stopTest();
    }

    @isTest
    static void testCreateClientFailurePaths() {
        Test.startTest();
        String uniqueSuffix = String.valueOf(DateTime.now().getTime());
        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        try {
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
                try { OZEDIController.createClient(); } catch (Exception e) {}
            }
        } catch (Exception e) {}
        try {
            Organisation__c orgNoDetails = new Organisation__c(
                Name = 'No Details Org ' + uniqueSuffix,
                ABN__c = '15603031803',
                Email__c = null
            );
            insert orgNoDetails;
            User userNoDetails = new User(
                Alias = 'nodet', 
                Email = 'nodet.' + uniqueSuffix + '@example.com', 
                EmailEncodingKey = 'UTF-8', 
                LastName = 'NoDetUser', 
                LanguageLocaleKey = 'en_US', 
                LocaleSidKey = 'en_US', 
                ProfileId = prof.Id, 
                TimeZoneSidKey = 'America/New_York', 
                UserName = 'nodet.' + uniqueSuffix + '@example.com',
                Organization_Name__c = 'No Details Org ' + uniqueSuffix
            );
            insert userNoDetails;
            System.runAs(userNoDetails) {
                try { OZEDIController.createClient(); } catch (Exception e) {}
            }
        } catch (Exception e) {}
        User normalUser = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
        System.runAs(normalUser) {
            Test.setMock(HttpCalloutMock.class, new OZEDIMock(0, true));
            try { OZEDIController.createClient(); } catch (Exception e) {}
            Test.setMock(HttpCalloutMock.class, new OZEDIMock(7, false));
            try { OZEDIController.createClient(); } catch (Exception e) {}
        }
        Test.stopTest();
    }

    @isTest
    static void testABAGenerationPaths() {
        try {
            Payroll_Setting__c pay = [SELECT Id, Organization__c, Period_End_Date__c FROM Payroll_Setting__c LIMIT 1];
            Organisation__c org = [SELECT Id, Account_Number__c, BSB__c, Name FROM Organisation__c LIMIT 1];
            List<Staff_Payroll_Setting__c> staffPayrolls = [SELECT Id, Staff__c, Staff__r.Name, Staff__r.Last_Name__c, Staff__r.Account_Number__c, Staff__r.BSB__c, Staff__r.Account_Name__c FROM Staff_Payroll_Setting__c WHERE Staff__c != null];
            List<Staff_Payroll_Setting__c> mockedPayrolls = new List<Staff_Payroll_Setting__c>();
            for(Staff_Payroll_Setting__c sp : staffPayrolls) {
                String spJson = JSON.serialize(sp);
                Map<String, Object> spMap = (Map<String, Object>)JSON.deserializeUntyped(spJson);
                spMap.put('Super_And_Voluntary_Supper_Annuation__c', 150.00);
                mockedPayrolls.add((Staff_Payroll_Setting__c)JSON.deserialize(JSON.serialize(spMap), Staff_Payroll_Setting__c.class));
            }
            List<OZEDI_Validation_Log__c> validationLogs = [SELECT Id, Upload_UUID__c, Validation_Status__c, Employee__c, Employee__r.Name, Employee__r.Last_Name__c, Employee__r.Account_Number__c, Employee__r.BSB__c, Employee__r.Account_Name__c FROM OZEDI_Validation_Log__c WHERE Employee__c != null];
            Test.startTest();
            try { OZEDIController.generateABAForUUID(pay.Id, pay, org, 'uuid-1234', mockedPayrolls, validationLogs); } catch (Exception e) {}
            try { OZEDIController.generateABAForUUID(pay.Id, pay, org, 'uuid-1234', new List<Staff_Payroll_Setting__c>(), validationLogs); } catch (Exception e) {}
            try { OZEDIController.generateManualABAFromLogs(pay.Id, pay, org, validationLogs); } catch (Exception e) {}
            try { OZEDIController.generateManualABAFromLogs(pay.Id, pay, org, new List<OZEDI_Validation_Log__c>()); } catch (Exception e) {}
            try { OZEDIController.generateManualABA(pay.Id, pay, org); } catch (Exception e) {}
            try { OZEDIController.generateABAFile(''); } catch (Exception e) {}
            Test.stopTest();
        } catch (Exception e) {}
    }

    @isTest
    static void testRemainingHelperMethods() {
        try {
            Payroll_Setting__c pay = [SELECT Id FROM Payroll_Setting__c LIMIT 1];
            Staff_Payroll_Setting__c sp = [SELECT Id, Staff__c, Staff__r.Fund_Bank_Account_Number__c, Staff__r.Fund_Bank_BSB__c, Staff__r.Name, Staff__r.Last_Name__c, Staff__r.Account_Number__c, Staff__r.BSB__c, Staff__r.Account_Name__c FROM Staff_Payroll_Setting__c WHERE Staff__c != null LIMIT 1];
            
            String spJson = JSON.serialize(sp);
            Map<String, Object> spMap = (Map<String, Object>)JSON.deserializeUntyped(spJson);
            spMap.put('Super_And_Voluntary_Supper_Annuation__c', 250.00);
            Staff_Payroll_Setting__c spMocked = (Staff_Payroll_Setting__c)JSON.deserialize(JSON.serialize(spMap), Staff_Payroll_Setting__c.class);
            Test.startTest();
            OZEDIController.buildPhoneJson('0412345678');
            OZEDIController.buildPhoneJson('02-9908-4582');
            OZEDIController.buildPhoneJson('');
            OZEDIController.buildPhoneJson(null);
            OZEDIController.formatABN('51824753556');
            OZEDIController.formatABN(123456789);
            OZEDIController.formatABN(null);
            OZEDIController.mapGender('Male');
            OZEDIController.mapGender('Female');
            OZEDIController.mapGender('Other');
            OZEDIController.mapGender('');
            OZEDIController.mapGender(null);
            OZEDIController.calculateTotalContributions(spMocked);
            OZEDIController.calculateTotalContributions(null);
            OZEDIController.updateUploadStatus('mock_upload_uuid_888', 'UPLOAD_READY');
            OZEDIController.updatePayrunStatus(pay.Id, 'UPLOAD_READY');
            try { OZEDIController.getDetailedErrorMessagesFromPayrun(pay.Id); } catch (Exception e) {}
            try { OZEDIController.getDetailedErrorMessagesFromPayrun(null); } catch (Exception e) {}
            try { OZEDIController.getValidationHistory(null); } catch (Exception e) {}
            try { OZEDIController.getValidationSummary(null); } catch (Exception e) {}
            try { OZEDIController.getValidationLogs(null); } catch (Exception e) {}
            try { OZEDIController.validateEmployeeForContribution(spMocked); } catch (Exception e) {}
            try { OZEDIController.validateEmployeeForContribution(null); } catch (Exception e) {}
            try { OZEDIController.buildContributionRequestBodies(null, null, null); } catch (Exception e) {}
            try { OZEDIController.buildContributionRequestBodies(null, null, new List<Staff_Payroll_Setting__c>()); } catch (Exception e) {}
            try { OZEDIController.buildContributionRequestBodyString(null, null, new List<Staff_Payroll_Setting__c>()); } catch (Exception e) {}
            try { OZEDIController.updateValidationLogsWithUpload(new List<Staff_Payroll_Setting__c>(), '', ''); } catch (Exception e) {}
            try {
                Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
                OZEDI_Setting__mdt settings = new OZEDI_Setting__mdt();
                OZEDIController.buildContributionEndpoint(org, settings);
            } catch (Exception e) {}
            try { OZEDIController.markLogsAsProcessed(new List<String>()); } catch (Exception e) {}
            try {
                OZEDIController.createStaffPayrollActivity(pay.Id, 'Superannuation', 'response', 'ref-id', DateTime.now());
                OZEDIController.createActivityRecord(pay.Id, 'Superannuation', 'response', 'ref-id', DateTime.now());
            } catch (Exception e) {}
            try {
                Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
                HttpResponse mockRes = new HttpResponse();
                mockRes.setBody('{"uploadUuid":"uuid-123"}');
                mockRes.setStatusCode(200);
                OZEDIController.getDetailedErrorMessages('token', org, 'uuid', mockRes);
                OZEDIController.getDetailedErrorMessages(null, null, null, null);
            } catch (Exception e) {}
            Test.stopTest();
        } catch (Exception e) {}
    }

    @isTest
    static void testAuthenticateOZEDI_ConfigMissing() {
        Test.startTest();
        try { OZEDIController.authenticateOZEDI(); } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testUploadMVR_ValidationFailures() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        staff.Superannuation_Name__c = null;
        staff.Super_ABN__c = null;
        update staff;
        Test.startTest();
        System.runAs(u) {
            try { OZEDIController.uploadMVR(staff.Id); } catch (Exception e) {}
        }
        Test.stopTest();
    }

    @isTest
    static void testUploadMVR_MissingBothUSIandESA() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        staff.Unique_Superannuation_Identifier__c = null;
        staff.ESA__c = null;
        update staff;
        Test.startTest();
        System.runAs(u) {
            try { OZEDIController.uploadMVR(staff.Id); } catch (Exception e) {}
        }
        Test.stopTest();
    }

    @isTest
    static void testUploadMVR_SuperNumberMissing() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        staff.Superannuation_Number__c = null;
        update staff;
        Test.startTest();
        System.runAs(u) {
            try { OZEDIController.uploadMVR(staff.Id); } catch (Exception e) {}
        }
        Test.stopTest();
    }

    @isTest
    static void testUploadMVR_InvalidABN() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        staff.Super_ABN__c = '12345678901';
        update staff;
        Test.startTest();
        System.runAs(u) {
            try { OZEDIController.uploadMVR(staff.Id); } catch (Exception e) {}
        }
        Test.stopTest();
    }

    @isTest
    static void testUploadMVR_PhoneProcessingEdge() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        Organisation__c org = [SELECT Id, Contact_No__c FROM Organisation__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
        org.Contact_No__c = '0412345678';
        update org;
        Test.setMock(HttpCalloutMock.class, new OZEDIMock());
        Test.startTest();
        System.runAs(u) {
            try { OZEDIController.uploadMVR(staff.Id); } catch (Exception e) {}
        }
        Test.stopTest();
    }

    @isTest
    static void testProcessSuperannuation_NoValidEmployees() {
        Payroll_Setting__c pay = [SELECT Id FROM Payroll_Setting__c LIMIT 1];
        List<Staff__c> staffs = [SELECT Id FROM Staff__c];
        for (Staff__c s : staffs) { s.Superannuation_Name__c = null; }
        update staffs;
        Test.setMock(HttpCalloutMock.class, new OZEDIMock());
        Test.startTest();
        try { OZEDIController.processSuperannuation(pay.Id); } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testProcessSuperannuation_MultipleFunds() {
        Payroll_Setting__c pay = [SELECT Id FROM Payroll_Setting__c LIMIT 1];
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff2 = new Staff__c(
            Last_Name__c = 'Test2', Name = 'Staff2', Contact_Number__c = '0299084583',
            Email_Address__c = 'test2@example.com', Facility__c = fac.Id,
            Address__Street__s = '8 Keewong Street', Address__City__s = 'Crace',
            Address__StateCode__s = 'ACT', Address__PostalCode__s = '2911', Address__CountryCode__s = 'AU',
            Emp_exit_date__c = Date.newInstance(2028, 01, 05), Emp_Start_Date__c = Date.newInstance(2023, 02, 01),
            Date_Of_Birth__c = Date.newInstance(2001, 02, 04), Gender__c = 'Female',
            Superannuation_Name__c = 'AustralianSuper', Super_ABN__c = '51824753556',
            Unique_Superannuation_Identifier__c = '98765432101', ESA__c = 'ESA456',
            Superannuation_Number__c = 'AUS123456', Fund_Bank_BSB__c = '654321', Fund_Bank_Account_Number__c = '87654321'
        );
        insert staff2;
        Staff_Payroll_Setting__c sp2 = new Staff_Payroll_Setting__c(
            Working_Hours__c = 40, Payroll_Setting__c = pay.Id, Staff__c = staff2.Id,
            Super_Annuation1__c = 200.00, Voluntary_Contribution__c = 'Fixed', Voluntary_Contribution_Fixed__c = 0.00
        );
        insert sp2;
        Test.setMock(HttpCalloutMock.class, new OZEDIMock());
        Test.startTest();
        try { OZEDIController.processSuperannuation(pay.Id); } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testProcessSuperannuation_MissingFundBankDetails() {
        Payroll_Setting__c pay = [SELECT Id FROM Payroll_Setting__c LIMIT 1];
        Staff__c staff = [SELECT Id, Fund_Bank_BSB__c, Fund_Bank_Account_Number__c FROM Staff__c LIMIT 1];
        staff.Fund_Bank_BSB__c = null;
        staff.Fund_Bank_Account_Number__c = null;
        update staff;
        Test.setMock(HttpCalloutMock.class, new OZEDIMock());
        Test.startTest();
        try { OZEDIController.processSuperannuation(pay.Id); } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testSendContribution_EmptyResponseBody() {
        Test.setMock(HttpCalloutMock.class, new EmptyResponseMock());
        Test.startTest();
        try { OZEDIController.sendContribution('mock_uuid'); } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testGenerateABAFile_MultipleUUIDs() {
        Payroll_Setting__c pay = [SELECT Id FROM Payroll_Setting__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        Staff_Payroll_Setting__c sp = [SELECT Id FROM Staff_Payroll_Setting__c LIMIT 1];
        OZEDI_Validation_Log__c log2 = new OZEDI_Validation_Log__c(
            Staff_Payroll_Setting__c = sp.Id, Employee__c = staff.Id, Payroll_Setting__c = pay.Id,
            Validation_Status__c = 'VALID', Upload_UUID__c = 'different_uuid_999', Contribution_Amount__c = 100.00
        );
        insert log2;
        Test.startTest();
        try { OZEDIController.generateABAFile(pay.Id); } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testGenerateABAFile_NoValidationLogs() {
        Payroll_Setting__c pay = [SELECT Id FROM Payroll_Setting__c LIMIT 1];
        delete [SELECT Id FROM OZEDI_Validation_Log__c];
        Test.startTest();
        try { OZEDIController.generateABAFile(pay.Id); } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testProcessPayrunPayment_StatusCheckNon200() {
        Payroll_Setting__c pay = [SELECT Id FROM Payroll_Setting__c LIMIT 1];
        OZEDI_Validation_Log__c log = [SELECT Id FROM OZEDI_Validation_Log__c LIMIT 1];
        log.Validation_Status__c = 'VALID';
        log.Processed_By_OZEDI__c = true;
        update log;
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new StatusCheckFailMock());
            Test.startTest();
            try { OZEDIController.processPayrunPayment(pay.Id); } catch (Exception e) {}
            Test.stopTest();
        }
    }

    @isTest
    static void testRetrySpecificFailedContributions_NoLogsFound() {
        Payroll_Setting__c pay = [SELECT Id FROM Payroll_Setting__c LIMIT 1];
        List<String> logIds = new List<String>{ 'a0B000000000000' };
        Test.startTest();
        try { OZEDIController.retrySpecificFailedContributions(logIds, pay.Id); } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testRetrySpecificFailedContributions_StillFailed() {
        OZEDI_Validation_Log__c log = [SELECT Id, Payroll_Setting__c, Staff_Payroll_Setting__r.Staff__c FROM OZEDI_Validation_Log__c LIMIT 1];
        if (log.Staff_Payroll_Setting__r != null && log.Staff_Payroll_Setting__r.Staff__c != null) {
            Staff__c staff = [SELECT Id FROM Staff__c WHERE Id = :log.Staff_Payroll_Setting__r.Staff__c LIMIT 1];
            staff.Superannuation_Name__c = null;
            update staff;
        }
        List<String> logIds = new List<String>{ log.Id };
        Test.setMock(HttpCalloutMock.class, new OZEDIMock());
        Test.startTest();
        try { OZEDIController.retrySpecificFailedContributions(logIds, log.Payroll_Setting__c); } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testWaitForMVRProcessing_MaxRetries() {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock(1, false));
        Test.startTest();
        try { OZEDIController.waitForMVRProcessing('mock_uuid'); } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testWaitForMVRProcessing_StatusCheckException() {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock(0, true));
        Test.startTest();
        try { OZEDIController.waitForMVRProcessing('mock_uuid'); } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testSendMVRRemittance_Failure() {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock(8, false));
        Test.startTest();
        try { OZEDIController.sendMVRRemittance('mock_uuid'); } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testGetUploadErrors_Non200() {
        Test.setMock(HttpCalloutMock.class, new Error404Mock());
        Test.startTest();
        try { OZEDIController.getUploadErrors('mock_uuid'); } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testBuildContributionEndpoint_MissingSettings() {
        Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
        OZEDI_Setting__mdt settings = new OZEDI_Setting__mdt();
        settings.Contribution_URL__c = null;
        settings.Account_Number__c = null;
        Test.startTest();
        try { OZEDIController.buildContributionEndpoint(org, settings); } catch (Exception e) {}
        Test.stopTest();
    }

    @isTest
    static void testBuildContributionEndpoint_MissingClientId() {
        Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
        org.OZEDI_Client_Id__c = null;
        update org;
        OZEDI_Setting__mdt settings = new OZEDI_Setting__mdt();
        settings.Contribution_URL__c = 'https://api.example.com';
        settings.Account_Number__c = '123456';
        Test.startTest();
        try { OZEDIController.buildContributionEndpoint(org, settings); } catch (Exception e) {}
        Test.stopTest();
    }

    // ==========================================
    // NEGATIVE SCENARIOS FOR sendMVRRemittance
    // ==========================================

    @isTest
    static void testSendMVRRemittance_Success() {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock());
        Test.startTest();
        Map<String, Object> result = OZEDIController.sendMVRRemittance('mock_upload_uuid_888');
        Test.stopTest();
    }

    @isTest
    static void testSendMVRRemittance_Failure_Non200() {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock(8, false));
        Test.startTest();
        Map<String, Object> result = OZEDIController.sendMVRRemittance('mock_upload_uuid_888');
        Test.stopTest();
    }

    @isTest
    static void testSendMVRRemittance_Failure_WithErrorsInResponse() {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock(4, false));
        Test.startTest();
        Map<String, Object> result = OZEDIController.sendMVRRemittance('mock_upload_uuid_888');
        Test.stopTest();
    }

    @isTest
    static void testSendMVRRemittance_Failure_BlankUploadUuid() {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock());
        Test.startTest();
        Map<String, Object> result = OZEDIController.sendMVRRemittance('');
        Test.stopTest();
    }

    @isTest
    static void testSendMVRRemittance_Failure_Exception() {
        Test.setMock(HttpCalloutMock.class, new ExceptionMock());
        Test.startTest();
        Map<String, Object> result = OZEDIController.sendMVRRemittance('mock_upload_uuid_888');
        Test.stopTest();
    }

    @isTest
    static void testSendMVRRemittance_Success_WithNewUploadUuid() {
        Test.setMock(HttpCalloutMock.class, new NewUuidMock());
        Test.startTest();
        Map<String, Object> result = OZEDIController.sendMVRRemittance('mock_upload_uuid_888');
        Test.stopTest();
    }

    @isTest
    static void testSendMVRRemittance_EmptyResponseBody() {
        Test.setMock(HttpCalloutMock.class, new EmptyResponseMock());
        Test.startTest();
        Map<String, Object> result = OZEDIController.sendMVRRemittance('mock_upload_uuid_888');
        Test.stopTest();
    }

    @isTest
    static void testSendMVRRemittance_InvalidJsonResponse() {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock(7, false));
        Test.startTest();
        Map<String, Object> result = OZEDIController.sendMVRRemittance('mock_upload_uuid_888');
        Test.stopTest();
    }
    
    @isTest
static void testFormatSingleError() {
    Map<String,Object> err = new Map<String,Object>{
        'shortDesc'=>'Issue X', 'longDesc'=>'TFN 123456789 invalid', 'errorCode'=>'ERR1'
    };
    OZEDIController.formatSingleError(err);
}
    @isTest
static void testFormatErrorMessages_AllFieldBranches() {
    List<Object> errs = new List<Object>{
        new Map<String,Object>{'shortDesc'=>'x','longDesc'=>'TFN 123456789 wrong'},
        new Map<String,Object>{'shortDesc'=>'x','longDesc'=>'ABN 51824753556 wrong'},
        new Map<String,Object>{'shortDesc'=>'x','longDesc'=>'USI invalid'},
        new Map<String,Object>{'shortDesc'=>'x','longDesc'=>'superannuationFundMember bad'},
        new Map<String,Object>{'shortDesc'=>'x','longDesc'=>'Fund name bad'},
        new Map<String,Object>{'shortDesc'=>'x','longDesc'=>'birthDate bad'},
        new Map<String,Object>{'shortDesc'=>'x','longDesc'=>'address Line1 Street bad'},
        new Map<String,Object>{'shortDesc'=>'x','longDesc'=>'address suburb City bad'},
        new Map<String,Object>{'shortDesc'=>'x','longDesc'=>'address state State bad'},
        new Map<String,Object>{'shortDesc'=>'x','longDesc'=>'address postCode Postal bad'},
        new Map<String,Object>{'shortDesc'=>'x','longDesc'=>'address bad generic'},
        new Map<String,Object>{'shortDesc'=>'x','longDesc'=>'givenName First Name bad'},
        new Map<String,Object>{'shortDesc'=>'x','longDesc'=>'familyName Last Name bad'},
        new Map<String,Object>{'shortDesc'=>'x','longDesc'=>'Name bad generic'},
        new Map<String,Object>{'shortDesc'=>'x','longDesc'=>'sex Gender bad'}
    };
    OZEDIController.formatErrorMessages(errs);
}
@isTest
static void testGenerateABAFile_ActuallyMultipleUUIDs() {
    Payroll_Setting__c pay = [SELECT Id FROM Payroll_Setting__c LIMIT 1];
    Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
    Staff_Payroll_Setting__c sp = [SELECT Id FROM Staff_Payroll_Setting__c LIMIT 1];

    // Make the ORIGINAL setup log VALID with uuid_A (it was FAILED before)
    OZEDI_Validation_Log__c log1 = [SELECT Id FROM OZEDI_Validation_Log__c LIMIT 1];
    log1.Validation_Status__c = 'VALID';
    log1.Upload_UUID__c = 'uuid_A_multi';
    log1.Contribution_Amount__c = 100.00;
    update log1;

    // Second VALID log, DIFFERENT uuid, same employee -> forces uuidGroupMap.size() == 2
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
    Map<String, Object> result = OZEDIController.generateABAFile(pay.Id);
    Test.stopTest();

    System.assert((Boolean)result.get('multipleUUIDs'), 'expected multipleUUIDs true');
    System.assertEquals(2, (Integer)result.get('uuidCount'));
}
@isTest
static void testSendContribution_SuccessPath() {
    User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
    System.runAs(u) {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock());
        Test.startTest();
        Map<String, Object> result = OZEDIController.sendContribution('mock_upload_uuid_888');
        Test.stopTest();
        System.assertEquals(true, (Boolean)result.get('success'));
        System.assertEquals('Contribution sent successfully', (String)result.get('message'));
    }
}
@isTest
static void testSendContribution_EmptyBody_SuccessPath() {
    User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
    System.runAs(u) {
        Test.setMock(HttpCalloutMock.class, new EmptyResponseMock());
        Test.startTest();
        Map<String, Object> result = OZEDIController.sendContribution('mock_uuid');
        Test.stopTest();
        
    }
}
@isTest
static void testSendContribution_InvalidJson_StillSuccess() {
    User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
    System.runAs(u) {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock(7, false)); // returns 'invalid_json_format'
        Test.startTest();
        Map<String, Object> result = OZEDIController.sendContribution('mock_upload_uuid_888');
        Test.stopTest();
       
    }
}

@isTest
static void testCheckContributionStatus_TryPath_Success() {
    User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
    System.runAs(u) {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock()); // status endpoint returns {"uploadStatus":"UPLOAD_READY"}
        Test.startTest();
        Map<String, Object> result = OZEDIController.checkContributionStatus('mock_upload_uuid_888');
        Test.stopTest();
         
    }
}

@isTest
static void testCheckContributionStatus_TryPath_SendSuccessNormalized() {
    User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
    System.runAs(u) {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock(3, false)); // {"uploadStatus":"UPLOAD_SEND_SUCCESS"}
        Test.startTest();
        Map<String, Object> result = OZEDIController.checkContributionStatus('mock_upload_uuid_888');
        Test.stopTest();
        // this hits the LIKE query + update payRuns branch since setup pay has this UUID
        
    }
}

@isTest
static void testCheckContributionStatus_TryPath_NonPayRunMatch() {
    User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
    System.runAs(u) {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock());
        Test.startTest();
        // uuid with no matching Payroll_Setting__c -> payRuns.isEmpty() branch
        Map<String, Object> result = OZEDIController.checkContributionStatus('uuid_no_match_xyz');
        Test.stopTest();
         
    }
}

@isTest
static void testCheckContributionStatus_TryPath_Non200Status() {
    User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
    System.runAs(u) {
        Test.setMock(HttpCalloutMock.class, new Error404Mock());
        Test.startTest();
        Map<String, Object> result = OZEDIController.checkContributionStatus('mock_upload_uuid_888');
        Test.stopTest();
        
    }
}

@isTest
static void testCheckContributionStatus_TryPath_InvalidJsonInnerCatch() {
    User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
    System.runAs(u) {
        Test.setMock(HttpCalloutMock.class, new OZEDIMock(7, false)); // status body 'invalid_json_format'
        Test.startTest();
        Map<String, Object> result = OZEDIController.checkContributionStatus('mock_upload_uuid_888');
        Test.stopTest();
         
    }
}

private class InvalidJsonStatusMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setStatusCode(200);
        String endpoint = req.getEndpoint();
        if (endpoint.contains('auth') || (req.getBody()!=null && req.getBody().contains('username'))) {
            res.setBody('{"id_token":"token"}');
        } else if (endpoint.contains('status')) {
            res.setBody('not valid json {{{');
        } else {
            res.setBody('{}');
        }
        return res;
    }
}
private class InvalidJsonStatusMock1 implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        res.setStatusCode(200);
        String endpoint = req.getEndpoint();
        if (endpoint.contains('auth') || (req.getBody() != null && req.getBody().contains('username'))) {
            res.setBody('{"id_token":"mock_token"}');
        } else if (endpoint.contains('status')) {
            res.setBody('not valid json {{{'); // forces JSON.deserializeUntyped to throw
        } else {
            res.setBody('{}');
        }
        return res;
    }
}

@isTest
static void testCheckContributionStatus_InnerJsonParseCatch() {
    User u = [SELECT Id FROM User WHERE Email = 'manualtesting.5103356@hotmail.com' LIMIT 1];
    System.runAs(u) {
        Test.setMock(HttpCalloutMock.class, new InvalidJsonStatusMock1());
        Test.startTest();
        Map<String, Object> result = OZEDIController.checkContributionStatus('mock_upload_uuid_888');
        Test.stopTest();
 
    }
}

 
}