@isTest
public class RostersPublishAndAssignHandlerTest {
    @testsetup Static void testData(){
        Organisation__c org = new Organisation__c();
        org.Name='Ashfield Consultants12';
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
        
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.612233142@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne612233142', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.612233142@hotmail.com',Organization_Name__c ='Ashfield Consultants12');
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
            fac.ABN__c='12345678912';
            fac.Phone__c = '12323432';
            insert fac;
            
            List<Staff__c> staffList = new List<Staff__c>();
            
            Integer numRecords = 10;
            Integer baseRate = 50;
            Integer finalRate = 150;
            Integer saturdayRate = 120;
            Integer sundayRate = 130;
            Integer publicHolidayRate = 170;
            
            for (Integer i = 0; i <= numRecords; i++) {
                Staff__c staff = new Staff__c();
                 
                staff.Last_Name__c = 'Test staff ' + i;
                staff.Name = 'praveen' + i;
                staff.Name__c = 'abcd' + i;
                staff.Contact_Number__c = '5678990874' + i;
                staff.Email_Address__c = 'manualtesting.612233142' + i + '@hotmail.com';
                staff.Facility__c = fac.Id;
                staff.Address__Street__s = '8 Keewong Street';
                staff.Address__City__s = 'Crace';
                staff.Address__StateCode__s = 'ACT';
                staff.Address__PostalCode__s = '2911';
                staff.Emergency_Phone_Number__c = '4567876667' + i;
                staff.Primary_Contact_Name__c = 'Praveen';
                staff.Primary_Contact_Number__c = '990845829' + i;
                staff.Make_Primary_as_Approver__c = true;
                staff.Primary_Contact_Email__c = 'praveenshesham.sp+' + i + '@gmail.com';
                staff.Secondary_Contact_Name__c = 'Maheswari';
                staff.Secondary_Contact_Email__c = 'maheswari.adabala+' + i + '@gmail.com';
                staff.Make_Secondary_as_Approver__c = false;
                staff.Secondary_Contact_Number__c = '9908458295' + i;
                staff.Emp_exit_date__c = date.newInstance(2028, 01, 05);
                staff.Emp_Start_Date__c = date.newInstance(2023, 02, 01);
                staff.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
                staff.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
                staff.Role__c = 'Admin';
                staff.Residency_Type__c = 'Australian';
                staff.Expiry_Date__c = date.newInstance(2025, 02, 19);
                staff.Type__c = 'Visa Status';
                staff.Status__c=true;
                staff.Restrict_Set_Hours__c=true;
                staff.Set_Hours__c=45;
            
                
                staff.Working_Hours_Rate__c = baseRate + i;
                staff.Final_Overall_Rate__c = finalRate + i;
                staff.Saturday_Hourly_Rate__c = saturdayRate + i;
                staff.Sunday_Hourly_Rate__c = sundayRate + i;
                staff.Public_holiday_Hourly_Rate__c = publicHolidayRate + i;
                
                staffList.add(staff); 
            }
            
            if (!staffList.isEmpty()) {
                insert staffList;
            }
            List<StaffRole__c> staffRoles = new List<StaffRole__c>();
                for (Staff__c staff : staffList) {
                    StaffRole__c sr = new StaffRole__c();
                    sr.StaffRole_To_Staff__c = staff.Id;
                    sr.RoleName__c = 'Admin'; // Match the Role being queried
                    sr.Active__c = true;
                    sr.Hourly_Rate__c = 50; // Set appropriate rate values
                    sr.Afternoon_shift_Hourly_Rate__c = 60;
                    sr.Night_shift_Hourly_Rate__c = 70;
                    sr.Saturday_Hourly_Rate__c = 80;
                    sr.Sunday_Hourly_Rate__c = 90;
                    sr.Public_holiday_Hourly_Rate__c = 100;
                    sr.Sleepover_Allowance__c = 40;
                    staffRoles.add(sr);
                }
                
