public class TSignTemplates {

    @AuraEnabled
    public static Id saveTemplateData(
        Id templateId,
        String fileName,
        String fileUrl,
        String placeholderJSON,
        String orgId,
        String key,
        String templateName,
        String description,
        String type,
        String status,
        String facilityId
    ) {
        TSign_Template__c template;

        if (templateId != null) {
            // ✅ EDIT — load existing record and update it
            template = [
                SELECT Id
                FROM TSign_Template__c
                WHERE Id = :templateId
                LIMIT 1
            ];
        } else {
            // ✅ NEW — create fresh record
            template = new TSign_Template__c();
            template.Organisation_Id__c = orgId;
        }

        template.File_Name__c       = fileName;
        template.Amazon_Url__c      = fileUrl;
        template.Placeholder_JSON__c = placeholderJSON;
        template.Key__c             = key;
        template.Template_Name__c   = templateName;
        template.Description__c     = description;
        template.Template_Type__c   = type;
        template.Status__c          = status;
        // Facility selected in the dashboard dropdown (create and edit)
        template.TSign_Facility__c  = toFacilityId(facilityId);

        upsert template;
        return template.Id;
    }

    // Facility Id from the browser (localStorage) can be blank or "undefined" -> null
    public static Id toFacilityId(String facilityId) {
        if (String.isBlank(facilityId)) {            return null;
        }
        try {
            return Id.valueOf(facilityId.trim());
        } catch (Exception e) {
            return null;
        }
    }

    /*
    @AuraEnabled(cacheable=true)
    public static List<TSign_Template__c> getAllTemplates(Id orgId) {
        return [
            SELECT Id, Name, CreatedDate, LastModifiedDate,
                   File_Name__c, Amazon_Url__c, Placeholder_JSON__c,
                   Organisation_Id__c, Key__c, Status__c,
                   Template_Name__c, Description__c, Template_Type__c
            FROM TSign_Template__c
            WHERE Organisation_Id__c = :orgId
            ORDER BY CreatedDate DESC
        ];
    }
        */

