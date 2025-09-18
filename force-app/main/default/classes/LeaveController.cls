public with sharing class LeaveController {
    // test class for this controller is available in serviceandsupporthandlertest
    @AuraEnabled(cacheable=true)
    public static List<Leave__c> getLeaves(Id recordId, string OrgId) {
        System.debug('recordid' +recordId);
        return [SELECT Id, Type_of_Leave__c, From__c, To__c, Reason__c,Status__c,Leave_Document__c,Duration__c,Approved_by__c,Comments__c FROM Leave__c where 	Staff__c  =: recordId AND Staff__r.Facility__r.Organisation__c  =: orgId];       
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Leave__c> getLeavesByOrg(string orgId, Date startDate, Date endDate){
       System.debug('orgid' +orgId);
        System.debug('startdate' +startDate);
        System.debug('enddate' +endDate);
      try {  
      List<Leave__c> leaves =[SELECT Id,Type_of_Leave__c,Staff__c,From__c, To__c, Reason__c,Status__c,Leave_Document__c,Staff__r.Name,Staff__r.Last_Name__c,Staff__r.Display_Nickname__c,Staff__r.Facility__c,
                Duration__c,Approved_by__c,Comments__c FROM Leave__c
                where 	Staff__r.Facility__r.Organisation__c  =: orgId  AND leave_applied_date__c >= :startDate 
          AND leave_applied_date__c <= :endDate];
          system.debug('leaves'+leaves);
          return leaves;
         }catch (Exception e) {
            System.debug('An error occurred while fetching leaves by organization: ' + e.getMessage());
            throw new AuraHandledException('An error occurred while fetching leaves by organization. Please try again later.');
        } 
    }
   @AuraEnabled(cacheable=true)
    public static List<Public_Holiday__c> getHolidayCount(Date startDate, Date endDate, String state) {
        System.debug(' Start Date>> '+startDate);
        System.debug(' end  Date>> '+endDate);
        System.debug(' state >> '+state);
        //Date currentDate;
        
        // Query to fetch public holidays based on date range and state
        List<Public_Holiday__c> publicHolidays = [
            SELECT Date__c, Holiday_Name__c, State__c
            FROM Public_Holiday__c
            WHERE Date__c >= :startDate
            AND Date__c <= :endDate
           AND State__c INCLUDES (:state) // Include holidays with no specific state
        ];
       /* List<Public_Holiday__c> weekendHolidays = new List<Public_Holiday__c>();
        for(Public_Holiday__c holiday: publicHolidays){
            if (holiday.Date__c != null) {
              Integer dayOfWeek = holiday.Date__c.toStartOfWeek().daysBetween(holiday.Date__c) + 1;
              if (dayOfWeek == 6 || dayOfWeek == 7) { // 6 = Saturday, 7 = Sunday
                weekendHolidays.add(holiday);
              }  
            }
            System.debug('weekendHolidays'+ weekendHolidays.size());
        } */                                                                  
        return publicHolidays;
    }
    
    @AuraEnabled(cacheable=true)
   /* public static List<Public_Holiday__c> getHolidayList(String state) {
        return [SELECT Id, Holiday_Name__c, Date__c FROM Public_Holiday__c WHERE State__c INCLUDES (:state) ORDER BY Date__c ASC];
    }*/
    
    public static List<Public_Holiday__c> getHolidayList(String state, String financialYear) {
    // Determine start and end dates based on financialYear
    Date startDate;
    Date endDate;

    if (financialYear != null && financialYear.contains('-')) {
        String[] years = financialYear.split('-');
        Integer startYear = Integer.valueOf(years[0]);
        Integer endYear = Integer.valueOf(years[1]);

        startDate = Date.newInstance(startYear, 7, 1); // July 1st of the start year
        System.debug('start date >> '+startDate);
        endDate = Date.newInstance(endYear, 6, 30);   // June 30th of the end year
    } else {
        throw new AuraHandledException('Invalid financial year format');
    }

    // Fetch holidays based on state and financial year date range
    return [
        SELECT Id, Holiday_Name__c, Date__c
        FROM Public_Holiday__c
        WHERE State__c INCLUDES (:state)
        AND Date__c >= :startDate
        AND Date__c <= :endDate
        ORDER BY Date__c ASC
    ];
}
     @AuraEnabled
    public static List<Public_Holiday__c> holidayListbyOrg(string datePicker, string state){
         Date startDate = Date.valueOf(datePicker) -30 ;
         Date endDate = Date.valueOf(datePicker)+30;
        System.debug('date'+datePicker);
        System.debug('state'+state);
        List<Public_Holiday__c> holidayList=LeaveController.getHolidayCount(startDate, endDate, AddShiftHandler.getStateFullForm(state));
        return holidayList;
    }
        
    
}