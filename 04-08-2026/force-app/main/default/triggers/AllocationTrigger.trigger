trigger AllocationTrigger on Allocation__c (before insert,before update) {
    if(Trigger.isBefore){
        List<Date> holidayValues = new List<Date>();
        for(Holiday holidayList : [SELECT ActivityDate,Description,Id,IsAllDay,IsRecurrence,Name FROM Holiday]){
            holidayValues.add(holidaylist.ActivityDate);
        }
        for(Allocation__c allocation : Trigger.new){
            System.debug('allocation.Working_Hours__c '+allocation.Working_Hours__c);
            if(allocation.Working_Hours__c==0){
                allocation.Working_Hours__c=8;
            }
            
           // allocation.Working_Hours__c = allocation.IN_and_Out_Time__c;
            Datetime tempDateTime = (DateTime) allocation.Start_Date__c;
            String dayOfWeek = tempDateTime.formatGMT( 'EEEE' );
            if(dayOfWeek == 'Saturday' ){
             //   allocation.Penalty_Hours__c = allocation.Working_Hours__c*1.25;
                allocation.Working_Hours__c=0;
                allocation.Saturday_Hours__c= allocation.Working_Hours__c*allocation.Saturday_Rate__c;
                System.debug('allocation.Penalty_H allocation.Saturday_Hours__c'+allocation.Saturday_Hours__c);
            }
             if(dayOfWeek == 'Sunday'){
             //   allocation.Penalty_Hours__c = allocation.Working_Hours__c*1.25;
                allocation.Working_Hours__c=0;
                allocation.Sunday_Hours__c= allocation.Working_Hours__c*allocation.Sunday_Rate__c;
                System.debug('allocation.Penalty_H allocation.Sunday_Hours__c'+allocation.Sunday_Hours__c);
            }else if(holidayValues.contains(allocation.Start_Date__c)){
              //  allocation.Public_Holiday_Hours__c = allocation.Working_Hours__c*2.25;
                allocation.Working_Hours__c=0;
                allocation.Public_Holiday_Hours__c = allocation.Working_Hours__c*allocation.Public_holiday_rate__c;
                  System.debug('allocation.Public_Holiday_Hours__c '+allocation.Public_Holiday_Hours__c);
            }else{
                //allocation.Working_Hours__c = 8;
                System.debug('allocation.Working_Hours__c '+allocation.Working_Hours__c);
            }
           
        }
       
          
        
    }

}