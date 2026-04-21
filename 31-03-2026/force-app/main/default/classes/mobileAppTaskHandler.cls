@RestResource(urlMapping='/FetchTask/*')
global class mobileAppTaskHandler {
    @HttpGet
    global static void getTaskDetails() {
        RestResponse res = RestContext.response;
        Map<String, Object> responseMap = new Map<String, Object>();
        
        try {
            // Fetch task details
           // List<Task> taskList =TaskHandler.taskDetails();
           //  // Wrapping task details
            List<taskWrapper> taskWrapperList = new List<taskWrapper>();
             User objUser = [ SELECT Phone,Name, Id FROM User WHERE Id = : UserInfo.getUserId() ];
           List<Task> taskList=[select id,Subject,status,ActivityDate,Owner.name,Completed__c,InProgressValue__c,NewValue__c,CreatedBy.SmallPhotoUrl from task where Owner.name = : objUser.Name];
            
           
             system.debug('Task '+taskList);
            for (Task t : taskList) {
                taskWrapper tw = new taskWrapper();
                tw.Description = t.Subject;
                tw.Status = t.Status;
                tw.DueDate = t.ActivityDate;
                tw.CreatedByName = t.Owner.Name;
                tw.CreatedByUrl ='';    /// pass dummy url
                tw.taskId = t.Id;
                if (tw.Description == 'Approval Request') {
                    tw.NavigationTo = 'Submissions';
                } else if (tw.Description == 'Leave Request') {
                    tw.NavigationTo = 'Leave Management';
                } else if (tw.Description == 'Incident Register') {
                    tw.NavigationTo = tw.Description;
                } else {
                    tw.NavigationTo = 'Do Not Navigate';
                }
                taskWrapperList.add(tw);
            }
            
            // Populate response map
            responseMap.put('isSuccess', true);
            responseMap.put('message', 'Task details fetched successfully');
            responseMap.put('tasks', taskWrapperList);
        } catch (Exception e) {
            responseMap.put('isSuccess', false);
            responseMap.put('message', 'Error fetching task details');
            responseMap.put('error', e.getMessage());
            res.statusCode = 200;
        }
        
        res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
        res.statusCode = 200;
    }
    
    global class taskWrapper {
        global String Description;
        global String Status;
        global Date DueDate;
        global String CreatedByName;
        global string CreatedByUrl;
        global String taskId;
        global string NavigationTo;
        
    }
}