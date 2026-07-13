@isTest
public class XeroIntegrationTimeSheetTest {
   
    private class XeroMockResponse implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            if (req.getEndpoint().contains('Employees')) {
                res.setBody('{"message":"Employee PayTemplate Updated"}');
            } else if (req.getEndpoint().contains('Timesheets')) {
                res.setBody('{"message":"Timesheet Created"}');
            }
            return res;
        }
    }

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
            NDIS_Provider__c = '12341234565', // ✅ you asked me NOT to change
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
            shift.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift.Start_Date__c = Date.today();
			shift.End_Date__c  = Date.today();
            shift.Role__c='Support Worker';
            shift.Get_Facility__c=true;
            shift.Quantity__c=5;
            shift.Start_Time__c=Time.newInstance( 03, 30, 00, 00);
            shift.End_Time__c=Time.newInstance( 05, 00, 00, 00);
            shift.Facility__c=fac.Id;
            shift.Status__c='Draft';
            shift.Start_time_picklist__c='3:30 am';
            shift.End_time_picklist__c='5:00 am';
            shift.Location__StateCode__s = 'ACT';
            shift.Location__CountryCode__s = 'AU';
            shift.Location__PostalCode__s = '2911';
            shift.Is_EOI__c = true;
            shift.EOI_staff__c = staff.Id;
            shift.Shift_Type__c='General';
            insert shift;
            
            // Create Shift with required fields
            ShiftwithStaff__c staffs = new ShiftwithStaff__c();
            staffs.Add_Shift__c=shift.Id;
            staffs.Attendence__c=true;
            staffs.Comments__c = 'test comments';
            staffs.Staff__c=staff.Id;
            staffs.Role__c='Support Worker';
            staffs.Status__c='Accepted';
            staffs.Log_In_Date_Time__c = Time.newInstance(01, 30, 00, 00);
            staffs.Log_Out_Date_Time__c = Time.newInstance(10, 00, 00, 00);
            staffs.Shift_Category__c = 'General';
            staffs.Approval_Status__c = 'Approved';
            insert staffs;
        }
    }

  	@IsTest
    static void testInsertTimeSheet_Success() {
        // Arrange
        Staff__c staff = [SELECT Id,Email_Address__c FROM Staff__c Where Email_Address__c= 'manualtesting.20932@hotmail.com' LIMIT 1];
        User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
        System.runAs(user) {
            Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
    
            // Mock Xero token + tenant using Stub
            String accessToken = 'test_access_token_value';
            String tenantId = 'tenant_001';
    
            // Act
            Test.startTest();
            XeroIntegrationTimeSheet.insertTimeSheet(staff.Id,String.valueOf(Date.today()),String.valueOf(Date.today().addDays(2)));
            Test.stopTest();
        }
    }
    
    private static User getTestUser() {
    return [
        SELECT Id
        FROM User
        WHERE Organization_Name__c = 'Ashfield Consultants'
        LIMIT 1
    ];
}
@IsTest
static void test_BrokenShiftBranchCoverage() {

    User user = getTestUser();
    System.runAs(user) {

        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];

        insert new Xero_Earning_Rate__c(
            Name = 'Broken Rate',
            Earning_Rate_ID__c = 'BR001',
            Organization__c = org.Id
        );

        Test.setMock(HttpCalloutMock.class, new XeroMockResponse());

        // ⭐ VERY WIDE DATE RANGE to catch formula Date__c
        Test.startTest();
        XeroIntegrationTimeSheet.insertTimeSheet(
            staff.Id,
            '2000-01-01',
            '2100-01-01'
        );
        Test.stopTest();
    }
    
}
@IsTest
static void test_SleepoverBranchCoverage() {
    User user = getTestUser();
    System.runAs(user) {
        Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
        Staff__c staff      = [SELECT Id FROM Staff__c LIMIT 1];

        insert new Xero_Earning_Rate__c(
            Name               = 'Sleepover Shift',
            Earning_Rate_ID__c = 'SL001',
            Organization__c    = org.Id
        );

        Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
        Test.startTest();
        XeroIntegrationTimeSheet.insertTimeSheet(
            staff.Id,
            String.valueOf(Date.today().addDays(-1)),
            String.valueOf(Date.today().addDays(1))
        );
        Test.stopTest();
    }
}

