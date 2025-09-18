@IsTest
private class UserAccessControllerTest {
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
            Username = uniqueEmail1, // Unique username
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
            Username = uniqueEmail2, // Unique username
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
        User user = new User(Alias = 'praveen', Email= 'manualtesting.4139562@hotmail.com',
                             EmailEncodingKey='UTF-8', LastName='Test Friday4039562', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.4139562@hotmail.com',Organization_Name__c ='Age Grace Innovation PVT LTD');
        insert user;
        System.runAs(user) { 
            
            Facility__c fac = new Facility__c();
            fac.Name='Ashfield Facility';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Address__CountryCode__s='AU';
            fac.Email__c= 'testonefacility111@gmail.com';
            fac.Status__c=true;
            fac.Organisation__c= org.Id;
            fac.ABN__c='3673232323';
            fac.Phone__c = '123123123';            
            insert fac;
            
            Account portalAccount = new Account(Name = 'Portal Account');
            insert portalAccount;
            
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff';
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.4139562@hotmail.com';
            staff.Facility__c=fac.Id;
            staff.Address__Street__s='8 Keewong Street';
            staff.Address__City__s = 'Crace';
            staff.Address__StateCode__s='ACT';
            staff.Address__PostalCode__s='2911';
            staff.Emergency_Phone_Number__c='45678766675';
            staff.Primary_Contact_Name__c='Praveen';
            staff.Primary_Contact_Number__c='9908458298';
            staff.Make_Primary_as_Approver__c=true;
            staff.Primary_Contact_Email__c='praveenshesham.sp@gmail.com';
            staff.Secondary_Contact_Name__c='maheswari';
            staff.Secondary_Contact_Email__c='maheswari.adabala@gmail.com';
            staff.Make_Secondary_as_Approver__c=false;
            staff.Secondary_Contact_Number__c='99084582958';
            staff.Emp_exit_date__c = date.newInstance(2028, 01, 05);
            staff.Emp_Start_Date__c = date.newInstance(2023, 02, 01);
            staff.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
            staff.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
            staff.role__c='Admin';
            staff.Residency_Type__c = 'Australian';
            staff.Expiry_Date__c = date.newInstance(2025,02, 19);
            staff.Type__c = 'Visa Status';
            staff.Working_Hours_Rate__c=50;
            staff.Final_Overall_Rate__c=150;
            staff.Saturday_Hourly_Rate__c = 130;
            staff.Sunday_Hourly_Rate__c = 50;
            staff.Module_Names__c = 'Admin';
            insert staff; 
        }
    }

    @IsTest
    static void testGetUserModules_ValidUsers() {
        // Fetch test users
        List<User> users = [SELECT Id FROM User LIMIT 2];
        List<Staff__c> staffRecord = [SELECT Id, Email_Address__c FROM Staff__c WHERE Email_Address__c =: 'manualtesting.4139562@hotmail.com' LIMIT 1];

        List<String> userIds = new List<String>();
        for (User u : users) {
            userIds.add(u.Id);
        }

        Test.startTest();
        //List<String> modules = UserAccessController.getUserModules(userIds);
        List<Map<String, Object>> userModules = UserAccessController.getUserModules(userIds);
        String result = UserAccessController.getSelectedStaffDetails(staffRecord[0].Id);
        Test.stopTest();

        System.debug('Returned Modules: ' + userModules);

        // Expected modules
        Set<String> expectedModules = new Set<String>{'Sales', 'Marketing', 'HR', 'IT', 'Finance'};

        // Validate that all expected modules exist
        for (String module : expectedModules) {
           // System.assert(modules.contains(module), 'Module should be present: ' + module);
        }
    }

