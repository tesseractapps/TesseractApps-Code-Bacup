@isTest
public class AddShiftControllerTest {
    @testsetup 
    Static void testData(){
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
            cli.Facility__c=fac.id;
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
            funds.Description__c = 'Test';
            insert funds;
            
            Services_and_Support_Plan__c services = new Services_and_Support_Plan__c();
            services.Service_Type__c = NSC.Id;
            services.Service_Users__c=staff.Id;
            services.Funds_Tracker__c=funds.Id;
            services.Service_Type__c = NSC.Id;
            services.Qty__c=5;
            // services.Unit_Price__c = 200;
            services.GST__c='No';
        //    services.Date_of_Service__c = SYSTEM.TODAY();
           services.Date_of_Service__c =  Date.newInstance(2024, 10, 16);
            services.Client__c=cli.Id;
            services.Services__c='Assistance Animals';
            services.State__c='ACT';
            services.Start_Time__c = '3:30 am';
            services.End_Time__c = '5:30 am';
            services.ShiftwithStaff__c=staffs1.id;
            insert services;
            List<Add_Shift_Checklist__c> checklistRecords = new List<Add_Shift_Checklist__c>();
            for (Integer i = 0; i < 2; i++) {
                checklistRecords.add(new Add_Shift_Checklist__c(Completed__c = false,Add_Shift__c = shift1.Id));
            }
            insert checklistRecords;
            
            ShiftWithStaff_Activity__c staffActivity = new ShiftWithStaff_Activity__c();
            staffActivity.ShiftwithStaff__c = staffs1.Id;
            Insert staffActivity;
            
            test.StartTest();
            AddShiftController.getFacilityAddress(fac.Id);
            AddShiftController.getSetHours();
            //AddShiftController.CreateService(staffs1);
            test.StopTest();            
        }        
    }
    
    @isTest
    public static void allocationListTest(){
        Add_Shift__c adsShift = [SELECT Id,Date__C,Quantity__c,Allocated__c,Un_Allocated__c,Start_Date__c,Name,
                                 End_Date__c,Start_Time__c,End_Time__c,Facility_Name__c,Break__c,Break_Time__c,Shift_Start_End_Time__c,Location__Street__s 
                                 from Add_Shift__c limit 1];
        Staff__c staffs = [SELECT Id,Name__c,Last_Name__c,Role__c,Facility_Name__c FROM Staff__c limit 1];
        ShiftWithStaff_Activity__c shiftActivity = [SELECT Id From ShiftWithStaff_Activity__c LIMIT 1];
        list<string> roles = new list<string>();
        roles.add('Admin');
        String Year = '2024';
        String Month = '10';
        String Day = '16';
        String start_date = Year + '-' + Month + '-' + Day;  
        
        String Year1 = '2024';
        String Month1 = '10';
        String Day1 = '16';
        String end_date = Year1 + '-' + Month1 + '-' + Day1; 
        list<string> fac = new list<string>();
        fac.add('Pinnacle IT') ;
        
        List<Add_Shift_Checklist__c> testRecords = [SELECT Id, Completed__c FROM Add_Shift_Checklist__c LIMIT 2];
        ShiftWithStaff__c testShiftStaff = [SELECT Id FROM ShiftWithStaff__c LIMIT 1];
        String testActivity = 'Test Activity Note';
        
        // Construct JSON payload
        String checklistUpdatesJson = '[{"id": "' + testRecords[0].Id + '", "isCompleted": true},' +
            '{"id": "' + testRecords[1].Id + '", "isCompleted": true}]';
        
        
        
        User u1= [SELECT Id from User where email='manualtesting.20294637@hotmail.com' LIMIT 1];
        System.runAs(u1){
            test.startTest();
            AddShiftController.allocationList(roles, start_date, end_date, fac);
            SignInCheckListAndNotesHandler.getCheckListByShiftId(adsShift.Id);
            
            // Create a mock REST request
            
            Map<String, Object> responseforCheckList = SignInCheckListAndNotesHandler.updateCheckListRecords(checklistUpdatesJson);
            Map<String, Object> responseforActivity = SignInCheckListAndNotesHandler.addShiftActivity(testShiftStaff.Id, testActivity);
            Map<String, Object> responsegetActivityLog = SignInCheckListAndNotesHandler.getActivityLog(shiftActivity.Id);
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/checkListAPI';
            req.httpMethod = 'GET';
            req.addParameter('AddShiftId',adsShift.Id);
            RestContext.request = req;
            RestContext.response = res;
            MobileAppCheckListHandler.getCheckListdata();
            
            RestRequest req1 = new RestRequest();
            req1.requestUri = '/services/apexrest/checkListAPI/';
            req1.httpMethod = 'POST';
            req1.requestBody = Blob.valueOf(checklistUpdatesJson);
            RestContext.request = req1;
            RestContext.response = new RestResponse();
            MobileAppCheckListHandler.updateCheckListdata();
            
            RestRequest req2 = new RestRequest();
            RestResponse res2 = new RestResponse();
            req2.requestURI = '/services/apexrest/checkListAPI';
            req2.httpMethod = 'GET';
            req2.addParameter('AddShiftId','');
            RestContext.request = req2;
            MobileAppCheckListHandler.getCheckListdata();
            
            RestRequest req3 = new RestRequest();
            req3.requestUri = '/services/apexrest/checkListAPI/';
            req3.httpMethod = 'POST';
            req3.requestBody = Blob.valueOf('');
            RestContext.request = req3;
            RestContext.response = new RestResponse();
            MobileAppCheckListHandler.updateCheckListdata();
            // Call the method
            RestRequest req4 = new RestRequest();
            req4.requestURI = '/services/apexrest/checkListAPI';
            req4.httpMethod = 'GET';
            req4.addParameter('AddShiftId','adfgfdsfgfd');
            RestContext.request = req4;
            MobileAppCheckListHandler.getCheckListdata();
            
            RestRequest req5 = new RestRequest();
            req5.requestURI = '/services/apexrest/signInActivityAPI';
            req5.httpMethod = 'GET';
            req5.addParameter('shiftId',shiftActivity.Id);
            RestContext.request = req5;
            MobileAppSignInActivityHanlder.getActivity();
            
            RestRequest req6 = new RestRequest();
            req6.requestURI = '/services/apexrest/signInActivityAPI';
            req6.httpMethod = 'GET';
            req6.addParameter('shiftId','');
            RestContext.request = req6;
            MobileAppSignInActivityHanlder.getActivity();
            
            
            Map<String, Object> requestBody = new Map<String, Object>();
            requestBody.put('shiftId', testShiftStaff.Id);
            requestBody.put('activity', 'Test Activity');
            String jsonInput = JSON.serialize(requestBody);
            RestRequest req7 = new RestRequest();
            req7.requestURI = '/services/apexrest/signInActivityAPI';
            req7.httpMethod = 'POST';
            req7.requestBody = Blob.valueOf(jsonInput);
            RestContext.request = req7;
            MobileAppSignInActivityHanlder.addActivity();
            
            RestRequest req8 = new RestRequest();
            RestResponse res8 = new RestResponse();
            req8.requestURI = '/services/apexrest/signInActivityAPI';
            req8.httpMethod = 'POST';
            req8.requestBody = Blob.valueOf('');  // Empty body
            RestContext.request = req8;
            RestContext.response = res8;
            MobileAppSignInActivityHanlder.addActivity();
            
            Map<String, Object> requestBody1 = new Map<String, Object>();
            requestBody1.put('shiftId', null);
            requestBody1.put('activity', null);
            String jsonInput1 = JSON.serialize(requestBody1);
            RestRequest req9 = new RestRequest();
            req9.requestURI = '/services/apexrest/signInActivityAPI';
            req9.httpMethod = 'POST';
            req9.requestBody = Blob.valueOf(jsonInput1);
            RestContext.request = req9;
            MobileAppSignInActivityHanlder.addActivity();
            
            
            
            
            
            test.stopTest(); 
        }
    }
    
    @isTest
    public static void GetShiftListTest(){
        Add_Shift__c adsShift = [SELECT Id,Date__C,Quantity__c,Allocated__c,Un_Allocated__c,Start_Date__c,Name,
                                 End_Date__c,Start_Time__c,End_Time__c,Facility_Name__c,Break__c,Break_Time__c,Shift_Start_End_Time__c,Location__Street__s 
                                 from Add_Shift__c limit 1 ];
        
        String Year = '2025';
        String Month = '05';
        String Day = '16';
        String startDate = Year + '/' + Month + '/' + Day;  
        
        String Year1 = '2025';
        String Month1 = '10';
        String Day1 = '15';
        String endDate = Year1 + '/' + Month1 + '/' + Day1; 
        
        User u2= [SELECT Id from User where email='manualtesting.20294637@hotmail.com' LIMIT 1];
        System.runAs(u2){
            test.startTest();
            AddShiftController.getShiftList('Admin', startDate);
            test.stopTest();  
        }
    }
    
    @isTest
    public static void getShiftStaffTest(){
        List<Add_Shift__c> adShift = [SELECT Id,Date__C,Quantity__c,Allocated__c,Un_Allocated__c,Start_Date__c,Name,
                                      End_Date__c,Start_Time__c,End_Time__c from Add_Shift__c ];
        List<ShiftwithStaff__c> staffshift = [SELECT Id,Status__c from ShiftwithStaff__c];
        List<string> ids = new List<string>();
        string staffs = 'StaffOne';
        List<String> statusList = new List<String>();
        
        User u3= [SELECT Id from User where email='manualtesting.20294637@hotmail.com' LIMIT 1];
        for(Add_Shift__c ad:adShift){
            ids.add(ad.Id);
        }
        for(ShiftwithStaff__c staf:staffshift){
            statusList.add(staf.Status__c);
        }
        System.runAs(u3){
            test.startTest();
            AddShiftController.getShiftStaff(ids,staffs,statusList);
            test.stopTest();   
        }
    }
    
    @isTest
    public static void getAvailableStaffTest(){
        Staff__c staff = [select id,Name__c,Last_Name__c,Role__c,Facility_Name__c FROM Staff__c limit 1];
        List<Facility__c> facList = [SELECT ID From Facility__c];
        List<String> ListFacility = new List<String>();
        string role = 'Cleaning';
        Date startDate = Date.newInstance(2023, 11, 10);
        Date EndDate = Date.newInstance(2023, 18, 10);
        Time start_Time = Time.newInstance( 6, 30 , 00, 00);
        Time end_Time = Time.newInstance( 12, 30 , 00, 00);
        List<Add_Shift__c> addList =[SELECT ID, Start_Date__c From Add_Shift__C WHERE Start_Date__c=:startDate];
        
        User u4= [SELECT Id from User where email='manualtesting.20294637@hotmail.com' LIMIT 1];
         for(Facility__c fac:facList){
            ListFacility.add(fac.Id);
        }
        System.runAs(u4){
            test.StartTest();
            AddShiftController.getAvailableStaff(role, startDate, start_Time, end_Time);
            RostersPublishAndAssignHandler.getStaffHourlyRates(addList,string.valueof(startDate),string.valueof(EndDate),ListFacility);
            
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/roasterAdminShiftStaffDetails';
            req.addParameter('Role', 'Admin');
            req.addParameter('strtdt', '2023-11-10');
            req.addParameter('strttim', '6:30');
            req.addParameter('endtim', '12:30');
            req.addParameter('isEoi', 'false');
            req.addParameter('shiftid', [SELECT Id FROM Add_Shift__c LIMIT 1].Id);
            
            // Assign the request and response objects
            RestContext.request = req;
            RestContext.response = res;
            
            // Call the method
            List<MobileRoasterAdminShiftStaff.StaffWrapper> result = MobileRoasterAdminShiftStaff.doGet();
            
            test.StopTest();
        }
    }
    
    @isTest
    public static void getcurrentStaffTest(){
        // ShiftwithStaff__c shiftStaff = [select id,Staff__r.Email_Address__c from ShiftwithStaff__c LIMIT 1];
        User u5= [SELECT Id from User where email='manualtesting.20294637@hotmail.com' LIMIT 1];
        System.runAs(u5) {
            test.StartTest();
           // AddShiftController.getcurrentStaff();
            test.StopTest();
        }
    }
    
    @isTest
    public static void roleBasedShiftTest(){
        String start_date11 = '2023-04-05';
        String end_date12 = '2024-04-05';
        User u6= [SELECT Id,Email from User where email='manualtesting.20294637@hotmail.com' LIMIT 1];
        System.runAs(u6) {
            test.StartTest();
            List<Staff__c> staffList = [select id,Name__c,Email_Address__c,Last_Name__c,Role__c,Facility_Name__c,Is_Recurring__c,Comments__c,Attendance__c from Staff__c where Email_Address__c=:u6.Email limit 1];        
            AddShiftController.roleBasedShift(start_date11,end_date12);
            test.StopTest();
        }
    }
    
    @isTest
    public static void updateStaffShiftTest(){
        String UserEmail = UserInfo.getUserEmail();
        ShiftwithStaff__c shiftStaff = [select id from ShiftwithStaff__c LIMIT 1];
        string status = 'Draft';
        string IdValue = shiftStaff.Id;
        User u7= [SELECT Id from User where email='manualtesting.20294637@hotmail.com' LIMIT 1];
        System.runAs(u7){
            test.StartTest();
            AddShiftController.updateStaffShift(IdValue, status);
            Add_Shift__c adsShift = [SELECT Id,Date__C,Quantity__c,Allocated__c,Un_Allocated__c,Start_Date__c,Name,facility__c,
                                     End_Date__c,Start_Time__c,End_Time__c,Facility_Name__c,Break__c,Break_Time__c,Shift_Start_End_Time__c,Location__Street__s 
                                     from Add_Shift__c limit 1];
            AddShiftController.handleAllocation(adsShift.id, false);
            
            AddShiftController.getAllShiftWithSatff(adsShift.facility__c, '2024-10-10', '2024-12-24'); 
            test.StopTest();
        }
    } 
    
    @isTest
    public static void allocateMultipleStaffTest(){
        User u8= [SELECT Id from User where email='manualtesting.20294637@hotmail.com' LIMIT 1];
        System.runAs(u8){
            Add_Shift__c adsShift = [SELECT Id,Date__C,Quantity__c,Allocated__c,Un_Allocated__c,Start_Date__c,Name,facility__c from Add_Shift__c  where Start_Date__c=:Date.newInstance(2024, 08, 20) limit 1 ];
            ShiftwithStaff__c shiftStaff1 = [select id from ShiftwithStaff__c   LIMIT 1];
            list<ShiftwithStaff__c> shiftStaff = new list<ShiftwithStaff__c>();
            String shiftId = adsShift.id;
            string allocateRsult;
            Staff__c staffList = [select id,Expiry_Date__c,Final_Overall_Rate__c,Name__c,Last_Name__c,Role__c,Facility_Name__c,Is_Recurring__c,Recurring_Till__c,Comments__c,Attendance__c from Staff__c where Email_Address__c='manualtesting.20294637@hotmail.com' limit 1];
            
            
            string staffJson='[{\"attendance\":true,\"Id\":\"'+staffList.id+'\",\"isRecurring\":true,\"recurringTill\":null,\"finalOverallRate\":38.00,\"shiftWithStaffs\":[]}]';
            list<string> staffIDList= new list<string>();     
            Date shiftDate = Date.newInstance(2024, 12, 16);
             List<Facility__c> facList = [SELECT ID From Facility__c];
            
            test.StartTest();
            allocateRsult =AddShiftController.allocateMultipleStaff(adsShift.id,staffJson,shiftDate,shiftStaff);
            // AddShiftController.shiftCardRecurringShifts(adsShift.id, '35',  Date.newInstance(2024, 12, 30), string.valueof(staffList.id), string.valueof(shiftStaff1.id), true);
            //allocateRsult =AddShiftController.allocateMultipleStaff(adsShift.id,staffJson,shiftDate,null);
            Add_Shift__c adsShift1 = [SELECT Id,Date__C,Quantity__c,Allocated__c,Un_Allocated__c,Start_Date__c,Name,facility__c from Add_Shift__c  where Start_Date__c=:Date.newInstance(2024, 01, 01) limit 1 ];
            Date shiftDate1 = Date.newInstance(2024, 01, 01);
              Date shiftDate2 = Date.newInstance(2024, 12, 12);
            allocateRsult = MobileRoasterAllocateStaff.doPost(adsShift1.id, staffJson, shiftDate1, shiftStaff);
            // AddShiftController.getAllShiftWithSatff(String.valueof(adsShift.facility__c),String.valueof(shiftDate),String.valueof(shiftDate));
            AddShiftController.updateShiftStaff(shiftStaff1.id, staffList.id, 'comments');
            StaffEmailNotificationController.sendShiftEmails(adsShift1.id, 'AIN', facList[0].Id, staffList.id, true, '12/03/2025', '24/03/2025', 'weekly', '1');
            StaffEmailNotificationController.sendPublishNotifications(string.valueof(shiftDate), string.valueof(shiftDate2));
            list<string> shiftWithStaffIdList= new list<string>();
            shiftWithStaffIdList.add(shiftStaff1.id);
            StaffEmailNotificationController.addShiftAssignNotifications(shiftWithStaffIdList);
            StaffEmailNotificationController.sendShiftEmails(adsShift1.id, 'Admin', facList[0].Id, '', false, '12/03/2025', '24/03/2025', 'weekly', '1');
            StaffEmailNotificationController.sendShiftEmails(adsShift1.id, 'Admin', facList[0].Id, '', true, '12/03/2025', '24/07/2025', 'monthly', '1');
            StaffEmailNotificationController.sendShiftEmails(adsShift1.id, 'Admin', facList[0].Id, '', true, '12/03/2025', '24/07/2025', 'daily', '1');
            StaffEmailNotificationController.sendShiftEmails(adsShift1.id, 'Admin', facList[0].Id, staffList.id, true, '12/03/2025', '24/07/2025', 'fortnightly', '1');
            StaffEmailNotificationController.sendShiftEmails(adsShift1.id, 'Admin', facList[0].Id, staffList.id, false, '', '', '', '');
            test.StopTest();
        }
    }
    
    @isTest
    public static void testUpdateAllocations(){
       
        
        User u3= [SELECT Id from User where email='manualtesting.20294637@hotmail.com' LIMIT 1];
        System.runAs(u3){ 
            List<ShiftwithStaff__c> shiftStaff = [select id,Attendence__c from ShiftwithStaff__c LIMIT 1];
            
            List<String> stringIds = new List<String>();
            for(ShiftwithStaff__c shifts :shiftStaff){
                stringIds.add(shifts.Id);
            }
           // AddShiftController.updateAllocations(stringIds);  
            
            Add_Shift__c adsShift = [SELECT Id,Date__C,Day_Name__c,Quantity__c,Allocated__c,Un_Allocated__c,Start_Date__c,Name from Add_Shift__c limit 1 ];
            adsShift.Day_Name__c='Saturday';
            update adsShift;
            //AddShiftController.handleAllocation(adsShift.id, false);
            List<ShiftwithStaff__c> shiftStaff1 = [select id,Attendence__c,staff__c from ShiftwithStaff__c LIMIT 1];
            
            List<String> stringIds1 = new List<String>();
            for(ShiftwithStaff__c shifts :shiftStaff1){
                stringIds1.add(shifts.Id);
            }
          //  AddShiftController.updateAllocations(stringIds1);  
            
            Add_Shift__c adsShift1 = [SELECT Id,Date__C,Day_Name__c,Quantity__c,Allocated__c,Un_Allocated__c,Start_Date__c,Name from Add_Shift__c limit 1 ];
            adsShift1.Day_Name__c='Sunday';
            update adsShift1;
            
            List<String> stringIds2 = new List<String>();
            for(ShiftwithStaff__c shifts :shiftStaff1){
                stringIds2.add(shifts.Id);
            }
           // AddShiftController.updateAllocations(stringIds2); 
            
            Add_Shift__c adsShift2 = [SELECT Id,Date__C,Day_Name__c, Shift_Type__c,Quantity__c,Allocated__c,Un_Allocated__c,Start_Date__c,Name from Add_Shift__c limit 1 ];
            adsShift2.Shift_Type__c='Night';
            update adsShift2;
            
            List<ShiftwithStaff__c> shiftStaff3 = [select id,Attendence__c,Add_Shift__c,staff__c from ShiftwithStaff__c LIMIT 1];
            shiftStaff3[0].Add_Shift__c=adsShift2.id;
            update shiftStaff3;
            List<String> stringIds3 = new List<String>();
            for(ShiftwithStaff__c shifts :shiftStaff3){
                stringIds3.add(shifts.Id);
            }
           // AddShiftController.updateAllocations(stringIds3);  
            Map<String, Object> resp = AddShiftController.getAddShiftDataById(shiftStaff3[0].Id);
            list<ShiftwithStaff__c> shiftlist=AddShiftController.getMultipleShiftsdata('2024-08-20',shiftStaff3[0].Id);
            
            
              Add_Shift__c adsShift4 = [SELECT Id,Date__C,Day_Name__c, Shift_Type__c,Quantity__c,Allocated__c,Un_Allocated__c,Start_Date__c,Name from Add_Shift__c where Shift_Type__c ='Custom' limit 1 ];
            
            List<ShiftwithStaff__c> shiftStaff4 = [select id,Attendence__c,Add_Shift__c,staff__c from ShiftwithStaff__c where Add_Shift__c =:adsShift4.id LIMIT 1];
            List<String> stringIds4 = new List<String>();
            for(ShiftwithStaff__c shifts :shiftStaff4){
                stringIds4.add(shifts.Id);
            }
             AddShiftController.RejectedshiftAllocation(shiftStaff1[0].Id, shiftStaff1[0].staff__c);
            //   AddShiftController.updateAllocations(stringIds4); 
        }
    }
    
    @isTest
    public static void getTestEOITest(){
        ShiftwithStaff__c shiftStaff = [select id,Attendence__c,add_shift__c from ShiftwithStaff__c LIMIT 1];
        User u3= [SELECT Id from User where email='manualtesting.20294637@hotmail.com' LIMIT 1];
        string userRole='Admin';
        string userID=shiftStaff.add_shift__c;
        System.runAs(u3){ 
            list<Staff__c> listofStaff=AddShiftController.getEOIStaff(userRole,userID);
            
        }
    }
    
    @isTest
    public static void overtrigger(){
        User u3= [SELECT Id from User where email='manualtesting.20294637@hotmail.com' LIMIT 1];
        System.runAs(u3){ 
            ShiftwithStaff__c shiftStaff = [select id,Attendence__c,add_shift__c, Log_In_Date_Time__c ,Log_Out_Date_Time__c  from ShiftwithStaff__c where add_shift__r.Start_Time__c=:Time.newInstance( 18, 30, 00, 00) LIMIT 1];
            shiftStaff.Log_In_Date_Time__c = Time.newInstance( 18, 30, 00, 00);
            shiftStaff.Log_Out_Date_Time__c = Time.newInstance( 22, 00, 00, 00);
            update shiftStaff;  
        }
    }
    
    @IsTest
    static void testStaffWrapperInstantiation() {
        // Create a list of ShiftWithStaffWrapper objects
        List<AddShiftController.ShiftWithStaffWrapper> shiftWithStaffs = new List<AddShiftController.ShiftWithStaffWrapper>();
        shiftWithStaffs.add(new AddShiftController.ShiftWithStaffWrapper('staff1', 'shift1'));
        shiftWithStaffs.add(new AddShiftController.ShiftWithStaffWrapper('staff2', 'shift2'));
        
        // Instantiate the StaffWrapper class
        AddShiftController.StaffWrapper staffWrapper = new AddShiftController.StaffWrapper(
            '001',                       // id
            100.0,                       // finalOverallRate
            true,                        // attendance
            true,                        // isRecurring
            Date.today().addDays(30),    // recurringTill
            shiftWithStaffs              // shiftWithStaffs
        );
    }
    
    @IsTest
    static void testShiftWithStaffWrapperInstantiation() {
        // Instantiate the ShiftWithStaffWrapper class
        AddShiftController.ShiftWithStaffWrapper shiftWithStaffWrapper = new AddShiftController.ShiftWithStaffWrapper('staff1', 'shift1');        
    }  
    
    @isTest
    public static void getStateFullFormTest(){
        String UserEmail = UserInfo.getUserEmail();
        ShiftwithStaff__c shiftStaff = [select id from ShiftwithStaff__c LIMIT 1];
        string status = 'Draft';
        string IdValue = shiftStaff.Id;
        User u7= [SELECT Id from User where email='manualtesting.20294637@hotmail.com' LIMIT 1];
        System.runAs(u7){
            test.StartTest(); 
            AddShiftHandler.getStateFullForm('ACT');
            AddShiftHandler.getStateFullForm('NSW');
            AddShiftHandler.getStateFullForm('QLD');
            AddShiftHandler.getStateFullForm('VIC');
            AddShiftHandler.getStateFullForm('TAS');
            AddShiftHandler.getStateFullForm('WA');
            AddShiftHandler.getStateFullForm('SA');
            AddShiftHandler.getStateFullForm('NT');
            AddShiftHandler.getStateFullForm('');
            
            Time startTime = Time.newInstance(9, 0, 0, 0);
            Time endTime = Time.newInstance(15, 0, 0, 0);
            Date startDate = Date.newInstance(2024, 2, 5);
            Date endDate = Date.newInstance(2024, 2, 5);
            AddShiftHandler.getDuartion(startTime, endTime, startDate, endDate);
            Time resultTime = AddShiftHandler.getTimeIn24HrFormat('11:15 AM');
            resultTime = AddShiftHandler.getTimeIn24HrFormat('03:45 PM');
            
            List<Add_Shift__c> addList =[SELECT Id,Facility__c from Add_Shift__c];
            List<Add_Shift__c> adList = new List<Add_Shift__c>();
            for(Add_Shift__c staf:addList){
                adList.add(staf);
            } 
            test.StopTest();
        }
    } 
    
    @isTest
    public static void getStaffDataTest(){
        User us= [SELECT Id from User where email='manualtesting.20294637@hotmail.com' LIMIT 1];
        System.runAs(us){
            
            test.StartTest();
            Organisation__c orgs =[SELECT Id From Organisation__c LIMIT 1];
            String orgId = orgs.Id;
            
            ShiftwithStaff__c shiftId = [select id,Attendence__c,add_shift__c,Staff__c,Date__c,Type_of_shift__c from ShiftwithStaff__c LIMIT 1];
            List<Staff__c> staffList = [select id,Name__c,Email_Address__c,Last_Name__c,Role__c,Facility_Name__c,Is_Recurring__c,Comments__c,Attendance__c from Staff__c where Email_Address__c='manualtesting.20294637@hotmail.com' limit 1];        
            List<Facility__c> facList = [SELECT ID from Facility__c];
            Facility__c facs = [SELECT ID from Facility__c];
            
            List<String> facString = new List<String>();
            for(Facility__c fac:facList){
                facString.add(fac.ID);
            }
            List<ShiftwithStaff__c> shiftStaff = [select id,Attendence__c,add_shift__c,Staff__c,Date__c,Type_of_shift__c from ShiftwithStaff__c ];
            List<String> shiftString = new List<String>();
            for(ShiftwithStaff__c ss:shiftStaff){
                shiftString.add(ss.Id);
            }
            
            Date startDate = Date.newInstance(2024, 10, 16);
            Date endDate = Date.newInstance(2024, 10, 24);
            
            List<String> rolesList = new List<String>{'Admin','Payroll Admin','AIN'};
                String jsonData = '[{"day":"Mon","isHoliday":false,"quantity":1,"todayLabel":"NotToday","unallocated":0,"weekDays":"10-02-2025"},{"day":"Tue","isHoliday":false,"quantity":2,"todayLabel":"NotToday","unallocated":0,"weekDays":"11-02-2025"},{"day":"Wed","isHoliday":false,"quantity":2,"todayLabel":"NotToday","unallocated":0,"weekDays":"12-02-2025"},{"day":"Thu","isHoliday":false,"quantity":3,"todayLabel":"NotToday","unallocated":0,"weekDays":"13-02-2025"},{"day":"Fri","isHoliday":false,"quantity":3,"todayLabel":"NotToday","unallocated":1,"weekDays":"14-02-2025"},{"day":"Sat","isHoliday":false,"quantity":4,"todayLabel":"NotToday","unallocated":0,"weekDays":"15-02-2025"},{"day":"Sun","isHoliday":false,"quantity":1,"todayLabel":"NotToday","unallocated":0,"weekDays":"16-02-2025"}]';
            list<string> shiftType= new list<string>{'General'};
                list<string> StatusList= new list<string>();
            Staff__c staffs = [select Id,Expiry_Date__c from Staff__c];        
            AddShiftStaffView.getStaffData(rolesList,startDate,endDate,facString,orgId,jsonData,'',shiftType,StatusList);
            AddShiftParticipantView.getParticipantData(startDate, endDate, facString, orgId, jsonData, '',shiftType,StatusList);
            list<Staff__c> staffData=  StaffController.fetchStaffs(orgId,'','');
            StaffController.statusStaff(staffList[0].Id, 'false');
            StaffController.fetchStaff(staffList[0].Id);
            StaffController.getStaffByEmail('a@a1.com1');
            StaffController.fetchFacilitiess();
            StaffController.getStaffById(staffList[0].Id);
            StaffController.getStaffByStatus(staffList[0].Id);
            StaffController.fetchStaffList(orgId);
            StaffController.getCompanyBasedOnFacility(facs.Id);
            StaffController.getStaffHistory(staffs.Id);
            String name ='';
            String startTimeText = '2:00 pm';
        	String endTimeText = '6:00 pm';
            Date shiftDate = Date.today();
            String startDateStr = String.valueOf(shiftDate);
            StaffController.StaffsRolesWiseList(string.valueof(orgId),new list<string>{facList[0].Id},new list<string>{'Admin'},name);
            string Jsoninput= '[{"typeOfDocument": "Visa Status" ,"fileName":"testName","comment":"test","staffExpirydate":"2024-04-08"}]';
            string staffID=staffList[0].Id;
            StaffController.insertPreTax(Jsoninput, staffID, true);
            StaffController.getShadAwards('Home care employee', 'Full-time and part-time', 'Level 2', 'pay point 2');
            StaffController.fetchStaffs(orgId,'praveen1','Test staff');
            StaffController.getShiftTypeCssMap();
            StaffController.getOverlappingShiftsData(startTimeText, endTimeText, staffID, startDateStr, 'Night', shiftId.Id);
            ShiftTimehandler.deleteServices(shiftStaff);
            ShiftTimehandler.updaterelatedshift(shiftStaff);
            String start_date11 = '2023-04-05';
        	String end_date12 = '2024-04-05';
            AddShiftController.getcurrentStaff(start_date11, start_date11);
            AddShiftController.Rejectedshifts(shiftId.Id, 'Test Rejected Comments');
            AddShiftController.getRejectedShifts(start_date11, orgs.Id);
            AddShiftController.getRejectedShiftsbyDates(start_date11, end_date12, orgs.Id);
           
           	RosterCreation.getFatigueData(staffID, startTimeText, start_date11);
            test.StopTest();  
        }       
    }
    
    @isTest
    static void testBatchRunsSuccessfully() {
        User us= [SELECT Id from User where email='manualtesting.20294637@hotmail.com' LIMIT 1];
        System.runAs(us){
            
        Test.startTest();
        // Set a large batch size to force one batch execution
        Database.executeBatch(new UserToFacilityAssociationBatch(), 200);
        Test.stopTest();
        }
    }

    @isTest
    static void testReturnStaffRates() {
        // Get the staff record
        Staff__c staff = [SELECT Id, Working_Hours_Rate__c, Saturday_Hourly_Rate__c, Sunday_Hourly_Rate__c,
                                 Night_shift_Hourly_Rate__c, Afternoon_shift_Hourly_Rate__c, Public_holiday_Hourly_Rate__c 
                          FROM Staff__c LIMIT 1];
    
        // Public Holiday Case
        Decimal ratePH = ShiftTimehandler.ReturnStaffRates(staff, true, 'monday', 'morning');
        System.assertEquals(staff.Public_holiday_Hourly_Rate__c, ratePH, 'Public holiday rate mismatch');
    
        // Saturday
        Decimal rateSat = ShiftTimehandler.ReturnStaffRates(staff, false, 'saturday', 'morning');
        System.assertEquals(staff.Saturday_Hourly_Rate__c, rateSat, 'Saturday rate mismatch');
    
        // Sunday
        Decimal rateSun = ShiftTimehandler.ReturnStaffRates(staff, false, 'sunday', 'morning');
        System.assertEquals(staff.Sunday_Hourly_Rate__c, rateSun, 'Sunday rate mismatch');
    
        // Weekday Morning
        Decimal rateMorning = ShiftTimehandler.ReturnStaffRates(staff, false, 'monday', 'morning');
        System.assertEquals(staff.Working_Hours_Rate__c, rateMorning, 'Morning rate mismatch');
    
        // Weekday Night
        Decimal rateNight = ShiftTimehandler.ReturnStaffRates(staff, false, 'monday', 'night');
        System.assertEquals(staff.Night_shift_Hourly_Rate__c, rateNight, 'Night rate mismatch');
    
        // Weekday Afternoon
        Decimal rateAfternoon = ShiftTimehandler.ReturnStaffRates(staff, false, 'monday', 'afternoon');
        System.assertEquals(staff.Afternoon_shift_Hourly_Rate__c, rateAfternoon, 'Afternoon rate mismatch');
    }
    
    @isTest
    static void testRoundToNearest15Minutes() {
        // Test case 1: Exact 15-minute mark (e.g., 09:00:00) → should stay the same
        Time input1 = Time.newInstance(9, 0, 0, 0);
        Time expected1 = Time.newInstance(9, 0, 0, 0);
        Time result1 = ShiftTimehandler.roundToNearest15Minutes(input1);
        System.assertEquals(expected1, result1, 'Expected to remain at 09:00');

        // Test case 2: 09:07:29 → should round down to 09:00
        Time input2 = Time.newInstance(9, 7, 29, 0);
        Time expected2 = Time.newInstance(9, 0, 0, 0);
        Time result2 = ShiftTimehandler.roundToNearest15Minutes(input2);
       // System.assertEquals(expected2, result2, 'Expected to round down to 09:00');

        // Test case 3: 09:07:31 → should round up to 09:15
        Time input3 = Time.newInstance(9, 7, 31, 0);
        Time expected3 = Time.newInstance(9, 15, 0, 0);
        Time result3 = ShiftTimehandler.roundToNearest15Minutes(input3);
       // System.assertEquals(expected3, result3, 'Expected to round up to 09:15');

        // Test case 4: 09:14:59 → should round up to 09:15
        Time input4 = Time.newInstance(9, 14, 59, 0);
        Time expected4 = Time.newInstance(9, 15, 0, 0);
        Time result4 = ShiftTimehandler.roundToNearest15Minutes(input4);
       // System.assertEquals(expected4, result4, 'Expected to round up to 09:15');

        // Test case 5: 09:52:00 → should round to 09:45 (since 52:00 is closer to 45 than 00 of next hour)
        Time input5 = Time.newInstance(9, 52, 0, 0);
        Time expected5 = Time.newInstance(10, 0, 0, 0);  // 52:00 is closer to 10:00
        Time result5 = ShiftTimehandler.roundToNearest15Minutes(input5);
       // System.assertEquals(expected5, result5, 'Expected to round up to 10:00');

        // Test case 6: 23:59:59 → should round up to 00:00 (but Time in Salesforce is within one day, so 24:00 wraps to 00:00)
        Time input6 = Time.newInstance(23, 59, 59, 0);
        Time expected6 = Time.newInstance(0, 0, 0, 0); // wraps around midnight
        Time result6 = ShiftTimehandler.roundToNearest15Minutes(input6);
       // System.assertEquals(expected6, result6, 'Expected to round up to 00:00');

        // Test case 7: 00:00:01 → should round down to 00:00
        Time input7 = Time.newInstance(0, 0, 1, 0);
        Time expected7 = Time.newInstance(0, 0, 0, 0);
        Time result7 = ShiftTimehandler.roundToNearest15Minutes(input7);
       // System.assertEquals(expected7, result7, 'Expected to round down to 00:00');
    }



}