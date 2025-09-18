/**
 * @description       : 
 * @author            : Raja Sekhar Reddy
 * @group             : 
 * @last modified on  : 06-22-2023
 * @last modified by  : Raja Sekhar Reddy
**/
@isTest
public class AllocationCopyTest {
    @testsetup static void createAllocation(){
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
        User user = new User(Alias = 'praveen', Email= 'manualtesting.2027132@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='Test Friday12', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.2027132@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        
        insert user;
         System.runAs(user) { 
            Facility__c fac = new Facility__c();
            fac.Name='Pinnacle IT';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Email__c= 'testfacility@gmail.com';
             fac.ABN__c='1223456725';
             fac.Phone__c = '12323432';
            fac.Status__c=true;
            insert fac;
            
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c='manualtesting.2027132@hotmail.com';
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
            staff.Working_Hours_Rate__c = 150;
            insert staff; 
            
            Allocation__c alocRec=new Allocation__c();
            alocRec.End_Date__c=date.newInstance(2024, 01, 16);
            alocRec.Start_Date__c=date.newInstance(2024, 01, 16);
            alocRec.Start_time__c='8:30 pm';
            alocRec.Start_Date_Time__c=Time.newInstance(20, 30, 00, 00);
            alocRec.End_time__c='10:30 pm';
            alocRec.End_Date_Time__c=Time.newInstance(22, 30, 00, 00);
            alocRec.Working_Hours__c=2;
            alocRec.Staff__c=staff.id;
            alocRec.Status__c='Draft';
            insert alocRec; 
            
            Allocation__c alocRec1=new Allocation__c();
            alocRec1.End_Date__c=date.newInstance(2024, 01, 16);
            alocRec1.Start_Date__c=date.newInstance(2024, 01, 16);
            alocRec1.Start_time__c='4:30 pm';
            alocRec1.Start_Date_Time__c=Time.newInstance(16, 30, 00, 00);
            alocRec1.End_time__c='6:30 pm';
            alocRec1.End_Date_Time__c=Time.newInstance(18, 30, 00, 00);
            alocRec1.Working_Hours__c=2;
            alocRec1.Staff__c=staff.id;
            alocRec1.Status__c='Draft';
            insert alocRec1;
        
            List<Allocation__c> allocationList = new List<Allocation__c>();
            for(Integer i=0;i<=6;i++){
                Allocation__c allocRec = new Allocation__c();
                allocRec.Shift_Type__c='General Shift';
                allocRec.Staff__c = staff.Id;
                allocRec.Start_Date__c= system.today().addDays(-i);
                allocRec.End_Date__c=system.today().addDays(-i);
                allocRec.Working_Hours__c=8+i;
                allocRec.Start_time__c='4:30 pm';
                allocRec.Start_Date_Time__c=Time.newInstance(16, 30, 00, 00);
                allocRec.End_time__c='6:30 pm';
                allocRec.End_Date_Time__c=Time.newInstance(18, 30, 00, 00);
                allocRec.Status__c='Draft';
                allocationList.add(allocRec);              
                }
            for(Integer i=0;i<=6;i++){
                Allocation__c allocRec = new Allocation__c();
                allocRec.Shift_Type__c='General Shift';
                allocRec.Staff__c = staff.Id;
                allocRec.Start_time__c='4:30 pm';
                allocRec.End_Date__c=system.today().addDays(-i);
                allocRec.Start_Date_Time__c=Time.newInstance(16, 30, 00, 00);
                allocRec.End_time__c='6:30 pm';
                allocRec.End_Date_Time__c=Time.newInstance(18, 30, 00, 00);
                allocRec.Status__c='Draft';
                allocRec.Start_Date__c=system.today().addDays(-i);
                if(i==4){
                     allocRec.Working_Hours__c=0;
                }else{
                    allocRec.Working_Hours__c=8+i;
                }
                
                allocationList.add(allocRec);
            }
            try{
                insert allocationList;
            }catch(DMLException e){
                system.assertEquals(e.getMessage(), e.getMessage()); 
            } 
        }        
    }
    
    static testMethod void allocationTest() {
          User us= [SELECT Id from User where email='manualtesting.2027132@hotmail.com' LIMIT 1];
        System.runAs(us){
        String dateValue = String.valueOf(System.today());
        facility__c fac = [SELECT ID from Facility__c LIMIT 1];
        AllocationsCopy.updateAllocationRecoreds(fac.Id, dateValue);
        AllocationsCopy.geFacilitytAlocations(fac.Id);
          Allocation__c   alloc = [
                SELECT Id, Start_Date__c, End_Date__c, Working_Hours__c,
                Staff__r.Type_of_User__c,
                ICT_TimeSheet__r.Approver_Name__c,
                LastModifiedBy.Name
                FROM Allocation__c limit 1
            ];
     Staff__c staffs = [SELECT Id,Name__c,Last_Name__c,Role__c,Facility_Name__c FROM Staff__c limit 1];
       RestRequest req = new RestRequest();
        req.requestUri = '/services/apexrest/MobileAppMyTimeSheet';
        req.httpMethod = 'GET';
        req.params.put('staffId', staffs.Id);
        req.params.put('startDate', String.valueOf(Date.today().addDays(-2)));
        req.params.put('endDate', String.valueOf(Date.today()));
        req.params.put('pageNo', '1');
        RestContext.request = req;

        // Prepare response
        RestResponse res = new RestResponse();
        RestContext.response = res;

        // Call method
        Test.startTest();
        MobileAppMyTimeSheet.getMytimeSheetRecords();
        MobileAppMyTimeSheet.ICTTimeSheetWrapper wrapper = new MobileAppMyTimeSheet.ICTTimeSheetWrapper(alloc);
        Test.stopTest();

        // Parse and verify response
   

   
        //RoasterManagementHandler.getStaffAlocationData(allocationList[0].Staff__c);
        //RoasterManagementHandler.getAlocationData();
        //RoasterManagementHandler.createAllocation(dateValue,staffId);
        //RoasterManagementHandler.dummyData();
        }
        
    } 
   
}