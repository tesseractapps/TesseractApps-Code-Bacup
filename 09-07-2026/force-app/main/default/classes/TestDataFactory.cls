@IsTest
public class TestDataFactory {

    public static void createBaseData() {

        List<String> picklistRoles = new List<String>();
        if (picklistRoles.isEmpty()) {
            picklistRoles.addAll(new List<String>{'Admin', 'AIN'});
        }
        
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
        org.Week_Start_Day__c='Monday';
        org.Roles__c = role1 + ';' + role2;
        insert org;
        
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.20294637@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne209463', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', 
                             User_Type__c='NDIS Org Admin', UserName='manualtesting.20294637@hotmail.com',Organization_Name__c ='Ashfield Consultants');
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
            fac.Organisation__c= org.Id;
            fac.ABN__c='12234567';
            fac.Phone__c = '12323432';
            fac.ABN__c='12345678901';
            fac.Type_of_Service__c='Ndis';
            insert fac;
            
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
            staff.Restrict_Set_Hours__c = false;
            staff.Set_Hours__c = 40;
            insert staff; 
            
            StaffRole__c sr = new StaffRole__c(
                StaffRole_To_Staff__c = staff.Id,
                Facility__c = fac.Id,
                RoleName__c = 'Admin',
                Active__c = true,
                Hourly_Rate__c = 50
            );
            insert sr;
            Staff_Facility__c sf = new Staff_Facility__c(
                Staff__c = staff.Id,
                Facility__c = fac.Id,
                Active__c = true
            );
            insert sf;
            
            
            
            Child_Staff__c cs = new Child_Staff__c();
            cs.Expiry_Date__c = date.newInstance(2028, 01, 05); 
            cs.Staff__c = staff.id;
            cs.Comments__c = 'test ';
            cs.Status__c = 'Approved';
            cs.Compliance__c = true;
            insert cs;
            
            Training__c tra = new Training__c();             
            tra.description__c = 'Test Description';
            tra.Name = 'LWC';
            tra.start_date__c = date.newInstance(2025, 02, 05);
            tra.end_date__c = date.newInstance(2025, 02, 20);
            tra.Organization_Name__c = 'Ashfield Consultants';
            insert tra;
            
            Assignment__c assign = new Assignment__c();
            assign.Module_Name__c = tra.Id;
            assign.Staff__c = staff.Id;
            assign.Completed_Date__c = date.newInstance(2025, 02, 14);
            assign.Organization_Name__c = 'Ashfield Consultants';
            insert assign;
            
            Direction__c dire = new Direction__c();
            dire.Name='Test Directions';
            insert dire;
            
            // ========== SHIFT 1 ==========
            Add_Shift__c shift = new Add_Shift__c();
            shift.Break__c = '30';
            shift.Do_you_want_to_set_this_a_recurring_shif__c = true;
            shift.Start_Date__c = Date.newInstance(2024, 10, 16);
            shift.End_Date__c = Date.newInstance(2024, 10, 24);
            shift.Direction__c = dire.Id;
            shift.Role__c = 'Admin';
            shift.Get_Facility__c = true;
            shift.Quantity__c = 5;
            shift.Start_Time__c = Time.newInstance(03, 30, 00, 00);
            shift.End_Time__c = Time.newInstance(05, 00, 00, 00);
            shift.Facility__c = fac.Id;
            shift.Status__c = 'Draft';
            shift.Start_time_picklist__c = '3:30 am';
            shift.End_time_picklist__c = '5:00 am';
            shift.Location__StateCode__s = 'ACT';
            shift.Location__CountryCode__s = 'AU';
            shift.Location__PostalCode__s = '2911';
            shift.Is_EOI__c = true;
            shift.EOI_staff__c = staff.Id;
            shift.Shift_Type__c = 'General';
             shift.Group_Shifts__c =true;
            insert shift;
            