    @IsTest
    static void testGetUserModules_NoMatchingStaffRecords() {
        // Create a user without a matching Staff__c record
        User testUser = new User(
            FirstName = 'NoStaff', 
            LastName = 'User',
            Email = 'nostaff_' + System.currentTimeMillis() + '@example.com',
            Username = 'nostaff_' + System.currentTimeMillis() + '@example.com',
            Alias = 'nsu',
            ProfileId = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1].Id,
            TimeZoneSidKey = 'America/New_York',
            LocaleSidKey = 'en_US',
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'en_US',
            IsActive = true
        );
        insert testUser;

            
        User user = [Select Id, Email From User Where Email = 'manualtesting.4139562@hotmail.com' LIMIT 1];
        List<User> users = [SELECT Id, Email FROM User WHERE Email = 'manualtesting.4139562@hotmail.com'];
 	System.runAs(user){
        // Create list of user IDs
        List<String> userIds = new List<String>();
        for (User u : users) {
            userIds.add(u.Id);
        }
        Staff__c staff = [Select Id, Email_Address__c From Staff__c Where  Email_Address__c = 'manualtesting.4139562@hotmail.com' LIMIT 1];
        Test.startTest();
        //List<String> modules = UserAccessController.getUserModules(new List<String>{testUser.Id});
        List<Map<String, Object>> userModules = UserAccessController.getUserModules(new List<String>{testUser.Id});
        UserAccessController.updateUserModuleNames1(staff.Id, 'Sign in');
        List<Map<String, Object>> result = UserAccessController.getUserAccessDetailsforAccessManager1(user.Id);
        List<Map<String, Object>> password = UserAccessController.getUserAccessDetailsforresetPassword(user.Id);
        Map<String, Object> getstaffEmail = UserAccessController.getStaffEmailAndModules(user.Id);  
        List<Map<String, Object>> getUserAccessDetails = UserAccessController.getUserAccessDetails('All', user.Id);
        UserAccessController.updateUserModuleNames(userIds, 'Sign in');
        UserAccessController.getUserOrgName();
        UserAccessController.getstaffId(user.Id);
        Map<String, Object>  getStaffDetails = UserAccessController.getStaffDetails(staff.Id);
        //List<Map<String, Object>> result1 = UserAccessController.getStaffAccessDetails(user.Id);
        
        UserAccessController.getstaffId1('khjmkkkkjj');
         Map<String, String> userDetails = new Map<String, String>{
             'staffId' => staff.Id,
            'firstName' => 'New Name',
             'lastName' => 'New Name',
                 'role' => 'Portal account partner Executive',
                 'userType' => 'NDIS Org Admin',
                 'status' => 'true'
        };
            
            Map<String, String> staffDetails = new Map<String, String>{
            'lastName' => 'New Name',
             'firstName' => 'New Name',
                 'role' => 'Portal account partner Executive',
                 'userType' => 'NDIS Org Admin',
                 'status' => 'true',
                 'email' => 'test@gmail.com'
        }; 
        UserAccessController.updateStaffDetails(userDetails);
        UserAccessController.updateStaffDetails(userDetails);
       // UserAccessController.saveStaffDetails(staffDetails);
        //List<Map<String, Object>> results = UserAccessController.getStaffAccessDetails(user.Id);
        Test.stopTest();
    }

        //System.assertEquals(0, userModules.size(), 'Modules list should be empty when no matching staff record exists');
    }
    
    @IsTest
    static void testSaveStaffDetails_NoExistingContact() {
          User user = [Select Id, Email From User Where Email = 'manualtesting.4139562@hotmail.com' LIMIT 1];
 	System.runAs(user){
         Staff__c staff = [Select Id, Email_Address__c From Staff__c Where  Email_Address__c = 'manualtesting.4139562@hotmail.com' LIMIT 1];
        // Insert required Account
        Account acc = new Account(Name = 'Portal Account');
        insert acc;

        // Create a test user (to match UserInfo.getUserId())
        Profile p = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
        User testUser = new User(
            FirstName = 'Tester',
            LastName = 'One',
            Email = 'tester1@example.com',
            Username = 'tester' + DateTime.now().getTime() + '@example.com',
            Alias = 'tst1',
            ProfileId = p.Id,
            TimeZoneSidKey = 'Australia/Sydney',
            LocaleSidKey = 'en_AU',
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey='en_US',
            IsActive = true
        );
        insert testUser;

   
            Test.startTest();

            // Make sure contact with this email doesn't exist already
            String testEmail = 'unique.email.' + DateTime.now().getTime() + '@test.com';

            Map<String, String> staffDetails = new Map<String, String>{
                'firstName' => 'John',
                'lastName' => 'Doe',
                'email' => testEmail,
                'street' => '8 Keewong Street',
                'city' => 'Crace',
                'state' => 'ACT',
                'postalCode' => '2911',
                'country' => 'AU',
                'role' => 'Test Role',
                'userType' => 'NDIS Org Admin',
                'status' => 'true',
                'staffId' => staff.id  // or provide a known Id for upsert
            };

            String result = UserAccessController.saveStaffDetails(staffDetails);
           List<Map<String, Object>>  staffDeatils= UserAccessController.getStaffAccessDetails(user.id);

            Test.stopTest();
       
    }
    }

    @IsTest
    static void testGetUserModules_EmptyUserIds() {
        Test.startTest();
        //List<String> userModules = UserAccessController.getUserModules(new List<String>());
        List<Map<String, Object>> userModules = UserAccessController.getUserModules(new List<String>());
        
        Test.stopTest();
    }    
    
    
}