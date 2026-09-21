public class ShiftNameAssignClass {
  /*  public static void assignShiftName(){
          List<Shift_Type__c> shiftTypeAndTimings=[SELECT Id, Name,Facility__c, Start_Time__c, End_Time__c, Shift_Type__c,Colour__c  FROM Shift_Type__c];  
         
          Map<Id, Map<String, String>> shiftTimeMap = new Map<Id, Map<String, String>>();

               for (Shift_Type__c sh : shiftTypeAndTimings) {
                    if (!shiftTimeMap.containsKey(sh.Facility__c)) {
                        shiftTimeMap.put(sh.Facility__c, new Map<String, String>());
                    }
                    shiftTimeMap.get(sh.Facility__c).put(sh.Name, sh.Id);
			}
           System.debug('shiftTimeMap ' +shiftTimeMap);
           List<Availability__c> shiftsToUpdate = new List<Availability__c>();
         list<Availability__c> addshiftLsit=[SELECT Id,Staff__c,Staff__r.Facility__c, Shift_Type__c FROM Availability__c];
            for(Availability__c aa:addshiftLsit){
                Id facilityId = aa.Staff__r.Facility__c;
               
                String shiftType = aa.Shift_Type__c;
              //  System.debug('shiftName ' +shiftType); 
                // Check if map contains that facility and shift name
               if (shiftTimeMap.containsKey(facilityId) && shiftTimeMap.get(facilityId).containsKey(shiftType)) {
                    aa.Shift_Name__c = shiftTimeMap.get(facilityId).get(shiftType);
                    shiftsToUpdate.add(aa);
                } 
               
            }
         if (!shiftsToUpdate.isEmpty()) {
                   update shiftsToUpdate;
                }
                 System.debug('shiftsToUpdate ' +shiftsToUpdate);
        
    }*/
   public static void updateBillableHours(String orgId) {
      system.debug('org id in shift name class '+orgId);
        // Query related Services with needed fields
        Map<Id, Services_and_Support_Plan__c> services = new Map<Id, Services_and_Support_Plan__c>(
            [
                SELECT Id,
                       Qty__c,
                       ShiftwithStaff__r.Add_Shift__r.Duration__c,
                       ShiftwithStaff__r.Add_Shift__r.Break__c,
                       Service_Users__r.Paid_Break__c
                FROM Services_and_Support_Plan__c
                WHERE Service_Users__r.Facility__r.Organisation__c =:orgId
            ]
        );
      system.debug('services in shift name class '+services);
        List<Services_and_Support_Plan__c> servicesToUpdate = new List<Services_and_Support_Plan__c>();

        for (Services_and_Support_Plan__c svc : services.values()) {
            Decimal duration   = (svc.ShiftwithStaff__r.Add_Shift__r.Duration__c != null) 
                                   ? svc.ShiftwithStaff__r.Add_Shift__r.Duration__c : 0;
            Decimal breakValue = (svc.ShiftwithStaff__r.Add_Shift__r.Break__c != null) 
                                   ? Decimal.valueOf(svc.ShiftwithStaff__r.Add_Shift__r.Break__c) : 0;
            Boolean paidBreak  = (svc.Service_Users__r.Paid_Break__c == true);

            Decimal finalDuration = duration;

            // Apply your logic
            if (paidBreak) {
                if ((duration + breakValue) >= 5) {
                    finalDuration = duration + 0.5;
                } else {
                    finalDuration = duration;
                }
            }

            // Update only if value is different
            if (svc.Qty__c != finalDuration) {
                svc.Qty__c = finalDuration;
                servicesToUpdate.add(svc);
            }
        }

        if (!servicesToUpdate.isEmpty()) {
            update servicesToUpdate;
        }
    }

}