@isTest
public class ChartOfAccountsTest {
	@testSetup
    static void setupTestData() {
        // Insert test Chart_of_Accounts__c record
        Chart_of_Accounts__c coa = new Chart_of_Accounts__c(
           // Name = 'Test COA',
            Organisation_Name__c = 'TestOrg',
            Key_Word__c = 'Keyword',
            Type_of_Key__c = 'Assets',
            Date__c = Date.today(),
            Account_Number__c = 'ACC123',
            Account_Name__c = 'Test Account'
        );
        insert coa;

        // Insert test Final_Accounts_Data__c record
        Final_Accounts_Data__c finalAcc = new Final_Accounts_Data__c(
            Date__c = Date.today(),
            Amount__c = 150.00,
            Description__c = 'Test Description',
            Account_Name__c = 'Test Account',
            Account_Number__c = 'ACC123',
            Category__c = 'Assets',
            Organisation_Name__c = 'TestOrg'
        );
        insert finalAcc;
    }

    @isTest
    static void testGetKeyWords() {
        Test.startTest();
        List<Chart_of_Accounts__c> result = ChartOfAccounts.getKeyWords('TestOrg');
        Test.stopTest();

        System.assertNotEquals(0, result.size(), 'Keyword records should be returned');
        System.assertEquals('TestOrg', result[0].Organisation_Name__c);
    }

    @isTest
    static void testCreateRawData() {
        List<ChartOfAccounts.rawDataClassWrapper> inputData = new List<ChartOfAccounts.rawDataClassWrapper>();

        ChartOfAccounts.rawDataClassWrapper wrapper = new ChartOfAccounts.rawDataClassWrapper();
        wrapper.dateofAccount = Date.today();
        wrapper.Amount = 100.50;
        wrapper.Description = 'Test Insert';
        wrapper.AccountName = 'Test Account';
        wrapper.AccountNumber = 'ACC999';
        wrapper.Category = 'Assets';
        inputData.add(wrapper);

        String jsonInput = JSON.serialize(inputData);

        Test.startTest();
        ChartOfAccounts.createRawData(jsonInput, 'TestOrg');
        Test.stopTest();

        List<Final_Accounts_Data__c> insertedData = [SELECT Id, Description__c FROM Final_Accounts_Data__c WHERE Description__c = 'Test Insert'];
        System.assertEquals(1, insertedData.size(), 'Raw data record should be inserted');
    }

    @isTest
    static void testGetFinalAccountsdata() {
       String startDate = String.valueOf(Date.today().addDays(-1));
String endDate = String.valueOf(Date.today());

        Test.startTest();
        List<Final_Accounts_Data__c> result = ChartOfAccounts.getFinalAccountsdata(startDate, endDate, 'TestOrg');
        Test.stopTest();

        System.assertNotEquals(0, result.size(), 'Final accounts data should be returned');
        System.assertEquals('Test Account', result[0].Account_Name__c);
    }
}