    @AuraEnabled(cacheable=true)
    public static List<TSign_Template__c> getAllTemplates(Id orgId, String facilityId) {

        Id facId = toFacilityId(facilityId);

        User currentUser = [

            SELECT Id,
                User_Type__c

            FROM User

            WHERE Id = :UserInfo.getUserId()

            LIMIT 1
        ];


        if (
            currentUser.User_Type__c == 'NDIS Org Admin' ||
            currentUser.User_Type__c == 'Facility Admin'
        ) {

            return [

                SELECT Id,
                    Name,
                    CreatedDate,
                    LastModifiedDate,
                    File_Name__c,
                    Amazon_Url__c,
                    Placeholder_JSON__c,
                    Organisation_Id__c,
                    Key__c,
                    Status__c,
                    Template_Name__c,
                    Description__c,
                    Template_Type__c,
                    CreatedById,
                    CreatedBy.Full_Name__c

                FROM TSign_Template__c

                WHERE Organisation_Id__c = :orgId
                AND TSign_Facility__c = :facId
                AND Status__c != 'Archive'

                ORDER BY CreatedDate DESC
            ];
        }


        Set<Id> sharedTemplateIds = new Set<Id>();

        for (TSign_Folder_Share__c fs : [

            SELECT TSign_Template__c

            FROM TSign_Folder_Share__c

            WHERE TSign_Staff__r.Email__c =: UserInfo.getUserEmail() AND Type__c = 'Template' AND Active__c = true ]) { sharedTemplateIds.add(fs.TSign_Template__c);
        }

        return [

            SELECT Id,
                Name,
                CreatedDate,
                LastModifiedDate,
                File_Name__c,
                Amazon_Url__c,
                Placeholder_JSON__c,
                Organisation_Id__c,
                Key__c,
                Status__c,
                Template_Name__c,
                Description__c,
                Template_Type__c,
                CreatedById,
                CreatedBy.Full_Name__c

            FROM TSign_Template__c

            WHERE Organisation_Id__c = :orgId
            AND TSign_Facility__c = :facId
             AND Status__c != 'Archive'

            AND (
                CreatedById = :UserInfo.getUserId()
                OR Id IN :sharedTemplateIds
            )

            ORDER BY CreatedDate DESC
        ];
    }

@AuraEnabled
public static List<TSign_Template__c> getArchivedTemplates(Id orgId, String facilityId) {

    Id facId = toFacilityId(facilityId);

    User currentUser = [

        SELECT
            Id,
            User_Type__c

        FROM User

        WHERE Id = :UserInfo.getUserId()

        LIMIT 1
    ];

    // Admin users → see all archived templates
    if (
        currentUser.User_Type__c == 'NDIS Org Admin' ||        currentUser.User_Type__c == 'Facility Admin'
    ) {

        return [

            SELECT
                Id,
                Name,
                CreatedDate,
                LastModifiedDate,
                File_Name__c,
                Amazon_Url__c,
                Placeholder_JSON__c,
                Organisation_Id__c,
                Key__c,
                Status__c,
                Template_Name__c,
                Description__c,
                Template_Type__c,
                CreatedById,
                CreatedBy.Full_Name__c

            FROM TSign_Template__c

            WHERE
                Organisation_Id__c = :orgId
                AND TSign_Facility__c = :facId
                AND Status__c = 'Archive'

            ORDER BY CreatedDate DESC
        ];
    }


    Set<Id> sharedTemplateIds = new Set<Id>();

    for (
        TSign_Folder_Share__c fs :

        [

            SELECT
                TSign_Template__c

            FROM TSign_Folder_Share__c

            WHERE
                TSign_Staff__r.Email__c =
                    :UserInfo.getUserEmail()

                AND Type__c = 'Template'

                AND Active__c = true 
        ]
    ) {

        sharedTemplateIds.add(
            fs.TSign_Template__c
        );
    }


    return [

        SELECT
            Id,
            Name,
            CreatedDate,
            LastModifiedDate,
            File_Name__c,
            Amazon_Url__c,
            Placeholder_JSON__c,
            Organisation_Id__c,
            Key__c,
            Status__c,
            Template_Name__c,
            Description__c,
            Template_Type__c,
            CreatedById,
            CreatedBy.Full_Name__c

        FROM TSign_Template__c

        WHERE
            Organisation_Id__c = :orgId AND TSign_Facility__c = :facId AND Status__c = 'Archive'

            AND (

                CreatedById =
                    :UserInfo.getUserId()

                OR

                Id IN :sharedTemplateIds
            )

        ORDER BY CreatedDate DESC
    ];
}

@AuraEnabled
public static List<Map<String, Object>> getSavedTemplates(Id orgId, String facilityId) {
    try {
        if (orgId == null) {
            return new List<Map<String, Object>>();
        }
        // All Documents shows only documents whose template belongs to the selected facility
        Id facId = toFacilityId(facilityId);
        List < TSign_Participant_Template__c > templates = [
            SELECT Id,
            File_Name__c,
            AWS_Document__c,
            TSign_Organisation__c,
            Status__c,
            CreatedDate,
            CreatedBy.Full_Name__c,
            TSign_Template__c,
            TSign_Template__r.Template_Name__c,
            TSign_Template__r.Amazon_Url__c,
            Recipient_JSON__c FROM TSign_Participant_Template__c WHERE TSign_Organisation__c = : orgId AND TSign_Template__c != null AND TSign_Template__r.TSign_Facility__c = :facId ORDER BY CreatedDate DESC
        ];
        Set < Id > participantIds = new Set<Id>();
        Map < Id,
        String > primaryRecipientEmailMap = new Map<Id, String>();
        for (TSign_Participant_Template__c rec : templates) {
            participantIds.add(rec.Id);
            if (!String.isBlank(rec.Recipient_JSON__c)) {
                try {
                    Map < String,
                    Object > jsonMap = (Map < String, Object >)
                    JSON.deserializeUntyped(rec.Recipient_JSON__c);
                    String email = (String)jsonMap.get('Email');
                    if (!String.isBlank(email)) {
                        primaryRecipientEmailMap.put(rec.Id, email.trim().toLowerCase()); } } catch (Exception ex) {}
            }
        }
        Map < Id,
        String > statusMap = new Map<Id, String>();
        Map < Id,
        Id > participantOfferMap = new Map<Id, Id>();
        Map < Id,
        String > additionalRecipientsMap = new Map<Id, String>();
        for (TSign_Offer_Template__c rec : [
            SELECT Id,
            TSign_Participant_Template__c,
            Current_Recipient_Status__c,
            Current_Recipient__c,
            All_Recipients__c FROM TSign_Offer_Template__c WHERE TSign_Participant_Template__c IN : participantIds ORDER BY CreatedDate DESC
        ]) {
            if (statusMap.containsKey(rec.TSign_Participant_Template__c)) {                continue;
            }
            List < String > allEmails = new List<String>();
            if (!String.isBlank(rec.All_Recipients__c)) {
                allEmails = rec.All_Recipients__c.split('\n');
            }
            String status = 'Created';
            String currentRecipient = rec.Current_Recipient__c;
            String currentStatus = rec.Current_Recipient_Status__c;
            if (String.isBlank(rec.All_Recipients__c) && String.isBlank(currentRecipient) && String.isBlank(currentStatus)) {                status = 'Created';
            } else if (currentStatus == 'Completed') {
                status = 'Completed';
                participantOfferMap.put(rec.TSign_Participant_Template__c, rec.Id); } else { Integer index = -1; for (Integer i = 0; i < allEmails.size(); i ++) { if (currentRecipient != null && allEmails[i].trim().toLowerCase() == currentRecipient.trim().toLowerCase()) { index = i; break; } } String recipientDisplay = currentRecipient; if (!String.isBlank(recipientDisplay) && recipientDisplay.contains('@')) { recipientDisplay = recipientDisplay.substringBefore('@').replace('-', ' ').replace('_', ' ').replace('.', ' '); while (recipientDisplay.indexOf('  ') >= 0) { recipientDisplay = recipientDisplay.replace('  ', ' ');
                    } } if (index == 0) { status = recipientDisplay + ' - Pending';
                } else { status = recipientDisplay + ' - ' + ( String.isBlank(currentStatus) ? 'Pending' : currentStatus );
                }
            }
            statusMap.put(rec.TSign_Participant_Template__c, status);
            List < String > names = new List<String>();
            String primaryEmail = primaryRecipientEmailMap.get(rec.TSign_Participant_Template__c);
            for (String email : allEmails) {
                email = email.trim();
                if (String.isBlank(email)) {                    continue;
                }
                if (primaryEmail != null && email.toLowerCase() == primaryEmail) {
                    continue;
                }
                String name = email;
                if (name.contains('@')) {
                    name = name.substringBefore('@');
                }
                name = name
                    .replace('-', ' ')
                    .replace('_', ' ')
                    .replace('.', ' ');
                while (name.indexOf('  ') >= 0) {                    name = name.replace('  ', ' ');
                }
                names.add(name.trim());
            }
            additionalRecipientsMap.put(
                rec.TSign_Participant_Template__c,
                names.isEmpty() ? '-'
                    : String.join(names, ', ')
            );
        }
        Map < Id,
        String > signedUrlMap = new Map<Id, String>();
        if (!participantOfferMap.isEmpty()) {
            for (TSign_Child_Signature__c rec : [SELECT TSign_Offer_Template__c, Signature_URL__c FROM TSign_Child_Signature__c WHERE TSign_Offer_Template__c IN : participantOfferMap.values()ORDER BY CreatedDate DESC]) {                if (!signedUrlMap.containsKey(rec.TSign_Offer_Template__c)) {                    signedUrlMap.put(rec.TSign_Offer_Template__c, rec.Signature_URL__c);
                }
            }
        }
        List < Map < String,
        Object >> result = new List<Map<String, Object>>();
        for (TSign_Participant_Template__c rec : templates) {
            String fullName = '';
            String clientEmail = '';
            if (!String.isBlank(rec.Recipient_JSON__c)) {
                try {
                    Map < String,
                    Object > jsonMap = (Map < String, Object >)
                    JSON.deserializeUntyped(rec.Recipient_JSON__c);
                    fullName = (String)
                    jsonMap.get('FullName');
                    clientEmail = (String)
                    jsonMap.get('Email'); } catch (Exception ex) {}
            }
            String finalUrl = rec.AWS_Document__c;
            if ('Completed' == statusMap.get(rec.Id)) {
                Id offerId = participantOfferMap.get(rec.Id);
                if (offerId != null && signedUrlMap.containsKey(offerId)) {       finalUrl = signedUrlMap.get(offerId);
                }
            }
            result.add(new Map<String, Object> {
                'Id' => rec.Id,
                'File_Name__c' => rec.File_Name__c,
                'AWS_Document__c' => finalUrl,
                'TSign_Organisation__c' => rec.TSign_Organisation__c,
                'Status__c' => statusMap.containsKey(rec.Id)
                    ? statusMap.get(rec.Id) : 'Created',
                'CreatedDate' => rec.CreatedDate,
                'TSign_Template__c' => rec.TSign_Template__c,
                'Template_Name__c' => rec.TSign_Template__r != null
                    ? rec.TSign_Template__r.Template_Name__c : '',
                 'AmazonUrl' => rec.TSign_Template__r != null
                    ? rec.TSign_Template__r.Amazon_Url__c : '',   
                'RecipientName' => fullName,
                'ClientEmail' => clientEmail,
                'CreatedBy' => rec.CreatedBy != null? rec.CreatedBy.Full_Name__c: '',
                'AdditionalRecipients' => additionalRecipientsMap.containsKey(rec.Id)
                    ? additionalRecipientsMap.get(rec.Id) : '-'
                });
        }
        return result; } catch (Exception e) { throw new AuraHandledException('Error fetching templates: ' + e.getMessage());
    }
}

