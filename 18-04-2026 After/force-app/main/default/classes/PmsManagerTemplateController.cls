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
    
            //  if(isBetweenHRDates || st.Status__c == 'Submitted to HR' || st.Status__c == 'Completed' ){
         	if( st.Status__c == 'Submitted to HR' || st.Status__c == 'Completed' ){
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
            [SELECT Id, PMS_Role_Template__c, Staff__c,Manager_Comments__c , PMS_Role_Template__r.PMS_Review_Cycle__c,PMS_Role_Template__r.Facility__c
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
            //parent.Manager_Submitted_Date__c = Date.today();
            parent.Manager_Submitted_Date__c = System.now();
            update parent;
            
            //insert coaching seesion record
            List<PMS_Coaching_session__c> existingSessions =
                [SELECT Id FROM PMS_Coaching_session__c
                 WHERE PMS_Staff_Template__c = :parent.Id];
    
            if(existingSessions.isEmpty()){
    
                PMS_Coaching_session__c session = new PMS_Coaching_session__c();
    
                //session.Name = 'Coaching - ' + Date.today(); 
                //session.Staff__c = parent.Staff__c;
                session.PMS_Staff_Template__c = parent.Id;
                session.Facility__c = parent.PMS_Role_Template__r.Facility__c;
                session.PMS_Review_Cycle__c = parent.PMS_Role_Template__r.PMS_Review_Cycle__c;
                session.isCreatedByRc__c=true;
                session.isScheduledCoaching__c = false;
    
                insert session;
                System.debug('Session Created Id: ' + session.Id);
    			//System.debug('Parent Staff Id: ' + parent.Staff__c);
                if(parent.Staff__c  != null){
                    
					System.debug('Parent Staff Id Inside IF: ' + parent.Staff__c);
                    PMS_Staff_Coaching__c junction = new PMS_Staff_Coaching__c();
            
                    junction.PMS_Coaching_Session__c = session.Id;
                    junction.Staff__c = parent.Staff__c;
                    junction.Staff_Type__c='Staff';
            
                    insert junction;
                    System.debug('Junction Created: ' + junction.Id);
                 } else {
                     System.debug('Staff is NULL → Junction NOT created');
                 }
            }

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
    
    @AuraEnabled
    public static List<PMS_Goal__c> getGoalsByManager(String managerId){
    
        if(managerId == null){
            return new List<PMS_Goal__c>();
        }
    
        List<PMS_Goal__c> goals = [SELECT Id,Goal_Title__c,Goal_Status__c, Goal_Type__c, Goal_Start_Date__c, Goal_End_Date__c,Staff__r.Display_Nickname__c,Staff__r.Manager__c
                                   	FROM PMS_Goal__c WHERE Staff__r.Manager__c= :managerId ORDER BY CreatedDate DESC];
    
        return goals;
    }
    
    @AuraEnabled
    public static  Map<String, Object> getCoachingSessions( String facilityId, String managerId){
    	System.debug(' facilityId : '+facilityId );
        List<PMS_Coaching_session__c> sessions = [
            SELECT Id,isCreatedByRc__c,isCreatedByManager__c, Coaching_Type__c, isScheduledCoaching__c,Coaching_Title__c, Coaching_Description__c, Discussion_Summary__c,
              								 Outcome_Aggrements__c, Meeting_Time__c, Meeting_Date__c,Meeting_Type__c, Location__c, Recommendation_for_Promotion__c,Facility__c,HR_Id__c,
              								 Recommendation_for_PIP__c, Recommendation_for_Increment__c,Recommendation_Additional_Details__c,Manager_Confidential_Notes__c,HR_Name__c,
              								 HR_Confidential_Notes__c,HR_Coaching_Comments__c,Is_Hr_Acknowledged__c,  HR_Acknowledged_Date__c, Is_HR_Submitted__c,Is_Manager_Finalized__c,
											 CreatedDate, LastModifiedDate,CreatedBy.Name, LastModifiedBy.Name,PMS_Staff_Template__r.PMS_Role_Template__r.Role_Title__c, PMS_Review_Cycle__r.Name,
											 (SELECT Id, Staff__c,Staff_Type__c,Staff__r.Display_Nickname__c,Staff__r.picture__c, Staff__r.Email_Address__c,Staff__r.Manager__c,
                                              Staff_Coaching_Comments__c, Manager_Coaching_Comments__c,Is_Staff_Acknowledged__c, Staff_Acknowledged_Date__c,
                      						  Is_Manager_Acknowledged__c, Manager_Acknowledged_Date__c FROM PMS_Staff_Coaching__r),
                                             (SELECT Id, Action_Name__c, Action_Type__c FROM PMS_Coaching_Action__r) 
            FROM PMS_Coaching_session__c
    		// WHERE Facility__c=:facilityId 
         	 WHERE Facility__c=:facilityId AND Id IN (
            SELECT PMS_Coaching_Session__c
            FROM PMS_Staff_Coaching__c
            WHERE Staff__r.Manager__c = :managerId
        )
    
        ORDER BY CreatedDate DESC
        ];
        Set<Id> staffIds = new Set<Id>();
        Set<Id> managerIds = new Set<Id>();

        for(PMS_Coaching_session__c rec : sessions){

            if(rec.PMS_Staff_Coaching__r != null){
                for(PMS_Staff_Coaching__c child : rec.PMS_Staff_Coaching__r){
    
                    if(child.Staff__c != null){
                        staffIds.add(child.Staff__c);
                    }
    
                    if(child.Staff__r != null && child.Staff__r.Manager__c != null){
                        managerIds.add(child.Staff__r.Manager__c);
                    }
                }
            }
        }
    
        Map<Id, String> roleMap = new Map<Id, String>();
    
        if(!staffIds.isEmpty()){
            List<StaffRole__c> roleList = [
                SELECT RoleName__c, StaffRole_To_Staff__c
                FROM StaffRole__c
                WHERE StaffRole_To_Staff__c IN :staffIds
                AND Active__c = true
                AND Primary__c = true
            ];
    
            for(StaffRole__c role : roleList){
                roleMap.put(role.StaffRole_To_Staff__c, role.RoleName__c);
            }
        }
    
        Map<Id, Staff__c> managerMap = new Map<Id, Staff__c>();
    
        if(!managerIds.isEmpty()){
            List<Staff__c> managerList = [
                SELECT Id, Display_Nickname__c, Email_Address__c
                FROM Staff__c
                WHERE Id IN :managerIds
            ];
    
            for(Staff__c mgr : managerList){
                managerMap.put(mgr.Id, mgr);
            }
        }
    
        Map<String, Object> result = new Map<String, Object>();
    	System.debug('Sessions Count: ' + sessions.size());
        result.put('sessions', sessions);
        result.put('roles', roleMap);
        result.put('managers', managerMap);
    
        return result;
    }   
    /*@AuraEnabled
    public static void saveCoachingData(
        Map<String, Object> coachingData,
        List<Map<String, String>> actionList
    ) {
    
        PMS_Coaching_session__c cs = new PMS_Coaching_session__c();
    
        if (coachingData.containsKey('Id')) {
            cs.Id = (Id) coachingData.get('Id');
        } else {
            throw new AuraHandledException('Coaching Session Id is required');
        }
   
        cs.Coaching_Title__c       = (String) coachingData.get('coachingTitle');
        //cs.Meeting_Date__c         = (Date) coachingData.get('meetingDate');
        if (coachingData.get('meetingDate') != null) {
            try {
                cs.Meeting_Date__c = Date.valueOf((String) coachingData.get('meetingDate'));
            } catch (Exception e) {
                System.debug('Invalid date format');
            }
        }
    
       if (coachingData.get('meetingTime') != null) {

           String timeStr = (String) coachingData.get('meetingTime'); // "14:30"
           
           try {
               List<String> parts = timeStr.split(':');
               
               Integer hours = Integer.valueOf(parts[0]);
               Integer minutes = Integer.valueOf(parts[1]);
               
               cs.Meeting_Time__c = Time.newInstance(hours, minutes, 0, 0);
               
           } catch (Exception e) {
               System.debug('Invalid time format: ' + timeStr);
           }
       }
    
        cs.Location__c             = (String) coachingData.get('location');
        cs.Meeting_Type__c         = (String) coachingData.get('meetingType');
        cs.Coaching_Description__c = (String) coachingData.get('description');
        cs.Discussion_Summary__c   = (String) coachingData.get('discussionSummary');
        cs.Outcome_Aggrements__c   = (String) coachingData.get('outcomeAgreements');
        cs.Manager_Confidential_Notes__c = (String) coachingData.get('confidentialNotes');
        cs.Recommendation_Additional_Details__c = (String) coachingData.get('additionalDetails');
        // cs.Manager_Coaching_Comments__c = (String) coachingData.get('managerComments');
		cs.HR_Coaching_Comments__c = (String) coachingData.get('hrComments');
        //cs.Staff_Coaching_Comments__c = (String) coachingData.get('employeeComment');
    
        cs.Recommendation_for_Promotion__c = (Boolean) coachingData.get('promotion');
        cs.Recommendation_for_PIP__c = (Boolean) coachingData.get('pip');
        cs.Recommendation_for_Increment__c = (Boolean) coachingData.get('improvement');
    	cs.isScheduledCoaching__c = true;
    	
        if(coachingData.containsKey('isStaffAcknowledged') && coachingData.get('isStaffAcknowledged') != null){
        
            Boolean isStaffAck = (Boolean) coachingData.get('isStaffAcknowledged');
            cs.Is_Staff_Acknowledged__c = isStaffAck;
        
            if(isStaffAck){
                cs.Staff_Acknowledged_Date__c = System.now(); 
            }
        }
        
        if(coachingData.containsKey('isManagerAcknowledged') && coachingData.get('isManagerAcknowledged') != null){
        
            Boolean isManagerAck = (Boolean) coachingData.get('isManagerAcknowledged');
            cs.Is_Manager_Acknowledged__c = isManagerAck;
        
            if(isManagerAck){
                cs.Manager_Acknowledged_Date__c = System.now(); 
            }
        }
        
        if(coachingData.containsKey('isHrAcknowledged') && coachingData.get('isHrAcknowledged') != null){
        
            Boolean isHrAck = (Boolean) coachingData.get('isHrAcknowledged');
            cs.Is_Hr_Acknowledged__c = isHrAck;
        
            if(isHrAck){
                cs.HR_Acknowledged_Date__c = System.now(); 
            }
        }
        if(coachingData.containsKey('isFinalized')){
            cs.Is_Manager_Finalized__c = (Boolean) coachingData.get('isFinalized');
        }
        
        // HR SUBMIT
        if(coachingData.containsKey('isSubmitted')){
            cs.Is_HR_Submitted__c = (Boolean) coachingData.get('isSubmitted');
        }
        update cs;
    
        //  INSERT CHILD RECORDS
        List<PMS_Coaching_Action__c> actionsToUpsert  = new List<PMS_Coaching_Action__c>();
    
        if (actionList != null) {
    
            for (Map<String, String> actionMap : actionList) {
    
                if (actionMap == null) continue;
    
                String actionName = actionMap.get('Action_Name__c');
                String typeVal = actionMap.get('Type__c');
    			String actionId = actionMap.get('Id');
                
                //  null + empty check
                if (String.isBlank(actionName)) continue;
    
                PMS_Coaching_Action__c ca = new PMS_Coaching_Action__c();
                if (!String.isBlank(actionId) && actionId.length() == 18) {
                       ca.Id = actionId; 
                }
                ca.PMS_Coaching_session__c = cs.Id;
                ca.Action_Name__c = actionName.trim();
                ca.Action_Type__c = typeVal;
    
                actionsToUpsert.add(ca);
            }
        }
    
        if (!actionsToUpsert.isEmpty()) {
            upsert  actionsToUpsert;
        }
    }*/
    
     @AuraEnabled
    public static void saveCoachingData(String facilityId, Map<String, Object> coachingData, List<Map<String, String>> actionList ) {
    	System.debug('facilityId: ' + facilityId);
        PMS_Coaching_session__c cs = new PMS_Coaching_session__c();
    
        if (coachingData.containsKey('Id')) {
            cs.Id = (Id) coachingData.get('Id');
        } else {
            throw new AuraHandledException('Coaching Session Id is required');
        }
        
        System.debug('Coaching Id: ' + cs.Id);
    
        PMS_Coaching_session__c existing = [
            SELECT isCreatedByRc__c, isCreatedByManager__c,Facility__c 
            FROM PMS_Coaching_session__c
            WHERE Id = :cs.Id
            LIMIT 1
        ];
    
        System.debug('Existing Record: ' + existing);
        System.debug('existing.Facility__: ' + existing.Facility__c);
        System.debug('Existing isCreatedByRc__c: ' + existing.isCreatedByRc__c);
        System.debug('Existing isCreatedByManager__c: ' + existing.isCreatedByManager__c);

        if(existing.Facility__c ==null){
            cs.Facility__c=facilityId;
        }
        if (coachingData.containsKey('coachingTitle')  && coachingData.get('coachingTitle') != null) {
            cs.Coaching_Title__c = (String) coachingData.get('coachingTitle');
        }
        //cs.Meeting_Date__c         = (Date) coachingData.get('meetingDate');
        if (coachingData.get('meetingDate') != null) {
            try {
                cs.Meeting_Date__c = Date.valueOf((String) coachingData.get('meetingDate'));
            } catch (Exception e) {
                System.debug('Invalid date format');
            }
        }
    
       if (coachingData.get('meetingTime') != null) {

           String timeStr = (String) coachingData.get('meetingTime'); // "14:30"
           
           try {
               List<String> parts = timeStr.split(':');
               
               Integer hours = Integer.valueOf(parts[0]);
               Integer minutes = Integer.valueOf(parts[1]);
               
               cs.Meeting_Time__c = Time.newInstance(hours, minutes, 0, 0);
               
           } catch (Exception e) {
               System.debug('Invalid time format: ' + timeStr);
           }
       }
       if (coachingData.containsKey('location') && coachingData.get('location') != null) {
           cs.Location__c = (String) coachingData.get('location');
       }
        if (coachingData.containsKey('meetingType') && coachingData.get('meetingType') != null) {
            cs.Meeting_Type__c = (String) coachingData.get('meetingType');
        }
        if (coachingData.containsKey('description') && coachingData.get('description') != null) {
           cs.Coaching_Description__c = (String) coachingData.get('description');
        }
        if (coachingData.containsKey('discussionSummary') && coachingData.get('discussionSummary') != null) {
            cs.Discussion_Summary__c   = (String) coachingData.get('discussionSummary');
        }
        if (coachingData.containsKey('outcomeAgreements') && coachingData.get('outcomeAgreements') != null) {
           cs.Outcome_Aggrements__c   = (String) coachingData.get('outcomeAgreements');
        }
        
        //if (coachingData.containsKey('hrConfidentialNotes') && coachingData.get('hrConfidentialNotes') != null) {
          //  cs.HR_Confidential_Notes__c = (String) coachingData.get('hrConfidentialNotes');
      //  }
       // if (coachingData.containsKey('confidentialNotes') && coachingData.get('confidentialNotes') != null) {
           //  cs.Manager_Confidential_Notes__c = (String) coachingData.get('confidentialNote');
       // }
       // Manager Notes
        if (coachingData.containsKey('confidentialNotes')) {
            String val = (String) coachingData.get('confidentialNotes');
            if (val != null && val.trim() != '') {
                cs.Manager_Confidential_Notes__c = val;
            }
        }
        
        // HR Notes
        if (coachingData.containsKey('hrConfidentialNotes')) {
            String val = (String) coachingData.get('hrConfidentialNotes');
            if (val != null && val.trim() != '') {
                cs.HR_Confidential_Notes__c = val;
            }
        }
        if (coachingData.containsKey('additionalDetails') && coachingData.get('additionalDetails') != null) {
          cs.Recommendation_Additional_Details__c = (String) coachingData.get('additionalDetails');
        }
        if (coachingData.containsKey('discussionSummary') && coachingData.get('discussionSummary') != null) {
            cs.Discussion_Summary__c   = (String) coachingData.get('discussionSummary');
        }
        if (coachingData.containsKey('hrComments') && coachingData.get('hrComments') != null) {
          cs.HR_Coaching_Comments__c = (String) coachingData.get('hrComments');
        }
      
        if (coachingData.containsKey('promotion') && coachingData.get('promotion') != null) {
            cs.Recommendation_for_Promotion__c = (Boolean) coachingData.get('promotion');
        }
        if (coachingData.containsKey('pip') && coachingData.get('pip') != null) {
           cs.Recommendation_for_PIP__c = (Boolean) coachingData.get('pip');
        }
        if (coachingData.containsKey('improvement') && coachingData.get('improvement') != null) {
            cs.Recommendation_for_Increment__c = (Boolean) coachingData.get('improvement');
        }
        //if(cs.isCreatedByRc__c){
            
          //  cs.isScheduledCoaching__c = true;
        //}
        
    	System.debug('Before IF - isScheduledCoaching__c: ' + cs.isScheduledCoaching__c);
        if (existing.isCreatedByRc__c == true) {
            System.debug('INSIDE IF → Created by RC');
            cs.isScheduledCoaching__c = true;
        } else {
            System.debug('INSIDE ELSE ');
            cs.isScheduledCoaching__c = false;
        }
    	 System.debug('After IF - isScheduledCoaching__c: ' + cs.isScheduledCoaching__c);
    	        
        if(coachingData.containsKey('isHrAcknowledged') && coachingData.get('isHrAcknowledged') != null){
        
            Boolean isHrAck = (Boolean) coachingData.get('isHrAcknowledged');
            cs.Is_Hr_Acknowledged__c = isHrAck;
        
            if(isHrAck){
                cs.HR_Acknowledged_Date__c = System.now(); 
            }
        }
        if(coachingData.containsKey('isFinalized') && coachingData.get('isFinalized') != null){
            cs.Is_Manager_Finalized__c = (Boolean) coachingData.get('isFinalized');
        }
        
        // HR SUBMIT
        if(coachingData.containsKey('isSubmitted')  && coachingData.get('isSubmitted') != null){
            cs.Is_HR_Submitted__c = (Boolean) coachingData.get('isSubmitted');
        }
        if (coachingData.containsKey('hrId') && coachingData.get('hrId') != null) {
            cs.HR_Id__c = (String) coachingData.get('hrId');
        }
        if (coachingData.containsKey('hrName') && coachingData.get('hrName') != null) {
           cs.HR_Name__c = (String) coachingData.get('hrName');
        }
        update cs;

        // Query existing child session for this parent & staff (if exists)
        List<PMS_Staff_Coaching__c> existingChild = [
            SELECT Id ,Staff_Acknowledged_Date__c,Manager_Acknowledged_Date__c
            FROM PMS_Staff_Coaching__c
            WHERE PMS_Coaching_Session__c = :cs.Id
           // AND Staff__c = :coachingData.get('staffId')
            LIMIT 1
        ];

        if (!existingChild.isEmpty()) {

            PMS_Staff_Coaching__c childSession = existingChild[0];
    
            //childSession.Manager_Coaching_Comments__c = (String) coachingData.get('managerComments');
             if (coachingData.containsKey('managerComments')) {

                String mgrComment = (String) coachingData.get('managerComments');
            
                if (mgrComment != null && mgrComment.trim() != '') {
                    childSession.Manager_Coaching_Comments__c = mgrComment;
                }
            }
           // childSession.Staff_Coaching_Comments__c   = (String) coachingData.get('employeeComment');
          if (coachingData.containsKey('employeeComment')) {

                String staffComment = (String) coachingData.get('employeeComment');
            
                if (staffComment != null && staffComment.trim() != '') {
                    childSession.Staff_Coaching_Comments__c = staffComment;
                }
            }
    
            if (coachingData.containsKey('isStaffAcknowledged') && coachingData.get('isStaffAcknowledged') != null) {
                Boolean isStaffAck = (Boolean) coachingData.get('isStaffAcknowledged');
                childSession.Is_Staff_Acknowledged__c = isStaffAck;
    
                if (isStaffAck) {
                   // childSession.Staff_Acknowledged_Date__c = System.now();
               
                    if (childSession.Staff_Acknowledged_Date__c == null) {
                        childSession.Staff_Acknowledged_Date__c = System.now();
                    }
                }
            }
    
            if (coachingData.containsKey('isManagerAcknowledged') && coachingData.get('isManagerAcknowledged') != null) {
                Boolean isManagerAck = (Boolean) coachingData.get('isManagerAcknowledged');
                childSession.Is_Manager_Acknowledged__c = isManagerAck;
    
                if (isManagerAck) {
                   // childSession.Manager_Acknowledged_Date__c = System.now();
                    if (childSession.Manager_Acknowledged_Date__c == null) {
                        childSession.Manager_Acknowledged_Date__c = System.now();
                    }
                }
            }
    
            update childSession;
        }

        //  INSERT CHILD RECORDS
        List<PMS_Coaching_Action__c> actionsToUpsert  = new List<PMS_Coaching_Action__c>();
    
        if (actionList != null) {
    
            for (Map<String, String> actionMap : actionList) {
    
                if (actionMap == null) continue;
    
                String actionName = actionMap.get('Action_Name__c');
                String typeVal = actionMap.get('Type__c');
    			String actionId = actionMap.get('Id');
                
                //  null + empty check
                if (String.isBlank(actionName)) continue;
                if (String.isBlank(typeVal)) continue;
    
                PMS_Coaching_Action__c ca = new PMS_Coaching_Action__c();
                if (!String.isBlank(actionId) && actionId.length() == 18) {
                       ca.Id = actionId; 
                }
                ca.PMS_Coaching_session__c = cs.Id;
                ca.Action_Name__c = actionName.trim();
                ca.Action_Type__c = typeVal;
    
                actionsToUpsert.add(ca);
            }
        }
    
        if (!actionsToUpsert.isEmpty()) {
            upsert  actionsToUpsert;
        }
        
    }
    @AuraEnabled
    public static Map<String, Object> getCoachingSessionDetails(String coachingId) {
    

         PMS_Coaching_session__c session = [ SELECT Id,isCreatedByRc__c,isCreatedByManager__c,  isScheduledCoaching__c,Coaching_Title__c,Coaching_Type__c, Coaching_Description__c, Discussion_Summary__c,
              								 Outcome_Aggrements__c, Meeting_Time__c, Meeting_Date__c,Meeting_Type__c, Location__c, Recommendation_for_Promotion__c,
              								 Recommendation_for_PIP__c, Recommendation_for_Increment__c,Recommendation_Additional_Details__c,Manager_Confidential_Notes__c,
              								 HR_Confidential_Notes__c,HR_Coaching_Comments__c,Is_Hr_Acknowledged__c,  HR_Acknowledged_Date__c, Is_HR_Submitted__c,Is_Manager_Finalized__c,
											 CreatedDate, LastModifiedDate,CreatedBy.Name, LastModifiedBy.Name, PMS_Staff_Template__r.Staff__c,PMS_Staff_Template__r.Staff__r.Display_Nickname__c,
               								 PMS_Staff_Template__r.Staff__r.Email_Address__c, PMS_Staff_Template__r.Staff__r.picture__c, PMS_Staff_Template__r.Staff__r.Manager__c,
              								 PMS_Staff_Template__r.PMS_Role_Template__r.Role_Title__c, PMS_Review_Cycle__r.Name,Facility__c,HR_Id__c,HR_Name__c,
											 (SELECT Id, Staff__c,Staff_Type__c,Staff__r.Display_Nickname__c,Staff__r.picture__c, Staff__r.Email_Address__c,Staff__r.Manager__c,
                                              Staff_Coaching_Comments__c, Manager_Coaching_Comments__c,Is_Staff_Acknowledged__c, Staff_Acknowledged_Date__c,
                      						  Is_Manager_Acknowledged__c, Manager_Acknowledged_Date__c FROM PMS_Staff_Coaching__r),
                                             (SELECT Id, Action_Name__c, Action_Type__c FROM PMS_Coaching_Action__r) FROM PMS_Coaching_session__c WHERE Id = :coachingId LIMIT 1 ];
        
   
        Set<Id> staffIds = new Set<Id>();
        Set<Id> managerIds = new Set<Id>();
    
        if (session.PMS_Staff_Template__r?.Staff__c != null) {
            staffIds.add(session.PMS_Staff_Template__r.Staff__c);
            Id mgrId = session.PMS_Staff_Template__r.Staff__r?.Manager__c;
            if (mgrId != null) managerIds.add(mgrId);
        }
    
        for (PMS_Staff_Coaching__c child : session.PMS_Staff_Coaching__r) {
            if (child.Staff__c != null) staffIds.add(child.Staff__c);
            if (child.Staff__r?.Manager__c != null) managerIds.add(child.Staff__r.Manager__c);
        }
    
        Map<Id, String> roleMap = new Map<Id, String>();
        if (!staffIds.isEmpty()) {
            List<StaffRole__c> roleList = [
                SELECT RoleName__c, StaffRole_To_Staff__c 
                FROM StaffRole__c 
                WHERE StaffRole_To_Staff__c IN :staffIds 
                AND Active__c = true 
                AND Primary__c = true
            ];
            for (StaffRole__c role : roleList) {
                roleMap.put(role.StaffRole_To_Staff__c, role.RoleName__c);
            }
        }
        
        Map<Id, Staff__c> managerMap = new Map<Id, Staff__c>();
        if (!managerIds.isEmpty()) {
            List<Staff__c> managerList = [
                SELECT Id, Display_Nickname__c, Email_Address__c, picture__c 
                FROM Staff__c 
                WHERE Id IN :managerIds
            ];
            for (Staff__c mgr : managerList) {
                managerMap.put(mgr.Id, mgr);
            }
        }
    
        Map<String, Object> result = new Map<String, Object>();
        result.put('session', session);
        result.put('roles', roleMap);
        result.put('managers', managerMap);
    
        return result;
    }
    @AuraEnabled
    public static void changeRequestCoaching(String coachingId, Boolean isManager, Boolean isHr) {
    
        /*if (coachingId == null) {
            throw new AuraHandledException('Coaching Id is required');
        }
    
        PMS_Coaching_session__c cs = new PMS_Coaching_session__c(Id = coachingId);
    
        //  Manager → reset staff
        if (isManager) {
            cs.Is_Staff_Acknowledged__c = false;
            cs.Staff_Acknowledged_Date__c = null;
        }
    
        // HR → reset manager
        if (isHr) {
            cs.Is_Manager_Acknowledged__c = false;
            cs.Manager_Acknowledged_Date__c = null;
        }
    
        update cs;*/
		List<PMS_Staff_Coaching__c> childList = [
            SELECT Id,
                   Is_Staff_Acknowledged__c,
                   Staff_Acknowledged_Date__c,
                   Is_Manager_Acknowledged__c,
                   Manager_Acknowledged_Date__c
            FROM PMS_Staff_Coaching__c
            WHERE PMS_Coaching_Session__c = :coachingId
           
        ];

        for (PMS_Staff_Coaching__c child : childList) {

            if (isManager) {
                child.Is_Staff_Acknowledged__c = false;
                child.Staff_Acknowledged_Date__c = null;
            }
        
            if (isHr) {
                child.Is_Manager_Acknowledged__c = false;
                child.Manager_Acknowledged_Date__c = null;
            }
        }
        
        if (!childList.isEmpty()) {
            update childList;
        }
    }

    
   /* @AuraEnabled
    public static List<Staff__c> getManagersByFacility(Id facilityId) {
    
        System.debug('FacilityId: ' + facilityId);
    
        List<Staff__c> managerList = [
            SELECT Id, Manager__c, PMS_Role_Template__c, PMS_Role_Template__r.Role_Title__c,
                   Email_Address__c, NameToDisplay__c, Name, picture__c, Role__c, Display_Nickname__c, User_Type__c,
            		(SELECT Id, RoleName__c, Primary__c FROM StaffRoles__r  WHERE Active__c = true  AND Primary__c = true  LIMIT 1) 
            FROM Staff__c
            WHERE Status__c = true
              AND Id IN (
                  SELECT Staff__c
                  FROM Staff_Facility__c
                  WHERE Active__c = true
                    AND Facility__c = :facilityId
              )
              AND User_Type__c != 'NDIS Staff' AND User_Type__c != 'NDIS Org Admin'
        ];
    
        System.debug('Filtered Staff Count: ' + managerList.size());
    
        return managerList;
    }*/
     @AuraEnabled
    public static Map<String, List<Staff__c>> getManagersAndHrByFacility(String facilityId) {
    
        System.debug('FacilityId: ' + facilityId);
        //Map<String, List<Staff__c>> response = new Map<String, List<Staff__c>>();
        
        //Managers
        List<Staff__c> staffList = [
            SELECT Id, Manager__c, PMS_Role_Template__c, PMS_Role_Template__r.Role_Title__c,
                   Email_Address__c, NameToDisplay__c, Name, picture__c, Role__c, Display_Nickname__c, User_Type__c,
            		(SELECT Id, RoleName__c, Primary__c FROM StaffRoles__r  WHERE Active__c = true  AND Primary__c = true  LIMIT 1) 
            FROM Staff__c
            WHERE Status__c = true
              AND Id IN (
                  SELECT Staff__c
                  FROM Staff_Facility__c
                  WHERE Active__c = true
                    AND Facility__c = :facilityId
              )
              AND User_Type__c != 'NDIS Staff' AND User_Type__c != 'NDIS Org Admin'
        ];
    
        System.debug('Filtered Staff Count: ' + staffList.size());
    
        List<Staff__c> managerList = new List<Staff__c>();
        List<Staff__c> hrList = new List<Staff__c>();
    
        for (Staff__c s : staffList) {
    
            if (s.User_Type__c == 'HR Admin') {
                hrList.add(s);
            }
            managerList.add(s);
            
        }
    
        System.debug('Managers Count: ' + managerList.size());
        System.debug('HR Count: ' + hrList.size());
    
        Map<String, List<Staff__c>> response = new Map<String, List<Staff__c>>();
    
        response.put('managers', managerList);
        response.put('hrs', hrList);
    
        return response;
    }
   
   
      @AuraEnabled
    public static Id createOrUpdateManagerCoaching(
        String facilityId,
        Map<String, Object> coachingData,
        List<Map<String, Object>> actionList,
       List<Map<String, Object>> staffDataList
    ) {
    
        PMS_Coaching_session__c cs = new PMS_Coaching_session__c();
    
        if (coachingData.containsKey('Id') && coachingData.get('Id') != null) {
            cs.Id = (Id) coachingData.get('Id'); // Update
        } else {
            cs.isCreatedByManager__c = true;
            cs.isScheduledCoaching__c = false;
        }
    
        
        cs.Coaching_Title__c = (String) coachingData.get('coachingTitle');
    
        if (coachingData.get('meetingDate') != null) {
            try {
                cs.Meeting_Date__c = Date.valueOf((String) coachingData.get('meetingDate'));
            } catch (Exception e) {
                System.debug('Invalid date format');
            }
        }
    
           if (coachingData.get('meetingTime') != null) {
    
               String timeStr = (String) coachingData.get('meetingTime'); // "14:30"
               
               try {
                   List<String> parts = timeStr.split(':');
                   
                   Integer hours = Integer.valueOf(parts[0]);
                   Integer minutes = Integer.valueOf(parts[1]);
                   
                   cs.Meeting_Time__c = Time.newInstance(hours, minutes, 0, 0);
                   
               } catch (Exception e) {
                   System.debug('Invalid time format: ' + timeStr);
               }
           }
		 if(cs.Facility__c ==null){
            cs.Facility__c=facilityId;
        }
    	cs.Coaching_Type__c = (String) coachingData.get('coachingType');
        cs.Location__c = (String) coachingData.get('location');
        cs.Meeting_Type__c = (String) coachingData.get('meetingType');
        cs.Coaching_Description__c = (String) coachingData.get('description');
        cs.Discussion_Summary__c = (String) coachingData.get('discussionSummary');
        cs.Outcome_Aggrements__c = (String) coachingData.get('outcomeAgreements');
        cs.Manager_Confidential_Notes__c = (String) coachingData.get('confidentialNotes');
        cs.Recommendation_Additional_Details__c = (String) coachingData.get('additionalDetails');
    
       // cs.Recommendation_for_Promotion__c = (Boolean) coachingData.get('promotion');
       // cs.Recommendation_for_PIP__c = (Boolean) coachingData.get('pip');
       // cs.Recommendation_for_Increment__c = (Boolean) coachingData.get('improvement');
        cs.Recommendation_for_Promotion__c =coachingData.get('promotion') != null ? (Boolean) coachingData.get('promotion') : false;
        cs.Recommendation_for_PIP__c = coachingData.get('pip') != null ? (Boolean) coachingData.get('pip') : false;
        cs.Recommendation_for_Increment__c = coachingData.get('improvement') != null ? (Boolean) coachingData.get('improvement') : false;
        cs.HR_Coaching_Comments__c = (String) coachingData.get('hrComments');
    
        
		if (coachingData.containsKey('isFinalized')) {
            cs.Is_Manager_Finalized__c = (Boolean) coachingData.get('isFinalized');
        }
        
        if (coachingData.containsKey('isSubmitted')) {
            cs.Is_HR_Submitted__c = (Boolean) coachingData.get('isSubmitted');
        }
        
        if (coachingData.containsKey('isHrAcknowledged') && coachingData.get('isHrAcknowledged') != null) {
            Boolean isHrAck = (Boolean) coachingData.get('isHrAcknowledged');
            cs.Is_Hr_Acknowledged__c = isHrAck;
        
            if (isHrAck) {
                cs.HR_Acknowledged_Date__c = System.now();
            }
        }
        upsert cs;
        if (staffDataList  != null && !staffDataList .isEmpty()) {
    
            Map<Id, PMS_Staff_Coaching__c> existingMap = new Map<Id, PMS_Staff_Coaching__c>();
    		List<PMS_Staff_Coaching__c> childList1 = [
                 SELECT Id, Staff__c
                FROM PMS_Staff_Coaching__c
                WHERE PMS_Coaching_Session__c = :cs.Id
               
            ];
            for (PMS_Staff_Coaching__c child :childList1) {
                existingMap.put(child.Staff__c, child);
            }
    		Set<Id> incomingStaffIds = new Set<Id>();

            for (Map<String, Object> staffData : staffDataList) {
                String staffIdStr = (String) staffData.get('staffId');
                if (staffIdStr != null) {
                    incomingStaffIds.add(Id.valueOf(staffIdStr));
                }
            }
    
            // DELETE REMOVED STAFF
            List<PMS_Staff_Coaching__c> toDelete = new List<PMS_Staff_Coaching__c>();
    
            for (PMS_Staff_Coaching__c existing : childList1) {
                if (!incomingStaffIds.contains(existing.Staff__c)) {
                    toDelete.add(existing);
                }
            }
    
            if (!toDelete.isEmpty()) {
                delete toDelete;
            }

            List<PMS_Staff_Coaching__c> childList = new List<PMS_Staff_Coaching__c>();
    
             for (Map<String, Object> staffData : staffDataList) {

               // Id staffId = (Id) staffData.get('staffId');
                String staffIdStr = (String) staffData.get('staffId');
				Id staffId = staffIdStr != null ? Id.valueOf(staffIdStr) : null;
                if (staffId == null) continue;
    
                PMS_Staff_Coaching__c child;
    
                if (existingMap.containsKey(staffId)) {
                    child = existingMap.get(staffId);
                } else {
                    child = new PMS_Staff_Coaching__c();
                    child.PMS_Coaching_Session__c = cs.Id;
                    child.Staff__c = staffId;
                }
    			child.Staff_Type__c = (String) staffData.get('staffType');
                child.Manager_Coaching_Comments__c =
                    (String) staffData.get('managerComment');
    
                child.Staff_Coaching_Comments__c =
                    (String) staffData.get('employeeComment');
    
                if (staffData.containsKey('isStaffAcknowledged') && staffData.get('isStaffAcknowledged') != null) {
    
                    Boolean isStaffAck = (Boolean) staffData.get('isStaffAcknowledged');
                    child.Is_Staff_Acknowledged__c = isStaffAck;
    
                    if (isStaffAck) {
                        child.Staff_Acknowledged_Date__c = System.now();
                    }
                }
    
                if (staffData.containsKey('isManagerAcknowledged') && staffData.get('isManagerAcknowledged') != null) {
    
                    Boolean isManagerAck = (Boolean) staffData.get('isManagerAcknowledged');
                    child.Is_Manager_Acknowledged__c = isManagerAck;
    
                    if (isManagerAck) {
                        child.Manager_Acknowledged_Date__c = System.now();
                    }
                }
    
                childList.add(child);
            }
    
            if (!childList.isEmpty()) {
                upsert childList;
            }
        }
        
        List<PMS_Coaching_Action__c> actionsToUpsert = new List<PMS_Coaching_Action__c>();
    
        if (actionList != null) {
    
            for (Map<String, Object> actionMap : actionList) {
    
                if (actionMap == null) continue;
    
                String nameVal = (String) actionMap.get('Action_Name__c');
                String typeVal = (String) actionMap.get('Type__c');
                if (String.isBlank(nameVal)) continue;
    
                PMS_Coaching_Action__c ca = new PMS_Coaching_Action__c();
    			
                String actionId = (String) actionMap.get('Id');

                if (!String.isBlank(actionId) && actionId.length() == 18) {
                    ca.Id = actionId;
                }    
                ca.PMS_Coaching_session__c = cs.Id;
                ca.Action_Name__c = nameVal.trim();
                ca.Action_Type__c = typeVal != null ? typeVal.trim() : null;
    
                actionsToUpsert.add(ca);
            }
        }
    
        if (!actionsToUpsert.isEmpty()) {
            upsert actionsToUpsert;
        }
    
        return cs.Id;
    }
    
}