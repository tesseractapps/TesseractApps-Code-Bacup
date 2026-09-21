trigger StaffTrigger on Staff__c (before update, after insert, after update,after delete) {
    
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

    if (Trigger.isBefore && Trigger.isUpdate) {
        // Handle field updates before the record is saved
        for (Staff__c staff : Trigger.new) {
            Staff__c oldStaff = Trigger.oldMap.get(staff.Id);
            
            // Check if Name or Last_Name__c has changed
            if (staff.Name != oldStaff.Name ||  staff.Last_Name__c != oldStaff.Last_Name__c) {
                
                // Update User_Update__c field
                staff.User_Update__c = true; // or you can set it to a specific value
                // Alternative: staff.User_Update__c = System.now(); if it's a DateTime field
                // Alternative: staff.User_Update__c = 'Updated on ' + System.now(); if it's a Text field
            }
        }
    }

    if (Trigger.isAfter && Trigger.isUpdate) {
        // Check if we need to run the batch
        Boolean needsBatch = false;
        Set<String> staffEmails = new Set<String>();
        Map<String, Staff__c> emailToStaffMap = new Map<String, Staff__c>();
        
        for (Staff__c staff : Trigger.new) {
            Staff__c oldStaff = Trigger.oldMap.get(staff.Id);
            
            // Check if Name or Last_Name__c has changed
            if (staff.Name != oldStaff.Name || staff.Last_Name__c != oldStaff.Last_Name__c) {
                needsBatch = true;
                
                // Collect emails for Contact update
                if (String.isNotBlank(staff.Email_Address__c)) {
                    String emailKey = staff.Email_Address__c.toLowerCase();
                    staffEmails.add(emailKey);
                    emailToStaffMap.put(emailKey, staff);
                }
                break;
            }
        }
        
        // Update Contacts if we have emails
        if (!staffEmails.isEmpty()) {
            List<Contact> contactsToUpdate = new List<Contact>();
            
            for (Contact con : [SELECT Id, Email, FirstName, LastName 
                            FROM Contact 
                            WHERE Email IN :staffEmails]) {
                
                String emailKey = con.Email.toLowerCase();
                if (emailToStaffMap.containsKey(emailKey)) {
                    Staff__c staff = emailToStaffMap.get(emailKey);
                    
                    // Assign Staff's Name to Contact FirstName
                    con.FirstName = staff.Name;
                    // Assign Staff's Last_Name__c to Contact LastName
                    con.LastName = staff.Last_Name__c;
                    
                    contactsToUpdate.add(con);
                }
            }
            
            if (!contactsToUpdate.isEmpty()) {
                update contactsToUpdate;
            }
        }
        
        // Run batch if any records were updated
        if (needsBatch) {
            StaffToUserBatch staffBatchJob = new StaffToUserBatch();
            Id batchJobId = Database.executeBatch(staffBatchJob, 1);
        }
    }

    
}