    @AuraEnabled(cacheable=true)
            public static TSign_Template__c fetchTemplateData(Id templateId) {
                if (templateId == null) {
                    throw new AuraHandledException('Template Id is required.');
                }

                return [
                    SELECT Id,
                        Name,
                        CreatedDate,
                        LastModifiedDate,
                        File_Name__c,
                        Amazon_Url__c,
                        Placeholder_JSON__c,
                        Organisation_Id__c,
                        Key__c,
                        Status__c,
                        Template_Name__c,
                        Description__c,
                        Template_Type__c
                    FROM TSign_Template__c
                    WHERE Id = :templateId
                    LIMIT 1
                ];
            }

@AuraEnabled
    public static void updateTemplateStatus(Id templateId, String actionType) {
        try {
            if (templateId == null) { throw new AuraHandledException('Template Id is required.');
            }

            if (String.isBlank(actionType)) { throw new AuraHandledException('Action type is required.');
            }

            TSign_Template__c templateRec = [
                SELECT Id, Status__c
                FROM TSign_Template__c
                WHERE Id = :templateId
                LIMIT 1
            ];

            String normalizedAction = actionType.trim().toUpperCase();

            if (normalizedAction == 'ARCHIVE') {
                templateRec.Status__c = 'Archive';
            } else if (normalizedAction == 'UNARCHIVE') {
                templateRec.Status__c = 'Draft'; } else { throw new AuraHandledException('Invalid action type. Use ARCHIVE or UNARCHIVE.');
            }

            update templateRec; } catch (AuraHandledException e) { throw e; } catch (Exception e) { throw new AuraHandledException('Unable to update template status: ' + e.getMessage());
        }
    }

@AuraEnabled
public static List<TSign_Staff__c> getStaffByFacilities(List<String> facIdlist) {
    if (facIdlist == null || facIdlist.isEmpty()) {         return new List<TSign_Staff__c>();
    }

    return [
        SELECT Id, Display_Nickname__c
        FROM TSign_Staff__c
        WHERE Status__c = true
        AND Id IN (
            SELECT TSign_Staff__c
            FROM TSign_Staff_Facility__c
            WHERE TSign_Facility__c IN :facIdlist
        )
        ORDER BY Display_Nickname__c ASC
    ];
}

// Create Document "Contacts" recipients: TSign contacts linked to the selected facility
@AuraEnabled
public static List<TSign_Contact__c> getContactsByFacility(String facilityId) {
    Id facId = toFacilityId(facilityId);
    if (facId == null) {        return new List<TSign_Contact__c>();
    }
    return [
        SELECT Id, First_Name__c, Last_Name__c, Email__c
        FROM TSign_Contact__c
        WHERE TSign_Facility__c = :facId
        AND Is_Archived__c = false
        ORDER BY First_Name__c ASC, Last_Name__c ASC
    ];
}

// Auto-fill values for the selected recipient: Users -> TSign_Staff__c, Contacts -> TSign_Contact__c
@AuraEnabled
public static DemographicResponse getRecipientDemographicDetails(String sendDocumentFormJson) {
    DemographicResponse response = new DemographicResponse();
    response.fieldValues = new Map<String, String>();

    if (String.isBlank(sendDocumentFormJson)) {        return response;
    }

    Map<String, Object> formMap = (Map<String, Object>) JSON.deserializeUntyped(sendDocumentFormJson);
    String recipientType = (String) formMap.get('recipientType');
    Id recordId = toFacilityId((String) formMap.get('contactId'));

    if (recordId == null) {        return response;
    }
    response.recordId = recordId;

    if (recipientType == 'Users' && recordId.getSObjectType() == TSign_Staff__c.SObjectType) {
        TSign_Staff__c staff = [
            SELECT Id, First_Name__c, Last_Name__c, Display_Nickname__c, Email__c, Phone__c,
                   Address__Street__s, Address__City__s, Address__StateCode__s,
                   Address__PostalCode__s, Address__CountryCode__s
            FROM TSign_Staff__c
            WHERE Id = :recordId
            LIMIT 1
        ];
        response.recordTypeName = 'TSign_Staff__c';
        response.fieldValues.put('FullName', staff.Display_Nickname__c);
        response.fieldValues.put('Name', staff.Display_Nickname__c);
        response.fieldValues.put('Nickname', staff.Display_Nickname__c);
        response.fieldValues.put('FirstName', staff.First_Name__c);
        response.fieldValues.put('LastName', staff.Last_Name__c);
        response.fieldValues.put('Email', staff.Email__c);
        response.fieldValues.put('ContactNumber', staff.Phone__c);
        response.fieldValues.put('Address', joinAddress(
            staff.Address__Street__s, staff.Address__City__s, staff.Address__StateCode__s,
            staff.Address__PostalCode__s, staff.Address__CountryCode__s));
    } else if (recipientType == 'Contacts' && recordId.getSObjectType() == TSign_Contact__c.SObjectType) {
        TSign_Contact__c contactRec = [
            SELECT Id, First_Name__c, Last_Name__c, Email__c, Contact_Number__c,
                   Address__Street__s, Address__City__s, Address__StateCode__s,
                   Address__PostalCode__s, Address__CountryCode__s
            FROM TSign_Contact__c
            WHERE Id = :recordId
            LIMIT 1
        ];
        String fullName = String.join(new List<String>{
            contactRec.First_Name__c == null ? '' : contactRec.First_Name__c,
            contactRec.Last_Name__c == null ? '' : contactRec.Last_Name__c
        }, ' ').trim();
        response.recordTypeName = 'TSign_Contact__c';
        response.fieldValues.put('FullName', fullName);
        response.fieldValues.put('Name', fullName);
        response.fieldValues.put('Nickname', fullName);
        response.fieldValues.put('FirstName', contactRec.First_Name__c);
        response.fieldValues.put('LastName', contactRec.Last_Name__c);
        response.fieldValues.put('Email', contactRec.Email__c);
        response.fieldValues.put('ContactNumber', contactRec.Contact_Number__c);
        response.fieldValues.put('Address', joinAddress(
            contactRec.Address__Street__s, contactRec.Address__City__s, contactRec.Address__StateCode__s,
            contactRec.Address__PostalCode__s, contactRec.Address__CountryCode__s));
    }

    return response;
}

// "Street, City State Postcode, Country" - blank parts are skipped
private static String joinAddress(String street, String city, String state, String postcode, String country) {
    List<String> locality = new List<String>();
    for (String part : new List<String>{ city, state, postcode }) {
        if (String.isNotBlank(part)) {          locality.add(part.trim());
        }
    }
    List<String> parts = new List<String>();
    for (String part : new List<String>{ street, String.join(locality, ' '), country }) {
        if (String.isNotBlank(part)) {
            parts.add(part.trim());
        }
    }
    return String.join(parts, ', ');
}

public class RecipientOption {
        @AuraEnabled public String label;
        @AuraEnabled public String value;
        @AuraEnabled public String type;
        @AuraEnabled public String email;
    }

