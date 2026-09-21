public class IncidentRegisterController {
    // Get case counts for different statuses
    @AuraEnabled(cacheable=true)
    public static Map<String, Integer> getCaseCounts(String userId, Id facilityId) {
        system.debug('facilityId >>'+ facilityId);
        Map<String, Integer> caseCounts = new Map<String, Integer>();
        // Validate the input userId
        if (String.isBlank(userId)) {
            throw new AuraHandledException('User ID cannot be null or empty.');
        }
        
        // Fetch the organization name associated with the user
        User userRecord = [SELECT Id, Name, Organization_Name__c,User_Type__c FROM User WHERE Id = :userId LIMIT 1];
        
        // Ensure the Organization_Name__c field is not null
        if (String.isBlank(userRecord.Organization_Name__c)) {
            throw new AuraHandledException('The user does not have an organization name defined.');
        }
        
        if(userRecord.User_Type__c == 'NDIS Staff' || userRecord.User_Type__c == 'ICT Staff' || userRecord.User_Type__c == 'Roster Admin' || userRecord.User_Type__c == 'HR Admin'){
            
            // Query count for Open Cases
        Integer openCaseCount = [SELECT COUNT() FROM Case WHERE Status_1__c = 'Open' AND Facility__c =: facilityId  AND Facility__r.Organisation__r.Name=: userRecord.Organization_Name__c AND CreatedById  =:userRecord.Id];
        caseCounts.put('openCases', openCaseCount);

        // Query count for In Progress Cases
        Integer inProgressCaseCount = [SELECT COUNT() FROM Case WHERE Status_1__c = 'In-Progress' AND Facility__c =: facilityId AND Facility__r.Organisation__r.Name=: userRecord.Organization_Name__c AND CreatedById  =:userRecord.Id];
        caseCounts.put('inProgressCases', inProgressCaseCount);

        // Query count for Resolved Cases
        Integer resolvedCaseCount = [SELECT COUNT() FROM Case WHERE Status_1__c = 'Resolved' AND Facility__c =: facilityId AND Facility__r.Organisation__r.Name=: userRecord.Organization_Name__c AND CreatedById  =:userRecord.Id];
        caseCounts.put('resolvedCases', resolvedCaseCount);
            
        } else{
        // Query count for Open Cases
        Integer openCaseCount = [SELECT COUNT() FROM Case WHERE Status_1__c = 'Open' AND Facility__c =: facilityId AND Facility__r.Organisation__r.Name=: userRecord.Organization_Name__c];
        caseCounts.put('openCases', openCaseCount);

        // Query count for In Progress Cases
        Integer inProgressCaseCount = [SELECT COUNT() FROM Case WHERE Status_1__c = 'In-Progress' AND Facility__c =: facilityId  AND Facility__r.Organisation__r.Name=: userRecord.Organization_Name__c];
        caseCounts.put('inProgressCases', inProgressCaseCount);

        // Query count for Resolved Cases
        Integer resolvedCaseCount = [SELECT COUNT() FROM Case WHERE Status_1__c = 'Resolved' AND Facility__c =: facilityId AND Facility__r.Organisation__r.Name=: userRecord.Organization_Name__c];
        caseCounts.put('resolvedCases', resolvedCaseCount);
        }

        return caseCounts;
    }

    // Get cases for a specific status with pagination
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getCases(String status, Integer pageNumber, Integer pageSize) {
        // Initialize the response map
        Map<String, Object> result = new Map<String, Object>();

        // Define the offset and limit for pagination
        Integer offsetValue = (pageNumber - 1) * pageSize;

        // Query the cases based on the status, pagination offset, and limit
        String query = 'SELECT Id, CaseNumber, Subject, Status FROM Case WHERE Status_1__c = :status ORDER BY CreatedDate DESC LIMIT :pageSize OFFSET :offsetValue';
        List<Case> cases = Database.query(query);
        
        // Query for the total record count for the given status
        Integer totalCount = [SELECT COUNT() FROM Case WHERE Status_1__c = :status];
        
        // Store the result
        result.put('records', cases);
        result.put('totalRecords', totalCount);

        return result;
    }
}