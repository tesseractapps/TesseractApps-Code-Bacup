@isTest
public class TemplateControllerTest {
    
    @testSetup
    static void setupTestData() {
        List<Offer_Template__c> templates = new List<Offer_Template__c>();
        for (Integer i = 0; i < 3; i++) {
            Offer_Template__c template = new Offer_Template__c(
                File_Name__c = 'TestFile' + i,
                Amazon_Url__c = 'https://aws.s3.testurl.com/file' + i,
                Placeholder_JSON__c = '{"key": "value"}',
                Sign_Base64__c = 'dGVzdA==', // Base64 encoded string
                Current_Recipient__c = 'testuser' + i + '@email.com',
                All_Recipients__c = 'recipient1@email.com\nrecipient2@email.com',
                pdfID__c = 'PDFID-' + i
            );
            templates.add(template);
        }
        insert templates;
    }

    @isTest
    static void testCreateOfferTemplate() {
        Test.startTest();
        String recordId = TemplateController.createOfferTemplate('New Test File', 'Service', '001XXXXXXXXXXXX', 'a0BXXXXXXXXXXXX');
        Test.stopTest();

        System.assertNotEquals(null, recordId, 'Record ID should not be null.');
        Offer_Template__c createdRecord = [SELECT Id, File_Name__c FROM Offer_Template__c WHERE Id = :recordId LIMIT 1];
        System.assertEquals('New Test File', createdRecord.File_Name__c, 'File name should match the input.');
    }

    @isTest
    static void testGetUploadedFileUrl() {
        Offer_Template__c template = [SELECT Id FROM Offer_Template__c LIMIT 1];
        
        Test.startTest();
        String url = TemplateController.getUploadedFileUrl(template.Id);
        Test.stopTest();

        System.assertNotEquals(null, url, 'URL should not be null.');
    }

    @isTest
    static void testSavePlaceholders() {
        Offer_Template__c template = [SELECT Id FROM Offer_Template__c LIMIT 1];

        Test.startTest();
        TemplateController.savePlaceholders(template.Id, '{"newKey": "newValue"}');
        Test.stopTest();

        Offer_Template__c updatedTemplate = [SELECT Placeholder_JSON__c FROM Offer_Template__c WHERE Id = :template.Id];
        System.assertEquals('{"newKey": "newValue"}', updatedTemplate.Placeholder_JSON__c, 'Placeholder JSON should be updated.');
    }

    @isTest
    static void testGetPlaceholders() {
        Offer_Template__c template = [SELECT Id FROM Offer_Template__c LIMIT 1];

        Test.startTest();
        String jsonData = TemplateController.getPlaceholders(template.Id);
        Test.stopTest();

        System.assertNotEquals(null, jsonData, 'Placeholder JSON should not be null.');
    }

    @isTest
    static void testGetOfferTemplates() {
        Test.startTest();
        List<Offer_Template__c> templates = TemplateController.getOfferTemplates('TestFile');
        Test.stopTest();

        System.assert(templates.size() > 0, 'Offer templates should be retrieved.');

    }

    @isTest
    static void testUpdateNameInPdfId() {
        Offer_Template__c template = [SELECT Id FROM Offer_Template__c LIMIT 1];

        Test.startTest();
        TemplateController.updateNameInPdfId('UpdatedPDFName', template.Id);
        Test.stopTest();

        Offer_Template__c updatedTemplate = [SELECT pdfID__c FROM Offer_Template__c WHERE Id = :template.Id];
        System.assertEquals('UpdatedPDFName', updatedTemplate.pdfID__c, 'PDF ID should be updated.');
    }

    @isTest
    static void testSaveImageToSalesforce() {
        Offer_Template__c template = [SELECT Id FROM Offer_Template__c LIMIT 1];

        Test.startTest();
        TemplateController.saveImageToSalesforce(template.Id, 'dGVzdA==');
        Test.stopTest();

        Offer_Template__c updatedTemplate = [SELECT Sign_Base64__c FROM Offer_Template__c WHERE Id = :template.Id];
        System.assertEquals('dGVzdA==', updatedTemplate.Sign_Base64__c, 'Base64 content should be updated.');
    }

    @isTest
    static void testGetImageBase64() {
        Offer_Template__c template = [SELECT Id FROM Offer_Template__c LIMIT 1];

        Test.startTest();
        String base64Data = TemplateController.getImageBase64(template.Id);
        Test.stopTest();

        System.assertNotEquals(null, base64Data, 'Base64 content should not be null.');
    }

    @isTest
    static void testSaveEmailsToBackend() {
        Offer_Template__c template = [SELECT Id FROM Offer_Template__c LIMIT 1];

        Test.startTest();
        TemplateController.saveEmailsToBackend(template.Id, 'email1@example.com\nemail2@example.com', 'newjoinee@example.com');
        Test.stopTest();

        Offer_Template__c updatedTemplate = [SELECT All_Recipients__c FROM Offer_Template__c WHERE Id = :template.Id];
        System.assert(updatedTemplate.All_Recipients__c.contains('newjoinee@example.com'), 'New joinee email should be saved.');
    }

    @isTest
    static void testGetOfferTemplateDetails() {
        Offer_Template__c template = [SELECT Id FROM Offer_Template__c LIMIT 1];

        Test.startTest();
        Offer_Template__c result = TemplateController.getOfferTemplateDetails(template.Id);
        Test.stopTest();

        System.assertNotEquals(null, result, 'Offer template should not be null.');
    }

