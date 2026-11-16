public with sharing class PushNotificationController {

    public class PushNotificationInput {

        @InvocableVariable
        public Id UserId;

        @InvocableVariable(required=true)
        public String Title;

        @InvocableVariable(required=true)
        public String Body;
    }

    @InvocableMethod(label='Send Push Notification')
    public static void sendPushNotification(List<PushNotificationInput> inputs) {

        if (inputs == null || inputs.isEmpty()) {
            return;
        }

        // Generate Bearer Token once
        String bearerToken = NotificationInvoker.generateBearerToken();

        if (String.isBlank(bearerToken)) {
            System.debug('Bearer token generation failed.');
            return;
        }

        // Collect User Ids
        Set<Id> userIds = new Set<Id>();

        for (PushNotificationInput input : inputs) {
            if (input.UserId != null) {
                userIds.add(input.UserId);
            }
        }

        if (userIds.isEmpty()) {
            return;
        }

        // Query Users with Device Tokens and Notifications
        Map<Id, User> userMap = new Map<Id, User>([
            SELECT Id,
                   Mobile_device_token__c,
                   (
                       SELECT Id,
                              Mark_as_read_notifications__c
                       FROM My_Notifications__r
                       ORDER BY CreatedDate DESC
                       LIMIT 20
                   )
            FROM User
            WHERE Id IN :userIds
            AND Mobile_device_token__c != null
        ]);

        // Send Push Notifications
        for (PushNotificationInput input : inputs) {

            if (input == null || input.UserId == null) {
                System.debug('Skipping push notification because UserId is null.');
                continue;
            }

            User u = userMap.get(input.UserId);

            if (u == null) {
                continue;
            }

            Integer unread = 0;

            if (u.My_Notifications__r != null) {
                for (My_Notification__c notification : u.My_Notifications__r) {
                    if (!notification.Mark_as_read_notifications__c) {
                        unread++;
                    }
                }
            }

            NotificationInvoker.sendPushNotification(
                bearerToken,
                u.Mobile_device_token__c,
                input.Body,
                input.Title,
                unread
            );
        }
    }
}