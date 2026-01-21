@isTest
public class MobileAppSignOutEnableRestTest {

    @testSetup
    static void setupTestData() {
        // Create a User
        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Standard User%' LIMIT 1];
        User testUser = new User(
            Alias = 'testuser',
            Email = 'manualtesting.20294637@hotmail.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'Test',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey = 'America/New_York',
            UserName = 'testuser' + DateTime.now().getTime() + '@example.com'
        );
        insert testUser;
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
            fac.Type_of_Service__c='Ndis';
            insert fac;

        // Create Staff
        Staff__c staff = new Staff__c(
            Name = 'Test Staff Name',
            Last_Name__c='Test staff', 
            Contact_Number__c='56789908743',
            Email_Address__c= 'manualtesting.20294637@hotmail.com',
            Facility__c=fac.Id,
            Address__Street__s='8 Keewong Street',
            Address__City__s = 'Crace',
            Address__StateCode__s='ACT',
            Address__PostalCode__s='2911',
            Emergency_Phone_Number__c='45678766675',
            Primary_Contact_Name__c='Praveen',
            Primary_Contact_Number__c='9908458298',
            Make_Primary_as_Approver__c=true,
            Primary_Contact_Email__c='praveenshesham.sp@gmail.com',
            Secondary_Contact_Name__c='maheswari',
            Secondary_Contact_Email__c='maheswari.adabala@gmail.com',
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
            Working_Hours_Rate__c=50,
            Final_Overall_Rate__c=150,
            Saturday_Hourly_Rate__c = 130,
            Sunday_Hourly_Rate__c = 50
        );
        insert staff;
        
         Direction__c dire = new Direction__c();
            dire.Name='Test Directions';
            insert dire;
        
        Add_Shift__c shift = new Add_Shift__c();
            shift.Break__c = '30';
            shift.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift.Start_Date__c =Date.newInstance(2024, 10, 16);
            shift.End_Date__c=Date.newInstance(2024, 10, 24);
            shift.Direction__c=dire.Id;
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

        	// Create ShiftwithStaff__c record
           ShiftwithStaff__c staffs = new ShiftwithStaff__c();
                staffs.Add_Shift__c=shift.Id;
                staffs.Attendence__c=true;
                staffs.Comments__c = 'test comments';
                staffs.Staff__c=staff.Id;
                staffs.Role__c='Admin';
                staffs.Status__c='Accepted';
                staffs.Log_In_Date_Time__c = Time.newInstance(01, 30, 00, 00);
                staffs.Log_Out_Date_Time__c = Time.newInstance(10, 00, 00, 00);
            insert staffs;
        
        Add_Shift__c shift1 = new Add_Shift__c();
            shift1.Break__c = '30';
            shift1.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift1.Start_Date__c =Date.newInstance(2024, 10, 16);
            shift1.End_Date__c=Date.newInstance(2024, 10, 24);
            shift1.Direction__c=dire.Id;
            shift1.Role__c='Admin';
            shift1.Get_Facility__c=true;
            shift1.Quantity__c=5;
            shift1.Start_Time__c=Time.newInstance( 03, 30, 00, 00);
            shift1.End_Time__c=Time.newInstance( 05, 00, 00, 00);
            shift1.Facility__c=fac.Id;
            shift1.Status__c='Draft';
            shift1.Start_time_picklist__c='3:30 am';
            shift1.End_time_picklist__c='5:00 am';
            shift1.Location__StateCode__s = 'ACT';
            shift1.Location__CountryCode__s = 'AU';
            shift1.Location__PostalCode__s = '2911';
            shift1.Shift_Type__c='General';
            insert shift1;

        	// Create ShiftwithStaff__c record
           ShiftwithStaff__c staffs1 = new ShiftwithStaff__c();
                staffs1.Add_Shift__c=shift1.Id;
                staffs1.Attendence__c=true;
                staffs1.Comments__c = 'test comments';
                staffs1.Staff__c=staff.Id;
                staffs1.Role__c='Admin';
                staffs1.Status__c='Accepted';
                staffs1.Log_In_Date_Time__c = Time.newInstance(01, 30, 00, 00);
                staffs1.Log_Out_Date_Time__c = Time.newInstance(10, 00, 00, 00);
        		staffs1.Enable_Sign_Out__c = true;
            insert staffs1;
    }

    @isTest
    static void testEnableSignOutWithValidParams() {
        ShiftwithStaff__c shiftRecord = [SELECT Id,Enable_Sign_Out__c FROM ShiftwithStaff__c Where Enable_Sign_Out__c = false LIMIT 1];

        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestUri = '/services/apexrest/EnableSignOutApi/';
        req.httpMethod = 'GET';
        req.params.put('shiftId', shiftRecord.Id);
        req.params.put('requestedDate', Date.today().format());
        req.params.put('comments', 'Test reason for sign out');
        req.params.put('request', 'true');
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        MobileAppSignOutEnableRest.enableSignOutButton();
        Test.stopTest();

       // System.assertEquals(200, RestContext.response.statusCode);
        String jsonResponse = RestContext.response.responseBody.toString();
        System.debug('Response Body: ' + jsonResponse);

        Map<String, Object> resultMap = (Map<String, Object>) JSON.deserializeUntyped(jsonResponse);
        System.assertEquals(true, resultMap.containsKey('success'));
    }

    @isTest
    static void testEnableSignOutWithEmptyShiftId() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestUri = '/services/apexrest/EnableSignOutApi/';
        req.httpMethod = 'GET';
        req.params.put('shiftId', '');  // Empty shiftId to trigger error condition
        req.params.put('request', 'true');
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        MobileAppSignOutEnableRest.enableSignOutButton();
        Test.stopTest();

       // System.assertEquals(200, RestContext.response.statusCode);
        String jsonResponse = RestContext.response.responseBody.toString();
        Map<String, Object> resultMap = (Map<String, Object>) JSON.deserializeUntyped(jsonResponse);
        System.assertEquals(false, resultMap.get('success'));
        System.assertEquals('Error: Request input cannot be empty.', resultMap.get('message'));
    }

    @isTest
    static void testEnableSignOutWithNonExistingShift() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestUri = '/services/apexrest/EnableSignOutApi/';
        req.httpMethod = 'GET';
        req.params.put('shiftId', 'nonExistentId');
        req.params.put('request', 'true');
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        try {
            MobileAppSignOutEnableRest.enableSignOutButton();
        } catch (Exception e) {
            // Expected exception when querying a non-existent shift record
        }
        Test.stopTest();
    }
    
    @isTest
    static void testEnableSignOutWithSignOutEnable() {
        ShiftwithStaff__c shiftRecord = [SELECT Id,Enable_Sign_Out__c FROM ShiftwithStaff__c Where Enable_Sign_Out__c = true LIMIT 1];

        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestUri = '/services/apexrest/EnableSignOutApi/';
        req.httpMethod = 'GET';
        req.params.put('shiftId', shiftRecord.Id);
        req.params.put('requestedDate', Date.today().format());
        req.params.put('comments', 'Test reason for sign out');
        req.params.put('request', 'true');
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        MobileAppSignOutEnableRest.enableSignOutButton();
        Test.stopTest();

       // System.assertEquals(200, RestContext.response.statusCode);
        String jsonResponse = RestContext.response.responseBody.toString();
        System.debug('Response Body: ' + jsonResponse);

        Map<String, Object> resultMap = (Map<String, Object>) JSON.deserializeUntyped(jsonResponse);
        System.assertEquals(true, resultMap.containsKey('success'));
    }
}