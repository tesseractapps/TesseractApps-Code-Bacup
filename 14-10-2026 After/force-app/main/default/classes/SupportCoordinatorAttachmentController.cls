public class SupportCoordinatorAttachmentController {

    @AuraEnabled
    public static Id createAttachment(
        String attachmentName,
        String attachmentType,
        String otherComments,
        Date expiryDate,
        Id userId,
        String comments,
        Id supportClientId,
        Id folderId,
        String amazonUrl,
        String fileKey,
        String fileName,
        String fileSize
    ) {

        try {

            Attachment__c attachmentRec = new Attachment__c();

            attachmentRec.Name = attachmentName;
            attachmentRec.Type__c = attachmentType;

            if(String.isNotBlank(otherComments)) {
                attachmentRec.Other_Comments__c = otherComments;
            }

            if(expiryDate != null) {
                attachmentRec.Expiry_Date__c = expiryDate;
            }

            if(userId != null) {
                attachmentRec.User__c = userId;
            }

            if(String.isNotBlank(comments)) {
                attachmentRec.Comments__c = comments;
            }

            if(supportClientId != null) {
                attachmentRec.Support_Client__c = supportClientId;
            }

            // File Information
            if(String.isNotBlank(amazonUrl)) {
                attachmentRec.Amazon_file_URL__c = amazonUrl;
            }

            if(String.isNotBlank(fileKey)) {
                attachmentRec.Key__c = fileKey;
            }

            if(String.isNotBlank(fileName)) {
                attachmentRec.File_Name__c = fileName;
            }

            if(fileSize != null) {
                attachmentRec.Size__c = String.valueOf(fileSize);
            }

            if(folderId != null) {
                attachmentRec.Attachment_Folder__c = folderId;
            }

            insert attachmentRec;

            return attachmentRec.Id;

        } catch (Exception ex) {

            throw new AuraHandledException(
                'Error creating attachment: ' + ex.getMessage()
            );
        }
    }

    @AuraEnabled
    public static List<Attachment__c> getAttachments(
        Id supportClientId,
        Id folderId
    )
    {
        if (supportClientId == null) {
            return new List<Attachment__c>();
        }

        if (folderId == null) {

            return [

                SELECT Id,
                    Name,
                    Type__c,
                    Other_Comments__c,
                    Comments__c,
                    User__c,
                    User__r.Name,
                    Expiry_Date__c,
                    Support_Client__c,
                    Amazon_file_URL__c,
                    Key__c,
                    File_Name__c,
                    Size__c,
                    Date_Format__c,
                    Attachment_Folder__c
                FROM Attachment__c
                WHERE Support_Client__c = :supportClientId
                ORDER BY CreatedDate DESC
            ];
        }

        return [

            SELECT Id,
                Name,
                Type__c,
                Other_Comments__c,
                Comments__c,
                User__c,
                User__r.Name,
                Expiry_Date__c,
                Support_Client__c,
                Amazon_file_URL__c,
                Key__c,
                File_Name__c,
                Size__c,
                Date_Format__c,
                Attachment_Folder__c
            FROM Attachment__c
            WHERE Support_Client__c = :supportClientId
            AND Attachment_Folder__c = :folderId
            ORDER BY CreatedDate DESC
        ];
    }

    @AuraEnabled
    public static void deleteAttachment(
        Id attachmentId
    ) {

        if (attachmentId == null) {
            throw new AuraHandledException(
                'Attachment Id is required'
            );
        }

        delete [
            SELECT Id
            FROM Attachment__c
            WHERE Id = :attachmentId
            LIMIT 1
        ];
    }

    @AuraEnabled
    public static Id updateAttachment(
        Id attachmentId,
        String attachmentName,
        String attachmentType,
        String otherComments,
        Date expiryDate,
        Id userId,
        String comments
    ) {

        Attachment__c attachmentRec = [
            SELECT Id
            FROM Attachment__c
            WHERE Id = :attachmentId
            LIMIT 1
        ];

        attachmentRec.Name = attachmentName;
        attachmentRec.Type__c = attachmentType;
        attachmentRec.Other_Comments__c = otherComments;
        attachmentRec.Expiry_Date__c = expiryDate;
        attachmentRec.User__c = userId;
        attachmentRec.Comments__c = comments;

        update attachmentRec;

        return attachmentRec.Id;
    }
    
    @AuraEnabled
    public static List<Attachment_Folder__c> getFolders(
        Id supportClientId
    ) {

        if (supportClientId == null) {
            return new List<Attachment_Folder__c>();
        }

        return [

            SELECT
                Id,
                Name,
                Parent_Folder__c
            FROM Attachment_Folder__c
            WHERE Support_Client__c = :supportClientId
            ORDER BY Name
        ];
    }

    @AuraEnabled
    public static Id createFolder(
        String name,
        Id parentId,
        Id supportClientId
    ) {

        if (String.isBlank(name)) {

            throw new AuraHandledException(
                'Folder name is required'
            );
        }

        if (supportClientId == null) {

            throw new AuraHandledException(
                'Client Id is required'
            );
        }

        String trimmedName = name.trim();

        List<Attachment_Folder__c> existingFolders;

        if (parentId == null) {

            existingFolders = [

                SELECT Id
                FROM Attachment_Folder__c
                WHERE Support_Client__c = :supportClientId
                AND Parent_Folder__c = NULL
                AND Name = :trimmedName
                LIMIT 1
            ];

        } else {

            existingFolders = [

                SELECT Id
                FROM Attachment_Folder__c
                WHERE Support_Client__c = :supportClientId
                AND Parent_Folder__c = :parentId
                AND Name = :trimmedName
                LIMIT 1
            ];
        }

        if (!existingFolders.isEmpty()) {

            throw new AuraHandledException(
                'A folder with this name already exists.'
            );
        }

        Attachment_Folder__c folder = new Attachment_Folder__c(
            Name = trimmedName,
            Parent_Folder__c = parentId,
            Support_Client__c = supportClientId
        );

        insert folder;

        return folder.Id;
    }

}