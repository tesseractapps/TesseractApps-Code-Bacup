trigger AvailabilityTrigger on Availability__c (before insert, before update,after insert,after update) {
     if(trigger.isbefore && (trigger.isInsert || trigger.isupdate)){
        for (Availability__c shift : Trigger.new) {
        if (
            shift.Shift_Type__c != null &&
            shift.Start_Time__c != null &&
            shift.End_Time__c != null &&
            shift.Start_Date__c != null
        ) {

            Date adjustedEndDate = ShiftDateCalculator.getAdjustedDate(
                shift.Start_Date__c,
                shift.Shift_Type__c,
                shift.Start_Time__c,
                shift.End_Time__c
            );

            shift.End_Date__c = adjustedEndDate;
        }
    }
     }

    
    if (Trigger.isAfter && (Trigger.isInsert || Trigger.isUpdate)) {
        // Filter only records with Assigned_Service_OR_Shift__c == false
        List<Availability__c> unassignedList = new List<Availability__c>();
        
        for (Availability__c avail : Trigger.new) {
            if (avail.Assigned_Service_OR_Shift__c == false) {
                unassignedList.add(avail);
            }
        }

        if (!unassignedList.isEmpty()) {
            RosterAutoScheduleTriggerHandler.createUnAssignedShifts(unassignedList, Trigger.newMap);
        }
    }

}