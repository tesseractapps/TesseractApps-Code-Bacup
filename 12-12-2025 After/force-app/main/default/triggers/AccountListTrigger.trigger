trigger AccountListTrigger on Account_List__c (after insert) {  
    if (Trigger.isAfter && Trigger.isInsert) {
        AccountListTriggerHandler.insertRelatedRecords(Trigger.new);
    }

}