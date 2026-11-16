@isTest
public class AgreementsHandlerTest {
	@testsetup Static void testData(){
        Client__c cli =  new Client__c();
        cli.First_Name__c = 'Test';
        cli.Last_Name__c = 'Participant';
        cli.Gendar__c = 'Male';
        cli.Date_Of_Birth__c = Date.newInstance(1991, 2, 17);
        cli.Address__Street__s='8 Keewong Street';
        cli.Address__City__s = 'Crace';
        cli.Address__StateCode__s='ACT';
        cli.Address__PostalCode__s='2911';
        cli.Contact_Number__c='4331237651';
        cli.Drivers_Licence__c = '123456789012';
        cli.Primay_Contact_First_Name__c='Jason';
        cli.Primay_Contact_Last_Name__c='Smith';
        cli.Relationship__c='Parent';
        cli.Primary_Contact_Number__c='0433123123';
        insert cli;
        
        Service_Agreement__c repository = new  Service_Agreement__c();
        repository.Name='test attachment';
        repository.Date__c=Date.newInstance(2023, 11, 07);
        repository.User__c=UserInfo.getUserId();
        repository.Comments__c='Test Comments';
        repository.Amazon_Url__c='https://datainfo.s3.ap-southeast-2.amazonaws.com/inv-00522.pdf';
        repository.Size__c='0.12 MB';
        insert repository;
        
        // Create a test ContentVersion
        ContentVersion cv = new ContentVersion();
        cv.Title = 'Test Document';
        cv.PathOnClient = 'test-document.pdf';        
        cv.VersionData = Blob.valueOf('Test content of the document.');
        cv.IsMajorVersion = true;
        insert cv;
        //Get Content Documents
        Id conDocId = [SELECT ContentDocumentId FROM ContentVersion WHERE Id =:cv.Id].ContentDocumentId;
        // Create a ContentDocumentLink to associate the ContentVersion with the test record
        ContentDocumentLink cdl = new ContentDocumentLink();
        cdl.ContentDocumentId = conDocId;
        cdl.LinkedEntityId = repository.Id;
        cdl.ShareType = 'V';
        cdl.Visibility = 'AllUsers';
        insert cdl;  
        ContentDocumentLink resultCdl = [SELECT Id, ContentDocumentId FROM ContentDocumentLink WHERE LinkedEntityId = :repository.Id LIMIT 1];
        
        Service_Agreement__c repositoryRec = new  Service_Agreement__c();
        repositoryRec.Name='test attachment';
        repositoryRec.Date__c=Date.newInstance(2023, 11, 07);
        repositoryRec.User__c=UserInfo.getUserId();
        repositoryRec.Comments__c='Test Comments';
        repositoryRec.Amazon_Url__c='https://datainfo.s3.ap-southeast-2.amazonaws.com/inv-00522.pdf';
        repositoryRec.Size__c='0.12 MB';
        insert repositoryRec;
        
        List<Offer_Template__c> templates = new List<Offer_Template__c>();
        for (Integer i = 0; i < 3; i++) {
            Offer_Template__c template = new Offer_Template__c(
                File_Name__c = 'TestFile' + i,
                Amazon_Url__c = 'https://aws.s3.testurl.com/file' + i,
                Placeholder_JSON__c = '{"key": "value"}',
                Sign_Base64__c = 'dGVzdA==', // Base64 encoded string
                Current_Recipient__c = 'testuser' + i + '@email.com',
                All_Recipients__c = 'recipient1@email.com\nrecipient2@email.com',
                pdfID__c = 'PDFID-' + i, 
                ServiceId__c = 'Test Service'
            );
            templates.add(template);
        }
        insert templates;        
        
        // Create an Offer_Template__c record
        Offer_Template__c offer = new Offer_Template__c(ServiceId__c = 'Test Service',
                                                       File_Name__c = 'TestFile',
                                                        Amazon_Url__c = 'https://aws.s3.testurl.com/file', 
                                                        Placeholder_JSON__c = '{"key": "value"}',
                                                        Sign_Base64__c = 'dGVzdA==', // Base64 encoded string
                                                        Current_Recipient__c = 'testuser@email.com',
                                                        All_Recipients__c = 'recipient1@email.com\nrecipient2@email.com',
                                                        pdfID__c = 'PDFID-');
        insert offer;
        // Create a Child_Signatures__c record
        Child_Signatures__c signature = new Child_Signatures__c(
            Offer_Template__c = offer.Id,
            Signature_URL__c = 'https://test-signature.com/signature.png'
        );
        insert signature;
    }
    @isTest
    public static void TestfetchFiles(){
        Client__c cli = [select Id from Client__c];
        string recordId = cli.Id;     
        Service_Agreement__c attac = [SELECT Id,Name,Size__c,comments__c,USer_Name__c,Amazon_Url__c,Date__c,Date_Format__c from Service_Agreement__c limit 1];
        //Offer_Template__c updatedOffer = [SELECT Id,Amazon_Url__c,All_Recipients__c,ServiceId__c FROM Offer_Template__c WHERE Id = :recordId LIMIT 1];
        
        test.startTest();
        AgreementsHandler.fetchClientFiles(recordId);
        AgreementsHandler.getRelatedFilesByRecordId(recordId);
        AgreementsHandler.fetchRepositoryData(recordId);
        AgreementsHandler.deleteRepository(attac.Id);
        Service_Agreement__c reposiroryRec1= [SELECT Id,Name,Size__c,comments__c,USer_Name__c,Amazon_Url__c,Date__c,Date_Format__c from Service_Agreement__c limit 1];
        AgreementsHandler.UpdateFileSize(reposiroryRec1.id, '0.12MB');
       // AgreementsHandler.checkSignatureStatus(updatedOffer.Id);
        test.StopTest();
        
    }
    
