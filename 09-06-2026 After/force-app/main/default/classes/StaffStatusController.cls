public with sharing class StaffStatusController {
    // Get staff counts for different statuses
    @AuraEnabled
    public static Map<String, Integer> getStaffCounts(String userId, Id facilityId) {
        
        System.debug('userId=====> ' + userId);
        System.debug('facility=====> ' + facilityId);
        
        // Fetch the organization name associated with the user
        User userRecord = [SELECT Id, Name, Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
        System.debug('userRecord=====> ' + userRecord.Id);
        Map<String, Integer> staffCounts = new Map<String, Integer>();

        // Query count for Active Staff
        Integer activeCount = [SELECT COUNT() FROM Staff__c WHERE Facility__c =:facilityId AND Status__c = true AND Organization_Full_Name__c = :userRecord.Organization_Name__c];
        staffCounts.put('activeCount', activeCount);

        // Query count for Inactive Staff
        Integer inactiveCount = [SELECT COUNT() FROM Staff__c WHERE Facility__c =:facilityId AND Status__c = false AND Organization_Full_Name__c = :userRecord.Organization_Name__c];
        staffCounts.put('inactiveCount', inactiveCount);

        // Query count for Visa Expiry staff
       // List<Staff__c> staff = [SELECT Id  FROM Staff__c WHERE Status__c != false AND Organization_Full_Name__c = :userRecord.Organization_Name__c];
        //system.debug('staff==>'+staff);
        Integer visaExpiryCount = [SELECT COUNT()
        FROM Staff__c
        WHERE Facility__c =:facilityId 
        AND Status__c != false
        AND Organization_Full_Name__c = :userRecord.Organization_Name__c
        AND Id IN (
            SELECT Staff__c 
            FROM Child_Staff__c  // Replace with your actual child object
            WHERE Expiry_Date__c < TODAY
        )];
        staffCounts.put('visaExpiryCount', visaExpiryCount);

        // Query count for Staff on Vacation
        Integer vacationCount = [ SELECT COUNT() FROM Staff__c WHERE Id IN (SELECT Staff__c FROM Leave__c WHERE Status__c = 'Approved' AND From__c <= TODAY AND To__c >= TODAY) 
                                        AND Facility__c =:facilityId AND Organization_Full_Name__c = :userRecord.Organization_Name__c ];    
        staffCounts.put('vacationCount', vacationCount);

        return staffCounts;
    }
    
    @AuraEnabled
    public static Map<String, Integer> getClientCounts(String userId, Id facilityId) {
        
        System.debug('userId=====> ' + userId);
        System.debug('facilityId=====> ' + facilityId);
        User objUser = [ SELECT Phone, Id,Organization_Name__c FROM User WHERE Id = : UserInfo.getUserId() ];
        System.Debug('Controller User ' + objUser.Organization_Name__c);
         String UserEmail = UserInfo.getUserEmail();
        Organisation__c orgD = [select Id,name from Organisation__c where name=:objUser.Organization_Name__c];
        String trucatedStr = string.valueof(orgD.Id).substring(0,15);
        system.debug('trucatedStr===>'+trucatedStr); 
        list<Client__c> listOfClients = new list<Client__c>();           
        
        Map<String, Integer> staffCounts = new Map<String, Integer>();

        // Query count for Active Clients
        Integer activeCount = [SELECT COUNT() 
                               FROM Client__c 
                               WHERE Status__c = true
                               AND Organization_Name__c = :trucatedStr
                               //AND Facility__c =:facilityId];
                               AND Id IN (
                                   SELECT Participant__c
                                   FROM Participant_Facility__c
                                   WHERE Facility__c = :facilityId
                                   AND Active__c = true
                               )];
        staffCounts.put('activeCount', activeCount);
        system.debug('activeCount===>'+activeCount);

        // Query count for Inactive Clients
        Integer inactiveCount = [SELECT COUNT() 
                                 FROM Client__c 
                                 WHERE Status__c = false
                                  //AND Facility__c =:facilityId
                                 AND Organization_Name__c = :trucatedStr
                                 AND Id IN (
                                    SELECT Participant__c
                                    FROM Participant_Facility__c
                                    WHERE Facility__c = :facilityId
                                    AND Active__c = true
                                )];
        staffCounts.put('inactiveCount', inactiveCount);
        system.debug('inactiveCount===>'+inactiveCount);

        return staffCounts;
    }
    
}