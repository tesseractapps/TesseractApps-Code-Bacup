public with sharing class ShiftComplianceReportHandler {

    // ==========================
    // REPORT ROW WRAPPER
    // ==========================
    public class ComplianceRow {
        @AuraEnabled public Id staffId;
        @AuraEnabled public String staffName;
        @AuraEnabled public Date relatedDate;
        @AuraEnabled public String ruleName;
        @AuraEnabled public String status;
        @AuraEnabled public String reason;
    }

    // ==========================
    // MAIN ENTRY
    // ==========================
    @AuraEnabled
    public static List<ComplianceRow> generateComplianceReport(
        Id facilityId,
        List<Id> staffIds,
        Date startDate,
        Date endDate
    ) {

        List<ComplianceRow> report = new List<ComplianceRow>();

        if (facilityId == null || staffIds == null || staffIds.isEmpty()) {
            return report;
        }

        /* ================= LOAD ALL RULE RECORDS ================= */
        List<Facility_Compliance_Setting__c> rules = [
            SELECT Roles__c,
                   Apply_to_specific_roles__c,
                   Max_Hours_Per_Shift__c,
                   Max_Hours_Per_Week__c,
                   Max_Consecutive_Days__c,
                   Min_Hours_Between_Shifts__c,
                   Max_Late_Clock_In_minutes__c,
                   Max_Missed_Shifts_Per_Month__c
            FROM Facility_Compliance_Setting__c
            WHERE Facility__c = :facilityId AND Is_Active__c =true
        ];

        if (rules.isEmpty()) {
            return report;
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

        /* ================= LOAD SHIFTS ================= */
        List<ShiftwithStaff__c> shifts = [
            SELECT Id,
                   Staff__c,
                   Staff__r.NameToDisplay__c,
                   Start_Date__c,
                   Shift_End_Date__c,
                   Shift_Start_Time__c,
                   Shift_End_Time__c,
                   Duration__c,
                   Log_In_Date_Time__c,
                   Log_Out_Date_Time__c,
                   Final_Login_DateTime__c,
                   Final_Logout_DateTime__c

            FROM ShiftwithStaff__c
            WHERE Staff__c IN :staffIds
            AND Start_Date__c >= :startDate
            AND Start_Date__c <= :endDate
        ];

        /* ================= GROUP SHIFTS BY STAFF ================= */
        Map<Id, List<ShiftwithStaff__c>> shiftsByStaff = new Map<Id, List<ShiftwithStaff__c>>();
        for (ShiftwithStaff__c s : shifts) {
            if (!shiftsByStaff.containsKey(s.Staff__c)) {
                shiftsByStaff.put(s.Staff__c, new List<ShiftwithStaff__c>());
            }
            shiftsByStaff.get(s.Staff__c).add(s);
        }

        /* ================= PROCESS ================= */
        for (Id staffId : shiftsByStaff.keySet()) {

            List<ShiftwithStaff__c> staffShifts = shiftsByStaff.get(staffId);
            staffShifts = sortShiftsByStartDateTime(staffShifts);

            Set<String> staffRoles =
                rolesByStaff.containsKey(staffId)
                    ? rolesByStaff.get(staffId)
                    : new Set<String>();

            for (Facility_Compliance_Setting__c rule : rules) {

                // ---------- ROLE FILTER ----------
                if (rule.Apply_to_specific_roles__c == true &&
                    !rolesMatch(rule.Roles__c, staffRoles)) {
                    continue;
                }

                // =====================================================
                // MAX HOURS PER SHIFT
                // =====================================================
                if (rule.Max_Hours_Per_Shift__c != null) {
                    for (ShiftwithStaff__c s : staffShifts) {
                        if (s.Duration__c != null &&
                            s.Duration__c > rule.Max_Hours_Per_Shift__c) {

                            report.add(buildRow(
                                s,
                                'Max Hours Per Shift',
                                'NON-COMPLIANT',
                                'Worked ' + s.Duration__c + ' hrs (limit ' +
                                rule.Max_Hours_Per_Shift__c + ')'
                            ));
                        }
                    }
                }

                // =====================================================
                // MAX HOURS PER WEEK
                // =====================================================
                if (rule.Max_Hours_Per_Week__c != null) {

                    Map<Date, Decimal> weeklyHours = new Map<Date, Decimal>();

                    for (ShiftwithStaff__c s : staffShifts) {
                        Date wk = s.Start_Date__c.toStartOfWeek();
                        Decimal hrs = s.Duration__c != null ? s.Duration__c : 0;

                        weeklyHours.put(
                            wk,
                            (weeklyHours.containsKey(wk)
                                ? weeklyHours.get(wk)
                                : 0) + hrs
                        );
                    }

                    for (Date wk : weeklyHours.keySet()) {
                        if (weeklyHours.get(wk) > rule.Max_Hours_Per_Week__c) {

                            ComplianceRow row = new ComplianceRow();
                            row.staffId = staffId;
                            row.staffName = staffShifts[0].Staff__r.NameToDisplay__c;
                            row.relatedDate = wk;
                            row.ruleName = 'Max Hours Per Week';
                            row.status = 'NON-COMPLIANT';
                            row.reason =
                                'Worked ' + weeklyHours.get(wk) +
                                ' hrs (limit ' + rule.Max_Hours_Per_Week__c + ')';

                            report.add(row);
                        }
                    }
                }

                // =====================================================
                // MAX CONSECUTIVE DAYS
                // =====================================================
                if (rule.Max_Consecutive_Days__c != null) {

                    Integer streak = 1;

                    for (Integer i = 1; i < staffShifts.size(); i++) {

                        Date prev = staffShifts[i - 1].Start_Date__c;
                        Date curr = staffShifts[i].Start_Date__c;

                        if (curr == prev.addDays(1)) {
                            streak++;
                            if (streak > rule.Max_Consecutive_Days__c) {
                                report.add(buildRow(
                                    staffShifts[i],
                                    'Max Consecutive Days',
                                    'NON-COMPLIANT',
                                    'Worked ' + streak + ' consecutive days'
                                ));
                            }
                        } else {
                            streak = 1;
                        }
                    }
                }
				staffShifts = sortShiftsByStartDateTime(staffShifts);

                // =====================================================
                // MIN HOURS BETWEEN SHIFTS
                // =====================================================
            if (rule.Min_Hours_Between_Shifts__c != null) {

                System.debug('MinRest → Rule ON. MinHours=' +
                    rule.Min_Hours_Between_Shifts__c);
            
                for (Integer i = 1; i < staffShifts.size(); i++) {
            
                    ShiftwithStaff__c prev = staffShifts[i - 1];
                    ShiftwithStaff__c curr = staffShifts[i];
            
                    DateTime prevEnd =
                        DateTime.newInstance(
                            prev.Shift_End_Date__c,
                            prev.Shift_End_Time__c
                        );
            
                    DateTime currStart =
                        DateTime.newInstance(
                            curr.Start_Date__c,
                            curr.Shift_Start_Time__c
                        );
            
                    Decimal gapHours =
                        (currStart.getTime() - prevEnd.getTime()) /
                        (1000.0 * 60 * 60);
            
                    System.debug(
                        'MinRest → prevEnd=' + prevEnd +
                        ', currStart=' + currStart +
                        ', gapHours=' + gapHours.setScale(2)
                    );
            
                    if (gapHours < rule.Min_Hours_Between_Shifts__c) {
            
                        System.debug(
                            'MinRest → VIOLATION. Required=' +
                            rule.Min_Hours_Between_Shifts__c +
                            ', Actual=' + gapHours.setScale(2)
                        );
            
                        report.add(
                            buildRow(
                                curr,
                                'Min Rest Between Shifts',
                                'NON-COMPLIANT',
                                'Only ' + gapHours.setScale(1) + ' hrs rest'
                            )
                        );
                    }
                }
            }

                /* =====================================================
                RULE: LATE LOGIN / LATE LOGOUT
                ===================================================== */
                if (rule.Max_Late_Clock_In_minutes__c != null) {

                    for (ShiftwithStaff__c s : staffShifts) {
                            if (s.Start_Date__c >= Date.today()) {
                                continue;
                            } 

                        // ----- BUILD SHIFT START / END -----
                        DateTime shiftStartDT =
                            DateTime.newInstance(s.Start_Date__c, s.Shift_Start_Time__c);

                        DateTime shiftEndDT =
                            DateTime.newInstance(s.Shift_End_Date__c, s.Shift_End_Time__c);
                        // ----- LATE LOGIN -----
                        if (s.Log_In_Date_Time__c != null) {

                            Long lateLoginMinutes =
                                (s.Final_Login_DateTime__c.getTime() -
                                shiftStartDT.getTime()) / 60000;

                            if (lateLoginMinutes > rule.Max_Late_Clock_In_minutes__c) {
                                report.add(buildRow(
                                    s,
                                    'Late Clock-In',
                                    'NON-COMPLIANT',
                                    'Late by ' + lateLoginMinutes +
                                    ' minutes (limit ' +
                                    rule.Max_Late_Clock_In_minutes__c + ')'
                                ));
                            }
                        }

                        // ----- LATE LOGOUT -----
                        if (s.Log_Out_Date_Time__c != null) {

                            Long lateLogoutMinutes =
                                (s.Final_Logout_DateTime__c.getTime() -
                                shiftEndDT.getTime()) / 60000;

                            if (lateLogoutMinutes > rule.Max_Late_Clock_In_minutes__c) {
                                report.add(buildRow(
                                    s,
                                    'Late Clock-Out',
                                    'NON-COMPLIANT',
                                    'Late by ' + lateLogoutMinutes +
                                    ' minutes (limit ' +
                                    rule.Max_Late_Clock_In_minutes__c + ')'
                                ));
                            }
                        }
                    } 
                }  
 
                /* =====================================================
                    RULE: MISSED SHIFTS PER MONTH
                    ===================================================== */
                    if (rule.Max_Missed_Shifts_Per_Month__c != null) {

                        Map<String, Integer> missedByMonth = new Map<String, Integer>();

                        for (ShiftwithStaff__c s : staffShifts) {

                            // Only consider completed/past shifts
                            if (s.Start_Date__c >= Date.today()) {
                                continue;
                            }

                            // Missed = login OR logout missing
                            if (s.Log_In_Date_Time__c == null ||
                                s.Log_Out_Date_Time__c == null) {

                                String monthKey =
                                    s.Start_Date__c.year() + '-' +
                                    s.Start_Date__c.month();

                                missedByMonth.put(
                                    monthKey,
                                    (missedByMonth.containsKey(monthKey)
                                        ? missedByMonth.get(monthKey)
                                        : 0) + 1
                                );
                            }
                        }

                        for (String monthKey : missedByMonth.keySet()) {

                            Integer missedCount = missedByMonth.get(monthKey);

                            if (missedCount > rule.Max_Missed_Shifts_Per_Month__c) {

                                // Parse month label for report readability
                                List<String> parts = monthKey.split('-');
                                Integer yr = Integer.valueOf(parts[0]);
                                Integer mn = Integer.valueOf(parts[1]);

                                Date monthDate = Date.newInstance(yr, mn, 1);

                                ComplianceRow row = new ComplianceRow();
                                row.staffId = staffId;
                                row.staffName = staffShifts[0].Staff__r.NameToDisplay__c;
                                row.relatedDate = monthDate;
                                row.ruleName = 'Missed Shifts Per Month';
                                row.status = 'NON-COMPLIANT';
                                row.reason =
                                    'Missed ' + missedCount +
                                    ' shifts (limit ' +
                                    rule.Max_Missed_Shifts_Per_Month__c + ')';

                                report.add(row);
                            }
                        }
                    }



                
            }
        }

        return report;
    }

    /* ================= HELPERS ================= */

    private static Boolean rolesMatch(String ruleRoles, Set<String> staffRoles) {
        if (String.isBlank(ruleRoles)) return true;
        for (String r : ruleRoles.split(',')) {
            if (staffRoles.contains(r.trim())) return true;
        }
        return false;
    }

    private static ComplianceRow buildRow(
        ShiftwithStaff__c s,
        String rule,
        String status,
        String reason
    ) {
        ComplianceRow r = new ComplianceRow();
        r.staffId = s.Staff__c;
        r.staffName = s.Staff__r.NameToDisplay__c;
        r.relatedDate = s.Start_Date__c;
        r.ruleName = rule;
        r.status = status;
        r.reason = reason;
        return r;
    }

  
    private static List<ShiftwithStaff__c> sortShiftsByStartDateTime(
    List<ShiftwithStaff__c> shifts
) {
    if (shifts == null || shifts.size() <= 1) {
        return shifts;
    }

    List<ShiftwithStaff__c> sorted = new List<ShiftwithStaff__c>();

    for (ShiftwithStaff__c curr : shifts) {

        DateTime currStart =
            DateTime.newInstance(
                curr.Start_Date__c,
                curr.Shift_Start_Time__c
            );

        Boolean inserted = false;

        for (Integer i = 0; i < sorted.size(); i++) {

            ShiftwithStaff__c existing = sorted[i];

            DateTime existingStart =
                DateTime.newInstance(
                    existing.Start_Date__c,
                    existing.Shift_Start_Time__c
                );

            if (currStart < existingStart) {
                sorted.add(i, curr);
                inserted = true;
                break;
            }
        }

        if (!inserted) {
            sorted.add(curr);
        }
    }

    return sorted;
 }

 @AuraEnabled
public static List<Facility_Compliance_Setting__c> getFacilityComplianceRules(
    Id facilityId
) {
    if (facilityId == null) {
        return new List<Facility_Compliance_Setting__c>();
    }

    return [
        SELECT Is_Active__c, Roles__c,
               Apply_to_specific_roles__c,
               Max_Hours_Per_Shift__c,
               Max_Hours_Per_Week__c,
               Max_Consecutive_Days__c,
               Min_Hours_Between_Shifts__c,
               Max_Late_Clock_In_minutes__c,
               Max_Missed_Shifts_Per_Month__c,
               Require_Break_Everyhours__c

        FROM Facility_Compliance_Setting__c
        WHERE Facility__c = :facilityId AND Is_Active__c =true
    ];
}

}