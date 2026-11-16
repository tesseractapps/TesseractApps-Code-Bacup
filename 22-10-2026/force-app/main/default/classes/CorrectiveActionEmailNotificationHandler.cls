public class CorrectiveActionEmailNotificationHandler {

    @InvocableMethod(label='Send Corrective Action Email Notification')
    public static void sendCorrectiveActionEmail(List<CorrectiveActionEmailInput> inputList) {
        System.debug('===== sendCorrectiveActionEmail START =====');

        if (inputList == null || inputList.isEmpty()) {
            System.debug('⚠️ inputList is null or empty — exiting.');
            return;
        }

        Set<Id> actionIds = new Set<Id>();
        Set<String> allEmails = new Set<String>();

        for (CorrectiveActionEmailInput input : inputList) {
            System.debug('--- Processing input ---');
            System.debug('CorrectiveActionId: ' + input.CorrectiveActionId);
            System.debug('EmailTo: ' + input.EmailTo);
            System.debug('StatusLabel: ' + input.StatusLabel);
            System.debug('orgName: ' + input.orgName);
            System.debug('orgEmail: ' + input.orgEmail);
            if (input.CorrectiveActionId != null) actionIds.add(input.CorrectiveActionId);

            if (input.EmailTo != null) {
                for (String email : input.EmailTo) {
                    if (String.isNotBlank(email)) allEmails.add(email.trim().toLowerCase());
                }
            }
        }
		System.debug('Collected actionIds: ' + actionIds);
        System.debug('Collected allEmails: ' + allEmails);
        Map<Id, Incident_Corrective_Action__c> actionMap = new Map<Id, Incident_Corrective_Action__c>(
            [SELECT Id, Action_Title__c, Due_Date__c
             FROM Incident_Corrective_Action__c
             WHERE Id IN :actionIds]
        );
		System.debug('actionMap result: ' + JSON.serializePretty(actionMap));
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

        for (CorrectiveActionEmailInput input : inputList) {

            Incident_Corrective_Action__c action = actionMap.get(input.CorrectiveActionId);
            if (action == null) continue;

            String dueDateStr = '-';
            if (action.Due_Date__c != null) {
                DateTime dueDateTime = DateTime.newInstance(action.Due_Date__c, Time.newInstance(0, 0, 0, 0));
                dueDateStr = dueDateTime.format('dd/MM/yyyy');
            }
			System.debug('Resolved dueDateStr: ' + dueDateStr);
            String statusLabel = String.isNotBlank(input.StatusLabel) ? input.StatusLabel : 'due';
            String subject = 'Corrective Action Reminder: ' + action.Action_Title__c;
            System.debug('Resolved statusLabel: ' + statusLabel);
            System.debug('Resolved subject: ' + subject);

            if (input.EmailTo != null) {

                for (String email : input.EmailTo) {

                    String key = email != null ? email.trim().toLowerCase() : null;
                    Staff__c staff = emailStaffMap.get(key);
                    String staffName = staff != null ? staff.Display_Nickname__c : 'User';
					System.debug('Processing email: ' + email + ' | matched staffName: ' + staffName);
                    if (String.isBlank(email)) continue;

                    String body =
                        'Hi ' + staffName + ',' +
                        '<br/><br/>' +
                        '<b>Corrective Action Reminder</b>' +
                        '<br/><br/>' +
                        action.Action_Title__c + ' is <b>' + statusLabel + '</b>.' +
                        '<br/>' +
                        '<b>Due Date:</b> ' + dueDateStr +
                        '<br/><br/>' +
                        'Please review and complete the corrective action as required.' +
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

    public class CorrectiveActionEmailInput {

        @InvocableVariable(required=true)
        public Id CorrectiveActionId;

        @InvocableVariable
        public List<String> EmailTo;

        @InvocableVariable(required=true)
        public String StatusLabel;

        @InvocableVariable
        public String orgName;

        @InvocableVariable
        public String orgEmail;
    }
}