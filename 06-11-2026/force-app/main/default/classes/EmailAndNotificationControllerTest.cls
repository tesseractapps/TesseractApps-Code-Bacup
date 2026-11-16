@IsTest
public class EmailAndNotificationControllerTest {

    @testSetup
    static void setupData() {
        TestDataFactory.createBaseData();
    }

    private static User getRunAsUser() {
        return [
            SELECT Id, Email, Organization_Name__c
            FROM User
            WHERE Organization_Name__c = 'Ashfield Consultants'
            LIMIT 1
        ];
    }

    @IsTest
    static void testInvokeMethod() {

        User u = getRunAsUser();

        EmailAndNotificationController.NotificationInput input =
            new EmailAndNotificationController.NotificationInput();

        input.Subject = 'Test Subject';
        input.Email_Body = '<p>This is a test email.</p>';
        input.Notification_Body = 'This is a test notification message.';
        input.EmailTo = new List<String>{u.Email};
        input.NotificationTo = new List<String>{u.Id};

        List<EmailAndNotificationController.NotificationInput> wrapperList =
            new List<EmailAndNotificationController.NotificationInput>{input};

        System.runAs(u) {

            Test.startTest();

            EmailAndNotificationController.invoke(wrapperList);

            Test.stopTest();
        }
    }

    @IsTest
    static void testInvokeMethod_WithoutNotificationUsers() {

        User u = getRunAsUser();

        EmailAndNotificationController.NotificationInput input =
            new EmailAndNotificationController.NotificationInput();

        input.Subject = 'Email Only Subject';
        input.Email_Body = 'Email content';
        input.Notification_Body = 'Notification content';
        input.EmailTo = new List<String>{'test@example.com'};
        input.NotificationTo = null;

        System.runAs(u) {

            Test.startTest();

            EmailAndNotificationController.invoke(
                new List<EmailAndNotificationController.NotificationInput>{input}
            );

            Test.stopTest();
        }
    }

    @IsTest
    static void testInvokeMethod_NullInputList() {

        User u = getRunAsUser();

        System.runAs(u) {

            Test.startTest();

            EmailAndNotificationController.invoke(null);

            Test.stopTest();
        }
    }

    @IsTest
    static void testInvokeMethod_EmptyInputList() {

        User u = getRunAsUser();

        System.runAs(u) {

            Test.startTest();

            EmailAndNotificationController.invoke(
                new List<EmailAndNotificationController.NotificationInput>()
            );

            Test.stopTest();
        }
    }

    @IsTest
    static void testInvokeMethod_BlankNotificationUser() {

        User u = getRunAsUser();

        EmailAndNotificationController.NotificationInput input =
            new EmailAndNotificationController.NotificationInput();

        input.Subject = 'Blank User Test';
        input.Email_Body = 'Email Body';
        input.Notification_Body = 'Notification Body';
        input.EmailTo = new List<String>{u.Email};
        input.NotificationTo = new List<String>{''};

        System.runAs(u) {

            Test.startTest();

            EmailAndNotificationController.invoke(
                new List<EmailAndNotificationController.NotificationInput>{input}
            );

            Test.stopTest();
        }
    }

    @IsTest
    static void testInvokeMethod_BlankEmailAddresses() {

        User u = getRunAsUser();

        EmailAndNotificationController.NotificationInput input =
            new EmailAndNotificationController.NotificationInput();

        input.Subject = 'Blank Email Test';
        input.Email_Body = 'Email Body';
        input.Notification_Body = 'Notification Body';
        input.EmailTo = new List<String>{'', '   '};
        input.NotificationTo = new List<String>{u.Id};

        System.runAs(u) {

            Test.startTest();

            EmailAndNotificationController.invoke(
                new List<EmailAndNotificationController.NotificationInput>{input}
            );

            Test.stopTest();
        }
    }
}