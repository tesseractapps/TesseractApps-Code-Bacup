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
                                ORDER BY CreatedDate DESC)
                        FROM Client_Journel__c
                        WHERE Client__c = :recordIdParam
                        AND (Is_Locked__c = true OR Is_Locked__c = false)
                        AND Original_Client_Journel__c = null
                        ORDER BY CreatedDate DESC
                    ];
    
                    // Convert to wrapper
                    for (Client_Journel__c journal : clientJournalList) {
                        JournalWrapper jw = new JournalWrapper();
    
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

    
                            jw.childJournals.add(cj);
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
        }
    
        // Response helper
        global static void sendResponse(RestResponse res, Map<String, Object> result) {
            res.responseBody = Blob.valueOf(JSON.serialize(result));
            res.statusCode = 200;
        }
    @HttpPost
    global static string createClientJournel(String participantId,String journelId,String description, String typeOfnotes,String correctionReason,String shiftId){
       // correctionReason='';
        
		string clientNotes =ParticipantDetailsHandler.saveDesc(participantId, journelId, description, typeOfnotes,correctionReason,shiftId);
		return clientNotes ;       
        
    }
    
}