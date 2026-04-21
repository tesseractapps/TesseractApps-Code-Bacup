public without sharing class UserAccessController {
    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getUserAccessDetails(String selectedroleValue, String userId) {
        System.debug('UserId passed to Apex: ' + userId);
        System.debug('Selected Role Value: ' + selectedroleValue);
        
        try {
            // Fetch the current user details
            User currentUser = [SELECT Id, Organization_Name__c 
                                FROM User 
                                WHERE Id = :userId LIMIT 1];
            System.debug('Current User Details: ' + currentUser);
            
            // Query related users based on the current user's organization and selected role
            List<User> relatedUsers;
            if (selectedroleValue == 'All') {
                // Fetch all users in the same organization (except the current user)
                relatedUsers = [SELECT Id, Name, Email, IsActive, Organization_Name__c, User_Type__c, User_Role__c
                                FROM User 
                                WHERE Organization_Name__c = :currentUser.Organization_Name__c 
                                AND Id != :userId];
            } else {
                // Fetch users with the selected role
                relatedUsers = [SELECT Id, Name, Email, IsActive, Organization_Name__c, User_Type__c, User_Role__c
                                FROM User 
                                WHERE Organization_Name__c = :currentUser.Organization_Name__c 
                                AND Id != :userId 
                                AND User_Role__c = :selectedroleValue];
            }
            System.debug('Related Users: ' + relatedUsers);
            
            // Query all staff records
            List<Staff__c> staffList = [SELECT Id, Name, Gender__c, Facility__c, Facility__r.Name, Email_Address__c,Display_Nickname__c, 
                                        Role__c, Type_of_User__c, Status__c, Activated_Deactivated_Date__c, CreatedDate,LastModifiedDate
                                        FROM Staff__c Where Facility__r.Organisation__r.Name =:currentUser.Organization_Name__c];
            System.debug('Staff List: ' + staffList);
            
            // Create a map of staff records keyed by their email for quick lookup
            Map<String, Staff__c> staffMap = new Map<String, Staff__c>();
            for (Staff__c staff : staffList) {
                staffMap.put(staff.Email_Address__c, staff);
            }
            
            
            // Combine user and staff data into a single list
            List<Map<String, Object>> combinedData = new List<Map<String, Object>>();
            for (User u : relatedUsers) {
                Map<String, Object> userData = new Map<String, Object>(); 
                system.debug('user==>'+u.Id); 
                userData.put('userId', u.Id);
                userData.put('userName', u.Name);
                userData.put('userEmail', u.Email);
                userData.put('userIsActive', u.IsActive);
                userData.put('userType', u.User_Type__c);
                userData.put('userRole', u.User_Role__c);
                userData.put('userStatus', u.IsActive ? 'Active' : 'Inactive');
                if (staffMap.containsKey(u.Email)) {
                    Staff__c staff = staffMap.get(u.Email);
                    userData.put('staffName', staff.Name);
                    userData.put('staffGender', staff.Gender__c);
                    userData.put('staffFacility', staff.Facility__r != null ? staff.Facility__r.Name : null);
                    userData.put('staffNickName', staff.Display_Nickname__c);
                    userData.put('staffFacilityId', staff.Facility__c);
                    userData.put('staffRole', staff.Role__c);
                    userData.put('staffType', staff.Type_of_User__c);
                    userData.put('staffStatus', staff.Status__c);
                    userData.put('staffActivatedDate', staff.LastModifiedDate);
                    userData.put('staffCreatedDate', staff.CreatedDate);
                } else {
                    // If no matching staff record, set default null values
                    userData.put('staffName', null);
                    userData.put('staffGender', null);
                    userData.put('staffFacility', null);
                    userData.put('staffRole', null);
                    userData.put('staffType', null);
                    userData.put('staffStatus', null);
                    userData.put('staffActivatedDate', null);
                    userData.put('staffCreatedDate', null);
                }
                system.debug('userData==>'+userData);                      
                combinedData.add(userData);
                System.debug('Combined Data: ' + combinedData);  
            }
            
            System.debug('Combined Data: ' + combinedData);
            return combinedData;
            
        } catch (Exception e) {
            System.debug('Error in getUserAccessDetails: ' + e.getMessage());
            throw new AuraHandledException('Error retrieving user access details: ' + e.getMessage());
        }
    }    
    
    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getUserAccessDetailsforresetPassword(String userId) {
        System.debug('UserId====>' + userId);
        
        // Step 1: Query the current user record based on the provided userId
        User currentUser = [
            SELECT Id, Organization_Name__c 
            FROM User 
            WHERE Id = :userId 
            LIMIT 1
        ];
        System.debug('Current User====>' + currentUser);
        
        // Step 2: Query related users based on the same Organization_Name__c
        List<User> relatedUsers = [
            SELECT Id, Name, Email, IsActive, Organization_Name__c, User_Type__c, User_Role__c
            FROM User
            WHERE Organization_Name__c = :currentUser.Organization_Name__c
            AND Id != :userId
        ];
        System.debug('Related Users====>' + relatedUsers);
        
        // Step 3: Query for staff records
        List<Staff__c> staffList = [
            SELECT Id, Name, Gender__c, Facility__c, Facility__r.Name, Email_Address__c,User_Role__c, 
            Role__c, Type_of_User__c, Status__c, Activated_Deactivated_Date__c, CreatedDate
            FROM Staff__c
        ];
        System.debug('Staff List====>' + staffList);
        
        // Step 4: Create a map for staff records based on their email addresses
        Map<String, Staff__c> staffMap = new Map<String, Staff__c>();
        for (Staff__c staff : staffList) {
            if (staff.Email_Address__c != null) {
                staffMap.put(staff.Email_Address__c, staff);
            }
        }
        
        // Step 5: Combine User and Staff data
        List<Map<String, Object>> combinedData = new List<Map<String, Object>>();
        for (User user : relatedUsers) {    
            Map<String, Object> userData = new Map<String, Object>(); 
            userData.put('userId', user.Id);
            userData.put('userName', user.Name);
            userData.put('userEmail', user.Email); 
            userData.put('userIsActive', user.IsActive);
            userData.put('userType', user.User_Type__c);
            userData.put('userRole', user.User_Role__c); 
            userData.put('userStatus', user.IsActive ? 'Active' : 'Inactive'); 
            if (staffMap.containsKey(user.Email)) {
                Staff__c staff = staffMap.get(user.Email);
                userData.put('staffName', staff.Name);
                userData.put('staffGender', staff.Gender__c); 
                userData.put('staffFacility', staff.Facility__r != null ? staff.Facility__r.Name : null); 
                userData.put('staffRole', staff.Role__c);
                userData.put('staffType', staff.Type_of_User__c); 
                userData.put('staffStatus', staff.Status__c);  
                userData.put('staffActivatedDate', staff.Activated_Deactivated_Date__c); 
                userData.put('staffCreatedDate', staff.CreatedDate);
            } else {
                // If no matching staff record, set fields to null
                userData.put('staffName', null);
                userData.put('staffGender', null);
                userData.put('staffFacility', null);
                userData.put('staffRole', null);
                userData.put('staffType', null);
                userData.put('staffStatus', null);
                userData.put('staffActivatedDate', null);
                userData.put('staffCreatedDate', null);
            }
            
            System.debug('User Data====>' + userData);
            combinedData.add(userData);
        }
        
        System.debug('Combined Data====>' + combinedData);
        
        // Step 6: Return the combined data
        return combinedData;
    }
    
    @AuraEnabled
    public static void updateUserModuleNames(List<String> userIds, String modules) {
        try {
            System.debug('Received User IDs: ' + userIds);
            System.debug('Modules to update: ' + modules);
            
            if (userIds == null || userIds.isEmpty() || String.isBlank(modules)) {
                throw new AuraHandledException('User IDs or Modules cannot be empty.');
            }
            
            // Fetch all Users based on userIds
            Map<String, User> userMap = new Map<String, User>(
                [SELECT Id, Email FROM User WHERE Id IN :userIds]
            );
            System.debug('userMap ' + userMap);
            
            if (userMap.isEmpty()) {
                throw new AuraHandledException('No users found for provided IDs.');
            }
            
            // ✅ Extract emails from Users into a Set
            Set<String> userEmails = new Set<String>();
            for (User u : userMap.values()) {
                if (u.Email != null) {
                    userEmails.add(u.Email);
                }
            }
            System.debug('userEmails ' + userEmails);
            
            if (userEmails.isEmpty()) {
                throw new AuraHandledException('No valid emails found for provided Users.');
            }
            
            // Fetch related Staff__c records based on User Emails
            List<Staff__c> staffRecords = [
                SELECT Id, Email_Address__c, Module_Names__c 
                FROM Staff__c 
                WHERE Email_Address__c IN :userEmails
            ];
            System.debug('staffRecords ' + staffRecords);
            
            if (staffRecords.isEmpty()) {
                throw new AuraHandledException('No matching staff records found.');
            }
            
            // ✅ Create a list to store updated records
            List<Staff__c> staffToUpdate = new List<Staff__c>();
            
            // Modify the staff records and add them to the update list
            for (Staff__c staff : staffRecords) {
                system.debug('Staff Id====>'+staff.Id);
                staff.Module_Names__c = modules;
                staffToUpdate.add(staff);  // ✅ Add modified record to list
            }
            
            // ✅ Perform a single update for all modified records
            if (!staffToUpdate.isEmpty()) {
                system.debug('staffToUpdate==>'+staffToUpdate);
                update staffToUpdate;  // ✅ Bulk DML Operation
            }
            
            System.debug('Modules updated successfully for users: ' + staffToUpdate[0].Id);
            
        } catch (Exception e) {
            //throw new AuraHandledException('Error updating user modules: ' + e.getMessage());
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getUserModules(List<String> userIds) {
        try {
            List<Map<String, Object>> result = new List<Map<String, Object>>();
            system.debug('userIds====>' + userIds);
            
            // Fetch all Users
            List<User> users = [SELECT Id, User_Type__c,Type_of_User__c, Email FROM User WHERE Id IN :userIds];
            
            if (users.isEmpty()) {
                return result; // Return empty if no users found
            }
            
            // Extract user emails and map them to user type
            Map<String, String> userEmailToTypeMap = new Map<String, String>();
            for (User u : users) {
                if (u.Email != null) {
                    userEmailToTypeMap.put(u.Email, u.User_Type__c);
                }
            }
            
            // Fetch Staff records based on emails
            List<Staff__c> staffRecords = [
                SELECT Id, Email_Address__c, Module_Names__c 
                FROM Staff__c 
                WHERE Email_Address__c IN :userEmailToTypeMap.keySet()
            ];
            
            // Process results
            for (User u : users) {
                Map<String, Object> userMap = new Map<String, Object>();
                userMap.put('UserType', u.User_Type__c);
                userMap.put('TypeofUser', u.Type_of_User__c);
                
                // Get module names for the user's email
                List<String> modules = new List<String>();
                List<String> userType = new List<String>();
                List<String> TypeofUser = new List<String>();
                for (Staff__c staff : staffRecords) {
                    if (staff.Email_Address__c == u.Email && staff.Module_Names__c != null) {
                        modules.addAll(staff.Module_Names__c.split(';'));
                        userType.add(u.User_Type__c);
                        TypeofUser.add(u.Type_of_User__c);
                    }
                }
                userMap.put('Modules', modules);
                userMap.put('userTypeInModules', userType);
                userMap.put('TypeofUserInModules', TypeofUser);
                result.add(userMap);
            }
            
            system.debug('Result====>' + result);
            return result;
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching user modules: ' + e.getMessage());
        }
    }
    
    @AuraEnabled
    public static void updateUserModuleNames1(String staffId, String modules) {
        try {
            System.debug('Received Staff ID: ' + staffId);
            System.debug('Modules to update: ' + modules);
            
            if (String.isBlank(staffId) || String.isBlank(modules)) {
                throw new AuraHandledException('Staff ID or Modules cannot be empty.');
            }
            
            // Fetch the Staff record
            Staff__c staffRecord = [
                SELECT Id, Module_Names__c 
                FROM Staff__c 
                WHERE Id = :staffId
                LIMIT 1
            ];
            System.debug('Staff Record Found: ' + staffRecord);
            
            // Update the Module_Names__c field
            staffRecord.Module_Names__c = modules;
            
            // Perform the update
            update staffRecord;
            
            System.debug('Modules updated successfully for Staff ID: ' + staffRecord.Id);
            
        } catch (Exception e) {
            //throw new AuraHandledException('Error updating staff modules: ' + e.getMessage());
        }
    }
    
    @AuraEnabled
    public static Staff__c getstaffId(String userId){
        User user = [SELECT Id, Email FROM User WHERE Id = :userId LIMIT 1];
        
        List<Staff__c> staffList = [ SELECT Id,NameToDisplay__c, Email_Address__c,Facility__c, Facility__r.Name FROM Staff__c WHERE Email_Address__c = :user.Email LIMIT 1];
        
        return staffList[0];
        
    }

    
    @AuraEnabled
public static String resetPortalPassword(String ResetpasswordUserId) {
    try {
        System.debug('ResetpasswordUserId====>' + ResetpasswordUserId);
        
        // Ensure the provided Id is a valid User
        User userRecord = [
            SELECT Id, IsPortalEnabled, Email 
            FROM User 
            WHERE Id = :ResetpasswordUserId 
            LIMIT 1
        ];
        
        System.debug('User Email: ' + userRecord.Email);
        
        // Query Staff records where the email matches
        List<Staff__c> staffList = [
            SELECT Id, Send_Password_Reset__c, Email_Address__c 
            FROM Staff__c 
            WHERE Email_Address__c = :userRecord.Email
        ];
        
        if (!staffList.isEmpty()) {
            for (Staff__c staffRecord : staffList) {
                staffRecord.Send_Password_Reset__c = true; // Set the field value
            }
            
            // Perform DML update to persist changes
            update staffList;
            
            // CALL THE BATCH JOB - IT WILL RUN IN SYSTEM CONTEXT
            SendPasswordResetBatch batchJob = new SendPasswordResetBatch();
            Database.executeBatch(batchJob, 1); // Runs in system context automatically
            
            System.debug('Updated Send_Password_Reset__c and started batch job in system context');
            return 'Password reset process initiated. Batch job started.';
            
        } else {
            System.debug('No matching Staff record found for Email: ' + userRecord.Email);
            return 'No matching Staff record found for the User Email.';
        }
    } catch (Exception e) {
        System.debug('Error in resetPortalPassword: ' + e.getMessage());
        return 'Error occurred: ' + e.getMessage();
    }
}
    
    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getUserAccessDetailsforAccessManager1(
        String userId,
        Id facilityId
    ) {
        try {
            String currentUserId = UserInfo.getUserId();

            // -------------------------------------------------
            // 1️⃣ Fetch current logged-in user
            // -------------------------------------------------
            User currentUser = [
                SELECT Id, Organization_Name__c, User_Type__c
                FROM User
                WHERE Id = :currentUserId
                LIMIT 1
            ];

            // -------------------------------------------------
            // 2️⃣ Get all users in same organization
            // -------------------------------------------------
            List<User> users = [
                SELECT Id, FirstName, LastName, Email, IsActive,
                    Organization_Name__c, User_Type__c, User_Role__c, Username
                FROM User
                WHERE Organization_Name__c = :currentUser.Organization_Name__c
                AND Email != null
            ];

            // -------------------------------------------------
            // 3️⃣ Build email set
            // -------------------------------------------------
            Set<String> userEmails = new Set<String>();
            for (User u : users) {
                userEmails.add(u.Email);
            }

            // -------------------------------------------------
            // 4️⃣ Query Staff using Staff_Facility__c (child)
            // -------------------------------------------------
            List<Staff__c> staffList = [
                SELECT
                    Id,
                    Name,
                    Last_Name__c,
                    Gender__c,
                    Display_Nickname__c,
                    Email_Address__c,
                    Role__c,
                    Type_of_User__c,
                    Status__c,
                    User_Type__c,
                    User_Role__c,
                    Activated_Deactivated_Date__c,
                    CreatedDate,
                    (
                        SELECT Id, Facility__c, Facility__r.Name
                        FROM Staff_Facilities__r
                        WHERE Active__c = true
                        AND Facility__c = :facilityId
                        LIMIT 1
                    )
                FROM Staff__c
                WHERE Email_Address__c IN :userEmails
                AND Id IN (
                    SELECT Staff__c
                    FROM Staff_Facility__c
                    WHERE Active__c = true
                    AND Facility__c = :facilityId
                )
            ];

            // -------------------------------------------------
            // 5️⃣ Build Staff map by email
            // -------------------------------------------------
            Map<String, Staff__c> staffMap = new Map<String, Staff__c>();
            for (Staff__c staff : staffList) {
                if (staff.Email_Address__c != null) {
                    staffMap.put(staff.Email_Address__c, staff);
                }
            }

            // -------------------------------------------------
            // 6️⃣ Merge User + Staff data
            // -------------------------------------------------
            List<Map<String, Object>> combinedData = new List<Map<String, Object>>();

            for (User user : users) {

                if (!staffMap.containsKey(user.Email)) {
                    continue;
                }

                Staff__c staff = staffMap.get(user.Email);

                Map<String, Object> userData = new Map<String, Object>();

                // User info
                userData.put('userId', user.Id);
                userData.put('firstName', user.FirstName);
                userData.put('lastName', user.LastName);
                userData.put('userEmail', user.Email);
                userData.put('userIsActive', user.IsActive);
                userData.put('userType', user.User_Type__c);
                userData.put('userStatus', user.IsActive ? 'Active' : 'Inactive');
                userData.put('userRole', mapRole(user.User_Role__c));

                // Facility access logic
                String userType = user.User_Type__c;
                String currentUserType = currentUser.User_Type__c;

                Boolean isFacilityAccess =
                    userType == 'NDIS Org Admin' ||
                    userType == 'ICT Admin' ||
                    userType == 'ICT Staff' ||
                    userType == 'NDIS Staff' ||
                    (
                        currentUserType == 'Facility Admin' &&
                        (
                            userType == 'Facility Admin' ||
                            userType == 'NDIS Org Admin' ||
                            userType == 'ICT Admin'
                        )
                    );

                userData.put('isFacilityAccess', isFacilityAccess);

                // -------------------------------------------------
                // Staff info
                // -------------------------------------------------
                userData.put('staffId', staff.Id);
                userData.put(
                    'staffName',
                    staff.Name + ' ' + (staff.Last_Name__c != null ? staff.Last_Name__c : '')
                );
                userData.put('staffNickName', staff.Display_Nickname__c);
                userData.put('staffGender', staff.Gender__c);
                userData.put('staffType', staff.Type_of_User__c);
                userData.put('staffUserType', staff.User_Type__c);
                userData.put('staffEmail', staff.Email_Address__c);
                userData.put('staffActivatedDate', staff.Activated_Deactivated_Date__c);
                userData.put('staffCreatedDate', staff.CreatedDate);
                userData.put('staffUserRole', mapRole(staff.User_Role__c));
                userData.put('staffStatus', String.valueOf(staff.Status__c));

                // -------------------------------------------------
                // Facility info (from child relationship)
                // -------------------------------------------------
                String facilityName;
                Id staffFacilityId;

                if (staff.Staff_Facilities__r != null && !staff.Staff_Facilities__r.isEmpty()) {
                    Staff_Facility__c sf = staff.Staff_Facilities__r[0];
                    facilityName = sf.Facility__r != null ? sf.Facility__r.Name : null;
                    staffFacilityId = sf.Facility__c;
                }

                userData.put('staffFacility', facilityName);
                userData.put('staffFacilityId', staffFacilityId);

                combinedData.add(userData);
            }

            return combinedData;

        } catch (Exception e) {
            System.debug('❌ Error in getUserAccessDetailsforAccessManager1: ' + e.getMessage());
            throw new AuraHandledException(
                'Error retrieving user access details: ' + e.getMessage()
            );
        }
    }

    
    // Utility method to map technical role names to friendly labels
    private static String mapRole(String role) {
        if (role == null) return '';
        if (role == 'Portal account partner Executive') return 'Org Admin';
        if (role == 'Portal account partner Manager') return 'Roster Admin';
        if (role == 'Portal account partner User') return 'Staff';
        return role;
    }
    
    
    @AuraEnabled(cacheable=true)
    public static String getUserOrgName() {
        return [SELECT Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()].Organization_Name__c;
    }
    
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getStaffEmailAndModules(String userId) {
        system.debug('userId ===> ' + userId);
        
        Map<String, Object> resultMap = new Map<String, Object>();
        
        try {
            
            // Fetch user email based on userId
            List<User> users = [SELECT Id, Email FROM User WHERE Id = :userId LIMIT 1];
            
            if (users.isEmpty()) {
                resultMap.put('error', 'No user found with the given ID.');
                return resultMap;
            }
            
            String userEmailFromRecord = users[0].Email;
            system.debug('Fetched User Email ===> ' + userEmailFromRecord);
            
            // Fetch Staff record
            List<Staff__c> staffList = [SELECT Id, Email_Address__c, Module_Names__c 
                                        FROM Staff__c 
                                        WHERE Email_Address__c = :userEmailFromRecord 
                                        LIMIT 1];
            
            if (staffList.isEmpty()) {
                resultMap.put('error', 'No staff record found for the given email.');
                return resultMap;
            }
            
            Staff__c staffUser = staffList[0];
            resultMap.put('staffEmail', staffUser.Email_Address__c);
            resultMap.put('modules', staffUser.Module_Names__c);
            
            system.debug('StaffId ===> ' + staffUser.Id);
            system.debug('Modules ===> ' + staffUser.Module_Names__c);
        } catch (Exception e) {
            resultMap.put('error', 'Error fetching staff details: ' + e.getMessage());
            system.debug('Error: ' + e.getMessage());
        }
        
        return resultMap;
    }
    
    /*@AuraEnabled(cacheable=true)
    public static Map<String, Object> getStaffDetails(Id staffId) {
        try {
            Map<String, Object> response = new Map<String, Object>();
            
            // Fetch Staff details
            Staff__c staff = [SELECT Id, Name, Last_Name__c, Email_Address__c, Contact_Number__c, 
                              User_Role__c, Facility__c,Status__c 
                              FROM Staff__c WHERE Id = :staffId LIMIT 1];
            
            response.put('staff', staff);
            
            // Fetch User based on Staff Email
            if (staff.Email_Address__c != null) {
                List<User> users = [SELECT Id, FirstName, LastName, Email, Username, Profile.Name,IsActive,User_Type__c,User_Role__c 
                                    FROM User WHERE Email = :staff.Email_Address__c LIMIT 1];
                
                if (!users.isEmpty()) {
                    response.put('user', users[0]);
                } else {
                    response.put('user', null);
                }
            } else {
                response.put('user', null);
            }
            
            return response;
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching staff and user details: ' + e.getMessage());
        }
    }*/

    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getStaffDetails(Id staffId) {
        try {
            Map<String, Object> response = new Map<String, Object>();
            
            // Fetch Staff details
            Staff__c staff = [
                SELECT Id, Name, Last_Name__c, Email_Address__c, Contact_Number__c, 
                    User_Role__c, Facility__c, Status__c 
                FROM Staff__c 
                WHERE Id = :staffId 
                LIMIT 1
            ];
            response.put('staff', staff);
            
            // Fetch User based on Staff Email
            if (staff.Email_Address__c != null) {
                
                // Step 1: Get all Users with same email
                List<User> users = [
                    SELECT Id, FirstName, LastName, Email, Username, Profile.Name, 
                        IsActive, User_Type__c, User_Role__c 
                    FROM User 
                    WHERE Email = :staff.Email_Address__c
                ];
                
                // Step 2: If only one user exists, return it
                if (users.size() == 1) {
                    response.put('user', users[0]);
                }
                // Step 3: If more than one exists, return the one with IsActive = TRUE
                else if (users.size() > 1) {
                    User activeUser = null;
                    for (User u : users) {
                        if (u.IsActive) {
                            activeUser = u;
                            break;
                        }
                    }
                    response.put('user', activeUser); // null if no active user found
                } 
                else {
                    response.put('user', null);
                }
            } else {
                response.put('user', null);
            }

            return response;
            
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching staff and user details: ' + e.getMessage());
        }
    }

    
    @AuraEnabled(cacheable=true)
    public static Staff__c getstaffId1(String userId){
        User user = [SELECT Id, Email FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
        
        List<Staff__c> staffList = [ SELECT Id,Name, Last_Name__c, Facility__c, Facility__r.Name, Email_Address__c, User_Type__c FROM Staff__c WHERE Email_Address__c = :user.Email LIMIT 1];
        
        return staffList[0];
        
    }
    
    public class StaffWrapper {
        @AuraEnabled public Staff__c staff;
        @AuraEnabled public String typeOfUser;
        @AuraEnabled public String Usertype;
        @AuraEnabled public Boolean setHoursAccess;
    }
    
    @AuraEnabled(cacheable=true)
    public static StaffWrapper getstaffId2(String userId){
        User user = [SELECT Id, Type_of_User__c,User_Type__c, Email, Set_Hours_Access__c FROM User WHERE Id = :userId LIMIT 1];
        
        List<Staff__c> staffList = [
            SELECT Id, Name, Last_Name__c, Facility__c, Facility__r.Name, Email_Address__c, User_Type__c
            FROM Staff__c 
            WHERE Email_Address__c = :user.Email 
            LIMIT 1
        ];
        
        StaffWrapper result = new StaffWrapper();
        result.staff = staffList.isEmpty() ? null : staffList[0];
        result.typeOfUser = user.Type_of_User__c;
        result.Usertype = user.User_Type__c;
        result.setHoursAccess = user.Set_Hours_Access__c;
        
        return result;
    }
    
    @AuraEnabled(cacheable=true)
    public static Staff__c getstaffId3() {
        // Get current user info
        User user = [
            SELECT Id, Type_of_User__c, User_Type__c, Email
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];
        
        // Query Staff__c record using Email_Address__c (matching user's email)
        Staff__c staffRecord = [
            SELECT Id, User__c, Facility__c, Email_Address__c,Display_Nickname__c,
            Facility__r.Name,Facility__r.Facility_Preferred_Name_Formula__c,Facility__r.Participant_Preferred_Name_Formla__c,(Select  Id,Facility__c,Facility__r.Name, Active__c,Staff__c,Facility__r.Facility_Preferred_Name_Formula__c,Facility__r.Participant_Preferred_Name_Formla__c from Staff_Facilities__r WHERE Active__c = true )
            FROM Staff__c
            WHERE Email_Address__c = :user.Email
            LIMIT 1
        ];
        
        return staffRecord;
    }
    
    
    @AuraEnabled
    public static user getCurrentLoggedUserInfo(){
        User user = [SELECT Id,User_Type__c,User_Role__c,Participant_Type__c,Type_of_User__c,Enable_Logs__c, Email,CreatedById,Facility_Name__c FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
        return user;
        
    } 
    
    @AuraEnabled
    public static String updateStaffDetails(Map<String, String> userDetails) {
        System.debug('🚀 updateStaffDetails CALLED with => ' + JSON.serializePretty(userDetails));

        try {
            // 1️⃣ Validate Staff Id
            if (!userDetails.containsKey('staffId')) {
                System.debug('❌ Missing staffId in userDetails map.');
                throw new AuraHandledException('Error: staffId is missing.');
            }

            String staffId = userDetails.get('staffId');
            System.debug('🆔 Staff ID => ' + staffId);

            // 2️⃣ Fetch Staff Record
            Staff__c staffToUpdate = [
                SELECT Id, Status__c, Name, Last_Name__c, User_Role__c, User_Type__c, User_Update__c 
                FROM Staff__c 
                WHERE Id = :staffId 
                LIMIT 1
            ];
            System.debug('📋 Current Staff Record => ' + JSON.serializePretty(staffToUpdate));

            // 3️⃣ Track Old Values
            Map<String, Object> oldValues = new Map<String, Object>{
                'Name' => staffToUpdate.Name,
                'Last_Name__c' => staffToUpdate.Last_Name__c,
                'Status__c' => staffToUpdate.Status__c,
                'User_Role__c' => staffToUpdate.User_Role__c,
                'User_Type__c' => staffToUpdate.User_Type__c
            };

            // 4️⃣ Apply Updates
            if (userDetails.containsKey('firstName')) {
                staffToUpdate.Name = userDetails.get('firstName');
                System.debug('✏️ Updated Name => ' + staffToUpdate.Name);
            }
            if (userDetails.containsKey('lastName')) {
                staffToUpdate.Last_Name__c = userDetails.get('lastName');
                System.debug('✏️ Updated Last_Name__c => ' + staffToUpdate.Last_Name__c);
            }
            if (userDetails.containsKey('status')) {
                staffToUpdate.Status__c = Boolean.valueOf(userDetails.get('status'));
                System.debug('✏️ Updated Status__c => ' + staffToUpdate.Status__c);
            }
            if (userDetails.containsKey('role')) {
                staffToUpdate.User_Role__c = userDetails.get('role');
                System.debug('✏️ Updated User_Role__c => ' + staffToUpdate.User_Role__c);
            }
            if (userDetails.containsKey('userType')) {
                staffToUpdate.User_Type__c = userDetails.get('userType');
                System.debug('✏️ Updated User_Type__c => ' + staffToUpdate.User_Type__c);
            }

            staffToUpdate.User_Update__c = true;
            System.debug('✅ Marked User_Update__c => true');

            // 5️⃣ Save Changes
            update staffToUpdate;
            System.debug('💾 Staff Record Successfully Updated => ' + JSON.serializePretty(staffToUpdate));

            // 6️⃣ Log Changes
            for (String key : oldValues.keySet()) {
                System.debug(key + ': "' + oldValues.get(key) + '" ➡️ "' + staffToUpdate.get(key) + '"');
            }

            // 7️⃣ Run Batch Job
            System.debug('⚙️ Executing StaffToUserBatch...');
            StaffToUserBatch staffBatchJob = new StaffToUserBatch();
            Id batchJobId = Database.executeBatch(staffBatchJob, 1);
            System.debug('✅ StaffToUserBatch Queued Successfully — Job ID: ' + batchJobId);

            // ✅ Return Response JSON
            Map<String, Object> response = new Map<String, Object>{
                'status' => 'Success',
                'message' => 'Staff record updated and batch job started successfully.',
                'batchJobId' => batchJobId
            };

            System.debug('📤 Returning Response => ' + JSON.serializePretty(response));
            return JSON.serialize(response);

        } catch (Exception e) {
            System.debug('❌ Error updating staff record: ' + e.getMessage());
            System.debug('🧩 Stack Trace: ' + e.getStackTraceString());

            Map<String, Object> errorResponse = new Map<String, Object>{
                'status' => 'Error',
                'message' => e.getMessage()
            };
            return JSON.serialize(errorResponse);
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getStaffAccessDetails(
        String userId,
        Id facilityId
    ) {
        System.debug('UserId ====> ' + userId);
        System.debug('FacilityId ====> ' + facilityId);

        String currentUserId = UserInfo.getUserId();

        // -------------------------------------------------
        // 1️⃣ Current logged-in user
        // -------------------------------------------------
        User currentUser = [
            SELECT Id, Organization_Name__c
            FROM User
            WHERE Id = :currentUserId
            LIMIT 1
        ];

        // -------------------------------------------------
        // 2️⃣ Organisation lookup
        // -------------------------------------------------
        Organisation__c org = [
            SELECT Id
            FROM Organisation__c
            WHERE Name = :currentUser.Organization_Name__c
            LIMIT 1
        ];

        String truncatedOrgId = String.valueOf(org.Id).substring(0, 15);

        // -------------------------------------------------
        // 3️⃣ Query Users in same organisation
        // -------------------------------------------------
        List<User> allUsers = [
            SELECT Id, Email
            FROM User
            WHERE Email != null
            AND Organization_Name__c = :currentUser.Organization_Name__c
        ];

        Set<String> userEmails = new Set<String>();
        for (User u : allUsers) {
            userEmails.add(u.Email);
        }

        // -------------------------------------------------
        // 4️⃣ Query Staff using Staff_Facilities__r (CHILD)
        // -------------------------------------------------
        List<Staff__c> allStaff = [
            SELECT
                Id,
                Name,
                Last_Name__c,
                Portal_User_Error__c,
                Gender__c,
                Email_Address__c,
                Display_Nickname__c,
                Role__c,
                Type_of_User__c,
                Status__c,
                Activated_Deactivated_Date__c,
                CreatedDate,
                Organization_Full_Name__c,
                (
                    SELECT Id, Facility__c, Facility__r.Name
                    FROM Staff_Facilities__r
                    WHERE Active__c = true
                    AND Facility__c = :facilityId
                    LIMIT 1
                )
            FROM Staff__c
            WHERE Email_Address__c != null
            AND Organization_Name__c = :truncatedOrgId
            AND Id IN (
                SELECT Staff__c
                FROM Staff_Facility__c
                WHERE Active__c = true
                AND Facility__c = :facilityId
            )
        ];

        // -------------------------------------------------
        // 5️⃣ Collect Staff without matching User
        // -------------------------------------------------
        List<Map<String, Object>> nonMatchingStaff = new List<Map<String, Object>>();

        for (Staff__c staff : allStaff) {

            if (userEmails.contains(staff.Email_Address__c)) {
                continue;
            }

            Map<String, Object> staffData = new Map<String, Object>();

            String staffStatus = staff.Status__c ? 'Active' : 'Inactive';

            // Facility info from child
            String facilityName;
            Id staffFacilityId;

            if (staff.Staff_Facilities__r != null && !staff.Staff_Facilities__r.isEmpty()) {
                Staff_Facility__c sf = staff.Staff_Facilities__r[0];
                staffFacilityId = sf.Facility__c;
                facilityName = sf.Facility__r != null ? sf.Facility__r.Name : null;
            }

            staffData.put('staffId', staff.Id);
            staffData.put('staffName', staff.Name + ' ' + staff.Last_Name__c);
            staffData.put('firstName', staff.Name);
            staffData.put('lastName', staff.Last_Name__c);
            staffData.put('staffNickName', staff.Display_Nickname__c);
            staffData.put('staffOrgName', staff.Organization_Full_Name__c);
            staffData.put('staffGender', staff.Gender__c);
            staffData.put('staffFacility', facilityName);
            staffData.put('staffFacilityId', staffFacilityId);
            staffData.put('staffEmail', staff.Email_Address__c);
            staffData.put('staffError', staff.Portal_User_Error__c);
            staffData.put('staffRole', staff.Role__c);
            staffData.put('staffType', staff.Type_of_User__c);
            staffData.put('staffStatus', staffStatus);
            staffData.put('staffActivatedDate', staff.Activated_Deactivated_Date__c);
            staffData.put('staffCreatedDate', staff.CreatedDate);

            nonMatchingStaff.add(staffData);
        }

        System.debug('Final Non-Matching Staff Count ==> ' + nonMatchingStaff.size());

        return nonMatchingStaff;
    }

    
    @AuraEnabled(cacheable=true)
    public static String getSelectedStaffDetails(Id staffId1) {
        System.debug('Staff ID: ' + staffId1);
        
        Staff__c staffRecord = [
            SELECT Id, Name, Name__c, Last_Name__c, Gender__c, Facility__c, Facility__r.Name, Email_Address__c, 
            User_Role__c, Role__c, Type_of_User__c, Status__c, Activated_Deactivated_Date__c, 
            CreatedDate,Address__c, Organization_Full_Name__c
            FROM Staff__c
            WHERE Email_Address__c != NULL AND Id = :staffId1
            LIMIT 1
        ];
        
        System.debug('Query to Return: ' + staffRecord);
        
        return JSON.serialize(staffRecord);
    }
    
    @AuraEnabled
    public static String saveStaffDetails(Map<String, String> staffDetails) {
        String currentUserId = UserInfo.getUserId();
    
        try {
            // Fetch org defaults
            User userOrgName = [
                SELECT Id, Organization_Name__c, TimeZoneSidKey, LocaleSidKey, EmailEncodingKey, LanguageLocaleKey 
                FROM User 
                WHERE Id = :currentUserId 
                LIMIT 1
            ];
    
            // Check if contact with same email exists
            List<Contact> contEmail = [
                SELECT Id, Email, Portal_User_Created__c 
                FROM Contact 
                WHERE Email = :staffDetails.get('email') 
                LIMIT 1
            ];
            System.debug('contEmail ===> ' + contEmail);
    
            // Fetch Portal Account
            Account portalAcc = [
                SELECT Id 
                FROM Account 
                WHERE Name = 'Portal Account' 
                LIMIT 1
            ];
    
            // CASE 1: No Contact → Create new Contact + Staff
            if (contEmail.isEmpty()) {
                System.debug('No existing contact found. Creating new contact…');
    
                Contact contact = new Contact(
                    LastName = staffDetails.get('lastName'),
                    FirstName = staffDetails.get('firstName'),
                    Email = staffDetails.get('email'),
                    AccountId = portalAcc.Id,
                    MailingStreet = staffDetails.get('street'),
                    MailingCity  = staffDetails.get('city'),
                    MailingState = staffDetails.get('state'),
                    MailingPostalCode = staffDetails.get('postalCode'),
                    MailingCountry  = staffDetails.get('country'),
                    Portal_User_Created__c = true
                );
                insert contact;
    
                Staff__c staff = new Staff__c(
                    Id = staffDetails.get('staffId'),
                    Email_Address__c = staffDetails.get('email'),
                    User_Role__c = staffDetails.get('role'),
                    User_Type__c = staffDetails.get('userType'),
                    TimeZoneSidKey__c = userOrgName.TimeZoneSidKey,
                    LocaleSidKey__c = userOrgName.LocaleSidKey,
                    EmailEncodingKey__c = userOrgName.EmailEncodingKey,
                    LanguageLocaleKey__c = userOrgName.LanguageLocaleKey
                );
                upsert staff;
            }
    
            // CASE 2: Contact exists → Update Portal_User_Created__c to true
            else {
                System.debug('Existing contact found. Updating Portal_User_Created__c…');
    
                Contact existingContact = contEmail[0];
                existingContact.Portal_User_Created__c = true;
                update existingContact;
    
                // Also update staff if needed
                Staff__c staffToUpdate = new Staff__c(
                    Id = staffDetails.get('staffId'),
                    User_Role__c = staffDetails.get('role'),
                    User_Type__c = staffDetails.get('userType'),
                    TimeZoneSidKey__c = userOrgName.TimeZoneSidKey,
                    LocaleSidKey__c = userOrgName.LocaleSidKey,
                    EmailEncodingKey__c = userOrgName.EmailEncodingKey,
                    LanguageLocaleKey__c = userOrgName.LanguageLocaleKey
                );
                upsert staffToUpdate;
            }
    
            // Run batch to create Portal User
            if (!Test.isRunningTest()) {
                CreateUsersBatch createUser = new CreateUsersBatch();
                Database.executeBatch(createUser, 1);
            }
    
            return 'Success';
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

}