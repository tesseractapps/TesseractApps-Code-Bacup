trigger UpdateLedgerItemsTotal on Accounting_Journal_Entry__c (after insert, after update, after delete, after undelete) {
    Set<Id> ledgerItemIds = new Set<Id>();

    if (Trigger.isInsert || Trigger.isUpdate || Trigger.isUndelete) {
        for (Accounting_Journal_Entry__c entry : Trigger.new) {
            if (entry.Accounting_Ledger_Items__c != null) {
                ledgerItemIds.add(entry.Accounting_Ledger_Items__c);
                System.debug('🔍 Found Ledger Item (from new): ' + entry.Accounting_Ledger_Items__c);
            }
        }
    }

    if (Trigger.isDelete) {
        for (Accounting_Journal_Entry__c entry : Trigger.old) {
            if (entry.Accounting_Ledger_Items__c != null) {
                ledgerItemIds.add(entry.Accounting_Ledger_Items__c);
                System.debug('🔍 Found Ledger Item (from old): ' + entry.Accounting_Ledger_Items__c);
            }
        }
    }
	System.debug('🧾 Total unique Ledger Item IDs collected: ' + ledgerItemIds);
    if (!ledgerItemIds.isEmpty()) {
        Map<Id, Decimal> ledgerTotals = new Map<Id, Decimal>();

        AggregateResult[] results = [
            SELECT Accounting_Ledger_Items__c, SUM(Total_Amount__c) totalAmount
            FROM Accounting_Journal_Entry__c
            WHERE Accounting_Ledger_Items__c IN :ledgerItemIds
            GROUP BY Accounting_Ledger_Items__c
        ];
		System.debug('📊 Aggregated results count: ' + results.size());
        for (AggregateResult ar : results) {
            ledgerTotals.put((Id) ar.get('Accounting_Ledger_Items__c'), (Decimal) ar.get('totalAmount'));
        }

        List<Accounting_Ledger_Items__c> ledgerItemsToUpdate = new List<Accounting_Ledger_Items__c>();
        for (Id ledgerItemId : ledgerItemIds) {
            ledgerItemsToUpdate.add(new Accounting_Ledger_Items__c(
                Id = ledgerItemId,
                Amount__c = ledgerTotals.get(ledgerItemId) != null ? ledgerTotals.get(ledgerItemId) : 0
            ));
             System.debug('📦 Preparing Ledger Item for update: ' + ledgerItemId );
        }

        if (!ledgerItemsToUpdate.isEmpty()) {
            update ledgerItemsToUpdate;
            System.debug('🚀 Updated Ledger Items count: ' + ledgerItemsToUpdate.size());
        }
    }
    
    
    if (Trigger.isAfter && (Trigger.isUpdate || Trigger.isInsert)) {
        AccountingJournalEntryHandler.updateRelatedRecords(Trigger.new);
    }

}