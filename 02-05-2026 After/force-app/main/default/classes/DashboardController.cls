public with sharing class DashboardController {

    public class StatsWrapper {
        @AuraEnabled public Integer staffUsed;
        @AuraEnabled public Integer staffTotal;

        @AuraEnabled public Integer participantsUsed;
        @AuraEnabled public Integer participantsTotal;

        @AuraEnabled public Integer facilityUsed;
        @AuraEnabled public Integer facilityTotal;

        @AuraEnabled public Decimal storageUsed;
        @AuraEnabled public Decimal storageLimit;

        @AuraEnabled public String planType;
        @AuraEnabled public Decimal setupFee;
        @AuraEnabled public String billingType;
        @AuraEnabled public Date startDate;
        @AuraEnabled public Date endDate;

        @AuraEnabled public Integer daysRemaining;
        @AuraEnabled public Integer totalDays;

        @AuraEnabled public String accountName;
        @AuraEnabled public String accountNumber;
        @AuraEnabled public String reference;
        @AuraEnabled public Date paymentDate;
    }

    @AuraEnabled(cacheable=true)
    public static StatsWrapper getStats() {

        StatsWrapper sw = new StatsWrapper();
        sw.storageUsed = 0;

        // Get current user org
        User u = [SELECT Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];
        if (String.isBlank(u.Organization_Name__c)) {
            return sw;
        }

        // Fetch organisation
        Organisation__c matchedOrg = [
            SELECT Id, Name, Organization_Tier__c, Setup_Fee__c,
                   Billing_Type__c, Start_Date__c, End_Date__c,
                   Storage_Limit__c,PlanAccount_Name__c,
           PlanAccount_Number__c,
           Reference__c,
           PlanDate__c FROM Organisation__c
            WHERE Name = :u.Organization_Name__c
            LIMIT 1
        ];

        String plan = matchedOrg.Organization_Tier__c;

        // 🔥 PLAN BASED LIMITS
        Integer staffLimit = getStaffLimit(plan);
        Integer participantLimit = getParticipantLimit(plan);
        Integer facilityLimit = getFacilityLimit(plan);

        // Staff
        sw.staffUsed = [
            SELECT COUNT()
            FROM Staff__c
            WHERE Facility__r.Organisation__c = :matchedOrg.Id
            AND Status__c = TRUE
        ];
        sw.staffTotal = (staffLimit == -1) ? null : staffLimit;

        // Participants
        sw.participantsUsed = [
            SELECT COUNT()
            FROM Client__c
            WHERE Facility__r.Organisation__c = :matchedOrg.Id
            AND Status__c = TRUE
        ];
        sw.participantsTotal = (participantLimit == -1) ? null : participantLimit;

        // Facilities
        sw.facilityUsed = [
            SELECT COUNT()
            FROM Facility__c
            WHERE Organisation__c = :matchedOrg.Id
            AND Status__c = TRUE
        ];
        sw.facilityTotal = (facilityLimit == -1) ? null : facilityLimit;

        // Storage (keep as is)
        sw.storageLimit = (matchedOrg.Storage_Limit__c != null) ? matchedOrg.Storage_Limit__c : 0;

        // Plan details
        sw.planType = plan;
        sw.setupFee = matchedOrg.Setup_Fee__c;
        sw.billingType = matchedOrg.Billing_Type__c;
        sw.startDate = matchedOrg.Start_Date__c;
        sw.endDate = matchedOrg.End_Date__c;

        // 🔥 Payment Details
        sw.accountName = matchedOrg.PlanAccount_Name__c;
        sw.accountNumber = String.valueOf(matchedOrg.PlanAccount_Number__c);
        sw.reference = matchedOrg.Reference__c;
        sw.paymentDate = matchedOrg.PlanDate__c;

        // Days remaining
        if (matchedOrg.Start_Date__c != null && matchedOrg.End_Date__c != null) {
            Date today = Date.today();
            Integer totalDays = matchedOrg.Start_Date__c.daysBetween(matchedOrg.End_Date__c);
            Integer remainingDays = (today < matchedOrg.Start_Date__c)
                ? totalDays
                : today.daysBetween(matchedOrg.End_Date__c);

            sw.totalDays = Math.max(totalDays, 0);
            sw.daysRemaining = Math.max(remainingDays, 0);
        } else {
            sw.totalDays = 0;
            sw.daysRemaining = 0;
        }

        return sw;
    }

    // 🔥 PLAN LIMIT METHODS

    private static Integer getStaffLimit(String planType) {
        if (planType == 'Start') {
            return 15;
        }
        return -1; // unlimited
    }

    private static Integer getParticipantLimit(String planType) {
        if (planType == 'Start') {
            return 40;
        }
        return -1;
    }

    private static Integer getFacilityLimit(String planType) {
        if (planType == 'Start') {
            return 1;
        }
        return -1;
    }
}