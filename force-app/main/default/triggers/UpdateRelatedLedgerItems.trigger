trigger UpdateRelatedLedgerItems on Accounting_Journal_Entry__c (after insert, after update, after delete, after undelete) {
    // For after insert, update, undelete → use Trigger.new
    if (Trigger.isAfter && (Trigger.isInsert || Trigger.isUpdate || Trigger.isUndelete)) {
        AccountingJournalEntryHandler.updateRelatedLedgerItems(Trigger.new);
    }

    // For after delete → use Trigger.old
    if (Trigger.isAfter && Trigger.isDelete) {
        AccountingJournalEntryHandler.updateRelatedLedgerItems(Trigger.old);
    }
    
    if (Trigger.isAfter && (Trigger.isUpdate || Trigger.isInsert)) {
        AccountingJournalEntryHandler.updateRelatedRecords(Trigger.new);
    } 
}