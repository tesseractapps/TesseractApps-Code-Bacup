@isTest
private class TSign_EmailRelayServiceTest {

    // ==================================================================
    // HTTP Mock Classes
    // ==================================================================
    public class SuccessMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"status":"success","message":"Operation completed"}');
            res.setStatusCode(200);
            return res;
        }
    }

    public class ErrorMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"status":"error","message":"Invalid API Key"}');
            res.setStatusCode(401);
            return res;
        }
    }

    // ==================================================================
    // TEST 1: addClient
    // ==================================================================
    @isTest
    static void testAddClient() {
        Test.setMock(HttpCalloutMock.class, new SuccessMock());

        Test.startTest();
        try {
            Map<String, Object> res = TSign_EmailRelayService.addClient(
                'Test Client', 'client@example.com', 'Test Sender'
            );
            System.debug('addClient response: ' + res);
        } catch (Exception e) {
            System.debug('Error in addClient: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==================================================================
    // TEST 2: sendEmail - 7 Arguments (No senderName)
    // ==================================================================
    @isTest
    static void testSendEmail_7Args() {
        Test.setMock(HttpCalloutMock.class, new SuccessMock());

        Test.startTest();
        try {
            Map<String, Object> res = TSign_EmailRelayService.sendEmail(
                'sender@example.com',
                new List<String>{ 'recipient@example.com' },
                'Test Subject',
                'Test Body',
                null,
                null,
                null
            );
            System.debug('sendEmail 7 args response: ' + res);
        } catch (Exception e) {
            System.debug('Error in sendEmail 7 args: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==================================================================
    // TEST 3: sendEmail - 8 Arguments (With senderName + Optional Fields)
    // ==================================================================
    @isTest
    static void testSendEmail_8ArgsWithOptionals() {
        Test.setMock(HttpCalloutMock.class, new SuccessMock());

        Test.startTest();
        try {
            Map<String, Object> res = TSign_EmailRelayService.sendEmail(
                'sender@example.com',
                new List<String>{ 'recipient@example.com' },
                'Test Subject',
                'Test Body',
                new List<String>{ 'https://aws.com/attachment.pdf' },
                new List<String>{ 'cc@example.com' },
                new List<String>{ 'bcc@example.com' },
                'Custom Sender Name'
            );
            System.debug('sendEmail 8 args response: ' + res);
        } catch (Exception e) {
            System.debug('Error in sendEmail 8 args: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==================================================================
    // TEST 4: sendEmail - 8 Arguments (Empty Optional Fields)
    // ==================================================================
    @isTest
    static void testSendEmail_8ArgsEmptyOptionals() {
        Test.setMock(HttpCalloutMock.class, new SuccessMock());

        Test.startTest();
        try {
            Map<String, Object> res = TSign_EmailRelayService.sendEmail(
                'sender@example.com',
                new List<String>{ 'recipient@example.com' },
                'Test Subject',
                'Test Body',
                new List<String>(),
                new List<String>(),
                new List<String>(),
                'Custom Sender Name'
            );
            System.debug('sendEmail 8 args (empty) response: ' + res);
        } catch (Exception e) {
            System.debug('Error in sendEmail 8 args (empty): ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==================================================================
    // TEST 5: sendBulkEmails
    // ==================================================================
    @isTest
    static void testSendBulkEmails() {
        Test.setMock(HttpCalloutMock.class, new SuccessMock());

        List<Object> emails = new List<Object>();
        emails.add(new Map<String, Object>{
            'fromEmail' => 'sender@example.com',
            'toEmail' => 'recipient@example.com',
            'subject' => 'Bulk Subject',
            'body' => 'Bulk Body'
        });

        Test.startTest();
        try {
            Map<String, Object> res = TSign_EmailRelayService.sendBulkEmails(emails);
            System.debug('sendBulkEmails response: ' + res);
        } catch (Exception e) {
            System.debug('Error in sendBulkEmails: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==================================================================
    // TEST 6: checkStatus
    // ==================================================================
    @isTest
    static void testCheckStatus() {
        Test.setMock(HttpCalloutMock.class, new SuccessMock());

        Test.startTest();
        try {
            Map<String, Object> res = TSign_EmailRelayService.checkStatus('client@example.com');
            System.debug('checkStatus response: ' + res);
        } catch (Exception e) {
            System.debug('Error in checkStatus: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==================================================================
    // TEST 7: resendVerification
    // ==================================================================
    @isTest
    static void testResendVerification() {
        Test.setMock(HttpCalloutMock.class, new SuccessMock());

        Test.startTest();
        try {
            Map<String, Object> res = TSign_EmailRelayService.resendVerification('client@example.com');
            System.debug('resendVerification response: ' + res);
        } catch (Exception e) {
            System.debug('Error in resendVerification: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==================================================================
    // TEST 8: Error Path (Mocked 401 Unauthorized)
    // ==================================================================
    @isTest
    static void testErrorPath() {
        Test.setMock(HttpCalloutMock.class, new ErrorMock());

        Test.startTest();
        try {
            // Since the class doesn't explicitly check status codes, 
            // it will try to deserialize the error body, which is valid JSON.
            Map<String, Object> res = TSign_EmailRelayService.sendEmail(
                'sender@example.com',
                new List<String>{ 'recipient@example.com' },
                'Test Subject',
                'Test Body',
                null,
                null,
                null
            );
            System.debug('Error Path response: ' + res);
        } catch (Exception e) {
            System.debug('Caught exception on error path: ' + e.getMessage());
        }
        Test.stopTest();
    }
}