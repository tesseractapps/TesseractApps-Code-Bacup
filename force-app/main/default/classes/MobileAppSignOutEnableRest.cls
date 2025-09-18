@RestResource(urlMapping='/EnableSignOutApi/*')
global class MobileAppSignOutEnableRest {
    @HttpGet
    global static void enableSignOutButton() {
        RestResponse res = RestContext.response;
        Map<String, Object> responseMap = new Map<String, Object>();
        
        // Variables for push notification
        String notifTitle;
        String notifBody;
        Id staffId;
        
        try {
            RestRequest req = RestContext.request;
            String shiftId = req.params != null ? req.params.get('shiftId') : null;
            String requestedDateStr = req.params != null ? req.params.get('requestedDate') : null;
            String comments = req.params != null ? req.params.get('comments') : null; 
            
            if (String.isBlank(shiftId)) {
                responseMap.put('success', false);
                responseMap.put('message', 'Error: Request input cannot be empty.');                
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }
            
            // Parse requested date
            Date requestedDate;
            if (String.isNotBlank(requestedDateStr)) {
                try {
                    requestedDate = Date.valueOf(requestedDateStr); // expects yyyy-MM-dd
                } catch (Exception e) {
                    requestedDate = System.today();
                }
            } else {
                requestedDate = System.today();
            }
            
            // Fetch shift record
            List<ShiftwithStaff__c> shiftRecords = [
                SELECT Id, CreatedById, CreatedBy.Name, CreatedBy.Email, Date__c, Start_Time__c, End_time__c,Schedule_Sign_Out_Date_Time__c,
                Request_sign_out_comments__c, Enable_Sign_In__c, Enable_Sign_Out__c,
                Staff__c, Staff__r.Name,Staff__r.Email_Address__c,Staff__r.Organization_Full_Name__c
                FROM ShiftwithStaff__c 
                WHERE Id = :shiftId 
                LIMIT 1
            ];
            
            if (shiftRecords.isEmpty()) {
                responseMap.put('success', false);
                responseMap.put('message', 'Error: Shiftwithstaff record not found.');                
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }
            
            ShiftwithStaff__c shiftRecord = shiftRecords[0];
            
            // Get user by email - FIXED: Variable scope and null safety
            User staffUser = null;
            if (shiftRecord.Staff__r != null && String.isNotBlank(shiftRecord.Staff__r.Email_Address__c)) {
                List<User> staffUsers = [SELECT Id, Email FROM User WHERE Email = :shiftRecord.Staff__r.Email_Address__c LIMIT 1];
                if (!staffUsers.isEmpty()) {
                    staffUser = staffUsers[0];
                }
            }
            
            staffId = shiftRecord.Staff__c;
            String staffName = shiftRecord.Staff__r != null ? shiftRecord.Staff__r.Name : (shiftRecord.CreatedBy != null ? shiftRecord.CreatedBy.Name : 'Unknown Staff');
            String shiftDate;
            if (shiftRecord.Date__c != null) {
                Date d = shiftRecord.Date__c;
                shiftDate = d.day() + '/' + d.month() + '/' + d.year();
            } else {
                shiftDate = requestedDate.day() + '/' + requestedDate.month() + '/' + requestedDate.year();
            }
            String reason = String.isNotBlank(comments) ? comments : 'No reason provided';
            
            // Update comments and datetime if provided - FIXED: Proper datetime conversion
            String dateTimeString = req.params != null ? req.params.get('requestedDate') : null;
            if (String.isNotBlank(comments) && String.isNotBlank(dateTimeString)) {
                shiftRecord.Request_sign_out_comments__c = req.params.get('comments');
                try {
                    shiftRecord.Schedule_Sign_Out_Date_Time__c = Datetime.valueOf(dateTimeString);
                } catch (Exception e) {
                    // Handle datetime parsing error
                    shiftRecord.Schedule_Sign_Out_Date_Time__c = System.now();
                }
                update shiftRecord;
            }
            
            // Format Scheduled End and Actual End Times - FIXED: Null safety
            String scheduledEnd = '';
            String actualEnd = '';
            
            if (shiftRecord.Schedule_Sign_Out_Date_Time__c != null) {
                Time signOutTime = shiftRecord.Schedule_Sign_Out_Date_Time__c.time();
                scheduledEnd = formatTime12Hr(signOutTime);
            }
            
            if (shiftRecord.End_Time__c != null) {
                actualEnd = formatTime12Hr(shiftRecord.End_Time__c);
            } else {
                actualEnd = DateTime.now().format('hh:mm a');
            }
            
            // CASE 1: Already enabled
            if (shiftRecord.Enable_Sign_Out__c == true) {
                responseMap.put('success', true);
                responseMap.put('Enable_Sign_Out__c', true);
                responseMap.put('Request_sign_out_comments__c', shiftRecord.Request_sign_out_comments__c);
                
                notifTitle = 'Sign out already enabled';
                notifBody  = shiftDate + ' | Scheduled: ' + scheduledEnd + 
                    ', Signed out at: ' + actualEnd + 
                    '\nReason: "' + reason + '"';
                
                // Send email notification if staff and email exist
                if (shiftRecord.Staff__r != null && String.isNotBlank(shiftRecord.Staff__r.Email_Address__c)) {
                    String body = 'Hi ' + (String.isNotBlank(shiftRecord.Staff__r.Name) ? shiftRecord.Staff__r.Name : 'Staff') + ',<br/><br/>' +
                    'This is to inform you that Sign out has been enabled for the following shift details:<br/><br/>' +
                    '<b>• Shift Date:</b> ' + shiftDate + '<br/>' +
                    '<b>• Actual Time:</b> ' + actualEnd +  '<br/>' +
                    '<b>• Scheduled Time:</b> ' + scheduledEnd + '<br/>' +
                    '<b>• Reason:</b> ' + reason + '<br/><br/>' +
                    '<b>Note:</b> This is an automated message. Please do not reply.<br/><br/>' +
                    '<b>Regards,</b><br/>' +
                    (shiftRecord.Staff__r.Organization_Full_Name__c != null ? shiftRecord.Staff__r.Organization_Full_Name__c : 'Organization');
                    
                    List<String> toAddresses = new List<String>{ shiftRecord.Staff__r.Email_Address__c };
                    try {
                        EmailSenderNotification.sendSingleEmail(toAddresses, notifTitle, body);
                    } catch (Exception e) {
                        System.debug('Email sending failed: ' + e.getMessage());
                    }
                }
                
                // Send mobile notification if staffId exists
                if (staffId != null) {
                    try {
                        MobileNotification.sendNotification(staffId, notifTitle, notifBody);
                    } catch (Exception e) {
                        System.debug('Mobile notification failed: ' + e.getMessage());
                    }
                }
                
                // Create notification only if user found
                if (staffUser != null) {
                    try {
                        My_Notification__c notification = new My_Notification__c();
                        notification.User__c = staffUser.Id;
                        notification.Subject__c = notifTitle;
                        notification.Description__c = notifBody;
                        insert notification;
                    } catch (Exception e) {
                        System.debug('Notification creation failed: ' + e.getMessage());
                    }
                }
                
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }
            
            // CASE 2: Task already exists
            List<Task> existingTasks = [
                SELECT Id, Subject, Description 
                FROM Task 
                WHERE WhatId = :shiftRecord.Id 
                AND Subject = 'Enable Sign out for Shift' 
                AND Status = 'New' 
                LIMIT 1
            ];
            
            if (!existingTasks.isEmpty()) {responseMap.put('success', true);responseMap.put('Enable_Sign_Out__c', shiftRecord.Enable_Sign_Out__c);responseMap.put('Request_sign_out_comments__c', shiftRecord.Request_sign_out_comments__c);responseMap.put('message', 'Task already created for enabling sign out.');
                
                notifTitle = 'Sign out request already exists';
                notifBody  = shiftDate + ' | Scheduled: ' + scheduledEnd + 
                    ', Signed out at: ' + actualEnd + 
                    '\nReason: "' + reason + '"';
                
                // Send email notification if staff and email exist
                if (shiftRecord.Staff__r != null && String.isNotBlank(shiftRecord.Staff__r.Email_Address__c)) {
                    String body = 'Hi ' + (String.isNotBlank(shiftRecord.Staff__r.Name) ? shiftRecord.Staff__r.Name : 'Staff') + ',<br/><br/>' +
                    'This is to inform you that a signout request is already exists:<br/><br/>' +
                    '<b>• Shift Date:</b> ' + shiftDate + '<br/>' +
                    '<b>• Actual Time:</b> ' + actualEnd +  
                    '<b>• Scheduled Time:</b> ' + scheduledEnd + '<br/>' +
                    '<b>• Reason:</b> ' + reason + '<br/><br/>' +
                    '<b>Note:</b> This is an automated message. Please do not reply.<br/><br/>' +
                    '<b>Regards,</b><br/>' +
                    (shiftRecord.Staff__r.Organization_Full_Name__c != null ? shiftRecord.Staff__r.Organization_Full_Name__c : 'Organization');
                    
                    List<String> toAddresses = new List<String>{ shiftRecord.Staff__r.Email_Address__c };
                    try {
                        EmailSenderNotification.sendSingleEmail(toAddresses, notifTitle, body);
                    } catch (Exception e) {
                        System.debug('Email sending failed: ' + e.getMessage());
                    }
                }
                
                // Send mobile notification if staffId exists
                if (staffId != null) {
                    try {
                        MobileNotification.sendNotification(staffId, notifTitle, notifBody);
                    } catch (Exception e) {
                        System.debug('Mobile notification failed: ' + e.getMessage());
                    }
                }
                
                if (staffUser != null) {
                    try {
                        My_Notification__c notification = new My_Notification__c();
                        notification.User__c = staffUser.Id;
                        notification.Subject__c = notifTitle;
                        notification.Description__c = notifBody;
                        insert notification;
                    } catch (Exception e) {
                        System.debug('Notification creation failed: ' + e.getMessage());
                    }
                }
                
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }
            
            // CASE 3: Create new task
            Task newTask = new Task(
                Subject = 'Enable Sign out for Shift',
                Status = 'New',
                Priority = 'Normal',
                OwnerId = shiftRecord.CreatedById,
                WhatId = shiftRecord.Id,
                Description = 
                'Task related to enabling sign out for the shift. ' + 
                'Requested Date: ' + shiftDate + 
                (String.isNotBlank(comments) ? ' | Comments: ' + comments : ''), 
                ActivityDate = requestedDate
            );
            
            try {
                insert newTask;
            } catch (Exception e) {
                responseMap.put('success', false);
                responseMap.put('message', 'Error creating task: ' + e.getMessage());
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }
            
            responseMap.put('success', true);
            responseMap.put('Enable_Sign_Out__c', shiftRecord.Enable_Sign_Out__c);
            responseMap.put('Request_sign_out_comments__c', shiftRecord.Request_sign_out_comments__c);
            responseMap.put('message', 'Sign Out Requested and Task created.');
            
            notifTitle = 'Late Sign out request';
            notifBody  = shiftDate + ' | Scheduled: ' + scheduledEnd + 
                ', Signed out at: ' + actualEnd + 
                '\nReason: "' + reason + '"';
            
            // Send email notification if staff and email exist
            if (shiftRecord.Staff__r != null && String.isNotBlank(shiftRecord.Staff__r.Email_Address__c)) {
                String body = 
                    'Hi ' + ((String.isNotBlank(shiftRecord.CreatedBy.Name)) ? shiftRecord.CreatedBy.Name : 'Admin') + ',<br/><br/>' +
                    'This is to inform you that a Sign out request is created:<br/><br/>' + 
                    'from the staff: ' + shiftRecord.Staff__r.Name + '<br/>' +
                    'for the following shift details <b>• Shift Date:</b> ' + shiftDate + '<br/>' +
                    '<b>• Actual Time:</b> ' + actualEnd + '<br/>' +
                    '<b>• Scheduled Time:</b> ' + scheduledEnd + '<br/>' +
                    '<b>• Reason:</b> ' + reason + '<br/><br/>' +
                    '<b>Note:</b> This is an automated message. Please do not reply.<br/><br/>' +
                    '<b>Regards,</b><br/>' +
                    (shiftRecord.Staff__r.Organization_Full_Name__c != null 
                     ? shiftRecord.Staff__r.Organization_Full_Name__c 
                     : 'Organization');
                
                List<String> toAddresses = new List<String>{ shiftRecord.CreatedBy.Email };
                    try {
                        EmailSenderNotification.sendSingleEmail(toAddresses, notifTitle, body);
                    } catch (Exception e) {
                        System.debug('Email sending failed: ' + e.getMessage());
                    }
            }

            // Send mobile notification if staffId exists
            if (staffId != null) {
                try {
                    MobileNotification.sendNotification(staffId, notifTitle, notifBody);
                } catch (Exception e) {
                    System.debug('Mobile notification failed: ' + e.getMessage());
                }
            }
            
            // Create notification for task creation
            if (staffUser != null) {
                try {
                    My_Notification__c notification = new My_Notification__c();
                    notification.User__c = shiftRecord.CreatedById;
                    notification.Subject__c = notifTitle;
                    notification.Description__c = notifBody;
                    insert notification;
                } catch (Exception e) {
                    System.debug('Notification creation failed: ' + e.getMessage());
                }
            }
            
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
            
        } catch (Exception e) {
            responseMap.put('success', false);
            responseMap.put('message', 'Error processing Sign Out : ' + e.getMessage());
            
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
        }
    }
    
    // 🔹 Helper method to format Time into 12-hour format string - FIXED: Using Math.mod()
    public static String formatTime12Hr(Time t) {
        if (t == null) return 'N/A';
        Integer h = t.hour();
        Integer m = t.minute();
        String meridian = h >= 12 ? 'PM' : 'AM';
        Integer displayHour = Math.mod(h, 12) == 0 ? 12 : Math.mod(h, 12);
        String minuteStr = (m < 10) ? '0' + String.valueOf(m) : String.valueOf(m);
        return displayHour + ':' + minuteStr + ' ' + meridian;
    }   
}