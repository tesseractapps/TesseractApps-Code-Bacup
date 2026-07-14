public class RosterTimeSheetController {
    
    public class StaffShiftWrapper {
        @AuraEnabled public Id staffId;
        @AuraEnabled public String staffName;
        @AuraEnabled public String nameToDisplay; // ← New field
        @AuraEnabled public Decimal totalDuration;
        @AuraEnabled public List<ShiftwithStaff__c> shifts;
        
        public StaffShiftWrapper(Id staffId, String staffName, String nameToDisplay) {
            this.staffId = staffId;
            this.staffName = staffName;
            this.nameToDisplay = nameToDisplay;
            this.shifts = new List<ShiftwithStaff__c>();
            this.totalDuration = 0;
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static List<StaffShiftWrapper> getStaffShiftData(List<Id> staffIds, Date weekStartDate, Date weekEndDate) {
        List<StaffShiftWrapper> result = new List<StaffShiftWrapper>();

        if (staffIds == null || staffIds.isEmpty()) {
            return result;
        }

        String currentUserId = UserInfo.getUserId();
        User currentUser = [
            SELECT Id, Organization_Name__c, User_Type__c, Email  
            FROM User 
            WHERE Id = :currentUserId 
            LIMIT 1
        ];

        List<Id> targetStaffIds = new List<Id>();

        if (currentUser.User_Type__c == 'NDIS Staff') {
            List<Staff__c> staffListId = [
                SELECT Id 
                FROM Staff__c 
                WHERE Email_Address__c = :currentUser.Email 
                LIMIT 1
            ];
            if (!staffListId.isEmpty()) {
                targetStaffIds.add(staffListId[0].Id);
            }
        } else {
            targetStaffIds.addAll(staffIds);
        }
        System.debug('targetStaffIds >> ' + targetStaffIds);

        List<Staff__c> staffList = [
            SELECT Id, Name, NameToDisplay__c,Display_Nickname__c,
            (SELECT Id, Name, Approval_Status__c, Date__c, Start_Time__c, End_Time__c, Duration__c, Staff__r.NameToDisplay__c,Staff__r.Display_Nickname__c,
                Status__c, Add_Shift_Duration_hh_mm__c, Actual_Duration_In_Hours_and_Mins__c, Actual_Duration__c, Shift_Type__c,Shift_Category__c,SIL__c,Over_Time_Tier_Two_Rate__c,Over_Time_Tier_One__c,
                Login_Time_Formula__c, Logout_Time_Formula__c, Start_time_Formula__c, End_time_formula__c,Extended_Duration__c,
                Sleepover_Shift_Hours__c, Variance_Wage__c, Log_In_Date_Time__c, Log_Out_Date_Time__c, Buffer_Time_Formula__c,
                Type_of_shift__c, Break__c, Long_Sleepover_Duartion__c,Attendence__c,
                (SELECT Id, Name, Client__c, Client__r.First_Name__c, Client__r.Last_Name__c, Service_Type_Name__c,
                    Support_Item_Name__c, Funds_Tracker__r.Name 
                FROM Services_and_Support_Plans__r),
                (SELECT Id, Name, Amount__c, Mileage_Others__c, Mileage_Amount__c, Approval_Status__c 
                FROM Reimbursements__r 
                WHERE Approval_Status__c = 'Approved')
            FROM ShiftwithStaffs__r
            WHERE Date__c >= :weekStartDate AND Date__c <= :weekEndDate
            AND Attendence__c = true
            ORDER BY Date__c, Start_Time__c)
            FROM Staff__c
            WHERE Id IN :targetStaffIds
        ];

        for (Staff__c staff : staffList) {
            StaffShiftWrapper wrapper = new StaffShiftWrapper(
                staff.Id,
                staff.Name,
                staff.NameToDisplay__c
            );

            if (staff.ShiftwithStaffs__r != null) {
                for (ShiftwithStaff__c shift : staff.ShiftwithStaffs__r) { wrapper.shifts.add(shift); wrapper.totalDuration += (shift.Duration__c != null ? shift.Duration__c : 0);
                }
            }

            result.add(wrapper);
        }

        return result;
    }

    @AuraEnabled
    public static void updateAllocations(list<string> shiftIDlist){ 
        system.debug('ShiftIDList'+shiftIDlist);
        list<ShiftwithStaff__c> shiftStaffList =[select id,staff__c,Date__c,Actual_Duration__c,Log_In_Date_Time__c,Log_Out_Date_Time__c,Type_of_shift__c,Afternoon_shift_Hourly_Rate__c,End_Date__c,Public_holiday_Hourly_Rate__c,Public_Holiday_hours__c,Public_holiday__c,Recur_Holiday__c,Shift_Cancel_Payment__c,Status__c,
                                                 Afternoon_Shift_hours__c,Night_shift_Hourly_Rate__c,Night_Shift_Hours__c,Saturday_Hourly_Rate__c,Saturday_hours__c,General_Shift_Hourly_Rate__c,General_Shift_Hours__c,Sleepover_Shift_Hourly_Rate__c,	Sleepover_Shift_Hours__c,Over_Time_Tier_One_Wage__c,Over_Time_Tier_Two_Wage__c,Over_Time_Tier_One__c,Over_Time_Tier_One_Rate__c,Over_Time_Tier_Two__c,Over_Time_Tier_Two_Rate__c,
                                                 Sunday_Hourly_Rate__c,Sunday_hours__c,Approval_Status__c,Day_Name__c,Sleepover_Night_Shift_hours__c,Sleepover_Night_Shift_Hourly_Rate__c,Extended_Duration__c,Variance_Rate__c,Long_Morning_Hourly_Rate__c,Long_Morning_Shift_Duartion__c,Broken_Extended_Duration__c,Broken_Extended_Rate__c,Broken_Extended_Wage__c,Broken_Shift__c,Broken_Shift_Allowance__c,
                                                 Long_Afternoon_Hourly_Rate__c,Long_Afternoon_Shift_Duartion__c,Long_Night_Hourly_Rate__c,Long_Night_Shift_Duartion__c,Long_Sleepover_Allowance__c,Long_Sleepover_Duartion__c,Long_Afternoon_Rate_Two__c,Long_Afternoon_Duration_Two__c,Long_Morning_Rate_Two__c,Long_Morning_Duartion_Two__c,
                                                 (select id,Approval_Status__c,Amount__c from Reimbursements__r where Approval_Status__c='Approved'),
                                                 (SELECT Id,Break_Time__c,isBreakIncluded__c  FROM Break_Timings__r WHERE Break_Time__c != null  AND isBreakIncluded__c = true) from //Mileage__c
                                                 ShiftwithStaff__c where id IN :shiftIDlist ]; 
        system.debug('Shift==>'+shiftStaffList);
        List<ShiftwithStaff__c> shiftList=new List<ShiftwithStaff__c>();
        List<Allocation__c> alocList=new List<Allocation__c>(); 
        try {
            for (ShiftwithStaff__c ss : shiftStaffList) {
                if ((ss.Log_In_Date_Time__c != null && ss.Log_Out_Date_Time__c != null) || (ss.Status__c=='Cancelled') ) {
                    ss.Approval_Status__c = 'Approved';
                    shiftList.add(ss);
                    
                    Decimal totalBreakMinutes = 0;

                    if (ss.Break_Timings__r != null && !ss.Break_Timings__r.isEmpty()) {
                        for (Break_Timings__c breakRec : ss.Break_Timings__r) {
                            if (breakRec.Break_Time__c != null && breakRec.Break_Time__c.contains(':')) {
                                List<String> timeParts = breakRec.Break_Time__c.split(':');
                                if (timeParts.size() == 2) {
                                    Integer hours = Integer.valueOf(timeParts[0]);
                                    Integer minutes = Integer.valueOf(timeParts[1]);
                                    if (hours != null && minutes != null) {
                                        totalBreakMinutes += (hours * 60) + minutes;
                                    }
                                }
                            }
                        }
                    }
                    
                    Decimal totalBreakHours = totalBreakMinutes / 60;
                    Decimal actualDuration = ss.Actual_Duration__c != null ? ss.Actual_Duration__c : 0;
                    Decimal effectiveWorkingHours = actualDuration - totalBreakHours;
                    if (effectiveWorkingHours < 0) {
                        effectiveWorkingHours = 0;
                    }
                    effectiveWorkingHours = effectiveWorkingHours.setScale(2, RoundingMode.HALF_UP);
                    System.debug('✅ Final Total Break in Hours : ' + totalBreakHours);
                    System.debug('✅ effectiveWorkingHours : ' + effectiveWorkingHours);
                    Allocation__c alocRec = new Allocation__c();
                    alocRec.End_Date__c = ss.End_Date__c;
                    alocRec.Start_Date__c = ss.Date__c;
                   // alocRec.Working_Hours__c = ss.Actual_Duration__c;
                    alocRec.Working_Hours__c = effectiveWorkingHours;
                    alocRec.Extended_Hours__c = ss.Extended_Duration__c > 0 ? ss.Extended_Duration__c : 0;
                    alocRec.Extended_Hourly_Rate__c = ss.Variance_Rate__c > 0 ? ss.Variance_Rate__c : 0;

                    alocRec.Over_Time_Tier_One__c = ss.Over_Time_Tier_One__c > 0 ? ss.Over_Time_Tier_One__c : 0;
                    alocRec.Over_Time_Tier_One_Rate__c = ss.Over_Time_Tier_One_Rate__c > 0 ? ss.Over_Time_Tier_One_Rate__c : 0;
                    alocRec.Over_Time_Tier_One_Wage__c = ss.Over_Time_Tier_One_Wage__c > 0 ? ss.Over_Time_Tier_One_Wage__c : 0;

                    alocRec.Over_Time_Tier_Two__c = ss.Over_Time_Tier_Two__c > 0 ? ss.Over_Time_Tier_Two__c : 0;
                    alocRec.Over_Time_Tier_Two_Rate__c = ss.Over_Time_Tier_Two_Rate__c > 0 ? ss.Over_Time_Tier_Two_Rate__c : 0;
                    alocRec.Over_Time_Tier_Two_Wage__c = ss.Over_Time_Tier_Two_Wage__c > 0 ? ss.Over_Time_Tier_Two_Wage__c : 0;

                     // ⛔ Step 1: Handle Sleepover FIRST and skip further logic

                      if(ss.Broken_Shift__c==true){ alocRec.Broken_Allowance__c=ss.Broken_Shift_Allowance__c; alocRec.Broken_Extended_Rate__c=ss.Broken_Extended_Rate__c; alocRec.Broken_Extended_Wage__c=ss.Broken_Extended_Wage__c; alocRec.Broken_Extended_Duration__c=ss.Broken_Extended_Duration__c;
                       }
                       if (ss.Status__c=='Cancelled'){
                            alocRec.Shift_Cancel_Payment__c=ss.Shift_Cancel_Payment__c;
                            alocRec.Shift_Cancelled__c=true;
                       }
                    
                    // ⛔ Step 1: Handle Sleepover FIRST and skip further logic
                    else   if (ss.Type_of_shift__c == 'Sleepover Shift') {
                            alocRec.Sleepover_Shift_Hourly_Rate__c = ss.Sleepover_Shift_Hourly_Rate__c;
                            alocRec.Sleepover_Shift_Hours__c = ss.Sleepover_Shift_Hours__c;
                            alocRec.Sleepover_Night_shift_hours__c = ss.Sleepover_Night_Shift_hours__c != null ? ss.Sleepover_Night_Shift_hours__c : 0;
                            alocRec.Sleepover_Night_Shift_hourly_rate__c = ss.Sleepover_Night_Shift_Hourly_Rate__c != null ? ss.Sleepover_Night_Shift_Hourly_Rate__c : 0;
                            alocRec.Sleep_Over_Allocation__c = true;
                        }
                    // ✅ Step 2: If not sleepover, check for holiday
                    else if ((ss.Public_holiday__c == true || ss.Recur_Holiday__c == true)) {
                        alocRec.Public_Holiday_Hour_Rate__c = ss.Public_holiday_Hourly_Rate__c;
                        alocRec.Public_Holiday_Hours__c = ss.Public_Holiday_hours__c;
                    }
                    // ✅ Step 3: Else check for Saturday/Sunday
                    else if (ss.Day_Name__c == 'Saturday') {
                        if(ss.Type_of_shift__c == 'Custom'){
                         alocRec.Is_Custom_Shift__c = true;
                            alocRec.Long_Morning_Hourly_Rate__c = ss.Long_Morning_Hourly_Rate__c;
                            alocRec.Long_Morning_Shift_Duartion__c = ss.Long_Morning_Shift_Duartion__c;
                            alocRec.Long_Afternoon_Hourly_Rate__c = ss.Long_Afternoon_Hourly_Rate__c;
                            alocRec.Long_Afternoon_Shift_Duartion__c = ss.Long_Afternoon_Shift_Duartion__c;
                            alocRec.Long_Night_Hourly_Rate__c = ss.Long_Night_Hourly_Rate__c;
                            alocRec.Long_Night_Shift_Duartion__c = ss.Long_Night_Shift_Duartion__c;
                            alocRec.Long_Sleepover_Allowance__c = ss.Long_Sleepover_Allowance__c;
                            alocRec.Long_Sleepover_Duartion__c = ss.Long_Sleepover_Duartion__c;
                            alocRec.Long_Afternoon_Duration_Two__c=ss.Long_Afternoon_Duration_Two__c;
                            alocRec.Long_Afternoon_Rate_Two__c=ss.Long_Afternoon_Rate_Two__c;
                            alocRec.Long_Morning_Rate_Two__c=ss.Long_Morning_Rate_Two__c;
                            alocRec.Long_Moring_Duration_Two__c=ss.Long_Morning_Duartion_Two__c;
                        }else{
                        alocRec.Saturday_Hourly_Rate__c = ss.Saturday_Hourly_Rate__c;
                        alocRec.Saturday_Hours__c = ss.Saturday_hours__c;
                        }    
                    } else if (ss.Day_Name__c == 'Sunday') {
                         if(ss.Type_of_shift__c == 'Custom'){
                            alocRec.Is_Custom_Shift__c = true;
                             alocRec.Long_Morning_Hourly_Rate__c = ss.Long_Morning_Hourly_Rate__c;
                             alocRec.Long_Morning_Shift_Duartion__c = ss.Long_Morning_Shift_Duartion__c;
                             alocRec.Long_Afternoon_Hourly_Rate__c = ss.Long_Afternoon_Hourly_Rate__c;
                             alocRec.Long_Afternoon_Shift_Duartion__c = ss.Long_Afternoon_Shift_Duartion__c;
                             alocRec.Long_Night_Hourly_Rate__c = ss.Long_Night_Hourly_Rate__c;
                             alocRec.Long_Night_Shift_Duartion__c = ss.Long_Night_Shift_Duartion__c;
                             alocRec.Long_Sleepover_Allowance__c = ss.Long_Sleepover_Allowance__c;
                             alocRec.Long_Sleepover_Duartion__c = ss.Long_Sleepover_Duartion__c;
                             alocRec.Long_Afternoon_Duration_Two__c=ss.Long_Afternoon_Duration_Two__c;
                             alocRec.Long_Afternoon_Rate_Two__c=ss.Long_Afternoon_Rate_Two__c;
                             alocRec.Long_Morning_Rate_Two__c=ss.Long_Morning_Rate_Two__c;
                             alocRec.Long_Moring_Duration_Two__c=ss.Long_Morning_Duartion_Two__c;
                        }else{
                        alocRec.Sunday_Hourly_Rate__c = ss.Sunday_Hourly_Rate__c;
                        alocRec.Sunday_hours__c = ss.Sunday_hours__c;
                        }
                    }
                    // ✅ Step 4: Else handle standard shifts
                    else {
                        switch on ss.Type_of_shift__c {
                            when 'General'{
                                alocRec.General_Hourly_pay_rate__c = ss.General_Shift_Hourly_Rate__c;
                                alocRec.General_Working_Hours__c = ss.General_Shift_Hours__c;
                            }
                            when 'Morning' {
                                alocRec.Morning_Hourly_pay_rate__c = ss.General_Shift_Hourly_Rate__c;
                                alocRec.Morning_Working_Hours__c = ss.General_Shift_Hours__c;
                            }
                            when 'Afternoon' {
                                alocRec.Afternoon_shift_Hourly_Rate__c = ss.Afternoon_shift_Hourly_Rate__c;
                                alocRec.Afternoon_Shift_hours__c = ss.Afternoon_Shift_hours__c;
                            }
                            when 'Night' {
                                alocRec.Night_shift_Hourly_Rate__c = ss.Night_shift_Hourly_Rate__c;
                                alocRec.Night_Shift_Hours__c = ss.Night_Shift_Hours__c;
                            }
                            when 'Custom' {
                                alocRec.Is_Custom_Shift__c = true;
                                alocRec.Long_Morning_Hourly_Rate__c = ss.Long_Morning_Hourly_Rate__c;
                                alocRec.Long_Morning_Shift_Duartion__c = ss.Long_Morning_Shift_Duartion__c;
                                alocRec.Long_Afternoon_Hourly_Rate__c = ss.Long_Afternoon_Hourly_Rate__c;
                                alocRec.Long_Afternoon_Shift_Duartion__c = ss.Long_Afternoon_Shift_Duartion__c;
                                alocRec.Long_Night_Hourly_Rate__c = ss.Long_Night_Hourly_Rate__c;
                                alocRec.Long_Night_Shift_Duartion__c = ss.Long_Night_Shift_Duartion__c;
                                alocRec.Long_Sleepover_Allowance__c = ss.Long_Sleepover_Allowance__c;
                                alocRec.Long_Sleepover_Duartion__c = ss.Long_Sleepover_Duartion__c;
                                alocRec.Long_Afternoon_Duration_Two__c=ss.Long_Afternoon_Duration_Two__c;
                                alocRec.Long_Afternoon_Rate_Two__c=ss.Long_Afternoon_Rate_Two__c;
                                alocRec.Long_Morning_Rate_Two__c=ss.Long_Morning_Rate_Two__c;
                                alocRec.Long_Moring_Duration_Two__c=ss.Long_Morning_Duartion_Two__c;
                                
                            }
                        }
                    }
                    
                    // Common fields
                    alocRec.Start_Date_Time__c = ss.Log_In_Date_Time__c;
                    alocRec.End_Date_Time__c = ss.Log_Out_Date_Time__c;
                    alocRec.Staff__c = ss.Staff__c;
                    alocRec.ShiftwithStaff__c = ss.Id;
                    alocRec.status__c = 'Approved';
                    alocList.add(alocRec);
                }
            }
            if(shiftList.size()!=0){
                update shiftList;    
            }    
            if(alocList.size()!=0){
                insert alocList;    }  System.debug('Approved Allocation' +alocList); }catch (Exception e) { throw new AuraHandledException(e.getMessage());
        } 
    }
    
    @AuraEnabled(cacheable=true)
    public static CheckListWrapper getCheckListByShiftId(String addShiftId) {
        system.debug('shiftId >>'+ addShiftId);
        try {
            if (String.isEmpty(addShiftId) || addShiftId.trim().length() == 0) {
                return new CheckListWrapper(false, 'Error: Shift ID is required and cannot be empty.', null);
            } 
            
            ShiftwithStaff__c shiftrecord = [Select Id,Add_Shift__c From ShiftwithStaff__c Where Id= :addShiftId];           
            List<Add_Shift_Checklist__c> checklistRecords = [SELECT Id, Name, Add_Shift__c, Mandatory__c, Description__c, Completed__c FROM Add_Shift_Checklist__c WHERE Add_Shift__c = :shiftrecord.Add_Shift__c or  ShiftwithStaff__c = :shiftrecord.Id ];
            system.debug(' checklistRecords '+checklistRecords);
            List<CheckListItem> checklist = new List<CheckListItem>();
            for (Add_Shift_Checklist__c item : checklistRecords) {
                checklist.add(new CheckListItem(item));
            }
            system.debug(' CheckList '+checklist);
            return new CheckListWrapper(true, 'CheckList list processed successfully', checklist); } catch (Exception e) { return new CheckListWrapper(false, 'Error processing check list: ' + e.getMessage(), null);
        }
    }
    
    public class CheckListWrapper {
        @AuraEnabled public Boolean success;
        @AuraEnabled public String message;
        @AuraEnabled public List<CheckListItem> checklist;
        
        public CheckListWrapper(Boolean success, String message, List<CheckListItem> checklist) {
            this.success = success;
            this.message = message;
            this.checklist = checklist;
        }
    }
    
    public class CheckListItem {
        @AuraEnabled public String id;
        @AuraEnabled public String checkListNum;
        @AuraEnabled public String addShiftId;
        @AuraEnabled public Boolean isMandatory;
        @AuraEnabled public String description;
        @AuraEnabled public Boolean isCompleted;
        
        public CheckListItem(Add_Shift_Checklist__c item) {
            this.id = item.Id;
            this.checkListNum = item.Name;
            this.addShiftId = item.Add_Shift__c;
            this.isMandatory = item.Mandatory__c;
            this.description = item.Description__c;
            this.isCompleted = item.Completed__c;
        }
    }

    @AuraEnabled
    public static void editAllocation(String allocationId) {
        System.debug('allocationId >> ' + allocationId);

        // Query the Shiftwithstaff__c record and its related Allocations
        Shiftwithstaff__c shiftRecord = [
            SELECT Id, Approval_Status__c, (SELECT Id FROM Allocations__r)
            FROM Shiftwithstaff__c
            WHERE Id = :allocationId
            LIMIT 1
        ];

        // Collect Allocation__c IDs to delete
        List<Allocation__c> allocationsToDelete = new List<Allocation__c>();
        for (Allocation__c alloc : shiftRecord.Allocations__r) {
            allocationsToDelete.add(alloc);
        }

        // Set Approval_Status__c to 'Pending'
        shiftRecord.Approval_Status__c = 'Pending';
        update shiftRecord;

        // Delete child records if any found
        if (!allocationsToDelete.isEmpty()) {
            delete allocationsToDelete;
            System.debug('Deleted Allocations: ' + allocationsToDelete);
        } else {
            System.debug('No Allocations found to delete.');
        }
    }

    @AuraEnabled
    public static List<Public_Holiday__c> holidayListbyOrg(String state) {
        Map<String, String> stateMap = new Map<String, String>{
            'NSW' => 'New South Wales',
            'VIC' => 'Victoria',
            'QLD' => 'Queensland',
            'SA' => 'South Australia',
            'WA' => 'Western Australia',
            'TAS' => 'Tasmania',
            'ACT' => 'Australian Capital Territory',
            'NT' => 'Northern Territory'
        };
        
        String mappedState = stateMap.containsKey(state) ? stateMap.get(state) : null;
        
        if (mappedState == null) {
            return new List<Public_Holiday__c>();
        }
        
        List<Public_Holiday__c> publicHolidays = [
            SELECT Date__c, Holiday_Name__c, State__c 
            FROM Public_Holiday__c 
            WHERE State__c INCLUDES (:mappedState)
        ];
        
        return publicHolidays;
    }


    @AuraEnabled
    public static List<Staff__c> StaffsRolesWiseList(String orgId, List<String> facIdlist, List<String> roles, String name) {
        List<Staff__c> staffList = new List<Staff__c>();

        String currentUserId = UserInfo.getUserId();
        User currentUser = [
            SELECT Id, Organization_Name__c, User_Type__c, Email  
            FROM User 
            WHERE Id = :currentUserId 
            LIMIT 1
        ];

        String trucatedStr = orgId != null && orgId.length() > 15 ? orgId.substring(0, 15) : orgId;

        if (currentUser.User_Type__c == 'NDIS Staff') {
            // Return only the Staff record matching current user's email
            staffList = [
                SELECT Id, Set_Hours__c, picture__c, Name, Last_Name__c, Role__c, Working_Hours_Rate__c, 
                    Saturday_Hourly_Rate__c, Sunday_Hourly_Rate__c, Public_holiday_Hourly_Rate__c, 
                    Afternoon_shift_Hourly_Rate__c, Night_shift_Hourly_Rate__c, Attendance__c, NameToDisplay__c,
                    SCR__c, Classification_Level__c, Classification_Pay_Point__c, Class_and_Paypont__c,
                    (SELECT Id, Type_of_Leave__c, From__c, To__c, Reason__c, Status__c, Leave_Document__c, Duration__c, Approved_by__c, Comments__c 
                        FROM Leaves__r WHERE Status__c = 'Approved')
                FROM Staff__c 
                WHERE Email_Address__c = :currentUser.Email
                LIMIT 1
            ];
        } else {
            // Build dynamic query for other user types
            String query = 'SELECT Id, Set_Hours__c, picture__c, Name, Last_Name__c, Role__c, Working_Hours_Rate__c,Display_Nickname__c, ' +
                        'Saturday_Hourly_Rate__c, Sunday_Hourly_Rate__c, Public_holiday_Hourly_Rate__c, ' +
                        'Afternoon_shift_Hourly_Rate__c, Night_shift_Hourly_Rate__c, Attendance__c, NameToDisplay__c, ' +
                        'SCR__c, Classification_Level__c, Classification_Pay_Point__c, Class_and_Paypont__c, ' +
                        '(SELECT Id, Type_of_Leave__c, From__c, To__c, Reason__c, Status__c, Leave_Document__c, Duration__c, Approved_by__c, Comments__c ' +
                        ' FROM Leaves__r WHERE Status__c = \'Approved\') ' +
                        'FROM Staff__c ' +
                        'WHERE Organization_Name__c = :trucatedStr AND Facility__r.Status__c = true AND Status__c = true';

            if (facIdlist != null && facIdlist.size() > 0) {
              //  query += ' AND Facility__c IN :facIdlist';
              query += ' AND ID IN (SELECT Staff__c FROM Staff_Facility__c WHERE Active__c = true AND Facility__c IN :facIdlist) ';
            }

            if (roles != null && roles.size() > 0) {
                List<String> includesConditions = new List<String>();
                for (String role : roles) {
                    includesConditions.add('Role__c INCLUDES (\'' + String.escapeSingleQuotes(role) + '\')');
                }
                query += ' AND (' + String.join(includesConditions, ' OR ') + ')';
            }

            if (name != null && name.trim() != '') {
                query += ' AND NameToDisplay__c LIKE \'%' + String.escapeSingleQuotes(name) + '%\'';
            }

            // ✅ Add sorting here
            query += ' ORDER BY Display_Nickname__c ASC';

            staffList = Database.query(query);
        }

        System.debug('Staff List returned: ' + staffList);
        return staffList;
    }

    @AuraEnabled(cacheable=false)
    public static List<ShiftwithStaff__c> getMismatchedShifts(String staffId, Date weekStart, Date weekEnd) {
        List<ShiftwithStaff__c> mismatchedShifts = [
            SELECT Id, Name, Approval_Status__c, Date__c, Start_Time__c, End_Time__c, Duration__c,Facility__c, Buffer_Time_Formula__c,Shift_Category__c,SIL__c,Over_Time_Tier_Two_Rate__c,Over_Time_Tier_One__c,
                Shift_Address__Street__s,Shift_Address__City__s,Shift_Address__StateCode__s,Shift_Address__PostalCode__s,Shift_Address__CountryCode__s,Type_of_Address__c,
                Staff__c, Staff__r.NameToDisplay__c, Status__c, Add_Shift_Duration_hh_mm__c,Staff__r.Facility__r.Type_of_Service__c,
                Actual_Duration_In_Hours_and_Mins__c, Actual_Duration__c, Shift_Type__c,
                Login_Time_Formula__c, Logout_Time_Formula__c, Start_time_Formula__c, End_time_formula__c,
                Extended_Duration__c, Sleepover_Shift_Hours__c, Variance_Wage__c, Log_In_Date_Time__c,Attendence__c,
                Log_Out_Date_Time__c, Type_of_shift__c, Break__c, Long_Sleepover_Duartion__c,Client_Signature__c,Shift_Cancel_Notes__c,
                (SELECT Id, Name, Client__c, Client__r.First_Name__c, Client__r.Last_Name__c,SIL_Service__c,SIL_Service_Name__c,
                        Service_Type_Name__c, Support_Item_Name__c, Funds_Tracker__r.Name 
                FROM Services_and_Support_Plans__r),
                (SELECT Id, Name, Amount__c, Mileage_Others__c, Mileage_Amount__c, Approval_Status__c 
                FROM Reimbursements__r 
                WHERE Approval_Status__c = 'Approved'),
            	(SELECT Id, ShiftwithStaff__c, isBreakIncluded__c, Break_Time__c FROM Break_Timings__r WHERE isBreakIncluded__c = true AND Break_Time__c != null)
            FROM ShiftwithStaff__c
            WHERE Staff__c = :staffId
                AND Date__c >= :weekStart AND Date__c <= :weekEnd 
                AND Attendence__c = true
            ORDER BY Date__c, Start_Time__c
        ];
        
        return mismatchedShifts;
    }
    
	/*@AuraEnabled
    public static Decimal getTotalBreakHours(List<Id> shiftIDlist) {
        Decimal totalBreakInMinutes = 0;
    
        // 1. Query all checked break records for these shifts
        List<Break_Timings__c> breakRecords = [
            SELECT Id, ShiftwithStaff__c, isBreakIncluded__c, Break_Time__c 
            FROM Break_Timings__c
            WHERE ShiftwithStaff__c IN :shiftIDlist
            AND isBreakIncluded__c = true
            AND Break_Time__c != null
        ];
    	System.debug('🔎 Retrieved break records count: ' + breakRecords.size());
        // 2. Sum total break duration
        for (Break_Timings__c b : breakRecords) {
           // totalBreakInMinutes += b.Break_Time__c;
            System.debug('➡️ Processing Break Record - Id: ' + b.Id + ', Break_Time__c: ' + b.Break_Time__c);
           try {
                // Parse HH:mm string
                List<String> parts = b.Break_Time__c.split(':');
                if (parts.size() == 2) {
                    Integer hours = Integer.valueOf(parts[0]);
                    Integer minutes = Integer.valueOf(parts[1]);
                    //totalBreakInMinutes += (hours * 60) + minutes;
                    Integer totalThisBreak = (hours * 60) + minutes;
                	System.debug('⏱ Break Time - Hours: ' + hours + ', Minutes: ' + minutes + ', Total Minutes: ' + totalThisBreak);

                	totalBreakInMinutes += totalThisBreak;
                	System.debug('➕ Accumulated Break Minutes: ' + totalBreakInMinutes);
                }
            } catch (Exception e) {
                System.debug('⚠️ Failed to parse Break_Time__c: ' + b.Break_Time__c + ' Error: ' + e.getMessage());
            }
        }
        
        Decimal totalBreakInHours = totalBreakInMinutes / 60;
		System.debug('✅ Final Total Break in Hours: ' + totalBreakInHours);
    	return totalBreakInHours.setScale(2);
    }*/

    // Wrapper → now holds ONLY Dynamic Form Id
    public class ServiceAndSupportPlanWrapper {
        @AuraEnabled public Id dynamicFormId;

        public ServiceAndSupportPlanWrapper(Id formId) {
            this.dynamicFormId = formId;
        }
    }

    // Parent wrapper
    public class ShiftWrapper {
        @AuraEnabled public Id shiftId;
        @AuraEnabled public List<ServiceAndSupportPlanWrapper> serviceAndSupportPlans;

        public ShiftWrapper(Id shiftId) {
            this.shiftId = shiftId;
            this.serviceAndSupportPlans = new List<ServiceAndSupportPlanWrapper>();
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<ShiftWrapper> getShiftServiceAndSupportPlans(List<Id> shiftIds) {

        List<ShiftWrapper> result = new List<ShiftWrapper>();

        if (shiftIds == null || shiftIds.isEmpty()) { return result;
        }

        // 🔹 1. Fetch Shifts with Plans
        List<ShiftwithStaff__c> shifts = [
            SELECT Id,
                (SELECT Client__c
                 FROM Services_and_Support_Plans__r)
            FROM ShiftwithStaff__c
            WHERE Id IN :shiftIds
        ];

        // 🔹 2. Collect all Client Ids
        Set<Id> clientIds = new Set<Id>();

        for (ShiftwithStaff__c shift : shifts) {
            if (shift.Services_and_Support_Plans__r != null) {
                for (Services_and_Support_Plan__c plan : shift.Services_and_Support_Plans__r) { if (plan.Client__c != null) { clientIds.add(plan.Client__c);
                    }
                }
            }
        }

        // 🔹 3. Fetch Dynamic Forms by Client
        List<Dynamic_Form_Response__c> dynamicForms = [
            SELECT Id, Client_Id__c, Form_Response_From_Mobile__c
            FROM Dynamic_Form_Response__c
            WHERE Client_Id__c IN :clientIds
        ];

        // 🔹 4. Map Client → Dynamic Forms
        Map<Id, List<Dynamic_Form_Response__c>> clientToFormsMap = new Map<Id, List<Dynamic_Form_Response__c>>();

        for (Dynamic_Form_Response__c df : dynamicForms) { if (!clientToFormsMap.containsKey(df.Client_Id__c)) { clientToFormsMap.put(df.Client_Id__c, new List<Dynamic_Form_Response__c>()); } clientToFormsMap.get(df.Client_Id__c).add(df);
        }

        // 🔹 5. Final Processing
        for (ShiftwithStaff__c shift : shifts) {

            ShiftWrapper shiftWrap = new ShiftWrapper(shift.Id);

            // Prevent duplicates
            Set<Id> addedFormIds = new Set<Id>();

            if (shift.Services_and_Support_Plans__r != null) {
                for (Services_and_Support_Plan__c plan : shift.Services_and_Support_Plans__r) {

                    if (plan.Client__c != null && clientToFormsMap.containsKey(plan.Client__c)) {

                        List<Dynamic_Form_Response__c> forms = clientToFormsMap.get(plan.Client__c);

                        for (Dynamic_Form_Response__c df : forms) {

                            String formText = df.Form_Response_From_Mobile__c;

                            // 🔴 LONG TEXT MATCH (Shift Id inside text)
                            if (String.isNotBlank(formText) &&
                                formText.contains(String.valueOf(shift.Id))) {

                                // Avoid duplicates
                                if (!addedFormIds.contains(df.Id)) {
                                    shiftWrap.serviceAndSupportPlans.add(
                                        new ServiceAndSupportPlanWrapper(df.Id)
                                    );
                                    addedFormIds.add(df.Id);
                                }
                            }
                        }
                    }
                }
            }

            result.add(shiftWrap);
        }

        return result;
    }

    public class JournalWrapper {
        @AuraEnabled public Id id;
        @AuraEnabled public String description;
        @AuraEnabled public String createdDate;
        @AuraEnabled public String lastModifiedDate;
        @AuraEnabled public String createdByName;
        @AuraEnabled public String createdByPhoto;
        @AuraEnabled public String careNotes;

        @AuraEnabled public String staffName;
        @AuraEnabled public String staffLastName;
        @AuraEnabled public String staffPicture;
        @AuraEnabled public String StaffFullName;

        @AuraEnabled public List<ChildJournalWrapper> childJournals;
    }

    public class ChildJournalWrapper {
        @AuraEnabled public String description;
        @AuraEnabled public String createdDate;
        @AuraEnabled public String lastModifiedDate;
        @AuraEnabled public String createdByName;
        @AuraEnabled public String createdByPhoto;
        @AuraEnabled public String careNotes;
        
        @AuraEnabled public String reason;

        @AuraEnabled public String staffName;
        @AuraEnabled public String staffLastName;
        @AuraEnabled public String staffPicture;
        @AuraEnabled public String StaffFullName;
    }

    public static String formatDateTime(Datetime dt) {
        if (dt == null) return '';
        return dt.format('dd/MM/yyyy hh:mm a');
    }

    @AuraEnabled
    public static Map<String, Object> getClientJournals(Id shiftId) {

        Map<String, Object> result = new Map<String, Object>();

        if (shiftId == null) {
            result.put('success', false);
            result.put('message', 'Shift Id is null');
            return result;
        }

        String query = 'SELECT Id, Description__c, CreatedDate, LastModifiedDate, ' +
            'CreatedBy.Name, CreatedBy.SmallPhotoUrl, Care_Notes__c, Reason__c, ' +
            'Staff__r.Name, Staff__r.Last_Name__c, Staff__r.Picture__c, Staff__r.Display_Nickname__c, ' +
            '(SELECT Description__c, CreatedDate, LastModifiedDate, ' +
            'CreatedBy.Name, CreatedBy.SmallPhotoUrl, Care_Notes__c, Reason__c, ' +
            'Staff__r.Name, Staff__r.Last_Name__c, Staff__r.Picture__c, Staff__r.Display_Nickname__c ' +
            'FROM Client_Journels__r ORDER BY CreatedDate DESC) ' +
            'FROM Client_Journel__c ' +
            'WHERE ShiftwithStaff__c = :shiftId ' +
            'AND Original_Client_Journel__c = NULL ' +
            'ORDER BY CreatedDate DESC';

        List<Client_Journel__c> clientJournals = Database.query(query);

        List<JournalWrapper> wrapperList = new List<JournalWrapper>();

        for (Client_Journel__c rec : clientJournals) {

            JournalWrapper jw = new JournalWrapper();

            // Parent
            jw.id = rec.Id;
            jw.description = stripHtml(rec.Description__c);
            jw.createdDate = formatDateTime(rec.CreatedDate);
            jw.lastModifiedDate = formatDateTime(rec.LastModifiedDate);
            jw.createdByName = rec.CreatedBy.Name;
            jw.createdByPhoto = rec.CreatedBy.SmallPhotoUrl;
            jw.careNotes = rec.Care_Notes__c;

            if (rec.Staff__r != null) { jw.staffName = rec.Staff__r.Name; jw.staffLastName = rec.Staff__r.Last_Name__c; jw.staffPicture = rec.Staff__r.Picture__c; jw.StaffFullName = rec.Staff__r.Display_Nickname__c;
            }

            // Children
            jw.childJournals = new List<ChildJournalWrapper>();

            if (rec.Client_Journels__r != null) {
                for (Client_Journel__c child : rec.Client_Journels__r) {

                    ChildJournalWrapper cj = new ChildJournalWrapper();

                    cj.description = stripHtml(child.Description__c);
                    cj.createdDate = formatDateTime(child.CreatedDate);
                    cj.lastModifiedDate = formatDateTime(child.LastModifiedDate);
                    cj.createdByName = child.CreatedBy.Name;
                    cj.createdByPhoto = child.CreatedBy.SmallPhotoUrl;
                    cj.careNotes = child.Care_Notes__c;
                    cj.reason = child.Reason__c;

                    if (child.Staff__r != null) { cj.staffName = child.Staff__r.Name; cj.staffLastName = child.Staff__r.Last_Name__c; cj.staffPicture = child.Staff__r.Picture__c; cj.StaffFullName = child.Staff__r.Display_Nickname__c;
                    }

                    jw.childJournals.add(cj);
                }
            }

            wrapperList.add(jw);
        }

        result.put('journals', wrapperList);
        result.put('success', true);

        return result;
    }

    public static String stripHtml(String input) {
        if (String.isBlank(input)) return '';

        // Remove HTML tags
        String cleaned = input.replaceAll('<[^>]*>', '');

        // Optional: decode common HTML entities
        cleaned = cleaned.replace('&nbsp;', ' ');
        cleaned = cleaned.replace('&amp;', '&');

        return cleaned.trim();
    }

    @AuraEnabled
    public static List<Dynamic_Form_Response__c> getDynamicFormsByIds(List<Id> formIds) {
        return [
            SELECT Id,
                Participant_Name__c,
                Response_JSON__c,
                CreatedDate,
                    Name__c
            FROM Dynamic_Form_Response__c
            WHERE Id IN :formIds
            ORDER BY CreatedDate DESC
        ];
    }

    @AuraEnabled
    public static String updateActualStartTime(Id shiftId) {

        try {

            ShiftwithStaff__c shiftRec = [
                SELECT Id,
                       Shift_Start_Time__c,
                       Log_In_Date_Time__c
                FROM ShiftwithStaff__c
                WHERE Id = :shiftId
                LIMIT 1
            ];

            if (shiftRec.Shift_Start_Time__c == null) {
                return 'Shift Start Time is blank.';
            }

            shiftRec.Log_In_Date_Time__c = shiftRec.Shift_Start_Time__c;

            update shiftRec;

            return 'Login Date Time updated successfully.';

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static String updateActualEndTime(Id shiftId) {

        ShiftwithStaff__c shiftRec = [
            SELECT Id,
                Shift_End_Time__c,
                Log_Out_Date_Time__c
            FROM ShiftwithStaff__c
            WHERE Id = :shiftId
            LIMIT 1
        ];

        if (shiftRec.Shift_End_Time__c == null) {
            return 'Shift End Time is blank.';
        }

        shiftRec.Log_Out_Date_Time__c = shiftRec.Shift_End_Time__c;

        update shiftRec;

        return 'Actual End Time updated successfully.';
    }
}