@isTest
public class AccountingExpensesInvoicesTest {    
    @testSetup
    static void setupTestData() {
        // Create Organisation
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
          
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.4139562@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='Test Friday4039562', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.4139562@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        insert user;
 		System.runAs(user) { 
         Facility__c fac = new Facility__c();
            fac.Name='Ashfield Consultants';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Address__CountryCode__s='AU';
            fac.Email__c= 'testonefacility111@gmail.com';
            fac.Status__c=true;
            fac.Organisation__c= org.Id;
            fac.ABN__c='1235645433';
            fac.Phone__c = '12323213';
         insert fac;
         Staff__c staff1 = new Staff__c();
            staff1.Last_Name__c='Test staff1';
            staff1.Name='praveen1';
            staff1.Name__c='abcdr';
            staff1.Contact_Number__c='56789908743';
            staff1.Email_Address__c= 'manualtesting.4139561@hotmail.com';
            staff1.Facility__c=fac.Id;
            staff1.Address__Street__s='8 Keewong Street';
            staff1.Address__City__s = 'Crace';
            staff1.Address__StateCode__s='ACT';
            staff1.Address__PostalCode__s='2911';
            staff1.Emergency_Phone_Number__c='45678766675';
            staff1.Primary_Contact_Name__c='Praveen';
            staff1.Primary_Contact_Number__c='9908458298';
            staff1.Make_Primary_as_Approver__c=true;
            staff1.Primary_Contact_Email__c='praveenshesham.sp@gmail.com';
            staff1.Secondary_Contact_Name__c='maheswari';
            staff1.Secondary_Contact_Email__c='maheswari.adabala@gmail.com';
            staff1.Make_Secondary_as_Approver__c=false;
            staff1.Secondary_Contact_Number__c='990845829528';
            staff1.Emp_exit_date__c = date.newInstance(2027, 01, 05);
            staff1.Emp_Start_Date__c = date.newInstance(2026, 02, 01);
            staff1.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
            staff1.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
            staff1.role__c='Admin';
            staff1.Residency_Type__c = 'Australian';
            staff1.Expiry_Date__c = date.newInstance(2025,02, 19);
            staff1.Type__c = 'Visa Status';
            staff1.Working_Hours_Rate__c=50;
            staff1.Annual_Leave__c=10;
            staff1.Sick_Leave__c=2;
            staff1.Bereavement_Leave__c=10;
            staff1.Parental_Leave__c=3;
            insert staff1; 
    }
        // Create Company
        Company__c comp = new Company__c(Company_Name__c = 'Test Company', Organization__c = org.Id);
        insert comp;

        // Create Account List and Category
        Account_List__c accList = new Account_List__c(Name = 'Test Account List', Company__c = comp.Id, Industry__c = 'service');
        insert accList;

        Accounting_Category__c incomeCategory = new Accounting_Category__c(Name = 'Income', Company__c = comp.Id, Account_List__c = accList.Id);
        Accounting_Category__c expensesCategory = new Accounting_Category__c(Name = 'Expenses', Company__c = comp.Id, Account_List__c = accList.Id);
        Accounting_Category__c assetsCategory = new Accounting_Category__c(Name = 'Assets', Company__c = comp.Id, Account_List__c = accList.Id);
        Accounting_Category__c liabilitiesCategory = new Accounting_Category__c(Name = 'Liabilities', Company__c = comp.Id, Account_List__c = accList.Id);
        insert new List<Accounting_Category__c>{ incomeCategory, expensesCategory, assetsCategory, liabilitiesCategory};

        Accounting_Sub_Category__c subCategory = new Accounting_Sub_Category__c(Category__c =incomeCategory.Id , Account_Number__c = '1-1000');
        insert subCategory;
        
        Accounting_Ledger_Name__c ledgerName = new Accounting_Ledger_Name__c(Category__c =incomeCategory.Id,  Account_Number__c = '1-1000');
        insert ledgerName;
        // Create Ledger Item
        Accounting_Ledger_Items__c ledgerItem = new Accounting_Ledger_Items__c(Name = 'Test Ledger Item', Category__c = incomeCategory.Id);
        insert ledgerItem;

        // Create Entity Profile
        Entity_Profile__c customerProfile = new Entity_Profile__c(
            First_Name__c = 'John',
            Last_Name__c = 'Smith',
            Card_Type__c = 'Customer',
            Company__c = comp.Id
        );
        Entity_Profile__c supplierProfile = new Entity_Profile__c(
            First_Name__c = 'John',
            Last_Name__c = 'Smith',
            Card_Type__c = 'Supplier',
            Company__c = comp.Id
        );
       insert new List<Entity_Profile__c>{ customerProfile, supplierProfile };

        Accounting_Ledger_Items__c expenseLedger = new Accounting_Ledger_Items__c(Name = 'Expense Ledger', Category__c = expensesCategory.Id);
        Accounting_Ledger_Items__c incomeLedger = new Accounting_Ledger_Items__c(Name = 'Income Ledger', Category__c = incomeCategory.Id);
        Accounting_Ledger_Items__c assetLedger = new Accounting_Ledger_Items__c(Name = 'Trade Debtors', Category__c = assetsCategory.Id);
        Accounting_Ledger_Items__c liabilityLedger = new Accounting_Ledger_Items__c(Name = 'GST Collected', Category__c = liabilitiesCategory.Id);
        insert new List<Accounting_Ledger_Items__c>{ expenseLedger, assetLedger, liabilityLedger };
              
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];  
        
