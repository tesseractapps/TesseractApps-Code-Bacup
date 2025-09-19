public class SignInStatusController {    
    @AuraEnabled(cacheable=true)
    public static Map<String, Integer> getSignInCounts(String userId) {
        
        User userRecord = [SELECT Id, Name,Email,Organization_Name__c,User_Type__c FROM User WHERE Id = :userId LIMIT 1];
        system.debug('userRecord.Organization_Name__c===>'+userRecord.Organization_Name__c);
        
        Staff__c StaffRecord = [Select Id, Email_Address__c From Staff__c Where Email_Address__c =:userRecord.Email LIMIT 1];
        
        Map<String, Integer> signInCounts = new Map<String, Integer>();

        try {
            if(userRecord.User_Type__c == 'NDIS Staff'){
            // Example: Count Sign-Ins based on userId
            Integer completedCount = [SELECT COUNT() FROM ShiftwithStaff__c WHERE Status__c = 'Completed' AND Add_Shift__r.Facility__r.Organisation__r.Name = :userRecord.Organization_Name__c And Date__c  = TODAY AND Staff__c =: StaffRecord.Id];
            Integer inProgressCount = [SELECT COUNT() FROM ShiftwithStaff__c WHERE Status__c = 'InProgress' AND Add_Shift__r.Facility__r.Organisation__r.Name = :userRecord.Organization_Name__c And Date__c  = TODAY AND Staff__c =: StaffRecord.Id];
            Integer acceptedCount = [SELECT COUNT() FROM ShiftwithStaff__c WHERE Status__c = 'Accepted' AND Add_Shift__r.Facility__r.Organisation__r.Name = :userRecord.Organization_Name__c And Date__c  = TODAY AND Staff__c =: StaffRecord.Id];
            

            signInCounts.put('completedCount', completedCount);
            signInCounts.put('inprogressCount', inProgressCount);
            signInCounts.put('acceptedCount', acceptedCount);}  else {                Integer completedCount = [SELECT COUNT() FROM ShiftwithStaff__c WHERE Status__c = 'Completed' AND Add_Shift__r.Facility__r.Organisation__r.Name = :userRecord.Organization_Name__c And Date__c  = TODAY];Integer inProgressCount = [SELECT COUNT() FROM ShiftwithStaff__c WHERE Status__c = 'InProgress' AND Add_Shift__r.Facility__r.Organisation__r.Name = :userRecord.Organization_Name__c And Date__c  = TODAY];Integer acceptedCount = [SELECT COUNT() FROM ShiftwithStaff__c WHERE Status__c = 'Accepted' AND Add_Shift__r.Facility__r.Organisation__r.Name = :userRecord.Organization_Name__c And Date__c  = TODAY];signInCounts.put('completedCount', completedCount);
            signInCounts.put('inprogressCount', inProgressCount);
            signInCounts.put('acceptedCount', acceptedCount);
            }
            
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving sign-in counts: ' + e.getMessage());
            
            
                
        }
        
        return signInCounts;
    }
}