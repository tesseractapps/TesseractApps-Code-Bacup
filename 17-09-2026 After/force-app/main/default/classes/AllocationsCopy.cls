/**
 * @description       : 
 * @author            : Raja Sekhar Reddy
 * @group             : 
 * @Test Class        : AllocationCopyTest
 * @last modified on  : 06-22-2023
 * @last modified by  : Raja Sekhar Reddy
**/
public class AllocationsCopy {
    @AuraEnabled
    public static void updateAllocationRecoreds(String facilityId,String startDate){
       AllocationCopyFuture.allocationCopy(facilityId,startDate);
    }

    @AuraEnabled
    public static List<Allocation__c> geFacilitytAlocations(String facilityId ){
       
            return [SELECT id,name,End_Date__c,Start_Date__c,Staff__c,Shift_Type__c,Working_Hours__c,Start_Date_Time__c,End_Date_Time__c,Shift_time_AMPM__c,Status__c,Start_time__c,End_time__c
                FROM Allocation__c
            WHERE Staff__r.Facility__r.Id =:facilityId] ;
    }
}