@isTest
public class SignInCheckListAndNotesHandler_Test {
    
    @testsetup Static void testData(){
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
        
        //system.debug(org.name);
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.2029463@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne209463', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.2029463@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        insert user;
        
        System.runAs(user){   
             
            
            Facility__c fac = new Facility__c();
            fac.Name='Ashfield Consultants';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Address__CountryCode__s='AU';
            fac.Email__c= 'testonefacility@gmail.com';
            fac.Status__c=true;
            fac.Organisation__c= org.Id;fac.ABN__c='12234567';
            fac.Phone__c = '12323432';
            fac.ABN__c='12234567';
            fac.Phone__c = '12323432';
            fac.Type_of_Service__c='Ndis';
            insert fac;
            
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff';
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.2029463@hotmail.com';
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
            insert staff; 
            
            Child_Staff__c cs = new Child_Staff__c();
            cs.Expiry_Date__c =date.newInstance(2028, 01, 05); 
            cs.Staff__c=staff.id;
            cs.Comments__c='test ';
             insert cs;
            
            Training__c tra = new Training__c();             
            tra.description__c	= 'Test Description';
            tra.Name = 'LWC';
            tra.start_date__c=date.newInstance(2025, 02, 05);
            tra.end_date__c=date.newInstance(2025, 02, 20);
            tra.Organization_Name__c = 'Ashfield Consultants';
            insert tra;
            
            Assignment__c assign = new Assignment__c();
            assign.Module_Name__c = tra.Id;
            assign.Staff__c = staff.Id;
            assign.Completed_Date__c=date.newInstance(2025, 02, 14);
            assign.Organization_Name__c = 'Ashfield Consultants';
            insert assign;
            
            Direction__c dire = new Direction__c();
            dire.Name='Test Directions';
            insert dire;
            
            Add_Shift__c shift = new Add_Shift__c();
            shift.Break__c = '30';
            shift.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift.Start_Date__c =Date.newInstance(2024, 10, 16);        
            shift.Direction__c=dire.Id;
            shift.Role__c='Admin';
            shift.Get_Facility__c=true;
            shift.Quantity__c=5;
            shift.Start_Time__c=Time.newInstance( 03, 30, 00, 00);
            shift.End_Time__c=Time.newInstance( 05, 00, 00, 00);
            shift.Facility__c=fac.Id;
            shift.Status__c='Draft';
            shift.Start_time_picklist__c='3:30 am';
            shift.End_time_picklist__c='5:00 am';
            shift.Location__StateCode__s = 'ACT';
            shift.Location__CountryCode__s = 'AU';
            shift.Location__PostalCode__s = '2911';
            shift.Shift_Type__c='General';
            insert shift;
            
            Add_Shift_Checklist__c  asch = new Add_Shift_Checklist__c();
            asch.Description__c=' teststs ';
            asch.Mandatory__c = true;
            asch.Add_Shift__c=shift.Id;
            insert asch;
            
            ShiftwithStaff__c staffs = new ShiftwithStaff__c();
            staffs.Add_Shift__c=shift.Id;
            staffs.Attendence__c=true;
            staffs.Comments__c = 'test comments';
            staffs.Staff__c=staff.Id;
            staffs.Role__c='Admin';
            staffs.Status__c='Accepted';
            staffs.Log_In_Date_Time__c = Time.newInstance(01, 30, 00, 00);
            staffs.Log_Out_Date_Time__c = Time.newInstance(10, 00, 00, 00);
           // staffs.End_Time__c=system.now();
            insert staffs;
            
            Add_Shift__c shift1 = new Add_Shift__c();
            shift.Break__c = '30';
            shift1.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift1.Start_Date__c =Date.newInstance(2024, 12, 16);        
            shift1.Role__c='Admin';
            shift1.Get_Facility__c=true;
            shift1.Quantity__c=5;
            shift1.Start_Time__c=Time.newInstance( 18, 30, 00, 00);
            shift1.End_Time__c=Time.newInstance(22, 00, 00, 00);
            shift1.Facility__c=fac.Id;
            shift1.Status__c='Draft';
            shift1.Start_time_picklist__c='6:30 pm';
           	shift1.End_time_picklist__c='10:00 pm';
            shift1.Location__StateCode__s = 'ACT';
            shift1.Location__CountryCode__s = 'AU';
            shift1.Location__PostalCode__s = '2911';
            shift1.Shift_Type__c='Night';
            shift1.Start_Time_Text__c = '6:30 pm';
            shift1.End_Time_Text__c = '10:00 pm';
            insert shift1;
              
            Add_Shift_Checklist__c  asch1 = new Add_Shift_Checklist__c();
            asch1.Description__c=' teststs ';
            asch1.Mandatory__c = true;
            asch1.Add_Shift__c=shift1.Id;
            insert asch1;
            
             Add_Shift__c shift2 = new Add_Shift__c();
            shift2.Break__c = '30';
            shift2.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift2.Start_Date__c =Date.newInstance(2024, 08, 20);        
            shift2.Role__c='Admin';
            shift2.Get_Facility__c=true;
            shift2.Quantity__c=5;
            shift2.Start_Time__c=Time.newInstance( 18, 30, 00, 00);
            shift2.End_Time__c=Time.newInstance(22, 00, 00, 00);
            shift2.Facility__c=fac.Id;
            shift2.Status__c='Draft';
            shift2.Start_time_picklist__c='6:30 pm';
           	shift2.End_time_picklist__c='10:00 pm';
            shift2.Location__StateCode__s = 'ACT';
            shift2.Location__CountryCode__s = 'AU';
            shift2.Location__PostalCode__s = '2911';
            shift2.Shift_Type__c='Night';
            insert shift2;
            
            Add_Shift_Checklist__c  asch2 = new Add_Shift_Checklist__c();
            asch2.Description__c=' teststs ';
            asch2.Mandatory__c = true;
            asch2.Add_Shift__c=shift2.Id;
            insert asch2;
      
        	ShiftwithStaff__c staffs1 = new ShiftwithStaff__c();
            staffs1.Add_Shift__c=shift1.Id;
            staffs1.Attendence__c=true;
            staffs1.Comments__c = 'test comments';
            staffs1.Staff__c=staff.Id;
            staffs1.Role__c='Admin';
            staffs1.Status__c='Accepted';
            insert staffs1;
            
            Add_Shift__c shift3 = new Add_Shift__c();
            shift3.Break__c = '30';
            shift3.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift3.Start_Date__c =Date.newInstance(2024, 01, 01);        
            shift3.Role__c='Admin';
            shift3.Get_Facility__c=true;
            shift3.Quantity__c=5;
            shift3.Start_Time__c=Time.newInstance( 18, 30, 00, 00);
            shift3.End_Time__c=Time.newInstance(22, 00, 00, 00);
            shift3.Facility__c=fac.Id;
            shift3.Status__c='Draft';
            shift3.Start_time_picklist__c='6:30 pm';
           	shift3.End_time_picklist__c='10:00 pm';
            shift3.Location__StateCode__s = 'ACT';
            shift3.Location__CountryCode__s = 'AU';
            shift3.Location__PostalCode__s = '2911';
            shift3.Shift_Type__c='Night';
            insert shift3;
            
            Add_Shift_Checklist__c  asch3 = new Add_Shift_Checklist__c();
            asch3.Description__c=' teststs ';
            asch3.Mandatory__c = true;
            asch3.Add_Shift__c=shift3.Id;
            insert asch3;
            
            Reimbursement__c rei = new Reimbursement__c();
            rei.Mileage__c='30';
			rei.ShiftwithStaff__c=staffs.Id; 
            rei.Approval_Status__c='Approved';
            insert rei;
            
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
            services.Date_of_Service__c = SYSTEM.TODAY();
            services.Client__c=cli.Id;
            services.Services__c='Assistance Animals';
            services.State__c='ACT';
            services.Start_Time__c = '3:30 am';
            services.End_Time__c = '5:30 am';
            services.ShiftwithStaff__c=staffs1.id;
            insert services;
            
           // test.StartTest();
            //SignInCheckListAndNotesHandler.getCheckListByShiftId(shift1.Id);
            //AddShiftController.getSetHours();
            //test.StopTest();            
        }        
    }
    @isTest
    static void test_getCheckListByShiftId_valid() {
        // Get test data
        Add_Shift__c testShift = [SELECT Id FROM Add_Shift__c LIMIT 1];
        ShiftwithStaff__c shiftStaff = [SELECT Id FROM ShiftwithStaff__c WHERE Add_Shift__c = :testShift.Id LIMIT 1];

        Test.startTest();
        SignInCheckListAndNotesHandler.CheckListWrapper result = SignInCheckListAndNotesHandler.getCheckListByShiftId(testShift.Id, shiftStaff.Id);
        Test.stopTest();

        System.assertEquals(true, result.success);
        System.assertNotEquals(null, result.checklist);
        System.assert(result.checklist.size() > 0, 'Expected checklist items');
    }

