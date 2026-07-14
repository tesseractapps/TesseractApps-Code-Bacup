@RestResource(urlMapping='/cometchat/test')
global without sharing class CometChatTestAPI {

    @HttpPost
    global static String createTestRecord() {

        System.debug('*** TEST API HIT ***');

        RestRequest req = RestContext.request;
        String body = req.requestBody.toString();

        // Parse JSON safely
        Map<String, Object> data = (Map<String, Object>) JSON.deserializeUntyped(body);

        String message = (String) data.get('message');

        // Create record (NO User dependency)
        CometChat_Notification__c notif = new CometChat_Notification__c();

        notif.LastMessage__c     = message;
        notif.UnreadCount__c    = 1;
        notif.LastMessageTime__c = System.now();

        insert notif;

        return 'SUCCESS: ' + notif.Id;
    }
}