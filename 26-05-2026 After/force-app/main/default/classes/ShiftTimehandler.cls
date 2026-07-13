public without sharing class ShiftTimehandler 
{ 
    public static  Boolean isFirstTime = true;
    public static Boolean isSleepoverUpdateRunning = false;
    
    public static void AddshiftwithStaff(List<ShiftwithStaff__c> newAddShiftwithStaff, Map<ID,ShiftwithStaff__c> oldshiftsMap){
        
        // Date startDate; 
        // time startime;
        // time endtime;
        // Date endDate;
        DateTime startDateTime;
        DateTime endDateTime;
        List<string> StaffID = New List<string>();
        List<string> shiftID = New List<string>();
        if(oldshiftsMap ==null) {
            for(ShiftwithStaff__c newss : newAddShiftwithStaff){ 
                StaffID.add(newss.staff__c);
                shiftID.add(newss.Add_shift__c);  
            }
            
        }
        if(oldshiftsMap !=null) {
            for(ShiftwithStaff__c newss : newAddShiftwithStaff){
                if (newss.Add_shift__c != oldshiftsMap.get(newss.Id).Add_shift__c){
                    StaffID.add(newss.staff__c);
                    shiftID.add(newss.Add_shift__c);          
                }
            } 
        }
        if(shiftID.size()>0){     
            List<Add_shift__c> shiftlist=[select id,Start_Date__c,Start_Time__c,End_Date__c,End_Time__c from Add_shift__c where id=:shiftID];
            system.debug('shift list'+shiftlist);
            for(Add_shift__c shft : shiftlist){
                // startDate=shft.Start_Date__c;
                // startime=shft.Start_Time__c;
                // endtime=shft.End_Time__c;
                // endDate=shft.End_Date__c;
                startDateTime = DateTime.newInstance(shft.Start_Date__c, shft.Start_Time__c);
                Date endShiftDate = (shft.End_Date__c != null) ? shft.End_Date__c : shft.Start_Date__c;
                endDateTime = DateTime.newInstance(endShiftDate, shft.End_Time__c);
            }
            
            /* List<ShiftwithStaff__c> availStaff=[select Staff__c from ShiftwithStaff__c where 
Attendence__c= true and Date__c=:startDate and
Start_Time__c <:endtime and End_Time__c>: startime and staff__c=:StaffID];*/
            List<ShiftwithStaff__c> potentialShifts = [
                SELECT Staff__c, Date__c, Start_Time__c, End_Date__c, End_Time__c 
                FROM ShiftwithStaff__c 
                WHERE Attendence__c = true  AND (
                    (Date__c <= :endDateTime.date()) AND (End_Date__c >= :startDateTime.date()))
                AND Staff__c IN :StaffID
            ];
            
            List<ShiftwithStaff__c> overlappingShifts = new List<ShiftwithStaff__c>();
            
            // Perform DateTime comparison in Apex to find overlaps
            for (ShiftwithStaff__c shift : potentialShifts) {
                DateTime shiftStart = DateTime.newInstance(shift.Date__c, shift.Start_Time__c);
                Date endShiftDate = (shift.End_Date__c != null) ? shift.End_Date__c : shift.Date__c;
                DateTime shiftEnd = DateTime.newInstance(endShiftDate, shift.End_Time__c);
                
                // Check for overlap
                if (shiftStart < endDateTime && shiftEnd > startDateTime) {
                    overlappingShifts.add(shift);
                }
            }
            
            system.debug('available staff'+overlappingShifts);
            
            /*  if(overlappingShifts.size()>0){
            for(ShiftwithStaff__c newss : newAddShiftwithStaff){
            newss.addError('Already Shift is Allocated to this staff for the selected duration');
            }
            }  */
            
            
        }
        //before insert 
        //add parent recordId 
        if(isFirstTime ==true && oldshiftsMap ==null){
            isFirstTime=false;
            list<id> shiftIds = new list<id> ();
            
            for(ShiftwithStaff__c shiftstaff:newAddShiftwithStaff)
            {            
                shiftIds.add(shiftstaff.Add_Shift__c);
            }
            if(shiftIds.size()>0 ){
                Map<Id, Staff__c> staffHourlyRateMap = new Map<Id, Staff__c>([SELECT Id, Name, Role__c, Saturday_Hourly_Rate__c, Sunday_Hourly_Rate__c,Public_holiday_Hourly_Rate__c, Working_Hours_Rate__c,Afternoon_shift_Hourly_Rate__c, Night_shift_Hourly_Rate__c
                                                                              FROM Staff__c WHERE Id IN :StaffID]);
                
                
                //query parent record and corresponding child records and put in map   
                list< Add_Shift__c> countShiftWithstaff = [select id,Quantity__c,Allocated__c,Shift_Notes__c,Day_Name__c, (select id from ShiftwithStaffs__r where staff__c != null and Attendence__c=true) from Add_Shift__c where id in :shiftIds];//
                Map<id ,decimal> shiftWithStaffCountmap = new Map<id,decimal>();
                map <id,decimal> staffQuantityMap =new map<id,decimal>();
                map<Id,string> StaffshiftNotes= new map<id,string>();
                map<Id,Add_Shift__c> addShiftMap= new map<id,Add_Shift__c>();
                for(Add_Shift__c shft:countShiftWithstaff)
                {
                    staffQuantityMap.put(shft.id, shft.Quantity__c); // put shift id and Quantity number in map
                    shiftWithStaffCountmap.put(shft.id, shft.ShiftwithStaffs__r.size()); // put shift id and child records count in map
                    StaffshiftNotes.put(shft.id,shft.Shift_Notes__c);
                    addShiftMap.put(shft.id,shft);
                }
                system.debug(staffQuantityMap);
                system.debug(shiftWithStaffCountmap);
                
                for(ShiftwithStaff__c staff:newAddShiftwithStaff)
                {
                    // compare  between shift with staff record and quantity
                    if(shiftWithStaffCountmap.get(staff.Add_Shift__c) >= staffQuantityMap.get(staff.Add_Shift__c))
                    {
                        staff.addError('Maximum Staff of '+staffQuantityMap.get(staff.Add_Shift__c)+ ' has been already added');
                    }
                    if(StaffshiftNotes.get(staff.Add_Shift__c) != null ){
                        staff.SignIn_Notes__c=StaffshiftNotes.get(staff.Add_Shift__c);
                    }
                    if(!Test.isRunningTest()){
                        system.debug('staff.Date__C '+staff.Date__C);
                        system.debug('staff.Start_Date__c '+staff.Start_Date__c);
                        system.debug('staff.Shift_Start_Time__cs '+staff.Shift_Start_Time__c);
                     staff.Shift_Start_DateTime_Stored__c = DateTime.newInstance(staff.Start_Date__c,staff.Shift_Start_Time__c );
                    } 
                    
                    if (staff.Log_In_Date_Time__c != null) {

                        System.debug('🟢 [SHIFT ROUNDING CHECK]');
                        System.debug('➡️ Staff Id                : ' + staff.Id);
                        System.debug('➡️ Original Login Time     : ' + staff.Log_In_Date_Time__c);
                        System.debug('➡️ Time Rounded Off Flag   : ' + staff.Time_Rounded_Off__c);
                        System.debug('➡️ Round Off Formula (min) : ' + staff.Round_Off_Forumula__c);

                        // Log_In_Date_Time__c IS ALREADY A TIME FIELD
                        Time originalTime = staff.Log_In_Date_Time__c;
                        System.debug('🕒 Original Login Time     : ' + originalTime);

                        Time roundedTime = roundToNearestInterval(
                            originalTime,
                            staff.Round_Off_Forumula__c
                        );
                        System.debug('✅ Rounded Time Result     : ' + roundedTime);

                        // Store back as Time
                        staff.Log_In_Date_Time__c = roundedTime;

                        System.debug('🏁 Final Login Time Stored : ' + staff.Log_In_Date_Time__c);
                        System.debug('🔚 [SHIFT ROUNDING APPLIED]');

                    } else {

                        System.debug('⚪ [SHIFT ROUNDING SKIPPED]');
                        System.debug('➡️ Staff Id                : ' + staff.Id);
                        System.debug('➡️ Login DateTime          : ' + staff.Log_In_Date_Time__c);
                        System.debug('➡️ Time Rounded Off Flag   : ' + staff.Time_Rounded_Off__c);
                        System.debug('🔚 Reason: Either Login DateTime is NULL or rounding flag is FALSE');

                        // No change
                        staff.Log_In_Date_Time__c = staff.Log_In_Date_Time__c;
                    }
                    
                    // Round Log Out Time
                    if (staff.Log_Out_Date_Time__c != null) {

                       System.debug('🟢 [SHIFT LOGOUT ROUNDING CHECK]');
                        System.debug('➡️ Staff Id                 : ' + staff.Id);
                        System.debug('➡️ Original Logout Time     : ' + staff.Log_Out_Date_Time__c);
                        System.debug('➡️ Time Rounded Off Flag    : ' + staff.Time_Rounded_Off__c);
                        System.debug('➡️ Round Off Formula (min)  : ' + staff.Round_Off_Forumula__c);

                        // Log_Out_Date_Time__c IS ALREADY A TIME FIELD
                        Time originalTime = staff.Log_Out_Date_Time__c;
                        System.debug('🕒 Original Logout Time     : ' + originalTime);

                        Time roundedTime = roundToNearestInterval(
                            originalTime,
                            staff.Round_Off_Forumula__c
                        );
                        System.debug('✅ Rounded Logout Time      : ' + roundedTime);

                        // Store back as Time
                        staff.Log_Out_Date_Time__c = roundedTime;

                        System.debug('🏁 Final Logout Time Stored : ' + staff.Log_Out_Date_Time__c);
                        System.debug('🔚 [SHIFT LOGOUT ROUNDING APPLIED]');

                    } else {

                        System.debug('⚪ [SHIFT LOGOUT ROUNDING SKIPPED]');
                        System.debug('➡️ Staff Id                 : ' + staff.Id);
                        System.debug('➡️ Logout DateTime          : ' + staff.Log_Out_Date_Time__c);
                        System.debug('➡️ Time Rounded Off Flag    : ' + staff.Time_Rounded_Off__c);
                        System.debug('🔚 Reason: Either Logout DateTime is NULL or rounding flag is FALSE');

                        // No change
                        staff.Log_Out_Date_Time__c = staff.Log_Out_Date_Time__c;
                    }                    
                    
                }            
            }
        }    
        
        /// overtime rate praveen implementation 
        
        if (oldshiftsMap != null && isFirstTime == true) {
            isFirstTime = false;
            Date ShiftStartDate;
            Date ShiftEndDate;
            List<String> addShiftID = new List<String>();
            List<Date> shiftDateList = new List<Date>();
            List<Id> staffIdList = new List<Id>();
            
            Map<Id, List<Child_Staff__c>> staffDocumentsMap = new Map<Id, List<Child_Staff__c>>();
            Map<Id, List<Assignment__c>> staffTrainingMap = new Map<Id, List<Assignment__c>>();
            
            List<Child_Staff__c> DocumentsList = new List<Child_Staff__c>();
            List<Assignment__c> Traininglist = new List<Assignment__c>();
            
            Map<Id, Integer> CompletedCheckList = new Map<Id, Integer>();
            Map<Id, Integer> TotalChecklistCount = new Map<Id, Integer>();
            List<Add_Shift_Checklist__c> checkList = new List<Add_Shift_Checklist__c>();
            User objUser = [ SELECT Organization_Name__c FROM User WHERE Id = : UserInfo.getUserId() ];
            List<User> userList = new List<User>();
            userList = [Select id, Name,email from User where Organization_Name__c=:objUser.Organization_Name__c];
            
            
            Map<Id, String> userEmailMap = new Map<Id, String>();
            for (User u : userList) {
     			userEmailMap.put(u.Id, u.Email);
				}
            // ✅ Now you can access any user’s email like this:
           /*  for (Id userId : userEmailMap.keySet()) {
              System.debug('User Id: ' + userId + ' | Email: ' + userEmailMap.get(userId));

            } */

            ShiftwithStaff__c newShift = newAddShiftwithStaff[0];

            Date shiftDate = newShift.Start_Date__c;

            // 🔹 Week start (Monday)
            Date weekStart = shiftDate.toStartOfWeek();

            // 🔹 Week end (Sunday)
            Date weekEnd = weekStart.addDays(6);

            // 🔹 Query all shifts of that week for same staff
            List<ShiftwithStaff__c> weekShifts = [
                SELECT Id,
                    Start_Date__c,
                    Final_Login_DateTime__c,
                    Final_Logout_DateTime__c,Removed_Duration__c,
                    Actual_Duration__c,Shift_Category__c,Sleepover_Night_Shift_hours__c
                FROM ShiftwithStaff__c
                WHERE Staff__c = :newAddShiftwithStaff[0].Staff__c
                AND Start_Date__c >= :weekStart
                AND Start_Date__c <= :weekEnd
               ORDER BY Final_Logout_DateTime__c DESC
            ];


          Set<Id> allStaffIds = new Set<Id>();

            Date minDate;
            Date maxDate;

            for(ShiftwithStaff__c sh : newAddShiftwithStaff){

                allStaffIds.add(sh.Staff__c);

                if(minDate == null || sh.Start_Date__c < minDate){
                    minDate = sh.Start_Date__c;
                }

                if(maxDate == null || sh.Start_Date__c > maxDate){
                    maxDate = sh.Start_Date__c;
                }
            }

            Map<Id, ShiftwithStaff__c> minimumEnageShifts =new Map<Id, ShiftwithStaff__c>([ SELECT Id, Start_Date__c, Staff__c, Add_Shift__c, Role__c, Shift_Category__c, Final_Logout_DateTime__c, Final_Login_DateTime__c, Add_Shift__r.Facility__c, Add_Shift__r.Facility__r.Shift_Penalty_Mode__c, Public_holiday__c

              FROM ShiftwithStaff__c  WHERE Staff__c IN :allStaffIds  AND Add_Shift__r.Facility__r.Shift_Penalty_Mode__c = 'SCHADS'  AND ( Start_Date__c >= :minDate.addDays(-1) AND Start_Date__c <= :maxDate.addDays(1) )]);
                Set<Id> addShiftIds = new Set<Id>();

       
                Set<Id> minimumEngageStaffIds = new Set<Id>();
                Set<String> minimumEngageRoleNames = new Set<String>();
                Set<Id> minimumEngageFacilityIds = new Set<Id>();
                Set<Id>  minimumEngageAddShiftIds = new Set<Id>();
                Set<Id> triggerShiftIds = new Set<Id>();

                for(ShiftwithStaff__c ss : newAddShiftwithStaff){

                    triggerShiftIds.add(ss.Id);

                    // Replace queried record with Trigger.new version
                    if(minimumEnageShifts.containsKey(ss.Id)){
                        minimumEnageShifts.put(ss.Id, ss);
                    }

                    if(ss.Add_Shift__c != null){
                        minimumEngageAddShiftIds.add(ss.Add_Shift__c);
                    }
                }
                Map<Id, Add_Shift__c>  minimumEngageAddShiftMap = new Map<Id, Add_Shift__c>(
                    [SELECT Id, Facility__c
                    FROM Add_Shift__c
                    WHERE Id IN :minimumEngageAddShiftIds]
                );
                Set<Id> facilityIds = new Set<Id>();

                    for(Add_Shift__c addShift : minimumEngageAddShiftMap.values()){
                        if(addShift.Facility__c != null){
                            facilityIds.add(addShift.Facility__c);
                        }
                    }
                Map<Id, Facility__c> facilityMap = new Map<Id, Facility__c>(
                    [SELECT Id, Shift_Penalty_Mode__c
                    FROM Facility__c
                    WHERE Id IN :facilityIds]
                );

                for(ShiftwithStaff__c sh : minimumEnageShifts.values()){
                      System.debug('sh.Add_Shift__r.Facility__c '+sh.Add_Shift__r.Facility__c);

                    minimumEngageStaffIds.add(sh.Staff__c);
                     minimumEngageRoleNames.add(sh.Role__c);
                   // addShiftIds.add(ss.Add_Shift__c);

                  /*   if(sh.Add_Shift__r.Facility__c != null){
                      minimumEngageFacilityIds.add(sh.Add_Shift__r.Facility__c);
                    } */
                }

                    System.debug('minimumEngageStaffIds '+minimumEngageStaffIds);
                    System.debug('minimumEngageRoleNames   : ' + minimumEngageRoleNames);
                    System.debug('facilityIds ' + facilityIds);
        

                List<StaffRole__c> staffRoleList = [
                    SELECT RoleName__c,
                        Facility__c,
                        StaffRole_To_Staff__c,
                        Category_Type__c,
                        Type_of_Job__c,StaffRole_To_Staff__r.Set_Hours__c
                    FROM StaffRole__c
                    WHERE StaffRole_To_Staff__c IN :minimumEngageStaffIds
                    AND RoleName__c IN :minimumEngageRoleNames
                    AND Facility__c IN :facilityIds 
                ];
                System.debug('staffRoleList ' + staffRoleList);
                Map<String, StaffRole__c> staffRoleMap = new Map<String, StaffRole__c>();

                for(StaffRole__c sr : staffRoleList){

                    String key = sr.StaffRole_To_Staff__c 
                                + '-' + sr.RoleName__c 
                                + '-' + sr.Facility__c;

                    staffRoleMap.put(key, sr);
                }
            
            // Collecting Shift IDs, Dates, and Staff IDs
            List<ShiftwithStaff__c> sleepoverShiftsToUpdate = new List<ShiftwithStaff__c>();
        
            for (ShiftwithStaff__c ss : newAddShiftwithStaff) {
                
                shiftDateList.add(ss.Date__c);
                
                if (oldshiftsMap.containsKey(ss.Id)) {  // ✅ Check if oldshiftsMap contains ss.Id
                    ShiftwithStaff__c oldShift = oldshiftsMap.get(ss.Id);
                     if(!Test.isRunningTest()){
                      ss.Shift_Start_DateTime_Stored__c = DateTime.newInstance(ss.Start_Date__c,ss.Shift_Start_Time__c );
                     }
                    if (( ss.Log_In_Date_Time__c != oldShift.Log_In_Date_Time__c) ||
                        ( ss.Log_Out_Date_Time__c != oldShift.Log_Out_Date_Time__c)) {
                            
                            staffIdList.add(ss.Staff__c);
                            addShiftID.add(ss.Add_Shift__c);
                            CompletedCheckList.put(ss.Add_Shift__c, 0);
                            TotalChecklistCount.put(ss.Add_Shift__c, 0);
                            
                            if (ss.Log_In_Date_Time__c != null) {

                                Time originalTime = ss.Log_In_Date_Time__c;
                                Time roundedTime = roundToNearestInterval(
                                    originalTime,
                                    ss.Round_Off_Forumula__c
                                );
                                ss.Log_In_Date_Time__c = roundedTime;
                                ss.Final_Login_DateTime__c =
                                    DateTime.newInstance(
                                        ss.Date__c,
                                        roundedTime
                                    );

                            }
                            else if (ss.Log_In_Date_Time__c != null) {
                                Time originalTime = ss.Log_In_Date_Time__c;

                                // No rounding applied
                                ss.Log_In_Date_Time__c = originalTime;

                                // Combine Date + Time → DateTime
                                ss.Final_Login_DateTime__c =
                                    DateTime.newInstance(
                                        ss.Date__c,
                                        originalTime
                                    );
                            }
                            else {

                             
                                ss.Final_Login_DateTime__c = null;

                                System.debug('🔚 [LOGIN CLEARED]');
                            }
                            // Round Log Out Time
                            if (ss.Log_Out_Date_Time__c != null) {
                                if (ss.Log_Out_Date_Time__c != null) {
                                    // ✅ Log_Out_Date_Time__c IS ALREADY A TIME
                                    Time originalTime = ss.Log_Out_Date_Time__c;
                                    Time roundedTime = roundToNearestInterval(
                                        originalTime,
                                        ss.Round_Off_Forumula__c
                                    );
                                    System.debug('✅ Rounded Logout Time      : ' + roundedTime);
                                    // Store rounded Time ONCE
                                    ss.Log_Out_Date_Time__c = roundedTime;
                                }
                                ss.Final_Logout_DateTime__c = DateTime.newInstance(ss.Shift_End_Date__c, ss.Log_Out_Date_Time__c);
                                Decimal diffMillis = ss.Final_Logout_DateTime__c.getTime() - ss.Final_Login_DateTime__c.getTime();
                                Decimal diffHours  = diffMillis / (1000 * 60 * 60);

                                // round to 2 decimal places
                                Decimal roundedHours = diffHours.setScale(2);
                                system.debug('time duration in trigger ==>'+roundedHours);
                            

                               Add_Shift__c addShiftRec = minimumEngageAddShiftMap.get(ss.Add_Shift__c);
                                 system.debug('addShiftRec ==>'+addShiftRec);
                                Facility__c facilityRec;
                               system.debug(' facilityMap ==>'+ facilityMap);

                                if(addShiftRec != null){
                                  facilityRec = facilityMap.get(addShiftRec.Facility__c); 
                                    system.debug('facilityRec ==>'+facilityRec);

                                    if(facilityRec != null && facilityRec.Shift_Penalty_Mode__c == 'Schads' && ss.New_Split_Shift__c !=true && ss.Broken_Shift__c !=true ){

                                        String key = ss.Staff__c + '-' + ss.Role__c + '-' + addShiftRec.Facility__c;
                                            system.debug('key ==>'+key);
                                            system.debug('staffRoleMap ==>'+staffRoleMap);

                                        if(staffRoleMap.containsKey(key)){
                                           //system.debug('staffRoleMap ==>'+staffRoleMap);

                                            StaffRole__c roleRec = staffRoleMap.get(key);

                                            Decimal minimumHours = 0;

                                            if(roleRec.Type_of_Job__c == 'Casual'){
                                                minimumHours = 2;
                                            }
                                            else if(roleRec.Type_of_Job__c == 'Part-time'){
                                                minimumHours = 3;
                                            }

                                           Decimal actualHours = roundedHours != null ? roundedHours : 0;

                                            if(actualHours < minimumHours){

                                                Decimal extraHours = minimumHours - actualHours;

                                                ss.SCHADS_Minimum_Hours__c = extraHours.setScale(2);
                                            }else {

       
                                                ss.SCHADS_Minimum_Hours__c = 0;

                                            }
                                            system.debug('Sleep over work hour =>'+ss.Sleepover_Night_Shift_hours__c );
                                           if(ss.Sleepover_Night_Shift_hours__c != null && ss.Sleepover_Night_Shift_hours__c > 0 && ss.Sleepover_Night_Shift_hours__c < 1){

                                                    ss.Sleepover_Night_Shift_hours__c = 1;
                                            }

                                           // --------------------------------------------
                                            // SCHADS Sleepover 4 Hour Rule
                                            // --------------------------------------------

                                            System.debug('--- Sleepover Rule Start ---');

                                            ShiftwithStaff__c sleepoverShift;
                                            ShiftwithStaff__c beforeShift;
                                            ShiftwithStaff__c afterShift;
                                         

                                            // Find sleepover shift

                                            Set<Id> existingShiftIds = new Set<Id>();

                                            for(ShiftwithStaff__c sh : minimumEnageShifts.values()){
                                                existingShiftIds.add(sh.Id);
                                            }
                                            for(ShiftwithStaff__c sh : minimumEnageShifts.values()){

                                    
                                                if(sh.Shift_Category__c == 'Sleepover Shift'){
                                                    sleepoverShift = sh;
                                                    System.debug('Sleepover Shift Found: ' + sleepoverShift.Id);
                                                    break;
                                                }
                                            }

                                            if(sleepoverShift != null){
                                                    for(ShiftwithStaff__c sh : minimumEnageShifts.values()){

                                                        System.debug(
                                                            '--------------------------------------------------' +
                                                            '\nCURRENT SHIFT => ' + sh.Id +
                                                            '\nCategory => ' + sh.Shift_Category__c +
                                                            '\nLogin => ' + sh.Final_Login_DateTime__c +
                                                            '\nLogout => ' + sh.Final_Logout_DateTime__c
                                                        );

                                                        if(sh.Shift_Category__c != 'Sleepover Shift'){

                                                            sh.SCHADS_Minimum_Hours__c = 0;

                                                            System.debug(
                                                                'RESET MINIMUM HOURS => ' +
                                                                sh.Id
                                                            );

                                                            // save reset for non-trigger records
                                                            if(!triggerShiftIds.contains(sh.Id)){

                                                                sleepoverShiftsToUpdate.add(sh);

                                                                System.debug(
                                                                    'ADDED FOR UPDATE => ' +
                                                                    sh.Id
                                                                );
                                                            }
                                                        }

                                                        if(sh.Id == sleepoverShift.Id){

                                                            System.debug(
                                                                'SKIPPING SLEEPOVER SHIFT => ' +
                                                                sh.Id
                                                            );

                                                            continue;
                                                        }

                                                        // ========================================
                                                        // BEFORE SHIFT
                                                        // ========================================

                                                        System.debug(
                                                            'BEFORE CONDITION INPUT =>' +
                                                            '\nShiftLogout => ' + sh.Final_Logout_DateTime__c +
                                                            '\nSleepoverLogin => ' + sleepoverShift.Final_Login_DateTime__c
                                                        );

                                                        if(
                                                            sh.Final_Logout_DateTime__c != null &&
                                                            sleepoverShift.Final_Login_DateTime__c != null &&
                                                            sh.Final_Logout_DateTime__c >=
                                                            sleepoverShift.Final_Login_DateTime__c
                                                        ){

                                                            Long diffMinutesBefore =
                                                                (
                                                                    sh.Final_Logout_DateTime__c.getTime() -
                                                                    sleepoverShift.Final_Login_DateTime__c.getTime()
                                                                ) / (1000 * 60);

                                                            System.debug(
                                                                'BEFORE CHECK PASSED =>' +
                                                                '\nShift => ' + sh.Id +
                                                                '\nLogout => ' + sh.Final_Logout_DateTime__c +
                                                                '\nSleepoverLogin => ' + sleepoverShift.Final_Login_DateTime__c +
                                                                '\nDiffMinutes => ' + diffMinutesBefore
                                                            );

                                                            // 10 PM → allow until 12 AM
                                                            if(
                                                                diffMinutesBefore >= 0 &&
                                                                diffMinutesBefore <= 120
                                                            ){

                                                                System.debug(
                                                                    'BEFORE RANGE VALID =>' +
                                                                    '\nShift => ' + sh.Id +
                                                                    '\nDiffMinutes => ' + diffMinutesBefore
                                                                );

                                                                // keep nearest shift only
                                                                if(
                                                                    beforeShift == null ||
                                                                    sh.Final_Logout_DateTime__c <
                                                                    beforeShift.Final_Logout_DateTime__c
                                                                ){

                                                                    beforeShift = sh;

                                                                    System.debug(
                                                                        'BEFORE SHIFT SELECTED =>' +
                                                                        '\nSelectedShift => ' + beforeShift.Id +
                                                                        '\nLogout => ' + beforeShift.Final_Logout_DateTime__c
                                                                    );
                                                                }
                                                                else{

                                                                    System.debug(
                                                                        'BEFORE SHIFT REJECTED =>' +
                                                                        '\nExisting Before Shift Closer'
                                                                    );
                                                                }
                                                            }
                                                            else{

                                                                System.debug(
                                                                    'BEFORE RANGE FAILED =>' +
                                                                    '\nDiffMinutes => ' + diffMinutesBefore
                                                                );
                                                            }
                                                        }
                                                        else{

                                                            System.debug(
                                                                'BEFORE CONDITION FAILED =>' +
                                                                '\nCondition did not satisfy'
                                                            );
                                                        }

                                                        // ========================================
                                                        // AFTER SHIFT
                                                        // ========================================

                                                        System.debug(
                                                            'AFTER CONDITION INPUT =>' +
                                                            '\nShiftLogin => ' + sh.Final_Login_DateTime__c +
                                                            '\nSleepoverLogout => ' + sleepoverShift.Final_Logout_DateTime__c
                                                        );

                                                        if(
                                                            sh.Final_Login_DateTime__c != null &&
                                                            sleepoverShift.Final_Logout_DateTime__c != null &&
                                                            sh.Final_Login_DateTime__c <=
                                                            sleepoverShift.Final_Logout_DateTime__c
                                                        ){

                                                            Long diffMinutesAfter =
                                                                (
                                                                    sleepoverShift.Final_Logout_DateTime__c.getTime() -
                                                                    sh.Final_Login_DateTime__c.getTime()
                                                                ) / (1000 * 60);

                                                            System.debug(
                                                                'AFTER CHECK PASSED =>' +
                                                                '\nShift => ' + sh.Id +
                                                                '\nLogin => ' + sh.Final_Login_DateTime__c +
                                                                '\nSleepoverLogout => ' + sleepoverShift.Final_Logout_DateTime__c +
                                                                '\nDiffMinutes => ' + diffMinutesAfter
                                                            );

                                                            // allow 4 AM → 6 AM
                                                            if(
                                                                diffMinutesAfter >= 0 &&
                                                                diffMinutesAfter <= 120
                                                            ){

                                                                System.debug(
                                                                    'AFTER RANGE VALID =>' +
                                                                    '\nShift => ' + sh.Id +
                                                                    '\nDiffMinutes => ' + diffMinutesAfter
                                                                );

                                                                // keep latest closest shift
                                                                if(
                                                                    afterShift == null ||
                                                                    sh.Final_Login_DateTime__c >
                                                                    afterShift.Final_Login_DateTime__c
                                                                ){

                                                                    afterShift = sh;

                                                                    System.debug(
                                                                        'AFTER SHIFT SELECTED =>' +
                                                                        '\nSelectedShift => ' + afterShift.Id +
                                                                        '\nLogin => ' + afterShift.Final_Login_DateTime__c
                                                                    );
                                                                }
                                                                else{

                                                                    System.debug(
                                                                        'AFTER SHIFT REJECTED =>' +
                                                                        '\nExisting After Shift Closer'
                                                                    );
                                                                }
                                                            }
                                                            else{

                                                                System.debug(
                                                                    'AFTER RANGE FAILED =>' +
                                                                    '\nDiffMinutes => ' + diffMinutesAfter
                                                                );
                                                            }
                                                        }
                                                        else{

                                                            System.debug(
                                                                'AFTER CONDITION FAILED =>' +
                                                                '\nCondition did not satisfy'
                                                            );
                                                        }
                                                    }

                                                   

                                                    Decimal beforeHours = 0;
                                                    Decimal afterHours = 0;

                                                    if(beforeShift != null){

                                                        Decimal diffMillisBefore =
                                                            beforeShift.Final_Logout_DateTime__c.getTime() -
                                                            beforeShift.Final_Login_DateTime__c.getTime();

                                                        beforeHours =
                                                            (diffMillisBefore / (1000 * 60 * 60)).setScale(2);

                                                        System.debug(
                                                            'BEFORE HOURS =>' +
                                                            '\nShift => ' + beforeShift.Id +
                                                            '\nHours => ' + beforeHours
                                                        );
                                                    }

                                                    if(afterShift != null){

                                                        Decimal diffMillisAfter =
                                                            afterShift.Final_Logout_DateTime__c.getTime() -
                                                            afterShift.Final_Login_DateTime__c.getTime();

                                                        afterHours =
                                                            (diffMillisAfter / (1000 * 60 * 60)).setScale(2);

                                                        System.debug(
                                                            'AFTER HOURS =>' +
                                                            '\nShift => ' + afterShift.Id +
                                                            '\nHours => ' + afterHours
                                                        );
                                                    }
                                            
                                                if(beforeShift != null){

                                                    Decimal diffMillisBefore =
                                                        beforeShift.Final_Logout_DateTime__c.getTime() -
                                                        beforeShift.Final_Login_DateTime__c.getTime();

                                                    beforeHours = (diffMillisBefore / (1000 * 60 * 60)).setScale(2);

                                                   // System.debug('Before Shift Hours: ' + beforeHours);
                                                }
                                                if(afterShift != null){

                                                    Decimal diffMillisAfter =
                                                        afterShift.Final_Logout_DateTime__c.getTime() -
                                                        afterShift.Final_Login_DateTime__c.getTime();

                                                    afterHours = (diffMillisAfter / (1000 * 60 * 60)).setScale(2);

                                                  //  System.debug('After Shift Hours: ' + afterHours);
                                                }
                                                Decimal sleepoverExtra = 0;
                                                ShiftwithStaff__c shiftToUplift;
                                                // ------------------------------------------------
                                                // Case 1 : Only BEFORE shift
                                                // ------------------------------------------------
                                                if(beforeShift != null && afterShift == null){

                                                  //  System.debug('Case: Only Before Shift');

                                                    if(beforeHours < 4){
                                                        shiftToUplift = beforeShift;
                                                        sleepoverExtra = 4 - beforeHours;
                                                    }
                                                }

                                                // ------------------------------------------------
                                                // Case 2 : Only AFTER shift
                                                // ------------------------------------------------
                                                else if(afterShift != null && beforeShift == null){

                                                  //  System.debug('Case: Only After Shift');

                                                    if(afterHours < 4){
                                                        shiftToUplift = afterShift;
                                                        sleepoverExtra = 4 - afterHours;
                                                    }
                                                }
                                                // ------------------------------------------------
                                                // Case 3 : Both exist
                                                // ------------------------------------------------
                                                else if(beforeShift != null && afterShift != null){

                                                  //  System.debug('Case: Both Shifts Exist');

                                                    if(beforeHours >= 4 || afterHours >= 4){

                                                       // System.debug('One shift already >=4 hours → No uplift required');

                                                    }else{

                                                        if(beforeHours > afterHours){

                                                            shiftToUplift = beforeShift;
                                                            sleepoverExtra = 4 - beforeHours;

                                                       //     System.debug('Uplifting BEFORE shift');

                                                        }
                                                        else if(afterHours > beforeHours){

                                                            shiftToUplift = afterShift;
                                                            sleepoverExtra = 4 - afterHours;

                                                        //    System.debug('Uplifting AFTER shift');

                                                        }
                                                        else{

                                                            shiftToUplift = afterShift;
                                                            sleepoverExtra = 4 - afterHours;

                                                         //   System.debug('Both equal → uplifting AFTER shift');
                                                        }
                                                    }
                                                }

                                                // ------------------------------------------------
                                                // Apply uplift
                                                // ------------------------------------------------
                                                system.debug('triggerShiftIds ==>'+triggerShiftIds);
                                                system.debug('shiftToUplift ==>'+shiftToUplift);

                                            if(shiftToUplift != null){

                                                    System.debug('Uplift Applied To Shift: ' + shiftToUplift.Id +
                                                                ' Extra Hours: ' + sleepoverExtra);

                                                    // Reset trigger shift first
                                                    ss.SCHADS_Minimum_Hours__c = 0;

                                                    // If trigger record is the uplifted shift
                                                    if(triggerShiftIds.contains(shiftToUplift.Id)){

                                                        ss.SCHADS_Minimum_Hours__c = sleepoverExtra.setScale(2);

                                                    }
                                                    else{

                                                        shiftToUplift.SCHADS_Minimum_Hours__c = sleepoverExtra.setScale(2);

                                                        if(!sleepoverShiftsToUpdate.contains(shiftToUplift)){
                                                            sleepoverShiftsToUpdate.add(shiftToUplift);
                                                        }
                                                    }
                                                }
                                                else{

                                                    // no uplift required
                                                    ss.SCHADS_Minimum_Hours__c = 0;

                                                    System.debug('No Sleepover Uplift Required');
                                                }
                                           }

                                            System.debug('--- Sleepover Rule End ---');
                                            String employmentType = roleRec != null ? roleRec.Type_of_Job__c : null;
                                        
                                             OTResult otRes =calculateOvertime(ss,employmentType,weekShifts,roleRec);

                                            // Assign values
                                            ///    ss.Over_Time_Hours__c     = otRes.totalOT;
                                            ss.Over_Time_Tier_One__c = otRes.tier1;
                                            ss.Over_Time_Tier_Two__c = otRes.tier2;
                                            ss.Removed_Duration__c = otRes.removedHours;
                                            //ss.SCHADS_Ordinary_Hours__c = otRes.ordinaryHours;


                                        }
                                    }
                                }
                            
                                // Calculate Extended Duration
                                DateTime startTimeValue = DateTime.newInstanceGmt(ss.Shift_End_Date__c, AddShiftHandler.getTimeIn24HrFormat(ss.End_time_formula__c.toLowerCase()));
                                DateTime endTimeValue = DateTime.newInstanceGmt(ss.Shift_End_Date__c, ss.Log_Out_Date_Time__c);
                            
                                Decimal timeDifferenceInMillis = Decimal.valueOf(endTimeValue.getTime() - startTimeValue.getTime());
                                Decimal timeDifferenceInHours = timeDifferenceInMillis / (1000 * 60 * 60);
                                if(facilityRec != null && facilityRec.Shift_Penalty_Mode__c == 'Schads'){
    
                                        ss.Extended_Duration__c = 0;
                                        ss.Extended_Duration_in_Hours_and_Mins__c = '0:00';
                                 }else{
                                        ss.Extended_Duration__c = timeDifferenceInHours;
                                        Integer totalMinutesExtended = Math.round(ss.Extended_Duration__c * 60);
                                        if (totalMinutesExtended < -15) {
                                            system.debug('totalMinutesExtended >>>'+ totalMinutesExtended);
                                            StaffEmailNotificationController.sendEarlyLogoutNotification(ss, userEmailMap);
                                        }
                                    
                                        // Formatting Extended Duration
                                        if (ss.Extended_Duration__c < 0) {
                                            ss.Extended_Duration__c = 0;
                                            ss.Extended_Duration_in_Hours_and_Mins__c = '0:00';
                                        } else {
                                            Integer extendedHH = totalMinutesExtended / 60;
                                            Integer extendedMM = Math.mod(totalMinutesExtended, 60);
                                            String formattedExtendedHours = extendedHH + ':' + (extendedMM < 10 ? '0' + extendedMM : String.valueOf(extendedMM));
                                            ss.Extended_Duration_in_Hours_and_Mins__c = formattedExtendedHours;
                                        }

                                 }
                            
                                // Convert Sleepover Night Shift Hours to HH:mm
                                Integer totalMinutesSleepover = Integer.valueOf(ss.Sleepover_Night_Shift_hours__c > 0 ? ss.Sleepover_Night_Shift_hours__c * 60 : 0);
                                Integer sleepoverHH = totalMinutesSleepover / 60;
                                Integer sleepoverMM = Math.mod(totalMinutesSleepover, 60);
                                String formattedSleepoverHours = sleepoverHH + ':' + (sleepoverMM < 10 ? '0' + sleepoverMM : String.valueOf(sleepoverMM));
                                ss.Sleepover_Night_Shift_hours_in_hh_mm__c = formattedSleepoverHours;
                            
                            } else {
                                ss.Final_Logout_DateTime__c = null;
                            }

                            
                        }
                }
            }

            if(!sleepoverShiftsToUpdate.isEmpty() && !isSleepoverUpdateRunning){

                       isSleepoverUpdateRunning = true;

                        update sleepoverShiftsToUpdate;

                        isSleepoverUpdateRunning = false;
           }

          
                        
            // Fetch related records if there are staff members
            if (!staffIdList.isEmpty()) {
                DocumentsList = [SELECT Id, Name, Type__c, Expiry_Date__c, View_File__c, Comments__c, Staff__c 
                                 FROM Child_Staff__c 
                                 WHERE Staff__c IN :staffIdList];
                
                Traininglist = [SELECT Id, Due_Date__c, Status__c, Staff__c ,Completed_Date__c
                                FROM Assignment__c 
                                WHERE Staff__c IN :staffIdList and Status__c  = 'Completed'];
                
                checkList = [SELECT Id, Name, Add_Shift__c, Mandatory__c, Description__c, Completed__c 
                             FROM Add_Shift_Checklist__c 
                             WHERE Add_Shift__c IN :addShiftID];  
                
                // Populate staffDocumentsMap
                for (Child_Staff__c doc : DocumentsList) {
                    if (!staffDocumentsMap.containsKey(doc.Staff__c)) {
                        staffDocumentsMap.put(doc.Staff__c, new List<Child_Staff__c>());
                    }
                    staffDocumentsMap.get(doc.Staff__c).add(doc);
                }
                
                // Populate staffTrainingMap
                for (Assignment__c training : Traininglist) {
                    if (!staffTrainingMap.containsKey(training.Staff__c)) {
                        staffTrainingMap.put(training.Staff__c, new List<Assignment__c>());
                    }
                    staffTrainingMap.get(training.Staff__c).add(training);
                }
                
                // Process checklist data
                for (Add_Shift_Checklist__c cl : checkList) {
                    if (TotalChecklistCount.containsKey(cl.Add_Shift__c)) {
                        TotalChecklistCount.put(cl.Add_Shift__c, TotalChecklistCount.get(cl.Add_Shift__c) + 1);
                        
                        if (cl.Completed__c == true) {
                            CompletedCheckList.put(cl.Add_Shift__c, CompletedCheckList.get(cl.Add_Shift__c) + 1);
                        }
                    }
                }
            }
            
            // Calculate Checklist Scores
            Map<Id, Decimal> checklistScores = new Map<Id, Decimal>();
            for (Id ssId : addShiftID) {
                Integer completed = CompletedCheckList.containsKey(ssId) ? CompletedCheckList.get(ssId) : 0;
                Integer total = TotalChecklistCount.containsKey(ssId) ? TotalChecklistCount.get(ssId) : 0;
                
                Decimal checklistScore = 0;
                if (total > 0) {
                    checklistScore = (Decimal.valueOf(completed) / Decimal.valueOf(total)) * 5;
                }
                checklistScores.put(ssId, checklistScore);
            }
            
            // Update Shift Scores
            for (ShiftwithStaff__c ss : newAddShiftwithStaff) {
                if (oldshiftsMap.containsKey(ss.Id)) {
                    ShiftwithStaff__c oldShift = oldshiftsMap.get(ss.Id);
                    
                    
                    if (ss.Log_In_Date_Time__c != null && oldShift.Log_In_Date_Time__c != ss.Log_In_Date_Time__c && ss.SignIn_From_Web__c == false) {
                        // ss.Shift_SCR__c =0;
                        ss.Shift_SCR__c += 1;
                    }
                    
                    if (ss.Log_In_Date_Time__c != null && ss.Start_Time__c != null && oldShift.Log_In_Date_Time__c != ss.Log_In_Date_Time__c) {
                        Decimal loginSeconds = ss.Log_In_Date_Time__c.hour() * 3600 + ss.Log_In_Date_Time__c.minute() * 60 + ss.Log_In_Date_Time__c.second();
                        Decimal shiftStartSeconds = ss.Start_Time__c.hour() * 3600 + ss.Start_Time__c.minute() * 60 + ss.Start_Time__c.second();
                        
                        Decimal earlyLoginThreshold = 15 * 60;  
                        Decimal lateLoginThreshold = 7.5 * 60;
                        
                        if (loginSeconds >= (shiftStartSeconds - earlyLoginThreshold) &&
                            loginSeconds <= (shiftStartSeconds + lateLoginThreshold)) {
                                ss.Shift_SCR__c += 1;
                            }
                    }
                    
                    if (ss.Log_Out_Date_Time__c != null && ss.End_Time__c != null  && ss.Log_Out_Date_Time__c != null && ss.Log_Out_Date_Time__c != oldShift.Log_Out_Date_Time__c) {
                        Decimal logoutSeconds = ss.Log_Out_Date_Time__c.hour() * 3600 + ss.Log_Out_Date_Time__c.minute() * 60 + ss.Log_Out_Date_Time__c.second();
                        Decimal shiftEndSeconds = ss.End_Time__c.hour() * 3600 + ss.End_Time__c.minute() * 60 + ss.End_Time__c.second();
                        
                        Decimal lateLogoutThreshold = 7.5 * 60;
                        
                        if (logoutSeconds >= shiftEndSeconds && logoutSeconds <= (shiftEndSeconds + lateLogoutThreshold)) {
                            ss.Shift_SCR__c += 1;
                        }
                        
                        // Check if all required documents are valid
                        Boolean allDocsValid = true;
                        if (staffDocumentsMap.containsKey(ss.Staff__c) && staffDocumentsMap.get(ss.Staff__c) != null) {
                            if (staffDocumentsMap.get(ss.Staff__c).isEmpty()) {
                                // Add 1 point if no documents
                                ss.Shift_SCR__c += 1;
                            } else {
                                for (Child_Staff__c doc : staffDocumentsMap.get(ss.Staff__c)) {
                                    if (doc.Expiry_Date__c != null && doc.Expiry_Date__c < System.today()) {
                                        allDocsValid = false;
                                        break;
                                    }
                                }
                                if (allDocsValid) {
                                    ss.Shift_SCR__c += 1;
                                }
                            }
                        } else {
                            ss.Shift_SCR__c += 1;  // If no documents, add 1 point
                        }
                        
                        // Check if all required trainings are completed
                        Boolean allTrainingsCompleted = true;
                        if (staffTrainingMap.containsKey(ss.Staff__c) && staffTrainingMap.get(ss.Staff__c) != null) {
                            if (staffTrainingMap.get(ss.Staff__c).isEmpty()) {
                                // Add 1 point if no training
                                ss.Shift_SCR__c += 1;
                            } else {
                                for (Assignment__c training : staffTrainingMap.get(ss.Staff__c)) {
                                    if ((training.Due_Date__c == null ) || training.Due_Date__c <=  training.Completed_Date__c) {
                                        allTrainingsCompleted = false;
                                        break;
                                    }
                                }
                                if (allTrainingsCompleted) {
                                    ss.Shift_SCR__c += 1;
                                }
                            }
                        } else {
                            ss.Shift_SCR__c += 1;  // If no training, add 1 point
                        }
                        System.debug('checklistScores: ' + checklistScores);
                        if (checklistScores.containsKey(ss.Add_Shift__c)) {
                            // If checklist score exists, add it to the Shift_SCR__c
                            Decimal checklistScore = checklistScores.get(ss.Add_Shift__c);
                            ss.Shift_SCR__c += (checkList.size() > 0) ? checklistScore : 5;  // If 0, add 5 points
                        }else {
                            ss.Shift_SCR__c += 5;  // Add 5 points if no checklist
                        }
                        
                        System.enqueueJob(new StaffbatchScrCalculation(ss.Staff__c)); /// call Queue apex 
                        
                    }
                }
            }
            
            system.debug('shiftDateList ==>'+shiftDateList[0]);
            List<ShiftwithStaff__c> previousShift = [SELECT Id, Date__c,End_Date__c,Add_Shift__r.End_Date__c, Actual_Duration__c, Log_In_Date_Time__c, Log_Out_Date_Time__c,Final_Logout_DateTime__c,
                                                     Staff__c, Staff_Final_Hourly_Rate__c 
                                                     FROM ShiftwithStaff__c 
                                                     WHERE (Date__c IN :shiftDateList 
                                                            OR Date__c =: shiftDateList[0]-1)
                                                     AND Staff__c IN :staffIdList  
                                                     ORDER BY CreatedDate DESC ];
            
            if (previousShift.size() > 1) {
                System.debug('Previous shift: ' + previousShift[1]);
                System.debug('Previous shift: ' + previousShift[1].Log_Out_Date_Time__c);
                
                for (ShiftwithStaff__c shift : newAddShiftwithStaff) {
                    if (oldshiftsMap.get(shift.Id) != null && 
                        oldshiftsMap.get(shift.Id).Log_Out_Date_Time__c != shift.Log_Out_Date_Time__c &&
                        (shift.Day_Name__c != 'Saturday' && shift.Day_Name__c != 'Sunday')) {
                            
                            if (previousShift.size() > 1 && previousShift[1].Log_Out_Date_Time__c != null) {
                                Time t1 = shift.Log_In_Date_Time__c;
                                Time t2 = previousShift[1].Log_Out_Date_Time__c;
                                
                                Date today = Date.today();
                                System.debug('end date : ' + previousShift[1].End_Date__c);
                                Decimal timeDifferenceInHours = 0;
                                if(t1 != null){
                                    DateTime dt1 = DateTime.newInstanceGmt(shift.Date__c, t1);
                                    DateTime dt2 = DateTime.newInstanceGmt( previousShift[1].End_Date__c, t2);
                                    
                                    System.debug('dt1 : ' + dt1);
                                    System.debug('dt2: ' + dt2);
                                    // Calculate time difference in hours
                                    Decimal timeDifferenceInMillis = Decimal.valueOf(dt1.getTime() - dt2.getTime());
                                    timeDifferenceInHours = timeDifferenceInMillis / (1000 * 60 * 60); // Convert to hours                                   
                                }
                                System.debug('Difference : ' + timeDifferenceInHours);
                                if (previousShift[1].Actual_Duration__c >= 8 && timeDifferenceInHours <= 10) {
                                    shift.Staff_Final_Hourly_Rate__c = shift.Staff_Final_Hourly_Rate__c * 2;
                                }
                            } 
                            else {
                                System.debug('Previous shift log out time is null or no previous shift available. Applying default logic.');
                                shift.Staff_Final_Hourly_Rate__c = shift.Staff_Final_Hourly_Rate__c;
                            }
                        }
                }
            }
        }
        
    }
   

    public static Time roundToNearestInterval(Time inputTime, Decimal intervalMinutes) {

        System.debug('⏱️ [ROUNDING START]');
        System.debug('➡️ Input Time        : ' + inputTime);
        System.debug('➡️ Interval Minutes  : ' + intervalMinutes);

        if (inputTime == null || intervalMinutes == null || intervalMinutes <= 0) {
            System.debug('⚠️ Invalid input. Returning original time.');
            return inputTime;
        }

        // Convert Decimal → Integer minutes (15.0 → 15)
        Integer intervalMins = intervalMinutes.intValue();
        System.debug('🔢 Interval Minutes (int): ' + intervalMins);

        // Extract components
        Integer hour   = inputTime.hour();
        Integer minute = inputTime.minute();
        Integer second = inputTime.second();

        System.debug(
            '🧩 Time Components -> Hour: ' + hour +
            ', Minute: ' + minute +
            ', Second: ' + second
        );

        // Convert to total seconds
        Integer totalSeconds = (hour * 3600) + (minute * 60) + second;
        System.debug('⏲️ Total Seconds: ' + totalSeconds);

        // Convert intervalMinutes → seconds
        Integer intervalSeconds = intervalMins * 60;
        System.debug('⏱️ Interval Seconds: ' + intervalSeconds);

        // Midpoint of each interval
        Integer midpointSeconds = intervalSeconds / 2;
        System.debug('📍 Midpoint Seconds: ' + midpointSeconds);

        // Rounding logic
        Integer remainder = Math.mod(totalSeconds, intervalSeconds);
        System.debug('🔁 Remainder Seconds: ' + remainder);

        Integer roundedSeconds;

        if (remainder <= midpointSeconds) {
            // Round down
            roundedSeconds = (totalSeconds / intervalSeconds) * intervalSeconds;
            System.debug('⬇️ Rounding DOWN');
        } else {
            // Round up
            roundedSeconds = ((totalSeconds / intervalSeconds) + 1) * intervalSeconds;
            System.debug('⬆️ Rounding UP');
        }

        System.debug('✅ Rounded Seconds Total: ' + roundedSeconds);

        // Convert back to hour/minute/second
        Integer roundedHour   = roundedSeconds / 3600;
        Integer roundedMinute = Math.mod(roundedSeconds, 3600) / 60;
        Integer roundedSecond = Math.mod(roundedSeconds, 60);

        System.debug(
            '🕒 Rounded Time Components -> Hour: ' + roundedHour +
            ', Minute: ' + roundedMinute +
            ', Second: ' + roundedSecond
        );

        Time result = Time.newInstance(roundedHour, roundedMinute, roundedSecond, 0);
        System.debug('🏁 Final Rounded Time: ' + result);
        System.debug('⏱️ [ROUNDING END]');

        return result;
    }


    public static void UpdateHourlyRate(List<ShiftwithStaff__c> shiftList,boolean isUpdateFromRecur) {
        system.debug('shiftList >>'+shiftList);
        
        Set<Id> parentIds = new Set<Id>();
        Set<Id> staffIds = new Set<Id>();
        Set<Date> allShiftDates = new Set<Date>();
        
        for (ShiftwithStaff__c shift : shiftList) {
            if (shift.Add_Shift__c != null){
                parentIds.add(shift.Add_Shift__c);
            }
            if (shift.Staff__c != null) {
                staffIds.add(shift.Staff__c);
            }
            if (shift.Date__c != null) {
                allShiftDates.add(shift.Date__c);
            }
        }
        
        System.debug('Parent Shift IDs: ' + parentIds);
        System.debug('Staff IDs: ' + staffIds);
        System.debug('Shift Dates: ' + allShiftDates);
        
        Map<Id, Add_Shift__c> shiftMap = new Map<Id, Add_Shift__c>([
            SELECT Id, Name, Do_you_want_to_set_this_a_recurring_shif__c 
            FROM Add_Shift__c 
            WHERE Id IN :parentIds AND Do_you_want_to_set_this_a_recurring_shif__c = true
        ]);
        
        System.debug('Queried Add_Shift__c records: ' + shiftMap);
       /*  if (shiftMap.isEmpty()) {
            System.debug('No Add_Shift__c records found, skipping rate update.');
            return;
        } */
        
        Map<Id, Staff__c> staffMap = new Map<Id, Staff__c>([
            SELECT Id, Working_Hours_Rate__c, Saturday_Hourly_Rate__c, Sunday_Hourly_Rate__c, 
            Public_holiday_Hourly_Rate__c, Afternoon_shift_Hourly_Rate__c, 
            Night_shift_Hourly_Rate__c, Organization_Name__c,(SELECT Id, RoleName__c,Afternoon_Shift_Hourly_Rate__c,Hourly_Rate__c,Night_Shift_Hourly_Rate__c,Public_Holiday_Hourly_Rate__c,Saturday_Hourly_Rate__c,Sleepover_Allowance__c,Sunday_Hourly_Rate__c, Active__c FROM StaffRoles__r WHERE Active__c = true)

            FROM Staff__c 
            WHERE Id IN :staffIds
        ]);
        
        System.debug('Queried Staff__c records: ' + staffMap);
        
        Set<Id> orgIds = new Set<Id>();
        for (Staff__c staff : staffMap.values()) {
            if (staff.Organization_Name__c != null) {
                orgIds.add(staff.Organization_Name__c);
            }
        }
        
        System.debug('Org IDs: ' + orgIds);
        
        Map<Id, Organisation__c> orgMap = new Map<Id, Organisation__c>([
            SELECT Id, Address__c 
            FROM Organisation__c 
            WHERE Id IN :orgIds
        ]);
        
        System.debug('Queried Organisation__c records: ' + orgMap);
        
        Map<Id, String> orgStateCodeMap = new Map<Id, String>();
        for (Organisation__c org : orgMap.values()) {
            if (String.isNotBlank(org.Address__c)) {
                List<String> parts = org.Address__c.split(',');
                if (parts.size() >= 3) {
                    List<String> stateParts = parts[2].trim().split(' ');
                    if (!stateParts.isEmpty()) {
                        orgStateCodeMap.put(org.Id, stateParts[0].trim());
                    }
                }
            }
        }
        
        System.debug('Org ID to State Code Map: ' + orgStateCodeMap);
        
        Map<String, String> stateMap = new Map<String, String>{
            'NSW' => 'New South Wales', 'VIC' => 'Victoria', 'QLD' => 'Queensland',
                'SA' => 'South Australia', 'WA' => 'Western Australia', 'TAS' => 'Tasmania',
                'NT' => 'Northern Territory', 'ACT' => 'Australian Capital Territory'
                };
                    
                    Set<String> fullStateNames = new Set<String>();
        Map<Id, String> staffIdToFullStateName = new Map<Id, String>();
        for (Staff__c staff : staffMap.values()) {
            String stateCode = orgStateCodeMap.get(staff.Organization_Name__c);
            if (stateCode != null && stateMap.containsKey(stateCode)) {
                String fullState = stateMap.get(stateCode);
                staffIdToFullStateName.put(staff.Id, fullState);
                fullStateNames.add(fullState);
            }
        }
        
        System.debug('Staff ID to Full State Map: ' + staffIdToFullStateName);
        System.debug('Full State Names for querying Public Holidays: ' + fullStateNames);
        system.debug('allShiftDates==>'+allShiftDates);
        
        String formattedStates = '\'' + String.join(fullStateNames, '\',\'') + '\'';
        
        String query = 'SELECT Id, Date__c, State__c, Holiday_Name__c ' +
            'FROM Public_Holiday__c ' +
            'WHERE State__c INCLUDES (' + formattedStates + ')';
        
        List<Public_Holiday__c> publicHolidays = Database.query(query);
        
        System.debug('publicHolidays >> ' + publicHolidays);
        System.debug('Queried Public Holidays: ' + publicHolidays);
        
        Set<String> dateStateKeys = new Set<String>();
        
        for (Public_Holiday__c holiday : publicHolidays) {
            if (String.isNotBlank(holiday.State__c) && holiday.Date__c != null) {
                List<String> individualStates = holiday.State__c.split(';');
                for (String state : individualStates) {
                    String trimmedState = state.trim();
                    String formattedDate = holiday.Date__c.format(); // or use ISO8601 like holiday.Date__c.formatGmt('yyyy-MM-dd')
                    String key = formattedDate + '-' + trimmedState;
                    dateStateKeys.add(key);
                }
            }
        }
        
        
        System.debug('Date-State Keys for Public Holidays: ' + dateStateKeys);
        
        for (ShiftwithStaff__c shift : shiftList) {
            Staff__c staff = staffMap.get(shift.Staff__c);
            if (staff == null || shift.Start_Date__c == null || String.isBlank(shift.Day_Name__c)) {
                System.debug('Skipping shift due to missing data: ' + shift);
                continue;
            }
            
            String fullState = staffIdToFullStateName.get(staff.Id);
            system.debug('shift.Date__c >> '+shift.Start_Date__c);
            system.debug('fullState >>'+fullState);
            Boolean isPublicHoliday = false;
            if (String.isNotBlank(fullState) && shift.Start_Date__c != null) {
                String shiftKey = shift.Start_Date__c.format() + '-' + fullState.trim();
                System.debug('Checking key: ' + shiftKey);
                isPublicHoliday = dateStateKeys.contains(shiftKey);
            }
            System.debug('isPublicHoliday >>'+ isPublicHoliday);
            String day = shift.Day_Name__c.toLowerCase();
            system.debug('day >> '+day);
            String shiftType = shift.Type_of_shift__c != null ? shift.Type_of_shift__c.toLowerCase() : '';
             StaffRole__c roleRec = getMatchedRole(staff, shift.Role__c);
           Decimal rate;
            if(shiftType == 'sleepover shift'){
                rate = isUpdateFromRecur==true ? shift.Staff_Final_Hourly_Rate__c :roleRec.Sleepover_Allowance__c;
            } else if (isPublicHoliday) {
                rate = roleRec != null ? roleRec.Public_Holiday_Hourly_Rate__c : staff.Public_holiday_Hourly_Rate__c;
                shift.Recur_Holiday__c = true;
            } else {
                switch on day {
                    when 'saturday' {
                        rate = roleRec != null ? roleRec.Saturday_Hourly_Rate__c : staff.Saturday_Hourly_Rate__c;
                    }
                    when 'sunday' {
                        rate = roleRec != null ? roleRec.Sunday_Hourly_Rate__c : staff.Sunday_Hourly_Rate__c;
                    }
                    when else {
                        switch on shiftType {
                            when 'night' {
                                rate = roleRec != null ? roleRec.Night_Shift_Hourly_Rate__c : staff.Night_shift_Hourly_Rate__c;
                            }
                            when 'afternoon' {
                                rate = roleRec != null ? roleRec.Afternoon_Shift_Hourly_Rate__c : staff.Afternoon_shift_Hourly_Rate__c;
                            }
                            when else {
                                if (day == 'monday' || day == 'tuesday' || day == 'wednesday' ||
                                    day == 'thursday' || day == 'friday') {
                                        rate = roleRec != null ? roleRec.Hourly_Rate__c : staff.Working_Hours_Rate__c;
                                    }
                            }
                        }
                    }
                }
            }
            
            System.debug('Shift ID: ' + shift.Id + ' | Day: ' + day + ' | Shift Type: ' + shiftType +
                         ' | Is Public Holiday: ' + isPublicHoliday + ' | Rate Applied: ' + rate);
            
            if (rate != null) {
                shift.Staff_Final_Hourly_Rate__c = rate;
            }
            
            if(shift.Is_long_Morning__c && shift.Do_you_want_to_set_this_Recurring_Roster__c==true ){
               shift.Long_Morning_Start_Date_One__c=shift.Is_long_Morning_Next_Day_Start__c ==false?shift.Date__c :shift.Date__c.adddays(1);
                string  DayName=DateTime.newInstance(shift.Long_Morning_Start_Date_One__c, Time.newInstance(0, 0, 0, 0)).format('EEEE');
                String shiftKey = shift.Long_Morning_Start_Date_One__c.format() + '-' + fullState.trim();
                Boolean isHoliday = dateStateKeys.contains(shiftKey);
                shift.Long_Morning_Hourly_Rate__c=ReturnStaffRates(staff,roleRec,isHoliday,DayName,'morning');
            }
            if(shift.Is_Long_Afternoon__c && shift.Do_you_want_to_set_this_Recurring_Roster__c==true ){
               shift.Long_Afternoon_Start_Date_One__c=shift.Is_Long_Afternoon_Next_Day_Start__c ==false?shift.Date__c :shift.Date__c.adddays(1);
                string  DayName=DateTime.newInstance(shift.Long_Afternoon_Start_Date_One__c, Time.newInstance(0, 0, 0, 0)).format('EEEE');
                String shiftKey = shift.Long_Afternoon_Start_Date_One__c.format() + '-' + fullState.trim();
                Boolean isHoliday = dateStateKeys.contains(shiftKey);
                shift.Long_Afternoon_Hourly_Rate__c=ReturnStaffRates(staff,roleRec,isHoliday,DayName,'afternoon');
            }
            if(shift.Is_Long_Night_Shift__c && shift.Do_you_want_to_set_this_Recurring_Roster__c==true ){
               shift.Long_Night_Start_Date__c=shift.Is_Long_Night_Start_Next_Day__c ==false?shift.Date__c :shift.Date__c.adddays(1);
                string  DayName=DateTime.newInstance(shift.Long_Night_Start_Date__c, Time.newInstance(0, 0, 0, 0)).format('EEEE');
                String shiftKey = shift.Long_Night_Start_Date__c.format() + '-' + fullState.trim();
                Boolean isHoliday = dateStateKeys.contains(shiftKey);
                shift.Long_Night_Hourly_Rate__c=ReturnStaffRates(staff,roleRec,isHoliday,DayName,'night');
            }
            if(shift.Is_long_Morning_Shift_two__c && shift.Do_you_want_to_set_this_Recurring_Roster__c==true ){
               shift.Long_Morning_Start_Date_Two__c=shift.Is_Long_Morning_Next_Day_Start_Two__c ==false?shift.Date__c :shift.Date__c.adddays(1);
                string  DayName=DateTime.newInstance(shift.Long_Morning_Start_Date_Two__c, Time.newInstance(0, 0, 0, 0)).format('EEEE');
                String shiftKey = shift.Long_Morning_Start_Date_Two__c.format() + '-' + fullState.trim();
                Boolean isHoliday = dateStateKeys.contains(shiftKey);
                shift.Long_Morning_Rate_Two__c=ReturnStaffRates(staff,roleRec,isHoliday,DayName,'morning');
            }
             if(shift.Is_Long_afternoon_shift_two__c && shift.Do_you_want_to_set_this_Recurring_Roster__c==true ){
               shift.Long_Afternoon_Start_Date_Two__c=shift.Is_long_Morning_Next_Day_Start__c ==false?shift.Date__c :shift.Date__c.adddays(1);
                string  DayName=DateTime.newInstance(shift.Long_Afternoon_Start_Date_Two__c, Time.newInstance(0, 0, 0, 0)).format('EEEE');
                String shiftKey = shift.Long_Morning_Start_Date_One__c.format() + '-' + fullState.trim();
                Boolean isHoliday = dateStateKeys.contains(shiftKey);
                shift.Long_Afternoon_Rate_Two__c=ReturnStaffRates(staff,roleRec,isHoliday,DayName,'afternoon');
            }
        }
    }
    
    public static void deleteServices(List<ShiftwithStaff__c> shiftList){
        system.debug('in delete method  ');
        List<string> shiftID = New List<string>();
        
        for(ShiftwithStaff__c newss : shiftList){
            shiftID.add(newss.Id);  
        }
        
        system.debug('in delete method shift id   ' +shiftID); 
        list<Services_and_Support_Plan__c> servicesList= new list<Services_and_Support_Plan__c>();
        if(shiftID.size()>0){
            servicesList =[select id from Services_and_Support_Plan__c where ShiftwithStaff__c in:shiftID ];
        }
        system.debug('servicesList ' +servicesList);
        if(servicesList.size()>0){
            delete servicesList; 
        }       
    }
    
   public static void updaterelatedshift(List<ShiftwithStaff__c> deletedShifts) {

            // 1️⃣ Collect Split Shift Reference Ids from deleted records
            Set<String> splitShiftRefIds = new Set<String>();

            for (ShiftwithStaff__c shift : deletedShifts) {
                if (shift.Split_Shift_RefId__c != null) {
                    splitShiftRefIds.add(shift.Split_Shift_RefId__c);
                }
            }
			system.debug('splitShiftRefIds ' +splitShiftRefIds);
            // Nothing to process
            if (splitShiftRefIds.isEmpty()) {
                return;
            }

            // 2️⃣ Query remaining split shifts ordered by Index
            List<ShiftwithStaff__c> relatedShifts = [
                SELECT Id, Split_Shift_RefId__c, Index__c,New_Split_Shift__c,Broken_Shift__c
                FROM ShiftwithStaff__c
                WHERE Split_Shift_RefId__c IN:splitShiftRefIds
                AND  (New_Split_Shift__c = true OR  Broken_Shift__c =true)
                ORDER BY Split_Shift_RefId__c, Index__c
            ];
       	system.debug('relatedShifts ' +relatedShifts);

            // 3️⃣ Group by Split_Shift_RefId__c
            Map<String, List<ShiftwithStaff__c>> shiftsByRefId =
                new Map<String, List<ShiftwithStaff__c>>();

            for (ShiftwithStaff__c shift : relatedShifts) {

                String refId = shift.Split_Shift_RefId__c;

                if (!shiftsByRefId.containsKey(refId)) {
                    shiftsByRefId.put(refId, new List<ShiftwithStaff__c>());
                }

                shiftsByRefId.get(refId).add(shift);
            }
  	     system.debug('shiftsByRefId ' +shiftsByRefId);

            // 4️⃣ Re-index remaining shifts
            List<ShiftwithStaff__c> shiftsToUpdate = new List<ShiftwithStaff__c>();

            for (List<ShiftwithStaff__c> groupList : shiftsByRefId.values()) {

                // ✅ If ONLY one shift remains → unsplit it
                if (groupList.size() == 1) {
            
                    ShiftwithStaff__c shift = groupList[0];
            
                    shift.Index__c = 0;
                    shift.New_Split_Shift__c = false;
                    shift.Broken_Shift__c = false;
                    shiftsToUpdate.add(shift);
                    continue;
                }
            
                // 🔁 More than one shift → reindex only
                Integer newIndex = 0;
            
                for (ShiftwithStaff__c shift : groupList) {
            
                    if (shift.Index__c != newIndex) {
                        shift.Index__c = newIndex;
                        shiftsToUpdate.add(shift);
                    }
            
                    newIndex++;
                }
            }

            // 5️⃣ Update only when required
            if (!shiftsToUpdate.isEmpty()) {
                update shiftsToUpdate;
            }
    }

    public static StaffRole__c getMatchedRole(Staff__c staff, String roleName) {
        if (String.isBlank(roleName) || staff.StaffRoles__r == null || staff.StaffRoles__r.isEmpty()) {
            return null;
        }
        
        for (StaffRole__c role : staff.StaffRoles__r) {
            if (role.RoleName__c != null && String.valueOf(role.RoleName__c).trim().equalsIgnoreCase(String.valueOf(roleName).trim())) {
                return role;
            }
        }
        return null;
    }
    public static Decimal ReturnStaffRates(Staff__c staff, StaffRole__c roleRec, Boolean IsHoliday, String DayName, String shiftType) {
        Decimal rate = 0;
        DayName = DayName.toLowerCase();
        
        if (IsHoliday) {
            rate = roleRec != null ? roleRec.Public_Holiday_Hourly_Rate__c : staff.Public_holiday_Hourly_Rate__c;
        } else {
            switch on DayName {
                when 'saturday' {
                    rate = roleRec != null ? roleRec.Saturday_Hourly_Rate__c : staff.Saturday_Hourly_Rate__c;
                }
                when 'sunday' {
                    rate = roleRec != null ? roleRec.Sunday_Hourly_Rate__c : staff.Sunday_Hourly_Rate__c;
                }
                when else {
                    switch on shiftType {
                        when 'morning' {
                            rate = roleRec != null ? (roleRec.Hourly_Rate__c != null ? roleRec.Hourly_Rate__c : 0) 
                                : (staff.Working_Hours_Rate__c != null ? staff.Working_Hours_Rate__c : 0);
                                    }
                        when 'night' {
                            rate = roleRec != null ? roleRec.Night_Shift_Hourly_Rate__c : staff.Night_shift_Hourly_Rate__c;
                        }
                        when 'afternoon' {
                            rate = roleRec != null ? roleRec.Afternoon_Shift_Hourly_Rate__c : staff.Afternoon_shift_Hourly_Rate__c;
                        }
                    }
                }
            }
        }
        
        return rate != null ? rate : 0;
    }

       public class OTResult {
        public Decimal totalOT = 0;
        public Decimal tier1 = 0;
        public Decimal tier2 = 0;
        public Decimal ordinaryHours = 0;
        public Decimal removedHours =0;
    }

   public static OTResult calculateOvertime(
    ShiftwithStaff__c ss,
    String employmentType,
    List<ShiftwithStaff__c> weekShifts,
    StaffRole__c roleRec

){
    OTResult result = new OTResult();

    System.debug('===== SCHADS OT START =====');
   if (roleRec == null ||  (roleRec.Category_Type__c != 'Social and community services employee' &&  roleRec.Category_Type__c != 'Home care employee-Disability care')) {
     return result;
   }

   if (ss.Public_holiday__c == true ||   (ss.Shift_Day_Name__c != null && ss.Shift_Day_Name__c.equalsIgnoreCase('Sunday'))) {

    System.debug('Skipping OT calculation - Public Holiday / Sunday');
    return result;
   }

    // =========================
    // STEP 0: ACTUAL HOURS
    // =========================
    Decimal totalWorkedHours = 0;

    if(ss.Final_Login_DateTime__c != null && ss.Final_Logout_DateTime__c != null){
        Decimal millis =
            ss.Final_Logout_DateTime__c.getTime() -
            ss.Final_Login_DateTime__c.getTime();

        totalWorkedHours = (millis / (1000 * 60 * 60)).setScale(2);
    }

    if(totalWorkedHours <= 0){
        return result;
    }

    // =========================
    // STEP 0.5: BREAK RULE
    // =========================
    Decimal breakOT = 0;

    ShiftwithStaff__c prevShift;
    DateTime latestEndTime;

    for(ShiftwithStaff__c sh : weekShifts){

    if(sh.Final_Logout_DateTime__c != null &&
        ss.Final_Login_DateTime__c != null &&
        sh.Final_Logout_DateTime__c < ss.Final_Login_DateTime__c){

        if(latestEndTime == null ||
            sh.Final_Logout_DateTime__c > latestEndTime){

            latestEndTime = sh.Final_Logout_DateTime__c;
            prevShift = sh;
        }
    }
    }

    // =========================
    // STEP 0.6: SLEEPOVER ACTIVE WORK OT
    // =========================
    Decimal sleepoverOT = 0;

    if(ss.Shift_Category__c != null &&
        ss.Shift_Category__c.equalsIgnoreCase('Sleepover Shift') &&
        ss.Sleepover_Night_Shift_hours__c != null){

            sleepoverOT = ss.Sleepover_Night_Shift_hours__c;

            // Safety cap
            if(sleepoverOT > totalWorkedHours){
                sleepoverOT = totalWorkedHours;
            }

            System.debug('Sleepover Active OT: ' + sleepoverOT);
    }

    if(prevShift != null){

        Decimal gapHours =
            (ss.Final_Login_DateTime__c.getTime() -
             prevShift.Final_Logout_DateTime__c.getTime())
            / (1000 * 60 * 60);

        if(gapHours < 10 && gapHours >= 0){
            breakOT = 10 - gapHours;
        }
    }

    // =========================
    // STEP 1: DAILY OT
    // ========================
    Decimal remainingAfterBreak = totalWorkedHours - (breakOT + sleepoverOT);

if(remainingAfterBreak < 0) remainingAfterBreak = 0;
    if(remainingAfterBreak < 0) remainingAfterBreak = 0;

    Decimal dailyOT = 0;
    Decimal ordinaryAfterDaily = remainingAfterBreak;

    if(remainingAfterBreak > 10){
        dailyOT = remainingAfterBreak - 10;
        ordinaryAfterDaily = 10;
    }

    // =========================
    // STEP 2: ROSTER OT
    // =========================
    Decimal plannedHours = 0;

    if(ss.Shift_Start_Time__c != null && ss.Shift_End_Time__c != null){

        DateTime plannedStart =
            DateTime.newInstance(ss.Start_Date__c, ss.Shift_Start_Time__c);

        DateTime plannedEnd =
            DateTime.newInstance(ss.Shift_End_Date__c, ss.Shift_End_Time__c);

        Decimal millis =
            plannedEnd.getTime() - plannedStart.getTime();

        plannedHours = (millis / (1000 * 60 * 60)).setScale(2);
    }

    Decimal rosterOT = 0;

    if(employmentType != 'Casual'){
        if(ordinaryAfterDaily > plannedHours){
            rosterOT = ordinaryAfterDaily - plannedHours;
            ordinaryAfterDaily = plannedHours;
        }
    }

    // =========================
    // STEP 3: WEEKLY OT
    // =========================
    Decimal weeklyWorked = 0;

    for(ShiftwithStaff__c sh : weekShifts){

   if(sh.Id != ss.Id){

        Decimal ordinary = sh.Actual_Duration__c != null ? sh.Actual_Duration__c : 0;
        Decimal ot       = sh.Removed_Duration__c != null ? sh.Removed_Duration__c : 0;

        Decimal totalHours = ordinary + ot;

        weeklyWorked += totalHours;


        // ✅ Add sleepover active work separately
        if(sh.Shift_Category__c != null &&
           sh.Shift_Category__c.equalsIgnoreCase('Sleepover Shift') &&
           sh.Sleepover_Night_Shift_hours__c != null){

            weeklyWorked += sh.Sleepover_Night_Shift_hours__c;
        }
    }
}
     Decimal weeklyLimit = Decimal.valueOf(Label.Over_Time_Set_Hours);
  
        if(employmentType == 'Part-time' &&
        roleRec.StaffRole_To_Staff__r != null &&
        roleRec.StaffRole_To_Staff__r.Set_Hours__c != null){

            weeklyLimit = roleRec.StaffRole_To_Staff__r.Set_Hours__c;
        }
        

        // 🔥 KEY CONDITION: Already exceeded BEFORE this shift
        if(weeklyWorked >= weeklyLimit){

            System.debug('🔥 Weekly already exceeded BEFORE shift → All hours OT');

            Decimal totalOT = totalWorkedHours;

            // Tier logic
            Integer tierLimit = 2;

            if(roleRec.Category_Type__c != null &&
            roleRec.Category_Type__c.equalsIgnoreCase('Social and community services employee')){
                tierLimit = 3;
            }

            Decimal tier1 = Math.min(totalOT, tierLimit);
            Decimal tier2 = totalOT - tier1;

            result.totalOT = totalOT.setScale(2);
            result.tier1   = tier1.setScale(2);
            result.tier2   = tier2.setScale(2);
            result.ordinaryHours = 0;

            // Removed duration = full shift
            result.removedHours = totalOT.setScale(2);

            return result; // 🔥 EXIT EARLY (VERY IMPORTANT)
        }

        Decimal weeklyOT = 0;

        Decimal totalAfterShift = weeklyWorked + totalWorkedHours;

        if(totalAfterShift > weeklyLimit){

            Decimal excess = totalAfterShift - weeklyLimit;

            // Only remaining hours can become weekly OT
            Decimal availableForWeekly =
                totalWorkedHours - (breakOT + dailyOT + rosterOT);

            if(availableForWeekly < 0) availableForWeekly = 0;

            weeklyOT = Math.min(excess, availableForWeekly);
        }

    // =========================
    // STEP 4: TOTAL OT
    // =========================
    Decimal totalOT = breakOT + sleepoverOT + dailyOT + rosterOT + weeklyOT;

    if(totalOT > totalWorkedHours){
        totalOT = totalWorkedHours;
    }

    // =========================
    // STEP 5: TIERS
    // =========================
    
    Integer tierLimit = 2;

    if(roleRec.Category_Type__c != null &&
       roleRec.Category_Type__c.equalsIgnoreCase('Social and community services employee')){
        tierLimit = 3;
    }

    Decimal tier1 = 0;
    Decimal tier2 = 0;

    if(totalOT <= tierLimit){
        tier1 = totalOT;
    } else {
        tier1 = tierLimit;
        tier2 = totalOT - tierLimit;
    }

    // =========================
    // STEP 6: ORDINARY
    // =========================
    Decimal ordinary = totalWorkedHours - totalOT;
    if(ordinary < 0) ordinary = 0;

    // =========================
    // STEP 7: REMOVED DURATION (for UI sync)
    // =========================
    Decimal removedDuration = totalWorkedHours - ordinary;

    if(removedDuration < 0){
      removedDuration = 0;
    }

    result.removedHours = removedDuration.setScale(2);

    // =========================
    // RESULT
    // =========================
    result.totalOT       = totalOT.setScale(2);
    result.tier1         = tier1.setScale(2);
    result.tier2         = tier2.setScale(2);
    result.ordinaryHours = ordinary.setScale(2);

    System.debug('===== SCHADS OT END =====');

    return result;
}
    
    
}