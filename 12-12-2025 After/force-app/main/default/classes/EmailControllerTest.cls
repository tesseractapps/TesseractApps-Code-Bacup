@isTest
public class EmailControllerTest {
    @isTest
    static void testSendEmailWithCustomBody() {
        // Valid input test
        Test.startTest();
        try {
            String htmlContent = '<h1>Test Email</h1><p>This is a test HTML email body.</p>';
            String plainTextBody = 'This is a test plain text email body.';
            String formType = 'TestFormType';

            EmailController.sendEmailWithCustomBody(htmlContent, plainTextBody, formType);

            // Verify Email
            List<Messaging.SingleEmailMessage> sentEmails =new List<Messaging.SingleEmailMessage>();          
        } catch (Exception e) {
            System.assert(false, 'Exception occurred in valid test: ' + e.getMessage());
        }
        Test.stopTest();
			
        
    }
}