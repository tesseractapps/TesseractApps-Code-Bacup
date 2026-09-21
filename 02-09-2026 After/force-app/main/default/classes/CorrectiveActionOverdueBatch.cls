public class CorrectiveActionOverdueBatch implements Database.Batchable<SObject>, Database.Stateful {

    public Date todayDate;

    public CorrectiveActionOverdueBatch() {
        todayDate = System.today();
    }

    public Database.QueryLocator start(Database.BatchableContext bc) {
        //System.debug('CorrectiveActionOverdueBatch start: ' + todayDate);
           Date cutoffDate = todayDate;
        System.debug(
            'CorrectiveActionOverdueBatch start. cutoffDate = ' +
            cutoffDate
        );

        return Database.getQueryLocator([
            SELECT Id, Action_Title__c, Assigned_Owner__c, Due_Date__c, Status__c
            FROM Incident_Corrective_Action__c
            WHERE Status__c != 'Completed'
            AND Due_Date__c != null
            AND Due_Date__c < :cutoffDate
        ]);
    }

    public void execute(Database.BatchableContext bc, List<Incident_Corrective_Action__c> scope) {

        System.debug('CorrectiveActionOverdueBatch execute, scope size: ' + scope.size());

        Set<Id> notifyStaffIds = new Set<Id>();
        for (Incident_Corrective_Action__c ca : scope) {
            if (String.isNotBlank(ca.Assigned_Owner__c)) {
                notifyStaffIds.add((Id) ca.Assigned_Owner__c);
            }
        }
        notifyStaffIds.remove(null);

        if (notifyStaffIds.isEmpty()) {
            System.debug('No assigned owners in this scope — exiting.');
            return;
        }

        Map<Id, Staff__c> staffMap = new Map<Id, Staff__c>([
            SELECT Id, Email_Address__c
            FROM Staff__c
            WHERE Id IN :notifyStaffIds
        ]);

        Set<String> staffEmails = new Set<String>();
        for (Staff__c s : staffMap.values()) {
            if (!String.isBlank(s.Email_Address__c)) {
                staffEmails.add(s.Email_Address__c.trim().toLowerCase());
            }
        }

        Map<String, Id> emailToUserIdMap = new Map<String, Id>();
        for (User u : [
            SELECT Id, Email
            FROM User
            WHERE Email IN :staffEmails
            AND IsActive = true
        ]) {
            emailToUserIdMap.put(u.Email.trim().toLowerCase(), u.Id);
        }

        List<My_Notification__c> myNotificationsToInsert = new List<My_Notification__c>();

        for (Incident_Corrective_Action__c ca : scope) {

            if (String.isBlank(ca.Assigned_Owner__c) || ca.Due_Date__c == null) {
                continue;
            }

            Id staffId = (Id) ca.Assigned_Owner__c;
            Staff__c st = staffMap.get(staffId);
            Id userId = (st != null && !String.isBlank(st.Email_Address__c))
                ? emailToUserIdMap.get(st.Email_Address__c.trim().toLowerCase())
                : null;

            if (userId == null) {
                System.debug('⚠️ No active User found for Staff__c ' + staffId + ' — skipping My_Notification__c for ' + ca.Id);
                continue;
            }

            // String message = '"' + ca.Action_Title__c + '" is overdue. It was due on ' + ca.Due_Date__c.format();
            String dueDateStr = String.valueOf(ca.Due_Date__c.day()).leftPad(2, '0') + '/' +
                     String.valueOf(ca.Due_Date__c.month()).leftPad(2, '0') + '/' +
                     String.valueOf(ca.Due_Date__c.year());

			String message = '"' + ca.Action_Title__c + '" is overdue. It was due on ' + dueDateStr + '.';

            myNotificationsToInsert.add(new My_Notification__c(
                User__c = userId,
                Subject__c = 'Corrective Action Overdue',
                 
                Description__c = message
            ));
        }

        if (!myNotificationsToInsert.isEmpty()) {
            insert myNotificationsToInsert;
            System.debug('✅ Overdue My_Notification__c created: ' + myNotificationsToInsert.size());
        }
    }

    public void finish(Database.BatchableContext bc) {
        System.debug('CorrectiveActionOverdueBatch finished for ' + todayDate);
    }
}