public without sharing class AccountingChartController {
 /* @AuraEnabled(cacheable=true)
    public static  Map<String, Integer> getSalesChart( Id companyId, Id orgId, String entryType) {
        System.debug('companyId: ' + companyId);
        
        Map<String, Integer> salesData = new Map<String, Integer>();
         // Get the first and last date of the current month
        Date firstDayOfMonth = Date.today().toStartOfMonth();
        Date lastDayOfMonth = firstDayOfMonth.addMonths(1).addDays(-1);
        // Query to count sales for each day in the current month
        System.debug('First Day of Month: ' + firstDayOfMonth);
    	System.debug('Last Day of Month: ' + lastDayOfMonth);
        
         for (Integer i = 0; i < lastDayOfMonth.day(); i++) {
            Date currentDate = firstDayOfMonth.addDays(i);
            String label = DateTime.newInstance(currentDate, Time.newInstance(0, 0, 0, 0)).format('MMM d');
            salesData.put(label, 0);
             System.debug('🗓️ Initialized Day: ' + label);
        }
        List<Accounting_Invoices_Expenses__c> salesRecords = [
            
            SELECT Id, Invoice_Date__c 
                FROM Accounting_Invoices_Expenses__c
                WHERE Company__c = :companyId 
                AND Invoice_Date__c >= :firstDayOfMonth
                AND Invoice_Date__c <= :lastDayOfMonth
                AND Entity_Type__c = :entryType
        ];
 		System.debug('Number of Sales Records: ' + salesRecords.size());
        // Prepare the map to return
        
         // Iterate over the sales records and count occurrences for each day
        
        // Ensure all days of the month are represented, even if no sales occurred
       
        for (Accounting_Invoices_Expenses__c record : salesRecords) {
            if (record.Invoice_Date__c != null) {
                String dayLabel = DateTime.newInstance(record.Invoice_Date__c, Time.newInstance(0, 0, 0, 0)).format('MMM d');
                Integer count = salesData.get(dayLabel);
                salesData.put(dayLabel, count + 1);
            }
        }
       
        return salesData;
    }*/
    @AuraEnabled
    public static Map<String, Map<String, Integer>> getSalesPurchasesChart(Id companyId) {
        Map<String, Map<String, Integer>> result = new Map<String, Map<String, Integer>>();
        Map<String, Integer> salesData = new Map<String, Integer>();
        Map<String, Integer> purchasesData = new Map<String, Integer>();
    
        Date firstDayOfMonth = Date.today().toStartOfMonth();
        Date lastDayOfMonth = firstDayOfMonth.addMonths(1).addDays(-1);
    
        for (Integer i = 0; i < lastDayOfMonth.day(); i++) {
            String label = DateTime.newInstance(firstDayOfMonth.addDays(i), Time.newInstance(0, 0, 0, 0)).format('MMM d');
            salesData.put(label, 0);
            purchasesData.put(label, 0);
        }
    
        List<Accounting_Invoices_Expenses__c> records = [
            SELECT Invoice_Date__c, Entity_Type__c,Status__c
            FROM Accounting_Invoices_Expenses__c
            WHERE Company__c = :companyId
            AND Invoice_Date__c >= :firstDayOfMonth
            AND Invoice_Date__c <= :lastDayOfMonth
            AND Entity_Type__c IN ('Invoice', 'Expense')
        ];
    
        for (Accounting_Invoices_Expenses__c record : records) {
            if (record.Invoice_Date__c != null) {
                String label = DateTime.newInstance(record.Invoice_Date__c, Time.newInstance(0, 0, 0, 0)).format('MMM d');
                if (record.Entity_Type__c == 'Invoice') {
                    salesData.put(label, salesData.get(label) + 1);
                } else if (record.Entity_Type__c == 'Expense') {
                    purchasesData.put(label, purchasesData.get(label) + 1);
                }
            }
        }
    
        result.put('Sales', salesData);
        result.put('Purchases', purchasesData);
        return result;
    }
    public static Integer getMonthNumber(String monthName) {
        Map<String, Integer> months = new Map<String, Integer>{
            'January' => 1, 'February' => 2, 'March' => 3, 'April' => 4,
            'May' => 5, 'June' => 6, 'July' => 7, 'August' => 8,
            'September' => 9, 'October' => 10, 'November' => 11, 'December' => 12
        };
        return months.get(monthName);
    }
 
   @AuraEnabled
    public static List<StatusCountWrapper> getSalesStatusListByMonth(Id companyId, String selectedMonth) {
        List<StatusCountWrapper> statusData = new List<StatusCountWrapper>();
        
        // Convert selected month to number
        Integer currentYear = Date.today().year();
        Integer monthNumber = getMonthNumber(selectedMonth);
        System.debug('📅 Current Year: ' + currentYear + ', Month Number: ' + monthNumber);
        
        // Define date range for the selected month
        Date startDate = Date.newInstance(currentYear, monthNumber, 1);
        Date endDate = startDate.addMonths(1).addDays(-1);
        System.debug('🗓️ Start: ' + startDate + ', End: ' + endDate);
            List<AggregateResult> results = [
                SELECT Status__c status, COUNT(Id) total
                FROM Accounting_Invoices_Expenses__c
                WHERE Company__c = :companyId
                //AND Entity_Type__c = :entryType
                AND Invoice_Date__c >= :startDate
                AND Invoice_Date__c <= :endDate
                AND Is_Payroll_Sales__c = true
                GROUP BY Status__c
            ]; 
       
               
        // Populate wrapper list from the results
        for (AggregateResult ar : results) {
            String status = (String) ar.get('status');
            Integer count = ((Long) ar.get('total')).intValue();
            statusData.add(new StatusCountWrapper(status, count));
        }
    
        System.debug('✅ Final Status Data: ' + statusData);
        return statusData;
    } 
   public class StatusCountWrapper {
       @AuraEnabled public String status { get; set; }
       @AuraEnabled public Integer count { get; set; }
       
       public StatusCountWrapper(String status, Integer count) {
           this.status = status;
           this.count = count;
       }
   } 
    @AuraEnabled
    public static List<StatusCountWrapper> getPurchasesStatusListByMonth(Id companyId, String selectedMonth) {
        List<StatusCountWrapper> statusData = new List<StatusCountWrapper>();
        
        // Convert selected month to number
        Integer currentYear = Date.today().year();
        Integer monthNumber = getMonthNumber(selectedMonth);
        System.debug('📅 Current Year: ' + currentYear + ', Month Number: ' + monthNumber);
        
        // Define date range for the selected month
        Date startDate = Date.newInstance(currentYear, monthNumber, 1);
        Date endDate = startDate.addMonths(1).addDays(-1);
        System.debug('🗓️ Start: ' + startDate + ', End: ' + endDate);
            List<AggregateResult> results = [
                SELECT Status__c status, COUNT(Id) total
                FROM Accounting_Invoices_Expenses__c
                WHERE Company__c = :companyId
                //AND Entity_Type__c = :entryType
                AND Invoice_Date__c >= :startDate
                AND Invoice_Date__c <= :endDate
                AND Is_Payroll_Purchases__c = true
                GROUP BY Status__c
            ]; 
       
    
        // Populate wrapper list from the results
        for (AggregateResult ar : results) {
            String status = (String) ar.get('status');
            Integer count = ((Long) ar.get('total')).intValue();
            statusData.add(new StatusCountWrapper(status, count));
        }
    
        System.debug('✅ Final Status Data: ' + statusData);
        return statusData;
    } 
     @AuraEnabled
    public static Map<String, Decimal> calculateChartTotalLiability(Id companyId, String selectedMonths) {
        Integer daysToSubtract = 0;
        System.debug('companyId in calculateChartTotalLiability: ' + companyId);
        System.debug('selectedMonths in calculateChartTotalLiability: ' + selectedMonths);
        
        // Logic to determine how many days to subtract based on the selected option
        if (selectedMonths == '1 Month') {
            daysToSubtract = 30;
        } else if (selectedMonths == '2 Months') {
            daysToSubtract = 60;
        } else if (selectedMonths == '3 Months') {
            daysToSubtract = 90;
        } else if (selectedMonths == '6 Months') {
            daysToSubtract = 180;
        } else if (selectedMonths == '1 Year') {
            daysToSubtract = 365;
        } else {
            throw new IllegalArgumentException('Invalid selected month option');
        }
    
        // Calculate the start and end date
        Date endDate = Date.today();
        Date startDate = endDate.addDays(-daysToSubtract);
        System.debug('🗓️ Start: ' + startDate + ', End: ' + endDate);
    
        Decimal totalLiabilityAmount = 0;
        Decimal totalExpenseAmount = 0;
        Decimal totalIncomeAmount = 0;
    
        // Query to fetch journal entries within the date range
        List<Accounting_Journal_Entry__c> journalEntries = [
            SELECT Id
            FROM Accounting_Journal_Entry__c
            WHERE Company__c = :companyId
            AND Invoice_Date__c >= :startDate
            AND Invoice_Date__c <= :endDate
        ];
     	 System.debug('journalEntries: ' + journalEntries);
        // Extract journal entry IDs
        Set<Id> journalEntryIds = new Set<Id>();
        for (Accounting_Journal_Entry__c journalEntry : journalEntries) {
            journalEntryIds.add(journalEntry.Id);
        }
    
        // Fetch Liabilities Ledger Items
        List<Accounting_Ledger_Items__c> liabilityLedgerItems = [
            SELECT Id, Amount__c, Category__r.Name
            FROM Accounting_Ledger_Items__c
            WHERE Category__r.Name = 'Liabilities'
            AND Amount__c != null
            AND Amount__c != 0
            AND Id IN (
                SELECT Accounting_Ledger_Items__c
                FROM Accounting_Journal_Entry__c
                WHERE Id IN :journalEntryIds
            )
        ];
    
        for (Accounting_Ledger_Items__c ledgerItem : liabilityLedgerItems) {
            System.debug('ledgerItem : ' + ledgerItem); 
            if (ledgerItem.Amount__c != null) {
                totalLiabilityAmount += ledgerItem.Amount__c;
            }
        }
        System.debug('totalLiabilityAmount : ' + totalLiabilityAmount);
    
        // Fetch Expense Ledger Items
        List<Accounting_Ledger_Items__c> expenseLedgerItems = [
            SELECT Id, Amount__c, Category__r.Name
            FROM Accounting_Ledger_Items__c
            WHERE Category__r.Name = 'Expenses'
            AND Amount__c != null
            AND Amount__c != 0
            AND Id IN (
                SELECT Accounting_Ledger_Items__c
                FROM Accounting_Journal_Entry__c
                WHERE Id IN :journalEntryIds
            )
        ];
    
        for (Accounting_Ledger_Items__c ledgerItem : expenseLedgerItems) {
            if (ledgerItem.Amount__c != null) {
                totalExpenseAmount += ledgerItem.Amount__c;
            }
        }
        System.debug('totalExpenseAmount : ' + totalExpenseAmount);
    
        // Fetch Income Ledger Items
        List<Accounting_Ledger_Items__c> incomeLedgerItems = [
            SELECT Id, Amount__c, Category__r.Name
            FROM Accounting_Ledger_Items__c
            WHERE Category__r.Name = 'Income'
            AND Amount__c != null
            AND Amount__c != 0
            AND Id IN (
                SELECT Accounting_Ledger_Items__c
                FROM Accounting_Journal_Entry__c
                WHERE Id IN :journalEntryIds
            )
        ];
    
        for (Accounting_Ledger_Items__c ledgerItem : incomeLedgerItems) {
            if (ledgerItem.Amount__c != null) {
                totalIncomeAmount += ledgerItem.Amount__c;
            }
        }
        System.debug('totalIncomeAmount : ' + totalIncomeAmount);
    
        // Return the data in a map
        Map<String, Decimal> result = new Map<String, Decimal>();
        result.put('totalLiabilityAmount', totalLiabilityAmount);
        result.put('totalIncomeAmount', totalIncomeAmount);
        result.put('totalExpenseAmount', totalExpenseAmount);
    
        return result;
    }
    

    @AuraEnabled
    public static Decimal calculateChartTotalAssets(Id companyId, String selectedMonths) {
        Integer daysToSubtract = 0;
    
        // Logic to determine how many days to subtract based on the selected option
        if (selectedMonths == '1 Month') {
            daysToSubtract = 30; // 1 month = 30 days
        } else if (selectedMonths == '2 Months') {
            daysToSubtract = 60; // 2 months = 60 days
        } else if (selectedMonths == '3 Months') {
            daysToSubtract = 90; // 3 months = 90 days
        } else if (selectedMonths == '6 Months') {
            daysToSubtract = 180; // 6 months = 180 days
        } else if (selectedMonths == '1 Year') {
            daysToSubtract = 365; // 1 year = 365 days
        } else {
            throw new IllegalArgumentException('Invalid selected month option'); // Handle invalid inputs
        }
    
        // Calculate the end date (today) and start date (subtract the calculated days from today)
        Date endDate = Date.today();  // End date is today
        Date startDate = endDate.addDays(-daysToSubtract);  // Subtract days from today based on the selected months
        System.debug('🗓️ Start: ' + startDate + ', End: ' + endDate);
    
        // Query to get all journal entries for the company within the specified date range
        Decimal totalAssetAmount = 0;
        
        // Fetch related journal entries first
        List<Accounting_Journal_Entry__c> journalEntries = [
            SELECT Id
            FROM Accounting_Journal_Entry__c
            WHERE Company__c = :companyId 
            AND Invoice_Date__c >= :startDate 
            AND Invoice_Date__c <= :endDate
        ];
        
        // Extract the IDs from the journal entries
        Set<Id> journalEntryIds = new Set<Id>();
        for (Accounting_Journal_Entry__c journalEntry : journalEntries) {
            journalEntryIds.add(journalEntry.Id);
        }
    
        // Query to get all ledger items related to assets for the company and within the specified date range
        List<Accounting_Ledger_Items__c> ledgerItems = [
            SELECT Id, Amount__c, Category__r.Name
            FROM Accounting_Ledger_Items__c
            WHERE Category__r.Name = 'Assets'  // Change the category filter to 'Assets'
            AND Amount__c != null
            AND Amount__c != 0
            AND Id IN (
                SELECT Accounting_Ledger_Items__c
                FROM Accounting_Journal_Entry__c
                WHERE Id IN :journalEntryIds
            )
        ];
    
        // Loop through each ledger item and sum the amounts
        for (Accounting_Ledger_Items__c ledgerItem : ledgerItems) {
            if (ledgerItem.Amount__c != null) {
                totalAssetAmount += ledgerItem.Amount__c;
            }
        }
    
        // Return the total asset amount
        return totalAssetAmount;
    }
    
     @AuraEnabled
    public static Map<String, Integer> getPurchasesCountChart(Id companyId) {
        Integer totalPurchases = 0;
        Map<String, Integer> purchasesData = new Map<String, Integer>();
    
        Date firstDayOfMonth = Date.today().toStartOfMonth();
        Date lastDayOfMonth = firstDayOfMonth.addMonths(1).addDays(-1);
    
        totalPurchases = [
            SELECT COUNT()
            FROM Accounting_Invoices_Expenses__c
            WHERE Company__c = :companyId
            AND Invoice_Date__c >= :firstDayOfMonth
            AND Invoice_Date__c <= :lastDayOfMonth
            AND Is_Payroll_Purchases__c = true
        ];
        
         purchasesData.put('Purchases', totalPurchases);
        return purchasesData;
	}
    
     @AuraEnabled
    public static Accounting_Invoices_Expenses__c UpdateDataFromPurchases(
        String salesEntryJson,
        String salesEntryListJson,
        String amountEntryJson
        //string createdFromExpenses
    ) {
        Accounting_Invoices_Expenses__c invoiceRecord = new Accounting_Invoices_Expenses__c();
        List<Accounting_Journal_Entry__c> journalEntriesToUpdate = new List<Accounting_Journal_Entry__c>();
        List<Accounting_Journal_Entry__c> journalEntriesToInsert = new List<Accounting_Journal_Entry__c>();
        
        try {
            System.debug('🔵 Step 1: Incoming Parameters');
            System.debug('➡ salesEntryJson: ' + salesEntryJson);
            System.debug('➡ salesEntryListJson: ' + salesEntryListJson);
            System.debug('➡ amountEntryJson: ' + amountEntryJson);
            Boolean createdFromExpenses1;
            
            // Step 2: Deserialize JSON
            Map<String, Object> salesEntry = (Map<String, Object>) JSON.deserializeUntyped(salesEntryJson);
            Map<String, Object> amountEntry = (Map<String, Object>) JSON.deserializeUntyped(amountEntryJson);
            
           // List<Object> rawList = (List<Object>) JSON.deserializeUntyped(salesEntryListJson);
           // List<Map<String, Object>> salesEntryList = new List<Map<String, Object>>();
           // for (Object obj : rawList) {
           //     salesEntryList.add((Map<String, Object>) obj);
           // }
            List<Object> rawList = (List<Object>) JSON.deserializeUntyped(salesEntryListJson);
            List<Map<String, Object>> salesEntryList = new List<Map<String, Object>>();
            Set<Id> journalIds = new Set<Id>(); // 🆕 Collect IDs for update
            for (Object obj : rawList) {
                Map<String, Object> entryMap = (Map<String, Object>) obj;
                salesEntryList.add(entryMap);
    
                if (entryMap.containsKey('Id') && entryMap.get('Id') != null) {
                    String journalId = String.valueOf(entryMap.get('Id'));
                    if (!String.isBlank(journalId) && (journalId.length() == 15 || journalId.length() == 18)) {
                        journalIds.add(journalId);
                    }
                }
            }
            Map<Id, Accounting_Journal_Entry__c> existingJournalEntryMap = new Map<Id, Accounting_Journal_Entry__c>();
            if (!journalIds.isEmpty()) {
                existingJournalEntryMap = new Map<Id, Accounting_Journal_Entry__c>(
                    [SELECT Id, Sl_no__c FROM Accounting_Journal_Entry__c WHERE Id IN :journalIds]
                );
            }
            System.debug('✅ Deserialized salesEntry: ' + salesEntry);
            System.debug('✅ Deserialized amountEntry: ' + amountEntry);
            System.debug('✅ Deserialized salesEntryList: ' + salesEntryList);
            System.debug('✅ Deserialized salesEntryList (pretty): ' + JSON.serializePretty(salesEntryList));
            
            // Step 3: Build Invoice Record
            String invoiceId = String.valueOf(salesEntry.get('invoiceId'));
            Boolean isValidId = !String.isBlank(invoiceId) && (invoiceId.length() == 15 || invoiceId.length() == 18);
            
            Decimal subTotal = Decimal.valueOf(String.valueOf(amountEntry.get('subTotal')));
            Decimal taxAmount = Decimal.valueOf(String.valueOf(amountEntry.get('taxAmount')));
            Decimal totalAmount = Decimal.valueOf(String.valueOf(amountEntry.get('totalAmount')));
            
            
            invoiceRecord = new Accounting_Invoices_Expenses__c(
                //Include_GST__c     = (String)salesEntry.get('IncludeGST'),
                Invoice_Date__c    = Date.valueOf((String)salesEntry.get('InvoiceDate')),
                Invoice_No__c      = (String)salesEntry.get('InvoiceNo'),
                Status__c          = (String)salesEntry.get('Status'),
                Company__c         = (String)salesEntry.get('company'),
                Entity_Type__c     = 'Invoice',
                GST__c             = taxAmount,
                Total_Amount__c    = totalAmount,
                Sub_Total__c       = subTotal,
                Post_Date__c       = Date.valueOf((String)salesEntry.get('PostDate'))
            );
            
             
             //if (createdFromExpenses == 'true') {
                 //createdFromExpenses1 = true;
                 //invoiceRecord.Is_Payroll_Purchases__c = true;
            //if (isExpenses == true) {
            	invoiceRecord.Is_Payroll_Purchases__c = true;
             //}
           
            if (isValidId) {
                invoiceRecord.Id = invoiceId;
                update invoiceRecord;
                System.debug('✅ Invoice Updated: ' + invoiceRecord.Id);
            } else {
                insert invoiceRecord;
                System.debug('✅ Invoice Inserted: ' + invoiceRecord.Id);
            }
            
            // Step 4: Process Journal Entries
            for (Map<String, Object> entry : salesEntryList) {
                System.debug('➡ Processing entry: ' + entry);
                
                //  System.debug('➡ Processing entry: ' +(String)salesEntry.get('lineItems'));
                String taxStr = String.valueOf(entry.get('tax')).replace('%', '');
                Decimal taxValue = Decimal.valueOf(taxStr);
                Decimal taxMultiplier = 1 + (taxValue / 100);
                 
                Decimal amount = Decimal.valueOf(String.valueOf(entry.get('Amount__c')));
                System.debug('➡ Processing unitPrice: ' + amount);
                Boolean taxInclusive = Boolean.valueOf(String.valueOf(salesEntry.get('taxInclusive')));
    			System.debug('➡ Tax Inclusive? ' + taxInclusive);
                
                Decimal subTotalJE;
    			Decimal taxAmountJE;
    			Decimal totalWithTax;
                if (taxInclusive) {
                    // Tax is included in the amount
                    subTotalJE = (amount / taxMultiplier).setScale(2);
                    taxAmountJE = (amount - subTotalJE).setScale(2);
                    totalWithTax = amount;
                } else {
                    // Tax is added on top
                    subTotalJE = amount;
                    taxAmountJE = (amount * taxValue / 100).setScale(2);
                    totalWithTax = (subTotalJE + taxAmountJE).setScale(2);
                }

                System.debug('✅ Sub Total: ' + subTotalJE);
                System.debug('✅ Tax Amount: ' + taxAmountJE);
                System.debug('✅ Total Amount: ' + totalWithTax);
                
                Accounting_Journal_Entry__c journalRecord = new Accounting_Journal_Entry__c();
                
                // Now assign the fields separately
                journalRecord.Tax_Amount__c = taxAmountJE;
                journalRecord.Total_Amount__c = subTotalJE;
                //journalRecord.Sub_Total__c = totalWithTax;
                journalRecord.Amount__c = amount;
                journalRecord.Description__c = String.valueOf(entry.get('Description__c'));
                journalRecord.Company__c = (String)salesEntry.get('company');
                journalRecord.Tax_Inclusive__c = (Boolean)salesEntry.get('taxInclusive');
                journalRecord.Entry_Type__c = 'Purchases';
              
                journalRecord.Sl_no__c = Decimal.valueOf(String.valueOf(entry.get('sno')));
                journalRecord.Invoice_Date__c = Date.valueOf((String)salesEntry.get('InvoiceDate'));
                // System.debug('isParticipantInvoice : ' + isParticipantInvoice);
               
                //journalRecord.Created_From_Expenses__c = createdFromExpenses1;
               // journalRecord.Unit_Price__c = amount;
               // journalRecord.Quantity__c = quantity;
                journalRecord.Tax__c = taxValue;
                System.debug('🧾 accountItemId: ' + entry.get('accountItemId'));
                journalRecord.Accounting_Ledger_Items__c = String.valueOf(entry.get('accountItemId'));
                journalRecord.Accounting_Invoices_Expenses__c = invoiceRecord.Id;
                
                journalRecord.Post_Date__c = Date.valueOf((String)salesEntry.get('PostDate'));
                journalRecord.Entity_Profile__c = (String)salesEntry.get('entityName');
                journalRecord.Invoice_No__c = (String)salesEntry.get('InvoiceNo'); // Uncomment if needed
                journalRecord.Comments__c = (String)salesEntry.get('comments');
                String journalId = String.valueOf(entry.get('Id'));
                Boolean validJournalId = !String.isBlank(journalId) && (journalId.length() == 15 || journalId.length() == 18);
              
                    //journalRecord.Is_RFQ__c = true;
                    journalRecord.Tax_Inclusive__c = (Boolean)salesEntry.get('taxInclusive');  
                
                if (validJournalId) {
                    journalRecord.Id = journalId;
                     Accounting_Journal_Entry__c existing = existingJournalEntryMap.get(journalId);
                    if (existing != null && existing.Sl_no__c != null && existing.Sl_no__c != journalRecord.Sl_no__c) {
                        journalRecord.Is_Sno_Changed__c = true; 
                        System.debug('⚠️ SNO changed for: ' + journalId + ' (Old: ' + existing.Sl_no__c + ', New: ' + journalRecord.Sl_no__c + ')'); 
                    }
                    journalEntriesToUpdate.add(journalRecord);
                } else {
                    journalEntriesToInsert.add(journalRecord);
                }
            }
            
            // Step 5: Perform Bulk DML
            if (!journalEntriesToInsert.isEmpty()) {
                insert journalEntriesToInsert;
                System.debug('✅ Inserted ' + journalEntriesToInsert.size() + ' Journal Entries');
            }
            
            if (!journalEntriesToUpdate.isEmpty()) {
                update journalEntriesToUpdate;
                System.debug('✅ Updated ' + journalEntriesToUpdate.size() + ' Journal Entries');
            
            }
            
        } catch (Exception e) {
            System.debug('❌ Exception occurred: ' + e.getMessage());
            throw new AuraHandledException(e.getMessage());
        }
        
        System.debug('🔚 Returning Invoice Record: ' + invoiceRecord);
        return invoiceRecord;
     }
    @AuraEnabled(cacheable=true)
    public static List<Accounting_Invoices_Expenses__c> getAccountingPurchases(String sDate,String eDate ,Id companyId) {
        // Initialize a list to hold the result
        //System.debug('isExpense in getAccountingPurchases :'+isExpense );
        List<Accounting_Invoices_Expenses__c> InvoiceData = new List<Accounting_Invoices_Expenses__c>();
        Date startDate=Date.valueOf(sDate);
        Date endDate=Date.valueOf(eDate);
         List<Accounting_Journal_Entry__c> entryData = [select Id,Tax_Amount__c,Total_Amount__c,Sub_Total__c,Accounting_Ledger_Items__c,Description__c,Company__c,Entry_Type__c,Entity_Profile__c,Invoice_Date__c,
                                                        Post_Date__c,Invoice_No__c,Comments__c,Sl_no__c,Accounting_Ledger_Items__r.Account_Number__c,Accounting_Ledger_Items__r.Name,Amount__c,
                                                       Unit_Price__c,Quantity__c,Tax__c,Accounting_Invoices_Expenses__c,Entity_Profile__r.First_Name__c,Entity_Profile__r.Last_Name__c,Entity_Profile__r.Name__c from Accounting_Journal_Entry__c  WHERE Sl_no__c != NULL];
        List<Id> accountingInvoiceIds = new List<Id>(); // To hold Accounting_Invoices_Expenses__c Ids

        // Loop through entryData and add the unique Accounting_Invoices_Expenses__c Ids to the list
        for (Accounting_Journal_Entry__c entry : entryData) {
            if (entry.Accounting_Invoices_Expenses__c != null) {
                accountingInvoiceIds.add(entry.Accounting_Invoices_Expenses__c);
            }
        }
        if (companyId != null ) {
            // If selectedId is provided, fetch the company with that specific ID
            InvoiceData = [SELECT Id,Name,Company__c, Invoice_No__c,Status__c ,GST__c,Total_Amount__c,Company__r.Company_Name__c,Invoice_Date__c,New_Format_Invoice_No__c, Amazon_URL__c,Is_Payroll_Sales__c,(select Id,
                                                                                                                                                 Tax_Amount__c,Total_Amount__c,Sub_Total__c,Amount__c,Accounting_Ledger_Items__c,Description__c,Company__c,Entry_Type__c,Entity_Profile__c,Invoice_Date__c,Post_Date__c,Invoice_No__c,Comments__c,Sl_no__c,Accounting_Ledger_Items__r.Account_Number__c,Accounting_Ledger_Items__r.Name,
                                                                                                                                                 Unit_Price__c,Quantity__c,Tax__c,Accounting_Invoices_Expenses__c,Entity_Profile__r.First_Name__c,Entity_Profile__r.Last_Name__c,Entity_Profile__r.Name__c, Accounting_Ledger_Items__r.Category__r.Name from Accounting_Journal_Entry__r  WHERE Sl_no__c != NULL)
                           FROM Accounting_Invoices_Expenses__c 
                           WHERE Id IN :accountingInvoiceIds  AND Company__c = :companyId AND Invoice_Date__c >=:startDate and Invoice_Date__c <=: endDate AND Is_Payroll_Purchases__c = true ORDER BY createddate DESC];
            System.debug('InvoiceData for companyId: ' + JSON.serialize(InvoiceData));
       
        }
        return InvoiceData;
    }
     @AuraEnabled
    public static List<Accounting_Invoices_Expenses__c> getAccountingPurchasesInEdit(String invoiceId) {
        // Initialize a list to hold the result
        List<Accounting_Invoices_Expenses__c> InvoiceData = new List<Accounting_Invoices_Expenses__c>();
        if (invoiceId != null) {
            // If selectedId is provided, fetch the company with that specific ID
            InvoiceData = [SELECT Id,Invoice_No__c,Name,Company__c,Status__c ,Sub_Total__c,GST__c,Total_Amount__c,Company__r.Company_Name__c,
                           Company__r.ABN__c,Company__r.Address__c,Company__r.Phone_Number__c,Company__r.Address_Latest__Street__s,
                           Company__r.Address_Latest__City__s,Company__r.Address_Latest__StateCode__s,Company__r.Address_Latest__PostalCode__s,
                           Invoice_Date__c,Post_Date__c,Include_GST__c,Participant__r.First_Name__c, Participant__r.Last_Name__c,
                           (select Id,Tax_Amount__c,Total_Amount__c,Sub_Total__c,Accounting_Ledger_Items__c,Description__c,Company__c,
                            Entry_Type__c,Entity_Profile__c,Invoice_Date__c,Post_Date__c,Invoice_No__c,Comments__c,Sl_no__c,Tax_Inclusive__c,
                            Accounting_Ledger_Items__r.Account_Number__c,Accounting_Ledger_Items__r.Name,Entity_Profile__r.First_Name__c,
                            Entity_Profile__r.Last_Name__c,Entity_Profile__r.Name__c,Unit_Price__c,Quantity__c,Tax__c,Line_Items__c,Amount__c 
                            from Accounting_Journal_Entry__r where Amount__c!= null AND Tax__c != null)
                            FROM Accounting_Invoices_Expenses__c 
                            WHERE Id =: invoiceId];
            System.debug('InvoiceData for companyId: ' + JSON.serialize(InvoiceData));
        }
        return InvoiceData;
    }
     @AuraEnabled(cacheable=true)
    public static List<Accounting_Ledger_Items__c> getAllLedgerItems(Id companyId) {
        String currentUserId = UserInfo.getUserId();
        try {
            User currentUser = [SELECT Id, Organization_Name__c FROM User WHERE Id = :currentUserId LIMIT 1];
            List<Accounting_Ledger_Items__c> ledgerItems = [
                SELECT Id, Name, Account_Number__c, Category__r.Name
                FROM Accounting_Ledger_Items__c WHERE Category__r.Account_List__r.Company__r.Organization__r.Name = :currentUser.Organization_Name__c
                AND Category__r.Account_List__r.Company__c = :companyId 
                ORDER BY Account_Number__c ASC
            ];
            System.debug('Retrieved Ledger Items: ' + JSON.serialize(ledgerItems));
            return ledgerItems;
        } catch (Exception e) {
            System.debug(' Error fetching Ledger Items: ' + e.getMessage());
            throw new AuraHandledException('Error retrieving ledger items: ' + e.getMessage());
        }
    }
  
  @AuraEnabled
    public static Accounting_Invoices_Expenses__c saveUpdategeneralLedgerData(String salesEntryJson, String salesEntryListJson, String companyId) {
        System.debug('➡ salesEntryJson: ' + salesEntryJson);
        System.debug('➡ salesEntryListJson: ' + salesEntryListJson);
        //System.debug('➡ deletedRowIdsJson: ' + deletedRowIdsJson);
        
        Accounting_Invoices_Expenses__c invoiceRecord = new Accounting_Invoices_Expenses__c();
        List<Accounting_Journal_Entry__c> journalEntriesToUpdate = new List<Accounting_Journal_Entry__c>();
        List<Accounting_Journal_Entry__c> journalEntriesToInsert = new List<Accounting_Journal_Entry__c>();
        //List<Accounting_Journal_Entry__c> journalEntriesToDelete  = new List<Accounting_Journal_Entry__c>();
        
        try {
            Map<String, Object> salesEntry = (Map<String, Object>) JSON.deserializeUntyped(salesEntryJson);
            List<Object> rawList = (List<Object>) JSON.deserializeUntyped(salesEntryListJson);
            List<Map<String, Object>> salesEntryList = new List<Map<String, Object>>();
            for (Object obj : rawList) {
                salesEntryList.add((Map<String, Object>) obj);
            }
     	 //	List<String> deletedRowIds = (List<String>) JSON.deserializeUntyped(deletedRowIdsJson);
            
            String invoiceId = String.valueOf(salesEntry.get('invoiceId'));
            Boolean isValidId = !String.isBlank(invoiceId) && (invoiceId.length() == 15 || invoiceId.length() == 18);
    
            invoiceRecord = new Accounting_Invoices_Expenses__c(
                Company__c = companyId,
                Invoice_Date__c = Date.valueOf((String)salesEntry.get('InvoiceDate')),
                Post_Date__c = Date.valueOf((String)salesEntry.get('PostDate')),
                Invoice_No__c = (String)salesEntry.get('InvoiceNo'),
                isGeneralLedger__c = true
            );
    
            if (isValidId) {
                invoiceRecord.Id = invoiceId;
                update invoiceRecord;
                System.debug('✅ Invoice Updated: ' + invoiceRecord.Id);
            } else {
                insert invoiceRecord;
                System.debug('✅ Invoice Inserted: ' + invoiceRecord.Id);
            }
    
            Map<String, Accounting_Journal_Entry__c> existingRowKeyToGstJE = new Map<String, Accounting_Journal_Entry__c>();
            if (isValidId) {
                for (Accounting_Journal_Entry__c existingGst : [
                    SELECT Id, RowKey__c, Accounting_Ledger_Items__r.Name
                    FROM Accounting_Journal_Entry__c
                    WHERE Accounting_Invoices_Expenses__c = :invoiceId
                    AND Accounting_Ledger_Items__r.Name IN ('GST Paid', 'GST Collected')
                ]) {
                    existingRowKeyToGstJE.put(existingGst.RowKey__c, existingGst);
                }
            }
    
            for (Map<String, Object> row : salesEntryList) {
                Decimal amount = Decimal.valueOf(String.valueOf(row.get('Amount__c')));
                String crDr = (String)row.get('Cr_Dr__c');
                String accountCategory = (String)row.get('accountCategory');
                String taxStr = String.valueOf(row.get('tax')).replace('%', '');
                Decimal taxRate = taxStr != '' ? Decimal.valueOf(taxStr) : 0;
                Decimal taxAmount = (amount * taxRate / 100).setScale(2);
                Decimal signedAmount;
    
                if (accountCategory == 'Assets') {
                    signedAmount = crDr == 'Cr' ? -amount : amount;
                } else if (accountCategory == 'Liabilities') {
                    signedAmount = crDr == 'Dr' ? -amount : amount;
                } else if (accountCategory == 'Equity' || accountCategory == 'Income') {
                    signedAmount = crDr == 'Dr' ? -amount : amount;
                } else if (accountCategory == 'Cost Of Sales' || accountCategory == 'Expenses') {
                    signedAmount = crDr == 'Cr' ? -amount : amount;
                } else {
                    signedAmount = amount;
                }
    
                // ✅ Use existing RowKey__c if present, else generate a unique 10-digit one
                String rowKey = (String)row.get('RowKey__c');
                if (String.isBlank(rowKey)) {
                     rowKey = String.valueOf(DateTime.now().getTime()).substring(3); // 10-digit unique
                }
                System.debug('🔑 RowKey for JE & GST: ' + rowKey);
    
                Accounting_Journal_Entry__c je = new Accounting_Journal_Entry__c(
                    Accounting_Invoices_Expenses__c = invoiceRecord.Id,
                    Amount__c = amount,
                    Description__c = (String)row.get('Description__c'),
                    Tax__c = taxRate,
                    Tax_Amount__c = taxAmount,
                    Total_Amount__c = signedAmount.setScale(2),
                    Company__c = companyId,
                    Tax_Inclusive__c = Boolean.valueOf(String.valueOf(salesEntry.get('taxInclusive'))),
                    Accounting_Ledger_Items__c = (String)row.get('accountItemId'),
                    Sl_no__c = Decimal.valueOf(String.valueOf(row.get('sno'))),
                    Invoice_Date__c = Date.valueOf((String)salesEntry.get('InvoiceDate')),
                    Post_Date__c = Date.valueOf((String)salesEntry.get('PostDate')),
                    Comments__c = (String)salesEntry.get('comments'),
                    Invoice_No__c = (String)row.get('InvoiceNo'),
                    Cr_Dr__c = crDr,
                    Notes__c = (String)salesEntry.get('notes'),
                    RowKey__c = rowKey
                );
    
                String journalId = String.valueOf(row.get('Id'));
                if (!String.isBlank(journalId) && (journalId.length() == 15 || journalId.length() == 18)) {
                    je.Id = journalId;
                    journalEntriesToUpdate.add(je);
                } else {
                    journalEntriesToInsert.add(je);
                }
    			System.debug('🧪 accountCategory raw value: [' + accountCategory + ']');
                if (accountCategory == 'Assets' || accountCategory == 'Liabilities') {  
                    
                    String gstLedgerName = accountCategory == 'Assets' ? 'GST Paid' : 'GST Collected';
                    List<Accounting_Ledger_Items__c> gstLedgerList = [
                        SELECT Id FROM Accounting_Ledger_Items__c 
                        WHERE Name = :gstLedgerName 
                        AND Category__r.Account_List__r.Company__r.Id = :companyId 
                        LIMIT 1
                    ];
    
                    if (!gstLedgerList.isEmpty()) {
                        Accounting_Ledger_Items__c gstLedger = gstLedgerList[0];
    
                        Accounting_Journal_Entry__c gstJe = new Accounting_Journal_Entry__c(
                            Accounting_Invoices_Expenses__c = invoiceRecord.Id,
                            Amount__c = 0,
                            Description__c = (String)row.get('Description__c'),
                            Tax__c = taxRate,
                            Tax_Amount__c = taxAmount,
                            Total_Amount__c = taxAmount,
                            Company__c = companyId,
                            Tax_Inclusive__c = Boolean.valueOf(String.valueOf(salesEntry.get('taxInclusive'))),
                            Accounting_Ledger_Items__c = gstLedger.Id,
                            Sl_no__c = Decimal.valueOf(String.valueOf(row.get('sno'))),
                            Invoice_Date__c = Date.valueOf((String)salesEntry.get('InvoiceDate')),
                            Post_Date__c = Date.valueOf((String)salesEntry.get('PostDate')),
                            Comments__c = (String)salesEntry.get('comments'),
                            Invoice_No__c = (String)row.get('InvoiceNo'),
                            Cr_Dr__c = crDr,
                            Notes__c = (String)salesEntry.get('notes'),
                            RowKey__c = rowKey
                        );
    
                        if (existingRowKeyToGstJE.containsKey(rowKey)) {
                            Accounting_Journal_Entry__c existingGst = existingRowKeyToGstJE.get(rowKey);
                            gstJe.Id = existingGst.Id;
    
                            gstJe.Tax__c = taxRate;
                            gstJe.Tax_Amount__c = taxAmount;
                            gstJe.Total_Amount__c = taxAmount;
    
                            System.debug('🟡 Updating GST JE: ' + gstJe.Id + ' | RowKey: ' + rowKey + ' | Tax: ' + taxRate + ' | TaxAmt: ' + taxAmount);
                            journalEntriesToUpdate.add(gstJe);
                        } else {
                            System.debug('🟢 Inserting new GST JE with RowKey: ' + rowKey);
                            journalEntriesToInsert.add(gstJe);
                        }
                    } else {
                        System.debug('⚠ GST Ledger not found for: ' + gstLedgerName);
                    }
                }
            }
           
            System.debug('📌 Total JEs to Insert: ' + journalEntriesToInsert.size());
            System.debug('📌 Total JEs to Update: ' + journalEntriesToUpdate.size());
    
            if (!journalEntriesToInsert.isEmpty()) {
                insert journalEntriesToInsert;
                System.debug('✅ Inserted ' + journalEntriesToInsert.size() + ' Journal Entries');
            }
    
            if (!journalEntriesToUpdate.isEmpty()) {
                update journalEntriesToUpdate;
                System.debug('✅ Updated ' + journalEntriesToUpdate.size() + ' Journal Entries');
            }
    
            return invoiceRecord;
    
        } catch (Exception e) {
            System.debug('❌ Error in saveUpdategeneralLedgerData: ' + e.getMessage());
            throw new AuraHandledException('Failed to create/update invoice and journal entries: ' + e.getMessage());
        }
    }



     @AuraEnabled(cacheable=true)
    public static List<Accounting_Invoices_Expenses__c> getAccountingGeneralLedger(String sDate,String eDate ,Id companyId) {
        // Initialize a list to hold the result
        //System.debug('isExpense in getAccountingPurchases :'+isExpense );
        List<Accounting_Invoices_Expenses__c> InvoiceData = new List<Accounting_Invoices_Expenses__c>();
        Date startDate=Date.valueOf(sDate);
        Date endDate=Date.valueOf(eDate);
         List<Accounting_Journal_Entry__c> entryData = [select Id,Tax_Amount__c,Total_Amount__c,Sub_Total__c,Accounting_Ledger_Items__c,Description__c,Company__c,Entry_Type__c,Entity_Profile__c,Invoice_Date__c,
                                                        Post_Date__c,Invoice_No__c,Comments__c,Sl_no__c,Accounting_Ledger_Items__r.Account_Number__c,Accounting_Ledger_Items__r.Name, Cr_Dr__c,Notes__c,Amount__c,
                                                       Unit_Price__c,Quantity__c,Tax__c,Accounting_Invoices_Expenses__c,Entity_Profile__r.First_Name__c,Entity_Profile__r.Last_Name__c,Entity_Profile__r.Name__c from Accounting_Journal_Entry__c  WHERE Sl_no__c != NULL];
        List<Id> accountingInvoiceIds = new List<Id>(); // To hold Accounting_Invoices_Expenses__c Ids

        // Loop through entryData and add the unique Accounting_Invoices_Expenses__c Ids to the list
        for (Accounting_Journal_Entry__c entry : entryData) {
            if (entry.Accounting_Invoices_Expenses__c != null) {
                accountingInvoiceIds.add(entry.Accounting_Invoices_Expenses__c);
            }
        }
        if (companyId != null ) {
            // If selectedId is provided, fetch the company with that specific ID
            InvoiceData = [SELECT Id,Name,Company__c,Status__c ,GST__c,Total_Amount__c,Company__r.Company_Name__c,Invoice_Date__c,New_Format_Invoice_No__c, Amazon_URL__c,isGeneralLedger__c,(select Id,
                                                                                                                                                 Tax_Amount__c,Total_Amount__c,Sub_Total__c,Accounting_Ledger_Items__c,Description__c,Company__c,Entry_Type__c,Entity_Profile__c,Invoice_Date__c,Post_Date__c,Invoice_No__c,Comments__c,Sl_no__c,Accounting_Ledger_Items__r.Account_Number__c,Accounting_Ledger_Items__r.Name,
                                                                                                                                                 Unit_Price__c,Quantity__c,Tax__c,Accounting_Invoices_Expenses__c,Entity_Profile__r.First_Name__c,Entity_Profile__r.Last_Name__c,Entity_Profile__r.Name__c, Accounting_Ledger_Items__r.Category__r.Name, Cr_Dr__c,Notes__c,Amount__c from Accounting_Journal_Entry__r  WHERE Sl_no__c != NULL)
                           FROM Accounting_Invoices_Expenses__c 
                           WHERE Id IN :accountingInvoiceIds  AND Company__c = :companyId AND Invoice_Date__c >=:startDate and Invoice_Date__c <=: endDate AND isGeneralLedger__c = true ORDER BY createddate DESC];
            System.debug('InvoiceData for companyId: ' + JSON.serialize(InvoiceData));
       
        }
        return InvoiceData;
    }
    @AuraEnabled
    public static List<Accounting_Invoices_Expenses__c> getGeneralLedgerInEdit(String invoiceId) {
        // Initialize a list to hold the result
        List<Accounting_Invoices_Expenses__c> InvoiceData = new List<Accounting_Invoices_Expenses__c>();
        if (invoiceId != null) {
            // If selectedId is provided, fetch the company with that specific ID
            InvoiceData = [SELECT Id,Invoice_No__c,Name,Company__c,Status__c ,Sub_Total__c,GST__c,Total_Amount__c,Company__r.Company_Name__c,
                           Company__r.ABN__c,Company__r.Address__c,Company__r.Phone_Number__c,Company__r.Address_Latest__Street__s,
                           Company__r.Address_Latest__City__s,Company__r.Address_Latest__StateCode__s,Company__r.Address_Latest__PostalCode__s,
                           Invoice_Date__c,Post_Date__c,Include_GST__c,Participant__r.First_Name__c, Participant__r.Last_Name__c, 
                           (select Id,Tax_Amount__c,Total_Amount__c,Sub_Total__c,Accounting_Ledger_Items__c,Description__c,Company__c,Cr_Dr__c,Notes__c,
                            Entry_Type__c,Entity_Profile__c,Invoice_Date__c,Post_Date__c,Invoice_No__c,Comments__c,Sl_no__c,Tax_Inclusive__c,
                            Accounting_Ledger_Items__r.Account_Number__c,Accounting_Ledger_Items__r.Name,  Accounting_Ledger_Items__r.Category__r.Name, Entity_Profile__r.First_Name__c,
                            Entity_Profile__r.Last_Name__c,Entity_Profile__r.Name__c,Unit_Price__c,Quantity__c,Tax__c,Line_Items__c,Amount__c, RowKey__c
                            from Accounting_Journal_Entry__r where Amount__c!= null AND Tax__c != null)
                            FROM Accounting_Invoices_Expenses__c 
                            WHERE Id =: invoiceId];
            System.debug('InvoiceData for companyId: ' + JSON.serialize(InvoiceData));
        }
        return InvoiceData;
    } 
    /*  @AuraEnabled
    public static List<Accounting_Invoices_Expenses__c> getentityEmail(String invoiceId) {
        // Initialize a list to hold the result
        List<Accounting_Invoices_Expenses__c> InvoiceData = new List<Accounting_Invoices_Expenses__c>();
        if (invoiceId != null) {
            // If selectedId is provided, fetch the company with that specific ID
            InvoiceData = [SELECT Id,Invoice_No__c,Name, (select Id,  Entity_Profile__r.Email__c from Accounting_Journal_Entry__r)  FROM Accounting_Invoices_Expenses__c 
                            WHERE Id =: invoiceId];
            System.debug('InvoiceData: ' + JSON.serialize(InvoiceData));
        }
        return InvoiceData;
    } */
   @AuraEnabled
    public static String getentityEmail(String entryId) {
        String email;
        System.debug('🔍 Input Invoice ID: ' + entryId);
    
        if (entryId != null) {
            List<Accounting_Journal_Entry__c> entries = [
               SELECT Id, Entity_Profile__r.Email__c 
                        FROM Accounting_Journal_Entry__c WHERE Id = :entryId
                LIMIT 1
            ];
    
            System.debug('📄 Invoice Query Result: ' + JSON.serialize(entries));
    
            if (!entries.isEmpty()) {
                    email = entries[0].Entity_Profile__r.Email__c;
                    System.debug('✅ Extracted Email: ' + email);
                
            } else {
                System.debug('⚠️ No entry found with the provided ID.');
            }
        } else {
            System.debug('❌ Invoice ID is null.');
        }
    
        return email;
    }
         @AuraEnabled
    public static String getentityEmailForInvoices(String invoiceId) {
        String email;
        System.debug('🔍 Input Invoice ID: ' + invoiceId);
    
        if (invoiceId != null) {
            List<Accounting_Invoices_Expenses__c> invoices = [
               SELECT Id, (SELECT Id, Entity_Profile__r.Email__c FROM Accounting_Journal_Entry__r)
                   FROM Accounting_Invoices_Expenses__c WHERE Id = :invoiceId
               
            ];
    
            System.debug('📄 Invoice Query Result: ' + JSON.serialize(invoices));
    
            if (!invoices.isEmpty()) {
                    email = invoices[0].Accounting_Journal_Entry__r[0].Entity_Profile__r.Email__c;
                    System.debug('✅ Extracted Email: ' + email);
                
            } else {
                System.debug('⚠️ No entry found with the provided ID.');
            }
        } else {
            System.debug('❌ Invoice ID is null.');
        }
    
        return email;
    }

    /*@AuraEnabled(cacheable=true)
    public static Map<String, Object> getInvoiceHistoryDetails(Id invoiceId) {
        Map<String, Object> result = new Map<String, Object>();

        // Invoice
        Accounting_Invoices_Expenses__c invoice = [
            SELECT Id, Name,Post_Date__c,Due_Date__c,Invoice_Date__c, Status__c,GST__c, Total_Amount__c,Sub_Total__c,Invoice_No__c,Issued_Date__c, CreatedDate, LastModifiedDate
            FROM Accounting_Invoices_Expenses__c
            WHERE Id = :invoiceId
            LIMIT 1
        ];
        result.put('invoice', invoice);

        // Entry__c child records
        List<Accounting_Journal_Entry__c> entries = [
            SELECT Id, Name,Cr_Dr__c, Description__c, Amount__c,Tax_Amount__c,Total_Amount__c,Sub_Total__c,Tax_Inclusive__c,Sl_no__c,Entity_Profile__c ,Comments__c,Notes__c,
            CreatedDate, LastModifiedDate,Unit_Price__c,Quantity__c,Tax__c, Accounting_Ledger_Items__c
            FROM Accounting_Journal_Entry__c
            WHERE Accounting_Invoices_Expenses__c = :invoiceId
        ];
        result.put('entries', entries);

        // Invoice history
        List<Accounting_Invoices_Expenses__History> invoiceHistory = [
            SELECT Id, Field, OldValue, NewValue, CreatedDate, CreatedBy.Name
            FROM Accounting_Invoices_Expenses__History
            WHERE ParentId = :invoiceId
            ORDER BY CreatedDate DESC
        ];
        result.put('invoiceHistory', invoiceHistory);
		Set<Id> entryIds = new Set<Id>();
        for (Accounting_Journal_Entry__c entry : entries) {
            entryIds.add(entry.Id);
        }
        // Entry history
        List<Accounting_Journal_Entry__History> entryHistory = [
            SELECT Id, Field, OldValue, NewValue, CreatedDate, CreatedBy.Name, ParentId
            FROM Accounting_Journal_Entry__History
            WHERE ParentId IN :entryIds
            ORDER BY CreatedDate DESC
        ];
        result.put('entryHistory', entryHistory);

        return result;
    }*/
    @AuraEnabled
    public static Map<String, Object> getInvoiceHistoryDetails(Id invoiceId) {
        Map<String, Object> result = new Map<String, Object>();
    
        try {
            // ✅ Invoice Query (safe)
            List<Accounting_Invoices_Expenses__c> invoiceList = [
                SELECT Id, Name, Post_Date__c, Due_Date__c, Invoice_Date__c, Status__c,
                       GST__c, Total_Amount__c, Sub_Total__c, Invoice_No__c, Issued_Date__c,
                       CreatedDate, LastModifiedDate
                FROM Accounting_Invoices_Expenses__c
                WHERE Id = :invoiceId
                LIMIT 1
            ];
            if (invoiceList.isEmpty()) {
                throw new AuraHandledException('Invoice not found for ID: ' + invoiceId);
            }
            Accounting_Invoices_Expenses__c invoice = invoiceList[0];
            result.put('invoice', invoice);
    
            // ✅ Entry__c child records
            List<Accounting_Journal_Entry__c> entries = [
                SELECT Id, Name, Cr_Dr__c, Description__c, Amount__c, Tax_Amount__c,
                       Total_Amount__c, Sub_Total__c, Tax_Inclusive__c, Sl_no__c,
                       Entity_Profile__c, Comments__c, Notes__c, CreatedDate,
                       LastModifiedDate, Unit_Price__c, Quantity__c, Tax__c,
                       Accounting_Ledger_Items__c,Accounting_Ledger_Items__r.Name,Entity_Profile_Name__c
                FROM Accounting_Journal_Entry__c
                WHERE Accounting_Invoices_Expenses__c = :invoiceId
            ];
            result.put('entries', entries);
            System.debug('✅ Entries size: ' + entries.size());
    
            // ✅ Invoice History
            List<Accounting_Invoices_Expenses__History> invoiceHistory = [
                SELECT Id, Field, OldValue, NewValue, CreatedDate, CreatedBy.Name
                FROM Accounting_Invoices_Expenses__History
                WHERE ParentId = :invoiceId
                ORDER BY CreatedDate ASC
            ];
            result.put('invoiceHistory', invoiceHistory);
            System.debug('✅ Invoice History size: ' + invoiceHistory.size());
    
            // ✅ Entry History only if entries exist
            Set<Id> entryIds = new Set<Id>();
            for (Accounting_Journal_Entry__c entry : entries) {
                entryIds.add(entry.Id);
            }
    
            List<Accounting_Journal_Entry__History> entryHistory = new List<Accounting_Journal_Entry__History>();
            if (!entryIds.isEmpty()) {
                entryHistory = [
                    SELECT Id, Field, OldValue, NewValue, CreatedDate, CreatedBy.Name, ParentId
                    FROM Accounting_Journal_Entry__History
                    WHERE ParentId IN :entryIds
                    ORDER BY CreatedDate ASC
                ];
            }
            result.put('entryHistory', entryHistory);
            System.debug('✅ Entry History size: ' + entryHistory.size());
    
        } catch (Exception ex) {
            System.debug('❌ Exception: ' + ex.getMessage());
            throw new AuraHandledException('Error getting invoice history: ' + ex.getMessage());
        }
    
        return result;
    }
    @AuraEnabled
    public static Boolean checkDateOverlapIct(Date sDate, Date eDate, Id companyId, Boolean ictInvoiceEntry,Id staffId) {
        List<Accounting_Invoices_Expenses__c> existingInvoices = [
            SELECT Id, Start_Date__c, End_Date__c
            FROM Accounting_Invoices_Expenses__c
            WHERE Company__c = :companyId AND ICT_Invoice_Entry__c =:ictInvoiceEntry and Staff__c =:staffId
              AND (
                  (Start_Date__c <= :eDate AND End_Date__c >= :sDate)
              )
        ];
        
        return !existingInvoices.isEmpty();
    }
    // THIS getLedgerItemsPrioritizedIncome IS USED IN  FURTHER  ENHANCEMENTS
    /*   @AuraEnabled
    public static List<Accounting_Ledger_Items__c> getLedgerItemsPrioritizedIncome(Id companyId) {
        String currentUserId = UserInfo.getUserId();
    
        try {
            // Get the current user's organization name
            User currentUser = [
                SELECT Id, Organization_Name__c 
                FROM User 
                WHERE Id = :currentUserId 
                LIMIT 1
            ];
    
            // First, get all income-related ledger items
            List<Accounting_Ledger_Items__c> incomeLedgerItems = [
                SELECT Id, Name, Account_Number__c, Category__r.Name
                FROM Accounting_Ledger_Items__c 
                WHERE 
                    Category__r.Account_List__r.Company__r.Organization__r.Name = :currentUser.Organization_Name__c AND
                    Category__r.Account_List__r.Company__c = :companyId AND
                    Category__r.Name LIKE '%Income%'
                ORDER BY Account_Number__c
            ];
    
            // Second, get all NON-income-related items (excluding income manually)
            List<Accounting_Ledger_Items__c> allLedgerItems = [
                SELECT Id, Name, Account_Number__c, Category__r.Name
                FROM Accounting_Ledger_Items__c 
                WHERE 
                    Category__r.Account_List__r.Company__r.Organization__r.Name = :currentUser.Organization_Name__c AND
                    Category__r.Account_List__r.Company__c = :companyId
                ORDER BY Account_Number__c
            ];
    
            // Filter out income items from the full list
            List<Accounting_Ledger_Items__c> nonIncomeLedgerItems = new List<Accounting_Ledger_Items__c>();
            for (Accounting_Ledger_Items__c item : allLedgerItems) {
                if (item.Category__r.Name == null || !item.Category__r.Name.containsIgnoreCase('Income')) {
                    nonIncomeLedgerItems.add(item);
                }
            }
    
            // Merge both lists: income items first, then others
            incomeLedgerItems.addAll(nonIncomeLedgerItems);
            return incomeLedgerItems;
    
        } catch (Exception e) {
            System.debug('❌ Error fetching Ledger Items: ' + e.getMessage());
            throw new AuraHandledException('Error retrieving ledger items: ' + e.getMessage());
        }
    }*/

}