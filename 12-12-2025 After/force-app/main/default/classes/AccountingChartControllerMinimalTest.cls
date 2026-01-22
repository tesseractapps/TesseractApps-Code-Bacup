@IsTest
public class AccountingChartControllerMinimalTest {

    @testSetup
    static void setupData() {
        // Company__c.Name is auto-number, so DO NOT set it
        Company__c company = new Company__c();
        // 👉 Add any required custom fields if your org has validation rules:
        // company.Some_Required_Field__c = 'Value';
        insert company;

        Date today = Date.today();
        Account_List__c accList = new Account_List__c(
            Name = 'Default Account List',
            Company__c = company.Id
        );
        insert accList;
        Accounting_Category__c cat = new Accounting_Category__c(
            Name = 'Default Category',
            Account_List__c = accList.Id
        );
        insert cat;
        
        // Basic Sales Invoice
        Accounting_Invoices_Expenses__c salesInv = new Accounting_Invoices_Expenses__c(
            Company__c          = company.Id,
            Invoice_Date__c     = today,
            Entity_Type__c      = 'Invoice',
            Is_Payroll_Sales__c = true,
            Status__c           = 'Approved'
        );
        insert salesInv;

        // Basic Purchase (Expense)
        Accounting_Invoices_Expenses__c purchaseInv = new Accounting_Invoices_Expenses__c(
            Company__c              = company.Id,
            Invoice_Date__c         = today,
            Entity_Type__c          = 'Expense',
            Is_Payroll_Purchases__c = true,
            Status__c               = 'Approved'
        );
        insert purchaseInv;

        // Simple Journal Entry linked to invoice
        Accounting_Journal_Entry__c je = new Accounting_Journal_Entry__c(
            Company__c                      = company.Id,
            Accounting_Invoices_Expenses__c = salesInv.Id,
            Invoice_Date__c                 = today,
            Row_Unique_ID__c                = 'ROW-1' 
        );
        insert je;
		
        Accounting_Ledger_Items__c gstPaid = new Accounting_Ledger_Items__c(
            Name = 'GST Paid',
            Category__c = cat.Id
        );
        Accounting_Ledger_Items__c gstCollected = new Accounting_Ledger_Items__c(
            Name = 'GST Collected',
            Category__c = cat.Id
        );
        // Ledger item to use as accountItemId
        Accounting_Ledger_Items__c ledgerItem = new Accounting_Ledger_Items__c(
            Name = 'Test Ledger Item'
            // Add required fields here if your org forces them
            // Account_Number__c = '1000'
        );
        Accounting_Ledger_Items__c salesLedger = new Accounting_Ledger_Items__c(
            Name = 'Sales Ledger',
            Category__c = cat.Id
        );
        
        //insert ledgerItem;
        insert new List<Accounting_Ledger_Items__c>{ gstPaid, gstCollected,ledgerItem, salesLedger };
    }

    private static Id getCompanyId() {
        return [SELECT Id FROM Company__c LIMIT 1].Id;
    }

    private static Accounting_Invoices_Expenses__c getAnyInvoice() {
        return [SELECT Id, Company__c, Invoice_Date__c 
                FROM Accounting_Invoices_Expenses__c 
                LIMIT 1];
    }

    private static Accounting_Journal_Entry__c getAnyJournalEntry() {
        return [SELECT Id, Company__c, Accounting_Invoices_Expenses__c, Invoice_Date__c
                FROM Accounting_Journal_Entry__c 
                LIMIT 1];
    }

    // ----------------------------------------------------------------------
    // 1) Charts + month logic
    // ----------------------------------------------------------------------
    @IsTest
    static void testSalesPurchasesChartsAndStatus() {
        Id companyId = getCompanyId();

        Test.startTest();
        AccountingChartController.getSalesPurchasesChart(companyId);
        AccountingChartController.getMonthNumber('January');
        AccountingChartController.getSalesStatusListByMonth(companyId, 'January');
        AccountingChartController.getPurchasesStatusListByMonth(companyId, 'January');
        AccountingChartController.getPurchasesCountChart(companyId);
        Test.stopTest();
    }

