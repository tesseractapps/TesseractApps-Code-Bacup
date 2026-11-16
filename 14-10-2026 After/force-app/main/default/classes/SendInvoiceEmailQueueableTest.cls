@IsTest
public class SendInvoiceEmailQueueableTest {
    
    @TestSetup
    static void setupData() {
        
        // Use your factory
        TestDataFactory.createBaseData();
        
        // Get base data
        Client__c client = [SELECT Id, Facility__c FROM Client__c LIMIT 1];
        Facility__c facility = [SELECT Id, Organisation__c FROM Facility__c LIMIT 1];
        
        // Ensure client is valid
        client.Status__c = true;
        update client;
        
        // Ensure Company exists
        Company__c company = new Company__c(
            Facility__c = facility.Id
        );
        insert company;
        
        // Create Invoice (MAIN REQUIRED RECORD)
        Accounting_Invoices_Expenses__c inv = new Accounting_Invoices_Expenses__c(
            //Name = 'INV-TEST',
            Invoice_No__c = 'INV-001',
            Invoice_Date__c = Date.today(),
            Total_Amount__c = 1000,
            Participant__c = client.Id,
            Company__c = company.Id,
            SIL_PDF_Url__c = 'https://test.com/file.pdf'
        );
        insert inv;
    }
    
    @IsTest
    static void testQueueableExecution() {
        
        // Mock PDF callout
        Test.setMock(HttpCalloutMock.class, new MockPDFCallout());
        
        List<Id> invoiceIds = new List<Id>{
            [SELECT Id FROM Accounting_Invoices_Expenses__c LIMIT 1].Id
        };
        
        Test.startTest();
        System.enqueueJob(new SendInvoiceEmailQueueable(invoiceIds));
        Test.stopTest();
    }
    
    @IsTest
    static void testNoEmailScenario() {
        
        // Remove email
        Client__c client = [SELECT Id, Email__c FROM Client__c LIMIT 1];
        client.Email__c = null;
        update client;
        
        Test.setMock(HttpCalloutMock.class, new MockPDFCallout());
        
        List<Id> invoiceIds = new List<Id>{
            [SELECT Id FROM Accounting_Invoices_Expenses__c LIMIT 1].Id
        };
        
        Test.startTest();
        System.enqueueJob(new SendInvoiceEmailQueueable(invoiceIds));
        Test.stopTest();
    }
    
    @IsTest
    static void testNoPdfScenario() {
        
        // Remove PDF URL
        Accounting_Invoices_Expenses__c inv = [
            SELECT Id, SIL_PDF_Url__c FROM Accounting_Invoices_Expenses__c LIMIT 1
        ];
        inv.SIL_PDF_Url__c = null;
        update inv;
        
        Test.setMock(HttpCalloutMock.class, new MockPDFCallout());
        
        Test.startTest();
        System.enqueueJob(new SendInvoiceEmailQueueable(new List<Id>{inv.Id}));
        Test.stopTest();
    }
    
    // ───────── MOCK ─────────
    private class MockPDFCallout implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setBody('Dummy PDF');
            return res;
        }
    }
}