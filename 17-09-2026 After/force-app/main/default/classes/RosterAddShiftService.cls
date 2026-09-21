public class RosterAddShiftService {
     @AuraEnabled
    public static String createServices(Map<String,RosterServiceHandler>rosterServiceMap, List<ShiftwithStaff__c> shiftWithStaffList,boolean isUpdate,boolean RecurringWithIncludeAndNewParticipants, List<Id> staffIdList, map<String,string> breakMap){
         // Initialize response
        Map<String, Object> response = new Map<String, Object>();
      
        system.debug('in shift with staff '+rosterServiceMap);
        system.debug('shift with staff list '+shiftWithStaffList);
        try {
            List<Services_and_Support_Plan__c> serviceList = new List<Services_and_Support_Plan__c>();
            boolean IsRecurringServiceFlag=isUpdate;
               Set<Id> staffIdSet = new Set<Id>(staffIdList);
           map<Id,Staff__c> staffIdMap = new Map<Id,Staff__c>([Select Id,Paid_Break__c  from Staff__c where Id In: staffIdSet]);


            for (ShiftwithStaff__c shift : shiftWithStaffList) {
                if(rosterServiceMap.get(shift.RefId__c).participant !=null && rosterServiceMap.get(shift.RefId__c).serviceTypeId !=null) {
                    system.debug('if addShiftupdateFlag ' + IsRecurringServiceFlag);
                    system.debug('if condition ' +  rosterServiceMap.get(shift.RefId__c).serviceSuppoertId);
                    Services_and_Support_Plan__c service = new Services_and_Support_Plan__c();
                    if (IsRecurringServiceFlag && rosterServiceMap.get(shift.RefId__c).serviceSuppoertId != null) {
                        service = new Services_and_Support_Plan__c(Id = rosterServiceMap.get(shift.RefId__c).serviceSuppoertId);  // Only for the first shift
                        IsRecurringServiceFlag = false;  // Ensure subsequent shifts are treated as new records
                    } else {
                        service = new Services_and_Support_Plan__c();
                         system.debug('if participant id ' + rosterServiceMap.get(shift.RefId__c).participant);
                         service.Client__c = rosterServiceMap.get(shift.RefId__c).participant;
                    }
                     system.debug('if addShiftupdateFlag ' + IsRecurringServiceFlag);
                    service.Services__c=rosterServiceMap.get(shift.RefId__c).serviceNameValue;
                    service.Funds_Tracker__c=rosterServiceMap.get(shift.RefId__c).serviceTypeId;
                    service.Service_Users__c=shift.Staff__c;           
                    service.Status__c='Not Yet Invoiced';
                    if(shift.Do_you_want_to_set_this_Recurring_Roster__c==false){
                       service.Date_of_Service__c = rosterServiceMap.get(shift.RefId__c).serviceDate;  
                    }else{
                         service.Date_of_Service__c =shift.Recurring_Date__c;
                    }
                   
                  
                    service.Edited_Unit_Price__c=rosterServiceMap.get(shift.RefId__c).serviceAmount;
                    service.State__c=rosterServiceMap.get(shift.RefId__c).state;
                    service.Start_Time_24_Format__c=rosterServiceMap.get(shift.RefId__c).startTime;
                    service.End_Time_24_Format__c=rosterServiceMap.get(shift.RefId__c).endTime;
                    service.Service_Type__c=rosterServiceMap.get(shift.RefId__c).selectedNdisIdValue;
                   // service.Qty__c=rosterServiceMap.get(shift.RefId__c).duration;
                    Staff__c staffRec = staffIdMap.get(shift.Staff__c);
                    
                   service.Qty__c = calculateFinalDuration(rosterServiceMap.get(shift.RefId__c).duration,Decimal.Valueof(breakMap.get(shift.RefId__c)), staffRec);
                    service.ShiftwithStaff__c=shift.Id; 
                   /// service.GST__c='Yes';
                    serviceList.add(service); 
                    if(RecurringWithIncludeAndNewParticipants){
                        break;
                    }
                    system.debug(' services created '+serviceList);
                }
                	
               
            }
            if (!serviceList.isEmpty()) {
                upsert serviceList;
            }
           
			system.debug(' services created '+serviceList);
            // Set success response
            response.put('isSuccess', true);
            response.put('servicemessage', 'services created successfully');
        } catch (Exception e) {
            // Set failure response
            response.put('isSuccess', false);
            system.debug(' services failed  '+e.getMessage());
            response.put('servicemessage', 'Failed to services: ' + e.getMessage());
        }

        // Return response as JSON
        return JSON.serialize(response);
        
    }
    public static Decimal calculateFinalDuration(Decimal duration, Decimal breakValue, Staff__c staffRec) {
        Decimal finalDuration = duration;
         Decimal breakTime = breakValue ==30 ? 0.5 : 0;

        if (staffRec != null && staffRec.Paid_Break__c) {
            if ((duration + breakTime) >= 5) {
                finalDuration = duration + 0.5;
            } else {
                finalDuration = duration;
            }
        }

        return finalDuration;
    }
    
    
    public class RosterServiceHandler{
        public string id;
        public integer index;
        public time startTime;
        public time endTime;
        public string startTimeAMPM;
        public string endTimeAMPM;
        public decimal duration;
        public string serviceTypeId;
        public string StaffId;
        public string serviceNameValue;
        public string selectedNdisIdValue;
        public boolean SplitShift;
        public decimal serviceStffaHourlyRate;
        public string state;
        public date serviceDate;
        public string participant;
        public string shiftWithStaffId;
        public string serviceSuppoertId;
        public string splitShiftColor;
        public string splitShiftHeight;
       //public list<longShiftDetails> longShiftWrapper;
        public string LongShiftTimeSlots;
        public decimal serviceAmount;
            
    }
    
    
   

}