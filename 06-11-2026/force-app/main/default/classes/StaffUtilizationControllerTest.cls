@isTest
public class StaffUtilizationControllerTest {
    
    static User testUser;
    static Staff__c testStaff;
    static Organisation__c testOrg;
    static Facility__c testFacility;
    static ShiftwithStaff__c testShift;
    
    @testSetup
    static void setup() {
        TestDataFactory.createBaseData();
    }
    
    // Helper method to get test user
    private static User getTestUser() {
        if (testUser == null) {
            testUser = [SELECT Id, Email, User_Type__c, Organization_Name__c 
                        FROM User 
                        WHERE Email = 'manualtesting.20294637@hotmail.com' 
                        LIMIT 1];
        }
        return testUser;
    }
    
    // Helper method to get test staff
    private static Staff__c getTestStaff() {
        if (testStaff == null) {
            testStaff = [SELECT Id, Name, Display_Nickname__c, Set_Hours__c, Class_and_Paypont__c,
                        Facility__c, Role__c, Type_of_Job__c, Facility__r.Organisation__c,
                        (SELECT Id, Duration__c, Status__c, Start_Date__c, Day_Name__c 
                         FROM ShiftwithStaffs__r)
                        FROM Staff__c 
                        LIMIT 1];
        }
        return testStaff;
    }
    
