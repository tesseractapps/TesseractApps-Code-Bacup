/**
* @description       : 
* @author            : Raja Sekhar Reddy
* @group             : 
* @last modified on  : 06-18-2023
* @last modified by  : Raja Sekhar Reddy
**/
public with sharing class TaskCreateHandler {
    @AuraEnabled
    public static list<User> listOfUsers(String recordId){
         User u = [SELECT Id, Name,Organization_Name__c, Full_Name__c FROM User WHERE ID =:UserInfo.getUserId()];
        return [select id,name,Full_Name__c from User WHERE Organization_Name__c =:u.Organization_Name__c AND IsActive =true];
    }

    @AuraEnabled
    public static String getOrgName(){
        User u = [SELECT Id, Name,Organization_Name__c FROM User WHERE ID =:UserInfo.getUserId()];
        return u.Organization_Name__c;
    }

    @AuraEnabled
    public static Organisation__c getOrgLogo(){
        User u1 = [SELECT Id, Name,Organization_Name__c FROM User WHERE ID =:UserInfo.getUserId()];
        Organisation__c logo = [select id,Name,ABN__c,Contact_No__c from Organisation__c WHERE Name=:u1.Organization_Name__c];//Organization_Logo__c
		
        //Made by maheswari 17-04-2024 commented line no-26 to 33 and 35
        /* Matcher imgMatcher = Pattern.compile( '<p(.+?)>' ).matcher( logo.Organization_Logo__c );
        string decodedURL;
        // iterate each image tag found
        while ( imgMatcher.find() ) {
            String imageTag = imgMatcher.group(); String imageURL = imageTag.substringBetween( ' src="', '"' );
            decodedURL = imageURL.unescapeHtml4();
        }*/
        
		return logo;
        //return decodedURL; to get the contact number in organization
    }
    
    @AuraEnabled
    public static void createTaskRecord(String userId,String statusValue,String subjectValue,
                                        String priorityValue, String dueDateValue,String commentsValue){
                                            Task taskRec = new Task();
                                            taskRec.OwnerId=userId;
                                            taskRec.Status=statusValue;
                                            taskRec.Subject=subjectValue;
                                            taskRec.Priority=priorityValue;
                                            if(String.isNotBlank(dueDateValue)){
                                                taskRec.ActivityDate=Date.valueOf(dueDateValue);
                                            }
                                            taskRec.Description=commentsValue;
                                            insert taskRec;
                                        }




    @AuraEnabled
    public static Id createTask(Map<String, Object> taskRecord) {

        System.debug('taskRecord ==> ' + JSON.serialize(taskRecord));

        Task taskObj;

        if (
            taskRecord.containsKey('Id') && taskRecord.get('Id') != null && String.valueOf(taskRecord.get('Id')).trim() != '') {

            taskObj = [
                SELECT Id
                FROM Task
                WHERE Id = :String.valueOf(taskRecord.get('Id'))
                LIMIT 1
            ];

        } else {

            taskObj = new Task();

        }

        // Title
        if(taskRecord.containsKey('Title')){
            taskObj.Task_Tittle__c = String.valueOf(taskRecord.get('Title'));
        }

        // Date
        if(taskRecord.containsKey('TaskDate') && taskRecord.get('TaskDate') != null){

            taskObj.Task_Date__c = Date.valueOf(String.valueOf(taskRecord.get('TaskDate')));
        }

        // Time
      /*   if(taskRecord.containsKey('TaskTime') &&
           taskRecord.get('TaskTime') != null){

            String timeStr =
                String.valueOf(taskRecord.get('TaskTime'));

            System.debug('Time String ==> ' + timeStr);

            List<String> timeParts = timeStr.split(':');

            Integer hour = Integer.valueOf(timeParts[0]);
            Integer minute = Integer.valueOf(timeParts[1]);

            taskObj.Task_Time__c =
                Time.newInstance(
                    hour,
                    minute,
                    0,
                    0
                );
        } */

        if (taskRecord.containsKey('TaskTime') && taskRecord.get('TaskTime') != null) {

        String timeStr = String.valueOf(taskRecord.get('TaskTime'));

        if (timeStr.contains(':')) {

            List<String> timeParts = timeStr.split(':');

            Integer hour = Integer.valueOf(timeParts[0]);
            Integer minute = Integer.valueOf(timeParts[1]);

            taskObj.Task_Time__c = Time.newInstance(hour, minute, 0, 0);

        } else {

            Long milliseconds = Long.valueOf(timeStr);

            Integer totalSeconds = (Integer)(milliseconds / 1000);
            Integer hour = totalSeconds / 3600;
            Integer minute = Math.mod(totalSeconds, 3600) / 60;

            taskObj.Task_Time__c = Time.newInstance(hour, minute, 0, 0);
        }
}

        // Comments
        if(taskRecord.containsKey('comments')){
            taskObj.Description =
                String.valueOf(taskRecord.get('comments'));
        }

        // Status
        if(taskRecord.containsKey('status')){
            taskObj.Status =
                String.valueOf(taskRecord.get('status'));
        }

        // Priority
        if(taskRecord.containsKey('priority')){
            taskObj.Priority =
                String.valueOf(taskRecord.get('priority'));
        }

        // Reminder Settings
        if(taskRecord.containsKey('notifyImmediately')){
            taskObj.Notify_Immediately__c =
                (Boolean)taskRecord.get('notifyImmediately');
        }

        if(taskRecord.containsKey('notifyBeforeTask')){
            taskObj.Notify_before_task_time__c =
                (Boolean)taskRecord.get('notifyBeforeTask');
        }

        if(taskRecord.containsKey('hoursBeforeTask') &&
           taskRecord.get('hoursBeforeTask') != null){

            taskObj.Hours_before_Task_time__c =
                Decimal.valueOf(
                    String.valueOf(
                        taskRecord.get('hoursBeforeTask')
                    )
                );
        }

        // Staff
        if(taskRecord.containsKey('staffId')){
            taskObj.Staff__c =
                String.valueOf(taskRecord.get('staffId'));
        }
        if(taskRecord.containsKey('participantId')){
            taskObj.Participant__c = String.valueOf(taskRecord.get('participantId'));
        }

    

        // Shift
        if(taskRecord.containsKey('shiftId')){
            taskObj.ShiftwithStaff__c =
                String.valueOf(taskRecord.get('shiftId'));
        }
         if(taskRecord.containsKey('notificationTiming')){
            taskObj.Notify_Before__c = String.valueOf(taskRecord.get('notificationTiming'));
        }
         if(taskRecord.containsKey('customHours')){
           taskObj.Hours_Before_Task__c = (Decimal) taskRecord.get('customHours');
        }
        if(taskRecord.containsKey('assigntostaff')){
            taskObj.AssignToStaff__c = (Boolean)taskRecord.get('assigntostaff');
        }
        if(taskRecord.containsKey('linktoshift')){
            taskObj.Link_to_Shift__c = (Boolean)taskRecord.get('linktoshift');
        }
        if(taskRecord.containsKey('facilityIds')){

            List<Object> facilities =
                (List<Object>)taskRecord.get('facilityIds');

            List<String> facilityIds = new List<String>();

            for(Object obj : facilities){
                facilityIds.add(String.valueOf(obj));
            }

            taskObj.Facilities__c = String.join(facilityIds, ';');
        }
        if(taskRecord.containsKey('roles')){

            List<Object> roles =
                (List<Object>)taskRecord.get('roles');

            List<String> roleNames = new List<String>();

            for(Object obj : roles){
                roleNames.add(String.valueOf(obj));
            }

            taskObj.Roles__c = String.join(roleNames, ';');
        }

         if (taskObj.Id == null) {
                insert taskObj;
        } else {
                update taskObj;
        }

        if (taskRecord.containsKey('files')) {

            List<Object> files = (List<Object>) taskRecord.get('files');
            List<Task_Attachments__c> docs = new List<Task_Attachments__c>();

            for (Object obj : files) {

               Map<String, Object> file = (Map<String, Object>) JSON.deserializeUntyped(JSON.serialize(obj));

                Task_Attachments__c doc = new Task_Attachments__c();
                doc.TaskId__c = taskObj.Id;
                doc.Awsurl__c = String.valueOf(file.get('url'));
                doc.key__c = String.valueOf(file.get('key'));
                doc.Aws_Json__c = JSON.serialize(file);

                docs.add(doc);
            }

            if (!docs.isEmpty()) {
                insert docs;
            }
        }

        return taskObj.Id;
    }


    @AuraEnabled
    public static List<ShiftwithStaff__c> getParticipantShifts(Id participantId, Date shiftDate) {

        List<Services_and_Support_Plan__c> plans = [
            SELECT ShiftwithStaff__c
            FROM Services_and_Support_Plan__c
            WHERE Client__c = :participantId
            AND Un_Assigned_Service__c = FALSE
            AND ShiftwithStaff__c != NULL AND Date_of_Service__c = :shiftDate
        ];

        Set<Id> shiftIds = new Set<Id>();

        for (Services_and_Support_Plan__c plan : plans) {
            shiftIds.add(plan.ShiftwithStaff__c);
        }

        if (shiftIds.isEmpty()) {
            return new List<ShiftwithStaff__c>();
        }

        return [
            SELECT Id,
                Name,
                Staff__c,
                Staff__r.Display_Nickname__c,Staff__r.picture__c,
                Date__c,
                Role__c,
                Start_Time__c,Type_of_shift__c,
                End_Time__c
            FROM ShiftwithStaff__c
            WHERE Id IN :shiftIds
        ];
    }

   /*  @AuraEnabled
    public static List<Task> getTasksByParticipant(Id participantId) {

    return [

       SELECT Id, Task_Tittle__c, Task_Date__c, Task_Time__c, Description, Status, Priority, Notify_Immediately__c, Notify_before_task_time__c, Facilities__c, Roles__c, Staff__c, ShiftwithStaff__c, AssignToStaff__c, Link_to_Shift__c, CreatedDate, CreatedBy.Name, Participant__c FROM Task
       WHERE Participant__c = :participantId ORDER BY CreatedDate DESC

    ];

} */

 @AuraEnabled
    public static List<Task> getTasksById(Id taskId) {

    return [

       SELECT Id, Task_Tittle__c, Task_Date__c, Task_Time__c, Description, Status, Priority, Notify_Immediately__c, Notify_before_task_time__c, Notify_Before__c, Hours_Before_Task__c, Facilities__c, Roles__c, Staff__c, ShiftwithStaff__c, AssignToStaff__c, Link_to_Shift__c, CreatedDate, CreatedBy.Name, Participant__c FROM Task
       WHERE Id = :taskId ORDER BY CreatedDate DESC

    ];

}

@AuraEnabled
public static List<Task_Attachments__c> getTaskAttachments(Id taskId) {
    return [ SELECT Id, Aws_Json__c,Awsurl__c,key__c, TaskId__c FROM Task_Attachments__c WHERE TaskId__c = :taskId];
}

public class TaskWrapper {
    @AuraEnabled public Task taskRecord;
    @AuraEnabled public List<TaskAttachmentWrapper> attachments;
}

public class TaskAttachmentWrapper {
    @AuraEnabled public Id Id;
    @AuraEnabled public String AwsJson;
    @AuraEnabled public String AwsUrl;
    @AuraEnabled public String Key;
}

@AuraEnabled
public static List<TaskWrapper> getTasksByParticipant(Id participantId) {

    List<Task> taskList = [
        SELECT Id,
               Task_Tittle__c,
               Task_Date__c,
               Task_Time__c,
               Description,
               Status,
               Priority,
               Notify_Immediately__c,
               Notify_before_task_time__c,
               Facilities__c,
               Roles__c,
               Staff__c,
               ShiftwithStaff__c,
               AssignToStaff__c,
               Link_to_Shift__c,
               CreatedDate,
               CreatedBy.Name,
               Participant__c
        FROM Task
        WHERE Participant__c = :participantId
        ORDER BY CreatedDate DESC
    ];

    Set<Id> taskIds = new Set<Id>();

    for (Task t : taskList) {
        taskIds.add(t.Id);
    }

    Map<Id, List<TaskAttachmentWrapper>> attachmentMap =
        new Map<Id, List<TaskAttachmentWrapper>>();

    for (Task_Attachments__c ta : [
        SELECT Id,
               Aws_Json__c,
               Awsurl__c,
               TaskId__c,
               key__c
        FROM Task_Attachments__c
        WHERE TaskId__c IN :taskIds
    ]) {

        if (!attachmentMap.containsKey(ta.TaskId__c)) {
            attachmentMap.put(ta.TaskId__c, new List<TaskAttachmentWrapper>());
        }

        TaskAttachmentWrapper att = new TaskAttachmentWrapper();
        att.Id = ta.Id;
        att.AwsJson = ta.Aws_Json__c;
        att.AwsUrl = ta.Awsurl__c;
        att.Key = ta.key__c;

        attachmentMap.get(ta.TaskId__c).add(att);
    }

    List<TaskWrapper> result = new List<TaskWrapper>();

    for (Task t : taskList) {

        TaskWrapper wrap = new TaskWrapper();
        wrap.taskRecord = t;
        wrap.attachments = attachmentMap.containsKey(t.Id)
            ? attachmentMap.get(t.Id)
            : new List<TaskAttachmentWrapper>();

        result.add(wrap);
    }

    return result;
}


    @AuraEnabled
    public static list<Staff__c> getStaffById(Id recordId) {
        return [SELECT id,Facility__r.Name,SelectedRole__c,Nationality__c,Email_Address__c,Languages__c,Primary_Contact_First_Name__c,Primary_Contact_Last_Name__c,Primary_Contact_Number__c,Secondary_Contact_First_Name__c,Secondary_Contact_Last_Name__c,Secondary_Contact_Number__c,NameToDisplay__c,Status__c,Organization_Name__c,Last_Name__c ,Name,Picture__c,Gender__c,Role__c,Display_Nickname__c,Nursning_Awards__c,Nursing_Category_Type__c,Nursing_Classification_Level__c,Nursing_Classification_Pay_Point__c,Child_Care_Awards__c,
                Facility__c,Age__c,Contact_Number__c,address__Street__s,address__City__s,address__StateCode__s,Pre_Tax_Calculator__c,Make_Primary_as_Approver__c,Make_Secondary_as_Approver__c,Pre_Tax_One_Description__c,Pre_Tax_One_Value__c,Pre_Tax_Two_Description__c,Pre_Tax_Two_Value__c,Pre_Tax_Three_Description__c,Pre_Tax_Three_Value__c,Pre_Tax_Four_Description__c,Pre_Tax_Four_Value__c,Pre_Tax_Five_Description__c,Pre_Tax_Five_Value__c,Post_Tax__c,Post_Tax_Decription__c,
                Working_Hours_Rate__c,Saturday_Hourly_Rate__c,Sunday_Hourly_Rate__c,Public_holiday_Hourly_Rate__c,Afternoon_shift_Hourly_Rate__c,Night_shift_Hourly_Rate__c,Category_Type__c,Type_of_Job__c,Classification_Level__c,Classification_Pay_Point__c,Superannuation_Inc_or_Exc__c,Paid_Break__c,Sleepover_Allowance__c,
                TFN_number__c, ABN_Number__c,Enable_Geolocation__c,Type_of_User__c,Fixed_Rate_or_Not__c,Address__CountryCode__s,Address__PostalCode__s,Voluntary_Contribution__c,Voluntary_Contribution_Fixed__c,Voluntary_Contribution_Percent__c,Attendance__c,Annual_Leave__c,Sick_Leave__c,Parental_Leave__c,Bereavement_Leave__c,State__c,Annual_leave_Accrued__c,Personal_Leave_Accur__c,Facility__r.Organisation__c,Facility__r.Organisation__r.Cash_out__c, Facility__r.Organisation__r.Negative_Balance__c,Facility__r.Organisation__r.Leave_Loading__c,Facility__r.Organisation__r.Leave_Loading_Rate__c,Facility__r.Organisation__r.Other_Leave_Type__c,Type_of_Employe__c,(SELECT Id, RoleName__c, Active__c,Type_of_Job__c,Primary__c  FROM StaffRoles__r WHERE Active__c = true),(select id,Name,Type__c,Expiry_Date__c,View_File__c,Comments__c,Compliance__c,Points__c,Status__c,key__c,Document_Type__c from Child_Staffs__r),(SELECT Id, Annual_Used__c, Personal_Used__c FROM Leaves__r),(Select  Id,Facility__c,Facility__r.Name, Active__c,Staff__c from Staff_Facilities__r WHERE Active__c = true ), (Select id,Email__c,First_Name__c,Last_Name__c, Phone__c, Relationship__c, Name From Staff_Contacts__r) FROM Staff__c where  Id  =: recordId];
    }




}