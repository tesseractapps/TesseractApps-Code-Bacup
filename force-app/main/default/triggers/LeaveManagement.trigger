trigger LeaveManagement on Leave__c (after update, before insert) {
    
    if (Trigger.isAfter && Trigger.isUpdate) {
        LeaveManagementTriggerClass.updateLeaves(Trigger.new, Trigger.oldMap);
    }

    if (Trigger.isBefore && Trigger.isInsert) {
        LeaveManagementTriggerClass.preventDuplicateLeaves(Trigger.new);
    }
}