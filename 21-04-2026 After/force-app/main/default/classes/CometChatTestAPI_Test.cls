@isTest
private class CometChatTestAPI_Test {

    @isTest
    static void testCreateRecord() {

        // Mock request
        RestRequest req = new RestRequest();
        req.requestUri = '/services/apexrest/cometchat/test';
        req.httpMethod = 'POST';
        req.requestBody = Blob.valueOf('{"message":"Test Message"}');

        RestContext.request = req;
        RestContext.response = new RestResponse();

        Test.startTest();
        String result = CometChatTestAPI.createTestRecord();
        Test.stopTest();

        System.assert(result.contains('SUCCESS'));

        // Verify record
       List<CometChat_Notification__c> records = [
    SELECT Id, LastMessage__c
    FROM CometChat_Notification__c
];

System.assert(!records.isEmpty());
System.assertEquals('Test Message', records[0].LastMessage__c);
    }
}