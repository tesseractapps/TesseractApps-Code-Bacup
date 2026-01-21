@isTest
public class OnBoardingControllerTest {

    @testSetup
    static void setupData() {
        // Create Organisation
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
        
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.4139562@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='Test Friday4039562', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.4139562@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        insert user;
        System.runAs(user) { 
            // Create Facility
        	Facility__c fac = new Facility__c();
            fac.Name='Ashfield Consultants';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Address__CountryCode__s='AU';
            fac.Email__c= 'testonefacility@gmail.com';
            fac.Status__c=true;
            fac.Organisation__c= org.Id;
            fac.ABN__c='12234567';
            fac.Phone__c = '12323432';
            fac.ABN__c='12234567';
            fac.Phone__c = '12323432';
            fac.Type_of_Service__c='NDIS';
            insert fac;

         // Create Onboarding__c
        	 Onboarding__c ob = new Onboarding__c(
                Email__c = 'testuser@test.com',
                User_Type__c = 'Roster Manager',
                Role__c = 'Portal Account Partner Manager',
                Facility__c = fac.Id,
                Organization__c = org.Id,
                Status__c = 'Request Sent'
            );
            insert ob;
            Account a = new Account(Name = 'Test Account');
        	Database.SaveResult sr = Database.insert(a, false);
            
             Account portalAccount = new Account(Name = 'Portal Account');
            insert portalAccount;
            
            
        }
    }
    @isTest
    static void testCreateOnboardingRawAndEmail() {
        Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];

        List<Map<String, Object>> rows = new List<Map<String, Object>>();
        rows.add(new Map<String, Object>{
            'email' => 'newstaff@test.com',
            'userType' => 'Staff',
            'role' => 'Portal Account Partner Manager'
        });

