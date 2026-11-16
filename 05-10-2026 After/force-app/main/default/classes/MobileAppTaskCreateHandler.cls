@RestResource(urlMapping='/bankMobiletask/*')
global without sharing class MobileAppTaskCreateHandler {

    // ================================================================
    // REQUEST WRAPPER (POST — create task)
    // ================================================================
    global class TaskRequest {
        public String AccountNumber;
        public String AccountName;
        public String BSB;
        public String StaffId;
        public String Subject;
        public String Description;
    }

    // ================================================================
    // REQUEST WRAPPER (PATCH — update task)
    // ================================================================
    global class TaskRequestUpdate {
        public String AccountNumber;
        public String AccountName;
        public String BSB;
        public String StaffId;
        public String taskId;
        public String approverComments;
        public String saveOption;   // ✅ ADDED — 'onlyInSystem' | 'bothSystemAndXero'
    }

    // ================================================================
    // RESPONSE WRAPPER
    // ================================================================
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

    // ================================================================
    // HELPER — employment basis mapper
    // (moved here so this class is self-contained)
    // ================================================================
    public static String mapEmploymentBasis(String value) {
        if (String.isBlank(value)) return 'FULLTIME';
        String upperValue = value.toUpperCase();
        if (upperValue.contains('FULL'))   return 'FULLTIME';
        if (upperValue.contains('PART'))   return 'PARTTIME';
        if (upperValue.contains('CASUAL')) return 'CASUAL';
        if (upperValue.contains('LABOUR')) return 'LABOURHIRE';
        if (upperValue.contains('NON'))    return 'NONEMPLOYEE';
        return 'FULLTIME';
    }

    // ================================================================
    // POST — create bank details request tasks
    // ================================================================
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
                WHERE (User_Type__c = 'NDIS Org Admin'
                       OR User_Type__c = 'Roster Manager'
                       OR User_Type__c = 'Facility Admin'
                       OR User_Type__c = 'Roster Coordinator')
                AND IsActive = true
                AND Organization_Name__c = :objUser.Organization_Name__c
            ];

            String bankRequestRef =
                EncodingUtil.convertToHex(Crypto.generateDigest(
                    'SHA1',
                    Blob.valueOf(String.valueOf(Datetime.now().getTime()) + Crypto.getRandomLong())
                )).substring(0,20);

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
                newTask.Bank_Request_Reference__c = bankRequestRef;

                // Assign Task to NDIS Org Admin user
                newTask.OwnerId = objUserAdmin.Id;
                newTask.ActivityDate = System.Today() + 7;

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

    // ================================================================
    // PATCH — update bank details (callout-first)
    // ================================================================
    @HttpPatch
    global static TaskResponse updateTask() {
        try {
            // ============================================================
            // 0) Parse request body
            // ============================================================
            String requestBody = RestContext.request.requestBody.toString();
            TaskRequestUpdate requestData =
                (TaskRequestUpdate) JSON.deserialize(
                    requestBody,
                    TaskRequestUpdate.class
                );

            if (requestData == null || String.isBlank(requestData.taskId)) { RestContext.response.statusCode = 400;return new TaskResponse(false, 'Task Id is required.', null);
            }

            // ✅ Default saveOption for older clients that don't send it
            if (String.isBlank(requestData.saveOption)) {
                requestData.saveOption = 'onlyInSystem';
            }

            // ============================================================
            // 1) Get the selected task and its shared reference
            // ============================================================
            List<Task> tasks = [
                SELECT Id, Status,
                    Account_Number__c, Account_Name__c, BSB__c,
                    WhatId, Approver_Comments__c,
                    Bank_Request_Reference__c
                FROM Task
                WHERE Id = :requestData.taskId
                LIMIT 1
            ];

            if (tasks.isEmpty()) {RestContext.response.statusCode = 404;return new TaskResponse( false, 'No Task found for Task Id: ' + requestData.taskId,null);
            }

            Task selectedTask = tasks[0];

            if (selectedTask.WhatId == null) {RestContext.response.statusCode = 400;return new TaskResponse( false,'Task does not have a Staff record.', null);
            }

            // ============================================================
            // 2) Fetch the Staff record with ALL fields required
            //    (matching the AuraEnabled version — same field set)
            // ============================================================
            List<Staff__c> staffs = [
                SELECT Id, NameToDisplay__c, Name, Last_Name__c, Date_of_Birth__c,
                    Email_Address__c, Contact_Number__c,
                    address__Street__s, address__City__s,
                    address__StateCode__s, Address__CountryCode__s,
                    Address__PostalCode__s,
                    Gender__c, Xero_Employee_ID__c,
                    Job_Title__c,
                    TFN_number__c,
                    Residency_Status__c,
                    Tax_Free_Threshold__c,
                    Superannuation_Name__c,
                    Superannuation_Number__c,
                    Account_Name__c, BSB__c, Account_Number__c,
                    (
                        SELECT Id, Type_of_Job__c, Primary__c
                        FROM StaffRoles__r
                        WHERE Primary__c = true
                        LIMIT 1
                    )
                FROM Staff__c
                WHERE Id = :selectedTask.WhatId
                LIMIT 1
            ];

            if (staffs.isEmpty()) {RestContext.response.statusCode = 404; return new TaskResponse( false, 'No Staff found for WhatId: ' + selectedTask.WhatId, null
                );
            }

            Staff__c objStaff = staffs[0];

            // -------- Derive employment basis --------
            String employmentBasis = 'FULLTIME';
            if (objStaff.StaffRoles__r != null && !objStaff.StaffRoles__r.isEmpty()) {String typeOfJob = objStaff.StaffRoles__r[0].Type_of_Job__c;if (String.isNotBlank(typeOfJob)) {employmentBasis = mapEmploymentBasis(typeOfJob);
                }
            }

            // -------- Derive tax-free threshold --------
            Boolean taxFreeThreshold = true;
            if (String.isNotBlank(objStaff.Tax_Free_Threshold__c)) { String tft = objStaff.Tax_Free_Threshold__c.trim().toLowerCase();taxFreeThreshold = (tft == 'yes' || tft == 'true' || tft == '1'); }

            // ============================================================
            // 3) CALLOUT PHASE — must come BEFORE any DML
            //    If Xero fails, we return an error response and NOTHING
            //    is committed to the database (clean rollback).
            // ============================================================
            if (requestData.saveOption == 'bothSystemAndXero' && String.isNotBlank(objStaff.Xero_Employee_ID__c)) { Staff__c previewStaff = objStaff.clone(false, false, false, false); previewStaff.Id                = objStaff.Id; previewStaff.Account_Name__c   = selectedTask.Account_Name__c;previewStaff.Account_Number__c = selectedTask.Account_Number__c; previewStaff.BSB__c            = selectedTask.BSB__c; String accessToken = XeroIntegrationController.getAccessTokenFromXero(); String tenantId    = XeroIntegrationController.getTenantId(accessToken); XeroIntegrationController.updateXeroEmployee(accessToken, tenantId, previewStaff,employmentBasis, taxFreeThreshold );

                System.debug('✅ Xero callout succeeded for Staff: ' + objStaff.Id);
            }

            // ============================================================
            // 4) DML PHASE — only runs if all callouts succeeded above
            // ============================================================

            // ---- 4a) Apply bank details to Staff ----
            if (requestData.saveOption == 'bothSystemAndXero'
                || requestData.saveOption == 'onlyInSystem') {

                objStaff.Account_Name__c   = selectedTask.Account_Name__c;
                objStaff.Account_Number__c = selectedTask.Account_Number__c;
                objStaff.BSB__c            = selectedTask.BSB__c;
                update objStaff;
                System.debug('✅ Bank details updated for Staff: ' + objStaff.Id);
            }

            // ---- 4b) Mark all related tasks as Completed ----
            List<Task> relatedTasks = [
                SELECT Id, Status, Approver_Comments__c
                FROM Task
                WHERE Bank_Request_Reference__c = :selectedTask.Bank_Request_Reference__c
            ];

            for (Task t : relatedTasks) {
                t.Status = 'Completed';
                t.Approver_Comments__c = requestData.approverComments;
            }

            if (!relatedTasks.isEmpty()) {
                update relatedTasks;
                System.debug('✅ ' + relatedTasks.size() + ' related task(s) marked Completed.');
            }

            // ============================================================
            // 5) Success response
            // ============================================================
            RestContext.response.statusCode = 200;
            return new TaskResponse(
                true,
                relatedTasks.size() + ' Task(s) updated successfully and marked as Completed',
                selectedTask.Id
            );

        } catch (Exception ex) {
            // ============================================================
            // 6) Error response — Xero failures, DML failures, anything.
            //    Since all callouts ran before DML, no partial commit
            //    happened. The whole transaction rolls back cleanly.
            // ============================================================
            RestContext.response.statusCode = 500;
            return new TaskResponse(
                false,
                'Error updating Task: ' + ex.getMessage(),
                null
            );
        }
    }
}