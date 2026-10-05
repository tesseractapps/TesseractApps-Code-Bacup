trigger RepositoryTrigger on Repository__c (after update) {
    if (Trigger.isAfter && Trigger.isUpdate) {
        RepositoryTriggerHandler.afterUpdate(
            Trigger.new,
            Trigger.oldMap
        );
    }
}