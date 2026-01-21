public without sharing class RepositorySecurityHandler {        
    @AuraEnabled
    public static void insertSecurityRecord(Id repositoryId, List<Id> selectedUsers, Boolean isView) {
        List<Security_Privilege__c> securityPrivileges = new List<Security_Privilege__c>();
    
        for (Id userId : selectedUsers) {
            Security_Privilege__c sec = new Security_Privilege__c();
            sec.User__c = userId;
            sec.Repository__c = repositoryId;
            sec.View__c = isView;
            securityPrivileges.add(sec);
        }    
        try {
            if (!securityPrivileges.isEmpty()) {
                insert securityPrivileges; 
            }
        } catch (DmlException e) {
            System.debug('Error inserting Security Privileges: ' + e.getMessage());
            throw new AuraHandledException('Error in applying security privileges.');
        }
    }  
    
    @AuraEnabled
    public static void insertSecurityPrivilege(Id repositoryId, Id userId) {
        Security_Privilege__c privilege = new Security_Privilege__c(Repository__c = repositoryId,User__c = userId,View__c = true,
                                                                    Edit__c = true,Delete__c = true);    
        insert privilege;
    }
    
	/* @AuraEnabled(cacheable=true)
    public static List<User> getUsersByRoles(List<String> roles) {
         User objUser = [ SELECT Organization_Name__c FROM User WHERE Id = : UserInfo.getUserId() ];
        string orgName = [Select id,Name from Organisation__c where name=:objUser.Organization_Name__c limit 1].Name;
        return [SELECT Id, Name, UserRole.Name, Facility_Name__c,User_Type__c,FirstName,LastName,Email FROM User WHERE Organization_Name__c=:orgName AND User_Type__c IN :roles AND IsActive=TRUE];
    } */
    
    @AuraEnabled(cacheable=true)
    public static String getUserRole() {
        String profileName = [SELECT Type_of_User__c FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1].Type_of_User__c;        
        if (profileName.contains('NDIS')) {
            return 'NDIS';
        } else if (profileName.contains('ICT')) {
            return 'ICT';
        }
        return 'Unknown';
    }
     
    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getUsersWithViewPermission(Id repositoryId, List<String> roles) {
         if (repositoryId == null || roles == null || roles.isEmpty()) {
       		 return new List<Map<String, Object>>(); // Return an empty list if any parameter is invalid
   		 }
        Id currentUserId = UserInfo.getUserId();
        Set<Id> usersToSkip = new Set<Id>();
        Id repositoryCreatedById;

        // Step 1: Get the organization name for the current logged-in user
        User objUser = [SELECT Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];
        String orgName = [SELECT Name FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1].Name;
        
        // Step 2: Query for all users based on the roles and organization name
        List<User> users = [SELECT Id, Name, UserRole.Name, FirstName, LastName, Email, User_Type__c FROM User
            WHERE Organization_Name__c = :orgName AND User_Type__c IN :roles AND IsActive = TRUE];    
        System.debug('Fetched Users based on roles: ' + users); // Debug log for the fetched users
        
        // Step 3: Query Security Privilege records with View access for the given repository
        Map<Id, Boolean> userIdToViewAccessMap = new Map<Id, Boolean>();
        for (Security_Privilege__c privilege : [SELECT User__c, View__c,Repository__r.CreatedById
            FROM Security_Privilege__c WHERE Repository__c = :repositoryId AND View__c = TRUE]) 
        {
            if (repositoryCreatedById == null && privilege.Repository__r.CreatedById != null) {
                repositoryCreatedById = privilege.Repository__r.CreatedById;
            }
            userIdToViewAccessMap.put(privilege.User__c, true);
        }
        
        usersToSkip.add(currentUserId);
        if (repositoryCreatedById != null) {
            usersToSkip.add(repositoryCreatedById);
        }    
        // Step 4: Build the result with hasViewPermission flag
        List<Map<String, Object>> userWithPermissionFlags = new List<Map<String, Object>>();
        for (User user : users) {
            if (usersToSkip.contains(user.Id)) {
                continue; // Skip current user and repo creator
            }
            Map<String, Object> userWithPermission = new Map<String, Object>();
            userWithPermission.put('user', user);
            userWithPermission.put('hasViewPermission', userIdToViewAccessMap.containsKey(user.Id));
            userWithPermissionFlags.add(userWithPermission);
        }    
        return userWithPermissionFlags;    
    }
    
}