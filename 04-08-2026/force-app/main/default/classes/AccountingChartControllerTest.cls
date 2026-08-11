@isTest
public class AccountingChartControllerTest {
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
        // Create Staff User (User)
       /* User staff = new User(
            Username = 'testuser123432@test.com',
            LastName = 'Staff',
            Email = 'testuser12@test.com',
            Alias = 'tuser',
            TimeZoneSidKey = 'America/New_York',
            LocaleSidKey = 'en_US',
            EmailEncodingKey = 'UTF-8',
            ProfileId = [SELECT Id FROM Profile WHERE Name='Standard User' LIMIT 1].Id,
            LanguageLocaleKey = 'en_US'
        );
        insert staff;
        Staff__c staffRecord = new Staff__c(
            Name = 'Test Staff'
            // Add any required fields here
        );
        insert staffRecord;*/
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
        
        Accounting_Category__c cat = new Accounting_Category__c(Name='Assets', Account_Number__c='1000');
        insert cat;
        
        Accounting_Category__c cat1 = new Accounting_Category__c(Name='Liabilities', Account_Number__c='1001');
        insert cat1;
        
        Accounting_Category__c cat2 = new Accounting_Category__c(Name='Equity', Account_Number__c='1002');
        insert cat2;
        
        Accounting_Category__c cat3 = new Accounting_Category__c(Name='Expenses', Account_Number__c='1003');
        insert cat3;
        
        Accounting_Category__c cat4 = new Accounting_Category__c(Name='Income', Account_Number__c='1004');
        insert cat4;
        
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
        
        Entity_Profile__c entity1 = new Entity_Profile__c(
            Name__c = 'Entity One',
            First_Name__c = 'John',
            Last_Name__c = 'Doe',
            Card_Type__c = 'Supplier',
            Contact__c = '1234567890',
            Designation__c = 'Manager',
            Company__c = company.Id
        );
        insert entity1;
        
        Entity_Selling__c sell = new Entity_Selling__c(Entity_Profile__c=entity.Id, Tax_Code__c='GST');
        insert sell;
        
        Entity_Selling_Payment__c sellPay = new Entity_Selling_Payment__c(Entity_Profile__c=entity.Id);
        insert sellPay;    
        
        Entity_Buying__c buy = new Entity_Buying__c(Entity_Profile__c=entity1.Id, Tax_Code__c='GST');
        insert buy;
        
        Entity_Buying_Payment__c buyPay = new Entity_Buying_Payment__c(Entity_Profile__c=entity1.Id);
        insert buyPay;     
       
       /* Accounting_Invoices_Expenses__c invoice = new Accounting_Invoices_Expenses__c(
            Company__c = company.Id,
            Invoice_Date__c = Date.today(),
            Status__c = 'Open'
        );
        
        insert invoice;*/
        
        Accounting_Invoices_Expenses__c invoice = new Accounting_Invoices_Expenses__c(
            Company__c = company.Id,
            Invoice_Date__c = Date.today(),
            Status__c = 'Open'
        );
                
        // Invoice 2 - Detailed with all fields
        Accounting_Invoices_Expenses__c invoice2 = new Accounting_Invoices_Expenses__c(
            Company__c = company.Id,
            Status__c = 'Open',
            Invoice_Date__c = Date.today(),
            Post_Date__c = Date.today(),
            Due_Date__c = Date.today().addDays(30),
            ICT_Invoice_Entry__c = true,
            //Staff__c = staffRecord.Id,
            Start_Date__c = Date.today(),
            End_Date__c = Date.today().addDays(10),
            Invoice_No__c = 'INV-001',
            Sub_Total__c = 100,
            Total_Amount__c = 115
        );
        
        // Insert both
        insert new List<Accounting_Invoices_Expenses__c>{ invoice, invoice2 };
        
        Accounting_Journal_Entry__c je = new Accounting_Journal_Entry__c(
            Company__c = company.Id,
            Invoice_Date__c = Date.today(),
            Sl_no__c = 1,
            Accounting_Invoices_Expenses__c = invoice.Id,
            Unit_Price__c = 100,
            Quantity__c = 2,
            Tax__c = 10,
            Total_Amount__c = 220,
            RowKey__c = '236243',
            Row_Unique_ID__c = '7676376'
        );
        insert je;
        List<Accounting_Ledger_Items__c> ledgerItems = new List<Accounting_Ledger_Items__c>{
            new Accounting_Ledger_Items__c(
                Name = 'Test Ledger 1',
                Account_Number__c = '4001',
                Category__c = cat.Id
            ),
            new Accounting_Ledger_Items__c(
                Name = 'Test Ledger 2',
                Account_Number__c = '4002',
                Category__c = cat.Id
            ),
            new Accounting_Ledger_Items__c(
                Name = 'Test Ledger 3',
                Account_Number__c = '4003',
                Category__c = cat.Id
            ),
            new Accounting_Ledger_Items__c(
                Name = 'Test Ledger 4',
                Account_Number__c = '4004',
                Category__c = cat.Id
            )
        };
        
