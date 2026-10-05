@RestResource(urlMapping='/bankMobiletask/*')
global without sharing class  MobileAppTaskCreateHandler {

    // Request wrapper
    global class TaskRequest {
        public String AccountNumber;
        public String AccountName;
        public String BSB;
        public String StaffId;
        public String Subject;
        public String Description;
    }
    
    // Request wrapper
    global class TaskRequestUpdate {
        public String AccountNumber;
        public String AccountName;
        public String BSB;
        public String StaffId;
        public String taskId;
        public String approverComments;
    }

    // Response wrapper
    global class TaskResponse {
        public Boolean success;
        public String message;
        public String taskId;

        public TaskResponse(Boolean success, String message, String taskId) {
            this.success = success;
            this.message = message;
            this.taskId = taskId;
        }
    }

    @HttpPost
    global static TaskResponse createTask() {

        try {
            // Read request body
            String requestBody = RestContext.request.requestBody.toString();

            System.debug('Request Body >>> ' + requestBody );
            
            TaskRequest requestData =
                (TaskRequest) JSON.deserialize(
                    requestBody,
                    TaskRequest.class
                );
            System.debug('Request Data >>> ' + JSON.serialize(requestData) );
            System.debug('AccountNumber >>> ' + requestData.AccountNumber );
            System.debug('AccountName >>> ' + requestData.AccountName );
            System.debug('BSB >>> ' + requestData.BSB );
            System.debug('StaffId >>> ' + requestData.StaffId );
            System.debug('Subject >>> ' + requestData.Subject );
            System.debug('Description >>> ' + requestData.Description );
            System.debug(LoggingLevel.INFO, 'Current User Id >>> ' + UserInfo.getUserId() );

            // Get current logged-in user
            User objUser = [
                SELECT Id, Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            // Fetch all NDIS Org Admin users
            List<User> userList = [
                SELECT Id,
                       Name,
                       UserType,
                       IsActive
                FROM User
                WHERE User_Type__c = 'NDIS Org Admin'
                AND IsActive = true AND Organization_Name__c =:objUser.Organization_Name__c
            ];


            // List to hold Tasks
            List<Task> taskList = new List<Task>();

            // Create one Task for each NDIS Org Admin user
            for (User objUserAdmin : userList) {

                Task newTask = new Task();

                newTask.Subject = String.isBlank(requestData.Subject)
                    ? 'Bank Details Request'
                    : requestData.Subject;

                newTask.Description = requestData.Description;
                newTask.Status = 'New';
                newTask.Priority = 'Normal';
                // Custom Task fields
                newTask.Account_Number__c = requestData.AccountNumber;
                newTask.Account_Name__c = requestData.AccountName;
                newTask.BSB__c = requestData.BSB;

                // Keep your existing functionality
                newTask.WhatId = requestData.StaffId;

                // Assign Task to NDIS Org Admin user
                newTask.OwnerId = objUserAdmin.Id;
                newTask.ActivityDate = System.Today()+7;

                taskList.add(newTask);
            }

            // Insert all Tasks
            insert taskList;

            // Collect all created Task IDs
            List<String> taskIds = new List<String>();

            for (Task objTask : taskList) {
                taskIds.add(objTask.Id);
            }

            // Success response
            RestContext.response.statusCode = 201;

            return new TaskResponse(
                true,
                taskList.size() + ' Task(s) created successfully',
                String.join(taskIds, ',')
            );

        } catch (Exception ex) {

            RestContext.response.statusCode = 500;

            return new TaskResponse(
                false,
                'Error creating Task: ' + ex.getMessage(),
                null
            );
        }
    }
    
    @HttpPatch 
    global static TaskResponse updateTask() { 
        try { 
            String requestBody = RestContext.request.requestBody.toString(); 
            TaskRequestUpdate requestData = (TaskRequestUpdate) JSON.deserialize( requestBody, TaskRequestUpdate.class ); 
            
            Task objTask = [ SELECT Id, Status, Account_Number__c, Account_Name__c, BSB__c, WhatId, Approver_Comments__c FROM Task WHERE Id = :requestData.taskId LIMIT 1 ];
            objTask.Status = 'Completed'; 
            objTask.Approver_Comments__c = requestData.approverComments; 
            update objTask; 
            
            Staff__c objStaff = [ SELECT Id, Account_Number__c, Account_Name__c, BSB__c FROM Staff__c WHERE Id = :objTask.WhatId LIMIT 1 ]; 
            objStaff.Account_Number__c = objTask.Account_Number__c; 
            objStaff.Account_Name__c =  objTask.Account_Name__c;  
            objStaff.BSB__c =  objTask.BSB__c; 
            update objStaff;
            
            RestContext.response.statusCode = 200; 
            return new TaskResponse( true, 'Task updated successfully and marked as Completed', objTask.Id ); 
        } catch (Exception ex) { 
            RestContext.response.statusCode = 500; 
            return new TaskResponse( false, 'Error updating Task: ' + ex.getMessage(), null ); 
        } 
    }
}