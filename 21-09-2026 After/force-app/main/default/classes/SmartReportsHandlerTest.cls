@IsTest
private class SmartReportsHandlerTest {

    @TestSetup
    static void createTestData() {

        Organisation__c org = new Organisation__c(
            Name = 'Smart Reports Test Org',
            ABN__c = '11234567891',
            ACN__c = '878787878',
            Contact_No__c = '6132899740',
            RCTI__c = 'RCTI1',
            Email__c = 'smartreports@test.com',
            Bank__c = 'Test Bank',
            BSB__c = '123456',
            Account_Name__c = 'Test Account',
            Account_Number__c = '1111111111',
            Description__c = 'Smart Reports Test Organisation',
            Address_Latest__Street__s = '101 Test Street',
            Address_Latest__City__s = 'Sydney',
            Address_Latest__PostalCode__s = '2000',
            Address_Latest__CountryCode__s = 'AU',
            Address_Latest__StateCode__s = 'NSW',
            NDIS_Provider__c = '12341234565',
            BMSI_Identifier__c = 'TEST BMSI',
            SoftwareId__c = 'TESTSOFTWARE',
            Branch_code__c = 'BS123',
            Contact_Name__c = 'Test Contact',
            User_Type__c = 'NDIS Org Admin',
            Week_Start_Day__c = 'Monday',
            Roles__c = 'Admin;AIN'
        );
        insert org;

        Profile p = [
            SELECT Id FROM Profile WHERE Name = 'System Administrator' LIMIT 1
        ];

        User testUser = new User(
            Alias = 'srtest',
            Email = 'smartreports.test@example.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'SmartReports',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = p.Id,
            TimeZoneSidKey = 'Australia/Sydney',
            User_Type__c = 'NDIS Org Admin',
            UserName = 'smartreports.test.' + System.currentTimeMillis() + '@example.com',
            Organization_Name__c = org.Name
        );
        insert testUser;

        User managerUser = new User(
            Alias = 'srmgr',
            Email = 'smartreports.manager@example.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'SmartReportsManager',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = p.Id,
            TimeZoneSidKey = 'Australia/Sydney',
            User_Type__c = 'Roster Manager',
            UserName = 'smartreports.manager.' + System.currentTimeMillis() + '@example.com',
            Organization_Name__c = org.Name
        );
        insert managerUser;

        System.runAs(testUser) {

            Facility__c facility = new Facility__c(
                Name = 'Test Facility',
                Address__City__s = 'Crace',
                Address__Street__s = '8 Keewong Street',
                Address__StateCode__s = 'ACT',
                Address__PostalCode__s = '2911',
                Address__CountryCode__s = 'AU',
                Email__c = 'facility@test.com',
                Status__c = true,
                Organisation__c = org.Id,
                ABN__c = '12345678901',
                Phone__c = '0400000000',
                Type_of_Service__c = 'Ndis'
            );
            insert facility;

            Facility_Role__c facilityRole = new Facility_Role__c(
                Role_Name__c = 'Support Worker',
                Facility__c = facility.Id,
                Is_Active__c = true
            );
            insert facilityRole;

            insert new List<Facility_Association__c>{
                new Facility_Association__c(
                    Facility__c = facility.Id,
                    User__c = testUser.Id,
                    Active__c = true
                ),
                new Facility_Association__c(
                    Facility__c = facility.Id,
                    User__c = managerUser.Id,
                    User_Type__c = 'Roster Manager',
                    Active__c = true
                )
            };

            Staff__c staff = new Staff__c(
                Last_Name__c = 'Test staff',
                Name = 'praveen1',
                Name__c = 'abcd',
                Contact_Number__c = '56789908743',
                Email_Address__c = 'manualtesting.20294637@hotmail.com',
                Facility__c = facility.Id,
                Address__Street__s = '8 Keewong Street',
                Address__City__s = 'Crace',
                Address__StateCode__s = 'ACT',
                Address__PostalCode__s = '2911',
                Emergency_Phone_Number__c = '45678766675',
                Primary_Contact_Name__c = 'Praveen',
                Primary_Contact_Number__c = '9908458298',
                Make_Primary_as_Approver__c = true,
                Primary_Contact_Email__c = 'praveenshesham.sp@gmail.com',
                Secondary_Contact_Name__c = 'maheswari',
                Secondary_Contact_Email__c = 'maheswari.adabala@gmail.com',
                Make_Secondary_as_Approver__c = false,
                Secondary_Contact_Number__c = '99084582958',
                Emp_exit_date__c = Date.newInstance(2028, 1, 5),
                Emp_Start_Date__c = Date.newInstance(2023, 2, 1),
                Payee_ETP_Payment_Date__c = Date.newInstance(2025, 2, 4),
                Date_Of_Birth__c = Date.newInstance(2001, 2, 4),
                Role__c = 'Admin',
                Residency_Type__c = 'Australian',
                Expiry_Date__c = Date.newInstance(2025, 2, 19),
                Type__c = 'Visa Status',
                Working_Hours_Rate__c = 50,
                Final_Overall_Rate__c = 150,
                Saturday_Hourly_Rate__c = 130,
                Sunday_Hourly_Rate__c = 50,
                Status__c = true,
                Restrict_Set_Hours__c = false,
                Set_Hours__c = 40
            );
            insert staff;

            StaffRole__c staffRole = new StaffRole__c(
                StaffRole_To_Staff__c = staff.Id,
                Facility__c = facility.Id,
                RoleName__c = 'Support Worker',
                Active__c = true,
                Hourly_Rate__c = 30
            );
            insert staffRole;

            Staff_Facility__c staffFacility = new Staff_Facility__c(
                Staff__c = staff.Id,
                Facility__c = facility.Id,
                Active__c = true
            );
            insert staffFacility;

            Client__c client = new Client__c(
                First_Name__c = 'Test',
                Last_Name__c = 'Participant2948',
                Gendar__c = 'Male',
                Date_Of_Birth__c = Date.newInstance(1991, 2, 17),
                Address__Street__s = '8 Keewong Street',
                Address__City__s = 'Crace',
                Address__StateCode__s = 'ACT',
                Address__PostalCode__s = '2911',
                Contact_Number__c = '4331237651',
                Drivers_Licence__c = '123456789012',
                Primay_Contact_First_Name__c = 'Jason',
                Primay_Contact_Last_Name__c = 'Smith',
                Relationship__c = 'Parent',
                Email__c = 'manualtesting.4139559@hotmail.com',
                Primary_Contact_Number__c = '0433123123',
                Facility__c = facility.Id
            );
            insert client;

            Participant_Facility__c participantFacility = new Participant_Facility__c(
                Participant__c = client.Id,
                Facility__c = facility.Id,
                Active__c = true
            );
            insert participantFacility;

            Direction__c direction = new Direction__c(Name = 'Test Direction');
            insert direction;

            NDIS_Support_Catalogue__c catalogue = new NDIS_Support_Catalogue__c(
                Name = 'Test Support Item',
                ACT__c = 50, NSW__c = 50, NT__c = 50, QLD__c = 50,
                SA__c = 50, TAS__c = 50, VIC__c = 50, WA__c = 50
            );
            insert catalogue;

            Funds_Tracker__c fundsTracker = new Funds_Tracker__c(
                Registration_Group__c = 'Assistance Animals',
                Amount_approved__c = 10000,
                Client__c = client.Id,
                Plan_Type__c = 'Plan Managed',
                Approved_Date__c = Date.today()
            );
            insert fundsTracker;

            Add_Shift__c addShift = new Add_Shift__c(
                Break__c = '0',
                Do_you_want_to_set_this_a_recurring_shif__c = false,
                Start_Date__c = Date.today(),
                End_Date__c = Date.today(),
                Direction__c = direction.Id,
                Role__c = 'Support Worker',
                Get_Facility__c = true,
                Quantity__c = 1,
                Start_Time__c = Time.newInstance(9, 0, 0, 0),
                End_Time__c = Time.newInstance(13, 0, 0, 0),
                Facility__c = facility.Id,
                Status__c = 'Draft',
                Start_time_picklist__c = '9:00 am',
                End_time_picklist__c = '1:00 pm',
                Is_EOI__c = false,
                Shift_Type__c = 'General'
            );
            insert addShift;

            Add_Shift_Checklist__c checklist = new Add_Shift_Checklist__c(
                Description__c = 'Test Checklist',
                Mandatory__c = false,
                Add_Shift__c = addShift.Id
            );
            insert checklist;

            // Populate writable base fields (NOT Shift_Wage__c — it is a formula)
            ShiftwithStaff__c shift = new ShiftwithStaff__c(
                Add_Shift__c = addShift.Id,
                Staff__c = staff.Id,
                Role__c = 'Support Worker',
                Status__c = 'Completed',
                Start_Date__c = Date.today(),
                Shift_Facility__c = facility.Id,
                Shift_Category__c = 'Sleepover Shift',
                Attendence__c = true,
              
             
                
                Staff_Final_Hourly_Rate__c = 30,
                Sleepover_Night_Shift_Hourly_Rate__c = 40,
                Over_Time_Tier_One__c = 1,
                Over_Time_Tier_Two__c = 1,
                Extended_Duration__c = 1,
                Variance_Rate__c = 20,
                Broken_Shift_Allowance__c = 10,
                Broken_Extended_Duration__c = 1,
                Broken_Extended_Rate__c = 15
            );
            insert shift;

            ShiftwithStaff__c brokenShift = new ShiftwithStaff__c(
                Add_Shift__c = addShift.Id,
                Staff__c = staff.Id,
                Role__c = 'Support Worker',
                Status__c = 'Completed',
                Start_Date__c = Date.today(),
                Shift_Facility__c = facility.Id,
                Shift_Category__c = 'Standard',
                Broken_Shift__c = true,
                Attendence__c = true,
            
                Staff_Final_Hourly_Rate__c = 25,
                Extended_Duration__c = 1,
                Variance_Rate__c = 20,
                Broken_Shift_Allowance__c = 10
            );
            insert brokenShift;

            ShiftwithStaff__c normalShift = new ShiftwithStaff__c(
                Add_Shift__c = addShift.Id,
                Staff__c = staff.Id,
                Role__c = 'Support Worker',
                Status__c = 'Completed',
                Start_Date__c = Date.today(),
                Shift_Facility__c = facility.Id,
                Shift_Category__c = 'Standard',
                Broken_Shift__c = false,
                Attendence__c = true,
             
                Staff_Final_Hourly_Rate__c = 24
            );
            insert normalShift;

            ShiftwithStaff__c cancelledShift = new ShiftwithStaff__c(
                Add_Shift__c = addShift.Id,
                Staff__c = staff.Id,
                Role__c = 'Support Worker',
                Status__c = 'Cancelled',
                Start_Date__c = Date.today(),
                Shift_Facility__c = facility.Id,
                Shift_Category__c = 'Standard',
                Attendence__c = false,
            
                Staff_Final_Hourly_Rate__c = 25
            );
            insert cancelledShift;

            List<Services_and_Support_Plan__c> services = new List<Services_and_Support_Plan__c>();

            services.add(new Services_and_Support_Plan__c(
                Service_Type__c = catalogue.Id,
                Funds_Tracker__c = fundsTracker.Id,
                Qty__c = 4, GST__c = 'No',
                Date_of_Service__c = Date.today(),
                Client__c = client.Id,
                Services__c = 'Test Support Item',
                Services_name__c = 'Personal Care',
                State__c = 'NSW',
                ShiftwithStaff__c = shift.Id,
                Status__c = 'Invoice Generated',
                Edited_Unit_Price__c = 50
            ));

            services.add(new Services_and_Support_Plan__c(
                Service_Type__c = catalogue.Id,
                Funds_Tracker__c = fundsTracker.Id,
                Qty__c = 3, GST__c = 'No',
                Date_of_Service__c = Date.today(),
                Client__c = client.Id,
                Services__c = 'Test Support Item',
                Services_name__c = 'Community Access',
                State__c = 'NSW',
                ShiftwithStaff__c = brokenShift.Id,
                Status__c = 'Invoice Generated',
                Edited_Unit_Price__c = 50
            ));

            services.add(new Services_and_Support_Plan__c(
                Service_Type__c = catalogue.Id,
                Funds_Tracker__c = fundsTracker.Id,
                Qty__c = 5, GST__c = 'No',
                Date_of_Service__c = Date.today(),
                Client__c = client.Id,
                Services__c = 'Test Support Item',
                Services_name__c = 'Personal Care',
                State__c = 'NSW',
                ShiftwithStaff__c = normalShift.Id,
                Status__c = 'Not Yet Invoiced',
                Edited_Unit_Price__c = 20
            ));

            services.add(new Services_and_Support_Plan__c(
                Service_Type__c = catalogue.Id,
                Funds_Tracker__c = fundsTracker.Id,
                Qty__c = 1, GST__c = 'No',
                Date_of_Service__c = Date.today(),
                Client__c = client.Id,
                Services__c = 'Test Support Item',
                Services_name__c = 'Cancelled Service',
                State__c = 'NSW',
                ShiftwithStaff__c = cancelledShift.Id,
                Status__c = 'Cancelled',
                Bill_Participant__c = true,
                Edited_Unit_Price__c = 80
            ));

            services.add(new Services_and_Support_Plan__c(
                Service_Type__c = catalogue.Id,
                Funds_Tracker__c = fundsTracker.Id,
                Qty__c = 1, GST__c = 'No',
                Date_of_Service__c = Date.today(),
                Client__c = client.Id,
                Services__c = 'Test Support Item',
                Services_name__c = 'No Charge Service',
                State__c = 'NSW',
                ShiftwithStaff__c = cancelledShift.Id,
                Status__c = 'Cancelled',
                Bill_Participant__c = false,
                Edited_Unit_Price__c = 60
            ));

            services.add(new Services_and_Support_Plan__c(
                Service_Type__c = catalogue.Id,
                Funds_Tracker__c = fundsTracker.Id,
                Qty__c = 1, GST__c = 'No',
                Date_of_Service__c = Date.today(),
                Client__c = client.Id,
                Services__c = 'Test Support Item',
                Services_name__c = 'Unassigned Service',
                State__c = 'NSW',
                ShiftwithStaff__c = normalShift.Id,
                Status__c = 'Not Yet Invoiced',
                Un_Assigned_Service__c = true,
                Edited_Unit_Price__c = 40
            ));

            Services_and_Support_Plan__c service = new Services_and_Support_Plan__c(
                Service_Type__c = catalogue.Id,
                Service_Users__c = staff.Id,
                Funds_Tracker__c = fundsTracker.Id,
                Qty__c = 5,
                GST__c = 'No',
                Date_of_Service__c = Date.today(),
                Client__c = client.Id,
                Services__c = 'Assistance Animals',
                State__c = 'ACT',
                Start_Time__c = '3:30 am',
                End_Time__c = '5:30 am',
                ShiftwithStaff__c = shift.Id
            );
            insert service;

            insert services;

            ClientFundTrackerJN__c clientFundTracker = new ClientFundTrackerJN__c(
                Participant__c = client.Id,
                Funds_Tracker__c = fundsTracker.Id,
                NDIS_Support_Catalogue__c = catalogue.Id,
                Amount__c = 1000,
                Edited_Catelog_Name__c = 'Test Support Item',
                Shift_Type__c = 'General'
            );
            insert clientFundTracker;

            Reimbursement__c reimbursement = new Reimbursement__c(
                ShiftwithStaff__c = shift.Id,
                Approval_Status__c = 'Approved',
                Total_Amount__c = 100,
                Amount__c = 100
            );
            insert reimbursement;

            Participant_Reimbrusement__c participantReimbursement = new Participant_Reimbrusement__c(
                Reimbrusement_Id__c = reimbursement.Id,
                Reimbrusement_Amount__c = 100
            );
            insert participantReimbursement;

            ShiftWithStaff_Activity__c activity = new ShiftWithStaff_Activity__c(
                ShiftwithStaff__c = shift.Id,
                Notes__c = 'Test activity'
            );
            insert activity;

            Exported_Template__c template = new Exported_Template__c(
                Name = 'Test Smart Report Template',
                ExportedTemplate_To_Facility__c = facility.Id,
                Template_JSON__c = '{"test":"data"}',
                Report_Module__c = true,
                Report_Type__c = 'Shift'
            );
            insert template;
        }
    }

