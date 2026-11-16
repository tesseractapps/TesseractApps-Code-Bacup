public without sharing class TSignTemplateController {
    /**
* Creates an TSign_Offer_Template__c record.
*/
@AuraEnabled
public static String createOfferTemplate(
    String fileName,
    String picklistValue,
    String orgId,
    String serviceId,
    // String quoteId,
    // String formId,   // ✅ NEW
    String attachmentId, // manendra added for supportcoordinatorAttachments
    String hrId,
    String url,
    Id documentTypeId,
    String facilityId // selected facility from dashboard dropdown
) {
    try {
        // Server-side validation
        OfferTemplateDocumentTypeController.validateOfferTemplateAndDocumentType(null, documentTypeId, (Id) orgId);

        TSign_Offer_Template__c newRecord = new TSign_Offer_Template__c();
        newRecord.File_Name__c = fileName;
        newRecord.TSign_Organisation__c = orgId;
        newRecord.Amazon_Url__c = url;

        // ✅ Preserve current behavior for Type__c
        newRecord.Type__c = picklistValue; // Default / Service / Quote / Forms

        // ✅ Existing: Service
        if (!String.isBlank(serviceId)) {
            newRecord.ServiceId__c = serviceId;
        }

        // ✅ Existing: Quote
        // if (!String.isBlank(quoteId)) {
        //     newRecord.NDIS_Quote__c = quoteId;
        // }

        // // ✅ NEW: Forms
        // if (!String.isBlank(formId)) {
        //     newRecord.Dynamic_Form_Response__c = formId;
        //     newRecord.Type__c = 'Forms';
        // }

        if (!String.isBlank(hrId)) {
            newRecord.TSign_Participant_Template__c  = hrId;
            newRecord.Type__c = 'HR';
        }
        if (!String.isBlank(attachmentId)) { // manendra added for supportcoordinatorAttachments
            newRecord.Attachment__c = attachmentId;
            newRecord.Type__c = 'SupportCoordinatorAttachment';
        }
        
        // Associate selected document type
        if (documentTypeId != null) {
            newRecord.TSign_OfferTemplateDocumentType__c = documentTypeId;
        }

        // Facility selected in the dashboard dropdown
        if (!String.isBlank(facilityId)) {
            newRecord.TSign_Facility__c = facilityId;
        }

        newRecord.Sender_Email__c =
            [SELECT Email FROM User WHERE Id = :UserInfo.getUserId()].Email;

        insert newRecord;
        return newRecord.Id;

    } catch (Exception ex) {
        System.debug('❌ Error creating TSign_Offer_Template__c record: ' + ex.getMessage());
        throw new AuraHandledException('Error creating record: ' + ex.getMessage());
    }
}

    
    @AuraEnabled
public static void deleteOfferTemplate(String recordId) {
    try {
        TSign_Offer_Template__c recordToDelete = [SELECT Id FROM TSign_Offer_Template__c WHERE Id = :recordId LIMIT 1];
        delete recordToDelete;
    } catch (Exception ex) {
        throw new AuraHandledException('Error deleting record: ' + ex.getMessage());
    }
}



    
    /**
* Retrieves the AWS S3 URL from the TSign_Offer_Template__c record.
*/
    @AuraEnabled
    public static String getUploadedFileUrl(String recordId) {
        try {
            TSign_Offer_Template__c record = [
                SELECT Amazon_Url__c
                FROM TSign_Offer_Template__c
                WHERE Id = :recordId
                LIMIT 1
            ];
            return record.Amazon_Url__c;
        } catch (Exception ex) {
            throw new AuraHandledException('Error retrieving file URL: ' + ex.getMessage());
        }
    }
    
    @AuraEnabled
    public static void savePlaceholders(String recordId, String placeholderJSON, Id documentTypeId) {
        try {
            TSign_Offer_Template__c record = [
                SELECT Id, TSign_Organisation__c, TSign_OfferTemplateDocumentType__c
                FROM TSign_Offer_Template__c
                WHERE Id = :recordId
                LIMIT 1
            ];
            
            Id orgId = (Id) record.TSign_Organisation__c;
            
            // Server-side validation
            TSign_OfferTemplateDocumentType.validateOfferTemplateAndDocumentType(recordId, documentTypeId, orgId);
            record.Placeholder_JSON__c = placeholderJSON;
            if (documentTypeId != null) {
                record.TSign_OfferTemplateDocumentType__c = documentTypeId;
            }
            update record;
        } catch (Exception ex) {
            throw new AuraHandledException('Error saving placeholders: ' + ex.getMessage());
        }
    }
    
    /**
* Retrieves the placeholder JSON data from the TSign_Offer_Template__c record.
*/
    @AuraEnabled(cacheable=true)
    public static String getPlaceholders(String recordId) {
        try {
            TSign_Offer_Template__c record = [
                SELECT Placeholder_JSON__c
                FROM TSign_Offer_Template__c
                WHERE Id = :recordId
                LIMIT 1
            ];
            return record.Placeholder_JSON__c;
        } catch (Exception ex) {
            throw new AuraHandledException('Error retrieving placeholders: ' + ex.getMessage());
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static List<TSign_Offer_Template__c> getOfferTemplates(String searchKey) {
        try {
            String searchTerm = '%' + searchKey + '%';
            return [
                SELECT Id, Name, File_Name__c, Amazon_Url__c, Placeholder_JSON__c
                FROM TSign_Offer_Template__c
                WHERE File_Name__c LIKE :searchTerm
                ORDER BY CreatedDate DESC
            ];
        } catch (Exception ex) {
            throw new AuraHandledException('Error retrieving offer templates: ' + ex.getMessage());
        }
    }
    
    @AuraEnabled
    public static void updateNameInPdfId(String name, String recordId) {
        try {
            System.debug('Input Name: ' + name);
            System.debug('Input Record ID: ' + recordId);
            
            if (String.isBlank(recordId)) {
                throw new AuraHandledException('Record ID is missing or invalid.');
            }
            
            TSign_Offer_Template__c template = [
                SELECT Id, pdfID__c 
                FROM TSign_Offer_Template__c 
                WHERE Id = :recordId 
                LIMIT 1
            ];
            System.debug('Retrieved Template: ' + template);
            
            if (template == null) {
                throw new AuraHandledException('No record found for the given ID.');
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
            TSign_Offer_Template__c record = [
                SELECT Placeholder_JSON__c, Amazon_Url__c
                FROM TSign_Offer_Template__c
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
    public static List<TSign_Offer_Template__c> getAllOfferTemplates() {
        try {
            return [
                SELECT Id, File_Name__c, Amazon_Url__c, Placeholder_JSON__c
                FROM TSign_Offer_Template__c
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
            TSign_Offer_Template__c record = [
                SELECT Id, Sign_Base64__c
                FROM TSign_Offer_Template__c
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
            System.debug('File successfully uploaded to AWS and URL updated in TSign_Offer_Template__c.');
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
            TSign_Offer_Template__c record = [
                SELECT Sign_Base64__c
                FROM TSign_Offer_Template__c
                WHERE Id = :recordId
                LIMIT 1
            ];
            return record.Sign_Base64__c;
        } catch (Exception ex) {
            throw new AuraHandledException('Error retrieving Base64 data: ' + ex.getMessage());
        }
    }
    
    @AuraEnabled
    public static void saveEmailsToBackend(String recordId, String emails, String newJoineeEmail, String names) {
        System.debug('Starting to save emails. Record ID: ' + recordId + ', Emails: ' + emails + ', Names: ' + names);
        
        if (String.isEmpty(emails)) {
            System.debug('No emails provided.');
            throw new AuraHandledException('Emails cannot be empty.');
        }
        
        // Split and clean up the email list and names list
        List<String> emailList = new List<String>();
        List<String> nameList = (names == null) ? null : new List<String>();
        List<String> rawEmails = emails.split('\n', -1);
        List<String> rawNames = (names == null) ? null : names.split('\n', -1);
        
        for (Integer i = 0; i < rawEmails.size(); i++) {
            String email = rawEmails[i];
            if (!String.isEmpty(email) && email.contains('@')) { // Basic validation for '@'
                emailList.add(email.trim());
                if (rawNames != null) {
                    nameList.add(i < rawNames.size() ? rawNames[i].trim() : '');
                }
            }
        }
        
        if (emailList.isEmpty()) {
            System.debug('No valid email addresses found after parsing.');
            throw new AuraHandledException('No valid email addresses found.');
        }
        
        // Prepend the New Joinee Email if it's valid and not already included
        if (!String.isEmpty(newJoineeEmail) && newJoineeEmail.contains('@') && !emailList.contains(newJoineeEmail)) {
            emailList.add(0, newJoineeEmail.trim()); // Ensure New Joinee Email is at the top
            if (rawNames != null) {
                nameList.add(0, '');
            }
            System.debug('New Joinee Email added.');
        }
        
        try {
            TSign_Offer_Template__c record = [
                SELECT Id, All_Recipients__c, All_Recipient_Names__c 
                FROM TSign_Offer_Template__c 
                WHERE Id = :recordId 
                LIMIT 1
            ];
            String existingEmails = record.All_Recipients__c;
            String existingNames = record.All_Recipient_Names__c;
            
            // Create a single string from the email list, joined by new lines
            String newEmailString = String.join(emailList, '\n');
            String newNameString = (rawNames != null) ? String.join(nameList, '\n') : null;
            
            Boolean isChanged = false;
            
            if (existingEmails != newEmailString) {
                record.All_Recipients__c = newEmailString;
                isChanged = true;
                System.debug('Emails updated successfully to: ' + record.All_Recipients__c);
            } else {
                System.debug('No update required. Existing emails match the new email list.');
            }
            
            if (rawNames != null && existingNames != newNameString) {
                record.All_Recipient_Names__c = newNameString;
                isChanged = true;
                System.debug('Names updated successfully to: ' + record.All_Recipient_Names__c);
            } else if (rawNames != null) {
                System.debug('No update required. Existing names match the new name list.');
            }
            
            if (isChanged) {
                update record;
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
            TSign_Offer_Template__c record = [
                SELECT Id, First_Name__c
                FROM TSign_Offer_Template__c
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
    public static TSign_Offer_Template__c getOfferTemplateDetails(String recordId) {
        try {
            TSign_Offer_Template__c record = [
                SELECT Expire__c, Link_Active__c 
                FROM TSign_Offer_Template__c 
                WHERE Id = :recordId
                LIMIT 1
            ];
            return record;
        } catch (Exception ex) {
            throw new AuraHandledException('Error retrieving template details: ' + ex.getMessage());
        }
    }
    
    /*@AuraEnabled(cacheable = true)
    public static TSign_Child_Signature__c getChildSignatureDetails(String recordId) {
    try {
    TSign_Child_Signature__c childRecord = [
    SELECT Name, Signature_URL__c, Expire__c, Link_Active__c, TSign_Offer_Template__c
    FROM TSign_Child_Signature__c
    WHERE TSign_Offer_Template__c = :recordId
    ORDER BY CreatedDate DESC
    LIMIT 1
    ];
    return childRecord;
    } catch (Exception ex) {
    throw new AuraHandledException('Error retrieving child signature details: ' + ex.getMessage());
    }
    }*/
    
    @AuraEnabled(cacheable = true)
    public static TSign_Child_Signature__c getChildSignatureDetails(String recordId, String currentUserEmail) {
        try {
            System.debug('Fetching child signature details for Record ID: ' + recordId + ' and Email: ' + currentUserEmail);
            
            // Fetch all child records in descending order of creation
            List<TSign_Child_Signature__c> childRecords = [
                SELECT Name, Signature_URL__c, Expire__c, Link_Active__c, TSign_Offer_Template__c, Recipient_Email__c
                FROM TSign_Child_Signature__c
                WHERE TSign_Offer_Template__c = :recordId
                ORDER BY CreatedDate DESC
            ];
            
            // Iterate to find the record with matching Recipient_Email__c
            for (TSign_Child_Signature__c record : childRecords) {
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

    @AuraEnabled
    public static Map<String, Object> getCertificateValidationData(String recordId) {
        try {
            TSign_Offer_Template__c record = [
                SELECT CreatedDate, Current_Recipient__c, Current_Recipient_Status__c, All_Recipients__c
                FROM TSign_Offer_Template__c
                WHERE Id = :recordId
                LIMIT 1
            ];
            return new Map<String, Object>{
                'createdDate' => record.CreatedDate,
                'currentRecipient' => record.Current_Recipient__c,
                'status' => record.Current_Recipient_Status__c,
                'allRecipients' => record.All_Recipients__c
            };
        } catch (Exception ex) {
            throw new AuraHandledException('Error retrieving certificate validation data: ' + ex.getMessage());
        }
    }

    @AuraEnabled
    public static List<TSign_Child_Signature__c> getAllChildSignatures(String recordId) {
        try {
            return [
                SELECT Id, Name, Signature_URL__c, Expire__c, Link_Active__c, Recipient_Email__c, Status__c, CreatedDate
                FROM TSign_Child_Signature__c
                WHERE TSign_Offer_Template__c = :recordId
                ORDER BY CreatedDate ASC
            ];
        } catch (Exception ex) {
            throw new AuraHandledException('Error retrieving all child signatures: ' + ex.getMessage());
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

            
    //         // Fetch TSign_Offer_Template__c record
    //         // Step 1: Fetch template
    //        // Step 1: Fetch Offer Template
    //         TSign_Offer_Template__c template = [
    //             SELECT Id,
    //             Expire__c,
    //             Link_Active__c,
    //             TSign_Organisation__c FROM TSign_Offer_Template__c WHERE Id = : recordId LIMIT 1
    //         ];
    //         // ======================================
    //         // Step 2: Fetch Organisation Details
    //         // ======================================
    //         // Default Values
    //         String organisationName = 'TesseractApps';
    //         String senderEmailAddress = 'noreply@tesseractapps.com';
    //         if (String.isNotBlank(template.TSign_Organisation__c)) {
    //             TSign_Organisation__c orgObj = [
    //                 SELECT Id,
    //                 Name,
    //                 Email__c FROM TSign_Organisation__c WHERE Id = : template.TSign_Organisation__c LIMIT 1
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
        TSign_Offer_Template__c template = [
            SELECT Id,Expire__c,Link_Active__c,All_Recipients__c,All_Recipient_Names__c,TSign_Organisation__c,CreatedBy.TimeZoneSidKey,Sender_Name__c 
            FROM TSign_Offer_Template__c
            WHERE Id = :recordId
            LIMIT 1
        ];

        // Step 2: Fetch Organisation Details
        String organisationName = 'TesseractApps';
        String senderEmailAddress = 'noreply@tesseractapps.com';

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

        // Update expiration timestamp and activate link
        template.Expire__c = expirationTime;
        template.Link_Active__c = true;


        // Generate secure URL
        // Random 256-bit token (64 hex chars). No recordId / email in the URL.
        // Recipient 1's link lives on TSign_Offer_Template__c.
        String linkToken = EncodingUtil.convertToHex(
            Crypto.generateAesKey(256)
        );

        template.Link_Token__c = linkToken;

        String secureUrl = baseUrl + '?t=' + linkToken;

        template.Email_Secure_Link__c = secureUrl;

        // Recipient name (saved name, else derived from email)
        String recipientName = RecipientEmailSender.resolveRecipientName(
            template.All_Recipients__c,
            template.All_Recipient_Names__c,
            email
        );

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

        '<p><em>' + RecipientEmailSender.buildExpiryNote(
            expirationTime,
            template.CreatedBy != null ? template.CreatedBy.TimeZoneSidKey : null
        ) + '</em></p>' +

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

        Map<String,Object> response = TSign_EmailRelayService.sendEmail(
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
        
        TSign_Offer_Template__c record = [SELECT Id, Current_Recipient__c, Current_Recipient_Status__c FROM TSign_Offer_Template__c WHERE Id = :recordId LIMIT 1];
        
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
        
        TSign_Offer_Template__c record = [
            SELECT All_Recipients__c 
            FROM TSign_Offer_Template__c 
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
            
            // Fetch the TSign_Offer_Template__c record
            TSign_Offer_Template__c template = [
                SELECT Id, All_Recipients__c
                FROM TSign_Offer_Template__c
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
            
            // Fetch the TSign_Offer_Template__c record
            TSign_Offer_Template__c template = [
                SELECT All_Recipients__c, File_Name__c
                FROM TSign_Offer_Template__c
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
            TSign_Offer_Template__c record = [
                SELECT File_Name__c 
                FROM TSign_Offer_Template__c 
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
            TSign_Child_Signature__c childRecord = [
                SELECT Signature_URL__c
                FROM TSign_Child_Signature__c
                WHERE TSign_Offer_Template__c = :recordId order by createdDate Desc
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
    //         TSign_Offer_Template__c template = [SELECT Id, All_Recipients__c FROM TSign_Offer_Template__c WHERE Id = :recordId LIMIT 1];
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
        TSign_Offer_Template__c template = [
            SELECT Id,
            All_Recipients__c FROM TSign_Offer_Template__c WHERE Id = : recordId LIMIT 1
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
        String baseUrl = Label.GuestTsignAppURL;
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
        TSign_Offer_Template__c template = new TSign_Offer_Template__c(Id = recordId, Current_Recipient__c = email, Current_Recipient_Status__c = status);
        update template;
    }
    
    @AuraEnabled
    public static void advanceEmailSequence(String recordId) {
        TSign_Offer_Template__c template = [SELECT Id, All_Recipients__c, Current_Recipient__c, Current_Recipient_Status__c FROM TSign_Offer_Template__c WHERE Id = :recordId];
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
        TSign_Offer_Template__c template = [SELECT Id, Current_Recipient__c, Current_Recipient_Status__c FROM TSign_Offer_Template__c WHERE Id = :recordId];
        return JSON.serialize(new Map<String, String> {
            'currentRecipient' => template.Current_Recipient__c,
                'status' => template.Current_Recipient_Status__c
                });
    }
    
    
    @AuraEnabled
    public static String getNextRecipient(String recordId) {
        try {
            TSign_Offer_Template__c template = [
                SELECT All_Recipients__c, Current_Recipient__c 
                FROM TSign_Offer_Template__c 
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
            // Query the TSign_Child_Signature__c object for Signature_URL__c
            TSign_Child_Signature__c childSignature = [
                SELECT Signature_URL__c 
                FROM TSign_Child_Signature__c 
                WHERE TSign_Offer_Template__c = :recordId
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
        TSign_Offer_Template__c record = [
            SELECT Id, Comments__c 
            FROM TSign_Offer_Template__c 
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
        TSign_Offer_Template__c template = [SELECT Comments__c FROM TSign_Offer_Template__c WHERE Id = :recordId];
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
        TSign_Offer_Template__c record = [
            SELECT Id, Amazon_Url__c, Type__c
            FROM TSign_Offer_Template__c
            WHERE Id = :recordId
            LIMIT 1
        ];

        record.Amazon_Url__c = awsUrl;

        // // ✅ Preserve current behavior: Service ID
        // if (!String.isBlank(serviceId)) {
        //     record.ServiceId__c = serviceId;
        // }

        // // ✅ Preserve current behavior: Quote lookup
        // if (quoteId != null) {
        //     record.NDIS_Quote__c = quoteId;
        // }

        // // // ✅ NEW: Forms lookup + type safety
        // if (!String.isBlank(formId)) {
        //     record.Dynamic_Form_Response__c = formId;
        //     record.Type__c = 'Forms';
        // }

        // if (!String.isBlank(hrId)) {
        //     record.TSign_Participant_Template__c  = hrId;
        //     record.Type__c = 'HR';
        // }

        update record;

        System.debug(
            '✅ Record updated with AWS URL: ' + awsUrl +
            ' | ServiceId: ' + serviceId +
            ' | QuoteId: ' + String.valueOf(quoteId) +
            ' | FormId: ' + formId
        );

    } catch (Exception e) {
        System.debug('❌ Error updating TSign_Offer_Template__c record: ' + e.getMessage());
        throw new AuraHandledException('Error updating record: ' + e.getMessage());
    }
}



    
    @AuraEnabled
public static void deactivateLink(Id recordId) {
    try {
        if (String.isEmpty(recordId)) {
            throw new AuraHandledException('Record ID is required.');
        }
 
        // First, check in TSign_Offer_Template__c
        List<TSign_Offer_Template__c> templateRecords = [
            SELECT Id, Link_Active__c 
            FROM TSign_Offer_Template__c 
            WHERE Id = :recordId 
            LIMIT 1
        ];
 
        if (!templateRecords.isEmpty()) {
            TSign_Offer_Template__c templateRecord = templateRecords[0];
            templateRecord.Link_Active__c = false;
            update templateRecord;
            System.debug('✅ Link deactivated in TSign_Offer_Template__c for record: ' + recordId);
            return;
        }
 
        // If not found in TSign_Offer_Template__c, check TSign_Child_Signature__c
        List<TSign_Child_Signature__c> childRecords = [
            SELECT Id, Link_Active__c 
            FROM TSign_Child_Signature__c 
            WHERE Id = :recordId 
            LIMIT 1
        ];
 
        if (!childRecords.isEmpty()) {
            TSign_Child_Signature__c childRecord = childRecords[0];
            childRecord.Link_Active__c = false;
            update childRecord;
            System.debug('✅ Link deactivated in TSign_Child_Signature__c for record: ' + recordId);
            return;
        }
 
        throw new AuraHandledException('No record found with the given ID.');
    } catch (Exception ex) {
        System.debug('🚨 Error deactivating link: ' + ex.getMessage());
        throw new AuraHandledException('Error deactivating link: ' + ex.getMessage());
    }
}

/**
 * Server-side status of a signer's TSign link, decided with the server clock
 * (not the signer's device clock).
 * Record selection matches offerTemplateList.js:
 *  - recipient index > 0 -> latest TSign_Child_Signature__c for that email
 *  - otherwise           -> TSign_Offer_Template__c
 * Returns found = false when the record cannot be resolved, so callers
 * keep their existing behaviour.
 */
@AuraEnabled
public static Map<String, Object> getSignerLinkStatus(String recordId, String signerEmail) {
    Map<String, Object> result = new Map<String, Object>{
        'found' => false,
        'isExpired' => false,
        'isActive' => true
    };

    if (String.isBlank(recordId) || String.isBlank(signerEmail)) {
        return result;
    }

    List<TSign_Offer_Template__c> templates = [
        SELECT Id, All_Recipients__c, Expire__c, Link_Active__c
        FROM TSign_Offer_Template__c
        WHERE Id = :recordId
        LIMIT 1
    ];

    if (templates.isEmpty()) {
        return result;
    }

    TSign_Offer_Template__c template = templates[0];

    // Same recipient index rule as offerTemplateList.js connectedCallback
    List<String> recipients = new List<String>();
    if (String.isNotBlank(template.All_Recipients__c)) {
        for (String recipient : template.All_Recipients__c.split('\n')) {
            if (String.isNotBlank(recipient)) {
                recipients.add(recipient);
            }
        }
    }
    Integer recipientIndex = recipients.indexOf(signerEmail);

    Datetime expireDate;
    Boolean linkActive;

    if (recipientIndex > 0) {
        // Same selection as getChildSignatureDetails (latest record for this email)
        List<TSign_Child_Signature__c> childRecords = [
            SELECT Id, Expire__c, Link_Active__c
            FROM TSign_Child_Signature__c
            WHERE TSign_Offer_Template__c = :recordId
            AND Recipient_Email__c = :signerEmail
            ORDER BY CreatedDate DESC
            LIMIT 1
        ];

        if (childRecords.isEmpty()) {
            return result;
        }

        expireDate = childRecords[0].Expire__c;
        linkActive = childRecords[0].Link_Active__c;
    } else {
        expireDate = template.Expire__c;
        linkActive = template.Link_Active__c;
    }

    result.put('found', true);
    result.put('isExpired', expireDate != null && System.now() > expireDate);
    result.put('isActive', linkActive == true);

    System.debug('Signer link status ==> ' + signerEmail + ' ' + result);
    return result;
}

/**
 * Resolves a TSign signing-link token (?t=...) to the signer's record.
 * The token is the only input from the browser: recordId and email come
 * from Salesforce, so a link can't be edited to reach another signer.
 *
 * Token location (set by sendRecordEmail):
 *  - recipient 1   -> TSign_Offer_Template__c.Link_Token__c
 *  - recipients 2+ -> TSign_Child_Signature__c.Link_Token__c
 *
 * Same keys as getSignerLinkStatus (found / isExpired / isActive), plus
 * recordId, childSignatureId and email.
 * found = false means the link is invalid (unknown or malformed token).
 */
@AuraEnabled
public static Map<String, Object> resolveSignerLink(String token) {
    Map<String, Object> result = new Map<String, Object>{
        'found' => false,
        'isExpired' => false,
        'isActive' => false,
        'recordId' => null,
        'childSignatureId' => null,
        'email' => null,
        'fileName' => null
    };

    // Tokens are 64 lowercase hex chars (convertToHex of a 256-bit key).
    // Reject anything else before querying.
    if (String.isBlank(token) || !Pattern.matches('[0-9a-f]{64}', token)) {
        return result;
    }

    // Recipients 2+ : token on TSign_Child_Signature__c
    List<TSign_Child_Signature__c> childRecords = [
        SELECT Id, TSign_Offer_Template__c, Recipient_Email__c, Expire__c, Link_Active__c,
               TSign_Offer_Template__r.File_Name__c
        FROM TSign_Child_Signature__c
        WHERE Link_Token__c = :token
        LIMIT 1
    ];

    if (!childRecords.isEmpty()) {
        TSign_Child_Signature__c child = childRecords[0];

        result.put('found', true);
        result.put('recordId', child.TSign_Offer_Template__c);
        result.put('childSignatureId', child.Id);
        result.put('email', child.Recipient_Email__c != null ? child.Recipient_Email__c.trim() : null);
        result.put('isExpired', child.Expire__c != null && System.now() > child.Expire__c);
        result.put('isActive', child.Link_Active__c == true);
        result.put('fileName', child.TSign_Offer_Template__r != null ? child.TSign_Offer_Template__r.File_Name__c : null);

        System.debug('Signer link resolved (child) ==> ' + child.Id);
        return result;
    }

    // Recipient 1 : token on TSign_Offer_Template__c
    List<TSign_Offer_Template__c> templates = [
        SELECT Id, All_Recipients__c, Expire__c, Link_Active__c, File_Name__c
        FROM TSign_Offer_Template__c
        WHERE Link_Token__c = :token
        LIMIT 1
    ];

    if (!templates.isEmpty()) {
        TSign_Offer_Template__c template = templates[0];

        String firstRecipient = null;
        if (String.isNotBlank(template.All_Recipients__c)) {
            for (String recipient : template.All_Recipients__c.split('\n')) {
                if (String.isNotBlank(recipient)) {
                    firstRecipient = recipient.trim();
                    break;
                }
            }
        }

        result.put('found', true);
        result.put('recordId', template.Id);
        result.put('email', firstRecipient);
        result.put('isExpired', template.Expire__c != null && System.now() > template.Expire__c);
        result.put('isActive', template.Link_Active__c == true);
        result.put('fileName', template.File_Name__c);

        System.debug('Signer link resolved (template) ==> ' + template.Id);
    }

    return result;
}

    @AuraEnabled
    public static Id saveTemplateData(String fileName, String fileUrl, String placeholderJSON, String OrgId, String key)
    {
        TSign_Template__c template = new TSign_Template__c();
    
        template.File_Name__c = fileName;
        template.Amazon_Url__c = fileUrl;
        template.Placeholder_JSON__c = placeholderJSON;
        template.Organisation_Id__c = OrgId;
        template.key__c = key;
    
        insert template;
    
        return template.Id;
    }

    @AuraEnabled
    public static String getCompletionCertificatePayload(
        String recordId,
        String currentRecipientEmail,
        String currentRecipientAudit,
        Integer totalPages,
        String envelopeStatus
    ) {
        try {
            List<TSign_Offer_Template__c> templates = [
                SELECT Id, Name, LastModifiedDate, CreatedDate, File_Name__c, 
                       TSign_OfferTemplateDocumentType__c, Sender_Email__c, All_Recipients__c, 
                       Current_Recipient_Status__c, CreatedBy.Full_Name__c, CreatedBy.TSign_Org_Id__c, CreatedBy.Email,
                       CreatedBy.TimeZoneSidKey,
                       Certificate_ID__c
                FROM TSign_Offer_Template__c
                WHERE Id = :recordId
                LIMIT 1
                FOR UPDATE
            ];
            if (templates.isEmpty()) {
                throw new IllegalArgumentException('Offer Template record not found in TemplateController (ID: ' + recordId + ').');
            }
            TSign_Offer_Template__c template = templates[0];

            List<TSign_Child_Signature__c> childSigs = [
                SELECT Id, Name, Recipient_Email__c, Status__c, Fingerprint__c, 
                       CreatedDate, LastModifiedDate, File_Name__c, Signature_URL__c
                FROM TSign_Child_Signature__c
                WHERE TSign_Offer_Template__c = :recordId
                ORDER BY CreatedDate ASC
            ];

            TSign_Organisation__c org;
            if (template.CreatedBy != null && String.isNotBlank(template.CreatedBy.TSign_Org_Id__c)) {
                try {
                    List<TSign_Organisation__c> orgs = [
                        SELECT Name, Address__c
                        FROM TSign_Organisation__c
                        WHERE Name = :template.CreatedBy.TSign_Org_Id__c
                        LIMIT 1
                    ];
                    if (!orgs.isEmpty()) {
                        org = orgs[0];
                    }
                } catch (Exception e) {
                    System.debug('Failed to query Organisation: ' + e.getMessage());
                }
            }

            TSign_CompletionCertificateService.CertificateData data = TSign_CompletionCertificateService.buildTSignCertificateData(
                template, childSigs, org, currentRecipientEmail, currentRecipientAudit, totalPages, envelopeStatus
            );
            String payloadStr = JSON.serialize(data);
            payloadStr = payloadStr.replace('"eventBy":', '"by":')
                                   .replace('"eventDate":', '"date":')
                                   .replace('"eventDateTimeString":', '"dateTime":');
            return payloadStr;
        } catch (Exception ex) {
            Map<String, String> errMap = new Map<String, String>{
                'error' => ex.getMessage(),
                'stackTrace' => ex.getStackTraceString()
            };
            return JSON.serialize(errMap);
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<TSign_Offer_Template_Custom_Field__c> getOfferTemplateCustomFields(String orgId) {
        try {
            if (String.isBlank(orgId)) {
                return new List<TSign_Offer_Template_Custom_Field__c>();
            }
            if (!Schema.sObjectType.TSign_Offer_Template_Custom_Field__c.isAccessible()) {
                throw new AuraHandledException('Insufficient permissions to read custom fields.');
            }
            return [
                SELECT Id, Name, TSign_Organisation__c, Data_Type__c, Field_Key__c, Is_Active__c, Picklist_Options__c, Description__c, Field_Label__c
                FROM TSign_Offer_Template_Custom_Field__c
                WHERE TSign_Organisation__c = :orgId AND Is_Active__c = true
                ORDER BY Field_Label__c ASC
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching custom fields library: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static TSign_Offer_Template_Custom_Field__c createOfferTemplateCustomField(String label, String dataType, String options, String orgId) {
        try {
            if (String.isBlank(label) || String.isBlank(dataType) || String.isBlank(orgId)) {
                throw new IllegalArgumentException('Label, data type, and organization ID are required.');
            }
            if (!Schema.sObjectType.TSign_Offer_Template_Custom_Field__c.isCreateable() ||
                !Schema.sObjectType.TSign_Offer_Template_Custom_Field__c.fields.Field_Label__c.isCreateable() ||
                !Schema.sObjectType.TSign_Offer_Template_Custom_Field__c.fields.Data_Type__c.isCreateable() ||
                !Schema.sObjectType.TSign_Offer_Template_Custom_Field__c.fields.TSign_Organisation__c.isCreateable() ||
                !Schema.sObjectType.TSign_Offer_Template_Custom_Field__c.fields.Field_Key__c.isCreateable() ||
                !Schema.sObjectType.TSign_Offer_Template_Custom_Field__c.fields.Is_Active__c.isCreateable()) {
                throw new AuraHandledException('Insufficient permissions to create custom fields.');
            }

            // Generate a unique stable Field_Key__c
            String key = 'custom_' + String.valueOf(DateTime.now().getTime()) + '_' + String.valueOf(Math.round(Math.random() * 1000));

            TSign_Offer_Template_Custom_Field__c cf = new TSign_Offer_Template_Custom_Field__c(
                Field_Label__c = label,
                Data_Type__c = dataType,
                Picklist_Options__c = options,
                TSign_Organisation__c = orgId,
                Field_Key__c = key,
                Is_Active__c = true
            );
            insert cf;
            return cf;
        } catch (Exception e) {
            throw new AuraHandledException('Error creating custom field: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static TSign_Offer_Template_Custom_Field__c updateOfferTemplateCustomField(Id fieldId, String label, String dataType, String options) {
        try {
            if (fieldId == null || String.isBlank(label) || String.isBlank(dataType)) {
                throw new IllegalArgumentException('Field ID, label, and data type are required.');
            }
            if (!Schema.sObjectType.TSign_Offer_Template_Custom_Field__c.isUpdateable() ||
                !Schema.sObjectType.TSign_Offer_Template_Custom_Field__c.fields.Field_Label__c.isUpdateable() ||
                !Schema.sObjectType.TSign_Offer_Template_Custom_Field__c.fields.Data_Type__c.isUpdateable() ||
                !Schema.sObjectType.TSign_Offer_Template_Custom_Field__c.fields.Picklist_Options__c.isUpdateable()) {
                throw new AuraHandledException('Insufficient permissions to update custom fields.');
            }

            TSign_Offer_Template_Custom_Field__c cf = new TSign_Offer_Template_Custom_Field__c(
                Id = fieldId,
                Field_Label__c = label,
                Data_Type__c = dataType,
                Picklist_Options__c = options
            );
            update cf;
            return cf;
        } catch (Exception e) {
            throw new AuraHandledException('Error updating custom field: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static void deactivateOfferTemplateCustomField(Id fieldId) {
        try {
            if (fieldId == null) {
                throw new IllegalArgumentException('Field ID is required.');
            }
            if (!Schema.sObjectType.TSign_Offer_Template_Custom_Field__c.isUpdateable() ||
                !Schema.sObjectType.TSign_Offer_Template_Custom_Field__c.fields.Is_Active__c.isUpdateable()) {
                throw new AuraHandledException('Insufficient permissions to deactivate custom fields.');
            }
            TSign_Offer_Template_Custom_Field__c cf = new TSign_Offer_Template_Custom_Field__c(
                Id = fieldId,
                Is_Active__c = false
            );
            update cf;
        } catch (Exception e) {
            throw new AuraHandledException('Error deactivating custom field: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static List<Folder_Share__c> fetchStaffByTemplate(Id templateId) {

        System.debug('Template Id = ' + templateId);

        List<Folder_Share__c> shares = [

            SELECT Id,
                Template__c,
                Staff__c,
                Type__c
            FROM Folder_Share__c
            WHERE Template__c = :templateId
            AND Active__c = true

        ];

        System.debug('Shares Size = ' + shares.size());
        System.debug('Shares = ' + shares);

        return shares;
    }

    public class StaffUserWrapper {
        @AuraEnabled public Id staffId;
        @AuraEnabled public Id userId;
        @AuraEnabled public String userName;
        @AuraEnabled public String userType;
        @AuraEnabled public String email;
    }

    @AuraEnabled(cacheable=true)
    public static List<StaffUserWrapper> getStaffOptions(Id templateId) {

        Id currentUserId = UserInfo.getUserId();

        User currentUser = [
            SELECT Id, TSign_Org_Id__c
            FROM User
            WHERE Id = :currentUserId
            LIMIT 1
        ];

        // Users restricted to these 3 roles, same org, excluding self
        List<User> users = [
            SELECT Id, Email, Full_Name__c, User_Type__c
            FROM User
            WHERE TSign_Org_Id__c = :currentUser.TSign_Org_Id__c
            AND User_Type__c IN (
                'T Sign Manager'
            )
            AND IsActive = true
            AND Id != :currentUserId
            ORDER BY Full_Name__c
        ];

        Set<String> userEmails = new Set<String>();
        for (User u : users) {
            if (String.isNotBlank(u.Email)) {
                userEmails.add(u.Email.trim().toLowerCase());
            }
        }

        Map<String, TSign_Staff__c> emailToStaff = new Map<String, TSign_Staff__c>();
        if (!userEmails.isEmpty()) {
            for (TSign_Staff__c s : [
                SELECT Id, Name, Display_Nickname__c, Email__c
                FROM TSign_Staff__c
                WHERE Email__c IN :userEmails
                AND Status__c = true
            ]) {
                if (String.isNotBlank(s.Email__c)) {
                    emailToStaff.put(s.Email__c.trim().toLowerCase(), s);
                }
            }
        }

        List<StaffUserWrapper> result = new List<StaffUserWrapper>();

        for (User u : users) {

            if (u.Id == currentUserId) {
                continue;
            }

            if (String.isBlank(u.Email)) {
                continue;
            }

            String emailKey = u.Email.trim().toLowerCase();

            StaffUserWrapper w = new StaffUserWrapper();

            w.userId = u.Id;

            if (emailToStaff.containsKey(emailKey)) {
                w.staffId = emailToStaff.get(emailKey).Id;
            }

            w.userName = String.isNotBlank(u.Full_Name__c) ? u.Full_Name__c : u.Email;
            w.userType = u.User_Type__c;
            w.email = u.Email;

            result.add(w);
        }

        return result;
    }

    public class ContactSuggestion {
        @AuraEnabled public Id id;
        @AuraEnabled public String displayName;
        @AuraEnabled public String email;
        @AuraEnabled public String contactType;
    }

    @AuraEnabled(cacheable=true)
    public static List<ContactSuggestion> searchContacts(String searchTerm, String orgId) {
        try {
            if (String.isBlank(searchTerm) || searchTerm.trim().length() < 2 || String.isBlank(orgId)) {
                return new List<ContactSuggestion>();
            }

            String trimmed = searchTerm.trim();
            if (trimmed.length() > 80) {
                trimmed = trimmed.substring(0, 80);
            }

            String term = trimmed.replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_');
            String likeTerm = '%' + term + '%';

            List<TSign_Contact__c> contacts = [
                SELECT Id, Name, First_Name__c, Last_Name__c, Email__c, Contact_Type__c
                FROM TSign_Contact__c
                WHERE TSign_Organisation__c = :orgId
                  AND Is_Archived__c = false
                  AND Email__c != null
                  AND (Name LIKE :likeTerm OR First_Name__c LIKE :likeTerm
                       OR Last_Name__c LIKE :likeTerm OR Email__c LIKE :likeTerm)
                  // AND TSign_Facility__c = :facilityId
                WITH USER_MODE
                ORDER BY Name
                LIMIT 10
            ];

            List<ContactSuggestion> results = new List<ContactSuggestion>();
            for (TSign_Contact__c c : contacts) {
                ContactSuggestion cs = new ContactSuggestion();
                cs.id = c.Id;
                String firstLast = ((c.First_Name__c != null ? c.First_Name__c : '') + ' ' + (c.Last_Name__c != null ? c.Last_Name__c : '')).trim();
                cs.displayName = String.isNotBlank(firstLast) ? firstLast : c.Name;
                cs.email = c.Email__c;
                cs.contactType = c.Contact_Type__c;
                results.add(cs);
            }

            return results;
        } catch (Exception ex) {
            System.debug('Error in TSignTemplateController.searchContacts: ' + ex.getMessage());
            throw new AuraHandledException('Unable to search contacts. Please try again.');
        }
    }

    private static final String SIGNATURE_ALLOWED_HOST = 'tsignapp.s3.ap-southeast-2.amazonaws.com';

    @TestVisible
    private static Boolean forceDefaultSigException = false;

    @AuraEnabled
    public static Map<String, Object> getDefaultSignatureForLink(String token) {
        Map<String, Object> defaultResult = new Map<String, Object>{
            'found' => false,
            'imageUrl' => null,
            'method' => null
        };

        try {
            if (Test.isRunningTest() && forceDefaultSigException) {
                throw new CalloutException('Forced test exception');
            }

            if (String.isBlank(token)) {
                return defaultResult;
            }

            Map<String, Object> linkInfo = resolveSignerLink(token);
            if (linkInfo == null ||
                (Boolean) linkInfo.get('found') != true ||
                (Boolean) linkInfo.get('isActive') != true ||
                (Boolean) linkInfo.get('isExpired') == true) {
                return defaultResult;
            }

            Id recordId = (Id) linkInfo.get('recordId');
            String email = (String) linkInfo.get('email');
            if (recordId == null || String.isBlank(email)) {
                return defaultResult;
            }

            List<TSign_Offer_Template__c> templates = [
                SELECT TSign_Organisation__c
                FROM TSign_Offer_Template__c
                WHERE Id = :recordId
                LIMIT 1
            ];
            if (templates.isEmpty() || templates[0].TSign_Organisation__c == null) {
                return defaultResult;
            }
            Id orgId = templates[0].TSign_Organisation__c;

            String trimmedEmail = email.trim();
            List<TSign_Staff__c> staffList = [
                SELECT Id
                FROM TSign_Staff__c
                WHERE TSign_Organisation__c = :orgId
                  AND Email__c = :trimmedEmail
                  AND Status__c = true
                ORDER BY LastModifiedDate DESC
                LIMIT 1
            ];
            if (staffList.isEmpty()) {
                return defaultResult;
            }
            Id staffId = staffList[0].Id;

            List<TSign_Signature__c> sigs = [
                SELECT Id, AWS_URL__c, Method__c
                FROM TSign_Signature__c
                WHERE TSign_Staff__c = :staffId
                  AND Is_Default__c = true
                  AND AWS_URL__c != null
                ORDER BY LastModifiedDate DESC
                LIMIT 1
            ];
            if (sigs.isEmpty()) {
                return defaultResult;
            }

            TSign_Signature__c sig = sigs[0];
            if (String.isBlank(sig.AWS_URL__c)) {
                return defaultResult;
            }

            Url parsedUrl = new Url(sig.AWS_URL__c);
            if (!'https'.equalsIgnoreCase(parsedUrl.getProtocol()) ||
                !SIGNATURE_ALLOWED_HOST.equalsIgnoreCase(parsedUrl.getHost())) {
                return defaultResult;
            }

            Map<String, Object> result = new Map<String, Object>{
                'found' => true,
                'imageUrl' => sig.AWS_URL__c,
                'method' => sig.Method__c
            };
            return result;
        } catch (Exception ex) {
            System.debug('Error in getDefaultSignatureForLink: ' + ex.getMessage());
            return defaultResult;
        }
    }
}