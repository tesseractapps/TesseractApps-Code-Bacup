public with sharing class RosterCreation {
  
    @AuraEnabled
    public static Add_Shift__c createShift(addShiftWrapper addShift, RosterAddShiftService.RosterServiceHandler rsh, Boolean addShiftupdateFlag) {
        Add_Shift__c shift = new Add_Shift__c();
        
        if (addShiftupdateFlag == true && addShift.shiftDetails.AddShiftId != null) {
            system.debug('if addShiftupdateFlag ' + addShiftupdateFlag);
            system.debug('if condition ' + addShift.shiftDetails.AddShiftId);
            shift = new Add_Shift__c(Id = addShift.shiftDetails.AddShiftId);  // Only for the first shift
            // Reset the flag to false after processing
            // Ensure subsequent shifts are treated as new records
        } else {
            system.debug('else condition');
            shift = new Add_Shift__c();
        }
        
        system.debug('final addShiftupdateFlag ' + addShiftupdateFlag);  // It will now be correctly updated per method call
        shift.Start_Date__c = addShift.shiftDetails.AddShiftStartDate;
        shift.Facility__c = addShift.shiftDetails.AddShiftFacilityValue;
        shift.RefId__c = rsh.id;
        shift.Quantity__c = addShift.shiftDetails.AddShiftQuantity;
        if (rsh.SplitShift) {
            shift.Start_Time__c = rsh.startTime;
            shift.Start_Date__c=rsh.serviceDate;
            shift.End_Time__c = rsh.endTime;
            shift.Start_Time_Text__c = rsh.startTimeAMPM.toLowerCase();
            shift.End_Time_Text__c = rsh.endTimeAMPM.toLowerCase();
            shift.Split_Shifts__c = rsh.SplitShift;
            shift.Split_Shift_Color__c=rsh.splitShiftColor;
            shift.Split_Shift_Height__c=rsh.splitShiftHeight;
        } else {
            shift.Start_Time__c = addShift.shiftDetails.AddShiftStartTime;
            shift.End_Time__c = addShift.shiftDetails.AddShiftEndTime;
            shift.Start_Time_Text__c = addShift.shiftDetails.AddShiftStartTimeAMPM.toLowerCase();
            shift.End_Time_Text__c = addShift.shiftDetails.AddShiftEndTimeAMPM.toLowerCase();
        }
        shift.Shift_Type__c = addShift.shiftDetails.AddShiftType;
        shift.Shift_Name__c = addShift.shiftDetails.AddShiftTypeName;
        shift.Role__c = addShift.shiftDetails.AddShiftRole;
        shift.Location__Street__s = addShift.shiftaddress.street;
        shift.Location__City__s = addShift.shiftaddress.citySuburb;
        shift.Location__StateCode__s = addShift.shiftaddress.provinceState;
        shift.Location__PostalCode__s = addShift.shiftaddress.postalcode;
        Datetime dt = Datetime.newInstance(shift.Start_Date__c, Time.newInstance(0, 0, 0, 0));
        shift.Day_Name__c = dt.format('EEEE');
        shift.Location__CountryCode__s = 'AU';
        shift.Location__Latitude__s=addShift.shiftaddress.latitude;
        shift.Location__Longitude__s=addShift.shiftaddress.longitude;
        shift.Is_EOI__c = addShift.shiftDetails.AddShiftEOI;
        shift.Shift_Notes__c = addShift.shiftDetails.AddShiftNotes;
        shift.Duration__c = addShift.shiftDetails.AddShiftDuration;
        
        shift.Get_Facility__c=addShift.shiftDetails.AddShiftEnterOtherLocation;
        shift.Participant_Address_checkbox__c=addShift.shiftDetails.AddShiftParticipantAddressCheckbox;
        return shift;
    }
    
  
    
    @AuraEnabled
    public static boolean getFatigueData(String staffId, String strtTimeText, String startdate) {
        boolean fatigueBoolean = false; // Default value to prevent null return
        List<ShiftwithStaff__c> allPreviousShifts = new List<ShiftwithStaff__c>();
        Time lastLogouttime;
        
        // Validate input parameters
        if (String.isBlank(staffId) || String.isBlank(strtTimeText) || String.isBlank(startdate)) {
            System.debug('One or more input values are null or empty.');
            return false;
        }
        
        // Convert string time to Time format
        Time startTime = AddShiftHandler.getTimeIn24HrFormat(strtTimeText);
        if (startTime == null) {
            System.debug('Invalid start time format.');
            return false;
        }
        
        // Fetch the last shift of the staff member
        allPreviousShifts = [
            SELECT Id, Staff__c, Duration__c, Log_Out_Date_Time__c, Add_Shift__r.End_Date__c  
            FROM ShiftwithStaff__c  
            WHERE Staff__c = :staffId  AND (Date__c = :Date.valueof(startdate )
                                            OR Date__c = :Date.valueof(startdate ) - 1)
            ORDER BY CreatedDate DESC
            LIMIT 1
        ];
        
        System.debug('Previous shifts: ' + allPreviousShifts);
        
        // If no previous shift found, return false
        if (allPreviousShifts.isEmpty()) {
            System.debug('No previous shifts found. No fatigue detected.');
            return false;
        }
        
        ShiftwithStaff__c lastShift = allPreviousShifts[0];
        
        // Ensure previous shift has required fields
        if (lastShift.Log_Out_Date_Time__c == null || lastShift.Add_Shift__r == null || lastShift.Add_Shift__r.End_Date__c == null) {
            System.debug('Previous shift data incomplete. No fatigue detected.');
            return false;
        }
        
        lastLogouttime = lastShift.Log_Out_Date_Time__c;
        
        // Convert start date and calculate time difference
        Date shiftDate = Date.valueOf(startdate);
        DateTime newShiftStartDateTime = DateTime.newInstanceGmt(shiftDate, startTime);
        DateTime prevShiftLogInDatetime = DateTime.newInstanceGmt(lastShift.Add_Shift__r.End_Date__c, lastLogouttime);
        
        System.debug('startTime: ' + startTime);
        System.debug('lastLogouttime: ' + lastLogouttime);
        System.debug('previous shift date: ' + lastShift.Add_Shift__r.End_Date__c);
        System.debug('shiftDate: ' + shiftDate);
        System.debug('newShiftStartDateTime: ' + newShiftStartDateTime);
        System.debug('prevShiftLogInDatetime: ' + prevShiftLogInDatetime);
        
        // Calculate time difference in hours
        Decimal timeDifferenceInMillis = Decimal.valueOf(newShiftStartDateTime.getTime() - prevShiftLogInDatetime.getTime());
        Decimal timeDifferenceInHours = timeDifferenceInMillis / (1000 * 60 * 60); // Convert to hours
        
        System.debug('Time Difference in Hours (Corrected): ' + timeDifferenceInHours);
        
        // Negative time difference means an invalid shift sequence
        if (timeDifferenceInHours < 0) {
            System.debug('Negative time difference detected! No fatigue.');
            return false;
        }
        
        // If the time difference is <= 8 hours, consider it fatigue
        if (timeDifferenceInHours <= 8) {
            fatigueBoolean = true;
        }
        
        return fatigueBoolean;
    }
    
    public class checkListWrapper{
        public string description;
        public boolean mandatory;
        public string checkListId;
    }
    
    
    // Wrapper classes
    public class addShiftWrapper {
        public addShiftAddressWrapper shiftaddress;
        public AddShiftBasicDetailsWrapper shiftDetails;
    }
    
    
    public class addShiftAddressWrapper {
        public String street;
        public String citySuburb;
        public String country;
        public String provinceState;
        public String postalcode;
        public Decimal latitude;
        public Decimal longitude;
        
    }
    
    public class AddShiftBasicDetailsWrapper {
        public Date AddShiftStartDate;
        public String AddShiftFacilityValue;
        public String AddShiftParticipantValue;
        public String AddShiftRole;
        public Time AddShiftStartTime;
        public String AddShiftStartTimeAMPM;
        public String AddShiftEndTimeAMPM;
        public string AddShiftStaffValue;
        public Time AddShiftEndTime;
        public String AddShiftType;
        public String AddShiftNotes;
        public integer AddShiftQuantity;
        public boolean AddShiftEOI;
        public decimal AddShiftDuration;
        public string AddShiftId;
        public boolean AddShiftHoliday;
        public boolean AddShiftEnterOtherLocation;
        public boolean AddShiftParticipantAddressCheckbox;
        public string selectedServiceInfoJson;
        public string AddShiftTypeName;
    }
    @AuraEnabled
    public static List<Funds_Tracker__c> getFundsData(list<string> fundsId){
        system.debug('fundsId >>'+ fundsId);
        List<Funds_Tracker__c> fundsList = [SELECT Id,Name, Available_Funds__c, Spent_Amt__c FROM Funds_Tracker__c WHERE Id IN :fundsId];
        return fundsList ;
        
    } 
    
    public static Time convertToTime(String timeString) {
        timeString = timeString.replace('Z', '');
        List<String> parts = timeString.split(':');
        
        return Time.newInstance(
            Integer.valueOf(parts[0]),
            Integer.valueOf(parts[1]),
            Integer.valueOf(parts[2]),
            0
        );
    }
    
   
    @AuraEnabled
public static Map<Id, Map<Date, String>> validateStaffAvailabilityWithReasons(
    List<Id> staffIds, 
    List<Date> inputDates, 
    String startTimeStr, 
    String endTimeStr, 
    String isAvailability, 
    Boolean isEditMode,
    Id currentShiftId,
    Id currentAvailabilityId,
    Id shiftFacilityId,
    string shiftRole
) {
    Map<Id, Map<Date, String>> staffSkipReasonsMap = new Map<Id, Map<Date, String>>();
    
    if (staffIds == null || staffIds.isEmpty() || inputDates == null || inputDates.isEmpty()) {
        return staffSkipReasonsMap;
    }
    
    // Initialize the map structure
    for (Id staffId : staffIds) {
        staffSkipReasonsMap.put(staffId, new Map<Date, String>());
    }
    
    // Parse times using your existing method
    Time parsedStart = AddShiftHandler.getTimeIn24HrFormat(startTimeStr != null ? startTimeStr.toLowerCase() : '');
    Time parsedEnd = AddShiftHandler.getTimeIn24HrFormat(endTimeStr != null ? endTimeStr.toLowerCase() : '');
    
    if (parsedStart == null || parsedEnd == null) {for (Id staffId : staffIds) {for (Date dt : inputDates) {staffSkipReasonsMap.get(staffId).put(dt, 'Invalid time format');
            }
        }
        return staffSkipReasonsMap;
    }
    
    // --- STEP 1: Calculate global date range FIRST ---
    Date globalStart = inputDates[0];
    Date globalEnd = inputDates[0];

    System.debug('Initial globalStart: ' + globalStart);
    System.debug('Initial globalEnd: ' + globalEnd);
    System.debug('Input Dates: ' + inputDates);

    for (Date d : inputDates) {
        System.debug('Processing Date: ' + d);

        if (d < globalStart) {
            System.debug('Updating globalStart from ' + globalStart + ' to ' + d);
            globalStart = d;
        }
        if (d > globalEnd) {
            System.debug('Updating globalEnd from ' + globalEnd + ' to ' + d);
            globalEnd = d;
        }
    }

    System.debug('Final globalStart: ' + globalStart);
    System.debug('Final globalEnd: ' + globalEnd);

    // Initial query dates (for overlap checking)
    Date queryStartDate = globalStart.addDays(-1);
    Date queryEndDate = globalEnd.addDays(1);

    System.debug('Initial Query Start Date (globalStart - 1): ' + queryStartDate);
    System.debug('Initial Query End Date (globalEnd + 1): ' + queryEndDate);
    
    // --- STEP 2: Calculate complete weeks for all input dates ---
    Map<String, Date> weekStartMap = new Map<String, Date>();
    Map<String, Date> weekEndMap = new Map<String, Date>();
    Map<String, List<Date>> weekToDates = new Map<String, List<Date>>();

    for (Date d : inputDates) {
        System.debug('--------------------------------');
        System.debug('Processing Date: ' + d);

        Integer dow = Integer.valueOf(DateTime.newInstance(d, Time.newInstance(0, 0, 0, 0)).format('u'));
        System.debug('Day Of Week (1=Mon, 7=Sun): ' + dow);

        Date weekStart = d.addDays(-(dow - 1));
        System.debug('Calculated Week Start: ' + weekStart);

        Date weekEnd = weekStart.addDays(6);
        System.debug('Calculated Week End: ' + weekEnd);

        String weekKey = String.valueOf(weekStart);
        System.debug('Week Key: ' + weekKey);

        System.debug('Does weekToDates already contain WeekKey? ' + weekToDates.containsKey(weekKey));

        if (!weekToDates.containsKey(weekKey)) {
            weekToDates.put(weekKey, new List<Date>());
            weekStartMap.put(weekKey, weekStart);
            weekEndMap.put(weekKey, weekEnd);

            System.debug('Added New Week Entry: ' + weekKey);
            System.debug('weekStartMap: ' + weekStartMap);
            System.debug('weekEndMap: ' + weekEndMap);
        }

        weekToDates.get(weekKey).add(d);
        System.debug('Updated weekToDates[' + weekKey + ']: ' + weekToDates.get(weekKey));
    }
    
    // --- STEP 3: Calculate week range for hours query ---
    Date minWeekStart = null;
    Date maxWeekEnd = null;

    for (String weekKey : weekStartMap.keySet()) {
        Date weekStart = weekStartMap.get(weekKey);
        Date weekEnd = weekEndMap.get(weekKey);
        
        if (minWeekStart == null || weekStart < minWeekStart) {
            minWeekStart = weekStart;
        }
        if (maxWeekEnd == null || weekEnd > maxWeekEnd) {
            maxWeekEnd = weekEnd;
        }
    }

    System.debug('=== WEEK RANGE CALCULATION ===');
    System.debug('Min Week Start: ' + minWeekStart);
    System.debug('Max Week End: ' + maxWeekEnd);
    System.debug('Number of Weeks: ' + weekStartMap.size());

    // --- STEP 4: Store overlap range BEFORE updating ---
    Date overlapQueryStartDate = queryStartDate;  // Store original: globalStart - 1
    Date overlapQueryEndDate = queryEndDate;      // Store original: globalEnd + 1

    // --- STEP 5: Update query dates to WEEK range for hours calculation ---
    queryStartDate = minWeekStart.addDays(-1);
    queryEndDate = maxWeekEnd.addDays(1);

    System.debug('Overlap Query Range: ' + overlapQueryStartDate + ' to ' + overlapQueryEndDate);
    System.debug('Hours Query Range: ' + queryStartDate + ' to ' + queryEndDate);
        
    // BULK QUERY 1: Staff basic info
    Map<Id, Staff__c> staffMap = new Map<Id, Staff__c>([
        SELECT Id, Set_Hours__c, Restrict_Set_Hours__c, Active_or_Non_Active__c, Status__c, Facility__r.Organisation__c
        FROM Staff__c 
        WHERE Id IN :staffIds
    ]);
    List<StaffRole__c> staffRoles = [
    SELECT Id,
           RoleName__c,
           Active__c,
           Facility__c,
           StaffRole_To_Staff__c FROM StaffRole__c WHERE StaffRole_To_Staff__c IN :staffIds AND Active__c = true];
        Map<Id, Set<Id>> facilitiesByStaff = new Map<Id, Set<Id>>();
        Map<Id, Map<Id, Set<String>>> rolesByStaffFacility = new Map<Id, Map<Id, Set<String>>>();
        Set<Id> facilityIds = new Set<Id>();
        System.debug('STAFF ROLES COUNT => ' + staffRoles.size());
        System.debug('STAFF ROLES => ' + staffRoles);

    for (StaffRole__c sr : staffRoles) {

        Id staffId = sr.StaffRole_To_Staff__c;
        Id facilityId = sr.Facility__c;
        String roleName = sr.RoleName__c;

        facilityIds.add(facilityId);
          System.debug(
        'StaffRole → Staff=' + staffId +
        ', Facility=' + facilityId +
        ', Role=' + roleName
         );

        // facilitiesByStaff
        if (!facilitiesByStaff.containsKey(staffId)) {
            facilitiesByStaff.put(staffId, new Set<Id>());
        }
        facilitiesByStaff.get(staffId).add(facilityId);

        // rolesByStaffFacility
        if (!rolesByStaffFacility.containsKey(staffId)) {
            rolesByStaffFacility.put(staffId, new Map<Id, Set<String>>());
        }
        if (!rolesByStaffFacility.get(staffId).containsKey(facilityId)) {
            rolesByStaffFacility.get(staffId).put(facilityId, new Set<String>());
        }
        rolesByStaffFacility.get(staffId).get(facilityId).add(roleName);
    }
        System.debug('facilitiesByStaff => ' + facilitiesByStaff);
        System.debug('rolesByStaffFacility => ' + rolesByStaffFacility);
        System.debug('facilityIds => ' + facilityIds);





        List<Facility_Compliance_Setting__c> facilityCompliance = [
            SELECT Id,
                Facility__c,
                Roles__c,
                Org_Roles__c,
                Mandatory_Document__c,Organisation__c,
                Document_Name__c
            FROM Facility_Compliance_Setting__c
           WHERE (Facility__c IN :facilityIds
           OR Organisation__c != NULL)
            AND Mandatory_Document__c = true
            AND Visible_to_Staff__c = true
        ];

        System.debug('Facility Compliance Records => ' + facilityCompliance.size());

        Map<Id, Map<String, Set<String>>> mandatoryDocsByFacilityRole =new Map<Id, Map<String, Set<String>>>();

            Map<Id, Map<String, Set<String>>> mandatoryDocsByOrgRole = new Map<Id, Map<String, Set<String>>>();

       for (Facility_Compliance_Setting__c fc : facilityCompliance) {

                if (String.isBlank(fc.Document_Name__c)) {
                continue;
                }

                // ✅ FIX IS HERE
               if (fc.Facility__c != null && String.isNotBlank(fc.Roles__c)) {

                    List<String> roles = fc.Roles__c.split('[,;]');

                    for (String roleName : roles) {

                        String trimmedRole = roleName.trim();
                        if (String.isBlank(trimmedRole)) continue;

                        if (!mandatoryDocsByFacilityRole.containsKey(fc.Facility__c)) {
                            mandatoryDocsByFacilityRole.put(fc.Facility__c, new Map<String, Set<String>>());
                        }

                        Map<String, Set<String>> roleMap = mandatoryDocsByFacilityRole.get(fc.Facility__c);

                        if (!roleMap.containsKey(trimmedRole)) {
                            roleMap.put(trimmedRole, new Set<String>());
                        }

                        roleMap.get(trimmedRole).add(fc.Document_Name__c.trim());
                    }
                }
                // =============================
                // ORG LEVEL COMPLIANCE
                // =============================
                if (fc.Organisation__c != null && String.isNotBlank(fc.Org_Roles__c)) {

                        List<String> orgRoles = fc.Org_Roles__c.split('[,;]');

                        for (String roleName : orgRoles) {

                            String trimmedRole = roleName.trim();
                            if (String.isBlank(trimmedRole)) continue;

                            if (!mandatoryDocsByOrgRole.containsKey(fc.Organisation__c)) {
                                mandatoryDocsByOrgRole.put(fc.Organisation__c, new Map<String, Set<String>>());
                            }

                            Map<String, Set<String>> roleMap = mandatoryDocsByOrgRole.get(fc.Organisation__c);

                            if (!roleMap.containsKey(trimmedRole)) {
                                roleMap.put(trimmedRole, new Set<String>());
                            }

                            roleMap.get(trimmedRole).add(fc.Document_Name__c.trim());
                        }
                    }
            }


        // 🔹 Final map snapshot
        System.debug('Mandatory Docs By Facility & Role => ' + mandatoryDocsByFacilityRole);
       System.debug('Mandatory Docs By Facility & Role => ' + mandatoryDocsByOrgRole);


     

    // Calculate proposed hours for each date
    Map<Id, Map<Date, Decimal>> proposedShiftHoursByStaff = new Map<Id, Map<Date, Decimal>>();
    for (Id staffId : staffIds) {
        proposedShiftHoursByStaff.put(staffId, new Map<Date, Decimal>());
        for (Date currentDate : inputDates) {
            Decimal shiftDuration = calculateShiftDuration(currentDate, parsedStart, 
                calculateEndDate(currentDate, parsedStart, parsedEnd), parsedEnd);
            proposedShiftHoursByStaff.get(staffId).put(currentDate, shiftDuration);
        }
    }
        
    // SEPARATE QUERIES FOR DIFFERENT PURPOSES:
    
    // QUERY 2A: For OVERLAP CHECKING - Include all shifts except Unassigned (including Sleepover)
    String overlapShiftQuery = 'SELECT Id, Staff__c, Start_Date__c, Shift_End_Date__c, ' +
        'Shift_Start_Time__c, Shift_End_Time__c, Date__c, End_Date__c, ' +
        'Start_Time__c, End_Time__c, Type_of_Shift__c, ' +
        'Attendence__c, Status__c, Shift_Rejected__c ' +
        'FROM ShiftwithStaff__c ' +
        'WHERE Staff__c IN :staffIds ' +
        'AND ((Start_Date__c <= :overlapQueryEndDate AND Shift_End_Date__c >= :overlapQueryStartDate) ' +
        'OR (Date__c <= :overlapQueryEndDate AND End_Date__c >= :overlapQueryStartDate)) ' +
        'AND ( ' +
        '    (Status__c = \'Draft\' AND Attendence__c = false) ' +
        '    OR ' +
        '    (Status__c != \'Unassigned\' AND Attendence__c = true) ' +
        ')';
    
    if (currentShiftId != null) {
        overlapShiftQuery += ' AND Id != :currentShiftId';
    }
    
    List<ShiftwithStaff__c> overlapShifts = Database.query(overlapShiftQuery);
    
    // QUERY 2B: For HOURS CALCULATION - Exclude Sleepover shifts
    String hoursShiftQuery = 'SELECT Id, Staff__c, Start_Date__c, Shift_End_Date__c, ' +
        'Shift_Start_Time__c, Shift_End_Time__c, Date__c, End_Date__c, ' +
        'Start_Time__c, End_Time__c, Duration__c, Type_of_Shift__c, ' +
        'Attendence__c, Status__c ' +
        'FROM ShiftwithStaff__c ' +
        'WHERE Staff__c IN :staffIds ' +
        'AND ((Start_Date__c <= :queryEndDate AND Shift_End_Date__c >= :queryStartDate) ' +
        'OR (Date__c <= :queryEndDate AND End_Date__c >= :queryStartDate)) ' +
        'AND Type_of_Shift__c != \'Sleepover Shift\' ' +  // Exclude Sleepover for hours calculation
        'AND ( ' +
        '    (Status__c = \'Draft\' AND Attendence__c = false) ' +
        '    OR ' +
        '    (Status__c != \'Unassigned\' AND Attendence__c = true) ' +
        ')';
    
    if (currentShiftId != null) {
        hoursShiftQuery += ' AND Id != :currentShiftId';
    }
    
            List<ShiftwithStaff__c> hoursShifts = Database.query(hoursShiftQuery);
            
      List<Availability__c> allUnavailabilities = [
            SELECT Id, Staff__c, Start_Date__c, Start_Time__c, End_Time__c, Shift_Type__c,Type__c
            FROM Availability__c
            WHERE Staff__c IN :staffIds
            AND Start_Date__c >= :overlapQueryStartDate  
            AND Start_Date__c <= :overlapQueryEndDate
            AND Type__c = 'Unavailable' 
        ];
        system.debug('allUnavailabilities '+allUnavailabilities);
    
    
    // BULK QUERY 4: Approved Leave
    List<Leave__c> allLeaves = [
        SELECT Id, Staff__c, From__c, To__c, Status__c
        FROM Leave__c
        WHERE Staff__c IN :staffIds
        AND Status__c = 'Approved'
        AND ((From__c <= :globalEnd AND To__c >= :globalStart))
    ];
    
    // BULK QUERY 5: Rejected Shifts (include all types for overlap checking) - FIXED
    List<ShiftwithStaff__c> rejectedShifts = [
        SELECT Id, Staff__c, Start_Date__c, Shift_End_Date__c, 
        Shift_Start_Time__c, Shift_End_Time__c, Date__c, End_Date__c,
        Start_Time__c, End_Time__c
        FROM ShiftwithStaff__c
        WHERE Staff__c IN :staffIds
        AND Shift_Rejected__c = true
        AND Attendence__c = false
        AND ((Start_Date__c <= :overlapQueryEndDate AND Shift_End_Date__c >= :overlapQueryStartDate)
             OR (Date__c <= :overlapQueryEndDate AND End_Date__c >= :overlapQueryStartDate))
    ];
    
    // BULK QUERY 6: Document Expiry (Compliance)
    List<Child_Staff__c> expiredDocuments = [
        SELECT Id, Staff__c,Status__c,Type__c,Document_Type__c, Expiry_Date__c,Facility_Compliance_Setting__c, Compliance__c,Facility_Compliance_Setting__r.Mandatory_Document__c,Points__c
        FROM Child_Staff__c
        WHERE Staff__c IN :staffIds
    ];
       Map<Id, Set<String>> submittedDocsByStaff = new Map<Id, Set<String>>();

            for (Child_Staff__c doc : expiredDocuments) {

                System.debug(
                    'Processing Doc | Staff=' + doc.Staff__c +
                    ' | DocType=' + doc.Document_Type__c +
                    ' | Status=' + doc.Status__c
                );

                if (String.isBlank(doc.Document_Type__c)) {
                    System.debug('→ Skipped (no Document_Type__c)');
                    continue;
                }

                if (!submittedDocsByStaff.containsKey(doc.Staff__c)) {
                    submittedDocsByStaff.put(doc.Staff__c, new Set<String>());
                }

                submittedDocsByStaff
                    .get(doc.Staff__c)
                    .add(doc.Document_Type__c.trim());
            }



        
        // Organize data for efficient processing - SEPARATE MAPS FOR DIFFERENT PURPOSES
        Map<Id, Map<Date, List<ShiftwithStaff__c>>> overlapShiftsByStaffDate = organizeShiftsByStaffAndDate(overlapShifts);
        Map<Id, Map<Date, List<ShiftwithStaff__c>>> hoursShiftsByStaffDate = organizeShiftsByStaffAndDate(hoursShifts);
        Map<Id, Map<Date, List<Availability__c>>> availByStaffDateForOverLap = organizeAvailabilitiesByStaffAndDate(allUnavailabilities);
        System.debug(' availByStaffDateForOverLap '+availByStaffDateForOverLap);
        Map<Id, List<Leave__c>> leavesByStaff = organizeLeavesByStaff(allLeaves);
        Map<Id, List<ShiftwithStaff__c>> rejectedShiftsByStaff = organizeShiftsByStaff(rejectedShifts);
        Map<Id, List<Child_Staff__c>> expiredDocsByStaff = organizeDocumentsByStaff(expiredDocuments);
        

        for (Date d : inputDates) {
            System.debug('--------------------------------');
            System.debug('Processing Date: ' + d);

            Integer dow = Integer.valueOf(DateTime.newInstance(d, Time.newInstance(0, 0, 0, 0)).format('u'));
            System.debug('Day Of Week (1=Mon, 7=Sun): ' + dow);

            Date weekStart = d.addDays(-(dow - 1));
            System.debug('Calculated Week Start: ' + weekStart);

            Date weekEnd = weekStart.addDays(6);
            System.debug('Calculated Week End: ' + weekEnd);

            String weekKey = String.valueOf(weekStart);
            System.debug('Week Key: ' + weekKey);

            System.debug('Does weekToDates already contain WeekKey? ' + weekToDates.containsKey(weekKey));

            if (!weekToDates.containsKey(weekKey)) {weekToDates.put(weekKey, new List<Date>());weekStartMap.put(weekKey, weekStart);weekEndMap.put(weekKey, weekEnd);

                System.debug('Added New Week Entry: ' + weekKey);
                System.debug('weekStartMap: ' + weekStartMap);
                System.debug('weekEndMap: ' + weekEndMap);
            }

            weekToDates.get(weekKey).add(d);
            System.debug('Updated weekToDates[' + weekKey + ']: ' + weekToDates.get(weekKey));
        }

       

        
          Map<Id, Map<String, Decimal>> existingWeeklyHoursByStaff = calculateExistingWeeklyHours(  staffIds, hoursShiftsByStaffDate, weekStartMap, weekEndMap);
        
        // Process each staff and date
       for (Id staffId : staffIds) {
        Staff__c staff = staffMap.get(staffId);
        if (staff.Active_or_Non_Active__c == 'Non-Active' || staff.Status__c == false) {for (Date dt : inputDates) {staffSkipReasonsMap.get(staffId).put(dt, 'Staff is inactive');}continue;
        }
        
        // Initialize cumulative hours per week with existing hours only
        Map<String, Decimal> cumulativeWeeklyHours = new Map<String, Decimal>();
        if (existingWeeklyHoursByStaff.containsKey(staffId)) {
            cumulativeWeeklyHours.putAll(existingWeeklyHoursByStaff.get(staffId));
        } else {
            // Initialize all weeks with 0
            for (String weekKey : weekStartMap.keySet()) {
                cumulativeWeeklyHours.put(weekKey, 0);
            }
        }
        
        // Check dates in sequence
        for (Date currentDate : inputDates) {
           String skipReason = checkSingleDateAvailabilitySequential(
                staffId, currentDate,parsedStart, parsedEnd, isAvailability,
                isEditMode,staff,overlapShiftsByStaffDate,availByStaffDateForOverLap,leavesByStaff,rejectedShiftsByStaff,expiredDocsByStaff,cumulativeWeeklyHours, weekStartMap,currentShiftId, proposedShiftHoursByStaff,facilitiesByStaff, 
            rolesByStaffFacility,mandatoryDocsByFacilityRole,mandatoryDocsByOrgRole,submittedDocsByStaff,shiftFacilityId,shiftRole
            );

            
            if (skipReason != null) {
                staffSkipReasonsMap.get(staffId).put(currentDate, skipReason);
            }
        }
    }
        
        return staffSkipReasonsMap;
    }
    
   // Modified method for sequential checking
public static String checkSingleDateAvailabilitySequential(
    Id staffId,
    Date currentDate,
    Time startTime,
    Time endTime,
    String isAvailability,
    Boolean isEditMode,
    Staff__c staff,

    Map<Id, Map<Date, List<ShiftwithStaff__c>>> overlapShiftsByStaffDate,
    Map<Id, Map<Date, List<Availability__c>>> availByStaffDate,
    Map<Id, List<Leave__c>> leavesByStaff,
    Map<Id, List<ShiftwithStaff__c>> rejectedShiftsByStaff,
    Map<Id, List<Child_Staff__c>> expiredDocsByStaff,

    Map<String, Decimal> cumulativeWeeklyHours,
    Map<String, Date> weekStartMap,
    Id currentShiftId,
    Map<Id, Map<Date, Decimal>> proposedShiftHours,

    // 🔽 NEW / UPDATED PARAMETERS
    Map<Id, Set<Id>> facilitiesByStaff,
    Map<Id, Map<Id, Set<String>>> rolesByStaffFacility,
    Map<Id, Map<String, Set<String>>> mandatoryDocsByFacilityRole,
    Map<Id, Map<String, Set<String>>> mandatoryDocsByOrgRole,
    Map<Id, Set<String>> submittedDocsByStaff,
    Id shiftFacilityId,
    String shiftRole
)
 {
    // 1. Check Leave (same as before)
    if (leavesByStaff.containsKey(staffId)) {
        for (Leave__c leave : leavesByStaff.get(staffId)) {
            if (currentDate >= leave.From__c && currentDate <= leave.To__c) {
                return 'On approved leave';
            }
        }
    }

   
      if (facilitiesByStaff.containsKey(staffId) && rolesByStaffFacility.containsKey(staffId)) {

                        // Inputs (either BOTH provided or BOTH null/blank)
             /*    Id shiftFacilityId = 'a02Bo000007woBhIAI';
                String shiftRole   = 'Admin'; */

                Set<String> submittedDocs =
                    submittedDocsByStaff.containsKey(staffId)
                    ? submittedDocsByStaff.get(staffId)
                    : new Set<String>();

                // =====================================================
                // CASE 1: FACILITY + ROLE PASSED
                // =====================================================
                if (shiftFacilityId != null && !String.isBlank(shiftRole)) {

                    if (mandatoryDocsByFacilityRole.containsKey(shiftFacilityId)) {

                        Map<String, Set<String>> mandatoryByRole =
                            mandatoryDocsByFacilityRole.get(shiftFacilityId);

                        if (mandatoryByRole.containsKey(shiftRole)) {

                            for (String mandatoryDoc : mandatoryByRole.get(shiftRole)) {
 
                                if (!submittedDocs.contains(mandatoryDoc)) {
                                    System.debug(
                                        '❌ Missing Doc | Staff=' + staffId +
                                        ', Facility=' + shiftFacilityId +
                                        ', Role=' + shiftRole +
                                        ', Doc=' + mandatoryDoc
                                    );
                                    return 'Mandatory compliance document missing';
                                }
                            }
                        }
                    }
                }

                // =====================================================
                // CASE 2: FACILITY + ROLE NOT PASSED
                // =====================================================
                else {

                    if (!facilitiesByStaff.containsKey(staffId)) {
                        return null; // nothing to validate
                    }

                    for (Id facilityId : facilitiesByStaff.get(staffId)) {

                        if (!mandatoryDocsByFacilityRole.containsKey(facilityId)) {
                            continue;
                        }

                        Map<String, Set<String>> mandatoryByRole =
                            mandatoryDocsByFacilityRole.get(facilityId);

                        // Collect ALL mandatory docs for the facility (ignore role)
                        Set<String> allMandatoryDocs = new Set<String>();

                        for (Set<String> docs : mandatoryByRole.values()) {
                            allMandatoryDocs.addAll(docs);
                        }

                        for (String mandatoryDoc : allMandatoryDocs) {

                            if (!submittedDocs.contains(mandatoryDoc)) {
                                System.debug(
                                    '❌ Missing Doc | Staff=' + staffId +
                                    ', Facility=' + facilityId +
                                    ', Doc=' + mandatoryDoc
                                );
                                return 'Mandatory compliance document missing';
                            }
                        }
                    }
                }

                // =====================================================
                // ORG LEVEL COMPLIANCE CHECK
                // =====================================================

            Id orgId = staff.Facility__r != null
                    ? staff.Facility__r.Organisation__c
                    : null;

            if (orgId != null &&
                shiftRole != null &&
                mandatoryDocsByOrgRole.containsKey(orgId)) {

                Map<String, Set<String>> mandatoryByRole =
                    mandatoryDocsByOrgRole.get(orgId);

                if (mandatoryByRole.containsKey(shiftRole)) {

                    for (String mandatoryDoc : mandatoryByRole.get(shiftRole)) {

                        if (!submittedDocs.contains(mandatoryDoc)) {

                            System.debug(
                                '❌ Missing ORG Doc | Staff=' + staffId +
                                ', Org=' + orgId +
                                ', Role=' + shiftRole +
                                ', Doc=' + mandatoryDoc
                            );

                            return 'Mandatory compliance document missing';
                        }
                    }
                }
            }


      }




    
    // 2. Check Document Expiry (same as before)
    // 2. Check Document Status (Simplified – Single Message)
    if (expiredDocsByStaff.containsKey(staffId)) {

    for (Child_Staff__c doc : expiredDocsByStaff.get(staffId)) {

        // Expired document → return immediately
        if (
            doc.Expiry_Date__c != null &&
            doc.Expiry_Date__c <= currentDate &&
            doc.Compliance__c == true
        ) {
            return 'One or more required documents are expired';
        }

        // Pending or Rejected document → return immediately
        if (doc.Status__c == 'Pending' || doc.Status__c == 'Rejected') {
            return 'One or more required documents are pending approval';
        }
    }
}


    
    // Calculate proper end date
    Date calculatedEndDate = calculateEndDate(currentDate, startTime, endTime);
    DateTime proposedStart = DateTime.newInstance(currentDate, startTime);
    DateTime proposedEnd = DateTime.newInstance(calculatedEndDate, endTime);
    
    // 3. Check Shift Overlaps (same as before)
    if (overlapShiftsByStaffDate.containsKey(staffId)) {
        Map<Date, List<ShiftwithStaff__c>> staffShifts = overlapShiftsByStaffDate.get(staffId);
        for (Integer i = -1; i <= 1; i++) {
            Date checkDate = currentDate.addDays(i);
            if (staffShifts.containsKey(checkDate)) {
                for (ShiftwithStaff__c existingShift : staffShifts.get(checkDate)) {
                    if (isEditMode && existingShift.Id == currentShiftId) {
                        continue;
                    }
                    DateTime existingStart = getShiftStartDateTime(existingShift);
                    DateTime existingEnd = getShiftEndDateTime(existingShift);
                    if (existingStart != null && existingEnd != null && 
                        isShiftOverlap(proposedStart, proposedEnd, existingStart, existingEnd)) {
                        return 'Overlapping shift';
                    }
                }
            }
        }
    }
    
    // 4. Check Rejected Shifts Overlap (same as before)
    if (rejectedShiftsByStaff.containsKey(staffId)) {
        for (ShiftwithStaff__c rejectedShift : rejectedShiftsByStaff.get(staffId)) {
            DateTime rejectedStart = getShiftStartDateTime(rejectedShift);
            DateTime rejectedEnd = getShiftEndDateTime(rejectedShift);
            if (rejectedStart != null && rejectedEnd != null && 
                isShiftOverlap(proposedStart, proposedEnd, rejectedStart, rejectedEnd)) { 
                return 'Has rejected shift';
            }
        }
    }
    
    // 5. Check Availability Overlap (same as before)
        system.debug('availByStaffDate '+availByStaffDate);

            if (availByStaffDate.containsKey(staffId)) {
                Map<Date, List<Availability__c>> staffAvailabilities = availByStaffDate.get(staffId);
            if (staffAvailabilities.containsKey(currentDate)) {
                for (Availability__c avail : staffAvailabilities.get(currentDate)) {
                    // Check if this is an unavailability record
                    if (avail.Type__c == 'Unavailable' && avail.Start_Time__c != null && avail.End_Time__c != null) {
                        DateTime availStart = DateTime.newInstance(currentDate, avail.Start_Time__c);
                        DateTime availEnd = DateTime.newInstance(currentDate, avail.End_Time__c);
                        
                        // Handle overnight unavailability
                        if (avail.End_Time__c < avail.Start_Time__c) {
                            availEnd = availEnd.addDays(1);
                        }
                        
                        if (isShiftOverlap(proposedStart, proposedEnd, availStart, availEnd)) {
                            return 'Unavailable during this time period';
                        }
                    }
                }
            }
        }
    
    // 6. Check Set Hours Limit (SEQUENTIAL VERSION)
    Integer dayOfWeek = Integer.valueOf(DateTime.newInstance(currentDate, Time.newInstance(0, 0, 0, 0)).format('u'));
    Boolean isWeekend = (dayOfWeek == 6 || dayOfWeek == 7);

    if (!isWeekend && staff.Restrict_Set_Hours__c == true && staff.Set_Hours__c > 0) {
        String weekKey = findWeekKeyForDate(currentDate, weekStartMap);
        
        if (weekKey != null && cumulativeWeeklyHours != null && proposedShiftHours != null && 
            proposedShiftHours.containsKey(staffId) && proposedShiftHours.get(staffId).containsKey(currentDate)) {
            
            // Get this date's proposed hours
            Decimal dateProposedHours = proposedShiftHours.get(staffId).get(currentDate);
            
            // Get current cumulative hours for this week
            Decimal currentCumulative = cumulativeWeeklyHours.get(weekKey) != null ? cumulativeWeeklyHours.get(weekKey) : 0;
            
            // Calculate new cumulative total
            Decimal newCumulative = currentCumulative + dateProposedHours;
            
            System.debug('Current Cumulative Hours: ' + currentCumulative);
            System.debug('Date Proposed Hours: ' + dateProposedHours);
            System.debug('New Cumulative Total: ' + newCumulative);
            System.debug('Staff Set Hours Limit: ' + staff.Set_Hours__c);
            
            // Check if exceeds limit
            if (newCumulative > staff.Set_Hours__c) {
                System.debug('RESULT => Exceeds set hours limit');
                return 'Exceeds set hours limit';
            }
            
            // Update cumulative hours for next date (passed by reference)
            cumulativeWeeklyHours.put(weekKey, newCumulative);
        }
    }
    
    return null;
}
    
    // Helper method to calculate end date considering overnight shifts
    public static Date calculateEndDate(Date startDate, Time startTime, Time endTime) {
        if (startTime == null || endTime == null) return startDate;
        
        Long startTimeMs = startTime.hour() * 3600000 + startTime.minute() * 60000 + startTime.second() * 1000;
        Long endTimeMs = endTime.hour() * 3600000 + endTime.minute() * 60000 + endTime.second() * 1000;
        
        return (endTimeMs == 0 || endTimeMs < startTimeMs) ? startDate.addDays(1) : startDate;
    }
    
    // Helper method to get proper shift start DateTime
    public static DateTime getShiftStartDateTime(ShiftwithStaff__c shift) {
        if (shift.Start_Date__c != null && shift.Shift_Start_Time__c != null) {
            return DateTime.newInstance(shift.Start_Date__c, shift.Shift_Start_Time__c);
        } else if (shift.Date__c != null && shift.Start_Time__c != null) {
            return DateTime.newInstance(shift.Date__c, shift.Start_Time__c);
        }
        return null;
    }
    
    // Helper method to get proper shift end DateTime
    public static DateTime getShiftEndDateTime(ShiftwithStaff__c shift) {
        if (shift.Shift_End_Date__c != null && shift.Shift_End_Time__c != null) {
            return DateTime.newInstance(shift.Shift_End_Date__c, shift.Shift_End_Time__c);
        } else if (shift.End_Date__c != null && shift.End_Time__c != null) {
            return DateTime.newInstance(shift.End_Date__c, shift.End_Time__c);
        } else if (shift.Date__c != null && shift.End_Time__c != null) {
            return DateTime.newInstance(shift.Date__c, shift.End_Time__c);
        }
        return null;
    }
    
    // Existing shift overlap detection method
    public static Boolean isShiftOverlap(DateTime start1, DateTime end1, DateTime start2, DateTime end2) {
        return (start1 < end2 && end1 > start2);
    }
    
    // Data organization helper methods
    public static Map<Id, Map<Date, List<ShiftwithStaff__c>>> organizeShiftsByStaffAndDate(List<ShiftwithStaff__c> shifts) {
        Map<Id, Map<Date, List<ShiftwithStaff__c>>> result = new Map<Id, Map<Date, List<ShiftwithStaff__c>>>();
        
        for (ShiftwithStaff__c shift : shifts) {
            Id staffId = shift.Staff__c;
            if (!result.containsKey(staffId)) {
                result.put(staffId, new Map<Date, List<ShiftwithStaff__c>>());
            }
            
            // Add shift to all relevant dates in its range
            Date shiftStartDate = shift.Start_Date__c != null ? shift.Start_Date__c : shift.Date__c;
            Date shiftEndDate = shift.Shift_End_Date__c != null ? shift.Shift_End_Date__c : 
            (shift.End_Date__c != null ? shift.End_Date__c : shiftStartDate);
                
                for (Date d = shiftStartDate; d <= shiftEndDate; d = d.addDays(1)) {
                    if (!result.get(staffId).containsKey(d)) {
                        result.get(staffId).put(d, new List<ShiftwithStaff__c>());
                    }
                    result.get(staffId).get(d).add(shift);
                }
        }
        
        return result;
    }
    
    public static Map<Id, Map<Date, List<Availability__c>>> organizeAvailabilitiesByStaffAndDate(List<Availability__c> availabilities) {
        Map<Id, Map<Date, List<Availability__c>>> result = new Map<Id, Map<Date, List<Availability__c>>>();
        
        for (Availability__c avail : availabilities) {
            Id staffId = avail.Staff__c;
            if (!result.containsKey(staffId)) {
                result.put(staffId, new Map<Date, List<Availability__c>>());
            }
            
            Date availDate = avail.Start_Date__c;
            if (!result.get(staffId).containsKey(availDate)) {
                result.get(staffId).put(availDate, new List<Availability__c>());
            }
            result.get(staffId).get(availDate).add(avail);
        }
        
        return result;
    }
    
    public static Map<Id, List<Leave__c>> organizeLeavesByStaff(List<Leave__c> leaves) {
        Map<Id, List<Leave__c>> result = new Map<Id, List<Leave__c>>();
        
        for (Leave__c leave : leaves) {
            Id staffId = leave.Staff__c;
            if (!result.containsKey(staffId)) {
                result.put(staffId, new List<Leave__c>());
            }
            result.get(staffId).add(leave);
        }
        
        return result;
    }
    
    public static Map<Id, List<ShiftwithStaff__c>> organizeShiftsByStaff(List<ShiftwithStaff__c> shifts) {
        Map<Id, List<ShiftwithStaff__c>> result = new Map<Id, List<ShiftwithStaff__c>>();
        
        for (ShiftwithStaff__c shift : shifts) {
            Id staffId = shift.Staff__c;
            if (!result.containsKey(staffId)) {
                result.put(staffId, new List<ShiftwithStaff__c>());
            }
            result.get(staffId).add(shift);
        }
        
        return result;
    }
    
    public static Map<Id, List<Child_Staff__c>> organizeDocumentsByStaff(List<Child_Staff__c> documents) {
        Map<Id, List<Child_Staff__c>> result = new Map<Id, List<Child_Staff__c>>();
        
        for (Child_Staff__c doc : documents) {
            Id staffId = doc.Staff__c;
            if (!result.containsKey(staffId)) {
                result.put(staffId, new List<Child_Staff__c>());
            }
            result.get(staffId).add(doc);
        }
        
        return result;
    }
    
   // New method: Calculate EXISTING hours only (no proposed hours)
public static Map<Id, Map<String, Decimal>> calculateExistingWeeklyHours(
    List<Id> staffIds,
    Map<Id, Map<Date, List<ShiftwithStaff__c>>> hoursShiftsByStaffDate,
    Map<String, Date> weekStartMap,
    Map<String, Date> weekEndMap
) {
    Map<Id, Map<String, Decimal>> result = new Map<Id, Map<String, Decimal>>();

    for (Id staffId : staffIds) {
        result.put(staffId, new Map<String, Decimal>());
        
        // Initialize all weeks with 0 hours
        for (String weekKey : weekStartMap.keySet()) {
            result.get(staffId).put(weekKey, 0);
        }

        // Add existing shift hours
        // Add existing shift hours (IGNORE WEEKENDS)
        if (hoursShiftsByStaffDate.containsKey(staffId)) {

            Map<Date, List<ShiftwithStaff__c>> staffShifts =
                hoursShiftsByStaffDate.get(staffId);

            for (Date shiftDate : staffShifts.keySet()) {

                // ✅ Detect day of week (1=Mon ... 7=Sun)
                Integer dow = Integer.valueOf(
                    DateTime.newInstance(
                        shiftDate,
                        Time.newInstance(0,0,0,0)
                    ).format('u')
                );

                // ✅ Skip Saturday(6) and Sunday(7)
                if (dow == 6 || dow == 7) {
                    continue;
                }

                String weekKey =
                    findWeekKeyForDate(shiftDate, weekStartMap);

                if (weekKey != null) {
                    for (ShiftwithStaff__c shift :
                        staffShifts.get(shiftDate)) {

                        Decimal duration =
                            shift.Duration__c != null
                            ? shift.Duration__c
                            : 0;

                        result.get(staffId).put(
                            weekKey,
                            result.get(staffId).get(weekKey) + duration
                        );
                    }
                }
            }
        }


    }
    return result;
}

    
    public static String findWeekKeyForDate(Date targetDate, Map<String, Date> weekStartMap) {
        for (String weekKey : weekStartMap.keySet()) {
            Date weekStart = weekStartMap.get(weekKey);
            Date weekEnd = weekStart.addDays(6);
            if (targetDate >= weekStart && targetDate <= weekEnd) {
                return weekKey;
            }
        }
        return null;
    }
    
    public static Decimal calculateShiftDuration(Date startDate, Time startTime, Date endDate, Time endTime) {
        if (startTime == null || endTime == null) return 0;
        
        DateTime startDT = DateTime.newInstance(startDate, startTime);
        DateTime endDT = DateTime.newInstance(endDate, endTime);
        
        // Handle overnight shifts
        if (endDT.getTime() < startDT.getTime()) {
            endDT = endDT.addDays(1);
        }
        
        Long diffMillis = endDT.getTime() - startDT.getTime();
        Decimal hours = Decimal.valueOf(diffMillis) / (1000 * 60 * 60);
        return hours.setScale(2);
    }

    
     @AuraEnabled
    public static List<Services_and_Support_Plan__c> unAssignedList(string shiftWithStaffId){
     List<Services_and_Support_Plan__c> unassigned = [
            SELECT Id,Un_Assigned_Service__c,Funds_Tracker__r.Registration_Group__c,Participant_Name__c,Edited_Unit_Price__c,Qty__c,Amount__c, ShiftwithStaff__r.RefId__c,ShiftwithStaff__r.Un_Assigned_Shift__c,ShiftwithStaff__r.Staff__c,ShiftwithStaff__r.Attendence__c ,ShiftwithStaff__r.Add_Shift__r.Un_Assigned_Shift__c,ShiftwithStaff__r.Add_Shift__c,Client__c,Custom_Shift_Reference_Id__c,
            ShiftwithStaff__r.Add_Shift__r.Day_Name__c,ShiftwithStaff__r.Public_holiday__c,ShiftwithStaff__r.Add_Shift__r.Shift_Type__c,Funds_Tracker__c,Service_Type__c,Support_Item_Name__c
            FROM   Services_and_Support_Plan__c where ShiftwithStaff__c =:shiftWithStaffId
        ];
        return unassigned;
    }
    
    
    
    
    
    
}