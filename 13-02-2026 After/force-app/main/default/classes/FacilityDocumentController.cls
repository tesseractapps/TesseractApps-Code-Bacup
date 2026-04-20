public with sharing class FacilityDocumentController {

    @AuraEnabled(cacheable=false)
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

                // 1. Load facility selections
                Facility__c facility = [
                    SELECT Id,
                        Selected_Documents__c,
                        Selected_Trainings__c
                    FROM Facility__c
                    WHERE Id = :facilityId
                    LIMIT 1
                ];

                // Store original selections BEFORE any processing
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

                /*
                    CATEGORY MAPPING:
                    Documents → Selected_Documents__c
                    Trainings → Selected_Trainings__c
                */
                Map<String, String> categoryMap = new Map<String, String>{
                    'Documents' => facility.Selected_Documents__c,
                    'Trainings' => facility.Selected_Trainings__c
                };

                // 2. Fetch existing compliance settings (Docs + Trainings ONLY)
                List<Facility_Compliance_Setting__c> existingAll = [
                    SELECT Id,
                        Compliance_Category__c,
                        Document_Name__c,
                        Expiry_Date_Required__c
                    FROM Facility_Compliance_Setting__c
                    WHERE Facility__c = :facilityId
                    AND Compliance_Category__c IN ('Documents', 'Trainings')
                ];

                // Group by category + normalized document name
                Map<String, Map<String, Facility_Compliance_Setting__c>> existingMap =
                    new Map<String, Map<String, Facility_Compliance_Setting__c>>();

                for (Facility_Compliance_Setting__c rec : existingAll) {
                    String category = rec.Compliance_Category__c;
                    String cleanName = rec.Document_Name__c != null
                        ? rec.Document_Name__c.trim().toLowerCase()
                        : null;
                    
                    if (cleanName == null) continue;

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
                    System.debug('➡️ Processing ' + category + ': ' + selected);

                    // Get the original selection for this category
                    Set<String> originalSelection = category == 'Documents' 
                        ? originalDocs 
                        : originalTrainings;

                    // If nothing selected currently → delete only records that WERE in original selection
                    if (String.isBlank(selected)) {
                        if (existingMap.containsKey(category)) {
                            for (Facility_Compliance_Setting__c rec : existingMap.get(category).values()) {
                                String cleanName = rec.Document_Name__c.trim().toLowerCase();
                                // Only delete if it was in the original selection (synchronized)
                                if (originalSelection.contains(cleanName)) {
                                    toDelete.add(rec);
                                }
                                // Keep it if it wasn't in original selection (manually created)
                            }
                        }
                        continue;
                    }

                    // Normalize CURRENT selected values
                    Set<String> currentSelectedSet = new Set<String>();
                    List<String> finalSelected = new List<String>();

                    for (String item : selected.split(';')) {
                        if (String.isBlank(item)) continue;

                        String clean = item.trim().toLowerCase();
                        if (!currentSelectedSet.contains(clean)) {
                            currentSelectedSet.add(clean);
                            finalSelected.add(item.trim());
                        }
                    }

                    Map<String, Facility_Compliance_Setting__c> existingForCategory =
                        existingMap.containsKey(category)
                            ? existingMap.get(category)
                            : new Map<String, Facility_Compliance_Setting__c>();

                    // Track which existing records were processed in current selection
                    Set<String> processedExisting = new Set<String>();

                    // Insert or Update CURRENT selected items
                    for (String docName : finalSelected) {
                        String clean = docName.toLowerCase();

                        if (existingForCategory.containsKey(clean)) {
                            // ✅ EXISTING RECORD → preserve expiry configuration
                            Facility_Compliance_Setting__c rec = existingForCategory.get(clean);
                            rec.Status__c = true;
                            toUpdate.add(rec);
                            processedExisting.add(clean);
                        } else {
                            // 🆕 NEW RECORD → default expiry to false
                            Facility_Compliance_Setting__c newRec =
                                new Facility_Compliance_Setting__c(
                                    Facility__c = facilityId,
                                    Compliance_Category__c = category,
                                    Document_Name__c = docName,
                                    Status__c = true,
                                    Mandatory_Document__c = false,
                                    Visible_to_Staff__c = false,
                                    Expiry_Date_Required__c = false,
                                    X100_pointcheck__c = '0 Points'
                                );
                            toInsert.add(newRec);
                        }
                    }

                    // DELETE LOGIC: Only delete if BOTH conditions are true:
                    // 1. It exists in the system
                    // 2. It WAS in the original selection (synchronized)
                    // 3. It's NOT in the current selection
                    for (Facility_Compliance_Setting__c oldRec : existingForCategory.values()) {
                        if (oldRec.Document_Name__c == null) continue;

                        String clean = oldRec.Document_Name__c.trim().toLowerCase();

                        // ✅ KEEP if it's in current selection
                        if (currentSelectedSet.contains(clean)) {
                            continue;
                        }

                        // ✅ KEEP if it was NEVER in original selection (manual document)
                        if (!originalSelection.contains(clean)) {
                            continue;
                        }

                        // ❌ DELETE only if:
                        // - It was in original selection (synchronized)
                        // - It's NOT in current selection
                        toDelete.add(oldRec);
                    }
                }

                // 4. Execute DML
                if (!toInsert.isEmpty()) insert toInsert;
                if (!toUpdate.isEmpty()) update toUpdate;
                if (!toDelete.isEmpty()) delete toDelete;

                // ----------------------------------------------------
                // 5. Rebuild facility Selected fields (Documents + Trainings)
                // Include ALL active documents (both synchronized and manual)
                // ----------------------------------------------------
                List<Facility_Compliance_Setting__c> allActiveRecs = [
                    SELECT Compliance_Category__c, Document_Name__c
                    FROM Facility_Compliance_Setting__c
                    WHERE Facility__c = :facilityId
                    AND Status__c = true
                    ORDER BY Document_Name__c
                ];

                // Group all active documents by category
                Map<String, Set<String>> activeDocsByCategory = new Map<String, Set<String>>{
                    'Documents' => new Set<String>(),
                    'Trainings' => new Set<String>()
                };

                for (Facility_Compliance_Setting__c rec : allActiveRecs) {
                    if (rec.Compliance_Category__c == 'Documents') {
                        activeDocsByCategory.get('Documents').add(rec.Document_Name__c);
                    } else if (rec.Compliance_Category__c == 'Trainings') {
                        activeDocsByCategory.get('Trainings').add(rec.Document_Name__c);
                    }
                }

                // Convert sets to sorted lists
                List<String> sortedDocs = new List<String>(activeDocsByCategory.get('Documents'));
                List<String> sortedTrainings = new List<String>(activeDocsByCategory.get('Trainings'));
                sortedDocs.sort();
                sortedTrainings.sort();

                // Update facility with ALL active documents
                update new Facility__c(
                    Id = facilityId,
                    Selected_Documents__c = String.join(sortedDocs, ';'),
                    Selected_Trainings__c = String.join(sortedTrainings, ';')
                );

                System.debug('✅ Sync Complete — Manual documents preserved');
                System.debug('📊 Inserted: ' + toInsert.size() + ', Updated: ' + toUpdate.size() + ', Deleted: ' + toDelete.size());
            }
            catch (Exception e) {
                System.debug('❌ Error syncing facility documents: ' + e.getMessage());
                throw new AuraHandledException(e.getMessage());
            }
        }

