@isTest
public class PayrollPdfDataTest {
public static List<Staff_Payroll_Setting__c> createStaffPayRollSetting(String payrollid,String staffid){
        
        List<Staff_Payroll_Setting__c> staffPayrollList =  new List<Staff_Payroll_Setting__c>();
        for(Integer i=0;i<=3;i++){
            Staff_Payroll_Setting__c staffpayRecord = new Staff_Payroll_Setting__c();
            staffpayRecord.Working_Hours__c=40;
            staffpayRecord.Staff__c=staffid;
            staffpayRecord.Payroll_Setting__c = payrollid;
            staffPayrollList.add(staffpayRecord);
        }
        try{
            insert staffPayrollList;
        }catch(DMLException e){
            system.assertEquals(e.getMessage(), e.getMessage()); 
        }
        return staffPayrollList;
    }
    
    public static List<Payroll_Setting__c> createPayRollSetting(){
        List<Payroll_Setting__c> payRollList = new List<Payroll_Setting__c>();
        for(Integer i=0;i<=3;i++){
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
     

        Organisation__c org = OrgDetailsTest.createOrganization();
        List<Facility__c> facilityList = FacilityControllerTest.createFacility(org.Id);
        System.debug(facilityList[0]);
        //Organisation__c orgRec =[select id,name from Organisation__c where id=:facilityList[0].Organisation__c];
        List<Staff__c> staffRec = new List<Staff__c>();
            staffRec = StaffControllerTest.createStaff(facilityList[0].id);
        
        List<Payroll_Setting__c>  payrollList = createPayRollSetting();
        Payroll_Setting__c payrollSetting = new Payroll_Setting__c(Id=payrollList[0].Id);
        payrollSetting.Facility__c=facilityList[0].id;
        update payrollSetting;
        
        List<Staff_Payroll_Setting__c> staffPayList = createStaffPayRollSetting(payrollSetting.Id,staffRec[0].Id);
        //Staff_Payroll_Setting__c staffPayrollSetting = new Staff_Payroll_Setting__c(Id=staffPayList[0].Id);
        //staffPayrollSetting.Staff__c = staffRec[0].Id;
        //update staffPayrollSetting;
       
        String payDate ='2023-12-13';
        
        PayrollPdfData.statusPayrollSetting(payrollList[0].Id);
        PayrollPdfData.updateSubmit(staffPayList[1].Payroll_Setting__c, 'Draft', payDate);
        PayrollPdfData.updateSubmit(staffPayList[1].Payroll_Setting__c, 'Delete', payDate);
        PayrollPdfData.updateSubmit(staffPayList[1].Payroll_Setting__c, 'Submitted', payDate);
      
        PayrollPdfData.payrollRun(staffPayList[0].Id);
        
        PayrollSettingSchedular.schedulePaySetting(payrollSetting.Id);
        String payRollid1 = payRollList[1].id;
        PayrollSettingSchedular.schedulePaySetting(payRollid1);
        PayrollSettingSchedular.createPayRunSettingDelete(payRollid1);
        String payRollid2 = payRollList[2].id;
        PayrollSettingSchedular.schedulePaySetting(payRollid2);
        PayrollSettingSchedular.createPayRunSettingDelete(payRollid2);

        Test.stopTest();
    }
    
}