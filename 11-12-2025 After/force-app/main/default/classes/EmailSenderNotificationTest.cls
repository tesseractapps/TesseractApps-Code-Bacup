@IsTest
public class EmailSenderNotificationTest {

    @IsTest
    static void testSendSingleEmail_Success() {
        // Prepare test input
        String[] toAddresses = new String[] { 'test@example.com' };
        String subject = 'Test Subject';
        String body = '<p>This is a test email body</p>';

        Test.startTest();
        EmailSenderNotification.SendEmailResult result = EmailSenderNotification.sendSingleEmail(toAddresses, subject, body);
        Test.stopTest();

        // Validate results
        System.assert(result.isSuccess, 'Email should be sent successfully');
        System.assertEquals('Email sent successfully', result.message);
    }

    @IsTest
    static void testSendSingleEmail_ExceptionHandling() {
        // Mock failure scenario by passing null as toAddresses (which will throw an exception)
        String[] toAddresses = null;
        String subject = 'Test Subject';
        String body = '<p>This is a test email body</p>';

        Test.startTest();
        EmailSenderNotification.SendEmailResult result = EmailSenderNotification.sendSingleEmail(toAddresses, subject, body);
        Test.stopTest();

        // Validate that failure path is taken
        System.assert(!result.isSuccess, 'Email should fail to send when toAddresses is null');
        System.assert(result.message.startsWith('Error:'), 'Result message should contain the error');
    }
}