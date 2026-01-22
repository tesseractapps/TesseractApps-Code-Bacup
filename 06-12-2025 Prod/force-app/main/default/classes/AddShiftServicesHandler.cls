public class AddShiftServicesHandler {
    @AuraEnabled
    public static string CreateShiftWithStaff(String shiftId, String StartTime, String endTime, Decimal Hourlyrate, String staffId,string ShiftList,Boolean isStaffChnaged,Boolean isSplitCheckBox) {
        
        try {
            // Fetch the existing shift details
            Add_Shift__c addShift = [
                SELECT Id, Location__Street__s, Location__City__s, Location__StateCode__s, Location__CountryCode__s, Facility__c,Role__c,Start_Time__c,End_Time__c,
                Start_Date__c, End_Date__c, Location__PostalCode__s, Day_Name__c, Shift_Type__c 
                FROM Add_Shift__c 
                WHERE Id = :shiftId 
                LIMIT 1
            ];
            system.debug('IsstaffChanged '+isStaffChnaged);
            ShiftWrapper shift = (ShiftWrapper) JSON.deserialize(ShiftList, ShiftWrapper.class);
            system.debug('shift times '+shift);
            Add_Shift__c serviceShift = new Add_Shift__c();
            serviceShift.Start_time_picklist__c =shift.startTime; 
            serviceShift.End_time_picklist__c=shift.endTime;
            if(isSplitCheckBox ==true){
               serviceShift.Split_Shifts__c=true; 
            }
            if(shift.addShiftId != null  && isStaffChnaged ==false){
                serviceShift.Id=shift.addShiftId; 
                update serviceShift;
                return 'updated AddShiftdeatils';
            }else{
                    serviceShift.Quantity__c = 1;
                    serviceShift.Shift_Type__c = addShift.Shift_Type__c;
                    serviceShift.Start_Date__c = date.valueof(shift.startDate);
                	serviceShift.End_Date__c=date.valueof(shift.endDate);
                    serviceShift.Location__Street__s = addShift.Location__Street__s;
                    serviceShift.Location__City__s = addShift.Location__City__s;
                    serviceShift.Location__StateCode__s = String.valueOf(addShift.Location__StateCode__s);
                    serviceShift.Location__CountryCode__s = addShift.Location__CountryCode__s;
                    serviceShift.Location__PostalCode__s = addShift.Location__PostalCode__s;
                    serviceShift.Day_Name__c = addShift.Day_Name__c;
                    serviceShift.Facility__c = addShift.Facility__c;
                    serviceShift.Start_Time__c = addShift.Start_Time__c;
                    serviceShift.End_Time__c = addShift.End_Time__c;
                   serviceShift.Role__c = addShift.Role__c;
                    serviceShift.Get_Facility__c = false;
                    serviceShift.Is_EOI__c = false;
                insert serviceShift;  
                
                try {
                    // Create a new shift-staff association record
                    ShiftwithStaff__c stf = new ShiftwithStaff__c();
                    stf.Add_Shift__c = serviceShift.Id;
                    stf.Staff_Final_Hourly_Rate__c = Hourlyrate;
                    stf.Attendence__c = true;
                    stf.Comments__c = 'Allocated during service creation';
                    //stf.Split_Shifts__c=true;
                    stf.Staff__c = staffId;
                    insert stf;
                    return stf.Id; // Return ShiftwithStaff__c ID if successful
                } catch (DmlException dmlEx) {
                    String errorMessage = 'Shift association failed: ' + dmlEx.getMessage();
                    
                    throw new AuraHandledException(errorMessage);
                }
                
            }
                 
        } catch (DmlException dmlEx) {
            String errorMessage = 'Shift association failed: ' + dmlEx.getMessage();
           
            throw new AuraHandledException(errorMessage);
        }
    }
    
  
    
        public class ShiftWrapper {
            public String id;
            public String startTime;
            public String endTime;
            public string addShiftId;
            public date startDate;
            public date endDate;
    }
    
    
}