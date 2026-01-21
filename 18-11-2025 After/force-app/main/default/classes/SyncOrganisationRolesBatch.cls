global class SyncOrganisationRolesBatch implements Database.Batchable<SObject>, Database.Stateful {

    global Database.QueryLocator start(Database.BatchableContext BC) {
        return Database.getQueryLocator([
            SELECT Id, Roles__c,
                   (SELECT Id FROM Facilities__r)
            FROM Organisation__c
            WHERE Roles__c != null
        ]);
    }

    global void execute(Database.BatchableContext BC, List<Organisation__c> orgList) {
        // Step 1: Collect Facility → Organisation mapping
        Map<Id, Id> facilityToOrgMap = new Map<Id, Id>();
        for (Organisation__c org : orgList) {
            if (org.Facilities__r != null && !org.Facilities__r.isEmpty()) {
                for (Facility__c fac : org.Facilities__r) {
                    facilityToOrgMap.put(fac.Id, org.Id);
                }
            }
        }

        if (facilityToOrgMap.isEmpty()) return;

        // Step 2: Fetch existing Facility_Role__c to avoid duplicates
        Map<Id, Set<String>> facilityExistingRoles = new Map<Id, Set<String>>();
        for (Facility_Role__c fr : [
            SELECT Facility__c, Role_Name__c
            FROM Facility_Role__c
            WHERE Facility__c IN :facilityToOrgMap.keySet()
        ]) {
            if (!facilityExistingRoles.containsKey(fr.Facility__c)) {
                facilityExistingRoles.put(fr.Facility__c, new Set<String>());
            }
            facilityExistingRoles.get(fr.Facility__c).add(fr.Role_Name__c);
        }

        // Step 3: Get all available picklist values for Roles__c
        Set<String> allRoles = new Set<String>();
        Schema.DescribeFieldResult fieldDesc = Organisation__c.Roles__c.getDescribe();
        for (Schema.PicklistEntry pe : fieldDesc.getPicklistValues()) {
            allRoles.add(pe.getValue());
        }

        // Step 4: Map Org Id → Selected Roles and Unselected Roles
        Map<Id, Set<String>> orgSelectedRoles = new Map<Id, Set<String>>();
        Map<Id, Set<String>> orgUnselectedRoles = new Map<Id, Set<String>>();

        for (Organisation__c org : orgList) {
            Set<String> selectedRoles = new Set<String>();
            if (org.Roles__c != null) {
                selectedRoles.addAll(org.Roles__c.split(';'));
            }

            Set<String> unselectedRoles = new Set<String>(allRoles);
            unselectedRoles.removeAll(selectedRoles);

            orgSelectedRoles.put(org.Id, selectedRoles);
            orgUnselectedRoles.put(org.Id, unselectedRoles);
        }

        // Step 5: Create Facility_Role__c records
        List<Facility_Role__c> rolesToInsert = new List<Facility_Role__c>();

        for (Id facId : facilityToOrgMap.keySet()) {
            Id orgId = facilityToOrgMap.get(facId);
            Set<String> existingRoles = facilityExistingRoles.containsKey(facId)
                ? facilityExistingRoles.get(facId)
                : new Set<String>();

            // Active roles
            for (String roleName : orgSelectedRoles.get(orgId)) {
                String trimmed = roleName.trim();
                if (!existingRoles.contains(trimmed)) {
                    rolesToInsert.add(new Facility_Role__c(
                        Facility__c = facId,
                        Role_Name__c = trimmed,
                        Is_Active__c = true
                    ));
                    existingRoles.add(trimmed);
                }
            }

            // Inactive roles
            for (String roleName : orgUnselectedRoles.get(orgId)) {
                String trimmed = roleName.trim();
                if (!existingRoles.contains(trimmed)) {
                    rolesToInsert.add(new Facility_Role__c(
                        Facility__c = facId,
                        Role_Name__c = trimmed,
                        Is_Active__c = false
                    ));
                    existingRoles.add(trimmed);
                }
            }

            facilityExistingRoles.put(facId, existingRoles);
        }

        // Step 6: Insert in bulk
        if (!rolesToInsert.isEmpty()) {
            try {
                insert rolesToInsert;
                System.debug('Inserted ' + rolesToInsert.size() + ' Facility_Role__c records');
            } catch (DmlException e) {
                System.debug('Error inserting Facility_Role__c: ' + e.getMessage());
            }
        }
    }

    global void finish(Database.BatchableContext BC) {
        System.debug('Batch completed successfully!');
    }
}