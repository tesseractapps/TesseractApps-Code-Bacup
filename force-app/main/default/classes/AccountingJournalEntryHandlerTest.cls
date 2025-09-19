@isTest
public class AccountingJournalEntryHandlerTest {

  @isTest
    static void testUpdateRelatedRecords_withTax() {
        // Setup data
        Company__c company = new Company__c(ABN__c = '1234567890');
        insert company;

        Entity_Profile__c entityProfile = new Entity_Profile__c(Name = 'Test Entity');
        insert entityProfile;

        Account_List__c accList = new Account_List__c(Name = 'Test List', Company__c = company.Id);
        insert accList;

        Accounting_Category__c liabilitiesCategory = new Accounting_Category__c(Name = 'Liabilities', Account_List__c = accList.Id);
        Accounting_Category__c assetsCategory = new Accounting_Category__c(Name = 'Assets', Account_List__c = accList.Id);
        Accounting_Category__c incomeCategory = new Accounting_Category__c(Name = 'Income', Account_List__c = accList.Id);
        insert new List<Accounting_Category__c>{ liabilitiesCategory, assetsCategory, incomeCategory };

        Accounting_Ledger_Items__c gstCollected = new Accounting_Ledger_Items__c(Name = 'GST Collected', Category__c = liabilitiesCategory.Id);
        Accounting_Ledger_Items__c tradeDebtors = new Accounting_Ledger_Items__c(Name = 'Trade Debtors', Category__c = assetsCategory.Id);
        Accounting_Ledger_Items__c incomeDebtors = new Accounting_Ledger_Items__c(Name = 'Income Debtors', Category__c = incomeCategory.Id);
        insert new List<Accounting_Ledger_Items__c>{ gstCollected, tradeDebtors, incomeDebtors };

        Accounting_Invoices_Expenses__c invoice = new Accounting_Invoices_Expenses__c(Invoice_No__c = '123');
        insert invoice;

        // Journal Entry with Tax as String '10%'
        Accounting_Journal_Entry__c incomeEntry = new Accounting_Journal_Entry__c(
            Sl_no__c = 1,
            Accounting_Invoices_Expenses__c = invoice.Id,
            Description__c = 'Income Description',
            Company__c = company.Id,
            Entity_Profile__c = entityProfile.Id,
            Invoice_Date__c = Date.today(),
            Post_Date__c = Date.today(),
            Invoice_No__c = 'INV-001',
            Comments__c = 'Test comment',
            Accounting_Ledger_Items__c = incomeDebtors.Id,
            Unit_Price__c = 100,
            Quantity__c = 2,
            Tax__c = 10 // <-- this is a String field
        );
        insert incomeEntry;

        Test.startTest();
        AccountingJournalEntryHandler.updateRelatedRecords(new List<Accounting_Journal_Entry__c>{ incomeEntry });
        Test.stopTest();

        // Validation
        List<Accounting_Journal_Entry__c> relatedEntries = [
            SELECT Id, Total_Amount__c, Accounting_Ledger_Items__r.Name
            FROM Accounting_Journal_Entry__c
            WHERE Accounting_Invoices_Expenses__c = :invoice.Id
            AND Id != :incomeEntry.Id
        ];

        System.assertEquals(2, relatedEntries.size(), 'Expected 2 related journal entries');

        Boolean hasLiabilities = false;
        Boolean hasAssets = false;

        for (Accounting_Journal_Entry__c entry : relatedEntries) {
            if (entry.Accounting_Ledger_Items__r.Name == 'GST Collected') {
                hasLiabilities = true;
                System.assertEquals(18.18, entry.Total_Amount__c.setScale(2), 'Expected GST value 18.18');
            } else if (entry.Accounting_Ledger_Items__r.Name == 'Trade Debtors') {
                hasAssets = true;
                System.assertEquals(218.18, entry.Total_Amount__c.setScale(2), 'Expected total value 218.18');
            }
        }

        System.assert(hasLiabilities, 'Liabilities entry should exist');
        System.assert(hasAssets, 'Assets entry should exist');
    }

   /* @isTest
    static void testUpdateRelatedRecords_noTax() {
        // Same setup as previous test, but no Tax
        Company__c company = new Company__c(ABN__c = '9876543210');
        insert company;

        Account_List__c accList = new Account_List__c(Name = 'Test List 2', Company__c = company.Id);
        insert accList;

        Accounting_Category__c liabilitiesCategory = new Accounting_Category__c(Name = 'Liabilities', Account_List__c = accList.Id);
        Accounting_Category__c assetsCategory = new Accounting_Category__c(Name = 'Assets', Account_List__c = accList.Id);
        Accounting_Category__c incomeCategory = new Accounting_Category__c(Name = 'Income', Account_List__c = accList.Id);
        insert new List<Accounting_Category__c>{ liabilitiesCategory, assetsCategory, incomeCategory };

        Accounting_Ledger_Items__c gstCollected = new Accounting_Ledger_Items__c(Name = 'GST Collected', Category__c = liabilitiesCategory.Id);
        Accounting_Ledger_Items__c tradeDebtors = new Accounting_Ledger_Items__c(Name = 'Trade Debtors', Category__c = assetsCategory.Id);
        Accounting_Ledger_Items__c incomeDebtors = new Accounting_Ledger_Items__c(Name = 'Income Debtors', Category__c = incomeCategory.Id);
        insert new List<Accounting_Ledger_Items__c>{ gstCollected, tradeDebtors, incomeDebtors };

        Accounting_Invoices_Expenses__c invoice = new Accounting_Invoices_Expenses__c(Invoice_No__c = '124');
        insert invoice;

        Accounting_Journal_Entry__c entry = new Accounting_Journal_Entry__c(
            Sl_no__c = 1,
            Accounting_Invoices_Expenses__c = invoice.Id,
            Company__c = company.Id,
            Invoice_Date__c = Date.today(),
            Post_Date__c = Date.today(),
            Accounting_Ledger_Items__c = incomeDebtors.Id,
            Unit_Price__c = 50,
            Quantity__c = 3
            // No Tax__c field
        );
        insert entry;

        Test.startTest();
        AccountingJournalEntryHandler.updateRelatedRecords(new List<Accounting_Journal_Entry__c>{ entry });
        Test.stopTest();

        List<Accounting_Journal_Entry__c> entries = [
            SELECT Id, Total_Amount__c
            FROM Accounting_Journal_Entry__c
            WHERE Accounting_Invoices_Expenses__c = :invoice.Id
        ];

        System.assertEquals(3, entries.size(), 'Should include original + 2 related entries');
        Decimal expectedTotal = 150; // 50 * 3

        for (Accounting_Journal_Entry__c je : entries) {
            System.assert(je.Total_Amount__c != null, 'Each journal entry should have Total_Amount__c set');
            System.assert(je.Total_Amount__c >= expectedTotal, 'Total amount should be at least original');
        }
    }*/
}