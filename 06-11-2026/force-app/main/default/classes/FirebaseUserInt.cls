public without sharing class FirebaseUserInt {
    @AuraEnabled(cacheable=true)
    public static String getAllUsers() {
        try {
            Map<String, OrganizationWrapper> orgMap = new Map<String, OrganizationWrapper>();
            String environment = Label.Environment_Label;

            // Query the current user's Organization
            User objUser = [SELECT Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];
            String orgID = [SELECT Id FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1].Id;

            // Fetch all active users belonging to the same organization
            List<User> allUsers = [
                SELECT Id, FirstName, LastName, Email, IsActive, Organization_Name__c, UserRole.Name
                FROM User
                WHERE Organization_Name__c = :objUser.Organization_Name__c AND IsActive = true
            ];

            Set<String> userEmails = new Set<String>();
            for (User u : allUsers) {
                if (u.Email != null) {
                    userEmails.add(u.Email);
                }
            }

            // Prepare a map of user emails to their photo URLs
            Map<String, String> staffPhotoMap = new Map<String, String>();
            if (!userEmails.isEmpty()) {
                List<Staff__c> staffList = [
                    SELECT Email_Address__c, picture__c
                    FROM Staff__c
                    WHERE Email_Address__c IN :userEmails
                ];
                for (Staff__c s : staffList) {
                    staffPhotoMap.put(s.Email_Address__c, s.picture__c);
                }
            }

            // Group users by organization
            for (User u : allUsers) {
                if (!orgMap.containsKey(orgID)) {
                    orgMap.put(orgID, new OrganizationWrapper(orgID, environment));
                }
                orgMap.get(orgID).usersList.add(new UserWrapper(u, staffPhotoMap, orgID));
            }

            // ✅ Return JSON String instead of Map
            return JSON.serialize(orgMap);

        } catch (Exception e) {
            System.debug('An error occurred: ' + e.getMessage());
            return JSON.serialize(new Map<String, String>{'error' => e.getMessage()});
        }
    }

    public class UserWrapper {
        public String firstname;
        public String lastname;
        public String email;
        public String userRole;
        public Boolean isActive;
        public String photoUrl;
        public String userId;
        public String organisationName;

        public UserWrapper(User u, Map<String, String> staffPhotoMap, String orgID) {
            this.userId = u.Id;
            this.firstname = u.FirstName;
            this.lastname = u.LastName;
            this.email = u.Email;
            this.userRole = u.UserRole.Name;
            this.isActive = u.IsActive;
            this.organisationName = orgID;
            this.photoUrl = (staffPhotoMap.containsKey(u.Email) && staffPhotoMap.get(u.Email) != null && staffPhotoMap.get(u.Email).trim() != '')
                ? staffPhotoMap.get(u.Email)
                : null;
        }
    }

    public class OrganizationWrapper {
        public String organisationName;
        public List<UserWrapper> usersList;
        public String env;

        public OrganizationWrapper(String orgID, String environment) {
            this.organisationName = orgID;
            this.usersList = new List<UserWrapper>();
            this.env = environment;
        }
    }
}