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
        
        System.runAs(user){ 
            Repository__c repository = new  Repository__c();
            repository.Name='test attachment';
            repository.Date__c=Date.newInstance(2023, 11, 07);
            repository.Type__c='Certificate';
            repository.User__c=user.Id;
            repository.Comments__c='Test Comments';
            repository.Amazon_file_URL__c='https://datainfo.s3.ap-southeast-2.amazonaws.com/inv-00522.pdf';
            repository.Size__c='0.12 MB';
            repository.Organization__c = org.Id;
            insert repository;
            
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
            	Repository__c attac = [SELECT Id,Name,Type__c, Size__c,comments__c,USer_Name__c,Amazon_file_URL__c,Date__c,Date_Format__c from Repository__c limit 1];
            	RepositorySecurityHandler.insertSecurityPrivilege(attac.id, userIds);
            test.StopTest();  
        }         
    }
    @isTest
    static void testInsertSecurityRecord_ViewTrue() {
        // Get test data
        Repository__c repo = [SELECT Id FROM Repository__c LIMIT 1];
        User u = [SELECT Id FROM User WHERE User_Type__c = 'NDIS Staff' LIMIT 1];
        
        List<Id> userIds = new List<Id>{ u.Id };
        
        Test.startTest();
        RepositorySecurityHandler.insertSecurityRecord(repo.Id, userIds, true);
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
            Boolean foundUserWithViewAccess = false;
            for (Map<String, Object> userMap : results) {
                User u = (User) userMap.get('user');
                Boolean hasViewPermission = (Boolean) userMap.get('hasViewPermission');

                if (u.Email == 'user2@example.com') {
                    foundUserWithViewAccess = true;
                    System.assertEquals(true, hasViewPermission, 'User2 should have view permission');
                }
            }
        }
    }
    @isTest
    static void testFetchClientFiles() {
        Repository__c repo = [SELECT Id FROM Repository__c LIMIT 1];
        Test.startTest();
        List<ContentDocumentLink> files = RepositoryAttachmentController.fetchClientFiles(repo.Id);
        Test.stopTest();
        System.assert(!files.isEmpty(), 'Should fetch linked files');
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
    
}