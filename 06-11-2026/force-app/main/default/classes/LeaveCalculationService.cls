public with sharing class LeaveCalculationService {

    public static final Decimal NES_HOURS_PER_DAY = 7.6;

    public class Result {
        public Decimal duration;
        public Decimal paid;
        public Decimal unpaid;
        public Decimal balance;
        public Boolean saveButtonDisable;
        public String errorMessage;
    }

    public static Result calculate(
        Date fromDate,
        Date toDate,
        String state,
        String leaveType,
        String durationType,
        String startTime,
        String endTime,
        Decimal annualRemaining,
        Decimal personalRemaining,
        Boolean negativeBalanceAllowed
    ) {
        Result r = new Result();

        System.debug('--- LeaveCalculationService.calculate START ---');
        System.debug('FromDate=' + fromDate + ', ToDate=' + toDate);
        System.debug('State=' + state + ', LeaveType=' + leaveType);
        System.debug('DurationType=' + durationType);
        System.debug('StartTime=' + startTime + ', EndTime=' + endTime);
        System.debug('AnnualRemaining=' + annualRemaining +
                     ', PersonalRemaining=' + personalRemaining);
        System.debug('NegativeBalanceAllowed=' + negativeBalanceAllowed);

        if (fromDate == null || toDate == null ||
            String.isBlank(state) ||
            String.isBlank(leaveType) ||
            String.isBlank(durationType)) {
            System.debug('Missing mandatory inputs – exiting');
            return r;
        }

        /* 1. Business days */
        Integer businessDays = calculateBusinessDays(fromDate, toDate);
        System.debug('BusinessDays=' + businessDays);

        /* 2. Weekday public holidays */
        Integer holidayCount =
            calculateWeekdayHolidayCount(fromDate, toDate, state);
        System.debug('WeekdayHolidayCount=' + holidayCount);

        Decimal payableDays = businessDays - holidayCount;
        if (payableDays < 0) payableDays = 0;
        System.debug('PayableDays(after holidays)=' + payableDays);

        /* 3. Duration type */
        if (durationType == 'Half day') {
            payableDays = payableDays / 2;
            System.debug('Half Day selected. PayableDays=' + payableDays);
        }

        if (durationType == 'Custom Hours') {

            System.debug('Custom Hours selected');

            if (String.isBlank(startTime) || String.isBlank(endTime)) {
                r.errorMessage = 'Start and end time required for custom hours';
                System.debug('ERROR: Missing start or end time');
                return r;
            }

            Time startT = AddShiftHandler.getTimeIn24HrFormat(startTime);
            Time endT   = AddShiftHandler.getTimeIn24HrFormat(endTime);

            Integer startMin = timeToMinutes(startT);
            Integer endMin   = timeToMinutes(endT);

            System.debug('StartMinutes=' + startMin +
                         ', EndMinutes=' + endMin);

            if (endMin <= startMin) {
                r.errorMessage = 'End time must be greater than start time';
                System.debug('ERROR: End time <= Start time');
                return r;
            }

            Decimal requestedHoursPerDay =
                (endMin - startMin) / 60.0;

            Decimal totalCustomHours =
                requestedHoursPerDay * payableDays;

            payableDays =
                totalCustomHours / NES_HOURS_PER_DAY;

            System.debug('RequestedHoursPerDay=' + requestedHoursPerDay);
            System.debug('TotalCustomHours=' + totalCustomHours);
            System.debug('PayableDays(after custom)=' + payableDays);
        }

        /* 4. Final hours */
        Decimal leaveHours =
            (payableDays * NES_HOURS_PER_DAY).setScale(2);

        r.duration = leaveHours;
        System.debug('Final Leave Hours=' + leaveHours);

        /* 5. Accrued vs Non-accrued */
        Decimal balanceHours = 0;

        if (leaveType == 'Annual Leave') {
            balanceHours = annualRemaining;
            System.debug('Using Annual Leave balance=' + balanceHours);
        } else if (leaveType == 'Personal Leave') {
            balanceHours = personalRemaining;
            System.debug('Using Personal Leave balance=' + balanceHours);
        } else {
            System.debug('Non-accrued leave type – skipping balance logic');
            r.paid = 0;
            r.unpaid = 0;
            r.balance = 0;
            return r;
        }

        Decimal remaining = balanceHours - leaveHours;
        System.debug('RemainingBalance=' + remaining);

        if (remaining < 0 && !negativeBalanceAllowed) {
            r.errorMessage =
                'You cannot request more leave than you have accrued.';
            System.debug('ERROR: Negative balance not allowed');
            return r;
        }

        if (remaining >= 0) {
            r.paid = leaveHours;
            r.unpaid = 0;
            r.balance = remaining;
        } else {
            r.paid = balanceHours;
            r.unpaid = Math.abs(remaining);
            r.balance = 0;
        }

        System.debug('Paid=' + r.paid +
                     ', Unpaid=' + r.unpaid +
                     ', Balance=' + r.balance);

        System.debug('--- LeaveCalculationService.calculate END ---');
        return r;
    }

    /* Business days */
    public static Integer calculateBusinessDays(Date startDate, Date endDate) {
        Integer count = 0;
        Date d = startDate;

        while (d <= endDate) {
            Integer dow = d.toStartOfWeek().daysBetween(d);
            if (dow != 0 && dow != 6) count++;
            d = d.addDays(1);
        }
        return count;
    }

    /* Weekday holidays */
    public static Integer calculateWeekdayHolidayCount(
        Date startDate,
        Date endDate,
        String state
    ) {
        List<Public_Holiday__c> holidays = [
            SELECT Date__c
            FROM Public_Holiday__c
            WHERE Date__c >= :startDate
              AND Date__c <= :endDate
              AND State__c INCLUDES (:state)
        ];

        Integer count = 0;
        for (Public_Holiday__c h : holidays) {
            Integer dow = h.Date__c.toStartOfWeek().daysBetween(h.Date__c);
            if (dow != 0 && dow != 6) count++;
        }

        System.debug('HolidayRecords=' + holidays.size() +
                     ', WeekdayHolidays=' + count);
        return count;
    }

    public static Integer timeToMinutes(Time t) {
        return (t.hour() * 60) + t.minute();
    }
}