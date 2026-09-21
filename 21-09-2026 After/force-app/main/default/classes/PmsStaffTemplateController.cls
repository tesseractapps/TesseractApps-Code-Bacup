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

                (SELECT Id, Staff__c, Staff__r.Name, Staff__r.Display_Nickname__c, Staff__r.Manager__c,Effective_Date__c, Status__c, (SELECT Id, PMS_Staff_Template__c, PMS_KPI__c, Staff_Comments__c, Staff_Rating__c FROM Staff_Kpi_Responses__r), 
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
                [SELECT Id, Name ,Display_Nickname__c FROM Staff__c WHERE Id IN :managerIds]
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
                //wrap.staffName = st.Staff__r.Name;
                wrap.staffName = st.Staff__r.Display_Nickname__c;
                wrap.effectiveDate = st.Effective_Date__c;
                wrap.Status=st.Status__c;

                if (st.Staff__r.Manager__c != null &&
                    managerMap.containsKey((Id)st.Staff__r.Manager__c)) {

                    wrap.managerName =
                       // managerMap.get((Id)st.Staff__r.Manager__c).Name;
                     managerMap.get((Id)st.Staff__r.Manager__c).Display_Nickname__c;
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
    
    @AuraEnabled
    public static Map<String, String> loadStaffManagerDetails(Id staffId){
        
        Map<String, String> result = new Map<String, String>();
        
        Staff__c staff = [
            SELECT Id, Name,Display_Nickname__c, Manager__c 
            FROM Staff__c 
            WHERE Id = :staffId 
            LIMIT 1
        ];
        
        result.put('staffName', staff.Display_Nickname__c);
        result.put('managerId', staff.Manager__c);
    
        if(staff.Manager__c != null){
            Staff__c manager = [
                SELECT Id, Name, Display_Nickname__c 
                FROM Staff__c 
                WHERE Id = :staff.Manager__c
                LIMIT 1
            ];
            
            result.put('managerName', manager.Display_Nickname__c);
        }
    
        return result;
    } 
     @AuraEnabled
    public static Id saveGoal(Map<String,Object> goalData,  List<Map<String,Object>> milestoneList){
		Id goalId = (Id)goalData.get('goalId'); 
        PMS_Goal__c goal;
        if(goalId != null){
            goal = [SELECT Id FROM PMS_Goal__c WHERE Id = :goalId LIMIT 1];
        }else{
            goal = new PMS_Goal__c();
        }

        goal.Goal_Type__c = (String)goalData.get('goalType');
        goal.Goal_Title__c = (String)goalData.get('goalTitle');
        goal.Goal_Description__c = (String)goalData.get('description');
        goal.Goal_Priority__c = (String)goalData.get('priority');
        //goal.Staff__c = (String)goalData.get('staffId');
        if (goal.Id == null) {
            String staffIdStr = (String) goalData.get('staffId');
            if (staffIdStr != null) {
                goal.Staff__c = Id.valueOf(staffIdStr);
            }
        }
        //goal.Goal_Start_Date__c = Date.valueOf((String)goalData.get('startDate'));
        //goal.Goal_End_Date__c = Date.valueOf((String)goalData.get('endDate'));
        Object startDate = goalData.get('startDate');
        goal.Goal_Start_Date__c = startDate != null
            ? Date.valueOf(String.valueOf(startDate))
            : null;
        
        Object endDate = goalData.get('endDate');
        goal.Goal_End_Date__c = endDate != null
            ? Date.valueOf(String.valueOf(endDate))
            : null;
        goal.Measurement_Type__c = (String)goalData.get('measurementType');
        goal.Check_In_Frequency__c = (String)goalData.get('checkInFrequency');
        goal.Success_Indicators__c = (String)goalData.get('successIndicators');
        goal.Manager_Comments__c = (String)goalData.get('managerComments');
       // goal.Goal_Status__c = 'Active';
        goal.Goal_Status__c = (String) goalData.get('goalStatus');

        upsert  goal;
		List<PMS_Goal_Milestone__c> existingMilestones = [ SELECT Id FROM PMS_Goal_Milestone__c WHERE PMS_Goal__c = :goal.Id ];
        
        Map<Id, PMS_Goal_Milestone__c> existingMap = new Map<Id, PMS_Goal_Milestone__c>(existingMilestones);
        List<PMS_Goal_Milestone__c> milestoneRecords = new List<PMS_Goal_Milestone__c>();
		Set<Id> receivedIds = new Set<Id>();
        for(Map<String, Object> mile : milestoneList){

            //Map<String,Object> mile = (Map<String,Object>)obj;

            PMS_Goal_Milestone__c m = new PMS_Goal_Milestone__c();
            if(mile.get('id') != null){
                m.Id = (Id)mile.get('id');
                receivedIds.add(m.Id);
            }

            m.Milestone_Title__c = (String)mile.get('milestoneTitle');
            m.Milestone_Description__c = (String)mile.get('description');
            // m.Milestone_Due_Date__c = Date.valueOf((String)mile.get('dueDate'));
            Object dueDate = mile.get('dueDate');
        	m.Milestone_Due_Date__c = dueDate != null
                ? Date.valueOf(String.valueOf(dueDate))
                : null;
            m.Milestone_Status__c = (String)mile.get('status');

            m.PMS_Goal__c = goal.Id;

            milestoneRecords.add(m);
        }

        if(!milestoneRecords.isEmpty()){
            upsert milestoneRecords;
        }
       
        List<PMS_Goal_Milestone__c> deleteList = new List<PMS_Goal_Milestone__c>();
        
        for(PMS_Goal_Milestone__c existing : existingMilestones){
            if(!receivedIds.contains(existing.Id)){
                deleteList.add(existing);
            }
        }
        
        if(!deleteList.isEmpty()){
            delete deleteList;
        }

        return goal.Id;
    }
    @AuraEnabled
    public static List<Map<String,Object>> getGoalsByStaff(Id staffId){
    
        List<PMS_Goal__c> goals = [SELECT Id,Goal_Title__c,Goal_Status__c,Goal_Type__c,Goal_Description__c, Goal_Start_Date__c, Goal_End_Date__c,Staff__r.Manager__c
            FROM PMS_Goal__c
            WHERE Staff__c = :staffId
            ORDER BY CreatedDate DESC
        ];
    
        Set<Id> managerIds = new Set<Id>();
    
        for(PMS_Goal__c g : goals){
            if(g.Staff__r.Manager__c != null){
                managerIds.add((Id)g.Staff__r.Manager__c);
            }
        }
    
        Map<Id, Staff__c> managerMap = new Map<Id, Staff__c>();
    
        if(!managerIds.isEmpty()){
            managerMap = new Map<Id, Staff__c>([
                SELECT Id, Name,Display_Nickname__c
                FROM Staff__c
                WHERE Id IN :managerIds
            ]);
        }
    
        List<Map<String,Object>> result = new List<Map<String,Object>>();
    
        for(PMS_Goal__c g : goals){
    
            String managerName = '';
    
            if(g.Staff__r.Manager__c != null && managerMap.containsKey((Id)g.Staff__r.Manager__c)){
                managerName = managerMap.get((Id)g.Staff__r.Manager__c).Display_Nickname__c;
            }
             Map<String,Object> goalMap =
                (Map<String,Object>) JSON.deserializeUntyped(JSON.serialize(g));
    
            // add only manager name
            goalMap.put('managerName', managerName);
    
            result.add(goalMap);
    
            /*result.add(new Map<String,Object>{
                'Id' => g.Id,
                'Goal_Title__c' => g.Goal_Title__c,
                'Goal_Description__c' => g.Goal_Description__c,
                //'Goal_Status__c' => g.Goal_Status__c,
                'Goal_Start_Date__c' => g.Goal_Start_Date__c,
                'Goal_End_Date__c' => g.Goal_End_Date__c,
                'managerName' => managerName
            });*/
        }
    
        return result;
    }
    @AuraEnabled
    public static List<PMS_Goal__c> getGoalById(Id goalId){
    
        List<PMS_Goal__c> goal = [SELECT Id,Goal_Type__c,Goal_Title__c,Goal_Description__c,Goal_Priority__c,Goal_Start_Date__c,Goal_End_Date__c,Measurement_Type__c,Goal_Status__c,
                  			 Check_In_Frequency__c,Success_Indicators__c, Manager_Comments__c,
                            (SELECT Id,Milestone_Title__c,Milestone_Description__c, Milestone_Due_Date__c, Milestone_Status__c  FROM PMS_Goal_Milestones__r)
                            FROM PMS_Goal__c WHERE Id = :goalId LIMIT 1 ];
    
      
        return goal ;
    }
   
    @AuraEnabled
    public static  Map<String, Object> getCoachingByStaff(String staffId) {
    
        List<PMS_Coaching_session__c> sessions = [ SELECT Id,isCreatedByRc__c,isCreatedByManager__c,  isScheduledCoaching__c,Coaching_Title__c, Coaching_Description__c, Discussion_Summary__c,
                                                     Outcome_Aggrements__c, Meeting_Time__c, Meeting_Date__c,Meeting_Type__c, Location__c, Recommendation_for_Promotion__c,
                                                     Recommendation_for_PIP__c, Recommendation_for_Increment__c,Recommendation_Additional_Details__c,Manager_Confidential_Notes__c,
                                                     HR_Confidential_Notes__c,HR_Coaching_Comments__c,Is_Hr_Acknowledged__c,  HR_Acknowledged_Date__c, Is_HR_Submitted__c,
                                                     Is_Manager_Finalized__c,CreatedDate, LastModifiedDate,CreatedBy.Name, LastModifiedBy.Name, PMS_Staff_Template__r.Staff__c,
                                                     PMS_Staff_Template__r.PMS_Role_Template__r.Role_Title__c, PMS_Review_Cycle__r.Name,Facility__c,HR_Name__c,HR_Id__c,isCreatedByHR__c,
                                                     (SELECT Id, Staff__c,Staff_Type__c,Staff__r.Display_Nickname__c,Staff__r.picture__c, Staff__r.Email_Address__c,Staff__r.Manager__c,
                                                      Staff_Coaching_Comments__c, Manager_Coaching_Comments__c,Is_Staff_Acknowledged__c, Staff_Acknowledged_Date__c,
                                                      Is_Manager_Acknowledged__c, Manager_Acknowledged_Date__c FROM PMS_Staff_Coaching__r  WHERE Staff__c = :staffId),
                                                     (SELECT Id, Action_Name__c, Action_Type__c FROM PMS_Coaching_Action__r)
                                                  FROM PMS_Coaching_session__c
                                                  WHERE (isScheduledCoaching__c= true OR isCreatedByManager__c = true OR isCreatedByHR__c =true)AND Id IN (
                                                      SELECT PMS_Coaching_Session__c
                                                      FROM PMS_Staff_Coaching__c
                                                      WHERE Staff__c = :staffId
                                                  )
                                                  ORDER BY CreatedDate DESC
                                                 ];
        
         Set<Id> staffIds = new Set<Id>();
        Set<Id> managerIds = new Set<Id>();
    
        for (PMS_Coaching_session__c s : sessions) {
            for (PMS_Staff_Coaching__c child : s.PMS_Staff_Coaching__r) {
    
                if (child.Staff__c != null) {
                    staffIds.add(child.Staff__c);
                }
    
                if (child.Staff__r?.Manager__c != null) {
                    managerIds.add(child.Staff__r.Manager__c);
                }
            }
        }
    
        Map<Id, String> roleMap = new Map<Id, String>();
    
        if (!staffIds.isEmpty()) {
            for (StaffRole__c role : [
                SELECT RoleName__c, StaffRole_To_Staff__c
                FROM StaffRole__c
                WHERE StaffRole_To_Staff__c IN :staffIds
                AND Active__c = true
                AND Primary__c = true
            ]) {
                roleMap.put(role.StaffRole_To_Staff__c, role.RoleName__c);
            }
        }
    
        Map<Id, Staff__c> managerMap = new Map<Id, Staff__c>();
    
        if (!managerIds.isEmpty()) {
            for (Staff__c mgr : [
                SELECT Id, Display_Nickname__c, Email_Address__c, picture__c
                FROM Staff__c
                WHERE Id IN :managerIds
            ]) {
                managerMap.put(mgr.Id, mgr);
            }
        }

        Integer total = 0;
        Integer acknowledged = 0;
        Integer pending = 0;
    
        for (PMS_Coaching_session__c s : sessions) {

            total++;
    
            Boolean isAck = false;
    
            if (s.PMS_Staff_Coaching__r != null && !s.PMS_Staff_Coaching__r.isEmpty()) {
                isAck = s.PMS_Staff_Coaching__r[0].Is_Staff_Acknowledged__c;
            }
    
            if (isAck == true) {
                acknowledged++;
            } else {
                pending++;
            }
        }

    
        Map<String, Object> result = new Map<String, Object>();
    
        result.put('totalCount', total);
        result.put('acknowledgedCount', acknowledged);
        result.put('pendingCount', pending);
        result.put('sessions', sessions);
        result.put('roles', roleMap);
        result.put('managers', managerMap);
        result.put('pendingCount', pending);
    
        return result;
    }
       
}