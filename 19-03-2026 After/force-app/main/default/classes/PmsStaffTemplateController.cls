public with sharing class PmsStaffTemplateController {
    /* @AuraEnabled
    public static List<PMS_Role_Template__c> getTemplatesByStaff(Id staffId) {

        if (staffId == null) {
            throw new AuraHandledException('Staff Id is required');
        }

        return [
           SELECT Id,  Template_Description__c, Role_Title__c,
                        (SELECT Id, KPI_Target__c, KPI_Unit__c, KPI_Weight__c, KPI_Description__c, Category__c FROM PMS_KPIs__r),
                         (SELECT Id, Name, OKR_Objective__c, OKR_Description__c, OKR_Weight__c FROM PMS_OKRs__r),
          (SELECT Id, Name, Competency_Category__c, Competency_Description__c, Competency_Weight__c FROM PMS_Competencies__r),
            (SELECT PMS_Role_Template__c,Staff__r.Name,Staff__r.Manager__c FROM PMS_Staff_Templates__r)
           
        FROM  PMS_Role_Template__c
        WHERE Id IN (
            SELECT  PMS_Role_Template__c FROM PMS_Staff_Template__c
            WHERE Staff__c = :staffId
        )
        ];
    }*/
    
      public class TemplateWrapper {
        @AuraEnabled public Id templateId;
        @AuraEnabled public String roleTitle;
        @AuraEnabled public String description;
        @AuraEnabled public String staffName;
        @AuraEnabled public String managerName;
        @AuraEnabled public String ReviewcycleName;
        @AuraEnabled public String Status;
        @AuraEnabled public Date effectiveDate;
        @AuraEnabled public Id stafftemplateId;
        @AuraEnabled public List<PMS_KPI__c> kpis;
        @AuraEnabled public List<PMS_OKR__c> okrs;
        @AuraEnabled public List<PMS_Competency__c> competencies;
          
          // 🔹 Staff response maps (SAFE APPROACH)
        @AuraEnabled public Map<Id,String> kpiRatings;
        @AuraEnabled public Map<Id,String> kpiComments;

        @AuraEnabled public Map<Id,String> okrRatings;
        @AuraEnabled public Map<Id,String> okrComments;

        @AuraEnabled public Map<Id,String> competencyRatings;
        @AuraEnabled public Map<Id,String> competencyComments;
    }
    
       // =============================
    // WRAPPERS
    // =============================
    public class ReviewRequest {
        @AuraEnabled public Id staffTemplateId;
        @AuraEnabled public List<ItemWrapper> kpis;
        @AuraEnabled public List<ItemWrapper> okrs;
        @AuraEnabled public List<ItemWrapper> competencies;
    }

    public class ItemWrapper {
        @AuraEnabled public Id Id;
        @AuraEnabled public String staffRating;
        @AuraEnabled public String staffComment;
    }

    @AuraEnabled
    public static List<TemplateWrapper> getTemplatesByStaff(Id staffId) {

        if (staffId == null) {
            throw new AuraHandledException('Staff Id is required');
        }

        // 1️⃣ Get templates assigned to this staff
        List<PMS_Role_Template__c> templates = [
            SELECT Id, Template_Description__c, Role_Title__c,PMS_Review_Cycle__r.Name,
                (SELECT Id, Name, KPI_Target__c, KPI_Unit__c, KPI_Weight__c,
                        KPI_Description__c, Category__c
                 FROM PMS_KPIs__r),

                (SELECT Id, Name, OKR_Objective__c,Key_Target__c, 
                        OKR_Description__c, OKR_Weight__c
                 FROM PMS_OKRs__r),

                (SELECT Id, Name, Competency_Category__c,
                        Competency_Description__c, Competency_Weight__c
                 FROM PMS_Competencies__r),

                (SELECT Id, Staff__c, Staff__r.Name, Staff__r.Manager__c,Effective_Date__c, Status__c, (SELECT Id, PMS_Staff_Template__c, PMS_KPI__c, Staff_Comments__c, Staff_Rating__c FROM Staff_Kpi_Responses__r), 
                 (SELECT Id, PMS_Staff_Template__c, PMS_OKR__c, Staff_Comments__c, Staff_Rating__c FROM Staff_Okr_Responses__r), 
                 (SELECT Id, PMS_Competency__c, PMS_Staff_Template__c, Staff_Comments__c, Staff_Rating__c FROM Staff_Competency_Responses__r)
                 FROM PMS_Staff_Templates__r
                 WHERE Staff__c = :staffId)

            FROM PMS_Role_Template__c
            WHERE Id IN (
                SELECT PMS_Role_Template__c
                FROM PMS_Staff_Template__c
                WHERE Staff__c = :staffId AND Is_Reviewcycle_Created__c=true
            )
        ];

        // 2️⃣ Collect Manager Ids
        Set<Id> managerIds = new Set<Id>();

        for (PMS_Role_Template__c temp : templates) {
            for (PMS_Staff_Template__c st : temp.PMS_Staff_Templates__r) {
                if (st.Staff__r.Manager__c != null) {
                    managerIds.add((Id)st.Staff__r.Manager__c);
                }
            }
        }

        // 3️⃣ Query manager names
        Map<Id, Staff__c> managerMap = new Map<Id, Staff__c>();

        if (!managerIds.isEmpty()) {
            managerMap = new Map<Id, Staff__c>(
                [SELECT Id, Name FROM Staff__c WHERE Id IN :managerIds]
            );
        }

        // 4️⃣ Build response (one wrapper per template)
        List<TemplateWrapper> response = new List<TemplateWrapper>();

        for (PMS_Role_Template__c temp : templates) {

            TemplateWrapper wrap = new TemplateWrapper();

            wrap.templateId = temp.Id;
            wrap.roleTitle = temp.Role_Title__c;
            wrap.description = temp.Template_Description__c;
            wrap.ReviewcycleName = temp.PMS_Review_Cycle__r.Name;
            wrap.kpis = temp.PMS_KPIs__r;
            wrap.okrs = temp.PMS_OKRs__r;
            wrap.competencies = temp.PMS_Competencies__r;

            // Since query filtered by staffId,
            // there will be only one matching Staff_Template per template
            if (!temp.PMS_Staff_Templates__r.isEmpty()) {

                PMS_Staff_Template__c st = temp.PMS_Staff_Templates__r[0];
                 wrap.stafftemplateId = st.Id;
                wrap.staffName = st.Staff__r.Name;
                wrap.effectiveDate = st.Effective_Date__c;
                wrap.Status=st.Status__c;

                if (st.Staff__r.Manager__c != null &&
                    managerMap.containsKey((Id)st.Staff__r.Manager__c)) {

                    wrap.managerName =
                        managerMap.get((Id)st.Staff__r.Manager__c).Name;
                }
                  
                
            

           // Initialize Maps
            wrap.kpiRatings = new Map<Id,String>();
            wrap.kpiComments = new Map<Id,String>();
            wrap.okrRatings = new Map<Id,String>();
            wrap.okrComments = new Map<Id,String>();
            wrap.competencyRatings = new Map<Id,String>();
            wrap.competencyComments = new Map<Id,String>();

            // ================= KPI RESPONSES =================
            for (Staff_Kpi_Response__c r : st.Staff_Kpi_Responses__r) {
                wrap.kpiRatings.put(r.PMS_KPI__c, r.Staff_Rating__c);
                wrap.kpiComments.put(r.PMS_KPI__c, r.Staff_Comments__c);
            }

            // ================= OKR RESPONSES =================
            for (Staff_Okr_Response__c r : st.Staff_Okr_Responses__r) {
                wrap.okrRatings.put(r.PMS_OKR__c, r.Staff_Rating__c);
                wrap.okrComments.put(r.PMS_OKR__c, r.Staff_Comments__c);
            }

            // ================= COMPETENCY RESPONSES =================
            for (Staff_Competency_Response__c r : st.Staff_Competency_Responses__r) {
                wrap.competencyRatings.put(r.PMS_Competency__c, r.Staff_Rating__c);
                wrap.competencyComments.put(r.PMS_Competency__c, r.Staff_Comments__c);
            }
           

                
            }

            response.add(wrap);
        }

        return response;
    }
    
    
   

    // =============================
    // SINGLE METHOD (SAVE / SUBMIT)
    // =============================
    @AuraEnabled
    public static void saveOrSubmitStaffResponse(String requestJson, Boolean isSubmit){
         ReviewRequest request =
                (ReviewRequest) JSON.deserialize(requestJson, ReviewRequest.class);

            System.debug('Deserialized Request: ' + JSON.serialize(request));
            System.debug('isSubmit: ' + isSubmit);
        if(request == null || request.staffTemplateId == null){
            throw new AuraHandledException('Invalid Request');
        }

        // 🔹 Optional: Validate parent exists
        PMS_Staff_Template__c parent =
            [SELECT Id, PMS_Role_Template__c, Staff__c
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

                if(isSubmit && (String.isBlank(item.staffRating) || String.isBlank(item.staffComment))){
                    throw new AuraHandledException('All KPI fields are mandatory.');
                }

                Staff_Kpi_Response__c rec =
                    existingKpis.containsKey(item.Id)
                    ? existingKpis.get(item.Id)
                    : new Staff_Kpi_Response__c(
                        PMS_Staff_Template__c = request.staffTemplateId,
                        PMS_KPI__c = item.Id
                    );

                rec.Staff_Rating__c = item.staffRating;
                rec.Staff_Comments__c = item.staffComment;

                kpiRecords.add(rec);
            }
        }

        // -------------------------------------
        // 4️⃣ Process OKR
        // -------------------------------------

        if(request.okrs != null){
            for(ItemWrapper item : request.okrs){

                if(isSubmit && (String.isBlank(item.staffRating) || String.isBlank(item.staffComment))){
                    throw new AuraHandledException('All OKR fields are mandatory.');
                }

                Staff_Okr_Response__c rec =
                    existingOkrs.containsKey(item.Id)
                    ? existingOkrs.get(item.Id)
                    : new Staff_Okr_Response__c(
                        PMS_Staff_Template__c = request.staffTemplateId,
                        PMS_OKR__c = item.Id
                    );

                rec.Staff_Rating__c = item.staffRating;
                rec.Staff_Comments__c = item.staffComment;

                okrRecords.add(rec);
            }
        }

        // -------------------------------------
        // 5️⃣ Process Competency
        // -------------------------------------

        if(request.competencies != null){
            for(ItemWrapper item : request.competencies){

                if(isSubmit && (String.isBlank(item.staffRating) || String.isBlank(item.staffComment))){
                    throw new AuraHandledException('All Competency fields are mandatory.');
                }

                Staff_Competency_Response__c rec =
                    existingComps.containsKey(item.Id)
                    ? existingComps.get(item.Id)
                    : new Staff_Competency_Response__c(
                        PMS_Staff_Template__c = request.staffTemplateId,
                        PMS_Competency__c = item.Id
                    );

                rec.Staff_Rating__c = item.staffRating;
                rec.Staff_Comments__c = item.staffComment;

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
            parent.Status__c = 'Submitted to Manager';
            parent.Staff_Submitted_Date__c = Date.today();
            update parent;
        }
    }
    
    
    /*For Manager View*/
    
    @AuraEnabled
public static List<TemplateWrapper> getTemplatesByManager(Id managerId) {

    if (managerId == null) {
        throw new AuraHandledException('Manager Id is required');
    }

    // 1️⃣ Get all staff templates where this manager is assigned
    List<PMS_Staff_Template__c> staffTemplates = [
        SELECT Id,
              /* PMS_Role_Template__c,
               PMS_Role_Template__r.Template_Description__c,
               PMS_Role_Template__r.Role_Title__c,*/

               Staff__c,
               Staff__r.Name,
               Staff__r.Manager__c,
               Effective_Date__c,
               

               /*(SELECT Id, KPI_Target__c, KPI_Unit__c,
                       KPI_Weight__c, KPI_Description__c, Category__c
                FROM PMS_Role_Template__r.PMS_KPIs__r),

               (SELECT Id, Name, OKR_Objective__c,
                       OKR_Description__c, OKR_Weight__c
                FROM PMS_Role_Template__r.PMS_OKRs__r),

               (SELECT Id, Name, Competency_Category__c,
                       Competency_Description__c, Competency_Weight__c
                FROM PMS_Role_Template__r.PMS_Competencies__r),*/

               (SELECT Id, PMS_KPI__c,
                       Staff_Comments__c, Staff_Rating__c
                FROM Staff_Kpi_Responses__r),

               (SELECT Id, PMS_OKR__c,
                       Staff_Comments__c, Staff_Rating__c
                FROM Staff_Okr_Responses__r),

               (SELECT Id, PMS_Competency__c,
                       Staff_Comments__c, Staff_Rating__c
                FROM Staff_Competency_Responses__r)

        FROM PMS_Staff_Template__c
        WHERE Staff__r.Manager__c = :managerId
       /* AND Status__c = 'Submitted' */  // Optional filter
    ];

    List<TemplateWrapper> response = new List<TemplateWrapper>();

    for (PMS_Staff_Template__c st : staffTemplates) {

        TemplateWrapper wrap = new TemplateWrapper();

        wrap.templateId = st.PMS_Role_Template__c;
        wrap.stafftemplateId = st.Id;
        wrap.roleTitle = st.PMS_Role_Template__r.Role_Title__c;
        wrap.description = st.PMS_Role_Template__r.Template_Description__c;

        wrap.staffName = st.Staff__r.Name;
        wrap.effectiveDate = st.Effective_Date__c;

        // Initialize Maps
        wrap.kpiRatings = new Map<Id,String>();
        wrap.kpiComments = new Map<Id,String>();
        wrap.okrRatings = new Map<Id,String>();
        wrap.okrComments = new Map<Id,String>();
        wrap.competencyRatings = new Map<Id,String>();
        wrap.competencyComments = new Map<Id,String>();

        // KPI
        for (Staff_Kpi_Response__c r : st.Staff_Kpi_Responses__r) {
            wrap.kpiRatings.put(r.PMS_KPI__c, r.Staff_Rating__c);
            wrap.kpiComments.put(r.PMS_KPI__c, r.Staff_Comments__c);
        }

        // OKR
        for (Staff_Okr_Response__c r : st.Staff_Okr_Responses__r) {
            wrap.okrRatings.put(r.PMS_OKR__c, r.Staff_Rating__c);
            wrap.okrComments.put(r.PMS_OKR__c, r.Staff_Comments__c);
        }

        // Competency
        for (Staff_Competency_Response__c r : st.Staff_Competency_Responses__r) {
            wrap.competencyRatings.put(r.PMS_Competency__c, r.Staff_Rating__c);
            wrap.competencyComments.put(r.PMS_Competency__c, r.Staff_Comments__c);
        }

        response.add(wrap);
    }

    return response;
}
    
    
    
    

}