@isTest
public class XeroIntegrationTimeSheetTest {
    
    // ============================================================
    // MOCK RESPONSE CLASSES
    // ============================================================
    
    private class XeroMockResponse implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setHeader('Content-Type', 'application/json');
            
            String endpoint = req.getEndpoint();
            
            if (endpoint.contains('Employees') && !endpoint.contains('Employees/')) {
                res.setBody('{"Employees":[{"EmployeeID":"EMP123","PayrollCalendarID":"CAL001"}]}');
            } else if (endpoint.contains('Employees/')) {
                res.setBody('{"Employees":[{"EmployeeID":"EMP123","PayrollCalendarID":"CAL001","OrdinaryEarningsRateID":"ORD123","PayTemplate":{"EarningsLines":[{"EarningsRateID":"ORD123","CalculationType":"ENTEREARNINGSRATE","RatePerUnit":25}]}}]}');
            } else if (endpoint.contains('Timesheets')) {
                res.setBody('{"Timesheets":[{"EmployeeID":"EMP123","TimesheetID":"TS001"}]}');
            } else if (endpoint.contains('EarningsRates')) {
                res.setBody('{"earningsRates":[' +
                    '{"earningsRateID":"ER001","name":"General","rateType":"ORDINARYEARNINGS","currentRecord":true,"typeOfUnits":"Hours","ratePerUnit":0},' +
                    '{"earningsRateID":"ER002","name":"Broken Rate","rateType":"ORDINARYEARNINGS","currentRecord":true,"typeOfUnits":"Hours","ratePerUnit":0},' +
                    '{"earningsRateID":"ER003","name":"Sleepover Overnight","rateType":"ORDINARYEARNINGS","currentRecord":true,"typeOfUnits":"Hours","ratePerUnit":0}' +
                ']}');
            } else if (endpoint.contains('TrackingCategories')) {
                res.setBody('{"TrackingCategories":[{"Name":"Department","TrackingCategoryID":"TC001","Status":"ACTIVE","Options":[{"Name":"Option1","TrackingOptionID":"TO001","Status":"ACTIVE"}]}]}');
            } else if (endpoint.contains('PayrollCalendars')) {
                res.setBody('{"PayrollCalendars":[{"Name":"Weekly","CalendarType":"WEEKLY","StartDate":"/Date(1716940800000+0000)/"}]}');
            } else {
                res.setBody('{"message":"Success"}');
            }
            
