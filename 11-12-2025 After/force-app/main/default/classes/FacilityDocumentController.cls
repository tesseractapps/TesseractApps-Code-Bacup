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
/*
    @AuraEnabled
    public static Boolean deleteDocument(Id recId) {
        try {
            delete [SELECT Id,  FROM Facility_Compliance_Setting__c WHERE Id = :recId];
            return true;

        } catch (Exception e) {
            throw new AuraHandledException('Error deleting document: ' + e.getMessage());
        }
    }
*/
    @AuraEnabled
    public static void deleteDocument(Id recId) {
        // Load document and facility selected list
        Facility_Compliance_Setting__c doc = [
            SELECT Id, Document_Name__c, Facility__r.Selected_Documents__c
            FROM Facility_Compliance_Setting__c
            WHERE Id = :recId
        ];

        List<String> selectedDocs = new List<String>();

        if (String.isNotBlank(doc.Facility__r.Selected_Documents__c)) {
            selectedDocs = doc.Facility__r.Selected_Documents__c.split(';');
        }

        if (selectedDocs.contains(doc.Document_Name__c)) {
            throw new AuraHandledException(
                'This document was selected for the Facility and cannot be deleted.'
            );
        }

        delete doc;
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
                throw new AuraHandledException('Error saving document: ' + e.getMessage());
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
            throw new AuraHandledException('Error saving document: ' + e.getMessage());
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
/*
        @AuraEnabled
        public static void syncFacilityDocuments(Id facilityId) {
            try {
                System.debug('🔄 Syncing documents for Facility: ' + facilityId);
                
                // 1. Get the facility
                Facility__c facility = [
                    SELECT Id, Type_of_Service__c, Selected_Documents__c 
                    FROM Facility__c 
                    WHERE Id = :facilityId 
                    LIMIT 1
                ];
                
                if (facility.Selected_Documents__c == null || facility.Selected_Documents__c.trim() == '') {
                    System.debug('📭 No selected documents to sync');
                    return;
                }
                
                // 2. Get ALL existing DOCUMENT records for this facility
                List<Facility_Compliance_Setting__c> existingDocs = [
                    SELECT Id, Document_Name__c 
                    FROM Facility_Compliance_Setting__c 
                    WHERE Facility__c = :facilityId 
                    AND Compliance_Category__c = 'Documents'
                ];
                
                // 3. Create a case-insensitive map of existing document names
                Map<String, Id> existingDocMap = new Map<String, Id>();
                for (Facility_Compliance_Setting__c doc : existingDocs) {
                    if (doc.Document_Name__c != null) {
                        String normalizedName = doc.Document_Name__c.trim().toLowerCase();
                        // Check if we already have this normalized name
                        if (!existingDocMap.containsKey(normalizedName)) {
                            existingDocMap.put(normalizedName, doc.Id);
                        } else {
                            System.debug('⚠️ DUPLICATE FOUND: ' + doc.Document_Name__c + ' with ID: ' + doc.Id);
                        }
                    }
                }
                
                // 4. Split selected documents and normalize
                List<String> selectedDocNames = facility.Selected_Documents__c.split(';');
                System.debug('📋 Selected documents: ' + selectedDocNames);
                
                // 5. Normalize selected document names and check for duplicates in the input
                Set<String> normalizedSelectedNames = new Set<String>();
                List<String> uniqueSelectedDocNames = new List<String>();
                
                for (String docName : selectedDocNames) {
                    String trimmedName = docName.trim();
                    if (String.isBlank(trimmedName)) continue;
                    
                    String normalizedName = trimmedName.toLowerCase();
                    
                    // Check for duplicates in the selected documents themselves
                    if (!normalizedSelectedNames.contains(normalizedName)) {
                        normalizedSelectedNames.add(normalizedName);
                        uniqueSelectedDocNames.add(trimmedName);
                    } else {
                        System.debug('⚠️ Duplicate in Selected_Documents__c: ' + trimmedName);
                    }
                }
                
                // 6. Create new documents that don't exist
                List<Facility_Compliance_Setting__c> docsToInsert = new List<Facility_Compliance_Setting__c>();
                
                for (String docName : uniqueSelectedDocNames) {
                    String normalizedName = docName.trim().toLowerCase();
                    
                    if (!existingDocMap.containsKey(normalizedName)) {
                        System.debug('➕ Creating new document: ' + docName);
                        
                        Facility_Compliance_Setting__c newDoc = new Facility_Compliance_Setting__c(
                            Facility__c = facilityId,
                            Compliance_Category__c = 'Documents',
                            Document_Name__c = docName.trim(),
                            Mandatory_Document__c = false,
                            Visible_to_Staff__c = false,
                            Expiry_Date_Required__c = false,
                            X100_pointcheck__c = '0 Points'
                        );
                        
                        docsToInsert.add(newDoc);
                    } else {
                        System.debug('✅ Document already exists: ' + docName);
                    }
                }
                
                // 7. Insert new documents
                if (!docsToInsert.isEmpty()) {
                    insert docsToInsert;
                    System.debug('🎉 Inserted ' + docsToInsert.size() + ' new documents');
                }
                
            } catch (Exception e) {
                System.debug('❌ Error syncing documents: ' + e.getMessage() + ' - ' + e.getStackTraceString());
                throw new AuraHandledException('Error syncing documents: ' + e.getMessage());
            }
        }

        */

        @AuraEnabled
        public static void syncFacilityDocuments(Id facilityId) {
            try {
                System.debug('🔄 Syncing documents for Facility: ' + facilityId);

                // 1. Get facility record
                Facility__c facility = [
                    SELECT Id, Selected_Documents__c
                    FROM Facility__c
                    WHERE Id = :facilityId
                    LIMIT 1
                ];

                String selected = facility.Selected_Documents__c;
                if (String.isBlank(selected)) {
                    System.debug('📭 No selected documents — delete all existing records');

                    List<Facility_Compliance_Setting__c> allDocs = [
                        SELECT Id
                        FROM Facility_Compliance_Setting__c
                        WHERE Facility__c = :facilityId
                        AND Compliance_Category__c = 'Documents'
                    ];

                    delete allDocs;
                    return;
                }

                // 2. Normalize selected document names
                List<String> rawNames = selected.split(';');
                Set<String> selectedSet = new Set<String>();
                List<String> finalSelected = new List<String>();

                for (String name : rawNames) {
                    if (String.isBlank(name)) continue;

                    String clean = name.trim().toLowerCase();
                    if (!selectedSet.contains(clean)) {
                        selectedSet.add(clean);
                        finalSelected.add(name.trim());
                    }
                }

                System.debug('📋 Normalized Selected Docs: ' + finalSelected);

                // 3. Get existing facility documents
                List<Facility_Compliance_Setting__c> existing = [
                    SELECT Id, Document_Name__c
                    FROM Facility_Compliance_Setting__c
                    WHERE Facility__c = :facilityId
                    AND Compliance_Category__c = 'Documents'
                ];

                Map<String, Facility_Compliance_Setting__c> existingMap = new Map<String, Facility_Compliance_Setting__c>();

                for (Facility_Compliance_Setting__c doc : existing) {
                    if (doc.Document_Name__c != null) {
                        existingMap.put(doc.Document_Name__c.trim().toLowerCase(), doc);
                    }
                }

                List<Facility_Compliance_Setting__c> toInsert = new List<Facility_Compliance_Setting__c>();
                List<Facility_Compliance_Setting__c> toKeepOrUpdate = new List<Facility_Compliance_Setting__c>();

                // 4. Insert missing documents OR update existing
                for (String docName : finalSelected) {
                    String clean = docName.trim().toLowerCase();

                    if (existingMap.containsKey(clean)) {
                        Facility_Compliance_Setting__c doc = existingMap.get(clean);
                        doc.Status__c = true;   // Ensure Active
                        toKeepOrUpdate.add(doc);
                    } else {
                        toInsert.add(new Facility_Compliance_Setting__c(
                            Facility__c = facilityId,
                            Compliance_Category__c = 'Documents',
                            Document_Name__c = docName,
                            Status__c = true,
                            Mandatory_Document__c = false,
                            Visible_to_Staff__c = false,
                            Expiry_Date_Required__c = false,
                            X100_pointcheck__c = '0 Points'
                        ));
                    }
                }

                // 5. Delete docs not selected anymore
                List<Facility_Compliance_Setting__c> toDelete = new List<Facility_Compliance_Setting__c>();
                for (Facility_Compliance_Setting__c doc : existing) {
                    String clean = doc.Document_Name__c.trim().toLowerCase();
                    if (!selectedSet.contains(clean)) {
                        toDelete.add(doc);
                    }
                }

                if (!toInsert.isEmpty()) {
                    insert toInsert;
                    System.debug('➕ Inserted: ' + toInsert.size());
                }

                if (!toKeepOrUpdate.isEmpty()) {
                    update toKeepOrUpdate;
                    System.debug('♻ Updated: ' + toKeepOrUpdate.size());
                }

                if (!toDelete.isEmpty()) {
                    delete toDelete;
                    System.debug('🗑 Deleted: ' + toDelete.size());
                }

            } catch (Exception e) {
                System.debug('❌ Error syncing documents: ' + e.getMessage());
                throw new AuraHandledException(e.getMessage());
            }
        }

}