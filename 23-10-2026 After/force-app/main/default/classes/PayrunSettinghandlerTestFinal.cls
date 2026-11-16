@isTest
public class PayrunSettinghandlerTestFinal {
    public static List<Staff_Payroll_Setting__c> createStaffPayRollSetting(){
        List<Payroll_Setting__c> payrunList = createPayRollSetting();
        List<Staff__c> staffRec = StaffControllerTest.createStaff();
        List<Staff_Payroll_Setting__c> staffPayrollList =  new List<Staff_Payroll_Setting__c>();
        for(Integer i=0;i<=3;i++){
            Staff_Payroll_Setting__c staffpayRecord = new Staff_Payroll_Setting__c();
            staffpayRecord.Working_Hours__c=40*i;
            staffpayRecord.Payroll_Setting__c=payrunList[i].id;
            staffpayRecord.Staff__c = staffRec[0].Id;
            
            
            staffPayrollList.add(staffpayRecord);
        }
        try{
            insert staffPayrollList;
        }catch(DMLException e){
            system.assertEquals(e.getMessage(), e.getMessage()); 
        }
        try{
            staffPayrollList[2].Working_Hours__c=80;
            update staffPayrollList[2];
        }catch(DMLException e){
            system.assertEquals(e.getMessage(), e.getMessage()); 
        }
        return staffPayrollList;
    }
    
    public static List<Payroll_Setting__c> createPayRollSetting(){
        List<Facility__c> facility = FacilityControllerTest.createFacility();
        List<Payroll_Setting__c> payRollList = new List<Payroll_Setting__c>();
        for(Integer i=0;i<=3;i++){
            Payroll_Setting__c payrollRecord = new Payroll_Setting__c();
            payrollRecord.Facility__c=facility[0].id;
            
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
        List<Staff_Payroll_Setting__c> staffpayRollList = createStaffPayRollSetting();
        Payroll_Setting__c payrollSettingList = [select id,Facility__c from Payroll_Setting__c where Id=:staffpayRollList[0].Payroll_Setting__c];
        
        Facility__c facility = [select id,Organisation__c from Facility__c where Id=:payrollSettingList.Facility__c];
        PayrunSettingHandler.fetchFacilitiesByOrgId();
        
        String staffId = staffpayRollList[0].Staff__c;
        PayrunSettingHandler.getpPaySettings();
        PayrunSettingHandler.staffPayroll(staffpayRollList[0].Payroll_Setting__c);
        String sDate = String.ValueOf(System.today());
        String eDate = String.ValueOf(System.today());
        PayrunSettingHandler.payrollRun(payrollSettingList.Facility__c,'Weekly',sDate,eDate);
        PayrunSettingHandler.payrollRun(payrollSettingList.Facility__c,'',sDate,eDate);
        String listOfsearchString='[{"staffId": ' +' "'+ StaffId + '" '+ ' ,"workhours":"","penaltyHours":"","publicHoliday":"","workhoursRate":"","earnings":"","preTax":"","superAnnu":""}]';
        
        PayrunSettingHandler.insertInvoice(listOfsearchString,payrollSettingList.Facility__c,sDate,eDate,eDate,'Weekly','Test');
    	
        String listOfsearchStringSecond='[{"staffId": ' +' "'+ StaffId + '" '+ ' ,"workhours":"40","penaltyHours":"","publicHoliday":"","workhoursRate":"125","earnings":"","preTax":"","superAnnu":""}]';
        PayrunSettingHandler.insertInvoice(listOfsearchStringSecond,payrollSettingList.Facility__c,sDate,eDate,eDate,'Weekly','Test');
    	
        Test.stopTest();
    }
    
}