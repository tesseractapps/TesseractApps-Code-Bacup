@istest
private class mobileAppMyRoasterTestClass {
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
        
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.2062@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='Test nagendra12062', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.2062@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        insert user;
        System.runAs(user) { 
            Facility__c fac = new Facility__c();
            fac.Name='Ashfield Consultants';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Email__c= 'testfacility@gmail.com';
            fac.Organisation__c= org.Id;
            fac.Status__c=true;
            fac.ABN__c='1254523365';
            fac.Phone__c = '12323432';
            insert fac;
            
        Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff';
            staff.Name='praveen11';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.2062@hotmail.com';
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
            staff.Working_Hours_Rate__c=40;
            insert staff;
            
            Add_Shift__c shift= new Add_Shift__c();
            shift.Break__c = '30';
            shift.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift.Start_Date__c =Date.newInstance(2024, 03, 15); 
            ///shift.End_Date__c=Date.newInstance(2024, 03, 15); 
            shift.Role__c='Admin';
            shift.Get_Facility__c=true;
            shift.Quantity__c=5;
            shift.Start_time_picklist__c='4:30 pm';
            shift.End_time_picklist__c='6:30 pm';
            shift.Date__c = date.newInstance(2024, 03, 15);
            shift.Start_Time__c= Time.newInstance(16, 30, 00, 00);
            shift.End_Time__c= Time.newInstance(18, 30, 30, 00);
            shift.Facility__c=fac.Id;
            shift.Status__c='Draft';
            shift.Location__Street__s='8 Keewong Street';
            shift.Location__City__s = 'Crace';
            shift.Location__StateCode__s = 'ACT';
            shift.Location__CountryCode__s = 'AU';
            shift.Location__PostalCode__s = '2911';
            shift.Shift_Type__c='General';
             shift.Start_Time_Text__c = '5:30 pm';
            shift.End_Time_Text__c = '6:30 pm';
            insert shift;
            
             Add_Shift__c shift1= new Add_Shift__c();
            shift1.Break__c = '30';
            shift1.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift1.Start_Date__c =Date.newInstance(2024, 03, 15);        
            shift1.Role__c='Admin';
            shift1.Get_Facility__c=true;
            shift1.Quantity__c=5;
            shift1.Start_time_picklist__c='5:30 pm';
            shift1.End_time_picklist__c='6:30 pm';
            shift1.Date__c = date.newInstance(2024, 03, 15);
            shift1.Start_Time__c= Time.newInstance(17, 30, 00, 00);
            shift1.End_Time__c= Time.newInstance(18, 30, 30, 00);
            shift1.Facility__c=fac.Id;
            shift1.Status__c='Draft';
            shift1.Location__Street__s='8 Keewong Street';
            shift1.Location__City__s = 'Crace';
            shift1.Location__StateCode__s = 'ACT';
            shift1.Location__CountryCode__s = 'AU';
            shift1.Location__PostalCode__s = '2911';
            shift1.Shift_Type__c='General';
             shift1.Start_Time_Text__c = '5:30 pm';
            shift1.End_Time_Text__c = '6:30 pm';
            insert shift1;
            
            ShiftwithStaff__c shiftWithStaff= new ShiftwithStaff__c();
            shiftWithStaff.Staff__c=staff.id;
            shiftWithStaff.Add_Shift__c=shift.id;
            shiftWithStaff.Attendence__c=True;
            insert shiftWithStaff;
            
           /*  ShiftwithStaff__c shiftWithStaff2= new ShiftwithStaff__c();
            shiftWithStaff2.Staff__c=staff.id;
            shiftWithStaff2.Add_Shift__c=shift1.id;
            shiftWithStaff2.Attendence__c=True;
            insert shiftWithStaff2; */
        }
    }
    @isTest static void myRosterMethod() {
        user u= [select id,Email from user where email='manualtesting.2062@hotmail.com' limit 1 ];
        system.debug('user'+u);
        System.runAs(u){
        staff__c staff=[select id , Email_Address__c from staff__c limit 1];
        system.debug('staff'+staff);
        string datevalue='2024-03-15';
        RestRequest request = new RestRequest();
        request.requestUri ='https://pinnacleit--tesseract.sandbox.lightning.force.com/services/apexrest/roasterDetails/'+datevalue;
        request.httpMethod = 'GET';
        RestContext.request = request;
        list<Add_Shift__c> shiftList=mobileAppMyRoaster.doGet();
        }
        
    }
    
     @isTest static void eoiMethod(){ 
         ShiftwithStaff__c ss=[select id from ShiftwithStaff__c limit 1];
       string testEoiMethod=  mobileAppMyRoaster.doPost(ss.id, false, '1254478259');
      // string testEoiMethod2=  mobileAppMyRoaster.doPost(ss.id, false,NUll);
         
     }

}