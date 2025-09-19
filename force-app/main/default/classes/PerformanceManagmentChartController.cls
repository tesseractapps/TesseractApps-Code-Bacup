public with sharing class PerformanceManagmentChartController {
    @AuraEnabled(cacheable=true)
    public static Map<String, Integer> getPerformanceManagmentStatusData(String userId) {
        if (String.isBlank(userId)) {
            throw new IllegalArgumentException('User Id cannot be null or empty.');
        }
        
        System.debug('Received userId in Apex: ' + userId);
        
        // Query the user's organization
        User currentUser = [SELECT Id,Email,User_Type__c, Organization_Name__c FROM User WHERE Id = :userId LIMIT 1];
        System.debug('Fetched currentUser: ' + currentUser);
        
        List<Staff__c> staffList1 = [SELECT Id,Email_Address__c FROM Staff__c WHERE Organization_Full_Name__c = :currentUser.Organization_Name__c AND Email_Address__c =:currentUser.Email LIMIT 1];
        
        // Query staff in the same organization
        List<Staff__c> staffList = [SELECT Id FROM Staff__c WHERE Organization_Full_Name__c = :currentUser.Organization_Name__c];
        System.debug('Fetched staff list: ' + staffList);
        
        // Initialize task counts
        Map<String, Integer> taskData = new Map<String, Integer>();
        try {
            
            if(currentUser.User_Type__c == 'NDIS Staff' || currentUser.User_Type__c == 'Roster Admin'){
            Integer needReviewerCount = [
                SELECT COUNT() 
                FROM Performance__c 
                WHERE Status__c = 'Need Reviewer Acceptance' 
                AND Staff__c IN :staffList1
            ];
            Integer completedCount = [
                SELECT COUNT() 
                FROM Performance__c 
                WHERE Status__c = 'Completed' 
                AND Staff__c IN :staffList1
            ];
            
            taskData.put('needReviewerAcceptance', needReviewerCount);
                taskData.put('completed', completedCount);} else {Integer needReviewerCount = [SELECT COUNT() FROM Performance__c WHERE Status__c = 'Need Reviewer Acceptance' AND Staff__c IN :staffList];Integer completedCount = [SELECT COUNT() FROM Performance__c WHERE Status__c = 'Completed' AND Staff__c IN :staffList];
            
            taskData.put('needReviewerAcceptance', needReviewerCount);
                taskData.put('completed', completedCount);                
            }
        } catch (Exception e) {
            System.debug('Error in getPerformanceManagmentStatusData: ' + e.getMessage());
            taskData.put('needReviewerAcceptance', 0);
            taskData.put('completed', 0);
        }
        system.debug('taskData===>'+taskData);
        return taskData;
    }
    
    
    @AuraEnabled(cacheable=true)
    public static Map<String, Integer> getLeaveStatusCounts(Id userId) {
        system.debug('userId===>'+userId);
        
       User currentUser = [SELECT Id, Organization_Name__c,User_Type__c, Email FROM User WHERE Id = :userId LIMIT 1];
        Staff__c currentStaff = [Select Id, Email_Address__c From Staff__c Where Email_Address__c =:currentUser.Email LIMIT 1];
        List<Staff__c> staffList = [SELECT Id FROM Staff__c WHERE Organization_Full_Name__c = :currentUser.Organization_Name__c];
        Map<String, Integer> statusCounts = new Map<String, Integer>();

        // Initialize counts
        statusCounts.put('Requested', 0);
        statusCounts.put('Approved', 0);
        statusCounts.put('Rejected', 0);

        // Query Leave__c object for the specific user
       /* AggregateResult[] results = [
            SELECT Status__c, COUNT(Id) total
            FROM Leave__c
            WHERE Status__c IN ('Requested', 'Approved', 'Rejected')
            GROUP BY Status__c
        ];*/
        
        // Get first and last day of the current month
Date firstDayOfMonth = Date.today().toStartOfMonth();
Date lastDayOfMonth = Date.today().toStartOfMonth().addMonths(1).addDays(-1);
        
        AggregateResult[] results;
        
        if (currentUser.User_Type__c == 'HR Admin' || currentUser.User_Type__c == 'NDIS Org Admin' || currentUser.User_Type__c == 'ICT Admin') {results = [SELECT Status__c, COUNT(Id) total FROM Leave__c WHERE Staff__c IN: staffList AND  Status__c IN ('Requested', 'Approved', 'Rejected')AND ((leave_applied_date__c >= :firstDayOfMonth AND leave_applied_date__c <= :lastDayOfMonth))
        GROUP BY Status__c];
                                                                                                     system.debug('if===>'+results);
        } else if(currentUser.User_Type__c == 'NDIS Staff' || currentUser.User_Type__c == 'ICT Staff'){
            
            results = [
                 SELECT Status__c, COUNT(Id) total
        FROM Leave__c
        WHERE Staff__c = :currentStaff.Id 
              AND Status__c IN ('Requested', 'Approved', 'Rejected')
              AND (
                  (leave_applied_date__c >= :firstDayOfMonth AND leave_applied_date__c <= :lastDayOfMonth)
              )
        GROUP BY Status__c
                
                ];
           system.debug('else if===>'+results); 
        }

        // Populate the map with actual counts from query
        if(results != null){
        for (AggregateResult ar : results) {
            String status = (String) ar.get('Status__c'); 
            Integer count = (Integer) ar.get('total'); // Use alias name

            statusCounts.put(status, count);
        }
        }
        system.debug('statusCounts===>'+statusCounts);
        return statusCounts;
    }
    
    
}