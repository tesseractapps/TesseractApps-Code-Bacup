trigger FacilityRoleTrigger on Facility_Role__c (after insert) {
    XeroFacilityRoleTriggerHandler.propagateToNewRoles(Trigger.new);
}