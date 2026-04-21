global class SyncOrganisationRolesBatch
    implements Database.Batchable<SObject>, Database.Stateful {

    global Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator([
            SELECT Id,
                   SelectedRole__c,
                   Facility__c,
                   (SELECT Id, Facility__c FROM StaffRoles__r)
            FROM Staff__c
            WHERE Facility__c != NULL
        ]);
    }

    global void execute(Database.BatchableContext bc, List<Staff__c> staffList) {

        List<Staff__c> staffsToUpdate = new List<Staff__c>();
        List<StaffRole__c> rolesToUpdate = new List<StaffRole__c>();

        for (Staff__c staff : staffList) {

            // ---- Staff.SelectedRole__c (SAFE UPDATE) ----
            if (
                String.isNotBlank(staff.SelectedRole__c) &&
                !staff.SelectedRole__c.contains(staff.Facility__c)
            ) {
                staff.SelectedRole__c =
                    staff.SelectedRole__c + '-' + staff.Facility__c;
                staffsToUpdate.add(staff);
            }

            // ---- Child StaffRole Facility Backfill ----
            for (StaffRole__c role : staff.StaffRoles__r) {
                if (role.Facility__c == null) {
                    role.Facility__c = staff.Facility__c;
                    rolesToUpdate.add(role);
                }
            }
        }

        // ---- DML (safe & conditional) ----
        if (!staffsToUpdate.isEmpty()) {
            update staffsToUpdate;
        }

        if (!rolesToUpdate.isEmpty()) {
            update rolesToUpdate;
        }
    }

    global void finish(Database.BatchableContext bc) {
        System.debug('SyncOrganisationRolesBatch completed successfully');
    }
}