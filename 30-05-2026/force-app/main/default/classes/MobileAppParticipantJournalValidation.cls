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

            String query = 'SELECT Id, Description__c, CreatedDate, LastModifiedDate, ' +
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
            
            query += 'ORDER BY CreatedDate DESC';

		List<Client_Journel__c> clientJournals = Database.query(query);
            List<JournalWrapper> wrapperList = new List<JournalWrapper>();

            for (Client_Journel__c rec : clientJournals) {

                JournalWrapper jw = new JournalWrapper();

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

                        jw.childJournals.add(cj);
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