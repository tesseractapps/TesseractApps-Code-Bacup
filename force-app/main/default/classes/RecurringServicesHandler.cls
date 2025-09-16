public class RecurringServicesHandler implements Queueable  {
    
    public String shiftId;
    public Map<Id, Date> staffIds;
    public Date endDate;
    public Map<String, Decimal> hourlyRates;
    public String shiftWithStaffID; // Pass this for the second queueable
    public boolean includeParticipants;
    public Integer recursionDepth = 0; // Add a depth counter
    
      public RecurringServicesHandler(String shiftId, Map<Id, Date> staffIds, Date endDate, Map<String, Decimal> hourlyRates, String shiftWithStaffID,boolean includeParticipants, Integer recursionDepth) {
        this.shiftId = shiftId;
        this.staffIds = staffIds;
        this.endDate = endDate;
        this.hourlyRates = hourlyRates;
        this.shiftWithStaffID = shiftWithStaffID;
        this.includeParticipants=includeParticipants;
        this.recursionDepth = recursionDepth;
    }
    
      public void execute(QueueableContext context) {
        // Call your existing logic for creating recurring shifts
       // AddShiftController.CreateRecurringShifts(shiftId, staffIds, endDate, hourlyRates);
        if (recursionDepth > 3) {
            System.debug('Maximum recursion depth reached. No further job chaining.');
            return; // Stop further job chaining
        }
       list<ShiftwithStaff__c> createdShifts= createRecurringShiftsQueaue(shiftId, staffIds, endDate, hourlyRates,includeParticipants);
       
          system.debug('shift with staff id '+shiftWithStaffID);
        // Chain the next queueable to create recurring services
          if(includeParticipants==true){
              System.enqueueJob(new ServicesQueueableHandler(shiftWithStaffID, endDate,createdShifts)); 
          }
       
    }
    
    public static list<ShiftwithStaff__c> createRecurringShiftsQueaue(String shiftId,map<id,date> staffIds, date enddate,Map<string,Decimal> hourlyrates, boolean includeParticipants){
        Add_Shift__c shift=[select id,Quantity__c, Role__c, Start_Date__c, Start_Time__c, End_Time__c,Facility__c, Location__c, Is_EOI__c,Start_time_picklist__c, 
                            End_time_picklist__c,Shift_Type__c,Break__c,Duration__c  from Add_Shift__c where id=:shiftId ]; 
        list<Add_Shift__c> insertshfts = new list<Add_Shift__c>();
        date strtdate=shift.Start_Date__c.addDays(1); 
        date Curdate=shift.Start_Date__c;
        Datetime dts = (DateTime)Curdate;
        String dayOfWeek = dts.format('EEEE');
        list<date> newdates = new  list<date>();   
        list<date> newdatestoreomve = new  list<date>();  
  		while(strtdate <= endDate) {
             Datetime dt = (DateTime)strtdate;
    		 String curdayOfWeek = dt.format('EEEE');         
            if(dayOfWeek == curdayOfWeek ){
 		 		 newdates.add(strtdate);
           }
   		  strtdate = strtdate.addDays(1);
		}
        
         list<Add_Shift__c>existshift=[select id,Start_Date__c from Add_Shift__c where Quantity__c=:shift.Quantity__c and Role__c=:shift.Role__c and Start_Date__c in:newdates and  
                                       Start_Time__c=:shift.Start_Time__c and End_Time__c=:shift.End_Time__c and Facility__c=:shift.Facility__c];
       system.debug('inialdates'+newdates);
        if(existshift.size()>0){
            for(Add_Shift__c shf : existshift){
                newdatestoreomve.add(shf.Start_Date__c);
               
             //    if(newdates.contains(shf.Start_Date__c)){  
             //    newdates=   newdates.remove(shf.Start_Date__c);
            //         }                
                }                
        }
     
        system.debug('finaldates'+newdatestoreomve);
         for(date d:newdates){
             if(!newdatestoreomve.contains(d)){
 		 	 Add_Shift__c newshift =shift.clone(false, true);
             newshift.Start_Date__c=d;
             insertshfts.add(newshift);
            }
        }
      
        list <ShiftwithStaff__c> recurringshifts = new list<ShiftwithStaff__c>();
        if(insertshfts.size()>0 ||  existshift.size()>0) {
           Database.SaveResult[] srList = Database.insert(insertshfts);
           insertshfts.addall(existshift);
               for(id i : staffIds.keyset()){
                    for(Add_Shift__c newsft : insertshfts){
                     ShiftwithStaff__c stf = New ShiftwithStaff__c();                                    
                    if(staffIds.get(i) >=newsft.Start_Date__c){                 
                    stf.Staff__c=i;
               		stf.Add_Shift__c=newsft.id;
               		stf.Attendence__c=true; 
                        if(hourlyrates.get(i)>0){
                            stf.Staff_Final_Hourly_Rate__c=hourlyrates.get(i); 
                        }
                    stf.Do_you_want_to_set_this_Recurring_Roster__c=true; 
                        if(includeParticipants==true){
                          stf.Include_Participants__c=true;  
                        }
                    recurringshifts.add(stf);                      
                  	 }
                     
               	  }
   				 }
       
            if(recurringshifts.size()>0) {
                insert recurringshifts;
            }
         }
        return recurringshifts;
    }



}