        insert ledgerItems;
        
    }
	@isTest
    static void testGetSalesPurchasesChart() {
        // Create a test Company
        Company__c testCompany = new Company__c(Company_Name__c = 'Test Company');
        insert testCompany;
        
         // Define all valid options to test
        List<String> monthOptions = new List<String>{
            '1 Month', '2 Months', '3 Months', '6 Months', '1 Year'
        };

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
                
        //String testStatus = 'Active';
       // Integer testCount = 5;
        //StatusCountWrapper wrapper = new StatusCountWrapper(testStatus, testCount);
  		 AccountingChartController.StatusCountWrapper wrapper = 
            new AccountingChartController.StatusCountWrapper('Active', 10);
        
        Test.startTest();
        Map<String, Map<String, Integer>> chartData = AccountingChartController.getSalesPurchasesChart(testCompany.Id);
        AccountingChartController.getMonthNumber('January');
        AccountingChartController.getSalesStatusListByMonth(testCompany.Id, 'January');
        AccountingChartController.getPurchasesStatusListByMonth(testCompany.Id,'January');
        //AccountingChartController.calculateChartTotalLiability(testCompany.Id,'1 Month');
       // AccountingChartController.calculateChartTotalAssets(testCompany.Id,'1 Month');
        AccountingChartController.getPurchasesCountChart(testCompany.Id);
        
         for (String option : monthOptions) {
            Decimal total = AccountingChartController.calculateChartTotalAssets(testCompany.Id,option);
            Map<String, Decimal> result = AccountingChartController.calculateChartTotalLiability(testCompany.Id,option);
           // System.debug('Total for ' + option + ': ' + total);
        }
       
        Test.stopTest();
       
    }
    /*@isTest
    static void testStatusCountWrapperConstructor() {
        // Arrange test data
        String testStatus = 'Active';
        Integer testCount = 5;

        // Act: Create an instance of the wrapper
        StatusCountWrapper wrapper = new StatusCountWrapper(testStatus, testCount);

        // Assert: Verify values are set correctly
        System.assertEquals(testStatus, wrapper.status);
        System.assertEquals(testCount, wrapper.count);
    }*/
     @isTest
    static void testUpdateDataFromInvoice() {
       Accounting_Invoices_Expenses__c invoice = [
            SELECT Id, Company__c FROM Accounting_Invoices_Expenses__c LIMIT 1
        ];
        Accounting_Journal_Entry__c je = [
            SELECT Id FROM Accounting_Journal_Entry__c WHERE Accounting_Invoices_Expenses__c = :invoice.Id LIMIT 1
        ];
        Accounting_Ledger_Items__c ledgerItem = [SELECT Id FROM Accounting_Ledger_Items__c LIMIT 1];

        // Build input JSON
        Map<String, Object> salesEntry = new Map<String, Object>{
            'invoiceId' => invoice.Id,
            'InvoiceDate' => String.valueOf(Date.today()),
            'InvoiceNo' => 'INV-100',
            'Status' => 'Submitted',
            'company' => invoice.Company__c,
            'entityName' => null,
            'taxInclusive' => true,
            'PostDate' => String.valueOf(Date.today()),
            'comments' => 'test comment'
        };
        String salesEntryJson = JSON.serialize(salesEntry);

        Map<String, Object> amountEntry = new Map<String, Object>{
            'subTotal' => 100,
            'taxAmount' => 10,
            'totalAmount' => 110
        };
        String amountEntryJson = JSON.serialize(amountEntry);

        List<Map<String, Object>> salesEntryList = new List<Map<String, Object>>{
            new Map<String, Object>{
                'Id' => je.Id,
                'sno' => 2,
                'Description__c' => 'Item 1',
                'Amount__c' => 110,
                'tax' => '10%',
                'accountItemId' => ledgerItem.Id
            }
        };
        String salesEntryListJson = JSON.serialize(salesEntryList);

        // Call method
        Test.startTest();
        Accounting_Invoices_Expenses__c result = AccountingChartController.UpdateDataFromPurchases(
            salesEntryJson,
            salesEntryListJson,
            amountEntryJson
        );
        Test.stopTest();
    }
     @isTest
    static void testGetAccountingInvoice() {
        Company__c company = [SELECT Id FROM Company__c LIMIT 1];
        Accounting_Invoices_Expenses__c inv = [SELECT Id FROM Accounting_Invoices_Expenses__c LIMIT 1];
        Date today = Date.today();
        Test.startTest();
        List<Accounting_Invoices_Expenses__c> result = AccountingChartController.getAccountingPurchases(
            String.valueOf(today.addDays(-1)), String.valueOf(today.addDays(1)), company.Id
        );
        List<Accounting_Invoices_Expenses__c> result1 = AccountingChartController.getAccountingGeneralLedger(
            String.valueOf(today.addDays(-1)), String.valueOf(today.addDays(1)), company.Id
        );
        List<Accounting_Invoices_Expenses__c> result2 = AccountingChartController.getAccountingPurchasesInEdit(inv.Id);
        List<Accounting_Invoices_Expenses__c> result3 = AccountingChartController.getGeneralLedgerInEdit(inv.Id);
        List<Accounting_Ledger_Items__c> allLedger = AccountingChartController.getAllLedgerItems(company.Id);
        System.assert(result != null, 'Expected invoice results');
        Test.stopTest();
    }
     @isTest
    static void testSaveGeneralLedger() {
        Company__c company = [SELECT Id FROM Company__c LIMIT 1];
        Accounting_Ledger_Items__c assetItem = [SELECT Id FROM Accounting_Ledger_Items__c WHERE Name = 'Test Ledger 1' LIMIT 1];
        Accounting_Ledger_Items__c liabilityItem = [SELECT Id FROM Accounting_Ledger_Items__c WHERE Name = 'Test Ledger 2' LIMIT 1];

        // Shared row template
        Map<String, Object> rowTemplate = new Map<String, Object>{
            'Amount__c' => 100.0,
            'Cr_Dr__c' => 'Cr',
            'accountCategory' => 'Assets',
            'tax' => '10%',
            'Description__c' => 'Insert Desc',
            'accountItemId' => assetItem.Id,
            'sno' => 1,
            'InvoiceDate' => String.valueOf(Date.today()),
            'PostDate' => String.valueOf(Date.today()),
            'InvoiceNo' => 'INV-INS'
        };
        Map<String, Object> rowTemplate1 = new Map<String, Object>{
            'Amount__c' => 100.0,
            'Cr_Dr__c' => 'Dr',
            'accountCategory' => 'Liabilities',
            'tax' => '10%',
            'Description__c' => 'Insert Desc',
            'accountItemId' => liabilityItem.Id,
            'sno' => 1,
            'InvoiceDate' => String.valueOf(Date.today()),
            'PostDate' => String.valueOf(Date.today()),
            'InvoiceNo' => 'INV-INS'
        };

        Map<String, Object> insertEntry = new Map<String, Object>{
            'InvoiceDate' => String.valueOf(Date.today()),
            'PostDate' => String.valueOf(Date.today()),
            'InvoiceNo' => 'INV-INS',
            'taxInclusive' => true,
            'comments' => 'Insert',
            'notes' => 'Insert'
        };

        String insertJson = JSON.serialize(insertEntry);
        String rowListJson = JSON.serialize(new List<Map<String, Object>>{ rowTemplate });

        // INSERT flow
      /*  Test.startTest();
        Accounting_Invoices_Expenses__c inserted = AccountingChartController.saveUpdategeneralLedgerData(
            insertJson,
            rowListJson,
            company.Id
        );
        Test.stopTest();*/
        
        // UPDATE flow
       

        Test.startTest();
          Accounting_Invoices_Expenses__c inserted = AccountingChartController.saveUpdategeneralLedgerData(
            insertJson,
            rowListJson,
            company.Id
        );
         rowTemplate.put('Description__c', 'Updated Desc');
        rowTemplate.put('InvoiceNo', 'INV-UPD');
        rowTemplate.put('Id', [SELECT Id FROM Accounting_Journal_Entry__c WHERE Accounting_Invoices_Expenses__c = :inserted.Id LIMIT 1].Id);
        rowTemplate.put('RowKey__c', [SELECT RowKey__c FROM Accounting_Journal_Entry__c WHERE Accounting_Invoices_Expenses__c = :inserted.Id LIMIT 1].RowKey__c);

        Map<String, Object> updateEntry = new Map<String, Object>{
            'InvoiceDate' => String.valueOf(Date.today()),
            'PostDate' => String.valueOf(Date.today()),
            'InvoiceNo' => 'INV-UPD',
            'invoiceId' => inserted.Id,
            'taxInclusive' => false,
            'comments' => 'Updated',
            'notes' => 'Updated'
        };

        String updateJson = JSON.serialize(updateEntry);
        String updatedRowsJson = JSON.serialize(new List<Map<String, Object>>{ rowTemplate });
        Accounting_Invoices_Expenses__c updated = AccountingChartController.saveUpdategeneralLedgerData(
            updateJson,
            updatedRowsJson,
            company.Id
        );
        Test.stopTest();

    }
    @isTest
    static void testGetEntityEmailMethods() {
        // Get inserted data
        Accounting_Journal_Entry__c journal = [
            SELECT Id, Entity_Profile__r.Email__c, Accounting_Invoices_Expenses__c
            FROM Accounting_Journal_Entry__c LIMIT 1
        ];
    
        Test.startTest();
    
        // Test getentityEmail
        String emailFromJE = AccountingChartController.getentityEmail(journal.Id);
    
        // Test getentityEmailForInvoices
        String emailFromInvoice = AccountingChartController.getentityEmailForInvoices(journal.Accounting_Invoices_Expenses__c);
    
        Test.stopTest();
    
	}
 @isTest
    static void testGetInvoiceHistoryDetails() {
        Accounting_Invoices_Expenses__c invoice = [SELECT Id FROM Accounting_Invoices_Expenses__c LIMIT 1];

        Test.startTest();
        Map<String, Object> result5 = AccountingChartController.getInvoiceHistoryDetails(invoice.Id);
        Test.stopTest();

    }

  /*  @isTest
    static void testCheckDateOverlapIct() {
        Account company = [SELECT Id FROM Account LIMIT 1];
        User staff = [SELECT Id FROM User WHERE Alias = 'tuser' LIMIT 1];

        Date sDate = Date.today().addDays(1);
        Date eDate = Date.today().addDays(5);

        Test.startTest();
        Boolean hasOverlap = AccountingChartController.checkDateOverlapIct(sDate, eDate, company.Id, true, staff.Id);
        Test.stopTest();

        
    }*/
    
    
    
    @isTest
    static void testCheckDateOverlapIctTrue() {
        // Step 1: Create a user or staff member if needed
        User testUser = [SELECT Id FROM User WHERE Profile.Name = 'System Administrator' LIMIT 1];

        // Step 2: Create a company record (assuming it's a custom object)
         Company__c company = [SELECT Id FROM Company__c LIMIT 1];

        // Step 3: Create a staff record (replace with correct object if different)
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];  

        // Step 4: Insert an overlapping invoice
        Accounting_Invoices_Expenses__c existingInvoice = new Accounting_Invoices_Expenses__c(
           // Name = 'Test Invoice',
            Company__c = company.Id,
            Staff__c = staff.Id,
            ICT_Invoice_Entry__c = true,
            Start_Date__c = Date.newInstance(2024, 6, 1),
            End_Date__c = Date.newInstance(2024, 6, 15)
        );
        insert existingInvoice;

        // Step 5: Define overlapping dates
        Date sDate = Date.newInstance(2024, 6, 10);
        Date eDate = Date.newInstance(2024, 6, 20);

        // Step 6: Call method
        Test.startTest();
        Boolean isOverlap = AccountingChartController.checkDateOverlapIct(sDate, eDate, company.Id, true, staff.Id);
        Test.stopTest();

        // Step 7: Assert
        System.assertEquals(true, isOverlap, 'Overlap should be true');
    }

    @isTest
    static void testCheckDateOverlapIctFalse() {
        // Setup same as above
        Company__c company = [SELECT Id FROM Company__c LIMIT 1];

        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];  
        // No invoice inserted here

        Date sDate = Date.newInstance(2024, 7, 1);
        Date eDate = Date.newInstance(2024, 7, 10);

        Test.startTest();
        Boolean isOverlap = AccountingChartController.checkDateOverlapIct(sDate, eDate, company.Id, true, staff.Id);
        Test.stopTest();

        //System.assertEquals(false, isOverlap, 'Overlap should be false');
    }


    @isTest
    static void testGetAllLedgerItems() {
        // Get created company
        Company__c company = [SELECT Id FROM Company__c LIMIT 1];

        Test.startTest();
        List<Accounting_Ledger_Items__c> allLedger = AccountingChartController.getAllLedgerItems(company.Id);
        Test.stopTest();

       // System.assertNotEquals(null, result, 'Result should not be null');
        //System.assertEquals(1, result.size(), 'Should return 1 ledger item');
       // System.assertEquals('4001', result[0].Account_Number__c, 'Account number should match');
    }
     @isTest
    static void testSaveUpdateRfqInvoice() {
        Company__c company = [SELECT Id FROM Company__c LIMIT 1];
        String salesEntryJson = JSON.serialize(new Map<String, Object>{
            'InvoiceDate' => String.valueOf(Date.today()),
                'InvoiceNo' => 'INV-999',
                'Status' => 'Draft',
                'company' => company.Id, // ✅ Corrected
                'PostDate' => String.valueOf(Date.today()),
                'IncludeGST' => 'Yes',
                'participantID' => null,
                'ServicesList' => null,
                'taxInclusive' => true,
                'entityName' => 'Test Entity',
                'comments' => 'Test comment'
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
        AccountingChartController.saveUpdateRfqInvoice(
            salesEntryJson, salesEntryListJson, amountEntryJson, true, true
        );
         //AccountingChartController.updateDataFromPurchases(
           // salesEntryJson, salesEntryListJson, amountEntryJson
        //);
       // System.assertNotEquals(null, result);
        Test.stopTest();
    }
   /* @isTest
    static void testUpdateDataFromPurchases() {
        Company__c company = [SELECT Id FROM Company__c LIMIT 1];
         Accounting_Invoices_Expenses__c invoice = [SELECT Id FROM Accounting_Invoices_Expenses__c LIMIT 1];
        String salesEntryJson = JSON.serialize(new Map<String, Object>{
            'InvoiceDate' => String.valueOf(Date.today()),
                'InvoiceNo' => 'INV-999',
               // 'Status' => 'Draft',
                'company' => company.Id, // ✅ Corrected
                'PostDate' => String.valueOf(Date.today()),
                'IncludeGST' => 'Yes',
                //'participantID' => null,
                //'ServicesList' => null,
                'taxInclusive' => true,
                'entityName' => 'Test Entity',
                'comments' => 'Test comment'
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
       
         AccountingChartController.updateDataFromPurchases(
            salesEntryJson, salesEntryListJson, amountEntryJson
        );
       // System.assertNotEquals(null, result);
        Test.stopTest();
    }*/
  
    
   /* @isTest
    static void testUpdateDataFromPurchases() {
        // Step 1: Create related data
        Account company = new Account(Name = 'Test Company');
        insert company;

        Entity_Profile__c entity = new Entity_Profile__c(First_Name__c = 'John', Last_Name__c = 'Doe');
        insert entity;

        // Step 2: Create JSON strings for salesEntry, salesEntryList, and amountEntry
        String salesEntryJson = JSON.serialize(new Map<String, Object>{
            'invoiceId' => '', // Leave blank for insert test
            'InvoiceDate' => '2024-07-01',
            'PostDate' => '2024-07-05',
            'InvoiceNo' => 'INV-1001',
            'Status' => 'Submitted',
            'company' => company.Id,
            'entityName' => entity.Id,
            'taxInclusive' => true,
            'comments' => 'Test Comment'
        });

        String amountEntryJson = JSON.serialize(new Map<String, Object>{
            'subTotal' => 100,
            'taxAmount' => 10,
            'totalAmount' => 110
        });

        List<Map<String, Object>> salesEntryList = new List<Map<String, Object>>{
            new Map<String, Object>{
                'sno' => 1,
                'Description__c' => 'Test Description',
                'Amount__c' => 110,
                'tax' => '10%',
                'accountItemId' => null,
                'Id' => '' // Leave blank for insert
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

        // Step 3: Assertions
       // System.assertNotEquals(null, result, 'Invoice record should be returned');
       // System.assertEquals(110, result.Total_Amount__c, 'Total amount should match input');

       /* List<Accounting_Journal_Entry__c> journals = [
            SELECT Id, Total_Amount__c, Tax_Amount__c, Entity_Profile__c
            FROM Accounting_Journal_Entry__c
            WHERE Accounting_Invoices_Expenses__c = :result.Id
        ];

       // System.assert(journals.size() > 0, 'Journal entries should be inserted');
        //System.assertEquals(entity.Id, journals[0].Entity_Profile__c, 'Entity should be linked');
    } */


     @isTest
    static void testDeleteMatchingRecords() {
        Accounting_Journal_Entry__c je = [SELECT Id FROM Accounting_Journal_Entry__c LIMIT 1];
        String jsonIds = JSON.serialize(new List<Id>{je.Id});
        Test.startTest();
        AccountingChartController.deleteMatchingRecordsRfq(jsonIds);
        Test.stopTest();
    }
       
}