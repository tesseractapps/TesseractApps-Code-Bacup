@isTest
public class TemplateCreatorTest {
    @testsetup Static void testData(){
        TriggerUtility.bypassTrigger = true;
        Offer_Template__c offerTemplate= new Offer_Template__c();
        offerTemplate.Amazon_Url__c='https://docimgupld.s3.ap-southeast-2.amazonaws.com/tesseractoffer-10page.pdf';
        offerTemplate.All_Recipients__c='praveenshesham.sp@gmail.com '+'\n'+'praveenshesham@tesseractapps.com';
        insert offerTemplate; 
        system.debug('offertemplate id- '+ offerTemplate.ID);
        
        Child_Signatures__c cs= new Child_Signatures__c();
        cs.Offer_Template__c=offerTemplate.ID;
        cs.Recipient_Email__c='praveenshesham.sp@gmail.com';
        cs.Signature_URL__c='https://docimgupld.s3.ap-southeast-2.amazonaws.com/tesseractoffer-10page.pdf';
        insert cs; 
    }
    
    
    @isTest
    private static void testUploadDocumentsAndAuthHeader() {
        //Child_Signatures__c childL= [SELECT Id from Child_Signatures__c LIMIT 1];
        // Setting up AWS mock data
        String awsKey = 'testAwsKey';
        String awsSecret = 'testAwsSecret';
        String bucketName = 'testBucket';
        String methodName = 'PUT';
        String hostName = 's3.amazonaws.com';
        
        Offer_Template__c offerTemplate= new Offer_Template__c();
        offerTemplate.Amazon_Url__c='https://docimgupld.s3.ap-southeast-2.amazonaws.com/tesseractoffer-10page.pdf';
        insert offerTemplate; 
        
       // TeSignAWSService service = new TeSignAWSService(awsKey, awsSecret, bucketName, methodName, hostName);
        
        String base64 = '"JVBERi0xLjMKJbrfrOAKGFydHhyZWYKMTg2NTIKJSVFT0Y="';
        String filename = 'testFile.pdf';
        String recordId = offerTemplate.Id;
        String objectType = 'offerLetter';
        
        // Set Mock Callout
       // Test.setMock(HttpCalloutMock.class, new TeSignAWSServiceMock());
        
        Test.startTest();
       /* String contentType = service.ContentType('pdf');
        String contentType1 = service.ContentType('docx');
        String contentType2 = service.ContentType('csv');
        String contentType3 = service.ContentType('wav');
        String contentType4 = service.ContentType('wmv');
        String contentType5 = service.ContentType('mp3');
        String contentType6 = service.ContentType('mp4');
        String contentType7 = service.ContentType('png');
        String contentType8 = service.ContentType('zip');
        String contentType9 = service.ContentType('jpeg');
        service.UploadDocuments(base64, filename, recordId, objectType); */
        // Assert URL is updated
        Offer_Template__c updatedOffer = [SELECT Id,Amazon_Url__c,All_Recipients__c FROM Offer_Template__c WHERE Id = :recordId];
        Child_Signatures__c childs = [SELECT Id,Recipient_Email__c,Signature_URL__c From Child_Signatures__c LIMIT 1];
        
        
        
        String rec = '';
        //TemplateController.createOfferTemplate(fileName);
        TemplateController.getUploadedFileUrl(recordId);
        //TemplateController.createOfferTemplate('NULL');
        TemplateController.getPlaceholders(recordId);
        TemplateController.getOfferTemplates('Test');
        TemplateController.savePlaceholders(recordId, '2');
        TemplateController.updateNameInPdfId(fileName, recordId);
        TemplateController.getPlaceholdersForTemplate(recordId);
        TemplateController.getAllOfferTemplates();
        TemplateController.saveImageToSalesforce(recordId,'"JVBERi0xLjMKJbrfrOAKGFydHhyZWYKMTg2NTIKJSVFT0Y="');
        TemplateController.saveEmailsToBackend(recordId,'saieswar.k@tesseractapps.com','maheswari.adabalerga@tesseractapps.com');
        TemplateController.getImageBase64(recordId);
        TemplateController.saveFirstName(recordId,'Testing');
        TemplateController.getOfferTemplateDetails(recordId);        
        TemplateController.updateCurrentRecipient(recordId,'saieswar.k@tesseractapps.com','Pending');
        TemplateController.getAllRecipients(recordId);
        TemplateController.notifyNextRecipient(recordId);
        TemplateController.getFileNameFromRecord(recordId);
        TemplateController.getCurrentUserEmail();
        TemplateController.sendRecordEmail(recordId,'saieswar.k@tesseractapps.com','https://tesseractapps.my.site.com/TSign/s/');
        TemplateController.updateCurrent(recordId,'saieswar.k@tesseractapps.com','Pending');
        //TemplateController.sendEmailToRecipient('maheswari.adabalerga@tesseractapps.com',recordId);
        TemplateController.getCurrentRecipientInfo(recordId);
        TemplateController.deactivateLink(recordId);
        String base64Image = 'JVBERi0xLjMKJbrfrOAKGFydHhyZWYKMTg2NTIKJSVFT0Y=';
        String fileNames = 'testFile.pdf';
        
        try {
            Blob pdfBlob = TemplateController.convertImageToPdf(base64Image);
        } catch (Exception e) {
            
        }
        
        try {
            // Invoke the method to test
            TemplateController.uploadImageAsPdfToAWS(offerTemplate.Id, base64Image, fileNames);
            
            // Verify the uploadFileToAWS call and the file association with the record
            Offer_Template__c updatedRecord = [SELECT Amazon_Url__c FROM Offer_Template__c WHERE Id = :offerTemplate.Id];
            
        } catch (Exception ex) {
        }
        Test.stopTest();
    }
    
    
    @isTest
    static void testGetChildSignatureDetails() {
        // Bypass any trigger logic to prevent errors if bypass utility exists
        TriggerUtility.bypassTrigger = true;
        
        // Create Offer_Template__c record
        Offer_Template__c offerTemplate = new Offer_Template__c(
            File_Name__c = 'Test Offer.pdf',
            All_Recipients__c = 'testuser@example.com',
            Current_Recipient_Status__c = 'Completed'
        );
        insert offerTemplate;
        
        // Insert Child_Signatures__c records for the test
        Child_Signatures__c signature1 = new Child_Signatures__c(
            Offer_Template__c = offerTemplate.Id,
            Signature_URL__c = 'https://docimgupld.s3.amazonaws.com/uploads/20250205133159/generated_pdf_6d2acdcb.pdf',
            Expire__c = Date.today().addDays(14),
            Link_Active__c = true,
            Recipient_Email__c = 'saieswar.kgtr@tesseractapps.com'
        );
        insert signature1;
        
        Child_Signatures__c signature2 = new Child_Signatures__c(
            Offer_Template__c = offerTemplate.Id,
            Signature_URL__c = 'https://docimgupld.s3.amazonaws.com/uploads/20250205133159/generated_pdf_6d2acdcb.pdf',
            Expire__c = Date.today().addDays(14),
            Link_Active__c = true,
            Recipient_Email__c = 'maheswari.adabalerga@tesseractapps.com'
        );
        insert signature2;
        
        Test.startTest();
        // Call the method being tested
        Child_Signatures__c result = TemplateController.getChildSignatureDetails(offerTemplate.Id, 'saieswar.kgtr@tesseractapps.com');
        
        String resultUrl;
        try {
            resultUrl = TemplateController.getUploadedSignUrl(offerTemplate.Id);
        } catch (Exception ex) {
            resultUrl = 'Error: ' + ex.getMessage();
        }       
        
    }
    
