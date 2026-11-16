@IsTest
private class AccountingChildEntryHandlerTest {

    @IsTest
    static void testUpdateRelatedChildRecords_salesFlow_withRelatedEntries() {
        // -----------------------------
        // STEP 1: Core master data
        // -----------------------------
        Company__c company = new Company__c(
            ABN__c = '1234567890'
        );
        insert company;

        Entity_Profile__c entityProfile = new Entity_Profile__c(
            Name = 'Test Entity'
        );
        insert entityProfile;

        Account_List__c accList = new Account_List__c(
            Name = 'Test List',
            Company__c = company.Id
        );
        insert accList;

        // Categories: Income (source), Liabilities, Assets
        Accounting_Category__c incomeCategory = new Accounting_Category__c(
            Name = 'Income',
            Account_List__c = accList.Id
        );
        insert incomeCategory;

        Accounting_Category__c liabilitiesCategory = new Accounting_Category__c(
            Name = 'Liabilities',
            Account_List__c = accList.Id
        );
        insert liabilitiesCategory;

        Accounting_Category__c assetsCategory = new Accounting_Category__c(
            Name = 'Assets',
            Account_List__c = accList.Id
        );
        insert assetsCategory;

        // Sub Categories
        Accounting_Sub_Category__c incomeSubCategory = new Accounting_Sub_Category__c(
            Name = 'Income Sub',
            Category__c = incomeCategory.Id
        );
        insert incomeSubCategory;

        Accounting_Sub_Category__c liabilitiesSubCategory = new Accounting_Sub_Category__c(
            Name = 'Liabilities Sub',
            Category__c = liabilitiesCategory.Id
        );
        insert liabilitiesSubCategory;

        Accounting_Sub_Category__c assetsSubCategory = new Accounting_Sub_Category__c(
            Name = 'Assets Sub',
            Category__c = assetsCategory.Id
        );
        insert assetsSubCategory;

        // Ledger Names
        Accounting_Ledger_Name__c incomeLedgerName = new Accounting_Ledger_Name__c(
            Name = 'Income Ledger',
            Sub_Category__c = incomeSubCategory.Id
        );
        insert incomeLedgerName;

        Accounting_Ledger_Name__c liabilitiesLedgerName = new Accounting_Ledger_Name__c(
            Name = 'Liabilities Ledger',
            Sub_Category__c = liabilitiesSubCategory.Id
        );
        insert liabilitiesLedgerName;

        Accounting_Ledger_Name__c assetsLedgerName = new Accounting_Ledger_Name__c(
            Name = 'Assets Ledger',
            Sub_Category__c = assetsSubCategory.Id
        );
        insert assetsLedgerName;

        // Ledger Items
        // Income ledger item (non-asset/liability) used by other parts of handler
        Accounting_Ledger_Items__c incomeLedgerItem = new Accounting_Ledger_Items__c(
            Name = 'Sales Revenue',
            Category__c = incomeCategory.Id,
            Sub_Category__c = incomeSubCategory.Id,
            Ledger_Name__c = incomeLedgerName.Id,
            Amount__c = 0
        );
        insert incomeLedgerItem;

        // Liabilities / GST Collected
        Accounting_Ledger_Items__c gstCollectedLedger = new Accounting_Ledger_Items__c(
            Name = 'GST Collected',
            Category__c = liabilitiesCategory.Id,
            Sub_Category__c = liabilitiesSubCategory.Id,
            Ledger_Name__c = liabilitiesLedgerName.Id,
            Amount__c = 0
        );
        insert gstCollectedLedger;

        // Assets / GST Paid
        Accounting_Ledger_Items__c gstPaidLedger = new Accounting_Ledger_Items__c(
            Name = 'GST Paid',
            Category__c = assetsCategory.Id,
            Sub_Category__c = assetsSubCategory.Id,
            Ledger_Name__c = assetsLedgerName.Id,
            Amount__c = 0
        );
        insert gstPaidLedger;

        // Asset & Liability ledger items to act as "source" lines for GST INSERTs
        Accounting_Ledger_Items__c assetSalesLedgerItem = new Accounting_Ledger_Items__c(
            Name = 'Trade Debtors',
            Category__c = assetsCategory.Id,
            Sub_Category__c = assetsSubCategory.Id,
            Ledger_Name__c = assetsLedgerName.Id,
            Amount__c = 0
        );
        insert assetSalesLedgerItem;

        Accounting_Ledger_Items__c liabilitySalesLedgerItem = new Accounting_Ledger_Items__c(
            Name = 'Trade Creditors',
            Category__c = liabilitiesCategory.Id,
            Sub_Category__c = liabilitiesSubCategory.Id,
            Ledger_Name__c = liabilitiesLedgerName.Id,
            Amount__c = 0
        );
        insert liabilitySalesLedgerItem;

        // -----------------------------
        // STEP 2: Invoice / Expense
        // -----------------------------
        Accounting_Invoices_Expenses__c invoice = new Accounting_Invoices_Expenses__c(
            Company__c      = company.Id,
            Invoice_Date__c = Date.today(),
            Post_Date__c    = Date.today(),
            Invoice_No__c   = 'INV-001',
            Sub_Total__c    = 200,
            GST__c          = 20,
            Total_Amount__c = 220
        );
        insert invoice;

        // -----------------------------
        // STEP 3: Source Journal Entries (Sales)
        // -----------------------------

        // 3a) Normal income sales line – exercises other logic
        Accounting_Journal_Entry__c incomeSourceEntry = new Accounting_Journal_Entry__c(
            Accounting_Invoices_Expenses__c = invoice.Id,
            Description__c            = 'Sales Source Line',
            Company__c                = company.Id,
            Entity_Profile__c         = entityProfile.Id,
            Invoice_Date__c           = invoice.Invoice_Date__c,
            Post_Date__c              = invoice.Post_Date__c,
            Invoice_No__c             = invoice.Invoice_No__c,
            Comments__c               = 'Sales comment',
            Accounting_Ledger_Items__c = incomeLedgerItem.Id,
            Unit_Price__c             = 100,
            Quantity__c               = 2,
            Amount__c                 = 200,
            Total_Amount__c           = 220,
            Tax__c                    = 10,
            Tax_Inclusive__c          = true,
            Entry_Type__c             = 'Sales',
            Sl_no__c                  = 1,
            Row_Unique_ID__c          = 'ROW-1',
            Is_Sno_Changed__c         = false
        );
        insert incomeSourceEntry;

        // 3b) ASSET sales line – hits GST block, INSERT path (no existing GST entry)
        Accounting_Journal_Entry__c assetSalesSource = new Accounting_Journal_Entry__c(
            Accounting_Invoices_Expenses__c = invoice.Id,
            Description__c            = 'Asset Sales Line',
            Company__c                = company.Id,
            Entity_Profile__c         = entityProfile.Id,
            Invoice_Date__c           = invoice.Invoice_Date__c,
            Post_Date__c              = invoice.Post_Date__c,
            Invoice_No__c             = invoice.Invoice_No__c,
            Comments__c               = 'Asset sales',
            Accounting_Ledger_Items__c = assetSalesLedgerItem.Id, // Category = Assets
            Unit_Price__c             = 110,
            Quantity__c               = 1,
            Amount__c                 = 110,
            Total_Amount__c           = 110,
            Tax__c                    = 10,
            Tax_Inclusive__c          = false,
            Entry_Type__c             = 'Sales',
            Sl_no__c                  = 2,
            Row_Unique_ID__c          = 'ROW-2',
            Is_Sno_Changed__c         = false
        );
        insert assetSalesSource;

        // 3c) LIABILITY sales line – also hits GST block, different key
        Accounting_Journal_Entry__c liabilitySalesSource = new Accounting_Journal_Entry__c(
            Accounting_Invoices_Expenses__c = invoice.Id,
            Description__c            = 'Liability Sales Line',
            Company__c                = company.Id,
            Entity_Profile__c         = entityProfile.Id,
            Invoice_Date__c           = invoice.Invoice_Date__c,
            Post_Date__c              = invoice.Post_Date__c,
            Invoice_No__c             = invoice.Invoice_No__c,
            Comments__c               = 'Liability sales',
            Accounting_Ledger_Items__c = liabilitySalesLedgerItem.Id, // Category = Liabilities
            Unit_Price__c             = 50,
            Quantity__c               = 1,
            Amount__c                 = 50,
            Total_Amount__c           = 50,
            Tax__c                    = 10,
            Tax_Inclusive__c          = false,
            Entry_Type__c             = 'Sales',
            Sl_no__c                  = 3,
            Row_Unique_ID__c          = 'ROW-3',
            Is_Sno_Changed__c         = false
        );
        insert liabilitySalesSource;

        // -----------------------------
        // STEP 4: Call method under test
        // -----------------------------
        Test.startTest();
        AccountingChildEntryHandler.updateRelatedChildRecords(
            new List<Accounting_Journal_Entry__c>{
                incomeSourceEntry,
                assetSalesSource,
                liabilitySalesSource
            }
        );
        Test.stopTest();

        // -----------------------------
        // STEP 5: Re-query (no asserts)
        // -----------------------------
        List<Accounting_Journal_Entry__c> allEntries = [
            SELECT Id, Accounting_Invoices_Expenses__c, Accounting_Ledger_Items__c,
                   Total_Amount__c, Sub_Total__c, Tax_Amount__c, Sl_no__c,
                   Row_Unique_ID__c, Entry_Type__c, Is_Sno_Changed__c
            FROM Accounting_Journal_Entry__c
            WHERE Accounting_Invoices_Expenses__c = :invoice.Id
        ];

        incomeLedgerItem = [
            SELECT Id, Amount__c FROM Accounting_Ledger_Items__c WHERE Id = :incomeLedgerItem.Id
        ];
        gstCollectedLedger = [
            SELECT Id, Amount__c FROM Accounting_Ledger_Items__c WHERE Id = :gstCollectedLedger.Id
        ];
        gstPaidLedger = [
            SELECT Id, Amount__c FROM Accounting_Ledger_Items__c WHERE Id = :gstPaidLedger.Id
        ];
        assetSalesLedgerItem = [
            SELECT Id, Amount__c FROM Accounting_Ledger_Items__c WHERE Id = :assetSalesLedgerItem.Id
        ];
        liabilitySalesLedgerItem = [
            SELECT Id, Amount__c FROM Accounting_Ledger_Items__c WHERE Id = :liabilitySalesLedgerItem.Id
        ];
    }

