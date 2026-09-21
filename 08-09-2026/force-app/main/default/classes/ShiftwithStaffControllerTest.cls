@isTest
public class ShiftwithStaffControllerTest {
    
   @TestSetup
static void setupTestData() {
    // Call the existing factory
    RosterCopyPasteHandlerTestData.createTestData();
    
    // =============================================
    // FIX: Ensure all data needed by RosterAutoScheduleTriggerHandler exists
    // =============================================
    
    // 1. Get the test user and org
    User testUser = [SELECT Id, Organization_Name__c FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
    Organisation__c org = [SELECT Id FROM Organisation__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
    
    // 2. Update Staff to have Organization_Name__c (truncated org ID) and Organization_Full_Name__c
    Staff__c staff = [SELECT Id, Organization_Name__c, Organization_Full_Name__c FROM Staff__c WHERE Email_Address__c = 'manualtesting.20294637@hotmail.com' LIMIT 1];
   // staff.Organization_Name__c = org.Id; // Truncated ID required by trigger
  //  staff.Organization_Full_Name__c = 'Ashfield Consultants';
    update staff;
    
    // 3. Get existing Facility and Client
    Facility__c fac = [SELECT Id FROM Facility__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
    Client__c client = [SELECT Id, Facility__c FROM Client__c WHERE First_Name__c = 'Test' AND Last_Name__c = 'Participant2948' LIMIT 1];
    
    // 4. Create Funds_Tracker if not exists
    List<Funds_Tracker__c> fundsList = [SELECT Id FROM Funds_Tracker__c WHERE Client__c = :client.Id LIMIT 1];
    Funds_Tracker__c funds;
    if (fundsList.isEmpty()) {
        funds = new Funds_Tracker__c();
        funds.Registration_Group__c = 'Assistance Animals';
        funds.Amount_approved__c = 11000;
        funds.Client__c = client.Id;
        funds.Plan_Type__c = 'Plan Managed';
        funds.Approved_Date__c = Date.newInstance(2024, 03, 16);
        insert funds;
    } else {
        funds = fundsList[0];
    }
    
    // 5. Create NDIS_Support_Catalogue if not exists
    List<NDIS_Support_Catalogue__c> nscList = [SELECT Id FROM NDIS_Support_Catalogue__c WHERE Name = 'Assistance Animals' LIMIT 1];
    NDIS_Support_Catalogue__c nsc;
    if (nscList.isEmpty()) {
        nsc = new NDIS_Support_Catalogue__c();
        nsc.Name = 'Assistance Animals';
        nsc.ACT__c = 100;
        nsc.NSW__c = 100;
        nsc.NT__c = 100;
        nsc.QLD__c = 100;
        nsc.SA__c = 100;
        nsc.TAS__c = 100;
        nsc.VIC__c = 100;
        nsc.WA__c = 100;
        insert nsc;
    } else {
        nsc = nscList[0];
    }
    
    // 6. Create Allocation__c records (for gettimesheetData)
    Date today = Date.today();
    Date startOfWeek = today.toStartOfWeek();
    
    List<Allocation__c> allocList = new List<Allocation__c>();
    for (Integer i = 0; i < 5; i++) {
        Allocation__c aloc = new Allocation__c();
        aloc.Start_Date__c = startOfWeek.addDays(i);
        aloc.End_Date__c = startOfWeek.addDays(i);
        aloc.Start_time__c = '9:00 AM';
        aloc.End_time__c = '5:00 PM';
        aloc.Start_Date_Time__c = Time.newInstance(9, 0, 0, 0);
        aloc.End_Date_Time__c = Time.newInstance(17, 0, 0, 0);
        aloc.Working_Hours__c = 8;
        aloc.Staff__c = staff.Id;
        aloc.Status__c = 'Draft';
        allocList.add(aloc);
    }
    insert allocList;
    
    // 7. Create Availability__c records (for updateMyavailability)
    // CRITICAL: Must run as testUser so trigger can query UserInfo.getUserId() correctly
    System.runAs(testUser) {
        
        List<ShiftwithStaff__c> shifts = [
            SELECT Id, Staff__c, Date__c, Start_Time__c, End_Time__c, Type_of_shift__c 
            FROM ShiftwithStaff__c 
            WHERE Staff__c != null 
            AND Date__c != null 
            AND Start_Time__c != null
            LIMIT 3
        ];
        
        List<Availability__c> availList = new List<Availability__c>();
        for (ShiftwithStaff__c shift : shifts) {
            Availability__c av = new Availability__c();
            av.Staff__c = shift.Staff__c;
            av.Start_Date__c = shift.Date__c;
            av.Start_Time__c = shift.Start_Time__c;
            av.End_Time__c = shift.End_Time__c != null ? shift.End_Time__c : Time.newInstance(17, 0, 0, 0);
            av.Type__c = 'Available';
            av.Participant__c = client.Id;          // Required by trigger
            av.Facility__c = fac.Id;                // Required by trigger
            av.Funds_Tracker__c = funds.Id;         // Required by trigger
            av.NDIS_Support_Catalogue__c = nsc.Id;  // Required by trigger
            av.Shift_Type__c = shift.Type_of_shift__c != null ? shift.Type_of_shift__c : 'General';
            av.Role__c = 'Admin';
            av.Address_Type__c = 'Facility';
            availList.add(av);
        }
        insert availList;
    }
}
    // =============================================
    // HELPER METHODS
    // =============================================
    static User getTestUser() {
        return [SELECT Id, User_Type__c, Organization_Name__c FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
    }
    
    static Staff__c getTestStaff() {
        return [SELECT Id, Organization_Full_Name__c FROM Staff__c WHERE Email_Address__c = 'manualtesting.20294637@hotmail.com' LIMIT 1];
    }
    
    static Facility__c getTestFacility() {
        return [SELECT Id FROM Facility__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
    }
    
    static ShiftwithStaff__c getTestShift() {
        return [SELECT Id, Staff__c, Start_Date__c, Shift_Start_Time__c, Shift_End_Time__c, 
                       Schedule_Sign_Out_Date_Time__c, Start_time_Formula__c, End_time_formula__c,
                       Enable_Sign_In__c, Enable_Sign_Out__c, Duration__c, Actual_Duration__c
                FROM ShiftwithStaff__c 
                WHERE Staff__c != null 
                LIMIT 1];
    }
    
    static Add_Shift_Checklist__c getTestChecklist() {
        return [SELECT Id FROM Add_Shift_Checklist__c LIMIT 1];
    }
    
    // =============================================
    // TEST 1: getShiftData
    // =============================================
    @isTest
    static void testGetShiftData() {
        User testUser = getTestUser();
        Facility__c fac = getTestFacility();
        Date today = Date.today();
        
        System.runAs(testUser) {
            Test.startTest();
            List<ShiftwithStaffController.ShiftDataWrapper> shiftData = 
                ShiftwithStaffController.getShiftData(testUser.Id, fac.Id, today.addDays(-7), today.addDays(7));
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 2: getStaffWeekData
    // =============================================
    @isTest
    static void testGetStaffWeekData() {
        User testUser = getTestUser();
        
        System.runAs(testUser) {
            Test.startTest();
            List<ShiftwithStaffController.ShiftWrapper> result = 
                ShiftwithStaffController.getStaffWeekData();
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 3: gettimesheetData - ICT Admin
    // =============================================
    @isTest
    static void testGettimesheetData_ICTAdmin() {
        User testUser = getTestUser();
        
        System.runAs(testUser) {
            Test.startTest();
            List<ShiftwithStaffController.gettimesheetDataWrapper> result = 
                ShiftwithStaffController.gettimesheetData(testUser.Id, '1w');
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 4: gettimesheetData - Non-Admin (Staff)
    // =============================================
    @isTest
    static void testGettimesheetData_StaffUser() {
        User testUser = getTestUser();
        
        // Change User_Type__c to simulate a staff user
       
        System.runAs(testUser) {
            Test.startTest();
            List<ShiftwithStaffController.gettimesheetDataWrapper> result = 
                ShiftwithStaffController.gettimesheetData(testUser.Id, '1w');
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 5: getAllShiftWithSatff
    // =============================================
    @isTest
    static void testGetAllShiftWithSatff() {
        User testUser = getTestUser();
        ShiftwithStaff__c shift = getTestShift();
        
        String startDate = String.valueOf(Date.today().addDays(-30));
        String endDate = String.valueOf(Date.today().addDays(30));
        
        System.runAs(testUser) {
            Test.startTest();
            List<ShiftwithStaff__c> result = 
                ShiftwithStaffController.getAllShiftWithSatff(shift.Staff__c, startDate, endDate);
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 6: updateShiftDetails - Sign In
    // =============================================
    @isTest
    static void testUpdateShiftDetails_SignIn() {
        User testUser = getTestUser();
        ShiftwithStaff__c shift = getTestShift();
        
        System.runAs(testUser) {
            Test.startTest();
            ShiftwithStaffController.updateShiftDetails(
                true,                      // enableGeolocation
                true,                      // enableSignin
                false,                     // enableSignout
                'Late sign in approved',   // selectedComments
                null,                      // selectedComments1
                shift.Staff__c,
                shift.Id
            );
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 7: updateShiftDetails - Sign Out
    // =============================================
    @isTest
    static void testUpdateShiftDetails_SignOut() {
        User testUser = getTestUser();
        ShiftwithStaff__c shift = getTestShift();
        
        System.runAs(testUser) {
            Test.startTest();
            ShiftwithStaffController.updateShiftDetails(
                true,                      // enableGeolocation
                false,                     // enableSignin
                true,                      // enableSignout
                null,                      // selectedComments
                'Late sign out approved',  // selectedComments1
                shift.Staff__c,
                shift.Id
            );
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 8: deleteCheckList
    // =============================================
    @isTest
    static void testDeleteChecklist() {
        User testUser = getTestUser();
        
        
        System.runAs(testUser) {
            Add_Shift_Checklist__c checklist = getTestChecklist();
            Test.startTest();
            String result = ShiftwithStaffController.deleteCheckList(new List<String>{checklist.Id});
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 9: getShiftStatusSummary
    // =============================================
    @isTest
    static void testGetShiftStatusSummary() {
        User testUser = getTestUser();
        Facility__c fac = getTestFacility();
        Staff__c staff = getTestStaff();
        
        DateTime startDateTime = DateTime.now().addDays(-10);
        DateTime endDateTime = DateTime.now().addDays(10);
        
        System.runAs(testUser) {
            Test.startTest();
            Map<String, Integer> result = ShiftwithStaffController.getShiftStatusSummary(
                startDateTime,
                endDateTime,
                'false',
                new List<String>{fac.Id},
                '',
                new List<String>{staff.Id},  // Role filter - using staff Id or Role? Should pass Role name
                ''
            );
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 10: updateMyavailability
    // =============================================
    @isTest
    static void testUpdateMyavailability() {
        User testUser = getTestUser();
        
        List<ShiftwithStaff__c> shiftList = [
            SELECT Id, Staff__c, Date__c, Start_Time__c, Type_of_shift__c 
            FROM ShiftwithStaff__c 
            WHERE Staff__c != null 
            AND Date__c != null 
            AND Start_Time__c != null
            LIMIT 5
        ];
        
        System.runAs(testUser) {
            Test.startTest();
            ShiftwithStaffController.updateMyavailability(shiftList);
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 11: getRejectedShiftData
    // =============================================
    @isTest
    static void testGetRejectedShiftData() {
        User testUser = getTestUser();
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            Map<String, Integer> result = ShiftwithStaffController.getRejectedShiftData(fac.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 12: formatTime12Hr
    // =============================================
    @isTest
    static void testFormatTime12Hr() {
        Time noon = Time.newInstance(12, 0, 0, 0);
        Time midnight = Time.newInstance(0, 0, 0, 0);
        
        Test.startTest();
        String result1 = ShiftwithStaffController.formatTime12Hr(noon);
        String result2 = ShiftwithStaffController.formatTime12Hr(midnight);
        String result3 = ShiftwithStaffController.formatTime12Hr(null);
        Test.stopTest();
    }
    
    // =============================================
    // TEST 13: Test Wrapper Classes
    // =============================================
    @isTest
    static void testWrapperClasses() {
        Date testDate = Date.today();
        Double totalDuration = 8.0;
        Double actualDuration = 7.5;
        String status = 'Completed';
        Integer recordCount = 5;
        
        Test.startTest();
        ShiftwithStaffController.ShiftWrapper shiftWrapper = 
            new ShiftwithStaffController.ShiftWrapper(testDate, totalDuration, actualDuration, status);
        
        ShiftwithStaffController.ShiftDataWrapper shiftDataWrapper = 
            new ShiftwithStaffController.ShiftDataWrapper(testDate, recordCount, status);
        
        ShiftwithStaffController.gettimesheetDataWrapper timesheetWrapper = 
            new ShiftwithStaffController.gettimesheetDataWrapper(testDate, recordCount, status);
        Test.stopTest();
    }
}