@isTest
public class StaffBatchUpdateTest {
    
    @testSetup
    static void setupTestData() {
        // Create a test User Role inside runAs to prevent MIXED_DML_OPERATION error
        UserRole testUserRole;
        System.runAs(new User(Id = UserInfo.getUserId())) {
            testUserRole = new UserRole(Name = 'Test Role');
            insert testUserRole;
        }

        // Create a test User inside runAs
        Profile prof = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];

        User testUser;
        System.runAs(new User(Id = UserInfo.getUserId())) {
            testUser = new User(
                Alias = 'tuser',
                Email = 'testuser@example.com',
                EmailEncodingKey = 'UTF-8',
                LastName = 'User',
                LanguageLocaleKey = 'en_US',
                LocaleSidKey = 'en_US',
                ProfileId = prof.Id,
                TimeZoneSidKey = 'America/New_York',
                UserName = 'testuser' + System.currentTimeMillis() + '@example.com',
                IsActive = false,
                UserRoleId = testUserRole.Id
            );
            insert testUser;
        }

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
        
        Profile prof1 = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.4139562@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='Test Friday4039562', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof1.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.4139562@hotmail.com',Organization_Name__c ='Ashfield Consultants');
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
            fac.ABN__c = 1234567890;
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
            staff.User_Update__c = true;
            staff.User_Role__c = 'Portal Account Partner Executive';
            insert staff; 
        }
    }

    @isTest
    static void testBatchUpdate() {
        // Query the existing User before batch execution
        User beforeUpdateUser = [SELECT Id, FirstName, LastName, IsActive, UserRoleId FROM User WHERE Email = 'testuser@example.com' LIMIT 1];

        // Ensure initial values are different from what we will update
        System.assertEquals(null, beforeUpdateUser.FirstName);
        System.assertEquals('User', beforeUpdateUser.LastName);
        System.assertEquals(false, beforeUpdateUser.IsActive);

        // Run the Batch Job
        Test.startTest();
        StaffToUserBatch batchJob = new StaffToUserBatch();
        Database.executeBatch(batchJob);
        Test.stopTest();

        // Query the User again after batch execution
        User afterUpdateUser = [SELECT Id, FirstName, LastName, IsActive, UserRoleId FROM User WHERE Id = :beforeUpdateUser.Id];

        // Assert that the User's details are updated as per Staff record
       // System.assertEquals('Updated First Name', afterUpdateUser.FirstName);
        //System.assertEquals('Updated Last Name', afterUpdateUser.LastName);
        //System.assertEquals(true, afterUpdateUser.IsActive);
        //System.assertNotEquals(beforeUpdateUser.UserRoleId, afterUpdateUser.UserRoleId, 'User Role should be updated.');
    }
}