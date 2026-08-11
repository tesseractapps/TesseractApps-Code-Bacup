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

  /*   @AuraEnabled
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
                    Status__c,Org__c,Facility_Ids__c
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
 */

    public class DocumentWrapper {

        @AuraEnabled
        public Facility_Compliance_Setting__c documentRec;

        @AuraEnabled
        public String rolesDisplay;

    }

    @AuraEnabled
    public static List<DocumentWrapper> getOrganisationDocuments(Id organisationId) {

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
                    Status__c,Org__c,Facility_Ids__c
                FROM Facility_Compliance_Setting__c
                WHERE Organisation__c = :organisationId
                AND Compliance_Category__c = 'Documents'
                ORDER BY CreatedDate DESC
            ];

        Set<Id> childIds = new Set<Id>();

        for(Facility_Compliance_Setting__c doc : documents){

            if(!doc.Org__c &&
 String.isNotBlank(doc.Facility_Ids__c)){

                for(String idStr : doc.Facility_Ids__c.split(';')){

                    if(String.isNotBlank(idStr)){
                        childIds.add((Id)idStr.trim());
                    }
                }
            }
        }

        Map<Id, Facility_Compliance_Setting__c> childMap =
            new Map<Id, Facility_Compliance_Setting__c>();

        if(!childIds.isEmpty()){

            childMap = new Map<Id, Facility_Compliance_Setting__c>([
                SELECT Id,
                    Roles__c
                FROM Facility_Compliance_Setting__c
                WHERE Id IN :childIds
            ]);
        }

        List<DocumentWrapper> result =
            new List<DocumentWrapper>();

        for(Facility_Compliance_Setting__c doc : documents){

            DocumentWrapper wrap =
                new DocumentWrapper();

            wrap.documentRec = doc;

            if(doc.Org__c){

                wrap.rolesDisplay =
                    doc.Org_Roles__c;

            }else{

                List<String> roleValues =
                    new List<String>();

                if(String.isNotBlank(doc.Facility_Ids__c)){

                    for(String idStr :
                        doc.Facility_Ids__c.split(';')){

                        Facility_Compliance_Setting__c child =
                            childMap.get((Id)idStr.trim());

                        if(child != null &&
                        String.isNotBlank(child.Roles__c)){

                            roleValues.add(
                                child.Roles__c
                            );
                        }
                    }
                }

                wrap.rolesDisplay =
                    String.join(roleValues, ', ');
            }

            result.add(wrap);
        }

        return result;
    }

 /*    @AuraEnabled
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
    } */

  /*   @AuraEnabled
public static List<Facility_Compliance_Setting__c> saveDocumentForOrganisation(
    Facility_Compliance_Setting__c recordData,
    Id organisationId,
    Boolean orgFlag,
    List<Id> facilityIds,
    List<String> selectedRoles
) {
    try {

        System.debug('📤 Saving Document for Organisation: ' + organisationId);

        if (organisationId == null) {
            throw new AuraHandledException('Organisation Id is required.');
        }

        List<Facility_Compliance_Setting__c> savedRecords =
            new List<Facility_Compliance_Setting__c>();

        // Always link record to organisation
        recordData.Organisation__c = organisationId;
        recordData.Org__c = orgFlag;

        // Ensure category
        recordData.Compliance_Category__c = 'Documents';

        // =====================================================
        // 🔥 ORG ONLY
        // =====================================================
        if (orgFlag == true) {

            if (recordData.Id == null) {
                insert recordData;
            } else {
                update recordData;
            }

            savedRecords.add(recordData);
        }

        // =====================================================
        // 🔥 ORG + FACILITY RECORDS
        // =====================================================
        else {

            // -----------------------------------------
            // 🔥 ORG RECORD
            // -----------------------------------------
            Facility_Compliance_Setting__c orgRecord =
                recordData.clone(false, true, false, false);

            orgRecord.Organisation__c = organisationId;

            orgRecord.Compliance_Category__c = 'Documents';

            orgRecord.Facility__c = null;
            orgRecord.Org__c = orgFlag;

            insert orgRecord;

            savedRecords.add(orgRecord);

              List<Facility_Compliance_Setting__c> facilityRecords =
                new List<Facility_Compliance_Setting__c>();

            // -----------------------------------------
            // 🔥 FACILITY RECORDS
            // -----------------------------------------
            if (facilityIds != null && !facilityIds.isEmpty()) {

                for (Id facilityId : facilityIds) {

                    Facility_Compliance_Setting__c facilityRecord =
                        recordData.clone(false, true, false, false);

                  facilityRecord.Organisation__c = null;
                   facilityRecord.Org_Roles__c = null;

                    facilityRecord.Compliance_Category__c = 'Documents';

                    facilityRecord.Facility__c = facilityId;

                    // 🔥 FILTER FACILITY ROLES
                    List<String> facilityRoles = new List<String>();

                    if (selectedRoles != null) {

                        for (String roleData : selectedRoles) {

                            List<String> parts = roleData.split('\\|');

                            if (parts.size() == 2 &&
                                parts[1] == String.valueOf(facilityId)) {

                                facilityRoles.add(parts[0]);
                            }
                        }
                    }

                    // 🔥 STORE ONLY FACILITY ROLES
                    facilityRecord.Roles__c =
                        String.join(facilityRoles, ';');

                     facilityRecords.add(facilityRecord);
                }
            }

             insert facilityRecords;
              savedRecords.addAll(facilityRecords);
               List<String> facilityRecordIds = new List<String>();

            for (Facility_Compliance_Setting__c rec : facilityRecords) {

                facilityRecordIds.add(rec.Id);
            }

            // =========================================
            // 🔥 NEW CHANGE
            // UPDATE ORG RECORD WITH FACILITY IDS
            // =========================================
            orgRecord.Facility_Ids__c =
                String.join(facilityRecordIds, ';');

            update orgRecord;
        }

        return savedRecords;

    } catch (AuraHandledException e) {

        throw e;

    } catch (Exception e) {

        throw new AuraHandledException(
            'Error saving organisation document: '
            + e.getMessage()
        );
    }
} */

