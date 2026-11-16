/**
 * @description       : 
 * @author            : Raja Sekhar Reddy
 * @group             : 
 * @Test Class        : HrInterviewHandlerTest
 * @last modified on  : 06-17-2023
 * @last modified by  : Raja Sekhar Reddy
**/
public with sharing class HrJobApplicationHandler {

    @AuraEnabled
    public static void createJobApp(string fname,string lname,string contact,string email,string jobtitle,string intdate,string appstatus){
        
        List<Job_Application__c> appList=new List<Job_Application__c>();
        Job_Application__c appRec=new Job_Application__c();
        appRec.First_Name__c=fname;
        appRec.Last_Name__c=lname;
        appRec.Email_Address__c=email;
        appRec.Contact_Number__c=contact;
        appRec.Advertisement__c=jobtitle;
        appRec.Interview_date__c=Date.valueOf(intdate);
        appRec.Application_status__c=appstatus;
        appList.add(appRec);

        if(appList.size()!=0){
            insert appList;
        }
    }    
   
    
    @AuraEnabled
    public static List<Job_Application__c> getAppStatus(){
        String orgId = CurrentUserOrganization.currentOrgId();
        String organizationId = orgId.substring(0,15);
        
        try {
            return [SELECT id,Name,Advertisement__c,Application_status__c,Contact_Number__c,First_Name__c,Interview_date__c,
                    Job_Title__c,Last_Name__c,Email_Address__c,Advertisement__r.Organization_Name__c
                     FROM Job_Application__c where Advertisement__r.Organization_Name__c=:organizationId];
            
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}