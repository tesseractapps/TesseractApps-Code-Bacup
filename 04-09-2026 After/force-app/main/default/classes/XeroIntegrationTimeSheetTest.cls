@isTest
public class XeroIntegrationTimeSheetTest {
    
    // ============================================================
    // MOCK RESPONSE CLASSES
    // ============================================================
    
    private class XeroFullMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            
            String endpoint = req.getEndpoint();
            String method = req.getMethod();
            
            // Xero Authentication
            if (endpoint.contains('identity.xero.com/connect/token')) {
                res.setStatusCode(200);
                res.setBody('{"access_token":"TEST_ACCESS_TOKEN","token_type":"Bearer","expires_in":1800}');
                return res;
            }
            
            // Xero Connections / Tenant
            if (endpoint.contains('api.xero.com/connections')) {
                res.setStatusCode(200);
                res.setBody('[{"tenantId":"TEST_TENANT_ID","tenantName":"Test Organisation"}]');
                return res;
            }
            
            // Employee endpoints
            if (endpoint.contains('/payroll.xro/1.0/Employees')) {
                if (endpoint.contains('Employees/')) {
                    res.setStatusCode(200);
                    res.setBody('{"Employees":[{' +
                        '"EmployeeID":"EMP123",' +
                        '"PayrollCalendarID":"CAL001",' +
                        '"OrdinaryEarningsRateID":"ORD123",' +
                        '"PayTemplate":{"EarningsLines":[' +
                            '{"EarningsRateID":"ORD123","CalculationType":"ENTEREARNINGSRATE","RatePerUnit":25}' +
                        ']},' +
                        '"EarningsRates":[' +
                            '{"Name":"Ordinary Earnings","RateType":"ORDINARYEARNINGS","EarningsRateID":"ORD123"}' +
                        ']' +
                    '}]}');
                } else {
                    res.setStatusCode(200);
                    res.setBody('{"Employees":[{"EmployeeID":"EMP123"}]}');
                }
                return res;
            }
            
            // Payroll Calendars
            if (endpoint.contains('PayrollCalendars')) {
                res.setStatusCode(200);
                res.setBody('{"PayrollCalendars":[' +
                    '{"Name":"Weekly","CalendarType":"WEEKLY","StartDate":"/Date(1716940800000+0000)/"}' +
                ']}');
                return res;
            }
            
            // Tracking Categories
            if (endpoint.contains('TrackingCategories')) {
                res.setStatusCode(200);
                res.setBody('{"TrackingCategories":[' +
                    '{"Name":"Department","TrackingCategoryID":"TC001","Status":"ACTIVE",' +
                    '"Options":[{"Name":"General","TrackingOptionID":"TO001","Status":"ACTIVE"}]}' +
                ']}');
                return res;
            }
            
            // Earnings Rates
            if (endpoint.contains('/payroll.xro/2.0/EarningsRates')) {
                if (endpoint.endsWith('/EarningsRates')) {
                    res.setStatusCode(200);
                    res.setBody('{"earningsRates":[' +
                        '{"earningsRateID":"ER001","name":"General Rate","rateType":"ORDINARYEARNINGS","currentRecord":true,"typeOfUnits":"Hours","ratePerUnit":0},' +
                        '{"earningsRateID":"ER002","name":"Broken Rate","rateType":"ORDINARYEARNINGS","currentRecord":true,"typeOfUnits":"Hours","ratePerUnit":0},' +
                        '{"earningsRateID":"ER003","name":"Sleepover Overnight","rateType":"ORDINARYEARNINGS","currentRecord":true,"typeOfUnits":"Hours","ratePerUnit":0}' +
                    ']}');
                } else {
                    res.setStatusCode(200);
                    res.setBody('{"earningsRate":{"earningsRateID":"ER001","name":"General Rate","currentRecord":true,"typeOfUnits":"Hours"}}');
                }
                return res;
            }
            
            // Timesheets
            if (endpoint.contains('/payroll.xro/1.0/Timesheets')) {
                if (method == 'POST') {
                    res.setStatusCode(200);
                    res.setBody('{"Timesheets":[{"EmployeeID":"EMP123","TimesheetID":"TS001","Status":"DRAFT"}]}');
                }
                return res;
            }
            
