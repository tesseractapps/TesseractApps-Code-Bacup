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
            SELECT Id, Name, NameToDisplay__c,
            (SELECT Id, Name, Approval_Status__c, Date__c, Start_Time__c, End_Time__c, Duration__c, Staff__r.NameToDisplay__c,
                Status__c, Add_Shift_Duration_hh_mm__c, Actual_Duration_In_Hours_and_Mins__c, Actual_Duration__c, Shift_Type__c,
                Login_Time_Formula__c, Logout_Time_Formula__c, Start_time_Formula__c, End_time_formula__c,Extended_Duration__c,
                Sleepover_Shift_Hours__c, Variance_Wage__c, Log_In_Date_Time__c, Log_Out_Date_Time__c,
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
                for (ShiftwithStaff__c shift : staff.ShiftwithStaffs__r) {
                    wrapper.shifts.add(shift);
                    wrapper.totalDuration += (shift.Duration__c != null ? shift.Duration__c : 0);
                }
            }

            result.add(wrapper);
        }

        return result;
    }

    @AuraEnabled
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
            for (ShiftwithStaff__c ss : shiftStaffList) {
                if (ss.Log_In_Date_Time__c != null && ss.Log_Out_Date_Time__c != null) {
                    ss.Approval_Status__c = 'Approved';
                    shiftList.add(ss);
                    
                    Allocation__c alocRec = new Allocation__c();
                    alocRec.End_Date__c = ss.End_Date__c;
                    alocRec.Start_Date__c = ss.Date__c;
                    alocRec.Working_Hours__c = ss.Actual_Duration__c;
                    alocRec.Extended_Hours__c = ss.Extended_Duration__c > 0 ? ss.Extended_Duration__c : 0;
                    alocRec.Extended_Hourly_Rate__c = ss.Variance_Rate__c > 0 ? ss.Variance_Rate__c : 0;
                    
                    // ⛔ Step 1: Handle Sleepover FIRST and skip further logic
                    if (ss.Type_of_shift__c == 'Sleepover Shift') {
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
                        alocRec.Saturday_Hourly_Rate__c = ss.Saturday_Hourly_Rate__c;
                        alocRec.Saturday_Hours__c = ss.Saturday_hours__c;
                    } else if (ss.Day_Name__c == 'Sunday') {
                        alocRec.Sunday_Hourly_Rate__c = ss.Sunday_Hourly_Rate__c;
                        alocRec.Sunday_hours__c = ss.Sunday_hours__c;
                    }
                    // ✅ Step 4: Else handle standard shifts
                    else {
                        switch on ss.Type_of_shift__c {
                            when 'General', 'Morning' {
                                alocRec.General_Hourly_pay_rate__c = ss.General_Shift_Hourly_Rate__c;
                                alocRec.General_Working_Hours__c = ss.General_Shift_Hours__c;
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
                insert alocList;    
            } 
            System.debug('Approved Allocation' +alocList);
        }catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        } 
    }
    

    @AuraEnabled
    public static void editAllocation(Id allocationId) {
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
            String query = 'SELECT Id, Set_Hours__c, picture__c, Name, Last_Name__c, Role__c, Working_Hours_Rate__c, ' +
                        'Saturday_Hourly_Rate__c, Sunday_Hourly_Rate__c, Public_holiday_Hourly_Rate__c, ' +
                        'Afternoon_shift_Hourly_Rate__c, Night_shift_Hourly_Rate__c, Attendance__c, NameToDisplay__c, ' +
                        'SCR__c, Classification_Level__c, Classification_Pay_Point__c, Class_and_Paypont__c, ' +
                        '(SELECT Id, Type_of_Leave__c, From__c, To__c, Reason__c, Status__c, Leave_Document__c, Duration__c, Approved_by__c, Comments__c ' +
                        ' FROM Leaves__r WHERE Status__c = \'Approved\') ' +
                        'FROM Staff__c ' +
                        'WHERE Organization_Name__c = :trucatedStr AND Facility__r.Status__c = true AND Status__c = true';

            if (facIdlist != null && facIdlist.size() > 0) {
                query += ' AND Facility__c IN :facIdlist';
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

            staffList = Database.query(query);
        }

        System.debug('Staff List returned: ' + staffList);
        return staffList;
    }

    @AuraEnabled(cacheable=false)
    public static List<ShiftwithStaff__c> getMismatchedShifts(String staffId, Date weekStart, Date weekEnd) {
        List<ShiftwithStaff__c> mismatchedShifts = [
            SELECT Id, Name, Approval_Status__c, Date__c, Start_Time__c, End_Time__c, Duration__c,
                Staff__c, Staff__r.NameToDisplay__c, Status__c, Add_Shift_Duration_hh_mm__c,
                Actual_Duration_In_Hours_and_Mins__c, Actual_Duration__c, Shift_Type__c,
                Login_Time_Formula__c, Logout_Time_Formula__c, Start_time_Formula__c, End_time_formula__c,
                Extended_Duration__c, Sleepover_Shift_Hours__c, Variance_Wage__c, Log_In_Date_Time__c,Attendence__c,
                Log_Out_Date_Time__c, Type_of_shift__c, Break__c, Long_Sleepover_Duartion__c,
                (SELECT Id, Name, Client__c, Client__r.First_Name__c, Client__r.Last_Name__c,
                        Service_Type_Name__c, Support_Item_Name__c, Funds_Tracker__r.Name 
                FROM Services_and_Support_Plans__r),
                (SELECT Id, Name, Amount__c, Mileage_Others__c, Mileage_Amount__c, Approval_Status__c 
                FROM Reimbursements__r 
                WHERE Approval_Status__c = 'Approved')
            FROM ShiftwithStaff__c
            WHERE Staff__c = :staffId
                AND Date__c >= :weekStart AND Date__c <= :weekEnd 
                AND Attendence__c = true
            ORDER BY Date__c, Start_Time__c
        ];
        
        return mismatchedShifts;
    }

}