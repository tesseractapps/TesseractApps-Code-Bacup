public class ShiftwithStaffController {   
    @AuraEnabled(cacheable=true)
    public static List<ShiftDataWrapper> getShiftData(String userId, Id facilityId, Date startDate, Date endDate) {
        system.debug('📅 startDate: ' + startDate);
        system.debug('📅 endDate: ' + endDate);
        system.debug('🏥 facilityId: ' + facilityId);
        
        // Get the user's organization name
        Id currentUserId = UserInfo.getUserId();
        User userRecord = [
            SELECT Id, Name, Organization_Name__c
            FROM User
            WHERE Id = :currentUserId
            LIMIT 1
        ];
        
        if (String.isBlank(userRecord.Organization_Name__c)) {
            throw new AuraHandledException('The user does not have an organization name defined.');
        }
        
        // Get staff linked to the same organization
        List<Staff__c> staffRecords = [
            SELECT Id, Organization_Full_Name__c
            FROM Staff__c
            WHERE Organization_Full_Name__c = :userRecord.Organization_Name__c
        ];
        
        if (staffRecords.isEmpty()) {
            throw new AuraHandledException('No staff records found for the user\'s organization.');
        }
        
        Set<Id> staffIds = new Set<Id>();
        for (Staff__c staff : staffRecords) {
            staffIds.add(staff.Id);
        }
        
        // Aggregate shifts by Date and Status
        List<AggregateResult> results = [
            SELECT Date__c day, COUNT(Id) recordCount, Status__c status
            FROM ShiftwithStaff__c
            WHERE Date__c >= :startDate
            AND Date__c <= :endDate
            AND Staff__c IN :staffIds
            AND Add_Shift__r.Facility__c = :facilityId
            AND Shift_Rejected__c = false
            GROUP BY Date__c, Status__c
            ORDER BY Date__c, Status__c
        ];
        
        // Convert results into wrapper objects
        List<ShiftDataWrapper> shiftData = new List<ShiftDataWrapper>();
        for (AggregateResult result : results) {
            shiftData.add(new ShiftDataWrapper(
                (Date) result.get('day'),
                ((Long) result.get('recordCount')).intValue(),
                (String) result.get('status')
            ));
        }
        
        return shiftData;
    }
    
    // Wrapper class definition
    public class ShiftDataWrapper {
        @AuraEnabled
        public Date day { get; set; }
        @AuraEnabled
        public Integer recordCount { get; set; }
        @AuraEnabled
        public String status { get; set; }
        
        public ShiftDataWrapper(Date day, Integer recordCount, String status) {
            this.day = day;
            this.recordCount = recordCount;
            this.status = status;
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static List<ShiftWrapper> getStaffWeekData() {
        String userEmail = UserInfo.getUserEmail(); 
        System.debug('Entered getStaffWeekData method');
        System.debug('User Email: ' + userEmail);
        
        // Validate user email
        if (String.isBlank(userEmail)) {
            System.debug('Error: User email is null or empty');
            throw new AuraHandledException('User email cannot be null or empty.');
        }
        
        try {
            // Query shift data for the past 7 days
            System.debug('Querying ShiftwithStaff__c records...');
            List<AggregateResult> results = [
                SELECT Date__c day, 
                SUM(Duration__c) totalDuration, 
                SUM(Actual_Duration__c) actualDuration, 
                Status__c status
                FROM ShiftwithStaff__c
                WHERE Date__c = LAST_N_DAYS:7 
                AND Staff__r.Email_Address__c = :userEmail
                GROUP BY Date__c, Status__c
                ORDER BY Date__c, Status__c
            ];
            
            System.debug('Query Result - Aggregated Data: ' + results);
            
            // Process results into ShiftWrapper objects
            List<ShiftWrapper> shiftData = new List<ShiftWrapper>();
            for (AggregateResult result : results) {
                shiftData.add(new ShiftWrapper(
                    (Date) result.get('day'),
                    ((Double) result.get('totalDuration')), // Sum of Duration__c
                    ((Double) result.get('actualDuration')), // Sum of Actual_Duration__c
                    (String) result.get('status')
                ));
            }
            
            System.debug('Processed Shift Data: ' + shiftData);
            
            // Return the result
            System.debug('Exiting getStaffWeekData method successfully');
            return shiftData;
        } catch (Exception e) {
            System.debug('Error occurred in getStaffWeekData: ' + e.getMessage());
            throw new AuraHandledException('An error occurred while fetching shift data: ' + e.getMessage());
        }
    }
    
    // Wrapper class definition
    public class ShiftWrapper {
        @AuraEnabled
        public Date day { get; set; }
        @AuraEnabled
        public Double totalDuration { get; set; }
        @AuraEnabled
        public Double actualDuration { get; set; }
        @AuraEnabled
        public String status { get; set; }
        
        public ShiftWrapper(Date day, Double totalDuration, Double actualDuration, String status) {
            this.day = day;
            this.totalDuration = totalDuration;
            this.actualDuration = actualDuration;
            this.status = status;
        }
    }   
    
    @AuraEnabled(cacheable=true)
    public static List<gettimesheetDataWrapper> gettimesheetData(String userId, String selectedRange) {
        if (String.isBlank(userId)) {
            throw new AuraHandledException('User ID cannot be null or empty.');
        }
        
        User userRecord = [SELECT Id, Name, User_Type__c, Email, Organization_Name__c FROM User WHERE Id = :userId LIMIT 1];
        
        if (String.isBlank(userRecord.Organization_Name__c)) {
            throw new AuraHandledException('The user does not have an organization name defined.');
        }
        
        List<Staff__c> staffRecords = [
            SELECT Id, Organization_Full_Name__c 
            FROM Staff__c 
            WHERE Organization_Full_Name__c = :userRecord.Organization_Name__c
        ];
        
        List<Staff__c> staffList = [SELECT Id, Email_Address__c FROM Staff__c WHERE Email_Address__c = :userRecord.Email LIMIT 1];
        
        if (staffRecords.isEmpty()) {
            throw new AuraHandledException('No staff records found for the user\'s organization.');
        }
        
        Set<Id> staffIds = new Set<Id>();
        Integer numberOfWeeks = 1;
        if (String.isNotBlank(selectedRange) && selectedRange.endsWith('w')) {
            numberOfWeeks = Integer.valueOf(selectedRange.replace('w', ''));
        }
        
        Date today = Date.today();
        Date startOfRange = today.addDays(-7 * numberOfWeeks);
        Date endOfRange = today;
        
        List<AggregateResult> results = new List<AggregateResult>();
        
        if (userRecord.User_Type__c == 'ICT Admin') {
            for (Staff__c staff : staffRecords) {
                staffIds.add(staff.Id);
            }
            results = [
                SELECT Start_Date__c day, COUNT(Id) recordCount, Status__c status
                FROM Allocation__c 
                WHERE Start_Date__c >= :startOfRange AND Start_Date__c <= :endOfRange AND Staff__c IN :staffIds
                GROUP BY Start_Date__c, Status__c 
                ORDER BY Start_Date__c, Status__c
            ];
        } else {
            Id staffId = staffList[0].Id;
            results = [
                SELECT Start_Date__c day, COUNT(Id) recordCount, Status__c status
                FROM Allocation__c 
                WHERE Start_Date__c >= :startOfRange AND Start_Date__c <= :endOfRange AND Staff__c = :staffId
                GROUP BY Start_Date__c, Status__c 
                ORDER BY Start_Date__c, Status__c
            ];
        }
        
        List<gettimesheetDataWrapper> shiftData = new List<gettimesheetDataWrapper>();
        for (AggregateResult result : results) {
            Date day = (Date) result.get('day');
            String status = (String) result.get('status');
            Integer recordCount = ((Long) result.get('recordCount')).intValue();
            shiftData.add(new gettimesheetDataWrapper(day, recordCount, status));
        }
        
        return shiftData;
    }
    
    public class gettimesheetDataWrapper {
        @AuraEnabled public Date day { get; set; }
        @AuraEnabled public Integer recordCount { get; set; }
        @AuraEnabled public String status { get; set; }
        
        public gettimesheetDataWrapper(Date day, Integer recordCount, String status) {
            this.day = day;
            this.recordCount = recordCount;
            this.status = status;
        }
    }
    
    @AuraEnabled 
    public static list<ShiftwithStaff__c> getAllShiftWithSatff(String staffId,String StartDate,String EndDate){
        Date sDate = Date.valueOf(StartDate);
        Date eDate = Date.valueOf(EndDate);
        List<ShiftwithStaff__c> shifts = [select id,Staff__r.Email_Address__c,Staff__r.Name__c,Staff__r.Name,Staff__r.Enable_Geolocation__c,Staff__r.Role__c,Staff__r.Last_Name__c,Staff__r.picture__c,Facility__c,Add_Shift__r.Start_Date__c ,Actual_Duration__c,Add_Shift__r.Shift_Type__c,
                                          Shift_Type__c,Start_time_Formula__c,End_time_formula__c,Add_Shift__r.Shift_Start_End_Time__c,Attendence__c,Staff__c,Date__c,Shift_Wage__c,Add_Shift__r.Role__c,
                                          Staff__r.Set_Hours__c,Duration__c,Add_Shift__r.Duration__c,Log_In_Date_Time__c,Log_Out_Date_Time__c,Approval_Status__c,Actual_Duration_In_Hours_and_Mins__c,
                                          (SELECT Id,Client__c,Client__r.First_Name__c,Client__r.Last_Name__c,Client__r.Picture__c FROM Services_and_Support_Plans__r ORDER BY CreatedDate ASC LIMIT 1)
                                          from ShiftwithStaff__c where Add_Shift__r.Start_Date__c >=:sDate AND Add_Shift__r.Start_Date__c <=:eDate And  Staff__c =: staffId AND  Shift_Rejected__c= false and Attendence__c=true ];
        return shifts;
    }
    
    /* @AuraEnabled
public static void updateShiftDetails(Boolean enableGeolocation, Boolean enableSignin, Boolean enableSignout, String selectedComments, String staffId, String shiftwithstaffId) {
try {
String notifTitle;
String notifBody;
Id staffIdforemail;
Staff__c staff = [SELECT Id, Enable_Geolocation__c,Email_Address__c FROM Staff__c WHERE Id = :staffId LIMIT 1];
staff.Enable_Geolocation__c = enableGeolocation;
User staffUser = [
SELECT Id, Email 
FROM User 
WHERE Email = :staff.Email_Address__c
LIMIT 1
];            
ShiftwithStaff__c ShiftwithStaff = [SELECT Id, Date__c,Enable_Sign_In__c,Enable_Sign_Out__c,Start_Time__c,Schedule_Sign_Out_Date_Time__c,Enable_Sign_In_Comments__c,Staff__c,Staff__r.Name,Staff__r.Email_Address__c,Staff__r.Organization_Full_Name__c  FROM ShiftwithStaff__c WHERE Id = :shiftwithstaffId LIMIT 1];
ShiftwithStaff.Enable_Sign_In__c = enableSignin;
ShiftwithStaff.Enable_Sign_In_Comments__c = selectedComments;
ShiftwithStaff.Enable_Sign_Out__c = enableSignout;

Update staff;
Update ShiftwithStaff;
String scheduledEnd = 'N/A';
String actualEnd = 'N/A';
if(ShiftwithStaff.Enable_Sign_Out__c == true){
Time signOutTime = ShiftwithStaff.Schedule_Sign_Out_Date_Time__c.time();
scheduledEnd = formatTime12Hr(signOutTime);
notifTitle = 'Late Sign-Out Approved';
notifBody = 'Your late sign-out request has been approved.'+
'Scheduled Time:'+ scheduledEnd + '| Actual Time: '+ ShiftwithStaff.Start_Time__c + 
'Remarks: '+ selectedComments;
String body = 'Hi ' + ShiftwithStaff.Staff__r.Name + ',<br/><br/>' +
'This is to inform you that a signout has been Approved for the following shift details:<br/><br/>' +
'<b>• Shift Date:</b> ' + ShiftwithStaff.Date__c + '<br/>' +
'<b>• Actual Time:</b> ' + ShiftwithStaff.Start_Time__c +  
'<b>• Scheduled Time:</b> ' + scheduledEnd + '<br/>' +
'<b>• Reason:</b> ' + selectedComments + '<br/><br/>' +
'<b>Note:</b> This is an automated message. Please do not reply.<br/><br/>' +
'<b>Regards,</b><br/>' +
ShiftwithStaff.Staff__r.Organization_Full_Name__c;
string email = ShiftwithStaff.Staff__r.Email_Address__c;
List<String> toAddresses = new List<String>{ email };
EmailSenderNotification.sendSingleEmail(toAddresses, notifTitle, body);
MobileNotification.sendNotification(ShiftwithStaff.Staff__c, notifTitle, notifBody);
if (staffUser != null) {
My_Notification__c notification = new My_Notification__c();
notification.User__c = staffUser.Id;
notification.Subject__c = notifTitle;
notification.Description__c = notifBody;
insert notification;
}
} else if(ShiftwithStaff.Enable_Sign_In__c == true){
Time signOutTime = ShiftwithStaff.Schedule_Sign_Out_Date_Time__c.time();
scheduledEnd = formatTime12Hr(signOutTime);
notifTitle = 'Late Sign-In Approved';
notifBody = 'Your late sign-in request has been approved.'+
'Scheduled Time:'+ scheduledEnd + '| Actual Time: '+ ShiftwithStaff.Start_Time__c + 
'Remarks: '+ selectedComments;
String body = 'Hi ' + ShiftwithStaff.Staff__r.Name + ',<br/><br/>' +
'This is to inform you that a signin has been Approved for the following shift details:<br/><br/>' +
'<b>• Shift Date:</b> ' + ShiftwithStaff.Date__c + '<br/>' +
'<b>• Actual Time:</b> ' + ShiftwithStaff.Start_Time__c +  
'<b>• Scheduled Time:</b> ' + scheduledEnd + '<br/>' +
'<b>• Reason:</b> ' + selectedComments + '<br/><br/>' +
'<b>Note:</b> This is an automated message. Please do not reply.<br/><br/>' +
'<b>Regards,</b><br/>' +
ShiftwithStaff.Staff__r.Organization_Full_Name__c;
string email = ShiftwithStaff.Staff__r.Email_Address__c;
List<String> toAddresses = new List<String>{ email };
EmailSenderNotification.sendSingleEmail(toAddresses, notifTitle, body);
MobileNotification.sendNotification(ShiftwithStaff.Staff__c, notifTitle, notifBody);
if (staffUser != null) {
My_Notification__c notification = new My_Notification__c();
notification.User__c = staffUser.Id;
notification.Subject__c = notifTitle;
notification.Description__c = notifBody;
insert notification;
}

}
List<Task> existingTasks = [SELECT Id,Status,Subject,WhatId FROM Task WHERE WhatId = :shiftwithstaffId AND (Subject = 'Enable Sign in for Shift' OR Subject = 'Enable Sign out for Shift') AND Status = 'New' LIMIT 1];
if (!existingTasks.isEmpty()){
existingTasks[0].Status='Completed';
}

update existingTasks;
} catch (Exception e) {
System.debug('❌ Error: ' + e.getMessage());
throw new AuraHandledException(e.getMessage());
}
}*/
    
    @AuraEnabled
    public static void updateShiftDetails(
        Boolean enableGeolocation,
        Boolean enableSignin,
        Boolean enableSignout,
        String selectedComments,
        String selectedComments1,
        String staffId,
        String shiftwithstaffId
    ) {
        try {
            System.debug('⚡ Entered updateShiftDetails');
            System.debug(
                '🔹 Input Params => enableGeolocation: ' + enableGeolocation +
                ', enableSignin: ' + enableSignin +
                ', enableSignout: ' + enableSignout +
                ', selectedComments: ' + selectedComments +
                ', selectedComments1: ' + selectedComments1 +
                ', staffId: ' + staffId +
                ', shiftwithstaffId: ' + shiftwithstaffId
            );
            
            String notifTitle;
            String notifBody;
            
            // 🔹 Fetch Staff
            Staff__c staff = [
                SELECT Id, Enable_Geolocation__c, Email_Address__c
                FROM Staff__c
                WHERE Id = :staffId
                LIMIT 1
            ];
            System.debug('👤 Staff fetched: ' + staff);
            
            staff.Enable_Geolocation__c = enableGeolocation;
            System.debug('✅ Staff.Enable_Geolocation__c updated to: ' + staff.Enable_Geolocation__c);
            
            // 🔹 Fetch matching User
            User staffUser;
            try {
                staffUser = [
                    SELECT Id, Email
                    FROM User
                    WHERE Email = :staff.Email_Address__c
                    LIMIT 1
                ];
                System.debug('👤 Staff User fetched: ' + staffUser);
            } catch (QueryException qe) {
                System.debug('⚠️ No matching User found for email: ' + staff.Email_Address__c);
            }
            
            // 🔹 Fetch ShiftwithStaff record
            ShiftwithStaff__c ShiftwithStaff = [
                SELECT Id, Date__c, Enable_Sign_In__c, Enable_Sign_Out__c, Start_Time__c,
                Schedule_Sign_Out_Date_Time__c, Enable_Sign_In_Comments__c, Staff__c, Enable_Sign_out_Comments__c,
                Staff__r.Name, Staff__r.Email_Address__c, Staff__r.Organization_Full_Name__c
                FROM ShiftwithStaff__c
                WHERE Id = :shiftwithstaffId
                LIMIT 1
            ];
            System.debug('📅 ShiftwithStaff fetched: ' + ShiftwithStaff);
            
            if (enableSignin != null) {
                ShiftwithStaff.Enable_Sign_In__c = enableSignin;
            }
            if (selectedComments != null) {
                ShiftwithStaff.Enable_Sign_In_Comments__c = selectedComments;
            }
            if (selectedComments1 != null) {
                ShiftwithStaff.Enable_Sign_out_Comments__c = selectedComments1;
            }
            if (enableSignout != null) {
                ShiftwithStaff.Enable_Sign_Out__c = enableSignout;
            }

            System.debug(
                '✅ Shift flags updated => SignIn: ' + enableSignin +
                ', SignOut: ' + enableSignout +
                ', Comments: ' + selectedComments +
                ', Comments: ' + selectedComments1
            );
            
            update staff;
            System.debug('✔️ Staff updated in DB');
            update ShiftwithStaff;
            System.debug('✔️ ShiftwithStaff updated in DB');
            
            String scheduledEnd = '';
            String ActualTimeformat = '';
            
            // 🔹 Handle Sign-Out Case
            if (ShiftwithStaff.Enable_Sign_Out__c == true) {
                System.debug('📌 Processing Late Sign out approval');
                
                if (ShiftwithStaff.Schedule_Sign_Out_Date_Time__c != null) {
                    Time signOutTime = ShiftwithStaff.Schedule_Sign_Out_Date_Time__c.time();
                    scheduledEnd = formatTime12Hr(signOutTime);
                    ActualTimeformat = formatTime12Hr(ShiftwithStaff.Start_Time__c);
                    
                    System.debug('🕒 Scheduled End (from Schedule_Sign_Out_Date_Time__c): ' + scheduledEnd);
                } else {
                    System.debug('⚠️ No Schedule_Sign_Out_Date_Time__c found, keeping scheduledEnd = N/A');
                }
                
                notifTitle = 'Late Sign out Approved';
                notifBody = 'Your late sign out request has been approved.' +
                    ' Scheduled Time: ' + scheduledEnd + ' | Actual Time: ' + ActualTimeformat +
                    ' Remarks: ' + selectedComments1;
                
                System.debug('🔔 Notification => Title: ' + notifTitle + ', Body: ' + notifBody);
                
                String body = 'Hi ' + ShiftwithStaff.Staff__r.Name + ',<br/><br/>' +
                    'This is to inform you that a sign out has been Approved for the following shift details:<br/><br/>' +
                    '<b>• Shift Date:</b> ' + ShiftwithStaff.Date__c + '<br/>' +
                    '<b>• Actual Time:</b> ' + ActualTimeformat +
                    '<b>• Scheduled Time:</b> ' + scheduledEnd + '<br/>' +
                    '<b>• Reason:</b> ' + selectedComments1 + '<br/><br/>' +
                    '<b>Note:</b> This is an automated message. Please do not reply.<br/><br/>' +
                    '<b>Regards,</b><br/>' +
                    ShiftwithStaff.Staff__r.Organization_Full_Name__c;
                
                String email = ShiftwithStaff.Staff__r.Email_Address__c;
                if (email != null) {
                    List<String> toAddresses = new List<String>{ email };
                        System.debug('📧 Sending Email To: ' + email);
                    EmailSenderNotification.sendSingleEmail(toAddresses, notifTitle, body);
                } else {
                    System.debug('⚠️ Staff email is null, skipping email send.');
                }
                
                System.debug('📲 Sending Mobile Notification To Staff: ' + ShiftwithStaff.Staff__c);
                MobileNotification.sendNotification(ShiftwithStaff.Staff__c, notifTitle, notifBody);
                
                if (staffUser != null) {
                    My_Notification__c notification = new My_Notification__c();
                    notification.User__c = staffUser.Id;
                    notification.Subject__c = notifTitle;
                    notification.Description__c = notifBody;
                    insert notification;
                    System.debug('🗂️ In-App Notification inserted for User Id: ' + staffUser.Id);
                }
            }
            // 🔹 Handle Sign-In Case
            else if (ShiftwithStaff.Enable_Sign_In__c == true) {
                System.debug('📌 Processing Late Sign-In approval');
                
                if (ShiftwithStaff.Schedule_Sign_Out_Date_Time__c != null) {
                    Time signOutTime = ShiftwithStaff.Schedule_Sign_Out_Date_Time__c.time();
                    scheduledEnd = formatTime12Hr(signOutTime);
                    System.debug('🕒 Scheduled End: ' + scheduledEnd);
                } else {
                    System.debug('⚠️ No Schedule_Sign_Out_Date_Time__c found, keeping scheduledEnd = N/A');
                }
                
                notifTitle = 'Late Sign in Approved';
                notifBody = 'Your late sign in request has been approved.' +
                    ' Scheduled Time: ' + scheduledEnd + ' | Actual Time: ' + ActualTimeFormat +
                    ' Remarks: ' + selectedComments;
                
                System.debug('🔔 Notification => Title: ' + notifTitle + ', Body: ' + notifBody);
                
                String body = 'Hi ' + ShiftwithStaff.Staff__r.Name + ',<br/><br/>' +
                    'This is to inform you that a signin has been Approved for the following shift details:<br/><br/>' +
                    '<b>• Shift Date:</b> ' + ShiftwithStaff.Date__c + '<br/>' +
                    '<b>• Actual Time:</b> ' + ActualTimeformat +
                    '<b>• Scheduled Time:</b> ' + scheduledEnd + '<br/>' +
                    '<b>• Reason:</b> ' + selectedComments + '<br/><br/>' +
                    '<b>Note:</b> This is an automated message. Please do not reply.<br/><br/>' +
                    '<b>Regards,</b><br/>' +
                    ShiftwithStaff.Staff__r.Organization_Full_Name__c;
                
                String email = ShiftwithStaff.Staff__r.Email_Address__c;
                if (email != null) {
                    List<String> toAddresses = new List<String>{ email };
                        System.debug('📧 Sending Email To: ' + email);
                    EmailSenderNotification.sendSingleEmail(toAddresses, notifTitle, body);
                } else {
                    System.debug('⚠️ Staff email is null, skipping email send.');
                }
                
                System.debug('📲 Sending Mobile Notification To Staff: ' + ShiftwithStaff.Staff__c);
                MobileNotification.sendNotification(ShiftwithStaff.Staff__c, notifTitle, notifBody);
                
                if (staffUser != null) {
                    My_Notification__c notification = new My_Notification__c();
                    notification.User__c = staffUser.Id;
                    notification.Subject__c = notifTitle;
                    notification.Description__c = notifBody;
                    insert notification;
                    System.debug('🗂️ In-App Notification inserted for User Id: ' + staffUser.Id);
                }
            }
            
            
            // 🔹 Handle Related Tasks
            List<Task> existingTasks = [
                SELECT Id, Status, Subject, WhatId
                FROM Task
                WHERE WhatId = :shiftwithstaffId
                AND (Subject = 'Enable Sign in for Shift' OR Subject = 'Enable Sign out for Shift')
                AND Status = 'New'
                LIMIT 1
            ];
            System.debug('📋 Existing Tasks found: ' + existingTasks);
            
            if (!existingTasks.isEmpty()) {
                existingTasks[0].Status = 'Completed';
                System.debug('✅ Task marked as Completed => ' + existingTasks[0]);
                update existingTasks;
                System.debug('✔️ Task updated in DB');
            }
            
            System.debug('🎯 updateShiftDetails Completed Successfully');
        } catch (Exception e) {
            System.debug(
                '❌ Error in updateShiftDetails: ' + e.getMessage() +
                ' | Line: ' + e.getLineNumber() +
                ' | Stack: ' + e.getStackTraceString()
            );
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    
    public static String formatTime12Hr(Time t) {
        if (t == null) return 'N/A';
        Integer h = t.hour();
        Integer m = t.minute();
        String meridian = h >= 12 ? 'PM' : 'AM';
        Integer displayHour = Math.mod(h, 12) == 0 ? 12 : Math.mod(h, 12);
        String minuteStr = (m < 10) ? '0' + String.valueOf(m) : String.valueOf(m);
        return displayHour + ':' + minuteStr + ' ' + meridian;
    } 
    
    Public static void updatestaffName(List<ShiftwithStaff__c> updatedShiftwithStaffList){
        set<Id> shiftwithstaffId = new set<Id>();
        for(ShiftwithStaff__c shiftwithstaff : updatedShiftwithStaffList){
            shiftwithstaffId.add(shiftwithstaff.Id);
        }
        
        list<Services_and_Support_Plan__c> serviceList=[ SELECT Id,Services__c,State__c, Service_Users__c,Service_Users__r.picture__c,
                                                        Service_Users__r.Name, Resource_Name__c, Service_Type_Name__c, Lineitem__c,
                                                        Support_Item_Name__c, Date_of_Service__c,Qty__c,Unit_Price__c,GST__c,Amount__c,
                                                        Status__c,Available_Funds__c,Available_Fund__c,ShiftwithStaff__c,Participant_Name__c,
                                                        Client__c,Service_Type__c,Funds_Tracker__c,Start_Time_24_Format__c,
                                                        End_Time_24_Format__c,Start_Time_Formula__c,End_Time_Formula__c,ShiftwithStaff__r.Staff__c 
                                                        FROM Services_and_Support_Plan__c 
                                                        where ShiftwithStaff__c=:shiftwithstaffId];
        
        List<Services_and_Support_Plan__c> plansToUpdate = new List<Services_and_Support_Plan__c>();
        if(!serviceList.isEmpty()){
            for (Services_and_Support_Plan__c service : serviceList) { 
                if(service.Service_Users__c != null){
                    service.Service_Users__c = service.ShiftwithStaff__r.Staff__c;
                    plansToUpdate.add(service);
                } 
            }
        }
        
        if(!plansToUpdate.isEmpty()) {
            try {
                update plansToUpdate;
            } catch (DmlException e) {
                System.debug('Error during update: ' + e.getMessage());
            }    
        }        
    }
    
    @AuraEnabled
    public static string  deleteCheckList(list<string> checkListId){
        if(checkListId.size()>0){
            list<Add_Shift_Checklist__c> AddCheckList=[select id from Add_Shift_Checklist__c where id in:checkListId ];
            delete AddCheckList;
            
        }
        return 'checklist deleted';
        
    }
    
    @AuraEnabled(cacheable=true)
    public static Map<String, Integer> getShiftStatusSummary(
        DateTime startDateTime,
        DateTime endDateTime,
        String toggleLabel,
        List<String> facilitySearch,
        String facilityName,
        List<String> rolefilter,
        String roleName
    ) {
        System.debug('startDateTime >> ' + startDateTime);
        System.debug('endDateTime >> ' + endDateTime);
        System.debug('toggleLabel >> ' + toggleLabel);
        System.debug('facilitySearch >> ' + facilitySearch);
        System.debug('facilityName >> ' + facilityName);
        System.debug('roleName >> ' + roleName);
        
        Map<String, Integer> result = new Map<String, Integer>();
        
        if (toggleLabel != null && toggleLabel.toLowerCase() == 'false') {
            Date startDate = startDateTime.date();
            Date endDate = endDateTime.date();
            
            String baseCondition = 'Date__c >= :startDate AND Date__c <= :endDate';
            
            if (facilitySearch != null && !facilitySearch.isEmpty()) {
                baseCondition += ' AND Add_Shift__r.Facility__c IN :facilitySearch';
            } else if (String.isNotBlank(facilityName)) {
                baseCondition += ' AND Add_Shift__r.Facility__c = :facilityName';
            }
            
            if (rolefilter != null && !rolefilter.isEmpty()) {
                baseCondition += ' AND Role_formula__c IN :rolefilter';
            } else if (String.isNotBlank(roleName)) {
                baseCondition += ' AND Role_formula__c = :roleName';
            }
            
            // Count by Status__c
            String statusQuery = 'SELECT Status__c, COUNT(Id) recordCount FROM ShiftwithStaff__c WHERE ' + baseCondition + ' GROUP BY Status__c';
            List<AggregateResult> groupedResults = Database.query(statusQuery);
            
            for (AggregateResult ar : groupedResults) {
                String status = (String)ar.get('Status__c');
                Integer count = (Integer)ar.get('recordCount');
                if (status == 'null') {
                    status = 'InProgress';
                }
                system.debug('status >>'+ status);
                system.debug('count >>'+ count);
                result.put(status, count);
                system.debug('result >>'+ result);
            }
            
            // Count Un_Assigned_Shift__c = true
            String unassignedQuery = 'SELECT COUNT(Id) FROM ShiftwithStaff__c WHERE Un_Assigned_Shift__c = true AND ' + baseCondition;
            List<AggregateResult> unassignedResult = Database.query(unassignedQuery);
            Integer unassignedCount = (Integer)unassignedResult[0].get('expr0');
            result.put('Un_Assigned', unassignedCount);
            
            // Count Shift_Rejected__c = true
            String rejectedQuery = 'SELECT COUNT(Id) FROM ShiftwithStaff__c WHERE Shift_Rejected__c = true AND ' + baseCondition;
            List<AggregateResult> rejectedResult = Database.query(rejectedQuery);
            Integer rejectedCount = (Integer)rejectedResult[0].get('expr0');
            result.put('Rejected', rejectedCount);
        }
        
        System.debug('result >> ' + result);
        return result;
    }
    
    
    Public static void updateMyavailability(List<ShiftwithStaff__c> ShiftwithStaffList){
        Set<Id> staffIdSet = new Set<Id>();
        Set<Date> startDateSet = new Set<Date>();
        Set<Time> startTimeSet = new Set<Time>();
        Set<String> compositeKeySet = new Set<String>();
        
        for (ShiftwithStaff__c shift : ShiftwithStaffList) {
            if (shift.Staff__c != null && shift.Date__c != null && shift.Start_Time__c != null) {
                staffIdSet.add(shift.Staff__c);
                startDateSet.add(shift.Date__c);
                startTimeSet.add(shift.Start_Time__c);
                
                String key = shift.Staff__c + '-' + String.valueOf(shift.Date__c) + '-' + String.valueOf(shift.Start_Time__c);
                compositeKeySet.add(key);
            }
        }
        
        // Step 2: Query matching Availability__c records
        List<Availability__c> availabilityList = [
            SELECT Id, Staff__c, Start_Date__c, Start_Time__c, Assigned_Service_OR_Shift__c
            FROM Availability__c
            WHERE Staff__c IN :staffIdSet
            AND Start_Date__c IN :startDateSet
            AND Start_Time__c IN :startTimeSet
        ];
        
        // Step 3: Filter and update matching records
        List<Availability__c> recordsToUpdate = new List<Availability__c>();
        
        for (Availability__c avail : availabilityList) {
            String key = avail.Staff__c + '-' + String.valueOf(avail.Start_Date__c) + '-' + String.valueOf(avail.Start_Time__c);
            if (compositeKeySet.contains(key)) {
                avail.Assigned_Service_OR_Shift__c = true;
                recordsToUpdate.add(avail);
            }
        }
        
        // Step 4: Update in database
        if (!recordsToUpdate.isEmpty()) {
            update recordsToUpdate;
            System.debug('Updated Availability records: ' + recordsToUpdate.size());
        } else {
            System.debug('No Availability records matched.');
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static Map<String, Integer> getRejectedShiftData(String facilityId) {
        System.debug('facilityId >> ' + facilityId);
        
        // ✅ Get Monday and Sunday of current week
        Date startDate = Date.today().toStartOfWeek(); // Monday
        Date endDate = startDate.addDays(6);           // Sunday
        
        System.debug('Week Start Date: ' + startDate + ', End Date: ' + endDate);
        
        // 🔐 Get the current user's organization
        User userRecord = [
            SELECT Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];
        
        if (String.isBlank(userRecord.Organization_Name__c)) {
            throw new AuraHandledException('The user does not have an organization name defined.');
        }
        
        // 🧑‍💼 Get all staff in that organization
        List<Staff__c> staffRecords = [
            SELECT Id
            FROM Staff__c
            WHERE Organization_Full_Name__c = :userRecord.Organization_Name__c
        ];
        
        if (staffRecords.isEmpty()) {
            throw new AuraHandledException('No staff records found for the user\'s organization.');
        }
        
        Set<Id> staffIds = new Set<Id>();
        for (Staff__c staff : staffRecords) {
            staffIds.add(staff.Id);
        }
        
        // 🔍 Query shifts by Date__c (not CreatedDate)
        List<ShiftwithStaff__c> shiftRecords = [
            SELECT Id, Status__c, Date__c, Attendence__c, Shift_Rejected__c
            FROM ShiftwithStaff__c
            WHERE Date__c >= :startDate
            AND Date__c <= :endDate
            AND Staff__c IN :staffIds
            AND Add_Shift__r.Facility__c = :facilityId
        ];
        
        // 📊 Count total and rejected
        Integer total = 0; //shiftRecords.size();
        Integer rejected = 0;
        system.debug('Count :::'+ shiftRecords.size());
        
        for (ShiftwithStaff__c record : shiftRecords) {           
            if(record.Attendence__c == true){
                total++;
            } else if(record.Attendence__c == false && record.Shift_Rejected__c == true){
                rejected++;
            }
        }
        
        system.debug('total :::'+ total);
        system.debug('rejected :::'+ rejected);
        
        // 📦 Return result
        Map<String, Integer> result = new Map<String, Integer>();
        result.put('Total', total);
        result.put('Rejected', rejected);
        return result;
    }  
    
}