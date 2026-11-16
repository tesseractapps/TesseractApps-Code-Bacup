public class TSign_RecipientEmailSender {
    // public static void sendToRecipient(list<Child_Signatures__c> ChildSignatures){
    //     string recordId=ChildSignatures[0].Offer_Template__c;
    //     system.debug('record '+recordId);
    //     startEmailSequence(recordId);
    // }
 
    public static void sendToRecipient(
        List<TSign_Child_Signature__c> childSignatures
    ) {
        if (childSignatures == null || childSignatures.isEmpty()) {
            return;
        }
 
        TSign_Child_Signature__c childSignature = childSignatures[0];
 
        if (childSignature.TSign_Offer_Template__c == null) {
            System.debug('No Offer Template found on Child Signature.');
            return;
        }
 
        String recordId = childSignature.TSign_Offer_Template__c;
 
        System.debug('Offer Template ==> ' + recordId);
        System.debug('Child Signature ==> ' + childSignature.Id);
        System.debug('Recipient ==> ' + childSignature.Recipient_Email__c);
 
        startEmailSequence(
            recordId,
            childSignature.Id
        );
    }
 
   
//     @AuraEnabled
// public static String startEmailSequence(String recordId, String childSignatureId) {
//     try {
//         System.debug('startEmailSequence method start');
//         System.debug('Record ID: ' + recordId);
 
//         // Fetch the Offer_Template__c record to retrieve recipient details
//         Offer_Template__c template = [
//             SELECT Id, All_Recipients__c, Current_Recipient__c, Current_Recipient_Status__c
//             FROM Offer_Template__c
//             WHERE Id = :recordId
//             LIMIT 1
//         ];
 
//         if (String.isEmpty(template.All_Recipients__c)) {
//             System.debug('AAAAAA');
//             throw new AuraHandledException('No recipients are listed in the template.');
//         }
 
//         // Split emails by new line into a list
//         List<String> emailList = template.All_Recipients__c.split('\n');
//         if (emailList.isEmpty()) {
//             System.debug('BBBB');
//             throw new AuraHandledException('No recipients are listed in the template.');
//         }
 
//         // Find the current recipient index
//         Integer currentIndex = emailList.indexOf(template.Current_Recipient__c);
 
//         // Determine the next recipient
//         String nextRecipient;
//         if (String.isEmpty(template.Current_Recipient__c) || currentIndex == -1) {
//             // If no current recipient, start with the first
//             nextRecipient = emailList[0];
//         } else if (currentIndex + 1 < emailList.size()) {
//             // If there are more recipients, move to the next one
//             nextRecipient = emailList[currentIndex + 1];
//         } else {
//             // If all recipients are processed, mark as completed
//             template.Current_Recipient_Status__c = 'Completed';
//             update template;
//             return 'Email sequence completed. No more recipients to notify.';
//         }
 
//         // Construct the URL for the next recipient
//         String baseUrl = Label.GuestTsignURL;
//         String dynamicUrl = baseUrl + '?recordId=' + recordId + '&email=' + nextRecipient;
       
//         System.debug('CCCCCC');
//         // Send email to the next recipient
//         //sendRecordEmail(recordId, nextRecipient, baseUrl);
//         sendRecordEmailAsync(recordId,nextRecipient,baseUrl);
//         System.debug('DDDDDD');
       
//         // Update the template with the new recipient and status
//         template.Current_Recipient__c = nextRecipient;
//         template.Current_Recipient_Status__c = 'Pending';
//         update template;
//      System.debug('EEEEEE '+ nextRecipient);
//         return 'Email sent to ' + nextRecipient;
//     } catch (Exception e) {
//         System.debug('Error initiating email sequence: ' + e.getMessage());
//         throw new AuraHandledException('Failed to start email sequence: ' + e.getMessage());
//     }
// }
 
@AuraEnabled
public static String startEmailSequence(
    String recordId,
    String childSignatureId
) {
    try {
 
        System.debug('startEmailSequence method start');
        System.debug('Offer Template ID ==> ' + recordId);
        System.debug('Child Signature ID ==> ' + childSignatureId);
 
        // --------------------------------------------------
        // Fetch Offer Template
        // --------------------------------------------------
 
            TSign_Offer_Template__c template = [
            SELECT
                Id,
                All_Recipients__c,
                Current_Recipient__c,
                Current_Recipient_Status__c
            FROM TSign_Offer_Template__c
            WHERE Id = :recordId
            LIMIT 1
        ];
 
        // --------------------------------------------------
        // Validate recipient list
        // --------------------------------------------------
 
        if (String.isBlank(template.All_Recipients__c)) {
            throw new AuraHandledException(
                'No recipients are listed in the template.'
            );
        }
 
        // --------------------------------------------------
        // Split recipients (trimmed, blank lines removed)
        // trim() also strips '\r' from "\r\n" line endings
        // --------------------------------------------------
 
        List<String> emailList = new List<String>();
 
        for (String recipient : template.All_Recipients__c.split('\n')) {
            if (String.isNotBlank(recipient)) {
                emailList.add(recipient.trim());
            }
        }
 
        if (emailList.isEmpty()) {
            throw new AuraHandledException(
                'No recipients are listed in the template.'
            );
        }
 
        // --------------------------------------------------
        // Find current recipient (case-insensitive, trimmed)
        // Was: emailList.indexOf(...) -> exact match, returned -1 on
        // any space / '\r' / case difference and re-emailed recipient 1
        // --------------------------------------------------
 
        Integer currentIndex = -1;
 
        if (String.isNotBlank(template.Current_Recipient__c)) {
 
            String current = template.Current_Recipient__c.trim();
 
            for (Integer i = 0; i < emailList.size(); i++) {
                if (emailList[i].equalsIgnoreCase(current)) {
                    currentIndex = i;
                    break;
                }
            }
        }
 
        // --------------------------------------------------
        // Determine next recipient
        // --------------------------------------------------
 
        String nextRecipient;
 
        if (currentIndex == -1) {
 
            // No current recipient yet -> first recipient
            nextRecipient = emailList[0];
 
        } else if (currentIndex + 1 < emailList.size()) {
 
            // Next recipient
            nextRecipient = emailList[currentIndex + 1];
 
        } else {
 
            // All recipients completed
            template.Current_Recipient_Status__c = 'Completed';
 
            update template;
 
            return 'Email sequence completed. No more recipients to notify.';
        }
 
        System.debug(
            'Next Recipient ==> ' +
            nextRecipient
        );
 
        // --------------------------------------------------
        // Find the Child Signature for this recipient
        // --------------------------------------------------
 
        TSign_Child_Signature__c recipientChildSignature;
 
        if (String.isNotBlank(childSignatureId)) {
 
            /*
             * Called from the trigger: use the inserted Child Signature,
             * but only if it belongs to the next recipient. Otherwise the
             * token and email would go to the wrong person.
             */
            recipientChildSignature = [
                SELECT
                    Id,
                    TSign_Offer_Template__c,
                    Recipient_Email__c
                FROM TSign_Child_Signature__c
                WHERE Id = :childSignatureId
                LIMIT 1
            ];
 
            String childEmail =
                recipientChildSignature.Recipient_Email__c == null
                ? ''
                : recipientChildSignature.Recipient_Email__c.trim();
 
            if (!childEmail.equalsIgnoreCase(nextRecipient)) {
                throw new AuraHandledException(
                    'Child Signature ' + recipientChildSignature.Id +
                    ' does not belong to the next recipient.'
                );
            }
 
            System.debug(
                'Using Child Signature from trigger ==> ' +
                recipientChildSignature.Id
            );
 
        } else {
 
            /*
             * Called without a Child Signature (e.g. manual resend):
             * use the latest one for this recipient, the same record
             * getChildSignatureDetails / getSignerLinkStatus read.
             */
            List<TSign_Child_Signature__c> childRecords = [
                SELECT
                    Id,
                    TSign_Offer_Template__c,
                    Recipient_Email__c
                FROM TSign_Child_Signature__c
                WHERE TSign_Offer_Template__c = :recordId
                AND Recipient_Email__c = :nextRecipient
                ORDER BY CreatedDate DESC
                LIMIT 1
            ];
 
            if (childRecords.isEmpty()) {
 
                throw new AuraHandledException(
                    'No Child Signature record found for recipient: ' +
                    nextRecipient
                );
            }
 
            recipientChildSignature = childRecords[0];
 
            System.debug(
                'Found Child Signature ==> ' +
                recipientChildSignature.Id
            );
        }
 
        // --------------------------------------------------
        // Base URL
        // --------------------------------------------------
 
        String baseUrl = Label.GuestTsignAppURL;
 
        // --------------------------------------------------
        // Send email asynchronously
        // (Link_Token__c is generated in sendRecordEmail)
        // --------------------------------------------------
 
        sendRecordEmailAsync(
            recordId,
            recipientChildSignature.Id,
            nextRecipient,
            baseUrl
        );
 
        System.debug(
            'Email request submitted for ==> ' +
            nextRecipient
        );
 
        // --------------------------------------------------
        // Update Offer Template
        // --------------------------------------------------
 
        template.Current_Recipient__c = nextRecipient;
 
        template.Current_Recipient_Status__c = 'Pending';
 
        update template;
 
        System.debug(
            'Current recipient updated ==> ' +
            nextRecipient
        );
 
        return 'Email sent to ' + nextRecipient;
 
    } catch (Exception e) {
 
        System.debug(
            'Error initiating email sequence: ' +
            e.getMessage()
        );
 
        System.debug(
            'Stack Trace: ' +
            e.getStackTraceString()
        );
 
        throw new AuraHandledException(
            'Failed to start email sequence: ' +
            e.getMessage()
        );
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
//      Datetime expirationTime = System.now().addDays(14);
 
 
       
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
//                    '<p>Note:<em> This link will expire in 14 days of issuance.</em></p>' +
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
 
// @future(callout=true)
// public static void sendRecordEmailAsync(
//     String recordId,
//     String email,
//     String baseUrl
// ){
//     sendRecordEmail(recordId,email,baseUrl);
// }
 
@future(callout=true)
public static void sendRecordEmailAsync(
    String recordId,
    String childSignatureId,
    String email,
    String baseUrl
) {
    sendRecordEmail(
        recordId,
        childSignatureId,
        email,
        baseUrl
    );
}
 
@AuraEnabled
public static void sendRecordEmail(String recordId,String childSignatureId,String email,String baseUrl){
 
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
        // Link_Active__c is intentionally not queried: querying it and then
        // running "update template" would write back a stale value.
        TSign_Offer_Template__c template = [
            SELECT Id,Expire__c,All_Recipients__c,All_Recipient_Names__c,TSign_Organisation__c,CreatedBy.TimeZoneSidKey,Sender_Name__c
            FROM TSign_Offer_Template__c
            WHERE Id = :recordId
            LIMIT 1
        ];
 
        TSign_Child_Signature__c childSignature = [
            SELECT
                Id,
                TSign_Offer_Template__c,
                Recipient_Email__c,
                Signature_URL__c,
                Expire__c,
                Link_Active__c,
                Email_Secure_Link__c,
                Status__c
            FROM TSign_Child_Signature__c
            WHERE Id = :childSignatureId
            LIMIT 1
        ];
 
        // --------------------------------------------------
        // Validate Child -> Offer Template relationship
        // --------------------------------------------------
 
        if (
            childSignature.TSign_Offer_Template__c != recordId
        ) {
            throw new AuraHandledException(
                'Child Signature does not belong to this Offer Template.'
            );
        }
 
        System.debug(
            'Child Signature Recipient ==> ' +
            childSignature.Recipient_Email__c
        );
 
        // Default Values
        String organisationName = 'TesseractApps';
        String senderEmailAddress = 'noreply@tesseractapps.com';
 
        // Fetch Organisation
        if(String.isNotBlank(template.TSign_Organisation__c)){
 
            TSign_Organisation__c orgObj = [
                SELECT Id,Name,Email__c
                FROM TSign_Organisation__c
                WHERE Id = :template.TSign_Organisation__c
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
 
        // Offer_Template__c.Link_Active__c is recipient 1's link.
        // Re-activate it only when this email is for recipient 1.
        // Recipients 2+ use their own Child_Signatures__c link, so
        // re-activating here would re-open recipient 1's submitted link.
        String firstRecipient = String.isNotBlank(template.All_Recipients__c)
            ? template.All_Recipients__c.split('\n')[0].trim()
            : '';
 
        if (firstRecipient.equalsIgnoreCase(email.trim())) {
            template.Link_Active__c = true;
        }
 
        // Expiry of this recipient's own link (what the signing page checks):
        // recipient 1 -> Offer_Template__c, recipients 2+ -> their Child_Signatures__c
        Datetime recipientExpiry =
            (firstRecipient.equalsIgnoreCase(email.trim()) || childSignature.Expire__c == null)
            ? expirationTime
            : childSignature.Expire__c;
 
               // Generate secure URL
        // Random 256-bit token (64 hex chars). No recordId / email in the URL,
        // so the link can't be decoded or edited to reach another signer.
        String linkToken = EncodingUtil.convertToHex(
            Crypto.generateAesKey(256)
        );
 
        // Store the token on the record the signing page checks for this recipient
        // (same rule as Link_Active__c / recipientExpiry above):
        // recipient 1 -> Offer_Template__c, recipients 2+ -> their Child_Signatures__c
        if (firstRecipient.equalsIgnoreCase(email.trim())) {
            template.Link_Token__c = linkToken;
        } else {
            childSignature.Link_Token__c = linkToken;
        }
 
        String secureUrl = baseUrl + '?t=' + linkToken;
 
        // Recipient name (saved name, else derived from email)
        String recipientName = resolveRecipientName(
            template.All_Recipients__c,
            template.All_Recipient_Names__c,
            email
        );
 
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
 
        '<p><em>' + buildExpiryNote(
            recipientExpiry,
            template.CreatedBy != null ? template.CreatedBy.TimeZoneSidKey : null
        ) + '</em></p>' +
 
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
 
        Map<String,Object> response =
            TSign_EmailRelayService.sendEmail(
                senderEmailAddress,
                toEmails,
                subject,
                body,
                attachments,
                ccEmails,
                bccEmails,
                template.Sender_Name__c
                 
            );
 
        System.debug('✅ Email sent successfully ==> ' + response);
 
           childSignature.Email_Secure_Link__c =
            secureUrl;
 
        update childSignature;
 
        System.debug(
            '✅ Child Signature updated ==> ' +
            childSignature.Id
        );
 
        System.debug(
            '✅ Secure link saved ==> ' +
            secureUrl
        );
 
        // Update after callout
        update template;
 
        System.debug('Email sent successfully to: ' + email);
 
    }catch(Exception ex){
 
        throw new AuraHandledException(
            'Error sending email: ' + ex.getMessage()
        );
    }
}
 
/**
 * Expiry note for the signing email (used by this class and TemplateController.sendRecordEmail).
 * Shows the exact expiry in UTC (the same for every recipient, wherever they are), e.g.
 * "Note: This link will expire on 12 Oct 2026 12:00 AM (UTC+00:00)."
 * senderTimeZone is currently not used (kept so callers stay unchanged).
 */
public static String buildExpiryNote(Datetime expiry, String senderTimeZone) {
    if (expiry == null) {
        return 'Note: This link will expire in 14 days of issuance.';
    }
 
    String expiryUtc = CompletionCertificateService.formatDateTimeWithOffset(
        expiry,
        CompletionCertificateService.DEFAULT_TIME_ZONE
    );
 
    return 'Note: This link will expire on <strong>' + expiryUtc + '</strong>.';
}
 
/**
 * Recipient name for the email greeting (used by this class, TemplateController.sendRecordEmail
 * and tSignDocsController.sendSignatureReminders).
 * Returns the name saved in All_Recipient_Names__c at the same position as the email in
 * All_Recipients__c (both newline-separated). Falls back to the name derived from the
 * email (e.g. john.smith@x.com -> "John smith") when no name is saved.
 */
public static String resolveRecipientName(String allRecipients, String allNames, String email) {
    if (String.isNotBlank(allRecipients) && String.isNotBlank(allNames) && String.isNotBlank(email)) {
        List<String> emails = allRecipients.split('\n', -1);
        List<String> names = allNames.split('\n', -1);
 
        for (Integer i = 0; i < emails.size() && i < names.size(); i++) {
            if (emails[i].trim().equalsIgnoreCase(email.trim()) && String.isNotBlank(names[i])) {
                return names[i].trim();
            }
        }
    }
 
    String recipientName = email.substringBefore('@');
    recipientName = recipientName.replace('.', ' ');
    return recipientName.capitalize();
}
}