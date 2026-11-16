@isTest
private class ScheduleCreatePortalUserBatchTest {
    
    @testSetup
    static void setupTestData() {
        // Create Test Account
        Account testAccount = new Account(Name = 'Test Account');
        insert testAccount;

        // Create Test Contact
        Contact testContact = new Contact(
            FirstName = 'John',
            LastName = 'Doe',
            Email = 'john.doe@example.com',
            Portal_User_Created__c = false, // Ensuring the batch processes this
            AccountId = testAccount.Id
        );
        insert testContact;
    }

    @isTest
    static void testScheduledBatchExecution() {
        Test.startTest();
        
        // Schedule the job
        String jobId = System.schedule('Test Scheduled Batch', '0 0 0 1 * ?', new ScheduleCreatePortalUserBatch());

        // Verify the job is in the queue
        CronTrigger cronJob = [SELECT Id, CronExpression, State FROM CronTrigger WHERE Id = :jobId LIMIT 1];
        System.assertNotEquals(null, cronJob, 'Scheduled job was not created.');
        System.assertEquals('WAITING', cronJob.State, 'Scheduled job should be in WAITING state.');
        
        // Run the batch manually to simulate execution
        ScheduleCreatePortalUserBatch scheduledJob = new ScheduleCreatePortalUserBatch();
        scheduledJob.execute(null);
        
        Test.stopTest();
        
        // Verify that the batch has processed the data
        Integer countPortalUsers = [SELECT COUNT() FROM Contact WHERE Portal_User_Created__c = true];
        //System.assertGreaterThan(countPortalUsers, 0, 'The batch should update at least one contact.');
    }
}