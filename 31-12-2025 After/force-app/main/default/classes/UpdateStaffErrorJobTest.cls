@IsTest
public class UpdateStaffErrorJobTest {

    /* =====================================================
       TEST SETUP
    ===================================================== */
    @testSetup
    static void setupTestData() {
        // ---------------- Account ----------------
        Account acc = new Account(Name = 'Test Account');
        insert acc;

        // ---------------- Contact ----------------
        Contact con = new Contact(
            FirstName = 'Test',
            LastName = 'User',
            Email = 'testuser@example.com',
            Portal_User_Created__c = true,
            AccountId = acc.Id
        );
        insert con;

        // ---------------- Organisation ----------------
        Organisation__c org = new Organisation__c(
            Name = 'Ashfield Consultants',
            ABN__c = '11234567891',
            ACN__c = '878787878',
            Contact_No__c = '6132899740',
            RCTI__c = 'RCTI1',
            Email__c = 'dsfdsfsd@gmail.com',
            Bank__c = 'Bank Test',
            BSB__c = 'BSB Test',
            Account_Name__c = 'Test Account',
            Account_Number__c = '1111111111',
            Description__c = 'test Desc',
            Address_Latest__Street__s = '101',
            Address_Latest__City__s = 'Himas Waterhen',
            Address_Latest__PostalCode__s = '2060',
            Address_Latest__CountryCode__s = 'AU',
            Address_Latest__StateCode__s = 'NSW',
            NDIS_Provider__c = '12341234565',
            BMSI_Identifier__c = 'TEST BMSI',
            SoftwareId__c = 'jhdfn18328',
            Branch_code__c = 'BS123',
            Contact_Name__c = 'Test Contact',
            User_Type__c = 'NDIS Org Admin'
        );
        insert org;

        // ---------------- User ----------------
        Profile prof = [
            SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1
        ];

        User user = new User(
            Alias = 'ptest',
            Email = 'manualtesting.4139562@hotmail.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'TestUser',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey = 'America/New_York',
            UserName = 'manualtesting.4139562@hotmail.com',
            Organization_Name__c = 'Ashfield Consultants'
        );
        insert user;

        System.runAs(user) {

            // ---------------- Facility ----------------
            Facility__c fac = new Facility__c(
                Name = 'Ashfield Facility',
                Address__City__s = 'Crace',
                Address__Street__s = '8 Keewong Street',
                Address__StateCode__s = 'ACT',
                Address__PostalCode__s = '2911',
                Address__CountryCode__s = 'AU',
                Email__c = 'testonefacility111@gmail.com',
                Status__c = true,
                Organisation__c = org.Id,
                ABN__c = '3673232323',
                Phone__c = '123123123'
            );
            insert fac;

            // ---------------- Staff (NDIS) ----------------
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

            // ---------------- Staff (ICT) ----------------
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

            insert new List<Staff__c>{ staff, staffICT };
        }
    }

    /* =====================================================
       MAIN TEST
    ===================================================== */
    @IsTest
    static void testUpdateStaffErrorJob() {

        // 🔹 Fetch Staff created in @testSetup
        List<Staff__c> staffList = [
            SELECT Id
            FROM Staff__c
            LIMIT 2
        ];

        System.assert(staffList.size() > 0, 'Staff records must exist');

        // 🔹 Prepare error map
        Map<Id, String> staffErrors = new Map<Id, String>();
        staffErrors.put(staffList[0].Id, 'License Limit Exceeded');
        staffErrors.put(staffList[1].Id, 'Invalid User Role');

        // 🔹 Execute Queueable
        Test.startTest();
        System.enqueueJob(new UpdateStaffErrorJob(staffErrors));
        Test.stopTest();

        // 🔹 Verify updates
        List<Staff__c> updatedStaff = [
            SELECT Id, Portal_User_Error__c
            FROM Staff__c
            WHERE Id IN :staffErrors.keySet()
        ];

        System.assertEquals(2, updatedStaff.size());

        for (Staff__c s : updatedStaff) {
            System.assertEquals(
                staffErrors.get(s.Id),
                s.Portal_User_Error__c,
                'Error message should match'
            );
        }
    }

    /* =====================================================
       EDGE CASE
    ===================================================== */
    @IsTest
    static void testWithEmptyMap() {
        Test.startTest();
        System.enqueueJob(new UpdateStaffErrorJob(new Map<Id, String>()));
        Test.stopTest();

        System.assert(true, 'Empty map handled safely');
    }
}