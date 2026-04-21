@RestResource(urlMapping='/EnableSignInApi/*')
global class MobileAppSignEnableRest {
    @HttpGet
    global static void enableSignInButton() {
        RestResponse res = RestContext.response;
        Map<String, Object> responseMap = new Map<String, Object>();
        String notifTitle;
        String notifBody;
        Id staffId;
        try {
            RestRequest req = RestContext.request;
            String shiftId = req.params.get('shiftId');
            String DistanceLocation = (req.params.get('Distance_from_location__c') != null && req.params.get('Distance_from_location__c') != '') ? req.params.get('Distance_from_location__c') : '0';
          Boolean isAtLocation = (req.params.get('Is_at_location__c') != null && req.params.get('Is_at_location__c') != '') ? Boolean.valueOf(req.params.get('Is_at_location__c')) : false;
            system.debug('shift id==>' + shiftId);

            if (String.isBlank(shiftId)) {
                responseMap.put('success', false);
                responseMap.put('message', 'Error: Request input cannot be empty.');
            } else {
                // Query Shift record
                ShiftwithStaff__c shiftRecord = [
                    SELECT Id, CreatedById, Staff__c, Date__c, Start_Time__c, Enable_Sign_In__c,
                           Staff__r.Name, Staff__r.Organization_Full_Name__c, Staff__r.Email_Address__c, Distance_from_location__c, Is_at_location__c,
                           CreatedBy.Name, CreatedBy.Email
                    FROM ShiftwithStaff__c 
                    WHERE Id = :shiftId 
                    LIMIT 1
                ];

                if (shiftRecord == null) {
                    responseMap.put('success', false);
                    responseMap.put('message', 'Error: Shiftwithstaff record not found.');
                } else {
                    // Scheduled Start formatting
                    String scheduledStart = '';
                    if (shiftRecord.Start_Time__c != null) {
                        scheduledStart = MobileAppSignOutEnableRest.formatTime12Hr(shiftRecord.Start_Time__c);
                    }
                    String shiftDate;
                    if (shiftRecord.Date__c != null) {
                        Date d = shiftRecord.Date__c;
                        shiftDate = d.day() + '/' + d.month() + '/' + d.year();
                    }

                    // Case 1: Already enabled
                    if (shiftRecord.Enable_Sign_In__c == true) {
                        responseMap.put('success', true);
                        responseMap.put('Enable_Sign_In__c', shiftRecord.Enable_Sign_In__c);
                        responseMap.put('message', 'Sign In already enabled.');

                        notifTitle = 'Sign in already enabled';
                        notifBody  = shiftDate + ' | Scheduled: ' + scheduledStart;

                        // Send email to Staff
                        if (shiftRecord.Staff__r != null && String.isNotBlank(shiftRecord.Staff__r.Email_Address__c)) {
                            String body = 'Hi ' + (String.isNotBlank(shiftRecord.Staff__r.Name) ? shiftRecord.Staff__r.Name : 'Staff') + ',<br/><br/>' +
                                'This is to inform you that Sign in has been enabled for the following shift:<br/><br/>' +
                                '<b>• Shift Date:</b> ' + shiftDate + '<br/>' +
                                '<b>• Scheduled Time:</b> ' + scheduledStart + '<br/><br/>' +
                                '<b>Regards,</b><br/>' +
                                (shiftRecord.Staff__r.Organization_Full_Name__c != null ? shiftRecord.Staff__r.Organization_Full_Name__c : 'Organization');
                            try {
                                EmailSenderNotification.sendSingleEmail(
                                    new List<String>{ shiftRecord.Staff__r.Email_Address__c }, notifTitle, body
                                );
                            } catch (Exception e) {
                                System.debug('Email sending failed: ' + e.getMessage());
                            }
                        }
                    }
                    // Case 2: Not enabled → create Task
                    else {
                        // Check existing Task
                        List<Task> existingTasks = [
                            SELECT Id FROM Task 
                            WHERE WhatId = :shiftRecord.Id 
                            AND Subject = 'Enable Sign in for Shift' 
                            AND Status = 'New' 
                            LIMIT 1
                        ];
                        

                        if (!existingTasks.isEmpty()) {
                            responseMap.put('success', true);
                            responseMap.put('Enable_Sign_In__c', shiftRecord.Enable_Sign_In__c);
                            responseMap.put('message', 'Task already created for enabling sign in.');
                        } else {
                            // Create new Task
                            Task newTask = new Task(
                                Subject = 'Enable Sign in for Shift',
                                Status = 'New',
                                Priority = 'Normal',
                                OwnerId = shiftRecord.CreatedById, 
                                WhatId = shiftRecord.Id, 
                                Description = 'Task related to enabling sign in for the shift.',
                                ActivityDate = System.today()
                            );
                            insert newTask;
                            
                            ShiftwithStaff__c shift =new ShiftwithStaff__c();
                            shift.Id=shiftId;
                            shift.Distance_from_location__c=DistanceLocation;
                            shift.Is_at_location__c=isAtLocation;
                            
                            update shift;

                            responseMap.put('success', true);
                            responseMap.put('Enable_Sign_In__c', shiftRecord.Enable_Sign_In__c);
                            responseMap.put('message', 'Sign In Requested and Task created.');

                            notifTitle = 'Late Sign in request';
                            notifBody  = 'A Sign in request is created from the staff - '
                                     + shiftRecord.Staff__r.Name +
                                    ' for the Shift Date: ' + shiftDate + ', Scheduled Time: ' + scheduledStart;

                            // Send email to CreatedBy (admin)
                            if (String.isNotBlank(shiftRecord.CreatedBy.Email)) {
                                String body = 'Hi ' + shiftRecord.CreatedBy.Name + ',<br/><br/>' +
                                    'This is to inform you that a Sign in request is created:<br/><br/>' + 
                                    'from the staff: ' + shiftRecord.Staff__r.Name + '<br/>' +  
                                    'for the following shift details <b>• Shift Date:</b> ' + shiftDate + '<br/>' +
                                    '<b>• Scheduled Time:</b> ' + scheduledStart + '<br/><br/>' +
                                    '<b>Regards,</b><br/> System';
                                try {
                                    EmailSenderNotification.sendSingleEmail(
                                        new List<String>{ shiftRecord.CreatedBy.Email }, notifTitle, body
                                    );
                                } catch (Exception e) {
                                    System.debug('Email sending failed: ' + e.getMessage());
                                }
                            }
                            
                            // Send notification to CreatedBy (admin)
                            My_Notification__c notification = new My_Notification__c();
                            notification.User__c = shiftRecord.CreatedById;
                            notification.Subject__c = notifTitle;
                            notification.Description__c = notifBody;
                            insert notification;
                        }
                    }
                    try {

                    } catch (Exception e) {
                        System.debug('Notification creation failed: ' + e.getMessage());
                    }
                }
            }

            // Final response
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));

        } catch (Exception e) {
            responseMap.put('success', false);
            responseMap.put('message', 'Error processing Sign In : ' + e.getMessage());
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
        }
    }
}