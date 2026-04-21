public class RosterTemplateController {
	@AuraEnabled
public static String saveTemplate(
    String templateName,
    String templateType,
    Date startDate,
    Date endDate,
    string facilityId
) {
    // Validate input
    if (String.isBlank(templateName)) {
        return 'Error: Template name is required.';
    }

    // Check for existing template with same name
    List<Roster_Template__c> existingTemplates = [
        SELECT Id
        FROM Roster_Template__c
        WHERE Name = :templateName AND  Active__c = true
        LIMIT 1
    ];

    if (!existingTemplates.isEmpty()) {
        return 'Error: A template with this name already exists.';
    }

    // Create new template
    Roster_Template__c rt = new Roster_Template__c(
        Name = templateName,
        Template_Type__c = templateType,
        Start_Date__c = startDate,
        End_Date__c = endDate,
        Facility__c = facilityId
    );

    try {
        insert rt;
        return 'Success: Template created successfully.';
    } catch (Exception e) {
        return 'Error: Unable to create template. ' + e.getMessage();
    }
}
    @AuraEnabled
    public static List<Roster_Template__c> getTemplates(String facilityId) {
        return [
            SELECT Id, Name, Template_Type__c, Start_Date__c, End_Date__c,CreatedDate,Facility__c
            FROM Roster_Template__c where Facility__c =:facilityId AND Active__c = true
            ORDER BY CreatedDate DESC
        ];
    }
     @AuraEnabled
    public static void deleteRosterTemplate(String templateId) {
        Roster_Template__c template = [SELECT Id,Active__c FROM Roster_Template__c WHERE Id = :templateId];
        if(template.Active__c == true){
            template.Active__c = false;
            update template;
        }

    }
  
    @AuraEnabled
public static void createRosterTemplates(
    String rosterTemplate,
    String startDate,
    String endDate,
    List<String> facilityIdList,
    Boolean copyChecklist,
    Boolean copyParticipant,
    Boolean copyShiftNotes
) {

    Date startDt = Date.valueOf(startDate);
    Date endDt   = Date.valueOf(endDate);

    /* =====================================================
       EXISTING SHIFTS (FOR OVERLAP + HOURS)
       ===================================================== */
    List<ShiftWithStaff__c> existingShifts = [
        SELECT Id, Staff__c, Start_Date__c, Shift_End_Date__c,
               Shift_Start_Time__c, Shift_End_Time__c, Duration__c
        FROM ShiftWithStaff__c
        WHERE Add_Shift__r.Facility__c IN :facilityIdList
        AND Start_Date__c <= :endDt
        AND Shift_End_Date__c >= :startDt
        AND Attendence__c = true
    ];

    Map<Id, List<ShiftWithStaff__c>> existingByStaff = new Map<Id, List<ShiftWithStaff__c>>();
    for (ShiftWithStaff__c e : existingShifts) {
         if (!existingByStaff.containsKey(e.Staff__c)) {
            existingByStaff.put(e.Staff__c, new List<ShiftWithStaff__c>());
        }
        existingByStaff.get(e.Staff__c).add(e);
    }

    /* =====================================================
       TEMPLATE INPUT
       ===================================================== */
    List<Roster_Template__c> rosterTemplates =
        (List<Roster_Template__c>) JSON.deserialize(
            rosterTemplate,
            List<Roster_Template__c>.class
        );

    Date previousStartDate = Date.valueOf(rosterTemplates[0].Start_Date__c);
    Date proceededStartDate = Date.valueOf(startDate);
    Integer dateOffset = previousStartDate.daysBetween(proceededStartDate);
    system.debug('dateOffset ==>'+dateOffset);

    /* =====================================================
       ADD SHIFT CLONING (UNCHANGED LOGIC)
       ===================================================== */
    List<Add_Shift__c> previousAddShifts = [
       SELECT Id, RefId__c,Role__c,Start_Date__c,Facility__c,Start_Time_Text__c,End_Time_Text__c,Start_Time__c,End_Time__c,Shift_Type__c,Shift_Name__c,Day_Name__c,End_Date__c,
                    Shift_Notes__c,Location__Street__s,Location__City__s,Location__StateCode__s,Location__PostalCode__s,Location__Latitude__s,Location__Longitude__s,Location__CountryCode__s,Is_EOI__c,Duration__c,Get_Facility__c,Participant_Address_checkbox__c,Group_Shifts__c,Do_you_want_to_set_this_a_recurring_shif__c,Quantity__c ,Un_Assigned_Shift__c FROM Add_Shift__c
        WHERE Start_Date__c >= :previousStartDate
        AND End_Date__c <= :Date.valueOf(rosterTemplates[0].End_Date__c)
        AND Facility__c = :rosterTemplates[0].Facility__c
    ];

    List<Add_Shift__c> newAddShifts = new List<Add_Shift__c>();
    Map<Id, Id> oldToNewAddShiftMap = new Map<Id, Id>();

    for (Add_Shift__c src : previousAddShifts) {
        Add_Shift__c cloned = src.clone(false, true, false, false);
        cloned.Start_Date__c = src.Start_Date__c.addDays(dateOffset);
        cloned.End_Date__c   = src.End_Date__c.addDays(dateOffset);
        cloned.Shift_Notes__c = copyShiftNotes ? src.Shift_Notes__c : '';
        newAddShifts.add(cloned);
    }

    insert newAddShifts;

    for (Integer i = 0; i < previousAddShifts.size(); i++) {
        oldToNewAddShiftMap.put(previousAddShifts[i].Id, newAddShifts[i].Id);
    }

    /* =====================================================
       SOURCE STAFF SHIFTS
       ===================================================== */
    List<ShiftWithStaff__c> sourceStaffShifts = [
        SELECT Id, Add_Shift__c,Date__c, Staff__c, Do_you_want_to_set_this_Recurring_Roster__c, Role__c, Shift_Category__c, SignIn_Notes__c, Staff_Final_Hourly_Rate__c, Type_of_Address__c,Long_Afternoon_Start_Time__c,Long_Afternoon_End_Time__c,Is_Long_Afternoon__c,Long_Afternoon_Index__c,Long_Afternoon_Hourly_Rate__c,Long_Afternoon_Shift_Duartion__c,Is_Long_Afternoon_Next_Day_Start__c,Long_Afternoon_Start_Date_One__c,long_Afternooon_Service_Ref_Id__c,Long_Morning_Start_Time_Two__c,Long_Morning_End_Time_Two__c,Is_long_Morning_Shift_two__c,Long_Morning_Index_Two__c,Long_Morning_Rate_Two__c,Long_Morning_Duartion_Two__c,Is_Long_Morning_Next_Day_Start_Two__c,Long_Morning_Start_Date_Two__c,long_Morning_2_Service_Ref_Id__c,
                    Add_Shift__r.End_Time__c, Add_Shift__r.Start_Time__c, Group_Shifts__c, New_Split_Shift__c, Split_Shift_RefId__c, Shift_Address__Street__s,Shift_Address__City__s,Shift_Address__StateCode__s,Shift_Address__PostalCode__s,Shift_Address__CountryCode__s,Long_Night_Start_Time__c,Long_Night_End_Time__c,Is_Long_Night_Shift__c,Long_Night_Index__c,Long_Night_Hourly_Rate__c,Long_Night_Shift_Duartion__c,Is_Long_Night_Start_Next_Day__c,Long_Night_Start_Date__c,long_Night_Service_Ref_Id__c,long_Sleepover_Service_Ref_Id__c,Long_Afternoon_Start_Time_two__c,Long_afternoon_End_Time_Two__c,Is_Long_afternoon_shift_two__c,Long_Afternoon_Index_Two__c,Long_Afternoon_Rate_Two__c,Long_Afternoon_Duration_Two__c,Is_Long_Afternoon_Next_Day_Start_Two__c,Long_Afternoon_Start_Date_Two__c,long_Afternooon_Two_Service_Ref_Id__c,
                        Shift_Address__Latitude__s, Shift_Address__Longitude__s, Staff_Paid_Break__c, Shift_Calculated_Duration__c, Shift_Break__c,Shift_Name__c,Time_Rounded_Off__c,Un_Assigned_Shift__c,Status__c,Index__c,Shift_Start_Time__c,Long_Morning_Shift_Duartion__c,Is_long_Morning_Next_Day_Start__c,Long_Sleepover_Start_Time__c,Long_Sleepover_End_Time__c,Is_Long_SleepOver__c,Long_Sleepover_index__c,Long_Sleepover_Allowance__c,Long_Sleepover_Duartion__c,Is_Long_Sleepover_Next_Day_Start__c,Long_Sleepover_Start_Date__c,Duration__c,Is_Published_Shifts__c,
                        Shift_End_Time__c, Start_Date__c, Shift_End_Date__c, Shift_Day_Name__c, Shift_To_Service_Ref_Id__c,RefId__c,Long_Morning_Start_Time__c,Long_Morning_End_Time__c,Is_long_Morning__c,Long_Morning_Index__c,Long_Morning_Hourly_Rate__c,Long_Morning_Start_Date_One__c,long_Morining_Service_Ref_Id__c
                    FROM ShiftWithStaff__c
        WHERE Add_Shift__c IN :oldToNewAddShiftMap.keySet()
    ];

    /* =====================================================
       PRELOAD STAFF + DOCS + UNAVAILABILITY + REJECTED
       ===================================================== */
    Set<Id> staffIds = new Set<Id>();
    for (ShiftWithStaff__c s : sourceStaffShifts) {
        staffIds.add(s.Staff__c);
    }

    Map<Id, Staff__c> staffMap = new Map<Id, Staff__c>([
        SELECT Id, Set_Hours__c, Restrict_Set_Hours__c
        FROM Staff__c WHERE Id IN :staffIds
    ]);

    Set<Id> staffWithExpiredDocs = new Set<Id>();
    for (Child_Staff__c doc : [
        SELECT Staff__c, Status__c, Expiry_Date__c, Compliance__c
        FROM Child_Staff__c WHERE Staff__c IN :staffIds
    ]) {
        if (
            doc.Status__c == 'Rejected' ||    doc.Status__c == 'Pending' ||  (doc.Compliance__c && doc.Expiry_Date__c <= Date.today())
        ) {
            staffWithExpiredDocs.add(doc.Staff__c);
        }
    }

    Map<Id, List<Leave__c>> leavesByStaff = new Map<Id, List<Leave__c>>();

        for (Leave__c l : [
            SELECT Staff__c, From__c, To__c
            FROM Leave__c
            WHERE Status__c = 'Approved'
            AND From__c <= :endDt
            AND To__c   >= :startDt
        ]) {
            if (!leavesByStaff.containsKey(l.Staff__c)) {
                leavesByStaff.put(l.Staff__c, new List<Leave__c>());
            }
            leavesByStaff.get(l.Staff__c).add(l);
        }


    Map<Id, List<Availability__c>> unavailableByStaff = new Map<Id, List<Availability__c>>();
    for (Availability__c a : [
        SELECT Staff__c, Start_Date__c, Start_Time__c, End_Time__c
        FROM Availability__c
        WHERE Staff__c IN :staffIds
        AND Type__c = 'Unavailable'    ]) {     if (!unavailableByStaff.containsKey(a.Staff__c)) {        unavailableByStaff.put(a.Staff__c, new List<Availability__c>());        }     unavailableByStaff.get(a.Staff__c).add(a);
    }

   // staffId -> (weekStartDate -> totalHours)
    Map<Id, Map<Date, Decimal>> weeklyHoursByStaff = new Map<Id, Map<Date, Decimal>>();

    for (ShiftWithStaff__c e : existingShifts) {

        // ❗ Skip weekend shifts for weekly hours calculation
        if (isWeekend(e.Start_Date__c)) {
            continue;
        }

        Date weekStart = e.Start_Date__c.toStartOfWeek();

        if (!weeklyHoursByStaff.containsKey(e.Staff__c)) {
            weeklyHoursByStaff.put(e.Staff__c, new Map<Date, Decimal>());
        }

        Map<Date, Decimal> staffWeekMap = weeklyHoursByStaff.get(e.Staff__c);

        staffWeekMap.put(
            weekStart,
            (staffWeekMap.get(weekStart) == null ? 0 : staffWeekMap.get(weekStart))
            + (e.Duration__c == null ? 0 : e.Duration__c)
        );
    }


    /* =====================================================
       CLONE STAFF SHIFTS (INLINE SKIP)
       ===================================================== */
    List<ShiftWithStaff__c> newStaffShifts = new List<ShiftWithStaff__c>();
    Map<Id, Id> oldToNewStaffShiftMap = new Map<Id, Id>();

    for (ShiftWithStaff__c src : sourceStaffShifts) {
    Id staffId = src.Staff__c;
        system.debug('staffId ==>'+staffId);
        system.debug('dateOffset ==>'+dateOffset);
       // system.debug('src.Start_Date__c ==>'+src.Start_Date__c);
        system.debug('src.Date__c ==>'+src.Date__c);
    Date newStartDate = src.Start_Date__c !=null ? src.Start_Date__c.addDays(dateOffset) :src.Date__c.addDays(dateOffset);
    Date newEndDate = src.Shift_End_Date__c !=null ? src.Shift_End_Date__c.addDays(dateOffset) :src.Date__c.addDays(dateOffset);
    DateTime proposedStart = DateTime.newInstanceGmt(newStartDate, src.Shift_Start_Time__c !=null ?src.Shift_Start_Time__c : src.Add_Shift__r.Start_Time__c);
    DateTime proposedEnd = DateTime.newInstanceGmt(newEndDate, src.Shift_End_Time__c !=null ?src.Shift_End_Time__c : src.Add_Shift__r.End_Time__c);
    
    // SKIP RULES - Initialize flags
    Boolean shouldSkip = false;
    
    // 1. Check for expired/rejected documents
    if (staffWithExpiredDocs.contains(staffId)) {
        continue; // Skip this shift entirely
    }
    
    // 2. Check for unavailability
    if (unavailableByStaff.containsKey(staffId)) {
        for (Availability__c a : unavailableByStaff.get(staffId)) {
            if (isOverlap(
                proposedStart, proposedEnd,
                DateTime.newInstanceGmt(a.Start_Date__c, a.Start_Time__c),
                DateTime.newInstanceGmt(a.Start_Date__c, a.End_Time__c)
            )) {
                shouldSkip = true;
                break; // Exit unavailability check loop
            }
        }
        if (shouldSkip) {
            continue; // Skip this shift
        }
    }
    
    // 3. Check for existing shift overlaps
    if (existingByStaff.containsKey(staffId)) {
        for (ShiftWithStaff__c e : existingByStaff.get(staffId)) {
            if (isOverlap(
                proposedStart, proposedEnd,
                DateTime.newInstanceGmt(e.Start_Date__c, e.Shift_Start_Time__c),
                DateTime.newInstanceGmt(e.Shift_End_Date__c, e.Shift_End_Time__c)
            )) {
                shouldSkip = true;
                break; // Exit overlap check loop
            }
        }
        if (shouldSkip) {
            continue; // Skip this shift
        }
    }
    // 5. Check for approved leave
        if (leavesByStaff.containsKey(staffId)) {    for (Leave__c l : leavesByStaff.get(staffId)) {  if (l.From__c <= proposedEnd.date() && l.To__c   >= proposedStart.date()  ) {               continue; // skip this shift
                }
            }
        }

    
    // 4. Check for weekly hour limits (only for weekdays)
    Staff__c staff = staffMap.get(staffId);
    if (staff != null && staff.Restrict_Set_Hours__c == true && staff.Set_Hours__c != null) {
        // Skip weekly hours check for weekends
        if (!isWeekend(newStartDate)) {
            Date targetWeekStart = newStartDate.toStartOfWeek();
            
            Decimal existingHours = 0;
            if (weeklyHoursByStaff.containsKey(staffId) && 
                weeklyHoursByStaff.get(staffId).containsKey(targetWeekStart)) {
                existingHours = weeklyHoursByStaff.get(staffId).get(targetWeekStart);
            }
            
            Decimal proposedHours = src.Duration__c != null ? src.Duration__c : 0;
            
            if ((existingHours + proposedHours) > staff.Set_Hours__c) {
                continue; // Skip this shift due to hour limit
            }
            
            // Update weekly hours tracking
            if (!weeklyHoursByStaff.containsKey(staffId)) {
                weeklyHoursByStaff.put(staffId, new Map<Date, Decimal>());
            }
            weeklyHoursByStaff.get(staffId).put(
                targetWeekStart,
                existingHours + proposedHours
            );
        }
    }
    
    // ✅ If all checks passed, CLONE the shift
    ShiftWithStaff__c cloned = src.clone(false, true, false, false);
    cloned.Add_Shift__c = oldToNewAddShiftMap.get(src.Add_Shift__c);
    cloned.Start_Date__c = newStartDate;
    cloned.Shift_End_Date__c = newEndDate;
    cloned.Status__c='Draft';
    cloned.Attendence__c=false;
    cloned.Is_Published_Shifts__c = false;
    cloned.Log_In_Date_Time__c = null;
    cloned.Log_Out_Date_Time__c = null;
    cloned.SignIn_Notes__c = copyShiftNotes ? src.SignIn_Notes__c : '';
    
    newStaffShifts.add(cloned);
}

    insert newStaffShifts;
   Map<Id, Integer> addShiftToCount = new Map<Id, Integer>();
    List<Id> newAddShiftIds = new List<Id>();
        for (Add_Shift__c aa :newAddShifts){
            newAddShiftIds.add(aa.Id);
        }

        for (AggregateResult ar : [
            SELECT Add_Shift__c addShiftId, COUNT(Id) cnt
            FROM ShiftWithStaff__c
            WHERE Add_Shift__c IN :newAddShiftIds
            GROUP BY Add_Shift__c
        ]) {
            addShiftToCount.put(
                (Id) ar.get('addShiftId'),
                (Integer) ar.get('cnt')
            );
        }

    List<Add_Shift__c> addShiftsToUpdate = new List<Add_Shift__c>();
    List<Add_Shift__c> addShiftsToDelete = new List<Add_Shift__c>();

    for (Add_Shift__c a : newAddShifts) {

        Integer childCount = addShiftToCount.containsKey(a.Id)
            ? addShiftToCount.get(a.Id)
            : 0;

        // ❌ DELETE newly created Add_Shift with no staff assigned
        if (childCount == 0) {
            addShiftsToDelete.add(a);
            continue;
        }

        // ✅ UPDATE Quantity to actual child count
        if (a.Quantity__c != childCount) {
            a.Quantity__c = childCount;
            addShiftsToUpdate.add(a);
        }
    }

    if (!addShiftsToUpdate.isEmpty()) {
        update addShiftsToUpdate;
    }

    if (!addShiftsToDelete.isEmpty()) {
        delete addShiftsToDelete;
    }



    for (Integer i = 0; i < sourceStaffShifts.size(); i++) {
        if (i < newStaffShifts.size()) {
            oldToNewStaffShiftMap.put(
                sourceStaffShifts[i].Id,
                newStaffShifts[i].Id
            );
        }
    }

    /* =====================================================
       SERVICES + CHECKLIST (UNCHANGED)
       ===================================================== */
    if (copyParticipant) {
        List<Services_and_Support_Plan__c> newServices = new List<Services_and_Support_Plan__c>();
        for (Services_and_Support_Plan__c svc : [
            SELECT Id, ShiftWithStaff__c,
                            Client__c, Funds_Tracker__c, Service_Users__c, Date_of_Service__c, Start_Time_24_Format__c,End_Time_24_Format__c,Service_Type__c,Services__c,State__c,Qty__c,Status__c,
                            Edited_Unit_Price__c, Custom_Shift_Reference_Id__c, Un_Assigned_Service__c
                        FROM Services_and_Support_Plan__c
            WHERE ShiftWithStaff__c IN :oldToNewStaffShiftMap.keySet()
        ]) {
            Services_and_Support_Plan__c cloned = svc.clone(false, true, false, false);
            cloned.ShiftWithStaff__c = oldToNewStaffShiftMap.get(svc.ShiftWithStaff__c);
            cloned.Date_of_Service__c = svc.Date_of_Service__c.addDays(dateOffset);
            cloned.Status__c='Draft';
            newServices.add(cloned);
        }
        insert newServices;
    }

    if (copyChecklist) {
        List<Add_Shift_Checklist__c> newChecklists = new List<Add_Shift_Checklist__c>();
        for (Add_Shift_Checklist__c cl : [
            SELECT Id, ShiftWithStaff__c,
                        Description__c, Mandatory__c, Created_By_Static_Data__c
                    FROM Add_Shift_Checklist__c
                    WHERE ShiftWithStaff__c IN :oldToNewStaffShiftMap.keySet()       ]) {          Add_Shift_Checklist__c cloned = cl.clone(false, true, false, false);        cloned.ShiftWithStaff__c = oldToNewStaffShiftMap.get(cl.ShiftWithStaff__c);        newChecklists.add(cloned);
        }
        insert newChecklists;
    }
}

    /* =======================
    HELPER
    ======================= */
  public static Boolean isOverlap(
    DateTime s1, DateTime e1,
    DateTime s2, DateTime e2
) {
    System.debug('========== OVERLAP CHECK ==========');
    System.debug('Shift 1 : ' + s1 + ' → ' + e1);
    System.debug('Shift 2 : ' + s2 + ' → ' + e2);

    Boolean startsBeforeOtherEnds = s1 < e2;
    Boolean endsAfterOtherStarts  = e1 > s2;

    System.debug('s1 < e2 ? ' + startsBeforeOtherEnds);
    System.debug('e1 > s2 ? ' + endsAfterOtherStarts);

    Boolean overlap = startsBeforeOtherEnds && endsAfterOtherStarts;
    System.debug('OVERLAP = ' + overlap);
    System.debug('===================================');

    return overlap;
}
    public static Boolean isWeekend(Date d) {
    Integer dow =
        Integer.valueOf(DateTime.newInstance(d, Time.newInstance(0, 0, 0, 0)).format('u'));
    return dow == 6 || dow == 7; // Saturday or Sunday
}
public class StaffLeaveWrapper {
    @AuraEnabled public Id staffId;
    @AuraEnabled public String staffName;
    @AuraEnabled public Date fromDate;
    @AuraEnabled public Date toDate;
}

@AuraEnabled(cacheable=true)
public static List<StaffLeaveWrapper> getStaffWithApprovedLeaves(
    string startDate,
    string endDate,
    List<Id> facilityIdList
) {
    List<StaffLeaveWrapper> result = new List<StaffLeaveWrapper>();
    system.debug('startDate '+startDate);
    system.debug('endDate '+endDate);
    system.debug('facilityIdList '+facilityIdList);
   Date sDate=Date.valueOf(startDate);
   Date eDate=Date.valueOf(endDate);
        list<Leave__c> leaves = [
            SELECT Staff__c,
                Staff__r.Display_Nickname__c,
                From__c,
                To__c
            FROM Leave__c
            WHERE Status__c = 'Approved'
            AND From__c <= :eDate
             AND To__c   >= :sDate
            AND Staff__c IN (
                SELECT Staff__c
                FROM Staff_Facility__c
                WHERE Facility__c IN :facilityIdList
                AND Active__c = true
            )
        ];
    System.debug('leaves ' +leaves);
    for (Leave__c l : leaves) {   StaffLeaveWrapper w = new StaffLeaveWrapper();      w.staffId = l.Staff__c;       w.staffName = l.Staff__r.Display_Nickname__c;      w.fromDate = l.From__c;     w.toDate = l.To__c;      result.add(w);
    }

    return result;
}



}