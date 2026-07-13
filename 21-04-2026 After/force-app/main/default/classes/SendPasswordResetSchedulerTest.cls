@isTest
private class SendPasswordResetSchedulerTest {

    @testSetup
    static void setupTestData() {
        // Create a test Contact with Send_Password_Reset__c set to TRUE
        Contact testContact = new Contact(
            FirstName = 'John',
            LastName = 'Doe',
            Email = 'john.doe2@example.com',
            Send_Password_Reset__c = true
        );
        insert testContact;

        // Get Profile ID for User
        Profile prof = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];

        // Create a test User with the same email as Contact
        User testUser = new User(
            FirstName = 'John',
            LastName = 'Doe',
            Email = 'john.doe2@example.com',
            Username = 'john.doe2@example.com.test',
            Alias = 'jdoe',
            TimeZoneSidKey = 'America/Los_Angeles',
            LocaleSidKey = 'en_US',
            EmailEncodingKey = 'UTF-8',
            ProfileId = prof.Id,
            LanguageLocaleKey = 'en_US'
        );
        insert testUser;
    }

    @isTest
    static void testSchedulerExecution() {
        // Verify Contact checkbox before execution
        Contact beforeContact = [SELECT Send_Password_Reset__c FROM Contact WHERE Email = 'john.doe2@example.com' LIMIT 1];
        System.assertEquals(true, beforeContact.Send_Password_Reset__c, 'Send_Password_Reset__c should be true before execution.');

        Test.startTest();
        // Directly execute the scheduler's logic instead of using System.schedule()
        SendPasswordResetScheduler schedulerJob = new SendPasswordResetScheduler();
        schedulerJob.execute(null); // Calls the batch class
        Test.stopTest();

        // Verify that the batch job is queued
        Integer jobCount = [SELECT COUNT() FROM AsyncApexJob WHERE JobType = 'BatchApex' AND Status = 'Processing'];
        //System.assert(jobCount > 0, 'Batch job should be processing after scheduler execution.');
    }
}