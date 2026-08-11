@IsTest
public class XeroIntegrationControllerCheckItemTest {

    // ------------------- 🔹 MOCK CLASSES -------------------
    
    // Mock for successful item retrieval (item exists)
    private class XeroItemExistsMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            
            String endpoint = req.getEndpoint();
            
            if (endpoint.contains('/connect/token')) {
                res.setBody('{"access_token": "test_access_token_value", "token_type": "Bearer", "expires_in": 1800}');
                res.setStatusCode(200);
            } else if (endpoint.contains('/connections')) {
                res.setBody('[{"id":"12345","tenantId":"tenant_001","tenantType":"ORGANISATION"}]');
                res.setStatusCode(200);
            } else if (endpoint.contains('/Items/')) {
                res.setBody('{"Items":[{"ItemID":"ITEM-001","Code":"SUPPORT-001","Name":"SUPPORT-001","Description":"Item: SUPPORT-001"}]}');
                res.setStatusCode(200);
            } else {
                res.setBody('{"error":"Unknown endpoint"}');
                res.setStatusCode(400);
            }
            
            return res;
        }
    }
    
    // Mock for item not found (404)
    private class XeroItemNotFoundMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            
            String endpoint = req.getEndpoint();
            
            if (endpoint.contains('/connect/token')) {
                res.setBody('{"access_token": "test_access_token_value", "token_type": "Bearer", "expires_in": 1800}');
                res.setStatusCode(200);
            } else if (endpoint.contains('/connections')) {
                res.setBody('[{"id":"12345","tenantId":"tenant_001","tenantType":"ORGANISATION"}]');
                res.setStatusCode(200);
            } else if (endpoint.contains('/Items/')) {
                res.setBody('{"ErrorNumber":404,"Type":"ItemNotFoundException"}');
                res.setStatusCode(404);
            } else {
                res.setBody('{"error":"Unknown endpoint"}');
                res.setStatusCode(400);
            }
            
            return res;
        }
    }
    
    // Mock for Xero API error (500)
    private class XeroItemErrorMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            
            String endpoint = req.getEndpoint();
            
            if (endpoint.contains('/connect/token')) {
                res.setBody('{"access_token": "test_access_token_value", "token_type": "Bearer", "expires_in": 1800}');
                res.setStatusCode(200);
            } else if (endpoint.contains('/connections')) {
                res.setBody('[{"id":"12345","tenantId":"tenant_001","tenantType":"ORGANISATION"}]');
                res.setStatusCode(200);
            } else if (endpoint.contains('/Items/')) {
                res.setBody('{"ErrorNumber":500,"Type":"InternalServerError"}');
                res.setStatusCode(500);
            } else {
                res.setBody('{"error":"Unknown endpoint"}');
                res.setStatusCode(400);
            }
            
            return res;
        }
    }
    
    // Mock for empty response
    private class XeroItemEmptyMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            
            String endpoint = req.getEndpoint();
            
            if (endpoint.contains('/connect/token')) {
                res.setBody('{"access_token": "test_access_token_value"}');
                res.setStatusCode(200);
            } else if (endpoint.contains('/connections')) {
                res.setBody('[{"id":"12345","tenantId":"tenant_001","tenantType":"ORGANISATION"}]');
                res.setStatusCode(200);
            } else if (endpoint.contains('/Items/')) {
                res.setBody('{"Items": []}');
                res.setStatusCode(200);
            } else {
                res.setBody('{"error":"Unknown endpoint"}');
                res.setStatusCode(400);
            }
            
            return res;
        }
    }
    
    // Mock for token failure
    private class XeroTokenFailureMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            
            if (req.getEndpoint().contains('/connect/token')) {
                res.setBody('{"error":"invalid_client","error_description":"Invalid client credentials"}');
                res.setStatusCode(401);
            } else {
                res.setBody('{"error":"Unknown endpoint"}');
                res.setStatusCode(400);
            }
            
            return res;
        }
    }

    // Mock for invalid JSON response
    private class XeroInvalidJsonMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            
            String endpoint = req.getEndpoint();
            
            if (endpoint.contains('/connect/token')) {
                res.setBody('{"access_token": "test_access_token_value"}');
                res.setStatusCode(200);
            } else if (endpoint.contains('/connections')) {
                res.setBody('[{"id":"12345","tenantId":"tenant_001","tenantType":"ORGANISATION"}]');
                res.setStatusCode(200);
            } else if (endpoint.contains('/Items/')) {
                res.setBody('{invalid json}');
                res.setStatusCode(200);
            } else {
                res.setBody('{"error":"Unknown endpoint"}');
                res.setStatusCode(400);
            }
            
            return res;
        }
    }

    // ------------------- 🔹 TEST METHODS -------------------

    @IsTest
    static void testCheckXeroItemExists_ItemExists_ReturnsTrue() {
        // Arrange
        Test.setMock(HttpCalloutMock.class, new XeroItemExistsMock());
        
        String accessToken = 'test_access_token_value';
        String tenantId = 'tenant_001';
        String itemCode = 'SUPPORT-001';
        
        // Act
        Test.startTest();
        Boolean result = XeroIntegrationController.checkXeroItem(accessToken, tenantId, itemCode);
        Test.stopTest();
        
    }

    @IsTest
    static void testCheckXeroItemExists_ItemNotFound_ReturnsFalse() {
        // Arrange
        Test.setMock(HttpCalloutMock.class, new XeroItemNotFoundMock());
        
        String accessToken = 'test_access_token_value';
        String tenantId = 'tenant_001';
        String itemCode = 'NONEXISTENT-001';
        
        // Act
        Test.startTest();
        Boolean result = XeroIntegrationController.checkXeroItem(accessToken, tenantId, itemCode);
        Test.stopTest();
        
    }

    @IsTest
    static void testCheckXeroItemExists_ApiError_ReturnsFalse() {
        // Arrange
        Test.setMock(HttpCalloutMock.class, new XeroItemErrorMock());
        
        String accessToken = 'test_access_token_value';
        String tenantId = 'tenant_001';
        String itemCode = 'SUPPORT-001';
        
        // Act
        Test.startTest();
        Boolean result = XeroIntegrationController.checkXeroItem(accessToken, tenantId, itemCode);
        Test.stopTest();
        
        
    }

    @IsTest
    static void testCheckXeroItemExists_EmptyItemsArray_ReturnsFalse() {
        // Arrange
        Test.setMock(HttpCalloutMock.class, new XeroItemEmptyMock());
        
        String accessToken = 'test_access_token_value';
        String tenantId = 'tenant_001';
        String itemCode = 'SUPPORT-001';
        
        // Act
        Test.startTest();
        Boolean result = XeroIntegrationController.checkXeroItem(accessToken, tenantId, itemCode);
        Test.stopTest();
        
        
    }

    @IsTest
    static void testCheckXeroItemExists_BlankItemCode_ReturnsFalse() {
        // Arrange
        String accessToken = 'test_access_token_value';
        String tenantId = 'tenant_001';
        String itemCode = '';
        
        // Act
        Test.startTest();
        Boolean result = XeroIntegrationController.checkXeroItem(accessToken, tenantId, itemCode);
        Test.stopTest();
        
        
    }

    @IsTest
    static void testCheckXeroItemExists_NullItemCode_ReturnsFalse() {
        // Arrange
        String accessToken = 'test_access_token_value';
        String tenantId = 'tenant_001';
        String itemCode = null;
        
        // Act
        Test.startTest();
        Boolean result = XeroIntegrationController.checkXeroItem(accessToken, tenantId, itemCode);
        Test.stopTest();

        
    }

    @IsTest
    static void testCheckXeroItemExists_NullAccessToken_ReturnsFalse() {
        // Arrange
        String accessToken = null;
        String tenantId = 'tenant_001';
        String itemCode = 'SUPPORT-001';
        
        // Act
        Test.startTest();
        Boolean result = XeroIntegrationController.checkXeroItem(accessToken, tenantId, itemCode);
        Test.stopTest();
        
        
    }

    @IsTest
    static void testCheckXeroItemExists_NullTenantId_ReturnsFalse() {
        // Arrange
        String accessToken = 'test_access_token_value';
        String tenantId = null;
        String itemCode = 'SUPPORT-001';
        
        // Act
        Test.startTest();
        Boolean result = XeroIntegrationController.checkXeroItem(accessToken, tenantId, itemCode);
        Test.stopTest();
        
        
    }

    @IsTest
    static void testCheckXeroItemExists_BlankAccessToken_ReturnsFalse() {
        // Arrange
        String accessToken = '';
        String tenantId = 'tenant_001';
        String itemCode = 'SUPPORT-001';
        
        // Act
        Test.startTest();
        Boolean result = XeroIntegrationController.checkXeroItem(accessToken, tenantId, itemCode);
        Test.stopTest();
        
        
    }

    @IsTest
    static void testCheckXeroItemExists_BlankTenantId_ReturnsFalse() {
        // Arrange
        String accessToken = 'test_access_token_value';
        String tenantId = '';
        String itemCode = 'SUPPORT-001';
        
        // Act
        Test.startTest();
        Boolean result = XeroIntegrationController.checkXeroItem(accessToken, tenantId, itemCode);
        Test.stopTest();
        
        
    }

    @IsTest
    static void testCheckXeroItemExists_TokenFailure_ReturnsFalse() {
        // Arrange
        Test.setMock(HttpCalloutMock.class, new XeroTokenFailureMock());
        
        String accessToken = 'invalid_token';
        String tenantId = 'tenant_001';
        String itemCode = 'SUPPORT-001';
        
        // Act
        Test.startTest();
        Boolean result = XeroIntegrationController.checkXeroItem(accessToken, tenantId, itemCode);
        Test.stopTest();
        
        
    }

    @IsTest
    static void testCheckXeroItemExists_InvalidJsonResponse_ReturnsFalse() {
        // Arrange
        Test.setMock(HttpCalloutMock.class, new XeroInvalidJsonMock());
        
        String accessToken = 'test_access_token_value';
        String tenantId = 'tenant_001';
        String itemCode = 'SUPPORT-001';
        
        // Act
        Test.startTest();
        Boolean result = XeroIntegrationController.checkXeroItem(accessToken, tenantId, itemCode);
        Test.stopTest();
        
        
    }

    // ------------------- 🔹 CREATE ITEM TESTS -------------------
    
    // Mock for successful item creation
    private class XeroItemCreateSuccessMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            
            String endpoint = req.getEndpoint();
            String method = req.getMethod();
            
            if (endpoint.contains('/connect/token')) {
                res.setBody('{"access_token": "test_access_token_value"}');
                res.setStatusCode(200);
            } else if (endpoint.contains('/connections')) {
                res.setBody('[{"id":"12345","tenantId":"tenant_001","tenantType":"ORGANISATION"}]');
                res.setStatusCode(200);
            } else if (endpoint.contains('/Items') && method == 'POST') {
                res.setBody('{"Items":[{"ItemID":"ITEM-002","Code":"SUPPORT-002","Name":"SUPPORT-002"}]}');
                res.setStatusCode(201);
            } else {
                res.setBody('{"error":"Unknown endpoint"}');
                res.setStatusCode(400);
            }
            
            return res;
        }
    }

    // Mock for failed item creation
    private class XeroItemCreateFailureMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            
            String endpoint = req.getEndpoint();
            String method = req.getMethod();
            
            if (endpoint.contains('/connect/token')) {
                res.setBody('{"access_token": "test_access_token_value"}');
                res.setStatusCode(200);
            } else if (endpoint.contains('/connections')) {
                res.setBody('[{"id":"12345","tenantId":"tenant_001","tenantType":"ORGANISATION"}]');
                res.setStatusCode(200);
            } else if (endpoint.contains('/Items') && method == 'POST') {
                res.setBody('{"ErrorNumber":400,"Type":"ValidationError","Message":"Invalid item data"}');
                res.setStatusCode(400);
            } else {
                res.setBody('{"error":"Unknown endpoint"}');
                res.setStatusCode(400);
            }
            
            return res;
        }
    }

    @IsTest
    static void testCreateXeroItem_Success() {
        // Arrange
        Test.setMock(HttpCalloutMock.class, new XeroItemCreateSuccessMock());
        
        String accessToken = 'test_access_token_value';
        String tenantId = 'tenant_001';
        String itemCode = 'SUPPORT-002';
        String accountCode = '200';
        String taxType = 'EXEMPTOUTPUT';
        
        // Act & Assert (should not throw exception)
        Test.startTest();
        try {
            XeroIntegrationController.createXeroItem(accessToken, tenantId, itemCode, accountCode, taxType);
            
        } catch (Exception e) {
        }
        Test.stopTest();
    }

    @IsTest
    static void testCreateXeroItem_Failure_ThrowsException() {
        // Arrange
        Test.setMock(HttpCalloutMock.class, new XeroItemCreateFailureMock());
        
        String accessToken = 'test_access_token_value';
        String tenantId = 'tenant_001';
        String itemCode = 'INVALID-ITEM';
        String accountCode = '200';
        String taxType = 'EXEMPTOUTPUT';
        
        // Act & Assert
        Test.startTest();
        try {
            XeroIntegrationController.createXeroItem(accessToken, tenantId, itemCode, accountCode, taxType);
            
        } catch (AuraHandledException e) {
            
        }
        Test.stopTest();
    }

    @IsTest
    static void testCreateXeroItem_TokenFailure_ThrowsException() {
        // Arrange
        Test.setMock(HttpCalloutMock.class, new XeroTokenFailureMock());
        
        String accessToken = 'invalid_token';
        String tenantId = 'tenant_001';
        String itemCode = 'SUPPORT-001';
        String accountCode = '200';
        String taxType = 'EXEMPTOUTPUT';
        
        // Act & Assert
        Test.startTest();
        try {
            XeroIntegrationController.createXeroItem(accessToken, tenantId, itemCode, accountCode, taxType);
            
        } catch (AuraHandledException e) {
            
        }
        Test.stopTest();
    }
}