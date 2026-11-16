public class EntityProfileDataMigrationBatch implements Database.Batchable<SObject>, Database.Stateful {
    
    // Optional status counters
    public Integer processed = 0;    
    // START — Query all Entity_Profile__c records
    public Database.QueryLocator start(Database.BatchableContext bc) {

        return Database.getQueryLocator([
            SELECT Id, Name,
                Discount_for_Early_Payment__c, Monthly_Charge_for_Late_Payment__c, A_B_N_Branch__c, ABN__c,
                Accounting_Ledger_Items__c, AccountList__c, Address__c, Address_Latest__c,
                Available_Credit__c, Balance_Due_Date__c, Balance_Due_Days__c,
                Bank_Account_Name__c, Bank_Account_Number__c, BSB_Number__c,
                Card_Id__c, Card_Type__c, Company__c, Contact__c, Credit_Limit__c,
                Currently_Past_Due__c, Designation__c, Discount_Date__c, Discount_Days__c,
                Email__c, Fax__c, First_Name__c, Inactive_Card__c, Invoice_Delivery__c,
                Item_Price_Level__c, Last_Name__c, Name__c, Payment_is_Due__c,
                Payment_Method__c, Phone_No_1__c, Phone_No_2__c, Phone_No_3__c,
                Printed_Forms__c, Purchase_Layout__c, Remittance_Advice_Delivery_Status__c,
                Sale_Layout__c, Salutation__c, Statement_Text__c, Tax__c, Tax_Code__c,
                Tax_ID_Number__c, TFN__c, Volume_Discount__c, Website__c, Xero_Contact_Id__c,

                (SELECT Id, Name, Entity_Profile__c, AccountList__c, Accounting_Ledger_Items__c, Tax__c,
                    Discount_for_Early_Payment__c, Monthly_Charge_for_Late_Payment__c, A_B_N_Branch__c, ABN__c,
                    Balance_Due_Days__c, Credit_Limit__c, Discount_Days__c, Invoice_Delivery__c,
                    Item_Price_Level__c, Payment_is_Due__c, Printed_Forms__c, Sale_Layout__c,
                    Tax_Code__c, Tax_ID_Number__c, TFN__c, Volume_Discount__c
                 FROM Entity_Selling__r LIMIT 1),

                (SELECT Id, Entity_Profile__c, Name, Payment_Method__c
                 FROM Entity_Selling_Payment__r LIMIT 1),

                (SELECT Id, Entity_Profile__c, Name, Discount_for_Early_Payment__c, A_B_N_Branch__c, ABN__c,
                    Accounting_Ledger_Items__c, AccountList__c, Available_Credit__c, Balance_Due_Date__c,
                    Credit_Limit__c, Currently_Past_Due__c, Discount_Date__c, Payment_is_Due__c,
                    Printed_Forms__c, Purchase_Layout__c, Tax__c, Tax_Code__c, Tax_ID_Number__c,
                    TFN__c, Volume_Discount__c
                 FROM Entity_Buying__r LIMIT 1),

                (SELECT Id, Entity_Profile__c, Bank_Account_Name__c, Bank_Account_Number__c, BSB_Number__c,
                    Email__c, Name, Remittance_Advice_Delivery_Status__c, Statement_Text__c
                 FROM Entity_Payment__r LIMIT 1)

            FROM Entity_Profile__c
        ]);
    }

   
    // EXECUTE — run identical logic for each batch
    
    public void execute(Database.BatchableContext bc, List<Entity_Profile__c> scope) {

        List<Entity_Profile__c> updates = new List<Entity_Profile__c>();

        for (Entity_Profile__c ep : scope) {

            Boolean doUpdate = false;
            Entity_Profile__c upd = new Entity_Profile__c(Id = ep.Id);

            
            // ENTITY SELLING
           
            if (!ep.Entity_Selling__r.isEmpty()) {
                Entity_Selling__c s = ep.Entity_Selling__r[0];

                upd.AccountList__c                 = s.AccountList__c;
                upd.Accounting_Ledger_Items__c     = s.Accounting_Ledger_Items__c;
                upd.Tax__c                         = s.Tax__c;
                upd.Tax_Code__c                    = s.Tax_Code__c;
                upd.Discount_for_Early_Payment__c  = s.Discount_for_Early_Payment__c;
                upd.Monthly_Charge_for_Late_Payment__c = s.Monthly_Charge_for_Late_Payment__c;
                upd.A_B_N_Branch__c                = s.A_B_N_Branch__c;
                upd.ABN__c                         = s.ABN__c;
                upd.Balance_Due_Days__c            = s.Balance_Due_Days__c;
                upd.Credit_Limit__c                = s.Credit_Limit__c;
                upd.Discount_Days__c               = s.Discount_Days__c;
                upd.Invoice_Delivery__c            = s.Invoice_Delivery__c;
                upd.Item_Price_Level__c            = s.Item_Price_Level__c;
                upd.Payment_is_Due__c              = s.Payment_is_Due__c;
                upd.Printed_Forms__c               = s.Printed_Forms__c;
                upd.Sale_Layout__c                 = s.Sale_Layout__c;
                upd.Tax_ID_Number__c               = s.Tax_ID_Number__c;
                upd.TFN__c                         = s.TFN__c;
                upd.Volume_Discount__c             = s.Volume_Discount__c;

                doUpdate = true;
            }

           
            // ENTITY SELLING PAYMENT
            
            if (!ep.Entity_Selling_Payment__r.isEmpty()) {
                Entity_Selling_Payment__c sp = ep.Entity_Selling_Payment__r[0];
                upd.Payment_Method__c = sp.Payment_Method__c;
                doUpdate = true;
            }

           
            // ENTITY BUYING
            
            if (!ep.Entity_Buying__r.isEmpty()) {
                Entity_Buying__c b = ep.Entity_Buying__r[0];

                upd.Tax_Code__c                    = b.Tax_Code__c;
                upd.AccountList__c                 = b.AccountList__c;
                upd.Accounting_Ledger_Items__c     = b.Accounting_Ledger_Items__c;
                upd.Tax__c                         = b.Tax__c;
                upd.Discount_for_Early_Payment__c  = b.Discount_for_Early_Payment__c;
                upd.A_B_N_Branch__c                = b.A_B_N_Branch__c;
                upd.ABN__c                         = b.ABN__c;
                upd.Available_Credit__c            = b.Available_Credit__c;
                upd.Balance_Due_Date__c            = b.Balance_Due_Date__c;
                upd.Credit_Limit__c                = b.Credit_Limit__c;
                upd.Currently_Past_Due__c          = b.Currently_Past_Due__c;
                upd.Discount_Date__c               = b.Discount_Date__c;
                upd.Payment_is_Due__c              = b.Payment_is_Due__c;
                upd.Printed_Forms__c               = b.Printed_Forms__c;
                upd.Purchase_Layout__c             = b.Purchase_Layout__c;
                upd.Tax_ID_Number__c               = b.Tax_ID_Number__c;
                upd.TFN__c                         = b.TFN__c;
                upd.Volume_Discount__c             = b.Volume_Discount__c;

                doUpdate = true;
            }

            // ---------------------------
            // ENTITY PAYMENT
            // ---------------------------
            if (!ep.Entity_Payment__r.isEmpty()) {
                Entity_Buying_Payment__c p = ep.Entity_Payment__r[0];

                upd.Bank_Account_Name__c               = p.Bank_Account_Name__c;
                upd.Bank_Account_Number__c             = p.Bank_Account_Number__c;
                upd.BSB_Number__c                      = p.BSB_Number__c;
                upd.Remittance_Advice_Delivery_Status__c = p.Remittance_Advice_Delivery_Status__c;
                upd.Statement_Text__c                  = p.Statement_Text__c;

                doUpdate = true;
            }

            if (doUpdate) {
                updates.add(upd);
            }
        }

        // UPDATE IN BULK
        if (!updates.isEmpty()) {
            update updates;
            processed += updates.size();
        }
    }
    // FINISH — Optional summary log
    public void finish(Database.BatchableContext bc) {
        System.debug('✔ Batch completed. Total records updated: ' + processed);
    }

}