            Add_Shift_Checklist__c asch = new Add_Shift_Checklist__c();
            asch.Description__c = ' teststs ';
            asch.Mandatory__c = true;
            asch.Add_Shift__c = shift.Id;
            insert asch;
            
            //
            
            ShiftwithStaff__c staffs = new ShiftwithStaff__c();
            staffs.Add_Shift__c = shift.Id;
            staffs.Attendence__c = true;
            staffs.Comments__c = 'test comments';
            staffs.Staff__c = staff.Id;
            staffs.Role__c = 'Admin';
            staffs.Status__c = 'Accepted';
            staffs.Start_Date__c = shift.Start_Date__c;
            staffs.Shift_Start_Time__c = shift.Start_Time__c;
            staffs.Shift_End_Date__c = shift.End_Date__c != null ? shift.End_Date__c : shift.Start_Date__c;
            staffs.Shift_End_Time__c = shift.End_Time__c;
            staffs.Log_In_Date_Time__c = Time.newInstance(01, 30, 00, 00);
            staffs.Log_Out_Date_Time__c = Time.newInstance(10, 00, 00, 00);
            insert staffs;
            
             
            ShiftwithStaff__c staffs12 = new ShiftwithStaff__c();
            staffs12.Add_Shift__c = shift.Id;
            staffs12.Attendence__c = true;
            staffs12.Comments__c = 'test comments';
            staffs12.Staff__c = staff.Id;
            staffs12.Role__c = 'Admin';
            staffs12.Status__c = 'Accepted';
            staffs12.Start_Date__c = shift.Start_Date__c;
            staffs12.Shift_Start_Time__c = shift.Start_Time__c;
            staffs12.Shift_End_Date__c = shift.End_Date__c != null ? shift.End_Date__c : shift.Start_Date__c;
            staffs12.Shift_End_Time__c = shift.End_Time__c;
            staffs12.Log_In_Date_Time__c = Time.newInstance(01, 30, 00, 00);
            staffs12.Log_Out_Date_Time__c = Time.newInstance(10, 00, 00, 00);
            insert staffs12;
            
            
            // ========== SHIFT 2 ==========
            Add_Shift__c shift1 = new Add_Shift__c();
            shift1.Break__c = '30';
            shift1.Do_you_want_to_set_this_a_recurring_shif__c = true;
            shift1.Start_Date__c = Date.newInstance(2024, 12, 16); 
            shift1.End_Date__c = Date.newInstance(2024, 12, 20);
            shift1.Role__c = 'Admin';
            shift1.Get_Facility__c = true;
            shift1.Quantity__c = 5;
            shift1.Start_Time__c = Time.newInstance(18, 30, 00, 00);
            shift1.End_Time__c = Time.newInstance(22, 00, 00, 00);
            shift1.Facility__c = fac.Id;
            shift1.Status__c = 'Draft';
            shift1.Start_time_picklist__c = '6:30 pm';
            shift1.End_time_picklist__c = '10:00 pm';
            shift1.Location__StateCode__s = 'ACT';
            shift1.Location__CountryCode__s = 'AU';
            shift1.Location__PostalCode__s = '2911';
            shift1.Shift_Type__c = 'Night';
            shift1.Start_Time_Text__c = '6:30 pm';
            shift1.End_Time_Text__c = '10:00 pm';
            shift1.Split_Shifts__c = true;
            insert shift1;
            
            Add_Shift_Checklist__c asch1 = new Add_Shift_Checklist__c();
            asch1.Description__c = ' teststs ';
            asch1.Mandatory__c = true;
            asch1.Add_Shift__c = shift1.Id;
            insert asch1;
            