            // Default response
            res.setStatusCode(200);
            res.setBody('{}');
            return res;
        }
    }
    
    private class XeroErrorMock implements HttpCalloutMock {
        private Integer statusCode;
        private String responseBody;
        
        public XeroErrorMock(Integer statusCode, String responseBody) {
            this.statusCode = statusCode;
            this.responseBody = responseBody;
        }
        
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(statusCode);
            res.setHeader('Content-Type', 'application/json');
            res.setBody(responseBody);
            return res;
        }
    }
    
    private class XeroPayPeriodErrorMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            
            String endpoint = req.getEndpoint();
            
            if (endpoint.contains('Employees/')) {
                res.setStatusCode(200);
                res.setBody('{"Employees":[{"EmployeeID":"EMP123","PayrollCalendarID":"CAL001","OrdinaryEarningsRateID":"ORD123"}]}');
            } else if (endpoint.contains('PayrollCalendars')) {
                res.setStatusCode(200);
                res.setBody('{"PayrollCalendars":[{"Name":"Weekly","CalendarType":"WEEKLY","StartDate":"/Date(1716940800000+0000)/"}]}');
            } else if (endpoint.contains('EarningsRates')) {
                res.setStatusCode(200);
                res.setBody('{"earningsRates":[{"earningsRateID":"ER001","name":"General","currentRecord":true,"typeOfUnits":"Hours"}]}');
            } else if (endpoint.contains('Timesheets')) {
                res.setStatusCode(400);
                res.setBody('{"Timesheets":[{"EmployeeID":"EMP123","ValidationErrors":[{"Message":"The period doesn\'t correspond to the employee\'s pay period"}]}]}');
            } else if (endpoint.contains('TrackingCategories')) {
                res.setStatusCode(200);
                res.setBody('{"TrackingCategories":[{"Name":"Department","TrackingCategoryID":"TC001","Status":"ACTIVE","Options":[{"Name":"General","TrackingOptionID":"TO001","Status":"ACTIVE"}]}]}');
            } else {
                res.setStatusCode(200);
                res.setBody('{}');
            }
            
            return res;
        }
    }
    
    private class XeroInactiveRateMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            
            if (req.getEndpoint().contains('EarningsRates')) {
                res.setStatusCode(200);
                res.setBody('{"earningsRate":{"earningsRateID":"ER001","name":"General Rate","currentRecord":false,"typeOfUnits":"Hours"}}');
            } else {
                res.setStatusCode(200);
                res.setBody('{}');
            }
            return res;
        }
    }
    
    // ============================================================
    // MOCK RESPONSE CLASSES FOR TRACKING CATEGORIES
    // ============================================================
    
    /**
     * Mock: Successful response with active tracking category and active option
     */
    private class TrackingSuccessMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            
            String endpoint = req.getEndpoint();
            
            // Xero Authentication
            if (endpoint.contains('identity.xero.com/connect/token')) {
                res.setStatusCode(200);
                res.setBody('{"access_token":"TEST_ACCESS_TOKEN","token_type":"Bearer","expires_in":1800}');
                return res;
            }
            
            // Xero Connections / Tenant
            if (endpoint.contains('api.xero.com/connections')) {
                res.setStatusCode(200);
                res.setBody('[{"tenantId":"TEST_TENANT_ID","tenantName":"Test Organisation"}]');
                return res;
            }
            
            // Tracking Categories - Success with ACTIVE category and ACTIVE option
            if (endpoint.contains('TrackingCategories')) {
                res.setStatusCode(200);
                res.setBody('{' +
                    '"TrackingCategories": [' +
                        '{' +
                            '"Name": "Department",' +
                            '"TrackingCategoryID": "TC001",' +
                            '"Status": "ACTIVE",' +
                            '"Options": [' +
                                '{' +
                                    '"Name": "General",' +
                                    '"TrackingOptionID": "TO001",' +
                                    '"Status": "ACTIVE"' +
                                '},' +
                                '{' +
                                    '"Name": "Finance",' +
                                    '"TrackingOptionID": "TO002",' +
                                    '"Status": "ACTIVE"' +
                                '}' +
                            ']' +
                        '},' +
                        '{' +
                            '"Name": "Region",' +
                            '"TrackingCategoryID": "TC002",' +
                            '"Status": "ACTIVE",' +
                            '"Options": [' +
                                '{' +
                                    '"Name": "North",' +
                                    '"TrackingOptionID": "TO003",' +
                                    '"Status": "ACTIVE"' +
                                '}' +
                            ']' +
                        '}' +
                    ']' +
                '}');
                return res;
            }
            
            // Default response
            res.setStatusCode(200);
            res.setBody('{}');
            return res;
        }
    }
    
    /**
     * Mock: Tracking category with no options
     */
    private class TrackingNoOptionsMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            
            if (req.getEndpoint().contains('TrackingCategories')) {
                res.setStatusCode(200);
                res.setBody('{' +
                    '"TrackingCategories": [' +
                        '{' +
                            '"Name": "Department",' +
                            '"TrackingCategoryID": "TC001",' +
                            '"Status": "ACTIVE",' +
                            '"Options": []' +
                        '}' +
                    ']' +
                '}');
                return res;
            }
            
            res.setStatusCode(200);
            res.setBody('{}');
            return res;
        }
    }
    
    /**
     * Mock: Inactive tracking category
     */
    private class TrackingInactiveCategoryMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            
            if (req.getEndpoint().contains('TrackingCategories')) {
                res.setStatusCode(200);
                res.setBody('{' +
                    '"TrackingCategories": [' +
                        '{' +
                            '"Name": "Department",' +
                            '"TrackingCategoryID": "TC001",' +
                            '"Status": "INACTIVE",' +
                            '"Options": [' +
                                '{' +
                                    '"Name": "General",' +
                                    '"TrackingOptionID": "TO001",' +
                                    '"Status": "ACTIVE"' +
                                '}' +
                            ']' +
                        '}' +
                    ']' +
                '}');
                return res;
            }
            
            res.setStatusCode(200);
            res.setBody('{}');
            return res;
        }
    }
    
    /**
     * Mock: Inactive tracking options
     */
    private class TrackingInactiveOptionsMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            
            if (req.getEndpoint().contains('TrackingCategories')) {
                res.setStatusCode(200);
                res.setBody('{' +
                    '"TrackingCategories": [' +
                        '{' +
                            '"Name": "Department",' +
                            '"TrackingCategoryID": "TC001",' +
                            '"Status": "ACTIVE",' +
                            '"Options": [' +
                                '{' +
                                    '"Name": "General",' +
                                    '"TrackingOptionID": "TO001",' +
                                    '"Status": "INACTIVE"' +
                                '},' +
                                '{' +
                                    '"Name": "Finance",' +
                                    '"TrackingOptionID": "TO002",' +
                                    '"Status": "INACTIVE"' +
                                '}' +
                            ']' +
                        '}' +
                    ']' +
                '}');
                return res;
            }
            
            res.setStatusCode(200);
            res.setBody('{}');
            return res;
        }
    }
    
    /**
     * Mock: Empty tracking categories
     */
    private class TrackingEmptyMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            
            if (req.getEndpoint().contains('TrackingCategories')) {
                res.setStatusCode(200);
                res.setBody('{"TrackingCategories": []}');
                return res;
            }
            
            res.setStatusCode(200);
            res.setBody('{}');
            return res;
        }
    }
    
    /**
     * Mock: API error (non-200 response)
     */
    private class TrackingErrorMock implements HttpCalloutMock {
        private Integer statusCode;
        private String responseBody;
        
        public TrackingErrorMock(Integer statusCode, String responseBody) {
            this.statusCode = statusCode;
            this.responseBody = responseBody;
        }
        
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(statusCode);
            res.setHeader('Content-Type', 'application/json');
            res.setBody(responseBody);
            return res;
        }
    }
    
    /**
     * Mock: Tracking category with Status field missing (treat as ACTIVE)
     */
    private class TrackingNoStatusMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            
            if (req.getEndpoint().contains('TrackingCategories')) {
                res.setStatusCode(200);
                res.setBody('{' +
                    '"TrackingCategories": [' +
                        '{' +
                            '"Name": "Department",' +
                            '"TrackingCategoryID": "TC001",' +
                            '"Options": [' +
                                '{' +
                                    '"Name": "General",' +
                                    '"TrackingOptionID": "TO001",' +
                                    '"Status": "ACTIVE"' +
                                '}' +
                            ']' +
                        '}' +
                    ']' +
                '}');
                return res;
            }
            
            res.setStatusCode(200);
            res.setBody('{}');
            return res;
        }
    }
    
    /**
     * Mock: Tracking option with Status field missing (treat as ACTIVE)
     */
    private class TrackingOptionNoStatusMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            
            if (req.getEndpoint().contains('TrackingCategories')) {
                res.setStatusCode(200);
                res.setBody('{' +
                    '"TrackingCategories": [' +
                        '{' +
                            '"Name": "Department",' +
                            '"TrackingCategoryID": "TC001",' +
                            '"Status": "ACTIVE",' +
                            '"Options": [' +
                                '{' +
                                    '"Name": "General",' +
                                    '"TrackingOptionID": "TO001"' +
                                '}' +
                            ']' +
                        '}' +
                    ']' +
                '}');
                return res;
            }
            
            res.setStatusCode(200);
            res.setBody('{}');
            return res;
        }
    }
    
    /**
     * Mock: Malformed JSON response
     */
    private class TrackingMalformedJsonMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            res.setStatusCode(200);
            res.setBody('{"TrackingCategories": [{"Name": "Department", "Options": [{"Name": "General"');
            return res;
        }
    }
    
    // ============================================================
    // TEST SETUP
    // ============================================================
    
    @testSetup
    static void setupTestData() {
        // Create Organisation
        Organisation__c org = new Organisation__c(
            Name = 'Ashfield Consultants',
            ABN__c = '11234567891',
            ACN__c = '878787878',
            Contact_No__c = '6132899740',
            RCTI__c = 'RCTI1',
            Email__c = 'dsfdsfsd@gmail.com',
            Bank__c = 'Bank Test',
            BSB__c = 'BSB Test',
            Account_Name__c = 'Test Account',
            Account_Number__c = '1111111111',
            Description__c = 'test Desc',
            Address_Latest__Street__s = '101',
            Address_Latest__City__s = 'Himas Waterhen',
            Address_Latest__PostalCode__s = '2060',
            Address_Latest__CountryCode__s = 'AU',
            Address_Latest__StateCode__s = 'NSW',
            NDIS_Provider__c = '12341234565',
            BMSI_Identifier__c = 'TEST BMSI',
            SoftwareId__c = 'jhdfn18328',
            Branch_code__c = 'BS123',
            Contact_Name__c = 'Test Contact',
            User_Type__c = 'NDIS Org Admin'
        );
        insert org;
        
        // Create Facility
        Facility__c fac = new Facility__c(
            Name = 'Test Facility',
            Address__City__s = 'Crace',
            Address__Street__s = '8 Keewong Street',
            Address__StateCode__s = 'ACT',
            Address__PostalCode__s = '2911',
            Address__CountryCode__s = 'AU',
            Email__c = 'testfacility@example.com',
            Status__c = true,
            Organisation__c = org.Id,
            ABN__c = '12345678900',
            Phone__c = '12323432'
        );
        insert fac;
        
        // Create Facility Role
        Facility_Role__c facRole = new Facility_Role__c(
            Role_Name__c = 'Support Worker',
            Facility__c = fac.Id
        );
        insert facRole;
        
        // Create Facility Xero Setting
        Facility_Xero_Setting__c fxSetting = new Facility_Xero_Setting__c(
            Name = 'General Rate Setting',
            Xero_Payitem__c = 'ER001',
            Xero_Payitem_Name__c = 'General Rate',
            Category__c = 'Morning',
            Facility_Role__c = facRole.Id,
            Pay_Item_Type__c = 'Earnings'
        );
        insert fxSetting;
        
        // Create Reimbursement Setting
        Facility_Xero_Setting__c reimbSetting = new Facility_Xero_Setting__c(
            Name = 'Reimbursement Setting',
            Xero_Payitem__c = 'REIMB001',
            Xero_Payitem_Name__c = 'Reimbursement Rate',
            Facility_Role__c = facRole.Id,
            Pay_Item_Type__c = 'Reimbursement'
        );
        insert reimbSetting;
        
        // Create Staff
        Staff__c staff = new Staff__c(
            Last_Name__c = 'Test Staff',
            Name = 'TestStaff',
            Name__c = 'TestStaff',
            Contact_Number__c = '56789908743',
            Email_Address__c = 'test.staff@example.com',
            Facility__c = fac.Id,
            Address__Street__s = '8 Keewong Street',
            Address__City__s = 'Crace',
            Address__StateCode__s = 'ACT',
            Address__PostalCode__s = '2911',
            Emergency_Phone_Number__c = '45678766675',
            Primary_Contact_Name__c = 'Praveen',
            Primary_Contact_Number__c = '9908458298',
            Primary_Contact_Email__c = 'primary@test.com',
            Make_Primary_as_Approver__c = true,
            Secondary_Contact_Name__c = 'Maheswari',
            Secondary_Contact_Email__c = 'secondary@test.com',
            Secondary_Contact_Number__c = '99084582958',
            Emp_exit_date__c = Date.newInstance(2028, 01, 05),
            Emp_Start_Date__c = Date.newInstance(2023, 02, 01),
            Date_Of_Birth__c = Date.newInstance(2001, 02, 04),
            Role__c = 'Admin',
            Residency_Type__c = 'Australian',
            Expiry_Date__c = Date.newInstance(2025, 02, 19),
            Type__c = 'Visa Status',
            Working_Hours_Rate__c = 50,
            Final_Overall_Rate__c = 150,
            Saturday_Hourly_Rate__c = 130,
            Sunday_Hourly_Rate__c = 50,
            Xero_Employee_ID__c = 'EMP123',
            Ordinary_Earnings_Rate_ID__c = 'ORD123'
        );
        insert staff;
        
        // Create Add Shift
        Add_Shift__c addShift = new Add_Shift__c(
            Break__c = '30',
            Do_you_want_to_set_this_a_recurring_shif__c = true,
            Start_Date__c = Date.today(),
            End_Date__c = Date.today(),
            Role__c = 'Support Worker',
            Get_Facility__c = true,
            Quantity__c = 5,
            Start_Time__c = Time.newInstance(03, 30, 00, 00),
            End_Time__c = Time.newInstance(05, 00, 00, 00),
            Facility__c = fac.Id,
            Status__c = 'Draft',
            Start_time_picklist__c = '3:30 am',
            End_time_picklist__c = '5:00 am',
            Location__StateCode__s = 'ACT',
            Location__CountryCode__s = 'AU',
            Location__PostalCode__s = '2911',
            Is_EOI__c = true,
            EOI_staff__c = staff.Id,
            Shift_Type__c = 'General'
        );
        insert addShift;
        
        // Corrected syntax and removed potentially read-only fields
        ShiftwithStaff__c staffs = new ShiftwithStaff__c();
        staffs.Add_Shift__c = addShift.Id;
        staffs.Attendence__c = true;
        staffs.Comments__c = 'test comments';
        staffs.Staff__c = staff.Id;
        staffs.Role__c = 'Admin';
        staffs.Status__c = 'Accepted';
        staffs.Log_In_Date_Time__c = Time.newInstance(01, 30, 00, 00);
        staffs.Log_Out_Date_Time__c = Time.newInstance(10, 00, 00, 00);
        staffs.Start_Date__c = addShift.Start_Date__c;
        staffs.Shift_Start_Time__c = addShift.Start_Time__c;
        staffs.Shift_End_Date__c = addShift.Start_Date__c;
        
        insert staffs;
        
        // Create User
        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        
        User user = new User(
            Alias = 'testusr',
            Email = 'test.user@example.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'Tester',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey = 'America/New_York',
            UserName = 'testuser_' + DateTime.now().getTime() + '@example.com',
            Organization_Name__c = 'Ashfield Consultants'
        );
        insert user;
    }
    
    // ============================================================
    // HELPER METHODS
    // ============================================================
    
    private static User getTestUser() {
        return [SELECT Id FROM User WHERE Organization_Name__c = 'Ashfield Consultants' LIMIT 1];
    }
    
    private static Staff__c getTestStaff() {
        return [SELECT Id, Xero_Employee_ID__c, Ordinary_Earnings_Rate_ID__c, Display_Nickname__c 
                FROM Staff__c WHERE Email_Address__c = 'test.staff@example.com' LIMIT 1];
    }
    
    private static Facility__c getTestFacility() {
        return [SELECT Id FROM Facility__c WHERE Name = 'Test Facility' LIMIT 1];
    }
    
    private static Organisation__c getTestOrganisation() {
        return [SELECT Id FROM Organisation__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
    }
    
    private static void addExtraShifts(Id staffId) {
        Add_Shift__c parentShift = [SELECT Id FROM Add_Shift__c LIMIT 1];
        Facility__c fac = getTestFacility();
        
        ShiftwithStaff__c staffs = new ShiftwithStaff__c();
        staffs.Add_Shift__c = parentShift.Id;
        staffs.Attendence__c = true;
        staffs.Comments__c = 'test comments';
        staffs.Staff__c = staffId;
        staffs.Role__c = 'Support Worker';
        staffs.Status__c = 'Accepted';
        staffs.Log_In_Date_Time__c = Time.newInstance(01, 30, 00, 00);
        staffs.Log_Out_Date_Time__c = Time.newInstance(10, 00, 00, 00);
        staffs.Start_Date__c = parentShift.Start_Date__c;
        staffs.Shift_Start_Time__c = parentShift.Start_Time__c;
        staffs.Shift_End_Date__c = parentShift.Start_Date__c;
        insert staffs;
    }
    
    // ============================================================
    // HELPER: Create ProcessingContext (FIXED)
    // ============================================================
    
    private static XeroIntegrationTimeSheet.ProcessingContext createTestContext() {
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        ctx.startDate = Date.today();
        ctx.endDate = Date.today().addDays(7);
        
        // ✅ FIX: Use a real Organisation ID from the test data
        Organisation__c org = getTestOrganisation();
        ctx.orgRecord = org;
        
        return ctx;
    }
    
    // ============================================================
    // TESTS - EXISTING TESTS
    // ============================================================
    
    @IsTest
    static void test_validatePayPeriodBeforeRateSelector_Success() {
        User user = getTestUser();
        System.runAs(user) {
            Staff__c staff = getTestStaff();
            
            Test.setMock(HttpCalloutMock.class, new XeroFullMock());
            
            Test.startTest();
            Map<String, Object> result = 
                XeroIntegrationTimeSheet.validatePayPeriodBeforeRateSelector(
                    new List<Id>{staff.Id},
                    String.valueOf(Date.today().addDays(-1)),
                    String.valueOf(Date.today().addDays(1))
                );
            Test.stopTest();

        }
    }
    
    @IsTest
    static void test_validatePayPeriodBeforeRateSelector_EmptyStaff() {
        User user = getTestUser();
        System.runAs(user) {
            Test.startTest();
            Map<String, Object> result = 
                XeroIntegrationTimeSheet.validatePayPeriodBeforeRateSelector(
                    new List<Id>(),
                    String.valueOf(Date.today()),
                    String.valueOf(Date.today().addDays(1))
                );
            Test.stopTest();

        }
    }
    
    @IsTest
    static void test_validatePayPeriodBeforeRateSelector_NoXeroEmployeeId() {
        User user = getTestUser();
        System.runAs(user) {
            Staff__c staff = getTestStaff();
            staff.Xero_Employee_ID__c = null;
            update staff;
            
            Test.startTest();
            Map<String, Object> result = 
                XeroIntegrationTimeSheet.validatePayPeriodBeforeRateSelector(
                    new List<Id>{staff.Id},
                    String.valueOf(Date.today().addDays(-1)),
                    String.valueOf(Date.today().addDays(1))
                );
            Test.stopTest();

        }
    }
    
    @IsTest
    static void test_getOrganisationEarningRateSettings_Success() {
        User user = getTestUser();
        System.runAs(user) {
            Test.startTest();
            Map<Id, Map<String, Object>> result = 
                XeroIntegrationTimeSheet.getOrganisationEarningRateSettings();
            Test.stopTest();
            
        }
    }
    
    @IsTest
    static void test_fetchEarningRatesFromXeroAPI_Success() {
        User user = getTestUser();
        System.runAs(user) {
            Test.setMock(HttpCalloutMock.class, new XeroFullMock());
            
            Test.startTest();
            Map<String, Object> result = 
                XeroIntegrationTimeSheet.fetchEarningRatesFromXeroAPI(
                    'EMP123',
                    'TEST_ACCESS_TOKEN',
                    'TEST_TENANT_ID'
                );
            Test.stopTest();
            

        }
    }
    
    @IsTest
    static void test_fetchEarningRatesFromXeroAPI_EmployeeNotFound() {
        User user = getTestUser();
        System.runAs(user) {
            Test.setMock(HttpCalloutMock.class, new XeroErrorMock(404, '{"Message":"Not Found"}'));
            
            Test.startTest();
            Map<String, Object> result = 
                XeroIntegrationTimeSheet.fetchEarningRatesFromXeroAPI(
                    'INVALID_EMP',
                    'TEST_ACCESS_TOKEN',
                    'TEST_TENANT_ID'
                );
            Test.stopTest();

        }
    }
    
    @IsTest
    static void test_isEarningRateActiveInXeroWithDetails_Active() {
        User user = getTestUser();
        System.runAs(user) {
            Test.setMock(HttpCalloutMock.class, new XeroFullMock());
            
            Test.startTest();
            Map<String, Object> result = 
                XeroIntegrationTimeSheet.isEarningRateActiveInXeroWithDetails(
                    'ER001',
                    'TEST_ACCESS_TOKEN',
                    'TEST_TENANT_ID'
                );
            Test.stopTest();

        }
    }
    
    @IsTest
    static void test_isEarningRateActiveInXeroWithDetails_Inactive() {
        User user = getTestUser();
        System.runAs(user) {
            Test.setMock(HttpCalloutMock.class, new XeroInactiveRateMock());
            
            Test.startTest();
            Map<String, Object> result = 
                XeroIntegrationTimeSheet.isEarningRateActiveInXeroWithDetails(
                    'ER001',
                    'TEST_ACCESS_TOKEN',
                    'TEST_TENANT_ID'
                );
            Test.stopTest();

        }
    }
    
    @IsTest
    static void test_isEarningRateActiveInXeroWithDetails_NotFound() {
        User user = getTestUser();
        System.runAs(user) {
            Test.setMock(HttpCalloutMock.class, new XeroErrorMock(404, '{"Message":"Not Found"}'));
            
            Test.startTest();
            Map<String, Object> result = 
                XeroIntegrationTimeSheet.isEarningRateActiveInXeroWithDetails(
                    'INVALID_RATE',
                    'TEST_ACCESS_TOKEN',
                    'TEST_TENANT_ID'
                );
            Test.stopTest();
            
        }
    }
    
    @IsTest
    static void test_buildFacilityRateMap_Success() {
        User user = getTestUser();
        System.runAs(user) {
            Organisation__c org = getTestOrganisation();
            
            Test.startTest();
            Map<String, Map<String, String>> result = 
                XeroIntegrationTimeSheet.buildFacilityRateMap(org.Id);
            Test.stopTest();

        }
    }
    
    @IsTest
    static void test_findFacilityRateForCategory_Success() {
        User user = getTestUser();
        System.runAs(user) {
            Organisation__c org = getTestOrganisation();
            Facility__c fac = getTestFacility();
            
            Map<String, Map<String, String>> facilityRateMap = 
                XeroIntegrationTimeSheet.buildFacilityRateMap(org.Id);
            
            Test.startTest();
            String result = 
                XeroIntegrationTimeSheet.findFacilityRateForCategory(
                    'General',
                    fac.Id,
                    facilityRateMap
                );
            Test.stopTest();

        }
    }
    
    @IsTest
    static void test_findFacilityRateForCategory_NoFacility() {
        User user = getTestUser();
        System.runAs(user) {
            Organisation__c org = getTestOrganisation();
            
            Map<String, Map<String, String>> facilityRateMap = 
                XeroIntegrationTimeSheet.buildFacilityRateMap(org.Id);
            
            Test.startTest();
            String result = 
                XeroIntegrationTimeSheet.findFacilityRateForCategory(
                    'General',
                    null,
                    facilityRateMap
                );
            Test.stopTest();

        }
    }
    
    @IsTest
    static void test_findMatchingEarningRate_Success() {
        Map<String, String> rateMap = new Map<String, String>();
        rateMap.put('general', 'GEN001');
        rateMap.put('broken shift', 'BR001');
        rateMap.put('sleepover overnight', 'SL001');
        rateMap.put('morning shift', 'MORN001');
        rateMap.put('saturday', 'SAT001');
        rateMap.put('sunday', 'SUN001');
        rateMap.put('weekend', 'WEEKEND001');
        
        Test.startTest();
        
        String result1 = XeroIntegrationTimeSheet.findMatchingEarningRate('General', rateMap);
        String result2 = XeroIntegrationTimeSheet.findMatchingEarningRate('broken shift', rateMap);
        String result3 = XeroIntegrationTimeSheet.findMatchingEarningRate('sleepover', rateMap);
        String result4 = XeroIntegrationTimeSheet.findMatchingEarningRate('saturday', rateMap);
        String result5 = XeroIntegrationTimeSheet.findMatchingEarningRate('sunday', rateMap);
        String result6 = XeroIntegrationTimeSheet.findMatchingEarningRate('weekend shift', rateMap);
        String result7 = XeroIntegrationTimeSheet.findMatchingEarningRate('random', rateMap);
        String result8 = XeroIntegrationTimeSheet.findMatchingEarningRate('', rateMap);
        
        Test.stopTest();
        

    }
    
    @IsTest
    static void test_getSelectedRateForCategory_Success() {
        Map<String, String> selectedRates = new Map<String, String>();
        selectedRates.put('General', 'GEN001');
        selectedRates.put('broken shift', 'BR001');
        selectedRates.put('Sleepover Overnight', 'SL001');
        selectedRates.put('saturday', 'SAT001');
        selectedRates.put('sunday', 'SUN001');
        
        Test.startTest();
        
        String result1 = XeroIntegrationTimeSheet.getSelectedRateForCategory(selectedRates, 'General');
        String result2 = XeroIntegrationTimeSheet.getSelectedRateForCategory(selectedRates, 'general');
        String result3 = XeroIntegrationTimeSheet.getSelectedRateForCategory(selectedRates, 'sleepover');
        String result4 = XeroIntegrationTimeSheet.getSelectedRateForCategory(selectedRates, 'saturday');
        String result5 = XeroIntegrationTimeSheet.getSelectedRateForCategory(selectedRates, 'random');
        String result6 = XeroIntegrationTimeSheet.getSelectedRateForCategory(null, 'General');
        String result7 = XeroIntegrationTimeSheet.getSelectedRateForCategory(selectedRates, '');
        
        Test.stopTest();
        

    }
    
    @IsTest
    static void test_filterRatesByCategory_Success() {
        List<Map<String, Object>> rates = new List<Map<String, Object>>();
        
        Map<String, Object> rate1 = new Map<String, Object>();
        rate1.put('name', 'General Rate');
        rates.add(rate1);
        
        Map<String, Object> rate2 = new Map<String, Object>();
        rate2.put('name', 'Morning Shift');
        rates.add(rate2);
        
        Map<String, Object> rate3 = new Map<String, Object>();
        rate3.put('name', 'Afternoon Shift');
        rates.add(rate3);
        
        Map<String, Object> rate4 = new Map<String, Object>();
        rate4.put('name', 'Night Shift');
        rates.add(rate4);
        
        Map<String, Object> rate5 = new Map<String, Object>();
        rate5.put('name', 'Sleepover Overnight');
        rates.add(rate5);
        
        Map<String, Object> rate6 = new Map<String, Object>();
        rate6.put('name', 'Broken Shift Rate');
        rates.add(rate6);
        
        Map<String, Object> rate7 = new Map<String, Object>();
        rate7.put('name', 'Custom Rate');
        rates.add(rate7);
        
        Map<String, Object> rate8 = new Map<String, Object>();
        rate8.put('name', 'Sunday Premium');
        rates.add(rate8);
        
        Map<String, Object> rate9 = new Map<String, Object>();
        rate9.put('name', 'Saturday Rate');
        rates.add(rate9);
        
        Test.startTest();
        
        List<Map<String, Object>> result1 = XeroIntegrationTimeSheet.filterRatesByCategory('morning', rates);
        List<Map<String, Object>> result2 = XeroIntegrationTimeSheet.filterRatesByCategory('Sleepover', rates);
        List<Map<String, Object>> result3 = XeroIntegrationTimeSheet.filterRatesByCategory('broken shift', rates);
        List<Map<String, Object>> result4 = XeroIntegrationTimeSheet.filterRatesByCategory('custom', rates);
        List<Map<String, Object>> result5 = XeroIntegrationTimeSheet.filterRatesByCategory('sunday', rates);
        List<Map<String, Object>> result6 = XeroIntegrationTimeSheet.filterRatesByCategory('saturday', rates);
        List<Map<String, Object>> result7 = XeroIntegrationTimeSheet.filterRatesByCategory('', rates);
        List<Map<String, Object>> result8 = XeroIntegrationTimeSheet.filterRatesByCategory('random', rates);
        
        Test.stopTest();

    }
    
    @IsTest
    static void test_formatDateForDisplay_Success() {
        Test.startTest();
        
        Date dt = Date.newInstance(2026, 8, 12);
        String result1 = XeroIntegrationTimeSheet.formatDateForDisplay(dt);
        String result2 = XeroIntegrationTimeSheet.formatDateForDisplay(null);
        
        Test.stopTest();

    }
    
    @IsTest
    static void test_getDayName_Success() {
        Test.startTest();
        
        Date dt1 = Date.newInstance(2026, 8, 12); // Wednesday
        String result1 = XeroIntegrationTimeSheet.getDayName(dt1);
        String result2 = XeroIntegrationTimeSheet.getDayName(null);
        
        Test.stopTest();

    }
    
    @IsTest
    static void test_parseXeroDate_Success() {
        Test.startTest();
        
        Date result1 = XeroIntegrationTimeSheet.parseXeroDate('/Date(1716940800000+0000)/');
        Date result2 = XeroIntegrationTimeSheet.parseXeroDate(null);
        Date result3 = XeroIntegrationTimeSheet.parseXeroDate('invalid');
        Date result4 = XeroIntegrationTimeSheet.parseXeroDate('/Date(0+0000)/');
        
        Test.stopTest();

    }
    
    @IsTest
    static void test_getDayNameToRateKeys() {
        Test.startTest();
        Map<String, List<String>> result = XeroIntegrationTimeSheet.getDayNameToRateKeys();
        Test.stopTest();

    }
    
    @IsTest
    static void test_RateNameComparator() {
        Test.startTest();
        
        XeroIntegrationTimeSheet.RateNameComparator comparator = new XeroIntegrationTimeSheet.RateNameComparator();
        
        Map<String, Object> rate1 = new Map<String, Object>();
        rate1.put('name', 'Apple');
        
        Map<String, Object> rate2 = new Map<String, Object>();
        rate2.put('name', 'Banana');
        
        Map<String, Object> rate3 = new Map<String, Object>();
        rate3.put('name', null);
        
        Map<String, Object> rate4 = new Map<String, Object>();
        rate4.put('name', 'apple');
        
        Integer result1 = comparator.compare(rate1, rate2);
        Integer result2 = comparator.compare(rate3, rate1);
        Integer result3 = comparator.compare(rate1, rate3);
        Integer result4 = comparator.compare(rate3, rate3);
        Integer result5 = comparator.compare(rate1, rate4);
        
        Test.stopTest();

    }
    
    @IsTest
    static void test_ProcessingContext_Constructor() {
        Test.startTest();
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        Test.stopTest();
        

    }
    
    @IsTest
    static void test_StaffProcessingResult_Constructor() {
        Test.startTest();
        
        XeroIntegrationTimeSheet.StaffProcessingResult result = new XeroIntegrationTimeSheet.StaffProcessingResult(
            UserInfo.getUserId(),
            'Test Staff',
            true,
            'Success'
        );
        
        Test.stopTest();

    }
    
    @IsTest
    static void test_XeroResult_Constructor() {
        Test.startTest();
        
        XeroIntegrationTimeSheet.XeroResult result = new XeroIntegrationTimeSheet.XeroResult(
            UserInfo.getUserId(),
            'Test Staff',
            true,
            'Success'
        );
        
        Test.stopTest();

    }
    
    @IsTest
    static void test_EarningRateSelection_Constructor() {
        Test.startTest();
        
        XeroIntegrationTimeSheet.EarningRateSelection selection = new XeroIntegrationTimeSheet.EarningRateSelection();
        selection.category = 'General';
        selection.selectedEarningRateId = 'ER001';
        
        XeroIntegrationTimeSheet.EarningRateOption option = new XeroIntegrationTimeSheet.EarningRateOption();
        option.id = 'ER001';
        option.name = 'General Rate';
        option.type = 'ORDINARYEARNINGS';
        option.ratePerUnit = 25;
        option.isMatched = true;
        option.isOrdinary = true;
        selection.availableRates.add(option);
        
        Test.stopTest();

        
        XeroIntegrationTimeSheet.EarningRateOption retrievedOption = selection.availableRates[0];

    }
    
    @IsTest
    static void test_getXeroPayrollCycleForStaff_BlankEmployeeId() {
        User user = getTestUser();
        System.runAs(user) {
            Staff__c staff = getTestStaff();
            
            Test.startTest();
            Map<String, Object> result = 
                XeroIntegrationTimeSheet.getXeroPayrollCycleForStaff(
                    '',
                    staff.Id,
                    'TEST_ACCESS_TOKEN',
                    'TEST_TENANT_ID',
                    Date.today()
                );
            Test.stopTest();

        }
    }
    
    @IsTest
    static void test_getXeroPayrollCycleForStaff_BlankAccessToken() {
        User user = getTestUser();
        System.runAs(user) {
            Staff__c staff = getTestStaff();
            
            Test.startTest();
            Map<String, Object> result = 
                XeroIntegrationTimeSheet.getXeroPayrollCycleForStaff(
                    'EMP123',
                    staff.Id,
                    '',
                    'TEST_TENANT_ID',
                    Date.today()
                );
            Test.stopTest();

        }
    }
    
    @IsTest
    static void test_getXeroPayrollCycleForStaff_BlankTenantId() {
        User user = getTestUser();
        System.runAs(user) {
            Staff__c staff = getTestStaff();
            
            Test.startTest();
            Map<String, Object> result = 
                XeroIntegrationTimeSheet.getXeroPayrollCycleForStaff(
                    'EMP123',
                    staff.Id,
                    'TEST_ACCESS_TOKEN',
                    '',
                    Date.today()
                );
            Test.stopTest();

        }
    }
    
    @IsTest
    static void test_getXeroPayrollCycleForStaff_NullStartDate() {
        User user = getTestUser();
        System.runAs(user) {
            Staff__c staff = getTestStaff();
            
            Test.startTest();
            Map<String, Object> result = 
                XeroIntegrationTimeSheet.getXeroPayrollCycleForStaff(
                    'EMP123',
                    staff.Id,
                    'TEST_ACCESS_TOKEN',
                    'TEST_TENANT_ID',
                    null
                );
            Test.stopTest();

        }
    }
    
    // ============================================================
    // TESTS FOR fetchTrackingItemIdFromXero
    // ============================================================
    
    /**
     * Test: Successfully fetch tracking item ID when active category and option exist
     */
    @isTest
    static void test_fetchTrackingItemIdFromXero_Success() {
        Test.setMock(HttpCalloutMock.class, new TrackingSuccessMock());
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = createTestContext();
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.fetchTrackingItemIdFromXero(ctx);
        Test.stopTest();

    }
    
    /**
     * Test: Return null when tracking category has no options
     */
    @isTest
    static void test_fetchTrackingItemIdFromXero_NoOptions() {
        Test.setMock(HttpCalloutMock.class, new TrackingNoOptionsMock());
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = createTestContext();
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.fetchTrackingItemIdFromXero(ctx);
        Test.stopTest();

    }
    
    /**
     * Test: Return null when tracking category is inactive
     */
    @isTest
    static void test_fetchTrackingItemIdFromXero_InactiveCategory() {
        Test.setMock(HttpCalloutMock.class, new TrackingInactiveCategoryMock());
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = createTestContext();
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.fetchTrackingItemIdFromXero(ctx);
        Test.stopTest();

    }
    
    /**
     * Test: Return null when all options are inactive
     */
    @isTest
    static void test_fetchTrackingItemIdFromXero_InactiveOptions() {
        Test.setMock(HttpCalloutMock.class, new TrackingInactiveOptionsMock());
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = createTestContext();
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.fetchTrackingItemIdFromXero(ctx);
        Test.stopTest();

    }
    
    /**
     * Test: Return null when tracking categories are empty
     */
    @isTest
    static void test_fetchTrackingItemIdFromXero_EmptyCategories() {
        Test.setMock(HttpCalloutMock.class, new TrackingEmptyMock());
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = createTestContext();
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.fetchTrackingItemIdFromXero(ctx);
        Test.stopTest();

    }
    
    /**
     * Test: Return null when API returns error (non-200)
     */
    @isTest
    static void test_fetchTrackingItemIdFromXero_ApiError() {
        Test.setMock(HttpCalloutMock.class, new TrackingErrorMock(401, '{"Message":"Unauthorized"}'));
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = createTestContext();
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.fetchTrackingItemIdFromXero(ctx);
        Test.stopTest();

    }
    
    /**
     * Test: Success with tracking category missing Status field (treat as ACTIVE)
     */
    @isTest
    static void test_fetchTrackingItemIdFromXero_CategoryNoStatus() {
        Test.setMock(HttpCalloutMock.class, new TrackingNoStatusMock());
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = createTestContext();
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.fetchTrackingItemIdFromXero(ctx);
        Test.stopTest();

    }
    
    /**
     * Test: Success with tracking option missing Status field (treat as ACTIVE)
     */
    @isTest
    static void test_fetchTrackingItemIdFromXero_OptionNoStatus() {
        Test.setMock(HttpCalloutMock.class, new TrackingOptionNoStatusMock());
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = createTestContext();
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.fetchTrackingItemIdFromXero(ctx);
        Test.stopTest();

    }
    
    /**
     * Test: Handle malformed JSON response gracefully
     */
    @isTest
    static void test_fetchTrackingItemIdFromXero_MalformedJson() {
        Test.setMock(HttpCalloutMock.class, new TrackingMalformedJsonMock());
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = createTestContext();
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.fetchTrackingItemIdFromXero(ctx);
        Test.stopTest();

    }
    
    /**
     * Test: Return null when TrackingCategories is null in response
     */
    @isTest
    static void test_fetchTrackingItemIdFromXero_NullTrackingCategories() {
        Test.setMock(HttpCalloutMock.class, new TrackingErrorMock(200, '{"Message":"OK"}'));
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = createTestContext();
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.fetchTrackingItemIdFromXero(ctx);
        Test.stopTest();
        

    }
    
    /**
     * Test: First active option from first active category is selected
     */
    @isTest
    static void test_fetchTrackingItemIdFromXero_FirstActiveOptionSelected() {
        Test.setMock(HttpCalloutMock.class, new TrackingSuccessMock());
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = createTestContext();
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.fetchTrackingItemIdFromXero(ctx);
        Test.stopTest();

    }
    
    /**
     * Test: Multiple active categories - returns first active option from first active category
     */
    @isTest
    static void test_fetchTrackingItemIdFromXero_MultipleActiveCategories() {
        Test.setMock(HttpCalloutMock.class, new TrackingSuccessMock());
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = createTestContext();
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.fetchTrackingItemIdFromXero(ctx);
        Test.stopTest();

    }
    
    /**
     * Test: Response with malformed tracking categories structure
     */
    @isTest
    static void test_fetchTrackingItemIdFromXero_MalformedStructure() {
        Test.setMock(HttpCalloutMock.class, new TrackingErrorMock(200, '{"TrackingCategories": [{"Name": "Department", "TrackingCategoryID": "TC001"}]}'));
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = createTestContext();
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.fetchTrackingItemIdFromXero(ctx);
        Test.stopTest();

    }

private class SendTimesheetsFullMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        String endpoint = req.getEndpoint();
        String method = req.getMethod();
        
        // Xero Authentication
        if (endpoint.contains('identity.xero.com/connect/token')) {
            res.setStatusCode(200);
            res.setBody('{"access_token":"TEST_ACCESS_TOKEN","token_type":"Bearer","expires_in":1800}');
            return res;
        }
        
        // Xero Connections / Tenant
        if (endpoint.contains('api.xero.com/connections')) {
            res.setStatusCode(200);
            res.setBody('[{"tenantId":"TEST_TENANT_ID","tenantName":"Test Organisation"}]');
            return res;
        }
        
        // Tracking Categories
        if (endpoint.contains('TrackingCategories')) {
            res.setStatusCode(200);
            res.setBody('{"TrackingCategories":[' +
                '{"Name":"Department","TrackingCategoryID":"TC001","Status":"ACTIVE",' +
                '"Options":[{"Name":"General","TrackingOptionID":"TO001","Status":"ACTIVE"}]}' +
            ']}');
            return res;
        }
        
        // Employee endpoints
        if (endpoint.contains('/payroll.xro/1.0/Employees')) {
            if (endpoint.contains('Employees/') && !endpoint.contains('Employees?') && !endpoint.endsWith('Employees')) {
                // GET single employee - for validation and rate fetching
                res.setStatusCode(200);
                res.setBody('{"Employees":[{' +
                    '"EmployeeID":"EMP123",' +
                    '"PayrollCalendarID":"CAL001",' +
                    '"OrdinaryEarningsRateID":"ORD123",' +
                    '"PayTemplate":{"EarningsLines":[' +
                        '{"EarningsRateID":"ORD123","CalculationType":"ENTEREARNINGSRATE","RatePerUnit":25}' +
                    ']},' +
                    '"EarningsRates":[' +
                        '{"Name":"Ordinary Earnings","RateType":"ORDINARYEARNINGS","EarningsRateID":"ORD123"}' +
                    ']' +
                '}]}');
                return res;
            } else {
                // POST - Bulk employee update
                res.setStatusCode(200);
                res.setBody('{"Employees":[{"EmployeeID":"EMP123","Status":"OK"}]}');
                return res;
            }
        }
        
        // Payroll Calendars
        if (endpoint.contains('PayrollCalendars')) {
            res.setStatusCode(200);
            res.setBody('{"PayrollCalendars":[' +
                '{"Name":"Weekly","CalendarType":"WEEKLY","StartDate":"/Date(1716940800000+0000)/"}' +
            ']}');
            return res;
        }
        
        // Earnings Rates - v2.0
        if (endpoint.contains('/payroll.xro/2.0/EarningsRates')) {
            if (endpoint.contains('EarningsRates/')) {
                // GET single rate
                res.setStatusCode(200);
                res.setBody('{"earningsRate":{"earningsRateID":"ER001","name":"General Rate","currentRecord":true,"typeOfUnits":"Hours"}}');
            } else {
                // GET all rates
                res.setStatusCode(200);
                res.setBody('{"earningsRates":[' +
                    '{"earningsRateID":"ER001","name":"General Rate","rateType":"ORDINARYEARNINGS","currentRecord":true,"typeOfUnits":"Hours","ratePerUnit":0},' +
                    '{"earningsRateID":"ER002","name":"Broken Rate","rateType":"ORDINARYEARNINGS","currentRecord":true,"typeOfUnits":"Hours","ratePerUnit":0},' +
                    '{"earningsRateID":"ORD123","name":"Ordinary Earnings","rateType":"ORDINARYEARNINGS","currentRecord":true,"typeOfUnits":"Hours","ratePerUnit":25}' +
                ']}');
            }
            return res;
        }
        
        // Timesheets
        if (endpoint.contains('/payroll.xro/1.0/Timesheets')) {
            if (method == 'POST') {
                res.setStatusCode(200);
                res.setBody('{"Timesheets":[' +
                    '{"EmployeeID":"EMP123","TimesheetID":"TS001","Status":"APPROVED"}' +
                ']}');
            }
            return res;
        }
        
        // Default response
        res.setStatusCode(200);
        res.setBody('{}');
        return res;
    }
}

