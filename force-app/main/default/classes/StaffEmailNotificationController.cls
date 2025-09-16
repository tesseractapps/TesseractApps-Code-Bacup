public with sharing  class StaffEmailNotificationController {
    /* @AuraEnabled
public static void sendShiftEmails(String shiftId, String roleId, String facilityId, String staffId, boolean isrecur, String Sdate, String Edate, String typeOfRecur, String recurEvery) {
if (shiftId == null || roleId == null || facilityId == null) {
throw new AuraHandledException('All parameters (shiftId, roleId, facilityId) are required.');
}

// Step 1: Query Add_Shift__c with necessary fields
Add_Shift__c shift = [
SELECT Id,Location__Street__s, Location__City__s, Location__PostalCode__s, Location__StateCode__s, Location__CountryCode__s, Facility__r.Name, Role__c, 
Start_Date__c,Start_Time__c, Start_time_Formula__c, End_Time__c,End_time_formula__c, Shift_Type__c,Is_EOI__c,Shift_Start_End_Time__c, EOI_staff__C,
(SELECT Id,
(SELECT Id, Service_Type_Name__c, Participant_Name__c FROM Services_and_Support_Plans__r)
FROM ShiftwithStaffs__r)
FROM Add_Shift__c
WHERE Id = :shiftId
LIMIT 1
];



// Step 2: Determine staff list based on staffId presence
List<Staff__c> staffList = new List<Staff__c>();
Boolean isSingleStaff = false;

if (String.isNotBlank(staffId)) {
Staff__c staff = [
SELECT Id, Name,Display_Nickname__c, Last_Name__c, Facility__c, Organization_Full_Name__c, Email_Address__c, Role__c
FROM Staff__c
WHERE Id = :staffId AND Status__c = true AND Email_Address__c != null
LIMIT 1
];
staffList.add(staff);
isSingleStaff = true;
} else {
staffList = [
SELECT Id, Name,Display_Nickname__c, Last_Name__c,  Facility__c, Organization_Full_Name__c, Email_Address__c, Role__c
FROM Staff__c
WHERE Role__c INCLUDES (:roleId)
AND Facility__c = :facilityId
AND Status__c = true
AND Email_Address__c != null
];
}

//String originalDate = String.valueOf(shift.Start_Date__c);
//List<String> parts = originalDate.split('-');
//String reversedDate = parts[2] + '-' + parts[1] + '-' + parts[0];

// Step 3: Build and send emails
List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();
OrgWideEmailAddress[] owea = [select Id from OrgWideEmailAddress where Address =:System.Label.OrgWideEmailAddress limit 1];


for (Staff__c staff : staffList) {
Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
email.setToAddresses(new List<String>{ staff.Email_Address__c });
email.setOrgWideEmailAddressId(owea.get(0).Id);
email.setSubject('New Shift Notification - ' + shift.Shift_Type__c);

String body;
String subject;
if (shift.Is_EOI__c && !isSingleStaff  ) {
subject = 'Shift Assignment Notification-EOI';
body =
'Hi ' + staff.Display_Nickname__c +',<br/><br/>' +
'This is to inform you that shifts have been scheduled for the following requirement:<br/>' +
'<b>• Shift Date:</b> ' + reverseDateFormat(String.valueOf(shift.Start_Date__c)) + '<br/>' +
'<b>• Shift Timings and Type:</b> ' + String.valueOf(shift.Shift_Start_End_Time__c) + ', ' + shift.Shift_Type__c + '<br/>' +
'<b>• Facility:</b> ' + shift.Facility__r.Name + '<br/>' +  
'<b>• Address:</b> ' + shift.Location__Street__s +','+ shift.Location__City__s +','+ shift.Location__StateCode__s +','+ shift.Location__CountryCode__s +','+ shift.Location__PostalCode__s + '<br/><br/>' +   
'<b>• Role:</b> ' + shift.Role__c + '<br/>' +
'Kindly acknowledge your Expression of Interest (EOI) at the earliest.<br/><br/>' +
'<b>Note:</b> This is an automated message. Please do not reply.<br/><br/>' +
'<b>Regards,</b><br/>' +
staff.Organization_Full_Name__c;
} else if (!isrecur && isSingleStaff) {

String serviceLine = '';
if (!shift.ShiftwithStaffs__r.isEmpty() && 
!shift.ShiftwithStaffs__r[0].Services_and_Support_Plans__r.isEmpty()) {

if (!String.isBlank(shift.ShiftwithStaffs__r[0].Services_and_Support_Plans__r[0].Participant_Name__c)) {
serviceLine += '<b>• Participant:</b> ' + 
shift.ShiftwithStaffs__r[0].Services_and_Support_Plans__r[0].Participant_Name__c + '<br/>';
}

if (!String.isBlank(shift.ShiftwithStaffs__r[0].Services_and_Support_Plans__r[0].Service_Type_Name__c)) {
serviceLine += '<b>• Service:</b> ' + 
shift.ShiftwithStaffs__r[0].Services_and_Support_Plans__r[0].Service_Type_Name__c + '<br/>';
}

if (serviceLine != '') {
serviceLine += '<br/>';
}
}
subject = 'Shift Allocation Notification';
body =
'Hi ' + staff.Display_Nickname__c +',<br/><br/>' +
'This email is to notify you that shift has been allocated to you by your roster manager. <br/><br/>' +
'Here are the details of your shift:<br/>' +
'<b>• Shift Date:</b> ' + reverseDateFormat(String.valueOf(shift.Start_Date__c)) + '<br/>' +
'<b>• Shift Timings and Type:</b> ' + String.valueOf(shift.Shift_Start_End_Time__c) + ', ' + shift.Shift_Type__c + '<br/>' +
'<b>• Facility:</b> ' + shift.Facility__r.Name + '<br/>' +  
'<b>• Address:</b> ' + shift.Location__Street__s +','+ shift.Location__City__s +','+ shift.Location__StateCode__s +','+ shift.Location__CountryCode__s +','+ shift.Location__PostalCode__s + '<br/>' +   
//'<b>• Role:</b> ' + shift.Role__c + '<br/>' +
serviceLine + 
'Please take note of the above and ensure you report to your assigned shift accordingly.  <br/><br/>' +
'<b>Note:</b> This is an automated message. Please do not reply.<br/><br/>' +
'<b>Regards,</b><br/>' +
staff.Organization_Full_Name__c;
}else if (isrecur && isSingleStaff) {
subject = 'Recurring Shift Notification-'+ typeOfRecur +'';
String recurLine;
String dayLabel = (recurEvery == '1') ? 'day' : 'days';
String weekLabel = (recurEvery == '1') ? 'week' : 'weeks';
String monthLabel = (recurEvery == '1') ? 'month' : 'months';
if (typeOfRecur == 'daily') {
recurLine = 'This is to notify you that your shift (' + shift.Shift_Type__c + ' ' + 
String.valueOf(shift.Shift_Start_End_Time__c) + ') is set to recur daily for (every ' + recurEvery +' '  + dayLabel +') from ' + 
reverseDateFormat(Sdate) + ' to ' + reverseDateFormat(Edate) + '.<br/>';
} else if (typeOfRecur == 'weekly') {
recurLine = 'This is to notify you that your shift (' + shift.Shift_Type__c + ' ' + 
String.valueOf(shift.Shift_Start_End_Time__c) + ') is set to recur weekly (every ' + recurEvery +' '  + weekLabel +') on the same weekday, from ' + 
reverseDateFormat(Sdate) + ' to ' + reverseDateFormat(Edate) + '.<br/>';
} else if (typeOfRecur == 'fortnightly') {
recurLine = 'This is to notify you that your shift (' + shift.Shift_Type__c + ' ' + 
String.valueOf(shift.Shift_Start_End_Time__c) + ') is set to recur fortnightly from ' + 
reverseDateFormat(Sdate) + ' to ' + reverseDateFormat(Edate) + '.<br/>';
} else if (typeOfRecur == 'monthly') {
recurLine = 'This is to notify you that your shift (' + shift.Shift_Type__c + ' ' + 
String.valueOf(shift.Shift_Start_End_Time__c) + ') is set to recur monthly (every ' + recurEvery + ''  + monthLabel +') from ' + 
reverseDateFormat(Sdate) + ' to ' + reverseDateFormat(Edate) + '.<br/>';
} else {
recurLine = 'This is to notify you that your shift (' + shift.Shift_Type__c + ' ' + 
String.valueOf(shift.Shift_Start_End_Time__c) + ') is set to recur ' + typeOfRecur + 
' (every ' + recurEvery + ') from ' + reverseDateFormat(Sdate) + ' to ' + reverseDateFormat(Edate) + '.<br/>';
}
String serviceLine = '';
if (!shift.ShiftwithStaffs__r.isEmpty() && 
!shift.ShiftwithStaffs__r[0].Services_and_Support_Plans__r.isEmpty()) {

if (!String.isBlank(shift.ShiftwithStaffs__r[0].Services_and_Support_Plans__r[0].Participant_Name__c)) {
serviceLine += '<b>• Participant:</b> ' + 
shift.ShiftwithStaffs__r[0].Services_and_Support_Plans__r[0].Participant_Name__c + '<br/>';
}

if (!String.isBlank(shift.ShiftwithStaffs__r[0].Services_and_Support_Plans__r[0].Service_Type_Name__c)) {
serviceLine += '<b>• Service:</b> ' + 
shift.ShiftwithStaffs__r[0].Services_and_Support_Plans__r[0].Service_Type_Name__c + '<br/>';
}

if (serviceLine != '') {
serviceLine += '<br/>';
}
}
body =
'Hi ' + staff.Display_Nickname__c +',<br/><br/>' +
recurLine +
'Here are the key details of your shift:<br/>' +
//'<b>• Shift Date:</b> ' + reverseDateFormat(String.valueOf(shift.Start_Date__c)) + '<br/>' +
//'<b>• Shift Timings and Type:</b> ' + String.valueOf(shift.Shift_Start_End_Time__c) + ', ' + shift.Shift_Type__c + '<br/>' +
'<b>• Facility:</b> ' + shift.Facility__r.Name + '<br/>' +  
'<b>• Address:</b> ' + shift.Location__Street__s +','+ shift.Location__City__s +','+ shift.Location__StateCode__s +','+ shift.Location__CountryCode__s +','+ shift.Location__PostalCode__s + '<br/>' +   
//'<b>• Role:</b> ' + shift.Role__c + '<br/>' +
serviceLine +
'Please contact your roster manager if you need to make changes to your recurring shift details.   <br/>' +
'Kindly take note of the above and ensure you report to your assigned shift accordingly.   <br/><br/>' +
'<b>Note:</b> This is an automated message. Please do not reply.<br/><br/>' +
'<b>Regards,</b><br/>' +
staff.Organization_Full_Name__c;
}else {
subject = 'Shift Assignment- Notification ';
body =
'Hi ' + staff.Display_Nickname__c +',<br/><br/>' +
'This is to inform you that shifts have been scheduled for the following requirement:<br/><br/>' +
'<b>• Shift Date:</b> ' + reverseDateFormat(String.valueOf(shift.Start_Date__c)) + '<br/>' +
'<b>• Shift Timings and Type:</b> ' + String.valueOf(shift.Shift_Start_End_Time__c) + ', ' + shift.Shift_Type__c + '<br/>' +
'<b>• Facility:</b> ' + shift.Facility__r.Name + '<br/>' +  
'<b>• Address:</b> ' + shift.Location__Street__s +','+ shift.Location__City__s +','+ shift.Location__StateCode__s +','+ shift.Location__CountryCode__s +','+ shift.Location__PostalCode__s + '<br/><br/>' +   
'<b>• Role:</b> ' + shift.Role__c + '<br/>' +
'Kindly review the above details and acknowledge the shift at the earliest,if you wish to accept it. <br/><br/>' +
'<b>Note:</b> This is an automated message. Please do not reply.<br/><br/>' +
'<b>Regards,</b><br/>' +
staff.Organization_Full_Name__c;
}
email.setSubject(subject); 
email.setHtmlBody(body);
emails.add(email);
}



// Step 4: Send emails if any
if (!emails.isEmpty()) {
System.debug('emails'+emails);
Messaging.sendEmail(emails);
}
}*/
    
    // Apex method to send email notifications based on shift details, recurrence, and EOI logic
    @AuraEnabled
    public static void sendShiftEmails(String shiftId, String roleId, String facilityId, String staffId, boolean isrecur, String Sdate, String Edate, String typeOfRecur, String recurEvery) {
        if (shiftId == null || roleId == null || facilityId == null) {
            throw new AuraHandledException('All parameters (shiftId, roleId, facilityId) are required.');
        }
        
        // Step 1: Query shift details
        Add_Shift__c shift = [
            SELECT Id, Location__Street__s, Location__City__s, Location__PostalCode__s, Location__StateCode__s, Location__CountryCode__s,
            Facility__r.Name, Role__c, Start_Date__c, Start_Time__c, Start_time_Formula__c, End_Time__c, End_time_formula__c,
            Shift_Type__c, Is_EOI__c, Shift_Start_End_Time__c, EOI_staff__c,
            (SELECT Id, (SELECT Id, Service_Type_Name__c, Participant_Name__c FROM Services_and_Support_Plans__r)
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
        
        // If a specific staff is provided
        if (String.isNotBlank(staffId)) {
            Staff__c staff = [
                SELECT Id, Name, Display_Nickname__c, Last_Name__c, Facility__c, Organization_Full_Name__c, Email_Address__c, Role__c
                FROM Staff__c
                WHERE Id = :staffId AND Status__c = true AND Email_Address__c != null
                LIMIT 1
            ];
            staffList.add(staff);
            isSingleStaff = true;
        } else {
            // Otherwise, pull based on role/facility
            staffList = [
                SELECT Id, Name, Display_Nickname__c, Last_Name__c, Facility__c, Organization_Full_Name__c, Email_Address__c, Role__c
                FROM Staff__c
                WHERE Role__c INCLUDES (:roleId)
                AND Facility__c = :facilityId
                AND Status__c = true
                AND Email_Address__c != null
            ];
        }
        
        // Step 3: Compose email content and build messages
        List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();
        OrgWideEmailAddress[] owea = [SELECT Id FROM OrgWideEmailAddress WHERE Address = :System.Label.OrgWideEmailAddress LIMIT 1];
        
        for (Staff__c staff : staffList) {
            // Apply EOI filter if required
            if (hasEOIFilter && !eoiStaffIds.contains(staff.Id)) {
                continue;
            }
            
            Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
            email.setToAddresses(new List<String>{ staff.Email_Address__c });
            email.setOrgWideEmailAddressId(owea.get(0).Id);
            
            String body;
            String subject;
            
            // EOI broadcast to multiple staff
            if (shift.Is_EOI__c && !isSingleStaff) {
                subject = 'Shift Assignment Notification-EOI';
                body = 'Hi ' + staff.Display_Nickname__c + ',<br/><br/>' +
                    'This is to inform you that shift have been scheduled for the following requirement:<br/>' +
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
            else if (!isrecur && isSingleStaff) {
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
            else if (isrecur && isSingleStaff) {
                String dayLabel = recurEvery == '1' ? 'day' : 'days';
                String weekLabel = recurEvery == '1' ? 'week' : 'weeks';
                String monthLabel = recurEvery == '1' ? 'month' : 'months';
                String recurLine = '';
                
                if (typeOfRecur == 'daily') {
                    recurLine = 'This is to notify you that your shift (' + shift.Shift_Type__c + ' ' + 
                                    String.valueOf(shift.Shift_Start_End_Time__c) + ') is set to recur daily for (every ' + recurEvery +' '  + dayLabel +') from ' + 
                                    reverseDateFormat(Sdate) + ' to ' + reverseDateFormat(Edate) + '.<br/>';
                } else if (typeOfRecur == 'weekly') {
                    recurLine = 'This is to notify you that your shift (' + shift.Shift_Type__c + ' ' + 
                                    String.valueOf(shift.Shift_Start_End_Time__c) + ') is set to recur weekly (every ' + recurEvery +' '  + weekLabel +') on the same weekday, from ' + 
                                    reverseDateFormat(Sdate) + ' to ' + reverseDateFormat(Edate) + '.<br/>';
                } else if (typeOfRecur == 'fortnightly') {
                    recurLine = 'This is to notify you that your shift (' + shift.Shift_Type__c + ' ' + 
                                    String.valueOf(shift.Shift_Start_End_Time__c) + ') is set to recur fortnightly from ' + 
                                    reverseDateFormat(Sdate) + ' to ' + reverseDateFormat(Edate) + '.<br/>';
                } else if (typeOfRecur == 'monthly') {
                    recurLine = 'This is to notify you that your shift (' + shift.Shift_Type__c + ' ' + 
                                    String.valueOf(shift.Shift_Start_End_Time__c) + ') is set to recur monthly (every ' + recurEvery + ''  + monthLabel +') from ' + 
                                    reverseDateFormat(Sdate) + ' to ' + reverseDateFormat(Edate) + '.<br/>';
                } else {
                    recurLine = 'This is to notify you that your shift (' + shift.Shift_Type__c + ' ' + 
                                    String.valueOf(shift.Shift_Start_End_Time__c) + ') is set to recur ' + typeOfRecur + 
                                    ' (every ' + recurEvery + ') from ' + reverseDateFormat(Sdate) + ' to ' + reverseDateFormat(Edate) + '.<br/>';
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
                body = 'Hi ' + staff.Display_Nickname__c +',<br/><br/>' +
                        recurLine +
                        'Here are the key details of your shift:<br/>' +
                        //'<b>• Shift Date:</b> ' + reverseDateFormat(String.valueOf(shift.Start_Date__c)) + '<br/>' +
                        //'<b>• Shift Timings and Type:</b> ' + String.valueOf(shift.Shift_Start_End_Time__c) + ', ' + shift.Shift_Type__c + '<br/>' +
                        '<b>• Facility:</b> ' + shift.Facility__r.Name + '<br/>' +  
                        '<b>• Address:</b> ' + shift.Location__Street__s +','+ shift.Location__City__s +','+ shift.Location__StateCode__s +','+ shift.Location__CountryCode__s +','+ shift.Location__PostalCode__s + '<br/>' +   
                        //'<b>• Role:</b> ' + shift.Role__c + '<br/>' +
                        serviceLine +
                        'Please contact your roster manager if you need to make changes to your recurring shift details.   <br/>' +
                        'Kindly take note of the above and ensure you report to your assigned shift accordingly.   <br/><br/>' +
                        '<b>Note:</b> This is an automated message. Please do not reply.<br/><br/>' +
                        '<b>Regards,</b><br/>' +
                        staff.Organization_Full_Name__c;
            }
            // Default fallback
            else {
                subject = 'Shift Assignment- Notification';
                body = 'Hi ' + staff.Display_Nickname__c + ',<br/><br/>' +
                    'This is to inform you that shift have been scheduled for the following requirement:<br/><br/>' +
                    '<b>• Shift Date:</b> ' + reverseDateFormat(String.valueOf(shift.Start_Date__c)) + '<br/>' +
                    '<b>• Shift Timings and Type:</b> ' + shift.Shift_Start_End_Time__c + ', ' + shift.Shift_Type__c + '<br/>' +
                    '<b>• Facility:</b> ' + shift.Facility__r.Name + '<br/>' +
                    '<b>• Address:</b> ' + shift.Location__Street__s + ',' + shift.Location__City__s + ',' + shift.Location__StateCode__s + ',' + shift.Location__CountryCode__s + ',' + shift.Location__PostalCode__s + '<br/>' +
                    '<b>• Role:</b> ' + shift.Role__c + '<br/>' +
                    'Kindly review the above details and acknowledge the shift at the earliest, if you wish to accept it.<br/><br/><b>Note:</b> This is an automated message. Please do not reply.<br/><br/><b>Regards,</b><br/>' +
                    staff.Organization_Full_Name__c;
            }
            
            email.setSubject(subject);
            email.setHtmlBody(body);
            emails.add(email);
        }
        
        // Step 4: Send all built emails
        if (!emails.isEmpty()) {
            Messaging.sendEmail(emails);
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
    
    private static void sendShiftEmails(List<ShiftwithStaff__c> shiftStaffList) {
        if (shiftStaffList.isEmpty()) return;
        
        List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();
        
        OrgWideEmailAddress[] owea = [
            SELECT Id FROM OrgWideEmailAddress WHERE Address = :System.Label.OrgWideEmailAddress LIMIT 1
        ];
        
        if (owea.isEmpty()) {
            System.debug('No Org-Wide Email Address found.');
            return;
        }
        
        for (ShiftwithStaff__c shift : shiftStaffList) {
            if (shift.Staff__r == null || String.isBlank(shift.Staff__r.Email_Address__c)) {
                continue; // skip if no email
            }
            
            Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
            email.setToAddresses(new List<String>{ shift.Staff__r.Email_Address__c });
            email.setOrgWideEmailAddressId(owea[0].Id);
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
    private static String reverseDateFormat(String inputDate) {
        if (inputDate == null) return '';
        List<String> parts = String.valueOf(inputDate).split('-'); // yyyy-MM-dd
        if (parts.size() == 3) {
            return parts[2] + '/' + parts[1] + '/' + parts[0]; // dd-MM-yyyy
        }
        return '';
    }
}