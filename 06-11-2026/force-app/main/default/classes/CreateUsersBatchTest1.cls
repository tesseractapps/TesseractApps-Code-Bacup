@isTest
private class CreateUsersBatchTest1 {
    
    @testSetup
    static void setupTestData() {
        // Create Test Account
        Account testAccount = new Account(Name = 'Test Account');
        insert testAccount;

        // Create Test Contacts
        List<Contact> testContacts = new List<Contact>{
            new Contact(
                FirstName = 'John',
                LastName = 'Doe',
                Email = 'manualtesting.4139562@hotmail.com',
                Portal_User_Created__c = true,
                AccountId = testAccount.Id
            ),
            new Contact(
                FirstName = 'Jane',
                LastName = 'Doe',
                Email = 'manualtesting.41395622@hotmail.com',
                Portal_User_Created__c = true,
                AccountId = testAccount.Id
            ),
                
                new contact(
                    FirstName = 'Jane1',
                LastName = 'Doe',
                Email = 'manualtesting.41395621@hotmail.com',
                Portal_User_Created__c = true,
                AccountId = testAccount.Id
                )
        };
        insert testContacts;
        
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
            staff.Type_of_User__c = 'NDIS User';
            staff.User_Role__c = 'Portal account partner Executive';
            staff.Working_Hours_Rate__c=50;
            staff.Final_Overall_Rate__c=150;
            staff.Saturday_Hourly_Rate__c = 130;
            staff.Sunday_Hourly_Rate__c = 50;
            staff.Module_Names__c = 'Admin';
            insert staff;
            
            Staff__c staff1 = new Staff__c();
            staff1.Last_Name__c='Test staff';
            staff1.Name='praveen1';
            staff1.Name__c='abcd';
            staff1.Contact_Number__c='56789908743';
            staff1.Email_Address__c= 'manualtesting.41395621@hotmail.com';
            staff1.Facility__c=fac.Id;
            staff1.Address__Street__s='8 Keewong Street';
            staff1.Address__City__s = 'Crace';
            staff1.Address__StateCode__s='ACT';
            staff1.Address__PostalCode__s='2911';
            staff1.Emergency_Phone_Number__c='45678766675';
            staff1.Primary_Contact_Name__c='Praveen';
            staff1.Primary_Contact_Number__c='9908458298';
            staff1.Make_Primary_as_Approver__c=true;
            staff1.Primary_Contact_Email__c='praveenshesham.sp@gmail.com';
            staff1.Secondary_Contact_Name__c='maheswari';
            staff1.Secondary_Contact_Email__c='maheswari.adabala@gmail.com';
            staff1.Make_Secondary_as_Approver__c=false;
            staff1.Secondary_Contact_Number__c='99084582958';
            staff1.Emp_exit_date__c = date.newInstance(2028, 01, 05);
            staff1.Emp_Start_Date__c = date.newInstance(2023, 02, 01);
            staff1.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
            staff1.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
            staff1.role__c='Admin';
            staff1.Residency_Type__c = 'Australian';
            staff1.Expiry_Date__c = date.newInstance(2025,02, 19);
            staff1.Type__c = 'Visa Status';
            staff1.Type_of_User__c = 'ICT User';
            staff1.User_Role__c = 'Portal account partner Executive';
            staff1.Working_Hours_Rate__c=50;
            staff1.Final_Overall_Rate__c=150;
            staff1.Saturday_Hourly_Rate__c = 130;
            staff1.Sunday_Hourly_Rate__c = 50;
            staff1.Module_Names__c = 'Admin';
            insert staff1; 
        }
    }

    @isTest
    static void testBatchExecution() {
        // Verify that test records exist before batch execution
        Integer initialCount = [SELECT COUNT() FROM Contact WHERE Portal_User_Created__c = true];

        Test.startTest();
        CreateUsersBatch batchJob = new CreateUsersBatch();
        Database.executeBatch(batchJob, 200);  // Larger batch size to ensure single execution
        Test.stopTest();

        // Validate expected changes (modify based on batch job logic)
        Integer updatedCount = [SELECT COUNT() FROM Contact WHERE Portal_User_Created__c = true];

        System.assertEquals(initialCount, updatedCount, 'The number of processed records should match.');
    }
}