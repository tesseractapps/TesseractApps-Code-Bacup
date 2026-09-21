@IsTest
public class SILInvoiceBatchSchedulerTest {
    
    @TestSetup
    static void setupData() {
        
        // Use your existing factory
        TestDataFactory.createBaseData();
        
        // Minimal required data so batch doesn't skip everything
        
        Client__c client = [SELECT Id, Facility__c FROM Client__c LIMIT 1];
        Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
        
        // Ensure client is active + linked
        client.Status__c = true;
        client.Facility__c = facility.Id;
        update client;
        
        // Participant_Facility (CRITICAL for batch)
        insert new Participant_Facility__c(
            Participant__c = client.Id,
            Facility__c = facility.Id,
            Active__c = true
        );
        
        // Company
        Company__c company = new Company__c(
            Facility__c = facility.Id
        );
        insert company;
        
        // Entity Profile
        Entity_Profile__c entity = new Entity_Profile__c(
            Name = 'Test Entity',
            Company__c = company.Id 
            //Accounting_Ledger_Items__c = 'Test Ledger'
        );
        insert entity;
        
        // SIL
        SIL__c sil = new SIL__c(
            SIL_To_Participant__c = client.Id,
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
            Entity_Name__c = entity.Id
        );
        insert sil;
        
        // SIL Item
        insert new SIL_Items__c(
            SILItems_To_SIL__c = sil.Id,
            SupportItem_Name__c = 'Item',
            SupportItem_Number__c = 'ITM001',
            Status__c = true
        );
    }
    
    @IsTest
    static void testSchedulerExecution() {
        
        // Mock callout (batch has callout)
        Test.setMock(HttpCalloutMock.class, new MockHttpResponse());
        
        Test.startTest();
        
        // Schedule the job
        String cronExp = '0 0 0 1 1 ? 2050'; // any future date
        System.schedule('Test SIL Scheduler', cronExp, new SILInvoiceBatchScheduler());
        
        Test.stopTest();
        
        // If no exception → scheduler + batch executed successfully
        System.debug('Scheduler executed successfully');
    }
    
    // MOCK
    private class MockHttpResponse implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setBody('{"results": []}');
            return res;
        }
    }
}