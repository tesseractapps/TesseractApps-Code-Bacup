/**
 * @description       : 
 * @author            : Raja Sekhar Reddy
 * @group             : 
 * @Test Class 		  : PayRollSettingHandlerTest
 * @last modified on  : 06-16-2023
 * @last modified by  : Raja Sekhar Reddy
**/

trigger PayrollSettingTrigger on Payroll_Setting__c (After update) {
    if(Trigger.isAfter && Trigger.isUpdate){
        String payrollSettingId;
         list<Staff_Payroll_Setting__c> staffPayList= new list<Staff_Payroll_Setting__c>();
        for(Payroll_Setting__c newPayrollSetting : Trigger.new){
        	Payroll_Setting__c oldPayrollSetting = Trigger.oldMap.get(newPayrollSetting.ID);
            if(newPayrollSetting.Status__c != oldPayrollSetting.Status__c && 
               (oldPayrollSetting.Status__c=='Draft') && newPayrollSetting.Status__c=='Submitted'){
                   System.debug('submitted');
                   PayrollSettingSchedular.schedulePaySetting(newPayrollSetting.ID);
            }
            if(oldPayrollSetting.Status__c == newPayrollSetting.Status__c &&  newPayrollSetting.Status__c== null  &&
              (oldPayrollSetting.Next_Pay_Date__c != newPayrollSetting.Next_Pay_Date__c || oldPayrollSetting.Frequency__c != newPayrollSetting.Frequency__c)){ 
                  system.debug('after update operation');
                for(Staff_Payroll_Setting__c ss:[select id,Pay_Date__c,Frequency__c from Staff_Payroll_Setting__c where Payroll_Setting__c=:newPayrollSetting.id]){
                    ss.Pay_Date__c=newPayrollSetting.Next_Pay_Date__c;
                    ss.Frequency__c=newPayrollSetting.Frequency__c;
                    staffPayList.add(ss);
                }
            }
        }
        if(staffPayList.size()>0){
            update staffPayList;
        }
        
    }

}