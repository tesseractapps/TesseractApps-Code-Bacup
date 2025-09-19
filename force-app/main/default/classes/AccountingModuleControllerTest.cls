@isTest
private class AccountingModuleControllerTest {
    
    @testSetup
    static void createTestData() {
        Organisation__c org = new Organisation__c();
        org.Name='Ashfield Consultants';
        org.ABN__c='11234567891';
        org.ACN__c='878787878';
        org.Contact_No__c='6132899740';
        org.RCTI__c='RCTI1';
        org.Email__c='dsfdsfsd@gmail.com';
        org.Bank__c='Bank Test';
        org.BSB__c='BSB Test';
        org.Account_Name__c='Test Account';
        org.Description__c='test Desc';
        org.Address_Latest__Street__s='101';
        org.Address_Latest__City__s='Himas Waterhen';
        org.Address_Latest__PostalCode__s='2060';
        org.Address_Latest__CountryCode__s='AU';
        org.Address_Latest__StateCode__s='NSW';
        org.NDIS_Provider__c='12341234565';
        org.BMSI_Identifier__c ='TEST BMSI';
        org.SoftwareId__c = 'jhdfn18328';
        org.Branch_code__c = 'BS123';
        org.Contact_Name__c = 'Test Contact';
        org.User_Type__c = 'NDIS Org Admin';
        insert org;
        
        Accounting_Category__c cat = new Accounting_Category__c(Name='Assets', Account_Number__c='1000');
        insert cat;
        
        Accounting_Sub_Category__c sub = new Accounting_Sub_Category__c(Name='Cash', Account_Number__c='1000-1', Category__c=cat.Id);
        insert sub;
        
        Accounting_Ledger_Name__c ledger = new Accounting_Ledger_Name__c(Name='Petty Cash', Account_Number__c='1000-1-01', Sub_Category__c=sub.Id);
        insert ledger;
        
        Company__c company = new Company__c();
        insert company;
        
        
        
        Entity_Profile__c entity = new Entity_Profile__c(
            Name__c = 'Entity One',
            First_Name__c = 'John',
            Last_Name__c = 'Doe',
            Card_Type__c = 'Customer',
            Contact__c = '1234567890',
            Designation__c = 'Manager',
            Company__c = company.Id
        );
        insert entity;
        
        Entity_Selling__c sell = new Entity_Selling__c(Entity_Profile__c=entity.Id, Tax_Code__c='GST');
        insert sell;
        
        Entity_Selling_Payment__c sellPay = new Entity_Selling_Payment__c(Entity_Profile__c=entity.Id);
        insert sellPay;
        
        Accounting_Invoices_Expenses__c invoice = new Accounting_Invoices_Expenses__c(
            Company__c = company.Id,
            Invoice_Date__c = Date.today(),
            Status__c = 'Open'
        );
        
        insert invoice;
        
        Accounting_Journal_Entry__c je = new Accounting_Journal_Entry__c(
            Company__c = company.Id,
            Invoice_Date__c = Date.today(),
            Sl_no__c = 1,
            Accounting_Invoices_Expenses__c = invoice.Id,
            Unit_Price__c = 100,
            Quantity__c = 2,
            Tax__c = 10,
            Total_Amount__c = 220
        );
        insert je;
    }
    
    @isTest
    static void testGetAccountingData() {
        Test.startTest();
        List<Map<String, Object>> result = AccountingModuleController.getAccountingData();
        System.assert(result != null && result.size() > 0, 'Expected categories in result');
        Test.stopTest();
    }
    
    @isTest
    static void testGetEntityOnEdit() {
        Entity_Profile__c ep = [SELECT Id FROM Entity_Profile__c LIMIT 1];
        Test.startTest();
        Map<String, Object> result = AccountingModuleController.getEntityOnEdit(ep.Id);
        System.assert(result != null, 'Entity data should return');
        Test.stopTest();
    }
    
    @isTest
    static void testGetAccountingInvoice() {
        Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
        Date today = Date.today();
        Test.startTest();
        List<Accounting_Invoices_Expenses__c> result = AccountingModuleController.getAccountingInvoice(
            String.valueOf(today.addDays(-1)), String.valueOf(today.addDays(1)), org.Id, false
        );
        System.assert(result != null, 'Expected invoice results');
        Test.stopTest();
    }
    
