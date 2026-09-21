//public class IncidentNDISOverdueReminderBatch {

public class IncidentNDISOverdueReminderBatch implements Database.Batchable<SObject>, Database.Stateful {

    public Date todayDate;

    public IncidentNDISOverdueReminderBatch() {
        todayDate = System.today();
    }

    public Database.QueryLocator start(Database.BatchableContext bc) {
        System.debug('IncidentNDISOverdueReminderBatch start: ' + todayDate);

        return Database.getQueryLocator([
            SELECT Id, Assigned_Investigator__c, Incident_Created_Date__c, Incident_Response__r.Name
            FROM Incident_Investigation__c
            WHERE Incident_Created_Date__c != null
            AND NDIS_Reportable__c = 'Yes'
        ]);
    }

    public void execute(Database.BatchableContext bc, List<Incident_Investigation__c> scope) {

        System.debug('IncidentNDISOverdueReminderBatch execute, scope size: ' + scope.size());

        Set<Id> investigationIds = new Set<Id>();
        for (Incident_Investigation__c inv : scope) {
            investigationIds.add(inv.Id);
        }

        // Which investigations already have each submission type recorded
        Set<Id> hasInitialNotification = new Set<Id>();
        Set<Id> hasFiveDayReport = new Set<Id>();
        for (Incident_NDIS_Submission__c sub : [
            SELECT Incident_Investigation__c, Submission_Type__c
            FROM Incident_NDIS_Submission__c
            WHERE Incident_Investigation__c IN :investigationIds
        ]) {
            String type = (sub.Submission_Type__c != null ? sub.Submission_Type__c : '').trim();
            if (type == 'Initial Notification') {
                hasInitialNotification.add(sub.Incident_Investigation__c);
            } else if (type == '5-Day Report') {
                hasFiveDayReport.add(sub.Incident_Investigation__c);
            }
        }

        // Build the set of investigations actually needing a reminder today
        Set<Id> notifyStaffIds = new Set<Id>();
        List<Incident_Investigation__c> pendingInitial = new List<Incident_Investigation__c>();
        List<Incident_Investigation__c> pendingFiveDay = new List<Incident_Investigation__c>();

        for (Incident_Investigation__c inv : scope) {

            if (inv.Incident_Created_Date__c == null || String.isBlank(inv.Assigned_Investigator__c)) {
                continue;
            }

            Date createdDate = inv.Incident_Created_Date__c;
            Date initialDueDate = createdDate.addDays(1);
            Date fiveDayDueDate = createdDate.addDays(5);

            if (!hasInitialNotification.contains(inv.Id) && todayDate > initialDueDate) {
                pendingInitial.add(inv);
                notifyStaffIds.add((Id) inv.Assigned_Investigator__c);
            }

            if (!hasFiveDayReport.contains(inv.Id) && todayDate > fiveDayDueDate) {
                pendingFiveDay.add(inv);
                notifyStaffIds.add((Id) inv.Assigned_Investigator__c);
            }
        }

        if (notifyStaffIds.isEmpty()) {
            System.debug('No pending NDIS reminders in this scope — exiting.');
            return;
        }

        // Staff__c -> User__c mapping
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

        for (Incident_Investigation__c inv : pendingInitial) {
            Id userId = resolveUserId(inv.Assigned_Investigator__c, staffMap, emailToUserIdMap);
            if (userId == null) {
                System.debug('⚠️ No active User for Staff__c ' + inv.Assigned_Investigator__c + ' — skipping Initial Notification reminder for ' + inv.Id);
                continue;
            }
            String incidentName = inv.Incident_Response__r != null ? inv.Incident_Response__r.Name : '';
            myNotificationsToInsert.add(new My_Notification__c(
                User__c = userId,
                Subject__c = 'Reminder: NDIS Initial Notification Pending',
                Description__c = 'The Initial NDIS Notification for Incident ' + incidentName + ' is still pending. Please record the submission to stop further reminders.'
            ));
        }

        for (Incident_Investigation__c inv : pendingFiveDay) {
            Id userId = resolveUserId(inv.Assigned_Investigator__c, staffMap, emailToUserIdMap);
            if (userId == null) {
                System.debug('⚠️ No active User for Staff__c ' + inv.Assigned_Investigator__c + ' — skipping 5-Day Report reminder for ' + inv.Id);
                continue;
            }
            String incidentName = inv.Incident_Response__r != null ? inv.Incident_Response__r.Name : '';
            myNotificationsToInsert.add(new My_Notification__c(
                User__c = userId,
                Subject__c = 'NDIS 5-Day Report Overdue',
                Description__c = 'The 5-Day Report for Incident ' + incidentName + ' is overdue. Please complete and record the submission immediately.'
            ));
        }

        if (!myNotificationsToInsert.isEmpty()) {
            insert myNotificationsToInsert;
            System.debug('✅ NDIS overdue My_Notification__c created: ' + myNotificationsToInsert.size());
        }
    }

    private Id resolveUserId(String staffId, Map<Id, Staff__c> staffMap, Map<String, Id> emailToUserIdMap) {
        if (String.isBlank(staffId)) {
            return null;
        }
        Staff__c st = staffMap.get((Id) staffId);
        if (st == null || String.isBlank(st.Email_Address__c)) {
            return null;
        }
        return emailToUserIdMap.get(st.Email_Address__c.trim().toLowerCase());
    }

    public void finish(Database.BatchableContext bc) {
        System.debug('IncidentNDISOverdueReminderBatch finished for ' + todayDate);
    }
}