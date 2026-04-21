public with sharing class AwardController {
    @AuraEnabled(cacheable=true)
    public static List<Award__c> getAwards(Id recordId, string orgId) {
        System.debug('recordid' +recordId);
        return [SELECT Id,Awards__c,Award_Name__c,Facility__r.Name,Staff__r.Name,Staff__r.Last_Name__c,Staff__r.Display_Nickname__c,Date__c,Issued_by__c,Certificate__c from Award__c where Staff__c  =: recordId AND Staff__r.Facility__r.Organisation__c  =: orgId ORDER BY CreatedDate DESC];
    }
    @AuraEnabled(cacheable=true)
    public static List<Award__c> getAwardsByOrg(string orgId) {
        System.debug('orgid' +orgId);
        return [SELECT Id,Awards__c,Facility__r.Name,Award_Name__c,Staff__r.Name,Staff__r.Last_Name__c,Staff__r.Display_Nickname__c,Date__c,Issued_by__c,Certificate__c from Award__c where 	Staff__r.Facility__r.Organisation__c  =: orgId ORDER BY CreatedDate DESC];
    }
    @AuraEnabled
    public static Facility__c getFacilityAwards(Id facilityId) {
        return [
            SELECT Id, Awards__c
            FROM Facility__c
            WHERE Id = :facilityId
            LIMIT 1
        ];
    }
    @AuraEnabled
    public static void addAwardToFacility(Id facilityId, String awardName) {

        if (facilityId == null || String.isBlank(awardName)) {
            return;
        }

        Facility__c fac = [
            SELECT Id, Awards__c
            FROM Facility__c
            WHERE Id = :facilityId
            LIMIT 1
            FOR UPDATE
        ];

        // If empty, just add
        if (String.isBlank(fac.Awards__c)) {
            fac.Awards__c = awardName.trim();
        } else {
            // Prevent duplicates
            List<String> awards = fac.Awards__c.split(',');
            Set<String> awardSet = new Set<String>();

            for (String a : awards) {
                awardSet.add(a.trim());
            }

            awardSet.add(awardName.trim());
            fac.Awards__c = String.join(new List<String>(awardSet), ',');
        }

        update fac;
    }
    
    @AuraEnabled
    public static void deleteAwardFromFacility(Id facilityId, String awardName) {
    
        if (facilityId == null || String.isBlank(awardName)) {
            return;
        }
    
        Facility__c fac = [
            SELECT Id, Awards__c
            FROM Facility__c
            WHERE Id = :facilityId
            LIMIT 1
            FOR UPDATE
        ];
    
        if (String.isBlank(fac.Awards__c)) {
            return;
        }
    
        List<String> awards = fac.Awards__c.split(',');
        List<String> updatedAwards = new List<String>();
    
        for (String a : awards) {
            if (a.trim() != awardName.trim()) {
                updatedAwards.add(a.trim());
            }
        }
    
        fac.Awards__c = updatedAwards.isEmpty()
            ? null
            : String.join(updatedAwards, ',');
    
        update fac;
    }

    
    @AuraEnabled
    public static List<Staff__c> getStaffList(String orgId , String facilityId ) {
        //String currentUserEmail = UserInfo.getUserEmail();
        System.debug('orgid' +orgId);
        System.debug('facilityId' +facilityId);
        return [SELECT Id, Name,Last_Name__c,Facility__c, Facility_Name__c, Display_Nickname__c,Role__c, Email_Address__c,Class_and_Paypont__c FROM Staff__c WHERE Facility__r.Organisation__c = :orgid AND Status__c=true
         AND ID IN  (SELECT Staff__c FROM Staff_Facility__c WHERE Active__c = true AND Facility__c =:facilityId) ];//AND Facility__c =:facilityId
        
    }
    
    @AuraEnabled
    public static List<Staff__c> getStaffListforRosterManager(
    String orgId, 
    String facilityId, 
    String shiftDate, 
    String endDate,
    String startTime, 
    String endTime,
    String Role
) {
    System.debug('=== START getStaffListforRosterManager ===');
    System.debug('orgid => ' + orgId);
    System.debug('facilityId => ' + facilityId);
    System.debug('shiftDate => ' + shiftDate);
    System.debug('endDate => ' + endDate);
    System.debug('startTime => ' + startTime);
    System.debug('endTime => ' + endTime);
    
    // Parse dates and find day of week
    Date parsedStartDate = parseDateDMY(shiftDate);
    Date parsedEndDate = parseDateDMY(endDate);
    Integer dayOfWeek = Integer.valueOf(
        DateTime.newInstance(parsedStartDate, Time.newInstance(0, 0, 0, 0)).format('u')
    ); 
    System.debug('📅 Day of Week: ' + dayOfWeek);
    System.debug('📅 Parsed Start Date: ' + parsedStartDate);
    System.debug('📅 Parsed End Date: ' + parsedEndDate);
    
    List<Staff__c> staffList = new List<Staff__c>();
    
    // 📢 Weekday → filter staff by facility
    List<Staff__c> facilityStaff = [
        SELECT Id, Name, Last_Name__c, Facility__c, Facility_Name__c, 
        Restrict_Set_Hours__c, Set_Hours__c, Display_Nickname__c, 
        Role__c, Email_Address__c, Class_and_Paypont__c
        FROM Staff__c WHERE ID IN (SELECT Staff__c FROM Staff_Facility__c WHERE Active__c = true AND Facility__c = :facilityId)
         AND ID IN (SELECT StaffRole_To_Staff__c FROM StaffRole__c WHERE Active__c = true AND RoleName__c =:Role)
    
    ];
    
    System.debug('🔍 Initial facilityStaff count: ' + facilityStaff.size());
    System.debug('🔍 Facility Staff IDs: ' + (new List<Id>(new Map<Id, Staff__c>(facilityStaff).keySet())));
    
    if (facilityStaff.isEmpty()) {
        System.debug('❌ NO FACILITY STAFF FOUND - Returning empty list');
        return staffList;
    }
    
    Time inputStartTime = AddShiftHandler.getTimeIn24HrFormat(startTime.toLowerCase());
    Time inputEndTime = AddShiftHandler.getTimeIn24HrFormat(endTime.toLowerCase());
    
    System.debug('⏰ Input Start Time: ' + inputStartTime);
    System.debug('⏰ Input End Time: ' + inputEndTime);
    
    // Calculate week start/end dates
    Date weekStart = parsedStartDate.toStartOfWeek();
    Date weekEnd = weekStart.addDays(6);
    System.debug('📅 Week Start: ' + weekStart + ' - Week End: ' + weekEnd);
    
    // Prepare staff IDs for queries
    Set<Id> staffIds = new Set<Id>();
    for (Staff__c staff : facilityStaff) staffIds.add(staff.Id);
    
    // 1) Query approved Leave (overlapping the date range) -> always exclude those on leave
    Map<Id, Boolean> onLeaveMap = new Map<Id, Boolean>();
    List<Leave__c> leaveRecords = [
        SELECT Id, Staff__c, From__c, To__c
        FROM Leave__c
        WHERE Staff__c IN :staffIds
        AND Status__c = 'Approved'
        AND From__c <= :parsedEndDate
        AND To__c >= :parsedStartDate
    ];
    System.debug('🏖️ Leave records found: ' + leaveRecords.size());
    for (Leave__c lv : leaveRecords) {
        onLeaveMap.put(lv.Staff__c, true);
        System.debug('🏖️ Staff on leave: ' + lv.Staff__c + ' from ' + lv.From__c + ' to ' + lv.To__c);
    }
    
    // 2) Find staff who already have overlapping shifts on that date/time
    Set<Id> overlappingShiftStaff = new Set<Id>();
    Set<Id> rejectedStaffIds = new Set<Id>();
    
    // Query all shifts for this staff on the date range
    List<ShiftwithStaff__c> existingShifts = [
        SELECT Id, Staff__c, Date__c, End_Date__c, Start_Time__c, End_Time__c,Shift_Start_Time__c,Shift_End_Time__c,Start_Date__c,Shift_End_Date__c
        FROM ShiftwithStaff__c
        WHERE Attendence__c = true
        AND Date__c <= :parsedEndDate
        AND End_Date__c >= :parsedStartDate
        AND Staff__c IN :staffIds
    ];
    System.debug('📋 Existing shifts found: ' + existingShifts.size());
    
    for (ShiftwithStaff__c ss : existingShifts) {
        DateTime recurStart = DateTime.newInstance(parsedStartDate, inputStartTime);
        DateTime recurEnd   = DateTime.newInstance(parsedEndDate, inputEndTime);
        
        DateTime shiftStart = DateTime.newInstance(ss.Start_Date__c, ss.Shift_Start_Time__c);
        DateTime shiftEnd   = DateTime.newInstance(ss.Shift_End_Date__c, ss.Shift_End_Time__c);
        
        System.debug('🔄 Checking overlap for staff: ' + ss.Staff__c);
        System.debug('   New Shift: ' + recurStart + ' to ' + recurEnd);
        System.debug('   Existing Shift: ' + shiftStart + ' to ' + shiftEnd);
        
        if (isShiftOverlap(recurStart, recurEnd, shiftStart, shiftEnd)) {
            overlappingShiftStaff.add(ss.Staff__c);
            System.debug('❌ OVERLAP DETECTED for staff: ' + ss.Staff__c);
        } else {
            System.debug('✅ NO OVERLAP for staff: ' + ss.Staff__c);
        }
    }
    System.debug('🚫 Staff with overlapping shifts: ' + overlappingShiftStaff.size() + ' - ' + overlappingShiftStaff);
    
    // Query rejected shifts
    List<ShiftwithStaff__c> rejectedShifts = [
        SELECT Id, Staff__c, Date__c, End_Date__c, Start_Time__c, End_Time__c,Shift_Start_Time__c,Shift_End_Time__c,Start_Date__c,Shift_End_Date__c
        FROM ShiftwithStaff__c
        WHERE Attendence__c = false and  Shift_Rejected__c=true
        AND Date__c <= :parsedEndDate
        AND End_Date__c >= :parsedStartDate
        AND Staff__c IN :staffIds
    ];
    System.debug('❌ Rejected shifts found: ' + rejectedShifts.size());
    
    for (ShiftwithStaff__c ss : rejectedShifts) {
        DateTime recurStart = DateTime.newInstance(parsedStartDate, inputStartTime);
        DateTime recurEnd   = DateTime.newInstance(parsedEndDate, inputEndTime);
        
        DateTime shiftStart = DateTime.newInstance(ss.Start_Date__c, ss.Shift_Start_Time__c);
        DateTime shiftEnd   = DateTime.newInstance(ss.Shift_End_Date__c, ss.Shift_End_Time__c);
        
        if (isShiftOverlap(recurStart, recurEnd, shiftStart, shiftEnd)) {
            rejectedStaffIds.add(ss.Staff__c);
            System.debug('🚫 Staff rejected shift: ' + ss.Staff__c);
        }
    }
    System.debug('🚫 Staff with rejected shifts: ' + rejectedStaffIds.size() + ' - ' + rejectedStaffIds);
    
    // Query availability for all staff in one go
    Map<Id, List<Availability__c>> staffAvailabilityMap = new Map<Id, List<Availability__c>>();
    List<Availability__c> availabilityRecords = [
        SELECT Id, Staff__c, Start_Time__c, End_Time__c, Start_Date__c, Shift_Type__c 
        FROM Availability__c 
        WHERE Staff__c IN :facilityStaff
        AND Start_Date__c >= :weekStart
        AND Start_Date__c <= :weekEnd
        AND Type__c = 'Unavailable' 
    ];
    System.debug('📅 Availability records found: ' + availabilityRecords.size());
    
    for (Availability__c av : availabilityRecords) {
        if (!staffAvailabilityMap.containsKey(av.Staff__c)) {
            staffAvailabilityMap.put(av.Staff__c, new List<Availability__c>());
        }
        staffAvailabilityMap.get(av.Staff__c).add(av);
        System.debug('📅 Availability for staff ' + av.Staff__c + ': ' + av.Start_Date__c + ' ' + av.Start_Time__c + '-' + av.End_Time__c);
    }
    
    // ✅ FIX: Query all week shifts for set hours calculation OUTSIDE the loop
    Map<Id, List<ShiftwithStaff__c>> staffWeekShiftsMap = new Map<Id, List<ShiftwithStaff__c>>();
    if (dayOfWeek != 6 && dayOfWeek != 7) { // Only query if weekday
        List<ShiftwithStaff__c> allWeekShifts = [
            SELECT Id, Staff__c, Date__c, Start_Time__c, End_Time__c, Duration__c,
                   Shift_Start_Time__c, Shift_End_Time__c, Start_Date__c, Shift_End_Date__c
            FROM ShiftwithStaff__c
            WHERE Staff__c IN :staffIds
            AND Date__c >= :weekStart
            AND Date__c <= :weekEnd
            AND Type_of_Shift__c != 'Sleepover Shift'
            AND Status__c != 'Unassigned'
            AND Attendence__c = true
        ];
        System.debug('⏱️ All week shifts found for set hours: ' + allWeekShifts.size());
        
        // Organize shifts by staff ID
        for (ShiftwithStaff__c shift : allWeekShifts) {
            if (!staffWeekShiftsMap.containsKey(shift.Staff__c)) {
                staffWeekShiftsMap.put(shift.Staff__c, new List<ShiftwithStaff__c>());
            }
            staffWeekShiftsMap.get(shift.Staff__c).add(shift);
        }
    }
    
    // Calculate input duration for set hours check
    Decimal inputDuration = calculateDurationHours(parsedStartDate, inputStartTime, inputEndTime);
    System.debug('⏱️ Input shift duration: ' + inputDuration + ' hours');
    
    // Final filtering logic
    Integer staffProcessed = 0;
    Integer staffAdded = 0;
    
    for (Staff__c staff : facilityStaff) {
        staffProcessed++;
        System.debug('🔍 Processing staff ' + staffProcessed + '/' + facilityStaff.size() + ': ' + staff.Name + ' (' + staff.Id + ')');
        
        // Exclude staff on leave
        if (onLeaveMap.containsKey(staff.Id)) {
            System.debug('🚫 SKIPPED - Staff on leave: ' + staff.Id);
            continue;
        }
        
        // Exclude staff with overlapping shifts
        if (overlappingShiftStaff.contains(staff.Id)) {
            System.debug('🚫 SKIPPED - Overlapping shifts: ' + staff.Id);
            continue;
        }
        
        // Exclude staff who rejected overlapping shifts
        if (rejectedStaffIds.contains(staff.Id)) {
            System.debug('🚫 SKIPPED - Rejected shifts: ' + staff.Id);
            continue;
        }
        
        List<Availability__c> availabilityList = staffAvailabilityMap.get(staff.Id);
        
        // Check availability
        Boolean isAvailable = checkAvailability(availabilityList, inputStartTime, inputEndTime);
        System.debug('📅 Availability check for ' + staff.Id + ': ' + isAvailable);
        if (availabilityList != null) {
            System.debug('📅 Available slots: ' + availabilityList.size());
            for (Availability__c av : availabilityList) {
                System.debug('   Slot: ' + av.Start_Date__c + ' ' + av.Start_Time__c + '-' + av.End_Time__c);
            }
        } else {
            System.debug('📅 No availability records found');
        }
        
        // For weekdays, check set hours restriction; for weekends, skip this check
        Boolean withinSetHours = true;
        if (dayOfWeek != 6 && dayOfWeek != 7) {
            // ✅ FIX: Get week shifts from map instead of querying
            List<ShiftwithStaff__c> weekShifts = staffWeekShiftsMap.get(staff.Id);
            if (weekShifts == null) {
                weekShifts = new List<ShiftwithStaff__c>(); // Empty list if no shifts
            }
            System.debug('⏱️ Week shifts found for set hours: ' + weekShifts.size());
            withinSetHours = checkSetHoursRestriction(staff, weekShifts, inputDuration);
            System.debug('💰 Set hours check for ' + staff.Id + ': ' + withinSetHours + ' (Restrict: ' + staff.Restrict_Set_Hours__c + ', Set Hours: ' + staff.Set_Hours__c + ')');
        } else {
            System.debug('💰 Weekend - Skipping set hours check');
        }
        
        // Add staff to list only if they pass all checks
        if (isAvailable && withinSetHours) {
            staffList.add(staff);
            staffAdded++;
            System.debug('✅ ADDED to final list: ' + staff.Id);
        } else {
            System.debug('❌ NOT ADDED - Availability: ' + isAvailable + ', Within Set Hours: ' + withinSetHours);
        }
    }
    
    System.debug('=== FINAL RESULTS ===');
    System.debug('📊 Total staff processed: ' + staffProcessed);
    System.debug('📊 Total staff added to list: ' + staffAdded);
    System.debug('📊 Final staffList size: ' + staffList.size());
    System.debug('=== END getStaffListforRosterManager ===');
    
    return staffList;
}

    
   // Helper method to check set hours restriction
    private static Boolean checkSetHoursRestriction(Staff__c staff, List<ShiftwithStaff__c> weekShifts, Decimal inputDuration) {
        if (staff.Restrict_Set_Hours__c != true || staff.Set_Hours__c == null || staff.Set_Hours__c == 0) {
            return true;
        }
    
    Decimal totalShiftDuration = 0;
    if (weekShifts != null) {
        for (ShiftwithStaff__c shift : weekShifts) {
            if (shift.Shift_Start_Time__c != null && shift.Shift_End_Time__c != null) {
                totalShiftDuration += calculateDurationHours(shift.Start_Date__c, shift.Shift_Start_Time__c, shift.Shift_End_Time__c);
            } else if (shift.Duration__c != null) {
                totalShiftDuration += shift.Duration__c;
            }
        }
    }
    
    Decimal grandTotal = totalShiftDuration + inputDuration;
    return grandTotal <= staff.Set_Hours__c;
}

// Keep existing helper methods and add the missing ones:
    private static Boolean isShiftOverlap(DateTime start1, DateTime end1, DateTime start2, DateTime end2) {
        return !(end1 <= start2 || start1 >= end2);
    }
    
    private static Decimal calculateDurationHours(Date shiftDate, Time startTime, Time endTime) {
        DateTime startDateTime = DateTime.newInstance(shiftDate, startTime);
        DateTime endDateTime = DateTime.newInstance(shiftDate, endTime);
        
        // Handle overnight shifts
        if (endTime < startTime) {
            endDateTime = endDateTime.addDays(1);
        }
        
        Long durationMillis = endDateTime.getTime() - startDateTime.getTime();
        Decimal durationHours = durationMillis / (1000 * 60 * 60.0);
        
        return durationHours;
    }
    
   private static Boolean checkAvailability(List<Availability__c> availabilityList, Time startTime, Time endTime) {
    System.debug('🔍 Checking availability OVERLAP: ' + startTime + ' to ' + endTime);
    
    if (availabilityList == null || availabilityList.isEmpty()) {
        System.debug('✅ No availability restrictions found');
        return true; // Allow shift if no availability restrictions
    }
    
    for (Availability__c av : availabilityList) {
        System.debug('   Comparing with availability: ' + av.Start_Time__c + ' to ' + av.End_Time__c);
        
        // Check if availability times are not null
        if (av.Start_Time__c != null && av.End_Time__c != null) {
            // Overlap condition: if availability overlaps with shift time
          
           if (startTime < av.End_Time__c && endTime > av.Start_Time__c ) {
                System.debug('❌ OVERLAP DETECTED with availability');
                return false; // Overlap found - staff is NOT available
            }

        }
    }
    
    System.debug('✅ No overlaps with availability found');
    return true; // No overlaps found - staff is available
}

    
    public static Date parseDateDMY(String dateStr) {
        if (String.isBlank(dateStr)) {
            throw new AuraHandledException('Date string is blank');
        }
        
        // Detect format by separator
        if (dateStr.contains('-')) { 
            // yyyy-MM-dd
            List<String> parts = dateStr.split('-');
            if (parts.size() == 3) {
                Integer year = Integer.valueOf(parts[0]);
                Integer month = Integer.valueOf(parts[1]);
                Integer day = Integer.valueOf(parts[2]);
                return Date.newInstance(year, month, day);
            }
        } else if (dateStr.contains('/')) { 
            // dd/MM/yyyy
            List<String> parts = dateStr.split('/');
            if (parts.size() == 3) {
                Integer day = Integer.valueOf(parts[0]);
                Integer month = Integer.valueOf(parts[1]);
                Integer year = Integer.valueOf(parts[2]);
                return Date.newInstance(year, month, day);
            }
        }
        
        throw new AuraHandledException('Invalid date format: ' + dateStr);
    }
    
    
}