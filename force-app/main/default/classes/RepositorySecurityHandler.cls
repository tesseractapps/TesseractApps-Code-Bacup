public without sharing class RepositorySecurityHandler {
    @AuraEnabled
    public static void insertRepositorySecurity(Id repositoryId, List<Id> selectedUsers, Boolean isView){
       
            List<Repository__Share> sharingRecords = new List<Repository__Share>();
            for (Id userId : selectedUsers) {
                Repository__Share shareRecord = new Repository__Share();
                shareRecord.ParentId = repositoryId;
                shareRecord.UserOrGroupId = userId;
                if (isView) {
                    shareRecord.AccessLevel = 'Read'; // View
                    System.debug('Accessleve view :' + shareRecord.AccessLevel);
                }                
                shareRecord.RowCause = Schema.Repository__Share.RowCause.Manual; // RowCause must be set explicitly
                sharingRecords.add(shareRecord);
            }
            try {
                if (!sharingRecords.isEmpty()) {                    
                    insert sharingRecords;
                }
            } catch (DmlException e) {
                System.debug('Error inserting sharing records: ' + e.getMessage());
                throw new AuraHandledException('Error in applying permissions.');
            }
        }
        
    
    
	@AuraEnabled(cacheable=true)
    public static List<User> getUsersByRoles(List<String> roles) {
         User objUser = [ SELECT Organization_Name__c FROM User WHERE Id = : UserInfo.getUserId() ];
        string orgName = [Select id,Name from Organisation__c where name=:objUser.Organization_Name__c limit 1].Name;
        return [SELECT Id, Name, UserRole.Name, Facility_Name__c,User_Type__c,FirstName,LastName,Email FROM User WHERE Organization_Name__c=:orgName AND User_Type__c IN :roles AND IsActive=TRUE];
    }
    
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
        // Step 1: Get the organization name for the current logged-in user
        User objUser = [SELECT Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];
        String orgName = [SELECT Name FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1].Name;
        
        // Step 2: Query for all users based on the roles and organization name
        List<User> users = [ 
            SELECT Id, Name, UserRole.Name, FirstName, LastName, Email, User_Type__c
            FROM User
            WHERE Organization_Name__c = :orgName 
            AND User_Type__c IN :roles 
            AND IsActive = TRUE
        ];
    
        System.debug('Fetched Users based on roles: ' + users); // Debug log for the fetched users
    
        // Step 3: Query for users with 'Read' (View) access in Repository__Share
        List<Repository__Share> sharingRecords = [
            SELECT UserOrGroupId, AccessLevel
            FROM Repository__Share
            WHERE ParentId = :repositoryId
            AND AccessLevel = 'Read' // Filter for 'Read' or View access
        ];
    
        // Step 4: Create a Set of User IDs who have view permission
        Set<Id> userIdsWithViewAccess = new Set<Id>();
        for (Repository__Share shareRecord : sharingRecords) {
            userIdsWithViewAccess.add(shareRecord.UserOrGroupId);
        }
    
        System.debug('User IDs with View Permission: ' + userIdsWithViewAccess); // Debug log for the user IDs.
    
        // Step 5: Prepare a list of users with the 'hasViewPermission' flag
        List<Map<String, Object>> userWithPermissionFlags = new List<Map<String, Object>>();
        
        for (User user : users) {
            Map<String, Object> userWithPermission = new Map<String, Object>();
            userWithPermission.put('user', user);
            userWithPermission.put('hasViewPermission', userIdsWithViewAccess.contains(user.Id)); // Set the flag
            userWithPermissionFlags.add(userWithPermission);
        }
    
        System.debug('User with Permission Flags: ' + userWithPermissionFlags); // Debug log for the users with flags.
    
        return userWithPermissionFlags;
    }
    
}