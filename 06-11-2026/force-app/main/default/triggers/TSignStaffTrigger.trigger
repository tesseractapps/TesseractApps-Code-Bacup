trigger TSignStaffTrigger on TSign_Staff__c (
    after insert, after update
) {
    TSignStaffTriggerHandler.handleModuleAccess(
        Trigger.new,
        Trigger.oldMap,
        Trigger.isInsert
    );
}