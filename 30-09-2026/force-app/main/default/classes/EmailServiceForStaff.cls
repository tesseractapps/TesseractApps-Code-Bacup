/**
 * @description       : 
 * @author            : Raja Sekhar Reddy
 * @group             : 
 * @last modified on  : 05-23-2023
 * @last modified by  : Raja Sekhar Reddy
**/
public with sharing class EmailServiceForStaff {
    @future
	public static void sendingEmail(String sendingToEmail, String sendingToBccEmail, String applicationStatus, String name) {
		Messaging.SingleEmailMessage semail = new Messaging.SingleEmailMessage();
		semail.setSenderDisplayName(sendingToEmail);
        
        String[] sendingTo = new String[]{sendingToBccEmail};
		semail.setToAddresses(sendingTo);
        
		semail.setSubject('Job Application Status');
		semail.setPlainTextBody('Hi '+name+'\n\n'+'Congratulations your '+applicationStatus+'\n\n'+'Thanks');
		Messaging.sendEmail(new Messaging.SingleEmailMessage[] {semail});
	}


}