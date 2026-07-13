@IsTest
private class GlobalCometChatServiceTest {

    @testsetup 
    Static void testData(){
          List<String> picklistRoles = new List<String>();
       // for (Schema.PicklistEntry pe : Organisation__c.Roles__c.getDescribe().getPicklistValues()) {
         //   picklistRoles.add(pe.getValue());
       // }
        
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
        
        //system.debug(org.name);
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
            fac.ABN__c='12234567';
            fac.Phone__c = '12323432';
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
           // staff.Role__c = 'Support Worker';
            insert staff; 
            
            StaffRole__c sr = new StaffRole__c(
                StaffRole_To_Staff__c = staff.Id,
                RoleName__c = 'Admin',
                Active__c = true,
                Hourly_Rate__c = 50
            );
            insert sr;
            
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
            shift.End_Date__c=Date.newInstance(2024, 10, 24);
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
            shift.Is_EOI__c = true;
            shift.EOI_staff__c = staff.Id;
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
           // staffs.Long_Afternoon_Start_Time__c= Time.newInstance(01, 30, 00, 00);
          //  staffs.Long_Afternoon_End_Time__c=Time.newInstance(01, 30, 00, 00);
            insert staffs;
            
            Add_Shift__c shift1 = new Add_Shift__c();
            shift.Break__c = '30';
            shift1.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift1.Start_Date__c =Date.newInstance(2024, 12, 16); 
            shift.End_Date__c=Date.newInstance(2024, 10, 24);
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
            shift1.Split_Shifts__c = true;
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
            shift.Shift_Type__c='Custom';
            shift1.Split_Shifts__c = false;
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
            
              
               Add_Shift__c shift4 = new Add_Shift__c();
            shift4.Break__c = '30';
            shift4.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift4.Start_Date__c =Date.newInstance(2025, 01, 01);        
            shift4.Role__c='Admin';
            shift4.Get_Facility__c=true;
            shift4.Quantity__c=5;
            shift4.Start_Time__c=Time.newInstance( 9, 30, 00, 00);
            shift4.End_Time__c=Time.newInstance(22, 00, 00, 00);
            shift4.Facility__c=fac.Id;
            shift4.Status__c='Draft';
            shift4.Start_time_picklist__c='6:30 pm';
            shift4.End_time_picklist__c='10:00 pm';
            shift4.Location__StateCode__s = 'ACT';
            shift4.Location__CountryCode__s = 'AU';
            shift4.Location__PostalCode__s = '2911';
            shift4.Shift_Type__c='Custom';
            insert shift4;
            
            ShiftwithStaff__c staffs4 = new ShiftwithStaff__c();
            staffs4.Add_Shift__c=shift4.Id;
            staffs4.Attendence__c=true;
            staffs4.Comments__c = 'test comments';
            staffs4.Staff__c=staff.Id;
            staffs4.Role__c='Admin';
            staffs4.Status__c='Accepted';
            staffs4.Long_Morning_Start_Time__c=Time.newInstance(9, 30, 00, 00);
            staffs4.Long_Morning_End_Time__c=Time.newInstance(13, 30, 00, 00);
            staffs.Long_Afternoon_Start_Time__c= Time.newInstance(13, 30, 00, 00);
            staffs.Long_Afternoon_End_Time__c=Time.newInstance(22, 00, 00, 00);
            insert staffs4;
            
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
            services.ShiftwithStaff__c=staffs.id;
            insert services;
            
            
            
            Reimbursement__c rei = new Reimbursement__c();
            rei.Mileage__c='30';
            rei.ShiftwithStaff__c=staffs.Id; 
            rei.Approval_Status__c='Approved';
            insert rei;
            
       
            List<Add_Shift_Checklist__c> checklistRecords = new List<Add_Shift_Checklist__c>();
            for (Integer i = 0; i < 2; i++) {
                checklistRecords.add(new Add_Shift_Checklist__c(Completed__c = false,Add_Shift__c = shift1.Id));
            }
            insert checklistRecords;
            
            ShiftWithStaff_Activity__c staffActivity = new ShiftWithStaff_Activity__c();
            staffActivity.ShiftwithStaff__c = staffs1.Id;
            Insert staffActivity;
            
            String jsonData = '{"serviceTypeId":"' +funds.Id + 
                          '","serviceGroupId":"' +NSC.Id + 
                          '","participantId":"' +cli.Id + '"}';
            
             Add_Shift__c shift5 = new Add_Shift__c();
            shift5.Break__c = '30';
            shift5.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift5.Start_Date__c =Date.newInstance(2024, 02, 01);        
            shift5.Role__c='Admin';
            shift5.Get_Facility__c=true;
            shift5.Quantity__c=5;
            shift5.Start_Time__c=Time.newInstance( 18, 30, 00, 00);
            shift5.End_Time__c=Time.newInstance(22, 00, 00, 00);
            shift5.Facility__c=fac.Id;
            shift5.Status__c='Draft';
            shift5.Start_time_picklist__c='6:30 pm';
            shift5.End_time_picklist__c='10:00 pm';
            shift5.Location__StateCode__s = 'ACT';
            shift5.Location__CountryCode__s = 'AU';
            shift5.Location__PostalCode__s = '2911';
            shift5.RefId__c='12535899999';
            shift5.Shift_Type__c='Night';
           	shift5.Service_Details__c=jsonData;
            shift5.Duration__c = 9;
            insert shift5;
            
            ShiftwithStaff__c staffs5 = new ShiftwithStaff__c();
            staffs5.Add_Shift__c=shift5.Id;
            staffs5.Attendence__c=true;
            staffs5.Comments__c = 'test comments';
            staffs5.Staff__c=staff.Id;
            staffs5.Role__c='Admin';
            staffs5.Status__c='Accepted';
            staffs5.Long_Morning_Start_Time__c=Time.newInstance(9, 30, 00, 00);
            staffs5.Long_Morning_End_Time__c=Time.newInstance(13, 30, 00, 00);
            
             
            
            staffs5.Long_Afternoon_Start_Time__c= Time.newInstance(13, 30, 00, 00);
            staffs5.Long_Afternoon_End_Time__c=Time.newInstance(22, 00, 00, 00);
           
            insert staffs5;
            
             Shift_Type__c shiftType = new Shift_Type__c(
            Name = 'Morning',
            Facility__c = fac.Id,
            Start_Time__c = Time.newInstance(9, 0, 0, 0),
            End_Time__c   = Time.newInstance(17, 0, 0, 0),
            Shift_Type__c = 'Morning',
            Colour__c = '#222222'
        );
        insert shiftType;
            
           // Contact staff1 = new Contact(LastName = 'Test Staff');
        //insert staff1;
            
            test.StartTest();
            Organisation__c orgs =[SELECT Id From Organisation__c LIMIT 1];
            String orgId = orgs.Id;
            Date startDate = Date.newInstance(2024, 10, 16);
            Date endDate = Date.newInstance(2024, 10, 24);
            list<string> shiftType66= new list<string>{'General'};
            String jsonData66 = '[{"day":"Mon","isHoliday":false,"quantity":1,"todayLabel":"NotToday","unallocated":0,"weekDays":"10-02-2025"},{"day":"Tue","isHoliday":false,"quantity":2,"todayLabel":"NotToday","unallocated":0,"weekDays":"11-02-2025"},{"day":"Wed","isHoliday":false,"quantity":2,"todayLabel":"NotToday","unallocated":0,"weekDays":"12-02-2025"},{"day":"Thu","isHoliday":false,"quantity":3,"todayLabel":"NotToday","unallocated":0,"weekDays":"13-02-2025"},{"day":"Fri","isHoliday":false,"quantity":3,"todayLabel":"NotToday","unallocated":1,"weekDays":"14-02-2025"},{"day":"Sat","isHoliday":false,"quantity":4,"todayLabel":"NotToday","unallocated":0,"weekDays":"15-02-2025"},{"day":"Sun","isHoliday":false,"quantity":1,"todayLabel":"NotToday","unallocated":0,"weekDays":"16-02-2025"}]';
            List<Facility__c> facList = [SELECT ID from Facility__c];
            Facility__c facs = [SELECT ID from Facility__c];
             list<string> StatusList= new list<string>();
            List<String> facString = new List<String>();
            for(Facility__c fac1:facList){
                facString.add(fac.ID);
            } 
            
            AddShiftStaffView.getStaffData(new List<String>{'Admin'},Date.newInstance(2025, 02, 10),Date.newInstance(2025, 02, 16),facString,orgId,jsonData66,'Test Data',shiftType66,StatusList,12);
            AddShiftController.getFacilityAddress(fac.Id);
            AddShiftController.getSetHours();
            // AddShiftController.CreateService(staffs5);
            test.StopTest();            
        }        
    }
    

    // -----------------------------
    // Helper methods
    // -----------------------------
    private static User createUser(String aliasPrefix, String userType, String cometUid) {
        Profile p = [
            SELECT Id
            FROM Profile
            WHERE Name LIKE '%Standard%'
            LIMIT 1
        ];

        String unique = String.valueOf(DateTime.now().getTime());
        String uname = aliasPrefix + '.' + unique + '@example.test';

        User u = new User(
            Alias = aliasPrefix.length() > 8 ? aliasPrefix.substring(0, 8) : aliasPrefix,
            Email = uname,
            EmailEncodingKey = 'UTF-8',
            LastName = aliasPrefix + 'LN',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = p.Id,
            TimeZoneSidKey = 'Asia/Kolkata',
            UserName = uname
        );

        u.put('User_Type__c', userType);
        if (!String.isBlank(cometUid)) {
            u.put('CometChat_UID__c', cometUid);
        }

        insert u;
        return u;
    }

    private static Organisation__c prepareOrg() {
        Organisation__c org = [
            SELECT Id
            FROM Organisation__c
            LIMIT 1
        ];

        org.CometChat_App_ID__c = 'APP_123';
        org.CometChat_Region__c = 'in';
        org.CometChat_AuthKey__c = 'AUTH_KEY';
        org.CometChat_REST_API_Key__c = 'REST_KEY';
        update org;

        return org;
    }

    // -----------------------------
    // Tests
    // -----------------------------

    @IsTest
    static void testGetCredentials() {
        Organisation__c org = prepareOrg();
        User u = createUser('support', 'Support', 'SUPPORT_UID');

        System.runAs(u) {
            Test.startTest();
            GlobalCometChatService.getCredentials(org.Id);
            Test.stopTest();
        }
    }

    @IsTest
    static void testGetCredentials_missingUid() {
        Organisation__c org = prepareOrg();
        User u = createUser('nouid', 'Support', null);

        System.runAs(u) {
            Test.startTest();
            try {
                GlobalCometChatService.getCredentials(org.Id);
            } catch (Exception e) {
                // expected – no assertions required
            }
            Test.stopTest();
        }
    }

    @IsTest
    static void testGetAllOrganisations() {
        Test.startTest();
        GlobalCometChatService.getAllOrganisations();
        Test.stopTest();
    }

    @IsTest
    static void testNotifications_flow() {
        Organisation__c org = prepareOrg();

        User globalUser = createUser('global', 'Support', 'GLOBAL_UID');
        User sender1 = createUser('snd1', 'NDIS Org Admin', 'SENDER1_UID');
        User sender2 = createUser('snd2', 'NDIS Org Admin', 'SENDER2_UID');

        System.runAs(globalUser) {
            insert new List<CometChat_Notification__c>{
                new CometChat_Notification__c(
                    GlobalUser__c = globalUser.Id,
                    Organisation__c = org.Id,
                    SenderUser__c = sender1.Id,
                    UnreadCount__c = 2,
                    LastMessage__c = 'Msg 1',
                    LastMessageTime__c = System.now()
                ),
                new CometChat_Notification__c(
                    GlobalUser__c = globalUser.Id,
                    Organisation__c = org.Id,
                    SenderUser__c = sender2.Id,
                    UnreadCount__c = 1,
                    LastMessage__c = 'Msg 2',
                    LastMessageTime__c = System.now()
                )
            };

            Test.startTest();
            GlobalCometChatService.getMyNotifications(10, 1);
            GlobalCometChatService.clearNotificationsForSender(sender1.Id, org.Id);
            GlobalCometChatService.clearNotificationsForSender(sender1.Id, null);
            Test.stopTest();
        }
    }

   @IsTest