        // Create Invoice
        Accounting_Invoices_Expenses__c invoice = new Accounting_Invoices_Expenses__c(
            Company__c = comp.Id,
            Is_Service_Invoice__c = false,
            Is_General_Ledger_Sales__c = true,
            Is_General_Ledger_Purchases__c = false,
            ICT_Invoice_Entry__c = false,
            Roaster_Invoice_Entry__c = false,
            Staff__c = staff.Id
        );
        insert invoice;

        // Create Expense Journal Entry
        Accounting_Journal_Entry__c expenseEntry = new Accounting_Journal_Entry__c(
            Company__c = comp.Id,
            Invoice_Date__c = Date.today(),
            Entity_Profile__c = customerProfile.Id,
            Created_From_Expenses__c = true,
            Accounting_Ledger_Items__c = expenseLedger.Id,
            Accounting_Invoices_Expenses__c = invoice.Id
            
        );
         Accounting_Journal_Entry__c incomeEntry = new Accounting_Journal_Entry__c(
            Company__c = comp.Id,
            Invoice_Date__c = Date.today(),
            Entity_Profile__c = customerProfile.Id,
            Created_From_Expenses__c = false,
            Accounting_Ledger_Items__c = incomeLedger.Id,
            Accounting_Invoices_Expenses__c = invoice.Id,
            Tax_Amount__c = 0,
            Total_Amount__c = 0,
            Sub_Total__c = 0,
            Description__c =  'Test',
            Entry_Type__c ='Sales',
            Invoice_No__c = '65434',
            Comments__c = 'Test Comments',
             Unit_Price__c = 0,
             Quantity__c = 0,
             ICT_Invoice_Entry__c = true,
             Tax__c = 0,  
             Tax_Inclusive__c = true
         );
        //insert expenseEntry;