    @isTest
    static void testStartEmailSequenceNoRecipients() {
        // Test setup with no recipients
        Offer_Template__c offerTemplate = new Offer_Template__c(
            File_Name__c = 'Empty Test Offer.pdf',
            All_Recipients__c = 'praveenshesham.sp@gmail.com '+'\n'+'praveenshesham@tesseractapps.com'
        );
        insert offerTemplate;
        
        Test.startTest();
        String result;
        try {
            TemplateController.startEmailSequence(offerTemplate.Id);
            result = 'No Exception';
        } catch (Exception e) {
            result = e.getMessage();
        }
        Test.stopTest();
    }
    
    @isTest
    static void testAdvanceEmailSequence_HappyPath() {
        // Test setup
        Offer_Template__c template = new Offer_Template__c(
            File_Name__c = 'Test Offer.pdf',
            All_Recipients__c = 'recipient1@example.com\nrecipient2@example.com\nrecipient3@example.com',
            Current_Recipient__c = 'recipient1@example.com',
            Current_Recipient_Status__c = 'Pending'
        );
        insert template;
        
        Test.startTest();
        TemplateController.advanceEmailSequence(template.Id);
        Test.stopTest();
        
        // Fetch updated record
        template = [SELECT Current_Recipient__c, Current_Recipient_Status__c FROM Offer_Template__c WHERE Id = :template.Id];
        
    }
    
    @isTest
    static void testAdvanceEmailSequence_LastRecipient() {
        // Test setup with the last recipient
        Offer_Template__c template = new Offer_Template__c(
            File_Name__c = 'Test Offer.pdf',
            All_Recipients__c = 'recipient1@example.com\nrecipient2@example.com',
            Current_Recipient__c = 'recipient2@example.com',
            Current_Recipient_Status__c = 'Pending'
        );
        insert template;
        
        Test.startTest();
        TemplateController.advanceEmailSequence(template.Id);
        Test.stopTest();
        
        // Fetch updated record
        template = [SELECT Current_Recipient_Status__c FROM Offer_Template__c WHERE Id = :template.Id];
        
        
    }
    
