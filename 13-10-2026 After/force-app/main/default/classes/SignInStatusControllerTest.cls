@IsTest
public class SignInStatusControllerTest {
    
    @TestSetup
    static void setupTestData() {
        RosterCopyPasteHandlerTestData.createTestData();
    }
    
    private static Map<String, Object> getTestRecords() {
        User testUser = [
            SELECT Id, Email, Organization_Name__c, User_Type__c
            FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];
        
        Facility__c testFacility = [
            SELECT Id FROM Facility__c 
            WHERE Email__c = 'testonefacility@gmail.com' LIMIT 1
        ];
        
        Add_Shift__c testAddShift = [
            SELECT Id, Start_Date__c, End_Date__c FROM Add_Shift__c LIMIT 1
        ];
        
        List<ShiftwithStaff__c> shifts = [
            SELECT Id, Status__c FROM ShiftwithStaff__c ORDER BY CreatedDate ASC
        ];
        
        return new Map<String, Object>{
            'testUser' => testUser,
            'testFacility' => testFacility,
            'testAddShift' => testAddShift,
            'shift1' => shifts[0],
            'shift2' => shifts.size() > 1 ? shifts[1] : shifts[0]
        };
    }
    
    // ============================================================
    // TEST: getSignInCounts - NDIS Staff User Type
    // ============================================================
    @IsTest
    static void testGetSignInCounts_NDISStaff() {
        Map<String, Object> recs = getTestRecords();
        User testUser = (User) recs.get('testUser');
        Facility__c testFacility = (Facility__c) recs.get('testFacility');
        Add_Shift__c testAddShift = (Add_Shift__c) recs.get('testAddShift');
        ShiftwithStaff__c shift1 = (ShiftwithStaff__c) recs.get('shift1');
        
        testUser.User_Type__c = 'NDIS Staff';
        update testUser;
        
        // Run all DML + controller call as testUser so trigger sees correct org
        System.runAs(testUser) {
            update new Add_Shift__c(
                Id = testAddShift.Id, 
                Start_Date__c = Date.today(), 
                End_Date__c = Date.today()
            );
            update new ShiftwithStaff__c(Id = shift1.Id, Status__c = 'Completed');
            
            Test.startTest();
            Map<String, Integer> result = SignInStatusController.getSignInCounts(
                testUser.Id, testFacility.Id
            );
            Test.stopTest();
        }
    }
    
    // ============================================================
    // TEST: getSignInCounts - Non-NDIS Staff
    // ============================================================
    @IsTest
    static void testGetSignInCounts_NonNDISStaff() {
        Map<String, Object> recs = getTestRecords();
        User testUser = (User) recs.get('testUser');
        Facility__c testFacility = (Facility__c) recs.get('testFacility');
        Add_Shift__c testAddShift = (Add_Shift__c) recs.get('testAddShift');
        ShiftwithStaff__c shift1 = (ShiftwithStaff__c) recs.get('shift1');
        
        System.runAs(testUser) {
            update new Add_Shift__c(
                Id = testAddShift.Id, 
                Start_Date__c = Date.today(), 
                End_Date__c = Date.today()
            );
            update new ShiftwithStaff__c(Id = shift1.Id, Status__c = 'Completed');
            
            Test.startTest();
            Map<String, Integer> result = SignInStatusController.getSignInCounts(
                testUser.Id, testFacility.Id
            );
            Test.stopTest();
        }
    }
    
    // ============================================================
    // TEST: getSignInCounts - No Shifts Today
    // ============================================================
    @IsTest
    static void testGetSignInCounts_NoShiftsToday() {
        Map<String, Object> recs = getTestRecords();
        User testUser = (User) recs.get('testUser');
        Facility__c testFacility = (Facility__c) recs.get('testFacility');
        Add_Shift__c testAddShift = (Add_Shift__c) recs.get('testAddShift');
        
        System.runAs(testUser) {
            update new Add_Shift__c(
                Id = testAddShift.Id, 
                Start_Date__c = Date.today().addDays(-10), 
                End_Date__c = Date.today().addDays(-10)
            );
            
            Test.startTest();
            Map<String, Integer> result = SignInStatusController.getSignInCounts(
                testUser.Id, testFacility.Id
            );
            Test.stopTest();
        }
    }
    
