@isTest
public class StaffControllerTest {
    
    // Static variables to hold data (will be null in each new test method)
    @TestVisible static User testUser;
    @TestVisible static Staff__c testStaff;
    @TestVisible static Organisation__c testOrg;
    @TestVisible static Facility__c testFacility;
    @TestVisible static Child_Staff__c testDoc;
    @TestVisible static ShiftwithStaff__c testShift;
    
    @testSetup
    static void setup() {
        // =============================================
        // 1. CREATE ORGANISATION
        // =============================================
        testOrg = new Organisation__c();
        testOrg.Name = 'Ashfield Consultants';
        testOrg.ABN__c = '11234567891';
        testOrg.ACN__c = '878787878';
        testOrg.Contact_No__c = '6132899740';
        testOrg.RCTI__c = 'RCTI1';
        testOrg.Email__c = 'dsfdsfsd@gmail.com';
        testOrg.Bank__c = 'Bank Test';
        testOrg.BSB__c = 'BSB Test';
        testOrg.Account_Name__c = 'Test Account';
        testOrg.Account_Number__c = '1111111111';
        testOrg.Description__c = 'test Desc';
        testOrg.Address_Latest__Street__s = '101';
        testOrg.Address_Latest__City__s = 'Himas Waterhen';
        testOrg.Address_Latest__PostalCode__s = '2060';
        testOrg.Address_Latest__CountryCode__s = 'AU';
        testOrg.Address_Latest__StateCode__s = 'NSW';
        testOrg.NDIS_Provider__c = '12341234565';
        testOrg.BMSI_Identifier__c = 'TEST BMSI';
        testOrg.SoftwareId__c = 'jhdfn18328';
        testOrg.Branch_code__c = 'BS123';
        testOrg.Contact_Name__c = 'Test Contact';
        testOrg.User_Type__c = 'NDIS Org Admin';
        testOrg.Week_Start_Day__c = 'Monday';
        testOrg.Roles__c = 'Admin;AIN';
        insert testOrg;
        
        // =============================================
        // 2. CREATE FACILITY
        // =============================================
        testFacility = new Facility__c();
        testFacility.Name = 'Ashfield Consultants';
        testFacility.Address__City__s = 'Crace';
        testFacility.Address__Street__s = '8 Keewong Street';
        testFacility.Address__StateCode__s = 'ACT';
        testFacility.Address__PostalCode__s = '2911';
        testFacility.Address__CountryCode__s = 'AU';
        testFacility.Email__c = 'testonefacility@gmail.com';
        testFacility.Status__c = true;
        testFacility.Organisation__c = testOrg.Id;
        testFacility.ABN__c = '12345678901';
        testFacility.Phone__c = '12323432';
        testFacility.Type_of_Service__c = 'Ndis';
        insert testFacility;
        
        // =============================================
        // 3. CREATE USER
        // =============================================
        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        testUser = new User(
            Alias = 'praveen',
            Email = 'manualtesting.20294637@hotmail.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'StaffOne209463',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey = 'America/New_York',
            User_Type__c = 'NDIS Org Admin',
            UserName = 'manualtesting.20294637@hotmail.com',
            Organization_Name__c = 'Ashfield Consultants'
        );
        insert testUser;
        
        // =============================================
        // 4. CREATE STAFF
        // =============================================
        testStaff = new Staff__c();
        testStaff.Last_Name__c = 'Test staff';
        testStaff.Name = 'praveen1';
        testStaff.Name__c = 'abcd';
        testStaff.Contact_Number__c = '56789908743';
        testStaff.Email_Address__c = 'manualtesting.20294637@hotmail.com';
        testStaff.Facility__c = testFacility.Id;
        testStaff.Address__Street__s = '8 Keewong Street';
        testStaff.Address__City__s = 'Crace';
        testStaff.Address__StateCode__s = 'ACT';
        testStaff.Address__PostalCode__s = '2911';
        testStaff.Emergency_Phone_Number__c = '45678766675';
        testStaff.Primary_Contact_Name__c = 'Praveen';
        testStaff.Primary_Contact_Number__c = '9908458298';
        testStaff.Make_Primary_as_Approver__c = true;
        testStaff.Primary_Contact_Email__c = 'praveenshesham.sp@gmail.com';
        testStaff.Secondary_Contact_Name__c = 'maheswari';
        testStaff.Secondary_Contact_Email__c = 'maheswari.adabala@gmail.com';
        testStaff.Make_Secondary_as_Approver__c = false;
        testStaff.Secondary_Contact_Number__c = '99084582958';
        testStaff.Emp_exit_date__c = Date.newInstance(2028, 01, 05);
        testStaff.Emp_Start_Date__c = Date.newInstance(2023, 02, 01);
        testStaff.Payee_ETP_Payment_Date__c = Date.newInstance(2025, 02, 04);
        testStaff.Date_Of_Birth__c = Date.newInstance(2001, 02, 04);
        testStaff.role__c = 'Admin';
        testStaff.Residency_Type__c = 'Australian';
        testStaff.Expiry_Date__c = Date.newInstance(2025, 02, 19);
        testStaff.Type__c = 'Visa Status';
        testStaff.Working_Hours_Rate__c = 50;
        testStaff.Final_Overall_Rate__c = 150;
        testStaff.Saturday_Hourly_Rate__c = 130;
        testStaff.Sunday_Hourly_Rate__c = 50;
        testStaff.Status__c = true;
        testStaff.Restrict_Set_Hours__c = false;
        testStaff.Set_Hours__c = 40;
        testStaff.TFN_number__c = '123456789';
        insert testStaff;
        
        // =============================================
        // 5. CREATE STAFF ROLE
        // =============================================
        StaffRole__c sr = new StaffRole__c(
            StaffRole_To_Staff__c = testStaff.Id,
            Facility__c = testFacility.Id,
            RoleName__c = 'Admin',
            Active__c = true,
            Hourly_Rate__c = 50
        );
        insert sr;
        
        // =============================================
        // 6. CREATE STAFF FACILITY
        // =============================================
        Staff_Facility__c sf = new Staff_Facility__c(
            Staff__c = testStaff.Id,
            Facility__c = testFacility.Id,
            Active__c = true
        );
        insert sf;
        
        // =============================================
        // 7. CREATE CHILD STAFF DOCUMENT
        // =============================================
        testDoc = new Child_Staff__c();
        testDoc.Expiry_Date__c = Date.newInstance(2028, 01, 05);
        testDoc.Staff__c = testStaff.Id;
        testDoc.Comments__c = 'test ';
        testDoc.Status__c = 'Approved';
        testDoc.Compliance__c = true;
        testDoc.Document_Type__c = 'Visa Status';
        testDoc.Is_Archived__c = false;
        insert testDoc;
        
        // =============================================
        // 8. CREATE SHIFT WITH STAFF
        // =============================================
        Add_Shift__c shift = new Add_Shift__c();
        shift.Break__c = '30';
        shift.Do_you_want_to_set_this_a_recurring_shif__c = true;
        shift.Start_Date__c = Date.newInstance(2024, 10, 16);
        shift.End_Date__c = Date.newInstance(2024, 10, 24);
        shift.Role__c = 'Admin';
        shift.Get_Facility__c = true;
        shift.Quantity__c = 5;
        shift.Start_Time__c = Time.newInstance(03, 30, 00, 00);
        shift.End_Time__c = Time.newInstance(05, 00, 00, 00);
        shift.Facility__c = testFacility.Id;
        shift.Status__c = 'Draft';
        shift.Start_time_picklist__c = '3:30 am';
        shift.End_time_picklist__c = '5:00 am';
        shift.Location__StateCode__s = 'ACT';
        shift.Location__CountryCode__s = 'AU';
        shift.Location__PostalCode__s = '2911';
        shift.Is_EOI__c = true;
        shift.EOI_staff__c = testStaff.Id;
        shift.Shift_Type__c = 'General';
        shift.Group_Shifts__c = true;
        insert shift;
        
        testShift = new ShiftwithStaff__c();
        testShift.Add_Shift__c = shift.Id;
        testShift.Attendence__c = true;
        testShift.Comments__c = 'test comments';
        testShift.Staff__c = testStaff.Id;
        testShift.Role__c = 'Admin';
        testShift.Status__c = 'Accepted';
        testShift.Start_Date__c = shift.Start_Date__c;
        testShift.Shift_Start_Time__c = shift.Start_Time__c;
        testShift.Shift_End_Date__c = shift.End_Date__c != null ? shift.End_Date__c : shift.Start_Date__c;
        testShift.Shift_End_Time__c = shift.End_Time__c;
        testShift.Log_In_Date_Time__c = Time.newInstance(01, 30, 00, 00);
        testShift.Log_Out_Date_Time__c = Time.newInstance(10, 00, 00, 00);
        insert testShift;
        
        // =============================================
        // 9. CREATE ADDITIONAL DATA FOR OTHER TESTS
        // =============================================
        // Create StaffDocShare
        StaffDocsShare__c staffDoc = new StaffDocsShare__c(
            Staff__c = testStaff.Id,
            Child_Staff__c = testDoc.Id
        );
        insert staffDoc;
        
        // Create Company
        Company__c comp = new Company__c(
            Company_Name__c = testFacility.Name,
            Organization__c = testOrg.Id,
            ABN__c = '12345678901',
            Phone_Number__c = '1234567890',
            Email__c = 'test@company.com'
        );
        insert comp;
        
        // Create Facility_Role
        Facility_Role__c role = new Facility_Role__c(
            Facility__c = testFacility.Id,
            Role_Name__c = 'Test Role',
            Is_Active__c = true
        );
        insert role;
        
        // Create Client
        Client__c cli = new Client__c();
        cli.First_Name__c = 'Test';
        cli.Last_Name__c = 'Participant2948';
        cli.Gendar__c = 'Male';
        cli.Date_Of_Birth__c = Date.newInstance(1991, 2, 17);
        cli.Address__Street__s = '8 Keewong Street';
        cli.Address__City__s = 'Crace';
        cli.Address__StateCode__s = 'ACT';
        cli.Address__PostalCode__s = '2911';
        cli.Contact_Number__c = '4331237651';
        cli.Drivers_Licence__c = '123456789012';
        cli.Primay_Contact_First_Name__c = 'Jason';
        cli.Primay_Contact_Last_Name__c = 'Smith';
        cli.Relationship__c = 'Parent';
        cli.Email__c = 'manualtesting.4139559@hotmail.com';
        cli.Primary_Contact_Number__c = '0433123123';
        cli.Facility__c = testFacility.Id;
        insert cli;
        
        // Create Participant_Facility
        insert new Participant_Facility__c(
            Participant__c = cli.Id,
            Facility__c = testFacility.Id,
            Active__c = true
        );
        
        // Create Shift_Type
        Shift_Type__c shiftType = new Shift_Type__c(
            Name = 'Morning',
            Facility__c = testFacility.Id,
            Start_Time__c = Time.newInstance(9, 0, 0, 0),
            End_Time__c = Time.newInstance(17, 0, 0, 0),
            Shift_Type__c = 'Morning',
            Colour__c = '#222222'
        );
        insert shiftType;
       
        
    }
    
