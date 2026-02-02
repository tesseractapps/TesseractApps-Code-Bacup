@isTest
public class SubmissionsControllerTest {
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
        org.User_Type__c = 'Facility Admin';
        insert org;
        system.debug(org.name);
        system.debug(org.name);
         Account acc = new Account ();
        acc.name='Portal Account';
        insert acc;
        
        // UserRole ur = new UserRole(Name = 'NDIS Org Admin');
        //insert ur;
        
        contact cc = new contact();      
        cc.FirstName='Test ';
        cc.LastName='monday223';
        cc.Email='manualtesting.20234442453@hotmail.com';
        cc.AccountId=acc.id;
        insert cc;
        
        Id profileId = [Select Id,Name From Profile Where Name LIKE '%Admin%'].Id;
      	UserRole role = [Select Id,Name From UserRole Where Name LIKE '%Partner%'  LIMIT 1];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.20234442453@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='Test nagendra1', LanguageLocaleKey='en_US',  User_Type__c='Facility Admin', 
                             LocaleSidKey='en_US', ProfileId = profileId, TimeZoneSidKey='America/New_York', UserName='manualtesting.20234442453@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        
        insert user;
        System.runAs(user) {
            Facility__c fac = new Facility__c();
            fac.Name='test facilty';
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
            staff.Name= 'Test Staff';
            staff.Last_Name__c='Test';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c='manualtesting.20234442453@hotmail.com';
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
            staff.Residency_Type__c = 'Australian';
            staff.Expiry_Date__c = date.newInstance(2025,02, 19);
            staff.Type__c = 'Visa Status';
            staff.Working_Hours_Rate__c=50;
            insert staff; 
            
 		Add_Shift__c shift = new Add_Shift__c();
            shift.Break__c = '30';
            shift.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift.Start_Date__c =Date.newInstance(2023, 12, 13);        
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
            
            ShiftwithStaff__c shiftWithStaff= new ShiftwithStaff__c();
            shiftWithStaff.Staff__c=staff.id;
            shiftWithStaff.Add_Shift__c=shift.id;
            shiftWithStaff.Attendence__c=True;
            insert shiftWithStaff;
            
            Add_Shift__c shiftlist=[select id,createdbyid from Add_Shift__c limit 1];
            ShiftwithStaff__c shiftStaffList= [select id,Add_Shift__r.createdbyid from ShiftwithStaff__c limit 1];
            
            Reimbursement__c reim = new Reimbursement__c();
            reim.Amazon_file_URL__c = 'https://google.com';
            reim.Mileage__c = '16';
            reim.Others__c = 'Test Comments';
            reim.Comments__c = 'test description';
            reim.Approval_Status__c = 'Rejected';
            reim.ShiftwithStaff__c=shiftWithStaff.id;
            reim.Approver_Comments__c = 'Please attach the screenshots';
            reim.Approval_user__c = shiftStaffList.Add_Shift__r.createdbyid;
            reim.Type_of_Vehicle__c = 'Fuel';
            insert reim;
        }
    }
    
    @isTest
    public static void testSubmission(){ 
        User u1= [SELECT Id from User where email='manualtesting.20234442453@hotmail.com' LIMIT 1];
        System.runAs(u1){
             Reimbursement__c reims = [SELECT Id,Name From Reimbursement__c limit 1];
         
            ShiftwithStaff__c shiftStaffList= [select id,Add_Shift__r.createdbyid from ShiftwithStaff__c where Add_Shift__r.createdbyid=:u1.id limit 1];
            string dateValue='2023-12-13';
            string dateValue1='2023-12-18';
            List<Reimbursement__c> rei= SubmissionsController.PendingReimbursementsForMobile(dateValue);
            List<Reimbursement__c> PendingReimbursements= SubmissionsController.PendingReimbursements(dateValue, dateValue1, 'All');
           // List<Reimbursement__c> rei1=SubmissionsController.getAllReimbursementsForMobile(dateValue);
           // List<Reimbursement__c> getAllReimbursements = SubmissionsController.getAllReimbursements(dateValue, dateValue1, 'Pending');
            List<Reimbursement__c> rei2=SubmissionsController.getShiftReimbursements(shiftStaffList.id);
            List<ShiftwithStaff__c> PendingShifts1 = SubmissionsController.PendingShifts1(dateValue, dateValue1);
            
            RestRequest req2 = new RestRequest();
            RestResponse res2 = new RestResponse();
            req2.requestUri = '/services/apexrest/rejectedReimbursementsList/';
            req2.addParameter('startDate','2023-12-13');
            RestContext.request = req2;
            list<MobileReimbursementsApproval.reimbursementWrapper> rejectedList=MobileRejectedReimbursementsApi.getAllAprrovals();  
            
            RestRequest req3 = new RestRequest();
            RestResponse res3 = new RestResponse();
            req3.requestUri = '/services/apexrest/rejectedReimbursementsList/';
            req3.addParameter('startDate','2023-12-13');
            RestContext.request = req3;
         //  list<MobileReimbursementsApproval.reimbursementWrapper> getAllApprovals=MobileReimbursementsApproval.getAllAprrovals();
            
            String requestBody = JSON.serialize(new Map<String, Object>{
                'status' => 'Approved',
                    'reimburseId' => reims.Id,
                    'comments' => 'Approved by manager'
                    });
            
            // Set up the RestRequest and RestResponse
            RestRequest req = new RestRequest();
            req.requestBody = Blob.valueOf(requestBody);
            RestContext.request = req;
            
            // Call the method
            String result = MobileReimbursementsApproval.updateReimbursements();
            
        }
    }
    
    @isTest
    static void test_getAllReimbursementsforMobile_AsAdmin() {
        User u1 = [SELECT Id FROM User WHERE Email = 'manualtesting.20234442453@hotmail.com' LIMIT 1];
        
        System.runAs(u1) {
            String startDate = '2023-12-13';
            List<Reimbursement__c> result = SubmissionsController.getAllReimbursementsforMobile(startDate);
            System.assertNotEquals(null, result, 'Result should not be null');
            System.assert(result.size() >= 0, 'Should return reimbursements or empty list');
        }
    }

    @isTest
    static void test_getAllReimbursements_AsAdmin_AllStatus() {
        User u1 = [SELECT Id FROM User WHERE Email = 'manualtesting.20234442453@hotmail.com' LIMIT 1];
        System.runAs(u1) {
            String startDate = '2023-12-13';
            String endDate = '2023-12-18';
            List<Reimbursement__c> result = SubmissionsController.getAllReimbursements(startDate, endDate, 'All');
        }
    }

    @isTest
    static void test_getAllReimbursements_AsAdmin_FilteredStatus() {
        User u1 = [SELECT Id FROM User WHERE Email = 'manualtesting.20234442453@hotmail.com' LIMIT 1];
        System.runAs(u1) {
            String Year = '2024';
        String Month = '10';
        String Day = '16';
        String start_date = Year + '-' + Month + '-' + Day;  
        
        String Year1 = '2024';
        String Month1 = '10';
        String Day1 = '16';
        String end_date = Year1 + '-' + Month1 + '-' + Day1; 
            List<Reimbursement__c> result = SubmissionsController.getAllReimbursements(start_date, end_date, 'Rejected');
         
        }
    }

  /*  @isTest
    static void test_getAllReimbursements_NoFacilities_NonAdmin() {
        // Create a non-admin user with no facility associations
        Profile p = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        UserRole r = [SELECT Id FROM UserRole WHERE Name LIKE '%Executive%' LIMIT 1];

        User user = new User(
            Alias = 'no_faci',
            Email = 'nonadmin@example.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'NoFacility',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = p.Id,
            UserRoleId = r.Id,
            User_Type__c = 'NDIS Org Admin', // Non-admin
            UserName = 'manualtesting.202453@hotmail.com',
            TimeZoneSidKey = 'America/New_York',
            Organization_Name__c = 'Ashfield Consultants'
        );
        insert user;

        System.runAs(user) {
            String startDate = '2023-12-13';
            String endDate = '2023-12-18';
            List<Reimbursement__c> result = SubmissionsController.getAllReimbursements(startDate, endDate, 'All');
        }
    }*/
    
}