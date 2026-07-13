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
                true
            );

        Test.stopTest();
    }

    @IsTest
    static void testFetchStaffPaginatedData_WithSearch() {

        TestDataFactory.createBaseData();

        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];

        Test.startTest();

        AdminPaginationController.StaffPaginationWrapper result =
            AdminPaginationController.fetchStaffPaginatedData(
                'Admin',
                fac.Id,
                10,
                1,
                true
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
                5,
                1,
                false
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
                1,
                1,
                true
            );

        AdminPaginationController.StaffPaginationWrapper page2 =
            AdminPaginationController.fetchStaffPaginatedData(
                null,
                fac.Id,
                1,
                2,
                true
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
                'ZZZ_NO_MATCH',
                fac.Id,
                10,
                1,
                true
            );

        Test.stopTest();
    }
}