    // ============================================================
    // TEST: getSignInStaffDetails - NDIS Staff with Facility
    // ============================================================
    @IsTest
    static void testGetSignInStaffDetails_NDISStaff_WithFacility() {
        Map<String, Object> recs = getTestRecords();
        User testUser = (User) recs.get('testUser');
        Facility__c testFacility = (Facility__c) recs.get('testFacility');
        Add_Shift__c testAddShift = (Add_Shift__c) recs.get('testAddShift');
        ShiftwithStaff__c shift1 = (ShiftwithStaff__c) recs.get('shift1');
        
        testUser.User_Type__c = 'NDIS Staff';
        update testUser;
        
        System.runAs(testUser) {
            update new Add_Shift__c(
                Id = testAddShift.Id, 
                Start_Date__c = Date.today(), 
                End_Date__c = Date.today()
            );
            update new ShiftwithStaff__c(Id = shift1.Id, Status__c = 'Accepted');
            
            Test.startTest();
            List<SignInStatusController.SignInStaffWrapper> result = 
                SignInStatusController.getSignInStaffDetails(
                    'Accepted', testFacility.Id, null, null, 'TODAY'
                );
            Test.stopTest();
        }
    }
    
    // ============================================================
    // TEST: NDIS Staff without Facility
    // ============================================================
    @IsTest
    static void testGetSignInStaffDetails_NDISStaff_WithoutFacility() {
        Map<String, Object> recs = getTestRecords();
        User testUser = (User) recs.get('testUser');
        Add_Shift__c testAddShift = (Add_Shift__c) recs.get('testAddShift');
        ShiftwithStaff__c shift1 = (ShiftwithStaff__c) recs.get('shift1');
        
        testUser.User_Type__c = 'NDIS Staff';
        update testUser;
        
        System.runAs(testUser) {
            update new Add_Shift__c(
                Id = testAddShift.Id, 
                Start_Date__c = Date.today(), 
                End_Date__c = Date.today()
            );
            update new ShiftwithStaff__c(Id = shift1.Id, Status__c = 'Accepted');
            
            Test.startTest();
            List<SignInStatusController.SignInStaffWrapper> result = 
                SignInStatusController.getSignInStaffDetails(
                    'Accepted', null, null, null, 'TODAY'
                );
            Test.stopTest();
        }
    }
    
    // ============================================================
    // TEST: Non-NDIS Staff with Facility
    // ============================================================
    @IsTest
    static void testGetSignInStaffDetails_NonNDISStaff() {
        Map<String, Object> recs = getTestRecords();
        User testUser = (User) recs.get('testUser');
        Facility__c testFacility = (Facility__c) recs.get('testFacility');
        Add_Shift__c testAddShift = (Add_Shift__c) recs.get('testAddShift');
        ShiftwithStaff__c shift1 = (ShiftwithStaff__c) recs.get('shift1');
        
        System.runAs(testUser) {
            update new Add_Shift__c(
                Id = testAddShift.Id, 
                Start_Date__c = Date.today(), 
                End_Date__c = Date.today()
            );
            update new ShiftwithStaff__c(Id = shift1.Id, Status__c = 'Accepted');
            
            Test.startTest();
            List<SignInStatusController.SignInStaffWrapper> result = 
                SignInStatusController.getSignInStaffDetails(
                    'Accepted', testFacility.Id, null, null, 'TODAY'
                );
            Test.stopTest();
        }
    }
    
    // ============================================================
    // TEST: Non-NDIS without Facility
    // ============================================================
    @IsTest
    static void testGetSignInStaffDetails_NonNDISStaff_WithoutFacility() {
        Map<String, Object> recs = getTestRecords();
        User testUser = (User) recs.get('testUser');
        Add_Shift__c testAddShift = (Add_Shift__c) recs.get('testAddShift');
        ShiftwithStaff__c shift1 = (ShiftwithStaff__c) recs.get('shift1');
        
        System.runAs(testUser) {
            update new Add_Shift__c(
                Id = testAddShift.Id, 
                Start_Date__c = Date.today(), 
                End_Date__c = Date.today()
            );
            update new ShiftwithStaff__c(Id = shift1.Id, Status__c = 'Accepted');
            
            Test.startTest();
            List<SignInStatusController.SignInStaffWrapper> result = 
                SignInStatusController.getSignInStaffDetails(
                    'Accepted', null, null, null, 'TODAY'
                );
            Test.stopTest();
        }
    }
    
    // ============================================================
    // TEST: Date Range variations
    // ============================================================
    @IsTest
    static void testGetSignInStaffDetails_DateRangeYesterday() {
        runDateRangeTest('YESTERDAY', Date.today().addDays(-1));
    }
    
    @IsTest
    static void testGetSignInStaffDetails_DateRangeLast7Days() {
        runDateRangeTest('LAST_7_DAYS', Date.today().addDays(-3));
    }
    
    @IsTest
    static void testGetSignInStaffDetails_DateRangeLast30Days() {
        runDateRangeTest('LAST_30_DAYS', Date.today().addDays(-15));
    }
    
    @IsTest
    static void testGetSignInStaffDetails_DateRangeThisMonth() {
        runDateRangeTest('THIS_MONTH', Date.today());
    }
    
    @IsTest
    static void testGetSignInStaffDetails_DateRangeLastMonth() {
        runDateRangeTest('LAST_MONTH', Date.today().addMonths(-1));
    }
    
