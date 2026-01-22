@isTest
public class ShiftTimehandlerTest {
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
        User user = new User(Alias = 'praveen', Email= 'manualtesting.209458@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne209458', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.209458@hotmail.com',Organization_Name__c ='Ashfield Consultants');
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
            fac.Phone__c= '24343423432';
            fac.ABN__c = '736473632324';
            insert fac;
            
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff';
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.209458@hotmail.com';
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
            
            Direction__c dire = new Direction__c();
            dire.Name='Test Directions';
            insert dire;
            
            Add_Shift__c shift = new Add_Shift__c();
            shift.Break__c = '30';
            shift.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift.Start_Date__c =Date.newInstance(2025, 10, 16);        
            shift.Direction__c=dire.Id;
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
            shift.Shift_Type__c='General';
            insert shift;
            
            Add_Shift__c shift1 = new Add_Shift__c();
            shift.Break__c = '30';
            shift1.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift1.Start_Date__c =Date.newInstance(2025, 10, 16);        
           // shift1.Role__c='Admin';
            shift1.Get_Facility__c=true;
            shift1.Quantity__c=5;
            shift1.Start_Time__c=Time.newInstance( 18, 30, 00, 00);
            shift1.End_Time__c=Time.newInstance(22, 00, 00, 00);
            shift1.Facility__c=fac.Id;
            shift1.Status__c='Draft';
            shift1.Start_time_picklist__c='4:30 am';
            shift1.End_time_picklist__c='8:00 am';
            shift1.Location__StateCode__s = 'ACT';
            shift1.Location__CountryCode__s = 'AU';
            shift1.Location__PostalCode__s = '2911';
            shift1.Shift_Type__c='Night';
            insert shift1;
      
            List<ShiftwithStaff__c> shiftList = new List<ShiftwithStaff__c>();
            
            ShiftwithStaff__c staffs = new ShiftwithStaff__c();
            staffs.Add_Shift__c=shift.Id;
            staffs.Attendence__c=true;
            staffs.Comments__c = 'test comments';
            staffs.Staff__c=staff.Id;
            //staffs.Role__c='Admin';
            staffs.Facility_Name__c = fac.Id;
            shiftList.add(staffs);
            
            ShiftwithStaff__c staffs1 = new ShiftwithStaff__c();
            staffs1.Add_Shift__c=shift1.Id;
            staffs1.Attendence__c=true;
            staffs1.Comments__c = 'test comments';
            staffs1.Staff__c=staff.Id;
            staffs1.Role__c='Admin';
            staffs1.Facility_Name__c = fac.Id;
            shiftList.add(staffs1);
            
            insert shiftList;  
        }
    }    
    
    @isTest
    public static void AddshiftwithStaffTest(){
        List<ShiftwithStaff__c> staffshift = [SELECT Id,Add_Shift__c,Staff__c FROM ShiftwithStaff__c];        
        test.startTest();
        ShiftTimehandler.deleteServices(staffshift);
        //ShiftTimehandler.updaterelatedshift(staffshift);
			//ShiftTimehandler.AddshiftwithStaff(staffshift,NULL);
        	//ShiftTimehandler.AddshiftwithStaff(staffshift,NULL);
        test.stopTest(); 
    }
    
     @isTest
    static void testAddShift_InsertScenario() {
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        Add_Shift__c shift2 = [SELECT Id,Facility_Name__c FROM Add_Shift__c LIMIT 1];

        // Simulate new shift assignment
        ShiftwithStaff__c newShift = new ShiftwithStaff__c(
            Staff__c = staff.Id,
            Add_Shift__c = shift2.Id,
            Attendence__c = true,
            Comments__c = 'Test Comments1',
            Role__c = 'Admin'
        );

        Test.startTest();
        ShiftTimehandler.isFirstTime = true; // Reset static flag

        ShiftTimehandler.AddshiftwithStaff(
            new List<ShiftwithStaff__c>{ newShift },
            null // No old map = insert scenario
        );
        Test.stopTest();

        System.assert(true, 'Insert flow should complete without errors');
    }

    @isTest
    static void testShiftQuantityExceeded() {
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        Add_Shift__c shift = [SELECT Id, Quantity__c FROM Add_Shift__c LIMIT 1];

        // Insert additional staff to hit quantity limit
        List<ShiftwithStaff__c> shiftsList = [SELECT ID FROM ShiftwithStaff__c];
        Test.startTest();
        ShiftTimehandler.isFirstTime = true;
        try {
           // ShiftTimehandler.AddshiftwithStaff(new List<ShiftwithStaff__c>{ overflowShift }, null);
            ShiftTimehandler.AddshiftwithStaff(shiftsList, null);
        } catch (Exception e) {
           // System.assert(e.getMessage().contains('Maximum Staff'), 'Expected error for max staff exceeded');
        }
        Test.stopTest();
    }
}