            return res;
        }
    }
    
    private class XeroErrorResponseMock implements HttpCalloutMock {
        private Integer statusCode;
        private String responseBody;
        
        public XeroErrorResponseMock(Integer statusCode, String responseBody) {
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
            res.setStatusCode(400);
            res.setHeader('Content-Type', 'application/json');
            
            String endpoint = req.getEndpoint();
            
            if (endpoint.contains('Employees') && !endpoint.contains('Employees/')) {
                res.setStatusCode(200);
                res.setBody('{"Employees":[{"EmployeeID":"EMP123","PayrollCalendarID":"CAL001"}]}');
            } else if (endpoint.contains('Employees/')) {
                res.setStatusCode(200);
                res.setBody('{"Employees":[{"EmployeeID":"EMP123","PayrollCalendarID":"CAL001","OrdinaryEarningsRateID":"ORD123","PayTemplate":{"EarningsLines":[{"EarningsRateID":"ORD123","CalculationType":"ENTEREARNINGSRATE","RatePerUnit":25}]}}]}');
            } else if (endpoint.contains('TrackingCategories')) {
                res.setStatusCode(200);
                res.setBody('{"TrackingCategories":[{"Name":"Department","TrackingCategoryID":"TC001","Status":"ACTIVE","Options":[{"Name":"Option1","TrackingOptionID":"TO001","Status":"ACTIVE"}]}]}');
            } else if (endpoint.contains('PayrollCalendars')) {
                res.setStatusCode(200);
                res.setBody('{"PayrollCalendars":[{"Name":"Weekly","CalendarType":"WEEKLY","StartDate":"/Date(1716940800000+0000)/"}]}');
            } else if (endpoint.contains('EarningsRates')) {
                res.setStatusCode(200);
                res.setBody('{"earningsRates":[]}');
            } else if (endpoint.contains('Timesheets')) {
                res.setStatusCode(400);
                res.setBody('{"Timesheets":[{"EmployeeID":"EMP123","ValidationErrors":[{"Message":"The period doesn\'t correspond to the employee\'s pay period"}]}]}');
            } else {
                res.setStatusCode(400);
                res.setBody('{"Message":"Error"}');
            }
            
            return res;
        }
    }
    
    // ============================================================
    // TEST SETUP
    // ============================================================
    
    @testSetup
    static void setupData() {
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
        
        Xero_Earning_Rate__c rate = new Xero_Earning_Rate__c(
            Name = 'Ordinary Hours',
            Earning_Rate_ID__c = 'O123',
            Organization__c = org.Id
        );
        insert rate;
        
        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        
        User user = new User(
            Alias = 'testusr',
            Email = 'manualtesting.209458@hotmail.com',
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
        
        System.runAs(user) {
            Facility__c fac = new Facility__c(
                Name = 'Ashfield Consultants',
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
            
            Staff__c staff = new Staff__c(
                Last_Name__c = 'Test Staff',
                Name = 'TestStaff',
                Name__c = 'TestStaff',
                Contact_Number__c = '56789908743',
                Email_Address__c = 'manualtesting.20932@hotmail.com',
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
            
            Xero_Earning_Rate__c er = new Xero_Earning_Rate__c(
                Name = 'General',
                Earning_Rate_ID__c = 'ER001',
                Organization__c = org.Id
            );
            insert er;
            
            // Create a dummy Add Shift record
            Add_Shift__c shift = new Add_Shift__c();
            shift.Break__c = '30';
            shift.Do_you_want_to_set_this_a_recurring_shif__c = true;
            shift.Start_Date__c = Date.today();
            shift.End_Date__c = Date.today();
            shift.Role__c = 'Support Worker';
            shift.Get_Facility__c = true;
            shift.Quantity__c = 5;
            shift.Start_Time__c = Time.newInstance(03, 30, 00, 00);
            shift.End_Time__c = Time.newInstance(05, 00, 00, 00);
            shift.Facility__c = fac.Id;
            shift.Status__c = 'Draft';
            shift.Start_time_picklist__c = '3:30 am';
            shift.End_time_picklist__c = '5:00 am';
            shift.Location__StateCode__s = 'ACT';
            shift.Location__CountryCode__s = 'AU';
            shift.Location__PostalCode__s = '2911';
            shift.Is_EOI__c = true;
            shift.EOI_staff__c = staff.Id;
            shift.Shift_Type__c = 'General';
            insert shift;
            
            // Create Shift with required fields
            ShiftwithStaff__c staffs = new ShiftwithStaff__c();
            staffs.Add_Shift__c = shift.Id;
            staffs.Attendence__c = true;
            staffs.Comments__c = 'test comments';
            staffs.Staff__c = staff.Id;
            staffs.Role__c = 'Support Worker';
            staffs.Status__c = 'Accepted';
            staffs.Log_In_Date_Time__c = Time.newInstance(01, 30, 00, 00);
            staffs.Log_Out_Date_Time__c = Time.newInstance(10, 00, 00, 00);
            staffs.Shift_Category__c = 'General';
            staffs.Approval_Status__c = 'Approved';
            insert staffs;
        }
    }
    
    // ============================================================
    // HELPER METHODS
    // ============================================================
    
    private static User getTestUser() {
        return [
            SELECT Id
            FROM User
            WHERE Organization_Name__c = 'Ashfield Consultants'
            LIMIT 1
        ];
    }
    
    private static Staff__c getTestStaff() {
        return [
            SELECT Id, Xero_Employee_ID__c, Ordinary_Earnings_Rate_ID__c, Display_Nickname__c
            FROM Staff__c
            WHERE Email_Address__c = 'manualtesting.20932@hotmail.com'
            LIMIT 1
        ];
    }
    
    // ============================================================
    // TESTS FOR insertBulkTimeSheetWithSelectedRates
    // ============================================================
    
    @IsTest
    static void test_insertBulkTimeSheetWithSelectedRates_Success() {
        User user = getTestUser();
        System.runAs(user) {
            Staff__c staff = getTestStaff();
            
            Map<Id, Map<String, String>> rateSelections = new Map<Id, Map<String, String>>();
            Map<String, String> staffRates = new Map<String, String>();
            staffRates.put('general', 'ER001');
            rateSelections.put(staff.Id, staffRates);
            
            Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
            
            Test.startTest();
            List<XeroIntegrationTimeSheet.XeroResult> results = 
                XeroIntegrationTimeSheet.insertBulkTimeSheetWithSelectedRates(
                    new List<Id>{staff.Id},
                    String.valueOf(Date.today().addDays(-1)),
                    String.valueOf(Date.today().addDays(1)),
                    rateSelections
                );
            Test.stopTest();
            
        }
    }
    
    @IsTest
    static void test_insertBulkTimeSheetWithSelectedRates_NoStaff() {
        User user = getTestUser();
        System.runAs(user) {
            Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
            
            Test.startTest();
            List<XeroIntegrationTimeSheet.XeroResult> results = 
                XeroIntegrationTimeSheet.insertBulkTimeSheetWithSelectedRates(
                    new List<Id>(),
                    String.valueOf(Date.today()),
                    String.valueOf(Date.today().addDays(1)),
                    new Map<Id, Map<String, String>>()
                );
            Test.stopTest();
            
        }
    }
    
    @IsTest
    static void test_insertBulkTimeSheetWithSelectedRates_MissingEmployeeId() {
        User user = getTestUser();
        System.runAs(user) {
            Staff__c staff = getTestStaff();
            staff.Xero_Employee_ID__c = null;
            update staff;
            
            Map<Id, Map<String, String>> rateSelections = new Map<Id, Map<String, String>>();
            Map<String, String> staffRates = new Map<String, String>();
            staffRates.put('general', 'ER001');
            rateSelections.put(staff.Id, staffRates);
            
            Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
            
            Test.startTest();
            List<XeroIntegrationTimeSheet.XeroResult> results = 
                XeroIntegrationTimeSheet.insertBulkTimeSheetWithSelectedRates(
                    new List<Id>{staff.Id},
                    String.valueOf(Date.today().addDays(-1)),
                    String.valueOf(Date.today().addDays(1)),
                    rateSelections
                );
            Test.stopTest();

        }
    }
    
    @IsTest
    static void test_insertBulkTimeSheetWithSelectedRates_NoShifts() {
        User user = getTestUser();
        System.runAs(user) {
            Staff__c staff = getTestStaff();
            
            // Use dates with no shifts
            Date startDate = Date.today().addDays(-10);
            Date endDate = Date.today().addDays(-8);
            
            Map<Id, Map<String, String>> rateSelections = new Map<Id, Map<String, String>>();
            Map<String, String> staffRates = new Map<String, String>();
            staffRates.put('general', 'ER001');
            rateSelections.put(staff.Id, staffRates);
            
            Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
            
            Test.startTest();
            List<XeroIntegrationTimeSheet.XeroResult> results = 
                XeroIntegrationTimeSheet.insertBulkTimeSheetWithSelectedRates(
                    new List<Id>{staff.Id},
                    String.valueOf(startDate),
                    String.valueOf(endDate),
                    rateSelections
                );
            Test.stopTest();
            

        }
    }
    
    @IsTest
    static void test_insertBulkTimeSheetWithSelectedRates_PayPeriodMismatch() {
        User user = getTestUser();
        System.runAs(user) {
            Staff__c staff = getTestStaff();
            
            Map<Id, Map<String, String>> rateSelections = new Map<Id, Map<String, String>>();
            Map<String, String> staffRates = new Map<String, String>();
            staffRates.put('general', 'ER001');
            rateSelections.put(staff.Id, staffRates);
            
            Test.setMock(HttpCalloutMock.class, new XeroPayPeriodErrorMock());
            
            Test.startTest();
            List<XeroIntegrationTimeSheet.XeroResult> results = 
                XeroIntegrationTimeSheet.insertBulkTimeSheetWithSelectedRates(
                    new List<Id>{staff.Id},
                    String.valueOf(Date.today().addDays(-1)),
                    String.valueOf(Date.today().addDays(1)),
                    rateSelections
                );
            Test.stopTest();

        }
    }
    
    // ============================================================
    // TESTS FOR getStaffEarningRatesForUI
    // ============================================================
    
    @IsTest
    static void test_getStaffEarningRatesForUI_Success() {
        User user = getTestUser();
        System.runAs(user) {
            Staff__c staff = getTestStaff();
            
            Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
            
            Test.startTest();
            Map<String, Object> result = 
                XeroIntegrationTimeSheet.getStaffEarningRatesForUI(
                    staff.Id,
                    String.valueOf(Date.today().addDays(-1)),
                    String.valueOf(Date.today().addDays(1))
                );
            Test.stopTest();

        }
    }
    
    @IsTest
    static void test_getStaffEarningRatesForUI_NoXeroEmployeeId() {
        User user = getTestUser();
        System.runAs(user) {
            Staff__c staff = getTestStaff();
            staff.Xero_Employee_ID__c = null;
            update staff;
            
            Test.startTest();
            Map<String, Object> result = 
                XeroIntegrationTimeSheet.getStaffEarningRatesForUI(
                    staff.Id,
                    String.valueOf(Date.today().addDays(-1)),
                    String.valueOf(Date.today().addDays(1))
                );
            Test.stopTest();

        }
    }
    
    @IsTest
    static void test_getStaffEarningRatesForUI_NoShifts() {
        User user = getTestUser();
        System.runAs(user) {
            Staff__c staff = getTestStaff();
            
            Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
            
            Date startDate = Date.today().addDays(-10);
            Date endDate = Date.today().addDays(-8);
            
            Test.startTest();
            Map<String, Object> result = 
                XeroIntegrationTimeSheet.getStaffEarningRatesForUI(
                    staff.Id,
                    String.valueOf(startDate),
                    String.valueOf(endDate)
                );
            Test.stopTest();

        }
    }
    
    // ============================================================
    // TESTS FOR sendSelectedPayPeriodTimesheets
    // ============================================================
    
    @IsTest
    static void test_sendSelectedPayPeriodTimesheets_Success() {
        User user = getTestUser();
        System.runAs(user) {
            Staff__c staff = getTestStaff();
            
            Map<Id, Map<String, String>> rateSelections = new Map<Id, Map<String, String>>();
            Map<String, String> staffRates = new Map<String, String>();
            staffRates.put('general', 'ER001');
            rateSelections.put(staff.Id, staffRates);
            
            Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
            
            Test.startTest();
            List<XeroIntegrationTimeSheet.StaffProcessingResult> results = 
                XeroIntegrationTimeSheet.sendSelectedPayPeriodTimesheets(
                    new List<String>{String.valueOf(staff.Id)},
                    new List<String>{String.valueOf(Date.today().addDays(-1))},
                    new List<String>{String.valueOf(Date.today().addDays(1))},
                    rateSelections
                );
            Test.stopTest();
            

        }
    }
    
    @IsTest
    static void test_sendSelectedPayPeriodTimesheets_EmptyPayload() {
        User user = getTestUser();
        System.runAs(user) {
            Test.startTest();
            List<XeroIntegrationTimeSheet.StaffProcessingResult> results = 
                XeroIntegrationTimeSheet.sendSelectedPayPeriodTimesheets(
                    new List<String>(),
                    new List<String>(),
                    new List<String>(),
                    new Map<Id, Map<String, String>>()
                );
            Test.stopTest();

        }
    }
    
    @IsTest
    static void test_sendSelectedPayPeriodTimesheets_SizeMismatch() {
        User user = getTestUser();
        System.runAs(user) {
            Staff__c staff = getTestStaff();
            
            Test.startTest();
            List<XeroIntegrationTimeSheet.StaffProcessingResult> results = 
                XeroIntegrationTimeSheet.sendSelectedPayPeriodTimesheets(
                    new List<String>{String.valueOf(staff.Id)},
                    new List<String>{String.valueOf(Date.today().addDays(-1))},
                    new List<String>(), // Empty - size mismatch
                    new Map<Id, Map<String, String>>()
                );
            Test.stopTest();

        }
    }
    
    // ============================================================
    // TESTS FOR HELPER METHODS
    // ============================================================
    
    @IsTest
    static void test_formatDateForDisplay() {
        Test.startTest();
        
        Date dt = Date.newInstance(2026, 8, 12);
        String result = XeroIntegrationTimeSheet.formatDateForDisplay(dt);
        
        Test.stopTest();
        
    }
    
    @IsTest
    static void test_formatDateForDisplay_Null() {
        Test.startTest();
        String result = XeroIntegrationTimeSheet.formatDateForDisplay(null);
        Test.stopTest();
        
    }
    
    @IsTest
    static void test_getDayName() {
        Test.startTest();
        Date dt = Date.newInstance(2026, 8, 12);
        String result = XeroIntegrationTimeSheet.getDayName(dt);
        Test.stopTest();
        
    }
    
    @IsTest
    static void test_parseXeroDate() {
        Test.startTest();
        Date result = XeroIntegrationTimeSheet.parseXeroDate('/Date(1716940800000+0000)/');
        Test.stopTest();
        

    }
    
    @IsTest
    static void test_parseXeroDate_Null() {
        Test.startTest();
        Date result = XeroIntegrationTimeSheet.parseXeroDate(null);
        Test.stopTest();
        

    }
    
    @IsTest
    static void test_parseXeroDate_Invalid() {
        Test.startTest();
        Date result = XeroIntegrationTimeSheet.parseXeroDate('invalid');
        Test.stopTest();

    }
    
    @IsTest
    static void test_findMatchingEarningRate() {
        Map<String, String> rateMap = new Map<String, String>();
        rateMap.put('general', 'GEN001');
        rateMap.put('broken rate', 'BR001');
        rateMap.put('sleepover overnight', 'SL001');
        rateMap.put('morning shift', 'MORN001');
        
        Test.startTest();
        
        String result1 = XeroIntegrationTimeSheet.findMatchingEarningRate('General', rateMap);
        String result2 = XeroIntegrationTimeSheet.findMatchingEarningRate('broken shift', rateMap);
        String result3 = XeroIntegrationTimeSheet.findMatchingEarningRate('sleepover', rateMap);
        String result4 = XeroIntegrationTimeSheet.findMatchingEarningRate('random', rateMap);
        String result5 = XeroIntegrationTimeSheet.findMatchingEarningRate('', rateMap);
        
        Test.stopTest();

        
    }
    
    @IsTest
    static void test_getSelectedRateForCategory() {
        Map<String, String> selectedRates = new Map<String, String>();
        selectedRates.put('General', 'GEN001');
        selectedRates.put('broken shift', 'BR001');
        selectedRates.put('Sleepover Overnight', 'SL001');
        
        Test.startTest();
        
        String result1 = XeroIntegrationTimeSheet.getSelectedRateForCategory(selectedRates, 'General');
        String result2 = XeroIntegrationTimeSheet.getSelectedRateForCategory(selectedRates, 'general');
        String result3 = XeroIntegrationTimeSheet.getSelectedRateForCategory(selectedRates, 'sleepover');
        String result4 = XeroIntegrationTimeSheet.getSelectedRateForCategory(selectedRates, 'random');
        String result5 = XeroIntegrationTimeSheet.getSelectedRateForCategory(null, 'General');
        
        Test.stopTest();
        
    }
    
    @IsTest
    static void test_filterRatesByCategory() {
        List<Map<String, Object>> rates = new List<Map<String, Object>>();
        
        Map<String, Object> rate1 = new Map<String, Object>();
        rate1.put('name', 'General Rate');
        rates.add(rate1);
        
        Map<String, Object> rate2 = new Map<String, Object>();
        rate2.put('name', 'Morning Shift');
        rates.add(rate2);
        
        Map<String, Object> rate3 = new Map<String, Object>();
        rate3.put('name', 'Night Shift');
        rates.add(rate3);
        
        Map<String, Object> rate4 = new Map<String, Object>();
        rate4.put('name', 'Sleepover Overnight');
        rates.add(rate4);
        
        Test.startTest();
        
        List<Map<String, Object>> result1 = XeroIntegrationTimeSheet.filterRatesByCategory('morning', rates);
        List<Map<String, Object>> result2 = XeroIntegrationTimeSheet.filterRatesByCategory('Sleepover', rates);
        List<Map<String, Object>> result3 = XeroIntegrationTimeSheet.filterRatesByCategory('', rates);
        List<Map<String, Object>> result4 = XeroIntegrationTimeSheet.filterRatesByCategory('random', rates);
        
        Test.stopTest();

    }
    
    // ============================================================
    // TESTS FOR getXeroPayrollCycle
    // ============================================================
    
    @IsTest
    static void test_getXeroPayrollCycle_Success() {
        User user = getTestUser();
        System.runAs(user) {
            Staff__c staff = getTestStaff();
            
            XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
            ctx.accessToken = 'dummy';
            ctx.tenantId = 'dummy';
            ctx.startDate = Date.today();
            
            Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
            
            Test.startTest();
            Map<String, Object> result = 
                XeroIntegrationTimeSheet.getXeroPayrollCycle(
                    'EMP123',
                    staff.Id,
                    ctx
                );
            Test.stopTest();
            

        }
    }
    
    @IsTest
    static void test_getXeroPayrollCycle_EmployeeNotFound() {
        User user = getTestUser();
        System.runAs(user) {
            XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
            ctx.accessToken = 'dummy';
            ctx.tenantId = 'dummy';
            ctx.startDate = Date.today();
            
            Test.setMock(HttpCalloutMock.class, new XeroErrorResponseMock(404, '{"Message":"Not Found"}'));
            
            Test.startTest();
            Map<String, Object> result = 
                XeroIntegrationTimeSheet.getXeroPayrollCycle(
                    'INVALID_EMP',
                    null,
                    ctx
                );
            Test.stopTest();

        }
    }
    
    // ============================================================
    // TESTS FOR getXeroPayrollCycleForStaff
    // ============================================================
    
    @IsTest
    static void test_getXeroPayrollCycleForStaff_Success() {
        User user = getTestUser();
        System.runAs(user) {
            Staff__c staff = getTestStaff();
            
            Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
            
            Test.startTest();
            Map<String, Object> result = 
                XeroIntegrationTimeSheet.getXeroPayrollCycleForStaff(
                    'EMP123',
                    staff.Id,
                    'dummy',
                    'dummy',
                    Date.today()
                );
            Test.stopTest();

        }
    }
    
    @IsTest
    static void test_getXeroPayrollCycleForStaff_EmployeeNotFound() {
        User user = getTestUser();
        System.runAs(user) {
            Test.setMock(HttpCalloutMock.class, new XeroErrorResponseMock(404, '{"Message":"Not Found"}'));
            
            Test.startTest();
            Map<String, Object> result = 
                XeroIntegrationTimeSheet.getXeroPayrollCycleForStaff(
                    'INVALID_EMP',
                    null,
                    'dummy',
                    'dummy',
                    Date.today()
                );
            Test.stopTest();

        }
    }
    
    // ============================================================
    // TESTS FOR sendBulkEmployeePayTemplates
    // ============================================================
    
    @IsTest
    static void test_sendBulkEmployeePayTemplates_NullContext() {
        Test.startTest();
        XeroIntegrationTimeSheet.sendBulkEmployeePayTemplates(null);
        Test.stopTest();
    }
    
    @IsTest
    static void test_sendBulkEmployeePayTemplates_EmptyPayloads() {
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'dummy';
        ctx.tenantId = 'dummy';
        ctx.employeePayloads = new List<Object>();
        
        Test.startTest();
        XeroIntegrationTimeSheet.sendBulkEmployeePayTemplates(ctx);
        Test.stopTest();
    }
    
    @IsTest
    static void test_sendBulkEmployeePayTemplates_Success() {
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'dummy';
        ctx.tenantId = 'dummy';
        
        Map<String, Object> payload = new Map<String, Object>();
        payload.put('EmployeeID', 'EMP123');
        ctx.employeePayloads = new List<Object>{payload};
        
        Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
        
        Test.startTest();
        XeroIntegrationTimeSheet.sendBulkEmployeePayTemplates(ctx);
        Test.stopTest();
    }
    
    // ============================================================
    // TESTS FOR sendBulkTimesheets
    // ============================================================
    
    @IsTest
    static void test_sendBulkTimesheets_NullContext() {
        Test.startTest();
        try {
            XeroIntegrationTimeSheet.sendBulkTimesheets(null);
        } catch (Exception e) {
            // Expected
        }
        Test.stopTest();
    }
    
    @IsTest
    static void test_sendBulkTimesheets_EmptyPayloads() {
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'dummy';
        ctx.tenantId = 'dummy';
        ctx.timesheetPayloads = new List<Object>();
        
        Test.startTest();
        XeroIntegrationTimeSheet.sendBulkTimesheets(ctx);
        Test.stopTest();
    }
    
    @IsTest
    static void test_sendBulkTimesheets_Success() {
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'dummy';
        ctx.tenantId = 'dummy';
        
        Map<String, Object> payload = new Map<String, Object>();
        payload.put('EmployeeID', 'EMP123');
        ctx.timesheetPayloads = new List<Object>{payload};
        
        ctx.employeeIdToStaffId = new Map<String, Id>();
        ctx.employeeIdToStaffId.put('EMP123', UserInfo.getUserId());
        ctx.employeeIdToStaffName = new Map<String, String>();
        ctx.employeeIdToStaffName.put('EMP123', 'Test Staff');
        ctx.results = new List<XeroIntegrationTimeSheet.StaffProcessingResult>();
        
        Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
        
        Test.startTest();
        XeroIntegrationTimeSheet.sendBulkTimesheets(ctx);
        Test.stopTest();

    }
    
    @IsTest
    static void test_sendBulkTimesheets_ErrorResponse() {
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'dummy';
        ctx.tenantId = 'dummy';
        
        Map<String, Object> payload = new Map<String, Object>();
        payload.put('EmployeeID', 'EMP123');
        ctx.timesheetPayloads = new List<Object>{payload};
        
        ctx.employeeIdToStaffId = new Map<String, Id>();
        ctx.employeeIdToStaffId.put('EMP123', UserInfo.getUserId());
        ctx.employeeIdToStaffName = new Map<String, String>();
        ctx.employeeIdToStaffName.put('EMP123', 'Test Staff');
        ctx.results = new List<XeroIntegrationTimeSheet.StaffProcessingResult>();
        
        Test.setMock(HttpCalloutMock.class, new XeroErrorResponseMock(400, '{"Timesheets":[{"EmployeeID":"EMP123","ValidationErrors":[{"Message":"Error"}]}]}'));
        
        Test.startTest();
        XeroIntegrationTimeSheet.sendBulkTimesheets(ctx);
        Test.stopTest();

    }
    
    // ============================================================
    // TESTS FOR fetchTrackingItemIdFromXero
    // ============================================================
    
    @IsTest
    static void test_fetchTrackingItemIdFromXero_Success() {
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'dummy';
        ctx.tenantId = 'dummy';
        
        Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.fetchTrackingItemIdFromXero(ctx);
        Test.stopTest();
        

    }
    
    @IsTest
    static void test_fetchTrackingItemIdFromXero_NoCategories() {
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'dummy';
        ctx.tenantId = 'dummy';
        
        Test.setMock(HttpCalloutMock.class, new XeroErrorResponseMock(200, '{"TrackingCategories":[]}'));
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.fetchTrackingItemIdFromXero(ctx);
        Test.stopTest();
        

    }
    
    // ============================================================
    // TESTS FOR fetchEarningRatesFromXeroAPI
    // ============================================================
    
    @IsTest
    static void test_fetchEarningRatesFromXeroAPI_Success() {
        Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
        
        Test.startTest();
        Map<String, Object> result = 
            XeroIntegrationTimeSheet.fetchEarningRatesFromXeroAPI(
                'EMP123',
                'dummy',
                'dummy'
            );
        Test.stopTest();
        

    }
    
    @IsTest
    static void test_fetchEarningRatesFromXeroAPI_EmployeeNotFound() {
        Test.setMock(HttpCalloutMock.class, new XeroErrorResponseMock(404, '{"Message":"Not Found"}'));
        
        Test.startTest();
        Map<String, Object> result = 
            XeroIntegrationTimeSheet.fetchEarningRatesFromXeroAPI(
                'INVALID_EMP',
                'dummy',
                'dummy'
            );
        Test.stopTest();
        
 
    }
    
    // ============================================================
    // TESTS FOR fetchOrdinaryEarningsRateFromXero
    // ============================================================
    
    @IsTest
    static void test_fetchOrdinaryEarningsRateFromXero_Success() {
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'dummy';
        ctx.tenantId = 'dummy';
        
        Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.fetchOrdinaryEarningsRateFromXero('EMP123', ctx);
        Test.stopTest();

    }
    
    @IsTest
    static void test_fetchOrdinaryEarningsRateFromXero_EmployeeNotFound() {
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'dummy';
        ctx.tenantId = 'dummy';
        
        Test.setMock(HttpCalloutMock.class, new XeroErrorResponseMock(404, '{"Message":"Not Found"}'));
        
        Test.startTest();
        String result = XeroIntegrationTimeSheet.fetchOrdinaryEarningsRateFromXero('INVALID_EMP', ctx);
        Test.stopTest();

    }
    
    // ============================================================
    // TESTS FOR processSingleStaffForBulk
    // ============================================================
    
    @IsTest
    static void test_processSingleStaffForBulk_Success() {
        User user = getTestUser();
        System.runAs(user) {
            Staff__c staff = getTestStaff();
            
            XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
            ctx.accessToken = 'dummy';
            ctx.tenantId = 'dummy';
            ctx.startDate = Date.today().addDays(-1);
            ctx.endDate = Date.today().addDays(1);
            
            ctx.categoryToEarningRateMap = new Map<String, String>();
            ctx.categoryToEarningRateMap.put('general', 'ER001');
            
            ctx.selectedCategoryRates = new Map<String, Map<String, String>>();
            Map<String, String> staffRates = new Map<String, String>();
            staffRates.put('general', 'ER001');
            ctx.selectedCategoryRates.put(staff.Id, staffRates);
            
            Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
            
            Test.startTest();
            XeroIntegrationTimeSheet.processSingleStaffForBulk(staff, ctx);
            Test.stopTest();

        }
    }
    
    @IsTest
    static void test_processSingleStaffForBulk_NoShifts() {
        User user = getTestUser();
        System.runAs(user) {
            Staff__c staff = getTestStaff();
            
            XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
            ctx.accessToken = 'dummy';
            ctx.tenantId = 'dummy';
            ctx.startDate = Date.today().addDays(-10);
            ctx.endDate = Date.today().addDays(-8);
            
            Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
            
            Test.startTest();
            try {
                XeroIntegrationTimeSheet.processSingleStaffForBulk(staff, ctx);
                
            } catch (Exception e) {
                // Expected
                // 
            }
            Test.stopTest();
        }
    }
    
    // ============================================================
    // TESTS FOR processSingleStaffForBulkWithSelectedRates
    // ============================================================
    
    @IsTest
    static void test_processSingleStaffForBulkWithSelectedRates_Success() {
        User user = getTestUser();
        System.runAs(user) {
            Staff__c staff = getTestStaff();
            
            XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
            ctx.accessToken = 'dummy';
            ctx.tenantId = 'dummy';
            ctx.startDate = Date.today().addDays(-1);
            ctx.endDate = Date.today().addDays(1);
            
            ctx.categoryToEarningRateMap = new Map<String, String>();
            ctx.categoryToEarningRateMap.put('general', 'ER001');
            
            ctx.selectedCategoryRates = new Map<String, Map<String, String>>();
            Map<String, String> staffRates = new Map<String, String>();
            staffRates.put('general', 'ER001');
            ctx.selectedCategoryRates.put(staff.Id, staffRates);
            
            Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
            
            Test.startTest();
            XeroIntegrationTimeSheet.processSingleStaffForBulkWithSelectedRates(staff, ctx);
            Test.stopTest();

        }
    }
    
    @IsTest
    static void test_processSingleStaffForBulkWithSelectedRates_NoShifts() {
        User user = getTestUser();
        System.runAs(user) {
            Staff__c staff = getTestStaff();
            
            XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
            ctx.accessToken = 'dummy';
            ctx.tenantId = 'dummy';
            ctx.startDate = Date.today().addDays(-10);
            ctx.endDate = Date.today().addDays(-8);
            
            Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
            
            Test.startTest();
            try {
                XeroIntegrationTimeSheet.processSingleStaffForBulkWithSelectedRates(staff, ctx);
            } catch (Exception e) {
                
            }
            Test.stopTest();
        }
    }
    
    // ============================================================
    // TESTS FOR findMatchingEarningRateFromList
    // ============================================================
    
    @IsTest
    static void test_findMatchingEarningRateFromList() {
        List<Map<String, Object>> rates = new List<Map<String, Object>>();
        
        Map<String, Object> rate1 = new Map<String, Object>();
        rate1.put('id', 'GEN001');
        rate1.put('name', 'General Rate');
        rates.add(rate1);
        
        Map<String, Object> rate2 = new Map<String, Object>();
        rate2.put('id', 'BR001');
        rate2.put('name', 'Broken Rate');
        rates.add(rate2);
        
        Map<String, Object> rate3 = new Map<String, Object>();
        rate3.put('id', 'SL001');
        rate3.put('name', 'Sleepover Overnight');
        rates.add(rate3);
        
        Test.startTest();
        
        String result1 = XeroIntegrationTimeSheet.findMatchingEarningRateFromList('General', rates);
        String result2 = XeroIntegrationTimeSheet.findMatchingEarningRateFromList('broken shift', rates);
        String result3 = XeroIntegrationTimeSheet.findMatchingEarningRateFromList('sleepover', rates);
        String result4 = XeroIntegrationTimeSheet.findMatchingEarningRateFromList('random', rates);
        String result5 = XeroIntegrationTimeSheet.findMatchingEarningRateFromList('', rates);
        
        Test.stopTest();
        

    }

// ============================================================
    // EXTRA SHIFT TYPES (broken/sleepover/custom/blank category)
    // hit uncovered branches in processSingleStaffForBulk(WithSelectedRates)
    // ============================================================
    private static void addExtraShifts(Id staffId) {
        Add_Shift__c parentShift = [SELECT Id FROM Add_Shift__c LIMIT 1];

        ShiftwithStaff__c broken = new ShiftwithStaff__c();
        broken.Add_Shift__c = parentShift.Id;
        broken.Staff__c = staffId;
        broken.Role__c = 'Support Worker';
        broken.Status__c = 'Accepted';
        broken.Approval_Status__c = 'Approved';
        broken.Broken_Shift__c = true;
         
        broken.Broken_Extended_Duration__c = 2;
        insert broken;

        ShiftwithStaff__c sleepover = new ShiftwithStaff__c();
        sleepover.Add_Shift__c = parentShift.Id;
        sleepover.Staff__c = staffId;
        sleepover.Role__c = 'Support Worker';
        sleepover.Status__c = 'Accepted';
        sleepover.Approval_Status__c = 'Approved';
        
        sleepover.Shift_Category__c = 'Sleepover';
         
        insert sleepover;

        ShiftwithStaff__c custom = new ShiftwithStaff__c();
        custom.Add_Shift__c = parentShift.Id;
        custom.Staff__c = staffId;
        custom.Role__c = 'Support Worker';
        custom.Status__c = 'Accepted';
        custom.Approval_Status__c = 'Approved';
        custom.Shift_Category__c = 'Custom';
         
        insert custom;

        ShiftwithStaff__c blankCat = new ShiftwithStaff__c();
        blankCat.Add_Shift__c = parentShift.Id;
        blankCat.Staff__c = staffId;
        blankCat.Role__c = 'Support Worker';
        blankCat.Status__c = 'Accepted';
        blankCat.Approval_Status__c = 'Approved';
         
        insert blankCat;
    }

    @IsTest
    static void test_processSingleStaffForBulk_AllShiftTypes() {
        User user = getTestUser();
        System.runAs(user) {
            Staff__c staff = getTestStaff();
            addExtraShifts(staff.Id);

            XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
            ctx.accessToken = 'dummy';
            ctx.tenantId = 'dummy';
            ctx.startDate = Date.today().addDays(-2);
            ctx.endDate = Date.today().addDays(2);
            ctx.categoryToEarningRateMap = new Map<String, String>{
                'general' => 'ER001',
                'broken rate' => 'ER002',
                'custom' => 'ER004'
            };

            Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
            Test.startTest();
            XeroIntegrationTimeSheet.processSingleStaffForBulk(staff, ctx);
            Test.stopTest();
        }
    }

    @IsTest
    static void test_processSingleStaffForBulkWithSelectedRates_AllShiftTypes() {
        User user = getTestUser();
        System.runAs(user) {
            Staff__c staff = getTestStaff();
            addExtraShifts(staff.Id);

            XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
            ctx.accessToken = 'dummy';
            ctx.tenantId = 'dummy';
            ctx.startDate = Date.today().addDays(-2);
            ctx.endDate = Date.today().addDays(2);
            ctx.categoryToEarningRateMap = new Map<String, String>{ 'general' => 'ER001' };
            ctx.selectedCategoryRates = new Map<String, Map<String, String>>{
                staff.Id => new Map<String, String>{
                    'general' => 'ER001',
                    'sleepover' => 'ER003',
                    'custom' => 'ER004',
                    'broken shift' => 'ER002'
                }
            };

            Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
            Test.startTest();
            XeroIntegrationTimeSheet.processSingleStaffForBulkWithSelectedRates(staff, ctx);
            Test.stopTest();
        }
    }

    // ============================================================
    // insertBulkTimeSheetWithSelectedRates - no rate selection branch
    // ============================================================
    @IsTest
    static void test_insertBulkTimeSheetWithSelectedRates_NoRateSelectionForStaff() {
        User user = getTestUser();
        System.runAs(user) {
            Staff__c staff = getTestStaff();
            Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
            Test.startTest();
            XeroIntegrationTimeSheet.insertBulkTimeSheetWithSelectedRates(
                new List<Id>{staff.Id},
                String.valueOf(Date.today().addDays(-1)),
                String.valueOf(Date.today().addDays(1)),
                new Map<Id, Map<String, String>>() // empty -> no selections for staff
            );
            Test.stopTest();
        }
    }

    // ============================================================
    // filterRatesByCategory extra keywords
    // ============================================================
    @IsTest
    static void test_filterRatesByCategory_MoreKeywords() {
        List<Map<String, Object>> rates = new List<Map<String, Object>>{
            new Map<String, Object>{'name' => 'Broken Shift Rate'},
            new Map<String, Object>{'name' => 'Custom Adjust Rate'},
            new Map<String, Object>{'name' => 'General Ordinary'},
            new Map<String, Object>{'name' => 'Afternoon Special'}
        };
        Test.startTest();
        XeroIntegrationTimeSheet.filterRatesByCategory('broken shift', rates);
        XeroIntegrationTimeSheet.filterRatesByCategory('custom', rates);
        XeroIntegrationTimeSheet.filterRatesByCategory('afternoon', rates);
        XeroIntegrationTimeSheet.filterRatesByCategory('unmatched xyz term', rates);
        XeroIntegrationTimeSheet.filterRatesByCategory('foo', new List<Map<String, Object>>());
        Test.stopTest();
    }

    // ============================================================
    // Wrapper class constructors (0% coverage otherwise)
    // ============================================================
    @IsTest
    static void test_EarningRateSelection_Option_Constructors() {
        Test.startTest();
        XeroIntegrationTimeSheet.EarningRateSelection sel = new XeroIntegrationTimeSheet.EarningRateSelection();
        sel.category = 'general';
        XeroIntegrationTimeSheet.EarningRateOption opt = new XeroIntegrationTimeSheet.EarningRateOption();
        opt.id = 'ER001';
        sel.availableRates.add(opt);
        Test.stopTest();
    }

    // ============================================================
    // getStaffEarningRatesForUI - EarningsRates API failure + CASE2 (categories empty)
    // ============================================================
    private class XeroEarningsRatesFailMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            if (req.getEndpoint().contains('EarningsRates')) {
                res.setStatusCode(400);
                res.setBody('{"Message":"fail"}');
            } else {
                res.setStatusCode(200);
                res.setBody('{"Employees":[{"EmployeeID":"EMP123"}]}');
            }
            return res;
        }
    }

    @IsTest
    static void test_getStaffEarningRatesForUI_EarningsRatesApiFail() {
        User user = getTestUser();
        System.runAs(user) {
            Staff__c staff = getTestStaff();
            Test.setMock(HttpCalloutMock.class, new XeroEarningsRatesFailMock());
            Test.startTest();
            XeroIntegrationTimeSheet.getStaffEarningRatesForUI(
                staff.Id,
                String.valueOf(Date.today().addDays(-1)),
                String.valueOf(Date.today().addDays(1))
            );
            Test.stopTest();
        }
    }

    @IsTest
    static void test_getStaffEarningRatesForUI_CategoriesEmptyCase2() {
        User user = getTestUser();
        System.runAs(user) {
            Staff__c staff = getTestStaff();
            addExtraShifts(staff.Id); // includes blank-category shift
            Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
            Test.startTest();
            // date range only covers the blank-category shift's date (today) minus broken/sleepover/custom too,
            // still fine - exercises loop w/ mixed + blank category path
            XeroIntegrationTimeSheet.getStaffEarningRatesForUI(
                staff.Id,
                String.valueOf(Date.today()),
                String.valueOf(Date.today())
            );
            Test.stopTest();
        }
    }

    // ============================================================
    // fetchOrdinaryEarningsRateFromXero - PayTemplate fallback branch
    // ============================================================
    private class XeroPayTemplateOnlyMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"Employees":[{"EmployeeID":"EMP123","PayTemplate":{"EarningsLines":[{"EarningsRateID":"PT001","CalculationType":"ENTEREARNINGSRATE","RatePerUnit":15}]}}]}');
            return res;
        }
    }

    @IsTest
    static void test_fetchOrdinaryEarningsRateFromXero_PayTemplateFallback() {
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'dummy';
        ctx.tenantId = 'dummy';
        Test.setMock(HttpCalloutMock.class, new XeroPayTemplateOnlyMock());
        Test.startTest();
        XeroIntegrationTimeSheet.fetchOrdinaryEarningsRateFromXero('EMP123', ctx);
        Test.stopTest();
    }

    // ============================================================
    // fetchOrdinaryEarningsRateFromXero - EarningsRates array branch
    // ============================================================
    private class XeroEarningsRatesArrayMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"Employees":[{"EmployeeID":"EMP123","EarningsRates":[{"Name":"Ordinary Earnings","RateType":"ORDINARYEARNINGS","EarningsRateID":"EA001"}]}]}');
            return res;
        }
    }

    @IsTest
    static void test_fetchOrdinaryEarningsRateFromXero_EarningsRatesArray() {
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'dummy';
        ctx.tenantId = 'dummy';
        Test.setMock(HttpCalloutMock.class, new XeroEarningsRatesArrayMock());
        Test.startTest();
        XeroIntegrationTimeSheet.fetchOrdinaryEarningsRateFromXero('EMP123', ctx);
        Test.stopTest();
    }

    @IsTest
    static void test_fetchOrdinaryEarningsRateFromXero_NoEmployee() {
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'dummy';
        ctx.tenantId = 'dummy';
        Test.setMock(HttpCalloutMock.class, new XeroErrorResponseMock(200, '{"Employees":[]}'));
        Test.startTest();
        XeroIntegrationTimeSheet.fetchOrdinaryEarningsRateFromXero('EMP123', ctx);
        Test.stopTest();
    }

    // ============================================================
    // getXeroPayrollCycle / getXeroPayrollCycleForStaff - blank calendar id,
    // empty calendars, fortnightly type
    // ============================================================
    private class XeroBlankCalendarIdMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"Employees":[{"EmployeeID":"EMP123"}]}'); // no PayrollCalendarID
            return res;
        }
    }

    @IsTest
    static void test_getXeroPayrollCycle_BlankCalendarId() {
        User user = getTestUser();
        System.runAs(user) {
            Staff__c staff = getTestStaff();
            XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
            ctx.accessToken = 'dummy';
            ctx.tenantId = 'dummy';
            ctx.startDate = Date.today();
            Test.setMock(HttpCalloutMock.class, new XeroBlankCalendarIdMock());
            Test.startTest();
            XeroIntegrationTimeSheet.getXeroPayrollCycle('EMP123', staff.Id, ctx);
            Test.stopTest();
        }
    }

    private class XeroEmptyCalendarsMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setHeader('Content-Type', 'application/json');
            String ep = req.getEndpoint();
            if (ep.contains('PayrollCalendars')) {
                res.setBody('{"PayrollCalendars":[]}');
            } else {
                res.setBody('{"Employees":[{"EmployeeID":"EMP123","PayrollCalendarID":"CAL001"}]}');
            }
            return res;
        }
    }

    @IsTest
    static void test_getXeroPayrollCycleForStaff_EmptyCalendars() {
        User user = getTestUser();
        System.runAs(user) {
            Staff__c staff = getTestStaff();
            Test.setMock(HttpCalloutMock.class, new XeroEmptyCalendarsMock());
            Test.startTest();
            XeroIntegrationTimeSheet.getXeroPayrollCycleForStaff('EMP123', staff.Id, 'dummy', 'dummy', Date.today());
            Test.stopTest();
        }
    }

    private class XeroFortnightlyMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setHeader('Content-Type', 'application/json');
            String ep = req.getEndpoint();
            if (ep.contains('PayrollCalendars')) {
                res.setBody('{"PayrollCalendars":[{"Name":"Fortnightly","CalendarType":"FORTNIGHTLY","StartDate":"/Date(1716940800000+0000)/"}]}');
            } else {
                res.setBody('{"Employees":[{"EmployeeID":"EMP123","PayrollCalendarID":"CAL001"}]}');
            }
            return res;
        }
    }

    @IsTest
    static void test_getXeroPayrollCycle_Fortnightly() {
        User user = getTestUser();
        System.runAs(user) {
            Staff__c staff = getTestStaff();
            XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
            ctx.accessToken = 'dummy';
            ctx.tenantId = 'dummy';
            ctx.startDate = Date.today();
            Test.setMock(HttpCalloutMock.class, new XeroFortnightlyMock());
            Test.startTest();
            XeroIntegrationTimeSheet.getXeroPayrollCycle('EMP123', staff.Id, ctx);
            Test.stopTest();
        }
    }

    // ============================================================
    // sendBulkTimesheets - "already exists" + generic message branches
    // ============================================================
    private class XeroAlreadyExistsMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            if (req.getEndpoint().contains('Timesheets')) {
                res.setStatusCode(400);
                res.setBody('{"Timesheets":[{"EmployeeID":"EMP123","ValidationErrors":[{"Message":"Timesheet already exists"}]}]}');
            } else {
                res.setStatusCode(200);
                res.setBody('{"Employees":[{"EmployeeID":"EMP123"}]}');
            }
            return res;
        }
    }

    @IsTest
    static void test_sendBulkTimesheets_AlreadyExists() {
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'dummy';
        ctx.tenantId = 'dummy';
        ctx.timesheetPayloads = new List<Object>{ new Map<String, Object>{'EmployeeID' => 'EMP123'} };
        ctx.employeeIdToStaffId = new Map<String, Id>{ 'EMP123' => UserInfo.getUserId() };
        ctx.employeeIdToStaffName = new Map<String, String>{ 'EMP123' => 'Test Staff' };
        ctx.results = new List<XeroIntegrationTimeSheet.StaffProcessingResult>();
        Test.setMock(HttpCalloutMock.class, new XeroAlreadyExistsMock());
        Test.startTest();
        XeroIntegrationTimeSheet.sendBulkTimesheets(ctx);
        Test.stopTest();
    }

    private class XeroGenericTopLevelErrorMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            res.setStatusCode(500);
            res.setBody('{"Message":"Internal Server Error"}'); // no Timesheets / Employees key
            return res;
        }
    }

    @IsTest
    static void test_sendBulkTimesheets_GenericTopLevelError() {
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'dummy';
        ctx.tenantId = 'dummy';
        ctx.timesheetPayloads = new List<Object>{ new Map<String, Object>{'EmployeeID' => 'EMP123'} };
        ctx.employeeIdToStaffId = new Map<String, Id>{ 'EMP123' => UserInfo.getUserId() };
        ctx.employeeIdToStaffName = new Map<String, String>{ 'EMP123' => 'Test Staff' };
        ctx.results = new List<XeroIntegrationTimeSheet.StaffProcessingResult>();
        Test.setMock(HttpCalloutMock.class, new XeroGenericTopLevelErrorMock());
        Test.startTest();
        XeroIntegrationTimeSheet.sendBulkTimesheets(ctx);
        Test.stopTest();
    }

    @IsTest
    static void test_sendBulkEmployeePayTemplates_GenericTopLevelError() {
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'dummy';
        ctx.tenantId = 'dummy';
        ctx.employeePayloads = new List<Object>{ new Map<String, Object>{'EmployeeID' => 'EMP123'} };
        Test.setMock(HttpCalloutMock.class, new XeroGenericTopLevelErrorMock());
        Test.startTest();
        XeroIntegrationTimeSheet.sendBulkEmployeePayTemplates(ctx);
        Test.stopTest();
    }

    // ============================================================
    // fetchTrackingItemIdFromXero - inactive option -> fallback to first option
    // ============================================================
    private class XeroInactiveTrackingOptionMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"TrackingCategories":[{"Name":"Dept","TrackingCategoryID":"TC001","Status":"ACTIVE","Options":[{"Name":"Opt1","TrackingOptionID":"TO001","Status":"INACTIVE"}]}]}');
            return res;
        }
    }

    @IsTest
    static void test_fetchTrackingItemIdFromXero_InactiveOptionFallback() {
        XeroIntegrationTimeSheet.ProcessingContext ctx = new XeroIntegrationTimeSheet.ProcessingContext();
        ctx.accessToken = 'dummy';
        ctx.tenantId = 'dummy';
        Test.setMock(HttpCalloutMock.class, new XeroInactiveTrackingOptionMock());
        Test.startTest();
        XeroIntegrationTimeSheet.fetchTrackingItemIdFromXero(ctx);
        Test.stopTest();
    }

    // ============================================================
    // sendSelectedPayPeriodTimesheets - staff missing Ordinary_Earnings_Rate_ID__c,
    // fetched from Xero -> update path
    // ============================================================
    @IsTest
    static void test_sendSelectedPayPeriodTimesheets_FetchOrdinaryRate() {
        User user = getTestUser();
        System.runAs(user) {
            Staff__c staff = getTestStaff();
            staff.Ordinary_Earnings_Rate_ID__c = null;
            update staff;

            Map<Id, Map<String, String>> rateSelections = new Map<Id, Map<String, String>>{
                staff.Id => new Map<String, String>{ 'general' => 'ER001' }
            };

            Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
            Test.startTest();
            XeroIntegrationTimeSheet.sendSelectedPayPeriodTimesheets(
                new List<String>{String.valueOf(staff.Id)},
                new List<String>{String.valueOf(Date.today().addDays(-1))},
                new List<String>{String.valueOf(Date.today().addDays(1))},
                rateSelections
            );
            Test.stopTest();
        }
    }

    @IsTest
    static void test_sendSelectedPayPeriodTimesheets_InvalidStaffId() {
        User user = getTestUser();
        System.runAs(user) {
            Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
            Test.startTest();
            try {
                XeroIntegrationTimeSheet.sendSelectedPayPeriodTimesheets(
                    new List<String>{'001000000000000AAA'},
                    new List<String>{String.valueOf(Date.today().addDays(-1))},
                    new List<String>{String.valueOf(Date.today().addDays(1))},
                    new Map<Id, Map<String, String>>()
                );
            } catch (Exception e) { }
            Test.stopTest();
        }
    }
 // ============================================================
