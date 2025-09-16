@isTest
private class signInControllerTest {
    @testsetup Static void testData(){ 
        //Organisation__c org = OrgDetailsTest.createOrganization();
        Organisation__c org = new Organisation__c();
        org.Name='Pinnacle IT';
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
        org.Mileage_Amount__c=30;
        org.User_Type__c = 'NDIS Org Admin';
        insert org;
        
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.205278@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='Test nagendra258', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.205278@hotmail.com',Organization_Name__c ='Pinnacle IT');
        insert user;
        System.runAs(user) { 
            Facility__c fac = new Facility__c();
            fac.Name='Ashfield Consultants';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Email__c= 'testfacility@gmail.com';
            fac.Status__c=true;
            fac.Organisation__c= org.Id;
            fac.ABN__c='12234567';
            fac.Phone__c = '12323432';
            insert fac;
            
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c='manualtesting.205278@hotmail.com';
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
            staff.Working_Hours_Rate__c=50;
            insert staff; 
            
            Add_Shift__c shift = new Add_Shift__c();
            shift.Break__c = '30';
            shift.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift.Start_Date__c =Date.newInstance(2024, 10, 16);        
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
            
            ShiftwithStaff__c shiftWithStaff= new ShiftwithStaff__c();
            shiftWithStaff.Staff__c=staff.id;
            shiftWithStaff.Add_Shift__c=shift.id;
            shiftWithStaff.Attendence__c=True;
            //shiftWithStaff.Enable_Sign_Out__c = true;
            insert shiftWithStaff; 
            
            
            Allocation__c alocRec=new Allocation__c();
            alocRec.End_Date__c=date.newInstance(2023, 12, 13);
            alocRec.Start_Date__c=date.newInstance(2023, 12, 13);
            alocRec.Working_Hours__c=2;
            alocRec.Staff__c=staff.id;
            insert alocRec; 
        }
    }
     @isTest
    public static void signInTestMethod(){ 
        ShiftwithStaff__c shiftList= [select id from ShiftwithStaff__c limit 1];
        string dateValue='2023-12-13';
        string loginTime='16:15';
       
        
        test.startTest();
        SignInController.PendingShifts(dateValue);
        SignInController.updateSignInTime(loginTime, shiftList.id,false);
        test.StopTest();            
    }
    
    @isTest
    public static void signOutMethod(){ 
      	Staff__c  StaffList= [select id,Email_Address__c from Staff__c limit 1];
        string logouttime='18:15';
        date datevalue=  date.newInstance(2023, 12, 13);
        time timeChange=Time.newInstance(16, 15, 00, 00);
        time LoginTime=Time.newInstance(16, 15, 00, 00);
        string shiftNotes='Test notess';          
        
        ShiftwithStaff__c shift= [select id from ShiftwithStaff__c limit 1];
        string shiftId=shift.id;
        User u= [SELECT Id from User where email='manualtesting.205278@hotmail.com' LIMIT 1];
        System.runAs(u) {
            test.startTest();
            SignInController.updateSignoutTime(logouttime,shiftId,shiftNotes,false,3.00,'TestnightShiftHourComments','TestextendedComments');
           // SignInController.createAllocation(timeChange, LoginTime, datevalue, StaffList.Id);
            test.StopTest();
        }  
    }
    
    @isTest
    public static void createReimbursement(){  
        Add_Shift__c shiftlist=[select id,createdbyid from Add_Shift__c limit 1];
        ShiftwithStaff__c shiftStaffList= [select id,Add_Shift__r.createdbyid from ShiftwithStaff__c limit 1];
        Reimbursement__c rei = new Reimbursement__c();
        rei.ShiftwithStaff__c=shiftStaffList.id;
        rei.Mileage__c='20';
        rei.Others__c=' test others';
        rei.Comments__c=' test comments';
        rei.Approval_Status__c='Pending';
        rei.Approval_user__c=shiftStaffList.Add_Shift__r.createdbyid;
        insert rei;
        User u= [SELECT Id,Type_of_User__c from User where email='manualtesting.205278@hotmail.com' LIMIT 1];
        System.runAs(u) {
            test.startTest();
            SignInController.craeteReimbursement(string.valueof(shiftStaffList.id), 16.12, '10', 'test comments', False, 'Null','Fuel');
            SignInController.craeteReimbursement( string.valueof(shiftStaffList.id),16, '10', 'test comments', True,rei.id,'Fuel');
            SignInController.craeteReimbursement( string.valueof(shiftStaffList.id),16, '10', 'test comments', True,rei.id,'Electric');
            SignInController.requestSignIn(shiftStaffList.Id);
            Map<String, Object> result = SignInController.requestSignOut(shiftStaffList.Id);
            test.StopTest();    
        }        
    }
}