    public class RecipientDetails {
        @AuraEnabled public Id recordId;
        @AuraEnabled public String name;
        @AuraEnabled public String email;
        @AuraEnabled public String type;
    }

    // @AuraEnabled
    // public static List<RecipientOption> getParticipantAndContactOptions(Id orgId) {
    //     List<RecipientOption> options = new List<RecipientOption>();

    //     if (orgId == null) {
    //         return options;
    //     }

    //     for (Client__c participant : [
    //         SELECT Id, Name, Email__c
    //         FROM Client__c
    //         WHERE Status__c = true
    //         AND Email__c != null
    //         AND Id IN (
    //             SELECT Participant__c
    //             FROM Participant_Facility__c
    //             WHERE Active__c = true
    //             AND Facility__r.TSign_Organisation__c = :orgId
    //         )
    //         ORDER BY Name ASC
    //     ]) {
    //         RecipientOption opt = new RecipientOption();
    //         opt.label = participant.Name;
    //         opt.value = participant.Id;
    //         opt.type = 'Participant';
    //         opt.email = participant.Email__c;
    //         options.add(opt);
    //     }

    //     for (New_Contact__c contact : [
    //         SELECT Id, Name, Email__c
    //         FROM New_Contact__c
    //         WHERE TSign_Organisation__c = :orgId
    //         AND Email__c != null
    //         ORDER BY Name ASC
    //     ]) {
    //         RecipientOption opt = new RecipientOption();
    //         opt.label = contact.Name;
    //         opt.value = contact.Id;
    //         opt.type = 'Contact';
    //         opt.email = contact.Email__c;
    //         options.add(opt);
    //     }

