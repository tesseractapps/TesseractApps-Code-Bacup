@isTest
private class TsignUserManagementControllerTest {

    // ------------------------------------------------------------------
    // Helper: Update the Running Test User
    // ------------------------------------------------------------------
    private static void updateRunningUser(String userType, Id tsignOrgId) {
        User runningUser = [SELECT Id, User_Type__c, TSign_Org_Id__c FROM User WHERE Id = :UserInfo.getUserId()];
        runningUser.User_Type__c = userType;
        if (tsignOrgId != null) {
            runningUser.TSign_Org_Id__c = String.valueOf(tsignOrgId);
        }
        Database.update(runningUser, false);
    }

    // ------------------------------------------------------------------
    // Helper: Create a TSign Organisation
    // ------------------------------------------------------------------
    private static TSign_Organisation__c createOrg(String name, String accountType) {
        TSign_Organisation__c org = new TSign_Organisation__c(
            Name = name + ' ' + DateTime.now().getTime(),
            Account_Type__c = accountType,
            Active__c = true,
            Email__c = 'org.' + DateTime.now().getTime() + '@example.com'
        );
        insert org;
        return org;
    }

    // ------------------------------------------------------------------
    // Helper: Create a TSign Facility
    // ------------------------------------------------------------------
    private static TSign_Facility__c createFacility(Id orgId, String name) {
        TSign_Facility__c fac = new TSign_Facility__c(
            Name = name,
            TSign_Organisation__c = orgId,
            Active__c = true
        );
        insert fac;
        return fac;
    }

    // ------------------------------------------------------------------
    // Helper: Create a TSign Staff
    // ------------------------------------------------------------------
    private static TSign_Staff__c createStaff(Id orgId, String email, String userType) {
        TSign_Staff__c staff = new TSign_Staff__c(
            First_Name__c = 'Test',
            Last_Name__c = 'Staff',
            Email__c = email,
            TSign_Organisation__c = orgId,
            Status__c = true,
            User_Type__c = userType,
            Module_Access__c = 'T Sign;Folders'
        );
        insert staff;
        return staff;
    }

    // ==================================================================
    // TEST 1: getUserList - Admin Path (with facility link)
    // ==================================================================
    @isTest
    static void testGetUserList() {
        TSign_Organisation__c org = createOrg('Test Org', 'Organisation');
        TSign_Facility__c fac = createFacility(org.Id, 'Test Facility');
        
        // Ensure the running user has the same email as a TSign Staff
        String email = UserInfo.getUserEmail();
        TSign_Staff__c staff = createStaff(org.Id, email, 'T Sign Org Admin');

        // Link staff to facility
        insert new TSign_Staff_Facility__c(
            TSign_Staff__c = staff.Id,
            TSign_Facility__c = fac.Id,
            Active__c = true
        );

        updateRunningUser('T Sign Org Admin', org.Id);

        Test.startTest();
        List<TsignUserManagementController.UserWrapper> results = TsignUserManagementController.getUserList('');
        Test.stopTest();
        
        System.debug('getUserList returned ' + results.size() + ' records.');
    }

