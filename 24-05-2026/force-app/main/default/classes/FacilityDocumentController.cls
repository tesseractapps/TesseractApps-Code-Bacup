public with sharing class FacilityDocumentController {

    @AuraEnabled
    public static List<Facility_Compliance_Setting__c> getDocuments(Id facilityId, Integer refreshKey) {
        try {
            System.debug('📥 Fetching Documents for Facility: ' + facilityId);

            return [
                SELECT Id, Name,
                       Document_Name__c,
                       Documents_Category__c,
                       X100_pointcheck__c,
                       Mandatory_Document__c,
                       Visible_to_Staff__c,
                       Expiry_Date_Required__c,
                       Reminder1__c,
                       Reminder2__c,
                       Notes__c,
                       Roles__c,
                       Facility__c,
                       Compliance_Category__c,
                       Training_Category__c,
                       Valid_For__c,
                       Identity_Category__c,
                       Identity_Points__c,
                       Status__c

                FROM Facility_Compliance_Setting__c
                WHERE Facility__c = :facilityId
                ORDER BY CreatedDate DESC
            ];

        } catch (Exception e) {
            throw new AuraHandledException('Error fetching documents: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static Facility_Compliance_Setting__c saveDocument(
        Facility_Compliance_Setting__c recordData,
        Id facilityId
    ) {
        try {
            System.debug('📤 Saving Document for Facility: ' + facilityId);

            recordData.Compliance_Category__c = 'Documents';
            recordData.Facility__c = facilityId;

            upsert recordData;
            return recordData;

        } catch (Exception e) {
            throw new AuraHandledException('Error saving document: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static List<Facility_Compliance_Setting__c> getOrganisationDocuments(Id organisationId) {
        try {

            System.debug('📥 Fetching Documents for Organisation: ' + organisationId);

            if (organisationId == null) {
                throw new AuraHandledException('Organisation Id is required.');
            }

            List<Facility_Compliance_Setting__c> documents = [
                SELECT Id, Name,
                    Document_Name__c,
                    Documents_Category__c,
                    X100_pointcheck__c,
                    Mandatory_Document__c,
                    Visible_to_Staff__c,
                    Expiry_Date_Required__c,
                    Reminder1__c,
                    Reminder2__c,
                    Notes__c,
                    Org_Roles__c,
                    Organisation__c,
                    Facility__c,
                    Compliance_Category__c,
                    Training_Category__c,
                    Valid_For__c,
                    Identity_Category__c,
                    Identity_Points__c,
                    Status__c
                FROM Facility_Compliance_Setting__c
                WHERE Organisation__c = :organisationId
                AND Compliance_Category__c = 'Documents'
                ORDER BY CreatedDate DESC
            ];

            System.debug('📄 Total Organisation Documents Found: ' + documents.size());

            return documents;

        } catch (Exception e) {
            throw new AuraHandledException('Error fetching organisation documents: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static Facility_Compliance_Setting__c saveDocumentForOrganisation(
        Facility_Compliance_Setting__c recordData,
        Id organisationId
    ) {
        try {

            System.debug('📤 Saving Document for Organisation: ' + organisationId);

            if (organisationId == null) {
                throw new AuraHandledException('Organisation Id is required.');
            }

            // Always link record to organisation
            recordData.Organisation__c = organisationId;

            // Ensure category
            recordData.Compliance_Category__c = 'Documents';

            // 🔹 INSERT or UPDATE logic
            if (recordData.Id == null) {

                System.debug('🆕 Creating new organisation document');
                insert recordData;

            } else {

                System.debug('✏️ Updating existing organisation document: ' + recordData.Id);
                update recordData;
            }

            System.debug('✅ Save successful: ' + recordData.Id);

            return recordData;

        } catch (AuraHandledException e) {
            throw e;

        } catch (Exception e) {
            throw new AuraHandledException(
                'Error saving organisation document: ' + e.getMessage()
            );
        }
    }

    @AuraEnabled
    public static void deleteDocument(Id recId) {
        try {
            // Load document with all necessary fields
            Facility_Compliance_Setting__c doc = [
                SELECT Id, 
                    Document_Name__c, 
                    Compliance_Category__c,
                    Facility__r.Selected_Documents__c,
                    Facility__r.Selected_Trainings__c
                FROM Facility_Compliance_Setting__c
                WHERE Id = :recId
                LIMIT 1
            ];
            
            // Check based on category
            if (doc.Compliance_Category__c == 'Documents') {
                // Check if document is in Selected_Documents__c
                if (String.isNotBlank(doc.Facility__r.Selected_Documents__c)) {
                    Set<String> selectedDocs = new Set<String>();
                    // Split and clean up the selected documents
                    for (String item : doc.Facility__r.Selected_Documents__c.split(';')) {
                        if (String.isNotBlank(item)) {
                            selectedDocs.add(item.trim());
                        }
                    }
                    
                    // Normalize for comparison
                    String normalizedDocName = doc.Document_Name__c != null 
                        ? doc.Document_Name__c.trim() 
                        : '';
                        
                    if (selectedDocs.contains(normalizedDocName)) {
                        // Use AuraHandledException with a clean message
                        throw new AuraHandledException('This document was selected for the Facility and cannot be deleted.');
                    }
                }
            } 
            else if (doc.Compliance_Category__c == 'Trainings') {
                // Check if training is in Selected_Trainings__c
                if (String.isNotBlank(doc.Facility__r.Selected_Trainings__c)) {
                    Set<String> selectedTrainings = new Set<String>();
                    // Split and clean up the selected trainings
                    for (String item : doc.Facility__r.Selected_Trainings__c.split(';')) {
                        if (String.isNotBlank(item)) {
                            selectedTrainings.add(item.trim());
                        }
                    }
                    
                    // Normalize for comparison
                    String normalizedTrainingName = doc.Document_Name__c != null 
                        ? doc.Document_Name__c.trim() 
                        : '';
                        
                    if (selectedTrainings.contains(normalizedTrainingName)) {
                        // Use AuraHandledException with a clean message
                        throw new AuraHandledException('This training was selected for the Facility and cannot be deleted.');
                    }
                }
            }
            
            // If not selected, delete the record
            delete doc;
            
        } catch (System.QueryException e) {
            // Handle record not found
            System.debug('QueryException: ' + e.getMessage());
            throw new AuraHandledException('Record not found or you do not have permission to access it.');
            
        } catch (System.DmlException e) {
            // Handle delete permission issues
            System.debug('DmlException: ' + e.getMessage());
            throw new AuraHandledException('You do not have permission to delete this record.');
            
        } catch (AuraHandledException e) {
            // Re-throw our custom exceptions
            System.debug('Custom AuraHandledException: ' + e.getMessage());
            throw e;
            
        } catch (Exception e) {
            // Handle any other exceptions
            System.debug('General Exception: ' + e.getMessage() + ' | Stack: ' + e.getStackTraceString());
            
            // Clean up the error message to avoid showing internal details
            String cleanMessage = 'An error occurred while deleting the record.';
            if (e.getMessage().contains('FIELD_CUSTOM_VALIDATION_EXCEPTION')) {
                cleanMessage = 'A validation rule prevented the deletion.';
            } else if (e.getMessage().contains('INSUFFICIENT_ACCESS_OR_READONLY')) {
                cleanMessage = 'You do not have permission to delete this record.';
            }
            
            throw new AuraHandledException(cleanMessage);
        }
    }

    @AuraEnabled
    public static void deleteOrganisationDocument(Id documentId) {
        try {

            System.debug('🗑 Deleting Organisation Document: ' + documentId);

            if (documentId == null) {
                throw new AuraHandledException('Document Id is required.');
            }

            Facility_Compliance_Setting__c doc = [
                SELECT Id, Organisation__c
                FROM Facility_Compliance_Setting__c
                WHERE Id = :documentId
                LIMIT 1
            ];

            delete doc;

            System.debug('✅ Organisation document deleted successfully');

        } catch (AuraHandledException e) {
            throw e;

        } catch (Exception e) {
            throw new AuraHandledException('Error deleting organisation document: ' + e.getMessage());
        }
    }

    @AuraEnabled(cacheable=false)
    public static List<String> getFacilityRoles(Id facilityId) {
        try {
            System.debug('📥 Fetching Facility Roles for Facility: ' + facilityId);

            List<Facility_Role__c> roles = [
                SELECT Role_Name__c, Is_Active__c
                FROM Facility_Role__c
                WHERE Facility__c = :facilityId
                AND Is_Active__c = TRUE
                ORDER BY Role_Name__c
            ];

            // Convert SObject list → string list
            List<String> roleNames = new List<String>();

            for (Facility_Role__c r : roles) {
                roleNames.add(r.Role_Name__c);
            }

            return roleNames;

        } catch (Exception e) {
            throw new AuraHandledException('Error fetching facility roles: ' + e.getMessage());
        }
    }

        @AuraEnabled
        public static Facility_Compliance_Setting__c saveTraining(
            Facility_Compliance_Setting__c recordData,
            Id facilityId
        ) {
            try {
                System.debug('📤 Saving Document for Facility: ' + facilityId);

                recordData.Compliance_Category__c = 'Trainings';
                recordData.Facility__c = facilityId;

                upsert recordData;
                return recordData;

            } catch (Exception e) {
                throw new AuraHandledException('Error saving Training: ' + e.getMessage());
            }
        }

    @AuraEnabled
    public static Facility_Compliance_Setting__c saveIdentity(
        Facility_Compliance_Setting__c recordData,
        Id facilityId
    ) {
        try {
            System.debug('📤 Saving Document for Facility: ' + facilityId);

            recordData.Compliance_Category__c = 'Identity';
            recordData.Facility__c = facilityId;

            upsert recordData;
            return recordData;

        } catch (Exception e) {
            throw new AuraHandledException('Error saving Identity: ' + e.getMessage());
        }
    }
  
        @AuraEnabled
        public static String saveFacilityComplianceSettings(
            List<Facility_Compliance_Setting__c> settings,
            Id facilityId
        ) {
            if (facilityId == null) {
                throw new AuraHandledException('Facility Id is required.');
            }

            if (settings == null || settings.isEmpty()) {
                return 'NO_ACTIVE_RULES';
            }

            // 1. Query existing records for this facility
            Map<String, Facility_Compliance_Setting__c> existing = new Map<String, Facility_Compliance_Setting__c>();

            for (Facility_Compliance_Setting__c rec : [
                SELECT Id, Compliance_Type__c, Facility__c
                FROM Facility_Compliance_Setting__c
                WHERE Facility__c = :facilityId
            ]) {
                String key = rec.Facility__c + '|' + rec.Compliance_Type__c;
                existing.put(key, rec);
            }

            List<Facility_Compliance_Setting__c> toInsert = new List<Facility_Compliance_Setting__c>();
            List<Facility_Compliance_Setting__c> toUpdate = new List<Facility_Compliance_Setting__c>();

            // 2. Process incoming records
            for (Facility_Compliance_Setting__c incoming : settings) {

                incoming.Facility__c = facilityId;

                // The correct unique key
                String incomingKey = facilityId + '|' + incoming.Compliance_Type__c;

                if (existing.containsKey(incomingKey)) {

                    // Update existing record
                    Facility_Compliance_Setting__c oldRec = existing.get(incomingKey);
                    incoming.Id = oldRec.Id;
                    toUpdate.add(incoming);

                } else {
                    // Insert new record
                    toInsert.add(incoming);
                }
            }

            // 3. Perform DML
            if (!toInsert.isEmpty()) insert toInsert;
            if (!toUpdate.isEmpty()) update toUpdate;

            return 'SUCCESS';
        }

        @AuraEnabled
        public static List<Facility_Compliance_Setting__c> loadFacilityComplianceSettings(Id facilityId) {

            if (facilityId == null) {
                throw new AuraHandledException('Facility Id is required for loading.');
            }

            return [
                SELECT 
                    Id,
                    Compliance_Type__c,
                    Is_Active__c,
                    Apply_to_specific_roles__c,
                    Roles__c,
                    Max_Consecutive_Days__c,
                    Min_Hours_Between_Shifts__c,
                    Max_Hours_Per_Week__c,
                    Max_Hours_Per_Shift__c,
                    Require_Break_Everyhours__c,
                    Break_Duration_minutes__c,
                    Max_Late_Clock_In_minutes__c,
                    Allowed_Late_Instances_Per_Month__c,
                    Max_Missed_Shifts_Per_Month__c,
                    Require_excuse_for_missed__c
                FROM Facility_Compliance_Setting__c
                WHERE Facility__c = :facilityId
            ];
        }

        // Change from private to public
        public static String getCategoryForDocument(String docName, String serviceType) {
            // Map common document names to categories
            Map<String, String> categoryMap = new Map<String, String>();
            
            // NDIS documents
            categoryMap.put('NDIS Worker Screening', 'Compliance');
            categoryMap.put('Police Check', 'Compliance');
            categoryMap.put('Right to Work (Passport/Visa)', 'Compliance');
            categoryMap.put('WWCC (Working With Children Check)', 'Compliance');
            categoryMap.put('First Aid / CPR', 'Qualification');
            categoryMap.put('Relevant Qualification (Cert III)', 'Qualification');
            
            // Nursing documents
            categoryMap.put('AHPRA Registration', 'Qualification');
            categoryMap.put('Immunisation / Vaccination', 'Compliance');
            categoryMap.put('Qualification (RN/EN Certificate)', 'Qualification');
            
            // Child Care documents
            categoryMap.put('Child Protection Training', 'Training');
            categoryMap.put('WWCC', 'Compliance');
            categoryMap.put('First Aid', 'Qualification');
            categoryMap.put('Early Childhood Qualification (Cert III / Diploma)', 'Qualification');
            
            // Default to "Policy/Acknowledgement" for unknown documents
            return categoryMap.get(docName) ?? 'Policy/Acknowledgement';
        }

    @AuraEnabled
    public static void syncFacilityDocuments(Id facilityId) {
        try {
            System.debug('🔄 Syncing Documents + Trainings for Facility: ' + facilityId);

            // ----------------------------------------------------
            // 1. Load facility selections (SOURCE OF TRUTH)
            // ----------------------------------------------------
            Facility__c facility = [
                SELECT Id,
                    Selected_Documents__c,
                    Selected_Trainings__c
                FROM Facility__c
                WHERE Id = :facilityId
                LIMIT 1
            ];

            // Store original selections (used to protect manual records)
            Set<String> originalDocs = new Set<String>();
            Set<String> originalTrainings = new Set<String>();

            if (facility.Selected_Documents__c != null) {
                for (String doc : facility.Selected_Documents__c.split(';')) {
                    String clean = doc.trim().toLowerCase();
                    if (!String.isBlank(clean)) originalDocs.add(clean);
                }
            }

            if (facility.Selected_Trainings__c != null) {
                for (String training : facility.Selected_Trainings__c.split(';')) {
                    String clean = training.trim().toLowerCase();
                    if (!String.isBlank(clean)) originalTrainings.add(clean);
                }
            }

            Map<String, String> categoryMap = new Map<String, String>{
                'Documents' => facility.Selected_Documents__c,
                'Trainings' => facility.Selected_Trainings__c
            };

            // ----------------------------------------------------
            // 2. Fetch existing compliance settings
            // ----------------------------------------------------
            List<Facility_Compliance_Setting__c> existingAll = [
                SELECT Id,
                    Compliance_Category__c,
                    Document_Name__c,
                    Expiry_Date_Required__c,
                    Status__c
                FROM Facility_Compliance_Setting__c
                WHERE Facility__c = :facilityId
                AND Compliance_Category__c IN ('Documents', 'Trainings')
            ];

            Map<String, Map<String, Facility_Compliance_Setting__c>> existingMap =
                new Map<String, Map<String, Facility_Compliance_Setting__c>>();

            for (Facility_Compliance_Setting__c rec : existingAll) {
                if (String.isBlank(rec.Document_Name__c)) continue;

                String category = rec.Compliance_Category__c;
                String cleanName = rec.Document_Name__c.trim().toLowerCase();

                if (!existingMap.containsKey(category)) {
                    existingMap.put(category, new Map<String, Facility_Compliance_Setting__c>());
                }
                existingMap.get(category).put(cleanName, rec);
            }

            List<Facility_Compliance_Setting__c> toInsert = new List<Facility_Compliance_Setting__c>();
            List<Facility_Compliance_Setting__c> toUpdate = new List<Facility_Compliance_Setting__c>();
            List<Facility_Compliance_Setting__c> toDelete = new List<Facility_Compliance_Setting__c>();

            // ----------------------------------------------------
            // 3. PROCESS DOCUMENTS + TRAININGS
            // ----------------------------------------------------
            for (String category : categoryMap.keySet()) {

                String selected = categoryMap.get(category);
                Set<String> originalSelection =
                    category == 'Documents' ? originalDocs : originalTrainings;

                Map<String, Facility_Compliance_Setting__c> existingForCategory =
                    existingMap.containsKey(category)
                        ? existingMap.get(category)
                        : new Map<String, Facility_Compliance_Setting__c>();

                // If nothing selected → delete only synchronized records
                if (String.isBlank(selected)) {
                    for (Facility_Compliance_Setting__c rec : existingForCategory.values()) {
                        String clean = rec.Document_Name__c.trim().toLowerCase();
                        if (originalSelection.contains(clean)) {
                            toDelete.add(rec);
                        }
                    }
                    continue;
                }

                // Normalize current selections
                Set<String> currentSelectedSet = new Set<String>();
                List<String> finalSelected = new List<String>();

                for (String item : selected.split(';')) {
                    if (String.isBlank(item)) continue;
                    String clean = item.trim().toLowerCase();
                    if (currentSelectedSet.add(clean)) {
                        finalSelected.add(item.trim());
                    }
                }

                // Insert or update current selections
                for (String name : finalSelected) {
                    String clean = name.toLowerCase();

                    if (existingForCategory.containsKey(clean)) {
                        Facility_Compliance_Setting__c rec = existingForCategory.get(clean);
                        rec.Status__c = true;
                        toUpdate.add(rec);
                    } else {
                        toInsert.add(new Facility_Compliance_Setting__c(
                            Facility__c = facilityId,
                            Compliance_Category__c = category,
                            Document_Name__c = name,
                            Status__c = true,
                            Mandatory_Document__c = false,
                            Visible_to_Staff__c = false,
                            Expiry_Date_Required__c = false,
                            X100_pointcheck__c = '0 Points'
                        ));
                    }
                }

                // Delete records that were unselected (synced only)
                for (Facility_Compliance_Setting__c oldRec : existingForCategory.values()) {
                    String clean = oldRec.Document_Name__c.trim().toLowerCase();

                    if (currentSelectedSet.contains(clean)) continue;
                    if (!originalSelection.contains(clean)) continue;

                    toDelete.add(oldRec);
                }
            }

            // 4. Execute DML
            if (!toInsert.isEmpty()) insert toInsert;
            if (!toUpdate.isEmpty()) update toUpdate;
            if (!toDelete.isEmpty()) delete toDelete;
        }
        catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<Map<String, Object>> getFacilityIdentityDocuments(List<String> facilityId,Id staffId) {
        try {
        
            List<Map<String, Object>> allDocuments = new List<Map<String, Object>>();
            
            // 1️⃣ ALWAYS ADD DEFAULT 100-POINTS DOCUMENTS
            List<Map<String, Object>> defaultDocs = getDefault100PointsDocuments();
            System.debug('Default 100-points docs count: ' + defaultDocs.size());
            
            // Add isDefault flag to default docs
            for(Map<String, Object> doc : defaultDocs) {
                doc.put('isDefault', true);
            }
            allDocuments.addAll(defaultDocs);

            Map<Id, String> facilityIdNameMap = new Map<Id, String>();

            if (facilityId != null && !facilityId.isEmpty()) {
                for (Facility__c fac : [
                    SELECT Id, Name 
                    FROM Facility__c 
                    WHERE Id IN :facilityId
                ]) {
                    facilityIdNameMap.put(fac.Id, fac.Name);
                }
            }
            
            // 2️⃣ ADD FACILITY-SPECIFIC DOCUMENTS IF FACILITIES EXIST
            // if (facilityId != null && !facilityId.isEmpty()) {
            //     List<Map<String, Object>> facilityDocs = getFacilitySpecificDocuments(facilityId, staffId);
            //     allDocuments.addAll(facilityDocs);
            // }

            List<Map<String, Object>> facilityDocs = getFacilitySpecificDocuments(facilityId, staffId);

            // 🔥 Attach facility name to each document
            for (Map<String, Object> doc : facilityDocs) {
                Id facId = (Id) doc.get('facilityId'); // must exist in doc map

                if (facId != null && facilityIdNameMap.containsKey(facId)) {
                    doc.put('facilityName', facilityIdNameMap.get(facId));
                } else {
                    doc.put('facilityName', '');
                }
            }

            allDocuments.addAll(facilityDocs);

            User objUser = [SELECT Id, Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];
            String orgID = [SELECT Id FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1].Id;
            
            if (orgId != null) {

                List<Map<String, Object>> orgDocs = getOrganisationSpecificDocuments(orgId, staffId);
                allDocuments.addAll(orgDocs);
            }
            
            // Debug log all documents
            for(Integer i = 0; i < allDocuments.size(); i++) {
                Map<String, Object> doc = allDocuments[i];
                System.debug('Document ' + i + ': ' + 
                            doc.get('name') + ' | ' + 
                            doc.get('complianceCategory') + ' | ' + 
                            'Category: ' + doc.get('category') + ' | ' +
                            'Points: ' + doc.get('points'));
            }
            
            return allDocuments;
            
        } catch (Exception e) {
            throw new AuraHandledException(
                'Error fetching facility documents: ' + e.getMessage()
            );
        }
    }
    
    private static List<Map<String,Object>> getOrganisationSpecificDocuments(Id orgId, Id staffId){

        List<Map<String,Object>> orgDocs = new List<Map<String,Object>>();

        try{

            // 1️⃣ GET STAFF ROLES (same logic as facility method)
            Set<String> staffActiveRoles = new Set<String>();

            if (staffId != null) {

                List<StaffRole__c> staffRoles = [
                    SELECT RoleName__c
                    FROM StaffRole__c
                    WHERE StaffRole_To_Staff__c = :staffId
                    AND Active__c = TRUE
                ];

                for (StaffRole__c sr : staffRoles) {
                    if (String.isNotBlank(sr.RoleName__c)) {
                        staffActiveRoles.add(sr.RoleName__c.trim());
                    }
                }
            }

            // 2️⃣ QUERY ORGANISATION DOCUMENTS
            List<Facility_Compliance_Setting__c> records = [
                SELECT Document_Name__c,
                    Documents_Category__c,
                    X100_pointcheck__c,
                    Mandatory_Document__c,
                    Visible_to_Staff__c,
                    Org_Roles__c,
                    Expiry_Date_Required__c
                FROM Facility_Compliance_Setting__c
                WHERE Organisation__c = :orgId
                AND Compliance_Category__c = 'Documents'
                AND Visible_to_Staff__c = true
            ];

            // 3️⃣ FILTER DOCUMENTS BASED ON ROLE MATCH
            for(Facility_Compliance_Setting__c doc : records){

                Boolean roleCheckPassed = true;

                if (String.isNotBlank(doc.Org_Roles__c)) {

                    if (staffActiveRoles.isEmpty()) {

                        roleCheckPassed = false;

                    } else {

                        Set<String> docRoles = new Set<String>();

                        for (String r : doc.Org_Roles__c.split(';')) {
                            String trimmedRole = r.trim();
                            if (String.isNotBlank(trimmedRole)) {
                                docRoles.add(trimmedRole);
                            }
                        }

                        Boolean hasMatch = false;

                        for (String staffRole : staffActiveRoles) {
                            if (docRoles.contains(staffRole)) {
                                hasMatch = true;
                                break;
                            }
                        }

                        if (!hasMatch) {
                            roleCheckPassed = false;
                        }
                    }
                }

                if (!roleCheckPassed) {
                    continue;
                }

                // 4️⃣ CREATE DOCUMENT MAP
                Map<String,Object> dm = new Map<String,Object>();

                dm.put('name', doc.Document_Name__c);
                dm.put('complianceCategory','Documents');
                dm.put('category', doc.Documents_Category__c);
                dm.put('mandatory', doc.Mandatory_Document__c);
                dm.put('visibleToStaff', doc.Visible_to_Staff__c);
                dm.put('roles', doc.Org_Roles__c);
                dm.put('expiryRequired', doc.Expiry_Date_Required__c);

                Integer points = 0;

                if(doc.X100_pointcheck__c != null){
                    String numeric =
                        doc.X100_pointcheck__c.replaceAll('[^0-9]','');
                    if(String.isNotBlank(numeric)){
                        points = Integer.valueOf(numeric);
                    }
                }

                dm.put('points',points);

                orgDocs.add(dm);
            }

        }catch(Exception e){
            System.debug('Error in getOrganisationSpecificDocuments: ' + e.getMessage());
        }

        return orgDocs;
    }

    // Helper method to get facility-specific documents - UPDATED to include Identity docs
    private static List<Map<String, Object>> getFacilitySpecificDocuments(List<String> facilityId, Id staffId) {
        List<Map<String, Object>> facilityDocs = new List<Map<String, Object>>();
        
        try {
            // 1️⃣ GET STAFF ROLES
            Set<String> staffActiveRoles = new Set<String>();
            
            if (staffId != null) {
                List<StaffRole__c> staffRoles = [
                    SELECT RoleName__c 
                    FROM StaffRole__c 
                    WHERE StaffRole_To_Staff__c = :staffId 
                    AND Active__c = TRUE
                ];
                
                for (StaffRole__c sr : staffRoles) {
                    if (String.isNotBlank(sr.RoleName__c)) {
                        staffActiveRoles.add(sr.RoleName__c.trim());
                    }
                }
            }
            
            // 2️⃣ QUERY ALL FACILITY DOCUMENTS - INCLUDING Identity documents
            List<Facility_Compliance_Setting__c> allFacilityDocs = [
                SELECT Id, Document_Name__c, Compliance_Category__c,
                    Identity_Category__c, Documents_Category__c, Training_Category__c,
                    Identity_Points__c, X100_pointcheck__c, Mandatory_Document__c,
                    Visible_to_Staff__c, Roles__c, Expiry_Date_Required__c, Facility__c, Facility__r.Facility_Name__c
                FROM Facility_Compliance_Setting__c
                WHERE Facility__c IN :facilityId
                AND Visible_to_Staff__c = true
                AND (Compliance_Category__c = 'Identity' 
                    OR Compliance_Category__c = 'Documents' 
                    OR Compliance_Category__c = 'Trainings')
                ORDER BY Compliance_Category__c, Document_Name__c
            ];
            
            // 3️⃣ FILTER BY COMPLIANCE CATEGORY AND ROLES
            for (Facility_Compliance_Setting__c doc : allFacilityDocs) {
                try {
                    // Skip if no document name
                    if (String.isBlank(doc.Document_Name__c)) {
                        continue;
                    }
                    
                    // Check role restrictions
                    Boolean roleCheckPassed = true;
                    if (String.isNotBlank(doc.Roles__c)) {
                        if (staffActiveRoles.isEmpty()) {
                            roleCheckPassed = false;
                        } else {
                            // Parse document roles
                            Set<String> docRoles = new Set<String>();
                            for (String r : doc.Roles__c.split(';')) {
                                String trimmedRole = r.trim();
                                if (String.isNotBlank(trimmedRole)) {
                                    docRoles.add(trimmedRole);
                                }
                            }
                            
                            // Check for role match (case-sensitive)
                            Boolean hasMatch = false;
                            for (String staffRole : staffActiveRoles) {
                                if (docRoles.contains(staffRole)) {
                                    hasMatch = true;
                                    break;
                                }
                            }
                            
                            if (!hasMatch) {
                                roleCheckPassed = false;
                            }
                        }
                    }
                    
                    if (!roleCheckPassed) {
                        continue;
                    }
                    
                    // Create document map
                    Map<String, Object> dm = new Map<String, Object>();
                    dm.put('name', doc.Document_Name__c.trim());
                    dm.put('complianceCategory', doc.Compliance_Category__c);
                    dm.put('mandatory', doc.Mandatory_Document__c == true);
                    dm.put('visibleToStaff', doc.Visible_to_Staff__c == true);
                    dm.put('roles', doc.Roles__c);
                    dm.put('expiryRequired', doc.Expiry_Date_Required__c == true);
                    dm.put('isDefault', false);
                    dm.put('facilityId', doc.Facility__c); 
                    dm.put('facilityName', doc.Facility__r.Facility_Name__c); 
                    
                    // Handle category based on compliance category
                    if (doc.Compliance_Category__c == 'Identity') {
                        // For Identity documents, use Identity_Category__c field
                        dm.put('category', doc.Identity_Category__c != null ? doc.Identity_Category__c : 'Other');
                        
                        // Calculate points from Identity_Points__c
                        Integer points = 0;
                        if (doc.Identity_Points__c != null) {
                            try {
                                points = Integer.valueOf(doc.Identity_Points__c);
                            } catch (Exception e) {
                                points = 0;
                            }
                        }
                        dm.put('points', points);
                        
                    } else if (doc.Compliance_Category__c == 'Documents') {
                        dm.put('category', doc.Documents_Category__c != null ? doc.Documents_Category__c : 'General');
                        
                        // Calculate points from X100_pointcheck__c
                        Integer points = 0;
                        if (doc.X100_pointcheck__c != null) {
                            try {
                                // Extract numbers from string
                                String numericPart = doc.X100_pointcheck__c.replaceAll('[^0-9]', '');
                                if (String.isNotBlank(numericPart)) {
                                    points = Integer.valueOf(numericPart);
                                }
                            } catch (Exception e) {
                                points = 0;
                            }
                        }
                        dm.put('points', points);
                        
                    } else if (doc.Compliance_Category__c == 'Trainings') {
                        dm.put('category', doc.Training_Category__c != null ? doc.Training_Category__c : 'General');
                        dm.put('points', 0);
                    }
                    
                    facilityDocs.add(dm);
                    
                } catch (Exception e) {
                    continue;
                }
            }
            
            System.debug('Filtered facility docs count: ' + facilityDocs.size());
            
        } catch (Exception e) {
            System.debug('Error in getFacilitySpecificDocuments: ' + e.getMessage());
            System.debug('Stack trace: ' + e.getStackTraceString());
        }
        
        return facilityDocs;
    }

    // Method to get default 100 Points of ID documents
    public static List<Map<String, Object>> getDefault100PointsDocuments() {
        List<Map<String, Object>> defaultDocs = new List<Map<String, Object>>();
        
        // Primary Identity Documents
        defaultDocs.add(createIdentityDoc('Australian passport', 'Primary', 70));
        defaultDocs.add(createIdentityDoc('Foreign passport', 'Primary', 70));
        defaultDocs.add(createIdentityDoc('Driver\'s License/permit', 'Primary', 40));
        defaultDocs.add(createIdentityDoc('Australian citizenship Certificate', 'Primary', 70));
        defaultDocs.add(createIdentityDoc('Full Birth certificate', 'Primary', 70));
        defaultDocs.add(createIdentityDoc('Certificate of Identity issued by the Australian Government for refugees and non-citizens entering Australia', 'Primary', 70));
        defaultDocs.add(createIdentityDoc('Current (Australian) Tertiary Student Identification Card', 'Primary', 40));
        defaultDocs.add(createIdentityDoc('Photo identification card issued for Australian regulatory purposes', 'Primary', 40));
        defaultDocs.add(createIdentityDoc('Government employee ID', 'Primary', 40));
        defaultDocs.add(createIdentityDoc('Defence Force Identity Card', 'Primary', 40));
        
        // Secondary Identity Documents
        defaultDocs.add(createIdentityDoc('Birth certificate extract', 'Secondary', 25));
        defaultDocs.add(createIdentityDoc('Certificate of identity', 'Secondary', 40));
        defaultDocs.add(createIdentityDoc('Photo ID', 'Secondary', 40));
        defaultDocs.add(createIdentityDoc('Proof of age card', 'Secondary', 40));
        defaultDocs.add(createIdentityDoc('Medicare card', 'Secondary', 25));
        defaultDocs.add(createIdentityDoc('Rating authority', 'Secondary', 25));
        defaultDocs.add(createIdentityDoc('Citizenship certificate', 'Secondary', 25));
        defaultDocs.add(createIdentityDoc('Change of name certificate', 'Secondary', 25));
        defaultDocs.add(createIdentityDoc('Bank statement 1', 'Secondary', 25));
        defaultDocs.add(createIdentityDoc('Bank statement 2', 'Secondary', 25));
        defaultDocs.add(createIdentityDoc('Centrelink card', 'Secondary', 40));
        defaultDocs.add(createIdentityDoc('DVA card', 'Secondary', 40));
        defaultDocs.add(createIdentityDoc('Lease agreement', 'Secondary', 25));
        defaultDocs.add(createIdentityDoc('Marriage certificate', 'Secondary', 25));
        defaultDocs.add(createIdentityDoc('Utility bill 1', 'Secondary', 20));
        defaultDocs.add(createIdentityDoc('Utility bill 2', 'Secondary', 20));
        defaultDocs.add(createIdentityDoc('Birth certificate (foreign)', 'Secondary', 15));
        defaultDocs.add(createIdentityDoc('Indigenous reference', 'Secondary', 20));
        defaultDocs.add(createIdentityDoc('Credit Card/Debit Card', 'Secondary', 25));
        defaultDocs.add(createIdentityDoc('Decree Nisi / Decree Absolute', 'Secondary', 25));
        defaultDocs.add(createIdentityDoc('Property lease agreement - current address', 'Secondary', 25));
        defaultDocs.add(createIdentityDoc('Taxation assessment notice', 'Secondary', 25));
        defaultDocs.add(createIdentityDoc('Australian Mortgage Documents - Current address', 'Secondary', 25));
        defaultDocs.add(createIdentityDoc('Documents issued outside Australia', 'Secondary', 20));
        defaultDocs.add(createIdentityDoc('Contract Agreement', 'Secondary', 0));
        
        System.debug('Created ' + defaultDocs.size() + ' default identity documents');
        return defaultDocs;
    }

    private static Map<String, Object> createIdentityDoc(String name, String category, Integer points) {
        Map<String, Object> doc = new Map<String, Object>{
            'name' => name,
            'complianceCategory' => 'Identity',
            'category' => category,
            'points' => points,
            'mandatory' => false,
            'visibleToStaff' => true,
            'roles' => null,
            'expiryRequired' => false
        };
        
        System.debug('Created identity doc: ' + name + ' | ' + category + ' | ' + points + ' points');
        return doc;
    }

    @AuraEnabled
    public static List<Facility_Role__c> getOrganisationRoles(Id organisationId) {

        System.debug('📥 Fetching Organisation Roles for OrgId: ' + organisationId);

        if (organisationId == null) {
            return new List<Facility_Role__c>();
        }

        // 1️⃣ Fetch all roles under facilities of this organisation
        List<Facility_Role__c> allRoles = [
            SELECT Id, Name, Role_Name__c, Is_Active__c, Facility__c
            FROM Facility_Role__c
            WHERE Facility__r.Organisation__c = :organisationId
            AND Is_Active__c = true
        ];

        // 2️⃣ Remove duplicates based on Role_Name__c
        Map<String, Facility_Role__c> distinctRolesMap = new Map<String, Facility_Role__c>();

        for (Facility_Role__c role : allRoles) {
            if (String.isNotBlank(role.Role_Name__c)) {
                String key = role.Role_Name__c.trim();

                if (!distinctRolesMap.containsKey(key)) {
                    distinctRolesMap.put(key, role);
                }
            }
        }

        System.debug('✅ Total distinct roles: ' + distinctRolesMap.size());

        return distinctRolesMap.values();
    }

    @AuraEnabled(cacheable=true)
    public static Boolean getPremiumStatusFromFacility(Id facilityId) {

        if (facilityId == null) {
            return false;
        }

        Facility__c facility = [
            SELECT Organisation__r.Premium_Client__c
            FROM Facility__c
            WHERE Id = :facilityId
            LIMIT 1
        ];

        return facility.Organisation__r != null &&
            facility.Organisation__r.Premium_Client__c == true;
    }
    
}