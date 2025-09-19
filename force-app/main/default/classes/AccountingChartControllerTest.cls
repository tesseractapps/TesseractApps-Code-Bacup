@isTest
public class AccountingChartControllerTest {
@isTest
    static void testGetSalesPurchasesChart() {
        // Create a test Company
        Company__c testCompany = new Company__c(Company_Name__c = 'Test Company');
        insert testCompany;

        Date today = Date.today();
        Date firstDay = today.toStartOfMonth();

        // Create Invoice records
        List<Accounting_Invoices_Expenses__c> testRecords = new List<Accounting_Invoices_Expenses__c>();

        // Add 2 Invoices
        testRecords.add(new Accounting_Invoices_Expenses__c(
            Company__c = testCompany.Id,
            Invoice_Date__c = firstDay.addDays(1),
            Entity_Type__c = 'Invoice',
            Is_Payroll_Sales__c = true,
            Status__c = 'Approved'
        ));
        testRecords.add(new Accounting_Invoices_Expenses__c(
            Company__c = testCompany.Id,
            Invoice_Date__c = firstDay.addDays(1),
            Entity_Type__c = 'Invoice',
            Is_Payroll_Sales__c = true,
            Status__c = 'Approved'
        ));

        // Add 1 Expense
        testRecords.add(new Accounting_Invoices_Expenses__c(
            Company__c = testCompany.Id,
            Invoice_Date__c = firstDay.addDays(2),
            Entity_Type__c = 'Expense',
            Is_Payroll_Sales__c = false,
            Status__c = 'Approved'
        ));

        insert testRecords;
        
        
        

        Test.startTest();
        Map<String, Map<String, Integer>> chartData = AccountingChartController.getSalesPurchasesChart(testCompany.Id);
        AccountingChartController.getMonthNumber('January');
        AccountingChartController.getSalesStatusListByMonth(testCompany.Id, 'January');
        AccountingChartController.getPurchasesStatusListByMonth(testCompany.Id,'January');
        AccountingChartController.calculateChartTotalLiability(testCompany.Id,'1 Month');
        AccountingChartController.calculateChartTotalAssets(testCompany.Id,'1 Month');
        AccountingChartController.getPurchasesCountChart(testCompany.Id);
       
        Test.stopTest();

       
       
       

       
    }
}