                if (!staffRoles.isEmpty()) {
                    insert staffRoles;
                }
                
                // ALSO add Staff_Facility__c records if needed
                List<Staff_Facility__c> staffFacilities = new List<Staff_Facility__c>();
                for (Staff__c staff : staffList) {
                    Staff_Facility__c sf = new Staff_Facility__c();
                    sf.Staff__c = staff.Id;
                    sf.Facility__c = fac.Id;
                    sf.Active__c = true;
                    staffFacilities.add(sf);
                }
                
                if (!staffFacilities.isEmpty()) {
                    insert staffFacilities;
                }
            
             Add_Shift__c shift = new Add_Shift__c();
            shift.Break__c = '30';
            shift.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift.Start_Date__c =Date.newInstance(2027, 04, 29);  
            shift.End_Date__c =Date.newInstance(2027, 04, 29);  
            shift.Get_Facility__c=true;
            shift.Quantity__c=5;
            shift.Start_Time__c=Time.newInstance( 03, 30, 00, 00);
            shift.End_Time__c=Time.newInstance( 10, 00, 00, 00);
            shift.Facility__c=fac.Id;
            shift.Status__c='Draft';
            shift.Location__StateCode__s = 'ACT';
            shift.Location__CountryCode__s = 'AU';
            shift.Location__PostalCode__s = '2911';
            shift.Shift_Type__c='Night';
            insert shift;
            
            
            ShiftwithStaff__c staffs = new ShiftwithStaff__c();
            staffs.Add_Shift__c=shift.Id;
            staffs.Attendence__c=true;
            staffs.Comments__c = 'test comments';
            staffs.Staff__c=staffList[0].Id;
            staffs.Start_Date__c=Date.newInstance(2027, 04, 29); 
            staffs.Shift_End_Date__c=Date.newInstance(2027, 04, 29); 
            staffs.Shift_Start_Time__c=Time.newInstance( 03, 30, 00, 00);
             staffs.Shift_End_Time__c=Time.newInstance( 03, 30, 00, 00);
            staffs.Role__c='Admin';
            staffs.Status__c='Accepted';
            staffs.Log_In_Date_Time__c = Time.newInstance(4, 30, 00, 00);
            staffs.Log_Out_Date_Time__c = Time.newInstance(10, 00, 00, 00);
            staffs.Is_long_Morning__c=true;
            staffs.Long_Morning_Start_Time__c=Time.newInstance(4, 30, 00, 00);
             staffs.Long_Morning_End_Time__c=Time.newInstance(10, 00, 00, 00);
             staffs.Long_Morning_Index__c=0;
            staffs.Long_Morning_Hourly_Rate__c=10;
            staffs.Long_Morning_Shift_Duartion__c=10;
             staffs.Is_long_Morning_Next_Day_Start__c=false;
            staffs.Long_Morning_Start_Date_One__c=Date.newInstance(2027, 04, 29);
            
             staffs.Is_Long_Afternoon__c=true;
            staffs.Long_Afternoon_Start_Time__c=Time.newInstance(4, 30, 00, 00);
             staffs.Long_Afternoon_End_Time__c=Time.newInstance(10, 00, 00, 00);
             staffs.Long_Afternoon_Index__c=0;
            staffs.Long_Afternoon_Hourly_Rate__c=10;
            staffs.Long_Afternoon_Shift_Duartion__c=10;
             staffs.Is_Long_Afternoon_Next_Day_Start__c=false;
            staffs.Long_Afternoon_Start_Date_One__c=Date.newInstance(2027, 04, 29);
            
