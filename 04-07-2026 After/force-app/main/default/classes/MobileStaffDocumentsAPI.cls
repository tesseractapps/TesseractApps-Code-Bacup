@RestResource(urlMapping='/staffDocuments/*')
global with sharing class MobileStaffDocumentsAPI {

    /* =========================================================
     * DOCUMENT WRAPPER
     * ========================================================= */
    global class DocumentWrapper {
        public Id id;
        public String staffName;
        public String createdByName;
        public String documentType;
        public String status;
        public Date expiryDate;
        public String rejectedComments;
        public String docURL;

        public DocumentWrapper(Child_Staff__c doc) {
            id = doc.Id;
            staffName = doc.Staff__r.NameToDisplay__c;
            createdByName = doc.CreatedBy.Name;
            documentType = doc.Document_Type__c;
            status = doc.Status__c;
            expiryDate = doc.Expiry_Date__c;
            rejectedComments = doc.Rejected_Comments__c;
            docURL = doc.View_File__c;
        }
    }

    /* =========================================================
     * GROUP WRAPPER
     * ========================================================= */
    global class DocumentGroupWrapper {
        public String groupName;
        public List<DocumentWrapper> documents;

        public DocumentGroupWrapper(String name){
            groupName = name;
            documents = new List<DocumentWrapper>();
        }
    }

    /* =========================================================
     * STATUS COUNT WRAPPER
     * ========================================================= */
    global class StatusCountWrapper {
        public Integer approved = 0;
        public Integer pendingApproval = 0;
        public Integer expiringSoon = 0;
        public Integer expired = 0;
        public Integer rejected = 0;
    }

    /* =========================================================
     * FINAL RESPONSE WRAPPER
     * ========================================================= */
    global class ResponseWrapper {
        public Integer totalDocuments;
        public StatusCountWrapper statusCounts;
        public List<DocumentGroupWrapper> documentsByType;
        public List<DocumentGroupWrapper> documentsByStatus;
        public List<DocumentGroupWrapper> documentsByExpiry; // kept to avoid breaking structure
    }

    /* =========================================================
     * API METHOD
     * ========================================================= */
    @HttpGet
    global static void getStaffDocuments() {

        RestResponse res = RestContext.response;

        try {

            String userEmail = UserInfo.getUserEmail();

            List<Child_Staff__c> documents = [
                SELECT Id,
                       Expiry_Date__c,
                       Document_Type__c,
                       Status__c,
                       Rejected_Comments__c,
                       View_File__c,
                       CreatedBy.Name,
                       Staff__r.Email_Address__c,
                       Staff__r.NameToDisplay__c
                FROM Child_Staff__c
                WHERE Staff__r.Email_Address__c = :userEmail
            ];

			List<Child_Staff__c> sharedDocuments = [
                SELECT Id,
                       Expiry_Date__c,
                       Document_Type__c,
                       Status__c,
                       Rejected_Comments__c,
                       View_File__c,
                       CreatedBy.Name,
                       Staff__r.NameToDisplay__c
                FROM Child_Staff__c
                WHERE Id IN (
                    SELECT Child_Staff__c
                    FROM StaffDocsShare__c
                    WHERE Staff__r.Email_Address__c = :userEmail
                )
            ];
            
            Set<Id> existingDocIds = new Set<Id>();
                for (Child_Staff__c doc : documents) {
                    existingDocIds.add(doc.Id);
                }
                
                // Add only new shared documents
                for (Child_Staff__c sharedDoc : sharedDocuments) {
                    if (!existingDocIds.contains(sharedDoc.Id)) {
                        documents.add(sharedDoc);
                        existingDocIds.add(sharedDoc.Id); // keep set updated
                    }
                }

            Date todayDate = Date.today();
            Date expiringSoonDate = todayDate.addDays(30);

            Map<String,DocumentGroupWrapper> typeMap = new Map<String,DocumentGroupWrapper>();
            Map<String,DocumentGroupWrapper> statusMap = new Map<String,DocumentGroupWrapper>();

            StatusCountWrapper statusCounts = new StatusCountWrapper();

            /* ================= GROUPING LOOP ================= */
            for(Child_Staff__c doc : documents){

                DocumentWrapper docWrap = new DocumentWrapper(doc);

                /* ---------- GROUP BY TYPE ---------- */
                String typeKey = String.isBlank(doc.Document_Type__c)
                    ? 'Unknown'
                    : doc.Document_Type__c;

                if(!typeMap.containsKey(typeKey)){
                    typeMap.put(typeKey,new DocumentGroupWrapper(typeKey));
                }
                typeMap.get(typeKey).documents.add(docWrap);


                /* ---------- GROUP BY STATUS ---------- */
                String statusKey = String.isBlank(doc.Status__c)
                    ? 'Unknown'
                    : doc.Status__c;

                if(!statusMap.containsKey(statusKey)){
                    statusMap.put(statusKey,new DocumentGroupWrapper(statusKey));
                }
                statusMap.get(statusKey).documents.add(docWrap);

                /* ---------- STATUS COUNTS ---------- */
                if(statusKey == 'Approved'){
                    statusCounts.approved++;
                }
                else if(statusKey == 'Pending'){
                    statusCounts.pendingApproval++;
                }
                else if(statusKey == 'Rejected'){
                    statusCounts.rejected++;
                }

                /* =====================================================
                   🔥 EXPIRY NOW MERGED INTO documentsByStatus
                ===================================================== */

                String expiryKey;

                if(doc.Expiry_Date__c == null){
                    expiryKey = 'No Expiry';
                }
                else if(doc.Expiry_Date__c < todayDate){
                    expiryKey = 'Expired';
                    statusCounts.expired++;
                }
                else if(doc.Expiry_Date__c <= expiringSoonDate){
                    expiryKey = 'Expiring Soon';
                    statusCounts.expiringSoon++;
                }
               
                // Add expiry grouping INSIDE statusMap
                if(!statusMap.containsKey(expiryKey)){
                    statusMap.put(expiryKey,new DocumentGroupWrapper(expiryKey));
                }
                statusMap.get(expiryKey).documents.add(docWrap);
            }

            /* ================= RESPONSE ================= */
            ResponseWrapper response = new ResponseWrapper();
            response.totalDocuments = documents.size();
            response.statusCounts = statusCounts;
            response.documentsByType = typeMap.values();
            response.documentsByStatus = statusMap.values();
            response.documentsByExpiry = new List<DocumentGroupWrapper>(); // empty (kept for compatibility)

            sendResponse(res,response);

        } catch(Exception e){

            Map<String,Object> error = new Map<String,Object>();
            error.put('errorMessage', e.getMessage());
            sendResponse(res,error);
        }
    }

    /* =========================================================
     * COMMON RESPONSE HANDLER
     * ========================================================= */
    private static void sendResponse(RestResponse res, Object payload){
        res.statusCode = 200;
        res.responseBody = Blob.valueOf(JSON.serialize(payload));
    }
}