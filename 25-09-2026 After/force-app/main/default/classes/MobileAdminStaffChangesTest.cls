@IsTest
private class MobileAdminStaffChangesTest {

    @IsTest
    static void testGetDummyMessage() {
        // Simulate a REST GET request to the endpoint
        RestRequest req = new RestRequest();
        req.requestUri = '/services/apexrest/staffChanges/';
        req.httpMethod = 'GET';

        RestResponse res = new RestResponse();
        RestContext.request = req;
        RestContext.response = res;

        // Call the method
        String result = MobileAdminStaffChanges.getDummyMessage();

        // Verify the result
        System.assertEquals('This is a dummy message from a static method.', result);
    }
}