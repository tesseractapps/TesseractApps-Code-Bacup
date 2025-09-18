@isTest
public class StaffUtilizationControllerTest {
    @testSetup
    static void setupTestData() {
        // Create Organisation
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
        User user = new User(Alias = 'praveen', Email= 'manualtesting.4139562@hotmail.com', User_Type__c = 'NDIS Org Admin',
                             EmailEncodingKey='UTF-8', LastName='Test Friday4039562', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.4139562@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        insert user;
        
        System.runAs(user) { 
            
            Facility__c fac = new Facility__c();
            fac.Name='Ashfield Facility';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Address__CountryCode__s='AU';
            fac.Email__c= 'testonefacility111@gmail.com';
            fac.Status__c=true;
            fac.Organisation__c= org.Id;
            fac.ABN__c='3673232323';
            fac.Phone__c = '123123123';
            insert fac;
            
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff';
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.4139562@hotmail.com';
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
            staff.Module_Names__c = 'Admin';
            insert staff; 
            
            Add_Shift__c shift1 = new Add_Shift__c();
            shift1.Break__c = '30';
            shift1.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift1.Start_Date__c =Date.newInstance(2024, 12, 16); 
            shift1.End_Date__c=Date.newInstance(2024, 10, 24);
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
            shift1.Shift_Type__c='Night';
            shift1.Start_Time_Text__c = '6:30 pm';
            shift1.End_Time_Text__c = '10:00 pm';
            shift1.Split_Shifts__c = true;
            insert shift1;
            
            ShiftwithStaff__c staffs = new ShiftwithStaff__c();
            staffs.Add_Shift__c=shift1.Id;
            staffs.Attendence__c=true;
            staffs.Comments__c = 'test comments';
            staffs.Staff__c=staff.Id;
            staffs.Role__c='Admin';
            staffs.Status__c='Accepted';
            insert staffs;
        }
    }
    
    static testMethod void testExportStaffData_AdminUser() {
        // Get the test user created in setup
        User testUser = [SELECT Id FROM User WHERE Email = 'manualtesting.4139562@hotmail.com' LIMIT 1];
        System.runAs(testUser) {
            Test.startTest();
            String csv = StaffUtilizationController.exportStaffData(
                null, // facility
                null, // role
                null, // employmentType
                String.valueOf(Date.today()),  // startWeekDate
                String.valueOf(Date.today().addDays(4)), // endWeekDate (5 weekdays)
                'All' // status
            );
            
            String csv1 = StaffUtilizationController.exportStaffData(
                null, // facility
                null, // role
                null, // employmentType
                String.valueOf(Date.today()),  // startWeekDate
                String.valueOf(Date.today().addDays(4)), // endWeekDate (5 weekdays)
                'Under Rostered' // status
            );
            
            String csv2 = StaffUtilizationController.exportStaffData(
                null, // facility
                null, // role
                null, // employmentType
                String.valueOf(Date.today()),  // startWeekDate
                String.valueOf(Date.today().addDays(4)), // endWeekDate (5 weekdays)
                'Over Rostered' // status
            );
            
            
            String csv3 = StaffUtilizationController.exportStaffData(
                null, // facility
                null, // role
                null, // employmentType
                String.valueOf(Date.today()),  // startWeekDate
                String.valueOf(Date.today().addDays(4)), // endWeekDate (5 weekdays)
                'Total Unallocated Hrs' // status
            );
            
            
            String csv4 = StaffUtilizationController.exportStaffData(
                null, // facility
                null, // role
                null, // employmentType
                String.valueOf(Date.today()),  // startWeekDate
                String.valueOf(Date.today().addDays(4)), // endWeekDate (5 weekdays)
                'Total Overtime Hrs' // status
            );
            
            String startDate = Date.today().toStartOfWeek().format();
            String endDate = Date.today().toStartOfWeek().addDays(6).format();
            
            StaffUtilizationController.StaffUtilizationResponse response =
                StaffUtilizationController.getStaffUtilizationData(
                    'All', 
                    'All', 
                    'All',
                    1, 
                    10,
                    String.valueOf(Date.today()), 
                    String.valueOf(Date.today().addDays(4)),
                    'All'
                );
            
            StaffUtilizationController.StaffUtilizationResponse response1 =
                StaffUtilizationController.getStaffUtilizationData(
                    'All', 
                    'All', 
                    'All',
                    1, 
                    10,
                    String.valueOf(Date.today()), 
                    String.valueOf(Date.today().addDays(4)),
                    'Under Rostered'
                );
            
            StaffUtilizationController.StaffUtilizationResponse response2 =
                StaffUtilizationController.getStaffUtilizationData(
                    'All', 
                    'All', 
                    'All',
                    1, 
                    10,
                    String.valueOf(Date.today()), 
                    String.valueOf(Date.today().addDays(4)),
                    'Over Rostered'
                );
            
            
            StaffUtilizationController.StaffUtilizationResponse response3 =
                StaffUtilizationController.getStaffUtilizationData(
                    'All', 
                    'All', 
                    'All',
                    1, 
                    10,
                    String.valueOf(Date.today()), 
                    String.valueOf(Date.today().addDays(4)),
                    'Total Unallocated Hrs'
                );
            
            
            StaffUtilizationController.StaffUtilizationResponse response4 =
                StaffUtilizationController.getStaffUtilizationData(
                    'All', 
                    'All', 
                    'All',
                    1, 
                    10,
                    String.valueOf(Date.today()), 
                    String.valueOf(Date.today().addDays(4)),
                    'Total Overtime Hrs'
                );
            Test.stopTest();
        }
    }
}