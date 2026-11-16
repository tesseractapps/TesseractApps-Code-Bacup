public with sharing class StaffRoleController {

    @AuraEnabled
    public static List<StaffRole__c> getStaffRoles(Id staffId) {
         List<StaffRole__c> roles = new List<StaffRole__c>();
        if (staffId == null) return new  List<StaffRole__c>();
    
         roles = [
            SELECT RoleName__c ,Facility__c,Primary__c,Active__c
            FROM StaffRole__c 
            WHERE StaffRole_To_Staff__c = :staffId 
            AND Active__c = true
            ORDER BY LastModifiedDate ASC
        ];
        return roles;
    }

   
@AuraEnabled
public static StaffRoleWrapper getStaffRoleWithRates(Id staffId, String roleName,string facility) {
    if (staffId == null || String.isBlank(roleName)) return null;
    System.debug('staffId =>'+staffId);
    System.debug('roleName =>'+roleName);
    System.debug('facility =>'+facility);


    StaffRole__c sr;
    try {
        sr = [
            SELECT RoleName__c, Hourly_Rate__c, Saturday_Hourly_Rate__c, Sunday_Hourly_Rate__c,Facility__r.Name,
                   Public_Holiday_Hourly_Rate__c, Afternoon_Shift_Hourly_Rate__c, Night_Shift_Hourly_Rate__c,Standard_Weekly_Rate__c,
                   Sleepover_Allowance__c,Category_Type__c, Classification_Level__c, Classification_Pay_Point__c,Type_of_Job__c,Broken_Shift_Allowance__c,Allowance_one_unpaid_Break__c,Allowance_two_unpaid_Breaks__c
            FROM StaffRole__c
            WHERE StaffRole_To_Staff__c = :staffId
            AND RoleName__c = :roleName AND Facility__c = :facility
            LIMIT 1
        ];
        System.debug('sr =>'+sr);
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
        @AuraEnabled public String facilityName;
        @AuraEnabled public String brokenShiftAllowance;
        @AuraEnabled public Decimal alloawanceOnepaidbrerak;
        @AuraEnabled public Decimal allowanceTwoUnpaidbreak;
        @AuraEnabled public Decimal standardWeeklyRate;

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
            facilityName=sr.Facility__r.Name;
            system.debug('Broken_Shift_Allowance__c =>'+sr.Broken_Shift_Allowance__c );
            brokenShiftAllowance=sr.Broken_Shift_Allowance__c;
             system.debug('Allowance_one_unpaid_Break__c =>'+sr.Allowance_one_unpaid_Break__c );
            alloawanceOnepaidbrerak=sr.Allowance_one_unpaid_Break__c;
            allowanceTwoUnpaidbreak=sr.Allowance_two_unpaid_Breaks__c;
            standardWeeklyRate=sr.Standard_Weekly_Rate__c;
        }
    }
     public class staffRoleFacilityWrapper {
        @AuraEnabled public String roleId;        // StaffRole__c.Id (if exists)
        @AuraEnabled public String value;         // Role name
        @AuraEnabled public String facilityValue; // Facility Id
        @AuraEnabled public Boolean isActive;     // UI flag
        @AuraEnabled public Boolean isPrimary;
     }

    
 // ===== Main Method =====
@AuraEnabled
public static void createStaffRoles(
    Id staffId,
    String selectedRoles,              // JSON string
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
    String jobType,
    String selectedDropDownFacilityValue,
    String allowanceMethod,
    Decimal twoBreakAllowance,
    Decimal oneBreakAllowance,
    String roleEmploymentData,
    Decimal standardWeeklyRate
) {
    System.debug('Selected Roles JSON => ' + selectedRoles);
    System.debug('Role Employment JSON => ' + roleEmploymentData);
    Map<String, EmploymentDraftWrapper> employmentDraftMap =
    String.isBlank(roleEmploymentData)
    ? new Map<String, EmploymentDraftWrapper>()
    : (Map<String, EmploymentDraftWrapper>)
        JSON.deserialize(
            roleEmploymentData,
            Map<String, EmploymentDraftWrapper>.class
        );
    System.debug('Employment Draft Map => ' + employmentDraftMap);
    if (staffId == null) {
        return;
    }

    if (String.isBlank(dropdownSelectedRole)) {
        dropdownSelectedRole = '';
    }

    // ===== Deserialize JSON =====
    List<StaffRoleFacilityWrapper> roleWrappers =
        String.isBlank(selectedRoles)
            ? new List<StaffRoleFacilityWrapper>()
            : (List<StaffRoleFacilityWrapper>)
                JSON.deserialize(selectedRoles, List<StaffRoleFacilityWrapper>.class);
    system.debug('roleWrappers==>' +roleWrappers);

    // ===== Fetch ALL existing roles for this staff =====
    List<StaffRole__c> existingRoles = [
        SELECT Id,
               RoleName__c,
               Facility__c,
               Active__c,
               Primary__c,
               Hourly_Rate__c,
               Saturday_Hourly_Rate__c,
               Sunday_Hourly_Rate__c,
               Public_Holiday_Hourly_Rate__c,
               Afternoon_Shift_Hourly_Rate__c,
               Night_Shift_Hourly_Rate__c,
               Sleepover_Allowance__c,
               Category_Type__c,
               Classification_Level__c,
               Classification_Pay_Point__c,
               Type_of_Job__c,
               Broken_Shift_Allowance__c,
               Allowance_one_unpaid_Break__c,
               Allowance_two_unpaid_Breaks__c,
               Standard_Weekly_Rate__c
        FROM StaffRole__c
        WHERE StaffRole_To_Staff__c = :staffId
    ];
     system.debug('roleWrappers==>' +roleWrappers);

    // ===== Build existing map (Composite Key) =====
    Map<String, StaffRole__c> existingRoleMap = new Map<String, StaffRole__c>();

    for (StaffRole__c sr : existingRoles) {
        String key = staffId + '|' + sr.RoleName__c + '|' + sr.Facility__c;
        existingRoleMap.put(key, sr);
    }
     system.debug('existingRoles==> ' +existingRoles);

    // ===== Collect incoming keys =====
    Set<String> incomingKeys = new Set<String>();

    for (StaffRoleFacilityWrapper wrap : roleWrappers) {
        String key = staffId + '|' + wrap.value + '|' + wrap.facilityValue;
        incomingKeys.add(key);
    }
     system.debug('incomingKeys==> ' +incomingKeys);
    // ===== Deactivation Logic =====
    List<StaffRole__c> rolesToDeactivate = new List<StaffRole__c>();

    for (StaffRole__c sr : existingRoles) {
        String key = staffId + '|' + sr.RoleName__c + '|' + sr.Facility__c;

        if (!incomingKeys.contains(key)) {
            sr.Active__c = false;
            sr.Primary__c = false;
            rolesToDeactivate.add(sr);
        }
        else if (sr.Primary__c == true) {
            // reset primary in memory (will be updated via upsert)
            sr.Primary__c = false;
        }
    }

    // ===== Process Incoming Roles =====
    List<StaffRole__c> toUpsert = new List<StaffRole__c>();
   
    for (StaffRoleFacilityWrapper wrap : roleWrappers) {

        String key = staffId + '|' + wrap.value + '|' + wrap.facilityValue;

        StaffRole__c sr;

        // ===== Existing Role =====
        if (existingRoleMap.containsKey(key)) {
            sr = existingRoleMap.get(key);
        }
        // ===== New Role =====
        else {
            sr = new StaffRole__c(
                StaffRole_To_Staff__c = staffId,
                RoleName__c = wrap.value,
                Facility__c = wrap.facilityValue
            );
        }

        // ===== Active =====
        sr.Active__c = wrap.isActive == true;

        // ===== Primary =====
        if (wrap.isPrimary == true && wrap.isActive == true) {
            sr.Primary__c = true;
        } else {
            sr.Primary__c = false;
        }

        // // ===== Rates (UNCHANGED LOGIC) =====
        // if (wrap.value == dropdownSelectedRole &&
        //     wrap.facilityValue == selectedDropDownFacilityValue) {

        //     sr.Hourly_Rate__c = hourlyRate;
        //     sr.Saturday_Hourly_Rate__c = saturdayHourlyRate;
        //     sr.Sunday_Hourly_Rate__c = sundayHourlyRate;
        //     sr.Public_Holiday_Hourly_Rate__c = publicHolidayHourlyRate;
        //     sr.Afternoon_Shift_Hourly_Rate__c = afternoonShiftRate;
        //     sr.Night_Shift_Hourly_Rate__c = nightShiftRate;
        //     sr.Sleepover_Allowance__c = sleepoverAllowance;
        //     sr.Category_Type__c = categoryType;
        //     sr.Classification_Level__c = classificationLevel;
        //     sr.Classification_Pay_Point__c = classificationPayType;
        //     sr.Type_of_Job__c = jobType;
        //     sr.Broken_Shift_Allowance__c = allowanceMethod;
        //     sr.Allowance_one_unpaid_Break__c = oneBreakAllowance;
        //     sr.Allowance_two_unpaid_Breaks__c = twoBreakAllowance;
        //     sr.Standard_Weekly_Rate__c = standardWeeklyRate;
        // }
        String roleKey = wrap.value + '_' + wrap.facilityValue;
        if (employmentDraftMap.containsKey(roleKey)) {
            EmploymentDraftWrapper draft = employmentDraftMap.get(roleKey);
            sr.Hourly_Rate__c = draft.genralHourlyRate;
            sr.Saturday_Hourly_Rate__c = draft.sturdayHourlyRate;
            sr.Sunday_Hourly_Rate__c = draft.sundayhourlyRate;
            sr.Public_Holiday_Hourly_Rate__c = draft.publicHolidayRate;
            sr.Afternoon_Shift_Hourly_Rate__c = draft.afterNoonShiftRate;
            sr.Night_Shift_Hourly_Rate__c = draft.nightShiftRate;
            sr.Sleepover_Allowance__c = draft.sleepoverAllowance;
            sr.Category_Type__c = draft.categoryType;
            sr.Classification_Level__c = draft.classificationLevel;
            sr.Classification_Pay_Point__c = draft.classificationPayType;
            sr.Type_of_Job__c = draft.jobType;
            // These values are common for the page
            sr.Broken_Shift_Allowance__c = allowanceMethod;
            sr.Allowance_one_unpaid_Break__c = draft.oneBreakAllowance;
            sr.Allowance_two_unpaid_Breaks__c = draft.twoBreakAllowance;
            sr.Standard_Weekly_Rate__c = draft.standardWeeklyRate;
            System.debug('Applied Draft for => ' + roleKey + ' :: ' + draft);
        }
        toUpsert.add(sr);
    }
    system.debug('toUpsert=> '+toUpsert);

    // ===== Final DML =====
    List<StaffRole__c> finalDmlList = new List<StaffRole__c>();
    finalDmlList.addAll(rolesToDeactivate);
    finalDmlList.addAll(toUpsert);

    if (!finalDmlList.isEmpty()) {
        upsert finalDmlList;
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
//manendra added for stored role employment data
    public class EmploymentDraftWrapper {
    public String jobType;
    public String categoryType;
    public String classificationLevel;
    public String classificationPayType;
    public Decimal genralHourlyRate;
    public Decimal sturdayHourlyRate;
    public Decimal sundayhourlyRate;
    public Decimal publicHolidayRate;
    public Decimal afterNoonShiftRate;
    public Decimal nightShiftRate;
    public Decimal sleepoverAllowance;
    public Decimal standardWeeklyRate;
    public Decimal oneBreakAllowance;
    public Decimal twoBreakAllowance;

}
}