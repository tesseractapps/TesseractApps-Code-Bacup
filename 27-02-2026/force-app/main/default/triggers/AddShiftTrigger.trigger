trigger AddShiftTrigger on Add_Shift__c (before insert, before update, after update) {
    if (Trigger.isInsert || Trigger.isBefore) {
        AddShiftHandler.PreventDuplicateUpdate(Trigger.new, null);
    }
    if (Trigger.isUpdate && Trigger.isAfter) {
        AddShiftHandler.PreventDuplicateUpdate(Trigger.new, Trigger.oldMap);
    }
     
}