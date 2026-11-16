public class EmailSenderNotification {

    public static SendEmailResult sendSingleEmail(
        String[] toAddresses,
        String subject,
        String body
    ) {

        SendEmailResult result =
            new SendEmailResult();

        try {

            // =========================================
            // GET ORGANIZATION EMAIL
            // =========================================

            User currentUser = [
                SELECT Id,
                    Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];


            Organisation__c orgObj = [
                SELECT Id,
                    Email__c
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];


            String senderEmailAddress =
                orgObj.Email__c;


            // =========================================
            // EMAIL PAYLOAD
            // =========================================

            Map<String, Object> emailPayload =
                new Map<String, Object>();


            emailPayload.put(
                'fromEmail',
                senderEmailAddress
            );


            emailPayload.put(
                'toEmail',
                new List<String>(toAddresses)
            );


            emailPayload.put(
                'subject',
                subject
            );


            emailPayload.put(
                'body',
                body
            );


            // =========================================
            // OPTIONAL ATTACHMENTS
            // =========================================

            List<String> attachments =
                new List<String>();


            if (!attachments.isEmpty()) {

                emailPayload.put(
                    'attachment',
                    attachments
                );
            }


            // =========================================
            // BULK EMAIL PAYLOAD
            // =========================================

            List<Object> bulkEmails =
                new List<Object>();


            bulkEmails.add(
                emailPayload
            );


            // =========================================
            // SEND EMAIL USING QUEUEABLE
            // =========================================

            Id jobId = System.enqueueJob(

                new EmailRelayQueueable(
                    bulkEmails
                )
            );


            System.debug(
                '✅ Email Queueable Created: ' +
                jobId
            );


            result.isSuccess = true;

            result.message =
                'Email queued successfully';


        } catch (Exception e) {


            result.isSuccess = false;


            result.message =
                'Error: ' +
                e.getMessage();


            System.debug(
                '❌ Email Error: ' +
                e.getMessage()
            );
        }


        return result;
    }



    public class SendEmailResult {

        public Boolean isSuccess {
            get;
            set;
        }


        public String message {
            get;
            set;
        }
    }
}