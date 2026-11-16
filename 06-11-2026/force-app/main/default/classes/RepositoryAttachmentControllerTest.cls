@isTest
public class RepositoryAttachmentControllerTest {
	@testsetup Static void testData(){
        
       
        //system.debug(org.name);
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        UserRole role = [SELECT Id FROM UserRole WHERE Name = 'Portal Account Partner User' LIMIT 1];
        UserRole role1 = [SELECT Id FROM UserRole WHERE Name = 'Portal Account Partner Manager' LIMIT 1];
        
        User user = new User(Alias = 'praveen', Email= 'manualtesting.20933@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne20933', LanguageLocaleKey='en_US',        //UserRoleId = role1.Id,
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.20933@hotmail.com',Organization_Name__c ='Ashfield Consultants',User_Type__c='NDIS Org Admin');
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
        org.Repository_Type__c = 'NDIS Org Admin';
        insert org;
            
            Repository__c repository = new  Repository__c();
            repository.Name='test attachment11';
            repository.Date__c=Date.newInstance(2023, 11, 07);
            repository.Document_Type__c='Certificate';
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
            repositoryRec.Document_Type__c='Certificate';
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
    }

    @isTest
    static void testFetchRepositoryData() {
        Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
        User user = [SELECT Id FROM User WHERE Email='manualtesting.20934@hotmail.com' LIMIT 1];
        system.runas(user){
            Test.startTest();
            List<Map<String, Object>> data = RepositoryAttachmentController.fetchRepositoryData(org.Id);
            List<String> getRepoTypes = RepositoryAttachmentController.getRepoTypes(org.Id);
            RepositoryAttachmentController.saveNewRepoType(org.Id, 'GitHub');
            RepositoryAttachmentController.deleteRepoType(org.Id, 'GitLab');
            RepositoryAttachmentController.renameRepoType(org.Id, 'GitHub', 'Bitbucket');
            Test.stopTest();
        }
    }

    @isTest
    static void testDeleteRepository() {
        Repository__c repo = new Repository__c(
            Name = 'Delete Me',
            Date__c = Date.today(),
            Document_Type__c = 'Certificate'
        );
        insert repo;
        Test.startTest();
        RepositoryAttachmentController.deleteRepository(repo.Id);
        Test.stopTest();
    }

    @isTest
    static void testGetRelatedFilesByRecordId() {
        Repository__c repo = [SELECT Id FROM Repository__c LIMIT 1];
        Test.startTest();
        Map<Id, String> files = RepositoryAttachmentController.getRelatedFilesByRecordId(repo.Id);
        Test.stopTest();
    }

    @isTest
    static void testSaveFileToAttachment() {
        Repository__c repo = [SELECT Id FROM Repository__c LIMIT 1];
        Test.startTest();
        RepositoryAttachmentController.saveFileToAttachment('col1,col2\nval1,val2', repo.Id);
        Test.stopTest();
        List<Attachment> attList = [SELECT Id, Name FROM Attachment WHERE ParentId = :repo.Id];
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
/*@isTest
static void testGetRepositoryHistoryLog() {
    Repository__c repo = [SELECT Id FROM Repository__c LIMIT 1];

    Test.startTest();
    String historyJson = RepositoryAttachmentController.getRepositoryHistoryLog(repo.Id);
    Test.stopTest();

}*/
    
    @isTest
static void testGetRepositoryHistoryLog() {

    Repository__c repo = [
        SELECT Id
        FROM Repository__c
        LIMIT 1
    ];

    User usr = [
        SELECT Id
        FROM User
        WHERE Email = 'manualtesting.20933@hotmail.com'
        LIMIT 1
    ];

    Security_Privilege__c sec = [
        SELECT Id
        FROM Security_Privilege__c
        WHERE Repository__c = :repo.Id
        LIMIT 1
    ];

    List<Staff_Document_View__c> logs = new List<Staff_Document_View__c>();

    // Repository level actions
    logs.add(new Staff_Document_View__c(
        Repository__c = repo.Id,
        Action__c = 'File Viewed'
    ));

    logs.add(new Staff_Document_View__c(
        Repository__c = repo.Id,
        Action__c = 'File Edited'
    ));

    // Security level actions
    logs.add(new Staff_Document_View__c(
        Security_Privilege__c = sec.Id,
        Action__c = 'New'
    ));

    logs.add(new Staff_Document_View__c(
        Security_Privilege__c = sec.Id,
        Action__c = 'View and Consent'
    ));

    logs.add(new Staff_Document_View__c(
        Security_Privilege__c = sec.Id,
        Action__c = 'Consent Access'
    ));

    logs.add(new Staff_Document_View__c(
        Security_Privilege__c = sec.Id,
        Action__c = 'Consent Revoked'
    ));

    logs.add(new Staff_Document_View__c(
        Security_Privilege__c = sec.Id,
        Action__c = 'Consent Accepted'
    ));

    logs.add(new Staff_Document_View__c(
        Security_Privilege__c = sec.Id,
        Action__c = 'File Viewed'
    ));

    logs.add(new Staff_Document_View__c(
        Security_Privilege__c = sec.Id,
        Action__c = 'File Edited'
    ));

    insert logs;

    // Revoke branch
    Security_Privilege__c revoke = new Security_Privilege__c(
        Repository__c = repo.Id,
        User__c = usr.Id,
        View__c = false,
        Consent_Required__c = false
    );
    insert revoke;

    Test.startTest();

    RepositoryAttachmentController.getRepositoryHistoryLog(repo.Id);

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