/*
    @AuraEnabled
    public static List<Map<String, Object>> getFacilityIdentityDocuments(String facilityId) {
        try {
            List<Facility_Compliance_Setting__c> docs = [
                SELECT Id,
                    Document_Name__c,
                    Compliance_Category__c,
                    Identity_Category__c,
                    Documents_Category__c,
                    Training_Category__c,
                    Identity_Points__c,
                    X100_pointcheck__c,
                    Mandatory_Document__c,
                    Visible_to_Staff__c,
                    Roles__c,
                    Expiry_Date_Required__c
                FROM Facility_Compliance_Setting__c
                WHERE Facility__c = :facilityId
                AND Compliance_Category__c IN ('Identity', 'Documents', 'Trainings')
                AND Visible_to_Staff__c = TRUE
                ORDER BY Compliance_Category__c, Identity_Category__c, Document_Name__c
            ];

            List<Map<String, Object>> result = new List<Map<String, Object>>();

            for (Facility_Compliance_Setting__c doc : docs) {
                Map<String, Object> dm = new Map<String, Object>();

                // COMMON FIELDS
                dm.put('name', doc.Document_Name__c);
                dm.put('complianceCategory', doc.Compliance_Category__c);
                dm.put('mandatory', doc.Mandatory_Document__c);
                dm.put('visibleToStaff', doc.Visible_to_Staff__c);
                dm.put('roles', doc.Roles__c);
                dm.put('expiryRequired', doc.Expiry_Date_Required__c);

                // RETURN CORRECT SUB-CATEGORY FIELD
                if (doc.Compliance_Category__c == 'Identity') {
                    dm.put('category', doc.Identity_Category__c);
                    dm.put('points', doc.Identity_Points__c);
                }
                else if (doc.Compliance_Category__c == 'Documents') {
                    dm.put('category', doc.Documents_Category__c);
                    // Convert '0 Points' → 0 for LWC numeric logic
                    dm.put('points', doc.X100_pointcheck__c != null 
                                        ? Integer.valueOf(doc.X100_pointcheck__c.replaceAll('[^0-9]', ''))
                                        : 0);
                }
                else if (doc.Compliance_Category__c == 'Trainings') {
                    dm.put('category', doc.Training_Category__c);
                    dm.put('points', null); // Trainings do not use points
                }

                result.add(dm);
            }

            return result;

        } catch (Exception e) {
            throw new AuraHandledException('Error fetching facility documents: ' + e.getMessage());
        }
    }
*/

