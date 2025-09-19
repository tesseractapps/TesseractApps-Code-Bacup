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
            	   Accounting_Invoices_Expenses__r.isGeneralLedger__c,
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
                   Comments__c,
              	   Entry_Type__c,
               	   Tax_Inclusive__c,
            	   Is_Sno_Changed__c
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
            if (entry.Accounting_Ledger_Items__r != null &&
                entry.Accounting_Ledger_Items__r.Category__r != null &&
                (entry.Accounting_Ledger_Items__r.Category__r.Name == 'Income' || entry.Accounting_Ledger_Items__r.Category__r.Name == 'Expenses') &&
                entry.Accounting_Invoices_Expenses__c != null &&
                entry.Accounting_Invoices_Expenses__r.isGeneralLedger__c == false &&
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
                   Comments__c,
            	   Is_Sno_Changed__c,
           		   Tax_Inclusive__c
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

       /* for (String key : invoiceSlNoKeyToEntryMap.keySet()) {
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
        }*/
       
        for (String key : invoiceSlNoKeyToEntryMap.keySet()) {
            Accounting_Journal_Entry__c source = invoiceSlNoKeyToEntryMap.get(key);
            Map<String, Accounting_Journal_Entry__c> existingCategories = relatedByKeyAndCategory.get(key);
        
            String entryType = source.Entry_Type__c;
            Decimal totalAmount = 0;
            Decimal taxAmount = 0;
            Decimal baseAmount = 0;
            Decimal subTotal = 0;
            
            Boolean taxInclusive = source.Tax_Inclusive__c;
            Decimal taxValue = Decimal.valueOf(String.valueOf(source.Tax__c).replace('%', ''));
            Decimal taxMultiplier = 1 + (taxValue / 100);
        
            // Calculate baseAmount and other fields based on Entry Type
            if (entryType == 'Sales') {
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
        
            Accounting_Ledger_Items__c liabilitiesLedger;
            Accounting_Ledger_Items__c assetsLedger;
        
            for (Accounting_Ledger_Items__c item : ledgerItems) {
                if (entryType == 'Sales') {
                    if (item.Category__r.Name == 'Liabilities' && item.Name == 'GST Collected') {
                        liabilitiesLedger = item;
                    } else if (item.Category__r.Name == 'Assets' && item.Name == 'Trade Debtors') {
                        assetsLedger = item;
                    }
                } else if (entryType == 'Purchases') {
                    if (item.Category__r.Name == 'Liabilities' && item.Name == 'Trade Creditors') {
                        liabilitiesLedger = item;
                    } else if (item.Category__r.Name == 'Assets' && item.Name == 'GST Paid') {
                        assetsLedger = item;
                    }
                }
            }
        	Boolean allowInsert = (source.Is_Sno_Changed__c != true);
            
            // Loop through Liabilities and Assets categories
            for (String category : new List<String>{'Liabilities', 'Assets'}) {
                Accounting_Journal_Entry__c entry;
                Boolean isExisting = existingCategories != null && existingCategories.containsKey(category);
              // if (!isExisting && !allowInsert) {
              //     continue;
              //  }
                if (isExisting) {
                    entry = existingCategories.get(category);
                    System.debug('🔁 [UPDATE] Existing ' + category + ' Entry Id: ' + entry.Id);
                    System.debug('👉 Related Entry Old Sl_no__c: ' + entry.Sl_no__c + ' | Source New Sl_no__c: ' + source.Sl_no__c);
                } else {
                     //if (!allowInsert) {
                     //   System.debug('🚫 Skipping insert for ' + category + ' due to Is_Sno_Changed__c = TRUE');
                     //   continue; // Only skip insert
                    //}
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
                // Ledger-specific assignmen
                if (category == 'Liabilities') {
                    if (entryType == 'Sales') {
                        entry.Total_Amount__c = taxAmount; // GST Collected
                        entry.Accounting_Ledger_Items__c = liabilitiesLedger != null ? liabilitiesLedger.Id : null;
                    } else if (entryType == 'Purchases') {
                        entry.Total_Amount__c = totalAmount; // Trade Creditors
                        entry.Accounting_Ledger_Items__c = liabilitiesLedger != null ? liabilitiesLedger.Id : null;
                    }
                    entry.Tax_Amount__c = 0;
                    entry.Sub_Total__c = 0;
        
                } else if (category == 'Assets') {
                    if (entryType == 'Sales') {
                        entry.Total_Amount__c = totalAmount; // Trade Debtors
                        entry.Accounting_Ledger_Items__c = assetsLedger != null ? assetsLedger.Id : null;
                    } else if (entryType == 'Purchases') {
                        entry.Total_Amount__c = taxAmount; // GST Paid
                        entry.Accounting_Ledger_Items__c = assetsLedger != null ? assetsLedger.Id : null;
                    }
                    entry.Tax_Amount__c = 0;
                    entry.Sub_Total__c = 0;
                }
        
                // Add to insert or update list
                if (isExisting) {
                    entriesToUpdate.add(entry);
                    System.debug('🔄 Updated existing ' + category + ' entry: ' + entry.Id);
                } else {
                    if (source.Is_Sno_Changed__c == true) {
                        System.debug('🚫 Skipping insert due to Is_Sno_Changed__c = true for category: ' + category);
                        continue; // Skip insert if SNO changed
                    }
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