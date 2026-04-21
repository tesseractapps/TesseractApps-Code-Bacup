@IsTest
public class WordEditorControllerTest {

    // --------------------------
    // Mock: success response
    // --------------------------
    private class PresignSuccessMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setHeader('Content-Type', 'application/json');

            // Return JSON that matches PresignResponse
            // (uploadUrl + key)
            res.setBody('{"uploadUrl":"https://s3.amazonaws.com/mock-upload-url","key":"folder/test.docx"}');
            return res;
        }
    }

    // --------------------------
    // Mock: failure response (non-2xx)
    // --------------------------
    private class PresignFailureMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(500);
            res.setHeader('Content-Type', 'application/json');
            res.setStatus('500 Server Error');
            res.setBody('{"message":"boom"}');
            return res;
        }
    }

    // --------------------------
    // getPresignedUrl - success
    // --------------------------
    @IsTest
    static void testGetPresignedUrl_Success() {
        Test.setMock(HttpCalloutMock.class, new PresignSuccessMock());

        Test.startTest();
        WordEditorController.PresignResponse outp =
            WordEditorController.getPresignedUrl(
                'my-bucket',
                'folder/test.docx',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            );
        Test.stopTest();

        // No assertEquals per your preference; just touch fields for coverage
        String u = outp.uploadUrl;
        String k = outp.key;
    }

    // --------------------------
    // getUpdatePresignedUrl - success
    // --------------------------
    @IsTest
    static void testGetUpdatePresignedUrl_Success() {
        Test.setMock(HttpCalloutMock.class, new PresignSuccessMock());

        Test.startTest();
        WordEditorController.PresignResponse outp =
            WordEditorController.getUpdatePresignedUrl(
                'my-bucket',
                'folder/test.docx',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            );
        Test.stopTest();

        String u = outp.uploadUrl;
        String k = outp.key;
    }

    // --------------------------
    // getPresignedUrl - failure (throws AuraHandledException)
    // --------------------------
    @IsTest
    static void testGetPresignedUrl_Failure() {
        Test.setMock(HttpCalloutMock.class, new PresignFailureMock());

        Test.startTest();
        try {
            WordEditorController.getPresignedUrl('my-bucket', 'folder/test.docx', 'application/octet-stream');
        } catch (AuraHandledException e) {
            // expected
        }
        Test.stopTest();
    }

    // --------------------------
    // getUpdatePresignedUrl - failure (throws AuraHandledException)
    // --------------------------
    @IsTest
    static void testGetUpdatePresignedUrl_Failure() {
        Test.setMock(HttpCalloutMock.class, new PresignFailureMock());

        Test.startTest();
        try {
            WordEditorController.getUpdatePresignedUrl('my-bucket', 'folder/test.docx', 'application/octet-stream');
        } catch (AuraHandledException e) {
            // expected
        }
        Test.stopTest();
    }
}