    // ✅ UPDATED: cover all selectedMonths branches
    @IsTest
    static void testChartTotals() {
        Id companyId = getCompanyId();

        List<String> allRanges = new List<String>{
            '1 Month',
            '2 Months',
            '3 Months',
            '6 Months',
            '1 Year'
        };

        Test.startTest();
        for (String months : allRanges) {
            AccountingChartController.calculateChartTotalAssets(companyId, months);
            AccountingChartController.calculateChartTotalLiability(companyId, months);
        }
        Test.stopTest();
    }

    // ----------------------------------------------------------------------
    // 2) Purchases list / edit
    // ----------------------------------------------------------------------
    @IsTest
    static void testAccountingPurchasesAndEdit() {
        Id companyId = getCompanyId();
        Date today = Date.today();
        String sDate = String.valueOf(today.addDays(-30));
        String eDate = String.valueOf(today);

        Accounting_Invoices_Expenses__c anyInv = getAnyInvoice();

        Test.startTest();
        AccountingChartController.getAccountingPurchases(sDate, eDate, companyId);
        AccountingChartController.getAccountingPurchasesInEdit(anyInv.Id);
        Test.stopTest();
    }

    // ----------------------------------------------------------------------
    // 3) General Ledger list / edit / ledger items
    // ----------------------------------------------------------------------
    @IsTest
    static void testGeneralLedgerQueries() {
        Id companyId = getCompanyId();
        Date today = Date.today();
        String sDate = String.valueOf(today.addDays(-30));
        String eDate = String.valueOf(today);

        Accounting_Invoices_Expenses__c anyInv = getAnyInvoice();

        Test.startTest();
        AccountingChartController.getAccountingGeneralLedger(sDate, eDate, companyId);
        AccountingChartController.getGeneralLedgerInEdit(anyInv.Id);

        AccountingChartController.getAllLedgerItems(companyId);
        // If your org definitely has getAllLedgerItemsForPurchases(Id) you can uncomment:
        // AccountingChartController.getAllLedgerItemsForPurchases(companyId);
        Test.stopTest();
    }

    // ----------------------------------------------------------------------
    // 4) saveUpdategeneralLedgerData
    // ----------------------------------------------------------------------
    @IsTest
    static void testSaveUpdateGeneralLedgerData() {
        Id companyId = getCompanyId();

        Date today = Date.today();
        String dateStr     = String.valueOf(today); // yyyy-MM-dd
        String postDateStr = String.valueOf(today);

        // Header JSON – matches saveUpdategeneralLedgerData expectations
        Map<String, Object> salesEntry = new Map<String, Object>{
            'InvoiceDate'  => dateStr,
            'PostDate'     => postDateStr,
            'InvoiceNo'    => 'INV-GL-001',
            'taxInclusive' => true,
            'comments'     => 'GL test invoice',
            'notes'        => 'Test note',
            'invoiceId'    => null   // force INSERT path
        };
        String salesEntryJson = JSON.serialize(salesEntry);

       // Accounting_Ledger_Items__c ledgerItem = [
        //    SELECT Id FROM Accounting_Ledger_Items__c LIMIT 1
        //];
         Accounting_Ledger_Items__c salesLedger = [
            SELECT Id
            FROM Accounting_Ledger_Items__c
            WHERE Name = 'Sales Ledger'
            LIMIT 1
        ];

        List<Map<String, Object>> salesEntryList = new List<Map<String, Object>>{
            new Map<String, Object>{
                'Amount__c'       => 100,
                'Cr_Dr__c'        => 'Dr',
                'accountCategory' => 'Assets',
                'tax'             => '10',
                'Description__c'  => 'GL Line 1',
                'sno'             => 1,
                'InvoiceNo'       => 'INV-GL-001',
                'accountItemId'   => (Object)salesLedger.Id,
                'Id'              => null
            },
            new Map<String, Object>{
                'Amount__c'       => 200,
                'Cr_Dr__c'        => 'Cr',
                'accountCategory' => 'Expenses',  // 🔥 THIS TRIGGERS THE ELSE BLOCK
                'tax'             => '5',
                'Description__c'  => 'GL Line 2',
                'sno'             => 2,
                'InvoiceNo'       => 'INV-GL-001',
                'accountItemId'   => (Object)salesLedger.Id,
                'Id'              => null
            }
        };
        String salesEntryListJson = JSON.serialize(salesEntryList);

        Test.startTest();
        AccountingChartController.saveUpdategeneralLedgerData(
            salesEntryJson,
            salesEntryListJson,
            String.valueOf(companyId)
        );
        Test.stopTest();
    }

