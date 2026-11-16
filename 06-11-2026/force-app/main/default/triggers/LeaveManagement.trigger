trigger LeaveManagement on Leave__c (after update, before insert, after insert) {
    
    /*if (Trigger.isAfter && Trigger.isUpdate) {
        LeaveManagementTriggerClass.updateLeaves(Trigger.new, Trigger.oldMap);
    }*/

    if (Trigger.isBefore && Trigger.isInsert) {
        System.debug('🔥 AFTER INSERT FIRED');
        LeaveManagementTriggerClass.preventDuplicateLeaves(Trigger.new);
    }

    if (Trigger.isAfter && Trigger.isInsert) {
        System.debug('🔥 AFTER INSERT FIRED');
        LeaveManagementTriggerClass.createstaffLeaveNotifications(Trigger.new);
    }
}