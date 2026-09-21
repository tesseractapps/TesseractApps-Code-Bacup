@IsTest
private class CorrectiveActionOverdueBatchTest {
    static Organisation__c testOrg;
    static Facility__c testFacility;
    static User testUser;
    static Staff__c testStaff;
    static ShiftwithStaff__c testShift;

    @testSetup
    static void setup() {
        testOrg = new Organisation__c();
        testOrg.Name = 'Ashfield Consultants';
        testOrg.ABN__c = '11234567891';
        testOrg.ACN__c = '878787878';
        testOrg.Contact_No__c = '6132899740';
        testOrg.RCTI__c = 'RCTI1';
        testOrg.Email__c = 'dsfdsfsd@gmail.com';
        testOrg.Bank__c = 'Bank Test';
        testOrg.BSB__c = 'BSB Test';
        testOrg.Account_Name__c = 'Test Account';
        testOrg.Account_Number__c = '1111111111';
        testOrg.Description__c = 'test Desc';
        testOrg.Address_Latest__Street__s = '101';
        testOrg.Address_Latest__City__s = 'Himas Waterhen';
        testOrg.Address_Latest__PostalCode__s = '2060';
        testOrg.Address_Latest__CountryCode__s = 'AU';
        testOrg.Address_Latest__StateCode__s = 'NSW';
        testOrg.NDIS_Provider__c = '12341234565';
        testOrg.BMSI_Identifier__c = 'TEST BMSI';
        testOrg.SoftwareId__c = 'jhdfn18328';
        testOrg.Branch_code__c = 'BS123';
        testOrg.Contact_Name__c = 'Test Contact';
        testOrg.User_Type__c = 'NDIS Org Admin';
        testOrg.Week_Start_Day__c = 'Monday';
        testOrg.Roles__c = 'Admin;AIN';
        insert testOrg;

        testFacility = new Facility__c();
        testFacility.Name = 'Ashfield Consultants';
        testFacility.Address__City__s = 'Crace';
        testFacility.Address__Street__s = '8 Keewong Street';
        testFacility.Address__StateCode__s = 'ACT';
        testFacility.Address__PostalCode__s = '2911';
        testFacility.Address__CountryCode__s = 'AU';
        testFacility.Email__c = 'testonefacility@gmail.com';
        testFacility.Status__c = true;
        testFacility.Organisation__c = testOrg.Id;
        testFacility.ABN__c = '12345678901';
        testFacility.Phone__c = '12323432';
        testFacility.Type_of_Service__c = 'Ndis';
        insert testFacility;

        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];

        testUser = new User(
            Alias = 'praveen',
            Email = 'manualtesting.20294637@hotmail.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'StaffOne209463',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey = 'America/New_York',
            User_Type__c = 'NDIS Org Admin',
            UserName = 'manualtesting.20294637@hotmail.com',
            Organization_Name__c = 'Ashfield Consultants'
        );
        insert testUser;

        testStaff = new Staff__c();
        testStaff.Last_Name__c = 'Test staff';
        testStaff.Name = 'praveen1';
        testStaff.Name__c = 'abcd';
        testStaff.Contact_Number__c = '56789908743';
        testStaff.Email_Address__c = 'manualtesting.20294637@hotmail.com';
        testStaff.Facility__c = testFacility.Id;
        testStaff.Address__Street__s = '8 Keewong Street';
        testStaff.Address__City__s = 'Crace';
        testStaff.Address__StateCode__s = 'ACT';
        testStaff.Address__PostalCode__s = '2911';
        testStaff.Emergency_Phone_Number__c = '45678766675';
        testStaff.Primary_Contact_Name__c = 'Praveen';
        testStaff.Primary_Contact_Number__c = '9908458298';
        testStaff.Make_Primary_as_Approver__c = true;
        testStaff.Primary_Contact_Email__c = 'praveenshesham.sp@gmail.com';
        testStaff.Secondary_Contact_Name__c = 'maheswari';
        testStaff.Secondary_Contact_Email__c = 'maheswari.adabala@gmail.com';
        testStaff.Make_Secondary_as_Approver__c = false;
        testStaff.Secondary_Contact_Number__c = '99084582958';
        testStaff.Emp_exit_date__c = Date.newInstance(2028, 1, 5);
        testStaff.Emp_Start_Date__c = Date.newInstance(2023, 2, 1);
        testStaff.Payee_ETP_Payment_Date__c = Date.newInstance(2025, 2, 4);
        testStaff.Date_Of_Birth__c = Date.newInstance(2001, 2, 4);
        testStaff.role__c = 'Admin';
        testStaff.Residency_Type__c = 'Australian';
        testStaff.Expiry_Date__c = Date.newInstance(2025, 2, 19);
        testStaff.Type__c = 'Visa Status';
        testStaff.Working_Hours_Rate__c = 50;
        testStaff.Final_Overall_Rate__c = 150;
        testStaff.Saturday_Hourly_Rate__c = 130;
        testStaff.Sunday_Hourly_Rate__c = 50;
        testStaff.Status__c = true;
        testStaff.Restrict_Set_Hours__c = false;
        testStaff.Set_Hours__c = 40;
        testStaff.TFN_number__c = '123456789';
        insert testStaff;

        StaffRole__c sr = new StaffRole__c(StaffRole_To_Staff__c = testStaff.Id, Facility__c = testFacility.Id, RoleName__c = 'Admin', Active__c = true, Hourly_Rate__c = 50);
        insert sr;

        Staff_Facility__c sf = new Staff_Facility__c(Staff__c = testStaff.Id, Facility__c = testFacility.Id, Active__c = true);
        insert sf;

