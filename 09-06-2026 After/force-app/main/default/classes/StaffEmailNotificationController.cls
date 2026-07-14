public without sharing  class StaffEmailNotificationController {
    
    // Apex method to send email notifications based on shift details, recurrence, and EOI logic
    @AuraEnabled
    public static void sendShiftEmails(String shiftId, String roleId, String facilityId, String staffId, boolean isrecur, String Sdate, String Edate, String typeOfRecur, String recurEvery, list<String> weeklyDays, integer monthlyDay, boolean groupShift,boolean splitShift) {
        if (shiftId == null || roleId == null || facilityId == null) {
            throw new AuraHandledException('All parameters (shiftId, roleId, facilityId) are required.');
        }
        String weeklyDaysCommaSeparated = (weeklyDays != null && !weeklyDays.isEmpty())  ? String.join(weeklyDays, ',')  : '';
        // Step 1: Query shift details
        Add_Shift__c shift = [
            SELECT Id, Location__Street__s, Location__City__s, Location__PostalCode__s, Location__StateCode__s, Location__CountryCode__s,
            Facility__r.Name,  Start_Date__c, Start_Time__c, Start_time_Formula__c, End_Time__c, End_time_formula__c,Role__c,
            Shift_Type__c, Is_EOI__c, Shift_Start_End_Time__c, EOI_staff__c,
            (SELECT Id,Staff__c, (SELECT Id, Service_Type_Name__c, Participant_Name__c FROM Services_and_Support_Plans__r)
             FROM ShiftwithStaffs__r)
            FROM Add_Shift__c
            WHERE Id = :shiftId
            LIMIT 1
        ];
        
        // Step 2: Determine eligible staff
        List<Staff__c> staffList = new List<Staff__c>();
        Boolean isSingleStaff = false;
        Set<Id> eoiStaffIds = new Set<Id>();
        Boolean hasEOIFilter = false;
        
        // Handle EOI staff filtering
        if (shift.Is_EOI__c && !String.isBlank(shift.EOI_staff__c)) {
            List<String> staffIdStrings = shift.EOI_staff__c.split(',');
            for (String idStr : staffIdStrings) {
                eoiStaffIds.add((Id)idStr.trim());
            }
            hasEOIFilter = true;
        }
        set<Id>staffIdList=new set<Id>();
        if(groupShift==true){
            for(ShiftwithStaff__c ss :shift.ShiftwithStaffs__r){
                staffIdList.add(ss.staff__c);
            }
        }
        SYSTEM.DEBUG('staffIdList ==>' +staffIdList);
        
        // If a specific staff is provided
        if (String.isNotBlank(staffId)) {
            Staff__c staff = [
                SELECT Id, Name, Display_Nickname__c, Last_Name__c, Facility__c, Organization_Full_Name__c, Email_Address__c, Role__c,User__c
                FROM Staff__c
                WHERE Id = :staffId AND Status__c = true AND Email_Address__c != null
                LIMIT 1
            ];
            staffList.add(staff);
            isSingleStaff = true;
        }else if(groupShift){
            staffList = [
                SELECT Id, Name, Display_Nickname__c, Last_Name__c, Facility__c, Organization_Full_Name__c, Email_Address__c, Role__c,User__c
                FROM Staff__c
                WHERE Id IN :staffIdList AND Status__c = true AND Email_Address__c != null
                
            ];
            
        } else {
            // Otherwise, pull based on role/facility
            staffList = [
                SELECT Id, Name, Display_Nickname__c, Last_Name__c, Facility__c, Organization_Full_Name__c, Email_Address__c, Role__c,User__c
                FROM Staff__c
                // WHERE Role__c INCLUDES (:roleId)
                // AND Facility__c = :facilityId
                WHERE Id IN (
                    SELECT Staff__c
                    FROM Staff_Facility__c
                    WHERE Active__c = true
                    AND Facility__c = :facilityId
                )
                AND Id IN (
                    SELECT StaffRole_To_Staff__c
                    FROM StaffRole__c
                    WHERE Active__c = true
                    AND Facility__c = :facilityId
                    AND RoleName__c = :roleId
                )
                AND Status__c = true
                AND Email_Address__c != null
            ];
        }
        
        //for getting userid using staff email i am putting all email in set
        Set<String> staffEmails = new Set<String>();
        for (Staff__c s : staffList) {
            if (!String.isBlank(s.Email_Address__c)) {
                staffEmails.add(s.Email_Address__c.trim().toLowerCase());
            }
        }
        //using the email i am getting userid
        Map<String, Id> emailToUserIdMap = new Map<String, Id>();
        for (User u : [
            SELECT Id, Email 
            FROM User 
            WHERE Email IN :staffEmails 
            AND IsActive = true
        ]) {
            emailToUserIdMap.put(u.Email.trim().toLowerCase(), u.Id);
        }
        // ✅ Final debug log to show the complete map after population
        System.debug('🗺️ Final emailToUserIdMap: ' + emailToUserIdMap);
        
        // Step 3: Compose email content and build messages
        // List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();
        // List<My_Notification__c> notifications = new List<My_Notification__c>();
        //OrgWideEmailAddress[] owea = [SELECT Id FROM OrgWideEmailAddress WHERE Address = :System.Label.OrgWideEmailAddress LIMIT 1];

        User currentUser = [
            SELECT Id,
                Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        Organisation__c orgObj = [
            SELECT Id,
                Email__c
            FROM Organisation__c
            WHERE Name = :currentUser.Organization_Name__c
            LIMIT 1
        ];

        String senderEmailAddress =
            orgObj.Email__c;

        // =========================================
        // BULK EMAIL PAYLOAD
        // =========================================

        List<Object> bulkEmails =
            new List<Object>();

        // =========================================
        // NOTIFICATIONS
        // =========================================

        List<My_Notification__c> notifications =
            new List<My_Notification__c>();
        
        for (Staff__c staff : staffList) {
            // Apply EOI filter if required
            if (hasEOIFilter && !eoiStaffIds.contains(staff.Id)) {
                continue;
            }
            
            // Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
            // email.setToAddresses(new List<String>{ staff.Email_Address__c });
            // email.setOrgWideEmailAddressId(owea.get(0).Id);
            // email.setSenderDisplayName(staff.Organization_Full_Name__c);
            
            String body;
            String subject;
            String description;
            
            // EOI broadcast to multiple staff
            if (shift.Is_EOI__c && !isSingleStaff) {
                subject = 'Shift Assignment Notification-EOI';
                description = 'New EOI shift is created on ' + 'Shift Date: ' + reverseDateFormat(String.valueOf(shift.Start_Date__c)) + ' for the Shift Timings: ' + shift.Shift_Start_End_Time__c;
                body = 'Hi ' + staff.Display_Nickname__c + ',<br/><br/>' +
                    'This is to inform you that shift has been scheduled for the following requirement:<br/>' +
                    '<b>• Shift Date:</b> ' + reverseDateFormat(String.valueOf(shift.Start_Date__c)) + '<br/>' +
                    '<b>• Shift Timings and Type:</b> ' + shift.Shift_Start_End_Time__c + ', ' + shift.Shift_Type__c + '<br/>' +
                    '<b>• Facility:</b> ' + shift.Facility__r.Name + '<br/>' +
                    '<b>• Address:</b> ' + shift.Location__Street__s + ',' + shift.Location__City__s + ',' + shift.Location__StateCode__s + ',' + shift.Location__CountryCode__s + ',' + shift.Location__PostalCode__s + '<br/>' +
                    '<b>• Role:</b> ' + shift.Role__c + '<br/>' +
                    'Kindly acknowledge your Expression of Interest (EOI) at the earliest.<br/><br/>' +
                    '<b>Note:</b> This is an automated message. Please do not reply.<br/><br/><b>Regards,</b><br/>' +
                    staff.Organization_Full_Name__c;
            }
            // Single, non-recurring shift
            else if (!isrecur && (isSingleStaff || groupShift ==true ) ) {
                system.debug('groupShift true ' +staff.Display_Nickname__c);
                String serviceLine = '';
                if (!shift.ShiftwithStaffs__r.isEmpty() && !shift.ShiftwithStaffs__r[0].Services_and_Support_Plans__r.isEmpty()) {
                    if (!String.isBlank(shift.ShiftwithStaffs__r[0].Services_and_Support_Plans__r[0].Participant_Name__c)) {
                        serviceLine += '<b>• Participant:</b> ' + shift.ShiftwithStaffs__r[0].Services_and_Support_Plans__r[0].Participant_Name__c + '<br/>';
                    }
                    if (!String.isBlank(shift.ShiftwithStaffs__r[0].Services_and_Support_Plans__r[0].Service_Type_Name__c)) {
                        serviceLine += '<b>• Service:</b> ' + shift.ShiftwithStaffs__r[0].Services_and_Support_Plans__r[0].Service_Type_Name__c;
                    }
                    if (serviceLine != '') serviceLine += '<br/>';
                }
                subject = 'Shift Allocation Notification';
                description = 'A shift has been allocated to you on ' + 'Shift Date: ' + reverseDateFormat(String.valueOf(shift.Start_Date__c)) + ' for the timings: ' + shift.Shift_Start_End_Time__c;
                body = 'Hi ' + staff.Display_Nickname__c + ',<br/><br/>' +
                    'This email is to notify you that shift has been allocated to you by your roster manager. <br/><br/>' +
                    'Here are the details of your shift:<br/>'+
                    '<b>• Shift Date:</b> ' + reverseDateFormat(String.valueOf(shift.Start_Date__c)) + '<br/>' +
                    '<b>• Shift Timings and Type:</b> ' + shift.Shift_Start_End_Time__c + ', ' + shift.Shift_Type__c + '<br/>' +
                    '<b>• Facility:</b> ' + shift.Facility__r.Name + '<br/>' +
                    '<b>• Address:</b> ' + shift.Location__Street__s + ',' + shift.Location__City__s + ',' + shift.Location__StateCode__s + ',' + shift.Location__CountryCode__s + ',' + shift.Location__PostalCode__s + '<br/>' +
                    serviceLine +
                    'Please take note of the above and ensure you report to your assigned shift accordingly.<br/><br/><b>Note:</b> This is an automated message. Please do not reply.<br/><br/><b>Regards,</b><br/>' +
                    staff.Organization_Full_Name__c;
            }
            // Recurring shift with a single staff
            else if (isrecur && (isSingleStaff || groupShift ==true)  )  {
                String dayLabel = recurEvery == '1' ? 'day' : 'days';
                String weekLabel = recurEvery == '1' ? 'week' : 'weeks';
                String monthLabel = recurEvery == '1' ? 'month' : 'months';
                String recurLine = '';
                system.debug('groupShift true in recurring  ' +staff.Display_Nickname__c);
                if (typeOfRecur == 'daily') {
                    recurLine = 'This is to notify you that your shift (' + shift.Shift_Type__c + ' ' + 
                        String.valueOf(shift.Shift_Start_End_Time__c) + ') is set to recur daily for (every ' + recurEvery +' '  + dayLabel +') from ' + 
                        reverseDateFormat(Sdate) + ' to ' + reverseDateFormat(Edate) + '.';
                } else if (typeOfRecur == 'weekly') {
                    recurLine = 'This is to notify you that your shift (' + shift.Shift_Type__c + ' ' + 
                        String.valueOf(shift.Shift_Start_End_Time__c) + ') is set to recur weekly (every ' + recurEvery +' '  + weekLabel +') on the same weekday, from ' + 
                        reverseDateFormat(Sdate) + ' to ' + reverseDateFormat(Edate) + ' on ' + weeklyDaysCommaSeparated + '.';
                } else if (typeOfRecur == 'fortnightly') {
                    recurLine = 'This is to notify you that your shift (' + shift.Shift_Type__c + ' ' + 
                        String.valueOf(shift.Shift_Start_End_Time__c) + ') is set to recur fortnightly from ' + 
                        reverseDateFormat(Sdate) + ' to ' + reverseDateFormat(Edate) + '.';
                } else if (typeOfRecur == 'monthly') {
                    recurLine = 'This is to notify you that your shift (' + shift.Shift_Type__c + ' ' + 
                        String.valueOf(shift.Shift_Start_End_Time__c) + ') is set to recur monthly (every ' + recurEvery + ''  + monthLabel +') from ' + 
                        reverseDateFormat(Sdate) + ' to ' + reverseDateFormat(Edate) + ' on ' + monthlyDay + 'th of the month.';
                } else {
                    recurLine = 'This is to notify you that your shift (' + shift.Shift_Type__c + ' ' + 
                        String.valueOf(shift.Shift_Start_End_Time__c) + ') is set to recur ' + typeOfRecur + 
                        ' (every ' + recurEvery + ') from ' + reverseDateFormat(Sdate) + ' to ' + reverseDateFormat(Edate) + '.';
                }
                
                String serviceLine = '';
                if (!shift.ShiftwithStaffs__r.isEmpty() && !shift.ShiftwithStaffs__r[0].Services_and_Support_Plans__r.isEmpty()) {
                    if (!String.isBlank(shift.ShiftwithStaffs__r[0].Services_and_Support_Plans__r[0].Participant_Name__c)) {
                        serviceLine += '<b>• Participant:</b> ' + shift.ShiftwithStaffs__r[0].Services_and_Support_Plans__r[0].Participant_Name__c + '<br/>';
                    }
                    if (!String.isBlank(shift.ShiftwithStaffs__r[0].Services_and_Support_Plans__r[0].Service_Type_Name__c)) {
                        serviceLine += '<b>• Service:</b> ' + shift.ShiftwithStaffs__r[0].Services_and_Support_Plans__r[0].Service_Type_Name__c + '<br/>';
                    }
                    if (serviceLine != '') serviceLine += '<br/>';
                }
                
                subject = 'Recurring Shift Notification - ' + typeOfRecur;
                description = recurLine;
                body = 'Hi ' + staff.Display_Nickname__c +',<br/><br/>' +
                    recurLine +
                    '<br> Here are the key details of your shift:<br/>' +
                    //'<b>• Shift Date:</b> ' + reverseDateFormat(String.valueOf(shift.Start_Date__c)) + '<br/>' +
                    //'<b>• Shift Timings and Type:</b> ' + String.valueOf(shift.Shift_Start_End_Time__c) + ', ' + shift.Shift_Type__c + '<br/>' +
                    '<b>• Facility:</b> ' + shift.Facility__r.Name + '<br/>' +  
                    '<b>• Address:</b> ' + shift.Location__Street__s +','+ shift.Location__City__s +','+ shift.Location__StateCode__s +','+ shift.Location__CountryCode__s +','+ shift.Location__PostalCode__s + '<br/>' +   
                    '<b>• Role:</b> ' + shift.Role__c + '<br/>' +
                    serviceLine +
                    'Please contact your roster manager if you need to make changes to your recurring shift details.   <br/>' +
                    'Kindly take note of the above and ensure you report to your assigned shift accordingly.   <br/><br/>' +
                    '<b>Note:</b> This is an automated message. Please do not reply.<br/><br/>' +
                    '<b>Regards,</b><br/>' +
                    staff.Organization_Full_Name__c;
            }
            // Default fallback
            else {
                subject = 'Shift Assignment - Notification';
                description = 'A new shift has been scheduled on ' + 'Shift Date: ' + reverseDateFormat(String.valueOf(shift.Start_Date__c)) + 'Shift Timings: ' + shift.Shift_Start_End_Time__c;
                body = 'Hi ' + staff.Display_Nickname__c + ',<br/><br/>' +
                    'This is to inform you that shift has been scheduled for the following requirement:<br/><br/>' +
                    '<b>• Shift Date:</b> ' + reverseDateFormat(String.valueOf(shift.Start_Date__c)) + '<br/>' +
                    '<b>• Shift Timings and Type:</b> ' + shift.Shift_Start_End_Time__c + ', ' + shift.Shift_Type__c + '<br/>' +
                    '<b>• Facility:</b> ' + shift.Facility__r.Name + '<br/>' +
                    '<b>• Address:</b> ' + shift.Location__Street__s + ',' + shift.Location__City__s + ',' + shift.Location__StateCode__s + ',' + shift.Location__CountryCode__s + ',' + shift.Location__PostalCode__s + '<br/>' +
                  //  '<b>• Role:</b> ' + shift.Role__c + '<br/>' +
                    'Kindly review the above details and acknowledge the shift at the earliest, if you wish to accept it.<br/><br/><b>Note:</b> This is an automated message. Please do not reply.<br/><br/><b>Regards,</b><br/>' +
                    staff.Organization_Full_Name__c;
            }
            
            // email.setSubject(subject);
            // email.setHtmlBody(body);
            // emails.add(email);

            Map<String, Object> emailPayload =
                new Map<String, Object>();

            emailPayload.put(
                'fromEmail',
                senderEmailAddress
            );

            emailPayload.put(
                'toEmail',
                new List<String>{
                    staff.Email_Address__c
                }
            );

            emailPayload.put(
                'subject',
                subject
            );

            emailPayload.put(
                'body',
                body
            );

            // =========================================
            // OPTIONAL ATTACHMENTS
            // =========================================

            List<String> attachments =
                new List<String>();

            // Example:
            // attachments.add(
            //     'https://your-file-url.com/file.pdf'
            // );

            if (!attachments.isEmpty()) {

                emailPayload.put(
                    'attachment',
                    attachments
                );
            }

            // =========================================
            // ADD TO BULK PAYLOAD
            // =========================================

            bulkEmails.add(emailPayload);
            
            Id userId = emailToUserIdMap.get(
                staff.Email_Address__c != null ? staff.Email_Address__c.trim().toLowerCase() : null
            );
            notifications.add(new My_Notification__c(
                User__c = userId,   // Lookup to Staff__c
                Subject__c = subject,    // Text field
                Description__c = description    // Long Text Area field
            ));
        }
        
        // Step 4: Send all built emails
        // if (!emails.isEmpty()) {
        //     Messaging.sendEmail(emails);
        // }

        if (!bulkEmails.isEmpty()) {

            Id jobId = System.enqueueJob(

                new EmailRelayQueueable(
                    bulkEmails
                )
            );

            System.debug(
                '✅ Bulk Email Queueable Created: ' +
                jobId
            );
        }
        // Step 5: Insert notifications
        if (!notifications.isEmpty()) {
            insert notifications;
        }
    }
    
    public static void sendPublishNotifications(String startDate, String endDate) {
        Date sDate = Date.valueOf(startDate);
        Date eDate = Date.valueOf(endDate);
        
        List<ShiftwithStaff__c> shifts = [
            SELECT Id, Role_formula__c, Staff__c, Date__c, Start_Time__c, End_Date__c, End_Time__c,
            Add_Shift__r.Facility__r.Name,
            Staff__r.Email_Address__c, Staff__r.Display_Nickname__c, Staff__r.Organization_Full_Name__c,
            Add_Shift__r.Shift_Start_End_Time__c, Add_Shift__r.Shift_Type__c,
            Add_Shift__r.Location__Street__s, Add_Shift__r.Location__City__s,
            Add_Shift__r.Location__CountryCode__s, Add_Shift__r.Location__PostalCode__s
            FROM ShiftwithStaff__c
            WHERE Is_Auto_Schedule_Shift__c = true
            AND Date__c >= :sDate
            AND End_Date__c <= :eDate
        ];
        
        sendShiftEmails(shifts);
    }
    
    public static void addShiftAssignNotifications(List<String> shiftWithStaffIdList) {
        List<ShiftwithStaff__c> shifts = [
            SELECT Id, Role_formula__c, Staff__c, Date__c, Start_Time__c, End_Date__c, End_Time__c,
            Add_Shift__r.Facility__r.Name,
            Staff__r.Email_Address__c, Staff__r.Display_Nickname__c, Staff__r.Organization_Full_Name__c,
            Add_Shift__r.Shift_Start_End_Time__c, Add_Shift__r.Shift_Type__c,
            Add_Shift__r.Location__Street__s, Add_Shift__r.Location__City__s,
            Add_Shift__r.Location__CountryCode__s, Add_Shift__r.Location__PostalCode__s
            FROM ShiftwithStaff__c
            WHERE Id IN :shiftWithStaffIdList
        ];
        
        sendShiftEmails(shifts);
    }
    
    /*
    private static void sendShiftEmails(List<ShiftwithStaff__c> shiftStaffList) {

        if (shiftStaffList.isEmpty()) return;
        
        List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();
        
        // OrgWideEmailAddress[] owea = [SELECT Id FROM OrgWideEmailAddress WHERE Address = :System.Label.OrgWideEmailAddress LIMIT 1];
        
        // if (owea.isEmpty()) {
        //     System.debug('No Org-Wide Email Address found.');
        //     return;
        // }
        
        for (ShiftwithStaff__c shift : shiftStaffList) {
            if (shift.Staff__r == null || String.isBlank(shift.Staff__r.Email_Address__c)) {
                continue; // skip if no email
            }
            
            Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
            email.setToAddresses(new List<String>{ shift.Staff__r.Email_Address__c });
            // email.setOrgWideEmailAddressId(owea[0].Id);
            email.setSenderDisplayName(shift.Staff__r.Organization_Full_Name__c);
            email.setSubject('New Shift Notification - ' + shift.Add_Shift__r.Shift_Type__c);
            
            String body = 
                'Hi ' + shift.Staff__r.Display_Nickname__c + ',<br/><br/>' +
                'This email is to notify you that shift has been allocated to you by your roster manager.<br/><br/>' +
                'Here are the details of your shift:<br/>' +
                '<b>• Shift Date:</b> ' + reverseDateFormat(String.valueOf(shift.Date__c)) + '<br/>' +
                '<b>• Shift Timings and Type:</b> ' + shift.Add_Shift__r.Shift_Start_End_Time__c + ', ' + shift.Add_Shift__r.Shift_Type__c + '<br/>' +
                '<b>• Facility:</b> ' + shift.Add_Shift__r.Facility__r.Name + '<br/>' +
                '<b>• Address:</b> ' + shift.Add_Shift__r.Location__Street__s + ', ' + shift.Add_Shift__r.Location__City__s + ', ' +
                shift.Add_Shift__r.Location__CountryCode__s + ', ' + shift.Add_Shift__r.Location__PostalCode__s + '<br/><br/>' +
                'Please take note of the above and ensure you report to your assigned shift accordingly.<br/><br/>' +
                '<b>Note:</b> This is an automated message. Please do not reply.<br/><br/>' +
                'Regards,<br/>' + shift.Staff__r.Organization_Full_Name__c;
            
            email.setHtmlBody(body);
            emails.add(email);
        }
        
        if (!emails.isEmpty()) {
            Messaging.sendEmail(emails);
        }
    }
    */

    private static void sendShiftEmails(List<ShiftwithStaff__c> shiftStaffList) {

        if (shiftStaffList.isEmpty()) {
            return;
        }

        // =========================================
        // GET ORGANIZATION EMAIL
        // =========================================

        User currentUser = [
            SELECT Id,
                Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        Organisation__c orgObj = [
            SELECT Id,
                Email__c
            FROM Organisation__c
            WHERE Name = :currentUser.Organization_Name__c
            LIMIT 1
        ];

        String senderEmailAddress =
            orgObj.Email__c;

        // =========================================
        // BULK EMAIL PAYLOAD
        // =========================================

        List<Object> bulkEmails =
            new List<Object>();

        for (ShiftwithStaff__c shift : shiftStaffList) {

            if (
                shift.Staff__r == null ||
                String.isBlank(
                    shift.Staff__r.Email_Address__c
                )
            ) {
                continue;
            }

            String subject =
                'New Shift Notification - ' +
                shift.Add_Shift__r.Shift_Type__c;

            String body =
                'Hi ' +
                shift.Staff__r.Display_Nickname__c +
                ',<br/><br/>' +

                'This email is to notify you that shift has been allocated to you by your roster manager.<br/><br/>' +

                'Here are the details of your shift:<br/>' +

                '<b>• Shift Date:</b> ' +
                reverseDateFormat(
                    String.valueOf(shift.Date__c)
                ) +
                '<br/>' +

                '<b>• Shift Timings and Type:</b> ' +
                shift.Add_Shift__r.Shift_Start_End_Time__c +
                ', ' +
                shift.Add_Shift__r.Shift_Type__c +
                '<br/>' +

                '<b>• Facility:</b> ' +
                shift.Add_Shift__r.Facility__r.Name +
                '<br/>' +

                '<b>• Address:</b> ' +
                shift.Add_Shift__r.Location__Street__s +
                ', ' +
                shift.Add_Shift__r.Location__City__s +
                ', ' +
                shift.Add_Shift__r.Location__CountryCode__s +
                ', ' +
                shift.Add_Shift__r.Location__PostalCode__s +
                '<br/><br/>' +

                'Please take note of the above and ensure you report to your assigned shift accordingly.<br/><br/>' +

                '<b>Note:</b> This is an automated message. Please do not reply.<br/><br/>' +

                'Regards,<br/>' +
                shift.Staff__r.Organization_Full_Name__c;

            // =====================================
            // EMAIL PAYLOAD
            // =====================================

            Map<String, Object> emailPayload =
                new Map<String, Object>();

            emailPayload.put(
                'fromEmail',
                senderEmailAddress
            );

            emailPayload.put(
                'toEmail',
                new List<String>{
                    shift.Staff__r.Email_Address__c
                }
            );

            emailPayload.put(
                'subject',
                subject
            );

            emailPayload.put(
                'body',
                body
            );

            // Optional Attachments

            List<String> attachments =
                new List<String>();

            if (!attachments.isEmpty()) {

                emailPayload.put(
                    'attachment',
                    attachments
                );
            }

            bulkEmails.add(emailPayload);
        }

        // =========================================
        // SEND BULK EMAILS
        // =========================================

        if (!bulkEmails.isEmpty()) {

            Id jobId = System.enqueueJob(

                new EmailRelayQueueable(
                    bulkEmails
                )
            );

            System.debug(
                '✅ Bulk Email Queueable Created: ' +
                jobId
            );

        } else {

            System.debug(
                '⚠️ No emails to send'
            );
        }
    }

    private static String reverseDateFormat(String inputDate) {
        if (inputDate == null) return '';
        List<String> parts = String.valueOf(inputDate).split('-'); // yyyy-MM-dd
        if (parts.size() == 3) {
            return parts[2] + '/' + parts[1] + '/' + parts[0]; // dd-MM-yyyy
        }
        return '';
    }

    public static void sendRejectedEmailNotification(string roleName, string facilityId, Add_Shift__c shift,list<string> rejectedStaffs) {
        system.debug('rejectedStaffs ' + rejectedStaffs);
        
        Add_Shift__c parentShift = shift;
        DateTime parentShiftStart = DateTime.newInstanceGMT(parentShift.Start_Date__c, parentShift.Start_Time__c);
        DateTime parentShiftEnd   = DateTime.newInstanceGMT(parentShift.End_Date__c, parentShift.End_Time__c);

        // =====================================================
        // GET ORGANIZATION EMAIL
        // =====================================================

        User currentUser = [
            SELECT Id,
                Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        Organisation__c orgObj = [
            SELECT Id,
                Email__c
            FROM Organisation__c
            WHERE Name = :currentUser.Organization_Name__c
            LIMIT 1
        ];

        String senderEmailAddress = orgObj.Email__c;
        
        // Step 1: Fetch all eligible staff (basic filters only)
        List<Staff__c> candidateStaffList = [
            SELECT Id, Name, Display_Nickname__c, Last_Name__c, Facility__c,
            Organization_Full_Name__c, Email_Address__c, Role__c,
            (SELECT Id, Add_Shift__r.Start_Date__c, Add_Shift__r.End_Date__c,
             Add_Shift__r.Start_Time__c, Add_Shift__r.End_Time__c
             FROM ShiftwithStaffs__r)
            FROM Staff__c
            // WHERE Role__c INCLUDES (:roleName)
            // AND Facility__c = :facilityId
            WHERE Id IN (
                SELECT Staff__c
                FROM Staff_Facility__c
                WHERE Active__c = true
                AND Facility__c = :facilityId
            )
            AND Id IN (
                SELECT StaffRole_To_Staff__c
                FROM StaffRole__c
                WHERE Active__c = true
                AND Facility__c = :facilityId
                AND RoleName__c = :roleName
            )
            AND Status__c = true
            AND Email_Address__c != null
            AND Id NOT IN :rejectedStaffs
        ];
        
        // Step 2: Filter staff by overlap check
        List<Staff__c> staffList = new List<Staff__c>();
        for (Staff__c staff : candidateStaffList) {Boolean hasOverlap = false;for (ShiftwithStaff__c ss : staff.ShiftwithStaffs__r) { DateTime staffShiftStart = DateTime.newInstanceGMT(ss.Add_Shift__r.Start_Date__c, ss.Add_Shift__r.Start_Time__c);DateTime staffShiftEnd   = DateTime.newInstanceGMT(ss.Add_Shift__r.End_Date__c, ss.Add_Shift__r.End_Time__c);if (staffShiftStart < parentShiftEnd && staffShiftEnd > parentShiftStart) { hasOverlap = true; break; } }if (!hasOverlap) { staffList.add(staff); }
        }
        
        system.debug('staffList ' + staffList);

        // =====================================================
        // BULK EMAIL PAYLOAD
        // =====================================================

        List<Object> bulkEmails = new List<Object>();
        
        // Step 3: Build and send emails
        // List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();
        // OrgWideEmailAddress[] owea = [SELECT Id FROM OrgWideEmailAddress WHERE Address = :System.Label.OrgWideEmailAddress LIMIT 1];
        
        for (Staff__c staff : staffList) {
            // Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
            // email.setToAddresses(new List<String>{ staff.Email_Address__c });
            // email.setOrgWideEmailAddressId(owea.get(0).Id);
            // email.setSenderDisplayName(staff.Organization_Full_Name__c);
            // system.debug('email user ' +staff.Display_Nickname__c);
            
            String subject = 'Shift Notification';
            String description = 'Shift has been scheduled on ' + 'Shift Date: ' + reverseDateFormat(String.valueOf(shift.Start_Date__c)) + 'from ' + 'Shift Timings and Type: ' + shift.Shift_Start_End_Time__c;
            String body = 'Hi ' + staff.Display_Nickname__c + ',<br/><br/>' +
                'This is to inform you that shift has been scheduled for the following requirement:<br/><br/>' +
                '<b>• Shift Date:</b> ' + reverseDateFormat(String.valueOf(shift.Start_Date__c)) + '<br/>' +
                '<b>• Shift Timings and Type:</b> ' + shift.Shift_Start_End_Time__c + ', ' + shift.Shift_Type__c + '<br/>' +
                '<b>• Facility:</b> ' + shift.Facility__r.Name + '<br/>' +
                '<b>• Address:</b> ' + shift.Location__Street__s + ',' + shift.Location__City__s + ',' +
                shift.Location__StateCode__s + ',' + shift.Location__CountryCode__s + ',' +
                shift.Location__PostalCode__s + '<br/>' +
                '<b>• Role:</b> ' + shift.Role__c + '<br/>' +
                'Kindly review the above details and acknowledge the shift at the earliest, if you wish to accept it.<br/><br/>' +
                '<b>Note:</b> This is an automated message. Please do not reply.<br/><br/><b>Regards,</b><br/>' +
                staff.Organization_Full_Name__c;

            // =============================================
            // EMAIL PAYLOAD
            // =============================================

            Map<String, Object> emailPayload =
                new Map<String, Object>();

            emailPayload.put(
                'fromEmail',
                senderEmailAddress
            );

            emailPayload.put(
                'toEmail',
                new List<String>{
                    staff.Email_Address__c
                }
            );

            emailPayload.put(
                'subject',
                subject
            );

            emailPayload.put(
                'body',
                body
            );

            bulkEmails.add(emailPayload);
            
            // email.setSubject(subject);
            // email.setHtmlBody(body);
            // emails.add(email);
        }

        if (!bulkEmails.isEmpty()) {

            Id jobId = System.enqueueJob(

                new EmailRelayQueueable(
                    bulkEmails
                )
            );

            System.debug(
                '✅ Bulk Email Queueable Created: ' +
                jobId
            );

        } else {

            System.debug(
                '⚠️ No emails to send'
            );
        }
        
        // if (!emails.isEmpty()) {
        //     Messaging.sendEmail(emails);
        // }
    }



    @AuraEnabled
    public static void sendSplitEmails(String shiftId, String roleId, String facilityId, String staffId, boolean isrecur, String Sdate, String Edate, String typeOfRecur, String recurEvery, list<String> weeklyDays, integer monthlyDay, boolean groupShift, boolean splitShift) {
        
        if (shiftId == null || roleId == null || facilityId == null) {
            throw new AuraHandledException('All parameters (shiftId, roleId, facilityId) are required.');
        }
        
        String weeklyDaysCommaSeparated = (weeklyDays != null && !weeklyDays.isEmpty()) ? String.join(weeklyDays, ',') : '';
        
        // Step 1: Query shift details with child records
        Add_Shift__c shift = [
            SELECT Id, Location__Street__s, Location__City__s, Location__PostalCode__s, Location__StateCode__s, Location__CountryCode__s,
            Facility__r.Name,  Start_Date__c, Start_Time__c, Start_time_Formula__c, End_Time__c, End_time_formula__c,//Role__c,
            Shift_Type__c, Is_EOI__c, Shift_Start_End_Time__c, EOI_staff__c,
            (SELECT Id, Staff__c, Shift_Address__Street__s, Shift_Address__City__s, Shift_Address__StateCode__s, Shift_Address__PostalCode__s, Shift_Address__CountryCode__s, Start_time_Formula__c, End_time_formula__c, Start_Date__c, Shift_End_Date__c, 
             (SELECT Id, Service_Type_Name__c, Participant_Name__c FROM Services_and_Support_Plans__r)
             FROM ShiftwithStaffs__r)
            FROM Add_Shift__c
            WHERE Id = :shiftId
            LIMIT 1
        ];
        
        set<Id> staffIdList = new set<Id>(); 
        
        if(splitShift == true){
            for(ShiftwithStaff__c ss : shift.ShiftwithStaffs__r){
                staffIdList.add(ss.Staff__c);
            }
        }
        
        List<Staff__c> staffList = [
            SELECT Id, Name, Display_Nickname__c, Last_Name__c, Facility__c, Organization_Full_Name__c, Email_Address__c, Role__c, User__c
            FROM Staff__c
            WHERE Id IN :staffIdList AND Status__c = true AND Email_Address__c != null
        ];
        
        // Create lists for emails and notifications
        // List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();
        // =========================================
        // GET ORGANIZATION EMAIL
        // =========================================

        User currentUser = [
            SELECT Id, Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        Organisation__c orgObj = [
            SELECT Id, Email__c
            FROM Organisation__c
            WHERE Name = :currentUser.Organization_Name__c
            LIMIT 1
        ];

        String senderEmailAddress = orgObj.Email__c;

        // =========================================
        // BULK EMAIL PAYLOAD
        // =========================================

        List<Object> bulkEmails = new List<Object>();
        List<My_Notification__c> notifications = new List<My_Notification__c>();
        
        // Get Org Wide Email Address
        // List<OrgWideEmailAddress> owea = [SELECT Id FROM OrgWideEmailAddress LIMIT 1];
        
        // Create staff ID to Staff record map for easy lookup
        Map<Id, Staff__c> staffMap = new Map<Id, Staff__c>();
        for(Staff__c staff : staffList) {
            staffMap.put(staff.Id, staff);
        }
        
        // Create email to User ID map for notifications
        Map<String, Id> emailToUserIdMap = new Map<String, Id>();
        for(Staff__c staff : staffList) {
            if(staff.Email_Address__c != null && staff.User__c != null) {
                emailToUserIdMap.put(staff.Email_Address__c.trim().toLowerCase(), staff.User__c);
            }
        }
        
        // ✅ CORRECTED: Iterate through EACH CHILD RECORD (ShiftwithStaff__c)
        for (ShiftwithStaff__c staffShift : shift.ShiftwithStaffs__r) {
            
            // Get the staff member for this child record
            Staff__c staff = staffMap.get(staffShift.Staff__c);
            
            if(staff == null || staff.Email_Address__c == null) continue;
            
            // Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
            // email.setToAddresses(new List<String>{ staff.Email_Address__c });
            // email.setSenderDisplayName(staff.Organization_Full_Name__c);
            /*
            if(!owea.isEmpty()) {
                email.setOrgWideEmailAddressId(owea.get(0).Id);
            }
            */
            String body;
            String subject;
            String description;
            
            // Non-recurring shift logic (modified for child records)
            if (!isrecur) {
                System.debug('groupShift/splitShift true for ' + staff.Display_Nickname__c);
                
                String serviceLine = '';
                if (!staffShift.Services_and_Support_Plans__r.isEmpty()) {
                    if (!String.isBlank(staffShift.Services_and_Support_Plans__r[0].Participant_Name__c)) {
                        serviceLine += '<b>• Participant:</b> ' + staffShift.Services_and_Support_Plans__r[0].Participant_Name__c + '<br/>';
                    }
                    if (!String.isBlank(staffShift.Services_and_Support_Plans__r[0].Service_Type_Name__c)) {
                        serviceLine += '<b>• Service:</b> ' + staffShift.Services_and_Support_Plans__r[0].Service_Type_Name__c;
                    }
                    if (serviceLine != '') serviceLine += '<br/>';
                }
                
                // Use child record address and timings
                String childAddress = '';
                if (!String.isBlank(staffShift.Shift_Address__Street__s)) { childAddress = staffShift.Shift_Address__Street__s;if (!String.isBlank(staffShift.Shift_Address__City__s)) childAddress += ', ' + staffShift.Shift_Address__City__s;if (!String.isBlank(staffShift.Shift_Address__StateCode__s)) childAddress += ', ' + staffShift.Shift_Address__StateCode__s; if (!String.isBlank(staffShift.Shift_Address__CountryCode__s)) childAddress += ', ' + staffShift.Shift_Address__CountryCode__s;if (!String.isBlank(staffShift.Shift_Address__PostalCode__s)) childAddress += ', ' + staffShift.Shift_Address__PostalCode__s;
                } else {
                    // Fallback to parent shift address
                    childAddress = shift.Location__Street__s + ',' + shift.Location__City__s + ',' + shift.Location__StateCode__s + ',' + shift.Location__CountryCode__s + ',' + shift.Location__PostalCode__s;
                }
                
                // Use child record timings or fallback to parent
                String startTime = staffShift.Start_time_Formula__c != null ? staffShift.Start_time_Formula__c : shift.Start_time_Formula__c;
                String endTime = staffShift.End_time_formula__c != null ? staffShift.End_time_formula__c : shift.End_time_formula__c;
                String shiftTimings = startTime + ' - ' + endTime;
                
                subject = 'Shift Allocation Notification';
                description = 'A shift has been allocated to you on ' + 'Shift Date: ' + reverseDateFormat(String.valueOf(staffShift.Start_Date__c)) + ' for the timings: ' + shiftTimings;
                
                body = 'Hi ' + staff.Display_Nickname__c + ',<br/><br/>' +
                    'This email is to notify you that shift has been allocated to you by your roster manager. <br/><br/>' +
                    'Here are the details of your shift:<br/>'+
                    '<b>• Shift Date:</b> ' + reverseDateFormat(String.valueOf(staffShift.Start_Date__c)) + '<br/>' +
                    '<b>• Shift Timings and Type:</b> ' + shiftTimings + ', ' + shift.Shift_Type__c + '<br/>' +
                    '<b>• Facility:</b> ' + shift.Facility__r.Name + '<br/>' +
                    '<b>• Address:</b> ' + childAddress + '<br/>' +
                    serviceLine +
                    'Please take note of the above and ensure you report to your assigned shift accordingly.<br/><br/><b>Note:</b> This is an automated message. Please do not reply.<br/><br/><b>Regards,</b><br/>' +
                    staff.Organization_Full_Name__c;
            }
            // Recurring shift with child record data
            else if (isrecur) {
                System.debug('Recurring groupShift/splitShift true for ' + staff.Display_Nickname__c);
                
                String dayLabel = recurEvery == '1' ? 'day' : 'days';
                String weekLabel = recurEvery == '1' ? 'week' : 'weeks';
                String monthLabel = recurEvery == '1' ? 'month' : 'months';
                String recurLine = '';
                
                // Use child record timings or fallback to parent
                String startTime = staffShift.Start_time_Formula__c != null ? staffShift.Start_time_Formula__c : shift.Start_time_Formula__c;
                String endTime = staffShift.End_time_formula__c != null ? staffShift.End_time_formula__c : shift.End_time_formula__c;
                String childShiftTimings = startTime + ' - ' + endTime;
                
                if (typeOfRecur == 'daily') {
                    recurLine = 'This is to notify you that your shift (' + shift.Shift_Type__c + ' ' + 
                        childShiftTimings + ') is set to recur daily for (every ' + recurEvery + ' ' + dayLabel + ') from ' + 
                        reverseDateFormat(Sdate) + ' to ' + reverseDateFormat(Edate) + '.';
                } else if (typeOfRecur == 'weekly') {
                    recurLine = 'This is to notify you that your shift (' + shift.Shift_Type__c + ' ' + 
                        childShiftTimings + ') is set to recur weekly (every ' + recurEvery + ' ' + weekLabel + ') on the same weekday, from ' + 
                        reverseDateFormat(Sdate) + ' to ' + reverseDateFormat(Edate) + ' on ' + weeklyDaysCommaSeparated + '.';
                } else if (typeOfRecur == 'fortnightly') {
                    recurLine = 'This is to notify you that your shift (' + shift.Shift_Type__c + ' ' + 
                        childShiftTimings + ') is set to recur fortnightly from ' + 
                        reverseDateFormat(Sdate) + ' to ' + reverseDateFormat(Edate) + '.';
                } else if (typeOfRecur == 'monthly') {
                    recurLine = 'This is to notify you that your shift (' + shift.Shift_Type__c + ' ' + 
                        childShiftTimings + ') is set to recur monthly (every ' + recurEvery + ' ' + monthLabel + ') from ' + 
                        reverseDateFormat(Sdate) + ' to ' + reverseDateFormat(Edate) + ' on ' + monthlyDay + '.';
                } else {
                    recurLine = 'This is to notify you that your shift (' + shift.Shift_Type__c + ' ' + 
                        childShiftTimings + ') is set to recur ' + typeOfRecur + 
                        ' (every ' + recurEvery + ') from ' + reverseDateFormat(Sdate) + ' to ' + reverseDateFormat(Edate) + '.';
                }
                
                String serviceLine = '';
                if (!staffShift.Services_and_Support_Plans__r.isEmpty()) {
                    if (!String.isBlank(staffShift.Services_and_Support_Plans__r[0].Participant_Name__c)) {
                        serviceLine += '<b>• Participant:</b> ' + staffShift.Services_and_Support_Plans__r[0].Participant_Name__c + '<br/>';
                    }
                    if (!String.isBlank(staffShift.Services_and_Support_Plans__r[0].Service_Type_Name__c)) {
                        serviceLine += '<b>• Service:</b> ' + staffShift.Services_and_Support_Plans__r[0].Service_Type_Name__c + '<br/>';
                    }
                    if (serviceLine != '') serviceLine += '<br/>';
                }
                
                // Use child record address or fallback to parent
                String childAddress = '';
                if (!String.isBlank(staffShift.Shift_Address__Street__s)) {
                    childAddress = staffShift.Shift_Address__Street__s;
                    if (!String.isBlank(staffShift.Shift_Address__City__s)) childAddress += ', ' + staffShift.Shift_Address__City__s;
                    if (!String.isBlank(staffShift.Shift_Address__StateCode__s)) childAddress += ', ' + staffShift.Shift_Address__StateCode__s;
                    if (!String.isBlank(staffShift.Shift_Address__CountryCode__s)) childAddress += ', ' + staffShift.Shift_Address__CountryCode__s;
                    if (!String.isBlank(staffShift.Shift_Address__PostalCode__s)) childAddress += ', ' + staffShift.Shift_Address__PostalCode__s;
                } else {
                    // Fallback to parent shift address
                    childAddress = shift.Location__Street__s + ',' + shift.Location__City__s + ',' + shift.Location__StateCode__s + ',' + shift.Location__CountryCode__s + ',' + shift.Location__PostalCode__s;
                }
                
                subject = 'Recurring Shift Notification - ' + typeOfRecur;
                description = recurLine;
                
                body = 'Hi ' + staff.Display_Nickname__c + ',<br/><br/>' +
                    recurLine +
                    '<br> Here are the key details of your shift:<br/>' +
                    '<b>• Facility:</b> ' + shift.Facility__r.Name + '<br/>' +  
                    '<b>• Address:</b> ' + childAddress + '<br/>' +   
                    serviceLine +
                    'Please contact your roster manager if you need to make changes to your recurring shift details.   <br/>' +
                    'Kindly take note of the above and ensure you report to your assigned shift accordingly.   <br/><br/>' +
                    '<b>Note:</b> This is an automated message. Please do not reply.<br/><br/>' +
                    '<b>Regards,</b><br/>' +
                    staff.Organization_Full_Name__c;
            }
            // Default fallback for other scenarios
            else {
                // Use child record address and timings for default case too
                String childAddress = '';
                if (!String.isBlank(staffShift.Shift_Address__Street__s)) {
                    childAddress = staffShift.Shift_Address__Street__s;
                    if (!String.isBlank(staffShift.Shift_Address__City__s)) childAddress += ', ' + staffShift.Shift_Address__City__s;
                    if (!String.isBlank(staffShift.Shift_Address__StateCode__s)) childAddress += ', ' + staffShift.Shift_Address__StateCode__s;
                    if (!String.isBlank(staffShift.Shift_Address__CountryCode__s)) childAddress += ', ' + staffShift.Shift_Address__CountryCode__s;
                    if (!String.isBlank(staffShift.Shift_Address__PostalCode__s)) childAddress += ', ' + staffShift.Shift_Address__PostalCode__s;
                } else {
                    childAddress = shift.Location__Street__s + ',' + shift.Location__City__s + ',' + shift.Location__StateCode__s + ',' + shift.Location__CountryCode__s + ',' + shift.Location__PostalCode__s;
                }
                
                // Use child record timings or fallback to parent
                String startTime = staffShift.Start_time_Formula__c != null ? staffShift.Start_time_Formula__c : shift.Start_time_Formula__c;
                String endTime = staffShift.End_time_formula__c != null ? staffShift.End_time_formula__c : shift.End_time_formula__c;
                String shiftTimings = startTime + ' - ' + endTime;
                
                subject = 'Shift Assignment - Notification';
                description = 'A new shift has been scheduled on ' + 'Shift Date: ' + reverseDateFormat(String.valueOf(staffShift.Start_Date__c)) + 'Shift Timings: ' + shiftTimings;
                
                body = 'Hi ' + staff.Display_Nickname__c + ',<br/><br/>' +
                    'This is to inform you that shift has been scheduled for the following requirement:<br/><br/>' +
                    '<b>• Shift Date:</b> ' + reverseDateFormat(String.valueOf(staffShift.Start_Date__c)) + '<br/>' +
                    '<b>• Shift Timings and Type:</b> ' + shiftTimings + ', ' + shift.Shift_Type__c + '<br/>' +
                    '<b>• Facility:</b> ' + shift.Facility__r.Name + '<br/>' +
                    '<b>• Address:</b> ' + childAddress + '<br/>' +
                   // '<b>• Role:</b> ' + shift.Role__c + '<br/>' +
                    'Kindly review the above details and acknowledge the shift at the earliest, if you wish to accept it.<br/><br/><b>Note:</b> This is an automated message. Please do not reply.<br/><br/><b>Regards,</b><br/>' +
                    staff.Organization_Full_Name__c;
            }
            
            // email.setSubject(subject);
            // email.setHtmlBody(body);
            // emails.add(email);

            Map<String, Object> emailPayload = new Map<String, Object>();

            emailPayload.put(
                'fromEmail',
                senderEmailAddress
            );

            emailPayload.put(
                'toEmail',
                new List<String>{
                    staff.Email_Address__c
                }
            );

            emailPayload.put(
                'subject',
                subject
            );

            emailPayload.put(
                'body',
                body
            );

            // Optional Attachments
            List<String> attachments =
                new List<String>();

            if (!attachments.isEmpty()) {

                emailPayload.put(
                    'attachment',
                    attachments
                );
            }

            bulkEmails.add(emailPayload);
            
            // Send the email
            // List<Messaging.SendEmailResult> results = Messaging.sendEmail(emails);
            
            // Check for success
            // for (Messaging.SendEmailResult result : results) {
            //     if (result.isSuccess()) {
            //         System.debug('✅ Email sent successfully to: ' );
            //     } else {
            //         System.debug('❌ Email failed: ' + result.getErrors());
            //     }
            // }
            
            
            // Create notification
            Id userId = emailToUserIdMap.get(
                staff.Email_Address__c != null ? staff.Email_Address__c.trim().toLowerCase() : null
            );
            if(userId != null) {
                notifications.add(new My_Notification__c(
                    User__c = userId,
                    Subject__c = subject,
                    Description__c = description
                ));
            }
        }
        
        // Send emails and insert notifications
        // if (!emails.isEmpty()) {
            
        //     System.debug('=== Total emails prepared: ' + emails.size());
            
        //     // Log each recipient
        //     for (Messaging.SingleEmailMessage e : emails) {
        //         System.debug('Email prepared for: ' + e.getToAddresses());
        //     }
            
        //     Messaging.sendEmail(emails);
        // }

        if (!bulkEmails.isEmpty()) {

            System.debug(
                '=== Total Bulk Emails Prepared: ' +
                bulkEmails.size()
            );

            Id jobId = System.enqueueJob(

                new EmailRelayQueueable(
                    bulkEmails
                )
            );

            System.debug(
                '✅ Bulk Email Queueable Created: ' +
                jobId
            );
        }

        if (!notifications.isEmpty()) {
            insert notifications;
        }
    }
    
/*
    public static void sendEarlyLogoutNotification(ShiftwithStaff__c shiftStaff, Map<Id, String> userEmailMap) {
        System.debug('🔹 Entered sendEarlyLogoutNotification method');
        try {
            // Debug: Incoming shift record
            System.debug('🟢 shiftStaff Record: ' + JSON.serializePretty(shiftStaff));
            
            // Check if CreatedById and Staff Name are populated
            System.debug('👤 CreatedById: ' + shiftStaff.CreatedById);
            System.debug('👤 Staff Name: ' + shiftStaff.Staff_Name__c);
            System.debug('⏰ Logout Time: ' + shiftStaff.Logout_Time_Formula__c);
            System.debug('⏰ Shift Start Time: ' + shiftStaff.Shift_Start_Time__c);
            System.debug('⏰ Shift End Time: ' + shiftStaff.Shift_End_Time__c);
            String createdByEmail = userEmailMap.get(shiftStaff.CreatedById);
            System.debug('📧 CreatedBy Email (from map): ' + createdByEmail);
            
            // Compose email
            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
            mail.setToAddresses(new String[]{createdByEmail});
            mail.setSubject('Early Logout Alert by - ' + shiftStaff.Staff_Name__c);
            mail.setPlainTextBody(
                shiftStaff.Staff_Name__c + 
                ' has logged out early at ' + shiftStaff.Logout_Time_Formula__c +
                ' for the shift start time: ' + shiftStaff.Shift_Start_Time__c +
                ' and end time: ' + shiftStaff.Shift_End_Time__c
            );
            
            System.debug('📧 Email prepared successfully.');
            System.debug('📧 To: ' + shiftStaff.CreatedById);
            System.debug('📧 To: ' + createdByEmail);
            System.debug('📧 Subject: ' + mail.getSubject());
            System.debug('📧 Body: ' + mail.getPlainTextBody());
            
            String startTimeFormatted = formatTime(shiftStaff.Shift_Start_Time__c);
            String endTimeFormatted   = formatTime(shiftStaff.Shift_End_Time__c);
            String logoutTimeFormatted = formatTime(shiftStaff.Log_Out_Date_Time__c);
            
            // Send email
            Messaging.sendEmail(new Messaging.SingleEmailMessage[]{mail});
            System.debug('✅ Email sent successfully.');
            
            // In-app notification creation
            My_Notification__c notification = new My_Notification__c();
            notification.Subject__c = 'Early Logout Alert by ' + shiftStaff.Staff_Name__c;
            notification.Description__c = 
                shiftStaff.Staff_Name__c + 
                ' has logged out early at ' + logoutTimeFormatted + 
                ' for the shift start time: ' + startTimeFormatted + 
                ' and end time: ' + endTimeFormatted;
            notification.User__c = shiftStaff.CreatedById;
            
            System.debug('🔔 Notification object prepared: ' + JSON.serializePretty(notification));
            
            insert notification;
            System.debug('✅ Notification inserted successfully. Notification Id: ' + notification.Id);
            
        } catch (Exception e) {
            System.debug('❌ Error sending early logout notification: ' + e.getMessage());
            System.debug('❌ Stack Trace: ' + e.getStackTraceString());
        }
    }
    */

    public static void sendEarlyLogoutNotification(
        ShiftwithStaff__c shiftStaff,
        Map<Id, String> userEmailMap
    ) {

        System.debug('🔹 Entered sendEarlyLogoutNotification method');

        try {

            System.debug(
                '🟢 shiftStaff Record: ' +
                JSON.serializePretty(shiftStaff)
            );

            String createdByEmail =
                userEmailMap.get(shiftStaff.CreatedById);

            System.debug(
                '📧 CreatedBy Email: ' +
                createdByEmail
            );

            String startTimeFormatted =
                formatTime(shiftStaff.Shift_Start_Time__c);

            String endTimeFormatted =
                formatTime(shiftStaff.Shift_End_Time__c); String logoutTimeFormatted = formatTime(shiftStaff.Log_Out_Date_Time__c); User currentUser = [ SELECT Id,Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1 ]; Organisation__c orgObj = [ SELECT Id, Email__c FROM Organisation__c WHERE Name = :currentUser.Organization_Name__c LIMIT 1];

            String senderEmailAddress =
                orgObj.Email__c;

            /* =========================================
            EMAIL SUBJECT + BODY
            ========================================= */

            String subject =
                'Early Logout Alert by - ' +
                shiftStaff.Staff_Name__c;

            String body =
                '<b>' + shiftStaff.Staff_Name__c + '</b>' +
                ' has logged out early at <b>' +
                logoutTimeFormatted +
                '</b><br/><br/>' +

                '<b>Shift Start Time:</b> ' +
                startTimeFormatted +
                '<br/>' +

                '<b>Shift End Time:</b> ' +
                endTimeFormatted;

            /* =========================================
            QUEUEABLE EMAIL
            ========================================= */

            if (String.isNotBlank(createdByEmail)) {

                List<String> toEmails =
                    new List<String>{ createdByEmail };

                Id jobId = System.enqueueJob(

                    new EmailRelayQueueable(
                        senderEmailAddress,
                        toEmails,
                        subject,
                        body
                    )
                );

                System.debug(
                    '✅ Email Queueable Job Created: ' +
                    jobId
                );

            } else {

                System.debug(
                    '⚠️ CreatedBy Email is blank'
                );
            }

           

            My_Notification__c notification = new My_Notification__c();notification.Subject__c ='Early Logout Alert by ' + shiftStaff.Staff_Name__c;notification.Description__c = shiftStaff.Staff_Name__c + ' has logged out early at ' + logoutTimeFormatted + ' for the shift start time: ' + startTimeFormatted + ' and end time: ' + endTimeFormatted;notification.User__c = shiftStaff.CreatedById;  insert notification;

            System.debug(
                '✅ Notification inserted successfully. Notification Id: ' +
                notification.Id
            );

        } catch (Exception e) {

            System.debug(
                '❌ Error sending early logout notification: ' +
                e.getMessage()
            );

            System.debug(
                '❌ Stack Trace: ' +
                e.getStackTraceString()
            );
        }
    }
    
        // Helper method to format Time into 12-hour format (e.g., 9:00 PM)
        public static String formatTime(Time t) {
            if (t == null) return 'N/A';
            
            Integer hour = t.hour();
            Integer minute = t.minute();
            String ampm = 'AM';
            
            if (hour >= 12) {
                ampm = 'PM';
                if (hour > 12) hour -= 12;
            } else if (hour == 0) {
                hour = 12;
            }
            
            String minuteStr = (minute < 10) ? '0' + minute : String.valueOf(minute);
            return String.valueOf(hour) + ':' + minuteStr + ' ' + ampm;
        }

        @AuraEnabled(cacheable=true)
        public static List<Map<String,String>> getStaffOptions(Id templateId) {

            List<Map<String,String>> options =
                new List<Map<String,String>>();

            User currentUser = [

                SELECT Id,
                    Organization_Name__c

                FROM User

                WHERE Id = :UserInfo.getUserId()

                LIMIT 1
            ];

            List<User> validUsers = [

                SELECT Id,
                    Email,
                    User_Type__c,
                    Organization_Name__c

                FROM User

                WHERE IsActive = true

                AND User_Type__c IN (
                    'HR Admin',
                    'Roster Manager'
                )

                AND Organization_Name__c =
                    :currentUser.Organization_Name__c

                AND Email != null
            ];

            Set<String> userEmails =
                new Set<String>();

            for (User u : validUsers) {

                userEmails.add(
                    u.Email.toLowerCase()
                );
            }

            for (Staff__c st : [

                SELECT Id,
                    NameToDisplay__c,
                    Email_Address__c

                FROM Staff__c

                WHERE Status__c = true

                AND Email_Address__c IN :userEmails

                ORDER BY NameToDisplay__c ASC
            ]) {

                Map<String,String> opt =
                    new Map<String,String>();

                opt.put(
                    'label',
                    st.NameToDisplay__c
                );

                opt.put(
                    'value',
                    st.Id
                );

                options.add(opt);
            }

            return options;
        }

}