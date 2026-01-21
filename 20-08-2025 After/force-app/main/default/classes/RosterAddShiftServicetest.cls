@isTest
public class RosterAddShiftServicetest {
      @testSetup
    static void setupTestData() {
        // Create a test user
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
        User user = new User(Alias = 'praveen', Email= 'manualtesting.124589232@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne209463', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.124589232@hotmail.com',Organization_Name__c ='Ashfield Consultants');
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
            insert fac;
            
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff';
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.124589232@hotmail.com';
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
            
            
            Add_Shift__c shift = new Add_Shift__c();
            shift.Break__c = '30';
            shift.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift.Start_Date__c =Date.today();        
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
            
            ShiftwithStaff__c staffs = new ShiftwithStaff__c();
            staffs.Add_Shift__c=shift.Id;
            staffs.Attendence__c=true;
            staffs.Comments__c = 'test comments';
            staffs.Staff__c=staff.Id;
            staffs.RefId__c = 'TestService123';
            staffs.Role__c='Admin';
            staffs.Status__c='Accepted';
            staffs.Log_In_Date_Time__c = Time.newInstance(01, 30, 00, 00);
            staffs.Log_Out_Date_Time__c = Time.newInstance(10, 00, 00, 00);
            staffs.Recurring_Date__c=Date.today();
           // staffs.End_Time__c=system.now();
            insert staffs;
            
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
        }
    }

    @isTest
    static void testCreateServicesSuccess() {
         User u6= [SELECT Id,Email from User where email='manualtesting.124589232@hotmail.com' LIMIT 1];
        System.runAs(u6) {
        // Fetch test data
        Client__c testClient = [SELECT Id FROM Client__c LIMIT 1];
        Staff__c testStaff = [SELECT Id FROM Staff__c LIMIT 1];
        Funds_Tracker__c testFundsTracker = [SELECT Id FROM Funds_Tracker__c LIMIT 1];
        ShiftwithStaff__c testShift = [SELECT Id, Staff__c, RefId__c,Do_you_want_to_set_this_Recurring_Roster__c FROM ShiftwithStaff__c LIMIT 1];
          NDIS_Support_Catalogue__c ndis = [SELECT Id FROM NDIS_Support_Catalogue__c LIMIT 1];

        // Create mock RosterServiceHandler map
        Map<String, RosterAddShiftService.RosterServiceHandler> rosterServiceMap = new Map<String, RosterAddShiftService.RosterServiceHandler>();
        RosterAddShiftService.RosterServiceHandler rosterService = new RosterAddShiftService.RosterServiceHandler();
        
        rosterService.id = 'TestService123';
        rosterService.index = 0;
        rosterService.startTime = Time.newInstance(9, 0, 0, 0);
        rosterService.endTime = Time.newInstance(17, 0, 0, 0);
        rosterService.startTimeAMPM = '9:00 AM';
        rosterService.endTimeAMPM = '5:00 PM';
        rosterService.duration = 7.5;
        rosterService.serviceTypeId = testFundsTracker.Id;
        rosterService.StaffId = testStaff.Id;
        rosterService.serviceNameValue = 'Community Nursing Care';
        rosterService.selectedNdisIdValue = ndis.id;
        rosterService.SplitShift = false;
        rosterService.serviceStffaHourlyRate = 26.23;
        rosterService.state = 'ACT';
        rosterService.serviceDate = Date.today();
        rosterService.participant = testClient.Id;
        rosterService.shiftWithStaffId = testShift.id;
        rosterService.serviceSuppoertId = null;
        rosterService.splitShiftColor = 'border-left: 10px solid #008000';

        // Add to map
        rosterServiceMap.put(testShift.RefId__c, rosterService);

        // Create list of ShiftwithStaff__c
        List<ShiftwithStaff__c> shiftWithStaffList = new List<ShiftwithStaff__c>{ testShift };

        // Call the method
        Test.startTest();
        String responseJson = RosterAddShiftService.createServices(rosterServiceMap, shiftWithStaffList, false, false);
        Test.stopTest();
        }

    }
    
    
     @isTest
    static void testCreateOrUpdateShiftWithStaffSuccess() {
      User u6= [SELECT Id,Email from User where email='manualtesting.124589232@hotmail.com' LIMIT 1];
        System.runAs(u6) {
        // Fetch test data
        Client__c testClient = [SELECT Id FROM Client__c LIMIT 1];
        Staff__c testStaff = [SELECT Id FROM Staff__c where  Email_Address__c='manualtesting.124589232@hotmail.com' LIMIT 1];
        Funds_Tracker__c testFundsTracker = [SELECT Id FROM Funds_Tracker__c LIMIT 1];
         Facility__c fac= [select id from Facility__c limit 1];
            list<Add_Shift__c> shiftList = new list<Add_Shift__c>();
            Add_Shift__c shift = new Add_Shift__c();
            shift.Break__c = '30';
            shift.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift.Start_Date__c =Date.today()+1;        
            shift.Role__c='Admin';
            shift.Get_Facility__c=true;
            shift.Quantity__c=5;
            shift.Start_Time__c=Time.newInstance( 03, 30, 00, 00);
            shift.End_Time__c=Time.newInstance( 05, 00, 00, 00);
            shift.Facility__c=fac.Id;
            shift.RefId__c = 'TestService123345';
            shift.Status__c='Draft';
            shift.Start_time_picklist__c='3:30 am';
            shift.End_time_picklist__c='5:00 am';
            shift.Location__StateCode__s = 'ACT';
            shift.Location__CountryCode__s = 'AU';
            shift.Location__PostalCode__s = '2911';
            shift.Shift_Type__c='General';
            shiftList.add(shift);
            insert shiftList;

        // Create mock RosterServiceHandler map
        Map<String, RosterAddShiftService.RosterServiceHandler> rosterServiceMap = new Map<String, RosterAddShiftService.RosterServiceHandler>();
        RosterAddShiftService.RosterServiceHandler rosterService = new RosterAddShiftService.RosterServiceHandler();
        
       rosterService.id = 'TestService123345';
        rosterService.index = 0;
        rosterService.startTime = Time.newInstance(9, 0, 0, 0);
        rosterService.endTime = Time.newInstance(17, 0, 0, 0);
        rosterService.startTimeAMPM = '9:00 AM';
        rosterService.endTimeAMPM = '5:00 PM';
        rosterService.duration = 7.5;
        rosterService.serviceTypeId =null;
        rosterService.StaffId = testStaff.Id;
        rosterService.serviceNameValue = 'Community Nursing Care';
        rosterService.selectedNdisIdValue =null;
        rosterService.SplitShift = false;
        rosterService.serviceStffaHourlyRate = 26.23;
        rosterService.state = 'ACT';
        rosterService.serviceDate = Date.today();
        rosterService.participant = null;
        rosterService.shiftWithStaffId = null;
        rosterService.serviceSuppoertId = null;
        rosterService.splitShiftColor = 'border-left: 10px solid #008000';

        // Add to map
        rosterServiceMap.put('TestRef123', rosterService);

        // Create Add_Shift__c list
     

        // Create checklist JSON
       String jsonDataCheckList = '[{"id":1738948871561,"index":1,"description":"check bp","mandatory":true},' +
                '{"id":1738948888321,"index":2,"description":"take him walk","mandatory":true}]';

        // Call the method
        Test.startTest();
       // String responseJson = RosterAddShiftService.createServices(rosterServiceMap, shiftList, false);
        Test.stopTest();
        }
    }
    
