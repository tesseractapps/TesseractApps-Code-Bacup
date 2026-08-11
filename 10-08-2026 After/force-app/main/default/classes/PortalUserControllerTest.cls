@isTest
public class PortalUserControllerTest {
    @testsetup Static void testData(){         
        Organisation__c org = new Organisation__c();
        org.Name='Ashfield Consultants';
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
        system.debug(org.name);
        
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.4139562@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='Test Friday4039562', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.4139562@hotmail.com',Organization_Name__c ='Ashfield Consultants');
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
            fac.ABN__c='11234567891';
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
            
    static testMethod void testGetUserTypeValues() {
        Test.startTest();
        User user = [SELECT Id FROM User WHERE Email='manualtesting.4139562@hotmail.com' LIMIT 1];
        Staff__c staf = [SELECT ID From Staff__c LIMIT 1];
        Id staffId = staf.Id;
        Map<String, Object> userDetails = new Map<String, Object>{
            'firstName' => 'John',
                'lastName' => 'Doe',
                'email' => 'johndoe@example.com',
                'role' => 'Admin',
                'userType' => 'NDIS Org Admin',
                'isActive' => true,
                'facility' => 'Ashfield Facility',
                'dateOfBirth' => '1990-05-15',
                'phoneNumber' => '0412345678',
                'hourlyRate' => '40',
                'startDate' => '2025-01-01',
                'taxFileNumber' => '123456789',
                'currentuserId' => user.Id,
                'selectedTaxFree' => 'Yes',
                'street' => '101 Example St',
                'city' => 'Sydney',
                'state' => 'NSW',
                'country' => 'AU',
                'postalCode' => '2000',
                'selectedGender' => 'Male'
                };
                    
                    // Invoke method with role filter
                    List<String> userTypes = PortalUserController.getUserTypeValues('Portal account partner executive', user.Id);
        List<String> userTypes1 = PortalUserController.getUserTypeValues('PorPortal account partner manager', user.Id);
        List<String> userTypes2 = PortalUserController.getUserTypeValues('Portal account partner User', user.Id);
        
        PortalUSerController.getUserRole();
        PortalUSerController.createstafffromstaffDataCommunity(staffId);
        PortalUserController.createPortalUserStaff('','Portal account partner executive', 'NDIS Org Admin');
        PortalUSerController.createPortalUserStaff(staffId, 'Portal account partner executive', 'NDIS Org Admin');
        PortalUSerController.getUserTypeValues('Portal account partner executive', user.Id);  
        PortalUSerController.getUserTypeValues('Portal account partner manager', user.Id); 
        PortalUSerController.getUserTypeValues1('Portal account partner manager', staffId);
        
        // Map<String, Object> result = PortalUserController.createPortalUser(userDetails);
        
        UserAccessController.getUserAccessDetailsforresetPassword(user.Id);
        // UserAccessController.updateUserModuleNames(staffId, 'Admin');
        UserAccessController.resetPortalPassword(user.Id);
        UserAccessController.getUserAccessDetails('Portal account partner executive', user.Id, 'Test Facility');
        Test.stopTest();
    }
    
    @isTest
    static void testCreatePortalUser() {
        // Create test data for Account and Organisation
        Account portalAccount = new Account(Name = 'Portal Account');
        insert portalAccount;
        
        Organisation__c org = new Organisation__c();
        org.Name='Ashfield Consultants';
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
        org.Type_of_User__c = 'NDIS User';
        insert org;
        
        // Create test data for the current User (you can adjust it as needed)       
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User currentUser = new User(Alias = 'praveen', Email= 'manualtesting.4139562@hotmail.com', 
                                    EmailEncodingKey='UTF-8', LastName='Test Friday4039562', LanguageLocaleKey='en_US', 
                                    LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.44543139562@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        
        insert currentUser;
        system.runas(currentUser){
            Facility__c fac = new Facility__c();
            fac.Name='Ashfield Facility1';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Address__CountryCode__s='AU';
            fac.Email__c= 'testonefacility11304@gmail.com';
            fac.Status__c=true;
            fac.Organisation__c= org.Id;
            fac.ABN__c='11234567891';
            fac.Phone__c = '121223124';
            insert fac;
            
            Facility__c fac1 = new Facility__c();
            fac1.Name = 'Ashfield Facility4';
            fac1.Address__City__s = 'Crace';
            fac1.Address__Street__s = '8 Keewong Street';
            fac1.Address__StateCode__s = 'ACT';
            fac1.Address__PostalCode__s = '2911';
            fac1.Address__CountryCode__s = 'AU';
            fac1.Email__c = 'testonefacility11306@gmail.com';
            fac1.Status__c = true;
            fac1.Organisation__c = org.Id;
            fac1.ABN__c = '11234567891';
            fac1.Phone__c = '121223124';
            
            List<Facility__c> facilityList = new List<Facility__c>();
            facilityList.add(fac1);
            insert facilityList;
            
            // Convert to List<String> of Ids
            List<String> facilityIdList = new List<String>();
            for (Facility__c fac5 : facilityList) {
                facilityIdList.add(fac5.Id);
            }
            
            // Simulate previously selected facilities (for update scenario)
            // Here, using empty list for simplicity
            List<String> previousFacilityIds = new List<String>();
            
            
            // Create test data for userDetails Map
            Map<String, Object> userDetails = new Map<String, Object>();
            
            userDetails.put('firstName', 'John');
            userDetails.put('lastName', 'Doe');
            userDetails.put('email', 'john.doe@domain.com');
            userDetails.put('role', 'User');
            userDetails.put('userType', 'Temporary');
            userDetails.put('isActive', true);
            userDetails.put('facility', fac.Id);
            userDetails.put('dateOfBirth', '1990-01-01');
            userDetails.put('phoneNumber', '0401234567');
            userDetails.put('hourlyRate', '50');
            userDetails.put('startDate', '2025-02-07');
            userDetails.put('taxFileNumber', '123456789');
            userDetails.put('currentuserId', currentUser.Id);
            userDetails.put('selectedTaxFree', 'No');
            userDetails.put('street', '123 Test St');
            userDetails.put('City', 'Test City');
            userDetails.put('State', 'NSW');
            userDetails.put('Country', 'Australia');
            userDetails.put('PostalCode', '2000');
            userDetails.put('selectedGender', 'Male');
            userDetails.put('managementFee', '10');
            userDetails.put('selectedLanguagesString', 'English');
            userDetails.put('frequencyValue', 'Weekly');
            userDetails.put('nationalitiesValues', 'Afghan');

            // Create the portal user
            Test.startTest();
            Map<String, Object> result = PortalUserController.createPortalUser(userDetails); // Call the method
            PortalUSerController.insertFacicilityAssociation(facilityIdList,currentUser.Id,previousFacilityIds,'Facility Admin');
            //Map<String, Object> createStaff = StaffBulkUploadController.createStaff(userDetails);
            Test.stopTest();
            
            
            // Assert that the result is correct
            System.assertNotEquals(result.get('StaffId'), null, 'Staff ID should be returned');
         //   System.assertEquals(result.get('userRole'), 'User', 'User role should match');
            System.assertEquals(result.get('userType'), 'Temporary', 'User type should match');
            System.assertEquals(result.get('StaffStatus'), true, 'Staff status should be active');
            
            // Verify that the Contact was created
            Contact contact = [SELECT Id, Email FROM Contact WHERE Email = 'john.doe@domain.com' LIMIT 1];
            System.assertNotEquals(contact, null, 'Contact should be created');
            
            // Verify that the Staff record was created
            Staff__c newStaff = [SELECT Id, Name, Email_Address__c FROM Staff__c WHERE Email_Address__c = 'john.doe@domain.com' LIMIT 1];
            System.assertNotEquals(newStaff, null, 'Staff record should be created');
            System.assertEquals(newStaff.Email_Address__c, 'john.doe@domain.com', 'Email address should match');
        }
        
    }
    
    @IsTest
    static void testGetUserAccessDetails_AllRoles() {
        User testUser = [SELECT Id FROM User WHERE Email = 'manualtesting.4139562@hotmail.com' LIMIT 1];

        Test.startTest();
        List<Map<String, Object>> results = UserAccessController.getUserAccessDetails('All', testUser.Id, 'Test Facility');
        Test.stopTest();

        //System.assertNotEquals(0, results.size(), 'Results should not be empty');
        //System.assertEquals(1, results.size(), 'Should return one related user');

        //Map<String, Object> userData = results[0];

        //System.assertEquals('Test User2', userData.get('userName'), 'User name should match');
        //System.assertEquals('testuser2@example.com', userData.get('userEmail'), 'Email should match');
        //System.assertEquals('Inactive', userData.get('userStatus'), 'User status should match');

        // Since testUser2 has no staff record, these should be null
        //System.assertEquals(null, userData.get('staffName'), 'Staff name should be null for user2');
    }

    @IsTest
    static void testGetUserAccessDetails_SpecificRole() {
        User testUser = [SELECT Id FROM User WHERE Email = 'manualtesting.4139562@hotmail.com' LIMIT 1];

        Test.startTest();
        List<Map<String, Object>> results = UserAccessController.getUserAccessDetails('Standard User', testUser.Id, 'Test Facility');
        Test.stopTest();

        //System.assertNotEquals(0, results.size(), 'Results should not be empty');
        //System.assertEquals(1, results.size(), 'Should return one related user with profile Standard User');

        //Map<String, Object> userData = results[0];

        //System.assertEquals('Test User2', userData.get('userName'), 'User name should match');
        //System.assertEquals('Standard User', userData.get('userRole'), 'User role should be Standard User');
    }

    @IsTest
    static void testGetUserAccessDetails_NoMatchingUsers() {
        User testUser = [SELECT Id FROM User WHERE Email = 'manualtesting.4139562@hotmail.com' LIMIT 1];

        Test.startTest();
        List<Map<String, Object>> results = UserAccessController.getUserAccessDetails('NonExistentRole', testUser.Id, 'Test Facility');
        Test.stopTest();

        System.assertEquals(0, results.size(), 'Results should be empty when no matching role exists');
    }
    
    @isTest
    static void testBulkImport() {
        Profile prof1 = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.41395621@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='Test Friday4039562', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof1.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.41395621@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        insert user;
        System.runAs(user){
            system.debug('user >>'+ user.Organization_Name__c);
            Organisation__c orgs =[SELECT Id,Name From Organisation__c where name ='Ashfield Consultants' LIMIT 1];
            String orgId = orgs.Id;
            // Step 2: Create Portal Account
            Account portalAccount = new Account(Name = 'Portal Account');
            insert portalAccount;
            
            // Step 3: Create a test user
            Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
            String uniqueTime = String.valueOf(System.currentTimeMillis());
            
            // Step 4: Create Facility linked to same Organisation
            Facility__c fac = new Facility__c();
            fac.Name = 'Ashfield Consultants1242';
            fac.Address__City__s = 'Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s = 'ACT';
            fac.Address__PostalCode__s = '2911';
            fac.Address__CountryCode__s = 'AU';
            fac.Email__c = 'facility' + uniqueTime + '@example.com';
            fac.Status__c = true; // ✅ Must be true for lookup filter
            fac.Organisation__c = orgId;
            fac.ABN__c = '11234567891';
            fac.Phone__c = '122423126';
            insert fac;
            
            // Step 5: Prepare input records with unique emails
            List<Map<String, String>> records = new List<Map<String, String>>();
            for (Integer i = 0; i < 5; i++) {
                String email = 'staff' + i + '_' + uniqueTime + '@example.com';
                Map<String, String> record = new Map<String, String>{
                    'firstname' => 'TestFirst' + i,
                        'lastname' => 'TestLast' + i,
                        'emailaddress' => user.email,
                        'addressstreet' => '7 Glen Street',
                        'addresscity' => 'Eastwood',
                        'addressstate' => 'NSW',
                        'addresspostcode' => '2122',
                        'addresscountry' => 'AU',
                        'facility' => 'Ashfield Consultants1242',
                        'role' => 'Staff',
                        'gender' => 'Male',
                        'status' => 'Active',
                        'phoneNumber' => '123456789' + i,
                        'usertype' => 'Employee',
                        'hourlyrate' => '20.5',
                        'taxfilenumber' => '123456789',
                        'taxfreethreshold' => 'With Tax Free Threshold',
                        'StartDate' => String.valueOf(Date.today()),
                        'DateofBirth' => String.valueOf(Date.today().addYears(-25))
                        };
                            records.add(record);
            }
            
            // Step 6: Call method under test
            Test.startTest();
            Map<String, Object> response = PortalUserController.createAccountsContactsAndStaff(records);
            Map<String, Object> createStaff = StaffBulkUploadController.createStaff(records);
            Test.stopTest();
            
            // Step 7: Assert outcome
            //System.assertNotEquals(null, response);
            //System.assert(response.containsKey('successRecords'));
            List<Map<String, String>> success = (List<Map<String, String>>)response.get('successRecords');
     
        }
        
    }    
    
    @isTest
    static void testUpdateUserModuleNames() {
        User u3= [SELECT Id from User where email='manualtesting.4139562@hotmail.com' LIMIT 1];
        System.runAs(u3){
            // ✅ Step 1: Create Test Users
        List<User> testUsers = new List<User>();
        Organisation__c org = new Organisation__c();
        org.Name='Ashfield Consultants';
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
        

        for (Integer i = 1; i <= 2; i++) { // Creating two test users
            testUsers.add(new User(
                FirstName = 'Test' + i,
                LastName = 'User' + i,
                Email = 'testuser' + i + '@example.com',
                Username = 'testuser' + i + '@example.com' + System.currentTimeMillis(),
                Alias = 'tuser' + i,
                ProfileId = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1].Id,
                TimeZoneSidKey = 'America/Los_Angeles',
                LocaleSidKey = 'en_US',
                EmailEncodingKey = 'UTF-8',
                LanguageLocaleKey = 'en_US'
            ));
        }
        insert testUsers;

        // ✅ Step 2: Create Related Staff__c Records
        List<Staff__c> staffRecords = new List<Staff__c>();
        Set<String> userEmails = new Set<String>();
          String uniqueSuffix = String.valueOf(System.currentTimeMillis());
        String uniqueUsername2 = 'testuser2_' + uniqueSuffix + '@example.com';

        for (User user1 : testUsers) {
            userEmails.add(user1.Email); // Extract emails for querying later
            
            User testUser = [SELECT Id FROM User WHERE Email = 'manualtesting.4139562@hotmail.com' LIMIT 1];
            
            Staff__c staff = [Select Id,Email_Address__c From Staff__c  Where Email_Address__c = 'manualtesting.4139562@hotmail.com' LIMIT 1];
        }
                             

        // ✅ Step 3: Prepare Test Data
        List<String> userIds = new List<String>();
        for (User user : testUsers) {
            userIds.add(user.Id);
        }
        String newModules = 'UpdatedModule';

        // ✅ Step 4: Call the Method inside Test.startTest() and Test.stopTest()
        Test.startTest();
        UserAccessController.updateUserModuleNames(userIds, 'Admin');
        Test.stopTest();

        // ✅ Step 5: Query the Updated Staff__c Records (Fix: Use Email Set)
        List<Staff__c> updatedStaff = [SELECT Module_Names__c FROM Staff__c WHERE Email_Address__c IN :userEmails];

        // ✅ Step 6: Validate the Updates
        for (Staff__c stu : updatedStaff) {
            System.assertEquals(newModules, stu.Module_Names__c, 'Module Names should be updated');
        }
         }
       }
        
    @isTest
	static void testGetFacilityCurrentUser() {

    // Get an existing user created in @testSetup
    User u = [SELECT Id FROM User WHERE Email = 'manualtesting.4139562@hotmail.com' LIMIT 1];

    System.runAs(u) {

        // Get required Facility & Staff
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];

        // Create Facility Association
        Facility_Association__c fa = new Facility_Association__c(
            User__c = u.Id,
            Staff__c = staff.Id,
            Facility__c = fac.Id,
            Active__c = true
        );
        insert fa;

        Test.startTest();
        List<Facility_Association__c> result =
            PortalUserController.getFacilityCurrentUser();
        Test.stopTest();

    }
}
    