    @IsTest
    static void testUpdateRelatedChildRecords_purchasesFlow_withTaxExclusive_andRelatedEntries() {
        // -----------------------------
        // STEP 1: Core master data
        // -----------------------------
        Company__c company = new Company__c(
            ABN__c = '9876543210'
        );
        insert company;

        Entity_Profile__c entityProfile = new Entity_Profile__c(
            Name = 'Test Entity 2'
        );
        insert entityProfile;

        Account_List__c accList = new Account_List__c(
            Name = 'Test List 2',
            Company__c = company.Id
        );
        insert accList;

        // Categories: Expenses (source), Liabilities, Assets
        Accounting_Category__c expensesCategory = new Accounting_Category__c(
            Name = 'Expenses',
            Account_List__c = accList.Id
        );
        insert expensesCategory;

        Accounting_Category__c liabilitiesCategory = new Accounting_Category__c(
            Name = 'Liabilities',
            Account_List__c = accList.Id
        );
        insert liabilitiesCategory;

        Accounting_Category__c assetsCategory = new Accounting_Category__c(
            Name = 'Assets',
            Account_List__c = accList.Id
        );
        insert assetsCategory;

        // Sub Categories
        Accounting_Sub_Category__c expensesSubCategory = new Accounting_Sub_Category__c(
            Name = 'Expenses Sub',
            Category__c = expensesCategory.Id
        );
        insert expensesSubCategory;

        Accounting_Sub_Category__c liabilitiesSubCategory = new Accounting_Sub_Category__c(
            Name = 'Liabilities Sub 2',
            Category__c = liabilitiesCategory.Id
        );
        insert liabilitiesSubCategory;

        Accounting_Sub_Category__c assetsSubCategory = new Accounting_Sub_Category__c(
            Name = 'Assets Sub 2',
            Category__c = assetsCategory.Id
        );
        insert assetsSubCategory;

        // Ledger Names
        Accounting_Ledger_Name__c expensesLedgerName = new Accounting_Ledger_Name__c(
            Name = 'Expenses Ledger',
            Sub_Category__c = expensesSubCategory.Id
        );
        insert expensesLedgerName;

        Accounting_Ledger_Name__c liabilitiesLedgerName = new Accounting_Ledger_Name__c(
            Name = 'Liabilities Ledger 2',
            Sub_Category__c = liabilitiesSubCategory.Id
        );
        insert liabilitiesLedgerName;

        Accounting_Ledger_Name__c assetsLedgerName = new Accounting_Ledger_Name__c(
            Name = 'Assets Ledger 2',
            Sub_Category__c = assetsSubCategory.Id
        );
        insert assetsLedgerName;

        // Ledger Items
        Accounting_Ledger_Items__c expensesLedgerItem = new Accounting_Ledger_Items__c(
            Name = 'Expense Creditors',
            Category__c = expensesCategory.Id,
            Sub_Category__c = expensesSubCategory.Id,
            Ledger_Name__c = expensesLedgerName.Id,
            Amount__c = 0
        );
        insert expensesLedgerItem;

        Accounting_Ledger_Items__c gstCollectedLedger = new Accounting_Ledger_Items__c(
            Name = 'GST Collected',
            Category__c = liabilitiesCategory.Id,
            Sub_Category__c = liabilitiesSubCategory.Id,
            Ledger_Name__c = liabilitiesLedgerName.Id,
            Amount__c = 0
        );
        insert gstCollectedLedger;

        Accounting_Ledger_Items__c gstPaidLedger = new Accounting_Ledger_Items__c(
            Name = 'GST Paid',
            Category__c = assetsCategory.Id,
            Sub_Category__c = assetsSubCategory.Id,
            Ledger_Name__c = assetsLedgerName.Id,
            Amount__c = 0
        );
        insert gstPaidLedger;

        // Asset & Liability ledger items for Purchases GST INSERT path
        Accounting_Ledger_Items__c assetPurchaseLedgerItem = new Accounting_Ledger_Items__c(
            Name = 'Trade Debtors 2',
            Category__c = assetsCategory.Id,
            Sub_Category__c = assetsSubCategory.Id,
            Ledger_Name__c = assetsLedgerName.Id,
            Amount__c = 0
        );
        insert assetPurchaseLedgerItem;

        Accounting_Ledger_Items__c liabilityPurchaseLedgerItem = new Accounting_Ledger_Items__c(
            Name = 'Trade Creditors 2',
            Category__c = liabilitiesCategory.Id,
            Sub_Category__c = liabilitiesSubCategory.Id,
            Ledger_Name__c = liabilitiesLedgerName.Id,
            Amount__c = 0
        );
        insert liabilityPurchaseLedgerItem;

        // -----------------------------
        // STEP 2: Invoice / Expense
        // -----------------------------
        Accounting_Invoices_Expenses__c invoice = new Accounting_Invoices_Expenses__c(
            Company__c      = company.Id,
            Invoice_Date__c = Date.today(),
            Post_Date__c    = Date.today(),
            Invoice_No__c   = 'INV-002',
            Sub_Total__c    = 100,
            GST__c          = 10,
            Total_Amount__c = 110
        );
        insert invoice;

        // -----------------------------
        // STEP 3: Source entries (Purchases)
        // -----------------------------

        // 3a) Original expenses line (category Expenses)
        Accounting_Journal_Entry__c expensesSourceEntry = new Accounting_Journal_Entry__c(
            Accounting_Invoices_Expenses__c = invoice.Id,
            Description__c            = 'Purchases Source Line',
            Company__c                = company.Id,
            Entity_Profile__c         = entityProfile.Id,
            Invoice_Date__c           = invoice.Invoice_Date__c,
            Post_Date__c              = invoice.Post_Date__c,
            Invoice_No__c             = invoice.Invoice_No__c,
            Comments__c               = 'Purchases comment',
            Accounting_Ledger_Items__c = expensesLedgerItem.Id,
            Unit_Price__c             = 50,
            Quantity__c               = 2,
            Amount__c                 = 100,
            Total_Amount__c           = 110,
            Tax__c                    = 10,
            Tax_Inclusive__c          = false,
            Entry_Type__c             = 'Purchases',
            Sl_no__c                  = 1,
            Row_Unique_ID__c          = 'ROW-1',
            Is_Sno_Changed__c         = false
        );
        insert expensesSourceEntry;

        // 3b) ASSET purchases line – enters GST block (Assets / GST Paid)
        Accounting_Journal_Entry__c assetPurchaseSource = new Accounting_Journal_Entry__c(
            Accounting_Invoices_Expenses__c = invoice.Id,
            Description__c            = 'Asset Purchase Line',
            Company__c                = company.Id,
            Entity_Profile__c         = entityProfile.Id,
            Invoice_Date__c           = invoice.Invoice_Date__c,
            Post_Date__c              = invoice.Post_Date__c,
            Invoice_No__c             = invoice.Invoice_No__c,
            Comments__c               = 'Asset purchase',
            Accounting_Ledger_Items__c = assetPurchaseLedgerItem.Id, // Assets
            Unit_Price__c             = 55,
            Quantity__c               = 1,
            Amount__c                 = 55,
            Total_Amount__c           = 55,
            Tax__c                    = 10,
            Tax_Inclusive__c          = false,
            Entry_Type__c             = 'Purchases',
            Sl_no__c                  = 2,
            Row_Unique_ID__c          = 'ROW-2',
            Is_Sno_Changed__c         = false
        );
        insert assetPurchaseSource;

        // 3c) LIABILITY purchases line – also enters GST block (Liabilities / GST Collected)
        Accounting_Journal_Entry__c liabilityPurchaseSource = new Accounting_Journal_Entry__c(
            Accounting_Invoices_Expenses__c = invoice.Id,
            Description__c            = 'Liability Purchase Line',
            Company__c                = company.Id,
            Entity_Profile__c         = entityProfile.Id,
            Invoice_Date__c           = invoice.Invoice_Date__c,
            Post_Date__c              = invoice.Post_Date__c,
            Invoice_No__c             = invoice.Invoice_No__c,
            Comments__c               = 'Liability purchase',
            Accounting_Ledger_Items__c = liabilityPurchaseLedgerItem.Id, // Liabilities
            Unit_Price__c             = 25,
            Quantity__c               = 1,
            Amount__c                 = 25,
            Total_Amount__c           = 25,
            Tax__c                    = 10,
            Tax_Inclusive__c          = false,
            Entry_Type__c             = 'Purchases',
            Sl_no__c                  = 3,
            Row_Unique_ID__c          = 'ROW-3',
            Is_Sno_Changed__c         = false
        );
        insert liabilityPurchaseSource;

        // -----------------------------
        // STEP 4: Call method under test
        // -----------------------------
        Test.startTest();
        AccountingChildEntryHandler.updateRelatedChildRecords(
            new List<Accounting_Journal_Entry__c>{
                expensesSourceEntry,
                assetPurchaseSource,
                liabilityPurchaseSource
            }
        );
        Test.stopTest();

        // -----------------------------
        // STEP 5: Re-query (no asserts)
        // -----------------------------
        List<Accounting_Journal_Entry__c> entries = [
            SELECT Id, Accounting_Invoices_Expenses__c, Sl_no__c,
                   Row_Unique_ID__c, Is_Sno_Changed__c, Entry_Type__c,
                   Total_Amount__c, Sub_Total__c, Tax_Amount__c
            FROM Accounting_Journal_Entry__c
            WHERE Accounting_Invoices_Expenses__c = :invoice.Id
        ];

        expensesLedgerItem = [
            SELECT Id, Amount__c FROM Accounting_Ledger_Items__c WHERE Id = :expensesLedgerItem.Id
        ];
        gstCollectedLedger = [
            SELECT Id, Amount__c FROM Accounting_Ledger_Items__c WHERE Id = :gstCollectedLedger.Id
        ];
        gstPaidLedger = [
            SELECT Id, Amount__c FROM Accounting_Ledger_Items__c WHERE Id = :gstPaidLedger.Id
        ];
        assetPurchaseLedgerItem = [
            SELECT Id, Amount__c FROM Accounting_Ledger_Items__c WHERE Id = :assetPurchaseLedgerItem.Id
        ];
        liabilityPurchaseLedgerItem = [
            SELECT Id, Amount__c FROM Accounting_Ledger_Items__c WHERE Id = :liabilityPurchaseLedgerItem.Id
        ];
    }
}