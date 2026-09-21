trigger ParticipantAvailability on Availability__c (after insert,after update) {
    if(trigger.isafter && (trigger.isInsert )){
        RosterAutoScheduleTriggerHandler.createUnAssignedShifts(trigger.new,trigger.newMap);
    }

}