        // Create General Ledger Entry
        Accounting_Journal_Entry__c assetEntry  = new Accounting_Journal_Entry__c(
            Company__c = comp.Id,
            Invoice_Date__c = Date.today(),
            Entity_Profile__c = customerProfile.Id,
            Created_From_Expenses__c = false,
            Accounting_Ledger_Items__c = assetLedger.Id,
            Accounting_Invoices_Expenses__c = invoice.Id,
            Tax_Amount__c = 0,
            Total_Amount__c = 0,
            Sub_Total__c = 0,
            Description__c =  'Test',
            Entry_Type__c ='Sales',
            Invoice_No__c = '65434',
            Comments__c = 'Test Comments',
             Unit_Price__c = 0,
             Quantity__c = 0,
             ICT_Invoice_Entry__c = true,
             Tax__c = 0,
             Tax_Inclusive__c = true
        );
         Accounting_Journal_Entry__c liabilityEntry  = new Accounting_Journal_Entry__c(
            Company__c = comp.Id,
            Invoice_Date__c = Date.today(),
            Entity_Profile__c = customerProfile.Id,
            Created_From_Expenses__c = false,
            Accounting_Ledger_Items__c = liabilityLedger.Id,
            Accounting_Invoices_Expenses__c = invoice.Id,
            Tax_Amount__c = 0,
            Total_Amount__c = 0,
            Sub_Total__c = 0,
            Description__c =  'Test',
            Entry_Type__c ='Sales',
            Invoice_No__c = '65434',
            Comments__c = 'Test Comments',
             Unit_Price__c = 0,
             Quantity__c = 0,
             ICT_Invoice_Entry__c = true,
             Tax__c = 0,
             Tax_Inclusive__c = true
        );
        //insert glEntry;
          insert new List<Accounting_Journal_Entry__c>{ expenseEntry,incomeEntry, assetEntry, liabilityEntry };
              