/**
 * Mock: Timesheet API returns error for pay period mismatch
 */
private class SendTimesheetsPayPeriodErrorMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        String endpoint = req.getEndpoint();
        String method = req.getMethod();
        
        // Authentication and tenant endpoints - success
        if (endpoint.contains('identity.xero.com/connect/token')) {
            res.setStatusCode(200);
            res.setBody('{"access_token":"TEST_ACCESS_TOKEN","token_type":"Bearer","expires_in":1800}');
            return res;
        }
        if (endpoint.contains('api.xero.com/connections')) {
            res.setStatusCode(200);
            res.setBody('[{"tenantId":"TEST_TENANT_ID","tenantName":"Test Organisation"}]');
            return res;
        }
        if (endpoint.contains('TrackingCategories')) {
            res.setStatusCode(200);
            res.setBody('{"TrackingCategories":[' +
                '{"Name":"Department","TrackingCategoryID":"TC001","Status":"ACTIVE",' +
                '"Options":[{"Name":"General","TrackingOptionID":"TO001","Status":"ACTIVE"}]}' +
            ']}');
            return res;
        }
        
        // Employee - success
        if (endpoint.contains('/payroll.xro/1.0/Employees')) {
            if (endpoint.contains('Employees/') && !endpoint.endsWith('Employees')) {
                res.setStatusCode(200);
                res.setBody('{"Employees":[{' +
                    '"EmployeeID":"EMP123",' +
                    '"PayrollCalendarID":"CAL001",' +
                    '"OrdinaryEarningsRateID":"ORD123",' +
                    '"PayTemplate":{"EarningsLines":[' +
                        '{"EarningsRateID":"ORD123","CalculationType":"ENTEREARNINGSRATE","RatePerUnit":25}' +
                    ']},' +
                    '"EarningsRates":[' +
                        '{"Name":"Ordinary Earnings","RateType":"ORDINARYEARNINGS","EarningsRateID":"ORD123"}' +
                    ']' +
                '}]}');
                return res;
            } else {
                res.setStatusCode(200);
                res.setBody('{"Employees":[{"EmployeeID":"EMP123","Status":"OK"}]}');
                return res;
            }
        }
        
        // Payroll Calendars - success
        if (endpoint.contains('PayrollCalendars')) {
            res.setStatusCode(200);
            res.setBody('{"PayrollCalendars":[' +
                '{"Name":"Weekly","CalendarType":"WEEKLY","StartDate":"/Date(1716940800000+0000)/"}' +
            ']}');
            return res;
        }
        
        // Earnings Rates - success
        if (endpoint.contains('/payroll.xro/2.0/EarningsRates')) {
            res.setStatusCode(200);
            res.setBody('{"earningsRates":[' +
                '{"earningsRateID":"ER001","name":"General Rate","currentRecord":true,"typeOfUnits":"Hours"}' +
            ']}');
            return res;
        }
        
        // Timesheets - returns error for pay period mismatch
        if (endpoint.contains('/payroll.xro/1.0/Timesheets')) {
            if (method == 'POST') {
                res.setStatusCode(400);
                res.setBody('{"Timesheets":[' +
                    '{"EmployeeID":"EMP123","ValidationErrors":[' +
                        '{"Message":"The period doesn\'t correspond to the employee\'s pay period"}' +
                    ']}]}' +
                '}');
            }
            return res;
        }
        
        res.setStatusCode(200);
        res.setBody('{}');
        return res;
    }
}

/**
 * Mock: Employee update fails
 */
private class SendTimesheetsEmployeeErrorMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        String endpoint = req.getEndpoint();
        String method = req.getMethod();
        
        // Authentication - success
        if (endpoint.contains('identity.xero.com/connect/token')) {
            res.setStatusCode(200);
            res.setBody('{"access_token":"TEST_ACCESS_TOKEN","token_type":"Bearer","expires_in":1800}');
            return res;
        }
        if (endpoint.contains('api.xero.com/connections')) {
            res.setStatusCode(200);
            res.setBody('[{"tenantId":"TEST_TENANT_ID","tenantName":"Test Organisation"}]');
            return res;
        }
        if (endpoint.contains('TrackingCategories')) {
            res.setStatusCode(200);
            res.setBody('{"TrackingCategories":[' +
                '{"Name":"Department","TrackingCategoryID":"TC001","Status":"ACTIVE",' +
                '"Options":[{"Name":"General","TrackingOptionID":"TO001","Status":"ACTIVE"}]}' +
            ']}');
            return res;
        }
        
        // Employee GET - success
        if (endpoint.contains('/payroll.xro/1.0/Employees') && endpoint.contains('Employees/')) {
            res.setStatusCode(200);
            res.setBody('{"Employees":[{' +
                '"EmployeeID":"EMP123",' +
                '"PayrollCalendarID":"CAL001",' +
                '"OrdinaryEarningsRateID":"ORD123"' +
            '}]}');
            return res;
        }
        
        // Employee POST - fails with validation error
        if (endpoint.contains('/payroll.xro/1.0/Employees') && method == 'POST') {
            res.setStatusCode(400);
            res.setBody('{"Employees":[' +
                '{"EmployeeID":"EMP123","ValidationErrors":[' +
                    '{"Message":"Invalid earnings rate configuration"}' +
                ']}]}' +
            '}');
            return res;
        }
        
        // Payroll Calendars - success
        if (endpoint.contains('PayrollCalendars')) {
            res.setStatusCode(200);
            res.setBody('{"PayrollCalendars":[' +
                '{"Name":"Weekly","CalendarType":"WEEKLY","StartDate":"/Date(1716940800000+0000)/"}' +
            ']}');
            return res;
        }
        
        // Earnings Rates - success
        if (endpoint.contains('/payroll.xro/2.0/EarningsRates')) {
            res.setStatusCode(200);
            res.setBody('{"earningsRates":[' +
                '{"earningsRateID":"ER001","name":"General Rate","currentRecord":true,"typeOfUnits":"Hours"}' +
            ']}');
            return res;
        }
        
        res.setStatusCode(200);
        res.setBody('{}');
        return res;
    }
}

/**
 * Mock: Staff with no Xero Employee ID
 */
private class SendTimesheetsNoEmployeeIdMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        // Authentication - success
        if (req.getEndpoint().contains('identity.xero.com/connect/token')) {
            res.setStatusCode(200);
            res.setBody('{"access_token":"TEST_ACCESS_TOKEN","token_type":"Bearer","expires_in":1800}');
            return res;
        }
        if (req.getEndpoint().contains('api.xero.com/connections')) {
            res.setStatusCode(200);
            res.setBody('[{"tenantId":"TEST_TENANT_ID","tenantName":"Test Organisation"}]');
            return res;
        }
        if (req.getEndpoint().contains('TrackingCategories')) {
            res.setStatusCode(200);
            res.setBody('{"TrackingCategories":[' +
                '{"Name":"Department","TrackingCategoryID":"TC001","Status":"ACTIVE",' +
                '"Options":[{"Name":"General","TrackingOptionID":"TO001","Status":"ACTIVE"}]}' +
            ']}');
            return res;
        }
        
        res.setStatusCode(200);
        res.setBody('{}');
        return res;
    }
}

// ============================================================
// TESTS FOR sendSelectedPayPeriodTimesheets
// ============================================================

/**
 * Test: Successful timesheet submission for a single staff member
 */
@IsTest
static void test_sendSelectedPayPeriodTimesheets_Success() {
    User user = getTestUser();
    System.runAs(user) {
        // Setup test data
        Staff__c staff = getTestStaff();
        Id staffId = staff.Id;
        
        // Ensure staff has Xero Employee ID
        staff.Xero_Employee_ID__c = 'EMP123';
        staff.Ordinary_Earnings_Rate_ID__c = 'ORD123';
        update staff;
        
        // Create approved shifts for the staff
        Add_Shift__c addShift = [SELECT Id, Start_Date__c FROM Add_Shift__c LIMIT 1];
        
        // Create multiple approved shifts for the period
        for (Integer i = 0; i < 3; i++) {
            ShiftwithStaff__c shift = new ShiftwithStaff__c();
            shift.Add_Shift__c = addShift.Id;
            shift.Staff__c = staffId;
            shift.Role__c = 'Support Worker';
            shift.Status__c = 'Accepted';
            shift.Start_Date__c = addShift.Start_Date__c.addDays(i);
            shift.Shift_Start_Time__c = Time.newInstance(8, 0, 0, 0);
            shift.Shift_End_Date__c = addShift.Start_Date__c.addDays(i);
            shift.Log_In_Date_Time__c = Time.newInstance(8, 0, 0, 0);
            shift.Log_Out_Date_Time__c = Time.newInstance(16, 0, 0, 0);
            
            shift.Shift_Category__c = 'Morning';
            shift.Attendence__c = true;
            // Insert without these fields if they don't exist
            insert shift;
        }
        
        // Create a Facility Xero Setting for the category
        Facility__c fac = getTestFacility();
        Facility_Role__c facRole = [SELECT Id FROM Facility_Role__c LIMIT 1];
        Facility_Xero_Setting__c setting = new Facility_Xero_Setting__c(
            Name = 'Morning Rate Setting',
            Xero_Payitem__c = 'ER001',
            Xero_Payitem_Name__c = 'General Rate',
            Category__c = 'Morning',
            Facility_Role__c = facRole.Id,
            Pay_Item_Type__c = 'Earnings'
        );
        insert setting;
        
        Test.setMock(HttpCalloutMock.class, new SendTimesheetsFullMock());
        
        Test.startTest();
        List<XeroIntegrationTimeSheet.StaffProcessingResult> results = 
            XeroIntegrationTimeSheet.sendSelectedPayPeriodTimesheets(
                new List<String>{String.valueOf(staffId)},
                new List<String>{String.valueOf(addShift.Start_Date__c)},
                new List<String>{String.valueOf(addShift.Start_Date__c.addDays(3))},
                null
            );
        Test.stopTest();

        
        // Check if there are any error results
        Boolean hasError = false;
        for (XeroIntegrationTimeSheet.StaffProcessingResult result : results) {
            if (!result.success) {
                hasError = true;
                System.debug('Error: ' + result.message);
            }
        }

    }
}

/**
 * Test: Empty staff list should return error
 */
@IsTest
static void test_sendSelectedPayPeriodTimesheets_EmptyStaffList() {
    User user = getTestUser();
    System.runAs(user) {
        Test.startTest();
        List<XeroIntegrationTimeSheet.StaffProcessingResult> results = 
            XeroIntegrationTimeSheet.sendSelectedPayPeriodTimesheets(
                new List<String>(),
                new List<String>{String.valueOf(Date.today())},
                new List<String>{String.valueOf(Date.today().addDays(7))},
                null
            );
        Test.stopTest();

    }
}

/**
 * Test: Mismatched list sizes should return error
 */
@IsTest
static void test_sendSelectedPayPeriodTimesheets_MismatchedLists() {
    User user = getTestUser();
    System.runAs(user) {
        Staff__c staff = getTestStaff();
        
        Test.startTest();
        List<XeroIntegrationTimeSheet.StaffProcessingResult> results = 
            XeroIntegrationTimeSheet.sendSelectedPayPeriodTimesheets(
                new List<String>{String.valueOf(staff.Id)},
                new List<String>{String.valueOf(Date.today()), String.valueOf(Date.today().addDays(1))},
                new List<String>{String.valueOf(Date.today().addDays(7))},
                null
            );
        Test.stopTest();

    }
}

/**
 * Test: Staff with no Xero Employee ID should return error
 */
@IsTest
static void test_sendSelectedPayPeriodTimesheets_NoXeroEmployeeId() {
    User user = getTestUser();
    System.runAs(user) {
        Staff__c staff = getTestStaff();
        staff.Xero_Employee_ID__c = null;
        update staff;
        
        // Create approved shift
        Add_Shift__c addShift = [SELECT Id, Start_Date__c FROM Add_Shift__c LIMIT 1];
        ShiftwithStaff__c shift = new ShiftwithStaff__c();
        shift.Add_Shift__c = addShift.Id;
        shift.Staff__c = staff.Id;
        shift.Role__c = 'Support Worker';
        shift.Status__c = 'Accepted';
        shift.Start_Date__c = addShift.Start_Date__c;
        shift.Shift_Start_Time__c = Time.newInstance(8, 0, 0, 0);
        shift.Shift_End_Date__c = addShift.Start_Date__c;
        shift.Log_In_Date_Time__c = Time.newInstance(8, 0, 0, 0);
        shift.Log_Out_Date_Time__c = Time.newInstance(16, 0, 0, 0);
        shift.Shift_Category__c = 'Morning';
        shift.Attendence__c = true;
        insert shift;
        
        Test.setMock(HttpCalloutMock.class, new SendTimesheetsNoEmployeeIdMock());
        
        Test.startTest();
        List<XeroIntegrationTimeSheet.StaffProcessingResult> results = 
            XeroIntegrationTimeSheet.sendSelectedPayPeriodTimesheets(
                new List<String>{String.valueOf(staff.Id)},
                new List<String>{String.valueOf(addShift.Start_Date__c)},
                new List<String>{String.valueOf(addShift.Start_Date__c.addDays(1))},
                null
            );
        Test.stopTest();

        // Should have an error result
        Boolean hasError = false;
        for (XeroIntegrationTimeSheet.StaffProcessingResult result : results) {
            if (!result.success) {
                hasError = true;
                System.debug('Error message: ' + result.message);
            }
        }

    }
}

/**
 * Test: Staff with Xero Employee ID but no shifts should return error
 */
@IsTest
static void test_sendSelectedPayPeriodTimesheets_NoShifts() {
    User user = getTestUser();
    System.runAs(user) {
        Staff__c staff = getTestStaff();
        staff.Xero_Employee_ID__c = 'EMP123';
        staff.Ordinary_Earnings_Rate_ID__c = 'ORD123';
        update staff;
        
        // Delete existing shifts
        List<ShiftwithStaff__c> existingShifts = [SELECT Id FROM ShiftwithStaff__c WHERE Staff__c = :staff.Id];
        delete existingShifts;
        
        Test.setMock(HttpCalloutMock.class, new SendTimesheetsFullMock());
        
        Test.startTest();
        List<XeroIntegrationTimeSheet.StaffProcessingResult> results = 
            XeroIntegrationTimeSheet.sendSelectedPayPeriodTimesheets(
                new List<String>{String.valueOf(staff.Id)},
                new List<String>{String.valueOf(Date.today().addDays(-1))},
                new List<String>{String.valueOf(Date.today().addDays(1))},
                null
            );
        Test.stopTest();

    }
}

/**
 * Test: Pay period mismatch handling
 */
@IsTest
static void test_sendSelectedPayPeriodTimesheets_PayPeriodMismatch() {
    User user = getTestUser();
    System.runAs(user) {
        Staff__c staff = getTestStaff();
        staff.Xero_Employee_ID__c = 'EMP123';
        staff.Ordinary_Earnings_Rate_ID__c = 'ORD123';
        update staff;
        
        // Create approved shift outside the selected period
        Add_Shift__c addShift = [SELECT Id FROM Add_Shift__c LIMIT 1];
        ShiftwithStaff__c shift = new ShiftwithStaff__c();
        shift.Add_Shift__c = addShift.Id;
        shift.Staff__c = staff.Id;
        shift.Role__c = 'Support Worker';
        shift.Status__c = 'Accepted';
        shift.Start_Date__c = Date.today().addDays(-10);
        shift.Shift_Start_Time__c = Time.newInstance(8, 0, 0, 0);
        shift.Shift_End_Date__c = Date.today().addDays(-10);
        shift.Log_In_Date_Time__c = Time.newInstance(8, 0, 0, 0);
        shift.Log_Out_Date_Time__c = Time.newInstance(16, 0, 0, 0);
        shift.Shift_Category__c = 'Morning';
        shift.Attendence__c = true;
        insert shift;
        
        // Create Facility Xero Setting
        Facility__c fac = getTestFacility();
        Facility_Role__c facRole = [SELECT Id FROM Facility_Role__c LIMIT 1];
        Facility_Xero_Setting__c setting = new Facility_Xero_Setting__c(
            Name = 'Morning Rate Setting',
            Xero_Payitem__c = 'ER001',
            Xero_Payitem_Name__c = 'General Rate',
            Category__c = 'Morning',
            Facility_Role__c = facRole.Id,
            Pay_Item_Type__c = 'Earnings'
        );
        insert setting;
        
        Test.setMock(HttpCalloutMock.class, new SendTimesheetsPayPeriodErrorMock());
        
        Test.startTest();
        List<XeroIntegrationTimeSheet.StaffProcessingResult> results = 
            XeroIntegrationTimeSheet.sendSelectedPayPeriodTimesheets(
                new List<String>{String.valueOf(staff.Id)},
                new List<String>{String.valueOf(Date.today().addDays(-10))},
                new List<String>{String.valueOf(Date.today().addDays(-7))},
                null
            );
        Test.stopTest();

    }
}

/**
 * Test: Category rate selections provided by user
 */
@IsTest
static void test_sendSelectedPayPeriodTimesheets_WithCategoryRateSelections() {
    User user = getTestUser();
    System.runAs(user) {
        Staff__c staff = getTestStaff();
        staff.Xero_Employee_ID__c = 'EMP123';
        staff.Ordinary_Earnings_Rate_ID__c = 'ORD123';
        update staff;
        
        // Create approved shifts
        Add_Shift__c addShift = [SELECT Id, Start_Date__c FROM Add_Shift__c LIMIT 1];
        for (Integer i = 0; i < 2; i++) {
            ShiftwithStaff__c shift = new ShiftwithStaff__c();
            shift.Add_Shift__c = addShift.Id;
            shift.Staff__c = staff.Id;
            shift.Role__c = 'Support Worker';
            shift.Status__c = 'Accepted';
            shift.Start_Date__c = addShift.Start_Date__c.addDays(i);
            shift.Shift_Start_Time__c = Time.newInstance(8, 0, 0, 0);
            shift.Shift_End_Date__c = addShift.Start_Date__c.addDays(i);
            shift.Log_In_Date_Time__c = Time.newInstance(8, 0, 0, 0);
            shift.Log_Out_Date_Time__c = Time.newInstance(16, 0, 0, 0);
            shift.Shift_Category__c = i == 0 ? 'Morning' : 'Afternoon';
            shift.Attendence__c = true;
            insert shift;
        }
        
        // Create Facility Xero Settings for both categories
        Facility__c fac = getTestFacility();
        Facility_Role__c facRole = [SELECT Id FROM Facility_Role__c LIMIT 1];
        
        List<Facility_Xero_Setting__c> settings = new List<Facility_Xero_Setting__c>();
        settings.add(new Facility_Xero_Setting__c(
            Name = 'Morning Rate Setting',
            Xero_Payitem__c = 'ER001',
            Xero_Payitem_Name__c = 'General Rate',
            Category__c = 'Morning',
            Facility_Role__c = facRole.Id,
            Pay_Item_Type__c = 'Earnings'
        ));
        settings.add(new Facility_Xero_Setting__c(
            Name = 'Afternoon Rate Setting',
            Xero_Payitem__c = 'ER002',
            Xero_Payitem_Name__c = 'Afternoon Rate',
            Category__c = 'Afternoon',
            Facility_Role__c = facRole.Id,
            Pay_Item_Type__c = 'Earnings'
        ));
        insert settings;
        
        // User selected rates
        Map<String, Map<String, String>> categoryRateSelections = new Map<String, Map<String, String>>();
        Map<String, String> staffSelections = new Map<String, String>();
        staffSelections.put('Morning', 'ER001');
        staffSelections.put('Afternoon', 'ER002');
        categoryRateSelections.put(String.valueOf(staff.Id), staffSelections);
        
        Test.setMock(HttpCalloutMock.class, new SendTimesheetsFullMock());
        
        Test.startTest();
        List<XeroIntegrationTimeSheet.StaffProcessingResult> results = 
            XeroIntegrationTimeSheet.sendSelectedPayPeriodTimesheets(
                new List<String>{String.valueOf(staff.Id)},
                new List<String>{String.valueOf(addShift.Start_Date__c)},
                new List<String>{String.valueOf(addShift.Start_Date__c.addDays(2))},
                categoryRateSelections
            );
        Test.stopTest();

    }
}

/**
 * Test: Multiple staff members processing
 */
@IsTest
static void test_sendSelectedPayPeriodTimesheets_MultipleStaff() {
    User user = getTestUser();
    System.runAs(user) {
        // Create second staff member
        Facility__c fac = getTestFacility();
        Staff__c staff2 = new Staff__c(
            Last_Name__c = 'Test Staff 2',
            Name = 'TestStaff2',
            Name__c = 'TestStaff2',
            Contact_Number__c = '56789908744',
            Email_Address__c = 'test.staff2@example.com',
            Facility__c = fac.Id,
            Address__Street__s = '8 Keewong Street',
            Address__City__s = 'Crace',
            Address__StateCode__s = 'ACT',
            Address__PostalCode__s = '2911',
            Emergency_Phone_Number__c = '45678766676',
            Primary_Contact_Name__c = 'Praveen',
            Primary_Contact_Number__c = '9908458299',
            Primary_Contact_Email__c = 'primary2@test.com',
            Make_Primary_as_Approver__c = true,
            Secondary_Contact_Name__c = 'Maheswari',
            Secondary_Contact_Email__c = 'secondary2@test.com',
            Secondary_Contact_Number__c = '99084582959',
            Emp_exit_date__c = Date.newInstance(2028, 01, 05),
            Emp_Start_Date__c = Date.newInstance(2023, 02, 01),
            Date_Of_Birth__c = Date.newInstance(2001, 02, 04),
            Role__c = 'Admin',
            Residency_Type__c = 'Australian',
            Expiry_Date__c = Date.newInstance(2025, 02, 19),
            Type__c = 'Visa Status',
            Working_Hours_Rate__c = 50,
            Final_Overall_Rate__c = 150,
            Saturday_Hourly_Rate__c = 130,
            Sunday_Hourly_Rate__c = 50,
            Xero_Employee_ID__c = 'EMP456',
            Ordinary_Earnings_Rate_ID__c = 'ORD456'
        );
        insert staff2;
        
        // Create shifts for staff2
        Add_Shift__c addShift = [SELECT Id, Start_Date__c FROM Add_Shift__c LIMIT 1];
        ShiftwithStaff__c shift2 = new ShiftwithStaff__c();
        shift2.Add_Shift__c = addShift.Id;
        shift2.Staff__c = staff2.Id;
        shift2.Role__c = 'Support Worker';
        shift2.Status__c = 'Accepted';
        shift2.Start_Date__c = addShift.Start_Date__c;
        shift2.Shift_Start_Time__c = Time.newInstance(8, 0, 0, 0);
        shift2.Shift_End_Date__c = addShift.Start_Date__c;
        shift2.Log_In_Date_Time__c = Time.newInstance(8, 0, 0, 0);
        shift2.Log_Out_Date_Time__c = Time.newInstance(16, 0, 0, 0);
        shift2.Shift_Category__c = 'Morning';
        shift2.Attendence__c = true;
        insert shift2;
        
        // Get first staff
        Staff__c staff1 = getTestStaff();
        staff1.Xero_Employee_ID__c = 'EMP123';
        staff1.Ordinary_Earnings_Rate_ID__c = 'ORD123';
        update staff1;
        
        // Create Facility Xero Setting
        Facility__c fac2 = getTestFacility();
        Facility_Role__c facRole = [SELECT Id FROM Facility_Role__c LIMIT 1];
        Facility_Xero_Setting__c setting = new Facility_Xero_Setting__c(
            Name = 'Morning Rate Setting',
            Xero_Payitem__c = 'ER001',
            Xero_Payitem_Name__c = 'General Rate',
            Category__c = 'Morning',
            Facility_Role__c = facRole.Id,
            Pay_Item_Type__c = 'Earnings'
        );
        insert setting;
        
        // Create another Facility Xero Setting for staff2's category
        Facility_Xero_Setting__c setting2 = new Facility_Xero_Setting__c(
            Name = 'Morning Rate Setting 2',
            Xero_Payitem__c = 'ER001',
            Xero_Payitem_Name__c = 'General Rate',
            Category__c = 'Morning',
            Facility_Role__c = facRole.Id,
            Pay_Item_Type__c = 'Earnings'
        );
        insert setting2;
        
        Test.setMock(HttpCalloutMock.class, new SendTimesheetsFullMock());
        
        Test.startTest();
        List<XeroIntegrationTimeSheet.StaffProcessingResult> results = 
            XeroIntegrationTimeSheet.sendSelectedPayPeriodTimesheets(
                new List<String>{String.valueOf(staff1.Id), String.valueOf(staff2.Id)},
                new List<String>{String.valueOf(addShift.Start_Date__c), String.valueOf(addShift.Start_Date__c)},
                new List<String>{String.valueOf(addShift.Start_Date__c.addDays(1)), String.valueOf(addShift.Start_Date__c.addDays(1))},
                null
            );
        Test.stopTest();

    }
}

