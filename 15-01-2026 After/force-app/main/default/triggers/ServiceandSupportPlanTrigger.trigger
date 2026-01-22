trigger ServiceandSupportPlanTrigger on Services_and_Support_Plan__c (before insert, before update, after delete) {
    if(trigger.isBefore && (trigger.isInsert ||trigger.isUpdate) ){
         Map<Id, Services_and_Support_Plan__c> oldMap = (Trigger.isUpdate) ? Trigger.oldMap : null;
        ServiceandSupportController.updateAvailableFunds(trigger.new,oldMap);
    }
    
    if (Trigger.isAfter && Trigger.isDelete) {
        ServiceandSupportController.updateAvailableFundsOnDelete(Trigger.old);
    }
}