        // Assign organisation name to current user
        User u = [SELECT Id, Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];
        u.Organization_Name__c = org.Name;
        update u;
        
    }

    @isTest
    static void testGetAccountingExpense_true() {
        Company__c company = [SELECT Id FROM Company__c LIMIT 1];
        Accounting_Journal_Entry__c accJournalEntry = [SELECT Id FROM Accounting_Journal_Entry__c LIMIT 1];
        Accounting_Invoices_Expenses__c accInvoiceExpenses = [SELECT Id FROM Accounting_Invoices_Expenses__c LIMIT 1];
        Entity_Profile__c profile = [SELECT Id FROM Entity_Profile__c LIMIT 1];
 		//Company__c comp = [SELECT Id FROM Company__c LIMIT 1];

        
        Accounting_Journal_Entry__c updatedExpense = new Accounting_Journal_Entry__c(
            Id = accJournalEntry.Id,
            Entity_Profile__c = profile.Id,
            Company__c = company.Id,
            Description__c = 'Updated Expense',
            Invoice_Date__c = Date.today(),
            Entry_Type__c = 'Purchases',
            Tax_Inclusive__c = true,
            Post_Date__c = Date.today(),
            Total_Amount__c = 1000,
            Tax__c = 100,
            Tax_Amount__c = 100,
            Amount__c = 900
            
        );
         Accounting_Journal_Entry__c updatedExpense1 = new Accounting_Journal_Entry__c(
            Id = accJournalEntry.Id,
            Entity_Profile__c = profile.Id,
            Company__c = company.Id,
            Description__c = 'Updated Sales',
            Invoice_Date__c = Date.today(),
            Entry_Type__c = 'Sales',
            Tax_Inclusive__c = true,
            Post_Date__c = Date.today(),
            Sub_Total__c = 1000,
            Tax_Amount__c = 100,
            Tax__c = 100,
            Amount__c = 1100
        );
        

        List<Accounting_Journal_Entry__c> entries = TesseractAppsAccountingExpensesInvoices.getAccountingExpense(
            String.valueOf(Date.today().addDays(-1)),
            String.valueOf(Date.today().addDays(1)),
            company.Id,
            true
        );
        List<Accounting_Journal_Entry__c> getIctInvoice = TesseractAppsAccountingExpensesInvoices.getIctInvoice(
            String.valueOf(Date.today().addDays(-10)),
            String.valueOf(Date.today().addDays(10)),
            company.Id,
            true
        );
        List<Accounting_Journal_Entry__c> getRMInvoice = TesseractAppsAccountingExpensesInvoices.getRMInvoice(
            String.valueOf(Date.today().addDays(-10)),
            String.valueOf(Date.today().addDays(10)),
            company.Id,
            true
        );
        
        Boolean updateSalesEntry = TesseractAppsAccountingExpensesInvoices.updateSalesEntry(updatedExpense1);
        Boolean updateExpense = TesseractAppsAccountingExpensesInvoices.updateExpense(updatedExpense);
        List<Entity_Profile__c> getEntityProfiles = TesseractAppsAccountingExpensesInvoices.getEntityProfiles(company.Id, 'Purchases');
        List<Entity_Profile__c> getEntityProfiles1 = TesseractAppsAccountingExpensesInvoices.getEntityProfiles(company.Id, 'Sales');
        Accounting_Journal_Entry__c getEntryOnEdit = TesseractAppsAccountingExpensesInvoices.getEntryOnEdit(accJournalEntry.Id);
        Accounting_Journal_Entry__c getExpenseOnEdit = TesseractAppsAccountingExpensesInvoices.getExpenseOnEdit(accJournalEntry.Id);
        TesseractAppsAccountingExpensesInvoices.updateInvoice(accInvoiceExpenses, accJournalEntry);
       	List<Entity_Profile__c> getEntityProfilesLedgerEntry = TesseractAppsAccountingLedgerEntry.getEntityProfiles(company.Id, 'Sales');
       
    }

    @isTest
    static void testGetAccountingExpense_false() {
        
      /*  Accounting_Category__c incomeCat = new Accounting_Category__c(Name = 'Income');
        Accounting_Category__c liabilityCat = new Accounting_Category__c(Name = 'Liabilities');
        Accounting_Category__c assetCat = new Accounting_Category__c(Name = 'Assets');
        insert new List<Accounting_Category__c>{ incomeCat, liabilityCat, assetCat };*/
    
        // 🔹 Create Ledger Items (These must match your `if` logic)
      
        Company__c company = [SELECT Id FROM Company__c LIMIT 1];
        User user = [SELECT Id FROM User LIMIT 1];
        Accounting_Journal_Entry__c accJournalEntry = [SELECT Id FROM Accounting_Journal_Entry__c LIMIT 1];
        Accounting_Invoices_Expenses__c accInvoiceExpenses = [SELECT Id FROM Accounting_Invoices_Expenses__c LIMIT 1];
		Entity_Profile__c profile = [SELECT Id FROM Entity_Profile__c LIMIT 1];
        Accounting_Category__c category = [SELECT Id FROM Accounting_Category__c LIMIT 1];
       // Accounting_Ledger_Items__c ledgerItems = [SELECT Id FROM Accounting_Ledger_Items__c LIMIT 1];
        Accounting_Ledger_Items__c ledgerItems = [SELECT Id FROM Accounting_Ledger_Items__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
          
        List<Accounting_Journal_Entry__c> entries = TesseractAppsAccountingExpensesInvoices.getAccountingExpense(
            String.valueOf(Date.today().addDays(-1)),
            String.valueOf(Date.today().addDays(1)),
            company.Id,
            false
        );
        
        String salesEntryJson = JSON.serialize(new Map<String, Object>{
            'selectOption' => 'Yes',
            'InvoiceDate' => String.valueOf(Date.today()),
            'StartDate' => String.valueOf(Date.today().addDays(-5)),
            'dateIssued' => String.valueOf(Date.today()),
            'EndDate' => String.valueOf(Date.today().addDays(5)),
            'Status' => 'Draft',
            'company' => company.Id,
            'ictstaffid' => staff.Id,
            'entityName' => profile.Id
        });
        

        List<Map<String, Object>> invoiceRowList = new List<Map<String, Object>>{
            new Map<String, Object>{
                'selectedOptionTax' => '10%',
                'UnitPrice__c' => 100,
                'Quantity__c' => 2,
                'accountItemId' => ledgerItems.Id
            }
        };
        String invoiceRowListJson = JSON.serialize(invoiceRowList);
        
        String amountEntryJson = JSON.serialize(new Map<String, Object>{
            'taxAmount' => 18.18,
            'totalAmount' => 200.00,
            'subTotal' => 181.82
        });
       Map<String, Object> salesEntryData = (Map<String, Object>) JSON.deserializeUntyped(salesEntryJson);
       Accounting_Journal_Entry__c entry = new Accounting_Journal_Entry__c();
            entry.Company__c = company.Id;
            entry.Accounting_Invoices_Expenses__c = accInvoiceExpenses.Id;
            entry.Tax_Amount__c = 0;
            entry.Total_Amount__c =0;
            entry.Sub_Total__c = 0;
            entry.Accounting_Ledger_Items__c =ledgerItems.Id ; 
           // entry.Description__c = (String)activityStatementData.get('paygIncomeTaxMethod');
            entry.Entry_Type__c ='Sales';
            entry.Entity_Profile__c = (String)salesEntryData.get('entityName');
             entry.Invoice_Date__c =Date.valueOf((String)salesEntryData.get('InvoiceDate'));
            entry.Invoice_No__c = (String)salesEntryData.get('InvoiceNo');
            entry.Comments__c = (String)salesEntryData.get('comments');
        insert entry;
        
        TesseractAppsAccountingExpensesInvoices.deleteExpenseRecord(accJournalEntry.Id);
        Accounting_Invoices_Expenses__c saveIctInvoiceData = TesseractAppsAccountingExpensesInvoices.saveIctInvoiceData(salesEntryJson,invoiceRowListJson,amountEntryJson ,true);
        Accounting_Invoices_Expenses__c saveRMInvoiceData = TesseractAppsAccountingExpensesInvoices.saveRMInvoiceData(salesEntryJson,invoiceRowListJson,amountEntryJson ,true);
        
    }
      @isTest
    static void testGetNewHierarchyData() {
         String testIndustry = 'Edutech';
     	// Account_List__c accList = [SELECT Id, Industry__c FROM Account_List__c LIMIT 1];
         Company__c company = [SELECT Id FROM Company__c LIMIT 1];
         Account_List__c accList = new Account_List__c(
            Name = 'Test Account',
            Industry__c = 'Edutech',
            Company__c = company.Id
        );
        insert accList;
         Accounting_Category__c category = new Accounting_Category__c(
            Name = 'Test Category',
            Account_Number__c = 'CAT-001',
            Account_List__c = accList.Id
        );
        insert category;

        // Step 4: Insert Accounting_Sub_Category__c
        Accounting_Sub_Category__c subCategory = new Accounting_Sub_Category__c(
            Name = 'Test SubCategory',
            Account_Number__c = 'SUB-001',
            Category__c = category.Id
        );
        insert subCategory;

        // Step 5: Insert Accounting_Ledger_Name__c
        Accounting_Ledger_Name__c ledger = new Accounting_Ledger_Name__c(
            Name = 'Test Ledger',
            Account_Number__c = 'LED-001',
            Sub_Category__c = subCategory.Id
        );
        insert ledger;
        
  		Accounting_Ledger_Items__c testItem = new Accounting_Ledger_Items__c(Name = 'Original Name' ,  Account_Number__c = 'ITEM-001', Ledger_Name__c = ledger.Id);
        insert testItem;
        
         String mockJson = '[{"categories":[{"name":"Category A","accountNumber":"C001","subCategories":[{"name":"SubCat A1","accountNumber":"SC001","ledgers":[{"name":"Ledger A1","accountNumber":"L001","items":[{"name":"Item A1-1","accountNumber":"I001"},{"name":"Item A1-2","accountNumber":"I002"}]},{"name":"Ledger A2","accountNumber":"L002","items":[{"name":"Item A2-1","accountNumber":"I003"}]}]},{"name":"SubCat A2","accountNumber":"SC002","ledgers":[{"name":"Ledger A3","accountNumber":"L003","items":[{"name":"Item A3-1","accountNumber":"I004"}]}]}]}]}]';
        
        String newName = 'Updated Name';
        //test.startTest();
        String result = TesseractAppsAccountingExpensesInvoices.updateLedgerItemName(testItem.Id, newName);
        List<Map<String, Object>> result1 = TesseractAppsAccountingExpensesInvoices.getNewHierarchyData('Edutech', company.Id);
        String result2 = TesseractAppsAccountingExpensesInvoices.saveNewAccountList('Edutech', '', company.Id, mockJson);
       // Test.stopTest();

    }
        
    
    
}