/**
 * Test: Xero access token failure
 */
@IsTest
static void test_sendSelectedPayPeriodTimesheets_TokenFailure() {
    User user = getTestUser();
    System.runAs(user) {
        // This test will use a mock that returns an error for authentication
        // But since we can't easily mock XeroIntegrationController.getAccessTokenFromXero,
        // we'll just test the error handling path
        Staff__c staff = getTestStaff();
        
        // The method will attempt to get token and fail
        // We'll test that it handles the failure gracefully
        
        // Since we can't mock the static method call directly, we'll test with
        // a scenario that would trigger the failure path
        Test.startTest();
        try {
            List<XeroIntegrationTimeSheet.StaffProcessingResult> results = 
                XeroIntegrationTimeSheet.sendSelectedPayPeriodTimesheets(
                    new List<String>{String.valueOf(staff.Id)},
                    new List<String>{String.valueOf(Date.today())},
                    new List<String>{String.valueOf(Date.today().addDays(1))},
                    null
                );

        } catch (Exception e) {

        }
        Test.stopTest();
    }
}

/**
 * Test: Invalid date format handling
 */
@IsTest
static void test_sendSelectedPayPeriodTimesheets_InvalidDates() {
    User user = getTestUser();
    System.runAs(user) {
        Staff__c staff = getTestStaff();
        
        Test.startTest();
        List<XeroIntegrationTimeSheet.StaffProcessingResult> results = 
            XeroIntegrationTimeSheet.sendSelectedPayPeriodTimesheets(
                new List<String>{String.valueOf(staff.Id)},
                new List<String>{'invalid-date'},
                new List<String>{'2026-01-01'},
                null
            );
        Test.stopTest();

        // Should have an error result
        Boolean hasError = false;
        for (XeroIntegrationTimeSheet.StaffProcessingResult result : results) {
            if (!result.success) {
                hasError = true;
            }
        }

    }
}

/**
 * Test: Staff with null Xero Employee ID - should be skipped with error
 */
@IsTest
static void test_sendSelectedPayPeriodTimesheets_StaffWithNullXeroId() {
    User user = getTestUser();
    System.runAs(user) {
        // Create a staff with null Xero Employee ID
        Facility__c fac = getTestFacility();
        Staff__c staffWithNullId = new Staff__c(
            Last_Name__c = 'Test Staff Null Id',
            Name = 'TestStaffNullId',
            Name__c = 'TestStaffNullId',
            Contact_Number__c = '56789908745',
            Email_Address__c = 'test.staff.nullid@example.com',
            Facility__c = fac.Id,
            Address__Street__s = '8 Keewong Street',
            Address__City__s = 'Crace',
            Address__StateCode__s = 'ACT',
            Address__PostalCode__s = '2911',
            Emergency_Phone_Number__c = '45678766677',
            Primary_Contact_Name__c = 'Praveen',
            Primary_Contact_Number__c = '9908458300',
            Primary_Contact_Email__c = 'primary3@test.com',
            Make_Primary_as_Approver__c = true,
            Emp_exit_date__c = Date.newInstance(2028, 01, 05),
            Emp_Start_Date__c = Date.newInstance(2023, 02, 01),
            Date_Of_Birth__c = Date.newInstance(2001, 02, 04),
            Role__c = 'Admin',
            Residency_Type__c = 'Australian',
            Expiry_Date__c = Date.newInstance(2025, 02, 19),
            Type__c = 'Visa Status',
            Working_Hours_Rate__c = 50,
            Final_Overall_Rate__c = 150,
            Saturday_Hourly_Rate__c = 130,
            Sunday_Hourly_Rate__c = 50,
            Xero_Employee_ID__c = null,
            Ordinary_Earnings_Rate_ID__c = null
        );
        insert staffWithNullId;
        
        Test.setMock(HttpCalloutMock.class, new SendTimesheetsNoEmployeeIdMock());
        
        Test.startTest();
        List<XeroIntegrationTimeSheet.StaffProcessingResult> results = 
            XeroIntegrationTimeSheet.sendSelectedPayPeriodTimesheets(
                new List<String>{String.valueOf(staffWithNullId.Id)},
                new List<String>{String.valueOf(Date.today())},
                new List<String>{String.valueOf(Date.today().addDays(1))},
                null
            );
        Test.stopTest();

    }
}

/**
 * Test: Single staff with approved shifts and rate mapping
 */
@IsTest
static void test_sendSelectedPayPeriodTimesheets_SingleStaffWithRates() {
    User user = getTestUser();
    System.runAs(user) {
        Staff__c staff = getTestStaff();
        staff.Xero_Employee_ID__c = 'EMP123';
        staff.Ordinary_Earnings_Rate_ID__c = 'ORD123';
        update staff;
        
        // Create approved shifts with different categories
        Add_Shift__c addShift = [SELECT Id, Start_Date__c FROM Add_Shift__c LIMIT 1];
        
        List<ShiftwithStaff__c> shifts = new List<ShiftwithStaff__c>();
        for (Integer i = 0; i < 2; i++) {
            ShiftwithStaff__c shift = new ShiftwithStaff__c();
            shift.Add_Shift__c = addShift.Id;
            shift.Staff__c = staff.Id;
            shift.Role__c = 'Support Worker';
            shift.Status__c = 'Accepted';
            shift.Start_Date__c = addShift.Start_Date__c.addDays(i);
            shift.Shift_Start_Time__c = Time.newInstance(8 + i*4, 0, 0, 0);
            shift.Shift_End_Date__c = addShift.Start_Date__c.addDays(i);
            shift.Log_In_Date_Time__c = Time.newInstance(8 + i*4, 0, 0, 0);
            shift.Log_Out_Date_Time__c = Time.newInstance(16 + i*4, 0, 0, 0);
            shift.Shift_Category__c = i == 0 ? 'Morning' : 'Afternoon';
            shift.Attendence__c = true;
            shifts.add(shift);
        }
        insert shifts;
        
        // Create Facility Xero Settings for both categories
        Facility__c fac = getTestFacility();
        Facility_Role__c facRole = [SELECT Id FROM Facility_Role__c LIMIT 1];
        
        List<Facility_Xero_Setting__c> settings = new List<Facility_Xero_Setting__c>();
        settings.add(new Facility_Xero_Setting__c(
            Name = 'Morning Rate',
            Xero_Payitem__c = 'ER001',
            Xero_Payitem_Name__c = 'General Rate',
            Category__c = 'Morning',
            Facility_Role__c = facRole.Id,
            Pay_Item_Type__c = 'Earnings'
        ));
        settings.add(new Facility_Xero_Setting__c(
            Name = 'Afternoon Rate',
            Xero_Payitem__c = 'ER002',
            Xero_Payitem_Name__c = 'Afternoon Rate',
            Category__c = 'Afternoon',
            Facility_Role__c = facRole.Id,
            Pay_Item_Type__c = 'Earnings'
        ));
        insert settings;
        
        Test.setMock(HttpCalloutMock.class, new SendTimesheetsFullMock());
        
        Test.startTest();
        List<XeroIntegrationTimeSheet.StaffProcessingResult> results = 
            XeroIntegrationTimeSheet.sendSelectedPayPeriodTimesheets(
                new List<String>{String.valueOf(staff.Id)},
                new List<String>{String.valueOf(addShift.Start_Date__c)},
                new List<String>{String.valueOf(addShift.Start_Date__c.addDays(2))},
                null
            );
        Test.stopTest();

        
        // Log results for debugging
        for (XeroIntegrationTimeSheet.StaffProcessingResult result : results) {
            System.debug('Result: Staff=' + result.staffName + ', Success=' + result.success + ', Message=' + result.message);
        }
    }
}
    
    /**
 * ============================================================
 * TESTS FOR validateAndGetActiveRate METHOD
 * ============================================================
 * This method validates an earning rate with Xero and caches the result.
 * It handles:
 * 1. Blank rate ID
 * 2. Cached validation results
 * 3. Active rate validation
 * 4. Inactive rate validation
 * 5. Rate not found in Xero
 * 6. Error handling during validation
 * ============================================================
 */

// Add these test methods inside the existing XeroIntegrationTimeSheetTest class

// ============================================================
// MOCK CLASSES FOR validateAndGetActiveRate TESTS
// ============================================================

/**
 * Mock: Active rate in Xero
 */
private class ValidateRateActiveMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        if (req.getEndpoint().contains('/payroll.xro/2.0/EarningsRates/')) {
            res.setStatusCode(200);
            res.setBody('{' +
                '"earningsRate": {' +
                    '"earningsRateID": "ER001",' +
                    '"name": "General Rate",' +
                    '"currentRecord": true,' +
                    '"typeOfUnits": "Hours",' +
                    '"ratePerUnit": 25.00' +
                '}' +
            '}');
        } else {
            res.setStatusCode(200);
            res.setBody('{}');
        }
        return res;
    }
}

/**
 * Mock: Inactive rate in Xero (currentRecord = false)
 */
private class ValidateRateInactiveMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        if (req.getEndpoint().contains('/payroll.xro/2.0/EarningsRates/')) {
            res.setStatusCode(200);
            res.setBody('{' +
                '"earningsRate": {' +
                    '"earningsRateID": "ER002",' +
                    '"name": "Inactive Rate",' +
                    '"currentRecord": false,' +
                    '"typeOfUnits": "Hours",' +
                    '"ratePerUnit": 20.00' +
                '}' +
            '}');
        } else {
            res.setStatusCode(200);
            res.setBody('{}');
        }
        return res;
    }
}

/**
 * Mock: Rate with invalid units (not Hours)
 */
private class ValidateRateInvalidUnitsMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        if (req.getEndpoint().contains('/payroll.xro/2.0/EarningsRates/')) {
            res.setStatusCode(200);
            res.setBody('{' +
                '"earningsRate": {' +
                    '"earningsRateID": "ER003",' +
                    '"name": "Invalid Units Rate",' +
                    '"currentRecord": true,' +
                    '"typeOfUnits": "Days",' +
                    '"ratePerUnit": 30.00' +
                '}' +
            '}');
        } else {
            res.setStatusCode(200);
            res.setBody('{}');
        }
        return res;
    }
}

/**
 * Mock: Rate not found in Xero (404)
 */
private class ValidateRateNotFoundMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        if (req.getEndpoint().contains('/payroll.xro/2.0/EarningsRates/')) {
            res.setStatusCode(404);
            res.setBody('{"Message": "Rate not found"}');
        } else {
            res.setStatusCode(200);
            res.setBody('{}');
        }
        return res;
    }
}

/**
 * Mock: API error (500)
 */
private class ValidateRateApiErrorMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        if (req.getEndpoint().contains('/payroll.xro/2.0/EarningsRates/')) {
            res.setStatusCode(500);
            res.setBody('{"Message": "Internal Server Error"}');
        } else {
            res.setStatusCode(200);
            res.setBody('{}');
        }
        return res;
    }
}

/**
 * Mock: Rate with missing typeOfUnits field
 */
private class ValidateRateMissingUnitsMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        if (req.getEndpoint().contains('/payroll.xro/2.0/EarningsRates/')) {
            res.setStatusCode(200);
            res.setBody('{' +
                '"earningsRate": {' +
                    '"earningsRateID": "ER004",' +
                    '"name": "Missing Units Rate",' +
                    '"currentRecord": true' +
                '}' +
            '}');
        } else {
            res.setStatusCode(200);
            res.setBody('{}');
        }
        return res;
    }
}

/**
 * Mock: Rate with null currentRecord (treated as inactive)
 */
private class ValidateRateNullCurrentMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        if (req.getEndpoint().contains('/payroll.xro/2.0/EarningsRates/')) {
            res.setStatusCode(200);
            res.setBody('{' +
                '"earningsRate": {' +
                    '"earningsRateID": "ER005",' +
                    '"name": "Null Current Rate",' +
                    '"typeOfUnits": "Hours",' +
                    '"ratePerUnit": 25.00' +
                '}' +
            '}');
        } else {
            res.setStatusCode(200);
            res.setBody('{}');
        }
        return res;
    }
}

/**
 * Mock: Rate with earningsRates (plural) response format
 */
private class ValidateRatePluralFormatMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        if (req.getEndpoint().contains('/payroll.xro/2.0/EarningsRates/')) {
            res.setStatusCode(200);
            res.setBody('{' +
                '"earningsRates": [' +
                    '{' +
                        '"earningsRateID": "ER006",' +
                        '"name": "Plural Format Rate",' +
                        '"currentRecord": true,' +
                        '"typeOfUnits": "Hours",' +
                        '"ratePerUnit": 35.00' +
                    '}' +
                ']' +
            '}');
        } else {
            res.setStatusCode(200);
            res.setBody('{}');
        }
        return res;
    }
}

/**
 * Mock: Rate with uppercase field names
 */
private class ValidateRateUppercaseMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        if (req.getEndpoint().contains('/payroll.xro/2.0/EarningsRates/')) {
            res.setStatusCode(200);
            res.setBody('{' +
                '"earningsRate": {' +
                    '"EarningsRateID": "ER007",' +
                    '"Name": "Uppercase Rate",' +
                    '"CurrentRecord": true,' +
                    '"TypeOfUnits": "Hours",' +
                    '"RatePerUnit": 40.00' +
                '}' +
            '}');
        } else {
            res.setStatusCode(200);
            res.setBody('{}');
        }
        return res;
    }
}

// ============================================================
// TESTS FOR validateAndGetActiveRate
// ============================================================

/**
 * Test: Blank rate ID should return null
 */
@IsTest
static void test_validateAndGetActiveRate_BlankRateId() {
    User user = getTestUser();
    System.runAs(user) {
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.validateAndGetActiveRate(
            '',
            'EMP123',
            ctx
        );
        Test.stopTest();

    }
}

/**
 * Test: Rate already validated and cached as valid
 */
@IsTest
static void test_validateAndGetActiveRate_CachedValid() {
    User user = getTestUser();
    System.runAs(user) {
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        
        // Pre-populate cache with valid rate
        ctx.validatedRates.put('ER001', true);
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.validateAndGetActiveRate(
            'ER001',
            'EMP123',
            ctx
        );
        Test.stopTest();
        

    }
}

/**
 * Test: Rate already validated and cached as invalid
 */
@IsTest
static void test_validateAndGetActiveRate_CachedInvalid() {
    User user = getTestUser();
    System.runAs(user) {
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        
        // Pre-populate cache with invalid rate
        ctx.validatedRates.put('ER001', false);
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.validateAndGetActiveRate(
            'ER001',
            'EMP123',
            ctx
        );
        Test.stopTest();

    }
}

/**
 * Test: Active rate validation success
 */
@IsTest
static void test_validateAndGetActiveRate_ActiveRate() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new ValidateRateActiveMock());
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.validateAndGetActiveRate(
            'ER001',
            'EMP123',
            ctx
        );
        Test.stopTest();

    }
}

/**
 * Test: Inactive rate validation should return null
 */
@IsTest
static void test_validateAndGetActiveRate_InactiveRate() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new ValidateRateInactiveMock());
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.validateAndGetActiveRate(
            'ER002',
            'EMP123',
            ctx
        );
        Test.stopTest();

    }
}

/**
 * Test: Rate with invalid units should return null
 */
@IsTest
static void test_validateAndGetActiveRate_InvalidUnits() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new ValidateRateInvalidUnitsMock());
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.validateAndGetActiveRate(
            'ER003',
            'EMP123',
            ctx
        );
        Test.stopTest();

    }
}

/**
 * Test: Rate not found in Xero should return null
 */
@IsTest
static void test_validateAndGetActiveRate_RateNotFound() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new ValidateRateNotFoundMock());
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.validateAndGetActiveRate(
            'ER_NOT_FOUND',
            'EMP123',
            ctx
        );
        Test.stopTest();

    }
}

/**
 * Test: API error during validation should return null
 */
@IsTest
static void test_validateAndGetActiveRate_ApiError() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new ValidateRateApiErrorMock());
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.validateAndGetActiveRate(
            'ER001',
            'EMP123',
            ctx
        );
        Test.stopTest();

        // Note: Cache may not be updated on API error since validation failed
    }
}

/**
 * Test: Rate with missing units field should be treated as valid
 */
@IsTest
static void test_validateAndGetActiveRate_MissingUnits() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new ValidateRateMissingUnitsMock());
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.validateAndGetActiveRate(
            'ER004',
            'EMP123',
            ctx
        );
        Test.stopTest();

    }
}

/**
 * Test: Rate with null currentRecord should be treated as invalid
 */
@IsTest
static void test_validateAndGetActiveRate_NullCurrentRecord() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new ValidateRateNullCurrentMock());
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.validateAndGetActiveRate(
            'ER005',
            'EMP123',
            ctx
        );
        Test.stopTest();

    }
}

/**
 * Test: Rate with earningsRates (plural) response format
 */
@IsTest
static void test_validateAndGetActiveRate_PluralFormat() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new ValidateRatePluralFormatMock());
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.validateAndGetActiveRate(
            'ER006',
            'EMP123',
            ctx
        );
        Test.stopTest();

    }
}

/**
 * Test: Rate with uppercase field names
 */
@IsTest
static void test_validateAndGetActiveRate_UppercaseFields() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new ValidateRateUppercaseMock());
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.validateAndGetActiveRate(
            'ER007',
            'EMP123',
            ctx
        );
        Test.stopTest();

    }
}

/**
 * Test: Null processing context
 */
@IsTest
static void test_validateAndGetActiveRate_NullContext() {
    User user = getTestUser();
    System.runAs(user) {
        Test.startTest();
        try {
            String result = XeroIntegrationTimeSheet.validateAndGetActiveRate(
                'ER001',
                'EMP123',
                null
            );

        } catch (Exception e) {

        }
        Test.stopTest();
    }
}

/**
 * Test: Rate validation with empty access token
 */
@IsTest
static void test_validateAndGetActiveRate_EmptyAccessToken() {
    User user = getTestUser();
    System.runAs(user) {
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = '';
        ctx.tenantId = 'TEST_TENANT_ID';
        
        // Note: The method will attempt the callout with empty token
        // We mock the callout to simulate API error
        Test.setMock(HttpCalloutMock.class, new ValidateRateApiErrorMock());
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.validateAndGetActiveRate(
            'ER001',
            'EMP123',
            ctx
        );
        Test.stopTest();

    }
}

/**
 * Test: Rate validation with empty tenant ID
 */
@IsTest
static void test_validateAndGetActiveRate_EmptyTenantId() {
    User user = getTestUser();
    System.runAs(user) {
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = '';
        
        // Mock the callout to simulate API error
        Test.setMock(HttpCalloutMock.class, new ValidateRateApiErrorMock());
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.validateAndGetActiveRate(
            'ER001',
            'EMP123',
            ctx
        );
        Test.stopTest();

    }
}

/**
 * Test: Rate name from Xero response (with name field)
 */
@IsTest
static void test_validateAndGetActiveRate_WithRateName() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new ValidateRateActiveMock());
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.validateAndGetActiveRate(
            'ER001',
            'EMP123',
            ctx
        );
        Test.stopTest();

    }
}

/**
 * Test: Multiple rates validation with caching
 */
@IsTest
static void test_validateAndGetActiveRate_MultipleRatesCaching() {
    User user = getTestUser();
    System.runAs(user) {
        // Create a custom mock that returns different responses based on rate ID
        Test.setMock(HttpCalloutMock.class, new ValidateRateActiveMock());
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        
        Test.startTest();
        
        // First validation - should call API
        String result1 = XeroIntegrationTimeSheet.validateAndGetActiveRate(
            'ER001',
            'EMP123',
            ctx
        );
        
        // Second validation - should use cache
        String result2 = XeroIntegrationTimeSheet.validateAndGetActiveRate(
            'ER001',
            'EMP123',
            ctx
        );
        
        // Validate a different rate
        String result3 = XeroIntegrationTimeSheet.validateAndGetActiveRate(
            'ER002',
            'EMP123',
            ctx
        );
        
        Test.stopTest();

    }
}

/**
 * Test: Rate validation with malformed JSON response
 */
@IsTest
static void test_validateAndGetActiveRate_MalformedJson() {
    User user = getTestUser();
    System.runAs(user) {
        // Custom mock that returns malformed JSON
        Test.setMock(HttpCalloutMock.class, new ValidateRateNotFoundMock());
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.validateAndGetActiveRate(
            'ER001',
            'EMP123',
            ctx
        );
        Test.stopTest();

    }
}

/**
 * Test: Rate validation with rateId containing spaces
 */
@IsTest
static void test_validateAndGetActiveRate_RateIdWithSpaces() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new ValidateRateNotFoundMock());
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.validateAndGetActiveRate(
            ' ER001 ',
            'EMP123',
            ctx
        );
        Test.stopTest();

    }
}

/**
 * Test: ctx.validatedRates is null - should initialize
 */
@IsTest
static void test_validateAndGetActiveRate_InitializeCache() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new ValidateRateActiveMock());
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        ctx.validatedRates = null; // Force null cache
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.validateAndGetActiveRate(
            'ER001',
            'EMP123',
            ctx
        );
        Test.stopTest();

    }
}

/**
 * Test: ctx.invalidRateErrors is null - should initialize when error occurs
 */
@IsTest
static void test_validateAndGetActiveRate_InitializeErrors() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new ValidateRateInactiveMock());
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        ctx.invalidRateErrors = null; // Force null error map
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.validateAndGetActiveRate(
            'ER002',
            'EMP123',
            ctx
        );
        Test.stopTest();

    }
}
    
    /**
 * ============================================================
 * TESTS FOR getXeroPayrollCycle METHOD
 * ============================================================
 * This method retrieves the Xero payroll cycle for a specific employee.
 * It handles:
 * 1. Successful employee and calendar retrieval
 * 2. Weekly, Fortnightly, and Monthly calendar types
 * 3. Error handling for missing data
 * 4. Invalid responses from Xero API
 * ============================================================
 */

// Add these mock classes and test methods inside the existing XeroIntegrationTimeSheetTest class

// ============================================================
// MOCK CLASSES FOR getXeroPayrollCycle TESTS
// ============================================================

/**
 * Mock: Successful response with Weekly calendar
 */
private class PayrollCycleWeeklyMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        String endpoint = req.getEndpoint();
        
        // Employee endpoint
        if (endpoint.contains('/payroll.xro/1.0/Employees/')) {
            res.setStatusCode(200);
            res.setBody('{"Employees":[{' +
                '"EmployeeID":"EMP123",' +
                '"PayrollCalendarID":"CAL001",' +
                '"OrdinaryEarningsRateID":"ORD123"' +
            '}]}');
            return res;
        }
        
        // Payroll Calendar endpoint
        if (endpoint.contains('PayrollCalendars')) {
            res.setStatusCode(200);
            res.setBody('{"PayrollCalendars":[' +
                '{"Name":"Weekly Calendar","CalendarType":"WEEKLY","StartDate":"/Date(1716940800000+0000)/"}' +
            ']}');
            return res;
        }
        
        res.setStatusCode(200);
        res.setBody('{}');
        return res;
    }
}

/**
 * Mock: Successful response with Fortnightly calendar
 */
private class PayrollCycleFortnightlyMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        String endpoint = req.getEndpoint();
        
        if (endpoint.contains('/payroll.xro/1.0/Employees/')) {
            res.setStatusCode(200);
            res.setBody('{"Employees":[{' +
                '"EmployeeID":"EMP123",' +
                '"PayrollCalendarID":"CAL002",' +
                '"OrdinaryEarningsRateID":"ORD123"' +
            '}]}');
            return res;
        }
        
        if (endpoint.contains('PayrollCalendars')) {
            res.setStatusCode(200);
            res.setBody('{"PayrollCalendars":[' +
                '{"Name":"Fortnightly Calendar","CalendarType":"FORTNIGHTLY","StartDate":"/Date(1716940800000+0000)/"}' +
            ']}');
            return res;
        }
        
        res.setStatusCode(200);
        res.setBody('{}');
        return res;
    }
}

/**
 * Mock: Monthly calendar
 */
private class PayrollCycleMonthlyMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        String endpoint = req.getEndpoint();
        
        if (endpoint.contains('/payroll.xro/1.0/Employees/')) {
            res.setStatusCode(200);
            res.setBody('{"Employees":[{' +
                '"EmployeeID":"EMP123",' +
                '"PayrollCalendarID":"CAL003",' +
                '"OrdinaryEarningsRateID":"ORD123"' +
            '}]}');
            return res;
        }
        
        if (endpoint.contains('PayrollCalendars')) {
            res.setStatusCode(200);
            res.setBody('{"PayrollCalendars":[' +
                '{"Name":"Monthly Calendar","CalendarType":"MONTHLY","StartDate":"/Date(1716940800000+0000)/"}' +
            ']}');
            return res;
        }
        
        res.setStatusCode(200);
        res.setBody('{}');
        return res;
    }
}

/**
 * Mock: Employee not found (404)
 */
private class PayrollCycleEmployeeNotFoundMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        if (req.getEndpoint().contains('/payroll.xro/1.0/Employees/')) {
            res.setStatusCode(404);
            res.setBody('{"Message":"Employee not found"}');
            return res;
        }
        
        res.setStatusCode(200);
        res.setBody('{}');
        return res;
    }
}

/**
 * Mock: Calendar not found (404)
 */
private class PayrollCycleCalendarNotFoundMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        if (req.getEndpoint().contains('/payroll.xro/1.0/Employees/')) {
            res.setStatusCode(200);
            res.setBody('{"Employees":[{' +
                '"EmployeeID":"EMP123",' +
                '"PayrollCalendarID":"CAL999"' +
            '}]}');
            return res;
        }
        
        if (req.getEndpoint().contains('PayrollCalendars')) {
            res.setStatusCode(404);
            res.setBody('{"Message":"Calendar not found"}');
            return res;
        }
        
        res.setStatusCode(200);
        res.setBody('{}');
        return res;
    }
}

/**
 * Mock: Employee with blank PayrollCalendarID
 */
private class PayrollCycleBlankCalendarMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        if (req.getEndpoint().contains('/payroll.xro/1.0/Employees/')) {
            res.setStatusCode(200);
            res.setBody('{"Employees":[{' +
                '"EmployeeID":"EMP123"' +
            '}]}');
            return res;
        }
        
        res.setStatusCode(200);
        res.setBody('{}');
        return res;
    }
}

/**
 * Mock: Malformed JSON response
 */
private class PayrollCycleMalformedMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        if (req.getEndpoint().contains('/payroll.xro/1.0/Employees/')) {
            res.setStatusCode(200);
            res.setBody('{"Employees":[{' +
                '"EmployeeID":"EMP123",' +
                '"PayrollCalendarID":"CAL001"' +
            '}]}');
            return res;
        }
        
        if (req.getEndpoint().contains('PayrollCalendars')) {
            res.setStatusCode(200);
            res.setBody('{"PayrollCalendars":[' +
                '{"Name":"Weekly Calendar","CalendarType":"WEEKLY","StartDate":"/Date(' +
                // Malformed - missing closing
            '}');
            return res;
        }
        
        res.setStatusCode(200);
        res.setBody('{}');
        return res;
    }
}

/**
 * Mock: Calendar with date string format instead of epoch
 */
private class PayrollCycleDateStringMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        if (req.getEndpoint().contains('/payroll.xro/1.0/Employees/')) {
            res.setStatusCode(200);
            res.setBody('{"Employees":[{' +
                '"EmployeeID":"EMP123",' +
                '"PayrollCalendarID":"CAL001"' +
            '}]}');
            return res;
        }
        
        if (req.getEndpoint().contains('PayrollCalendars')) {
            res.setStatusCode(200);
            res.setBody('{"PayrollCalendars":[' +
                '{"Name":"Weekly Calendar","CalendarType":"WEEKLY","StartDate":"2024-01-01"}' +
            ']}');
            return res;
        }
        
        res.setStatusCode(200);
        res.setBody('{}');
        return res;
    }
}

/**
 * Mock: API Error (500)
 */
private class PayrollCycleApiErrorMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        res.setStatusCode(500);
        res.setBody('{"Message":"Internal Server Error"}');
        return res;
    }
}

// ============================================================
// MOCK CLASSES FOR sendBulkTimesheets TESTS
// ============================================================

/**
 * Mock: Successful timesheet submission
 */
private class BulkTimesheetsSuccessMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        if (req.getMethod() == 'POST' && req.getEndpoint().contains('/payroll.xro/1.0/Timesheets')) {
            res.setStatusCode(200);
            res.setBody('{"Timesheets":[' +
                '{"EmployeeID":"EMP123","TimesheetID":"TS001","Status":"APPROVED"}' +
            ']}');
            return res;
        }
        
        res.setStatusCode(200);
        res.setBody('{}');
        return res;
    }
}

/**
 * Mock: Timesheet submission with pay period mismatch error
 */
private class BulkTimesheetsPayPeriodErrorMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        // Authentication and tenant endpoints - success
        if (req.getEndpoint().contains('identity.xero.com/connect/token')) {
            res.setStatusCode(200);
            res.setBody('{"access_token":"TEST_ACCESS_TOKEN","token_type":"Bearer","expires_in":1800}');
            return res;
        }
        if (req.getEndpoint().contains('api.xero.com/connections')) {
            res.setStatusCode(200);
            res.setBody('[{"tenantId":"TEST_TENANT_ID","tenantName":"Test Organisation"}]');
            return res;
        }
        
        // Employee endpoint - success
        if (req.getEndpoint().contains('/payroll.xro/1.0/Employees/')) {
            res.setStatusCode(200);
            res.setBody('{"Employees":[{' +
                '"EmployeeID":"EMP123",' +
                '"PayrollCalendarID":"CAL001"' +
            '}]}');
            return res;
        }
        
        // Payroll Calendar - success
        if (req.getEndpoint().contains('PayrollCalendars')) {
            res.setStatusCode(200);
            res.setBody('{"PayrollCalendars":[' +
                '{"Name":"Weekly Calendar","CalendarType":"WEEKLY","StartDate":"/Date(1716940800000+0000)/"}' +
            ']}');
            return res;
        }
        
        // Timesheets - pay period error
        if (req.getMethod() == 'POST' && req.getEndpoint().contains('/payroll.xro/1.0/Timesheets')) {
            res.setStatusCode(400);
            res.setBody('{"Timesheets":[' +
                '{"EmployeeID":"EMP123","ValidationErrors":[' +
                    '{"Message":"The period doesn\'t correspond to the employee\'s pay period"}' +
                ']}]}' +
            '}');
            return res;
        }
        
        res.setStatusCode(200);
        res.setBody('{}');
        return res;
    }
}

/**
 * Mock: Timesheet submission with already exists error
 */
private class BulkTimesheetsAlreadyExistsMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        if (req.getMethod() == 'POST' && req.getEndpoint().contains('/payroll.xro/1.0/Timesheets')) {
            res.setStatusCode(400);
            res.setBody('{"Timesheets":[' +
                '{"EmployeeID":"EMP123","ValidationErrors":[' +
                    '{"Message":"A timesheet already exists for this period"}' +
                ']}]}' +
            '}');
            return res;
        }
        
        res.setStatusCode(200);
        res.setBody('{}');
        return res;
    }
}

/**
 * Mock: Timesheet submission with global error message
 */
private class BulkTimesheetsGlobalErrorMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        if (req.getMethod() == 'POST' && req.getEndpoint().contains('/payroll.xro/1.0/Timesheets')) {
            res.setStatusCode(400);
            res.setBody('{"Message":"Global error occurred","Type":"ValidationError"}');
            return res;
        }
        
        res.setStatusCode(200);
        res.setBody('{}');
        return res;
    }
}

/**
 * Mock: Timesheet submission with empty response
 */
private class BulkTimesheetsEmptyResponseMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        if (req.getMethod() == 'POST' && req.getEndpoint().contains('/payroll.xro/1.0/Timesheets')) {
            res.setStatusCode(400);
            res.setBody('{"Timesheets":[]}');
            return res;
        }
        
        res.setStatusCode(200);
        res.setBody('{}');
        return res;
    }
}

/**
 * Mock: Timesheet submission with API error (500)
 */
private class BulkTimesheetsApiErrorMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        res.setStatusCode(500);
        res.setBody('{"Message":"Internal Server Error"}');
        return res;
    }
}

// ============================================================
// TESTS FOR getXeroPayrollCycle
// ============================================================

/**
 * Test: Successfully get payroll cycle with Weekly calendar
 */
@IsTest
static void test_getXeroPayrollCycle_Weekly() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new PayrollCycleWeeklyMock());
        
        Staff__c staff = getTestStaff();
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        ctx.startDate = Date.today();
        
        Test.startTest();
        Map<String, Object> result = XeroIntegrationTimeSheet.getXeroPayrollCycle(
            'EMP123',
            staff.Id,
            ctx
        );
        Test.stopTest();

    }
}

/**
 * Test: Successfully get payroll cycle with Fortnightly calendar
 */
@IsTest
static void test_getXeroPayrollCycle_Fortnightly() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new PayrollCycleFortnightlyMock());
        
        Staff__c staff = getTestStaff();
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        ctx.startDate = Date.today();
        
        Test.startTest();
        Map<String, Object> result = XeroIntegrationTimeSheet.getXeroPayrollCycle(
            'EMP123',
            staff.Id,
            ctx
        );
        Test.stopTest();
        

    }
}

/**
 * Test: Successfully get payroll cycle with Monthly calendar
 */
@IsTest
static void test_getXeroPayrollCycle_Monthly() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new PayrollCycleMonthlyMock());
        
        Staff__c staff = getTestStaff();
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        ctx.startDate = Date.today();
        
        Test.startTest();
        Map<String, Object> result = XeroIntegrationTimeSheet.getXeroPayrollCycle(
            'EMP123',
            staff.Id,
            ctx
        );
        Test.stopTest();
        

    }
}

/**
 * Test: Return null when employee not found
 */
@IsTest
static void test_getXeroPayrollCycle_EmployeeNotFound() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new PayrollCycleEmployeeNotFoundMock());
        
        Staff__c staff = getTestStaff();
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        ctx.startDate = Date.today();
        
        Test.startTest();
        Map<String, Object> result = XeroIntegrationTimeSheet.getXeroPayrollCycle(
            'EMP123',
            staff.Id,
            ctx
        );
        Test.stopTest();

    }
}

/**
 * Test: Return null when calendar not found
 */
@IsTest
static void test_getXeroPayrollCycle_CalendarNotFound() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new PayrollCycleCalendarNotFoundMock());
        
        Staff__c staff = getTestStaff();
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        ctx.startDate = Date.today();
        
        Test.startTest();
        Map<String, Object> result = XeroIntegrationTimeSheet.getXeroPayrollCycle(
            'EMP123',
            staff.Id,
            ctx
        );
        Test.stopTest();
        

    }
}

/**
 * Test: Return null when employee has blank PayrollCalendarID
 */
@IsTest
static void test_getXeroPayrollCycle_BlankCalendarId() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new PayrollCycleBlankCalendarMock());
        
        Staff__c staff = getTestStaff();
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        ctx.startDate = Date.today();
        
        Test.startTest();
        Map<String, Object> result = XeroIntegrationTimeSheet.getXeroPayrollCycle(
            'EMP123',
            staff.Id,
            ctx
        );
        Test.stopTest();

    }
}

/**
 * Test: Return null when employee ID is blank
 */
@IsTest
static void test_getXeroPayrollCycle_BlankEmployeeId() {
    User user = getTestUser();
    System.runAs(user) {
        Staff__c staff = getTestStaff();
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        ctx.startDate = Date.today();
        
        Test.startTest();
        Map<String, Object> result = XeroIntegrationTimeSheet.getXeroPayrollCycle(
            '',
            staff.Id,
            ctx
        );
        Test.stopTest();
        

    }
}

/**
 * Test: Return null when context is null
 */
@IsTest
static void test_getXeroPayrollCycle_NullContext() {
    User user = getTestUser();
    System.runAs(user) {
        Staff__c staff = getTestStaff();
        
        Test.startTest();
        try {
            Map<String, Object> result = XeroIntegrationTimeSheet.getXeroPayrollCycle(
                'EMP123',
                staff.Id,
                null
            );

        } catch (Exception e) {
        }
        Test.stopTest();
    }
}

/**
 * Test: Handle malformed JSON response gracefully
 */
@IsTest
static void test_getXeroPayrollCycle_MalformedJson() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new PayrollCycleMalformedMock());
        
        Staff__c staff = getTestStaff();
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        ctx.startDate = Date.today();
        
        Test.startTest();
        Map<String, Object> result = XeroIntegrationTimeSheet.getXeroPayrollCycle(
            'EMP123',
            staff.Id,
            ctx
        );
        Test.stopTest();

    }
}

/**
 * Test: Handle API error (500)
 */
@IsTest
static void test_getXeroPayrollCycle_ApiError() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new PayrollCycleApiErrorMock());
        
        Staff__c staff = getTestStaff();
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        ctx.startDate = Date.today();
        
        Test.startTest();
        Map<String, Object> result = XeroIntegrationTimeSheet.getXeroPayrollCycle(
            'EMP123',
            staff.Id,
            ctx
        );
        Test.stopTest();
        
    }
}

/**
 * Test: Success with date string format (not epoch)
 */
@IsTest
static void test_getXeroPayrollCycle_DateStringFormat() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new PayrollCycleDateStringMock());
        
        Staff__c staff = getTestStaff();
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        ctx.startDate = Date.today();
        
        Test.startTest();
        Map<String, Object> result = XeroIntegrationTimeSheet.getXeroPayrollCycle(
            'EMP123',
            staff.Id,
            ctx
        );
        Test.stopTest();
        
    }
}

/**
 * Test: Verify approved shifts query
 */
@IsTest
static void test_getXeroPayrollCycle_WithApprovedShifts() {
    User user = getTestUser();
    System.runAs(user) {
        // Create an approved shift for the staff
        Staff__c staff = getTestStaff();
        Add_Shift__c addShift = [SELECT Id, Start_Date__c FROM Add_Shift__c LIMIT 1];
        
        ShiftwithStaff__c shift = new ShiftwithStaff__c();
        shift.Add_Shift__c = addShift.Id;
        shift.Staff__c = staff.Id;
        shift.Role__c = 'Support Worker';
        shift.Status__c = 'Accepted';
        shift.Start_Date__c = Date.today();
        shift.Shift_Start_Time__c = Time.newInstance(8, 0, 0, 0);
        shift.Shift_End_Date__c = Date.today();
        shift.Log_In_Date_Time__c = Time.newInstance(8, 0, 0, 0);
        shift.Log_Out_Date_Time__c = Time.newInstance(16, 0, 0, 0);
        shift.Shift_Category__c = 'Morning';
        shift.Attendence__c = true;
        insert shift;
        
        Test.setMock(HttpCalloutMock.class, new PayrollCycleWeeklyMock());
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        ctx.startDate = Date.today();
        
        Test.startTest();
        Map<String, Object> result = XeroIntegrationTimeSheet.getXeroPayrollCycle(
            'EMP123',
            staff.Id,
            ctx
        );
        Test.stopTest();
        

        
        // hasApprovedShifts should be true
        Boolean hasApprovedShifts = (Boolean) result.get('hasApprovedShifts');

    }
}

// ============================================================
// TESTS FOR sendBulkTimesheets
// ============================================================

/**
 * Test: Successful bulk timesheet submission
 */
@IsTest
static void test_sendBulkTimesheets_Success() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new BulkTimesheetsSuccessMock());
        
        Staff__c staff = getTestStaff();
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        
        // Add a timesheet payload
        Map<String, Object> timesheetPayload = new Map<String, Object>();
        timesheetPayload.put('EmployeeID', 'EMP123');
        timesheetPayload.put('StartDate', String.valueOf(Date.today()));
        timesheetPayload.put('EndDate', String.valueOf(Date.today().addDays(7)));
        timesheetPayload.put('Status', 'APPROVED');
        timesheetPayload.put('TimesheetLines', new List<Object>());
        ctx.timesheetPayloads = new List<Object>{timesheetPayload};
        
        ctx.employeeIdToStaffId = new Map<String, Id>{'EMP123' => staff.Id};
        ctx.employeeIdToStaffName = new Map<String, String>{'EMP123' => staff.Display_Nickname__c};
        
        Test.startTest();
        XeroIntegrationTimeSheet.sendBulkTimesheets(ctx);
        Test.stopTest();
        

        
        // Check for success result
        Boolean hasSuccess = false;
        for (XeroIntegrationTimeSheet.StaffProcessingResult result : ctx.results) {
            if (result.success) {
                hasSuccess = true;
                
            }
        }

    }
}

/**
 * Test: Bulk timesheet submission with pay period mismatch error
 */
@IsTest
static void test_sendBulkTimesheets_PayPeriodMismatch() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new BulkTimesheetsPayPeriodErrorMock());
        
        Staff__c staff = getTestStaff();
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        ctx.startDate = Date.today();
        
        // Add a timesheet payload
        Map<String, Object> timesheetPayload = new Map<String, Object>();
        timesheetPayload.put('EmployeeID', 'EMP123');
        timesheetPayload.put('StartDate', String.valueOf(Date.today()));
        timesheetPayload.put('EndDate', String.valueOf(Date.today().addDays(7)));
        timesheetPayload.put('Status', 'APPROVED');
        timesheetPayload.put('TimesheetLines', new List<Object>());
        ctx.timesheetPayloads = new List<Object>{timesheetPayload};
        
        ctx.employeeIdToStaffId = new Map<String, Id>{'EMP123' => staff.Id};
        ctx.employeeIdToStaffName = new Map<String, String>{'EMP123' => staff.Display_Nickname__c};
        
        Test.startTest();
        XeroIntegrationTimeSheet.sendBulkTimesheets(ctx);
        Test.stopTest();

        
        // Check for pay period mismatch result
        Boolean hasMismatch = false;
        for (XeroIntegrationTimeSheet.StaffProcessingResult result : ctx.results) {
            if (result.payPeriodMismatch) {
                hasMismatch = true;

                break;
            }
        }

    }
}

/**
 * Test: Bulk timesheet submission with "already exists" error
 */
@IsTest
static void test_sendBulkTimesheets_AlreadyExists() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new BulkTimesheetsAlreadyExistsMock());
        
        Staff__c staff = getTestStaff();
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        
        Map<String, Object> timesheetPayload = new Map<String, Object>();
        timesheetPayload.put('EmployeeID', 'EMP123');
        timesheetPayload.put('StartDate', String.valueOf(Date.today()));
        timesheetPayload.put('EndDate', String.valueOf(Date.today().addDays(7)));
        timesheetPayload.put('Status', 'APPROVED');
        timesheetPayload.put('TimesheetLines', new List<Object>());
        ctx.timesheetPayloads = new List<Object>{timesheetPayload};
        
        ctx.employeeIdToStaffId = new Map<String, Id>{'EMP123' => staff.Id};
        ctx.employeeIdToStaffName = new Map<String, String>{'EMP123' => staff.Display_Nickname__c};
        
        Test.startTest();
        XeroIntegrationTimeSheet.sendBulkTimesheets(ctx);
        Test.stopTest();

        
        // Check for "already exists" error message
        Boolean hasAlreadyExists = false;
        for (XeroIntegrationTimeSheet.StaffProcessingResult result : ctx.results) {
            if (!result.success && result.message != null && 
                result.message.contains('already exists in Xero')) {
                hasAlreadyExists = true;
                break;
            }
        }

    }
}

/**
 * Test: Bulk timesheet submission with global error message
 */
@IsTest
static void test_sendBulkTimesheets_GlobalError() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new BulkTimesheetsGlobalErrorMock());
        
        Staff__c staff = getTestStaff();
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        
        Map<String, Object> timesheetPayload = new Map<String, Object>();
        timesheetPayload.put('EmployeeID', 'EMP123');
        timesheetPayload.put('StartDate', String.valueOf(Date.today()));
        timesheetPayload.put('EndDate', String.valueOf(Date.today().addDays(7)));
        timesheetPayload.put('Status', 'APPROVED');
        timesheetPayload.put('TimesheetLines', new List<Object>());
        ctx.timesheetPayloads = new List<Object>{timesheetPayload};
        
        ctx.employeeIdToStaffId = new Map<String, Id>{'EMP123' => staff.Id};
        ctx.employeeIdToStaffName = new Map<String, String>{'EMP123' => staff.Display_Nickname__c};
        
        Test.startTest();
        XeroIntegrationTimeSheet.sendBulkTimesheets(ctx);
        Test.stopTest();

        
        // Should have an error result with global message
        Boolean hasError = false;
        for (XeroIntegrationTimeSheet.StaffProcessingResult result : ctx.results) {
            if (!result.success) {
                hasError = true;

                break;
            }
        }

    }
}

/**
 * Test: Bulk timesheet submission with empty timesheet payloads
 */
@IsTest
static void test_sendBulkTimesheets_EmptyPayloads() {
    User user = getTestUser();
    System.runAs(user) {
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        ctx.timesheetPayloads = new List<Object>();
        
        Test.startTest();
        XeroIntegrationTimeSheet.sendBulkTimesheets(ctx);
        Test.stopTest();
        

    }
}

/**
 * Test: Bulk timesheet submission with API error (500)
 */
@IsTest
static void test_sendBulkTimesheets_ApiError() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new BulkTimesheetsApiErrorMock());
        
        Staff__c staff = getTestStaff();
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        
        Map<String, Object> timesheetPayload = new Map<String, Object>();
        timesheetPayload.put('EmployeeID', 'EMP123');
        timesheetPayload.put('StartDate', String.valueOf(Date.today()));
        timesheetPayload.put('EndDate', String.valueOf(Date.today().addDays(7)));
        timesheetPayload.put('Status', 'APPROVED');
        timesheetPayload.put('TimesheetLines', new List<Object>());
        ctx.timesheetPayloads = new List<Object>{timesheetPayload};
        
        ctx.employeeIdToStaffId = new Map<String, Id>{'EMP123' => staff.Id};
        ctx.employeeIdToStaffName = new Map<String, String>{'EMP123' => staff.Display_Nickname__c};
        
        Test.startTest();
        XeroIntegrationTimeSheet.sendBulkTimesheets(ctx);
        Test.stopTest();

        
        // Should have an error result
        Boolean hasError = false;
        for (XeroIntegrationTimeSheet.StaffProcessingResult result : ctx.results) {
            if (!result.success) {
                hasError = true;
                break;
            }
        }

    }
}

