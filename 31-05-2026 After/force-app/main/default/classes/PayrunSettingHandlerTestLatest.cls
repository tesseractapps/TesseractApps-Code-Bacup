@isTest
public class PayrunSettingHandlerTestLatest {

    public static List<Staff_Payroll_Setting__c> createStaffPayRollSetting(String payrollid,String staffId){
      
        List<Staff_Payroll_Setting__c> staffPayrollList =  new List<Staff_Payroll_Setting__c>();
        for(Integer i=0;i<=3;i++){
            Staff_Payroll_Setting__c staffpayRecord = new Staff_Payroll_Setting__c();
            staffpayRecord.Working_Hours__c=40;
            staffpayRecord.Payroll_Setting__c=payrollid;
            staffpayRecord.Staff__c = staffId;
          
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
        for(Integer i=0;i<=3;i++){
            Payroll_Setting__c payrollRecord = new Payroll_Setting__c();
            payrollRecord.Facility__c=facilityId;
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
        List<Facility__c> facility = FacilityControllerTest.createFacility(org.Id);
       
        List<Payroll_Setting__c> payRollList = createPayRollSetting(facility[0].Id);
        String payRollid = payRollList[0].id;
        PayrollPdfData.updateSubmit(payRollid, 'Draft');
        PayrollPdfData.updateSubmit(payRollid, 'Delete');
        
        List<Staff__c> staffRec = StaffControllerTest.createStaff(facility[0].Id);
        
        List<Staff_Payroll_Setting__c> staffPayList = createStaffPayRollSetting(payRollid,staffRec[0].id);
        String staffPayrollId = staffPayList[0].id;
        String StaffId =staffPayList[0].Staff__c;
        String staffPayrunid = staffPayList[0].Payroll_Setting__c;
        
        PayRunHandler.fetchPayrollStaff();
        PayRunHandler.staffAllocationCalculation(staffPayList[0].Payroll_Setting__c);
      /*  PayrollPdfData.statusPayrollSetting(staffPayList[0].Payroll_Setting__c);
        PayrollPdfData.payrollRun(staffPayrollId);
        
        PayrollSettingSchedular.schedulePaySetting(staffPayrunid);
        PayrollSettingSchedular.createPayRunSettingDelete(staffPayrunid);
        String payRollid1 = payRollList[1].id;
        PayrollSettingSchedular.schedulePaySetting(payRollid1);
        PayrollSettingSchedular.createPayRunSettingDelete(payRollid1);
        String payRollid2 = payRollList[2].id;
        PayrollSettingSchedular.schedulePaySetting(payRollid2);
        PayrollSettingSchedular.createPayRunSettingDelete(payRollid2);
       
        */
      
        Test.stopTest();
    }

}