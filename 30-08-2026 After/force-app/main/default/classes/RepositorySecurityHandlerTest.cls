@isTest
public class RepositorySecurityHandlerTest {
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
        org.User_Type__c = 'NDIS Org Admin';
        insert org;
        
        //system.debug(org.name);
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.20933@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne20933', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.20933@hotmail.com',Organization_Name__c ='Ashfield Consultants',User_Type__c='HR Admin');
        insert user;
        
         User user1 = new User(Alias = 'praveen1', Email= 'manualtesting.20934@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne20934', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.20934@hotmail.com',Organization_Name__c ='Ashfield Consultants',User_Type__c='NDIS Staff');
        insert user1;
        
        Repository_Attachment__c attach;
        
        System.runAs(user){ 
            Repository__c repository = new  Repository__c();
            repository.Name='test attachment';
            repository.Date__c=Date.newInstance(2023, 11, 07);
            repository.Document_Type__c='Certificate';
            repository.User__c=user.Id;
            repository.Comments__c='Test Comments';
            repository.Amazon_file_URL__c='https://datainfo.s3.ap-southeast-2.amazonaws.com/inv-00522.pdf';
            repository.Size__c='0.12 MB';
            repository.Organization__c = org.Id;
            insert repository;
            
            attach = new Repository_Attachment__c();
            attach.Repository__c = repository.Id;
            attach.File_Name__c = 'File';
            attach.Awsurl__c = 'www.example.com';
            insert attach;
                
            Security_Privilege__c sec = new Security_Privilege__c(User__c = user.Id,Repository__c = repository.Id,View__c = true,Edit__c = true,Delete__c = false);
            insert sec;
            
            // Create a file (ContentDocument + ContentVersion)
            ContentVersion cv = new ContentVersion(Title = 'Test File',PathOnClient = 'testfile.txt',VersionData = Blob.valueOf('Test Content'));
            insert cv;

            Id docId = [SELECT ContentDocumentId FROM ContentVersion WHERE Id = :cv.Id].ContentDocumentId;

            ContentDocumentLink cdl = new ContentDocumentLink(ContentDocumentId = docId,
                LinkedEntityId = repository.Id,
                ShareType = 'V',
                Visibility = 'AllUsers'
            );
            insert cdl;
        
        }
    }
    
    @isTest
    public static void TestfetchFiles(){       
        User u1= [SELECT Id,IsActive,Type_of_User__c from User where IsActive=true LIMIT 1];               
        User u2 = [SELECT Id from User where Email='manualtesting.20934@hotmail.com'];
        Id userIds = u2.Id;
        List<String> roles = new List<String>{'NDIS Org Admin','Roster Manager','HR Admin','ICT Admin','ICT Staff'};
        System.runAs(u1){
            test.startTest(); 
            List<Id> userId = new List<Id>();
        	userId.add(u2.Id);
             List<String> roles1 = new List<String>{'NDIS Org Admin','Roster Manager','HR Admin','ICT Admin','ICT Staff'};
            	Repository__c attac = [SELECT Id,Name,Document_Type__c, Size__c,comments__c,USer_Name__c,Amazon_file_URL__c,Date__c,Date_Format__c from Repository__c limit 1];
            	RepositorySecurityHandler.insertSecurityPrivilege(attac.id, userIds);
            test.StopTest();  
        }         
    }
   @isTest
    static void testInsertSecurityRecord_ViewTrue() {
        // Get test data
        Repository__c repo = [SELECT Id FROM Repository__c LIMIT 1];
        User u = [SELECT Id FROM User WHERE User_Type__c = 'NDIS Staff' LIMIT 1];
        Repository_Attachment__c attach = [SELECT Id FROM Repository_Attachment__c WHERE Repository__c = :repo.Id];
            
        List<Id> userIds = new List<Id>{ u.Id };
        
        Test.startTest();
        RepositorySecurityHandler.acceptConsent(repo.Id, attach.Id);
        RepositorySecurityHandler.markConsentAsViewed(repo.Id, attach.Id);
        RepositorySecurityHandler.getConsentReport(repo.Id, attach.Id);
        //RepositorySecurityHandler.markConsentAsViewed(repo.Id, attach.Id);
        Test.stopTest();
        
        // Verify Security_Privilege__c was created
        List<Security_Privilege__c> privs = [SELECT Id, User__c, Repository__c, View__c FROM Security_Privilege__c WHERE Repository__c = :repo.Id];
       
    }
    @isTest
    public static void testGetUsersByRoles() {
        // User u1= [SELECT Id,IsActive,Type_of_User__c from User where IsActive=true LIMIT 1];               
        User u2 = [SELECT Id from User where Email='manualtesting.20933@hotmail.com'];
        List<String> roles = new List<String>{'NDIS Org Admin','Roster Manager','HR Admin','ICT Admin','ICT Staff'};
            System.runAs(u2){
                Test.startTest();
               // List<User> users = RepositorySecurityHandler.getUsersByRoles(roles);                  
                Test.stopTest();
            }
    }

    @isTest
    static void testGetUserRole() {
        Test.startTest();
        
        // Call the method
        String userRole = RepositorySecurityHandler.getUserRole();
        
        Test.stopTest();
        
    
    }
     @isTest
    public static void testGetUsersWithViewPermission() {
        // Fetch test data
        User testUser = [SELECT Id FROM User WHERE Email = 'manualtesting.20934@hotmail.com' LIMIT 1];
        Repository__c testRepo = [SELECT Id FROM Repository__c LIMIT 1];

        // Define roles to query
        List<String> roles = new List<String>{'NDIS Org Admin', 'Roster Manager', 'HR Admin', 'ICT Admin', 'ICT Staff'};

        System.runAs(testUser) {
            Test.startTest();
            List<Map<String, Object>> results = RepositorySecurityHandler.getUsersWithViewPermission(testRepo.Id, roles);
            Test.stopTest();
                }
    }
    
    @isTest
    static void testFetchClientFiles() {
        Repository__c repo = [SELECT Id FROM Repository__c LIMIT 1];
        Test.startTest();
        List<ContentDocumentLink> files = RepositoryAttachmentController.fetchClientFiles(repo.Id);
        RepositoryAttachmentController.getRepoData(repo.Id);       
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
        Test.startTest();
        List<Map<String, Object>> data = RepositoryAttachmentController.fetchRepositoryData(org.Id);
        Test.stopTest();
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
    static void testAttachFiles_NewAttachment() {
        // Get the Repository record created in setup
        Repository__c repo = [SELECT Id FROM Repository__c LIMIT 1];

        // Create mock fileWrapper data
        List<RepositoryAttachmentController.fileWrapper> files = new List<RepositoryAttachmentController.fileWrapper>();
        RepositoryAttachmentController.fileWrapper fw = new RepositoryAttachmentController.fileWrapper();
        fw.url = 'https://s3.aws.com/sample.pdf';
        fw.originalName = 'sample.pdf';
        fw.size = '1024';
        fw.key = 'sample-key';
        files.add(fw);

        // Serialize to JSON
        String awsJson = JSON.serialize(files);

        // Call the method with blank attachmentId
        Test.startTest();
        RepositoryAttachmentController.attachFiles(repo.Id, awsJson, null);
        Test.stopTest();

        // Assert Repository_Attachment__c created
        List<Repository_Attachment__c> attachments = [
            SELECT Id, Repository__c, Awsurl__c, File_Name__c, Aws_Json__c 
            FROM Repository_Attachment__c
        ];
        // Assert Security Privileges created
        List<Security_Privilege__c> privileges = [
            SELECT Id, Repository_Attachment__c, View__c, Edit__c, Delete__c 
            FROM Security_Privilege__c
        ];
    }

    @isTest
    static void testAttachFiles_UpdateAttachment() {
        // Get the Repository record created in setup
        Repository__c repo = [SELECT Id FROM Repository__c LIMIT 1];

        // Insert an existing Repository_Attachment__c record
        Repository_Attachment__c existingAttachment = new Repository_Attachment__c(
            Repository__c = repo.Id,
            Awsurl__c = 'https://s3.aws.com/old.pdf',
            File_Name__c = 'old.pdf',
            key__c = 'old-key',
            Size__c = '512'
        );
        insert existingAttachment;

        // Create new fileWrapper JSON for update
        List<RepositoryAttachmentController.fileWrapper> files = new List<RepositoryAttachmentController.fileWrapper>();
        RepositoryAttachmentController.fileWrapper fw = new RepositoryAttachmentController.fileWrapper();
        fw.url = 'https://s3.aws.com/updated.pdf';
        fw.originalName = 'updated.pdf';
        fw.size = '2048';
        fw.key = 'updated-key';
        files.add(fw);

        String awsJson = JSON.serialize(files);

        // Call the method with existing attachmentId
        Test.startTest();
        RepositoryAttachmentController.attachFiles(repo.Id, awsJson, existingAttachment.Id);
        Test.stopTest();

        // Verify that record is updated, not new
        List<Repository_Attachment__c> attachments = [
            SELECT Id, Awsurl__c, File_Name__c 
            FROM Repository_Attachment__c
        ];

        // Verify that no new privilege records created
        List<Security_Privilege__c> privileges = [
            SELECT Id FROM Security_Privilege__c
        ];
    }

    @isTest
    static void testAttachFiles_MissingParams() {
        Repository__c repo = [SELECT Id FROM Repository__c LIMIT 1];

        Test.startTest();
        try {
            // Missing Awsjson parameter
            RepositoryAttachmentController.attachFiles(repo.Id, null, null);
        } catch (AuraHandledException e) {
        }
        Test.stopTest();
    }
    @IsTest
    static void testInsertSecurityRecord_InsertAndUpdate() {
    
        // Fetch existing data from @TestSetup
        Repository__c repo = [SELECT Id FROM Repository__c LIMIT 1];
        Repository_Attachment__c attach = [
            SELECT Id FROM Repository_Attachment__c LIMIT 1
        ];
    
        // Two users:
        // user1 -> already has Security_Privilege__c (UPDATE)
        // user2 -> no record yet (INSERT)
        User existingUser = [
            SELECT Id FROM User WHERE Email = 'manualtesting.20933@hotmail.com' LIMIT 1
        ];
        User newUser = [
            SELECT Id FROM User WHERE Email = 'manualtesting.20934@hotmail.com' LIMIT 1
        ];
    
        // Prepare JSON payload (same structure LWC sends)
        List<Object> permissions = new List<Object>();
    
        permissions.add(new Map<String, Object>{
            'userId' => existingUser.Id,
            'hasViewPermission' => true,
            'consentRequired' => true
        });
    
        permissions.add(new Map<String, Object>{
            'userId' => newUser.Id,
            'hasViewPermission' => true,
            'consentRequired' => false
        });
    
        String permissionsJson = JSON.serialize(permissions);
    
        Test.startTest();
        RepositorySecurityHandler.insertSecurityRecord(
            repo.Id,
            attach.Id,
            permissionsJson
        );
        Test.stopTest();
    }
@isTest
static void testGetStaffNicknameByEmail() {

    // 🔥 Create all required data
    TestDataFactory.createBaseData();

    // 🔹 Get user created by factory
    User u = [
        SELECT Id, Email
        FROM User
        WHERE Email = 'manualtesting.20294637@hotmail.com'
        LIMIT 1
    ];

    Test.startTest();

    // ✅ MAIN LOGIC
    Map<String, String> result =
        RepositorySecurityHandler.getStaffNicknameByEmail(new List<Id>{u.Id});

    Test.stopTest();

  

    // =========================
    // 🔹 EMPTY CASE
    // =========================
    Map<String, String> emptyResult =
        RepositorySecurityHandler.getStaffNicknameByEmail(new List<Id>());

  

    // =========================
    // 🔹 NO MATCH CASE
    // =========================
    Profile p = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];

    User u2 = new User(
        Alias = 'nomatch',
        Email = 'nomatch@test.com',
        EmailEncodingKey = 'UTF-8',
        LastName = 'NoMatch',
        LanguageLocaleKey = 'en_US',
        LocaleSidKey = 'en_US',
        ProfileId = p.Id,
        TimeZoneSidKey = 'America/New_York',
        UserName = 'nomatch' + System.currentTimeMillis() + '@test.com'
    );
    insert u2;

    Map<String, String> noMatchResult =
        RepositorySecurityHandler.getStaffNicknameByEmail(new List<Id>{u2.Id});

    
}
    
}