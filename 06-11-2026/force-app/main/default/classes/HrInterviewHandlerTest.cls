@isTest
public class HrInterviewHandlerTest {
    public static List<Job_Application__c> createJobApplication(){
        List<Advertisement__c> adsList = HrHomeHandlerTest.createAdvertisements();
        List<Job_Application__c> jobAppList = new List<Job_Application__c>();
        for(Integer i=0;i<=3;i++){
            Job_Application__c jobapp = new Job_Application__c();
            jobapp.Advertisement__c = adsList[0].Id;
            jobapp.Application_status__c = 'Vevo check (Work eligibility check)';
            jobapp.Contact_Number__c='0433123457';
            jobapp.Email_Address__c='email@gmail.com'+i;
            jobapp.First_Name__c='test'+i;
            jobapp.Interview_date__c=system.today();
            jobapp.Last_Name__c='test';
            jobAppList.add(jobapp);
        }
        try{
            insert jobappList;
        }catch(DMLException e){
            system.assertEquals(e.getMessage(), e.getMessage()); 
        }
        
        return jobAppList;
        
    }
    static testMethod void hrHanlderTest(){
        Test.startTest();
        
        List<Job_Application__c> jobappList = createJobApplication();
        Job_Application__c jobApp = new Job_Application__c(Id=jobappList[0].Id);
         jobApp.Application_status__c='Interview successful';
        update jobApp;
        String adId = jobappList[0].Advertisement__c;
        
        HrIntervieHandler.getInterviewUpdate();
        String sDate = String.valueOf(System.today());
      
        HrJobApplicationHandler.getAppStatus();
        HrJobApplicationHandler.createJobApp('fname', 'lname', '0433123457', 'email1@gmail.ocmFinal', adId, sDate, 'Vevo check (Work eligibility check)');
        Test.stopTest();
    }
    
}