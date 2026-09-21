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
        listName = [SELECT Name,Attachment_UID__c,Participant_Doc_UID__c,Type__c, Size__c,comments__c,USer_Name__c,Amazon_file_URL__c,Date__c,Expiry_Date__c,Date_Format__c from Attachment__c where Added_By__c = :clientId order by createddate desc];
        return listName;
    }
    
    @AuraEnabled
    public static string  deleteRepository(string repData){
        if(repData !=null  && repData != ''){
            
                //delete repData;
                List<Attachment__c> repList = [SELECT Name,Type__c, Size__c,comments__c,USer_Name__c,Amazon_file_URL__c,Date__c,Expiry_Date__c,Date_Format__c from Attachment__c where id = :repData];
                delete repList;
                return 'Deleted';
            
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

   /*  @AuraEnabled
    public static List<Staff__c> fetchStaffByDoc(String docId) {

        // 1️⃣ Get attachment → client
        Attachment__c att = [
            SELECT Id, Added_By__c
            FROM Attachment__c
            WHERE Id = :docId
            LIMIT 1
        ];

        // 2️⃣ Get client's facility
        Id facilityId;

        if (att.Added_By__c != null) {
            Client__c clientRec = [
                SELECT Id, Facility__c
                FROM Client__c
                WHERE Id = :att.Added_By__c
                LIMIT 1
            ];

            facilityId = clientRec.Facility__c;
        }

        // 3️⃣ Get already shared staff
        Set<Id> sharedStaffIds = new Set<Id>();

        for (Participant_Docs_Share__c share : [
            SELECT Staff__c
            FROM Participant_Docs_Share__c
            WHERE Attachment__c = :docId
        ]) {
            if (share.Staff__c != null) {
                sharedStaffIds.add(share.Staff__c);
            }
        }

        // 4️⃣ Fetch ONLY staff from same facility (exclude already shared)
        List<Staff__c> staffList = [
            SELECT Id, Display_Nickname__c
            FROM Staff__c
            WHERE Status__c = TRUE
            AND User_Type__c = 'NDIS Staff'
            AND Id NOT IN :sharedStaffIds
            AND Id IN (
                SELECT Staff__c
                FROM Staff_Facility__c
                WHERE Facility__c = :facilityId
            )
        ];

        return staffList;
    } */

      @AuraEnabled
    public static List<Participant_Docs_Share__c> fetchStaffByDoc(String docId) {
    
        List<Participant_Docs_Share__c> staffids = [ SELECT Id, Staff__c FROM Participant_Docs_Share__c WHERE  Attachment__c = :docId AND Is_Active__c=true];
    
        return staffids;
    }

   /*  @AuraEnabled
    public static void saveParticipantDocShares(Id docId, List<Id> staffIds) {

        System.debug('🔵 Incoming docId: ' + docId);
        System.debug('🔵 Incoming staffIds: ' + staffIds);

        if (docId == null || staffIds == null || staffIds.isEmpty()) {
            System.debug('❌ Invalid input: docId or staffIds missing');
            return;
        }

        List<Participant_Docs_Share__c> recordsToInsert = new List<Participant_Docs_Share__c>();

        // 🔴 Check existing shares (avoid duplicates)
        Set<Id> existingStaffIds = new Set<Id>();

        for (Participant_Docs_Share__c existing : [
            SELECT Staff__c
            FROM Participant_Docs_Share__c
            WHERE Attachment__c = :docId
        ]) {
            existingStaffIds.add(existing.Staff__c);
        }

        System.debug('🟡 Existing Staff already shared: ' + existingStaffIds);

        // 🔴 Prepare new records
        for (Id staffId : staffIds) {

            if (existingStaffIds.contains(staffId)) {
                System.debug('⚠️ Skipping duplicate staffId: ' + staffId);
                continue;
            }

            Participant_Docs_Share__c rec = new Participant_Docs_Share__c(
                Attachment__c = docId,
                Staff__c = staffId
            );

            recordsToInsert.add(rec);
        }

        System.debug('🟣 Records to insert: ' + recordsToInsert);

        // 🔴 Insert
        if (!recordsToInsert.isEmpty()) {
            try {
                insert recordsToInsert;
                System.debug('🟢 Successfully inserted records: ' + recordsToInsert.size());
            } catch (Exception e) {
                System.debug('❌ Error inserting share records: ' + e.getMessage());
                throw new AuraHandledException('Error saving sharing: ' + e.getMessage());
            }
        } else {
            System.debug('⚠️ No new records to insert');
        }
    }    */ 

    @AuraEnabled
    public static void saveParticipantDocShares(Id docId, List<Id> staffIds) {

        System.debug('🔵 docId: ' + docId);
        System.debug('🔵 staffIds: ' + staffIds);

        if (docId == null) {
            throw new AuraHandledException('Document Id is required');
        }

        // ========================================
        // ✅ GET ATTACHMENT + PARENT FOLDER
        // ========================================

        Attachment__c attachment = [

            SELECT
                Id,
                Attachment_Folder__c,
                Added_By__c

            FROM Attachment__c

            WHERE Id = :docId
            LIMIT 1
        ];

        // =========================
        // 1️⃣ Selected Staff (UI)
        // =========================
        Set<Id> selectedIds = new Set<Id>();
        if (staffIds != null) {
            selectedIds.addAll(staffIds);
        }

        System.debug('🟢 Selected Staff Ids: ' + selectedIds);

        // ========================================
        // ✅ AUTO SHARE PARENT FOLDER
        // ========================================
          List<Folder_Share__c> folderUpdate = new List<Folder_Share__c>();

        if (attachment.Attachment_Folder__c != null) {

            System.debug(
                '📁 Parent Folder Found: ' +
                attachment.Attachment_Folder__c
            );

            List<Folder_Share__c> folderInsert =
                new List<Folder_Share__c>();

            for (Id staffId : selectedIds) {

                System.debug(
                    '👤 Processing Staff For Folder Share: ' +
                    staffId
                );

                List<Folder_Share__c> existingFolderShare = [

                    SELECT Id,Active__c
                    FROM Folder_Share__c
                    WHERE Attachment_Folder__c =
                        :attachment.Attachment_Folder__c
                    AND Staff__c = :staffId
                    LIMIT 1
                ];

                System.debug(
                    '📄 Existing Folder Share: ' +
                    existingFolderShare
                );
              
                if (existingFolderShare.isEmpty()) {

                    Folder_Share__c newFolderShare =
                        new Folder_Share__c(
                            Attachment_Folder__c = attachment.Attachment_Folder__c,
                            Participant__c = attachment.Added_By__c,
                            Staff__c = staffId,
                            Active__c = true,
                            Full_Folder_Access__c = false
                        );

                    folderInsert.add(newFolderShare);

                } else {

                    Folder_Share__c existingShare =
                        existingFolderShare[0];

                    if (existingShare.Active__c == false) {

                        existingShare.Active__c = true;

                        folderUpdate.add(existingShare);

                        System.debug(
                            '♻️ Reactivating Folder Share: ' +
                            staffId
                        );
                    }
                }
            }

            System.debug(
                '📦 Final Folder Share Insert List: ' +
                folderInsert
            );

            if (!folderInsert.isEmpty()) {

                insert folderInsert;

                System.debug(
                    '✅ Folder Shares Inserted Successfully'
                );
            }
            if (!folderUpdate.isEmpty()) {
                update folderUpdate;
            }
        }

        // =========================
        // 2️⃣ Existing Records
        // =========================
        List<Participant_Docs_Share__c> existing = [
            SELECT Id, Staff__c, Is_Active__c
            FROM Participant_Docs_Share__c
            WHERE Attachment__c = :docId
        ];

        Map<Id, Participant_Docs_Share__c> existingByStaff = new Map<Id, Participant_Docs_Share__c>();

        for (Participant_Docs_Share__c rec : existing) {
            existingByStaff.put(rec.Staff__c, rec);
        }

        System.debug('🟡 Existing Records: ' + existingByStaff);

        // =========================
        // 3️⃣ Prepare DML Lists
        // =========================
        List<Participant_Docs_Share__c> toInsert = new List<Participant_Docs_Share__c>();
        List<Participant_Docs_Share__c> toUpdate = new List<Participant_Docs_Share__c>();

        // =========================
        // 4️⃣ Activate / Insert
        // =========================
        for (Id staffId : selectedIds) {

            if (existingByStaff.containsKey(staffId)) {

                Participant_Docs_Share__c rec = existingByStaff.get(staffId);

                if (rec.Is_Active__c == false) {
                    rec.Is_Active__c = true; // ✅ Reactivate
                    toUpdate.add(rec);
                    System.debug('♻️ Reactivating: ' + staffId);
                }

            } else {

                Participant_Docs_Share__c newRec = new Participant_Docs_Share__c(
                    Attachment__c = docId,
                    Staff__c      = staffId,
                    Is_Active__c  = true
                );

                toInsert.add(newRec);
                System.debug('🆕 Inserting: ' + staffId);
            }
        }

        // =========================
        // 5️⃣ Deactivate Unselected
        // =========================
        for (Participant_Docs_Share__c rec : existing) {

            if (!selectedIds.contains(rec.Staff__c) && rec.Is_Active__c == true) {
                rec.Is_Active__c = false;
                toUpdate.add(rec);
                System.debug('🚫 Deactivating: ' + rec.Staff__c);
            }
        }

        // =========================
        // 6️⃣ DML
        // =========================
        if (!toInsert.isEmpty()) {
            insert toInsert;
            System.debug('✅ Inserted: ' + toInsert.size());
        }

        if (!toUpdate.isEmpty()) {
            update toUpdate;
            System.debug('✅ Updated: ' + toUpdate.size());
        }
    
    }

    /*
    @AuraEnabled
    public static List<Attachment__c> fetchAttachmentsForStaff(Id clientId, Id folderId) {

        Id currentUserId = UserInfo.getUserId();

        System.debug('🔵 fetchAttachmentsForStaff - UserId: ' + currentUserId);
        System.debug('🔵 ClientId: ' + clientId);

        List<Attachment__c> ownDocs = [
            SELECT Id, Name, Type__c, Comments__c, Size__c,Key__c,
                Amazon_file_URL__c, User__c, USer_Name__c,
                Date_Format__c, CreatedDate
            FROM Attachment__c
            WHERE Added_By__c = :clientId
            AND User__c = :currentUserId
            ORDER BY CreatedDate DESC
        ];

        System.debug('🟢 Own Attachments Count: ' + ownDocs.size());

        return ownDocs;
        
    } 

    @AuraEnabled
    public static List<Attachment__c> fetchClientAttachmentsSecure(Id clientId, Id folderId) {

        Id currentUserId = UserInfo.getUserId();

        System.debug('🔵 fetchClientAttachmentsSecure - UserId: ' + currentUserId);

        User currentUser = [
            SELECT Id, Email, UserRole.Name, User_Type__c
            FROM User
            WHERE Id = :currentUserId
            LIMIT 1
        ];

        System.debug('🔵 User Email: ' + currentUser.Email);
        System.debug('🔵 User Type: ' + currentUser.User_Type__c);

        Boolean isAdmin = (
            currentUser.UserRole.Name == 'CEO' ||
            currentUser.UserRole.Name == 'Portal Account Partner Executive'
        );

        System.debug('🟣 Is Admin: ' + isAdmin);

        // ============================================================
        // ✅ ADMIN → ALL DOCUMENTS
        // ============================================================
        if (isAdmin) {

            List<Attachment__c> adminDocs = [
                SELECT Id, Name, Type__c, Comments__c, Size__c,
                    Amazon_file_URL__c, User__c, USer_Name__c,Key__c,
                    Date_Format__c, CreatedDate
                FROM Attachment__c
                WHERE Added_By__c = :clientId
                ORDER BY CreatedDate DESC
            ];

            System.debug('🟢 Admin Docs Count: ' + adminDocs.size());

            return adminDocs;
        }

        // ============================================================
        // ✅ NDIS STAFF → ONLY SHARED DOCUMENTS
        // ============================================================
        if (currentUser.User_Type__c == 'NDIS Staff') {

            // Map User → Staff
            List<Staff__c> staffList = [
                SELECT Id, Email_Address__c
                FROM Staff__c
                WHERE Email_Address__c = :currentUser.Email
                LIMIT 1
            ];

            if (staffList.isEmpty()) {
                System.debug('❌ No Staff mapping found');
                return new List<Attachment__c>();
            }

            Staff__c loggedInStaff = staffList[0];

            System.debug('🟢 Logged-in Staff Id: ' + loggedInStaff.Id);

            // Get shared records
            List<Participant_Docs_Share__c> shares = [
                SELECT Attachment__c
                FROM Participant_Docs_Share__c
                WHERE Staff__c = :loggedInStaff.Id
            ];

            System.debug('🟡 Shares Found: ' + shares);

            Set<Id> sharedIds = new Set<Id>();

            for (Participant_Docs_Share__c s : shares) {
                if (s.Attachment__c != null) {
                    sharedIds.add(s.Attachment__c);
                }
            }

            System.debug('🟣 Shared Attachment Ids: ' + sharedIds);

            if (sharedIds.isEmpty()) {
                return new List<Attachment__c>();
            }

            List<Attachment__c> sharedDocs = [
                SELECT Id, Name, Type__c, Comments__c, Size__c,Key__c,
                    Amazon_file_URL__c, User__c, USer_Name__c,
                    Date_Format__c, CreatedDate
                FROM Attachment__c
                WHERE Id IN :sharedIds
                ORDER BY CreatedDate DESC
            ];

            System.debug('🟢 Shared Docs Count: ' + sharedDocs.size());

            return sharedDocs;
        }

        // ============================================================
        // ❌ OTHER USERS
        // ============================================================
        System.debug('❌ No access for user');

        return new List<Attachment__c>();
    }
    */

    @AuraEnabled
    public static List<Attachment__c> fetchAttachmentsForStaff(Id clientId, Id folderId) {

        Id currentUserId = UserInfo.getUserId();

        System.debug('🔵 fetchAttachmentsForStaff - UserId: ' + currentUserId);
        System.debug('🔵 ClientId: ' + clientId);
        System.debug('📁 FolderId: ' + folderId);

        List<Attachment__c> ownDocs;

        if (folderId == null) {

            ownDocs = [
                SELECT Id, Attachment_UID__c, Participant_Doc_UID__c, Name, Type__c, Comments__c, Size__c, Key__c,Amazon_file_URL__c, User__c, USer_Name__c,Date_Format__c, CreatedDate, Attachment_Folder__c, Participant_Contact__c,LastModifiedBy.Name,LastModifiedDate
                FROM Attachment__c
                WHERE Added_By__c = :clientId
                AND User__c = :currentUserId
                AND Is_Archived__c = false
                ORDER BY CreatedDate DESC
            ];

        } else {

            ownDocs = [
                SELECT Id, Attachment_UID__c, Participant_Doc_UID__c, Name, Type__c, Comments__c, Size__c, Key__c,Amazon_file_URL__c, User__c, USer_Name__c,Date_Format__c, CreatedDate, Attachment_Folder__c, Participant_Contact__c, LastModifiedBy.Name,LastModifiedDate
                FROM Attachment__c
                WHERE Added_By__c = :clientId
                AND User__c = :currentUserId
                AND Attachment_Folder__c = :folderId
                AND Is_Archived__c = false
                ORDER BY CreatedDate DESC
            ];
        }

        System.debug('🟢 Own Attachments Count: ' + ownDocs.size());

        return ownDocs;
    }

    @AuraEnabled
    public static List<Attachment__c> fetchClientAttachmentsSecure(
        Id clientId,
        Id folderId
    ) {

        Id currentUserId = UserInfo.getUserId();

        User currentUser = [

            SELECT
                Id,
                Email,
                User_Type__c

            FROM User
            WHERE Id = :currentUserId
            LIMIT 1
        ];

        String roleName =
            currentUser.User_Type__c != null
                ? currentUser.User_Type__c
                : '';

        Boolean isOrgAdmin =
            roleName == 'CEO' ||
            roleName == 'Portal Account Partner Executive' ||
            roleName == 'NDIS Org Admin' ||
            roleName == 'Facility Admin' ||
            roleName == 'NDIS Participants';

        Boolean isRosterManager =
            roleName == 'Roster Manager';

        // ============================================
        // ✅ ORG ADMIN → ALL ATTACHMENTS
        // ============================================

        if (isOrgAdmin) {

            if (folderId == null) {

                return [

                    SELECT
                        Id,
                        Attachment_UID__c,
                        Participant_Doc_UID__c,                        
                        Name,
                        Type__c,
                        Comments__c,
                        Size__c,
                        Key__c,
                        Amazon_file_URL__c,
                        User__c,
                        USer_Name__c,
                        Date_Format__c,
                        CreatedDate,
                        Attachment_Folder__c,
                        Participant_Contact__c,
                        LastModifiedBy.Name,
                        LastModifiedDate

                    FROM Attachment__c

                    WHERE Added_By__c = :clientId
                    AND Is_Archived__c = false

                    ORDER BY CreatedDate DESC
                ];

            } else {

                return [

                    SELECT
                        Id,
                        Attachment_UID__c,
                        Participant_Doc_UID__c,                        
                        Name,
                        Type__c,
                        Comments__c,
                        Size__c,
                        Key__c,
                        Amazon_file_URL__c,
                        User__c,
                        USer_Name__c,
                        Date_Format__c,
                        CreatedDate,
                        Attachment_Folder__c,
                        Participant_Contact__c,
                        LastModifiedBy.Name,
                        LastModifiedDate

                    FROM Attachment__c

                    WHERE Added_By__c = :clientId
                    AND Attachment_Folder__c = :folderId
                    AND Is_Archived__c = false

                    ORDER BY CreatedDate DESC
                ];
            }
        }

        // ============================================
        // ✅ GET STAFF RECORD
        // ============================================

        List<Staff__c> staffList = [

            SELECT Id, Email_Address__c
            FROM Staff__c
            WHERE Email_Address__c = :currentUser.Email
            LIMIT 1
        ];

        if (staffList.isEmpty()) {
            return new List<Attachment__c>();
        }

        Staff__c loggedInStaff = staffList[0];

        // ============================================
        // ✅ OWN ATTACHMENTS
        // ============================================

        Set<Id> visibleAttachmentIds =
            new Set<Id>();

        Set<Id> visibleFolderIds =
            new Set<Id>();

        for (Attachment__c att : [

            SELECT Id
            FROM Attachment__c
            WHERE Added_By__c = :clientId
            AND User__c = :currentUserId
            AND Is_Archived__c = false
        ]) {

            visibleAttachmentIds.add(att.Id);
        }

        // ============================================
        // ✅ DIRECT SHARED ATTACHMENTS
        // ============================================

        for (Participant_Docs_Share__c share : [

            SELECT Attachment__c,
            Attachment__r.Added_By__c
            FROM Participant_Docs_Share__c
            WHERE Staff__c = :loggedInStaff.Id
            AND Is_Active__c = true
            AND Attachment__r.Added_By__c = :clientId
        ]) {

            if (share.Attachment__c != null) {

                visibleAttachmentIds.add(
                    share.Attachment__c
                );
            }
        }

        // ============================================
        // ✅ SHARED FOLDERS
        // ============================================

        for (Folder_Share__c fs : [

            SELECT
                Attachment_Folder__c,
                Full_Folder_Access__c,
                Participant__c

            FROM Folder_Share__c

            WHERE Staff__c = :loggedInStaff.Id
            AND Participant__c = :clientId
            AND Active__c = true
        ]) {

            if (fs.Attachment_Folder__c != null) {

                // Folder visible in tree
                visibleFolderIds.add(
                    fs.Attachment_Folder__c
                );

            }
        }

        // ============================================
        // ✅ OWN FOLDERS
        // ============================================

        for (Attachment_Folder__c folder : [

            SELECT Id
            FROM Attachment_Folder__c
            WHERE CreatedById = :currentUserId
        ]) {

            visibleFolderIds.add(folder.Id);
        }

        // ============================================
        // ✅ FINAL QUERY
        // ============================================

        if (visibleAttachmentIds.isEmpty()) {
            return new List<Attachment__c>();
        }

        String query =
            'SELECT ' +
            'Id, ' +
            'Attachment_UID__c, ' +
            'Participant_Doc_UID__c, ' +            
            'Name, ' +
            'Type__c, ' +
            'Comments__c, ' +
            'Size__c, ' +
            'Key__c, ' +
            'Amazon_file_URL__c, ' +
            'User__c, ' +
            'USer_Name__c, ' +
            'Date_Format__c, ' +
            'CreatedDate, ' +
            'Attachment_Folder__c, ' +
            'Participant_Contact__c, ' +
            'LastModifiedBy.Name, ' +
            'LastModifiedDate ' +
            'FROM Attachment__c ' +
            'WHERE Id IN :visibleAttachmentIds ' +
            'AND Is_Archived__c = false ';

        if (folderId != null) {

            query +=
                'AND Attachment_Folder__c = :folderId ';
        }

        query +=
            'ORDER BY CreatedDate DESC';

        return Database.query(query);
    }

    @AuraEnabled
    public static List<Attachment_Folder__c> getFolders(
        Id clientId
    ) {

        Id currentUserId = UserInfo.getUserId();

        User currentUser = [

            SELECT
                Id,
                Email,
                UserRole.Name

            FROM User
            WHERE Id = :currentUserId
            LIMIT 1
        ];

        String roleName =
            currentUser.UserRole != null
                ? currentUser.UserRole.Name
                : '';

        Boolean isOrgAdmin =
            roleName == 'CEO' ||
            roleName == 'Portal Account Partner Executive' ||
            roleName == 'Admin';

        // ============================================
        // ✅ ADMIN → ALL FOLDERS
        // ============================================

        if (isOrgAdmin) {

            return [

                SELECT
                    Id,
                    Name,
                    Parent_Folder__c

                FROM Attachment_Folder__c

                WHERE Participant__c = :clientId
            ];
        }

        // ============================================
        // ✅ STAFF RECORD
        // ============================================

        List<Staff__c> staffList = [

            SELECT Id
            FROM Staff__c
            WHERE Email_Address__c = :currentUser.Email
            LIMIT 1
        ];

        if (staffList.isEmpty()) {
            return new List<Attachment_Folder__c>();
        }

        Staff__c loggedInStaff = staffList[0];

        Set<Id> visibleFolderIds = new Set<Id>();

        // ============================================
        // ✅ OWN FOLDERS
        // ============================================

        for (Attachment_Folder__c folder : [

            SELECT Id
            FROM Attachment_Folder__c
            WHERE CreatedById = :currentUserId
        ]) {

            visibleFolderIds.add(folder.Id);
        }

        // ============================================
        // ✅ SHARED FOLDERS
        // ============================================

        for (Folder_Share__c fs : [

            SELECT Attachment_Folder__c
            FROM Folder_Share__c
            WHERE Staff__c = :loggedInStaff.Id
            AND Participant__c = :clientId
            AND Active__c = true
        ]) {

            if (fs.Attachment_Folder__c != null) {

                visibleFolderIds.add(
                    fs.Attachment_Folder__c
                );
            }
        }

        if (visibleFolderIds.isEmpty()) {
            return new List<Attachment_Folder__c>();
        }

        return [

            SELECT
                Id,
                Name,
                Parent_Folder__c

            FROM Attachment_Folder__c

            WHERE Id IN :visibleFolderIds
        ];
    }

    @AuraEnabled
    public static Id createFolder(
        String name,
        Id parentId,
        Id clientId
    ) {

        System.debug('📁 createFolder START');

        System.debug('Folder Name: ' + name);
        System.debug('Parent Id: ' + parentId);
        System.debug('Client Id: ' + clientId);

        // ============================================
        // VALIDATION
        // ============================================

        if (String.isBlank(name)) {

            throw new AuraHandledException(
                'Folder name is required'
            );
        }

        // ============================================
        // NORMALIZE NAME
        // ============================================

        String trimmedName = name.trim();

        // ============================================
        // CHECK DUPLICATE
        // SAME PARTICIPANT
        // SAME PARENT
        // ============================================

        List<Attachment_Folder__c> existingFolders;

        // ROOT LEVEL
        if (parentId == null) {

            existingFolders = [

                SELECT Id, Name
                FROM Attachment_Folder__c

                WHERE Participant__c = :clientId
                AND Parent_Folder__c = null
                AND Name = :trimmedName

                LIMIT 1
            ];

        } else {

            existingFolders = [

                SELECT Id, Name
                FROM Attachment_Folder__c

                WHERE Participant__c = :clientId
                AND Parent_Folder__c = :parentId
                AND Name = :trimmedName

                LIMIT 1
            ];
        }

        // ============================================
        // DUPLICATE FOUND
        // ============================================

        if (!existingFolders.isEmpty()) {

            throw new AuraHandledException(
                'A folder with this name already exists.'
            );
        }

        // ============================================
        // CREATE FOLDER
        // ============================================

        Attachment_Folder__c folder =
            new Attachment_Folder__c(

                Name = trimmedName,

                Parent_Folder__c = parentId,

                Participant__c = clientId
            );

        insert folder;

        System.debug(
            '✅ Folder Created: ' + folder.Id
        );

        return folder.Id;
    }

    @AuraEnabled
    public static void updateFolderName(Id folderId, String newName) {

        if (String.isBlank(newName)) {
            throw new AuraHandledException('Folder name cannot be empty');
        }

        Attachment_Folder__c folder = [
            SELECT Id, Name
            FROM Attachment_Folder__c
            WHERE Id = :folderId
            LIMIT 1
        ];

        folder.Name = newName;

        update folder;
    }

    @AuraEnabled
    public static List<Participant_Contact__c> loadContacts(Id clientId) {
        return [
            SELECT Id, First_Name__c, Last_Name__c
            FROM Participant_Contact__c
            WHERE Participant__c = :clientId
            ORDER BY First_Name__c, Last_Name__c
        ];
    }

    @AuraEnabled
    public static void deleteContactAttachment(Id attachmentId) {

        if (attachmentId == null) {
            throw new AuraHandledException('Attachment Id is required');
        }

        delete [
            SELECT Id
            FROM Attachment__c
            WHERE Id = :attachmentId
            LIMIT 1
        ];
    }

    @AuraEnabled
    public static List<Attachment__c> getContactAttachments(Id contactId) {

        if (contactId == null) {
            return new List<Attachment__c>();
        }

        return [

            SELECT
                Id,
                Name,
                File_Name__c,
                Amazon_file_URL__c,
                Key__c,
                Size__c,
                CreatedDate,
                Date_Format__c,
                CreatedBy.Name,
                Type__c,
                Type_of_Document__c,
                Comments__c, 
                Expiry_Date__c,
                LastModifiedBy.Name,
                LastModifiedDate

            FROM Attachment__c
            WHERE Participant_Contact__c = :contactId
            AND Is_Archived__c = false
            ORDER BY CreatedDate DESC
        ];
    }

    @AuraEnabled
    public static Map<Id, Integer> getContactAttachmentCounts(List<Id> contactIds) {

        Map<Id, Integer> countMap =
            new Map<Id, Integer>();

        if (contactIds == null || contactIds.isEmpty()) {
            return countMap;
        }

        for (AggregateResult ar : [

            SELECT
                Participant_Contact__c contactId,
                COUNT(Id) total
            FROM Attachment__c
            WHERE Participant_Contact__c IN :contactIds
            GROUP BY Participant_Contact__c

        ]) {

            countMap.put(
                (Id) ar.get('contactId'),
                (Integer) ar.get('total')
            );
        }
        return countMap;
    }

    @AuraEnabled
    public static List<Attachment__c> getAllContactAttachments(Id clientId) {

        if (clientId == null) {
            return new List<Attachment__c>();
        }

        return [

            SELECT
                Id,
                Name,
                File_Name__c,
                Amazon_file_URL__c,
                Key__c,
                Size__c,
                CreatedDate,
                CreatedBy.Name,
                Date_Format__c,
                Participant_Contact__r.First_Name__c,
                Participant_Contact__r.Last_Name__c,
                Comments__c,
                Type__c,
                LastModifiedBy.Name,
                LastModifiedDate

            FROM Attachment__c

            WHERE Participant_Contact__r.Participant__c = :clientId
            AND Is_Archived__c = false

            ORDER BY CreatedDate DESC
        ];
    }

    @AuraEnabled
    public static void saveFolderShares(
        Id folderId,
        List<Id> staffIds
    ) {

        if (folderId == null) {

            throw new AuraHandledException(
                'Folder Id required'
            );
        }

        // ====================================
        // GET FOLDER + PARTICIPANT
        // ====================================

        Attachment_Folder__c folder = [

            SELECT
                Id,
                Participant__c

            FROM Attachment_Folder__c

            WHERE Id = :folderId
            LIMIT 1
        ];

        System.debug('Folder Id: ' + folder.Id);
        System.debug('Participant Id: ' + folder.Participant__c);

        // ====================================
        // GET EXISTING SHARES
        // ====================================

        List<Folder_Share__c> existingShares = [

            SELECT Id,
                Staff__c,
                Active__c
            FROM Folder_Share__c
            WHERE Attachment_Folder__c = :folderId
            AND Participant__c = :folder.Participant__c
        ];

        Map<Id, Folder_Share__c> existingMap = new Map<Id, Folder_Share__c>();

        for (Folder_Share__c fs : existingShares) {

            existingMap.put(
                fs.Staff__c,
                fs
            );
        }

        Set<Id> selectedStaffIds = new Set<Id>();

        if (staffIds != null) {
            selectedStaffIds.addAll(staffIds);
        }

        List<Folder_Share__c> insertList = new List<Folder_Share__c>();

        List<Folder_Share__c> updateList = new List<Folder_Share__c>();

        // ====================================
        // ENABLE SELECTED STAFF
        // ====================================

        for (Id staffId : selectedStaffIds) {

            // EXISTING SHARE
            if (existingMap.containsKey(staffId)) {

                Folder_Share__c fs =
                    existingMap.get(staffId);

                // ONLY UPDATE IF FALSE
                if (fs.Active__c == false) {

                    fs.Active__c = true;

                    updateList.add(fs);
                }

            } else {

                // NEW SHARE
                insertList.add(

                    new Folder_Share__c(

                        Attachment_Folder__c = folderId,
                        Participant__c = folder.Participant__c,
                        Staff__c = staffId,
                        Active__c = true,
                        Full_Folder_Access__c = true
                    )
                );
            }
        }

        // ====================================
        // DISABLE REMOVED STAFF
        // ====================================

        for (Folder_Share__c fs : existingShares) {
            if (!selectedStaffIds.contains(fs.Staff__c)) {
                if (fs.Active__c == true) {
                    fs.Active__c = false;
                    updateList.add(fs);
                }
            }
        }

        // ====================================
        // DML
        // ====================================

        if (!insertList.isEmpty()) {
            insert insertList;
        }

        if (!updateList.isEmpty()) {
            update updateList;
        }

        // ====================================
        // SHARE ATTACHMENTS
        // ====================================

        List<Attachment__c> attachments = [

            SELECT Id
            FROM Attachment__c
            WHERE Attachment_Folder__c = :folderId
        ];

        for (Attachment__c att : attachments) {

            saveParticipantDocShares(
                att.Id,
                staffIds
            );
        }

        // ====================================
        // UNSHARE ATTACHMENTS FOR REMOVED STAFF
        // ====================================

        Set<Id> removedStaffIds = new Set<Id>();

        for (Folder_Share__c fs : existingShares) {

            if (!selectedStaffIds.contains(fs.Staff__c)) {

                removedStaffIds.add(fs.Staff__c);
            }
        }

        if (!removedStaffIds.isEmpty()) {

            Set<Id> attachmentIds = new Set<Id>();

            for (Attachment__c att : attachments) {
                attachmentIds.add(att.Id);
            }

            if (!attachmentIds.isEmpty()) {

                List<Participant_Docs_Share__c> sharesToDeactivate = [

                    SELECT Id,
                        Is_Active__c
                    FROM Participant_Docs_Share__c
                    WHERE Attachment__c IN :attachmentIds
                    AND Staff__c IN :removedStaffIds
                    AND Is_Active__c = true
                ];

                for (Participant_Docs_Share__c shareRec : sharesToDeactivate) {

                    shareRec.Is_Active__c = false;
                }

                if (!sharesToDeactivate.isEmpty()) {

                    update sharesToDeactivate;
                }
            }
        }
    }

    @AuraEnabled
    public static List<Folder_Share__c> fetchFolderSharedStaff(
        Id folderId
    ) {

        if (folderId == null) {
            return new List<Folder_Share__c>();
        }

        return [

            SELECT
                Id,
                Staff__c,
                Staff__r.Display_Nickname__c

            FROM Folder_Share__c

            WHERE Attachment_Folder__c = :folderId
            AND Active__c = true
        ];
    }

    @AuraEnabled
    public static void archiveAttachment(Id attachmentId) {

        if (attachmentId == null) {
            throw new AuraHandledException('Attachment Id is required');
        }

        Attachment__c att = [
            SELECT Id, Is_Archived__c,Archived_By__c
            FROM Attachment__c
            WHERE Id = :attachmentId
            LIMIT 1
        ];

        att.Is_Archived__c = true;
        att.Archived_Date__c = Date.today();
        att.Archived_By__c = UserInfo.getUserId();

        update att;
    }

    @AuraEnabled
    public static void restoreAttachment(Id attachmentId) {

        if (attachmentId == null) {
            throw new AuraHandledException('Attachment Id is required');
        }

        Attachment__c att = [
            SELECT Id
            FROM Attachment__c
            WHERE Id = :attachmentId
            LIMIT 1
        ];

        att.Is_Archived__c = false;
        att.Archived_Date__c = null;
        att.Archived_By__c = null;

        update att;
        
        // ====================================
        // REMOVE ALL SHARED STAFF
        // ====================================

        List<Participant_Docs_Share__c> shares = [

            SELECT Id
            FROM Participant_Docs_Share__c
            WHERE Attachment__c = :attachmentId
        ];

        if (!shares.isEmpty()) {

            delete shares;
        }
    }

    @AuraEnabled
    public static List<ArchivedAttachmentWrapper> getArchivedAttachments(
        Id clientId,
        Id folderId
    ) {

        if (clientId == null) {
            return new List<ArchivedAttachmentWrapper>();
        }

        List<Attachment__c> attachments;

        if (folderId == null) {

            attachments = [
                SELECT
                    Id,
                    Attachment_UID__c,
                    Participant_Doc_UID__c,                    
                    Name,
                    Type__c,
                    Date_Format__c,
                    Expiry_Date__c,
                    Archived_Date__c,
                    Archived_By__r.Name,
                    Amazon_file_URL__c,
                    Key__c,
                    Attachment_Folder__c,
                    Attachment_Folder__r.Name,
                    Attachment_Folder__r.Parent_Folder__c,
                    Attachment_Folder__r.Parent_Folder__r.Name
                FROM Attachment__c
                WHERE Added_By__c = :clientId
                AND Is_Archived__c = true
                ORDER BY Archived_Date__c DESC
            ];

        } else {

            attachments = [
                SELECT
                    Id,
                    Attachment_UID__c,
                    Participant_Doc_UID__c,                    
                    Name,
                    Type__c,
                    Date_Format__c,
                    Expiry_Date__c,
                    Archived_Date__c,
                    Amazon_file_URL__c,
                    Archived_By__r.Name,
                    Key__c,
                    Attachment_Folder__c,
                    Attachment_Folder__r.Name,
                    Attachment_Folder__r.Parent_Folder__c,
                    Attachment_Folder__r.Parent_Folder__r.Name
                FROM Attachment__c
                WHERE Added_By__c = :clientId
                AND Attachment_Folder__c = :folderId
                AND Is_Archived__c = true
                ORDER BY Archived_Date__c DESC
            ];
        }

        List<ArchivedAttachmentWrapper> results = new List<ArchivedAttachmentWrapper>();

        for (Attachment__c att : attachments) {

            ArchivedAttachmentWrapper wrap = new ArchivedAttachmentWrapper();

            wrap.Id = att.Id;
            wrap.AttachmentUID = att.Attachment_UID__c;
            wrap.ParticipantDocUID = att.Participant_Doc_UID__c;            
            wrap.Name = att.Name;
            wrap.Type = att.Type__c;
            wrap.ExpiryDate = att.Expiry_Date__c;
            wrap.IsExpired =
                att.Expiry_Date__c != null &&
                att.Expiry_Date__c < Date.today();
            wrap.ArchivedDate = att.Date_Format__c;
            wrap.ArchivedBy =
                att.Archived_By__r != null
                    ? att.Archived_By__r.Name
                    : '';
            wrap.AmazonURL = att.Amazon_file_URL__c;

            if (att.Attachment_Folder__c != null) {

                wrap.FolderPath = buildFolderPath(att.Attachment_Folder__c);

                wrap.ParentFolder =
                    att.Attachment_Folder__r.Parent_Folder__r != null
                    ? att.Attachment_Folder__r.Parent_Folder__r.Name
                    : '';
            }

            results.add(wrap);
        }

        return results;
    }

    public class ArchivedAttachmentWrapper {
        @AuraEnabled public Id Id;
        @AuraEnabled public String AttachmentUID;
        @AuraEnabled public String ParticipantDocUID;        
        @AuraEnabled public String Name;
        @AuraEnabled public String Type;
        @AuraEnabled public String ArchivedDate;
        @AuraEnabled public Date ExpiryDate;
        @AuraEnabled public Boolean IsExpired;
        @AuraEnabled public String ArchivedBy;
        @AuraEnabled public String AmazonURL;
        @AuraEnabled public String ParentFolder;
        @AuraEnabled public String FolderPath;
    }

    public static String buildFolderPath(Id folderId) {
        List<String> folderNames = new List<String>();
        while(folderId != null) {
            Attachment_Folder__c folder = [
                SELECT Id, Name, Parent_Folder__c
                FROM Attachment_Folder__c
                WHERE Id = :folderId
                LIMIT 1
            ];
            folderNames.add(folder.Name);
            folderId = folder.Parent_Folder__c;
        }
        List<String> reversedNames = new List<String>();
        for(Integer i = folderNames.size() - 1; i >= 0; i--) {
            reversedNames.add(folderNames[i]);
        }
        return String.join(reversedNames, ' > ');
    }

    @AuraEnabled
    public static Boolean canDeleteFolder(Id folderId) {

        // Check child folders
        Integer childFolderCount = [
            SELECT COUNT()
            FROM Attachment_Folder__c
            WHERE Parent_Folder__c = :folderId
        ];

        // Check files
        Integer fileCount = [
            SELECT COUNT()
            FROM Attachment__c
            WHERE Attachment_Folder__c = :folderId
        ];

        System.debug('📂 childFolderCount => ' + childFolderCount);
        System.debug('📄 fileCount => ' + fileCount);

        return childFolderCount == 0 && fileCount == 0;
    }

    @AuraEnabled
    public static void deleteFolder(Id folderId) {

        Boolean canDelete = canDeleteFolder(folderId);

        if (!canDelete) {
            throw new AuraHandledException(
                'Folder cannot be deleted because it contains files or subfolders.'
            );
        }

        delete [
            SELECT Id
            FROM Attachment_Folder__c
            WHERE Id = :folderId
            LIMIT 1
        ];
    }

    @AuraEnabled
    public static List<Attachment__c> getAllArchivedParticipantAttachments() {

        User currentUser = [
            SELECT Id, UserRole.Name, Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        Organisation__c orgRecord = [
            SELECT Id
            FROM Organisation__c
            WHERE Name = :currentUser.Organization_Name__c
            LIMIT 1
        ];

        return [
            SELECT
                Id,
                Name,
                Participant_Doc_UID__c,
                Type__c,
                Size__c,
                Comments__c,
                User_Name__c,
                Date_Format__c,
                Archived_Date__c,
                Amazon_file_URL__c,
                Key__c,
                Added_By__c,
                Added_By__r.Display_Nickname__c
            FROM Attachment__c
            WHERE Is_Archived__c = true
            AND Added_By__r.Facility__r.Organisation__c = :orgRecord.Id
            ORDER BY Archived_Date__c DESC
        ];
    }

}