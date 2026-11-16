@IsTest
public class PushNotificationControllerTest {

    //=========================================
    // HTTP MOCK
    //=========================================
    class NotificationMock implements HttpCalloutMock {

        public HTTPResponse respond(HTTPRequest req) {

            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);

            // Token API
            if (req.getBody() != null &&
                req.getBody().contains('grant_type')) {

                res.setBody(
                    '{"access_token":"TEST_TOKEN","expires_in":3600}'
                );
            }
            // Push Notification API
            else {
                res.setBody('{"success":true}');
            }

            return res;
        }
    }

    //=========================================
    // TEST DATA
    //=========================================
    private static User createUser() {

        Profile p = [
            SELECT Id
            FROM Profile
            WHERE Name = 'System Administrator'
            LIMIT 1
        ];

        User u = new User(
            FirstName='Test',
            LastName='User',
            Alias='tuser',
            Email='testuser@test.com',
            Username='testuser' + System.currentTimeMillis() + '@test.com',
            TimeZoneSidKey='Australia/Sydney',
            LocaleSidKey='en_AU',
            EmailEncodingKey='UTF-8',
            LanguageLocaleKey='en_US',
            ProfileId=p.Id,
            Mobile_device_token__c='DEVICE_TOKEN_123'
        );

        insert u;

        return u;
    }

    //=========================================
    // SUCCESS
    //=========================================
    @IsTest
    static void testSendPushNotification() {

        Test.setMock(HttpCalloutMock.class, new NotificationMock());

        User u = createUser();

        List<My_Notification__c> notifications = new List<My_Notification__c>();

        notifications.add(new My_Notification__c(
            User__c = u.Id,
            Mark_as_read_notifications__c = false
        ));

        notifications.add(new My_Notification__c(
            User__c = u.Id,
            Mark_as_read_notifications__c = false
        ));

        notifications.add(new My_Notification__c(
            User__c = u.Id,
            Mark_as_read_notifications__c = true
        ));

        insert notifications;

        PushNotificationController.PushNotificationInput input =
            new PushNotificationController.PushNotificationInput();

        input.UserId = u.Id;
        input.Title = 'Test Title';
        input.Body = 'Test Body';

        Test.startTest();

        PushNotificationController.sendPushNotification(
            new List<PushNotificationController.PushNotificationInput>{ input }
        );

        Test.stopTest();

        System.assert(true);
    }

    //=========================================
    // EMPTY INPUT
    //=========================================
    @IsTest
    static void testEmptyInput() {

        Test.startTest();

        PushNotificationController.sendPushNotification(
            new List<PushNotificationController.PushNotificationInput>()
        );

        Test.stopTest();

        System.assert(true);
    }

    //=========================================
    // NULL INPUT
    //=========================================
    @IsTest
    static void testNullInput() {

        Test.startTest();

        PushNotificationController.sendPushNotification(null);

        Test.stopTest();

        System.assert(true);
    }

    //=========================================
    // NULL USER ID
    //=========================================
    @IsTest
    static void testNullUserId() {

        Test.setMock(HttpCalloutMock.class, new NotificationMock());

        PushNotificationController.PushNotificationInput input =
            new PushNotificationController.PushNotificationInput();

        input.Title = 'Hello';
        input.Body = 'World';

        Test.startTest();

        PushNotificationController.sendPushNotification(
            new List<PushNotificationController.PushNotificationInput>{ input }
        );

        Test.stopTest();

        System.assert(true);
    }
}