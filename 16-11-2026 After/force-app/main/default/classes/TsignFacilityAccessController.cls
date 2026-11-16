public class TsignFacilityAccessController {
    
    // 1. Wrapper Class - RENAMED to FacilityOption to fix the compile error
    public class FacilityOption {
        @AuraEnabled public String id    { get; set; }
        @AuraEnabled public String name  { get; set; }
        @AuraEnabled public Boolean checked { get; set; }

        public FacilityOption(String id, String name, Boolean checked) {
            this.id = id;
            this.name = name;
            this.checked = checked;
        }
    }
    
    // 2. Request Wrapper
    public class FacilityAccessRequest {
        @AuraEnabled public String staffId { get; set; }
        @AuraEnabled public List<String> facilityIds { get; set; } 
    }
    
    @AuraEnabled(cacheable=false)
    public static List<FacilityOption> getFacilityAccessForStaff(String staffId) {
        if (String.isBlank(staffId)) {
            throw new AuraHandledException('Staff Id is required.');
        }
        
        // --- 3. GET CURRENT LOGGED-IN USER'S ORG ---
        User currentUser = [
            SELECT Id, AccountId, TSign_Org_Id__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];
        
        Id currentOrgId = currentUser.TSign_Org_Id__c;
        
        if (currentOrgId == null) {
            throw new AuraHandledException('Current user is not associated with an Organisation (Account).');
        }

        // --- 4. QUERY FACILITIES ONLY FOR THIS ORG ---
        // NOTE: Ensure the field name for the Org lookup on TSign_Facility__c is correct. 
        // I am using 'Organisation__c' as an example. Change it to whatever your lookup field is called.
        List<TSign_Facility__c> allFacilities = [
            SELECT Id, Name
            FROM TSign_Facility__c
            WHERE Active__c = true 
              AND TSign_Organisation__c = :currentOrgId
            ORDER BY Name
        ];
        
        // --- 5. GET EXISTING ACCESS FOR THIS STAFF ---
        Map<String, Boolean> accessMap = new Map<String, Boolean>();
        for (TSign_Staff_Facility__c link : [
            SELECT Id, TSign_Facility__c, Active__c
            FROM TSign_Staff_Facility__c
            WHERE TSign_Staff__c = :staffId
        ]) {
            Boolean current = accessMap.containsKey(link.TSign_Facility__c)
                ? accessMap.get(link.TSign_Facility__c)
                : false;
            accessMap.put(link.TSign_Facility__c, current || (link.Active__c == true));
        }
        
        // --- 6. BUILD RESPONSE ---
        List<FacilityOption> result = new List<FacilityOption>();
        for (TSign_Facility__c fac : allFacilities) {
            Boolean isChecked = accessMap.containsKey(fac.Id) && accessMap.get(fac.Id) == true;
            result.add(new FacilityOption(fac.Id, fac.Name, isChecked));
        }
        
        return result;
    }

    // --- SAVE METHOD ---
    @AuraEnabled
    public static void updateFacilityAccess(FacilityAccessRequest request) {
        if (request == null || String.isBlank(request.staffId)) {
            throw new AuraHandledException('Staff Id is required.');
        }

        Set<String> selectedFacilityIds = new Set<String>();
        if (request.facilityIds != null) {
            selectedFacilityIds.addAll(request.facilityIds);
        }

        // Get existing links
        List<TSign_Staff_Facility__c> existingLinks = [
            SELECT Id, TSign_Facility__c, Active__c
            FROM TSign_Staff_Facility__c
            WHERE TSign_Staff__c = :request.staffId
        ];

        Map<String, TSign_Staff_Facility__c> linkByFacility = new Map<String, TSign_Staff_Facility__c>();
        for (TSign_Staff_Facility__c link : existingLinks) {
            linkByFacility.put(link.TSign_Facility__c, link);
        }

        List<TSign_Staff_Facility__c> toUpdate = new List<TSign_Staff_Facility__c>();
        List<TSign_Staff_Facility__c> toInsert = new List<TSign_Staff_Facility__c>();

        // Reactivate or Insert
        for (String facId : selectedFacilityIds) {
            if (linkByFacility.containsKey(facId)) {
                TSign_Staff_Facility__c existing = linkByFacility.get(facId);
                if (existing.Active__c != true) {
                    existing.Active__c = true;
                    toUpdate.add(existing);
                }
            } else {
                toInsert.add(new TSign_Staff_Facility__c(
                    TSign_Staff__c    = request.staffId,
                    TSign_Facility__c = facId,
                    Active__c         = true
                ));
            }
        }

        // Deactivate
        for (TSign_Staff_Facility__c link : existingLinks) {
            if (!selectedFacilityIds.contains(link.TSign_Facility__c) && link.Active__c == true) {
                link.Active__c = false;
                toUpdate.add(link);
            }
        }

        if (!toInsert.isEmpty()) insert toInsert;
        if (!toUpdate.isEmpty()) update toUpdate;
    }
}