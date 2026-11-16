@RestResource(urlMapping='/ParticipantJournel/*')
global  class mobileAppParticipantJournal {
         @HttpGet
        global static void fecthParticipantList() {
    
            RestRequest req = RestContext.request;
            RestResponse res = RestContext.response;
            Map<String, Object> result = new Map<String, Object>();
    
            try {
                String recordIdParam = req.params.get('ParticipantId');
                System.debug('recordIdParam: ' + recordIdParam);
    
                List<JournalWrapper> wrapperList = new List<JournalWrapper>();
    
                if (recordIdParam != null && recordIdParam != '') {
    
                    List<Client_Journel__c> clientJournalList = [
                        SELECT Id, CreatedDate__c, LastModifiedDate, Description__c,
                               CreatedDate, CreatedBy.Name, CreatedBy.SmallPhotoUrl, CreatedById,
                               Care_Notes__c,
                               Staff__r.Name, Staff__r.Last_Name__c, Staff__r.Picture__c, Staff__r.Display_Nickname__c,
                               (SELECT Description__c, Care_Notes__c, CreatedDate,
                                       CreatedBy.Name, Reason__c, Staff__r.Name, Staff__r.Last_Name__c, Staff__r.Picture__c, Staff__r.Display_Nickname__c
                                FROM Client_Journels__r
                                ORDER BY CreatedDate DESC),
                                 (
               SELECT Id,
                      File_Name__c,
                      File_URL__c,
                      File_Type__c,
                      AWS_Key__c,
                      Aws_Json__c
               FROM Journal_Attachments__r
           )
                        FROM Client_Journel__c
                        WHERE Client__c = :recordIdParam
                        AND (Is_Locked__c = true OR Is_Locked__c = false)
                        AND Original_Client_Journel__c = null
                        ORDER BY CreatedDate DESC
                    ];
                        List<Id> correctionIds = new List<Id>();

                    for (Client_Journel__c journal : clientJournalList) {

                        if (journal.Client_Journels__r != null) {

                            for (Client_Journel__c child : journal.Client_Journels__r) {
                                correctionIds.add(child.Id);
                            }

                        }
                    }
                    Map<Id, List<Journal_Attachments__c>> correctionAttachmentMap =
    ParticipantDetailsHandler.getCorrectionAttachments(correctionIds);
                    // Convert to wrapper
                    for (Client_Journel__c journal : clientJournalList) {
                        JournalWrapper jw = new JournalWrapper();
                        jw.attachments = new List<AttachmentWrapper>();
                        // Parent fields
                        jw.journalId = journal.Id;
                        jw.description = journal.Description__c;
                        jw.careNotes = journal.Care_Notes__c;
                       jw.createdDate = journal.CreatedDate != null  ? journal.CreatedDate.format('dd/MM/yyyy hh:mm a') : null;
                        jw.createdByName = journal.CreatedBy.Name;
                        jw.createdByPhoto = journal.CreatedBy.SmallPhotoUrl;
                        jw.createdById=journal.createdById;
    
                        jw.staffName = journal.Staff__r != null ? journal.Staff__r.Name : null;
                        jw.staffLastName = journal.Staff__r != null ? journal.Staff__r.Last_Name__c : null;
                        jw.staffPicture = journal.Staff__r != null ? journal.Staff__r.Picture__c : null;
                        jw.StaffFullName =  journal.Staff__r != null ?journal.Staff__r.Display_Nickname__c :null;
                        // Child records (inner wrapper, NO Id)
                        jw.childJournals = new List<ChildJournalWrapper>();
    
                        for (Client_Journel__c child : journal.Client_Journels__r) {
                            ChildJournalWrapper cj = new ChildJournalWrapper();
                            cj.attachments = new List<AttachmentWrapper>();
                            cj.description = child.Description__c;
                            cj.careNotes = child.Care_Notes__c;
                           cj.createdDate = child.CreatedDate != null  ? child.CreatedDate.format('dd/MM/yyyy hh:mm a'): null;
                            cj.createdByName = child.CreatedBy.Name;
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

                                    // Read original JSON if available
                                    Map<String, Object> awsJson = new Map<String, Object>();

                                    if (!String.isBlank(att.Aws_Json__c)) {
                                        awsJson = (Map<String, Object>)JSON.deserializeUntyped(att.Aws_Json__c);
                                    }

                                    // fileId
                                    aw.fileId = awsJson.containsKey('fileId')
                                        ? String.valueOf(awsJson.get('fileId'))
                                        : String.valueOf(att.Id);

                                    // key
                                    aw.key = awsJson.containsKey('key')
                                        ? String.valueOf(awsJson.get('key'))
                                        : att.AWS_Key__c;

                                    // modulePath
                                    aw.modulePath = awsJson.containsKey('modulePath')
                                    ? String.valueOf(awsJson.get('modulePath'))
                                    : 'participantjournal';

                                    // originalName
                                    aw.originalName = awsJson.containsKey('originalName')
                                        ? String.valueOf(awsJson.get('originalName'))
                                        : att.File_Name__c;

                                    // type
                                    aw.type = awsJson.containsKey('type')
                                        ? String.valueOf(awsJson.get('type'))
                                        : att.File_Type__c;

                                    // url
                                    aw.url = awsJson.containsKey('url')
                                        ? String.valueOf(awsJson.get('url'))
                                        : att.File_URL__c;

                                    cj.attachments.add(aw);
                                }
                            }
                            jw.childJournals.add(cj);
                        }

                        if (journal.Journal_Attachments__r != null) {

                            for (Journal_Attachments__c att : journal.Journal_Attachments__r) {

                                AttachmentWrapper aw = new AttachmentWrapper();

                                // Read original JSON if available
                                Map<String, Object> awsJson = new Map<String, Object>();

                                if (!String.isBlank(att.Aws_Json__c)) {
                                    awsJson = (Map<String, Object>)JSON.deserializeUntyped(att.Aws_Json__c);
                                }

                                // fileId
                                aw.fileId = awsJson.containsKey('fileId')
                                    ? String.valueOf(awsJson.get('fileId'))
                                    : String.valueOf(att.Id);

                                // key
                                aw.key = awsJson.containsKey('key')
                                    ? String.valueOf(awsJson.get('key'))
                                    : att.AWS_Key__c;

                                // modulePath
                                aw.modulePath = awsJson.containsKey('modulePath')
                                ? String.valueOf(awsJson.get('modulePath'))
                                : 'participantjournal';

                                // originalName
                                aw.originalName = awsJson.containsKey('originalName')
                                    ? String.valueOf(awsJson.get('originalName'))
                                    : att.File_Name__c;

                                // type
                                aw.type = awsJson.containsKey('type')
                                    ? String.valueOf(awsJson.get('type'))
                                    : att.File_Type__c;

                                // url
                                aw.url = awsJson.containsKey('url')
                                    ? String.valueOf(awsJson.get('url'))
                                    : att.File_URL__c;

                                jw.attachments.add(aw);
                            }
                        }
    
                        wrapperList.add(jw);
                    }
                }
    
                result.put('journals', wrapperList);
                result.put('success', true);
    
            } catch (Exception e) {
                result.put('success', false);
                result.put('errorMessage', e.getMessage());
            }
    
            sendResponse(res, result);
        }
    
        // Parent Wrapper
        global class JournalWrapper {
            public Id journalId;
            public String description;
            public String careNotes;
            public String createdDate;
            public String createdByName;
            public String createdByPhoto;
            public string createdById;
    
            public String staffName;
            public String staffLastName;
            public String staffPicture;
            public string StaffFullName;
            public List<AttachmentWrapper> attachments;
            public List<ChildJournalWrapper> childJournals;
        }
    
        // Child Wrapper (NO Id)
        global class ChildJournalWrapper {
            public String description;
            public String careNotes;
            public String createdDate;
            public String createdByName;
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
        // Response helper
        global static void sendResponse(RestResponse res, Map<String, Object> result) {
            res.responseBody = Blob.valueOf(JSON.serialize(result));
            res.statusCode = 200;
        }
   /*  @HttpPost
    global static string createClientJournel(String participantId,String journelId,String description, String typeOfnotes,String correctionReason,String shiftId, String uploadedFiles){
       // correctionReason='';
        
        ParticipantDetailsHandler.JournalResponse response =
        ParticipantDetailsHandler.saveDesc(
        participantId,
        journelId,
        description,
        typeOfnotes,
        correctionReason,
        shiftId
        );

        return response.message;
		       
        
    } */
    @HttpPost
    global static String createClientJournel(
        String participantId,
        String journelId,
        String description,
        String typeOfnotes,
        String correctionReason,
        String shiftId,
        String uploadedFiles
    ){
        //correctionReason = '';

        ParticipantDetailsHandler.JournalResponse response =
            ParticipantDetailsHandler.saveDesc(
                participantId,
                journelId,
                description,
                typeOfnotes,
                correctionReason,
                shiftId
            );

        if (
            response.journalId != null &&
            !String.isBlank(uploadedFiles)
        ) {
            ParticipantDetailsHandler.saveJournalAttachments(
                response.journalId,
                uploadedFiles
            );
        }

        return response.message;
    }
    


    
}