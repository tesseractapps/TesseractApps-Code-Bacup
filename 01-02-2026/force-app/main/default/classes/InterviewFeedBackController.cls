/**
 * @description       : 
 * @author            : Raja Sekhar Reddy
 * @group             : 
 * @last modified on  : 06-17-2023
 * @last modified by  : Raja Sekhar Reddy
**/
public with sharing class InterviewFeedBackController {
    @AuraEnabled
    public static void feedback(string urSelfRating,string abouturSelfAns,string anyConfilict,String recordId,
                                string anyConfilictAns,string experienceInNDIS,string experienceInNDISAns){

        List<Feedback__c> feedbackList = new List<Feedback__c>();                            
        Feedback__c feedRec=new Feedback__c();
        feedRec.Tell_us_about_yourselves_Rating__c=Integer.ValueOf(urSelfRating);
        feedRec.Tell_us_about_yourselves__c=abouturSelfAns;
        feedRec.Have_you_ever_faced_any_confilict_Rating__c=Integer.ValueOf(anyConfilict);
        feedRec.Have_you_ever_faced_any_confilict__c=anyConfilictAns;
        feedRec.Tell_us_about_your_NDISexperience_rating__c=Integer.ValueOf(experienceInNDIS);
        feedRec.Tell_us_about_your_experience_in_NDIS__c=experienceInNDISAns;
        feedRec.Job_Application__c=recordId;
        feedbackList.add(feedRec);
        
        if(feedbackList.size()>0){
            insert feedbackList;
        }
        
    }
    @AuraEnabled
    public static Feedback__c feedbackRec(String recordId){
        return [select id,Tell_us_about_yourselves_Rating__c,Tell_us_about_yourselves__c,Have_you_ever_faced_any_confilict_Rating__c,
        Have_you_ever_faced_any_confilict__c,Tell_us_about_your_NDISexperience_rating__c,Tell_us_about_your_experience_in_NDIS__c,Job_Application__c
        from Feedback__c where Job_Application__c=:recordId];
    }

}