    /*@isTest
static void testGetUploadedSignUrl() {
    // Insert a related Offer_Template__c record
    Offer_Template__c offerTemplate = new Offer_Template__c(File_Name__c = 'Test File');
    insert offerTemplate;

    // Insert a Child_Signatures__c record linked to Offer_Template__c
    Child_Signatures__c childSignature = new Child_Signatures__c(
        Offer_Template__c = offerTemplate.Id,
        Signature_URL__c = 'https://testurl.com/uploaded-sign.png'
    );
    insert childSignature;

    Test.startTest();
    // Call the method to test
    String uploadedSignUrl = TemplateController.getUploadedSignUrl(offerTemplate.Id);
    Test.stopTest();

    // ✅ Validate the result
    System.assertNotEquals(null, uploadedSignUrl, 'Uploaded Sign URL should not be null.');
    System.assertEquals('https://testurl.com/uploaded-sign.png', uploadedSignUrl, 'Uploaded Sign URL should match the expected value.');
}
*/


    @isTest
    static void testGetCurrentUserEmail() {
        Test.startTest();
        String email = TemplateController.getCurrentUserEmail();
        Test.stopTest();

        System.assertNotEquals(null, email, 'Current user email should not be null.');
    }

    @isTest
    static void testGetAllRecipients() {
        Offer_Template__c template = [SELECT Id FROM Offer_Template__c LIMIT 1];

        Test.startTest();
        String recipients = TemplateController.getAllRecipients(template.Id);
        Test.stopTest();

        System.assertNotEquals(null, recipients, 'Recipients should not be null.');
    }

    /*@isTest
static void testGetChildSignatureUrl() {
    // Insert Offer_Template__c record
    Offer_Template__c offerTemplate = new Offer_Template__c(File_Name__c = 'Test Template');
    insert offerTemplate;

    // Insert a Child_Signatures__c record linked to the template
    Child_Signatures__c childSignature = new Child_Signatures__c(
        Offer_Template__c = offerTemplate.Id,
        Signature_URL__c = 'https://testurl.com/signature.png'
    );
    insert childSignature;

    Test.startTest();
    // Call the method to test
    String signatureUrl = TemplateController.getChildSignatureUrl(offerTemplate.Id);
    Test.stopTest();

    // ✅ Validate the result
    System.assertNotEquals(null, signatureUrl, 'Signature URL should not be null.');
    System.assertEquals('https://testurl.com/signature.png', signatureUrl, 'Signature URL should match the expected value.');
}*/



    @isTest
static void testSaveMessage() {
    // Insert Offer_Template__c record
    Offer_Template__c offerTemplate = new Offer_Template__c(File_Name__c = 'Test Template');
    insert offerTemplate;

    // Define the JSON message
    String message = '{"sender": "Admin", "text": "This is a test message", "timestamp": "2024-02-08T12:00:00Z"}';

    Test.startTest();
    TemplateController.saveMessage(offerTemplate.Id, message);
    Test.stopTest();

    // Retrieve updated record
    Offer_Template__c updatedRecord = [SELECT Comments__c FROM Offer_Template__c WHERE Id = :offerTemplate.Id];

    // Validate that the comment has been saved
    System.assert(updatedRecord.Comments__c.contains('test message'), 'Message should be saved in Comments__c.');
}
    
    @isTest
    static void testUpdateRecordWithAWSUrl_Success() {
        // Create a test record
        Offer_Template__c testRecord = new Offer_Template__c(
            File_Name__c = 'Test File',
            Type__c = 'Default',
            Orgnisation_Id__c = '001XXXXXXXXXXXX'
        );
        insert testRecord;

        // New values to update
        String newAwsUrl = 'https://s3.amazonaws.com/test-bucket/test-file.pdf';
        String newServiceId = 'a0BXXXXXXXXXXXX';

        Test.startTest();
        // Call the method
        TemplateController.updateRecordWithAWSUrl(testRecord.Id, newAwsUrl, newServiceId);
        Test.stopTest();

        // Retrieve updated record
        Offer_Template__c updatedRecord = [SELECT Id, Amazon_Url__c, ServiceId__c FROM Offer_Template__c WHERE Id = :testRecord.Id];

        // Assertions
        System.assertEquals(newAwsUrl, updatedRecord.Amazon_Url__c, 'AWS URL should be updated');
        System.assertEquals(newServiceId, updatedRecord.ServiceId__c, 'Service ID should be updated');
    }

    @isTest
    static void testUpdateRecordWithAWSUrl_NoServiceId() {
        // Create a test record
        Offer_Template__c testRecord = new Offer_Template__c(
            File_Name__c = 'Test File 2',
            Type__c = 'Service',
            Orgnisation_Id__c = '001XXXXXXXXXXXX',
            ServiceId__c = 'a0BOLDXXXXXXXXXX' // Pre-existing service ID
        );
        insert testRecord;

        // New AWS URL but no Service ID update
        String newAwsUrl = 'https://s3.amazonaws.com/test-bucket/new-file.pdf';

        Test.startTest();
        TemplateController.updateRecordWithAWSUrl(testRecord.Id, newAwsUrl, null);
        // Offer_Template__c updatedRecord1 = [SELECT Id, Amazon_Url__c, ServiceId__c FROM Offer_Template__c WHERE ServiceId__c = :testRecord.Id];
        // AgreementsHandler.checkSignatureStatus(updatedRecord1.Id);
        Test.stopTest();

        // Retrieve updated record
        Offer_Template__c updatedRecord = [SELECT Id, Amazon_Url__c, ServiceId__c FROM Offer_Template__c WHERE Id = :testRecord.Id];

        // Assertions
        System.assertEquals(newAwsUrl, updatedRecord.Amazon_Url__c, 'AWS URL should be updated');
        System.assertEquals('a0BOLDXXXXXXXXXX', updatedRecord.ServiceId__c, 'Service ID should remain unchanged');
    }
}