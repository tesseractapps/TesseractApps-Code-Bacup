public class AccountingJournalEntryHandler {
    public static void updateRelatedRecords(List<Accounting_Journal_Entry__c> updatedEntries) {
        System.debug('--- Starting updateRelatedRecords method ---');
        system.debug('updatedEntries==>'+updatedEntries);
        Set<Id> entryIds = new Set<Id>();
        for (Accounting_Journal_Entry__c entry : updatedEntries) {
            if (entry.Id != null) {
                entryIds.add(entry.Id);
            }
        }
        system.debug('entryIds==>'+entryIds);

        // Query enriched source entries
        List<Accounting_Journal_Entry__c> enrichedEntries = [
            SELECT Id,
                   Sl_no__c,
                   Accounting_Invoices_Expenses__c,
                   Accounting_Ledger_Items__r.Category__r.Name,
                   Amount__c,
                   Tax__c,
                   Unit_Price__c,
                   Quantity__c,
                   Description__c,
                   Company__c,
                   Entity_Profile__c,
                   Invoice_Date__c,
                   Post_Date__c,
                   Invoice_No__c,
                   Comments__c
            FROM Accounting_Journal_Entry__c
            WHERE Id IN :entryIds
        ];
        system.debug('enrichedEntries==>'+enrichedEntries);
        Map<String, Accounting_Journal_Entry__c> invoiceSlNoKeyToEntryMap = new Map<String, Accounting_Journal_Entry__c>();
        Set<Id> triggeredEntryIds = new Set<Id>();
        Set<Id> invoiceIds = new Set<Id>();
        Set<Decimal> slNos = new Set<Decimal>();

        for (Accounting_Journal_Entry__c entry : enrichedEntries) {
            System.debug('Entry Id: ' + entry.Id + 
                 ' | Ledger Item: ' + entry.Accounting_Ledger_Items__r +
                 ' | Category: ' + (entry.Accounting_Ledger_Items__r != null ? entry.Accounting_Ledger_Items__r.Category__r : null) +
                 ' | Category Name: ' + (entry.Accounting_Ledger_Items__r != null && entry.Accounting_Ledger_Items__r.Category__r != null ? entry.Accounting_Ledger_Items__r.Category__r.Name : null) +
                 ' | Invoice: ' + entry.Accounting_Invoices_Expenses__c +
                 ' | Sl No: ' + entry.Sl_no__c);
            
            system.debug('Accounting_Ledger_Items__r >>'+ entry.Accounting_Ledger_Items__r);
            system.debug('Accounting_Ledger_Items__r >>'+ entry.Accounting_Ledger_Items__r.Category__r);
            system.debug('Accounting_Ledger_Items__r >>'+ entry.Accounting_Ledger_Items__r.Category__r.Name);
            if (entry.Accounting_Ledger_Items__r != null &&
                entry.Accounting_Ledger_Items__r.Category__r != null &&
                entry.Accounting_Ledger_Items__r.Category__r.Name == 'Income' &&
                entry.Accounting_Invoices_Expenses__c != null &&
                entry.Sl_no__c != null) {
                    
                String key = entry.Accounting_Invoices_Expenses__c + '-' + entry.Sl_no__c;
                invoiceSlNoKeyToEntryMap.put(key, entry);
                triggeredEntryIds.add(entry.Id);
                invoiceIds.add(entry.Accounting_Invoices_Expenses__c);
                slNos.add(entry.Sl_no__c);
            }
        }

        if (invoiceSlNoKeyToEntryMap.isEmpty()) {
            System.debug('No valid entries to process. Exiting method.');
            return;
        }
        
        Id companyId;
        for (Accounting_Journal_Entry__c e : enrichedEntries) {
            if (e.Company__c != null) {
                companyId = e.Company__c;
                break;
            }
        }

        if (companyId == null) {
            System.debug('❌ No Company__c found. Skipping ledger item query.');
            return;
        }

        // Query existing related journal entries
        List<Accounting_Journal_Entry__c> relatedJournalEntries = [
            SELECT Id,
                   Sl_no__c,
                   Accounting_Invoices_Expenses__c,
                   Accounting_Ledger_Items__r.Category__r.Name,
                   Amount__c,
                   Tax__c,
                   Unit_Price__c,
                   Quantity__c,
                   Description__c,
                   Company__c,
                   Entity_Profile__c,
                   Invoice_Date__c,
                   Post_Date__c,
                   Invoice_No__c,
                   Comments__c
            FROM Accounting_Journal_Entry__c
            WHERE Accounting_Invoices_Expenses__c IN :invoiceIds
            AND Sl_no__c IN :slNos
            AND Id NOT IN :triggeredEntryIds
        ];

        // Organize existing by key and category
        Map<String, Map<String, Accounting_Journal_Entry__c>> relatedByKeyAndCategory = new Map<String, Map<String, Accounting_Journal_Entry__c>>();
        for (Accounting_Journal_Entry__c related : relatedJournalEntries) {
            String key = related.Accounting_Invoices_Expenses__c + '-' + related.Sl_no__c;
            String category = related.Accounting_Ledger_Items__r.Category__r.Name;
            if (!relatedByKeyAndCategory.containsKey(key)) {
                relatedByKeyAndCategory.put(key, new Map<String, Accounting_Journal_Entry__c>());
            }
            relatedByKeyAndCategory.get(key).put(category, related);
        }

        List<Accounting_Journal_Entry__c> entriesToUpdate = new List<Accounting_Journal_Entry__c>();
        List<Accounting_Journal_Entry__c> entriesToInsert = new List<Accounting_Journal_Entry__c>();

        for (String key : invoiceSlNoKeyToEntryMap.keySet()) {
            Accounting_Journal_Entry__c source = invoiceSlNoKeyToEntryMap.get(key);
            Map<String, Accounting_Journal_Entry__c> existingCategories = relatedByKeyAndCategory.get(key);

            Decimal unitPrice = source.Unit_Price__c;
            Decimal quantity = source.Quantity__c;
            Decimal subTotal = (unitPrice * quantity).setScale(2);
            Decimal taxValue = Decimal.valueOf(String.valueOf(source.Tax__c).replace('%', ''));
            Decimal taxMultiplier = 1 + (taxValue / 100);
            Decimal totalWithTax = subTotal / taxMultiplier;
            Decimal taxAmount = (subTotal - totalWithTax).setScale(2);
            Decimal totalAmount = (subTotal + taxAmount).setScale(2);
            
            List<Accounting_Ledger_Items__c> ledgerItems = [
                SELECT Id, Name, Category__r.Name
                FROM Accounting_Ledger_Items__c
                WHERE Category__r.Name IN ( 'Liabilities', 'Assets')
                AND Category__r.Account_List__r.Company__c = :companyId
            ];
            
                Accounting_Ledger_Items__c liabilityLedger = null;
                Accounting_Ledger_Items__c assetsLedger = null;
            
            for (Accounting_Ledger_Items__c item : ledgerItems) {
                    //System.debug('Checking item: ' + item.Name);
                    if (item.Category__r.Name == 'Liabilities' && item.Name == 'GST Collected') {
                        liabilityLedger = item;
                    } else if (item.Category__r.Name == 'Assets' && item.Name == 'Trade Debtors') {
                        assetsLedger = item;
                    }
                }
            
            

            for (String category : new List<String>{'Liabilities', 'Assets'}) {
                Accounting_Journal_Entry__c entry;
                Boolean isExisting = existingCategories != null && existingCategories.containsKey(category);
                if (isExisting) {
                    entry = existingCategories.get(category);
                } else {
                    entry = new Accounting_Journal_Entry__c();
                    entry.Accounting_Invoices_Expenses__c = source.Accounting_Invoices_Expenses__c;
                }

                // Common field mapping
                entry.Description__c = source.Description__c;
                entry.Company__c = source.Company__c;
                entry.Entry_Type__c = 'Sales';
                entry.Entity_Profile__c = source.Entity_Profile__c;
                entry.Sl_no__c = source.Sl_no__c;
                entry.Invoice_Date__c = source.Invoice_Date__c;
                entry.Post_Date__c = source.Post_Date__c;
                entry.Invoice_No__c = source.Invoice_No__c;
                entry.Comments__c = source.Comments__c;

                if (category == 'Liabilities') {
                    entry.Tax_Amount__c = 0;
                    entry.Sub_Total__c = 0;
                    entry.Total_Amount__c = taxAmount;
                    entry.Accounting_Ledger_Items__c = liabilityLedger.Id;
                } else if (category == 'Assets') {
                    entry.Tax_Amount__c = 0;
                    entry.Sub_Total__c = 0;
                    entry.Total_Amount__c = totalAmount;
                    entry.Accounting_Ledger_Items__c = assetsLedger.Id;
                }

                if (isExisting) {
                    entriesToUpdate.add(entry);
                    System.debug('🔄 Updated existing ' + category + ' entry: ' + entry.Id);
                } else {
                    entriesToInsert.add(entry);
                    System.debug('➕ Created new ' + category + ' entry');
                }
            }
        }

        if (!entriesToUpdate.isEmpty()) {
            update entriesToUpdate;
            System.debug('✅ Updated ' + entriesToUpdate.size() + ' journal entries.');
        }

        if (!entriesToInsert.isEmpty()) {
            insert entriesToInsert;
            System.debug('✅ Inserted ' + entriesToInsert.size() + ' journal entries.');
        }

        System.debug('--- Finished updateRelatedRecords method ---');
    }
}