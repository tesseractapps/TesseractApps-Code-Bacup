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
        for (AggregateResult ar : results) {String status = (String) ar.get('status');Integer count = ((Long) ar.get('total')).intValue();statusData.add(new StatusCountWrapper(status, count));
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
        for (AggregateResult ar : results) {String status = (String) ar.get('status');Integer count = ((Long) ar.get('total')).intValue();statusData.add(new StatusCountWrapper(status, count));
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
}