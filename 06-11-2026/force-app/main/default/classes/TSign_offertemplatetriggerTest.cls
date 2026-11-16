@isTest
private class TSign_offertemplatetriggerTest {

    // ==================================================================
    // HTTP Mock for the Email Queueable
    // ==================================================================
    public class EmailMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"status":"success"}');
            return res;
        }
    }

    // ==================================================================
    // Setup Data
    // ==================================================================
    @testSetup
    static void setupData() {
        // 1. Create a TSign Organisation
        TSign_Organisation__c org = new TSign_Organisation__c(
            Name = 'Test Org',
            Email__c = 'sender@example.com',
            Active__c = true
        );
        insert org;

        // 2. Create an Offer Template
        // We set the initial status so we can update it later and trigger the handler
        TSign_Offer_Template__c template = new TSign_Offer_Template__c(
            File_Name__c = 'Test Agreement.pdf',
            Sender_Email__c = 'sender@example.com',
            TSign_Organisation__c = org.Id,
            All_Recipients__c = 'recipient1@example.com\nrecipient2@example.com',
            All_Recipient_Names__c = 'Recipient One\nRecipient Two',
            Current_Recipient__c = 'recipient1@example.com',
            Current_Recipient_Status__c = 'Pending'
        );
        insert template;
    }

    // ==================================================================
    // TEST 1: Trigger Update Happy Path (Status Changed to Completed)
    // ==================================================================
    @isTest
    static void testTriggerUpdate_Completed() {
        Test.setMock(HttpCalloutMock.class, new EmailMock());

        TSign_Offer_Template__c template = [SELECT Id FROM TSign_Offer_Template__c LIMIT 1];

        // Change the status to trigger the email logic
        template.Current_Recipient_Status__c = 'Completed';

        Test.startTest();
        update template;
        Test.stopTest(); // Forces the OfferEmailQueueable to run
    }

    // ==================================================================
    // TEST 2: Trigger Update Happy Path (Recipient Changed)
    // ==================================================================
    @isTest
    static void testTriggerUpdate_RecipientChanged() {
        Test.setMock(HttpCalloutMock.class, new EmailMock());

        TSign_Offer_Template__c template = [SELECT Id FROM TSign_Offer_Template__c LIMIT 1];

        // Change the recipient to trigger the email logic
        template.Current_Recipient__c = 'recipient2@example.com';
        template.Current_Recipient_Status__c = 'Pending';

        Test.startTest();
        update template;
        Test.stopTest();
    }

    // ==================================================================
    // TEST 3: Trigger Update - No Changes (Should not send email)
    // ==================================================================
    @isTest
    static void testTriggerUpdate_NoChanges() {
        TSign_Offer_Template__c template = [SELECT Id FROM TSign_Offer_Template__c LIMIT 1];

        // Update a field that doesn't change Current_Recipient__c or Status
        template.File_Name__c = 'Updated_Name.pdf';

        Test.startTest();
        update template;
        Test.stopTest();
    }

    // ==================================================================
    // TEST 4: Trigger Update - Missing Sender Email (Should skip)
    // ==================================================================
    @isTest
    static void testTriggerUpdate_BlankSenderEmail() {
        TSign_Offer_Template__c template = [SELECT Id FROM TSign_Offer_Template__c LIMIT 1];

        // Clear sender email and change status
        template.Sender_Email__c = '';
        template.Current_Recipient_Status__c = 'Completed';

        Test.startTest();
        update template;
        Test.stopTest();
    }

    // ==================================================================
    // TEST 5: Trigger Update - Missing Organisation
    // ==================================================================
    @isTest
    static void testTriggerUpdate_MissingOrg() {
        Test.setMock(HttpCalloutMock.class, new EmailMock());
        
        TSign_Offer_Template__c template = [SELECT Id FROM TSign_Offer_Template__c LIMIT 1];
        
        // Clear org and update status
        template.TSign_Organisation__c = null;
        template.Current_Recipient_Status__c = 'Completed';

        Test.startTest();
        update template;
        Test.stopTest();
    }

    // ==================================================================
    // TEST 6: Trigger Update - Blank File Name and Recipient List
    // ==================================================================
    @isTest
    static void testTriggerUpdate_MissingFields() {
        Test.setMock(HttpCalloutMock.class, new EmailMock());
        
        TSign_Offer_Template__c template = [SELECT Id FROM TSign_Offer_Template__c LIMIT 1];
        
        // Clear fields to hit fallback logic branches
        template.File_Name__c = null;
        template.All_Recipients__c = null;
        template.All_Recipient_Names__c = null;
        template.Current_Recipient__c = 'recipient1@example.com'; // Ensure current recipient is there
        template.Current_Recipient_Status__c = 'Completed';

        Test.startTest();
        update template;
        Test.stopTest();
    }
}