            ShiftwithStaff__c staffs1 = new ShiftwithStaff__c();
            staffs1.Add_Shift__c = shift1.Id;
            staffs1.Attendence__c = true;
            staffs1.Comments__c = 'test comments';
            staffs1.Staff__c = staff.Id;
            staffs1.Role__c = 'Admin';
            staffs1.Status__c = 'Accepted';
            staffs1.Start_Date__c = shift1.Start_Date__c;
            staffs1.Shift_Start_Time__c = shift1.Start_Time__c;
            staffs1.Shift_End_Date__c = shift1.End_Date__c != null ? shift1.End_Date__c : shift1.Start_Date__c;
            staffs1.Shift_End_Time__c = shift1.End_Time__c;
            staffs1.Log_In_Date_Time__c = Time.newInstance(18, 30, 0, 0);
            staffs1.Log_Out_Date_Time__c = Time.newInstance(22, 0, 0, 0);
            insert staffs1;
            
            // ========== SHIFT 3 ==========
            Add_Shift__c shift2 = new Add_Shift__c();
            shift2.Break__c = '30';
            shift2.Do_you_want_to_set_this_a_recurring_shif__c = true;
            shift2.Start_Date__c = Date.newInstance(2024, 08, 20);        
            shift2.End_Date__c = Date.newInstance(2024, 08, 25);
            shift2.Role__c = 'Admin';
            shift2.Get_Facility__c = true;
            shift2.Quantity__c = 5;
            shift2.Start_Time__c = Time.newInstance(18, 30, 00, 00);
            shift2.End_Time__c = Time.newInstance(22, 00, 00, 00);
            shift2.Facility__c = fac.Id;
            shift2.Status__c = 'Draft';
            shift2.Start_time_picklist__c = '6:30 pm';
            shift2.End_time_picklist__c = '10:00 pm';
            shift2.Location__StateCode__s = 'ACT';
            shift2.Location__CountryCode__s = 'AU';
            shift2.Location__PostalCode__s = '2911';
            shift2.Shift_Type__c = 'Custom';
            shift2.Split_Shifts__c = false;
            insert shift2;
            
            Add_Shift_Checklist__c asch2 = new Add_Shift_Checklist__c();
            asch2.Description__c = ' teststs ';
            asch2.Mandatory__c = true;
            asch2.Add_Shift__c = shift2.Id;
            insert asch2;
            
            ShiftwithStaff__c staffs2 = new ShiftwithStaff__c();
            staffs2.Add_Shift__c = shift2.Id;
            staffs2.Attendence__c = true;
            staffs2.Comments__c = 'test comments';
            staffs2.Staff__c = staff.Id;
            staffs2.Role__c = 'Admin';
            staffs2.Status__c = 'Accepted';
            staffs2.Start_Date__c = shift2.Start_Date__c;
            staffs2.Shift_Start_Time__c = shift2.Start_Time__c;
            staffs2.Shift_End_Date__c = shift2.End_Date__c != null ? shift2.End_Date__c : shift2.Start_Date__c;
            staffs2.Shift_End_Time__c = shift2.End_Time__c;
            staffs2.Log_In_Date_Time__c = Time.newInstance(18, 30, 0, 0);
            staffs2.Log_Out_Date_Time__c = Time.newInstance(22, 0, 0, 0);
            insert staffs2;
            
            // ========== SHIFT 4 ==========
            Add_Shift__c shift3 = new Add_Shift__c();
            shift3.Break__c = '30';
            shift3.Do_you_want_to_set_this_a_recurring_shif__c = true;
            shift3.Start_Date__c = Date.newInstance(2024, 01, 01);        
            shift3.End_Date__c = Date.newInstance(2024, 01, 05);
            shift3.Role__c = 'Admin';
            shift3.Get_Facility__c = true;
            shift3.Quantity__c = 5;
            shift3.Start_Time__c = Time.newInstance(18, 30, 00, 00);
            shift3.End_Time__c = Time.newInstance(22, 00, 00, 00);
            shift3.Facility__c = fac.Id;
            shift3.Status__c = 'Draft';
            shift3.Start_time_picklist__c = '6:30 pm';
            shift3.End_time_picklist__c = '10:00 pm';
            shift3.Location__StateCode__s = 'ACT';
            shift3.Location__CountryCode__s = 'AU';
            shift3.Location__PostalCode__s = '2911';
            shift3.Shift_Type__c = 'Night';
            insert shift3;
            
