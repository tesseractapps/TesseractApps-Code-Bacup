public class AccountingBankingController {
     @AuraEnabled
    public static List<Accounting_Ledger_Items__c> getLedgerItemsAssetsLiabilities(Id companyId) {
        String currentUserId = UserInfo.getUserId();
        try {
            User currentUser = [SELECT Id, Organization_Name__c FROM User WHERE Id = :currentUserId LIMIT 1];
            List<Accounting_Ledger_Items__c> ledgerItems = [
                SELECT Id, Name, Account_Number__c, Category__r.Name,Amount__c,Ledger_Name__r.Name
                FROM Accounting_Ledger_Items__c WHERE Category__r.Account_List__r.Company__r.Organization__r.Name = :currentUser.Organization_Name__c
                AND Category__r.Account_List__r.Company__c = :companyId AND Ledger_Name__r.Name IN ('Bank Accounts', 'Credit Cards')
                ORDER BY Account_Number__c ASC
            ];
            System.debug('Retrieved Ledger Items: ' + JSON.serialize(ledgerItems));
            return ledgerItems;
        } catch (Exception e) {
            System.debug(' Error fetching Ledger Items: ' + e.getMessage());
            throw new AuraHandledException('Error retrieving ledger items: ' + e.getMessage());
        }
    }
    /* @AuraEnabled (cacheable=true)
    public static List<Accounting_Invoices_Expenses__c> getInvoicesBasedOnEntity(Id companyId, String entityId) {
       
        try {
        	List<Accounting_Invoices_Expenses__c> InvoiceData = [SELECT Id,(SELECT Id,Tax_Amount__c,Total_Amount__c,Sub_Total__c,Accounting_Ledger_Items__c, Description__c,Company__c,
 																 Entry_Type__c, Entity_Profile__c, Invoice_Date__c,Post_Date__c, Invoice_No__c,Comments__c,Sl_no__c,Amount__c,
                                                                 Unit_Price__c,Quantity__c,Tax__c, Accounting_Invoices_Expenses__c, Accounting_Ledger_Items__r.Account_Number__c,
                                                                 Accounting_Ledger_Items__r.Name,Entity_Profile__r.First_Name__c,Entity_Profile__r.Last_Name__c,Entity_Profile__r.Name__c
                                                                 FROM Accounting_Journal_Entry__r  WHERE Entity_Profile__c = :entityId  
                                                                 AND Accounting_Ledger_Items__r.Name NOT IN ('GST Paid', 'Trade Creditors'))
                                                                 FROM Accounting_Invoices_Expenses__c WHERE Company__c = :companyId  
                                                                 AND Id IN (SELECT Accounting_Invoices_Expenses__c FROM Accounting_Journal_Entry__c WHERE Entity_Profile__c = :entityId)];                                      
            return InvoiceData;
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching invoices: ' + e.getMessage());
        }
    } */
   /* @AuraEnabled (cacheable=true)
    public static List<Accounting_Invoices_Expenses__c> getInvoicesBasedOnEntity(Id companyId, String entityId) {
        System.debug('Input entityId: ' + entityId);
    	System.debug('Input companyId: ' + companyId);
         if (String.isBlank(entityId) || String.isBlank(companyId)) {
            System.debug(' entityId  or company Id is blank → returning empty list');
            return new List<Accounting_Invoices_Expenses__c>();
        }
        try {
           List<Accounting_Invoices_Expenses__c> InvoiceData=[SELECT Id,GST__c,Total_Amount__c,Name,Balance_Amount__c,Amount_Paid__c,Invoice_No__c,Invoice_Date__c,
                                                               (SELECT Id,Tax_Amount__c,Total_Amount__c,Sub_Total__c,Accounting_Ledger_Items__c,Company__c,Entry_Type__c, 
                                                             		Entity_Profile__c,Sl_no__c,Amount__c,Tax__c, Accounting_Invoices_Expenses__c,
                                                                 	Accounting_Ledger_Items__r.Account_Number__c,Balance_Amount__c,Amount_Paid__c,Accounting_Ledger_Items__r.Name,
                                                                 	Accounting_Ledger_Items__r.Category__r.Name 
                                                                 FROM Accounting_Journal_Entry__r  WHERE Entity_Profile__c = :entityId )
                                                                 	//AND Accounting_Ledger_Items__r.Name NOT IN ('GST Paid', 'Trade Creditors'))
                                                                FROM Accounting_Invoices_Expenses__c WHERE Company__c = :companyId  AND Balance_Amount__c!= 0 AND Status__c  ='Issued' 
                                                                AND Id IN (SELECT Accounting_Invoices_Expenses__c FROM Accounting_Journal_Entry__c WHERE Entity_Profile__c=:entityId)];
            System.debug('InvoiceData: ' + InvoiceData);
            System.debug('InvoiceData size: ' + InvoiceData.size());
            
            return InvoiceData;
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching invoices: ' + e.getMessage());
        }
    } */
    @AuraEnabled(cacheable=true)
    public static List<Accounting_Invoices_Expenses__c> getInvoicesBasedOnEntity(
        Id companyId, 
        String entityId
    ) {
        System.debug('Input entityId: ' + entityId);
        System.debug('Input companyId: ' + companyId);
    
        if (String.isBlank(entityId) || String.isBlank(companyId)) {
            System.debug(' entityId or companyId is blank → returning empty list');
            return new List<Accounting_Invoices_Expenses__c>();
        }
    
        try {
    
            List<Accounting_Journal_Entry__c> journalEntries = [
                SELECT Id, Entry_Type__c, Accounting_Invoices_Expenses__c
                FROM Accounting_Journal_Entry__c
                WHERE Entity_Profile__c = :entityId
            ];
    
            if (journalEntries.isEmpty()) {
                return new List<Accounting_Invoices_Expenses__c>();
            }
    
            // STEP 2 — Check if the entries are SALES or PURCHASES
            Boolean isSales = false;
    
            for (Accounting_Journal_Entry__c entry : journalEntries) {
                if (entry.Entry_Type__c == 'Sales') {
                    isSales = true;
                    break;
                }
            }
    
            // STEP 3 — Build dynamic WHERE clause
            String statusFilter = isSales ? ' AND Status__c = \'Issued\' ' : '';
    
            System.debug('isSales? → ' + isSales);
            System.debug('Status filter applied: ' + statusFilter);
    
            // STEP 4 — Final SOQL with conditional status filter
            List<Accounting_Invoices_Expenses__c> invoiceData = Database.query(
                'SELECT Id, GST__c, Total_Amount__c, Name, Balance_Amount__c, Amount_Paid__c, ' +
                'Invoice_No__c, Invoice_Date__c,Is_RFQ__c,' +
                '(SELECT Id, Tax_Amount__c, Total_Amount__c, Sub_Total__c, Accounting_Ledger_Items__c, ' +
                'Company__c, Entry_Type__c, Entity_Profile__c, Sl_no__c, Amount__c, Tax__c, ' +
                'Accounting_Invoices_Expenses__c, Accounting_Ledger_Items__r.Account_Number__c, ' +
                'Balance_Amount__c, Amount_Paid__c, Accounting_Ledger_Items__r.Name, ' +
                'Accounting_Ledger_Items__r.Category__r.Name ' +
                'FROM Accounting_Journal_Entry__r ' +
                'WHERE Entity_Profile__c = \'' + entityId + '\' ) ' +
                'FROM Accounting_Invoices_Expenses__c ' +
                'WHERE Company__c = \'' + companyId + '\' ' +
                'AND Balance_Amount__c != 0 ' +
                'AND Total_Amount__c != 0 ' +
                'AND (Is_Payroll_Sales__c  = true OR Is_Payroll_Purchases__c  = true) ' +
                statusFilter +
                'AND Id IN (SELECT Accounting_Invoices_Expenses__c FROM Accounting_Journal_Entry__c ' +
                'WHERE Entity_Profile__c = \'' + entityId + '\')'
            );
    
            return invoiceData;
    
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching invoices: ' + e.getMessage());
        }
    }
    
    /* @AuraEnabled
    public static void updateEntityPaymentInvoices(List<Map<String, Object>> invoiceList) {
        if (invoiceList == null || invoiceList.isEmpty()) return;
    
        List<Accounting_Invoices_Expenses__c> invoiceToUpdate = new List<Accounting_Invoices_Expenses__c>();
        List<Accounting_Journal_Entry__c> entryToUpdate = new List<Accounting_Journal_Entry__c>();
    
        try {
            // Collect Parent IDs to query children
            Set<Id> invoiceIds = new Set<Id>();
            Map<Id, Decimal> paidMap = new Map<Id, Decimal>();
            Map<Id, Decimal> balanceMap = new Map<Id, Decimal>();        
            Map<Id, Boolean> isEntityPaymentMap = new Map<Id, Boolean>();
    		String entryType = '';   
        	String ledgerName = '';
            System.debug('ledgerName  first: ' + ledgerName);
            for (Map<String, Object> mapRow : invoiceList) {
                Id invoiceId = (String) mapRow.get('Id');
                
                //System.debug('🔥 entryType from JS for invoice ' + invoiceId + ' = ' + mapRow.get('entryType'));
                //entryType = mapRow.get('entryType') != null ? (String)mapRow.get('entryType') : '';
    			//System.debug('entryType inside loop: ' + entryType);
                
                System.debug('🔍 Raw paidAmount (before conversion): ' + mapRow.get('paidAmount'));
    			System.debug('🔍 Raw balanceAmount (before conversion): ' + mapRow.get('balanceAmount'));
                Decimal paid = mapRow.get('paidAmount') != null ? Decimal.valueOf(mapRow.get('paidAmount') + '') : 0;
                Decimal balance = mapRow.get('balanceAmount') != null ? Decimal.valueOf(mapRow.get('balanceAmount') + '') : 0;
     			Boolean isEntityPayment = mapRow.get('isEntityPayment') != null ? Boolean.valueOf(mapRow.get('isEntityPayment') + '') : false;
                entryType = mapRow.get('entryType') != null ? (String)mapRow.get('entryType') : '';
                System.debug('entryType 111 : ' + entryType);
                System.debug('🧾 Invoice ID: ' + invoiceId);
                System.debug('💰 Paid Amount: ' + paid);
                System.debug('💸 Balance Amount: ' + balance);
                System.debug('🏢 Is Entity Payment: ' + isEntityPayment);
                
                Accounting_Invoices_Expenses__c invoice = new Accounting_Invoices_Expenses__c(
                    Id = invoiceId,
                    Amount_Paid__c = paid,
                    Balance_Amount__c = balance,
                    Is_Entity_Payment__c = isEntityPayment
                );
                invoiceToUpdate.add(invoice);
    
                invoiceIds.add(invoiceId);
                paidMap.put(invoiceId, paid);
                balanceMap.put(invoiceId, balance);
                isEntityPaymentMap.put(invoiceId, isEntityPayment);
            }
    		 System.debug('🔎 Invoices to update: ' + invoiceIds);
            // Update records
            if (!invoiceToUpdate.isEmpty()) {
                update invoiceToUpdate;
                System.debug('✅ Updated invoices: ' + invoiceToUpdate.size());
            }
          	System.debug('ledgerName : ' + ledgerName);
            System.debug('entryType : ' + entryType);
            if (entryType == 'Purchases') {
                ledgerName = 'Trade Creditors';
                System.debug('ledgerName IN Purchases: ' + ledgerName);
            } else if (entryType == 'Sales') {
                ledgerName = 'Trade Debtors';
                System.debug('ledgerName IN SALES: ' + ledgerName);
            }
            // Query related child Journal Entries
            List<Accounting_Journal_Entry__c> allTradeEntries = [
                SELECT Id, Accounting_Invoices_Expenses__c, Total_Amount__c, Amount_Paid__c, Balance_Amount__c, Row_Unique_ID__c,Accounting_Ledger_Items__c,
                Accounting_Ledger_Items__r.Name,Sl_no__c
                FROM Accounting_Journal_Entry__c
                WHERE Accounting_Invoices_Expenses__c IN :invoiceIds 
                AND Accounting_Ledger_Items__r.Name =:ledgerName
            	//ORDER BY Accounting_Invoices_Expenses__c, Sl_no__c ASC
            ];
    		System.debug('📘 Found Trade Creditor Entries: ' + allTradeEntries.size());

            // Group by Invoice
           // Map<Id, List<Accounting_Journal_Entry__c>> groupedByInvoice = new Map<Id, List<Accounting_Journal_Entry__c>>();
            for (Accounting_Journal_Entry__c entry : allTradeEntries) {
                
                Id invoiceId = entry.Accounting_Invoices_Expenses__c;
                if (!isEntityPaymentMap.containsKey(invoiceId) || !isEntityPaymentMap.get(invoiceId)) {
                    continue; // Skip non-entity payments
                }
                Decimal paid = paidMap.get(invoiceId);
                Decimal balance = balanceMap.get(invoiceId);
                Decimal previousPaid = entry.Amount_Paid__c != null ? entry.Amount_Paid__c : 0;
                Decimal newPayment = paid - previousPaid;
                System.debug('🟡 previousPaid: ' + previousPaid);
				System.debug('🟢 newPayment: ' + newPayment);
                
                Decimal total = entry.Total_Amount__c != null ? entry.Total_Amount__c : 0;
                System.debug(' Total: ' + total + ' | Paid: ' + paid + ' | Balance: ' + balance); 
                entry.Amount_Paid__c = paid;
                entry.Balance_Amount__c = balance;
                System.debug('️ Updated Entry Fields → Amount_Paid__c: ' + entry.Amount_Paid__c + ', Balance_Amount__c: ' + entry.Balance_Amount__c);
                //entry.Total_Amount__c = total - paid;
                entry.Total_Amount__c = (entry.Total_Amount__c != null ? entry.Total_Amount__c : 0) - newPayment;
                System.debug(' entry.Total_Amount__c: ' +   entry.Total_Amount__c); 
                entryToUpdate.add(entry);
                System.debug('✅ Updated Trade Creditor for Invoice: ' + invoiceId);
                System.debug('✅ Added Trade Creditor Entry for update: ' + entry.Id);
            }
    
            if (!entryToUpdate.isEmpty()) {
                update entryToUpdate;
                System.debug('✅ Updated Trade Creditor entries: ' + entryToUpdate.size());
            }
    
        } catch (Exception e) {
            System.debug('❌ Apex Exception: ' + e.getMessage());
            throw new AuraHandledException('Update failed: ' + e.getMessage());
        }
    }*/
    @AuraEnabled
    public static String  createPaymentWithInvoiceUpdates(
        Map<String, Object> paymentRecord,
        List<Map<String, Object>> invoiceList,
        Boolean isSpendMoney
    ) {
        System.debug('🔥 Received Payment: ' + paymentRecord);
        System.debug('🔥 Received Invoices: ' + invoiceList);
    
        if(paymentRecord == null){throw new AuraHandledException('Payment record is empty');
        }
        if(invoiceList == null || invoiceList.isEmpty()){throw new AuraHandledException('Invoice list is empty');
        }
    
        try {
            System.debug('⚡ Received Payment Record: ' + paymentRecord);
            System.debug('⚡ Received Invoices: ' + invoiceList);

            // 1️⃣ CREATE PAYMENT (PARENT)
            Invoice_Payment__c p = new Invoice_Payment__c();

            p.Entity_Profile__c          = (String) paymentRecord.get('entity');
            p.Company__c         = (String) paymentRecord.get('company');
            p.Payee__c         = (String) paymentRecord.get('payee');
            

            // Date conversion
            if (paymentRecord.get('paymentDate') != null) {
                p.Payment_Date__c = Date.valueOf((String) paymentRecord.get('paymentDate'));
            }

            // Total paid
            // if (paymentRecord.get('overalTotalPaid') != null) {
            //     p.Total_Amount_Paid__c = Decimal.valueOf('' + paymentRecord.get('overalTotalPaid'));
            // }
            Decimal totalPaid = paymentRecord.get('overalTotalPaid') != null ?
                    Decimal.valueOf('' + paymentRecord.get('overalTotalPaid')) :null;

            if (totalPaid != null) {
                if (isSpendMoney == true) {p.Total_Amount_Paid__c = totalPaid;p.Total_Amount_Received__c = null; // optional: clear opposite field
                } else {
                    p.Total_Amount_Received__c = totalPaid;
                    p.Total_Amount_Paid__c = null;     // optional: clear opposite field
                }
            }

            p.Accounting_Ledger_Items__c = (String) paymentRecord.get('fromLedger');
           // p.Is_Spend_Money__c =paymentType;
           if (isSpendMoney) {
                p.Is_Spend_Money__c = true;
                p.Is_Receive_Money__c = false;
            } else {
                p.Is_Spend_Money__c = false;
                p.Is_Receive_Money__c = true;
            }
            // NEW: Spend Money Boolean
           // if (paymentRecord.containsKey('isSpendMoney')) {
              //  p.Is_Spend_Money__c = (Boolean) paymentRecord.get('isSpendMoney');
           // }

            insert p;
            System.debug('✅ Payment Created: ' + p.Id);
            p = [
                SELECT Id, Name
                FROM Invoice_Payment__c
                WHERE Id = :p.Id
            ];
            System.debug('🔢 Payment Number Loaded: ' + p.Name);
            List<Map<String, Object>> paymentInvoiceList = new List<Map<String, Object>>();

    
            List<Accounting_Invoices_Expenses__c> invoiceToUpdate = new List<Accounting_Invoices_Expenses__c>();
            List<Accounting_Journal_Entry__c> entryToUpdate = new List<Accounting_Journal_Entry__c>();
    
            Set<Id> invoiceIds = new Set<Id>();
            Map<Id, Decimal> paidMap = new Map<Id, Decimal>();
            Map<Id, Decimal> balanceMap = new Map<Id, Decimal>();        
            Map<Id, Boolean> isEntityPaymentMap = new Map<Id, Boolean>();
    		String entryType = '';   
        	String ledgerName = '';
            System.debug('ledgerName  first: ' + ledgerName);
            for (Map<String, Object> mapRow : invoiceList) {
                Id invoiceId = (String) mapRow.get('Id');
                
                //System.debug('🔥 entryType from JS for invoice ' + invoiceId + ' = ' + mapRow.get('entryType'));
                //entryType = mapRow.get('entryType') != null ? (String)mapRow.get('entryType') : '';
    			//System.debug('entryType inside loop: ' + entryType);
                
                System.debug('🔍 Raw paidAmount (before conversion): ' + mapRow.get('paidAmount'));
    			System.debug('🔍 Raw balanceAmount (before conversion): ' + mapRow.get('balanceAmount'));
                Decimal paid = mapRow.get('paidAmount') != null ? Decimal.valueOf(mapRow.get('paidAmount') + '') : 0;
                Decimal balance = mapRow.get('balanceAmount') != null ? Decimal.valueOf(mapRow.get('balanceAmount') + '') : 0;
     			Boolean isEntityPayment = mapRow.get('isEntityPayment') != null ? Boolean.valueOf(mapRow.get('isEntityPayment') + '') : false;
                entryType = mapRow.get('entryType') != null ? (String)mapRow.get('entryType') : '';
                System.debug('entryType 111 : ' + entryType);
                System.debug('🧾 Invoice ID: ' + invoiceId);
                System.debug('💰 Paid Amount: ' + paid);
                System.debug('💸 Balance Amount: ' + balance);
                System.debug('🏢 Is Entity Payment: ' + isEntityPayment);
                
                Accounting_Invoices_Expenses__c invoice = new Accounting_Invoices_Expenses__c(
                    Id = invoiceId,
                    Amount_Paid__c = paid,
                    Balance_Amount__c = balance,
                    Is_Entity_Payment__c = isEntityPayment,
                    Invoice_Payment__c = p.Id
                );

            // ⭐ Add invoice ID + invoice Name to payment JSON list
            Map<String, Object> invRef = new Map<String, Object>();
            invRef.put('invoiceId', invoiceId);
            invRef.put('invoiceNo', (String) mapRow.get('invoiceAutoNo'));
          // invRef.put('invoiceNo', invoiceNameMap.get(invoiceId).Name);
            paymentInvoiceList.add(invRef);

            Map<String, Object> histMap = new Map<String, Object>();

            if (mapRow.containsKey('historyEntry') && mapRow.get('historyEntry') != null) {
                histMap = (Map<String, Object>) JSON.deserializeUntyped(
                    JSON.serialize(mapRow.get('historyEntry'))
                );
            }
            String  histDate = (String) histMap.get('date');
            String  histTime = (String) histMap.get('time');

            Decimal histInvoicePaid = histMap.get('invoicePaid') != null
                ? Decimal.valueOf(String.valueOf(histMap.get('invoicePaid'))): null;

            Decimal histToPayValue = histMap.get('toPayValue') != null
                ? Decimal.valueOf(String.valueOf(histMap.get('toPayValue'))): null;

            Decimal histBalance = histMap.get('balance') != null
                ? Decimal.valueOf(String.valueOf(histMap.get('balance'))): null;

            Map<String, Object> newEntry = new Map<String, Object>();
            newEntry.put('date',        histDate);
            newEntry.put('time',        histTime);
            newEntry.put('paymentId',   p.Id); 
            newEntry.put('paymentNo',   p.Name);         
            newEntry.put('invoicePaid', histInvoicePaid);
            newEntry.put('toPayValue',  histToPayValue);
            newEntry.put('balance',     histBalance);

            System.debug('📝 Final History Entry Stored: ' + JSON.serialize(newEntry));

            Accounting_Invoices_Expenses__c existing =
                [SELECT Id, Payment_History_JSON__c
                FROM Accounting_Invoices_Expenses__c
                WHERE Id = :invoiceId LIMIT 1];

            List<Object> historyList = new List<Object>();
            if (existing.Payment_History_JSON__c != null) {
                try {
                    historyList = (List<Object>) JSON.deserializeUntyped(existing.Payment_History_JSON__c);
                } catch (Exception e) {
                    System.debug('⚠️ Failed to parse history JSON — starting fresh.');
                }
            }

            historyList.add(newEntry);
            List<Object> orderedHistory = new List<Object>();
            for (Object item : historyList) {
                Map<String, Object> h = (Map<String, Object>) item;

                // FORCE FIXED KEY ORDER ✔
                Map<String, Object> ordered = new Map<String, Object>();
                ordered.put('date',        h.get('date'));
                ordered.put('time',        h.get('time'));
                ordered.put('paymentId',   h.get('paymentId'));
                ordered.put('paymentNo',   h.get('paymentNo'));
                ordered.put('invoicePaid', h.get('invoicePaid'));
                ordered.put('toPayValue',  h.get('toPayValue'));
                ordered.put('balance',     h.get('balance'));

                orderedHistory.add(ordered);
            }

            invoice.Payment_History_JSON__c = JSON.serialize(orderedHistory);

            System.debug('📚 Updated Full History JSON: ' + invoice.Payment_History_JSON__c);

                invoiceToUpdate.add(invoice);
    
                invoiceIds.add(invoiceId);
                paidMap.put(invoiceId, paid);
                balanceMap.put(invoiceId, balance);
                isEntityPaymentMap.put(invoiceId, isEntityPayment);
            }
    		 System.debug('🔎 Invoices to update: ' + invoiceIds);
            // Update records
            if (!invoiceToUpdate.isEmpty()) {
                update invoiceToUpdate;
                System.debug('✅ Updated invoices: ' + invoiceToUpdate.size());
            }
          	System.debug('ledgerName : ' + ledgerName);
            System.debug('entryType : ' + entryType);
            if (entryType == 'Purchases') {ledgerName = 'Trade Creditors';
                System.debug('ledgerName IN Purchases: ' + ledgerName);
            } else if (entryType == 'Sales') {
                ledgerName = 'Trade Debtors';
                System.debug('ledgerName IN SALES: ' + ledgerName);
            }
            // Query related child Journal Entries
            List<Accounting_Journal_Entry__c> allTradeEntries = [
                SELECT Id, Accounting_Invoices_Expenses__c, Total_Amount__c, Amount_Paid__c, Balance_Amount__c, Row_Unique_ID__c,Accounting_Ledger_Items__c,
                Accounting_Ledger_Items__r.Name,Sl_no__c
                FROM Accounting_Journal_Entry__c
                WHERE Accounting_Invoices_Expenses__c IN :invoiceIds 
                AND Accounting_Ledger_Items__r.Name =:ledgerName
            	//ORDER BY Accounting_Invoices_Expenses__c, Sl_no__c ASC
            ];
    		System.debug('📘 Found Trade Creditor Entries: ' + allTradeEntries.size());

            // Group by Invoice
           // Map<Id, List<Accounting_Journal_Entry__c>> groupedByInvoice = new Map<Id, List<Accounting_Journal_Entry__c>>();
            for (Accounting_Journal_Entry__c entry : allTradeEntries) {
                
                Id invoiceId = entry.Accounting_Invoices_Expenses__c;
                if (!isEntityPaymentMap.containsKey(invoiceId) || !isEntityPaymentMap.get(invoiceId)) {
                    continue; // Skip non-entity payments
                }
                Decimal paid = paidMap.get(invoiceId);
                Decimal balance = balanceMap.get(invoiceId);
                Decimal previousPaid = entry.Amount_Paid__c != null ? entry.Amount_Paid__c : 0;
                Decimal newPayment = paid - previousPaid;
                System.debug('🟡 previousPaid: ' + previousPaid);
				System.debug('🟢 newPayment: ' + newPayment);
                
                Decimal total = entry.Total_Amount__c != null ? entry.Total_Amount__c : 0;
                System.debug(' Total: ' + total + ' | Paid: ' + paid + ' | Balance: ' + balance); 
                entry.Amount_Paid__c = paid;
                entry.Balance_Amount__c = balance;
                System.debug('️ Updated Entry Fields → Amount_Paid__c: ' + entry.Amount_Paid__c + ', Balance_Amount__c: ' + entry.Balance_Amount__c);
                //entry.Total_Amount__c = total - paid;
                entry.Total_Amount__c = (entry.Total_Amount__c != null ? entry.Total_Amount__c : 0) - newPayment;
                System.debug(' entry.Total_Amount__c: ' +   entry.Total_Amount__c); 
                entryToUpdate.add(entry);
                System.debug('✅ Updated Trade Creditor for Invoice: ' + invoiceId);
                System.debug('✅ Added Trade Creditor Entry for update: ' + entry.Id);
            }
    
            if (!entryToUpdate.isEmpty()) {
                update entryToUpdate;
                System.debug('✅ Updated Trade Creditor entries: ' + entryToUpdate.size());

            }
             p.Linked_Invoices_JSON__c = JSON.serialize(paymentInvoiceList);
             update p;
            return p.Id; 
        } catch (Exception ex) {
            System.debug('❌ ERROR (rolled back): ' + ex.getMessage());
            throw new AuraHandledException('Error during payment & invoice update: ' + ex.getMessage());
        }
    }


    @AuraEnabled
    public static Boolean updateLedgerItemId(String ledgerItemId, Decimal amount, String category,String entryType) {
        try {
            System.debug('🔹 Input ledgerItemId: ' + ledgerItemId);
            System.debug('🔹 Input amount: ' + amount);
            System.debug('🔹 Input category: ' + category);
            System.debug('🔹 Input entryType: ' + entryType);
    
            // Fetch Ledger Item record
            Accounting_Ledger_Items__c ledgerItem = [
                SELECT Id, Amount__c 
                FROM Accounting_Ledger_Items__c
                WHERE Id = :ledgerItemId
                LIMIT 1
            ];
    
            Decimal currentAmount = ledgerItem.Amount__c != null ? ledgerItem.Amount__c : 0;
            Decimal updatedAmount;
    
           /* if (category == 'Assets') {
                updatedAmount = currentAmount - amount;
                System.debug(' Asset → Subtracting amount. New value: ' + updatedAmount);
             
            } else if (category == 'Liabilities') {
                updatedAmount = currentAmount + amount;
                System.debug(' Liabilities → Adding amount. New value: ' + updatedAmount);
            } */
            if (entryType == 'Purchases') {
                if (category == 'Assets') {
                    updatedAmount = currentAmount - amount;
                } else if (category == 'Liabilities') {
                    updatedAmount = currentAmount + amount;
                } else {
                    throw new AuraHandledException('Invalid category. Must be Assets or Liabilities.');
                }
            }
            else if (entryType == 'Sales') {
                if (category == 'Assets') {
                    updatedAmount = currentAmount + amount;
                } else if (category == 'Liabilities') {
                    updatedAmount = currentAmount - amount;
                } else {
                    throw new AuraHandledException('Invalid category. Must be Assets or Liabilities.');
                }
            }
            else {
                throw new AuraHandledException('Invalid category. Must be Assets or Liability.');
            }
    
            // Update Ledger Item Amount
            ledgerItem.Amount__c = updatedAmount;
            update ledgerItem;
    
            return true;
    
        } catch (Exception e) {
            System.debug('❌ Error: ' + e.getMessage());
            throw new AuraHandledException('Error updating ledger item: ' + e.getMessage());
        }
    }
  
    // @AuraEnabled
    // public static Accounting_Invoices_Expenses__c updateDataForCashPayment(
    //     String salesEntryJson,
    //     String salesEntryListJson,
    //     String amountEntryJson
    // ) {
    //     Accounting_Invoices_Expenses__c invoiceRecord = new Accounting_Invoices_Expenses__c();
    //     List<Accounting_Journal_Entry__c> entriesToInsert = new List<Accounting_Journal_Entry__c>();
    
    //     try {
    //         System.debug('🔵 Step 1: Incoming Parameters');
    //         System.debug('➡ salesEntryJson: ' + salesEntryJson);
    //         System.debug('➡ salesEntryListJson: ' + salesEntryListJson);
    //         System.debug('➡ amountEntryJson: ' + amountEntryJson);
    //         Map<String, Object> salesEntry = (Map<String, Object>) JSON.deserializeUntyped(salesEntryJson);
    //         Map<String, Object> amountEntry = (Map<String, Object>) JSON.deserializeUntyped(amountEntryJson);
    //         List<Object> rawList = (List<Object>) JSON.deserializeUntyped(salesEntryListJson);
    //          System.debug('➡ Raw sales list: ' + rawList);
    
    //         List<Map<String, Object>> salesEntryList = new List<Map<String, Object>>();
    //         for (Object obj : rawList) {
    //             salesEntryList.add((Map<String, Object>) obj);
    //             System.debug('➡ OBJ: ' + obj);
    //             System.debug('➡ salesEntryList: ' + salesEntryList);

    //         }
    
    //         Decimal subTotal = Decimal.valueOf(String.valueOf(amountEntry.get('subTotal')));
    //         Decimal taxAmount = Decimal.valueOf(String.valueOf(amountEntry.get('taxAmount')));
    //         Decimal totalAmount = Decimal.valueOf(String.valueOf(amountEntry.get('totalAmount')));

    //         System.debug('➡ subTotal: ' + subTotal);
    //         System.debug('➡ taxAmount: ' + taxAmount);
    //         System.debug('➡ totalAmount: ' + totalAmount);
    
    //         invoiceRecord = new Accounting_Invoices_Expenses__c(
    //             Invoice_Date__c = Date.valueOf((String)salesEntry.get('InvoiceDate')),
    //             Invoice_No__c   = (String)salesEntry.get('InvoiceNo'),
    //             Company__c      = (String)salesEntry.get('company'),
    //             Entity_Type__c  = 'Invoice',
    //             GST__c          = taxAmount,
    //             Total_Amount__c = totalAmount,
    //             Sub_Total__c    = subTotal,
    //             isCashPayment__c = true
    //         );
    
    //         insert invoiceRecord;
  
    //         // 3. Fetch GST Ledger Items
    //         Id companyId = (Id) salesEntry.get('company');
            
    //         // GST Collected (Sales) / GST Paid (Purchases)
    //         Map<String, Accounting_Ledger_Items__c> gstLedgers = new Map<String, Accounting_Ledger_Items__c>();
    
    //         for (Accounting_Ledger_Items__c item : [
    //             SELECT Id, Name, Category__r.Name
    //             FROM Accounting_Ledger_Items__c
    //             WHERE Category__r.Name IN ('Liabilities', 'Assets')
    //             AND Category__r.Account_List__r.Company__c = :companyId
    //         ]) {
    //             gstLedgers.put(item.Name, item);
    //         }
    
    //         for (Map<String, Object> entry : salesEntryList) {
    //              System.debug('➡ Entry Data: ' + entry);
    
    //             Decimal amount = Decimal.valueOf(String.valueOf(entry.get('Cash_Paid__c')));
    //             String taxStr = String.valueOf(entry.get('tax')).replace('%', '');
    //             Decimal taxValue = Decimal.valueOf(taxStr);
    //             Decimal taxMultiplier = 1 + (taxValue / 100);
    //             System.debug('➡ Amount__c: ' + amount);
    //             System.debug('➡ taxValue: ' + taxValue);
    //             System.debug('➡ taxMultiplier: ' + taxMultiplier);
    //             // Boolean taxInclusive = Boolean.valueOf(String.valueOf(salesEntry.get('taxInclusive')));
    //             Boolean taxInclusive =true;
    //              System.debug('➡ TaxInclusive: ' + taxInclusive);
    //             Decimal subTotalJE;
    //             Decimal taxAmountJE;
    //             Decimal totalJE;
    
    //             if (taxInclusive) {
    //                 subTotalJE = (amount / taxMultiplier).setScale(2);
    //                 taxAmountJE = (amount - subTotalJE).setScale(2);
    //                 totalJE = amount;

    //             } else {
    //                 subTotalJE = amount;
    //                 taxAmountJE = (amount * taxValue / 100).setScale(2);
    //                 totalJE = (subTotalJE + taxAmountJE).setScale(2);
    //             }
                
    //             System.debug('➡ subTotalJE: ' + subTotalJE);
    //             System.debug('➡ taxAmountJE: ' + taxAmountJE);
    //             System.debug('➡ totalJE: ' + totalJE);

    // 			Decimal paidAmount = Decimal.valueOf(String.valueOf(entry.get('Cash_Paid__c')));
                
    //             Accounting_Journal_Entry__c mainEntry = new Accounting_Journal_Entry__c();
    
    //             mainEntry.Accounting_Invoices_Expenses__c = invoiceRecord.Id;
    //             mainEntry.Description__c = (String) entry.get('Description__c');
    //             mainEntry.Company__c     = (String) salesEntry.get('company');
    //             mainEntry.Entry_Type__c  = 'Purchases';
    
    //             mainEntry.Amount__c      = amount;
    //             mainEntry.Sub_Total__c   = subTotalJE;
    //             mainEntry.Tax_Amount__c  = taxAmountJE;
    //             mainEntry.Total_Amount__c = subTotalJE;
    
    //             mainEntry.Tax_Inclusive__c = taxInclusive;
    //             mainEntry.Tax__c = taxValue;
    
    //             mainEntry.Sl_no__c = Decimal.valueOf(String.valueOf(entry.get('sno')));
    //             mainEntry.Invoice_Date__c = Date.valueOf((String)salesEntry.get('InvoiceDate'));
    //             mainEntry.Invoice_No__c = (String) salesEntry.get('InvoiceNo');
    //             mainEntry.Accounting_Ledger_Items__c = (String) entry.get('accountItemId');
                
    //             entriesToInsert.add(mainEntry);
    
    //             Accounting_Journal_Entry__c gstEntry = new Accounting_Journal_Entry__c();
    
    //             gstEntry.Accounting_Invoices_Expenses__c = invoiceRecord.Id;
    //             gstEntry.Description__c = (String) entry.get('Description__c');
    //             gstEntry.Company__c     = (String) salesEntry.get('company');
    //             gstEntry.Entry_Type__c  = 'Purchases';
    
    //             gstEntry.Total_Amount__c = taxAmountJE;
    
    //             gstEntry.Sl_no__c = mainEntry.Sl_no__c;
    //             gstEntry.Invoice_Date__c = mainEntry.Invoice_Date__c;
    //             gstEntry.Invoice_No__c = mainEntry.Invoice_No__c;
    
    //             // Assign GST Paid Ledger
    //             if (gstLedgers.containsKey('GST Paid')) {
    //                 gstEntry.Accounting_Ledger_Items__c = gstLedgers.get('GST Paid').Id;
    //             }
    
    //             entriesToInsert.add(gstEntry);
    //         }
    
    //         insert entriesToInsert;
    //     }
    //     catch (Exception e) {
    //         throw new AuraHandledException('Error: ' + e.getMessage());
    //     }
    
    //     return invoiceRecord;
    // }
     @AuraEnabled
    public static Accounting_Invoices_Expenses__c updateDataForCashPayment(
        String salesEntryJson,
        String salesEntryListJson,
        String amountEntryJson,
        String paymentJson
    ) {
        Invoice_Payment__c paymentRecord = new Invoice_Payment__c();
        Accounting_Invoices_Expenses__c invoiceRecord = new Accounting_Invoices_Expenses__c();
        List<Accounting_Journal_Entry__c> entriesToInsert = new List<Accounting_Journal_Entry__c>();
    
        try {
            System.debug('🔵 Step 1: Incoming Parameters');
            System.debug('➡ salesEntryJson: ' + salesEntryJson);
            System.debug('➡ salesEntryListJson: ' + salesEntryListJson);
            System.debug('➡ amountEntryJson: ' + amountEntryJson);
            Map<String, Object> salesEntry = (Map<String, Object>) JSON.deserializeUntyped(salesEntryJson);
            Map<String, Object> amountEntry = (Map<String, Object>) JSON.deserializeUntyped(amountEntryJson);
            Map<String,Object> paymentMap       = (Map<String,Object>) JSON.deserializeUntyped(paymentJson);
            List<Object> rawList = (List<Object>) JSON.deserializeUntyped(salesEntryListJson);
            System.debug('➡ Raw sales list: ' + rawList);
            
            List<Map<String, Object>> salesEntryList = new List<Map<String, Object>>();
            for (Object obj : rawList) {
                salesEntryList.add((Map<String, Object>) obj);
                System.debug('➡ OBJ: ' + obj);
                System.debug('➡ salesEntryList: ' + salesEntryList);

            }

            paymentRecord = new Invoice_Payment__c(
            
                Company__c      = (Id) paymentMap.get('company'),
                Payment_Date__c = Date.valueOf((String) paymentMap.get('paymentDate')),
                Total_Amount_Paid__c   = Decimal.valueOf(String.valueOf(paymentMap.get('overalTotalPaid'))),
                Accounting_Ledger_Items__c  = (Id) paymentMap.get('fromLedger'),
                Is_Cash_Payment__c   = (Boolean) paymentMap.get('isCashPayment')
            );
            insert paymentRecord;

    
            Decimal subTotal = Decimal.valueOf(String.valueOf(amountEntry.get('subTotal')));
            Decimal taxAmount = Decimal.valueOf(String.valueOf(amountEntry.get('taxAmount')));
            Decimal totalAmount = Decimal.valueOf(String.valueOf(amountEntry.get('totalAmount')));

            System.debug('➡ subTotal: ' + subTotal);
            System.debug('➡ taxAmount: ' + taxAmount);
            System.debug('➡ totalAmount: ' + totalAmount);
    
            invoiceRecord = new Accounting_Invoices_Expenses__c(
                Invoice_Date__c = Date.valueOf((String)salesEntry.get('InvoiceDate')),
                Invoice_No__c   = (String)salesEntry.get('InvoiceNo'),
                Company__c      = (String)salesEntry.get('company'),
                Entity_Type__c  = 'Invoice',
                GST__c          = taxAmount,
                Total_Amount__c = totalAmount,
                Sub_Total__c    = subTotal,
                isCashPayment__c = true,
                Invoice_Payment__c        = paymentRecord.Id
            );
    
            insert invoiceRecord;
  
            // 3. Fetch GST Ledger Items
            Id companyId = (Id) salesEntry.get('company');
            
            // GST Collected (Sales) / GST Paid (Purchases)
            Map<String, Accounting_Ledger_Items__c> gstLedgers = new Map<String, Accounting_Ledger_Items__c>();
    
            for (Accounting_Ledger_Items__c item : [
                SELECT Id, Name, Category__r.Name
                FROM Accounting_Ledger_Items__c
                WHERE Category__r.Name IN ('Liabilities', 'Assets')
                AND Category__r.Account_List__r.Company__c = :companyId
            ]) {
                gstLedgers.put(item.Name, item);
            }
    
            for (Map<String, Object> entry : salesEntryList) {
                 System.debug('➡ Entry Data: ' + entry);
    
                Decimal amount = Decimal.valueOf(String.valueOf(entry.get('Cash_Paid__c')));
                String taxStr = String.valueOf(entry.get('tax')).replace('%', '');
                Decimal taxValue = Decimal.valueOf(taxStr);
                Decimal taxMultiplier = 1 + (taxValue / 100);
                System.debug('➡ Amount__c: ' + amount);
                System.debug('➡ taxValue: ' + taxValue);
                System.debug('➡ taxMultiplier: ' + taxMultiplier);
                // Boolean taxInclusive = Boolean.valueOf(String.valueOf(salesEntry.get('taxInclusive')));
                Boolean taxInclusive =true;
                 System.debug('➡ TaxInclusive: ' + taxInclusive);
                Decimal subTotalJE;
                Decimal taxAmountJE;
                Decimal totalJE;
    
                if (taxInclusive) {
                    subTotalJE = (amount / taxMultiplier).setScale(2);
                    taxAmountJE = (amount - subTotalJE).setScale(2);
                    totalJE = amount;

                } else {
                    subTotalJE = amount;
                    taxAmountJE = (amount * taxValue / 100).setScale(2);
                    totalJE = (subTotalJE + taxAmountJE).setScale(2);
                }
                
                System.debug('➡ subTotalJE: ' + subTotalJE);
                System.debug('➡ taxAmountJE: ' + taxAmountJE);
                System.debug('➡ totalJE: ' + totalJE);

    			Decimal paidAmount = Decimal.valueOf(String.valueOf(entry.get('Cash_Paid__c')));
                
                Accounting_Journal_Entry__c mainEntry = new Accounting_Journal_Entry__c();
    
                mainEntry.Accounting_Invoices_Expenses__c = invoiceRecord.Id;
                mainEntry.Description__c = (String) entry.get('Description__c');
                mainEntry.Company__c     = (String) salesEntry.get('company');
                mainEntry.Entry_Type__c  = 'Purchases';
    
                mainEntry.Amount__c      = amount;
                mainEntry.Sub_Total__c   = subTotalJE;
                mainEntry.Tax_Amount__c  = taxAmountJE;
                mainEntry.Total_Amount__c = subTotalJE;
    
                mainEntry.Tax_Inclusive__c = taxInclusive;
                mainEntry.Tax__c = taxValue;
    
                mainEntry.Sl_no__c = Decimal.valueOf(String.valueOf(entry.get('sno')));
                mainEntry.Invoice_Date__c = Date.valueOf((String)salesEntry.get('InvoiceDate'));
                mainEntry.Invoice_No__c = (String) salesEntry.get('InvoiceNo');
                mainEntry.Accounting_Ledger_Items__c = (String) entry.get('accountItemId');
                
                entriesToInsert.add(mainEntry);
    
                Accounting_Journal_Entry__c gstEntry = new Accounting_Journal_Entry__c();
    
                gstEntry.Accounting_Invoices_Expenses__c = invoiceRecord.Id;
                gstEntry.Description__c = (String) entry.get('Description__c');
                gstEntry.Company__c     = (String) salesEntry.get('company');
                gstEntry.Entry_Type__c  = 'Purchases';
    
                gstEntry.Total_Amount__c = taxAmountJE;
    
                gstEntry.Sl_no__c = mainEntry.Sl_no__c;
                gstEntry.Invoice_Date__c = mainEntry.Invoice_Date__c;
                gstEntry.Invoice_No__c = mainEntry.Invoice_No__c;
    
                // Assign GST Paid Ledger
                if (gstLedgers.containsKey('GST Paid')) {gstEntry.Accounting_Ledger_Items__c = gstLedgers.get('GST Paid').Id;
                }
    
                entriesToInsert.add(gstEntry);
            }
    
            insert entriesToInsert;
        }
        catch (Exception e) {
            throw new AuraHandledException('Error: ' + e.getMessage());
        }
    
        return invoiceRecord;
    }
    // @AuraEnabled
    // public static Accounting_Invoices_Expenses__c updateDataForCashReceipt(
    //     String salesEntryJson,
    //     String salesEntryListJson,
    //     String amountEntryJson
    // ) {
    //     Accounting_Invoices_Expenses__c invoiceRecord = new Accounting_Invoices_Expenses__c();
    //     List<Accounting_Journal_Entry__c> entriesToInsert = new List<Accounting_Journal_Entry__c>();
    
    //     try {
    //         System.debug('🔵 Step 1: Incoming Parameters');
    //         System.debug('➡ salesEntryJson: ' + salesEntryJson);
    //         System.debug('➡ salesEntryListJson: ' + salesEntryListJson);
    //         System.debug('➡ amountEntryJson: ' + amountEntryJson);
    //         Map<String, Object> salesEntry = (Map<String, Object>) JSON.deserializeUntyped(salesEntryJson);
    //         Map<String, Object> amountEntry = (Map<String, Object>) JSON.deserializeUntyped(amountEntryJson);
    //         List<Object> rawList = (List<Object>) JSON.deserializeUntyped(salesEntryListJson);
    
    //         List<Map<String, Object>> salesEntryList = new List<Map<String, Object>>();
    //         for (Object obj : rawList) {
    //             salesEntryList.add((Map<String, Object>) obj);
    //         }
    
    //         Decimal subTotal = Decimal.valueOf(String.valueOf(amountEntry.get('subTotal')));
    //         Decimal taxAmount = Decimal.valueOf(String.valueOf(amountEntry.get('taxAmount')));
    //         Decimal totalAmount = Decimal.valueOf(String.valueOf(amountEntry.get('totalAmount')));
    
    //         invoiceRecord = new Accounting_Invoices_Expenses__c(
    //             Invoice_Date__c = Date.valueOf((String)salesEntry.get('InvoiceDateReceit')),
    //             Invoice_No__c   = (String)salesEntry.get('InvoiceNoReceit'),
    //             Company__c      = (String)salesEntry.get('company'),
    //             Entity_Type__c  = 'Invoice',
    //             GST__c          = taxAmount,
    //             Total_Amount__c = totalAmount,
    //             Sub_Total__c    = subTotal,
    //             //isCashPayment__c = true
    //             IsCashReceivedFlag__c = true
    //         );
    
    //         insert invoiceRecord;
  
    //         // 3. Fetch GST Ledger Items
    //         Id companyId = (Id) salesEntry.get('company');
            
    //         // GST Collected (Sales) / GST Paid (Purchases)
    //         Map<String, Accounting_Ledger_Items__c> gstLedgers = new Map<String, Accounting_Ledger_Items__c>();
    
    //         for (Accounting_Ledger_Items__c item : [
    //             SELECT Id, Name, Category__r.Name
    //             FROM Accounting_Ledger_Items__c
    //             WHERE Category__r.Name IN ('Liabilities', 'Assets')
    //             AND Category__r.Account_List__r.Company__c = :companyId
    //         ]) {
    //             gstLedgers.put(item.Name, item);
    //         }
    
    //         for (Map<String, Object> entry : salesEntryList) {
    
    //             Decimal amount = Decimal.valueOf(String.valueOf(entry.get('Cash_Receit__c')));
    //             String taxStr = String.valueOf(entry.get('taxValueReceit')).replace('%', '');
    //             System.debug('➡ taxStr: ' + taxStr);
    //             Decimal taxValue = Decimal.valueOf(taxStr);
    //               System.debug('➡ taxValue: ' + taxValue);
    //             Decimal taxMultiplier = 1 + (taxValue / 100); 
    //               System.debug('➡ taxMultiplier: ' + taxMultiplier);
    //             // Boolean taxInclusive = Boolean.valueOf(String.valueOf(salesEntry.get('taxInclusiveReceit')));
    //               Boolean taxInclusive = true;
    //               System.debug('➡ taxInclusive: ' + taxInclusive);
    //             Decimal subTotalJE;
    //             Decimal taxAmountJE;
    //             Decimal totalJE;
    
    //             if (taxInclusive) {
    //                 subTotalJE = (amount / taxMultiplier).setScale(2);
    //                 taxAmountJE = (amount - subTotalJE).setScale(2);
    //                 totalJE = amount;
    //             } else {
    //                 subTotalJE = amount;
    //                 taxAmountJE = (amount * taxValue / 100).setScale(2);
    //                 totalJE = (subTotalJE + taxAmountJE).setScale(2);
    //             }
    //             System.debug('➡ CALCULATED SUBTOTAL: ' + subTotalJE);
    //             System.debug('➡ CALCULATED TAX: ' + taxAmountJE);
    //             System.debug('➡ CALCULATED totalJE: ' + totalJE);
    //             /* System.debug('➡ LOOP ENTRY RAW: ' + JSON.serialize(entry));

    //             Decimal amount = Decimal.valueOf(String.valueOf(entry.get('Amount_Receit__c')));
            
    //             // ❗ FIXED — handles both "tax" and "taxValueReceit"
    //             String rawTax = String.valueOf(
    //                 entry.containsKey('tax') ? entry.get('tax') : entry.get('taxValueReceit')
    //             );
    //             System.debug('➡ RAW TAX: ' + rawTax);
            
    //             rawTax = rawTax.replace('%', '');
    //             System.debug('➡ CLEANED TAX: ' + rawTax);
            
    //             Decimal taxValue;
    //             try {
    //                 taxValue = Decimal.valueOf(rawTax);
    //             } catch (Exception ex) {
    //                 System.debug('❌ TAX PARSE ERROR: ' + ex.getMessage());
    //                 throw new AuraHandledException('Tax value is invalid: ' + rawTax);
    //             }
            
    //             Decimal taxMultiplier = 1 + (taxValue / 100);
            
    //             Boolean taxInclusive = Boolean.valueOf(String.valueOf(salesEntry.get('taxInclusiveReceit')));
            
    //             Decimal subTotalJE;
    //             Decimal taxAmountJE;
            
    //             if (taxInclusive) {
    //                 subTotalJE = (amount / taxMultiplier).setScale(2);
    //                 taxAmountJE = (amount - subTotalJE).setScale(2);
    //             } else {
    //                 subTotalJE = amount;
    //                 taxAmountJE = (amount * taxValue / 100).setScale(2);
    //             }
            
    //             System.debug('➡ CALCULATED SUBTOTAL: ' + subTotalJE);
    //             System.debug('➡ CALCULATED TAX: ' + taxAmountJE);*/
    // 			Decimal paidAmount = Decimal.valueOf(String.valueOf(entry.get('Cash_Receit__c')));
                
    //             Accounting_Journal_Entry__c mainEntry = new Accounting_Journal_Entry__c();
    
    //             mainEntry.Accounting_Invoices_Expenses__c = invoiceRecord.Id;
    //             mainEntry.Description__c = (String) entry.get('Description_Receit__c');
    //             mainEntry.Company__c     = (String) salesEntry.get('company');
    //             mainEntry.Entry_Type__c  = 'Sales';
    
    //             mainEntry.Amount__c      = amount;
    //             mainEntry.Sub_Total__c   = subTotalJE;
    //             mainEntry.Tax_Amount__c  = taxAmountJE;
    //             mainEntry.Total_Amount__c = subTotalJE;
    
    //             mainEntry.Tax_Inclusive__c = taxInclusive;
    //             mainEntry.Tax__c = taxValue;
    
    //             mainEntry.Sl_no__c = Decimal.valueOf(String.valueOf(entry.get('sno')));
    //             mainEntry.Invoice_Date__c = Date.valueOf((String)salesEntry.get('InvoiceDateReceit'));
    //             mainEntry.Invoice_No__c = (String) salesEntry.get('InvoiceNoReceit');
    //             mainEntry.Accounting_Ledger_Items__c = (String) entry.get('accountItemIdReceit');
                
    //             entriesToInsert.add(mainEntry);
    // 		    System.debug('🟩 MAIN ENTRY ADDED: ' + JSON.serialize(mainEntry));
    //             Accounting_Journal_Entry__c gstEntry = new Accounting_Journal_Entry__c();
    
    //             gstEntry.Accounting_Invoices_Expenses__c = invoiceRecord.Id;
    //             gstEntry.Description__c = (String) entry.get('Description_Receit__c');
    //             gstEntry.Company__c     = (String) salesEntry.get('company');
    //             gstEntry.Entry_Type__c  = 'Sales';
    
    //             gstEntry.Total_Amount__c = taxAmountJE;
    
    //             gstEntry.Sl_no__c = mainEntry.Sl_no__c;
    //             gstEntry.Invoice_Date__c = mainEntry.Invoice_Date__c;
    //             gstEntry.Invoice_No__c = mainEntry.Invoice_No__c;
    
    //             // Assign GST Paid Ledger
    //             if (gstLedgers.containsKey('GST Collected')) {
    //                 gstEntry.Accounting_Ledger_Items__c = gstLedgers.get('GST Collected').Id;
    //             }
    
    //             entriesToInsert.add(gstEntry);
    //             System.debug('🟩 GST ENTRY ADDED: ' + JSON.serialize(gstEntry));
    //         }
    // 		System.debug('🟦 FINAL ENTRIES TO INSERT: ' + JSON.serialize(entriesToInsert));
    //         insert entriesToInsert;
    //     }
    //     catch (Exception e) {
    //         throw new AuraHandledException('Error: ' + e.getMessage());
    //     }
    
    //     return invoiceRecord;
    // }
     @AuraEnabled
    public static Accounting_Invoices_Expenses__c updateDataForCashReceipt(String salesEntryJson, String salesEntryListJson, String amountEntryJson,String paymentJson) {
       
        Invoice_Payment__c paymentRecord = new Invoice_Payment__c();
        Accounting_Invoices_Expenses__c invoiceRecord = new Accounting_Invoices_Expenses__c();
        List<Accounting_Journal_Entry__c> entriesToInsert = new List<Accounting_Journal_Entry__c>();
    
        try {
            System.debug('🔵 Step 1: Incoming Parameters');
            System.debug('➡ salesEntryJson: ' + salesEntryJson);
            System.debug('➡ salesEntryListJson: ' + salesEntryListJson);
            System.debug('➡ amountEntryJson: ' + amountEntryJson);
            System.debug('➡ paymentJson: ' + paymentJson);
            Map<String, Object> salesEntry = (Map<String, Object>) JSON.deserializeUntyped(salesEntryJson);
            Map<String, Object> amountEntry = (Map<String, Object>) JSON.deserializeUntyped(amountEntryJson);
            Map<String,Object> paymentMap       = (Map<String,Object>) JSON.deserializeUntyped(paymentJson);
            List<Object> rawList = (List<Object>) JSON.deserializeUntyped(salesEntryListJson);
    
            List<Map<String, Object>> salesEntryList = new List<Map<String, Object>>();
            for (Object obj : rawList) {
                salesEntryList.add((Map<String, Object>) obj);
            }
            
            paymentRecord = new Invoice_Payment__c(
            
                Company__c      = (Id) paymentMap.get('company'),
                Payment_Date__c = Date.valueOf((String) paymentMap.get('paymentDate')),
                Total_Amount_Received__c   = Decimal.valueOf(String.valueOf(paymentMap.get('overalTotalReceived'))),
                Accounting_Ledger_Items__c  = (Id) paymentMap.get('fromLedger'),
                Is_Cash_Received__c   = (Boolean) paymentMap.get('isCashReceived')
            );
            insert paymentRecord;

            Decimal subTotal = Decimal.valueOf(String.valueOf(amountEntry.get('subTotal')));
            Decimal taxAmount = Decimal.valueOf(String.valueOf(amountEntry.get('taxAmount')));
            Decimal totalAmount = Decimal.valueOf(String.valueOf(amountEntry.get('totalAmount')));
    
            invoiceRecord = new Accounting_Invoices_Expenses__c(
                Invoice_Date__c = Date.valueOf((String)salesEntry.get('InvoiceDateReceit')),
                Invoice_No__c   = (String)salesEntry.get('InvoiceNoReceit'),
                Company__c      = (String)salesEntry.get('company'),
                Entity_Type__c  = 'Invoice',
                GST__c          = taxAmount,
                Total_Amount__c = totalAmount,
                Sub_Total__c    = subTotal,
                //isCashPayment__c = true
                IsCashReceivedFlag__c = true,
                Invoice_Payment__c  = paymentRecord.Id
            );
    
            insert invoiceRecord;
  
            // 3. Fetch GST Ledger Items
            Id companyId = (Id) salesEntry.get('company');
            
            // GST Collected (Sales) / GST Paid (Purchases)
            Map<String, Accounting_Ledger_Items__c> gstLedgers = new Map<String, Accounting_Ledger_Items__c>();
    
            for (Accounting_Ledger_Items__c item : [
                SELECT Id, Name, Category__r.Name
                FROM Accounting_Ledger_Items__c
                WHERE Category__r.Name IN ('Liabilities', 'Assets')
                AND Category__r.Account_List__r.Company__c = :companyId
            ]) {
                gstLedgers.put(item.Name, item);
            }
    
            for (Map<String, Object> entry : salesEntryList) {
    
                Decimal amount = Decimal.valueOf(String.valueOf(entry.get('Cash_Receit__c')));
                String taxStr = String.valueOf(entry.get('taxValueReceit')).replace('%', '');
                System.debug('➡ taxStr: ' + taxStr);
                Decimal taxValue = Decimal.valueOf(taxStr);
                  System.debug('➡ taxValue: ' + taxValue);
                Decimal taxMultiplier = 1 + (taxValue / 100); 
                  System.debug('➡ taxMultiplier: ' + taxMultiplier);
                // Boolean taxInclusive = Boolean.valueOf(String.valueOf(salesEntry.get('taxInclusiveReceit')));
                  Boolean taxInclusive = true;
                  System.debug('➡ taxInclusive: ' + taxInclusive);
                Decimal subTotalJE;
                Decimal taxAmountJE;
                Decimal totalJE;
    
                if (taxInclusive) {
                    subTotalJE = (amount / taxMultiplier).setScale(2);
                    taxAmountJE = (amount - subTotalJE).setScale(2);
                    totalJE = amount;} else {subTotalJE = amount;taxAmountJE = (amount * taxValue / 100).setScale(2);totalJE = (subTotalJE + taxAmountJE).setScale(2);
                }
                System.debug('➡ CALCULATED SUBTOTAL: ' + subTotalJE);
                System.debug('➡ CALCULATED TAX: ' + taxAmountJE);
                System.debug('➡ CALCULATED totalJE: ' + totalJE);
                /* System.debug('➡ LOOP ENTRY RAW: ' + JSON.serialize(entry));

                Decimal amount = Decimal.valueOf(String.valueOf(entry.get('Amount_Receit__c')));
            
                // ❗ FIXED — handles both "tax" and "taxValueReceit"
                String rawTax = String.valueOf(
                    entry.containsKey('tax') ? entry.get('tax') : entry.get('taxValueReceit')
                );
                System.debug('➡ RAW TAX: ' + rawTax);
            
                rawTax = rawTax.replace('%', '');
                System.debug('➡ CLEANED TAX: ' + rawTax);
            
                Decimal taxValue;
                try {
                    taxValue = Decimal.valueOf(rawTax);
                } catch (Exception ex) {
                    System.debug('❌ TAX PARSE ERROR: ' + ex.getMessage());
                    throw new AuraHandledException('Tax value is invalid: ' + rawTax);
                }
            
                Decimal taxMultiplier = 1 + (taxValue / 100);
            
                Boolean taxInclusive = Boolean.valueOf(String.valueOf(salesEntry.get('taxInclusiveReceit')));
            
                Decimal subTotalJE;
                Decimal taxAmountJE;
            
                if (taxInclusive) {
                    subTotalJE = (amount / taxMultiplier).setScale(2);
                    taxAmountJE = (amount - subTotalJE).setScale(2);
                } else {
                    subTotalJE = amount;
                    taxAmountJE = (amount * taxValue / 100).setScale(2);
                }
            
                System.debug('➡ CALCULATED SUBTOTAL: ' + subTotalJE);
                System.debug('➡ CALCULATED TAX: ' + taxAmountJE);*/
    			Decimal paidAmount = Decimal.valueOf(String.valueOf(entry.get('Cash_Receit__c')));
                
                Accounting_Journal_Entry__c mainEntry = new Accounting_Journal_Entry__c();
    
                mainEntry.Accounting_Invoices_Expenses__c = invoiceRecord.Id;
                mainEntry.Description__c = (String) entry.get('Description_Receit__c');
                mainEntry.Company__c     = (String) salesEntry.get('company');
                mainEntry.Entry_Type__c  = 'Sales';
    
                mainEntry.Amount__c      = amount;
                mainEntry.Sub_Total__c   = subTotalJE;
                mainEntry.Tax_Amount__c  = taxAmountJE;
                mainEntry.Total_Amount__c = subTotalJE;
    
                mainEntry.Tax_Inclusive__c = taxInclusive;
                mainEntry.Tax__c = taxValue;
    
                mainEntry.Sl_no__c = Decimal.valueOf(String.valueOf(entry.get('sno')));
                mainEntry.Invoice_Date__c = Date.valueOf((String)salesEntry.get('InvoiceDateReceit'));
                mainEntry.Invoice_No__c = (String) salesEntry.get('InvoiceNoReceit');
                mainEntry.Accounting_Ledger_Items__c = (String) entry.get('accountItemIdReceit');
                
                entriesToInsert.add(mainEntry);
    		    System.debug('🟩 MAIN ENTRY ADDED: ' + JSON.serialize(mainEntry));
                Accounting_Journal_Entry__c gstEntry = new Accounting_Journal_Entry__c();
    
                gstEntry.Accounting_Invoices_Expenses__c = invoiceRecord.Id;
                gstEntry.Description__c = (String) entry.get('Description_Receit__c');
                gstEntry.Company__c     = (String) salesEntry.get('company');
                gstEntry.Entry_Type__c  = 'Sales';
    
                gstEntry.Total_Amount__c = taxAmountJE;
    
                gstEntry.Sl_no__c = mainEntry.Sl_no__c;
                gstEntry.Invoice_Date__c = mainEntry.Invoice_Date__c;
                gstEntry.Invoice_No__c = mainEntry.Invoice_No__c;
    
                // Assign GST Paid Ledger
                if (gstLedgers.containsKey('GST Collected')) {gstEntry.Accounting_Ledger_Items__c = gstLedgers.get('GST Collected').Id;
                }
    
                entriesToInsert.add(gstEntry);
                System.debug('🟩 GST ENTRY ADDED: ' + JSON.serialize(gstEntry));
            }
    		System.debug('🟦 FINAL ENTRIES TO INSERT: ' + JSON.serialize(entriesToInsert));
            insert entriesToInsert;
        }
        catch (Exception e) {
            throw new AuraHandledException('Error: ' + e.getMessage());
        }
    
        return invoiceRecord;
    }
    
    
      @AuraEnabled(cacheable=false)
    public static Map<String, Object> getAccountingPaymentPdf(Id paymentId) {

        Map<String, Object> result = new Map<String, Object>();

        // Parent payment
        Invoice_Payment__c payment = [
            SELECT Id, Name, Payment_Date__c, Total_Amount_Paid__c,Entity_Profile__c, Company__c, Payee__c, Accounting_Ledger_Items__c,Amazon_URL__c,
                Entity_Profile__r.Name__c, Entity_Profile__r.First_Name__c,Entity_Profile__r.Last_Name__c,
             	Company__r.ABN__c,Company__r.Phone_Number__c,Company__r.Address_Latest__Street__s,
                Company__r.Address_Latest__City__s,Company__r.Address_Latest__StateCode__s,Company__r.Address_Latest__PostalCode__s
            FROM Invoice_Payment__c
            WHERE Id = :paymentId
            LIMIT 1
        ];

        // Child invoices
        List<Accounting_Invoices_Expenses__c> childInvoices = [
            SELECT Id, Name, Amount_Paid__c, Balance_Amount__c,
             Invoice_No__c,  Invoice_Date__c,Total_Amount__c, Invoice_Payment__c,Payment_History_JSON__c
            FROM Accounting_Invoices_Expenses__c
            WHERE Invoice_Payment__c = :paymentId
        ];

        result.put('payment', payment);
        result.put('invoices', childInvoices);

        return result;
    }
     @AuraEnabled
    public static Map<String, String> getentityEmailForPaymentInvoices(String invoiceId) {
    
        Map<String, String> emailMap = new Map<String, String>();
    
        if (String.isBlank(invoiceId)) {
            System.debug('Invoice ID is null.');
            return emailMap;
        }
    
        List<Invoice_Payment__c> invoices = [
            SELECT Id,  Entity_Profile__c, Entity_Profile__r.Email__c, Entity_Profile__r.cc__c,Entity_Profile__r.To_Email__c
                FROM Invoice_Payment__c WHERE Id = :invoiceId
            ];
    
        System.debug('📄 Query Result: ' + JSON.serialize(invoices));
    
        if (!invoices.isEmpty()) 

        {
            String toEmail = invoices[0].Entity_Profile__r.To_Email__c;
            String ccEmail = invoices[0].Entity_Profile__r.cc__c;
    
            emailMap.put('to', toEmail);
            emailMap.put('cc', ccEmail);
    
            System.debug('📧 To Email: ' + toEmail);
            System.debug('📨 CC Email: ' + ccEmail);
        }
    
        return emailMap;
    }
    @AuraEnabled
    public static  Map<String, String> getEmailBodyforParentInvoices(
        Id invoiceid
        //String invoiceDate
    ) {
        try {
            System.debug('invoiceid >> ' + invoiceid);
           
            // Get current user and organization
            Id currentUserId = UserInfo.getUserId();
            User u = [SELECT Id, Organization_Name__c FROM User WHERE Id = :currentUserId];
            System.debug('u >> ' + u);
            Organisation__c org = [
                SELECT Id, Name, Email__c, Bank__c, Account_Name__c, BSB__c, Account_Number__c 
                FROM Organisation__c 
                WHERE Name = :u.Organization_Name__c
                LIMIT 1
            ];
            System.debug('org >> ' + org);
            // Get Invoice Record
            Invoice_Payment__c AJE = [
                SELECT Id, Name, Payment_Date__c, Total_Amount_Paid__c,Entity_Profile__c, Company__c, Payee__c, Accounting_Ledger_Items__c,Amazon_URL__c,Company__r.Company_Name__c,
                    Company__r.ABN__c,Company__r.Phone_Number__c,Company__r.Address_Latest__Street__s,Entity_Profile__r.First_Name__c,Entity_Profile__r.Last_Name__c,
                    Entity_Profile__r.Name__c,Company__r.Address_Latest__City__s,Company__r.Address_Latest__StateCode__s,Company__r.Address_Latest__PostalCode__s,
                    (SELECT Id, Name, Amount_Paid__c, Balance_Amount__c,Invoice_No__c,  Invoice_Date__c,Total_Amount__c, Invoice_Payment__c
                       FROM Accounting_Invoices_Expenses__r )
                FROM Invoice_Payment__c 
                WHERE Id = :invoiceid
            ];
            System.debug('AJE >> ' + AJE);
           
            Entity_Profile__c entity = AJE.Entity_Profile__r;

            // Build entity name properly
            String entityName = '';

            if (entity != null) {
                // If first/last name present, use that
                if (!String.isBlank(entity.First_Name__c) || !String.isBlank(entity.Last_Name__c)) {
                    entityName =
                        (entity.First_Name__c != null ? entity.First_Name__c + ' ' : '') +
                        (entity.Last_Name__c != null ? entity.Last_Name__c : '');
                } else {
                    // Otherwise use Name field
                    entityName = entity.Name__c;
                }
            }

            System.debug('Entity Name >> ' + entityName);
            // Format dates
            //String formattedStartDate = formatDateDDMMYYYY(invoiceStartDate);
            //String formattedEndDate = formatDateDDMMYYYY(invoiceEndDate);
            //String formattedInvoiceDate = formatDateDDMMYYYY(invoiceDate);
            System.debug('AJE >> ' + AJE);
            String formattedPaymentDate = formatDateDDMMYYYY(AJE.Payment_Date__c);
            System.debug('formattedPaymentDate >> ' + formattedPaymentDate);

           // String fileName = AJE.Name;
           List<String> childInvoiceNumbers = new List<String>();

            if (AJE.Accounting_Invoices_Expenses__r != null && !AJE.Accounting_Invoices_Expenses__r.isEmpty()) {
                for (Accounting_Invoices_Expenses__c inv : AJE.Accounting_Invoices_Expenses__r) {
                    if (!String.isBlank(inv.Invoice_No__c)) {
                        childInvoiceNumbers.add(inv.Invoice_No__c);
                    }
                }
            }

            // Convert to: INV-1001, INV-1002, INV-1009
            String allInvoiceNos = String.join(childInvoiceNumbers, ', ');
            System.debug('All Invoice Nos >> ' + allInvoiceNos);
          
            Map<String, String> result = new Map<String, String>();
   			String subject =  'Remittance Advice - ' + AJE.Company__r.Company_Name__c;
   			String body = 
                        'Dear <b>' + entityName + '</b>,<br/><br/>' +
                        'Please find the attached remittance advice for the recent payment processed to your <b>' + 
                         '</b> account. It includes details of the invoices, payment reference, and the amounts settled. <b>'   + '</b>.<br/><br/>' +
                    
                        'If you have any questions, please feel free to reach out.<br/><br/>' +
                        'Thank you for your continued partnership.' ;
                
                	result.put('subject', subject);
        			result.put('body', body);
                   return result;
   
           
            
        } catch (Exception ex) {
            throw new AuraHandledException('Error sending invoice email: ' + ex.getMessage());
        }
    }
     public static String formatDateDDMMYYYY(Date inputDate) {
        String day = inputDate.day() < 10 ? '0' + inputDate.day() : String.valueOf(inputDate.day());
        String month = inputDate.month() < 10 ? '0' + inputDate.month() : String.valueOf(inputDate.month());
        String year = String.valueOf(inputDate.year());
        return day + '/' + month + '/' + year;
    }
     @AuraEnabled
    public static void sendEmailforInvoicePayments(Id invoiceid, String toAddress, String ccAddress, String url, String subject,String body) {
        try {
            System.debug('invoiceid >> ' + invoiceid);
            System.debug('toAddress >> ' + toAddress);
            System.debug('ccAddress >> ' + ccAddress);
            System.debug('url >> ' + url);
            //System.debug('subject >> ' + subject);
            //System.debug('body >> ' + body);
            // Get current user and organization
            Id currentUserId = UserInfo.getUserId();
            User u = [SELECT Id, Organization_Name__c FROM User WHERE Id = :currentUserId];
            System.debug('u >> ' + u);
            Organisation__c org = [
                SELECT Id, Name, Email__c, Bank__c, Account_Name__c, BSB__c, Account_Number__c 
                FROM Organisation__c 
                WHERE Name = :u.Organization_Name__c
                LIMIT 1
            ];
            System.debug('org >> ' + org);
            // Get Invoice Record
            Invoice_Payment__c AJE = [
                SELECT Id, Name, Payment_Date__c, Total_Amount_Paid__c,Entity_Profile__c, Company__c, Payee__c, Accounting_Ledger_Items__c,Amazon_URL__c,Company__r.Company_Name__c,
                    Company__r.ABN__c,Company__r.Phone_Number__c,Company__r.Address_Latest__Street__s,Entity_Profile__r.First_Name__c,Entity_Profile__r.Last_Name__c,
                    Entity_Profile__r.Name__c,Company__r.Address_Latest__City__s,Company__r.Address_Latest__StateCode__s,Company__r.Address_Latest__PostalCode__s,
                    (SELECT Id, Name, Amount_Paid__c, Balance_Amount__c,Invoice_No__c,  Invoice_Date__c,Total_Amount__c, Invoice_Payment__c
                       FROM Accounting_Invoices_Expenses__r )
                FROM Invoice_Payment__c 
                WHERE Id = :invoiceid
            ];
            System.debug('AJE >> ' + AJE);
            
            // HTTP Callout to get PDF
            Http http = new Http();
            HttpRequest req = new HttpRequest();
            req.setEndpoint(url);
            req.setMethod('GET');
            req.setTimeout(60000);
            
            HttpResponse res = http.send(req);if (res.getStatusCode() != 200) {throw new AuraHandledException('Failed to download invoice PDF. Status code: ' + res.getStatusCode()); }Blob fileBody = res.getBodyAsBlob();
                
                // Prepare email attachment
                Messaging.EmailFileAttachment attachment = new Messaging.EmailFileAttachment();
                attachment.setFileName(AJE.Name+'.pdf');
                attachment.setBody(fileBody);
                attachment.setContentType('application/pdf');
                                
                // Compose email
                Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
                if (String.isNotBlank(toAddress)) {
                    email.setToAddresses(toAddress.split('\\s*,\\s*'));
                }
                
                if (String.isNotBlank(ccAddress)) {
                   // email.setCcAddresses(new List<String>{ ccAddress });
                    email.setCcAddresses(ccAddress.split('\\s*,\\s*'));
                }
                
                email.setSubject(subject);
                email.setHtmlBody(body);
                
                email.setFileAttachments(new List<Messaging.EmailFileAttachment>{ attachment });
                
                // Use Org-Wide Email Address from Custom Label
                List<OrgWideEmailAddress> oweList = [
                    SELECT Id, Address 
                    FROM OrgWideEmailAddress 
                    WHERE Address = :System.Label.OrgWideEmailAddress 
                    LIMIT 1
                ];
                if (!oweList.isEmpty()) {
                    email.setOrgWideEmailAddressId(oweList[0].Id);
                } else {
                    throw new AuraHandledException('No Org-Wide Email Address found for: ' + System.Label.OrgWideEmailAddress);
                }
                
                // Send the email
                Messaging.sendEmail(new List<Messaging.Email>{ email });
                
               
               // AJE.Email_Count__c = (AJE.Email_Count__c == null) ? 1 : AJE.Email_Count__c + 1;
                update AJE ;
        
                return ;
    
           
            
        } catch (Exception ex) {
            throw new AuraHandledException('Error sending invoice email: ' + ex.getMessage());
        }
    }
   /*@AuraEnabled
    public static String getNextOverpaymentNumber(Id companyId) {

        // Query last OP record
        List<Invoice_Over_Payment__c> lastList = [
            SELECT Id,Over_Payment_No__c
            FROM Invoice_Over_Payment__c
            WHERE Over_Payment_No__c LIKE 'OP-%'
            AND Company__c = :companyId
            ORDER BY CreatedDate DESC
            LIMIT 1
        ];

        // No records found → return first OP number
        if (lastList.isEmpty() || lastList[0].Over_Payment_No__c  == null) {
            return 'OP-{0001}';
        }

        String lastOp = lastList[0].Over_Payment_No__c ;

        // Extract digits inside { }
        String numStr = lastOp.substringBetween('{', '}');

        Integer nextNum = Integer.valueOf(numStr) + 1;

        // MANUAL ZERO PADDING (works in all Apex versions)
        String padded = String.valueOf(nextNum);
        while (padded.length() < 4) {
            padded = '0' + padded;
        }

        return 'OP-{' + padded + '}';
    }*/
    @AuraEnabled
    public static String getNextOverpaymentNumber(Id companyId) {

        // Query last OP record
        List<Invoice_Over_Payment__c> lastList = [
            SELECT Id, Over_Payment_No__c
            FROM Invoice_Over_Payment__c
            WHERE Over_Payment_No__c LIKE 'OP-%'
            AND Company__c = :companyId
            ORDER BY CreatedDate DESC
            LIMIT 1
        ];

        // No previous OP records
        if (lastList.isEmpty() || lastList[0].Over_Payment_No__c == null) {
            return 'OP-0001';
        }

        String lastOp = lastList[0].Over_Payment_No__c;

        // Expecting format: OP-0001
        String numStr = lastOp.substringAfter('OP-');

        Integer nextNum = Integer.valueOf(numStr) + 1;

        // Manual zero-padding to length 4
        String padded = String.valueOf(nextNum);
        while (padded.length() < 4) {
            padded = '0' + padded;
        }

        return 'OP-' + padded;
    }

   /* @AuraEnabled
    public static Id saveOverpaymentRecord(
        Id companyId,
        Id paymentId,
        Decimal amount,
        Date paymentDate,
        String opNumber,
        Boolean isSpendMoney
    ) {
        // 1️⃣ Query BOTH ledger items once
        List<Accounting_Ledger_Items__c> ledgerItems = [
            SELECT Id, Name 
            FROM Accounting_Ledger_Items__c
            WHERE Name IN ('Supplier Over Payment', 'Customer Over Payment')
            AND Category__r.Account_List__r.Company__c = :companyId
        ];

        // 2️⃣ Build map WITHOUT another SOQL or looping SOQL
        Map<String, Id> ledgerMap = new Map<String, Id>();
        for (Accounting_Ledger_Items__c li : ledgerItems) {
            ledgerMap.put(li.Name, li.Id);
        }

        // 3️⃣ Decide which ledger to assign
        String ledgerName = isSpendMoney
            ? 'Supplier Over Payment'
            : 'Customer Over Payment';

        // 4️⃣ Validation
        if (!ledgerMap.containsKey(ledgerName)) {
            throw new AuraHandledException(
                'Missing Ledger Item: ' + ledgerName + 'in Chart of Accounts.'
               
            );
        }

        Invoice_Over_Payment__c op = new Invoice_Over_Payment__c();
        op.Company__c = companyId;
        op.Invoice_Payment__c = paymentId;
        op.Amount__c = amount;
        op.Payment_Date__c = paymentDate;
        op.Over_Payment_No__c = opNumber;
        op.Accounting_Ledger_Items__c = ledgerMap.get(ledgerName);
        op.Is_Spend_Money__c=isSpendMoney;
        op.Is_Receive_Money__c=isSpendMoney;

        insert op;

        return op.Id;
    }*/
    @AuraEnabled
    public static Id saveOverpaymentRecord(
        Id companyId,
        Id paymentId,
        Decimal amount,
        Date paymentDate,
        String opNumber,
        Boolean isSpendMoney
    ) {

        System.debug('🔵 saveOverpaymentRecord() CALLED');
        System.debug('➡ companyId: ' + companyId);
        System.debug('➡ paymentId: ' + paymentId);
        System.debug('➡ amount: ' + amount);
        System.debug('➡ paymentDate: ' + paymentDate);
        System.debug('➡ opNumber: ' + opNumber);
        System.debug('➡ isSpendMoney: ' + isSpendMoney);
        // 1️⃣ Query ledger items once
        List<Accounting_Ledger_Items__c> ledgerItems = [
            SELECT Id, Name, Amount__c
            FROM Accounting_Ledger_Items__c
            WHERE Name IN ('Supplier Over Payment', 'Customer Over Payment')
            AND Category__r.Account_List__r.Company__c = :companyId
        ];
        System.debug('🟣 Ledger Items Returned: ' + ledgerItems);
        // 2️⃣ Build map
        Map<String, Accounting_Ledger_Items__c> ledgerMap = new Map<String, Accounting_Ledger_Items__c>();
        for (Accounting_Ledger_Items__c li : ledgerItems) {
            ledgerMap.put(li.Name, li);
        }

        // 3️⃣ Select correct ledger name
        String ledgerName = isSpendMoney
            ? 'Supplier Over Payment'
            : 'Customer Over Payment';
        System.debug('🟠 Required Ledger Name: ' + ledgerName);

        // 4️⃣ Validate ledger availability

        System.debug('🟣 ledgerMap Keys: ' + ledgerMap.keySet());
        if (!ledgerMap.containsKey(ledgerName)) {
            System.debug('❌ Ledger not found in map!');
            throw new AuraHandledException(
                'Missing Ledger Item: ' + ledgerName + ' in Chart of Accounts.'
            );
        }

        // Extract ledger item object
        Accounting_Ledger_Items__c ledgerItem = ledgerMap.get(ledgerName);
         System.debug('🟢 Selected Ledger Item: ' + ledgerItem);

        // 5️⃣ Create Overpayment record
        Invoice_Over_Payment__c op = new Invoice_Over_Payment__c();
        op.Company__c = companyId;
        op.Invoice_Payment__c = paymentId;
        op.Amount__c = amount;
        op.Payment_Date__c = paymentDate;
        op.Over_Payment_No__c = opNumber;
        op.Accounting_Ledger_Items__c = ledgerItem.Id;
        op.Is_Spend_Money__c = isSpendMoney;
        op.Is_Receive_Money__c = !isSpendMoney;
        System.debug('🟢 Inserting Overpayment: ' + op);
        insert op;

        System.debug('🟡 Existing Ledger Amount: ' + ledgerItem.Amount__c);
        // 6️⃣ Update Ledger Item Amount
        ledgerItem.Amount__c = (ledgerItem.Amount__c == null ? 0 : ledgerItem.Amount__c) + amount;
        System.debug('🟢 Updated Ledger Amount: ' + ledgerItem.Amount__c);

        update ledgerItem;
        System.debug('✅ Completed saveOverpaymentRecord() returning: ' + op.Id);
        return op.Id;
    }


              
}