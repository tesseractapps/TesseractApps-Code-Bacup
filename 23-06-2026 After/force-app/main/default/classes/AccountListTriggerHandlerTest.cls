@isTest
private class AccountListTriggerHandlerTest {

    @isTest static void testInsertRelatedRecords_CoversElseCategoryBranch() {
        // Use 'Companies' to trigger the else block
        Account_List__c testCompany = new Account_List__c(
            Name = 'Test Co - Companies',
            Industry__c = 'Companies'
        );
        insert testCompany;

        List<Account_List__c> testCompanies = [
            SELECT Id, Name, Industry__c 
            FROM Account_List__c 
            WHERE Id = :testCompany.Id
        ];

        Test.startTest();
        AccountListTriggerHandler.insertRelatedRecords(testCompanies);
        Test.stopTest();
    }

    @isTest static void testInsertRelatedRecords_CoversNDISSubcategory() {
        // Covers NDIS-specific subcategory logic
        Account_List__c testNDIS = new Account_List__c(
            Name = 'Test Co - NDIS',
            Industry__c = 'NDIS'
        );
        insert testNDIS;

        List<Account_List__c> testCompanies = [
            SELECT Id, Name, Industry__c 
            FROM Account_List__c 
            WHERE Id = :testNDIS.Id
        ];

        Test.startTest();
        AccountListTriggerHandler.insertRelatedRecords(testCompanies);
        Test.stopTest();
    }
}