    // Helper method to get test org
    private static Organisation__c getTestOrg() {
        if (testOrg == null) {
            testOrg = [SELECT Id, Name FROM Organisation__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
        }
        return testOrg;
    }
    
    // Helper method to get test facility
    private static Facility__c getTestFacility() {
        if (testFacility == null) {
            testFacility = [SELECT Id, Name FROM Facility__c LIMIT 1];
        }
        return testFacility;
    }
    
    // Helper method to get test shift
    private static ShiftwithStaff__c getTestShift() {
        if (testShift == null) {
            testShift = [SELECT Id, Duration__c, Status__c, Start_Date__c, Day_Name__c, Staff__c
                        FROM ShiftwithStaff__c 
                        LIMIT 1];
        }
        return testShift;
    }
    
    // =============================================
// 1. TEST getStaffUtilizationData - Admin User
// =============================================
@isTest
static void test_getStaffUtilizationData_adminUser() {
    User u = getTestUser();
    
    System.runAs(u) {
        Date today = Date.today();
        String startDate = String.valueOf(today);
        String endDate = String.valueOf(today.addDays(4));
        
        Test.startTest();
        
        // Test with all parameters - including sortField and sortDirection
        StaffUtilizationController.StaffUtilizationResponse response = 
            StaffUtilizationController.getStaffUtilizationData(
                'All', 'All', 'All',
                1, 10,
                startDate, endDate,
                'All',
                null, null  // sortField, sortDirection
            );
        
        // Test with specific status filters
        StaffUtilizationController.StaffUtilizationResponse response1 = 
            StaffUtilizationController.getStaffUtilizationData(
                'All', 'All', 'All',
                1, 10,
                startDate, endDate,
                'Under Rostered',
                null, null
            );
        
        StaffUtilizationController.StaffUtilizationResponse response2 = 
            StaffUtilizationController.getStaffUtilizationData(
                'All', 'All', 'All',
                1, 10,
                startDate, endDate,
                'Over Rostered',
                null, null
            );
        
        StaffUtilizationController.StaffUtilizationResponse response3 = 
            StaffUtilizationController.getStaffUtilizationData(
                'All', 'All', 'All',
                1, 10,
                startDate, endDate,
                'Total Unallocated Hrs',
                null, null
            );
        
        StaffUtilizationController.StaffUtilizationResponse response4 = 
            StaffUtilizationController.getStaffUtilizationData(
                'All', 'All', 'All',
                1, 10,
                startDate, endDate,
                'Total Overtime Hrs',
                null, null
            );
        
        Test.stopTest();
    }
}
    
    // =============================================
    // 2. TEST getStaffUtilizationData - with sorting
    // =============================================
    @isTest
    static void test_getStaffUtilizationData_sorting() {
        User u = getTestUser();
        
        System.runAs(u) {
            Date today = Date.today();
            String startDate = String.valueOf(today);
            String endDate = String.valueOf(today.addDays(4));
            
            Test.startTest();
            
            // Test sorting by different fields
            StaffUtilizationController.StaffUtilizationResponse response1 = 
                StaffUtilizationController.getStaffUtilizationData(
                    'All', 'All', 'All',
                    1, 10,
                    startDate, endDate,
                    'All',
                    'name',
                    'asc'
                );
            
            StaffUtilizationController.StaffUtilizationResponse response2 = 
                StaffUtilizationController.getStaffUtilizationData(
                    'All', 'All', 'All',
                    1, 10,
                    startDate, endDate,
                    'All',
                    'setHours',
                    'desc'
                );
            
            StaffUtilizationController.StaffUtilizationResponse response3 = 
                StaffUtilizationController.getStaffUtilizationData(
                    'All', 'All', 'All',
                    1, 10,
                    startDate, endDate,
                    'All',
                    'rosteredHours',
                    'asc'
                );
            
            StaffUtilizationController.StaffUtilizationResponse response4 = 
                StaffUtilizationController.getStaffUtilizationData(
                    'All', 'All', 'All',
                    1, 10,
                    startDate, endDate,
                    'All',
                    'completedHours',
                    'desc'
                );
            
            StaffUtilizationController.StaffUtilizationResponse response5 = 
                StaffUtilizationController.getStaffUtilizationData(
                    'All', 'All', 'All',
                    1, 10,
                    startDate, endDate,
                    'All',
                    'rhVariance',
                    'asc'
                );
            
            StaffUtilizationController.StaffUtilizationResponse response6 = 
                StaffUtilizationController.getStaffUtilizationData(
                    'All', 'All', 'All',
                    1, 10,
                    startDate, endDate,
                    'All',
                    'chVariance',
                    'desc'
                );
            
            StaffUtilizationController.StaffUtilizationResponse response7 = 
                StaffUtilizationController.getStaffUtilizationData(
                    'All', 'All', 'All',
                    1, 10,
                    startDate, endDate,
                    'All',
                    'status',
                    'asc'
                );
            
            Test.stopTest();
        }
    }
    
    // =============================================
    // 3. TEST getStaffUtilizationData - with filters
    // =============================================
    @isTest
    static void test_getStaffUtilizationData_withFilters() {
        User u = getTestUser();
        
        System.runAs(u) {
            Facility__c fac = getTestFacility();
            Date today = Date.today();
            String startDate = String.valueOf(today);
            String endDate = String.valueOf(today.addDays(4));
            
            Test.startTest();
            
            // Test with specific facility
            StaffUtilizationController.StaffUtilizationResponse response = 
                StaffUtilizationController.getStaffUtilizationData(
                    fac.Id, 'All', 'All',
                    1, 10,
                    startDate, endDate,
                    'All',
                    null, null
                );
            
            // Test with specific role
            StaffUtilizationController.StaffUtilizationResponse response1 = 
                StaffUtilizationController.getStaffUtilizationData(
                    'All', 'Admin', 'All',
                    1, 10,
                    startDate, endDate,
                    'All',
                    null, null
                );
            
            // Test with specific employment type
            StaffUtilizationController.StaffUtilizationResponse response2 = 
                StaffUtilizationController.getStaffUtilizationData(
                    'All', 'All', 'Full Time',
                    1, 10,
                    startDate, endDate,
                    'All',
                    null, null
                );
            
            // Test with all filters combined
            StaffUtilizationController.StaffUtilizationResponse response3 = 
                StaffUtilizationController.getStaffUtilizationData(
                    fac.Id, 'Admin', 'Full Time',
                    1, 10,
                    startDate, endDate,
                    'All',
                    null, null
                );
            
            Test.stopTest();
        }
    }
    
    // =============================================
    // 4. TEST getStaffUtilizationData - pagination
    // =============================================
    @isTest
    static void test_getStaffUtilizationData_pagination() {
        User u = getTestUser();
        
        System.runAs(u) {
            Date today = Date.today();
            String startDate = String.valueOf(today);
            String endDate = String.valueOf(today.addDays(4));
            
            Test.startTest();
            
            // Page 1
            StaffUtilizationController.StaffUtilizationResponse response1 = 
                StaffUtilizationController.getStaffUtilizationData(
                    'All', 'All', 'All',
                    1, 2,
                    startDate, endDate,
                    'All',
                    null, null
                );
            
            // Page 2
            StaffUtilizationController.StaffUtilizationResponse response2 = 
                StaffUtilizationController.getStaffUtilizationData(
                    'All', 'All', 'All',
                    2, 2,
                    startDate, endDate,
                    'All',
                    null, null
                );
            
            Test.stopTest();
        }
    }
    
    // =============================================
    // 5. TEST getStaffUtilizationData - invalid date
    // =============================================
    @isTest
    static void test_getStaffUtilizationData_invalidDate() {
        User u = getTestUser();
        
        System.runAs(u) {
            Test.startTest();
            
            try {
                StaffUtilizationController.getStaffUtilizationData(
                    'All', 'All', 'All',
                    1, 10,
                    '2024/01/01', // Invalid format
                    '2024/01/05',
                    'All',
                    null, null
                );
            } catch (AuraHandledException e) {
                // Expected
            }
            
            Test.stopTest();
        }
    }
    
    // =============================================
    // 6. TEST exportStaffData - Admin User
    // =============================================
    @isTest
    static void test_exportStaffData_adminUser() {
        User u = getTestUser();
        
        System.runAs(u) {
            Date today = Date.today();
            String startDate = String.valueOf(today);
            String endDate = String.valueOf(today.addDays(4));
            
            Test.startTest();
            
            // Export with All status
            String csv1 = StaffUtilizationController.exportStaffData(
                null, null, null,
                startDate, endDate,
                'All'
            );
            
            // Export with specific statuses
            String csv2 = StaffUtilizationController.exportStaffData(
                null, null, null,
                startDate, endDate,
                'Under Rostered'
            );
            
            String csv3 = StaffUtilizationController.exportStaffData(
                null, null, null,
                startDate, endDate,
                'Over Rostered'
            );
            
            String csv4 = StaffUtilizationController.exportStaffData(
                null, null, null,
                startDate, endDate,
                'Total Unallocated Hrs'
            );
            
            String csv5 = StaffUtilizationController.exportStaffData(
                null, null, null,
                startDate, endDate,
                'Total Overtime Hrs'
            );
            
            Test.stopTest();
        }
    }
    
    // =============================================
    // 7. TEST exportStaffData - with filters
    // =============================================
    @isTest
    static void test_exportStaffData_withFilters() {
        User u = getTestUser();
        
        System.runAs(u) {
            Facility__c fac = getTestFacility();
            Date today = Date.today();
            String startDate = String.valueOf(today);
            String endDate = String.valueOf(today.addDays(4));
            
            Test.startTest();
            
            // Export with facility filter
            String csv1 = StaffUtilizationController.exportStaffData(
                fac.Id, null, null,
                startDate, endDate,
                'All'
            );
            
            // Export with role filter
            String csv2 = StaffUtilizationController.exportStaffData(
                null, 'Admin', null,
                startDate, endDate,
                'All'
            );
            
            // Export with employment type filter
            String csv3 = StaffUtilizationController.exportStaffData(
                null, null, 'Full Time',
                startDate, endDate,
                'All'
            );
            
            // Export with all filters
            String csv4 = StaffUtilizationController.exportStaffData(
                fac.Id, 'Admin', 'Full Time',
                startDate, endDate,
                'All'
            );
            
            Test.stopTest();
        }
    }
    
    // =============================================
    // 8. TEST exportStaffData - invalid date
    // =============================================
    @isTest
    static void test_exportStaffData_invalidDate() {
        User u = getTestUser();
        
        System.runAs(u) {
            Test.startTest();
            
            try {
                StaffUtilizationController.exportStaffData(
                    null, null, null,
                    'invalid-date',
                    'invalid-date',
                    'All'
                );
            } catch (AuraHandledException e) {
                // Expected
            }
            
            Test.stopTest();
        }
    }
    
    // =============================================
    // 9. TEST StaffUtilizationController - with no facility association
    // =============================================
    @isTest
    static void test_getStaffUtilizationData_noFacilityAssociation() {
        // Create a user without facility association
        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        Organisation__c org = getTestOrg();
        
        User nonAdminUser = new User(
            Alias = 'noassoc',
            Email = 'noassociation@test.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'NoAssociation',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey = 'America/New_York',
            UserName = 'noassociation@test.com',
            Organization_Name__c = org.Name,
            User_Type__c = 'NDIS Staff'
        );
        insert nonAdminUser;
        
        System.runAs(nonAdminUser) {
            Date today = Date.today();
            String startDate = String.valueOf(today);
            String endDate = String.valueOf(today.addDays(4));
            
            Test.startTest();
            
            // Should return empty data
            StaffUtilizationController.StaffUtilizationResponse response = 
                StaffUtilizationController.getStaffUtilizationData(
                    'All', 'All', 'All',
                    1, 10,
                    startDate, endDate,
                    'All',
                    null, null
                );
            
            Test.stopTest();
        }
    }
    
    // =============================================
    // 10. TEST StaffUtilizationController - with facility association
    // =============================================
    @isTest
    static void test_getStaffUtilizationData_withFacilityAssociation() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        Facility__c fac = getTestFacility();
        
        // Create facility association for the user
        Facility_Association__c assoc = new Facility_Association__c(
            Staff__c = staff.Id,
            Facility__c = fac.Id,
            User__c = u.Id,
            Active__c = true
        );
        insert assoc;
        
        System.runAs(u) {
            Date today = Date.today();
            String startDate = String.valueOf(today);
            String endDate = String.valueOf(today.addDays(4));
            
            Test.startTest();
            
            StaffUtilizationController.StaffUtilizationResponse response = 
                StaffUtilizationController.getStaffUtilizationData(
                    'All', 'All', 'All',
                    1, 10,
                    startDate, endDate,
                    'All',
                    null, null
                );
            
            Test.stopTest();
        }
    }
	// =============================================
// TEST StaffUtilComparator - compareString
// =============================================
@isTest
static void test_staffUtilComparator_compareString() {
    User u = getTestUser();
    
    System.runAs(u) {
        Test.startTest();
        
        // Create test data objects
        StaffUtilizationController.StaffUtilizationData data1 = new StaffUtilizationController.StaffUtilizationData();
        data1.name = 'Alice';
        data1.setHours = 40;
        data1.rosteredHours = 35;
        data1.completedHours = 30;
        data1.rhVariance = -5;
        data1.chVariance = -10;
        data1.status = 'Under Rostered';
        
        StaffUtilizationController.StaffUtilizationData data2 = new StaffUtilizationController.StaffUtilizationData();
        data2.name = 'Bob';
        data2.setHours = 40;
        data2.rosteredHours = 45;
        data2.completedHours = 42;
        data2.rhVariance = 5;
        data2.chVariance = 2;
        data2.status = 'Over Rostered';
        
        StaffUtilizationController.StaffUtilizationData data3 = new StaffUtilizationController.StaffUtilizationData();
        data3.name = 'Alice';
        data3.setHours = 40;
        data3.rosteredHours = 40;
        data3.completedHours = 38;
        data3.rhVariance = 0;
        data3.chVariance = -2;
        data3.status = 'Fully Rostered';
        
        // Test ASC order
        StaffUtilizationController.StaffUtilComparator compAsc = 
            new StaffUtilizationController.StaffUtilComparator('name', 'asc');
        
        Integer result1 = compAsc.compare(data1, data2); // Alice vs Bob → -1
        Integer result2 = compAsc.compare(data2, data1); // Bob vs Alice → 1
        Integer result3 = compAsc.compare(data1, data3); // Alice vs Alice → 0
        
        // Test DESC order
        StaffUtilizationController.StaffUtilComparator compDesc = 
            new StaffUtilizationController.StaffUtilComparator('name', 'desc');
        
        Integer result4 = compDesc.compare(data1, data2); // Alice vs Bob → 1
        
        Test.stopTest();
    }
}

// =============================================
// TEST StaffUtilComparator - compareDecimal
// =============================================
@isTest
static void test_staffUtilComparator_compareDecimal() {
    User u = getTestUser();
    
    System.runAs(u) {
        Test.startTest();
        
        StaffUtilizationController.StaffUtilizationData data1 = new StaffUtilizationController.StaffUtilizationData();
        data1.name = 'Staff A';
        data1.setHours = 40;
        data1.rosteredHours = 35;
        data1.completedHours = 30;
        data1.rhVariance = -5;
        data1.chVariance = -10;
        data1.status = 'Under Rostered';
        
        StaffUtilizationController.StaffUtilizationData data2 = new StaffUtilizationController.StaffUtilizationData();
        data2.name = 'Staff B';
        data2.setHours = 40;
        data2.rosteredHours = 45;
        data2.completedHours = 42;
        data2.rhVariance = 5;
        data2.chVariance = 2;
        data2.status = 'Over Rostered';
        
        StaffUtilizationController.StaffUtilizationData data3 = new StaffUtilizationController.StaffUtilizationData();
        data3.name = 'Staff C';
        data3.setHours = 40;
        data3.rosteredHours = 40;
        data3.completedHours = 38;
        data3.rhVariance = 0;
        data3.chVariance = -2;
        data3.status = 'Fully Rostered';
        
        // Test setHours ASC
        StaffUtilizationController.StaffUtilComparator compSetHours = 
            new StaffUtilizationController.StaffUtilComparator('setHours', 'asc');
        Integer result1 = compSetHours.compare(data1, data2); // 40 vs 40 → 0
        
        // Test rosteredHours ASC
        StaffUtilizationController.StaffUtilComparator compRostered = 
            new StaffUtilizationController.StaffUtilComparator('rosteredHours', 'asc');
        Integer result2 = compRostered.compare(data1, data2); // 35 vs 45 → -1
        
        // Test rosteredHours DESC
        StaffUtilizationController.StaffUtilComparator compRosteredDesc = 
            new StaffUtilizationController.StaffUtilComparator('rosteredHours', 'desc');
        Integer result3 = compRosteredDesc.compare(data1, data2); // 35 vs 45 → 1
        
        // Test completedHours ASC
        StaffUtilizationController.StaffUtilComparator compCompleted = 
            new StaffUtilizationController.StaffUtilComparator('completedHours', 'asc');
        Integer result4 = compCompleted.compare(data1, data2); // 30 vs 42 → -1
        
        // Test rhVariance ASC
        StaffUtilizationController.StaffUtilComparator compRhVariance = 
            new StaffUtilizationController.StaffUtilComparator('rhVariance', 'asc');
        Integer result5 = compRhVariance.compare(data1, data2); // -5 vs 5 → -1
        
        // Test chVariance ASC
        StaffUtilizationController.StaffUtilComparator compChVariance = 
            new StaffUtilizationController.StaffUtilComparator('chVariance', 'asc');
        Integer result6 = compChVariance.compare(data1, data2); // -10 vs 2 → -1
        
        Test.stopTest();
    }
}

// =============================================
// TEST StaffUtilComparator - status sorting
// =============================================
@isTest
static void test_staffUtilComparator_status() {
    User u = getTestUser();
    
    System.runAs(u) {
        Test.startTest();
        
        StaffUtilizationController.StaffUtilizationData data1 = new StaffUtilizationController.StaffUtilizationData();
        data1.name = 'Staff A';
        data1.setHours = 40;
        data1.rosteredHours = 35;
        data1.rhVariance = -5;
        data1.chVariance = -10;
        data1.status = 'Under Rostered';
        
        StaffUtilizationController.StaffUtilizationData data2 = new StaffUtilizationController.StaffUtilizationData();
        data2.name = 'Staff B';
        data2.setHours = 40;
        data2.rosteredHours = 45;
        data2.rhVariance = 5;
        data2.chVariance = 2;
        data2.status = 'Over Rostered';
        
        StaffUtilizationController.StaffUtilizationData data3 = new StaffUtilizationController.StaffUtilizationData();
        data3.name = 'Staff C';
        data3.setHours = 40;
        data3.rosteredHours = 40;
        data3.rhVariance = 0;
        data3.chVariance = -2;
        data3.status = 'Fully Rostered';
        
        // Test status ASC
        StaffUtilizationController.StaffUtilComparator compStatus = 
            new StaffUtilizationController.StaffUtilComparator('status', 'asc');
        Integer result1 = compStatus.compare(data1, data2); // Under vs Over → -1
        
        // Test status DESC
        StaffUtilizationController.StaffUtilComparator compStatusDesc = 
            new StaffUtilizationController.StaffUtilComparator('status', 'desc');
        Integer result2 = compStatusDesc.compare(data1, data2); // Under vs Over → 1
        
        Test.stopTest();
    }
}

// =============================================
// TEST StaffUtilComparator - null values
// =============================================
@isTest
static void test_staffUtilComparator_nullValues() {
    User u = getTestUser();
    
    System.runAs(u) {
        Test.startTest();
        
        StaffUtilizationController.StaffUtilizationData data1 = new StaffUtilizationController.StaffUtilizationData();
        data1.name = null;
        data1.setHours = null;
        data1.rosteredHours = null;
        data1.completedHours = null;
        data1.rhVariance = null;
        data1.chVariance = null;
        data1.status = null;
        
        StaffUtilizationController.StaffUtilizationData data2 = new StaffUtilizationController.StaffUtilizationData();
        data2.name = 'Staff B';
        data2.setHours = 40;
        data2.rosteredHours = 45;
        data2.completedHours = 42;
        data2.rhVariance = 5;
        data2.chVariance = 2;
        data2.status = 'Over Rostered';
        
        // Test null handling for name
        StaffUtilizationController.StaffUtilComparator compName = 
            new StaffUtilizationController.StaffUtilComparator('name', 'asc');
        Integer result1 = compName.compare(data1, data2); // null vs "Staff B" → 1
        
        // Test null handling for setHours
        StaffUtilizationController.StaffUtilComparator compSetHours = 
            new StaffUtilizationController.StaffUtilComparator('setHours', 'asc');
        Integer result2 = compSetHours.compare(data1, data2); // null vs 40 → 1
        
        // Test null handling for status
        StaffUtilizationController.StaffUtilComparator compStatus = 
            new StaffUtilizationController.StaffUtilComparator('status', 'asc');
        Integer result3 = compStatus.compare(data1, data2); // null vs "Over Rostered" → 1
        
        // Test both null
        StaffUtilizationController.StaffUtilizationData data3 = new StaffUtilizationController.StaffUtilizationData();
        data3.name = null;
        data3.setHours = null;
        data3.status = null;
        
        Integer result4 = compName.compare(data1, data3); // null vs null → 0
        
        Test.stopTest();
    }
}

// =============================================
// TEST StaffUtilComparator - default else branch
// =============================================
@isTest
static void test_staffUtilComparator_defaultBranch() {
    User u = getTestUser();
    
    System.runAs(u) {
        Test.startTest();
        
        StaffUtilizationController.StaffUtilizationData data1 = new StaffUtilizationController.StaffUtilizationData();
        data1.name = 'Alice';
        data1.setHours = 40;
        data1.rosteredHours = 35;
        data1.status = 'Under Rostered';
        
        StaffUtilizationController.StaffUtilizationData data2 = new StaffUtilizationController.StaffUtilizationData();
        data2.name = 'Bob';
        data2.setHours = 40;
        data2.rosteredHours = 45;
        data2.status = 'Over Rostered';
        
        // Test with unknown field - should default to name sorting
        StaffUtilizationController.StaffUtilComparator compDefault = 
            new StaffUtilizationController.StaffUtilComparator('unknownField', 'asc');
        Integer result1 = compDefault.compare(data1, data2); // Alice vs Bob → -1
        
        Test.stopTest();
    }
}

}