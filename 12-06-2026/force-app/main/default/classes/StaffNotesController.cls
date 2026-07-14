public with sharing class StaffNotesController {

    // ─── Upsert Note ─────────────────────────────────────────────────────────
    @AuraEnabled
    public static Id upsertNote(
        Id     noteId,
        String title,
        String description,
        Id     staffId,
        Id     facilityId
    ) {
        try {
            if (String.isBlank(title)) {
                throw new AuraHandledException('Title is required');
            }

            CMS_Contact_Notes__c note = new CMS_Contact_Notes__c();

            if (noteId != null) {
                note.Id = noteId;
            } else {
                note.Staff__c = staffId;
            }

            note.Title__c        = title;
            note.Description__c  = description;
            note.InternalNotes__c = true;
            note.Facility__c     = facilityId;

            upsert note;
            return note.Id;

        } catch (AuraHandledException e) {
            throw e;
        } catch (Exception e) {
            throw new AuraHandledException(
                'DML Failed: ' + e.getMessage() + ' | Type: ' + e.getTypeName()
            );
        }
    }

    // ─── Get Notes (with child attachments) ─────────────────────────────────
    // FIX: added facilityId param — JS was calling with both params but Apex only had staffId
    @AuraEnabled
    public static List<CMS_Contact_Notes__c> getNotes(Id staffId, Id facilityId) {
        return [
            SELECT  Id,
                    Title__c,
                    Description__c,
                    CreatedDate,
                    CreatedBy.Name,
                    (
                        SELECT  Id,
                                File_Name__c,
                                Awsurl__c,
                                Size__c,
                                key__c
                        FROM    Note_Attachments__r          // child relationship name
                        ORDER BY CreatedDate ASC
                    )
            FROM    CMS_Contact_Notes__c
            WHERE   Staff__c       = :staffId
            AND     InternalNotes__c = true
            AND     Facility__c    = :facilityId
            ORDER BY CreatedDate DESC
        ];
    }

    // ─── Attach AWS Files — mirrors Repository attachFiles exactly ───────────
    @AuraEnabled
    public static void attachNoteFiles(Id noteId, String awsJson, String attachmentId) {
        if (noteId == null || String.isBlank(awsJson)) {
            throw new AuraHandledException('Note ID and file data are required.');
        }

        List<FileWrapper> fileList =
            (List<FileWrapper>) JSON.deserialize(awsJson, List<FileWrapper>.class);

        List<Note_Attachment__c> toUpsert = new List<Note_Attachment__c>();

        for (FileWrapper f : fileList) {
            Note_Attachment__c att = new Note_Attachment__c();

            // if attachmentId is supplied we are replacing an existing record
            if (!String.isBlank(attachmentId)) {
                att.Id = attachmentId;
            }

            att.CMS_Contact_Notes__c = noteId;
            att.Awsurl__c            = f.url;
            att.Aws_Json__c          = JSON.serialize(f);
            att.File_Name__c         = f.originalName;
            att.key__c               = f.key;
            att.Size__c              = f.size;

            toUpsert.add(att);
        }

        if (!toUpsert.isEmpty()) {
            upsert toUpsert;
        }
    }

    // ─── Inner file wrapper — same fields as Repository ──────────────────────
    public class FileWrapper {
        public String url;
        public String originalName;
        public String size;
        public String key;
    }
}