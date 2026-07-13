/*trigger facilityTrigger on Facility__c (before insert,after insert, after update) {
    if(trigger.isBefore && trigger.isInsert){
         String orgId = CurrentUserOrganization.currentOrgId();
          for (Facility__c facility : Trigger.new) {
                facility.Organisation__c = orgId;
          }
    }
    if(trigger.isAfter){
        if(trigger.isInsert || trigger.isUpdate){
           
            
            List<RefreshDataTable__e> refreshDataTableEvents = new List<RefreshDataTable__e>();
            Map<String, String> emailToNewAbnMap  = new Map<String, String>();
            
            for (Facility__c facility : Trigger.new) {
                refreshDataTableEvents.add(new RefreshDataTable__e(
                    RecordId__c = facility.Id           
                ));
                
                if (Trigger.isUpdate) {
                    Facility__c oldFacility = Trigger.oldMap.get(facility.Id);
                    // Check if ABN changed
                    if (facility.ABN__c != oldFacility.ABN__c && facility.Email__c != null) {
                        emailToNewAbnMap .put(facility.Email__c, facility.ABN__c);
                    }
                }
            }
            //EventBus.publish(refreshDataTableEvents);
            if (!refreshDataTableEvents.isEmpty()) {
                EventBus.publish(refreshDataTableEvents);
            }
            
            if (!emailToNewAbnMap .isEmpty()) {
                List<Company__c> companiesToUpdate = [
                    SELECT Id, Name, ABN__c,Email__c 
                    FROM Company__c
                    WHERE Email__c IN :emailToNewAbnMap .keySet()
                ];
                
                for (Company__c company : companiesToUpdate) {
                    String newAbn = emailToNewAbnMap .get(company.Email__c);
                    if (newAbn != null && company.ABN__c != newAbn) {
                        company.ABN__c = newAbn;
                    }
                }
                
                if (!companiesToUpdate.isEmpty()) {
                    update companiesToUpdate;
                }
            }
        }
    }
 }*/

trigger facilityTrigger on Facility__c (before insert, before update, after insert, after update) {

    // ✅ BEFORE INSERT + UPDATE (Duplicate validation + org assignment)
    if(trigger.isBefore && (trigger.isInsert || trigger.isUpdate)){

        String orgId = CurrentUserOrganization.currentOrgId();

        Set<String> names = new Set<String>();
        Set<Id> orgIds = new Set<Id>();

        for (Facility__c facility : Trigger.new) {

            // Assign org on insert
            if (trigger.isInsert) {
                facility.Organisation__c = orgId;
            }

            if (String.isNotBlank(facility.Name)) {
                names.add(facility.Name.trim().toLowerCase());
            }

            if (facility.Organisation__c != null) {
                orgIds.add(facility.Organisation__c);
            }
        }

        // Query existing facilities
        Map<String, Id> existingMap = new Map<String, Id>();

        if (!names.isEmpty()) {
            for (Facility__c f : [
                SELECT Id, Name, Organisation__c
                FROM Facility__c
                WHERE Organisation__c IN :orgIds
            ]) {
                if (String.isNotBlank(f.Name)) {
                    String key = f.Organisation__c + '-' + f.Name.trim().toLowerCase();
                    existingMap.put(key, f.Id);
                }
            }
        }

        // Validate duplicates
        for (Facility__c facility : Trigger.new) {

            if (String.isBlank(facility.Name) || facility.Organisation__c == null) continue;

            String key = facility.Organisation__c + '-' + facility.Name.trim().toLowerCase();

            if (existingMap.containsKey(key)) {

                // Skip same record during update
                if (facility.Id != null && existingMap.get(key) == facility.Id) {
                    continue;
                }

                facility.addError('Facility with this name already exists in this organisation.');
            }
        }
    }

    // ✅ AFTER INSERT + UPDATE (your existing logic — unchanged)
    if(trigger.isAfter){
        if(trigger.isInsert || trigger.isUpdate){

            List<RefreshDataTable__e> refreshDataTableEvents = new List<RefreshDataTable__e>();
            Map<String, String> emailToNewAbnMap  = new Map<String, String>();

            for (Facility__c facility : Trigger.new) {
                refreshDataTableEvents.add(new RefreshDataTable__e(
                    RecordId__c = facility.Id           
                ));

                if (Trigger.isUpdate) {
                    Facility__c oldFacility = Trigger.oldMap.get(facility.Id);

                    if (facility.ABN__c != oldFacility.ABN__c && facility.Email__c != null) {
                        emailToNewAbnMap.put(facility.Email__c, facility.ABN__c);
                    }
                }
            }

            if (!refreshDataTableEvents.isEmpty()) {
                EventBus.publish(refreshDataTableEvents);
            }

            if (!emailToNewAbnMap.isEmpty()) {
                List<Company__c> companiesToUpdate = [
                    SELECT Id, Name, ABN__c, Email__c 
                    FROM Company__c
                    WHERE Email__c IN :emailToNewAbnMap.keySet()
                ];

                for (Company__c company : companiesToUpdate) {
                    String newAbn = emailToNewAbnMap.get(company.Email__c);
                    if (newAbn != null && company.ABN__c != newAbn) {
                        company.ABN__c = newAbn;
                    }
                }

                if (!companiesToUpdate.isEmpty()) {
                    update companiesToUpdate;
                }
            }
        }
    }
}