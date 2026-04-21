@IsTest
public class LeaveCalculationServiceTest {

    @testSetup
    static void setupData() {
        insert new Public_Holiday__c(
           // Name = 'ACT Holiday',
            Date__c = Date.newInstance(2024, 3, 18),
            State__c = 'Australian Capital Territory'
        );
    }

    @IsTest
    static void testFullDayAnnualLeave() {
        LeaveCalculationService.calculate(
            Date.newInstance(2024, 3, 16),
            Date.newInstance(2024, 3, 18),
            'Australian Capital Territory',
            'Annual Leave',
            'Full day',
            null,
            null,
            76,
            0,
            false
        );
    }

    @IsTest
    static void testHalfDayLeave() {
        LeaveCalculationService.calculate(
            Date.newInstance(2024, 3, 18),
            Date.newInstance(2024, 3, 18),
            'Australian Capital Territory',
            'Annual Leave',
            'Half day',
            null,
            null,
            76,
            0,
            false
        );
    }

    @IsTest
    static void testCustomHoursLeave() {
        LeaveCalculationService.calculate(
            Date.newInstance(2024, 3, 18),
            Date.newInstance(2024, 3, 18),
            'Australian Capital Territory',
            'Annual Leave',
            'Custom Hours',
            '9:00 am',
            '1:00 pm',
            76,
            0,
            false
        );
    }

    @IsTest
    static void testNegativeBalanceNotAllowed() {
        LeaveCalculationService.calculate(
            Date.newInstance(2024, 3, 18),
            Date.newInstance(2024, 3, 30),
            'Australian Capital Territory',
            'Annual Leave',
            'Full day',
            null,
            null,
            5,
            0,
            false
        );
    }
}