    // ----------------------------------------------------------------------
    // 5) saveUpdateRfqInvoice
    // ----------------------------------------------------------------------
    @IsTest
    static void testSaveUpdateRfqInvoice() {
        Id companyId = getCompanyId();
        Date today = Date.today();
        String invoiceDateStr = String.valueOf(today);
        String postDateStr    = String.valueOf(today);
        String dueDateStr     = String.valueOf(today.addDays(7));

        Map<String, Object> salesEntry = new Map<String, Object>{
            'invoiceId'    => null,
            'InvoiceDate'  => invoiceDateStr,
            'InvoiceNo'    => 'RFQ-001',
            'Status'       => 'Approved',
            'company'      => String.valueOf(companyId),
            'PostDate'     => postDateStr,
            'dueDate'      => dueDateStr,
            'taxInclusive' => true,
            'comments'     => 'RFQ test invoice',
            'notes'        => 'RFQ notes'
        };
        String salesEntryJson = JSON.serialize(salesEntry);

        Map<String, Object> amountEntry = new Map<String, Object>{
            'subTotal'    => 50,
            'taxAmount'   => 5,
            'totalAmount' => 55
        };
        String amountEntryJson = JSON.serialize(amountEntry);

        Accounting_Ledger_Items__c ledgerItem = [
            SELECT Id FROM Accounting_Ledger_Items__c LIMIT 1
        ];

        List<Map<String, Object>> salesEntryList = new List<Map<String, Object>>{
            new Map<String, Object>{
                'sno'            => 1,
                'Description__c' => 'RFQ Line 1',
                'Amount__c'      => 50,
                'Quantity__c'    => 1,
                'tax'            => '10',
                'accountItemId'  => (Object)ledgerItem.Id,
                'lineItems'      => 'Service A',
                'Id'             => null
            }
        };
        String salesEntryListJson = JSON.serialize(salesEntryList);

        Test.startTest();
        // isRFQ = true, isParticipantInvoice = true
        AccountingChartController.saveUpdateRfqInvoice(
            salesEntryJson,
            salesEntryListJson,
            amountEntryJson,
            true,
            true
        );
        Test.stopTest();
    }

    // ----------------------------------------------------------------------
    // 6) NEW: updateDataFromPurchases
    // ----------------------------------------------------------------------
    @IsTest
    static void testUpdateDataFromPurchases() {
        Id companyId = getCompanyId();
        Date today = Date.today();
        String invoiceDateStr = String.valueOf(today);
        String postDateStr    = String.valueOf(today);
        String dueDateStr     = String.valueOf(today.addDays(7)); // in case you add dueDate later

        // Create an Entity_Profile__c because controller queries it by Id from 'entityName'
        Entity_Profile__c entity = new Entity_Profile__c(
            Name__c       = 'Test Supplier',
            First_Name__c = 'Test',
            Last_Name__c  = 'Vendor'
        );
        insert entity;

        Accounting_Ledger_Items__c ledgerItem = [
            SELECT Id FROM Accounting_Ledger_Items__c LIMIT 1
        ];

        // Header JSON – must match keys used in updateDataFromPurchases
        Map<String, Object> salesEntry = new Map<String, Object>{
            'invoiceId'    => null,                    // Insert path
            'InvoiceDate'  => invoiceDateStr,
            'InvoiceNo'    => 'EXP-001',
            'Status'       => 'Approved',
            'company'      => String.valueOf(companyId),
            'PostDate'     => postDateStr,
            'taxInclusive' => true,
            'comments'     => 'Purchase from supplier',
            'entityName'   => entity.Id                // used to query Entity_Profile__c
        };
        String salesEntryJson = JSON.serialize(salesEntry);

        // Amount summary JSON
        Map<String, Object> amountEntry = new Map<String, Object>{
            'subTotal'    => 100,
            'taxAmount'   => 10,
            'totalAmount' => 110
        };
        String amountEntryJson = JSON.serialize(amountEntry);

        // Line items JSON – must have keys used in method:
        // tax, Amount__c, Description__c, sno, accountItemId, Id
        List<Map<String, Object>> salesEntryList = new List<Map<String, Object>>{
            new Map<String, Object>{
                'tax'            => '10',
                'Amount__c'      => 100,
                'Description__c' => 'Purchase Line 1',
                'sno'            => 1,
                'accountItemId'  => (Object)ledgerItem.Id,
                'Id'             => null
            }
        };
        String salesEntryListJson = JSON.serialize(salesEntryList);

        Test.startTest();
        AccountingChartController.updateDataFromPurchases(
            salesEntryJson,
            salesEntryListJson,
            amountEntryJson
        );
        Test.stopTest();
    }