    //     return options;
    // }



    // @AuraEnabled
    // public static RecipientDetails getRecipientDetailsByEmail(String email, Id orgId) {
    //     if (String.isBlank(email) || orgId == null) {
    //         throw new AuraHandledException('Email and Organization Id are required.');
    //     }

    //     List<Client__c> participants = [
    //         SELECT Id, Name, Email__c
    //         FROM Client__c
    //         WHERE Status__c = true
    //         AND Email__c = :email
    //         AND Id IN (
    //             SELECT Participant__c
    //             FROM Participant_Facility__c
    //             WHERE Active__c = true
    //             AND Facility__r.TSign_Organisation__c = :orgId
    //         )
    //         LIMIT 1
    //     ];

    //     if (!participants.isEmpty()) {
    //         RecipientDetails details = new RecipientDetails();
    //         details.recordId = participants[0].Id;
    //         details.name = participants[0].Name;
    //         details.email = participants[0].Email__c;
    //         details.type = 'Participant';
    //         return details;
    //     }

    //     List<New_Contact__c> contacts = [
    //         SELECT Id, Name, Email__c
    //         FROM New_Contact__c
    //         WHERE TSign_Organisation__c = :orgId
    //         AND Email__c = :email
    //         LIMIT 1
    //     ];

    //     if (!contacts.isEmpty()) {
    //         RecipientDetails details = new RecipientDetails();
    //         details.recordId = contacts[0].Id;
    //         details.name = contacts[0].Name;
    //         details.email = contacts[0].Email__c;
    //         details.type = 'Contact';
    //         return details;
    //     }

    //     throw new AuraHandledException('No recipient found for the selected email.');
    // }


    public class DemographicResponse {
        @AuraEnabled public String recordTypeName;
        @AuraEnabled public Id recordId;
        @AuraEnabled public Map<String, String> fieldValues;
    }

    // @AuraEnabled
    // public static DemographicResponse getRecipientDemographicDetails(String sendDocumentFormJson) {
    //     DemographicResponse response = new DemographicResponse();
    //     response.fieldValues = new Map<String, String>();

    //     if (String.isBlank(sendDocumentFormJson)) {
    //         return response;
    //     }

    //     Map<String, Object> formMap =
    //         (Map<String, Object>) JSON.deserializeUntyped(sendDocumentFormJson);

    //     String recipientType = (String) formMap.get('recipientType');
    //     String contactIdStr   = (String) formMap.get('contactId');

    //     if (String.isBlank(recipientType) || String.isBlank(contactIdStr)) {
    //         return response;
    //     }

    //     Id recordId = (Id) contactIdStr;
    //     response.recordId = recordId;

    //     if (recipientType != 'Staff' && recipientType != 'Participant') {
    //         return response;
    //     }

    //     Schema.SObjectType sObjectType = recordId.getSObjectType();

    //     if (recipientType == 'Staff' && sObjectType == TSign_Staff__c.SObjectType) {
    //         TSign_Staff__c staff = [
    //             SELECT Id,
    //                     Name,
    //                     Last_Name__c,
    //                    Display_Nickname__c,
    //                    Display_Nickname__c,
    //                    Date_Of_Birth__c,
    //                    AddressData__c,
    //                    Email__c,
    //                    Phone__c
    //             FROM TSign_Staff__c
    //             WHERE Id = :recordId
    //             LIMIT 1
    //         ];

    //         response.recordTypeName = 'Staff';
    //         response.fieldValues.put('FullName', staff.Display_Nickname__c);
    //         response.fieldValues.put('Name', staff.Display_Nickname__c);
    //         response.fieldValues.put('Nickname', staff.Display_Nickname__c);
    //         response.fieldValues.put('FirstName', staff.Name);
    //         response.fieldValues.put('LastName', staff.Last_Name__c);
    //         response.fieldValues.put('Email', staff.Email__c);
    //         response.fieldValues.put('ContactNumber', staff.Phone__c);
    //         response.fieldValues.put('Address', staff.AddressData__c);
    //         response.fieldValues.put(
    //             'DateOfBirth',
    //             staff.Date_Of_Birth__c == null ? null : String.valueOf(staff.Date_Of_Birth__c)
    //         );
    //     }
    //     else if (recipientType == 'Participant' && sObjectType == Client__c.SObjectType) {
    //         Client__c clientRec = [
    //             SELECT Id,
    //                    Name__c,
    //                     First_Name__c,
    //                     Last_Name__c,
    //                     Display_Nickname__c,
    //                    Email__c,
    //                    AddressData__c,
    //                    Date_Of_Birth__c,
    //                    Phone__c
    //             FROM Client__c
    //             WHERE Id = :recordId
    //             LIMIT 1
    //         ];

