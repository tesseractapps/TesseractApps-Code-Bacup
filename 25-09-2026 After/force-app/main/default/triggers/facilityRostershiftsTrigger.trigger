trigger facilityRostershiftsTrigger on Facility__c(after insert) {
	 System.debug('===== Facility Trigger Fired =====');
	
	 if (Trigger.isAfter && Trigger.isInsert) {
        FacilityTriggerHandler.createDefaultShifts(Trigger.new);
    }
}