            Add_Shift_Checklist__c asch3 = new Add_Shift_Checklist__c();
            asch3.Description__c = ' teststs ';
            asch3.Mandatory__c = true;
            asch3.Add_Shift__c = shift3.Id;
            insert asch3;
            
            ShiftwithStaff__c staffs3 = new ShiftwithStaff__c();
            staffs3.Add_Shift__c = shift3.Id;
            staffs3.Attendence__c = true;
            staffs3.Comments__c = 'test comments';
            staffs3.Staff__c = staff.Id;
            staffs3.Role__c = 'Admin';
            staffs3.Status__c = 'Accepted';
            staffs3.Start_Date__c = shift3.Start_Date__c;
            staffs3.Shift_Start_Time__c = shift3.Start_Time__c;
            staffs3.Shift_End_Date__c = shift3.End_Date__c != null ? shift3.End_Date__c : shift3.Start_Date__c;
            staffs3.Shift_End_Time__c = shift3.End_Time__c;
            staffs3.Log_In_Date_Time__c = Time.newInstance(18, 30, 0, 0);
            staffs3.Log_Out_Date_Time__c = Time.newInstance(22, 0, 0, 0);
            insert staffs3;
            
            // ========== SHIFT 5 (Split Shift) ==========
            Add_Shift__c shift4 = new Add_Shift__c();
            shift4.Break__c = '30';
            shift4.Do_you_want_to_set_this_a_recurring_shif__c = true;
            shift4.Start_Date__c = Date.newInstance(2025, 01, 01);        
            shift4.End_Date__c = Date.newInstance(2025, 01, 05);
            shift4.Role__c = 'Admin';
            shift4.Get_Facility__c = true;
            shift4.Quantity__c = 5;
            shift4.Start_Time__c = Time.newInstance(9, 30, 00, 00);
            shift4.End_Time__c = Time.newInstance(22, 00, 00, 00);
            shift4.Facility__c = fac.Id;
            shift4.Status__c = 'Draft';
            shift4.Start_time_picklist__c = '6:30 pm';
            shift4.End_time_picklist__c = '10:00 pm';
            shift4.Location__StateCode__s = 'ACT';
            shift4.Location__CountryCode__s = 'AU';
            shift4.Location__PostalCode__s = '2911';
            shift4.Shift_Type__c = 'Custom';
            insert shift4;
            
            ShiftwithStaff__c staffs4 = new ShiftwithStaff__c();
            staffs4.Add_Shift__c = shift4.Id;
            staffs4.Attendence__c = true;
            staffs4.Comments__c = 'test comments';
            staffs4.Staff__c = staff.Id;
            staffs4.Role__c = 'Admin';
            staffs4.Status__c = 'Accepted';
            staffs4.Start_Date__c = shift4.Start_Date__c;
            staffs4.Shift_Start_Time__c = shift4.Start_Time__c;
            staffs4.Shift_End_Date__c = shift4.End_Date__c != null ? shift4.End_Date__c : shift4.Start_Date__c;
            staffs4.Shift_End_Time__c = shift4.End_Time__c;
            staffs4.Long_Morning_Start_Time__c = Time.newInstance(9, 30, 00, 00);
            staffs4.Long_Morning_End_Time__c = Time.newInstance(13, 30, 00, 00);
            staffs4.Long_Afternoon_Start_Time__c = Time.newInstance(13, 30, 00, 00);
            staffs4.Long_Afternoon_End_Time__c = Time.newInstance(22, 00, 00, 00);
            insert staffs4;
            
            // ========== SHIFT 6 ==========
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
            cli.Facility__c = fac.Id;
            insert cli;
            
