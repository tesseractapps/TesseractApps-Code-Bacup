public without sharing class TsignUserManagementController {

    @AuraEnabled
    public static List<UserWrapper> getUserList(String searchKey) {
        String key = String.isBlank(searchKey) ? '%' : '%' + searchKey.trim() + '%';

        List<UserWrapper> results = new List<UserWrapper>();

        // -------------------------------------------------
        // 1️⃣ Current logged-in user
        // -------------------------------------------------
        User currentUser = [
            SELECT Id, Organization_Name__c, User_Type__c, TSign_Org_Id__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        System.debug('👤 Current User Details: ' + currentUser);

        // -------------------------------------------------
        // 2️⃣ All users in same TSign org
        // -------------------------------------------------
        List<User> users = [
            SELECT Id, FirstName, LastName, Email, IsActive, TSign_Org_Id__c,
                Organization_Name__c, User_Type__c, User_Role__c, Username
            FROM User
            WHERE TSign_Org_Id__c = :currentUser.TSign_Org_Id__c
            AND Email != null
        ];

        System.debug('👥 Total Users Fetched: ' + users.size());

        if (users.isEmpty()) {
            return results;
        }

        // -------------------------------------------------
        // 3️⃣ Build email set
        // -------------------------------------------------
        Set<String> userEmails = new Set<String>();
        for (User u : users) {
            userEmails.add(u.Email);
        }

        System.debug('📧 User Emails Set Size: ' + userEmails.size());

        // -------------------------------------------------
        // 4️⃣ Query Staff by same emails
        // -------------------------------------------------
        List<TSign_Staff__c> staffList = [
            SELECT Id,  Address__c, Address__Street__s, Address__City__s, Address__StateCode__s, Address__PostalCode__s, Address__CountryCode__s,Display_Nickname__c, Email__c, First_Name__c, Last_Name__c, Phone__c, Status__c, User_Role__c, User_Type__c, Module_Access__c,  CreatedDate,Profile_Pic_File_Name__c,Profile_Pic_Key__c,Profile_Pic_Size__c,Profile_Pic_URL__c
            FROM TSign_Staff__c
            WHERE Email__c IN :userEmails
        ];

        System.debug('👨‍💼 Staff Records Found: ' + staffList.size());

        // -------------------------------------------------
        // 4b️⃣ NEW — Resolve each staff's current facility
        // -------------------------------------------------
        Set<Id> staffIds = new Set<Id>();
        for (TSign_Staff__c s : staffList) {
            staffIds.add(s.Id);
        }

       // staffId -> List of facilities the staff belongs to
        Map<Id, List<TSign_Facility__c>> staffToFacilities = new Map<Id, List<TSign_Facility__c>>();

        if (!staffIds.isEmpty()) {
            List<TSign_Staff_Facility__c> links = [
                SELECT Id, TSign_Staff__c, TSign_Facility__c, TSign_Facility__r.Name
                FROM TSign_Staff_Facility__c
                WHERE TSign_Staff__c IN :staffIds AND   Active__c = true
            ];

            System.debug('🔗 Staff-Facility links found: ' + links.size());

            for (TSign_Staff_Facility__c link : links) {
                if (link.TSign_Facility__c == null) continue;

                TSign_Facility__c fac = new TSign_Facility__c(
                    Id   = link.TSign_Facility__c,
                    Name = link.TSign_Facility__r != null ? link.TSign_Facility__r.Name : null
                );

                if (!staffToFacilities.containsKey(link.TSign_Staff__c)) {
                    staffToFacilities.put(link.TSign_Staff__c, new List<TSign_Facility__c>());
                }
                staffToFacilities.get(link.TSign_Staff__c).add(fac);
            }

            System.debug('🗺️ Staff->Facilities map size: ' + staffToFacilities.size());
        }

        // -------------------------------------------------
        // 5️⃣ Build Staff map keyed by email
        // -------------------------------------------------
        Map<String, TSign_Staff__c> staffMap = new Map<String, TSign_Staff__c>();
        for (TSign_Staff__c staff : staffList) {
            if (staff.Email__c != null) {
                staffMap.put(staff.Email__c, staff);
            }
        }

        System.debug('🗺️ Staff Map Size: ' + staffMap.size());

        // -------------------------------------------------
        // 6️⃣ Merge User + Staff — ONLY when email matches
        // -------------------------------------------------
        for (User user : users) {

            if (!staffMap.containsKey(user.Email)) {
                System.debug('⏭ Skipping User (No matching staff): ' + user.Email);
                continue;
            }

            if (String.isNotBlank(searchKey)) {
                String haystack = (
                    (user.FirstName  == null ? '' : user.FirstName)  + ' ' +
                    (user.LastName   == null ? '' : user.LastName)   + ' ' +
                    (user.Email      == null ? '' : user.Email)
                ).toLowerCase();

                if (!haystack.contains(searchKey.trim().toLowerCase())) {
                    continue;
                }
            }

            TSign_Staff__c staff = staffMap.get(user.Email);

            UserWrapper w = new UserWrapper();

            // ---- User info ----
            w.userId     = user.Id;
            w.userEmail  = user.Email;
            w.userStatus = user.IsActive ? 'Active' : 'Inactive';
            w.isActive   = user.IsActive;

            // ---- Staff info ----
            w.staffId    = staff.Id;
            w.nickName   = staff.Display_Nickname__c;
            w.userPhone  = staff.Phone__c;
            w.firstName  = user.FirstName;
            w.lastName   = user.LastName;
            w.username   = user.Username;
            w.userType   = user.User_Type__c;
            w.street     = staff.Address__Street__s;
            w.city       = staff.Address__City__s;
            w.province   = staff.Address__StateCode__s;
            w.postalcode = staff.Address__PostalCode__s;
            w.country    = staff.Address__CountryCode__s;
            w.moduleAccess = staff.Module_Access__c;
            String firstName = staff.First_Name__c == null ? '' : staff.First_Name__c.trim();
            String lastName  = staff.Last_Name__c  == null ? '' : staff.Last_Name__c.trim();

            String combinedName = (firstName + ' ' + lastName).trim();
            w.nickName  = combinedName;
            w.profilePicUrl = staff.Profile_Pic_URL__c;
            w.profilePicSize   = staff.Profile_Pic_Size__c;
            w.profilePicKey    = staff.Profile_Pic_Key__c;
            w.ProfilefileName  = staff.Profile_Pic_File_Name__c;

            w.createdDate = staff.CreatedDate != null
                ? staff.CreatedDate.format('dd/MM/yyyy')
                : '';

            // ---- NEW — Facility ----
            // ---- Facilities (plural) ----
            List<TSign_Facility__c> facList = staffToFacilities.get(staff.Id);
            if (facList != null && !facList.isEmpty()) {
                // keep the "primary" (first) facility for existing UI code
                w.facilityId   = facList[0].Id;
                w.facilityName = facList[0].Name;

                // full list — used by JS filter
                w.facilityIds   = new List<String>();
                w.facilityNames = new List<String>();
                for (TSign_Facility__c f : facList) {
                    w.facilityIds.add(f.Id);
                    w.facilityNames.add(f.Name);
                }
            } else {
                w.facilityIds   = new List<String>();
                w.facilityNames = new List<String>();
            }
            System.debug('🏢 ' + user.Email + ' -> facilityId=' + w.facilityId
                + ', facilityName=' + w.facilityName);

            // ---- Facility access logic ----
            String userType        = user.User_Type__c;
            String currentUserType = currentUser.User_Type__c;
            w.isFacilityAccess =
                userType == 'NDIS Org Admin' ||
                userType == 'ICT Admin'      ||
                userType == 'ICT Staff'      ||
                userType == 'NDIS Staff'     ||
                (
                    currentUserType == 'Facility Admin' &&
                    (
                        userType == 'Facility Admin' ||
                        userType == 'NDIS Org Admin' ||
                        userType == 'ICT Admin'
                    )
                );

            results.add(w);
        }

        System.debug('📦 Final Results Size: ' + results.size());
        return results;
    }

    /* ---------------- WRAPPER ---------------- */
    public class UserWrapper {
        @AuraEnabled public String  userId           { get; set; }
        @AuraEnabled public String  staffId          { get; set; }
        @AuraEnabled public String  nickName         { get; set; }
        @AuraEnabled public String  userEmail        { get; set; }
        @AuraEnabled public String  userStatus       { get; set; }
        @AuraEnabled public String  userPhone        { get; set; }
        @AuraEnabled public String  createdDate      { get; set; }
        @AuraEnabled public Boolean isActive         { get; set; }
        @AuraEnabled public Boolean isFacilityAccess { get; set; }
        // new fields for the edit form
        @AuraEnabled public String  firstName        { get; set; }
        @AuraEnabled public String  lastName         { get; set; }
        @AuraEnabled public String  username         { get; set; }
        @AuraEnabled public String  userType         { get; set; }
        @AuraEnabled public String  facilityId       { get; set; }
        @AuraEnabled public String  facilityName     { get; set; }
        @AuraEnabled public String  street           { get; set; }
        @AuraEnabled public String  city             { get; set; }
        @AuraEnabled public String  province         { get; set; }
        @AuraEnabled public String  postalcode       { get; set; }
        @AuraEnabled public String  country          { get; set; }
        @AuraEnabled public String  moduleAccess     { get; set; }
        @AuraEnabled public String  profilePicUrl     { get; set; }
        @AuraEnabled public String  ProfilefileName   { get; set; }
        @AuraEnabled public String  profilePicSize    { get; set; }
        @AuraEnabled public String  profilePicKey     { get; set; }
    @AuraEnabled public List<String> facilityIds   { get; set; }
    @AuraEnabled public List<String> facilityNames { get; set; }
    }

    @AuraEnabled
	public static void resetPassword(String userId) {
		if (String.isBlank(userId)) {
			throw new AuraHandledException('User Id is required.');
		}
		try {
			// Sends Salesforce's standard "Reset Password" email to the user
			System.resetPassword(userId, true);
		} catch (Exception e) {
			throw new AuraHandledException('Failed to reset password: ' + e.getMessage());
		}
	}

    @AuraEnabled
    public static String getUserType() {
        List<User> currentUser = [
            SELECT Id, Organization_Name__c, User_Type__c, TSign_Org_Id__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];
        
        if (currentUser.isEmpty()) {
            return null;
        }
        return currentUser[0].User_Type__c;
    }

    @AuraEnabled
    public static List<TSign_Organisation__c> getOrg() {
        User currentUser = [
            SELECT Id, Organization_Name__c, User_Type__c, TSign_Org_Id__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        List<TSign_Organisation__c> orgList = [
            SELECT Id, Name, Account_Type__c,Market__c
            FROM TSign_Organisation__c
            WHERE Id = :currentUser.TSign_Org_Id__c
            LIMIT 1
        ];

        return orgList;
    }

    public class UpdateUserRequest {
        @AuraEnabled public String  staffId     { get; set; }
        @AuraEnabled public String  firstName   { get; set; }
        @AuraEnabled public String  lastName    { get; set; }
        @AuraEnabled public String  phone       { get; set; }
        @AuraEnabled public Boolean isActive    { get; set; }
        @AuraEnabled public String  userType    { get; set; }
        @AuraEnabled public Id      facilityId  { get; set; }
        // NEW — address
        @AuraEnabled public String  street      { get; set; }
        @AuraEnabled public String  city        { get; set; }
        @AuraEnabled public String  province    { get; set; }
        @AuraEnabled public String  postalcode  { get; set; }
        @AuraEnabled public String  country     { get; set; }
        @AuraEnabled public String  profilePicUrl     { get; set; }
        @AuraEnabled public String  ProfilefileName   { get; set; }
        @AuraEnabled public String  profilePicSize    { get; set; }
        @AuraEnabled public String  profilePicKey     { get; set; }
        @AuraEnabled public String   profilePicJson  { get; set; }
    }

    @AuraEnabled
    public static void updateUser(UpdateUserRequest request) {
        System.debug(LoggingLevel.INFO, 'updateUser: START');

        if (request == null || String.isBlank(request.staffId)) {
            System.debug(LoggingLevel.ERROR, 'updateUser: Validation failed - request or staffId is blank. request=' + request);
            throw new AuraHandledException('Staff Id is required.');
        }

        System.debug(LoggingLevel.DEBUG, 'updateUser: Incoming request => staffId=' + request.staffId
            + ', userType=' + request.userType
            + ', isActive=' + request.isActive
            + ', firstName=' + request.firstName
            + ', lastName=' + request.lastName
            + ', facilityId=' + request.facilityId);

        // --- Authorization: verify the running user is allowed to set this type ---
        User currentUser = [
            SELECT Id, User_Type__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];
        System.debug(LoggingLevel.DEBUG, 'updateUser: Running user => Id=' + currentUser.Id
            + ', User_Type__c=' + currentUser.User_Type__c);

        Map<String, Set<String>> allowedByCurrentType = new Map<String, Set<String>>{
            'T Sign Org Admin' => new Set<String>{ 'T Sign Org Admin', 'T Sign Manager', 'T Sign Staff' },
            'T Sign Manager'   => new Set<String>{ 'T Sign Manager', 'T Sign Staff' }
        };

        Set<String> allowed = allowedByCurrentType.get(currentUser.User_Type__c);
        System.debug(LoggingLevel.DEBUG, 'updateUser: Allowed user types for current user = ' + allowed);

        if (allowed == null || !allowed.contains(request.userType)) {
            System.debug(LoggingLevel.ERROR, 'updateUser: Authorization failed. Current user type "'
                + currentUser.User_Type__c + '" cannot assign user type "' + request.userType + '"');
            throw new AuraHandledException('You are not allowed to assign this user type.');
        }
        System.debug(LoggingLevel.INFO, 'updateUser: Authorization passed for userType=' + request.userType);

        // --- Locate the TSign_Staff__c record ---
        TSign_Staff__c staff = [
            SELECT Id, Status__c, User_Type__c, First_Name__c, Last_Name__c, Update_User__c, Email__c
            FROM TSign_Staff__c
            WHERE Id = :request.staffId
            LIMIT 1
        ];
        System.debug(LoggingLevel.DEBUG, 'updateUser: Found staff record => Id=' + staff.Id
            + ', Status__c=' + staff.Status__c
            + ', User_Type__c=' + staff.User_Type__c
            + ', First_Name__c=' + staff.First_Name__c
            + ', Last_Name__c=' + staff.Last_Name__c
            + ', Update_User__c=' + staff.Update_User__c
            + ', Email__c=' + staff.Email__c);

        staff.Status__c      = request.isActive;
        staff.User_Type__c   = request.userType;
        staff.First_Name__c  = request.firstName;
        staff.Last_Name__c   = request.lastName;
        staff.Phone__c       = request.phone; 
        staff.Update_User__c = true;
        staff.Address__Street__s     = request.street;
        staff.Address__City__s       = request.city;
        staff.Address__StateCode__s  = request.province;
        staff.Address__PostalCode__s = request.postalcode;
        staff.Address__CountryCode__s = request.country;
        staff.Profile_Pic_URL__c       = request.profilePicUrl;
        staff.Profile_Pic_Size__c  = request.profilePicSize;
        staff.Profile_Pic_Key__c = request.profilePicKey;
        staff.Profile_Pic_File_Name__c = request.ProfilefileName;
        staff.Profile_Pic_JSON__c = request.profilePicJson;

        System.debug(LoggingLevel.DEBUG, 'updateUser: Updating staff => Status__c=' + staff.Status__c
            + ', User_Type__c=' + staff.User_Type__c
            + ', First_Name__c=' + staff.First_Name__c
            + ', Last_Name__c=' + staff.Last_Name__c
            + ', Update_User__c=' + staff.Update_User__c);

        update staff;
        System.debug(LoggingLevel.INFO, 'updateUser: Staff record updated successfully. Id=' + staff.Id);

        // --- Sync facility link (junction object) ---
        if (String.isNotBlank(request.facilityId)) {
            System.debug(LoggingLevel.DEBUG, 'updateUser: Processing facility link for facilityId=' + request.facilityId);

            // Find existing active link(s) for this staff
            List<TSign_Staff_Facility__c> existingLinks = [
                SELECT Id, TSign_Facility__c
                FROM TSign_Staff_Facility__c
                WHERE TSign_Staff__c = :request.staffId
            ];
            System.debug(LoggingLevel.DEBUG, 'updateUser: Existing facility links found = ' + existingLinks.size());

            Boolean alreadyLinked = false;
            for (TSign_Staff_Facility__c link : existingLinks) {
                System.debug(LoggingLevel.DEBUG, 'updateUser: Checking existing link Id=' + link.Id
                    + ', TSign_Facility__c=' + link.TSign_Facility__c);
                if (link.TSign_Facility__c == request.facilityId) {
                    alreadyLinked = true;
                    System.debug(LoggingLevel.DEBUG, 'updateUser: Staff already linked to facilityId=' + request.facilityId);
                    break;
                }
            }

            // Only insert if the link doesn't already exist (avoids duplicates)
            if (!alreadyLinked) {
                System.debug(LoggingLevel.INFO, 'updateUser: No existing link. Creating new TSign_Staff_Facility__c link.');
                TSign_Staff_Facility__c newLink = new TSign_Staff_Facility__c(
                    TSign_Staff__c    = request.staffId,
                    TSign_Facility__c = request.facilityId,
                    Active__c = true

                );
                insert newLink;
                System.debug(LoggingLevel.INFO, 'updateUser: New facility link inserted. Id=' + newLink.Id);
            }
        } else {
            System.debug(LoggingLevel.DEBUG, 'updateUser: facilityId is blank - skipping facility link sync.');
        }

        // ----- Sync TSign_Contact__c (Internal contact linked to the staff's facility) -----
        if (String.isNotBlank(request.facilityId)) {
            System.debug(LoggingLevel.DEBUG, 'updateUser: Syncing TSign_Contact__c for facilityId=' + request.facilityId);

            // CRUD pre-check
            if (!Schema.sObjectType.TSign_Contact__c.isUpdateable()) {
                throw new AuraHandledException(
                    'You do not have permission to update Contact records. Contact your administrator.'
                );
            }

            // Look up the existing internal contact(s) for this staff's email + facility
            List<TSign_Contact__c> existingContacts = [
                SELECT Id, First_Name__c, Last_Name__c, Email__c, Contact_Number__c,
                    Contact_Type__c, TSign_Facility__c, TSign_Organisation__c,
                    Address__Street__s, Address__City__s, Address__StateCode__s,
                    Address__PostalCode__s, Address__CountryCode__s
                FROM TSign_Contact__c
                WHERE Email__c = :staff.Email__c
                AND TSign_Facility__c = :request.facilityId
                LIMIT 1
            ];

            if (!existingContacts.isEmpty()) {
                TSign_Contact__c con = existingContacts[0];
                System.debug(LoggingLevel.DEBUG, 'updateUser: Found TSign_Contact__c Id=' + con.Id + ' — updating fields.');

                con.First_Name__c           = request.firstName;
                con.Last_Name__c            = request.lastName;
                con.Contact_Number__c       = request.phone;
                con.Address__Street__s      = request.street;
                con.Address__City__s        = request.city;
                con.Address__StateCode__s   = request.province;
                con.Address__PostalCode__s  = request.postalcode;
                con.Address__CountryCode__s = request.country; 
                con.Picture__c              = request.profilePicUrl;
                con.Profile_Pic_Key__c      = request.profilePicKey;
                con.Profile_Pic_File_Name__c = request.ProfilefileName;
               con.Profile_Pic_JSON__c       = request.profilePicJson;

                // Only force Contact_Type__c to Internal if it isn't already something else meaningful
            
                Database.SaveResult cr = Database.update(con, false);
                if (!cr.isSuccess()) {
                    throw new AuraHandledException(
                        'TSign Contact update failed: ' + cr.getErrors()[0].getMessage()
                    );
                }
                System.debug(LoggingLevel.INFO, 'updateUser: TSign_Contact__c updated. Id=' + con.Id);
            } else {
                System.debug(LoggingLevel.DEBUG,
                    'updateUser: No TSign_Contact__c found for email=' + staff.Email__c
                    + ' and facilityId=' + request.facilityId + ' — skipping contact update.');
            }
        } else {
            System.debug(LoggingLevel.DEBUG, 'updateUser: facilityId is blank - skipping TSign_Contact__c sync.');
        }

        System.debug(LoggingLevel.INFO, 'updateUser: Enqueuing TSignStaffUserSyncBatch.');
        Id batchJobId = Database.executeBatch(new TSignStaffUserSyncBatch(), 1); 
        System.debug(LoggingLevel.INFO, 'updateUser: Batch enqueued. JobId=' + batchJobId);

        System.debug(LoggingLevel.INFO, 'updateUser: END');
    }

    @AuraEnabled
    public static List<Map<String, String>> getFacilities() {

        // 1) Current user
        List<User> currentUserList = [
            SELECT Id, Organization_Name__c, User_Type__c, TSign_Org_Id__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        if (currentUserList.isEmpty()) {
            return new List<Map<String, String>>();
        }
        User currentUser = currentUserList[0];

        // 2) Guard: no org assigned
        if (String.isBlank(currentUser.TSign_Org_Id__c)) {
            return new List<Map<String, String>>();
        }

        // 3) Query the org (only needed to confirm it exists)
        List<TSign_Organisation__c> orgList = [
            SELECT Id, Name
            FROM TSign_Organisation__c
            WHERE Id = :currentUser.TSign_Org_Id__c
            LIMIT 1
        ];

        if (orgList.isEmpty()) {
            return new List<Map<String, String>>();
        }
        Id orgId = orgList[0].Id;

        // 4) Active facilities for that org
        List<TSign_Facility__c> facilityList = [
            SELECT Id, Name, TSign_Organisation__c, Active__c
            FROM TSign_Facility__c
            WHERE TSign_Organisation__c = :orgId
            AND Active__c = true
            ORDER BY Name
        ];

        // 5) Build combobox options: label = Name, value = Id
        List<Map<String, String>> options = new List<Map<String, String>>();
        for (TSign_Facility__c f : facilityList) {
            options.add(new Map<String, String>{
                'label' => f.Name,
                'value' => f.Id
            });
        }
        return options;
    }

    // =========================================================
    //  CREATE USER (new)
    // =========================================================
    public class CreateUserRequest {
        @AuraEnabled public String firstName   { get; set; }
        @AuraEnabled public String lastName    { get; set; }
        @AuraEnabled public String phoneNumber { get; set; }
        @AuraEnabled public String email       { get; set; }
        @AuraEnabled public String userType    { get; set; }
        @AuraEnabled public String facility    { get; set; }   // TSign_Facility__c Id
        @AuraEnabled public String street      { get; set; }
        @AuraEnabled public String city        { get; set; }
        @AuraEnabled public String country     { get; set; }
        @AuraEnabled public String province    { get; set; }
        @AuraEnabled public String postalCode  { get; set; }

        @AuraEnabled public String profilePicUrl    { get; set; }
        @AuraEnabled public String profilePicSize   { get; set; }
        @AuraEnabled public String profilePicKey    { get; set; }
        @AuraEnabled public String ProfilefileName  { get; set; }
        @AuraEnabled public String profilePicJson   { get; set; } // <-- NEW
    }

    @AuraEnabled
    public static String createUser(CreateUserRequest request) {
        try {
            System.debug('📥 createUser request: ' + JSON.serialize(request));

            // ----- 1) Validate required fields -----
            if (request == null) {
                throw new AuraHandledException('Required fields are missing: request is null.');
            }

            List<String> missing = new List<String>();
            if (String.isBlank(request.firstName))   missing.add('firstName');
            if (String.isBlank(request.lastName))    missing.add('lastName');
            if (String.isBlank(request.email))       missing.add('email');
            if (String.isBlank(request.phoneNumber)) missing.add('phoneNumber');
            if (String.isBlank(request.userType))    missing.add('userType');
            if (String.isBlank(request.facility))    missing.add('facility');

            if (!missing.isEmpty()) {
                throw new AuraHandledException('Required fields are missing: ' + String.join(missing, ', '));
            }

            // ----- 2) Authorization -----
            User currentUser = [
                SELECT Id, User_Type__c, TSign_Org_Id__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            Map<String, Set<String>> allowedByCurrentType = new Map<String, Set<String>>{
                'T Sign Org Admin' => new Set<String>{ 'T Sign Org Admin', 'T Sign Manager', 'T Sign Staff' },
                'T Sign Manager'   => new Set<String>{ 'T Sign Manager', 'T Sign Staff' }
            };
            Set<String> allowed = allowedByCurrentType.get(currentUser.User_Type__c);
            if (allowed == null || !allowed.contains(request.userType)) {
                throw new AuraHandledException('You are not allowed to create this user type.');
            }

            // ----- 3) Validate facility -----
            Id facilityId;
            try {
                facilityId = (Id) request.facility;
            } catch (Exception e) {
                throw new AuraHandledException('Invalid facility value.');
            }

            List<TSign_Facility__c> facilityList = [
                SELECT Id, Name, TSign_Organisation__c, Active__c
                FROM TSign_Facility__c
                WHERE Id = :facilityId
                LIMIT 1
            ];
            if (facilityList.isEmpty()) {
                throw new AuraHandledException('Facility not found.');
            }
            TSign_Facility__c facility = facilityList[0];
            if (facility.TSign_Organisation__c != currentUser.TSign_Org_Id__c) {
                throw new AuraHandledException('Facility does not belong to your organization.');
            }
            if (facility.Active__c != true) {
                throw new AuraHandledException('Facility is not active.');
            }

            String emailToCheck = request.email.trim().toLowerCase();

            // ----- 4) Existing record checks -----
            if (![SELECT Id FROM User WHERE Email = :emailToCheck LIMIT 1].isEmpty()) {
                throw new AuraHandledException('A user with this email already exists.');
            }

            List<Contact> existingContacts = [
                SELECT Id, Email FROM Contact WHERE Email = :emailToCheck LIMIT 1
            ];
            Contact existingContact = existingContacts.isEmpty() ? null : existingContacts[0];

            List<TSign_Staff__c> existingStaffList = [
                SELECT Id FROM TSign_Staff__c WHERE Email__c = :emailToCheck LIMIT 1
            ];
            TSign_Staff__c existingStaff = existingStaffList.isEmpty() ? null : existingStaffList[0];

            // ----- 5) CRUD pre-checks -----
            if (!Schema.sObjectType.TSign_Staff__c.isCreateable() && existingStaff == null) {
                throw new AuraHandledException(
                    'You do not have permission to create Staff records. Contact your administrator.'
                );
            }
            if (!Schema.sObjectType.Contact.isCreateable() && existingContact == null) {
                throw new AuraHandledException(
                    'You do not have permission to create Contact records. Contact your administrator.'
                );
            }
            if (!Schema.sObjectType.TSign_Staff_Facility__c.isCreateable()) {
                throw new AuraHandledException(
                    'You do not have permission to create Staff Facility records. Contact your administrator.'
                );
            }

            // ----- 6) Resolve Staff record -----
            Id staffId;
            if (existingStaff != null) {
                staffId = existingStaff.Id;
            } else {
                String role;
                if (request.userType == 'T Sign Org Admin') {
                    role = 'TSign Portal Account Partner Executive';
                } else if (request.userType == 'T Sign Manager') {
                    role = 'TSign Portal Account Partner Manager';
                } else if (request.userType == 'T Sign Staff') {
                    role = 'TSign Portal Account Partner User';
                }

                TSign_Staff__c staff = new TSign_Staff__c(
                    First_Name__c           = request.firstName,
                    Last_Name__c            = request.lastName,
                    Email__c                = emailToCheck,
                    Phone__c                = request.phoneNumber,
                    User_Type__c            = request.userType,
                    User_Role__c            = role,
                    Status__c               = true,
                    Create_User__c          = true,
                    TSign_Organisation__c   = currentUser.TSign_Org_Id__c,
                    Address__Street__s      = request.street,
                    Address__City__s        = request.city,
                    Address__StateCode__s   = request.province,
                    Address__PostalCode__s  = request.postalCode,
                    Address__CountryCode__s = request.country,

                    Profile_Pic_URL__c        = request.profilePicUrl,
                    Profile_Pic_Size__c       = request.profilePicSize,
                    Profile_Pic_Key__c        = request.profilePicKey,
                    Profile_Pic_File_Name__c  = request.ProfilefileName,
                    Profile_Pic_JSON__c       = request.profilePicJson // <-- NEW
                );

                Database.SaveResult sr = Database.insert(staff, false);
                if (!sr.isSuccess()) {
                    throw new AuraHandledException('Staff create failed: ' + sr.getErrors()[0].getMessage());
                }
                staffId = staff.Id;
            }

            // ----- 7) Link Facility -----
            List<TSign_Staff_Facility__c> existingLinks = [ 
                SELECT Id FROM TSign_Staff_Facility__c
                WHERE TSign_Staff__c = :staffId AND TSign_Facility__c = :facilityId
                LIMIT 1
            ];
            if (existingLinks.isEmpty()) {
                TSign_Staff_Facility__c link = new TSign_Staff_Facility__c(
                    TSign_Staff__c    = staffId,
                    TSign_Facility__c = facilityId,
                    Active__c = true

                );
                Database.SaveResult lr = Database.insert(link, false);
                if (!lr.isSuccess()) {
                    throw new AuraHandledException('Facility link failed: ' + lr.getErrors()[0].getMessage());
                }
            }

            // ----- 7.5) Create TSign_Contact__c (Internal contact linked to facility) -----

// CRUD pre-check
            if (!Schema.sObjectType.TSign_Contact__c.isCreateable()) {
                throw new AuraHandledException(
                    'You do not have permission to create Contact records. Contact your administrator.'
                );
            }

            // Skip if an internal contact already exists for this email + facility
            List<TSign_Contact__c> existingTSignContacts = [
                SELECT Id
                FROM TSign_Contact__c
                WHERE Email__c = :emailToCheck
                AND TSign_Facility__c = :facilityId
                LIMIT 1
            ];

            if (existingTSignContacts.isEmpty()) {
                TSign_Contact__c con = new TSign_Contact__c(
                    Name                    =request.firstName +' '+request.lastName,
                    First_Name__c           = request.firstName,
                    Last_Name__c            = request.lastName,
                    Email__c                = emailToCheck,
                    Contact_Number__c       = request.phoneNumber,
                    Contact_Type__c         = 'Internal',
                    TSign_Facility__c       = facilityId,
                    TSign_Organisation__c   = currentUser.TSign_Org_Id__c,
                    Address__Street__s      = request.street,
                    Address__City__s        = request.city,
                    Address__StateCode__s   = request.province,
                    Address__PostalCode__s  = request.postalCode,
                    Address__CountryCode__s = request.country,
                    Picture__c              = request.profilePicUrl,
                    Profile_Pic_Key__c      = request.profilePicKey,
                    Profile_Pic_File_Name__c = request.ProfilefileName,
                    Profile_Pic_JSON__c       = request.profilePicJson

                );

                Database.SaveResult tcr = Database.insert(con, false);
                if (!tcr.isSuccess()) {
                    throw new AuraHandledException(
                        'TSign Contact create failed: ' + tcr.getErrors()[0].getMessage()
                    );
                }
            }

            // ----- 8) Resolve Contact (create if missing, attached to Portal Account) -----
            Id contactId;
            if (existingContact != null) {
                contactId = existingContact.Id;
            } else {
                List<Account> accounts = [
                    SELECT Id, Name
                    FROM Account
                    WHERE Name = 'TSign Portal Account'
                    LIMIT 1
                ];
                if (accounts.isEmpty()) {
                    throw new AuraHandledException('Portal Account was not found.');
                }

                Contact c = new Contact(
                    FirstName         = request.firstName,
                    LastName          = request.lastName,
                    Email             = emailToCheck,
                    Phone             = request.phoneNumber,
                    MailingStreet     = request.street,
                    MailingCity       = request.city,
                    MailingState      = request.province,
                    MailingPostalCode = request.postalCode,
                    MailingCountry    = request.country,
                    AccountId         = accounts[0].Id
                );

                Database.SaveResult cr = Database.insert(c, false);
                if (!cr.isSuccess()) {
                    throw new AuraHandledException('Contact create failed: ' + cr.getErrors()[0].getMessage());
                }
                contactId = c.Id;
            }

            // ----- 9) Kick off the batch -----
            //Database.executeBatch(new TSignCreateUsersBatchfromProtal(new Set<Id>{ contactId }), 1);
            Database.executeBatch(new TSignCreateUsersBatchfromProtal(), 1);

            return staffId;

        } catch (AuraHandledException e) {
            throw e;
        } catch (Exception e) {
            throw new AuraHandledException('Create failed: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static void grantModules(String staffId, List<String> modules) {
        if (String.isBlank(staffId)) {
            throw new AuraHandledException('staffId is required.');
        }
        if (modules == null) {
            modules = new List<String>();
        }

        TSign_Staff__c staff = [
            SELECT Id, Module_Access__c
            FROM TSign_Staff__c
            WHERE Id = :staffId
            LIMIT 1
        ];

        staff.Module_Access__c = String.join(modules, ';');
        update staff;
    }
    
    public class ProfileWrapper {
        @AuraEnabled public Id staffId; 
        @AuraEnabled public String firstName;
        @AuraEnabled public String lastName;
        @AuraEnabled public String email;
        @AuraEnabled public String phone;
        @AuraEnabled public String profilePicUrl ;
        @AuraEnabled public String profilePicKey;
        
        // Address Components
        @AuraEnabled public String street;
        @AuraEnabled public String city;
        @AuraEnabled public String state;
        @AuraEnabled public String postalCode;
        @AuraEnabled public String country;
        
        @AuraEnabled public String status;
        @AuraEnabled public Datetime createdDate; 
        @AuraEnabled public String errorMessage;
        @AuraEnabled public String orgId;
        @AuraEnabled public String orgEmail;
        @AuraEnabled public String stripeCustomerId;
        @AuraEnabled public Boolean orgActive;

        // --- NEW ADDITIONS FOR SUBSCRIPTION & BILLING ---
        @AuraEnabled public String accountType;
        @AuraEnabled public String subStatus;
        @AuraEnabled public String startDate;
        @AuraEnabled public String nextBillingDate;
        @AuraEnabled public String billingCurrency;
        @AuraEnabled public String billingFrequency;
        @AuraEnabled public String userType;
         @AuraEnabled public String profilePicJson;
        
        @AuraEnabled public String billingContact;
        @AuraEnabled public String billingEmail;
        @AuraEnabled public String billingAddress;
        @AuraEnabled public String market;
        @AuraEnabled public String billingText; // Optional: If you want to build the string in Apex

        // List of Subscriptions (Invoices)
        @AuraEnabled public List<TSign_Subscription__c> invoices;
    }

    @AuraEnabled
    public static ProfileWrapper getUserDetails() {
        ProfileWrapper wrapper = new ProfileWrapper();

        // 1. Get Current User (Including Org Id)
        List<User> currentUsers = [
            SELECT Id, Email, TSign_Org_Id__c,User_Type__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        if (currentUsers.isEmpty()) {
            wrapper.errorMessage = 'User record not found.';
            return wrapper;
        }

        // 2. Get Staff Details
        List<TSign_Staff__c> staffList = [
            SELECT Id,
                Address__Street__s,
                Address__City__s,
                Address__StateCode__s,
                Address__PostalCode__s,
                Address__CountryCode__s,
                Email__c,
                First_Name__c,
                Last_Name__c,
                Phone__c,
                Status__c,
                TSign_Organisation__c,
                CreatedDate,
                Profile_Pic_URL__c, Profile_Pic_Key__c,Profile_Pic_JSON__c
            FROM TSign_Staff__c
            WHERE Email__c = :currentUsers[0].Email
            LIMIT 1
        ];

        if (staffList.isEmpty()) {
            wrapper.errorMessage = 'Staff profile not found for this email.';
            return wrapper;
        }

        TSign_Staff__c staff = staffList[0];

        // Map Staff Info
        wrapper.staffId = staff.Id;
        wrapper.firstName = staff.First_Name__c;
        wrapper.lastName = staff.Last_Name__c;
        
        wrapper.email = staff.Email__c;
        wrapper.phone = staff.Phone__c;
        wrapper.status = String.valueOf(staff.Status__c);
        wrapper.createdDate = staff.CreatedDate;
        
        wrapper.street = staff.Address__Street__s;
        wrapper.city = staff.Address__City__s;
        wrapper.state = staff.Address__StateCode__s;
        wrapper.postalCode = staff.Address__PostalCode__s;
        wrapper.country = staff.Address__CountryCode__s;
        wrapper.userType  = currentUsers[0].User_Type__c;
        wrapper.profilePicUrl = staff.Profile_Pic_URL__c;
        wrapper.profilePicKey = staff.Profile_Pic_Key__c;
        wrapper.profilePicJson = staff.Profile_Pic_JSON__c;
        // =========================================================
        // 3. FETCH ORGANISATION, SUBSCRIPTION & BILLING DETAILS
        // =========================================================
        // if (String.isNotBlank(currentUsers[0].TSign_Org_Id__c)) {
        //     Id orgId = currentUsers[0].TSign_Org_Id__c;
       String profileOrgId = String.isNotBlank(currentUsers[0].TSign_Org_Id__c)
            ? currentUsers[0].TSign_Org_Id__c : staff.TSign_Organisation__c;
        System.debug('TSign profile - user ' + currentUsers[0].Id + ' | User TSign_Org_Id__c=' + currentUsers[0].TSign_Org_Id__c
            + ' | Staff TSign_Organisation__c=' + staff.TSign_Organisation__c + ' | using=' + profileOrgId);
        if (String.isNotBlank(profileOrgId)) {
            Id orgId = profileOrgId;
            
            List<TSign_Organisation__c> orgList = [
                SELECT Id, Account_Type__c, Active__c, Plan_Start_Date__c, Plan_End_Date__c, Market__c,
                       Interval__c, Currency__c, Billing_Email__c, Billing_Phone__c, Billing_Address__c,Stripe_Customer_ID__c,Email__c
                FROM TSign_Organisation__c 
                WHERE Id = :orgId
                LIMIT 1
            ];

            if (!orgList.isEmpty()) {
                TSign_Organisation__c org = orgList[0];

                wrapper.orgId = org.Id;
                wrapper.orgEmail = org.Email__c;
                wrapper.stripeCustomerId = org.Stripe_Customer_ID__c;
                wrapper.orgActive = org.Active__c;
                System.debug('TSign profile - org ' + org.Id + ' | email=' + org.Email__c + ' | customer=' + org.Stripe_Customer_ID__c);

                wrapper.accountType = org.Account_Type__c;
                wrapper.subStatus = org.Active__c == true ? 'Active' : 'Inactive';
                wrapper.startDate = org.Plan_Start_Date__c != null ? String.valueOf(org.Plan_Start_Date__c) : null;
                wrapper.nextBillingDate = org.Plan_End_Date__c != null ? String.valueOf(org.Plan_End_Date__c) : null;
                wrapper.billingCurrency = org.Currency__c;
                wrapper.billingFrequency = org.Interval__c;
                wrapper.market = org.Market__c; 
                
                wrapper.billingContact = org.Billing_Phone__c;
                wrapper.billingEmail = org.Billing_Email__c;
                
                // Format Billing Address
                if (org.Billing_Address__c != null) {
                    String bAddr = '';
                    if(String.isNotBlank(org.Billing_Address__c.getStreet())) bAddr += org.Billing_Address__c.getStreet() + ', ';
                    if(String.isNotBlank(org.Billing_Address__c.getCity())) bAddr += org.Billing_Address__c.getCity() + ', ';
                    if(String.isNotBlank(org.Billing_Address__c.getState())) bAddr += org.Billing_Address__c.getState() + ' ';
                    if(String.isNotBlank(org.Billing_Address__c.getPostalCode())) bAddr += org.Billing_Address__c.getPostalCode();
                    wrapper.billingAddress = bAddr;
                }

                // Fetch Subscriptions (Invoices)
                wrapper.invoices = [
                    SELECT Id, Stripe_Invoice_Number__c, Date_Issued__c, Invoice_Amount__c, 
                           Invoice_ID__c, Subscription_ID__c, Invoice_URL__c,Subscription_Start_Date__c,Subscription_End_Date__c
                    FROM TSign_Subscription__c 
                    WHERE TSign_Organisation__c = :orgId
                    ORDER BY CreatedDate DESC
                ];
            }
        }

        return wrapper;
    }

    @AuraEnabled
    public static String updateUserDetails(
        String staffId, 
        String firstName, 
        String lastName, 
        String phone, 
        String street, 
        String city, 
        String state, 
        String postalCode, 
        String country,
        String profilePicUrl,
        String profilePicKey,
        String profilePicName,
        String profilePicJson
    ) {
        try {
            TSign_Staff__c staffToUpdate = [
                SELECT Id, First_Name__c,Email__c, Last_Name__c, Phone__c, TSign_Organisation__c,
                       Address__Street__s, Address__City__s, Address__StateCode__s, 
                       Address__PostalCode__s, Address__CountryCode__s 
                FROM TSign_Staff__c 
                WHERE Id = :staffId 
                LIMIT 1
            ];

            staffToUpdate.First_Name__c = firstName;
            staffToUpdate.Last_Name__c = lastName; 
            staffToUpdate.Phone__c = phone;
            staffToUpdate.Update_User__c = true;
            
            // Update Address Components
            staffToUpdate.Address__Street__s = street;
            staffToUpdate.Address__City__s = city;
            staffToUpdate.Address__StateCode__s = state;
            staffToUpdate.Address__PostalCode__s = postalCode;
            staffToUpdate.Address__CountryCode__s = country;

            staffToUpdate.Profile_Pic_URL__c = profilePicUrl;
            staffToUpdate.Profile_Pic_Key__c = profilePicKey;
            staffToUpdate.Profile_Pic_File_Name__c = profilePicName;
            staffToUpdate.Profile_Pic_JSON__c = profilePicJson; 


            update staffToUpdate;

                        update staffToUpdate;

            // Check if the organisation exists and is of type 'Individual'
            if (String.isNotBlank(staffToUpdate.TSign_Organisation__c)) {
                
                // Fetch the Account Type to verify if it's 'Individual'
                TSign_Organisation__c orgCheck = [
                    SELECT Id, Account_Type__c 
                    FROM TSign_Organisation__c 
                    WHERE Id = :staffToUpdate.TSign_Organisation__c 
                    LIMIT 1
                ];

                // Only update the organisation address if Account Type is 'Individual'
                if (orgCheck.Account_Type__c == 'Individual') {
                    TSign_Organisation__c orgToUpdate = new TSign_Organisation__c(
                        Id = staffToUpdate.TSign_Organisation__c,
                        Name =firstName+' '+lastName,
                        Address__Street__s = street,
                        Address__City__s = city,
                        Address__StateCode__s = state,
                        Address__PostalCode__s = postalCode,
                        Address__CountryCode__s = country
                    );
                    update orgToUpdate;
                }
            }

                    // ----- Sync TSign_Contact__c (match by staff email) -----
           // ----- Sync TSign_Contact__c (match by staff email) -----
            if (String.isNotBlank(staffToUpdate.Email__c)) {
                System.debug(LoggingLevel.DEBUG,
                    'updateUserDetails: Syncing TSign_Contact__c for Email__c=' + staffToUpdate.Email__c);

                List<TSign_Contact__c> contactsToUpdate = [
                    SELECT Id, First_Name__c, Last_Name__c, Contact_Number__c, Contact_Type__c,
                        Address__Street__s, Address__City__s, Address__StateCode__s,
                        Address__PostalCode__s, Address__CountryCode__s
                    FROM TSign_Contact__c
                    WHERE Email__c = :staffToUpdate.Email__c
                ];

                if (!contactsToUpdate.isEmpty()) {
                    for (TSign_Contact__c con : contactsToUpdate) {
                        con.First_Name__c           = firstName;
                        con.Last_Name__c            = lastName;
                        con.Contact_Number__c       = phone;
                        con.Address__Street__s      = street;
                        con.Address__City__s        = city;
                        con.Address__StateCode__s   = state;
                        con.Address__PostalCode__s  = postalCode;
                        con.Address__CountryCode__s = country;
                    }

                    update contactsToUpdate;
                    System.debug(LoggingLevel.INFO,
                        'updateUserDetails: ' + contactsToUpdate.size() + ' TSign_Contact__c record(s) updated.');
                } else {
                    System.debug(LoggingLevel.DEBUG,
                        'updateUserDetails: No TSign_Contact__c found for Email__c=' + staffToUpdate.Email__c);
                }
            } 
            System.debug(LoggingLevel.INFO, 'updateUser: Enqueuing TSignStaffUserSyncBatch.');
            Id batchJobId = Database.executeBatch(new TSignStaffUserSyncBatch(), 1); 
            System.debug(LoggingLevel.INFO, 'updateUser: Batch enqueued. JobId=' + batchJobId);

            System.debug(LoggingLevel.INFO, 'updateUser: END'); 
            
            return 'Success';
        } catch (Exception e) {
            throw new AuraHandledException('Error updating details: ' + e.getMessage());
        }
    }


    @AuraEnabled
    public static Map<String, Object> getStaffEmailAndModules(String userId) {
        Map<String, Object> resultMap = new Map<String, Object>();

        try {
            Id targetUserId = String.isBlank(userId) ? UserInfo.getUserId() : (Id) userId;

            List<User> users = [
                SELECT Id, Email
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            if (users.isEmpty() || String.isBlank(users[0].Email)) {
                resultMap.put('error', 'No user found with the given ID or email missing.');
                return resultMap;
            }

            String userEmail = users[0].Email;

            List<TSign_Staff__c> staffList = [
                SELECT Id, Email__c, Module_Access__c, CreatedDate
                FROM TSign_Staff__c
                WHERE Email__c = :userEmail
                ORDER BY CreatedDate DESC
                LIMIT 1
            ];

            if (staffList.isEmpty()) {
                resultMap.put('error', 'No staff record found for the given email.');
                return resultMap;
            }

            TSign_Staff__c staffUser = staffList[0];
            resultMap.put('staffEmail', staffUser.Email__c);
            resultMap.put('modules',   staffUser.Module_Access__c);
        } catch (Exception e) {
            System.debug(LoggingLevel.ERROR, 'getStaffEmailAndModules: ' + e.getMessage());
            resultMap.put('error', 'Error fetching staff details.');
        }

        return resultMap;
    }

    public class StaffInfoWrapper {
        @AuraEnabled public TSign_Staff__c staff        { get; set; }
        @AuraEnabled public TSign_Signature__c signature { get; set; }
        @AuraEnabled public String firstName            { get; set; }
        @AuraEnabled public String lastName             { get; set; }
        @AuraEnabled public String fullName             { get; set; }
        @AuraEnabled public String email                { get; set; }
        @AuraEnabled public String signatureUrl         { get; set; }
        @AuraEnabled public String method               { get; set; } 
    }

    @AuraEnabled
    public static StaffInfoWrapper getUserNameInfo(){
        User currentUser = [
            SELECT Id, Organization_Name__c, User_Type__c, TSign_Org_Id__c, Email
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        List<TSign_Staff__c> staffList = [
            SELECT Id,
                First_Name__c,
                Last_Name__c,
                Email__c,
                (SELECT Id, AWS_URL__c, Is_Default__c, Method__c
                    FROM TSign_Signatures__r
                    WHERE Is_Default__c = TRUE
                    LIMIT 1)
            FROM TSign_Staff__c
            WHERE Email__c = :currentUser.Email
            LIMIT 1
        ];

        if (staffList.isEmpty()) {
            return null;
        }

        TSign_Staff__c staff = staffList[0];

        StaffInfoWrapper result = new StaffInfoWrapper();
        result.staff     = staff;
        result.firstName = staff.First_Name__c;
        result.lastName  = staff.Last_Name__c;
        result.email     = staff.Email__c;
        result.fullName  = ((staff.First_Name__c == null ? '' : staff.First_Name__c) + ' ' +
                            (staff.Last_Name__c  == null ? '' : staff.Last_Name__c)).trim();

        // TSign_Signatures__r contains only default signatures (filtered in subquery)
        if (staff.TSign_Signatures__r != null && !staff.TSign_Signatures__r.isEmpty()) {
            TSign_Signature__c sig = staff.TSign_Signatures__r[0];
            result.signature    = sig;
            result.signatureUrl = sig.AWS_URL__c;
            result.method       = sig.Method__c;
        }

        return result;
    }

    public class TeamSizeWrapper {
        @AuraEnabled public Integer activeCount { get; set; }
        @AuraEnabled public Integer teamSizeLimit { get; set; }
    }

    @AuraEnabled
    public static TeamSizeWrapper getTeamSizeDetails() {
        TeamSizeWrapper wrapper = new TeamSizeWrapper();
        
        // 1. Get the current user's Org
        User currentUser = [SELECT Id, TSign_Org_Id__c FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
        
        if (String.isBlank(currentUser.TSign_Org_Id__c)) {
            return wrapper;
        }

        // 2. Fetch the Org's Team Size (Assuming the field is named Team_Size__c)
        TSign_Organisation__c org = [SELECT Id, Team_Size__c  FROM TSign_Organisation__c  WHERE Id = :currentUser.TSign_Org_Id__c  LIMIT 1 ];
        
        wrapper.teamSizeLimit = org.Team_Size__c != null ? Integer.valueOf(org.Team_Size__c) : 0;

        // 3. Count active users for this Org (Assuming TSign_Staff__c is your user object and Active__c is the status)
        wrapper.activeCount = [  SELECT COUNT()  FROM User  WHERE TSign_Org_Id__c = :currentUser.TSign_Org_Id__c  AND IsActive = true];

        return wrapper;
    }
    
    


}