    @IsTest
    static void testGetSignInStaffDetails_DateRangeLast3Months() {
        runDateRangeTest('LAST_3_MONTHS', Date.today().addMonths(-1));
    }
    
    @IsTest
    static void testGetSignInStaffDetails_DateRangeLast6Months() {
        runDateRangeTest('LAST_6_MONTHS', Date.today().addMonths(-3));
    }
    
    @IsTest
    static void testGetSignInStaffDetails_DateRangeThisYear() {
        runDateRangeTest('THIS_YEAR', Date.today());
    }
    
    @IsTest
    static void testGetSignInStaffDetails_DateRangeCustom() {
        Map<String, Object> recs = getTestRecords();
        User testUser = (User) recs.get('testUser');
        Facility__c testFacility = (Facility__c) recs.get('testFacility');
        Add_Shift__c testAddShift = (Add_Shift__c) recs.get('testAddShift');
        ShiftwithStaff__c shift1 = (ShiftwithStaff__c) recs.get('shift1');
        
        System.runAs(testUser) {
            update new Add_Shift__c(
                Id = testAddShift.Id, 
                Start_Date__c = Date.today().addDays(-3), 
                End_Date__c = Date.today()
            );
            update new ShiftwithStaff__c(Id = shift1.Id, Status__c = 'Accepted');
            
            Test.startTest();
            List<SignInStatusController.SignInStaffWrapper> result = 
                SignInStatusController.getSignInStaffDetails(
                    'Accepted', testFacility.Id, 
                    String.valueOf(Date.today().addDays(-7)), 
                    String.valueOf(Date.today()), 
                    'CUSTOM'
                );
            Test.stopTest();
        }
    }
    
    private static void runDateRangeTest(String range, Date shiftDate) {
        Map<String, Object> recs = getTestRecords();
        User testUser = (User) recs.get('testUser');
        Facility__c testFacility = (Facility__c) recs.get('testFacility');
        Add_Shift__c testAddShift = (Add_Shift__c) recs.get('testAddShift');
        ShiftwithStaff__c shift1 = (ShiftwithStaff__c) recs.get('shift1');
        
        System.runAs(testUser) {
            update new Add_Shift__c(
                Id = testAddShift.Id, 
                Start_Date__c = shiftDate, 
                End_Date__c = shiftDate
            );
            update new ShiftwithStaff__c(Id = shift1.Id, Status__c = 'Accepted');
            
            Test.startTest();
            List<SignInStatusController.SignInStaffWrapper> result = 
                SignInStatusController.getSignInStaffDetails(
                    'Accepted', testFacility.Id, null, null, range
                );
            Test.stopTest();
        }
    }
    
    // ============================================================
    // TEST: With Filter Start/End Dates
    // ============================================================
    @IsTest
    static void testGetSignInStaffDetails_WithFilterDates() {
        Map<String, Object> recs = getTestRecords();
        User testUser = (User) recs.get('testUser');
        Facility__c testFacility = (Facility__c) recs.get('testFacility');
        Add_Shift__c testAddShift = (Add_Shift__c) recs.get('testAddShift');
        ShiftwithStaff__c shift1 = (ShiftwithStaff__c) recs.get('shift1');
        
        System.runAs(testUser) {
            update new Add_Shift__c(
                Id = testAddShift.Id, 
                Start_Date__c = Date.today().addDays(-3), 
                End_Date__c = Date.today()
            );
            update new ShiftwithStaff__c(Id = shift1.Id, Status__c = 'Accepted');
            
            Test.startTest();
            List<SignInStatusController.SignInStaffWrapper> result = 
                SignInStatusController.getSignInStaffDetails(
                    'Accepted', testFacility.Id, 
                    String.valueOf(Date.today().addDays(-7)), 
                    String.valueOf(Date.today()), 
                    null
                );
            Test.stopTest();
        }
    }
    
    // ============================================================
    // TEST: Start Greater Than End
    // ============================================================
    @IsTest
    static void testGetSignInStaffDetails_StartGreaterThanEnd() {
        Map<String, Object> recs = getTestRecords();
        User testUser = (User) recs.get('testUser');
        Facility__c testFacility = (Facility__c) recs.get('testFacility');
        Add_Shift__c testAddShift = (Add_Shift__c) recs.get('testAddShift');
        ShiftwithStaff__c shift1 = (ShiftwithStaff__c) recs.get('shift1');
        
        System.runAs(testUser) {
            update new Add_Shift__c(
                Id = testAddShift.Id, 
                Start_Date__c = Date.today(), 
                End_Date__c = Date.today()
            );
            update new ShiftwithStaff__c(Id = shift1.Id, Status__c = 'Accepted');
            
            Test.startTest();
            List<SignInStatusController.SignInStaffWrapper> result = 
                SignInStatusController.getSignInStaffDetails(
                    'Accepted', testFacility.Id, 
                    String.valueOf(Date.today()), 
                    String.valueOf(Date.today().addDays(-7)), 
                    null
                );
            Test.stopTest();
        }
    }
    
