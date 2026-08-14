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
                repositories = [SELECT Id, Name, Document_Type__c, Size__c, Comments__c, User_Name__c,
                                Amazon_file_URL__c, Date_Format__c, Repository_UID__c,
                                (SELECT Id, Repository__c, Awsurl__c, Aws_Json__c, File_Name__c, Size__c, key__c, Is_Archived__c
                                 FROM Repository_Attachments__r
                                 WHERE Is_Archived__c = false)
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
                repositories = [SELECT Id, Name, Document_Type__c, Size__c, Comments__c, User_Name__c,
                                Amazon_file_URL__c, Date_Format__c, Repository_UID__c,
                                (SELECT Id, Repository__c, Awsurl__c, Aws_Json__c, File_Name__c, Size__c, key__c, Is_Archived__c
                                 FROM Repository_Attachments__r
                                 WHERE Is_Archived__c = false)
                                FROM Repository__c
                                WHERE Id IN :accessibleRepositoryIds 
                                ORDER BY CreatedDate DESC];
            }
        }
        else if (userRoleName == 'Portal Account Partner Executive' || userRoleName == 'CEO' || userRoleName == 'Admin') {
            repositories = [SELECT Id, Name, Document_Type__c, Size__c, Comments__c, User_Name__c,
                            Amazon_file_URL__c, Date_Format__c, Facility__c, Repository_UID__c,
                            (SELECT Id, Repository__c, Awsurl__c, Aws_Json__c, File_Name__c, Size__c, key__c
                             FROM Repository_Attachments__r
                             WHERE Is_Archived__c = false)
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

        // Repo still has archived docs even if active count = 0 -> block delete for these
        Map<Id, Boolean> hasArchivedByRepo = new Map<Id, Boolean>();
        if (!repositories.isEmpty()) {
            for (AggregateResult ar : [SELECT Repository__c repoId, COUNT(Id) cnt
                                        FROM Repository_Attachment__c
                                        WHERE Repository__c IN :repositories AND Is_Archived__c = true
                                        GROUP BY Repository__c]) {
                Integer cnt = (Integer) ar.get('cnt');
                hasArchivedByRepo.put((Id) ar.get('repoId'), cnt > 0);
            }
        }
    
        List<Map<String, Object>> results = new List<Map<String, Object>>();
    
        for (Repository__c repo : repositories) {
            Map<String, Object> record = new Map<String, Object>();
            record.put('Id', repo.Id);
            record.put('Name', repo.Name);
            record.put('Document_Type__c', repo.Document_Type__c);
            record.put('Size__c', repo.Size__c);
            record.put('Comments__c', repo.Comments__c);
            record.put('User_Name__c', repo.User_Name__c);
            record.put('Amazon_file_URL__c', repo.Amazon_file_URL__c);
            record.put('Date_Format__c', repo.Date_Format__c);
            record.put('Repository_UID__c', repo.Repository_UID__c);
            record.put('HasArchivedAttachments', hasArchivedByRepo.containsKey(repo.Id) && hasArchivedByRepo.get(repo.Id));

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
            List<Repository__c> repList = [SELECT Name,Document_Type__c, size__c,comments__c,USer_Name__c,Amazon_file_URL__c,Date__c from Repository__c where id = :repData];
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
        return [SELECT Id, Name,Document_Type__c, size__c,comments__c,USer_Name__c,Amazon_file_URL__c,Date__c ,UploadFile_Result__c
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

    public class RepositoryHistoryWrapper implements Comparable {
        public Datetime activityDate; 
        public Datetime sortTime;
        public String user;
        public String action;
        public String changes;

        public Integer compareTo(Object o) {
            RepositoryHistoryWrapper other = (RepositoryHistoryWrapper)o;
            if (this.sortTime == other.sortTime) return 0;
            return this.sortTime > other.sortTime ? -1 : 1; // DESC
        }
    }

    private static RepositoryHistoryWrapper buildHistory(
        Datetime dt,
        String user,
        String action,
        String changes
    ) {
        RepositoryHistoryWrapper h = new RepositoryHistoryWrapper();
        h.sortTime = dt;
        h.activityDate = dt;
        h.user = user;
        h.action = action;
        h.changes = changes;
        return h;
    }

    /* @AuraEnabled
    public static String getRepositoryHistoryLog(Id repositoryId) {

        List<RepositoryHistoryWrapper> history = new List<RepositoryHistoryWrapper>();


        List<Repository__c> repoList = [
            SELECT Id, Name, CreatedDate, CreatedBy.Name
            FROM Repository__c
            WHERE Id = :repositoryId
            LIMIT 1
        ];

        if (!repoList.isEmpty()) {
            Repository__c repo = repoList[0];
            history.add(buildHistory(
                repo.CreatedDate,
                repo.CreatedBy.Name,
                'Uploaded Document',
                'Document "' + repo.Name + '" uploaded'
            ));
        }


        for (Repository_Attachment__c att : [
            SELECT Name, LastModifiedDate, LastModifiedBy.Name
            FROM Repository_Attachment__c
            WHERE Repository__c = :repositoryId
        ]) {
            history.add(buildHistory(
                att.LastModifiedDate,
                att.LastModifiedBy.Name,
                'Document Updated',
                'Document details were updated'
            ));
        }


        for (Security_Privilege__c sec : [
            SELECT
                CreatedDate,
                LastModifiedDate,
                CreatedBy.Name,
                User__r.Name,
                Consent_Required__c,
                View__c,
                LastModifiedBy.Name,
                Consent_Status__c,
                (
                    SELECT Action__c, CreatedDate
                    FROM Staff_Document_Views__r
                    ORDER BY CreatedDate ASC
                )
            FROM Security_Privilege__c
            WHERE Repository__c = :repositoryId
            ORDER BY CreatedDate ASC
        ]) {


            if (sec.View__c == false && sec.Consent_Required__c == false) {
                history.add(buildHistory(
                    sec.LastModifiedDate,
                    sec.LastModifiedBy.Name,
                    'View Revoked',
                    sec.User__r.Name + ' was revoked view access'
                ));
            }


            if (sec.Staff_Document_Views__r != null && !sec.Staff_Document_Views__r.isEmpty()) {

                for (Staff_Document_View__c viewRec : sec.Staff_Document_Views__r) {

                    if (viewRec.Action__c == null) {
                        continue;
                    }

                    String action;
                    String message;
                    String act = viewRec.Action__c;

                    if (act.contains('View and Consent')) {
                        action = 'View & Consent Granted';
                        message = sec.User__r.Name + ' was granted view and consent access';
                    }
                    else if (act.contains('New')) {
                        action = 'View Granted';
                        message = sec.User__r.Name + ' was granted view access';
                    }
                    else if (act.contains('Consent Access')) {
                        action = 'Consent Granted';
                        message = sec.User__r.Name + ' was granted consent access';
                    }
                    else if (act.contains('Consent Revoked')) {
                        action = 'Consent Revoked';
                        message = sec.User__r.Name + ' was revoked consent access';
                    }
                    else if (act.contains('Consent Accepted')) {
                        action = 'Consent Accepted';
                        message = sec.User__r.Name + ' has accepted the consent';
                    }
                    else if (act.contains('File Viewed')) {
                        action = 'File Viewed';
                        message = sec.User__r.Name + ' has viewed the file';
                    }
                    else if (act.contains('File Edited')) {
                        action = 'File Edited';
                        message = sec.User__r.Name + ' has edited the file';
                    }
                    else {
                        continue; // Skip unknown actions
                    }

                    history.add(buildHistory(
                        viewRec.CreatedDate,
                        sec.User__r.Name,
                        action,
                        message
                    ));
                }
            }
        }


        history.sort();

        List<Map<String, Object>> output = new List<Map<String, Object>>();

        for (RepositoryHistoryWrapper h : history) {
            output.add(new Map<String, Object>{
                'activityDate' => h.activityDate,
                'user'         => h.user,
                'action'       => h.action,
                'changes'      => h.changes
            });
        }

        return JSON.serialize(output);
    } */

    

    @AuraEnabled
    public static String getRepositoryHistoryLog(Id repositoryId) {

        List<RepositoryHistoryWrapper> history = new List<RepositoryHistoryWrapper>();

        /* ================= Repository upload ================= */
        List<Repository__c> repoList = [
            SELECT Id, Name, CreatedDate, CreatedBy.Name
            FROM Repository__c
            WHERE Id = :repositoryId
            LIMIT 1
        ];

        if (!repoList.isEmpty()) {
            Repository__c repo = repoList[0];
            history.add(buildHistory(
                repo.CreatedDate,
                repo.CreatedBy.Name,
                'Uploaded Document',
                'Document "' + repo.Name + '" uploaded'
            ));
        }

        /* ================= Attachment updates + attachment views ================= */
        for (Repository__c att : [
            SELECT
                Name,
                LastModifiedDate,
                LastModifiedBy.Name,
                (
                    SELECT Action__c, CreatedDate
                    FROM Staff_Document_Views__r
                    ORDER BY CreatedDate ASC
                )
            FROM Repository__c
            WHERE Id = :repositoryId
        ]) {

            /* Attachment-level Staff_Document_Views__c */
            if (att.Staff_Document_Views__r != null && !att.Staff_Document_Views__r.isEmpty()) {
                for (Staff_Document_View__c viewRec : att.Staff_Document_Views__r) {

                    if (viewRec.Action__c == null) continue;

                    String action;
                    String message;
                    String act = viewRec.Action__c;

                    if (act.contains('File Viewed')) {
                        action = 'File Viewed';
                        message = att.LastModifiedBy.Name + ' has viewed the file';
                    }
                    else if (act.contains('File Edited')) {
                        action = 'File Edited';
                        message = att.LastModifiedBy.Name + ' has edited the file';
                    }
                    else {
                        continue;
                    }

                    history.add(buildHistory(
                        viewRec.CreatedDate,
                        att.LastModifiedBy.Name,
                        action,
                        message
                    ));
                }
            }
        }

        /* ================= Security privileges + security views ================= */
        for (Security_Privilege__c sec : [
            SELECT
                CreatedDate,
                LastModifiedDate,
                CreatedBy.Name,
                User__r.Name,
                Consent_Required__c,
                View__c,
                LastModifiedBy.Name,
                Consent_Status__c,
                (
                    SELECT Action__c, CreatedDate
                    FROM Staff_Document_Views__r
                    ORDER BY CreatedDate ASC
                )
            FROM Security_Privilege__c
            WHERE Repository__c = :repositoryId
            ORDER BY CreatedDate ASC
        ]) {

            /* Revoke */
            if (sec.View__c == false && sec.Consent_Required__c == false) {
                history.add(buildHistory(
                    sec.LastModifiedDate,
                    sec.LastModifiedBy.Name,
                    'View Revoked',
                    sec.User__r.Name + ' was revoked view access'
                ));
            }

            /* Security-level Staff_Document_Views__c */
            if (sec.Staff_Document_Views__r != null && !sec.Staff_Document_Views__r.isEmpty()) {
                for (Staff_Document_View__c viewRec : sec.Staff_Document_Views__r) {

                    if (viewRec.Action__c == null) continue;

                    String action;
                    String message;
                    String act = viewRec.Action__c;

                    if (act.contains('View and Consent')) {
                        action = 'View & Consent Granted';
                        message = sec.User__r.Name + ' was granted view and consent access';
                    }
                    else if (act.contains('New')) {
                        action = 'View Granted';
                        message = sec.User__r.Name + ' was granted view access';
                    }
                    else if (act.contains('Consent Access')) {
                        action = 'Consent Granted';
                        message = sec.User__r.Name + ' was granted consent access';
                    }
                    else if (act.contains('Consent Revoked')) {
                        action = 'Consent Revoked';
                        message = sec.User__r.Name + ' was revoked consent access';
                    }
                    else if (act.contains('Consent Accepted')) {
                        action = 'Consent Accepted';
                        message = sec.User__r.Name + ' has accepted the consent';
                    }
                    else if (act.contains('File Viewed')) {
                        action = 'File Viewed';
                        message = sec.User__r.Name + ' has viewed the file';
                    }
                    else if (act.contains('File Edited')) {
                        action = 'File Edited';
                        message = sec.User__r.Name + ' has edited the file';
                    }
                    else {
                        continue;
                    }

                    history.add(buildHistory(
                        viewRec.CreatedDate,
                        sec.User__r.Name,
                        action,
                        message
                    ));
                }
            }
        }

        /* ================= Sort ================= */
        history.sort();

        /* ================= JSON Output ================= */
        List<Map<String, Object>> output = new List<Map<String, Object>>();

        for (RepositoryHistoryWrapper h : history) {
            output.add(new Map<String, Object>{
                'activityDate' => h.activityDate,
                'user'         => h.user,
                'action'       => h.action,
                'changes'      => h.changes
            });
        }



        return JSON.serialize(output);
    }

@AuraEnabled
public static List<String> getRepoTypes(Id organisationId) {

    Organisation__c org = [
        SELECT Repository_Type__c
        FROM Organisation__c
        WHERE Id = :organisationId
        LIMIT 1
    ];

    if (String.isBlank(org.Repository_Type__c)) {
        return new List<String>();
    }

    List<String> rawTypes = org.Repository_Type__c.split(',');

    List<String> cleanedTypes = new List<String>();
    Set<String> seen = new Set<String>();

    for (String t : rawTypes) {

        if (String.isNotBlank(t)) {

            String trimmed = t.trim();

            if (!seen.contains(trimmed.toLowerCase())) {
                seen.add(trimmed.toLowerCase());
                cleanedTypes.add(trimmed);
            }
        }
    }

    return cleanedTypes;
}

@AuraEnabled
public static void saveNewRepoType(Id organisationId, String newType) {

    Organisation__c org = [
        SELECT Repository_Type__c
        FROM Organisation__c
        WHERE Id = :organisationId
        LIMIT 1
    ];

    String existing = org.Repository_Type__c;

    if (String.isBlank(existing)) {
        org.Repository_Type__c = newType;
    } else {

        // Convert existing into list
        List<String> types = existing.split(',');

        // Trim values
        Set<String> cleanedTypes = new Set<String>();
        for (String t : types) {
            cleanedTypes.add(t.trim().toLowerCase());
        }

        // Prevent duplicate (case insensitive)
        if (!cleanedTypes.contains(newType.trim().toLowerCase())) {
            org.Repository_Type__c = existing + ',' + newType;
        }
    }

    update org;
}

@AuraEnabled
public static void deleteRepoType(Id organisationId, String typeToDelete) {

    Organisation__c org = [
        SELECT Repository_Type__c
        FROM Organisation__c
        WHERE Id = :organisationId
        LIMIT 1
    ];

    if (String.isBlank(org.Repository_Type__c)) return;

    List<String> types = org.Repository_Type__c.split(',');

    List<String> updated = new List<String>();

    for (String t : types) {
        if (t != null && 
            t.trim().toLowerCase() != typeToDelete.trim().toLowerCase()) {

            updated.add(t.trim());
        }
    }

    org.Repository_Type__c = String.join(updated, ',');

    update org;
}

@AuraEnabled
public static void renameRepoType(Id organisationId, String oldType, String newType) {

    // 1️⃣ Update Organisation master list
    Organisation__c org = [
        SELECT Repository_Type__c
        FROM Organisation__c
        WHERE Id = :organisationId
        LIMIT 1
    ];

    if (!String.isBlank(org.Repository_Type__c)) {

        List<String> types = org.Repository_Type__c.split(',');

        List<String> updated = new List<String>();
        Set<String> uniqueCheck = new Set<String>();

        for (String t : types) {

            String cleaned = t.trim();

            if (cleaned.toLowerCase() == oldType.trim().toLowerCase()) {
                cleaned = newType.trim();
            }

            // prevent duplicates after rename
            if (!uniqueCheck.contains(cleaned.toLowerCase())) {
                uniqueCheck.add(cleaned.toLowerCase());
                updated.add(cleaned);
            }
        }

        org.Repository_Type__c = String.join(updated, ',');

        update org;
    }

    // 2️⃣ Update Repository records
    List<Repository__c> repos = [
        SELECT Id, Document_Type__c
        FROM Repository__c
        WHERE Organization__c = :organisationId
    ];

    List<Repository__c> toUpdate = new List<Repository__c>();

    for (Repository__c r : repos) {
        if (r.Document_Type__c != null &&
            r.Document_Type__c.trim().toLowerCase() == oldType.trim().toLowerCase()) {

            r.Document_Type__c = newType.trim();
            toUpdate.add(r);
        }
    }

    if (!toUpdate.isEmpty()) {
        update toUpdate;
    }
}

@AuraEnabled
public static void archiveRepositoryAttachment(Id attachmentId) {

    Repository_Attachment__c att = [
        SELECT
            Id,
            Awsurl__c,
            Repository__c,
            Is_Archived__c,
            Archived_Date__c,
            Archived_By__c
        FROM Repository_Attachment__c
        WHERE Id = :attachmentId
        LIMIT 1
    ];

    att.Is_Archived__c = true;
    att.Archived_Date__c = Date.today();
    att.Archived_By__c = UserInfo.getUserId();

    update att;
}

@AuraEnabled
public static void restoreRepositoryAttachment(Id attachmentId) {

    Repository_Attachment__c att = [
        SELECT
            Id,
            Is_Archived__c,
            Archived_Date__c,
            Archived_By__c
        FROM Repository_Attachment__c
        WHERE Id = :attachmentId
        LIMIT 1
    ];

    att.Is_Archived__c = false;
    att.Archived_Date__c = null;
    att.Archived_By__c = null;

    update att;
}

@AuraEnabled
public static List<Repository_Attachment__c> getArchivedRepositoryAttachments(
    String organisationId
) {

    return [
        SELECT
            Id,
            File_Name__c,
            Awsurl__c,
            key__c,
            Size__c,

            Archived_Date__c,
            Archived_By__r.Full_Name__c,

            Repository__c,
            Repository__r.Name,
            Repository__r.Document_Type__c

        FROM Repository_Attachment__c

        WHERE Is_Archived__c = true
        AND Archived_By__c = :UserInfo.getUserId()
        AND Repository__r.Organization__c = :organisationId

        ORDER BY Archived_Date__c DESC
    ];
}


}