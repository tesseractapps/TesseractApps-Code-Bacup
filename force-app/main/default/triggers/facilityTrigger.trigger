trigger facilityTrigger on Facility__c (before insert,after insert, after update) {
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
 }