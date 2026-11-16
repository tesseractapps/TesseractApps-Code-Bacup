@RestResource(urlMapping='/ParticipantJournelValidation/*')
global with sharing class MobileAppParticipantJournalValidation {
    // 🔹 Parent Wrapper
    global class JournalWrapper {
        public Id id;
        public String description;
        public String createdDate;
        public String lastModifiedDate;
        public String createdByName;
        public String createdByPhoto;
        public String careNotes;

        public String staffName;
        public String staffLastName;
        public String staffPicture;
        public string StaffFullName;
 public List<AttachmentWrapper> attachments;
        public List<ChildJournalWrapper> childJournals;
    }

    // 🔹 Child Wrapper (NO Id)
    global class ChildJournalWrapper {
        public String description;
        public String createdDate;
        public String lastModifiedDate;
        public String createdByName;
        public String createdByPhoto;
        public String careNotes;
        public String reason;

        public String staffName;
        public String staffLastName;
        public String staffPicture;
        public string StaffFullName;
        public List<AttachmentWrapper> attachments;
        
    }
global class AttachmentWrapper {

    public String fileId;
    public String key;
    public String modulePath;
    public String originalName;
    public String type;
    public String url;
}
    // 🔹 Date Formatter
    public static String formatDateTime(Datetime dt) {
        return dt != null ? dt.format('dd/MM/yyyy hh:mm a', 'Australia/Sydney') : null;
    }

    @HttpGet
    global static void getShiftWiseJournals() {

        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        Map<String, Object> result = new Map<String, Object>();

        try {
            String shiftId = req.params.get('shiftId');
            String clientId = req.params.get('clientId');

            if (String.isBlank(shiftId)) {
                throw new AuraHandledException('shiftId is required');
            }

            /* String query = 'SELECT Id, Description__c, CreatedDate, LastModifiedDate, ' +
                'CreatedBy.Name, CreatedBy.SmallPhotoUrl, Care_Notes__c, Reason__c, ' +
                'Staff__r.Name, Staff__r.Last_Name__c, Staff__r.Picture__c,Staff__r.Display_Nickname__c, ' +
                '(SELECT Description__c, CreatedDate, LastModifiedDate, ' +
                'CreatedBy.Name, CreatedBy.SmallPhotoUrl, Care_Notes__c, Reason__c, ' +
                'Staff__r.Name, Staff__r.Last_Name__c, Staff__r.Picture__c,Staff__r.Display_Nickname__c ' +
                'FROM Client_Journels__r ORDER BY CreatedDate DESC) ' +
                
                'FROM Client_Journel__c ' +
                'WHERE ShiftwithStaff__c = :shiftId ' +
                'AND Original_Client_Journel__c = NULL ';
            
            if (!String.isBlank(clientId)) {
                query += 'AND Client__c = :clientId ';
            }
            
            query += 'ORDER BY CreatedDate DESC'; */

            String query = 'SELECT Id, Description__c, CreatedDate, LastModifiedDate, ' +
            'CreatedBy.Name, CreatedBy.SmallPhotoUrl, Care_Notes__c, Reason__c, ' +
            'Staff__r.Name, Staff__r.Last_Name__c, Staff__r.Picture__c, Staff__r.Display_Nickname__c, ' +

            '(SELECT Description__c, CreatedDate, LastModifiedDate, ' +
            'CreatedBy.Name, CreatedBy.SmallPhotoUrl, Care_Notes__c, Reason__c, ' +
            'Staff__r.Name, Staff__r.Last_Name__c, Staff__r.Picture__c, Staff__r.Display_Nickname__c ' +
            'FROM Client_Journels__r ORDER BY CreatedDate DESC), ' +

            '(SELECT Id, ' +
            'File_Name__c, ' +
            'File_URL__c, ' +
            'File_Type__c, ' +
            'AWS_Key__c, ' +
            'Aws_Json__c ' +
            'FROM Journal_Attachments__r) ' +

            'FROM Client_Journel__c ' +
            'WHERE ShiftwithStaff__c = :shiftId ' +
            'AND Original_Client_Journel__c = NULL ';

        if (!String.isBlank(clientId)) {
            query += 'AND Client__c = :clientId ';
        }

        query += 'ORDER BY CreatedDate DESC';

		List<Client_Journel__c> clientJournals = Database.query(query);
        List<Id> correctionIds = new List<Id>();

for (Client_Journel__c rec : clientJournals) {

    if (rec.Client_Journels__r != null) {

        for (Client_Journel__c child : rec.Client_Journels__r) {
            correctionIds.add(child.Id);
        }

    }
}

Map<Id, List<Journal_Attachments__c>> correctionAttachmentMap =
    ParticipantDetailsHandler.getCorrectionAttachments(correctionIds);
            List<JournalWrapper> wrapperList = new List<JournalWrapper>();

            for (Client_Journel__c rec : clientJournals) {

                JournalWrapper jw = new JournalWrapper();
jw.attachments = new List<AttachmentWrapper>();
                // 🔹 Parent mapping
                jw.id = rec.Id;
                jw.description = rec.Description__c;
                jw.createdDate = formatDateTime(rec.CreatedDate);
                jw.lastModifiedDate = formatDateTime(rec.LastModifiedDate);
                jw.createdByName = rec.CreatedBy.Name;
                jw.createdByPhoto = rec.CreatedBy.SmallPhotoUrl;
                jw.careNotes = rec.Care_Notes__c;

                if (rec.Staff__r != null) {
                    jw.staffName = rec.Staff__r.Name;
                    jw.staffLastName = rec.Staff__r.Last_Name__c;
                    jw.staffPicture = rec.Staff__r.Picture__c;
                    jw.StaffFullName = rec.Staff__r.Display_Nickname__c;
                }

                // 🔹 Child mapping
                jw.childJournals = new List<ChildJournalWrapper>();

                if (rec.Client_Journels__r != null) {
                    for (Client_Journel__c child : rec.Client_Journels__r) {

                        ChildJournalWrapper cj = new ChildJournalWrapper();
cj.attachments = new List<AttachmentWrapper>();
                        cj.description = child.Description__c;
                        cj.createdDate = formatDateTime(child.CreatedDate);
                        cj.lastModifiedDate = formatDateTime(child.LastModifiedDate);
                        cj.createdByName = child.CreatedBy.Name;
                        cj.createdByPhoto = child.CreatedBy.SmallPhotoUrl;
                        cj.careNotes = child.Care_Notes__c;
                        cj.reason = child.Reason__c;

                        if (child.Staff__r != null) {
                            cj.staffName = child.Staff__r.Name;
                            cj.staffLastName = child.Staff__r.Last_Name__c;
                            cj.staffPicture = child.Staff__r.Picture__c;
                            cj.StaffFullName =  child.Staff__r.Display_Nickname__c;
                        }
if (correctionAttachmentMap.containsKey(child.Id)) {

    for (Journal_Attachments__c att :
        correctionAttachmentMap.get(child.Id)) {

        AttachmentWrapper aw = new AttachmentWrapper();

        Map<String, Object> awsJson = new Map<String, Object>();

        if (!String.isBlank(att.Aws_Json__c)) {
            awsJson = (Map<String, Object>)JSON.deserializeUntyped(att.Aws_Json__c);
        }

        aw.fileId = awsJson.containsKey('fileId')
            ? String.valueOf(awsJson.get('fileId'))
            : String.valueOf(att.Id);

        aw.key = awsJson.containsKey('key')
            ? String.valueOf(awsJson.get('key'))
            : att.AWS_Key__c;

        aw.modulePath = awsJson.containsKey('modulePath')
            ? String.valueOf(awsJson.get('modulePath'))
            : 'participantjournal';

        aw.originalName = awsJson.containsKey('originalName')
            ? String.valueOf(awsJson.get('originalName'))
            : att.File_Name__c;

        aw.type = awsJson.containsKey('type')
            ? String.valueOf(awsJson.get('type'))
            : att.File_Type__c;

        aw.url = awsJson.containsKey('url')
            ? String.valueOf(awsJson.get('url'))
            : att.File_URL__c;

        cj.attachments.add(aw);
    }
}
                        jw.childJournals.add(cj);
                    }
                }
if (rec.Journal_Attachments__r != null) {

    for (Journal_Attachments__c att : rec.Journal_Attachments__r) {

        AttachmentWrapper aw = new AttachmentWrapper();

        Map<String, Object> awsJson = new Map<String, Object>();

        if (!String.isBlank(att.Aws_Json__c)) {
            awsJson = (Map<String, Object>)JSON.deserializeUntyped(att.Aws_Json__c);
        }

        aw.fileId = awsJson.containsKey('fileId')
            ? String.valueOf(awsJson.get('fileId'))
            : String.valueOf(att.Id);

        aw.key = awsJson.containsKey('key')
            ? String.valueOf(awsJson.get('key'))
            : att.AWS_Key__c;

        aw.modulePath = awsJson.containsKey('modulePath')
            ? String.valueOf(awsJson.get('modulePath'))
            : 'participantjournal';

        aw.originalName = awsJson.containsKey('originalName')
            ? String.valueOf(awsJson.get('originalName'))
            : att.File_Name__c;

        aw.type = awsJson.containsKey('type')
            ? String.valueOf(awsJson.get('type'))
            : att.File_Type__c;

        aw.url = awsJson.containsKey('url')
            ? String.valueOf(awsJson.get('url'))
            : att.File_URL__c;

        jw.attachments.add(aw);
    }
}
                wrapperList.add(jw);
            }

            result.put('journals', wrapperList);
            result.put('success', true);

        } catch (Exception e) {
            result.put('success', false);
            result.put('errorMessage', e.getMessage());
        }

        sendResponse(res, result);
    }

    public static void sendResponse(RestResponse res, Object payload) {
        res.statusCode = 200;
        res.responseBody = Blob.valueOf(JSON.serialize(payload));
    }

    
}