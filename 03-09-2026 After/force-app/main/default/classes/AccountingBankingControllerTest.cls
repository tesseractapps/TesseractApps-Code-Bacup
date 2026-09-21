@isTest
public class AccountingBankingControllerTest {
    
    
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
        
        Company__c company = new Company__c(
            Organization__c = org.Id,
            ABN__c = '123456789',
            Phone_Number__c = '1234567890',
            Address_Latest__Street__s = 'Street',
            Address_Latest__City__s = 'City',
            Address_Latest__StateCode__s = 'NSW',
            Address_Latest__PostalCode__s = '9999');
        insert company;
        
        Account_List__c accList = new Account_List__c(
            Name = 'Main Accounts',
            Company__c = company.Id
        );
        insert accList;
        
        Accounting_Category__c cat = new Accounting_Category__c(Name='Assets', Account_Number__c='1000', Account_List__c = accList.Id);
        insert cat;
        
        Accounting_Sub_Category__c sub = new Accounting_Sub_Category__c(Name='Current Assets', Account_Number__c='1000-1', Category__c=cat.Id);
        insert sub;
        
        Accounting_Ledger_Name__c ledger = new Accounting_Ledger_Name__c(Name='Bank Accounts', Account_Number__c='1000-1-01', Sub_Category__c=sub.Id,Category__c=cat.Id);
        insert ledger;
        
        Accounting_Ledger_Name__c ledger1 = new Accounting_Ledger_Name__c(Name='Credit Cards', Account_Number__c='1000-1-02', Category__c=cat.Id);
        insert ledger1;

        Accounting_Ledger_Items__c item1 = new Accounting_Ledger_Items__c( Name='Cash Account', Account_Number__c='001', Category__c = cat.Id, Ledger_Name__c = ledger1.Id,Amount__c = 500);
		 insert item1;
        
       
        
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
        
       Invoice_Payment__c payment= new Invoice_Payment__c(
        	Accounting_Ledger_Items__c=item1.Id,
            Company__c=company.Id,
            Entity_Profile__c = entity.Id,
            Total_Amount_Paid__c=0,
            Total_Amount_Received__c=0,
            Is_Spend_Money__c=true,
            Is_Receive_Money__c=false
        );
        insert payment;
        Invoice_Payment__c payment1= new Invoice_Payment__c(
        	Accounting_Ledger_Items__c=item1.Id,
            Company__c=company.Id,
            Entity_Profile__c = entity.Id,
            Total_Amount_Paid__c=0,
            Total_Amount_Received__c=0,
            Is_Receive_Money__c=true,
            Is_Spend_Money__c=false
        );
        insert payment1;

          Accounting_Invoices_Expenses__c invoice = new Accounting_Invoices_Expenses__c(
            Company__c = company.Id,
            Invoice_Date__c = Date.today(),
            Status__c = 'Open',
            Invoice_Payment__c=payment.Id  ,
            Payment_History_JSON__c = '{"paid":true}'
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
            Total_Amount__c = 220,
            Accounting_Ledger_Items__c = item1.Id,
            Entity_Profile__c = entity.Id,
            Entry_Type__c='Purchases'
        );
        insert je;
        
         Accounting_Ledger_Items__c supplier = new Accounting_Ledger_Items__c(
            Name = 'Supplier Over Payment',
            Account_Number__c = '9001',
            Category__c = cat.Id,
            Amount__c = 0
        );
        insert supplier;
        
        Accounting_Ledger_Items__c customer = new Accounting_Ledger_Items__c(
            Name = 'Customer Over Payment',
            Account_Number__c = '9002',
            Category__c = cat.Id,
            Amount__c = 0
        );
        insert customer;
        Invoice_Over_Payment__c op= new Invoice_Over_Payment__c(
        	Over_Payment_No__c='435',
            Company__c= company.Id,
            Invoice_Payment__c= payment.Id,
            Amount__c= 100,
            Accounting_Ledger_Items__c= supplier.Id,
            Is_Spend_Money__c=true
        );
          insert op;
        