    //         response.recordTypeName = 'Client__c';
    //         response.fieldValues.put('FullName', clientRec.Name__c);
    //         response.fieldValues.put('Name', clientRec.Name__c);
    //         response.fieldValues.put('FirstName', clientRec.First_Name__c);
    //         response.fieldValues.put('LastName', clientRec.Last_Name__c);
    //         response.fieldValues.put('Nickname', clientRec.Display_Nickname__c);
    //         response.fieldValues.put('Email', clientRec.Email__c);
    //         response.fieldValues.put('ContactNumber', clientRec.Phone__c);
    //         response.fieldValues.put('Address', clientRec.AddressData__c);
    //         response.fieldValues.put(
    //             'DateOfBirth',
    //             clientRec.Date_Of_Birth__c == null ? null : String.valueOf(clientRec.Date_Of_Birth__c)
    //         );
    //     }
    //     else if (recipientType == 'Participant' && sObjectType == New_Contact__c.SObjectType) {
    //         New_Contact__c contactRec = [
    //             SELECT Id,
    //                    Name,
    //                    Email__c,
    //                    Phone__c
    //             FROM New_Contact__c
    //             WHERE Id = :recordId
    //             LIMIT 1
    //         ];

    //         response.recordTypeName = 'New_Contact__c';
    //         response.fieldValues.put('FullName', contactRec.Name);
    //         response.fieldValues.put('Name', contactRec.Name);
    //         response.fieldValues.put('Email', contactRec.Email__c);
    //         response.fieldValues.put('ContactNumber', contactRec.Phone__c);
    //     }

