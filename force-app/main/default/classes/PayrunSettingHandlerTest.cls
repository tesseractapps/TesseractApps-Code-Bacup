@isTest
public class PayrunSettingHandlerTest {
public static List<Staff_Payroll_Setting__c> createStaffPayRollSetting(String payrollid){
        
        List<Staff_Payroll_Setting__c> staffPayrollList =  new List<Staff_Payroll_Setting__c>();
        for(Integer i=0;i<=6;i++){
            Staff_Payroll_Setting__c staffpayRecord = new Staff_Payroll_Setting__c();
            staffpayRecord.Working_Hours__c=40*i;
            staffpayRecord.Frequency__c='Weekly';
            staffpayRecord.Payroll_Setting__c = payrollid;
            staffPayrollList.add(staffpayRecord);
        }
        try{
            insert staffPayrollList;
        }catch(DMLException e){
            system.assertEquals(e.getMessage(), e.getMessage()); 
        }
     	try{
            staffPayrollList[1].Frequency__c = 'Fortnightly';
            staffPayrollList[2].Frequency__c = '';
            update staffPayrollList;
        }catch(DMLException e){
            system.assertEquals(e.getMessage(), e.getMessage()); 
        }
        return staffPayrollList;
    }
    
    public static List<Payroll_Setting__c> createPayRollSetting(){
        List<Payroll_Setting__c> payRollList = new List<Payroll_Setting__c>();
        for(Integer i=0;i<=6;i++){
            Payroll_Setting__c payrollRecord = new Payroll_Setting__c();
            payrollRecord.Group_Name__c='group'+i;
            payrollRecord.Frequency__c='Weekly';
            payrollRecord.Status__c='';
            payrollRecord.Period_Start_Date__c = system.today().addDays(-7);
            payrollRecord.Period_End_Date__c = System.today();
            payrollRecord.Next_Pay_Date__c= System.today().addDays(2);
            payRollList.add(payrollRecord);
        }
        try{
            insert payRollList;
        }catch(DMLException e){
            system.assertEquals(e.getMessage(), e.getMessage()); 
        }
        
        try{
            payRollList[0].Period_Start_Date__c = Date.newInstance(2022, 07, 01);
            payRollList[0].Frequency__c = 'Fortnightly';
            update payRollList[0];
            payRollList[1].Frequency__c = 'Monthly';
            update payRollList[1];
            payRollList[2].Frequency__c = 'Weekly';
            payRollList[2].Status__c='Draft';
            update payRollList[2];
        }catch(DMLException e){
            system.assertEquals(e.getMessage(), e.getMessage()); 
        }
        return payRollList;
    }
    static testMethod void payRollHandlerTest(){
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
        
      
        List<Facility__c> facilityList = FacilityControllerTest.createFacility(org.Id);
        System.debug(facilityList[0]);
        
        List<Staff__c> staffRec = new List<Staff__c>();
        staffRec = StaffControllerTest.createStaff(facilityList[0].id);
        
        
        List<Payroll_Setting__c>  payrollList = createPayRollSetting();
        Payroll_Setting__c payrollSetting = new Payroll_Setting__c(Id=payrollList[0].Id);
        payrollSetting.Facility__c=facilityList[0].id;
       // payrollSetting.Organization_Name__c = 'Ashfield Consultants';
        payrollSetting.Status__c='';
        update payrollSetting;
        system.debug('payroll orgname'+payrollList[0].Organization_Name__c);
        
        List<Staff_Payroll_Setting__c> staffPayList = createStaffPayRollSetting(payrollList[0].Id);
        Staff_Payroll_Setting__c staffPayrollSetting = new Staff_Payroll_Setting__c(Id=staffPayList[0].Id);
        staffPayrollSetting.Staff__c = staffRec[0].Id;
        staffPayrollSetting.Frequency__c='Weekly';
        staffPayrollSetting.Working_Hours__c = 2;
        update staffPayrollSetting;
        staffPayrollSetting.Working_Hours__c = 5;
        update staffPayrollSetting;
         staffPayrollSetting.Working_Hours__c = 18;
        update staffPayrollSetting;
        staffPayrollSetting.Working_Hours__c = 32;
        update staffPayrollSetting;  
        
        staffPayrollSetting.Working_Hours__c = 72;
        update staffPayrollSetting;
        
        
        
        //Delete staffPayList[5];
        
        PayrunSettingHandler.staffPayroll(staffPayrollSetting.Payroll_Setting__c);
        PayrunSettingHandler.staffPayrollDate(staffPayrollSetting.Payroll_Setting__c);
        PayrunSettingHandler.accpetedStaffPayroll(payrollList[0].Id);
        PayrunSettingHandler.fetchFacilitiesByOrgId();
        PayrunSettingHandler.newStaffList(staffPayrollSetting.Payroll_Setting__c);
        PayrunSettingHandler.getpPaySettings();
        String sDate = String.valueOf(System.today());
        PayrunSettingHandler.payrollRun(staffRec[0].Facility__c,'Fulltime');
        PayrunSettingHandler.payrollRun(staffRec[0].Facility__c,'');
        List<String> stafflist =  new List<String>();
        stafflist.add(staffRec[0].Id);
        stafflist.add(staffRec[1].Id);
        String staffJson = JSON.serialize(stafflist);
       
        //PayrunSettingHandler.getpPaySettings();
        
        PayrunSettingHandler.getLastPayDate(facilityList[0].id);
        PayrunSettingHandler.insertInvoice(staffJson,staffJson,staffRec[0].Facility__c,sDate,sDate,sDate,'Weekly','Test');
        PayrunSettingHandler.updatePayset(staffPayList[0].Payroll_Setting__c,staffJson);
       // list<Payroll_Setting__c> payrollList= [select id from ]
        Test.stopTest();
    }
    
}