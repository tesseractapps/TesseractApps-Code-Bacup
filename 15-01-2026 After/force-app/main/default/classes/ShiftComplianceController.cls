public with sharing class ShiftComplianceController {

    @AuraEnabled
    public static Map<Id, Map<Date, List<String>>> shiftComplianceValidations(
        Id facilityId,
        List<Id> staffIds,
        List<Date> inputDates,
        String startTimeStr,
        String endTimeStr,
        Boolean isEditMode,
        Id currentShiftId
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
                   Min_Hours_Between_Shifts__c
            FROM Facility_Compliance_Setting__c
            WHERE Facility__c = :facilityId
        ];

        if (rules.isEmpty()) {
            return warnings;
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
        List<ShiftwithStaff__c> existingShifts = [
            SELECT Id,
                   Staff__c,
                   Start_Date__c,
                   Shift_End_Date__c,
                   Shift_Start_Time__c,
                   Shift_End_Time__c,
                   Duration__c
            FROM ShiftwithStaff__c
            WHERE Staff__c IN :staffIds
            AND Start_Date__c <= :inputDates[inputDates.size() - 1]
            AND Shift_End_Date__c >= :inputDates[0]
        ];

        if (isEditMode && currentShiftId != null) {
            List<ShiftwithStaff__c> filtered = new List<ShiftwithStaff__c>();
            for (ShiftwithStaff__c s : existingShifts) {
                if (s.Id != currentShiftId) {
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

                if (rule.Apply_to_specific_roles__c &&
                    !rolesMatch(rule.Roles__c, staffRoles)) {
                    continue;
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

                    Integer streak = 1;

                    for (Integer i = 1; i < inputDates.size(); i++) {
                        if (inputDates[i] == inputDates[i - 1].addDays(1)) {
                            streak++;
                            if (streak > rule.Max_Consecutive_Days__c) {
                                addWarning(
                                    warnings,
                                    staffId,
                                    inputDates[i],
                                    'Exceeded max consecutive days'
                                );
                            }
                        } else {
                            streak = 1;
                        }
                    }
                }

                /* ===== MAX HOURS PER WEEK ===== */
                if (rule.Max_Hours_Per_Week__c != null) {

                    Map<Date, Decimal> weekly = new Map<Date, Decimal>();

                    for (ShiftwithStaff__c s : staffShifts) {
                        Date wk = s.Start_Date__c.toStartOfWeek();
                        weekly.put(wk,
                            (weekly.containsKey(wk) ? weekly.get(wk) : 0) +
                            (s.Duration__c != null ? s.Duration__c : 0));
                    }

                    for (Date d : inputDates) {
                        Date wk = d.toStartOfWeek();
                        DateTime sd = DateTime.newInstance(d, startTime);
                        DateTime ed = DateTime.newInstance(d, endTime);
                        if (endTime < startTime) ed = ed.addDays(1);
                        Decimal h =
                            (ed.getTime() - sd.getTime()) /
                            (1000.0 * 60 * 60);

                        weekly.put(wk,
                            (weekly.containsKey(wk) ? weekly.get(wk) : 0) + h);
                    }

                    for (Date wk : weekly.keySet()) {
                        if (weekly.get(wk) > rule.Max_Hours_Per_Week__c) {
                            addWarning(
                                warnings,
                                staffId,
                                wk,
                                'Weekly hours exceed limit (' +
                                weekly.get(wk).setScale(1) + ' hrs)'
                            );
                        }
                    }
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