    //     return response;
    // }


@AuraEnabled
public static Map<String, String> storePdfRecord(String pdfUrl, Id parentRecordId, Id orgId, String documentName, String recipientJson, String fingerprint) {
    try {

        TSign_Participant_Template__c childRecord = new TSign_Participant_Template__c();
        childRecord.TSign_Template__c = parentRecordId;
        childRecord.File_Name__c = documentName;
        childRecord.AWS_Document__c = pdfUrl;
        childRecord.TSign_Organisation__c = orgId;
        childRecord.Status__c = 'Created';
        childRecord.Recipient_JSON__c = recipientJson;
        childRecord.Fingerprint__c  = fingerprint;

        insert childRecord;

        System.debug(
            '✅ Child record created successfully: ' +
            childRecord.Id
        );

        return new Map<String, String>{

            'recordId' =>
                childRecord.Id,

            'pdfUrl' =>
                pdfUrl }; } catch (Exception e) { throw new AuraHandledException( 'Error storing PDF record: ' + e.getMessage()
        );
    }
}
@AuraEnabled
public static void deleteTemplate(Id templateId) {
    delete [SELECT Id FROM TSign_Participant_Template__c WHERE Id = :templateId LIMIT 1];
}

@AuraEnabled public static void saveCustomFieldConfig(Id orgId, String fieldConfig) {
    TSign_Organisation__c org = [
        SELECT Id,
        My_Templates_Custom_Fields_Config__c FROM TSign_Organisation__c WHERE Id = : orgId LIMIT 1
    ];
    List < Object > configs = new List<Object>();
    if (!String.isBlank(org.My_Templates_Custom_Fields_Config__c)) {
        configs = (List < Object >)JSON.deserializeUntyped(org.My_Templates_Custom_Fields_Config__c);
    }
    configs.add(JSON.deserializeUntyped(fieldConfig));
    org.My_Templates_Custom_Fields_Config__c = JSON.serializePretty(configs);
    update org;
}

@AuraEnabled public static void removeCustomFieldConfig(Id orgId, String label, String type) {
    TSign_Organisation__c org = [SELECT My_Templates_Custom_Fields_Config__c FROM TSign_Organisation__c WHERE Id = : orgId LIMIT 1];
    if (String.isBlank(org.My_Templates_Custom_Fields_Config__c)) {        return;
    }
    List < Object > configs = (List < Object >)JSON.deserializeUntyped(org.My_Templates_Custom_Fields_Config__c);
    List < Object > updated = new List<Object>();
    for (Object obj : configs) {
        Map < String,
        Object > field = (Map < String, Object >)obj;
        if (String.valueOf(field.get('label')) != label) {            updated.add(field);
        }
    }
    org.My_Templates_Custom_Fields_Config__c = JSON.serialize(updated);
    update org;
}

@AuraEnabled public static String getCustomFieldConfig(Id orgId) {
    return [SELECT My_Templates_Custom_Fields_Config__c FROM TSign_Organisation__c WHERE Id = : orgId LIMIT 1].My_Templates_Custom_Fields_Config__c;
}

@AuraEnabled
public static void saveTemplateShares(Id templateId, List<Id> staffIds) {

    if (templateId == null || staffIds == null) {        return;
    }

    Set<Id> selectedStaff = new Set<Id>(staffIds);

    Map<Id, TSign_Folder_Share__c> existingByStaff = new Map<Id, TSign_Folder_Share__c>();
    List<TSign_Folder_Share__c> toSave = new List<TSign_Folder_Share__c>();

    // ALL rows, active + inactive. NO Active__c filter here.
    for (TSign_Folder_Share__c fs : [
        SELECT Id, TSign_Staff__c, Active__c
        FROM TSign_Folder_Share__c
        WHERE TSign_Template__c = :templateId
        AND Type__c = 'Template'
        ORDER BY CreatedDate ASC
    ]) {
        if (existingByStaff.containsKey(fs.TSign_Staff__c)) { if (fs.Active__c) { fs.Active__c = false; toSave.add(fs);
            }
        } else {
            existingByStaff.put(fs.TSign_Staff__c, fs);
        }
    }

    // 1. Existing rows: active only if still selected
    for (Id staffId : existingByStaff.keySet()) {
        TSign_Folder_Share__c fs = existingByStaff.get(staffId);
        Boolean shouldBeActive = selectedStaff.contains(staffId);
        if (fs.Active__c != shouldBeActive) {
            fs.Active__c = shouldBeActive;
            toSave.add(fs);
        }
    }

    // 2. Staff with no row at all: insert
    for (Id staffId : selectedStaff) {
        if (!existingByStaff.containsKey(staffId)) {
            toSave.add(new TSign_Folder_Share__c(
                TSign_Template__c = templateId,
                TSign_Staff__c    = staffId,
                Type__c     = 'Template',
                Active__c   = true
            ));
        }
    }

    if (!toSave.isEmpty()) {
        try {
            upsert toSave; } catch (DmlException e) { throw new AuraHandledException(e.getDmlMessage(0));
        }
    }
}

@AuraEnabled(cacheable=true)
public static String getCurrentUserType() {

    User u = [
        SELECT Id, User_Type__c
        FROM User
        WHERE Id = :UserInfo.getUserId()
        LIMIT 1
    ];

    return u.User_Type__c;
}


@AuraEnabled public static String sendTemplateEmail(List < String > toEmails, List < String > ccEmails, String templateName, String documentUrl, String recipientName, Id orgId) {
    try {
        String organisationName = '';
        if (orgId != null) {
            TSign_Organisation__c org = [SELECT Name FROM TSign_Organisation__c WHERE Id = : orgId LIMIT 1];
            organisationName = org.Name;
        }
        String issuedDate = Date.today().format();
        String body = '<!DOCTYPE html>' + '<html>' + '<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">' + '<table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 15px;">' + '<tr>' + '<td align="center">' + '<table width="650" cellpadding="0" cellspacing="0" ' + 'style="background:#ffffff;border-radius:12px;overflow:hidden;' + 'box-shadow:0 4px 16px rgba(0,0,0,.08);">' +
        // Header
        '<tr>' + '<td style="background:#0099de;padding:28px;text-align:center;">' + '<div style="font-size:26px;color:white;font-weight:bold;">' + organisationName + '</div>' + '<div style="color:#dbeafe;margin-top:8px;font-size:14px;">' + 'Document Sharing Notification' + '</div>' + '</td>' + '</tr>' +
        // Content
        '<tr>' + '<td style="padding:40px;">' + '<p style="margin-top:0;font-size:16px;color:#16325c;">' + 'Hello ' + recipientName + ',' + '</p>' + '<p style="font-size:15px;color:#444;line-height:1.7;">' + 'A document has been created and securely shared with you.' + '</p>' +
        // Info Card
        '<div style="' + 'background:#f8fafc;' + 'border-left:4px solid #0176d3;' + 'padding:18px;' + 'border-radius:8px;' + 'margin:25px 0;">' + '<div style="margin-bottom:10px;">' + '<strong>Document:</strong><br>' + templateName + '</div>' + '<div>' + '<strong>Date Issued:</strong><br>' + issuedDate + '</div>' + '</div>' + '<div style="' + 'background:#fff8e6;' + 'padding:16px;' + 'border-radius:8px;' + 'color:#8a6d3b;' + 'font-size:14px;">' + '📎 The document has been included as an attachment. ' + 'Please review all contents carefully before proceeding.' + '</div>' + '<p style="' + 'margin-top:30px;' + 'font-size:15px;' + 'line-height:1.7;' + 'color:#444;">' + 'If you require assistance or additional information, ' + 'please contact ' + '<strong>' + organisationName + '</strong>.' + '</p>' + '<br>' + '<p style="font-size:15px;color:#444;">' + 'Kind regards,<br>' + '<strong>' + organisationName + '</strong>' + '</p>' + '</td>' + '</tr>' +
        // Footer
        '<tr>' + '<td style="' + 'background:#fafafa;' + 'padding:20px;' + 'text-align:center;' + 'font-size:12px;' + 'color:#888;">' + 'This is an automated notification. ' + 'Please do not reply directly to this email.' + '</td>' + '</tr>' + '</table>' + '</td>' + '</tr>' + '</table>' + '</body>' + '</html>';
        TSign_EmailRelayService.sendEmail('noreply@tesseractapps.com', toEmails, templateName + ' Has Been Shared With You', body, new List<String> {
            documentUrl
    }, ccEmails, null);
    return 'SUCCESS';
} catch (Exception ex) {
    return ex.getMessage();
}}

// Organisation name, logo, phone, email and address used to pre-fill header designs in tesseractappsCreateTemplate.
// The logo is a rich-text field, so its rtaImage URL is converted to base64 (same approach as
// InvoiceHandler) - the PDF renderer cannot load Salesforce session URLs. Any failure returns
// empty values so the header designs fall back to their sample placeholders.
@AuraEnabled
public static Map<String, String> getOrgBranding(Id orgId) {
    Map<String, String> branding = new Map<String, String>{
        'name' => '', 'logo' => '', 'phone' => '', 'email' => '', 'address' => ''
    };
    if (orgId == null) {        return branding;
    }
    try {
        List<TSign_Organisation__c> orgs = [
            SELECT Name, Organisation_Logo__c, Logo_URL__c, Phone__c, Email__c,
                  Address__Street__s,Address__City__s,Address__StateCode__s,
                  Address__PostalCode__s,Address__CountryCode__s
            FROM TSign_Organisation__c WHERE Id = :orgId LIMIT 1
        ];
        if (orgs.isEmpty()) {            return branding;
        }
        TSign_Organisation__c org = orgs[0];
        branding.put('name', org.Name == null ? '' : org.Name);
        branding.put('phone', org.Phone__c == null ? '' : org.Phone__c);
        branding.put('email', org.Email__c == null ? '' : org.Email__c);
        // "Street, City State Postcode, Country" - blank parts are skipped
        List<String> localityParts = new List<String>();
        for (String part : new List<String>{ org.Address__City__s, org.Address__StateCode__s, org.Address__PostalCode__s }) {
            if (String.isNotBlank(part)) {
                localityParts.add(part.trim());
            }
        }
        List<String> addressParts = new List<String>();
        for (String part : new List<String>{ org.Address__Street__s, String.join(localityParts, ' '), org.Address__CountryCode__s }) {
            if (String.isNotBlank(part)) {
                addressParts.add(part.trim());
            }
        }
        branding.put('address', String.join(addressParts, ', '));
        String logoHtml = org.Organisation_Logo__c;
        if (String.isBlank(logoHtml)) {
            // T-Sign stores the logo in S3 (Logo_URL__c) instead of the rich-text field
            if (String.isNotBlank(org.Logo_URL__c) && !Test.isRunningTest()) {
                try {
                    HttpRequest logoReq = new HttpRequest();
                    logoReq.setEndpoint(org.Logo_URL__c);
                    logoReq.setMethod('GET');
                    logoReq.setTimeout(20000);
                    HttpResponse logoRes = new Http().send(logoReq);
                    if (logoRes.getStatusCode() == 200) {
                        String mimeType = logoRes.getHeader('Content-Type');
                        if (String.isBlank(mimeType) || !mimeType.startsWith('image/')) {
                            mimeType = 'image/png';
                        }
                        branding.put('logo', 'data:' + mimeType + ';base64,' + EncodingUtil.base64Encode(logoRes.getBodyAsBlob()));
                    } else {
                        System.debug('getOrgBranding S3 logo status: ' + logoRes.getStatusCode());
                        branding.put('logo', org.Logo_URL__c);
                    }
                } catch (Exception logoEx) {
                    System.debug('getOrgBranding S3 logo failed: ' + logoEx.getMessage());
                    branding.put('logo', org.Logo_URL__c);
                }
            }
            return branding;
        }
        Matcher imgMatcher = Pattern.compile('<img(.+?)>').matcher(logoHtml);
        if (imgMatcher.find()) {
            String imageUrl = imgMatcher.group().substringBetween(' src="', '"');
            if (String.isNotBlank(imageUrl) && !Test.isRunningTest()) { Blob imageBlob = new PageReference(imageUrl.unescapeHtml4()).getContent(); branding.put('logo', 'data:image/png;base64,' + EncodingUtil.base64Encode(imageBlob)); } } } catch (Exception e) {
        System.debug('getOrgBranding failed: ' + e.getMessage());
    }
    return branding;
}


// Organisation Name for the "Company Name" demographic placeholder in tesserappsDocumentEditor.
// Returns '' when unavailable so the placeholder falls back to manual entry.
@AuraEnabled
public static String getOrganisationName(Id orgId) {
    if (orgId == null) {        return '';
    }
    List<TSign_Organisation__c> orgs = [SELECT Name FROM TSign_Organisation__c WHERE Id = :orgId LIMIT 1];
    return orgs.isEmpty() || orgs[0].Name == null ? '' : orgs[0].Name;
}

@AuraEnabled(cacheable = true)
public static List<TSign_Facility__c> fetchFacilitiess() {

    User objUser = [
        SELECT Id, Phone, Organization_Name__c
        FROM User
        WHERE Id = :UserInfo.getUserId()
    ];

    List<TSign_Facility__c> lstFacility = [
        SELECT Id, Name, Active__c, Address__c, Email__c, TSign_Organisation__c
        FROM TSign_Facility__c
        WHERE TSign_Organisation__r.Name = :objUser.Organization_Name__c
        AND Active__c = TRUE
        ORDER BY Name ASC
    ];

    return lstFacility;
}

@AuraEnabled
public static TSign_Organisation__c orgDetails() {
    try {
        User objUser = [
            SELECT Id, Phone, Organization_Name__c, TSign_Org_Id__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
        ];

        TSign_Organisation__c orgNames = [
            SELECT Id, Name, Account_Type__c, Active__c, Address__c, Email__c, Legal_Name__c,
                   Organisation_Logo__c, My_Templates_Custom_Fields_Config__c,
                   Document_Types__c, Address_Latest__c
            FROM TSign_Organisation__c
            WHERE Id = :objUser.TSign_Org_Id__c LIMIT 1 ];        return orgNames;
    } catch (Exception e) {
        return null;
    }
}
}