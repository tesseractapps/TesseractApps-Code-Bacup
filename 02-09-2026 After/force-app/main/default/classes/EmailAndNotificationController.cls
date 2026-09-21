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

    System.debug('================ START invoke =================');

    if (inputList == null || inputList.isEmpty()) {
        System.debug('⚠️ No input received');
        return;
    }

    // 🔹 Current User
    User currentUser = [
        SELECT Id,
               Organization_Name__c
        FROM User
        WHERE Id = :UserInfo.getUserId()
        LIMIT 1
    ];

    // 🔹 Organisation
    Organisation__c orgObj = [
        SELECT Id,
               Email__c
        FROM Organisation__c
        WHERE Name = :currentUser.Organization_Name__c
        LIMIT 1
    ];

    // 🔹 Sender Email
    String senderEmailAddress = orgObj.Email__c;

    System.debug('📧 Sender Email: ' + senderEmailAddress);

    List<My_Notification__c> allNotifications =
        new List<My_Notification__c>();

    Integer inputIndex = 0;

    for (NotificationInput input : inputList) {

        System.debug('------------------------------------------------');
        System.debug('➡️ Processing Input Index: ' + inputIndex);

        if (input == null) {

            System.debug('⚠️ Input is NULL');

            inputIndex++;
            continue;
        }

        // =====================================================
        // EMAIL PROCESSING
        // =====================================================

        if (input.EmailTo != null && !input.EmailTo.isEmpty()) {

            List<String> validEmails = new List<String>();

            for (String addr : input.EmailTo) {

                if (String.isNotBlank(addr)) {

                    validEmails.add(addr.trim());

                    System.debug('✅ Valid Email: ' + addr);
                }
            }

            if (!validEmails.isEmpty()) {

                try {

                    // 🔹 Queueable Callout
                    Id jobId = System.enqueueJob(

                        new EmailRelayQueueable(
                            senderEmailAddress,
                            validEmails,
                            input.Subject,
                            input.Email_Body
                        )
                    );

                    System.debug(
                        '✅ Email Queue Job Created: ' + jobId
                    );

                } catch (Exception e) {

                    System.debug(
                        '❌ Error enqueueing email job: ' +
                        e.getMessage()
                    );
                }

            } else {

                System.debug('⚠️ No valid emails found');
            }

        } else {

            System.debug('⚠️ EmailTo is NULL or Empty');
        }

        // =====================================================
        // NOTIFICATION PROCESSING
        // =====================================================

        if (input.NotificationTo == null || input.NotificationTo.isEmpty()) {

            System.debug('⚠️ NotificationTo is null or empty. Skipping notification creation.');

        } else {

            for (String userId : input.NotificationTo) {

                if (String.isNotBlank(userId)) {

                    allNotifications.add(
                        new My_Notification__c(
                            User__c = userId,
                            Subject__c = input.Subject,
                            Description__c = input.Notification_Body
                        )
                    );

                    System.debug('✅ Notification Prepared for User: ' + userId);

                } else {

                    System.debug('⚠️ Blank User Id skipped');

                }
            }
        }

        inputIndex++;
    }

    // =====================================================
    // INSERT NOTIFICATIONS
    // =====================================================

    if (!allNotifications.isEmpty()) {

        try {

            insert allNotifications;

            System.debug(
                '✅ Notifications Inserted: ' +
                allNotifications.size()
            );

        } catch (Exception e) {

            System.debug(
                '❌ Error inserting notifications: ' +
                e.getMessage()
            );
        }

    } else {

        System.debug('⚠️ No notifications to insert');
    }

    System.debug('================ END invoke =================');
}
    


}