             staffs.Is_Long_Night_Shift__c=true;
            staffs.Long_Night_Start_Time__c=Time.newInstance(4, 30, 00, 00);
             staffs.Long_Night_End_Time__c=Time.newInstance(10, 00, 00, 00);
             staffs.Long_Night_Index__c=0;
            staffs.Long_Night_Hourly_Rate__c=10;
            staffs.Long_Night_Shift_Duartion__c=10;
             staffs.Is_Long_Night_Start_Next_Day__c=false;
            staffs.Long_Night_Start_Date__c=Date.newInstance(2027, 04, 29);
            insert staffs;
        }        
    }
    
    @isTest
    public static void createAddShiftTest() {
        User use = [SELECT Id FROM User WHERE Email = 'manualtesting.612233142@hotmail.com' LIMIT 1];
        Staff__c staff = [SELECT Id From Staff__c LIMIT 1];
        Organisation__c org = [SELECT ID from Organisation__c LIMIT 1];
		
        List<Facility__c> listFacility  = [SELECT Id FROM Facility__c];
        List<String> facList = new List<String>();
        for(Facility__c fac:listFacility){
            facList.add(fac.Id);
        }
        
        List<Staff__c> liststaff  = [SELECT Id,name,Restrict_Set_Hours__c,Set_Hours__c FROM Staff__c];
        List<String> StaffList = new List<String>();
        for(Staff__c staff1:liststaff){
            StaffList.add(staff1.Id);
        }
        
        ShiftwithStaff__c shift =[SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        String shiftId = shift.Id;
        
        System.runAs(use) {   
            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
            
            String jsonData = '{"shiftaddress":{"street":"8 Keewong Street","citySuburb":"Crace","country":"AU","provinceState":"ACT","postalcode":"2911"},' +
                '"shiftDetails":{"AddShiftId":null,"AddShiftStartDate":"2027-04-30","AddShiftStaffValue":"null",' +
                '"AddShiftFacilityValue":"' + facility.Id + '","AddShiftRole":"Admin","AddShiftType":"General","AddShiftBreak":"30",' +
                '"AddShiftDuration":7.5,"AddShiftStartTime":"09:00:00Z","AddShiftStartTimeAMPM":"9:00 AM","AddShiftEndTime":"17:00:00Z",' +
                '"AddShiftEndTimeAMPM":"5:00 PM","AddShiftStaffHourlyRate":25.41,"AddShiftQuantity":2,"AddShiftNotes":"","AddShiftEOI":false,' +
                '"AddShiftHoliday":false,"AddShiftEnterOtherLocation":false,"AddShiftParticipantAddressCheckbox":false,"selectedServiceInfoJson" :}}';
            String jsonData1 = '{"shiftaddress":{"street":"8 Keewong Street","citySuburb":"Crace","country":"AU","provinceState":"ACT","postalcode":"2911"},' +
                '"shiftDetails":{"AddShiftId":null,"AddShiftStartDate":"2027-04-30","AddShiftStaffValue":"null",' +
                '"AddShiftFacilityValue":"' + facility.Id + '","AddShiftRole":"Admin","AddShiftType":"Afternoon","AddShiftBreak":"30",' +
                '"AddShiftDuration":7.5,"AddShiftStartTime":"09:00:00Z","AddShiftStartTimeAMPM":"9:00 AM","AddShiftEndTime":"17:00:00Z",' +
                '"AddShiftEndTimeAMPM":"5:00 PM","AddShiftStaffHourlyRate":25.41,"AddShiftQuantity":2,"AddShiftNotes":"","AddShiftEOI":false,' +
                '"AddShiftHoliday":false,"AddShiftEnterOtherLocation":false,"AddShiftParticipantAddressCheckbox":false}}';
            String Year = '2024';
            String Month = '10';
            String Day = '16';
            String start_date = Year + '-' + Month + '-' + Day; 
            
            String Year1 = '2024';
            String Month1 = '10';
            String Day1 = '16';
            String end_date = Year1 + '-' + Month1 + '-' + Day1; 
            List<Id> staffIdList = new List<Id>{'a03Bo00000N9OnTIAV', 'a03Bo00000N9QhDIAV'};
            
            Test.startTest();
            
            Map<String, Object> responses5 = RostersPublishAndAssignHandler.rosterPublish(jsonData,start_date,end_date,facList,StaffList); 
            Map<String, Object> responses6 = RostersPublishAndAssignHandler.rosterPublish(jsonData1,start_date,start_date,facList,StaffList);
            List<ShiftwithStaff__c> listShift = AddShiftController.getcurrentStaff(start_date,start_date);
            RostersPublishAndAssignHandler.AssignShiftsInDrag(45,staff.id,'',shiftId,'2027-04-28','2027-04-28',null);
            AddShiftController.Rejectedshifts(shiftId, 'Test Comments');
            AddShiftController.getRejectedShifts(start_date, org.ID);
            AddShiftController.getRejectedShiftsbyDates(start_date,end_date, org.ID);
            boolean fatigueInfo= RosterCreation.getFatigueData(staff.id, '6:30 am', '2027-04-30');
            RosterAutoScheduleTriggerHandler.updateUnAssignedShifts(start_date, end_date);
            DateTime start1 = DateTime.newInstance(2025, 8, 19, 9, 0, 0);
            DateTime end1   = DateTime.newInstance(2025, 8, 19, 12, 0, 0);
            
            DateTime start2 = DateTime.newInstance(2025, 8, 19, 11, 0, 0);
            DateTime end2   = DateTime.newInstance(2025, 8, 19, 14, 0, 0);
            Date startDate = Date.newInstance(2027, 04, 29);
            Date endDate =Date.newInstance(2027, 04, 29);
            Time startTime = Time.newInstance( 03, 30, 00, 00);
            Time endTime = Time.newInstance( 03, 30, 00, 00);

            RostersPublishAndAssignHandler.getDragDrogShifts(liststaff[0].Id, '5456458', shiftId, start_date, end_date);
            Test.stopTest();
        }        
    }
    
    @isTest
    public static void testRosterPublishUpdate() {
        User use = [SELECT Id FROM User WHERE Email = 'manualtesting.612233142@hotmail.com' LIMIT 1];
        
        System.runAs(use) {
            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
            Add_Shift__c existingShift = [SELECT Id FROM Add_Shift__c LIMIT 1];
            
            List<Facility__c> listFacility = [SELECT Id FROM Facility__c];
            List<String> facList = new List<String>();
            for(Facility__c fac : listFacility) {
                facList.add(fac.Id);
            }
            
            List<Staff__c> liststaff = [SELECT Id FROM Staff__c];
            List<String> StaffList = new List<String>();
            for(Staff__c staff1 : liststaff) {
                StaffList.add(staff1.Id);
            }
            
            String jsonData = '{"shiftaddress":{"street":"8 Keewong Street","citySuburb":"Crace","country":"AU","provinceState":"ACT","postalcode":"2911"},' +
                '"shiftDetails":{"AddShiftId":"' + existingShift.Id + '","AddShiftStartDate":"2027-04-30","AddShiftStaffValue":"null",' +
                '"AddShiftFacilityValue":"' + facility.Id + '","AddShiftRole":"Admin","AddShiftType":"General","AddShiftBreak":"30",' +
                '"AddShiftDuration":7.5,"AddShiftStartTime":"09:00:00Z","AddShiftStartTimeAMPM":"9:00 AM","AddShiftEndTime":"17:00:00Z",' +
                '"AddShiftEndTimeAMPM":"5:00 PM","AddShiftStaffHourlyRate":25.41,"AddShiftQuantity":3,"AddShiftNotes":"","AddShiftEOI":false,' +
                '"AddShiftHoliday":false,"AddShiftEnterOtherLocation":false,"AddShiftParticipantAddressCheckbox":false,"selectedServiceInfoJson":""}}';
            
            Test.startTest();
            Map<String, Object> response = RostersPublishAndAssignHandler.rosterPublish(jsonData, '2024-10-16', '2024-10-16', facList, StaffList);
            Test.stopTest();
        }
    }
    
    @isTest
    public static void testRosterPublishException() {
        User use = [SELECT Id FROM User WHERE Email = 'manualtesting.612233142@hotmail.com' LIMIT 1];
        
        System.runAs(use) {
            String invalidJson = 'INVALID_JSON_FORMAT';
            
            List<String> facList = new List<String>();
            List<String> StaffList = new List<String>();
            
            Test.startTest();
            Map<String, Object> response = RostersPublishAndAssignHandler.rosterPublish(invalidJson, '2024-10-16', '2024-10-16', facList, StaffList);
            Test.stopTest();
        }
    }
    
    @isTest
    public static void testNonEOIStaffPath() {
        User use = [SELECT Id FROM User WHERE Email = 'manualtesting.612233142@hotmail.com' LIMIT 1];
        
        System.runAs(use) {
            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
            
            Add_Shift__c shift = new Add_Shift__c();
            shift.Break__c = '30';
            shift.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift.Start_Date__c =Date.newInstance(2027, 04, 29);  
            shift.End_Date__c =Date.newInstance(2027, 04, 29);  
            shift.Get_Facility__c=true;
            shift.Quantity__c=5;
            shift.Start_Time__c=Time.newInstance( 03, 30, 00, 00);
            shift.End_Time__c=Time.newInstance( 10, 00, 00, 00);
            shift.Facility__c=facility.Id;
            shift.Status__c='Draft';
            shift.Location__StateCode__s = 'ACT';
            shift.Location__CountryCode__s = 'AU';
            shift.Location__PostalCode__s = '2911';          
            shift.Shift_Type__c = 'General';
            shift.Is_EOI__c = false;
            shift.Role__c = 'Admin';
            shift.Duration__c = 8;
            shift.Day_Name__c = 'Monday';
            insert shift;
            
            Add_Shift__c shift1 = new Add_Shift__c();
            shift1.Break__c = '30';
            shift1.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift1.Start_Date__c =Date.newInstance(2027, 04, 29);  
            shift1.End_Date__c =Date.newInstance(2027, 04, 29);  
            shift1.Get_Facility__c=true;
            shift1.Quantity__c=5;
            shift1.Start_Time__c=Time.newInstance( 03, 30, 00, 00);
            shift1.End_Time__c=Time.newInstance( 10, 00, 00, 00);
            shift1.Facility__c=facility.Id;
            shift1.Status__c='Draft';
            shift1.Location__StateCode__s = 'ACT';
            shift1.Location__CountryCode__s = 'AU';
            shift1.Location__PostalCode__s = '2911';
            shift1.Shift_Type__c='Night'; //Night
            shift1.Is_EOI__c = false;
            shift1.Role__c = 'Admin';
            shift1.Duration__c = 8;
            shift1.Day_Name__c = 'Monday';
            insert shift1;
            
            List<Add_Shift__c> shiftList = new List<Add_Shift__c>{shift};
            
            List<String> facList = new List<String>{facility.Id};
            
            Test.startTest();
            String result = RostersPublishAndAssignHandler.getStaffHourlyRates(shiftList, '2024-10-16', '2024-10-22', facList);
            Test.stopTest();
        }
    }
    
    @isTest
    public static void testSaturdaySundayRates() {
        User use = [SELECT Id FROM User WHERE Email = 'manualtesting.612233142@hotmail.com' LIMIT 1];
        
        System.runAs(use) {
            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
            
            Add_Shift__c saturdayShift = new Add_Shift__c();
            saturdayShift.Break__c = '30';
            saturdayShift.Start_Date__c = Date.newInstance(2027, 05, 03);
            saturdayShift.Get_Facility__c = true;
            saturdayShift.Quantity__c = 1;
            saturdayShift.Start_Time__c = Time.newInstance(10, 00, 00, 00);
            saturdayShift.End_Time__c = Time.newInstance(18, 00, 00, 00);
            saturdayShift.Facility__c = facility.Id;
            saturdayShift.Status__c = 'Draft';
            saturdayShift.Shift_Type__c = 'General';
            saturdayShift.Is_EOI__c = true;
            saturdayShift.Role__c = 'Admin';
            saturdayShift.Duration__c = 8;
            saturdayShift.Day_Name__c = 'Saturday';
            saturdayShift.Public_holiday__c = false;
            saturdayShift.Location__StateCode__s = 'ACT';
            saturdayShift.Location__CountryCode__s = 'AU';
            saturdayShift.Location__PostalCode__s = '2911';
            insert saturdayShift;
            
            Add_Shift__c sundayShift = new Add_Shift__c();
            sundayShift.Break__c = '30';
            sundayShift.Start_Date__c = Date.newInstance(2027, 05, 04);
            sundayShift.Get_Facility__c = true;
            sundayShift.Quantity__c = 1;
            sundayShift.Start_Time__c = Time.newInstance(10, 00, 00, 00);
            sundayShift.End_Time__c = Time.newInstance(18, 00, 00, 00);
            sundayShift.Facility__c = facility.Id;
            sundayShift.Status__c = 'Draft';
            sundayShift.Shift_Type__c = 'General';
            sundayShift.Is_EOI__c = true;
            sundayShift.Role__c = 'Admin';
            sundayShift.Duration__c = 8;
            sundayShift.Day_Name__c = 'Sunday';
            sundayShift.Public_holiday__c = false;
            sundayShift.Location__StateCode__s = 'ACT';
            sundayShift.Location__CountryCode__s = 'AU';
            sundayShift.Location__PostalCode__s = '2911';
            insert sundayShift;
            
            List<String> facList = new List<String>{facility.Id};
            
            Test.startTest();
            String satResult = RostersPublishAndAssignHandler.getStaffHourlyRates(new List<Add_Shift__c>{saturdayShift}, '2024-10-16', '2024-10-22', facList);
            String sunResult = RostersPublishAndAssignHandler.getStaffHourlyRates(new List<Add_Shift__c>{sundayShift}, '2024-10-16', '2024-10-22', facList);
            Test.stopTest();
        }
    }
    
    @isTest
    public static void testSchadsPenaltyMode() {
        User use = [SELECT Id FROM User WHERE Email = 'manualtesting.612233142@hotmail.com' LIMIT 1];
        
        System.runAs(use) {
            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
            facility.Shift_Penalty_Mode__c = 'Schads';
            update facility;
            
            Add_Shift__c nightSchadsShift = new Add_Shift__c();
            nightSchadsShift.Break__c = '30';
            nightSchadsShift.Start_Date__c = Date.newInstance(2027, 05, 05);
            nightSchadsShift.Get_Facility__c = true;
            nightSchadsShift.Quantity__c = 1;
            nightSchadsShift.Start_Time__c = Time.newInstance(22, 00, 00, 00);
            nightSchadsShift.End_Time__c = Time.newInstance(06, 00, 00, 00);
            nightSchadsShift.Facility__c = facility.Id;
            nightSchadsShift.Status__c = 'Draft';
            nightSchadsShift.Shift_Type__c = 'General';
            nightSchadsShift.Is_EOI__c = true;
            nightSchadsShift.Role__c = 'Admin';
            nightSchadsShift.Duration__c = 8;
            nightSchadsShift.Day_Name__c = 'Monday';
            nightSchadsShift.Public_holiday__c = false;
            nightSchadsShift.Location__StateCode__s = 'ACT';
            nightSchadsShift.Location__CountryCode__s = 'AU';
            nightSchadsShift.Location__PostalCode__s = '2911';
            insert nightSchadsShift;
            
            Add_Shift__c afternoonSchadsShift = new Add_Shift__c();
            afternoonSchadsShift.Break__c = '30';
            afternoonSchadsShift.Start_Date__c = Date.newInstance(2027, 05, 06);
            afternoonSchadsShift.Get_Facility__c = true;
            afternoonSchadsShift.Quantity__c = 1;
            afternoonSchadsShift.Start_Time__c = Time.newInstance(14, 00, 00, 00);
            afternoonSchadsShift.End_Time__c = Time.newInstance(22, 00, 00, 00);
            afternoonSchadsShift.Facility__c = facility.Id;
            afternoonSchadsShift.Status__c = 'Draft';
            afternoonSchadsShift.Shift_Type__c = 'General';
            afternoonSchadsShift.Is_EOI__c = true;
            afternoonSchadsShift.Role__c = 'Admin';
            afternoonSchadsShift.Duration__c = 8;
            afternoonSchadsShift.Day_Name__c = 'Tuesday';
            afternoonSchadsShift.Public_holiday__c = false;
            afternoonSchadsShift.Location__StateCode__s = 'ACT';
            afternoonSchadsShift.Location__CountryCode__s = 'AU';
            afternoonSchadsShift.Location__PostalCode__s = '2911';
            insert afternoonSchadsShift;
            
            List<String> facList = new List<String>{facility.Id};
            
            Test.startTest();
            String nightResult = RostersPublishAndAssignHandler.getStaffHourlyRates(new List<Add_Shift__c>{nightSchadsShift}, '2024-10-16', '2024-10-22', facList);
            String afternoonResult = RostersPublishAndAssignHandler.getStaffHourlyRates(new List<Add_Shift__c>{afternoonSchadsShift}, '2024-10-16', '2024-10-22', facList);
            Test.stopTest();
        }
    }
    
    @isTest
    public static void testShiftEndDateCalculation() {
        User use = [SELECT Id FROM User WHERE Email = 'manualtesting.612233142@hotmail.com' LIMIT 1];
        
        System.runAs(use) {
            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
            
            Add_Shift__c nightShiftNoEndDate = new Add_Shift__c();
            nightShiftNoEndDate.Break__c = '30';
            nightShiftNoEndDate.Start_Date__c = Date.newInstance(2027, 05, 10);
            nightShiftNoEndDate.End_Date__c = null;
            nightShiftNoEndDate.Get_Facility__c = true;
            nightShiftNoEndDate.Quantity__c = 1;
            nightShiftNoEndDate.Start_Time__c = Time.newInstance(22, 00, 00, 00);
            nightShiftNoEndDate.End_Time__c = Time.newInstance(06, 00, 00, 00);
            nightShiftNoEndDate.Start_Time_Text__c = '10:00 pm';
            nightShiftNoEndDate.End_Time_Text__c = '6:00 am';
            nightShiftNoEndDate.Facility__c = facility.Id;
            nightShiftNoEndDate.Status__c = 'Draft';
            nightShiftNoEndDate.Shift_Type__c = 'Night';
            nightShiftNoEndDate.Is_EOI__c = true;
            nightShiftNoEndDate.Role__c = 'Admin';
            nightShiftNoEndDate.Duration__c = 8;
            nightShiftNoEndDate.Day_Name__c = 'Wednesday';
            nightShiftNoEndDate.Location__StateCode__s = 'ACT';
            nightShiftNoEndDate.Location__CountryCode__s = 'AU';
            nightShiftNoEndDate.Location__PostalCode__s = '2911';
            insert nightShiftNoEndDate;
            
            Add_Shift__c customShiftPM = new Add_Shift__c();
            customShiftPM.Break__c = '30';
            customShiftPM.Start_Date__c = Date.newInstance(2027, 05, 11);
            customShiftPM.End_Date__c = null;
            customShiftPM.Get_Facility__c = true;
            customShiftPM.Quantity__c = 1;
            customShiftPM.Start_Time__c = Time.newInstance(20, 00, 00, 00);
            customShiftPM.End_Time__c = Time.newInstance(04, 00, 00, 00);
            customShiftPM.Start_Time_Text__c = '8:00 pm';
            customShiftPM.End_Time_Text__c = '4:00 pm';
            customShiftPM.Facility__c = facility.Id;
            customShiftPM.Status__c = 'Draft';
            customShiftPM.Shift_Type__c = 'Custom';
            customShiftPM.Is_EOI__c = true;
            customShiftPM.Role__c = 'Admin';
            customShiftPM.Duration__c = 8;
            customShiftPM.Day_Name__c = 'Thursday';
            customShiftPM.Location__StateCode__s = 'ACT';
            customShiftPM.Location__CountryCode__s = 'AU';
            customShiftPM.Location__PostalCode__s = '2911';
            insert customShiftPM;
            
            List<String> facList = new List<String>{facility.Id};
            
            Test.startTest();
            String nightResult = RostersPublishAndAssignHandler.getStaffHourlyRates(new List<Add_Shift__c>{nightShiftNoEndDate}, '2024-10-16', '2024-10-22', facList);
            String customResult = RostersPublishAndAssignHandler.getStaffHourlyRates(new List<Add_Shift__c>{customShiftPM}, '2024-10-16', '2024-10-22', facList);
            Test.stopTest();
        }
    }
    
    @isTest
    public static void testAssignShiftsWithConflicts() {
        User use = [SELECT Id FROM User WHERE Email = 'manualtesting.612233142@hotmail.com' LIMIT 1];
        
        System.runAs(use) {
            Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
            ShiftwithStaff__c shift = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
            
            String conflictJson = '[{"staffId":"' + staff.Id + '","conflictDates":[{"dateString":"2027-04-28"}]}]';
            
            Test.startTest();
            RostersPublishAndAssignHandler.AssignShiftsInDrag(45, staff.Id, '', shift.Id, '2027-04-27', '2027-04-28', conflictJson);
            Test.stopTest();
        }
    }
    
    @isTest
    public static void testSleeperoverShiftType() {
        User use = [SELECT Id FROM User WHERE Email = 'manualtesting.612233142@hotmail.com' LIMIT 1];
        
        System.runAs(use) {
            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
            
            Add_Shift__c sleeperoverShift = new Add_Shift__c();
            sleeperoverShift.Break__c = '0';
            sleeperoverShift.Start_Date__c = Date.newInstance(2027, 05, 12);
            sleeperoverShift.Get_Facility__c = true;
            sleeperoverShift.Quantity__c = 1;
            sleeperoverShift.Start_Time__c = Time.newInstance(22, 00, 00, 00);
            sleeperoverShift.End_Time__c = Time.newInstance(07, 00, 00, 00);
            sleeperoverShift.Facility__c = facility.Id;
            sleeperoverShift.Status__c = 'Draft';
            sleeperoverShift.Shift_Type__c = 'Sleepover Shift';
            sleeperoverShift.Is_EOI__c = true;
            sleeperoverShift.Role__c = 'Admin';
            sleeperoverShift.Duration__c = 9;
            sleeperoverShift.Day_Name__c = 'Friday';
            sleeperoverShift.Public_holiday__c = false;
            sleeperoverShift.Location__StateCode__s = 'ACT';
            sleeperoverShift.Location__CountryCode__s = 'AU';
            sleeperoverShift.Location__PostalCode__s = '2911';
            insert sleeperoverShift;
            
            List<String> facList = new List<String>{facility.Id};
            
            Test.startTest();
            String result = RostersPublishAndAssignHandler.getStaffHourlyRates(new List<Add_Shift__c>{sleeperoverShift}, '2024-10-16', '2024-10-22', facList);
            Test.stopTest();
        }
    }
    
  
}