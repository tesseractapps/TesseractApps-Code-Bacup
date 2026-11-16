public with sharing class EmailController {
    @AuraEnabled
    public static void sendEmailWithCustomBody(String htmlContent, String plainTextBody, String formType) {
        if (String.isBlank(htmlContent) || String.isBlank(plainTextBody)) {
            throw new AuraHandledException('HTML content and plain text body cannot be null or blank.');
        }

        Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();

        // Use Org-Wide Email Address
        OrgWideEmailAddress orgWideEmail = [
            SELECT Id 
            FROM OrgWideEmailAddress 
            WHERE Address =: System.Label.OrgWideEmailAddress 
            LIMIT 1
        ];
        mail.setOrgWideEmailAddressId(orgWideEmail.Id);       
        

        // Set recipient
        mail.setToAddresses(new List<String>{'prameela.kesavadasu@tesseractapps.com'});

        // Set subject
        mail.setSubject('Captured Layout Submission - ' + formType);

        // Set HTML and PlainText body
        mail.setHtmlBody(htmlContent);
        mail.setPlainTextBody(plainTextBody);

        // Debugging to ensure both bodies are included
        System.debug('HTML Content: ' + htmlContent);
        System.debug('PlainText Body: ' + plainTextBody);

        // Send the email
        Messaging.sendEmail(new Messaging.SingleEmailMessage[] { mail });
    }
}