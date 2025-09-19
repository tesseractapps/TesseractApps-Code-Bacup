public class TesseractAppsAccountingExpensesInvoices {
  	@AuraEnabled(cacheable=true)
    public static List<Entity_Profile__c> getEntityProfiles(string companyId,string entryType) {
        try {
            String cardType;
    
            // Determine card type from entry type
            if (entryType == 'Sales') {
                cardType = 'Customer';
            } else if (entryType == 'Purchases') {
                cardType = 'Supplier';
            }
    
            String query = 'SELECT Id, Name, Card_Type__c, Designation__c, Name__c, First_Name__c, Last_Name__c, Company__c FROM Entity_Profile__c';
            List<String> conditions = new List<String>();
    
            if (String.isNotBlank(cardType)) {
                conditions.add('Card_Type__c = :cardType');
            }
            if (String.isNotBlank(companyId)) {
                conditions.add('Company__c = :companyId');
            }
    
            // If there are conditions, append them to the query
            if (!conditions.isEmpty()) {
                query += ' WHERE ' + String.join(conditions, ' AND ');
            }
    
            return Database.query(query);
        } catch (Exception e) {
            System.debug('Error fetching entity profiles: ' + e.getMessage());
            return new List<Entity_Profile__c>(); // Return empty list on error
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Accounting_Journal_Entry__c> getAccountingExpense( String sDate, String eDate,Id companyId,Boolean isExpense) {
        List<Accounting_Journal_Entry__c> expenseData = new List<Accounting_Journal_Entry__c>();
        String currentUserId = UserInfo.getUserId();
        User currentUser = [SELECT Id, Organization_Name__c FROM User WHERE Id = :currentUserId LIMIT 1];
        Date startDate = Date.valueOf(sDate);
        Date endDate = Date.valueOf(eDate);
        List<Accounting_Ledger_Items__c> ledgerItems = [ SELECT Id, Name, Account_Number__c, Category__r.Name
                      									 FROM Accounting_Ledger_Items__c WHERE Category__r.Account_List__r.Company__r.Organization__r.Name = :currentUser.Organization_Name__c
               											 AND Category__r.Account_List__r.Company__c = :companyId AND Category__r.Name IN ('Income', 'Expenses')];
    
        // Create the base query
        String query = 'SELECT Id, Name, Entity_Profile__c, Description__c, Quantity__c, Unit_Price__c, Tax__c, Comments__c,Sl_no__c,' +
                       'Created_From_Expenses__c, Invoice_Date__c, Accounting_Ledger_Items__r.Name, Amount__c, Tax_Amount__c, Entry_Type__c, ' +
                       'Entity_Profile__r.Name__c, Entity_Profile__r.First_Name__c, Entity_Profile__r.Last_Name__c ,Accounting_Invoices_Expenses__r.Is_Service_Invoice__c' + 
                        ' FROM Accounting_Journal_Entry__c ' +
                       'WHERE Company__c = :companyId ' +
                       'AND Invoice_Date__c >= :startDate ' +
                       'AND Invoice_Date__c <= :endDate ';
    
        // Add condition based on Created_From_Expenses__c
        
            //query += 'AND Created_From_Expenses__c = :isExpense ';
         if (isExpense) {
             // For Expense View
             query += 'AND Created_From_Expenses__c = true ';
         } else {
             // For General Ledger Sales Only
             query += 'AND Created_From_Expenses__c = false ';
    		 query += 'AND (Accounting_Invoices_Expenses__r.Is_General_Ledger_Sales__c = true ' +
             		  'OR Accounting_Invoices_Expenses__r.Is_General_Ledger_Purchases__c = true) ';
         }
       	     //query += 'AND Sl_no__c = null ';
        	 //query += 'AND Accounting_Invoices_Expenses__r.Is_Service_Invoice__c = false ';
            // If Created_From_Expenses__c is false, filter by income or expense-related ledger items
            // Assuming you have a custom field, e.g., "Ledger_Item_Type__c" to distinguish income vs expense
             query += 'AND Accounting_Ledger_Items__r.Id IN :ledgerItems ';
        
    
        // Order the results by Invoice_Date__c
        query += 'ORDER BY Invoice_Date__c DESC';
    
        // Execute the dynamic query
        expenseData = Database.query(query);
        for (Accounting_Journal_Entry__c entry : expenseData) {
            System.debug('📌 Entry: ' + JSON.serialize(entry.Name));
        }
        //System.debug('Invoice Data for companyId: ' + JSON.serialize(expenseData));
    
        return expenseData;
    }

    @AuraEnabled(cacheable=true)
    public static Accounting_Journal_Entry__c getExpenseOnEdit(Id expenseID) {
        Accounting_Journal_Entry__c expenseData;
        
        if (expenseID != null) {
            expenseData = [SELECT Id, Name, Entity_Profile__c, Description__c, Quantity__c, Unit_Price__c, 
                           Tax__c, Comments__c, Created_From_Expenses__c, Invoice_Date__c, 
                           Accounting_Ledger_Items__r.Name, Accounting_Ledger_Items__r.Account_Number__c,Amount__c, Tax_Amount__c, Entry_Type__c,
                           Entity_Profile__r.Name__c, Entity_Profile__r.First_Name__c, Entity_Profile__r.Last_Name__c,
                           Entity_Profile__r.Card_Type__c, Entity_Profile__r.Designation__c,Company__c,Post_Date__c,Invoice_No__c
                           FROM Accounting_Journal_Entry__c 
                           WHERE Id = :expenseID LIMIT 1];
            
            System.debug('Expense Data for expenseID: ' + JSON.serialize(expenseData));
        }
        
        return expenseData;
}
    
    @AuraEnabled
    public static Boolean updateExpense(Accounting_Journal_Entry__c updatedExpense) {
        
        system.debug('updatedExpense===>'+updatedExpense);
        try {
            // Find the existing expense record based on ID
            // Fetch the existing Accounting_Journal_Entry__c record
            Accounting_Journal_Entry__c existingExpense = [
                SELECT Id, Name, Entity_Profile__c, Description__c, Quantity__c, 
                Unit_Price__c, Tax__c, Comments__c, Created_From_Expenses__c, 
                Invoice_Date__c, Accounting_Ledger_Items__r.Name, Accounting_Invoices_Expenses__c, 
                Accounting_Ledger_Items__r.Account_Number__c, Amount__c, 
                Tax_Amount__c, Entry_Type__c, Entity_Profile__r.Name__c, 
                Entity_Profile__r.First_Name__c, Entity_Profile__r.Last_Name__c
                FROM Accounting_Journal_Entry__c
                WHERE Id = :updatedExpense.Id
                LIMIT 1
            ];
            
            // Fetch the related Accounting_Invoices_Expenses__c record
            Accounting_Invoices_Expenses__c accountInvoiceExpense;
            if (existingExpense.Accounting_Invoices_Expenses__c != null) {
                accountInvoiceExpense = [
                    SELECT Id 
                    FROM Accounting_Invoices_Expenses__c 
                    WHERE Id = :existingExpense.Accounting_Invoices_Expenses__c
                    LIMIT 1
                ];
                
                System.debug('Related Invoice Found: ' + accountInvoiceExpense.Id);
            } else {
                System.debug('No related Invoice found for this Journal Entry.');
            }
            
            List<Accounting_Journal_Entry__c> existingExpenseList = [SELECT Id, Name, Entity_Profile__c, Description__c, Quantity__c, 
                                                            Unit_Price__c, Tax__c, Comments__c, Created_From_Expenses__c, 
                                                            Invoice_Date__c, Accounting_Ledger_Items__r.Name, Accounting_Invoices_Expenses__c, 
                                                            Accounting_Ledger_Items__r.Account_Number__c, Amount__c, 
                                                            Tax_Amount__c, Entry_Type__c, Entity_Profile__r.Name__c, 
                                                            Entity_Profile__r.First_Name__c, Entity_Profile__r.Last_Name__c,
                                                            Accounting_Ledger_Items__r.Category__c, Accounting_Ledger_Items__r.Category__r.Name
                                                            FROM Accounting_Journal_Entry__c
                                                            WHERE Accounting_Invoices_Expenses__c = :accountInvoiceExpense.Id];

            
            system.debug('existingExpenses size ===> ' + existingExpenseList.size());
            for (Accounting_Journal_Entry__c existingexp : existingExpenseList) {
                if(existingexp.Accounting_Ledger_Items__r.Category__r.Name == 'Expenses'){
                    existingexp.Entity_Profile__c = updatedExpense.Entity_Profile__c;
                    existingexp.Company__c = updatedExpense.Company__c;
                    existingexp.Description__c = updatedExpense.Description__c;
                    existingexp.Invoice_Date__c  =  updatedExpense.Invoice_Date__c;
                    existingexp.Entry_Type__c = updatedExpense.Entry_Type__c;
                    existingexp.Invoice_No__c = updatedExpense.Invoice_No__c;
                    existingexp.Tax_Inclusive__c = updatedExpense.Tax_Inclusive__c;
                    existingexp.Post_Date__c = updatedExpense.Post_Date__c;
                    existingexp.Total_Amount__c = updatedExpense.Sub_Total__c;
                    existingexp.Tax__c = updatedExpense.Tax__c;
                    existingexp.Tax_Amount__c = updatedExpense.Tax_Amount__c;
                    existingexp.Amount__c = updatedExpense.Amount__c;
                } else if(existingexp.Accounting_Ledger_Items__r.Category__r.Name == 'Assets'){
                    existingexp.Entity_Profile__c = updatedExpense.Entity_Profile__c;
                    existingexp.Company__c = updatedExpense.Company__c;
                    existingexp.Description__c = updatedExpense.Description__c;
                    existingexp.Invoice_Date__c  =  updatedExpense.Invoice_Date__c;
                    existingexp.Entry_Type__c = updatedExpense.Entry_Type__c;
                    existingexp.Invoice_No__c = updatedExpense.Invoice_No__c;
                    existingexp.Tax_Inclusive__c = updatedExpense.Tax_Inclusive__c;
                    existingexp.Post_Date__c = updatedExpense.Post_Date__c;
                    existingexp.Total_Amount__c = updatedExpense.Tax_Amount__c;
                    existingexp.Tax__c = updatedExpense.Tax__c;
                    
                }else if(existingexp.Accounting_Ledger_Items__r.Category__r.Name == 'Liabilities'){
                    existingexp.Entity_Profile__c = updatedExpense.Entity_Profile__c;
                    existingexp.Company__c = updatedExpense.Company__c;
                    existingexp.Description__c = updatedExpense.Description__c;
                    existingexp.Invoice_Date__c  =  updatedExpense.Invoice_Date__c;
                    existingexp.Entry_Type__c = updatedExpense.Entry_Type__c;
                    existingexp.Invoice_No__c = updatedExpense.Invoice_No__c;
                    existingexp.Tax_Inclusive__c = updatedExpense.Tax_Inclusive__c;
                    existingexp.Post_Date__c = updatedExpense.Post_Date__c;
                    existingexp.Total_Amount__c = updatedExpense.Amount__c;
                    existingexp.Tax__c = updatedExpense.Tax__c;                   
                }
              }
            
            if (!existingExpenseList.isEmpty()) {
                update existingExpenseList;
            }
            
            
            
            
            // Update the fields of the existing record
            /*existingExpense.Description__c = updatedExpense.Description__c;
existingExpense.Quantity__c = updatedExpense.Quantity__c;
existingExpense.Unit_Price__c = updatedExpense.Unit_Price__c;
existingExpense.Tax__c = updatedExpense.Tax__c;
existingExpense.Comments__c = updatedExpense.Comments__c;
existingExpense.Invoice_Date__c = updatedExpense.Invoice_Date__c;
existingExpense.Amount__c = updatedExpense.Amount__c;
existingExpense.Tax_Amount__c = updatedExpense.Tax_Amount__c;
existingExpense.Entry_Type__c = updatedExpense.Entry_Type__c;
existingExpense.Entity_Profile__c = updatedExpense.Entity_Profile__c;
existingExpense.Accounting_Ledger_Items__c = updatedExpense.Accounting_Ledger_Items__c;
existingExpense.Invoice_No__c = updatedExpense.Invoice_No__c;
existingExpense.Tax_Inclusive__c = updatedExpense.Tax_Inclusive__c;
existingExpense.Terms__c = updatedExpense.Terms__c;
existingExpense.Post_Date__c = updatedExpense.Post_Date__c;

// Update the record in the database
update existingExpense;*/
            
            return true;  // Return success status
        } catch (Exception e) {
            System.debug('Error while updating expense record: ' + e.getMessage());
            return false; // Return failure status if something goes wrong
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static Accounting_Journal_Entry__c getEntryOnEdit(Id entryID) {
        Accounting_Journal_Entry__c expenseData;
        
        if (entryID != null) {
            expenseData = [SELECT Id, Name, Entity_Profile__c, Description__c, Quantity__c, Unit_Price__c, 
                           Tax__c, Comments__c, Created_From_Expenses__c, Invoice_Date__c, 
                           Accounting_Ledger_Items__r.Name, Accounting_Ledger_Items__r.Account_Number__c,Amount__c, Tax_Amount__c, Entry_Type__c,
                           Entity_Profile__r.Name__c, Entity_Profile__r.First_Name__c, Entity_Profile__r.Last_Name__c,
                           Entity_Profile__r.Card_Type__c, Entity_Profile__r.Designation__c,Company__c,Post_Date__c,Invoice_No__c
                           FROM Accounting_Journal_Entry__c 
                           WHERE Id = :entryID LIMIT 1];
            
            System.debug('Expense Data for expenseID: ' + JSON.serialize(expenseData));
        }
        
        return expenseData;
    }
    
    @AuraEnabled
    public static Boolean updateSalesEntry(Accounting_Journal_Entry__c updatedExpense) {
        
        system.debug('updatedExpense===>'+updatedExpense);
        try {
            // Find the existing expense record based on ID
            // Fetch the existing Accounting_Journal_Entry__c record
            Accounting_Journal_Entry__c existingExpense = [
                SELECT Id, Name, Entity_Profile__c, Description__c, Quantity__c, 
                Unit_Price__c, Tax__c, Comments__c, Created_From_Expenses__c, 
                Invoice_Date__c, Accounting_Ledger_Items__r.Name, Accounting_Invoices_Expenses__c, 
                Accounting_Ledger_Items__r.Account_Number__c, Amount__c, 
                Tax_Amount__c, Entry_Type__c, Entity_Profile__r.Name__c, 
                Entity_Profile__r.First_Name__c, Entity_Profile__r.Last_Name__c
                FROM Accounting_Journal_Entry__c
                WHERE Id = :updatedExpense.Id
                LIMIT 1
            ];
            
            // Fetch the related Accounting_Invoices_Expenses__c record
            Accounting_Invoices_Expenses__c accountInvoiceExpense;
            if (existingExpense.Accounting_Invoices_Expenses__c != null) {
                accountInvoiceExpense = [
                    SELECT Id 
                    FROM Accounting_Invoices_Expenses__c 
                    WHERE Id = :existingExpense.Accounting_Invoices_Expenses__c
                    LIMIT 1
                ];
                
                System.debug('Related Invoice Found: ' + accountInvoiceExpense.Id);
            } else {
                System.debug('No related Invoice found for this Journal Entry.');
            }
            
            List<Accounting_Journal_Entry__c> existingExpenseList = [SELECT Id, Name, Entity_Profile__c, Description__c, Quantity__c, 
                                                            Unit_Price__c, Tax__c, Comments__c, Created_From_Expenses__c, 
                                                            Invoice_Date__c, Accounting_Ledger_Items__r.Name, Accounting_Invoices_Expenses__c, 
                                                            Accounting_Ledger_Items__r.Account_Number__c, Amount__c, 
                                                            Tax_Amount__c, Entry_Type__c, Entity_Profile__r.Name__c, 
                                                            Entity_Profile__r.First_Name__c, Entity_Profile__r.Last_Name__c,
                                                            Accounting_Ledger_Items__r.Category__c, Accounting_Ledger_Items__r.Category__r.Name
                                                            FROM Accounting_Journal_Entry__c
                                                            WHERE Accounting_Invoices_Expenses__c = :accountInvoiceExpense.Id AND Entry_Type__c='Sales' ];

            
            system.debug('existingExpenses size ===> ' + existingExpenseList.size());
            for (Accounting_Journal_Entry__c existingexp : existingExpenseList) {
                if(existingexp.Accounting_Ledger_Items__r.Category__r.Name == 'Income'){
                    existingexp.Entity_Profile__c = updatedExpense.Entity_Profile__c;
                    existingexp.Company__c = updatedExpense.Company__c;
                    existingexp.Description__c = updatedExpense.Description__c;
                    existingexp.Invoice_Date__c  =  updatedExpense.Invoice_Date__c;
                    existingexp.Entry_Type__c = updatedExpense.Entry_Type__c;
                    existingexp.Invoice_No__c = updatedExpense.Invoice_No__c;
                    existingexp.Tax_Inclusive__c = updatedExpense.Tax_Inclusive__c;
                    existingexp.Post_Date__c = updatedExpense.Post_Date__c;
                    existingexp.Total_Amount__c = updatedExpense.Sub_Total__c;
                    existingexp.Tax_Amount__c = updatedExpense.Tax_Amount__c;
                    existingexp.Tax__c = updatedExpense.Tax__c;
                    existingexp.Amount__c = updatedExpense.Amount__c;
                } 
                else if(existingexp.Accounting_Ledger_Items__r.Category__r.Name == 'Assets'){
                    existingexp.Entity_Profile__c = updatedExpense.Entity_Profile__c;
                    existingexp.Company__c = updatedExpense.Company__c;
                    existingexp.Description__c = updatedExpense.Description__c;
                    existingexp.Invoice_Date__c  =  updatedExpense.Invoice_Date__c;
                    existingexp.Entry_Type__c = updatedExpense.Entry_Type__c;
                    existingexp.Invoice_No__c = updatedExpense.Invoice_No__c;
                    existingexp.Tax_Inclusive__c = updatedExpense.Tax_Inclusive__c;
                    existingexp.Post_Date__c = updatedExpense.Post_Date__c;
                    existingexp.Total_Amount__c = updatedExpense.Amount__c;
                    existingexp.Tax__c = updatedExpense.Tax__c;
                    
                }
                else if(existingexp.Accounting_Ledger_Items__r.Category__r.Name == 'Liabilities'){
                    existingexp.Entity_Profile__c = updatedExpense.Entity_Profile__c;
                    existingexp.Company__c = updatedExpense.Company__c;
                    existingexp.Description__c = updatedExpense.Description__c;
                    existingexp.Invoice_Date__c  =  updatedExpense.Invoice_Date__c;
                    existingexp.Entry_Type__c = updatedExpense.Entry_Type__c;
                    existingexp.Invoice_No__c = updatedExpense.Invoice_No__c;
                    existingexp.Tax_Inclusive__c = updatedExpense.Tax_Inclusive__c;
                    existingexp.Post_Date__c = updatedExpense.Post_Date__c;
                    existingexp.Total_Amount__c = updatedExpense.Tax_Amount__c;
                    existingexp.Tax__c = updatedExpense.Tax__c;                   
                }
              }
            
            if (!existingExpenseList.isEmpty()) {
                update existingExpenseList;
            }
            
            return true;  // Return success status
        } catch (Exception e) {
            System.debug('Error while updating expense record: ' + e.getMessage());
            return false; // Return failure status if something goes wrong
        }
    }
    
    @AuraEnabled
    public static void updateInvoice( Accounting_Invoices_Expenses__c updatedInvoice, Accounting_Journal_Entry__c updatedInvoiceEntry) {
        system.debug('updatedInvoice===>'+updatedInvoice);
        system.debug('updatedInvoiceEntry===>'+updatedInvoiceEntry);
        try {
           
              Accounting_Invoices_Expenses__c  InvoiceData=[SELECT Id,Company__c,Name,Entity_Type__c,Include_GST__c,Invoice_Date__c,Invoice_No__c,
                                                            Post_Date__c,Staff__c,Status__c,Sub_Total__c,Total_Amount__c,GST__c FROM Accounting_Invoices_Expenses__c WHERE Id=:updatedInvoice.Id];
             
            List<Accounting_Journal_Entry__c> existingInvoiceList = [SELECT Id, Name, Entity_Profile__c, Description__c, Quantity__c, 
                                                            Unit_Price__c, Tax__c, Comments__c, Created_From_Expenses__c, 
                                                            Invoice_Date__c, Accounting_Ledger_Items__r.Name, Accounting_Invoices_Expenses__c, 
                                                            Accounting_Ledger_Items__r.Account_Number__c, Amount__c, 
                                                            Tax_Amount__c, Entry_Type__c, Entity_Profile__r.Name__c, 
                                                            Entity_Profile__r.First_Name__c, Entity_Profile__r.Last_Name__c,
                                                            Accounting_Ledger_Items__r.Category__c, Accounting_Ledger_Items__r.Category__r.Name
                                                            FROM Accounting_Journal_Entry__c];
               
        } catch (Exception e) {
            System.debug('Error while updating expense record: ' + e.getMessage());
           // return false; // Return failure status if something goes wrong
        }
   
	}
    
    @AuraEnabled
    public static Accounting_Invoices_Expenses__c saveIctInvoiceData( String salesEntryJson, String invoiceRowListJson, String amountEntryJson,Boolean ictInvoiceEntry) {
          Accounting_Invoices_Expenses__c invoiceRecord= new Accounting_Invoices_Expenses__c(); 
        try {
            // ✅ Convert JSON to a Map<String, Object> for salesEntry
            Map<String, Object> salesEntry = (Map<String, Object>) JSON.deserializeUntyped(salesEntryJson);
            Map<String, Object> amountEntry = (Map<String, Object>) JSON.deserializeUntyped(amountEntryJson);
            // ✅ Convert JSON to a List<Object>, then cast each item to Map<String, Object>
            List<Object> rawList = (List<Object>) JSON.deserializeUntyped(invoiceRowListJson);
            //List<Object> amountEntry = (List<Object>) JSON.deserializeUntyped(amountEntryJson);
            List<Map<String, Object>> invoiceRowList = new List<Map<String, Object>>();
            
            for (Object obj : rawList) {
                invoiceRowList.add((Map<String, Object>) obj);
            }
            // 🔹 Debugging (Remove in production)
            System.debug('Sales Entry: ' + salesEntry);
            System.debug('Sales Entry List: ' + invoiceRowList);
            System.debug('entityName : '+(String)salesEntry.get('entityName'));
             System.debug('ictInvoiceEntry: ' + ictInvoiceEntry);
            /*Boolean ictInvoiceEntry1;
                                                if(ictInvoiceEntry == true){
                                                    ictInvoiceEntry1 = true;
                                                } else {
                                                    ictInvoiceEntry1 = false;
                                                }*/
              invoiceRecord = new Accounting_Invoices_Expenses__c(
                                                                Include_GST__c = (String)salesEntry.get('selectOption'),  // Assuming Boolean
                                                                Invoice_Date__c = Date.valueOf((String)salesEntry.get('InvoiceDate')),
                                                                Invoice_No__c = (String)salesEntry.get('InvoiceNo'),
                                                                Start_Date__c = Date.valueOf((String)salesEntry.get('StartDate')),
                  												Issued_Date__c = Date.valueOf((String)salesEntry.get('dateIssued')),
                  												End_Date__c = Date.valueOf((String)salesEntry.get('EndDate')),
                                                                Status__c = (String)salesEntry.get('Status'),
                                                                Company__c = (String)salesEntry.get('company'),  // Assuming Lookup field  
                                                                Entity_Type__c = 'Invoice',
                                                                GST__c = (Decimal)amountEntry.get('taxAmount'),
                                                                Total_Amount__c = (Decimal)amountEntry.get('totalAmount'),
                                                                Sub_Total__c = (Decimal)amountEntry.get('subTotal'),
                  												Staff__c = (String)salesEntry.get('ictstaffid'),
                    											ICT_Invoice_Entry__c = ictInvoiceEntry
                 												//ICT_Approved_Hours__c = (String )salesEntry.get('AprovedHours'),
                  												//Invoice_Rate__c = (Decimal)salesEntry.get('InvoiceRate')
                                                            );
                                                            
                                                            // ✅ Insert the record into Salesforce
                                                            insert invoiceRecord;
                                                            String parentid =invoiceRecord.Id;
                                                            
                                                            //List<Accounting_Journal_Entry__c> journalEntries = new List<Accounting_Journal_Entry__c>();
                                                            List<Accounting_Ledger_Items__c> ledgerItems = [
                                                                SELECT Id, Name, Category__r.Name
                                                                FROM Accounting_Ledger_Items__c
                                                                WHERE Category__r.Name IN ('Income', 'Liabilities', 'Assets')
                                                                AND Category__r.Account_List__r.Company__c = :(String)salesEntry.get('company')
                                                            ];
            												System.debug('ledgerItems : '+ledgerItems);
                                                            
                                                            for (Map<String, Object> entry : invoiceRowList) {
                                                                // Extract tax percentage and calculate tax multiplier
                                                                String taxValueStr1 = String.valueOf(entry.get('selectedOptionTax')); // Convert to String
                                                                taxValueStr1 = taxValueStr1.replace('%', ''); // Remove '%'
                                                                //System.debug('taxAmount : '+Decimal.valueOf(String.valueOf(entry.get('selectedOptionTax'))));
                                                                Decimal taxPercentage = Decimal.valueOf(String.valueOf(taxValueStr1));                                                                system.debug('taxPercentage==>'+taxPercentage);
                                                                //Object taxValueObj = entry.get('taxvalue');
                                                                //String taxValueStr = String.valueOf(taxValueObj); // Convert to String
                                                                //taxValueStr = taxValueStr.replace('%', ''); // Remove '%'
                                                                Decimal taxValue = Decimal.valueOf(taxValueStr1); // Convert to Decimal // Convert to Decimal
                                                                Decimal taxMultiplier = 1 + (taxPercentage / 100);  // Example: If taxAmount = 10 → 1 + (10/100) = 1.1
                                                                
                                                                // Debug tax calculations
                                                                System.debug('Tax Percentage: ' + taxPercentage);
                                                                System.debug('Tax Multiplier (1 + Tax Percentage / 100): ' + taxMultiplier);
                                                                
                                                                // Calculate total with tax
                                                                // Decimal amount = Decimal.valueOf(String.valueOf(entry.get('Amount__c')));
                                                                Decimal unitPrice = Decimal.valueOf(String.valueOf(entry.get('UnitPrice__c')));
                                                                Decimal quantity = Decimal.valueOf(String.valueOf(entry.get('Quantity__c')));
                                                                Decimal subTotal = (unitPrice * quantity).setScale(2);
                                                                Decimal totalWithTax = subTotal / taxMultiplier;
                                                                Decimal taxAmount = (subTotal - totalWithTax).setScale(2);
                                                                Decimal totalAmount = (subTotal + taxAmount).setScale(2);
                                                                
                                                                // Debug calculations
                                                                System.debug('Unit Price: ' + unitPrice);
                                                                System.debug('Quantity: ' + quantity);
                                                                System.debug('Subtotal (Unit Price * Quantity): ' + subTotal);
                                                                System.debug('Total With Tax (Subtotal / Tax Multiplier): ' + totalWithTax);
                                                                System.debug('Tax Amount (Subtotal - Total With Tax): ' + taxAmount);
                                                                System.debug('Total Amount (Subtotal + Tax Amount): ' + totalAmount);
                                                                
                                                                
                                                                System.debug('ledgerItems: ' + ledgerItems);
                                                                
                                                                // Initialize variables to hold ledger items for specific categories
                                                                Accounting_Ledger_Items__c incomeLedger = null;
                                                                Accounting_Ledger_Items__c liabilityLedger = null;
                                                                Accounting_Ledger_Items__c assetsLedger = null;
                                                                
                                                                // Loop through ledger items and assign them to respective variables
                                                                for (Accounting_Ledger_Items__c item : ledgerItems) {
                                                                    //System.debug('Checking item: ' + item.Name);
                                                                    if (item.Category__r.Name == 'Income' && item.Id == entry.get('accountItemId')) {
                                                                        incomeLedger = item;
                                                                    } else if (item.Category__r.Name == 'Liabilities' && item.Name == 'GST Collected') {liabilityLedger = item;
                                                                    } else if (item.Category__r.Name == 'Assets' && item.Name == 'Trade Debtors') {assetsLedger = item;
                                                                    }
                                                                }
                                                                system.debug('incomeLedger'+ incomeLedger + 'liabilityLedger'+ liabilityLedger + 'assetsLedger'+assetsLedger );
                                                                
                                                                // Ensure that all required ledger items are found
                                                                if (incomeLedger != null && liabilityLedger != null && assetsLedger != null) {
                                                                    List<Accounting_Journal_Entry__c> journalEntries = new List<Accounting_Journal_Entry__c>();
                                                                    
                                                                    // Journal Entry for GST Collected (Liability category)
                                                                    if (taxAmount > 0) {
                                                                        journalEntries.add(new Accounting_Journal_Entry__c(
                                                                            Accounting_Invoices_Expenses__c = invoiceRecord.Id,
                                                                            Tax_Amount__c = 0,
                                                                            Total_Amount__c = taxAmount,
                                                                            Sub_Total__c = 0,
                                                                            Accounting_Ledger_Items__c = liabilityLedger.Id,
                                                                            Description__c = String.valueOf(entry.get('Description__c')),
                                                                            Company__c = (String)salesEntry.get('company'),
                                                                            Entry_Type__c='Sales',
                                                                            Entity_Profile__c=(String)salesEntry.get('entityName'), 
                                                                            // Sl_no__c=(decimal)entry.get('sno'),
                                                                            //Tax_Inclusive__c = taxInclusive,
                                                                            //Terms__c =terms,
                                                                            Invoice_Date__c = Date.valueof((String)salesEntry.get('InvoiceDate')),
                                                                           // Post_Date__c = Date.valueof((String)salesEntry.get('PostDate')),
                                                                            Invoice_No__c = (String)salesEntry.get('InvoiceNo'),
                                                                            Comments__c = (String)salesEntry.get('comments')
                                                                        ));
                                                                    }
                                                                    //System.debug('')
                                                                    // Journal Entry for Trade Debtors (Assets category)
                                                                    journalEntries.add(new Accounting_Journal_Entry__c(
                                                                        Accounting_Invoices_Expenses__c = invoiceRecord.Id,
                                                                        Tax_Amount__c = 0,
                                                                        Total_Amount__c = totalAmount,
                                                                        Sub_Total__c = 0,
                                                                        Accounting_Ledger_Items__c = assetsLedger.Id,
                                                                        Description__c = String.valueOf(entry.get('Description__c')),
                                                                        Company__c = (String)salesEntry.get('company'),
                                                                        Entry_Type__c='Sales',
                                                                        Entity_Profile__c=(String)salesEntry.get('entityName'),
                                                                        // Sl_no__c=(decimal)entry.get('sno'),
                                                                        //Tax_Inclusive__c = taxInclusive,
                                                                        //Terms__c =terms,
                                                                        Invoice_Date__c = Date.valueof((String)salesEntry.get('InvoiceDate')),
                                                                       // Post_Date__c = Date.valueof((String)salesEntry.get('PostDate')),
                                                                        Invoice_No__c = (String)salesEntry.get('InvoiceNo'),
                                                                        Comments__c = (String)salesEntry.get('comments')
                                                                    ));
                                                                     System.debug('ictInvoiceEntry NEW: ' + ictInvoiceEntry);
                                                                    // Journal Entry for Income (selectedItem from UI)
                                                                    journalEntries.add(new Accounting_Journal_Entry__c(
                                                                        Accounting_Invoices_Expenses__c = invoiceRecord.Id,
                                                                        Tax_Amount__c = 0,
                                                                        Total_Amount__c = subTotal,
                                                                        Sub_Total__c = 0,
                                                                        Accounting_Ledger_Items__c = incomeLedger.Id,
                                                                        Description__c = String.valueOf(entry.get('Description__c')),
                                                                        Company__c = (String)salesEntry.get('company'),
                                                                        Entry_Type__c='Sales',
                                                                        Entity_Profile__c=(String)salesEntry.get('entityName'),
                                                                        // Sl_no__c=(decimal)entry.get('sno'),
                                                                        //Tax_Inclusive__c = taxInclusive,
                                                                        //Terms__c =terms,
                                                                        Invoice_Date__c = Date.valueof((String)salesEntry.get('InvoiceDate')),
                                                                        //Post_Date__c = Date.valueof((String)salesEntry.get('PostDate')),
                                                                        Invoice_No__c = (String)salesEntry.get('InvoiceNo'),
                                                                        Comments__c = (String)salesEntry.get('comments'),
                                                                        Unit_Price__c = unitPrice,
                                                                        Quantity__c = quantity,
                                                                        ICT_Invoice_Entry__c = ictInvoiceEntry,
                                                                        Tax__c = taxValue                     
                                                                    ));
                                                                    
                                                                    // Insert the journal entries
                                                                    insert journalEntries;
                                                                    //system.debug(' sl no '+journalEntries[0].Sl_no__c);
                                                                    // system.debug(' sl no 1'+journalEntries[1].Sl_no__c);
                                                                     //system.debug(' sl no 2 '+journalEntries[2].Sl_no__c);
                                                                    System.debug('Journal Entries Created: ' + JSON.serialize(journalEntries));
                                                                    
                                                                    
                                                                    
                                                                    
                                                                } 
                                                            }
        } catch (Exception e) {
            System.debug('Error while updating expense record: ' + e.getMessage());
           // return false; // Return failure status if something goes wrong
        }
         return invoiceRecord;
    }
    
    @AuraEnabled
    public static List<Accounting_Journal_Entry__c> getIctInvoice(String sDate,String eDate ,Id companyId,Boolean ictInvoiceEntry) {
                                                        // Initialize a list to hold the result
        //List<Accounting_Invoices_Expenses__c> InvoiceData = new List<Accounting_Invoices_Expenses__c>();
        Date startDate=Date.valueOf(sDate);
        Date endDate=Date.valueOf(eDate);
        
            // If selectedId is provided, fetch the company with that specific ID
           List<Accounting_Journal_Entry__c> entry =[select Id,Tax_Amount__c,Total_Amount__c,Sub_Total__c,Accounting_Ledger_Items__c,
                                                     Description__c,Company__c,Entry_Type__c,Entity_Profile__c,Invoice_Date__c,Invoice_No__c,
                                                     Comments__c,Sl_no__c,Accounting_Ledger_Items__r.Account_Number__c, 
                                                     Accounting_Ledger_Items__r.Name,Unit_Price__c,Quantity__c,Tax__c,Entity_Profile__r.First_Name__c,Entity_Profile__r.Last_Name__c,
                                                     Entity_Profile__r.Name__c,Roaster_Invoice_Entry__c,Accounting_Invoices_Expenses__r.Roaster_Invoice_Entry__c,Accounting_Invoices_Expenses__r.Amazon_URL__c,Accounting_Invoices_Expenses__r.Start_Date__c,Accounting_Invoices_Expenses__r.End_Date__c,
                                                     Accounting_Ledger_Items__r.Category__r.Name,Accounting_Invoices_Expenses__r.Id,Accounting_Invoices_Expenses__r.Name ,
                                                     Accounting_Invoices_Expenses__r.Issued_Date__c ,Accounting_Invoices_Expenses__r.GST__c,
                                                     Accounting_Invoices_Expenses__r.Total_Amount__c
                                                  	from Accounting_Journal_Entry__c
                                                  	where Accounting_Invoices_Expenses__r.ICT_Invoice_Entry__c=:ictInvoiceEntry 
                                                  	and Accounting_Ledger_Items__r.Category__r.Name IN ('Income')
                                                  	and Company__c = :companyId and Accounting_Invoices_Expenses__r.Start_Date__c >=:startDate and
                                                   Accounting_Invoices_Expenses__r.End_Date__c <=: endDate 
                                                     ];//ORDER BY Accounting_Invoices_Expenses__r.Issued_Date__c DESC
        
        system.debug('entry===>'+JSON.serialize(entry));
        return entry;
  
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Accounting_Journal_Entry__c> getRMInvoice(String sDate,String eDate ,Id companyId,Boolean rmInvoiceEntry) {
                                                        // Initialize a list to hold the result
       // List<Accounting_Invoices_Expenses__c> InvoiceData = new List<Accounting_Invoices_Expenses__c>();
        /*String currentUserId = UserInfo.getUserId();
        User currentUser = [SELECT Id, Organization_Name__c FROM User WHERE Id = :currentUserId LIMIT 1];
        List<Accounting_Ledger_Items__c> ledgerItems = [ SELECT Id, Name, Account_Number__c, Category__r.Name
                      									 FROM Accounting_Ledger_Items__c WHERE Category__r.Account_List__r.Company__r.Organization__r.Name = :currentUser.Organization_Name__c
               											 AND Category__r.Account_List__r.Company__c = :companyId AND Category__r.Name IN ('Income')];*/
        Date startDate=Date.valueOf(sDate);
        Date endDate=Date.valueOf(eDate);
        System.debug('rmInvoiceEntry getRMInvoice: ' + rmInvoiceEntry);
        List<Accounting_Journal_Entry__c> entry =[select Id,Tax_Amount__c,Total_Amount__c,Sub_Total__c,Accounting_Ledger_Items__c,Description__c,Company__c,
                                                 Entry_Type__c,Entity_Profile__c,Invoice_Date__c,Invoice_No__c,Comments__c,Sl_no__c,Accounting_Ledger_Items__r.Account_Number__c,
                                                  Accounting_Ledger_Items__r.Name,Unit_Price__c,Quantity__c,Tax__c,Entity_Profile__r.First_Name__c,Entity_Profile__r.Last_Name__c,
                                                  Entity_Profile__r.Name__c,Roaster_Invoice_Entry__c,Accounting_Invoices_Expenses__r.Roaster_Invoice_Entry__c,Accounting_Invoices_Expenses__r.Amazon_URL__c,Accounting_Invoices_Expenses__r.Start_Date__c,Accounting_Invoices_Expenses__r.End_Date__c,
                                                  Accounting_Ledger_Items__r.Category__r.Name,Accounting_Invoices_Expenses__r.Id,Accounting_Invoices_Expenses__r.Name ,
                                                  Accounting_Invoices_Expenses__r.Issued_Date__c ,Accounting_Invoices_Expenses__r.GST__c,Accounting_Invoices_Expenses__r.Total_Amount__c
                                                  from Accounting_Journal_Entry__c
                                                  where Accounting_Invoices_Expenses__r.Roaster_Invoice_Entry__c=:rmInvoiceEntry 
                                                  and Accounting_Ledger_Items__r.Category__r.Name IN ('Income')
                                                  and Company__c = :companyId  AND  Accounting_Invoices_Expenses__r.Start_Date__c >=:startDate and
                                                   Accounting_Invoices_Expenses__r.End_Date__c <=: endDate 
                                                  ];//ORDER BY Accounting_Invoices_Expenses__r.Issued_Date__c DESC
        
        system.debug('entry===>'+JSON.serialize(entry));
        
        return entry;
    }
    
    @AuraEnabled
    public static Accounting_Invoices_Expenses__c saveRMInvoiceData( String salesEntryJson, String invoiceRowListJson, String amountEntryJson,Boolean rmInvoiceEntry) {
          Accounting_Invoices_Expenses__c invoiceRecord= new Accounting_Invoices_Expenses__c(); 
        try {
            // ✅ Convert JSON to a Map<String, Object> for salesEntry
            Map<String, Object> salesEntry = (Map<String, Object>) JSON.deserializeUntyped(salesEntryJson);
            Map<String, Object> amountEntry = (Map<String, Object>) JSON.deserializeUntyped(amountEntryJson);
            // ✅ Convert JSON to a List<Object>, then cast each item to Map<String, Object>
            List<Object> rawList = (List<Object>) JSON.deserializeUntyped(invoiceRowListJson);
            //List<Object> amountEntry = (List<Object>) JSON.deserializeUntyped(amountEntryJson);
            List<Map<String, Object>> invoiceRowList = new List<Map<String, Object>>();
            
            for (Object obj : rawList) {
                invoiceRowList.add((Map<String, Object>) obj);
            }
            // 🔹 Debugging (Remove in production)
            System.debug('Sales Entry: ' + salesEntry);
            System.debug('Sales Entry List: ' + invoiceRowList);
            System.debug('entityName : '+(String)salesEntry.get('entityName'));
             System.debug('rmInvoiceEntry: ' + rmInvoiceEntry);
            /*Boolean ictInvoiceEntry1;
                                                if(ictInvoiceEntry == true){
                                                    ictInvoiceEntry1 = true;
                                                } else {
                                                    ictInvoiceEntry1 = false;
                                                }*/
              invoiceRecord = new Accounting_Invoices_Expenses__c(
                                                                Include_GST__c = (String)salesEntry.get('selectOption'),  // Assuming Boolean
                                                                Invoice_Date__c = Date.valueOf((String)salesEntry.get('InvoiceDate')),
                                                                Invoice_No__c = (String)salesEntry.get('InvoiceNo'),
                                                                Start_Date__c = Date.valueOf((String)salesEntry.get('StartDate')),
                  												Issued_Date__c = Date.valueOf((String)salesEntry.get('dateIssued')),
                  												End_Date__c = Date.valueOf((String)salesEntry.get('EndDate')),
                                                                Status__c = (String)salesEntry.get('Status'),
                                                                Company__c = (String)salesEntry.get('company'),  // Assuming Lookup field  
                                                                Entity_Type__c = 'Invoice',
                                                                GST__c = (Decimal)amountEntry.get('taxAmount'),
                                                                Total_Amount__c = (Decimal)amountEntry.get('totalAmount'),
                                                                Sub_Total__c = (Decimal)amountEntry.get('subTotal'),
                  												Staff__c = (String)salesEntry.get('ictstaffid'),
                     											Roaster_Invoice_Entry__c = rmInvoiceEntry
                  
                 												//ICT_Approved_Hours__c = (String )salesEntry.get('AprovedHours'),
                  												//Invoice_Rate__c = (Decimal)salesEntry.get('InvoiceRate')
                                                            );
                                                            
                                                            // ✅ Insert the record into Salesforce
                                                            insert invoiceRecord;
                                                            String parentid =invoiceRecord.Id;
                                                            
                                                            //List<Accounting_Journal_Entry__c> journalEntries = new List<Accounting_Journal_Entry__c>();
                                                            List<Accounting_Ledger_Items__c> ledgerItems = [
                                                                SELECT Id, Name, Category__r.Name
                                                                FROM Accounting_Ledger_Items__c
                                                                WHERE Category__r.Name IN ('Income', 'Liabilities', 'Assets')
                                                                AND Category__r.Account_List__r.Company__c = :(String)salesEntry.get('company')
                                                            ];
            												System.debug('ledgerItems : '+ledgerItems);
                                                            
                                                            for (Map<String, Object> entry : invoiceRowList) {
                                                                // Extract tax percentage and calculate tax multiplier
                                                                String taxValueStr1 = String.valueOf(entry.get('selectedOptionTax')); // Convert to String
                                                                taxValueStr1 = taxValueStr1.replace('%', ''); // Remove '%'
                                                                //System.debug('taxAmount : '+Decimal.valueOf(String.valueOf(entry.get('selectedOptionTax'))));
                                                                Decimal taxPercentage = Decimal.valueOf(String.valueOf(taxValueStr1));                                                                system.debug('taxPercentage==>'+taxPercentage);
                                                                //Object taxValueObj = entry.get('taxvalue');
                                                                //String taxValueStr = String.valueOf(taxValueObj); // Convert to String
                                                                //taxValueStr = taxValueStr.replace('%', ''); // Remove '%'
                                                                Decimal taxValue = Decimal.valueOf(taxValueStr1); // Convert to Decimal // Convert to Decimal
                                                                Decimal taxMultiplier = 1 + (taxPercentage / 100);  // Example: If taxAmount = 10 → 1 + (10/100) = 1.1
                                                                
                                                                // Debug tax calculations
                                                                System.debug('Tax Percentage: ' + taxPercentage);
                                                                System.debug('Tax Multiplier (1 + Tax Percentage / 100): ' + taxMultiplier);
                                                                
                                                                // Calculate total with tax
                                                                // Decimal amount = Decimal.valueOf(String.valueOf(entry.get('Amount__c')));
                                                                Decimal unitPrice = Decimal.valueOf(String.valueOf(entry.get('UnitPrice__c')));
                                                                Decimal quantity = Decimal.valueOf(String.valueOf(entry.get('Quantity__c')));
                                                                Decimal subTotal = (unitPrice * quantity).setScale(2);
                                                                Decimal totalWithTax = subTotal / taxMultiplier;
                                                                Decimal taxAmount = (subTotal - totalWithTax).setScale(2);
                                                                Decimal totalAmount = (subTotal + taxAmount).setScale(2);
                                                                
                                                                // Debug calculations
                                                                System.debug('Unit Price: ' + unitPrice);
                                                                System.debug('Quantity: ' + quantity);
                                                                System.debug('Subtotal (Unit Price * Quantity): ' + subTotal);
                                                                System.debug('Total With Tax (Subtotal / Tax Multiplier): ' + totalWithTax);
                                                                System.debug('Tax Amount (Subtotal - Total With Tax): ' + taxAmount);
                                                                System.debug('Total Amount (Subtotal + Tax Amount): ' + totalAmount);
                                                                
                                                                
                                                                System.debug('ledgerItems: ' + ledgerItems);
                                                                
                                                                // Initialize variables to hold ledger items for specific categories
                                                                Accounting_Ledger_Items__c incomeLedger = null;
                                                                Accounting_Ledger_Items__c liabilityLedger = null;
                                                                Accounting_Ledger_Items__c assetsLedger = null;
                                                                
                                                                // Loop through ledger items and assign them to respective variables
                                                                for (Accounting_Ledger_Items__c item : ledgerItems) {
                                                                    //System.debug('Checking item: ' + item.Name);
                                                                    if (item.Category__r.Name == 'Income' && item.Id == entry.get('accountItemId')) {
                                                                        incomeLedger = item;
                                                                    } else if (item.Category__r.Name == 'Liabilities' && item.Name == 'GST Collected') {
                                                                        liabilityLedger = item;
                                                                    } else if (item.Category__r.Name == 'Assets' && item.Name == 'Trade Debtors') {
                                                                        assetsLedger = item;
                                                                    }
                                                                }
                                                                system.debug('incomeLedger'+ incomeLedger + 'liabilityLedger'+ liabilityLedger + 'assetsLedger'+assetsLedger );
                                                                
                                                                // Ensure that all required ledger items are found
                                                                if (incomeLedger != null && liabilityLedger != null && assetsLedger != null) {
                                                                    List<Accounting_Journal_Entry__c> journalEntries = new List<Accounting_Journal_Entry__c>();
                                                                    
                                                                    // Journal Entry for GST Collected (Liability category)
                                                                    if (taxAmount > 0) {
                                                                        journalEntries.add(new Accounting_Journal_Entry__c(
                                                                            Accounting_Invoices_Expenses__c = invoiceRecord.Id,
                                                                            Tax_Amount__c = 0,
                                                                            Total_Amount__c = taxAmount,
                                                                            Sub_Total__c = 0,
                                                                            Accounting_Ledger_Items__c = liabilityLedger.Id,
                                                                            Description__c = String.valueOf(entry.get('Description__c')),
                                                                            Company__c = (String)salesEntry.get('company'),
                                                                            Entry_Type__c='Sales',
                                                                            Entity_Profile__c=(String)salesEntry.get('entityName'), 
                                                                            // Sl_no__c=(decimal)entry.get('sno'),
                                                                            //Tax_Inclusive__c = taxInclusive,
                                                                            //Terms__c =terms,
                                                                            Invoice_Date__c = Date.valueof((String)salesEntry.get('InvoiceDate')),
                                                                           // Post_Date__c = Date.valueof((String)salesEntry.get('PostDate')),
                                                                            Invoice_No__c = (String)salesEntry.get('InvoiceNo'),
                                                                            Comments__c = (String)salesEntry.get('comments')
                                                                        ));
                                                                    }
                                                                    //System.debug('')
                                                                    // Journal Entry for Trade Debtors (Assets category)
                                                                    journalEntries.add(new Accounting_Journal_Entry__c(
                                                                        Accounting_Invoices_Expenses__c = invoiceRecord.Id,
                                                                        Tax_Amount__c = 0,
                                                                        Total_Amount__c = totalAmount,
                                                                        Sub_Total__c = 0,
                                                                        Accounting_Ledger_Items__c = assetsLedger.Id,
                                                                        Description__c = String.valueOf(entry.get('Description__c')),
                                                                        Company__c = (String)salesEntry.get('company'),
                                                                        Entry_Type__c='Sales',
                                                                        Entity_Profile__c=(String)salesEntry.get('entityName'),
                                                                        // Sl_no__c=(decimal)entry.get('sno'),
                                                                        //Tax_Inclusive__c = taxInclusive,
                                                                        //Terms__c =terms,
                                                                        Invoice_Date__c = Date.valueof((String)salesEntry.get('InvoiceDate')),
                                                                       // Post_Date__c = Date.valueof((String)salesEntry.get('PostDate')),
                                                                        Invoice_No__c = (String)salesEntry.get('InvoiceNo'),
                                                                        Comments__c = (String)salesEntry.get('comments')
                                                                    ));
                                                                     System.debug('rmInvoiceEntry NEW: ' + rmInvoiceEntry);
                                                                    // Journal Entry for Income (selectedItem from UI)
                                                                    journalEntries.add(new Accounting_Journal_Entry__c(
                                                                        Accounting_Invoices_Expenses__c = invoiceRecord.Id,
                                                                        Tax_Amount__c = 0,
                                                                        Total_Amount__c = subTotal,
                                                                        Sub_Total__c = 0,
                                                                        Accounting_Ledger_Items__c = incomeLedger.Id,
                                                                        Description__c = String.valueOf(entry.get('Description__c')),
                                                                        Company__c = (String)salesEntry.get('company'),
                                                                        Entry_Type__c='Sales',
                                                                        Entity_Profile__c=(String)salesEntry.get('entityName'),
                                                                        // Sl_no__c=(decimal)entry.get('sno'),
                                                                        //Tax_Inclusive__c = taxInclusive,
                                                                        //Terms__c =terms,
                                                                        Invoice_Date__c = Date.valueof((String)salesEntry.get('InvoiceDate')),
                                                                        //Post_Date__c = Date.valueof((String)salesEntry.get('PostDate')),
                                                                        Invoice_No__c = (String)salesEntry.get('InvoiceNo'),
                                                                        Comments__c = (String)salesEntry.get('comments'),
                                                                        Unit_Price__c = unitPrice,
                                                                        Quantity__c = quantity,
                                                                        Roaster_Invoice_Entry__c = rmInvoiceEntry,
                                                                        Tax__c = taxValue                     
                                                                    ));
                                                                    
                                                                    // Insert the journal entries
                                                                    insert journalEntries;
                                                                    //system.debug(' sl no '+journalEntries[0].Sl_no__c);
                                                                    // system.debug(' sl no 1'+journalEntries[1].Sl_no__c);
                                                                     //system.debug(' sl no 2 '+journalEntries[2].Sl_no__c);
                                                                    System.debug('Journal Entries Created: ' + JSON.serialize(journalEntries));
                                                                   
                                                                } 
                                                            }
        } catch (Exception e) {
            System.debug('Error while updating expense record: ' + e.getMessage());
           // return false; // Return failure status if something goes wrong
        }
         return invoiceRecord;
    }
  
     @AuraEnabled
    public static void deleteExpenseRecord(Id expenseId) {
        try {
            if (expenseId != null) {
                // Get parent invoice ID from the journal entry
                Accounting_Journal_Entry__c journalEntry = [
                    SELECT Accounting_Invoices_Expenses__c 
                    FROM Accounting_Journal_Entry__c 
                    WHERE Id = :expenseId 
                    LIMIT 1
                ];
    
                Id parentInvoiceId = journalEntry.Accounting_Invoices_Expenses__c;
    
                if (parentInvoiceId != null) {
                    // Delete all journal entries under the same invoice
                    List<Accounting_Journal_Entry__c> allEntries = [
                        SELECT Id 
                        FROM Accounting_Journal_Entry__c 
                        WHERE Accounting_Invoices_Expenses__c = :parentInvoiceId
                    ];
                    delete allEntries;
    
                    // Delete the parent invoice
                    Accounting_Invoices_Expenses__c invoiceToDelete = [
                        SELECT Id 
                        FROM Accounting_Invoices_Expenses__c 
                        WHERE Id = :parentInvoiceId 
                        LIMIT 1
                    ];
                    delete invoiceToDelete;
                }
            }
        } catch (Exception e) {
            throw new AuraHandledException('Error deleting related records: ' + e.getMessage());
        }
    }
}