@IsTest
private class MobileTlearnerTest {
    
    @TestSetup
static void setupTestData() {
    Organisation__c org = new Organisation__c();
    org.Name='Age Grace Innovation PVT LTD';
    org.ABN__c='11234567891';
    org.ACN__c='878787878';
    org.Contact_No__c='6132899740';
    org.RCTI__c='RCTI1';
    org.Email__c='dsfdsfsd@gmail.com';
    org.Bank__c='Bank Test';
    org.BSB__c='BSB Test';
    org.Account_Name__c='Test Account';
    org.Account_Number__c='1111111111';
    org.Description__c='test Desc';
    org.Address_Latest__Street__s='101';
    org.Address_Latest__City__s='Himas Waterhen';
    org.Address_Latest__PostalCode__s='2060';
    org.Address_Latest__CountryCode__s='AU';
    org.Address_Latest__StateCode__s='NSW';
    org.NDIS_Provider__c='12341234565';
    org.BMSI_Identifier__c ='TEST BMSI';
    org.SoftwareId__c = 'jhdfn18328';
    org.Branch_code__c = 'BS123';
    org.Contact_Name__c = 'Test Contact';
    org.User_Type__c = 'NDIS Org Admin';
    insert org;

    // Fetch a standard profile for test users
    Profile standardProfile = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];

    // Generate unique usernames
    String uniqueSuffix = String.valueOf(System.currentTimeMillis());
    String uniqueEmail1 = 'testuser1_' + uniqueSuffix + '@example.com';
    String uniqueEmail2 = 'testuser2_' + uniqueSuffix + '@example.com';

    // Create test users
    User testUser1 = new User(
        FirstName = 'Test', 
        LastName = 'User1',
        Email = uniqueEmail1,
        Username = uniqueEmail1,
        Alias = 'tu1' + uniqueSuffix.substring(uniqueSuffix.length() - 3),
        ProfileId = standardProfile.Id,
        TimeZoneSidKey = 'America/New_York',
        LocaleSidKey = 'en_US',
        EmailEncodingKey = 'UTF-8',
        LanguageLocaleKey = 'en_US',
        IsActive = true
    );

    User testUser2 = new User(
        FirstName = 'Test', 
        LastName = 'User2',
        Email = uniqueEmail2,
        Username = uniqueEmail2,
        Alias = 'tu2' + uniqueSuffix.substring(uniqueSuffix.length() - 3),
        ProfileId = standardProfile.Id,
        TimeZoneSidKey = 'America/New_York',
        LocaleSidKey = 'en_US',
        EmailEncodingKey = 'UTF-8',
        LanguageLocaleKey = 'en_US',
        IsActive = true
    );

    insert new List<User>{testUser1, testUser2};
        
    Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
    User user = new User(
        Alias = 'praveen',
        Email = 'manualtesting.4139562@hotmail.com',
        EmailEncodingKey = 'UTF-8',
        LastName = 'Test Friday4039562',
        LanguageLocaleKey = 'en_US',
        LocaleSidKey = 'en_US',
        ProfileId = prof.Id,
        TimeZoneSidKey = 'America/New_York',
        UserName = 'manualtesting.4139562@hotmail.com',
        Organization_Name__c = 'Age Grace Innovation PVT LTD',
        User_Type__c = 'NDIS Org Admin'
    );
    insert user;

    System.runAs(user) { 
        Facility__c fac = new Facility__c();
        fac.Name = 'Ashfield Facility';
        fac.Address__City__s = 'Crace';
        fac.Address__Street__s = '8 Keewong Street';
        fac.Address__StateCode__s = 'ACT';
        fac.Address__PostalCode__s = '2911';
        fac.Address__CountryCode__s = 'AU';
        fac.Email__c = 'testonefacility111@gmail.com';
        fac.Status__c = true;
        fac.Organisation__c = org.Id;
        fac.ABN__c = '3673232323';
        fac.Phone__c = '123123123';            
        insert fac;

        Account portalAccount = new Account(Name = 'Portal Account');
        insert portalAccount;

        Staff__c staff = new Staff__c();
        staff.Last_Name__c = 'Test staff';
        staff.Name = 'praveen1';
        staff.Name__c = 'abcd';
        staff.Contact_Number__c = '56789908743';
        staff.Email_Address__c = 'manualtesting.4139562@hotmail.com';
        staff.Facility__c = fac.Id;
        staff.Address__Street__s = '8 Keewong Street';
        staff.Address__City__s = 'Crace';
        staff.Address__StateCode__s = 'ACT';
        staff.Address__PostalCode__s = '2911';
        staff.Emergency_Phone_Number__c = '45678766675';
        staff.Primary_Contact_Name__c = 'Praveen';
        staff.Primary_Contact_Number__c = '9908458298';
        staff.Make_Primary_as_Approver__c = true;
        staff.Primary_Contact_Email__c = 'praveenshesham.sp@gmail.com';
        staff.Secondary_Contact_Name__c = 'maheswari';
        staff.Secondary_Contact_Email__c = 'maheswari.adabala@gmail.com';
        staff.Make_Secondary_as_Approver__c = false;
        staff.Secondary_Contact_Number__c = '99084582958';
        staff.Emp_exit_date__c = date.newInstance(2028, 01, 05);
        staff.Emp_Start_Date__c = date.newInstance(2023, 02, 01);
        staff.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
        staff.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
        staff.role__c = 'Admin';
        staff.Residency_Type__c = 'Australian';
        staff.Expiry_Date__c = date.newInstance(2025, 02, 19);
        staff.Type__c = 'Visa Status';
        staff.Working_Hours_Rate__c = 50;
        staff.Final_Overall_Rate__c = 150;
        staff.Saturday_Hourly_Rate__c = 130;
        staff.Sunday_Hourly_Rate__c = 50;
        staff.Module_Names__c = 'Admin';
        insert staff;
    }
}


    @IsTest
