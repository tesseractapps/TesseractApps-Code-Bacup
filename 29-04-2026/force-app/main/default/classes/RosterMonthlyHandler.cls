public with sharing class RosterMonthlyHandler {

    @AuraEnabled
    public static List<ShiftWrapper> getStaffMonthlyData(Id staffId, Date startDate, Date endDate, Id facilityId){

        List<ShiftwithStaff__c> shiftsList = [
            SELECT Id, Staff__c, Staff__r.Display_Nickname__c, Date__c,Shift_Name__c,Role__c,
                   Add_Shift__c, Add_Shift__r.Shift_Name__c,Do_you_want_to_set_this_Recurring_Roster__c,
                   Add_Shift__r.Facility__c, Add_Shift__r.Group_Shifts__c,
                   Shift_Start_End_Time__c, Status__c,Split_Shift_RefId__c,
                   New_Split_Shift__c, Broken_Shift__c,(SELECT Id, Client__c,Client__r.Name__c,Client__r.Display_Nickname__c, Client__r.First_Name__c, Client__r.Last_Name__c,Status__c,Resource_Name__c,Service_Type_Name__c,Description__c,GST__c, 
                  Client__r.Picture__c,Lineitem__c,Date_of_Service__c,Amount__c,Available_Fund__c,Unit_Price__c,Qty__c FROM Services_and_Support_Plans__r)
            FROM ShiftwithStaff__c
            WHERE Staff__c = :staffId
            AND Add_Shift__r.Facility__c = :facilityId
            AND Date__c >= :startDate
            AND Date__c <= :endDate
            AND (
                (Attendence__c = true AND Un_Assigned_Shift__c = false)
                OR
                (Attendence__c = false AND Status__c = 'Draft')
            )
        ];

        // Query shift types for colors
        List<Shift_Type__c> shiftTypes = [
            SELECT Id,Name, Facility__c, Colour__c
            FROM Shift_Type__c
            WHERE Facility__c = :facilityId
        ];

        // Map shift name -> css color
        Map<String,String> shiftColorMap = new Map<String,String>();

        for (Shift_Type__c st : shiftTypes) {

            String css =
                'border-left:6px solid ' + st.Colour__c +
                ';background-color:' + st.Colour__c + '20' +
                ';color:' + st.Colour__c +
                ';border-radius:6px;';

            shiftColorMap.put(st.Id, css);
        }

        List<ShiftWrapper> response = new List<ShiftWrapper>();

        for(ShiftwithStaff__c sh : shiftsList){

            ShiftWrapper w = new ShiftWrapper();

            w.shiftId = sh.Id;
            w.shiftDate = sh.Date__c;
           if(sh.Services_and_Support_Plans__r != null && !sh.Services_and_Support_Plans__r.isEmpty()){
                Services_and_Support_Plan__c sp = sh.Services_and_Support_Plans__r[0];
                w.staffName = sp.Client__r.Display_Nickname__c;
              } else {
                w.staffName = sh.Role__c;
             }
            w.status = sh.Status__c;
            w.shiftTime = sh.Shift_Start_End_Time__c;

            w.isSplitShift = sh.New_Split_Shift__c;
            w.isBrokenShift = sh.Broken_Shift__c;
            w.isGroupShift = sh.Add_Shift__r.Group_Shifts__c;
            w.splitShiftrefId=sh.Split_Shift_RefId__c;
            w.isRecurring=sh.Do_you_want_to_set_this_Recurring_Roster__c;

           String shiftName = sh.Shift_Name__c != null ? sh.Shift_Name__c : sh.Add_Shift__r.Shift_Name__c;

            if(shiftColorMap.containsKey(shiftName)){
                w.color = shiftColorMap.get(shiftName);
            }
            else{
                w.color = 'border-left:6px solid #D35701;background-color:#D3570120;color:#D35701;border-radius:6px;';
            }

            response.add(w);
        }

        return response;
    }

    public class ShiftWrapper {

        @AuraEnabled public Id shiftId;
        @AuraEnabled public Date shiftDate;
        @AuraEnabled public String staffName;
        @AuraEnabled public String status;
        @AuraEnabled public String shiftTime;
        @AuraEnabled public String color;

        @AuraEnabled public Boolean isSplitShift;
        @AuraEnabled public Boolean isBrokenShift;
        @AuraEnabled public Boolean isGroupShift;
        @AuraEnabled public string splitShiftrefId;
        @AuraEnabled public Boolean isRecurring; 
        @AuraEnabled public String staffUrl;

    }
}