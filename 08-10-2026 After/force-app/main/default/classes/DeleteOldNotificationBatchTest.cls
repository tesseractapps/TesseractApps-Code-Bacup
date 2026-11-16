@IsTest
public class DeleteOldNotificationBatchTest {

    @TestSetup
    static void setupData() {

        // Old notification
        My_Notification__c oldNotification = new My_Notification__c();
        insert oldNotification;

        // Make the record older than one month
        Test.setCreatedDate(
            oldNotification.Id,
            System.now().addMonths(-2)
        );

        // Recent notification
        My_Notification__c recentNotification = new My_Notification__c();
        insert recentNotification;
    }

    @IsTest
    static void testDeleteOldNotifications() {

        // Get the oldest notification
        My_Notification__c oldNotification = [
            SELECT Id, CreatedDate
            FROM My_Notification__c
            ORDER BY CreatedDate ASC
            LIMIT 1
        ];

        // Get the most recent notification
        My_Notification__c recentNotification = [
            SELECT Id, CreatedDate
            FROM My_Notification__c
            ORDER BY CreatedDate DESC
            LIMIT 1
        ];

        // Verify old notification is older than one month
        System.assert(
            oldNotification.CreatedDate < System.now().addMonths(-1),
            'Old notification should be older than one month.'
        );

        // Verify recent notification is within one month
        System.assert(
            recentNotification.CreatedDate >= System.now().addMonths(-1),
            'Recent notification should be within one month.'
        );

        Test.startTest();

        Database.executeBatch(
            new DeleteOldNotificationBatch(),
            200
        );

        Test.stopTest();

        // Verify old notification was deleted
        Integer oldCount = [
            SELECT COUNT()
            FROM My_Notification__c
            WHERE Id = :oldNotification.Id
        ];

        System.assertEquals(
            0,
            oldCount,
            'Old notification should have been deleted.'
        );

        // Verify recent notification still exists
        Integer recentCount = [
            SELECT COUNT()
            FROM My_Notification__c
            WHERE Id = :recentNotification.Id
        ];

        System.assertEquals(
            1,
            recentCount,
            'Recent notification should not have been deleted.'
        );
    }
}