    @isTest
    static void testCheckSignatureStatus() {
        // Retrieve test data
        Service_Agreement__c service = [SELECT Id FROM Service_Agreement__c LIMIT 1];
        
        Test.startTest();
        
        // Call method and store response
        Map<String, Object> result = AgreementsHandler.checkSignatureStatus(service.Id);
        
        Test.stopTest();
    }
    
    @isTest
    static void testCheckSignatureStatus_NoSignature() {
        // Create a new Offer_Template__c without a signature
        Service_Agreement__c service = new Service_Agreement__c(Name = 'Test No Signature');
        insert service;
        Offer_Template__c offer = new Offer_Template__c(ServiceId__c = service.Id);
        insert offer;
        
        Test.startTest();
        
        // Call method and store response
        Map<String, Object> result = AgreementsHandler.checkSignatureStatus(service.Id);
        
        Test.stopTest();
    }
    
    
    @isTest
static void testCheckSignatureStatus_NoOfferTemplate() {
    // No Offer_Template__c exists for this Service Agreement -> SOQL throws -> catch executes
    Service_Agreement__c service = new Service_Agreement__c(Name = 'No Offer');
    insert service;

    Test.startTest();
    AgreementsHandler.checkSignatureStatus(service.Id);
    Test.stopTest();
}

@isTest
static void testCheckSignatureStatus_RecipientMismatchOrNotCompleted() {
    // Offer exists but NOT signed because recipient doesn't match OR status isn't Completed
    Service_Agreement__c service = new Service_Agreement__c(Name = 'Mismatch');
    insert service;

    Offer_Template__c offer = new Offer_Template__c(
        ServiceId__c = service.Id,
        // Last email here is recipient2@email.com
        All_Recipients__c = 'recipient1@email.com\nrecipient2@email.com',
        // Mismatch on purpose
        Current_Recipient__c = 'someoneelse@email.com',
        // Or you can make status not completed (either condition fails)
        Current_Recipient_Status__c = 'Pending'
    );
    insert offer;

    Test.startTest();
    AgreementsHandler.checkSignatureStatus(service.Id);
    Test.stopTest();
}

@isTest
static void testCheckSignatureStatus_MatchCompleted_ButNoChildSignature() {
    // Offer meets recipient + Completed criteria, but no Child_Signatures__c exists
    // -> second SOQL throws -> catch executes
    Service_Agreement__c service = new Service_Agreement__c(Name = 'No Child Signature');
    insert service;

    Offer_Template__c offer = new Offer_Template__c(
        ServiceId__c = service.Id,
        // Include blanks + mixed newline styles to exercise getLastEmailFromAllRecipients()
        All_Recipients__c = 'first@email.com\r\n\r\n   LAST@Email.com   \n',
        Current_Recipient__c = ' last@email.com ',     // spacing + case -> normalizeEmail()
        Current_Recipient_Status__c = '  Completed  '  // trim + case-insensitive match
    );
    insert offer;

    Test.startTest();
    AgreementsHandler.checkSignatureStatus(service.Id);
    Test.stopTest();
}

@isTest
static void testCheckAttachmentSignatureStatus_HappyPath() {

    Attachment__c attachment = new Attachment__c(
        Name = 'Test Attachment'
    );
    insert attachment;

    Offer_Template__c offer = new Offer_Template__c(
        Attachment__c = attachment.Id,
        All_Recipients__c = 'user1@test.com\nuser2@test.com',
        Current_Recipient__c = 'USER2@test.com',
        Current_Recipient_Status__c = 'Completed'
    );
    insert offer;

    Child_Signatures__c sig = new Child_Signatures__c(
        Offer_Template__c = offer.Id,
         Signature_URL__c = 'https://test.com/sign.png'
    );
    insert sig;

    Test.startTest();

    Map<String,Object> result =
        AgreementsHandler.checkAttachmentSignatureStatus(attachment.Id);

    Test.stopTest();
 
}
}