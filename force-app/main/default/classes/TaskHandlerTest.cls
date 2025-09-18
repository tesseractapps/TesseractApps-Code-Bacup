@isTest
public class TaskHandlerTest {
    public static Task createTask(){
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
        User user = new User(Alias = 'praveen', Email= 'manualtesting.2094633@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne2094633', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.2094633@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        insert user;
        
        User testUser = [SELECT Id FROM User WHERE Id = :UserInfo.getUserId()];
        
        Task testTask1 = new Task(
            OwnerId = testUser.Id,
            Subject = 'Approval Request',
            Status = 'New',
            ActivityDate = Date.today()
        );
        
        Task testTask2 = new Task(
            OwnerId = testUser.Id,
            Subject = 'Leave Request',
            Status = 'In Progress',
            ActivityDate = Date.today().addDays(5)
        );

        Task testTask3 = new Task(
            OwnerId = testUser.Id,
            Subject = 'Incident Register',
            Status = 'Completed',
            ActivityDate = Date.today().addDays(10)
        );

        Task testTask4 = new Task(
            OwnerId = testUser.Id,
            Subject = 'Random Task',
            Status = 'New',
            ActivityDate = Date.today().addDays(15)
        );

        insert new List<Task>{ testTask1, testTask2, testTask3, testTask4 };
        Task taskRec = new Task();
        taskRec.OwnerId=user.id;
        taskRec.Status='New';
        taskRec.Subject='Call';
        taskRec.Priority='High';
        taskRec.ActivityDate=System.today();
        taskRec.Description='commentsValue';
        insert taskRec;
        
        return taskRec; 
    }
       
       
    static testMethod void taskHandlerTest() {
        User u4= [SELECT Id, Name, Email, IsActive, Profile.Name 
                   FROM User WHERE Profile.Name LIKE '%Admin%' AND IsActive = TRUE limit 1];
 
        Test.startTest();
            String sDate =String.valueOf(System.today());
            TaskCreateHandler.listOfUsers(u4.Id);
            TaskCreateHandler.createTaskRecord(u4.Id, 'New', 'Call', 'High',sDate , 'commentsValue');
            TaskHandler.taskDetails();
            
           
        Test.stopTest();
        
    }   
    
      @isTest
    static void testGetTaskDetails_Success() {
        User u4 = [SELECT Id, Name, Email, IsActive FROM User WHERE Id = :UserInfo.getUserId()];
        
        System.runAs(u4) {
            Test.startTest();
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/FetchTask/';
            RestContext.request = req;
            RestContext.response = res;

            mobileAppTaskHandler.getTaskDetails();
            
            Test.stopTest();

            // Assertions
            System.assertEquals(200, res.statusCode);
            String responseBody = res.responseBody.toString();
            

        }
    }

   
    
}