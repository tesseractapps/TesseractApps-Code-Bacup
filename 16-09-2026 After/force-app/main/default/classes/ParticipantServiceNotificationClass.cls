public with sharing class ParticipantServiceNotificationClass {
 public static List<Map<String,Object>> sendEmailsForService(
    Services_and_Support_Plan__c service,
    String staffName,
    String organizationName,
    Boolean isRecurring,
    String recurringStartDate,
    String recurringEndDate,
    String senderEmailAddress,
    String typeOfRecur
) {

    List<Map<String,Object>> bulkEmails = new List<Map<String,Object>>();
    Set<String> recipientEmails = new Set<String>();
    Map<String,String> recipientNames = new Map<String,String>();

    // ====================================================
    // CASE 1 : Service created by NDIS Participant
    // ====================================================
    if (service.CreatedBy.User_Type__c == 'NDIS Participants') {

        User participantUser = [
            SELECT FirstName, LastName, Email
            FROM User
            WHERE Id = :service.CreatedById
            LIMIT 1
        ];

        if (!String.isBlank(participantUser.Email)) {
            recipientEmails.add(participantUser.Email);
            recipientNames.put(
                participantUser.Email,
                participantUser.FirstName + ' ' + participantUser.LastName
            );
        }

    }
    // ====================================================
    // CASE 2 : Created by Org Admin / Roster Manager / Facility Admin
    // ====================================================
    else if (
        service.CreatedBy.User_Type__c == 'NDIS Org Admin' ||
        service.CreatedBy.User_Type__c == 'Roster Manager' ||
        service.CreatedBy.User_Type__c == 'Facility Admin'
    ) {

        for (Participant_Contact__c pc : [
            SELECT First_Name__c,
                   Last_Name__c,
                   Email__c,
                   Notify__c
            FROM Participant_Contact__c
            WHERE Participant__c = :service.Client__c
            AND Notify__c = true
            AND Email__c != null
        ]) {

            recipientEmails.add(pc.Email__c);
            recipientNames.put(
                pc.Email__c,
                pc.First_Name__c + ' ' + pc.Last_Name__c
            );
        }
    }

    // ====================================================
    // Build Email Payload
    // ====================================================
    for (String emailAddress : recipientEmails) {

        String subject = isRecurring
            ? 'Recurring Shift Notification - ' +
              typeOfRecur.substring(0,1).toUpperCase() +
              typeOfRecur.substring(1).toLowerCase()
            : 'New Service Created';

        String body =
            'Hi ' + recipientNames.get(emailAddress) + ',<br/><br/>' +

            'We’re pleased to inform you that a new service has been created for <b>' +
            service.Participant_Name__c +
            '</b>, and you are receiving this notification because you are listed as one of the contacts in our system.<br/><br/>' +

            'This service outlines the supports and activities that will be provided as part of your plan.<br/><br/>';

        // ====================================================
        // Recurring Notification Heading
        // ====================================================
        if (isRecurring) {
            body +=
                '<b>Recurring Shift Notification - ' +
                typeOfRecur.substring(0,1).toUpperCase() +
                typeOfRecur.substring(1).toLowerCase() +
                '</b><br/><br/>';
        }

        body +=
            '<b>Service Details</b><br/><br/>' +

            '<b>Service Name:</b> ' +
            service.Service_Type_Name__c +
            '<br/>' +

            '<b>Service Item:</b> ' +
            service.Services__c +
            '<br/>';

        // ====================================================
        // Recurring / Non-Recurring Date
        // ====================================================
        if (isRecurring) {

            body +=
                '<b>Recurring Period:</b> ' +
                StaffEmailNotificationController.reverseDateFormat(recurringStartDate) +
                ' - ' +
                StaffEmailNotificationController.reverseDateFormat(recurringEndDate) +
                '<br/>';

        } else {

            body +=
                '<b>Shift Date:</b> ' +
                StaffEmailNotificationController.reverseDateFormat(
                    String.valueOf(service.Date_of_Service__c)
                ) +
                '<br/>';
        }

        body +=
            '<b>Start Time:</b> ' +
            String.valueOf(service.Start_Time_Formula__c) +
            '<br/>' +

            '<b>End Time:</b> ' +
            String.valueOf(service.End_Time_Formula__c) +
            '<br/>' +

            '<b>Staff:</b> ' +
            staffName +
            '<br/><br/>' +

            'If any of these details appear incorrect or need clarification, please contact your support coordinator or our service team.<br/><br/>' +

            '<b>Note:</b> This is an automated notification. Please do not reply to this email.<br/><br/>' +

            '<b>Regards,</b><br/>' +
            organizationName;

        Map<String,Object> emailPayload = new Map<String,Object>();

        emailPayload.put('fromEmail', senderEmailAddress);
        emailPayload.put('toEmail', new List<String>{ emailAddress });
        emailPayload.put('subject', subject);
        emailPayload.put('body', body);

        bulkEmails.add(emailPayload);
    }

    return bulkEmails;
}

// ====================================================
// Prepare Emails from Service
// ====================================================
public static List<Map<String,Object>> prepareEmailsFromService(
    Id serviceId,
    Boolean isRecurring,
    String recurringStartDate,
    String recurringEndDate,
    String senderEmailAddress,
    String typeOfRecur
) {

    List<Map<String,Object>> bulkEmails = new List<Map<String,Object>>();

    Services_and_Support_Plan__c service = [
        SELECT Id,
               Client__c,
               Participant_Name__c,
               Service_Type_Name__c,
               Services__c,
               Date_of_Service__c,
               Start_Time_24_Format__c,
               End_Time_24_Format__c,
               CreatedById,
               CreatedBy.User_Type__c,
               End_Time_Formula__c,
               Start_Time_Formula__c,
               ShiftwithStaff__r.Staff__r.Display_Nickname__c,
               ShiftwithStaff__r.Staff__r.Organization_Full_Name__c
        FROM Services_and_Support_Plan__c
        WHERE Id = :serviceId
    ];

    bulkEmails.addAll(
        sendEmailsForService(
            service,
            service.ShiftwithStaff__r.Staff__r.Display_Nickname__c,
            service.ShiftwithStaff__r.Staff__r.Organization_Full_Name__c,
            isRecurring,
            recurringStartDate,
            recurringEndDate,
            senderEmailAddress,
            typeOfRecur
        )
    );

    return bulkEmails;
}


// ====================================================
// Prepare Emails from Shift
// ====================================================
private static List<Map<String,Object>> prepareEmailsFromShift(
    Id shiftId,
    Boolean isRecurring,
    String recurringStartDate,
    String recurringEndDate,
    String senderEmailAddress,
    String typeOfRecur
) {

    List<Map<String,Object>> bulkEmails = new List<Map<String,Object>>();

    Add_Shift__c shift = [
        SELECT Id,
               Facility__r.Name,
               (
                    SELECT Id,
                           Staff__r.Display_Nickname__c,
                           Staff__r.Organization_Full_Name__c,
                           (
                                SELECT Id,
                                       Client__c,
                                       Participant_Name__c,
                                       Service_Type_Name__c,
                                       Services__c,
                                       Date_of_Service__c,
                                       Start_Time_24_Format__c,
                                       End_Time_24_Format__c,
                                       End_Time_Formula__c,
                                       Start_Time_Formula__c,
                                       CreatedById,
                                       CreatedBy.User_Type__c
                                FROM Services_and_Support_Plans__r
                           )
                    FROM ShiftwithStaffs__r
               )
        FROM Add_Shift__c
        WHERE Id = :shiftId
    ];

    for (ShiftwithStaff__c sws : shift.ShiftwithStaffs__r) {

        String staffName = sws.Staff__r.Display_Nickname__c;
        String organizationName = sws.Staff__r.Organization_Full_Name__c;

        for (Services_and_Support_Plan__c service : sws.Services_and_Support_Plans__r) {

            bulkEmails.addAll(
                sendEmailsForService(
                    service,
                    staffName,
                    organizationName,
                    isRecurring,
                    recurringStartDate,
                    recurringEndDate,
                    senderEmailAddress,
                    typeOfRecur
                )
            );
        }
    }

    return bulkEmails;
}

// ====================================================
// Main Method - Called from StaffEmailNotificationController
// ====================================================
public static List<Map<String, Object>> prepareParticipantServiceEmails(
    Id recordId,
    Boolean isShift,
    Boolean isRecurring,
    String recurringStartDate,
    String recurringEndDate,
    String senderEmailAddress,
    String typeOfRecur
) {

    List<Map<String, Object>> bulkEmails = new List<Map<String, Object>>();

    if (isShift) {

        bulkEmails.addAll(
            prepareEmailsFromShift(
                recordId,
                isRecurring,
                recurringStartDate,
                recurringEndDate,
                senderEmailAddress,
                typeOfRecur
            )
        );

    } else {

        bulkEmails.addAll(
            prepareEmailsFromService(
                recordId,
                isRecurring,
                recurringStartDate,
                recurringEndDate,
                senderEmailAddress,
                typeOfRecur
            )
        );
    }

    return bulkEmails;
}
}