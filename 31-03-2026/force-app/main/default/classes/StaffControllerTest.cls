/**
* @description       : 
* @author            : Raja Sekhar Reddy
* @group             : 
* @last modified on  : 06-22-2023
* @last modified by  : Raja Sekhar Reddy
**/
@isTest
public class StaffControllerTest {
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
        
         //Organisation__c org = OrgDetailsTest.createOrganization();
        List<Facility__c> facilityList = FacilityControllerTest.createFacility(org.Id);
        
        
        //Organisation__c orgRec =[select id,name from Organisation__c where id=:facilityList[0].Organisation__c];
        List<Staff__c> staffList = createStaff(facilityList[0].Id);
        StaffController.fetchStaffs(facilityList[0].Organisation__c,'fname','lname');
        StaffController.getStaffByEmail('a@a1.com1');
        StaffController.getStaffById(staffList[0].Id);
        StaffController.statusStaff(staffList[0].Id, 'false');
       // StaffController.fetchStaff(string.valueof(staffList[0].Id));
        StaffController.fetchStaffList(org.Id);
        String name ='';
        StaffController.StaffsRolesWiseList(string.valueof(org.Id),new list<string>{facilityList[0].Id},new list<string>{'Admin'},name);
        string Jsoninput= '[{"typeOfDocument": "Visa Status" ,"fileName":"testName","comment":"test","staffExpirydate":"2024-04-08"}]';
        string staffID=staffList[0].Id;
        StaffController.insertPreTax(Jsoninput, staffID, true);
            String dateofBirth = String.valueOf(system.today());        
          
        Test.stopTest();
    }
    
}