// GET STAFF EARNING RATES - COMPLETE COVERAGE TEST
// ============================================================

private class XeroEarningRatesFullMock implements HttpCalloutMock {

    public HTTPResponse respond(HTTPRequest req) {

        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');

        String endpoint = req.getEndpoint();

        // ====================================================
        // 1. XERO ACCESS TOKEN
        // ====================================================
        if (endpoint == 'https://identity.xero.com/connect/token') {

            res.setStatusCode(200);

            res.setBody(
                '{' +
                    '"access_token":"TEST_ACCESS_TOKEN",' +
                    '"token_type":"Bearer",' +
                    '"expires_in":1800,' +
                    '"scope":"payroll.employees payroll.settings payroll.timesheets"' +
                '}'
            );

            return res;
        }

        // ====================================================
        // 2. XERO CONNECTIONS / TENANT ID
        // ====================================================
        if (endpoint == 'https://api.xero.com/connections') {

            res.setStatusCode(200);

            res.setBody(
                '[' +
                    '{' +
                        '"id":"CONNECTION001",' +
                        '"tenantId":"TEST_TENANT_ID",' +
                        '"tenantType":"ORGANISATION",' +
                        '"tenantName":"Test Organisation"' +
                    '}' +
                ']'
            );

            return res;
        }

        // ====================================================
        // 3. XERO EARNINGS RATES
        // ====================================================
        if (endpoint.contains('/payroll.xro/2.0/EarningsRates')) {

            res.setStatusCode(200);

            res.setBody(
                '{"earningsRates":[' +

                    // VALID RATE
                    '{"earningsRateID":"VALID001",' +
                    '"name":"General Rate",' +
                    '"rateType":"ORDINARYEARNINGS",' +
                    '"currentRecord":true,' +
                    '"typeOfUnits":"Hours",' +
                    '"ratePerUnit":0},' +

                    // INACTIVE RATE
                    '{"earningsRateID":"INACTIVE001",' +
                    '"name":"Inactive Rate",' +
                    '"rateType":"ORDINARYEARNINGS",' +
                    '"currentRecord":false,' +
                    '"typeOfUnits":"Hours",' +
                    '"ratePerUnit":0},' +

                    // INVALID UNITS
                    '{"earningsRateID":"INVALIDUNIT001",' +
                    '"name":"Invalid Unit Rate",' +
                    '"rateType":"ORDINARYEARNINGS",' +
                    '"currentRecord":true,' +
                    '"typeOfUnits":"Days",' +
                    '"ratePerUnit":0},' +

                    // HOURS
                    '{"earningsRateID":"HOURS001",' +
                    '"name":"Hours Rate",' +
                    '"rateType":"ORDINARYEARNINGS",' +
                    '"currentRecord":true,' +
                    '"typeOfUnits":"Hours",' +
                    '"ratePerUnit":0},' +

                    // TYPE OF UNITS = 1
                    '{"earningsRateID":"UNITONE001",' +
                    '"name":"Unit One Rate",' +
                    '"rateType":"ORDINARYEARNINGS",' +
                    '"currentRecord":true,' +
                    '"typeOfUnits":"1",' +
                    '"ratePerUnit":0},' +

                    // NON-ZERO RATE
                    '{"earningsRateID":"NONZERO001",' +
                    '"name":"Non Zero Rate",' +
                    '"rateType":"ORDINARYEARNINGS",' +
                    '"currentRecord":true,' +
                    '"typeOfUnits":"Hours",' +
                    '"ratePerUnit":25},' +

                    // FIXED AMOUNT
                    '{"earningsRateID":"FIXED001",' +
                    '"name":"Fixed Amount Rate",' +
                    '"rateType":"ORDINARYEARNINGS",' +
                    '"currentRecord":true,' +
                    '"typeOfUnits":"Hours",' +
                    '"fixedAmount":0},' +

                    // NULL TYPE OF UNITS + NULL RATES
                    '{"earningsRateID":"NULLVALUES001",' +
                    '"name":"Null Values Rate",' +
                    '"rateType":"ORDINARYEARNINGS",' +
                    '"currentRecord":true},' +

                    // NULL CURRENT RECORD
                    '{"earningsRateID":"NULLCURRENT001",' +
                    '"name":"Null Current Rate",' +
                    '"typeOfUnits":"Hours",' +
                    '"ratePerUnit":0},' +

                    // NULL NAME
                    '{"earningsRateID":"NULLNAME001",' +
                    '"rateType":"ORDINARYEARNINGS",' +
                    '"currentRecord":true,' +
                    '"typeOfUnits":"Hours",' +
                    '"ratePerUnit":0},' +

                    // NULL RATE TYPE
                    '{"earningsRateID":"NULLTYPE001",' +
                    '"name":"Null Rate Type",' +
                    '"currentRecord":true,' +
                    '"typeOfUnits":"Hours",' +
                    '"ratePerUnit":0},' +

                    // BLANK ID
                    '{"earningsRateID":"",' +
                    '"name":"Blank ID Rate",' +
                    '"rateType":"ORDINARYEARNINGS",' +
                    '"currentRecord":true,' +
                    '"typeOfUnits":"Hours",' +
                    '"ratePerUnit":0}' +

                ']}'
            );

            return res;
        }

        // ====================================================
        // UNEXPECTED ENDPOINT
        // ====================================================
        res.setStatusCode(404);
        res.setBody('{"error":"Unexpected endpoint"}');

        return res;
    }
}


