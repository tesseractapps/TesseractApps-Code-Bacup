@isTest
public class MobileAppVersionNumberTest {
    @testSetup
    static void setupTestData() {
        // Insert Mobile App Version Metadata Records
        List<Mobile_App_Version__mdt> versionMetadataList = new List<Mobile_App_Version__mdt>{
            new Mobile_App_Version__mdt(
                MasterLabel = 'Android',
                Mobile_Type__c = 'Android',
                Version_Number__c = 1.5
            ),
            new Mobile_App_Version__mdt(
                MasterLabel = 'iOS',
                Mobile_Type__c = 'iOS',
                Version_Number__c = 2.0
            )
        };
        
        // Insert Metadata records using Metadata API is not directly supported in Apex test,
        // But in a Test context, Custom Metadata can be queried without inserting.
        // So no need to insert them. They should already exist in the org or be created manually in your org for this test.
    }
    
    @isTest
    static void testGetVersionNumber() {
        // Set up mock RestRequest and RestResponse context
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestUri = '/services/apexrest/versionNumber/';
        req.httpMethod = 'GET';
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        MobileAppVersionNumber.getversionNumber();
        Test.stopTest();
        
        System.assertEquals(200, RestContext.response.statusCode, 'Response status code should be 200');
        System.assert(RestContext.response.responseBody != null, 'Response body should not be null');
        
        String jsonBody = RestContext.response.responseBody.toString();
        System.debug('Response JSON: ' + jsonBody);
        
        // Parse the JSON to a Map and verify some expected keys exist
        Map<String, Object> resultMap = (Map<String, Object>) JSON.deserializeUntyped(jsonBody);
        System.assert(resultMap.containsKey('Android'), 'Response should contain Android version');
        System.assert(resultMap.containsKey('iOS'), 'Response should contain iOS version');
    }
}