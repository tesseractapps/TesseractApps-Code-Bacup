@isTest
public class InterviewFeedBackControllerTest {
    public static List<Feedback__c> createFeedback(){
        List<Job_Application__c> jobList = HrInterviewHandlerTest.createJobApplication();
        List<Feedback__c> feedbackList = new List<Feedback__c>();
        for(Integer i=0;i<=4;i++){
            Feedback__c feedback = new Feedback__c();
            feedback.Tell_us_about_yourselves_Rating__c=3;
            feedback.Tell_us_about_yourselves__c='abouturSelfAns';
            feedback.Have_you_ever_faced_any_confilict_Rating__c=2;
            feedback.Have_you_ever_faced_any_confilict__c='anyConfilictAns';
            feedback.Tell_us_about_your_NDISexperience_rating__c=3;
            feedback.Tell_us_about_your_experience_in_NDIS__c='experienceInNDISAns';
            feedback.Job_Application__c=jobList[0].Id;
            feedbackList.add(feedback);
            
        }
        insert feedbackList;
        return feedbackList;
        
    }
    static testMethod void InterviewFeedBackTest(){
        Test.startTest();
        List<Job_Application__c> jobList = HrInterviewHandlerTest.createJobApplication();
        InterviewFeedBackController.feedback('3', 'abouturSelfAns', '4', jobList[0].Id, 'anyConfilictAns', '3', 'experienceInNDISAns');
        InterviewFeedBackController.feedbackRec(jobList[0].Id);
        Test.stopTest();
    }
    
}