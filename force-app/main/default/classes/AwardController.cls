public with sharing class AwardController {
     @AuraEnabled(cacheable=true)
    public static List<Award__c> getAwards(Id recordId, string orgId) {
        System.debug('recordid' +recordId);
        return [SELECT Id,Awards__c,Facility__r.Name,Staff__r.Name,Staff__r.Last_Name__c,Staff__r.Display_Nickname__c,Date__c,Issued_by__c,Certificate__c from Award__c where Staff__c  =: recordId AND Staff__r.Facility__r.Organisation__c  =: orgId ORDER BY CreatedDate DESC];
    }
    @AuraEnabled(cacheable=true)
    public static List<Award__c> getAwardsByOrg(string orgId) {
       System.debug('orgid' +orgId);
        return [SELECT Id,Awards__c,Facility__r.Name,Staff__r.Name,Staff__r.Last_Name__c,Staff__r.Display_Nickname__c,Date__c,Issued_by__c,Certificate__c from Award__c where 	Staff__r.Facility__r.Organisation__c  =: orgId ORDER BY CreatedDate DESC];
    }
    @AuraEnabled
    public static List<Staff__c> getStaffList(String orgId , String facilityId ) {
        //String currentUserEmail = UserInfo.getUserEmail();
         System.debug('orgid' +orgId);  
         return [SELECT Id, Name,Last_Name__c,Facility__c, Facility_Name__c, Display_Nickname__c,Role__c, Email_Address__c FROM Staff__c WHERE Facility__r.Organisation__c = :orgid AND Facility__c =:facilityId];
       
     }

}