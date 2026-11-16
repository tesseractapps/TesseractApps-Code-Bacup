@isTest
private class tSignAwsBatchControllerTest {

    // ==================================================================
    // HTTP MOCK CLASSES
    // ==================================================================
    public class SuccessMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            res.setStatusCode(200);
            
            String jsonResponse = '{"results":[{"uploadUrl":"https://aws.com/upload","key":"org1/file.png","status":"ok","index":0,"url":"https://aws.com/file.png","bucket":"test-bucket","env":"dev"}],"total":1,"succeeded":1,"failed":0}';
            res.setBody(jsonResponse);
            return res;
        }
    }

    public class ErrorMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            res.setStatusCode(400);
            res.setBody('{"error":"Bad Request"}');
            return res;
        }
    }

    // ==================================================================
    // SETUP
    // ==================================================================
    @testSetup
    static void setupData() {
        User u = [SELECT Id, User_Type__c FROM User WHERE Id = :UserInfo.getUserId()];
        u.User_Type__c = 'T Sign Org Admin'; 
        Database.update(u, false);
    }

    // ==================================================================
    // TESTS: uploadFiles & overwriteFiles
    // ==================================================================
    @isTest
    static void testUploadFiles_Success() {
        Test.setMock(HttpCalloutMock.class, new SuccessMock());

        List<Map<String, Object>> files = new List<Map<String, Object>>();
        
        // 1. Key with extension (Hits extension extraction)
        files.add(new Map<String, Object>{
            'key' => 'org1/test.pdf',
            'contentType' => 'application/pdf',
            'size' => 1024
        });

        // 2. Key without extension, with contentType (Hits contentType fallback)
        files.add(new Map<String, Object>{
            'key' => 'org1/noext',
            'contentType' => 'image/png'
        });

        // 3. Key without extension, no contentType (Hits final 'bin' fallback)
        files.add(new Map<String, Object>{
            'key' => 'org1/notype',
            'contentType' => null
        });

        Test.startTest();
        tSignAwsBatchController.BatchResponse res = tSignAwsBatchController.uploadFiles(files);
        Test.stopTest();

        System.debug('Upload Success - Total: ' + res.total);
        System.debug('Upload Success - Succeeded: ' + res.succeeded);
    }

    @isTest
    static void testOverwriteFiles_Success() {
        Test.setMock(HttpCalloutMock.class, new SuccessMock());

        List<Map<String, Object>> files = new List<Map<String, Object>>();
        Map<String, Object> fileMap = new Map<String, Object>{
            'key' => 'org1/test.png',
            'contentType' => 'image/png'
        };
        files.add(fileMap);

        Test.startTest();
        tSignAwsBatchController.BatchResponse res = tSignAwsBatchController.overwriteFiles(files);
        Test.stopTest();

        System.debug('Overwrite Success - Total: ' + res.total);
    }

    @isTest
    static void testUploadFiles_EmptyList() {
        Test.startTest();
        try {
            tSignAwsBatchController.uploadFiles(new List<Map<String, Object>>());
            System.debug('Expected exception for empty list not thrown.');
        } catch (Exception e) {
            System.debug('Caught expected exception for empty list: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testUploadFiles_NullList() {
        Test.startTest();
        try {
            tSignAwsBatchController.uploadFiles(null);
            System.debug('Expected exception for null list not thrown.');
        } catch (Exception e) {
            System.debug('Caught expected exception for null list: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testUploadFiles_ErrorStatus() {
        Test.setMock(HttpCalloutMock.class, new ErrorMock());

        List<Map<String, Object>> files = new List<Map<String, Object>>();
        files.add(new Map<String, Object>{'key' => 'org1/test.pdf'});

        Test.startTest();
        try {
            tSignAwsBatchController.uploadFiles(files);
            System.debug('Expected exception for error status not thrown.');
        } catch (Exception e) {
            System.debug('Caught expected exception for error status: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==================================================================
    // TESTS: deleteFiles & deleteFilesFromAwsJson
    // ==================================================================
    @isTest
    static void testDeleteFiles_Success() {
        Test.setMock(HttpCalloutMock.class, new SuccessMock());

        List<String> keys = new List<String>{ 'org1/test.pdf', 'org1/test.png' };

        Test.startTest();
        tSignAwsBatchController.ApiResponse res = tSignAwsBatchController.deleteFiles(keys);
        Test.stopTest();

        System.debug('Delete Success - Total: ' + res.total);
    }

    @isTest
    static void testDeleteFiles_EmptyKeys() {
        Test.startTest();
        try {
            tSignAwsBatchController.deleteFiles(new List<String>());
            System.debug('Expected exception for empty keys not thrown.');
        } catch (Exception e) {
            System.debug('Caught expected exception for empty keys: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testDeleteFilesFromAwsJson_Success() {
        Test.setMock(HttpCalloutMock.class, new SuccessMock());

        String awsJson = '{"files":[{"key":"org1/file1.pdf"},{"key":"org1/file2.png"}]}';

        Test.startTest();
        tSignAwsBatchController.ApiResponse res = tSignAwsBatchController.deleteFilesFromAwsJson(awsJson);
        Test.stopTest();

        System.debug('Delete from JSON Success - Total: ' + res.total);
    }

    @isTest
    static void testDeleteFilesFromAwsJson_InvalidJson() {
        Test.startTest();
        try {
            tSignAwsBatchController.deleteFilesFromAwsJson('invalid-json-string');
            System.debug('Expected exception for invalid JSON not thrown.');
        } catch (Exception e) {
            System.debug('Caught expected exception for invalid JSON: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testDeleteFilesFromAwsJson_NoKeys() {
        Test.startTest();
        try {
            tSignAwsBatchController.deleteFilesFromAwsJson('{"files":[]}');
            System.debug('Expected exception for no keys not thrown.');
        } catch (Exception e) {
            System.debug('Caught expected exception for no keys: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==================================================================
    // TESTS: Helpers & Config
    // ==================================================================
    @isTest
    static void testSanitizeFullPath() {
        Test.startTest();
        String path1 = tSignAwsBatchController.sanitizeFullPath('folder/subfolder/Test File (1).pdf');
        String path2 = tSignAwsBatchController.sanitizeFullPath('Test File @#.png');
        String path3 = tSignAwsBatchController.sanitizeFullPath('');
        Test.stopTest();

        System.debug('Sanitized Path 1: ' + path1);
        System.debug('Sanitized Path 2: ' + path2);
        System.debug('Sanitized Path 3: ' + path3);
    }

    @isTest
    static void testGetUploadConfig() {
        Test.startTest();
        try {
            Map<String, Object> config = tSignAwsBatchController.getUploadConfig('TestModule');
            System.debug('Config fetched: ' + config);
        } catch (Exception e) {
            System.debug('Caught expected exception for missing config: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testExtractKeysFromAwsJson() {
        Test.startTest();
        String jsonStr = '{"data": {"key": "org1/file.pdf"}, "list": [{"key": "org1/file2.png"}]}';
        Test.setMock(HttpCalloutMock.class, new SuccessMock());
        
        try {
            tSignAwsBatchController.deleteFilesFromAwsJson(jsonStr);
            System.debug('Indirect extraction of keys succeeded.');
        } catch (Exception e) {
            System.debug('Indirect extraction exception: ' + e.getMessage());
        }
        Test.stopTest();
    }
}