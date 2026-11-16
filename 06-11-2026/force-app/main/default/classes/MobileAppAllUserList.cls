@RestResource(urlMapping='/fetchAllUsers/*')
Global without sharing class MobileAppAllUserList {
     @HttpGet
    global static void getAllUsers() {
        try {
            // Fetch users
            // 
              String environment = Label.Environment_Label;
            User objUser = [ SELECT Organization_Name__c FROM User WHERE Id = : UserInfo.getUserId() ];
            String orgID = [SELECT Id FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1].Id;
            List<User> allUsers = [
                SELECT Id, FirstName, LastName, Email, IsActive, Organization_Name__c ,UserRole.Name
                FROM User 
                WHERE  Organization_Name__c =: objUser.Organization_Name__c and IsActive =true];
            Set<String> userEmails = new Set<String>();
            for (User u : allUsers) {
                if (u.Email != null) {
                    userEmails.add(u.Email);
                }
            }
            
            Map<String, String> staffPhotoMap = new Map<String, String>();
            if (!userEmails.isEmpty()) {
                List<Staff__c> staffList = [SELECT Email_Address__c, picture__c FROM Staff__c WHERE Email_Address__c IN :userEmails];
                for (Staff__c s : staffList) {
                    staffPhotoMap.put(s.Email_Address__c, s.picture__c);
                }
            }
            
            // Group users by organization
            Map<String, OrganizationWrapper> orgMap = new Map<String, OrganizationWrapper>();
            
           for (User u : allUsers) {
                if (!orgMap.containsKey(orgID)) {
                    orgMap.put(orgID, new OrganizationWrapper(orgID,environment));
                }
                orgMap.get(orgID).usersList.add(new UserWrapper(u, staffPhotoMap,orgID));
            }
            
            
            // Prepare response
            RestResponse res = RestContext.response;
            res.responseBody = Blob.valueOf(JSON.serialize(orgMap.values()));
            res.statusCode = 200;
        } catch (Exception e) {
            RestResponse res = RestContext.response;
            res.responseBody = Blob.valueOf(JSON.serialize('Error: ' + e.getMessage()));
            res.statusCode = 200;
        }
    }
    global class UserWrapper {
        public String firstname;
        public String lastname;
        public String email;
        public String userRole;
        public Boolean isActive;
        public String photoUrl;
        public String userId;
        public string orgnisationName;
       
        
         public UserWrapper(User u, Map<String, String> staffPhotoMap,string orgID) {
            this.userId=u.Id;
            this.firstname = u.FirstName;
            this.lastname = u.LastName;
            this.email = u.Email;
            this.userRole = u.UserRole.Name;
            this.isActive = u.IsActive;
            this.orgnisationName=orgID;
            this.photoUrl = (staffPhotoMap.containsKey(u.Email) && staffPhotoMap.get(u.Email) != null && staffPhotoMap.get(u.Email).trim() != '') 
                ? staffPhotoMap.get(u.Email) 
                : null;
        }
    }
    
    global class OrganizationWrapper {
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