@AuraEnabled
public static List<Facility_Compliance_Setting__c> saveDocumentForOrganisation(
    Facility_Compliance_Setting__c recordData,
    Id organisationId,
    Boolean orgFlag,
    List<Id> facilityIds,
    List<String> selectedRoles
) {
    try {

        System.debug('📤 Saving Document for Organisation: ' + organisationId);

        if (organisationId == null) {
            throw new AuraHandledException('Organisation Id is required.');
        }

        List<Facility_Compliance_Setting__c> savedRecords =
            new List<Facility_Compliance_Setting__c>();

        // =====================================================
        // COMMON FIELDS
        // =====================================================

        recordData.Organisation__c = organisationId;
        recordData.Org__c = orgFlag;
        recordData.Compliance_Category__c = 'Documents';

        // =====================================================
        // 🔥 ORG ONLY
        // =====================================================

        if (orgFlag == true) {

            if (recordData.Id == null) {

                insert recordData;

            } else {

                update recordData;
            }

            savedRecords.add(recordData);
        }

        // =====================================================
        // 🔥 FACILITY FLOW
        // =====================================================

        else {

            Facility_Compliance_Setting__c orgRecord;

            // =================================================
            // 🔥 UPDATE EXISTING ORG RECORD
            // =================================================

            if (recordData.Id != null) {

                orgRecord = [SELECT Id,Facility_Ids__c FROM Facility_Compliance_Setting__c WHERE Id = :recordData.Id LIMIT 1 ];

                orgRecord.Document_Name__c =
                    recordData.Document_Name__c;

                orgRecord.Documents_Category__c =
                    recordData.Documents_Category__c;

                orgRecord.X100_pointcheck__c =
                    recordData.X100_pointcheck__c;

                orgRecord.Mandatory_Document__c =
                    recordData.Mandatory_Document__c;

                orgRecord.Visible_to_Staff__c =
                    recordData.Visible_to_Staff__c;

                orgRecord.Expiry_Date_Required__c =
                    recordData.Expiry_Date_Required__c;

                orgRecord.Reminder1__c =
                    recordData.Reminder1__c;

                orgRecord.Reminder2__c =
                    recordData.Reminder2__c;

                orgRecord.Notes__c =
                    recordData.Notes__c;

                update orgRecord;

            } else {

                // =============================================
                // 🔥 CREATE ORG RECORD
                // =============================================

                orgRecord =
                    recordData.clone(false, true, false, false);

                orgRecord.Organisation__c =
                    organisationId;

                orgRecord.Compliance_Category__c =
                    'Documents';

                orgRecord.Facility__c = null;

                orgRecord.Org__c = false;

                insert orgRecord;
            }

            savedRecords.add(orgRecord);

            // =================================================
            // 🔥 FETCH EXISTING FACILITY RECORDS
            // =================================================

            Map<Id, Facility_Compliance_Setting__c> existingMap = new Map<Id,Facility_Compliance_Setting__c>();

            if (String.isNotBlank(orgRecord.Facility_Ids__c)) {

                List<Id> existingIds = orgRecord.Facility_Ids__c.split(';');

                List<Facility_Compliance_Setting__c> existingRecords = [SELECT Id,Facility__c,Roles__c FROM Facility_Compliance_Setting__c
                        WHERE Id IN :existingIds ];

                for (Facility_Compliance_Setting__c rec :existingRecords) {

                    existingMap.put(rec.Facility__c, rec);
                }
            }

            // =================================================
            // 🔥 DML LISTS
            // =================================================

            List<Facility_Compliance_Setting__c> recordsToInsert = new List<Facility_Compliance_Setting__c>();

            List<Facility_Compliance_Setting__c> recordsToUpdate = new List<Facility_Compliance_Setting__c>();

            List<Facility_Compliance_Setting__c> recordsToDelete = new List<Facility_Compliance_Setting__c>();

            List<String> finalFacilityRecordIds = new List<String>();

            // =================================================
            // 🔥 LOOP SELECTED FACILITIES
            // =================================================

            if (facilityIds != null) {

                for (Id facilityId : facilityIds) {

                    Facility_Compliance_Setting__c facilityRecord;

                    // =========================================
                    // EXISTING RECORD
                    // =========================================

                    if (existingMap.containsKey(facilityId )) {

                        facilityRecord = existingMap.get(facilityId);

                    } else {

                        // =====================================
                        // NEW RECORD
                        // =====================================

                        facilityRecord = new Facility_Compliance_Setting__c();

                        facilityRecord.Facility__c = facilityId;
                    }

                    // =========================================
                    // COMMON FIELDS
                    // =========================================

                    facilityRecord.Document_Name__c = recordData.Document_Name__c;
                    facilityRecord.Documents_Category__c = recordData.Documents_Category__c;
                    facilityRecord.X100_pointcheck__c = recordData.X100_pointcheck__c;
                    facilityRecord.Mandatory_Document__c = recordData.Mandatory_Document__c;
                    facilityRecord.Visible_to_Staff__c = recordData.Visible_to_Staff__c;
                    facilityRecord.Expiry_Date_Required__c = recordData.Expiry_Date_Required__c;
                    facilityRecord.Reminder1__c = recordData.Reminder1__c;
                    facilityRecord.Reminder2__c = recordData.Reminder2__c;
                    facilityRecord.Notes__c = recordData.Notes__c;
                    facilityRecord.Compliance_Category__c = 'Documents';
                    facilityRecord.Organisation__c = null;
                    facilityRecord.Org__c = false;

                    // =========================================
                    // ROLE FILTER
                    // =========================================

                    List<String> facilityRoles =new List<String>();

                    if (selectedRoles != null) {

                        for (String roleData :selectedRoles) {

                            List<String> parts =roleData.split('\\|');
                            
                            if (parts.size() == 2 && parts[1] ==String.valueOf(facilityId)) {
                               facilityRoles.add(parts[0] );
                            }
                        }
                    }

                    facilityRecord.Roles__c = String.join(facilityRoles, ';' );

                    // =========================================
                    // INSERT / UPDATE
                    // =========================================

                    if (facilityRecord.Id != null) {

                        recordsToUpdate.add(
                            facilityRecord
                        );

                        finalFacilityRecordIds.add(
                            facilityRecord.Id
                        );

                    } else {

                        recordsToInsert.add(
                            facilityRecord
                        );
                    }
                }
            }

            // =================================================
            // 🔥 DELETE DESELECTED FACILITIES
            // =================================================

            Set<Id> latestFacilityIds = new Set<Id>(facilityIds);

            for (Facility_Compliance_Setting__c rec : existingMap.values()) {

                if (!latestFacilityIds.contains(rec.Facility__c)) {
                    recordsToDelete.add(rec);
                }
            }

            // =================================================
            // 🔥 INSERT
            // =================================================

            if (!recordsToInsert.isEmpty()) {

                insert recordsToInsert;

                for ( Facility_Compliance_Setting__c rec : recordsToInsert) {

                    finalFacilityRecordIds.add( rec.Id );
                }

                savedRecords.addAll(recordsToInsert);
            }

            // =================================================
            // 🔥 UPDATE
            // =================================================

            if (!recordsToUpdate.isEmpty()) {

                update recordsToUpdate;

                savedRecords.addAll(recordsToUpdate);
            }

            // =================================================
            // 🔥 DELETE
            // =================================================

            if (!recordsToDelete.isEmpty()) {

                delete recordsToDelete;
            }

            // =================================================
            // 🔥 UPDATE ORG RECORD IDS
            // =================================================

            orgRecord.Facility_Ids__c =String.join( finalFacilityRecordIds, ';');
            update orgRecord;
            }

        return savedRecords;

    } catch (AuraHandledException e) {

        throw e;

    } catch (Exception e) {

        throw new AuraHandledException(
            'Error saving organisation document: '
            + e.getMessage()
        );
    }
}