    @isTest
    static void testGetAccountingInvoiceById() {
        Accounting_Invoices_Expenses__c inv = [SELECT Id FROM Accounting_Invoices_Expenses__c LIMIT 1];
        Test.startTest();
        List<Accounting_Invoices_Expenses__c> result = AccountingModuleController.getAccountingInvoiceById(inv.Id);
        System.assert(result.size() > 0, 'Should return invoice details');
        Test.stopTest();
    }
    
    @isTest
    static void testUpdateDataFromInvoice() {
        Company__c company = [SELECT Id FROM Company__c LIMIT 1];
        String salesEntryJson = JSON.serialize(new Map<String, Object>{
            'InvoiceDate' => String.valueOf(Date.today()),
                'InvoiceNo' => 'INV-999',
                'Status' => 'Draft',
                'company' => company.Id, // ✅ Corrected
                'PostDate' => String.valueOf(Date.today()),
                'IncludeGST' => 'Yes',
                'participantID' => null,
                'ServicesList' => null
                });
        
        String amountEntryJson = JSON.serialize(new Map<String, Object>{
            'subTotal' => 100,
                'taxAmount' => 10,
                'totalAmount' => 110
                });
        
        List<Map<String, Object>> items = new List<Map<String, Object>>{
            new Map<String, Object>{
                'tax' => '10%',
                    'Amount__c' => 100,
                    'Quantity__c' => 1,
                    'Description__c' => 'Test Item',
                    'sno' => 1,
                    'accountItemId' => null
                    }
        };
            String salesEntryListJson = JSON.serialize(items);
        
        Test.startTest();
        Accounting_Invoices_Expenses__c result = AccountingModuleController.UpdateDataFromInvoice(
            salesEntryJson, salesEntryListJson, amountEntryJson, false, false
        );
        System.assertNotEquals(null, result);
        Test.stopTest();
    }
    
    
    @isTest
    static void testDeleteMatchingRecords() {
        Accounting_Journal_Entry__c je = [SELECT Id FROM Accounting_Journal_Entry__c LIMIT 1];
        String jsonIds = JSON.serialize(new List<Id>{je.Id});
        Test.startTest();
        AccountingModuleController.deleteMatchingRecords(jsonIds);
        Test.stopTest();
    }
    
