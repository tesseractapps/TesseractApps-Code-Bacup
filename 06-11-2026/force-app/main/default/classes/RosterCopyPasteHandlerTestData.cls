@IsTest
public class RosterCopyPasteHandlerTestData {
    
    public static User testUser;
    public static Staff__c testStaff;
    public static Facility__c testFacility;
    public static Organisation__c testOrg;
    public static Add_Shift__c testAddShift;
    public static ShiftwithStaff__c testShift1;
    public static ShiftwithStaff__c testShift2;
    public static Services_and_Support_Plan__c testService;
    
    public static void createTestData() {
        
        // Create Organisation with ALL fields from reference
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
        
        // Get Profile
        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        
        // Create User with exact fields
        testUser = new User(
            Alias = 'praveen',
            Email = 'manualtesting.20294637@hotmail.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'StaffOne209463',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey = 'America/New_York',
            UserName = 'manualtesting.20294637@hotmail.com',
            User_Type__c = 'NDIS Org Admin',
            Organization_Name__c = 'Ashfield Consultants'
        );
        insert testUser;
        
        System.runAs(testUser) {
            
            // Create Facility with exact fields
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
            
            // Create Staff with exact fields
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
            testStaff.Emp_exit_date__c = Date.newInstance(2028, 01, 05);
            testStaff.Emp_Start_Date__c = Date.newInstance(2023, 02, 01);
            testStaff.Payee_ETP_Payment_Date__c = Date.newInstance(2025, 02, 04);
            testStaff.Date_Of_Birth__c = Date.newInstance(2001, 02, 04);
            testStaff.role__c = 'Admin';
            testStaff.Residency_Type__c = 'Australian';
            testStaff.Expiry_Date__c = Date.newInstance(2025, 02, 19);
            testStaff.Type__c = 'Visa Status';
            testStaff.Working_Hours_Rate__c = 50;
            testStaff.Final_Overall_Rate__c = 150;
            testStaff.Saturday_Hourly_Rate__c = 130;
            testStaff.Sunday_Hourly_Rate__c = 50;
            testStaff.Status__c = true;
            testStaff.Restrict_Set_Hours__c = false;
            testStaff.Set_Hours__c = 40;
            insert testStaff;
            
            // Create StaffRole
            StaffRole__c sr = new StaffRole__c(
                StaffRole_To_Staff__c = testStaff.Id,
                Facility__c = testFacility.Id,
                RoleName__c = 'Admin',
                Active__c = true,
                Hourly_Rate__c = 50
            );
            insert sr;
            
            // Create Staff_Facility
            Staff_Facility__c sf = new Staff_Facility__c(
                Staff__c = testStaff.Id,
                Facility__c = testFacility.Id,
                Active__c = true
            );
            insert sf;
            
            // Create Direction
            Direction__c dire = new Direction__c();
            dire.Name = 'Test Directions';
            insert dire;
            
            // Create Add_Shift
            testAddShift = new Add_Shift__c();
            testAddShift.Break__c = '30';
            testAddShift.Do_you_want_to_set_this_a_recurring_shif__c = true;
            testAddShift.Start_Date__c = Date.newInstance(2024, 10, 16);
            testAddShift.End_Date__c = Date.newInstance(2024, 10, 24);
            testAddShift.Direction__c = dire.Id;
            testAddShift.Role__c = 'Admin';
            testAddShift.Get_Facility__c = true;
            testAddShift.Quantity__c = 5;
            testAddShift.Start_Time__c = Time.newInstance(03, 30, 00, 00);
            testAddShift.End_Time__c = Time.newInstance(05, 00, 00, 00);
            testAddShift.Facility__c = testFacility.Id;
            testAddShift.Status__c = 'Draft';
            testAddShift.Start_time_picklist__c = '3:30 am';
            testAddShift.End_time_picklist__c = '5:00 am';
            testAddShift.Location__StateCode__s = 'ACT';
            testAddShift.Location__CountryCode__s = 'AU';
            testAddShift.Location__PostalCode__s = '2911';
            testAddShift.Is_EOI__c = true;
            testAddShift.EOI_staff__c = testStaff.Id;
            testAddShift.Shift_Type__c = 'General';
            testAddShift.Group_Shifts__c = true;
            insert testAddShift;
            
            // Create ShiftwithStaff 1
            testShift1 = new ShiftwithStaff__c();
            testShift1.Add_Shift__c = testAddShift.Id;
            testShift1.Attendence__c = true;
            testShift1.Comments__c = 'test comments';
            testShift1.Staff__c = testStaff.Id;
            testShift1.Role__c = 'Admin';
            testShift1.Status__c = 'Accepted';
            testShift1.Start_Date__c = testAddShift.Start_Date__c;
            testShift1.Shift_Start_Time__c = testAddShift.Start_Time__c;
            testShift1.Shift_End_Date__c = testAddShift.End_Date__c != null ? testAddShift.End_Date__c : testAddShift.Start_Date__c;
            testShift1.Shift_End_Time__c = testAddShift.End_Time__c;
            testShift1.Log_In_Date_Time__c = Time.newInstance(01, 30, 00, 00);
            testShift1.Log_Out_Date_Time__c = Time.newInstance(10, 00, 00, 00);
            testShift1.Template_Id__c = 'TEMP1,TEMP2';
            testShift1.Shift_Day_Name__c = 'Monday';
            //testShift1.Duration__c = 8;
           // testShift1.Type_of_shift__c = 'General';
            insert testShift1;
            
            // Create ShiftwithStaff 2
            testShift2 = new ShiftwithStaff__c();
            testShift2.Add_Shift__c = testAddShift.Id;
            testShift2.Attendence__c = true;
            testShift2.Comments__c = 'test comments';
            testShift2.Staff__c = testStaff.Id;
            testShift2.Role__c = 'Admin';
            testShift2.Status__c = 'Accepted';
            testShift2.Start_Date__c = testAddShift.Start_Date__c.addDays(1);
            testShift2.Shift_Start_Time__c = testAddShift.Start_Time__c;
            testShift2.Shift_End_Date__c = testAddShift.End_Date__c != null ? testAddShift.End_Date__c.addDays(1) : testAddShift.Start_Date__c.addDays(1);
            testShift2.Shift_End_Time__c = testAddShift.End_Time__c;
            testShift2.Log_In_Date_Time__c = Time.newInstance(01, 30, 00, 00);
            testShift2.Log_Out_Date_Time__c = Time.newInstance(10, 00, 00, 00);
            testShift2.Template_Id__c = 'TEMP1';
            testShift2.Shift_Day_Name__c = 'Tuesday';
           // testShift2.Duration__c = 8;
           // testShift2.Type_of_shift__c = 'General';
            insert testShift2;
            
              Add_Shift_Checklist__c asch1 = new Add_Shift_Checklist__c();
            asch1.Description__c = ' teststs ';
            asch1.Mandatory__c = true;
            asch1.ShiftwithStaff__c = testShift2.Id;
            insert asch1;
            
            // Create NDIS Support Catalogue
            NDIS_Support_Catalogue__c NSC = new NDIS_Support_Catalogue__c();
            NSC.Name = 'Assistance Animals';
            NSC.ACT__c = 100;
            NSC.NSW__c = 100;
            NSC.NT__c = 100;
            NSC.QLD__c = 100;
            NSC.SA__c = 100;
            NSC.TAS__c = 100;
            NSC.VIC__c = 100;
            NSC.WA__c = 100;
            insert NSC;
            
            // Create Client
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
            
            // Create Funds Tracker
            Funds_Tracker__c funds = new Funds_Tracker__c();
            funds.Registration_Group__c = 'Assistance Animals';
            funds.Amount_approved__c = 11000;
            funds.Client__c = cli.Id;
            funds.Plan_Type__c = 'Plan Managed';
            funds.Approved_Date__c = Date.newInstance(2024, 03, 16);
            insert funds;
            
            // Create Service
            testService = new Services_and_Support_Plan__c();
            testService.Service_Type__c = NSC.Id;
            testService.Service_Users__c = testStaff.Id;
            testService.Funds_Tracker__c = funds.Id;
            testService.Qty__c = 5;
            testService.GST__c = 'No';
            testService.Date_of_Service__c = System.today();
            testService.Client__c = cli.Id;
            testService.Services__c = 'Assistance Animals';
            testService.State__c = 'ACT';
            testService.Start_Time__c = '3:30 am';
            testService.End_Time__c = '5:30 am';
            testService.ShiftwithStaff__c = testShift1.Id;
            testService.Template_Id__c = 'TEMP1,TEMP2';
            insert testService;
        }
    }
}