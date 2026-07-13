public with sharing class staffFacilityHandler {
   public class StaffFacilityWrapper {
        @AuraEnabled public Id staffId;
        @AuraEnabled public List<Id> selectedFacilityIds;
  }

  
    @AuraEnabled
    public static void upsertStaffFacilities(String wrapperJson) {

         if (String.isBlank(wrapperJson)) {
        throw new AuraHandledException('Request payload is empty');
    }

       StaffFacilityWrapper   wrapper = (StaffFacilityWrapper)   JSON.deserialize(wrapperJson, StaffFacilityWrapper.class);
        Set<Id> selectedFacilitySet = new Set<Id>();
        if (wrapper.selectedFacilityIds != null) {
            selectedFacilitySet.addAll(wrapper.selectedFacilityIds);
        }

        // Fetch all existing Staff-Facility records
        Map<Id, Staff_Facility__c> existingByFacility = new Map<Id, Staff_Facility__c>();

        for (Staff_Facility__c sf : [
            SELECT Id, Facility__c, Active__c
            FROM Staff_Facility__c
            WHERE Staff__c = :wrapper.staffId
        ]) {
            existingByFacility.put(sf.Facility__c, sf);
        }

        List<Staff_Facility__c> recordsToUpsert = new List<Staff_Facility__c>();

        /* -----------------------------------------
           INSERT or ACTIVATE selected facilities
           ----------------------------------------- */
        for (Id facilityId : selectedFacilitySet) {

            if (existingByFacility.containsKey(facilityId)) {

                Staff_Facility__c existing = existingByFacility.get(facilityId);

                // Exists & inactive → Activate
                if (!existing.Active__c) {
                    existing.Active__c = true;
                    recordsToUpsert.add(existing);
                }
                // Exists & active → No change (do nothing)

            } else {
                // Does not exist → Insert
                recordsToUpsert.add(new Staff_Facility__c(
                    Staff__c = wrapper.staffId,
                    Facility__c = facilityId,
                    Active__c = true
                ));
            }
        }

        /* -----------------------------------------
           DEACTIVATE removed facilities
           ----------------------------------------- */
        for (Staff_Facility__c existing : existingByFacility.values()) {

            if (!selectedFacilitySet.contains(existing.Facility__c) && existing.Active__c) {      existing.Active__c = false;           recordsToUpsert.add(existing);
            }
        }

        /* -----------------------------------------
           SINGLE DML
           ----------------------------------------- */
        if (!recordsToUpsert.isEmpty()) {       upsert recordsToUpsert;
        }
    }


    public static void upsertStaffFacilitiesBulk(List<StaffFacilityWrapper> wrappers) {

        if (wrappers == null || wrappers.isEmpty()) return;

        // staff -> selected facility IDs
        Map<Id, Set<Id>> selectedByStaff = new Map<Id, Set<Id>>();
        Set<Id> staffIds = new Set<Id>();

        for (StaffFacilityWrapper w : wrappers) {
            if (w == null || w.staffId == null) continue;

            staffIds.add(w.staffId);

            Set<Id> facSet = selectedByStaff.get(w.staffId);
            if (facSet == null) {
                facSet = new Set<Id>();
                selectedByStaff.put(w.staffId, facSet);
            }

            if (w.selectedFacilityIds != null) {
                for (Id fid : w.selectedFacilityIds) {
                    if (fid != null) facSet.add(fid);
                }
            }
        }

        if (staffIds.isEmpty()) return;

        // Existing junctions grouped by Staff -> Facility
        Map<Id, Map<Id, Staff_Facility__c>> existingByStaffFacility = new Map<Id, Map<Id, Staff_Facility__c>>();

        for (Staff_Facility__c sf : [
            SELECT Id, Staff__c, Facility__c, Active__c
            FROM Staff_Facility__c
            WHERE Staff__c IN :staffIds
        ]) {
            Map<Id, Staff_Facility__c> byFacility = existingByStaffFacility.get(sf.Staff__c);
            if (byFacility == null) {
                byFacility = new Map<Id, Staff_Facility__c>();
                existingByStaffFacility.put(sf.Staff__c, byFacility);
            }
            byFacility.put(sf.Facility__c, sf);
        }

        List<Staff_Facility__c> toUpsert = new List<Staff_Facility__c>();

        /* -----------------------------------------
           INSERT or ACTIVATE selected facilities
           ----------------------------------------- */
        for (Id staffId : selectedByStaff.keySet()) {

            Set<Id> selectedFacilitySet = selectedByStaff.get(staffId);
            Map<Id, Staff_Facility__c> existingByFacility =
                existingByStaffFacility.containsKey(staffId)
                    ? existingByStaffFacility.get(staffId): new Map<Id, Staff_Facility__c>();

            for (Id facilityId : selectedFacilitySet) {
                if (existingByFacility.containsKey(facilityId)) {

                    Staff_Facility__c existing = existingByFacility.get(facilityId);
                    if (existing.Active__c == false) {         existing.Active__c = true;       toUpsert.add(existing);
                    }

                } else {
                    toUpsert.add(new Staff_Facility__c(
                        Staff__c = staffId,
                        Facility__c = facilityId,
                        Active__c = true
                    ));
                }
            }
        }

        /* -----------------------------------------
           DEACTIVATE removed facilities
           ----------------------------------------- */
        for (Id staffId : existingByStaffFacility.keySet()) {

            Set<Id> selectedFacilitySet =
                selectedByStaff.containsKey(staffId)
                    ? selectedByStaff.get(staffId) : new Set<Id>(); // if staff not in request, treat as no selected facilities

            for (Staff_Facility__c existing : existingByStaffFacility.get(staffId).values()) {
                if (existing.Active__c == true &&
                    !selectedFacilitySet.contains(existing.Facility__c)) {       existing.Active__c = false;        toUpsert.add(existing);
                }
            }
        }

        if (!toUpsert.isEmpty()) {         upsert toUpsert;
        }
    }

     public class participantFacilityWrapper {
        @AuraEnabled public Id participantId;
        @AuraEnabled public List<Id> selectedFacilityIds;
  }

    @AuraEnabled
    public static List<Participant_Facility__c>  upsertParticipantFacilities(String wrapperJson) {

         if (String.isBlank(wrapperJson)) {
        throw new AuraHandledException('Request payload is empty');
    }

       participantFacilityWrapper   wrapper = (participantFacilityWrapper)   JSON.deserialize(wrapperJson, participantFacilityWrapper.class);
        Set<Id> selectedFacilitySet = new Set<Id>();
        if (wrapper.selectedFacilityIds != null) {
            selectedFacilitySet.addAll(wrapper.selectedFacilityIds);
        }

        // Fetch all existing Staff-Facility records
        Map<Id, Participant_Facility__c> existingByFacility = new Map<Id, Participant_Facility__c>();

        for (Participant_Facility__c sf : [
            SELECT Id, Facility__c, Active__c
            FROM Participant_Facility__c
            WHERE Participant__c = :wrapper.participantId
        ]) {
            existingByFacility.put(sf.Facility__c, sf);
        }

        List<Participant_Facility__c> recordsToUpsert = new List<Participant_Facility__c>();

        /* -----------------------------------------
           INSERT or ACTIVATE selected facilities
           ----------------------------------------- */
        for (Id facilityId : selectedFacilitySet) {

            if (existingByFacility.containsKey(facilityId)) {

                Participant_Facility__c existing = existingByFacility.get(facilityId);

                // Exists & inactive → Activate
                if (!existing.Active__c) {   existing.Active__c = true;        recordsToUpsert.add(existing);
                }
                // Exists & active → No change (do nothing)

            } else {
                // Does not exist → Insert
                recordsToUpsert.add(new Participant_Facility__c(
                    Participant__c = wrapper.participantId,
                    Facility__c = facilityId,
                    Active__c = true
                ));
            }
        }

        /* -----------------------------------------
           DEACTIVATE removed facilities
           ----------------------------------------- */
        for (Participant_Facility__c existing : existingByFacility.values()) {

            if (!selectedFacilitySet.contains(existing.Facility__c)
                && existing.Active__c) {

                existing.Active__c = false;
                recordsToUpsert.add(existing);
            }
        }

        /* -----------------------------------------
           SINGLE DML
           ----------------------------------------- */
        if (!recordsToUpsert.isEmpty()) {            upsert recordsToUpsert;
        }
        return recordsToUpsert;
    }
     @AuraEnabled
        public static Map<Id, List<Id>> getStaffFacilityMap(List<string> staffIds) {
            Map<Id, Set<Id>> tempMap = new Map<Id, Set<Id>>();

            for (Staff_Facility__c pf : [
                SELECT Staff__c, Facility__c
                FROM Staff_Facility__c
                WHERE Staff__c IN :staffIds
                AND Active__c = true
            ]) {
                if (!tempMap.containsKey(pf.Staff__c)) {
                    tempMap.put(pf.Staff__c, new Set<Id>());
                }
                tempMap.get(pf.Staff__c).add(pf.Facility__c);
            }

            // Convert Set → List for Aura/LWC serialization
            Map<Id, List<Id>> result = new Map<Id, List<Id>>();
            for (Id pid : tempMap.keySet()) {
                result.put(pid, new List<Id>(tempMap.get(pid)));
            }
            System.debug('result ==>'+result);
            return result;
}

}