/* @AuraEnabled
public static void UpdateDocumentForOrganisation(Facility_Compliance_Setting__c recordData,Id organisationId) {

    try {
        Facility_Compliance_Setting__c mainRecord =[SELECT Id, Org__c,Facility_Ids__c FROM Facility_Compliance_Setting__c WHERE Id = :recordData.Id LIMIT 1];

        List<Facility_Compliance_Setting__c> recordsToUpdate = new List<Facility_Compliance_Setting__c>();

       
         if (recordData.Mandatory_Document__c!= null) { 
           mainRecord.Mandatory_Document__c = recordData.Mandatory_Document__c;
       } 

         if (recordData.Visible_to_Staff__c!= null) { 
         mainRecord.Visible_to_Staff__c = recordData.Visible_to_Staff__c;
         } 

        if (recordData.Expiry_Date_Required__c!= null ) { 

            mainRecord.Expiry_Date_Required__c = recordData.Expiry_Date_Required__c;
         } 

        recordsToUpdate.add(mainRecord);

        // =====================================
        // FACILITY FLOW
        // =====================================

        if ( mainRecord.Org__c == false && String.isNotBlank( mainRecord.Facility_Ids__c) ) {

            List<Id> facilityRecordIds = mainRecord.Facility_Ids__c.split(';');

            List<Facility_Compliance_Setting__c> facilityRecords = [SELECT Id,
                           Mandatory_Document__c,
                           Visible_to_Staff__c,
                           Expiry_Date_Required__c
                    FROM Facility_Compliance_Setting__c
                    WHERE Id IN :facilityRecordIds
                ];

            for (Facility_Compliance_Setting__c rec :facilityRecords) {

                if ( recordData.Mandatory_Document__c!= null ) {

                    rec.Mandatory_Document__c = recordData.Mandatory_Document__c;
                }

                if (recordData.Visible_to_Staff__c != null ) {

                    rec.Visible_to_Staff__c = recordData.Visible_to_Staff__c;
                }

                if (recordData.Expiry_Date_Required__c != null) {

                    rec.Expiry_Date_Required__c =recordData.Expiry_Date_Required__c;
                }

                recordsToUpdate.add(rec);
            }
        }

        // =====================================
        // UPDATE
        // =====================================

        if (!recordsToUpdate.isEmpty()) {

            update recordsToUpdate;
        }

    } catch (Exception e) {

        throw new AuraHandledException(
            'Error updating record: '
            + e.getMessage()
        );
    }
} */

