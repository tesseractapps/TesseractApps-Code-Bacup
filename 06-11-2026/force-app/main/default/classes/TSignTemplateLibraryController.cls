public without sharing class TSignTemplateLibraryController {

    /**
     * Retrieve all published library master templates assigned to the specified organisation.
     */
    @AuraEnabled(cacheable=true)
    public static List<TSign_Template__c> getLibraryTemplates(Id orgId) {
        if (orgId == null) {
            return new List<TSign_Template__c>();
        }

        // 1. Query active assignments for this organisation
        List<TSign_Template_Assignment__c> assignments = [
            SELECT TSign_Template__c
            FROM TSign_Template_Assignment__c
            WHERE TSign_Organisation__c = :orgId
            AND Status__c = 'Active'
        ];

        if (assignments.isEmpty()) {
            return new List<TSign_Template__c>();
        }

        Set<Id> masterTemplateIds = new Set<Id>();
        for (TSign_Template_Assignment__c a : assignments) {
            if (a.TSign_Template__c != null) {
                masterTemplateIds.add(a.TSign_Template__c);
            }
        }

        if (masterTemplateIds.isEmpty()) {
            return new List<TSign_Template__c>();
        }

        // 2. Query the published master templates
        return [
            SELECT Id,
                   Name,
                   Template_Name__c,
                   Template_Type__c,
                   Description__c,
                   File_Name__c,
                   Amazon_Url__c,
                   Key__c,
                   Placeholder_JSON__c,
                   CreatedDate,
                   LastModifiedDate,
                   CreatedById,
                   CreatedBy.Full_Name__c,
                   Is_Library_Template__c
            FROM TSign_Template__c
            WHERE Id IN :masterTemplateIds
            AND Is_Library_Template__c = true
            ORDER BY Template_Name__c ASC
        ];
    }

    /**
     * Clone one or multiple library templates into the client organisation's templates list.
     */
    @AuraEnabled
    public static List<Id> cloneLibraryTemplates(List<Id> sourceTemplateIds, Id targetOrgId, String facilityId) {
        if (sourceTemplateIds == null || sourceTemplateIds.isEmpty() || targetOrgId == null) {
            throw new AuraHandledException('Invalid template selection or organisation.');
        }

        // Validate active assignments for targetOrgId
        List<TSign_Template_Assignment__c> assignments = [
            SELECT TSign_Template__c
            FROM TSign_Template_Assignment__c
            WHERE TSign_Template__c IN :sourceTemplateIds
            AND TSign_Organisation__c = :targetOrgId
            AND Status__c = 'Active'
        ];

        Set<Id> validMasterIds = new Set<Id>();
        for (TSign_Template_Assignment__c a : assignments) {
            validMasterIds.add(a.TSign_Template__c);
        }

        if (validMasterIds.isEmpty()) {
            throw new AuraHandledException('No active assigned library templates found for cloning.');
        }

        List<TSign_Template__c> masters = [
            SELECT Id,
                   Template_Name__c,
                   Template_Type__c,
                   Description__c,
                   File_Name__c,
                   Amazon_Url__c,
                   Key__c,
                   Placeholder_JSON__c
            FROM TSign_Template__c
            WHERE Id IN :validMasterIds
            AND Is_Library_Template__c = true
        ];

        List<TSign_Template__c> clonesToInsert = new List<TSign_Template__c>();
        for (TSign_Template__c master : masters) {
            TSign_Template__c clone = new TSign_Template__c();
            clone.Template_Name__c    = master.Template_Name__c;
            clone.Template_Type__c    = master.Template_Type__c;
            clone.Description__c      = master.Description__c;
            clone.File_Name__c        = master.File_Name__c;
            clone.Amazon_Url__c       = master.Amazon_Url__c;
            clone.Key__c              = master.Key__c;
            clone.Placeholder_JSON__c = master.Placeholder_JSON__c;
            clone.Organisation_Id__c  = String.valueOf(targetOrgId);
            clone.Is_Library_Template__c = false;
            clone.Source_Template__c  = master.Id;
            clone.Status__c           = 'Draft';
            clone.TSign_Facility__c   = TSignTemplates.toFacilityId(facilityId);
            clonesToInsert.add(clone);
        }

        insert clonesToInsert;

        List<Id> newIds = new List<Id>();
        for (TSign_Template__c clone : clonesToInsert) {
            newIds.add(clone.Id);
        }
        return newIds;
    }


    /**
     * Retrieve all organisations with active assignment flag for a given template.
     */
    @AuraEnabled
    public static List<OrganisationAssignmentWrapper> getAssignableOrganisations(Id templateId) {
        List<TSign_Organisation__c> orgs = [
            SELECT Id, Name, CreatedDate
            FROM TSign_Organisation__c
            ORDER BY Name ASC
        ];

        Set<Id> assignedOrgIds = new Set<Id>();
        if (templateId != null) {
            for (TSign_Template_Assignment__c a : [
                SELECT TSign_Organisation__c
                FROM TSign_Template_Assignment__c
                WHERE TSign_Template__c = :templateId
                AND Status__c = 'Active'
            ]) {
                if (a.TSign_Organisation__c != null) {
                    assignedOrgIds.add(a.TSign_Organisation__c);
                }
            }
        }

        List<OrganisationAssignmentWrapper> wrappers = new List<OrganisationAssignmentWrapper>();
        for (TSign_Organisation__c org : orgs) {
            OrganisationAssignmentWrapper w = new OrganisationAssignmentWrapper();
            w.organisationId = org.Id;
            w.organisationName = org.Name;
            w.createdDate = org.CreatedDate;
            w.isAssigned = assignedOrgIds.contains(org.Id);
            wrappers.add(w);
        }
        return wrappers;
    }

    /**
     * Save/update organisation assignments for a template.
     */
    @AuraEnabled
    public static void saveTemplateAssignments(Id templateId, List<Id> assignedOrgIds) {
        if (templateId == null) {
            throw new AuraHandledException('Template ID is required.');
        }

        // Ensure template is marked as a library template
        TSign_Template__c template = [
            SELECT Id, Is_Library_Template__c
            FROM TSign_Template__c
            WHERE Id = :templateId
            LIMIT 1
        ];
        if (!template.Is_Library_Template__c) {
            template.Is_Library_Template__c = true;
            update template;
        }

        Set<Id> targetOrgIds = new Set<Id>();
        if (assignedOrgIds != null) {
            targetOrgIds.addAll(assignedOrgIds);
        }

        List<TSign_Template_Assignment__c> existingAssignments = [
            SELECT Id, TSign_Organisation__c, Status__c
            FROM TSign_Template_Assignment__c
            WHERE TSign_Template__c = :templateId
        ];

        Map<Id, TSign_Template_Assignment__c> orgToAssignment = new Map<Id, TSign_Template_Assignment__c>();
        for (TSign_Template_Assignment__c a : existingAssignments) {
            if (a.TSign_Organisation__c != null) {
                orgToAssignment.put(a.TSign_Organisation__c, a);
            }
        }

        List<TSign_Template_Assignment__c> toUpsert = new List<TSign_Template_Assignment__c>();

        for (Id orgId : targetOrgIds) {
            if (orgToAssignment.containsKey(orgId)) {
                TSign_Template_Assignment__c a = orgToAssignment.get(orgId);
                if (a.Status__c != 'Active') {
                    a.Status__c = 'Active';
                    a.Assigned_Date__c = DateTime.now();
                    a.Assigned_By__c = UserInfo.getUserId();
                    toUpsert.add(a);
                }
            } else {
                TSign_Template_Assignment__c newA = new TSign_Template_Assignment__c(
                    TSign_Template__c = templateId,
                    TSign_Organisation__c = orgId,
                    Status__c = 'Active',
                    Assigned_Date__c = DateTime.now(),
                    Assigned_By__c = UserInfo.getUserId()
                );
                toUpsert.add(newA);
            }
        }

        for (TSign_Template_Assignment__c a : existingAssignments) {
            if (!targetOrgIds.contains(a.TSign_Organisation__c) && a.Status__c == 'Active') {
                a.Status__c = 'Inactive';
                toUpsert.add(a);
            }
        }

        if (!toUpsert.isEmpty()) {
            upsert toUpsert;
        }
    }

    public class OrganisationAssignmentWrapper {
        @AuraEnabled public Id organisationId { get; set; }
        @AuraEnabled public String organisationName { get; set; }
        @AuraEnabled public Boolean isAssigned { get; set; }
        @AuraEnabled public DateTime createdDate { get; set; }
    }
}