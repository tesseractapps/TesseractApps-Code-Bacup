@isTest
public class MobileAppTaskTestClass {
    
    @testSetup
    static void setupTestData() {
        // Create Organisation
        Organisation__c org = new Organisation__c();
        org.Name = 'Ashfield Consultants';
        org.ABN__c = '11234567891';
        org.ACN__c = '878787878';
        org.Contact_No__c = '6132899740';
        org.RCTI__c = 'RCTI1';
        org.Email__c = 'dsfdsfsd@gmail.com';
        org.Bank__c = 'Bank Test';
        org.BSB__c = 'BSB Test';
        org.Account_Name__c = 'Test Account';
        org.Account_Number__c = '1111111111';
        org.Description__c = 'test Desc';
        org.Address_Latest__Street__s = '101';
        org.Address_Latest__City__s = 'Himas Waterhen';
        org.Address_Latest__PostalCode__s = '2060';
        org.Address_Latest__CountryCode__s = 'AU';
        org.Address_Latest__StateCode__s = 'NSW';
        org.NDIS_Provider__c = '12341234565';
        org.BMSI_Identifier__c = 'TEST BMSI';
        org.SoftwareId__c = 'jhdfn18328';
        org.Branch_code__c = 'BS123';
        org.Contact_Name__c = 'Test Contact';
        org.User_Type__c = 'NDIS Org Admin';
        insert org;

        // Create Profile
        Profile prof = [SELECT Id, Name FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];

        // Create User
        User user = new User(
            Alias = 'praveen',
            Email = 'manualtesting.20923443@hotmail.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'StaffOne2094633',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey = 'America/New_York',
            UserName = 'manualtesting.20923443@hotmail.com',
            Organization_Name__c = 'Ashfield Consultants'
        );
        insert user;

        System.runAs(user) {
            // Create Facility
            Facility__c fac = new Facility__c();
            fac.Name = 'Test Facility';
            fac.Address__City__s = 'Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s = 'ACT';
            fac.Address__PostalCode__s = '2911';
            fac.Address__CountryCode__s = 'AU';
            fac.Email__c = 'testfacility@gmail.com';
            fac.Status__c = true;
            fac.Organisation__c = org.Id;
            fac.ABN__c = '12345678901';
            fac.Phone__c = '12323432';
            fac.Type_of_Service__c = 'Ndis';
            insert fac;

            // Create Staff
            Staff__c st = new Staff__c();
            st.Last_Name__c = 'Test staff';
            st.Name = 'praveen1';
            st.Name__c = 'abcd';
            st.Contact_Number__c = '56789908743';
            st.Email_Address__c = user.Email;
            st.Facility__c = fac.Id;
            st.Address__Street__s = '8 Keewong Street';
            st.Address__City__s = 'Crace';
            st.Address__StateCode__s = 'ACT';
            st.Address__PostalCode__s = '2911';
            st.Address__CountryCode__s = 'AU';
            st.Emergency_Phone_Number__c = '45678766675';
            st.Primary_Contact_Name__c = 'Praveen';
            st.Primary_Contact_Number__c = '9908458298';
            st.Make_Primary_as_Approver__c = true;
            st.Primary_Contact_Email__c = 'praveenshesham.sp@gmail.com';
            st.Secondary_Contact_Name__c = 'maheswari';
            st.Secondary_Contact_Email__c = 'maheswari.adabala@gmail.com';
            st.Make_Secondary_as_Approver__c = false;
            st.Secondary_Contact_Number__c = '99084582958';
            st.Emp_exit_date__c = Date.newInstance(2028, 1, 5);
            st.Emp_Start_Date__c = Date.newInstance(2023, 2, 1);
            st.Payee_ETP_Payment_Date__c = Date.newInstance(2025, 2, 4);
            st.Date_Of_Birth__c = Date.newInstance(2001, 2, 4);
            st.Role__c = 'Admin';
            st.Residency_Type__c = 'Australian';
            st.Expiry_Date__c = Date.newInstance(2025, 2, 19);
            st.Type__c = 'Visa Status';
            st.Working_Hours_Rate__c = 50;
            st.Final_Overall_Rate__c = 150;
            st.Saturday_Hourly_Rate__c = 130;
            st.Sunday_Hourly_Rate__c = 50;
            st.Status__c = true;
            insert st;

            // Create Participant
            Client__c cli = new Client__c();
            cli.First_Name__c = 'Test';
            cli.Last_Name__c = 'Participant2948';
            cli.Gendar__c = 'Male';
            cli.Date_Of_Birth__c = Date.newInstance(1991, 2, 17);
            cli.Address__Street__s = '8 Keewong Street';
            cli.Address__City__s = 'Crace';
            cli.Address__StateCode__s = 'ACT';
            cli.Address__PostalCode__s = '2911';
            cli.Contact_Number__c = '4331237651';
            cli.Drivers_Licence__c = '123456789012';
            cli.Primay_Contact_First_Name__c = 'Jason';
            cli.Primay_Contact_Last_Name__c = 'Smith';
            cli.Relationship__c = 'Parent';
            cli.Email__c = 'manualtesting.4139559@hotmail.com';
            cli.Primary_Contact_Number__c = '0433123123';
      
            insert cli;

            // Create Add_Shift
            Add_Shift__c shift = new Add_Shift__c();
            shift.Break__c = '30';
            shift.Do_you_want_to_set_this_a_recurring_shif__c = true;
            shift.Start_Date__c = Date.newInstance(2024, 10, 16);
            shift.End_Date__c = Date.newInstance(2024, 10, 24);
            shift.Role__c = 'Admin';
            shift.Get_Facility__c = true;
            shift.Quantity__c = 5;
            shift.Start_Time__c = Time.newInstance(3, 30, 0, 0);
            shift.End_Time__c = Time.newInstance(5, 0, 0, 0);
            shift.Facility__c = fac.Id;
            shift.Status__c = 'Draft';
            shift.Start_time_picklist__c = '3:30 am';
            shift.End_time_picklist__c = '5:00 am';
            shift.Location__StateCode__s = 'ACT';
            shift.Location__CountryCode__s = 'AU';
            shift.Location__PostalCode__s = '2911';
            shift.Is_EOI__c = true;
            shift.EOI_staff__c = st.Id;
            shift.Shift_Type__c = 'General';
            insert shift;

            // Create ShiftwithStaff
            ShiftwithStaff__c shiftStaff = new ShiftwithStaff__c();
            shiftStaff.Add_Shift__c = shift.Id;
            shiftStaff.Attendence__c = true;
            shiftStaff.Comments__c = 'test comments';
            shiftStaff.Staff__c = st.Id;
            shiftStaff.Role__c = 'Admin';
            shiftStaff.Status__c = 'Accepted';
            shiftStaff.Log_In_Date_Time__c = Time.newInstance(1, 30, 0, 0);
            shiftStaff.Log_Out_Date_Time__c = Time.newInstance(10, 0, 0, 0);
            insert shiftStaff;

            // Create Tasks with different types
            List<Task> tasks = new List<Task>();

            // Task 1: Approval Request
            Task task1 = new Task();
            task1.OwnerId = user.Id;
            task1.Subject = 'Approval Request';
            task1.Status = 'New';
            task1.ActivityDate = Date.today();
            task1.Task_Tittle__c = 'Approval Task 1';
            task1.Task_Date__c = Date.today();
            task1.Task_Time__c = Time.newInstance(10, 0, 0, 0);
            task1.Description = 'Approval request description';
            task1.Priority = 'High';
            task1.Notify_Immediately__c = true;
            task1.Notify_before_task_time__c = true;
            task1.Notify_Before__c = '1 Hour';
            task1.Hours_Before_Task__c = 1;
            task1.Facilities__c = fac.Id;
            task1.Roles__c = 'Admin';
            task1.Staff__c = st.Id;
            task1.ShiftwithStaff__c = shiftStaff.Id;
            task1.AssignToStaff__c = true;
            task1.Link_to_Shift__c = true;
            task1.Participant__c = cli.Id;
            tasks.add(task1);

            // Task 2: Leave Request
            Task task2 = new Task();
            task2.OwnerId = user.Id;
            task2.Subject = 'Leave Request';
            task2.Status = 'In Progress';
            task2.ActivityDate = Date.today().addDays(5);
            task2.Task_Tittle__c = 'Leave Task 2';
            task2.Task_Date__c = Date.today().addDays(5);
            task2.Task_Time__c = Time.newInstance(14, 30, 0, 0);
            task2.Description = 'Leave request description';
            task2.Priority = 'Medium';
            task2.Notify_Immediately__c = false;
            task2.Notify_before_task_time__c = true;
            task2.Notify_Before__c = '2 Hours';
            task2.Hours_Before_Task__c = 2;
            task2.Facilities__c = fac.Id;
            task2.Roles__c = 'Admin';
            task2.Staff__c = st.Id;
            task2.ShiftwithStaff__c = shiftStaff.Id;
            task2.AssignToStaff__c = false;
            task2.Link_to_Shift__c = false;
            task2.Participant__c = cli.Id;
            tasks.add(task2);

            // Task 3: Incident Register
            Task task3 = new Task();
            task3.OwnerId = user.Id;
            task3.Subject = 'Incident Register';
            task3.Status = 'Completed';
            task3.ActivityDate = Date.today().addDays(10);
            task3.Task_Tittle__c = 'Incident Task 3';
            task3.Task_Date__c = Date.today().addDays(10);
            task3.Task_Time__c = Time.newInstance(9, 0, 0, 0);
            task3.Description = 'Incident register description';
            task3.Priority = 'High';
            task3.Notify_Immediately__c = true;
            task3.Notify_before_task_time__c = false;
            task3.Notify_Before__c = '30 Minutes';
            task3.Hours_Before_Task__c = 0.5;
            task3.Facilities__c = fac.Id;
            task3.Roles__c = 'Admin';
            task3.Staff__c = st.Id;
            task3.ShiftwithStaff__c = shiftStaff.Id;
            task3.AssignToStaff__c = true;
            task3.Link_to_Shift__c = true;
            task3.Participant__c = cli.Id;
            tasks.add(task3);

            // Task 4: Random Task (Other)
            Task task4 = new Task();
            task4.OwnerId = user.Id;
            task4.Subject = 'General Task';
            task4.Status = 'New';
            task4.ActivityDate = Date.today().addDays(15);
            task4.Task_Tittle__c = 'General Task 4';
            task4.Task_Date__c = Date.today().addDays(15);
            task4.Task_Time__c = Time.newInstance(16, 0, 0, 0);
            task4.Description = 'General task description';
            task4.Priority = 'Low';
            task4.Notify_Immediately__c = false;
            task4.Notify_before_task_time__c = false;
            task4.Notify_Before__c = 'None';
            task4.Hours_Before_Task__c = 0;
            task4.Facilities__c = fac.Id;
            task4.Roles__c = 'Admin';
            task4.Staff__c = st.Id;
            task4.ShiftwithStaff__c = shiftStaff.Id;
            task4.AssignToStaff__c = false;
            task4.Link_to_Shift__c = false;
            task4.Participant__c = cli.Id;
            tasks.add(task4);

            insert tasks;

            // Create Task Attachments
            List<Task_Attachments__c> attachments = new List<Task_Attachments__c>();
            
            for (Task t : tasks) {
                Task_Attachments__c att1 = new Task_Attachments__c();
                att1.TaskId__c = t.Id;
                att1.Aws_Json__c = '{"file":"test1.json"}';
                att1.Awsurl__c = 'https://test-bucket.s3.amazonaws.com/file1.txt';
                att1.key__c = 'file1.txt';
                attachments.add(att1);

                Task_Attachments__c att2 = new Task_Attachments__c();
                att2.TaskId__c = t.Id;
                att2.Aws_Json__c = '{"file":"test2.json"}';
                att2.Awsurl__c = 'https://test-bucket.s3.amazonaws.com/file2.txt';
                att2.key__c = 'file2.txt';
                attachments.add(att2);
            }
            
            insert attachments;
        }
    }

