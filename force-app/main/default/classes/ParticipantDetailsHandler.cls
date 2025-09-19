/**
* @description       : 
* @author            : Raja Sekhar Reddy
* @group             : 
* @last modified on  : 06-18-2023
* @last modified by  : Raja Sekhar Reddy
**/
public with sharing class ParticipantDetailsHandler {
    @AuraEnabled
    public static list<Client_Journel__c> listOfClientjounel(String recordId){
        return [select id,Description__c,CreatedDate__c,LastModifiedDate,createdDate,CreatedBy.Name,CreatedBy.SmallPhotoUrl,Care_Notes__c,staff__r.name,staff__r.Last_Name__c,staff__r.picture__c from Client_Journel__c where Client__c=:recordId Order by createdDate desc ];
    }

    @AuraEnabled
    public static string saveDesc(String recordId,String jounelId,String description, String jNoteType){
        String UserEmail = UserInfo.getUserEmail(); 
        Staff__c staffData=[SELECT id,Name,role__c,Facility__c FROM Staff__c 
                                WHERE Email_Address__c =:UserEmail LIMIT 1];
        List<Client_Journel__c> duplicateCareNotes = [SELECT Id,Care_Notes__c,Client__c FROM Client_Journel__c WHERE Client__c=:recordId AND Care_Notes__c = :jNoteType AND CreatedBy.Email =:UserEmail AND createdDate=TODAY];
        System.debug('duplicateCareNotes '+ duplicateCareNotes); 
            if ((jounelId==null || jounelId=='') && !duplicateCareNotes.isEmpty()) {
            	return 'duplicate';
            }
            try{
            if(jounelId==null || jounelId==''){
                Client_Journel__c clientJournelRec = new Client_Journel__c();
                clientJournelRec.Client__c=recordId;
                clientJournelRec.Description__c=description;
                clientJournelRec.Care_Notes__c=jNoteType;
                clientJournelRec.Staff__c=staffData.id;
                 insert clientJournelRec;                
            }else if(jounelId!=null ) {
                Client_Journel__c clientJournelRec = new Client_Journel__c(Id=jounelId);
                clientJournelRec.Description__c=description;
                clientJournelRec.Id =jounelId;
                clientJournelRec.Staff__c=staffData.id;
                update clientJournelRec;
                return 'Updated';                
            }
            else if(jounelId!=null && !duplicateCareNotes.isEmpty()){
                return 'existing value selected';
            }
        }catch(exception e){
            return e.getMessage();
        }    
        return 'Created Successfully! ';        
    }
    
    @AuraEnabled
    public static string communityPage(){
        String communityPrefix = Network.getNetworkId(); 
        String communityUrl =Network.getLoginUrl(communityPrefix);
        return communityUrl;
    }
}