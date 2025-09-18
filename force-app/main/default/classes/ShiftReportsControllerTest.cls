@isTest
public class ShiftReportsControllerTest {
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
        system.debug(org.name);
        
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.4139562@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='Test Friday4039562', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York',User_Type__c='Facility Admin', UserName='manualtesting.4139562@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        insert user;
        
        System.runAs(user) {         
            Facility__c fac = new Facility__c();
            fac.Name='Ashfield Consultants';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Address__CountryCode__s='AU';
            fac.Email__c= 'testonefacility111@gmail.com';
            fac.Status__c=true;
            fac.Organisation__c= org.Id;
            fac.ABN__c='1235645433';
            fac.Phone__c = '12323213';
            insert fac;
                        
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
            staff.Annual_Leave__c=10;
            staff.Sick_Leave__c=2;
            staff.Bereavement_Leave__c=10;
            staff.Parental_Leave__c=3;
            insert staff; 
            
            Staff__c staff1 = new Staff__c();
            staff1.Last_Name__c='Test staff1';
            staff1.Name='praveen1';
            staff1.Name__c='abcdr';
            staff1.Contact_Number__c='56789908743';
            staff1.Email_Address__c= 'manualtesting.4139561@hotmail.com';
            staff1.Facility__c=fac.Id;
            staff1.Address__Street__s='8 Keewong Street';
            staff1.Address__City__s = 'Crace';
            staff1.Address__StateCode__s='ACT';
            staff1.Address__PostalCode__s='2911';
            staff1.Emergency_Phone_Number__c='45678766675';
            staff1.Primary_Contact_Name__c='Praveen';
            staff1.Primary_Contact_Number__c='9908458298';
            staff1.Make_Primary_as_Approver__c=true;
            staff1.Primary_Contact_Email__c='praveenshesham.sp@gmail.com';
            staff1.Secondary_Contact_Name__c='maheswari';
            staff1.Secondary_Contact_Email__c='maheswari.adabala@gmail.com';
            staff1.Make_Secondary_as_Approver__c=false;
            staff1.Secondary_Contact_Number__c='990845829528';
            staff1.Emp_exit_date__c = date.newInstance(2027, 01, 05);
            staff1.Emp_Start_Date__c = date.newInstance(2026, 02, 01);
            staff1.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
            staff1.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
            staff1.role__c='Admin';
            staff1.Residency_Type__c = 'Australian';
            staff1.Expiry_Date__c = date.newInstance(2025,02, 19);
            staff1.Type__c = 'Visa Status';
            staff1.Working_Hours_Rate__c=50;
            staff1.Annual_Leave__c=10;
            staff1.Sick_Leave__c=2;
            staff1.Bereavement_Leave__c=10;
            staff1.Parental_Leave__c=3;
            insert staff1; 
            
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
            cli.Facility__c=fac.id;
            cli.Status__c=true;
            cli.Medications__c = 'Test Medication';
            cli.Allergies__c = 'Test Allergies';
            cli.Notes__c = 'Test Notes';
            cli.Unavailable_Date__c = Date.newInstance(2025, 05, 16);
            cli.Current_Availability__c  =  'Unavailable';
            // clientList.add(cli);        
            insert cli;
            
            
            Funds_Tracker__c funds = new Funds_Tracker__c();
            funds.Registration_Group__c='Assistance Animals';
            funds.Amount_approved__c=11000;
           // funds.Available_Funds__c = 10000;	
            //funds.Spent_Amount__c = 1000;
            funds.Client__c=cli.Id;
            funds.Plan_Type__c ='Plan Managed';
            funds.Approved_Date__c = Date.newInstance(2024, 03, 16);
            insert funds;
            
			            
            Add_Shift__c shift = new Add_Shift__c();
            shift.Break__c = '30';
            shift.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift.Start_Date__c =Date.newInstance(2024, 03, 16);        
            //shift.Direction__c=dire.Id;
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
            insert shift; 
            
            Add_Shift__c shift1 = new Add_Shift__c();
            shift1.Break__c = '30';
            shift1.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift1.Start_Date__c =Date.newInstance(2024, 10, 16);        
           // shift1.Direction__c=dire.Id;
            shift1.Role__c='Admin';
            shift1.Get_Facility__c=true;
            shift1.Quantity__c=5;
            shift1.Start_Time__c=Time.newInstance( 03, 30, 00, 00);
            shift1.End_Time__c=Time.newInstance( 05, 00, 00, 00);
            shift1.Facility__c=fac.Id;
            shift1.Status__c='Draft';
            shift1.Start_time_picklist__c='3:30 am';
            shift1.End_time_picklist__c='5:00 am';
            shift1.Location__StateCode__s = 'ACT';
            shift1.Location__CountryCode__s = 'AU';
            shift1.Location__PostalCode__s = '2911';
            shift1.Shift_Type__c='General';
            insert shift1;
            
            ShiftwithStaff__c staffs = new ShiftwithStaff__c();
            staffs.Add_Shift__c=shift.Id;
            staffs.Attendence__c=true;
            staffs.Comments__c = 'test comments';
            staffs.Staff__c=staff.Id;
            staffs.Role__c='Admin';
            staffs.Status__c='Accepted';
            staffs.Log_In_Date_Time__c = Time.newInstance( 3, 30, 00, 00);
            staffs.Log_Out_Date_Time__c = Time.newInstance( 5, 00, 00, 00);
           // staffs.End_Time__c=system.now();
            insert staffs; 
            
            ShiftwithStaff__c staffs1 = new ShiftwithStaff__c();
            staffs1.Add_Shift__c=shift1.Id;
            staffs1.Attendence__c=true;
            staffs1.Comments__c = 'test comments';
            staffs1.Staff__c=staff.Id;
            staffs1.Role__c='Admin';
            staffs1.Status__c='Accepted';
            staffs1.Log_In_Date_Time__c = Time.newInstance( 3, 30, 00, 00);
            staffs1.Log_Out_Date_Time__c = Time.newInstance( 5, 00, 00, 00);
           // staffs.End_Time__c=system.now();
            insert staffs1;             
            
            Services_and_Support_Plan__c services = new Services_and_Support_Plan__c();
           // services.Service_Type__c = NSC.Id;
            services.Service_Users__c=staff.Id;
            services.Funds_Tracker__c=funds.Id;
            //services.Service_Type__c = NSC.Id;
            services.Qty__c=5;
           // services.Unit_Price__c = 200;
            services.GST__c='No';
            services.Date_of_Service__c = system.today();//Date.newInstance(2024, 10, 16);
            services.Client__c=cli.Id;
            services.Services__c='Assistance Animals';
            services.State__c='ACT';
            services.Start_Time__c = '3:30 am';
            services.End_Time__c = '5:30 am';
            services.ShiftwithStaff__c=staffs1.id;
            insert services;
            
             Add_Shift_Checklist__c checklist = new Add_Shift_Checklist__c(
                Add_Shift__c = shift1.Id,
                Description__c = 'Check badge',
                Mandatory__c = true
            );
            insert checklist;
    
            // Add Reimbursement
            Reimbursement__c reimbursement = new Reimbursement__c(
                ShiftwithStaff__c = staffs1.Id,
                Total_Amount__c = 25,
                Comments__c = 'Taxi reimbursement',
                Type_of_Vehicle__c = 'Electric',
                Approval_Status__c = 'Pending',
                Approval_user__c = user.Id
            );
            insert reimbursement;
    
            // Add Activity Log
            ShiftWithStaff_Activity__c activity = new ShiftWithStaff_Activity__c(
                ShiftwithStaff__c = staffs1.Id,
                Notes__c = 'Completed client visit'
            );
            insert activity;
           
            
            List<Facility__c> facilityList = [SELECT Id FROM Facility__c];
            test.startTest();
           
            //ApexPages.currentPage().getParameters().put('shiftId', shift.Id);

        	//ShiftReportsDownloadController controller = new ShiftReportsDownloadController();
         //   ApexPages.currentPage().getParameters().put('shiftId', shift.Id);

           // ShiftReportsDownloadController controller = new ShiftReportsDownloadController();
    
            // Assert populated values
          //  System.assertEquals('Nick Test', controller.staffName);
           // System.assertEquals('Signed digitally', controller.signature);
            //System.assert(controller.activityLogs.size() > 0, 'Should have activity logs');
           // System.assert(controller.services.size() > 0, 'Should have services');
           // System.assert(controller.shiftNotes.size() > 0, 'Should have shift notes');
            //System.assert(controller.checklist.size() > 0, 'Should have checklist items');
            //System.assertEquals(25, controller.reimbursement);
            //
            
           	   List<ShiftwithStaff__c> results = ShiftReportsController.getShiftWithStaffData(
                'All',             // role
                'All',             // employment type
                String.valueOf(Date.today()),
                String.valueOf(Date.today().addDays(7)),
                'Participant',
                new List<Id>{facilityList[0].Id}
            );
            Map<String, Object> result = ShiftReportsController.getAddShiftById(staffs1.Id);
            //ApexPages.currentPage().getParameters().put('shiftId', shift.Id);

        	//ShiftReportsDownloadController controller = new ShiftReportsDownloadController();
        	ApexPages.currentPage().getParameters().put('shiftId', staffs1.Id);

            ShiftReportsDownloadController controller = new ShiftReportsDownloadController();
            test.stopTest();
        }
    }
   /* @isTest
    static void testShiftReportDownloadController() {
        // Create Facility (for Staff)
        Facility__c facility = new Facility__c(Name = 'Test Facility');
        insert facility;
    }*/
     @isTest
    static void testShiftReportController() {
        // Create Facility (for Staff)
       // Facility__c facility = new Facility__c(Name = 'Test Facility');
        //insert facility;
         List<Facility__c> facList = [SELECT Id from Facility__c Limit 1 ];
    }
        
}