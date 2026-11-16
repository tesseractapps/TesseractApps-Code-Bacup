public with sharing class HRTraining { 

    public class TrainingWrapper {
    @AuraEnabled public Id id;
    @AuraEnabled public String name;
    @AuraEnabled public String category;
    @AuraEnabled public String categoryClass;
    @AuraEnabled public String roles;
    @AuraEnabled public Boolean mandatory;
    @AuraEnabled public Boolean visibleToStaff;
    @AuraEnabled public Boolean renewalRequired;
    @AuraEnabled public String validFor;
    @AuraEnabled public string notes;
     @AuraEnabled public string courseOwnerId;
    @AuraEnabled public string  wyzedCourseId;
    @AuraEnabled public String uid;
}
public class TrainingResponseWrapper {
    @AuraEnabled public List<TrainingWrapper> trainings;
    @AuraEnabled public Integer mandatoryCount;
    @AuraEnabled public Integer visibleCount;
    @AuraEnabled public Integer renewalCount;
    @AuraEnabled public Integer totalCount;
}

@AuraEnabled
public static TrainingResponseWrapper getTrainings(String orgId) {

    List<Training__c> trainings = [
        SELECT Id, Name, Training_UID__c,
               Module_Name__c, Valid_For__c,
               Description__c,
               Start_Date__c, Training_Category__c, Visible_to_Staff__c,
               End_Date__c,
               Renewal_Date__c,
               Renewal_Date_Required__c,
               Is_Wyzed_Course__c,
               Organization__c,Notes__c,
               Course_Owner_Id__c,
               Wyzed_Course_ID__c,
               Mandatory_Document__c,(SELECT Roles__c FROM Facility_Compliance_Settings__r)
        FROM Training__c
        WHERE Organization__c = :orgId
        AND Is_Wyzed_Course__c = true AND Course_Owner_Id__c !=null
        ORDER BY CreatedDate DESC
    ];

    TrainingResponseWrapper response = new TrainingResponseWrapper();
    response.trainings = new List<TrainingWrapper>();

    Integer mandatory = 0;
    Integer visible = 0;
    Integer renewal = 0;

    for (Training__c t : trainings) {
        TrainingWrapper w = new TrainingWrapper();

        w.id = t.Id;
        w.name = t.Module_Name__c;
        w.category = t.Training_Category__c;
        w.categoryClass = 'category-default';
    
        w.mandatory = t.Mandatory_Document__c;
        w.visibleToStaff = t.Visible_to_Staff__c;
        w.renewalRequired = t.Renewal_Date_Required__c;
        w.validFor = t.Valid_For__c;
        Set<String> uniqueRoles = new Set<String>();

        if (t.Facility_Compliance_Settings__r != null) {

            for (Facility_Compliance_Setting__c child : t.Facility_Compliance_Settings__r) {

                if (!String.isBlank(child.Roles__c)) {
                    for (String role : child.Roles__c.split(';')) {
                        uniqueRoles.add(role.trim());
                    }
                }
            }
        }

        // ✅ assign roles
       w.roles = String.join(new List<String>(uniqueRoles), ';');

        // ✅ assign notes from parent
        w.notes = t.Notes__c;
        w.courseOwnerId = t.Course_Owner_Id__c;
         w.wyzedCourseId = t.Wyzed_Course_ID__c;
         w.uid = t.Training_UID__c;
        // ✅ Count logic
        if (t.Mandatory_Document__c) mandatory++;
        if (t.Visible_to_Staff__c) visible++;
        if (t.Renewal_Date_Required__c) renewal++;

        response.trainings.add(w);
    }

    response.mandatoryCount = mandatory;
    response.visibleCount = visible;
    response.renewalCount = renewal;
    response.totalCount = trainings.size();

    return response;
}

    @AuraEnabled
    public static List<Training__c> getTrainingById(String recordId) {
        Id validId;
        try { validId = (Id) recordId; } catch (Exception e) { validId = null; }
        return [SELECT Id, Name, Training_UID__c,
               Module_Name__c, Valid_For__c,
               Description__c,
               Start_Date__c, Training_Category__c, Visible_to_Staff__c,
               End_Date__c,
               Renewal_Date__c,
               Renewal_Date_Required__c,
               Is_Wyzed_Course__c,
               Organization__c,Notes__c,
               Course_Owner_Id__c,
               Wyzed_Course_ID__c,
               Mandatory_Document__c 
               FROM Training__c 
               WHERE (Id = :validId OR Training_UID__c = :recordId) LIMIT 1];
    }

    
     @AuraEnabled
    public static List<Assignment__c> getStaffAssignmentsbyId(String staffId) {
        system.debug('staffId ' + staffId);
        List<Assignment__c> assignList= new List<Assignment__c>();
         String UserEmail = UserInfo.getUserEmail();
         String query='SELECT Id,Module_Name__r.Name,Module_Name__r.Attachments__c,Module_Name__r.Courses__c,Staff__r.Name,Staff__r.Last_Name__c,Staff__r.Email_Address__c,Module_Name__r.description__c,Due_Date__c,Status__c,Completed_Date__c FROM Assignment__c where staff__c=:staffId Order by Due_Date__c desc '; //where Organization_Name__c=:OrganizationName
         system.debug('query' + query);
     	 assignList =Database.query(query);
        system.debug(assignList);
        return assignList;
       
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Assignment__c> getAssignmentsById(Id recordId) {
        return [SELECT Id,Module_Name__r.Name,Module_Name__r.Attachments__c,Staff__r.Name,Staff__r.Last_Name__c,Staff__r.Facility__c,Staff__r.Display_Nickname__c,Staff__r.Email_Address__c,Module_Name__r.description__c,Due_Date__c,Status__c FROM Assignment__c where Staff__c  =: recordId Order by Due_Date__c desc];
 
       
    }
     @AuraEnabled
    public static Id createTraining(String name, Date startDate, Date endDate, String description, String courses, String CurrentOrgId ) {
        system.debug('name'+name);
        system.debug('startDate'+startDate);
        system.debug('endDate'+endDate);
        system.debug('description'+description);
        system.debug('courses'+courses);
        Training__c training = new Training__c(
            Name = name,
            start_date__c = startDate,
            end_date__c = endDate,
            description__c = description,
            Courses__c = courses,
            Organization__c = CurrentOrgId
        );
        
        insert training;
        return training.Id;
    } 

     @AuraEnabled
    public static void upsertTrainings(String modulesJson,string orgId) {
        List<Training__c> recordsToUpsert = new List<Training__c>();

        // Deserialize incoming data
        List<Object> modules = (List<Object>) JSON.deserializeUntyped(modulesJson);

        for (Object obj : modules) {
            Map<String, Object> m = (Map<String, Object>) obj;

            Training__c t = new Training__c();

            // 🔹 External ID (critical)
           t.Wyzed_Course_ID__c = String.valueOf(m.get('wyzedCourseId'));
           

            t.module_name__c = (String) m.get('module_name');
            t.description__c = (String) m.get('description');

            t.start_date__c = (String) m.get('startDate') != null 
                ? Date.valueOf((String) m.get('startDate')) 
                : null;

            t.end_date__c = (String) m.get('endDate') != null 
                ? Date.valueOf((String) m.get('endDate')) 
                : null;

           // t.Renewal_Date_Required__c = (Boolean) m.get('renewalEnabled');

           // t.Renewal_Date__c = (String) m.get('renewalDate') != null   ? Date.valueOf((String) m.get('renewalDate'))  : null;
             t.Organization__c=orgId;
             t.Course_Owner_Id__c=String.valueOf(m.get('courseOwnerId'));
             t.Is_Wyzed_Course__c=true;

            recordsToUpsert.add(t);
        }

        // 🔹 MAGIC LINE (Upsert using External ID)
        upsert recordsToUpsert Wyzed_Course_ID__c;
    }

  @AuraEnabled
    public static void upsertFacilityCompliance(String requestJson){

        List<FacilityRoleWrapper> requestList = 
            (List<FacilityRoleWrapper>) JSON.deserialize(
                requestJson, 
                List<FacilityRoleWrapper>.class
            );

        if (requestList == null || requestList.isEmpty()) return;

        // ✅ Collect keys
        Set<Id> facilityIds = new Set<Id>();
        Set<Id> trainingIds = new Set<Id>();

        for (FacilityRoleWrapper req : requestList) {
            facilityIds.add((Id)req.facilityId);
            trainingIds.add(req.trainingId);
        }

        // ✅ Fetch ALL existing records for those trainings
        Map<String, Facility_Compliance_Setting__c> existingMap = new Map<String, Facility_Compliance_Setting__c>();
        Set<String> existingKeys = new Set<String>();

        for (Facility_Compliance_Setting__c rec : [
            SELECT Id, Facility__c, Training__c
            FROM Facility_Compliance_Setting__c
            WHERE Training__c IN :trainingIds
        ]) {
            String key = rec.Facility__c + '-' + rec.Training__c;
            existingMap.put(key, rec);
            existingKeys.add(key);
        }

        // ✅ Incoming keys
        Set<String> incomingKeys = new Set<String>();
        for (FacilityRoleWrapper req : requestList) {
            incomingKeys.add(req.facilityId + '-' + req.trainingId);
        }

        List<Facility_Compliance_Setting__c> toUpsert = new List<Facility_Compliance_Setting__c>();
        List<Facility_Compliance_Setting__c> toDelete = new List<Facility_Compliance_Setting__c>();

        // ✅ UPSERT (Insert + Update)
        for (FacilityRoleWrapper req : requestList) {

            String key = req.facilityId + '-' + req.trainingId;

            Facility_Compliance_Setting__c rec;

            if (existingMap.containsKey(key)) {
                // 🔄 UPDATE
                rec = existingMap.get(key);
            } else {
                // ➕ INSERT
                rec = new Facility_Compliance_Setting__c();
                rec.Facility__c = (Id)req.facilityId;
                rec.Training__c = req.trainingId;
            }

            rec.Roles__c = req.roles;

            rec.Document_Name__c = req.name;
            rec.Training_Category__c = req.category;
            rec.Valid_For__c = req.validFor;
            rec.Compliance_Category__c = 'Trainings';
            rec.Mandatory_Document__c = req.mandatory;
            rec.Visible_To_Staff__c = true;
            rec.Expiry_Date_Required__c = req.renewalRequired;
            rec.Notes__c = req.notes;

            toUpsert.add(rec);
        }

        // ✅ DELETE removed facilities
        for (String key : existingKeys) {
            if (!incomingKeys.contains(key)) {
                toDelete.add(existingMap.get(key));
            }
        }

        // ✅ Update parent training (common fields)
        Training__c trainingToUpdate = new Training__c(
            Id = requestList[0].trainingId,
            Training_Category__c = requestList[0].category,
            Valid_For__c = requestList[0].validFor,
            Mandatory_Document__c = requestList[0].mandatory,
            Visible_to_Staff__c = requestList[0].visibleToStaff,
            Renewal_Date_Required__c = requestList[0].renewalRequired,
            Notes__c = requestList[0].notes
        );

        // ✅ DML operations
        if (!toUpsert.isEmpty()) {
            upsert toUpsert;
        }

        if (!toDelete.isEmpty()) {
            delete toDelete;
        }

        update trainingToUpdate;
    } 

@AuraEnabled 
    public static list<Facility_Compliance_Setting__c> getFacilityComplianceByTraining(string trainingId){
     list<Facility_Compliance_Setting__c>  trainingComplainace=[ SELECT Id, Name,  Mandatory_Document__c, Visible_to_Staff__c, Expiry_Date_Required__c, Notes__c, Roles__c, Document_Name__c, Facility__c, Status__c, Require_excuse_for_missed__c, Training_Category__c, Valid_For__c, Is_Active__c FROM Facility_Compliance_Setting__c
      where Training__c=: trainingId ];
      return trainingComplainace;

}

    @AuraEnabled
    public static void updateTrainingToggle(Id trainingId, String fieldName, Boolean fieldValue) {

        if (trainingId == null || String.isBlank(fieldName)) {
            throw new AuraHandledException('Invalid input');
        }

        // ✅ Determine Parent + Child field mapping
        String parentField;
        String childField;

        if (fieldName == 'mandatory') {
            parentField = 'Mandatory_Document__c';
            childField = 'Mandatory_Document__c';

        } else if (fieldName == 'visibleToStaff') {
            parentField = 'Visible_to_Staff__c';
            childField = 'Visible_To_Staff__c';

        } else if (fieldName == 'renewalRequired') {
            parentField = 'Renewal_Date_Required__c';
            childField = 'Expiry_Date_Required__c';

        } else {
            throw new AuraHandledException('Invalid field');
        }

        // ✅ Update Parent Training
        Training__c training = new Training__c(Id = trainingId);
        training.put(parentField, fieldValue);

        // ✅ Fetch all child records
        List<Facility_Compliance_Setting__c> children = [
            SELECT Id
            FROM Facility_Compliance_Setting__c
            WHERE Training__c = :trainingId
        ];

        // ✅ Update child records
        for (Facility_Compliance_Setting__c rec : children) {
            rec.put(childField, fieldValue);
        }

        // ✅ Perform DML
        update training;

        if (!children.isEmpty()) {
            update children;
        }
    }


    public class FacilityRoleWrapper {

        @AuraEnabled public String facilityId;
        @AuraEnabled public String roles;

        @AuraEnabled public Id trainingId;

        @AuraEnabled public String name;
        @AuraEnabled public String category;
        @AuraEnabled public String validFor;

        @AuraEnabled public Boolean mandatory;
        @AuraEnabled public Boolean visibleToStaff;
        @AuraEnabled public Boolean renewalRequired;

        @AuraEnabled public String notes;
    }
}