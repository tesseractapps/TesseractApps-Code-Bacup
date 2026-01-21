public with sharing class MyNotificationController {
    
    @AuraEnabled
    public static List<My_Notification__c> getUserNotifications() {
        Id currentUserId = UserInfo.getUserId();
        
        return [
            SELECT Id, Subject__c, Description__c, CreatedDate,Mark_as_read_notifications__c ,Participant_Id__c
            FROM My_Notification__c
            WHERE User__c = :currentUserId
            ORDER BY CreatedDate DESC 
            LIMIT 20
        ];
    }
    
    @AuraEnabled
    public static Integer getUserNotificationscount() {
        Id currentUserId = UserInfo.getUserId();
        
        List<My_Notification__c> latestNotifications = [
            SELECT Id, Mark_as_read_notifications__c
            FROM My_Notification__c
            WHERE User__c = :currentUserId
            ORDER BY CreatedDate DESC
            LIMIT 20
        ];
        
        Integer unreadCount = 0;
        for (My_Notification__c n : latestNotifications) {
            if (!n.Mark_as_read_notifications__c) {
                unreadCount++;
            }
        }
        
        return unreadCount;
    }
    
    
    @AuraEnabled
    public static void markNotificationAsRead(List<Id> notificationIds) {
        system.debug('notificationIds >>'+ notificationIds);
        if (notificationIds == null || notificationIds.isEmpty()) return;
        
        List<My_Notification__c> notifList = [
            SELECT Id, Mark_as_read_notifications__c 
            FROM My_Notification__c 
            WHERE Id IN :notificationIds
        ];
        
        for (My_Notification__c notif : notifList) {
            notif.Mark_as_read_notifications__c = true;
        }
        update notifList;
    }
     
}