// ============================================================
// TEST METHOD
// ============================================================

@IsTest
static void test_getStaffEarningRatesForUI_AllBranches() {

    User user = getTestUser();

    System.runAs(user) {

        Staff__c staff = getTestStaff();

        Test.setMock(
            HttpCalloutMock.class,
            new XeroEarningRatesFullMock()
        );

        Test.startTest();

        Map<String, Object> result =
            XeroIntegrationTimeSheet.getStaffEarningRatesForUI(
                staff.Id,
                String.valueOf(Date.today().addDays(-10)),
                String.valueOf(Date.today().addDays(-8))
            );

        Test.stopTest();
    }
}

// ============================================================
// INSERT BULK TIMESHEET - FULL MAIN PATH MOCK
// ============================================================

private class XeroInsertBulkFullMock implements HttpCalloutMock {

    public HTTPResponse respond(HTTPRequest req) {

        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');

        String endpoint = req.getEndpoint();

        // ====================================================
        // 1. XERO ACCESS TOKEN
        // ====================================================
        if (endpoint.contains('identity.xero.com/connect/token')) {

            res.setStatusCode(200);
            res.setBody(
                '{' +
                    '"access_token":"TEST_ACCESS_TOKEN",' +
                    '"token_type":"Bearer",' +
                    '"expires_in":1800' +
                '}'
            );

            return res;
        }

        // ====================================================
        // 2. XERO CONNECTIONS
        // ====================================================
        if (endpoint.contains('api.xero.com/connections')) {

            res.setStatusCode(200);
            res.setBody(
                '[' +
                    '{' +
                        '"tenantId":"TEST_TENANT_ID",' +
                        '"tenantName":"Test Organisation"' +
                    '}' +
                ']'
            );

            return res;
        }

        // ====================================================
        // 3. TRACKING CATEGORIES
        // ====================================================
        if (endpoint.contains('TrackingCategories')) {

            res.setStatusCode(200);

            res.setBody(
                '{' +
                    '"TrackingCategories":[' +
                        '{' +
                            '"Name":"Department",' +
                            '"TrackingCategoryID":"TC001",' +
                            '"Status":"ACTIVE",' +
                            '"Options":[' +
                                '{' +
                                    '"Name":"General",' +
                                    '"TrackingOptionID":"TO001",' +
                                    '"Status":"ACTIVE"' +
                                '}' +
                            ']' +
                        '}' +
                    ']' +
                '}'
            );

            return res;
        }

        // ====================================================
        // 4. EMPLOYEE PAY TEMPLATE UPDATE
        // ====================================================
        if (endpoint.contains('/payroll.xro/1.0/Employees')) {

            res.setStatusCode(200);

            res.setBody(
                '{' +
                    '"Employees":[' +
                        '{' +
                            '"EmployeeID":"EMP123"' +
                        '}' +
                    ']' +
                '}'
            );

            return res;
        }

        // ====================================================
        // 5. TIMESHEET CREATE
        // ====================================================
        if (endpoint.contains('/payroll.xro/1.0/Timesheets')) {

            res.setStatusCode(200);

            res.setBody(
                '{' +
                    '"Timesheets":[' +
                        '{' +
                            '"TimesheetID":"TS001",' +
                            '"EmployeeID":"EMP123",' +
                            '"Status":"DRAFT"' +
                        '}' +
                    ']' +
                '}'
            );

            return res;
        }

        // ====================================================
        // FALLBACK
        // ====================================================
        res.setStatusCode(200);
        res.setBody('{}');

        return res;
    }
}


