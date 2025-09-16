/*Test class:MobileAppSignRestResourceTest*/
@RestResource(urlMapping='/EnableSignInApi/*')
global class MobileAppSignEnableRest {
     @HttpGet
    global static void enableSignInButton(){
        RestResponse res = RestContext.response;
        Map<String, Object> responseMap = new Map<String, Object>();
         try {
            // Read the request body as a JSON string
            RestRequest req = RestContext.request;
              String shiftId = req.params.get('shiftId'); 
             system.debug('shift id==>'+shiftId);
            
            if (String.isBlank(shiftId)) {
                responseMap.put('success', false);
                responseMap.put('message', 'Error: Request input cannot be empty.');
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }
             

            // Query the Shiftwithstaff record based on shiftId
            ShiftwithStaff__c shiftRecord = [SELECT Id, CreatedById, CreatedBy.Name,Enable_Sign_In__c FROM ShiftwithStaff__c WHERE Id = :shiftId LIMIT 1];

            if (shiftRecord == null) {
                responseMap.put('success', false);
                responseMap.put('message', 'Error: Shiftwithstaff record not found.');
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }
             if(shiftRecord.Enable_Sign_In__c==true){
                 responseMap.put('success', true);
                 responseMap.put('Enable_Sign_In__c',shiftRecord.Enable_Sign_In__c);
                 res.responseBody = Blob.valueOf(JSON.serialize(responseMap)); 
                  return;
             }
               system.debug('before fetching ');
             List<Task> existingTasks = [SELECT Id FROM Task WHERE WhatId = :shiftRecord.Id AND Subject = 'Enable Sign in for Shift' AND Status = 'New' LIMIT 1];
             
             // Log after fetching task
             system.debug('after fetching ');
            
             
             // If an existing task is found, return a message stating the task already exists
             if (!existingTasks.isEmpty() && shiftRecord.Enable_Sign_In__c==false) {
                 responseMap.put('success', true);
                 responseMap.put('Enable_Sign_In__c',shiftRecord.Enable_Sign_In__c);
                 responseMap.put('message', 'Task already created for enabling sign in.');
                 res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                 return;
             }
             
             
             if(shiftRecord.Enable_Sign_In__c==false){
                 Task newTask = new Task(
                     Subject = 'Enable Sign in for Shift',
                     Status = 'New',
                     Priority = 'Normal',
                     OwnerId = shiftRecord.CreatedById, 
                     WhatId = shiftRecord.Id, 
                     Description = 'Task related to enabling sign in for the shift.',
                     ActivityDate=system.today()
                 );
                 insert newTask;
  
                  // Return success response
                 responseMap.put('success', true);
                 responseMap.put('Enable_Sign_In__c',shiftRecord.Enable_Sign_In__c);
                 responseMap.put('message', 'Sign In Requested and Task created.');
             }
            // Now, create a Task record for the user who created the Shiftwithstaff record
          
           
             
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
             
             
         }catch (Exception e) {
            responseMap.put('success', false);
            responseMap.put('message', 'Error processing Sign In : ' + e.getMessage());
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
        }
    }

}