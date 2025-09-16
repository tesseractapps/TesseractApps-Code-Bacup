public class ShiftNameAssignClass {
    public static void assignShiftName(){
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
        
    }

}