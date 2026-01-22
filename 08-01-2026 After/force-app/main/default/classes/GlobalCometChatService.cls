@RestResource(urlMapping='/cometchat/globalWebhook/*')
global without sharing class GlobalCometChatService {

    /* ----------------------------------------------------------
       SECTION 1: DTO for LWC (CometChat credentials)
       ---------------------------------------------------------- */
    global class CometChatCredentials {
        @AuraEnabled global String appId;
        @AuraEnabled global String region;
        @AuraEnabled global String authKey;
        @AuraEnabled global String restApiKey;
        @AuraEnabled global String userUID;
        @AuraEnabled global String userName;
    }

    /* ----------------------------------------------------------
       SECTION 2: LWC METHOD → Get CometChat credentials
       Called from LWC when global user selects an Organisation.
       ---------------------------------------------------------- */
    @AuraEnabled(cacheable=false)
    global static CometChatCredentials getCredentials(Id organisationId) {

        // Current Salesforce user – expected to be Support / Accountant
        User u = [
            SELECT Id, Name, CometChat_UID__c, User_Type__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        if (String.isBlank(u.CometChat_UID__c)) {
            throw new AuraHandledException('CometChat UID (CometChat_UID__c) is not set for this user.');
        }

        // Organisation record which holds the CometChat App config
        Organisation__c orgRecord = [
            SELECT Id, Name,
                   CometChat_App_ID__c,
                   CometChat_Region__c,
                   CometChat_AuthKey__c,
                   CometChat_REST_API_Key__c
            FROM Organisation__c
            WHERE Id = :organisationId
            LIMIT 1
        ];

        CometChatCredentials c = new CometChatCredentials();
        c.appId      = orgRecord.CometChat_App_ID__c;
        c.region     = orgRecord.CometChat_Region__c;
        c.authKey    = orgRecord.CometChat_AuthKey__c;
        c.restApiKey = orgRecord.CometChat_REST_API_Key__c;
        c.userUID    = u.CometChat_UID__c;   // e.g. SUPPORT_GLOBAL / ACCOUNTANT_GLOBAL
        c.userName   = u.Name;

        return c;
    }




@HttpPost
global static void handleWebhook() {
    System.debug('*** CometChat webhook hit – INSERT THEN UPDATE ***');

    RestRequest req = RestContext.request;
    String rawBody = req.requestBody.toString();

    // ----------------------------------------------------
    // 0) Fallback user & org so we can ALWAYS insert a row
    // ----------------------------------------------------
    User fallbackUser;
    Organisation__c fallbackOrg;

    try {
        fallbackUser = [
            SELECT Id, Name
            FROM User
            WHERE IsActive = true
            ORDER BY CreatedDate ASC
            LIMIT 1
        ];
        fallbackOrg = [
            SELECT Id, Name
            FROM Organisation__c
            ORDER BY CreatedDate ASC
            LIMIT 1
        ];
    } catch (Exception e) {
        // If we can't even get fallback records, just bail
        System.debug('EXIT: No fallback user/org available: ' + e.getMessage());
        return;
    }

    // Insert notification immediately with fallback values
    CometChat_Notification__c notif = new CometChat_Notification__c(
        GlobalUser__c      = fallbackUser.Id,
        Organisation__c    = fallbackOrg.Id,
        SenderUser__c      = fallbackUser.Id,
        UnreadCount__c     = 0,
        LastMessage__c     = 'INIT',
        LastMessageTime__c = System.now()
    );
    insert notif; // we will UPDATE this record later
    System.debug('Inserted placeholder notif: ' + notif.Id);

    // ----------------------------------------------------
    // 1) Variables for diagnostics & mapping
    // ----------------------------------------------------
    String exitCode      = 'START';
    String triggerName   = null;
    String appId         = null;
    String receiverType  = null;
    String senderUid     = null;
    String receiverUid   = null;
    String msgText       = null;

    Boolean rootParsed   = false;
    Boolean dataFound    = false;
    Boolean messageFound = false;
    Boolean globalFound  = false;
    Boolean orgFound     = false;
    Boolean senderFound  = false;

    Id globalUserId  = fallbackUser.Id;
    Id orgId         = fallbackOrg.Id;
    Id senderUserId  = fallbackUser.Id;

    try {
        // ---------------------------
        // 2) Parse JSON root
        // ---------------------------
        Map<String, Object> root = (Map<String, Object>) JSON.deserializeUntyped(rawBody);
        if (root == null) {
            exitCode = 'ROOT_NULL';
        } else {
            rootParsed = true;

            // trigger
            triggerName = (String) root.get('trigger');

            // appId: query param first, body fallback
            appId = req.params.get('appId');
            if (String.isBlank(appId) && root.containsKey('appId')) {
                appId = (String) root.get('appId');
            }

            if (String.isBlank(appId) && exitCode == 'START') {
                exitCode = 'APPID_MISSING';
            }

            // 3) root.data.message
            Map<String, Object> dataWrapper = (Map<String, Object>) root.get('data');
            if (dataWrapper == null && exitCode == 'START') {
                exitCode = 'DATA_WRAPPER_NULL';
            } else if (dataWrapper != null) {
                dataFound = true;
                Map<String, Object> message = (Map<String, Object>) dataWrapper.get('message');
                if (message == null && exitCode == 'START') {
                    exitCode = 'MESSAGE_NULL';
                } else if (message != null) {
                    messageFound = true;

                    receiverType = (String) message.get('receiverType');
                    senderUid    = (String) message.get('sender');
                    receiverUid  = (String) message.get('receiver');

                    // ************** NEW BLOCK: filter by Custom Label UIDs **************
                    if (!String.isBlank(receiverUid)) {
                        Set<String> allowedGlobalUids = new Set<String>();
                        try {
                            String labelJson = System.Label.CometChat_GlobalUIDs;
                            if (!String.isBlank(labelJson)) {
                                List<Object> uidList = (List<Object>) JSON.deserializeUntyped(labelJson);
                                for (Object o : uidList) {
                                    if (o != null) {
                                        allowedGlobalUids.add(String.valueOf(o).toLowerCase());
                                    }
                                }
                            }
                        } catch (Exception le) {
                            System.debug('Error parsing CometChat_GlobalUIDs label: ' + le.getMessage());
                        }

                        String receiverLower = receiverUid.toLowerCase();
                        if (!allowedGlobalUids.isEmpty() && !allowedGlobalUids.contains(receiverLower)) {
                            exitCode = 'NOT_GLOBAL_UID';
                            System.debug('EXIT: receiverUid not in allowed global UIDs, deleting placeholder. receiverUid=' + receiverUid);
                            try {
                                delete notif;
                            } catch (Exception de) {
                                System.debug('Delete failed for placeholder notif: ' + de.getMessage());
                            }
                            return;
                        }
                    }
                    // ************** END NEW BLOCK **************

                    Map<String, Object> msgData = (Map<String, Object>) message.get('data');
                    if (msgData != null) {
                        msgText = (String) msgData.get('text');
                    }

                    if (receiverType != 'user' && exitCode == 'START') {
                        exitCode = 'RECEIVER_NOT_USER';
                    }

                    if ((String.isBlank(senderUid) || String.isBlank(receiverUid))
                        && exitCode == 'START') {
                        exitCode = 'UIDS_BLANK';
                    }
                }
            }

            // 4) Try real lookups only if we have values
            // Global user (receiver)
            if (!String.isBlank(receiverUid)) {
                List<User> globalUsers = [
                    SELECT Id, CometChat_UID__c
                    FROM User
                    WHERE CometChat_UID__c = :receiverUid
                    LIMIT 1
                ];
                if (!globalUsers.isEmpty()) {
                    globalFound  = true;
                    globalUserId = globalUsers[0].Id;
                } else if (exitCode == 'START') {
                    exitCode = 'NO_GLOBAL_USER';
                }
            }

            // Organisation by appId
            if (!String.isBlank(appId)) {
                List<Organisation__c> orgs = [
                    SELECT Id
                    FROM Organisation__c
                    WHERE CometChat_App_ID__c = :appId
                    LIMIT 1
                ];
                if (!orgs.isEmpty()) {
                    orgFound = true;
                    orgId    = orgs[0].Id;
                } else if (exitCode == 'START') {
                    exitCode = 'NO_ORG';
                }
            }

            // Sender user
            if (!String.isBlank(senderUid)) {
                List<User> senderList = [
                    SELECT Id, CometChat_UID__c
                    FROM User
                    WHERE CometChat_UID__c = :senderUid
                    LIMIT 1
                ];
                if (!senderList.isEmpty()) {
                    senderFound  = true;
                    senderUserId = senderList[0].Id;
                } else if (exitCode == 'START') {
                    exitCode = 'NO_SENDER_USER';
                }
            }

            // If everything went well and no failure code yet:
            if (exitCode == 'START'
                && rootParsed && dataFound && messageFound
                && globalFound && orgFound && senderFound) {
                exitCode = 'SUCCESS';
            }
        }
    } catch (Exception e) {
        exitCode = 'EXCEPTION: ' + e.getMessage();
    }

    // ----------------------------------------------------
    // 3) Build debug info & UPDATE the same notif record
    // ----------------------------------------------------
    String debugInfo =
        '{'
        + '"exitCode":"'        + String.valueOf(exitCode)        + '",'
        + '"appId":"'           + String.valueOf(appId)           + '",'
        + '"trigger":"'         + String.valueOf(triggerName)     + '",'
        + '"receiverType":"'    + String.valueOf(receiverType)    + '",'
        + '"senderUid":"'       + String.valueOf(senderUid)       + '",'
        + '"receiverUid":"'     + String.valueOf(receiverUid)     + '",'
        + '"msgText":"'         + String.valueOf(msgText)         + '",'
        + '"rootParsed":'       + String.valueOf(rootParsed)      + ','
        + '"dataFound":'        + String.valueOf(dataFound)       + ','
        + '"messageFound":'     + String.valueOf(messageFound)    + ','
        + '"globalFound":'      + String.valueOf(globalFound)     + ','
        + '"orgFound":'         + String.valueOf(orgFound)        + ','
        + '"senderFound":'      + String.valueOf(senderFound)     + ','
        + '"rawBody":"'         + String.valueOf(rawBody).left(500).replace('"','\'') + '"'
        + '}';

    notif.GlobalUser__c      = globalUserId;
    notif.Organisation__c    = orgId;
    notif.SenderUser__c      = senderUserId;
    notif.UnreadCount__c     = 1;
    // notif.LastMessage__c     = debugInfo;
    notif.LastMessage__c     = String.isBlank(msgText) ? '' : msgText;
    notif.LastMessageTime__c = System.now();

    update notif;
    System.debug('Updated notif ' + notif.Id + ' with exitCode=' + exitCode);
}









    global static void createOrUpdateNotification(
        Id globalUserId,
        Id organisationId,
        Id senderUserId,
        String lastMessage
    ) {
        // We can't query on Key__c if it's a Text Area, so we use the 3 lookups
        List<CometChat_Notification__c> existing = [
            SELECT Id, UnreadCount__c
            FROM CometChat_Notification__c
            WHERE GlobalUser__c = :globalUserId
              AND Organisation__c = :organisationId
              AND SenderUser__c = :senderUserId
            LIMIT 1
        ];

        CometChat_Notification__c notif;
        if (existing.isEmpty()) {
            notif = new CometChat_Notification__c();
            notif.GlobalUser__c   = globalUserId;
            notif.Organisation__c = organisationId;
            notif.SenderUser__c   = senderUserId;
            notif.UnreadCount__c  = 1;

            // Optional: still store a human-readable key
            notif.Key__c = globalUserId + '|' + organisationId + '|' + senderUserId;

            notif.LastMessage__c     = lastMessage;
            notif.LastMessageTime__c = System.now();
            insert notif;
        } else {
            notif = existing[0];
            notif.UnreadCount__c = (notif.UnreadCount__c == null ? 0 : notif.UnreadCount__c) + 1;
            notif.LastMessage__c     = lastMessage;
            notif.LastMessageTime__c = System.now();
            update notif;
        }
    }
    
// Inside GlobalCometChatService.cls
global class NotificationPage {
    @AuraEnabled public List<NotificationRow> records { get; set; }
    @AuraEnabled public Integer totalRecords { get; set; }
}

global class NotificationRow {
    @AuraEnabled public Id senderUserId { get; set; }
    @AuraEnabled public String senderName { get; set; }
    @AuraEnabled public String senderCometChatUid { get; set; }

    @AuraEnabled public Id organisationId { get; set; }
    @AuraEnabled public String organisationName { get; set; }

    @AuraEnabled public Integer unreadCount { get; set; }
    @AuraEnabled public Datetime lastMessageTime { get; set; }
    @AuraEnabled public String lastMessageTimeFormatted { get; set; }
}

@AuraEnabled
global static NotificationPage getMyNotifications(Integer pageSize, Integer pageNumber) {
    if (pageSize == null || pageSize <= 0) pageSize = 10;
    if (pageNumber == null || pageNumber <= 0) pageNumber = 1;

    Id me = UserInfo.getUserId();
    Integer offsetRows = (pageNumber - 1) * pageSize;

    // Total number of unique senders (for pagination)
    AggregateResult totalAr = [
        SELECT COUNT_DISTINCT(SenderUser__c) cnt
        FROM CometChat_Notification__c
        WHERE GlobalUser__c = :me
    ];

    Decimal totalCntDec = (Decimal) totalAr.get('cnt');
    Integer totalUniqueSenders = (totalCntDec == null) ? 0 : totalCntDec.intValue();

    // Grouped page: 1 row per sender
    List<AggregateResult> grouped = [
        SELECT
            SenderUser__c senderId,
            SUM(UnreadCount__c) unreadSum,
            MAX(LastMessageTime__c) lastTime
        FROM CometChat_Notification__c
        WHERE GlobalUser__c = :me
        GROUP BY SenderUser__c
        ORDER BY MAX(LastMessageTime__c) DESC
        LIMIT :pageSize
        OFFSET :offsetRows
    ];

    Set<Id> senderIds = new Set<Id>();
    for (AggregateResult ar : grouped) {
        senderIds.add((Id) ar.get('senderId'));
    }

    // Fetch sender details
    Map<Id, User> senderMap = new Map<Id, User>();
    if (!senderIds.isEmpty()) {
        senderMap = new Map<Id, User>([
            SELECT Id, Name, CometChat_UID__c
            FROM User
            WHERE Id IN :senderIds
        ]);
    }

    // Fetch latest notification per sender to get Organisation info
    Map<Id, CometChat_Notification__c> latestBySender = new Map<Id, CometChat_Notification__c>();
    if (!senderIds.isEmpty()) {
        List<CometChat_Notification__c> candidates = [
            SELECT SenderUser__c,
                   Organisation__c,
                   Organisation__r.Name,
                   LastMessageTime__c
            FROM CometChat_Notification__c
            WHERE GlobalUser__c = :me
              AND SenderUser__c IN :senderIds
            ORDER BY SenderUser__c, LastMessageTime__c DESC
        ];

        for (CometChat_Notification__c n : candidates) {
            if (!latestBySender.containsKey(n.SenderUser__c)) {
                latestBySender.put(n.SenderUser__c, n);
            }
        }
    }

    // Build response
    List<NotificationRow> outRows = new List<NotificationRow>();
    for (AggregateResult ar : grouped) {
        Id senderId = (Id) ar.get('senderId');

        Decimal unreadDec = (Decimal) ar.get('unreadSum');
        Integer unreadSum = (unreadDec == null) ? 0 : unreadDec.intValue();

        Datetime lastTime = (Datetime) ar.get('lastTime');

        User u = senderMap.get(senderId);
        CometChat_Notification__c latest = latestBySender.get(senderId);

        NotificationRow row = new NotificationRow();
        row.senderUserId = senderId;
        row.senderName = (u != null) ? u.Name : null;
        row.senderCometChatUid = (u != null) ? u.CometChat_UID__c : null;

        row.organisationId = (latest != null) ? latest.Organisation__c : null;
        row.organisationName = (latest != null && latest.Organisation__r != null) ? latest.Organisation__r.Name : null;

        row.unreadCount = unreadSum;
        row.lastMessageTime = lastTime;
        row.lastMessageTimeFormatted = (lastTime == null)
        ? null
        : lastTime.format('dd/MM/yyyy, hh:mm a');

        outRows.add(row);
    }

    NotificationPage result = new NotificationPage();
    result.records = outRows;
    result.totalRecords = totalUniqueSenders;
    return result;
}



@AuraEnabled
global static void clearNotificationsForSender(Id senderUserId, Id organisationId) {
    if (senderUserId == null) return;

    Id me = UserInfo.getUserId();
    List<CometChat_Notification__c> rows;

    if (organisationId == null) {
        rows = [
            SELECT Id, UnreadCount__c
            FROM CometChat_Notification__c
            WHERE GlobalUser__c = :me
              AND SenderUser__c = :senderUserId
        ];
    } else {
        rows = [
            SELECT Id, UnreadCount__c
            FROM CometChat_Notification__c
            WHERE GlobalUser__c = :me
              AND SenderUser__c = :senderUserId
              AND Organisation__c = :organisationId
        ];
    }

    if (rows.isEmpty()) return;

    for (CometChat_Notification__c n : rows) {
        n.UnreadCount__c = 0;
    }
    update rows;
}


    
@AuraEnabled(cacheable=true)
global static List<Organisation__c> getAllOrganisations() {
    return [
        SELECT Id,
               Name,
               CometChat_App_ID__c,
               CometChat_Region__c,
               CometChat_AuthKey__c,
               CometChat_REST_API_Key__c
        FROM Organisation__c
        WHERE CometChat_App_ID__c != NULL
        ORDER BY Name
    ];
}



}