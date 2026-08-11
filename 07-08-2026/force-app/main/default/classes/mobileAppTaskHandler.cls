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
             User objUser = [ SELECT Phone,Name,Email, Id FROM User WHERE Id = : UserInfo.getUserId() ];
             Staff__c staff = [ SELECT Id FROM Staff__c WHERE Email_Address__c  = :objUser.Email LIMIT 1];
             Id staffId = staff.Id;
             
            String participantId = RestContext.request.params.get('participantId');
            String filterStaffId = RestContext.request.params.get('staffId');
            String shiftId = RestContext.request.params.get('shiftId');
            String taskDate = RestContext.request.params.get('taskDate');

           List<Task> taskList=[select id,Subject,ActivityDate,Owner.name,Completed__c,InProgressValue__c,NewValue__c,CreatedBy.SmallPhotoUrl, 
            Task_Tittle__c, Task_Date__c, Task_Time__c, Description, Status, Priority, Notify_Immediately__c, Notify_before_task_time__c,
           Notify_Before__c, Hours_Before_Task__c, Facilities__c, Roles__c, Staff__c, ShiftwithStaff__c, AssignToStaff__c, Link_to_Shift__c, CreatedDate,
                                CreatedBy.Name, Participant__c, Participant__r.Display_Nickname__c from task where Owner.name = : objUser.Name OR Staff__c = : staffId ];
            
           
             system.debug('Task '+taskList);
            Set<Id> taskIds = new Set<Id>();

                for(Task t : taskList){
                    taskIds.add(t.Id);
                }
                
                Map<Id, List<TaskAttachmentWrapper>> attachmentMap = new Map<Id, List<TaskAttachmentWrapper>>();
                
                for(Task_Attachments__c ta : [
                    SELECT Id,Aws_Json__c,Awsurl__c,TaskId__c,key__c FROM Task_Attachments__c WHERE TaskId__c IN :taskIds]){
                
                    if(!attachmentMap.containsKey(ta.TaskId__c)){
                        attachmentMap.put(ta.TaskId__c, new List<TaskAttachmentWrapper>());
                    }
                
                    TaskAttachmentWrapper att = new TaskAttachmentWrapper();
                    att.Id = ta.Id;
                    att.AwsJson = ta.Aws_Json__c;
                    att.AwsUrl = ta.Awsurl__c;
                    att.TaskId = ta.TaskId__c;
                    att.Key = ta.key__c;
                
                    attachmentMap.get(ta.TaskId__c).add(att);
                }
            for (Task t : taskList) {
                
                                   // Filter by Participant
                    if (!String.isBlank(participantId) &&
                        t.Participant__c != participantId) {
                        continue;
                    }
                
                    // Filter by Staff
                    if (!String.isBlank(filterStaffId) &&
                        t.Staff__c != filterStaffId) {
                        continue;
                    }
                
                    // Filter by Shift
                    if (!String.isBlank(shiftId) && t.ShiftwithStaff__c != shiftId) {
                        continue;
                    }
                
                    // Filter by Task Date
                    /*if (!String.isBlank(taskDate)) {
                
                        Date filterDate = Date.valueOf(taskDate);
                
                        if (t.Task_Date__c != filterDate) {
                            continue;
                        }
                    }*/
                
                if (!String.isBlank(taskDate)) {

                Date filterDate = Date.valueOf(taskDate);
            
                // If Task_Date__c exists, compare with it
                if (t.Task_Date__c != null) {
                    if (t.Task_Date__c != filterDate) {
                        continue;
                    }
                }
                // Otherwise compare using CreatedDate
                else {
                    if (t.CreatedDate.date() != filterDate) {
                        continue;
                    }
                }
            }
                
                taskWrapper tw = new taskWrapper();
                tw.Description = t.Subject;
                tw.Status = t.Status;
                tw.DueDate = t.ActivityDate;
                tw.CreatedByName = t.Owner.Name;
                tw.CreatedByUrl ='';    /// pass dummy url
                tw.taskId = t.Id;
                tw.TaskTitle = t.Task_Tittle__c;
                tw.TaskDate = t.Task_Date__c;
                tw.TaskTime = t.Task_Time__c;
                tw.TaskDescription = t.Description;
                tw.Priority = t.Priority;
                tw.NotifyImmediately = t.Notify_Immediately__c;
                tw.NotifyBeforeTaskTime = t.Notify_before_task_time__c;
                tw.NotifyBefore = t.Notify_Before__c;
                tw.HoursBeforeTask = t.Hours_Before_Task__c;
                tw.FacilityId = t.Facilities__c;
                tw.RoleId = t.Roles__c;
                tw.StaffId = t.Staff__c;
                tw.ShiftWithStaff = t.ShiftwithStaff__c;
                tw.AssignToStaff = t.AssignToStaff__c;
                tw.LinkToShift = t.Link_to_Shift__c;
                tw.CreatedDate = t.CreatedDate;
                tw.CreatedBy = t.CreatedBy.Name;
                tw.ParticipantName = t.Participant__r.Display_Nickname__c;
                tw.ParticipantId = t.Participant__c;
                tw.attachments = attachmentMap.containsKey(t.Id)? attachmentMap.get(t.Id): new List<TaskAttachmentWrapper>();
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
    
     @HttpPost
    global static void updateTask() {
    
        RestResponse res = RestContext.response;
        Map<String,Object> response = new Map<String,Object>();
    
        try {
    
            String body = RestContext.request.requestBody.toString();
            TaskRequest req = (TaskRequest)JSON.deserialize(body, TaskRequest.class);
    
            Task t = [
                SELECT Id, Status, Description FROM Task
                WHERE Id = :req.TaskId
                LIMIT 1
            ];
    
             t.Status = req.Status;
             t.Description = req.Description;
    
            update t;
    
            // Insert only new attachments
            if(req.attachments != null && !req.attachments.isEmpty()){
    
                List<Task_Attachments__c> newAttachments = new List<Task_Attachments__c>();
    
                for(AttachmentRequest a : req.attachments){
    
                    Task_Attachments__c ta = new Task_Attachments__c();
                    ta.TaskId__c = t.Id;
                    ta.Aws_Json__c = a.AwsJson;
                    ta.Awsurl__c = a.AwsUrl;
                    ta.key__c = a.Key;
    
                    newAttachments.add(ta);
                }
    
                if(!newAttachments.isEmpty()){
                    insert newAttachments;
                }
            }
    
            response.put('isSuccess', true);
            response.put('taskId', t.Id);
            response.put('message', 'Task updated successfully');
    
        } catch(Exception e) {
    
            response.put('isSuccess', false);
            response.put('message', e.getMessage());
        }
    
        res.statusCode = 200;
        res.responseBody = Blob.valueOf(JSON.serialize(response));
    }
    
@HttpDelete
global static void deleteTaskAttachment() {

    RestRequest req = RestContext.request;
    RestResponse res = RestContext.response;

    Map<String, Object> responseMap = new Map<String, Object>();

    try {
        String attachmentId = req.params.get('attachmentId');

        if (String.isBlank(attachmentId)) {
            throw new AuraHandledException('attachmentId is required.');
        }

        Task_Attachments__c attachment = [
            SELECT Id
            FROM Task_Attachments__c
            WHERE Id = :attachmentId
            LIMIT 1
        ];

        delete attachment;

        responseMap.put('isSuccess', true);
        responseMap.put('message', 'Task attachment deleted successfully.');

    } catch (Exception e) {

        responseMap.put('isSuccess', false);
        responseMap.put('message', 'Failed to delete task attachment.');
        responseMap.put('error', e.getMessage());
    }

    res.statusCode = 200;
    res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
}
        
    global class taskWrapper {
        global String Description;
        global String Status;
        global Date DueDate;
        global String CreatedByName;
        global string CreatedByUrl;
        global String taskId;
        global string NavigationTo;
        
        global String TaskTitle;
        global Date TaskDate;
        global Time TaskTime;
        global String TaskDescription;
        global String Priority;
        global Boolean NotifyImmediately;
        global Boolean NotifyBeforeTaskTime;
        global String NotifyBefore;
        global Decimal HoursBeforeTask;
        global Id FacilityId;
        global String RoleId;
        global Id StaffId;
        global Id ShiftWithStaff;
        global Boolean AssignToStaff;
        global Boolean LinkToShift;
        global Datetime CreatedDate;
        global String CreatedBy;
        global Id ParticipantId;
        global String ParticipantName;
        global List<TaskAttachmentWrapper> attachments;

        
    }
    
    global class TaskAttachmentWrapper {
    global Id Id;
    global String AwsJson;
    global String AwsUrl;
    global Id TaskId;
    global String Key;
   }
    
        global class TaskRequest {
        global Id TaskId;
        global String Subject;
        global String TaskTitle;
        global Date TaskDate;
        global Time TaskTime;
        global String Description;
        global String Priority;
        global Id ParticipantId;
        global Id StaffId;
        global String Status;    
        global List<AttachmentRequest> attachments;
    }

    global class AttachmentRequest {
        global String AwsJson;
        global String AwsUrl;
        global String Key;
    }
}