@isTest
public class RosterCreationRecuringServiceTest {

    @testSetup
    static void setupTestData() {
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

        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        User user = new User(
            Alias = 'praveen',
            Email = 'manualtesting.21294633@hotmail.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'StaffOne209463',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey = 'America/New_York',
            UserName = 'manualtesting.21294633@hotmail.com',
            Organization_Name__c = 'Ashfield Consultants'
        );
        insert user;

        System.runAs(user) {
            Facility__c fac = new Facility__c(
                Name = 'Ashfield Consultants',
                Address__City__s = 'Crace',
                Address__Street__s = '8 Keewong Street',
                Address__StateCode__s = 'ACT',
                Address__PostalCode__s = '2911',
                Address__CountryCode__s = 'AU',
                Email__c = 'testonefacility@gmail.com',
                Status__c = true,
                Organisation__c = org.Id,
                ABN__c = '12234567',
                Phone__c = '12323432'
            );
            insert fac;

            Staff__c staff = new Staff__c(
                Last_Name__c = 'Test staff',
                Name = 'praveen1',
                Name__c = 'abcd',
                Contact_Number__c = '56789908743',
                Email_Address__c = 'manualtesting.21294633@hotmail.com',
                Facility__c = fac.Id,
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
                Emp_exit_date__c = Date.newInstance(2028, 01, 05),
                Emp_Start_Date__c = Date.newInstance(2023, 02, 01),
                Payee_ETP_Payment_Date__c = Date.newInstance(2025, 02, 04),
                Date_Of_Birth__c = Date.newInstance(2001, 02, 04),
                role__c = 'Admin',
                Residency_Type__c = 'Australian',
                Expiry_Date__c = Date.newInstance(2025, 02, 19),
                Type__c = 'Visa Status',
                Working_Hours_Rate__c = 50,
                Final_Overall_Rate__c = 150,
                Saturday_Hourly_Rate__c = 130,
                Sunday_Hourly_Rate__c = 50
            );
            insert staff;

            Client__c cli = new Client__c(
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
                Primary_Contact_Number__c = '0433123123'
            );
            insert cli;

            NDIS_Support_Catalogue__c NSC = new NDIS_Support_Catalogue__c(
                Name = 'Assistance Animals',
                ACT__c = 100,
                NSW__c = 100,
                NT__c = 100,
                QLD__c = 100,
                SA__c = 100,
                TAS__c = 100,
                VIC__c = 100,
                WA__c = 100
            );
            insert NSC;

            Funds_Tracker__c funds = new Funds_Tracker__c(
                Registration_Group__c = 'Assistance Animals',
                Amount_approved__c = 11000,
                Client__c = cli.Id,
                Plan_Type__c = 'Plan Managed',
                Approved_Date__c = Date.newInstance(2024, 03, 16)
            );
            insert funds;

            Direction__c dire = new Direction__c(Name = 'Test Directions');
            insert dire;

            Add_Shift__c shift = new Add_Shift__c(
                Break__c = '30',
                Do_you_want_to_set_this_a_recurring_shif__c = true,
                Start_Date__c = Date.newInstance(2025, 10, 16),
                Direction__c = dire.Id,
                Role__c = 'Admin',
                Get_Facility__c = true,
                Quantity__c = 5,
                Start_Time__c = Time.newInstance(3, 30, 0, 0),
                End_Time__c = Time.newInstance(5, 0, 0, 0),
                Facility__c = fac.Id,
                Status__c = 'Draft',
                Start_time_picklist__c = '3:30 am',
                End_time_picklist__c = '5:00 am',
                Location__StateCode__s = 'ACT',
                Location__CountryCode__s = 'AU',
                Location__PostalCode__s = '2911',
                Shift_Type__c = 'General'
            );
            insert shift;

            ShiftwithStaff__c shiftStaff = new ShiftwithStaff__c(
                Add_Shift__c = shift.Id,
                Attendence__c = true,
                Comments__c = 'test comments',
                Staff__c = staff.Id,
                Role__c = 'Admin',
                Status__c = 'Accepted',
                Recurring_Date__c = shift.Start_Date__c,
                Log_In_Date_Time__c = Time.newInstance(1, 30, 0, 0),
                Log_Out_Date_Time__c = Time.newInstance(10, 0, 0, 0)
            );
            insert shiftStaff;

            Services_and_Support_Plan__c servicePlan = new Services_and_Support_Plan__c(
                Service_Type__c = NSC.Id,
                Service_Users__c = staff.Id,
                Funds_Tracker__c = funds.Id,
                Qty__c = 5,
                GST__c = 'No',
                Date_of_Service__c = Date.today(),
                Client__c = cli.Id,
                Services__c = 'Assistance Animals',
                State__c = 'ACT',
                Start_Time_24_Format__c = Time.newInstance(3, 30, 0, 0),
                End_Time_24_Format__c = Time.newInstance(5, 30, 0, 0),
                ShiftwithStaff__c = shiftStaff.Id
            );
            insert servicePlan;

            Add_Shift__c shift1 = new Add_Shift__c(
                Break__c = '30',
                Do_you_want_to_set_this_a_recurring_shif__c = true,
                Start_Date__c = Date.newInstance(2025, 12, 16),
                Role__c = 'Admin',
                Get_Facility__c = true,
                Quantity__c = 5,
                Start_Time__c = Time.newInstance(18, 30, 0, 0),
                End_Time__c = Time.newInstance(22, 0, 0, 0),
                Facility__c = fac.Id,
                Status__c = 'Draft',
                Start_time_picklist__c = '6:30 pm',
                End_time_picklist__c = '10:00 pm',
                Location__StateCode__s = 'ACT',
                Location__CountryCode__s = 'AU',
                Location__PostalCode__s = '2911',
                Shift_Type__c = 'Night'
            );
            insert shift1;

            ShiftwithStaff__c shiftStaff1 = new ShiftwithStaff__c(
                Add_Shift__c = shift1.Id,
                Attendence__c = true,
                Comments__c = 'test comments',
                Staff__c = staff.Id,
                Role__c = 'Admin',
                Status__c = 'Accepted',
                Recurring_Date__c = shift1.Start_Date__c
            );
            insert shiftStaff1;
        }
    }

