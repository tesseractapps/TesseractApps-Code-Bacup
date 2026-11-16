public with sharing class AwardController {
    @AuraEnabled
    public static List<Award__c> getAwards(Id recordId, string orgId) {
        System.debug('recordid' +recordId);
        return [SELECT Id,Awards__c,Award_Name__c,Facility__r.Name,Staff__r.Name,Staff__r.Last_Name__c,Staff__r.Display_Nickname__c,Date__c,Issued_by__c,Certificate__c,Award_UID__c from Award__c where Staff__c  =: recordId AND Staff__r.Facility__r.Organisation__c  =: orgId AND Archieve__c = false  ORDER BY CreatedDate DESC];
    }
    @AuraEnabled(cacheable=true)
    public static List<Award__c> getAwardsByOrg(string orgId) {
        System.debug('orgid' +orgId);
        return [SELECT Id,Awards__c,Facility__r.Name,Award_Name__c,Template_Name__c,Archieve__c,Staff__r.Name,Staff__r.Last_Name__c,Staff__r.Display_Nickname__c,Date__c,Issued_by__c,Certificate__c,CreatedBy.Name,CreatedDate,Award_UID__c from Award__c where 	Staff__r.Facility__r.Organisation__c  =: orgId ORDER BY CreatedDate DESC];
    }

    @AuraEnabled
    public static List<Award__c> getAwardById(String recordId) {
        Id validId;
        try {
            validId = (Id) recordId;
        } catch (Exception e) {
            validId = null;
        }

        return [SELECT Id,Awards__c,Award_Name__c,Facility__r.Name,Staff__r.Name,Staff__r.Last_Name__c,Staff__r.Display_Nickname__c,Date__c,Issued_by__c,Certificate__c,CreatedBy.Name,CreatedDate,Award_UID__c from Award__c where (Id =: validId OR Award_UID__c =: recordId) LIMIT 1];
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
        return [SELECT Id, Name,Last_Name__c,Facility__c, Facility_Name__c, Display_Nickname__c,Role__c, Email_Address__c,Class_and_Paypont__c,Emp_exit_date__c FROM Staff__c WHERE Facility__r.Organisation__c = :orgid AND Status__c=true
         AND ID IN  (SELECT Staff__c FROM Staff_Facility__c WHERE Active__c = true AND Facility__c =:facilityId) ];//AND Facility__c =:facilityId
        
    }
    
    @AuraEnabled
    public static List<StaffWrapper>  getStaffListforRosterManager(
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
    
   List<StaffWrapper> staffList = new List<StaffWrapper>();
    
    // 📢 Weekday → filter staff by facility
    List<Staff__c> facilityStaff = [
    SELECT Id,
           Name,
           Last_Name__c,
           Display_Nickname__c,
           Facility__c,
           Facility_Name__c,
           Restrict_Set_Hours__c,
           Set_Hours__c,
           Role__c,
           Email_Address__c,
           Class_and_Paypont__c,

           (
              SELECT Id,
                     RoleName__c,
                     Active__c,
                     Facility__c,
                     Classification_Level__c,
                     Classification_Pay_Point__c
              FROM StaffRoles__r
              WHERE Active__c = true
              AND RoleName__c = :Role
              AND Facility__c = :facilityId
           )

    FROM Staff__c 

    WHERE Id IN (
        SELECT Staff__c
        FROM Staff_Facility__c
        WHERE Active__c = true
        AND Facility__c = :facilityId
    )

    AND Id IN (
        SELECT StaffRole_To_Staff__c
        FROM StaffRole__c
        WHERE Active__c = true
        AND RoleName__c = :Role
        AND Facility__c = :facilityId
    ) 
    AND Status__c=true
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
    
  
    Date weekStart = parsedStartDate.toStartOfWeek();
    Date weekEnd = weekStart.addDays(6);
    System.debug('📅 Week Start: ' + weekStart + ' - Week End: ' + weekEnd);
    
   
    Set<Id> staffIds = new Set<Id>();
    for (Staff__c staff : facilityStaff) staffIds.add(staff.Id);
    Map<Id,Decimal> weeklyHoursMap =calculateWeeklyStaffHours( staffIds, parsedStartDate);
    
  
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
    
   
    Set<Id> overlappingShiftStaff = new Set<Id>();
    Set<Id> rejectedStaffIds = new Set<Id>();
    
  
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
        
    
        if(isAvailable){

            StaffWrapper sw = new StaffWrapper();

             sw.Id = staff.Id;
            sw.DisplayName = staff.Display_Nickname__c;
           


            String classLevel = '0';

            if(staff.StaffRoles__r != null &&!staff.StaffRoles__r.isEmpty()){

                StaffRole__c matchedRole = staff.StaffRoles__r[0];
                String level = RostersPublishAndAssignHandler.extractNumber( matchedRole.Classification_Level__c );
                String payPoint = RostersPublishAndAssignHandler.extractNumber(matchedRole.Classification_Pay_Point__c);
                if( !String.isBlank(level) && !String.isBlank(payPoint)){
                    classLevel = level + '.' + payPoint;
                }
            }
           Decimal workedHours = weeklyHoursMap.containsKey(staff.Id)  ? weeklyHoursMap.get(staff.Id)  : 0;
          Decimal setHours = staff.Set_Hours__c == null ? 0  : staff.Set_Hours__c;
          sw.WeeklyHours = formatHours(workedHours)+ '/'+ formatHours(setHours);
            sw.ClassAndLevel = classLevel;


            staffList.add(sw);
        }
    }
    
    System.debug('=== FINAL RESULTS ===');
    System.debug('📊 Total staff processed: ' + staffProcessed);
    System.debug('📊 Total staff added to list: ' + staffAdded);
    System.debug('📊 Final staffList size: ' + staffList.size());
    System.debug('=== END getStaffListforRosterManager ===');
    
    return staffList;
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
    public static Map<Id, Decimal> calculateWeeklyStaffHours(Set<Id> staffIds, Date shiftDate){
    Map<Id, Decimal> staffHoursMap = new Map<Id, Decimal>();

    if(staffIds == null || staffIds.isEmpty()){
        return staffHoursMap;
    }


    // default zero
    for(Id sid : staffIds){
        staffHoursMap.put(sid,0);
    }


    User objUser = [
        SELECT Organization_Name__c
        FROM User
        WHERE Id = :UserInfo.getUserId()
    ];


    String organisationStartDay = [
        SELECT Week_Start_Day__c
        FROM Organisation__c
        WHERE Name = :objUser.Organization_Name__c
        LIMIT 1
    ].Week_Start_Day__c;



    Date weekStartDate = getWeekStartDate(
        shiftDate,
        organisationStartDay
    );

    Date weekEndDate = weekStartDate.addDays(6);



    List<ShiftwithStaff__c> shifts = [
        SELECT Id,
               Staff__c,
               Duration__c

        FROM ShiftwithStaff__c

        WHERE Staff__c IN :staffIds

        AND (
             (
                Start_Date__c <= :weekEndDate
                AND Shift_End_Date__c >= :weekStartDate
             )
             OR
             (
                Date__c <= :weekEndDate
                AND End_Date__c >= :weekStartDate
             )
        )

        AND Shift_Rejected__c != true

        AND Type_of_Shift__c != 'Sleepover Shift'

        AND (
            (
                Status__c = 'Draft'
                AND Attendence__c = false
            )
            OR
            (
                Status__c != 'Unassigned'
                AND Attendence__c = true
            )
        )
    ];



    for(ShiftwithStaff__c sh : shifts){

        Decimal current =
            staffHoursMap.containsKey(sh.Staff__c)
            ? staffHoursMap.get(sh.Staff__c)
            : 0;


        staffHoursMap.put(
            sh.Staff__c,
            current + (sh.Duration__c == null ? 0 : sh.Duration__c)
        );
    }


    return staffHoursMap;
}

    public static Date getWeekStartDate(
    Date inputDate,
    String startDay
    ){

    Map<String,Integer> dayMap =
        new Map<String,Integer>{
            'Monday'=>1,
            'Tuesday'=>2,
            'Wednesday'=>3,
            'Thursday'=>4,
            'Friday'=>5,
            'Saturday'=>6,
            'Sunday'=>7
        };


    Integer requiredDay = dayMap.get(startDay);


    Integer currentDay = Integer.valueOf(
        DateTime.newInstance(
            inputDate,
            Time.newInstance(0,0,0,0)
        ).format('u')
    );


    Integer diff = currentDay - requiredDay;


    if(diff < 0){
        diff += 7;
    }


    return inputDate.addDays(-diff);
}
public static String formatHours(Decimal value){

    if(value == null){
        return '0';
    }

    // remove decimal only when it is whole number
    if(value == value.setScale(0)){
        return String.valueOf(value.intValue());
    }

    return String.valueOf(value);
}

   public class StaffWrapper {

    @AuraEnabled public Id Id {get;set;}

    @AuraEnabled public String Name {get;set;}
    @AuraEnabled public String DisplayName {get;set;}
    @AuraEnabled public String ClassAndLevel {get;set;}
    @AuraEnabled public String WeeklyHours {get;set;} 

}
    
    
}