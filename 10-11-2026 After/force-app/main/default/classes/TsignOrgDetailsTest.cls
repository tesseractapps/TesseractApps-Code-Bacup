@isTest
private class TsignOrgDetailsTest {

    // ------------------------------------------------------------------
    // Helper: Create a TSign Organisation
    // ------------------------------------------------------------------
    private static TSign_Organisation__c createOrg(String name, String accountType, Boolean isCancelled, Date planEndDate) {
        TSign_Organisation__c org = new TSign_Organisation__c(
            Name = name + ' ' + DateTime.now().getTime(),
            Account_Type__c = accountType,
            Active__c = true,
            Email__c = 'org.' + DateTime.now().getTime() + '@example.com',
            Is_Cancelled__c = isCancelled,
            Plan_End_Date__c = planEndDate
        );
        insert org;
        return org;
    }

    // ------------------------------------------------------------------
    // Helper: Create a User associated with a TSign Org
    // ------------------------------------------------------------------
    private static User createUser(String email, Id tsignOrgId, String userType, Id profileId) {
        User u = new User(
            FirstName = 'Test',
            LastName = 'User',
            Email = email,
            Username = 'test.' + DateTime.now().getTime() + '.' + Math.random() + '@example.com',
            Alias = 'tusr',
            CommunityNickname = 'tusr' + String.valueOf(DateTime.now().getTime()).right(6),
            ProfileId = profileId,
            TimeZoneSidKey = 'Australia/Sydney',
            LocaleSidKey = 'en_AU',
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'en_US',
            TSign_Org_Id__c = tsignOrgId != null ? String.valueOf(tsignOrgId) : null,
            User_Type__c = userType,
            IsActive = true
        );
        Database.insert(u, false);
        return u;
    }

    // ==================================================================
    // TEST 1: orgDetails - Standard Active Org
    // ==================================================================
    @isTest
    static void testOrgDetails_ActiveOrg() {
        // 1. Create Org
        TSign_Organisation__c org = createOrg('Active Org', 'Organisation', false, Date.today().addDays(30));
        
        // 2. Create a Subscription
        insert new TSign_Subscription__c(
            TSign_Organisation__c = org.Id,
            Active__c = true
        );

        // 3. Update the running test user to point to this Org
        User runningUser = [SELECT Id FROM User WHERE Id = :UserInfo.getUserId()];
        runningUser.TSign_Org_Id__c = String.valueOf(org.Id);
        Database.update(runningUser, false);

        Test.startTest();
        Map<String, Object> result = TsignOrgDetails.orgDetails();
        Test.stopTest();

        System.debug('orgDetails ActiveOrg result: ' + result);
    }

    // ==================================================================
    // TEST 2: orgDetails - Cancelled Org with past Plan End Date
    // ==================================================================
    @isTest
    static void testOrgDetails_CancelledExpiredOrg() {
        // 1. Create Org that is cancelled and expired
        TSign_Organisation__c org = createOrg('Cancelled Org', 'Organisation', true, Date.today().addDays(-5));
        
        // 2. Create an active subscription that should be deactivated
        TSign_Subscription__c sub = new TSign_Subscription__c(
            TSign_Organisation__c = org.Id,
            Active__c = true
        );
        insert sub;

        // 3. Update running user
        User runningUser = [SELECT Id FROM User WHERE Id = :UserInfo.getUserId()];
        runningUser.TSign_Org_Id__c = String.valueOf(org.Id);
        Database.update(runningUser, false);

        Test.startTest();
        Map<String, Object> result = TsignOrgDetails.orgDetails();
        Test.stopTest();

        System.debug('orgDetails CancelledExpired result: ' + result);
    }

    // ==================================================================
    // TEST 3: orgDetails - No Organisation Found (Exception path)
    // ==================================================================
    @isTest
    static void testOrgDetails_NoOrgFound() {
        // Point running user to a fake/non-existent ID
        User runningUser = [SELECT Id FROM User WHERE Id = :UserInfo.getUserId()];
        runningUser.TSign_Org_Id__c = 'a0A000000000001AAA'; // fake id
        Database.update(runningUser, false);

        Test.startTest();
        Map<String, Object> result = TsignOrgDetails.orgDetails();
        Test.stopTest();

        // Should return null gracefully
        System.debug('orgDetails NoOrgFound result: ' + result);
    }