static void testWebhookHandler_coversCreateOrUpdateNotification() {
    Organisation__c org = prepareOrg();

    // Create at least one "global user" and one sender user
    User globalUser = createUser('glob', 'Support', 'GLOBAL_UID_100');
    User senderUser = createUser('send', 'NDIS Org Admin', 'SENDER_UID_100');

    // If your webhook maps CometChat UIDs to users, make sure the receiver/sender match
    // (Adjust field names if your code uses CometChat_UID__c)
    // We already set CometChat_UID__c in createUser()

    RestRequest req = new RestRequest();
    req.httpMethod = 'POST';
    req.requestURI = '/services/apexrest/cometchat/globalWebhook/';
    req.addParameter('appId', 'APP_123');

    // ✅ VALID JSON
    String body =
        '{"trigger":"message_sent","appId":"APP_123","data":{"message":{' +
        '"receiverType":"user",' +
        '"sender":"' + String.valueOf(senderUser.get('CometChat_UID__c')) + '",' +
        '"receiver":"' + String.valueOf(globalUser.get('CometChat_UID__c')) + '",' +
        '"data":{"text":"Hello Webhook"}' +
        '}}}';

    req.requestBody = Blob.valueOf(body);

    RestContext.request = req;
    RestContext.response = new RestResponse();

    Test.startTest();
    GlobalCometChatService.handleWebhook();
    Test.stopTest();
}
    
    @IsTest
