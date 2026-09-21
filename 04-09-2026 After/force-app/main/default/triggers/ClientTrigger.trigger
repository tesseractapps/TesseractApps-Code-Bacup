/**
 * @description       : 
 * @author            : Raja Sekhar Reddy
 * @group             : 
 * @Test Class        : ClientDataControllerTest
 * @last modified on  : 06-22-2023
 * @last modified by  : Raja Sekhar Reddy
**/

trigger ClientTrigger on Client__c (after insert, after update) {

 if(trigger.isAfter){
        if(trigger.isInsert || trigger.isUpdate){
            List<RefreshDataTable__e> refreshDataTableEvents = new List<RefreshDataTable__e>();
            for (Client__c client : Trigger.new) {
                refreshDataTableEvents.add(new RefreshDataTable__e(
                    RecordId__c = client.Id           
                ));
            }
            EventBus.publish(refreshDataTableEvents);
        }
    }

}