/*  @AuraEnabled
public static List<Map<String, Object>> getFacilityIdentityDocuments(
    List<String> facilityId,
    Id staffId
) {
        try {

            // 1️⃣ FETCH ACTIVE STAFF ROLES

            Set<String> staffActiveRoles = new Set<String>();

            if (staffId != null) {
                Staff__c staffRec = [
                    SELECT Id,
                        (SELECT RoleName__c
                            FROM StaffRoles__r
                            WHERE Active__c = TRUE)
                    FROM Staff__c
                    WHERE Id = :staffId
                    LIMIT 1
                ];

                for (StaffRole__c sr : staffRec.StaffRoles__r) {
                    System.debug(
                        '➡️ Processing StaffRole | Id=' + sr.Id +
                        ' | Raw RoleName__c=' + sr.RoleName__c
                    );
                    if (String.isNotBlank(sr.RoleName__c)) {
                        staffActiveRoles.add(sr.RoleName__c.trim());
                    }
                }
            }

            // 2️⃣ QUERY FACILITY DOCUMENTS (VISIBLE TO STAFF ONLY)

            List<Facility_Compliance_Setting__c> docs = [
                SELECT Id,
                    Document_Name__c,
                    Compliance_Category__c,
                    Identity_Category__c,
                    Documents_Category__c,
                    Training_Category__c,
                    Identity_Points__c,
                    X100_pointcheck__c,
                    Mandatory_Document__c,
                    Visible_to_Staff__c,
                    Roles__c,
                    Expiry_Date_Required__c
                FROM Facility_Compliance_Setting__c
                WHERE Facility__c IN  :facilityId
                AND Compliance_Category__c IN ('Identity', 'Documents', 'Trainings')
                AND Visible_to_Staff__c = TRUE
                ORDER BY Compliance_Category__c, Identity_Category__c, Document_Name__c
            ];

            // 3️⃣ APPLY ROLE MATCHING + BUILD RESPONSE

            List<Map<String, Object>> result = new List<Map<String, Object>>();

            for (Facility_Compliance_Setting__c doc : docs) {

                // 🔹 ROLE VISIBILITY RULE
                if (String.isNotBlank(doc.Roles__c)) {

                    // Staff has no active roles → skip
                    if (staffActiveRoles.isEmpty()) {
                        continue;
                    }

                    // Check if ANY role matches
                    Set<String> docRoles = new Set<String>();
                    for (String r : doc.Roles__c.split(';')) {
                        docRoles.add(r.trim());
                    }

                    Boolean hasMatch = false;
                    for (String staffRole : staffActiveRoles) {

                        System.debug('➡️ Checking staffRole: ' + staffRole);

                        if (docRoles.contains(staffRole)) {
                            System.debug('✅ MATCH FOUND for role: ' + staffRole);
                            hasMatch = true;
                            break;
                        } else {
                            System.debug('❌ No match for role: ' + staffRole);
                        }
                    }

                    System.debug('🏁 Final hasMatch value: ' + hasMatch);

                    if (!hasMatch) {
                        continue; // ❌ No role match → skip document
                    }
                }

                // BUILD RESPONSE MAP (UNCHANGED STRUCTURE)

                Map<String, Object> dm = new Map<String, Object>();

                dm.put('name', doc.Document_Name__c);
                dm.put('complianceCategory', doc.Compliance_Category__c);
                dm.put('mandatory', doc.Mandatory_Document__c);
                dm.put('visibleToStaff', doc.Visible_to_Staff__c);
                dm.put('roles', doc.Roles__c);
                dm.put('expiryRequired', doc.Expiry_Date_Required__c);

                if (doc.Compliance_Category__c == 'Identity') {
                    dm.put('category', doc.Identity_Category__c);
                    dm.put('points', doc.Identity_Points__c);
                }
                else if (doc.Compliance_Category__c == 'Documents') {
                    dm.put('category', doc.Documents_Category__c);
                    dm.put(
                        'points',
                        doc.X100_pointcheck__c != null
                            ? Integer.valueOf(
                                doc.X100_pointcheck__c.replaceAll('[^0-9]', '')
                            )
                            : 0
                    );
                }
                else if (doc.Compliance_Category__c == 'Trainings') {
                    dm.put('category', doc.Training_Category__c);
                    dm.put('points', null);
                }

                result.add(dm);
            }

            return result;

        } catch (Exception e) {
            throw new AuraHandledException(
                'Error fetching facility documents: ' + e.getMessage()
            );
        }
    }*/

    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getFacilityIdentityDocuments(
        List<String> facilityId,
        Id staffId
    ) {
        try {
            System.debug('=== STARTING DOCUMENT FETCH ===');
            System.debug('Facility IDs: ' + facilityId);
            System.debug('Staff ID: ' + staffId);
            
            List<Map<String, Object>> allDocuments = new List<Map<String, Object>>();
            
            // 1️⃣ ALWAYS ADD DEFAULT 100-POINTS DOCUMENTS
            List<Map<String, Object>> defaultDocs = getDefault100PointsDocuments();
            System.debug('Default 100-points docs count: ' + defaultDocs.size());
            
            // Add isDefault flag to default docs
            for(Map<String, Object> doc : defaultDocs) {
                doc.put('isDefault', true);
            }
            allDocuments.addAll(defaultDocs);
            
            // 2️⃣ ADD FACILITY-SPECIFIC DOCUMENTS IF FACILITIES EXIST
            if (facilityId != null && !facilityId.isEmpty()) {
                List<Map<String, Object>> facilityDocs = getFacilitySpecificDocuments(facilityId, staffId);
                System.debug('Facility-specific docs count: ' + facilityDocs.size());
                allDocuments.addAll(facilityDocs);
            }
            
            System.debug('Total documents to return: ' + allDocuments.size());
            
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
            System.debug('🔥 ERROR in getFacilityIdentityDocuments: ' + e.getMessage());
            System.debug('🔥 Stack trace: ' + e.getStackTraceString());
            throw new AuraHandledException(
                'Error fetching facility documents: ' + e.getMessage()
            );
        }
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
                System.debug('Staff active roles: ' + staffActiveRoles);
            }
            
            // 2️⃣ QUERY ALL FACILITY DOCUMENTS - INCLUDING Identity documents
            List<Facility_Compliance_Setting__c> allFacilityDocs = [
                SELECT Id, Document_Name__c, Compliance_Category__c,
                    Identity_Category__c, Documents_Category__c, Training_Category__c,
                    Identity_Points__c, X100_pointcheck__c, Mandatory_Document__c,
                    Visible_to_Staff__c, Roles__c, Expiry_Date_Required__c
                FROM Facility_Compliance_Setting__c
                WHERE Facility__c IN :facilityId
                AND Visible_to_Staff__c = true
                AND (Compliance_Category__c = 'Identity' 
                    OR Compliance_Category__c = 'Documents' 
                    OR Compliance_Category__c = 'Trainings')
                ORDER BY Compliance_Category__c, Document_Name__c
            ];
            
            System.debug('Total docs in facility (including Identity): ' + allFacilityDocs.size());
            
            // 3️⃣ FILTER BY COMPLIANCE CATEGORY AND ROLES
            for (Facility_Compliance_Setting__c doc : allFacilityDocs) {
                try {
                    // Skip if no document name
                    if (String.isBlank(doc.Document_Name__c)) {
                        continue;
                    }
                    
                    System.debug('Processing document: ' + doc.Document_Name__c);
                    System.debug('Compliance Category: ' + doc.Compliance_Category__c);
                    System.debug('Roles: ' + doc.Roles__c);
                    
                    // Check role restrictions
                    Boolean roleCheckPassed = true;
                    if (String.isNotBlank(doc.Roles__c)) {
                        if (staffActiveRoles.isEmpty()) {
                            System.debug('Skipping - staff has no roles but doc requires roles');
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
                                System.debug('Skipping - no role match');
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
                                System.debug('Error parsing identity points: ' + e.getMessage());
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
                                System.debug('Error parsing points: ' + e.getMessage());
                                points = 0;
                            }
                        }
                        dm.put('points', points);
                        
                    } else if (doc.Compliance_Category__c == 'Trainings') {
                        dm.put('category', doc.Training_Category__c != null ? doc.Training_Category__c : 'General');
                        dm.put('points', 0);
                    }
                    
                    facilityDocs.add(dm);
                    System.debug('Added facility document: ' + dm);
                    
                } catch (Exception e) {
                    System.debug('Error processing individual document: ' + e.getMessage());
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
    
        
}