@IsTest
public class SILInvoiceBatchTest {
    
    @TestSetup
    static void setupTestData() {
        TestDataFactory.createBaseData();
        
        List<Client__c> clients = [SELECT Id FROM Client__c LIMIT 1];
        List<Facility__c> facilities = [SELECT Id, Organisation__c FROM Facility__c LIMIT 1];
        
        if (!clients.isEmpty() && !facilities.isEmpty()) {
            
            // Create Company
            Company__c company = new Company__c(
                Facility__c = facilities[0].Id
            );
            insert company;
            
            // Create Entity Profile
            Entity_Profile__c entityProfile = new Entity_Profile__c(
                Name = 'Test Entity',
                Company__c = company.Id  
               // Accounting_Ledger_Items__c = 'Test Ledger'
            );
            insert entityProfile;
            
            // Create SIL
            SIL__c sil = new SIL__c(
                SIL_To_Participant__c = clients[0].Id,
                ServiceType__c = 'NDIS Support',
                Plan_Type__c = 'Plan Managed',
                Amount__c = 5000,
                InvoiceAmount__c = 1000,
                Remaining_Amount__c = 5000,
                Spent_Amount__c = 0,
                StartDate__c = Date.today().addDays(-10),
                EndDate__c = Date.today().addDays(10),
                Frequency__c = 'Monthly',
                Last_Invoice_Date__c = Date.today().addMonths(-2),
                Status__c = 'Active',
                Entity_Name__c = entityProfile.Id
            );
            insert sil;
            
            // Create SIL Item
            SIL_Items__c item = new SIL_Items__c(
                SILItems_To_SIL__c = sil.Id,
                SupportItem_Name__c = 'Test Item',
                SupportItem_Number__c = 'ITEM001',
                Status__c = true
            );
            insert item;
        }
    }
    
    @IsTest
    static void testBatchExecution() {
        
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator());
        
        Client__c client = [SELECT Id, Facility__c, Status__c FROM Client__c LIMIT 1];
        Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
        
        // 🔥 Ensure proper linking
        client.Facility__c = facility.Id;
        client.Status__c = true;
        update client;
        
        // 🔥 Ensure Participant_Facility exists
        List<Participant_Facility__c> pf = [
            SELECT Id FROM Participant_Facility__c 
            WHERE Participant__c = :client.Id 
            AND Facility__c = :facility.Id
        ];
        
        if (pf.isEmpty()) {
            insert new Participant_Facility__c(
                Participant__c = client.Id,
                Facility__c = facility.Id,
                Active__c = true
            );
        }
        
        // 🔥 Ensure SIL conditions pass
        List<SIL__c> sils = [
            SELECT Id, Remaining_Amount__c, InvoiceAmount__c, StartDate__c, EndDate__c, Last_Invoice_Date__c 
            FROM SIL__c
        ];
        
        for (SIL__c sil : sils) {
            sil.Remaining_Amount__c = 5000;
            sil.InvoiceAmount__c = 1000;
            sil.StartDate__c = Date.today().addDays(-10);
            sil.EndDate__c = Date.today().addDays(10);
            sil.Last_Invoice_Date__c = Date.today().addMonths(-2);
        }
        update sils;
        
        Test.startTest();
        Database.executeBatch(new SILInvoiceBatch(), 1);
        Test.stopTest();
        
        // Verify execution
        List<Accounting_Invoices_Expenses__c> invoices = [
            SELECT Id FROM Accounting_Invoices_Expenses__c
        ];
        
        System.debug('Invoices created: ' + invoices.size());
    }
    
    @IsTest
    static void testEmptyScope() {
        
        List<Facility__c> facilities = [SELECT Id FROM Facility__c];
        
        for (Facility__c f : facilities) {
            f.Name = 'NoMatch'; // dummy update
        }
        update facilities;
        
        Test.startTest();
        Database.executeBatch(new SILInvoiceBatch(), 1);
        Test.stopTest();
    }
    
    // MOCK CALLOUT
    private class MockHttpResponseGenerator implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            
            String body = '{"results":[{"facilities":[{"participants":[{"services":[{"serviceId":"'
                + Id.valueOf([SELECT Id FROM SIL__c LIMIT 1].Id)
                + '","invoiceNumber":"INV-001","pdf_url":"https://test.com/file.pdf"}]}]}]}]}';
            
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            res.setBody(body);
            res.setStatusCode(200);
            return res;
        }
    }
}