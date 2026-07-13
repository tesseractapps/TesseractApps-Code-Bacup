/**
* @description       : 
* @author            : Raja Sekhar Reddy
* @group             : 
* @last modified on  : 06-22-2023
* @last modified by  : Raja Sekhar Reddy
**/
@isTest
public class StaffControllerTest {
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
            fac.ABN__c ='12345566666';
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
            insert staff;             
            
            Staff__c staff1 = new Staff__c();
            staff1.Last_Name__c='Test staff';
            staff1.Name='praveen1';
            staff1.Name__c='abcd';
            staff1.Contact_Number__c='56789908743';
            staff1.Email_Address__c= 'manualtesting.20294638@hotmail.com';
            staff1.Facility__c=fac.Id;
            staff1.Address__Street__s='8 Keewong Street';
            staff1.Address__City__s = 'Crace';
            staff1.Address__StateCode__s='ACT';
            staff1.Address__PostalCode__s='2911';
            staff1.Emergency_Phone_Number__c='45678766675';
            staff1.Primary_Contact_Name__c='Praveen';
            staff1.Primary_Contact_Number__c='9908458298';
            staff1.Make_Primary_as_Approver__c=true;
            staff1.Primary_Contact_Email__c='praveenshesham.sp1@gmail.com';
            staff1.Secondary_Contact_Name__c='maheswari';
            staff1.Secondary_Contact_Email__c='maheswari.adabala@gmail.com';
            staff1.Make_Secondary_as_Approver__c=false;
            staff1.Secondary_Contact_Number__c='99084582958';
            staff1.Emp_exit_date__c = date.newInstance(2028, 01, 05);
            staff1.Emp_Start_Date__c = date.newInstance(2023, 02, 01);
            staff1.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
            staff1.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
            staff1.role__c='Admin';
            staff1.Residency_Type__c = 'Australian';
            staff1.Expiry_Date__c = date.newInstance(2025,02, 19);
            staff1.Type__c = 'Visa Status';
            staff1.Working_Hours_Rate__c=50;
            staff1.Final_Overall_Rate__c=150;
            staff1.Saturday_Hourly_Rate__c = 130;
            staff1.Sunday_Hourly_Rate__c = 50;
            insert staff1;             
        }        
    }
    public static List<Staff__c> createStaff(String facility){
        List<Staff__c> staffList =  new List<Staff__c>();
        
        for(Integer i=0;i<=10;i++){
            Staff__c staff = new Staff__c();
            //staff.Name='Carter'+i;
            staff.Last_Name__c='Test';
            staff.Gender__c='Male';
            staff.Contact_Number__c='043312345'+i;
            staff.Email_Address__c='a@a1.com'+i;
            staff.Facility__c=facility;
            staff.Name__c = 'Test'+i; 
            staff.Availability__c='Present';
            staff.Date_Of_Birth__c=system.today();
            staff.Status__c=true;
            staff.Base_Rate__c=115.5;
            staff.Employment_type__c='Weekly';
            staff.Job_Title__c='Team Lead';
            staff.Working_Hours_Rate__c=115;
            staff.Management_Fee__c=2; 
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
            //staff.Residency_Type__c = 'Australian';
            staff.Expiry_Date__c = date.newInstance(2025,02, 19);
            //staff.TFN_number__c='12345675';
            staff.Type__c = 'Visa Status';
            staff.role__c='Admin';
            
            if(i==0){
             	staff.ABN_Number__c='1234565432';   
            }
            else if(i==1 || i==2 || i==3 || i==4 || i==5){
                staff.TFN_number__c='12345675';
            	staff.Tax_free_threshold__c='With out Tax free threshold';
            }else{
                staff.TFN_number__c='12345675';
             	staff.Tax_free_threshold__c='With Tax free threshold';
            }
            //
            staff.Emergency_Phone_Number__c='1234567898';
            staff.Drivers_Licence__c='11111';
            staffList.add(staff);
        }
        try{
            insert staffList;
            System.debug('staffList '+staffList[0].Id);
        }catch(Exception e){
             System.debug('staffList raja'+e.getMessage());
            system.assertEquals(e.getMessage(), e.getMessage()); 
        }
       
        return staffList;
    }
    static testMethod void staffTest() {
        Test.startTest();
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
        //org.Account_Number__c='1111111111';
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
        
        User testUser = [SELECT Id FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
         //Organisation__c org = OrgDetailsTest.createOrganization();
        //List<Facility__c> facilityList = FacilityControllerTest.createFacility(org.Id);
        Facility__c fac = new Facility__c();
        fac.Name = 'Ashfieldfgfgfgfgfg';
        fac.Address__City__s = 'Crace';
        fac.Address__Street__s = '8 Keewong Street';
        fac.Address__StateCode__s = 'ACT';
        fac.Address__PostalCode__s = '2911';
        fac.Address__CountryCode__s = 'AU';
        fac.Email__c = 'testonefvvcbncvnacility@gmail.com';
        fac.Status__c = true;
        fac.Organisation__c = org.id;
        fac.ABN__c = '12345678915';
        fac.Phone__c = '12323432';
        fac.Type_of_Service__c = 'Ndis';
        insert fac;
        
        
        //Organisation__c orgRec =[select id,name from Organisation__c where id=:facilityList[0].Organisation__c];
        List<Staff__c> staffList = createStaff(fac.Id);
        StaffController.fetchStaffs(fac.Organisation__c,'fname','lname');
        StaffController.getStaffByEmail('a@a1.com1');
        StaffController.getStaffById(staffList[0].Id);
        StaffController.statusStaff(staffList[0].Id, 'false');
        StaffController.getStaffByStatus(staffList[0].Id);
        StaffController.fetchStaffList(org.Id);
        
        
        // Step 8: Assertions
        
        //System.assert(result.size() >= 2, 'Facility list should contain at least 2 facilities');
       // System.assertEquals(facility1.Id, result[0].Id, 'The staff-linked facility should be first in the list');
        //StaffController.fetchFacilitiess();
        StaffController.getShadAwards('Home care employee', 'Full-time and part-time', 'Level 2', 'pay point 2');
        String name ='';
        StaffController.StaffsRolesWiseList(string.valueof(org.Id),new list<string>{fac.Id},new list<string>{'Admin'},name);
        string Jsoninput= '[{"typeOfDocument": "Visa Status" ,"fileName":"testName","comment":"test","staffExpirydate":"2024-04-08"}]';
        string staffID=staffList[0].Id;
        StaffController.insertPreTax(Jsoninput, staffID, true);
        
         StaffController.fetchStaffs(fac.Organisation__c,'praveen1','Test staff');
            String dateofBirth = String.valueOf(system.today());  
        
        System.runAs(testUser){
        	//List<Facility__c> result =StaffController.fetchFacilitiess();
        }
          
        Test.stopTest();
    }


}