    @isTest
    static void testGetAccountListByCompany() {
        // Prepare required records
        Company__c company = [SELECT Id FROM Company__c LIMIT 1];
        
        Account_List__c accList = new Account_List__c(Company__c = company.Id);
        insert accList;
        
        Accounting_Category__c category = new Accounting_Category__c(
            Name = 'Cat1',
            Account_Number__c = 'C001',
            Account_List__c = accList.Id
        );
        insert category;
        
        Accounting_Sub_Category__c sub = new Accounting_Sub_Category__c(
            Name = 'Sub1',
            Account_Number__c = 'SC001',
            Category__c = category.Id
        );
        insert sub;
        
        Accounting_Ledger_Name__c ledger = new Accounting_Ledger_Name__c(
            Name = 'Ledger1',
            Account_Number__c = 'L001',
            Sub_Category__c = sub.Id
        );
        insert ledger;
        
        Accounting_Ledger_Items__c ledgerItem = new Accounting_Ledger_Items__c(
            Name = 'Item1',
            Account_Number__c = 'LI001',
            Ledger_Name__c = ledger.Id,
            Amount__c = 100
        );
        insert ledgerItem;
        
        // Test the method
        Test.startTest();
        List<Map<String, Object>> result = AccountingModuleController.getAccountListByCompany(company.Id);
        Test.stopTest();
        
        System.assertNotEquals(null, result, 'Result should not be null');
        System.assert(result.size() > 0, 'Expected at least one account list entry');
    }
    @isTest
    static void testGetLedgerItems() {
        // Get test organisation
        Organisation__c org = [SELECT Id, Name FROM Organisation__c LIMIT 1];
        
        // Delete existing company and create one properly linked to organisation
        delete [SELECT Id FROM Company__c LIMIT 100];
        Company__c company = new Company__c(Organization__c = org.Id); // ⚠️ Make sure this lookup exists
        insert company;
        
        // Create a new test user with matching Organization_Name__c
        Profile p = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
        User u = new User(
            Alias = 'testusr',
            Email = 'testuser@example.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'Test',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = p.Id,
            TimeZoneSidKey = 'America/New_York',
            UserName = 'testuser_' + DateTime.now().getTime() + '@example.com',
            Organization_Name__c = org.Name
        );
        insert u;
        
        // Build account structure for ledger item resolution
        Account_List__c accountList = new Account_List__c(Company__c = company.Id);
        insert accountList;
        
        Accounting_Category__c category = new Accounting_Category__c(
            Name = 'Income', // Required by controller SOQL
            Account_Number__c = 'IN100',
            Account_List__c = accountList.Id
        );
        insert category;
        
        Accounting_Ledger_Items__c ledgerItem = new Accounting_Ledger_Items__c(
            Name = 'LedgerItem1',
            Account_Number__c = 'AC100',
            Category__c = category.Id,
            Amount__c = 200
        );
        insert ledgerItem;
        
        // Run method in the context of the correct user
        System.runAs(u) {
            Test.startTest();
            List<Accounting_Ledger_Items__c> items = AccountingModuleController.getLedgerItems(company.Id);
            Test.stopTest();
            
            System.debug('Returned Ledger Items: ' + items);
            System.assertNotEquals(null, items, 'Result should not be null');
            System.assert(items.size() > 0, 'Expected at least one ledger item');
        }
    }
    @isTest
    static void testGetLedgerItemsforExpenses() {
        // Get test organisation
        Organisation__c org = [SELECT Id, Name FROM Organisation__c LIMIT 1];
        
        // Create a Company__c linked to the Organisation__c with a unique name
        Company__c company = new Company__c(
            Company_Name__c = 'ExpenseCompany_' + DateTime.now().getTime(), // ✅ Editable custom field
            Organization__c = org.Id
        );
        insert company;
        
        
        // Create a test User with Organization_Name__c matching the org name
        Profile profile = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
        User testUser = new User(
            Alias = 'expuser',
            Email = 'expenseuser@example.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'ExpenseUser',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = profile.Id,
            TimeZoneSidKey = 'America/New_York',
            UserName = 'expenseuser_' + DateTime.now().getTime() + '@example.com',
            Organization_Name__c = org.Name
        );
        insert testUser;
        
        // Build required hierarchy: AccountList → Category (Expenses) → Ledger Item
        Account_List__c accList = new Account_List__c(Company__c = company.Id);
        insert accList;
        
        Accounting_Category__c category = new Accounting_Category__c(
            Name = 'Expenses',
            Account_Number__c = 'EX001',
            Account_List__c = accList.Id
        );
        insert category;
        
        Accounting_Ledger_Items__c ledgerItem = new Accounting_Ledger_Items__c(
            Name = 'Expense Ledger Item',
            Account_Number__c = 'EX100',
            Category__c = category.Id,
            Amount__c = 300
        );
        insert ledgerItem;
        
        // Run the method as the custom user
        System.runAs(testUser) {
            Test.startTest();
            List<Accounting_Ledger_Items__c> result = AccountingModuleController.getLedgerItemsforExpenses(company.Id);
            Test.stopTest();
            
            System.debug('Ledger Items for Expenses: ' + result);
            System.assertNotEquals(null, result, 'Result should not be null');
            System.assert(result.size() > 0, 'Expected at least one expense ledger item');
        }
    }
    
