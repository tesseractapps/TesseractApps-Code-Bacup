public class NdisSubmissionEmailNotificationHandler {

    @InvocableMethod(label='Send NDIS Submission Email Notification')
    public static void sendNdisSubmissionEmail(List<NdisSubmissionEmailInput> inputList) {
         System.debug('===== sendNdisSubmissionEmail START =====');

         if (inputList == null || inputList.isEmpty()) {
            System.debug('⚠️ inputList is null or empty — exiting.');
            return;
        }

        Set<Id> investigationIds = new Set<Id>();
        Set<String> allEmails = new Set<String>();

        for (NdisSubmissionEmailInput input : inputList) {
             System.debug('--- Processing input ---');
            System.debug('InvestigationId: ' + input.InvestigationId);
            System.debug('EmailTo: ' + input.EmailTo);
            System.debug('NotificationType: ' + input.NotificationType);
            System.debug('StatusLabel: ' + input.StatusLabel);
            System.debug('orgName: ' + input.orgName);
            System.debug('orgEmail: ' + input.orgEmail);
            if (input.InvestigationId != null) investigationIds.add(input.InvestigationId);

            if (input.EmailTo != null) {
                for (String email : input.EmailTo) {
                    if (String.isNotBlank(email)) allEmails.add(email.trim().toLowerCase());
                }
            }
        }
		System.debug('Collected investigationIds: ' + investigationIds);
        System.debug('Collected allEmails: ' + allEmails);
        Map<Id, Incident_Investigation__c> investigationMap = new Map<Id, Incident_Investigation__c>(
            [SELECT Id, Incident_Response__c, Incident_Response__r.Name
             FROM Incident_Investigation__c
             WHERE Id IN :investigationIds]
        );
		System.debug('investigationMap result: ' + JSON.serializePretty(investigationMap));
        Map<String, Staff__c> emailStaffMap = new Map<String, Staff__c>();

        for (Staff__c staff : [
            SELECT Id, Name, Display_Nickname__c, Email_Address__c
            FROM Staff__c
            WHERE Email_Address__c IN :allEmails
        ]) {
            if (String.isNotBlank(staff.Email_Address__c)) {
                emailStaffMap.put(staff.Email_Address__c.trim().toLowerCase(), staff);
            }
        }
		System.debug('emailStaffMap result: ' + JSON.serializePretty(emailStaffMap));
        List<Object> bulkEmails = new List<Object>();

        for (NdisSubmissionEmailInput input : inputList) {

            Incident_Investigation__c inv = investigationMap.get(input.InvestigationId);
            if (inv == null) {
                System.debug('⚠️ No Incident_Investigation__c found for Id: ' + input.InvestigationId);
                continue;
            }

            String incidentName = inv.Incident_Response__r != null ? inv.Incident_Response__r.Name : '';
             System.debug('Resolved incidentName: ' + incidentName);

            String notificationType = String.isNotBlank(input.NotificationType) ? input.NotificationType : 'Initial Notification';
            String statusLabel = String.isNotBlank(input.StatusLabel) ? input.StatusLabel : 'due';
            System.debug('Resolved notificationType: ' + notificationType);
            System.debug('Resolved statusLabel: ' + statusLabel);

            String heading = notificationType == '5-Day Report' ? 'NDIS 5-Day Report' : 'NDIS Initial Notification';
            String actionLine = notificationType == '5-Day Report'
                ? 'Please complete the report and record the submission.'
                : 'Please record the notification once it has been submitted to the NDIS Commission.';
            String descriptionLine = notificationType == '5-Day Report'
                ? 'The 5-Day Report for Incident ' + incidentName + ' is <b>' + statusLabel + '</b>.'
                : 'The Initial NDIS Notification for Incident ' + incidentName + ' is <b>' + statusLabel + '</b>.';
            System.debug('Resolved heading: ' + heading);
            System.debug('Resolved actionLine: ' + actionLine);
            System.debug('Resolved descriptionLine: ' + descriptionLine);

            String subject = heading + ': ' + incidentName;
            System.debug('Resolved subject: ' + subject);

            if (input.EmailTo != null) {

                for (String email : input.EmailTo) {

                    if (String.isBlank(email)) continue;

                    String key = email.trim().toLowerCase();
                    Staff__c staff = emailStaffMap.get(key);
                    String staffName = staff != null ? staff.Display_Nickname__c : '';
                    System.debug('Processing email: ' + email + ' | matched staffName: ' + staffName);

                    String body =
                        'Hi ' + staffName + ',' +
                        '<br/><br/>' +
                        '<b>' + heading + '</b>' +
                        '<br/><br/>' +
                        descriptionLine +
                        '<br/><br/>' +
                        actionLine +
                        '<br/><br/>' +
                        'Thank you,<br/>' +
                        input.orgName +
                        '<br/><br/>' +
                        'This is an automated notification. Please do not reply to this email.';

                    Map<String, Object> payload = new Map<String, Object>();

                    payload.put('fromEmail', input.orgEmail);
                    payload.put('toEmail', new List<String>{ email });
                    payload.put('subject', subject);
                    payload.put('body', body);
					
                    System.debug('Payload added: ' + JSON.serializePretty(payload));
                    bulkEmails.add(payload);
                }
            }
        }
		System.debug('Final bulkEmails count: ' + bulkEmails.size());
        if (!bulkEmails.isEmpty()) {
            System.enqueueJob(new EmailRelayQueueable(bulkEmails));
        }
    }

    public class NdisSubmissionEmailInput {

        @InvocableVariable(required=true)
        public Id InvestigationId;

        @InvocableVariable
        public List<String> EmailTo;

        @InvocableVariable(required=true)
        public String NotificationType;

        @InvocableVariable(required=true)
        public String StatusLabel;

        @InvocableVariable
        public String orgName;

        @InvocableVariable
        public String orgEmail;
    }
}