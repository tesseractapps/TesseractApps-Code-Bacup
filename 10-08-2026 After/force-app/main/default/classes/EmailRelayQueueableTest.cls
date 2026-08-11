@IsTest
Public class EmailRelayQueueableTest {

    private class EmailRelayMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setBody('{"success":true}');
            return res;
        }
    }

    @TestSetup
    static void setupData() {
        TestDataFactory.createBaseData();
    }

    @IsTest
    static void testSingleEmailConstructorBasic() {

        Test.setMock(HttpCalloutMock.class, new EmailRelayMock());

        Test.startTest();

        System.enqueueJob(
            new EmailRelayQueueable(
                'from@test.com',
                new List<String>{'to@test.com'},
                'Test Subject',
                'Test Body'
            )
        );

        Test.stopTest();
    }

    @IsTest
    static void testSingleEmailConstructorFullOptions() {

        Test.setMock(HttpCalloutMock.class, new EmailRelayMock());

        Test.startTest();

        System.enqueueJob(
            new EmailRelayQueueable(
                'from@test.com',
                new List<String>{'to@test.com'},
                'Test Subject',
                'Test Body',
                new List<String>{'file.pdf'},
                new List<String>{'cc@test.com'},
                new List<String>{'bcc@test.com'}
            )
        );

        Test.stopTest();
    }

    @IsTest
    static void testBulkEmailConstructor() {

        Test.setMock(HttpCalloutMock.class, new EmailRelayMock());

        List<Object> bulkEmails = new List<Object>();

        bulkEmails.add(
            new Map<String,Object>{
                'fromEmail' => 'from@test.com',
                'toEmail' => new List<String>{'to@test.com'},
                'subject' => 'Bulk Subject',
                'body' => 'Bulk Body'
            }
        );

        Test.startTest();

        System.enqueueJob(
            new EmailRelayQueueable(
                bulkEmails
            )
        );

        Test.stopTest();
    }

    @IsTest
    static void testFullOptionsWithNullLists() {

        Test.setMock(HttpCalloutMock.class, new EmailRelayMock());

        Test.startTest();

        System.enqueueJob(
            new EmailRelayQueueable(
                'from@test.com',
                new List<String>{'to@test.com'},
                'Subject',
                'Body',
                null,
                null,
                null
            )
        );

        Test.stopTest();
    }
}