    // Test 1: Get Task Details - Success
    @isTest
    static void testGetTaskDetails_Success() {
        User testUser = [SELECT Id, Email FROM User WHERE Email = 'manualtesting.20923443@hotmail.com' LIMIT 1];
        
        System.runAs(testUser) {
            Test.startTest();
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/FetchTask/';
            req.httpMethod = 'GET';
            RestContext.request = req;
            RestContext.response = res;
            
            mobileAppTaskHandler.getTaskDetails();
            
            Test.stopTest();
        }
    }

    // Test 2: Get Task Details with Participant Filter
    @isTest
    static void testGetTaskDetails_FilterByParticipant() {
        User testUser = [SELECT Id, Email FROM User WHERE Email = 'manualtesting.20923443@hotmail.com' LIMIT 1];
        Client__c participant = [SELECT Id FROM Client__c LIMIT 1];
        
        System.runAs(testUser) {
            Test.startTest();
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/FetchTask/';
            req.httpMethod = 'GET';
            req.params.put('participantId', participant.Id);
            
            RestContext.request = req;
            RestContext.response = res;
            
            mobileAppTaskHandler.getTaskDetails();
            
            Test.stopTest();
        }
    }

    // Test 3: Get Task Details with Staff Filter
    @isTest
    static void testGetTaskDetails_FilterByStaff() {
        User testUser = [SELECT Id, Email FROM User WHERE Email = 'manualtesting.20923443@hotmail.com' LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        System.runAs(testUser) {
            Test.startTest();
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/FetchTask/';
            req.httpMethod = 'GET';
            req.params.put('staffId', staff.Id);
            
            RestContext.request = req;
            RestContext.response = res;
            
            mobileAppTaskHandler.getTaskDetails();
            
            Test.stopTest();
        }
    }

    // Test 4: Get Task Details with Shift Filter
    @isTest
    static void testGetTaskDetails_FilterByShift() {
        User testUser = [SELECT Id, Email FROM User WHERE Email = 'manualtesting.20923443@hotmail.com' LIMIT 1];
        ShiftwithStaff__c shiftStaff = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        
        System.runAs(testUser) {
            Test.startTest();
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/FetchTask/';
            req.httpMethod = 'GET';
            req.params.put('shiftId', shiftStaff.Id);
            
            RestContext.request = req;
            RestContext.response = res;
            
            mobileAppTaskHandler.getTaskDetails();
            
            Test.stopTest();
        }
    }

    // Test 5: Get Task Details with Task Date Filter
    @isTest
    static void testGetTaskDetails_FilterByTaskDate() {
        User testUser = [SELECT Id, Email FROM User WHERE Email = 'manualtesting.20923443@hotmail.com' LIMIT 1];
        
        System.runAs(testUser) {
            Test.startTest();
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/FetchTask/';
            req.httpMethod = 'GET';
            req.params.put('taskDate', String.valueOf(Date.today()));
            
            RestContext.request = req;
            RestContext.response = res;
            
            mobileAppTaskHandler.getTaskDetails();
            
            Test.stopTest();
        }
    }

    // Test 6: Get Task Details with all filters combined
    @isTest
    static void testGetTaskDetails_AllFilters() {
        User testUser = [SELECT Id, Email FROM User WHERE Email = 'manualtesting.20923443@hotmail.com' LIMIT 1];
        Client__c participant = [SELECT Id FROM Client__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        ShiftwithStaff__c shiftStaff = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        
        System.runAs(testUser) {
            Test.startTest();
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/FetchTask/';
            req.httpMethod = 'GET';
            req.params.put('participantId', participant.Id);
            req.params.put('staffId', staff.Id);
            req.params.put('shiftId', shiftStaff.Id);
            req.params.put('taskDate', String.valueOf(Date.today()));
            
            RestContext.request = req;
            RestContext.response = res;
            
            mobileAppTaskHandler.getTaskDetails();
            
            Test.stopTest();
        }
    }

    // Test 7: Update Task - Success
    @isTest
    static void testUpdateTask_Success() {
        User testUser = [SELECT Id, Email FROM User WHERE Email = 'manualtesting.20923443@hotmail.com' LIMIT 1];
        Task task = [SELECT Id, Status, Description FROM Task WHERE Subject = 'Approval Request' LIMIT 1];
        
        System.runAs(testUser) {
            Test.startTest();
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/FetchTask/';
            req.httpMethod = 'POST';
            
            // Create request body
            String jsonBody = '{' +
                '"TaskId": "' + task.Id + '",' +
                '"Status": "Completed",' +
                '"Description": "Updated description",' +
                '"attachments": []' +
            '}';
            
            req.requestBody = Blob.valueOf(jsonBody);
            RestContext.request = req;
            RestContext.response = res;
            
            mobileAppTaskHandler.updateTask();
            
            Test.stopTest();
        }
    }

    // Test 8: Update Task with new attachments
    @isTest
    static void testUpdateTask_WithAttachments() {
        User testUser = [SELECT Id, Email FROM User WHERE Email = 'manualtesting.20923443@hotmail.com' LIMIT 1];
        Task task = [SELECT Id, Status, Description FROM Task WHERE Subject = 'Leave Request' LIMIT 1];
        
        System.runAs(testUser) {
            Test.startTest();
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/FetchTask/';
            req.httpMethod = 'POST';
            
            // Create request body with attachments
            String jsonBody = '{' +
                '"TaskId": "' + task.Id + '",' +
                '"Status": "In Progress",' +
                '"Description": "Updated with attachments",' +
                '"attachments": [' +
                    '{' +
                        '"AwsJson": "{\"file\":\"newfile.json\"}",' +
                        '"AwsUrl": "https://test-bucket.s3.amazonaws.com/newfile.txt",' +
                        '"Key": "newfile.txt"' +
                    '},' +
                    '{' +
                        '"AwsJson": "{\"file\":\"another.json\"}",' +
                        '"AwsUrl": "https://test-bucket.s3.amazonaws.com/another.txt",' +
                        '"Key": "another.txt"' +
                    '}' +
                ']' +
            '}';
            
            req.requestBody = Blob.valueOf(jsonBody);
            RestContext.request = req;
            RestContext.response = res;
            
            mobileAppTaskHandler.updateTask();
            
            Test.stopTest();
        }
    }

    // Test 9: Update Task - Exception (invalid task ID)
    @isTest
    static void testUpdateTask_InvalidTaskId() {
        User testUser = [SELECT Id, Email FROM User WHERE Email = 'manualtesting.20923443@hotmail.com' LIMIT 1];
        
        System.runAs(testUser) {
            Test.startTest();
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/FetchTask/';
            req.httpMethod = 'POST';
            
            // Create request body with invalid TaskId
            String jsonBody = '{' +
                '"TaskId": "a0B000000000001",' +
                '"Status": "Completed",' +
                '"Description": "This should fail"' +
            '}';
            
            req.requestBody = Blob.valueOf(jsonBody);
            RestContext.request = req;
            RestContext.response = res;
            
            mobileAppTaskHandler.updateTask();
            
            Test.stopTest();
        }
    }

    // Test 10: Delete Task Attachment - Success
    @isTest
    static void testDeleteTaskAttachment_Success() {
        User testUser = [SELECT Id, Email FROM User WHERE Email = 'manualtesting.20923443@hotmail.com' LIMIT 1];
        Task_Attachments__c attachment = [SELECT Id FROM Task_Attachments__c LIMIT 1];
        
        System.runAs(testUser) {
            Test.startTest();
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/FetchTask/';
            req.httpMethod = 'DELETE';
            req.params.put('attachmentId', attachment.Id);
            
            RestContext.request = req;
            RestContext.response = res;
            
            mobileAppTaskHandler.deleteTaskAttachment();
            
            Test.stopTest();
        }
    }

    // Test 11: Delete Task Attachment - Missing attachmentId
    @isTest
    static void testDeleteTaskAttachment_MissingId() {
        User testUser = [SELECT Id, Email FROM User WHERE Email = 'manualtesting.20923443@hotmail.com' LIMIT 1];
        
        System.runAs(testUser) {
            Test.startTest();
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/FetchTask/';
            req.httpMethod = 'DELETE';
            // No attachmentId parameter
            
            RestContext.request = req;
            RestContext.response = res;
            
            mobileAppTaskHandler.deleteTaskAttachment();
            
            Test.stopTest();
        }
    }

    // Test 12: Delete Task Attachment - Invalid attachmentId
    @isTest
    static void testDeleteTaskAttachment_InvalidId() {
        User testUser = [SELECT Id, Email FROM User WHERE Email = 'manualtesting.20923443@hotmail.com' LIMIT 1];
        
        System.runAs(testUser) {
            Test.startTest();
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/FetchTask/';
            req.httpMethod = 'DELETE';
            req.params.put('attachmentId', 'a0B000000000001');
            
            RestContext.request = req;
            RestContext.response = res;
            
            mobileAppTaskHandler.deleteTaskAttachment();
            
            Test.stopTest();
        }
    }

    // Test 13: Get Task Details with CreatedDate filter (when Task_Date__c is null)
    @isTest
    static void testGetTaskDetails_FilterByCreatedDate() {
        User testUser = [SELECT Id, Email FROM User WHERE Email = 'manualtesting.20923443@hotmail.com' LIMIT 1];
        
        // Create a task with null Task_Date__c
        Task taskWithNullDate = new Task();
        taskWithNullDate.OwnerId = testUser.Id;
        taskWithNullDate.Subject = 'Task with Null Date';
        taskWithNullDate.Status = 'New';
        taskWithNullDate.ActivityDate = Date.today();
        taskWithNullDate.Task_Date__c = null;
        taskWithNullDate.Description = 'Task with no task date';
        insert taskWithNullDate;
        
        System.runAs(testUser) {
            Test.startTest();
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/FetchTask/';
            req.httpMethod = 'GET';
            req.params.put('taskDate', String.valueOf(Date.today()));
            
            RestContext.request = req;
            RestContext.response = res;
            
            mobileAppTaskHandler.getTaskDetails();
            
            Test.stopTest();
        }
    }

    // Test 14: Get Task Details - NavigationTo mapping
    @isTest
    static void testGetTaskDetails_NavigationMapping() {
        User testUser = [SELECT Id, Email FROM User WHERE Email = 'manualtesting.20923443@hotmail.com' LIMIT 1];
        
        System.runAs(testUser) {
            Test.startTest();
            
            // Create tasks with different subjects to test navigation mapping
            List<Task> navTasks = new List<Task>();
            
            // Approval Request -> Submissions
            Task approvalTask = new Task();
            approvalTask.OwnerId = testUser.Id;
            approvalTask.Subject = 'Approval Request';
            approvalTask.Status = 'New';
            approvalTask.ActivityDate = Date.today();
            navTasks.add(approvalTask);
            
            // Leave Request -> Leave Management
            Task leaveTask = new Task();
            leaveTask.OwnerId = testUser.Id;
            leaveTask.Subject = 'Leave Request';
            leaveTask.Status = 'New';
            leaveTask.ActivityDate = Date.today();
            navTasks.add(leaveTask);
            
            // Incident Register -> Incident Register
            Task incidentTask = new Task();
            incidentTask.OwnerId = testUser.Id;
            incidentTask.Subject = 'Incident Register';
            incidentTask.Status = 'New';
            incidentTask.ActivityDate = Date.today();
            navTasks.add(incidentTask);
            
            // Other -> Do Not Navigate
            Task otherTask = new Task();
            otherTask.OwnerId = testUser.Id;
            otherTask.Subject = 'Other Subject';
            otherTask.Status = 'New';
            otherTask.ActivityDate = Date.today();
            navTasks.add(otherTask);
            
            insert navTasks;
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/FetchTask/';
            req.httpMethod = 'GET';
            
            RestContext.request = req;
            RestContext.response = res;
            
            mobileAppTaskHandler.getTaskDetails();
            
            Test.stopTest();
        }
    }

    // Test 15: Get Task Details - With attachments
    @isTest
    static void testGetTaskDetails_WithAttachments() {
        User testUser = [SELECT Id, Email FROM User WHERE Email = 'manualtesting.20923443@hotmail.com' LIMIT 1];
        
        System.runAs(testUser) {
            Test.startTest();
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/FetchTask/';
            req.httpMethod = 'GET';
            
            RestContext.request = req;
            RestContext.response = res;
            
            mobileAppTaskHandler.getTaskDetails();
            
            Test.stopTest();
        }
    }
}