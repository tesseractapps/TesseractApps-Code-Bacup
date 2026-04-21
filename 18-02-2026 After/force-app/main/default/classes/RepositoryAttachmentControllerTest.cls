@isTest
public class RepositoryAttachmentControllerTest {
	@testsetup Static void testData(){
        
       
        //system.debug(org.name);
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        UserRole role = [SELECT Id FROM UserRole WHERE Name = 'Portal Account Partner User' LIMIT 1];
        UserRole role1 = [SELECT Id FROM UserRole WHERE Name = 'Portal Account Partner Manager' LIMIT 1];
        
        User user = new User(Alias = 'praveen', Email= 'manualtesting.20933@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne20933', LanguageLocaleKey='en_US',        //UserRoleId = role1.Id,
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.20933@hotmail.com',Organization_Name__c ='Ashfield Consultants',User_Type__c='HR Admin');
        insert user;
        UserRole adminRole = [
    SELECT Id 
    FROM UserRole 
    WHERE Name = 'Admin' 
    LIMIT 1
];
         User user1 = new User(Alias = 'praveen1', Email= 'manualtesting.20934@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne20934', LanguageLocaleKey='en_US',
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.20934@hotmail.com',UserRoleId = adminRole.Id,Organization_Name__c ='Ashfield Consultants',User_Type__c='NDIS Staff');
        insert user1;
        Repository_Attachment__c attach;
        System.runAs(user){ 
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
        org.User_Type__c = 'NDIS Org Admin';
        insert org;
            
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
            
            attach = new Repository_Attachment__c();
            attach.Repository__c = repository.Id;
            attach.File_Name__c = 'File';
            attach.Awsurl__c = 'www.example.com';
            insert attach;
            Security_Privilege__c parentPriv = new Security_Privilege__c(
    Repository__c = repository.Id,
    User__c = user.Id,
    View__c = true,
    Edit__c = true,
    Delete__c = true
);
insert parentPriv;

Security_Privilege__c childPriv = new Security_Privilege__c(
    Repository__c = repository.Id,
    Repository_Attachment__c = attach.Id,
    User__c = user.Id,
    View__c = true,
    Edit__c = true,
    Delete__c = true
);
insert childPriv;
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
    static void testFetchClientFiles() {
        Repository__c repo = [SELECT Id FROM Repository__c LIMIT 1];
        Test.startTest();
        List<ContentDocumentLink> files = RepositoryAttachmentController.fetchClientFiles(repo.Id);
        Test.stopTest();
    }

    @isTest
    static void testUpdateFileSize() {
        Repository__c repo = [SELECT Id FROM Repository__c LIMIT 1];
        Test.startTest();
        String result = RepositoryAttachmentController.UpdateFileSize(repo.Id, '1.5 MB');
        Test.stopTest();
        System.assertEquals('Updated', result);
        System.assertEquals('1.5 MB', [SELECT Size__c FROM Repository__c WHERE Id = :repo.Id].Size__c);
    }

    @isTest
    static void testFetchRepositoryData() {
        Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
        
        Test.startTest();
        List<Map<String, Object>> data = RepositoryAttachmentController.fetchRepositoryData(org.Id);
        Test.stopTest();
        System.assert(!data.isEmpty(), 'Repository data should not be empty');
        System.assert(data[0].containsKey('HasReadAccess'), 'Access keys should be present');
    }

    @isTest
    static void testDeleteRepository() {
        Repository__c repo = new Repository__c(
            Name = 'Delete Me',
            Date__c = Date.today(),
            Type__c = 'Certificate'
        );
        insert repo;
        Test.startTest();
        RepositoryAttachmentController.deleteRepository(repo.Id);
        Test.stopTest();
        System.assertEquals(0, [SELECT COUNT() FROM Repository__c WHERE Id = :repo.Id]);
    }

    @isTest
    static void testGetRelatedFilesByRecordId() {
        Repository__c repo = [SELECT Id FROM Repository__c LIMIT 1];
        Test.startTest();
        Map<Id, String> files = RepositoryAttachmentController.getRelatedFilesByRecordId(repo.Id);
        Test.stopTest();
        System.assert(!files.isEmpty(), 'Should return related files map');
    }

    @isTest
    static void testSaveFileToAttachment() {
        Repository__c repo = [SELECT Id FROM Repository__c LIMIT 1];
        Test.startTest();
        RepositoryAttachmentController.saveFileToAttachment('col1,col2\nval1,val2', repo.Id);
        Test.stopTest();
        List<Attachment> attList = [SELECT Id, Name FROM Attachment WHERE ParentId = :repo.Id];
        System.assertEquals(1, attList.size(), 'CSV attachment should be created');
        System.assertEquals('data.csv', attList[0].Name);
    }
@isTest
static void testAttachFiles() {
    Repository__c repo = [SELECT Id FROM Repository__c LIMIT 1];

    String json = JSON.serialize(new List<Object>{
        new Map<String,Object>{
            'url' => 'https://aws.test/file.pdf',
            'originalName' => 'file.pdf',
            'size' => '120 KB',
            'key' => 'aws-key-1'
        }
    });

    Test.startTest();
    RepositoryAttachmentController.attachFiles(
        repo.Id,
        json,
        null
    );
    Test.stopTest();

}
@isTest
static void testGetRepositoryHistoryLog() {
    Repository__c repo = [SELECT Id FROM Repository__c LIMIT 1];

    Test.startTest();
    String historyJson = RepositoryAttachmentController.getRepositoryHistoryLog(repo.Id);
    Test.stopTest();

}
@isTest
static void testGetRepoData() {
    Repository__c repo = [
        SELECT Id 
        FROM Repository__c 
        LIMIT 1
    ];

    Test.startTest();
    Repository__c result = RepositoryAttachmentController.getRepoData(repo.Id);
    Test.stopTest();

}

}