public class OfferEmailQueueable
implements Queueable, Database.AllowsCallouts {

    private String fromEmail;
    private String toEmail;
    private String body;
    private String subject;

    public OfferEmailQueueable(
        String fromEmail,
        String toEmail,
        String subject,
        String body
    ) {
        this.fromEmail = fromEmail;
        this.toEmail = toEmail;
        this.subject = subject;
        this.body = body;
    }

    public void execute(QueueableContext qc) {

        try {

            Map<String,Object> response =
                EmailRelayService.sendEmail(
                    fromEmail,
                    new List<String>{toEmail},
                    subject,
                    body,
                    null,
                    null,
                    null
                );

            System.debug(
                'EMAIL RELAY RESPONSE => ' +
                JSON.serializePretty(response)
            );

        } catch(Exception e) {

            System.debug(
                'EMAIL RELAY ERROR => ' +
                e.getMessage()
            );
        }
    }
}