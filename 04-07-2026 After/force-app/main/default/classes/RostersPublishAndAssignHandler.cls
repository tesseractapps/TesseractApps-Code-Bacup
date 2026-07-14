public with sharing class RostersPublishAndAssignHandler {
   @AuraEnabled
    public static Map<String, Object> rosterPublish(string addshiftData,string startdate, string enddate,list<string>facilityVal, List<Id> selectedStaffIds){
        system.debug('selectedStaffIds >>'+ selectedStaffIds);
        Map<String, Object> response = new Map<String, Object>();
        try {
            List<Add_Shift__c> addShiftList = new List<Add_Shift__c>();
            RosterCreation.addShiftWrapper addShift = (RosterCreation.addShiftWrapper) System.JSON.deserialize(addshiftData, RosterCreation.addShiftWrapper.class);
            RosterAddShiftService.RosterServiceHandler rsh = new RosterAddShiftService.RosterServiceHandler();
            rsh.SplitShift=false;
            Add_Shift__c shift = RosterCreation.createShift(addShift,rsh,false);
            shift.Quantity__c=addShift.shiftDetails.AddShiftQuantity;
            shift.Public_holiday__c=addShift.shiftDetails.AddShiftHoliday;
            shift.Service_Details__c = addShift.shiftDetails.selectedServiceInfoJson;
            shift.EOI_Staff__c = selectedStaffIds != null && !selectedStaffIds.isEmpty() ? String.join(selectedStaffIds, ',') : null;
            shift.Id= addShift.shiftDetails.AddShiftId;
            addShiftList.add(shift);
            if (!addShiftList.isEmpty()) {
                if(addShift.shiftDetails.AddShiftId ==null){
                     insert addShiftList;
                }else{
                    update addShiftList;
                }
                response.put('isSuccess', true);
                response.put('shift message', 'Shifts created successfully.');
                response.put('shiftid', addShiftList[0].Id);
                string role='All';
                list<Add_Shift__c> newShiftList=[Select id,Name,Direction__r.Name,Date__c,Quantity__c,Allocated__c,Facility__c,Un_Allocated__c,Start_Date__c,Send_Notification__c,Get_Facility__c,Service_Details__c,
                                          End_Date__c,Start_Time__c,End_Time__c,Facility_Name__c,Break__c,Duration__c,role__c,Shift_Start_End_Time__c,Public_holiday__c,Shift_Name__c,Facility__r.Shift_Penalty_Mode__c,
                                          Location__Street__s,Location__City__s,Location__CountryCode__s,Location__StateCode__s,Location__PostalCode__s,Location__Latitude__s,Location__Longitude__s,End_time_picklist__c,Start_Time_Text__c,End_Time_Text__c,Participant_Address_checkbox__c,
                                          Start_time_picklist__c,Is_EOI__c,EOI_Staff__c,Shift_Type__c,Day_Name__c,Shift_Notes__c from Add_Shift__c where Id=: addShiftList[0].Id ];
                string staffList=getStaffHourlyRates(newShiftList,startdate,enddate,facilityVal);
                response.put('staffHourlyRates', staffList);
            }
        } catch (Exception e) {
            // Set failure response
            response.put('isSuccess', false);
            response.put('message', 'Failed to create shifts: ' + e.getMessage());
            System.debug('Error: ' + e.getMessage());
        }
        // Return response as JSON
        return response;
    }
 @AuraEnabled 
 public static string  getStaffHourlyRates(List<Add_Shift__c> addShiftList,string startdate, string enddate,list<string>facilityVal) {
     
        list<string> fac=facilityVal;
     	system.debug('fac ' +fac);
        List<StaffWrapper> finalStaffList = new List<StaffWrapper>();
    
        try {
            // Debugging input list
            System.debug('addShiftList: ' + addShiftList);
        List<Staff__c> stafflist = new List<Staff__c>();
			  string Role;
            Role= addShiftList[0].Role__c;
            Date shiftEndDate;
            if(addShiftList[0].End_Date__c == null ){
                if (addShiftList[0].Shift_Type__c == 'Night' || addShiftList[0].Shift_Type__c == 'Sleepover Shift' || addShiftList[0].Shift_Type__c == 'Custom' ) {
                    System.debug('Entered Night/Sleepover/Custom block');
                    List<String> timeSplit = addShiftList[0].End_Time_Text__c.split(' ');
                    List<String> startTimeSplits = addShiftList[0].Start_Time_Text__c.split(' ');
                     System.debug('timeSplit ==> ' + timeSplit);
                     System.debug('startTimeSplits ==> ' + startTimeSplits);
                    if (timeSplit[1] == 'am' && (startTimeSplits[1] != 'am'   ||addShiftList[0].Shift_Type__c == 'Custom')) {
                         System.debug('Condition 1 matched -> Add 1 day');
                        shiftEndDate = addShiftList[0].Start_Date__c.addDays(1);
                    } else {
                        shiftEndDate = addShiftList[0].Start_Date__c;
                    }
                    if (timeSplit[1] == 'pm' && addShiftList[0].Shift_Type__c == 'Custom') {

                        Integer startTotalMinutes = addShiftList[0].Start_Time__c.hour() * 60 + addShiftList[0].Start_Time__c.minute();
                        Integer endTotalMinutes = addShiftList[0].End_Time__c.hour() * 60 + addShiftList[0].End_Time__c.minute();
                         System.debug('startTotalMinutes ==> ' + startTotalMinutes);
                          System.debug('endTotalMinutes ==> ' + endTotalMinutes);
                        if (startTotalMinutes > endTotalMinutes) {
                            shiftEndDate = addShiftList[0].Start_Date__c.addDays(1);
                        }
                    }
                } else {
                    shiftEndDate = addShiftList[0].Start_Date__c;
                }
            }else{
                shiftEndDate= addShiftList[0].End_Date__c;
            }
                    
            set<Id> rejectedStaffId= new Set <Id>();
            try {
                if (addShiftList[0].Is_EOI__c == true) {
                    stafflist = AddShiftController.getEOIStaff(Role,String.valueOf(addShiftList[0].Id));
                   system.debug('stafflist ==>'+stafflist);
                  
                } else {

                    System.debug('===== BEFORE getAvailableStaffforRosterManager =====');
                    System.debug('Role ==> ' + Role);
                    System.debug('Start Date ==> ' + addShiftList[0].Start_Date__c);
                    System.debug('Shift End Date ==> ' + shiftEndDate);
                    System.debug('Start Time ==> ' + addShiftList[0].Start_Time__c);
                    System.debug('End Time ==> ' + addShiftList[0].End_Time__c);
                    System.debug('Shift Type ==> ' + addShiftList[0].Shift_Type__c);
                    System.debug('End Date Field ==> ' + addShiftList[0].End_Date__c);

                    stafflist = AddShiftController.getAvailableStaffforRosterManager(Role,addShiftList[0].Start_Date__c,shiftEndDate,addShiftList[0].Start_Time__c,addShiftList[0].End_Time__c);
                }
                   System.debug('stafflist size ==> ' + stafflist.size());
                   System.debug('stafflist ==> ' + stafflist);
               
            } catch (Exception e) {
                System.debug('Error fetching staff list: ' + e.getMessage());
                return e.getMessage();
            }
            Set<Id> staffIds = new Set<Id>();
            for (Staff__c ss : stafflist) {
                     staffIds.add(ss.Id);               
            }
               SYSTEM.DEBUG('staffIds 118'+staffIds);
             Map<Id,Decimal> weeklyHoursMap =AwardController.calculateWeeklyStaffHours( staffIds, addShiftList[0].Start_Date__c);
             SYSTEM.DEBUG('staffIds 120'+staffIds);
            Date sDate = Date.valueOf(startdate);
            Date eDate = Date.valueOf(enddate);
            list<ShiftwithStaff__c> staffOneWeekShifts=[select id,Staff__r.Email_Address__c,Staff__r.Name__c,Facility__c,Add_Shift__r.Start_Date__c ,Actual_Duration__c,End_Date__c,
                Shift_Type__c,Attendence__c,Staff__c,Date__c,Shift_Wage__c,
                Staff__r.Set_Hours__c,Duration__c
                from ShiftwithStaff__c where Add_Shift__r.Start_Date__c >=:sDate AND Add_Shift__r.Start_Date__c <=:eDate and Staff__c in:staffIds];
            SYSTEM.DEBUG('staffIds'+staffIds);
            map<id,decimal> staffHours= new map<id,decimal>();
                for (ShiftWithStaff__c shift : staffOneWeekShifts) {
                    if (!staffHours.containsKey(shift.Staff__c)) {
                        staffHours.put(shift.Staff__c,0);
                    }
                    staffHours.put(shift.Staff__c, staffHours.get(shift.Staff__c) +(shift.Duration__c != null ? shift.Duration__c : 0));
     
                }
             List<ShiftwithStaff__c> allPreviousShifts =new  List<ShiftwithStaff__c>();
            // Fetch all previous shifts in one query and store them in a map
            Map<Id, List<ShiftwithStaff__c>> staffShiftMap = new Map<Id, List<ShiftwithStaff__c>>();
            if (!staffIds.isEmpty()) {
               allPreviousShifts = [SELECT Id, Staff__c, Duration__c, Log_Out_Date_Time__c, Add_Shift__r.End_Date__c
                     FROM ShiftwithStaff__c
                     WHERE Staff__c IN :staffIds 
                     AND Add_Shift__c != :addShiftList[0].Id
                     AND (Date__c = :addShiftList[0].Start_Date__c 
                          OR Date__c = :addShiftList[0].Start_Date__c - 1)
                     ORDER BY CreatedDate DESC];                
                 system.debug(' previous shifts '+allPreviousShifts);
                
                // Group shifts by Staff ID
                for (ShiftwithStaff__c shift : allPreviousShifts) {
                    if (!staffShiftMap.containsKey(shift.Staff__c)) {
                        staffShiftMap.put(shift.Staff__c, new List<ShiftwithStaff__c>());
                    }
                    staffShiftMap.get(shift.Staff__c).add(shift);
                }
            }
    			Integer serialNumber = 1;
            for (Staff__c ss : stafflist) {
                try {
                    //system.debug(' fcaility contains '+facilityVal.contains(string.valueof(ss.Facility__c)));
                      Boolean hasActiveFacility = false;
                    System.debug('▶️ Processing Staff Id: ' + ss.Id);

						 System.debug('▶️ Staff_Facilities__r: ' + ss.Staff_Facilities__r);
                    if (ss.Staff_Facilities__r != null) {
                        for (Staff_Facility__c sf : ss.Staff_Facilities__r) {
                             System.debug('   Checking Facility Id: ' + sf.Facility__c);
                            if (facilityVal.contains(String.valueOf(sf.Facility__c))) {
                                hasActiveFacility = true;
                                break;
                            }
                        }
                    } else {
                     System.debug('   ❌ No related facilities');
                }

             System.debug('   Final hasActiveFacility = ' + hasActiveFacility);


                   if (hasActiveFacility ) {
            
                    StaffWrapper staff = new StaffWrapper();
                    List<ShiftwithStaff__c> shiftwithstaff = new List<ShiftwithStaff__c>();
                    List<AddShiftController.ShiftWithStaffWrapper> Eoishiftwithstaff = new List<AddShiftController.ShiftWithStaffWrapper>();
                    
                    // Assigning basic staff details with null checks
                    staff.Id = ss.Id;
                    staff.serialNumber = serialNumber; 
                    serialNumber++; // Increment serial number
                   // staff.fullName = (ss.Name != null ? ss.Name : '') + ' ' + (ss.Last_Name__c != null ? ss.Last_Name__c : '');
                     staff.fullName =ss.Display_Nickname__c;
                    staff.duration = (addShiftList[0].Duration__c != null) ? 
                                      addShiftList[0].Duration__c : 0;
                    staff.facilityname = (ss.Facility_Name__c != null) ? 
                                         ss.Facility_Name__c : 'Unknown';
                    staff.status = (ss.Status__c != null) ? ss.Status__c : false;
                    staff.activeOrInactive = (ss.Active_or_Non_Active__c != null) ? 
                                             ss.Active_or_Non_Active__c : 'Inactive';
                   /*  staff.role=ss.Role__c !=null ?ss.Role__c :''; */
                    List<String> roleNames = new List<String>();
                    System.debug('StaffRoles__r size: ' + (ss.StaffRoles__r != null ? ss.StaffRoles__r.size() : 0));
                      StaffRole__c matchedRole;
                    if (ss.StaffRoles__r != null && !ss.StaffRoles__r.isEmpty()) {
                            System.debug('Processing StaffRoles__r records:');
                            for (StaffRole__c staffRole : ss.StaffRoles__r) {
                                System.debug(' - StaffRole ID: ' + staffRole.Id);
                                System.debug('   RoleName__c: ' + staffRole.RoleName__c);
                                System.debug('   Active__c: ' + staffRole.Active__c);
                                
                                if (staffRole.RoleName__c != null && staffRole.Active__c) {
                                    roleNames.add(staffRole.RoleName__c);
                                    System.debug('   ✓ Added to roleNames: ' + staffRole.RoleName__c);
                                }
                                if (staffRole.RoleName__c == addShiftList[0].Role__c && staffRole.Active__c) {
                                    matchedRole = staffRole;
                                }
                            }
                        } else {
                            System.debug('No StaffRoles__r records found or list is null');
                        }
                    staff.role = roleNames!=null? String.join(roleNames, '; '):'';
                    // staff.ClassAndLevel=ss.Class_and_Paypont__c ;
                    if (matchedRole != null) {

                        String level = extractNumber(matchedRole.Classification_Level__c);
                        String payPoint = extractNumber(matchedRole.Classification_Pay_Point__c);

                        if (!String.isBlank(level) && !String.isBlank(payPoint)) {
                            staff.ClassAndLevel = level + '.' + payPoint;
                        } else {
                            staff.ClassAndLevel = '0';
                        }

                    } else {
                        staff.ClassAndLevel = '0';
                    }

                    staff.scr=ss.SCR__c != null ? ss.SCR__c.setScale(2, RoundingMode.HALF_UP) : 0.0.setScale(2, RoundingMode.HALF_UP);
     				staff.isDisable = (ss.Status__c == null ||ss.Status__c == false) ? true : false;
                    staff.setHoursIndicator= staffHours.get(ss.id) >ss.Set_Hours__c ?true:false;
                    staff.assignedHours=staffHours.get(ss.id) >0?staffHours.get(ss.id) :0;
                    // Determine hourly rate using switch statement for Day_Name__c
                        // Retrieve previous shifts from the pre-fetched map
                    Decimal totalHours = 0;
                    time lastLogouttime;
                    if (staffShiftMap.containsKey(ss.Id)) {
    
                        if (staffShiftMap.containsKey(ss.Id) && !staffShiftMap.get(ss.Id).isEmpty()) {
                            List<ShiftwithStaff__c> staffShifts = staffShiftMap.get(ss.Id);
                            
                            // Get the most recent shift for this staff
                            ShiftwithStaff__c lastShift = staffShifts[0]; // Since they are ordered by CreatedDate DESC
                            
                            if (lastShift.Log_Out_Date_Time__c != null) {
                                Date shiftDate = addShiftList[0].Start_Date__c;
                                DateTime newShiftStartDateTime = DateTime.newInstanceGmt(shiftDate, addShiftList[0].Start_Time__c);
                                DateTime prevShiftLogInDatetime = DateTime.newInstanceGmt(lastShift.Add_Shift__r.End_Date__c, lastShift.Log_Out_Date_Time__c);
                                
                                Decimal timeDifferenceInMillis = Decimal.valueOf(newShiftStartDateTime.getTime() - prevShiftLogInDatetime.getTime());
                                Decimal timeDifferenceInHours = timeDifferenceInMillis / (1000 * 60 * 60); // Convert to hours
                                
                                staff.twoShiftsDurationinHours = timeDifferenceInHours;
                                
                                if (timeDifferenceInHours < 0) {
                                    System.debug('Negative time difference detected! No fatigue.');
                                    staff.exceedsLimit = false;
                                } else if (timeDifferenceInHours <= 8) {
                                    staff.exceedsLimit = true;
                                }
                            }
                        }
                    }
                       Decimal workingRate = 0;
                       Decimal afternoonRate = 0;
                       Decimal nightRate = 0;
                       Decimal sleepoverAllowance = 0;
                       Decimal saturdayRate = 0;
                       Decimal sundayRate = 0;
                       Decimal publicHolidayRate = 0;
                       
                       // 🟦 Prefer StaffRole__c rate fields if match found
                       if (matchedRole != null) {
                           workingRate = matchedRole.Hourly_Rate__c;
                           afternoonRate = matchedRole.Afternoon_shift_Hourly_Rate__c;
                           nightRate = matchedRole.Night_shift_Hourly_Rate__c;
                           sleepoverAllowance = matchedRole.Sleepover_Allowance__c;
                           saturdayRate = matchedRole.Saturday_Hourly_Rate__c;
                           sundayRate = matchedRole.Sunday_Hourly_Rate__c;
                           publicHolidayRate = matchedRole.Public_holiday_Hourly_Rate__c;
                       }
                       if (addShiftList[0].Public_holiday__c) {

                            staff.Hourlyrate = (publicHolidayRate != null) ? publicHolidayRate : 0;

                            } else {

                                Boolean isSchads =
                                    addShiftList[0].Facility__r.Shift_Penalty_Mode__c == 'Schads';
                                    System.debug(' isSchads '+isSchads);

                                Boolean schadsApplied = false;

                               if ( isSchads &&  !new Set<String>{ 'Saturday', 'Sunday' }.contains(addShiftList[0].Day_Name__c) && ( addShiftList[0].Shift_Type__c !='Custom' || addShiftList[0].Shift_Type__c !='Sleepover Shift') ) {
                                Integer startMinutes =
                                    addShiftList[0].Start_Time__c.hour() * 60 +
                                    addShiftList[0].Start_Time__c.minute();

                                Integer endMinutes =
                                    addShiftList[0].End_Time__c.hour() * 60 +
                                    addShiftList[0].End_Time__c.minute();

                                Integer SIX_AM = 6 * 60;
                                Integer EIGHT_PM = 20 * 60;
                                Integer MIDNIGHT = 24 * 60;

                                System.debug('SCHADS CHECK');
                                System.debug('Day: ' + addShiftList[0].Day_Name__c);
                                System.debug('Start Minutes: ' + startMinutes);
                                System.debug('End Minutes: ' + endMinutes);
                                System.debug('SIX_AM: ' + SIX_AM);
                                System.debug('EIGHT_PM: ' + EIGHT_PM);
                                System.debug('MIDNIGHT: ' + MIDNIGHT);

                                // 🔴 Night
                                if (
                                    startMinutes < SIX_AM ||
                                    endMinutes <= startMinutes ||
                                    endMinutes >= MIDNIGHT
                                ) {
                                    staff.Hourlyrate = (nightRate != null) ? nightRate : 0;
                                    schadsApplied = true;

                                    System.debug('SCHADS APPLIED → NIGHT RATE: ' + staff.Hourlyrate);
                                }
                                // 🟠 Afternoon
                                else if (
                                    endMinutes >= EIGHT_PM &&
                                    endMinutes < MIDNIGHT
                                ) {
                                    staff.Hourlyrate = (afternoonRate != null) ? afternoonRate : 0;
                                    schadsApplied = true;

                                    System.debug('SCHADS APPLIED → AFTERNOON RATE: ' + staff.Hourlyrate);
                                }
                                else {
                                    System.debug('SCHADS CHECKED → NO RATE CHANGE');
                                }
                            }


                                // ⬇️ FALL BACK ONLY IF SCHADS DID NOT APPLY
                                if (!schadsApplied) {
                                    switch on addShiftList[0].Day_Name__c {
                                        when 'Saturday' {
                                            staff.Hourlyrate = (saturdayRate != null) ? saturdayRate : 0;
                                        }
                                        when 'Sunday' {
                                            staff.Hourlyrate = (sundayRate != null) ? sundayRate : 0;
                                        }
                                        when else {
                                            switch on addShiftList[0].Shift_Type__c {
                                                when 'General', 'Morning', 'Custom' {
                                                    staff.Hourlyrate = (workingRate != null) ? workingRate : 0;
                                                }
                                                when 'Afternoon' {
                                                    staff.Hourlyrate = (afternoonRate != null) ? afternoonRate : 0;
                                                }
                                                when 'Night' {
                                                    staff.Hourlyrate = (nightRate != null) ? nightRate : 0;
                                                }
                                                when 'Sleepover Shift' {
                                                    staff.Hourlyrate = (sleepoverAllowance != null)
                                                        ? sleepoverAllowance
                                                        : 0;
                                                }
                                                when else {
                                                    staff.Hourlyrate = (workingRate != null) ? workingRate : 0;
                                                }
                                            }
                                        }
                                    }
                                }
                            }


    
                    // Calculate shift wage
                    staff.shiftWage = (addShiftList[0].Shift_Type__c !='Sleepover Shift' ? staff.duration * staff.Hourlyrate : staff.Hourlyrate).setScale(2);
     				staff.duration=staff.duration.setScale(2, RoundingMode.HALF_UP) ;
                    staff.shiftId=addShiftList[0].Id;
                    staff.shiftDate=addShiftList[0].Start_Date__c;
                    staff.quantity=addShiftList[0].Quantity__c;
                    Decimal workedHours = weeklyHoursMap.containsKey(ss.Id)  ? weeklyHoursMap.get(ss.Id)  : 0;
                    Decimal setHours = ss.Set_Hours__c == null ? 0  : ss.Set_Hours__c;
                    staff.WeeklyHours = AwardController.formatHours(workedHours)+ '/'+ AwardController.formatHours(setHours);
                    if(ss.ShiftwithStaffs__r.size()>0){
                        for(ShiftwithStaff__c shiftstaff:ss.ShiftwithStaffs__r){
                            AddShiftController.ShiftWithStaffWrapper shift =new   AddShiftController.ShiftWithStaffWrapper();
                            shift.staffId=shiftstaff.Staff__c;
                            shift.id=shiftstaff.Id;
                            Eoishiftwithstaff.add(shift);
                        }  
                    }
                       
                    
                     staff.shiftwithstaff = Eoishiftwithstaff;
                    // Add staff to final list
                    finalStaffList.add(staff);
                     //  System.debug('Staff list: ' + finalStaffList);
                    }
                
                } catch (Exception e) {
                    System.debug('Error processing staff record: ' + ss.Id + ', Error: ' + e.getMessage());
                }
                
            }
        } catch (Exception e) {
            System.debug('Unexpected error: ' + e.getMessage());
        }
    		System.debug('Staff list: ' + finalStaffList);
        return JSON.serialize(finalStaffList);
 }
     @AuraEnabled
    public static void AssignShiftsInDrag(Decimal rate, String StaffId, String refId, String shiftId, String draggingShiftDate, String droppedShiftDate,string staffDateConflictsJson) {
        Date sDate = Date.valueOf(draggingShiftDate);
        Date eDate = Date.valueOf(droppedShiftDate);
        Integer numberOfDays = sDate.daysBetween(eDate);
        System.debug('numberOfDays: ' + numberOfDays);
        System.debug('refId '+refId);
          System.debug('shiftId '+shiftId);
        Staff__c staff = [SELECT Id, Public_holiday_Hourly_Rate__c, Saturday_Hourly_Rate__c, 
                          Sunday_Hourly_Rate__c, Working_Hours_Rate__c, Afternoon_shift_Hourly_Rate__c,
                          Night_shift_Hourly_Rate__c,Sleepover_Allowance__c ,(SELECT Id, RoleName__c,Afternoon_Shift_Hourly_Rate__c,Hourly_Rate__c,Night_Shift_Hourly_Rate__c,Public_Holiday_Hourly_Rate__c,Saturday_Hourly_Rate__c,Sleepover_Allowance__c,Sunday_Hourly_Rate__c, Active__c FROM StaffRoles__r WHERE Active__c = true)
                          ,(SELECT Id, From__c, To__c FROM Leaves__r) FROM Staff__c WHERE Id = :staffId LIMIT 1];
        List<Date[]> staffLeaveRanges = new List<Date[]>();
       
     
        // Get the list of shifts to reassign
        List<ShiftwithStaff__c> shiftsList = new List<ShiftwithStaff__c>();
        if (!String.isEmpty(refId)) {
            
            shiftsList = [SELECT Id,Role__c, Staff__c, Add_Shift__c, Staff_Final_Hourly_Rate__c, Date__c, Start_Time__c,Shift_Start_Time__c,Shift_End_Time__c,Start_Date__c,Shift_End_Date__c, End_Date__c, End_Time__c,Is_long_Morning__c,Long_Morning_Start_Date_One__c,Is_long_Morning_Next_Day_Start__c,Long_Morning_Hourly_Rate__c,Public_holiday__c,Recur_Holiday__c,Day_Name__c,Is_Long_Night_Shift__c,Is_Long_Night_Start_Next_Day__c,
                          Is_Long_Afternoon__c,Long_Afternoon_Start_Date_One__c,Is_Long_Afternoon_Next_Day_Start__c,Long_Afternoon_Hourly_Rate__c,Is_long_Morning_Shift_two__c,Is_Long_Morning_Next_Day_Start_Two__c,Long_Morning_Start_Date_Two__c,Long_Morning_Rate_Two__c,Is_Long_afternoon_shift_two__c,Long_Afternoon_Start_Date_Two__c,Long_Afternoon_Rate_Two__c,(SELECT Id, Service_Users__c FROM Services_and_Support_Plans__r) FROM ShiftwithStaff__c WHERE RefId__c = :refId AND Date__c >= :sDate];
        } else if (!String.isEmpty(shiftId)) {
            shiftsList = [
                SELECT Id, Staff__c, Add_Shift__c,Role__c, Staff_Final_Hourly_Rate__c, Date__c, Start_Time__c, End_Date__c,Shift_Start_Time__c,Shift_End_Time__c,Start_Date__c,Shift_End_Date__c, End_Time__c,Is_long_Morning__c,Long_Morning_Start_Date_One__c,Is_long_Morning_Next_Day_Start__c,Long_Morning_Hourly_Rate__c,Public_holiday__c,Recur_Holiday__c,Day_Name__c,Is_Long_Night_Shift__c,Is_Long_Night_Start_Next_Day__c,
                          Is_Long_Afternoon__c,Long_Afternoon_Start_Date_One__c,Is_Long_Afternoon_Next_Day_Start__c,Long_Afternoon_Hourly_Rate__c,Is_long_Morning_Shift_two__c,Is_Long_Morning_Next_Day_Start_Two__c,Long_Morning_Start_Date_Two__c,Long_Morning_Rate_Two__c,Is_Long_afternoon_shift_two__c,Long_Afternoon_Start_Date_Two__c,Long_Afternoon_Rate_Two__c,
                (SELECT Id, Service_Users__c FROM Services_and_Support_Plans__r)
                FROM ShiftwithStaff__c
                WHERE Id = :shiftId
            ];
        }
        
        List<ShiftwithStaff__c> shiftsToUpdate = new List<ShiftwithStaff__c>();
        List<Id> addShiftList = new List<Id>();
        List<Services_and_Support_Plan__c> servList = new List<Services_and_Support_Plan__c>();
        List<RosterCreationVersionTwo.StaffConflictWrapper> staffConflicts ;
        Map<String, Set<Date>> staffConflictDatesMap = new Map<String, Set<Date>>();
            string baseRefId = String.valueOf(DateTime.now().getTime());
         
        if (String.isNotBlank(staffDateConflictsJson)) {
            
               staffConflicts = (List<RosterCreationVersionTwo.StaffConflictWrapper>) JSON.deserialize(staffDateConflictsJson,   List<RosterCreationVersionTwo.StaffConflictWrapper>.class);
                 if (staffConflicts != null && !staffConflicts.isEmpty()) {
                for (RosterCreationVersionTwo.StaffConflictWrapper conflict : staffConflicts) {
                    if (conflict != null && String.isNotBlank(conflict.staffId) && conflict.conflictDates != null) {
                        Set<Date> conflictDates = new Set<Date>();
                        for (RosterCreationVersionTwo.ConflictDateWrapper cd : conflict.conflictDates) {
                            if (cd != null && String.isNotBlank(cd.dateString)) {  // Changed to dateString
                                    conflictDates.add(Date.valueOf(cd.dateString));  // Changed to dateString
                                
                            }
                        }
                        staffConflictDatesMap.put(conflict.staffId, conflictDates);
                    }
                }
            }
        }
         String uniqueRefId;
            
        uniqueRefId =StaffId + '_' + baseRefId;
        
        for (ShiftwithStaff__c ss : shiftsList) {
            Date newShiftDate = ss.Start_Date__c.addDays(numberOfDays);
            Date newEndDate = ss.Shift_End_Date__c != null 
                ? ss.Shift_End_Date__c.addDays(numberOfDays) 
                : null;
            Boolean hasConflict = staffConflictDatesMap.containsKey(StaffId) && 
                staffConflictDatesMap.get(StaffId).contains(newShiftDate);
            
            if (hasConflict) {
                System.debug('Skipping staff: ' + StaffId + ' for date: ' + newShiftDate);
                continue;
            }
        
             StaffRole__c matchedRole;
              if (staff.StaffRoles__r != null && !staff.StaffRoles__r.isEmpty()) {
                            System.debug('Processing StaffRoles__r records:');
                            for (StaffRole__c staffRole : staff.StaffRoles__r) {
                                System.debug(' - StaffRole ID: ' + staffRole.Id);
                                System.debug('   RoleName__c: ' + staffRole.RoleName__c);
                                System.debug('   Active__c: ' + staffRole.Active__c);
                                
      
                                if (staffRole.RoleName__c == ss.Role__c && staffRole.Active__c) {
                                    matchedRole = staffRole;
                                }
                       }
              }

     
            if (ss.Is_long_Morning__c) {
                Boolean isHoliday = ss.Public_holiday__c == true || ss.Recur_Holiday__c == true ? true : false;
                System.debug('Entering long morning shift block.');
                System.debug('isHoliday: ' + isHoliday);
                
                ss.Long_Morning_Start_Date_One__c = ss.Is_long_Morning_Next_Day_Start__c == false ? ss.Date__c.adddays(numberOfDays) : ss.Date__c.adddays(numberOfDays +1);
                System.debug('Long_Morning_Start_Date_One__c: ' + ss.Long_Morning_Start_Date_One__c);
                string rowStartDay = DateTime.newInstance(ss.Long_Morning_Start_Date_One__c, Time.newInstance(0, 0, 0, 0)).format('EEEE');
                System.debug('Day name: ' + rowStartDay);
                
                ss.Long_Morning_Hourly_Rate__c = CustomShiftsValidations.calculateHourlyRate(staff,matchedRole, 'Morning', rowStartDay, isHoliday);
                System.debug('Long_Morning_Hourly_Rate__c: ' + ss.Long_Morning_Hourly_Rate__c);
            }
            
            if (ss.Is_Long_Afternoon__c) {
                Boolean isHoliday = ss.Public_holiday__c == true || ss.Recur_Holiday__c == true ? true : false;
                System.debug('Entering long afternoon shift block.');
                System.debug('isHoliday: ' + isHoliday);
                
                ss.Long_Afternoon_Start_Date_One__c = ss.Is_Long_Afternoon_Next_Day_Start__c == false ? ss.Date__c.adddays(numberOfDays) : ss.Date__c.adddays(numberOfDays +1);
                System.debug('Long_Afternoon_Start_Date_One__c: ' + ss.Long_Afternoon_Start_Date_One__c);
                string rowStartDay = DateTime.newInstance(ss.Long_Afternoon_Start_Date_One__c, Time.newInstance(0, 0, 0, 0)).format('EEEE');
                System.debug('Day name: ' + rowStartDay);
                
                ss.Long_Afternoon_Hourly_Rate__c = CustomShiftsValidations.calculateHourlyRate(staff, matchedRole,'Afternoon', rowStartDay, isHoliday);
                System.debug('Long_Afternoon_Hourly_Rate__c: ' + ss.Long_Afternoon_Hourly_Rate__c);
            }
            
            if (ss.Is_Long_Night_Shift__c) {
                Boolean isHoliday = ss.Public_holiday__c == true || ss.Recur_Holiday__c == true ? true : false;
                System.debug('Entering long night shift block.');
                System.debug('isHoliday: ' + isHoliday);
                
                ss.Long_Night_Start_Date__c = ss.Is_Long_Night_Start_Next_Day__c == false ? ss.Date__c.adddays(numberOfDays) : ss.Date__c.adddays(numberOfDays +1);
                System.debug('Long_Night_Start_Date__c: ' + ss.Long_Night_Start_Date__c);
                string rowStartDay = DateTime.newInstance(ss.Long_Night_Start_Date__c, Time.newInstance(0, 0, 0, 0)).format('EEEE');
                System.debug('Day name: ' + rowStartDay);
                
                ss.Long_Night_Hourly_Rate__c = CustomShiftsValidations.calculateHourlyRate(staff, matchedRole,'Night', rowStartDay, isHoliday);
                System.debug('Long_Night_Hourly_Rate__c: ' + ss.Long_Night_Hourly_Rate__c);
            }
            
            if (ss.Is_long_Morning_Shift_two__c) {
                Boolean isHoliday = ss.Public_holiday__c == true || ss.Recur_Holiday__c == true ? true : false;
                System.debug('Entering long morning shift two block.');
                System.debug('isHoliday: ' + isHoliday);
                
                ss.Long_Morning_Start_Date_Two__c = ss.Is_Long_Morning_Next_Day_Start_Two__c == false ? ss.Date__c.adddays(numberOfDays) : ss.Date__c.adddays(numberOfDays +1);
                System.debug('Long_Morning_Start_Date_Two__c: ' + ss.Long_Morning_Start_Date_Two__c);
               string rowStartDay = DateTime.newInstance(ss.Long_Morning_Start_Date_Two__c, Time.newInstance(0, 0, 0, 0)).format('EEEE');
                System.debug('Day name: ' + rowStartDay);
                
                ss.Long_Morning_Rate_Two__c = CustomShiftsValidations.calculateHourlyRate(staff, matchedRole,'Morning', rowStartDay, isHoliday);
                System.debug('Long_Morning_Rate_Two__c: ' + ss.Long_Morning_Rate_Two__c);
            }
            
            if (ss.Is_Long_afternoon_shift_two__c) {
                Boolean isHoliday = ss.Public_holiday__c == true || ss.Recur_Holiday__c == true ? true : false;
                System.debug('Entering long afternoon shift two block.');
                System.debug('isHoliday: ' + isHoliday);
                
                ss.Long_Afternoon_Start_Date_Two__c = ss.Is_long_Morning_Next_Day_Start__c == false ? ss.Date__c.adddays(numberOfDays) : ss.Date__c.adddays(numberOfDays +1);
                string rowStartDay = DateTime.newInstance(ss.Long_Afternoon_Start_Date_Two__c, Time.newInstance(0, 0, 0, 0)).format('EEEE');
                System.debug('Day name: ' + rowStartDay);
                
                ss.Long_Afternoon_Rate_Two__c = CustomShiftsValidations.calculateHourlyRate(staff,matchedRole, 'Afternoon', rowStartDay, isHoliday);
                System.debug('Long_Afternoon_Rate_Two__c: ' + ss.Long_Afternoon_Rate_Two__c);
            }

            // Safe to reassign
            ss.Staff__c = StaffId;
            ss.Is_Auto_Schedule_Shift__c=true;
            ss.Is_Published_Shifts__c=false;
            ss.Staff_Final_Hourly_Rate__c = rate;
            ss.Start_Date__c=newShiftDate;
            ss.Shift_End_Date__c=newEndDate; 
            ss.RefId__c= uniqueRefId;
            shiftsToUpdate.add(ss);
            addShiftList.add(ss.Add_Shift__c);
            
           if (ss.Services_and_Support_Plans__r != null) {
            for (Services_and_Support_Plan__c sp : ss.Services_and_Support_Plans__r) {
                
                // Push same shifted date to child
                sp.Date_of_Service__c = newShiftDate;
                
                // Existing logic
                sp.Service_Users__c = StaffId;
                
                servList.add(sp);
            }
        }
        
        }
        
        // Update shift records
        if (!shiftsToUpdate.isEmpty()) {
            update shiftsToUpdate;
        }
        
        // Update support plans
        for (Services_and_Support_Plan__c serv : servList) {
            serv.Service_Users__c = StaffId;
            
        }
        
        if (!servList.isEmpty()) {
            update servList;
        }
        
        // Shift Add_Shift__c dates forward
        if (!addShiftList.isEmpty()) {
            List<Add_Shift__c> shiftsToUpdateDates = new List<Add_Shift__c>();
            
            List<Add_Shift__c> addShiftRecords = [
                SELECT Id, Start_Date__c
                FROM Add_Shift__c
                WHERE Id IN :addShiftList
            ];
            
            for (Add_Shift__c shift : addShiftRecords) {
                if (shift.Start_Date__c != null) {
                    shift.Start_Date__c = shift.Start_Date__c.addDays(numberOfDays);
                    shiftsToUpdateDates.add(shift);
                }
            }
            
            if (!shiftsToUpdateDates.isEmpty()) {
              //  update shiftsToUpdateDates;
            }
        }
    }
     @AuraEnabled
    public static List<ShiftwithStaff__c> getDragDrogShifts (String StaffId, String refId,String shiftId, String draggingShiftDate, String droppedShiftDate){
              List<ShiftwithStaff__c> shiftsList = new List<ShiftwithStaff__c>();
            Date sDate = Date.valueOf(draggingShiftDate);
            Date eDate = Date.valueOf(droppedShiftDate);
            if (!String.isEmpty(refId)) {

            shiftsList = [SELECT Id,Role__c, Staff__c,Staff__r.Display_Nickname__c, Add_Shift__c, Staff_Final_Hourly_Rate__c, Date__c, Start_Time__c,Shift_Start_Time__c,Shift_End_Time__c,Start_Date__c,Shift_End_Date__c, End_Date__c, End_Time__c,Is_long_Morning__c,Long_Morning_Start_Date_One__c,Is_long_Morning_Next_Day_Start__c,Long_Morning_Hourly_Rate__c,Public_holiday__c,Recur_Holiday__c,Day_Name__c,Is_Long_Night_Shift__c,Is_Long_Night_Start_Next_Day__c,
            Is_Long_Afternoon__c,Long_Afternoon_Start_Date_One__c,Is_Long_Afternoon_Next_Day_Start__c,Long_Afternoon_Hourly_Rate__c,Is_long_Morning_Shift_two__c,Is_Long_Morning_Next_Day_Start_Two__c,Long_Morning_Start_Date_Two__c,Long_Morning_Rate_Two__c,Is_Long_afternoon_shift_two__c,Long_Afternoon_Start_Date_Two__c,Long_Afternoon_Rate_Two__c,(SELECT Id, Service_Users__c FROM Services_and_Support_Plans__r) FROM ShiftwithStaff__c WHERE RefId__c = :refId AND Date__c >= :sDate];
            } else if (!String.isEmpty(shiftId)) {
            shiftsList = [
                SELECT Id, Staff__c, Add_Shift__c,Role__c,Staff__r.Display_Nickname__c, Staff_Final_Hourly_Rate__c, Date__c, Start_Time__c, End_Date__c,Shift_Start_Time__c,Shift_End_Time__c,Start_Date__c,Shift_End_Date__c, End_Time__c,Is_long_Morning__c,Long_Morning_Start_Date_One__c,Is_long_Morning_Next_Day_Start__c,Long_Morning_Hourly_Rate__c,Public_holiday__c,Recur_Holiday__c,Day_Name__c,Is_Long_Night_Shift__c,Is_Long_Night_Start_Next_Day__c,
                Is_Long_Afternoon__c,Long_Afternoon_Start_Date_One__c,Is_Long_Afternoon_Next_Day_Start__c,Long_Afternoon_Hourly_Rate__c,Is_long_Morning_Shift_two__c,Is_Long_Morning_Next_Day_Start_Two__c,Long_Morning_Start_Date_Two__c,Long_Morning_Rate_Two__c,Is_Long_afternoon_shift_two__c,Long_Afternoon_Start_Date_Two__c,Long_Afternoon_Rate_Two__c,
                (SELECT Id, Service_Users__c FROM Services_and_Support_Plans__r)
                FROM ShiftwithStaff__c
                WHERE Id = :shiftId
            ];
        }
        return shiftsList;
    }
   
    
 
    
    public class StaffWrapper {
        public integer serialNumber=0;
        public String Id ;
        public String fullName ;
        public decimal Hourlyrate;
        public String activeOrInactive ;
        public Boolean status ;
        public String facilityname ;
        public decimal duration;
        public decimal shiftWage;
        public Decimal scr=0;
        public string className='';
        public string role;
        public boolean isDisable;
        public boolean isAllocate=false;
        public string shiftId;
        public date shiftDate;
        public decimal quantity;
        public string  ClassAndLevel;
        public boolean exceedsLimit;
        public decimal assignedHours; 
        public boolean setHoursIndicator=false;
        public decimal twoShiftsDurationinHours;
        public List<AddShiftController.ShiftWithStaffWrapper> shiftwithstaff;
        public String WeeklyHours;
    }
    
    public static String extractNumber(String input) {
        if (String.isBlank(input)) return null;

        // Extract first number found in string
        Pattern p = Pattern.compile('\\d+');
        Matcher m = p.matcher(input);

        if (m.find()) {
            return m.group(); // returns first numeric match
        }

        return null;
    }
    
}