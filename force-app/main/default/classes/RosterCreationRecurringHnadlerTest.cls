@isTest
public class RosterCreationRecurringHnadlerTest {
    
    @isTest
    static void testDailyRecurrence() {
        Test.startTest();
        String typeOfRecur = 'Daily';
        Integer recurEvery = 2;
        String shiftDate = '2024-02-01';
        String endDate = '2024-02-10';
        
        Map<String, Object> result = RosterCreationRecurringHnadler.getNumberOfRecurrences(typeOfRecur, recurEvery, endDate, shiftDate, null, null);
        Test.stopTest();

        // Assert success and the correct number of occurrences
        System.assertEquals(true, result.get('isSuccess'), 'Expected success');
        System.assertEquals(5, result.get('NumberOfOccurrences'), 'Expected 5 daily occurrences');
    }

    @isTest
    static void testWeeklyRecurrence() {
        Test.startTest();
        String typeOfRecur = 'Weekly';
        Integer recurEvery = 1;
        String shiftDate = '2024-02-01';
        String endDate = '2024-02-28';
        List<String> weeklyDays = new List<String>{'Monday', 'Friday'};
        
        Map<String, Object> result = RosterCreationRecurringHnadler.getNumberOfRecurrences(typeOfRecur, recurEvery, endDate, shiftDate, weeklyDays, null);
        Test.stopTest();

        // Assert success and validate occurrences
        System.assertEquals(true, result.get('isSuccess'), 'Expected success');
        List<Date> recurrenceDates = (List<Date>) result.get('RecurrenceDates');
        System.assertNotEquals(0, recurrenceDates.size(), 'Expected at least one weekly recurrence');
    }

    @isTest
    static void testMonthlyRecurrence() {
        Test.startTest();
        String typeOfRecur = 'Monthly';
        Integer recurEvery = 1;
        String shiftDate = '2024-01-01';
        String endDate = '2024-05-01';
        Integer monthlyDay = 15;

        Map<String, Object> result = RosterCreationRecurringHnadler.getNumberOfRecurrences(typeOfRecur, recurEvery, endDate, shiftDate, null, monthlyDay);
        Test.stopTest();

        // Assert success and correct occurrences
        System.assertEquals(true, result.get('isSuccess'), 'Expected success');
        List<Date> recurrenceDates = (List<Date>) result.get('RecurrenceDates');
        System.assertEquals(4, recurrenceDates.size(), 'Expected 4 monthly occurrences');
    }

    @isTest
    static void testInvalidParameters() {
        Test.startTest();

        // Test with missing type of recurrence
        Map<String, Object> result1 = RosterCreationRecurringHnadler.getNumberOfRecurrences('', 1, '2024-02-28', '2024-02-01', null, null);
        System.assertEquals(false, result1.get('isSuccess'), 'Expected failure due to empty typeOfRecur');
        System.assert(result1.get('failureMessage') != null, 'Expected a failure message');

        // Test with start date after end date
        Map<String, Object> result2 = RosterCreationRecurringHnadler.getNumberOfRecurrences('Daily', 1, '2024-01-01', '2024-02-01', null, null);
        System.assertEquals(false, result2.get('isSuccess'), 'Expected failure due to invalid date range');
        System.assert(result2.get('failureMessage') != null, 'Expected a failure message');

        // Test with null recurrence period
        Map<String, Object> result3 = RosterCreationRecurringHnadler.getNumberOfRecurrences('Daily', null, '2024-02-28', '2024-02-01', null, null);
        System.assertEquals(false, result3.get('isSuccess'), 'Expected failure due to null recurEvery');
        System.assert(result3.get('failureMessage') != null, 'Expected a failure message');

        Test.stopTest();
    }

    @isTest
    static void testEdgeCasesForMonthlyRecurrence() {
        Test.startTest();

        // Test when monthly day exceeds the number of days in the month
        Map<String, Object> result = RosterCreationRecurringHnadler.getNumberOfRecurrences('Monthly', 1, '2024-05-01', '2024-01-01', null, 31);
        List<Date> recurrenceDates = (List<Date>) result.get('RecurrenceDates');

        // Ensure the last day of each month is selected where necessary
        System.assertEquals(4, recurrenceDates.size(), 'Expected 4 monthly occurrences');
        System.assertEquals(Date.newInstance(2024, 2, 29), recurrenceDates[1], 'Expected February 29 for leap year');

        Test.stopTest();
    }
}