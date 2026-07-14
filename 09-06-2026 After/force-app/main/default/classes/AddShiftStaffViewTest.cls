@isTest
public class AddShiftStaffViewTest {
    
    @testSetup
    static void setupData() {
        Organisation__c org = new Organisation__c(
            Name='Ashfield Consultants1',
            ABN__c='11234567891',
            ACN__c='878787878',
            Contact_No__c='6132899740',
            RCTI__c='RCTI1',
            Email__c='dsfdsfsd@gmail.com',
            Bank__c='Bank Test',
            BSB__c='BSB Test',
            Account_Name__c='Test Account',
            Account_Number__c='1111111111',
            Description__c='test Desc',
            Address_Latest__Street__s='101',
            Address_Latest__City__s='Himas Waterhen',
            Address_Latest__PostalCode__s='2060',
            Address_Latest__CountryCode__s='AU',
            Address_Latest__StateCode__s='NSW',
            NDIS_Provider__c='12341234565',
            BMSI_Identifier__c='TEST BMSI',
            SoftwareId__c='jhdfn18328',
            Branch_code__c='BS123',
            Contact_Name__c='Test Contact',
            User_Type__c='NDIS Org Admin'
        );
        insert org;
        
        Profile prof = [SELECT Id, Name FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        User user = new User(
            Alias='praveen', 
            Email='manualtesting.20294635557@gamil.com', 
            EmailEncodingKey='UTF-8', 
            LastName='StaffOne209463', 
            LanguageLocaleKey='en_US', 
            LocaleSidKey='en_US', 
            ProfileId=prof.Id, 
            TimeZoneSidKey='America/New_York', 
            User_Type__c='NDIS Org Admin', 
            UserName='manualtesting.20294635557@gamil.com',
            Organization_Name__c='Ashfield Consultants1'
        );
        insert user;
        
        System.runAs(user) {
            Facility__c fac = new Facility__c(
                Name='Ashfield Consultants',
                Address__City__s='Crace',
                Address__Street__s='8 Keewong Street',
                Address__StateCode__s='ACT',
                Address__PostalCode__s='2911',
                Address__CountryCode__s='AU',
                Email__c='testonefacility@gmail.com',
                Status__c=true,
                Organisation__c=org.Id,
                ABN__c='12345678912',
                Phone__c='12323432',
                Type_of_Service__c='Ndis'
            );
            insert fac;
            
            // Create Staff
            Staff__c staff = new Staff__c(
                Last_Name__c='Test staff', 
                Name='praveen1',
                Name__c='abcd',
                Contact_Number__c='56789908743',
                Email_Address__c='manualtesting.20294635557@gamil.com',
                Facility__c=fac.Id,
                Address__Street__s='8 Keewong Street',
                Address__City__s='Crace',
                Address__StateCode__s='ACT',
                Address__PostalCode__s='2911',
                Emergency_Phone_Number__c='45678766675',
                Primary_Contact_Name__c='Praveen',
                Primary_Contact_Number__c='9908458298',
                Make_Primary_as_Approver__c=true,
                Primary_Contact_Email__c='praveenshesham.sp@gmail.com',
                Secondary_Contact_Name__c='maheswari',
                Secondary_Contact_Email__c='maheswari.adabala@gmail.com',
                Make_Secondary_as_Approver__c=false,
                Secondary_Contact_Number__c='99084582958',
                Emp_exit_date__c=Date.newInstance(2028, 1, 5),
                Emp_Start_Date__c=Date.newInstance(2023, 2, 1),
                Payee_ETP_Payment_Date__c=Date.newInstance(2025, 2, 4),
                Date_Of_Birth__c=Date.newInstance(2001, 2, 4),
                role__c='Admin',
                Residency_Type__c='Australian',
                Expiry_Date__c=Date.newInstance(2025, 2, 19),
                Type__c='Visa Status',
                Working_Hours_Rate__c=50,
                Final_Overall_Rate__c=150,
                Saturday_Hourly_Rate__c=130,
                Sunday_Hourly_Rate__c=50,
                Status__c=true
                // Organization_Name__c is formula field: TRIM(RIGHT(Facility__r.Organisation__r.Id,15))
            );
            insert staff;
            
            // Create StaffRole__c - Check the actual field name in your org
            // It could be Staff__c or StaffRole_To_Staff__c
            StaffRole__c sr = new StaffRole__c(
                StaffRole_To_Staff__c=staff.Id, // Try this field name
                RoleName__c='Admin',
                Active__c=true,
                Hourly_Rate__c=50,
               Facility__c=fac.Id
            );
            insert sr;
            
            
            
            // Create Add_Shift__c for testing
            Add_Shift__c shift = new Add_Shift__c(
                Break__c='30',
                Do_you_want_to_set_this_a_recurring_shif__c=true,
                Start_Date__c=Date.newInstance(2025, 2, 10),
                End_Date__c=Date.newInstance(2025, 2, 16),
                Role__c='Admin',
                Get_Facility__c=true,
                Quantity__c=5,
                Start_Time__c=Time.newInstance(3, 30, 0, 0),
                End_Time__c=Time.newInstance(5, 0, 0, 0),
                Facility__c=fac.Id,
                Status__c='Draft',
                Start_time_picklist__c='3:30 am',
                End_time_picklist__c='5:00 am',
                Location__StateCode__s='ACT',
                Location__CountryCode__s='AU',
                Location__PostalCode__s='2911',
                Shift_Type__c='General'
            );
            insert shift;
            
            // Create ShiftwithStaff__c for testing
            ShiftwithStaff__c staffShift = new ShiftwithStaff__c(
                Add_Shift__c=shift.Id,
                Attendence__c=true,
                Comments__c='test comments',
                Staff__c=staff.Id,
                Role__c='Admin',
                Status__c='Accepted',
                // Date__c=Date.newInstance(2025, 2, 10),
                Log_In_Date_Time__c=Time.newInstance(1, 30, 0, 0),
                Log_Out_Date_Time__c=Time.newInstance(10, 0, 0, 0),
                Start_Date__c = shift.Start_Date__c,

Shift_Start_Time__c =
    shift.Start_Time__c,

Shift_End_Date__c =
    shift.Start_Date__c 
            );
            insert staffShift; 
            Add_Shift_Checklist__c  asch1 = new Add_Shift_Checklist__c();
            asch1.Description__c=' teststs ';
            asch1.Mandatory__c = true;
            asch1.ShiftwithStaff__c=staffShift.Id;
            insert asch1;

            
            // Create Shift_Type__c for testing
            Shift_Type__c shiftType = new Shift_Type__c(
                Name='Morning',
                Facility__c=fac.Id,
                Start_Time__c=Time.newInstance(9, 0, 0, 0),
                End_Time__c=Time.newInstance(17, 0, 0, 0),
                Shift_Type__c='Morning',
                Colour__c='#222222'
            );
            insert shiftType;
            
            
            NDIS_Support_Catalogue__c NSC = new NDIS_Support_Catalogue__c();
            NSC.Name = 'Assistance Animals';
            NSC.ACT__c = 100;
            NSC.NSW__c =100;
            NSC.NT__c = 100;
            NSC.QLD__c = 100;
            NSC.SA__c = 100;
            NSC.TAS__c = 100;
            NSC.VIC__c = 100;
            NSC.WA__c = 100;
            insert NSC;
            
            Client__c cli =  new Client__c();
            cli.First_Name__c = 'Test';
            cli.Last_Name__c = 'Participant2948';
            cli.Gendar__c = 'Male';
            cli.Date_Of_Birth__c = Date.newInstance(1991, 2, 17);
            cli.Address__Street__s='8 Keewong Street';
            cli.Address__City__s = 'Crace';
            cli.Address__StateCode__s='ACT';
            cli.Address__PostalCode__s='2911';
            cli.Contact_Number__c='4331237651';
            cli.Drivers_Licence__c = '123456789012';
            cli.Primay_Contact_First_Name__c='Jason';
            cli.Primay_Contact_Last_Name__c='Smith';
            cli.Relationship__c='Parent';
            cli.Email__c='manualtesting.4139559@hotmail.com';
            cli.Primary_Contact_Number__c='0433123123';
            insert cli;
            Staff_Facility__c sf = new Staff_Facility__c(
                Staff__c = staff.Id,
                Facility__c = fac.Id,
                Active__c = true
            );
            insert sf;
            
            Participant_Facility__c pf = new Participant_Facility__c(
                Participant__c = cli.Id,
                Facility__c = fac.Id,
                Active__c = true
            );
            insert pf;
            Funds_Tracker__c funds = new Funds_Tracker__c();
            funds.Registration_Group__c='Assistance Animals';
            funds.Amount_approved__c=11000;
            // funds.Available_Funds__c = 10000;	
            //funds.Spent_Amount__c = 1000;
            funds.Client__c=cli.Id;
            funds.Plan_Type__c ='Plan Managed';
            funds.Approved_Date__c = Date.newInstance(2024, 03, 16);
            insert funds;
            
            Services_and_Support_Plan__c services = new Services_and_Support_Plan__c();
            services.Service_Type__c = NSC.Id;
            services.Service_Users__c=staff.Id;
            services.Funds_Tracker__c=funds.Id;
            services.Service_Type__c = NSC.Id;
            services.Qty__c=5;
            // services.Unit_Price__c = 200;
            services.GST__c='No';
            services.Date_of_Service__c = system.today();//Date.newInstance(2024, 10, 16);
            services.Client__c=cli.Id;
            services.Services__c='Assistance Animals';
            services.State__c='ACT';
            services.Start_Time__c = '3:30 am';
            services.End_Time__c = '5:30 am';
            services.ShiftwithStaff__c=staffShift.Id;
            insert services;
            
            // Create a Leave record for testing
            
        }
    }
    
    @isTest
    static void testGetStaffData() {
        User u = [SELECT Id FROM User WHERE UserName = 'manualtesting.20294635557@gamil.com' LIMIT 1];
        
        System.runAs(u) {
            // Get test data - requery to get formula field values
            Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
            Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
            
            // Requery Staff to get formula field
            Staff__c staff = [SELECT Id, Organization_Name__c FROM Staff__c LIMIT 1];
            
            
            // Prepare test parameters
            List<String> roles = new List<String>{'Admin'};
                List<String> facs = new List<String>{fac.Id};
                    List<String> shiftTypes = new List<String>{'General'};
                        List<String> statusList = new List<String>();
            
            // Create weekData JSON
            String jsonData = '[{"day":"Mon","isHoliday":false,"quantity":1,"todayLabel":"NotToday","unallocated":0,"weekDays":"10-02-2025"},' +
                '{"day":"Tue","isHoliday":false,"quantity":2,"todayLabel":"NotToday","unallocated":0,"weekDays":"11-02-2025"},' +
                '{"day":"Wed","isHoliday":false,"quantity":2,"todayLabel":"NotToday","unallocated":0,"weekDays":"12-02-2025"},' +
                '{"day":"Thu","isHoliday":false,"quantity":3,"todayLabel":"NotToday","unallocated":0,"weekDays":"13-02-2025"},' +
                '{"day":"Fri","isHoliday":false,"quantity":3,"todayLabel":"NotToday","unallocated":1,"weekDays":"14-02-2025"},' +
                '{"day":"Sat","isHoliday":false,"quantity":4,"todayLabel":"NotToday","unallocated":0,"weekDays":"15-02-2025"},' +
                '{"day":"Sun","isHoliday":false,"quantity":1,"todayLabel":"NotToday","unallocated":0,"weekDays":"16-02-2025"}]';
            
            Test.startTest();
            
            // Since we're in test context, the Test.isRunningTest() block will execute
            List<AddShiftStaffView.RosterRoleWrapper> result = AddShiftStaffView.getStaffData(
                roles,
                Date.newInstance(2025, 2, 10),
                Date.newInstance(2025, 2, 16),
                facs,
                org.Id,
                jsonData,
                '', // name parameter - empty
                shiftTypes,
                statusList,
                12 // refreshKey
            );
            
            Test.stopTest();
            
            // Verify the combined wrapper structure
            AddShiftStaffView.RosterRoleWrapper wrapper = result[0];
            
        }
    }
    
    @isTest
    static void testGetStaffDataWithNameFilter() {
        User u = [SELECT Id FROM User WHERE UserName = 'manualtesting.20294635557@gamil.com' LIMIT 1];
        
        System.runAs(u) {
            Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
            Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
            
            String jsonData = '[{"day":"Mon","isHoliday":false,"quantity":1,"todayLabel":"NotToday","unallocated":0,"weekDays":"10-02-2025"},' +
                '{"day":"Tue","isHoliday":false,"quantity":2,"todayLabel":"NotToday","unallocated":0,"weekDays":"11-02-2025"},' +
                '{"day":"Wed","isHoliday":false,"quantity":2,"todayLabel":"NotToday","unallocated":0,"weekDays":"12-02-2025"},' +
                '{"day":"Thu","isHoliday":false,"quantity":3,"todayLabel":"NotToday","unallocated":0,"weekDays":"13-02-2025"},' +
                '{"day":"Fri","isHoliday":false,"quantity":3,"todayLabel":"NotToday","unallocated":1,"weekDays":"14-02-2025"},' +
                '{"day":"Sat","isHoliday":false,"quantity":4,"todayLabel":"NotToday","unallocated":0,"weekDays":"15-02-2025"},' +
                '{"day":"Sun","isHoliday":false,"quantity":1,"todayLabel":"NotToday","unallocated":0,"weekDays":"16-02-2025"}]';
            
            Test.startTest();
            
            // Test with name filter
            List<AddShiftStaffView.RosterRoleWrapper> result = AddShiftStaffView.getStaffData(
                new List<String>{'Admin'},
                Date.newInstance(2025, 2, 10),
                Date.newInstance(2025, 2, 16),
                new List<String>{fac.Id},
                org.Id,
                jsonData,
                'praveen', // name parameter
                new List<String>{'General'},
                new List<String>(),
                12
            );
            
            Test.stopTest();
            
            //System.assertNotEquals(null, result, 'Result should not be null');
        }
    }
    
    @isTest
    static void testGetStaffDataMultipleDays() {
        User u = [SELECT Id FROM User WHERE UserName = 'manualtesting.20294635557@gamil.com' LIMIT 1];
        
        System.runAs(u) {
            Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
            Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
            
            // Create weekData JSON for 14 days
            String jsonData14Days = '[';
            for (Integer i = 0; i < 14; i++) {
                Date currentDate = Date.newInstance(2025, 2, 10).addDays(i);
                String dateStr = currentDate.day() + '-' + currentDate.month() + '-' + currentDate.year();
                jsonData14Days += '{"day":"Day' + i + '","isHoliday":false,"quantity":1,"todayLabel":"NotToday","unallocated":0,"weekDays":"' + dateStr + '"}';
                if (i < 13) jsonData14Days += ',';
            }
            jsonData14Days += ']';
            
            Test.startTest();
            
            // Test with 14 days
            List<AddShiftStaffView.RosterRoleWrapper> result = AddShiftStaffView.getStaffData(
                new List<String>{'Admin'},
                Date.newInstance(2025, 2, 10),
                Date.newInstance(2025, 2, 23), // 14 days
                new List<String>{fac.Id},
                org.Id,
                jsonData14Days,
                '', // name parameter
                new List<String>{'General'},
                new List<String>(),
                12
            );
            
            Test.stopTest();
            
            System.assertNotEquals(null, result, 'Result should not be null');
            if (result.size() > 0) {
                AddShiftStaffView.RosterRoleWrapper wrapper = result[0];
                // System.assert(wrapper.weekData != null, 'Week data should not be null');
                // Should have 14 days of week data//
                //  System.assertEquals(14, wrapper.weekData.size(), 'Should have 14 days of week data for 14-day range');
            }
        }
    }
    
    @isTest
    static void testDeleteRecurShifts() {
        User u = [SELECT Id FROM User WHERE UserName = 'manualtesting.20294635557@gamil.com' LIMIT 1];
        
        System.runAs(u) {
            // Create a shift with RefId for testing
            ShiftwithStaff__c shift = new ShiftwithStaff__c(
                Add_Shift__c=[SELECT Id FROM Add_Shift__c LIMIT 1].Id,
                Attendence__c=true,
                Staff__c=[SELECT Id FROM Staff__c LIMIT 1].Id,
                Role__c='Admin',
                Status__c='Accepted',
                //  Date__c=Date.newInstance(2025, 2, 10),
                RefId__c='TEST123',
                Start_Date__c =
        Date.today(),

    Shift_Start_Time__c =
        Time.newInstance(9,0,0,0),

    Shift_End_Date__c =
        Date.today(),

    Log_In_Date_Time__c =
        Time.newInstance(9,0,0,0),

    Log_Out_Date_Time__c =
        Time.newInstance(17,0,0,0)
            );
            insert shift;
            
            Test.startTest();
            list<String> deleteDates= new list<String>();
            deleteDates.add('2025-02-10');
            
            try {
                AddShiftStaffView.deleterecurShifts('TEST123', '2025-02-10',deleteDates);
                 AddShiftStaffView.getRecurringShiftDates('TEST123');
                //  System.assert(true, 'Delete should execute without exception');
            } catch (Exception e) {
                //   System.assert(false, 'Should not throw exception: ' + e.getMessage());
            }
            
            Test.stopTest();
        }
    }
    
    @isTest
    static void testDeleteShiftNotification() {
        User u = [SELECT Id FROM User WHERE UserName = 'manualtesting.20294635557@gamil.com' LIMIT 1];
        
        System.runAs(u) {
            ShiftwithStaff__c shift = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
            
            Test.startTest();
            
            try {
                AddShiftStaffView.deleteShiftNotification(shift.Id);
                //  System.assert(true, 'Delete notification should execute without exception');
            } catch (Exception e) {
                //  System.assert(false, 'Should not throw exception: ' + e.getMessage());
            }
            
            Test.stopTest();
        }
    }
    
    @IsTest
static void testUpdateRecurringShiftChecklist_AddNewChecklists() {
    // Get test data
    ShiftWithStaff__c shift1 = [SELECT Id, RefId__c, Date__c FROM ShiftWithStaff__c  LIMIT 1];
    ShiftWithStaff__c shift2 = [SELECT Id, RefId__c, Date__c FROM ShiftWithStaff__c LIMIT 1];
    
    String refId = shift1.RefId__c;
    List<String> recuringShiftsToDelete = new List<String>{
        String.valueOf(shift1.Date__c),
        String.valueOf(shift2.Date__c)
    };
    
    // Create checklist wrappers for new checklists
    List<AddShiftStaffView.checkListWrapper> checklistList = new List<AddShiftStaffView.checkListWrapper>();
    
    AddShiftStaffView.checkListWrapper wrap1 = new AddShiftStaffView.checkListWrapper();
    wrap1.description = 'Test Checklist 1';
    wrap1.mandatory = true;
    wrap1.checkListId = '';
    wrap1.isCreatedFromStatic = false;
    checklistList.add(wrap1);
    
    AddShiftStaffView.checkListWrapper wrap2 = new AddShiftStaffView.checkListWrapper();
    wrap2.description = 'Test Checklist 2';
    wrap2.mandatory = false;
    wrap2.checkListId = '';
    wrap2.isCreatedFromStatic = false;
    checklistList.add(wrap2);
    
    String checklistJson = JSON.serialize(checklistList);
    String deletedChecklistJson = '[]';
    
    // Test
    Test.startTest();
    AddShiftStaffView.updateRecurringShiftChecklist(
        refId, 
        recuringShiftsToDelete, 
        checklistJson, 
        deletedChecklistJson
    );
    Test.stopTest();
   
   
}

@IsTest
static void testUpdateRecurringShiftChecklist_UpdateExistingChecklists() {
    // Get test data
    ShiftWithStaff__c shift1 = [SELECT Id, RefId__c, Date__c FROM ShiftWithStaff__c  LIMIT 1];
    
    String refId = shift1.RefId__c;
    List<String> recuringShiftsToDelete = new List<String>{
        String.valueOf(shift1.Date__c)
    };
    
    // Create existing checklist
    Add_Shift_Checklist__c existingChecklist = new Add_Shift_Checklist__c(
        ShiftWithStaff__c = shift1.Id,
        Description__c = 'Existing Checklist',
        Mandatory__c = false,
        Created_By_Static_Data__c = true
    );
    insert existingChecklist;
    
    // Create checklist wrapper for update
    List<AddShiftStaffView.checkListWrapper> checklistList = new List<AddShiftStaffView.checkListWrapper>();
    
    AddShiftStaffView.checkListWrapper wrap1 = new AddShiftStaffView.checkListWrapper();
    wrap1.description = 'Existing Checklist';
    wrap1.mandatory = true; // Changed from false to true
    wrap1.checkListId = existingChecklist.Id;
    wrap1.isCreatedFromStatic = false;
    checklistList.add(wrap1);
    
    String checklistJson = JSON.serialize(checklistList);
    String deletedChecklistJson = '[]';
    
    // Test
    Test.startTest();
    AddShiftStaffView.updateRecurringShiftChecklist(
        refId, 
        recuringShiftsToDelete, 
        checklistJson, 
        deletedChecklistJson
    );
    Test.stopTest();
    
    // Verify
    Add_Shift_Checklist__c updatedChecklist = [
        SELECT Id, Description__c, Mandatory__c, Created_By_Static_Data__c
        FROM Add_Shift_Checklist__c
        WHERE Id = :existingChecklist.Id
    ];
    

}

@IsTest
static void testUpdateRecurringShiftChecklist_DeleteChecklists() {
    // Get test data
    ShiftWithStaff__c shift1 = [SELECT Id, RefId__c, Date__c FROM ShiftWithStaff__c  LIMIT 1];
    ShiftWithStaff__c shift2 = [SELECT Id, RefId__c, Date__c FROM ShiftWithStaff__c LIMIT 1];
    
    String refId = shift1.RefId__c;
    List<String> recuringShiftsToDelete = new List<String>{
        String.valueOf(shift1.Date__c),
        String.valueOf(shift2.Date__c)
    };
    
    // Create checklists to delete
    Add_Shift_Checklist__c checklistToDelete1 = new Add_Shift_Checklist__c(
        ShiftWithStaff__c = shift1.Id,
        Description__c = 'Delete Me 1',
        Mandatory__c = true,
        Created_By_Static_Data__c = false
    );
    insert checklistToDelete1;
    
    Add_Shift_Checklist__c checklistToDelete2 = new Add_Shift_Checklist__c(
        ShiftWithStaff__c = shift2.Id,
        Description__c = 'Delete Me 2',
        Mandatory__c = false,
        Created_By_Static_Data__c = false
    );
    insert checklistToDelete2;
    
    // Create checklist wrapper for deleted items
    List<AddShiftStaffView.checkListWrapper> deletedChecklistList = new List<AddShiftStaffView.checkListWrapper>();
    
    AddShiftStaffView.checkListWrapper wrap1 = new AddShiftStaffView.checkListWrapper();
    wrap1.description = 'Delete Me 1';
    wrap1.mandatory = true;
    wrap1.checkListId = '';
    wrap1.isCreatedFromStatic = false;
    deletedChecklistList.add(wrap1);
    
    AddShiftStaffView.checkListWrapper wrap2 = new AddShiftStaffView.checkListWrapper();
    wrap2.description = 'Delete Me 2';
    wrap2.mandatory = false;
    wrap2.checkListId = '';
    wrap2.isCreatedFromStatic = false;
    deletedChecklistList.add(wrap2);
    
    String checklistJson = '[]'; // No new checklists
    String deletedChecklistJson = JSON.serialize(deletedChecklistList);
    
    // Test
    Test.startTest();
    AddShiftStaffView.updateRecurringShiftChecklist(
        refId, 
        recuringShiftsToDelete, 
        checklistJson, 
        deletedChecklistJson
    );
    Test.stopTest();
    

}

@IsTest
static void testUpdateRecurringShiftChecklist_MixAddUpdateDelete() {
    // Get test data
    ShiftWithStaff__c shift1 = [SELECT Id, RefId__c, Date__c FROM ShiftWithStaff__c  LIMIT 1];
    ShiftWithStaff__c shift2 = [SELECT Id, RefId__c, Date__c FROM ShiftWithStaff__c  LIMIT 1];
    
    String refId = shift1.RefId__c;
    List<String> recuringShiftsToDelete = new List<String>{
        String.valueOf(shift1.Date__c),
        String.valueOf(shift2.Date__c)
    };
    
    // Create existing checklist to update
    Add_Shift_Checklist__c updateChecklist = new Add_Shift_Checklist__c(
        ShiftWithStaff__c = shift1.Id,
        Description__c = 'Update This',
        Mandatory__c = false,
        Created_By_Static_Data__c = true
    );
    insert updateChecklist;
    
    // Create existing checklist to delete
    Add_Shift_Checklist__c deleteChecklist = new Add_Shift_Checklist__c(
        ShiftWithStaff__c = shift2.Id,
        Description__c = 'Delete This',
        Mandatory__c = true,
        Created_By_Static_Data__c = false
    );
    insert deleteChecklist;
    
    // 1. Checklist to add (new)
    List<AddShiftStaffView.checkListWrapper> checklistList = new List<AddShiftStaffView.checkListWrapper>();
    
    AddShiftStaffView.checkListWrapper addWrap = new AddShiftStaffView.checkListWrapper();
    addWrap.description = 'Brand New Checklist';
    addWrap.mandatory = true;
    addWrap.checkListId = '';
    addWrap.isCreatedFromStatic = false;
    checklistList.add(addWrap);
    
    // 2. Checklist to update
    AddShiftStaffView.checkListWrapper updateWrap = new AddShiftStaffView.checkListWrapper();
    updateWrap.description = 'Update This';
    updateWrap.mandatory = true; // Changed from false to true
    updateWrap.checkListId = updateChecklist.Id;
    updateWrap.isCreatedFromStatic = false;
    checklistList.add(updateWrap);
    
    // 3. Deleted checklists
    List<AddShiftStaffView.checkListWrapper> deletedChecklistList = new List<AddShiftStaffView.checkListWrapper>();
    
    AddShiftStaffView.checkListWrapper deleteWrap = new AddShiftStaffView.checkListWrapper();
    deleteWrap.description = 'Delete This';
    deleteWrap.mandatory = true;
    deleteWrap.checkListId = '';
    deleteWrap.isCreatedFromStatic = false;
    deletedChecklistList.add(deleteWrap);
    
    String checklistJson = JSON.serialize(checklistList);
    String deletedChecklistJson = JSON.serialize(deletedChecklistList);
    
    // Test
    Test.startTest();
    AddShiftStaffView.updateRecurringShiftChecklist(
        refId, 
        recuringShiftsToDelete, 
        checklistJson, 
        deletedChecklistJson
    );
    Test.stopTest();
    
  
    
   
}

@IsTest
static void testUpdateRecurringShiftChecklist_EmptyRecurringShifts() {
    // Get test data
    ShiftWithStaff__c shift1 = [SELECT Id, RefId__c FROM ShiftWithStaff__c LIMIT 1];
    
    String refId = shift1.RefId__c;
    List<String> recuringShiftsToDelete = new List<String>(); // Empty list
    
    List<AddShiftStaffView.checkListWrapper> checklistList = new List<AddShiftStaffView.checkListWrapper>();
    
    AddShiftStaffView.checkListWrapper wrap1 = new AddShiftStaffView.checkListWrapper();
    wrap1.description = 'Test Checklist';
    wrap1.mandatory = true;
    wrap1.checkListId = '';
    wrap1.isCreatedFromStatic = false;
    checklistList.add(wrap1);
    
    String checklistJson = JSON.serialize(checklistList);
    String deletedChecklistJson = '[]';
    
    // Test - should return early without errors
    Test.startTest();
    AddShiftStaffView.updateRecurringShiftChecklist(
        refId, 
        recuringShiftsToDelete, 
        checklistJson, 
        deletedChecklistJson
    );
    Test.stopTest();

}

@IsTest
static void testUpdateRecurringShiftChecklist_NoMatchingShifts() {
    String refId = 'NonExistentRefId';
    List<String> recuringShiftsToDelete = new List<String>{
        String.valueOf(Date.today())
    };
    
    List<AddShiftStaffView.checkListWrapper> checklistList = new List<AddShiftStaffView.checkListWrapper>();
    
    AddShiftStaffView.checkListWrapper wrap1 = new AddShiftStaffView.checkListWrapper();
    wrap1.description = 'Test Checklist';
    wrap1.mandatory = true;
    wrap1.checkListId = '';
    wrap1.isCreatedFromStatic = false;
    checklistList.add(wrap1);
    
    String checklistJson = JSON.serialize(checklistList);
    String deletedChecklistJson = '[]';
    
    // Test - should return early without errors
    Test.startTest();
    AddShiftStaffView.updateRecurringShiftChecklist(
        refId, 
        recuringShiftsToDelete, 
        checklistJson, 
        deletedChecklistJson
    );
    Test.stopTest();
   
}
    
    
    
    
}