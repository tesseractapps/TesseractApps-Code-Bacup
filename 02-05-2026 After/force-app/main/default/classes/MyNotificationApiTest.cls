@isTest
public class MyNotificationApiTest {
    
    @testSetup
    static void setupTestData() {
        // Create test user
        Profile p = [SELECT Id FROM Profile WHERE Name = 'System Administrator' LIMIT 1];
       User user = new User(Alias = 'praveen', Email= 'manualtesting.20294637@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne209463', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = p.Id, TimeZoneSidKey='America/New_York', 
                             User_Type__c='NDIS Org Admin', UserName='manualtesting.20294637@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        insert user;

        // Create My_Notification__c test record
        My_Notification__c notification = new My_Notification__c(
            Subject__c = 'Test Subject',
            Description__c = 'Test Description',
            User__c = user.Id,
            Mark_as_read_notifications__c = false
        );
        insert notification;
    }

    @isTest
    static void testGetUserNotificationsCountOnly() {
        User testUser = [SELECT Id FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];

        System.runAs(testUser) {
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestUri = '/services/apexrest/MyNotificationsApi/';
            req.params.put('count', 'true');
            RestContext.request = req;
            RestContext.response = res;

            MyNotificationApi.getUserNotifications();

            System.assertEquals(200, RestContext.response.statusCode);
            String responseBody = RestContext.response.responseBody.toString();
            System.assert(responseBody.contains('Unread notification count fetched successfully'));
        }
    }

    @isTest
    static void testGetUserNotificationsFullList() {
        User testUser = [SELECT Id FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];

        System.runAs(testUser) {
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestUri = '/services/apexrest/MyNotificationsApi/';
            RestContext.request = req;
            RestContext.response = res;

            MyNotificationApi.getUserNotifications();

            System.assertEquals(200, RestContext.response.statusCode);
            String responseBody = RestContext.response.responseBody.toString();
            System.assert(responseBody.contains('My notifications fetched successfully'));
            System.assert(responseBody.contains('Test Subject'));
            System.assert(responseBody.contains('Test Description'));
        }
    }

    @isTest
    static void testMarkNotificationAsRead() {
        User testUser = [SELECT Id FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        My_Notification__c notif = [SELECT Id, Mark_as_read_notifications__c FROM My_Notification__c LIMIT 1];

        System.runAs(testUser) {
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestUri = '/services/apexrest/MyNotificationsApi/';
            
            String requestBody = JSON.serialize(new Map<String, Object>{
                'notificationIds' => new List<Id>{notif.Id}
            });

            req.requestBody = Blob.valueOf(requestBody);
            RestContext.request = req;
            RestContext.response = res;

            MyNotificationApi.markNotificationAsRead();

            System.assertEquals(200, RestContext.response.statusCode);

            My_Notification__c updatedNotif = [SELECT Mark_as_read_notifications__c FROM My_Notification__c WHERE Id = :notif.Id];
            System.assertEquals(true, updatedNotif.Mark_as_read_notifications__c);
        }
    }

    @isTest
    static void testMarkNotificationAsReadEmptyBody() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestUri = '/services/apexrest/MyNotificationsApi/';
        req.requestBody = Blob.valueOf('');
        RestContext.request = req;
        RestContext.response = res;

        MyNotificationApi.markNotificationAsRead();
    }

  /*  @isTest
    static void testMarkNotificationAsReadInvalidNotificationIds() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestUri = '/services/apexrest/MyNotificationsApi/';

        String requestBody = JSON.serialize(new Map<String, Object>{
            'notificationIds' => new List<Id>{'a0123456789ABCDE'}  // Nonexistent ID
        });

        req.requestBody = Blob.valueOf(requestBody);
        RestContext.request = req;
        RestContext.response = res;

        MyNotificationApi.markNotificationAsRead();
    } */
}