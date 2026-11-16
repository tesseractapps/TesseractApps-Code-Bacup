public class SignInCheckListAndNotesHandler {
    @AuraEnabled(cacheable=true)
    public static CheckListWrapper getCheckListByShiftId(String addShiftId,string selectedShift) {
     
        try {
            if (String.isEmpty(addShiftId) || addShiftId.trim().length() == 0) {
                return new CheckListWrapper(false, 'Error: Shift ID is required and cannot be empty.', null);
            }

            List<Add_Shift_Checklist__c> checklistRecords = [SELECT Id, Name, Add_Shift__c, Mandatory__c, Description__c, Completed__c FROM Add_Shift_Checklist__c WHERE Add_Shift__c = :addShiftId
                                                            or ShiftwithStaff__c =:selectedShift ];
               system.debug(' checklistRecords '+checklistRecords);
            List<CheckListItem> checklist = new List<CheckListItem>();
            for (Add_Shift_Checklist__c item : checklistRecords) {
                checklist.add(new CheckListItem(item));
            }
               system.debug(' CheckList '+checklist);
            return new CheckListWrapper(true, 'CheckList list processed successfully', checklist);
        } catch (Exception e) {
            return new CheckListWrapper(false, 'Error processing check list: ' + e.getMessage(), null);
        }
    }
    @AuraEnabled
    public static Map<String, Object> updateCheckListRecords(String checklistUpdatesJson) {
        Map<String, Object> response = new Map<String, Object>();
        
        try {
            // Deserialize JSON string into List of CheckListItem
            List<CheckListItem> checklistUpdates = 
                (List<CheckListItem>) JSON.deserialize(checklistUpdatesJson, List<CheckListItem>.class);
            
            List<Add_Shift_Checklist__c> recordsToUpdate = new List<Add_Shift_Checklist__c>();
            
            // Convert wrapper data to Salesforce object
            for (CheckListItem updateItem : checklistUpdates) {
                Add_Shift_Checklist__c record = new Add_Shift_Checklist__c(
                    Id = updateItem.id,
                    Completed__c = updateItem.isCompleted
                );
                recordsToUpdate.add(record);
            }
            
            // Check if records exist to update
            if (!recordsToUpdate.isEmpty()) {
                update recordsToUpdate;
                response.put('success', true);
                response.put('message', 'Checklist updated successfully.');
            } else {
                response.put('success', false);
                response.put('message', 'No valid records to update.');
            }
        } catch (Exception e) {
            response.put('success', false);
            response.put('message', 'Error updating checklist: ' + e.getMessage());
        }
        
        return response;
    }
      @AuraEnabled
    public static Map<String, Object> addShiftActivity(string shiftStaffId, string Activity){
        Map<String, Object> response = new Map<String, Object>();
        try {
            ShiftWithStaff_Activity__c shiftActivity = new ShiftWithStaff_Activity__c();
            shiftActivity.ShiftwithStaff__c=shiftStaffId;
            shiftActivity.Notes__c=Activity ;
            insert shiftActivity;
            response.put('success', true);
            response.put('message', 'Activity added successfully.');
            response.put('Id', shiftActivity.Id);
        }catch(exception e){
            response.put('success', false);
            response.put('message', 'Error adding Activity: ' + e.getMessage());
        }
        return response;
    }
      @AuraEnabled(cacheable=true)
    public static Map<String, Object> getActivityLog(String shiftWithStaffID) {
       Map<String, Object> response = new Map<String, Object>(); 
        List<ShiftWithStaff_Activity__c> activityRecords = new  List<ShiftWithStaff_Activity__c>();
        try {
            if (String.isEmpty(shiftWithStaffID) || shiftWithStaffID.trim().length() == 0) {
                response.put('success', false);
                response.put('message','Error: Shift ID is required and cannot be empty.' );
                 response.put('records', activityRecords);
            }else{
               activityRecords = [SELECT Id, Notes__c, ShiftwithStaff__c FROM ShiftWithStaff_Activity__c WHERE ShiftwithStaff__c = :shiftWithStaffID];   
            }
            system.debug(' activity records  '+activityRecords);
            response.put('success', true);
            response.put('message', 'Activity fetched successfully.');
            response.put('records', activityRecords);
        } catch (Exception e) {
            response.put('success', false);
            response.put('message', 'Error adding Activity: ' + e.getMessage());
        }
       return response;
    }

    
     public class CheckListWrapper {
       @AuraEnabled public Boolean success;
       @AuraEnabled public String message;
       @AuraEnabled public List<CheckListItem> checklist;
        
        public CheckListWrapper(Boolean success, String message, List<CheckListItem> checklist) {
            this.success = success;
            this.message = message;
            this.checklist = checklist;
        }
    }
    
    public class CheckListItem {
        @AuraEnabled public String id;
        @AuraEnabled public String checkListNum;
        @AuraEnabled public String addShiftId;
        @AuraEnabled public Boolean isMandatory;
        @AuraEnabled public String description;
        @AuraEnabled public Boolean isCompleted;
        
        public CheckListItem(Add_Shift_Checklist__c item) {
            this.id = item.Id;
            this.checkListNum = item.Name;
            this.addShiftId = item.Add_Shift__c;
            this.isMandatory = item.Mandatory__c;
            this.description = item.Description__c;
            this.isCompleted = item.Completed__c;
        }
    }
}