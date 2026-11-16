@IsTest
private class IncidentNDISOverdueReminderSchedulerTest {

    @IsTest
    static void testSchedulerExecute() {
        Test.startTest();

        // Schedule the scheduler so Salesforce invokes execute()
        String jobId = System.schedule(
            'NDIS Overdue Reminder Scheduler Test',
            '0 0 1 * * ?',
            new IncidentNDISOverdueReminderScheduler()
        );

        Test.stopTest();

 
    }
}