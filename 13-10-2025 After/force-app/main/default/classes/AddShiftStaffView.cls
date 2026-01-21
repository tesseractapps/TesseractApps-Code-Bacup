public with sharing class AddShiftStaffView {
    @AuraEnabled(cacheable=true)
    public static List<RosterRoleWrapper> getStaffData(List<String> roles,Date startDate,Date endDate,List<String> facIdlist,String orgID,string weekDataJson,string name,
                                                      List<String> shiftTypeList, list<string> statusList) {
        List<RosterRoleWrapper> rostersDataRoleWise = new List<RosterRoleWrapper>();
      
        // Debugging passed parameters
        System.debug('Roles passed to Apex: ' + roles);
        System.debug('Start Date: ' + startDate);
        System.debug('End Date: ' + endDate);
        System.debug('Facility IDs: ' + facIdlist);
        System.debug('Organization ID: ' + orgID);
        String state = [SELECT Id,Address_Latest__StateCode__s FROM Organisation__c WHERE id = :orgID LIMIT 1].Address_Latest__StateCode__s;
        List<Public_Holiday__c> holidayList=LeaveController.getHolidayCount(startDate, endDate, AddShiftHandler.getStateFullForm(state));
        List<Shift_Type__c> shiftTypeAndTimings=[SELECT Id, Name,Facility__c, Start_Time__c, End_Time__c, Shift_Type__c,Colour__c  FROM Shift_Type__c WHERE Facility__c IN :facIdlist];  
         
          Map<Id, Map<String, String>> shiftTimeMap = new Map<Id, Map<String, String>>();

               for (Shift_Type__c sh : shiftTypeAndTimings) {
                    if (!shiftTimeMap.containsKey(sh.Facility__c)) {
                        shiftTimeMap.put(sh.Facility__c, new Map<String, String>());
                    }
                    String cssStyle = 'border-left: 6px solid ' + sh.Colour__c +
                                      '; background-color: ' + sh.Colour__c + '20; color: ' +sh.Colour__c +
                                      '; border-radius: 6px;';
                    shiftTimeMap.get(sh.Facility__c).put(sh.Id, cssStyle);
			}
           System.debug('shiftTimeMap ' +shiftTimeMap);             
         System.debug('holiday list ' + holidayList);
        Map<Date, String> holidayMap = new Map<Date, String>();
        set<Id> StaffIdList= new set<Id>();
        for (Public_Holiday__c holiday : holidayList) {
            holidayMap.put(holiday.Date__c, holiday.Holiday_Name__c);
        }
        
        // Fetch staff members for all roles
        List<Staff__c> staffMembers = StaffController.StaffsRolesWiseList(orgId, facIdlist, roles,name);
        System.debug('Staff members '+staffMembers);
        Map<String, List<Staff__c>> roleStaffMap = new Map<String, List<Staff__c>>();
        // Initialize maps to track daily totals for each role
        Map<String, Map<Integer, Decimal>> roleDailyQuantity = new Map<String, Map<Integer, Decimal>>();
        Map<String, Map<Integer, Decimal>> roleDailyUnAllocated = new Map<String, Map<Integer, Decimal>>();
        Map <String ,list<Services_and_Support_Plan__c>> servicesByrole= new Map<string,list<Services_and_Support_Plan__c>>();                                                 
        
        for (String predefinedRole : roles) { // 'roles' is the parameter containing predefined roles
            roleStaffMap.put(predefinedRole, new List<Staff__c>());
            servicesByrole.put(predefinedRole, new list<Services_and_Support_Plan__c>());
            Map<Integer, Decimal> dailyQuantity = new Map<Integer, Decimal>();
            Map<Integer, Decimal> dailyUnAllocated = new Map<Integer, Decimal>();
            for (Integer i = 0; i < 7; i++) {
                dailyQuantity.put(i, 0);
                dailyUnAllocated.put(i, 0);
            }
            roleDailyQuantity.put(predefinedRole, dailyQuantity);
            roleDailyUnAllocated.put(predefinedRole, dailyUnAllocated);
        }
        
        for (Staff__c staff : staffMembers) {
            String staffRole = staff.Role__c; // Assuming 'Role__c' is the staff's multi-select picklist field
            if (String.isNotBlank(staffRole)) {
                // Split the multi-select picklist into individual roles
                List<String> staffRolesList = staffRole.split(';');
                for (String predefinedRole : roles) { // 'roles' is the parameter containing predefined roles
                    if (staffRolesList.contains(predefinedRole)) {
                        StaffIdList.add(staff.Id);
                        // If the predefinedRole matches one of the staff's roles, add the staff to that role's list
                        if (!roleStaffMap.containsKey(predefinedRole)) {
                            roleStaffMap.put(predefinedRole, new List<Staff__c>());
                            
                        }
                        roleStaffMap.get(predefinedRole).add(staff);
                    }
                }
            }
        }
        
        List<Add_Shift__c> addShiftList=AddShiftController.allocationList(roles, string.valueof(startDate), string.valueof(endDate), facIdlist);
        
        // Fetch shifts for the given roles and date range
          /*  List<ShiftWithStaff__c> shifts = [SELECT Id, Staff__c, Date__c,Add_Shift__c,Add_Shift__r.Quantity__c,Add_Shift__r.Un_Allocated__c, Add_Shift__r.Location__Street__s, Add_Shift__r.Role__c,Staff__r.Email_Address__c,Staff__r.Name__c,Staff__r.Name,Staff__r.Last_Name__c,Add_Shift__r.Shift_Start_End_Time__c,Status__c,Split_Shifts__c,Shiftcolor__c,Split_Shift_Color__c,Split_Shift_Height__c,Index__c,
            Shift_Wage__c,Duration__c,(SELECT Id,Client__c,Client__r.First_Name__c,Client__r.Last_Name__c,Client__r.Picture__c	 FROM Services_and_Support_Plans__r),Do_you_want_to_set_this_Recurring_Roster__c FROM ShiftWithStaff__c WHERE Add_Shift__r.Role__c IN :roles AND Date__c >= :startDate AND Date__c <= :endDate AND Staff__c != null and  Add_Shift__r.Role__c In:roles
            and Staff__c in:StaffIdList and Attendence__c=true  ORDER BY Add_Shift__r.Role__c, Staff__c, Date__c,createdDate,Index__c ASC]; */
        
        String baseQuery = 'SELECT Id, Staff__c, Date__c, Add_Shift__c, Add_Shift__r.Quantity__c,Add_Shift__r.Facility_Name__c,Add_Shift__r.Shift_Notes__c,Role_formula__c ,Type_of_shift__c,Add_Shift__r.Facility__c, ' +
            'Add_Shift__r.Un_Allocated__c, Add_Shift__r.Location__Street__s,Add_Shift__r.Location__City__s, Add_Shift__r.Role__c,RefId__c,Add_Shift__r.Shift_Name__c, ' +
            'Staff__r.Email_Address__c, Staff__r.Name__c, Staff__r.Last_Name__c,Staff_Final_Hourly_Rate__c,Split_Shift_RefId__c,New_Split_Shift__c, ' +
            'Add_Shift__r.Shift_Start_End_Time__c, Status__c, Split_Shifts__c, Shiftcolor__c,Shift_Start_End_Time__c, ' +
            'Split_Shift_Color__c, Split_Shift_Height__c, Index__c, Shift_Wage__c, Duration__c, ' +
            '(SELECT Id, Client__c,Client__r.Name__c, Client__r.First_Name__c, Client__r.Last_Name__c,Status__c,Resource_Name__c,Service_Type_Name__c,Description__c,GST__c, ' +
            'Client__r.Picture__c,Lineitem__c,Date_of_Service__c,Amount__c,Available_Fund__c,Unit_Price__c,Qty__c FROM Services_and_Support_Plans__r), ' +
            'Do_you_want_to_set_this_Recurring_Roster__c ' +
            'FROM ShiftWithStaff__c WHERE Staff__c != null AND Attendence__c = true AND Un_Assigned_Shift__c =false ';                                            
        
        // Add Date filter dynamically
        if (startDate != null && endDate != null) {
            baseQuery += ' AND Date__c >= :startDate AND Date__c <= :endDate';
        }
         if (!shiftTypeList.isEmpty()) {
            baseQuery += ' AND Type_of_shift__c IN :shiftTypeList';
        } 
         if (!statusList.isEmpty()) {
            baseQuery += ' AND Status__c IN :statusList';
        } 
                                                        
        // Add Staff ID filter dynamically
        if (!StaffIdList.isEmpty()) {
            baseQuery += ' AND Staff__c IN :StaffIdList';
        }
        
        // Append ordering clause
        baseQuery += ' ORDER BY Add_Shift__r.Role__c, Staff__c, Date__c, createdDate, Index__c ASC';
        
        // Execute the dynamic query
        List<ShiftWithStaff__c> shifts = Database.query(baseQuery);
        System.debug('Fetched Shifts: ' + shifts);

        map<id,decimal> staffHours= new map<id,decimal>();
        map<id,decimal> staffEarnedWages= new map<id,Decimal>();
        // Map shifts to their respective staff members
        Map<Id, List<ShiftWithStaff__c>> staffShiftsMap = new Map<Id, List<ShiftWithStaff__c>>();
        for (ShiftWithStaff__c shift : shifts) {
            if (!staffShiftsMap.containsKey(shift.Staff__c)) {
                staffShiftsMap.put(shift.Staff__c, new List<ShiftWithStaff__c>());
                staffHours.put(shift.Staff__c,0);
                staffEarnedWages.put(shift.Staff__c,0);
            }
            staffShiftsMap.get(shift.Staff__c).add(shift);
             staffHours.put(shift.Staff__c, staffHours.get(shift.Staff__c) +(shift.Duration__c != null ? shift.Duration__c : 0));
            staffEarnedWages.put(shift.Staff__c,staffEarnedWages.get(shift.Staff__c) +(shift.Shift_Wage__c != null ? shift.Shift_Wage__c : 0));
            
        }
        for (Add_Shift__c shift : addShiftList) {
            if (roles.contains(shift.Role__c)) {
                Integer dayIndex = startDate.daysBetween(shift.Start_Date__c);
                if (dayIndex >= 0 && dayIndex < 7) {
                    roleDailyQuantity.get(shift.Role__c).put(dayIndex, roleDailyQuantity.get(shift.Role__c).get(dayIndex) + (shift.Quantity__c != null ? shift.Quantity__c : 0));
                    roleDailyUnAllocated.get(shift.Role__c).put(dayIndex, roleDailyUnAllocated.get(shift.Role__c).get(dayIndex) + (shift.Un_Allocated__c != null ? shift.Un_Allocated__c : 0));
                }
            }
        }
        
        System.debug('Role map ' + roleStaffMap);
        // Construct RosterRoleWrapper data
        // Construct RosterRoleWrapper data
         Boolean isFirstRecord = true ;
        for (String role : roleStaffMap.keySet()) {
            RosterRoleWrapper roleWrapper = new RosterRoleWrapper();
            roleWrapper.roleName = role;
          //  system.debug('first record '+isFirstRecord);
            roleWrapper.isExpanded = isFirstRecord; // First record gets true, others get false
            isFirstRecord = false; // After the first record, set flag to false
            roleWrapper.arrowcode = roleWrapper.isExpanded ==true? '\u2B9F' :'\u2B9C' ;
            roleWrapper.weekData = (List<WeekDataWrapper>) JSON.deserialize(weekDataJson, List<WeekDataWrapper>.class);
            roleWrapper.staffData = new List<StaffShiftWrapper>();
            for (Integer i = 0; i < 7; i++) {
                Date currentDate = startDate.addDays(i);
                Boolean isToday = currentDate == Date.today();
                String todayLabel = isToday ? 'Today' : 'NotToday';
                WeekDataWrapper weekData = roleWrapper.weekData[i];
                weekData.quantity = roleDailyQuantity.get(role).get(i);
                weekData.unallocated = roleDailyUnAllocated.get(role).get(i);
                weekData.todayLabel=todayLabel;
                if (holidayMap.containsKey(currentDate)) {
                    weekData.isHoliday = true;
                      weekData.holidayColor='day-cells holiday';
                    
                    weekData.holidayName = holidayMap.get(currentDate);  // Assign holiday name
                } else {
                    weekData.isHoliday = false;
                     weekData.holidayColor=isToday ?'day-cells Today' :'day-cells NotToday';
                    weekData.holidayName = null;  // No holiday, set to null
                } 
            }
            
            
            for (Staff__c staff : roleStaffMap.get(role)) {
                StaffShiftWrapper staffWrapper = new StaffShiftWrapper();
                staffWrapper.staffId = staff.Id;
                staffWrapper.firstName = staff.Name;
                staffWrapper.profileUrl = staff.picture__c != null ? staff.picture__c : '';
                staffWrapper.lastName = staff.Last_Name__c;
                staffWrapper.wages = 0;
               staffWrapper.disPlayName=staff.Display_Nickname__c;
                staffWrapper.completedHours = 0;
                staffWrapper.SCR = staff.SCR__c != null ? staff.SCR__c.setScale(2, RoundingMode.HALF_UP) : 0.0.setScale(2, RoundingMode.HALF_UP);
                staffWrapper.setHours = staff.Set_Hours__c;
                staffWrapper.facilityIdValue=staff.Facility__c;
                staffWrapper.isExpanded = false;
                staffWrapper.restrictSetHours = staff.Restrict_Set_Hours__c;
                staffWrapper.ClassAndLevel=staff.Class_and_Paypont__c;
                staffWrapper.shiftsByDay = new List<ShiftsByDayWrapper>();
                staffWrapper.wages =staffEarnedWages.get(staff.Id)>0?staffEarnedWages.get(staff.Id) :0;
                staffWrapper.completedHours =  staffHours.get(staff.Id)>0 ?staffHours.get(staff.Id) :0;
                Integer consecutiveLeaveCount = 0;
                Integer leaveStartIndex = -1;
                
                // Step 1: Populate all 7 days for the week into shiftsByDay
                for (Integer i = 0; i < 7; i++) {
                    Date currentDate = startDate.addDays(i);
                    ShiftsByDayWrapper dayWrapper = new ShiftsByDayWrapper();
                    dayWrapper.day = 'Day ' + i;
                    dayWrapper.Shiftdate = currentDate;
                    dayWrapper.isMerged = false;
                    dayWrapper.rowSpan = 1;
                    dayWrapper.TdWidth=12;
                    dayWrapper.inlineStyle = 'width:12%; padding: 0%;'; 
                    // Check if it's a holiday
                    if (holidayMap.containsKey(currentDate)) {
                        dayWrapper.isHoliday = true;
                        dayWrapper.holidayName = holidayMap.get(currentDate);
                    } else {
                        dayWrapper.isHoliday = false;
                        dayWrapper.holidayName = null;
                    }
                    
                    // Check for leaves
                    for (Leave__c leave : staff.Leaves__r) {
                        if (leave.From__c <= currentDate && leave.To__c >= currentDate) {
                            dayWrapper.isLeave = true;
                            dayWrapper.leaveType = leave.Type_of_Leave__c;
                            if (leaveStartIndex == -1) {
                                leaveStartIndex = i;  // Mark the start of leave
                            }
                            consecutiveLeaveCount++;
                            break;
                        }
                    }
                    
                    dayWrapper.shifts = new List<ShiftWrapper>();
                    dayWrapper.splitShifts = new List<ShiftWrapper>();
                     dayWrapper.newUIGroupOfShifts=new List<ShiftWrapper>();
                    staffWrapper.shiftsByDay.add(dayWrapper);
                }
                
                // Step 2: Merge consecutive leave days AFTER fully initializing shiftsByDay
                if (leaveStartIndex != -1) {
                    staffWrapper.shiftsByDay[leaveStartIndex].isMerged = true;
                    staffWrapper.shiftsByDay[leaveStartIndex].rowSpan = consecutiveLeaveCount;
                    staffWrapper.shiftsByDay[leaveStartIndex].isVisible = true;
    				staffWrapper.shiftsByDay[leaveStartIndex].TdWidth =  consecutiveLeaveCount * 12;
                    staffWrapper.shiftsByDay[leaveStartIndex].inlineStyle ='width:' + String.valueOf(consecutiveLeaveCount * 12) + '%; padding: 0%;';
                    
                    for (Integer j = leaveStartIndex + 1; j < leaveStartIndex + consecutiveLeaveCount; j++) {
                        // Ensure the index is within bounds
                        if (j < staffWrapper.shiftsByDay.size()) {
                            staffWrapper.shiftsByDay[j].isMerged = false;
                            staffWrapper.shiftsByDay[j].rowSpan = 0;
                             staffWrapper.shiftsByDay[j].isVisible=false;
                            staffWrapper.shiftsByDay[j].TdWidth  = 0;
                            staffWrapper.shiftsByDay[j].inlineStyle  = 'display:none;';
                             staffWrapper.shiftsByDay[j].isVisible=false;
                           
                            // Hidden in LWC
                        }
                    }
                }
               
                // Step 3: Populate shifts for the staff
             //   Decimal completedHours = 0;
                Decimal earnedMoney = 0;
                Map<String, List<ShiftWrapper>> refIdShiftsMap = new Map<String, List<ShiftWrapper>>();

                if (staffShiftsMap.containsKey(staff.Id)) {
                    for (ShiftWithStaff__c shift : staffShiftsMap.get(staff.Id)) {
                        if (shift.Add_Shift__r.Role__c == role) {
                            Integer dayIndex = startDate.daysBetween(shift.Date__c);
                            if (dayIndex >= 0 && dayIndex < 7) {
                                ShiftsByDayWrapper dayWrapper = staffWrapper.shiftsByDay[dayIndex];
                                string refId = shift.Split_Shift_RefId__c;
                                if(refId != null ){
                                        if (!refIdShiftsMap.containsKey(refId)) {
                                            refIdShiftsMap.put(refId, new List<ShiftWrapper>());
                                        }
                                  
                                }  
                               
                                ShiftWrapper shiftWrapper = new ShiftWrapper();
                                shiftWrapper.Id = shift.Id;
                                shiftWrapper.ShiftStreet = shift.Add_Shift__r.Location__Street__s;
                                shiftWrapper.ShiftCity = shift.Add_Shift__r.Location__City__s;
                                 shiftWrapper.Facility = shift.Add_Shift__r.Facility_Name__c;
                                 shiftWrapper.Notes = shift.Add_Shift__r.Shift_Notes__c;
                                shiftWrapper.ShiftTime = shift.Shift_Start_End_Time__c;
                                shiftWrapper.status = shift.Status__c ;
                                shiftWrapper.uiStatus= shift.Status__c =='InProgress'?'In Progress' :shift.Status__c;
                                shiftWrapper.AddAhiftId = shift.Add_Shift__c;
                                shiftWrapper.refID=shift.RefId__c;
                                shiftWrapper.originalColor=shift.Shiftcolor__c;
                                shiftWrapper.splitShiftRefId = shift.Split_Shift_RefId__c;
                                
                                Id facilityId = shift.Add_Shift__r.Facility__c;
                                 System.debug('facilityId ' +facilityId);
                                String shiftName = shift.Add_Shift__r.Shift_Name__c;
                                 System.debug('shiftName ' +shiftName); 
                                // Check if map contains that facility and shift name
                               if (shiftTimeMap.containsKey(facilityId) && shiftTimeMap.get(facilityId).containsKey(shiftName)) {
                                    shiftWrapper.originalColor = shiftTimeMap.get(facilityId).get(shiftName);
                                } else {
                                     shiftWrapper.originalColor = 'border-left: 6px solid #D35701; background-color: #D3570120;color:#D35701;  border-radius: 6px;';
                                }
                              //  shiftWrapper.originalColor=shift.Shiftcolor__c;
                                shiftWrapper.shiftType=shift.Type_of_shift__c;
                                shiftWrapper.shiftRate=shift.Staff_Final_Hourly_Rate__c;
                   
                                shiftWrapper.isRecurring=shift.Do_you_want_to_set_this_Recurring_Roster__c;
                                if(shift.Services_and_Support_Plans__r.size()>0){
                                    for(Services_and_Support_Plan__c ssp: shift.Services_and_Support_Plans__r){
                                        servicesByrole.get(role).add(ssp);
                                        shiftWrapper.participantName=ssp.Client__r.Name__c;
                                        shiftWrapper.participantImage=ssp.Client__r.Picture__c;
                                        shiftWrapper.serviceName=ssp.Service_Type_Name__c;
                                    }
                                    
                                }
                              //  completedHours += shift.Duration__c != null ? shift.Duration__c : 0;
                              //  earnedMoney += shift.Shift_Wage__c != null ? shift.Shift_Wage__c : 0;
                                shiftWrapper.isSplitShift=shift.New_Split_Shift__c;
                                shiftWrapper.splitShiftColor=shift.Split_Shift_Color__c;
                                shiftWrapper.spliShiftHeight=shift.Split_Shift_Height__c;
                                
                              //  system.debug('shift id '+shift.Id);
                                if(shift.New_Split_Shift__c==true){
                                 shiftWrapper.isSpliFirstRecord=shift.Index__c ==0? true:false; 
                                 shiftWrapper.SplitShiftUi='split-pos-'+shift.Status__c;
                                }else{
                                  shiftWrapper.isFirstRecordType = dayWrapper.shifts.isEmpty() ? true : false;    
                                }
                                Integer shiftCount = dayWrapper.shifts.size();
                                shiftWrapper.isSecondRecord = shiftCount == 1; // Second shift (index 1)
                                shiftWrapper.isThirdRecord = shiftCount == 2;  // Third shift (index 2)
                                shiftWrapper.isFourthRecord = shiftCount == 3; // Fourth shift (index 3)
                                if(shiftWrapper.isSplitShift==true){
                                   // system.debug('shiftWrapper.isSplitShif '+shiftWrapper.isSplitShift);
              
                                    dayWrapper.splitShifts.add(shiftWrapper);
                                }
                                 if (!dayWrapper.splitShifts.isEmpty()) {
                                    Decimal totalHeight = 57; // Total available height (you can tweak this)
                                    Decimal individualHeight = totalHeight / dayWrapper.splitShifts.size();
                                    
                                    for (ShiftWrapper sw : dayWrapper.splitShifts) {
                                        sw.inLineHeight = 'cursor: pointer; position:relative; left:-10px; height:' + individualHeight.setScale(1, RoundingMode.HALF_UP) + 'px;';
                                      //  sw.inLineColor=sw.originalColor;
                                    }
                                }
                                if((shift.New_Split_Shift__c ==true && shift.Index__c==0)  || shift.New_Split_Shift__c ==false  ){
                                  // system.debug('shiftWrapper.isSplitShif '+shiftWrapper.isSplitShift);
                                  // system.debug('shiftWrapper '+shiftWrapper);
                                  dayWrapper.newUIGroupOfShifts.add(shiftWrapper);
                               } 
                                if (!dayWrapper.newUIGroupOfShifts.isEmpty()) {
                                    Integer shiftCountPerDay = dayWrapper.newUIGroupOfShifts.size();
                                
                                    // Adjust available height by subtracting margin space
                                    Decimal totalAvailableHeight = 100 - ((shiftCountPerDay - 1) * 1);
                                    Decimal individualPercent = totalAvailableHeight / shiftCountPerDay;
                                
                                    Integer fontSize;
                                    if (shiftCountPerDay == 1) {
                                        fontSize = 16;
                                    } else if (shiftCountPerDay == 2) {
                                        fontSize = 13;
                                    } else if (shiftCountPerDay == 3) {
                                        fontSize = 14;
                                    } else {
                                        fontSize = 12; // Default for 4 or more
                                    }
                                
                                    for (ShiftWrapper sw : dayWrapper.newUIGroupOfShifts) {
                                        sw.inLineHeight = sw.originalColor + 
                                            'cursor: pointer; position:relative; margin-bottom:1%; height:' + 
                                            individualPercent.setScale(2, RoundingMode.HALF_UP) + '%; font-size:' + fontSize + 'px;';
                                       // sw.inLineColor = sw.originalColor;
                                    }
                                }
                                if(refId != null){
                                  refIdShiftsMap.get(refId).add(shiftWrapper);  
                                }
                                

                               dayWrapper.shifts.add(shiftWrapper);
                                dayWrapper.hasMultipleShifts = dayWrapper.shifts.size() > 1;
                                dayWrapper.shiftsLength = dayWrapper.newUIGroupOfShifts.size() ;
                                dayWrapper.ShiftColor =  shift.New_Split_Shift__c !=true ?shift.Shiftcolor__c :'' ;
                                dayWrapper.isRecurring=shift.Do_you_want_to_set_this_Recurring_Roster__c;
                                dayWrapper.isSingleGroupRecord=dayWrapper.shiftsLength==1;
                                dayWrapper.isTwoGroupOfShifts=dayWrapper.shiftsLength==2;
                                dayWrapper.isThreeGroupOfShifts=dayWrapper.shiftsLength==3;
                                dayWrapper.isFourGroupOfShifts=dayWrapper.shiftsLength==4;
                                
                                 dayWrapper.splitShiftLength = dayWrapper.splitShifts.size() ;
                                dayWrapper.isSplitSingleGroupRecord=dayWrapper.splitShiftLength==1;
                                dayWrapper.isSplitTwoGroupOfShifts=dayWrapper.splitShiftLength==2;
                                dayWrapper.isSplitThreeGroupOfShifts=dayWrapper.splitShiftLength==3;
                                dayWrapper.isSplitFourGroupOfShifts=dayWrapper.splitShiftLength==4;
                                
                
                                
                            }
                        }
                    }
                }
                
                List<RefIdShiftGroupWrapper> shiftsByRefId = new List<RefIdShiftGroupWrapper>();
                if (!refIdShiftsMap.isEmpty()) {
                    for (String refId : refIdShiftsMap.keySet()) {
                        RefIdShiftGroupWrapper refGroup = new RefIdShiftGroupWrapper();
                        refGroup.refId = refId;
                        refGroup.shifts = refIdShiftsMap.get(refId);
                        refGroup.isSplitSingleGroupRecord=refGroup.shifts.size()==1;
                        refGroup.isSplitTwoGroupOfShifts=refGroup.shifts.size()==2;
                        refGroup.isSplitThreeGroupOfShifts=refGroup.shifts.size()==3;
                        refGroup.isSplitFourGroupOfShifts=refGroup.shifts.size()==4;
                        shiftsByRefId.add(refGroup);
                    }
                }

                // This will be empty array if no refIds exist
                staffWrapper.shiftsByRefId = shiftsByRefId;
                List<ShiftsByDayWrapper> filteredShiftsByDay = new List<ShiftsByDayWrapper>();
                for (ShiftsByDayWrapper dayWrapper : staffWrapper.shiftsByDay) {
                    if (dayWrapper.isVisible != false) {
                        filteredShiftsByDay.add(dayWrapper);
                    }
                }
                staffWrapper.shiftsByDay = filteredShiftsByDay;
                
                
              //  staffWrapper.wages = earnedMoney;
               // staffWrapper.completedHours = completedHours;
             //   roleWrapper.ServicesByRole=servicesByrole.get(role);
                roleWrapper.staffData.add(staffWrapper);
            }

            
            
            rostersDataRoleWise.add(roleWrapper);
        }
        
        
        return rostersDataRoleWise;
    }

    // Wrapper classes
    public class RosterRoleWrapper {
        @AuraEnabled public String roleName;
        @AuraEnabled public Boolean isExpanded;
        @AuraEnabled public string  arrowcode;
        @AuraEnabled public List<WeekDataWrapper> weekData;
        @AuraEnabled public List<StaffShiftWrapper> staffData;
        @AuraEnabled public list<Services_and_Support_Plan__c> ServicesByRole;
    }
    
    public class WeekDataWrapper {
        @AuraEnabled public String day;
        @AuraEnabled public String weekDays; // Placeholder; define as per requirement
        @AuraEnabled  public Decimal quantity;
        @AuraEnabled public Decimal unallocated;
        @AuraEnabled public boolean isHoliday;
        @AuraEnabled public String holidayName;
        @AuraEnabled  public string holidayColor;
        @AuraEnabled public string todayLabel;
        @AuraEnabled public string UiFormattedDate;
    }
    
    public class StaffShiftWrapper {
        @AuraEnabled public String staffId;
        @AuraEnabled public String firstName;
        @AuraEnabled public String lastName;
        @AuraEnabled public Decimal wages=0;
        @AuraEnabled  public Boolean isExpanded;
        @AuraEnabled public Decimal completedHours=0;
        @AuraEnabled public string profileUrl;
        @AuraEnabled public string disPlayName;
        @AuraEnabled public Decimal setHours;
        @AuraEnabled public string facilityIdValue;
        @AuraEnabled public Decimal SCR;
        @AuraEnabled public string  ClassAndLevel;
        @AuraEnabled public List<ShiftsByDayWrapper> shiftsByDay;
        @AuraEnabled public Boolean restrictSetHours;
        @AuraEnabled public List<RefIdShiftGroupWrapper> shiftsByRefId;
    }
    public class RefIdShiftGroupWrapper {
        @AuraEnabled public String refId;
        @AuraEnabled public List<ShiftWrapper> shifts;
        @AuraEnabled public boolean isSplitSingleGroupRecord;
        @AuraEnabled public boolean isSplitTwoGroupOfShifts;
        @AuraEnabled public boolean isSplitThreeGroupOfShifts;
        @AuraEnabled public boolean isSplitFourGroupOfShifts;
      
   }
    
    public class ShiftsByDayWrapper {
        @AuraEnabled  public String day;
        @AuraEnabled public Date Shiftdate;
        @AuraEnabled public string ShiftDateFormat;
        @AuraEnabled  public List<ShiftWrapper> shifts;
        @AuraEnabled  public List<ShiftWrapper> splitShifts;
        @AuraEnabled  public List<ShiftWrapper> newUIGroupOfShifts;
        @AuraEnabled public Boolean hasMultipleShifts;
        @AuraEnabled  public boolean isHoliday ;
        @AuraEnabled public string holidayName;
        @AuraEnabled public boolean  isLeave;
        @AuraEnabled public string leaveType;
        @AuraEnabled public boolean isMerged;
        @AuraEnabled public integer rowSpan;
        @AuraEnabled public integer TdWidth;
        @AuraEnabled public string inlineStyle;
        @AuraEnabled public boolean isVisible=true;
        @AuraEnabled public integer shiftsLength=0;
        @AuraEnabled public string ShiftColor;
        @AuraEnabled public boolean isRecurring=false;
       @AuraEnabled public boolean isSingleGroupRecord;
        @AuraEnabled public boolean isTwoGroupOfShifts;
        @AuraEnabled public boolean isThreeGroupOfShifts;
        @AuraEnabled public boolean isFourGroupOfShifts;
        
        @AuraEnabled public integer splitShiftLength=0;
        @AuraEnabled public boolean isSplitSingleGroupRecord;
        @AuraEnabled public boolean isSplitTwoGroupOfShifts;
        @AuraEnabled public boolean isSplitThreeGroupOfShifts;
        @AuraEnabled public boolean isSplitFourGroupOfShifts;
       
        
    }
    
    public class ShiftWrapper {
        @AuraEnabled public String Id;
        @AuraEnabled  public String ShiftStreet;
        @AuraEnabled  public String ShiftCity;
        @AuraEnabled  public string ShiftTime;
        @AuraEnabled  public string status;
        @AuraEnabled  public string Facility;
        @AuraEnabled  public string Notes;
        @AuraEnabled  public string AddAhiftId; 
        @AuraEnabled  public string participantName;
        @AuraEnabled public  string participantImage;
        @AuraEnabled public boolean isFirstRecordType ;
        @AuraEnabled public boolean isSplitShift=false;
        @AuraEnabled public string splitShiftColor;
        @AuraEnabled public string spliShiftHeight;
        @AuraEnabled public boolean isSpliFirstRecord; 
        @AuraEnabled public string SplitShiftUi; 
        @AuraEnabled public boolean isSecondRecord ;
        @AuraEnabled public boolean isThirdRecord ;
        @AuraEnabled public boolean isFourthRecord ;
        @AuraEnabled public string uiStatus ;
        @AuraEnabled public string refID;
        @AuraEnabled public boolean isRecurring;
        @AuraEnabled public string inLineHeight;
        @AuraEnabled public string inLineColor;
        @AuraEnabled public string originalColor;
        @AuraEnabled public string shiftType;
        @AuraEnabled public string serviceName;
        @AuraEnabled public Decimal   shiftRate;
         @AuraEnabled public String splitShiftRefId; 
      
        
    }
     @AuraEnabled
    public static void deleterecurShifts(string refId ,string recurDate){
        date sDate=date.valueof(recurDate);
        system.debug('sDate ' +sDate);
        list<ShiftWithStaff__c> recurShifts=[select id from ShiftWithStaff__c where RefId__c=:refId and  date__c>=: sDate];
       
        delete recurShifts;
    }
    

}