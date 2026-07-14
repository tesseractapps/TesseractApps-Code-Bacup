@isTest
public class ShiftwithStaffControllerTest {
    @TestSetup
    static void setupTestData() {
        Organisation__c org = new Organisation__c();
        org.Name='Age Grace Innovations';
        org.ABN__c='11234567891';
        org.ACN__c='878787878';
        org.Contact_No__c='6132899740';
        org.RCTI__c='RCTI1';
        org.Email__c='saieswar.k@tesseractapps.com';
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
        User user = new User(Alias = 'praveen', Email= 'saieswar.k123@tesseractapps.com', 
                             EmailEncodingKey='UTF-8', LastName='Test Friday4039572', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='saieswar.k123@tesseractapps.com',Organization_Name__c ='Age Grace Innovations',User_Type__c = 'ICT Admin');
        insert user;
        
         System.runAs(user) {
            Facility__c fac = new Facility__c();
            fac.Name='Age Grace Facility';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Address__CountryCode__s='AU';
            fac.Email__c= 'saieswar.k@tesseractapps.com';
            fac.Status__c=true;
            fac.Organisation__c= org.Id;
            fac.ABN__c='12234567987';
			fac.Phone__c = '12323432';
            insert fac;
        
            // Create Staff associated with the user's organization
            Staff__c staffRecord = new Staff__c(
                Name = 'Test Staff',
                Facility__c=fac.Id,
                Last_Name__c='Test staff',
                Contact_Number__c='56789908743',
                Email_Address__c = 'saieswar.k123@tesseractapps.com', 
                Address__Street__s='8 Keewong Street',
                Address__City__s = 'Crace',
                Address__StateCode__s='ACT',
                Address__PostalCode__s='2911',
                Emergency_Phone_Number__c='45678766675',
                Primary_Contact_Name__c='Praveen',
                Primary_Contact_Number__c='9908458298',
                Make_Primary_as_Approver__c=true,
                Primary_Contact_Email__c='praveenshesham.sps@gmail.com',
                Secondary_Contact_Name__c='maheswari',
                Secondary_Contact_Email__c='maheswari.adabalap@gmail.com',
                Make_Secondary_as_Approver__c=false,
                Secondary_Contact_Number__c='99084582958',
                Emp_exit_date__c = date.newInstance(2028, 01, 05),
                Emp_Start_Date__c = date.newInstance(2023, 02, 01),
                Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04),
                Date_Of_Birth__c = date.newInstance(2001, 02, 04),
                role__c='Admin',
                Residency_Type__c = 'Australian',
                Expiry_Date__c = date.newInstance(2025,02, 19),
                Type__c = 'Visa Status',
                Working_Hours_Rate__c=50
            );
            insert staffRecord;
            
             Add_Shift__c shift = new Add_Shift__c();
            shift.Break__c = '30';
            shift.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift.Start_Date__c =Date.newInstance(2025, 02, 11);  
           // shift.Role__c='Admin';
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
             
            ShiftwithStaff__c staffs1 = new ShiftwithStaff__c();
            staffs1.Add_Shift__c=shift.Id;
            staffs1.Attendence__c=true;
            staffs1.Comments__c = 'test comments';
            staffs1.Staff__c=staffRecord.Id;
            staffs1.Role__c='Admin';
            staffs1.Status__c='Accepted';
            staffs1.Shift_Rejected__c = true;
            staffs1.Enable_Sign_In__c = true;   
    		staffs1.Enable_Sign_Out__c = false;
            insert staffs1;
             
            ShiftwithStaff__c staffs2 = new ShiftwithStaff__c();
            staffs2.Add_Shift__c=shift.Id;
            staffs2.Attendence__c=true;
            staffs2.Comments__c = 'test comments';
            staffs2.Staff__c=staffRecord.Id;
            staffs2.Role__c='Admin';
            staffs2.Status__c='Accepted';
            staffs2.Shift_Rejected__c = true;
            staffs2.Enable_Sign_In__c = false;   
    		staffs2.Enable_Sign_Out__c = false; 
            insert staffs2;
                
            Add_Shift_Checklist__c  asch = new Add_Shift_Checklist__c();
            asch.Description__c=' teststs ';
            asch.Mandatory__c = true;
            asch.Add_Shift__c=shift.Id;
            insert asch;
             
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
            services.Service_Users__c=staffRecord.Id;
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
    
            // Create ShiftwithStaff records for the past 7 days
            for (Integer i = 1; i <= 7; i++) {
                ShiftwithStaff__c staffs = new ShiftwithStaff__c();
                staffs.Add_Shift__c=shift.Id;
                staffs.Attendence__c=true;
                staffs.Comments__c = 'test comments';
                staffs.Staff__c=staffRecord.Id;
                staffs.Role__c='Admin';
                staffs.Status__c='Accepted';
                staffs.Log_In_Date_Time__c = Time.newInstance( 5, 30, 00, 00);
                staffs.Log_Out_Date_Time__c = Time.newInstance( 7, 00, 00, 00);
                insert staffs;
                
                Date today = Date.today();
                Date startOfWeek = today.toStartOfWeek();
                Date endOfWeek = startOfWeek; // or startOfWeek.addDays(6) if you want Sunday
                Allocation__c alocRec = new Allocation__c();
                alocRec.Start_Date__c = startOfWeek; 
                alocRec.End_Date__c = endOfWeek;
                alocRec.Start_time__c = '5:30 pm';                      // Start Time
                alocRec.Start_Date_Time__c = Time.newInstance(17, 30, 00, 00); // 5:30 PM
                alocRec.End_time__c = '7:30 pm';                        // End Time
                alocRec.End_Date_Time__c = Time.newInstance(19, 30, 00, 00);   // 7:30 PM
                alocRec.Working_Hours__c = 2;                           // Working Hours
                alocRec.Staff__c = staffRecord.Id;                            // Staff Reference
                alocRec.Status__c = 'Draft';                            // Status
                insert alocRec; // Insert the record                
			}
         }
    }

    @isTest
    static void testGetShiftData() {
        // Fetch test user ID
        User testUser = [SELECT Id FROM User WHERE Email = 'saieswar.k123@tesseractapps.com' LIMIT 1];
        Staff__c staffId = [SELECT Id FROM Staff__c LIMIT 1];
        ShiftwithStaff__c shiftStaff = [SELECT Id,Schedule_Sign_Out_Date_Time__c,Start_time_Formula__c,End_time_formula__c FROM ShiftwithStaff__c LIMIT 1];
        Add_Shift_Checklist__c addShiftCheckList = [SELECT Id FROM Add_Shift_Checklist__c LIMIT 1];
        Facility__c fac = [SELECT ID from Facility__c];
        
        System.runAs(testUser){ 
              system.debug('testUser==>'+testUser);
            // Test data setup
            Date testDate = Date.today();
            Double totalDuration = 8.5;
            Double actualDuration = 7.0;
            String status = 'Completed';
            Date day = Date.today();
            Integer recordCount = 10;
            
            Date today = Date.today();
            Test.startTest();
           // List<ShiftwithStaffController.ShiftDataWrapper> shiftData = ShiftwithStaffController.getShiftData(testUser.Id);
            //List<ShiftwithStaffController.ShiftWrapper> shiftData1 = ShiftwithStaffController.getStaffWeekData();
            ShiftwithStaffController.getShiftData(testUser.Id,  fac.Id, today, today.addDays(2));
            Map<String, Integer> getRejectedShiftData = ShiftwithStaffController.getRejectedShiftData(fac.Id);
            Id testId = '0012w00000ABCDE';
            //ShiftwithStaffController.gettimesheetData(testUser.Id);
            // Test ShiftWrapper instantiation
             //ShiftwithStaffController.ShiftWrapper shiftWrapper = new ShiftwithStaffController.ShiftWrapper(testDate, totalDuration, actualDuration, status);
             //ShiftwithStaffController.ShiftWrapper shiftWrapper1 = new ShiftwithStaffController.ShiftWrapper(Date.today(), null, Double.valueOf(7.0), 'Completed');
            ShiftwithStaffController.ShiftDataWrapper ShiftDataWrapper = new ShiftwithStaffController.ShiftDataWrapper(day, recordCount, status);
            ShiftwithStaffController.ShiftDataWrapper ShiftDataWrapper1 = new ShiftwithStaffController.ShiftDataWrapper(day, recordCount, status);
            List<ShiftwithStaffController.gettimesheetDataWrapper> result = ShiftwithStaffController.gettimesheetData(testUser.Id,'1w');
            ShiftwithStaffController.gettimesheetDataWrapper wrapper = new ShiftwithStaffController.gettimesheetDataWrapper(day, recordCount, status);//, testId
           // shiftwithStaffController.updateShiftDetails(true, true,true, 'Test Comments', 'Test Comments', staffId.Id, shiftStaff.Id);
            shiftwithStaffController.getStaffWeekData();
            String result1 = shiftwithStaffController.deleteCheckList(new List<String>{ addShiftCheckList.Id }); 
            
            String start_date = '2023-04-05';
            String end_date = '2024-04-05';
            ShiftwithStaffController.getAllShiftWithSatff(shiftStaff.Id, start_date, end_date);
           // ShiftwithStaffController.deleteCheckList(checkListId)
            Test.stopTest();        
        }
    }
     @isTest
    static void testGetShiftStatusSummary() {
        // Get facility and role from inserted test data
        Facility__c testFacility = [SELECT Id, Name FROM Facility__c LIMIT 1];
        Staff__c testStaff = [SELECT Id, Role__c FROM Staff__c LIMIT 1];

        DateTime startDateTime = System.now().addDays(-10);
        DateTime endDateTime = System.now().addDays(10);

        Test.startTest();
        Map<String, Integer> result = ShiftwithStaffController.getShiftStatusSummary(
            startDateTime,
            endDateTime,
            'false',
            new List<String>{testFacility.Id},
            '',
            new List<String>{testStaff.Role__c},
            ''
        );
        
          // Test data
        Date testDate = Date.today();
        Double totalDuration = 8.0;
        Double actualDuration = 7.5;
        String status = 'Completed';
        
        // Create wrapper
        ShiftwithStaffController.ShiftWrapper wrapper = new ShiftwithStaffController.ShiftWrapper(testDate, totalDuration, actualDuration, status);
           Time noon = Time.newInstance(12, 0, 0, 0); // 12:00
        ShiftwithStaffController.formatTime12Hr(noon);
        
        Test.stopTest();

        System.assertNotEquals(null, result, 'Result should not be null');
        System.debug('Shift Status Summary Result: ' + result);
    }

    @isTest
    static void testUpdateMyAvailability() {
       User testUser = [SELECT Id FROM User WHERE Email = 'saieswar.k123@tesseractapps.com' LIMIT 1];
     System.runAs(testUser){ 
        // Get ShiftwithStaff records created in test setup
        List<ShiftwithStaff__c> shiftList = [
            SELECT Id, Staff__c, Date__c, Start_Time__c,Type_of_shift__c 
            FROM ShiftwithStaff__c 
            WHERE Staff__c != null AND Date__c != null AND Start_Time__c != null
            LIMIT 3
        ];

        // Insert corresponding availability records for the test
        List<Availability__c> availList = new List<Availability__c>();
        for (ShiftwithStaff__c shift : shiftList) {
            Availability__c av = new Availability__c(
                Staff__c = shift.Staff__c,
                Start_Date__c = shift.Date__c,
                Start_Time__c = shift.Start_Time__c,
                Shift_Type__c = shift.Type_of_shift__c,
                Assigned_Service_OR_Shift__c = false
            );
            availList.add(av);
        }
        insert availList;

        Test.startTest();
        ShiftwithStaffController.updateMyavailability(shiftList);
        Test.stopTest();

        List<Availability__c> updated = [
            SELECT Assigned_Service_OR_Shift__c FROM Availability__c 
            WHERE Id IN :availList
        ];
        for (Availability__c record : updated) {
            System.assertEquals(true, record.Assigned_Service_OR_Shift__c, 'Availability should be marked assigned');
        }
     }
    }  
 
    
  	@isTest
    static void testDeleteChecklistAgain() {
    
        Add_Shift_Checklist__c chk =
            [SELECT Id
             FROM Add_Shift_Checklist__c
             LIMIT 1];
    
        Test.startTest();
    
        ShiftwithStaffController.deleteCheckList(
            new List<String>{ chk.Id }
        );
    
        Test.stopTest();
    } 
    
    @isTest
    static void testUpdateShiftDetails() {
    
        Staff__c staff = [
            SELECT Id
            FROM Staff__c
            LIMIT 1
        ];
    
        ShiftwithStaff__c shiftStaff = [
            SELECT Id
            FROM ShiftwithStaff__c
            LIMIT 1
        ];
    
        Test.startTest();
    
        ShiftwithStaffController.updateShiftDetails(
            true,                      // enableGeolocation
            true,                      // enableSignin
            false,                     // enableSignout
            'Late sign in approved',   // selectedComments
            null,                      // selectedComments1
            staff.Id,
            shiftStaff.Id
        );
    
        Test.stopTest();
    
        Staff__c updatedStaff = [
            SELECT Enable_Geolocation__c
            FROM Staff__c
            WHERE Id = :staff.Id
        ];
    
        System.assertEquals(
            true,
            updatedStaff.Enable_Geolocation__c
        );
    
        ShiftwithStaff__c updatedShift = [
            SELECT Enable_Sign_In__c,
                   Enable_Sign_In_Comments__c
            FROM ShiftwithStaff__c
            WHERE Id = :shiftStaff.Id
        ];
    
        System.assertEquals(
            true,
            updatedShift.Enable_Sign_In__c
        );
    
        System.assertEquals(
            'Late sign in approved',
            updatedShift.Enable_Sign_In_Comments__c
        );
    }
    
 
}