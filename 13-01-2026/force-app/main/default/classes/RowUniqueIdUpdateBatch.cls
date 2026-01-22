public class RowUniqueIdUpdateBatch implements Database.Batchable<SObject>, Database.Stateful {
    
	public Database.QueryLocator start(Database.BatchableContext BC) {
        
         return Database.getQueryLocator([
            SELECT Id, Name,Due_Date__c,Is_Payroll_Sales__c, Is_Payroll_Purchases__c, Is_RFQ__c, Is_Service_Invoice__c,Invoice_No__c, 
            (SELECT Id, Name,Row_Unique_ID__c ,Sl_no__c,Accounting_Invoices_Expenses__c FROM  Accounting_Journal_Entry__r WHERE Sl_no__c != null AND Row_Unique_ID__c= null  )  
             FROM Accounting_Invoices_Expenses__c WHERE Is_Payroll_Sales__c= true OR Is_Payroll_Purchases__c = true OR Is_RFQ__c =true 
             OR Is_Service_Invoice__c = true 
        ]);
    }
    
    // Executes in chunks
    public void execute(Database.BatchableContext BC, List<SObject> scope) {
        Map<String, String> invoiceSlnoToUniqueId  = new Map<String, String>();
        List<Accounting_Journal_Entry__c> entriesToUpdate = new List<Accounting_Journal_Entry__c>();
		List<Accounting_Invoices_Expenses__c> invoicesToUpdate = new List<Accounting_Invoices_Expenses__c>();
        
        for (Accounting_Invoices_Expenses__c invoice : (List<Accounting_Invoices_Expenses__c>) scope) {
           // if (invoice.Accounting_Journal_Entry__r == null) continue;
    		System.debug('Invoice Id in start method: ' + invoice.Id);
            if (String.isBlank(invoice.Invoice_No__c)) {
                invoice.Invoice_No__c = invoice.Name;
                invoicesToUpdate.add(invoice);
                System.debug('📝 Updated Invoice_No__c to Name: ' + invoice.Name + ' for Invoice Id: ' + invoice.Id);
            }
            
            for (Accounting_Journal_Entry__c entry : invoice.Accounting_Journal_Entry__r) {
                // Only process if Sl_no__c has a value and Row_Unique_ID__c is still empty
                if (entry.Sl_no__c == null || entry.Row_Unique_ID__c != null) continue;
    
                String slno = String.valueOf(entry.Sl_no__c);
    			String compositeKey = invoice.Id + '-' + slno;
                
                if (!invoiceSlnoToUniqueId.containsKey(compositeKey)) {
                    // Generate a pseudo-unique ID per Sl_no__c group
                   // String uniqueId = 'UID-' + String.valueOf(Crypto.getRandomLong()) + '-' + DateTime.now().getTime();
                    //String uniqueId = String.valueOf(DateTime.now().getTime());
                    String uniqueId = String.valueOf(Math.abs(Crypto.getRandomInteger()));
                    invoiceSlnoToUniqueId.put(compositeKey, uniqueId);
                }
    
                entry.Row_Unique_ID__c = invoiceSlnoToUniqueId.get(compositeKey);
                System.debug('entry new Row_Unique_ID__c in start method: ' +  entry.Row_Unique_ID__c);
                entriesToUpdate.add(entry);
                System.debug('Updated Entry: InvoiceId=' + invoice.Id + 
                         ', Sl_no__c=' + slno + 
                         ', Row_Unique_ID__c=' + entry.Row_Unique_ID__c);
                System.debug(' journal entriesToUpdate. in batch' + entriesToUpdate);
            }
        }
    
        if (!entriesToUpdate.isEmpty()) {
            update entriesToUpdate;
            System.debug('✅ Updated ' + entriesToUpdate.size() + ' journal entries. in batch');
        }
         if (!invoicesToUpdate.isEmpty()) {
            update invoicesToUpdate;
            System.debug('✅ Updated ' + invoicesToUpdate.size() + ' invoices with missing Invoice_No__c.');
        }
    }
    
    
    // Final logic after the batch finishes
    public void finish(Database.BatchableContext BC) {
        System.debug('Batch processing completed.');
    }
}