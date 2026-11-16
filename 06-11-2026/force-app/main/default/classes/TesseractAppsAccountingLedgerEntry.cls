public class TesseractAppsAccountingLedgerEntry {
    
  /*  @AuraEnabled(cacheable=true)
    public static List<Company__c> getCompanyList() {
        List<Company__c> companyList = new List<Company__c>();
        try {
            User objUser = [SELECT Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];
            Accounting_Org__c orgRecord = [SELECT Id FROM Accounting_Org__c WHERE Name = :objUser.Organization_Name__c LIMIT 1];
            
            companyList = [SELECT Id, Name, Organisation__c, Company_Name__c, ABN__c FROM Company__c  WHERE Organisation__c = :orgRecord.Id]; //WHERE Organisation__c = :orgRecord.Id
            
        } catch (Exception e) {
            System.debug('Error fetching company list: ' + e.getMessage());
        }
        return companyList;
    }*/
    
    @AuraEnabled(cacheable=true)
    public static List<Entity_Profile__c> getEntityProfiles(string companyId,string cardType) {
        try {
        String query = 'SELECT Id, Name, Card_Type__c, Designation__c, Name__c, First_Name__c, Last_Name__c, Company__c FROM Entity_Profile__c WHERE ';
        List<String> conditions = new List<String>();

        if (String.isNotBlank(cardType)) {
            conditions.add('Card_Type__c = :cardType');
        }
        if (String.isNotBlank(companyId)) {
            conditions.add('Company__c = :companyId');
        }
		
        
        // If there are conditions, append them to the query
        if (!conditions.isEmpty()) {
            query += String.join(conditions, ' AND ');
        } else {
            // If no conditions are provided, remove WHERE to avoid syntax error
            query = query.replace(' WHERE ', '');
        }

        return Database.query(query);
    } catch (Exception e) {
        System.debug('Error fetching entity profiles: ' + e.getMessage());
        return new List<Entity_Profile__c>(); // Return empty list on error
    }
    }
    
   /* @AuraEnabled(cacheable=true)
    public static List<Accounting_Ledger_Items__c> getLedgerItems() {
        String currentUserId = UserInfo.getUserId();
        try {
            User currentUser = [SELECT Id, Organization_Name__c FROM User WHERE Id = :currentUserId LIMIT 1];
            List<Accounting_Ledger_Items__c> ledgerItems = [
                SELECT Id, Name, Account_Number__c, Category__c, Category__r.Name
                FROM Accounting_Ledger_Items__c WHERE Category__r.Accounting_Organisation__r.Name = :currentUser.Organization_Name__c
                ORDER BY Name ASC
            ];
            System.debug('📌 Retrieved Ledger Items: ' + JSON.serialize(ledgerItems));
            return ledgerItems;
        } catch (Exception e) {
            System.debug('❌ Error fetching Ledger Items: ' + e.getMessage());
            throw new AuraHandledException('Error retrieving ledger items: ' + e.getMessage());
        }
    }  
    
    @AuraEnabled
    public static void insertAccountEntries(String jsonData) {
        try {
            // Deserialize JSON string into List of Wrapper Class
            List<AccountWrapper> taxRecords = (List<AccountWrapper>) JSON.deserialize(jsonData, List<AccountWrapper>.class);
            
            // Prepare list of records for insertion
            List<Accounting_Ledger_Entry__c> recordsToInsert = new List<Accounting_Ledger_Entry__c>();
            
            for (AccountWrapper taxRecord : taxRecords) {
                Accounting_Ledger_Entry__c record = new Accounting_Ledger_Entry__c(
                    Transaction_Type__c = taxRecord.DrOrCr,
                    Description__c = taxRecord.Description,
                    Accounting_Ledger_Items__c = taxRecord.AccountNameId,
                    Unit_Price__c = taxRecord.UnitPrice,
                    Amount__c = taxRecord.Amount,
                    Quantity__c = taxRecord.Quantity,
                    Tax_Amount__c = taxRecord.TaxAmount,
                    Total__c = taxRecord.TotalAmount,
                    Company__c = taxRecord.companyId,
                    Entity_Profile__c = taxRecord.selectedEntityName,
                    Terms__c = taxRecord.terms,
                    Invoice_Date__c = Date.valueOf(taxRecord.invoiceDate),
                    Post_Date__c = Date.valueOf(taxRecord.postDate),
                    Comments__c = taxRecord.comments, 
                    Entry_Type__c = taxRecord.entitytype, 
                    Invoice_No__c = taxRecord.invoiceNo, 
                    Tax_Inclusive__c = taxRecord.taxinclusive, 
                    Tax__c = taxRecord.taxpercentage,
                    Item_Account_Name__c=taxRecord.accName
                );
                recordsToInsert.add(record);
            }
            
            // Insert records into Salesforce
            if (!recordsToInsert.isEmpty()) {
                insert recordsToInsert;
            }
        } catch (Exception e) {
            throw new AuraHandledException('Error inserting records: ' + e.getMessage());
        }
    }

// Wrapper Class
    public class AccountWrapper {
        public Integer index;
        public String DrOrCr;
        public String Description;
        public string ledgerName;
        public String AccountNameId;
        public Decimal UnitPrice;
        public Decimal Amount;
        public Boolean isRowSpanCell;
        public Decimal Quantity;
        public Decimal taxpercentage;
        public Decimal TaxAmount;
        public Decimal TotalAmount;
        public String companyId;
        public String selectedCardType;
        public String selectedEntityName;
        public String terms;
        public String invoiceDate;
        public String postDate;
        public String comments;
        public String entitytype;
        public String invoiceNo;
        public Boolean taxinclusive;
        public string accName;
    }*/

}