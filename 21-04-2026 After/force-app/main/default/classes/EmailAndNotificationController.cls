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

    /*@InvocableMethod(label='Send Email and Notification')
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
    }*/

    @InvocableMethod(label='Send Email and Notification')
    public static void invoke(List<NotificationInput> inputList) {

        System.debug('================ START invoke =================');
        System.debug('📥 Total inputs received: ' + (inputList == null ? 0 : inputList.size()));
        System.debug('📥 Raw Input List: ' + JSON.serialize(inputList));

        // 🔹 Get current user only once
        User currentUser = [
            SELECT Id, Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        System.debug('👤 Current User Id: ' + currentUser.Id);
        System.debug('🏢 Organization Name: ' + currentUser.Organization_Name__c);

        List<Messaging.SingleEmailMessage> allEmails = new List<Messaging.SingleEmailMessage>();
        List<My_Notification__c> allNotifications = new List<My_Notification__c>();

        Integer inputIndex = 0;

        for (NotificationInput input : inputList) {

            System.debug('--------------------------------------------------');
            System.debug('➡️ Processing Input Index: ' + inputIndex);
            System.debug('📦 Input Data: ' + JSON.serialize(input));

            if (input == null) {
                System.debug('⚠️ Input is NULL — skipping');
                inputIndex++;
                continue;
            }

            /* ===========================
            1️⃣ EMAIL PROCESSING
            ============================ */

            if (input.EmailTo != null) {

                System.debug('📧 Raw EmailTo List: ' + input.EmailTo);

                List<String> validEmails = new List<String>();

                for (String addr : input.EmailTo) {

                    System.debug('🔍 Checking email: "' + addr + '"');

                    if (String.isNotBlank(addr)) {
                        validEmails.add(addr.trim());
                        System.debug('✅ Valid email added: ' + addr);
                    } else {
                        System.debug('❌ Invalid email (null/blank) — skipped');
                    }
                }

                System.debug('📧 Valid Email List: ' + validEmails);
                System.debug('📧 Valid Email Count: ' + validEmails.size());

                if (!validEmails.isEmpty()) {

                    Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();

                    email.setSubject(input.Subject);
                    email.setHtmlBody(input.Email_Body);
                    email.setSenderDisplayName(currentUser.Organization_Name__c);
                    email.setToAddresses(validEmails);

                    allEmails.add(email);

                    System.debug('📨 Email prepared for: ' + validEmails);
                } else {
                    System.debug('⚠️ No valid emails — email not created');
                }

            } else {
                System.debug('⚠️ EmailTo list is NULL');
            }

            /* ===========================
            2️⃣ NOTIFICATION PROCESSING
            ============================ */

            if (input.NotificationTo != null) {

                System.debug('🔔 NotificationTo List: ' + input.NotificationTo);

                for (String userId : input.NotificationTo) {

                    System.debug('🔍 Checking User Id: "' + userId + '"');

                    if (String.isNotBlank(userId)) {

                        My_Notification__c notif = new My_Notification__c(
                            User__c = userId,
                            Subject__c = input.Subject,
                            Description__c = input.Notification_Body
                        );

                        allNotifications.add(notif);

                        System.debug('✅ Notification prepared for User: ' + userId);

                    } else {
                        System.debug('❌ Blank User Id — skipped');
                    }
                }

            } else {
                System.debug('⚠️ NotificationTo list is NULL');
            }

            inputIndex++;
        }

        System.debug('================ SUMMARY =================');
        System.debug('📨 Total Emails Prepared: ' + allEmails.size());
        System.debug('🔔 Total Notifications Prepared: ' + allNotifications.size());

        /* ===========================
        3️⃣ SEND EMAILS
        ============================ */

        if (!allEmails.isEmpty()) {
            System.debug('🚀 Sending Emails...');
            Messaging.sendEmail(allEmails);
            System.debug('✅ Emails sent successfully');
        } else {
            System.debug('⚠️ No emails to send');
        }

        /* ===========================
        4️⃣ INSERT NOTIFICATIONS
        ============================ */

        if (!allNotifications.isEmpty()) {
            System.debug('🚀 Inserting Notifications...');
            insert allNotifications;
            System.debug('✅ Notifications inserted successfully');
        } else {
            System.debug('⚠️ No notifications to insert');
        }

        System.debug('================ END invoke =================');
    }
}