public with sharing class PayrollController {
    
    @AuraEnabled(cacheable=true)
    public static Map<String, Map<String, Integer>> getPayrollData() {
        String currentUserId = UserInfo.getUserId();
        
        User userRecord = [
            SELECT Id, Name, User_Type__c, Email, Organization_Name__c 
            FROM User 
            WHERE Id = :currentUserId 
            LIMIT 1
        ];
        
        Map<String, Map<String, Integer>> payrollData = new Map<String, Map<String, Integer>>();
        List<String> statuses = new List<String>{'Finalised', 'Submitted', 'STP Filed'};
            
            for (Integer i = 0; i <= 2; i++) {
                Date monthDate = Date.today().addMonths(-i);
                String monthLabel = DateTime.newInstance(monthDate.year(), monthDate.month(), 1).format('MMM yyyy');
                payrollData.put(monthLabel, new Map<String, Integer>());
                
                for (String status : statuses) {
                    Integer count = [
                        SELECT COUNT() 
                        FROM Payroll_Setting__c 
                        WHERE Status__c = :status 
                        AND Org_Name__c = :userRecord.Organization_Name__c
                        AND CALENDAR_MONTH(Next_Pay_Date__c) = :monthDate.month()
                        AND CALENDAR_YEAR(Next_Pay_Date__c) = :monthDate.year()
                    ];
                    payrollData.get(monthLabel).put(status, count);
                }
            }
        
        System.debug('payrollData >> ' + payrollData);
        return payrollData;
    }  
}