@isTest
private class signInControllerTest {
    
    @testsetup 
    static void testData(){ 
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
        
        Profile prof = [select id,Name from profile where name LIKE '%Admin%' LIMIT 1];
        User user = new User(
            Alias = 'praveen', 
            Email= 'manualtesting.205278@hotmail.com',
            User_Type__c='NDIS Org Admin', 
            EmailEncodingKey='UTF-8', 
            LastName='Test nagendra258', 
            LanguageLocaleKey='en_US', 
            LocaleSidKey='en_US', 
            ProfileId = prof.Id, 
            TimeZoneSidKey='America/New_York', 
            UserName='manualtesting.205278@hotmail.com',
            Organization_Name__c ='Pinnacle IT'
        );
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
            fac.ABN__c='12345678987';
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
            insert shiftWithStaff; 
            
            Allocation__c alocRec=new Allocation__c();
            alocRec.End_Date__c=date.newInstance(2023, 12, 13);
            alocRec.Start_Date__c=date.newInstance(2023, 12, 13);
            alocRec.Working_Hours__c=2;
            alocRec.Staff__c=staff.id;
            insert alocRec; 
        }
    }
    
    // =====================================================
    // PendingShifts
    // =====================================================
    @isTest
    public static void signInTestMethod(){ 
        ShiftwithStaff__c shiftList= [select id from ShiftwithStaff__c limit 1];
        string dateValue='2023-12-13';
        string loginTime='16:15';
        
        test.startTest();
        SignInController.PendingShifts(dateValue);
        SignInController.updateSignInTime(loginTime, shiftList.id, false);
        test.StopTest();            
    }
    
    // =====================================================
    // updateSignInTime - web vs mobile
    // =====================================================
    @isTest
    public static void testUpdateSignInTime_FromWeb() {
        ShiftwithStaff__c shiftList = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        
        Test.startTest();
        SignInController.updateSignInTime('09:30', shiftList.Id, true);
        Test.stopTest();
    }
    
    @isTest
    public static void testUpdateSignInTime_FromMobile() {
        ShiftwithStaff__c shiftList = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        
        Test.startTest();
        SignInController.updateSignInTime('10:45', shiftList.Id, false);
        Test.stopTest();
    }
    
    // =====================================================
    // updateSignoutTime
    // =====================================================
    @isTest
    public static void signOutMethod(){ 
        Staff__c StaffList = [select id,Email_Address__c from Staff__c limit 1];
        string logouttime='18:15';
        date datevalue = date.newInstance(2023, 12, 13);
        time timeChange = Time.newInstance(16, 15, 00, 00);
        time LoginTime = Time.newInstance(16, 15, 00, 00);
        string shiftNotes = 'Test notess';          
        
        ShiftwithStaff__c shift = [select id from ShiftwithStaff__c limit 1];
        string shiftId = shift.id;
        User u = [SELECT Id from User where email='manualtesting.205278@hotmail.com' LIMIT 1];
        
        System.runAs(u) {
            test.startTest();
            SignInController.updateSignoutTime(
                logouttime, shiftId, shiftNotes, false, 
                3.00, 'TestnightShiftHourComments', 'TestextendedComments'
            );
            test.StopTest();
        }  
    }
    
    @isTest
    public static void testUpdateSignoutTime_FromWeb() {
        ShiftwithStaff__c shift = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        User u = [SELECT Id FROM User WHERE email='manualtesting.205278@hotmail.com' LIMIT 1];
        
        System.runAs(u) {
            Test.startTest();
            SignInController.updateSignoutTime(
                '17:30', shift.Id, 'Web signout notes', true,
                null, null, null
            );
            Test.stopTest();
        }
    }
    
    // =====================================================
    // craeteReimbursement - various branches
    // =====================================================
    @isTest
    public static void createReimbursement(){  
        Add_Shift__c shiftlist = [select id,createdbyid from Add_Shift__c limit 1];
        ShiftwithStaff__c shiftStaffList = [select id,Add_Shift__r.createdbyid from ShiftwithStaff__c limit 1];
        
        Reimbursement__c rei = new Reimbursement__c();
        rei.ShiftwithStaff__c = shiftStaffList.id;
        rei.Comments__c = ' test comments';
        rei.Approval_Status__c = 'Pending';
        rei.Approval_user__c = shiftStaffList.Add_Shift__r.createdbyid;
        insert rei;
        
        String breakInTime = '10:30';
        Date breakStartDate = Date.today();
        String breakInTime1 = '08:30';
        Id breakId = SignInController.createBreakTimeRecord(shiftStaffList.Id, breakInTime1, Date.today());        
        
        Break_Timings__c breakRec = [SELECT Id, isBreakIncluded__c FROM Break_Timings__c WHERE Id = :breakId];
        breakRec.isBreakIncluded__c = true;
        List<Break_Timings__c> breakList = new List<Break_Timings__c>{ breakRec };
        
        User u = [SELECT Id,Type_of_User__c from User where email='manualtesting.205278@hotmail.com' LIMIT 1];
        
        System.runAs(u) {
            test.startTest();
            
            // Branch 1: Provider Travel, insert
            SignInController.craeteReimbursement(
                String.valueOf(shiftStaffList.id), 16.12, '10', 'test comments', 
                false, null, 'Fuel', 'Provider Travel', '10:00', '11:00', 
                null, null, null, null, 18.00, 15.00, TRUE
            );

            // Branch 2: Activity Transport, update
            SignInController.craeteReimbursement(
                String.valueOf(shiftStaffList.id), 16, '10', 'test comments', 
                true, rei.Id, 'Fuel', 'Activity Transport', null, null, 
                'Car', null, 'Bike', null, 30.00, 25.00, TRUE
            );

            // Branch 3: Other Expenses, update
            SignInController.craeteReimbursement(
                String.valueOf(shiftStaffList.id), 16, '10', 'test comments', 
                true, rei.Id, 'Electric', 'Transport Expense', null, null, 
                null, null, null, '{"expense":"test"}', 25.00, 36.00, TRUE
            );
            
            SignInController.requestSignIn(shiftStaffList.Id);
            Map<String, Object> result = SignInController.requestSignOut(shiftStaffList.Id);
            SignInController.updateSelectedBreakCheckboxes(shiftStaffList.Id, breakList);
            List<ShiftwithStaff__c> result1 = SignInController.getShiftDetailsById(shiftStaffList.Id);
            
            String breakOutTime = '11:00';
            Date breakEndDate = Date.today();
            String result2 = SignInController.updateBreakTimeRecord(breakId, breakOutTime, breakEndDate);
            
            // Rest context - break-in
            String body = JSON.serialize(new Map<String, Object>{
                'shiftId' => shiftStaffList.id,
                'breakId' => null,
                'breakInTime' => '10:30',
                'breakStartDate' => Date.today(),
                'breakOutTime' => null,
                'breakEndDate' => null
            });
            setRestContext(body);
            MobileAppBreakInBreakOutHandler.saveBreakInbreakOut();
            
            // Rest context - break-out
            String body2 = JSON.serialize(new Map<String, Object>{
                'shiftId' => shiftStaffList.id,
                'breakId' => breakId,
                'breakInTime' => null,
                'breakStartDate' => null,
                'breakOutTime' => '11:45',
                'breakEndDate' => Date.today()
            });
            setRestContext(body2);
            MobileAppBreakInBreakOutHandler.saveBreakInbreakOut();
            
            test.StopTest();    
        }        
    }
    
    // Non-Org-Admin path (regular staff creating reimbursement)
    @isTest
    public static void testCreateReimbursement_NonOrgAdmin() {
        ShiftwithStaff__c shiftStaffList = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        User u = [SELECT Id FROM User WHERE email='manualtesting.205278@hotmail.com' LIMIT 1];
        
        System.runAs(u) {
            Test.startTest();
            SignInController.craeteReimbursement(
                String.valueOf(shiftStaffList.id), 20.00, '5', 'non admin', 
                false, null, 'Fuel', 'Provider Travel', '09:00', '10:00', 
                null, null, null, null, 10.00, 20.00, false
            );
            Test.stopTest();
        }
    }
    
    // Activity Transport + Public mode
    @isTest
    public static void testCreateReimbursement_ActivityPublic() {
        ShiftwithStaff__c shiftStaffList = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        User u = [SELECT Id FROM User WHERE email='manualtesting.205278@hotmail.com' LIMIT 1];
        
        System.runAs(u) {
            Test.startTest();
            SignInController.craeteReimbursement(
                String.valueOf(shiftStaffList.id), 15.00, '8', 'public transport', 
                false, null, 'Electric', 'Activity Transport', null, null, 
                'Public', null, 'Bike', null, 5.00, 15.00, false
            );
            Test.stopTest();
        }
    }
    
    // Other Expenses
    @isTest
    public static void testCreateReimbursement_OtherExpenses() {
        ShiftwithStaff__c shiftStaffList = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        User u = [SELECT Id FROM User WHERE email='manualtesting.205278@hotmail.com' LIMIT 1];
        
        System.runAs(u) {
            Test.startTest();
            SignInController.craeteReimbursement(
                String.valueOf(shiftStaffList.id), 12.00, '3', 'other expense', 
                false, null, 'Fuel', 'Other Expenses', null, null, 
                null, null, null, '{"items":[{"name":"Parking","amount":12}]}', 
                0, 0, false
            );
            Test.stopTest();
        }
    }
    
    // =====================================================
    // requestSignIn / requestSignOut
    // =====================================================
    @isTest
    public static void testRequestSignIn() {
        ShiftwithStaff__c shiftStaffList = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        User u = [SELECT Id FROM User WHERE email='manualtesting.205278@hotmail.com' LIMIT 1];
        
        System.runAs(u) {
            Test.startTest();
            SignInController.requestSignIn(shiftStaffList.Id);
            Test.stopTest();
        }
    }
    
    @isTest
    public static void testRequestSignIn_BlankId() {
        Test.startTest();
        SignInController.requestSignIn('');
        Test.stopTest();
    }
    
    @isTest
    public static void testRequestSignOut() {
        ShiftwithStaff__c shiftStaffList = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        User u = [SELECT Id FROM User WHERE email='manualtesting.205278@hotmail.com' LIMIT 1];
        
        System.runAs(u) {
            Test.startTest();
            SignInController.requestSignOut(shiftStaffList.Id);
            Test.stopTest();
        }
    }
    
    @isTest
    public static void testRequestSignOut_BlankId() {
        Test.startTest();
        SignInController.requestSignOut('');
        Test.stopTest();
    }
    
    // =====================================================
    // Break Timings
    // =====================================================
    @isTest
    public static void testCreateBreakTimeRecord() {
        ShiftwithStaff__c shiftStaffList = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        
        Test.startTest();
        Id breakId = SignInController.createBreakTimeRecord(shiftStaffList.Id, '10:30', Date.today());
        Test.stopTest();
    }
    
    @isTest
    public static void testUpdateBreakTimeRecord() {
        ShiftwithStaff__c shiftStaffList = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        
        Test.startTest();
        Id breakId = SignInController.createBreakTimeRecord(shiftStaffList.Id, '10:30', Date.today());
        SignInController.updateBreakTimeRecord(breakId, '11:30', Date.today());
        Test.stopTest();
    }
    
    @isTest
    public static void testUpdateSelectedBreakCheckboxes() {
        ShiftwithStaff__c shiftStaffList = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        
        Test.startTest();
        Id breakId = SignInController.createBreakTimeRecord(shiftStaffList.Id, '10:00', Date.today());
        
        Break_Timings__c breakRec = [SELECT Id, isBreakIncluded__c FROM Break_Timings__c WHERE Id = :breakId];
        breakRec.isBreakIncluded__c = true;
        List<Break_Timings__c> breakList = new List<Break_Timings__c>{ breakRec };
        
        SignInController.updateSelectedBreakCheckboxes(shiftStaffList.Id, breakList);
        Test.stopTest();
    }
    
    @isTest
    public static void testUpdateSelectedBreakCheckboxes_Empty() {
        ShiftwithStaff__c shiftStaffList = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        
        Test.startTest();
        SignInController.updateSelectedBreakCheckboxes(shiftStaffList.Id, new List<Break_Timings__c>());
        Test.stopTest();
    }
    
    // =====================================================
    // getShiftDetailsById
    // =====================================================
    @isTest
    public static void testGetShiftDetailsById() {
        ShiftwithStaff__c shiftStaffList = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        
        Test.startTest();
        SignInController.getShiftDetailsById(shiftStaffList.Id);
        Test.stopTest();
    }
    
    // =====================================================
    // createReimbursementAndApprove
    // =====================================================
    @isTest
    public static void testCreateReimbursementAndApprove() {
        ShiftwithStaff__c shiftStaffList = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        User u = [SELECT Id FROM User WHERE email='manualtesting.205278@hotmail.com' LIMIT 1];
        
        System.runAs(u) {
            Test.startTest();
            SignInController.createReimbursementAndApprove(
                shiftStaffList.Id, 20.00, '10', 'approve comments',
                false, null, 'Fuel', 'Provider Travel', '09:00', '10:00',
                null, null, null, null, 10.00, 20.00, 'Approved by admin', null
            );
            Test.stopTest();
        }
    }
    
   

    
  
    // =====================================================
    // REST helper
    // =====================================================
    public static void setRestContext(String body) {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestUri = '/services/apexrest/breakInBreakOutApi/';
        req.httpMethod = 'POST';
        req.requestBody = Blob.valueOf(body);
        RestContext.request = req;
        RestContext.response = res;
    }
    
    // =====================================================
    // MobileAppBreakInBreakOutHandler tests
    // =====================================================
    @isTest
    static void testHandleEmptyBodyDirectly() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestUri = '/services/apexrest/breakInBreakOutApi/';
        req.httpMethod = 'POST';
        req.requestBody = Blob.valueOf('');
        RestContext.request = req;
        RestContext.response = res;
        
        Test.startTest();
        MobileAppBreakInBreakOutHandler.saveBreakInbreakOut();
        Test.stopTest();
    } 
    
    @isTest
    static void testHandleEmptyBodyDirectlyGetMethod() {
        ShiftwithStaff__c shiftStaffList = [select id from ShiftwithStaff__c limit 1];
        
        RestRequest req = new RestRequest();
        req.requestURI = '/services/apexrest/breakInBreakOutApi/';
        req.httpMethod = 'GET';
        req.params.put('shiftWithStaffId', shiftStaffList.ID);
        
        RestContext.request = req;
        RestContext.response = new RestResponse();
        
        MobileAppBreakInBreakOutHandler.getBreakInBreakOut();
    }
    
    @isTest
    static void testSaveBreakInbreakOut_ValidBody() {
        ShiftwithStaff__c shiftStaffList = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        
        String body = JSON.serialize(new Map<String, Object>{
            'shiftId' => shiftStaffList.Id,
            'breakId' => null,
            'breakInTime' => '10:00',
            'breakStartDate' => Date.today(),
            'breakOutTime' => null,
            'breakEndDate' => null
        });
        setRestContext(body);
        
        Test.startTest();
        MobileAppBreakInBreakOutHandler.saveBreakInbreakOut();
        Test.stopTest();
    }
    
    @isTest
    static void testGetBreakInBreakOut_ValidShift() {
        ShiftwithStaff__c shiftStaffList = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        
        RestRequest req = new RestRequest();
        req.requestURI = '/services/apexrest/breakInBreakOutApi/';
        req.httpMethod = 'GET';
        req.params.put('shiftWithStaffId', shiftStaffList.Id);
        
        RestContext.request = req;
        RestContext.response = new RestResponse();
        
        Test.startTest();
        MobileAppBreakInBreakOutHandler.getBreakInBreakOut();
        Test.stopTest();
    }
    
    @isTest
    static void testFormatTime() {
        Test.startTest();
        MobileAppBreakInBreakOutHandler.formatTime(Time.newInstance(9, 30, 0, 0));
        MobileAppBreakInBreakOutHandler.formatTime(Time.newInstance(14, 45, 0, 0));
        MobileAppBreakInBreakOutHandler.formatTime(Time.newInstance(0, 0, 0, 0));
        MobileAppBreakInBreakOutHandler.formatTime(Time.newInstance(12, 0, 0, 0));
        MobileAppBreakInBreakOutHandler.formatTime(Time.newInstance(10, 5, 0, 0));
        MobileAppBreakInBreakOutHandler.formatTime(Time.newInstance(6, 15, 0, 0));
        MobileAppBreakInBreakOutHandler.formatTime(Time.newInstance(20, 30, 0, 0));
        MobileAppBreakInBreakOutHandler.formatTime(Time.newInstance(15, 0, 0, 0));
        MobileAppBreakInBreakOutHandler.formatTime(Time.newInstance(5, 45, 0, 0));
        MobileAppBreakInBreakOutHandler.formatTime(Time.newInstance(23, 59, 0, 0));
        Test.stopTest();
    }
}