static void testGetFilteredLearningData_noModuleAccess() {
    // Create a user with no Staff__c record or module access
    Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
    User noAccessUser = new User(
        Alias = 'noaccess',
        Email = 'noaccessuser@example.com',
        EmailEncodingKey = 'UTF-8',
        LastName = 'NoAccess',
        LanguageLocaleKey = 'en_US',
        LocaleSidKey = 'en_US',
        ProfileId = prof.Id,
        TimeZoneSidKey = 'America/New_York',
        UserName = 'noaccessuser_' + System.currentTimeMillis() + '@example.com',
        User_Type__c = 'NDIS Org Admin',
        Organization_Name__c = 'Age Grace Innovation PVT LTD'
    );
    insert noAccessUser;

    System.runAs(noAccessUser) {
        Test.startTest();

        // Provide mock TLearnerData JSON (even though it shouldn't matter for no-access)
        MobileTlearner.testJsonOverride = '[]';

        RestRequest req = new RestRequest();
        req.requestUri = '/services/apexrest/mobile/tlearner';
        req.httpMethod = 'GET';
        RestContext.request = req;
        RestContext.response = new RestResponse();

        MobileTlearner.getFilteredLearningData();
     List<String> modules = MobileTlearner.fetchUserModules(noAccessUser.Id);

      

        Test.stopTest();
    }
}
    
      private static Map<String, Object> createVideo(String id, String platform) {
        return new Map<String, Object>{
            'id' => id,
            'platform' => platform
        };
    }

    @isTest
    static void testAdminAccess() {
        List<Map<String, Object>> videos = new List<Map<String, Object>>{
            createVideo('any-video', 'Mobile Application')
        };

        List<Map<String, Object>> result = MobileTlearner.filterVideosByAccess('admin', 'NDIS Org Admin', videos);
   
    }

    @isTest
    static void testRosterManagerStaffAccess() {
        List<Map<String, Object>> videos = new List<Map<String, Object>>{
            createVideo('roster-manager-staff', 'Mobile Application'),
            createVideo('some-other-id', 'Mobile Application')
        };

        List<Map<String, Object>> result = MobileTlearner.filterVideosByAccess('roster-manager', 'NDIS Staff', videos);
      
    }

    @isTest
    static void testIncidentRegisterAccess() {
        List<Map<String, Object>> videos = new List<Map<String, Object>>{
            createVideo('incident-register-admin', 'Mobile Application'),
            createVideo('incident-register-staff', 'Mobile Application'),
            createVideo('incident-register-rm', 'Mobile Application')
        };

        List<Map<String, Object>> result1 = MobileTlearner.filterVideosByAccess('incident-register', 'NDIS Org Admin', videos);
      
    }

    @isTest
    static void testParticipantsAccess() {
        List<Map<String, Object>> videos = new List<Map<String, Object>>{
            createVideo('participants-admin', 'Mobile Application'),
            createVideo('participants-staff', 'Mobile Application'),
            createVideo('participants-rm', 'Mobile Application')
        };
    }

    @isTest
    static void testSignInAccess() {
        List<Map<String, Object>> videos = new List<Map<String, Object>>{
            createVideo('sign-in-admin', 'Mobile Application'),
            createVideo('sign-in-staff', 'Mobile Application'),
            createVideo('sign-in-rm', 'Mobile Application')
        };
    }

    @isTest
    static void testHumanResourcesAccess() {
        List<Map<String, Object>> videos = new List<Map<String, Object>>{
            createVideo('leave-management-admin', 'Mobile Application'),
            createVideo('leave-management-rm', 'Mobile Application')
        };
    }

    @isTest
    static void testMyProfileAccess() {
        List<Map<String, Object>> videos = new List<Map<String, Object>>{
            createVideo('leave-management-staff', 'Mobile Application')
        };

    }

    @isTest
    static void testRepositoryAccess() {
        List<Map<String, Object>> videos = new List<Map<String, Object>>{
            createVideo('repo-1', 'Mobile Application')
        };

        List<String> validRoles = new List<String>{'NDIS Org Admin', 'HR Admin', 'Facility Admin', 'Roster Manager'};
        for (String role : validRoles) {
            List<Map<String, Object>> result = MobileTlearner.filterVideosByAccess('repository', role, videos);
            System.assertEquals(1, result.size(), 'Role ' + role + ' should have access');
        }

        List<Map<String, Object>> denied = MobileTlearner.filterVideosByAccess('repository', 'NDIS Staff', videos);
     
    }

    @isTest
    static void testTSignAccess() {
        List<Map<String, Object>> videos = new List<Map<String, Object>>{
            createVideo('tsign-video', 'Mobile Application')
        };

        List<Map<String, Object>> result = MobileTlearner.filterVideosByAccess('t-sign', 'HR Admin', videos);
     
    }

    @isTest
    static void testPlatformFilter() {
        List<Map<String, Object>> videos = new List<Map<String, Object>>{
            createVideo('v1', 'Mobile Application'),
            createVideo('v2', 'Web'),
            createVideo('v3', null)
        };

        List<Map<String, Object>> result = MobileTlearner.filterVideosByAccess('admin', 'NDIS Org Admin', videos);
       
    }
    @isTest
    static void testSpecificRoleBasedVideoAccess() {
        List<Map<String, Object>> videos = new List<Map<String, Object>>{
            createVideo('participants-admin', 'Mobile Application'),
                createVideo('participants-staff', 'Mobile Application'),
                createVideo('participants-rm', 'Mobile Application'),
                createVideo('sign-in-admin', 'Mobile Application'),
                createVideo('sign-in-staff', 'Mobile Application'),
                createVideo('sign-in-rm', 'Mobile Application'),
                createVideo('leave-management-admin', 'Mobile Application'),
                createVideo('leave-management-rm', 'Mobile Application'),
                createVideo('leave-management-staff', 'Mobile Application')
                };
                    
                    System.assertEquals(1, MobileTlearner.filterVideosByAccess('participants', 'NDIS Org Admin', videos).size());
        System.assertEquals(1, MobileTlearner.filterVideosByAccess('participants', 'NDIS Staff', videos).size());
        System.assertEquals(1, MobileTlearner.filterVideosByAccess('participants', 'Roster Manager', videos).size());
        
        System.assertEquals(1, MobileTlearner.filterVideosByAccess('sign-in', 'NDIS Org Admin', videos).size());
        System.assertEquals(1, MobileTlearner.filterVideosByAccess('sign-in', 'NDIS Staff', videos).size());
        System.assertEquals(1, MobileTlearner.filterVideosByAccess('sign-in', 'Roster Manager', videos).size());
        
        System.assertEquals(1, MobileTlearner.filterVideosByAccess('human-resources', 'NDIS Org Admin', videos).size());
        System.assertEquals(1, MobileTlearner.filterVideosByAccess('human-resources', 'Roster Manager', videos).size());
        
        System.assertEquals(1, MobileTlearner.filterVideosByAccess('my-profile', 'NDIS Staff', videos).size());
    }
    
    
    static String testJsonOverride = JSON.serialize(new List<Object>{
        new Map<String, Object>{
            'id' => 'admin',
            'title' => 'Admin Videos',
            'videos' => new List<Map<String, Object>>{
                new Map<String, Object>{
                    'id' => 'participants-admin',
                    'platform' => 'Mobile Application'
                },
                new Map<String, Object>{
                    'id' => 'sign-in-admin',
                    'platform' => 'Mobile Application'
                },
                new Map<String, Object>{
                    'id' => 'leave-management-admin',
                    'platform' => 'Mobile Application'
                }
            }
        }
    });

    @isTest
    static void testGetFilteredLearningData() {
        // Get the inserted test user from @TestSetup
        User testUser = [SELECT Id FROM User WHERE Email = 'manualtesting.4139562@hotmail.com' LIMIT 1];

        Test.startTest();
        System.runAs(testUser) {
            // Override request/response
            RestRequest req = new RestRequest();
            req.requestUri = '/services/apexrest/v1/learning';
            req.httpMethod = 'GET';
            RestContext.request = req;
            RestContext.response = new RestResponse();

            // Inject the override JSON (simulate Static Resource)
            MobileTlearner.testJsonOverride = testJsonOverride;

            // Mock fetchUserModules() via a custom setting or global variable if applicable.
            // If fetchUserModules is part of another class (e.g., UserAccessController), ensure it returns ['admin']

            // Use reflection or adjust class design to allow injection/mock if needed
            MobileTlearner.getFilteredLearningData();

            // Validate response
            String response = RestContext.response.responseBody.toString();
            System.debug('🚀 Learning JSON Response: ' + response);

            System.assertEquals(200, RestContext.response.statusCode);
            System.assert(response.contains('Admin Videos'), 'Expected video category title');
            System.assert(response.contains('"count":3'), 'Should include all 3 mobile videos');
        }
        Test.stopTest();
    }
    
    

}