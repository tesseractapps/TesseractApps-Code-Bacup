@IsTest
private class MobileRoasterAdminTest {

    @IsTest
    static void testGetDummyMessage() {
        // Simulate a REST GET request to the endpoint
        RestRequest req = new RestRequest();
        req.requestUri = '/services/apexrest/roasterAdminDetails/';
        req.httpMethod = 'GET';

        RestResponse res = new RestResponse();
        RestContext.request = req;
        RestContext.response = res;

        // Call the method directly
        String result = MobileRoasterAdmin.getDummyMessage();

        // Verify the result
        System.assertEquals('This is a dummy message from a static method.', result);
    }
}