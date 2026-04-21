@isTest
public class clientAttachmentTest{
    @testsetup Static void testData(){
        Organisation__c org = new Organisation__c();
        org.Name='Ashfield Consultants';
        org.ABN__c='11234567891';
        org.ACN__c='878787878';
        org.Contact_No__c='6132899740';
        org.RCTI__c='RCTI1';
        org.Email__c='dsfdsfsd@gmail.com';
        org.Bank__c='Bank Test';
        org.BSB__c='BSB Test';
        org.Account_Name__c='Test Account';
        org.Account_Number__c='1111111111';
        org.Description__c='test Desc';
        org.Address_Latest__Street__s='101';
        org.Address_Latest__City__s='Himas Waterhen';
        org.Address_Latest__PostalCode__s='2060';
        org.Address_Latest__CountryCode__s='AU';
        org.Address_Latest__StateCode__s='NSW';
        org.NDIS_Provider__c='12341234565';
        org.BMSI_Identifier__c ='TEST BMSI';
        org.SoftwareId__c = 'jhdfn18328';
        org.Branch_code__c = 'BS123';
        org.Contact_Name__c = 'Test Contact';
        insert org;
        
        //system.debug(org.name);
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.20972@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne20972', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.20972@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        insert user;
        
        System.runAs(user){  
            Facility__c fac = new Facility__c();
            fac.Name='Ashfield Consultants';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Address__CountryCode__s='AU';
            fac.Email__c= 'testonefacility@gmail.com';
            fac.Status__c=true;
            fac.Organisation__c= org.Id;
            insert fac;
        
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
            
            Attachment__c attach = new  Attachment__c();
            attach.Added_By__c=cli.Id;
            attach.Name='test attachment';
            attach.Date__c=Date.newInstance(2023, 11, 07);
            attach.Type__c='Certificate';
            attach.Type_of_Document__c='GP Cerificate';
            attach.User__c=UserInfo.getUserId();
            attach.Comments__c='Test Comments';
            attach.Amazon_file_URL__c='https://datainfo.s3.ap-southeast-2.amazonaws.com/inv-00522.pdf';
            attach.Size__c='0.12 MB';
            insert attach;
            
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
            cdl.LinkedEntityId = attach.Id;
            cdl.ShareType = 'V';
            cdl.Visibility = 'AllUsers';
            insert cdl;  
            ContentDocumentLink resultCdl = [SELECT Id, ContentDocumentId FROM ContentDocumentLink WHERE LinkedEntityId = :attach.Id LIMIT 1];  
            Attachment__c attachmentRec = new  Attachment__c();
            attachmentRec.Added_By__c=cli.Id;
            attachmentRec.Name='test attachment';
            attachmentRec.Date__c=Date.newInstance(2023, 11, 07);
            attachmentRec.Type__c='Certificate';
            attachmentRec.Type_of_Document__c='GP Cerificate';
            attachmentRec.User__c=UserInfo.getUserId();
            attachmentRec.Comments__c='Test Comments';
            attachmentRec.Amazon_file_URL__c='https://datainfo.s3.ap-southeast-2.amazonaws.com/inv-00522.pdf';
            attachmentRec.Size__c='0.12 MB';
            insert attachmentRec;
        }
    }
    @isTest
    public static void TestfetchFiles(){
          
        User u2= [SELECT Id from User where email='manualtesting.20972@hotmail.com' LIMIT 1];
        System.runAs(u2){
             Client__c cli = [select Id from Client__c];
        string recordId = cli.Id;     
        Attachment__c attac = [SELECT Id,Name,Type__c, Size__c,comments__c,USer_Name__c,Amazon_file_URL__c,Date__c,Date_Format__c from Attachment__c limit 1];
       
        test.startTest();
        ClientAttachmentHandler.fetchClientFiles(recordId);
        ClientAttachmentHandler.getRelatedFilesByRecordId(recordId);
        ClientAttachmentHandler.fetchRepositoryData(recordId);
        ClientAttachmentHandler.deleteRepository(attac.Id);
        Attachment__c attachmentRec= [SELECT Id,Name,Type__c, Size__c,comments__c,USer_Name__c,Amazon_file_URL__c,Date__c,Date_Format__c from Attachment__c limit 1];
        ClientAttachmentHandler.UpdateFileSize(attachmentRec.id, '0.12MB');
         RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.params.put('ParticipantId',recordId);
            req.requestURI = 'https://pinnacleit--tesseract.sandbox.lightning.force.com/services/apexrest/ParticipantAttachment/';
            RestContext.request = req;
            RestContext.response = res;
       		List<Attachment__c> clientattch= mobileAppParticipantAttatchment.getClientAttatchment();
        
        test.StopTest(); 
        }
      
        
    }
    
}