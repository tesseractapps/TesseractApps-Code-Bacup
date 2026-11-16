@isTest
public class CheckAccountingCompanyNameTest {
    
    @isTest
    static void testInsertUniqueCompanyName() {
        Company__c company1 = new Company__c(Company_Name__c = 'UniqueCo');
        
        Test.startTest();
        insert company1; // Should succeed
        Test.stopTest();
        
        System.assertNotEquals(null, company1.Id, 'Company should be inserted successfully.');
    }

    @isTest
    static void testInsertDuplicateCompanyName() {
        Company__c existingCompany = new Company__c(Company_Name__c = 'DuplicateCo');
        insert existingCompany;

        Company__c newCompany = new Company__c(Company_Name__c = 'DuplicateCo');

        Test.startTest();
        try {
            insert newCompany;
            System.assert(false, 'Expected a trigger error for duplicate company name.');
        } catch (DmlException e) {
            System.assert(e.getMessage().contains('The Company Name already exists'), 'Expected error message not found.');
        }
        Test.stopTest();
    }

    @isTest
    static void testUpdateCompanyWithDuplicateName() {
        Company__c companyA = new Company__c(Company_Name__c = 'Alpha');
        Company__c companyB = new Company__c(Company_Name__c = 'Beta');
        insert new List<Company__c>{ companyA, companyB };

        // Try to update companyB to have the same Company_Name__c as companyA
        companyB.Company_Name__c = 'Alpha';

        Test.startTest();
        try {
            update companyB;
            } catch (DmlException e) {
            }
        Test.stopTest();
    }
}