    @isTest
    static void test_getCheckListByShiftId_invalid() {
        Test.startTest();
        SignInCheckListAndNotesHandler.CheckListWrapper result = SignInCheckListAndNotesHandler.getCheckListByShiftId('', '');
        Test.stopTest();

        System.assertEquals(false, result.success);
        System.assertEquals('Error: Shift ID is required and cannot be empty.', result.message);
    }

    @isTest
    static void test_updateCheckListRecords() {
        Add_Shift_Checklist__c checklist = [SELECT Id, Completed__c,Add_Shift_Checklist__c.Name,Add_Shift_Checklist__c.Add_Shift__c,Add_Shift_Checklist__c.Mandatory__c,Add_Shift_Checklist__c.Description__c FROM Add_Shift_Checklist__c LIMIT 1];

        SignInCheckListAndNotesHandler.CheckListItem item = new SignInCheckListAndNotesHandler.CheckListItem(checklist);
        item.isCompleted = true;

        String jsonInput = JSON.serialize(new List<SignInCheckListAndNotesHandler.CheckListItem>{ item });

        Test.startTest();
        Map<String, Object> response = SignInCheckListAndNotesHandler.updateCheckListRecords(jsonInput);
        Test.stopTest();

        System.assertEquals(true, response.get('success'));
        System.assertEquals('Checklist updated successfully.', response.get('message'));
    }