            Funds_Tracker__c funds = new Funds_Tracker__c();
            funds.Registration_Group__c = 'Assistance Animals';
            funds.Amount_approved__c = 11000;
            funds.Client__c = cli.Id;
            funds.Plan_Type__c = 'Plan Managed';
            funds.Approved_Date__c = Date.newInstance(2024, 03, 16);
            insert funds;
            
           
            
            Services_and_Support_Plan__c services = new Services_and_Support_Plan__c();
            services.Service_Type__c = NSC.Id;
            services.Service_Users__c = staff.Id;
            services.Funds_Tracker__c = funds.Id;
            services.Qty__c = 5;
            services.GST__c = 'No';
            services.Date_of_Service__c = system.today();
            services.Client__c = cli.Id;
            services.Services__c = 'Assistance Animals';
            services.State__c = 'ACT';
            services.Start_Time__c = '3:30 am';
            services.End_Time__c = '5:30 am';
            services.ShiftwithStaff__c = staffs.id;
            insert services;
            // After creating Funds_Tracker__c (funds) and NDIS_Support_Catalogue__c (NSC)

        // Create ClientFundTrackerJN__c records to link Client, Fund, and Catalogue
        ClientFundTrackerJN__c jn1 = new ClientFundTrackerJN__c(
            Participant__c = cli.Id,
            Funds_Tracker__c = funds.Id,
            NDIS_Support_Catalogue__c = NSC.Id,
            Amount__c = 100,
            Edited_Catelog_Name__c = 'Edited Catalogue Name 1',
            Shift_Type__c = 'General',
            Entity_Profile__c = null,
            Xero_Entity__c = null
        );
        insert jn1;
        
        // Create a second one for additional coverage
        ClientFundTrackerJN__c jn2 = new ClientFundTrackerJN__c(
            Participant__c = cli.Id,
            Funds_Tracker__c = funds.Id,
            NDIS_Support_Catalogue__c = NSC.Id,
            Amount__c = 200,
            Edited_Catelog_Name__c = 'Edited Catalogue Name 2',
            Shift_Type__c = 'Night',
            Entity_Profile__c = null,
            Xero_Entity__c = null
        );
        insert jn2;
            
            Reimbursement__c rei = new Reimbursement__c();
            rei.ShiftwithStaff__c = staffs.Id; 
            rei.Approval_Status__c = 'Approved';
            insert rei;
            
            List<Add_Shift_Checklist__c> checklistRecords = new List<Add_Shift_Checklist__c>();
            for (Integer i = 0; i < 2; i++) {
                checklistRecords.add(new Add_Shift_Checklist__c(Completed__c = false, Add_Shift__c = shift1.Id));
            }
            insert checklistRecords;
            
            ShiftWithStaff_Activity__c staffActivity = new ShiftWithStaff_Activity__c();
            staffActivity.ShiftwithStaff__c = staffs1.Id;
            insert staffActivity;
            
            String jsonData = '{"serviceTypeId":"' + funds.Id + 
                              '","serviceGroupId":"' + NSC.Id + 
                              '","participantId":"' + cli.Id + '"}';
            
            // ========== SHIFT 7 ==========
            Add_Shift__c shift5 = new Add_Shift__c();
            shift5.Break__c = '30';
            shift5.Do_you_want_to_set_this_a_recurring_shif__c = true;
            shift5.Start_Date__c = Date.newInstance(2024, 02, 01);        
            shift5.End_Date__c = Date.newInstance(2024, 02, 05);
            shift5.Role__c = 'Admin';
            shift5.Get_Facility__c = true;
            shift5.Quantity__c = 5;
            shift5.Start_Time__c = Time.newInstance(18, 30, 00, 00);
            shift5.End_Time__c = Time.newInstance(22, 00, 00, 00);
            shift5.Facility__c = fac.Id;
            shift5.Status__c = 'Draft';
            shift5.Start_time_picklist__c = '6:30 pm';
            shift5.End_time_picklist__c = '10:00 pm';
            shift5.Location__StateCode__s = 'ACT';
            shift5.Location__CountryCode__s = 'AU';
            shift5.Location__PostalCode__s = '2911';
            shift5.RefId__c = '12535899999';
            shift5.Shift_Type__c = 'Night';
            shift5.Service_Details__c = jsonData;
            shift5.Duration__c = 9;
            insert shift5;
            