// ============================================================
// MAIN SUCCESS PATH
// Covers:
// - credentials ready
// - ProcessingContext
// - tracking item
// - staff loop
// - staff query
// - Xero employee ID
// - shifts
// - rate selections
// - category processing
// - timesheet lines
// - pay template
// - employee callout
// - timesheet callout
// - successful Xero response
// ============================================================

@IsTest
static void test_insertBulkTimeSheetWithSelectedRates_FullMainPath() {

    User user = getTestUser();

    System.runAs(user) {

        Staff__c staff = getTestStaff();

        // Make sure employee ID exists
        staff.Xero_Employee_ID__c = 'EMP123';
        staff.Ordinary_Earnings_Rate_ID__c = 'ER001';
        update staff;

        // Add broken / sleepover / custom / blank category shifts
        addExtraShifts(staff.Id);

        // Selected rates for every category
        Map<Id, Map<String, String>> rateSelections =
            new Map<Id, Map<String, String>>();

        rateSelections.put(
            staff.Id,
            new Map<String, String>{
                'general' => 'ER001',
                'broken shift' => 'ER002',
                'sleepover shift' => 'ER003',
                'custom' => 'ER004'
            }
        );

        // Mock ALL callouts used by insertBulkTimeSheetWithSelectedRates
        Test.setMock(
            HttpCalloutMock.class,
            new XeroInsertBulkFullMock()
        );

        Test.startTest();

        List<XeroIntegrationTimeSheet.XeroResult> results =
            XeroIntegrationTimeSheet.insertBulkTimeSheetWithSelectedRates(
                new List<Id>{ staff.Id },
                String.valueOf(Date.today().addDays(-1)),
                String.valueOf(Date.today().addDays(1)),
                rateSelections
            );

        Test.stopTest();
    }
}


