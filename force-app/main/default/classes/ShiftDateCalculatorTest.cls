@isTest
public class ShiftDateCalculatorTest {

    @isTest
    static void testShiftEndsNextDay() {
        Date startDate = Date.today();
        Time startTime = Time.newInstance(22, 0, 0, 0); // 10:00 PM
        Time endTime = Time.newInstance(6, 0, 0, 0); // 6:00 AM next day
        String shiftType = 'Night';

        Date expectedDate = startDate.addDays(1);
        Date actualDate = ShiftDateCalculator.getAdjustedDate(startDate, shiftType, startTime, endTime);
        System.assertEquals(expectedDate, actualDate, 'Expected date to be incremented by 1 for overnight shift');
    }

    @isTest
    static void testShiftEndsSameDay() {
        Date startDate = Date.today();
        Time startTime = Time.newInstance(9, 0, 0, 0); // 9:00 AM
        Time endTime = Time.newInstance(17, 0, 0, 0); // 5:00 PM
        String shiftType = 'Morning';

        Date actualDate = ShiftDateCalculator.getAdjustedDate(startDate, shiftType, startTime, endTime);
        System.assertEquals(startDate, actualDate, 'Expected date to remain unchanged for same-day shift');
    }

    @isTest
    static void testNullTimes() {
        Date startDate = Date.today();
        String shiftType = 'Sleepover Shift';
        Date actualDate = ShiftDateCalculator.getAdjustedDate(startDate, shiftType, null, null);
        System.assertEquals(startDate, actualDate, 'Expected date to remain unchanged with null times');
    }

    @isTest
    static void testNonSpecialShiftType() {
        Date startDate = Date.today();
        Time startTime = Time.newInstance(9, 0, 0, 0); // 9:00 AM
        Time endTime = Time.newInstance(17, 0, 0, 0); // 5:00 PM
        String shiftType = 'Afternoon'; // not in special list

        Date actualDate = ShiftDateCalculator.getAdjustedDate(startDate, shiftType, startTime, endTime);
        System.assertEquals(startDate, actualDate, 'Expected date to remain unchanged for non-special shift type');
    }
}