    @isTest
    static void testCreateJournalEntries() {
        // Get required test records
        Organisation__c org = [SELECT Id, Name FROM Organisation__c LIMIT 1];
        Company__c company = [SELECT Id FROM Company__c LIMIT 1];
        
        // Create Account List
        Account_List__c accList = new Account_List__c(Company__c = company.Id);
        insert accList;
        
        // Create Ledger Categories
        Accounting_Category__c catIncome = new Accounting_Category__c(Name = 'Income', Account_Number__c = 'INC001', Account_List__c = accList.Id);
        Accounting_Category__c catLiability = new Accounting_Category__c(Name = 'Liabilities', Account_Number__c = 'LIAB001', Account_List__c = accList.Id);
        Accounting_Category__c catAsset = new Accounting_Category__c(Name = 'Assets', Account_Number__c = 'AST001', Account_List__c = accList.Id);
        insert new List<Accounting_Category__c>{catIncome, catLiability, catAsset};
            
            // Create Ledger Items
            Accounting_Ledger_Items__c incomeItem = new Accounting_Ledger_Items__c(Name = 'Test Sales Item', Account_Number__c = 'ACC100', Category__c = catIncome.Id);
        Accounting_Ledger_Items__c gstCollected = new Accounting_Ledger_Items__c(Name = 'GST Collected', Account_Number__c = 'ACC200', Category__c = catLiability.Id);
        Accounting_Ledger_Items__c tradeDebtors = new Accounting_Ledger_Items__c(Name = 'Trade Debtors', Account_Number__c = 'ACC300', Category__c = catAsset.Id);
        insert new List<Accounting_Ledger_Items__c>{incomeItem, gstCollected, tradeDebtors};
            
            // Create Entity Profile
            Entity_Profile__c entity = new Entity_Profile__c(
                Name__c = 'Test Client',
                First_Name__c = 'Jane',
                Last_Name__c = 'Smith',
                Card_Type__c = 'Customer',
                Company__c = company.Id
            );
        insert entity;
        
        // Test the method
        Test.startTest();
        AccountingModuleController.createJournalEntries(
            company.Id,             // companyId
            110.00,                 // totalAmount
            10.00,                  // taxAmount
            100.00,                 // subTotal
            'Test Sales Item',      // selectedItem (must match incomeItem.Name)
            'Test Description',     // description
            'Sales',                // entryType
            'Customer',             // selectedCardType
            entity.Id,              // selectedEntityName (must be ID)
            true,                   // taxInclusive
            'Due in 30 days',       // terms
            Date.today(),           // invoiceDate
            Date.today(),           // postDate
            'INV-2025-001',         // invoiceNo
            'Test comment',         // comments
            'false',                // createdFromExpenses
            true,                   // isGeneralSales
            100.00,                 // amount
            '10%'                   // tax
        );
        Test.stopTest();
        
        // Validate
        List<Accounting_Journal_Entry__c> entries = [
            SELECT Id, Entry_Type__c, Invoice_No__c 
            FROM Accounting_Journal_Entry__c 
            WHERE Invoice_No__c = 'INV-2025-001'
        ];
        System.assertEquals(3, entries.size(), 'Should create 3 journal entries for Sales type');
    }
    @isTest
    static void testGetRelatedRecords() {
        // Step 1: Get a company and create a ledger item
        Company__c company = [SELECT Id FROM Company__c LIMIT 1];
        
        Account_List__c accList = new Account_List__c(Company__c = company.Id);
        insert accList;
        
        Accounting_Category__c category = new Accounting_Category__c(Name = 'Income', Account_Number__c = 'IN101', Account_List__c = accList.Id);
        insert category;
        
        Accounting_Ledger_Items__c ledgerItem = new Accounting_Ledger_Items__c(
            Name = 'Linked Ledger Item',
            Account_Number__c = 'L001',
            Category__c = category.Id,
            Amount__c = 150
        );
        insert ledgerItem;
        
        // Step 2: Create a journal entry linked to the ledger item
        Accounting_Journal_Entry__c journalEntry = new Accounting_Journal_Entry__c(
            Accounting_Ledger_Items__c = ledgerItem.Id,
            Company__c = company.Id,
            Total_Amount__c = 150,
            Entry_Type__c = 'Sales',
            Description__c = 'Test Entry'
        );
        insert journalEntry;
        
        // Step 3: Call the method
        Test.startTest();
        List<Accounting_Journal_Entry__c> result = AccountingModuleController.getRelatedRecords(ledgerItem.Id);
        Test.stopTest();
        
        // Step 4: Assert
        System.assertNotEquals(null, result, 'Result should not be null');
        System.assert(result.size() > 0, 'Expected at least one related journal entry');
        System.assertEquals(ledgerItem.Id, result[0].Accounting_Ledger_Items__c, 'Ledger item ID should match');
    }
    
    
    @isTest
    static void testGetEntityProfileTax() {
        // Step 1: Get existing test Entity_Profile__c and its related Entity_Selling__c
        Entity_Profile__c entity = [
            SELECT Id, Card_Type__c,
            (SELECT Tax__c FROM Entity_Selling__r LIMIT 1)
            FROM Entity_Profile__c
            WHERE Card_Type__c = 'Customer'
            LIMIT 1
        ];
        
        Decimal expectedTax = entity.Entity_Selling__r.isEmpty() ? null : entity.Entity_Selling__r[0].Tax__c;
        
        // Step 2: Call the method
        Test.startTest();
        Decimal resultTax = AccountingModuleController.getEntityProfileTax(entity.Id);
        Test.stopTest();
        
        // Step 3: Assert
        System.debug('Returned Tax: ' + resultTax);
        System.assertEquals(expectedTax, resultTax, 'Returned tax should match expected');
    }
    @isTest
    static void testGetCompanyOnEdit() {
        // Step 1: Get existing Company
        Company__c company = [SELECT Id FROM Company__c LIMIT 1];
        
        // Step 2: Add required child records
        Financial_Year__c fy = new Financial_Year__c(
            Financial_Year__c = '2024-2025',
            Start_Month__c = 'July',
            End_Month__c = 'June',
            Company__c = company.Id
        );
        insert fy;
        
        Account_List__c accList = new Account_List__c(
            Company__c = company.Id,
            Industry__c = 'Service'
        );
        insert accList;
        
        BAS_and_IAS__c bas = new BAS_and_IAS__c(
            Company__c = company.Id,
            GST_Accounting_Method__c = 'Accruals Basis',        
            Tax_File_Number__c = '123456789',                  
            GST_Calculation__c = 'Monthly',                
            PAYG_Withheld_Period__c = 'Monthly',             
            PAYG_Income_Tax_Method__c = 'Option 2 (Income times rate)',         
            Fringe_Benefits_Tax__c = true,                     
            Fuel_Tax_Credits__c = true,                        
            Wine_Equalisation_Tax__c = false,                  
            For_Sales__c = 'Tax Exclusive',                             
            For_Purchases__c = 'Tax Inclusive'                            
        );
        
        
        insert bas;
        
        // Step 3: Call the method
        Test.startTest();
        Map<String, Object> result = AccountingModuleController.getCompanyOnEdit(company.Id);
        Test.stopTest();
        
        // Step 4: Assert
        System.debug('Company On Edit Result: ' + result);
        System.assert(result != null, 'Expected non-null response');
        System.assert(result.containsKey('company'), 'Response should contain "company"');
        System.assert(((Company__c)result.get('company')).Id == company.Id, 'Returned company should match input');
    }
    
