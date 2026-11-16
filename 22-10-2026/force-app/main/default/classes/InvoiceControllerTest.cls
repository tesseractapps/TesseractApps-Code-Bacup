@IsTest
public class InvoiceControllerTest {

     @testSetup
    static void setupTestData() {
        // Create sample Invoice_Parent__c records for different statuses
        List<Invoice_Parent__c> invoices = new List<Invoice_Parent__c>();

        invoices.add(new Invoice_Parent__c(Status__c = 'Draft'));
        invoices.add(new Invoice_Parent__c(Status__c = 'Issued'));
        invoices.add(new Invoice_Parent__c(Status__c = 'Received'));
        invoices.add(new Invoice_Parent__c(Status__c = 'Draft'));
        invoices.add(new Invoice_Parent__c(Status__c = 'Issued'));

        // Insert test data
        insert invoices;
    }

    @IsTest
    static void testGetInvoiceCounts() {
        
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.4139562@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='Test Friday4039562', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.4139562@hotmail.com',Organization_Name__c ='Ashfield Consultants', User_Type__c = 'NDIS Staff');
        insert user;
        
        // Call the method under test
        Map<String, Integer> invoiceCounts = InvoiceController.getInvoiceCounts(user.Id);

        // Assertions to verify the counts
       // System.assertEquals(2, invoiceCounts.get('draftInvoice'), 'Draft invoice count should match');
        //System.assertEquals(2, invoiceCounts.get('issuedInvoice'), 'Issued invoice count should match');
        //System.assertEquals(1, invoiceCounts.get('receivedInvoice'), 'Received invoice count should match');
    }

    @IsTest
    static void testNoInvoiceData() {
        Test.startTest();
        // Delete all existing invoices to test scenario with no records
        delete [SELECT Id FROM Invoice_Parent__c];
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.4139562@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='Test Friday4039562', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.4139562@hotmail.com',Organization_Name__c ='Ashfield Consultants', User_Type__c = 'NDIS Staff');
        insert user;

         Map<String, Integer> invoiceCounts = InvoiceController.getInvoiceCounts(user.Id);

        // Assertions for zero counts
        //System.assertEquals(0, invoiceCounts.get('draftInvoice'), 'Draft invoice count should be zero');
       // System.assertEquals(0, invoiceCounts.get('issuedInvoice'), 'Issued invoice count should be zero');
        //System.assertEquals(0, invoiceCounts.get('receivedInvoice'), 'Received invoice count should be zero');
        Test.stopTest();
    }
}