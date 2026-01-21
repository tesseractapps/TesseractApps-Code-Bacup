public with sharing class RepositoryAttachmentController {    
    @AuraEnabled(cacheable=false)
    public static List<ContentDocumentLink> fetchClientFiles(String recordId){
       return [SELECT LinkedEntityId, ContentDocument.CreatedDate, ContentDocument.Title, ContentDocument.ContentSize, ContentDocument.FileType 
                    FROM ContentDocumentLink  
                WHERE LinkedEntityId =: recordId];
    }
    
    @AuraEnabled  
    public static string UpdateFileSize(string recordId, string filesize) { 
        Repository__c pat= new Repository__c(id=recordId);
        pat.size__c=filesize;
        update pat;
        return 'Updated';
    }    
	  
    @AuraEnabled
        public static List<Map<String, Object>> fetchRepositoryData(String organisationId) {
        System.debug('Organisation Id :' + organisationId);
        Id currentUserId = UserInfo.getUserId();
        User currentUser = [SELECT UserRole.Name FROM User WHERE Id = :currentUserId LIMIT 1];
        String userRoleName = currentUser.UserRole != null ? currentUser.UserRole.Name : '';
    
        List<Repository__c> repositories = new List<Repository__c>();
    
        if (userRoleName == 'Portal Account Partner Manager' || userRoleName == 'Portal Account Partner User') {
            Set<Id> accessibleRepositoryIds = new Set<Id>();    
            for (Security_Privilege__c sec : [SELECT Repository__c FROM Security_Privilege__c  WHERE User__c = :currentUserId]){
                accessibleRepositoryIds.add(sec.Repository__c);
            }    
            if (!accessibleRepositoryIds.isEmpty()) {
                repositories = [SELECT Id, Name, Type__c, Size__c, Comments__c, User_Name__c,Amazon_file_URL__c, Date_Format__c
                    FROM Repository__c WHERE Id IN :accessibleRepositoryIds ORDER BY CreatedDate DESC];
            }
    
        } else if (userRoleName == 'Portal Account Partner Executive' || userRoleName == 'CEO'|| userRoleName == 'Admin') {
            // Executives see all repositories from their org
            repositories = [SELECT Id, Name, Type__c, Size__c, Comments__c, User_Name__c,Amazon_file_URL__c, Date_Format__c
                FROM Repository__c WHERE Organization__c = :organisationId ORDER BY CreatedDate DESC];
        } else {
            // Non-authorized roles see nothing
            return new List<Map<String, Object>>();
        }
    
        // Fetch relevant security privileges for current user and listed repositories
        List<Security_Privilege__c> privileges = new List<Security_Privilege__c>();
        if (!repositories.isEmpty()) {
            privileges = [SELECT Repository__c, User__c, View__c, Edit__c, Delete__c FROM Security_Privilege__c
                WHERE Repository__c IN :repositories AND User__c = :currentUserId];
        }
        
        List<Map<String, Object>> results = new List<Map<String, Object>>();    
        for (Repository__c repo : repositories) {
            Map<String, Object> record = new Map<String, Object>();
            record.put('Id', repo.Id);
            record.put('Name', repo.Name);
            record.put('Type__c', repo.Type__c);
            record.put('Size__c', repo.Size__c);
            record.put('Comments__c', repo.Comments__c);
            record.put('User_Name__c', repo.User_Name__c);
            record.put('Amazon_file_URL__c', repo.Amazon_file_URL__c);
            record.put('Date_Format__c', repo.Date_Format__c);
    
            // Default access: false
            Boolean hasView = false;
            Boolean hasEdit = false;
            Boolean hasDelete = false;
    
            // Check if privilege record exists for this user and repository
            for (Security_Privilege__c sec : privileges) {
                if (sec.Repository__c == repo.Id && sec.User__c == currentUserId) {
                    hasView = sec.View__c;
                    hasEdit = sec.Edit__c;
                    hasDelete = sec.Delete__c;
                    break;
                }
            }
    
            // If no privilege found but user is executive, give full access
            if ((userRoleName == 'Portal Account Partner Executive' || userRoleName == 'CEO' || userRoleName == 'Admin') &&
                !hasView && !hasEdit && !hasDelete) {
                hasView = true;
                hasEdit = true;
                hasDelete = true;
            }    
            record.put('HasReadAccess', hasView);
            record.put('HasEditAccess', hasEdit);
            record.put('HasDeleteAccess', hasDelete);    
            results.add(record);
        }    
        return results;
    }
    
    @AuraEnabled
    public static void deleteRepository(string repData){
        try {
            //delete repData;
            List<Repository__c> repList = [SELECT Name,Type__c, size__c,comments__c,USer_Name__c,Amazon_file_URL__c,Date__c from Repository__c where id = :repData];
            delete repList;
        }
        catch(Exception ex) {
            throw new AuraHandledException(ex.getMessage());
        }
    }
    @AuraEnabled(cacheable=true)
    public static Map<ID, String> getRelatedFilesByRecordId(String recordId) {
        // Get record file IDs        
        List<ContentDocumentLink> files = [SELECT ContentDocumentId FROM ContentDocumentLink WHERE LinkedEntityId = :recordId];
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
     @AuraEnabled
     public static void saveFileToAttachment(String csvContent, String objectId) {
        try {
            Attachment attachment = new Attachment();
            attachment.ParentId = objectId;
            attachment.Name = 'data.csv';
            attachment.Body = Blob.valueOf(csvContent);
            attachment.ContentType = 'text/csv';
            insert attachment;
        } catch (Exception e) {
            System.debug('Error: ' + e.getMessage());
            throw new AuraHandledException('Error saving CSV: ' + e.getMessage());
        }
    }
    
 }