         Accounting_Ledger_Items__c tradeDebtors = new Accounting_Ledger_Items__c(
            Name = 'Trade Debtors',
            Account_Number__c = '1100',
            Category__c = cat.Id,
            Amount__c = 0
        );
        insert tradeDebtors;
        
        // Ledger item for Purchases flow
        Accounting_Ledger_Items__c tradeCreditors = new Accounting_Ledger_Items__c(
            Name = 'Trade Creditors',
            Account_Number__c = '2100',
            Category__c = cat.Id,
            Amount__c = 0
        );
        insert tradeCreditors;
        Accounting_Journal_Entry__c jeSales = new Accounting_Journal_Entry__c(
            Company__c = company.Id,
            Invoice_Date__c = Date.today(),
            Sl_no__c = 1,
            Accounting_Invoices_Expenses__c = invoice.Id,
            Unit_Price__c = 100,
            Quantity__c = 2,
            Tax__c = 10,
            Total_Amount__c = 220,
            Accounting_Ledger_Items__c = tradeDebtors.Id, // IMPORTANT
            Entity_Profile__c = entity.Id,
            Entry_Type__c = 'Sales'
        );
        insert jeSales;
            

    }
     @isTest
    static void testetLedgerItemsAssetsLiabilities() {
        // Get test organisation
        Organisation__c org = [SELECT Id, Name FROM Organisation__c LIMIT 1];
                        
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
        
         // Delete existing company and create one properly linked to organisation
        //delete [SELECT Id FROM Company__c LIMIT 100];
        Company__c company =  [SELECT Id FROM Company__c  LIMIT 1];
        Accounting_Invoices_Expenses__c invoice = [SELECT Id FROM Accounting_Invoices_Expenses__c LIMIT 1];
        Invoice_Payment__c  pay = [SELECT Id, Name FROM Invoice_Payment__c  LIMIT 1];
		Invoice_Payment__c  pay1 = [SELECT Id, Name FROM Invoice_Payment__c  WHERE Is_Spend_Money__c=true LIMIT 1];
        Invoice_Payment__c  pay2 = [SELECT Id, Name FROM Invoice_Payment__c WHERE Is_Receive_Money__c=true  LIMIT 1];
        Invoice_Over_Payment__c  op = [SELECT Id, Name FROM Invoice_Over_Payment__c  LIMIT 1];
        
        // Build account structure for ledger item resolution
        /*Account_List__c accountList = new Account_List__c(Company__c = company.Id);
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
        insert ledgerItem;*/
         Entity_Profile__c entity = [ SELECT Id, Card_Type__c FROM Entity_Profile__c WHERE Card_Type__c = 'Customer' LIMIT 1];
         Entity_Profile__c entity1 = [SELECT Id, Card_Type__c FROM Entity_Profile__c WHERE Card_Type__c = 'Supplier' LIMIT 1];
         Accounting_Ledger_Items__c ledgerItem = [SELECT Id FROM Accounting_Ledger_Items__c LIMIT 1];
        
         Map<String, Object> paymentRecord = new Map<String, Object>{
            'entity' => entity.Id,
            'company' => company.Id,
            'payee' => 'Test Payee',
            'paymentDate' => String.valueOf(Date.today()),
            'overalTotalPaid' => 200,
            'fromLedger' => ledgerItem.Id
        };
            
              List<Map<String, Object>> invoiceList = new List<Map<String, Object>>();

        Map<String, Object> invMap = new Map<String, Object>{
            'Id' => invoice.Id,
            'paidAmount' => 100,
            'balanceAmount' => 120,
            'isEntityPayment' => true,
            'entryType' => 'Sales',
            'invoiceAutoNo' => 'INV-001',
            'historyEntry' => new Map<String, Object>{
                'date' =>String.valueOf(Date.today()),
                'time' => '10:00 AM',
                'invoicePaid' => 100,
                'toPayValue' => 100,
                'balance' => 120
            }
        };

        invoiceList.add(invMap);
        
         Map<String,Object> salesEntry = new Map<String,Object>{
            'InvoiceDate' => String.valueOf(Date.today()),
            'InvoiceNo'   => 'INV-001',
            'company'     => company.Id,
            'taxInclusive'=> true
        };
        String salesEntryJson = JSON.serialize(salesEntry);
        Map<String,Object> salesEntry1 = new Map<String,Object>{
            'InvoiceDateReceit' => String.valueOf(Date.today()),
            'InvoiceNoReceit'   => 'INV-001',
            'company'           => company.Id,
            'taxInclusiveReceit'=> true
        };
        String salesEntryJson1 = JSON.serialize(salesEntry1);

        List<Object> salesEntryList = new List<Object>{
            new Map<String,Object>{
                'sno' => 1,
                'Description__c' => 'Product A',
                'Cash_Paid__c' => 200,
                'tax' => '18%',
                'accountItemId' => ledgerItem.Id
            }
        };
        String salesEntryListJson = JSON.serialize(salesEntryList);
          List<Object> salesEntryList1 = new List<Object>{
            new Map<String,Object>{
                'sno' => 1,
                'Description_Receit__c' => 'Product B',
                'Cash_Receit__c' => 200,
                'taxValueReceit' => '18%',
                'accountItemIdReceit' => ledgerItem.Id
            }
        };
        String salesEntryListJson1 = JSON.serialize(salesEntryList1);

        Map<String,Object> amountEntry = new Map<String,Object>{
            'subTotal' => 200,
            'taxAmount' => 30,
            'totalAmount' => 230
        };
        String amountEntryJson = JSON.serialize(amountEntry);

        // paymentJson
        Map<String,Object> paymentMap = new Map<String,Object>{
            'company' => company.Id,
            'paymentDate' => String.valueOf(Date.today()),
            'overalTotalPaid' => 230,
            'fromLedger' => ledgerItem.Id,
            'isCashPayment' => true
        };
        String paymentJson = JSON.serialize(paymentMap);
        
        Map<String,Object> paymentMap1 = new Map<String,Object>{
            'company' => company.Id,
            'paymentDate' => String.valueOf(Date.today()),
            'overalTotalReceived' => 230,
            'fromLedger' => ledgerItem.Id,
            'isCashReceived' => true
        };
        String paymentJson1 = JSON.serialize(paymentMap1);

        
        // Run method in the context of the correct user
        System.runAs(u) {
            Test.startTest();
            List<Accounting_Ledger_Items__c> items = AccountingBankingController.getLedgerItemsAssetsLiabilities(company.Id);
            List<Accounting_Invoices_Expenses__c> invoices = AccountingBankingController.getInvoicesBasedOnEntity(company.Id,entity.Id);
            String paymentId = AccountingBankingController.createPaymentWithInvoiceUpdates(paymentRecord, invoiceList, true );
            String paymentId1 = AccountingBankingController.createPaymentWithInvoiceUpdates(paymentMap1, invoiceList, false );
            Boolean result1 = AccountingBankingController.updateLedgerItemId(ledgerItem.Id, 50, 'Assets', 'Purchases');
            Accounting_Invoices_Expenses__c inv =AccountingBankingController.updateDataForCashPayment( salesEntryJson,salesEntryListJson,amountEntryJson,paymentJson );
            Accounting_Invoices_Expenses__c inv1 =AccountingBankingController.updateDataForCashReceipt( salesEntryJson1,salesEntryListJson1,amountEntryJson,paymentJson1 );
            
            Map<String, Object> result = AccountingBankingController.getAccountingPaymentPdf(pay.Id);
           // AccountingBankingController.sendEmail(base64, 'testonefacility@gmail.com', orgName, 'fileName');
            Map<String, String> emailFromInvoice = AccountingBankingController.getentityEmailForPaymentInvoices(pay.Id);
           // AccountingBankingController.sendEmailforInvoicePayments(pay.Id,'testonefacility@gmail.com','testtwofacility@gmail.com', 'https://example.com/test.pdf','Test', 'Test');
            String opNo = AccountingBankingController.getNextOverpaymentNumber(company.Id );
           // Id opId = AccountingBankingController.saveOverpaymentRecord(company.Id,pay1.Id,200, Date.today(), 'OP-002', false );
            //Id opId1= AccountingBankingController.saveOverpaymentRecord(company.Id,pay.Id,200, Date.today(), 'OP-003', true );
            try {
                AccountingBankingController.sendEmailforInvoicePayments( pay.Id, 'testonefacility@gmail.com','testtwofacility@gmail.com', 'https://example.com/test.pdf','Test', 'Test' );
            } catch (AuraHandledException ex) {
                System.debug('Expected exception caught: ' + ex.getMessage());
            }
            Test.stopTest();
            
            System.debug('Returned Ledger Items: ' + items);
        }
    }
     @isTest
    static void testFormatDateDDMMYYYY() {
        // Test a regular date
        Date testDate = Date.newInstance(2024, 6, 5); // 5th June 2024
        String expectedOutput = '05/06/2024';
        String actualOutput = AccountingBankingController.formatDateDDMMYYYY(testDate);
        
        // Test double-digit day and month
        Date testDate2 = Date.newInstance(2024, 11, 15); // 15th November 2024
        String expectedOutput2 = '15/11/2024';
        String actualOutput2 = AccountingBankingController.formatDateDDMMYYYY(testDate2);
    }
    @isTest
    static void testSaveOverpaymentRecord() {
    
        // Get data created by @testSetup
        Company__c company = [SELECT Id FROM Company__c LIMIT 1];
        Invoice_Payment__c paySpend = [
            SELECT Id FROM Invoice_Payment__c 
            WHERE Is_Spend_Money__c = true LIMIT 1
        ];
        Invoice_Payment__c payReceive = [
            SELECT Id FROM Invoice_Payment__c 
            WHERE Is_Receive_Money__c = true LIMIT 1
        ];
    
        // Ledger items created in testSetup
        Accounting_Ledger_Items__c supplierLedger = [
            SELECT Id, Amount__c 
            FROM Accounting_Ledger_Items__c 
            WHERE Name = 'Supplier Over Payment' LIMIT 1
        ];
    
        Accounting_Ledger_Items__c customerLedger = [
            SELECT Id, Amount__c 
            FROM Accounting_Ledger_Items__c 
            WHERE Name = 'Customer Over Payment' LIMIT 1
        ];
    
        Test.startTest();
    
        // 1️⃣ TEST SPEND MONEY → Should use Supplier Over Payment
        Id opSpendId = AccountingBankingController.saveOverpaymentRecord(
            company.Id,
            paySpend.Id,
            150,
            Date.today(),
            'OP-TEST-01',
            true     // isSpendMoney
        );
    
        Invoice_Over_Payment__c opSpend = [
            SELECT Id, Amount__c, Accounting_Ledger_Items__c 
            FROM Invoice_Over_Payment__c 
            WHERE Id = :opSpendId
        ];
   
        // Supplier ledger amount should update
        supplierLedger = [
            SELECT Amount__c FROM Accounting_Ledger_Items__c WHERE Id = :supplierLedger.Id
        ];
      
        // 2️⃣ TEST RECEIVE MONEY → Should use Customer Over Payment
        Id opReceiveId = AccountingBankingController.saveOverpaymentRecord(
            company.Id,
            payReceive.Id,
            200,
            Date.today(),
            'OP-TEST-02',
            false    // isSpendMoney = FALSE
        );
    
        Invoice_Over_Payment__c opReceive = [
            SELECT Id, Amount__c, Accounting_Ledger_Items__c 
            FROM Invoice_Over_Payment__c 
            WHERE Id = :opReceiveId
        ];
    
      
        // Customer ledger amount should update
        customerLedger = [
            SELECT Amount__c FROM Accounting_Ledger_Items__c WHERE Id = :customerLedger.Id
        ];
      
        Test.stopTest();
    }
}