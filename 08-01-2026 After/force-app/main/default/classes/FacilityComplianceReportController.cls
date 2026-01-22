public with sharing class FacilityComplianceReportController {

    @AuraEnabled(cacheable=true)
    public static FacilityComplianceWrapper getFacilityCompliance(Id facilityId) {

        // Facility document definitions (CATEGORY LIVES HERE)
        List<Facility_Compliance_Setting__c> rules = [
            SELECT Id,
                   Document_Name__c,
                   Compliance_Category__c,
                   Mandatory_Document__c
            FROM Facility_Compliance_Setting__c
            WHERE Facility__c = :facilityId
        ];

        // Staff + uploaded documents
        List<Staff__c> staffList = [
            SELECT Id,
                   Name,
                   Display_Nickname__c,
                   Email_Address__c,
                   (
                       SELECT Id,
                              Document_Type__c,
                              Status__c,
                              Expiry_Date__c
                       FROM Child_Staffs__r
                   ),
                   (
                       SELECT Id,
                              RoleName__c, Facility__c
                       FROM StaffRoles__r
                       WHERE Active__c = TRUE
                   )
            FROM Staff__c WHERE
            ID IN  (SELECT Staff__c FROM Staff_Facility__c WHERE Active__c = true AND Facility__c =:facilityId) ];

        return new FacilityComplianceWrapper(rules, staffList);
    }

    public class FacilityComplianceWrapper {
        @AuraEnabled public List<Facility_Compliance_Setting__c> rules;
        @AuraEnabled public List<Staff__c> staff;

        public FacilityComplianceWrapper(
            List<Facility_Compliance_Setting__c> r,
            List<Staff__c> s
        ) {
            rules = r;
            staff = s;
        }
    }
}