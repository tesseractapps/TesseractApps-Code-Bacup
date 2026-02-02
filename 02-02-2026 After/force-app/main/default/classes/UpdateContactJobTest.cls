@isTest
private class UpdateContactJobTest {
    
    @testSetup
    static void setupTestData() {
        // Create test account
        Account testAccount = new Account(Name = 'Test Account');
        insert testAccount;

        // Create test contacts
        List<Contact> contacts = new List<Contact>{
            new Contact(FirstName = 'John', LastName = 'Doe', Email = 'john.doe@example.com', Portal_User_Created__c = true, AccountId = testAccount.Id),
            new Contact(FirstName = 'Jane', LastName = 'Doe', Email = 'jane.doe@example.com', Portal_User_Created__c = true, AccountId = testAccount.Id)
        };
        insert contacts;
    }

    @isTest
    static void testQueueableJob() {
        // Query test contacts
        List<Contact> testContacts = [SELECT Id, Portal_User_Created__c FROM Contact WHERE Portal_User_Created__c = true];
        System.assertEquals(2, testContacts.size(), 'Expected 2 contacts with Portal_User_Created__c = true');

        // Execute the queueable job
        Test.startTest();
        System.enqueueJob(new UpdateContactJob(new List<Id>{testContacts[0].Id, testContacts[1].Id}));
        Test.stopTest();

        // Verify the contacts have been updated
        List<Contact> updatedContacts = [SELECT Id, Portal_User_Created__c FROM Contact WHERE Id IN :testContacts];
        for (Contact c : updatedContacts) {
            System.assertEquals(false, c.Portal_User_Created__c, 'Portal_User_Created__c should be set to false');
        }
    }
}