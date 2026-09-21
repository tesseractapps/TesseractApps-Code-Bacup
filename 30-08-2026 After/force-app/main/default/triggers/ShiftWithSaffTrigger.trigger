trigger ShiftWithSaffTrigger on ShiftwithStaff__c (before insert,before update, after update,before delete,after delete) {
     if((trigger.isinsert ||trigger.isUpdate) && trigger.isbefore ){
        
         ShiftTimehandler.AddshiftwithStaff(trigger.new,trigger.oldMap);
    }
    
    if(trigger.isUpdate && trigger.isafter){
        // Calling the Apex class method to handle the child records update
         ShiftwithStaffController.updatestaffName(Trigger.new);
    }
    
    if(trigger.isbefore && (trigger.isinsert)){
        ShiftTimehandler.UpdateHourlyRate(trigger.new,true);
    }
    
    if (trigger.isBefore && trigger.isDelete) { 
        ShiftTimehandler.deleteServices(trigger.old); 
    }
    
    if (trigger.isafter && trigger.isDelete) { 
        ShiftTimehandler.updaterelatedshift(trigger.old); 
    }
    
    if((trigger.isInsert || trigger.isUpdate) && trigger.isafter){
         ShiftwithStaffController.updateMyavailability(Trigger.new);
    }
}