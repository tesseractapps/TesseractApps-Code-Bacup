public class PmsController {
	@AuraEnabled
    public static Id saveTemplate1(
        Map<String, Object> templateData,
        List<Map<String, Object>> kpiList,
        List<Map<String, Object>> okrList,
        List<Map<String, Object>> competencyList
    ) {
    
        System.debug('saveTemplate executing');
    
        PMS_Role_Template__c template = new PMS_Role_Template__c();
        template.Facility__c = (String) templateData.get('facilityId');
        template.Role_Title__c = (String) templateData.get('roleTitle');
        //template.Role__c = (String) templateData.get('role');
        template.Template_Description__c = (String) templateData.get('description');
        template.Self_Review__c = (Boolean) templateData.get('selfReview');
        template.Manager_Review__c = (Boolean) templateData.get('managerReview');
        template.Goals_Permission__c = (Boolean) templateData.get('goalsPermission');
    
        insert template;
    
        List<PMS_KPI__c> kpisToInsert = new List<PMS_KPI__c>();
    
        for (Map<String, Object> kpiData : kpiList) {
    
            PMS_KPI__c kpi = new PMS_KPI__c();
    
            kpi.Name = (String) kpiData.get('kpiName');
            kpi.Category__c = (String) kpiData.get('category');
            //kpi.KPI_Target__c = (Decimal) kpiData.get('target');
            kpi.KPI_Target__c = kpiData.get('target') != null
                                ? Decimal.valueOf(String.valueOf(kpiData.get('target')))
                                : null;
            kpi.Unit__c= (String) kpiData.get('unit');
            //kpi.KPI_Weight__c = (Decimal) kpiData.get('weight');
            
            Object weightVal = kpiData.get('weight');
            kpi.KPI_Weight__c = (weightVal != null && String.valueOf(weightVal).trim() != '')
                                ? Decimal.valueOf(String.valueOf(weightVal))
                                : null;
            kpi.KPI_Description__c = (String) kpiData.get('description');
    
            kpi.PMS_Role_Template__c = template.Id;
    
            kpisToInsert.add(kpi);
        }
    
        if (!kpisToInsert.isEmpty()) {
            insert kpisToInsert;
        }
    
        List<PMS_OKR__c> okrsToInsert = new List<PMS_OKR__c>();
    
        for (Map<String, Object> okrData : okrList) {
    
            PMS_OKR__c okr = new PMS_OKR__c();
    
            //okr.Name = (String) okrData.get('Name');
            okr.OKR_Objective__c = (String) okrData.get('okrObjective');
            okr.OKR_Weight__c =  Decimal.valueOf(String.valueOf(okrData.get('weight')));
                                   //(Decimal) okrData.get('weight');
            okr.OKR_Description__c = (String) okrData.get('description');
    		okr.Key_Title__c = (String) okrData.get('keyTitle');
            okr.Key_Target__c = okrData.get('keyTarget') != null
                                ? Decimal.valueOf(String.valueOf(okrData.get('keyTarget')))
                                : null;
            okr.key_unit__c= (String) okrData.get('keyUnit');
            okr.PMS_Role_Template__c = template.Id;
    
            okrsToInsert.add(okr);
        }
    
        if (!okrsToInsert.isEmpty()) {
            insert okrsToInsert;
        }
    
        List<PMS_Competency__c> compsToInsert = new List<PMS_Competency__c>();
    
        for (Map<String, Object> compData : competencyList) {
    
            PMS_Competency__c comp = new PMS_Competency__c();
    
            comp.Name = (String) compData.get('competencyName');
            comp.Competency_Category__c = (String) compData.get('category');
            comp.Competency_Weight__c = Decimal.valueOf(String.valueOf(compData.get('weight')));
                                       //(Decimal) compData.get('weight');
            comp.Competency_Description__c = (String) compData.get('description');
    		comp.Expected_Behaviour__c = (String) compData.get('behaviour');
            comp.PMS_Role_Template__c = template.Id;
    
            compsToInsert.add(comp);
        }
    
        if (!compsToInsert.isEmpty()) {
            insert compsToInsert;
        }
    
        return template.Id;
    }
    @AuraEnabled
    public static Id saveTemplate(
        Map<String, Object> templateData,
        List<Map<String, Object>> kpiList,
        List<Map<String, Object>> okrList,
        List<Map<String, Object>> competencyList
    ) {
    
        System.debug('saveTemplate executing');
    
        PMS_Base_Templates__c template = new PMS_Base_Templates__c();
        template.Facility__c = (String) templateData.get('facilityId');
        template.Role_Title__c = (String) templateData.get('roleTitle');
        template.Template_Description__c = (String) templateData.get('description');
        template.Self_Review__c = (Boolean) templateData.get('selfReview');
        template.Manager_Review__c = (Boolean) templateData.get('managerReview');
        template.Goals_Permission__c = (Boolean) templateData.get('goalsPermission');
    
        insert template;
    
        List<PMS_Base_KPI__c> kpisToInsert = new List<PMS_Base_KPI__c>();
    
        for (Map<String, Object> kpiData : kpiList) {
    
            PMS_Base_KPI__c kpi = new PMS_Base_KPI__c();
    
            kpi.Name = (String) kpiData.get('kpiName');
            kpi.Category__c = (String) kpiData.get('category');
            //kpi.KPI_Target__c = (Decimal) kpiData.get('target');
            kpi.KPI_Target__c = kpiData.get('target') != null
                                ? Decimal.valueOf(String.valueOf(kpiData.get('target')))
                                : null;
            kpi.Unit__c= (String) kpiData.get('unit');
            //kpi.KPI_Weight__c = (Decimal) kpiData.get('weight');
            
            Object weightVal = kpiData.get('weight');
            kpi.KPI_Weight__c = (weightVal != null && String.valueOf(weightVal).trim() != '')
                                ? Decimal.valueOf(String.valueOf(weightVal))
                                : null;
            kpi.KPI_Description__c = (String) kpiData.get('description');
    
            kpi.PMS_Base_Templates__c = template.Id;
    
            kpisToInsert.add(kpi);
        }
    
        if (!kpisToInsert.isEmpty()) {
            insert kpisToInsert;
        }
    
        List<PMS_Base_OKR__c> okrsToInsert = new List<PMS_Base_OKR__c>();
    
        for (Map<String, Object> okrData : okrList) {
    
            PMS_Base_OKR__c okr = new PMS_Base_OKR__c();
    
            //okr.Name = (String) okrData.get('Name');
            okr.OKR_Objective__c = (String) okrData.get('okrObjective');
            okr.OKR_Weight__c =  Decimal.valueOf(String.valueOf(okrData.get('weight')));
                                   //(Decimal) okrData.get('weight');
            okr.OKR_Description__c = (String) okrData.get('description');
    		okr.Key_Title__c = (String) okrData.get('keyTitle');
            okr.Key_Target__c = okrData.get('keyTarget') != null
                                ? Decimal.valueOf(String.valueOf(okrData.get('keyTarget')))
                                : null;
            okr.key_unit__c= (String) okrData.get('keyUnit');
            okr.PMS_Base_Templates__c = template.Id;
    
            okrsToInsert.add(okr);
        }
    
        if (!okrsToInsert.isEmpty()) {
            insert okrsToInsert;
        }
    
        List<PMS_Base_Competency__c> compsToInsert = new List<PMS_Base_Competency__c>();
    
        for (Map<String, Object> compData : competencyList) {
    
            PMS_Base_Competency__c comp = new PMS_Base_Competency__c();
    
            comp.Name = (String) compData.get('competencyName');
            comp.Competency_Category__c = (String) compData.get('category');
            comp.Competency_Weight__c = Decimal.valueOf(String.valueOf(compData.get('weight')));
                                       //(Decimal) compData.get('weight');
            comp.Competency_Description__c = (String) compData.get('description');
    		comp.Expected_Behaviour__c = (String) compData.get('behaviour');
            comp.PMS_Base_Templates__c = template.Id;
    
            compsToInsert.add(comp);
        }
    
        if (!compsToInsert.isEmpty()) {
            insert compsToInsert;
        }
    
        return template.Id;
    }
    
    @AuraEnabled
    public static List<PMS_Role_Template__c> getRoleTemplatesByFacility(String facilityId) {
    
        if (facilityId == null) {
            return new List<PMS_Role_Template__c>();
        }
    	List<PMS_Role_Template__c> templates = new List<PMS_Role_Template__c>();
        
        templates = [ SELECT Id, Name,Role__c, Role_Title__c, Template_Description__c,Self_Review__c, Manager_Review__c,Goals_Permission__c,
						(SELECT Id FROM PMS_KPIs__r),
               			(SELECT Id FROM PMS_OKRs__r),
               			(SELECT Id FROM PMS_Competencies__r),
                     	(SELECT Id FROM Staffs__r)  
        			  FROM PMS_Role_Template__c
        			  WHERE Facility__c = :facilityId
        			  ORDER BY CreatedDate DESC
    				];

        return templates;
    }
    @AuraEnabled
    public static List<PMS_Base_Templates__c> getTemplatesByFacility(String facilityId) {
    
        if (facilityId == null) {
            return new List<PMS_Base_Templates__c>();
        }
    	List<PMS_Base_Templates__c> templates = new List<PMS_Base_Templates__c>();
        
        templates = [ SELECT Id, Name, Role_Title__c, Template_Description__c,Self_Review__c, Manager_Review__c,Goals_Permission__c,
						(SELECT Id FROM PMS_Base_KPIs__r),
               			(SELECT Id FROM PMSBase_OKRS__r),
               			(SELECT Id FROM PMS_BaseCompetencys__r)
                     	//(SELECT Id FROM Staffs__r)  
        			  FROM PMS_Base_Templates__c
        			  WHERE Facility__c = :facilityId
        			  ORDER BY CreatedDate DESC
    				];

        return templates;
    }
  /*  @AuraEnabled
    public static List<PMS_Role_Template__c> getTemplatesById(Id templateId) {
    
        if (templateId == null) {
            return new List<PMS_Role_Template__c>();
        }
    	List<PMS_Role_Template__c> templateRecord = [ SELECT Id, Name,Role__c, Role_Title__c, Template_Description__c,Self_Review__c, Manager_Review__c,Goals_Permission__c,
														(SELECT Id,Name,Category__c,KPI_Description__c,KPI_Target__c,Unit__c,KPI_Weight__c FROM PMS_KPIs__r),
               											(SELECT Id,OKR_Description__c,OKR_Objective__c,OKR_Weight__c,Key_Target__c,Key_Title__c,key_unit__c FROM PMS_OKRs__r),
               											(SELECT Id ,Name,Competency_Category__c,Competency_Description__c,Competency_Weight__c,Expected_Behaviour__c FROM PMS_Competencies__r)
        			  								  FROM PMS_Role_Template__c
        			 								  WHERE Id = :templateId
        											  LIMIT 1
                                                      ];

    	return templateRecord;
    }*/
     @AuraEnabled
    public static List<PMS_Base_Templates__c> getTemplatesById(Id templateId) {
    
        if (templateId == null) {
            return new List<PMS_Base_Templates__c>();
        }
    	List<PMS_Base_Templates__c> templateRecord = [ SELECT Id, Name, Role_Title__c, Template_Description__c,Self_Review__c, Manager_Review__c,Goals_Permission__c,
														(SELECT Id,Name,Category__c,KPI_Description__c,KPI_Target__c,Unit__c,KPI_Weight__c FROM PMS_Base_KPIs__r),
               											(SELECT Id,OKR_Description__c,OKR_Objective__c,OKR_Weight__c,Key_Target__c,Key_Title__c,key_unit__c FROM PMSBase_OKRS__r),
               											(SELECT Id ,Name,Competency_Category__c,Competency_Description__c,Competency_Weight__c,Expected_Behaviour__c FROM PMS_BaseCompetencys__r)
        			  								  FROM PMS_Base_Templates__c
        			 								  WHERE Id = :templateId
        											  LIMIT 1
                                                      ];

    	return templateRecord;
    }
  /* @AuraEnabled
    public static list<Staff__c> getStaffsByOrg(Id orgId, Id facilityId,List<String> roleNames) {
        
        System.debug('OrgId: ' + orgId);
        System.debug('FacilityId: ' + facilityId);
        System.debug('RoleNames: ' + roleNames);
        if (roleNames == null || roleNames.isEmpty()) {
            return new List<Staff__c>();
        }
        List<StaffRole__c> matchingRoles = [
            SELECT Id, RoleName__c, StaffRole_To_Staff__c
            FROM StaffRole__c
            WHERE Active__c = true
            AND RoleName__c IN :roleNames
        ];
    
        System.debug('Matching StaffRole__c records: ' + matchingRoles.size());
        
        List<Staff__c> staffList =  [SELECT Id,Facility__r.Name,SelectedRole__c,Manager__c,User_Type__c,Email_Address__c,
                NameToDisplay__c,Status__c,Organization_Name__c,Last_Name__c ,Name,Picture__c,Role__c,Display_Nickname__c,
                Facility__c,Type_of_Employe__c
                FROM Staff__c where Organization__c =: orgId  AND ID IN  
                (SELECT Staff__c FROM Staff_Facility__c WHERE Active__c = true AND Facility__c =:facilityId)  AND Status__c = true
                  AND Id IN ( SELECT StaffRole_To_Staff__c FROM StaffRole__c WHERE Active__c = true AND RoleName__c IN :roleNames)]; // AND Facility__c =: FacilityId
        
        System.debug('Final Staff List Count: ' + staffList.size());
        System.debug('Final Staff List JSON: ' + JSON.serializePretty(staffList));
        return staffList;
    }*/
    
    @AuraEnabled
    public static List<Staff__c> getStaffsByOrg(Id orgId,Id facilityId,List<String> roleNames ) {
    
        System.debug('OrgId: ' + orgId);
        System.debug('FacilityId: ' + facilityId);
        System.debug('RoleNames: ' + roleNames);
    
        String baseQuery ='SELECT Id, Manager__c,PMS_Role_Template__c,PMS_Role_Template__r.Role_Title__c,Email_Address__c,NameToDisplay__c,Name,picture__c,Role__c,Display_Nickname__c, ' +
                '(SELECT Id, RoleName__c, Primary__c ' +
                ' FROM StaffRoles__r ' +        
                ' WHERE Active__c = true ' +
                ' AND Primary__c = true ' +
                ' LIMIT 1) ' +
            'FROM Staff__c ' +
            'WHERE Status__c = true ' +
            'AND Id IN ( ' +
            '   SELECT Staff__c ' +
            '   FROM Staff_Facility__c ' +
            '   WHERE Active__c = true ' +
            '   AND Facility__c = :facilityId ' +
            ')';
    
        //  Only add role filter if roles exist
        if (roleNames != null && !roleNames.isEmpty()) {
    
            baseQuery +=
            ' AND Id IN ( ' +
            '   SELECT StaffRole_To_Staff__c ' +
            '   FROM StaffRole__c ' +
            '   WHERE Active__c = true ' +
            '   AND Primary__c = true ' +
            '   AND RoleName__c IN :roleNames ' +
            ')';
        }
    
        List<Staff__c> staffList = Database.query(baseQuery);
    
        System.debug('Final Staff Count: ' + staffList.size());
    
        return staffList;
    }
   @AuraEnabled
    public static Id createRoleTemplateFromBase(Id baseTemplateId) {
    
        if (baseTemplateId == null) {
            throw new AuraHandledException('Base Template Id required');
        }
    
        PMS_Base_Templates__c baseTemplate = [
            SELECT Facility__c,
                   Role_Title__c,
                   Template_Description__c,
                   Self_Review__c,
                   Manager_Review__c,
                   Goals_Permission__c
            FROM PMS_Base_Templates__c
            WHERE Id = :baseTemplateId
            LIMIT 1
        ];
    
        Map<String, Object> templateData = new Map<String, Object>();
        templateData.put('facilityId', baseTemplate.Facility__c);
        templateData.put('roleTitle', baseTemplate.Role_Title__c);
        templateData.put('description', baseTemplate.Template_Description__c);
        templateData.put('selfReview', baseTemplate.Self_Review__c);
        templateData.put('managerReview', baseTemplate.Manager_Review__c);
        templateData.put('goalsPermission', baseTemplate.Goals_Permission__c);

    
        List<Map<String, Object>> kpiList = new List<Map<String, Object>>();
    
        for (PMS_Base_KPI__c baseKpi : [
            SELECT Name,
                   Category__c,
                   KPI_Target__c,
                   Unit__c,
                   KPI_Weight__c,
                   KPI_Description__c
            FROM PMS_Base_KPI__c
            WHERE PMS_Base_Templates__c = :baseTemplateId
        ]) {
    
            Map<String, Object> kpiData = new Map<String, Object>();
            kpiData.put('kpiName', baseKpi.Name);
            kpiData.put('category', baseKpi.Category__c);
            kpiData.put('target', baseKpi.KPI_Target__c);
            kpiData.put('unit', baseKpi.Unit__c);
            kpiData.put('weight', baseKpi.KPI_Weight__c);
            kpiData.put('description', baseKpi.KPI_Description__c);
    
            kpiList.add(kpiData);
        }

    
        List<Map<String, Object>> okrList = new List<Map<String, Object>>();
    
        for (PMS_Base_OKR__c baseOkr : [
            SELECT OKR_Objective__c,
                   OKR_Weight__c,
                   OKR_Description__c,
                   Key_Title__c,
                   Key_Target__c,
                   Key_Unit__c
            FROM PMS_Base_OKR__c
            WHERE PMS_Base_Templates__c = :baseTemplateId
        ]) {
    
            Map<String, Object> okrData = new Map<String, Object>();
            okrData.put('okrObjective', baseOkr.OKR_Objective__c);
            okrData.put('weight', baseOkr.OKR_Weight__c);
            okrData.put('description', baseOkr.OKR_Description__c);
            okrData.put('keyTitle', baseOkr.Key_Title__c);
            okrData.put('keyTarget', baseOkr.Key_Target__c);
            okrData.put('keyUnit', baseOkr.Key_Unit__c);
    
            okrList.add(okrData);
        }
    
    
        List<Map<String, Object>> competencyList = new List<Map<String, Object>>();
    
        for (PMS_Base_Competency__c baseComp : [
            SELECT Name,
                   Competency_Category__c,
                   Competency_Weight__c,
                   Competency_Description__c,
                   Expected_Behaviour__c
            FROM PMS_Base_Competency__c
            WHERE PMS_Base_Templates__c = :baseTemplateId
        ]) {
    
            Map<String, Object> compData = new Map<String, Object>();
            compData.put('competencyName', baseComp.Name);
            compData.put('category', baseComp.Competency_Category__c);
            compData.put('weight', baseComp.Competency_Weight__c);
            compData.put('description', baseComp.Competency_Description__c);
            compData.put('behaviour', baseComp.Expected_Behaviour__c);
    
            competencyList.add(compData);
        }
    
        Id newTemplateId = saveTemplate1( templateData,kpiList,okrList,competencyList );
    
        return newTemplateId;
    }
    @AuraEnabled
    public static void applyTemplateToStaff(Id templateId,List<Id> staffIds,Date effectiveDate,String roles) {
    
        if (templateId == null || staffIds == null || staffIds.isEmpty()) {
            throw new AuraHandledException('Missing data.');
        }
    	
        List<PMS_Staff_Template__c> recordsToInsert = new List<PMS_Staff_Template__c>();
    	List<Staff__c> staffToUpdate = new List<Staff__c>();
        
        
        
        for (Id staffId : staffIds) {
           // if (!existingStaffIds.contains(staffId)) {
    
                recordsToInsert.add(new PMS_Staff_Template__c(
                PMS_Role_Template__c = templateId,
                Staff__c = staffId,
                
                Effective_Date__c =effectiveDate
                ));
                    
           // }
            // Update staff
            staffToUpdate.add(new Staff__c(
                Id = staffId,
                PMS_Role_Template__c = templateId
            ));
           
        }
    
        if (!recordsToInsert.isEmpty()) {
            insert recordsToInsert;
        }
        if (!staffToUpdate.isEmpty()) {
            update staffToUpdate;
        }
        if (String.isNotBlank(roles)) {

           /* PMS_Role_Template__c templateToUpdate =
                new PMS_Role_Template__c(
                    Id = templateId,
                    Role__c = roles
                );
    
            update templateToUpdate;*/
            
             PMS_Role_Template__c existingTemplate = [
                SELECT Role__c
                FROM PMS_Role_Template__c
                WHERE Id = :templateId
                LIMIT 1
            ];
        
            Set<String> roleSet = new Set<String>();
        
            if (String.isNotBlank(existingTemplate.Role__c)) {
                System.debug('Existing DB Roles: ' + existingTemplate.Role__c);
                roleSet.addAll(existingTemplate.Role__c.split(','));
                System.debug('roleSet AFTER adding existing DB roles: ' + roleSet);
            }
 
            roleSet.addAll(roles.split(','));
            System.debug('roleSet AFTER adding JS roles: ' + roleSet);
            String finalRoles = String.join(new List<String>(roleSet), ',');
            System.debug('Final Roles String to Save: ' + finalRoles);
            existingTemplate.Role__c = finalRoles;
        
            update existingTemplate;
        }
    }
    @AuraEnabled
    public static  List<Map<String, Object>> getStaffsByTemplateId(String templateId) {
         List<Staff__c> staffs = [
            SELECT Id, Name, Role__c, Manager__c, PMS_Role_Template__c,(SELECT Id, RoleName__c FROM StaffRoles__r WHERE Active__c = true AND Primary__c = true LIMIT 1)              
            FROM Staff__c
            WHERE PMS_Role_Template__c =:templateId
        ];
        
         Set<String> managerIds = new Set<String>();
            for (Staff__c s : staffs) {
                if (s.Manager__c != null) {
                    managerIds.add(s.Manager__c);
                }
            }
        
            // Step 3: Query managers
            Map<String, Staff__c> managerMap = new Map<String, Staff__c>();
            for (Staff__c mgr : [
                SELECT Id, Name, Role__c ,(SELECT Id, RoleName__c FROM StaffRoles__r WHERE Active__c = true AND Primary__c = true LIMIT 1)
                FROM Staff__c 
                WHERE Id IN :managerIds
            ]) {
                managerMap.put(mgr.Id, mgr);
            }
        
            // Step 4: Combine and return
            List<Map<String, Object>> result = new List<Map<String, Object>>();
            for (Staff__c s : staffs) {
                Map<String, Object> row = new Map<String, Object>();
                String primaryRole = '';
                if (s.StaffRoles__r != null && !s.StaffRoles__r.isEmpty()) {
                    primaryRole = s.StaffRoles__r[0].RoleName__c;
                }
                row.put('id', s.Id);
                row.put('name', s.Name);
                row.put('role', primaryRole);
                row.put('managerId', s.Manager__c);
        
                if (s.Manager__c != null && managerMap.containsKey(s.Manager__c)) {
                    Staff__c mgr = managerMap.get(s.Manager__c);
                    
                    String managerPrimaryRole = '';
                    if (mgr.StaffRoles__r != null && !mgr.StaffRoles__r.isEmpty()) {
                        managerPrimaryRole = mgr.StaffRoles__r[0].RoleName__c;
                    }
                    row.put('managerName', mgr.Name);
                    row.put('managerRole', managerPrimaryRole);
                } else {
                    row.put('managerName', null);
                    row.put('managerRole', null);
                }
        
                result.add(row);
            }
        
            return result;
        }
    @AuraEnabled
    public static void saveFullReviewCycle(Map<String,Object> data) {
    
        List<Object> templateIds =
            (List<Object>) data.get('selectedTemplateIds');
        String reviewCycleId = (String) data.get('reviewCycleId');
        
        PMS_Review_Cycle__c rc = new PMS_Review_Cycle__c(
            
            Name = (String) data.get('cycleName'),
            Cycle_Type__c = (String) data.get('cycleType'),
            Facility__c = (String) data.get('facilityId'),
            Facility_Name__c = (String) data.get('facilityName'),
            Cycle_Start_Date__c = Date.valueOf((String)data.get('cycleStartDate')),
            Cycle_End_Date__c = Date.valueOf((String)data.get('cycleEndDate')),
            Cycle_Lock_Date__c = Date.valueOf((String)data.get('cycleLockDate')),
            Description__c = (String) data.get('cycleDescription'),
    
            Self_Start_Date__c = Date.valueOf((String)data.get('selfStartDate')),
            Self_End_Date__c = Date.valueOf((String)data.get('selfEndDate')),
            Self_Lock_Date__c = Date.valueOf((String)data.get('selfLockDate')),
    
            Manager_Start_Date__c = Date.valueOf((String)data.get('managerStartDate')),
            Manager_End_Date__c = Date.valueOf((String)data.get('managerEndDate')),
            Manager_Lock_Date__c = Date.valueOf((String)data.get('managerLockDate')),
    
            HR_Start_Date__c = Date.valueOf((String)data.get('hrStartDate')),
            HR_End_Date__c = Date.valueOf((String)data.get('hrEndDate')),
            HR_Lock_Date__c = Date.valueOf((String)data.get('hrLockDate')),
            
            Staff_Count__c = data.containsKey('staffCount') 
                ? Integer.valueOf(String.valueOf(data.get('staffCount')))
                : 0
        );
    	if(String.isNotBlank(reviewCycleId)){
            rc.Id = reviewCycleId;
        }
        upsert  rc;
    	
        if(templateIds != null && !templateIds.isEmpty()){
            
    		List<Id> roleTemplateIdList = new List<Id>();
            List<PMS_Role_Template__c> templatesToUpdate = new List<PMS_Role_Template__c>();
    
            for(Object tempId : templateIds){
                Id roleId = (Id) tempId;
                roleTemplateIdList.add(roleId);
                
                templatesToUpdate.add(
                    new PMS_Role_Template__c(
                        Id = (Id) tempId,
                        PMS_Review_Cycle__c = rc.Id  
                    )
                );
            }
    
            update templatesToUpdate;
            
            List<PMS_Staff_Template__c> staffTemplates = [
            SELECT Id,Status__c, Is_Reviewcycle_Created__c  FROM PMS_Staff_Template__c WHERE PMS_Role_Template__c IN :roleTemplateIdList];

            for(PMS_Staff_Template__c st : staffTemplates){
   
                st.Status__c = 'Assigned to Staff';            
                st.Is_Reviewcycle_Created__c = true; 
    
            }
    
            if(!staffTemplates.isEmpty()){
                update staffTemplates;
            }
        }
    }
    @AuraEnabled
    public static List<PMS_Review_Cycle__c> getReviewCycles(String facilityId,String financialYear) {
    
        if (facilityId == null) {
            return new List<PMS_Review_Cycle__c>();
        }
        Date fyStart;
        Date fyEnd;
    
        if(String.isNotBlank(financialYear)){
    
            List<String> years = financialYear.split('-');
    
            Integer startYear = Integer.valueOf(years[0]);
            Integer endYear = Integer.valueOf(years[1]);
    
            // FY: July 1 → June 30
            fyStart = Date.newInstance(startYear, 7, 1);
            fyEnd   = Date.newInstance(endYear, 6, 30);
        }
    	List<PMS_Review_Cycle__c> cycleList = new List<PMS_Review_Cycle__c>();
        cycleList=  [SELECT Id,Name,Description__c,Cycle_Type__c,Cycle_Start_Date__c,Cycle_End_Date__c,Cycle_Lock_Date__c,Facility_Name__c,Staff_Count__c,
                     (SELECT Id FROM PMS_Role_Templates__r)  
            FROM PMS_Review_Cycle__c WHERE Facility__c = :facilityId  AND Cycle_Start_Date__c >= :fyStart AND Cycle_Start_Date__c <= :fyEnd
            ORDER BY CreatedDate DESC
        ];
        return cycleList;
    }
    @AuraEnabled
    public static Map<String, Object> getReviewCycleInEdit(Id reviewCycleId){
    
        Map<String, Object> response = new Map<String, Object>();
    
        PMS_Review_Cycle__c rc = [
            SELECT Id,Name,Cycle_Type__c,Facility__c,Facility_Name__c,Cycle_Start_Date__c,Cycle_End_Date__c,Cycle_Lock_Date__c,Description__c,Self_Start_Date__c,Staff_Count__c,
                    Self_End_Date__c, Self_Lock_Date__c, Manager_Start_Date__c, Manager_End_Date__c, Manager_Lock_Date__c,HR_Start_Date__c,HR_End_Date__c, HR_Lock_Date__c
            FROM PMS_Review_Cycle__c
            WHERE Id = :reviewCycleId
            LIMIT 1
        ];
    
        List<PMS_Role_Template__c> roleTemplates = [
            SELECT Id
            FROM PMS_Role_Template__c
            WHERE PMS_Review_Cycle__c = :reviewCycleId
        ];
    
        response.put('reviewCycle', rc);
        response.put('roleTemplates', roleTemplates);
    
        return response;
    }

   @AuraEnabled
    public static Map<String,Object> getAllStaffTemplates(Id facilityId) {
    
        if (facilityId == null) {
            throw new AuraHandledException('Facility Id is required');
        }
    
        List<PMS_Staff_Template__c> templates = [
            SELECT Id,
                   Staff__c,
                   Staff__r.Display_Nickname__c,
                   Staff__r.Email_Address__c,
                   Staff__r.Manager__c,
                   PMS_Role_Template__r.PMS_Review_Cycle__r.Name,Status__c , PMS_Role_Template__r.Role_Title__c
            FROM PMS_Staff_Template__c
            WHERE PMS_Role_Template__r.Facility__c = :facilityId AND PMS_Role_Template__r.PMS_Review_Cycle__c != NULL
        ];
    
        // Collect Staff Ids
    
        Set<Id> staffIds = new Set<Id>();
        Set<Id> managerIds = new Set<Id>();
    
        for(PMS_Staff_Template__c st : templates){
    
            if(st.Staff__c != null){
                staffIds.add(st.Staff__c);
            }
    
            if(st.Staff__r.Manager__c != null){
                managerIds.add((Id)st.Staff__r.Manager__c);
            }
        }
    
        // Get Staff Roles
    	List<StaffRole__c> roleList = [ SELECT RoleName__c, StaffRole_To_Staff__c FROM StaffRole__c
            WHERE StaffRole_To_Staff__c IN :staffIds  AND Active__c = true AND Primary__c = true];
        
        Map<Id,String> roleMap = new Map<Id,String>();
    
        for(StaffRole__c role : roleList){
            roleMap.put(role.StaffRole_To_Staff__c, role.RoleName__c);
        }
    
        // Get Manager Names
    	List<Staff__c> managerList = [ SELECT Id, Display_Nickname__c FROM Staff__c WHERE Id IN :managerIds];
        Map<Id,String> managerMap = new Map<Id,String>();
    
        for(Staff__c mgr : managerList){
            managerMap.put(mgr.Id, mgr.Display_Nickname__c);
        }
    
        // Return Result
    
        Map<String,Object> result = new Map<String,Object>();
    
        result.put('templates', templates);
        result.put('roles', roleMap);
        result.put('managers', managerMap);
    
        return result;
    }
    @AuraEnabled
    public static Map<String,Object> getStaffTemplateDetailsById(Id templateId) {
    
        if (templateId == null) {
            throw new AuraHandledException('Staff Template Id required');
            //return new List<PMS_Staff_Template__c>();
        }
      	PMS_Staff_Template__c staffTemplate  = [SELECT Id,Effective_Date__c, Status__c,PMS_Role_Template__c, HR_Adjust_Rating__c,HR_Approve_Promotion__c,
                                                			HR_Bonus_Adjustment__c,HR_Flight_Risk_Level__c,HR_Justification__c,HR_Notes__c,HR_Performance_Rating__c,
                                                			HR_Potential_Rating__c,HR_Readiness_Response__c,HR_Request_Change_to_ManageR__c,HR_Salary_Adjustment__c,HR_Submitted_Date__c,
                                                
														   (SELECT Id,PMS_KPI__c,Staff_Comments__c, Staff_Rating__c,Manager_Comments__c,Manager_Rating__c
                                                            	FROM Staff_Kpi_Responses__r),
                                        
                                                           (SELECT Id, PMS_OKR__c,Staff_Comments__c, Staff_Rating__c,Manager_Rating__c,Manager_Comments__c
                                                            	FROM Staff_Okr_Responses__r),
                                        
                                                           (SELECT Id, PMS_Competency__c, Staff_Comments__c, Staff_Rating__c,Manager_Rating__c,Manager_Comments__c
                                                            	FROM Staff_Competency_Responses__r)
        			  								  FROM PMS_Staff_Template__c
        			 								  WHERE Id = :templateId
        											  LIMIT 1
                                                      ];
         
	
    	PMS_Role_Template__c roleTemplate = [SELECT Id, Role_Title__c,

                                                 (SELECT Id, Name,KPI_Target__c,Unit__c, KPI_Weight__c,KPI_Description__c FROM PMS_KPIs__r),
                                                 
                                                 (SELECT Id, Name,Key_Title__c,Key_Target__c,key_unit__c,OKR_Objective__c, OKR_Weight__c,OKR_Description__c FROM PMS_OKRs__r),
                                                 
                                                 (SELECT Id, Name, Expected_Behaviour__c,Competency_Category__c,Competency_Weight__c,Competency_Description__c FROM PMS_Competencies__r)
                                             
                                            FROM PMS_Role_Template__c
                                            WHERE Id = :staffTemplate.PMS_Role_Template__c
                                            LIMIT 1
                                        ];
		
        Map<String,Object> result = new Map<String,Object>();
    
        result.put('staffTemplate', staffTemplate);
        result.put('roleTemplate', roleTemplate);
    
        return result;
        
    }
    
    @AuraEnabled
    public static void saveHrResponseData(Map<String, Object> hrData,Id templateId ){
		
        if (templateId == null) {
            throw new AuraHandledException('Staff Template Id required');
            //return new List<PMS_Staff_Template__c>();
        }
        List<PMS_Staff_Template__c> templates = [SELECT Id FROM PMS_Staff_Template__c WHERE Id = :templateId  LIMIT 1];
		
        if(templates.isEmpty()){
            throw new AuraHandledException('Template record not found');
        }
    
        PMS_Staff_Template__c template = templates[0];
        
        template.HR_Performance_Rating__c = (String) hrData.get('performanceRating');
        template.HR_Potential_Rating__c = (String) hrData.get('potentialRating');
        template.HR_Flight_Risk_Level__c = (String) hrData.get('flightRiskLevel');
        template.HR_Readiness_Response__c = (String) hrData.get('readinessLevel');

        //template.HR_Adjust_Rating__c = (Decimal) hrData.get('adjustRating');
        template.HR_Adjust_Rating__c = hrData.get('adjustRating') != null
            ? Decimal.valueOf(String.valueOf(hrData.get('adjustRating')))
            : null;
        template.HR_Justification__c = (String) hrData.get('justification');

        //template.HR_Salary_Adjustment__c = (Decimal) hrData.get('salaryAdjustment');
        //template.HR_Bonus_Adjustment__c = (Decimal) hrData.get('bonusAdjustment');
        template.HR_Salary_Adjustment__c = hrData.get('salaryAdjustment') != null
            ? Decimal.valueOf(String.valueOf(hrData.get('salaryAdjustment')))
            : null;

		template.HR_Bonus_Adjustment__c = hrData.get('bonusAdjustment') != null
            ? Decimal.valueOf(String.valueOf(hrData.get('bonusAdjustment')))
            : null;

        template.HR_Approve_Promotion__c = (Boolean) hrData.get('approvePromotion');
        template.HR_New_Job_Title__c = (String) hrData.get('newJobTitle');

        template.HR_Notes__c = (String) hrData.get('hrNotes');
        template.HR_Request_Change_to_Manager__c = (String) hrData.get('managerRequest');
        template.Status__c = 'Completed';
        template.HR_Submitted_Date__c = Date.today();

        update template ;
    }
    @AuraEnabled
    public static void ReassignToManager(Id staffTemplateId) {
        
        if (staffTemplateId == null) {
            throw new AuraHandledException('Staff Template Id is required');
        }
        
        PMS_Staff_Template__c templateRecord = new PMS_Staff_Template__c();
        templateRecord.Id = staffTemplateId;
        templateRecord.Status__c = 'Submitted to Manager';
        update templateRecord;
    }
    
     @AuraEnabled
    public static List<PMS_Goal__c> getAllGoalsByFacility(Id facilityId){
    
        if(facilityId == null){
            return new List<PMS_Goal__c>();
        }
    
        List<PMS_Goal__c> goals = [ SELECT Id, Goal_Title__c, Goal_Type__c,Goal_Status__c,Goal_Start_Date__c, Goal_End_Date__c,Staff__c,Staff__r.Display_Nickname__c,Staff__r.Manager__c
            						FROM PMS_Goal__c
                                    WHERE Staff__c IN (
                                       SELECT Staff__c
                                       FROM Staff_Facility__c
                                       WHERE Facility__c = :facilityId
                                       AND Active__c = true
                                   )
                                   ORDER BY CreatedDate DESC
                                  ];
    
        return goals;
    } 
    
     @AuraEnabled
    public static  Map<String, Object> getHrCoachingSessions( String facilityId){
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
    	    WHERE Facility__c=:facilityId  AND (isScheduledCoaching__c = true OR isCreatedByManager__c = true)
             //WHERE Facility__c=:facilityId  
        ORDER BY CreatedDate DESC
        ];
        System.debug('Sessions Count1: ' + sessions.size());
        System.debug(' sessions : '+sessions );
        
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

   
}