    @isTest
    static void test_updateCheckListRecords_noRecords() {
        String jsonInput = '[]';

        Test.startTest();
        Map<String, Object> response = SignInCheckListAndNotesHandler.updateCheckListRecords(jsonInput);
        Test.stopTest();

        System.assertEquals(false, response.get('success'));
        System.assertEquals('No valid records to update.', response.get('message'));
    }

    @isTest
    static void test_addShiftActivity_success() {
        ShiftwithStaff__c shiftStaff = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        String activityNote = 'Completed documentation.';

        Test.startTest();
        Map<String, Object> result = SignInCheckListAndNotesHandler.addShiftActivity(shiftStaff.Id, activityNote);
        Test.stopTest();

        System.assertEquals(true, result.get('success'));
        System.assertEquals('Activity added successfully.', result.get('message'));
        System.assertNotEquals(null, result.get('Id'));
    }

    @isTest
    static void test_getActivityLog_success() {
        // Create an activity log to fetch later
        ShiftwithStaff__c shiftStaff = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        ShiftWithStaff_Activity__c activity = new ShiftWithStaff_Activity__c(
            ShiftwithStaff__c = shiftStaff.Id,
            Notes__c = 'Test activity log'
        );
        insert activity;

        Test.startTest();
        Map<String, Object> result = SignInCheckListAndNotesHandler.getActivityLog(shiftStaff.Id);
        Test.stopTest();

        System.assertEquals(true, result.get('success'));
        System.assertEquals('Activity fetched successfully.', result.get('message'));
        List<ShiftWithStaff_Activity__c> records = (List<ShiftWithStaff_Activity__c>) result.get('records');
        System.assert(records.size() > 0);
    }

    @isTest
    static void test_getActivityLog_invalid() {
        Test.startTest();
        Map<String, Object> result = SignInCheckListAndNotesHandler.getActivityLog('');
        Test.stopTest();
    }

}