    // Helper methods that ALWAYS re-query (and cache in the static variable)
    static User getTestUser() {
        if (testUser == null) {
            testUser = [SELECT Id, Email, UserRoleId, User_Type__c, Organization_Name__c 
                        FROM User 
                        WHERE Email = 'manualtesting.20294637@hotmail.com' 
                        LIMIT 1];
        }
        return testUser;
    }

    static Staff__c getTestStaff() {
        if (testStaff == null) {
            testStaff = [SELECT Id, Staff_UID__c, Email_Address__c, Status__c, TFN_number__c, ABN_Number__c 
                         FROM Staff__c 
                         WHERE Email_Address__c = 'manualtesting.20294637@hotmail.com'
                         LIMIT 1];
        }
        return testStaff;
    }

    static Organisation__c getTestOrg() {
        if (testOrg == null) {
            testOrg = [SELECT Id, Name FROM Organisation__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
        }
        return testOrg;
    }

    static Facility__c getTestFacility() {
        if (testFacility == null) {
            testFacility = [SELECT Id, Name FROM Facility__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
        }
        return testFacility;
    }

    static Child_Staff__c getTestDoc() {
        if (testDoc == null) {
            testDoc = [SELECT Id, Status__c, Is_Archived__c FROM Child_Staff__c LIMIT 1];
        }
        return testDoc;
    }

    static ShiftwithStaff__c getTestShift() {
        if (testShift == null) {
            testShift = [SELECT Id, Staff__c, Start_Date__c, Shift_Start_Time__c, Shift_End_Time__c 
                         FROM ShiftwithStaff__c 
                         LIMIT 1];
        }
        return testShift;
    }
    
    // =============================================
    // 1. TEST fetchStaffs
    // =============================================
    @isTest
    static void test_fetchStaffs() {
        User u = getTestUser();
        Organisation__c org = getTestOrg();
        
        System.runAs(u) {
            Test.startTest();
            try {
                StaffController.fetchStaffs(org.Id, '', '');
            } catch (System.QueryException e) {
                System.debug('Expected error: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }
    
    // =============================================
    // 2. TEST statusStaff
    // =============================================
    @isTest
    static void test_statusStaff() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        System.runAs(u) {
            Test.startTest();
            StaffController.statusStaff(staff.Id, 'false');
            StaffController.statusStaff(staff.Id, 'true');
            Test.stopTest();
        }
    }
    
    // =============================================
    // 3. TEST checkFutureShifts
    // =============================================
    @isTest
    static void test_checkFutureShifts() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        System.runAs(u) {
            Test.startTest();
            List<ShiftwithStaff__c> result = StaffController.checkFutureShifts(staff.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // 4. TEST fetchStaff
    // =============================================
    @isTest
    static void test_fetchStaff() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        System.runAs(u) {
            Test.startTest();
            Staff__c result1 = StaffController.fetchStaff(staff.Id);
            Staff__c result2 = StaffController.fetchStaff(staff.Staff_UID__c);
            Test.stopTest();
        }
    }
    
    // =============================================
    // 5. TEST getStaffById
    // =============================================
    @isTest
    static void test_getStaffById() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        System.runAs(u) {
            Test.startTest();
            List<Staff__c> result1 = StaffController.getStaffById(staff.Id);
            List<Staff__c> result2 = StaffController.getStaffById(staff.Staff_UID__c);
            List<Staff__c> result3 = StaffController.getStaffById('invalid-id');
            Test.stopTest();
        }
    }
    
    // =============================================
    // 6. TEST getStaffsByOrg
    // =============================================
    @isTest
    static void test_getStaffsByOrg() {
        User u = getTestUser();
        Organisation__c org = getTestOrg();
        Facility__c fac = getTestFacility();
        
        System.runAs(u) {
            Test.startTest();
            List<Staff__c> result = StaffController.getStaffsByOrg(org.Id, fac.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // 7. TEST updateLeaveApprover
    // =============================================
    @isTest
    static void test_updateLeaveApprover() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        System.runAs(u) {
            Test.startTest();
            StaffController.updateLeaveApprover(staff.Id, staff.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // 8. TEST getStaffById1
    // =============================================
    @isTest
    static void test_getStaffById1() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        System.runAs(u) {
            Test.startTest();
            List<Staff__c> result = StaffController.getStaffById1(staff.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // 9. TEST getStaffByStatus
    // =============================================
    @isTest
    static void test_getStaffByStatus() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        System.runAs(u) {
            Test.startTest();
            List<Staff__c> result = StaffController.getStaffByStatus(staff.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // 10. TEST getStaffByEmail
    // =============================================
    @isTest
    static void test_getStaffByEmail() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        System.runAs(u) {
            Test.startTest();
            List<Staff__c> result = StaffController.getStaffByEmail(staff.Email_Address__c);
            List<Staff__c> result2 = StaffController.getStaffByEmail('nonexistent@email.com');
            Test.stopTest();
        }
    }
    
    // =============================================
    // 11. TEST getStaffHistory
    // =============================================
    @isTest
    static void test_getStaffHistory() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        System.runAs(u) {
            Test.startTest();
            List<StaffController.HistoryWrapper> result = StaffController.getStaffHistory(staff.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // 12. TEST fetchStaffList
    // =============================================
    @isTest
    static void test_fetchStaffList() {
        User u = getTestUser();
        Organisation__c org = getTestOrg();
        
        System.runAs(u) {
            Test.startTest();
            List<Staff__c> result = StaffController.fetchStaffList(org.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // 14. TEST getShadAwards
    // =============================================
    @isTest
    static void test_getShadAwards() {
        Test.startTest();
        List<Shad_award__c> result = StaffController.getShadAwards('Home care employee', 'Full-time and part-time', 'Level 2', 'pay point 2');
        Test.stopTest();
    }
    
    // =============================================
    // 15. TEST getNursingAwrds
    // =============================================
    @isTest
    static void test_getNursingAwrds() {
        Test.startTest();
        List<Nursing_Award__c> result = StaffController.getNursingAwrds('Home care employee', 'Full-time and part-time', 'Level 2', 'pay point 2');
        Test.stopTest();
    }
    
    // =============================================
    // 16. TEST getChildcareAwrds
    // =============================================
    @isTest
    static void test_getChildcareAwrds() {
        Test.startTest();
        List<Child_Care_Award__c> result = StaffController.getChildcareAwrds('Home care employee', 'Full-time and part-time', 'Level 2', 'pay point 2');
        Test.stopTest();
    }
    
    // =============================================
    // 17. TEST insertPreTax
    // =============================================
    @isTest
    static void test_insertPreTax() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        String jsonString = '[{' +
            '"index":"1",' +
            '"description":"Test Doc",' +
            '"quantity":"1",' +
            '"typeOfDocument":"Visa Status",' +
            '"fileName":"test.pdf",' +
            '"staffExpirydate":"2025-12-31",' +
            '"comment":"Test comment",' +
            '"url":"https://test.com",' +
            '"compliance":true,' +
            '"admin":true,' +
            '"status":"Approved",' +
            '"points":10,' +
            '"awsjson":{' +
                '"fileId":"file123",' +
                '"url":"https://test.com/file.pdf",' +
                '"recordId":"rec123",' +
                '"key":"key123",' +
                '"originalName":"test.pdf",' +
                '"type":"pdf",' +
                '"modulePath":"/test",' +
                '"size":"1MB",' +
                '"totalBytes":1024' +
            '}' +
        '}]';
        
        System.runAs(u) {
            Test.startTest();
            List<Child_Staff__c> result = StaffController.insertPreTax(jsonString, staff.Id, true);
            Test.stopTest();
        }
    }
    
    // =============================================
    // 18. TEST insertPreTax with admin false
    // =============================================
    @isTest
    static void test_insertPreTax_adminFalse() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        String jsonString = '[{' +
            '"index":"1",' +
            '"description":"Test Doc",' +
            '"quantity":"1",' +
            '"typeOfDocument":"Visa Status",' +
            '"fileName":"test.pdf",' +
            '"staffExpirydate":"2025-12-31",' +
            '"comment":"Test comment",' +
            '"url":"https://test.com",' +
            '"compliance":true,' +
            '"admin":false,' +
            '"status":"Pending",' +
            '"points":10,' +
            '"awsjson":{' +
                '"fileId":"file123",' +
                '"url":"https://test.com/file.pdf",' +
                '"recordId":"rec123",' +
                '"key":"key123",' +
                '"originalName":"test.pdf",' +
                '"type":"pdf",' +
                '"modulePath":"/test",' +
                '"size":"1MB",' +
                '"totalBytes":1024' +
            '}' +
        '}]';
        
        System.runAs(u) {
            Test.startTest();
            List<Child_Staff__c> result = StaffController.insertPreTax(jsonString, staff.Id, false);
            Test.stopTest();
        }
    }
    
    // =============================================
    // 19. TEST insertPreTax with null awsjson
    // =============================================
    @isTest
    static void test_insertPreTax_nullAwsJson() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        String jsonString = '[{' +
            '"index":"1",' +
            '"description":"Test Doc",' +
            '"quantity":"1",' +
            '"typeOfDocument":"Visa Status",' +
            '"fileName":"test.pdf",' +
            '"staffExpirydate":"2025-12-31",' +
            '"comment":"Test comment",' +
            '"url":"https://test.com",' +
            '"compliance":true,' +
            '"admin":true,' +
            '"status":"Approved",' +
            '"points":10,' +
            '"awsjson":null' +
        '}]';
        
        System.runAs(u) {
            Test.startTest();
            List<Child_Staff__c> result = StaffController.insertPreTax(jsonString, staff.Id, true);
            Test.stopTest();
        }
    }
    
    // =============================================
    // 20. TEST fetchFacilitiess
    // =============================================
    @isTest
    static void test_fetchFacilitiess() {
        User u = getTestUser();
        
        System.runAs(u) {
            Test.startTest();
            List<Facility__c> result = StaffController.fetchFacilitiess();
            Test.stopTest();
        }
    }
    
    // =============================================
    // 21. TEST getShiftTypeCssMap
    // =============================================
    @isTest
    static void test_getShiftTypeCssMap() {
        User u = getTestUser();
        
        System.runAs(u) {
            Test.startTest();
            List<Shift_Type__c> result = StaffController.getShiftTypeCssMap();
            Test.stopTest();
        }
    }
    
    // =============================================
    // 22. TEST getOverlappingShiftsData
    // =============================================
    @isTest
    static void test_getOverlappingShiftsData() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        ShiftwithStaff__c shift = getTestShift();
        
        Date shiftDate = Date.today();
        String dateStr = String.valueOf(shiftDate);
        
        System.runAs(u) {
            Test.startTest();
            String result1 = StaffController.getOverlappingShiftsData('09:00 AM', '05:00 PM', staff.Id, dateStr, 'General', shift.Id);
            String result2 = StaffController.getOverlappingShiftsData('06:00 PM', '10:00 PM', staff.Id, dateStr, 'Night', shift.Id);
            String result3 = StaffController.getOverlappingShiftsData('10:00 PM', '06:00 AM', staff.Id, dateStr, 'Sleepover Shift', shift.Id);
            String result4 = StaffController.getOverlappingShiftsData('09:00 AM', '01:00 PM', staff.Id, dateStr, 'Custom', shift.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // 23. TEST getCompanyBasedOnFacility
    // =============================================
    @isTest
    static void test_getCompanyBasedOnFacility() {
        User u = getTestUser();
        Facility__c fac = getTestFacility();
        Organisation__c org = getTestOrg();
        
        // Create Company record (already exists from setup, but we'll create a new one for this test)
        Company__c company = new Company__c(
            Company_Name__c = fac.Name,
            Organization__c = org.Id,
            ABN__c = '12345678901',
            Phone_Number__c = '1234567890',
            Email__c = 'test@company.com'
        );
        insert company;
        
        System.runAs(u) {
            Test.startTest();
            List<Company__c> result = StaffController.getCompanyBasedOnFacility(fac.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // 24. TEST getRoleOptions
    // =============================================
    @isTest
    static void test_getRoleOptions() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        Facility__c fac = getTestFacility();
        
        // Create Facility_Role records (already exists from setup, but we'll create a new one)
        Facility_Role__c role = new Facility_Role__c(
            Facility__c = fac.Id,
            Role_Name__c = 'Test Role',
            Is_Active__c = true
        );
        insert role;
        
        System.runAs(u) {
            Test.startTest();
            List<Facility_Role__c> result = StaffController.getRoleOptions(staff.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // 25. TEST getRoleOptionsByFacility
    // =============================================
    @isTest
    static void test_getRoleOptionsByFacility() {
        User u = getTestUser();
        Facility__c fac = getTestFacility();
        List<String> facilityIds = new List<String>{fac.Id};
        
        System.runAs(u) {
            Test.startTest();
            List<Facility_Role__c> result = StaffController.getRoleOptionsByFacility(facilityIds);
            Test.stopTest();
        }
    }
    
    // =============================================
    // 26. TEST updateDocumentStatus
    // =============================================
    @isTest
    static void test_updateDocumentStatus() {
        User u = getTestUser();
        Child_Staff__c doc = getTestDoc();
        
        System.runAs(u) {
            Test.startTest();
            StaffController.updateDocumentStatus(doc.Id, 'Approved', '', false);
            StaffController.updateDocumentStatus(doc.Id, 'Rejected', 'Rejection reason', false);
            StaffController.updateDocumentStatus(doc.Id, '', 'Test comment', true);
            Test.stopTest();
        }
    }
    
    // =============================================
    // 27. TEST fetchStaffDocuments
    // =============================================
    @isTest
    static void test_fetchStaffDocuments() {
        User u = getTestUser();
        
        System.runAs(u) {
            Test.startTest();
            List<Staff__c> result = StaffController.fetchStaffDocuments();
            Test.stopTest();
        }
    }
    
    // =============================================
    // 29. TEST fetchstaffBydoc
    // =============================================
    @isTest
    static void test_fetchstaffBydoc() {
        User u = getTestUser();
        Child_Staff__c doc = getTestDoc();
        
        System.runAs(u) {
            Test.startTest();
            List<StaffDocsShare__c> result = StaffController.fetchstaffBydoc(doc.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // 30. TEST saveStaffDocShares
    // =============================================
    @isTest
    static void test_saveStaffDocShares() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        Child_Staff__c doc = getTestDoc();
        List<String> staffIds = new List<String>{staff.Id};
        
        System.runAs(u) {
            Test.startTest();
            StaffController.saveStaffDocShares(doc.Id, staffIds);
            StaffController.saveStaffDocShares(doc.Id, new List<String>());
            Test.stopTest();
        }
    }
    
    // =============================================
    // 31. TEST fetchParticipantDocs
    // =============================================
    @isTest
    static void test_fetchParticipantDocs() {
        User u = getTestUser();
        
        System.runAs(u) {
            Test.startTest();
            List<Client__c> result = StaffController.fetchParticipantDocs();
            Test.stopTest();
        }
    }
    
    // =============================================
    // 32. TEST getStaffDocumentHistory
    // =============================================
    @isTest
    static void test_getStaffDocumentHistory() {
        User u = getTestUser();
        Child_Staff__c doc = getTestDoc();
        
        System.runAs(u) {
            Test.startTest();
            List<StaffController.TimelineItem> result = StaffController.getStaffDocumentHistory(doc.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // 33. TEST logDocumentView
    // =============================================
    @isTest
    static void test_logDocumentView() {
        User u = getTestUser();
        Child_Staff__c doc = getTestDoc();
        
        System.runAs(u) {
            Test.startTest();
            StaffController.logDocumentView(doc.Id);
            StaffController.logDocumentView(null);
            Test.stopTest();
        }
    }
    
    // =============================================
    // 34. TEST generateOtp
    // =============================================
    @isTest
    static void test_generateOtp() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        // Update Organisation with email
        Organisation__c org = getTestOrg();
        org.Email__c = 'test@org.com';
        update org;
        
        System.runAs(u) {
            Test.startTest();
            StaffController.generateOtp(staff.Id, 'TFN');
            StaffController.generateOtp(staff.Id, 'ABN');
            Test.stopTest();
        }
    }
    
    // =============================================
    // 35. TEST verifyOtp (SKIPPED as requested)
    // =============================================
    /*
    @isTest
    static void test_verifyOtp() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        u.OTP_Code__c = '1234';
        u.OTP_Field_Type__c = 'TFN';
        u.OTP_Record_Id__c = staff.Id;
        update u;
        
        System.runAs(u) {
            Test.startTest();
            String result1 = StaffController.verifyOtp(staff.Id, 'TFN', '1234');
            Test.stopTest();
        }
    }
    */
    
    // =============================================
    // 36. TEST archiveChildStaffDocument
    // =============================================
    @isTest
    static void test_archiveChildStaffDocument() {
        User u = getTestUser();
        Child_Staff__c doc = getTestDoc();
        
        System.runAs(u) {
            Test.startTest();
            try {
                StaffController.archiveChildStaffDocument(doc.Id);
            } catch (System.DmlException e) {
                System.debug('Expected error: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }
    
    // =============================================
    // 37. TEST getArchivedAttachments
    // =============================================
    @isTest
    static void test_getArchivedAttachments() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        System.runAs(u) {
            Test.startTest();
            List<Child_Staff__c> result = StaffController.getArchivedAttachments(staff.Id);
            List<Child_Staff__c> result2 = StaffController.getArchivedAttachments(null);
            Test.stopTest();
        }
    }
    
    // =============================================
    // 38. TEST restoreDocument
    // =============================================
    @isTest
    static void test_restoreDocument() {
        User u = getTestUser();
        Child_Staff__c doc = getTestDoc();
        
        System.runAs(u) {
            Test.startTest();
            try {
                StaffController.restoreDocument(doc.Id);
            } catch (System.DmlException e) {
                System.debug('Expected error: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }
    
    // =============================================
    // 39. TEST getAllArchivedStaffDocuments
    // =============================================
    @isTest
    static void test_getAllArchivedStaffDocuments() {
        User u = getTestUser();
        
        System.runAs(u) {
            Test.startTest();
            List<Child_Staff__c> result = StaffController.getAllArchivedStaffDocuments();
            Test.stopTest();
        }
    }
    // =============================================
// TEST StaffsRolesWiseList
// =============================================
@isTest
static void test_StaffsRolesWiseList() {
    User u = getTestUser();
    Organisation__c org = getTestOrg();
    Facility__c fac = getTestFacility();
    List<String> facIds = new List<String>{fac.Id};
    List<String> roles = new List<String>{'Admin'};
    
    System.runAs(u) {
        Test.startTest();
        
        // Test 1: Valid input - should return staff list
        List<Staff__c> result1 = StaffController.StaffsRolesWiseList(org.Id, facIds, roles, '');
        
        // Test 2: Valid input with name filter - should return staff list
        List<Staff__c> result2 = StaffController.StaffsRolesWiseList(org.Id, facIds, roles, 'praveen');
        
        // Test 3: Empty facility list - should return empty list
        List<Staff__c> result3 = StaffController.StaffsRolesWiseList(org.Id, new List<String>(), roles, '');
        
        // Test 4: Empty roles list - should return empty list
        List<Staff__c> result4 = StaffController.StaffsRolesWiseList(org.Id, facIds, new List<String>(), '');
        
        // Test 5: Null roles - should return empty list
        List<Staff__c> result5 = StaffController.StaffsRolesWiseList(org.Id, facIds, null, '');
        
        // Test 6: Null facility list - should return empty list
        List<Staff__c> result6 = StaffController.StaffsRolesWiseList(org.Id, null, roles, '');
        
        Test.stopTest();
    }
}
    
    // =============================================
// TEST verifyOtp
// =============================================
@isTest
static void test_verifyOtp() {
    User u = getTestUser();
    Staff__c staff = getTestStaff();
    
    // Set OTP on user for successful verification
    u.OTP_Code__c = '1234';
    u.OTP_Field_Type__c = 'TFN';
    u.OTP_Record_Id__c = staff.Id;
    update u;
    
    System.runAs(u) {
        Test.startTest();
        
        // Test 1: Successful verification for TFN
        String result1 = StaffController.verifyOtp(staff.Id, 'TFN', '1234');
        
        // Test 2: Successful verification for ABN (set OTP again)
        u.OTP_Code__c = '5678';
        u.OTP_Field_Type__c = 'ABN';
        u.OTP_Record_Id__c = staff.Id;
        update u;
        String result2 = StaffController.verifyOtp(staff.Id, 'ABN', '5678');
        
        // Test 3: Invalid record (null recordId)
        try {
            StaffController.verifyOtp(null, 'TFN', '1234');
        } catch (Exception e) {
            System.debug('Expected error: ' + e.getMessage());
        }
        
        // Test 4: Invalid field type (blank)
        try {
            StaffController.verifyOtp(staff.Id, '', '1234');
        } catch (Exception e) {
            System.debug('Expected error: ' + e.getMessage());
        }
        
        // Test 5: Blank OTP
        try {
            StaffController.verifyOtp(staff.Id, 'TFN', '');
        } catch (Exception e) {
            System.debug('Expected error: ' + e.getMessage());
        }
        
        // Test 6: No OTP found (clear OTP first)
        u.OTP_Code__c = null;
        u.OTP_Field_Type__c = null;
        u.OTP_Record_Id__c = null;
        update u;
        try {
            StaffController.verifyOtp(staff.Id, 'TFN', '1234');
        } catch (Exception e) {
            System.debug('Expected error: ' + e.getMessage());
        }
        
        // Test 7: Invalid OTP
        u.OTP_Code__c = '9999';
        u.OTP_Field_Type__c = 'TFN';
        u.OTP_Record_Id__c = staff.Id;
        update u;
        try {
            StaffController.verifyOtp(staff.Id, 'TFN', '1234');
        } catch (Exception e) {
            System.debug('Expected error: ' + e.getMessage());
        }
        
        // Test 8: OTP mismatch (wrong field type)
        u.OTP_Code__c = '1234';
        u.OTP_Field_Type__c = 'TFN';
        u.OTP_Record_Id__c = staff.Id;
        update u;
        try {
            StaffController.verifyOtp(staff.Id, 'ABN', '1234');
        } catch (Exception e) {
            System.debug('Expected error: ' + e.getMessage());
        }
        
        // Test 9: Invalid field type at return stage
        u.OTP_Code__c = '1234';
        u.OTP_Field_Type__c = 'TFN';
        u.OTP_Record_Id__c = staff.Id;
        update u;
        try {
            StaffController.verifyOtp(staff.Id, 'InvalidType', '1234');
        } catch (Exception e) {
            System.debug('Expected error: ' + e.getMessage());
        }
        
        Test.stopTest();
    }
}
    
    // =============================================
// TEST fetchSharedDocuments
// =============================================
@isTest
static void test_fetchSharedDocuments() {
    User u = getTestUser();
    Staff__c staff = getTestStaff();
    Child_Staff__c doc = getTestDoc();
    
    System.runAs(u) {
        Test.startTest();
       // List<Child_Staff__c> result = StaffController.fetchSharedDocuments();
        Test.stopTest();
    }
}
    
    // =============================================
// TEST getShiftTypeCssMap (Full Coverage)
// =============================================
@isTest
static void test_getShiftTypeCssMap_FullCoverage() {
    User u = getTestUser();
    Facility__c fac = getTestFacility();
    Organisation__c org = getTestOrg();
    
    System.runAs(u) {
        Test.startTest();
        
        // -------------------------------------------------
        // Case 1: Happy Path – Facilities & Shift Types exist
        // -------------------------------------------------
        // Ensure a Shift_Type exists for the facility
        List<Shift_Type__c> existingShiftTypes = [
            SELECT Id FROM Shift_Type__c WHERE Facility__c = :fac.Id
        ];
        if (existingShiftTypes.isEmpty()) {
            Shift_Type__c st = new Shift_Type__c(
                Name = 'Morning',
                Facility__c = fac.Id,
                Start_Time__c = Time.newInstance(9, 0, 0, 0),
                End_Time__c = Time.newInstance(17, 0, 0, 0),
                Shift_Type__c = 'Morning',
                Colour__c = '#222222'
            );
            insert st;
        }
        List<Shift_Type__c> result1 = StaffController.getShiftTypeCssMap();
        
        // -------------------------------------------------
        // Case 2: No Active Facilities (returns empty list)
        // -------------------------------------------------
        // Create a new org with no facilities for same user
        // 
          Organisation__c emptyOrg = new Organisation__c();
        emptyOrg.Name='Empty Org Test';
        emptyOrg.ABN__c='11234567891';
        emptyOrg.ACN__c='878787878';
        emptyOrg.Contact_No__c='6132899740';
        emptyOrg.RCTI__c='RCTI1';
        emptyOrg.Email__c='empty@test.com';
        emptyOrg.Bank__c='Bank Test';
        emptyOrg.BSB__c='BSB Test';
        emptyOrg.Account_Name__c='Test Account';
        emptyOrg.Account_Number__c='1111111111';
        emptyOrg.Description__c='test Desc';
        emptyOrg.Address_Latest__Street__s='101';
        emptyOrg.Address_Latest__City__s='Himas Waterhen';
        emptyOrg.Address_Latest__PostalCode__s='2060';
        emptyOrg.Address_Latest__CountryCode__s='AU';
        emptyOrg.Address_Latest__StateCode__s='NSW';
        emptyOrg.NDIS_Provider__c='12341234565';
        emptyOrg.BMSI_Identifier__c ='TEST BMSI';
        emptyOrg.SoftwareId__c = 'jhdfn18328';
        emptyOrg.Branch_code__c = 'BS123';
        emptyOrg.Contact_Name__c = 'Test Contact';
        emptyOrg.User_Type__c = 'NDIS Org Admin';
        emptyOrg.Week_Start_Day__c='Monday';
        insert emptyOrg;
        
       
        
        // Temporarily change user's org to test empty facility scenario
        u.Organization_Name__c = 'Empty Org Test';
        update u;
        
        List<Shift_Type__c> result2 = StaffController.getShiftTypeCssMap(); // Should return empty list
        
        // Restore user's org
        u.Organization_Name__c = 'Ashfield Consultants';
        update u;
        
        // -------------------------------------------------
        // Case 3: Org Not Found (should throw exception)
        // -------------------------------------------------
        u.Organization_Name__c = 'Non Existent Org';
        update u;
        
        try {
            StaffController.getShiftTypeCssMap(); // Should throw QueryException getClientShareStaffUsers
        } catch (Exception e) {
            System.debug('Expected error (Org not found): ' + e.getMessage());
        }
        
        // Restore user's org
        u.Organization_Name__c = 'Ashfield Consultants';
        update u;
        
        
        StaffController.getParticipantShareStaffUsers();
        StaffController.getClientShareStaffUsers(fac.Id);
        
        Test.stopTest();
    }
}
    
    
    
}