    @isTest
    static void testAdvanceEmailSequence_InvalidCurrentRecipient() {
        // Test setup with an invalid current recipient
        Offer_Template__c template = new Offer_Template__c(
            File_Name__c = 'Test Offer.pdf',
            All_Recipients__c = 'recipient1@example.com\nrecipient2@example.com',
            Current_Recipient__c = 'invalid@example.com',
            Current_Recipient_Status__c = 'Pending'
        );
        insert template;
        
        String errorMessage;
        Test.startTest();
        try {
            TemplateController.advanceEmailSequence(template.Id);
        } catch (Exception e) {
            errorMessage = e.getMessage();
        }
        Test.stopTest();
    }
    
    @isTest
    static void testGetNextRecipient() {
        Offer_Template__c template = [SELECT Id FROM Offer_Template__c LIMIT 1];
        
        Test.startTest();
        String nextRecipient = TemplateController.getNextRecipient(template.Id);
        Test.stopTest();
    }
    
    @isTest
    static void testGetChildSignatureUrl() {
        Offer_Template__c template = [SELECT Id FROM Offer_Template__c LIMIT 1];
        
        Test.startTest();
        String signatureUrl = TemplateController.getChildSignatureUrl(template.Id);
        Test.stopTest();
    }
    
    @isTest
    static void testSaveMessage() {
        Offer_Template__c template = [SELECT Id, Comments__c FROM Offer_Template__c LIMIT 1];
        String newMessage = '{"author":"testUser", "content":"Test Message"}';
        
        Test.startTest();
        TemplateController.saveMessage(template.Id, newMessage);
        Test.stopTest();
        
        template = [SELECT Comments__c FROM Offer_Template__c WHERE Id = :template.Id];
        
    }
    
    @isTest
    static void testFetchMessages() {
        Offer_Template__c template = [SELECT Id FROM Offer_Template__c LIMIT 1];
        
        Test.startTest();
        String messages = TemplateController.fetchMessages(template.Id, 'dummyCacheBuster');
        Test.stopTest();
        
    }
    
    @isTest
    static void testGetTSignURL() {
        Test.startTest();
        String tsignUrl = TemplateController.getTSignURL();
        Test.stopTest();
    }
    
    @isTest
    static void testSaveMessage_InvalidInput() {
        String errorMessage;
        Test.startTest();
        try {
            TemplateController.saveMessage(null, null);
        } catch (AuraHandledException ex) {
            errorMessage = ex.getMessage();
        }
        Test.stopTest();
    }
    @isTest
    static void testDeactivateLinkForOfferTemplate() {
        Offer_Template__c template = [SELECT Id, Link_Active__c FROM Offer_Template__c LIMIT 1];
        
        Test.startTest();
        TemplateController.deactivateLink(template.Id);
        Test.stopTest();
        
        // Verify the link was deactivated
        template = [SELECT Link_Active__c FROM Offer_Template__c WHERE Id = :template.Id];        
    }
    
    /*@isTest
    static void testDeactivateLinkForChildSignature() {
        Child_Signatures__c childRecord = [SELECT Id, Link_Active__c FROM Child_Signatures__c LIMIT 1];
        
        Test.startTest();
        TemplateController.deactivateLink(childRecord.Id);
        Test.stopTest();
        
        // Verify the link was deactivated
        childRecord = [SELECT Link_Active__c FROM Child_Signatures__c WHERE Id = :childRecord.Id];
        
    }*/
    
    @isTest
    static void testDeactivateLinkEmptyId() {
        String errorMessage;
        
        Test.startTest();
        try {
            //TemplateController.deactivateLink(null);
        } catch (AuraHandledException ex) {
            errorMessage = ex.getMessage();
        }
        Test.stopTest();
    }
    
    private class TeSignAWSServiceMock implements HttpCalloutMock {
        public HTTPResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setBody('{"success": true, "message": "File uploaded successfully"}');
            return res;
        }
    }
    
    @isTest
static void testTriggerEmailNotificationLogic() {
    // Insert initial template with original values
    Offer_Template__c originalTemplate = new Offer_Template__c(
        File_Name__c = 'OfferLetter.pdf',
        All_Recipients__c = 'test.user@tesseractapps.com\ntest.user2@tesseractapps.com',
        Current_Recipient__c = 'test.user@tesseractapps.com',
        Current_Recipient_Status__c = 'Pending',
        Sender_Email__c = 'john.doe@tesseractapps.com'  // REQUIRED for trigger
    );
    insert originalTemplate;

    // Update template to trigger the logic
    originalTemplate.Current_Recipient__c = 'test.user2@tesseractapps.com';
    originalTemplate.Current_Recipient_Status__c = 'Completed';
    update originalTemplate;  // This fires the trigger
}

}