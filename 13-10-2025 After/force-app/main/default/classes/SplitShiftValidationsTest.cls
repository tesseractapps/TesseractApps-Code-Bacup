@isTest
private class SplitShiftValidationsTest {
    
    @TestSetup
    static void setupTestData() {
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
        org.Address_Latest__Street__s = '101 Test Street';
        org.Address_Latest__City__s = 'Sydney';
        org.Address_Latest__PostalCode__s = '2000';
        org.Address_Latest__CountryCode__s = 'AU';
        org.Address_Latest__StateCode__s = 'NSW';
        org.NDIS_Provider__c = '12341234565';
        org.BMSI_Identifier__c = 'TEST BMSI';
        org.SoftwareId__c = 'jhdfn18328';
        org.Branch_code__c = 'BS123';
        org.Contact_Name__c = 'Test Contact';
        org.User_Type__c = 'NDIS Org Admin';
        insert org;

        Profile prof = [SELECT Id, Name FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        User user = new User(
            Alias = 'praveen', 
            Email = 'manualtesting.2029463227@hotmail.com', 
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
        insert user;

        System.runAs(user) { 
            Facility__c fac = new Facility__c();
            fac.Name = 'Ashfield Facility';
            fac.Address__City__s = 'Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s = 'ACT';
            fac.Address__PostalCode__s = '2911';
            fac.Address__CountryCode__s = 'AU';
            fac.Email__c = 'testonefacility111@gmail.com';
            fac.Status__c = true;
            fac.Organisation__c = org.Id;
            fac.ABN__c = '3673232323';
            fac.Phone__c = '123123123';
            insert fac;
            
            Staff__c staff = new Staff__c();
            staff.Last_Name__c = 'Test staff';
            staff.Name = 'praveen1';
            staff.Name__c = 'abcd';
            staff.Contact_Number__c = '56789908743';
            staff.Email_Address__c = 'manualtesting.2029463227@hotmail.com';
            staff.Facility__c = fac.Id;
            staff.Address__Street__s = '8 Keewong Street';
            staff.Address__City__s = 'Crace';
            staff.Address__StateCode__s = 'NSW';
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
            staff.Module_Names__c = 'Admin';
            staff.Public_holiday_Hourly_Rate__c = 50;
            staff.Afternoon_shift_Hourly_Rate__c = 60;
            staff.Night_shift_Hourly_Rate__c = 70;
            staff.Sleepover_Allowance__c = 100;
            insert staff; 
        }

        // Public Holiday for validation
        insert new Public_Holiday__c(
            Date__c = Date.today().addDays(1),
            State__c = 'New South Wales',
            Holiday_Name__c = 'Test Holiday'
        );
    }
    
    // Helper method to create test shift segments
    private static List<SplitShiftValidations.ShiftSegment> createTestSegments() {
        List<SplitShiftValidations.ShiftSegment> segments = new List<SplitShiftValidations.ShiftSegment>();
        
        SplitShiftValidations.ShiftSegment seg1 = new SplitShiftValidations.ShiftSegment();
        seg1.id = 'seg1';
        seg1.shifttype = 'General';
        seg1.starttime = '09:00';
        seg1.endtime = '12:00';
        seg1.rateLabel = 'Standard';
        seg1.rowOnchangeOccured = false;
        seg1.index = 0;
        segments.add(seg1);
        
        SplitShiftValidations.ShiftSegment seg2 = new SplitShiftValidations.ShiftSegment();
        seg2.id = 'seg2';
        seg2.shifttype = 'Afternoon';
        seg2.starttime = '12:00';
        seg2.endtime = '17:00';
        seg2.rateLabel = 'Afternoon';
        seg2.rowOnchangeOccured = false;
        seg2.index = 1;
        segments.add(seg2);
        
        return segments;
    }
    
    @IsTest
    static void testValidateAndEnrichShifts_Success() {
        
         User u1= [SELECT Id from User where email='manualtesting.2029463227@hotmail.com' LIMIT 1];
          System.runAs(u1){ 
        // Get test data
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        Date startDate = Date.today();
        Date endDate = Date.today();
        String startTime = '09:00';
        String endTime = '17:00';
        
        List<SplitShiftValidations.ShiftSegment> segments = createTestSegments();
        String segmentsJson = JSON.serialize(segments);
        
        Test.startTest();
        SplitShiftValidations.ValidationResult result = SplitShiftValidations.validateAndEnrichShifts(
            startDate, startTime, endDate, endTime, segmentsJson, staff.Id
        );
        Test.stopTest();
          }
        // Assertions
    }
    
    @IsTest
    static void testValidateAndEnrichShifts_OvernightShift() {
        
         User u1= [SELECT Id from User where email='manualtesting.2029463227@hotmail.com' LIMIT 1];
          System.runAs(u1){ 
        // Get test data
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        Date startDate = Date.today();
        Date endDate = Date.today().addDays(1);
        String startTime = '22:00';
        String endTime = '06:00';
        
        List<SplitShiftValidations.ShiftSegment> segments = new List<SplitShiftValidations.ShiftSegment>();
        
        SplitShiftValidations.ShiftSegment seg1 = new SplitShiftValidations.ShiftSegment();
        seg1.id = 'seg1';
        seg1.shifttype = 'Night';
        seg1.starttime = '22:00';
        seg1.endtime = '02:00';
        seg1.rowOnchangeOccured = false;
        segments.add(seg1);
        
        SplitShiftValidations.ShiftSegment seg2 = new SplitShiftValidations.ShiftSegment();
        seg2.id = 'seg2';
        seg2.shifttype = 'Night Shift';
        seg2.starttime = '02:00';
        seg2.endtime = '06:00';
        seg2.rowOnchangeOccured = false;
        segments.add(seg2);
        
        String segmentsJson = JSON.serialize(segments);
        
        Test.startTest();
        SplitShiftValidations.ValidationResult result = SplitShiftValidations.validateAndEnrichShifts(
            startDate, startTime, endDate, endTime, segmentsJson, staff.Id
        );
        Test.stopTest();
          }
       
    }
    
    @IsTest
    static void testValidateAndEnrichShifts_WithHoliday() {
        
         User u1= [SELECT Id from User where email='manualtesting.2029463227@hotmail.com' LIMIT 1];
          System.runAs(u1){ 
        // Get test data
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        Public_Holiday__c holiday = [SELECT Date__c FROM Public_Holiday__c LIMIT 1];
        
        Date startDate = holiday.Date__c;
        Date endDate = holiday.Date__c;
        String startTime = '09:00';
        String endTime = '17:00';
        
        List<SplitShiftValidations.ShiftSegment> segments = createTestSegments();
        String segmentsJson = JSON.serialize(segments);
        
        Test.startTest();
        SplitShiftValidations.ValidationResult result = SplitShiftValidations.validateAndEnrichShifts(
            startDate, startTime, endDate, endTime, segmentsJson, staff.Id
        );
        Test.stopTest();
          }
     
    }
    
    @IsTest
    static void testValidateAndEnrichShifts_EmptySegments() {
        
         User u1= [SELECT Id from User where email='manualtesting.2029463227@hotmail.com' LIMIT 1];
          System.runAs(u1){ 
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        Test.startTest();
        SplitShiftValidations.ValidationResult result = SplitShiftValidations.validateAndEnrichShifts(
            Date.today(), '09:00', Date.today(), '17:00', '[]', staff.Id
        );
        Test.stopTest();
          }
        
    }
    
    @IsTest
    static void testValidateAndEnrichShifts_MissingTimes() {
        
         User u1= [SELECT Id from User where email='manualtesting.2029463227@hotmail.com' LIMIT 1];
          System.runAs(u1){ 
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        List<SplitShiftValidations.ShiftSegment> segments = new List<SplitShiftValidations.ShiftSegment>();
        SplitShiftValidations.ShiftSegment seg = new SplitShiftValidations.ShiftSegment();
        seg.id = 'seg1';
        seg.shifttype = 'General';
        seg.starttime = ''; // Missing start time
        seg.endtime = '12:00';
        segments.add(seg);
        
        String segmentsJson = JSON.serialize(segments);
        
        Test.startTest();
        SplitShiftValidations.ValidationResult result = SplitShiftValidations.validateAndEnrichShifts(
            Date.today(), '09:00', Date.today(), '17:00', segmentsJson, staff.Id
        );
        Test.stopTest();
          }
      
    }
    
    @IsTest
    static void testValidateAndEnrichShifts_TimeSequenceError() {
       
         User u1= [SELECT Id from User where email='manualtesting.2029463227@hotmail.com' LIMIT 1];
          System.runAs(u1){ 
         Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        List<SplitShiftValidations.ShiftSegment> segments = new List<SplitShiftValidations.ShiftSegment>();
        SplitShiftValidations.ShiftSegment seg = new SplitShiftValidations.ShiftSegment();
        seg.id = 'seg1';
        seg.shifttype = 'General';
        seg.starttime = '12:00';
        seg.endtime = '09:00'; // End before start
        segments.add(seg);
        
        String segmentsJson = JSON.serialize(segments);
        
        Test.startTest();
        SplitShiftValidations.ValidationResult result = SplitShiftValidations.validateAndEnrichShifts(
            Date.today(), '09:00', Date.today(), '17:00', segmentsJson, staff.Id
        );
        Test.stopTest();
        
          }
    }
    
    @IsTest
    static void testValidateAndEnrichShifts_EndTimeMismatch() {
        
         User u1= [SELECT Id from User where email='manualtesting.2029463227@hotmail.com' LIMIT 1];
          System.runAs(u1){ 
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        List<SplitShiftValidations.ShiftSegment> segments = new List<SplitShiftValidations.ShiftSegment>();
        SplitShiftValidations.ShiftSegment seg = new SplitShiftValidations.ShiftSegment();
        seg.id = 'seg1';
        seg.shifttype = 'General';
        seg.starttime = '09:00';
        seg.endtime = '16:00'; // Doesn't match shift end time 17:00
        segments.add(seg);
        
        String segmentsJson = JSON.serialize(segments);
        
        Test.startTest();
        SplitShiftValidations.ValidationResult result = SplitShiftValidations.validateAndEnrichShifts(
            Date.today(), '09:00', Date.today(), '17:00', segmentsJson, staff.Id
        );
        Test.stopTest();
          }
  
    }
    
    @IsTest
    static void testValidateAndEnrichShifts_OverlapDetection() {
        
         User u1= [SELECT Id from User where email='manualtesting.2029463227@hotmail.com' LIMIT 1];
          System.runAs(u1){ 
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        List<SplitShiftValidations.ShiftSegment> segments = new List<SplitShiftValidations.ShiftSegment>();
        
        SplitShiftValidations.ShiftSegment seg1 = new SplitShiftValidations.ShiftSegment();
        seg1.id = 'seg1';
        seg1.shifttype = 'General';
        seg1.starttime = '09:00';
        seg1.endtime = '12:00';
        seg1.rowOnchangeOccured = false;
        segments.add(seg1);
        
        SplitShiftValidations.ShiftSegment seg2 = new SplitShiftValidations.ShiftSegment();
        seg2.id = 'seg2';
        seg2.shifttype = 'General';
        seg2.starttime = '11:00'; // Overlaps with previous segment
        seg2.endtime = '17:00';
        seg2.rowOnchangeOccured = false;
        segments.add(seg2);
        
        String segmentsJson = JSON.serialize(segments);
        
        Test.startTest();
        SplitShiftValidations.ValidationResult result = SplitShiftValidations.validateAndEnrichShifts(
            Date.today(), '09:00', Date.today(), '17:00', segmentsJson, staff.Id
        );
        Test.stopTest();
          }
        
    }
    
    @IsTest
    static void testGetStaffRates() {
        
         User u1= [SELECT Id from User where email='manualtesting.2029463227@hotmail.com' LIMIT 1];
          System.runAs(u1){ 
        Staff__c testStaff = [SELECT Id FROM Staff__c LIMIT 1];
        
        Test.startTest();
        Staff__c result = SplitShiftValidations.getStaffRates(testStaff.Id);
        Test.stopTest();
          }
    }
    
  /*  @IsTest
    static void testGetHolidaysByDate() {
        Public_Holiday__c holiday = [SELECT Date__c FROM Public_Holiday__c LIMIT 1];
        
        Test.startTest();
        Map<Date, Public_Holiday__c> result = SplitShiftValidations.getHolidaysByDate(
            holiday.Date__c.addDays(-1), 
            holiday.Date__c.addDays(1)
        );
        Test.stopTest();
    }*/
    
 /*   @IsTest
    static void testGetOrganizationState() {
        Test.startTest();
        String state = SplitShiftValidations.getOrganizationState();
        Test.stopTest();
        
    }*/
    
  
    
    @IsTest
    static void testToDateTimeUTC() {
        
         User u1= [SELECT Id from User where email='manualtesting.2029463227@hotmail.com' LIMIT 1];
          System.runAs(u1){ 
        Date testDate = Date.today();
        String testTime = '14:30';
        
        Test.startTest();
        DateTime result = SplitShiftValidations.toDateTimeUTC(testDate, testTime);
        Test.stopTest();
          }
  
    }
    
    @IsTest
    static void testCalculateEndTime() {
        
         User u1= [SELECT Id from User where email='manualtesting.2029463227@hotmail.com' LIMIT 1];
          System.runAs(u1){ 
        DateTime startDT = DateTime.newInstance(Date.today(), Time.newInstance(9, 0, 0, 0));
        String endTime = '17:00';
        
        Test.startTest();
        DateTime result = SplitShiftValidations.calculateEndTime(startDT, endTime);
        Test.stopTest();
          }
    }
    
    @IsTest
    static void testCalculateEndTime_Overnight() {
        
         User u1= [SELECT Id from User where email='manualtesting.2029463227@hotmail.com' LIMIT 1];
          System.runAs(u1){ 
        DateTime startDT = DateTime.newInstance(Date.today(), Time.newInstance(22, 0, 0, 0));
        String endTime = '02:00'; // Next day
        
        Test.startTest();
        DateTime result = SplitShiftValidations.calculateEndTime(startDT, endTime);
        Test.stopTest();
          }
   
    }
    
    @IsTest
    static void testExceptionHandling() {
        
         User u1= [SELECT Id from User where email='manualtesting.2029463227@hotmail.com' LIMIT 1];
          System.runAs(u1){ 
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        // Pass invalid JSON to trigger exception
        Test.startTest();
        SplitShiftValidations.ValidationResult result = SplitShiftValidations.validateAndEnrichShifts(
            Date.today(), '09:00', Date.today(), '17:00', 'invalid json', staff.Id
        );
        Test.stopTest();
          }
      
    }
}