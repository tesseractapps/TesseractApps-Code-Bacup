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
              
                string staffList=getStaffHourlyRates(addShiftList,startdate,enddate,facilityVal);
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
                    List<String> timeSplit = addShiftList[0].End_Time_Text__c.split(' ');
                    List<String> startTimeSplits = addShiftList[0].Start_Time_Text__c.split(' ');
                    if (timeSplit[1] == 'am' && (startTimeSplits[1] != 'am'   ||addShiftList[0].Shift_Type__c == 'Custom')) {
                        shiftEndDate = addShiftList[0].Start_Date__c.addDays(1);
                    } else {
                        shiftEndDate = addShiftList[0].Start_Date__c;
                    }
                    if (timeSplit[1] == 'pm' && addShiftList[0].Shift_Type__c == 'Custom') {
                        Integer startTotalMinutes = addShiftList[0].Start_Time__c.hour() * 60 + addShiftList[0].Start_Time__c.minute();
                        Integer endTotalMinutes = addShiftList[0].End_Time__c.hour() * 60 + addShiftList[0].End_Time__c.minute();
                        
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
                    stafflist = EoiStaffFilter(addShiftList[0].Start_Date__c,shiftEndDate,addShiftList[0].Start_Time__c,addShiftList[0].End_Time__c,staffList);
                } else {
                    stafflist = AddShiftController.getAvailableStaffforRosterManager(Role,addShiftList[0].Start_Date__c,shiftEndDate,addShiftList[0].Start_Time__c,addShiftList[0].End_Time__c);
                }
                if (Test.isRunningTest()) {
                    stafflist =      [ SELECT Id, Name__c, Display_Nickname__c, Name, Last_Name__c, Role__c, Facility_Name__c,
                                      Set_Hours__c, Restrict_Set_Hours__c, Recurring_Till__c, Working_Hours_Rate__c,
                                      Saturday_Hourly_Rate__c, SCR__c, Facility__c, Sunday_Hourly_Rate__c,
                                      Public_holiday_Hourly_Rate__c, Afternoon_shift_Hourly_Rate__c,
                                      Night_shift_Hourly_Rate__c, Active_or_Non_Active__c, Status__c,(SELECT Id, RoleName__c,Afternoon_Shift_Hourly_Rate__c,Hourly_Rate__c,Night_Shift_Hourly_Rate__c,Public_Holiday_Hourly_Rate__c,Saturday_Hourly_Rate__c,Sleepover_Allowance__c,Sunday_Hourly_Rate__c, Active__c FROM StaffRoles__r WHERE Active__c = true)
                                      ,
                                      Class_and_Paypont__c, Sleepover_Allowance__c
                                      FROM Staff__c];
                }
                   
               
            } catch (Exception e) {
                System.debug('Error fetching staff list: ' + e.getMessage());
                return e.getMessage();
            }
            Set<Id> staffIds = new Set<Id>();
            for (Staff__c ss : stafflist) {
                     staffIds.add(ss.Id);               
            }
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
                   if (facilityVal.contains(String.valueOf(ss.Facility__c)) ) {
            
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
                    staff.ClassAndLevel=ss.Class_and_Paypont__c ;
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
                       if (matchedRole != null) {workingRate = matchedRole.Hourly_Rate__c;afternoonRate = matchedRole.Afternoon_shift_Hourly_Rate__c;nightRate = matchedRole.Night_shift_Hourly_Rate__c; sleepoverAllowance = matchedRole.Sleepover_Allowance__c;saturdayRate = matchedRole.Saturday_Hourly_Rate__c;sundayRate = matchedRole.Sunday_Hourly_Rate__c; publicHolidayRate = matchedRole.Public_holiday_Hourly_Rate__c;
                       }
                       if (addShiftList[0].Public_holiday__c) {
                           staff.Hourlyrate = (publicHolidayRate != null) ? publicHolidayRate : 0; 
                       } else {
                           switch on addShiftList[0].Day_Name__c {
                               when 'Saturday' { staff.Hourlyrate = (saturdayRate != null) ? saturdayRate : 0;
                               }
                               when 'Sunday' {staff.Hourlyrate = (sundayRate != null) ? sundayRate : 0;
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
                                           staff.Hourlyrate = (sleepoverAllowance != null) ? sleepoverAllowance : 0;
                                       }
                                       when else {
                                           staff.Hourlyrate = (workingRate != null) ? workingRate : 0;
                                       }
                                   }
                               }
                           }
                       }

    
                    // Calculate shift wage
                    staff.shiftWage = addShiftList[0].Shift_Type__c !='Sleepover Shift' ? staff.duration * staff.Hourlyrate : staff.Hourlyrate;
     				staff.duration=staff.duration ;
                    staff.shiftId=addShiftList[0].Id;
                    staff.shiftDate=addShiftList[0].Start_Date__c;
                    staff.quantity=addShiftList[0].Quantity__c;
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
                servList.addAll(ss.Services_and_Support_Plans__r);
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
    public static List<Staff__c> EoiStaffFilter(Date startDate, Date endDate, Time startTime, Time endTime, List<Staff__c> staffList) {
    System.debug('=== 🟩 START EoiStaffFilter ===');
    System.debug('➡️ startDate=' + startDate + ', endDate=' + endDate + ', startTime=' + startTime + ', endTime=' + endTime);
    System.debug('➡️ Staff list size: ' + (staffList == null ? 0 : staffList.size()));

    List<Staff__c> result = new List<Staff__c>();
    if (startDate == null || startTime == null || endTime == null || staffList == null || staffList.isEmpty()) {
        System.debug('⚠️ Missing required input values. Returning empty list.');
        return result;
    }

    // Determine day of week → 1 = Monday, 7 = Sunday
    Integer dayOfWeek = Integer.valueOf(DateTime.newInstance(startDate, Time.newInstance(0, 0, 0, 0)).format('u'));
    Boolean isWeekend = (dayOfWeek == 6 || dayOfWeek == 7);
    System.debug('📅 Day of Week: ' + dayOfWeek + ' (Weekend: ' + isWeekend + ')');

    // Determine week range (Monday → Sunday)
    Date weekStart = startDate.addDays(-(dayOfWeek - 1));
    Date weekEnd = weekStart.addDays(6);
    System.debug('📅 Week range: ' + weekStart + ' → ' + weekEnd);

    // Collect staff IDs
    Set<Id> staffIds = new Set<Id>();
    for (Staff__c s : staffList) {
        staffIds.add(s.Id);
    }
    System.debug('👥 Staff IDs collected: ' + staffIds.size());

    // ---- (1) Exclude staff on approved leave overlapping startDate ----
    Map<Id, Boolean> onLeaveMap = new Map<Id, Boolean>();
    List<Leave__c> leaveRecords = [
        SELECT Id, Staff__c, From__c, To__c
        FROM Leave__c
        WHERE Staff__c IN :staffIds
        AND Status__c = 'Approved'
        AND From__c <= :startDate
        AND To__c >= :startDate
    ];
    System.debug('🏖️ Leave records found: ' + leaveRecords.size());
    for (Leave__c lv : leaveRecords) {
        onLeaveMap.put(lv.Staff__c, true);
        System.debug('🏖️ Staff on leave: ' + lv.Staff__c + ' (' + lv.From__c + ' → ' + lv.To__c + ')');
    }

    // ---- (2) Exclude staff with overlapping shifts ----
    Set<Id> overlappingShiftStaff = new Set<Id>();
    Set<Id> rejectedStaffIds = new Set<Id>();

    List<ShiftwithStaff__c> existingShifts = [
        SELECT Id, Staff__c,Staff__r.name, Date__c, Start_Date__c,End_Date__c, Start_Time__c, End_Time__c,Shift_Start_Time__c,Shift_End_Time__c,Shift_End_Date__c
        FROM ShiftwithStaff__c
        WHERE Attendence__c = true
        AND Start_Date__c <= :endDate
        AND Shift_End_Date__c >= :startDate
        AND Staff__c IN :staffIds
    ];
    System.debug('📋 Existing shifts found: ' + existingShifts.size());

    for (ShiftwithStaff__c ss : existingShifts) {
        DateTime recurStart = DateTime.newInstance(startDate, startTime);
        DateTime recurEnd   = DateTime.newInstance(endDate, endTime);
        DateTime shiftStart = DateTime.newInstance(ss.Start_Date__c, ss.Shift_Start_Time__c);
        DateTime shiftEnd   = DateTime.newInstance(ss.Shift_End_Date__c, ss.Shift_End_Time__c);

        if (isShiftOverlap(recurStart, recurEnd, shiftStart, shiftEnd)) {
            overlappingShiftStaff.add(ss.Staff__c);
            System.debug('❌ Overlap detected for staff: ' +ss.Staff__r.name);
        }
    }

    List<ShiftwithStaff__c> rejectedShifts = [
        SELECT Id, Staff__c, Date__c, End_Date__c, Start_Time__c, End_Time__c,Shift_Start_Time__c,Shift_End_Time__c,Start_Date__c,Shift_End_Date__c
        FROM ShiftwithStaff__c
        WHERE Attendence__c = false and Shift_Rejected__c=true 
        AND Start_Date__c <= :endDate 
        AND Shift_End_Date__c >= :startDate
        AND Staff__c IN :staffIds
    ];
    System.debug('🚫 Rejected shifts found: ' + rejectedShifts.size());

    for (ShiftwithStaff__c ss : rejectedShifts) {
        DateTime recurStart = DateTime.newInstance(startDate, startTime);
        DateTime recurEnd   = DateTime.newInstance(endDate, endTime);
        DateTime shiftStart = DateTime.newInstance(ss.Date__c, ss.Start_Time__c);
        DateTime shiftEnd   = DateTime.newInstance(ss.End_Date__c, ss.End_Time__c);

        if (isShiftOverlap(recurStart, recurEnd, shiftStart, shiftEnd)) {
            rejectedStaffIds.add(ss.Staff__c);
            System.debug('🚫 Staff rejected shift overlap: ' + ss.Staff__c);
        }
    }

    // ---- (3) Weekly Availability ----
    Map<Id, List<Availability__c>> availabilityMap = new Map<Id, List<Availability__c>>();
    List<Availability__c> availabilityRecords = [
        SELECT Id, Staff__c, Start_Time__c, End_Time__c, Start_Date__c, Shift_Type__c
        FROM Availability__c
        WHERE Staff__c IN :staffIds
        AND Start_Date__c >= :weekStart
        AND Start_Date__c <= :weekEnd
        AND Shift_Type__c != 'Sleepover Shift'
    ];
    System.debug('📅 Availability records found: ' + availabilityRecords.size());

    for (Availability__c av : availabilityRecords) {
        if (!availabilityMap.containsKey(av.Staff__c))
            availabilityMap.put(av.Staff__c, new List<Availability__c>());
        availabilityMap.get(av.Staff__c).add(av);
    }

    // ---- (4) Weekly Shift Summary ----
    Map<Id, List<ShiftwithStaff__c>> shiftMap = new Map<Id, List<ShiftwithStaff__c>>();
    List<ShiftwithStaff__c> weekShifts = [
        SELECT Id, Staff__c, Duration__c, Date__c, Start_Time__c, End_Time__c,Start_Date__c,Shift_Start_Time__c,Shift_End_Time__c,
               Type_of_Shift__c, Attendence__c, Status__c
        FROM ShiftwithStaff__c
        WHERE Staff__c IN :staffIds
        AND Start_Date__c >= :weekStart
        AND Start_Date__c <= :weekEnd
        AND Type_of_Shift__c != 'Sleepover Shift'
        AND Status__c != 'Unassigned'
        AND Attendence__c = true
    ];
    System.debug('🕓 Week shifts found: ' + weekShifts.size());

    for (ShiftwithStaff__c sws : weekShifts) {
        if (!shiftMap.containsKey(sws.Staff__c))
            shiftMap.put(sws.Staff__c, new List<ShiftwithStaff__c>());
        shiftMap.get(sws.Staff__c).add(sws);
    }

    Decimal inputDuration = calculateDurationHours(startDate, startTime, endTime);
    System.debug('⏱️ Input shift duration: ' + inputDuration + ' hours');

    // ---- (5) Evaluate Each Staff ----
    Integer staffProcessed = 0;
    Integer staffAdded = 0;

    for (Staff__c st : staffList) {
        staffProcessed++;
        System.debug('🔍 Processing staff ' + staffProcessed + '/' + staffList.size() + ': ' + st.Name + ' (' + st.Id + ')');

        if (onLeaveMap.containsKey(st.Id)) {
            System.debug('🚫 SKIPPED - Staff on leave');
            continue;
        }
        if (overlappingShiftStaff.contains(st.Id)) {
            System.debug('🚫 SKIPPED - Overlapping shift');
            continue;
        }
        if (rejectedStaffIds.contains(st.Id)) {
            System.debug('🚫 SKIPPED - Rejected shift');
            continue;
        }

        // Sum durations
        Decimal totalShiftDuration = 0;
        for (ShiftwithStaff__c s : (shiftMap.get(st.Id) != null ? shiftMap.get(st.Id) : new List<ShiftwithStaff__c>())) {
            if (s.Start_Time__c != null && s.End_Time__c != null) {
                totalShiftDuration += calculateDurationHours(s.Start_Date__c, s.Shift_Start_Time__c, s.Shift_End_Time__c);
            } else if (s.Duration__c != null) {
                totalShiftDuration += s.Duration__c;
            }
        }

        Decimal totalAvailabilityDuration = 0;
        for (Availability__c a : (availabilityMap.get(st.Id) != null ? availabilityMap.get(st.Id) : new List<Availability__c>())) {
            if (a.Start_Time__c != null && a.End_Time__c != null) {
                totalAvailabilityDuration += calculateDurationHours(a.Start_Date__c, a.Start_Time__c, a.End_Time__c);
            }
        }

        Decimal grandTotal = totalShiftDuration + totalAvailabilityDuration + inputDuration;
        Boolean restrict = st.Restrict_Set_Hours__c == true;
        Decimal setHours = (st.Set_Hours__c == null) ? 0 : st.Set_Hours__c;

        // 🟨 Apply Set Hours Restriction only on weekdays
        if (!isWeekend && restrict && setHours > 0 && grandTotal > setHours) {
            System.debug('🚫 SKIPPED - Exceeded set hours (' + grandTotal + ' > ' + setHours + ')');
            continue;
        } else if (isWeekend) {
            System.debug('💰 Weekend - Skipping set hours restriction check');
        }

        // ✅ Passed all checks
        result.add(st);
        staffAdded++;
        System.debug('✅ ADDED staff: ' + st.Id + ' | GrandTotal: ' + grandTotal + ' | SetHours: ' + setHours);
    }

    System.debug('=== ✅ FINAL RESULTS ===');
    System.debug('📊 Total staff processed: ' + staffProcessed);
    System.debug('📊 Total staff added to result: ' + staffAdded);
    System.debug('📊 Final result size: ' + result.size());
    System.debug('=== 🟥 END EoiStaffFilter ===');

    return result;
}
    
    
 public static Decimal calculateDurationHours(Date baseDate, Time startTime, Time endTime) {
    if (startTime == null || endTime == null) return 0;
    DateTime startDT = DateTime.newInstance(baseDate, startTime);
    DateTime endDT = DateTime.newInstance(baseDate, endTime);
    if (endDT.getTime() < startDT.getTime()) {
        endDT = endDT.addDays(1);
    }
    Long diffMs = endDT.getTime() - startDT.getTime();
    Decimal hours = (Decimal) diffMs / (1000 * 60 * 60);
    return hours.setScale(4);
}

    
   public static Boolean isShiftOverlap(DateTime start1, DateTime end1, DateTime start2, DateTime end2) {
    return (start1 < end2) && (start2 < end1);
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
}
    
    
}