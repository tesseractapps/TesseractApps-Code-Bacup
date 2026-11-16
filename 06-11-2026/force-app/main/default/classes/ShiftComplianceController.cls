public with sharing class ShiftComplianceController {

    @AuraEnabled
    public static Map<Id, Map<Date, List<String>>> shiftComplianceValidations(
        Id facilityId,
        List<Id> staffIds,
        List<Date> inputDates,
        String startTimeStr,
        String endTimeStr,
        Boolean isEditMode,
        Id currentShiftId,
        String shiftRole ,
        list<String> otherGroupShiftShiftIds
    ) {

        System.debug('ShiftCompliance → START');
        System.debug('facilityId=' + facilityId);
        System.debug('staffIds=' + staffIds);
        System.debug('inputDates=' + inputDates);
        System.debug('startTimeStr=' + startTimeStr);
        System.debug('endTimeStr=' + endTimeStr);

        Map<Id, Map<Date, List<String>>> warnings =
            new Map<Id, Map<Date, List<String>>>();

        if (facilityId == null ||
            staffIds == null || staffIds.isEmpty() ||
            inputDates == null || inputDates.isEmpty() ||
            String.isBlank(startTimeStr) ||
            String.isBlank(endTimeStr)) {

            System.debug('ShiftCompliance → Invalid input, exiting');
            return warnings;
        }

        Time startTime = parseTime(startTimeStr);
        Time endTime   = parseTime(endTimeStr);

        
        inputDates.sort();

        /* ================= LOAD RULES ================= */
        List<Facility_Compliance_Setting__c> rules = [
            SELECT Roles__c,
                   Apply_to_specific_roles__c,
                   Max_Hours_Per_Shift__c,
                   Max_Hours_Per_Week__c,
                   Max_Consecutive_Days__c,
                   Min_Hours_Between_Shifts__c,Facility__r.Organisation__r.Week_Start_Day__c
            FROM Facility_Compliance_Setting__c
            WHERE Facility__c = :facilityId AND Is_Active__c =true
        ];

        if (rules.isEmpty()) {
            return warnings;
        }
        Integer maxBackDays = 0;

            for (Facility_Compliance_Setting__c r : rules) {
                if (r.Max_Consecutive_Days__c != null) {
                    maxBackDays = Math.max(
                        maxBackDays,
                        Integer.valueOf(r.Max_Consecutive_Days__c)
                    );
                }
            }


        /* ================= LOAD STAFF ROLES ================= */
        Map<Id, Set<String>> rolesByStaff = new Map<Id, Set<String>>();

        for (StaffRole__c sr : [
            SELECT StaffRole_To_Staff__c, RoleName__c
            FROM StaffRole__c
            WHERE StaffRole_To_Staff__c IN :staffIds
            AND Facility__c = :facilityId
            AND Active__c = true
        ]) {
            if (!rolesByStaff.containsKey(sr.StaffRole_To_Staff__c)) {
                rolesByStaff.put(sr.StaffRole_To_Staff__c, new Set<String>());
            }
            if (sr.RoleName__c != null) {
                rolesByStaff.get(sr.StaffRole_To_Staff__c).add(sr.RoleName__c.trim());
            }
        }

        /* ================= LOAD EXISTING SHIFTS ================= */
       List<ShiftwithStaff__c> existingShifts = [ SELECT Id, Staff__c, Start_Date__c, Shift_End_Date__c,  Shift_Start_Time__c, Shift_End_Time__c, Duration__c  FROM ShiftwithStaff__c WHERE Staff__c IN :staffIds  AND Start_Date__c <= :inputDates[inputDates.size() - 1]  AND Shift_End_Date__c >= :inputDates[0].addDays(-maxBackDays) and Status__c NOT IN ('Unassigned','Cancelled')  AND (Shift_Rejected__c = false OR Shift_Rejected__c = null) ];

        if (isEditMode && currentShiftId != null) {
            List<ShiftwithStaff__c> filtered = new List<ShiftwithStaff__c>();
            for (ShiftwithStaff__c s : existingShifts) {
                 if ( s.Id != currentShiftId && (otherGroupShiftShiftIds == null ||!otherGroupShiftShiftIds.contains(s.Id))) {
                        filtered.add(s);
                    }
            }
            existingShifts = filtered;
        }

        /* ================= GROUP SHIFTS ================= */
        Map<Id, List<ShiftwithStaff__c>> shiftsByStaff =
            new Map<Id, List<ShiftwithStaff__c>>();

        for (ShiftwithStaff__c s : existingShifts) {
            if (!shiftsByStaff.containsKey(s.Staff__c)) {
                shiftsByStaff.put(s.Staff__c, new List<ShiftwithStaff__c>());
            }
            shiftsByStaff.get(s.Staff__c).add(s);
        }

        /* ================= PROCESS ================= */
        for (Id staffId : staffIds) {

            Set<String> staffRoles =
                rolesByStaff.containsKey(staffId)
                    ? rolesByStaff.get(staffId)
                    : new Set<String>();

            List<ShiftwithStaff__c> staffShifts =
                shiftsByStaff.containsKey(staffId)
                    ? shiftsByStaff.get(staffId)
                    : new List<ShiftwithStaff__c>();

            for (Facility_Compliance_Setting__c rule : rules) {

                // ===== SHIFT ROLE FILTER =====
                if (String.isNotBlank(shiftRole)) {

                    // Defensive: rule configured for role-based usage but Roles__c empty
                    if (String.isBlank(rule.Roles__c)) {
                        continue;
                    }

                    Boolean shiftRoleMatched = false;
                    for (String r : rule.Roles__c.split(',')) {
                        if (r.trim().equalsIgnoreCase(shiftRole.trim())) {
                            shiftRoleMatched = true;
                            break;
                        }
                    }

                    // Skip rule if shift role does NOT match
                    if (!shiftRoleMatched) {
                        continue;
                    }
                }


                if (rule.Apply_to_specific_roles__c) {

                    // Defensive: skip misconfigured role-specific rules
                    if (String.isBlank(rule.Roles__c)) {
                        continue;
                    }

                    if (!rolesMatch(rule.Roles__c, staffRoles)) {
                        continue; // skip this rule for this staff
                    }
                }

                /* ===== MAX HOURS PER SHIFT ===== */
                if (rule.Max_Hours_Per_Shift__c != null) {
                    for (Date d : inputDates) {

                        DateTime sd = DateTime.newInstance(d, startTime);
                        DateTime ed = DateTime.newInstance(d, endTime);
                        if (endTime < startTime) ed = ed.addDays(1);

                        Decimal hrs =
                            (ed.getTime() - sd.getTime()) /
                            (1000.0 * 60 * 60);

                        if (hrs > rule.Max_Hours_Per_Shift__c) {
                            addWarning(
                                warnings,
                                staffId,
                                d,
                                'Shift exceeds max hours per shift (' +
                                hrs.setScale(1) + ' hrs)'
                            );
                        }
                    }
                }

               /* ===== MAX CONSECUTIVE DAYS ===== */
                    if (rule.Max_Consecutive_Days__c != null) {

                        Integer maxDays =
                            Integer.valueOf(rule.Max_Consecutive_Days__c);

                      /*   System.debug('===== MAX CONSECUTIVE DAYS CHECK =====');
                        System.debug('Max Days Allowed: ' + maxDays);
                        System.debug('Input Dates: ' + inputDates);
                        System.debug('staffShifts: ' + staffShifts);
 */
                        // ---------------------------------------------------
                        // STEP 1: Collect ALL dates
                        // Existing shifts + New input dates
                        // ---------------------------------------------------

                        Set<Date> allDatesSet = new Set<Date>();

                        // Existing shifts
                        for (ShiftwithStaff__c s : staffShifts) {

                            System.debug(
                                'Processing Shift: ' +
                                s.Start_Date__c +
                                ' -> ' +
                                s.Shift_End_Date__c
                            );

                            Date dt = s.Start_Date__c;

                            while (dt <= s.Shift_End_Date__c) {
                                allDatesSet.add(dt);
                                dt = dt.addDays(1);
                            }
                        }

                        // New input dates
                        allDatesSet.addAll(inputDates);

                        // ---------------------------------------------------
                        // STEP 2: Sort dates
                        // ---------------------------------------------------

                        List<Date> allDates = new List<Date>();
                        allDates.addAll(allDatesSet);
                        allDates.sort();

                     //   System.debug('All Shift Dates: ' + allDates);

                        // ---------------------------------------------------
                        // STEP 3: Check consecutive streaks
                        // ---------------------------------------------------

                        Integer streak = 1;

                        for (Integer i = 1; i < allDates.size(); i++) {

                            Date currentDate = allDates[i];
                            Date previousDate = allDates[i - 1];

                            // Consecutive day
                            if (previousDate.addDays(1) == currentDate) {

                                streak++;

                            } else {

                                // Reset streak
                                streak = 1;
                            }

                            System.debug(
                                'CurrentDate=' + currentDate +
                                ' | PreviousDate=' + previousDate +
                                ' | Streak=' + streak
                            );

                            // Exceeded limit
                            if (streak > maxDays) {

                                // Only warn for NEWLY selected dates
                                if (inputDates.contains(currentDate)) {

                                    addWarning(
                                        warnings,
                                        staffId,
                                        currentDate,
                                        'Exceeded max consecutive days (' +
                                        maxDays +
                                        ')'
                                    );
                                }
                            }
                        }

                        System.debug('===== END MAX CONSECUTIVE DAYS CHECK =====');
                    }
                /* ===== MAX HOURS PER WEEK ===== */
               if (rule.Max_Hours_Per_Week__c != null) {

                System.debug('=== WEEKLY VALIDATION START ===');

                Map<Date, Decimal> weekly = new Map<Date, Decimal>();

                for (ShiftwithStaff__c s : staffShifts) {

                    if (isWeekend(s.Start_Date__c)) {
                        System.debug('Skipping Weekend Existing Shift => ' + s.Start_Date__c);
                        continue;
                    }

                    Date wk = getCustomWeekStart(s.Start_Date__c, rule.Facility__r.Organisation__r.Week_Start_Day__c);

                    weekly.put(wk, (weekly.containsKey(wk) ? weekly.get(wk) : 0) + (s.Duration__c != null ? s.Duration__c : 0));

                    System.debug('Existing Shift Added => Week: ' + wk + ' Total: ' + weekly.get(wk));
                }

                System.debug('Input Dates => ' + inputDates);

                for (Date d : inputDates) {

                    if (isWeekend(d)) {
                        System.debug('Skipping Weekend Input Shift => ' + d);
                        continue;
                    }

                    Date wk = getCustomWeekStart(d, rule.Facility__r.Organisation__r.Week_Start_Day__c);

                    DateTime sd = DateTime.newInstance(d, startTime);
                    DateTime ed = DateTime.newInstance(d, endTime);

                    if (endTime < startTime) {
                        ed = ed.addDays(1);
                    }

                    Decimal h = (ed.getTime() - sd.getTime()) / (1000.0 * 60 * 60);

                    Decimal total = (weekly.containsKey(wk) ? weekly.get(wk) : 0) + h;

                    weekly.put(wk, total);

                    System.debug('Input Shift Added => Date: ' + d + ' Week: ' + wk + ' Total: ' + total);

                    if (total > rule.Max_Hours_Per_Week__c) {

                        System.debug('Weekly Limit Exceeded On => ' + d);

                        addWarning(
                            warnings,
                            staffId,
                            d,
                            'Weekly hours exceeded. Current: ' + total.setScale(1) +
                            ' hrs | Limit: ' + rule.Max_Hours_Per_Week__c.setScale(1) + ' hrs'
                        );
                    }
                }

                System.debug('Final Weekly Map => ' + weekly);
                System.debug('=== WEEKLY VALIDATION END ===');
            }

                /* ===== MIN HOURS BETWEEN SHIFTS ===== */
                if (rule.Min_Hours_Between_Shifts__c != null) {

                    for (Date d : inputDates) {

                        DateTime currStart =
                            DateTime.newInstance(d, startTime);

                        for (ShiftwithStaff__c s : staffShifts) {

                            DateTime prevEnd =
                                DateTime.newInstance(
                                    s.Shift_End_Date__c,
                                    s.Shift_End_Time__c
                                );

                            if (s.Shift_End_Time__c < s.Shift_Start_Time__c) {
                                prevEnd = prevEnd.addDays(1);
                            }

                            Decimal gap =
                                (currStart.getTime() - prevEnd.getTime()) /
                                (1000.0 * 60 * 60);

                            if (gap > 0 &&
                                gap < rule.Min_Hours_Between_Shifts__c) {
                                addWarning(
                                    warnings,
                                    staffId,
                                    d,
                                    'Insufficient rest between shifts (' +
                                    gap.setScale(1) + ' hrs)'
                                );
                            }
                        }
                    }
                }
            }
        }

        System.debug('ShiftCompliance → END');
        return warnings;
    }

    /* ================= HELPERS ================= */

    public static Boolean rolesMatch(String ruleRoles, Set<String> staffRoles) {
        if (String.isBlank(ruleRoles)) return true;
        for (String r : ruleRoles.split(',')) {
            if (staffRoles.contains(r.trim())) return true;
        }
        return false;
    }
    public static Date getCustomWeekStart(
    Date inputDate,
    String weekStartDay
     ) {

    Map<String, Integer> dayMap = new Map<String, Integer>{
        'MONDAY' => 1,
        'TUESDAY' => 2,
        'WEDNESDAY' => 3,
        'THURSDAY' => 4,
        'FRIDAY' => 5,
        'SATURDAY' => 6,
        'SUNDAY' => 7
    };

    Integer targetDay =
        dayMap.get(weekStartDay.toUpperCase());

    Integer currentDay =
        inputDate.toStartOfWeek().daysBetween(inputDate) + 1;

    Integer diff = currentDay - targetDay;

    if (diff < 0) {
        diff += 7;
    }

    return inputDate.addDays(-diff);
}
public static Boolean isWeekend(Date d) {

    Integer dayNum =
        d.toStartOfWeek().daysBetween(d) + 1;

    return dayNum == 6 || dayNum == 7;
}

    public static Time parseTime(String t) {
        String s = t.trim().toUpperCase();
        Boolean pm = s.endsWith('PM');
        Boolean am = s.endsWith('AM');

        s = s.replace('AM', '').replace('PM', '').trim();

        List<String> p = s.split(':');
        Integer h = Integer.valueOf(p[0]);
        Integer m = Integer.valueOf(p[1]);

        if (pm && h < 12) h += 12;
        if (am && h == 12) h = 0;

        return Time.newInstance(h, m, 0, 0);
    }

    public static void addWarning(
        Map<Id, Map<Date, List<String>>> addWarningMap,
        Id staffId,
        Date d,
        String msg
    ) {
        if (!addWarningMap.containsKey(staffId)) {
            addWarningMap.put(staffId, new Map<Date, List<String>>());
        }
        if (!addWarningMap.get(staffId).containsKey(d)) {
            addWarningMap.get(staffId).put(d, new List<String>());
        }
        addWarningMap.get(staffId).get(d).add(msg);
    }
}