@isTest
public class RosterAutoScheduleHandlerTest {
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
        User user = new User(Alias = 'praveen', Email= 'manualtesting.142525666@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne209463', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.142525666@hotmail.com',Organization_Name__c ='Ashfield Consultants');
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
            staff.Email_Address__c= 'manualtesting.142525666@hotmail.com';
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
            staff.Type_of_Job__c='Full-time and part-time';
            insert staff; 
            
              Client__c cli =  new Client__c();
            cli.First_Name__c = 'Test';
            cli.Last_Name__c = 'Participant';
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
            cli.Primary_Contact_Number__c='0433123123';
            cli.Facility__c=fac.id;
           // cli.Staff__c=staff.id;
            //cli.Organization_Name__c='Ace Info Systems';
            insert cli;

              
            Funds_Tracker__c funds = new Funds_Tracker__c();
            funds.Registration_Group__c='Assistance Animals';
            funds.Amount_approved__c=11000;
          //  funds.Available_Funds__c = 10000;	
          //  funds.Spent_Amount__c = 1000;
            funds.Client__c=cli.Id;
            funds.Plan_Type__c ='Plan Managed';
            funds.Approved_Date__c = Date.newInstance(2024, 03, 16);
            insert funds;
            
            Participant_Staff_Association__c assoc1 = new Participant_Staff_Association__c(
            Staff__c = staff.Id,
            Participant__c = cli.Id,
            Role__c = 'Support Worker'
        );
            insert assoc1;
            
            NDIS_Support_Catalogue__c catalogue = new NDIS_Support_Catalogue__c(
            Name = 'Support 1',
            Support_Item_Name__c = 'Support Item A',
            Support_Category_Number__c = 01,
            Support_Item_Number__c = '0101',
            Available_fund__c = 1000,
            NSW__c = 10
        );
        insert catalogue;
            
            Availability__c availability = new Availability__c(
     
                Shift_Type__c = 'Morning', // Replace with valid picklist value
                Start_Time__c = Time.newInstance(9, 0, 0, 0),
                End_Time__c = Time.newInstance(17, 0, 0, 0),
                Start_Date__c = Date.today(),
                Role__c = 'Admin',
                Address__Street__s='8 Keewong Street',
                Address__City__s='Crace',
                Address__StateCode__s='ACT',
                Address__PostalCode__s='2911',
                Geo_Location__Latitude__s=-35.2005216,
                Geo_Location__Longitude__s=149.1096594,
                Address_Type__c='Participant',
                Participant__c=cli.Id,
                NDIS_Support_Catalogue__c=catalogue.Id,
                Funds_Tracker__c=funds.Id
            );
            insert availability;
            
            Add_Shift__c shift = new Add_Shift__c();
            shift.Break__c = '30';
            shift.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift.Start_Date__c = Date.today();
            shift.End_Date__c= Date.today();
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
            shift.Location__Latitude__s=-35.2005216;
            shift.Location__Longitude__s=149.1096594;
            shift.Shift_Type__c='General';
            shift.RefId__c=availability.id;
            shift.Un_Assigned_Shift__c=true;
            insert shift;
            
            
            ShiftwithStaff__c staffs = new ShiftwithStaff__c();
            staffs.Add_Shift__c=shift.Id;
            staffs.Attendence__c=false;
            staffs.Comments__c = 'test comments';
            staffs.Staff__c=staff.Id;
            staffs.Role__c='Admin';
            staffs.Status__c='Accepted';
            staffs.Log_In_Date_Time__c = Time.newInstance(01, 30, 00, 00);
            staffs.Log_Out_Date_Time__c = Time.newInstance(10, 00, 00, 00);
             staffs.RefId__c=availability.id;
             staffs.Shift_Rejected__c=true;
              staffs.Rejected_Assigned__c=false;
            staffs.Un_Assigned_Shift__c=true;
           
            insert staffs;
            
            Services_and_Support_Plan__c services = new Services_and_Support_Plan__c();
            services.Service_Type__c = catalogue.Id;
            services.Service_Users__c=staff.Id;
            services.Funds_Tracker__c=funds.Id;
            services.Service_Type__c = catalogue.Id;
            services.Qty__c=5;
            services.GST__c='No';
            services.Date_of_Service__c = Date.today();
            services.Client__c=cli.Id;
            services.Services__c='Assistance Animals';
            services.State__c='ACT';
            services.Start_Time__c = '3:30 am';
            services.End_Time__c = '5:30 am';
            services.ShiftwithStaff__c=staffs.Id;
            services.Un_Assigned_Service__c=true;
            insert services;
            List<Staff__c> staffList = new List<Staff__c>();
            // Create 5 staff members (adjust the number as needed)
            for (Integer i = 1; i <= 5; i++) {
                staffList.add(new Staff__c(
                    Last_Name__c = 'Test Staff ' + i,
                    Name = 'Staff' + i,
                    Name__c = 'AutoTest' + i,
                    Contact_Number__c = '040000000' + i,
                    Email_Address__c = 'staff' + i + '@example.com',
                    Facility__c = fac.Id,
                    Address__Street__s = '8 Keewong Street',
                    Address__City__s = 'Crace',
                    Address__StateCode__s = 'ACT',
                    Address__PostalCode__s = '2911',
                    Emergency_Phone_Number__c = '045000000' + i,
                    Primary_Contact_Name__c = 'Contact ' + i,
                    Primary_Contact_Number__c = '041111111' + i,
                    Make_Primary_as_Approver__c = true,
                    Primary_Contact_Email__c = 'contact' + i + '@example.com',
                    Secondary_Contact_Name__c = 'Secondary ' + i,
                    Secondary_Contact_Email__c = 'secondary' + i + '@example.com',
                    Make_Secondary_as_Approver__c = false,
                    Secondary_Contact_Number__c = '042222222' + i,
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
                   Type_of_Job__c='Full-time and part-time'
                ));
            }
            insert staffList;
            
            // Now create and insert availabilities
            List<Availability__c> availabilityList = new List<Availability__c>();
            for (Staff__c staff1 : staffList) {
                availabilityList.add(new Availability__c(
                    Staff__c = staff1.Id,
                    Shift_Type__c = 'Morning', // Ensure this is a valid picklist value
                    Start_Time__c = Time.newInstance(9, 0, 0, 0),
                    End_Time__c = Time.newInstance(17, 0, 0, 0),
                    Start_Date__c = Date.today()
                ));
            }
            insert availabilityList;
                    }
                } 
    
     @isTest
    static void testSaveStaffData_NonRecurring_NewRecord() {
        User UserList = [Select Id, Email From User Where Email = 'manualtesting.142525666@hotmail.com' LIMIT 1];
        System.runAs(UserList){
            String inputJson = '[{"id":"1","label":"Classification","isIcon":true,"direction":"arrowup","iconName":"utility:arrowup","directionLabel":"Low to High","index":1},{"id":"2","label":"Risk Index","isIcon":true,"direction":"arrowup","iconName":"utility:arrowup","directionLabel":"Low to High","index":2},{"id":"3","label":"Employment Type","isRadio":true,"value":"Permanent","index":3},{"id":"4","label":"Preferred Staff","isCheckbox":true,"value":false,"index":4},{"id":"5","label":"Fatigue Management","isCheckbox":true,"value":false,"index":5},{"id":"6","label":"Geo Location","isSlider":true,"value":50,"index":6}]';
            Organisation__c org= [select id from Organisation__c limit 1];
            
            Date startDate = Date.today();
            Date endDate = Date.today().addDays(7);
            list<Staff__c> staffs = [SELECT Name__c,Last_Name__c,Role__c,Facility_Name__c,Saturday_Hourly_Rate__c, Sunday_Hourly_Rate__c,Public_holiday_Hourly_Rate__c, Working_Hours_Rate__c,Afternoon_shift_Hourly_Rate__c, Night_shift_Hourly_Rate__c FROM Staff__c];
             Map<Id, Staff__c> staffMap = new Map<Id, Staff__c>();
            for(Staff__c ss:staffs){
                staffMap.put(ss.Id,ss);
            }
             List<Facility__c> facList = [SELECT ID From Facility__c];
             List<String> ListFacility = new List<String>();
            for(Facility__c fac:facList){
                ListFacility.add(fac.Id);
            }
            
            Availability__c Avail=[SELECT id from Availability__c limit 1];
            
            RosterAutoScheduleHandler.assignShifts(String.valueOf(startDate), String.valueOf(endDate), inputJson,ListFacility);
            RosterRejectedShiftsAutoScheduleHandler.assignAutoShifts(String.valueOf(startDate), String.valueOf(endDate), org.id, inputJson);
            RosterAutoScheduleHandler.currnetLoggedInFcaility('manualtesting.142525666@hotmail.com');
            RosterAutoScheduleHandler.publishShifts(String.valueOf(startDate), String.valueOf(endDate),ListFacility,org.id);
            Boolean isDuplicate = RosterAutoScheduleHandler.preventStaffAvailabilityDuplicates(
               '01/06/2025', '07/06/2025','11:00','13:00',staffs[0].Id,avail.Id
            );
         //   RosterAutoScheduleHandler.getStaffHourlyRate(ShiftType, isHoliday, dayname, staffMap, staffId);
            RosterAutoScheduleHandler.getStaffHourlyRate('General', true, 'Monday', staffMap, staffs[0].Id);
             RosterAutoScheduleHandler.getStaffHourlyRate('General', False, 'Sunday', staffMap, staffs[0].Id);
             RosterAutoScheduleHandler.getStaffHourlyRate('Afternoon', False, 'Monday', staffMap, staffs[0].Id);
        }
    }
    
      @isTest
    static void testGeoKmBetween() {
        Decimal lat1 = -35.2500;
        Decimal lon1 = 149.1000;
        Decimal lat2 = -35.2600;
        Decimal lon2 = 149.1100;

        Double distance = RosterAutoScheduleHandler.geoKmBetween(lat1, lon1, lat2, lon2);
        System.assert(distance > 0, 'Distance should be greater than 0');
    }

    @isTest
    static void testWithinGeoRadiusTrue() {
        Boolean result = RosterAutoScheduleHandler.withinGeoRadius(-35.2500, 149.1000, -35.2505, 149.1005, 1);
      
    }

    @isTest
    static void testWithinGeoRadiusFalse() {
        Boolean result = RosterAutoScheduleHandler.withinGeoRadius(-35.2500, 149.1000, -36.2500, 150.1000, 1);
       
    }
     @isTest
    static void testAutoSchedule() {
        User UserList = [Select Id, Email From User Where Email = 'manualtesting.142525666@hotmail.com' LIMIT 1];
        System.runAs(UserList){
            String inputJson = '[{"id":"1","label":"Classification","isIcon":true,"direction":"arrowup","iconName":"utility:arrowup","directionLabel":"Low to High","index":1},{"id":"2","label":"Risk Index","isIcon":true,"direction":"arrowup","iconName":"utility:arrowup","directionLabel":"Low to High","index":2},{"id":"3","label":"Employment Type","isRadio":true,"value":"Permanent","index":3},{"id":"4","label":"Preferred Staff","isCheckbox":true,"value":true,"index":4},{"id":"5","label":"Fatigue Management","isCheckbox":true,"value":true,"index":5},{"id":"6","label":"Geo Location","isSlider":true,"value":50,"index":6}]';
            
            Date startDate = Date.today();
            Date endDate = Date.today().addDays(7);
            list<Staff__c> staffs = [SELECT Name__c,Last_Name__c,Role__c,Facility_Name__c,Saturday_Hourly_Rate__c, Sunday_Hourly_Rate__c,Public_holiday_Hourly_Rate__c, Working_Hours_Rate__c,Afternoon_shift_Hourly_Rate__c, Night_shift_Hourly_Rate__c FROM Staff__c];
             Map<Id, Staff__c> staffMap = new Map<Id, Staff__c>();
            for(Staff__c ss:staffs){
                staffMap.put(ss.Id,ss);
            }
             Organisation__c org= [select id from Organisation__c limit 1];
            Availability__c Avail=[SELECT id from Availability__c limit 1];
             List<Facility__c> facList = [SELECT ID From Facility__c];
             List<String> ListFacility = new List<String>();
            for(Facility__c fac:facList){
                ListFacility.add(fac.Id);
            }
            
            RosterAutoScheduleHandler.assignShifts(String.valueOf(startDate), String.valueOf(endDate), inputJson,ListFacility);
            Date shiftDate = Date.today();
            Time shiftEndTime = Time.newInstance(2, 0, 0, 0); // 2 AM
            DateTime shiftEndDateTime = DateTime.newInstance(shiftDate, shiftEndTime);
             Boolean isTired = RosterAutoScheduleHandler.tooTired(staffs[0].Id, shiftEndDateTime, staffMap);
             RosterRejectedShiftsAutoScheduleHandler.assignAutoShifts(String.valueOf(startDate), String.valueOf(endDate), org.id, inputJson);
    
        }

    }
    
    @isTest
