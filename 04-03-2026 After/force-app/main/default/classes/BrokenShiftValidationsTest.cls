@IsTest
public class BrokenShiftValidationsTest {
    
    @TestSetup
    static void setupTestData() {
        // Create Organisation
        Organisation__c org = new Organisation__c();
        org.Name = 'Ashfield Consultants';
        org.ABN__c = '11234567891';
        org.ACN__c = '878787878';
        org.Contact_No__c = '6132899740';
        org.RCTI__c = 'RCTI1';
        org.Email__c = 'dsfdsfsd@gmail.com';
        org.Bank__c = 'Bank Test';
        org.BSB__c = 'BSB Test';
        org.Account_Name__c = 'Test Account';
        org.Account_Number__c = '1111111111';
        org.Description__c = 'test Desc';
        org.Address_Latest__Street__s = '101';
        org.Address_Latest__City__s = 'Himas Waterhen';
        org.Address_Latest__StateCode__s = 'NSW';
        org.Address_Latest__PostalCode__s = '2060';
        org.Address_Latest__CountryCode__s = 'AU';
        org.NDIS_Provider__c = '12341234565';
        org.BMSI_Identifier__c = 'TEST BMSI';
        org.SoftwareId__c = 'jhdfn18328';
        org.Branch_code__c = 'BS123';
        org.Contact_Name__c = 'Test Contact';
        org.User_Type__c = 'NDIS Org Admin';
        org.Roles__c = 'Admin;AIN';
        insert org;
        
        // Create Profile
        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        
        // Create User with Organization_Name__c populated
        User testUser = new User(
            Alias = 'test',
            Email = 'testuser@test.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'Test User',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey = 'America/New_York',
            User_Type__c = 'NDIS Org Admin',
            UserName = 'testuser.brokenshift@test.com',
            Organization_Name__c = 'Ashfield Consultants' // Critical for getOrganizationState()
        );
        insert testUser;
        
        // Create Facility
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
        fac.ABN__c = '12345678912';
        fac.Phone__c = '12323432';
        fac.Type_of_Service__c = 'Ndis';
        insert fac;
        
        // Create Staff
        Staff__c staff = new Staff__c();
        staff.Last_Name__c = 'Test staff';
        staff.Name = 'praveen1';
        staff.Name__c = 'abcd';
        staff.Contact_Number__c = '56789908743';
        staff.Email_Address__c = 'staff@test.com';
        staff.Facility__c = fac.Id;
        staff.Address__Street__s = '8 Keewong Street';
        staff.Address__City__s = 'Crace';
        staff.Address__StateCode__s = 'ACT';
        staff.Address__PostalCode__s = '2911';
        staff.Emergency_Phone_Number__c = '45678766675';
        staff.Primary_Contact_Name__c = 'Praveen';
        staff.Primary_Contact_Number__c = '9908458298';
        staff.Make_Primary_as_Approver__c = true;
        staff.Primary_Contact_Email__c = 'praveenshesham.sp@gmail.com';
        staff.Secondary_Contact_Name__c = 'maheswari';
        staff.Secondary_Contact_Email__c = 'maheswari.adabala@gmail.com';
        staff.Make_Secondary_as_Approver__c = false;
        staff.Secondary_Contact_Number__c = '99084582958';
        staff.Emp_exit_date__c = Date.newInstance(2028, 01, 05);
        staff.Emp_Start_Date__c = Date.newInstance(2023, 02, 01);
        staff.Payee_ETP_Payment_Date__c = Date.newInstance(2025, 02, 04);
        staff.Date_Of_Birth__c = Date.newInstance(2001, 02, 04);
        staff.role__c = 'Admin';
        staff.Residency_Type__c = 'Australian';
        staff.Expiry_Date__c = Date.newInstance(2025, 02, 19);
        staff.Type__c = 'Visa Status';
        staff.Working_Hours_Rate__c = 50;
        staff.Final_Overall_Rate__c = 150;
        staff.Saturday_Hourly_Rate__c = 130;
        staff.Sunday_Hourly_Rate__c = 50;
        staff.Status__c = true;
        insert staff;
        
        // Create Staff Role with allowance fields
        StaffRole__c sr = new StaffRole__c(
            StaffRole_To_Staff__c = staff.Id,
            RoleName__c = 'Admin',
            Active__c = true,
            Hourly_Rate__c = 50,
            Allowance_one_unpaid_Break__c = 10,
            Allowance_two_unpaid_Breaks__c = 20
        );
        insert sr;
        
        // Create Public Holiday for NSW (matching org address)
        Public_Holiday__c testHoliday = new Public_Holiday__c(
            Date__c = Date.today().addDays(5),
            State__c = 'New South Wales',
            Holiday_Name__c = 'Australia Day'
        );
        insert testHoliday;
        
        // Create Add_Shift__c
        Add_Shift__c shift = new Add_Shift__c();
        shift.Break__c = '30';
        shift.Do_you_want_to_set_this_a_recurring_shif__c = true;
        shift.Start_Date__c = Date.newInstance(2024, 10, 16);
        shift.End_Date__c = Date.newInstance(2024, 10, 24);
        shift.Role__c = 'Admin';
        shift.Get_Facility__c = true;
        shift.Quantity__c = 5;
        shift.Start_Time__c = Time.newInstance(3, 30, 0, 0);
        shift.End_Time__c = Time.newInstance(5, 0, 0, 0);
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
        
        // Create ShiftwithStaff__c records
        ShiftwithStaff__c staffs1 = new ShiftwithStaff__c();
        staffs1.Add_Shift__c = shift.Id;
        staffs1.Attendence__c = true;
        staffs1.Comments__c = 'test comments';
        staffs1.Staff__c = staff.Id;
        staffs1.Role__c = 'Admin';
        staffs1.Status__c = 'Accepted';
        staffs1.Index__c = 1;
        staffs1.Shift_Calculated_Duration__c = 3;
        staffs1.Log_In_Date_Time__c = Time.newInstance(1, 30, 0, 0);
        staffs1.Log_Out_Date_Time__c = Time.newInstance(10, 0, 0, 0);
        insert staffs1;
        
        ShiftwithStaff__c staffs2 = new ShiftwithStaff__c();
        staffs2.Add_Shift__c = shift.Id;
        staffs2.Attendence__c = true;
        staffs2.Comments__c = 'test comments';
        staffs2.Staff__c = staff.Id;
        staffs2.Role__c = 'Admin';
        staffs2.Status__c = 'Accepted';
        staffs2.Index__c = 2;
        staffs2.Shift_Calculated_Duration__c = 2.5;
        staffs2.Log_In_Date_Time__c = Time.newInstance(11, 30, 0, 0);
        staffs2.Log_Out_Date_Time__c = Time.newInstance(14, 0, 0, 0);
        insert staffs2;
    }
    