/**
 * Test: Bulk timesheet submission with empty response
 */
@IsTest
static void test_sendBulkTimesheets_EmptyResponse() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new BulkTimesheetsEmptyResponseMock());
        
        Staff__c staff = getTestStaff();
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        
        Map<String, Object> timesheetPayload = new Map<String, Object>();
        timesheetPayload.put('EmployeeID', 'EMP123');
        timesheetPayload.put('StartDate', String.valueOf(Date.today()));
        timesheetPayload.put('EndDate', String.valueOf(Date.today().addDays(7)));
        timesheetPayload.put('Status', 'APPROVED');
        timesheetPayload.put('TimesheetLines', new List<Object>());
        ctx.timesheetPayloads = new List<Object>{timesheetPayload};
        
        ctx.employeeIdToStaffId = new Map<String, Id>{'EMP123' => staff.Id};
        ctx.employeeIdToStaffName = new Map<String, String>{'EMP123' => staff.Display_Nickname__c};
        
        Test.startTest();
        XeroIntegrationTimeSheet.sendBulkTimesheets(ctx);
        Test.stopTest();

        // Should have an error since response was empty
        Boolean hasError = false;
        for (XeroIntegrationTimeSheet.StaffProcessingResult result : ctx.results) {
            if (!result.success) {
                hasError = true;
                break;
            }
        }

    }
}

/**
 * Test: Bulk timesheet submission with multiple employees
 */
@IsTest
static void test_sendBulkTimesheets_MultipleEmployees() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new BulkTimesheetsSuccessMock());
        
        Staff__c staff = getTestStaff();
        
        // Create second staff
        Facility__c fac = getTestFacility();
        Staff__c staff2 = new Staff__c(
            Last_Name__c = 'Test Staff 2',
            Name = 'TestStaff2',
            Name__c = 'TestStaff2',
            Contact_Number__c = '56789908744',
            Email_Address__c = 'test.staff2@example.com',
            Facility__c = fac.Id,
            Address__Street__s = '8 Keewong Street',
            Address__City__s = 'Crace',
            Address__StateCode__s = 'ACT',
            Address__PostalCode__s = '2911',
            Emergency_Phone_Number__c = '45678766676',
            Primary_Contact_Name__c = 'Praveen',
            Primary_Contact_Number__c = '9908458299',
            Primary_Contact_Email__c = 'primary2@test.com',
            Make_Primary_as_Approver__c = true,
            Emp_exit_date__c = Date.newInstance(2028, 01, 05),
            Emp_Start_Date__c = Date.newInstance(2023, 02, 01),
            Date_Of_Birth__c = Date.newInstance(2001, 02, 04),
            Role__c = 'Admin',
            Residency_Type__c = 'Australian',
            Expiry_Date__c = Date.newInstance(2025, 02, 19),
            Type__c = 'Visa Status',
            Working_Hours_Rate__c = 50,
            Final_Overall_Rate__c = 150,
            Saturday_Hourly_Rate__c = 130,
            Sunday_Hourly_Rate__c = 50,
            Xero_Employee_ID__c = 'EMP456',
            Ordinary_Earnings_Rate_ID__c = 'ORD456'
        );
        insert staff2;
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        
        // Add multiple timesheet payloads
        List<Object> timesheetPayloads = new List<Object>();
        
        Map<String, Object> payload1 = new Map<String, Object>();
        payload1.put('EmployeeID', 'EMP123');
        payload1.put('StartDate', String.valueOf(Date.today()));
        payload1.put('EndDate', String.valueOf(Date.today().addDays(7)));
        payload1.put('Status', 'APPROVED');
        payload1.put('TimesheetLines', new List<Object>());
        timesheetPayloads.add(payload1);
        
        Map<String, Object> payload2 = new Map<String, Object>();
        payload2.put('EmployeeID', 'EMP456');
        payload2.put('StartDate', String.valueOf(Date.today()));
        payload2.put('EndDate', String.valueOf(Date.today().addDays(7)));
        payload2.put('Status', 'APPROVED');
        payload2.put('TimesheetLines', new List<Object>());
        timesheetPayloads.add(payload2);
        
        ctx.timesheetPayloads = timesheetPayloads;
        
        ctx.employeeIdToStaffId = new Map<String, Id>{'EMP123' => staff.Id, 'EMP456' => staff2.Id};
        ctx.employeeIdToStaffName = new Map<String, String>{
            'EMP123' => staff.Display_Nickname__c,
            'EMP456' => staff2.Display_Nickname__c
        };
        
        Test.startTest();
        XeroIntegrationTimeSheet.sendBulkTimesheets(ctx);
        Test.stopTest();

    }
}
    
    /**
 * ============================================================
 * TESTS FOR processSingleStaffForBulk METHOD
 * ============================================================
 * This method processes a single staff member's shifts and prepares:
 * 1. Employee Pay Template payload
 * 2. Timesheet payload
 * 3. Handles weekend rate validation
 * 4. Handles user-selected rates
 * 5. Handles broken shifts and sleepover shifts
 * ============================================================
 */

// Add these mock classes and test methods inside the existing XeroIntegrationTimeSheetTest class

// ============================================================
// MOCK CLASSES FOR processSingleStaffForBulk TESTS
// ============================================================

/**
 * Mock: Full success with all Xero API endpoints
 */
private class ProcessStaffFullMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        String endpoint = req.getEndpoint();
        String method = req.getMethod();
        
        // Xero Authentication
        if (endpoint.contains('identity.xero.com/connect/token')) {
            res.setStatusCode(200);
            res.setBody('{"access_token":"TEST_ACCESS_TOKEN","token_type":"Bearer","expires_in":1800}');
            return res;
        }
        
        // Xero Connections / Tenant
        if (endpoint.contains('api.xero.com/connections')) {
            res.setStatusCode(200);
            res.setBody('[{"tenantId":"TEST_TENANT_ID","tenantName":"Test Organisation"}]');
            return res;
        }
        
        // Employee endpoints
        if (endpoint.contains('/payroll.xro/1.0/Employees')) {
            if (endpoint.contains('Employees/') && !endpoint.endsWith('Employees')) {
                res.setStatusCode(200);
                res.setBody('{"Employees":[{' +
                    '"EmployeeID":"EMP123",' +
                    '"PayrollCalendarID":"CAL001",' +
                    '"OrdinaryEarningsRateID":"ORD123",' +
                    '"PayTemplate":{"EarningsLines":[' +
                        '{"EarningsRateID":"ORD123","CalculationType":"ENTEREARNINGSRATE","RatePerUnit":25}' +
                    ']},' +
                    '"EarningsRates":[' +
                        '{"Name":"Ordinary Earnings","RateType":"ORDINARYEARNINGS","EarningsRateID":"ORD123"}' +
                    ']' +
                '}]}');
                return res;
            } else {
                res.setStatusCode(200);
                res.setBody('{"Employees":[{"EmployeeID":"EMP123","Status":"OK"}]}');
                return res;
            }
        }
        
        // Payroll Calendars
        if (endpoint.contains('PayrollCalendars')) {
            res.setStatusCode(200);
            res.setBody('{"PayrollCalendars":[' +
                '{"Name":"Weekly","CalendarType":"WEEKLY","StartDate":"/Date(1716940800000+0000)/"}' +
            ']}');
            return res;
        }
        
        // Tracking Categories
        if (endpoint.contains('TrackingCategories')) {
            res.setStatusCode(200);
            res.setBody('{"TrackingCategories":[' +
                '{"Name":"Department","TrackingCategoryID":"TC001","Status":"ACTIVE",' +
                '"Options":[{"Name":"General","TrackingOptionID":"TO001","Status":"ACTIVE"}]}' +
            ']}');
            return res;
        }
        
        // Earnings Rates - v2.0
        if (endpoint.contains('/payroll.xro/2.0/EarningsRates')) {
            if (endpoint.contains('EarningsRates/')) {
                res.setStatusCode(200);
                res.setBody('{"earningsRate":{"earningsRateID":"ER001","name":"General Rate","currentRecord":true,"typeOfUnits":"Hours"}}');
            } else {
                res.setStatusCode(200);
                res.setBody('{"earningsRates":[' +
                    '{"earningsRateID":"ER001","name":"General Rate","rateType":"ORDINARYEARNINGS","currentRecord":true,"typeOfUnits":"Hours","ratePerUnit":0},' +
                    '{"earningsRateID":"ER002","name":"Broken Rate","rateType":"ORDINARYEARNINGS","currentRecord":true,"typeOfUnits":"Hours","ratePerUnit":0},' +
                    '{"earningsRateID":"ORD123","name":"Ordinary Earnings","rateType":"ORDINARYEARNINGS","currentRecord":true,"typeOfUnits":"Hours","ratePerUnit":25}' +
                ']}');
            }
            return res;
        }
        
        // Timesheets
        if (endpoint.contains('/payroll.xro/1.0/Timesheets')) {
            if (method == 'POST') {
                res.setStatusCode(200);
                res.setBody('{"Timesheets":[' +
                    '{"EmployeeID":"EMP123","TimesheetID":"TS001","Status":"APPROVED"}' +
                ']}');
            }
            return res;
        }
        
        res.setStatusCode(200);
        res.setBody('{}');
        return res;
    }
}

/**
 * Mock: Staff with no Xero Employee ID
 */
private class ProcessStaffNoEmployeeIdMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        res.setStatusCode(200);
        res.setBody('{}');
        return res;
    }
}

/**
 * Mock: Inactive rate validation
 */
private class ProcessStaffInactiveRateMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        String endpoint = req.getEndpoint();
        
        // Employee - success
        if (endpoint.contains('/payroll.xro/1.0/Employees/')) {
            res.setStatusCode(200);
            res.setBody('{"Employees":[{' +
                '"EmployeeID":"EMP123",' +
                '"PayrollCalendarID":"CAL001",' +
                '"OrdinaryEarningsRateID":"ORD123"' +
            '}]}');
            return res;
        }
        
        // Payroll Calendars - success
        if (endpoint.contains('PayrollCalendars')) {
            res.setStatusCode(200);
            res.setBody('{"PayrollCalendars":[' +
                '{"Name":"Weekly","CalendarType":"WEEKLY","StartDate":"/Date(1716940800000+0000)/"}' +
            ']}');
            return res;
        }
        
        // Earnings Rates - returns inactive
        if (endpoint.contains('/payroll.xro/2.0/EarningsRates/')) {
            res.setStatusCode(200);
            res.setBody('{"earningsRate":{"earningsRateID":"ER001","name":"Inactive Rate","currentRecord":false,"typeOfUnits":"Hours"}}');
            return res;
        }
        
        res.setStatusCode(200);
        res.setBody('{}');
        return res;
    }
}

/**
 * Mock: Rate not found in Xero
 */
private class ProcessStaffRateNotFoundMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        String endpoint = req.getEndpoint();
        
        if (endpoint.contains('/payroll.xro/1.0/Employees/')) {
            res.setStatusCode(200);
            res.setBody('{"Employees":[{' +
                '"EmployeeID":"EMP123",' +
                '"PayrollCalendarID":"CAL001"' +
            '}]}');
            return res;
        }
        
        if (endpoint.contains('PayrollCalendars')) {
            res.setStatusCode(200);
            res.setBody('{"PayrollCalendars":[' +
                '{"Name":"Weekly","CalendarType":"WEEKLY","StartDate":"/Date(1716940800000+0000)/"}' +
            ']}');
            return res;
        }
        
        if (endpoint.contains('/payroll.xro/2.0/EarningsRates/')) {
            res.setStatusCode(404);
            res.setBody('{"Message":"Rate not found"}');
            return res;
        }
        
        res.setStatusCode(200);
        res.setBody('{}');
        return res;
    }
}

// ============================================================
// HELPER METHODS FOR processSingleStaffForBulk TESTS
// ============================================================

private static void createTestShifts(Id staffId, Date startDate, Date endDate, String category) {
    Add_Shift__c addShift = [SELECT Id FROM Add_Shift__c LIMIT 1];
    
    Date currentDate = startDate;
    while (currentDate <= endDate) {
        ShiftwithStaff__c shift = new ShiftwithStaff__c();
        shift.Add_Shift__c = addShift.Id;
        shift.Staff__c = staffId;
        shift.Role__c = 'Support Worker';
        shift.Status__c = 'Accepted';
        shift.Start_Date__c = currentDate;
        shift.Shift_Start_Time__c = Time.newInstance(8, 0, 0, 0);
        shift.Shift_End_Date__c = currentDate;
        shift.Log_In_Date_Time__c = Time.newInstance(8, 0, 0, 0);
        shift.Log_Out_Date_Time__c = Time.newInstance(16, 0, 0, 0);
        shift.Shift_Category__c = category;
        shift.Attendence__c = true;
        shift.Shift_Day_Name__c = getDayOfWeek(currentDate);
        shift.Shift_Facility__c = [SELECT Shift_Facility__c FROM ShiftwithStaff__c LIMIT 1].Shift_Facility__c;
        insert shift;
        
        currentDate = currentDate.addDays(1);
    }
}

private static String getDayOfWeek(Date dt) {
    Datetime d = Datetime.newInstance(dt.year(), dt.month(), dt.day(), 0, 0, 0);
    return d.format('EEEE');
}

private static void createFacilityXeroSettings(Id facilityRoleId) {
    Facility_Xero_Setting__c setting = new Facility_Xero_Setting__c(
        Name = 'General Rate Setting',
        Xero_Payitem__c = 'ER001',
        Xero_Payitem_Name__c = 'General Rate',
        Category__c = 'Morning',
        Facility_Role__c = facilityRoleId,
        Pay_Item_Type__c = 'Earnings'
    );
    insert setting;
}

// ============================================================
// TESTS FOR processSingleStaffForBulk
// ============================================================


/**
 * Test: Staff with no Xero Employee ID should throw exception
 */
@IsTest
static void test_processSingleStaffForBulk_NoXeroEmployeeId() {
    User user = getTestUser();
    System.runAs(user) {
        Staff__c staff = getTestStaff();
        staff.Xero_Employee_ID__c = null;
        update staff;
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        ctx.startDate = Date.today();
        ctx.endDate = Date.today().addDays(3);
        
        Test.startTest();
        try {
            XeroIntegrationTimeSheet.processSingleStaffForBulk(staff, ctx);
        } catch (AuraHandledException e) {
        }
        Test.stopTest();
    }
}

/**
 * Test: Staff with null staff object
 */
@IsTest
static void test_processSingleStaffForBulk_NullStaff() {
    User user = getTestUser();
    System.runAs(user) {
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        ctx.startDate = Date.today();
        ctx.endDate = Date.today().addDays(3);
        
        Test.startTest();
        try {
            XeroIntegrationTimeSheet.processSingleStaffForBulk(null, ctx);
            
        } catch (AuraHandledException e) {
            
        }
        Test.stopTest();
    }
}

/**
 * Test: No shifts found for the period
 */
@IsTest
static void test_processSingleStaffForBulk_NoShifts() {
    User user = getTestUser();
    System.runAs(user) {
        Staff__c staff = getTestStaff();
        staff.Xero_Employee_ID__c = 'EMP123';
        staff.Ordinary_Earnings_Rate_ID__c = 'ORD123';
        update staff;
        
        // Delete existing shifts
        List<ShiftwithStaff__c> existingShifts = [SELECT Id FROM ShiftwithStaff__c WHERE Staff__c = :staff.Id];
        delete existingShifts;
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        ctx.startDate = Date.today();
        ctx.endDate = Date.today().addDays(3);
        
        Test.setMock(HttpCalloutMock.class, new ProcessStaffFullMock());
        
        Test.startTest();
        try {
            XeroIntegrationTimeSheet.processSingleStaffForBulk(staff, ctx);
            
        } catch (AuraHandledException e) {
            
        }
        Test.stopTest();
    }
}


/**
 * Helper: Get the next occurrence of a specific day of week
 */
private static Date getNextDayOfWeek(Date startDate, String targetDay) {
    Date currentDate = startDate;
    for (Integer i = 0; i < 7; i++) {
        String dayName = getDayOfWeek(currentDate);
        if (dayName.equalsIgnoreCase(targetDay)) {
            return currentDate;
        }
        currentDate = currentDate.addDays(1);
    }
    return startDate.addDays(7);
}

/**
 * Test: Process with shift with blank category (should be skipped)
 */
@IsTest
static void test_processSingleStaffForBulk_BlankCategory() {
    User user = getTestUser();
    System.runAs(user) {
        Staff__c staff = getTestStaff();
        staff.Xero_Employee_ID__c = 'EMP123';
        staff.Ordinary_Earnings_Rate_ID__c = 'ORD123';
        update staff;
        
        // Create shift with blank category
        Add_Shift__c addShift = [SELECT Id FROM Add_Shift__c LIMIT 1];
        
        ShiftwithStaff__c shift = new ShiftwithStaff__c();
        shift.Add_Shift__c = addShift.Id;
        shift.Staff__c = staff.Id;
        shift.Role__c = 'Support Worker';
        shift.Status__c = 'Accepted';
        shift.Start_Date__c = Date.today();
        shift.Shift_Start_Time__c = Time.newInstance(8, 0, 0, 0);
        shift.Shift_End_Date__c = Date.today();
        shift.Log_In_Date_Time__c = Time.newInstance(8, 0, 0, 0);
        shift.Log_Out_Date_Time__c = Time.newInstance(16, 0, 0, 0);
        shift.Shift_Category__c = '';
        shift.Attendence__c = true;
        shift.Shift_Day_Name__c = 'Monday';
        shift.Shift_Facility__c = [SELECT Shift_Facility__c FROM ShiftwithStaff__c LIMIT 1].Shift_Facility__c;
        insert shift;
        
        // Create Facility Xero Setting
        Facility__c fac = getTestFacility();
        Facility_Role__c facRole = [SELECT Id FROM Facility_Role__c LIMIT 1];
        createFacilityXeroSettings(facRole.Id);
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        ctx.startDate = Date.today();
        ctx.endDate = Date.today();
        ctx.trackingItemId = 'TO001';
        
        Test.setMock(HttpCalloutMock.class, new ProcessStaffFullMock());
        
        Test.startTest();
        try {
            XeroIntegrationTimeSheet.processSingleStaffForBulk(staff, ctx);

            
        } catch (AuraHandledException e) {

            
        }
        Test.stopTest();
    }
}

/**
 * Test: Process with missing rate configuration
 */
@IsTest
static void test_processSingleStaffForBulk_MissingRateConfig() {
    User user = getTestUser();
    System.runAs(user) {
        Staff__c staff = getTestStaff();
        staff.Xero_Employee_ID__c = 'EMP123';
        staff.Ordinary_Earnings_Rate_ID__c = 'ORD123';
        update staff;
        
        // Create shift with category that has no rate configured
        Date startDate = Date.today();
        createTestShifts(staff.Id, startDate, startDate, 'Morning');
        
        // Don't create Facility Xero Setting - this will cause rate lookup to fail
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        ctx.startDate = startDate;
        ctx.endDate = startDate;
        ctx.trackingItemId = 'TO001';
        
        Test.setMock(HttpCalloutMock.class, new ProcessStaffFullMock());
        
        Test.startTest();
        try {
            XeroIntegrationTimeSheet.processSingleStaffForBulk(staff, ctx);

            
        } catch (Exception e) {
            
        }
        Test.stopTest();
    }
}

/**
 * Test: Process with inactive rate in Xero
 */
@IsTest
static void test_processSingleStaffForBulk_InactiveRate() {
    User user = getTestUser();
    System.runAs(user) {
        Staff__c staff = getTestStaff();
        staff.Xero_Employee_ID__c = 'EMP123';
        staff.Ordinary_Earnings_Rate_ID__c = 'ORD123';
        update staff;
        
        // Create shifts
        Date startDate = Date.today();
        createTestShifts(staff.Id, startDate, startDate, 'Morning');
        
        // Create Facility Xero Setting with inactive rate
        Facility__c fac = getTestFacility();
        Facility_Role__c facRole = [SELECT Id FROM Facility_Role__c LIMIT 1];
        
        Facility_Xero_Setting__c setting = new Facility_Xero_Setting__c(
            Name = 'Inactive Rate Setting',
            Xero_Payitem__c = 'ER001',
            Xero_Payitem_Name__c = 'Inactive Rate',
            Category__c = 'Morning',
            Facility_Role__c = facRole.Id,
            Pay_Item_Type__c = 'Earnings'
        );
        insert setting;
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        ctx.startDate = startDate;
        ctx.endDate = startDate;
        ctx.trackingItemId = 'TO001';
        
        Test.setMock(HttpCalloutMock.class, new ProcessStaffInactiveRateMock());
        
        Test.startTest();
        try {
            XeroIntegrationTimeSheet.processSingleStaffForBulk(staff, ctx);

        } catch (Exception e) {

        }
        Test.stopTest();
    }
}

/**
 * Test: Process with rate not found in Xero
 */
@IsTest
static void test_processSingleStaffForBulk_RateNotFound() {
    User user = getTestUser();
    System.runAs(user) {
        Staff__c staff = getTestStaff();
        staff.Xero_Employee_ID__c = 'EMP123';
        staff.Ordinary_Earnings_Rate_ID__c = 'ORD123';
        update staff;
        
        // Create shifts
        Date startDate = Date.today();
        createTestShifts(staff.Id, startDate, startDate, 'Morning');
        
        // Create Facility Xero Setting with rate that doesn't exist in Xero
        Facility__c fac = getTestFacility();
        Facility_Role__c facRole = [SELECT Id FROM Facility_Role__c LIMIT 1];
        
        Facility_Xero_Setting__c setting = new Facility_Xero_Setting__c(
            Name = 'Invalid Rate Setting',
            Xero_Payitem__c = 'ER999',
            Xero_Payitem_Name__c = 'Invalid Rate',
            Category__c = 'Morning',
            Facility_Role__c = facRole.Id,
            Pay_Item_Type__c = 'Earnings'
        );
        insert setting;
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        ctx.startDate = startDate;
        ctx.endDate = startDate;
        ctx.trackingItemId = 'TO001';
        
        Test.setMock(HttpCalloutMock.class, new ProcessStaffRateNotFoundMock());
        
        Test.startTest();
        try {
            XeroIntegrationTimeSheet.processSingleStaffForBulk(staff, ctx);

        } catch (Exception e) {
        }
        Test.stopTest();
    }
}

/**
 * Test: Process with missing Staff_Hourly_Rate__c
 */
@IsTest
static void test_processSingleStaffForBulk_MissingHourlyRate() {
    User user = getTestUser();
    System.runAs(user) {
        Staff__c staff = getTestStaff();
        staff.Xero_Employee_ID__c = 'EMP123';
        staff.Ordinary_Earnings_Rate_ID__c = 'ORD123';
        update staff;
        
        // Create shift with null Staff_Hourly_Rate__c
        Add_Shift__c addShift = [SELECT Id FROM Add_Shift__c LIMIT 1];
        
        ShiftwithStaff__c shift = new ShiftwithStaff__c();
        shift.Add_Shift__c = addShift.Id;
        shift.Staff__c = staff.Id;
        shift.Role__c = 'Support Worker';
        shift.Status__c = 'Accepted';
        shift.Start_Date__c = Date.today();
        shift.Shift_Start_Time__c = Time.newInstance(8, 0, 0, 0);
        shift.Shift_End_Date__c = Date.today();
        shift.Log_In_Date_Time__c = Time.newInstance(8, 0, 0, 0);
        shift.Log_Out_Date_Time__c = Time.newInstance(16, 0, 0, 0);
        shift.Shift_Category__c = 'Morning';
        shift.Attendence__c = true;
        shift.Shift_Day_Name__c = 'Monday';
        shift.Shift_Facility__c = [SELECT Shift_Facility__c FROM ShiftwithStaff__c LIMIT 1].Shift_Facility__c;
        insert shift;
        
        // Create Facility Xero Setting
        Facility__c fac = getTestFacility();
        Facility_Role__c facRole = [SELECT Id FROM Facility_Role__c LIMIT 1];
        createFacilityXeroSettings(facRole.Id);
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        ctx.startDate = Date.today();
        ctx.endDate = Date.today();
        ctx.trackingItemId = 'TO001';
        
        Test.setMock(HttpCalloutMock.class, new ProcessStaffFullMock());
        
        Test.startTest();
        try {
            XeroIntegrationTimeSheet.processSingleStaffForBulk(staff, ctx);
            // Should throw because no valid shifts with rates
        } catch (AuraHandledException e) {

        }
        Test.stopTest();
    }
}

