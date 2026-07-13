@IsTest
private class mobileAppPartcipantDetailsRest_Test {

    @IsTest
    static void testFetchParticipant_Success() {

        // Create all required data
        TestDataFactory.createBaseData();

        // Get created participant
        Client__c participant = [
            SELECT Id 
            FROM Client__c 
            LIMIT 1
        ];

        RestRequest req = new RestRequest();
        req.requestUri = '/services/apexrest/FetchPartcipant';
        req.httpMethod = 'GET';
        req.addParameter('recordId', participant.Id);

        RestContext.request = req;
        RestContext.response = new RestResponse();

        Test.startTest();
        mobileAppPartcipantDetailsRest.fecthParticipantList();
        Test.stopTest();
    }
}