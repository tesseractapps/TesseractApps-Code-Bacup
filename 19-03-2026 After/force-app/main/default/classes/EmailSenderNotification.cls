public class EmailSenderNotification {
    public static SendEmailResult sendSingleEmail(String[] toAddresses, String subject, String body) {
        SendEmailResult result = new SendEmailResult();  
        try {
            Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
            email.setToAddresses(toAddresses);
            email.setSubject(subject);
            email.setHtmlBody(body);
            email.setSaveAsActivity(false);
            
            Messaging.sendEmail(new Messaging.SingleEmailMessage[]{email});
            
            result.isSuccess = true;
            result.message = 'Email sent successfully';
             
        } catch (Exception e) {
            result.isSuccess = false;
            result.message = 'Error: ' + e.getMessage();
        }
        
        return result;
    }
    
    public class SendEmailResult {
        public Boolean isSuccess { get; set; }
        public String message { get; set; }
    }  
}