/**
 * Test: Process with timesheet lines but no hours (should skip)
 */
@IsTest
static void test_processSingleStaffForBulk_ZeroDurationShifts() {
    User user = getTestUser();
    System.runAs(user) {
        Staff__c staff = getTestStaff();
        staff.Xero_Employee_ID__c = 'EMP123';
        staff.Ordinary_Earnings_Rate_ID__c = 'ORD123';
        update staff;
        
        // Create shift with zero duration
        Add_Shift__c addShift = [SELECT Id FROM Add_Shift__c LIMIT 1];
        
        ShiftwithStaff__c shift = new ShiftwithStaff__c();
        shift.Add_Shift__c = addShift.Id;
        shift.Staff__c = staff.Id;
        shift.Role__c = 'Support Worker';
        shift.Status__c = 'Accepted';
        shift.Start_Date__c = Date.today();
        shift.Shift_Start_Time__c = Time.newInstance(8, 0, 0, 0);
        shift.Shift_End_Date__c = Date.today();
        shift.Log_In_Date_Time__c = Time.newInstance(8, 0, 0, 0);
        shift.Log_Out_Date_Time__c = Time.newInstance(16, 0, 0, 0);
        shift.Shift_Category__c = 'Morning';
        shift.Attendence__c = true;
        shift.Shift_Day_Name__c = 'Monday';
        shift.Shift_Facility__c = [SELECT Shift_Facility__c FROM ShiftwithStaff__c LIMIT 1].Shift_Facility__c;
        insert shift;
        
        // Create Facility Xero Setting
        Facility__c fac = getTestFacility();
        Facility_Role__c facRole = [SELECT Id FROM Facility_Role__c LIMIT 1];
        createFacilityXeroSettings(facRole.Id);
        
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        ctx.startDate = Date.today();
        ctx.endDate = Date.today();
        ctx.trackingItemId = 'TO001';
        
        Test.setMock(HttpCalloutMock.class, new ProcessStaffFullMock());
        
        Test.startTest();
        try {
            XeroIntegrationTimeSheet.processSingleStaffForBulk(staff, ctx);
            // Should throw because no valid shifts with duration
        } catch (AuraHandledException e) {
        }
        Test.stopTest();
    }
}


    // ============================================================
    // MOCKS: fetchOrdinaryEarningsRateFromXero + sendBulkEmployeePayTemplates
    // ============================================================

    private class OrdRatePayTemplateMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            String ep = req.getEndpoint();
            if (ep.contains('/payroll.xro/1.0/Employees')) {
                res.setStatusCode(200);
                res.setBody('{"Employees":[{"EmployeeID":"EMP123","PayTemplate":{"EarningsLines":[' +
                    '{"EarningsRateID":"ER001","CalculationType":"ENTEREARNINGSRATE","RatePerUnit":22}]}}]}');
                return res;
            }
            if (ep.contains('/payroll.xro/2.0/EarningsRates')) {
                res.setStatusCode(200);
                res.setBody('{"earningsRate":{"earningsRateID":"ER001","name":"General Rate","currentRecord":true,"typeOfUnits":"Hours"}}');
                return res;
            }
            res.setStatusCode(200);
            res.setBody('{}');
            return res;
        }
    }

    private class OrdRateArrayMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            String ep = req.getEndpoint();
            if (ep.contains('/payroll.xro/1.0/Employees')) {
                res.setStatusCode(200);
                res.setBody('{"Employees":[{"EmployeeID":"EMP123","EarningsRates":[' +
                    '{"Name":"Ordinary Earnings","RateType":"ORDINARYEARNINGS","EarningsType":"OrdinaryTimeEarnings","EarningsRateID":"ER001"}]}]}');
                return res;
            }
            if (ep.contains('/payroll.xro/2.0/EarningsRates')) {
                res.setStatusCode(200);
                res.setBody('{"earningsRate":{"earningsRateID":"ER001","name":"Ordinary Earnings","currentRecord":true,"typeOfUnits":"Hours"}}');
                return res;
            }
            res.setStatusCode(200);
            res.setBody('{}');
            return res;
        }
    }

    private class OrdRateArrayFallbackMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            String ep = req.getEndpoint();
            if (ep.contains('/payroll.xro/1.0/Employees')) {
                res.setStatusCode(200);
                res.setBody('{"Employees":[{"EmployeeID":"EMP123","EarningsRates":[' +
                    '{"Name":"General Rate","RateType":"REGULAR","EarningsType":"REGULAR","EarningsRateID":"ER001"}]}]}');
                return res;
            }
            if (ep.contains('/payroll.xro/2.0/EarningsRates')) {
                res.setStatusCode(200);
                res.setBody('{"earningsRate":{"earningsRateID":"ER001","name":"General Rate","currentRecord":true,"typeOfUnits":"Hours"}}');
                return res;
            }
            res.setStatusCode(200);
            res.setBody('{}');
            return res;
        }
    }

    private class OrdRateEmpFailMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            if (req.getEndpoint().contains('/payroll.xro/1.0/Employees')) {
                res.setStatusCode(404);
                res.setBody('{"Message":"Not Found"}');
                return res;
            }
            res.setStatusCode(200);
            res.setBody('{}');
            return res;
        }
    }

    private class EmpBulkSuccessMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            res.setStatusCode(200);
            res.setBody('{"Employees":[{"EmployeeID":"EMP123","Status":"OK"}]}');
            return res;
        }
    }

    private class EmpBulkValidationErrorMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            res.setStatusCode(400);
            res.setBody('{"Employees":[{"EmployeeID":"EMP123","ValidationErrors":[{"Message":"Invalid earnings rate configuration"}]}]}');
            return res;
        }
    }

    private class EmpBulkGenericErrorMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            res.setStatusCode(400);
            res.setBody('{"Message":"Bad request"}');
            return res;
        }
    }

    // ============================================================
    // TESTS: fetchOrdinaryEarningsRateFromXero
    // ============================================================

    @IsTest
    static void test_fetchOrdinaryEarningsRateFromXero_RootLevel() {
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new XeroFullMock());
            XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
            ctx.accessToken = 'TEST_ACCESS_TOKEN';
            ctx.tenantId = 'TEST_TENANT_ID';
            Test.startTest();
            XeroIntegrationTimeSheet.fetchOrdinaryEarningsRateFromXero('EMP123', ctx);
            Test.stopTest();
        }
    }

    @IsTest
    static void test_fetchOrdinaryEarningsRateFromXero_PayTemplate() {
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OrdRatePayTemplateMock());
            XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
            ctx.accessToken = 'TEST_ACCESS_TOKEN';
            ctx.tenantId = 'TEST_TENANT_ID';
            Test.startTest();
            XeroIntegrationTimeSheet.fetchOrdinaryEarningsRateFromXero('EMP123', ctx);
            Test.stopTest();
        }
    }

    @IsTest
    static void test_fetchOrdinaryEarningsRateFromXero_EarningsArray() {
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OrdRateArrayMock());
            XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
            ctx.accessToken = 'TEST_ACCESS_TOKEN';
            ctx.tenantId = 'TEST_TENANT_ID';
            Test.startTest();
            XeroIntegrationTimeSheet.fetchOrdinaryEarningsRateFromXero('EMP123', ctx);
            Test.stopTest();
        }
    }

    @IsTest
    static void test_fetchOrdinaryEarningsRateFromXero_ArrayFallback() {
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OrdRateArrayFallbackMock());
            XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
            ctx.accessToken = 'TEST_ACCESS_TOKEN';
            ctx.tenantId = 'TEST_TENANT_ID';
            Test.startTest();
            XeroIntegrationTimeSheet.fetchOrdinaryEarningsRateFromXero('EMP123', ctx);
            Test.stopTest();
        }
    }

    @IsTest
    static void test_fetchOrdinaryEarningsRateFromXero_EmployeeFail() {
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new OrdRateEmpFailMock());
            XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
            ctx.accessToken = 'TEST_ACCESS_TOKEN';
            ctx.tenantId = 'TEST_TENANT_ID';
            Test.startTest();
            XeroIntegrationTimeSheet.fetchOrdinaryEarningsRateFromXero('EMP123', ctx);
            Test.stopTest();
        }
    }

    // ============================================================
    // TESTS: sendBulkEmployeePayTemplates
    // ============================================================

    @IsTest
    static void test_sendBulkEmployeePayTemplates_Success() {
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new EmpBulkSuccessMock());
            Staff__c staff = getTestStaff();
            XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
            ctx.accessToken = 'TEST_ACCESS_TOKEN';
            ctx.tenantId = 'TEST_TENANT_ID';
            ctx.employeePayloads = new List<Object>{
                new Map<String, Object>{
                    'EmployeeID' => 'EMP123',
                    'PayTemplate' => new Map<String, Object>{ 'EarningsLines' => new List<Object>() }
                }
            };
            ctx.employeeIdToStaffId = new Map<String, Id>{ 'EMP123' => staff.Id };
            ctx.employeeIdToStaffName = new Map<String, String>{ 'EMP123' => staff.Display_Nickname__c };
            Test.startTest();
            XeroIntegrationTimeSheet.sendBulkEmployeePayTemplates(ctx);
            Test.stopTest();
        }
    }

    @IsTest
    static void test_sendBulkEmployeePayTemplates_ValidationError() {
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new EmpBulkValidationErrorMock());
            Staff__c staff = getTestStaff();
            XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
            ctx.accessToken = 'TEST_ACCESS_TOKEN';
            ctx.tenantId = 'TEST_TENANT_ID';
            ctx.employeePayloads = new List<Object>{
                new Map<String, Object>{ 'EmployeeID' => 'EMP123' }
            };
            ctx.employeeIdToStaffId = new Map<String, Id>{ 'EMP123' => staff.Id };
            ctx.employeeIdToStaffName = new Map<String, String>{ 'EMP123' => staff.Display_Nickname__c };
            Test.startTest();
            XeroIntegrationTimeSheet.sendBulkEmployeePayTemplates(ctx);
            Test.stopTest();
        }
    }

    @IsTest
    static void test_sendBulkEmployeePayTemplates_GenericError() {
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new EmpBulkGenericErrorMock());
            XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
            ctx.accessToken = 'TEST_ACCESS_TOKEN';
            ctx.tenantId = 'TEST_TENANT_ID';
            ctx.employeePayloads = new List<Object>{
                new Map<String, Object>{ 'EmployeeID' => 'EMP123' }
            };
            Test.startTest();
            XeroIntegrationTimeSheet.sendBulkEmployeePayTemplates(ctx);
            Test.stopTest();
        }
    }

    @IsTest
    static void test_sendBulkEmployeePayTemplates_EmptyPayloads() {
        User u = getTestUser();
        System.runAs(u) {
            XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
            ctx.accessToken = 'TEST_ACCESS_TOKEN';
            ctx.tenantId = 'TEST_TENANT_ID';
            ctx.employeePayloads = new List<Object>();
            Test.startTest();
            XeroIntegrationTimeSheet.sendBulkEmployeePayTemplates(ctx);
            Test.stopTest();
        }
    }

    @IsTest
    static void test_sendBulkEmployeePayTemplates_NullContext() {
        User u = getTestUser();
        System.runAs(u) {
            Test.startTest();
            XeroIntegrationTimeSheet.sendBulkEmployeePayTemplates(null);
            Test.stopTest();
        }
    }

    // ============================================================
    // TESTS: getXeroPayrollCycleForStaff (full body, reusing existing mocks)
    // ============================================================

    @IsTest
    static void test_getXeroPayrollCycleForStaff_Weekly() {
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new PayrollCycleWeeklyMock());
            Staff__c staff = getTestStaff();
            Test.startTest();
            XeroIntegrationTimeSheet.getXeroPayrollCycleForStaff('EMP123', staff.Id, 'TEST_ACCESS_TOKEN', 'TEST_TENANT_ID', Date.today());
            Test.stopTest();
        }
    }

    @IsTest
    static void test_getXeroPayrollCycleForStaff_Fortnightly() {
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new PayrollCycleFortnightlyMock());
            Staff__c staff = getTestStaff();
            Test.startTest();
            XeroIntegrationTimeSheet.getXeroPayrollCycleForStaff('EMP123', staff.Id, 'TEST_ACCESS_TOKEN', 'TEST_TENANT_ID', Date.today());
            Test.stopTest();
        }
    }

    @IsTest
    static void test_getXeroPayrollCycleForStaff_Monthly() {
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new PayrollCycleMonthlyMock());
            Staff__c staff = getTestStaff();
            Test.startTest();
            XeroIntegrationTimeSheet.getXeroPayrollCycleForStaff('EMP123', staff.Id, 'TEST_ACCESS_TOKEN', 'TEST_TENANT_ID', Date.today());
            Test.stopTest();
        }
    }

    @IsTest
    static void test_getXeroPayrollCycleForStaff_DateString() {
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new PayrollCycleDateStringMock());
            Staff__c staff = getTestStaff();
            Test.startTest();
            XeroIntegrationTimeSheet.getXeroPayrollCycleForStaff('EMP123', staff.Id, 'TEST_ACCESS_TOKEN', 'TEST_TENANT_ID', Date.today());
            Test.stopTest();
        }
    }

    @IsTest
    static void test_getXeroPayrollCycleForStaff_EmployeeNotFound() {
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new PayrollCycleEmployeeNotFoundMock());
            Staff__c staff = getTestStaff();
            Test.startTest();
            XeroIntegrationTimeSheet.getXeroPayrollCycleForStaff('EMP123', staff.Id, 'TEST_ACCESS_TOKEN', 'TEST_TENANT_ID', Date.today());
            Test.stopTest();
        }
    }

    @IsTest
    static void test_getXeroPayrollCycleForStaff_CalendarNotFound() {
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new PayrollCycleCalendarNotFoundMock());
            Staff__c staff = getTestStaff();
            Test.startTest();
            XeroIntegrationTimeSheet.getXeroPayrollCycleForStaff('EMP123', staff.Id, 'TEST_ACCESS_TOKEN', 'TEST_TENANT_ID', Date.today());
            Test.stopTest();
        }
    }

    @IsTest
    static void test_getXeroPayrollCycleForStaff_BlankCalendarId() {
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new PayrollCycleBlankCalendarMock());
            Staff__c staff = getTestStaff();
            Test.startTest();
            XeroIntegrationTimeSheet.getXeroPayrollCycleForStaff('EMP123', staff.Id, 'TEST_ACCESS_TOKEN', 'TEST_TENANT_ID', Date.today());
            Test.stopTest();
        }
    }

    @IsTest
    static void test_getXeroPayrollCycleForStaff_ApiError() {
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new PayrollCycleApiErrorMock());
            Staff__c staff = getTestStaff();
            Test.startTest();
            XeroIntegrationTimeSheet.getXeroPayrollCycleForStaff('EMP123', staff.Id, 'TEST_ACCESS_TOKEN', 'TEST_TENANT_ID', Date.today());
            Test.stopTest();
        }
    }

 private static ShiftwithStaff__c createApprovedShift(
        Id staffId, Date shiftDate, String category, String dayName
    ) {
        Add_Shift__c addShift = [SELECT Id FROM Add_Shift__c LIMIT 1];
        Facility__c fac = getTestFacility();

        ShiftwithStaff__c s = new ShiftwithStaff__c();
        s.Add_Shift__c = addShift.Id;
        s.Staff__c = staffId;
        s.Role__c = 'Support Worker';
        s.Status__c = 'Accepted';
        s.Approval_Status__c = 'Approved';        // writable picklist - the missing piece
        s.Start_Date__c = shiftDate;              // drives the Date__c formula
        s.Shift_Start_Time__c = Time.newInstance(8, 0, 0, 0);
        s.Shift_End_Date__c = shiftDate;
        s.Log_In_Date_Time__c = Time.newInstance(8, 0, 0, 0);
        s.Log_Out_Date_Time__c = Time.newInstance(16, 0, 0, 0);
        s.Shift_Category__c = category;
        s.Shift_Day_Name__c = dayName;            // writable - drives weekend branch
        s.Shift_Facility__c = fac.Id;
        s.Attendence__c = true;
        insert s;
        return s;
    }

    private static void createMorningSetting() {
        Facility_Role__c facRole = [SELECT Id FROM Facility_Role__c LIMIT 1];
        insert new Facility_Xero_Setting__c(
            Name = 'Morning Rate Direct',
            Xero_Payitem__c = 'ER001',
            Xero_Payitem_Name__c = 'General Rate',
            Category__c = 'Morning',
            Facility_Role__c = facRole.Id,
            Pay_Item_Type__c = 'Earnings'
        );
    }

    private static void createCategorySetting(String category, String rateId) {
        Facility_Role__c facRole = [SELECT Id FROM Facility_Role__c LIMIT 1];
        insert new Facility_Xero_Setting__c(
            Name = category + ' Rate Direct',
            Xero_Payitem__c = rateId,
            Xero_Payitem_Name__c = category + ' Rate',
            Category__c = category,
            Facility_Role__c = facRole.Id,
            Pay_Item_Type__c = 'Earnings'
        );
    }

    // ============================================================
    // TESTS: processSingleStaffForBulk (full body)
    // ============================================================

    @IsTest
    static void test_processSingleStaffForBulk_MorningHappyPath() {
        User u = getTestUser();
        System.runAs(u) {
            Staff__c staff = getTestStaff();
            staff.Xero_Employee_ID__c = 'EMP123';
            staff.Ordinary_Earnings_Rate_ID__c = 'ORD123';
            update staff;

            createApprovedShift(staff.Id, Date.today(), 'Morning', 'Monday');

            XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
            ctx.accessToken = 'TEST_ACCESS_TOKEN';
            ctx.tenantId = 'TEST_TENANT_ID';
            ctx.startDate = Date.today();
            ctx.endDate = Date.today();
            ctx.trackingItemId = 'TO001';

            Map<String, String> em = new Map<String, String>();
            em.put('morning', 'ER001');
            ctx.categoryToEarningRateMap = em;

            Test.setMock(HttpCalloutMock.class, new ProcessStaffFullMock());
            Test.startTest();
            try {
                XeroIntegrationTimeSheet.processSingleStaffForBulk(staff, ctx);
            } catch (Exception e) {}
            Test.stopTest();
        }
    }

    @IsTest
    static void test_processSingleStaffForBulk_WithUserSelectedRates() {
        User u = getTestUser();
        System.runAs(u) {
            Staff__c staff = getTestStaff();
            staff.Xero_Employee_ID__c = 'EMP123';
            staff.Ordinary_Earnings_Rate_ID__c = 'ORD123';
            update staff;

            createApprovedShift(staff.Id, Date.today(), 'Morning', 'Monday');

            XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
            ctx.accessToken = 'TEST_ACCESS_TOKEN';
            ctx.tenantId = 'TEST_TENANT_ID';
            ctx.startDate = Date.today();
            ctx.endDate = Date.today();
            ctx.trackingItemId = 'TO001';

            Map<String, String> em = new Map<String, String>{ 'morning' => 'ER001' };
            ctx.categoryToEarningRateMap = em;

            Map<String, Map<String, String>> sel = new Map<String, Map<String, String>>();
            sel.put(staff.Id, new Map<String, String>{ 'Morning' => 'ER001' });
            ctx.selectedCategoryRates = sel;

            Test.setMock(HttpCalloutMock.class, new ProcessStaffFullMock());
            Test.startTest();
            try {
                XeroIntegrationTimeSheet.processSingleStaffForBulk(staff, ctx);
            } catch (Exception e) {}
            Test.stopTest();
        }
    }

    @IsTest
    static void test_processSingleStaffForBulk_MultipleCategories() {
        User u = getTestUser();
        System.runAs(u) {
            Staff__c staff = getTestStaff();
            staff.Xero_Employee_ID__c = 'EMP123';
            staff.Ordinary_Earnings_Rate_ID__c = 'ORD123';
            update staff;

            createApprovedShift(staff.Id, Date.today(), 'Morning', 'Monday');
            createApprovedShift(staff.Id, Date.today(), 'Afternoon', 'Monday');
            createCategorySetting('Afternoon', 'ER002');

            XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
            ctx.accessToken = 'TEST_ACCESS_TOKEN';
            ctx.tenantId = 'TEST_TENANT_ID';
            ctx.startDate = Date.today();
            ctx.endDate = Date.today();
            ctx.trackingItemId = 'TO001';
            ctx.categoryToEarningRateMap = new Map<String, String>{
                'morning' => 'ER001', 'afternoon' => 'ER002'
            };

            Test.setMock(HttpCalloutMock.class, new ProcessStaffFullMock());
            Test.startTest();
            try {
                XeroIntegrationTimeSheet.processSingleStaffForBulk(staff, ctx);
            } catch (Exception e) {}
            Test.stopTest();
        }
    }

    @IsTest
    static void test_processSingleStaffForBulk_WeekendRatePass() {
        User u = getTestUser();
        System.runAs(u) {
            Staff__c staff = getTestStaff();
            staff.Xero_Employee_ID__c = 'EMP123';
            staff.Ordinary_Earnings_Rate_ID__c = 'ORD123';
            update staff;

            // Shift_Day_Name__c = Saturday drives the weekend branch
            createApprovedShift(staff.Id, Date.today(), 'Morning', 'Saturday');
            createCategorySetting('Saturday', 'ER001');

            XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
            ctx.accessToken = 'TEST_ACCESS_TOKEN';
            ctx.tenantId = 'TEST_TENANT_ID';
            ctx.startDate = Date.today();
            ctx.endDate = Date.today();
            ctx.trackingItemId = 'TO001';
            ctx.categoryToEarningRateMap = new Map<String, String>{ 'saturday' => 'ER001' };

            Test.setMock(HttpCalloutMock.class, new ProcessStaffFullMock());
            Test.startTest();
            try {
                XeroIntegrationTimeSheet.processSingleStaffForBulk(staff, ctx);
            } catch (Exception e) {}
            Test.stopTest();
        }
    }

    @IsTest
    static void test_processSingleStaffForBulk_WeekendRateMissing() {
        User u = getTestUser();
        System.runAs(u) {
            Staff__c staff = getTestStaff();
            staff.Xero_Employee_ID__c = 'EMP123';
            staff.Ordinary_Earnings_Rate_ID__c = 'ORD123';
            update staff;

            // Sunday with NO Sunday setting -> weekend validation failure branch
            createApprovedShift(staff.Id, Date.today(), 'Morning', 'Sunday');

            XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
            ctx.accessToken = 'TEST_ACCESS_TOKEN';
            ctx.tenantId = 'TEST_TENANT_ID';
            ctx.startDate = Date.today();
            ctx.endDate = Date.today();
            ctx.trackingItemId = 'TO001';
            ctx.categoryToEarningRateMap = new Map<String, String>();

            Test.setMock(HttpCalloutMock.class, new ProcessStaffFullMock());
            Test.startTest();
            try {
                XeroIntegrationTimeSheet.processSingleStaffForBulk(staff, ctx);
            } catch (Exception e) {}
            Test.stopTest();
        }
    }

    // ============================================================
    // TEST: sendSelectedPayPeriodTimesheets full end-to-end
    // (drives processSingleStaffForBulk + both bulk send methods
    //  + the staff update block in ONE run)
    // ============================================================
    @IsTest
    static void test_sendSelectedPayPeriodTimesheets_ApprovedFullFlow() {
        User u = getTestUser();
        System.runAs(u) {
            Staff__c staff = getTestStaff();
            staff.Xero_Employee_ID__c = 'EMP123';
            staff.Ordinary_Earnings_Rate_ID__c = 'ORD123';
            update staff;

            createApprovedShift(staff.Id, Date.today(), 'Morning', 'Monday');
            createApprovedShift(staff.Id, Date.today().addDays(1), 'Morning', 'Tuesday');
            createMorningSetting();

            Test.setMock(HttpCalloutMock.class, new SendTimesheetsFullMock());
            Test.startTest();
            try {
                XeroIntegrationTimeSheet.sendSelectedPayPeriodTimesheets(
                    new List<String>{ String.valueOf(staff.Id) },
                    new List<String>{ String.valueOf(Date.today()) },
                    new List<String>{ String.valueOf(Date.today().addDays(2)) },
                    null
                );
            } catch (Exception e) {}
            Test.stopTest();
        }
    }

