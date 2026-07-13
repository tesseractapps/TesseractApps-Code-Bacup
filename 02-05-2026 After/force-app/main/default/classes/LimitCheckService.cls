public with sharing class LimitCheckService {

    // =====================================================
    // 🔹 COMMON: Get Matched Organisation
    // =====================================================
    private static Organisation__c getMatchedOrg() {

        User u = [
            SELECT Organization_Name__c 
            FROM User 
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        if (String.isBlank(u.Organization_Name__c)) {
            return null;
        }

        return [
            SELECT Id, Name, Organization_Tier__c
            FROM Organisation__c
            WHERE Name = :u.Organization_Name__c
            LIMIT 1
        ];
    }

    // =====================================================
    // 🔥 PLAN BASED LIMIT METHODS
    // =====================================================

    private static Integer getStaffLimit(String plan) {
        return (plan == 'Start') ? 15 : -1;
    }

    private static Integer getParticipantLimit(String plan) {
        return (plan == 'Start') ? 40 : -1;
    }

    private static Integer getFacilityLimit(String plan) {
        return (plan == 'Start') ? 1 : -1;
    }

    // =====================================================
    // 🔹 COMMON: Calculate Remaining
    // =====================================================
    private static Integer calculateRemaining(Integer limitVal, Integer usedVal) {

        if (limitVal == -1) {
            return 999999; // Unlimited
        }

        Integer remaining = limitVal - usedVal;
        return remaining > 0 ? remaining : 0;
    }

    // =====================================================
    // ✅ STAFF LIMIT
    // =====================================================
    @AuraEnabled
    public static Boolean isStaffLimitReached() {

        Organisation__c org = getMatchedOrg();
        if (org == null) return false;

        Integer limitVal = getStaffLimit(org.Organization_Tier__c);

        if (limitVal == -1) return false; // Unlimited

        Integer used = [
            SELECT COUNT()
            FROM Staff__c
            WHERE Facility__r.Organisation__c = :org.Id AND Status__c = true
        ];

        return used >= limitVal;
    }

    @AuraEnabled
    public static Integer getRemainingStaffSlots() {

        Organisation__c org = getMatchedOrg();
        if (org == null) return 0;

        Integer used = [
            SELECT COUNT()
            FROM Staff__c
            WHERE Facility__r.Organisation__c = :org.Id AND Status__c = true
        ];

        Integer limitVal = getStaffLimit(org.Organization_Tier__c);

        return calculateRemaining(limitVal, used);
    }

    // =====================================================
    // 🏢 FACILITY LIMIT
    // =====================================================
    @AuraEnabled
    public static Boolean isFacilityLimitReached() {

        Organisation__c org = getMatchedOrg();
        if (org == null) return false;

        Integer limitVal = getFacilityLimit(org.Organization_Tier__c);

        if (limitVal == -1) return false;

        Integer used = [
            SELECT COUNT()
            FROM Facility__c
            WHERE Organisation__c = :org.Id AND Status__c = true
        ];

        return used >= limitVal;
    }

    @AuraEnabled
    public static Integer getRemainingFacilitySlots() {

        Organisation__c org = getMatchedOrg();
        if (org == null) return 0;

        Integer used = [
            SELECT COUNT()
            FROM Facility__c
            WHERE Organisation__c = :org.Id AND Status__c = true
        ];

        Integer limitVal = getFacilityLimit(org.Organization_Tier__c);

        return calculateRemaining(limitVal, used);
    }

    // =====================================================
    // 👥 PARTICIPANT LIMIT
    // =====================================================
    @AuraEnabled
    public static Boolean isParticipantLimitReached() {

        Organisation__c org = getMatchedOrg();
        if (org == null) return false;

        Integer limitVal = getParticipantLimit(org.Organization_Tier__c);

        if (limitVal == -1) return false;

        Integer used = [
            SELECT COUNT()
            FROM Client__c
            WHERE Facility__r.Organisation__c = :org.Id AND Status__c = true
        ];

        return used >= limitVal;
    }

    @AuraEnabled
    public static Integer getRemainingParticipantSlots() {

        Organisation__c org = getMatchedOrg();
        if (org == null) return 0;

        Integer used = [
            SELECT COUNT()
            FROM Client__c
            WHERE Facility__r.Organisation__c = :org.Id AND Status__c = true
        ];

        Integer limitVal = getParticipantLimit(org.Organization_Tier__c);

        return calculateRemaining(limitVal, used);
    }

    // =====================================================
    // 📄 ADD AGREEMENT RESTRICTION (UNCHANGED)
    // =====================================================
    @AuraEnabled
    public static Boolean canAddAgreement() {
        try {
            return [
                SELECT Allow_Add_Agreement__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ].Allow_Add_Agreement__c;
        } catch (Exception e) {
            return false;
        }
    }
   

    // ========================================================
    // Start plan limit
    // ========================================================
    @AuraEnabled(cacheable=true)
public static Boolean isStartPlan() {

    Organisation__c org = getMatchedOrg();
    if (org == null) return false;

    return org.Organization_Tier__c == 'Start';
}
}