@AuraEnabled
public static void UpdateDocumentForOrganisation( Id recordId, String fieldName, Boolean value, Id organisationId) {

    try {

        Facility_Compliance_Setting__c mainRecord =
        [SELECT Id, Org__c, Facility_Ids__c FROM Facility_Compliance_Setting__c
            WHERE Id = :recordId
            LIMIT 1
        ];

        List<Facility_Compliance_Setting__c>
            recordsToUpdate =
                new List<Facility_Compliance_Setting__c>();

        // =====================================
        // UPDATE MAIN RECORD
        // =====================================

        mainRecord.put(
            fieldName,
            value
        );

        recordsToUpdate.add(mainRecord);

        // =====================================
        // FACILITY RECORDS
        // =====================================

        if (
            mainRecord.Org__c == false &&
            String.isNotBlank(
                mainRecord.Facility_Ids__c
            )
        ) {

            List<Id> facilityRecordIds =
                mainRecord.Facility_Ids__c
                    .split(';');

            List<Facility_Compliance_Setting__c>
                facilityRecords =
                [
                    SELECT Id
                    FROM Facility_Compliance_Setting__c
                    WHERE Id IN :facilityRecordIds
                ];

            for (
                Facility_Compliance_Setting__c rec :
                facilityRecords
            ) {

                rec.put(
                    fieldName,
                    value
                );

                recordsToUpdate.add(rec);
            }
        }

        // =====================================
        // UPDATE
        // =====================================

        if (!recordsToUpdate.isEmpty()) {

            update recordsToUpdate;
        }

    } catch (Exception e) {

        throw new AuraHandledException(
            'Error updating record: '
            + e.getMessage()
        );
    }
}

