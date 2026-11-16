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
            SELECT Id, Sl_no__c, Row_Unique_ID__c, Accounting_Invoices_Expenses__c,
            Accounting_Invoices_Expenses__r.isGeneralLedger__c,  Accounting_Invoices_Expenses__r.Is_Entity_Payment__c,
            Accounting_Ledger_Items__r.Category__r.Name, Amount__c,
            Tax__c, Unit_Price__c, Quantity__c, Description__c, Company__c,
            Entity_Profile__c, Invoice_Date__c, Post_Date__c, Invoice_No__c,
            Comments__c, Entry_Type__c, Tax_Inclusive__c, Is_Sno_Changed__c 
            FROM Accounting_Journal_Entry__c
            WHERE Id IN :entryIds
        ];
        system.debug('enrichedEntries==>'+enrichedEntries);
        Map<String, Accounting_Journal_Entry__c> invoiceRowKeyToEntryMap  = new Map<String, Accounting_Journal_Entry__c>();
        Set<Id> triggeredEntryIds = new Set<Id>();
        Set<Id> invoiceIds = new Set<Id>();
        //Set<Decimal> slNos = new Set<Decimal
        Set<String> rowUniqueKeys = new Set<String>();   //newly added
        
        //List<Accounting_Journal_Entry__c> gstSourceEntries = new List<Accounting_Journal_Entry__c>();   //newly added
        
        for (Accounting_Journal_Entry__c entry : enrichedEntries) {
            String catName = (entry.Accounting_Ledger_Items__r != null && entry.Accounting_Ledger_Items__r.Category__r != null) 
                ? entry.Accounting_Ledger_Items__r.Category__r.Name 
                : null;
            //Boolean isIncome = (catName == 'Income');
            //Boolean isExpenses = (catName == 'Expenses');
            System.debug('Entry Id: ' + entry.Id + 
                         ' | Ledger Item: ' + entry.Accounting_Ledger_Items__r +
                         ' | Category: ' + (entry.Accounting_Ledger_Items__r != null ? entry.Accounting_Ledger_Items__r.Category__r : null) +
                         ' | Category Name: ' + (entry.Accounting_Ledger_Items__r != null && entry.Accounting_Ledger_Items__r.Category__r != null ? catName : null) +
                         ' | Invoice: ' + entry.Accounting_Invoices_Expenses__c +
                         ' | Sl No: ' + entry.Sl_no__c + 
                         ' | Row_Unique_ID__c : ' + entry.Row_Unique_ID__c);
            if (entry.Accounting_Ledger_Items__r != null &&
                entry.Accounting_Ledger_Items__r.Category__r != null &&
                (catName == 'Income' || catName == 'Expenses' || catName == 'Equity' || catName == 'Cost Of Goods sold' || catName == 'Other' ||catName == 'Cost Of Sales'||  catName == 'Other Expenses'|| catName == 'Other Income' ) &&
                entry.Accounting_Invoices_Expenses__c != null &&
                entry.Accounting_Invoices_Expenses__r.isGeneralLedger__c == false && 
                entry.Accounting_Invoices_Expenses__r.Is_Entity_Payment__c == false &&
                entry.Sl_no__c != null && entry.Row_Unique_ID__c != null) {
                    // System.debug('1');
                    String key = entry.Accounting_Invoices_Expenses__c + '-' + entry.Row_Unique_ID__c;
                    // System.debug(LoggingLevel.INFO, '🔑 Constructed key: ' + key);    
                    invoiceRowKeyToEntryMap .put(key, entry);
                    // System.debug(LoggingLevel.INFO, '📌 Mapped entry under key: ' + key + ' | Entry ID: ' + entry.Id);
                    triggeredEntryIds.add(entry.Id);
                    system.debug('triggeredEntryIds ==> '+triggeredEntryIds);    
                    invoiceIds.add(entry.Accounting_Invoices_Expenses__c);
                    // slNos.add(entry.Sl_no__c);
                    rowUniqueKeys.add(key);   //newly added
                }
        }
        
        if (invoiceRowKeyToEntryMap .isEmpty()) {
            System.debug('No valid entries to process. Exiting method.');
            return;
        }
        
        Id companyId;
        for (Accounting_Journal_Entry__c e : enrichedEntries) {
            if (e.Company__c != null) {
                companyId = e.Company__c;
                // System.debug('2');
                break;
            }
        }
        
        if (companyId == null) {
            System.debug('❌ No Company__c found. Skipping ledger item query.');
            return;
        }
        
        List<Accounting_Journal_Entry__c> relatedJournalEntries = [
            SELECT Id, Sl_no__c,Row_Unique_ID__c, Accounting_Invoices_Expenses__c,
            Accounting_Ledger_Items__r.Category__r.Name, Amount__c,
            Tax__c, Unit_Price__c, Quantity__c, Description__c, Company__c,
            Entity_Profile__c, Invoice_Date__c, Post_Date__c, Invoice_No__c,
            Comments__c, Is_Sno_Changed__c, Tax_Inclusive__c 
            FROM Accounting_Journal_Entry__c
            WHERE Accounting_Invoices_Expenses__c IN :invoiceIds
            //AND Sl_no__c IN :slNos
            AND Row_Unique_ID__c != null
            // AND (Accounting_Invoices_Expenses__c + '-' + Row_Unique_ID__c) IN :rowUniqueKeys
            AND Id NOT IN :triggeredEntryIds
        ];
         //System.debug('3');
        System.debug(' related journal entries: ' + relatedJournalEntries);	
        
        // Organize existing by key and category
        Map<String, Map<String, Accounting_Journal_Entry__c>> relatedByKeyAndCategory = new Map<String, Map<String, Accounting_Journal_Entry__c>>();
        for (Accounting_Journal_Entry__c related : relatedJournalEntries) {
            //String key = related.Accounting_Invoices_Expenses__c + '-' + related.Sl_no__c;
            String key = related.Accounting_Invoices_Expenses__c + '-' + related.Row_Unique_ID__c;     //newly added  
            String category = related.Accounting_Ledger_Items__r.Category__r.Name;
            // System.debug('4');
            if (!relatedByKeyAndCategory.containsKey(key)) {
                relatedByKeyAndCategory.put(key, new Map<String, Accounting_Journal_Entry__c>());
                // System.debug('5');
            }
            relatedByKeyAndCategory.get(key).put(category, related);
            // System.debug('6');
            SYSTEM.DEBUG('relatedByKeyAndCategory >>'+ relatedByKeyAndCategory);
            System.debug(' Mapping related entry to key: ' + key + ', category: ' + category);
        }
        
        List<Accounting_Journal_Entry__c> entriesToUpdate = new List<Accounting_Journal_Entry__c>();
        List<Accounting_Journal_Entry__c> entriesToInsert = new List<Accounting_Journal_Entry__c>();
        
        for (String key : invoiceRowKeyToEntryMap.keySet()) {
             //System.debug('7');
            System.debug(' Processing source entry for key: ' + key);
            Accounting_Journal_Entry__c source = invoiceRowKeyToEntryMap.get(key);
            Map<String, Accounting_Journal_Entry__c> existingCategories = relatedByKeyAndCategory.get(key);
            SYSTEM.DEBUG('existingCategories >>'+ existingCategories);
            
            String catName = (source.Accounting_Ledger_Items__r != null && source.Accounting_Ledger_Items__r.Category__r != null) 
                ? source.Accounting_Ledger_Items__r.Category__r.Name 
                : null;
            Boolean isIncome = (catName == 'Income');
            Boolean isExpenses = (catName == 'Expenses');
            
            String entryType = source.Entry_Type__c;
            Decimal totalAmount = 0;
            Decimal taxAmount = 0;
            Decimal baseAmount = 0;
            Decimal subTotal = 0;
            
            Boolean taxInclusive = source.Tax_Inclusive__c;
            System.debug('source.Tax__c  : ' + source.Tax__c);
            Decimal taxValue = Decimal.valueOf(String.valueOf(source.Tax__c).replace('%', ''));
            Decimal taxMultiplier = 1 + (taxValue / 100);
            
            // Calculate baseAmount and other fields based on Entry Type
            if (entryType == 'Sales') {
                 //System.debug('8');
                baseAmount = (source.Unit_Price__c != null && source.Quantity__c != null)
                    ? (source.Unit_Price__c * source.Quantity__c).setScale(2)
                    : 0;
            } else if (entryType == 'Purchases') {
                baseAmount = source.Amount__c != null ? source.Amount__c.setScale(2) : 0;
            }
            
            // Calculate subtotal, tax amount, total amount
            if (taxInclusive) {
                subTotal = (baseAmount / taxMultiplier).setScale(2);
                taxAmount = (baseAmount - subTotal).setScale(2);
                totalAmount = baseAmount;
            } else {
                subTotal = baseAmount;
                taxAmount = (baseAmount * taxValue / 100).setScale(2);
                totalAmount = (subTotal + taxAmount).setScale(2);
            }
            
            // Debug outputs for validation
            System.debug('🔍 Entry Type: ' + entryType);
            System.debug('➡ Base Amount: ' + baseAmount);
            System.debug('➡ Sub Total: ' + subTotal);
            System.debug('➡ Tax Amount: ' + taxAmount);
            System.debug('➡ Total Amount: ' + totalAmount);
            
            // Fetch Ledger Items
            List<Accounting_Ledger_Items__c> ledgerItems = [
                SELECT Id, Name, Category__r.Name
                FROM Accounting_Ledger_Items__c
                WHERE Category__r.Name IN ('Liabilities', 'Assets')
                AND Category__r.Account_List__r.Company__c = :companyId
            ];
             //System.debug('9');
            System.debug(' Ledger items fetched for company: ' + companyId + ' => ' + ledgerItems);
            Accounting_Ledger_Items__c liabilitiesLedger;
            Accounting_Ledger_Items__c assetsLedger;
            
            //Boolean isIncome = (catName == 'Income');
            for (Accounting_Ledger_Items__c item : ledgerItems) {
                if (entryType == 'Sales') {
                    // System.debug('10');
                    if (item.Category__r.Name == 'Liabilities' && item.Name == 'GST Collected') {
                        liabilitiesLedger = item;
                        System.debug('➡ liabilitiesLedger : ' + liabilitiesLedger);
                    } else if (isIncome && item.Category__r.Name == 'Assets' && item.Name == 'Trade Debtors') {
                        assetsLedger = item;} else if(!isIncome && item.Category__r.Name == 'Assets' && item.Name == 'Trade Debtors') {continue; // 🔄 Avoid setting assetsLedger if not Income
                    }
                    
                } else if (entryType == 'Purchases') {
                    if ( item.Category__r.Name == 'Assets' && item.Name == 'GST Paid') {assetsLedger = item;
                        System.debug('➡ assetsLedger IN Purchases : ' + assetsLedger);
                    } else if (isExpenses && item.Category__r.Name == 'Liabilities' && item.Name == 'Trade Creditors') {liabilitiesLedger = item;
                        System.debug('➡ liabilitiesLedger  IN Purchases: ' + liabilitiesLedger);
                    } else if (!isExpenses && item.Category__r.Name == 'Liabilities' && item.Name == 'Trade Creditors') {continue; // 🔄 Avoid setting assetsLedger if not expense
                    } 
                }
            }
            Boolean allowInsert = (source.Is_Sno_Changed__c != true);
            
            // Loop through Liabilities and Assets categories
            for (String category : new List<String>{'Liabilities', 'Assets'}) {
                 //System.debug('11');
                Accounting_Journal_Entry__c entry;
                Boolean isExisting = existingCategories != null && existingCategories.containsKey(category);
                SYSTEM.DEBUG('isExisting >>'+ isExisting);
                // if (!isExisting && !allowInsert) {
                //     continue;
                //  }
                if (isExisting) {entry = existingCategories.get(category);
                    System.debug('🔁 [UPDATE] Existing ' + category + ' Entry Id: ' + entry.Id);
                    System.debug('👉 Related Entry Old Sl_no__c: ' + entry.Sl_no__c + ' | Source New Sl_no__c: ' + source.Sl_no__c);
                } else {
                    //if (!allowInsert) {
                    //   System.debug('🚫 Skipping insert for ' + category + ' due to Is_Sno_Changed__c = TRUE');
                    //   continue; // Only skip insert
                    //}
                     //System.debug('13');
                    entry = new Accounting_Journal_Entry__c();
                    entry.Accounting_Invoices_Expenses__c = source.Accounting_Invoices_Expenses__c;
                    System.debug('➕ [INSERT] New ' + category + ' Entry | Source Sl_no__c: ' + source.Sl_no__c);
                }
                
                // Common fields
                entry.Description__c = source.Description__c;
                entry.Company__c = source.Company__c;
                entry.Entry_Type__c = entryType;
                entry.Entity_Profile__c = source.Entity_Profile__c;
                entry.Sl_no__c = source.Sl_no__c;
                System.debug('✅ Setting Sl_no__c to: ' + entry.Sl_no__c + ' for ' + category + ' entry');
                entry.Invoice_Date__c = source.Invoice_Date__c;
                entry.Post_Date__c = source.Post_Date__c;
                entry.Invoice_No__c = source.Invoice_No__c;
                entry.Comments__c = source.Comments__c;
                entry.Is_Sno_Changed__c = source.Is_Sno_Changed__c;
                entry.Row_Unique_ID__c = source.Row_Unique_ID__c;
                
                // Ledger-specific assignmen
                if (category == 'Liabilities') {
                    if (entryType == 'Sales') {
                         //System.debug('14');
                        entry.Total_Amount__c = taxAmount; // GST Collected
                        entry.Accounting_Ledger_Items__c = liabilitiesLedger != null ? liabilitiesLedger.Id : null;
                        System.debug('➡  entry.Accounting_Ledger_Items__c  IN Sales : ' + entry.Accounting_Ledger_Items__c);
                    } else if (entryType == 'Purchases') {
                        entry.Total_Amount__c = totalAmount; // Trade Creditors
                        entry.Accounting_Ledger_Items__c = liabilitiesLedger != null ? liabilitiesLedger.Id : null;
                        System.debug('➡  entry.Accounting_Ledger_Items__c  IN Purchases : ' + entry.Accounting_Ledger_Items__c);
                    }
                    entry.Tax_Amount__c = 0;
                    entry.Sub_Total__c = 0;
                    
                } else if (category == 'Assets') {
                    if (entryType == 'Sales') {
                         //System.debug('15');
                        entry.Total_Amount__c = totalAmount; // Trade Debtors
                        entry.Accounting_Ledger_Items__c = assetsLedger != null ? assetsLedger.Id : null;
                        System.debug('➡  entry.Accounting_Ledger_Items__c  IN Sales , Assets : ' + entry.Accounting_Ledger_Items__c);
                    } else if (entryType == 'Purchases') {
                        entry.Total_Amount__c = taxAmount; // GST Paid
                        entry.Accounting_Ledger_Items__c = assetsLedger != null ? assetsLedger.Id : null;
                        System.debug('➡  entry.Accounting_Ledger_Items__c  IN Purchases , Assets : ' + entry.Accounting_Ledger_Items__c);
                    }
                    entry.Tax_Amount__c = 0;
                    entry.Sub_Total__c = 0;
                }
                
                // Add to insert or update list
                if (entry.Accounting_Ledger_Items__c != null) {
                    if (isExisting) {entriesToUpdate.add(entry);
                        System.debug('🔄 Updated existing ' + category + ' entry: ' + entry.Id);
                    } else {
                         //System.debug('17');
                        if (source.Is_Sno_Changed__c == true) {continue; // Skip insert if SNO changed
                        }
                        entriesToInsert.add(entry);
                        System.debug('➕ Created new ' + category + ' entry');
                    }
                } else {
                    System.debug('⚠️ Skipped because Accounting_Ledger_Items__c is null for category: ' + category);
                }
            }
        }
        
        for (Accounting_Journal_Entry__c entry : enrichedEntries) {
            if (entry.Accounting_Invoices_Expenses__c != null) {
                 //System.debug('18');
                invoiceIds.add(entry.Accounting_Invoices_Expenses__c);
            }
            if (entry.Company__c != null && companyId == null) {companyId = entry.Company__c;
            }
        }
        
        // ✅ Preload existing GST entries
        Map<String, Accounting_Journal_Entry__c> gstEntryMap = new Map<String, Accounting_Journal_Entry__c>();
        List<Accounting_Journal_Entry__c> existingGstEntries = [
            SELECT Id, Row_Unique_ID__c, Accounting_Invoices_Expenses__c,
            Accounting_Ledger_Items__r.Name, Total_Amount__c,
            Description__c, Entry_Type__c, Entity_Profile__c,
            Invoice_Date__c, Post_Date__c, Invoice_No__c,
            Comments__c, Is_Sno_Changed__c, Sl_no__c, Company__c
            FROM Accounting_Journal_Entry__c
            WHERE Accounting_Invoices_Expenses__c IN :invoiceIds
            AND Row_Unique_ID__c != null
            AND Accounting_Ledger_Items__r.Name IN ('GST Collected', 'GST Paid')
        ];
        
        for (Accounting_Journal_Entry__c e : existingGstEntries) {
             //System.debug('19');
            String key = e.Accounting_Invoices_Expenses__c + '-' + e.Row_Unique_ID__c + '-' + e.Accounting_Ledger_Items__r.Name;
            gstEntryMap.put(key, e);
        }
        
        for (Accounting_Journal_Entry__c source : enrichedEntries) {
             //System.debug('20');
            String catName = (source.Accounting_Ledger_Items__r != null && source.Accounting_Ledger_Items__r.Category__r != null)
                ? source.Accounting_Ledger_Items__r.Category__r.Name : null;
            
            if (catName != 'Assets' && catName != 'Liabilities') continue;Decimal taxValue = 0;if (source.Tax__c != null) {taxValue = Decimal.valueOf(String.valueOf(source.Tax__c).replace('%', ''));
            }
            
            Decimal taxMultiplier = 1 + (taxValue / 100);
            Boolean taxInclusive = source.Tax_Inclusive__c;
            Decimal baseAmount = (source.Unit_Price__c != null && source.Quantity__c != null)
                ? (source.Unit_Price__c * source.Quantity__c).setScale(2)
                : source.Amount__c;
            if (baseAmount == null) baseAmount = 0;
            
            Decimal subTotal, taxAmount, totalAmount;
            if (taxInclusive) {
                subTotal = (baseAmount / taxMultiplier).setScale(2);
                taxAmount = (baseAmount - subTotal).setScale(2);
                totalAmount = baseAmount;
            } else {
                subTotal = baseAmount;
                taxAmount = (baseAmount * taxValue / 100).setScale(2);
                totalAmount = subTotal + taxAmount;
            }
            
            //if (taxAmount == 0) continue;
            
            // ✅ Get correct GST Ledger info
            String gstName = source.Entry_Type__c == 'Sales' ? 'GST Collected' : 'GST Paid';
            String gstCategory = source.Entry_Type__c == 'Sales' ? 'Liabilities' : 'Assets';
            
            List<Accounting_Ledger_Items__c> gstLedgers = [
                SELECT Id FROM Accounting_Ledger_Items__c 
                WHERE Name = :gstName
                AND Category__r.Name = :gstCategory
                AND Category__r.Account_List__r.Company__c = :companyId
                LIMIT 1
            ];
            
            if (gstLedgers.isEmpty()) {
                System.debug('⚠️ No GST Ledger found for source entry: ' + source.Id);
                continue;
            }
            
            Accounting_Ledger_Items__c gstLedger = gstLedgers[0];
            
            // ✅ Key should be built AFTER gstLedger is determined
            String key = source.Accounting_Invoices_Expenses__c + '-' + source.Row_Unique_ID__c + '-' + gstName;
            
            if (gstEntryMap.containsKey(key)) {
                // ✅ UPDATE existing GST entry
                Accounting_Journal_Entry__c gstEntry = gstEntryMap.get(key);
                gstEntry.Description__c = source.Description__c;
                gstEntry.Total_Amount__c = taxAmount;
                gstEntry.Entry_Type__c = source.Entry_Type__c;
                gstEntry.Entity_Profile__c = source.Entity_Profile__c;
                gstEntry.Invoice_Date__c = source.Invoice_Date__c;
                gstEntry.Post_Date__c = source.Post_Date__c;
                gstEntry.Invoice_No__c = source.Invoice_No__c;
                gstEntry.Comments__c = source.Comments__c;
                gstEntry.Is_Sno_Changed__c = source.Is_Sno_Changed__c;
                gstEntry.Sl_no__c = source.Sl_no__c;
                gstEntry.Company__c = source.Company__c;
                gstEntry.Accounting_Ledger_Items__c = gstLedger.Id;
                gstEntry.Accounting_Invoices_Expenses__c = source.Accounting_Invoices_Expenses__c;
                
                entriesToUpdate.add(gstEntry);
                System.debug('✅ 🔁 Updated GST entry: ' + gstEntry);
            } else {
                // ✅ INSERT new GST entry
                Accounting_Journal_Entry__c gstEntry = new Accounting_Journal_Entry__c();
                gstEntry.Description__c = source.Description__c;
                gstEntry.Company__c = source.Company__c;
                gstEntry.Entry_Type__c = source.Entry_Type__c;
                gstEntry.Entity_Profile__c = source.Entity_Profile__c;
                gstEntry.Sl_no__c = source.Sl_no__c;
                gstEntry.Invoice_Date__c = source.Invoice_Date__c;
                gstEntry.Post_Date__c = source.Post_Date__c;
                gstEntry.Invoice_No__c = source.Invoice_No__c;
                gstEntry.Comments__c = source.Comments__c;
                gstEntry.Is_Sno_Changed__c = source.Is_Sno_Changed__c;
                gstEntry.Row_Unique_ID__c = source.Row_Unique_ID__c;
                gstEntry.Tax_Amount__c = 0;
                gstEntry.Sub_Total__c = 0;
                gstEntry.Total_Amount__c = taxAmount;
                gstEntry.Accounting_Ledger_Items__c = gstLedger.Id;
                gstEntry.Accounting_Invoices_Expenses__c = source.Accounting_Invoices_Expenses__c;
                
                entriesToInsert.add(gstEntry);
                System.debug('✅ ➕ Inserted new GST entry: ' + gstEntry);
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
  
    public static void updateRelatedLedgerItems(List<Accounting_Journal_Entry__c> journalEntries) {
        Set<Id> ledgerItemIds = new Set<Id>();
        
        for (Accounting_Journal_Entry__c entry : journalEntries) {
            if (entry.Accounting_Ledger_Items__c != null) {
                ledgerItemIds.add(entry.Accounting_Ledger_Items__c);
            }
        }
        
        System.debug('🔍 Ledger Item IDs: ' + ledgerItemIds);
        if (ledgerItemIds.isEmpty()) return;
        
        // Step 1: Query Ledger Items and full hierarchy
        Map<Id, Id> ledgerItemToLedgerNameMap = new Map<Id, Id>();
        Map<Id, Id> ledgerNameToSubCategoryMap = new Map<Id, Id>();
        Map<Id, Id> subCategoryToCategoryMap = new Map<Id, Id>();
        
        Set<Id> ledgerNameIds = new Set<Id>();
        Set<Id> subCategoryIds = new Set<Id>();
        Set<Id> categoryIds = new Set<Id>();
        
        List<Accounting_Ledger_Items__c> ledgerItems = [
            SELECT Id, Ledger_Name__c,
            Ledger_Name__r.Sub_Category__c,
            Ledger_Name__r.Sub_Category__r.Category__c,
            (SELECT Id, Amount__c,Total_Amount__c , Accounting_Invoices_Expenses__r.Status__c ,Accounting_Invoices_Expenses__r.Is_RFQ__c
             FROM Accounting_Journal_Entry__r
             WHERE  Accounting_Invoices_Expenses__r.Status__c  !='Draft' 
             AND Accounting_Invoices_Expenses__r.Is_RFQ__c != true)
            FROM Accounting_Ledger_Items__c
            WHERE Id IN :ledgerItemIds
        ];
        
        for (Accounting_Ledger_Items__c item : ledgerItems) {
            if (item.Ledger_Name__c != null) {
                ledgerItemToLedgerNameMap.put(item.Id, item.Ledger_Name__c);
                ledgerNameIds.add(item.Ledger_Name__c);
            }
            
            if (item.Ledger_Name__r != null && item.Ledger_Name__r.Sub_Category__c != null) {
                ledgerNameToSubCategoryMap.put(item.Ledger_Name__c, item.Ledger_Name__r.Sub_Category__c);
                subCategoryIds.add(item.Ledger_Name__r.Sub_Category__c);
            }
            
            if (item.Ledger_Name__r != null &&
                item.Ledger_Name__r.Sub_Category__r != null &&
                item.Ledger_Name__r.Sub_Category__r.Category__c != null) {
                    subCategoryToCategoryMap.put(
                        item.Ledger_Name__r.Sub_Category__c,
                        item.Ledger_Name__r.Sub_Category__r.Category__c
                    );
                    categoryIds.add(item.Ledger_Name__r.Sub_Category__r.Category__c);
                }
        }
        
        // Step 2: Aggregate journal amounts
        Map<Id, Decimal> ledgerItemTotals = new Map<Id, Decimal>();
        Map<Id, Decimal> ledgerNameTotals = new Map<Id, Decimal>();
        Map<Id, Decimal> subCategoryTotals = new Map<Id, Decimal>();
        Map<Id, Decimal> categoryTotals = new Map<Id, Decimal>();
        
        AggregateResult[] entryAggs = [
            SELECT Accounting_Ledger_Items__c ledgerItemId, SUM(Total_Amount__c) total
            FROM Accounting_Journal_Entry__c
            WHERE Accounting_Invoices_Expenses__r.Status__c  !='Draft' 
             AND Accounting_Invoices_Expenses__r.Is_RFQ__c != true AND Accounting_Ledger_Items__c IN :ledgerItemIds
            GROUP BY Accounting_Ledger_Items__c
        ];
        
        for (AggregateResult ar : entryAggs) {
            Id ledgerItemId = (Id) ar.get('ledgerItemId');
            Decimal total = (Decimal) ar.get('total');
            ledgerItemTotals.put(ledgerItemId, total);
            
            // Ledger Name
            Id ledgerNameId = ledgerItemToLedgerNameMap.get(ledgerItemId);
            if (ledgerNameId != null) {
                Decimal ledgerAmt = ledgerNameTotals.containsKey(ledgerNameId) ? ledgerNameTotals.get(ledgerNameId) : 0;
                ledgerNameTotals.put(ledgerNameId, ledgerAmt + total);
                
                // Sub Category
                Id subCatId = ledgerNameToSubCategoryMap.get(ledgerNameId);
                if (subCatId != null) {
                    Decimal subCatAmt = subCategoryTotals.containsKey(subCatId) ? subCategoryTotals.get(subCatId) : 0;
                    subCategoryTotals.put(subCatId, subCatAmt + total);
                    
                    // Category
                    Id catId = subCategoryToCategoryMap.get(subCatId);
                    if (catId != null) {
                        Decimal catAmt = categoryTotals.containsKey(catId) ? categoryTotals.get(catId) : 0;
                        categoryTotals.put(catId, catAmt + total);
                    }
                }
            }
        }
        
        // Debug logs
        System.debug('📊 Ledger Item Totals: ' + ledgerItemTotals);
        System.debug('📊 Ledger Name Totals: ' + ledgerNameTotals);
        System.debug('📊 Sub Category Totals: ' + subCategoryTotals);
        System.debug('📊 Category Totals: ' + categoryTotals);
        
        // Step 3: Prepare DML lists
        List<Accounting_Ledger_Items__c> ledgerItemsToUpdate = new List<Accounting_Ledger_Items__c>();
        for (Id itemId : ledgerItemTotals.keySet()) {
            ledgerItemsToUpdate.add(new Accounting_Ledger_Items__c(
                Id = itemId,
                Amount__c = ledgerItemTotals.get(itemId)
            ));
        }
        
        List<Accounting_Ledger_Name__c> ledgerNamesToUpdate = new List<Accounting_Ledger_Name__c>();
        for (Id ledgerNameId : ledgerNameTotals.keySet()) {
            ledgerNamesToUpdate.add(new Accounting_Ledger_Name__c(
                Id = ledgerNameId,
                Amount__c = ledgerNameTotals.get(ledgerNameId)
            ));
        }
        
        List<Accounting_Sub_Category__c> subCategoriesToUpdate = new List<Accounting_Sub_Category__c>();
        for (Id subCatId : subCategoryTotals.keySet()) {
            subCategoriesToUpdate.add(new Accounting_Sub_Category__c(
                Id = subCatId,
                Amount__c = subCategoryTotals.get(subCatId)
            ));
        }
        
        List<Accounting_Category__c> categoriesToUpdate = new List<Accounting_Category__c>();
        for (Id catId : categoryTotals.keySet()) {
            categoriesToUpdate.add(new Accounting_Category__c(
                Id = catId,
                Amount__c = categoryTotals.get(catId)
            ));
        }
        
        // Step 4: Execute DML
        if (!ledgerItemsToUpdate.isEmpty()) update ledgerItemsToUpdate;
        if (!ledgerNamesToUpdate.isEmpty()) update ledgerNamesToUpdate;
        if (!subCategoriesToUpdate.isEmpty()) update subCategoriesToUpdate;
        if (!categoriesToUpdate.isEmpty()) update categoriesToUpdate;
        
        // Logs
        System.debug('✅ Updated Ledger Items: ' + ledgerItemsToUpdate.size());
        System.debug('✅ Updated Ledger Names: ' + ledgerNamesToUpdate.size());
        System.debug('✅ Updated Sub Categories: ' + subCategoriesToUpdate.size());
        System.debug('✅ Updated Categories: ' + categoriesToUpdate.size());
    }
    
    
}