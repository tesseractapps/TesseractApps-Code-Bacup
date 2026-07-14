public without sharing class TemplateController {
    /**
* Creates an Offer_Template__c record.
*/
@AuraEnabled
public static String createOfferTemplate(
    String fileName,
    String picklistValue,
    String orgId,
    String serviceId,
    String quoteId,
    String formId,   // ✅ NEW
    String hrId,
    String url
) {
    try {
        Offer_Template__c newRecord = new Offer_Template__c();
        newRecord.File_Name__c = fileName;
        newRecord.Orgnisation_Id__c = orgId;
        newRecord.Amazon_Url__c = url;

        // ✅ Preserve current behavior for Type__c
        newRecord.Type__c = picklistValue; // Default / Service / Quote / Forms

        // ✅ Existing: Service
        if (!String.isBlank(serviceId)) {
            newRecord.ServiceId__c = serviceId;
        }

        // ✅ Existing: Quote
        if (!String.isBlank(quoteId)) {
            newRecord.NDIS_Quote__c = quoteId;
        }

        // ✅ NEW: Forms
        if (!String.isBlank(formId)) {
            newRecord.Dynamic_Form_Response__c = formId;
            newRecord.Type__c = 'Forms';
        }

        if (!String.isBlank(hrId)) {            newRecord.Participant_Template__c  = hrId;            newRecord.Type__c = 'HR';
        }

        newRecord.Sender_Email__c =
            [SELECT Email FROM User WHERE Id = :UserInfo.getUserId()].Email;

        insert newRecord;
        return newRecord.Id;

    } catch (Exception ex) {
        System.debug('❌ Error creating Offer_Template__c record: ' + ex.getMessage());
        throw new AuraHandledException('Error creating record: ' + ex.getMessage());
    }
}

    
    @AuraEnabled
public static void deleteOfferTemplate(String recordId) {
    try {
        Offer_Template__c recordToDelete = [SELECT Id FROM Offer_Template__c WHERE Id = :recordId LIMIT 1];
        delete recordToDelete;
    } catch (Exception ex) {
        throw new AuraHandledException('Error deleting record: ' + ex.getMessage());
    }
}



    
    /**
* Retrieves the AWS S3 URL from the Offer_Template__c record.
*/
    @AuraEnabled
    public static String getUploadedFileUrl(String recordId) {
        try {
            Offer_Template__c record = [
                SELECT Amazon_Url__c
                FROM Offer_Template__c
                WHERE Id = :recordId
                LIMIT 1
            ];
            return record.Amazon_Url__c;        } catch (Exception ex) {            throw new AuraHandledException('Error retrieving file URL: ' + ex.getMessage());
        }
    }
    
    @AuraEnabled
    public static void savePlaceholders(String recordId, String placeholderJSON) {
        try {
            Offer_Template__c record = [
                SELECT Id
                FROM Offer_Template__c
                WHERE Id = :recordId
                LIMIT 1
            ];
            record.Placeholder_JSON__c = placeholderJSON;
            update record;        } catch (Exception ex) {            throw new AuraHandledException('Error saving placeholders: ' + ex.getMessage());
        }
    }
    
    /**
* Retrieves the placeholder JSON data from the Offer_Template__c record.
*/
    @AuraEnabled(cacheable=true)
    public static String getPlaceholders(String recordId) {
        try {
            Offer_Template__c record = [
                SELECT Placeholder_JSON__c
                FROM Offer_Template__c
                WHERE Id = :recordId
                LIMIT 1
            ];
            return record.Placeholder_JSON__c;
        } catch (Exception ex) {
            throw new AuraHandledException('Error retrieving placeholders: ' + ex.getMessage());
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Offer_Template__c> getOfferTemplates(String searchKey) {
        try {
            String searchTerm = '%' + searchKey + '%';
            return [
                SELECT Id, Name, File_Name__c, Amazon_Url__c, Placeholder_JSON__c
                FROM Offer_Template__c
                WHERE File_Name__c LIKE :searchTerm                ORDER BY CreatedDate DESC            ];        } catch (Exception ex) {            throw new AuraHandledException('Error retrieving offer templates: ' + ex.getMessage());
        }
    }
    
    @AuraEnabled
    public static void updateNameInPdfId(String name, String recordId) {
        try {
            System.debug('Input Name: ' + name);
            System.debug('Input Record ID: ' + recordId);
            
            if (String.isBlank(recordId)) {                throw new AuraHandledException('Record ID is missing or invalid.');
            }
            
            Offer_Template__c template = [
                SELECT Id, pdfID__c 
                FROM Offer_Template__c 
                WHERE Id = :recordId 
                LIMIT 1
            ];
            System.debug('Retrieved Template: ' + template);
            
            if (template == null) {                throw new AuraHandledException('No record found for the given ID.');
            }
            
            // Update the pdfID__c field
            template.pdfID__c = name;
            update template;
            
            System.debug('Successfully updated pdfID__c: ' + template.pdfID__c);
        } catch (Exception ex) {
            System.debug('Error in updateNameInPdfId: ' + ex.getMessage());
            throw new AuraHandledException('Error updating name in pdfID__c: ' + ex.getMessage());
        }
    }
   
    @AuraEnabled(cacheable=true)
    public static String getPlaceholdersForTemplate(String recordId) {
        try {
            Offer_Template__c record = [
                SELECT Placeholder_JSON__c, Amazon_Url__c
                FROM Offer_Template__c
                WHERE Id = :recordId
                LIMIT 1
            ];
            return JSON.serialize(new Map<String, Object>{
                'placeholders' => record.Placeholder_JSON__c,
                    'imageUrl' => record.Amazon_Url__c
                    });
        } catch (Exception ex) {
            throw new AuraHandledException('Error retrieving placeholders: ' + ex.getMessage());
        }
    }
    @AuraEnabled(cacheable=true)
    public static List<Offer_Template__c> getAllOfferTemplates() {
        try {
            return [
                SELECT Id, File_Name__c, Amazon_Url__c, Placeholder_JSON__c
                FROM Offer_Template__c
                ORDER BY CreatedDate DESC
            ];
        } catch (Exception ex) {
            throw new AuraHandledException('Error fetching offer templates: ' + ex.getMessage());
        }
    }   
    
    @AuraEnabled
    public static void saveImageToSalesforce(String recordId, String base64Content) {
        try {
            // Fetch the record
            Offer_Template__c record = [
                SELECT Id, Sign_Base64__c
                FROM Offer_Template__c
                WHERE Id = :recordId
                LIMIT 1
            ];
            
            // Save the Base64 content
            record.Sign_Base64__c = base64Content;
            update record;
            
            System.debug('Base64 content saved to Sign_Base64__c.');
        } catch (Exception ex) {
            System.debug('Error saving Base64 content: ' + ex.getMessage());
            throw new AuraHandledException('Error saving Base64 content: ' + ex.getMessage());
        }
    }
    
    
    //Sample
    //
    @AuraEnabled
    public static void uploadImageAsPdfToAWS(Id recordId, String imageBase64, String fileName) {
        try {
            // Step 1: Convert Base64 image to a PDF Blob
            Blob pdfBlob = convertImageToPdf(imageBase64);
            
            // Step 2: Encode the PDF Blob to Base64
            String base64Pdf = EncodingUtil.base64Encode(pdfBlob);
            
            // Step 3: Call uploadFileToAWS to upload the PDF to AWS
            AWSS3FileUploadController.uploadFile(base64Pdf, fileName, recordId, 'offerLetter');
            
            // Log a success message for debugging purposes
            System.debug('File successfully uploaded to AWS and URL updated in Offer_Template__c.');
        } catch (Exception ex) {
            System.debug('Error uploading image as PDF: ' + ex.getMessage());
            throw new AuraHandledException('Failed to upload image as PDF: ' + ex.getMessage());
        }
    }
    
    // Helper Method to Convert Base64 Image to PDF Blob
    public static Blob convertImageToPdf(String base64Image) {
        try {
            // Generate a simple PDF with the image
            String htmlContent = '<html><body><img src="data:image/png;base64,' + base64Image + '"/></body></html>';
            PageReference pdfPage = new PageReference('/apex/PdfPage'); // Replace with a valid Visualforce page if needed
            pdfPage.getParameters().put('htmlContent', htmlContent);
            pdfPage.setRedirect(false);
            return pdfPage.getContentAsPDF();
        } catch (Exception ex) {
            System.debug('Error creating PDF from Base64 image: ' + ex.getMessage());
            throw new AuraHandledException('Error creating PDF: ' + ex.getMessage());
        }
    }
    
    @AuraEnabled
    public static String getImageBase64(String recordId) {
        try {
            Offer_Template__c record = [
                SELECT Sign_Base64__c
                FROM Offer_Template__c
                WHERE Id = :recordId
                LIMIT 1
            ];
            return record.Sign_Base64__c;        } catch (Exception ex) {            throw new AuraHandledException('Error retrieving Base64 data: ' + ex.getMessage());
        }
    }
    
    @AuraEnabled
    public static void saveEmailsToBackend(String recordId, String emails, String newJoineeEmail) {
        System.debug('Starting to save emails. Record ID: ' + recordId + ', Emails: ' + emails);
        
        if (String.isEmpty(emails)) {            System.debug('No emails provided.');            throw new AuraHandledException('Emails cannot be empty.');
        }
        
        // Split and clean up the email list
        List<String> emailList = new List<String>();
        for (String email : emails.split('\n')) {
            if (!String.isEmpty(email) && email.contains('@')) { // Basic validation for '@'
                emailList.add(email.trim());
            }
        }
        
        if (emailList.isEmpty()) {
            System.debug('No valid email addresses found after parsing.');
            throw new AuraHandledException('No valid email addresses found.');
        }
        
        // Prepend the New Joinee Email if it's valid and not already included
        if (!String.isEmpty(newJoineeEmail) && newJoineeEmail.contains('@') && !emailList.contains(newJoineeEmail)) {
            emailList.add(0, newJoineeEmail.trim()); // Ensure New Joinee Email is at the top
            System.debug('New Joinee Email added.');
        }
        
        try {
            Offer_Template__c record = [SELECT Id, All_Recipients__c FROM Offer_Template__c WHERE Id = :recordId LIMIT 1];
            String existingEmails = record.All_Recipients__c;
            
            // Create a single string from the email list, joined by new lines
            String newEmailString = String.join(emailList, '\n');
            if (existingEmails != newEmailString) {
                record.All_Recipients__c = newEmailString;
                update record;
                System.debug('Emails updated successfully to: ' + record.All_Recipients__c);
            } else {
                System.debug('No update required. Existing emails match the new email list.');
            }
        } catch (Exception ex) {
            System.debug('Exception caught during email saving: ' + ex.getMessage());
            throw new AuraHandledException('Failed to save emails: ' + ex.getMessage());
        }
    }
    
    @AuraEnabled
    public static void saveFirstName(String recordId, String name) {
        try {
            // Fetch the record
            Offer_Template__c record = [
                SELECT Id, First_Name__c
                FROM Offer_Template__c
                WHERE Id = :recordId
                LIMIT 1
            ];
            
            // Save the name
            record.First_Name__c = name;
            update record;
            
            System.debug('Name saved to First_Name__c.');
        } catch (Exception ex) {
            System.debug('Error saving name: ' + ex.getMessage());
            throw new AuraHandledException('Error saving name: ' + ex.getMessage());
        }
    }
        
    @AuraEnabled(cacheable=true)
    public static Offer_Template__c getOfferTemplateDetails(String recordId) {
        try {
            Offer_Template__c record = [
                SELECT Expire__c, Link_Active__c 
                FROM Offer_Template__c 
                WHERE Id = :recordId
                LIMIT 1
            ];
            return record;
        } catch (Exception ex) {
            throw new AuraHandledException('Error retrieving template details: ' + ex.getMessage());
        }
    }
    
    /*@AuraEnabled(cacheable = true)
    public static Child_Signatures__c getChildSignatureDetails(String recordId) {
    try {
    Child_Signatures__c childRecord = [
    SELECT Name, Signature_URL__c, Expire__c, Link_Active__c, Offer_Template__c
    FROM Child_Signatures__c
    WHERE Offer_Template__c = :recordId
    ORDER BY CreatedDate DESC
    LIMIT 1
    ];
    return childRecord;
    } catch (Exception ex) {
    throw new AuraHandledException('Error retrieving child signature details: ' + ex.getMessage());
    }
    }*/
    
    @AuraEnabled(cacheable = true)
    public static Child_Signatures__c getChildSignatureDetails(String recordId, String currentUserEmail) {
        try {
            System.debug('Fetching child signature details for Record ID: ' + recordId + ' and Email: ' + currentUserEmail);
            
            // Fetch all child records in descending order of creation
            List<Child_Signatures__c> childRecords = [
                SELECT Name, Signature_URL__c, Expire__c, Link_Active__c, Offer_Template__c, Recipient_Email__c
                FROM Child_Signatures__c
                WHERE Offer_Template__c = :recordId
                ORDER BY CreatedDate DESC
            ];
            
            // Iterate to find the record with matching Recipient_Email__c
            for (Child_Signatures__c record : childRecords) {
                if (record.Recipient_Email__c == currentUserEmail) {
                    System.debug('✅ Found matching record for email: ' + currentUserEmail);
                    return record;
                }
            }
            
            // If no match found, throw an error
            throw new AuraHandledException('No matching child signature found for the provided email.');
            
        } catch (Exception ex) {
            System.debug('🚨 Error retrieving child signature details: ' + ex.getMessage());
            throw new AuraHandledException('Error retrieving child signature details: ' + ex.getMessage());
        }
    }
    
    // @AuraEnabled
    // public static void sendRecordEmail(String recordId, String email, String baseUrl) {
    //     try {
    //         // Validate email
    //         if (String.isBlank(recordId) || String.isBlank(email) || String.isBlank(baseUrl)) {
    //             throw new AuraHandledException('Record ID, Email, and Base URL are required.');
    //         }
            
    //         System.debug('Sending email to: ' + email + ' for recordId: ' + recordId);
    //         // Set expiration time (14 days from now)
    //         Datetime expirationTime = System.now().addDays(14);
    //         //Datetime expirationTime = System.now().addMinutes(5);

            
    //         // Fetch Offer_Template__c record
    //         // Step 1: Fetch template
    //        // Step 1: Fetch Offer Template
    //         Offer_Template__c template = [
    //             SELECT Id,
    //             Expire__c,
    //             Link_Active__c,
    //             Orgnisation_Id__c FROM Offer_Template__c WHERE Id = : recordId LIMIT 1
    //         ];
    //         // ======================================
    //         // Step 2: Fetch Organisation Details
    //         // ======================================
    //         // Default Values
    //         String organisationName = 'TesseractApps';
    //         String senderEmailAddress = 'noreply@tesseractapps.com';
    //         if (String.isNotBlank(template.Orgnisation_Id__c)) {
    //             Organisation__c orgObj = [
    //                 SELECT Id,
    //                 Name,
    //                 Email__c FROM Organisation__c WHERE Id = : template.Orgnisation_Id__c LIMIT 1
    //             ];
    //             // Set Organisation Name
    //             if (orgObj != null && String.isNotBlank(orgObj.Name)) {
    //                 organisationName = orgObj.Name;
    //             }
    //             // Set Sender Email
    //             if (orgObj != null && String.isNotBlank(orgObj.Email__c)) {
    //                 senderEmailAddress = orgObj.Email__c;
    //             }
    //         }
    //         System.debug('Organisation Name ==> ' + organisationName);
    //         System.debug('Sender Email ==> ' + senderEmailAddress);

    //         System.debug('System.now(): ' + System.now());
    //         System.debug('Expire Time (UTC): ' + System.now().addMinutes(2));
    //         System.debug('User Time Zone: ' + UserInfo.getTimeZone());

            
    //         // Update the expiration timestamp and activate the link
    //         template.Expire__c = expirationTime;
    //         template.Link_Active__c = true;
    //         update template;
            
    //         // Combine recordId and email for encoding
    //         String encodedExpiration = EncodingUtil.base64Encode(Blob.valueOf(expirationTime.format()));
    //         String encodedData = EncodingUtil.base64Encode(Blob.valueOf('recordId=' + recordId + '&email=' + email + '&exp=' + encodedExpiration));
    //         System.debug('Encoded data: ' + encodedData);
            
    //         // Construct the full URL
    //         String secureUrl = baseUrl + '?data=' + encodedData;
    //         String orgBaseUrl = System.URL.getOrgDomainUrl().toExternalForm();
    //         String logoUrl = orgBaseUrl + '/resource/Te_sign'; // Static Resource path
    //         System.debug('url: ' + secureUrl);
            
    //         // Extract recipient's name from email address
    //         String recipientName = email.substringBefore('@');
    //         recipientName = recipientName.replace('.', ' '); // Replace dots with spaces (e.g., john.doe -> John Doe)
    //         recipientName = recipientName.capitalize(); // Capitalize the first letter of each word (e.g., john doe -> John Doe)
    //         System.debug('Extracted Recipient Name: ' + recipientName);
            
    //         String subject = 'Action Required: Please Sign the Document';

    //         String TsignlogoUrl = URL.getOrgDomainUrl().toExternalForm() + '/resource/Te_sign';

    //         String body = '<!DOCTYPE html>' +
    //         '<html>' +
    //         '<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">' +

    //         '<div style="max-width: 700px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #ddd;">' +

    //             // Header with logo and title
    //             '<div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 30px; ' +
    //                         'background-color: #ffffff; border-bottom: 1px solid #eee; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);">' +
    //                 '<h2 style="margin: 0; color: #003466;">Action Required</h2>' +
    //                 '<img src="' + TsignlogoUrl + '" alt="Tsign" style="height: 40px;" />' +
    //             '</div>' +

    //             // Email body content
    //             '<div style="padding: 30px; font-size: 14px; color: #333;">' +

    //                 '<p>Dear ' + recipientName + ',</p>' +
    //                 '<p>I hope this email finds you well.</p>' +
    //                 '<p>We have prepared a document that requires your signature. To ensure a smooth and efficient process, we are using T-sign, a secure and convenient electronic signature service.</p>' +
    //                 '<p><strong>Please follow these steps to sign the document:</strong></p>' +
    //                 '<ol>' +
    //                     '<li><strong>Click the button below:</strong> This will take you directly to the document.</li>' +
    //                 '</ol>' +

    //                 '<p style="text-align: center; margin: 20px 0;">' +
    //                     '<a href="' + secureUrl + '" style="background-color: #0070d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; display: inline-block;">View and Sign Document</a>' +
    //                 '</p>' +

    //                 '<p><em>Note: This link will expire in 14 days of issuance.</em></p>' +

    //                 '<ol start="2">' +
    //                     '<li><strong>Review the document:</strong> Carefully read through the document to ensure all information is correct.</li>' +
    //                     '<li><strong>Sign the document:</strong> Follow the prompts to add your electronic signature.</li>' +
    //                     '<li><strong>Complete the process:</strong> Once you have signed, click "Finish" to complete the process.</li>' +
    //                 '</ol>' +

    //                 '<p>If you have any questions or need assistance, please do not hesitate to contact <a href="[Message chatter link here]"></a>.</p>' +

    //                 '<p><strong>DO NOT SHARE THIS EMAIL:</strong></p>' +
    //                 '<p>This email contains a secure link to T-sign. Please do not share this email or link with others.</p>' +

    //                 '<p>Thank you for your prompt attention to this matter.</p>' +

    //                 '<p>Best regards,</p>' +
    //                 '<p>' + organisationName + '</p>' +

    //             '</div>' +
    //         '</div>' +

    //         '</body>' +
    //         '</html>';

            
            
    //         OrgWideEmailAddress orgWideEmail = [
    //             SELECT Id 
    //             FROM OrgWideEmailAddress 
    //             WHERE Address =: System.Label.OrgWideEmailAddress
    //             LIMIT 1
    //         ];
    //         system.debug('orgWideEmail==>'+orgWideEmail);
    //         // Send the email
    //         Messaging.SingleEmailMessage emailMessage = new Messaging.SingleEmailMessage();
    //         emailMessage.setToAddresses(new String[] { email });
    //         emailMessage.setSubject(subject);
    //         emailMessage.setHtmlBody(body);
    //         emailMessage.setOrgWideEmailAddressId(orgWideEmail.Id);
    //         Messaging.sendEmail(new Messaging.SingleEmailMessage[] { emailMessage });
    //         System.debug('email: ' + emailMessage);
            
            
    //     } catch (Exception ex) {
    //         throw new AuraHandledException('Error sending email: ' + ex.getMessage());
    //     }
    // }

    @AuraEnabled
public static void sendRecordEmail(String recordId,String email,String baseUrl){
    try{

        // Validate email
        if(String.isBlank(recordId) || String.isBlank(email) || String.isBlank(baseUrl)){
            throw new AuraHandledException('Record ID, Email, and Base URL are required.');
        }

        System.debug('Sending email to: ' + email + ' for recordId: ' + recordId);

        // Set expiration time (14 days from now)
        Datetime expirationTime = System.now().addDays(14);

        // Step 1: Fetch Offer Template
        Offer_Template__c template = [
            SELECT Id,Expire__c,Link_Active__c,Orgnisation_Id__c
            FROM Offer_Template__c
            WHERE Id = :recordId
            LIMIT 1
        ];

        // Step 2: Fetch Organisation Details
        String organisationName = 'TesseractApps';
        String senderEmailAddress = 'noreply@tesseractapps.com';

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

        // Update expiration timestamp and activate link
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

        String secureUrl = baseUrl + '?data=' + encodedData;

        // Extract recipient name
        String recipientName = email.substringBefore('@');
        recipientName = recipientName.replace('.', ' ');
        recipientName = recipientName.capitalize();

        // Email Subject
        String subject = 'Action Required: Please Sign the Document';

        // Logo URL
        String TsignlogoUrl = URL.getOrgDomainUrl().toExternalForm() + '/resource/Te_sign';

        // Email Body
        String body =
        '<!DOCTYPE html>' +
        '<html>' +
        '<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#ffffff;">' +

        '<div style="max-width:700px;margin:0 auto;background:#ffffff;border-radius:8px;border:1px solid #ddd;">' +

        '<div style="display:flex;justify-content:space-between;align-items:center;padding:20px 30px;background-color:#ffffff;border-bottom:1px solid #eee;box-shadow:0 2px 6px rgba(0,0,0,0.08);">' +
        '<h2 style="margin:0;color:#003466;">Action Required</h2>' +
        '<img src="' + TsignlogoUrl + '" alt="Tsign" style="height:40px;" />' +
        '</div>' +

        '<div style="padding:30px;font-size:14px;color:#333;">' +

        '<p>Dear ' + recipientName + ',</p>' +
        '<p>I hope this email finds you well.</p>' +
        '<p>We have prepared a document that requires your signature. To ensure a smooth and efficient process, we are using T-sign, a secure and convenient electronic signature service.</p>' +

        '<p><strong>Please follow these steps to sign the document:</strong></p>' +

        '<ol>' +
        '<li><strong>Click the button below:</strong> This will take you directly to the document.</li>' +
        '</ol>' +

        '<p style="text-align:center;margin:20px 0;">' +
        '<a href="' + secureUrl + '" style="background-color:#0070d2;color:white;padding:10px 20px;text-decoration:none;border-radius:8px;display:inline-block;">View and Sign Document</a>' +
        '</p>' +

        '<p><em>Note: This link will expire in 14 days of issuance.</em></p>' +

        '<ol start="2">' +
        '<li><strong>Review the document:</strong> Carefully read through the document to ensure all information is correct.</li>' +
        '<li><strong>Sign the document:</strong> Follow the prompts to add your electronic signature.</li>' +
        '<li><strong>Complete the process:</strong> Once you have signed, click "Finish" to complete the process.</li>' +
        '</ol>' +

        '<p>If you have any questions or need assistance, please do not hesitate to contact support.</p>' +

        '<p><strong>DO NOT SHARE THIS EMAIL:</strong></p>' +
        '<p>This email contains a secure link to T-sign. Please do not share this email or link with others.</p>' +

        '<p>Thank you for your prompt attention to this matter.</p>' +

        '<p>Best regards,</p>' +
        '<p>' + organisationName + '</p>' +

        '</div>' +
        '</div>' +
        '</body>' +
        '</html>';

        // Send Email Using EmailRelayService
        List<String> toEmails = new List<String>{email};
        List<String> attachments = new List<String>();
        List<String> ccEmails = new List<String>();
        List<String> bccEmails = new List<String>();

        Map<String,Object> response = EmailRelayService.sendEmail(
            senderEmailAddress,
            toEmails,
            subject,
            body,
            attachments,
            ccEmails,
            bccEmails
        );

        System.debug('✅ Email sent successfully ==> ' + response);
        // Update template after successful callout
        update template;

    }catch(Exception ex){
        throw new AuraHandledException('Error sending email: ' + ex.getMessage());
    }
}
    
    @AuraEnabled
    public static void updateCurrentRecipient(String recordId, String currentRecipientEmail, String status) {
        if (String.isEmpty(recordId) || String.isEmpty(currentRecipientEmail)) {
            throw new AuraHandledException('Record ID and Current Email are required.');
        }
        
        Offer_Template__c record = [SELECT Id, Current_Recipient__c, Current_Recipient_Status__c FROM Offer_Template__c WHERE Id = :recordId LIMIT 1];
        
        if (record != null) {
            record.Current_Recipient__c = currentRecipientEmail;
            record.Current_Recipient_Status__c = status;
            update record;
        } else {
            throw new AuraHandledException('Record not found.');
        }
    }
    
    
    @AuraEnabled
    public static String getAllRecipients(String recordId) {
        if (String.isEmpty(recordId)) {
            throw new AuraHandledException('Record ID is required.');
        }
        
        Offer_Template__c record = [
            SELECT All_Recipients__c 
            FROM Offer_Template__c 
            WHERE Id = :recordId 
            LIMIT 1
        ];
        
        if (record == null || String.isEmpty(record.All_Recipients__c)) {
            throw new AuraHandledException('All_Recipients__c is empty or not found for the given record.');
        }
        
        return record.All_Recipients__c;
    }
   @AuraEnabled
    public static void notifyNextRecipient(String recordId) {
        try {
            System.debug('Notifying next recipient for recordId: ' + recordId);
            
            // Fetch the Offer_Template__c record
            Offer_Template__c template = [
                SELECT Id, All_Recipients__c
                FROM Offer_Template__c
                WHERE Id = :recordId
                LIMIT 1
            ];
            system.debug('template==>'+ template);
            
            // Parse the recipient list
            List<String> recipients = template.All_Recipients__c.split('\n');
            if (recipients.isEmpty()) { 
                system.debug('All_Recipients__c==>'+ template.All_Recipients__c);
                throw new AuraHandledException('Recipient list is empty.');
            }
            
            // Identify the next recipient
            String nextRecipientEmail = recipients[0]; // First in the list
            if (String.isBlank(nextRecipientEmail)) { 
                system.debug('nextRecipientEmail==>'+ nextRecipientEmail);
                throw new AuraHandledException('Next recipient email is blank.');
            }
            
            // Fetch the URL from custom metadata
            Tsign_URL__mdt metadataRecord = [
                SELECT Tsign_URL__c
                FROM Tsign_URL__mdt
                LIMIT 1
            ];
            
            system.debug('metadataRecord==>'+ metadataRecord);
            String staticUrl = metadataRecord.Tsign_URL__c;
            if (String.isBlank(staticUrl)) { 
                system.debug('staticUrl==>'+ staticUrl);
                throw new AuraHandledException('Base URL is missing in custom metadata.');
            }
            
            // Construct the URL using the metadata value
            String url = staticUrl + '/s/?recordId=' + recordId;
            
            system.debug('url==>'+ staticUrl + ' ' + ' '+recordId);
            system.debug('sendRecordEmail==>'+ recordId + ' ' + nextRecipientEmail + ' '+url);
            
            // Send the email and update the recipient list
            sendRecordEmail(recordId, nextRecipientEmail, url);
            recipients.remove(0); // Remove the current recipient from the list
            template.All_Recipients__c = String.join(recipients, '\n');
            update template;
            
            System.debug('Next recipient notified: ' + nextRecipientEmail + '. Remaining recipients: ' + recipients);
        } catch (Exception ex) {
            throw new AuraHandledException('Error notifying next recipient: ' + ex.getMessage());
        }
    }
    
   /* @AuraEnabled
    public static void notifyAllRecipients(String recordId) {
        try {
            System.debug('Notifying all recipients for recordId: ' + recordId);
            
            // Fetch the Offer_Template__c record
            Offer_Template__c template = [
                SELECT All_Recipients__c, File_Name__c
                FROM Offer_Template__c
                WHERE Id = :recordId
                LIMIT 1
            ];
            
            // Parse the recipient list
            List<String> recipients = template.All_Recipients__c.split('\n');
            if (recipients.isEmpty()) {
                throw new AuraHandledException('Recipient list is empty.');
            }
            
            // Construct and send the final email
            Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
            email.setToAddresses(recipients);
            email.setSubject('Final Offer Letter Approval');
            email.setHtmlBody('<p>The final offer letter has been approved by all parties. Please find the attached document.</p>');
            Messaging.sendEmail(new Messaging.SingleEmailMessage[] { email });
            
            System.debug('All recipients notified successfully.');
        } catch (Exception ex) {
            throw new AuraHandledException('Error notifying all recipients: ' + ex.getMessage());
        }
    } */
    
    @AuraEnabled
    public static String getFileNameFromRecord(Id recordId) {
        try {
            Offer_Template__c record = [
                SELECT File_Name__c 
                FROM Offer_Template__c 
                WHERE Id = :recordId
                LIMIT 1
            ];
            return record.File_Name__c;
        } catch (Exception e) {
            throw new AuraHandledException('Failed to retrieve file name: ' + e.getMessage());
        }
    }
    
    @AuraEnabled
    public static String getUploadedSignUrl(String recordId) {
        try {
            Child_Signatures__c childRecord = [
                SELECT Signature_URL__c
                FROM Child_Signatures__c
                WHERE Offer_Template__c = :recordId order by createdDate Desc
                LIMIT 1 
            ];
            return childRecord.Signature_URL__c;
        } catch (Exception ex) {
            throw new AuraHandledException('Error retrieving Signature URL: ' + ex.getMessage());
        }
    }    
    
    @AuraEnabled(cacheable=true)
    public static String getCurrentUserEmail() {
        return UserInfo.getUserEmail();
    }  
    
    // @AuraEnabled
    // public static String startEmailSequence(String recordId) {
    //     try {
    //         // Fetch the template to retrieve emails
    //         Offer_Template__c template = [SELECT Id, All_Recipients__c FROM Offer_Template__c WHERE Id = :recordId LIMIT 1];
    //         system.debug('template==>'+template.Id);
            
    //         if (String.isEmpty(template.All_Recipients__c)) {
    //             system.debug('All Recipients==>'+template.All_Recipients__c);
    //             throw new AuraHandledException('No recipients are listed in the template.');
    //         }
            
    //         // Split emails by new line
    //         List<String> emailList = template.All_Recipients__c.split('\n');
    //         system.debug('emailList====>'+emailList);
            
    //         if (emailList.isEmpty()) { throw new AuraHandledException('No recipients are listed in the template.');
    //         }
            
    //         // Debug log the retrieved emails
    //         System.debug('Recipient Emails: ' + emailList);
            
    //         // Retrieve the first recipient
    //         String firstRecipient = emailList[0]; // Process the first recipient
            
    //         // Construct the URL for the first recipient
    //         String baseUrl = Label.GuestTsignURL;
    //         String dynamicUrl = baseUrl + '?recordId=' + recordId;
    //         system.debug('sendRecordEmail==>'+ recordId + ' ' + firstRecipient + ' ' + baseUrl);
            
    //         // Send email to the first recipient
    //         sendRecordEmail(recordId, firstRecipient, baseUrl);
            
            
    //         system.debug('updateCurrent==>'+ recordId + ' ' + firstRecipient);
    //         // Update the current recipient and status
    //         updateCurrent(recordId, firstRecipient, 'Pending');
    //         system.debug('Completed');
            
    //         return 'Email sequence initiated successfully';
    //     } catch (Exception e) {
    //         System.debug('Error initiating email sequence: ' + e.getMessage());
    //         throw new AuraHandledException('Failed to start email sequence: ' + e.getMessage());
    //     }
    // }

    @AuraEnabled public static String startEmailSequence(String recordId) {
    try { // Fetch the template to retrieve emails
        Offer_Template__c template = [
            SELECT Id,
            All_Recipients__c FROM Offer_Template__c WHERE Id = : recordId LIMIT 1
        ];
        System.debug('template ==> ' + template.Id);
        if (String.isBlank(template.All_Recipients__c)) {
            System.debug('All Recipients ==> ' + template.All_Recipients__c);
            throw new AuraHandledException('No recipients are listed in the template.');
        }
        // Split emails by new line
        List < String > emailList = template.All_Recipients__c.split('\n');
        System.debug('emailList ==> ' + emailList);
        if (emailList.isEmpty()) {
            throw new AuraHandledException('No recipients are listed in the template.');
        }
        // Debug log the retrieved emails
        System.debug('Recipient Emails: ' + emailList);
        // Retrieve the first recipient
        String firstRecipient = emailList[0].trim();
        // Construct the URL
        String baseUrl = Label.GuestTsignURL;
        System.debug('sendRecordEmail ==> ' + recordId + ' ' + firstRecipient + ' ' + baseUrl);
        // Send email
        sendRecordEmail(recordId, firstRecipient, baseUrl);
        System.debug('updateCurrent ==> ' + recordId + ' ' + firstRecipient);
        // Update current recipient
        updateCurrent(recordId, firstRecipient, 'Pending');
        System.debug('Completed');
        return 'Email sequence initiated successfully';
    } catch (Exception e) {
        System.debug('FULL ERROR ==> ' + e.getMessage());
        System.debug('STACK ==> ' + e.getStackTraceString());
        throw new AuraHandledException(e.getMessage());
    }
}

    
    public static void updateCurrent(String recordId, String email, String status) {
        // Update the record with the current recipient and status
        Offer_Template__c template = new Offer_Template__c(Id = recordId, Current_Recipient__c = email, Current_Recipient_Status__c = status);
        update template;
    }
    
    @AuraEnabled
    public static void advanceEmailSequence(String recordId) {
        Offer_Template__c template = [SELECT Id, All_Recipients__c, Current_Recipient__c, Current_Recipient_Status__c FROM Offer_Template__c WHERE Id = :recordId];
        List<String> emails = template.All_Recipients__c.split('\n'); // consistent delimiter
        Integer currentIndex = emails.indexOf(template.Current_Recipient__c);
        
        // Check if there's a next recipient
        if (currentIndex == -1) {
            throw new AuraHandledException('Current recipient not found in the list.');
        } else if (currentIndex + 1 < emails.size()) {
            template.Current_Recipient__c = emails[currentIndex + 1];
            template.Current_Recipient_Status__c = 'Pending';
            update template;
            sendEmailToRecipient(emails[currentIndex + 1], recordId); // Send email to the next recipient
        } else {
            // Last recipient reached; complete the sequence
            template.Current_Recipient_Status__c = 'Completed';
            update template;
        }
    }
    
    
    public static void sendEmailToRecipient(String email, String recordId) {
        // Implement email sending logic here
        Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
        mail.setToAddresses(new String[] {email});
        mail.setSubject('Action Required: Please review the document');
        mail.setPlainTextBody('Please review the attached document and complete the necessary actions.');
        mail.setWhatId(recordId); // Link email to the record for tracking, if needed
        
        Messaging.sendEmail(new Messaging.SingleEmailMessage[] {mail});
    }
    
    @AuraEnabled
    public static String getCurrentRecipientInfo(String recordId) {
        Offer_Template__c template = [SELECT Id, Current_Recipient__c, Current_Recipient_Status__c FROM Offer_Template__c WHERE Id = :recordId];
        return JSON.serialize(new Map<String, String> {
            'currentRecipient' => template.Current_Recipient__c,
                'status' => template.Current_Recipient_Status__c
                });
    }
    
    
    @AuraEnabled
    public static String getNextRecipient(String recordId) {
        try {
            Offer_Template__c template = [
                SELECT All_Recipients__c, Current_Recipient__c 
                FROM Offer_Template__c 
                WHERE Id = :recordId 
                LIMIT 1
            ];
            
            if (String.isBlank(template.All_Recipients__c)) {
                throw new AuraHandledException('Recipient list is empty.');
            }
            
            // Parse recipients into a list
            List<String> recipients = template.All_Recipients__c.split('\n');
            Integer currentIndex = recipients.indexOf(template.Current_Recipient__c);
            
            if (currentIndex == -1) {
                // Start with the first recipient if no current recipient is set
                return recipients[0];
            } else if (currentIndex + 1 < recipients.size()) {
                // Move to the next recipient
                return recipients[currentIndex + 1];
            }
            
            // Return null if all recipients are processed
            return null;
        } catch (Exception ex) {
            throw new AuraHandledException('Error determining next recipient: ' + ex.getMessage());
        }
    }
    
    @AuraEnabled
    public static String getChildSignatureUrl(Id recordId) {
        try {
            // Query the Child_Signatures__c object for Signature_URL__c
            Child_Signatures__c childSignature = [
                SELECT Signature_URL__c 
                FROM Child_Signatures__c 
                WHERE Offer_Template__c = :recordId
                LIMIT 1
            ];
            return childSignature.Signature_URL__c;
        } catch (Exception ex) {
            System.debug('Error fetching Signature_URL__c: ' + ex.getMessage());
            throw new AuraHandledException('Error fetching Signature URL.');
        }
    }
    
    @AuraEnabled
    public static void saveMessage(Id recordId, String message) {
        if (String.isBlank(recordId) || String.isBlank(message)) {
            throw new AuraHandledException('Record ID or message is missing.');
        }
        
        // Fetch the record with existing comments
        Offer_Template__c record = [
            SELECT Id, Comments__c 
            FROM Offer_Template__c 
            WHERE Id = :recordId 
            LIMIT 1
        ];
        
        List<Object> commentsList = new List<Object>();
        
        // Parse existing comments if present
        if (!String.isBlank(record.Comments__c)) {
            try {
                commentsList = (List<Object>) JSON.deserializeUntyped(record.Comments__c);
            } catch (Exception e) {
                throw new AuraHandledException('Error parsing existing comments: ' + e.getMessage());
            }
        }
        
        // Deserialize the new message
        Object newMessageObject = JSON.deserializeUntyped(message);
        
        // Append the new message to the list
        commentsList.add(newMessageObject);
        
        // Serialize back to JSON and update the record
        record.Comments__c = JSON.serialize(commentsList);
        
        try {
            update record;
        } catch (Exception e) {
            throw new AuraHandledException('Error updating record: ' + e.getMessage());
        }
    }
    
    @AuraEnabled
    public static String fetchMessages(Id recordId, String cacheBuster) {
        Offer_Template__c template = [SELECT Comments__c FROM Offer_Template__c WHERE Id = :recordId];
        return template.Comments__c != null ? template.Comments__c : '[]';
    }
    
    @AuraEnabled(cacheable=true)
    public static String getTSignURL() {
        // Replace 'Tsign_URL__mdt' with the actual API name of your custom metadata
        Tsign_URL__mdt metadataRecord = [SELECT Tsign_URL__c FROM Tsign_URL__mdt LIMIT 1];
        return metadataRecord.Tsign_URL__c;
    }
    
@AuraEnabled
public static void updateRecordWithAWSUrl(
    Id recordId,
    String awsUrl,
    String serviceId,
    Id quoteId,
    String hrId,
    String formId   // ✅ NEW
) {
    try {
        Offer_Template__c record = [
            SELECT Id, Amazon_Url__c, ServiceId__c, NDIS_Quote__c, Dynamic_Form_Response__c, Type__c
            FROM Offer_Template__c
            WHERE Id = :recordId
            LIMIT 1
        ];

        record.Amazon_Url__c = awsUrl;

        // ✅ Preserve current behavior: Service ID
        if (!String.isBlank(serviceId)) {
            record.ServiceId__c = serviceId;
        }

        // ✅ Preserve current behavior: Quote lookup
        if (quoteId != null) {
            record.NDIS_Quote__c = quoteId;
        }

        // ✅ NEW: Forms lookup + type safety
        if (!String.isBlank(formId)) {
            record.Dynamic_Form_Response__c = formId;
            record.Type__c = 'Forms';
        }

        if (!String.isBlank(hrId)) {
            record.Participant_Template__c  = hrId;
            record.Type__c = 'HR';
        }

        update record;

        System.debug(
            '✅ Record updated with AWS URL: ' + awsUrl +
            ' | ServiceId: ' + serviceId +
            ' | QuoteId: ' + String.valueOf(quoteId) +
            ' | FormId: ' + formId
        );

    } catch (Exception e) {
        System.debug('❌ Error updating Offer_Template__c record: ' + e.getMessage());
        throw new AuraHandledException('Error updating record: ' + e.getMessage());
    }
}



    
    @AuraEnabled
public static void deactivateLink(Id recordId) {
    try {
        if (String.isEmpty(recordId)) {
            throw new AuraHandledException('Record ID is required.');
        }
 
        // First, check in Offer_Template__c
        List<Offer_Template__c> templateRecords = [
            SELECT Id, Link_Active__c 
            FROM Offer_Template__c 
            WHERE Id = :recordId 
            LIMIT 1
        ];
 
        if (!templateRecords.isEmpty()) {
            Offer_Template__c templateRecord = templateRecords[0];
            templateRecord.Link_Active__c = false;
            update templateRecord;
            System.debug('✅ Link deactivated in Offer_Template__c for record: ' + recordId);
            return;
        }
 
        // If not found in Offer_Template__c, check Child_Signatures__c
        List<Child_Signatures__c> childRecords = [
            SELECT Id, Link_Active__c 
            FROM Child_Signatures__c 
            WHERE Id = :recordId 
            LIMIT 1
        ];
 
        if (!childRecords.isEmpty()) {
            Child_Signatures__c childRecord = childRecords[0];
            childRecord.Link_Active__c = false;
            update childRecord;
            System.debug('✅ Link deactivated in Child_Signatures__c for record: ' + recordId);
            return;
        }
 
        throw new AuraHandledException('No record found with the given ID.');
    } catch (Exception ex) {
        System.debug('🚨 Error deactivating link: ' + ex.getMessage());
        throw new AuraHandledException('Error deactivating link: ' + ex.getMessage());
    }
}
    
    @AuraEnabled
    public static Id saveTemplateData(String fileName, String fileUrl, String placeholderJSON, String OrgId, String key)
    {
        Template__c template = new Template__c();
    
        template.File_Name__c = fileName;
        template.Amazon_Url__c = fileUrl;
        template.Placeholder_JSON__c = placeholderJSON;
        template.Organisation_Id__c = OrgId;
        template.key__c = key;
    
        insert template;
    
        return template.Id;
    }
}