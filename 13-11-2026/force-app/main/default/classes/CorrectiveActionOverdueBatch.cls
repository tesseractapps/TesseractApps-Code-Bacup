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
            SELECT Id, Action_Title__c, Assigned_Owner__c, Due_Date__c, Status__c,
               Incident_Investigation__c
                // Incident_Investigation__r.Incident_Response__c,
                // Incident_Investigation__r.Incident_Response__r.Facility__c,
                // Incident_Investigation__r.Incident_Response__r.Facility__r.Organisation__r.Name,
                // Incident_Investigation__r.Incident_Response__r.Facility__r.Organisation__r.Email__c
            FROM Incident_Corrective_Action__c
            WHERE Status__c != 'Completed'
            AND Due_Date__c != null
            AND Due_Date__c < :cutoffDate
        ]);
    }

    public void execute(Database.BatchableContext bc, List<Incident_Corrective_Action__c> scope) {

        System.debug('CorrectiveActionOverdueBatch execute, scope size: ' + scope.size());

        Set<Id> notifyStaffIds = new Set<Id>();
        Set<Id> investigationIds = new Set<Id>();
        for (Incident_Corrective_Action__c ca : scope) {
            if (String.isNotBlank(ca.Assigned_Owner__c)) {
                notifyStaffIds.add((Id) ca.Assigned_Owner__c);
            }
            if (String.isNotBlank(ca.Incident_Investigation__c)) {
                investigationIds.add((Id) ca.Incident_Investigation__c);
            }
        }
        notifyStaffIds.remove(null);
        investigationIds.remove(null);

        if (notifyStaffIds.isEmpty()) {
            System.debug('No assigned owners in this scope — exiting.');
            return;
        }

        Map<Id, Staff__c> staffMap = new Map<Id, Staff__c>([
            SELECT Id, Email_Address__c,NameToDisplay__c
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
        Map<Id, Id> investigationToResponseMap = new Map<Id, Id>();
        if (!investigationIds.isEmpty()) {
            for (Incident_Investigation__c inv : [
                SELECT Id, Incident_Response__c
                FROM Incident_Investigation__c
                WHERE Id IN :investigationIds
            ]) {
                if (inv.Incident_Response__c != null) {
                    investigationToResponseMap.put(inv.Id, inv.Incident_Response__c);
                }
            }
        }
        Set<Id> responseIds = new Set<Id>(investigationToResponseMap.values());
        Map<Id, Incident_Register_Response__c> responseMap = new Map<Id, Incident_Register_Response__c>();
        if (!responseIds.isEmpty()) {
            responseMap = new Map<Id, Incident_Register_Response__c>([
                SELECT Id, Facility__c,
                       Facility__r.Organisation__r.Name,
                       Facility__r.Organisation__r.Email__c
                FROM Incident_Register_Response__c
                WHERE Id IN :responseIds
            ]);
        }

        List<My_Notification__c> myNotificationsToInsert = new List<My_Notification__c>();
        List<Object> bulkEmails = new List<Object>();

        for (Incident_Corrective_Action__c ca : scope) {

            if (String.isBlank(ca.Assigned_Owner__c) || ca.Due_Date__c == null) {
                continue;
            }

            Id staffId = (Id) ca.Assigned_Owner__c;
            Staff__c st = staffMap.get(staffId);
            String staffEmail = (st != null && String.isNotBlank(st.Email_Address__c))
                ? st.Email_Address__c.trim().toLowerCase()
                : null;
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
            String statusLabel = 'overdue';

			String message = '"' + ca.Action_Title__c + '" is overdue. It was due on ' + dueDateStr + '.';

            if (userId != null) {
                myNotificationsToInsert.add(new My_Notification__c(
                    User__c = userId,
                    Subject__c = 'Corrective Action Overdue',
                    Description__c = message,
                    Record_Id__c = ca.Id
                ));
            } else {
                System.debug('⚠️ No active User found for Staff__c ' + staffId + ' — skipping My_Notification__c for ' + ca.Id);
            }
            if (String.isNotBlank(staffEmail)) {

                String recipientName = (st != null && String.isNotBlank(st.NameToDisplay__c))
                    ? st.NameToDisplay__c
                    : '';

                Id investigationId = String.isNotBlank(ca.Incident_Investigation__c)
                    ? (Id) ca.Incident_Investigation__c
                    : null;

                Id responseId = investigationId != null
                    ? investigationToResponseMap.get(investigationId)
                    : null;

                Incident_Register_Response__c resp = responseId != null
                    ? responseMap.get(responseId)
                    : null;

                String orgName = (resp != null
                    && resp.Facility__r != null
                    && resp.Facility__r.Organisation__r != null
                    && String.isNotBlank(resp.Facility__r.Organisation__r.Name))
                    ? resp.Facility__r.Organisation__r.Name
                    : 'Your Organisation';

                String senderEmailAddress = (resp != null
                        && resp.Facility__r != null
                        && resp.Facility__r.Organisation__r != null)
                        ? resp.Facility__r.Organisation__r.Email__c
                        : null;

                String htmlBody =
                    'Hi ' + recipientName + ',<br/><br/>' +
                    '<b>Corrective Action Reminder</b><br/><br/>' +
                    '"' + ca.Action_Title__c + '" is <b>' + statusLabel + '</b>.<br/><br/>' +
                    '<b>Due Date:</b> ' + dueDateStr + '<br/><br/>' +
                    'Please review and complete the corrective action as required.<br/><br/>' +
                    'Thank you,<br/><br/>' +
                    orgName + '<br/><br/>' +
                    'This is an automated notification. Please do not reply to this email.';

                Map<String, Object> emailPayload = new Map<String, Object>();

                emailPayload.put('fromEmail', senderEmailAddress);
                emailPayload.put('toEmail', new List<String>{ staffEmail });
                emailPayload.put('subject', 'Corrective Action Overdue: ' + ca.Action_Title__c);
                emailPayload.put('body', htmlBody);

                bulkEmails.add(emailPayload);

            } else {
                System.debug('⚠️ No email found for Staff__c ' + staffId + ' — skipping email for ' + ca.Id);
            }
        }

        if (!myNotificationsToInsert.isEmpty()) {
            insert myNotificationsToInsert;
            System.debug('✅ Overdue My_Notification__c created: ' + myNotificationsToInsert.size());
        }
        if (!bulkEmails.isEmpty()) {

            Id jobId = System.enqueueJob(
                new EmailRelayQueueable(bulkEmails)
            );

            System.debug('✅ Overdue Corrective Action Email Queue Created: ' + jobId);
            System.debug('✅ Total Emails Queued: ' + bulkEmails.size());
        }
    }

    public void finish(Database.BatchableContext bc) {
        System.debug('CorrectiveActionOverdueBatch finished for ' + todayDate);
    }
}