        Child_Staff__c testDoc = new Child_Staff__c();
        testDoc.Expiry_Date__c = Date.newInstance(2028, 1, 5);
        testDoc.Staff__c = testStaff.Id;
        testDoc.Comments__c = 'test';
        testDoc.Status__c = 'Approved';
        testDoc.Compliance__c = true;
        testDoc.Document_Type__c = 'Visa Status';
        testDoc.Is_Archived__c = false;
        insert testDoc;

        Add_Shift__c shift = new Add_Shift__c();
        shift.Break__c = '30';
        shift.Do_you_want_to_set_this_a_recurring_shif__c = true;
        shift.Start_Date__c = Date.newInstance(2024, 10, 16);
        shift.End_Date__c = Date.newInstance(2024, 10, 24);
        shift.Role__c = 'Admin';
        shift.Get_Facility__c = true;
        shift.Quantity__c = 5;
        shift.Start_Time__c = Time.newInstance(3, 30, 0, 0);
        shift.End_Time__c = Time.newInstance(5, 0, 0, 0);
        shift.Facility__c = testFacility.Id;
        shift.Status__c = 'Draft';
        shift.Start_time_picklist__c = '3:30 am';
        shift.End_time_picklist__c = '5:00 am';
        shift.Location__StateCode__s = 'ACT';
        shift.Location__CountryCode__s = 'AU';
        shift.Location__PostalCode__s = '2911';
        shift.Is_EOI__c = true;
        shift.EOI_staff__c = testStaff.Id;
        shift.Shift_Type__c = 'General';
        shift.Group_Shifts__c = true;
        insert shift;

        testShift = new ShiftwithStaff__c();
        testShift.Add_Shift__c = shift.Id;
        testShift.Attendence__c = true;
        testShift.Comments__c = 'test comments';
        testShift.Staff__c = testStaff.Id;
        testShift.Role__c = 'Admin';
        testShift.Status__c = 'Accepted';
        testShift.Start_Date__c = shift.Start_Date__c;
        testShift.Shift_Start_Time__c = shift.Start_Time__c;
        testShift.Shift_End_Date__c = shift.End_Date__c != null ? shift.End_Date__c : shift.Start_Date__c;
        testShift.Shift_End_Time__c = shift.End_Time__c;
        testShift.Log_In_Date_Time__c = Time.newInstance(1, 30, 0, 0);
        testShift.Log_Out_Date_Time__c = Time.newInstance(10, 0, 0, 0);
        insert testShift;

        StaffDocsShare__c staffDoc = new StaffDocsShare__c(Staff__c = testStaff.Id, Child_Staff__c = testDoc.Id);
        insert staffDoc;

        Company__c comp = new Company__c(Company_Name__c = testFacility.Name, Organization__c = testOrg.Id, ABN__c = '12345678901', Phone_Number__c = '1234567890', Email__c = 'test@company.com');
        insert comp;

        Facility_Role__c role = new Facility_Role__c(Facility__c = testFacility.Id, Role_Name__c = 'Test Role', Is_Active__c = true);
        insert role;

        Client__c cli = new Client__c();
        cli.First_Name__c = 'Test';
        cli.Last_Name__c = 'Participant2948';
        cli.Gendar__c = 'Male';
        cli.Date_Of_Birth__c = Date.newInstance(1991, 2, 17);
        cli.Address__Street__s = '8 Keewong Street';
        cli.Address__City__s = 'Crace';
        cli.Address__StateCode__s = 'ACT';
        cli.Address__PostalCode__s = '2911';
        cli.Contact_Number__c = '4331237651';
        cli.Drivers_Licence__c = '123456789012';
        cli.Primay_Contact_First_Name__c = 'Jason';
        cli.Primay_Contact_Last_Name__c = 'Smith';
        cli.Relationship__c = 'Parent';
        cli.Email__c = 'manualtesting.4139559@hotmail.com';
        cli.Primary_Contact_Number__c = '0433123123';
        cli.Facility__c = testFacility.Id;
        insert cli;

        Participant_Facility__c pf = new Participant_Facility__c(Participant__c = cli.Id, Facility__c = testFacility.Id, Active__c = true);
        insert pf;

        Shift_Type__c shiftType = new Shift_Type__c(Name = 'Morning', Facility__c = testFacility.Id, Start_Time__c = Time.newInstance(9, 0, 0, 0), End_Time__c = Time.newInstance(17, 0, 0, 0), Shift_Type__c = 'Morning', Colour__c = '#222222');
        insert shiftType;
    }

    @IsTest
    static void testCorrectiveActionOverdueBatch() {
        Staff__c staff = [SELECT Id, Email_Address__c FROM Staff__c LIMIT 1];

        Incident_Corrective_Action__c overdueAction = new Incident_Corrective_Action__c();
        overdueAction.Action_Title__c = 'Test Overdue Corrective Action';
        overdueAction.Assigned_Owner__c = staff.Id;
        overdueAction.Due_Date__c = System.today().addDays(-5);
        overdueAction.Status__c = 'Open';
        insert overdueAction;

        Incident_Corrective_Action__c completedAction = new Incident_Corrective_Action__c();
        completedAction.Action_Title__c = 'Test Completed Corrective Action';
        completedAction.Assigned_Owner__c = staff.Id;
        completedAction.Due_Date__c = System.today().addDays(-5);
        completedAction.Status__c = 'Completed';
        insert completedAction;

        Incident_Corrective_Action__c futureAction = new Incident_Corrective_Action__c();
        futureAction.Action_Title__c = 'Test Future Corrective Action';
        futureAction.Assigned_Owner__c = staff.Id;
        futureAction.Due_Date__c = System.today().addDays(5);
        futureAction.Status__c = 'Open';
        insert futureAction;

        Test.startTest();
        Database.executeBatch(new CorrectiveActionOverdueBatch(), 50);
        Test.stopTest();
    }
}