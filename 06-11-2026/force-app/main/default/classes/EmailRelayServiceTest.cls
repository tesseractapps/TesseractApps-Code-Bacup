@IsTest
public class EmailRelayServiceTest {

    private class EmailRelayMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setBody('{"success":true,"message":"Test Success"}');
            return res;
        }
    }

    @TestSetup
    static void setupData() {
        TestDataFactory.createBaseData();
    }

    @IsTest
    static void testAddClient() {
        Test.setMock(HttpCalloutMock.class, new EmailRelayMock());

        Test.startTest();
        EmailRelayService.addClient(
            'Test Client',
            'test@test.com',
            'Test User'
        );
        Test.stopTest();
    }

    @IsTest
    static void testSendEmailWithAllParams() {
        Test.setMock(HttpCalloutMock.class, new EmailRelayMock());

        Test.startTest();
        EmailRelayService.sendEmail(
            'from@test.com',
            new List<String>{'to@test.com'},
            'Test Subject',
            'Test Body',
            new List<String>{'file1.pdf'},
            new List<String>{'cc@test.com'},
            new List<String>{'bcc@test.com'}
        );
        Test.stopTest();
    }

    @IsTest
    static void testSendEmailWithoutOptionalParams() {
        Test.setMock(HttpCalloutMock.class, new EmailRelayMock());

        Test.startTest();
        EmailRelayService.sendEmail(
            'from@test.com',
            new List<String>{'to@test.com'},
            'Test Subject',
            'Test Body',
            null,
            null,
            null
        );
        Test.stopTest();
    }

    @IsTest
    static void testSendBulkEmails() {
        Test.setMock(HttpCalloutMock.class, new EmailRelayMock());

        List<Object> emails = new List<Object>();

        Map<String,Object> emailData = new Map<String,Object>{
            'fromEmail' => 'from@test.com',
            'toEmail' => new List<String>{'to@test.com'},
            'subject' => 'Bulk Test',
            'body' => 'Bulk Body'
        };

        emails.add(emailData);

        Test.startTest();
        EmailRelayService.sendBulkEmails(emails);
        Test.stopTest();
    }

    @IsTest
    static void testCheckStatus() {
        Test.setMock(HttpCalloutMock.class, new EmailRelayMock());

        Test.startTest();
        EmailRelayService.checkStatus('test@test.com');
        Test.stopTest();
    }

    @IsTest
    static void testResendVerification() {
        Test.setMock(HttpCalloutMock.class, new EmailRelayMock());

        Test.startTest();
        EmailRelayService.resendVerification('test@test.com');
        Test.stopTest();
    }
}