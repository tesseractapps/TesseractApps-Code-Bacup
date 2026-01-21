@isTest
public class MobileAppTaskTestClass {
     @testSetup
    static void setupTestData() {
        //system.debug(org.name);
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.20923443@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne2094633', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.20923443@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        insert user;
       System.runAs(user) {
        
        List<Task> tasks = new List<Task>{
            new Task(
                OwnerId = user.Id,
                Subject = 'Approval Request',
                Status = 'New',
                ActivityDate = Date.today()
            ),
            new Task(
                OwnerId = user.Id,
                Subject = 'Leave Request',
                Status = 'In Progress',
                ActivityDate = Date.today().addDays(5)
            ),
            new Task(
                OwnerId = user.Id,
                Subject = 'Incident Register',
                Status = 'Completed',
                ActivityDate = Date.today().addDays(10)
            )
        };

        insert tasks;
            
           RestRequest req = new RestRequest();
           RestResponse res = new RestResponse();
           req.requestURI = '/services/apexrest/FetchTask/';
           RestContext.request = req;
           RestContext.response = res;
           TaskHandler.taskDetails();
           
           mobileAppTaskHandler.getTaskDetails();
        
        system.debug('task '+tasks);
       }
    }

    @isTest
    static void testGetTaskDetails_Success() {
        User testUser = [SELECT Id FROM User WHERE Id = :UserInfo.getUserId()];
        
        System.runAs(testUser) {
            Test.startTest();
           
            
            Test.stopTest();

            // Assertions
           
        }
    }



}