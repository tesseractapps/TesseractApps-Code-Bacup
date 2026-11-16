@IsTest
public class EntityProfileDataMigrationBatchTest {

   @TestSetup
    static void setup() {
        
        Accounting_Ledger_Items__c ledger = new Accounting_Ledger_Items__c();
            ledger.Name = 'Test Ledger';
       
            insert ledger;

        
        // Create the main Entity Profile record
        Entity_Profile__c ep = new Entity_Profile__c();
            ep.Name__c = 'Test Profile';
        ep.Card_Type__c='Customer';
         ep.Accounting_Ledger_Items__c = ledger.Id;
        
        insert ep;

                    // ENTITY SELLING
            Entity_Selling__c es = new Entity_Selling__c();
            es.Name = 'Selling Record';
            es.Entity_Profile__c = ep.Id;
            
            // STRING FIELDS → assign text
            es.AccountList__c = '6-1110 - Accounting/Bookeeping Fees';
            es.Accounting_Ledger_Items__c = ledger.Id;
            es.Tax__c = 10;
            es.Tax_Code__c = 'GST,  Goods & Service Tax, 10%';
            es.Invoice_Delivery__c = 'To be Printed';
            es.Item_Price_Level__c = 'Level A';
            es.Payment_is_Due__c = 'Prepaid';
            es.Printed_Forms__c = 'Form1';
            es.Sale_Layout__c = 'Service';
            es.Tax_ID_Number__c = 'TIN1';
            es.TFN__c = 'TFN1';
        	
            
            // DECIMAL / NUMBER FIELDS → must assign numbers, NOT strings
            es.Discount_for_Early_Payment__c = 5;
            es.Monthly_Charge_for_Late_Payment__c = 10;
            es.Balance_Due_Days__c = 30;
            es.Credit_Limit__c = '$0.00';
            es.Discount_Days__c = 2;
            es.Volume_Discount__c = 3;
            
            // TEXT FIELDS that look numeric → keep as string
            es.A_B_N_Branch__c = 'BR1';
            es.ABN__c = 'ABN1';
            
            insert es;

        // ENTITY SELLING PAYMENT
        Entity_Selling_Payment__c esp = new Entity_Selling_Payment__c(
            Name = 'Selling Payment',
            Entity_Profile__c = ep.Id,
            Payment_Method__c = 'Cheque'
        );
        insert esp;

                // ENTITY BUYING
         Entity_Buying__c eb = new Entity_Buying__c();
        eb.Name = 'Buying Record';
        eb.Entity_Profile__c = ep.Id;
        
        // STRING FIELDS
        eb.AccountList__c = '4-1110 - Sales Income #1';
        eb.Accounting_Ledger_Items__c = ledger.Id;
        eb.Tax__c = 0;
        eb.Tax_Code__c = 'FRE, GST Free, 0%';
        eb.Purchase_Layout__c = 'Service';
        eb.Printed_Forms__c = 'Form2';
        eb.Tax_ID_Number__c = 'TIN2';
        eb.TFN__c = 'TFN2';
        
        // DECIMAL / NUMBER FIELDS
        eb.Discount_for_Early_Payment__c = 7;
        eb.Available_Credit__c = '500';
        eb.Credit_Limit__c = '2000';
        eb.Volume_Discount__c = 8;
        
        // BOOLEAN FIELD
        eb.Currently_Past_Due__c = '500';
        
        // DATE FIELDS
        eb.Balance_Due_Date__c = Date.today();
        eb.Discount_Date__c = Date.today().addDays(5);
        
        // TEXT FIELDS that LOOK numeric (make sure they are text in org)
        eb.A_B_N_Branch__c = 'BR2';
        eb.ABN__c = 'ABN2';
        
        // Payment_is_Due__c (TEXT in your batch logic)
        eb.Payment_is_Due__c = 'Prepaid';
        insert eb;


        // ENTITY PAYMENT
        Entity_Buying_Payment__c epay = new Entity_Buying_Payment__c(
            Name = 'Payment Record',
            Entity_Profile__c = ep.Id,
            Bank_Account_Name__c = 'Test Bank',
            Bank_Account_Number__c = '12345',
            BSB_Number__c = '001',
            Email__c = 'test@example.com',
            Remittance_Advice_Delivery_Status__c = 'To be Printed',
            Statement_Text__c = 'Statement details'
        );
        insert epay;
    }

    @IsTest
    static void testBatchProcessing() {

        Test.startTest();

        // Run batch
        EntityProfileDataMigrationBatch batch = new EntityProfileDataMigrationBatch();
        Database.executeBatch(batch);

        Test.stopTest();

        // Retrieve updated record
        Entity_Profile__c result = [
            SELECT Id,Name__c, AccountList__c, Accounting_Ledger_Items__c, Tax__c, Tax_Code__c,
                   Payment_Method__c, Bank_Account_Name__c, BSB_Number__c
            FROM Entity_Profile__c
            LIMIT 1
        ];
        
                Accounting_Ledger_Items__c ledger =
            [SELECT Id FROM Accounting_Ledger_Items__c LIMIT 1];

				System.assertEquals(ledger.Id, result.Accounting_Ledger_Items__c);


        // ASSERTIONS — ensure fields updated
        System.assertEquals('4-1110 - Sales Income #1', result.AccountList__c);       // From Buying
        System.assertEquals(ledger.Id, result.Accounting_Ledger_Items__c);
        System.assertEquals(0, result.Tax__c);
        System.assertEquals('FRE, GST Free, 0%', result.Tax_Code__c);

        System.assertEquals('Cheque', result.Payment_Method__c); // Selling Payment

        System.assertEquals('Test Bank', result.Bank_Account_Name__c); // Payment
        System.assertEquals('001', result.BSB_Number__c);
    }
}