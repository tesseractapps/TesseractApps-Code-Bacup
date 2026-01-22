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
	  
    /*@AuraEnabled
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
                repositories = [SELECT Id, Name, Type__c, Size__c, Comments__c, User_Name__c,Amazon_file_URL__c, Date_Format__c, (SELECT Id, Repository__c, Awsurl__c, Aws_Json__c,File_Name__c,Size__c,key__c
            FROM Repository_Attachments__r) FROM Repository__c WHERE Id IN :accessibleRepositoryIds ORDER BY CreatedDate DESC];
            }
    
        } else if (userRoleName == 'Portal Account Partner Executive' || userRoleName == 'CEO'|| userRoleName == 'Admin') {
            // Executives see all repositories from their org
            repositories = [SELECT Id, Name, Type__c, Size__c, Comments__c, User_Name__c,Amazon_file_URL__c, Date_Format__c, (SELECT Id, Repository__c, Awsurl__c, Aws_Json__c,File_Name__c,Size__c,key__c
            FROM Repository_Attachments__r) FROM Repository__c WHERE Organization__c = :organisationId ORDER BY CreatedDate DESC];
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
            List<Map<String, Object>> childAttachments = new List<Map<String, Object>>();
            for (Repository_Attachment__c att : repo.Repository_Attachments__r) {
                Map<String, Object> attMap = new Map<String, Object>();
                attMap.put('Id', att.Id);
                attMap.put('Repository__c', att.Repository__c);
                attMap.put('Awsurl__c', att.Awsurl__c);
                attMap.put('Aws_Json__c', att.Aws_Json__c);
                attMap.put('File_Name__c', att.File_Name__c);
                attMap.put('Size__c', att.Size__c);
                attMap.put('key__c', att.key__c);
                childAttachments.add(attMap);
            }
            record.put('Repository_Attachments__r', childAttachments);
    
            // Default access: false
            Boolean hasView = false;
            Boolean hasEdit = false;
            Boolean hasDelete = false;
    
            // Check if privilege record exists for this user and repository
            for (Security_Privilege__c sec : privileges) {
                if (sec.Repository__c == repo.Id && sec.User__c == currentUserId && sec.Repository_Attachment__c == att.Id) {
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
    }*/
    /*@AuraEnabled
    public static List<Map<String, Object>> fetchRepositoryData(String organisationId) {
        System.debug('Organisation Id :' + organisationId);
        Id currentUserId = UserInfo.getUserId();
        User currentUser = [SELECT UserRole.Name FROM User WHERE Id = :currentUserId LIMIT 1];
        String userRoleName = currentUser.UserRole != null ? currentUser.UserRole.Name : '';
    
        List<Repository__c> repositories = new List<Repository__c>();
    
        // Determine accessible repositories based on user role
        if (userRoleName == 'Portal Account Partner Manager' || userRoleName == 'Portal Account Partner User') {
            Set<Id> accessibleRepositoryIds = new Set<Id>();
            for (Security_Privilege__c sec : [SELECT Repository__c FROM Security_Privilege__c WHERE User__c = :currentUserId]){
                accessibleRepositoryIds.add(sec.Repository__c);
            }    
            if (!accessibleRepositoryIds.isEmpty()) {
                repositories = [SELECT Id, Name, Type__c, Size__c, Comments__c, User_Name__c,
                                Amazon_file_URL__c, Date_Format__c,
                                (SELECT Id, Repository__c, Awsurl__c, Aws_Json__c, File_Name__c, Size__c, key__c
                                 FROM Repository_Attachments__r)
                                FROM Repository__c
                                WHERE Id IN :accessibleRepositoryIds
                                ORDER BY CreatedDate DESC];
            }
    
        } else if (userRoleName == 'Portal Account Partner Executive' || userRoleName == 'CEO' || userRoleName == 'Admin') {
            repositories = [SELECT Id, Name, Type__c, Size__c, Comments__c, User_Name__c,
                            Amazon_file_URL__c, Date_Format__c,
                            (SELECT Id, Repository__c, Awsurl__c, Aws_Json__c, File_Name__c, Size__c, key__c
                             FROM Repository_Attachments__r)
                            FROM Repository__c
                            WHERE Organization__c = :organisationId
                            ORDER BY CreatedDate DESC];
        } else {
            return new List<Map<String, Object>>();
        }
    
        // Fetch relevant privileges for current user
        List<Security_Privilege__c> privileges = new List<Security_Privilege__c>();
        if (!repositories.isEmpty()) {
            privileges = [SELECT Repository__c, Repository_Attachment__c, User__c, View__c, Edit__c, Delete__c
                          FROM Security_Privilege__c
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
    
            // Child attachments with privileges
            List<Map<String, Object>> childAttachments = new List<Map<String, Object>>();
    
            for (Repository_Attachment__c att : repo.Repository_Attachments__r) {
                Map<String, Object> attMap = new Map<String, Object>();
                attMap.put('Id', att.Id);
                attMap.put('Repository__c', att.Repository__c);
                attMap.put('Awsurl__c', att.Awsurl__c);
                attMap.put('Aws_Json__c', att.Aws_Json__c);
                attMap.put('File_Name__c', att.File_Name__c);
                attMap.put('Size__c', att.Size__c);
                attMap.put('key__c', att.key__c);
    
                // Default access for child
                Boolean hasView = false;
                Boolean hasEdit = false;
                Boolean hasDelete = false;
    
                // Check child-level privilege
                for (Security_Privilege__c sec : privileges) {
                    if (sec.User__c == currentUserId && sec.Repository_Attachment__c == att.Id) {
                        hasView = sec.View__c;
                        hasEdit = sec.Edit__c;
                        hasDelete = sec.Delete__c;
                        break;
                    }
                }
    
                // Fallback to parent repository privilege if no child privilege
                if (!hasView && !hasEdit && !hasDelete) {
                    for (Security_Privilege__c sec : privileges) {
                        if (sec.User__c == currentUserId && sec.Repository__c == repo.Id && sec.Repository_Attachment__c == null) {
                            hasView = sec.View__c;
                            hasEdit = sec.Edit__c;
                            hasDelete = sec.Delete__c;
                            break;
                        }
                    }
                }
    
                // Full access for executives
                if ((userRoleName == 'Portal Account Partner Executive' || userRoleName == 'CEO' || userRoleName == 'Admin') &&
                    !hasView && !hasEdit && !hasDelete) {
                    hasView = true;
                    hasEdit = true;
                    hasDelete = true;
                }
    
                attMap.put('HasReadAccess', hasView);
                attMap.put('HasEditAccess', hasEdit);
                attMap.put('HasDeleteAccess', hasDelete);
    
                childAttachments.add(attMap);
            }
    
            record.put('Repository_Attachments__r', childAttachments);
    
            // Parent repository privileges
            Boolean repoView = false;
            Boolean repoEdit = false;
            Boolean repoDelete = false;
    
            for (Security_Privilege__c sec : privileges) {
                if (sec.User__c == currentUserId && sec.Repository__c == repo.Id && sec.Repository_Attachment__c == null) {
                    repoView = sec.View__c;
                    repoEdit = sec.Edit__c;
                    repoDelete = sec.Delete__c;
                    break;
                }
            }
    
            if ((userRoleName == 'Portal Account Partner Executive' || userRoleName == 'CEO' || userRoleName == 'Admin') &&
                !repoView && !repoEdit && !repoDelete) {
                repoView = true;
                repoEdit = true;
                repoDelete = true;
            }
    
            record.put('HasReadAccess', repoView);
            record.put('HasEditAccess', repoEdit);
            record.put('HasDeleteAccess', repoDelete);
    
            results.add(record);
        }
    
        return results;
    }*/
    
    @AuraEnabled
    public static List<Map<String, Object>> fetchRepositoryData(String organisationId) { // String facilityId
        System.debug('Organisation Id :' + organisationId);
        Id currentUserId = UserInfo.getUserId();
        User currentUser = [SELECT UserRole.Name FROM User WHERE Id = :currentUserId LIMIT 1];
        String userRoleName = currentUser.UserRole != null ? currentUser.UserRole.Name : '';
    
        List<Repository__c> repositories = new List<Repository__c>();
    
        // Determine accessible repositories based on user role
        if (userRoleName == 'Portal Account Partner User') {
            Set<Id> accessibleRepositoryIds = new Set<Id>();
            for (Security_Privilege__c sec : [SELECT Repository__c FROM Security_Privilege__c WHERE User__c = :currentUserId]){
                accessibleRepositoryIds.add(sec.Repository__c);
            }    
            if (!accessibleRepositoryIds.isEmpty()) {
                repositories = [SELECT Id, Name, Type__c, Size__c, Comments__c, User_Name__c,
                                Amazon_file_URL__c, Date_Format__c,
                                (SELECT Id, Repository__c, Awsurl__c, Aws_Json__c, File_Name__c, Size__c, key__c
                                 FROM Repository_Attachments__r)
                                FROM Repository__c
                                WHERE Id IN :accessibleRepositoryIds
                                ORDER BY CreatedDate DESC];
            }
    
        }else if(userRoleName == 'Portal Account Partner Manager'){
            Set<Id> accessibleRepositoryIds = new Set<Id>();
            for (Security_Privilege__c sec : [SELECT Repository__c FROM Security_Privilege__c WHERE User__c = :currentUserId]){
                accessibleRepositoryIds.add(sec.Repository__c);
            }    
            if (!accessibleRepositoryIds.isEmpty()) {
                repositories = [SELECT Id, Name, Type__c, Size__c, Comments__c, User_Name__c,
                                Amazon_file_URL__c, Date_Format__c,
                                (SELECT Id, Repository__c, Awsurl__c, Aws_Json__c, File_Name__c, Size__c, key__c
                                 FROM Repository_Attachments__r)
                                FROM Repository__c
                                WHERE Id IN :accessibleRepositoryIds 
                                ORDER BY CreatedDate DESC];
            }
        }
        else if (userRoleName == 'Portal Account Partner Executive' || userRoleName == 'CEO' || userRoleName == 'Admin') {
            repositories = [SELECT Id, Name, Type__c, Size__c, Comments__c, User_Name__c,
                            Amazon_file_URL__c, Date_Format__c, Facility__c,
                            (SELECT Id, Repository__c, Awsurl__c, Aws_Json__c, File_Name__c, Size__c, key__c
                             FROM Repository_Attachments__r)
                            FROM Repository__c
                            WHERE Organization__c = :organisationId 
                            ORDER BY CreatedDate DESC]; //AND Facility__c = :facilityId
        } else {
            return new List<Map<String, Object>>();
        }
    
        // Fetch relevant privileges for current user
        List<Security_Privilege__c> privileges = new List<Security_Privilege__c>();
        if (!repositories.isEmpty()) {
            privileges = [SELECT Repository__c, Repository_Attachment__c, User__c, View__c, Edit__c, Delete__c
                          FROM Security_Privilege__c
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
    
            // Child attachments with privileges
            List<Map<String, Object>> childAttachments = new List<Map<String, Object>>();
    
            for (Repository_Attachment__c att : repo.Repository_Attachments__r) {
                Boolean hasPrivilege = false;
                Boolean hasView = false;
                Boolean hasEdit = false;
                Boolean hasDelete = false;
    
                // Check child-level privilege
                for (Security_Privilege__c sec : privileges) {
                    if (sec.User__c == currentUserId && sec.Repository_Attachment__c == att.Id) {
                        hasPrivilege = true;
                        hasView = sec.View__c;
                        hasEdit = sec.Edit__c;
                        hasDelete = sec.Delete__c;
                        break;
                    }
                }
    
                // If no child privilege, fallback to parent repository privilege
                if (!hasPrivilege) {
                    for (Security_Privilege__c sec : privileges) {
                        if (sec.User__c == currentUserId && sec.Repository__c == repo.Id && sec.Repository_Attachment__c == null) {
                            hasPrivilege = true;
                            hasView = sec.View__c;
                            hasEdit = sec.Edit__c;
                            hasDelete = sec.Delete__c;
                            break;
                        }
                    }
                }
    
                // Full access for executives
                if ((userRoleName == 'Portal Account Partner Executive' || userRoleName == 'CEO' || userRoleName == 'Admin') && !hasPrivilege) {
                    hasPrivilege = true;
                    hasView = true;
                    hasEdit = true;
                    hasDelete = true;
                }
    
                // 🚨 Only add child if user has privilege
                if (hasPrivilege) {
                    Map<String, Object> attMap = new Map<String, Object>();
                    attMap.put('Id', att.Id);
                    attMap.put('Repository__c', att.Repository__c);
                    attMap.put('Awsurl__c', att.Awsurl__c);
                    attMap.put('Aws_Json__c', att.Aws_Json__c);
                    attMap.put('File_Name__c', att.File_Name__c);
                    attMap.put('Size__c', att.Size__c);
                    attMap.put('key__c', att.key__c);
    
                    attMap.put('HasReadAccess', hasView);
                    attMap.put('HasEditAccess', hasEdit);
                    attMap.put('HasDeleteAccess', hasDelete);
    
                    childAttachments.add(attMap);
                }
            }
    
            record.put('Repository_Attachments__r', childAttachments);
    
            // Parent repository privileges
            Boolean repoView = false;
            Boolean repoEdit = false;
            Boolean repoDelete = false;
            Boolean repoHasPrivilege = false;
    
            for (Security_Privilege__c sec : privileges) {
                if (sec.User__c == currentUserId && sec.Repository__c == repo.Id && sec.Repository_Attachment__c == null) {
                    repoHasPrivilege = true;
                    repoView = sec.View__c;
                    repoEdit = sec.Edit__c;
                    repoDelete = sec.Delete__c;
                    break;
                }
            }
    
            if ((userRoleName == 'Portal Account Partner Executive' || userRoleName == 'CEO' || userRoleName == 'Admin') && !repoHasPrivilege) {
                repoView = true;
                repoEdit = true;
                repoDelete = true;
            }
    
            record.put('HasReadAccess', repoView);
            record.put('HasEditAccess', repoEdit);
            record.put('HasDeleteAccess', repoDelete);
    
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
    @AuraEnabled
    public static Repository__c getRepoData(String recordId) {
        return [SELECT Id, Name,Type__c, size__c,comments__c,USer_Name__c,Amazon_file_URL__c,Date__c ,UploadFile_Result__c
				FROM Repository__c WHERE Id = :recordId LIMIT 1];
    }
    
     @AuraEnabled
    Public static void attachFiles(String RepositoryId, String Awsjson, String attachmentId){
        Id currentUserId = UserInfo.getUserId();
        if(String.isBlank(RepositoryId) || String.isBlank(Awsjson)){
            throw new AuraHandledException('Repository and Awsjson is required');
        }
        List<fileWrapper> fileList = (List<fileWrapper>)JSON.deserialize(Awsjson,List<fileWrapper>.class);
        List<Repository_Attachment__c> docToInsert = new List<Repository_Attachment__c>();
        for(fileWrapper f:fileList){
            Repository_Attachment__c doc = new  Repository_Attachment__c();
                if (!String.isBlank(attachmentId)) {
                doc.Id = attachmentId;
            }
            doc.Repository__c=RepositoryId;
            doc.Awsurl__c=f.url;
            doc.Aws_Json__c = JSON.serialize(f);
            doc.File_Name__c=f.originalName;
            doc.key__c=f.key;
            doc.Size__c=f.size;
            docToInsert.add(doc);
        }
        if(!docToInsert.IsEmpty()){
            upsert docToInsert;
        }
        if(String.isBlank(attachmentId)){
        List<Security_Privilege__c> privileges = new List<Security_Privilege__c>();

        for (Repository_Attachment__c ra : docToInsert) {
            privileges.add(new Security_Privilege__c(
                Repository__c = RepositoryId,
                User__c = currentUserId,
                Repository_Attachment__c = ra.Id,
                View__c = true,
                Edit__c = true,
                Delete__c = true
            ));
        }

        if(!privileges.isEmpty()){
            insert privileges;
        }
    }
        
    }
    
     public class fileWrapper {
        public String url;
        public String originalName;
        public String size;
         public String key; 
        
    }
    
 }