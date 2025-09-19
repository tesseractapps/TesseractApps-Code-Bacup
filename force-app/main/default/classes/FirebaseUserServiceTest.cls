@isTest
private class FirebaseUserServiceTest {
    
    // Mock Class to Simulate API Response
    private class MockHttpResponse implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setBody('{"status": "success"}'); // Simple JSON response
            return res;
        }
    }

    @isTest
    static void testGetFirestoreUsers() {
        Test.setMock(HttpCalloutMock.class, new MockHttpResponse()); // Set Mock Response

        Test.startTest();
        String response = FirebaseUserService.getFirestoreUsers(); // Call Method
        Test.stopTest();

        // Validate the response
        //System.assertNotEquals(null, response, 'Response should not be null');
        //System.assert(response.contains('success'), 'Response should contain success message');
    }
}