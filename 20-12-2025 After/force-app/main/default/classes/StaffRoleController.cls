public with sharing class StaffRoleController {

    @AuraEnabled
    public static List<String> getStaffRoles(Id staffId) {
        if (staffId == null) return new List<String>();

        List<StaffRole__c> roles = [
            SELECT RoleName__c 
            FROM StaffRole__c 
            WHERE StaffRole_To_Staff__c = :staffId 
            AND Active__c = true
            ORDER BY LastModifiedDate DESC
        ];

        List<String> roleNames = new List<String>();
        for (StaffRole__c sr : roles) {
            roleNames.add(sr.RoleName__c);
        }
        return roleNames;
    }

   
@AuraEnabled
public static StaffRoleWrapper getStaffRoleWithRates(Id staffId, String roleName) {
    if (staffId == null || String.isBlank(roleName)) return null;

    StaffRole__c sr;
    try {
        sr = [
            SELECT RoleName__c, Hourly_Rate__c, Saturday_Hourly_Rate__c, Sunday_Hourly_Rate__c,
                   Public_Holiday_Hourly_Rate__c, Afternoon_Shift_Hourly_Rate__c, Night_Shift_Hourly_Rate__c,
                   Sleepover_Allowance__c,Category_Type__c, Classification_Level__c, Classification_Pay_Point__c,Type_of_Job__c
            FROM StaffRole__c
            WHERE StaffRole_To_Staff__c = :staffId
            AND RoleName__c = :roleName
            LIMIT 1
        ];
    } catch(QueryException e) {
        return null;
    }

    return new StaffRoleWrapper(sr);
}


    public class StaffRoleWrapper {
        @AuraEnabled public String RoleName;
        @AuraEnabled public Decimal HourlyRate;
        @AuraEnabled public Decimal SaturdayRate;
        @AuraEnabled public Decimal SundayRate;
        @AuraEnabled public Decimal PublicHolidayRate;
        @AuraEnabled public Decimal AfternoonShiftRate;
        @AuraEnabled public Decimal NightShiftRate;
        @AuraEnabled public Decimal SleepoverAllowance;
         // New: picklist values
        @AuraEnabled public String categoryType;
        @AuraEnabled public String classificationLevel;
        @AuraEnabled public String classificationPayType;
        @AuraEnabled public String jobType;

        public StaffRoleWrapper(StaffRole__c sr) {
            RoleName = sr.RoleName__c;
            HourlyRate = sr.Hourly_Rate__c;
            SaturdayRate = sr.Saturday_Hourly_Rate__c;
            SundayRate = sr.Sunday_Hourly_Rate__c;
            PublicHolidayRate = sr.Public_Holiday_Hourly_Rate__c;
            AfternoonShiftRate = sr.Afternoon_Shift_Hourly_Rate__c;
            NightShiftRate = sr.Night_Shift_Hourly_Rate__c;
            SleepoverAllowance = sr.Sleepover_Allowance__c;
            CategoryType = sr.Category_Type__c;
            classificationLevel = sr.Classification_Level__c;
            classificationPayType = sr.Classification_Pay_Point__c;
            jobType = sr.Type_of_Job__c;
        }
    }

    
 @AuraEnabled
public static void createStaffRoles(
    Id staffId,
    List<String> selectedRoles,
    String dropdownSelectedRole,
    Decimal hourlyRate,
    Decimal saturdayHourlyRate,
    Decimal sundayHourlyRate,
    Decimal publicHolidayHourlyRate,
    Decimal afternoonShiftRate,
    Decimal nightShiftRate,
    Decimal sleepoverAllowance,
    String categoryType,
    String classificationLevel,
    String classificationPayType,
    String jobType

) {
    if (staffId == null) return;
    if (selectedRoles == null) selectedRoles = new List<String>();

    // Ensure dropdownSelectedRole is never null
    if (String.isBlank(dropdownSelectedRole)) {
        dropdownSelectedRole = '';
    }

    List<StaffRole__c> existingRoles = [
        SELECT Id, RoleName__c, Active__c, Hourly_Rate__c, Saturday_Hourly_Rate__c, Sunday_Hourly_Rate__c,
               Public_Holiday_Hourly_Rate__c, Afternoon_Shift_Hourly_Rate__c, Night_Shift_Hourly_Rate__c,
               Sleepover_Allowance__c,Category_Type__c, Classification_Level__c, Classification_Pay_Point__c,Type_of_Job__c
        FROM StaffRole__c
        WHERE StaffRole_To_Staff__c = :staffId
    ];

    Map<String, StaffRole__c> existingMap = new Map<String, StaffRole__c>();
    for (StaffRole__c sr : existingRoles) {
        existingMap.put(sr.RoleName__c, sr);
    }

    List<StaffRole__c> toUpsert = new List<StaffRole__c>();

    // Loop through selected roles
    for (String roleName : selectedRoles) {
        StaffRole__c sr;
        if (existingMap.containsKey(roleName)) {
            sr = existingMap.get(roleName);
        } else {
            sr = new StaffRole__c(
                StaffRole_To_Staff__c = staffId,
                RoleName__c = roleName
            );
        }

        sr.Active__c = true;

        // Only update rates if this is the dropdown-selected role
        if (roleName == dropdownSelectedRole) {
            sr.Hourly_Rate__c = hourlyRate;
            System.debug('    HourlyRate: ' + sr.Hourly_Rate__c);
            sr.Saturday_Hourly_Rate__c = saturdayHourlyRate;
            sr.Sunday_Hourly_Rate__c = sundayHourlyRate;
            sr.Public_Holiday_Hourly_Rate__c = publicHolidayHourlyRate;
            sr.Afternoon_Shift_Hourly_Rate__c = afternoonShiftRate;
            sr.Night_Shift_Hourly_Rate__c = nightShiftRate;
            sr.Sleepover_Allowance__c = sleepoverAllowance;
            sr.Category_Type__c = categoryType;
            sr.Classification_Level__c = classificationLevel;
            sr.Classification_Pay_Point__c = classificationPayType;
             System.debug('📥 classificationPayType: ' + classificationPayType);
            sr.Type_of_Job__c = jobType;
        }

        toUpsert.add(sr);
    }

    // Deactivate roles that were previously active but now removed
    for (StaffRole__c sr : existingRoles) {
        if (!selectedRoles.contains(sr.RoleName__c) && sr.Active__c) {
            sr.Active__c = false;
            toUpsert.add(sr);
        }
    }

    if (!toUpsert.isEmpty()) {
        upsert toUpsert;
    }
}


    @AuraEnabled
    public static String getSelectedRole(Id staffId) {
        List<StaffRole__c> roles = [
            SELECT RoleName__c
            FROM StaffRole__c
            WHERE StaffRole_To_Staff__c = :staffId AND Active__c = true
            ORDER BY LastModifiedDate DESC
            LIMIT 1
        ];

        if (!roles.isEmpty()) {
            return roles[0].RoleName__c;
        }

        return null; // No active roles
    }
    
    @AuraEnabled
    public static List<Map<String, Object>> getActiveStaffRoles(Id staffId) {
        if (staffId == null) return new List<Map<String, Object>>();

        List<StaffRole__c> roles = [
            SELECT Id, RoleName__c, Hourly_Rate__c, Saturday_Hourly_Rate__c, Sunday_Hourly_Rate__c,
                Public_Holiday_Hourly_Rate__c, Afternoon_Shift_Hourly_Rate__c, Night_Shift_Hourly_Rate__c,
                Sleepover_Allowance__c, Category_Type__c, Classification_Level__c,
                Classification_Pay_Point__c, Type_of_Job__c, Active__c
            FROM StaffRole__c
            WHERE StaffRole_To_Staff__c = :staffId AND Active__c = true
            ORDER BY LastModifiedDate DESC
        ];

        List<Map<String, Object>> result = new List<Map<String, Object>>();
        for (StaffRole__c sr : roles) {
            Map<String, Object> r = new Map<String, Object>();
            r.put('RoleName', sr.RoleName__c);
            r.put('CategoryType', sr.Category_Type__c);
            r.put('ClassificationLevel', sr.Classification_Level__c);
            r.put('ClassificationPayType', sr.Classification_Pay_Point__c);
            r.put('JobType', sr.Type_of_Job__c);
            r.put('HourlyRate', sr.Hourly_Rate__c);
            r.put('SaturdayRate', sr.Saturday_Hourly_Rate__c);
            r.put('SundayRate', sr.Sunday_Hourly_Rate__c);
            r.put('PublicHolidayRate', sr.Public_Holiday_Hourly_Rate__c);
            r.put('AfternoonShiftRate', sr.Afternoon_Shift_Hourly_Rate__c);
            r.put('NightShiftRate', sr.Night_Shift_Hourly_Rate__c);
            r.put('SleepoverAllowance', sr.Sleepover_Allowance__c);
            result.add(r);
        }

        return result;
    }

}