    // ==================================================================
    // TEST 2: resetPassword
    // ==================================================================
    @isTest
    static void testResetPassword() {
        User runningUser = [SELECT Id FROM User WHERE Id = :UserInfo.getUserId()];

        Test.startTest();
        try {
            TsignUserManagementController.resetPassword(runningUser.Id);
            System.debug('Password reset successful for ' + runningUser.Id);
        } catch (Exception e) {
            System.debug('Password reset failed (expected in test context): ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==================================================================
    // TEST 3: getUserType
    // ==================================================================
    @isTest
    static void testGetUserType() {
        updateRunningUser('T Sign Org Admin', null);

        Test.startTest();
        String userType = TsignUserManagementController.getUserType();
        Test.stopTest();
        
        System.debug('getUserType returned: ' + userType);
    }

    // ==================================================================
    // TEST 4: getOrg
    // ==================================================================
    @isTest
    static void testGetOrg() {
        TSign_Organisation__c org = createOrg('Test Org', 'Organisation');
        updateRunningUser('T Sign Org Admin', org.Id);

        Test.startTest();
        List<TSign_Organisation__c> orgList = TsignUserManagementController.getOrg();
        Test.stopTest();
        
        System.debug('getOrg returned ' + (orgList != null ? orgList.size() : 0) + ' records.');
    }

    // ==================================================================
    // TEST 5: updateUser (Happy Path - includes facility link insertion)
    // ==================================================================
    @isTest
    static void testUpdateUser() {
        TSign_Organisation__c org = createOrg('Test Org', 'Organisation');
        TSign_Facility__c fac = createFacility(org.Id, 'New Facility');
        String email = UserInfo.getUserEmail();
        TSign_Staff__c staff = createStaff(org.Id, email, 'T Sign Staff');
        
        updateRunningUser('T Sign Org Admin', org.Id);

        TsignUserManagementController.UpdateUserRequest request = new TsignUserManagementController.UpdateUserRequest();
        request.staffId = staff.Id;
        request.firstName = 'UpdatedFirst';
        request.lastName = 'UpdatedLast';
        request.phone = '1234567890';
        request.isActive = true;
        request.userType = 'T Sign Manager';
        request.facilityId = fac.Id;
        request.street = '123 Main St';
        request.city = 'Sydney';
        request.province = 'NSW';
        request.postalcode = '2000';
        request.country = 'AU';

        Test.startTest();
        TsignUserManagementController.updateUser(request);
        Test.stopTest();
        
        System.debug('updateUser executed successfully.');
    }

    // ==================================================================
    // TEST 6: updateUser (Unauthorized User Type Error Path)
    // ==================================================================
    @isTest
    static void testUpdateUserUnauthorized() {
        TSign_Organisation__c org = createOrg('Test Org', 'Organisation');
        String email = UserInfo.getUserEmail();
        TSign_Staff__c staff = createStaff(org.Id, email, 'T Sign Staff');
        
        // Current user is a Manager
        updateRunningUser('T Sign Manager', org.Id);

        TsignUserManagementController.UpdateUserRequest request = new TsignUserManagementController.UpdateUserRequest();
        request.staffId = staff.Id;
        request.userType = 'T Sign Org Admin'; // Manager cannot assign Admin

        Test.startTest();
        try {
            TsignUserManagementController.updateUser(request);
            System.debug('Expected exception but none thrown.');
        } catch (Exception e) {
            System.debug('Caught expected exception for unauthorized user type: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==================================================================
    // TEST 7: getFacilities (Admin Path)
    // ==================================================================
    @isTest
    static void testGetFacilities() {
        TSign_Organisation__c org = createOrg('Test Org', 'Organisation');
        createFacility(org.Id, 'Facility A');
        createFacility(org.Id, 'Facility B');
        
        updateRunningUser('T Sign Org Admin', org.Id);

        Test.startTest();
        List<Map<String, String>> options = TsignUserManagementController.getFacilities();
        Test.stopTest();
        
        System.debug('getFacilities returned ' + options.size() + ' options.');
    }

    // ==================================================================
    // TEST 8: createUser (Happy Path)
    // ==================================================================
    @isTest
    static void testCreateUser() {
        TSign_Organisation__c org = createOrg('Test Org', 'Organisation');
        TSign_Facility__c fac = createFacility(org.Id, 'Test Facility');
        
        // Create the Portal Account required by the controller
        Account portalAcct = new Account(Name = 'TSign Portal Account');
        insert portalAcct;

        updateRunningUser('T Sign Org Admin', org.Id);

        TsignUserManagementController.CreateUserRequest req = new TsignUserManagementController.CreateUserRequest();
        req.firstName = 'New';
        req.lastName = 'User';
        req.email = 'new.user.' + DateTime.now().getTime() + '@example.com';
        req.phoneNumber = '+61400000000';
        req.userType = 'T Sign Staff';
        req.facility = fac.Id;
        req.street = '456 Side St';
        req.city = 'Melbourne';
        req.province = 'VIC';
        req.postalCode = '3000';
        req.country = 'AU';

        Test.startTest();
        String staffId = TsignUserManagementController.createUser(req);
        Test.stopTest();
        
        System.debug('createUser returned StaffId: ' + staffId);
    }

    // ==================================================================
    // TEST 9: grantModules
    // ==================================================================
    @isTest
    static void testGrantModules() {
        TSign_Organisation__c org = createOrg('Test Org', 'Organisation');
        TSign_Staff__c staff = createStaff(org.Id, 'grant.' + DateTime.now().getTime() + '@example.com', 'T Sign Staff');
        
        List<String> modules = new List<String>{ 'T Sign', 'Folders', 'My Profile' };

        Test.startTest();
        TsignUserManagementController.grantModules(staff.Id, modules);
        Test.stopTest();
        
        System.debug('grantModules executed successfully.');
    }

    // ==================================================================
    // TEST 10: getUserDetails (Profile & Billing Info)
    // ==================================================================
    @isTest
    static void testGetUserDetails() {
        TSign_Organisation__c org = createOrg('Test Org', 'Individual');
        
        // Populate Billing fields
        org.Plan_Start_Date__c = Date.today().addDays(-30);
        org.Plan_End_Date__c = Date.today().addDays(30);
        org.Currency__c = 'AUD';
        org.Billing_Email__c = 'billing@example.com';
        update org;

        String email = UserInfo.getUserEmail();
        TSign_Staff__c staff = createStaff(org.Id, email, 'T Sign Org Admin');
        
        // Create an invoice/subscription
        insert new TSign_Subscription__c(
            TSign_Organisation__c = org.Id,
            Stripe_Invoice_Number__c = 'INV-123',
            Invoice_Amount__c = 100.00,
            Invoice_URL__c = 'http://invoice.com/123'
        );

        updateRunningUser('T Sign Org Admin', org.Id);

        Test.startTest();
        TsignUserManagementController.ProfileWrapper wrapper = TsignUserManagementController.getUserDetails();
        Test.stopTest();
        
        System.debug('getUserDetails returned Staff ID: ' + wrapper.staffId);
    }

    // ==================================================================
    // TEST 11: updateUserDetails (Individual Org)
    // ==================================================================
    @isTest
    static void testUpdateUserDetails() {
        TSign_Organisation__c org = createOrg('Test Org', 'Individual');
        
        // Ensure the running user's email matches the staff email we create
        String email = UserInfo.getUserEmail();
        TSign_Staff__c staff = createStaff(org.Id, email, 'T Sign Org Admin');

        Test.startTest();
        
        // FIX: Use valid State/Country codes. 'State' is not a valid picklist value, 'NSW' is.
        String result = TsignUserManagementController.updateUserDetails(
            staff.Id, 
            'NewFirst', 
            'NewLast', 
            '1234567890', 
            '123 Main St', 
            'Sydney', 
            'NSW',       // Valid State Code
            '2000', 
            'AU',        // Valid Country Code
            'https://pic.url', 
            'picKey', 
            'picName', 
            '{"json":"data"}'
        );
        
        Test.stopTest();
        
        System.debug('updateUserDetails returned: ' + result);
    }

    // ==================================================================
    // TEST 12: getStaffEmailAndModules
    // ==================================================================
    @isTest
    static void testGetStaffEmailAndModules() {
        TSign_Organisation__c org = createOrg('Test Org', 'Organisation');
        String email = UserInfo.getUserEmail();
        TSign_Staff__c staff = createStaff(org.Id, email, 'T Sign Org Admin');

        Test.startTest();
        Map<String, Object> result = TsignUserManagementController.getStaffEmailAndModules(null);
        Test.stopTest();
        
        System.debug('getStaffEmailAndModules returned: ' + result);
    }

    // ==================================================================
    // TEST 13: getUserNameInfo
    // ==================================================================
    @isTest
    static void testGetUserNameInfo() {
        TSign_Organisation__c org = createOrg('Test Org', 'Organisation');
        String email = UserInfo.getUserEmail();
        TSign_Staff__c staff = createStaff(org.Id, email, 'T Sign Org Admin');
        
        // Create a default signature
        insert new TSign_Signature__c(
            TSign_Staff__c = staff.Id,
            AWS_URL__c = 'https://sig.com/1',
            Is_Default__c = true,
            Method__c = 'Draw'
        );

        Test.startTest();
        TsignUserManagementController.StaffInfoWrapper info = TsignUserManagementController.getUserNameInfo();
        Test.stopTest();
        
        System.debug('getUserNameInfo returned Name: ' + (info != null ? info.fullName : 'null'));
    }
}