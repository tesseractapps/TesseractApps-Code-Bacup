@RestResource(urlMapping='/MyNotificationsApi/*')
global with sharing class MyNotificationApi {
    
    @HttpGet
    global static void getUserNotifications() {
        RestResponse res = RestContext.response;
        Map<String, Object> responseMap = new Map<String, Object>();
        
        try {
            Id currentUserId = UserInfo.getUserId();
            
            // Read query parameter (count=true/false)
            RestRequest req = RestContext.request;
            String countParam = req.params.get('count');
            Boolean isCountOnly = (countParam != null && countParam.toLowerCase() == 'true');
            
            // Count only UNREAD notifications
            /*Integer notificationCount = [
                SELECT COUNT() 
                FROM My_Notification__c 
                WHERE User__c = :currentUserId
                AND Mark_as_read_notifications__c = false
            ];*/
            
            List<My_Notification__c> notificationList = [
                SELECT Id, Name, CreatedDate, Mark_as_read_notifications__c
                FROM My_Notification__c
                WHERE User__c = :currentUserId 
                ORDER BY CreatedDate DESC
                LIMIT 20
            ];
            
            // Step 2: Count only those with Mark_as_read_notifications__c = false from this list
            Integer unreadCount = 0;
            for (My_Notification__c notif : notificationList) {
                if (notif.Mark_as_read_notifications__c == false) {
                    unreadCount++;
                }
            }       
            

            if (isCountOnly) {
                // Return only the count
                responseMap.put('isSuccess', true);
                responseMap.put('message', 'Unread notification count fetched successfully');
                responseMap.put('count', unreadCount);
                
            } else {
                // Fetch full notifications
                List<My_Notification__c> notifications = [
                    SELECT Id, Subject__c, Description__c, CreatedDate, Mark_as_read_notifications__c
                    FROM My_Notification__c
                    WHERE User__c = :currentUserId
                    ORDER BY CreatedDate DESC 
                    LIMIT 20
                ];
                
                // Wrap notifications
                List<NotificationWrapper> notificationWrapperList = new List<NotificationWrapper>();
                for (My_Notification__c n : notifications) {
                    NotificationWrapper nw = new NotificationWrapper();
                    nw.notificationId = n.Id;
                    nw.subject = n.Subject__c;
                    nw.description = n.Description__c;
                    nw.createdDate = n.CreatedDate.format('yyyy-MM-dd HH:mm:ss');
                    nw.markHasRead = n.Mark_as_read_notifications__c;
                    notificationWrapperList.add(nw);
                }
                
                // Success response with notifications + unread count
                responseMap.put('isSuccess', true);
                responseMap.put('message', 'My notifications fetched successfully');
                responseMap.put('unreadCount', unreadCount);
                responseMap.put('notifications', notificationWrapperList);
            }
            
            res.statusCode = 200;
            
        } catch (Exception e) {
            // Error response
            responseMap.put('isSuccess', false);
            responseMap.put('message', 'Error fetching my notifications');
            responseMap.put('error', e.getMessage());
            res.statusCode = 500;
        }
        
        // Send response
        res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
    } 
    
    // Wrapper class for response
    global class NotificationWrapper {
        public Id notificationId { get; set; }
        public String subject { get; set; }
        public String description { get; set; }
        public String createdDate { get; set; }
        public Boolean markHasRead {get; set;}
    }
    
    global class NotificationRequest {
        public List<Id> notificationIds;
    }

    @HttpPost
    global static void markNotificationAsRead() {
        RestResponse res = RestContext.response;
        Map<String, Object> responseMap = new Map<String, Object>();

        try {
            // Read the request
            RestRequest req = RestContext.request;
            String requestBody = req.requestBody.toString();
            System.debug('Incoming Request Body: ' + requestBody);

            // Validate empty body
            if (String.isBlank(requestBody)) {
                responseMap.put('success', false);
                responseMap.put('message', 'Error: Request body cannot be empty.');
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }

            // Deserialize JSON into wrapper
            NotificationRequest notifRequest = 
                (NotificationRequest)JSON.deserialize(requestBody, NotificationRequest.class);

            // Validate required field
            if (notifRequest.notificationIds == null || notifRequest.notificationIds.isEmpty()) {
                responseMap.put('success', false);
                responseMap.put('message', 'Error: notificationIds are required.');
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }

            // Query notifications
            List<My_Notification__c> notifList = [
                SELECT Id, Mark_as_read_notifications__c 
                FROM My_Notification__c 
                WHERE Id IN :notifRequest.notificationIds
            ];

            if (notifList.isEmpty()) {
                responseMap.put('success', false);
                responseMap.put('message', 'No matching notifications found.');
                res.statusCode = 404;
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }

            // Mark as read
            for (My_Notification__c notif : notifList) {
                notif.Mark_as_read_notifications__c = true;
            }
            update notifList;

            // Success response
            responseMap.put('success', true);
            responseMap.put('message', 'Notifications marked as read successfully');
            responseMap.put('updatedCount', notifList.size());
            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));

        } catch (Exception e) {
            responseMap.put('success', false);
            responseMap.put('message', 'Error processing request: ' + e.getMessage());
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
        }
    }
}