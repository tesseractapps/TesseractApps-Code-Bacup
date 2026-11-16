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
    public static List<Staff__c> getStaffMembers(List<String> facilityId) {
        try {
            Id currentUserId = UserInfo.getUserId();
            System.debug('🔵 Current User ID: ' + currentUserId);
            System.debug('🔵 User Type: ' + UserInfo.getUserType());

            List<Staff__c> staffList = new List<Staff__c>();

            // 🔹 Step 1: Get Current User
            User currentUser = [
                SELECT Id, Organization_Name__c, ContactId
                FROM User
                WHERE Id = :currentUserId
                LIMIT 1
            ];

            System.debug('🟡 Current User Record: ' + currentUser);
            System.debug('🟡 Organization_Name__c: ' + currentUser.Organization_Name__c);
            System.debug('🟡 ContactId: ' + currentUser.ContactId);

            // 🔹 Step 2: Get Users List
            List<User> usersList = [
                SELECT Id, Name, Email, Organization_Name__c, User_Type__c, Contact.Email
                FROM User
                WHERE Organization_Name__c = :currentUser.Organization_Name__c
                AND User_Type__c = 'NDIS Staff'
            ];

            System.debug('🟢 Users List Size: ' + usersList.size());
            System.debug('🟢 Users List Data: ' + usersList);

            // 🔹 Step 3: Collect Emails
            Set<String> userEmails = new Set<String>();
            for (User u : usersList) {
                System.debug('User Email: ' + u.Contact.Email);
                if (u.Contact.Email != null) {
                    userEmails.add(u.Contact.Email.toLowerCase());
                }
            }

            System.debug('🟣 User Emails Set Size: ' + userEmails.size());
            System.debug('🟣 User Emails: ' + userEmails);

            // 🔹 Step 4: Query Staff
            staffList = [
                SELECT Id, Name, Role__c, Display_Nickname__c, Set_Hours__c,
                    Class_and_Paypont__c, Email_Address__c,
                    Facility__c, Type_of_Job__c,
                    Facility__r.Organisation__c,
                    picture__c,
                    (SELECT RoleName__c FROM StaffRoles__r)
                FROM Staff__c
                WHERE Status__c = true
                AND Email_Address__c IN :userEmails
                AND Id IN (
                    SELECT Staff__c
                    FROM Staff_Facility__c
                    WHERE Facility__c IN :facilityId
                )
                ORDER BY Name ASC
            ];

            System.debug('🔴 Staff List Size: ' + staffList.size());
            System.debug('🔴 Staff List Data: ' + staffList);

            return staffList;

        } catch (Exception e) {
            System.debug('❌ ERROR: ' + e.getMessage());
            System.debug('❌ STACK TRACE: ' + e.getStackTraceString());
            throw new AuraHandledException('Error retrieving staff members: ' + e.getMessage());
        }
    }
    
    public class StaffRoleInfo {
        @AuraEnabled public String staffId;
        @AuraEnabled public String staffName;
        @AuraEnabled public List<String> roles;
        @AuraEnabled public String profileUrl; 
        
        public StaffRoleInfo(String staffId, String staffName, List<String> roles,String profileUrl) {
            this.staffId = staffId;
            this.staffName = staffName;
            this.roles = roles;
            this.profileUrl = profileUrl;
        }
    }
    
    @AuraEnabled
    public static List<StaffRoleInfo> getStaffRoleAssignment(Id clientId) {
        if (clientId == null) {
            throw new AuraHandledException('Client ID is required.');
        }
        
        Client__c client = [SELECT Id, Name, Facility__c FROM Client__c Where Id =:clientId];
        
        Map<Id, List<String>> staffToRolesMap = new Map<Id, List<String>>();
        Map<Id, String> staffIdToNameMap = new Map<Id, String>();
        Map<Id, String> staffIdToProfileUrlMap = new Map<Id, String>();
        
        List<Participant_Staff_Association__c> psaList = [
            SELECT Role__c, Staff__c, Staff__r.Display_Nickname__c, Staff__r.Facility__c,Staff__r.picture__c,Staff__r.Status__c
            FROM Participant_Staff_Association__c
            WHERE Participant__c = :clientId 
            AND Active__c = true 
            AND Staff__r.Status__c = true
        ];
        
        for (Participant_Staff_Association__c psa : psaList) {
              if (psa.Staff__c == null || String.isBlank(psa.Role__c)) {
                continue;
            }
            
            if (!staffToRolesMap.containsKey(psa.Staff__c)) {
                staffToRolesMap.put(psa.Staff__c, new List<String>());
            }
            staffToRolesMap.get(psa.Staff__c).add(psa.Role__c);
            
            staffIdToNameMap.put(psa.Staff__c, psa.Staff__r.Display_Nickname__c);
            if (psa.Staff__r.picture__c != null) {
                staffIdToProfileUrlMap.put(psa.Staff__c, psa.Staff__r.picture__c);
            }
        }
        
        List<StaffRoleInfo> result = new List<StaffRoleInfo>();
        for (Id staffId : staffToRolesMap.keySet()) {
            String name = staffIdToNameMap.get(staffId);
            result.add(new StaffRoleInfo(staffId, name, staffToRolesMap.get(staffId),staffIdToProfileUrlMap.get(staffId)));
        }
        
        return result;
    } 
      
}