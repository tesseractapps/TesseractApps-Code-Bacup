public without sharing class RosterCopyPasteHandler {
@AuraEnabled
public static void pasteSelectedRosters(
    List<Id> shiftIds,
    List<Id> serviceIds,
    String targetStartDate,
    Boolean copyChecklist,
    Boolean copyParticipant,
    Boolean copyShiftNotes
) {

    if (shiftIds == null || shiftIds.isEmpty()) {
        return;
    }

    Date targetDate = Date.valueOf(targetStartDate);

    /* =====================================================
       SOURCE SHIFTS
       ===================================================== */

    List<ShiftWithStaff__c> selectedShifts = [
        SELECT Id, Add_Shift__c, Start_Date__c, Shift_End_Date__c
        FROM ShiftWithStaff__c
        WHERE Id IN :shiftIds
    ];

    if (selectedShifts.isEmpty()) {
        return;
    }

    /* =====================================================
       DATE OFFSET
       ===================================================== */

   /*  Date sourceStartDate = selectedShifts[0].Start_Date__c;
    Integer dateOffset = sourceStartDate.daysBetween(targetDate);

    System.debug('dateOffset ==> ' + dateOffset); */

        Date minimumSelectedDate;

        for (ShiftWithStaff__c s : selectedShifts) {

        Date shiftDate =
            s.Start_Date__c != null
                ? s.Start_Date__c
                : s.Date__c;

        if (
            minimumSelectedDate == null ||
            shiftDate < minimumSelectedDate
        ) {
            minimumSelectedDate = shiftDate;
        }
        }

    DateTime tempDt =
            DateTime.newInstance(
                minimumSelectedDate,
                Time.newInstance(0, 0, 0, 0)
            );

        Integer dayOfWeek =
            Integer.valueOf(
                tempDt.format('u')
            );



        Date sourceWeekStart =
            minimumSelectedDate.addDays(
                -(dayOfWeek - 1)
            );

        /* =====================================================
        TARGET WEEK START
        ===================================================== */

        Date rawTargetDate =
    Date.valueOf(targetStartDate);

        DateTime targetDt =
            DateTime.newInstance(
                rawTargetDate,
                Time.newInstance(0, 0, 0, 0)
            );

        Integer targetDayOfWeek =
            Integer.valueOf(
                targetDt.format('u')
            );

        Date targetWeekStart =
            rawTargetDate.addDays(
                -(targetDayOfWeek - 1)
            );

        System.debug('sourceWeekStart => ' + sourceWeekStart);
        System.debug('targetWeekStart => ' + targetWeekStart);

    /* =====================================================
       ADD SHIFT IDS
       ===================================================== */

    Set<Id> addShiftIds = new Set<Id>();

    for (ShiftWithStaff__c s : selectedShifts) {
        addShiftIds.add(s.Add_Shift__c);
    }

    /* =====================================================
       QUERY PARENT ADD SHIFTS
       ===================================================== */

    List<Add_Shift__c> previousAddShifts = [
        SELECT Id, RefId__c, Role__c, Start_Date__c, Facility__c, Start_Time_Text__c, End_Time_Text__c, Start_Time__c, End_Time__c, Shift_Type__c, Shift_Name__c, Day_Name__c, End_Date__c,
               Shift_Notes__c, Location__Street__s, Location__City__s, Location__StateCode__s, Location__PostalCode__s, Location__Latitude__s, Location__Longitude__s, Location__CountryCode__s,
               Is_EOI__c, Duration__c, Get_Facility__c, Participant_Address_checkbox__c, Group_Shifts__c, Do_you_want_to_set_this_a_recurring_shif__c, Quantity__c, Un_Assigned_Shift__c,SIL__c
        FROM Add_Shift__c
        WHERE Id IN :addShiftIds
    ];

    /* =====================================================
       CLONE ADD SHIFTS
       ===================================================== */

    List<Add_Shift__c> newAddShifts = new List<Add_Shift__c>();
    Map<Id, Id> oldToNewAddShiftMap = new Map<Id, Id>();

    for (Add_Shift__c src : previousAddShifts) {

        Add_Shift__c cloned = src.clone(false, true, false, false);

        cloned.Start_Date__c =getMappedDate(src.Start_Date__c, sourceWeekStart,targetWeekStart);
         cloned.Shift_Notes__c = copyShiftNotes ? src.Shift_Notes__c : '';

        cloned.End_Date__c = getMappedDate(src.End_Date__c,sourceWeekStart, targetWeekStart);
        newAddShifts.add(cloned);
    }

    insert newAddShifts;

    for (Integer i = 0; i < previousAddShifts.size(); i++) {

        oldToNewAddShiftMap.put(
            previousAddShifts[i].Id,
            newAddShifts[i].Id
        );
    }

    /* =====================================================
       FULL SHIFT QUERY
       ===================================================== */

    List<ShiftWithStaff__c> sourceStaffShifts = [
        SELECT Id, Add_Shift__c, Date__c, Staff__c, Do_you_want_to_set_this_Recurring_Roster__c, Role__c, Shift_Category__c, SignIn_Notes__c, Staff_Final_Hourly_Rate__c,
               Type_of_Address__c, Long_Afternoon_Start_Time__c, Long_Afternoon_End_Time__c, Is_Long_Afternoon__c, Long_Afternoon_Index__c, Long_Afternoon_Hourly_Rate__c,
               Long_Afternoon_Shift_Duartion__c, Is_Long_Afternoon_Next_Day_Start__c, Long_Afternoon_Start_Date_One__c, long_Afternooon_Service_Ref_Id__c,
               Long_Morning_Start_Time_Two__c, Long_Morning_End_Time_Two__c, Is_long_Morning_Shift_two__c, Long_Morning_Index_Two__c, Long_Morning_Rate_Two__c,
               Long_Morning_Duartion_Two__c, Is_Long_Morning_Next_Day_Start_Two__c, Long_Morning_Start_Date_Two__c, long_Morning_2_Service_Ref_Id__c,
               Add_Shift__r.End_Time__c, Add_Shift__r.Start_Time__c, Group_Shifts__c, New_Split_Shift__c, Split_Shift_RefId__c,
               Shift_Address__Street__s, Shift_Address__City__s, Shift_Address__StateCode__s, Shift_Address__PostalCode__s, Shift_Address__CountryCode__s,
               Long_Night_Start_Time__c, Long_Night_End_Time__c, Is_Long_Night_Shift__c, Long_Night_Index__c, Long_Night_Hourly_Rate__c,
               Long_Night_Shift_Duartion__c, Is_Long_Night_Start_Next_Day__c, Long_Night_Start_Date__c, long_Night_Service_Ref_Id__c, long_Sleepover_Service_Ref_Id__c,
               Long_Afternoon_Start_Time_two__c, Long_afternoon_End_Time_Two__c, Is_Long_afternoon_shift_two__c, Long_Afternoon_Index_Two__c,
               Long_Afternoon_Rate_Two__c, Long_Afternoon_Duration_Two__c, Is_Long_Afternoon_Next_Day_Start_Two__c, Long_Afternoon_Start_Date_Two__c,
               long_Afternooon_Two_Service_Ref_Id__c, Shift_Address__Latitude__s, Shift_Address__Longitude__s, Staff_Paid_Break__c,
               Shift_Calculated_Duration__c, Shift_Break__c, Shift_Name__c, Time_Rounded_Off__c, Un_Assigned_Shift__c, Status__c, Index__c,
               Shift_Start_Time__c, Long_Morning_Shift_Duartion__c, Is_long_Morning_Next_Day_Start__c, Long_Sleepover_Start_Time__c,
               Long_Sleepover_End_Time__c, Is_Long_SleepOver__c, Long_Sleepover_index__c, Long_Sleepover_Allowance__c,
               Long_Sleepover_Duartion__c, Is_Long_Sleepover_Next_Day_Start__c, Long_Sleepover_Start_Date__c, Duration__c,
               Is_Published_Shifts__c, Shift_End_Time__c, Start_Date__c, Shift_End_Date__c, Shift_Day_Name__c,
               Shift_To_Service_Ref_Id__c, RefId__c, Long_Morning_Start_Time__c, Long_Morning_End_Time__c,SIL__c,
               Is_long_Morning__c, Long_Morning_Index__c, Long_Morning_Hourly_Rate__c, Long_Morning_Start_Date_One__c,
               long_Morining_Service_Ref_Id__c,Broken_Shift__c
        FROM ShiftWithStaff__c
        WHERE Id IN :shiftIds
    ];

    /* =====================================================
       EXISTING SHIFTS
       ===================================================== */

    Set<Id> staffIds = new Set<Id>();

    for (ShiftWithStaff__c s : sourceStaffShifts) {
        staffIds.add(s.Staff__c);
    }

    List<ShiftWithStaff__c> existingShifts = [
        SELECT Id, Staff__c, Date__c, Shift_End_Date__c, Shift_Start_Time__c, Shift_End_Time__c, Duration__c ,Add_Shift__r.Start_Time__c ,Add_Shift__r.End_Time__c
        FROM ShiftWithStaff__c
        WHERE Staff__c IN :staffIds
    ];

    Map<Id, List<ShiftWithStaff__c>> existingByStaff = new Map<Id, List<ShiftWithStaff__c>>();

    for (ShiftWithStaff__c e : existingShifts) {

        if (!existingByStaff.containsKey(e.Staff__c)) {
            existingByStaff.put(e.Staff__c, new List<ShiftWithStaff__c>());
        }

        existingByStaff.get(e.Staff__c).add(e);
    }

    /* =====================================================
       CLONE STAFF SHIFTS
       ===================================================== */

    List<ShiftWithStaff__c> newStaffShifts = new List<ShiftWithStaff__c>();
    Map<Id, Id> oldToNewStaffShiftMap = new Map<Id, Id>();

    for (ShiftWithStaff__c src : sourceStaffShifts) {

      Date actualStartDate = src.Start_Date__c != null ? src.Start_Date__c : src.Date__c;

        Date actualEndDate =src.Shift_End_Date__c != null ? src.Shift_End_Date__c : actualStartDate;

        Date newStartDate = getMappedDate(actualStartDate,sourceWeekStart,targetWeekStart);

        Date newEndDate = getMappedDate(actualEndDate, sourceWeekStart,targetWeekStart );

       Time startTime =src.Shift_Start_Time__c != null ? src.Shift_Start_Time__c: src.Add_Shift__r.Start_Time__c;

            Time endTime =src.Shift_End_Time__c != null? src.Shift_End_Time__c : src.Add_Shift__r.End_Time__c;

            if (startTime == null || endTime == null) {
                continue;
            }

            DateTime proposedStart = DateTime.newInstanceGmt(newStartDate,  startTime);

            DateTime proposedEnd = DateTime.newInstanceGmt(newEndDate,endTime);

            Boolean overlapFound = false;

        if (existingByStaff.containsKey(src.Staff__c)) {

            for (ShiftWithStaff__c ex : existingByStaff.get(src.Staff__c)) {

                if (
                    RosterTemplateController.isOverlap( proposedStart, proposedEnd,
                        DateTime.newInstanceGmt(ex.Date__c, ex.Shift_Start_Time__c !=null ?  ex.Shift_Start_Time__c :ex.Add_Shift__r.Start_Time__c),
                        DateTime.newInstanceGmt(ex.Shift_End_Date__c !=null ?  ex.Shift_End_Date__c :ex.Date__c,  ex.Shift_End_Time__c !=null ?  ex.Shift_End_Time__c :ex.Add_Shift__r.End_Time__c)
                    )
                ) {
                    overlapFound = true;
                    break;
                }
            }
        }

        if (overlapFound) {
            continue;
        }

        ShiftWithStaff__c cloned = src.clone(false, true, false, false);

        cloned.Add_Shift__c = oldToNewAddShiftMap.get(src.Add_Shift__c);
        cloned.Start_Date__c = newStartDate;
        cloned.Shift_End_Date__c = newEndDate;

        cloned.Status__c = 'Draft';
        cloned.Attendence__c = false;
        cloned.Is_Published_Shifts__c = false;
        cloned.SignIn_Notes__c = copyShiftNotes ? src.SignIn_Notes__c : '';

        cloned.Log_In_Date_Time__c = null;
        cloned.Log_Out_Date_Time__c = null;

        newStaffShifts.add(cloned);
    }

    insert newStaffShifts;

    for (Integer i = 0; i < newStaffShifts.size(); i++) {

        oldToNewStaffShiftMap.put(
            sourceStaffShifts[i].Id,
            newStaffShifts[i].Id
        );
    }

    /* =====================================================
       SERVICES
       ===================================================== */

    if ( copyParticipant && serviceIds != null && !serviceIds.isEmpty()) {

        List<Services_and_Support_Plan__c> sourceServices = [ SELECT Id, ShiftWithStaff__c, Client__c, Funds_Tracker__c, Service_Users__c, Date_of_Service__c,
                   Start_Time_24_Format__c, End_Time_24_Format__c, Service_Type__c, Services__c, State__c,SIL_Service__c,
                   Qty__c, Status__c, Edited_Unit_Price__c, Custom_Shift_Reference_Id__c, Un_Assigned_Service__c FROM Services_and_Support_Plan__c WHERE Id IN :serviceIds
        ];

        List<Services_and_Support_Plan__c> newServices = new List<Services_and_Support_Plan__c>();

        for (Services_and_Support_Plan__c svc : sourceServices) {

            if (!oldToNewStaffShiftMap.containsKey(svc.ShiftWithStaff__c)) {
                continue;
            }

            Services_and_Support_Plan__c cloned = svc.clone(false, true, false, false);

            cloned.ShiftWithStaff__c = oldToNewStaffShiftMap.get(svc.ShiftWithStaff__c);
            cloned.Date_of_Service__c =
            getMappedDate(svc.Date_of_Service__c, sourceWeekStart, targetWeekStart );
            cloned.Status__c = 'Draft';

            newServices.add(cloned);
        }

        insert newServices;
    }
    /* =====================================================
   CHECKLIST COPY
   ===================================================== */

        if (copyChecklist) {

            List<Add_Shift_Checklist__c> newChecklists =
                new List<Add_Shift_Checklist__c>();

            List<Add_Shift_Checklist__c> sourceChecklists = [

                SELECT Id,
                    ShiftWithStaff__c,
                    Description__c,
                    Mandatory__c,
                    Created_By_Static_Data__c

                FROM Add_Shift_Checklist__c

                WHERE ShiftWithStaff__c IN :oldToNewStaffShiftMap.keySet()
            ];

            for (Add_Shift_Checklist__c cl : sourceChecklists) {

                if (
                    !oldToNewStaffShiftMap.containsKey(
                        cl.ShiftWithStaff__c
                    )
                ) {
                    continue;
                }

                Add_Shift_Checklist__c cloned =
                    cl.clone(false, true, false, false);

                cloned.ShiftWithStaff__c =
                    oldToNewStaffShiftMap.get(
                        cl.ShiftWithStaff__c
                    );

                newChecklists.add(cloned);
            }

            if (!newChecklists.isEmpty()) {
                insert newChecklists;
            }
        }
}

   public static Date getMappedDate(
    Date actualDate,
    Date sourceWeekStart,
    Date targetWeekStart
) {

    if (actualDate == null) {
        return null;
    }

    Integer totalOffsetDays =
        sourceWeekStart.daysBetween(
            actualDate
        );

    return targetWeekStart.addDays(
        totalOffsetDays
    );
}
      @AuraEnabled
public static List<Id> getShiftIdsByTemplate(
    String templateId, List<String> facilityIds,string startDate) {

    List<Id> matchedShiftIds = new List<Id>();
     Date sDate=Date.valueOf(startDate);

    if (  String.isBlank(templateId) ||facilityIds == null || facilityIds.isEmpty() ) {
        return matchedShiftIds;
    }

    List<ShiftWithStaff__c> shifts = [SELECT Id, Template_Id__c  FROM ShiftWithStaff__c WHERE ( (Shift_Facility__c != NULL AND Shift_Facility__c IN :facilityIds) OR (Shift_Facility__c = NULL AND Add_Shift__r.Facility__c IN :facilityIds)) AND Date__c >= :sDate ];

    for (ShiftWithStaff__c sws : shifts) {

        if (String.isBlank(sws.Template_Id__c)) {
            continue;
        }

        List<String> templateIds =sws.Template_Id__c.split(',');

        for (String tempId : templateIds) {

            if ( tempId.trim() == templateId) {

                matchedShiftIds.add(sws.Id);

                break;
            }
        }
    }

    return matchedShiftIds;
}

@AuraEnabled
public static List<Id> getServiceIdsByTemplate(
    String templateId,
    List<Id> shiftIds,
    string startDate
) {
  Date sDate=Date.valueOf(startDate);
    List<Id> matchedServiceIds =
        new List<Id>();

    if (
        String.isBlank(templateId) ||
        shiftIds == null ||
        shiftIds.isEmpty()
    ) {
        return matchedServiceIds;
    }

    List<Services_and_Support_Plan__c> services = [

        SELECT Id,
               Template_Id__c

        FROM Services_and_Support_Plan__c

        WHERE ShiftWithStaff__c IN :shiftIds AND ShiftWithStaff__r.Date__c >=:sDate
    ];

    for (
        Services_and_Support_Plan__c svc
        : services
    ) {

        if (
            String.isBlank(
                svc.Template_Id__c
            )
        ) {
            continue;
        }

        List<String> templateIds =
            svc.Template_Id__c.split(',');

        for (String tempId : templateIds) {

            if (
                tempId.trim() ==
                templateId
            ) {

                matchedServiceIds.add(
                    svc.Id
                );

                break;
            }
        }
    }

    return matchedServiceIds;
}

@AuraEnabled
public static void unAssignParticipantShifts( List<Id> shiftIds) {

    if ( shiftIds == null || shiftIds.isEmpty()) {
        return;
    }

    /* =====================================================
       RANDOM TEMP STAFF
       ===================================================== */

    List<Staff__c> totalStaffList = [SELECT Id,Display_Nickname__c,Organization_Full_Name__c FROM Staff__c  LIMIT 1];

    
    Id tempStaffId = totalStaffList[0].Id;
    string orgName=totalStaffList[0].Organization_Full_Name__c;

    /* =====================================================
       SHIFTS
       ===================================================== */

    List<ShiftwithStaff__c> shList = [

            SELECT Id, Role_formula__c,
            Staff__c,
            Date__c,
            Start_Date__c,
            Shift_End_Date__c,
            Is_Published_Shifts__c,
            Status__c,
            Attendence__c,

            /* Timings used in notifications */
            Start_time_Formula__c,
            End_time_formula__c,
            Shift_Start_End_Time__c,

            /* Shift-level address used in notifications */
            Shift_Address__Street__s,
            Shift_Address__City__s,
            Shift_Address__StateCode__s,
            Shift_Address__CountryCode__s,
            Shift_Address__PostalCode__s,

            /* Staff fields */
            Staff__r.Email_Address__c,
            Staff__r.Display_Nickname__c,
            Staff__r.Organization_Full_Name__c,
            Staff__r.Facility__r.Organisation__c,    //newly added

            /* Parent Add Shift fields */
            Add_Shift__r.Shift_Type__c,

               (SELECT Id,
                       Status__c,
                       Service_Users__c,Un_Assigned_Service__c,

                       Client__r.Email__c,
                       Client__r.Display_Nickname__c

                FROM Services_and_Support_Plans__r)

        FROM ShiftwithStaff__c

        WHERE Id IN :shiftIds
    ];

    if (shList.isEmpty()) {
        return;
    }

    /* =====================================================
       UPDATE SHIFTS
       ===================================================== */

    List<Services_and_Support_Plan__c> servicesToUpdate = new List<Services_and_Support_Plan__c>();

    Map<Id, String> originalStaffEmailMap =new Map<Id, String>();

    Map<Id, String> originalStaffNameMap = new Map<Id, String>();

    Map<Id, String> originalOrgMap = new Map<Id, String>();

    for (ShiftwithStaff__c sws : shList) {

        originalStaffEmailMap.put( sws.Id, sws.Staff__r != null ? sws.Staff__r.Email_Address__c : null
        );

        originalStaffNameMap.put( sws.Id,sws.Staff__r != null ? sws.Staff__r.Display_Nickname__c : null );

        originalOrgMap.put(sws.Id,sws.Staff__r != null ? sws.Staff__r.Organization_Full_Name__c: null);
    }

    for (ShiftwithStaff__c sws : shList) {

        sws.Un_Assigned_Shift__c = true;

        sws.Status__c = 'Unassigned';

        sws.Staff__c = tempStaffId;

        sws.Attendence__c = false;

        sws.Staff_Final_Hourly_Rate__c = 0;

        for ( Services_and_Support_Plan__c service : sws.Services_and_Support_Plans__r ) {

            service.Service_Users__c = tempStaffId;

            service.Status__c = 'Not Yet Invoiced';
            service.Un_Assigned_Service__c=true;

            servicesToUpdate.add(service);
        }
    }

    update shList;

    if (!servicesToUpdate.isEmpty()) {
        update servicesToUpdate;
    }

    /* =====================================================
   NOTIFICATIONS + EMAILS
   ===================================================== */

        Map<String, User> userByEmail =new Map<String, User>();

        Map<Id, Integer> unreadCountMap =new Map<Id, Integer>();

        Set<String> emails = new Set<String>();

            for (ShiftwithStaff__c sh : shList) {

                String originalEmail =
                    originalStaffEmailMap.get(sh.Id);

                if (String.isNotBlank(originalEmail)) {

                    emails.add(
                        originalEmail.trim().toLowerCase()
                    );
                }
            }

        List<User> users = [SELECT Id, Email, Mobile_device_token__c,(SELECT Id, Mark_as_read_notifications__c FROM My_Notifications__r ORDER BY CreatedDate DESC LIMIT 20) FROM User WHERE Email IN :emails];

        for (User u : users) {

            Integer unread = 0;

            if (u.My_Notifications__r != null) {

                for (My_Notification__c n : u.My_Notifications__r ) {

                    if ( !n.Mark_as_read_notifications__c) {
                        unread++;
                    }
                }
            }

            userByEmail.put( u.Email.trim().toLowerCase(),u);

            unreadCountMap.put( u.Id,unread );
        }

        // List<Messaging.SingleEmailMessage> mails = new List<Messaging.SingleEmailMessage>();

        List<Object> bulkEmails = new List<Object>();

        Organisation__c orgObj = [
            SELECT Email__c
            FROM Organisation__c
            WHERE Name = :orgName
            LIMIT 1
        ];

        String senderEmailAddress = orgObj.Email__c;

        List<My_Notification__c> notifications = new List<My_Notification__c>();

        List<String> deviceTokens = new List<String>();

        List<String> mobileMessages = new List<String>();

        List<Integer> unreadCounts = new List<Integer>();

        /* =====================================================
        BUILD EMAILS + PUSH
        ===================================================== */

        for (ShiftwithStaff__c shItem : shList) {

            String shiftDate = RosterAutoScheduleHandler.reverseDateFormat( String.valueOf( shItem.Start_Date__c));

            String shiftTimings = shItem.Shift_Start_End_Time__c;

            String address = '';

            if ( !String.isBlank(shItem.Shift_Address__Street__s )  ) {

                address = shItem.Shift_Address__Street__s +  ', ' +shItem.Shift_Address__City__s + ', ' +shItem.Shift_Address__StateCode__s + ', ' + shItem.Shift_Address__CountryCode__s + ', ' +shItem.Shift_Address__PostalCode__s;
            }

            String notificationText =
                'A previously assigned shift has been unassigned';

            String subject ='Shift Unassigned Notification';

            // =========================================
            // STAFF EMAIL
            // =========================================

            String originalEmail = originalStaffEmailMap.get(shItem.Id);

            if (String.isNotBlank(originalEmail)) {

                String email =originalEmail;

               String displayName =originalStaffNameMap.get(shItem.Id);

                String body =

                    'Hi ' + displayName + ',<br/><br/>' +

                    'This email is to notify you that the previously assigned shift has now been unassigned by your roster manager.<br/><br/>' +

                    '<b>Shift Details:</b><br/>' +

                    '<b>• Shift Date:</b> ' +
                    shiftDate + '<br/>' +

                    '<b>• Shift Timings:</b> ' +
                    shiftTimings + '<br/>' +

                    '<b>• Address:</b> ' +
                    address + '<br/><br/>' +

                    '<b>Note:</b> This is an automated message. Please do not reply.<br/><br/>' +

                    '<b>Regards,</b><br/>' +

                     orgName;

                // Messaging.SingleEmailMessage msg = new Messaging.SingleEmailMessage();

                // msg.setToAddresses(
                //     new List<String>{ email }
                // );

                // msg.setSubject(subject);
                // msg.setSenderDisplayName(orgName);

                // msg.setHtmlBody(body);

                // msg.setSaveAsActivity(false);

                // mails.add(msg);

                Map<String, Object> staffEmail =
                    new Map<String, Object>();

                staffEmail.put(
                    'fromEmail',
                    senderEmailAddress
                );

                staffEmail.put(
                    'toEmail',
                    new List<String>{ email }
                );

                staffEmail.put(
                    'subject',
                    subject
                );

                staffEmail.put(
                    'body',
                    body
                );

                bulkEmails.add(
                    staffEmail
                );

                User u = userByEmail.get(email);

                if (u != null) {

                    notifications.add(
                        new My_Notification__c( User__c = u.Id,Subject__c = subject, Description__c =notificationText + ' on Shift Date: ' + shiftDate +' for the timings: ' + shiftTimings
                        )
                    );

                    if ( String.isNotBlank(  u.Mobile_device_token__c ) ) {

                        deviceTokens.add(
                            u.Mobile_device_token__c
                                .trim()
                        );

                        mobileMessages.add(notificationText + ' on Shift Date: ' +shiftDate + ' for the timings: ' + shiftTimings
                        );

                        unreadCounts.add(
                            unreadCountMap.get(u.Id)
                        );
                    }
                }
            }

            // =========================================
            // CLIENT EMAILS
            // =========================================

            for (
                Services_and_Support_Plan__c svc
                : shItem.Services_and_Support_Plans__r
            ) {

                if ( svc.Client__r == null || String.isBlank( svc.Client__r.Email__c )
                ) {
                    continue;
                }

                String clientEmail = svc.Client__r.Email__c.trim().toLowerCase();

                String clientName =svc.Client__r.Display_Nickname__c;

                String clientBody =

                    'Hi ' + clientName + ',<br/><br/>' +

                    'This email is to notify you that a previously assigned support shift has now been unassigned by your roster manager.<br/><br/>' +

                    '<b>Shift Details:</b><br/>' +

                    '<b>• Shift Date:</b> ' +
                    shiftDate + '<br/>' +

                    '<b>• Shift Timings:</b> ' +
                    shiftTimings + '<br/>' +

                    '<b>• Address:</b> ' +
                    address + '<br/><br/>' +

                    '<b>Note:</b> This is an automated message. Please do not reply.<br/><br/>' +

                    '<b>Regards,</b><br/>' +

                     orgName;

                // Messaging.SingleEmailMessage clientMail =
                //     new Messaging.SingleEmailMessage();

                // clientMail.setToAddresses(
                //     new List<String>{ clientEmail }
                // );

                // clientMail.setSubject(subject);

                // clientMail.setHtmlBody(clientBody);
                // clientMail.setSenderDisplayName(orgName);

                // clientMail.setSaveAsActivity(false);

                // mails.add(clientMail);

                Map<String, Object> clientEmailPayload =
                    new Map<String, Object>();

                clientEmailPayload.put(
                    'fromEmail',
                    senderEmailAddress
                );

                clientEmailPayload.put(
                    'toEmail',
                    new List<String>{ clientEmail }
                );

                clientEmailPayload.put(
                    'subject',
                    subject
                );

                clientEmailPayload.put(
                    'body',
                    clientBody
                );

                bulkEmails.add(
                    clientEmailPayload
                );
            }
        }

        /* =====================================================
        SEND
        ===================================================== */

            // if (!mails.isEmpty()) {

            //     Messaging.sendEmail(
            //         mails,
            //         false
            //     );
            // }

            if (!bulkEmails.isEmpty()) {

                Id jobId =
                    System.enqueueJob(

                        new EmailRelayQueueable(
                            bulkEmails
                        )
                    );

                System.debug(
                    '✅ Unassigned Shift Bulk Email Queue Created: ' +
                    jobId
                );

                System.debug(
                    '✅ Total Emails Queued: ' +
                    bulkEmails.size()
                );
            }

            if (!notifications.isEmpty()) {

                insert notifications;
            }

            if (!deviceTokens.isEmpty()) {

                AddShiftController.sendPushNotificationsBatch(

                    deviceTokens,
                    mobileMessages,
                    'Shift Unassigned',
                    unreadCounts
                );
            }
}

@AuraEnabled
public static void reAssignStaffToShifts(
    List<Id> shiftIds,
    string staffId
) {

    if (
        shiftIds == null ||
        shiftIds.isEmpty()
    ) {
        throw new AuraHandledException(
            'No shifts selected.'
        );
    }

    if (staffId == null) {
        throw new AuraHandledException(
            'Staff is required.'
        );
    }


    /* =====================================================
       SHIFTS TO REASSIGN
       ===================================================== */

    List<ShiftWithStaff__c> shiftsToUpdate = [SELECT Id,Staff__r.Organization_Full_Name__c, Shift_Address__PostalCode__s,Shift_Address__CountryCode__s,Shift_Address__StateCode__s,Shift_Address__City__s,Shift_Address__Street__s,Staff__c,Shift_Start_End_Time__c, Status__c, Attendence__c, Un_Assigned_Shift__c, Start_Date__c, Shift_End_Date__c, Shift_Start_Time__c, Shift_End_Time__c, Day_Name__c, Type_of_shift__c, Role__c, Date__c, Add_Shift__c, Do_you_want_to_set_this_Recurring_Roster__c, Staff_Final_Hourly_Rate__c, Is_long_Morning__c, Is_Long_Afternoon__c, Is_Long_Night_Shift__c, Is_long_Morning_Shift_two__c, Is_Long_afternoon_shift_two__c, Is_long_Morning_Next_Day_Start__c, Is_Long_Afternoon_Next_Day_Start__c, Is_Long_Night_Start_Next_Day__c, Is_Long_Morning_Next_Day_Start_Two__c, Long_Morning_Start_Date_One__c, Long_Afternoon_Start_Date_One__c, Long_Night_Start_Date__c, Long_Morning_Start_Date_Two__c, Long_Afternoon_Start_Date_Two__c, Long_Morning_Hourly_Rate__c, Long_Afternoon_Hourly_Rate__c, Long_Night_Hourly_Rate__c, Long_Morning_Rate_Two__c, Long_Afternoon_Rate_Two__c,Shift_Day_Name__c, (SELECT Id, Service_Users__c FROM Services_and_Support_Plans__r) FROM ShiftWithStaff__c WHERE Id IN :shiftIds];
     string orgName=shiftsToUpdate[0].Staff__r.Organization_Full_Name__c;

    if (shiftsToUpdate.isEmpty()) {
        return;
    }

    /* =====================================================
       FIND DATE RANGE
       ===================================================== */

    Date startDt;
    Date endDt;

    for (ShiftWithStaff__c s : shiftsToUpdate) {

        if (
            startDt == null ||
            s.Start_Date__c < startDt
        ) {
            startDt = s.Start_Date__c;
        }

        if (
            endDt == null ||
            s.Shift_End_Date__c > endDt
        ) {
            endDt = s.Shift_End_Date__c;
        }
    }

    /* =====================================================
       EXISTING STAFF SHIFTS
       ===================================================== */

    List<ShiftWithStaff__c> existingShifts = [

        SELECT Id,
               Staff__c,
               Start_Date__c,
               Shift_End_Date__c,
               Shift_Start_Time__c,
               Shift_End_Time__c,
               Duration__c

        FROM ShiftWithStaff__c

        WHERE Staff__c = :staffId

        AND Start_Date__c <= :endDt

        AND Shift_End_Date__c >= :startDt

        AND (
            Attendence__c = true
            OR Status__c = 'Draft'
        )
    ];

    Map<Id, List<ShiftWithStaff__c>> existingByStaff =
        new Map<Id, List<ShiftWithStaff__c>>();

    for (ShiftWithStaff__c e : existingShifts) {

        if (
            !existingByStaff.containsKey(
                e.Staff__c
            )
        ) {

            existingByStaff.put(
                e.Staff__c,
                new List<ShiftWithStaff__c>()
            );
        }

        existingByStaff
            .get(e.Staff__c)
            .add(e);
    }

    /* =====================================================
       UPDATE SHIFTS
       ===================================================== */

    List<ShiftWithStaff__c> finalShiftUpdates =
        new List<ShiftWithStaff__c>();

    List<Services_and_Support_Plan__c> servicesToUpdate =
        new List<Services_and_Support_Plan__c>();

            Map<Id, String> oldStaffEmailMap =
        new Map<Id, String>();

    Map<Id, String> oldStaffNameMap =
        new Map<Id, String>();

    Set<Id> oldStaffIds =
        new Set<Id>();

    for (ShiftWithStaff__c sws : shiftsToUpdate) {

        if (sws.Staff__c != null) {

            oldStaffIds.add(
                sws.Staff__c
            );
        }
    }

    Map<Id, Staff__c> oldStaffMap =
        new Map<Id, Staff__c>([

        SELECT Id,
            Display_Nickname__c,
            Email_Address__c

        FROM Staff__c

        WHERE Id IN :oldStaffIds
    ]);

    Staff__c newStaff = [

        SELECT Id,
            Display_Nickname__c,
            Email_Address__c

        FROM Staff__c

        WHERE Id = :staffId

        LIMIT 1
    ];
    List<ShiftWithStaff__c> acceptedShifts =
    new List<ShiftWithStaff__c>();
  
    for (ShiftWithStaff__c sws : shiftsToUpdate) {

        Boolean overlapFound = false;

        // =========================================
        // OVERLAP CHECK
        // =========================================

        if (
            existingByStaff.containsKey(
                staffId
            )
        ) {

            for (
                ShiftWithStaff__c ex
                : existingByStaff.get(staffId)
            ) {

                if (

                    RosterTemplateController.isOverlap(

                        DateTime.newInstanceGmt(
                            sws.Start_Date__c,
                            sws.Shift_Start_Time__c
                        ),

                        DateTime.newInstanceGmt(
                            sws.Shift_End_Date__c,
                            sws.Shift_End_Time__c
                        ),

                        DateTime.newInstanceGmt(
                            ex.Start_Date__c,
                            ex.Shift_Start_Time__c
                        ),

                        DateTime.newInstanceGmt(
                            ex.Shift_End_Date__c,
                            ex.Shift_End_Time__c
                        )
                    )
                ) {

                    overlapFound = true;

                    break;
                }
            }
        }

        // =========================================
        // SKIP OVERLAP
        // =========================================

        if (overlapFound) {

            System.debug(
                'Skipping overlapping shift => ' +
                sws.Id
            );

            continue;
        }

        // =========================================
        // UPDATE SHIFT
        // =========================================

        // =========================================
// STORE OLD STAFF DETAILS
// BEFORE REASSIGNMENT
// =========================================

            Staff__c oldStaff =
                oldStaffMap.get(
                    sws.Staff__c
                );

            if (
                oldStaff != null &&
                sws.Status__c == 'Accepted'
            ) {

                oldStaffEmailMap.put(
                    sws.Id,
                    oldStaff.Email_Address__c
                );

                oldStaffNameMap.put(
                    sws.Id,
                    oldStaff.Display_Nickname__c
                );
            }

        sws.Staff__c =
            staffId;
            if (sws.Status__c == 'Accepted') {

            acceptedShifts.add(sws);
            }

        
        finalShiftUpdates.add(sws);

        // =========================================
        // UPDATE SERVICES
        // =========================================

        for (
            Services_and_Support_Plan__c svc
            : sws.Services_and_Support_Plans__r
        ) {

            svc.Service_Users__c =
                staffId;

            servicesToUpdate.add(svc);
        }

        // =========================================
        // ADD TO EXISTING MAP
        // PREVENT OVERLAP WITH SAME BATCH
        // =========================================

        if (
            !existingByStaff.containsKey(
                staffId
            )
        ) {

            existingByStaff.put(
                staffId,
                new List<ShiftWithStaff__c>()
            );
        }

        existingByStaff
            .get(staffId)
            .add(sws);
    }

    /* =====================================================
       SAVE
       ===================================================== */

    if (!finalShiftUpdates.isEmpty()) {
        ShiftTimehandler.UpdateHourlyRate(finalShiftUpdates,false);

        update finalShiftUpdates;

        sendReAssignmentEmails(
            acceptedShifts,
            oldStaffEmailMap,
            oldStaffNameMap,
            newStaff,
             orgName
        );
    }

    if (!servicesToUpdate.isEmpty()) {

        update servicesToUpdate;
    }
}

public static void sendReAssignmentEmails(
    List<ShiftWithStaff__c> acceptedShifts,
    Map<Id, String> oldStaffEmailMap,
    Map<Id, String> oldStaffNameMap,
    Staff__c newStaff,
    string orgName
) {

   

    /* =====================================================
       USER QUERY
       ===================================================== */

    Set<String> allEmails = new Set<String>();

    for (String oldEmail : oldStaffEmailMap.values()) {

        if (String.isNotBlank(oldEmail)) {

            allEmails.add(
                oldEmail.trim().toLowerCase()
            );
        }
    }

    if (
        newStaff != null &&
        String.isNotBlank(newStaff.Email_Address__c)
    ) {

        allEmails.add(
            newStaff.Email_Address__c
                .trim()
                .toLowerCase()
        );
    }

    Map<String, User> userByEmail =
        new Map<String, User>();

    Map<Id, Integer> unreadCountMap =
        new Map<Id, Integer>();

    List<User> users = [

        SELECT Id,
               Email,
               Mobile_device_token__c,

               (
                   SELECT Id,
                          Mark_as_read_notifications__c
                   FROM My_Notifications__r
                   ORDER BY CreatedDate DESC
                   LIMIT 20
               )

        FROM User

        WHERE Email IN :allEmails
    ];

    for (User u : users) {

        Integer unread = 0;

        if (u.My_Notifications__r != null) {

            for (
                My_Notification__c n
                : u.My_Notifications__r
            ) {

                if (
                    !n.Mark_as_read_notifications__c
                ) {

                    unread++;
                }
            }
        }

        userByEmail.put(
            u.Email.trim().toLowerCase(),
            u
        );

        unreadCountMap.put(
            u.Id,
            unread
        );
    }

    /* =====================================================
       EMAILS + PUSH + NOTIFICATIONS
       ===================================================== */

    // List<Messaging.SingleEmailMessage> mails = new List<Messaging.SingleEmailMessage>();

    List<Object> bulkEmails = new List<Object>();

    Organisation__c orgObj = [
        SELECT Email__c
        FROM Organisation__c
        WHERE Name = :orgName
        LIMIT 1
    ];

    String senderEmailAddress = orgObj.Email__c;

    List<My_Notification__c> notifications = new List<My_Notification__c>();

    List<String> deviceTokens = new List<String>();

    List<String> mobileMessages = new List<String>();

    List<Integer> unreadCounts = new List<Integer>();

    /* =====================================================
       OLD STAFF EMAILS + PUSH
       ===================================================== */

    for (ShiftWithStaff__c sh : acceptedShifts) {

        String oldEmail = oldStaffEmailMap.get(sh.Id);

        String oldName = oldStaffNameMap.get(sh.Id);

        if (String.isBlank(oldEmail)) {
            continue;
        }

        String address = '';

        if (
            !String.isBlank(
                sh.Shift_Address__Street__s
            )
        ) {

            address =
                sh.Shift_Address__Street__s +
                ', ' +
                sh.Shift_Address__City__s +
                ', ' +
                sh.Shift_Address__StateCode__s +
                ', ' +
                sh.Shift_Address__CountryCode__s +
                ', ' +
                sh.Shift_Address__PostalCode__s;
        }

      

        String shiftDate = RosterAutoScheduleHandler.reverseDateFormat( String.valueOf( sh.Start_Date__c));

        String shiftTime =
            sh.Shift_Start_End_Time__c;

        /* =========================================
           EMAIL
           ========================================= */

        String body =

            'Hi ' + oldName + ',<br/><br/>' +

            'The following shift has been unassigned from you by the roster manager.<br/><br/>' +

            '<b>Shift Date:</b> ' +
            shiftDate +
            '<br/>' +

            '<b>Shift Timings:</b> ' +
            shiftTime +
            '<br/>' +

            '<b>Address:</b> ' +
            address +
            '<br/><br/>' +

            '<b>Note:</b> This is an automated email. Please do not reply.<br/><br/>' +

            'Regards,<br/>' +

             orgName;

        // Messaging.SingleEmailMessage msg = new Messaging.SingleEmailMessage();

        // msg.setToAddresses(
        //     new List<String>{ oldEmail }
        // );

        // msg.setSubject(
        //     'Shift Unassigned Notification'
        // );
        // msg.setSenderDisplayName(orgName);

        // msg.setHtmlBody(body);

        // msg.setSaveAsActivity(false);

        // mails.add(msg);

        Map<String, Object> oldStaffEmail =
            new Map<String, Object>();

        oldStaffEmail.put(
            'fromEmail',
            senderEmailAddress
        );

        oldStaffEmail.put(
            'toEmail',
            new List<String>{ oldEmail }
        );

        oldStaffEmail.put(
            'subject',
            'Shift Unassigned Notification'
        );

        oldStaffEmail.put(
            'body',
            body
        );

        bulkEmails.add(
            oldStaffEmail
        );

        /* =========================================
           PUSH + NOTIFICATION
           ========================================= */

        User u =
            userByEmail.get(
                oldEmail.trim().toLowerCase()
            );

        if (u != null) {

            String notificationText =

                'Shift unassigned on ' +
                shiftDate +
                ' for ' +
                shiftTime;

            notifications.add(

                new My_Notification__c(

                    User__c = u.Id,

                    Subject__c =
                        'Shift Unassigned',

                    Description__c =
                        notificationText
                )
            );

            if (
                String.isNotBlank(
                    u.Mobile_device_token__c
                )
            ) {

                deviceTokens.add(
                    u.Mobile_device_token__c
                );

                mobileMessages.add(
                    notificationText
                );

                unreadCounts.add(
                    unreadCountMap.get(u.Id)
                );
            }
        }
    }

    /* =====================================================
       NEW STAFF EMAIL + PUSH
       ===================================================== */

    if (
    newStaff != null &&
    String.isNotBlank(
        newStaff.Email_Address__c
    )
) {

    for (
        ShiftWithStaff__c sh
        : acceptedShifts
    ) {

        String shiftDate =
            RosterAutoScheduleHandler.reverseDateFormat(
                    String.valueOf(
                        sh.Start_Date__c
                    )
                );

        String shiftTime =
            sh.Shift_Start_End_Time__c;

        String address = '';

        if (
            !String.isBlank(
                sh.Shift_Address__Street__s
            )
        ) {

            address =
                sh.Shift_Address__Street__s +
                ', ' +
                sh.Shift_Address__City__s +
                ', ' +
                sh.Shift_Address__StateCode__s +
                ', ' +
                sh.Shift_Address__CountryCode__s +
                ', ' +
                sh.Shift_Address__PostalCode__s;
        }

        String assignedBody =

            'Hi ' +
            newStaff.Display_Nickname__c +
            ',<br/><br/>' +

            'The following shift has been assigned to you by the roster manager.<br/><br/>' +

            '<b>Shift Date:</b> ' +
            shiftDate +
            '<br/>' +

            '<b>Shift Timings:</b> ' +
            shiftTime +
            '<br/>' +

            '<b>Address:</b> ' +
            address +
            '<br/><br/>' +

            '<b>Note:</b> This is an automated email. Please do not reply.<br/><br/>' +

            'Regards,<br/>' +

             orgName;

        // Messaging.SingleEmailMessage assignMsg = new Messaging.SingleEmailMessage();

        // assignMsg.setToAddresses(
        //     new List<String>{
        //         newStaff.Email_Address__c
        //     }
        // );

        // assignMsg.setSubject(
        //     'New Shift Assignment'
        // );

        // assignMsg.setHtmlBody(
        //     assignedBody
        // );

        // assignMsg.setSaveAsActivity(false);
        // assignMsg.setSenderDisplayName(orgName);

        // mails.add(assignMsg);

        Map<String, Object> newStaffEmail =
            new Map<String, Object>();

        newStaffEmail.put(
            'fromEmail',
            senderEmailAddress
        );

        newStaffEmail.put(
            'toEmail',
            new List<String>{
                newStaff.Email_Address__c
            }
        );

        newStaffEmail.put(
            'subject',
            'New Shift Assignment'
        );

        newStaffEmail.put(
            'body',
            assignedBody
        );

        bulkEmails.add(
            newStaffEmail
        );

        /* =========================================
           PUSH NOTIFICATION
           ========================================= */

        User newUser =
            userByEmail.get(
                newStaff.Email_Address__c
                    .trim()
                    .toLowerCase()
            );

        if (newUser != null) {

            String notificationText =

                'New shift assigned on ' +
                shiftDate +
                ' for ' +
                shiftTime;

            notifications.add(

                new My_Notification__c(

                    User__c = newUser.Id,

                    Subject__c =
                        'New Shift Assignment',

                    Description__c =
                        notificationText
                )
            );

            if (
                String.isNotBlank(
                    newUser.Mobile_device_token__c
                )
            ) {

                deviceTokens.add(
                    newUser.Mobile_device_token__c
                );

                mobileMessages.add(
                    notificationText
                );

                unreadCounts.add(
                    unreadCountMap.get(
                        newUser.Id
                    )
                );
            }
        }
    }
}

    /* =====================================================
       SEND EMAILS
       ===================================================== */

    // if (!mails.isEmpty()) {

    //     Messaging.sendEmail(
    //         mails,
    //         false
    //     );
    // }

    if (!bulkEmails.isEmpty()) {

        Id jobId =
            System.enqueueJob(

                new EmailRelayQueueable(
                    bulkEmails
                )
            );

        System.debug(
            '✅ Shift Reassignment Bulk Email Queue Created: ' +
            jobId
        );

        System.debug(
            '✅ Total Emails Queued: ' +
            bulkEmails.size()
        );
    }

    /* =====================================================
       INSERT NOTIFICATIONS
       ===================================================== */

    if (!notifications.isEmpty()) {

        insert notifications;
    }

    /* =====================================================
       SEND PUSH
       ===================================================== */

    if (!deviceTokens.isEmpty()) {

        AddShiftController.sendPushNotificationsBatch(

            deviceTokens,
            mobileMessages,
            'Shift Reassignment',
            unreadCounts
        );
    }
}

@AuraEnabled

public static String swapShiftStaff(
    Id draggedShiftId,
    Id droppedShiftId
) {

    try {

        System.debug('===== SHIFT SWAP START =====');

        List<ShiftwithStaff__c> shiftList = [
            SELECT Id,
                   Staff__c,
                   Staff__r.Email_Address__c,Staff__r.Display_Nickname__c,Shift_Start_End_Time__c,Shift_Address__Street__s,Shift_Address__City__s,
                     Staff__r.Set_Hours__c,Shift_Address__StateCode__s,Shift_Address__CountryCode__s,Shift_Address__PostalCode__s,
                    Staff__r.Restrict_Set_Hours__c,Do_you_want_to_set_this_Recurring_Roster__c,
                    Duration__c,
                   Role__c,
                   Date__c,
                   Start_Date__c,
                   Shift_Day_Name__c,
                   Day_Name__c,
                   Type_of_shift__c,
                   Shift_End_Date__c,
                   Shift_End_Time__c,
                   Shift_Start_Time__c,
                   Public_holiday__c,
                   Recur_Holiday__c,
                   Add_Shift__c,

                   Is_long_Morning__c,
                   Is_long_Morning_Next_Day_Start__c,
                   Long_Morning_Start_Date_One__c,
                   Long_Morning_Hourly_Rate__c,

                   Is_Long_Afternoon__c,
                   Is_Long_Afternoon_Next_Day_Start__c,
                   Long_Afternoon_Start_Date_One__c,
                   Long_Afternoon_Hourly_Rate__c,

                   Is_Long_Night_Shift__c,
                   Is_Long_Night_Start_Next_Day__c,
                   Long_Night_Start_Date__c,
                   Long_Night_Hourly_Rate__c,

                   Is_long_Morning_Shift_two__c,
                   Is_Long_Morning_Next_Day_Start_Two__c,
                   Long_Morning_Start_Date_Two__c,
                   Long_Morning_Rate_Two__c,

                   Is_Long_afternoon_shift_two__c,
                   Long_Afternoon_Start_Date_Two__c,
                   Long_Afternoon_Rate_Two__c,

                   (
                       SELECT Id,
                              Service_Users__c
                       FROM Services_and_Support_Plans__r
                   )

            FROM ShiftwithStaff__c
            WHERE Id IN :new List<Id>{
                draggedShiftId,
                droppedShiftId
            }
        ];


        if(shiftList.size() != 2){
            return 'ERROR: Both shifts required';
        }


        ShiftwithStaff__c draggedShift;
        ShiftwithStaff__c droppedShift;


        for(ShiftwithStaff__c ss : shiftList){

            if(ss.Id == draggedShiftId){
                draggedShift = ss;
            }

            if(ss.Id == droppedShiftId){
                droppedShift = ss;
            }
        }


        Id draggedStaff = draggedShift.Staff__c;
        Id droppedStaff = droppedShift.Staff__c;


        Date draggedStartDate = draggedShift.Start_Date__c;

        Date draggedEndDate =draggedShift.Shift_End_Date__c;


        Date droppedStartDate =droppedShift.Start_Date__c;

        Date droppedEndDate =droppedShift.Shift_End_Date__c;



        // ==================================
        // FIRST SWAP DATES ONLY IN MEMORY
        // NO DATABASE UPDATE YET
        // ==================================

         draggedShift.Start_Date__c =droppedStartDate;

        draggedShift.Shift_End_Date__c = droppedEndDate;


        droppedShift.Start_Date__c =draggedStartDate;

        droppedShift.Shift_End_Date__c = draggedEndDate; 
        // update actual shift day after swap

        draggedShift.Shift_Day_Name__c = DateTime.newInstance( draggedShift.Start_Date__c,Time.newInstance(0,0,0,0) ).format('EEEE');


        droppedShift.Shift_Day_Name__c = DateTime.newInstance( droppedShift.Start_Date__c, Time.newInstance(0,0,0,0) ).format('EEEE');
        


        // ==================================
        // VALIDATE OVERLAP AFTER DATE CHANGE
        // ==================================

        String overlapMessage;


        overlapMessage =
            validateSwapOverlap(
                draggedShift,
                droppedStaff,
                droppedShift.Id
            );


        if(String.isNotBlank(overlapMessage)){
            return overlapMessage;
        }



        overlapMessage =
            validateSwapOverlap(
                droppedShift,
                draggedStaff,
                draggedShift.Id
            );


        if(String.isNotBlank(overlapMessage)){
            return overlapMessage;
        }



        // =============================
        // NOW SWAP STAFF
        // =============================

        String setHourMessage;


            // dropped staff receiving dragged shift

            setHourMessage =
                validateSetHours(
                    draggedShift,
                    droppedStaff,
                    droppedShift.Id
                );


            if(String.isNotBlank(setHourMessage)){
                return setHourMessage;
            }



            // dragged staff receiving dropped shift

            setHourMessage =
                validateSetHours(
                    droppedShift,
                    draggedStaff,
                    draggedShift.Id
                );


        if(String.isNotBlank(setHourMessage)){
            return setHourMessage;
        }

        draggedShift.Staff__c =
            droppedStaff;


        droppedShift.Staff__c =
            draggedStaff;




        // =============================
        // RECALCULATE RATE
        // EXISTING LOGIC
        // =============================

        ShiftTimehandler.UpdateHourlyRate(
            new List<ShiftwithStaff__c>{
                draggedShift,
                droppedShift
            },
            false
        );



        List<Services_and_Support_Plan__c> serviceUpdates =
            new List<Services_and_Support_Plan__c>();


        for(ShiftwithStaff__c ss : shiftList){


            if(ss.Services_and_Support_Plans__r != null){


                for(
                    Services_and_Support_Plan__c sp :
                    ss.Services_and_Support_Plans__r
                ){

                    sp.Service_Users__c =
                        ss.Staff__c;


                    serviceUpdates.add(sp);
                }
            }
        }



        update shiftList;



        if(!serviceUpdates.isEmpty()){

            update serviceUpdates;

        }
        List<ShiftwithStaff__c> notificationShifts = [

            SELECT Id,
                Staff__c,
                Staff__r.Display_Nickname__c,
                Staff__r.Email_Address__c,

                Start_Date__c,
                Shift_Start_End_Time__c,

                Shift_Address__Street__s,
                Shift_Address__City__s,
                Shift_Address__StateCode__s,
                Shift_Address__CountryCode__s,
                Shift_Address__PostalCode__s

            FROM ShiftwithStaff__c

            WHERE Id IN :new List<Id>{
                draggedShift.Id,
                droppedShift.Id
            }
        ];


        sendShiftSwapNotifications(
            notificationShifts
        );


        System.debug(
            '===== SHIFT SWAP COMPLETE ====='
        );


        return 'SUCCESS: Shift swapped successfully';



    }catch(Exception e){


        System.debug(
            'SHIFT SWAP ERROR '+
            e.getMessage()
        );


        return 'ERROR: '+e.getMessage();
    }
}
public static String validateSwapOverlap(
    ShiftwithStaff__c newShift,
    Id newStaffId,
    Id ignoreShiftId
){

    List<ShiftwithStaff__c> existingShifts = [
        SELECT Id,Staff__r.Display_Nickname__c, Staff__c,
               Start_Date__c,
               Shift_End_Date__c,
               Shift_Start_Time__c,
               Shift_End_Time__c,
                Start_time_Formula__c,
                End_time_formula__c
        FROM ShiftwithStaff__c
        WHERE Staff__c = :newStaffId
        AND Id != :ignoreShiftId
        AND (
            Start_Date__c = :newShift.Start_Date__c
            OR
            Shift_End_Date__c = :newShift.Start_Date__c
        ) AND status__c NOT IN ('Unassigned','Cancelled') AND Shift_Rejected__c !=true AND Attendence__c =true
    ];


    DateTime newStartDateTime =
        DateTime.newInstance(
            newShift.Start_Date__c,
            newShift.Shift_Start_Time__c
        );


    DateTime newEndDateTime =
        DateTime.newInstance(
            newShift.Shift_End_Date__c != null
                ? newShift.Shift_End_Date__c
                : newShift.Start_Date__c,
            newShift.Shift_End_Time__c
        );


    for(ShiftwithStaff__c oldShift : existingShifts){


        DateTime oldStartDateTime =
            DateTime.newInstance(
                oldShift.Start_Date__c,
                oldShift.Shift_Start_Time__c
            );


        DateTime oldEndDateTime =
            DateTime.newInstance(
                oldShift.Shift_End_Date__c != null
                    ? oldShift.Shift_End_Date__c
                    : oldShift.Start_Date__c,
                oldShift.Shift_End_Time__c
            );


        Boolean isOverlap =
            newStartDateTime < oldEndDateTime
            &&
            newEndDateTime > oldStartDateTime;


        if(isOverlap){

            return 
            'ERROR: Cannot swap shift. ' +
            oldShift.Staff__r.Display_Nickname__c +
            ' already has another shift between ' +
                oldShift.Start_time_Formula__c +
                ' and ' +
                oldShift.End_time_formula__c;

        }

    }

    return '';
}

public static String validateSetHours(
    ShiftwithStaff__c incomingShift,
    Id staffId,
    Id removingShiftId
){

    // =============================
    // Ignore weekends
    // =============================

    Integer dayNumber =
        Integer.valueOf(
            DateTime.newInstance(
                incomingShift.Start_Date__c,
                Time.newInstance(0,0,0,0)
            ).format('u')
        );


    if(dayNumber == 6 || dayNumber == 7){
        return '';
    }


    // =============================
    // Ignore Sleepover
    // =============================

    if(incomingShift.Type_of_shift__c == 'Sleepover Shift'){
        return '';
    }



    Staff__c staff = [
        SELECT Id,
               Name,
               Set_Hours__c,
               Restrict_Set_Hours__c
        FROM Staff__c
        WHERE Id = :staffId
    ];


    if(
        staff.Restrict_Set_Hours__c != true ||
        staff.Set_Hours__c == null ||
        staff.Set_Hours__c <= 0
    ){
        return '';
    }



    // =============================
    // get week range
    // Monday based same as existing
    // =============================

    Date currentDate =
        incomingShift.Start_Date__c;


    Date weekStart =
        currentDate.toStartOfWeek();


    Date weekEnd =
        weekStart.addDays(6);



    Decimal existingHours = 0;



    List<ShiftwithStaff__c> weekShifts = [
        SELECT Id,
               Duration__c,
               Start_Date__c,
               Type_of_shift__c
        FROM ShiftwithStaff__c
        WHERE Staff__c = :staffId
        AND Id != :removingShiftId
        AND Start_Date__c >= :weekStart
        AND Start_Date__c <= :weekEnd
        AND Status__c NOT IN ('Unassigned','Cancelled')
    ];



    for(ShiftwithStaff__c ss : weekShifts){


        Integer d =
            Integer.valueOf(
                DateTime.newInstance(
                    ss.Start_Date__c,
                    Time.newInstance(0,0,0,0)
                ).format('u')
            );


        if(d == 6 || d == 7){
            continue;
        }


        if(ss.Type_of_shift__c == 'Sleepover Shift'){
            continue;
        }


        existingHours +=
            ss.Duration__c != null
            ? ss.Duration__c
            : 0;
    }



    Decimal incomingHours =
        incomingShift.Duration__c != null
        ? incomingShift.Duration__c
        : 0;


    Decimal finalHours =
        existingHours + incomingHours;



    if(finalHours > staff.Set_Hours__c){


        return
        'ERROR: Cannot swap shift. '+
        staff.Name+
        ' set hours exceeded. Current weekly hours after swap will be '+
        finalHours+
        ' hrs. Limit is '+
        staff.Set_Hours__c+
        ' hrs';

    }


    return '';
}

public static void sendShiftSwapNotifications(
    List<ShiftwithStaff__c> swappedShifts
){

    if(swappedShifts == null || swappedShifts.isEmpty()){
        return;
    }


    Set<String> emails = new Set<String>();


    for(ShiftwithStaff__c sh : swappedShifts){

        if(
            sh.Staff__r != null &&
            String.isNotBlank(sh.Staff__r.Email_Address__c)
        ){

            emails.add(
                sh.Staff__r.Email_Address__c.toLowerCase()
            );

        }
    }


    if(emails.isEmpty()){
        return;
    }



    Map<String,User> userByEmail =
        new Map<String,User>();


    Map<Id,Integer> unreadCountMap =
        new Map<Id,Integer>();


    for(User u : [

        SELECT Id,
               Email,
               Mobile_device_token__c,

               (
                   SELECT Id,
                          Mark_as_read_notifications__c
                   FROM My_Notifications__r
                   ORDER BY CreatedDate DESC
                   LIMIT 20
               )

        FROM User
        WHERE Email IN :emails

    ]){


        Integer unread = 0;


        for(My_Notification__c n : u.My_Notifications__r){

            if(!n.Mark_as_read_notifications__c){

                unread++;
            }
        }


        userByEmail.put(
            u.Email.toLowerCase(),
            u
        );


        unreadCountMap.put(
            u.Id,
            unread
        );
    }

    // ================================
// GET CURRENT USER ORGANISATION
// ================================

        User objUser = [
            SELECT Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];


        Organisation__c orgObj = [
            SELECT Name,
                Email__c
            FROM Organisation__c
            WHERE Name = :objUser.Organization_Name__c
            LIMIT 1
        ];


        String orgName =
            orgObj.Name;


        String senderEmailAddress =
            orgObj.Email__c;



    List<My_Notification__c> notifications =
        new List<My_Notification__c>();


    List<Object> bulkEmails =
        new List<Object>();


    List<String> deviceTokens =
        new List<String>();


    List<String> pushMessages =
        new List<String>();


    List<Integer> unreadCounts =
        new List<Integer>();



    for(ShiftwithStaff__c sh : swappedShifts){


        if(
            sh.Staff__r == null ||
            String.isBlank(sh.Staff__r.Email_Address__c)
        ){
            continue;
        }



        String shiftDate =
            RosterAutoScheduleHandler.reverseDateFormat(
                String.valueOf(sh.Start_Date__c)
            );


        String shiftTime =
            sh.Shift_Start_End_Time__c;


        String address = '';

        if(
            String.isNotBlank(
                sh.Shift_Address__Street__s
            )
        ){

            address =
                sh.Shift_Address__Street__s +
                ', ' +
                sh.Shift_Address__City__s +
                ', ' +
                sh.Shift_Address__StateCode__s +
                ', ' +
                sh.Shift_Address__CountryCode__s +
                ', ' +
                sh.Shift_Address__PostalCode__s;
        }


        String body =

                'Hi ' +
                sh.Staff__r.Display_Nickname__c +
                ',<br/><br/>' +

                  'Your shift has been swapped by the roster manager. Below are your new shift details:<br/><br/>' +


                '<b>Shift Date:</b> ' +
                shiftDate +
                '<br/>' +

                '<b>Shift Timings:</b> ' +
                shiftTime +
                '<br/>' +

                '<b>Address:</b> ' +
                address +
                '<br/><br/>' +

                '<b>Note:</b> This is an automated email. Please do not reply.<br/><br/>' +

                'Regards,<br/>' +

                orgName;


        Map<String,Object> emailObj =
            new Map<String,Object>();

        emailObj.put(
            'fromEmail',
            senderEmailAddress
        );


        emailObj.put(
            'toEmail',
            new List<String>{
                sh.Staff__r.Email_Address__c
            }
        );


        emailObj.put(
            'subject',
            'Shift Swap Notification'
        );


        emailObj.put(
            'body',
            body
        );


        bulkEmails.add(emailObj);



        User u =
            userByEmail.get(
                sh.Staff__r.Email_Address__c.toLowerCase()
            );


        if(u != null){


            String pushText =
                'Your shift has been swapped to '+
                shiftDate+
                ' '+
                sh.Shift_Start_End_Time__c;



            notifications.add(

                new My_Notification__c(

                    User__c = u.Id,

                    Subject__c =
                    'Shift Swapped',

                    Description__c =
                    pushText
                )
            );



            if(
                String.isNotBlank(
                    u.Mobile_device_token__c
                )
            ){

                deviceTokens.add(
                    u.Mobile_device_token__c
                );


                pushMessages.add(
                    pushText
                );


                unreadCounts.add(
                    unreadCountMap.get(u.Id)
                );
            }

        }

    }



    if(!bulkEmails.isEmpty()){


        System.enqueueJob(
            new EmailRelayQueueable(
                bulkEmails
            )
        );
    }



    if(!notifications.isEmpty()){

        insert notifications;
    }



    if(!deviceTokens.isEmpty()){


        AddShiftController.sendPushNotificationsBatch(

            deviceTokens,

            pushMessages,

            'Shift Swap',

            unreadCounts
        );
    }

}
  
}