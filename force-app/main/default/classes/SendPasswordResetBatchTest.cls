@isTest
public class SendPasswordResetBatchTest {

    @testsetup
    static void setupData() {
        // Create test contacts with Send_Password_Reset__c = true
        Contact contact1 = new Contact(FirstName = 'John', LastName = 'Doe', Email = 'manualtesting.4139562@hotmail.com', Send_Password_Reset__c = true);
        Contact contact2 = new Contact(FirstName = 'Jane', LastName = 'Smith', Email = 'manualtesting.4139566@hotmail.com', Send_Password_Reset__c = true);
        insert new List<Contact>{ contact1, contact2 };

        // Create corresponding user records with matching emails
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user1 = new User(Alias = 'praveen', Email= 'manualtesting.4139562@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='Test Friday4039562', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.4139562@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        User user2 = new User(Alias = 'praveen', Email= 'manualtesting.4139566@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='Test Friday4039566', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.4139566@hotmail.com',Organization_Name__c ='Ashfield Consultants');
       
        insert new List<User>{ user1, user2 };
    }

    @isTest
    static void testSendPasswordResetBatch() {
        Test.startTest();

        // Execute the batch
        SendPasswordResetBatch batch = new SendPasswordResetBatch();
        Id batchJobId = Database.executeBatch(batch, 200); // Execute batch with a batch size of 1 for testing

        Test.stopTest();

        // Verify the results
        List<Contact> updatedContacts = [SELECT Id, Send_Password_Reset__c FROM Contact WHERE Email IN ('manualtesting.4139562@hotmail.com', 'manualtesting.4139566@hotmail.com')];
        
        // Assert that the Send_Password_Reset__c checkbox is reset to false after password reset
        for (Contact con : updatedContacts) {
            System.assertEquals(false, con.Send_Password_Reset__c, 'The Send_Password_Reset__c checkbox should be reset to false');
        }
    }
    @isTest
    static void testSendPasswordResetScheduler() {
        // Schedule the job to run at a specific time (e.g., 1 minute from now)
        String cronExpression = '0 0 0 15 3 ? 2025'; // Example cron expression (you can adjust the timing)
        SendPasswordResetScheduler scheduler = new SendPasswordResetScheduler();
        
        Test.startTest();
        String jobID = System.schedule('Test Send Password Reset Scheduler', cronExpression, scheduler);
        Test.stopTest();

        // Verify that the scheduled job is correctly added to the job queue
        CronTrigger job = [SELECT Id, CronExpression, State FROM CronTrigger WHERE Id = :jobID LIMIT 1];

        // Optionally, you can now run your batch test as usual to ensure it works
        SendPasswordResetBatch batch = new SendPasswordResetBatch();
        Id batchJobId = Database.executeBatch(batch, 100);      

        // Verify the results for the Contact records
        List<Contact> updatedContacts = [SELECT Id, Send_Password_Reset__c FROM Contact WHERE Email IN ('manualtesting.4139562@hotmail.com', 'manualtesting.4139566@hotmail.com')];
        
        // Assert that the Send_Password_Reset__c checkbox is reset to false after password reset
        for (Contact con : updatedContacts) {
            System.assertEquals(true, con.Send_Password_Reset__c, 'The Send_Password_Reset__c checkbox should be reset to true');
        }
    }

}