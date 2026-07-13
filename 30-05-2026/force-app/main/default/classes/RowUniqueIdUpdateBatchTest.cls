@isTest
public class RowUniqueIdUpdateBatchTest {

    @testSetup
    static void setupData() {
        // Create a test Accounting_Invoices_Expenses__c record
        Accounting_Invoices_Expenses__c invoice = new Accounting_Invoices_Expenses__c(
            Due_Date__c = Date.today(),
            Is_Payroll_Sales__c = true
        );
        insert invoice;

        // Create related Accounting_Journal_Entry__c records with Sl_no__c but no Row_Unique_ID__c
        List<Accounting_Journal_Entry__c> journalEntries = new List<Accounting_Journal_Entry__c>();
        for (Integer i = 1; i <= 3; i++) {
            journalEntries.add(new Accounting_Journal_Entry__c(
                Accounting_Invoices_Expenses__c = invoice.Id,
                Sl_no__c = Decimal.valueOf(i) // Ensure correct type
            ));
        }
        insert journalEntries;
    }

    @isTest
    static void testBatchExecution() {
        Test.startTest();
        RowUniqueIdUpdateBatch batch = new RowUniqueIdUpdateBatch();
        Database.executeBatch(batch, 200);
        Test.stopTest();

        // Verify journal entries are updated with Row_Unique_ID__c
        List<Accounting_Journal_Entry__c> updatedEntries = [
            SELECT Id, Row_Unique_ID__c, Sl_no__c
            FROM Accounting_Journal_Entry__c
            WHERE Row_Unique_ID__c != null
        ];

        System.assertEquals(3, updatedEntries.size(), 'All journal entries should have Row_Unique_ID__c populated.');

        for (Accounting_Journal_Entry__c entry : updatedEntries) {
            System.assertNotEquals(null, entry.Row_Unique_ID__c, 'Row_Unique_ID__c should not be null.');
        }
    }
}