    @IsTest
    static void testValidateBrokenShiftSegments_ValidTwoSegments() {
        // Run as the test user to ensure Organization_Name__c is available
        User testUser = [SELECT Id FROM User WHERE Email = 'testuser@test.com' LIMIT 1];
        
        System.runAs(testUser) {
            // Setup
            Staff__c testStaff = [SELECT Id, Employment_Type__c FROM Staff__c LIMIT 1];
            
            Date shiftDate = Date.today();
            String startTime = '09:00';
            String endTime = '17:00';
            
            // Create segments (morning and afternoon with break)
            List<BrokenShiftValidations.ShiftSegment> segments = new List<BrokenShiftValidations.ShiftSegment>();
            
            BrokenShiftValidations.ShiftSegment seg1 = new BrokenShiftValidations.ShiftSegment();
            seg1.id = '1';
            seg1.shifttype = 'Regular';
            seg1.starttime = '09:00';
            seg1.endtime = '12:00';
            seg1.rateLabel = 'Standard';
            seg1.rowOnchangeOccured = false;
            segments.add(seg1);
            
            BrokenShiftValidations.ShiftSegment seg2 = new BrokenShiftValidations.ShiftSegment();
            seg2.id = '2';
            seg2.shifttype = 'Regular';
            seg2.starttime = '13:00';
            seg2.endtime = '17:00';
            seg2.rateLabel = 'Standard';
            seg2.rowOnchangeOccured = false;
            segments.add(seg2);
            
            String segmentsJson = JSON.serialize(segments);
            
            // Test
            Test.startTest();
            BrokenShiftValidations.ValidationResult result = BrokenShiftValidations.validateBrokenShiftSegments(
                shiftDate, startTime, shiftDate, endTime, segmentsJson, 'Part-time', testStaff.Id, 'Admin'
            );
            Test.stopTest();
            
            
        }
    }
    
    @IsTest
    static void testValidateBrokenShiftSegments_WithHoliday() {
        // Run as the test user
        User testUser = [SELECT Id FROM User WHERE Email = 'testuser@test.com' LIMIT 1];
        
        System.runAs(testUser) {
            // Setup
            Staff__c testStaff = [SELECT Id, Employment_Type__c FROM Staff__c LIMIT 1];
            Public_Holiday__c holiday = [SELECT Id, Date__c FROM Public_Holiday__c LIMIT 1];
            
            Date shiftDate = holiday.Date__c; // Use holiday date
            String startTime = '09:00';
            String endTime = '17:00';
            
            List<BrokenShiftValidations.ShiftSegment> segments = new List<BrokenShiftValidations.ShiftSegment>();
            
            BrokenShiftValidations.ShiftSegment seg1 = new BrokenShiftValidations.ShiftSegment();
            seg1.id = '1';
            seg1.shifttype = 'Regular';
            seg1.starttime = '09:00';
            seg1.endtime = '12:00';
            seg1.rateLabel = 'Standard';
            seg1.rowOnchangeOccured = false;
            segments.add(seg1);
            
            BrokenShiftValidations.ShiftSegment seg2 = new BrokenShiftValidations.ShiftSegment();
            seg2.id = '2';
            seg2.shifttype = 'Regular';
            seg2.starttime = '13:00';
            seg2.endtime = '17:00';
            seg2.rateLabel = 'Standard';
            seg2.rowOnchangeOccured = false;
            segments.add(seg2);
            
            String segmentsJson = JSON.serialize(segments);
            
            // Test
            Test.startTest();
            BrokenShiftValidations.ValidationResult result = BrokenShiftValidations.validateBrokenShiftSegments(
                shiftDate, startTime, shiftDate, endTime, segmentsJson, 'Part-time', testStaff.Id, 'Admin'
            );
            Test.stopTest();
            
        }
    }
    