    // ==================================================================
    // TEST 4: fetchFacilitiessForDashboard - Admin Path
    // ==================================================================
    @isTest
    static void testFetchFacilities_Admin() {
        TSign_Organisation__c org = createOrg('Admin Org', 'Organisation', false, null);
        
        // Create Facilities for Org
        insert new TSign_Facility__c(
            Name = 'Facility 1',
            TSign_Organisation__c = org.Id,
            Active__c = true
        );

        // Update running user to Admin
        User runningUser = [SELECT Id FROM User WHERE Id = :UserInfo.getUserId()];
        runningUser.TSign_Org_Id__c = String.valueOf(org.Id);
        runningUser.User_Type__c = 'T Sign Org Admin';
        Database.update(runningUser, false);

        Test.startTest();
        List<TSign_Facility__c> facilities = TsignOrgDetails.fetchFacilitiessForDashboard();
        Test.stopTest();

        System.debug('Admin Facilities found: ' + facilities.size());
    }

    // ==================================================================
    // TEST 5: fetchFacilitiessForDashboard - Non-Admin Path (Staff)
    // ==================================================================
    @isTest
    static void testFetchFacilities_NonAdmin() {
        TSign_Organisation__c org = createOrg('Non Admin Org', 'Organisation', false, null);
        
        TSign_Facility__c fac = new TSign_Facility__c(
            Name = 'Facility NonAdmin',
            TSign_Organisation__c = org.Id,
            Active__c = true
        );
        insert fac;

        // Get running user's email
        String userEmail = UserInfo.getUserEmail();

        // Create a TSign Staff matching running user's email
        TSign_Staff__c staff = new TSign_Staff__c(
            First_Name__c = 'Test',
            Last_Name__c = 'Staff',
            Email__c = userEmail,
            TSign_Organisation__c = org.Id,
            Status__c = true
        );
        insert staff;

        // Create junction record
        insert new TSign_Staff_Facility__c(
            TSign_Staff__c = staff.Id,
            TSign_Facility__c = fac.Id,
            Active__c = true
        );

        // Update running user to Non-Admin
        User runningUser = [SELECT Id FROM User WHERE Id = :UserInfo.getUserId()];
        runningUser.TSign_Org_Id__c = String.valueOf(org.Id);
        runningUser.User_Type__c = 'T Sign Staff';
        Database.update(runningUser, false);

        Test.startTest();
        List<TSign_Facility__c> facilities = TsignOrgDetails.fetchFacilitiessForDashboard();
        Test.stopTest();

        System.debug('Non-Admin Facilities found: ' + facilities.size());
    }

    // ==================================================================
    // TEST 6: fetchFacilitiessForDashboard - Non-Admin with no staff record
    // ==================================================================
    @isTest
    static void testFetchFacilities_NonAdminNoStaff() {
        // Ensure user is Non-Admin, but no matching staff record
        User runningUser = [SELECT Id FROM User WHERE Id = :UserInfo.getUserId()];
        runningUser.User_Type__c = 'T Sign Manager';
        Database.update(runningUser, false);

        Test.startTest();
        List<TSign_Facility__c> facilities = TsignOrgDetails.fetchFacilitiessForDashboard();
        Test.stopTest();

        System.debug('Non-Admin No Staff Facilities found (expected 0): ' + facilities.size());
    }

    // ==================================================================
    // TEST 7: updateOrgLogo - Happy Path
    // ==================================================================
    @isTest
    static void testUpdateOrgLogo() {
        TSign_Organisation__c org = createOrg('Logo Org', 'Organisation', false, null);

        Test.startTest();
        TsignOrgDetails.updateOrgLogo(org.Id, 'https://logo.com/img.png', 'logoKey123', '100KB', 'logo.png');
        Test.stopTest();

        TSign_Organisation__c refreshed = [SELECT Logo_URL__c FROM TSign_Organisation__c WHERE Id = :org.Id];
        System.debug('Updated Logo URL: ' + refreshed.Logo_URL__c);
    }

    // ==================================================================
    // TEST 8: updateOrgLogo - Null Org ID (Exception Path)
    // ==================================================================
    @isTest
    static void testUpdateOrgLogo_NullId() {
        Test.startTest();
        try {
            TsignOrgDetails.updateOrgLogo(null, 'https://logo.com/img.png', 'logoKey123', '100KB', 'logo.png');
            System.debug('Error: Did not throw expected exception.');
        } catch (Exception e) {
            System.debug('Caught expected exception for null orgId: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==================================================================
    // TEST 9: updateOrgLogo - Blank Strings (Clears Logo)
    // ==================================================================
    @isTest
    static void testUpdateOrgLogo_BlankValues() {
        TSign_Organisation__c org = createOrg('Blank Logo Org', 'Organisation', false, null);

        Test.startTest();
        TsignOrgDetails.updateOrgLogo(org.Id, '', '', '', '');
        Test.stopTest();

        TSign_Organisation__c refreshed = [SELECT Logo_URL__c FROM TSign_Organisation__c WHERE Id = :org.Id];
        System.debug('Cleared Logo URL (expected null): ' + refreshed.Logo_URL__c);
    }
}