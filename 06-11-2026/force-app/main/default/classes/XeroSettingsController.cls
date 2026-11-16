public with sharing class XeroSettingsController {

    // ============================================================
    // GET CURRENT USER ORGANISATION
    // ============================================================
    @AuraEnabled(cacheable=true)
    public static Id getCurrentUserOrganisationId() {

        User currentUser = [
            SELECT Id, Email
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        List<Staff__c> staffRecords = [
            SELECT Id, Email_Address__c, Facility__c, Facility__r.Name, Facility__r.Organisation__c
            FROM Staff__c
            WHERE Email_Address__c = :currentUser.Email
            AND Facility__c != null
            LIMIT 1
        ];

        if (staffRecords.isEmpty()) {
            throw new AuraHandledException('No Staff record was found for the logged-in user.');
        }

        Staff__c staff = staffRecords[0];

        if (staff.Facility__r.Organisation__c == null) {
            throw new AuraHandledException('The Staff member\'s Facility is not associated with an Organisation.');
        }

        return staff.Facility__r.Organisation__c;
    }

    // ============================================================
    // SAVE FACILITY XERO SETTING - INSERT ONLY
    // ============================================================
    @AuraEnabled
    public static List<Facility_Xero_Setting__c> saveFacilityXeroSetting(
        Id organisationId,
        String payItemType,
        String roleName,
        String roleIds,
        String xeroPayitem,
        String xeroPayitemName,
        String category,
        String shiftType,
        String customShiftType,
        String brokenType,
        String sleepoverType,
        String overTimeType,
        String subShiftType,
        String customRateType,
        String extendedType
    ) {

        System.debug('========================================');
        System.debug('💾 START: Creating Xero Settings');
        System.debug('========================================');
        System.debug('Organisation Id    : ' + organisationId);
        System.debug('Pay Item Type      : ' + payItemType);
        System.debug('Role Name          : ' + roleName);
        System.debug('Role IDs           : ' + roleIds);
        System.debug('Xero Payitem       : ' + xeroPayitem);
        System.debug('Xero Payitem Name  : ' + xeroPayitemName);
        System.debug('OverTime Type      : ' + overTimeType);
        System.debug('Sub Shift Type     : ' + subShiftType);
        System.debug('Extended Type      : ' + extendedType);

        if (organisationId == null) {
            throw new AuraHandledException('Organisation is required.');
        }

        if (String.isBlank(payItemType)) {
            throw new AuraHandledException('Pay Item Type is required.');
        }

        if (String.isBlank(xeroPayitem)) {
            throw new AuraHandledException('Xero Payitem is required.');
        }

        if (payItemType == 'Reimbursement') {
            List<Facility_Xero_Setting__c> existingReimbursement = [
                SELECT Id, Name
                FROM Facility_Xero_Setting__c
                WHERE Pay_Item_Type__c = 'Reimbursement'
                AND Facility_Role__r.Facility__r.Organisation__c = :organisationId
                LIMIT 1
            ];

            if (!existingReimbursement.isEmpty()) {
                throw new AuraHandledException(
                    'A Reimbursement record already exists for this organisation. ' +
                    'Only one Reimbursement record is allowed per organisation.'
                );
            }

            category = null;
            shiftType = null;
            customShiftType = null;
            brokenType = null;
            sleepoverType = null;
            overTimeType = null;
            subShiftType = null;
            customRateType = null;
            extendedType = null;
        } else {
            if (String.isBlank(roleName)) {
                throw new AuraHandledException('Role is required for Earnings.');
            }

            if (String.isBlank(category)) {
                throw new AuraHandledException('Category is required for Earnings.');
            }

            if (String.isBlank(shiftType)) {
                throw new AuraHandledException('Shift Type is required for Earnings.');
            }

            if (shiftType == 'Custom' && String.isBlank(customShiftType)) {
                throw new AuraHandledException('Custom Shift Type is required when Shift Type is Custom.');
            }

            if (shiftType == 'Broken' && String.isBlank(brokenType)) {
                throw new AuraHandledException('Broken Type is required when Shift Type is Broken.');
            }

            if (shiftType == 'Broken' && brokenType != 'Fixed Rate' && brokenType != 'Allowance') {
                throw new AuraHandledException('Invalid Broken Type. Select Fixed Rate or Allowance.');
            }

            if (shiftType == 'Sleepover' && String.isBlank(sleepoverType)) {
                throw new AuraHandledException('Sleepover Rate Type is required when Shift Type is Sleepover.');
            }

            if (shiftType == 'OverTime' && String.isBlank(overTimeType)) {
                throw new AuraHandledException('OverTime Type is required when Shift Type is OverTime.');
            }

            if (shiftType == 'OverTime' && overTimeType != 'OverTime Rate 1' && overTimeType != 'OverTime Rate 2') {
                throw new AuraHandledException('Invalid OverTime Type. Select OverTime Rate 1 or OverTime Rate 2.');
            }

            if (shiftType == 'OverTime' && String.isBlank(subShiftType)) {
                throw new AuraHandledException('Sub Shift Type is required when Shift Type is OverTime.');
            }

            if (shiftType == 'Extended' && String.isBlank(extendedType)) {
                throw new AuraHandledException('Extended Type is required when Shift Type is Extended.');
            }

            if (
                shiftType == 'Custom' &&
                (customShiftType == 'General' || customShiftType == 'Morning' || customShiftType == 'Afternoon') &&
                String.isBlank(customRateType)
            ) {
                throw new AuraHandledException('Rate Type is required for this Custom Shift Type.');
            }
        }

        List<Facility_Role__c> matchingRoles = new List<Facility_Role__c>();

        if (payItemType == 'Reimbursement') {
            String reimbursementRoleName = 'Reimbursement';

            List<Facility_Role__c> reimbursementRoles = [
                SELECT Id, Role_Name__c, Facility__c, Facility__r.Name, Facility__r.Organisation__c
                FROM Facility_Role__c
                WHERE Role_Name__c = :reimbursementRoleName
                AND Facility__r.Organisation__c = :organisationId
                LIMIT 1
            ];

            if (reimbursementRoles.isEmpty()) {
                List<Facility__c> facilities = [
                    SELECT Id
                    FROM Facility__c
                    WHERE Organisation__c = :organisationId
                    LIMIT 1
                ];

                if (facilities.isEmpty()) {
                    throw new AuraHandledException('No Facility found for this organisation.');
                }

                Facility_Role__c newRole = new Facility_Role__c();
                newRole.Role_Name__c = reimbursementRoleName;
                newRole.Facility__c = facilities[0].Id;
                insert newRole;
                matchingRoles.add(newRole);
            } else {
                matchingRoles = reimbursementRoles;
            }
        } else {
            if (String.isNotBlank(roleIds)) {
                List<String> roleIdList = roleIds.split(',');
                Set<Id> roleIdSet = new Set<Id>();
                for (String idStr : roleIdList) {
                    if (String.isNotBlank(idStr)) {
                        roleIdSet.add((Id)idStr.trim());
                    }
                }

                if (!roleIdSet.isEmpty()) {
                    matchingRoles = [
                        SELECT Id, Role_Name__c, Facility__c, Facility__r.Name, Facility__r.Organisation__c
                        FROM Facility_Role__c
                        WHERE Id IN :roleIdSet
                        AND Facility__r.Organisation__c = :organisationId
                        ORDER BY Facility__r.Name
                    ];
                }
            }

            if (matchingRoles.isEmpty() && String.isNotBlank(roleName)) {
                matchingRoles = [
                    SELECT Id, Role_Name__c, Facility__c, Facility__r.Name, Facility__r.Organisation__c
                    FROM Facility_Role__c
                    WHERE Role_Name__c = :roleName
                    AND Facility__r.Organisation__c = :organisationId
                    ORDER BY Facility__r.Name
                ];
            }

            if (matchingRoles.isEmpty()) {
                throw new AuraHandledException(
                    'No Facility Role records were found for "' + roleName +
                    '" in the current Organisation.'
                );
            }

            return createEarningsSettings(
                organisationId,
                payItemType,
                roleName,
                xeroPayitem,
                xeroPayitemName,
                category,
                shiftType,
                customShiftType,
                brokenType,
                sleepoverType,
                overTimeType,
                subShiftType,
                customRateType,
                extendedType,
                matchingRoles
            );
        }

        List<Facility_Xero_Setting__c> existingSettings = [
            SELECT Id
            FROM Facility_Xero_Setting__c
            WHERE Facility_Role__c = :matchingRoles[0].Id
        ];

        if (!existingSettings.isEmpty()) {
            throw new AuraHandledException(
                'A setting already exists for this role. Please use Update instead.'
            );
        }

        Facility_Xero_Setting__c setting = new Facility_Xero_Setting__c();
        setting.Facility_Role__c = matchingRoles[0].Id;
        setting.Pay_Item_Type__c = payItemType;
        setting.Xero_Payitem__c = xeroPayitem;
        setting.Xero_Payitem_Name__c = xeroPayitemName;
        setting.Category__c = category;
        setting.Shift_Type__c = shiftType;
        setting.Custom_Shift_Type__c = null;
        setting.Broken_Type__c = null;
        setting.Sleepover_Type__c = null;
        setting.OverTime_Type__c = null;
        setting.Sub_Shift_Type__c = null;
        setting.Extended_Type__c = null;
        setting.Custom_Rate_Type__c = null;

        String generatedName = 'Reimbursement - ' + xeroPayitemName;
        if (generatedName.length() > 80) {
            generatedName = generatedName.substring(0, 80);
        }
        setting.Name = generatedName;

        insert setting;

        List<Facility_Xero_Setting__c> createdSettings = new List<Facility_Xero_Setting__c>();
        createdSettings.add(setting);

        return createdSettings;
    }

    public static List<Facility_Xero_Setting__c> createEarningsSettings(
        Id organisationId,
        String payItemType,
        String roleName,
        String xeroPayitem,
        String xeroPayitemName,
        String category,
        String shiftType,
        String customShiftType,
        String brokenType,
        String sleepoverType,
        String overTimeType,
        String subShiftType,
        String customRateType,
        String extendedType,
        List<Facility_Role__c> matchingRoles
    ) {

        List<Facility_Xero_Setting__c> existingPayitemSettings = [
            SELECT Id, Xero_Payitem__c, Facility_Role__r.Role_Name__c
            FROM Facility_Xero_Setting__c
            WHERE Xero_Payitem__c = :xeroPayitem
            AND Facility_Role__r.Facility__r.Organisation__c = :organisationId
        ];

        Set<String> rolesAlreadyUsingPayitem = new Set<String>();
        for (Facility_Xero_Setting__c s : existingPayitemSettings) {
            if (s.Facility_Role__r.Role_Name__c != roleName) {
                rolesAlreadyUsingPayitem.add(s.Facility_Role__r.Role_Name__c);
            }
        }

        if (!rolesAlreadyUsingPayitem.isEmpty()) {
            throw new AuraHandledException(
                'Xero Payitem "' + xeroPayitemName +
                '" already assigned to role "' + new List<String>(rolesAlreadyUsingPayitem)[0] +
                '". One Payitem can only link to one Role.'
            );
        }

        List<Facility_Xero_Setting__c> createdSettings = new List<Facility_Xero_Setting__c>();

        for (Facility_Role__c parentRole : matchingRoles) {

            List<Facility_Xero_Setting__c> existingSettings = [
                SELECT
                    Id,
                    Name,
                    Xero_Payitem__c,
                    Xero_Payitem_Name__c,
                    Category__c,
                    Shift_Type__c,
                    Custom_Shift_Type__c,
                    Broken_Type__c,
                    Sleepover_Type__c,
                    OverTime_Type__c,
                    Sub_Shift_Type__c,
                    Extended_Type__c,
                    Custom_Rate_Type__c,
                    Pay_Item_Type__c,
                    Facility_Role__c
                FROM Facility_Xero_Setting__c
                WHERE Facility_Role__c = :parentRole.Id
            ];

            if (!existingSettings.isEmpty()) {
                for (Facility_Xero_Setting__c existing : existingSettings) {
                    if (existing.Pay_Item_Type__c != payItemType) {
                        continue;
                    }

                    if (existing.Category__c != category) {
                        continue;
                    }

                    if (existing.Shift_Type__c != shiftType) {
                        continue;
                    }

                    Boolean isDuplicate = true;

                    if (shiftType == 'Custom') {
                        if (existing.Custom_Shift_Type__c != customShiftType) {
                            isDuplicate = false;
                        }
                        if (isDuplicate && (customShiftType == 'General' || customShiftType == 'Morning' || customShiftType == 'Afternoon')) {
                            if (existing.Custom_Rate_Type__c != customRateType) {
                                isDuplicate = false;
                            }
                        }
                    } else if (shiftType == 'Broken') {
                        if (existing.Broken_Type__c != brokenType) {
                            isDuplicate = false;
                        }
                    } else if (shiftType == 'Sleepover') {
                        if (existing.Sleepover_Type__c != sleepoverType) {
                            isDuplicate = false;
                        }
                    } else if (shiftType == 'OverTime') {
                        if (existing.OverTime_Type__c != overTimeType) {
                            isDuplicate = false;
                        }
                        if (existing.Sub_Shift_Type__c != subShiftType) {
                            isDuplicate = false;
                        }
                    } else if (shiftType == 'Extended') {
                        if (existing.Extended_Type__c != extendedType) {
                            isDuplicate = false;
                        }
                    }

                    if (isDuplicate) {
                        String errorMessage = 'A Xero setting already exists for Role "' + roleName +
                            '", Category "' + category +
                            '" and Shift Type "' + shiftType;

                        if (String.isNotBlank(customShiftType)) {
                            errorMessage += ' - Custom Shift "' + customShiftType + '"';
                        }

                        if (String.isNotBlank(customRateType)) {
                            errorMessage += ' - Rate Type "' + customRateType + '"';
                        }

                        if (String.isNotBlank(overTimeType)) {
                            errorMessage += ' - OverTime Type "' + overTimeType + '"';
                        }

                        if (String.isNotBlank(subShiftType)) {
                            errorMessage += ' - Sub Shift Type "' + subShiftType + '"';
                        }

                        if (String.isNotBlank(extendedType)) {
                            errorMessage += ' - Extended Type "' + extendedType + '"';
                        }

                        if (String.isNotBlank(brokenType)) {
                            errorMessage += ' - Broken Type "' + brokenType + '"';
                        }

                        if (String.isNotBlank(sleepoverType)) {
                            errorMessage += ' - Sleepover Type "' + sleepoverType + '"';
                        }

                        errorMessage += '" for Facility "' + parentRole.Facility__r.Name + '".';

                        throw new AuraHandledException(errorMessage);
                    }
                }
            }

            Facility_Xero_Setting__c setting = new Facility_Xero_Setting__c();
            setting.Facility_Role__c = parentRole.Id;
            setting.Pay_Item_Type__c = payItemType;
            setting.Xero_Payitem__c = xeroPayitem;
            setting.Xero_Payitem_Name__c = xeroPayitemName;
            setting.Category__c = category;
            setting.Shift_Type__c = shiftType;

            if (shiftType == 'Custom') {
                setting.Custom_Shift_Type__c = customShiftType;
            } else {
                setting.Custom_Shift_Type__c = null;
            }

            if (shiftType == 'Broken') {
                setting.Broken_Type__c = brokenType;
            } else {
                setting.Broken_Type__c = null;
            }

            if (shiftType == 'Sleepover') {
                setting.Sleepover_Type__c = sleepoverType;
            } else {
                setting.Sleepover_Type__c = null;
            }

            if (shiftType == 'OverTime') {
                setting.OverTime_Type__c = overTimeType;
                setting.Sub_Shift_Type__c = subShiftType;
            } else {
                setting.OverTime_Type__c = null;
                setting.Sub_Shift_Type__c = null;
            }

            if (shiftType == 'Extended') {
                setting.Extended_Type__c = extendedType;
            } else {
                setting.Extended_Type__c = null;
            }

            if (shiftType == 'Custom' && (customShiftType == 'General' || customShiftType == 'Morning' || customShiftType == 'Afternoon')) {
                setting.Custom_Rate_Type__c = customRateType;
            } else if (shiftType == 'Custom' && (customShiftType == 'Night')){
                setting.Custom_Rate_Type__c = 'Night Rate 1';
            } else if (shiftType == 'Custom' && (customShiftType == 'Sleepover')){
                setting.Custom_Rate_Type__c = 'Sleepover Rate 1';
            } else {
                setting.Custom_Rate_Type__c = null;
            }

            String generatedName = payItemType + ' - ' + roleName + ' - ' + parentRole.Facility__r.Name;
            generatedName += ' - ' + xeroPayitemName + ' - ' + category + ' - ' + shiftType;

            if (String.isNotBlank(customShiftType)) {
                generatedName += ' - ' + customShiftType;
            }

            if (String.isNotBlank(customRateType)) {
                generatedName += ' - ' + customRateType;
            }

            if (String.isNotBlank(overTimeType)) {
                generatedName += ' - ' + overTimeType;
            }

            if (String.isNotBlank(subShiftType)) {
                generatedName += ' - ' + subShiftType;
            }

            if (String.isNotBlank(extendedType)) {
                generatedName += ' - ' + extendedType;
            }

            if (String.isNotBlank(brokenType)) {
                generatedName += ' - ' + brokenType;
            }

            if (String.isNotBlank(sleepoverType)) {
                generatedName += ' - ' + sleepoverType;
            }

            if (generatedName.length() > 80) {
                generatedName = generatedName.substring(0, 80);
            }
            setting.Name = generatedName;

            createdSettings.add(setting);
        }

        if (!createdSettings.isEmpty()) {
            insert createdSettings;
        }

        return createdSettings;
    }

    // ============================================================
    // GET XERO SETTING BY ROLE NAME
    // ============================================================
    @AuraEnabled(cacheable=true)
    public static Facility_Xero_Setting__c getXeroSettingByRoleName(
        String roleName,
        Id organisationId
    ) {
        if (String.isBlank(roleName) || organisationId == null) {
            return null;
        }

        List<Facility_Role__c> roles = [
            SELECT Id, Role_Name__c
            FROM Facility_Role__c
            WHERE Role_Name__c = :roleName
            AND Facility__r.Organisation__c = :organisationId
            LIMIT 1
        ];

        if (roles.isEmpty()) {
            return null;
        }

        List<Facility_Xero_Setting__c> settings = [
            SELECT
                Id,
                Name,
                Xero_Payitem__c,
                Xero_Payitem_Name__c,
                Category__c,
                Shift_Type__c,
                Custom_Shift_Type__c,
                Broken_Type__c,
                Sleepover_Type__c,
                OverTime_Type__c,
                Sub_Shift_Type__c,
                Extended_Type__c,
                Custom_Rate_Type__c,
                Pay_Item_Type__c,
                Facility_Role__c,
                Facility_Role__r.Role_Name__c
            FROM Facility_Xero_Setting__c
            WHERE Facility_Role__c = :roles[0].Id
            LIMIT 1
        ];

        if (settings.isEmpty()) {
            return null;
        }

        return settings[0];
    }

    // ============================================================
    // GET ALL FACILITY ROLES
    // ============================================================
    @AuraEnabled(cacheable=true)
    public static List<Facility_Role__c> getAllFacilityRoles(Id organisationId) {
        if (organisationId == null) {
            return new List<Facility_Role__c>();
        }

        return [
            SELECT Id, Name, Role_Name__c, Facility__c, Facility__r.Name
            FROM Facility_Role__c
            WHERE Role_Name__c != null
            AND Role_Name__c != 'Reimbursement'
            AND Facility__r.Organisation__c = :organisationId
            ORDER BY Role_Name__c, Facility__r.Name
        ];
    }

    // ============================================================
    // GET ALL XERO SETTINGS - GROUPED BY SETTING VALUES + ROLE
    // ============================================================
    @AuraEnabled
    public static List<Map<String, Object>> getAllXeroSettings(
        Id organisationId
    ) {
        if (organisationId == null) {
            return new List<Map<String, Object>>();
        }

        List<Map<String, Object>> result = new List<Map<String, Object>>();

        try {
            List<Facility_Xero_Setting__c> settings = [
                SELECT
                    Id,
                    Name,
                    Xero_Payitem__c,
                    Xero_Payitem_Name__c,
                    Category__c,
                    Shift_Type__c,
                    Custom_Shift_Type__c,
                    Broken_Type__c,
                    Sleepover_Type__c,
                    OverTime_Type__c,
                    Sub_Shift_Type__c,
                    Extended_Type__c,
                    Custom_Rate_Type__c,
                    Pay_Item_Type__c,
                    Facility_Role__c,
                    Facility_Role__r.Id,
                    Facility_Role__r.Role_Name__c,
                    Facility_Role__r.Facility__c,
                    Facility_Role__r.Facility__r.Name
                FROM Facility_Xero_Setting__c
                WHERE Facility_Role__c != null
                AND Facility_Role__r.Facility__r.Organisation__c = :organisationId
                ORDER BY Facility_Role__r.Role_Name__c, Facility_Role__r.Facility__r.Name
            ];

            if (settings.isEmpty()) {
                return result;
            }

            Map<String, Map<String, Object>> groupedSettings = new Map<String, Map<String, Object>>();

            for (Facility_Xero_Setting__c setting : settings) {
                String roleName = setting.Facility_Role__r.Role_Name__c != null
                    ? setting.Facility_Role__r.Role_Name__c
                    : 'Unknown';

                if (setting.Pay_Item_Type__c == 'Reimbursement') {
                    roleName = 'N/A';
                }

                String key = String.valueOf(setting.Pay_Item_Type__c) + '|' +
                            roleName.toLowerCase() + '|' +
                            String.valueOf(setting.Shift_Type__c) + '|' +
                            String.valueOf(setting.Category__c) + '|' +
                            String.valueOf(setting.Xero_Payitem__c) + '|' +
                            String.valueOf(setting.Xero_Payitem_Name__c) + '|' +
                            String.valueOf(setting.Custom_Shift_Type__c) + '|' +
                            String.valueOf(setting.Broken_Type__c) + '|' +
                            String.valueOf(setting.Sleepover_Type__c) + '|' +
                            String.valueOf(setting.OverTime_Type__c) + '|' +
                            String.valueOf(setting.Sub_Shift_Type__c) + '|' +
                            String.valueOf(setting.Extended_Type__c) + '|' +
                            String.valueOf(setting.Custom_Rate_Type__c);

                if (!groupedSettings.containsKey(key)) {
                    Map<String, Object> row = new Map<String, Object>();
                    row.put('Id', setting.Id);
                    row.put('Name', setting.Name);
                    row.put('Xero_Payitem__c', setting.Xero_Payitem__c);
                    row.put('Xero_Payitem_Name__c', setting.Xero_Payitem_Name__c);
                    row.put('Category__c', setting.Category__c);
                    row.put('Shift_Type__c', setting.Shift_Type__c);
                    row.put('Custom_Shift_Type__c', setting.Custom_Shift_Type__c);
                    row.put('Broken_Type__c', setting.Broken_Type__c);
                    row.put('Sleepover_Type__c', setting.Sleepover_Type__c);
                    row.put('OverTime_Type__c', setting.OverTime_Type__c);
                    row.put('Sub_Shift_Type__c', setting.Sub_Shift_Type__c);
                    row.put('Extended_Type__c', setting.Extended_Type__c);
                    row.put('Custom_Rate_Type__c', setting.Custom_Rate_Type__c);
                    row.put('Pay_Item_Type__c', setting.Pay_Item_Type__c);
                    row.put('roleName', roleName);
                    row.put('facilityRoleIds', new List<String>());
                    row.put('facilityNames', new List<String>());
                    row.put('settingIds', new List<String>());

                    groupedSettings.put(key, row);
                }

                Map<String, Object> row = groupedSettings.get(key);
                List<String> facilityRoleIds = (List<String>)row.get('facilityRoleIds');
                List<String> facilityNames = (List<String>)row.get('facilityNames');
                List<String> settingIds = (List<String>)row.get('settingIds');

                if (setting.Facility_Role__c != null) {
                    facilityRoleIds.add(setting.Facility_Role__c);
                    if (setting.Facility_Role__r.Facility__r.Name != null && setting.Pay_Item_Type__c != 'Reimbursement') {
                        facilityNames.add(setting.Facility_Role__r.Facility__r.Name);
                    } else if (setting.Pay_Item_Type__c == 'Reimbursement') {
                        facilityNames.add('N/A');
                    }
                    settingIds.add(setting.Id);
                }
            }

            for (String key : groupedSettings.keySet()) {
                Map<String, Object> row = groupedSettings.get(key);
                List<String> facilityRoleIds = (List<String>)row.get('facilityRoleIds');
                List<String> facilityNames = (List<String>)row.get('facilityNames');
                List<String> settingIds = (List<String>)row.get('settingIds');

                row.put('facilityRoleIds', String.join(facilityRoleIds, ', '));
                row.put('facilities', String.join(facilityNames, ', '));
                row.put('settingIds', String.join(settingIds, ', '));
                row.put('facilityCount', facilityRoleIds.size());

                result.add(row);
            }

            return result;

        } catch (Exception e) {
            throw new AuraHandledException('Error loading Xero Settings: ' + e.getMessage());
        }
    }

    // ============================================================
    // GET EARNINGS RATES FROM XERO
    // ============================================================
    /* @AuraEnabled
    public static List<Map<String, String>> getEarningsRatesFromXero() {
        try {
            String accessToken = XeroIntegrationController.getAccessTokenFromXero();
            String tenantId = XeroIntegrationController.getTenantId(accessToken);

            List<Map<String, String>> allEarningsRates = new List<Map<String, String>>();
            Integer page = 1;
            Integer pageSize = 100;
            Boolean hasMorePages = true;

            while (hasMorePages) {
                HttpRequest req = new HttpRequest();
                String endpoint = 'https://api.xero.com/payroll.xro/1.0/PayItems?page=' + page;
                req.setEndpoint(endpoint);
                req.setMethod('GET');
                req.setHeader('Accept', 'application/json');
                req.setHeader('xero-tenant-id', tenantId);
                req.setHeader('Authorization', 'Bearer ' + accessToken);

                Http http = new Http();
                HttpResponse res = http.send(req);

                if (res.getStatusCode() == 200) {
                    Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(res.getBody());

                    if (responseMap.containsKey('PayItems')) {
                        Map<String, Object> payItems = (Map<String, Object>)responseMap.get('PayItems');

                        if (payItems.containsKey('EarningsRates')) {
                            List<Object> earningsRatesList = (List<Object>)payItems.get('EarningsRates');

                            if (earningsRatesList.isEmpty()) {
                                hasMorePages = false;
                                break;
                            }

                            for (Object rate : earningsRatesList) {
                                Map<String, Object> rateMap = (Map<String, Object>)rate;
                                String earningsType = (String)rateMap.get('EarningsType');
                                String rateType = (String)rateMap.get('RateType');
                                String typeOfUnits = (String)rateMap.get('TypeOfUnits');

                                if (('ORDINARYTIMEEARNINGS'.equals(earningsType) || 'REIMBURSEMENT'.equals(earningsType)) &&
                                    'RATEPERUNIT'.equals(rateType) &&
                                    'hours'.equalsIgnoreCase(typeOfUnits)) {

                                    if (rateMap.containsKey('Name')) {
                                        Map<String, String> earningRate = new Map<String, String>();
                                        earningRate.put('label', (String)rateMap.get('Name'));
                                        earningRate.put('value', (String)rateMap.get('EarningsRateID'));
                                        earningRate.put('earningsType', earningsType);
                                        allEarningsRates.add(earningRate);
                                    }
                                }
                            }

                            if (earningsRatesList.size() < pageSize) {
                                hasMorePages = false;
                            } else {
                                page++;
                            }
                        } else {
                            hasMorePages = false;
                        }
                    } else {
                        hasMorePages = false;
                    }
                } else {
                    hasMorePages = false;
                }
            }

            return allEarningsRates;

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    } */
    @AuraEnabled
    public static List<Map<String, String>> getEarningsRatesFromXero() {
        try {
            String accessToken = XeroIntegrationController.getAccessTokenFromXero();
            String tenantId = XeroIntegrationController.getTenantId(accessToken);

            List<Map<String, String>> allEarningsRates = new List<Map<String, String>>();

            HttpRequest req = new HttpRequest();
            req.setEndpoint('https://api.xero.com/payroll.xro/1.0/PayItems');
            req.setMethod('GET');
            req.setHeader('Accept', 'application/json');
            req.setHeader('xero-tenant-id', tenantId);
            req.setHeader('Authorization', 'Bearer ' + accessToken);

            Http http = new Http();
            HttpResponse res = http.send(req);

            if (res.getStatusCode() == 200) {
                Map<String, Object> responseMap =
                    (Map<String, Object>) JSON.deserializeUntyped(res.getBody());

                if (responseMap.containsKey('PayItems')) {
                    Map<String, Object> payItems =
                        (Map<String, Object>) responseMap.get('PayItems');

                    if (payItems.containsKey('EarningsRates')) {
                        List<Object> earningsRatesList =
                            (List<Object>) payItems.get('EarningsRates');

                        for (Object rate : earningsRatesList) {
                            Map<String, Object> rateMap = (Map<String, Object>) rate;
                            String earningsType = (String) rateMap.get('EarningsType');
                            String rateType     = (String) rateMap.get('RateType');
                            String typeOfUnits  = (String) rateMap.get('TypeOfUnits');

                            if (('ORDINARYTIMEEARNINGS'.equals(earningsType)
                                    || 'REIMBURSEMENT'.equals(earningsType))
                                && 'RATEPERUNIT'.equals(rateType)
                                && 'hours'.equalsIgnoreCase(typeOfUnits)
                                && rateMap.containsKey('Name')) {

                                allEarningsRates.add(new Map<String, String>{
                                    'label'         => (String) rateMap.get('Name'),
                                    'value'         => (String) rateMap.get('EarningsRateID'),
                                    'earningsType'  => earningsType
                                });
                            }
                        }
                    }
                }
            }

            return allEarningsRates;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    // ============================================================
    // GET REIMBURSEMENT ITEMS FROM XERO
    // ============================================================
    @AuraEnabled
    public static List<Map<String, String>> getReimbursementItemsFromXero() {
        try {
            String accessToken = XeroIntegrationController.getAccessTokenFromXero();
            String tenantId    = XeroIntegrationController.getTenantId(accessToken);

            List<Map<String, String>> allReimbursementItems = new List<Map<String, String>>();

            HttpRequest req = new HttpRequest();
            req.setEndpoint('https://api.xero.com/payroll.xro/1.0/PayItems');
            req.setMethod('GET');
            req.setHeader('Accept', 'application/json');
            req.setHeader('xero-tenant-id', tenantId);
            req.setHeader('Authorization', 'Bearer ' + accessToken);

            HttpResponse res = new Http().send(req);

            if (res.getStatusCode() == 200) {
                Map<String, Object> responseMap =
                    (Map<String, Object>) JSON.deserializeUntyped(res.getBody());

                if (responseMap.containsKey('PayItems')) {
                    Map<String, Object> payItems =
                        (Map<String, Object>) responseMap.get('PayItems');

                    if (payItems.containsKey('EarningsRates')) {
                        List<Object> earningsRatesList =
                            (List<Object>) payItems.get('EarningsRates');

                        for (Object rate : earningsRatesList) {
                            Map<String, Object> rateMap = (Map<String, Object>) rate;
                            String name = (String) rateMap.get('Name');

                            if (name != null
                                && name.toLowerCase().contains('reimbursement')) {

                                allReimbursementItems.add(new Map<String, String>{
                                    'label' => name,
                                    'value' => (String) rateMap.get('EarningsRateID')
                                });
                            }
                        }
                    }
                }
            }

            return allReimbursementItems;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    // ============================================================
    // ADD NEW PAYITEM TO XERO
    // ============================================================
    @AuraEnabled
    public static String addNewPayItem(String payItemName, String payItemType) {
        try {
            if (String.isBlank(payItemName)) {
                throw new AuraHandledException('PayItem name is required.');
            }

            String trimmedName = payItemName.trim();

            String accessToken = XeroIntegrationController.getAccessTokenFromXero();
            String tenantId = XeroIntegrationController.getTenantId(accessToken);

            String existingId = getPayItemIdByName(trimmedName, accessToken, tenantId, payItemType);

            if (String.isNotBlank(existingId)) {
                Map<String, Object> response = new Map<String, Object>();
                response.put('status', 'exists');
                response.put('message', 'PayItem "' + trimmedName + '" already exists in Xero. Using existing ID.');
                response.put('payItemName', trimmedName);
                response.put('Id', existingId);
                response.put('isExisting', true);
                response.put('isNew', false);

                return JSON.serialize(response);
            }

            String uniqueName = trimmedName;

            String accountCode = '477';
            String expenseAccountId = getXeroAccountIdByCode(accountCode, accessToken, tenantId);

            if (String.isBlank(expenseAccountId)) {
                throw new AuraHandledException(
                    'Xero account with account code ' + accountCode + ' could not be found.'
                );
            }

            String endpoint = 'https://api.xero.com/payroll.xro/2.0/earningsRates';

            Map<String, Object> earningsRate = new Map<String, Object>();
            earningsRate.put('name', uniqueName);
            earningsRate.put('earningsType', 'OrdinaryTimeEarnings');
            earningsRate.put('rateType', 'RatePerUnit');
            earningsRate.put('typeOfUnits', 'Hours');
            earningsRate.put('expenseAccountID', expenseAccountId);
            earningsRate.put('isSubjectToTax', false);
            earningsRate.put('isSubjectToSuper', true);
            earningsRate.put('isQualifyingEarnings', true);
            earningsRate.put('isReportableAsW1', true);

            String requestBody = JSON.serialize(earningsRate);

            String idempotencyKey =
                trimmedName.replaceAll('\\s+', '_') + '_' + String.valueOf(System.currentTimeMillis());

            HttpRequest req = new HttpRequest();
            req.setEndpoint(endpoint);
            req.setMethod('POST');
            req.setHeader('Accept', 'application/json');
            req.setHeader('Content-Type', 'application/json');
            req.setHeader('xero-tenant-id', tenantId);
            req.setHeader('Authorization', 'Bearer ' + accessToken);
            req.setHeader('Idempotency-Key', idempotencyKey);
            req.setBody(requestBody);

            Http http = new Http();
            HttpResponse res = http.send(req);

            if (res.getStatusCode() == 200 || res.getStatusCode() == 201) {
                String itemId;
                String itemName = uniqueName;

                Map<String, Object> responseMap =
                    (Map<String, Object>)JSON.deserializeUntyped(res.getBody());

                if (responseMap.containsKey('earningsRateID')) {
                    itemId = (String)responseMap.get('earningsRateID');
                }

                if (responseMap.containsKey('name')) {
                    itemName = (String)responseMap.get('name');
                }

                if (String.isBlank(itemId)) {
                    for (Integer i = 0; i < 3; i++) {
                        String freshAccessToken = XeroIntegrationController.getAccessTokenFromXero();
                        String freshTenantId = XeroIntegrationController.getTenantId(freshAccessToken);

                        itemId = getPayItemIdByName(uniqueName, freshAccessToken, freshTenantId, payItemType);

                        if (String.isNotBlank(itemId)) {
                            break;
                        }

                        if (i < 2) {
                            Long startTime = System.now().getTime();
                            while (System.now().getTime() < startTime + 200) {
                                // wait
                            }
                        }
                    }
                }

                if (String.isBlank(itemId)) {
                    throw new AuraHandledException(
                        'The Earnings Rate was created in Xero, ' +
                        'but the ID could not be retrieved. Please refresh and try again.'
                    );
                }

                Map<String, Object> response = new Map<String, Object>();
                response.put('status', 'success');
                response.put('message', 'Earnings Rate "' + itemName + '" added successfully to Xero');
                response.put('payItemName', itemName);
                response.put('Id', itemId);
                response.put('isNew', true);
                response.put('isExisting', false);
                response.put('apiResponse', res.getBody());

                return JSON.serialize(response);
            }

            Map<String, Object> errorResponse = new Map<String, Object>();
            errorResponse.put('status', 'error');
            errorResponse.put('statusCode', res.getStatusCode());
            errorResponse.put('message', 'Xero API returned status code: ' + res.getStatusCode());
            errorResponse.put('body', res.getBody());

            return JSON.serialize(errorResponse);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new Map<String, Object>();
            errorResponse.put('status', 'error');
            errorResponse.put('message', e.getMessage());
            return JSON.serialize(errorResponse);
        }
    }

    @TestVisible
    private static String getXeroAccountIdByCode(
        String accountCode,
        String accessToken,
        String tenantId
    ) {
        try {
            if (String.isBlank(accountCode)) {
                return null;
            }

            String endpoint = 'https://api.xero.com/api.xro/2.0/Accounts';

            HttpRequest req = new HttpRequest();
            req.setEndpoint(endpoint);
            req.setMethod('GET');
            req.setHeader('Accept', 'application/json');
            req.setHeader('Content-Type', 'application/json');
            req.setHeader('xero-tenant-id', tenantId);
            req.setHeader('Authorization', 'Bearer ' + accessToken);

            Http http = new Http();
            HttpResponse res = http.send(req);

            if (res.getStatusCode() != 200) {
                return null;
            }

            Map<String, Object> responseMap =
                (Map<String, Object>)JSON.deserializeUntyped(res.getBody());

            if (!responseMap.containsKey('Accounts')) {
                return null;
            }

            List<Object> accounts = (List<Object>)responseMap.get('Accounts');

            for (Object accountObject : accounts) {
                Map<String, Object> account = (Map<String, Object>)accountObject;

                String code = account.containsKey('Code') ? (String)account.get('Code') : null;

                if (String.isNotBlank(code) && code == accountCode) {
                    String accountId =
                        account.containsKey('AccountID') ? (String)account.get('AccountID') : null;
                    return accountId;
                }
            }

            return null;

        } catch (Exception e) {
            return null;
        }
    }

    // ============================================================
    // GET SIMILAR PAY ITEMS (NEVER DELETE)
    // ============================================================
    public static List<String> getSimilarPayItems(String payItemName, String accessToken, String tenantId, String payItemType) {
        List<String> similarItems = new List<String>();

        try {
            if (String.isBlank(payItemName) || String.isBlank(accessToken) || String.isBlank(tenantId)) {
                return similarItems;
            }

            String trimmedName = payItemName.trim().toLowerCase();

            HttpRequest req = new HttpRequest();
            req.setEndpoint('https://api.xero.com/payroll.xro/1.0/PayItems');
            req.setMethod('GET');
            req.setHeader('Authorization', 'Bearer ' + accessToken);
            req.setHeader('xero-tenant-id', tenantId);
            req.setHeader('Accept', 'application/json');

            Http http = new Http();
            HttpResponse res = http.send(req);

            if (res.getStatusCode() == 200) {
                Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(res.getBody());

                if (responseMap.containsKey('PayItems')) {
                    Map<String, Object> payItems = (Map<String, Object>)responseMap.get('PayItems');

                    if (payItems.containsKey('EarningsRates')) {
                        List<Object> items = (List<Object>)payItems.get('EarningsRates');
                        for (Object itemObj : items) {
                            Map<String, Object> item = (Map<String, Object>)itemObj;
                            String name = (String)item.get('Name');
                            String status = (String)item.get('Status');

                            if (String.isNotBlank(name) && (status == null || status == 'ACTIVE')) {
                                String nameLower = name.toLowerCase();

                                if (nameLower.contains(trimmedName) || trimmedName.contains(nameLower)) {
                                    similarItems.add(name);
                                }

                                String[] words = trimmedName.split(' ');
                                for (String word : words) {
                                    if (word.length() > 3 && nameLower.contains(word)) {
                                        similarItems.add(name);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.debug('Error in getSimilarPayItems: ' + e.getMessage());
        }

        return similarItems;
    }

    // ============================================================
    // HELPER: CHECK IF PAYITEM EXISTS IN XERO
    // ============================================================
    public static Boolean checkIfPayItemExists(String payItemName, String accessToken, String tenantId, String payItemType) {
        try {
            HttpRequest req = new HttpRequest();
            req.setEndpoint('https://api.xero.com/payroll.xro/1.0/PayItems');
            req.setMethod('GET');
            req.setHeader('Accept', 'application/json');
            req.setHeader('xero-tenant-id', tenantId);
            req.setHeader('Authorization', 'Bearer ' + accessToken);

            Http http = new Http();
            HttpResponse res = http.send(req);

            if (res.getStatusCode() == 200) {
                Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(res.getBody());

                if (responseMap.containsKey('PayItems')) {
                    Map<String, Object> payItems = (Map<String, Object>)responseMap.get('PayItems');

                    if (payItems.containsKey('EarningsRates')) {
                        List<Object> itemsList = (List<Object>)payItems.get('EarningsRates');
                        for (Object item : itemsList) {
                            Map<String, Object> itemMap = (Map<String, Object>)item;
                            String name = (String)itemMap.get('Name');

                            if (payItemType == 'Reimbursement') {
                                if (name != null && name.toLowerCase().contains('reimbursement') &&
                                    name.equalsIgnoreCase(payItemName)) {
                                    return true;
                                }
                            } else {
                                if (name != null && name.equalsIgnoreCase(payItemName)) {
                                    return true;
                                }
                            }
                        }
                    }
                }
            }

            return false;

        } catch (Exception e) {
            return false;
        }
    }

    // ============================================================
    // GET PAY ITEM ID BY NAME (SAFE - NEVER DELETES)
    // ============================================================
    public static String getPayItemIdByName(String payItemName, String accessToken, String tenantId, String payItemType) {
        try {
            if (String.isBlank(payItemName) || String.isBlank(accessToken) || String.isBlank(tenantId)) {
                return null;
            }

            HttpRequest req = new HttpRequest();
            req.setEndpoint('https://api.xero.com/payroll.xro/1.0/PayItems');
            req.setMethod('GET');
            req.setHeader('Authorization', 'Bearer ' + accessToken);
            req.setHeader('xero-tenant-id', tenantId);
            req.setHeader('Accept', 'application/json');

            Http http = new Http();
            HttpResponse res = http.send(req);

            if (res.getStatusCode() == 200) {
                Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(res.getBody());

                if (responseMap.containsKey('PayItems')) {
                    Map<String, Object> payItems = (Map<String, Object>)responseMap.get('PayItems');

                    if (payItems.containsKey('EarningsRates')) {
                        List<Object> items = (List<Object>)payItems.get('EarningsRates');
                        for (Object itemObj : items) {
                            Map<String, Object> item = (Map<String, Object>)itemObj;
                            String name = (String)item.get('Name');
                            if (String.isNotBlank(name) && name.equalsIgnoreCase(payItemName.trim())) {
                                return (String)item.get('EarningsRateID');
                            }
                        }
                    }

                    if (String.isNotBlank(payItemType) && payItemType == 'Reimbursement') {
                        if (payItems.containsKey('ReimbursementTypes')) {
                            List<Object> items = (List<Object>)payItems.get('ReimbursementTypes');
                            for (Object itemObj : items) {
                                Map<String, Object> item = (Map<String, Object>)itemObj;
                                String name = (String)item.get('Name');
                                if (String.isNotBlank(name) && name.equalsIgnoreCase(payItemName.trim())) {
                                    return (String)item.get('ReimbursementTypeID');
                                }
                            }
                        }
                    }
                }
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    // ============================================================
    // HELPER: GET PAYITEM ID
    // ============================================================
    public static String getPayItemId(String payItemName, String accessToken, String tenantId, String payItemType) {
        try {
            HttpRequest req = new HttpRequest();
            req.setEndpoint('https://api.xero.com/payroll.xro/1.0/PayItems');
            req.setMethod('GET');
            req.setHeader('Accept', 'application/json');
            req.setHeader('xero-tenant-id', tenantId);
            req.setHeader('Authorization', 'Bearer ' + accessToken);

            Http http = new Http();
            HttpResponse res = http.send(req);

            if (res.getStatusCode() == 200) {
                Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(res.getBody());

                if (responseMap.containsKey('PayItems')) {
                    Map<String, Object> payItems = (Map<String, Object>)responseMap.get('PayItems');

                    if (payItems.containsKey('EarningsRates')) {
                        List<Object> itemsList = (List<Object>)payItems.get('EarningsRates');
                        for (Object item : itemsList) {
                            Map<String, Object> itemMap = (Map<String, Object>)item;
                            String earningsType = (String)itemMap.get('EarningsType');

                            if (payItemType == 'Reimbursement') {
                                if ('REIMBURSEMENT'.equals(earningsType) &&
                                    itemMap.containsKey('Name') &&
                                    ((String)itemMap.get('Name')).equalsIgnoreCase(payItemName)) {
                                    return (String)itemMap.get('EarningsRateID');
                                }
                            } else {
                                if (itemMap.containsKey('Name') &&
                                    ((String)itemMap.get('Name')).equalsIgnoreCase(payItemName)) {
                                    return (String)itemMap.get('EarningsRateID');
                                }
                            }
                        }
                    }
                }
            }

            return null;

        } catch (Exception e) {
            return null;
        }
    }

    // ============================================================
    // UPDATE FACILITY XERO SETTING
    // ============================================================
    @AuraEnabled
    public static List<Facility_Xero_Setting__c> updateFacilityXeroSetting(
        Id organisationId,
        String settingIds,
        String payItemType,
        String roleName,
        String roleIds,
        String xeroPayitem,
        String xeroPayitemName,
        String category,
        String shiftType,
        String customShiftType,
        String brokenType,
        String sleepoverType,
        String overTimeType,
        String subShiftType,
        String customRateType,
        String extendedType
    ) {

        if (organisationId == null) {
            throw new AuraHandledException('Organisation is required.');
        }

        if (String.isBlank(settingIds)) {
            throw new AuraHandledException('Setting IDs are required.');
        }

        if (String.isBlank(payItemType)) {
            throw new AuraHandledException('Pay Item Type is required.');
        }

        if (String.isBlank(xeroPayitem)) {
            throw new AuraHandledException('Xero Payitem is required.');
        }

        List<String> settingIdList = settingIds.split(',');
        Set<Id> settingIdSet = new Set<Id>();

        for (String idStr : settingIdList) {
            if (String.isNotBlank(idStr)) {
                settingIdSet.add((Id)idStr.trim());
            }
        }

        if (settingIdSet.isEmpty()) {
            throw new AuraHandledException('No valid Setting IDs found.');
        }

        if (payItemType == 'Reimbursement') {
            List<Facility_Xero_Setting__c> existingReimbursement = [
                SELECT Id, Name
                FROM Facility_Xero_Setting__c
                WHERE Pay_Item_Type__c = 'Reimbursement'
                AND Facility_Role__r.Facility__r.Organisation__c = :organisationId
                AND Id NOT IN :settingIdSet
                LIMIT 1
            ];

            if (!existingReimbursement.isEmpty()) {
                throw new AuraHandledException(
                    'A Reimbursement record already exists for this organisation. ' +
                    'Only one Reimbursement record is allowed per organisation.'
                );
            }

            category = null;
            shiftType = null;
            customShiftType = null;
            brokenType = null;
            sleepoverType = null;
            overTimeType = null;
            subShiftType = null;
            customRateType = null;
            extendedType = null;
        } else {
            if (String.isBlank(roleName)) {
                throw new AuraHandledException('Role is required for Earnings.');
            }

            if (String.isBlank(category)) {
                throw new AuraHandledException('Category is required for Earnings.');
            }

            if (String.isBlank(shiftType)) {
                throw new AuraHandledException('Shift Type is required for Earnings.');
            }

            if (shiftType == 'Custom' && String.isBlank(customShiftType)) {
                throw new AuraHandledException('Custom Shift Type is required when Shift Type is Custom.');
            }

            if (shiftType == 'Broken' && String.isBlank(brokenType)) {
                throw new AuraHandledException('Broken Type is required when Shift Type is Broken.');
            }

            if (shiftType == 'Sleepover' && String.isBlank(sleepoverType)) {
                throw new AuraHandledException('Sleepover Rate Type is required when Shift Type is Sleepover.');
            }

            if (shiftType == 'OverTime' && String.isBlank(overTimeType)) {
                throw new AuraHandledException('OverTime Type is required when Shift Type is OverTime.');
            }

            if (shiftType == 'OverTime' && overTimeType != 'OverTime Rate 1' && overTimeType != 'OverTime Rate 2') {
                throw new AuraHandledException('Invalid OverTime Type. Select OverTime Rate 1 or OverTime Rate 2.');
            }

            if (shiftType == 'OverTime' && String.isBlank(subShiftType)) {
                throw new AuraHandledException('Sub Shift Type is required when Shift Type is OverTime.');
            }

            if (shiftType == 'Extended' && String.isBlank(extendedType)) {
                throw new AuraHandledException('Extended Type is required when Shift Type is Extended.');
            }

            if (
                shiftType == 'Custom' &&
                (customShiftType == 'General' || customShiftType == 'Morning' || customShiftType == 'Afternoon') &&
                String.isBlank(customRateType)
            ) {
                throw new AuraHandledException('Rate Type is required for this Custom Shift Type.');
            }
        }

        List<Facility_Xero_Setting__c> settingsToUpdate = [
            SELECT
                Id,
                Name,
                Xero_Payitem__c,
                Xero_Payitem_Name__c,
                Category__c,
                Shift_Type__c,
                Custom_Shift_Type__c,
                Broken_Type__c,
                Sleepover_Type__c,
                OverTime_Type__c,
                Sub_Shift_Type__c,
                Extended_Type__c,
                Custom_Rate_Type__c,
                Pay_Item_Type__c,
                Facility_Role__c,
                Facility_Role__r.Role_Name__c,
                Facility_Role__r.Facility__r.Organisation__c
            FROM Facility_Xero_Setting__c
            WHERE Id IN :settingIdSet
            AND Facility_Role__r.Facility__r.Organisation__c = :organisationId
        ];

        if (settingsToUpdate.isEmpty()) {
            throw new AuraHandledException(
                'No Xero Settings found to update or they do not belong to the current organisation.'
            );
        }

        List<Facility_Xero_Setting__c> existingPayitemSettings = [
            SELECT Id, Xero_Payitem__c, Facility_Role__r.Role_Name__c
            FROM Facility_Xero_Setting__c
            WHERE Xero_Payitem__c = :xeroPayitem
            AND Facility_Role__r.Facility__r.Organisation__c = :organisationId
            AND Id NOT IN :settingIdSet
        ];

        Set<String> rolesAlreadyUsingPayitem = new Set<String>();
        for (Facility_Xero_Setting__c s : existingPayitemSettings) {
            if (s.Facility_Role__r.Role_Name__c != roleName) {
                rolesAlreadyUsingPayitem.add(s.Facility_Role__r.Role_Name__c);
            }
        }

        if (!rolesAlreadyUsingPayitem.isEmpty()) {
            throw new AuraHandledException(
                'Xero Payitem "' + xeroPayitemName +
                '" already assigned to role "' + new List<String>(rolesAlreadyUsingPayitem)[0] +
                '". One Payitem can only link to one Role.'
            );
        }

        for (Facility_Xero_Setting__c setting : settingsToUpdate) {
            setting.Pay_Item_Type__c = payItemType;
            setting.Xero_Payitem__c = xeroPayitem;
            setting.Xero_Payitem_Name__c = xeroPayitemName;
            setting.Category__c = category;
            setting.Shift_Type__c = shiftType;

            if (shiftType == 'Custom') {
                setting.Custom_Shift_Type__c = customShiftType;
            } else {
                setting.Custom_Shift_Type__c = null;
            }

            if (shiftType == 'Broken') {
                setting.Broken_Type__c = brokenType;
            } else {
                setting.Broken_Type__c = null;
            }

            if (shiftType == 'Sleepover') {
                setting.Sleepover_Type__c = sleepoverType;
            } else {
                setting.Sleepover_Type__c = null;
            }

            if (shiftType == 'OverTime') {
                setting.OverTime_Type__c = overTimeType;
                setting.Sub_Shift_Type__c = subShiftType;
            } else {
                setting.OverTime_Type__c = null;
                setting.Sub_Shift_Type__c = null;
            }

            if (shiftType == 'Extended') {
                setting.Extended_Type__c = extendedType;
            } else {
                setting.Extended_Type__c = null;
            }

            if (shiftType == 'Custom' && (customShiftType == 'General' || customShiftType == 'Morning' || customShiftType == 'Afternoon')) {
                setting.Custom_Rate_Type__c = customRateType;
            } else {
                setting.Custom_Rate_Type__c = null;
            }

            String generatedName;
            if (payItemType == 'Reimbursement') {
                generatedName = 'Reimbursement - ' + xeroPayitemName;
            } else {
                generatedName = payItemType + ' - ' + roleName + ' - ' + xeroPayitemName + ' - ' + category + ' - ' + shiftType;

                if (String.isNotBlank(customRateType)) {
                    generatedName += ' - ' + customRateType;
                }

                if (String.isNotBlank(overTimeType)) {
                    generatedName += ' - ' + overTimeType;
                }

                if (String.isNotBlank(subShiftType)) {
                    generatedName += ' - ' + subShiftType;
                }

                if (String.isNotBlank(extendedType)) {
                    generatedName += ' - ' + extendedType;
                }
            }
            if (generatedName.length() > 80) {
                generatedName = generatedName.substring(0, 80);
            }
            setting.Name = generatedName;
        }

        update settingsToUpdate;

        return settingsToUpdate;
    }

    // ============================================================
    // DELETE MULTIPLE XERO SETTINGS
    // ============================================================
    @AuraEnabled
    public static void deleteMultipleXeroSettings(String settingIds, Id organisationId) {

        if (String.isBlank(settingIds)) {
            throw new AuraHandledException('Xero Setting Ids are required.');
        }

        if (organisationId == null) {
            throw new AuraHandledException('Organisation is required.');
        }

        try {
            List<String> settingIdList = settingIds.split(',');
            Set<Id> settingIdSet = new Set<Id>();

            for (String idStr : settingIdList) {
                if (String.isNotBlank(idStr)) {
                    settingIdSet.add((Id)idStr.trim());
                }
            }

            if (settingIdSet.isEmpty()) {
                throw new AuraHandledException('No valid Xero Setting IDs found.');
            }

            List<Facility_Xero_Setting__c> settingsToDelete = [
                SELECT Id
                FROM Facility_Xero_Setting__c
                WHERE Id IN :settingIdSet
                AND Facility_Role__r.Facility__r.Organisation__c = :organisationId
            ];

            if (settingsToDelete.isEmpty()) {
                throw new AuraHandledException(
                    'No Xero Settings found to delete or they do not belong to the current organisation.'
                );
            }

            delete settingsToDelete;

        } catch (AuraHandledException e) {
            throw e;
        } catch (Exception e) {
            throw new AuraHandledException('Unable to delete the Xero settings: ' + e.getMessage());
        }
    }

}