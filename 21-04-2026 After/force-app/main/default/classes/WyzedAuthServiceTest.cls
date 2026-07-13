@IsTest
public class WyzedAuthServiceTest {

    class MockHttpResponseGenerator implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {

            HttpResponse res = new HttpResponse();

            if (req.getEndpoint().contains('/_services/auth/token')) {
                res.setStatusCode(200);
                res.setBody('{"access_token":"test_token"}');
            } else {
                res.setStatusCode(200);
                res.setBody('{"courses":[{"id":1,"name":"Test Course"}]}');
            }

            return res;
        }
    }

    @IsTest
    static void testGetCoursesRaw() {
        TestDataFactory.createBaseData();
        User u = [SELECT Id FROM User WHERE Organization_Name__c = 'Ashfield Consultants' LIMIT 1];
        Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
        org.Wyzed_Tenant_ID__c = '123';
        org.Wyzed_Client_ID__c = 'client';
        org.Wyzed_Client_Secret__c = 'secret';
        update org;
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator());
        System.runAs(u) {
            Test.startTest();
            String result = WyzedAuthService.getCoursesRaw();
            Test.stopTest();
        }
}

    @IsTest
    static void testGetAccessTokenCache() {
        TestDataFactory.createBaseData();
        User u = [SELECT Id FROM User WHERE Organization_Name__c = 'Ashfield Consultants' LIMIT 1];
        Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
        org.Wyzed_Tenant_ID__c = '123';
        org.Wyzed_Client_ID__c = 'client';
        org.Wyzed_Client_Secret__c = 'secret';
        update org;
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator());
        System.runAs(u) {
            Test.startTest();
            String token1 = WyzedAuthService.getAccessToken();
            String token2 = WyzedAuthService.getAccessToken();
    
            Test.stopTest();
        }
}
}