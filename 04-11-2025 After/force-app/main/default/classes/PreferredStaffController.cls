public class PreferredStaffController {
    
    @AuraEnabled(cacheable=true)
    public static List<String> getRoles() {
        // Step 1: Get current user's ID
        Id userId = UserInfo.getUserId();
        
        // Step 2: Query the user to get their Organisation Id (assuming the User has a lookup field to Organisation__c)
        User usr = [
            SELECT Organization_Name__c 
            FROM User 
            WHERE Id = :userId 
            LIMIT 1
        ];
        system.debug('usr >>'+ usr);
        if (usr.Organization_Name__c == null) {
            throw new AuraHandledException('No Organisation is linked to the current user.');
        }
        
        // Step 3: Query Organisation__c for Roles__c
        Organisation__c org = [
            SELECT Roles__c, Name 
            FROM Organisation__c 
            WHERE Name = :usr.Organization_Name__c 
            LIMIT 1
        ];
        system.debug('org >>'+ org);
        // Step 4: Split the multi-picklist values
        List<String> rolesList = new List<String>();
        if (String.isNotBlank(org.Roles__c)) {
            rolesList = org.Roles__c.split(';');
        }
        system.debug('rolesList >>'+ rolesList);
        return rolesList;
    }
    
    @AuraEnabled
    public static List<Staff__c> getStaffMembers(Id facilityId) {
        try {
            Id currentUserId = UserInfo.getUserId();
            System.debug('Current User ID: ' + currentUserId);
            
            List<Staff__c> staffList = new List<Staff__c>();
            
            List<User> userOrgName = [
                SELECT Id, Organization_Name__c, User_Type__c, Email
                FROM User
                WHERE Id = :currentUserId
                LIMIT 1
            ];
            
            List<Organisation__c> organisationList = [
                SELECT Id, Name
                FROM Organisation__c
                WHERE Name = :userOrgName[0].Organization_Name__c
            ];
            
            
            staffList = [
                SELECT Id, Name,Role__c,Display_Nickname__c, Set_Hours__c, Class_and_Paypont__c,
                Facility__c, Type_of_Job__c, Facility__r.Organisation__c, (select RoleName__c from StaffRoles__r )
                FROM Staff__c
                WHERE Facility__r.Organisation__c = :organisationList[0].Id 
                AND Facility__c =: facilityId
                ORDER BY Name ASC
            ];//  manendra
            
            system.debug('staffList >>'+ staffList);
            
            // ✅ Add the missing return statement
            return staffList;
            
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving staff members: ' + e.getMessage());
        }
    }
    
    public class StaffRoleInfo {
        @AuraEnabled public String staffId;
        @AuraEnabled public String staffName;
        @AuraEnabled public List<String> roles;
        
        public StaffRoleInfo(String staffId, String staffName, List<String> roles) {
            this.staffId = staffId;
            this.staffName = staffName;
            this.roles = roles;
        }
    }
    
    @AuraEnabled
    public static List<StaffRoleInfo> getStaffRoleAssignment(Id clientId) {
        if (clientId == null) {
            throw new AuraHandledException('Client ID is required.');
        }
        
        Client__c client = [SELECT Id, Name, Facility__c FROM Client__c Where Id =:clientId];
        
        // Map to store staffId -> list of roles
        Map<Id, List<String>> staffToRolesMap = new Map<Id, List<String>>();
        Map<Id, String> staffIdToNameMap = new Map<Id, String>();
        
        // Query active Participant_Staff_Association__c records
        List<Participant_Staff_Association__c> psaList = [
            SELECT Staff__c, Staff__r.Display_Nickname__c, Staff__r.Facility__c //Role__c, 
            FROM Participant_Staff_Association__c
            WHERE Participant__c = :clientId 
            AND Staff__r.Facility__c =: client.Facility__c
            AND Active__c = true
        ]; // manendra
        
        // Populate the map
        for (Participant_Staff_Association__c psa : psaList) {
             // if (psa.Staff__c == null || String.isBlank(psa.Role__c)) {
              //  continue;
           // }
            
           /* if (!staffToRolesMap.containsKey(psa.Staff__c)) {
                staffToRolesMap.put(psa.Staff__c, new List<String>());
            } */
           // staffToRolesMap.get(psa.Staff__c).add(psa.Role__c);
            
            // Map staff name
            staffIdToNameMap.put(psa.Staff__c, psa.Staff__r.Display_Nickname__c);
        }
        
        // Convert the map to a list of StaffRoleInfo
        List<StaffRoleInfo> result = new List<StaffRoleInfo>();
        for (Id staffId : staffToRolesMap.keySet()) {
            String name = staffIdToNameMap.get(staffId);
            result.add(new StaffRoleInfo(staffId, name, staffToRolesMap.get(staffId)));
        }
        
        return result;
    } 
      
}