static void testTimeOverlapMethods() {
    // Availability from 9 AM to 5 PM
    DateTime availStart = DateTime.newInstance(Date.today(), Time.newInstance(9, 0, 0, 0));
    DateTime availEnd   = DateTime.newInstance(Date.today(), Time.newInstance(17, 0, 0, 0));

    // Booking fully contains availability (8 AM to 6 PM)
    DateTime bookingStart1 = DateTime.newInstance(Date.today(), Time.newInstance(8, 0, 0, 0));
    DateTime bookingEnd1   = DateTime.newInstance(Date.today(), Time.newInstance(18, 0, 0, 0));

    // Booking partially overlaps (4 PM to 8 PM)
    DateTime bookingStart2 = DateTime.newInstance(Date.today(), Time.newInstance(16, 0, 0, 0));
    DateTime bookingEnd2   = DateTime.newInstance(Date.today(), Time.newInstance(20, 0, 0, 0));

    // No overlap (6 PM to 10 PM)
    DateTime bookingStart3 = DateTime.newInstance(Date.today(), Time.newInstance(18, 0, 0, 0));
    DateTime bookingEnd3   = DateTime.newInstance(Date.today(), Time.newInstance(22, 0, 0, 0));

    // Call and assert isTimeOverlap
    System.assertEquals(true, RosterAutoScheduleHandler.isTimeOverlap(availStart, availEnd, bookingStart1, bookingEnd1));
    System.assertEquals(false, RosterAutoScheduleHandler.isTimeOverlap(availStart, availEnd, bookingStart2, bookingEnd2));
    System.assertEquals(false, RosterAutoScheduleHandler.isTimeOverlap(availStart, availEnd, bookingStart3, bookingEnd3));

    // Call and assert isShiftOverlap
    System.assertEquals(true, RosterAutoScheduleHandler.isShiftOverlap(availStart, availEnd, bookingStart1, bookingEnd1));
    System.assertEquals(true, RosterAutoScheduleHandler.isShiftOverlap(availStart, availEnd, bookingStart2, bookingEnd2));
    System.assertEquals(false, RosterAutoScheduleHandler.isShiftOverlap(availStart, availEnd, bookingStart3, bookingEnd3));
}
    
    @isTest
    static void testCoversWindow() {
        // Staff availability: 9 AM to 5 PM
        Availability__c staffAvail = new Availability__c(
            Start_Date__c = Date.today(),
            End_Date__c   = Date.today(),
            Start_Time__c = Time.newInstance(9, 0, 0, 0),
            End_Time__c   = Time.newInstance(17, 0, 0, 0)
        );
        
        // Shift fully within staff availability: 10 AM to 4 PM
        Availability__c shiftReq1 = new Availability__c(
            Start_Date__c = Date.today(),
            End_Date__c   = Date.today(),
            Start_Time__c = Time.newInstance(10, 0, 0, 0),
            End_Time__c   = Time.newInstance(16, 0, 0, 0)
        );
        
        // Shift partially outside: 8 AM to 12 PM
        Availability__c shiftReq2 = new Availability__c(
            Start_Date__c = Date.today(),
            End_Date__c   = Date.today(),
            Start_Time__c = Time.newInstance(8, 0, 0, 0),
            End_Time__c   = Time.newInstance(12, 0, 0, 0)
        );
        
        // Shift entirely outside: 6 PM to 8 PM
        Availability__c shiftReq3 = new Availability__c(
            Start_Date__c = Date.today(),
            End_Date__c   = Date.today(),
            Start_Time__c = Time.newInstance(18, 0, 0, 0),
            End_Time__c   = Time.newInstance(20, 0, 0, 0)
        );
        
        System.assertEquals(true, RosterAutoScheduleHandler.coversWindow(staffAvail, shiftReq1), 'Should be covered');
        System.assertEquals(false, RosterAutoScheduleHandler.coversWindow(staffAvail, shiftReq2), 'Should not be covered (starts too early)');
        System.assertEquals(false, RosterAutoScheduleHandler.coversWindow(staffAvail, shiftReq3), 'Should not be covered (starts after)');
      //  RosterRejectedShiftsAutoScheduleHandler.coversWindow(staffAvail, shiftReq3);
    }
    
    @isTest
    static void testHasTimeConflict() {
        // Sample staff ID and date
        Id staffId = Id.valueOf('001000000000001AAA');
        Date targetDate = Date.today();
        
        // Create a mock block from 10 AM to 12 PM
        Map<String, DateTime> block1 = new Map<String, DateTime>{
            'start' => DateTime.newInstance(targetDate, Time.newInstance(10, 0, 0, 0)),
                'end'   => DateTime.newInstance(targetDate, Time.newInstance(12, 0, 0, 0))
                };
                    
                    // Construct blockMap structure
                    Map<Id, Map<Date, List<Map<String, DateTime>>>> blockMap = new Map<Id, Map<Date, List<Map<String, DateTime>>>>();
        blockMap.put(staffId, new Map<Date, List<Map<String, DateTime>>>{
            targetDate => new List<Map<String, DateTime>>{ block1 }
        });
        
        // Case 1: Overlapping shift from 11 AM to 1 PM
        DateTime shiftStart1 = DateTime.newInstance(targetDate, Time.newInstance(11, 0, 0, 0));
        DateTime shiftEnd1   = DateTime.newInstance(targetDate, Time.newInstance(13, 0, 0, 0));
        System.assertEquals(true, RosterAutoScheduleHandler.hasTimeConflict(blockMap, staffId, targetDate, shiftStart1, shiftEnd1), 'Should detect overlap');
        
        // Case 2: No overlap, shift from 1 PM to 3 PM
        DateTime shiftStart2 = DateTime.newInstance(targetDate, Time.newInstance(13, 0, 0, 0));
        DateTime shiftEnd2   = DateTime.newInstance(targetDate, Time.newInstance(15, 0, 0, 0));
        System.assertEquals(false, RosterAutoScheduleHandler.hasTimeConflict(blockMap, staffId, targetDate, shiftStart2, shiftEnd2), 'Should not detect conflict');
        
        // Case 3: Staff ID not present
       System.assertEquals(false, RosterAutoScheduleHandler.hasTimeConflict(blockMap, Id.valueOf('001000000000002AAA'), targetDate, shiftStart1, shiftEnd1), 'Unknown staffId should return false');
    }
    @isTest
    static void testFinalAvailableWrapper() {
        // Create a FinalAvailable instance
        String staffId = 'a012345678901234567';
        String firstName = 'John';
        String lastName = 'Doe';
        
        RosterAutoScheduleHandler.FinalAvailable fa = new RosterAutoScheduleHandler.FinalAvailable(staffId, firstName, lastName,'a012345678901234567');
        
        // Assertions
        System.assertEquals(staffId, fa.staffId, 'Staff ID should match');
        System.assertEquals(firstName, fa.firstName, 'First name should match');
        System.assertEquals(lastName, fa.lastName, 'Last name should match');
        
       RosterRejectedShiftsAutoScheduleHandler.FinalAvailable fa1 = new RosterRejectedShiftsAutoScheduleHandler.FinalAvailable(staffId, firstName, lastName);
    }
    
    @isTest
    static void test_addMatchCustom_and_coversWindowShift_existingData() {
        // Query test ShiftwithStaff__c with Add_Shift__r populated
        ShiftwithStaff__c shift = [
            SELECT Id, Date__c, End_Date__c, Add_Shift__r.Start_Time__c, Add_Shift__r.End_Time__c
            FROM ShiftwithStaff__c
            WHERE Add_Shift__r.Start_Time__c != null AND Add_Shift__r.End_Time__c != null
            LIMIT 1
        ];
        
        // Query Availability__c linked to same staff (adjust if relationship differs)
        Availability__c avail = [
            SELECT Id, Staff__c, Start_Date__c, End_Date__c, Start_Time__c, End_Time__c
            FROM Availability__c
            WHERE Staff__c != null
            LIMIT 1
        ];
        
        // Query Staff__c to pass as SObject
        Staff__c staff = [
            SELECT Id, Name, Last_Name__c
            FROM Staff__c
            WHERE Id = :avail.Staff__c
            LIMIT 1
        ];
        
        Boolean covers = RosterRejectedShiftsAutoScheduleHandler.coversWindowShift(avail, shift);
        
    }


    @isTest
    static void testAddMatchCustomCoverage() {
        Test.startTest();
        
        // Reuse previously inserted data
        ShiftwithStaff__c shift = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        Availability__c avail = [SELECT Id, Staff__c FROM Availability__c WHERE Staff__c != NULL LIMIT 1];
        Staff__c staffRec = [SELECT Id, Name, Last_Name__c FROM Staff__c WHERE Id = :avail.Staff__c LIMIT 1];
        
        Date reqDate = Date.today();
        DateTime s = DateTime.now();
        DateTime e = s.addHours(2);
        
        // Prepare blockMap and outMap
        Map<Id, Map<Date, List<Map<String, DateTime>>>> blockMap = new Map<Id, Map<Date, List<Map<String, DateTime>>>>();
        
        // Initialize nested structure
        Map<Date, List<Map<String, DateTime>>> dateMap = new Map<Date, List<Map<String, DateTime>>>();
        List<Map<String, DateTime>> innerList = new List<Map<String, DateTime>>();
        Map<String, DateTime> dateTimeMap = new Map<String, DateTime>();
        dateTimeMap.put('start', s);
        dateTimeMap.put('end', e);
        innerList.add(dateTimeMap);
        dateMap.put(reqDate, innerList);
        blockMap.put(avail.Staff__c, dateMap);
        
        Map<ShiftwithStaff__c, RosterRejectedShiftsAutoScheduleHandler.FinalAvailable> outMap = new Map<ShiftwithStaff__c, RosterRejectedShiftsAutoScheduleHandler.FinalAvailable>();
        
        // Call the method
        RosterRejectedShiftsAutoScheduleHandler.addMatchCustom(shift, avail, staffRec, reqDate, s, e, blockMap, outMap);
        
    
        
        Test.stopTest();
    }


}