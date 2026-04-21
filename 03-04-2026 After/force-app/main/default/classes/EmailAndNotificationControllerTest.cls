@isTest
public class EmailAndNotificationControllerTest {

    @isTest
    static void testInvokeMethod() {

        // Create test user to receive notification
        User u = [SELECT Id, Email FROM User WHERE Profile.Name = 'System Administrator' LIMIT 1];

        // Prepare Notification Input
        EmailAndNotificationController.NotificationInput input = 
            new EmailAndNotificationController.NotificationInput();
        
        input.Subject = 'Test Subject';
        input.Email_Body = '<p>This is a test email.</p>';
        input.Notification_Body = 'This is a test notification message.';
        input.EmailTo = new List<String>{ u.Email };
        input.NotificationTo = new List<String>{ u.Id };

        List<EmailAndNotificationController.NotificationInput> wrapperList =
            new List<EmailAndNotificationController.NotificationInput>{ input };

        Test.startTest();

        // Call Invocable Method
        EmailAndNotificationController.invoke(wrapperList);

        Test.stopTest();

        // -------------------------
        // Verify Notification Record
        // -------------------------
        List<My_Notification__c> noti = [
            SELECT Id, User__c, Subject__c, Description__c
            FROM My_Notification__c
            WHERE User__c = :u.Id
        ];

        System.assertEquals(1, noti.size(), 'One notification should be inserted');
        System.assertEquals('Test Subject', noti[0].Subject__c);
        System.assertEquals('This is a test notification message.', noti[0].Description__c);
    }


    @isTest
    static void testInvokeMethod_WithoutNotificationUsers() {

        // Prepare test sample with only email, no notification users
        EmailAndNotificationController.NotificationInput input = 
            new EmailAndNotificationController.NotificationInput();
        
        input.Subject = 'Email Only Subject';
        input.Email_Body = 'Email content';
        input.EmailTo = new List<String>{ 'test@example.com' };
        input.Notification_Body = 'Ignored';
        input.NotificationTo = null;

        Test.startTest();
        EmailAndNotificationController.invoke(new List<EmailAndNotificationController.NotificationInput>{ input });
        Test.stopTest();

        // No notification should exist
        Integer countNoti = [SELECT COUNT() FROM My_Notification__c];
        System.assertEquals(0, countNoti, 'No notification should be created');
    }
}