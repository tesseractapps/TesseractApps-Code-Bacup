@isTest
public class WyzedIntegrationHandlerTest {
	  @isTest
    static void testEncodeJWT() {
        // Test data
        String uid = '123456';
        String firstname = 'John';
        String surname = 'Doe';
        String email = 'john.doe@example.com';
        String token = WyzedIntegrationHandler.encodeJWT(uid, firstname, surname, email);   
    }
     @isTest
    static void testRedirectToWyzedSSO() {
        // Test data
        String uid = '123456';
        String firstname = 'John';
        String surname = 'Doe';
        String email = 'john.doe@example.com';
        String redirectUrl = WyzedIntegrationHandler.redirectToWyzedSSO(uid, firstname, surname, email);
   
    }

}