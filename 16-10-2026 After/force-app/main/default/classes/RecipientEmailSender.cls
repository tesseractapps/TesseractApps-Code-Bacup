public class RecipientEmailSender {
    public static void sendToRecipient(list<Child_Signatures__c> ChildSignatures){
        string recordId=ChildSignatures[0].Offer_Template__c;
        system.debug('record '+recordId);
        startEmailSequence(recordId);
    }

    
    @AuraEnabled
public static String startEmailSequence(String recordId) {
    try {
        System.debug('startEmailSequence method start');
        System.debug('Record ID: ' + recordId);

        // Fetch the Offer_Template__c record to retrieve recipient details
        Offer_Template__c template = [
            SELECT Id, All_Recipients__c, Current_Recipient__c, Current_Recipient_Status__c
            FROM Offer_Template__c 
            WHERE Id = :recordId 
            LIMIT 1
        ];

        if (String.isEmpty(template.All_Recipients__c)) {
            System.debug('AAAAAA');
            throw new AuraHandledException('No recipients are listed in the template.');
        }

        // Split emails by new line into a list
        List<String> emailList = template.All_Recipients__c.split('\n');
        if (emailList.isEmpty()) {
            System.debug('BBBB');
            throw new AuraHandledException('No recipients are listed in the template.');
        }

        // Find the current recipient index
        Integer currentIndex = emailList.indexOf(template.Current_Recipient__c);

        // Determine the next recipient
        String nextRecipient;
        if (String.isEmpty(template.Current_Recipient__c) || currentIndex == -1) {
            // If no current recipient, start with the first
            nextRecipient = emailList[0];
        } else if (currentIndex + 1 < emailList.size()) {
            // If there are more recipients, move to the next one
            nextRecipient = emailList[currentIndex + 1];
        } else {
            // If all recipients are processed, mark as completed
            template.Current_Recipient_Status__c = 'Completed';
            update template;
            return 'Email sequence completed. No more recipients to notify.';
        }

        // Construct the URL for the next recipient
        String baseUrl = Label.GuestTsignURL;
        String dynamicUrl = baseUrl + '?recordId=' + recordId + '&email=' + nextRecipient;
        
        System.debug('CCCCCC');
        // Send email to the next recipient
        //sendRecordEmail(recordId, nextRecipient, baseUrl);
        sendRecordEmailAsync(recordId,nextRecipient,baseUrl);
        System.debug('DDDDDD');
        
        // Update the template with the new recipient and status
        template.Current_Recipient__c = nextRecipient;
        template.Current_Recipient_Status__c = 'Pending';
        update template;
		System.debug('EEEEEE '+ nextRecipient);
        return 'Email sent to ' + nextRecipient;
    } catch (Exception e) {
        System.debug('Error initiating email sequence: ' + e.getMessage());
        throw new AuraHandledException('Failed to start email sequence: ' + e.getMessage());
    }
}


//     @AuraEnabled
// public static void sendRecordEmail(String recordId, String email, String baseUrl) {
//     try {
//         // Validate email
//         if (String.isBlank(recordId) || String.isBlank(email) || String.isBlank(baseUrl)) {
//             system.debug('Blank');
//             throw new AuraHandledException('Record ID, Email, and Base URL are required.');
//         }

//         System.debug('Sending email to: ' + email + ' for recordId: ' + recordId);
//         // Set expiration time (14 days from now)
// 		Datetime expirationTime = System.now().addDays(14);


        
//         // Fetch Offer_Template__c record
//         Offer_Template__c template = [
//             SELECT Id, Expire__c, Link_Active__c, Orgnisation_Id__c
//             FROM Offer_Template__c 
//             WHERE Id = :recordId 
//             LIMIT 1
//         ];

//         Organisation__c org = [
//                 SELECT Name
//                 FROM Organisation__c
//                 WHERE Id = :template.Orgnisation_Id__c
//                 LIMIT 1
//         ];
        
//         system.debug('template==>'+template);
        
//         // Update the expiration timestamp and activate the link
//         template.Expire__c = expirationTime;
        
//         update template;
//         system.debug('after update');
//         // Combine recordId and email for encoding
//         String encodedExpiration = EncodingUtil.base64Encode(Blob.valueOf(expirationTime.format()));
//         String encodedData = EncodingUtil.base64Encode(Blob.valueOf('recordId=' + recordId + '&email=' + email + '&exp=' + encodedExpiration));
//         System.debug('Encoded data: ' + encodedData);

//         // Construct the full URL
//         String secureUrl = baseUrl + '?data=' + encodedData;

//         // Extract recipient's name from email address
//         String recipientName = email.substringBefore('@');
//         recipientName = recipientName.replace('.', ' '); // Replace dots with spaces (e.g., john.doe -> John Doe)
//         recipientName = recipientName.capitalize(); // Capitalize the first letter of each word (e.g., john doe -> John Doe)
//         System.debug('Extracted Recipient Name: ' + recipientName);

//         // Construct email subject and body
//         String subject = 'Action Required: Please Sign the Document';
        
//         String body = '<p>Dear ' + recipientName + ',</p>' +
//                       '<p>I hope this email finds you well.</p>' +
//                       '<p>We have prepared a document that requires your signature. To ensure a smooth and efficient process, we are using T-sign, a secure and convenient electronic signature service.</p>' +
//                       '<p><strong>Please follow these steps to sign the document:</strong></p>' +
//                       '<ol>' +
//                       '<li><strong>Click the button below:</strong> This will take you directly to the document.</li>' +
//                       '</ol>' +
//                       '<p>' +
//                       '<a href="' + secureUrl + '" style="background-color: #0070d2; color: white; justify-content: center; padding: 10px 20px; text-decoration: none; border-radius: 8px; display: inline-block;">View and Sign Document</a>' +
//                       '</p>' +
//             		  '<p>Note:<em> This link will expire in 14 days of issuance.</em></p>' +
//                       '<ol start="2">' +
//                       '<li><strong>Review the document:</strong> Carefully read through the document to ensure all information is correct.</li>' +
//                       '<li><strong>Sign the document:</strong> Follow the prompts to add your electronic signature.</li>' +
//                       '<li><strong>Complete the process:</strong> Once you have signed, click "Finish" to complete the process.</li>' +
//                       '</ol>' +
//                       '<p>If you have any questions or need assistance, please do not hesitate to contact <a href="[Message chatter link here]">[Message chatter link here]</a>.</p>' +
//                       '<p><strong>DO NOT SHARE THIS EMAIL:</strong></p>' +
//                       '<p>This email contains a secure link to T-sign. Please do not share this email or link with others.</p>' +
//                       '<p>Thank you for your prompt attention to this matter.</p>' +
//                       '<p>Best regards,</p>' +
//                       '<p>TesseractApps</p>';
        
//         List<OrgWideEmailAddress> oweList = [
//     SELECT Id 
//     FROM OrgWideEmailAddress 
//     WHERE Address =: System.Label.OrgWideEmailAddress 
//     LIMIT 1
// ];

// if (oweList.isEmpty()) {
//     System.debug('⚠️ OrgWideEmailAddress not found');
//     return; // DO NOT THROW
// }

// OrgWideEmailAddress orgWideEmail = oweList[0];
        
        
//         // Send the email
//         Messaging.SingleEmailMessage emailMessage = new Messaging.SingleEmailMessage();
//         emailMessage.setToAddresses(new String[] { email });
//         emailMessage.setSubject(subject);
//         emailMessage.setHtmlBody(body);
//         emailMessage.setOrgWideEmailAddressId(orgWideEmail.Id);
//         Messaging.sendEmail(new Messaging.SingleEmailMessage[] { emailMessage });

//         System.debug('Email sent successfully to: ' + email);
//     } catch (Exception ex) {
//         throw new AuraHandledException('Error sending email: ' + ex.getMessage());
//     }
// }

@future(callout=true)
public static void sendRecordEmailAsync(
    String recordId,
    String email,
    String baseUrl
){
    sendRecordEmail(recordId,email,baseUrl);
}

@AuraEnabled
public static void sendRecordEmail(String recordId,String email,String baseUrl){

    try{

        // Validate email
        if(String.isBlank(recordId) || String.isBlank(email) || String.isBlank(baseUrl)){
            System.debug('Blank');
            throw new AuraHandledException('Record ID, Email, and Base URL are required.');
        }

        System.debug('Sending email to: ' + email + ' for recordId: ' + recordId);

        // Set expiration time
        Datetime expirationTime = System.now().addDays(14);

        // Fetch Offer Template
        Offer_Template__c template = [
            SELECT Id,Expire__c,Link_Active__c,Orgnisation_Id__c
            FROM Offer_Template__c
            WHERE Id = :recordId
            LIMIT 1
        ];

        // Default Values
        String organisationName = 'TesseractApps';
        String senderEmailAddress = 'noreply@tesseractapps.com';

        // Fetch Organisation
        if(String.isNotBlank(template.Orgnisation_Id__c)){

            Organisation__c orgObj = [
                SELECT Id,Name,Email__c
                FROM Organisation__c
                WHERE Id = :template.Orgnisation_Id__c
                LIMIT 1
            ];

            if(orgObj != null && String.isNotBlank(orgObj.Name)){
                organisationName = orgObj.Name;
            }

            if(orgObj != null && String.isNotBlank(orgObj.Email__c)){
                senderEmailAddress = orgObj.Email__c;
            }
        }

        System.debug('Organisation Name ==> ' + organisationName);
        System.debug('Sender Email ==> ' + senderEmailAddress);

        // Update values only
        template.Expire__c = expirationTime;
        template.Link_Active__c = true;

        // Generate secure URL
        String encodedExpiration = EncodingUtil.base64Encode(
            Blob.valueOf(expirationTime.format())
        );

        String encodedData = EncodingUtil.base64Encode(
            Blob.valueOf(
                'recordId=' + recordId +
                '&email=' + email +
                '&exp=' + encodedExpiration
            )
        );

        System.debug('Encoded data: ' + encodedData);

        String secureUrl = baseUrl + '?data=' + encodedData;

        // Extract recipient name
        String recipientName = email.substringBefore('@');
        recipientName = recipientName.replace('.', ' ');
        recipientName = recipientName.capitalize();

        System.debug('Extracted Recipient Name: ' + recipientName);

        // Subject
        String subject = 'Action Required: Please Sign the Document';

        // Logo URL
        String TsignlogoUrl =
            URL.getOrgDomainUrl().toExternalForm() +
            '/resource/Te_sign';

        // Email Body
        String body =
        '<p>Dear ' + recipientName + ',</p>' +
        '<p>I hope this email finds you well.</p>' +
        '<p>We have prepared a document that requires your signature. To ensure a smooth and efficient process, we are using T-sign, a secure and convenient electronic signature service.</p>' +

        '<p><strong>Please follow these steps to sign the document:</strong></p>' +

        '<ol>' +
        '<li><strong>Click the button below:</strong> This will take you directly to the document.</li>' +
        '</ol>' +

        '<p>' +
        '<a href="' + secureUrl + '" style="background-color:#0070d2;color:white;padding:10px 20px;text-decoration:none;border-radius:8px;display:inline-block;">View and Sign Document</a>' +
        '</p>' +

        '<p><em>Note: This link will expire in 14 days of issuance.</em></p>' +

        '<ol start="2">' +
        '<li><strong>Review the document:</strong> Carefully read through the document to ensure all information is correct.</li>' +
        '<li><strong>Sign the document:</strong> Follow the prompts to add your electronic signature.</li>' +
        '<li><strong>Complete the process:</strong> Once you have signed, click "Finish" to complete the process.</li>' +
        '</ol>' +

        '<p>If you have any questions or need assistance, please contact support.</p>' +

        '<p><strong>DO NOT SHARE THIS EMAIL:</strong></p>' +

        '<p>This email contains a secure link to T-sign. Please do not share this email or link with others.</p>' +

        '<p>Thank you for your prompt attention to this matter.</p>' +

        '<p>Best regards,</p>' +
        '<p>' + organisationName + '</p>';

        // Send Email Using Relay Service
        List<String> toEmails = new List<String>{email};

        List<String> attachments = new List<String>();
        List<String> ccEmails = new List<String>();
        List<String> bccEmails = new List<String>();
		if (!Test.isRunningTest()) {

        Map<String,Object> response =
            EmailRelayService.sendEmail(
                senderEmailAddress,
                toEmails,
                subject,
                body,
                attachments,
                ccEmails,
                bccEmails
            );

        System.debug('✅ Email sent successfully ==> ' + response);
        }
        // Update after callout
        update template;

        System.debug('Email sent successfully to: ' + email);

    }catch(Exception ex){

        throw new AuraHandledException(
            'Error sending email: ' + ex.getMessage()
        );
    }
}
}