        Test.startTest();
        List<OnBoardingController.Result> results =
            OnBoardingController.createOnboardingRawAndEmail(rows, 'https://example.com', fac.Id, org.Id);
        Test.stopTest();
    }

    @isTest
    static void testSendOnboardingEmails() {
        Onboarding__c ob = [SELECT Id FROM Onboarding__c LIMIT 1];

        Test.startTest();
        List<OnBoardingController.Result> res =
            OnBoardingController.sendOnboardingEmails(new List<Id>{ob.Id}, 'https://example.com/onboard');
        Test.stopTest();
    }

    @isTest
    static void testSendOnboardingReminderEmails() {
        Onboarding__c ob = [SELECT Id FROM Onboarding__c LIMIT 1];

        Test.startTest();
        List<OnBoardingController.Result> res =
            OnBoardingController.sendOnboardingReminderEmails(new List<Id>{ob.Id}, 'https://example.com/onboard');
        Test.stopTest();
    }

    @isTest
    static void testSaveOnboardingReceivedDataR() {
        Onboarding__c ob = [SELECT Id, Organization__c FROM Onboarding__c LIMIT 1];

        Test.startTest();
        OnBoardingController.SaveResultDTO res =
            OnBoardingController.saveOnboardingReceivedDataR(ob.Id, '{"data":"sample"}', true);
        Test.stopTest();
    }

    @isTest
    static void testApproveOnboarding() {
        Onboarding__c ob = [SELECT Id FROM Onboarding__c LIMIT 1];
        ob.Status__c = 'Data Received';
        update ob;

        Test.startTest();
        OnBoardingController.SaveResultDTO res =
            OnBoardingController.approveOnboarding(ob.Id, true, '{"address":{"country":"NZ"}}');
        Test.stopTest();
    }

    @isTest
    static void testGetOnboardingList() {
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];

        Test.startTest();
        List<OnBoardingController.RowDTO> listRes =
            OnBoardingController.getOnboardingList(10, fac.Id, org.Id);
        Test.stopTest();
    }

    @isTest
    static void testIsLinkActive() {
        Onboarding__c ob = [SELECT Id FROM Onboarding__c LIMIT 1];
        ob.Link_Active__c = true;
        update ob;

        Test.startTest();
        Boolean active = OnBoardingController.isLinkActive(ob.Id);
        Test.stopTest();
    }

    @isTest
    static void testGetOrgLogoAndFacilityManager() {
        Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        String logo = OnBoardingController.getOrgLogoUrlById(org.Id);
        String mgr  = OnBoardingController.getFacilityManagerName(fac.Id);
    }

    @isTest
    static void testGetExistingEmails() {
        List<String> emails = new List<String>{'testuser@test.com'};
        Test.startTest();
        Map<String, String> res = OnBoardingController.getExistingEmails(emails);
        Test.stopTest();
    }

    @isTest
    static void testGetOnboardingCounts() {
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];

        Test.startTest();
        OnBoardingController.CountDTO dto = OnBoardingController.getOnboardingCounts(fac.Id, org.Id);
        Test.stopTest();
    }

    @isTest
    static void testGetEmailNotSent() {
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];

        Test.startTest();
        List<Onboarding__c> listOb = OnBoardingController.getEmailNotSent(org.Id, fac.Id, 10);
        OnBoardingController.getOnboardingListByOrg(200, org.Id);
        Test.stopTest();
    }

    @isTest
    static void testGetOnboardingRoleAndUserType() {
        Onboarding__c ob = [SELECT Id,Email_Sent_Last_Error__c,Role__c FROM Onboarding__c LIMIT 1];
		Id onboradId = ob.Id;
        Test.startTest();
        OnBoardingController.getReceivedData(onboradId);
        OnBoardingController.eqIgnoreCase('Test1', 'Test2');  
        OnBoardingController.safeName('Maheswari', 'A');
        OnBoardingController.safeDecimal('Mahii');
        OnBoardingController.dateFromIso('iso');
        OnBoardingController.safeParseDDMMYYYY('10/05/2024');
        OnBoardingController.sVal(123);
        OnBoardingController.parseBooleanFlexible('true');
       // OnBoardingController.getOnboardingRoleAndUserType(onboradId);   
        
        // --- firstDml ---
        Account a = new Account(Name = 'Test Account');
        Database.SaveResult sr = Database.insert(a, false);
        System.assertEquals(true, sr.isSuccess());

        String errorMsg = OnBoardingController.firstDml(sr, 'Insert');
        System.assert(OnBoardingController.firstDml(null, 'Insert').contains('Unknown error'));
        
        // --- findSourceByEmail ---
        List<Map<String, String>> records = new List<Map<String, String>>();
        Map<String, String> rec1 = new Map<String, String>{ 'EmailAddress' => 'test@example.com', 'Name' => 'John' };
        Map<String, String> rec2 = new Map<String, String>{ 'EmailAddress' => 'other@example.com', 'Name' => 'Jane' };
        records.add(rec1);
        records.add(rec2);
        Map<String, String> found = OnBoardingController.findSourceByEmail(records, 'test@example.com');
        System.assertEquals('John', found.get('Name'));

        Map<String, String> notFound = OnBoardingController.findSourceByEmail(records, 'missing@example.com');
        System.assertEquals(true, notFound.isEmpty());
        Test.stopTest();
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
            fac.ABN__c = '3673232078';
            fac.Phone__c = '122423126';
            insert fac;
            
            // Step 5: Prepare input records with unique emails
            List<Map<String, String>> records = new List<Map<String, String>>();
            for (Integer i = 0; i < 5; i++) {
                String email = 'staff' + i + '_' + uniqueTime + '@example.com';
                Map<String, String> record = new Map<String, String>{
                    'FirstName' => 'TestFirst' + i,
                        'LastName' => 'TestLast' + i,
                        'EmailAddress' => user.email,
                        'AddressStreet' => '7 Glen Street',
                        'AddressCity' => 'Eastwood',
                        'AddressState' => 'NSW',
                        'AddressPostCode' => '2122',
                        'AddressCountry' => 'AU',
                        'Facility' => 'Ashfield Consultants1242',
                        'Role' => 'Staff',
                        'Gender' => 'Male',
                        'Status' => 'Active',
                        'PhoneNumber' => '123456789' + i,
                        'UserType' => 'Employee',
                        'HourlyRate' => '20.5',
                        'TaxFileNumber' => '123456789',
                        'TaxFreeThreshold' => 'With Tax Free Threshold',
                        'StartDate' => String.valueOf(Date.today()),
                        'DateofBirth' => String.valueOf(Date.today().addYears(-25))
                        };
                            records.add(record);
            }            
            // Step 6: Call method under test
            Test.startTest();
            Map<String, Object> response = OnBoardingController.createAccountsContactsAndStaff(records);
            Test.stopTest();
        }        
    }  
    
    @isTest
    static void testCreateAccountsContactsAndStaff_FacilityNotFound() {
        // Facility not provided
        List<Map<String, String>> records = new List<Map<String, String>>();
        Map<String, String> rec = new Map<String, String>{
            'FirstName' => 'Alice',
            'LastName' => 'Brown',
            'EmailAddress' => 'alice@example.com',
            'Status' => 'Reviewed',
            'UserAccountNeeded' => 'false'
        };
        records.add(rec);

        Test.startTest();
        Map<String, Object> result = OnBoardingController.createAccountsContactsAndStaff(records);
        Test.stopTest();

        List<Map<String,String>> failed = (List<Map<String,String>>)result.get('failedRecords');
        System.assert(!failed.isEmpty(), 'Facility missing should cause failure');
        System.assert(failed[0].get('ErrorMessage').contains('Facility not found'), 'Should contain facility error');
    }

    @isTest
    static void testCreateAccountsContactsAndStaff_DuplicateEmail() {
        // Create Contact manually to simulate duplicate
        Account acc = [SELECT Id FROM Account WHERE Name = 'Portal Account' LIMIT 1];
        insert new Contact(FirstName='Existing', LastName='Contact', Email='dupe@example.com', AccountId=acc.Id);

        // Input with duplicate email
        List<Map<String, String>> records = new List<Map<String, String>>();
        Map<String, String> rec = new Map<String, String>{
            'FirstName' => 'Bob',
            'LastName' => 'Dupe',
            'EmailAddress' => 'dupe@example.com',
            'Status' => 'Reviewed',
            'UserAccountNeeded' => 'false',
            'Facility' => 'Main Facility'
        };
        records.add(rec);

        Test.startTest();
        Map<String, Object> result = OnBoardingController.createAccountsContactsAndStaff(records);
        Test.stopTest();

        List<Map<String,String>> failed = (List<Map<String,String>>)result.get('failedRecords');
        System.assert(!failed.isEmpty(), 'Duplicate email should cause failure');
        System.assert(failed[0].get('ErrorMessage').contains('Duplicate email'), 'Expected duplicate email error');
    }

    @isTest
    static void testCreateAccountsContactsAndStaff_StatusNotReviewed() {
        // Not reviewed status
        List<Map<String, String>> records = new List<Map<String, String>>();
        Map<String, String> rec = new Map<String, String>{
            'FirstName' => 'Mark',
            'LastName' => 'NonReviewed',
            'EmailAddress' => 'mark@example.com',
            'Status' => 'Pending',
            'Facility' => 'Main Facility'
        };
        records.add(rec);

        Test.startTest();
        Map<String, Object> result = OnBoardingController.createAccountsContactsAndStaff(records);
        Test.stopTest();

        List<Map<String,String>> failed = (List<Map<String,String>>)result.get('failedRecords');
        System.assertEquals(1, failed.size(), 'Expected failure due to status not reviewed');
        System.assert(failed[0].get('ErrorMessage').contains('Skipped: Status is not Reviewed'));
    }
    
   @isTest
    static void testGetOnboardingRoleAndUserType_Success() {
        // Get the onboarding record
        Onboarding__c onboard = [SELECT Id,Role__c FROM Onboarding__c Where Role__c = 'Portal Account Partner Manager' LIMIT 1];
        
        Test.startTest();
        // Call the Apex method
       // OnboardingController.OnboardingInfo info = OnboardingController.getOnboardingRoleAndUserType(onboard.Id);
        Test.stopTest();
    }

    @isTest
    static void testGetOnboardingRoleAndUserType_NullId() {
        try {
            Test.startTest();
            OnboardingController.getOnboardingRoleAndUserType(null);
            Test.stopTest();
            System.assert(false, 'Expected AuraHandledException for null Id');
        } catch (AuraHandledException e) {
        }
    }

    @isTest
    static void testGetOnboardingRoleAndUserType_InvalidId() {
        try {
            Test.startTest();
            OnboardingController.getOnboardingRoleAndUserType(Id.valueOf('001000000000000AAA')); // Non-existent record
            Test.stopTest();
            System.assert(false, 'Expected AuraHandledException for invalid Id');
        } catch (AuraHandledException e) {
        }
    }

    @isTest
    static void testCreateAccountsContactsAndStaff_FullFlow() {
        // Setup data
         Onboarding__c onboard = [SELECT Id,Role__c FROM Onboarding__c LIMIT 1];
        Facility__c facility = [SELECT ID FROM Facility__c LIMIT 1];
        String email1 = 'staff1@test.com';
        String email2 = 'staff2@test.com'; // missing role
        String email3 = 'participant@test.com'; // should create Client        
        // Prepare request records
        List<Map<String, String>> incoming = new List<Map<String, String>>();

        // Record 1 - valid
        incoming.add(new Map<String, String>{
            'EmailAddress' => email1,
            'FirstName' => 'Alex',
            'LastName' => 'Brown',
            'Gender' => 'Male',
            'PhoneNumber' => '9876543210',
            'UserType' => 'Staff',
            'HourlyRate' => '35',
            'StartDate' => '01/01/2025',
            'DateofBirth' => '01/01/1990',
            'AddressStreet' => '123 King St',
            'AddressCity' => 'Sydney',
            'AddressState' => 'NSW',
            'AddressPostCode' => '2000',
            'AddressCountry' => 'AU',
            'TaxFileNumber' => '123456789',
            'TaxFreeThreshold' => 'Yes',
            'Status' => 'Active'
        });

        // Record 2 - missing role
        incoming.add(new Map<String, String>{
            'EmailAddress' => email2,
            'FirstName' => 'NoRole',
            'LastName' => 'User',
            'Gender' => 'Female',
            'Status' => 'Active'
        });

        // Record 3 - triggers participant creation
        incoming.add(new Map<String, String>{
            'EmailAddress' => email3,
            'FirstName' => 'John',
            'LastName' => 'Doe',
            'Gender' => 'Male',
            'PhoneNumber' => '1112223333',
            'UserType' => 'NDIS Participant',
            'HourlyRate' => '45',
            'StartDate' => '01/02/2025',
            'DateofBirth' => '02/02/1992',
            'AddressStreet' => '456 Queen St',
            'AddressCity' => 'Melbourne',
            'AddressState' => 'VIC',
            'AddressPostCode' => '3000',
            'AddressCountry' => 'AU',
            'Status' => 'Reviewed'
        });

        Test.startTest();
        // Call your method under test
        Map<String, Object> result = OnBoardingController.createAccountsContactsAndStaff(incoming);
        Test.stopTest();

        System.debug('📋 Result: ' + JSON.serializePretty(result));

        // Assertions
        List<Staff__c> staff = [SELECT Id, Email_Address__c, User_Role__c, User_Type__c FROM Staff__c];

        // Check client creation
        List<Client__c> clients = [SELECT Id, Name, Primary_Email_ID__c, Facility__c FROM Client__c];
        

        // Check onboarding status flip
        Onboarding__c updated = [SELECT Status__c FROM Onboarding__c WHERE Id = :onboard.Id];
    }
}