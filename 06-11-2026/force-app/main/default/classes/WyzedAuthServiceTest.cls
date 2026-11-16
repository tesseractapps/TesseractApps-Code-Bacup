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
    class MockWyzedUsersResponse implements HttpCalloutMock {
    
        public HTTPResponse respond(HTTPRequest req) {
    
            HttpResponse res = new HttpResponse();
    
            if (req.getEndpoint().contains('/_services/auth/token')) {
    
                res.setStatusCode(200);
                res.setBody('{"access_token":"test_token"}');
    
            } else {
    
                res.setStatusCode(200);
    
                res.setBody(
                    '{"users":[{"id":"999","email":"manualtesting.20294637@hotmail.com","is_learner":true}],"more":false,"next_cursor":null}'
                );
            }
    
            return res;
        }
    }
    class MockCreateLearnerResponse implements HttpCalloutMock {
    
        public HTTPResponse respond(HTTPRequest req) {
    
            HttpResponse res = new HttpResponse();
    
            if (req.getEndpoint().contains('/_services/auth/token')) {
    
                res.setStatusCode(200);
                res.setBody('{"access_token":"test_token"}');
    
            } else {
    
                res.setStatusCode(201);
    
                res.setBody(
                    '{"id":"12345","status":"created"}'
                );
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
    
    @IsTest
    static void testLoadWyzedAndStaffData() {
    
        TestDataFactory.createBaseData();
    
        User u = [
            SELECT Id
            FROM User
            WHERE Organization_Name__c = 'Ashfield Consultants'
            LIMIT 1
        ];
    
        Organisation__c org = [
            SELECT Id
            FROM Organisation__c
            LIMIT 1
        ];
    
        org.Wyzed_Tenant_ID__c = '123';
        org.Wyzed_Client_ID__c = 'client';
        org.Wyzed_Client_Secret__c = 'secret';
    
        update org;
    
        Test.setMock(
            HttpCalloutMock.class,
            new MockWyzedUsersResponse()
        );
    
        System.runAs(u) {
    
            Test.startTest();
    
            Map<String, Object> result =
                WyzedAuthService.loadWyzedAndStaffData();
    
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testCreateLearnerMinimal() {
    
        TestDataFactory.createBaseData();
    
        User u = [
            SELECT Id
            FROM User
            WHERE Organization_Name__c = 'Ashfield Consultants'
            LIMIT 1
        ];
    
        Organisation__c org = [
            SELECT Id
            FROM Organisation__c
            LIMIT 1
        ];
    
        org.Wyzed_Tenant_ID__c = '123';
        org.Wyzed_Client_ID__c = 'client';
        org.Wyzed_Client_Secret__c = 'secret';
    
        update org;
    
        Test.setMock(
            HttpCalloutMock.class,
            new MockCreateLearnerResponse()
        );
    
        System.runAs(u) {
    
            Test.startTest();
    
            String result =
                WyzedAuthService.createLearnerMinimal(
                    'Test',
                    'User',
                    'test@test.com',
                    true,
                    false
                );
    
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testUpdateWyzedId() {
    
        TestDataFactory.createBaseData();
    
        Staff__c st = [
            SELECT Id
            FROM Staff__c
            LIMIT 1
        ];
    
        Test.startTest();
    
        WyzedAuthService.updateWyzedId(
            st.Id,
            'WYZ123',
            true
        );
    
        Test.stopTest();
    }  
    }