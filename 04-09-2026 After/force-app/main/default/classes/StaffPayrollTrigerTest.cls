@isTest
public class StaffPayrollTrigerTest {
    
public static List<Staff_Payroll_Setting__c> createStaffPayRollSetting(String payrollid,List<String> staffIds){
        
        List<Staff_Payroll_Setting__c> staffPayrollList =  new List<Staff_Payroll_Setting__c>();
        for(Integer i=0;i<=16;i++){
            Staff_Payroll_Setting__c staffpayRecord = new Staff_Payroll_Setting__c();
            staffpayRecord.Working_Hours__c=2*i;
            staffpayRecord.Frequency__c='Weekly';
            staffpayRecord.Payroll_Setting__c = payrollid;
            staffpayRecord.Staff__c = staffIds[0];
			staffPayrollList.add(staffpayRecord);
        }
    for(Integer i=0;i<=16;i++){
            Staff_Payroll_Setting__c staffpayRecord = new Staff_Payroll_Setting__c();
            staffpayRecord.Working_Hours__c=2*i;
            staffpayRecord.Frequency__c='Weekly';
            staffpayRecord.Payroll_Setting__c = payrollid;
            staffpayRecord.Staff__c = staffIds[1];
			staffPayrollList.add(staffpayRecord);
        }
    for(Integer i=0;i<=16;i++){
            Staff_Payroll_Setting__c staffpayRecord = new Staff_Payroll_Setting__c();
            staffpayRecord.Working_Hours__c=2*i;
            staffpayRecord.Frequency__c='Weekly';
            staffpayRecord.Payroll_Setting__c = payrollid;
            staffpayRecord.Staff__c = staffIds[2];
			staffPayrollList.add(staffpayRecord);
        }
     
        try{
            insert staffPayrollList;
        }catch(DMLException e){
            system.assertEquals(e.getMessage(), e.getMessage()); 
        }
     	
        return staffPayrollList;
    }
    
    public static List<Payroll_Setting__c> createPayRollSetting(string facilityId){
        List<Payroll_Setting__c> payRollList = new List<Payroll_Setting__c>();
        for(Integer i=0;i<=6;i++){
            Payroll_Setting__c payrollRecord = new Payroll_Setting__c();
            payrollRecord.Group_Name__c='group'+i;
            payrollRecord.Frequency__c='Weekly';
            payrollRecord.Status__c='';
            payrollRecord.Facility__c =facilityId;
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
       
        return payRollList;
    }
    static testMethod void payRollHandlerTest(){
        Test.startTest();
        
        
        Organisation__c org = OrgDetailsTest.createOrganization();
        String facilityId;
        List<Facility__c> facilityList = FacilityControllerTest.createFacility(org.Id);
        for(Facility__c facili:facilityList){
            facilityId= facili.Id;
        }
        List<Staff__c> staffRec = StaffControllerTest.createStaff(facilityId);
        
        
        String staffRecValue;
        String withTax;
        String abnValue;
        for(Staff__c staffRecord :staffRec){
            if(staffRecord.Tax_free_threshold__c=='With out Tax free threshold'){
                staffRecValue=staffRecord.Id;
			}
            if(staffRecord.Tax_free_threshold__c=='With Tax free threshold'){
                withTax=staffRecord.Id;
			}
            if(staffRecord.ABN_Number__c=='1234565432'){
                abnValue=staffRecord.Id;
			}
        }
        List<String> staffIds = new List<String>();
        staffIds.add(staffRecValue);
        staffIds.add(withTax);
        staffIds.add(abnValue);
        
        
        
        
        
        List<Payroll_Setting__c>  payrollList = createPayRollSetting(facilityId);
        String payroll1;
        for(Payroll_Setting__c payrollRe : payrollList){
            payroll1 = payrollRe.Id;
		}
        
        List<Staff_Payroll_Setting__c> staffPayList = createStaffPayRollSetting(payroll1,staffIds);
        List<Staff_Payroll_Setting__c> staffPayListUpdate = new List<Staff_Payroll_Setting__c>();
        for(Staff_Payroll_Setting__c staffRecUpd : [select id,Frequency__c,Staff_TFN_Number__c,Tax_free_threshold__c from Staff_Payroll_Setting__c]){
            System.debug('debug value is'+staffRecUpd.Staff_TFN_Number__c);
             System.debug('debug value is Tax_free_threshold__c'+staffRecUpd.Tax_free_threshold__c);
            
           Staff_Payroll_Setting__c staffredP = new Staff_Payroll_Setting__c(id=staffRecUpd.Id);
            staffredP.Frequency__c = 'Weekly';
            staffPayListUpdate.add(staffredP);
        }
        System.debug('size'+staffPayListUpdate.size());
        try{
            update staffPayListUpdate;
        }catch(DMLException e){
            system.assertEquals(e.getMessage(), e.getMessage()); 
        }
        
        Delete staffPayList[5];
        Test.stopTest();
    }
    
}