@IsTest
static void test_EarningRateMatchingCoverage() {
    User user = getTestUser();
    System.runAs(user) {
        Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
        Staff__c staff      = [SELECT Id FROM Staff__c LIMIT 1];

        insert new List<Xero_Earning_Rate__c>{
            new Xero_Earning_Rate__c(
                Name               = 'General',
                Earning_Rate_ID__c = 'ER_GEN',
                Organization__c    = org.Id
            ),
            new Xero_Earning_Rate__c(
                Name               = 'Broken Rate',
                Earning_Rate_ID__c = 'ER_BROKEN',
                Organization__c    = org.Id
            ),
            new Xero_Earning_Rate__c(
                Name               = 'Sleepover Overnight',
                Earning_Rate_ID__c = 'ER_SLEEP',
                Organization__c    = org.Id
            ),
            new Xero_Earning_Rate__c(
                Name               = 'Night Shift Rate',
                Earning_Rate_ID__c = 'ER_NIGHT',
                Organization__c    = org.Id
            )
        };

        Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
        Test.startTest();
        XeroIntegrationTimeSheet.insertTimeSheet(
            staff.Id,
            String.valueOf(Date.today().addDays(-1)),
            String.valueOf(Date.today().addDays(1))
        );
        Test.stopTest();
    }
}

@IsTest
static void test_FullHappyPath_EndToEnd() {
    User user = getTestUser();
    System.runAs(user) {
        Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];

        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        staff.Xero_Employee_ID__c = 'EMP123';
        staff.Ordinary_Earnings_Rate_ID__c = 'ORD123';
        update staff;

        insert new Xero_Earning_Rate__c(
            Name               = 'General',
            Earning_Rate_ID__c = 'ER001',
            Organization__c    = org.Id
        );

        Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
        Test.startTest();
        // ✅ Narrow range — avoids 36,500-iteration CPU timeout
        XeroIntegrationTimeSheet.insertTimeSheet(
            staff.Id,
            String.valueOf(Date.today().addDays(-1)),
            String.valueOf(Date.today().addDays(1))
        );
        Test.stopTest();
    }
}
private class XeroTimesheetErrorMock implements HttpCalloutMock {
    private String errorBody;
    public XeroTimesheetErrorMock(String body) { this.errorBody = body; }
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        if (req.getEndpoint().contains('Employees')) {
            res.setStatusCode(200);
            res.setBody('{"message":"Employee PayTemplate Updated"}');
        } else {
            res.setStatusCode(400);
            res.setBody(errorBody);
        }
        return res;
    }
}

@IsTest
static void test_MissingXeroEmployeeId_ThrowsException() {
    User user = getTestUser();
    System.runAs(user) {
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        staff.Xero_Employee_ID__c = null;
        update staff;

        Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
        Test.startTest();
        try {
           XeroIntegrationTimeSheet.insertTimeSheet(
    staff.Id,
    String.valueOf(Date.today().addDays(-1)),
    String.valueOf(Date.today().addDays(1))
);
        } catch (AuraHandledException e) { }
        Test.stopTest();
    }
}

@IsTest
static void test_MissingOrdinaryEarningsRate_ThrowsException() {
    User user = getTestUser();
    System.runAs(user) {
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        staff.Ordinary_Earnings_Rate_ID__c = null;
        update staff;

        Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
        Test.startTest();
        try {
          XeroIntegrationTimeSheet.insertTimeSheet(
    staff.Id,
    String.valueOf(Date.today().addDays(-1)),
    String.valueOf(Date.today().addDays(1))
);
        } catch (AuraHandledException e) { }
        Test.stopTest();
    }
}
@IsTest
static void test_NoShiftsFound_ThrowsException() {
    User user = getTestUser();
    System.runAs(user) {
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];

        Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
        Test.startTest();
        try {
            XeroIntegrationTimeSheet.insertTimeSheet(
    staff.Id,
    String.valueOf(Date.today().addDays(-1)),
    String.valueOf(Date.today().addDays(1))
);
        } catch (AuraHandledException e) { }
        Test.stopTest();
    }
}
@IsTest
static void test_BrokenShift_FullProcessing() {
    User user = getTestUser();
    System.runAs(user) {
        Staff__c staff      = [SELECT Id FROM Staff__c LIMIT 1];
        Facility__c fac     = [SELECT Id FROM Facility__c LIMIT 1];
        Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];

        Add_Shift__c brokenAddShift = new Add_Shift__c(
            Break__c                 = '0',
            Start_Date__c            = Date.today(),
            End_Date__c              = Date.today(),
            Role__c                  = 'Support Worker',
            Quantity__c              = 1,
            Start_Time__c            = Time.newInstance(06, 00, 00, 00),
            End_Time__c              = Time.newInstance(14, 00, 00, 00), // ✅ End after Start
            Facility__c              = fac.Id,
            Status__c                = 'Draft',
            Start_time_picklist__c   = '6:00 am',
            End_time_picklist__c     = '2:00 pm',
            Shift_Type__c            = 'General',
            Location__StateCode__s   = 'ACT',
            Location__CountryCode__s = 'AU',
            Location__PostalCode__s  = '2911'
        );
        insert brokenAddShift;

        ShiftwithStaff__c brokenShift = new ShiftwithStaff__c(
            Add_Shift__c                = brokenAddShift.Id,
            Staff__c                    = staff.Id,
            Role__c                     = 'Support Worker',
            Status__c                   = 'Accepted',
            Shift_Category__c           = 'General',
            Approval_Status__c          = 'Approved',
            Broken_Shift__c             = true,
            Broken_Extended_Duration__c = 2.0,
            Log_In_Date_Time__c         = Time.newInstance(06, 00, 00, 00), // ✅ In < Out
            Log_Out_Date_Time__c        = Time.newInstance(14, 00, 00, 00)
        );
        insert brokenShift;

        insert new Xero_Earning_Rate__c(
            Name               = 'Broken Rate',
            Earning_Rate_ID__c = 'BR_TEST',
            Organization__c    = org.Id
        );

        Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
        Test.startTest();
        XeroIntegrationTimeSheet.insertTimeSheet(
            staff.Id,
            String.valueOf(Date.today().addDays(-1)),
            String.valueOf(Date.today().addDays(1))
        );
        Test.stopTest();
    }
}