    @IsTest
    static void testValidateBrokenShiftSegments_NoBreaks() {
        User testUser = [SELECT Id FROM User WHERE Email = 'testuser@test.com' LIMIT 1];
        
        System.runAs(testUser) {
            // Setup
            Staff__c testStaff = [SELECT Id FROM Staff__c LIMIT 1];
            
            Date shiftDate = Date.today();
            String startTime = '09:00';
            String endTime = '17:00';
            
            // Create continuous segments (no break)
            List<BrokenShiftValidations.ShiftSegment> segments = new List<BrokenShiftValidations.ShiftSegment>();
            
            BrokenShiftValidations.ShiftSegment seg1 = new BrokenShiftValidations.ShiftSegment();
            seg1.id = '1';
            seg1.shifttype = 'Regular';
            seg1.starttime = '09:00';
            seg1.endtime = '12:00';
            seg1.rateLabel = 'Standard';
            seg1.rowOnchangeOccured = false;
            segments.add(seg1);
            
            BrokenShiftValidations.ShiftSegment seg2 = new BrokenShiftValidations.ShiftSegment();
            seg2.id = '2';
            seg2.shifttype = 'Regular';
            seg2.starttime = '12:00'; // No break
            seg2.endtime = '17:00';
            seg2.rateLabel = 'Standard';
            seg2.rowOnchangeOccured = false;
            segments.add(seg2);
            
            String segmentsJson = JSON.serialize(segments);
            
            // Test
            Test.startTest();
            BrokenShiftValidations.ValidationResult result = BrokenShiftValidations.validateBrokenShiftSegments(
                shiftDate, startTime, shiftDate, endTime, segmentsJson, 'Part-time', testStaff.Id, 'Admin'
            );
            Test.stopTest();
            
            
        }
    }
    
    @IsTest
    static void testValidateBrokenShiftSegments_MinimumEngagement() {
        User testUser = [SELECT Id FROM User WHERE Email = 'testuser@test.com' LIMIT 1];
        
        System.runAs(testUser) {
            // Setup
            Staff__c testStaff = [SELECT Id FROM Staff__c LIMIT 1];
            
            Date shiftDate = Date.today();
            String startTime = '09:00';
            String endTime = '10:30'; // Only 1.5 hours total
            
            List<BrokenShiftValidations.ShiftSegment> segments = new List<BrokenShiftValidations.ShiftSegment>();
            
            BrokenShiftValidations.ShiftSegment seg1 = new BrokenShiftValidations.ShiftSegment();
            seg1.id = '1';
            seg1.shifttype = 'Regular';
            seg1.starttime = '09:00';
            seg1.endtime = '09:45';
            seg1.rateLabel = 'Standard';
            seg1.rowOnchangeOccured = false;
            segments.add(seg1);
            
            BrokenShiftValidations.ShiftSegment seg2 = new BrokenShiftValidations.ShiftSegment();
            seg2.id = '2';
            seg2.shifttype = 'Regular';
            seg2.starttime = '10:00'; // 15 min break
            seg2.endtime = '10:30';
            seg2.rateLabel = 'Standard';
            seg2.rowOnchangeOccured = false;
            segments.add(seg2);
            
            String segmentsJson = JSON.serialize(segments);
            
            // Test
            Test.startTest();
            BrokenShiftValidations.ValidationResult result = BrokenShiftValidations.validateBrokenShiftSegments(
                shiftDate, startTime, shiftDate, endTime, segmentsJson, 'Part-time', testStaff.Id, 'Admin'
            );
            Test.stopTest();
            
           
        }
    }
    
    @IsTest
    static void testGetBrokenShiftsData() {
        // Setup
        Add_Shift__c testAddShift = [SELECT Id FROM Add_Shift__c LIMIT 1];
        
        // Test
        Test.startTest();
        List<ShiftwithStaff__c> results = BrokenShiftValidations.getBrokenShiftsData(testAddShift.Id);
        Test.stopTest();
        
      
    }
    
    @IsTest
    static void testValidateBrokenShiftSegments_EmptySegments() {
        User testUser = [SELECT Id FROM User WHERE Email = 'testuser@test.com' LIMIT 1];
        
        System.runAs(testUser) {
            // Setup
            Staff__c testStaff = [SELECT Id FROM Staff__c LIMIT 1];
            
            Date shiftDate = Date.today();
            String startTime = '09:00';
            String endTime = '17:00';
            String segmentsJson = '[]';
            
            // Test
            Test.startTest();
            BrokenShiftValidations.ValidationResult result = BrokenShiftValidations.validateBrokenShiftSegments(
                shiftDate, startTime, shiftDate, endTime, segmentsJson, 'Part-time', testStaff.Id, 'Admin'
            );
            Test.stopTest();
            
          
        }
    }
}