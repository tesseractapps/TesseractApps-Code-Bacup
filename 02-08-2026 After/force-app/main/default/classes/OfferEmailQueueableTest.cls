@IsTest
private class OfferEmailQueueableTest {

    @IsTest
    static void testExecute() {

        Test.setMock(
            HttpCalloutMock.class,
            new EmailRelayMock()
        );

        Test.startTest();

        System.enqueueJob(
            new OfferEmailQueueable(
                'from@test.com',
                'to@test.com',
                'Test Subject',
                '<p>Test Body</p>'
            )
        );

        Test.stopTest();
    }

    private class EmailRelayMock
        implements HttpCalloutMock {

        public HttpResponse respond(
            HttpRequest req
        ) {

            HttpResponse res =
                new HttpResponse();

            res.setStatusCode(200);

            res.setBody(
                '{"success":true}'
            );

            return res;
        }
    }
}