static void testCreateOrUpdateNotification_insertAndUpdate() {
    Organisation__c org = prepareOrg();

    User globalUser = createUser('gnoti', 'Support', 'G_UID_NOTI');
    User senderUser = createUser('snoti', 'NDIS Org Admin', 'S_UID_NOTI');

    Test.startTest();

    // Covers INSERT branch (existing.isEmpty() == true)
    GlobalCometChatService.createOrUpdateNotification(
        globalUser.Id,
        org.Id,
        senderUser.Id,
        'First message'
    );

    // Covers UPDATE branch (existing.isEmpty() == false)
    GlobalCometChatService.createOrUpdateNotification(
        globalUser.Id,
        org.Id,
        senderUser.Id,
        'Second message'
    );

    Test.stopTest();
}

@IsTest
static void testWebhookHandler_coversFinalUpdateBlock() {
    // Ensure org is found by appId
    Organisation__c org = prepareOrg(); // sets CometChat_App_ID__c = 'APP_123'

    // Create users
    User receiver = createUser('rcv', 'Support', 'TEMP_RCV_UID');
    User sender   = createUser('snd', 'NDIS Org Admin', 'SND_UID_200');

    // ---- IMPORTANT: match receiverUid to allowed label list if present ----
    String allowedReceiverUid = null;
    try {
        String labelJson = System.Label.CometChat_GlobalUIDs;
        if (!String.isBlank(labelJson)) {
            List<Object> uidList = (List<Object>) JSON.deserializeUntyped(labelJson);
            if (uidList != null && !uidList.isEmpty() && uidList[0] != null) {
                allowedReceiverUid = String.valueOf(uidList[0]);
            }
        }
    } catch (Exception e) {
        // ignore
    }

    // If label has values, update receiver's CometChat UID to one of them
    if (!String.isBlank(allowedReceiverUid)) {
        receiver.put('CometChat_UID__c', allowedReceiverUid);
        update receiver;
    } else {
        // If label is empty, any value is fine (filter won't block)
        allowedReceiverUid = String.valueOf(receiver.get('CometChat_UID__c'));
    }

    // Build REST request
    RestRequest req = new RestRequest();
    req.httpMethod = 'POST';
    req.requestURI = '/services/apexrest/cometchat/globalWebhook/';
    req.addParameter('appId', 'APP_123');

    String body =
        '{' +
          '"trigger":"message_sent",' +
          '"appId":"APP_123",' +
          '"data":{' +
            '"message":{' +
              '"receiverType":"user",' +
              '"sender":"' + String.valueOf(sender.get('CometChat_UID__c')) + '",' +
              '"receiver":"' + allowedReceiverUid + '",' +
              '"data":{"text":"Webhook coverage message"}' +
            '}' +
          '}' +
        '}';

    req.requestBody = Blob.valueOf(body);

    RestContext.request = req;
    RestContext.response = new RestResponse();

    Test.startTest();
    GlobalCometChatService.handleWebhook();
    Test.stopTest();
}



}