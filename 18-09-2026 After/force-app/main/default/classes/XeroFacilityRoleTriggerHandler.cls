/**
 * XeroFacilityRoleTriggerHandler
 * ------------------------------------------------------------------
 * On insert of Facility_Role__c:
 *   1. From the new role's Facility, resolve the Organisation.
 *   2. Get all Facilities in that Organisation.
 *   3. Get all Facility_Roles under those Facilities.
 *   4. Find roles that match the new role (case-insensitive name).
 *   5. Gather all Facility_Xero_Setting__c records for those roles.
 *   6. Build a fresh Facility_Xero_Setting__c for each unique setting
 *      definition and attach it to the new role.
 *
 * NOTE: we deliberately do NOT use SObject.clone() here. Cloning drags
 * along the parent relationship reference (Facility_Role__r), which
 * causes DML to fail with:
 *   - INVALID_FIELD: Cannot specify both an external ID reference
 *     Facility_Role__r and a salesforce id, Facility_Role__c
 *   - INVALID_FIELD_FOR_INSERT_UPDATE ... Facility_Role__r
 * Constructing a fresh record field-by-field removes both failure
 * modes entirely.
 */
public with sharing class XeroFacilityRoleTriggerHandler {

    public static void propagateToNewRoles(List<Facility_Role__c> newRoles) {

        if (newRoles == null || newRoles.isEmpty()) {
            return;
        }

        // ------------------------------------------------------------
        // 1. Collect Facility Ids from new roles
        // ------------------------------------------------------------
        Set<Id> facilityIds = new Set<Id>();
        for (Facility_Role__c role : newRoles) {
            if (role.Facility__c != null && String.isNotBlank(role.Role_Name__c)) {
                facilityIds.add(role.Facility__c);
            }
        }
        if (facilityIds.isEmpty()) {
            return;
        }

        // ------------------------------------------------------------
        // 2. Map Facility -> Organisation + Facility Name
        // ------------------------------------------------------------
        Map<Id, Id>     facilityToOrgId  = new Map<Id, Id>();
        Map<Id, String> facilityNameById = new Map<Id, String>();

        for (Facility__c f : [
            SELECT Id, Name, Organisation__c
            FROM Facility__c
            WHERE Id IN :facilityIds
        ]) {
            facilityToOrgId.put(f.Id, f.Organisation__c);
            facilityNameById.put(f.Id, f.Name);
        }

        // ------------------------------------------------------------
        // 3. Collect Org Ids + lowercased role names from new roles
        // ------------------------------------------------------------
        Set<Id>     orgIds       = new Set<Id>();
        Set<String> loweredNames = new Set<String>();

        for (Facility_Role__c role : newRoles) {
            Id orgId = facilityToOrgId.get(role.Facility__c);
            if (orgId != null && String.isNotBlank(role.Role_Name__c)) {
                orgIds.add(orgId);
                loweredNames.add(role.Role_Name__c.toLowerCase());
            }
        }
        if (orgIds.isEmpty() || loweredNames.isEmpty()) {
            return;
        }

        // ------------------------------------------------------------
        // 4. Get ALL Facilities under those Organisations
        // ------------------------------------------------------------
        Set<Id> allFacilityIdsInOrgs = new Set<Id>();
        for (Facility__c f : [
            SELECT Id
            FROM Facility__c
            WHERE Organisation__c IN :orgIds
        ]) {
            allFacilityIdsInOrgs.add(f.Id);
        }
        if (allFacilityIdsInOrgs.isEmpty()) {
            return;
        }

        // ------------------------------------------------------------
        // 5. Get ALL Facility_Roles under those Facilities, then filter
        //    in Apex for case-insensitive name match (exclude the new
        //    roles themselves so we don't clone from ourselves).
        // ------------------------------------------------------------
        List<Facility_Role__c> candidateRoles = [
            SELECT Id, Role_Name__c, Facility__c, Facility__r.Name,
                   Facility__r.Organisation__c
            FROM Facility_Role__c
            WHERE Facility__c IN :allFacilityIdsInOrgs
        ];

        Set<Id> newRoleIds = new Map<Id, Facility_Role__c>(newRoles).keySet();

        Map<Id, Facility_Role__c> matchedRolesById = new Map<Id, Facility_Role__c>();
        for (Facility_Role__c r : candidateRoles) {
            if (r.Role_Name__c == null) continue;
            if (newRoleIds.contains(r.Id)) continue;
            if (!loweredNames.contains(r.Role_Name__c.toLowerCase())) continue;
            matchedRolesById.put(r.Id, r);
        }
        if (matchedRolesById.isEmpty()) {
            return;
        }

        // ------------------------------------------------------------
        // 6. Get all Facility_Xero_Setting__c records for matched roles
        // ------------------------------------------------------------
        List<Facility_Xero_Setting__c> existingSettings = [
            SELECT
                Id, Name,
                Xero_Payitem__c, Xero_Payitem_Name__c,
                Category__c, Shift_Type__c, Custom_Shift_Type__c,
                Broken_Type__c, Sleepover_Type__c,
                OverTime_Type__c, Sub_Shift_Type__c, Custom_Rate_Type__c,
                Pay_Item_Type__c,
                Facility_Role__c,
                Facility_Role__r.Role_Name__c,
                Facility_Role__r.Facility__r.Organisation__c,
                Facility_Role__r.Facility__r.Name
            FROM Facility_Xero_Setting__c
            WHERE Facility_Role__c IN :matchedRolesById.keySet()
        ];

        // ------------------------------------------------------------
        // 7. Build a de-duplicated map of setting definitions
        //    key = orgId|loweredRoleName|payItemType|payitem|category|
        //          shift|customShift|broken|sleep|ot|sub|rate
        //    So one template per unique "shape" of setting.
        // ------------------------------------------------------------
        Map<String, Facility_Xero_Setting__c> templateByKey =
            new Map<String, Facility_Xero_Setting__c>();

        for (Facility_Xero_Setting__c s : existingSettings) {
            if (s.Facility_Role__r == null || String.isBlank(s.Facility_Role__r.Role_Name__c)) {
                continue;
            }
            Id orgId = s.Facility_Role__r.Facility__r.Organisation__c;
            if (orgId == null) {
                continue;
            }

            String loweredRoleName = s.Facility_Role__r.Role_Name__c.toLowerCase();

            String key =
                String.valueOf(orgId) + '|' +
                loweredRoleName + '|' +
                String.valueOf(s.Pay_Item_Type__c) + '|' +
                String.valueOf(s.Xero_Payitem__c) + '|' +
                String.valueOf(s.Category__c) + '|' +
                String.valueOf(s.Shift_Type__c) + '|' +
                String.valueOf(s.Custom_Shift_Type__c) + '|' +
                String.valueOf(s.Broken_Type__c) + '|' +
                String.valueOf(s.Sleepover_Type__c) + '|' +
                String.valueOf(s.OverTime_Type__c) + '|' +
                String.valueOf(s.Sub_Shift_Type__c) + '|' +
                String.valueOf(s.Custom_Rate_Type__c);

            if (!templateByKey.containsKey(key)) {
                templateByKey.put(key, s);
            }
        }

        if (templateByKey.isEmpty()) {
            return;
        }

        // ------------------------------------------------------------
        // 8. For each new role, build a FRESH Facility_Xero_Setting__c
        //    for every matching template. No clone() — field-by-field
        //    construction only, so Facility_Role__r is never touched.
        // ------------------------------------------------------------
        List<Facility_Xero_Setting__c> toInsert = new List<Facility_Xero_Setting__c>();

        for (Facility_Role__c newRole : newRoles) {

            if (newRole.Facility__c == null || String.isBlank(newRole.Role_Name__c)) {
                continue;
            }
            Id orgId = facilityToOrgId.get(newRole.Facility__c);
            if (orgId == null) {
                continue;
            }

            String loweredRoleName = newRole.Role_Name__c.toLowerCase();
            String orgPrefix       = String.valueOf(orgId) + '|' + loweredRoleName + '|';

            for (String key : templateByKey.keySet()) {
                if (!key.startsWith(orgPrefix)) {
                    continue;
                }

                Facility_Xero_Setting__c tpl = templateByKey.get(key);

                Facility_Xero_Setting__c cloned = new Facility_Xero_Setting__c();
                cloned.Facility_Role__c     = newRole.Id;
                cloned.Pay_Item_Type__c     = tpl.Pay_Item_Type__c;
                cloned.Xero_Payitem__c      = tpl.Xero_Payitem__c;
                cloned.Xero_Payitem_Name__c = tpl.Xero_Payitem_Name__c;
                cloned.Category__c          = tpl.Category__c;
                cloned.Shift_Type__c        = tpl.Shift_Type__c;
                cloned.Custom_Shift_Type__c = tpl.Custom_Shift_Type__c;
                cloned.Broken_Type__c       = tpl.Broken_Type__c;
                cloned.Sleepover_Type__c    = tpl.Sleepover_Type__c;
                cloned.OverTime_Type__c     = tpl.OverTime_Type__c;
                cloned.Sub_Shift_Type__c    = tpl.Sub_Shift_Type__c;
                cloned.Custom_Rate_Type__c  = tpl.Custom_Rate_Type__c;

                cloned.Name = buildSettingName(
                    tpl,
                    newRole,
                    facilityNameById.get(newRole.Facility__c)
                );

                toInsert.add(cloned);
            }
        }

        // ------------------------------------------------------------
        // 9. Insert
        // ------------------------------------------------------------
        if (!toInsert.isEmpty()) {
            insert toInsert;
        }
    }

    /**
     * Rebuilds the Facility_Xero_Setting__c.Name for a cloned record.
     * Mirrors the naming logic used in XeroSettingsController.
     */
    public static String buildSettingName(
        Facility_Xero_Setting__c tpl,
        Facility_Role__c newRole,
        String facilityName
    ) {
        if (String.isBlank(facilityName)) {
            facilityName = '';
        }

        String name;

        if (tpl.Pay_Item_Type__c == 'Reimbursement') {
            name = 'Reimbursement - ' + tpl.Xero_Payitem_Name__c;
        } else {
            name = tpl.Pay_Item_Type__c + ' - ' +
                   newRole.Role_Name__c + ' - ' +
                   facilityName + ' - ' +
                   tpl.Xero_Payitem_Name__c + ' - ' +
                   tpl.Category__c + ' - ' +
                   tpl.Shift_Type__c;

            if (String.isNotBlank(tpl.Custom_Shift_Type__c)) name += ' - ' + tpl.Custom_Shift_Type__c;
            if (String.isNotBlank(tpl.Custom_Rate_Type__c))  name += ' - ' + tpl.Custom_Rate_Type__c;
            if (String.isNotBlank(tpl.OverTime_Type__c))     name += ' - ' + tpl.OverTime_Type__c;
            if (String.isNotBlank(tpl.Sub_Shift_Type__c))    name += ' - ' + tpl.Sub_Shift_Type__c;
            if (String.isNotBlank(tpl.Broken_Type__c))       name += ' - ' + tpl.Broken_Type__c;
            if (String.isNotBlank(tpl.Sleepover_Type__c))    name += ' - ' + tpl.Sleepover_Type__c;
        }

        if (name != null && name.length() > 80) {
            name = name.substring(0, 80);
        }
        return name;
    }
}