public with sharing class StaffStatusController {
    // Get staff counts for different statuses
    @AuraEnabled(cacheable=true)
    public static Map<String, Integer> getStaffCounts(String userId) {
        
        System.debug('userId=====> ' + userId);
        
        // Fetch the organization name associated with the user
        User userRecord = [SELECT Id, Name, Organization_Name__c FROM User WHERE Id = :userId LIMIT 1];
        
        Map<String, Integer> staffCounts = new Map<String, Integer>();

        // Query count for Active Staff
        Integer activeCount = [SELECT COUNT() FROM Staff__c WHERE Status__c = true AND Organization_Full_Name__c = :userRecord.Organization_Name__c];
        staffCounts.put('activeCount', activeCount);

        // Query count for Inactive Staff
        Integer inactiveCount = [SELECT COUNT() FROM Staff__c WHERE Status__c = false AND Organization_Full_Name__c = :userRecord.Organization_Name__c];
        staffCounts.put('inactiveCount', inactiveCount);

        // Query count for Visa Expiry staff
       // List<Staff__c> staff = [SELECT Id  FROM Staff__c WHERE Status__c != false AND Organization_Full_Name__c = :userRecord.Organization_Name__c];
        //system.debug('staff==>'+staff);
        Integer visaExpiryCount = [SELECT COUNT()
        FROM Staff__c
        WHERE Status__c != false
        AND Organization_Full_Name__c = :userRecord.Organization_Name__c
        AND Id IN (
            SELECT Staff__c 
            FROM Child_Staff__c  // Replace with your actual child object
            WHERE Expiry_Date__c < TODAY
        )];
        staffCounts.put('visaExpiryCount', visaExpiryCount);

        // Query count for Staff on Vacation
        Integer vacationCount = [ SELECT COUNT() FROM Staff__c WHERE Id IN (SELECT Staff__c FROM Leave__c WHERE Status__c = 'Approved' AND From__c <= TODAY AND To__c >= TODAY) 
                                        AND Organization_Full_Name__c = :userRecord.Organization_Name__c ];    
        staffCounts.put('vacationCount', vacationCount);

        return staffCounts;
    }
    
    @AuraEnabled(cacheable=true)
    public static Map<String, Integer> getClientCounts(String userId) {
        
        System.debug('userId=====> ' + userId);
        User objUser = [ SELECT Phone, Id,Organization_Name__c FROM User WHERE Id = : UserInfo.getUserId() ];
        System.Debug('Controller User ' + objUser.Organization_Name__c);
         String UserEmail = UserInfo.getUserEmail();
        list<Client__c> listOfClients = new list<Client__c>();           
        String query = 'SELECT id,Facility__r.Name,Facility__r.Status__c,Name__c,AddressData__c,Address1__c,Address2__c,Picture__c,Organization_Name__c,name,First_Name__c,Last_Name__c,Facility__c,Facility_Name__c,Status__c,Status_A__c,Contact_Number__c,Facility__r.Organisation__c,Address__Street__s,Address__City__s,Address__StateCode__s,Address__CountryCode__s,Address__PostalCode__s, Participant_Status__c,(SELECT Id, Risk_Index__c, Name ,Participant__c FROM Risk_Managements__r) FROM Client__c '; 
        Organisation__c orgD = [select Id,name from Organisation__c where name=:objUser.Organization_Name__c];                    
            
                String trucatedStr = string.valueof(orgD.Id).substring(0,15);
                query += ' where Organization_Name__c  =: trucatedStr'; 
                system.debug('trucatedStr===>'+trucatedStr);              
        
        Map<String, Integer> staffCounts = new Map<String, Integer>();

        // Query count for Active Clients
        Integer activeCount = [SELECT COUNT() 
                               FROM Client__c 
                               WHERE Status__c = true
                               AND Organization_Name__c = :trucatedStr];
        staffCounts.put('activeCount', activeCount);
        system.debug('activeCount===>'+activeCount);

        // Query count for Inactive Clients
        Integer inactiveCount = [SELECT COUNT() 
                                 FROM Client__c 
                                 WHERE Status__c = false 
                                 AND Organization_Name__c = :trucatedStr];
        staffCounts.put('inactiveCount', inactiveCount);
        system.debug('inactiveCount===>'+inactiveCount);

        return staffCounts;
    }
    
}