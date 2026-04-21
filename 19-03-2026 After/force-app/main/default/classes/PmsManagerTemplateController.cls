public class PmsManagerTemplateController {
    
    

    @AuraEnabled
    public static List<TemplateWrapper> getTemplatesByManager(Id managerId) {

        if (managerId == null) {
            throw new AuraHandledException('Manager Id is required');
        }
        
         List<Staff__c> managerList = [
            SELECT Display_Nickname__c
            FROM Staff__c
            WHERE Id = :managerId
        ];
        
        String managerName = '';
        
        if(!managerList.isEmpty()){
            managerName = managerList[0].Display_Nickname__c;
        }

        // ==============================
        // 1️⃣ Query Staff Templates
        // ==============================

        List<PMS_Staff_Template__c> staffTemplates = [
            SELECT Id,
                   PMS_Role_Template__c,
                   PMS_Role_Template__r.Role_Title__c,
                   PMS_Role_Template__r.Template_Description__c,
                   Staff__c,
                   Staff__r.Display_Nickname__c,Staff__r.Email_Address__c,Staff__r.Id, 
                   Effective_Date__c,
                   Status__c,Staff_Submitted_Date__c,Manager_Comments__c,

                   (SELECT Id, PMS_KPI__c,
                           Staff_Comments__c, Staff_Rating__c,Manager_Comments__c,Manager_Rating__c
                    FROM Staff_Kpi_Responses__r),

                   (SELECT Id, PMS_OKR__c,
                           Staff_Comments__c, Staff_Rating__c,Manager_Rating__c,Manager_Comments__c
                    FROM Staff_Okr_Responses__r),

                   (SELECT Id, PMS_Competency__c,
                           Staff_Comments__c, Staff_Rating__c,Manager_Rating__c,Manager_Comments__c
                    FROM Staff_Competency_Responses__r)

            FROM PMS_Staff_Template__c
            WHERE Staff__r.Manager__c = :managerId
           
        ];

        if (staffTemplates.isEmpty()) {
            return new List<TemplateWrapper>();
        }

        // ==============================
        // 2️⃣ Collect Template Ids
        // ==============================

        Set<Id> templateIds = new Set<Id>();
        for (PMS_Staff_Template__c st : staffTemplates) {
            templateIds.add(st.PMS_Role_Template__c);
        }

        // ==============================
        // 3️⃣ Query Role Templates
        // ==============================

        Map<Id, PMS_Role_Template__c> templateMap =
            new Map<Id, PMS_Role_Template__c>([
                SELECT Id,
                       Role_Title__c,
                       Template_Description__c,PMS_Review_Cycle__r.Name,PMS_Review_Cycle__r.Manager_Start_Date__c,PMS_Review_Cycle__r.Manager_End_Date__c,PMS_Review_Cycle__r.Manager_Lock_Date__c,

                       (SELECT Id, KPI_Target__c, KPI_Unit__c,Name,
                               KPI_Weight__c, KPI_Description__c, Category__c
                        FROM PMS_KPIs__r),

                       (SELECT Id, Name, OKR_Objective__c,
                               OKR_Description__c, OKR_Weight__c
                        FROM PMS_OKRs__r),

                       (SELECT Id, Name, Competency_Category__c,
                               Competency_Description__c, Competency_Weight__c
                        FROM PMS_Competencies__r)

                FROM PMS_Role_Template__c
                WHERE Id IN :templateIds
            ]);

        // ==============================
        // 4️⃣ Build Wrapper Response
        // ==============================

        List<TemplateWrapper> response = new List<TemplateWrapper>();

        for (PMS_Staff_Template__c st : staffTemplates) {

            PMS_Role_Template__c temp =
                templateMap.get(st.PMS_Role_Template__c);

            if (temp == null) continue;

            TemplateWrapper wrap = new TemplateWrapper();

            wrap.templateId = temp.Id;
            wrap.stafftemplateId = st.Id;
            wrap.roleTitle = temp.Role_Title__c;
            wrap.description = temp.Template_Description__c;
            wrap.ReviewcycleName = temp.PMS_Review_Cycle__r.Name;
            wrap.staffName = st.Staff__r.Display_Nickname__c ;
            wrap.effectiveDate = st.Effective_Date__c;
            wrap.Status = st.Status__c;
            wrap.Email = st.Staff__r.Email_Address__c;
            wrap.StaffId=st.Staff__r.Id;
            wrap.staffSubmittedDate=st.Staff_Submitted_Date__c;
            wrap.ManagerComments=st.Manager_Comments__c;
            wrap.managerName = managerName;
            Date today = Date.today();
            Date ManagerStart = temp.PMS_Review_Cycle__r.Manager_Start_Date__c;
            Date ManagerEnd = temp.PMS_Review_Cycle__r.Manager_End_Date__c;
    
            Boolean isBetweenHRDates = false;
    
            if(ManagerStart != null && ManagerEnd != null){
                isBetweenHRDates = (today >= ManagerStart && today <= ManagerEnd);
            }
    
           if(isBetweenHRDates || st.Status__c == 'Submitted to HR'){
                wrap.isEditable = true;
            } else {
                wrap.isEditable = false;
            }

            wrap.kpis = temp.PMS_KPIs__r;
            wrap.okrs = temp.PMS_OKRs__r;
            wrap.competencies = temp.PMS_Competencies__r;

            // Initialize Maps
            wrap.kpiRatings = new Map<Id,String>();
            wrap.kpiComments = new Map<Id,String>();
            wrap.okrRatings = new Map<Id,String>();
            wrap.okrComments = new Map<Id,String>();
            wrap.competencyRatings = new Map<Id,String>();
            wrap.competencyComments = new Map<Id,String>();
            wrap.managerKpiRatings = new Map<Id,String>();
            wrap.managerKpiComments = new Map<Id,String>();
            wrap.managerOkrRatings = new Map<Id,String>();
            wrap.managerOkrComments = new Map<Id,String>();
            wrap.managerCompetencyRatings = new Map<Id,String>();
            wrap.managerCompetencyComments = new Map<Id,String>();

            // KPI Responses
            for (Staff_Kpi_Response__c r : st.Staff_Kpi_Responses__r) {
                wrap.kpiRatings.put(r.PMS_KPI__c, r.Staff_Rating__c);
                wrap.kpiComments.put(r.PMS_KPI__c, r.Staff_Comments__c);
                wrap.managerKpiRatings.put(r.PMS_KPI__c, r.Manager_Rating__c);
                wrap.managerKpiComments.put(r.PMS_KPI__c, r.Manager_Comments__c);
            }

            // OKR Responses
            for (Staff_Okr_Response__c r : st.Staff_Okr_Responses__r) {
                wrap.okrRatings.put(r.PMS_OKR__c, r.Staff_Rating__c);
                wrap.okrComments.put(r.PMS_OKR__c, r.Staff_Comments__c);
                wrap.managerOkrRatings.put(r.PMS_OKR__c, r.Manager_Rating__c);
                wrap.managerOkrComments.put(r.PMS_OKR__c, r.Manager_Comments__c);
               
            }

            // Competency Responses
            for (Staff_Competency_Response__c r : st.Staff_Competency_Responses__r) {
                wrap.competencyRatings.put(r.PMS_Competency__c, r.Staff_Rating__c);
                wrap.competencyComments.put(r.PMS_Competency__c, r.Staff_Comments__c);
                wrap.managerCompetencyRatings.put(r.PMS_Competency__c, r.Manager_Rating__c);
                wrap.managerCompetencyComments.put(r.PMS_Competency__c, r.Manager_Comments__c);
            }

            response.add(wrap);
        }

        return response;
    }

    // =========================================
    // Wrapper Class
    // =========================================

    public class TemplateWrapper {

        @AuraEnabled public Id templateId;
        @AuraEnabled public Id StaffId;
        @AuraEnabled public Id stafftemplateId;
        @AuraEnabled public String roleTitle;
        @AuraEnabled public String description;
        @AuraEnabled public String staffName;
        @AuraEnabled public Date effectiveDate;
        @AuraEnabled public String Status;
        @AuraEnabled public String ReviewcycleName;
        @AuraEnabled public String Email;
        @AuraEnabled public String managerName;
        @AuraEnabled public Date staffSubmittedDate; 
        @AuraEnabled public Boolean isEditable;
        @AuraEnabled Public String ManagerComments;

        @AuraEnabled public List<PMS_KPI__c> kpis;
        @AuraEnabled public List<PMS_OKR__c> okrs;
        @AuraEnabled public List<PMS_Competency__c> competencies;

        @AuraEnabled public Map<Id,String> kpiRatings;
        @AuraEnabled public Map<Id,String> kpiComments;

        @AuraEnabled public Map<Id,String> okrRatings;
        @AuraEnabled public Map<Id,String> okrComments;

        @AuraEnabled public Map<Id,String> competencyRatings;
        @AuraEnabled public Map<Id,String> competencyComments;
        
        // ⭐ Manager fields
        @AuraEnabled public Map<Id,String> managerKpiRatings;
        @AuraEnabled public Map<Id,String> managerKpiComments;
    
        @AuraEnabled public Map<Id,String> managerOkrRatings;
        @AuraEnabled public Map<Id,String> managerOkrComments;
    
        @AuraEnabled public Map<Id,String> managerCompetencyRatings;
        @AuraEnabled public Map<Id,String> managerCompetencyComments;
    }
    
    public class ItemWrapper {
        @AuraEnabled public Id Id;
        @AuraEnabled public String ManagerRating;
        @AuraEnabled public String ManagerComment;
    }
     public class ReviewRequest {
        @AuraEnabled public Id staffTemplateId;
        @AuraEnabled public String managerComments;
        @AuraEnabled public List<ItemWrapper> kpis;
        @AuraEnabled public List<ItemWrapper> okrs;
        @AuraEnabled public List<ItemWrapper> competencies;
    }
    
     @AuraEnabled
    public static void SubmitManagerResponse(String requestJson, Boolean isSubmit){
         ReviewRequest request =
                (ReviewRequest) JSON.deserialize(requestJson, ReviewRequest.class);

            System.debug('Deserialized Request: ' + JSON.serialize(request));
            System.debug('isSubmit: ' + isSubmit);
        if(request == null || request.staffTemplateId == null){
            throw new AuraHandledException('Invalid Request');
        }

        // 🔹 Optional: Validate parent exists
        PMS_Staff_Template__c parent =
            [SELECT Id, PMS_Role_Template__c, Staff__c,Manager_Comments__c 
             FROM PMS_Staff_Template__c
             WHERE Id = :request.staffTemplateId
             LIMIT 1];

        // -------------------------------------
        // 1️⃣ Load Existing Records
        // -------------------------------------

        Map<Id, Staff_Kpi_Response__c> existingKpis = new Map<Id, Staff_Kpi_Response__c>();
        Map<Id, Staff_Okr_Response__c> existingOkrs = new Map<Id, Staff_Okr_Response__c>();
        Map<Id, Staff_Competency_Response__c> existingComps = new Map<Id, Staff_Competency_Response__c>();

        for(Staff_Kpi_Response__c rec :
            [SELECT Id, PMS_KPI__c
             FROM Staff_Kpi_Response__c
             WHERE PMS_Staff_Template__c = :request.staffTemplateId]) {

            existingKpis.put(rec.PMS_KPI__c, rec);
        }

        for(Staff_Okr_Response__c rec :
            [SELECT Id, PMS_OKR__c
             FROM Staff_Okr_Response__c
             WHERE PMS_Staff_Template__c = :request.staffTemplateId]) {

            existingOkrs.put(rec.PMS_OKR__c, rec);
        }

        for(Staff_Competency_Response__c rec :
            [SELECT Id, PMS_Competency__c
             FROM Staff_Competency_Response__c
             WHERE PMS_Staff_Template__c = :request.staffTemplateId]) {

            existingComps.put(rec.PMS_Competency__c, rec);
        }

        // -------------------------------------
        // 2️⃣ Prepare Lists
        // -------------------------------------

        List<Staff_Kpi_Response__c> kpiRecords = new List<Staff_Kpi_Response__c>();
        List<Staff_Okr_Response__c> okrRecords = new List<Staff_Okr_Response__c>();
        List<Staff_Competency_Response__c> compRecords = new List<Staff_Competency_Response__c>();

        // -------------------------------------
        // 3️⃣ Process KPI
        // -------------------------------------

        if(request.kpis != null){
            for(ItemWrapper item : request.kpis){

                if(isSubmit && (String.isBlank(item.ManagerRating) || String.isBlank(item.ManagerComment))){
                    throw new AuraHandledException('All KPI fields are mandatory.');
                }

                Staff_Kpi_Response__c rec =
                    existingKpis.containsKey(item.Id)
                    ? existingKpis.get(item.Id)
                    : new Staff_Kpi_Response__c(
                        PMS_Staff_Template__c = request.staffTemplateId,
                        PMS_KPI__c = item.Id
                    );

                rec.Manager_Rating__c = item.ManagerRating;
                rec.Manager_Comments__c = item.ManagerComment;

                kpiRecords.add(rec);
            }
        }

        // -------------------------------------
        // 4️⃣ Process OKR
        // -------------------------------------

        if(request.okrs != null){
            for(ItemWrapper item : request.okrs){

                if(isSubmit && (String.isBlank(item.ManagerRating) || String.isBlank(item.ManagerComment))){
                    throw new AuraHandledException('All OKR fields are mandatory.');
                }

                Staff_Okr_Response__c rec =
                    existingOkrs.containsKey(item.Id)
                    ? existingOkrs.get(item.Id)
                    : new Staff_Okr_Response__c(
                        PMS_Staff_Template__c = request.staffTemplateId,
                        PMS_OKR__c = item.Id
                    );

                rec.Manager_Rating__c = item.ManagerRating;
                rec.Manager_Comments__c = item.ManagerComment;

                okrRecords.add(rec);
            }
        }

        // -------------------------------------
        // 5️⃣ Process Competency
        // -------------------------------------

        if(request.competencies != null){
            for(ItemWrapper item : request.competencies){

                if(isSubmit && (String.isBlank(item.ManagerRating) || String.isBlank(item.ManagerComment))){
                    throw new AuraHandledException('All Competency fields are mandatory.');
                }

                Staff_Competency_Response__c rec =
                    existingComps.containsKey(item.Id)
                    ? existingComps.get(item.Id)
                    : new Staff_Competency_Response__c(
                        PMS_Staff_Template__c = request.staffTemplateId,
                        PMS_Competency__c = item.Id
                    );

                rec.Manager_Rating__c = item.ManagerRating;
                rec.Manager_Comments__c = item.ManagerComment;

                compRecords.add(rec);
            }
        }

        // -------------------------------------
        // 6️⃣ DML
        // -------------------------------------

        if(!kpiRecords.isEmpty()) upsert kpiRecords;
        if(!okrRecords.isEmpty()) upsert okrRecords;
        if(!compRecords.isEmpty()) upsert compRecords;

        // -------------------------------------
        // 7️⃣ Submit → Update Status
        // -------------------------------------

        if(isSubmit){
            parent.Status__c = 'Submitted to HR';
            parent.Manager_Comments__c = request.managerComments;
            update parent;
        }
    }
    
    @AuraEnabled
        public static void ReassignToStaff(Id staffTemplateId) {
        
            if (staffTemplateId == null) {
                throw new AuraHandledException('Staff Template Id is required');
            }
        
            PMS_Staff_Template__c templateRecord = new PMS_Staff_Template__c();
            templateRecord.Id = staffTemplateId;
            templateRecord.Status__c = 'Assigned to Staff';
            update templateRecord;
        }


}