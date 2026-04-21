public class BrokenShiftValidations {

    /* ============================
       INPUT SEGMENT
       ============================ */
   public class ShiftSegment {
    public String id;
    public String shifttype;
    public String starttime;
    public String endtime;

    public String rateLabel;
    public Decimal hourlyRate;
    public Boolean rowOnchangeOccured;
    public Integer index;

    public String startTimeSelectedHour;
    public String startTimeSelectedMinute;
    public String startTimeSelectedAmPm;
    public String startTimeDisplayTime;

    public String endTimeSelectedHour;
    public String endTimeSelectedMinute;
    public String endTimeSelectedAmPm;
    public String endTimeDisplayTime;

    public Boolean rowBillableHoursChanged;
    public Decimal billablehours;
}

    /* ============================
       OUTPUT
       ============================ */
    public class ValidationResult {
        @AuraEnabled public Boolean isValid = true;
        @AuraEnabled public String errorMessage;
        @AuraEnabled public List<EnrichedSegment> enrichedSegments;
    }

    /* ============================
       ENRICHED SEGMENT
       ============================ */
        public class EnrichedSegment {

        /* ===== Existing Split Shift Fields ===== */
        @AuraEnabled public String id;
        @AuraEnabled public String rowShiftType;
        @AuraEnabled public String shifttype;

        @AuraEnabled public String startTime;
        @AuraEnabled public String endTime;

        @AuraEnabled public DateTime startDateTime;
        @AuraEnabled public DateTime endDateTime;
        @AuraEnabled public Date startDate;
        @AuraEnabled public Date endDate;

        @AuraEnabled public String startDay;
        @AuraEnabled public String endDay;
        @AuraEnabled public Boolean isNextDay;

        @AuraEnabled public Decimal duration;
        @AuraEnabled public Decimal hourlyRate;
        @AuraEnabled public String rateLabel;

        @AuraEnabled public Boolean isHoliday;
        @AuraEnabled public String holidayName;

        /* ===== Broken Shift Additions ===== */
        @AuraEnabled public Decimal unpaidBreakHours = 0;
        @AuraEnabled public Decimal breakOne = 0;
        @AuraEnabled public Decimal breakTwo = 0;

        @AuraEnabled public Decimal extraHours = 0;
        @AuraEnabled public Decimal doubleRate = 0;
            // ✅ NEW — Break 1 timestamps
        @AuraEnabled public String breakOneStartTime;
        @AuraEnabled public String breakOneEndTime;
        @AuraEnabled public String breakTwoStartTime;
        @AuraEnabled public String breakTwoEndTime;
        @AuraEnabled public decimal brokenShiftAllowance=0;
        @AuraEnabled public boolean isMinimumEngagementApplied;
     }


    /* ============================
       MAIN ENTRY
       ============================ */
        @AuraEnabled
        public static ValidationResult validateBrokenShiftSegments(
            Date shiftStartDate,
            String shiftStartTime,
            Date shiftEndDate,
            String shiftEndTime,
            String segmentsJson,
            String employmentType , String staffId,string role
        ) {

            ValidationResult result = new ValidationResult();
            result.enrichedSegments = new List<EnrichedSegment>();

            try {

                List<ShiftSegment> segments =
                    (List<ShiftSegment>) JSON.deserialize(
                        segmentsJson,
                        List<ShiftSegment>.class
                    );

                if (segments == null || segments.isEmpty()) {
                    return fail(result, 'No shift segments provided.');
                }
                System.debug('Getting staff rates for: ' + staffId);
                Staff__c staff = SplitShiftValidations.getStaffRates(staffId, role);

                StaffRole__c roleRec =
                    (staff.StaffRoles__r != null && !staff.StaffRoles__r.isEmpty())
                    ? staff.StaffRoles__r[0]
                    : null;

                System.debug('Staff record: ' + staff);

        // Get holiday information (reuse existing method)
        System.debug('Getting holidays for date range...');
        Map<Date, Public_Holiday__c> holidaysByDate = SplitShiftValidations.getHolidaysByDate(shiftStartDate, shiftEndDate);


                DateTime shiftStartUTC = toUTC(shiftStartDate, shiftStartTime);
                DateTime shiftEndUTC   = toUTC(shiftEndDate, shiftEndTime);

                DateTime lastEndUTC;

                /* ============================
                CORE VALIDATIONS (UNCHANGED)
                ============================ */
                for (Integer i = 0; i < segments.size(); i++) {

                    ShiftSegment seg = segments[i];

                    if (String.isBlank(seg.starttime) || String.isBlank(seg.endtime)) {
                        return fail(result, 'Row ' + (i + 1) + ' must have start and end times.');
                    }

                    EnrichedSegment e = new EnrichedSegment();

                    /* ===== BASIC FIELD MAPPING (NEW) ===== */
                    e.id = seg.id;
                    e.shifttype = seg.shifttype;
                    e.rowShiftType = seg.shifttype;

                    e.startTime = seg.starttime;
                    e.endTime = seg.endtime;

                    e.rateLabel = seg.rateLabel;
                

                    DateTime rowStart;
                    DateTime rowEnd;

                    if (i == 0) {
                        rowStart = shiftStartUTC;
                        DateTime declaredStart = toUTC(shiftStartDate, seg.starttime);
                        if (rowStart.getTime() != declaredStart.getTime()) {
                            return fail(result, 'First row must start at shift start time.');
                        }
                    } else {
                        rowStart = lastEndUTC;
                        DateTime declaredStart = toUTC(rowStart.date(), seg.starttime);

                        if (declaredStart < rowStart) {
                            return fail(result, 'Row ' + (i + 1) + ' overlaps previous row.');
                        }
                        if (declaredStart > rowStart) {
                            rowStart = declaredStart; // gap allowed
                        }
                    }

                    rowEnd = calculateEnd(rowStart, seg.endtime);

                    if (rowEnd <= rowStart) {
                        return fail(result, 'Row ' + (i + 1) + ' has invalid end time.');
                    }

                    /* ===== DATE / TIME ENRICHMENT (NEW) ===== */
                    e.startDateTime = rowStart;
                    e.endDateTime = rowEnd;

                    e.startDate = rowStart.date();
                    e.endDate   = rowEnd.date();
                    e.isNextDay = e.startDate != e.endDate;

                    e.startDay = DateTime.newInstance(
                                e.startDate,
                                Time.newInstance(0, 0, 0, 0)
                            ).format('EEEE');

                     e.endDay = DateTime.newInstance(
                                e.endDate,
                                Time.newInstance(0, 0, 0, 0)
                            ).format('EEEE');


                    /* ===== DURATION (UNCHANGED LOGIC) ===== */
                    Decimal calculatedDuration = Decimal.valueOf(e.endDateTime.getTime() - e.startDateTime.getTime()) / (1000 * 60 * 60);

                    e.duration =seg.rowBillableHoursChanged == true? seg.billablehours : calculatedDuration;

                    System.debug('duration: ' + e.duration + ' hours');


                    /* ===== HOLIDAY PLACEHOLDERS (NEW) ===== */
                    e.isHoliday = holidaysByDate.containsKey(e.startDate);
                    e.holidayName = e.isHoliday? holidaysByDate.get(e.startDate).Holiday_Name__c : null;
                    Boolean hasCustomRate =(seg.rowOnchangeOccured != null && seg.rowOnchangeOccured == true) && seg.hourlyRate != null;

                    System.debug('hasCustomRate: ' + hasCustomRate);

                    // Always use existing rate calculator (same as split shift)
                    System.debug('Calculating rate using CustomShiftsValidations...');
                    e.hourlyRate = CustomShiftsValidations.calculateHourlyRate(staff,roleRec, seg.shifttype, e.startDay, e.isHoliday);



                    result.enrichedSegments.add(e);
                    lastEndUTC = rowEnd;
                }

                if (Math.abs(lastEndUTC.getTime() - shiftEndUTC.getTime()) > 1000) {
                    return fail(result, 'Last row must end at shift end time.');
                }

                /* ============================
                BROKEN SHIFT RULES (EXISTING)
                ============================ */
                applyBrokenShiftRules(result, employmentType, staff);

            } catch (Exception ex) {
                return fail(result, ex.getMessage());
            }

            return result;
        }



    /* ============================
       BROKEN SHIFT LOGIC
       ============================ */
       private static void applyBrokenShiftRules(
        ValidationResult result,
        String employmentType, // FULL_TIME / PART_TIME / CASUAL
        Staff__c staff
    ) {

        List<EnrichedSegment> rows = result.enrichedSegments;
       Integer actualBreaks = 0;
        /* ============================
        1. MAX WORK PERIODS
        ============================ */
        for (Integer i = 1; i < rows.size(); i++) {
          if (rows[i].startDateTime > rows[i - 1].endDateTime) {
            actualBreaks++;
          }
       }

            // ❌ No break at all
            if (actualBreaks == 0) {
                result.isValid = false;
                result.errorMessage =
                    'At least one break must be present between work segments for a broken shift.';
                return;
            }

            // ❌ More than 2 breaks
            if (actualBreaks > 2) {
                result.isValid = false;
                result.errorMessage =
                    'Broken shift cannot contain more than 2 breaks.';
                return;
            }


        EnrichedSegment last = rows[rows.size() - 1];

        /* ============================
        2. CAPTURE INDIVIDUAL BREAKS
        ============================ */
        Decimal totalBreakHours = 0;
        Integer breakIndex = 1;

        for (Integer i = 1; i < rows.size(); i++) {

            DateTime prevEnd   = rows[i - 1].endDateTime;
            DateTime currStart = rows[i].startDateTime;

            // Gap = break
            if (currStart > prevEnd) {

                Decimal breakHours =
                    Decimal.valueOf(currStart.getTime() - prevEnd.getTime())
                    / (1000 * 60 * 60);

                totalBreakHours += breakHours;

                // ===== BREAK 1 =====
                if (breakIndex == 1) {

                    last.breakOne = breakHours;
                    last.breakOneStartTime = formatTimeLocal(prevEnd);
                    last.breakOneEndTime   = formatTimeLocal(currStart);

                }
                // ===== BREAK 2 =====
                else if (breakIndex == 2) {

                    last.breakTwo = breakHours;
                    last.breakTwoStartTime = formatTimeLocal(prevEnd);
                    last.breakTwoEndTime   = formatTimeLocal(currStart);
                }

                breakIndex++;
            }
        }

        // Total unpaid break hours (sum of all gaps)
        last.unpaidBreakHours = totalBreakHours;
         /* ============================
            2A. BROKEN SHIFT ALLOWANCE
            ============================ */

           last.unpaidBreakHours = totalBreakHours;
                System.debug('unpaidBreakHours => ' + last.unpaidBreakHours);

                /* ============================
                2A. BROKEN SHIFT ALLOWANCE
                ============================ */

                Integer unpaidBreakCount = 0;
                StaffRole__c activeRole =
                    (staff.StaffRoles__r != null && !staff.StaffRoles__r.isEmpty())
                    ? staff.StaffRoles__r[0]
                    : null;

                System.debug('activeRole => ' + activeRole);

                if (last.breakOne != null && last.breakOne > 0) {
                    unpaidBreakCount++;
                }
                System.debug('after breakOne check, unpaidBreakCount => ' + unpaidBreakCount);

                if (last.breakTwo != null && last.breakTwo > 0) {
                    unpaidBreakCount++;
                }
                System.debug('after breakTwo check, unpaidBreakCount => ' + unpaidBreakCount);

                Decimal allowance = 0;
                System.debug('initial allowance => ' + allowance);

                if (unpaidBreakCount > 0 && staff != null) {

                    if (unpaidBreakCount == 1) {
                        allowance = activeRole.Allowance_one_unpaid_Break__c;
                    }
                    else if (unpaidBreakCount == 2) {
                        allowance = activeRole.Allowance_two_unpaid_Breaks__c;
                    }
                }

                System.debug('final allowance => ' + allowance);

               last.brokenShiftAllowance = allowance != null ? allowance : 0;
                System.debug('brokenShiftAllowance set on last segment => ' + last.brokenShiftAllowance);



        /* ============================
        3. MINIMUM ENGAGEMENT
        (LAST SEGMENT ONLY)
        ============================ */
        if (employmentType == 'Part-time' || employmentType == 'Casual') {

            Decimal totalWorkedHours = 0;

            for (EnrichedSegment row : rows) {
                totalWorkedHours += row.duration;
            }

            if (totalWorkedHours < 2) {

                Decimal uplift = 2 - totalWorkedHours;

                // Attach uplift to LAST segment only (payroll anchor)
                last.duration += uplift;
               // last.isMinimumEngagementApplied=true;
                for (EnrichedSegment row : rows) {
                    row.isMinimumEngagementApplied = true;
                }
            }
        }

        /* ============================
        4. 12-HOUR SPAN – DOUBLE TIME
        ============================ */
        DateTime shiftStart = rows[0].startDateTime;
        DateTime shiftEnd   = last.endDateTime;

        Decimal totalSpan =
            Decimal.valueOf(shiftEnd.getTime() - shiftStart.getTime())
            / (1000 * 60 * 60);

        /* ===== NEW LOGIC ADDED (NO REMOVALS) ===== */
        String shiftDay = rows[0].startDay;     // Monday, Tuesday, ...
        Boolean isHoliday = rows[0].isHoliday;

        Boolean isWeekday =
            shiftDay == 'Monday' ||
            shiftDay == 'Tuesday' ||
            shiftDay == 'Wednesday' ||
            shiftDay == 'Thursday' ||
            shiftDay == 'Friday';

        Boolean isSaturday = (shiftDay == 'Saturday');

        if ((isWeekday || isSaturday) && !isHoliday) {
        /* ===== END NEW LOGIC ===== */

            if (totalSpan > 12) {
                Decimal excessHours = totalSpan - 12;
                last.extraHours = excessHours;
                last.doubleRate = last.hourlyRate * 2;
            }
        }
    }



    /* ============================
       HELPERS
       ============================ */
    private static ValidationResult fail(ValidationResult r, String msg) {
        r.isValid = false;
        r.errorMessage = msg;
        return r;
    }

    private static DateTime toUTC(Date d, String t) {
        List<String> p = t.replace('Z','').split(':');
        DateTime dt = DateTime.newInstance(
            d,
            Time.newInstance(
                Integer.valueOf(p[0]),
                p.size() > 1 ? Integer.valueOf(p[1]) : 0,
                0,
                0
            )
        );
        return DateTime.newInstance(dt.getTime());
    }

   private static DateTime calculateEnd(DateTime start, String t) {
    List<String> p = t.replace('Z','').split(':');

    Time tm = Time.newInstance(
        Integer.valueOf(p[0]),
        p.size() > 1 ? Integer.valueOf(p[1]) : 0,
        0,
        0
    );

    DateTime endDT = DateTime.newInstance(start.date(), tm);

    if (endDT <= start) {
        endDT = endDT.addDays(1);
    }

    return DateTime.newInstance(endDT.getTime());
 }
 private static String formatTimeLocal(DateTime dt) {
    if (dt == null) return null;
    return dt.format('HH:mm:ss') + 'Z';
}
@AuraEnabled
public static  List<ShiftwithStaff__c>  getBrokenShiftsData(string AddshiftId){
    List<ShiftwithStaff__c> brokenShiftsData=[select Id,Start_time_Formula__c,End_time_formula__c,Index__c,Shift_Calculated_Duration__c from ShiftwithStaff__c where Add_Shift__C =:AddshiftId ];
    return brokenShiftsData;

}






}