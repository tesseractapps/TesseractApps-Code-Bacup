trigger JournalEntryTrigger on Accounting_Journal_Entry__c (after update,after Insert) {
    
    if (Trigger.isAfter && (Trigger.isUpdate || Trigger.isInsert)) {
        AccountingJournalEntryHandler.updateRelatedRecords(Trigger.new);
    }
}