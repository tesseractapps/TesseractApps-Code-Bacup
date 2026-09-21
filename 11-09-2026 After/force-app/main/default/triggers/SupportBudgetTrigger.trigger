trigger SupportBudgetTrigger on Support_Budget__c (
    after insert,
    after update,
    after delete,
    after undelete
) {
    SupportBudgetTriggerHandler.updateBudgetTotals(
        Trigger.newMap,
        Trigger.oldMap
    );
}