    // ----------------------------------------------------------------------
    // 7) Email + invoice history helpers
    // ----------------------------------------------------------------------
    @IsTest
    static void testEntityEmailAndHistory() {
        Accounting_Invoices_Expenses__c inv = getAnyInvoice();

        Test.startTest();
        AccountingChartController.getentityEmail(inv.Id);
        AccountingChartController.getentityEmailForInvoices(inv.Id);
        AccountingChartController.getInvoiceHistoryDetails(inv.Id);
        Test.stopTest();
    }

    // ----------------------------------------------------------------------
    // 8) ICT date overlap + RFQ delete
    // ----------------------------------------------------------------------
    @IsTest
    static void testCheckDateOverlapAndDeleteRFQ() {
        Id companyId = getCompanyId();
        Accounting_Journal_Entry__c je = getAnyJournalEntry();

        Test.startTest();
        AccountingChartController.checkDateOverlapIct(
            Date.today(),
            Date.today().addDays(7),
            companyId,
            true,
            null
        );

        String jsonIds = JSON.serialize(new List<Id>{ je.Id });
        AccountingChartController.deleteMatchingRecordsRfq(jsonIds);
        Test.stopTest();
    }
    
    @IsTest
static void testSaveUpdateRfqInvoiceWithEntityProfile() {
    Id companyId = getCompanyId();
    Date today = Date.today();
    String invoiceDateStr = String.valueOf(today);
    String postDateStr    = String.valueOf(today);
    String dueDateStr     = String.valueOf(today.addDays(7));

    // Create Entity_Profile__c to be used as entityName
    Entity_Profile__c entity = new Entity_Profile__c(
        Name__c       = 'Test Customer',
        First_Name__c = 'Test',
        Last_Name__c  = 'Customer'
    );
    insert entity;

    // Header JSON – matches saveUpdateRfqInvoice expectations,
    // and triggers the isParticipantInvoice == false path
    Map<String, Object> salesEntry = new Map<String, Object>{
        'invoiceId'    => null,                     // insert path
        'InvoiceDate'  => invoiceDateStr,
        'InvoiceNo'    => 'RFQ-ENT-001',
        'Status'       => 'Approved',
        'company'      => String.valueOf(companyId),
        'PostDate'     => postDateStr,
        'dueDate'      => dueDateStr,
        'taxInclusive' => true,
        'comments'     => 'RFQ with entity profile',
        'notes'        => 'RFQ notes with entity',
        'entityName'   => entity.Id                 // used in your snippet
    };
    String salesEntryJson = JSON.serialize(salesEntry);

    // Amount summary JSON
    Map<String, Object> amountEntry = new Map<String, Object>{
        'subTotal'    => 200,
        'taxAmount'   => 20,
        'totalAmount' => 220
    };
    String amountEntryJson = JSON.serialize(amountEntry);

    // Use an existing ledger item
    Accounting_Ledger_Items__c ledgerItem = [
        SELECT Id FROM Accounting_Ledger_Items__c LIMIT 1
    ];

    // One line item – sufficient to hit your branch
    List<Map<String, Object>> salesEntryList = new List<Map<String, Object>>{
        new Map<String, Object>{
            'sno'            => 1,
            'Description__c' => 'RFQ Line with Entity',
            'Amount__c'      => 200,
            'Quantity__c'    => 1,
            'tax'            => '10',
            'accountItemId'  => (Object)ledgerItem.Id,
            'Id'             => null
            // no lineItems here, because isParticipantInvoice = false
        }
    };
    String salesEntryListJson = JSON.serialize(salesEntryList);

    Test.startTest();
    // isRFQ = true, isParticipantInvoice = false → hits the IF block you posted
    AccountingChartController.saveUpdateRfqInvoice(
        salesEntryJson,
        salesEntryListJson,
        amountEntryJson,
        true,    // isRFQ
        false    // isParticipantInvoice → enters your snippet
    );
    Test.stopTest();
}

}