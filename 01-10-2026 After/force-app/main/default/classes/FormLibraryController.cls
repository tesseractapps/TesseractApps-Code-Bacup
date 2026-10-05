public without sharing class FormLibraryController {

    /**
     * Check if current user has permission to assign library forms based on User.Can_Assign_Library_Forms__c
     */
    @AuraEnabled(cacheable=true)
        public static Boolean checkCanAssignPermission() {
            try {
                User currentUser = [
                    SELECT Id, Can_Assign_Library_Forms__c
                    FROM User
                    WHERE Id = :UserInfo.getUserId()
                    LIMIT 1
                ];

                System.debug(
                    'Can_Assign_Library_Forms__c: ' +
                    currentUser.Can_Assign_Library_Forms__c
                );

                return currentUser.Can_Assign_Library_Forms__c == true;

            } catch (Exception e) {
                System.debug(
                    'Error checking Can_Assign_Library_Forms__c: ' +
                    e.getMessage()
                );
                return false;
            }
        }

    /**
     * Fetch active library forms assigned to the specified client organisation
     */
    @AuraEnabled
    public static List<Dynamic_Form__c> getLibraryForms(Id orgId, String audience, String searchKey) {
        if (orgId == null) {
            return new List<Dynamic_Form__c>();
        }

        try {
            String query = 'SELECT Id, Name__c, Form_Type__c, Form_JSON__c, Audience__c, '
                         + '       Version_Label__c, CreatedDate, CreatedBy.Name '
                         + 'FROM Dynamic_Form__c '
                         + 'WHERE Id IN ('
                         + '    SELECT Dynamic_Form__c '
                         + '    FROM Form_Assignment__c '
                         + '    WHERE Organisation__c = :orgId '
                         + '    AND Status__c = \'Active\''
                         + ') '
                         + 'AND Is_Library_Form__c = true '
                         + 'AND Library_Status__c = \'Published\' ';

            if (String.isNotBlank(audience) && audience != 'All') {
                query += 'AND Audience__c = :audience ';
            }

            if (String.isNotBlank(searchKey)) {
                String keyWildcard = '%' + String.escapeSingleQuotes(searchKey.trim()) + '%';
                query += 'AND Name__c LIKE :keyWildcard ';
            }

            query += 'ORDER BY Name__c ASC';

            return Database.query(query);
        } catch (Exception e) {
            System.debug('Error in getLibraryForms: ' + e.getMessage());
            throw new AuraHandledException('Failed to fetch library forms: ' + e.getMessage());
        }
    }

    /**
     * Retrieve all available client organisations for assignment
     */
    @AuraEnabled(cacheable=true)
    public static List<Organisation__c> getAvailableOrganisations() {
        try {
            return [
                SELECT Id, Name 
                FROM Organisation__c 
                ORDER BY Name ASC
            ];
        } catch (Exception e) {
            System.debug('Error in getAvailableOrganisations: ' + e.getMessage());
            throw new AuraHandledException('Failed to fetch organisations: ' + e.getMessage());
        }
    }

    /**
     * Get current active organisation assignments for a specific form
     */
    @AuraEnabled
    public static List<Form_Assignment__c> getFormAssignments(Id formId) {
        if (formId == null) {
            return new List<Form_Assignment__c>();
        }
        try {
            return [
                SELECT Id, Organisation__c, Organisation__r.Name, Status__c, Assigned_Date__c
                FROM Form_Assignment__c
                WHERE Dynamic_Form__c = :formId
                AND Status__c = 'Active'
            ];
        } catch (Exception e) {
            System.debug('Error in getFormAssignments: ' + e.getMessage());
            throw new AuraHandledException('Failed to fetch form assignments: ' + e.getMessage());
        }
    }

    /**
     * Save/sync organisation assignments for a form
     */
    @AuraEnabled
    public static void saveFormAssignments(Id formId, List<Id> organisationIds) {
        if (formId == null) {
            throw new AuraHandledException('Invalid form ID.');
        }

        try {
            // 1. Ensure master form has Is_Library_Form__c = true and Library_Status__c = 'Published'
            List<Dynamic_Form__c> forms = [
                SELECT Id, Is_Library_Form__c, Library_Status__c, Form_Origin__c 
                FROM Dynamic_Form__c 
                WHERE Id = :formId 
                LIMIT 1
            ];

            if (forms.isEmpty()) {
                throw new AuraHandledException('Form not found for ID: ' + formId);
            }

            Dynamic_Form__c masterForm = forms[0];
            masterForm.Is_Library_Form__c = true;
            masterForm.Library_Status__c = 'Published';
            if (masterForm.Form_Origin__c == null || masterForm.Form_Origin__c == 'Organisation Form') {
                masterForm.Form_Origin__c = 'Library Master';
            }
            update masterForm;

            // 2. Fetch existing assignments
            List<Form_Assignment__c> existingAssignments = [
                SELECT Id, Organisation__c, Status__c
                FROM Form_Assignment__c
                WHERE Dynamic_Form__c = :formId
            ];

            Map<Id, Form_Assignment__c> existingByOrgId = new Map<Id, Form_Assignment__c>();
            for (Form_Assignment__c fa : existingAssignments) {
                existingByOrgId.put(fa.Organisation__c, fa);
            }

            Set<Id> targetOrgSet = new Set<Id>(organisationIds != null ? organisationIds : new List<Id>());
            List<Form_Assignment__c> toUpsert = new List<Form_Assignment__c>();

            // Reactivate or deactivate existing
            for (Id existingOrgId : existingByOrgId.keySet()) {
                Form_Assignment__c fa = existingByOrgId.get(existingOrgId);
                if (targetOrgSet.contains(existingOrgId)) {
                    if (fa.Status__c != 'Active') {
                        fa.Status__c = 'Active';
                        toUpsert.add(fa);
                    }
                } else {
                    if (fa.Status__c == 'Active') {
                        fa.Status__c = 'Inactive';
                        toUpsert.add(fa);
                    }
                }
            }

            // Insert new assignments
            for (Id newOrgId : targetOrgSet) {
                if (!existingByOrgId.containsKey(newOrgId)) {
                    toUpsert.add(new Form_Assignment__c(
                        Dynamic_Form__c  = formId,
                        Organisation__c  = newOrgId,
                        Status__c        = 'Active',
                        Assigned_By__c   = UserInfo.getUserId(),
                        Assigned_Date__c = System.now()
                    ));
                }
            }

            if (!toUpsert.isEmpty()) {
                upsert toUpsert;
            }
        } catch (Exception e) {
            System.debug('Error in saveFormAssignments: ' + e.getMessage());
            throw new AuraHandledException('Failed to save assignments: ' + e.getMessage());
        }
    }

    /**
     * Clone selected library master forms into the target client organisation
     */
    @AuraEnabled
    public static List<Id> cloneLibraryForms(List<Id> sourceFormIds, Id targetOrgId) {
        if (sourceFormIds == null || sourceFormIds.isEmpty() || targetOrgId == null) {
            throw new AuraHandledException('Invalid form selection or organisation.');
        }

        try {
            // Verify valid assignments
            List<Dynamic_Form__c> masters = [
                SELECT Id, Name__c, Form_JSON__c, Form_Type__c, Audience__c
                FROM Dynamic_Form__c
                WHERE Id IN :sourceFormIds
                AND Is_Library_Form__c = true
                AND Library_Status__c = 'Published'
                AND Id IN (
                    SELECT Dynamic_Form__c
                    FROM Form_Assignment__c
                    WHERE Organisation__c = :targetOrgId
                    AND Status__c = 'Active'
                )
            ];

            if (masters.isEmpty()) {
                throw new AuraHandledException('No valid assigned library forms found to clone.');
            }

            List<Dynamic_Form__c> clonesToInsert = new List<Dynamic_Form__c>();
            Datetime nowDT = System.now();

            for (Dynamic_Form__c master : masters) {
                String cleanName = master.Name__c != null 
                    ? master.Name__c.replaceAll('[^a-zA-Z0-9]', '') 
                    : 'Form';
                String newGroupId = cleanName + '_' + String.valueOf(nowDT.getTime()) + '_' + Math.round(Math.random() * 1000);

                clonesToInsert.add(new Dynamic_Form__c(
                    Name__c            = master.Name__c,
                    Form_JSON__c       = master.Form_JSON__c,
                    Form_Type__c       = master.Form_Type__c,
                    Audience__c        = master.Audience__c,
                    Org_Id__c          = String.valueOf(targetOrgId),
                    Form_Group_Id__c   = newGroupId,
                    Version_Label__c   = 'v1',
                    Is_Assigned__c     = false,
                    Is_Library_Form__c = false,
                    Form_Origin__c     = 'Library Clone',
                    Source_Form__c     = master.Id
                ));
            }

            insert clonesToInsert;

            List<Id> clonedIds = new List<Id>();
            for (Dynamic_Form__c clone : clonesToInsert) {
                clonedIds.add(clone.Id);
            }
            return clonedIds;
        } catch (Exception e) {
            System.debug('Error in cloneLibraryForms: ' + e.getMessage());
            throw new AuraHandledException('Failed to clone forms: ' + e.getMessage());
        }
    }
}