@isTest
public class AwardsControllerTest {
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
        User user = new User(Alias = 'praveen', Email= 'manualtesting.20932@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne20931', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.20931@hotmail.com',Organization_Name__c ='Ashfield Consultants');
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
            fac.ABN__c='1235645433';
            fac.Phone__c = '12323213';
            insert fac;
            
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff';
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.20932@hotmail.com';
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
            staff.Restrict_Set_Hours__c = true;
            staff.Set_Hours__c = 10;
            staff.Final_Overall_Rate__c=150;
            staff.Saturday_Hourly_Rate__c = 130;
            staff.Sunday_Hourly_Rate__c = 50;

            insert staff; 
            
            StaffRole__c sr = new StaffRole__c(
                StaffRole_To_Staff__c = staff.Id,
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
            
            
            Award__c aw= new Award__c();
            aw.Awards__c='Outstanding Support Worker Award';
            aw.Date__c=date.newInstance(2025,02, 19);
            aw.Staff__c=staff.id;
            // aw.Facility__c=fac.id;
            aw.Issued_by__c='praveen';
            insert aw;
            
            Add_Shift__c addshift = new Add_Shift__c();
            addshift.Break__c = '30';
            addshift.Do_you_want_to_set_this_a_recurring_shif__c=true;
            addshift.Start_Date__c =Date.newInstance(2024, 03, 16);
            //shift.Role__c='Admin';
            addshift.Get_Facility__c=true;
            addshift.Quantity__c=5;
            addshift.Start_Time__c=Time.newInstance( 03, 30, 00, 00);
            addshift.End_Time__c=Time.newInstance( 05, 00, 00, 00);
            addshift.Facility__c=fac.Id;
            addshift.Status__c='Draft';
            addshift.Start_time_picklist__c='3:30 am';
            addshift.End_time_picklist__c='5:00 am';
            addshift.Location__StateCode__s = 'ACT';
            addshift.Location__CountryCode__s = 'AU';
            addshift.Location__PostalCode__s = '2911';
            insert addshift; 
            
            ShiftwithStaff__c shifts = new ShiftwithStaff__c();
            shifts.Add_Shift__c=addshift.Id;
            shifts.Attendence__c=true;
            shifts.Comments__c = 'test comments';
            shifts.Staff__c=staff.Id;
            shifts.Role__c='Admin';
            shifts.Status__c='Accepted';
            shifts.Log_In_Date_Time__c = Time.newInstance( 3, 30, 00, 00);
            shifts.Log_Out_Date_Time__c = Time.newInstance( 5, 00, 00, 00);
			shifts.Shift_End_Date__c=addshift.End_Date__c;
            shifts.Shift_Start_Time__c=addshift.Start_Time__c;
            // staffs.End_Time__c=system.now();
            insert shifts; 
            
        }
    }
    
    @isTest
    public static void AwardstestMethod(){
        User u2= [SELECT Id from User where email='manualtesting.20932@hotmail.com' LIMIT 1];
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff = [SELECT Id, Restrict_Set_Hours__c,Set_Hours__c FROM Staff__c WHERE Facility__c = :fac.Id LIMIT 1];
        ShiftwithStaff__c ShiftwithStaff = [SELECT Id, Shift_Start_Time__c, Shift_End_Time__c, Duration__c FROM ShiftwithStaff__c LIMIT 1];
        List<ShiftwithStaff__c> weekShifts = new List<ShiftwithStaff__c>{ ShiftwithStaff };

        Date today = Date.today();
        String shiftDate = String.valueOf(today.day()) + '/' + String.valueOf(today.month()) + '/' + String.valueOf(today.year());
        String endDate = String.valueOf(today.day()) + '/' + String.valueOf(today.month()) + '/' + String.valueOf(today.year());
        
        String dateStr = '2025-08-18';
        Date expected = Date.newInstance(2025, 8, 18);
        
        Time startTime = Time.newInstance(9, 0, 0, 0);   // 9:00 AM
        Time endTime = Time.newInstance(11, 0, 0, 0);    // 11:00 AM
        Availability__c av = new Availability__c(
            Start_Time__c = Time.newInstance(8, 0, 0, 0),
            End_Time__c = Time.newInstance(18, 0, 0, 0)
        );
        
        List<Availability__c> avList = new List<Availability__c>{ av };
            
        Time newShiftStart = Time.newInstance(11, 0, 0, 0);  // 11:00 AM
        Time newShiftEnd = Time.newInstance(13, 0, 0, 0);    // 1:00 PM
        
        System.runAs(u2){
            Organisation__c orgRec =[select id,name from Organisation__c where name='Ashfield Consultants'];
            Award__c aw=[select id from Award__c limit 1];
            test.startTest();
            AwardController.getAwardsByOrg(string.valueOf(orgRec.id));
            Boolean checkSetHoursRestriction = AwardController.checkSetHoursRestriction(staff, weekShifts, 10);
            AwardController.getAwards(aw.id,string.valueOf(orgRec.id));
            AwardController.getStaffList(orgRec.Id,fac.Id);
            AwardController.getStaffListforRosterManager(orgRec.Id,fac.Id,shiftDate,endDate,'9:00 AM','5:00 PM','Admin' );            
            Date result = AwardController.parseDateDMY(dateStr);
            // Boolean result1 = AwardController.checkAvailability(avList, Time.newInstance(9, 0, 0, 0), Time.newInstance(17, 0, 0, 0));
            // Boolean result2 = AwardController.checkShiftConflicts(weekShifts, newShiftStart, newShiftEnd);
            test.stopTest();  
        }
    }    
}