@isTest
private class UpdateContactJobTest {

    @testSetup
    static void setupTestData() {
		List<String> picklistRoles = new List<String>();
        // -------------------------
        // Organisation
        // -------------------------
      // If picklist is empty (sandbox fallback)
        if (picklistRoles.isEmpty()) {
            picklistRoles.addAll(new List<String>{'Admin', 'AIN'});
        }
        
        // Select first 2 valid roles safely
        String role1 = picklistRoles[0];
        String role2 = picklistRoles.size() > 1 ? picklistRoles[1] : role1;
        
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
          org.Roles__c = role1 + ';' + role2;
        insert org;
        
        // -------------------------
        // Facility (YOUR STRUCTURE)
        // -------------------------
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
        fac.ABN__c='12345678912';
        fac.Phone__c = '12323432';
        fac.Type_of_Service__c='Ndis';
        insert fac;

        // -------------------------
        // Account + Contact
        // -------------------------
        Account acc = new Account(Name = 'Test Account');
        insert acc;

        Contact c = new Contact(
            FirstName = 'Test',
            LastName = 'User',
            Email = 'manualtesting.20294637@hotmail.com',
            Portal_User_Created__c = true,
            AccountId = acc.Id
        );
        insert c;

        // -------------------------
        // User (must match email)
        // -------------------------
        Profile p = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];

        User u = new User(
            FirstName = 'Test',
            LastName = 'User',
            Email = 'manualtesting.20294637@hotmail.com',
            Username = 'user' + System.currentTimeMillis() + '@test.com',
            Alias = 'tuser',
            TimeZoneSidKey = 'Asia/Kolkata',
            LocaleSidKey = 'en_US',
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'en_US',
            ProfileId = p.Id,
            User_Type__c = 'NDIS Org Admin'
        );
        insert u;

        // -------------------------
        // Staff (YOUR STRUCTURE)
        // -------------------------
        Staff__c staff = new Staff__c();
        staff.Last_Name__c='Test staff'; 
        staff.Name='praveen1';
        staff.Name__c='abcd';
        staff.Contact_Number__c='56789908743';
        staff.Email_Address__c= 'manualtesting.20294637@hotmail.com';
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
        staff.Status__c = true;
        insert staff;

        // -------------------------
        // Staff Role
        // -------------------------
        StaffRole__c sr = new StaffRole__c(
            StaffRole_To_Staff__c = staff.Id,
            RoleName__c = 'Admin',
            Active__c = true,
            Hourly_Rate__c = 50
        );
        insert sr;

        // -------------------------
        // Staff Facility (IMPORTANT)
        // -------------------------
        Staff_Facility__c sf = new Staff_Facility__c(
            Staff__c = staff.Id,
            Facility__c = fac.Id,
            Active__c = true
        );
        insert sf;
    }

    @isTest
    static void testQueueableJob() {

        List<Contact> contacts = [
            SELECT Id
            FROM Contact
            WHERE Portal_User_Created__c = true
        ];

        Test.startTest();
        System.enqueueJob(new UpdateContactJob(
            new List<Id>{contacts[0].Id}
        ));
        Test.stopTest();
    }
}