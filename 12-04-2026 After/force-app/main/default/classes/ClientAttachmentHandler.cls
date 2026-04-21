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

    @AuraEnabled
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
    }

    @AuraEnabled
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
    }    

    @AuraEnabled
    public static List<Attachment__c> fetchAttachmentsForStaff(Id clientId) {

        Id currentUserId = UserInfo.getUserId();

        System.debug('🔵 fetchAttachmentsForStaff - UserId: ' + currentUserId);
        System.debug('🔵 ClientId: ' + clientId);

        // ONLY OWN DOCUMENTS
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
    public static List<Attachment__c> fetchClientAttachmentsSecure(Id clientId) {

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

}