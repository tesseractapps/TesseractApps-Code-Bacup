/**
* @description       : 
* @author            : Raja Sekhar Reddy
* @group             : 
* @Test Class        : AllocationCopyTest
* @last modified on  : 06-22-2023
* @last modified by  : Raja Sekhar Reddy
**/
public class AllocationCopyFuture {
    @future
    public static void allocationCopy(String facilityId,String startDate){
        Date startDateValue = Date.valueOf(startDate)-7;
        Date endDateValue =  Date.valueOf(startDate)-1;
        system.debug('startdate'+startDateValue);
        system.debug('end date'+endDateValue);
        
        Map<String,List<Allocation__c>> allocationStaffList = new Map<String,List<Allocation__c>>();
        List<Staff__c> staffAllocationList =[select id,(Select id,Start_Date__c,Start_Date_Time__c,End_Date_Time__c,Start_time__c,End_time__c,Break_Start_Time2__c,Break_End_Time2__c,Break_Start_Time3__c,Break_End_Time3__c,Working_Hours__c,Break__c,AllocationCopyTest__c,End_Date__c,Break_Start__c,Break_End__c,Break_Start_Time__c,Break_End_Time__c from Allocations__r where Start_Date__c>= :startDateValue and Start_Date__c<= :endDateValue) from Staff__c where Facility__c=:facilityId];
        for(Staff__c staffList : staffAllocationList){
            if(staffList.Allocations__r.size()>0)
                allocationStaffList.put(staffList.Id,staffList.Allocations__r);
        }
        system.debug('AlocationStaffList'+allocationStaffList);
        List<String> allocationCopyList = new List<String>();
        List<Allocation__c> allocationList = new List<Allocation__c>();
        for(String staffId : allocationStaffList.keySet()){
            for(Allocation__c allocation : allocationStaffList.get(staffId)){
                Allocation__c allocationRec = new Allocation__c();
                allocationRec.Staff__c = staffId;
                allocationRec.Start_Date__c = allocation.Start_Date__c+7;
                allocationRec.End_Date__c = allocation.Start_Date__c+7;
                allocationRec.Start_Date_Time__c=allocation.Start_Date_Time__c;
                allocationRec.End_Date_Time__c=allocation.End_Date_Time__c;
                allocationRec.Start_time__c=allocation.Start_time__c;
                allocationRec.End_time__c=allocation.End_time__c;
                allocationRec.Break_Start_Time__c=allocation.Break_Start_Time__c;
                allocationRec.Break_End_Time__c=allocation.Break_End_Time__c;
                allocationRec.Break_Start_Time2__c=allocation.Break_Start_Time2__c;
                allocationRec.Break_End_Time2__c=allocation.Break_End_Time2__c;
                allocationRec.Break_Start_Time3__c=allocation.Break_Start_Time3__c;
                allocationRec.Break_End_Time3__c=allocation.Break_End_Time3__c;
                allocationRec.Working_Hours__c=allocation.Working_Hours__c;
                allocationRec.Break__c=allocation.Break__c;
                allocationRec.Break_Start__c=allocation.Break_Start__c;
                allocationRec.Break_End__c=allocation.Break_End__c;
                allocationRec.Status__c='Draft';
                String sdate = String.valueOf(allocationRec.Start_Date__c);
                String trucatedStr = staffId.substring(0,15);
                String allocationDate =trucatedStr+sdate;
                allocationRec.AllocationCopyTestText__c=allocationDate;
                allocationCopyList.add(allocationDate);
                allocationList.add(allocationRec);
            }
        }
        List<Allocation__c> allList = [select id,AllocationCopyTest__c from Allocation__c where AllocationCopyTest__c IN : allocationCopyList];
        Map<String,Allocation__c> allFinalMap = new Map<String,Allocation__c>();
        for(Allocation__c allRec : allList) {
            allFinalMap.put(allRec.AllocationCopyTest__c,allRec);
        }
        
        system.debug('allocation list'+allocationList);
        List<Allocation__c> allFinalRec = new List<Allocation__c>();
        for(Allocation__c allRec : allocationList) {
            if(allFinalMap.keySet().contains(allRec.AllocationCopyTestText__c)){
                System.debug('same');
            }else{
                System.debug('not same');
                allFinalRec.add(allRec);
            }
            
        }
        System.debug('size '+allFinalRec.size());
        if(allFinalRec.size()>0){
            try{
            insert allFinalRec;
            }catch(Exception e){
                throw new AuraHandledException(e.getMessage());
            }
        }
    }
}