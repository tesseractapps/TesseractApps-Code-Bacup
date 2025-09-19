@isTest
public class RepositoryAttachmentControllerTest {
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
        User user = new User(Alias = 'praveen', Email= 'manualtesting.20933@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne20933', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.20933@hotmail.com',Organization_Name__c ='Ashfield Consultants',User_Type__c='HR Admin');
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
            
            Repository__c repository = new  Repository__c();
            repository.Name='test attachment11';
            repository.Date__c=Date.newInstance(2023, 11, 07);
            repository.Type__c='Certificate';
            repository.User__c=user.id;
            repository.Comments__c='Test Comments';
            repository.Amazon_file_URL__c='https://datainfo.s3.ap-southeast-2.amazonaws.com/inv-00522.pdf';
            repository.Size__c='0.12 MB';
            repository.Organization__c = org.Id;
            repository.OwnerId=user.id;
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
            
            Repository__c repositoryRec = new  Repository__c();
            repositoryRec.Name='test attachment';
            repositoryRec.Date__c=Date.newInstance(2023, 11, 07);
            repositoryRec.Type__c='Certificate';
            repositoryRec.User__c=user.id;
            repositoryRec.Comments__c='Test Comments';
            repositoryRec.Amazon_file_URL__c='https://datainfo.s3.ap-southeast-2.amazonaws.com/inv-00522.pdf';
            repositoryRec.Size__c='0.12 MB';
            repositoryRec.OwnerId=user.id;
            insert repositoryRec;
            
           // Explicitly share the Repository record if neede          
            // Create a test Account to use as the ParentId
            Account testAccount = new Account(
                Name = 'Test Account'
            );
            insert testAccount;
        }
    }
    @isTest
    public static void TestfetchFiles(){
        Organisation__c org = [SELECT Id,Name from Organisation__c where name='Ashfield Consultants' limit 1];
        String orgId = org.Id;    
        User u1= [SELECT Id from User where email='manualtesting.20933@hotmail.com' LIMIT 1];
        List<Id> userIdList = new List<Id>();
        userIdList.add(u1.Id);
        Client__c cli = [select Id from Client__c];
        string recordId = cli.Id;     
      
       
        System.runAs(u1){
            test.startTest();
            Repository__c attac = [SELECT Id,Name,Type__c, Size__c,comments__c,USer_Name__c,Amazon_file_URL__c,Date__c,Date_Format__c from Repository__c limit 1];
            RepositoryAttachmentController.fetchClientFiles(recordId);
            RepositoryAttachmentController.getRelatedFilesByRecordId(recordId);
            RepositoryAttachmentController.fetchRepositoryData(orgId);
            RepositoryAttachmentController.deleteRepository(attac.Id);
            Repository__c reposiroryRec1= [SELECT Id,Name,Type__c, Size__c,comments__c,USer_Name__c,Amazon_file_URL__c,Date__c,Date_Format__c from Repository__c  limit 1];
            RepositoryAttachmentController.UpdateFileSize(reposiroryRec1.id, '0.12MB');
            List<User> returnedUsers = RepositorySecurityHandler.getUsersByRoles(new List<String>{'HR Admin', 'NDIS Staff', 'NDIS Org Admin'});
            //st<User> users = [SELECT Id FROM User WHERE IsActive = true LIMIT 2];
            //erIdList.add(users[1].Id);
            //positorySecurityHandler.insertRepositorySecurity(attac.id, userIdList, true);
            test.StopTest();  
        }
    }

    @isTest
    public static void testSaveFileToAttachment() {
        // Fetch the test Account created in the test setup
        Account testAccount = [SELECT Id FROM Account LIMIT 1];
        // CSV content to be saved as an attachment
        String csvContent = 'Name, Age, Gender\nJohn, 25, Male\nJane, 30, Female';
        Test.startTest();
        // Call the method and pass the test Account Id and CSV content
        RepositoryAttachmentController.saveFileToAttachment(csvContent, testAccount.Id);
        Test.stopTest();        
    }
    
    @isTest
    public static void testSaveFileToAttachmentWithError() {
        Test.startTest();

        Boolean exceptionThrown = false;
        String expectedPartialMessage = 'Error saving CSV';

        // Attempt to call the method with a null objectId to simulate an error
        try {
            RepositoryAttachmentController.saveFileToAttachment('Name, Age\nJohn, 25', null);
        } catch (AuraHandledException e) {
            exceptionThrown = true;           
        }
        Test.stopTest();
    }
}