    @isTest
    static void testUpdateCompany() {
        // Get the test Company created in @testSetup
        Company__c company = [SELECT Id FROM Company__c LIMIT 1];
        
        // Insert Financial Year
        Financial_Year__c fy = new Financial_Year__c(
            Financial_Year__c = '2024-2025',
            Start_Month__c = 'July',
            End_Month__c = 'June',
            Company__c = company.Id
        );
        insert fy;
        
        // Insert Account List with valid Industry
        Account_List__c accList = new Account_List__c(
            Company__c = company.Id,
            Industry__c = 'Service'
        );
        insert accList;
        
        // Insert BAS_and_IAS record with initial values
        BAS_and_IAS__c bas = new BAS_and_IAS__c(
            Company__c = company.Id,
            GST_Accounting_Method__c = 'Accruals Basis',
            Tax_File_Number__c = '111111111',
            GST_Calculation__c = 'Monthly',
            PAYG_Withheld_Period__c = 'Monthly',
            PAYG_Income_Tax_Method__c = 'Option 2 (Income times rate)',
            Fringe_Benefits_Tax__c = true,
            Fuel_Tax_Credits__c = true,
            Wine_Equalisation_Tax__c = false,
            For_Sales__c = 'Tax Exclusive',
            For_Purchases__c = 'Tax Inclusive'
        );
        insert bas;
        
        // Prepare input map for update
        Map<String, Object> inputMap = new Map<String, Object>{
            'selectedId' => company.Id,
                'selectedYear' => '2025-2026',
                'selectedStartMonth' => 'January',
                'selectedEndMonth' => 'December',
                'gstAccountingMethod' => 'Accruals Basis',
                'taxFileNumber' => '987654321',
                'gstCalculation' => 'Monthly',
                'paygWithheldPriod' => 'Quarterly',
                'paygIncomeTaxMethod' => 'Option 1 (Instalment rate)',
                'isFringeBenefitsTax' => false,
                'isFuelTaxCredits' => false,
                'isWineEqualisationTax' => true,
                'forSales' => 'Tax Inclusive',
                'forPurchases' => 'Tax Inclusive'
                };
                    
                    // Perform update
                    Test.startTest();
        AccountingModuleController.updateCompany(inputMap);
        Test.stopTest();
        
        // Verify updated fields
        BAS_and_IAS__c updated = [
            SELECT Tax_File_Number__c, Wine_Equalisation_Tax__c, Fringe_Benefits_Tax__c,
            PAYG_Income_Tax_Method__c, PAYG_Withheld_Period__c
            FROM BAS_and_IAS__c
            WHERE Id = :bas.Id
        ];
        
        
    }  
}