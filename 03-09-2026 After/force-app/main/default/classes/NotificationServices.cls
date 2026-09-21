public with sharing class NotificationServices {

    public static void sendNotification(
        Id userId,
        String title,
        String message,
        String moduleName,
        String type,
        Id recordId,
        Id facilityId// updated manendra
    ) {

        try {

            // Create Notification Record

            Notifications__c notification = new Notifications__c();

            notification.User__c = userId;
            notification.Title__c = title;
            notification.Message__c = message;
            notification.Module__c = moduleName;
            notification.Type__c = type;
            notification.Record_Id__c = String.valueOf(recordId);
            notification.Is_Read__c = false;
            notification.Facility__c = facilityId; // updated manendra

            insert notification;

            // Publish Platform Event
            String facilityName = '';
            if (facilityId != null) {
                facilityName = [
                    SELECT Name
                    FROM Facility__c
                    WHERE Id = :facilityId
                    LIMIT 1
                ].Name;
            }

            Notification_Event__e eventObj = new Notification_Event__e(

                User_Id__c = String.valueOf(userId),
                Title__c = title,
                Message__c = message,
                Module__c = moduleName,
                Type__c = type,
                Record_Id__c = String.valueOf(recordId),
                Facility_Name__c = facilityName

            );

            EventBus.publish(eventObj);

        } catch (Exception e) {

            System.debug('Notification Error : ' + e.getMessage());

        }
    }

    /*     @AuraEnabled(cacheable=true)
    public static List<Notifications__c> getUserNotifications() {

        return [

            SELECT Id,
                Title__c,
                Message__c,
                Is_Read__c,
                CreatedDate
            FROM Notifications__c
            WHERE User__c = :UserInfo.getUserId()
            ORDER BY CreatedDate DESC
            LIMIT 20
        ];
    } */

    @AuraEnabled(cacheable=true)
    public static List<Notifications__c> getUserNotifications() {

        User currentUser = [

            SELECT Id,Email FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1 ];

        List<Staff__c> staffList = [ SELECT Id FROM Staff__c WHERE Email_Address__c = :currentUser.Email LIMIT 1];

        if (staffList.isEmpty()) {

            return new List<Notifications__c>();
        }

        Id loggedInStaffId =
            staffList[0].Id;

        return [

            SELECT Id,
                Title__c,
                Message__c,
                Module__c,
                Type__c,
                Record_Id__c,
                Is_Read__c,
                CreatedDate,Facility__c,Facility__r.Name
           
            FROM Notifications__c

            WHERE Staff__c =
                :loggedInStaffId
            AND Is_Read__c = false
            ORDER BY CreatedDate DESC
        ];
    }

    @AuraEnabled
    public static String getSessionId() {

        return UserInfo.getSessionId();

    }

    @AuraEnabled(cacheable=true)
    public static Id getLoggedInStaffId() {

        // =====================================================
        // 1. Get Logged-in User
        // =====================================================

        User currentUser = [

            SELECT Id,
                Email

            FROM User

            WHERE Id = :UserInfo.getUserId()

            LIMIT 1
        ];

        // =====================================================
        // 2. Find Related Staff Record
        // =====================================================

        List<Staff__c> staffList = [

            SELECT Id

            FROM Staff__c

            WHERE Email_Address__c =
                :currentUser.Email

            LIMIT 1
        ];

        // =====================================================
        // 3. Return Staff Id
        // =====================================================

        if (!staffList.isEmpty()) {

            return staffList[0].Id;
        }

        return null;
    }

    @AuraEnabled
    public static void sendLeaveStatusNotification(Id leaveId) {
        System.debug('INSIDE sendLeaveStatusNotification');
                try {

                   Leave__c leaveRec = [
                            SELECT Id,
                                Status__c,
                                Staff__c,
                                Staff__r.Name,
                                Staff__r.Facility__c,
                                Staff__r.Facility__r.Name
                            FROM Leave__c
                            WHERE Id = :leaveId
                            LIMIT 1
                        ];
        System.debug('LEAVE RECORD => ' + leaveRec);
        Map<Id, Staff__c> staffMap = new Map<Id, Staff__c>(
            [
                SELECT Id,
                    (
                        SELECT Id,
                                Facility__c,
                                Facility__r.Name,
                                Active__c
                        FROM Staff_Facilities__r
                        WHERE Active__c = true
                    )
                FROM Staff__c
                WHERE Id = :leaveRec.Staff__c
            ]
        );
        Staff__c staffRec = staffMap.get(leaveRec.Staff__c);
        String activeFacilityName = '';
        Id activeFacilityId = null;
        if (staffRec != null &&
        staffRec.Staff_Facilities__r != null &&
        !staffRec.Staff_Facilities__r.isEmpty()) {
        Staff_Facility__c sf = staffRec.Staff_Facilities__r[0];
        activeFacilityId = sf.Facility__c;
        activeFacilityName = sf.Facility__r.Name;
        }
        // ===== ADD THESE LOGS HERE =====

        System.debug('===== STAFF FACILITY DEBUG =====');
        System.debug('Legacy Facility = ' + leaveRec.Staff__r.Facility__r.Name);
        System.debug('Active Facility Id = ' + activeFacilityId);
        System.debug('Active Facility Name = ' + activeFacilityName);
        System.debug('Staff Facilities Count = ' + staffRec.Staff_Facilities__r.size());

        for (Staff_Facility__c sf : staffRec.Staff_Facilities__r) {
            System.debug(
                'Facility = ' + sf.Facility__r.Name +
                ', Active = ' + sf.Active__c
            );
        }

        System.debug('===============================');

                    if (
                        leaveRec.Status__c != 'Approved' &&
                        leaveRec.Status__c != 'Rejected'
                    ) {
                        return;
                    }

                    Id targetStaffId = leaveRec.Staff__c;
                     System.debug( 'TARGET STAFF => ' + targetStaffId);
                    String title =
                        'Leave ' + leaveRec.Status__c;

                    String message =
                        'Your leave request was ' +
                        leaveRec.Status__c;

                    Notifications__c notification =
                        new Notifications__c(
                            Staff__c     = targetStaffId,
                            Title__c     = title,
                            Message__c   = message,
                            Module__c    = 'Leave Management',
                            Type__c      = 'Info',
                            Record_Id__c = leaveRec.Id,
                           Facility__c = activeFacilityId,
                            Is_Read__c   = false
                        );
                     System.debug('INSERTING NOTIFICATION');
                    insert notification;
                    System.debug('Notification Facility Id = ' + activeFacilityId);
                    Notification_Event__e eventObj =
                        new Notification_Event__e(
                            Staff_Id__c = String.valueOf(targetStaffId),
                            Title__c    = title,
                            Message__c  = message,
                            Module__c   = 'Leave Management',
                            Type__c     = 'Info',
                            Record_Id__c = String.valueOf(leaveRec.Id),
                           Facility_Name__c = activeFacilityName
                        );

                    EventBus.publish(eventObj);

                    System.debug('Leave Status Notification Sent');
                    System.debug('Event Facility Name = ' + activeFacilityName);

                } catch (Exception e) {

                    throw new AuraHandledException(
                        'Status Notification Error: ' +
                        e.getMessage()
                    );
                }
            }

  @AuraEnabled 
    public static List<Id> getUnreadLeaveRecordIds(
        Id staffId
    ) {

        List<Id> leaveIds =
            new List<Id>();

        for (
            Notifications__c n : [

                SELECT Record_Id__c

                FROM Notifications__c

                WHERE Staff__c = :staffId
                AND Module__c = 'Leave Management'
                AND Is_Read__c = false
            ]
        ) {

            if (n.Record_Id__c != null) {

                leaveIds.add(
                    (Id)n.Record_Id__c
                );
            }
        }

        return leaveIds;
    }


    @AuraEnabled
    public static List<Id> getUnreadRejectedShiftIds(
        Id staffId
    ) {

        List<Id> shiftIds = new List<Id>();

        for(
            Notifications__c n : [

                SELECT Record_Id__c

                FROM Notifications__c

                WHERE Staff__c = :staffId
                AND Module__c = 'Rejected Shifts'
                AND Is_Read__c = false
            ]
        ) {

            if(n.Record_Id__c != null){

                shiftIds.add(
                    (Id)n.Record_Id__c
                );
            }
        }

        return shiftIds;
    }

    @AuraEnabled
    public static List<Id> getUnreadReimbursementIds(
        Id staffId
    ) {

        List<Id> reimbursementIds =
            new List<Id>();

        for(
            Notifications__c n : [

                SELECT Record_Id__c

                FROM Notifications__c

                WHERE Staff__c = :staffId
                AND Module__c = 'Reimbursement'
                AND Is_Read__c = false
            ]
        ) {

            if(n.Record_Id__c != null) {

                reimbursementIds.add(
                    (Id)n.Record_Id__c
                );
            }
        }

        return reimbursementIds;
    }

 public static void sendClientFundThresholdNotification(
    List<Id> fundTrackerIds
) {

    System.debug(
        '===== CLIENT FUND NOTIFICATION START ====='
    );

    try {

        // =====================================================
        // 1. VALIDATION
        // =====================================================

        if (
            fundTrackerIds == null ||
            fundTrackerIds.isEmpty()
        ) {

            System.debug(
                LoggingLevel.WARN,
                'Fund Tracker Id List is EMPTY'
            );

            return;
        }

        Set<Id> fundTrackerIdSet =
            new Set<Id>(fundTrackerIds);

        // =====================================================
        // 2. FETCH FUND TRACKERS
        // =====================================================

        List<Funds_Tracker__c> fundList = [

            SELECT Id,
                Name,
                Client__c,
                Client__r.Name,
                Client__r.Facility__r.Organisation__c,
                Client__r.Facility__r.Organisation__r.Name,
                Client__r.Facility__c,
                Client__r.Facility__r.Name,
                Registration_Group__c,
                Amount_approved__c,
                Spent_Amt__c,
                Usage_Threshold__c,
                Available_Funds__c

            FROM Funds_Tracker__c

            WHERE Id IN :fundTrackerIdSet
        ];

        if (fundList.isEmpty()) {

            System.debug(
                LoggingLevel.WARN,
                'No Fund Trackers Found'
            );

            return;
        }
        Set<Id> clientIds = new Set<Id>();

        for (Funds_Tracker__c fund : fundList) {
            if (fund.Client__c != null) {
                clientIds.add(fund.Client__c);
            }
        }
        Map<Id, Client__c> clientMap = new Map<Id, Client__c>(
            [
                SELECT Id,
                    (
                        SELECT Id,
                                Facility__c,
                                Facility__r.Name,
                                Active__c
                        FROM Participant_Facilities__r
                        WHERE Active__c = true
                    )
                FROM Client__c
                WHERE Id IN :clientIds
            ]
        );
        // =====================================================
        // 3. COLLECT ORGANISATIONS
        // =====================================================

        Set<String> organisationNames =
            new Set<String>();

        for (Funds_Tracker__c fund : fundList) {

            if (
                fund.Client__r != null &&
                fund.Client__r.Facility__r != null &&
                fund.Client__r.Facility__r.Organisation__r != null &&
                String.isNotBlank(
                    fund.Client__r.Facility__r.Organisation__r.Name
                )
            ) {

                organisationNames.add(
                    fund.Client__r.Facility__r.Organisation__r.Name
                );
            }
        }

        if (organisationNames.isEmpty()) {

            System.debug(
                LoggingLevel.WARN,
                'No Organisation Names Found'
            );

            return;
        }

        // =====================================================
        // 4. FETCH TARGET USERS
        // =====================================================

        List<User> targetUsers = [

            SELECT Id,
                Name,
                Email,
                User_Type__c,
                Organization_Name__c

            FROM User

            WHERE Organization_Name__c
                IN :organisationNames

            AND User_Type__c IN (
                'NDIS Org Admin',
                'Roster Manager'
            )

            AND IsActive = true
        ];

        if (targetUsers.isEmpty()) {

            System.debug(
                LoggingLevel.WARN,
                'No Target Users Found'
            );

            return;
        }

        // =====================================================
        // 5. MAP USERS BY ORGANISATION
        // =====================================================

        Map<String, List<User>> orgUsersMap =
            new Map<String, List<User>>();

        Set<String> emailSet =
            new Set<String>();

        for (User usr : targetUsers) {

            if (String.isBlank(usr.Email)) {
                continue;
            }

            String orgName =
                usr.Organization_Name__c;

            if (
                !orgUsersMap.containsKey(orgName)
            ) {

                orgUsersMap.put(
                    orgName,
                    new List<User>()
                );
            }

            orgUsersMap.get(orgName)
                .add(usr);

            emailSet.add(
                usr.Email.trim().toLowerCase()
            );
        }

        // =====================================================
        // 6. FETCH STAFF
        // =====================================================

        List<Staff__c> staffList = [

            SELECT Id,
                Name,
                Email_Address__c,
                Status__c

            FROM Staff__c

            WHERE Email_Address__c IN :emailSet

            AND Status__c = true
        ];

        if (staffList.isEmpty()) {

            System.debug(
                LoggingLevel.WARN,
                'No Active Staff Found'
            );

            return;
        }

        // =====================================================
        // 7. MAP STAFF BY EMAIL
        // =====================================================

        Map<String, Staff__c> emailStaffMap =
            new Map<String, Staff__c>();

        for (Staff__c staffRec : staffList) {

            if (
                String.isNotBlank(
                    staffRec.Email_Address__c
                )
            ) {

                emailStaffMap.put(
                    staffRec.Email_Address__c.trim().toLowerCase(),
                    staffRec
                );
            }
        }

        // =====================================================
        // 8. EXISTING NOTIFICATIONS
        // =====================================================

        List<Notifications__c>
            existingNotifications = [

            SELECT Id,
                Staff__c,
                Record_Id__c,
                Is_Read__c

            FROM Notifications__c

            WHERE Record_Id__c
                IN :fundTrackerIdSet

            AND Module__c = 'Funds Tracker' AND Is_Read__c = false
        ];

        Map<String, Notifications__c>
            existingNotificationMap =
                new Map<String, Notifications__c>();

        for (
            Notifications__c existing :
            existingNotifications
        ) {

            String key =
                existing.Staff__c +
                '-' +
                existing.Record_Id__c;

            existingNotificationMap.put(
                key,
                existing
            );
        }

        // =====================================================
        // 9. PREPARE DML LISTS
        // =====================================================

        List<Notifications__c>
            notificationsToInsert =
                new List<Notifications__c>();

        List<Notifications__c>
            notificationsToMarkRead =
                new List<Notifications__c>();

        List<Notification_Event__e>
            eventsToPublish =
                new List<Notification_Event__e>();

        // =====================================================
        // 10. PROCESS FUNDS
        // =====================================================

        for (Funds_Tracker__c fund : fundList) {

            try {
                    Client__c clientRec = clientMap.get(fund.Client__c);

                    String activeFacilityName = '';
                    Id activeFacilityId = null;

                    if (clientRec != null &&
                        clientRec.Participant_Facilities__r != null &&
                        !clientRec.Participant_Facilities__r.isEmpty()) {

                        Participant_Facility__c pf =
                            clientRec.Participant_Facilities__r[0];

                        activeFacilityName = pf.Facility__r.Name;
                        activeFacilityId = pf.Facility__c;
                    }
                if (
                    fund.Amount_approved__c == null ||
                    fund.Amount_approved__c <= 0
                ) {

                    continue;
                }

                Decimal spentAmount =
                    fund.Spent_Amt__c != null
                    ? fund.Spent_Amt__c
                    : 0;

                Decimal threshold =
                    fund.Usage_Threshold__c != null
                    ? fund.Usage_Threshold__c
                    : 80;

                Decimal availableFunds =
                    fund.Available_Funds__c != null
                    ? fund.Available_Funds__c
                    : 0;

                Decimal usagePercentage =
                    (spentAmount /
                    fund.Amount_approved__c) * 100;

                Boolean thresholdBreached =
                    usagePercentage >= threshold;

                Boolean exhausted =
                    availableFunds <= 0;

                // =============================================
                // THRESHOLD RESTORED
                // =============================================

                if (
                    !thresholdBreached &&
                    !exhausted
                ) {

                    for (
                        Notifications__c notif :
                        existingNotifications
                    ) {

                        if (
                            notif.Record_Id__c ==
                                String.valueOf(fund.Id) &&
                            notif.Is_Read__c == false
                        ) {

                            notif.Is_Read__c = true;

                            notificationsToMarkRead.add(notif);
                                    eventsToPublish.add(

                                new Notification_Event__e(

                                    Staff_Id__c =
                                        String.valueOf(
                                            notif.Staff__c
                                        ),

                                    Module__c =
                                        'Funds Tracker',

                                    Type__c =
                                        'READ',
                                    Facility_Name__c =
                                        fund.Client__r.Facility__r.Name,
                                    Record_Id__c =
                                        notif.Record_Id__c
                                )
                            );
                        }
                    }

                    System.debug(
                        'Threshold restored for fund => ' +
                        fund.Id
                    );

                    continue;
                }

                // =============================================
                // VALIDATE ORGANISATION
                // =============================================

                String organisationName =
                    fund.Client__r.Facility__r.Organisation__r.Name;

                if (
                    String.isBlank(
                        organisationName
                    )
                ) {

                    continue;
                }

                List<User> relatedUsers =
                    orgUsersMap.get(
                        organisationName
                    );

                if (
                    relatedUsers == null ||
                    relatedUsers.isEmpty()
                ) {

                    continue;
                }

                String title =
                    exhausted
                    ? 'Fund Exhausted Alert'
                    : 'Fund Threshold Alert';

                String message =
                    exhausted
                    ? fund.Registration_Group__c +
                        ' fund exhausted for ' +
                        fund.Client__r.Name

                    : fund.Registration_Group__c +
                        ' reached ' +
                        usagePercentage.setScale(0) +
                        '% usage for ' +
                        fund.Client__r.Name;

                // =============================================
                // CREATE NOTIFICATIONS
                // =============================================

                for (User usr : relatedUsers) {

                    if (
                        String.isBlank(
                            usr.Email
                        )
                    ) {

                        continue;
                    }

                    String email =
                        usr.Email
                            .trim()
                            .toLowerCase();

                    if (
                        !emailStaffMap
                            .containsKey(email)
                    ) {

                        continue;
                    }

                    Staff__c staffRec =
                        emailStaffMap.get(email);

                    String duplicateKey =
                        staffRec.Id +
                        '-' +
                        fund.Id;

                    if (
                        existingNotificationMap
                            .containsKey(
                                duplicateKey
                            )
                    ) {

                        continue;
                    }

                    notificationsToInsert.add(

                        new Notifications__c(

                            Staff__c =
                                staffRec.Id,

                            Title__c =
                                title,

                            Message__c =
                                message,

                            Module__c =
                                'Funds Tracker',

                            Type__c =
                                'Funds Alert',

                            Record_Id__c =
                                String.valueOf(
                                    fund.Id
                                ),
                            Facility__c = activeFacilityId,
                            Is_Read__c =
                                false
                        )
                    );

                    eventsToPublish.add(

                        new Notification_Event__e(

                            Staff_Id__c =
                                String.valueOf(
                                    staffRec.Id
                                ),

                            Title__c =
                                title,

                            Message__c =
                                message,

                            Module__c =
                                'Funds Tracker',

                            Type__c =
                                'Funds Alert',
                            Facility_Name__c = activeFacilityName,
                            Record_Id__c =
                                String.valueOf(
                                    fund.Id
                                )
                        )
                    );
                }

            } catch (Exception innerEx) {

                System.debug(
                    LoggingLevel.ERROR,
                    'Error Processing Fund => ' +
                    fund.Id +
                    ' | ' +
                    innerEx.getMessage()
                );
            }
        }

        // =====================================================
        // 11. MARK READ
        // =====================================================

        if (
            !notificationsToMarkRead.isEmpty()
        ) {

            update notificationsToMarkRead;

            System.debug(
                'Notifications Marked Read => ' +
                notificationsToMarkRead.size()
            );
        }

        // =====================================================
        // 12. INSERT NOTIFICATIONS
        // =====================================================

        if (
            !notificationsToInsert.isEmpty()
        ) {

            Database.insert(
                notificationsToInsert,
                false
            );

            System.debug(
                'Notifications Inserted => ' +
                notificationsToInsert.size()
            );
        }

        // =====================================================
        // 13. PUBLISH EVENTS
        // =====================================================

        if (!eventsToPublish.isEmpty()) {

            EventBus.publish(
                eventsToPublish
            );

            System.debug(
                'Platform Events Published => ' +
                eventsToPublish.size()
            );
        }

        System.debug(
            '===== CLIENT FUND NOTIFICATION SUCCESS ====='
        );

    } catch (Exception e) {

        System.debug(
            LoggingLevel.ERROR,
            'CLIENT FUND NOTIFICATION ERROR => ' +
            e.getMessage()
        );

        System.debug(
            LoggingLevel.ERROR,
            'STACK TRACE => ' +
            e.getStackTraceString()
        );
    }
}



    @AuraEnabled
    public static List<Id> getUnreadFundsTrackerIds(
        Id staffId
    ) {

        System.debug(
            '===== GET UNREAD FUNDS TRACKER IDS START ====='
        );

        List<Id> fundTrackerIds =
            new List<Id>();

        try {

            for (
                Notifications__c n :

                [

                    SELECT
                        Record_Id__c

                    FROM Notifications__c

                    WHERE
                        Staff__c = :staffId

                    AND
                        Module__c = 'Funds Tracker'

                    AND
                        Is_Read__c = false
                ]
            ) {

                if (
                    n.Record_Id__c != null
                ) {

                    fundTrackerIds.add(
                        (Id)n.Record_Id__c
                    );
                }
            }

            System.debug(
                'Unread Funds Tracker Ids => ' +
                fundTrackerIds
            );

        } catch (Exception e) {

            System.debug(
                'ERROR FETCHING UNREAD FUNDS IDS => ' +
                e.getMessage()
            );
        }

        return fundTrackerIds;
    }

        @AuraEnabled
    public static void markNotificationRead(Id recordId) {

        List<Notifications__c> notifications = [

            SELECT Id,
                Is_Read__c,
                Staff__c,
                Record_Id__c,module__c,Type__c

            FROM Notifications__c

            WHERE Record_Id__c =
                :String.valueOf(recordId)

            AND Is_Read__c = false
        ];

        for (Notifications__c n : notifications) {

            n.Is_Read__c = true;
        }

        if (!notifications.isEmpty()) {

            update notifications;

            // 🔥 PUBLISH REALTIME EVENT
            Notification_Event__e eventObj =
                new Notification_Event__e(

                    Staff_Id__c =
                        String.valueOf(
                            notifications[0].Staff__c
                        ),

                    Record_Id__c =
                        notifications[0].Record_Id__c,

                    Module__c = notifications[0].Module__c
                        ,

                    Type__c = 'READ'
                );

            EventBus.publish(eventObj);
        }
    }

    // @AuraEnabled
    // public static String getParticipantFromFundTracker(String recordId) {
    //     Funds_Tracker__c  ft = [
    //         SELECT Client__c 
    //         FROM Funds_Tracker__c  
    //         WHERE Id = :recordId 
    //         LIMIT 1
    //     ];
    //     return ft.Client__c;
    // }

    public class ParticipantInfo {
        @AuraEnabled public Id participantId;
        @AuraEnabled public String participantUid;
    }

    @AuraEnabled(cacheable=true)
    public static ParticipantInfo getParticipantFromFundTracker(Id recordId) {

        Funds_Tracker__c ft = [
            SELECT Client__c,
                Client__r.Participant_UID__c
            FROM Funds_Tracker__c
            WHERE Id = :recordId
            LIMIT 1
        ];

        ParticipantInfo info = new ParticipantInfo();
        info.participantId = ft.Client__c;
        info.participantUid = ft.Client__r.Participant_UID__c;

        return info;
    }
    @AuraEnabled
    public static void markIncidentNotificationRead(
        Id recordId
    ) {

        try {

            // =====================================
            // Logged In Staff
            // =====================================

            Id loggedInStaffId =
                getLoggedInStaffId();

            if (loggedInStaffId == null) {
                return;
            }

            // =====================================
            // Fetch ONLY current user's
            // unread incident notifications
            // =====================================

            List<Notifications__c> notifications = [

                SELECT Id,
                    Staff__c,
                    Record_Id__c,
                    Module__c,
                    Is_Read__c

                FROM Notifications__c

                WHERE Record_Id__c = :recordId

                AND Module__c =
                    'Incident Register'

                AND Staff__c =
                    :loggedInStaffId

                AND Is_Read__c = false
            ];

            if (notifications.isEmpty()) {
                return;
            }

            // =====================================
            // Mark Read
            // =====================================

            for (Notifications__c ntf : notifications) {

                ntf.Is_Read__c = true;
            }

            update notifications;

            // =====================================
            // Publish Realtime Event
            // =====================================

            Notification_Event__e eventObj =

                new Notification_Event__e(

                    Staff_Id__c =
                        String.valueOf(
                            loggedInStaffId
                        ),

                    Record_Id__c =
                        String.valueOf(recordId),

                    Module__c =
                        'Incident Register',

                    Type__c = 'READ'
                );

            EventBus.publish(eventObj);

        } catch (Exception e) {

            throw new AuraHandledException(
                e.getMessage()
            );
        }
    }

   

        }