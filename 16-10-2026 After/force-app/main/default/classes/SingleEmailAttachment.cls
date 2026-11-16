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
        OrgWideEmailAddress oweaddress = [select Id,DisplayName from OrgWideEmailAddress where Address =:System.Label.OrgWideEmailAddress limit 1];
        semail.setOrgWideEmailAddressId(oweaddress.Id);
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
        // semail.setSenderDisplayName(orgName);
		Messaging.sendEmail(new Messaging.SingleEmailMessage[] {semail});
		//return null;
	
    }
    public static void sendPayrollEmail(Id staffPayrollId){

            User currentUser = [
                SELECT Id, Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];


            Organisation__c orgObj = [
                SELECT Id, Name, Email__c
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];


        Staff_Payroll_Setting__c sps = [
            SELECT Id,
                Resource_Name__c,
                Staff__r.Name,
                Staff__r.Last_Name__c,
                Staff__r.Email_Address__c,
                Payroll_Setting__r.Period_Start_Date__c,
                Payroll_Setting__r.Period_End_Date__c,
                Amazon_URL__c
            FROM Staff_Payroll_Setting__c
            WHERE Id = :staffPayrollId
            LIMIT 1
        ];


    String senderEmailAddress = orgObj.Email__c;


    // Format payroll dates
    String newDate = sps.Payroll_Setting__r.Period_Start_Date__c.format();
    String newfinalDate = sps.Payroll_Setting__r.Period_End_Date__c.format();


    // Subject
    String subject =
        'Pay slip for the period ' +
        newDate +
        ' to ' +
        newfinalDate;


    // Body
    String body =
        'Hi ' + sps.Staff__r.Name + ' ' + sps.Staff__r.Last_Name__c + ',' +
        '<br/><br/>' +
        'Please find attached your pay slip for the pay period ' +
        newDate +
        ' to ' +
        newfinalDate +
        '.' +
        '<br/><br/>' +
        'Thanks & Regards' +
        '<br/>' +
        'Administrator' +
        '<br/>' +
        orgObj.Name;


    // Prepare Email Payload
        Map<String, Object> emailPayload = new Map<String, Object>();

        emailPayload.put(
            'fromEmail',
            senderEmailAddress
        );

        emailPayload.put(
            'toEmail',
            new List<String>{
                sps.Staff__r.Email_Address__c
            }
        );

        emailPayload.put(
            'subject',
            subject
        );

        emailPayload.put(
            'body',
            body
        );


        // Attachment
        List<String> attachments = new List<String>();

        if(String.isNotBlank(sps.Amazon_URL__c)){
            attachments.add(sps.Amazon_URL__c);
        }

        if(!attachments.isEmpty()){
            emailPayload.put(
                'attachment',
                attachments
            );
        }


        // Add into bulk list
        List<Object> bulkEmails = new List<Object>();

        bulkEmails.add(emailPayload);


        if (!bulkEmails.isEmpty()) {

            Id jobId = System.enqueueJob(

                new EmailRelayQueueable(
                    bulkEmails
                )
            );

            System.debug(
                '✅ Bulk Email Queueable Created: ' +
                jobId
            );
        }

    }

}