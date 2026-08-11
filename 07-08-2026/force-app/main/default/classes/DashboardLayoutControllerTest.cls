@isTest
private class DashboardLayoutControllerTest {
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
        User user = new User(Alias = 'praveen', Email= 'manualtesting.20294637@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne209463', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.20294637@hotmail.com',Organization_Name__c ='Ashfield Consultants');
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
            fac.ABN__c='12234567';
            fac.Phone__c = '12323432';
            fac.ABN__c='12234567';
            fac.Phone__c = '12323432';
            insert fac;
            
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff'; 
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.20294637@hotmail.com';
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
            staff.Dashboard_Layout__c = '[{"id":"widget1","type":"chart","style":"width:100%","visible":true}]';
            insert staff;
            
            // Step 2: Define a valid layout JSON
            String newLayout = '[{"id":"widget2","type":"table","style":"width:50%","visible":true}]';
        
            // Step 3: Save layout via Apex method
            Test.startTest();
            DashboardLayoutController.saveLayout(staff.Id, newLayout);
            DashboardLayoutController.addWidgetToLayout(staff.Id,'widget1','chart','width:100%');
            DashboardLayoutController.deleteWidgetFromLayout(staff.Id, 'widget1');
            DashboardLayoutController.addWidgetToLayout(
            	staff.Id,
            	'widget1',  // Already exists in testSetup
            	'chart',
            	'width:100%'
        	);
            DashboardLayoutController.getAllFacilities();
            Test.stopTest();
        
            // Step 4: Assert layout was saved
            Staff__c updatedStaff = [SELECT Dashboard_Layout__c FROM Staff__c WHERE Id = :staff.Id];
            System.debug('Updated layout: ' + updatedStaff.Dashboard_Layout__c);
            System.assert(updatedStaff.Dashboard_Layout__c != null, 'Layout JSON should be saved');
            System.assert(updatedStaff.Dashboard_Layout__c.contains('widget2'), 'Layout should contain widget2');
        }
    }

    @isTest
    static void testGetLayout() {
        Staff__c staff = [SELECT Id,Dashboard_Layout__c FROM Staff__c LIMIT 1];
        Test.startTest();
        String layout = DashboardLayoutController.getLayout(staff.Id);
        Test.stopTest();
       // System.assertNotEquals(null, layout, 'Layout should not be null');
    }
}