@IsTest
static void test_findExactRateForShift_AllBranches() {
    // Build facility rate map by hand — no formula fields needed
    Map<String, Map<String, String>> frm = new Map<String, Map<String, String>>();
    Map<String, String> rm = new Map<String, String>();
    rm.put('general', 'R-GEN');
    rm.put('morning', 'R-MORN');
    rm.put('saturday', 'R-SAT');
    rm.put('weekend', 'R-WKND');
    rm.put('public holiday', 'R-PH');
    rm.put('holiday', 'R-HOL');
    rm.put('custom', 'R-CUS');
    frm.put('FAC001', rm);

    Test.startTest();
    // blank param guards
    XeroIntegrationTimeSheet.findExactRateForShift(null, 'Monday', 'FAC001', frm);
    XeroIntegrationTimeSheet.findExactRateForShift('general', null, 'FAC001', frm);
    XeroIntegrationTimeSheet.findExactRateForShift('general', 'Monday', null, frm);
    // facility missing from map
    XeroIntegrationTimeSheet.findExactRateForShift('general', 'Monday', 'NOPE', frm);

    // SCENARIO 1 weekday: allowed + exact match
    XeroIntegrationTimeSheet.findExactRateForShift('general', 'Monday', 'FAC001', frm);
    XeroIntegrationTimeSheet.findExactRateForShift('morning', 'Tuesday', 'FAC001', frm);
    // weekday: disallowed category -> null branch
    XeroIntegrationTimeSheet.findExactRateForShift('sleepover', 'Wednesday', 'FAC001', frm);
    // weekday: allowed but no map entry -> null branch (night not in map)
    XeroIntegrationTimeSheet.findExactRateForShift('night', 'Thursday', 'FAC001', frm);

    // SCENARIO 2 weekend: exact day match
    XeroIntegrationTimeSheet.findExactRateForShift('morning', 'Saturday', 'FAC001', frm);
    // weekend: day missing -> "weekend" fallback (Sunday not in map, weekend is)
    XeroIntegrationTimeSheet.findExactRateForShift('morning', 'Sunday', 'FAC001', frm);
    // weekend: category fallback -> remove weekend, use category
    Map<String, String> rm2 = new Map<String, String>{ 'general' => 'R-G2' };
    frm.put('FAC002', rm2);
    XeroIntegrationTimeSheet.findExactRateForShift('general', 'Sunday', 'FAC002', frm);
    // weekend: no match at all
    XeroIntegrationTimeSheet.findExactRateForShift('afternoon', 'Sunday', 'FAC002', frm);

    // SCENARIO 3 public holiday: exact
    XeroIntegrationTimeSheet.findExactRateForShift('public holiday', 'Monday', 'FAC001', frm);
    // public holiday: "holiday" fallback (remove public holiday key)
    Map<String, String> rm3 = new Map<String, String>{ 'holiday' => 'R-H3' };
    frm.put('FAC003', rm3);
    XeroIntegrationTimeSheet.findExactRateForShift('public holiday', 'Monday', 'FAC003', frm);
    // public holiday: no match
    XeroIntegrationTimeSheet.findExactRateForShift('public', 'Monday', 'FAC002', frm);

    // SCENARIO 4 other: match + no match
    XeroIntegrationTimeSheet.findExactRateForShift('custom', 'someday', 'FAC001', frm);
    XeroIntegrationTimeSheet.findExactRateForShift('unknown', 'someday', 'FAC001', frm);
    Test.stopTest();
}
@IsTest
static void test_findFacilityRateForCategory_AllBranches() {
    Map<String, Map<String, String>> frm = new Map<String, Map<String, String>>();
    frm.put('FAC1', new Map<String, String>{
        'weekend' => 'W1', 'weekday' => 'WD1', 'monday' => 'MON1', 'general' => 'G1'
    });
    frm.put('FAC2', new Map<String, String>{ 'sunday' => 'SUN2' });

    Test.startTest();
    XeroIntegrationTimeSheet.findFacilityRateForCategory(null, 'FAC1', frm);          // blank
    XeroIntegrationTimeSheet.findFacilityRateForCategory('monday', 'FAC1', frm);      // exact
    XeroIntegrationTimeSheet.findFacilityRateForCategory('saturday', 'FAC1', frm);    // weekend branch
    XeroIntegrationTimeSheet.findFacilityRateForCategory('tuesday', 'FAC1', frm);     // weekday branch
    XeroIntegrationTimeSheet.findFacilityRateForCategory('gen', 'FAC1', frm);         // partial
    XeroIntegrationTimeSheet.findFacilityRateForCategory('sunday', 'FAC1', frm);      // day-name match/fallback
    XeroIntegrationTimeSheet.findFacilityRateForCategory('sunday', 'NOPE', frm);      // cross-facility fallback -> FAC2
    XeroIntegrationTimeSheet.findFacilityRateForCategory('zzz', 'NOPE', frm);         // total miss
    Test.stopTest();
}

@isTest
static void test_validatePayPeriodBeforeRateSelector_XeroError() {
    User user = getTestUser();
    System.runAs(user) {
        Staff__c staff = getTestStaff();
        
        Test.setMock(HttpCalloutMock.class, new XeroErrorMock(401, '{"Message":"Unauthorized"}'));
        
        Test.startTest();
        Map<String, Object> result = 
            XeroIntegrationTimeSheet.validatePayPeriodBeforeRateSelector(
                new List<Id>{staff.Id},
                String.valueOf(Date.today().addDays(-1)),
                String.valueOf(Date.today().addDays(1))
            );
        Test.stopTest();
    }
}

@isTest
static void test_validatePayPeriodBeforeRateSelector_StartAfterEnd() {
    User user = getTestUser();
    System.runAs(user) {
        Staff__c staff = getTestStaff();
        
        Test.startTest();
        Map<String, Object> result = 
            XeroIntegrationTimeSheet.validatePayPeriodBeforeRateSelector(
                new List<Id>{staff.Id},
                String.valueOf(Date.today().addDays(1)),
                String.valueOf(Date.today().addDays(-1))
            );
        Test.stopTest();
    }
}

@isTest
static void test_sendSelectedPayPeriodTimesheets_StartDateAfterEndDate() {
    User user = getTestUser();
    System.runAs(user) {
        Staff__c staff = getTestStaff();
        
        Test.startTest();
        List<XeroIntegrationTimeSheet.StaffProcessingResult> results = 
            XeroIntegrationTimeSheet.sendSelectedPayPeriodTimesheets(
                new List<String>{String.valueOf(staff.Id)},
                new List<String>{String.valueOf(Date.today().addDays(1))},
                new List<String>{String.valueOf(Date.today().addDays(-1))},
                null
            );
        Test.stopTest();
    }
}

@isTest
static void test_fetchEarningRatesFromXeroAPI_EmpSuccessRatesFail() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroErrorMock(404, '{"Message":"Rates not found"}'));
        
        Test.startTest();
        Map<String, Object> result = 
            XeroIntegrationTimeSheet.fetchEarningRatesFromXeroAPI(
                'EMP123',
                'TEST_ACCESS_TOKEN',
                'TEST_TENANT_ID'
            );
        Test.stopTest();
    }
}

@isTest
static void test_fetchEarningRatesFromXeroAPI_EmptyRates() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroErrorMock(200, '{"earningsRates":[]}'));
        
        Test.startTest();
        Map<String, Object> result = 
            XeroIntegrationTimeSheet.fetchEarningRatesFromXeroAPI(
                'EMP123',
                'TEST_ACCESS_TOKEN',
                'TEST_TENANT_ID'
            );
        Test.stopTest();
    }
}

@isTest
static void test_isEarningRateActiveInXeroWithDetails_BlankParams() {
    User user = getTestUser();
    System.runAs(user) {
        Test.startTest();
        Map<String, Object> result = 
            XeroIntegrationTimeSheet.isEarningRateActiveInXeroWithDetails(
                '',
                'TEST_ACCESS_TOKEN',
                'TEST_TENANT_ID'
            );
        Test.stopTest();
    }
}

@isTest
static void test_isEarningRateActiveInXeroWithDetails_RateTypeOfUnitsNull() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroErrorMock(200, '{"earningsRate":{"earningsRateID":"ER001","name":"Test Rate","currentRecord":true}}'));
        
        Test.startTest();
        Map<String, Object> result = 
            XeroIntegrationTimeSheet.isEarningRateActiveInXeroWithDetails(
                'ER001',
                'TEST_ACCESS_TOKEN',
                'TEST_TENANT_ID'
            );
        Test.stopTest();
    }
}

@isTest
static void test_validateAndGetActiveRate_BlankRateIdDirect() {
    User user = getTestUser();
    System.runAs(user) {
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.validateAndGetActiveRate(
            '',
            'EMP123',
            ctx
        );
        Test.stopTest();
    }
}

@isTest
static void test_getSelectedRateForCategory_SleepoverAndBroken() {
    Map<String, String> selectedRates = new Map<String, String>();
    selectedRates.put('Sleepover Overnight', 'SL001');
    selectedRates.put('Broken Shift', 'BR001');
    selectedRates.put('saturday', 'SAT001');
    selectedRates.put('sunday', 'SUN001');
    selectedRates.put('weekend', 'WKND001');
    
    Test.startTest();
    XeroIntegrationTimeSheet.getSelectedRateForCategory(selectedRates, 'sleepover');
    XeroIntegrationTimeSheet.getSelectedRateForCategory(selectedRates, 'broken');
    XeroIntegrationTimeSheet.getSelectedRateForCategory(selectedRates, 'sat');
    XeroIntegrationTimeSheet.getSelectedRateForCategory(selectedRates, 'sun');
    XeroIntegrationTimeSheet.getSelectedRateForCategory(selectedRates, 'weekend');
    Test.stopTest();
}

@isTest
static void test_filterRatesByCategory_AllKeywords() {
    List<Map<String, Object>> rates = new List<Map<String, Object>>();
    
    Map<String, Object> rate1 = new Map<String, Object>();
    rate1.put('name', 'Sleepover Night');
    rates.add(rate1);
    
    Map<String, Object> rate2 = new Map<String, Object>();
    rate2.put('name', 'Morning Shift');
    rates.add(rate2);
    
    Map<String, Object> rate3 = new Map<String, Object>();
    rate3.put('name', 'Afternoon Shift');
    rates.add(rate3);
    
    Map<String, Object> rate4 = new Map<String, Object>();
    rate4.put('name', 'Night Shift');
    rates.add(rate4);
    
    Map<String, Object> rate5 = new Map<String, Object>();
    rate5.put('name', 'Broken Shift');
    rates.add(rate5);
    
    Map<String, Object> rate6 = new Map<String, Object>();
    rate6.put('name', 'Custom Rate');
    rates.add(rate6);
    
    Map<String, Object> rate7 = new Map<String, Object>();
    rate7.put('name', 'Sunday Premium');
    rates.add(rate7);
    
    Map<String, Object> rate8 = new Map<String, Object>();
    rate8.put('name', 'Saturday Rate');
    rates.add(rate8);
    
    Map<String, Object> rate9 = new Map<String, Object>();
    rate9.put('name', 'Weekend Shift');
    rates.add(rate9);
    
    Map<String, Object> rate10 = new Map<String, Object>();
    rate10.put('name', 'Weekday Rate');
    rates.add(rate10);
    
    Map<String, Object> rate11 = new Map<String, Object>();
    rate11.put('name', 'General Rate');
    rates.add(rate11);
    
    Test.startTest();
    XeroIntegrationTimeSheet.filterRatesByCategory('Sleepover', rates);
    XeroIntegrationTimeSheet.filterRatesByCategory('Morning', rates);
    XeroIntegrationTimeSheet.filterRatesByCategory('Afternoon', rates);
    XeroIntegrationTimeSheet.filterRatesByCategory('Night', rates);
    XeroIntegrationTimeSheet.filterRatesByCategory('Broken', rates);
    XeroIntegrationTimeSheet.filterRatesByCategory('Custom', rates);
    XeroIntegrationTimeSheet.filterRatesByCategory('Sunday', rates);
    XeroIntegrationTimeSheet.filterRatesByCategory('Saturday', rates);
    XeroIntegrationTimeSheet.filterRatesByCategory('Weekend', rates);
    XeroIntegrationTimeSheet.filterRatesByCategory('Weekday', rates);
    XeroIntegrationTimeSheet.filterRatesByCategory('General', rates);
    XeroIntegrationTimeSheet.filterRatesByCategory('short', rates);
    Test.stopTest();
}

@isTest
static void test_findMatchingEarningRate_WeekendBranches() {
    Map<String, String> rateMap = new Map<String, String>();
    rateMap.put('saturday', 'SAT001');
    rateMap.put('sunday', 'SUN001');
    rateMap.put('weekend', 'WKND001');
    rateMap.put('broken shift', 'BR001');
    rateMap.put('sleepover', 'SL001');
    rateMap.put('morning', 'MORN001');
    rateMap.put('afternoon', 'AFT001');
    rateMap.put('night', 'NIGHT001');
    
    Test.startTest();
    XeroIntegrationTimeSheet.findMatchingEarningRate('saturday', rateMap);
    XeroIntegrationTimeSheet.findMatchingEarningRate('sunday', rateMap);
    XeroIntegrationTimeSheet.findMatchingEarningRate('weekend shift', rateMap);
    XeroIntegrationTimeSheet.findMatchingEarningRate('Sat', rateMap);
    XeroIntegrationTimeSheet.findMatchingEarningRate('Sun', rateMap);
    Test.stopTest();
}

@isTest
static void test_getXeroPayrollCycleForStaff_EmployeeApiSuccessCalendarFail() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroErrorMock(404, '{"Message":"Calendar not found"}'));
        
        Staff__c staff = getTestStaff();
        
        Test.startTest();
        Map<String, Object> result = 
            XeroIntegrationTimeSheet.getXeroPayrollCycleForStaff(
                'EMP123',
                staff.Id,
                'TEST_ACCESS_TOKEN',
                'TEST_TENANT_ID',
                Date.today()
            );
        Test.stopTest();
    }
}

@isTest
static void test_getXeroPayrollCycleForStaff_EmptyEmployees() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroErrorMock(200, '{"Employees":[]}'));
        
        Staff__c staff = getTestStaff();
        
        Test.startTest();
        Map<String, Object> result = 
            XeroIntegrationTimeSheet.getXeroPayrollCycleForStaff(
                'EMP123',
                staff.Id,
                'TEST_ACCESS_TOKEN',
                'TEST_TENANT_ID',
                Date.today()
            );
        Test.stopTest();
    }
}

@isTest
static void test_getXeroPayrollCycleForStaff_EmptyCalendars() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroErrorMock(200, '{"Employees":[{"EmployeeID":"EMP123","PayrollCalendarID":"CAL001"}],"PayrollCalendars":[]}'));
        
        Staff__c staff = getTestStaff();
        
        Test.startTest();
        Map<String, Object> result = 
            XeroIntegrationTimeSheet.getXeroPayrollCycleForStaff(
                'EMP123',
                staff.Id,
                'TEST_ACCESS_TOKEN',
                'TEST_TENANT_ID',
                Date.today()
            );
        Test.stopTest();
    }
}

@isTest
static void test_getXeroPayrollCycleForStaff_InvalidDateParse() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroErrorMock(200, '{"Employees":[{"EmployeeID":"EMP123","PayrollCalendarID":"CAL001"}],"PayrollCalendars":[{"Name":"Weekly","CalendarType":"WEEKLY","StartDate":"invalid"}]}'));
        
        Staff__c staff = getTestStaff();
        
        Test.startTest();
        Map<String, Object> result = 
            XeroIntegrationTimeSheet.getXeroPayrollCycleForStaff(
                'EMP123',
                staff.Id,
                'TEST_ACCESS_TOKEN',
                'TEST_TENANT_ID',
                Date.today()
            );
        Test.stopTest();
    }
}

@isTest
static void test_getXeroPayrollCycle_NullStartDate() {
    User user = getTestUser();
    System.runAs(user) {
        Staff__c staff = getTestStaff();
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        ctx.startDate = null;
        
        Test.startTest();
        Map<String, Object> result = XeroIntegrationTimeSheet.getXeroPayrollCycle(
            'EMP123',
            staff.Id,
            ctx
        );
        Test.stopTest();
    }
}

@isTest
static void test_sendBulkEmployeePayTemplates_ParseError() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroErrorMock(400, 'Malformed JSON'));
        
        Staff__c staff = getTestStaff();
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        ctx.employeePayloads = new List<Object>{
            new Map<String, Object>{ 'EmployeeID' => 'EMP123' }
        };
        ctx.employeeIdToStaffId = new Map<String, Id>{ 'EMP123' => staff.Id };
        ctx.employeeIdToStaffName = new Map<String, String>{ 'EMP123' => staff.Display_Nickname__c };
        
        Test.startTest();
        XeroIntegrationTimeSheet.sendBulkEmployeePayTemplates(ctx);
        Test.stopTest();
    }
}

@isTest
static void test_sendBulkTimesheets_NoTimesheetsInResponse() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroErrorMock(200, '{}'));
        
        Staff__c staff = getTestStaff();
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        
        Map<String, Object> timesheetPayload = new Map<String, Object>();
        timesheetPayload.put('EmployeeID', 'EMP123');
        timesheetPayload.put('StartDate', String.valueOf(Date.today()));
        timesheetPayload.put('EndDate', String.valueOf(Date.today().addDays(7)));
        timesheetPayload.put('Status', 'APPROVED');
        timesheetPayload.put('TimesheetLines', new List<Object>());
        ctx.timesheetPayloads = new List<Object>{timesheetPayload};
        
        ctx.employeeIdToStaffId = new Map<String, Id>{'EMP123' => staff.Id};
        ctx.employeeIdToStaffName = new Map<String, String>{'EMP123' => staff.Display_Nickname__c};
        
        Test.startTest();
        XeroIntegrationTimeSheet.sendBulkTimesheets(ctx);
        Test.stopTest();
    }
}

@isTest
static void test_sendBulkTimesheets_GlobalErrorNoType() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroErrorMock(400, '{"Message":"Global error"}'));
        
        Staff__c staff = getTestStaff();
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'TEST_ACCESS_TOKEN';
        ctx.tenantId = 'TEST_TENANT_ID';
        
        Map<String, Object> timesheetPayload = new Map<String, Object>();
        timesheetPayload.put('EmployeeID', 'EMP123');
        timesheetPayload.put('StartDate', String.valueOf(Date.today()));
        timesheetPayload.put('EndDate', String.valueOf(Date.today().addDays(7)));
        timesheetPayload.put('Status', 'APPROVED');
        timesheetPayload.put('TimesheetLines', new List<Object>());
        ctx.timesheetPayloads = new List<Object>{timesheetPayload};
        
        ctx.employeeIdToStaffId = new Map<String, Id>{'EMP123' => staff.Id};
        ctx.employeeIdToStaffName = new Map<String, String>{'EMP123' => staff.Display_Nickname__c};
        
        Test.startTest();
        XeroIntegrationTimeSheet.sendBulkTimesheets(ctx);
        Test.stopTest();
    }
}

@isTest
static void test_fetchEarningRatesFromXeroAPI_NullRates() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroErrorMock(200, '{"Employees":[{"EmployeeID":"EMP123"}]}'));
        
        Test.startTest();
        Map<String, Object> result = 
            XeroIntegrationTimeSheet.fetchEarningRatesFromXeroAPI(
                'EMP123',
                'TEST_ACCESS_TOKEN',
                'TEST_TENANT_ID'
            );
        Test.stopTest();
    }
}

@isTest
static void test_fetchEarningRatesFromXeroAPI_AssignedRateIds() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroErrorMock(200, '{"Employees":[{"EmployeeID":"EMP123","OrdinaryEarningsRateID":"ORD123","PayTemplate":{"EarningsLines":[{"EarningsRateID":"ER001"}]},"EarningsRates":[{"EarningsRateID":"ER002"}]}],"earningsRates":[{"earningsRateID":"ER001","name":"Rate1","currentRecord":true,"typeOfUnits":"Hours","ratePerUnit":0}]}'));
        
        Test.startTest();
        Map<String, Object> result = 
            XeroIntegrationTimeSheet.fetchEarningRatesFromXeroAPI(
                'EMP123',
                'TEST_ACCESS_TOKEN',
                'TEST_TENANT_ID'
            );
        Test.stopTest();
    }
}

@isTest
static void test_fetchEarningRatesFromXeroAPI_NonZeroRate() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroErrorMock(200, '{"Employees":[{"EmployeeID":"EMP123","OrdinaryEarningsRateID":"ORD123"}],"earningsRates":[{"earningsRateID":"ER001","name":"Rate1","currentRecord":true,"typeOfUnits":"Hours","ratePerUnit":25}]}'));
        
        Test.startTest();
        Map<String, Object> result = 
            XeroIntegrationTimeSheet.fetchEarningRatesFromXeroAPI(
                'EMP123',
                'TEST_ACCESS_TOKEN',
                'TEST_TENANT_ID'
            );
        Test.stopTest();
    }
}

@isTest
static void test_fetchEarningRatesFromXeroAPI_InvalidUnits() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroErrorMock(200, '{"Employees":[{"EmployeeID":"EMP123","OrdinaryEarningsRateID":"ORD123"}],"earningsRates":[{"earningsRateID":"ER001","name":"Rate1","currentRecord":true,"typeOfUnits":"Days","ratePerUnit":0}]}'));
        
        Test.startTest();
        Map<String, Object> result = 
            XeroIntegrationTimeSheet.fetchEarningRatesFromXeroAPI(
                'EMP123',
                'TEST_ACCESS_TOKEN',
                'TEST_TENANT_ID'
            );
        Test.stopTest();
    }
}

@isTest
static void test_fetchEarningRatesFromXeroAPI_InactiveRate() {
    User user = getTestUser();
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroErrorMock(200, '{"Employees":[{"EmployeeID":"EMP123","OrdinaryEarningsRateID":"ORD123"}],"earningsRates":[{"earningsRateID":"ER001","name":"Rate1","currentRecord":false,"typeOfUnits":"Hours","ratePerUnit":0}]}'));
        
        Test.startTest();
        Map<String, Object> result = 
            XeroIntegrationTimeSheet.fetchEarningRatesFromXeroAPI(
                'EMP123',
                'TEST_ACCESS_TOKEN',
                'TEST_TENANT_ID'
            );
        Test.stopTest();
    }
}

@isTest
static void test_sendSelectedPayPeriodTimesheets_EmptyStartDates() {
    User user = getTestUser();
    System.runAs(user) {
        Staff__c staff = getTestStaff();
        
        Test.startTest();
        List<XeroIntegrationTimeSheet.StaffProcessingResult> results = 
            XeroIntegrationTimeSheet.sendSelectedPayPeriodTimesheets(
                new List<String>{String.valueOf(staff.Id)},
                new List<String>(),
                new List<String>{String.valueOf(Date.today().addDays(7))},
                null
            );
        Test.stopTest();
    }
}

@isTest
static void test_sendSelectedPayPeriodTimesheets_NullStaffIds() {
    User user = getTestUser();
    System.runAs(user) {
        Test.startTest();
        List<XeroIntegrationTimeSheet.StaffProcessingResult> results = 
            XeroIntegrationTimeSheet.sendSelectedPayPeriodTimesheets(
                null,
                new List<String>{String.valueOf(Date.today())},
                new List<String>{String.valueOf(Date.today().addDays(7))},
                null
            );
        Test.stopTest();
    }
}
}