public class AvailabilityTrigger {
     public static void handleDelete(List<Availability__c> deletedAvailabilities) {
        Set<Id> availabilityIds = new Set<Id>();
        for (Availability__c avail : deletedAvailabilities) {
            availabilityIds.add(avail.Id);
        }

        // Step 1: Fetch Add_Shift__c and related ShiftwithStaff + Services_and_Support_Plan
        List<Add_Shift__c> addShiftsToDelete = [
            SELECT Id,
                (SELECT Id,
                    (SELECT Id FROM Services_and_Support_Plans__r)
                 FROM ShiftwithStaffs__r)
            FROM Add_Shift__c
            WHERE RefId__c IN :availabilityIds
            AND Un_Assigned_Shift__c = true
        ];

        // Step 2: Build delete lists
        List<Services_and_Support_Plan__c> servicesToDelete = new List<Services_and_Support_Plan__c>();
        List<ShiftwithStaff__c> shiftWithStaffsToDelete = new List<ShiftwithStaff__c>();

        for (Add_Shift__c addShift : addShiftsToDelete) {
            for (ShiftwithStaff__c shift : addShift.ShiftwithStaffs__r) {
                shiftWithStaffsToDelete.add(shift);
                for (Services_and_Support_Plan__c ssp : shift.Services_and_Support_Plans__r) {
                    servicesToDelete.add(ssp);
                }
            }
        }

        // Step 3: Delete in order (grandchildren -> children -> parent)
        if (!servicesToDelete.isEmpty()) delete servicesToDelete;
        if (!shiftWithStaffsToDelete.isEmpty()) delete shiftWithStaffsToDelete;
        if (!addShiftsToDelete.isEmpty()) delete addShiftsToDelete;
    }

}