    @isTest
    static void testCreateRecurringServices() {
        User user = [SELECT Id FROM User WHERE Email = 'manualtesting.21294633@hotmail.com' LIMIT 1];

        System.runAs(user) {
            Date shiftDate = Date.newInstance(2025, 10, 16);

            ShiftwithStaff__c parentShiftStaff = [ 
                SELECT Id FROM ShiftwithStaff__c
                WHERE add_shift__r.Start_Date__c = :shiftDate
                AND Staff__r.Email_Address__c = 'manualtesting.21294633@hotmail.com'
                LIMIT 1
            ];

            List<ShiftwithStaff__c> shiftStaffList = [
                SELECT Id, Date__c, Recurring_Date__c FROM ShiftwithStaff__c
                WHERE add_shift__r.Start_Date__c >= :shiftDate
            ];

            Map<Id, Date> recurringDates = new Map<Id, Date>();
            for (ShiftwithStaff__c ss : shiftStaffList) {
                recurringDates.put(ss.Id, ss.Date__c);
            }

            Test.startTest();
            Map<String, Object> result = RosterCreationRecuringService.createRecurringServices(
                parentShiftStaff.Id, 
                shiftStaffList, 
                recurringDates
            );
            Test.stopTest();

            System.assert((Boolean) result.get('isSuccess'), 'The service creation should be successful');
            System.assertEquals('Services created successfully', (String) result.get('ServicesMessage'));

            // Validate the inserted Services_and_Support_Plan__c records
            List<Services_and_Support_Plan__c> createdServices = [
                SELECT Id, ShiftwithStaff__c, Status__c
                FROM Services_and_Support_Plan__c
                WHERE ShiftwithStaff__c IN :shiftStaffList
            ];
            System.assert(createdServices.size() > 0, 'At least one service record should be created');
            for (Services_and_Support_Plan__c svc : createdServices) {
                System.assertEquals('Not Yet Invoiced', svc.Status__c, 'Status should be set to "Not Yet Invoiced"');
            }
        }
    }
}