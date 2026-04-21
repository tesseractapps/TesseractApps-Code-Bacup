@RestResource(urlMapping='/ParticipantJournelValidation/*')
global with sharing class MobileAppParticipantJournalValidation {

    @HttpGet
    global static void getShiftWiseJournals() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        Map<String, Object> result = new Map<String, Object>();

        try {

          String shiftId = req.params.get('shiftId');
            String clientId = req.params.get('clientId');

            // Validate mandatory param
            if (String.isBlank(shiftId)) {
                throw new AuraHandledException('shiftId is required');
            }

            // Base query
            String query = 'SELECT Id, Description__c, CreatedDate, LastModifiedDate, ' +
                        'CreatedBy.Name, CreatedBy.SmallPhotoUrl, ' +
                        'Care_Notes__c,Reason__c, ' +
                        'staff__r.Name, staff__r.Last_Name__c, staff__r.picture__c ' +
                        'FROM Client_Journel__c WHERE ShiftwithStaff__c = :shiftId AND Original_Client_Journel__c =NULL ';

            // Add optional filter
            if (String.isNotBlank(clientId)) {
                query += ' AND Client__c = :clientId';
            }

            // Order clause
            query += ' ORDER BY CreatedDate DESC';

            // Execute
            List<Client_Journel__c> clientJournals = Database.query(query);

            // Step 1: Collect all record IDs
            Set<Id> allIds = new Set<Id>();
            for (Client_Journel__c rec : clientJournals) {
                allIds.add(rec.Id);
            }
            
            // Step 2: Query children of these records
            List<Client_Journel__c> childJournals = [
                SELECT Id, Description__c, CreatedDate, LastModifiedDate,
                       CreatedBy.Name, CreatedBy.SmallPhotoUrl,
                       Care_Notes__c,Reason__c,
                       staff__r.Name, staff__r.Last_Name__c, staff__r.picture__c,
                       Original_Client_Journel__c
                FROM Client_Journel__c
                WHERE Original_Client_Journel__c IN :allIds
                ORDER BY CreatedDate DESC
            ];
            
            // Step 3: Map Parent → Latest Child
            Map<Id, Client_Journel__c> parentToLatestChild = new Map<Id, Client_Journel__c>();
            
            for (Client_Journel__c child : childJournals) {
                if (!parentToLatestChild.containsKey(child.Original_Client_Journel__c)) {
                    parentToLatestChild.put(child.Original_Client_Journel__c, child);
                }
            }
            
            // Step 4: Prepare final list (avoid duplicates)
            Set<Id> childIds = new Set<Id>();
            for (Client_Journel__c child : childJournals) {
                childIds.add(child.Id);
            }
            
            List<JournalWrapper> wrapperList = new List<JournalWrapper>();
            
            for (Client_Journel__c rec : clientJournals) {
            
                // Skip child records (we only want parent OR latest child)
                if (childIds.contains(rec.Id)) {
                    continue;
                }
            
                Client_Journel__c recordToUse;
            
                // If latest child exists → use it
                if (parentToLatestChild.containsKey(rec.Id)) {
                    recordToUse = parentToLatestChild.get(rec.Id);
                } else {
                    recordToUse = rec;
                }
            
              //  wrapperList.add(new JournalWrapper(recordToUse));
              wrapperList.add(
                new JournalWrapper(
                    recordToUse,
                    parentToLatestChild.containsKey(rec.Id) ? rec.Id : recordToUse.Id
                )
            );
            }
            result.put('journals', wrapperList);
            result.put('success', true);

        } catch (Exception e) {
            result.put('success', false);
            result.put('errorMessage', e.getMessage());
        }

        sendResponse(res, result);
    }

    private static void sendResponse(RestResponse res, Object payload) {
        res.statusCode = 200;
        res.responseBody = Blob.valueOf(JSON.serialize(payload));
    }

        // Wrapper class
        global class JournalWrapper {
        public Id id;
        public String description;
        public Datetime createdDate;
        public Datetime lastModifiedDate;
        public String createdByName;
        public String createdByPhoto;
        public String careNotes;
        public String staffName;
        public String staffLastName;
        public String staffPicture;
    
        public JournalWrapper(Client_Journel__c rec, Id overrideId) {
            this.id = overrideId; // 👈 KEY CHANGE
            this.description = rec.Description__c;
            this.createdDate = rec.CreatedDate;
            this.lastModifiedDate = rec.LastModifiedDate;
            this.createdByName = rec.CreatedBy.Name;
            this.createdByPhoto = rec.CreatedBy.SmallPhotoUrl;
            this.careNotes = rec.Care_Notes__c;
    
            if (rec.staff__r != null) {
                this.staffName = rec.staff__r.Name;
                this.staffLastName = rec.staff__r.Last_Name__c;
                this.staffPicture = rec.staff__r.picture__c;
            }
        }
    }
    
}