@isTest
public class CreateUsersBatchTest {

    @testSetup
    static void setupTestData() {
        // Create Account
        Account acc = new Account(Name = 'Test Account');
        insert acc;

        // Create Contact linked to Account
        Contact con = new Contact(
            FirstName = 'Test',
            LastName = 'User',
            Email = 'testuser@example.com',
            Portal_User_Created__c = true,
            AccountId = acc.Id
        );
        insert con;

        // Create Organisation__c record
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

        // Get Profile for User creation
        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];

        // Create a System User to runAs
        User user = new User(Alias = 'praveen', Email= 'manualtesting.4139562@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='Test Friday4039562', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.4139562@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        insert user;

        System.runAs(user) {
            // Create Facility__c
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

            // Create UserRole for Staff
            UserRole role = new UserRole(Name = 'Test Role', DeveloperName = 'Test_Role');
            insert role;

            // Create NDIS Staff__c record
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff';
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'testuser@example.com';
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
            staff.User_Role__c = 'Portal Account Partner Executive';
            insert staff;

            // Create ICT Staff__c record (different email)
            
            Staff__c staffICT = new Staff__c();
            staffICT.Last_Name__c='Test staff';
            staffICT.Name='praveen1';
            staffICT.Name__c='abcd';
            staffICT.Contact_Number__c='56789908743';
            staffICT.Email_Address__c= 'ictuser@example.com';
            staffICT.Facility__c=fac.Id;
            staffICT.Address__Street__s='8 Keewong Street';
            staffICT.Address__City__s = 'Crace';
            staffICT.Address__StateCode__s='ACT';
            staffICT.Address__PostalCode__s='2911';
            staffICT.Emergency_Phone_Number__c='45678766675';
            staffICT.Primary_Contact_Name__c='Praveen';
            staffICT.Primary_Contact_Number__c='9908458298';
            staffICT.Make_Primary_as_Approver__c=true;
            staffICT.Primary_Contact_Email__c='praveenshesham.sp@gmail.com';
            staffICT.Secondary_Contact_Name__c='maheswari';
            staffICT.Secondary_Contact_Email__c='maheswari.adabala@gmail.com';
            staffICT.Make_Secondary_as_Approver__c=false;
            staffICT.Secondary_Contact_Number__c='99084582958';
            staffICT.Emp_exit_date__c = date.newInstance(2028, 01, 05);
            staffICT.Emp_Start_Date__c = date.newInstance(2023, 02, 01);
            staffICT.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
            staffICT.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
            staffICT.role__c='Admin';
            staffICT.Residency_Type__c = 'Australian';
            staffICT.Expiry_Date__c = date.newInstance(2025,02, 19);
            staffICT.Type__c = 'Visa Status';
            staffICT.Working_Hours_Rate__c=50;
            staffICT.Final_Overall_Rate__c=150;
            staffICT.Saturday_Hourly_Rate__c = 130;
            staffICT.Sunday_Hourly_Rate__c = 50;
            staffICT.Module_Names__c = 'Admin';
            insert staffICT;
        }
    }

    @isTest
    static void testNDISUserCreation() {
        Test.startTest();
        CreateUsersBatch batch = new CreateUsersBatch();
        Database.executeBatch(batch, 1);
        Test.stopTest();

        // Verify NDIS User created
        List<User> createdUsers = [
            SELECT Id, Username, ContactId, Type_of_User__c
            FROM User
            WHERE Email = 'testuser@example.com'
        ];
    }

    @isTest
    static void testNoStaffFound() {
        // Create a Contact with no Staff__c mapping
        Account acc = [SELECT Id FROM Account LIMIT 1];
        Contact con2 = new Contact(
            FirstName = 'No',
            LastName = 'Staff',
            Email = 'nostaff@example.com',
            Portal_User_Created__c = true,
            AccountId = acc.Id
        );
        insert con2;

        Test.startTest();
        CreateUsersBatch batch = new CreateUsersBatch();
        Database.executeBatch(batch, 200);
        Test.stopTest();

        // Assert no User created
        List<User> noUser = [SELECT Id FROM User WHERE Email = 'nostaff@example.com'];
    }

}