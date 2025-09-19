public with sharing class PayrollController {
  /*  @AuraEnabled(cacheable=true)
    public static Map<String, Integer> getPayrollData() {
        Map<String, Integer> payrollCounts = new Map<String, Integer>();

        try {
            // Query count for Finalised status
            Integer finalisedCount = [SELECT COUNT() FROM Payroll_Setting__c WHERE Status__c = 'Finalised' AND Next_Pay_Date__c >= LAST_N_DAYS:365];
            payrollCounts.put('finalisedCount', finalisedCount);
			system.debug('finalisedCount===>'+finalisedCount);

            // Query count for Submitted status
            Integer submittedCount = [SELECT COUNT() FROM Payroll_Setting__c WHERE Status__c = 'Submitted' AND Next_Pay_Date__c >= LAST_N_DAYS:365];
            payrollCounts.put('submittedCount', submittedCount);
			system.debug('submittedCount===>'+submittedCount);

            // Query count for STP Filed status
            Integer sTPFiledCount = [SELECT COUNT() FROM Payroll_Setting__c WHERE Status__c = 'STP Filed' AND Next_Pay_Date__c >= LAST_N_DAYS:365];
            payrollCounts.put('sTPFiledCount', sTPFiledCount);
			system.debug('sTPFiledCount===>'+sTPFiledCount);

        } catch (Exception e) {
            System.debug('Error fetching payroll data: ' + e.getMessage());
            throw new AuraHandledException('An error occurred while fetching payroll data.');
        }

        System.debug('payrollCounts===> ' + payrollCounts);
        return payrollCounts;
    }*/
    
    @AuraEnabled(cacheable=true)
    public static Map<String, Map<String, Integer>> getPayrollData() {
        String currentUserId = UserInfo.getUserId();
        
        User userRecord = [SELECT Id, Name,User_Type__c,Email, Organization_Name__c FROM User WHERE Id = :currentUserId LIMIT 1];
        
        Map<String, Map<String, Integer>> payrollData = new Map<String, Map<String, Integer>>();
        List<String> statuses = new List<String>{'Finalised', 'Submitted', 'STP Filed'};

        for (Integer i = 0; i <= 2; i++) {
            Date monthDate = Date.today().addMonths(-i);
            String monthLabel = DateTime.newInstance(monthDate.year(), monthDate.month(), monthDate.day()).format('MMM yyyy');
            payrollData.put(monthLabel, new Map<String, Integer>());

            for (String status : statuses) {
                Integer count = [
                    SELECT COUNT() 
                    FROM Payroll_Setting__c 
                    WHERE Status__c = :status AND Org_Name__c=:userRecord.Organization_Name__c
                    AND Next_Pay_Date__c = THIS_MONTH
                    AND CALENDAR_MONTH(Next_Pay_Date__c) = :monthDate.month()
                    AND CALENDAR_YEAR(Next_Pay_Date__c) = :monthDate.year()
                ];
                payrollData.get(monthLabel).put(status, count);
            }
        }
        return payrollData;
    }
    
}