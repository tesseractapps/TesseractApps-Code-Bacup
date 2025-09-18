trigger AccountingInvoiceExpense on Accounting_Invoices_Expenses__c (before delete,after update) {
    if(Trigger.isbefore && Trigger.isDelete){
        Set<Id> parentIds = new Set<Id>();
        
        for (Accounting_Invoices_Expenses__c invoice : Trigger.old) {
            parentIds.add(invoice.Id);
        }
        
        // Query for the child records (Accounting_Invoices_Expenses__c) related to the parent records
        List<Accounting_Journal_Entry__c> childRecords = [SELECT Id FROM Accounting_Journal_Entry__c WHERE Accounting_Invoices_Expenses__c IN :parentIds];
        
        // Delete the child records
        delete childRecords;
    }
    if(Trigger.isAfter && Trigger.isupdate){ 
        RosterInvoicesHandler.updateChildServices(Trigger.new,Trigger.oldMap);
    }
	
}