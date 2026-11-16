public with sharing class OfferTemplateDocumentTypeController { 

    /**
     * Retrieves all active global defaults and organization-specific document types.
     */
    @AuraEnabled(cacheable=true)
    public static List<OfferTemplateDocumentType__c> getDocumentTypes(Id orgId) {
        try {
            return [
                SELECT Id, Document_Type_Name__c, Organization__c, Active__c, Is_Default__c, DocumentTypeNameNormalized__c
                FROM OfferTemplateDocumentType__c
                WHERE Active__c = true
                AND (Is_Default__c = true OR Organization__c = :orgId)
                ORDER BY Document_Type_Name__c ASC
            ];
        } catch (Exception ex) {
            throw new AuraHandledException(ex.getMessage());
        }
    }

    /**
     * Creates an organization-specific custom Document Type.
     * Enforces case-insensitive duplicate checks and uniqueness logic.
     */
    @AuraEnabled
    public static OfferTemplateDocumentType__c createDocumentType(String documentTypeName, Id orgId) {
        try {
            if (String.isBlank(documentTypeName)) {
                throw new AuraHandledException('Document Type name cannot be empty.');
            }
            
            String displayName = documentTypeName.trim();
            if (String.isBlank(displayName)) {
                throw new AuraHandledException('Document Type name cannot be blank.');
            }
            
            String normalized = normalizeName(displayName);
            
            // 1. Pre-check: Check against active global defaults and the organization's custom types
            List<OfferTemplateDocumentType__c> duplicates = [
                SELECT Id, Document_Type_Name__c
                FROM OfferTemplateDocumentType__c
                WHERE DocumentTypeNameNormalized__c = :normalized
                AND (Is_Default__c = true OR Organization__c = :orgId)
                LIMIT 1
            ];
            
            if (!duplicates.isEmpty()) {
                throw new AuraHandledException('A Document Type with the name "' + displayName + '" already exists.');
            }
            
            // 2. Insert document type record
            OfferTemplateDocumentType__c newDocType = new OfferTemplateDocumentType__c();
            newDocType.Document_Type_Name__c = displayName;
            newDocType.DocumentTypeNameNormalized__c = normalized;
            newDocType.Organization__c = orgId;
            newDocType.Is_Default__c = false;
            newDocType.Active__c = true;
            newDocType.Org_and_Normalized_Name__c = String.valueOf(orgId) + '_' + normalized;
            
            insert newDocType;
            return newDocType;
            
        } catch (DmlException dmlEx) {
            // Catch concurrent duplicate errors from unique key Org_and_Normalized_Name__c
            if (dmlEx.getDmlMessage(0).contains('Org_and_Normalized_Name__c') || dmlEx.getMessage().contains('DUPLICATE_VALUE')) {
                throw new AuraHandledException('A Document Type with this name already exists (concurrent request blocked).');
            }
            throw new AuraHandledException(dmlEx.getDmlMessage(0));
        } catch (Exception ex) {
            throw new AuraHandledException(ex.getMessage());
        }
    }

    /**
     * Updates an organization-specific custom Document Type name.
     * Enforces duplicate name rules and server-side security checks.
     */
    @AuraEnabled
    public static OfferTemplateDocumentType__c updateDocumentType(Id documentTypeId, String documentTypeName, Id orgId) {
        try {
            if (documentTypeId == null) {
                throw new AuraHandledException('Document Type ID cannot be null.');
            }
            if (String.isBlank(documentTypeName)) {
                throw new AuraHandledException('Document Type name cannot be empty.');
            }
            
            String displayName = documentTypeName.trim();
            if (String.isBlank(displayName)) {
                throw new AuraHandledException('Document Type name cannot be blank.');
            }
            
            // Fetch existing record and validate access
            OfferTemplateDocumentType__c docType = [
                SELECT Id, Is_Default__c, Organization__c
                FROM OfferTemplateDocumentType__c
                WHERE Id = :documentTypeId
                LIMIT 1
            ];
            
            if (docType.Is_Default__c) {
                throw new AuraHandledException('Access Denied: Global default Document Types cannot be modified.');
            }
            if (docType.Organization__c != orgId) {
                throw new AuraHandledException('Access Denied: You do not have permission to modify this Document Type.');
            }
            
            String normalized = normalizeName(displayName);
            
            // Duplicate Check excluding the current record
            List<OfferTemplateDocumentType__c> duplicates = [
                SELECT Id, Document_Type_Name__c
                FROM OfferTemplateDocumentType__c
                WHERE DocumentTypeNameNormalized__c = :normalized
                AND Id != :documentTypeId
                AND (Is_Default__c = true OR Organization__c = :orgId)
                LIMIT 1
            ];
            
            if (!duplicates.isEmpty()) {
                throw new AuraHandledException('A Document Type with the name "' + displayName + '" already exists.');
            }
            
            // Update fields
            docType.Document_Type_Name__c = displayName;
            docType.DocumentTypeNameNormalized__c = normalized;
            docType.Org_and_Normalized_Name__c = String.valueOf(orgId) + '_' + normalized;
            
            update docType;
            return docType;
            
        } catch (DmlException dmlEx) {
            if (dmlEx.getDmlMessage(0).contains('Org_and_Normalized_Name__c') || dmlEx.getMessage().contains('DUPLICATE_VALUE')) {
                throw new AuraHandledException('A Document Type with this name already exists (concurrent request blocked).');
            }
            throw new AuraHandledException(dmlEx.getDmlMessage(0));
        } catch (Exception ex) {
            throw new AuraHandledException(ex.getMessage());
        }
    }

    /**
     * Deletes an organization-specific Document Type.
     * Soft-deactivates the record if it is referenced by existing templates, otherwise hard-deletes it.
     */
    @AuraEnabled
    public static void deleteDocumentType(Id documentTypeId, Id orgId) {
        try {
            if (documentTypeId == null) {
                throw new AuraHandledException('Document Type ID cannot be null.');
            }
            
            // Fetch existing record and validate access
            OfferTemplateDocumentType__c docType = [
                SELECT Id, Is_Default__c, Organization__c
                FROM OfferTemplateDocumentType__c
                WHERE Id = :documentTypeId
                LIMIT 1
            ];
            
            if (docType.Is_Default__c) {
                throw new AuraHandledException('Access Denied: Global default Document Types cannot be deleted.');
            }
            if (docType.Organization__c != orgId) {
                throw new AuraHandledException('Access Denied: You do not have permission to delete this Document Type.');
            }
            
            // Check if any templates reference this document type
            Integer refCount = [
                SELECT count()
                FROM Offer_Template__c
                WHERE OfferTemplateDocumentType__c = :documentTypeId
                LIMIT 1
            ];
            
            if (refCount > 0) {
                // Preserved internally by setting Active__c to false
                docType.Active__c = false;
                update docType;
            } else {
                // Hard delete since it has no template relationships
                delete docType;
            }
            
        } catch (Exception ex) {
            throw new AuraHandledException(ex.getMessage());
        }
    }

    /**
     * Retrieves the currently selected Document Type ID for a template.
     */
    @AuraEnabled(cacheable=true)
    public static Id getTemplateDocumentTypeId(Id templateId) {
        try {
            if (templateId == null) {
                return null;
            }
            List<Offer_Template__c> templates = [
                SELECT OfferTemplateDocumentType__c
                FROM Offer_Template__c
                WHERE Id = :templateId
                LIMIT 1
            ];
            return templates.isEmpty() ? null : templates[0].OfferTemplateDocumentType__c;
        } catch (Exception ex) {
            throw new AuraHandledException(ex.getMessage());
        }
    }

    /**
     * Validates that both the template and selected document type are authorized for the given organization.
     */
    public static void validateOfferTemplateAndDocumentType(Id templateId, Id documentTypeId, Id orgId) {
        if (templateId != null) {
            List<Offer_Template__c> templates = [
                SELECT Orgnisation_Id__c
                FROM Offer_Template__c
                WHERE Id = :templateId
                LIMIT 1
            ];
            if (!templates.isEmpty() && templates[0].Orgnisation_Id__c != String.valueOf(orgId)) {
                throw new AuraHandledException('Access Denied: The template does not belong to your organization.');
            }
        }
        
        if (documentTypeId != null) {
            List<OfferTemplateDocumentType__c> docTypes = [
                SELECT Organization__c, Is_Default__c, Active__c
                FROM OfferTemplateDocumentType__c
                WHERE Id = :documentTypeId
                LIMIT 1
            ];
            
            if (docTypes.isEmpty()) {
                throw new AuraHandledException('Access Denied: Invalid Document Type.');
            }
            
            OfferTemplateDocumentType__c docType = docTypes[0];
            if (!docType.Is_Default__c && docType.Organization__c != orgId) {
                throw new AuraHandledException('Access Denied: The selected Document Type does not belong to your organization.');
            }
            
            // Validate active flag only if the template is new or the selected type is being changed
            Boolean isChanging = true;
            if (templateId != null) {
                List<Offer_Template__c> currentTemplates = [
                    SELECT OfferTemplateDocumentType__c
                    FROM Offer_Template__c
                    WHERE Id = :templateId
                    LIMIT 1
                ];
                if (!currentTemplates.isEmpty() && currentTemplates[0].OfferTemplateDocumentType__c == documentTypeId) {
                    isChanging = false;
                }
            }
            
            if (isChanging && !docType.Active__c) {
                throw new AuraHandledException('The selected Document Type is inactive and cannot be selected.');
            }
        }
    }

    /**
     * Retrieves a single Document Type by ID (even if inactive).
     */
    @AuraEnabled(cacheable=true)
    public static OfferTemplateDocumentType__c getDocumentTypeById(Id docTypeId, Id orgId) {
        try {
            if (docTypeId == null) {
                return null;
            }
            OfferTemplateDocumentType__c dt = [
                SELECT Id, Document_Type_Name__c, Active__c, Is_Default__c, Organization__c
                FROM OfferTemplateDocumentType__c
                WHERE Id = :docTypeId
                LIMIT 1
            ];
            if (!dt.Is_Default__c && dt.Organization__c != orgId) {
                throw new AuraHandledException('Access Denied: The selected Document Type does not belong to your organization.');
            }
            return dt;
        } catch (Exception ex) {
            throw new AuraHandledException(ex.getMessage());
        }
    }

    /**
     * Normalizes the name by trimming leading/trailing whitespace and transforming to lowercase.
     */
    private static String normalizeName(String name) {
        if (name == null) {
            return '';
        }
        return name.trim().toLowerCase();
    }
}