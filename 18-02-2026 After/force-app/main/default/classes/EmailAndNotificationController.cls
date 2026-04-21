public class EmailAndNotificationController {

    public class NotificationInput {
        @InvocableVariable(required=true)
        public String Email_Body;
        
        @InvocableVariable(required=true)
        public String Notification_Body;

        @InvocableVariable(required=true)
        public String Subject;

        @InvocableVariable(required=true)
        public List<String> EmailTo;  // Multiple emails allowed

        @InvocableVariable
        public List<String> NotificationTo;   // List of User Ids
    }

    @InvocableMethod(label='Send Email and Notification')
    public static void invoke(List<NotificationInput> inputList) {
         User currentUser = [
                            SELECT Id, Organization_Name__c
                            FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1
                        ];
        for (NotificationInput input : inputList) {
            try {
               
                System.debug('🔹 Processing NotificationInput: ' + JSON.serialize(input));

                // 1️⃣ Prepare Email
                List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();
                Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
				if (input.EmailTo != null && !input.EmailTo.isEmpty()) {
                    email.setSubject(input.Subject);
                    email.setHtmlBody(input.Email_Body);
                    email.setSenderDisplayName(currentUser.Organization_Name__c);

                // 🟢 FIXED — assign list directly
               // if (input.EmailTo != null && !input.EmailTo.isEmpty()) {
                    email.setToAddresses(input.EmailTo);
                }

                emails.add(email);
                System.debug('✅ Email prepared');

                // 2️⃣ Prepare Notifications
                List<My_Notification__c> notifications = new List<My_Notification__c>();

                if (input.NotificationTo != null && !input.NotificationTo.isEmpty()) {
                    for (String userId : input.NotificationTo) {
                        if (String.isNotBlank(userId)) {
                            notifications.add(new My_Notification__c(
                                User__c = userId,
                                Subject__c = input.Subject,
                                Description__c = input.Notification_Body
                            ));
                        }
                    }
                }

                // 3️⃣ Send Email
                if (!emails.isEmpty()) {
                    Messaging.sendEmail(emails);
                }

                // 4️⃣ Insert notifications
                if (!notifications.isEmpty()) {
                    insert notifications;
                }

            } catch (Exception ex) {
                System.debug('❌ Error sending notification: ' + ex.getMessage());
            }
        }
    }
}