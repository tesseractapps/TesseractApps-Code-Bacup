/**
 * @description       : 
 * @author            : Raja Sekhar Reddy
 * @group             : 
 * @Test Class        : HrInterviewHandlerTest
 * @last modified on  : 06-22-2023
 * @last modified by  : Raja Sekhar Reddy
**/
public with sharing class HrIntervieHandler {
    @AuraEnabled
    public static List<Job_Application__c> getInterviewUpdate(){
        String orgId = CurrentUserOrganization.currentOrgId();
        String organizationId = orgId.substring(0,15);
        try {
            List<Job_Application__c> jobappList = [SELECT id,Name,Advertisement__c,Application_status__c,Contact_Number__c,First_Name__c,
                    Interview_date__c,Job_Title__c,Last_Name__c,Email_Address__c
                     FROM Job_Application__c
                     WHERE Advertisement__r.Organization_Name__c=:organizationId and Application_status__c IN ('Vevo check (Work eligibility check)','NDIS Worker Screening clearance','Interview successful')];
            return jobappList;
            
        } catch (Exception e) { throw new AuraHandledException(e.getMessage());
        }
    }

}