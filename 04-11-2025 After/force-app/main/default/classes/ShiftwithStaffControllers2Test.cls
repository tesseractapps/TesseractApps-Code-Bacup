@isTest
public class ShiftwithStaffControllers2Test {
@TestSetup
    static void setupTestData() {
        Organisation__c org = new Organisation__c();
        org.Name='Age Grace Innovations';
        org.ABN__c='11234567891';
        org.ACN__c='878787878';
        org.Contact_No__c='6132899740';
        org.RCTI__c='RCTI1';
        org.Email__c='saieswar.k@tesseractapps.com';
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
        system.debug(org.name);
        
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'saieswar.k@tesseractapps.com', 
                             EmailEncodingKey='UTF-8', LastName='Test Friday4039572', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='saieswar.kyt@tesseractapps.com',Organization_Name__c ='Age Grace Innovations');
        insert user;
        
         System.runAs(user) {
            Facility__c fac = new Facility__c();
            fac.Name='Age Grace Facility';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Address__CountryCode__s='AU';
            fac.Email__c= 'saieswar.k@tesseractapps.com';
            fac.Status__c=true;
            fac.Organisation__c= org.Id;
             fac.ABN__c = '1234567890';
            insert fac;
        
            // Create Staff associated with the user's organization
            Staff__c staffRecord = new Staff__c(
                Name = 'Test Staff',
                Facility__c=fac.Id,
                Last_Name__c='Test staff',
                Contact_Number__c='56789908743',
                Email_Address__c = 'saieswar.k@tesseractapps.com', 
                Address__Street__s='8 Keewong Street',
                Address__City__s = 'Crace',
                Address__StateCode__s='ACT',
                Address__PostalCode__s='2911',
                Emergency_Phone_Number__c='45678766675',
                Primary_Contact_Name__c='Praveen',
                Primary_Contact_Number__c='9908458298',
                Make_Primary_as_Approver__c=true,
                Primary_Contact_Email__c='praveenshesham.sps@gmail.com',
                Secondary_Contact_Name__c='maheswari',
                Secondary_Contact_Email__c='maheswari.adabalap@gmail.com',
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
                Working_Hours_Rate__c=50
            );
            insert staffRecord;
            
             Add_Shift__c shift = new Add_Shift__c();
            shift.Break__c = '30';
            shift.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift.Start_Date__c =Date.newInstance(2025, 05, 16);  
            //shift.Role__c='Admin';
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
            insert shift;
    
            // Create ShiftwithStaff records for the past 7 days
            for (Integer i = 1; i <= 7; i++) {
                ShiftwithStaff__c staffs = new ShiftwithStaff__c();
                staffs.Add_Shift__c=shift.Id;
                staffs.Attendence__c=true;
                staffs.Comments__c = 'test comments';
                staffs.Staff__c=staffRecord.Id;
                //staffs.Role__c='Admin';
                staffs.Status__c='Accepted';
                staffs.Log_In_Date_Time__c = Time.newInstance( 5, 30, 00, 00);
                staffs.Log_Out_Date_Time__c = Time.newInstance( 7, 00, 00, 00);
                insert staffs;
			}
         }
    }

    @isTest
    static void testGetShiftData() {
        // Fetch test user ID
        User testUser = [SELECT Id FROM User WHERE Email = 'saieswar.k@tesseractapps.com' LIMIT 1];
        
        // Test data setup
        Date testDate = Date.today();
        Double totalDuration = 8.5;
        Double actualDuration = 7.0;
        String status = 'Completed';
        Date day = Date.today();
        Integer recordCount = 10;
        
        Test.startTest();
        List<ShiftwithStaffControllers2.ShiftWrapper> shiftData1 = ShiftwithStaffControllers2.getStaffWeekData();
         ShiftwithStaffControllers2.ShiftWrapper shiftWrapper = new ShiftwithStaffControllers2.ShiftWrapper(testDate, totalDuration, actualDuration, status);
         ShiftwithStaffControllers2.ShiftWrapper shiftWrapper1 = new ShiftwithStaffControllers2.ShiftWrapper(Date.today(), Double.valueOf(8.0), Double.valueOf(7.0), 'Completed');
        Test.stopTest();        
    }
}