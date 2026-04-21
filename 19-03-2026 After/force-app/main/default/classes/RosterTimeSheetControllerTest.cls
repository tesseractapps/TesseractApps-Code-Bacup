@isTest
public class RosterTimeSheetControllerTest {
    
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
        User user = new User(Alias = 'praveen', Email= 'manualtesting.20294444637@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne209463', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.20294444637@hotmail.com',Organization_Name__c ='Ashfield Consultants');
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
            fac.Phone__c = '12323432';
            fac.ABN__c='12345678912';
            fac.Phone__c = '12323432';
            insert fac;
            
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff'; 
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.20294444637@hotmail.com';
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
            shift.Start_Date__c =Date.newInstance(2024, 10, 16);
            shift.End_Date__c=Date.newInstance(2024, 10, 24);
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
            shift1.Shift_Type__c='Sleepover Shift';
            shift1.Start_Time_Text__c = '6:30 pm';
            shift1.End_Time_Text__c = '10:00 pm';
            shift1.Split_Shifts__c = true;
            insert shift1;
            
            ShiftwithStaff__c staffs2 = new ShiftwithStaff__c();
            staffs2.Add_Shift__c=shift1.Id;
            staffs2.Attendence__c=true;
            staffs2.Comments__c = 'test comments';
            staffs2.Log_Out_Date_Time__c=Time.newInstance(22, 00, 00, 00);
            staffs2.Log_In_Date_Time__c=Time.newInstance( 18, 30, 00, 00);
            staffs2.Staff__c=staff.Id;
            staffs2.Role__c='Admin';
            staffs2.Status__c='Accepted';
            staffs2.Recur_Holiday__c = true;
            insert staffs2;
            
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
            shift2.Shift_Type__c='Sleepover Shift';
            shift2.Split_Shifts__c = false;
            shift2.Public_holiday__c=true;
            shift2.Day_Name__c='Saturday';
            insert shift2;
            
              ShiftwithStaff__c staffs3 = new ShiftwithStaff__c();
            staffs3.Add_Shift__c=shift2.Id;
            staffs3.Attendence__c=true;
            staffs3.Comments__c = 'test comments';
            staffs3.Log_Out_Date_Time__c=Time.newInstance(22, 00, 00, 00);
            staffs3.Log_In_Date_Time__c=Time.newInstance( 18, 30, 00, 00);
            staffs3.Staff__c=staff.Id;
            staffs3.Role__c='Admin';
            staffs3.Status__c='Accepted';
            staffs3.Recur_Holiday__c = true;
            insert staffs3;
            
             Add_Shift__c shift3 = new Add_Shift__c();
            shift3.Break__c = '30';
            shift3.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift3.Start_Date__c =Date.newInstance(2024, 08, 20);        
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
            shift3.Shift_Type__c='Custom';
            shift3.Split_Shifts__c = false;
            shift3.Public_holiday__c=true;
            shift3.Day_Name__c='Saturday';
            insert shift3;
            
             ShiftwithStaff__c staffs4 = new ShiftwithStaff__c();
            staffs4.Add_Shift__c=shift3.Id;
            staffs4.Attendence__c=true;
            staffs4.Comments__c = 'test comments';
            staffs4.Log_Out_Date_Time__c=Time.newInstance(22, 00, 00, 00);
            staffs4.Log_In_Date_Time__c=Time.newInstance( 18, 30, 00, 00);
            staffs4.Staff__c=staff.Id;
            staffs4.Role__c='Admin';
            staffs4.Status__c='Accepted';
            staffs4.Recur_Holiday__c = true;
            insert staffs4;
            
            Add_Shift_Checklist__c  asch2 = new Add_Shift_Checklist__c();
            asch2.Description__c=' teststs ';
            asch2.Mandatory__c = true;
            asch2.Add_Shift__c=shift2.Id;
            insert asch2;
            
            ShiftwithStaff__c staffs1 = new ShiftwithStaff__c();
            staffs1.Add_Shift__c=shift1.Id;
            staffs1.Attendence__c=true;
            staffs1.Comments__c = 'test comments';
            staffs1.Log_Out_Date_Time__c=Time.newInstance(22, 00, 00, 00);
            staffs1.Log_In_Date_Time__c=Time.newInstance( 18, 30, 00, 00);
            staffs1.Staff__c=staff.Id;
            staffs1.Role__c='Admin';
            staffs1.Status__c='Accepted';
            staffs1.Recur_Holiday__c = true;
            insert staffs1;
            
            Break_Timings__c break1 = new Break_Timings__c();
            break1.Break_End_Date__c=Date.newInstance(2024, 12, 17);
            break1.Break_End_Time__c=Time.newInstance(22, 00, 00, 00);
            break1.Break_Start_Date__c = Date.newInstance(2024, 12, 16);
            break1.Break_Start_Time__c=Time.newInstance( 18, 30, 00, 00);
            break1.isBreakIncluded__c=true;
			break1.ShiftwithStaff__c=staffs1.Id;            
            insert break1;
            
            Allocation__c alocRec = new Allocation__c();
            alocRec.End_Date__c= Date.newInstance(2024, 12, 16);
            alocRec.Start_Date__c= Date.newInstance(2024, 12, 16);
            
            
        }
    }
    @isTest
    static void testHolidayListByOrg_ValidState() {
        // Prepare test data
      User u5= [SELECT Id from User where email='manualtesting.20294444637@hotmail.com' LIMIT 1];
        System.runAs(u5) {
        Public_Holiday__c holiday1 = new Public_Holiday__c(
            Date__c = Date.newInstance(2025, 1, 1),
            Holiday_Name__c = 'New Year\'s Day',
            State__c = 'New South Wales;Victoria' // Assuming multi-select picklist values separated by semicolon
        );
        insert holiday1;
        
        Public_Holiday__c holiday2 = new Public_Holiday__c(
            Date__c = Date.newInstance(2025, 4, 25),
            Holiday_Name__c = 'ANZAC Day',
            State__c = 'Queensland'
        );
        insert holiday2;
        
        Test.startTest();
        List<Public_Holiday__c> results = RosterTimeSheetController.holidayListbyOrg('NSW');
        Test.stopTest();
        
        System.assertNotEquals(0, results.size(), 'Should return holidays for NSW');
        System.assertEquals('New Year\'s Day', results[0].Holiday_Name__c);
        list<Staff__c> staffs = [SELECT Name__c,Last_Name__c,Role__c,Facility_Name__c FROM Staff__c   ];
       
        list<Id> staffId = new list<Id>();
        for(Staff__c ss:staffs){
            staffId.add(ss.id);
        }
         List<ShiftwithStaff__c> staffshift = [SELECT Id,Status__c from ShiftwithStaff__c WHERE staff__r.Email_Address__c='manualtesting.20294444637@hotmail.com' ];
        List<string> shiftIDlist = new List<string>();
          for(ShiftwithStaff__c ss:staffshift){
            shiftIDlist.add(ss.id);
        }
         List<facility__c> faclist = [SELECT Id from facility__c];
        List<string> facIdList = new List<string>();
          for(facility__c ff:faclist){
            facIdList.add(ff.id);
        }
        string stafid=staffs[0].Id;
        Organisation__c org=[select id from Organisation__c limit 1];
        /*List<Add_Shift_Checklist__c> checklistItems = new List<Add_Shift_Checklist__c>{
            new Add_Shift_Checklist__c(Add_Shift__c = addShift.Id, Mandatory__c = true, Description__c = 'Item 1', Completed__c = false),
            new Add_Shift_Checklist__c(Add_Shift__c = addShift.Id, Mandatory__c = false, Description__c = 'Item 2', Completed__c = true)
        };
        insert checklistItems;*/
        
        Add_Shift_Checklist__c addcheckList = [select id from Add_Shift_Checklist__c limit 1];
		RosterTimeSheetController.getCheckListByShiftId(staffshift[0].Id);
        RosterTimeSheetController.getStaffShiftData(staffId, Date.newInstance(2024, 10, 16), Date.newInstance(2024, 10, 23));
        RosterTimeSheetController.updateAllocations(shiftIDlist);
        RosterTimeSheetController.getMismatchedShifts(stafid, Date.newInstance(2024, 10, 16), Date.newInstance(2024, 10, 23));
        RosterTimeSheetController.editAllocation(staffshift[0].Id);
        RosterTimeSheetController.StaffsRolesWiseList(org.id,facIdList, new list<string>{'Admin'}, '') ;
            
    }
   }
    
    @isTest
    static void testHolidayListByOrg_InvalidState() {
         User u5= [SELECT Id from User where email='manualtesting.20294444637@hotmail.com' LIMIT 1];
        System.runAs(u5) {
        Test.startTest();
        List<Public_Holiday__c> results = RosterTimeSheetController.holidayListbyOrg('XYZ');
        Test.stopTest();
        
        System.assertEquals(0, results.size(), 'Should return empty list for invalid state');
        }
    }
    
    @isTest
    static void testHolidayListByOrg_EmptyState() {
         User u5= [SELECT Id from User where email='manualtesting.20294444637@hotmail.com' LIMIT 1];
        System.runAs(u5) {
        Test.startTest();
        List<Public_Holiday__c> results = RosterTimeSheetController.holidayListbyOrg(null);
        Test.stopTest();
        }
    }
    
        @isTest
    static void testGetStaffShiftDataForNDISStaff() {
        User u5 = [SELECT Id, Email, User_Type__c FROM User WHERE Email = 'manualtesting.20294444637@hotmail.com' LIMIT 1];
        u5.User_Type__c = 'NDIS Staff';
        update u5;
        
        System.runAs(u5) {
            Test.startTest();
            RosterTimeSheetController.getStaffShiftData(null, Date.newInstance(2024, 10, 16), Date.newInstance(2024, 10, 23));
            Test.stopTest();
        }
    }
    
    @isTest
    static void testGetStaffShiftDataEmptyStaffIds() {
        User u5 = [SELECT Id FROM User WHERE Email = 'manualtesting.20294444637@hotmail.com' LIMIT 1];
        System.runAs(u5) {
            Test.startTest();
            RosterTimeSheetController.getStaffShiftData(new List<Id>(), Date.newInstance(2024, 10, 16), Date.newInstance(2024, 10, 23));
            Test.stopTest();
        }
    }
    
    @isTest
    static void testUpdateAllocationsWithVariousShiftTypes() {
        User u5 = [SELECT Id FROM User WHERE Email = 'manualtesting.20294444637@hotmail.com' LIMIT 1];
        System.runAs(u5) {
            // Get all shift types to test
            List<ShiftwithStaff__c> staffshifts = [SELECT Id, Type_of_shift__c, Day_Name__c FROM ShiftwithStaff__c];
            
            // Create different types of shifts for coverage
            for(ShiftwithStaff__c shift : staffshifts) {
                if(shift.Type_of_shift__c == 'Custom') {
                    shift.Long_Morning_Hourly_Rate__c = 50;
                    shift.Long_Morning_Shift_Duartion__c = 2;
                    shift.Long_Afternoon_Hourly_Rate__c = 60;
                    shift.Long_Afternoon_Shift_Duartion__c = 3;
                    shift.Long_Night_Hourly_Rate__c = 70;
                    shift.Long_Night_Shift_Duartion__c = 4;
                    shift.Long_Sleepover_Allowance__c = 80;
                    shift.Long_Sleepover_Duartion__c = 5;
                    shift.Long_Afternoon_Duration_Two__c = 1;
                    shift.Long_Afternoon_Rate_Two__c = 65;
                    shift.Long_Morning_Rate_Two__c = 55;
                    shift.Long_Morning_Duartion_Two__c = 1.5;
                }

            }
            update staffshifts;
            
            List<string> shiftIDlist = new List<string>();
            for(ShiftwithStaff__c ss : staffshifts) {
                shiftIDlist.add(ss.id);
            }
            
            Test.startTest();
            RosterTimeSheetController.updateAllocations(shiftIDlist);
            Test.stopTest();
        }
    }
    
    @isTest
    static void testUpdateAllocationsCancelledShift() {
        User u5 = [SELECT Id FROM User WHERE Email = 'manualtesting.20294444637@hotmail.com' LIMIT 1];
        System.runAs(u5) {
            ShiftwithStaff__c shift = [SELECT Id, Status__c, Shift_Cancel_Payment__c FROM ShiftwithStaff__c LIMIT 1];
            shift.Status__c = 'Cancelled';
            shift.Shift_Cancel_Payment__c = 100;
            shift.Log_In_Date_Time__c = null;
            shift.Log_Out_Date_Time__c = null;
            update shift;
            
            List<string> shiftIDlist = new List<string>{shift.Id};
            
            Test.startTest();
            RosterTimeSheetController.updateAllocations(shiftIDlist);
            Test.stopTest();
        }
    }
    
    @isTest
    static void testGetCheckListByShiftIdError() {
        User u5 = [SELECT Id FROM User WHERE Email = 'manualtesting.20294444637@hotmail.com' LIMIT 1];
        System.runAs(u5) {
            Test.startTest();
            RosterTimeSheetController.getCheckListByShiftId('');
            Test.stopTest();
        }
    }
    
    @isTest
    static void testStaffsRolesWiseListNDISStaff() {
        User u5 = [SELECT Id, Email, User_Type__c FROM User WHERE Email = 'manualtesting.20294444637@hotmail.com' LIMIT 1];
        u5.User_Type__c = 'NDIS Staff';
        update u5;
        
        System.runAs(u5) {
            Test.startTest();
            RosterTimeSheetController.StaffsRolesWiseList(null, null, null, null);
            Test.stopTest();
        }
    }
    
    @isTest
    static void testStaffsRolesWiseListWithFilters() {
        User u5 = [SELECT Id FROM User WHERE Email = 'manualtesting.20294444637@hotmail.com' LIMIT 1];
        System.runAs(u5) {
            Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
            List<Facility__c> faclist = [SELECT Id FROM Facility__c];
            List<string> facIdList = new List<string>();
            for(Facility__c ff : faclist) {
                facIdList.add(ff.id);
            }
            
            Test.startTest();
            RosterTimeSheetController.StaffsRolesWiseList(org.id, facIdList, new List<string>{'Admin'}, 'praveen');
            Test.stopTest();
        }
    }
    
    @isTest
    static void testUpdateAllocationsException() {
        User u5 = [SELECT Id FROM User WHERE Email = 'manualtesting.20294444637@hotmail.com' LIMIT 1];
        System.runAs(u5) {
            Test.startTest();
            RosterTimeSheetController.updateAllocations(new List<string>{'invalidId'});
            Test.stopTest();
        }
    }

    @isTest
    static void testStaffsRolesWiseListNullOrgId() {
        User u5 = [SELECT Id FROM User WHERE Email = 'manualtesting.20294444637@hotmail.com' LIMIT 1];
        System.runAs(u5) {
            Test.startTest();
            RosterTimeSheetController.StaffsRolesWiseList(null, null, new List<string>{'Admin'}, 'test');
            Test.stopTest();
        }
    }
    
}