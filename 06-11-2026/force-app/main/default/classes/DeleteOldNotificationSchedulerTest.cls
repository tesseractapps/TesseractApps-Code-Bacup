@IsTest
public class DeleteOldNotificationSchedulerTest {

    @IsTest
    static void testDeleteOldNotificationScheduler() {

        Test.startTest();

        // Schedule the scheduler to run
        String jobId = System.schedule(
            'Delete Old Notification Test',
            '0 0 0 1 1 ? 2099',
            new DeleteOldNotificationScheduler()
        );

        Test.stopTest();

        // Verify that the scheduled job was created
        CronTrigger cronJob = [
            SELECT Id, CronExpression, TimesTriggered, State
            FROM CronTrigger
            WHERE Id = :jobId
            LIMIT 1
        ];

        System.assertNotEquals(
            null,
            cronJob,
            'The scheduled job should have been created.'
        );

        System.assertEquals(
            '0 0 0 1 1 ? 2099',
            cronJob.CronExpression,
            'The scheduled job should have the expected cron expression.'
        );
    }
}