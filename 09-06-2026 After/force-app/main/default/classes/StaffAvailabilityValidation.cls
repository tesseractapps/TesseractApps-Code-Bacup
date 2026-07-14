public with sharing class StaffAvailabilityValidation {
    @AuraEnabled
public static Map<Id, Map<Date, String>> validateStaffAvailabilityWithReasons(
    List<Id> staffIds, 
    List<Date> inputDates, 
    String startTimeStr, 
    String endTimeStr, 
    String isAvailability, 
    Boolean isEditMode,
    Id currentShiftId,
    Id currentAvailabilityId
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
    
    if (parsedStart == null || parsedEnd == null) {
        // Handle time parsing error
        for (Id staffId : staffIds) {
            for (Date dt : inputDates) {
                staffSkipReasonsMap.get(staffId).put(dt, 'Invalid time format');
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
        SELECT Id, Set_Hours__c, Restrict_Set_Hours__c, Active_or_Non_Active__c, Status__c,Facility__r.Organisation__c
        FROM Staff__c 
        WHERE Id IN :staffIds
    ]);
  

    // Mandatory documents per facility
    List<StaffRole__c> staffRoles = [SELECT Id,RoleName__c,Active__c,Facility__c,StaffRole_To_Staff__c FROM StaffRole__c  WHERE StaffRole_To_Staff__c IN :staffIds AND Active__c = true];

    // =============================================
    // BUILD STAFF FACILITY + ROLE MAPS
    // =============================================
    Map<Id, Set<Id>> facilitiesByStaff =new Map<Id, Set<Id>>();

    Map<Id, Map<Id, Set<String>>> rolesByStaffFacility =new Map<Id, Map<Id, Set<String>>>();

    Set<Id> facilityIds = new Set<Id>();

    for (StaffRole__c sr : staffRoles) {

        Id staffId = sr.StaffRole_To_Staff__c;
        Id facilityId = sr.Facility__c;
        String roleName = sr.RoleName__c;

        facilityIds.add(facilityId);

        // Facility map
        if (!facilitiesByStaff.containsKey(staffId)) {
            facilitiesByStaff.put(staffId, new Set<Id>());
        }

        facilitiesByStaff.get(staffId).add(facilityId);

        // Role map
        if (!rolesByStaffFacility.containsKey(staffId)) {
            rolesByStaffFacility.put(
                staffId,
                new Map<Id, Set<String>>()
            );
        }

        if (!rolesByStaffFacility.get(staffId).containsKey(facilityId)) {
            rolesByStaffFacility.get(staffId).put(facilityId, new Set<String>());
        }

        rolesByStaffFacility.get(staffId).get(facilityId).add(roleName);
    }

// =============================================
// FACILITY / ORG COMPLIANCE QUERY
// =============================================
List<Facility_Compliance_Setting__c> facilityCompliance = [SELECT Id,Facility__c,Facility__r.name,Organisation__c,Roles__c,Org_Roles__c,Mandatory_Document__c,
           Document_Name__c FROM Facility_Compliance_Setting__c  WHERE (
            Facility__c IN :facilityIds
            OR (
                Organisation__c != NULL
                AND Org__c = true
            )
          ) AND Mandatory_Document__c = true AND Visible_to_Staff__c = true];

// =============================================
// BUILD MANDATORY DOC MAPS
// =============================================
Map<Id, Map<String, Set<String>>>mandatoryDocsByFacilityRole =new Map<Id, Map<String, Set<String>>>();
 Map<Id, String> facilityNameById = new Map<Id, String>();


Map<Id, Map<String, Set<String>>>mandatoryDocsByOrgRole =new Map<Id, Map<String, Set<String>>>();

for (Facility_Compliance_Setting__c fc : facilityCompliance) {

    if (String.isBlank(fc.Document_Name__c)) {
        continue;
    }
     if (fc.Facility__c != null) {
         facilityNameById.put( fc.Facility__c,fc.Facility__r.Name);
     }

    // ==========================
    // FACILITY ROLE DOCS
    // ==========================
    if ( fc.Facility__c != null &&String.isNotBlank(fc.Roles__c)) {

        for (String roleName :
            fc.Roles__c.split('[,;]')) {

            String trimmedRole = roleName.trim();

            if (String.isBlank(trimmedRole)) {
                continue;
            }

            if (!mandatoryDocsByFacilityRole.containsKey(fc.Facility__c)) {
                mandatoryDocsByFacilityRole.put(
                    fc.Facility__c,
                    new Map<String, Set<String>>()
                );
            }

            Map<String, Set<String>> roleMap = mandatoryDocsByFacilityRole.get(fc.Facility__c);

            if (!roleMap.containsKey(trimmedRole)) { roleMap.put(trimmedRole,new Set<String>() );
            }

            roleMap.get(trimmedRole).add(fc.Document_Name__c.trim());
        }
    }

    // ==========================
    // ORG ROLE DOCS
    // ==========================
    if ( fc.Organisation__c != null && String.isNotBlank(fc.Org_Roles__c) ) {for (String roleName : fc.Org_Roles__c.split('[,;]')) {String trimmedRole = roleName.trim(); if (String.isBlank(trimmedRole)) {continue; } if ( !mandatoryDocsByOrgRole.containsKey(fc.Organisation__c)) {mandatoryDocsByOrgRole.put( fc.Organisation__c,new Map<String, Set<String>>()); } Map<String, Set<String>> roleMap =mandatoryDocsByOrgRole.get(fc.Organisation__c);if (!roleMap.containsKey(trimmedRole)) { roleMap.put(trimmedRole, new Set<String>() ); } roleMap.get(trimmedRole).add(fc.Document_Name__c.trim());
        }
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
        'AND Status__c != \'Unassigned\' ' +
        'AND Attendence__c = true';
    
    if (currentShiftId != null) {
        overlapShiftQuery += ' AND Id != :currentShiftId';
    }
    
    List<ShiftwithStaff__c> overlapShifts = Database.query(overlapShiftQuery);
         
      List<Availability__c> allUnavailabilities = [
            SELECT Id, Staff__c, Start_Date__c, Start_Time__c, End_Time__c, Shift_Type__c,Type__c
            FROM Availability__c
            WHERE Staff__c IN :staffIds
            AND Start_Date__c >= :overlapQueryStartDate  
            AND Start_Date__c <= :overlapQueryEndDate
            AND Id !=: currentAvailabilityId 
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

        
        // Process each staff and date
       for (Id staffId : staffIds) {
        Staff__c staff = staffMap.get(staffId);
        if (staff == null || staff.Active_or_Non_Active__c == 'Non-Active' || staff.Status__c == false) {
            for (Date dt : inputDates) {
                staffSkipReasonsMap.get(staffId).put(dt, 'Staff is inactive');
            }
            continue;
        }
        
        // Initialize cumulative hours per week with existing hours only
    
        
        // Check dates in sequence
        for (Date currentDate : inputDates) {
            String skipReason = checkSingleDateAvailabilitySequential(
                staffId, currentDate, parsedStart, parsedEnd, isAvailability, isEditMode,
                staff, overlapShiftsByStaffDate, availByStaffDateForOverLap, leavesByStaff, 
                rejectedShiftsByStaff, expiredDocsByStaff, 
                weekStartMap, currentShiftId, facilitiesByStaff,rolesByStaffFacility,mandatoryDocsByFacilityRole,mandatoryDocsByOrgRole,submittedDocsByStaff,facilityNameById
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
    Id staffId, Date currentDate, Time startTime, Time endTime, String isAvailability,
    Boolean isEditMode, Staff__c staff, 
    Map<Id, Map<Date, List<ShiftwithStaff__c>>> overlapShiftsByStaffDate,
    Map<Id, Map<Date, List<Availability__c>>> availByStaffDate,
    Map<Id, List<Leave__c>> leavesByStaff,
    Map<Id, List<ShiftwithStaff__c>> rejectedShiftsByStaff,
    Map<Id, List<Child_Staff__c>> expiredDocsByStaff,
    Map<String, Date> weekStartMap,
    Id currentShiftId,
    Map<Id, Set<Id>> facilitiesByStaff,
    Map<Id, Map<Id, Set<String>>> rolesByStaffFacility,
    Map<Id, Map<String, Set<String>>> mandatoryDocsByFacilityRole,
    Map<Id, Map<String, Set<String>>> mandatoryDocsByOrgRole,
    Map<Id, Set<String>> submittedDocsByStaff,
     Map<Id, String> facilityNameById
) {
    // 1. Check Leave (same as before)
    if (leavesByStaff.containsKey(staffId)) {
        for (Leave__c leave : leavesByStaff.get(staffId)) {
            if (currentDate >= leave.From__c && currentDate <= leave.To__c) {
                return 'On approved leave';
            }
        }
    }
     if (facilitiesByStaff.containsKey(staffId) && rolesByStaffFacility.containsKey(staffId)
     ) {

    Set<String> submittedDocs =
        submittedDocsByStaff.containsKey(staffId)
        ? submittedDocsByStaff.get(staffId)
        : new Set<String>();

    // =========================================
    // FACILITY + ROLE VALIDATION
    // =========================================
    for (
        Id facilityId :
        rolesByStaffFacility.get(staffId).keySet()
    ) {

        if (
            !mandatoryDocsByFacilityRole
                .containsKey(facilityId)
        ) {
            continue;
        }
           String facilityName =facilityNameById.containsKey(facilityId)? facilityNameById.get(facilityId) : 'selected facility';

        Map<String, Set<String>> mandatoryByRole =
            mandatoryDocsByFacilityRole.get(facilityId);

        for (
            String roleName :
            rolesByStaffFacility
                .get(staffId)
                .get(facilityId)
        ) {

            if (
                !mandatoryByRole.containsKey(roleName)
            ) {
                continue;
            }

            for (
                String mandatoryDoc :
                mandatoryByRole.get(roleName)
            ) {

                if (
                    !submittedDocs.contains(
                        mandatoryDoc
                    )
                ) {return '<b>' + mandatoryDoc + '</b> document is required for facility <b>' + facilityName + '</b> before assigning this shift.';
                }
            }
        }
    }

    // =========================================
// ORG ROLE VALIDATION
// =========================================

Id orgId =staff.Facility__r != null ? staff.Facility__r.Organisation__c: null;if (orgId != null && mandatoryDocsByOrgRole.containsKey(orgId)) {Map<String, Set<String>> mandatoryByRole = mandatoryDocsByOrgRole.get(orgId);for (Id facilityId :rolesByStaffFacility.get(staffId).keySet()) {for ( String roleName :rolesByStaffFacility.get(staffId).get(facilityId) ) {if ( !mandatoryByRole.containsKey(roleName) ) {continue;} for (String mandatoryDoc :mandatoryByRole.get(roleName)) { if (!submittedDocs.contains(mandatoryDoc ) ) { return '<b>' + mandatoryDoc +'</b> organisation level document is required before assigning this shift.';
                }
            }
        }
    }
}
}



    
    // 2. Check Document Expiry (same as before)
    if (expiredDocsByStaff.containsKey(staffId)) {

        List<String> errors = new List<String>();

        for (Child_Staff__c doc : expiredDocsByStaff.get(staffId)) {

            String documentName =
                String.isNotBlank(doc.Document_Type__c)
                ? '<b>' + doc.Document_Type__c + '</b>'
                : '<b>Compliance document</b>';

            if (doc.Status__c == 'Pending') {

                errors.add(
                    documentName +
                    ' is awaiting approval.'
                );
            }

            if (doc.Status__c == 'Rejected') {

                errors.add(
                    documentName +
                    ' was rejected.'
                );
            }

            if (
                doc.Expiry_Date__c != null &&
                doc.Expiry_Date__c <= currentDate &&
                doc.Compliance__c == true
            ) {

                errors.add(
                    documentName +
                    ' has expired.'
                );
            }
        }

        if (!errors.isEmpty()) {
            return String.join(errors, '<br/>');
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
  /*  if (rejectedShiftsByStaff.containsKey(staffId)) {
        for (ShiftwithStaff__c rejectedShift : rejectedShiftsByStaff.get(staffId)) {
            DateTime rejectedStart = getShiftStartDateTime(rejectedShift);
            DateTime rejectedEnd = getShiftEndDateTime(rejectedShift);
            if (rejectedStart != null && rejectedEnd != null && 
                isShiftOverlap(proposedStart, proposedEnd, rejectedStart, rejectedEnd)) {
                return 'Has rejected shift';
            }
        }
    } */
    
    // 5. Check Availability Overlap (same as before)
        system.debug('availByStaffDate '+availByStaffDate);

            // 5. Check Availability Overlap - MODIFIED FOR NEW REQUIREMENT
                if (availByStaffDate.containsKey(staffId)) {
                    System.debug('with in  first if ');
                    Map<Date, List<Availability__c>> staffAvailabilities = availByStaffDate.get(staffId);
                       System.debug('with in  first if '+staffAvailabilities);
                    if (staffAvailabilities.containsKey(currentDate)) {
                            System.debug('with in  second if ');
                        for (Availability__c avail : staffAvailabilities.get(currentDate)) {
                            // Check ANY availability record (both Available and Unavailable)
                            if (avail.Start_Time__c != null && avail.End_Time__c != null) {
                                DateTime availStart = DateTime.newInstance(currentDate, avail.Start_Time__c);
                                DateTime availEnd = DateTime.newInstance(currentDate, avail.End_Time__c);
                                
                                // Handle overnight availability
                                if (avail.End_Time__c < avail.Start_Time__c) {
                                    availEnd = availEnd.addDays(1);
                                }
                                
                                if (isShiftOverlap(proposedStart, proposedEnd, availStart, availEnd)) {
                                    // Different message based on type
                                    if (avail.Type__c == 'Unavailable') {
                                        return 'Staff has marked this time as Unavailable';
                                    } else {
                                        return 'Staff already has availability during this time';
                                    }
                                }
                            }
                        }
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

public class AvailabilityCheckResponse {
    @AuraEnabled public Map<Id, String> unavailableStaff;
    @AuraEnabled public List<String> rejectedStaffNames;
    @AuraEnabled public List<String> fatigueStaffNames;
    @AuraEnabled public List<String> schadsSleepoverWarningStaff;

    public AvailabilityCheckResponse() {

    unavailableStaff = new Map<Id, String>();
    rejectedStaffNames = new List<String>();
    fatigueStaffNames = new List<String>();
    schadsSleepoverWarningStaff = new List<String>();
    }
}
 @AuraEnabled
public static AvailabilityCheckResponse checkShiftWithinAvailability(
    List<Id> staffIds,
    List<Date> inputDates,
    String startTimeStr,
    String endTimeStr,
    String shiftType,
    String facilityMode
) {
    AvailabilityCheckResponse response = new AvailabilityCheckResponse();

    Map<Id, String> result = new Map<Id, String>();

    /* ---------------- Staff Map ---------------- */
    Map<Id, String> staffIdToName = new Map<Id, String>();
    for (Staff__c s : [
        SELECT Id, Display_Nickname__c
        FROM Staff__c
        WHERE Id IN :staffIds
    ]) {
        staffIdToName.put(s.Id, s.Display_Nickname__c);
    }

    /* ---------------- Availability Query ---------------- */
    List<Availability__c> allAvailabilities = [
        SELECT Id, Staff__c, Start_Date__c, Start_Time__c, End_Time__c
        FROM Availability__c
        WHERE Staff__c IN :staffIds
        AND Start_Date__c IN :inputDates
    ];

    Map<Id, Map<Date, List<Availability__c>>> availByStaffDate =
        new Map<Id, Map<Date, List<Availability__c>>>();

    for (Availability__c avail : allAvailabilities) {
        if (!availByStaffDate.containsKey(avail.Staff__c)) {
            availByStaffDate.put(avail.Staff__c, new Map<Date, List<Availability__c>>());
        }
        if (!availByStaffDate.get(avail.Staff__c).containsKey(avail.Start_Date__c)) {
            availByStaffDate.get(avail.Staff__c).put(avail.Start_Date__c, new List<Availability__c>());
        }
        availByStaffDate.get(avail.Staff__c).get(avail.Start_Date__c).add(avail);
    }

    /* ---------------- Parse Times ---------------- */
    Time startTime = AddShiftHandler.getTimeIn24HrFormat(startTimeStr != null ? startTimeStr.toLowerCase() : '');
    Time endTime   = AddShiftHandler.getTimeIn24HrFormat(endTimeStr != null ? endTimeStr.toLowerCase() : '');

    /* ---------------- NEW: Rejected Shifts Query ---------------- */
    Date overlapQueryStartDate = inputDates[0];
    Date overlapQueryEndDate   = inputDates[inputDates.size() - 1];

    List<ShiftwithStaff__c> rejectedShifts = [SELECT Id, Staff__c, Start_Date__c, Shift_End_Date__c, Shift_Start_Time__c, Shift_End_Time__c,Date__c, End_Date__c, Start_Time__c, End_Time__c FROM ShiftwithStaff__c WHERE Staff__c IN :staffIds AND Shift_Rejected__c = true AND Attendence__c = false AND ((Start_Date__c <= :overlapQueryEndDate AND Shift_End_Date__c >= :overlapQueryStartDate) OR (Date__c <= :overlapQueryEndDate AND End_Date__c >= :overlapQueryStartDate))];
    /* ---------------- SCHADS SLEEPOVER SHIFTS ---------------- */

  List<ShiftwithStaff__c> adjacentShifts = [SELECT Id,Staff__c, Start_Date__c, Shift_End_Date__c,Shift_Start_Time__c,Shift_End_Time__c, Date__c, End_Date__c, Start_Time__c, End_Time__c,Shift_Category__c FROM ShiftwithStaff__c WHERE Staff__c IN :staffIds AND ( Date__c >= :inputDates[0].addDays(-1)  AND Date__c <= :inputDates[inputDates.size() - 1].addDays(1)  )];

    /* ---------------- NEW: PREVIOUS SHIFTS FOR FATIGUE ---------------- */

    Date fatigueMinDate = inputDates[0].addDays(-1);

    Date fatigueMaxDate =inputDates[inputDates.size() - 1];

List<ShiftwithStaff__c> previousShifts = [SELECT Id,Staff__c,Duration__c,Log_Out_Date_Time__c,Add_Shift__r.End_Date__c,Date__c, CreatedDate FROM ShiftwithStaff__c WHERE Staff__c IN :staffIds AND (Date__c >= :fatigueMinDate AND Date__c <= :fatigueMaxDate) ORDER BY CreatedDate DESC];

    /* Group rejected shifts */
    Map<Id, List<ShiftwithStaff__c>> rejectedShiftsByStaff = new Map<Id, List<ShiftwithStaff__c>>();
    for (ShiftwithStaff__c rs : rejectedShifts) {
        if (!rejectedShiftsByStaff.containsKey(rs.Staff__c)) {
            rejectedShiftsByStaff.put(rs.Staff__c, new List<ShiftwithStaff__c>());
        }
        rejectedShiftsByStaff.get(rs.Staff__c).add(rs);
    }
    system.debug('rejectedShifts ==>'+rejectedShifts);

    /* ---------------- GROUP LATEST SHIFT ---------------- */

Map<Id, List<ShiftwithStaff__c>> previousShiftMap = new Map<Id, List<ShiftwithStaff__c>>();

for (ShiftwithStaff__c sh : previousShifts) {

    if (!previousShiftMap.containsKey(sh.Staff__c)) {
        previousShiftMap.put(
            sh.Staff__c,
            new List<ShiftwithStaff__c>()
        );
    }

    previousShiftMap.get(sh.Staff__c).add(sh);
}
Map<Id, List<ShiftwithStaff__c>> adjacentShiftMap = new Map<Id, List<ShiftwithStaff__c>>();

for (ShiftwithStaff__c sh : adjacentShifts) {

    if (!adjacentShiftMap.containsKey(sh.Staff__c)) {

        adjacentShiftMap.put(
            sh.Staff__c,
            new List<ShiftwithStaff__c>()
        );
    }

    adjacentShiftMap.get(sh.Staff__c).add(sh);
}

    /* ---------------- MAIN LOOP ---------------- */
    for (Id staffId : staffIds) {

        Boolean rejectedAdded = false;
        Boolean fatigueAdded = false;
        Boolean schadsSleepoverAdded = false;

        for (Date currentDate : inputDates) {

            Date calculatedEndDate =
                (endTime < startTime) ? currentDate.addDays(1) : currentDate;

            DateTime shiftStart = DateTime.newInstance(currentDate, startTime);
            DateTime shiftEnd   = DateTime.newInstance(calculatedEndDate, endTime);

            /* =====================================================
                SCHADS SLEEPOVER WARNING
                ===================================================== */

           if (facilityMode == 'SCHADS' && !schadsSleepoverAdded && adjacentShiftMap.containsKey(staffId)) {

            System.debug('=== SCHADS SLEEPOVER CHECK START ===');
            System.debug('Staff => ' + staffIdToName.get(staffId));
            System.debug('New Shift Type => ' + shiftType);
            System.debug('New Shift Start => ' + shiftStart);
            System.debug('New Shift End => ' + shiftEnd);

            for (ShiftwithStaff__c existingShift : adjacentShiftMap.get(staffId)) {

                DateTime existingStart = getShiftStartDateTime(existingShift);
                DateTime existingEnd   = getShiftEndDateTime(existingShift);

                Boolean beforeAttached = existingEnd == shiftStart;
                Boolean afterAttached  = existingStart == shiftEnd;

                String existingShiftType = existingShift.Shift_Category__c;

                Boolean existingIsSleepover = existingShiftType == 'Sleepover Shift';
                Boolean newIsSleepover      = shiftType == 'Sleepover Shift';

                Decimal adjacentShiftHours = 0;

                if (existingIsSleepover && !newIsSleepover) {

                   adjacentShiftHours =
                        Decimal.valueOf(
                            shiftEnd.getTime() - shiftStart.getTime()
                        ) / (1000 * 60 * 60);

                }
                else if (!existingIsSleepover && newIsSleepover) {

                    adjacentShiftHours =
                        Decimal.valueOf(
                            existingEnd.getTime() - existingStart.getTime()
                        ) / (1000 * 60 * 60);
                }

                Boolean validAdjacentHours = adjacentShiftHours <= 4;

                Boolean validSleepoverCombination =(existingIsSleepover && !newIsSleepover) || (!existingIsSleepover && newIsSleepover);

                System.debug('--------------------------------');
                System.debug('Existing Shift Type => ' + existingShiftType);
                System.debug('Existing Start => ' + existingStart);
                System.debug('Existing End => ' + existingEnd);
                System.debug('beforeAttached => ' + beforeAttached);
                System.debug('afterAttached => ' + afterAttached);
                System.debug('validSleepoverCombination => ' + validSleepoverCombination);
                  System.debug('validAdjacentHours => ' + validAdjacentHours);


                if (
                        validSleepoverCombination &&
                        (beforeAttached || afterAttached) &&
                        validAdjacentHours
                    ){

                    System.debug('✅ SCHADS WARNING MATCH FOUND');

                    response.schadsSleepoverWarningStaff.add(
                        staffIdToName.get(staffId)
                    );

                    schadsSleepoverAdded = true;

                    break;
                }
            }

            System.debug('=== SCHADS SLEEPOVER CHECK END ===');
        }

            if ( !fatigueAdded && previousShiftMap.containsKey(staffId) ) {

                for (ShiftwithStaff__c prevShift :previousShiftMap.get(staffId)) {

                    if ( prevShift.Log_Out_Date_Time__c == null || prevShift.Add_Shift__r == null || prevShift.Add_Shift__r.End_Date__c == null ) {
                        continue;
                    }

                    DateTime prevShiftEndDateTime = DateTime.newInstance( prevShift.Add_Shift__r.End_Date__c, prevShift.Log_Out_Date_Time__c );

                    Decimal diffMillis =  Decimal.valueOf( shiftStart.getTime() - prevShiftEndDateTime.getTime());

                    Decimal diffHours =  diffMillis / (1000 * 60 * 60);

                    System.debug('Fatigue Hours => ' + diffHours);

                    if ( diffHours >= 0 && diffHours <= 8 ) {

                        response.fatigueStaffNames.add( staffIdToName.get(staffId)
                        );

                        fatigueAdded = true;

                        break;
                    }
                }
            }

            /* ----------- EXISTING AVAILABILITY LOGIC (UNCHANGED) ----------- */
            if (availByStaffDate.containsKey(staffId)
                && availByStaffDate.get(staffId).containsKey(currentDate)) {

                for (Availability__c avail :
                     availByStaffDate.get(staffId).get(currentDate)) {

                    if (avail.Start_Time__c != null && avail.End_Time__c != null) {

                        DateTime availStart =
                            DateTime.newInstance(currentDate, avail.Start_Time__c);
                        DateTime availEnd =
                            DateTime.newInstance(currentDate, avail.End_Time__c);

                        if (avail.End_Time__c < avail.Start_Time__c) {
                            availEnd = availEnd.addDays(1);
                        }

                        if (shiftStart < availEnd && shiftEnd > availStart) {

                            Boolean isFullyWithin =
                                shiftStart >= availStart && shiftEnd <= availEnd;

                            if (!isFullyWithin) {
                                result.put(staffId, staffIdToName.get(staffId));
                                break;
                            }
                        }
                    }
                }

            } else {
                    result.put(staffId, staffIdToName.get(staffId));

                    // ✅ MOVE THIS BLOCK HERE
                    System.debug('--- CHECKING REJECTED BLOCK ---');
                    System.debug('StaffId: ' + staffId);
                    System.debug('rejectedAdded: ' + rejectedAdded);
                    System.debug('Map contains staffId? ' + rejectedShiftsByStaff.containsKey(staffId));

                    if (!rejectedAdded && rejectedShiftsByStaff.containsKey(staffId)) {

                        System.debug('➡ ENTERED rejectedShiftsByStaff loop for staff: ' + staffId);

                        for (ShiftwithStaff__c rejectedShift : rejectedShiftsByStaff.get(staffId)) {

                            System.debug('--- Rejected Shift Record ---');
                            System.debug(rejectedShift);

                            DateTime rejectedStart = getShiftStartDateTime(rejectedShift);
                            DateTime rejectedEnd   = getShiftEndDateTime(rejectedShift);

                            System.debug('Shift Start: ' + shiftStart);
                            System.debug('Shift End  : ' + shiftEnd);
                            System.debug('Rejected Start: ' + rejectedStart);
                            System.debug('Rejected End  : ' + rejectedEnd);

                            Boolean isOverlap = (shiftStart < rejectedEnd && shiftEnd > rejectedStart);

                            System.debug('Overlap Condition Result: ' + isOverlap);

                            if (isOverlap) {
                                System.debug('✅ OVERLAP FOUND → Adding to rejectedStaffNames');

                                response.rejectedStaffNames.add(staffIdToName.get(staffId));
                                rejectedAdded = true;
                                break;
                            }
                        }
                    }

                    break; // keep your original behavior
            }
        }
    }

    /* ---------------- FINAL ASSIGNMENTS ---------------- */
    response.unavailableStaff = result;

    return response;
}



 @AuraEnabled
public static List<Availability__c> getStaffAvailability( String staffId,String startDate,string endDate) {
    System.debug('--- getStaffAvailability ---');
       Date sDate=Date.valueOf(StartDate);
       Date eDate=Date.valueOf(endDate);

      List<Availability__c> allAvailabilities = new List<Availability__c>();
        allAvailabilities = [ SELECT Id, Staff__c, Start_Date__c, Start_Time__c, End_Time__c, Shift_Type__c,Type__c FROM Availability__c
            WHERE Staff__c =:staffId
            AND Start_Date__c >= :sDate  
            AND Start_Date__c <= :eDate
        ];
        return allAvailabilities;

}

      
    
}