public class FundingExpiryNotificationHandler {

    @InvocableMethod(label='Send Funding Expiry Notification')
    public static void sendExpiryAlert(List<FundingExpiryInput> inputList) {

        if(inputList == null || inputList.isEmpty()) return;

        Set<Id> fundIds = new Set<Id>();
        Set<String> allEmails = new Set<String>();

        for(FundingExpiryInput input : inputList) {
            if(input.FundTrackerId != null) fundIds.add(input.FundTrackerId);

            if(input.EmailTo != null) {
                for(String email : input.EmailTo) {
                    if(String.isNotBlank(email)) allEmails.add(email.trim().toLowerCase());
                }
            }
        }


        Map<Id, Funds_Tracker__c> fundMap = new Map<Id, Funds_Tracker__c>(
            [SELECT Id,Name, Expiry_Date__c, Available_Funds__c, Service_Type__c,
             Client__r.Display_Nickname__c, Client__r.NDIS_Participant_ID__c
             FROM Funds_Tracker__c WHERE Id IN :fundIds]
        );


        Map<String, Staff__c> emailStaffMap = new Map<String, Staff__c>();

        for(Staff__c staff : [
            SELECT Id, Name,Display_Nickname__c, Email_Address__c 
            FROM Staff__c 
            WHERE Email_Address__c IN :allEmails
        ]) {
            if(String.isNotBlank(staff.Email_Address__c)) {
                emailStaffMap.put(staff.Email_Address__c.trim().toLowerCase(), staff);
            }
        }


        List<Object> bulkEmails = new List<Object>();
        List<My_Notification__c> notifications = new List<My_Notification__c>();


        for(FundingExpiryInput input : inputList) {

            Funds_Tracker__c fund = fundMap.get(input.FundTrackerId);

            if(fund == null) continue;

            String expiryDate = '-';
            String subject = 'Service Funding Expiry Alert – 30 Days Remaining';


            if(input.EmailTo != null) {

                for(String email : input.EmailTo) {

                    String key = email != null ? email.trim().toLowerCase() : null;

                    Staff__c staff = emailStaffMap.get(key);

                    String staffName = staff != null ? staff.Display_Nickname__c : 'User';
                  
                    if (fund.Expiry_Date__c != null) {
                        DateTime expiryDateTime = DateTime.newInstance( fund.Expiry_Date__c, Time.newInstance(0, 0, 0, 0) );
                        expiryDate = expiryDateTime.format('dd/MM/yyyy');
                      }
                    
                    // Format currency with comma
                  String remainingBudget = '$0.00';

                    if (fund.Available_Funds__c != null) {
                        String amount = fund.Available_Funds__c.format();
                    
                        if (!amount.contains('.')) {
                            amount += '.00';
                        } else if (amount.substringAfter('.').length() == 1) {
                            amount += '0';
                        }
                    
                        remainingBudget = '$' + amount;
                    }
                    String body =
                    'Dear '+ staffName + ',' +
                    '<br/><br/>' +
                    'This is a reminder that the following participant service funding is due to expire in 30 days.' +
                    '<br/><br/>' +
                    '<b>Participant:</b> ' + fund.Client__r.Display_Nickname__c +
                    '<br/>' +
                    '<b>NDIS Number:</b> ' + (fund.Client__r.NDIS_Participant_ID__c != null  ? fund.Client__r.NDIS_Participant_ID__c  : '-') + '<br/>' +
                    '<b>Service Type:</b> ' + fund.Name +
                    '<br/>' +
                    '<b>Funding Period End Date:</b> ' + expiryDate +
   					 '<br/>' +
                     '<b>Remaining Budget:</b> ' + remainingBudget +
                     '<br/><br/>' +
                    'Please review the participant\'s funding arrangements and contact the relevant Support Coordinator, Plan Manager, or participant representative to confirm whether an updated funding plan is available.' +
                    '<br/><br/>' +
                    'Taking action before the expiry date will help prevent service interruptions and ensure continuity of care.' +
                    '<br/><br/>' +
                    'Regards,<br/>' + input.orgName;



                    Map<String,Object> payload = new Map<String,Object>();

                    payload.put('fromEmail', input.orgEmail);
                    payload.put('toEmail', new List<String>{email});
                    payload.put('subject', subject);
                    payload.put('body', body);

                    bulkEmails.add(payload);
                }
            }



            if(input.NotificationTo != null) {

                for(String userId : input.NotificationTo) {

                     notifications.add(new My_Notification__c(
                        User__c = userId,
                        Subject__c = subject,
                         Description__c = fund.Client__r.Display_Nickname__c + '\'s ' + fund.Name + ' funding expires in 30 days. Review funding arrangements now.'
                    ));
                }
            }
        }


        if(!bulkEmails.isEmpty()) {
            System.enqueueJob(new EmailRelayQueueable(bulkEmails));
        }


        if(!notifications.isEmpty()) {
            insert notifications;
        }
    }



    public class FundingExpiryInput {

        @InvocableVariable(required=true)
        public Id FundTrackerId;

        @InvocableVariable
        public List<String> EmailTo;

        @InvocableVariable
        public List<String> NotificationTo;

        @InvocableVariable
        public String orgName;

        @InvocableVariable
        public String orgEmail;
    }
}