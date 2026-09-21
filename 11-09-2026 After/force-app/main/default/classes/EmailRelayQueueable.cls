public class EmailRelayQueueable
implements Queueable, Database.AllowsCallouts {

    // =====================================================
    // SINGLE EMAIL VARIABLES
    // =====================================================

    private String fromEmail;
    private List<String> toEmails;
    private String subject;
    private String body;
    private List<String> attachments;
    private List<String> ccEmails;
    private List<String> bccEmails;

    // =====================================================
    // BULK EMAIL VARIABLES
    // =====================================================

    private List<Object> bulkEmails;

    // =====================================================
    // MODE FLAG
    // =====================================================

    private Boolean isBulkMode = false;

    // =====================================================
    // SINGLE EMAIL CONSTRUCTOR
    // =====================================================

    public EmailRelayQueueable(
        String fromEmail,
        List<String> toEmails,
        String subject,
        String body
    ) {

        this.fromEmail = fromEmail;
        this.toEmails = toEmails;
        this.subject = subject;
        this.body = body;

        this.attachments = new List<String>();
        this.ccEmails = new List<String>();
        this.bccEmails = new List<String>();

        this.isBulkMode = false;
    }

    // =====================================================
    // SINGLE EMAIL WITH FULL OPTIONS
    // =====================================================

    public EmailRelayQueueable(
        String fromEmail,
        List<String> toEmails,
        String subject,
        String body,
        List<String> attachments,
        List<String> ccEmails,
        List<String> bccEmails
    ) {

        this.fromEmail = fromEmail;
        this.toEmails = toEmails;
        this.subject = subject;
        this.body = body;

        this.attachments =
            attachments != null
            ? attachments
            : new List<String>();

        this.ccEmails =
            ccEmails != null
            ? ccEmails
            : new List<String>();

        this.bccEmails =
            bccEmails != null
            ? bccEmails
            : new List<String>();

        this.isBulkMode = false;
    }

    // =====================================================
    // BULK EMAIL CONSTRUCTOR
    // =====================================================

    public EmailRelayQueueable(
        List<Object> bulkEmails
    ) {

        this.bulkEmails = bulkEmails;
        this.isBulkMode = true;
    }

    // =====================================================
    // EXECUTE
    // =====================================================

    public void execute(QueueableContext context) {

        try {

            // =================================================
            // BULK EMAIL MODE
            // =================================================

            if (isBulkMode) {

                System.debug(
                    '🚀 Processing Bulk Email Queue'
                );

                System.debug(
                    '📦 Bulk Payload: ' +
                    JSON.serializePretty(bulkEmails)
                );

                Map<String, Object> response =
                    EmailRelayService.sendBulkEmails(
                        bulkEmails
                    );

                System.debug(
                    '✅ Bulk Email Response: ' +
                    JSON.serializePretty(response)
                );

            }

            // =================================================
            // SINGLE EMAIL MODE
            // =================================================

            else {

                System.debug(
                    '🚀 Processing Single Email Queue'
                );

                Map<String, Object> response =
                    EmailRelayService.sendEmail(
                        fromEmail,
                        toEmails,
                        subject,
                        body,
                        attachments,
                        ccEmails,
                        bccEmails
                    );

                System.debug(
                    '✅ Single Email Response: ' +
                    JSON.serializePretty(response)
                );
            }

        } catch (Exception e) {

            System.debug(
                '❌ Queueable Email Error: ' +
                e.getMessage()
            );

            System.debug(
                '❌ Stack Trace: ' +
                e.getStackTraceString()
            );
        }
    }
}