            ShiftwithStaff__c staffs5 = new ShiftwithStaff__c();
            staffs5.Add_Shift__c = shift5.Id;
            staffs5.Attendence__c = true;
            staffs5.Comments__c = 'test comments';
            staffs5.Staff__c = staff.Id;
            staffs5.Role__c = 'Admin';
            staffs5.Status__c = 'Accepted';
            staffs5.Long_Morning_Start_Time__c = Time.newInstance(9, 30, 00, 00);
            staffs5.Long_Morning_End_Time__c = Time.newInstance(13, 30, 00, 00);
            staffs5.Start_Date__c = shift5.Start_Date__c;
            staffs5.Shift_Start_Time__c = shift5.Start_Time__c;
            staffs5.Shift_End_Date__c = shift5.End_Date__c != null ? shift5.End_Date__c : shift5.Start_Date__c;
            staffs5.Shift_End_Time__c = shift5.End_Time__c;
            staffs5.Long_Afternoon_Start_Time__c = Time.newInstance(13, 30, 00, 00);
            staffs5.Long_Afternoon_End_Time__c = Time.newInstance(22, 00, 00, 00);
            insert staffs5;
            
            Shift_Type__c shiftType = new Shift_Type__c(
                Name = 'Morning',
                Facility__c = fac.Id,
                Start_Time__c = Time.newInstance(9, 0, 0, 0),
                End_Time__c = Time.newInstance(17, 0, 0, 0),
                Shift_Type__c = 'Morning',
                Colour__c = '#222222'
            );
            insert shiftType;
            
            insert new Participant_Facility__c(
                Participant__c = cli.Id,
                Facility__c = fac.Id,
                Active__c = true
            );
            
            StaffDocsShare__c staffDoc = new StaffDocsShare__c(
                Staff__c = staff.Id,
                Child_Staff__c = cs.Id
            );
            insert staffDoc;
            Award__c aw= new Award__c();
            aw.Awards__c='Outstanding Support Worker Award';
            aw.Date__c=date.newInstance(2025,02, 19);
            aw.Staff__c=staff.id;
            // aw.Facility__c=fac.id;
            aw.Issued_by__c='praveen';
            insert aw;
            
            List<Dynamic_Form__c> forms = new List<Dynamic_Form__c>();
            forms.add(new Dynamic_Form__c(
                Name__c = 'Form A', 
                Form_JSON__c = '{"id": "row-0"}', 
                Form_Type__c = 'General', 
                Org_Id__c = org.Id,
                Status__c = 'Draft'
            ));
            forms.add(new Dynamic_Form__c(
                Name__c = 'Form B', 
                Form_JSON__c = '{"id": "row-1"}', 
                Form_Type__c = 'Medication', 
                Org_Id__c = org.Id,
                Status__c = 'Draft'
            ));
            forms.add(new Dynamic_Form__c(
                Name__c = 'Form C', 
                Form_JSON__c = '{"id": "row-2"}', 
                Form_Type__c = 'Assessment', 
                Org_Id__c = org.Id,
                Status__c = 'Draft'
            ));
            insert forms;
            
            Dynamic_Form_Response__c response = new Dynamic_Form_Response__c();
            response.Form_Reference__c = forms[0].Id;
            response.Response_JSON__c = '{"field":"value"}';
            response.Org_Id__c = org.Id;
            response.Client_Id__c = cli.Id;
            response.Name__c = 'Dynamic Form Res1';
            response.Form_Type__c = 'Medication';
            response.Participant_Name__c = 'Test Participant';        
            insert response;
        }        
    }
}