    // ============================================================
    // TEST: Completed Status
    // ============================================================
    @IsTest
    static void testGetSignInStaffDetails_CompletedStatus() {
        Map<String, Object> recs = getTestRecords();
        User testUser = (User) recs.get('testUser');
        Facility__c testFacility = (Facility__c) recs.get('testFacility');
        Add_Shift__c testAddShift = (Add_Shift__c) recs.get('testAddShift');
        ShiftwithStaff__c shift1 = (ShiftwithStaff__c) recs.get('shift1');
        
        System.runAs(testUser) {
            update new Add_Shift__c(
                Id = testAddShift.Id, 
                Start_Date__c = Date.today(), 
                End_Date__c = Date.today()
            );
            update new ShiftwithStaff__c(Id = shift1.Id, Status__c = 'Completed');
            
            Test.startTest();
            List<SignInStatusController.SignInStaffWrapper> result = 
                SignInStatusController.getSignInStaffDetails(
                    'Completed', testFacility.Id, null, null, 'TODAY'
                );
            Test.stopTest();
        }
    }
    
    // ============================================================
    // TEST: InProgress Status
    // ============================================================
    @IsTest
    static void testGetSignInStaffDetails_InProgressStatus() {
        Map<String, Object> recs = getTestRecords();
        User testUser = (User) recs.get('testUser');
        Facility__c testFacility = (Facility__c) recs.get('testFacility');
        Add_Shift__c testAddShift = (Add_Shift__c) recs.get('testAddShift');
        ShiftwithStaff__c shift1 = (ShiftwithStaff__c) recs.get('shift1');
        
        System.runAs(testUser) {
            update new Add_Shift__c(
                Id = testAddShift.Id, 
                Start_Date__c = Date.today(), 
                End_Date__c = Date.today()
            );
            update new ShiftwithStaff__c(Id = shift1.Id, Status__c = 'InProgress');
            
            Test.startTest();
            List<SignInStatusController.SignInStaffWrapper> result = 
                SignInStatusController.getSignInStaffDetails(
                    'InProgress', testFacility.Id, null, null, 'TODAY'
                );
            Test.stopTest();
        }
    }
    
    // ============================================================
    // TEST: parseDate
    // ============================================================
    @IsTest
    static void testParseDate_ValidFormats() {
        Test.startTest();
        SignInStatusController.parseDate('2024-10-16');
        SignInStatusController.parseDate('2024/10/16');
        SignInStatusController.parseDate('16/10/2024');
        SignInStatusController.parseDate('16-10-2024');
        SignInStatusController.parseDate('2024-10-16T00:00:00');
        SignInStatusController.parseDate('2024-10-16 00:00:00');
        SignInStatusController.parseDate('"2024-10-16"');
        Test.stopTest();
    }
    
    @IsTest
    static void testParseDate_NullAndBlank() {
        Test.startTest();
        SignInStatusController.parseDate(null);
        SignInStatusController.parseDate('');
        SignInStatusController.parseDate('   ');
        Test.stopTest();
    }
    
    @IsTest
    static void testParseDate_InvalidFormat() {
        Test.startTest();
        SignInStatusController.parseDate('invalid-date');
        SignInStatusController.parseDate('99/99/9999');
        Test.stopTest();
    }
    
    // ============================================================
    // TEST: buildShiftTime
    // ============================================================
    @IsTest
    static void testBuildShiftTime_BothValid() {
        Test.startTest();
        SignInStatusController.buildShiftTime('09:00', '17:00');
        Test.stopTest();
    }
    
    @IsTest
    static void testBuildShiftTime_OnlyLoginValid() {
        Test.startTest();
        SignInStatusController.buildShiftTime('09:00', null);
        Test.stopTest();
    }
    
    @IsTest
    static void testBuildShiftTime_OnlyLogoutValid() {
        Test.startTest();
        SignInStatusController.buildShiftTime(null, '17:00');
        Test.stopTest();
    }
    
    @IsTest
    static void testBuildShiftTime_BothBlank() {
        Test.startTest();
        SignInStatusController.buildShiftTime('', '');
        Test.stopTest();
    }
    
    @IsTest
    static void testBuildShiftTime_NullValues() {
        Test.startTest();
        SignInStatusController.buildShiftTime(null, null);
        Test.stopTest();
    }
    
    @IsTest
    static void testBuildShiftTime_NullStringValues() {
        Test.startTest();
        SignInStatusController.buildShiftTime('null', 'null');
        Test.stopTest();
    }
}