@AuraEnabled
public static List<Facility_Compliance_Setting__c> getFacilityRecords(
    List<Id> recordIds
){
    return [
        SELECT Id,
               Facility__c,
               Facility__r.Name,
               Roles__c
        FROM Facility_Compliance_Setting__c
        WHERE Id IN :recordIds
    ];
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

   /*  @AuraEnabled
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
    } */

    @AuraEnabled
    public static void deleteOrganisationDocument(Id documentId) {

        try {

          
            Facility_Compliance_Setting__c mainRecord =[SELECT Id,Facility_Ids__c FROM Facility_Compliance_Setting__c WHERE Id = :documentId LIMIT 1];

            List<Facility_Compliance_Setting__c> recordsToDelete = new List<Facility_Compliance_Setting__c>();


            if (String.isNotBlank( mainRecord.Facility_Ids__c)) {

                List<Id> facilityRecordIds = mainRecord.Facility_Ids__c.split(';');

                List<Facility_Compliance_Setting__c> facilityRecords = [SELECT Id FROM Facility_Compliance_Setting__c WHERE Id IN :facilityRecordIds];

                recordsToDelete.addAll( facilityRecords);
            }
            recordsToDelete.add(mainRecord);

            delete recordsToDelete;

        } catch (Exception e) {

            throw new AuraHandledException(
                'Error deleting document: '
                + e.getMessage()
            );
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
    public static List<Map<String, Object>> getFacilityIdentityDocuments(
        List<String> facilityId,
        Id staffId,
        Id currentDocumentId
    ) {
        try {

            Set<String> uploadedDocumentTypes = new Set<String>();

            if (staffId != null) {
                for (Child_Staff__c doc : [
                    SELECT Id, Document_Type__c
                    FROM Child_Staff__c
                    WHERE Staff__c = :staffId
                    AND Is_Archived__c = false
                ]) {

                    // Skip the document currently being edited
                    if (currentDocumentId != null && doc.Id == currentDocumentId) {
                        continue;
                    }

                    if (String.isNotBlank(doc.Document_Type__c)) {
                        uploadedDocumentTypes.add(doc.Document_Type__c.trim().toLowerCase());
                    }
                }
            }
        
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
            allDocuments.addAll(facilityDocs);
            }

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
            
            // return allDocuments;

            System.debug('================ COMPARISON START ================');

            List<Map<String, Object>> filteredDocuments = new List<Map<String, Object>>();

            for (Map<String, Object> doc : allDocuments) {

                String docName = (String)doc.get('name');

                String normalizedDoc =
                    String.isBlank(docName)
                    ? ''
                    : docName.trim().toLowerCase();

                Boolean alreadyUploaded =
                    uploadedDocumentTypes.contains(normalizedDoc);

                System.debug(
                    'Available : "' + docName +
                    '" | Normalized : "' + normalizedDoc +
                    '" | Uploaded? : ' + alreadyUploaded
                );

                if (!alreadyUploaded) {
                    filteredDocuments.add(doc);
                }
            }

            System.debug('================ FINAL DROPDOWN ================');
            System.debug('Filtered Count = ' + filteredDocuments.size());

            for (Map<String, Object> doc : filteredDocuments) {
                System.debug('Dropdown -> ' + doc.get('name'));
            }

            return filteredDocuments;
                        
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
                    Documents_Category__c,Identity_Category__c,Training_Category__c,
                    X100_pointcheck__c,
                    Mandatory_Document__c,
                    Visible_to_Staff__c,
                    Org_Roles__c,
                    Expiry_Date_Required__c
                FROM Facility_Compliance_Setting__c
                WHERE Organisation__c = :orgId AND Org__c = true 
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
                dm.put('Identity_Category__c', doc.Identity_Category__c);
                dm.put('Documents_Category__c', doc.Documents_Category__c);
                dm.put('Training_Category__c', doc.Training_Category__c);
                    

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
                    Visible_to_Staff__c, Roles__c, Expiry_Date_Required__c, Facility__c, Facility__r.Name
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
                    dm.put('facilityName', doc.Facility__r.Name);
                    dm.put('Identity_Category__c', doc.Identity_Category__c);
                    dm.put('Documents_Category__c', doc.Documents_Category__c);
                    dm.put('Training_Category__c', doc.Training_Category__c);
                    
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