// ============================================================
// CREDENTIAL FAILURE PATH
// Covers:
//
// if (String.isBlank(accessToken) || String.isBlank(tenantId))
//
// ============================================================

private class XeroBlankTokenMock implements HttpCalloutMock {

    public HTTPResponse respond(HTTPRequest req) {

        HttpResponse res = new HttpResponse();

        if (req.getEndpoint().contains('identity.xero.com/connect/token')) {

            res.setStatusCode(200);

            // No access_token -> getAccessTokenFromXero()
            // returns null
            res.setBody(
                '{' +
                    '"token_type":"Bearer",' +
                    '"expires_in":1800' +
                '}'
            );

            return res;
        }

        res.setStatusCode(200);
        res.setBody('[]');

        return res;
    }
}


@IsTest
static void test_insertBulkTimeSheetWithSelectedRates_BlankCredentials() {

    User user = getTestUser();

    System.runAs(user) {

        Staff__c staff = getTestStaff();

        Map<Id, Map<String, String>> rateSelections =
            new Map<Id, Map<String, String>>();

        rateSelections.put(
            staff.Id,
            new Map<String, String>{
                'general' => 'ER001'
            }
        );

        Test.setMock(
            HttpCalloutMock.class,
            new XeroBlankTokenMock()
        );

        Test.startTest();

        List<XeroIntegrationTimeSheet.XeroResult> results =
            XeroIntegrationTimeSheet.insertBulkTimeSheetWithSelectedRates(
                new List<Id>{ staff.Id },
                String.valueOf(Date.today().addDays(-1)),
                String.valueOf(Date.today().addDays(1)),
                rateSelections
            );

        Test.stopTest();
    }
}
}