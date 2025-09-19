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
        }
    }
    
    @isTest
    public static void TestfetchFiles(){       
        User u1= [SELECT Id,IsActive,Type_of_User__c from User where IsActive=true LIMIT 1];               
        User u2 = [SELECT Id from User where Email='manualtesting.20934@hotmail.com'];
        List<String> roles = new List<String>{'NDIS Org Admin','Roster Manager','HR Admin','ICT Admin','ICT Staff'};
        System.runAs(u1){
            test.startTest(); 
            List<Id> userId = new List<Id>();
        	userId.add(u2.Id);
             List<String> roles1 = new List<String>{'NDIS Org Admin','Roster Manager','HR Admin','ICT Admin','ICT Staff'};
            	Repository__c attac = [SELECT Id,Name,Type__c, Size__c,comments__c,USer_Name__c,Amazon_file_URL__c,Date__c,Date_Format__c from Repository__c limit 1];
            	RepositorySecurityHandler.insertRepositorySecurity(attac.id, userId, true);
            test.StopTest();  
        }         
    }
    @isTest
    public static void testGetUsersByRoles() {
        // User u1= [SELECT Id,IsActive,Type_of_User__c from User where IsActive=true LIMIT 1];               
        User u2 = [SELECT Id from User where Email='manualtesting.20933@hotmail.com'];
        List<String> roles = new List<String>{'NDIS Org Admin','Roster Manager','HR Admin','ICT Admin','ICT Staff'};
            System.runAs(u2){
                Test.startTest();
                List<User> users = RepositorySecurityHandler.getUsersByRoles(roles);                  
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

            // Validate results
            System.assertNotEquals(null, results, 'Results should not be null');
            System.assert(results.size() > 0, 'At least one user should be returned');

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
    
}