trigger ShiftWithSaffTrigger on ShiftwithStaff__c (before insert,before update, after update,before delete,after delete) {
     if((trigger.isinsert ||trigger.isUpdate) && trigger.isbefore ){
        
         ShiftTimehandler.AddshiftwithStaff(trigger.new,trigger.oldMap);
    }
    
    if(trigger.isUpdate && trigger.isafter){
        // Calling the Apex class method to handle the child records update
         ShiftwithStaffController.updatestaffName(Trigger.new);
         ShiftWithStaffHistoryHandler.captureTimingHistory( Trigger.new,Trigger.oldMap);
    }
    
   /*  if(trigger.isbefore && (trigger.isinsert)){
        ShiftTimehandler.UpdateHourlyRate(trigger.new,true);
    }
     */

     if (Trigger.isBefore && Trigger.isInsert) {

        List<ShiftwithStaff__c> recurringRosterShifts = new List<ShiftwithStaff__c>();

        for (ShiftwithStaff__c rec : Trigger.new) {
            if (rec.Do_you_want_to_set_this_Recurring_Roster__c == true) {
                recurringRosterShifts.add(rec);
            }
        }

        if (!recurringRosterShifts.isEmpty()) {
            ShiftTimehandler.UpdateHourlyRate(recurringRosterShifts,  true);
        }
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