@IsTest
private class StorageServiceTest {

    // 🔥 MOCK SUCCESS
    private class MockSuccess implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setBody('{"used": 120, "limit": 500}');
            return res;
        }
    }

    // 🔥 MOCK FAILURE
    private class MockFailure implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(500);
            res.setBody('Internal Server Error');
            return res;
        }
    }

    @IsTest
    static void testGetStorageUsage_Success() {

        TestDataFactory.createBaseData();

        Organisation__c org = [
            SELECT Id
            FROM Organisation__c
            LIMIT 1
        ];

        Test.setMock(HttpCalloutMock.class, new MockSuccess());

        Test.startTest();
        Map<String, Object> result = StorageService.getStorageUsage(org.Id);
        Test.stopTest();
    }

    @IsTest
    static void testGetStorageUsage_Failure() {

        TestDataFactory.createBaseData();

        Organisation__c org = [
            SELECT Id
            FROM Organisation__c
            LIMIT 1
        ];

        Test.setMock(HttpCalloutMock.class, new MockFailure());

        Test.startTest();
        try {
            StorageService.getStorageUsage(org.Id);
        } catch (Exception e) {
        }
        Test.stopTest();
    }
}