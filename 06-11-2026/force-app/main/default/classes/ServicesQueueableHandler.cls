public class ServicesQueueableHandler implements Queueable {
    public String shiftWithStaffID;
    public Date endDate;
    public list<ShiftwithStaff__c> recurredShifts;
    
    public ServicesQueueableHandler(String shiftWithStaffID, Date endDate,list<ShiftwithStaff__c> recurredShifts) {
        this.shiftWithStaffID = shiftWithStaffID;
        this.endDate = endDate;
        this.recurredShifts=recurredShifts;
    }
    
    public void execute(QueueableContext context) {
        // Call your existing logic for creating recurring services
        CreateRecurringServices(shiftWithStaffID, endDate,recurredShifts);
    }
    
     public static void createRecurringServices(string shiftWithStaffID,Date recurringEndDate,list<ShiftwithStaff__c> recurredShifts){
        list<Services_and_Support_Plan__c> servicesupportlist = new list<Services_and_Support_Plan__c>();
        try{
            //system.debug('current shift ID  '+shiftWithStaffID);
            //system.debug('recurr to end date '+recurringEndDate);
            system.debug('recurring shifts '+recurredShifts);
            ShiftwithStaff__c currentShift=[select id,Start_time_Formula__c,End_time_formula__c,Duration__c,Date__c,(select id,Services__c,Funds_Tracker__c,Service_Users__c,Status__c,Date_of_Service__c,Client__c,State__c,Start_Time__c,End_Time__c,Service_Type__c,
                                                                                                                     ShiftwithStaff__c,Qty__c  from Services_and_Support_Plans__r where ShiftwithStaff__c =: shiftWithStaffID ) from ShiftwithStaff__c  where id =:shiftWithStaffID limit 1];
            system.debug('current shifts  '+currentShift);
            
           // list<ShiftwithStaff__c> recurrShifts =[select id,Date__c from  ShiftwithStaff__c where Start_time_Formula__c =:currentShift.Start_time_Formula__c and End_time_formula__c =:currentShift.End_time_formula__c and Date__c >: currentShift.Date__c and Date__c <=:recurringEndDate];
            //system.debug('recurr shifts '+recurrShifts);
           Date nextServiceDate = (currentShift.Date__c).addDays(7);
            for(ShiftwithStaff__c shiftStaff :recurredShifts){
                 integer counter =7;
                for(Services_and_Support_Plan__c ss: currentShift.Services_and_Support_Plans__r){
                    Services_and_Support_Plan__c serviceRec = new Services_and_Support_Plan__c();
                    serviceRec.Services__c=ss.Services__c;
                    serviceRec.Funds_Tracker__c=ss.Funds_Tracker__c;
                    serviceRec.Service_Users__c=ss.Service_Users__c;           
                    serviceRec.Status__c=ss.Status__c;
                     serviceRec.Date_of_Service__c = nextServiceDate;
                  // serviceRec.Date_of_Service__c=shiftStaff.Date__c;
                    serviceRec.Client__c=ss.Client__c;
                    serviceRec.State__c=ss.State__c;
                    serviceRec.Start_Time__c=ss.Start_Time__c;
                    serviceRec.End_Time__c=ss.End_Time__c;
                    serviceRec.Service_Type__c=ss.Service_Type__c;
                    serviceRec.Qty__c=ss.Qty__c;
                    servicerec.ShiftwithStaff__c=shiftStaff.Id; 
                    servicesupportlist.add(serviceRec);  
                }
                 nextServiceDate = nextServiceDate.addDays(7);
            }
            if(servicesupportlist.size()>0){
                insert servicesupportlist;
            } 
        }catch(exception e){
            system.debug('Error in creating recurring services :'+e);
        }    
        
    } 

}