@IsTest
public class LeaveAccrualSchedulerTest {

    @IsTest
    static void testSchedulerExecution() {

        Test.startTest();

        // Cron expression: run once in the future
        String cronExp = '0 0 0 1 1 ? 2099';

        System.schedule(
            'Leave Accrual Scheduler Test',
            cronExp,
            new LeaveAccrualScheduler()
        );

        Test.stopTest();

        // Verify the job was scheduled
        List<CronTrigger> jobs = [
            SELECT Id, CronExpression, TimesTriggered, State
            FROM CronTrigger
            WHERE CronJobDetail.Name = 'Leave Accrual Scheduler Test'
        ];

   }
}