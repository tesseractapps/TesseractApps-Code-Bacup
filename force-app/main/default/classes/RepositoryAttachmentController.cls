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
    
    @AuraEnabled(cacheable=true)
     public static List<Map<String, Object>> fetchRepositoryData(string organisationId){
        Id currentUserId = UserInfo.getUserId();

        // Step 1: Query Repository__c records
        List<Repository__c> repositories = [
            SELECT Id, Name, Type__c, Size__c, Comments__c, User_Name__c, Amazon_file_URL__c, Date_Format__c
            FROM Repository__c
            WHERE Organization__c = :organisationId
            ORDER BY CreatedDate DESC
        ];

        // Step 2: Query UserRecordAccess for these records
        Set<Id> repositoryIds = new Set<Id>();
        for (Repository__c repo : repositories) {
            repositoryIds.add(repo.Id);
        }

        Map<Id, UserRecordAccess> accessMap = new Map<Id, UserRecordAccess>();
        if (!repositoryIds.isEmpty()) {
            for (UserRecordAccess ura : [
                SELECT RecordId, HasReadAccess, HasEditAccess, HasDeleteAccess
                FROM UserRecordAccess
                WHERE UserId = :currentUserId AND RecordId IN :repositoryIds
            ]) {
                accessMap.put(ura.RecordId, ura);
                system.debug('user read access :'+ura.HasReadAccess);
                system.debug('user view access :'+ura.HasEditAccess);
                system.debug('user delete access :'+ura.HasDeleteAccess);
            }            
        }

        // Step 3: Combine data
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

            // Add access data
            UserRecordAccess ura = accessMap.get(repo.Id);
            record.put('HasReadAccess', ura != null ? ura.HasReadAccess : false);
            record.put('HasEditAccess', ura != null ? ura.HasEditAccess : false);
            record.put('HasDeleteAccess', ura != null ? ura.HasDeleteAccess : false);

            results.add(record);
        }

        return results;
        
       /* Maheswari commneted code
        *  Id currentUserId = UserInfo.getUserId();
        List<Repository__c> listName = new List<Repository__c>();
        listName = [SELECT Name,Type__c, size__c,comments__c,USer_Name__c,Amazon_file_URL__c,Date__c,Date_Format__c,(SELECT ID,Edit__c,Delete__c,Repository__c,User__c,View__c from Security_Privileges__r where User__c=:currentUserId) from Repository__c where Organization__c =:organisationId order by createddate desc];
        system.debug('repdata '+listName);
        return listName; */
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