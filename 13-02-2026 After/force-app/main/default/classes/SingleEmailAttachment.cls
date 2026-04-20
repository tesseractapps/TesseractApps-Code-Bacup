/**
 * @description       : 
 * @author            : Raja Sekhar Reddy
 * @group             : 
 * @Test			  : SingleEmailAttachmentTest
 * @last modified on  : 05-23-2023
 * @last modified by  : Raja Sekhar Reddy
**/
public with sharing class SingleEmailAttachment {
    @AuraEnabled
    public static void emailAttach(String base64,String staffEmail,String subjectName,String startEndDate,String orgEmail,String orgName){

        String sendTouser = staffEmail;
               
        String base64Content = ( String ) JSON.deserialize( base64, String.class );
        Blob attachmentBody = EncodingUtil.base64Decode(base64Content);
        
        
        Messaging.SingleEmailMessage semail = new Messaging.SingleEmailMessage();
        // OrgWideEmailAddress oweaddress = [select Id,DisplayName from OrgWideEmailAddress where Address =:System.Label.OrgWideEmailAddress limit 1];
        // semail.setOrgWideEmailAddressId(oweaddress.Id);
       /* string[] splitted = orgEmail.split('\\@');
        String finalEmail ='Noreply@'+splitted[1];
        semail.setSenderDisplayName(finalEmail); */
        
        String[] sendingTo = new String[]{sendTouser};
		semail.setToAddresses(sendingTo);

		Messaging.EmailFileAttachment efa = new Messaging.EmailFileAttachment();
       	efa.setFileName('PaySlip.pdf');
       	efa.setBody(attachmentBody);
        semail.setFileAttachments(new Messaging.EmailFileAttachment[] {efa});
        semail.setSaveAsActivity(true);
	        
		semail.setSubject(subjectName);
		semail.setPlainTextBody('Hi '+'\n\n'+startEndDate+'\n\n'+'Thanks & Regards'+'\n'+'Administrator'+'\n'+orgName);
        semail.setSenderDisplayName(orgName);
		Messaging.sendEmail(new Messaging.SingleEmailMessage[] {semail});
		//return null;
	
    }

}