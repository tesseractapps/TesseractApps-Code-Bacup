public with sharing class TSignStaffTriggerHandler {

    // ---- Module mapping by account type + user type ----
    public static final Map<String, Map<String, List<String>>> MODULE_MAP =
        new Map<String, Map<String, List<String>>>{

        'Organisation' => new Map<String, List<String>>{
            'T Sign Org Admin' => new List<String>{
                'T Sign','Folders','My Organisation', 'My Profile','Templates','Contact','Reports'
            },
            'T Sign Manager' => new List<String>{
                'T Sign','Folders', 'My Profile','Templates','Contact','Reports'
            },
            'T Sign Staff' => new List<String>{
                'T Sign','Folders', 'My Profile', 'Templates','Contact','Reports'
            }
        },

        'Individual' => new Map<String, List<String>>{
            'T Sign Org Admin' => new List<String>{
                'T Sign','Folders','My Profile','Templates','Contact','Reports'
            },
            'T Sign Manager' => new List<String>{
                'T Sign','Folders', 'My Profile', 'Templates','Contact','Reports'
            },
            'T Sign Staff' => new List<String>{
                'T Sign','Folders', 'My Profile', 'Templates','Contact','Reports'
            }
        }
    };

    public static void handleModuleAccess(
        List<TSign_Staff__c> newRecords,
        Map<Id, TSign_Staff__c> oldMap,
        Boolean isInsert
    ) {
        // 1. Collect records that need processing
        List<TSign_Staff__c> toProcess = new List<TSign_Staff__c>();

        for (TSign_Staff__c staff : newRecords) {
            if (isInsert) {
                toProcess.add(staff);
            } else {
                TSign_Staff__c old = oldMap.get(staff.Id);
                // Only when User_Type__c actually changed
                if (old != null && staff.User_Type__c != old.User_Type__c) {
                    toProcess.add(staff);
                }
            }
        }

        if (toProcess.isEmpty()) return;

        // 2. Gather parent Organisation Ids to query Account_Type__c
        Set<Id> orgIds = new Set<Id>();
        for (TSign_Staff__c staff : toProcess) {
            if (staff.TSign_Organisation__c != null) {
                orgIds.add(staff.TSign_Organisation__c);
            }
        }

        Map<Id, TSign_Organisation__c> orgMap = new Map<Id, TSign_Organisation__c>();
        if (!orgIds.isEmpty()) {
            orgMap = new Map<Id, TSign_Organisation__c>([
                SELECT Id, Account_Type__c
                FROM TSign_Organisation__c
                WHERE Id IN :orgIds
            ]);
        }

        // 3. Build update list
        List<TSign_Staff__c> updates = new List<TSign_Staff__c>();

        for (TSign_Staff__c staff : toProcess) {
            if (staff.TSign_Organisation__c == null) continue;

            TSign_Organisation__c org = orgMap.get(staff.TSign_Organisation__c);
            if (org == null || org.Account_Type__c == null) continue;

            Map<String, List<String>> typeMap = MODULE_MAP.get(org.Account_Type__c);
            if (typeMap == null) continue;

            List<String> modules = typeMap.get(staff.User_Type__c);
            if (modules == null) continue;

            updates.add(new TSign_Staff__c(
                Id = staff.Id,
                Module_Access__c = String.join(modules, ';')
            ));
        }

        if (!updates.isEmpty()) {
            // Avoid re-triggering the same logic
            TSignStaffTriggerHandler.bypass = true;
            update updates;
            TSignStaffTriggerHandler.bypass = false;
        }
    }

    public static Boolean bypass = false;
}