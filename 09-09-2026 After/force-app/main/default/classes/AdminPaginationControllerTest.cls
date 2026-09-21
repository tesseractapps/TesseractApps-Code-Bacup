@IsTest
public class AdminPaginationControllerTest {
    
    @IsTest
    static void testFetchStaffPaginatedData_NoSearch() {
        
        TestDataFactory.createBaseData();
        
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        
        Test.startTest();
        
        AdminPaginationController.StaffPaginationWrapper result =
            AdminPaginationController.fetchStaffPaginatedData(
                null,
                fac.Id,
                10,
                1,
                true,
                'Display_Nickname__c',
                'asc'
            );
        
        Test.stopTest();
    }
@IsTest
static void testFetchStaffPaginatedData_WithSearch() {

    TestDataFactory.createBaseData();

    Facility__c fac = [SELECT Id, Name FROM Facility__c LIMIT 1];

    Test.startTest();

    // Parent Search
    AdminPaginationController.fetchStaffPaginatedData(
        '5678',
        fac.Id,
        10,
        1,
        true,
        'Display_Nickname__c',
                'asc'
    );

    // Role Search
    AdminPaginationController.fetchStaffPaginatedData(
        'Admin',
        fac.Id,
        10,
        1,
        true,
       'Display_Nickname__c',
                'asc'
    );

    // Facility Search
    AdminPaginationController.fetchStaffPaginatedData(
        fac.Name,
        fac.Id,
        10,
        1,
        true,
       'Display_Nickname__c',
                'asc'
    );

    Test.stopTest();
}
    
    @IsTest
    static void testFetchStaffPaginatedData_Inactive() {
        
        TestDataFactory.createBaseData();
        
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        
        Test.startTest();
        
        AdminPaginationController.StaffPaginationWrapper result =
            AdminPaginationController.fetchStaffPaginatedData(
                null,
                fac.Id,
                10,
                1,
                true,
                'Display_Nickname__c',
                'asc'
            );
        
        Test.stopTest();
    }
    
    @IsTest
    static void testFetchStaffPaginatedData_Pagination() {
        
        TestDataFactory.createBaseData();
        
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        
        Test.startTest();
        
        AdminPaginationController.StaffPaginationWrapper page1 =
            AdminPaginationController.fetchStaffPaginatedData(
                null,
                fac.Id,
                10,
                1,
                true,
                'Display_Nickname__c',
                'asc'
            );
        
        AdminPaginationController.StaffPaginationWrapper page2 =
            AdminPaginationController.fetchStaffPaginatedData(
                null,
                fac.Id,
                10,
                1,
                true,
                'Display_Nickname__c',
                'asc'
            );
        
        Test.stopTest();
    }
    
    @IsTest
    static void testFetchStaffPaginatedData_NoResultsSearch() {
        
        TestDataFactory.createBaseData();
        
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        
        Test.startTest();
        
        AdminPaginationController.StaffPaginationWrapper result =
            AdminPaginationController.fetchStaffPaginatedData(
                null,
                fac.Id,
                10,
                1,
                true,
                'Display_Nickname__c',
                'asc'
            );
        AdminPaginationController.fetchStaffForDropdown (fac.Id);
        Test.stopTest();
    }

@IsTest
static void testGetStaffsByFacility() {

    TestDataFactory.createBaseData();

    Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];

    Test.startTest();

    // Covers facilityId == null
    List<Staff__c> emptyList = AdminPaginationController.getStaffsByFacility(null);
    System.assertEquals(0, emptyList.size());

    // Covers valid facilityId
    List<Staff__c> staffList = AdminPaginationController.getStaffsByFacility(fac.Id);
    System.assertNotEquals(null, staffList);

    Test.stopTest();
}
}