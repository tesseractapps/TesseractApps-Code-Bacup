/**
 * @description       : 
 * @author            : Raja Sekhar Reddy
 * @group             : 
 * @last modified on  : 06-18-2023
 * @last modified by  : Raja Sekhar Reddy
**/
public with sharing class ClientAttachmentHandler {
    @AuraEnabled(cacheable=false)
    public static List<ContentDocumentLink> fetchClientFiles(String clientId){
       return [SELECT LinkedEntityId, ContentDocument.CreatedDate, ContentDocument.Title, ContentDocument.ContentSize, ContentDocument.FileType 
                    FROM ContentDocumentLink  
                WHERE LinkedEntityId =: clientId];
    }
    
    @AuraEnabled  
    public static string UpdateFileSize(string clientId, string filesize) { 
        Attachment__c pat= new Attachment__c(id=clientId);
        pat.Size__c=filesize;
        update pat;
        return 'Updated';  
    }
    
    @AuraEnabled
    public static List<Attachment__c> fetchRepositoryData(String clientId){
        List<Attachment__c> listName = new List<Attachment__c>();
        listName = [SELECT Name,Type__c, Size__c,comments__c,USer_Name__c,Amazon_file_URL__c,Date__c,Date_Format__c from Attachment__c where Added_By__c = :clientId order by createddate desc];
        return listName;
    }
    
    @AuraEnabled
    public static string  deleteRepository(string repData){
        if(repData !=null  && repData != ''){
            try {
                //delete repData;
                List<Attachment__c> repList = [SELECT Name,Type__c, Size__c,comments__c,USer_Name__c,Amazon_file_URL__c,Date__c,Date_Format__c from Attachment__c where id = :repData];
                delete repList;
                return 'Deleted';
            }
            catch(Exception ex) {
                //  throw new AuraHandledException(ex.getMessage());
                return ex.getMessage();
            }  
        }else{
           return 'Record Id is required'; 
        }
       
    }
    @AuraEnabled
    public static Map<ID, String> getRelatedFilesByRecordId(String clientId) {
        // Get record file IDs        
        List<ContentDocumentLink> files = [SELECT ContentDocumentId FROM ContentDocumentLink WHERE LinkedEntityId = :clientId];
        List<ID> fileIDs = new List<ID>();
        for (ContentDocumentLink docLink : files) {
            fileIDs.add(docLink.ContentDocumentId);
        }
 
        List<ContentVersion> docs = [SELECT ContentDocumentId, FileExtension, Title 
            FROM ContentVersion WHERE ContentDocumentId IN : fileIDs];
        Map<ID, String> mapIdTitle = new Map<ID, String>();
        for (ContentVersion docLink : docs) {
            mapIdTitle.put(docLink.ContentDocumentId, docLink.Title);
        }
        return mapIdTitle;
    }
}