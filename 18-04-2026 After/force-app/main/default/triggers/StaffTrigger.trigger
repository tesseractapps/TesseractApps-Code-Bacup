trigger StaffTrigger on Staff__c (after insert, after update,after delete) {
    
    if(trigger.isAfter && trigger.isUpdate){
        System.debug('after Update');
        
       /* Set<Id> ids= New Set<Id>();
        for(Staff__c stf:trigger.new){
            Staff__c oldStaff = trigger.oldMap.get(stf.Id);
            
            if(stf.Facility__c!=oldStaff.Facility__c){
                ids.add(stf.Facility__c);
                ids.add(oldStaff.Facility__c);
            }else{
                ids.add(stf.Facility__c);
            }
        }
        */
        List<RefreshDataTable__e> refreshDataTableEvents = new List<RefreshDataTable__e>();
            for (Staff__c staff : Trigger.new) {
                refreshDataTableEvents.add(new RefreshDataTable__e(
                    RecordId__c = staff.Id           
                ));
            }
            EventBus.publish(refreshDataTableEvents);
            
         //   StaffTriggerHandler.updateNoOfStaff(trigger.new,ids);
    }
        
    if(trigger.isAfter && trigger.isInsert){
        Set<Id> ids= New Set<Id>();
        
            List<RefreshDataTable__e> refreshDataTableEvents = new List<RefreshDataTable__e>();
            for (Staff__c staff : Trigger.new) {
                ids.add(staff.Facility__c);
                refreshDataTableEvents.add(new RefreshDataTable__e(
                    RecordId__c = staff.Id           
                ));
            }
            EventBus.publish(refreshDataTableEvents);
            System.debug('id value is '+ids);
           // StaffTriggerHandler.updateNoOfStaff(trigger.new,ids);
        }

        
      /*  if(trigger.isAfter && trigger.isDelete){
             Set<Id> ids= New Set<Id>();
        for(Staff__c stf:trigger.old){
            System.debug('deleted id is '+stf.Facility__c);
            ids.add(stf.Facility__c);
         }
           StaffTriggerHandler.updateNoOfStaff(trigger.old,ids);
        }
        */
    
}