/**
* @description       : 
* @author            : Raja Sekhar Reddy
* @group             : 
* @Test Class        : FacilityControllerTest
* @last modified on  : 07-14-2023
* @last modified by  : Raja Sekhar Reddy
**/
trigger facilityTrigger on Facility__c (before insert,after insert, after update) {
    if(trigger.isBefore && trigger.isInsert){
         String orgId = CurrentUserOrganization.currentOrgId();
          for (Facility__c facility : Trigger.new) {
                facility.Organisation__c = orgId;
          }
    }
    if(trigger.isAfter){
        if(trigger.isInsert || trigger.isUpdate){
           
            
            List<RefreshDataTable__e> refreshDataTableEvents = new List<RefreshDataTable__e>();
            for (Facility__c facility : Trigger.new) {
                refreshDataTableEvents.add(new RefreshDataTable__e(
                    RecordId__c = facility.Id           
                ));
            }
            EventBus.publish(refreshDataTableEvents);
        }
    }
 }