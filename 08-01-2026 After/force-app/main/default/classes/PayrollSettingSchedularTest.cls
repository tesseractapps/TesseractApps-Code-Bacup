@isTest
public class PayrollSettingSchedularTest {
public static List<Staff_Payroll_Setting__c> createStaffPayRollSetting(String payrollid,List<String> staffIds){
        
        List<Staff_Payroll_Setting__c> staffPayrollList =  new List<Staff_Payroll_Setting__c>();
        for(Integer i=0;i<=4;i++){
            Staff_Payroll_Setting__c staffpayRecord = new Staff_Payroll_Setting__c();
            staffpayRecord.Working_Hours__c=40;
            staffpayRecord.Payroll_Setting__c = payrollid;
            staffpayRecord.Staff__c = staffIds[0];
            staffPayrollList.add(staffpayRecord);
        }
        try{
            insert staffPayrollList;
        }catch(DMLException e){
            system.assertEquals(e.getMessage(), e.getMessage()); 
        }
        return staffPayrollList;
    }
    
    public static List<Payroll_Setting__c> createPayRollSetting(String facilityId){
        List<Payroll_Setting__c> payRollList = new List<Payroll_Setting__c>();
        for(Integer i=0;i<=4;i++){
            Payroll_Setting__c payrollRecord = new Payroll_Setting__c();
            payrollRecord.Group_Name__c='group'+i;
            payrollRecord.Frequency__c='Weekly';
            payrollRecord.Facility__c = facilityId;
            payrollRecord.Status__c='Submitted';
            payrollRecord.Period_Start_Date__c = Date.newInstance(2021,08,01);
            payrollRecord.Period_End_Date__c =Date.newInstance(2021,08,01);
            payrollRecord.Next_Pay_Date__c= Date.newInstance(2021,08,01);
            payRollList.add(payrollRecord);
        }
        
        for(Integer i=0;i<=4;i++){
            Payroll_Setting__c payrollRecord = new Payroll_Setting__c();
            payrollRecord.Group_Name__c='group'+i;
            payrollRecord.Frequency__c='Fortnightly';
            payrollRecord.Facility__c = facilityId;
            payrollRecord.Status__c='Submitted';
            payrollRecord.Period_Start_Date__c = System.today().addDays(-7);
            payrollRecord.Period_End_Date__c = System.today();
            payrollRecord.Next_Pay_Date__c= System.today().addDays(2);
            payRollList.add(payrollRecord);
        }
        for(Integer i=0;i<=4;i++){
            Payroll_Setting__c payrollRecord = new Payroll_Setting__c();
            payrollRecord.Group_Name__c='group'+i;
            payrollRecord.Frequency__c='';
            payrollRecord.Facility__c = facilityId;
            payrollRecord.Status__c='Submitted';
            payrollRecord.Period_Start_Date__c = System.today().addDays(-7);
            payrollRecord.Period_End_Date__c = System.today();
            payrollRecord.Next_Pay_Date__c= System.today().addDays(2);
            payRollList.add(payrollRecord);
        }
        
        try{
            insert payRollList;
        }catch(DMLException e){
            system.assertEquals(e.getMessage(), e.getMessage()); 
        }
        
        return payRollList;
    }
    static testMethod void payRollHandlerTest(){
        Test.startTest();
     

        Organisation__c org = OrgDetailsTest.createOrganization();
        system.debug('org ==>'+org);
        string orgId=org.id;
        List<Facility__c> facilityList = FacilityControllerTest.createFacility(orgId);
        System.debug(facilityList[0]);
       // Organisation__c orgRec =[select id,name from Organisation__c where id=:facilityList[0].Organisation__c];
        List<Staff__c> staffRec = new List<Staff__c>();
            staffRec = StaffControllerTest.createStaff(facilityList[0].id);
               List<String> staffIds = new List<String>();
        staffIds.add(staffRec[0].Id);
        staffIds.add(staffRec[1].Id);
        staffIds.add(staffRec[2].Id);
        
        List<Payroll_Setting__c>  payrollList = PayrollSettingSchedularTest.createPayRollSetting(facilityList[0].id);
       
        List<Staff_Payroll_Setting__c> staffPayList = createStaffPayRollSetting(payrollList[0].Id,staffIds);
        
     	PayrollSettingSchedular.schedulePaySetting(payrollList[0].Id);
        PayrollSettingSchedular.createPayRunSettingDelete(payrollList[0].Id);
        
        PayrollSettingSchedular.schedulePaySetting(payrollList[6].Id);
        PayrollSettingSchedular.createPayRunSettingDelete(payrollList[6].Id);
        
        PayrollSettingSchedular.schedulePaySetting(payrollList[11].Id);
        PayrollSettingSchedular.createPayRunSettingDelete(payrollList[11].Id);
        PayrollSettingSchedular.getPayHistrory('2024-07-20', 'group1');
       // List<PayrollReportingHandler.PayrollWrapper> payrollSettings1 = PayrollReportingHandler.fetchStaffPayrollSetting(Date.newInstance(2021,07,01),System.today(), org.Name, facilityList[0].id);
       
        Test.stopTest();
    }
    
     static testMethod void payRollHandlerTest2(){
        Test.startTest();
     

        Organisation__c org = OrgDetailsTest.createOrganization();
        system.debug('org ==>'+org);
        string orgId=org.id;
        List<Facility__c> facilityList = FacilityControllerTest.createFacility(orgId);
        System.debug(facilityList[0]);
       // Organisation__c orgRec =[select id,name from Organisation__c where id=:facilityList[0].Organisation__c];
        List<Staff__c> staffRec = new List<Staff__c>();
            staffRec = StaffControllerTest.createStaff(facilityList[0].id);
               List<String> staffIds = new List<String>();
        staffIds.add(staffRec[0].Id);
        staffIds.add(staffRec[1].Id);
        staffIds.add(staffRec[2].Id);
        
     Payroll_Setting__c payrollRecord = new Payroll_Setting__c();
            payrollRecord.Group_Name__c='group';
            payrollRecord.Frequency__c='Weekly';
            payrollRecord.Facility__c = facilityList[0].id;
            payrollRecord.Status__c='Submitted';
            payrollRecord.Period_Start_Date__c = Date.newInstance(2021,07,01);
            payrollRecord.Period_End_Date__c =Date.newInstance(2021,07,08);
            payrollRecord.Next_Pay_Date__c= Date.newInstance(2021,07,08);
         insert  payrollRecord ;
         
         
       /* Staff_Payroll_Setting__c staffpayRecord = new Staff_Payroll_Setting__c();
            staffpayRecord.Working_Hours__c=40;
         // staffpayRecord.Payroll_Setting__c = payrollid;
            staffpayRecord.Staff__c = staffIds[0];
            staffPayrollList.add(staffpayRecord);*/
        
     	PayrollSettingSchedular.schedulePaySetting(payrollRecord.id);
      
    
        Test.stopTest();
    }
     
    
}