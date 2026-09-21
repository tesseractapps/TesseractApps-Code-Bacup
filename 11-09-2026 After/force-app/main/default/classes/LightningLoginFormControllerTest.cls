@IsTest(SeeAllData = true)
public with sharing class LightningLoginFormControllerTest {

 @IsTest
 static void LightningLoginFormControllerInstantiation() {
  LightningLoginFormController controller = new LightningLoginFormController();
  System.assertNotEquals(controller, null);
 }

 @IsTest
 static void testIsUsernamePasswordEnabled() {
  System.assertEquals(true, LightningLoginFormController.getIsUsernamePasswordEnabled());
 }

 @IsTest
 static void testIsSelfRegistrationEnabled() {
  System.assertEquals(false, LightningLoginFormController.getIsSelfRegistrationEnabled());
 }

 @IsTest
 static void testGetSelfRegistrationURL() {
  System.assertEquals(null, LightningLoginFormController.getSelfRegistrationUrl());
 }

 @IsTest
 static void testAuthConfig() {
  Auth.AuthConfiguration authConfig = LightningLoginFormController.getAuthConfig();
  System.assertNotEquals(null, authConfig);
 }
     @IsTest
static void testLoginMethod() {
    // Use fake credentials — Site.login will fail, but our method should catch the error
    String result;
    try {
        result = LightningLoginFormController.login(
            'fakeuser@example.com',
            'wrongPassword',
            '/home'
        );

        // The method returns null on success OR an error message on failure.
        // We do not check the actual value because it varies per org.
        System.assert(true, 'login() executed without throwing an exception');

    } catch (Exception e) {
        System.assert(false, 'login() should not throw. It must catch internal exceptions.');
    }
}
    @IsTest
static void testSetExperienceId() {
    // Case 1 — expId is null (should return null and NOT fail)
    String resultNull = LightningLoginFormController.setExperienceId(null);
    System.assertEquals(null, resultNull, 'Expected null when expId is null');

    // Case 2 — expId is a fake ID (method should catch exception and return message)
    String resultFake;
    try {
        resultFake = LightningLoginFormController.setExperienceId('00DFAKEEXPID');
        System.assert(true, 'setExperienceId executed without unhandled exception');
    } catch (Exception ex) {
        System.assert(false, 'setExperienceId should NOT throw an exception');
    }
}

}