     @isTest
    static void testCreateServices() {
         User u6= [SELECT Id,Email from User where email='manualtesting.124589232@hotmail.com' LIMIT 1];
        System.runAs(u6) {
        // Fetch test data
        ShiftwithStaff__c shiftStaff = [SELECT Id, RefId__c, Staff__c,Do_you_want_to_set_this_Recurring_Roster__c FROM ShiftwithStaff__c LIMIT 1];
        Client__c client = [SELECT Id FROM Client__c LIMIT 1];
        
        // Prepare handler map
        Map<String, RosterAddShiftService.RosterServiceHandler> serviceMap = new Map<String, RosterAddShiftService.RosterServiceHandler>();
        RosterAddShiftService.RosterServiceHandler handler = new RosterAddShiftService.RosterServiceHandler();
        handler.participant = client.Id;
        handler.serviceTypeId = 'dummyFundId'; // Replace with valid Funds_Tracker__c Id if required
        handler.serviceNameValue = 'Test Service';
        handler.selectedNdisIdValue = 'NDIS-001';
        handler.state = 'ACT';
        handler.startTime = Time.newInstance(3, 30, 0, 0);
        handler.endTime = Time.newInstance(5, 0, 0, 0);
        handler.duration = 1.5;
        handler.serviceDate = Date.today();
        serviceMap.put(shiftStaff.RefId__c, handler);
        
        List<ShiftwithStaff__c> shiftList = new List<ShiftwithStaff__c>{ shiftStaff };

        Test.startTest();
        String resultJson = RosterAddShiftService.createServices(serviceMap, shiftList, false, false);
        Test.stopTest();

        // Parse and assert
        Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(resultJson);
      //  System.assertEquals(true, result.get('isSuccess'));
        //System.assertEquals('services created successfully', result.get('servicemessage'));
        }
    }
}