    private static User getRunUser() {
        return [
            SELECT Id FROM User
            WHERE Email = 'smartreports.test@example.com' LIMIT 1
        ];
    }

    private static User getManagerUser() {
        return [
            SELECT Id FROM User
            WHERE Email = 'smartreports.manager@example.com' LIMIT 1
        ];
    }

    // =================================================================
    // BASIC QUERY TESTS
    // =================================================================

    @IsTest
    static void testRoleAndStaffQueries() {
        Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];

        System.runAs(getRunUser()) {
            Test.startTest();

            SmartReportsHandler.getRolesByFacilities(new List<Id>{ facility.Id });
            SmartReportsHandler.getRolesByFacilities(new List<Id>());
            SmartReportsHandler.getRolesByFacilities(null);

            SmartReportsHandler.getStaffByFacilityAndRoles(
                facility.Id, new List<String>{ 'Support Worker' }, 'Full-time'
            );
            SmartReportsHandler.getStaffByFacilityAndRoles(
                facility.Id, new List<String>{ 'Support Worker' }, 'Part-time'
            );
            SmartReportsHandler.getStaffByFacilityAndRoles(
                facility.Id, new List<String>{ 'Support Worker' }, 'Full-time and part-time'
            );
            SmartReportsHandler.getStaffByFacilityAndRoles(
                facility.Id, new List<String>(), 'All'
            );
            SmartReportsHandler.getStaffByFacilityAndRoles(
                facility.Id, null, 'All'
            );
            SmartReportsHandler.getStaffByFacilityAndRoles(
                null, new List<String>(), 'All'
            );

            Test.stopTest();
        }
    }

    @IsTest
    static void testShiftWithSmartStaffData() {
        Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        List<Id> facilityIds = new List<Id>{ facility.Id };
        List<Id> staffIds = new List<Id>{ staff.Id };
        String s = String.valueOf(Date.today().addMonths(-3));
        String e = String.valueOf(Date.today());

        System.runAs(getRunUser()) {
            Test.startTest();
            SmartReportsHandler.getShiftWithSmartStaffData(
                new List<String>{ 'Support Worker' }, 'Full-time', s, e, 'Facility', facilityIds, staffIds);
            SmartReportsHandler.getShiftWithSmartStaffData(
                new List<String>{ 'All' }, 'Full-time and part-time', s, e, 'Participant', facilityIds, null);
            SmartReportsHandler.getShiftWithSmartStaffData(
                new List<String>(), 'Part-time', s, e, 'Other', facilityIds, staffIds);
            SmartReportsHandler.getShiftWithSmartStaffData(
                new List<String>(), 'All', s, e, 'All', facilityIds, new List<Id>());

            Boolean threw = false;
            try {
                SmartReportsHandler.getShiftWithSmartStaffData(
                    new List<String>{ 'All' }, 'All', 'not-a-date', e, 'All', facilityIds, null);
            } catch (Exception ex) {
                threw = true;
            }
            Test.stopTest();
        }
    }

    @IsTest
    static void testTemplates() {
        Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];

        System.runAs(getRunUser()) {
            Test.startTest();

            SmartReportsHandler.getTemplatesByFacility(facility.Id, 'Shift');
            SmartReportsHandler.getTemplatesByFacility(facility.Id, 'Participant');

            Exported_Template__c tpl = SmartReportsHandler.createTemplate(
                'Brand New Template', facility.Id, '{"k":"v"}', null, 'Shift'
            );

            SmartReportsHandler.createTemplate(
                'Brand New Template', facility.Id, '{"k":"v2"}', tpl.Id, 'Participant'
            );

            try {
                SmartReportsHandler.createTemplate(
                    'Brand New Template', facility.Id, '{}', null, 'Shift'
                );
            } catch (Exception ex) {}

            try {
                SmartReportsHandler.createTemplate(
                    '', facility.Id, '{}', null, 'Shift'
                );
            } catch (Exception ex) {}

            Test.stopTest();
        }
    }

    @IsTest
    static void testRejectedShifts() {
        Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
        Direction__c direction = [SELECT Id FROM Direction__c LIMIT 1];

        Add_Shift__c rejectedAddShift = new Add_Shift__c(
            Break__c = '0',
            Do_you_want_to_set_this_a_recurring_shif__c = false,
            Start_Date__c = Date.today(),
            End_Date__c = Date.today(),
            Direction__c = direction.Id,
            Role__c = 'Support Worker',
            Get_Facility__c = true,
            Quantity__c = 1,
            Start_Time__c = Time.newInstance(9, 0, 0, 0),
            End_Time__c = Time.newInstance(13, 0, 0, 0),
            Facility__c = facility.Id,
            Status__c = 'Draft',
            Start_time_picklist__c = '9:00 am',
            End_time_picklist__c = '1:00 pm',
            Is_EOI__c = false,
            Shift_Type__c = 'General'
        );
        insert rejectedAddShift;

        Add_Shift__c reassignedAddShift = new Add_Shift__c(
            Break__c = '0',
            Do_you_want_to_set_this_a_recurring_shif__c = false,
            Start_Date__c = Date.today(),
            End_Date__c = Date.today(),
            Direction__c = direction.Id,
            Role__c = 'Support Worker',
            Get_Facility__c = true,
            Quantity__c = 1,
            Start_Time__c = Time.newInstance(9, 0, 0, 0),
            End_Time__c = Time.newInstance(13, 0, 0, 0),
            Facility__c = facility.Id,
            Status__c = 'Draft',
            Start_time_picklist__c = '9:00 am',
            End_time_picklist__c = '1:00 pm',
            Is_EOI__c = false,
            Shift_Type__c = 'General'
        );
        insert reassignedAddShift;

        ShiftwithStaff__c origRejected = new ShiftwithStaff__c(
            Add_Shift__c = rejectedAddShift.Id,
            Staff__c = staff.Id,
            Role__c = 'Support Worker',
            Status__c = 'Completed',
            Start_Date__c = Date.today(),
            Shift_Facility__c = facility.Id,
            Attendence__c = false,
            Shift_Rejected__c = true
        );
        insert origRejected;

        ShiftwithStaff__c reassigned = new ShiftwithStaff__c(
            Add_Shift__c = reassignedAddShift.Id,
            Staff__c = staff.Id,
            Role__c = 'Support Worker',
            Status__c = 'Completed',
            Start_Date__c = Date.today(),
            Shift_Facility__c = facility.Id,
            Attendence__c = true
        );
        insert reassigned;

        origRejected.Reassigned_Shift_Id__c = reassigned.Id;
        update origRejected;

        List<Id> facilityIds = new List<Id>{ facility.Id };
        List<Id> staffIds = new List<Id>{ staff.Id };

        System.runAs(getRunUser()) {
            Test.startTest();
            SmartReportsHandler.getRejectedShiftsForSmartReports(
                String.valueOf(Date.today().addDays(-30)),
                String.valueOf(Date.today()),
                org.Id, facilityIds, staffIds,
                new List<String>{ 'Support Worker' }
            );

            SmartReportsHandler.getRejectedShiftsForSmartReports(
                String.valueOf(Date.today().addDays(-30)),
                String.valueOf(Date.today()),
                org.Id, facilityIds, null,
                new List<String>{ 'All' }
            );
            Test.stopTest();
        }
    }

    @IsTest
    static void testReimbursements() {
        Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
        List<Id> facilityIds = new List<Id>{ facility.Id };

        System.runAs(getRunUser()) {
            Test.startTest();
            SmartReportsHandler.getAllReimbursements(
                String.valueOf(Date.today().addDays(-30)), String.valueOf(Date.today()), 'All', facilityIds);
            SmartReportsHandler.getAllReimbursements(
                String.valueOf(Date.today().addDays(-30)), String.valueOf(Date.today()), 'Approved', facilityIds);
            SmartReportsHandler.getAllReimbursements(
                String.valueOf(Date.today()), '', 'Rejected', facilityIds);
            Test.stopTest();
        }
    }

    @IsTest
    static void testFetchStaffAndFacilities() {
        Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        List<Id> facilityIds = new List<Id>{ facility.Id };
        List<Id> staffIds = new List<Id>{ staff.Id };

        System.runAs(getRunUser()) {
            Test.startTest();
            SmartReportsHandler.fetchStaffs(facilityIds, 'Active', 'Full-time', staffIds, new List<String>{ 'Support Worker' });
            SmartReportsHandler.fetchStaffs(facilityIds, 'Inactive', 'Part-time', staffIds, new List<String>{ 'Support Worker' });
            SmartReportsHandler.fetchStaffs(facilityIds, 'All', 'All', null, null);
            SmartReportsHandler.fetchFacilitiess(facilityIds, 'Inactive');
            SmartReportsHandler.fetchFacilitiess(facilityIds, 'All');
            Test.stopTest();
        }
    }

    @IsTest
    static void testStaffUtilization() {
        Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];

        System.runAs(getRunUser()) {
            Test.startTest();
            SmartReportsHandler.getStaffUtilizationData(
                facility.Id, new List<String>{ 'Support Worker' }, 'Full-time',
                String.valueOf(Date.today().addDays(-7)), String.valueOf(Date.today()));
            SmartReportsHandler.getStaffUtilizationData(
                facility.Id, new List<String>{ 'Support Worker' }, 'Full-time and part-time',
                String.valueOf(Date.today().addDays(-7)), String.valueOf(Date.today()));

            Boolean threw = false;
            try {
                SmartReportsHandler.getStaffUtilizationData(
                    'All', new List<String>{ 'All' }, 'All',
                    '07-09-2025', String.valueOf(Date.today()));
            } catch (Exception ex) {
                threw = true;
            }
            Test.stopTest();
        }
    }

    @IsTest
    static void testStaffUtilizationAsFacilityUser() {
        Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];

        System.runAs(getManagerUser()) {
            Test.startTest();
            SmartReportsHandler.getStaffUtilizationData(
                'All', new List<String>{ 'All' }, 'All',
                String.valueOf(Date.today().addDays(-7)), String.valueOf(Date.today()));
            SmartReportsHandler.getStaffUtilizationData(
                facility.Id, new List<String>{ 'Support Worker' }, 'Full-time and part-time',
                String.valueOf(Date.today().addDays(-7)), String.valueOf(Date.today()));
            Test.stopTest();
        }
    }

    @IsTest
    static void testReimbursementsAsFacilityUser() {
        Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
        List<Id> facilityIds = new List<Id>{ facility.Id };

        System.runAs(getManagerUser()) {
            Test.startTest();
            SmartReportsHandler.getAllReimbursements(
                String.valueOf(Date.today().addDays(-30)), String.valueOf(Date.today()), 'All', facilityIds);
            Test.stopTest();
        }
    }

    @IsTest
    static void testReimbursementsAsRoleUser() {
        Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
        List<Id> facilityIds = new List<Id>{ facility.Id };

        User manager = getManagerUser();
        Boolean roleAssigned = false;

        System.runAs(new User(Id = UserInfo.getUserId())) {
            try {
                UserRole role = new UserRole(
                    Name = 'SmartReports Test Role',
                    DeveloperName = 'SmartReports_Test_Role'
                );
                insert role;
                manager.UserRoleId = role.Id;
                update manager;
                roleAssigned = true;
            } catch (Exception ex) {
                System.debug('UserRole assignment skipped: ' + ex.getMessage());
            }
        }

        System.runAs(manager) {
            Test.startTest();
            SmartReportsHandler.getAllReimbursements(
                String.valueOf(Date.today().addDays(-30)), String.valueOf(Date.today()), 'Approved', facilityIds);
            SmartReportsHandler.getAllReimbursements(
                String.valueOf(Date.today().addDays(-30)), String.valueOf(Date.today()), 'All', new List<Id>());
            Test.stopTest();
        }
    }

    @IsTest
    static void testFavoritesAndLogs() {
        Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
        Favorite_Report__c fav = new Favorite_Report__c(Name = 'Test Favorite Report');
        insert fav;

        System.runAs(getRunUser()) {
            Test.startTest();
            SmartReportsHandler.createFavorite(facility.Id, 'Shift', 'key1', '{"a":1}');
            SmartReportsHandler.deleteFavorite(fav.Id);
            Id logId = SmartReportsHandler.createShiftReportLog(
                String.valueOf(Date.today().addDays(-7)), String.valueOf(Date.today()),
                facility.Id, 'PDF', 'Shift', 'Last 7 Days', '{"k":"v"}', 'FILTER_1');
            SmartReportsHandler.createShiftReportLog('', '', facility.Id, 'PDF', 'Shift', 'Today', '', '');
            SmartReportsHandler.updateShiftReportLog(logId, true);
            try { SmartReportsHandler.updateShiftReportLog(null, true); } catch (Exception ex) {}
            SmartReportsHandler.ReportLogResponse logs =
                SmartReportsHandler.getReportExportLogs(facility.Id);
            Test.stopTest();
        }
    }

    @IsTest
    static void testMiscSelectionAndFacilitySends() {
        Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        List<Id> facilityIds = new List<Id>{ facility.Id };

        System.runAs(getRunUser()) {
            Test.startTest();
            SmartReportsHandler.processStaffSelection(staff.Id);
            SmartReportsHandler.processStaffSelection(null);
            SmartReportsHandler.sendFacilityToApex(facilityIds);
            SmartReportsHandler.sendFacilityToApex(new List<Id>());
            SmartReportsHandler.sendFacilityToApex(null);
            SmartReportsHandler.sendFacilityToApexforParticipant(facilityIds);
            SmartReportsHandler.sendFacilityToApexforParticipant(new List<Id>());
            SmartReportsHandler.sendFacilityToApexforParticipant(null);
            Test.stopTest();
        }
    }

    @IsTest
    static void testParticipantServiceDelivery() {
        Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
        Client__c client = [SELECT Id FROM Client__c LIMIT 1];
        List<Id> facilityIds = new List<Id>{ facility.Id };

        System.runAs(getRunUser()) {
            Test.startTest();
            SmartReportsHandler.getParticipantServiceDeliveryReport(
                new List<Id>(), new List<Id>(), Date.today().addDays(-7), Date.today());
            Test.stopTest();
        }
    }

    @IsTest
    static void testSendReportEmail() {
        String base64Data = EncodingUtil.base64Encode(Blob.valueOf('Smart Reports Test'));

        System.runAs(getRunUser()) {
            Test.startTest();
            SmartReportsHandler.sendReportEmail(
                base64Data, 'SmartReport.csv', 'test@example.com', null,
                'Smart Report Test', 'Test report', 'CSV');
            SmartReportsHandler.sendReportEmail(
                '', 'SmartReport.pdf', 'test@example.com', null,
                'Subject', 'Body', 'PDF');

            Boolean threw = false;
            try {
                SmartReportsHandler.sendReportEmail(
                    base64Data, 'SmartReport.pdf', '', null,
                    'Subject', 'Body', 'PDF');
            } catch (Exception ex) {
                threw = true;
            }
            Test.stopTest();
        }
    }

    @IsTest
    static void testExportLogQueriesAndFavorites() {
        Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];

        Report_Export_Log__c favLog = new Report_Export_Log__c(
            Start_Date__c = Date.today(),
            End_Date__c = Date.today(),
            Facility__c = facility.Id,
            Export_Type__c = 'PDF',
            Report_Type__c = 'Shift',
            Date_Range__c = 'Today',
            Filters_JSON__c = '{}',
            Filter_Key__c = 'favorite-test',
            Exported_On__c = System.now(),
            Favourite__c = true
        );
        insert favLog;

        System.runAs(getRunUser()) {
            Test.startTest();
            SmartReportsHandler.getFavoriteReports(facility.Id);
            SmartReportsHandler.getAllReportExportLogs(facility.Id);
            SmartReportsHandler.getReportExportLogs(facility.Id);
            Test.stopTest();
        }
    }

    @IsTest
    static void testParticipantServiceDeliveryWithFilters() {
        Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
        Client__c client = [SELECT Id FROM Client__c LIMIT 1];
        List<Id> facilityIds = new List<Id>{ facility.Id };
        List<Id> participantIds = new List<Id>{ client.Id };

        System.runAs(getRunUser()) {
            Test.startTest();
            SmartReportsHandler.getParticipantServiceDeliveryReport(
                facilityIds, participantIds, Date.today().addDays(-7), Date.today());
            SmartReportsHandler.getParticipantServiceDeliveryReport(
                facilityIds, new List<Id>(), Date.today().addDays(-7), Date.today());
            Test.stopTest();
        }
    }

    @IsTest
    static void testFetchFacilitiessActiveAndStaffEmpty() {
        Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
        List<Id> facilityIds = new List<Id>{ facility.Id };

        System.runAs(getRunUser()) {
            Test.startTest();
            SmartReportsHandler.fetchFacilitiess(facilityIds, 'Active');
            SmartReportsHandler.fetchFacilitiess(new List<Id>(), 'All');
            SmartReportsHandler.fetchStaffs(new List<Id>(), 'All', 'All', null, null);
            SmartReportsHandler.getRolesByFacilities(facilityIds);
            Test.stopTest();
        }
    }

    // =================================================================
    // GROSS PROFIT MARGIN REPORT TESTS
    // NOTE: We set writable base fields (Duration__c, Staff_Final_Hourly_Rate__c,
    //       Edited_Unit_Price__c, Qty__c) — NOT formula fields like
    //       Shift_Wage__c, Sleepover_Shift_Hours__c, OT Tier Rates, Amount__c.
    // =================================================================

    @IsTest
    static void testGrossProfitWithParticipantFilter() {
        Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
        Client__c client = [SELECT Id FROM Client__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        List<Id> facilityIds = new List<Id>{ facility.Id };

        System.runAs(getRunUser()) {
            Test.startTest();
            Map<String, Object> result = SmartReportsHandler.getGrossProfitMarginReport(
                facilityIds,
                new List<Id>{ client.Id },
                new List<Id>{ staff.Id },
                new List<String>{ 'Sleepover Shift', 'Standard' },
                Date.today().addMonths(-3),
                Date.today()
            );
            Test.stopTest();
        }
    }

    @IsTest
    static void testGrossProfitNoParticipantFilter() {
        Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
        List<Id> facilityIds = new List<Id>{ facility.Id };

        System.runAs(getRunUser()) {
            Test.startTest();
            Map<String, Object> result = SmartReportsHandler.getGrossProfitMarginReport(
                facilityIds, null, null, null,
                Date.today().addMonths(-3), Date.today());
            Test.stopTest();
        }
    }

    @IsTest
    static void testGrossProfitEmptyAndValidation() {
        Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
        List<Id> facilityIds = new List<Id>{ facility.Id };

        System.runAs(getRunUser()) {
            Test.startTest();
            Map<String, Object> empty = SmartReportsHandler.getGrossProfitMarginReport(
                facilityIds, null, null, null,
                Date.today().addDays(-3650), Date.today().addDays(-3640));

            Integer failures = 0;
            try { SmartReportsHandler.getGrossProfitMarginReport(null, null, null, null, Date.today(), Date.today()); } catch (Exception ex) { failures++; }
            try { SmartReportsHandler.getGrossProfitMarginReport(facilityIds, null, null, null, null, null); } catch (Exception ex) { failures++; }
            try { SmartReportsHandler.getGrossProfitMarginReport(facilityIds, null, null, null, Date.today(), Date.today().addDays(-5)); } catch (Exception ex) { failures++; }
            Test.stopTest();
        }
    }

  

    @IsTest
    static void testGrossProfitServiceCostAllocationBranches() {
        Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        Client__c client = [SELECT Id FROM Client__c LIMIT 1];
        Direction__c direction = [SELECT Id FROM Direction__c LIMIT 1];

        Add_Shift__c addShift = new Add_Shift__c(
            Break__c = '0',
            Do_you_want_to_set_this_a_recurring_shif__c = false,
            Start_Date__c = Date.today(),
            End_Date__c = Date.today(),
            Direction__c = direction.Id,
            Role__c = 'Support Worker',
            Get_Facility__c = true,
            Quantity__c = 1,
            Start_Time__c = Time.newInstance(9, 0, 0, 0),
            End_Time__c = Time.newInstance(17, 0, 0, 0),
            Facility__c = facility.Id,
            Status__c = 'Draft',
            Start_time_picklist__c = '9:00 am',
            End_time_picklist__c = '5:00 pm',
            Is_EOI__c = false,
            Shift_Type__c = 'General'
        );
        insert addShift;

        ShiftwithStaff__c shift = new ShiftwithStaff__c(
            Add_Shift__c = addShift.Id,
            Staff__c = staff.Id,
            Role__c = 'Support Worker',
            Status__c = 'Completed',
            Start_Date__c = Date.today(),
            Shift_Facility__c = facility.Id,
            Shift_Category__c = 'Standard',
            Broken_Shift__c = false,
            Attendence__c = true,
        
            Staff_Final_Hourly_Rate__c = 30
        );
        insert shift;

        List<Services_and_Support_Plan__c> services = new List<Services_and_Support_Plan__c>();

        services.add(new Services_and_Support_Plan__c(
            Date_of_Service__c = Date.today(),
            Client__c = client.Id,
            Services__c = 'Test Support Item',
            Services_name__c = 'Personal Care',
            ShiftwithStaff__c = shift.Id,
            Status__c = 'Invoice Generated',
            Edited_Unit_Price__c = 100,
            Qty__c = 3
        ));

        services.add(new Services_and_Support_Plan__c(
            Date_of_Service__c = Date.today(),
            Client__c = client.Id,
            Services__c = 'Test Support Item',
            Services_name__c = '',
            ShiftwithStaff__c = shift.Id,
            Status__c = 'Invoice Generated',
            Edited_Unit_Price__c = 50,
            Qty__c = 4
        ));

        services.add(new Services_and_Support_Plan__c(
            Date_of_Service__c = Date.today(),
            Client__c = client.Id,
            Services__c = 'Test Support Item',
            Services_name__c = 'Community Access',
            ShiftwithStaff__c = shift.Id,
            Status__c = 'Invoice Generated',
            Edited_Unit_Price__c = 50,
            Qty__c = 2
        ));

        services.add(new Services_and_Support_Plan__c(
            Date_of_Service__c = Date.today(),
            Client__c = client.Id,
            Services__c = 'Test Support Item',
            Services_name__c = 'Zero Service',
            ShiftwithStaff__c = shift.Id,
            Status__c = 'Invoice Generated',
            Edited_Unit_Price__c = 0,
            Qty__c = 0
        ));

        services.add(new Services_and_Support_Plan__c(
            Date_of_Service__c = Date.today(),
            Client__c = client.Id,
            Services__c = 'Test Support Item',
            Services_name__c = 'Unassigned Service',
            ShiftwithStaff__c = shift.Id,
            Status__c = 'Not Yet Invoiced',
            Un_Assigned_Service__c = true,
            Edited_Unit_Price__c = 40,
            Qty__c = 1
        ));

        services.add(new Services_and_Support_Plan__c(
            Date_of_Service__c = Date.today(),
            Client__c = client.Id,
            Services__c = 'Test Support Item',
            Services_name__c = 'Draft Service',
            ShiftwithStaff__c = shift.Id,
            Status__c = 'Draft',
            Edited_Unit_Price__c = 60,
            Qty__c = 1
        ));

        services.add(new Services_and_Support_Plan__c(
            Date_of_Service__c = Date.today(),
            Client__c = client.Id,
            Services__c = 'Test Support Item',
            Services_name__c = 'Cancelled No Charge',
            ShiftwithStaff__c = shift.Id,
            Status__c = 'Cancelled',
            Bill_Participant__c = false,
            Edited_Unit_Price__c = 70,
            Qty__c = 1
        ));

        insert services;

        List<Id> facilityIds = new List<Id>{ facility.Id };
        List<Id> participantIds = new List<Id>{ client.Id };

        System.runAs(getRunUser()) {
            Test.startTest();

            SmartReportsHandler.getGrossProfitMarginReport(
                facilityIds, participantIds, null, null,
                Date.today().addDays(-1), Date.today().addDays(1));

            SmartReportsHandler.getGrossProfitMarginReport(
                facilityIds, null, null, null,
                Date.today().addDays(-1), Date.today().addDays(1));

            Test.stopTest();
        }
    }

    @IsTest
    static void testGrossProfitReimbursementAllocationBranches() {
        Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        Client__c client = [SELECT Id FROM Client__c LIMIT 1];
        Direction__c direction = [SELECT Id FROM Direction__c LIMIT 1];

        Add_Shift__c addShift = new Add_Shift__c(
            Break__c = '0',
            Do_you_want_to_set_this_a_recurring_shif__c = false,
            Start_Date__c = Date.today(),
            End_Date__c = Date.today(),
            Direction__c = direction.Id,
            Role__c = 'Support Worker',
            Get_Facility__c = true,
            Quantity__c = 1,
            Start_Time__c = Time.newInstance(9, 0, 0, 0),
            End_Time__c = Time.newInstance(17, 0, 0, 0),
            Facility__c = facility.Id,
            Status__c = 'Draft',
            Start_time_picklist__c = '9:00 am',
            End_time_picklist__c = '5:00 pm',
            Is_EOI__c = false,
            Shift_Type__c = 'General'
        );
        insert addShift;

        ShiftwithStaff__c shift = new ShiftwithStaff__c(
            Add_Shift__c = addShift.Id,
            Staff__c = staff.Id,
            Role__c = 'Support Worker',
            Status__c = 'Completed',
            Start_Date__c = Date.today(),
            Shift_Facility__c = facility.Id,
            Shift_Category__c = 'Standard',
            Broken_Shift__c = false,
            Attendence__c = true,
          
            Staff_Final_Hourly_Rate__c = 30
        );
        insert shift;

        Services_and_Support_Plan__c service = new Services_and_Support_Plan__c(
            Date_of_Service__c = Date.today(),
            Client__c = client.Id,
            Services__c = 'Test Support Item',
            Services_name__c = 'Personal Care',
            ShiftwithStaff__c = shift.Id,
            Status__c = 'Invoice Generated',
            Edited_Unit_Price__c = 100,
            Qty__c = 5
        );
        insert service;

        Reimbursement__c reimb1 = new Reimbursement__c(
            ShiftwithStaff__c = shift.Id,
            Approval_Status__c = 'Approved',
            Total_Amount__c = 150,
            Amount__c = 100
        );
        insert reimb1;

        Reimbursement__c reimb2 = new Reimbursement__c(
            ShiftwithStaff__c = shift.Id,
            Approval_Status__c = 'Approved',
            Amount__c = 80
        );
        insert reimb2;

        Reimbursement__c reimb3 = new Reimbursement__c(
            ShiftwithStaff__c = shift.Id,
            Approval_Status__c = 'Approved',
            Total_Amount__c = 0,
            Amount__c = 0
        );
        insert reimb3;

        Participant_Reimbrusement__c pr1 = new Participant_Reimbrusement__c(
            Reimbrusement_Id__c = reimb1.Id,
            Reimbrusement_Amount__c = 150
        );
        insert pr1;

        Participant_Reimbrusement__c pr2 = new Participant_Reimbrusement__c(
            Reimbrusement_Id__c = reimb2.Id,
            Reimbrusement_Amount__c = 80
        );
        insert pr2;

        List<Id> facilityIds = new List<Id>{ facility.Id };
        List<Id> participantIds = new List<Id>{ client.Id };

        System.runAs(getRunUser()) {
            Test.startTest();

            SmartReportsHandler.getGrossProfitMarginReport(
                facilityIds, participantIds, null, null,
                Date.today().addDays(-1), Date.today().addDays(1));

            SmartReportsHandler.getGrossProfitMarginReport(
                facilityIds, null, null, null,
                Date.today().addDays(-1), Date.today().addDays(1));

            Test.stopTest();
        }
    }

    @IsTest
    static void testGrossProfitShiftWithAddShiftFacilityFallback() {
        Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        Client__c client = [SELECT Id FROM Client__c LIMIT 1];
        Direction__c direction = [SELECT Id FROM Direction__c LIMIT 1];

        Add_Shift__c addShift = new Add_Shift__c(
            Break__c = '0',
            Do_you_want_to_set_this_a_recurring_shif__c = false,
            Start_Date__c = Date.today(),
            End_Date__c = Date.today(),
            Direction__c = direction.Id,
            Role__c = 'Support Worker',
            Get_Facility__c = true,
            Quantity__c = 1,
            Start_Time__c = Time.newInstance(9, 0, 0, 0),
            End_Time__c = Time.newInstance(17, 0, 0, 0),
            Facility__c = facility.Id,
            Status__c = 'Draft',
            Start_time_picklist__c = '9:00 am',
            End_time_picklist__c = '5:00 pm',
            Is_EOI__c = false,
            Shift_Type__c = 'General'
        );
        insert addShift;

        ShiftwithStaff__c shift = new ShiftwithStaff__c(
            Add_Shift__c = addShift.Id,
            Staff__c = staff.Id,
            Role__c = 'Support Worker',
            Status__c = 'Completed',
            Start_Date__c = Date.today(),
            Shift_Category__c = 'Standard',
            Broken_Shift__c = false,
            Attendence__c = true,
         
            Staff_Final_Hourly_Rate__c = 30
        );
        insert shift;

        Services_and_Support_Plan__c service = new Services_and_Support_Plan__c(
            Date_of_Service__c = Date.today(),
            Client__c = client.Id,
            Services__c = 'Test Support Item',
            Services_name__c = 'Personal Care',
            ShiftwithStaff__c = shift.Id,
            Status__c = 'Invoice Generated',
            Edited_Unit_Price__c = 100,
            Qty__c = 3
        );
        insert service;

        List<Id> facilityIds = new List<Id>{ facility.Id };

        System.runAs(getRunUser()) {
            Test.startTest();
            SmartReportsHandler.getGrossProfitMarginReport(
                facilityIds, null, null, null,
                Date.today().addDays(-1), Date.today().addDays(1));
            Test.stopTest();
        }
    }

    @IsTest
    static void testGrossProfitCancelledShiftCost() {
        Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        Direction__c direction = [SELECT Id FROM Direction__c LIMIT 1];

        Add_Shift__c addShift = new Add_Shift__c(
            Break__c = '0',
            Do_you_want_to_set_this_a_recurring_shif__c = false,
            Start_Date__c = Date.today(),
            End_Date__c = Date.today(),
            Direction__c = direction.Id,
            Role__c = 'Support Worker',
            Get_Facility__c = true,
            Quantity__c = 1,
            Start_Time__c = Time.newInstance(9, 0, 0, 0),
            End_Time__c = Time.newInstance(17, 0, 0, 0),
            Facility__c = facility.Id,
            Status__c = 'Draft',
            Start_time_picklist__c = '9:00 am',
            End_time_picklist__c = '5:00 pm',
            Is_EOI__c = false,
            Shift_Type__c = 'General'
        );
        insert addShift;

        ShiftwithStaff__c cancelledShift = new ShiftwithStaff__c(
            Add_Shift__c = addShift.Id,
            Staff__c = staff.Id,
            Role__c = 'Support Worker',
            Status__c = 'Cancelled',
            Start_Date__c = Date.today(),
            Shift_Facility__c = facility.Id,
            Shift_Category__c = 'Standard',
            Attendence__c = false,
        
            Staff_Final_Hourly_Rate__c = 30
        );
        insert cancelledShift;

        List<Id> facilityIds = new List<Id>{ facility.Id };

        System.runAs(getRunUser()) {
            Test.startTest();
            SmartReportsHandler.getGrossProfitMarginReport(
                facilityIds, null, null, null,
                Date.today().addDays(-1), Date.today().addDays(1));
            Test.stopTest();
        }
    }

    @IsTest
    static void testGrossProfitShiftsInStatuses() {
        Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        Client__c client = [SELECT Id FROM Client__c LIMIT 1];
        Direction__c direction = [SELECT Id FROM Direction__c LIMIT 1];

        Add_Shift__c addShift = new Add_Shift__c(
            Break__c = '0',
            Do_you_want_to_set_this_a_recurring_shif__c = false,
            Start_Date__c = Date.today(),
            End_Date__c = Date.today(),
            Direction__c = direction.Id,
            Role__c = 'Support Worker',
            Get_Facility__c = true,
            Quantity__c = 1,
            Start_Time__c = Time.newInstance(9, 0, 0, 0),
            End_Time__c = Time.newInstance(17, 0, 0, 0),
            Facility__c = facility.Id,
            Status__c = 'Draft',
            Start_time_picklist__c = '9:00 am',
            End_time_picklist__c = '5:00 pm',
            Is_EOI__c = false,
            Shift_Type__c = 'General'
        );
        insert addShift;

        ShiftwithStaff__c unassignedShift = new ShiftwithStaff__c(
            Add_Shift__c = addShift.Id,
            Role__c = 'Support Worker',
            Status__c = 'Unassigned',
            Start_Date__c = Date.today(),
            Shift_Facility__c = facility.Id,
            Shift_Category__c = 'Standard',
            Attendence__c = false,
         
            Staff_Final_Hourly_Rate__c = 30
        );
        insert unassignedShift;

        Services_and_Support_Plan__c service = new Services_and_Support_Plan__c(
            Date_of_Service__c = Date.today(),
            Client__c = client.Id,
            Services__c = 'Test Support Item',
            Services_name__c = 'Personal Care',
            ShiftwithStaff__c = unassignedShift.Id,
            Status__c = 'Not Yet Invoiced',
            Edited_Unit_Price__c = 50,
            Qty__c = 3
        );
        insert service;

        List<Id> facilityIds = new List<Id>{ facility.Id };

        System.runAs(getRunUser()) {
            Test.startTest();
            SmartReportsHandler.getGrossProfitMarginReport(
                facilityIds, null, null, null,
                Date.today().addDays(-1), Date.today().addDays(1));
            Test.stopTest();
        }
    }
}