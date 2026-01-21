public class AddShiftController {         
    @AuraEnabled
    public static List<Add_Shift__c> allocationList(
        List<String> roles, // Changed parameter to List<String>
        String startDate, 
        String endDate, 
        List<String> facilities // Changed parameter to List<String>
    ) {
        System.debug('startDate: ' + startDate);
        System.debug('endDate: ' + endDate);
        
        Date sDate = Date.valueOf(startDate);
        Date eDate = Date.valueOf(endDate); 
        
        User objUser = [SELECT Id, Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];
        String orgID = [SELECT Id FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1].Id;
        
        String query = 'SELECT Id, Direction__r.Name,Role__c,Date__c, Quantity__c, Allocated__c, Un_Allocated__c, Start_Date__c, Name, End_Date__c, Start_Time__c, End_Time__c, Facility_Name__c, Break__c, Break_Time__c, Duration__c, Shift_Start_End_Time__c, Get_Facility__c, Location__Street__s, Location__City__s, Location__CountryCode__s, Location__StateCode__s, Location__PostalCode__s, Shift_Type__c, Day_Name__c FROM Add_Shift__c WHERE Facility__r.Organisation__c = :orgID AND Un_Assigned_Shift__c=false ';
        system.debug('Roles in '+roles);
        system.debug('facilities '+facilities);
        // Updated to handle multiple roles
        if (roles != null && !roles.isEmpty()) {
            query += ' AND Role__c IN :roles';
        }
        
        // Updated to handle multiple facilities
        if (facilities != null && !facilities.isEmpty()) {
            query += ' AND Facility__c IN :facilities '; // Removed extra space before the colon
        }
        
        if(sDate !=null){
            query +=  ' AND Start_Date__c >=:sDate '  ;
        }
        if(eDate !=null){
            query += ' AND Start_Date__c <=:eDate ';
        }
        
        System.debug('query: ' + query);
        
        List<Add_Shift__c> listofShifts = Database.query(query);
        
        System.debug('listofShifts: ' + listofShifts);
        
        return listofShifts;
    }
    
    @AuraEnabled
    public static List<Add_Shift__c> getShiftList(List<String> role,string startDate){ 
        
        List<String> res = startDate.split('/');
        system.debug(res);
        system.debug('Roles '+role);
        date stDate =Date.newInstance(Integer.valueOf(res[2]), Integer.valueOf(res[1]), Integer.valueOf(res[0]));
        User objUser = [ SELECT Organization_Name__c FROM User WHERE Id = : UserInfo.getUserId() ];
        string orgID = [Select id from Organisation__c where name=:objUser.Organization_Name__c limit 1].Id;  
        List<Add_Shift__c> listofShifts =[Select id,Name,Direction__r.Name,Date__c,Quantity__c,Allocated__c,Facility__c,Un_Allocated__c,Start_Date__c,Send_Notification__c,Get_Facility__c,Service_Details__c,
                                          End_Date__c,Start_Time__c,End_Time__c,Facility_Name__c,Break__c,Duration__c,role__c,Shift_Start_End_Time__c,Public_holiday__c,Shift_Name__c,
                                          Location__Street__s,Location__City__s,Location__CountryCode__s,Location__StateCode__s,Location__PostalCode__s,Location__Latitude__s,Location__Longitude__s,End_time_picklist__c,Start_Time_Text__c,End_Time_Text__c,Participant_Address_checkbox__c,
                                          Start_time_picklist__c,Is_EOI__c,EOI_Staff__c,Shift_Type__c,Day_Name__c,Shift_Notes__c from Add_Shift__c 
                                          where Role__c IN:role and Start_Date__c=:stDate and Facility__r.Organisation__c=:orgID ];
        //Date__c>=:sDate and Date__c<=:eDate
        //and Start_Date__c>=:sDate and End_Date__c<=:eDate];
        System.debug(listofShifts);
        return listofShifts;
        
    }
    //Sowmya 
    @AuraEnabled
    public static List<ShiftwithStaff__c> getShiftStaff(List<string> ShiftIds,string staff, list<string> statusList ){        
        List<ShiftwithStaff__c> shiftStaffList=new  List<ShiftwithStaff__c>();
        User objUser = [ SELECT Organization_Name__c FROM User WHERE Id = : UserInfo.getUserId() ];
        string orgID = [Select id from Organisation__c where name=:objUser.Organization_Name__c limit 1].Id; 
        try {           
            string query2='select id,Staff__r.Email_Address__c,Staff__r.Name__c,Staff__r.Name,Staff__r.Last_Name__c,Facility__c,Add_Shift__r.Start_Date__c ,Add_Shift__r.Break__c,Add_Shift__r.Duration__c,Shift_Type__c,Add_Shift__r.Role__c,Attendence__c,Add_Shift__r.Direction__r.Name,Add_Shift__r.Shift_Start_End_Time__c,start_time__c,End_Time__c,Add_Shift__r.Location__Street__s,Full_Name__c,Status__c,Staff__r.Set_Hours__c,Duration__c,Set_Hours__c,State__c,Start_time_Formula__c,End_time_formula__c,Actual_Duration__c,Staff__c,Date__c,Staff_Hourly_Rate__c,Staff_Final_Hourly_Rate__c,Shift_Wage__c,Add_Shift__c,Add_Shift__r.Un_Allocated__c,Add_Shift__r.Shift_Type__c,Add_Shift__r.Day_Name__c,Add_Shift__r.Is_EOI__c,Shiftcolor__c,End_Date__c, Add_Shift__r.Split_Shifts__c  from ShiftwithStaff__c where';
            query2=query2+' Add_Shift__c =:ShiftIds and  Add_Shift__r.Facility__r.Organisation__c=:orgID and staff__c != null and Attendence__c=true ';
            if(staff != null && staff !='' ){
                string staffName ='%'+staff+'%' ;
                query2 =query2+' AND Full_Name__c like : staffName ' ; 
            }
            if(statusList.size()>0){
                query2 =query2+' AND Status__c In:statusList ' ;
            }
            /* if (view != null && view !='' ) {
if (view =='Participant View') {
query2 += ' AND Id IN (SELECT ShiftwithStaff__c FROM Services_and_Support_Plan__c) ';
} else {
query2 += ' AND Id NOT IN (SELECT ShiftwithStaff__c FROM Services_and_Support_Plan__c) ';
}
}*/
            query2 =query2+'order by Add_Shift__r.Start_Date__c asc' ;
            system.debug('query2==>'+query2);
            shiftStaffList =database.query(query2);
            System.debug('shiftList==>'+shiftStaffList); 
            System.debug(shiftStaffList.size());
            
        } catch (Exception e) {
            
        }
        return shiftStaffList;
    }
    
    @AuraEnabled
    public static List<Staff__c> getAvailableStaff(string Role,Date startDate, time startime, time endtime){      
        system.debug('stDate>>'+Role + '...'+ startDate +'>>>'+startime+'>>>'+endtime);
        List<Staff__c> staff=new  List<Staff__c>();
        User objUser = [ SELECT Organization_Name__c FROM User WHERE Id = : UserInfo.getUserId() ];
        string orgID = [Select id from Organisation__c where name=:objUser.Organization_Name__c limit 1].Id;        
        try {
            
            staff = [select id,Name__c,Display_Nickname__c,Name,Last_Name__c,Role__c,Facility_Name__c,Set_Hours__c,Recurring_Till__c,Working_Hours_Rate__c,Saturday_Hourly_Rate__c,SCR__c,Facility__c,
                     Sunday_Hourly_Rate__c,Public_holiday_Hourly_Rate__c,Afternoon_shift_Hourly_Rate__c,Night_shift_Hourly_Rate__c,Active_or_Non_Active__c,Status__c,Class_and_Paypont__c,Sleepover_Allowance__c,(SELECT Id, RoleName__c,Afternoon_Shift_Hourly_Rate__c,Hourly_Rate__c,Night_Shift_Hourly_Rate__c,Public_Holiday_Hourly_Rate__c,Saturday_Hourly_Rate__c,Sleepover_Allowance__c,Sunday_Hourly_Rate__c, Active__c FROM StaffRoles__r WHERE Active__c = true AND RoleName__c =:Role)
                     from Staff__c 
                     where Role__c includes (:Role) and Facility__r.Organisation__c =:orgID and Facility__r.Status__c=true AND Status__c=true and Id Not in (select Staff__c from ShiftwithStaff__c where 
                                                                                                                                                             Attendence__c= true and Date__c=:startDate 
                                                                                                                                                             AND (End_Time__c > :startime AND Start_Time__c < :endtime) )  AND Id NOT IN (
                                                                                                                                                                 SELECT Staff__c FROM Leave__c WHERE Status__c = 'Approved'   AND From__c <= :startDate   AND To__c >= :startDate  )];
            
            system.debug('staff>>>'+staff);
            
        } catch (Exception e) {
            
        }
        return staff;
    }
    
    
    @AuraEnabled
    public static List<Staff__c> getAvailableStaffforRosterManager(String Role, Date startDate,Date endDate, Time startime, Time endtime) {
        System.debug('getAvailableStaff called => Role: ' + Role + ', startDate: ' + startDate + ', startime: ' + startime + ', endtime: ' + endtime +'eND DATE '+endDate);
        
        List<Staff__c> result = new List<Staff__c>();
        if (startDate == null || startime == null || endtime == null) {
            return result;
        }
        
        // Get org id for current user
        User u = [SELECT Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];
        String orgID = [SELECT Id FROM Organisation__c WHERE Name = :u.Organization_Name__c LIMIT 1].Id;
        
        // Determine day of week using format('u') -> 1 = Monday ... 7 = Sunday
        Integer dayOfWeek = Integer.valueOf(DateTime.newInstance(startDate, Time.newInstance(0,0,0,0)).format('u'));
        Boolean isWeekend = (dayOfWeek == 6 || dayOfWeek == 7);
        
        // Determine week range (Monday to Sunday)
        Date weekStart = startDate.addDays(-(dayOfWeek - 1)); // Monday
        Date weekEnd = weekStart.addDays(6);                  // Sunday
        
        // 1) Get candidate staff (active, same org, facility active) - we will filter further in code
        List<Staff__c> candidateStaff = [
            SELECT Id, Name__c, Display_Nickname__c, Name, Last_Name__c, Role__c, Facility_Name__c,
            Set_Hours__c, Restrict_Set_Hours__c, Recurring_Till__c, Working_Hours_Rate__c,
            Saturday_Hourly_Rate__c, SCR__c, Facility__c, Sunday_Hourly_Rate__c,
            Public_holiday_Hourly_Rate__c, Afternoon_shift_Hourly_Rate__c,
            Night_shift_Hourly_Rate__c, Active_or_Non_Active__c, Status__c,(SELECT Id, RoleName__c,Afternoon_Shift_Hourly_Rate__c,Hourly_Rate__c,Night_Shift_Hourly_Rate__c,Public_Holiday_Hourly_Rate__c,Saturday_Hourly_Rate__c,Sleepover_Allowance__c,Sunday_Hourly_Rate__c, Active__c FROM StaffRoles__r WHERE Active__c = true)
 ,
            Class_and_Paypont__c, Sleepover_Allowance__c
            FROM Staff__c
            WHERE  Facility__r.Organisation__c = :orgID
            AND Facility__r.Status__c = true
            AND Status__c = true AND ID IN (SELECT StaffRole_To_Staff__c FROM StaffRole__c WHERE Active__c = true AND RoleName__c =:Role)
        ];
        
        if (candidateStaff.isEmpty()) return result;
        
        // Prepare collections
        Set<Id> staffIds = new Set<Id>();
        for (Staff__c s : candidateStaff) staffIds.add(s.Id);
        
        // 2) Query approved Leave (overlapping the startDate) -> always exclude those on leave
        Map<Id, Boolean> onLeaveMap = new Map<Id, Boolean>();
        for (Leave__c lv : [
            SELECT Id, Staff__c
            FROM Leave__c
            WHERE Staff__c IN :staffIds
            AND Status__c = 'Approved'
            AND From__c <= :startDate
            AND To__c >= :startDate
        ]) {
            onLeaveMap.put(lv.Staff__c, true);
        }
        
        // 3) Find staff who already have overlapping shifts on that date/time
        Set<Id> overlappingShiftStaff = new Set<Id>();
         Set<Id> rejectedStaffIds = new Set<Id>();
        
        // Only check if not weekend (keep your original condition)
     
            // Query all shifts for this staff on the startDate (or you can expand for a date range later)
            List<ShiftwithStaff__c> existingShifts = [
                SELECT Id, Staff__c, Date__c, End_Date__c,Shift_Start_Time__c,Shift_End_Time__c,Start_Date__c,Shift_End_Date__c, Start_Time__c, End_Time__c
                FROM ShiftwithStaff__c
                WHERE Attendence__c = true
                AND Date__c <= :endDate
                AND End_Date__c >= :startDate
                AND Staff__c IN :staffIds
            ];
            
            for (ShiftwithStaff__c ss : existingShifts) {
                DateTime recurStart = DateTime.newInstance(startDate, startime);
                DateTime recurEnd   = DateTime.newInstance(endDate, endtime);
                
                DateTime shiftStart = DateTime.newInstance(ss.Start_Date__c, ss.Shift_Start_Time__c);
                DateTime shiftEnd   = DateTime.newInstance(ss.Shift_End_Date__c, ss.Shift_End_Time__c);
                
                if (isShiftOverlap(recurStart, recurEnd, shiftStart, shiftEnd)) {
                    overlappingShiftStaff.add(ss.Staff__c);
                }
            }
            
            List<ShiftwithStaff__c> rejectedShifts = [
                SELECT Id, Staff__c, Date__c, End_Date__c, Start_Time__c, End_Time__c,Shift_Start_Time__c,Shift_End_Time__c,Start_Date__c,Shift_End_Date__c
                FROM ShiftwithStaff__c
                WHERE Attendence__c = false  and Shift_Rejected__c=true
                AND Date__c <= :endDate
                AND End_Date__c >= :startDate
            ];
            
           system.debug('rejectd shift list ==?'+rejectedShifts);

        for (ShiftwithStaff__c ss : rejectedShifts) {
            DateTime recurStart = DateTime.newInstance(startDate, startime);
            DateTime recurEnd   = DateTime.newInstance(endDate, endtime);
            
            DateTime shiftStart = DateTime.newInstance(ss.Start_Date__c, ss.Shift_Start_Time__c);
            DateTime shiftEnd   = DateTime.newInstance(ss.Shift_End_Date__c, ss.Shift_End_Time__c);
            
            if (isShiftOverlap(recurStart, recurEnd, shiftStart, shiftEnd)) {
                rejectedStaffIds.add(ss.Staff__c);
                System.debug('Overlap detected → Staff added to rejectedStaffIds: ' + ss.Staff__c);
            } else {
                System.debug('No overlap → Staff not added: ' + ss.Staff__c);
            }
        }
        System.debug('Final rejectedStaffIds: ' + rejectedStaffIds);
        
        // 4) Query all Availability__c for the week for these staff (exclude Sleepover Shift)
        Map<Id, List<Availability__c>> availabilityMap = new Map<Id, List<Availability__c>>();
        for (Availability__c av : [
            SELECT Id, Staff__c, Start_Time__c, End_Time__c, Start_Date__c, Shift_Type__c
            FROM Availability__c
            WHERE Staff__c IN :staffIds
            AND Start_Date__c >= :weekStart
            AND Start_Date__c <= :weekEnd
            AND Shift_Type__c != 'Sleepover Shift'
        ]) {
            if (!availabilityMap.containsKey(av.Staff__c)) availabilityMap.put(av.Staff__c, new List<Availability__c>());
            availabilityMap.get(av.Staff__c).add(av);
        }
        
        // 5) Query all ShiftwithStaff__c for the week for these staff (exclude Sleepover Shift, Unassigned, only Attendence true)
        Map<Id, List<ShiftwithStaff__c>> shiftMap = new Map<Id, List<ShiftwithStaff__c>>();
        for (ShiftwithStaff__c sws : [
            SELECT Id, Staff__c, Duration__c, Date__c, Start_Time__c, End_Time__c,Shift_Start_Time__c,Shift_End_Time__c,Start_Date__c,Shift_End_Date__c, 
            Type_of_Shift__c, Attendence__c, Status__c
            FROM ShiftwithStaff__c
            WHERE Staff__c IN :staffIds
            AND Start_Date__c >= :weekStart
            AND Start_Date__c <= :weekEnd
            AND Type_of_Shift__c != 'Sleepover Shift'
            AND Status__c != 'Unassigned'
            AND Attendence__c = true
        ]) {
            if (!shiftMap.containsKey(sws.Staff__c)) shiftMap.put(sws.Staff__c, new List<ShiftwithStaff__c>());
            shiftMap.get(sws.Staff__c).add(sws);
        }
        
        // Helper: convert input slot duration (startime, endtime) to decimal hours
        Decimal inputDuration = calculateDurationHours(startDate, startime, endtime);
        
        // 6) Evaluate each candidate staff
        for (Staff__c st : candidateStaff) {
            // Exclude on leave
            if (onLeaveMap.containsKey(st.Id)) {
                continue;
            }
            
            // Exclude overlapping shift staff for weekdays (if not weekend)
            if (overlappingShiftStaff.contains(st.Id)) {
                continue;
            }
            
            // 🚨 Exclude staff who rejected overlapping shifts
            if ( rejectedStaffIds.contains(st.Id)) {
                continue;
            }
            
            // Sum existing shift durations (week)
            Decimal totalShiftDuration = 0;
            List<ShiftwithStaff__c> sList = shiftMap.get(st.Id);
            if (sList != null) {
                for (ShiftwithStaff__c s : sList) {
                    if (s.Start_Time__c != null && s.End_Time__c != null) {
                        totalShiftDuration += calculateDurationHours(s.Start_Date__c, s.Shift_Start_Time__c, s.Shift_End_Time__c);
                    } else if (s.Duration__c != null) {
                        totalShiftDuration += s.Duration__c;
                    }
                }
            }
            
            // Sum availability durations (week)
            Decimal totalAvailabilityDuration = 0;
            List<Availability__c> aList = availabilityMap.get(st.Id);
            if (aList != null) {
                for (Availability__c a : aList) {
                    if (a.Start_Time__c != null && a.End_Time__c != null) {
                        totalAvailabilityDuration += calculateDurationHours(a.Start_Date__c, a.Start_Time__c, a.End_Time__c);
                    }
                }
            }
            
            Decimal grandTotal = totalShiftDuration + totalAvailabilityDuration + inputDuration;
            
            // Check Restrict_Set_Hours__c
            Boolean restrict = st.Restrict_Set_Hours__c == true;
            Decimal setHours = (st.Set_Hours__c == null) ? 0 : st.Set_Hours__c;
            
            // If restriction is enabled and setHours > 0 and grandTotal > setHours -> exclude staff
            if (!!isWeekend && restrict && setHours > 0 && grandTotal > setHours) {
                continue;
            }
            
            // Passed all checks -> include
            result.add(st);
        }
        
        return result;
    }
  public static Boolean isShiftOverlap(DateTime recurStart, DateTime recurEnd, DateTime shiftStart, DateTime shiftEnd){
    return (recurStart < shiftEnd && shiftStart < recurEnd);
}
    
    /** Helper: calculate duration in decimal hours between two Time fields (handles crossing midnight) */
    public static Decimal calculateDurationHours(Date baseDate, Time startTime, Time endTime) {
        if (startTime == null || endTime == null) return 0;
        DateTime startDT = DateTime.newInstance(baseDate, startTime);
        DateTime endDT = DateTime.newInstance(baseDate, endTime);
        if (endDT.getTime() < startDT.getTime()) {
            // crosses midnight -> add one day to end
            endDT = endDT.addDays(1);
        }
        Long diffMs = endDT.getTime() - startDT.getTime();
        // convert ms to decimal hours
        Decimal hours = (Decimal) diffMs / (1000 * 60 * 60);
        return hours.setScale(4); // keep precision
    }
    
    @AuraEnabled
    public static List<Staff__c> getEOIStaff(string Role,string shiftId){ 
        List<Staff__c> staff=new  List<Staff__c>();
        User objUser = [ SELECT Organization_Name__c FROM User WHERE Id = : UserInfo.getUserId() ];
        string orgID = [Select id from Organisation__c where name=:objUser.Organization_Name__c limit 1].Id;  
        try {
            
            staff = [select id,Name__c,Display_Nickname__c,Name,Last_Name__c,Role__c,Facility_Name__c,Set_Hours__c,Recurring_Till__c,Working_Hours_Rate__c,Saturday_Hourly_Rate__c,SCR__c,Facility__c,Restrict_Set_Hours__c,
                     Sunday_Hourly_Rate__c,Public_holiday_Hourly_Rate__c,Afternoon_shift_Hourly_Rate__c,Night_shift_Hourly_Rate__c,Active_or_Non_Active__c,Status__c,Class_and_Paypont__c,Sleepover_Allowance__c,(SELECT Id, RoleName__c,Afternoon_Shift_Hourly_Rate__c,Hourly_Rate__c,Night_Shift_Hourly_Rate__c,Public_Holiday_Hourly_Rate__c,Saturday_Hourly_Rate__c,Sleepover_Allowance__c,Sunday_Hourly_Rate__c, Active__c FROM StaffRoles__r WHERE Active__c = true),
                     (select id,Staff__c from ShiftwithStaffs__r where add_shift__c=:shiftId and Expressed_Interest__c=true and  Attendence__c= false)
                     from Staff__c 
                     where  Facility__r.Organisation__c =:orgID and Facility__r.Status__c=true AND Status__c=true and Id in (select Staff__c from ShiftwithStaff__c where add_shift__c=:shiftId and Expressed_Interest__c=true and  Attendence__c= false)];
            
            
            system.debug('staff>>>'+staff);
            
        } catch (Exception e) {
            system.debug(e);
        }
        return staff;
    }
    
    
    @AuraEnabled
    public static List<ShiftwithStaff__c> getcurrentStaff(String startDate,String endDate){
        String UserEmail = UserInfo.getUserEmail(); 
        List<ShiftwithStaff__c> shiftStaffList=new  List<ShiftwithStaff__c>();
        Date sDate = Date.valueOf(startDate);
        Date eDate = Date.valueOf(endDate);
        system.debug('start date'+sDate);
        system.debug('end date'+eDate);
        try {
            
            shiftStaffList = [select id,Staff__r.Email_Address__c,Staff__r.Name__c,Staff__r.Name,Facility__c,Add_Shift__r.Start_Date__c ,Add_Shift__r.Break__c,Status__c,Start_time_Formula__c,End_time_formula__c,
                              Shift_Type__c,Add_Shift__r.Role__c,Shift_Name__c,Add_Shift__r.Shift_Start_End_Time__c,Attendence__c,Add_Shift__r.Direction__r.Name,Type_of_shift__c,
                              Add_Shift__r.Location__Street__s,Staff__r.Set_Hours__c,Duration__c,Add_Shift__r.Duration__c,Add_Shift__r.Shift_Name__c,Set_Hours__c,Log_In_Date_Time__c,Log_Out_Date_Time__c,(SELECT Id, Client__r.Name__c FROM Services_and_Support_Plans__r)
                              from ShiftwithStaff__c  where Staff__r.Email_Address__c=:UserEmail and Attendence__c=true 
                              AND Add_Shift__r.Start_Date__c >=:sDate and Add_Shift__r.Start_Date__c<=:eDate];
            
            system.debug('shiftStaffList>>>'+shiftStaffList);
            
        } catch (Exception e) {
            
        }
        return shiftStaffList;
    }
    
    public static String formatTimeToString(Time t) {
        String hour = (t.hour() < 10) ? '0' + String.valueOf(t.hour()) : String.valueOf(t.hour());
        String minute = (t.minute() < 10) ? '0' + String.valueOf(t.minute()) : String.valueOf(t.minute());
        String second = (t.second() < 10) ? '0' + String.valueOf(t.second()) : String.valueOf(t.second());
        return hour + ':' + minute + ':' + second + 'Z';
    }

    
    @AuraEnabled
    public static void Rejectedshifts(String shiftStaffId, String comments) {
        try {
            ShiftwithStaff__c shiftStaff = [SELECT Id,Add_Shift__c,Add_Shift__r.facility__c,Staff__r.Email_Address__c,staff__c, Attendence__c, Comments__c FROM ShiftwithStaff__c WHERE Id = :shiftStaffId LIMIT 1];
            shiftStaff.Attendence__c = false;
            shiftStaff.RejectedComments__c = comments;
            shiftStaff.Shift_Rejected__c=true;
            update shiftStaff;
            
             Add_Shift__c parentShift = [
                SELECT Id, Quantity__c,Start_Date__c,End_Date__c,Shift_Start_End_Time__c,Shift_Type__c,facility__c,Facility__r.Name,Location__Street__s,Location__City__s,Location__StateCode__s,Location__CountryCode__s,Location__PostalCode__s,Role__c,Location__Latitude__s,Location__Longitude__s,
                 Start_Time__c,End_Time__c,(Select Id,Staff__c from ShiftwithStaffs__r  where Attendence__c =false )
                FROM Add_Shift__c
                WHERE Id = :shiftStaff.Add_Shift__c
                LIMIT 1
            ];
            parentShift.Quantity__c = (parentShift.Quantity__c != null) ? parentShift.Quantity__c + 1 : 1;
            update parentShift;
            list<ShiftwithStaff__c> rejectedChilds=parentShift.ShiftwithStaffs__r;
            list<string> staffIdList= new list<string>();
            for(ShiftwithStaff__c ss :rejectedChilds){
                staffIdList.add(ss.Staff__c);
            }
            
            system.debug('staffIdList '+staffIdList);
            string address=parentShift.Location__Street__s +','+parentShift.Location__City__s +','+parentShift.Location__StateCode__s +','+parentShift.Location__PostalCode__s ;
           StaffEmailNotificationController.sendRejectedEmailNotification(parentShift.Role__c, parentShift.facility__c, parentShift,staffIdList);
            
            String formattedStartTime = formatTimeToString(parentShift.Start_Time__c);
            String formattedEndTime = formatTimeToString(parentShift.End_Time__c);
            
            // If you want to remove milliseconds and keep only "HH:mm:ssZ"
            formattedStartTime = formattedStartTime.substring(0, 8) + 'Z';
            formattedEndTime = formattedEndTime.substring(0, 8) + 'Z'; 

          MobileAppNotificationsV2.generateAndSendNotification(parentShift.Role__c, string.valueof(parentShift.Start_Date__c), '',true,shiftStaff.Staff__r.Email_Address__c,shiftStaff.Add_Shift__r.facility__c,'addShift','',false,
                                                             string.valueof(parentShift.End_Date__c),parentShift.Shift_Type__c,formattedStartTime,formattedEndTime,address,parentShift.Location__Latitude__s,parentShift.Location__Longitude__s );

        } catch (Exception e) {
            throw new AuraHandledException('Error updating record: ' + e.getMessage());
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static List<ShiftwithStaff__c> getRejectedShifts(string datePicker, String orgId) {
        Date startDate = Date.valueOf(datePicker) -7 ;
        Date endDate = Date.valueOf(datePicker)+7;
        system.debug('datePicker '+datePicker);
        return [
            SELECT Id, Staff__r.Email_Address__c, Staff__r.Name__c,Staff__r.picture__c,Shiftcolor__c, Staff__r.Name,Staff__r.Display_Nickname__c,Staff__c,Staff__r.NameToDisplay__c,
            Facility__c, Add_Shift__r.Start_Date__c, Add_Shift__r.Break__c,Rejected_Assigned__c,
            Shift_Type__c, Add_Shift__r.Role__c, Add_Shift__r.Shift_Start_End_Time__c,
            Attendence__c, Add_Shift__r.Direction__r.Name,Add_Shift__r.Facility__c,
            Add_Shift__r.Location__Street__s,Add_Shift__r.Is_EOI__c,Add_Shift__r.Start_Time__c,Add_Shift__r.End_Time__c,Add_Shift__r.Shift_Name__c,
            Add_Shift__r.Public_holiday__c,Add_Shift__r.Day_Name__c,Add_Shift__r.Shift_Type__c,Add_Shift__r.Quantity__c,Staff__r.Set_Hours__c,
            Duration__c, Add_Shift__r.Duration__c, Set_Hours__c,
            Log_In_Date_Time__c, Log_Out_Date_Time__c, Shift_Rejected__c,Date__c,End_Date__c
            FROM ShiftwithStaff__c
            WHERE Attendence__c = false AND Shift_Rejected__c = true AND Add_Shift__r.Start_Date__c >= :startDate AND Add_Shift__r.Start_Date__c <= :endDate AND Staff__r.Facility__r.Organisation__c =:orgId
        ];
    }
    @AuraEnabled
    public static List<ShiftwithStaff__c> getRejectedShiftsbyDates(string Sdate, string edate, String orgId) {
        System.debug('start date'+Sdate);
        System.debug('end date'+edate);
        System.debug('orgid'+orgId);
        Date startDate = Date.valueOf(Sdate);
        Date endDate = Date.valueOf(edate);
        return [
            SELECT Id, Staff__r.Email_Address__c, Staff__r.Name__c, Staff__r.Name,Staff__r.NameToDisplay__c,Staff__r.Display_Nickname__c,
            Facility__c, Add_Shift__r.Start_Date__c, Add_Shift__r.Break__c, Add_Shift__r.Facility__c,
            Shift_Type__c, Add_Shift__r.Role__c, Add_Shift__r.Shift_Start_End_Time__c,
            Attendence__c, Add_Shift__r.Direction__r.Name,RejectedComments__c,
            Add_Shift__r.Location__Street__s,Add_Shift__r.Is_EOI__c,Add_Shift__r.Start_Time__c,Add_Shift__r.End_Time__c,
            Add_Shift__r.Public_holiday__c,Add_Shift__r.Day_Name__c,Add_Shift__r.Shift_Type__c,Add_Shift__r.Quantity__c,Staff__r.Set_Hours__c,
            Duration__c, Add_Shift__r.Duration__c, Set_Hours__c,
            Log_In_Date_Time__c, Log_Out_Date_Time__c, Shift_Rejected__c,Date__c,End_Date__c
            FROM ShiftwithStaff__c
            WHERE Attendence__c = false AND Shift_Rejected__c = true AND Add_Shift__r.Start_Date__c >= :startDate AND Add_Shift__r.Start_Date__c <= :endDate AND Staff__r.Facility__r.Organisation__c =:orgId ORDER BY Add_Shift__r.Start_Date__c DESC
        ];
    }
    @AuraEnabled
    public static void RejectedshiftAllocation(String shiftId, String StaffId) {
        system.debug('shiftId: ' + shiftId);
        system.debug('StaffId: ' + StaffId);
        
        try {
            // 1. Get the original shift
            ShiftwithStaff__c shiftStaff = [
                SELECT Shift_SCR__c, Recurring_Date__c,Role__c, Do_you_want_to_set_this_Recurring_Roster__c, Staff_Final_Hourly_Rate__c, Staff__c, Attendence__c, Split_Shift_Color__c, Split_Shift_Height__c,
                RefId__c, Shiftcolor__c, Index__c, Long_Morning_Start_Time__c, Long_Morning_End_Time__c, Is_long_Morning__c, Long_Morning_Hourly_Rate__c, Long_Morning_Shift_Duartion__c,
                Long_Afternoon_Start_Time__c, Long_Afternoon_End_Time__c, Is_Long_Afternoon__c, Long_Afternoon_Hourly_Rate__c, Long_Afternoon_Shift_Duartion__c,long_Morining_Service_Ref_Id__c,
                Long_Night_Start_Time__c, Long_Night_End_Time__c, Is_Long_Night_Shift__c, Long_Night_Hourly_Rate__c, Long_Night_Shift_Duartion__c,long_Sleepover_Service_Ref_Id__c,long_Morning_2_Service_Ref_Id__c,long_Afternooon_Two_Service_Ref_Id__c,
                Long_Sleepover_Start_Time__c, Long_Sleepover_End_Time__c, Is_Long_SleepOver__c, Long_Sleepover_Allowance__c, Long_Sleepover_Duartion__c,long_Afternooon_Service_Ref_Id__c,long_Night_Service_Ref_Id__c, 
                Type_of_shift__c, Public_Holiday__c, Add_Shift__c, Add_Shift__r.Day_Name__c,(SELECT Id, Name,ShiftwithStaff__c,  Mandatory__c, Description__c FROM Add_Shift_Checklists__r ),
                (SELECT Id, Services__c, State__c, Service_Users__c FROM Services_and_Support_Plans__r)
                FROM ShiftwithStaff__c
                WHERE Id = :shiftId
                LIMIT 1
            ];
            
            // 2. Mark existing shift as reassigned
            shiftStaff.Rejected_Assigned__c = true;
            update shiftStaff;
            
            // 3. Increment quantity on parent shift
            Add_Shift__c parentShift = [
                SELECT Id, Quantity__c
                FROM Add_Shift__c
                WHERE Id = :shiftStaff.Add_Shift__c
                LIMIT 1
            ];
           // parentShift.Quantity__c = (parentShift.Quantity__c != null) ? parentShift.Quantity__c + 1 : 1;
          //  update parentShift;
            
            // 4. Query Staff rates
            Staff__c staff = [
                SELECT Id, Saturday_Hourly_Rate__c, Sunday_Hourly_Rate__c, Public_holiday_Hourly_Rate__c,
                Working_Hours_Rate__c, Afternoon_shift_Hourly_Rate__c, Night_shift_Hourly_Rate__c,Sleepover_Allowance__c
                FROM Staff__c
                WHERE Id = :StaffId
                LIMIT 1
            ];
            Map<Id, Staff__c> tempStaffMap = new Map<Id, Staff__c>{ staff.Id => staff };
                
                // 5. Clone and assign new shift
                ShiftwithStaff__c newStaffAssignment = shiftStaff.clone(false, true, false, false);
            newStaffAssignment.Staff__c = StaffId;
            newStaffAssignment.Rejected_Assigned__c = false;
            newStaffAssignment.Attendence__c = true;
            newStaffAssignment.Add_Shift__c = parentShift.Id;
            
            Decimal rate = RosterAutoScheduleHandler.getStaffHourlyRate(
                shiftStaff.Type_of_shift__c,
                shiftStaff.Public_Holiday__c,
                shiftStaff.Add_Shift__r.Day_Name__c,
                tempStaffMap,
                staff.Id,
                shiftStaff.Role__c
            );
            newStaffAssignment.Staff_Final_Hourly_Rate__c = rate;
            
            insert newStaffAssignment;
            
            // 6. Reassign related services
            List<Services_and_Support_Plan__c> servList = new List<Services_and_Support_Plan__c>();
            servList = shiftStaff.Services_and_Support_Plans__r;
            if (!servList.isEmpty()) {
                for (Services_and_Support_Plan__c ssp : servList) {
                    ssp.Service_Users__c = StaffId;
                    ssp.ShiftwithStaff__c=newStaffAssignment.Id;
                }
                update servList;
            }
            
            List<Add_Shift_Checklist__c> newChecklists = new List<Add_Shift_Checklist__c>();
            
            for (Add_Shift_Checklist__c checklist : shiftStaff.Add_Shift_Checklists__r) {
                Add_Shift_Checklist__c clonedChecklist = checklist.clone(false, true, false, false);
                clonedChecklist.ShiftwithStaff__c = newStaffAssignment.Id; // link to new shift
                newChecklists.add(clonedChecklist);
            }
            
            if (!newChecklists.isEmpty()) {
                insert newChecklists;
            }
            
            system.debug('New staff assignment created: ' + newStaffAssignment.Id);
            
        } catch (Exception e) {
            system.debug('error: ' + e.getMessage());
            throw new AuraHandledException('Error updating record: ' + e.getMessage());
        }
    }
    
    
    
    
    @AuraEnabled
    public static void updateStaffShift(String IdValue,String status)
    {
        try {
            ShiftwithStaff__c staffshift=new ShiftwithStaff__c(Id=IdValue);
            staffshift.Attendence__c=Boolean.valueOf(status);
            Update staffshift; 
        } catch (Exception e) {
            
        }
    }
    
   @AuraEnabled
    public static String allocateMultipleStaff(String shiftId,String staffJson,Date shiftDate,List<ShiftwithStaff__c>shiftwithstaff,boolean isExecutedFromMobile)  {   
        SYSTEM.DEBUG('isExecutedFromMobile => '+isExecutedFromMobile);
        List<StaffWrapper> stafflist = (List<StaffWrapper>) JSON.deserialize(staffJson, List<StaffWrapper>.class);
        system.debug('staffIds'+stafflist);
        // Map<string,string> allocatedStaffcomments = New  Map<string,string>();
        Map<string,boolean> allocatedAttandance= New  Map<string,boolean>();
        Map<string,boolean> allocatedStaffIds = New  Map<string,boolean>();
        Map<string,Decimal> allocatedFinalHourlyRate = New  Map<string,Decimal>(); // new line added by praveen
        //list<date> enddates = new list<date>();
        Map<string,list<ShiftWithStaffWrapper>> allocatedShiftsmap = New  Map<string,list<ShiftWithStaffWrapper>>();
        date enddate=stafflist[0].recurringTill;
        map<id,date> stfIds = new map<id,date>();
        Add_Shift__c addShift = [
            SELECT Id, Duration__c, Day_Name__c, Shift_Type__c, Public_holiday__c,Location__Street__s,Location__City__s,Location__StateCode__s,Start_Date__c,End_Date__c,Start_Time__c,End_Time__c,
            Location__PostalCode__s,Location__Latitude__s,Location__Longitude__s,Get_Facility__c,Participant_Address_checkbox__c,Role__c,Break__c,Shift_Name__c, Facility__r.Organisation__r.Enable_Time_Rounding__c
            FROM Add_Shift__c
            WHERE Id = :shiftId
            LIMIT 1
        ];
     
        
        for(StaffWrapper sft : stafflist ){
            // System.debug('SED-->'+sft.Expiry_Date__c);
            allocatedStaffIds.put(sft.Id,sft.isRecurring);
            system.debug('isRecurring'+allocatedStaffIds);
            allocatedAttandance.put(sft.Id,sft.attendance);
            allocatedFinalHourlyRate.put(sft.Id,sft.finalOverallRate);    // new line added by praveen
            allocatedShiftsmap.put(sft.Id,sft.shiftWithStaffs);
            system.debug('allocatedShiftsmap '+allocatedShiftsmap);
            if(sft.isRecurring){
                if(sft.recurringTill > enddate){
                    enddate= sft.recurringTill;
                }
                stfIds.put(sft.id,sft.recurringTill);
            }
            // allocatedStaffcomments.put(sft.Id,sft.comments__c);  
            // sft.End_Date__c != null && sft.End_Date__c <= currentDate 
        }
        List<Staff__c> staffListAllocated = [SELECT Id, Paid_Break__c FROM Staff__c WHERE Id IN :allocatedStaffIds.keySet()];
        Map<Id, Staff__c> staffListMap = new Map<Id, Staff__c>(staffListAllocated);
        
        List<ShiftwithStaff__c> allocatedStaff = New  List<ShiftwithStaff__c>();
        List<ShiftwithStaff__c> updallocatedStaff = New  List<ShiftwithStaff__c>();
        try{
            Map<String, Object> result = new Map<String, Object>();
            for(string s : allocatedStaffIds.keySet()){
                system.debug('s'+s);
                if (allocatedShiftsmap.get(s) != null && !allocatedShiftsmap.get(s).isEmpty()) {
                    for(ShiftWithStaffWrapper ss : allocatedShiftsmap.get(s)){                           
                        ShiftwithStaff__c stf = New ShiftwithStaff__c();
                        stf.Id=ss.Id;
                        stf.Attendence__c=true;
                        if(allocatedStaffIds.get(s)==true){
                            stf.Do_you_want_to_set_this_Recurring_Roster__c=true;
                        } 
                        if(allocatedFinalHourlyRate.get(s)>0){
                            stf.Staff_Final_Hourly_Rate__c=allocatedFinalHourlyRate.get(s); 
                        }
                        updallocatedStaff.add(stf);
                    }
                    
                }else{   
                    ShiftwithStaff__c stf = New ShiftwithStaff__c();
                    stf.Add_Shift__c=shiftId;
                    stf.Attendence__c=true;
                    stf.Shift_SCR__c=0;
                    // stf.Index__c=0;
                    // stf.Date__c=shiftDate;
                    system.debug('isrcurring ==>'+s+'=====>'+allocatedStaffIds.get(s));
                    if(allocatedStaffIds.get(s)==true){
                        stf.Do_you_want_to_set_this_Recurring_Roster__c=true;
                    } 
                    if(allocatedFinalHourlyRate.get(s)>0){
                        stf.Staff_Final_Hourly_Rate__c=allocatedFinalHourlyRate.get(s); 
                    }
                    stf.Staff__c=s;
                    
                    stf.Role__c=addShift.Role__c;
                    stf.Shift_Category__c=addShift.Shift_Type__c;
                    stf.Shift_Start_Time__c=addShift.Start_Time__c;
                    stf.Shift_End_Time__c=addShift.End_Time__c;
                    stf.Shift_Address__Street__s=addShift.Location__Street__s;
                    stf.Shift_Address__City__s=addShift.Location__City__s;
                    stf.Shift_Address__StateCode__s=addShift.Location__StateCode__s;
                    stf.Shift_Address__PostalCode__s=addShift.Location__PostalCode__s;
                    stf.Shift_Address__CountryCode__s='AU';
                    stf.Shift_Address__Latitude__s=addShift.Location__Latitude__s;
                    stf.Shift_Address__Longitude__s=addShift.Location__Longitude__s;
                    decimal breakTime= 0;
                    breakTime= addShift.Break__c=='30'?0.5:0;
                    stf.Shift_Calculated_Duration__c=staffListMap.get(s).Paid_Break__c==true? addShift.Duration__c+breakTime: addShift.Duration__c ;
                    stf.Shift_Break__c=breakTime;
                    stf.Shift_Name__c=addShift.Shift_Name__c;
                    stf.Time_Rounded_Off__c=addShift.Facility__r.Organisation__r.Enable_Time_Rounding__c;
                    stf.Start_Date__c=addShift.Start_Date__c;
                    stf.Shift_End_Date__c=addShift.End_Date__c;
                    stf.Shift_Day_Name__c=addShift.Day_Name__c;
                    allocatedStaff.add(stf);             
                    
                }
            }
            if(updallocatedStaff.size()>0){               
                // Database.update(updallocatedStaff,false); 
                update updallocatedStaff;     
            }
            if(allocatedStaff.size()>0){
                //Database.insert(allocatedStaff,false);
                insert allocatedStaff ;
            }
            
            // Query the ShiftwithStaff__c records including the related Organisation field
            List<ShiftwithStaff__c> swsList = [
                SELECT Id, Staff__c, Date__c, Start_Time__c, End_Time__c,
                Add_Shift__r.Duration__c, Add_Shift__r.Break__c, Add_Shift__r.Service_Details__c,
                Add_Shift__r.Facility__r.Type_of_Service__c,
                Staff__r.Paid_Break__c
                FROM ShiftwithStaff__c
                WHERE Id IN :allocatedStaff OR Id IN :updallocatedStaff
            ];
            
            list<string> shiftWithStaffId = new list<string>();
             List<ShiftwithStaff__c> nonNdisShifts = new List<ShiftwithStaff__c>();
            for(ShiftwithStaff__c ss :swsList){
                shiftWithStaffId.add(ss.id);
               
                if(isExecutedFromMobile==false) {
                    
                    Boolean isOtherNDIS = ss.Add_Shift__r != null &&
                    ss.Add_Shift__r.Facility__r != null &&
                    ss.Add_Shift__r.Facility__r.Type_of_Service__c !='NDIS';
                    if (isOtherNDIS == true) {
                       nonNdisShifts.add(ss);
                    }
                }
                
            }
            if (!nonNdisShifts.isEmpty()) {
                AddShiftController.CreateServices(nonNdisShifts);
            }
            StaffEmailNotificationController.addShiftAssignNotifications(shiftWithStaffId);
            if(stfIds.size()>0){
                createRecurringShifts(shiftId,stfIds, enddate,allocatedFinalHourlyRate);
            }
            
            return 'Changes are inserted succsessfully';
        }catch(exception e){
            System.debug('e ms-->'+e.getMessage());
            throw new AuraHandledException(e.getMessage());
        }
    }
    
     // 🔹 Bulkified CreateService method (no external helper)
    public static void CreateServices(List<ShiftwithStaff__c> shiftWithStaffList) {
        if (shiftWithStaffList == null || shiftWithStaffList.isEmpty()) {
            return;
        }

        List<Services_and_Support_Plan__c> serviceList = new List<Services_and_Support_Plan__c>();

        for (ShiftwithStaff__c shiftWithStaff : shiftWithStaffList) {
            Services_and_Support_Plan__c service = new Services_and_Support_Plan__c();
            service.Status__c = 'Not Yet Invoiced';
            service.State__c  = 'NSW';
            service.Service_Users__c    = shiftWithStaff.Staff__c;
            service.Date_of_Service__c  = shiftWithStaff.Date__c;
            service.Start_Time_24_Format__c = shiftWithStaff.Start_Time__c;
            service.End_Time_24_Format__c   = shiftWithStaff.End_Time__c;
            service.ShiftwithStaff__c       = shiftWithStaff.Id;

            // ✅ Paid Break logic inline
            Decimal duration   = shiftWithStaff.Add_Shift__r?.Duration__c != null 
                                   ? shiftWithStaff.Add_Shift__r.Duration__c : 0;
            Decimal breakValue = shiftWithStaff.Add_Shift__r?.Break__c != null 
                                   ? Decimal.valueOf(shiftWithStaff.Add_Shift__r.Break__c) : 0;
            Boolean paidBreak  = (shiftWithStaff.Staff__r?.Paid_Break__c == true);
              Decimal breakTime = breakValue ==30 ? 0.5 : 0;

            Decimal finalDuration = duration;
            if (paidBreak) {
                if ((duration + breakTime) >= 5) {
                    finalDuration = duration + 0.5;
                } else {
                    finalDuration = duration;
                }
            }
            service.Qty__c = finalDuration;

            // ✅ Parse Service_Details__c JSON if available
            String serviceDetailsJson = shiftWithStaff.Add_Shift__r?.Service_Details__c;
            if (!String.isBlank(serviceDetailsJson)) {
                try {
                    Map<String, Object> parsedData = 
                        (Map<String, Object>) JSON.deserializeUntyped(serviceDetailsJson);

                    service.Funds_Tracker__c     = (String) parsedData.get('serviceTypeId');
                    service.Service_Type__c      = (String) parsedData.get('serviceGroupId');
                    service.Client__c            = (String) parsedData.get('participantId');
                    service.Services__c          = (String) parsedData.get('serviceTypeId');
                    service.Edited_Unit_Price__c = (Decimal) parsedData.get('amount');

                } catch (Exception e) {
                    System.debug('⚠️ Error parsing Service_Details__c JSON: ' + e.getMessage());
                }
            }

            serviceList.add(service);
        }

        // 🔹 Single DML for all services
        if (!serviceList.isEmpty()) {
            upsert serviceList;
            System.debug('✅ Created/Updated ' + serviceList.size() + ' Service records.');
        }
    }
    //create recurring shifts in asynchronous-sowmya
    @future
    public static void createRecurringShifts(String shiftId,map<id,date> staffIds, date enddate,Map<string,Decimal> hourlyrates){
        Add_Shift__c shift=[select id,Quantity__c, Role__c, Start_Date__c, Start_Time__c, End_Time__c,Facility__c, Location__c, Is_EOI__c,Start_time_picklist__c,Start_Time_Text__c,End_Time_Text__c, 
                            End_time_picklist__c,Shift_Type__c,Break__c,Duration__c  from Add_Shift__c where id=:shiftId ]; 
        list<Add_Shift__c> insertshfts = new list<Add_Shift__c>();
        date strtdate=shift.Start_Date__c.addDays(1); 
        date Curdate=shift.Start_Date__c;
        Datetime dts = (DateTime)Curdate;
        String dayOfWeek = dts.format('EEEE');
        list<date> newdates = new  list<date>();   
        list<date> newdatestoreomve = new  list<date>();  
        while(strtdate <= endDate) {Datetime dt = (DateTime)strtdate;String curdayOfWeek = dt.format('EEEE');if(dayOfWeek == curdayOfWeek ){
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
                        stf.Shift_SCR__c=0;
                        stf.Attendence__c=true; 
                        if(hourlyrates.get(i)>0){
                            stf.Staff_Final_Hourly_Rate__c=hourlyrates.get(i); 
                        }
                        stf.Do_you_want_to_set_this_Recurring_Roster__c=true;  
                        recurringshifts.add(stf);                      
                    }
                    
                }
            }
            
            if(recurringshifts.size()>0) {
                insert recurringshifts;
            }
        }
    }
    
    
    @AuraEnabled
    public static String handleAllocation(String shiftId, boolean EOI) {
        String UserEmail = UserInfo.getUserEmail();
        
        // Fetch the entire Staff__c record
        Staff__c staff = [
            SELECT Id, Name, Role__c, Saturday_Hourly_Rate__c, Sunday_Hourly_Rate__c,
            Public_holiday_Hourly_Rate__c, Working_Hours_Rate__c,
            Afternoon_shift_Hourly_Rate__c, Night_shift_Hourly_Rate__c,Paid_Break__c
            FROM Staff__c
            WHERE Email_Address__c = :UserEmail
            LIMIT 1
        ];
        
        // Check if staff record was found
        if (staff == null) {
            // Handle error: Staff record not found
            return 'Error: Staff record not found for email ' + UserEmail;
        }
        
        Add_Shift__c addShift = [
            SELECT Id, Duration__c, Day_Name__c, Shift_Type__c, Public_holiday__c,Location__Street__s,Location__City__s,Location__StateCode__s,Start_Date__c,End_Date__c,Start_Time__c,End_Time__c,
            Location__PostalCode__s,Location__Latitude__s,Location__Longitude__s,Get_Facility__c,Participant_Address_checkbox__c,Role__c,Break__c,Shift_Name__c, Facility__r.Organisation__r.Enable_Time_Rounding__c
            FROM Add_Shift__c
            WHERE Id = :shiftId
            LIMIT 1
        ];
        
        // Check if addShift record was found
        if (addShift == null) {
            // Handle error: Add_Shift record not found
            return 'Error: Add_Shift record not found for ID ' + shiftId;
        }
        
        ShiftwithStaff__c stf = new ShiftwithStaff__c();
        
        try {
            if (EOI) {
                stf.Expressed_Interest__c = true;
                stf.Comments__c = 'Expressed Interest';
            } else {
                Decimal hourlyRate = 0;
                
                if (addShift.Public_holiday__c) { // if it's a public holiday
                    hourlyRate = staff.Public_holiday_Hourly_Rate__c != null ? staff.Public_holiday_Hourly_Rate__c : 0;
                } else {
                    switch on addShift.Day_Name__c {
                        when 'Saturday' {
                            hourlyRate = staff.Saturday_Hourly_Rate__c != null ? staff.Saturday_Hourly_Rate__c : 0;
                        }
                        when 'Sunday' {
                            hourlyRate = staff.Sunday_Hourly_Rate__c != null ? staff.Sunday_Hourly_Rate__c : 0;
                        }
                        when else {
                            switch on addShift.Shift_Type__c {
                                when 'General', 'Morning', 'Custom' {
                                    hourlyRate = staff.Working_Hours_Rate__c != null ? staff.Working_Hours_Rate__c : 0;
                                }
                                when 'Afternoon' {
                                    hourlyRate = staff.Afternoon_shift_Hourly_Rate__c != null ? staff.Afternoon_shift_Hourly_Rate__c : 0;
                                }
                                when 'Night' {
                                    hourlyRate = staff.Night_shift_Hourly_Rate__c != null ? staff.Night_shift_Hourly_Rate__c : 0;
                                }
                                when else {
                                    hourlyRate = staff.Working_Hours_Rate__c != null ? staff.Working_Hours_Rate__c : 0;
                                }
                            }
                        }
                    }
                }
                
                stf.Staff_Final_Hourly_Rate__c = hourlyRate;
                stf.Attendence__c = true;
                stf.Shift_SCR__c=0;
                stf.Comments__c = 'Self Allocated';
            }
            
            stf.Add_Shift__c = shiftId;
            stf.Staff__c = staff.Id;
            stf.Role__c=addShift.Role__c;
            stf.Shift_Category__c=addShift.Shift_Type__c;
            stf.Shift_Start_Time__c=addShift.Start_Time__c;
            stf.Shift_End_Time__c=addShift.End_Time__c;
            stf.Shift_Address__Street__s=addShift.Location__Street__s;
            stf.Shift_Address__City__s=addShift.Location__City__s;
             stf.Shift_Address__StateCode__s=addShift.Location__StateCode__s;
            stf.Shift_Address__PostalCode__s=addShift.Location__PostalCode__s;
             stf.Shift_Address__CountryCode__s='AU';
            stf.Shift_Address__Latitude__s=addShift.Location__Latitude__s;
            stf.Shift_Address__Longitude__s=addShift.Location__Longitude__s;
            decimal breakTime= 0;
            breakTime= addShift.Break__c=='30'?0.5:0;
            stf.Shift_Calculated_Duration__c=staff.Paid_Break__c==true? addShift.Duration__c+breakTime: addShift.Duration__c ;
             stf.Shift_Break__c=breakTime;
            stf.Shift_Name__c=addShift.Shift_Name__c;
            stf.Time_Rounded_Off__c=addShift.Facility__r.Organisation__r.Enable_Time_Rounding__c;
            stf.Start_Date__c=addShift.Start_Date__c;
            stf.Shift_End_Date__c=addShift.End_Date__c;
            stf.Shift_Day_Name__c=addShift.Day_Name__c;
            
            insert stf;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
        
        return stf.Id;
    }
    
    
    
    //pass current user role
    /* @AuraEnabled
public static List<Add_Shift__c> roleBasedShift(String startDate,String endDate){
List<string> role =  new List<string> ();
Date sDate = Date.valueOf(startDate);
Date eDate = Date.valueOf(endDate);
system.debug('start date'+sDate);
system.debug('end date'+eDate);

String UserEmail = UserInfo.getUserEmail();   
Staff__c staffData=[SELECT id,Name,role__c,Facility__r.Organisation__c,Facility__c 
FROM Staff__c 
WHERE Email_Address__c =:UserEmail];
if(staffData.role__c.contains(';')){
role = staffData.role__c.split(';');
}else{
role.add(staffData.role__c);
}
string orgID=staffData.Facility__r.Organisation__c;

List<Add_Shift__c> listofShifts =[Select id,Role__c,Quantity__c,Allocated__c,Un_Allocated__c,Start_Date__c,Name,Shift_Notes__c,
End_Date__c,Start_Time__c,End_Time__c,Facility_Name__c,Break__c,Duration__c,Break_Time__c,Shift_Start_End_Time__c,Location__Street__s,Is_EOI__c,Shift_Type__c
from Add_Shift__c 
where role__c=:role and Facility__c=:staffData.Facility__c and Facility__r.Organisation__c=:orgID and Start_Date__c>=:sDate and Start_Date__c<=:eDate AND Un_Assigned_Shift__c=false
and Id Not in (select Add_Shift__c from ShiftwithStaff__c where Staff__r.Email_Address__c=:UserEmail ) ];

System.debug(listofShifts); 
return listofShifts; 

}*/
    
    
    @AuraEnabled
    public static List<Add_Shift__c> roleBasedShift(String startDate, String endDate) {
        List<String> role = new List<String>();
        Date sDate = Date.valueOf(startDate);
        Date eDate = Date.valueOf(endDate);
        
        String UserEmail = UserInfo.getUserEmail();   
        
        Staff__c staffData = [
            SELECT Id, Name, Role__c, Facility__r.Organisation__c, Facility__c ,(SELECT Id, RoleName__c,Afternoon_Shift_Hourly_Rate__c,Hourly_Rate__c,Night_Shift_Hourly_Rate__c,Public_Holiday_Hourly_Rate__c,Saturday_Hourly_Rate__c,Sleepover_Allowance__c,Sunday_Hourly_Rate__c, Active__c FROM StaffRoles__r
            WHERE Active__c = true)
            FROM Staff__c 
            WHERE Email_Address__c = :UserEmail
            LIMIT 1
        ];
        
       /*  if (staffData.Role__c != null && staffData.Role__c.contains(';')) {
            role = staffData.Role__c.split(';');
        } else {
            role.add(staffData.Role__c);
        } */
       if (staffData.StaffRoles__r != null) {
        for (StaffRole__c staffRole : staffData.StaffRoles__r) {
            if (String.isNotBlank(staffRole.RoleName__c)) {
                role.add(staffRole.RoleName__c);
            }
        }
    }
        
        String orgID = staffData.Facility__r.Organisation__c;
        
        // Query 1: Non-EOI shifts
        List<Add_Shift__c> listofShifts = [
            SELECT Id, Role__c, Quantity__c, Allocated__c, Un_Allocated__c, Start_Date__c, Name, Shift_Notes__c,Shift_Name__c,
            End_Date__c, Start_Time__c, End_Time__c, Facility_Name__c, Break__c, Duration__c, Break_Time__c,
            Shift_Start_End_Time__c, Location__Street__s, Is_EOI__c, EOI_Staff__c, Shift_Type__c
            FROM Add_Shift__c 
            WHERE Role__c IN :role
            AND Facility__c = :staffData.Facility__c
            AND Facility__r.Organisation__c = :orgID
            AND Start_Date__c >= :sDate
            AND Start_Date__c <= :eDate
            AND Un_Assigned_Shift__c = false
            AND Is_EOI__c = false
            AND Id NOT IN (
                SELECT Add_Shift__c FROM ShiftwithStaff__c WHERE Staff__r.Email_Address__c = :UserEmail
            )
        ];
        
        // Query 2: EOI shifts
        List<Add_Shift__c> allShifts = [
            SELECT Id, Role__c, Quantity__c, Allocated__c, Un_Allocated__c, Start_Date__c, Name, Shift_Notes__c,Shift_Name__c,
            End_Date__c, Start_Time__c, End_Time__c, Facility_Name__c, Break__c, Duration__c, Break_Time__c, 
            Shift_Start_End_Time__c, Location__Street__s, Is_EOI__c, EOI_Staff__c, Shift_Type__c
            FROM Add_Shift__c 
            WHERE Role__c IN :role
            AND Facility__c = :staffData.Facility__c
            AND Facility__r.Organisation__c = :orgID
            AND Start_Date__c >= :sDate
            AND Start_Date__c <= :eDate
            AND Un_Assigned_Shift__c = false
            AND Is_EOI__c = true
            AND Id NOT IN (
                SELECT Add_Shift__c FROM ShiftwithStaff__c WHERE Staff__r.Email_Address__c = :UserEmail
            )
        ];
        
        // Filter EOI shifts
        List<Add_Shift__c> filteredShifts = new List<Add_Shift__c>();
        for (Add_Shift__c shift : allShifts) {
            if (String.isBlank(shift.EOI_Staff__c)) {
                filteredShifts.add(shift);
            } else {
                List<String> eoiStaffIds = shift.EOI_Staff__c.split(',');
                if (eoiStaffIds.contains(staffData.Id)) {
                    filteredShifts.add(shift);
                }
            }
        }
        
        // Combine both lists
        listofShifts.addAll(filteredShifts);
        
        System.debug('Final Combined Shifts: ' + listofShifts);
        return listofShifts;
    }
    
    
    // Maheswari: To get the address details of Facility__c
    @AuraEnabled
    public static List<Facility__c> getFacilityAddress(Id facilityId){
        System.debug('Received facilityId: ' + facilityId);
        return [SELECT Id, Address__c,Address__City__s,Address__CountryCode__s,Address__PostalCode__s,Address__StateCode__s
                ,Address__Street__s FROM Facility__c WHERE Id = :facilityId];
    }
    // praveen : To get shiftwithsatff details for roster management time sheet
    @AuraEnabled 
    public static list<ShiftwithStaff__c> getAllShiftWithSatff(String faciID,String StartDate,String EndDate){
        Date sDate = Date.valueOf(StartDate);
        Date eDate = Date.valueOf(EndDate);
        return [select id,Staff__r.Email_Address__c,Staff__r.Name__c,Facility__c,Add_Shift__r.Start_Date__c ,Actual_Duration__c,Add_Shift__r.Shift_Type__c,End_Date__c,Add_Shift_Duration_hh_mm__c,
                Shift_Type__c,Start_time_Formula__c,End_time_formula__c,Add_Shift__r.Shift_Start_End_Time__c,Attendence__c,Staff__c,Date__c,Shift_Wage__c,Staff_Final_Hourly_Rate__c,Variance_Wage__c,Sleepover_Variance_Wages__c,Extended_Duration_in_Hours_and_Mins__c,
                Staff__r.Set_Hours__c,Duration__c,Add_Shift__r.Duration__c,Log_In_Date_Time__c,Log_Out_Date_Time__c,Approval_Status__c,Actual_Duration_In_Hours_and_Mins__c,Extended_Shift__c,Extended_Duration__c,Variance_Rate__c,Sleepover_Night_Shift_Hourly_Rate__c,Sleepover_Night_Shift_hours__c
                from ShiftwithStaff__c where Add_Shift__r.Start_Date__c >=:sDate AND Add_Shift__r.Start_Date__c <=:eDate And Attendence__c =true and Un_Assigned_Shift__c=false And (Add_shift__r.Facility__c=:faciID OR Staff__r.Facility__c =:faciID ) ];   
    }
    /*  @AuraEnabled
public static void updateAllocations(list<string> shiftIDlist){ 
system.debug('ShiftIDList'+shiftIDlist);
list<ShiftwithStaff__c> shiftStaffList =[select id,staff__c,Date__c,Actual_Duration__c,Log_In_Date_Time__c,Log_Out_Date_Time__c,Type_of_shift__c,Afternoon_shift_Hourly_Rate__c,End_Date__c,Public_holiday_Hourly_Rate__c,Public_Holiday_hours__c,Public_holiday__c,Recur_Holiday__c,
Afternoon_Shift_hours__c,Night_shift_Hourly_Rate__c,Night_Shift_Hours__c,Saturday_Hourly_Rate__c,Saturday_hours__c,General_Shift_Hourly_Rate__c,General_Shift_Hours__c,Sleepover_Shift_Hourly_Rate__c,	Sleepover_Shift_Hours__c,
Sunday_Hourly_Rate__c,Sunday_hours__c,Approval_Status__c,Day_Name__c,Sleepover_Night_Shift_hours__c,Sleepover_Night_Shift_Hourly_Rate__c,Extended_Duration__c,Variance_Rate__c,Long_Morning_Hourly_Rate__c,Long_Morning_Shift_Duartion__c,
Long_Afternoon_Hourly_Rate__c,Long_Afternoon_Shift_Duartion__c,Long_Night_Hourly_Rate__c,Long_Night_Shift_Duartion__c,Long_Sleepover_Allowance__c,Long_Sleepover_Duartion__c,
(select id,Approval_Status__c,Amount__c from Reimbursements__r where Approval_Status__c='Approved') from //Mileage__c
ShiftwithStaff__c where id IN :shiftIDlist ]; 
system.debug('Shift==>'+shiftStaffList);
List<ShiftwithStaff__c> shiftList=new List<ShiftwithStaff__c>();
List<Allocation__c> alocList=new List<Allocation__c>(); 
try {
for(ShiftwithStaff__c ss:shiftStaffList){
if(ss.Log_In_Date_Time__c != null && ss.Log_Out_Date_Time__c != null){
ss.Approval_Status__c='Approved';
shiftList.add(ss);
Allocation__c alocRec=new Allocation__c();
alocRec.End_Date__c=ss.End_Date__c; 
alocRec.Start_Date__c=ss.Date__c;
alocRec.Working_Hours__c=ss.Actual_Duration__c;
alocRec.Extended_Hours__c=ss.Extended_Duration__c >0?ss.Extended_Duration__c :0;
alocRec.Extended_Hourly_Rate__c=ss.Variance_Rate__c >0 ?ss.Variance_Rate__c :0;
system.debug('Public_holiday__c  '+ss.Public_holiday__c);
if(ss.Public_holiday__c ==true || ss.Recur_Holiday__c ==true){
system.debug('Public_holiday__c  '+ss.Public_holiday__c);
system.debug('Recur_Holiday__c  '+ss.Recur_Holiday__c);
alocRec.Public_Holiday_Hour_Rate__c=ss.Public_holiday_Hourly_Rate__c;
alocRec.Public_Holiday_Hours__c=ss.Public_Holiday_hours__c;
} else {
switch on ss.Day_Name__c {
when 'Saturday' {
alocRec.Saturday_Hourly_Rate__c = ss.Saturday_Hourly_Rate__c;
alocRec.Saturday_Hours__c = ss.Saturday_hours__c;   
}
when 'Sunday' {
alocRec.Sunday_Hourly_Rate__c = ss.Sunday_Hourly_Rate__c;
alocRec.Sunday_hours__c = ss.Sunday_hours__c;   
}
when else {
switch on ss.Type_of_shift__c {
when 'General', 'Morning' {
alocRec.General_Hourly_pay_rate__c = ss.General_Shift_Hourly_Rate__c;
alocRec.General_Working_Hours__c = ss.General_Shift_Hours__c;   
}
when 'Custom' {
alocRec.Is_Custom_Shift__c=true;
alocRec.Long_Morning_Hourly_Rate__c=ss.Long_Morning_Hourly_Rate__c;
alocRec.Long_Morning_Shift_Duartion__c=ss.Long_Morning_Shift_Duartion__c;
alocRec.Long_Afternoon_Hourly_Rate__c=ss.Long_Afternoon_Hourly_Rate__c;
alocRec.Long_Afternoon_Shift_Duartion__c=ss.Long_Afternoon_Shift_Duartion__c;
alocRec.Long_Night_Hourly_Rate__c=ss.Long_Night_Hourly_Rate__c;
alocRec.Long_Night_Shift_Duartion__c=ss.Long_Night_Shift_Duartion__c;
alocRec.Long_Sleepover_Allowance__c=ss.Long_Sleepover_Allowance__c;
alocRec.Long_Sleepover_Duartion__c=ss.Long_Sleepover_Duartion__c;
}
when 'Afternoon' {
alocRec.Afternoon_shift_Hourly_Rate__c = ss.Afternoon_shift_Hourly_Rate__c;
alocRec.Afternoon_Shift_hours__c = ss.Afternoon_Shift_hours__c;   
}
when 'Night' {
alocRec.Night_shift_Hourly_Rate__c = ss.Night_shift_Hourly_Rate__c;
alocRec.Night_Shift_Hours__c = ss.Night_Shift_Hours__c;   
}
when 'Sleepover Shift' {
alocRec.Sleepover_Shift_Hourly_Rate__c = ss.Sleepover_Shift_Hourly_Rate__c;
alocRec.Sleepover_Shift_Hours__c = ss.Sleepover_Shift_Hours__c; 
alocRec.Sleepover_Night_shift_hours__c=ss.Sleepover_Night_Shift_hours__c>0?ss.Sleepover_Night_Shift_hours__c :0;
alocRec.Sleepover_Night_Shift_hourly_rate__c=ss.Sleepover_Night_Shift_Hourly_Rate__c >0? ss.Sleepover_Night_Shift_Hourly_Rate__c:0;
alocRec.Sleep_Over_Allocation__c=true;
}
}
}
}
}
alocRec.Start_Date_Time__c=ss.Log_In_Date_Time__c;
alocRec.End_Date_Time__c=ss.Log_Out_Date_Time__c;
alocRec.Staff__c=ss.Staff__c;
alocRec.ShiftwithStaff__c=ss.Id;
alocRec.status__c='Approved';
alocList.add(alocRec);
}
}
if(shiftList.size()!=0){
update shiftList;    
}    
if(alocList.size()!=0){
insert alocList;    
} 
System.debug('Approved Allocation' +alocList);
}catch (Exception e) {
throw new AuraHandledException(e.getMessage());
} 
} */
    
    
    @AuraEnabled
    public static decimal getSetHours(){
        String UserEmail = UserInfo.getUserEmail();
        decimal hours=0;
        Staff__c staffData=[SELECT id,Name,role__c ,Set_Hours__c FROM Staff__c 
                            WHERE Email_Address__c =:UserEmail limit 1];
        hours = staffData.Set_Hours__c;
        return hours; 
    }
    @AuraEnabled
    public static void updateShiftStaff(string ShiftWithStaffId,String StaffID,String comments){
        ShiftwithStaff__c staffshift=new ShiftwithStaff__c(Id=Id.valueof(ShiftWithStaffId));
        staffshift.Staff__c=StaffID;
        staffshift.Comments__c=comments;
        try{
            update staffshift;
        }catch(exception e) {
            throw new AuraHandledException(e.getMessage());
        }
        
    }
    
   @AuraEnabled

    public static map<string,object> getAddShiftDataById(string shiftId){

        map<string,object> shiftWithStaffData=new map<string,object>();

        

        ShiftwithStaff__c addShiftdata=[SELECT Id,Staff__r.Email_Address__c, Staff__r.Name__c, Staff__r.NameToDisplay__c, Staff__r.Name, Staff__r.Last_Name__c, Facility__c, Add_Shift__r.Start_Date__c,Staff__r.Enable_Geolocation__c,Add_Shift__r.Location__Longitude__s ,Add_Shift__r.Location__Latitude__s,Add_Shift__r.Shift_Name__c,Shift_Start_Time__c,Shift_End_Time__c,Start_Date__c,Shift_End_Date__c,staff__r.Display_Nickname__c,

                                        Add_Shift__r.Break__c, Add_Shift__r.Duration__c, Shift_Type__c, Add_Shift__r.Role__c, Attendence__c, Add_Shift__r.Direction__r.Name,Add_Shift__r.Facility__c,Add_Shift__r.Get_Facility__c,Recur_Holiday__c,Is_long_Morning_Next_Day_Start__c,Long_Morning_Start_Date_One__c,Is_Long_Afternoon_Next_Day_Start__c,Long_Afternoon_Start_Date_One__c,Shift_Calculated_Duration__c,Role__c,

                                        Add_Shift__r.Shift_Start_End_Time__c, Start_time__c, End_Time__c, Add_Shift__r.Location__Street__s, Full_Name__c, Status__c, Staff__r.Set_Hours__c,Is_long_Morning__c,Long_Morning_Start_Time__c,Long_Morning_End_Time__c,Long_Morning_Hourly_Rate__c,Long_Afternoon_Shift_Duartion__c,Shift_Name__c,Shift_Category__c,Staff_Paid_Break__c,Time_Rounded_Off__c,Split_Shift_RefId__c,New_Split_Shift__c,

                                        Duration__c, Set_Hours__c, State__c, Start_time_Formula__c, End_time_formula__c, Actual_Duration__c, Staff__c, Date__c, Staff_Hourly_Rate__c,Public_holiday__c,Long_Morning_Shift_Duartion__c,Is_Long_Afternoon__c,Long_Afternoon_Start_Time__c,Long_Afternoon_End_Time__c,Long_Afternoon_Hourly_Rate__c,Type_of_Address__c,Do_you_want_to_set_this_Recurring_Roster__c,

                                        Staff_Final_Hourly_Rate__c, Shift_Wage__c, Add_Shift__c, Add_Shift__r.Un_Allocated__c, Add_Shift__r.Shift_Type__c,Split_Shifts__c,Is_Long_Night_Shift__c,Long_Night_Start_Time__c,Long_Night_Hourly_Rate__c,Long_Night_Shift_Duartion__c, Is_Long_Night_Start_Next_Day__c,Long_Night_Start_Date__c,Long_Sleepover_Start_Date__c,Is_Long_Sleepover_Next_Day_Start__c,

                                        Shiftcolor__c, End_Date__c, Add_Shift__r.Split_Shifts__c,Add_Shift__r.Split_Shift_Color__c ,Add_Shift__r.Split_Shift_Height__c,Add_Shift__r.Name, Add_Shift__r.Date__c,Request_sign_out_comments__c, Add_Shift__r.Quantity__c,Is_Long_SleepOver__c,Long_Sleepover_Start_Time__c,Long_Night_End_Time__c,Long_Sleepover_Allowance__c,Long_Sleepover_Duartion__c,Long_Sleepover_End_Time__c, 

                                        Add_Shift__r.Allocated__c, Add_Shift__r.Send_Notification__c, Add_Shift__r.End_Date__c, Add_Shift__r.Start_Time__c,Extended_Duration_in_Hours_and_Mins__c, Extended_Duration__c,Sleepover_Night_Shift_Hourly_Rate__c,Is_Long_Morning_Next_Day_Start_Two__c,Long_Morning_Start_Date_Two__c,Is_Long_Afternoon_Next_Day_Start_Two__c,Long_Afternoon_Start_Date_Two__c,

                                        Add_Shift__r.End_Time__c, Add_Shift__r.Facility_Name__c, Add_Shift__r.Location__City__s, Add_Shift__r.Location__CountryCode__s,Enable_Sign_Out__c,Enable_Sign_In__c, Variance_Wage__c, Sleepover_Variance_Wages__c, Sleepover_Night_Shift_hours__c,Variance_Rate__c,Is_long_Morning_Shift_two__c,Is_Long_afternoon_shift_two__c,RefId__c,SignIn_Notes__c,

                                        Add_Shift__r.Location__StateCode__s, Add_Shift__r.Location__PostalCode__s, Add_Shift__r.End_Time_Text__c, Add_Shift__r.Start_Time_Text__c,Add_Shift__r.Participant_Address_checkbox__c,Index__c,Long_Morning_Index__c,Long_Afternoon_Index__c,Long_Night_Index__c,Long_Sleepover_index__c,Shift_Address__City__s,Shift_Address__Street__s, Shift_Address__CountryCode__s,Shift_Address__GeocodeAccuracy__s,Shift_Address__Latitude__s,Shift_Address__Longitude__s,Shift_Address__StateCode__s,Shift_Address__PostalCode__s,Log_In_Date_Time__c,Log_Out_Date_Time__c,

                                        Long_Morning_Index_Two__c,Long_Afternoon_Index_Two__c,Long_Morning_Start_Time_Two__c,Long_Morning_End_Time_Two__c,Long_Morning_Rate_Two__c,Long_Morning_Duartion_Two__c,Long_Afternoon_Start_Time_two__c,Long_afternoon_End_Time_Two__c,Long_Afternoon_Rate_Two__c,Long_Afternoon_Duration_Two__c,long_Afternooon_Two_Service_Ref_Id__c,long_Morning_2_Service_Ref_Id__c,long_Sleepover_Service_Ref_Id__c,long_Night_Service_Ref_Id__c,long_Afternooon_Service_Ref_Id__c,long_Morining_Service_Ref_Id__c,

                                        Add_Shift__r.Is_EOI__c, Add_Shift__r.Day_Name__c, Add_Shift__r.Shift_Notes__c FROM ShiftwithStaff__c WHERE Id = :shiftId];

        

        list<Add_Shift_Checklist__c> addShiftCheckList=[select id ,Description__c,Mandatory__c,Add_Shift__c,Created_By_Static_Data__c,ShiftwithStaff__c from Add_Shift_Checklist__c where Add_Shift__c=:addShiftdata.Add_Shift__c or ShiftwithStaff__c =:shiftId  ];

        list<Break_Timings__c> breakTimingList=[select Id ,Break_Start_Time__c,Break_End_Time__c,isBreakIncluded__c,ShiftwithStaff__c from Break_Timings__c where ShiftwithStaff__c =:shiftId ORDER BY CreatedDate ];

        shiftWithStaffData.put('shiftwithstaffdata',addShiftdata);

        shiftWithStaffData.put('checklistdata',JSON.serialize(addShiftCheckList));

        shiftWithStaffData.put('breakTimingList',JSON.serialize(breakTimingList));

        System.debug('🔁 breakTimingList size: ' + breakTimingList.size());

        return shiftWithStaffData;

    }
    @AuraEnabled
    public static  list<ShiftwithStaff__c> getMultipleShiftsdata(string  shiftDate, String staffId){
        
        list<ShiftwithStaff__c> shiftStaffLsit=[select id,End_Date__c,Add_Shift__r.Shift_Start_End_Time__c,Add_Shift__r.Start_Time_Text__c,Add_Shift__r.End_Time_Text__c,Staff__c, Staff__r.Name, Staff__r.Last_Name__c,Status__c,Shiftcolor__c,Duration__c,Actual_Duration_In_Hours_and_Mins__c,Shift_Wage__c,Add_Shift__r.Shift_Type__c,Staff_Final_Hourly_Rate__c,Extended_Shift__c,Extended_Duration__c,Variance_Rate__c,Sleepover_Night_Shift_Hourly_Rate__c,Sleepover_Night_Shift_hours__c,Variance_Wage__c,Sleepover_Variance_Wages__c,Extended_Duration_in_Hours_and_Mins__c from ShiftwithStaff__c where  Add_Shift__r.Start_Date__c =:Date.valueof(shiftDate)
                                                and Staff__c=:staffId order by createddate  desc  ];
        return shiftStaffLsit;
    }
    
    public class StaffWrapper {
        public String id { get; set; }
        public Decimal finalOverallRate { get; set; }
        public Boolean attendance { get; set; }
        public Boolean isRecurring { get; set; }
        public Date recurringTill { get; set; }
        public List<ShiftWithStaffWrapper> shiftWithStaffs { get; set; }
        public StaffWrapper() {
            // This constructor is intentionally left empty
        }
        
        // Constructor
        public StaffWrapper(String id, Decimal finalOverallRate, Boolean attendance, Boolean isRecurring, Date recurringTill, List<ShiftWithStaffWrapper> shiftWithStaffs) {
            this.id = id;
            this.finalOverallRate = finalOverallRate;
            this.attendance = attendance;
            this.isRecurring = isRecurring;
            this.recurringTill = recurringTill;
            this.shiftWithStaffs = shiftWithStaffs;
        }
    }
    
    public class ShiftWithStaffWrapper {
        public String staffId { get; set; }
        public String id { get; set; }	
        
        public ShiftWithStaffWrapper() {
            // This constructor is intentionally left empty
        }
        // Constructor
        public ShiftWithStaffWrapper(String staffId, String shiftWithStaffId) {
            this.staffId = staffId;
            this.id = shiftWithStaffId;
        }
    }
    
}