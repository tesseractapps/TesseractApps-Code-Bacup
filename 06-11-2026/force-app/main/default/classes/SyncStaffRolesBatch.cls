global class SyncStaffRolesBatch implements Database.Batchable<SObject>, Database.Stateful {

    // STEP 1: Fetch Staff records
    global Database.QueryLocator start(Database.BatchableContext BC) {
        return Database.getQueryLocator([
            SELECT Id, Role__c, 
                   Type_of_Job__c, Classification_Level__c, Classification_Pay_Point__c, 
                   Category_Type__c, Working_Hours_Rate__c, Saturday_Hourly_Rate__c, 
                   Sunday_Hourly_Rate__c, Public_holiday_Hourly_Rate__c, 
                   Afternoon_shift_Hourly_Rate__c, Night_shift_Hourly_Rate__c, 
                   Sleepover_Allowance__c
            FROM Staff__c
        ]);
    }

    // STEP 2: Process each batch of Staff records
    global void execute(Database.BatchableContext BC, List<Staff__c> staffList) {
        if (staffList.isEmpty()) return;

        // Collect Staff Ids
        Set<Id> staffIds = new Set<Id>();
        for (Staff__c s : staffList) {
            staffIds.add(s.Id);
        }

        // STEP 3: Fetch existing StaffRole__c to avoid duplicates
        Map<Id, Set<String>> existingStaffRolesMap = new Map<Id, Set<String>>();
        for (StaffRole__c sr : [
            SELECT RoleName__c, StaffRole_To_Staff__c 
            FROM StaffRole__c 
            WHERE StaffRole_To_Staff__c IN :staffIds
        ]) {
            if (!existingStaffRolesMap.containsKey(sr.StaffRole_To_Staff__c)) {
                existingStaffRolesMap.put(sr.StaffRole_To_Staff__c, new Set<String>());
            }
            existingStaffRolesMap.get(sr.StaffRole_To_Staff__c).add(sr.RoleName__c);
        }

        // STEP 4: Create new StaffRole__c records for ACTIVE (selected) roles only
        List<StaffRole__c> newRoles = new List<StaffRole__c>();

        for (Staff__c s : staffList) {
            // Skip if no roles are selected
            if (String.isBlank(s.Role__c)) continue;

            // Split selected roles
            Set<String> selectedRoles = new Set<String>(s.Role__c.split(';'));
            Set<String> existingRoles = existingStaffRolesMap.containsKey(s.Id)
                ? existingStaffRolesMap.get(s.Id)
                : new Set<String>();

            for (String role : selectedRoles) {
                String trimmedRole = role.trim();

                // Avoid duplicate StaffRole creation
                if (existingRoles.contains(trimmedRole)) continue;

                // Create ACTIVE StaffRole record
                newRoles.add(new StaffRole__c(
                    RoleName__c = trimmedRole,
                    Type_of_Job__c = s.Type_of_Job__c,
                    Classification_Level__c = s.Classification_Level__c,
                    Classification_Pay_Point__c = s.Classification_Pay_Point__c,
                    Category_Type__c = s.Category_Type__c,
                    Hourly_Rate__c = s.Working_Hours_Rate__c,
                    Saturday_Hourly_Rate__c = s.Saturday_Hourly_Rate__c,
                    Sunday_Hourly_Rate__c = s.Sunday_Hourly_Rate__c,
                    Public_holiday_Hourly_Rate__c = s.Public_holiday_Hourly_Rate__c,
                    Afternoon_shift_Hourly_Rate__c = s.Afternoon_shift_Hourly_Rate__c,
                    Night_shift_Hourly_Rate__c = s.Night_shift_Hourly_Rate__c,
                    Sleepover_Allowance__c = s.Sleepover_Allowance__c,
                    Active__c = true, //  Only active roles
                    StaffRole_To_Staff__c = s.Id
                ));

                existingRoles.add(trimmedRole);
                existingStaffRolesMap.put(s.Id, existingRoles);
            }
        }

        // STEP 5: Insert all new StaffRole__c records in bulk
        if (!newRoles.isEmpty()) {
            try {
                insert newRoles;
                System.debug('Inserted Active StaffRole__c records: ' + newRoles.size());
            } catch (DmlException e) {
                System.debug('Error inserting StaffRole__c: ' + e.getMessage());
            }
        }
    }

    // STEP 6: Finish message
    global void finish(Database.BatchableContext BC) {
        System.debug('🎯 Staff Role Sync Batch completed successfully — Active roles only.');
    }
}