/**
* @description       : 
* @author            : Raja Sekhar Reddy
* @group             : 
* @Test				 : PayrollPdfDataTest
* @last modified on  : 06-20-2023
* @last modified by  : Raja Sekhar Reddy
**/
public class StaffPayrollSettingTriggerHandler {
public static void updateNoOfStaff(List<Staff_Payroll_Setting__c> StaffListNew, Set<Id> ids){
               String staffNameList;
        List<Staff_Payroll_Setting__c> staffList = [select id,Staff__r.Name,Staff__r.Last_Name__c,Payroll_Setting__r.Id from Staff_Payroll_Setting__c where Payroll_Setting__r.Id In :ids];
        Map<Id,List<Staff_Payroll_Setting__c>> facilityMap =new Map<Id,List<Staff_Payroll_Setting__c>>();
        
        for(Staff_Payroll_Setting__c atl: staffList) {
            if(staffNameList!=null){
            	staffNameList=staffNameList+atl.Staff__r.Name+' '+atl.Staff__r.Last_Name__c+', ';
            }else{
                staffNameList=atl.Staff__r.Name+' '+atl.Staff__r.Last_Name__c+', ';
            }
            
            if(facilityMap.containsKey(atl.Payroll_Setting__c) && facilityMap.get(atl.Payroll_Setting__c) != null) {
                List<Staff_Payroll_Setting__c> lst_terr = facilityMap.get(atl.Payroll_Setting__c);
                lst_terr.add(atl);
                facilityMap.put(atl.Payroll_Setting__c,lst_terr); 
            }   
            else {
                facilityMap.put(atl.Payroll_Setting__c, new List<Staff_Payroll_Setting__c> {atl});
            }
        }
    	
    List<Payroll_Setting__c> payrollList=new List<Payroll_Setting__c>();
   
        for(Id id:facilityMap.keySet()){
           
            Payroll_Setting__c fact=new Payroll_Setting__c(id=id);
                if(staffNameList.substring(0,staffNameList.length()-2)=='0'){
                    fact.StaffList__c='0';
                }else{
                    fact.StaffList__c=staffNameList.substring(0,staffNameList.length()-2);
                }
            	payrollList.add(fact);
        }
        if(payrollList.size()>0){
            System.debug('update facility');
        	update payrollList;
        }else{
            // new else block is added by praveen 
            //  To update payRunSetting when last staff* is removed from parun setting group 
            for( id paysetId:ids){
                Payroll_Setting__c fact=new Payroll_Setting__c(id=paysetId);
                fact.StaffList__c='0';
                fact.StaffList_Text__c	='0';
                payrollList.add(fact);
            }
            if(payrollList.size()>0){
               update payrollList;  
            }
           
        }
        
    }
    
}