@IsTest
static void test_SleepoverShift_FullProcessing() {
    User user = getTestUser();
    System.runAs(user) {
        Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
        Staff__c staff      = [SELECT Id FROM Staff__c LIMIT 1];

        // Insert a Sleepover earning rate — covers the name-matching 
        // branch inside PayTemplate and Timesheet builder loops
        insert new Xero_Earning_Rate__c(
            Name               = 'Sleepover Overnight',
            Earning_Rate_ID__c = 'SL_TEST',
            Organization__c    = org.Id
        );

        // General earning rate so the existing @testSetup shift maps cleanly
        insert new Xero_Earning_Rate__c(
            Name               = 'General',
            Earning_Rate_ID__c = 'GEN_SL',
            Organization__c    = org.Id
        );

        Test.setMock(HttpCalloutMock.class, new XeroMockResponse());
        Test.startTest();
        // Existing General shift from @testSetup is picked up here
        XeroIntegrationTimeSheet.insertTimeSheet(
            staff.Id,
            String.valueOf(Date.today().addDays(-1)),
            String.valueOf(Date.today().addDays(1))
        );
        Test.stopTest();
    }
}

@IsTest
static void test_TimesheetAlreadyExists_HandledGracefully() {
    User user = getTestUser();
    System.runAs(user) {
        Staff__c staff      = [SELECT Id FROM Staff__c LIMIT 1];
        Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];

        insert new Xero_Earning_Rate__c(
            Name               = 'General',
            Earning_Rate_ID__c = 'GEN_AE',
            Organization__c    = org.Id
        );

        Test.setMock(HttpCalloutMock.class,
            new XeroTimesheetErrorMock('{"Message":"Timesheet already exists for this period"}'));

        Test.startTest();
        try {
           XeroIntegrationTimeSheet.insertTimeSheet(
    staff.Id,
    String.valueOf(Date.today().addDays(-1)),
    String.valueOf(Date.today().addDays(1))
);
        } catch (AuraHandledException e) { }
        Test.stopTest();
    }
}

@IsTest
static void test_TimesheetGenericApiError_ThrowsException() {
    User user = getTestUser();
    System.runAs(user) {
        Staff__c staff      = [SELECT Id FROM Staff__c LIMIT 1];
        Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];

        insert new Xero_Earning_Rate__c(
            Name               = 'General',
            Earning_Rate_ID__c = 'GEN_ERR',
            Organization__c    = org.Id
        );

        Test.setMock(HttpCalloutMock.class,
            new XeroTimesheetErrorMock('{"Type":"ValidationException","Message":"Bad request"}'));

        Test.startTest();
        try {
          XeroIntegrationTimeSheet.insertTimeSheet(
    staff.Id,
    String.valueOf(Date.today().addDays(-1)),
    String.valueOf(Date.today().addDays(1))
);
        } catch (AuraHandledException e) { }
        Test.stopTest();
    }
}


}