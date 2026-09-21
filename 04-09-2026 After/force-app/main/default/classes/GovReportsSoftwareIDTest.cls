@IsTest
public class GovReportsSoftwareIDTest {
	@IsTest
    static void testGenerateSoftwareID_Success() {
        // Mock success response
        Test.setMock(HttpCalloutMock.class, new MockGovReportsHttpResponse(true, false));

        Test.startTest();
        String response = GovReportsSoftwareID.generateSoftwareID('15603031803');
        Test.stopTest();

        System.assert(response.contains('"IsSuccess":true'), 'Expected success response');
    }

    @IsTest
    static void testGenerateSoftwareID_TokenFailure() {
        // Mock token failure
        Test.setMock(HttpCalloutMock.class, new MockGovReportsHttpResponse(false, false));

        Test.startTest();
        String response = GovReportsSoftwareID.generateSoftwareID('15603031803');
        Test.stopTest();

        System.assert(response.contains('"IsSuccess":false'), 'Expected failure response due to token error');
    }

    @IsTest
    static void testGenerateSoftwareID_HttpError() {
        // Mock HTTP error (non-200 response)
        Test.setMock(HttpCalloutMock.class, new MockGovReportsHttpResponse(false, true));

        Test.startTest();
        String response = GovReportsSoftwareID.generateSoftwareID('15603031803');
        Test.stopTest();

        System.assert(response.contains('"IsSuccess":false'), 'Expected HTTP error response');
    }

    // Mock Class to Simulate API Responses
    private class MockGovReportsHttpResponse implements HttpCalloutMock {
        private Boolean isSuccess;
        private Boolean isHttpError;

        public MockGovReportsHttpResponse(Boolean success, Boolean httpError) {
            this.isSuccess = success;
            this.isHttpError = httpError;
        }

        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');

            if (isHttpError) {
                res.setStatusCode(500); // Simulate a server error
                res.setBody('{"IsSuccess":false, "Message":"HTTP Error Occurred"}');
            } else if (!isSuccess) {
                res.setStatusCode(200);
                res.setBody('{"IsSuccess":false, "Message":"Failed to retrieve token"}');
            } else {
                res.setStatusCode(200);
                res.setBody('{"IsSuccess":true, "Result":"0000529736"}');
            }
            return res;
        }
    }
}