    @isTest
    static void testGetFacilityUserWise() {
    
        // Fetch existing user
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.4139562@hotmail.com' LIMIT 1];
    
        // Fetch Facility & Staff
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
    
        // Create Facility Association with User_Type__c
        Facility_Association__c fa = new Facility_Association__c(
            User__c = u.Id,
            Staff__c = staff.Id,
            Facility__c = fac.Id,
            User_Type__c = 'Facility Admin',
            Active__c = true
        );
        insert fa;
    
        Test.startTest();
        List<Facility_Association__c> result =
            PortalUserController.getFacilityUserWise(u.Id, 'Facility Admin');
        Test.stopTest();
    
    }

     @isTest
static void testBulkImport_DUPLICATE_AND_INVALID() {

    User u = [SELECT Id FROM User WHERE Email = 'manualtesting.4139562@hotmail.com' LIMIT 1];

    System.runAs(u) {

        Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];

        // Valid facility
        Facility__c fac = new Facility__c(
            Name = 'Test Facility Branch',
            Address__City__s = 'City',
            Address__Street__s = 'Street',
            Address__StateCode__s = 'ACT',
            Address__PostalCode__s = '2911',
            Address__CountryCode__s = 'AU',
            Email__c = 'test@fac.com',
            Status__c = true,
            Organisation__c = org.Id,
            ABN__c = '12345678901',
            Phone__c = '123456789'
        );
        insert fac;

        // Portal Account
        Account acc = new Account(Name = 'Portal Account');
        insert acc;

        // 🔥 Create existing contact → triggers duplicate branch
        insert new Contact(
            FirstName = 'Dup',
            LastName = 'User',
            Email = 'dup@test.com',
            AccountId = acc.Id
        );

        List<Map<String, String>> records = new List<Map<String, String>>();

        // ❌ Duplicate email
        records.add(new Map<String, String>{
            'firstname' => 'Dup',
            'lastname' => 'User',
            'emailaddress' => 'dup@test.com',
            'facility' => fac.Name
        });

        // ❌ Invalid facility
        records.add(new Map<String, String>{
            'firstname' => 'Bad',
            'lastname' => 'Facility',
            'emailaddress' => 'bad@test.com',
            'facility' => 'NOT_EXIST'
        });

        Test.startTest();
        Map<String, Object> res =
            PortalUserController.createAccountsContactsAndStaff(records);
        Test.stopTest();
 
    }
}
    
    @isTest
static void testGetUserTypeValuesBasedOnUser() {

    User u = [
        SELECT Id, User_Type__c
        FROM User
        WHERE Email='manualtesting.4139562@hotmail.com'
        LIMIT 1
    ];

    List<String> userTypes = new List<String>{
        'NDIS Org Admin',
        'Roster Manager',
        'Facility Admin' ,
        'HR Admin',
        'ICT Admin'
 
         
    };

    Test.startTest();

    for(String typeName : userTypes){

        u.User_Type__c = typeName;
        update u;

        System.runAs(u){

            List<String> result =
                PortalUserController.getUserTypeValuesBasedOnUser();

            System.assertNotEquals(null,result);

        }
    }

    Test.stopTest();
}
}