public without sharing class RepositorySecurityHandler {        
    /*@AuraEnabled
    public static void insertSecurityRecord(Id repositoryId, List<Id> selectedUsers, Boolean isView, Id attachmentId) {
        List<Security_Privilege__c> securityPrivileges = new List<Security_Privilege__c>();
    
        for (Id userId : selectedUsers) {
            Security_Privilege__c sec = new Security_Privilege__c();
            sec.User__c = userId;
            sec.Repository__c = repositoryId;
            sec.View__c = isView;
            sec.Repository_Attachment__c = attachmentId;
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
    } */ 
    
    public class UserPermissionWrapper {
    @AuraEnabled public Id userId;
    @AuraEnabled public Boolean consentRequired;
    @AuraEnabled public Boolean hasViewPermission;
	}
   /* @AuraEnabled
    public static void insertSecurityRecord(
        Id repositoryId,
        String userPermissions,
        Id attachmentId
    ) {
        List<Security_Privilege__c> securityPrivileges = new List<Security_Privilege__c>();
          List<UserPermissionWrapper> permissions = (List<UserPermissionWrapper>) JSON.deserialize(userPermissions, List<UserPermissionWrapper>.class);
    
        for (UserPermissionWrapper up : permissions) {
            Security_Privilege__c sec = new Security_Privilege__c();
            sec.User__c = up.userId;
            sec.Repository__c = repositoryId;
            sec.View__c = true;
            sec.Consent_Required__c = up.consentRequired;
            
            sec.Repository_Attachment__c = attachmentId;
            securityPrivileges.add(sec);
        }
    
        if (!securityPrivileges.isEmpty()) {
            insert securityPrivileges;
        }
    }*/
    
    @AuraEnabled
    public static void insertSecurityRecord(
        Id repositoryId,
        Id attachmentId,
        String userPermissions   // JSON from LWC
    ) {

        // -----------------------------
        // 1️⃣ Deserialize incoming JSON
        // -----------------------------
        List<UserPermissionWrapper> incomingPermissions =
            (List<UserPermissionWrapper>) JSON.deserialize(
                userPermissions,
                List<UserPermissionWrapper>.class
            );

        // -----------------------------
        // 2️⃣ Fetch existing permissions
        // (ONLY for this attachment)
        // -----------------------------
        Map<Id, Security_Privilege__c> existingByUser = new Map<Id, Security_Privilege__c>();

        for (Security_Privilege__c sp : [
            SELECT Id, User__c, Consent_Required__c
            FROM Security_Privilege__c
            WHERE Repository__c = :repositoryId
              AND Repository_Attachment__c = :attachmentId
        ]) {
            existingByUser.put(sp.User__c, sp);
        }

        // -----------------------------
        // 3️⃣ Prepare DML containers
        // -----------------------------
        List<Security_Privilege__c> toInsert = new List<Security_Privilege__c>();
        List<Security_Privilege__c> toUpdate = new List<Security_Privilege__c>();
        List<Security_Privilege__c> toDelete = new List<Security_Privilege__c>();

        Set<Id> incomingUserIds = new Set<Id>();

        // -----------------------------
        // 4️⃣ INSERT or UPDATE
        // -----------------------------
        for (UserPermissionWrapper up : incomingPermissions) {

            if (up.userId == null) continue;

            incomingUserIds.add(up.userId);

            if (existingByUser.containsKey(up.userId)) {
                // UPDATE existing permission
                Security_Privilege__c existing = existingByUser.get(up.userId);
                existing.View__c = up.hasViewPermission;
                existing.Consent_Required__c = (up.consentRequired == true);
                toUpdate.add(existing);
            } else {
                // INSERT new permission
                Security_Privilege__c sec = new Security_Privilege__c();
                sec.User__c = up.userId;
                sec.Repository__c = repositoryId;
                sec.Repository_Attachment__c = attachmentId;
                sec.View__c = up.hasViewPermission;
                sec.Consent_Required__c = up.consentRequired;
                toInsert.add(sec);
            }
        }

        // -----------------------------
        // 5️⃣  unchecked users
        // -----------------------------
       /*for (Id existingUserId : existingByUser.keySet()) {
            if (!incomingUserIds.contains(existingUserId)) {
                Security_Privilege__c revoke = existingByUser.get(existingUserId);
                revoke.View__c = false;          // revoke access
                revoke.Consent_Required__c = false;
                toUpdate.add(revoke);
            }
        }*/

        // -----------------------------
        // 6️⃣ Execute DML
        // -----------------------------
        if (!toInsert.isEmpty()) insert toInsert;
        if (!toUpdate.isEmpty()) update toUpdate;
       
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
     
   /* @AuraEnabled(cacheable=true)
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
        for (Security_Privilege__c privilege : [SELECT User__c, View__c,Consent_Required__c,Repository__r.CreatedById
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
    }*/
    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getUsersWithViewPermission(Id repositoryId, List<String> roles) {
    if (repositoryId == null || roles == null || roles.isEmpty()) {
        return new List<Map<String, Object>>();
    }

    Id currentUserId = UserInfo.getUserId();
    Set<Id> usersToSkip = new Set<Id>();
    Id repositoryCreatedById;

    User objUser = [
        SELECT Organization_Name__c
        FROM User
        WHERE Id = :UserInfo.getUserId()
    ];

    String orgName = [
        SELECT Name
        FROM Organisation__c
        WHERE Name = :objUser.Organization_Name__c
        LIMIT 1
    ].Name;

    List<User> users = [
        SELECT Id, Name, FirstName, LastName, Email, User_Type__c
        FROM User
        WHERE Organization_Name__c = :orgName
          AND User_Type__c IN :roles
          AND IsActive = TRUE
    ];

    // ⭐ CHANGED: Store full privilege records
    Map<Id, Security_Privilege__c> userIdToPrivilegeMap =
        new Map<Id, Security_Privilege__c>();

    for (Security_Privilege__c sp : [
        SELECT User__c, View__c, Consent_Required__c, Repository__r.CreatedById
        FROM Security_Privilege__c
        WHERE Repository__c = :repositoryId  AND View__c = TRUE]) {
        if (repositoryCreatedById == null && sp.Repository__r.CreatedById != null) {
            repositoryCreatedById = sp.Repository__r.CreatedById;
        }
        userIdToPrivilegeMap.put(sp.User__c, sp);
    }

    usersToSkip.add(currentUserId);
    if (repositoryCreatedById != null) {
        usersToSkip.add(repositoryCreatedById);
    }

    List<Map<String, Object>> result = new List<Map<String, Object>>();

    for (User user : users) {
        if (usersToSkip.contains(user.Id)) continue;

        Security_Privilege__c sp = userIdToPrivilegeMap.get(user.Id);

        Map<String, Object> row = new Map<String, Object>();
        row.put('user', user);
        row.put('hasViewPermission', sp != null && sp.View__c == true);
        row.put('consentRequired', sp != null && sp.Consent_Required__c == true);

        result.add(row);
    }

    return result;
}
    
    @AuraEnabled
    public static List<Security_Privilege__c> getConsentReport(
        Id repositoryId,
        Id attachmentId
    ) {
         System.debug('repositoryId = ' + repositoryId);
        System.debug('attachmentId = ' + attachmentId);
        if (repositoryId == null || attachmentId == null) {
            return new List<Security_Privilege__c>();
        }
       

        return [
            SELECT Id,User__c,User__r.Name,User__r.Email,Consent_Required__c,Consent_Status__c,Repository__r.Name,Repository__r.Document_Type__c,Repository_Attachment__r.File_Name__c FROM Security_Privilege__c
            WHERE Repository__c = :repositoryId AND Repository_Attachment__c = :attachmentId AND Consent_Required__c = true 
        ];
    }

    @AuraEnabled
    public static Map<String, String> getStaffNicknameByEmail(List<Id> userIds) {
        Map<String, String> emailToNickname = new Map<String, String>();

        if (userIds == null || userIds.isEmpty()) {
            return emailToNickname;
        }

        // Step 1: Get User Emails
        Map<Id, String> userIdToEmail = new Map<Id, String>();
        for (User u : [
            SELECT Id, Email
            FROM User
            WHERE Id IN :userIds
            AND Email != null
        ]) {
            userIdToEmail.put(u.Id, u.Email);
        }

        // Step 2: Collect Emails
        Set<String> emails = new Set<String>(userIdToEmail.values());

        if (emails.isEmpty()) {
            return emailToNickname;
        }

        // Step 3: Query Staff using correct field
        for (Staff__c st : [
            SELECT Id, Email_Address__c, Display_Nickname__c
            FROM Staff__c
            WHERE Email_Address__c IN :emails
        ]) {
            if (!emailToNickname.containsKey(st.Email_Address__c)) {
                emailToNickname.put(st.Email_Address__c, st.Display_Nickname__c);
            }
        }

        return emailToNickname;
    }

   /* @AuraEnabled
    public static void markConsentAsViewed(Id repositoryId, Id attachmentId) {
        Id currentUserId = UserInfo.getUserId();
    
        List<Security_Privilege__c> records = [
            SELECT Id, Consent_Required__c, Consent_Status__c
            FROM Security_Privilege__c
            WHERE Repository__c = :repositoryId
              AND Repository_Attachment__c = :attachmentId
              AND User__c = :currentUserId
            LIMIT 1
        ];
    
        if (!records.isEmpty()) {
            Security_Privilege__c sp = records[0];
    
            // ✅ UPDATE ONLY IF:
            // 1. Consent is required
            // 2. Status is exactly "Requested"
            if (sp.Consent_Required__c == true &&
                sp.Consent_Status__c == 'Requested') {
    
                sp.Consent_Status__c = 'Viewed';
                update sp;
            }
            // ❌ else: skip update silently
        }
    }*/
    @AuraEnabled
    public static Boolean markConsentAsViewed(
        Id repositoryId,
        Id attachmentId
    ) {
        Id currentUserId = UserInfo.getUserId();
    
        List<Security_Privilege__c> records = [
            SELECT Id, Consent_Required__c, Consent_Status__c
            FROM Security_Privilege__c
            WHERE Repository__c = :repositoryId
              AND Repository_Attachment__c = :attachmentId
              AND User__c = :currentUserId
            LIMIT 1
        ];
    
        if (records.isEmpty()) {
            return false; // no record → no consent
        }
    
        Security_Privilege__c sp = records[0];
    
        // Update status ONLY when Requested
        if (sp.Consent_Required__c == true &&
            sp.Consent_Status__c == 'Requested') {
    
            sp.Consent_Status__c = 'Viewed';
            update sp;
        }
    
        // ⭐ RETURN whether consent is required
        return sp.Consent_Required__c == true;
    }

    
    @AuraEnabled
    public static void acceptConsent(
        Id repositoryId,
        Id attachmentId
    ) {
        Id currentUserId = UserInfo.getUserId();
    
        List<Security_Privilege__c> records = [
            SELECT Id, Consent_Required__c, Consent_Status__c
            FROM Security_Privilege__c
            WHERE Repository__c = :repositoryId
              AND Repository_Attachment__c = :attachmentId
              AND User__c = :currentUserId
            LIMIT 1
        ];
    
        if (!records.isEmpty()) {
            Security_Privilege__c sp = records[0];
    
            // ✅ Accept ONLY if consent is required and not already accepted
            if (sp.Consent_Required__c == true &&
            sp.Consent_Status__c == 'Viewed') {
    
                sp.Consent_Status__c = 'Accepted';
                update sp;
            }
        }
    }


    
}