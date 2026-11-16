@isTest
private class TSign_OfferEmailQueueableTest {

    // ==================================================================
    // HTTP Mock Class for the Email Relay Service
    // ==================================================================
    public class EmailRelayMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"status":"success","message":"Email sent"}');
            res.setStatusCode(200);
            return res;
        }
    }

    // ==================================================================
    // TEST 1: Execute Queueable - Successful Callout
    // ==================================================================
    @isTest
    static void testExecute_Success() {
        // Setup the callout mock so the queueable doesn't hit a real endpoint
        Test.setMock(HttpCalloutMock.class, new EmailRelayMock());

        // Instantiate the queueable with valid test data
        String fromEmail = 'sender@example.com';
        String toEmail = 'recipient@example.com';
        String subject = 'Test Email Subject';
        String body = 'This is a test email body.';

        TSign_OfferEmailQueueable queueableJob = new TSign_OfferEmailQueueable(
            fromEmail,
            toEmail,
            subject,
            body
        );

        Test.startTest();
        // Enqueue the job. Test.stopTest() forces asynchronous code to execute synchronously.
        System.enqueueJob(queueableJob);
        Test.stopTest();

        System.debug('Queueable executed successfully with mock.');
    }

    // ==================================================================
    // TEST 2: Execute Queueable - Error Path (Optional)
    // ==================================================================
    @isTest
    static void testExecute_ErrorPath() {
        // Simulate a callout failure by not setting a mock, or setting a mock that throws
        // Since the queueable catches exceptions internally, it won't fail the test.
        
        String fromEmail = 'sender@example.com';
        String toEmail = 'recipient@example.com';
        String subject = 'Test Subject';
        String body = 'Test Body';

        TSign_OfferEmailQueueable queueableJob = new TSign_OfferEmailQueueable(
            fromEmail,
            toEmail,
            subject,
            body
        );

        Test.startTest();
        // If EmailRelayService throws an error (e.g., due to missing mock), 
        // the queueable's try-catch will swallow it and log to System.debug.
        System.enqueueJob(queueableJob);
        Test.stopTest();

        System.debug('Queueable executed with potential error path.');
    }
}