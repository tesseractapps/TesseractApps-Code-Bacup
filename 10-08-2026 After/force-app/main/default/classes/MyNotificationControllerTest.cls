@isTest
public class MyNotificationControllerTest {
     @isTest
    static void testGetUserNotifications() {
        // Step 1: Get the current user's Id
        Id currentUserId = UserInfo.getUserId();

        // Step 2: Create test notification records for the current user
        List<My_Notification__c> notifications = new List<My_Notification__c>();
        for (Integer i = 1; i <= 5; i++) {
            notifications.add(new My_Notification__c(
                Subject__c = 'Test Subject ' + i,
                Description__c = 'Test Description ' + i,
                User__c = currentUserId,
                Mark_as_read_notifications__c = false
            ));
        }
        insert notifications;
        
        // Step 3: Collect IDs to pass to the method
        List<Id> notifIds = new List<Id>();
        for (My_Notification__c notif : notifications) {
            notifIds.add(notif.Id);
        }

        // Step 3: Call the method being tested
        Test.startTest();
        List<My_Notification__c> results = MyNotificationController.getUserNotifications();
        Integer testGetUserNotificationsCount = MyNotificationController.getUserNotificationscount();
        Integer testGetUserNotificationsCountWhenNoneExist = MyNotificationController.getUserNotificationscount();
        MyNotificationController.markNotificationAsRead(notifIds);
        Test.stopTest();
    }
}