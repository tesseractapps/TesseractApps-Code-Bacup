public class myTemplates {

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
        String status
    ) {
        Template__c template;

        if (templateId != null) {
            // ✅ EDIT — load existing record and update it
            template = [
                SELECT Id
                FROM Template__c
                WHERE Id = :templateId
                LIMIT 1
            ];
        } else {
            // ✅ NEW — create fresh record
            template = new Template__c();
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

        upsert template;
        return template.Id;
    }

    /*
    @AuraEnabled(cacheable=true)
    public static List<Template__c> getAllTemplates(Id orgId) {
        return [
            SELECT Id, Name, CreatedDate, LastModifiedDate,
                   File_Name__c, Amazon_Url__c, Placeholder_JSON__c,
                   Organisation_Id__c, Key__c, Status__c,
                   Template_Name__c, Description__c, Template_Type__c
            FROM Template__c
            WHERE Organisation_Id__c = :orgId
            ORDER BY CreatedDate DESC
        ];
    }
        */

    @AuraEnabled(cacheable=true)
    public static List<Template__c> getAllTemplates(Id orgId) {

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

                FROM Template__c

                WHERE Organisation_Id__c = :orgId
                AND Status__c != 'Archive'

                ORDER BY CreatedDate DESC
            ];
        }


        Set<Id> sharedTemplateIds = new Set<Id>();

        for (Folder_Share__c fs : [

            SELECT Template__c

            FROM Folder_Share__c

            WHERE Staff__r.Email_Address__c =: UserInfo.getUserEmail()

            AND Type__c = 'Template']) {

            sharedTemplateIds.add(fs.Template__c);
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

            FROM Template__c

            WHERE Organisation_Id__c = :orgId
             AND Status__c != 'Archive'

            AND (
                CreatedById = :UserInfo.getUserId()
                OR Id IN :sharedTemplateIds
            )

            ORDER BY CreatedDate DESC
        ];
    }

@AuraEnabled
public static List<Template__c> getArchivedTemplates(Id orgId) {

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
        currentUser.User_Type__c == 'NDIS Org Admin' ||
        currentUser.User_Type__c == 'Facility Admin'
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

            FROM Template__c

            WHERE
                Organisation_Id__c = :orgId
                AND Status__c = 'Archive'

            ORDER BY CreatedDate DESC
        ];
    }


    Set<Id> sharedTemplateIds = new Set<Id>();

    for (
        Folder_Share__c fs :

        [

            SELECT
                Template__c

            FROM Folder_Share__c

            WHERE
                Staff__r.Email_Address__c =
                    :UserInfo.getUserEmail()

                AND Type__c = 'Template'
        ]
    ) {

        sharedTemplateIds.add(
            fs.Template__c
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

        FROM Template__c

        WHERE
            Organisation_Id__c = :orgId

            AND Status__c = 'Archive'

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
public static List<Map<String, Object>> getSavedTemplates(Id orgId) {
    try {
        if (orgId == null) {
            return new List<Map<String, Object>>();
        }
        List < Participant_Template__c > templates = [
            SELECT Id,
            File_Name__c,
            AWS_Document__c,
            Organization__c,
            Status__c,
            CreatedDate,
            CreatedBy.Full_Name__c,
            Template__c,
            Template__r.Template_Name__c,
            Recipient_JSON__c FROM Participant_Template__c WHERE Organization__c = : orgId AND Template__c != null ORDER BY CreatedDate DESC
        ];
        Set < Id > participantIds = new Set<Id>();
        Map < Id,
        String > primaryRecipientEmailMap = new Map<Id, String>();
        for (Participant_Template__c rec : templates) {
            participantIds.add(rec.Id);
            if (!String.isBlank(rec.Recipient_JSON__c)) {
                try {
                    Map < String,
                    Object > jsonMap = (Map < String, Object >)
                    JSON.deserializeUntyped(rec.Recipient_JSON__c);
                    String email = (String)jsonMap.get('Email');
                    if (!String.isBlank(email)) {
                        primaryRecipientEmailMap.put(rec.Id, email.trim().toLowerCase());
                    }
                } catch (Exception ex) {}
            }
        }
        Map < Id,
        String > statusMap = new Map<Id, String>();
        Map < Id,
        Id > participantOfferMap = new Map<Id, Id>();
        Map < Id,
        String > additionalRecipientsMap = new Map<Id, String>();
        for (Offer_Template__c rec : [
            SELECT Id,
            Participant_Template__c,
            Current_Recipient_Status__c,
            Current_Recipient__c,
            All_Recipients__c FROM Offer_Template__c WHERE Participant_Template__c IN : participantIds ORDER BY CreatedDate DESC
        ]) {
            if (statusMap.containsKey(rec.Participant_Template__c)) {
                continue;
            }
            List < String > allEmails = new List<String>();
            if (!String.isBlank(rec.All_Recipients__c)) {
                allEmails = rec.All_Recipients__c.split('\n');
            }
            String status = 'Created';
            String currentRecipient = rec.Current_Recipient__c;
            String currentStatus = rec.Current_Recipient_Status__c;
            if (String.isBlank(rec.All_Recipients__c) && String.isBlank(currentRecipient) && String.isBlank(currentStatus)) {
                status = 'Created';
            } else if (currentStatus == 'Completed') {
                status = 'Completed';
                participantOfferMap.put(rec.Participant_Template__c, rec.Id);
            } else {
                Integer index = -1;
                for (Integer i = 0; i < allEmails.size(); i ++) {
                    if (currentRecipient != null && allEmails[i].trim().toLowerCase() == currentRecipient.trim().toLowerCase()) {
                        index = i;
                        break;
                    }
                }
                String recipientDisplay = currentRecipient;
                if (!String.isBlank(recipientDisplay) && recipientDisplay.contains('@')) {
                    recipientDisplay = recipientDisplay
                        .substringBefore('@')
                        .replace('-', ' ')
                        .replace('_', ' ')
                        .replace('.', ' ');
                    while (recipientDisplay.indexOf('  ') >= 0) {
                        recipientDisplay = recipientDisplay.replace('  ', ' ');
                    }
                }
                if (index == 0) {
                    status = recipientDisplay + ' - Pending';
                } else {
                    status = recipientDisplay + ' - ' + (
                        String.isBlank(currentStatus)
                            ? 'Pending'
                            : currentStatus
                    );
                }
            }
            statusMap.put(rec.Participant_Template__c, status);
            List < String > names = new List<String>();
            String primaryEmail = primaryRecipientEmailMap.get(rec.Participant_Template__c);
            for (String email : allEmails) {
                email = email.trim();
                if (String.isBlank(email)) {
                    continue;
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
                while (name.indexOf('  ') >= 0) {
                    name = name.replace('  ', ' ');
                }
                names.add(name.trim());
            }
            additionalRecipientsMap.put(
                rec.Participant_Template__c,
                names.isEmpty()
                    ? '-'
                    : String.join(names, ', ')
            );
        }
        Map < Id,
        String > signedUrlMap = new Map<Id, String>();
        if (!participantOfferMap.isEmpty()) {
            for (Child_Signatures__c rec : [SELECT Offer_Template__c, Signature_URL__c FROM Child_Signatures__c WHERE Offer_Template__c IN : participantOfferMap.values()ORDER BY CreatedDate DESC]) {
                if (!signedUrlMap.containsKey(rec.Offer_Template__c)) {
                    signedUrlMap.put(rec.Offer_Template__c, rec.Signature_URL__c);
                }
            }
        }
        List < Map < String,
        Object >> result = new List<Map<String, Object>>();
        for (Participant_Template__c rec : templates) {
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
                    jsonMap.get('Email');
                } catch (Exception ex) {}
            }
            String finalUrl = rec.AWS_Document__c;
            if ('Completed' == statusMap.get(rec.Id)) {
                Id offerId = participantOfferMap.get(rec.Id);
                if (offerId != null && signedUrlMap.containsKey(offerId)) {
                    finalUrl = signedUrlMap.get(offerId);
                }
            }
            result.add(new Map<String, Object> {
                'Id' => rec.Id,
                'File_Name__c' => rec.File_Name__c,
                'AWS_Document__c' => finalUrl,
                'Organization__c' => rec.Organization__c,
                'Status__c' => statusMap.containsKey(rec.Id)
                    ? statusMap.get(rec.Id)
                    : 'Created',
                'CreatedDate' => rec.CreatedDate,
                'Template__c' => rec.Template__c,
                'Template_Name__c' => rec.Template__r != null
                    ? rec.Template__r.Template_Name__c
                    : '',
                'RecipientName' => fullName,
                'ClientEmail' => clientEmail,
                'CreatedBy' => rec.CreatedBy != null? rec.CreatedBy.Full_Name__c: '',
                'AdditionalRecipients' => additionalRecipientsMap.containsKey(rec.Id)
                    ? additionalRecipientsMap.get(rec.Id)
                    : '-'
                });
        }
        return result;
    } catch (Exception e) {
        throw new AuraHandledException('Error fetching templates: ' + e.getMessage());
    }
}







    @AuraEnabled(cacheable=true)
            public static Template__c fetchTemplateData(Id templateId) {
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
                    FROM Template__c
                    WHERE Id = :templateId
                    LIMIT 1
                ];
            }

@AuraEnabled
    public static void updateTemplateStatus(Id templateId, String actionType) {
        try {
            if (templateId == null) {
                throw new AuraHandledException('Template Id is required.');
            }

            if (String.isBlank(actionType)) {
                throw new AuraHandledException('Action type is required.');
            }

            Template__c templateRec = [
                SELECT Id, Status__c
                FROM Template__c
                WHERE Id = :templateId
                LIMIT 1
            ];

            String normalizedAction = actionType.trim().toUpperCase();

            if (normalizedAction == 'ARCHIVE') {
                templateRec.Status__c = 'Archive';
            } else if (normalizedAction == 'UNARCHIVE') {
                templateRec.Status__c = 'Draft';
            } else {
                throw new AuraHandledException('Invalid action type. Use ARCHIVE or UNARCHIVE.');
            }

            update templateRec;

        } catch (AuraHandledException e) {
            throw e;
        } catch (Exception e) {
            throw new AuraHandledException('Unable to update template status: ' + e.getMessage());
        }
    }

@AuraEnabled
public static List<Staff__c> getStaffByFacilities(List<String> facIdlist) {
    if (facIdlist == null || facIdlist.isEmpty()) {
        return new List<Staff__c>();
    }

    return [
        SELECT Id, NameToDisplay__c
        FROM Staff__c
        WHERE Status__c = true
        AND Id IN (
            SELECT Staff__c
            FROM Staff_Facility__c
            WHERE Active__c = true
            AND Facility__c IN :facIdlist
        )
        ORDER BY NameToDisplay__c ASC
    ];
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

    @AuraEnabled
    public static List<RecipientOption> getParticipantAndContactOptions(Id orgId) {
        List<RecipientOption> options = new List<RecipientOption>();

        if (orgId == null) {
            return options;
        }

        for (Client__c participant : [
            SELECT Id, Name, Email__c
            FROM Client__c
            WHERE Status__c = true
            AND Email__c != null
            AND Id IN (
                SELECT Participant__c
                FROM Participant_Facility__c
                WHERE Active__c = true
                AND Facility__r.Organisation__c = :orgId
            )
            ORDER BY Name ASC
        ]) {
            RecipientOption opt = new RecipientOption();
            opt.label = participant.Name;
            opt.value = participant.Id;
            opt.type = 'Participant';
            opt.email = participant.Email__c;
            options.add(opt);
        }

        for (New_Contact__c contact : [
            SELECT Id, Name, Email__c
            FROM New_Contact__c
            WHERE Organization__c = :orgId
            AND Email__c != null
            ORDER BY Name ASC
        ]) {
            RecipientOption opt = new RecipientOption();
            opt.label = contact.Name;
            opt.value = contact.Id;
            opt.type = 'Contact';
            opt.email = contact.Email__c;
            options.add(opt);
        }

        return options;
    }



    @AuraEnabled
    public static RecipientDetails getRecipientDetailsByEmail(String email, Id orgId) {
        if (String.isBlank(email) || orgId == null) {
            throw new AuraHandledException('Email and Organization Id are required.');
        }

        List<Client__c> participants = [
            SELECT Id, Name, Email__c
            FROM Client__c
            WHERE Status__c = true
            AND Email__c = :email
            AND Id IN (
                SELECT Participant__c
                FROM Participant_Facility__c
                WHERE Active__c = true
                AND Facility__r.Organisation__c = :orgId
            )
            LIMIT 1
        ];

        if (!participants.isEmpty()) {
            RecipientDetails details = new RecipientDetails();
            details.recordId = participants[0].Id;
            details.name = participants[0].Name;
            details.email = participants[0].Email__c;
            details.type = 'Participant';
            return details;
        }

        List<New_Contact__c> contacts = [
            SELECT Id, Name, Email__c
            FROM New_Contact__c
            WHERE Organization__c = :orgId
            AND Email__c = :email
            LIMIT 1
        ];

        if (!contacts.isEmpty()) {
            RecipientDetails details = new RecipientDetails();
            details.recordId = contacts[0].Id;
            details.name = contacts[0].Name;
            details.email = contacts[0].Email__c;
            details.type = 'Contact';
            return details;
        }

        throw new AuraHandledException('No recipient found for the selected email.');
    }


    public class DemographicResponse {
        @AuraEnabled public String recordTypeName;
        @AuraEnabled public Id recordId;
        @AuraEnabled public Map<String, String> fieldValues;
    }

    @AuraEnabled
    public static DemographicResponse getRecipientDemographicDetails(String sendDocumentFormJson) {
        DemographicResponse response = new DemographicResponse();
        response.fieldValues = new Map<String, String>();

        if (String.isBlank(sendDocumentFormJson)) {
            return response;
        }

        Map<String, Object> formMap =
            (Map<String, Object>) JSON.deserializeUntyped(sendDocumentFormJson);

        String recipientType = (String) formMap.get('recipientType');
        String contactIdStr   = (String) formMap.get('contactId');

        if (String.isBlank(recipientType) || String.isBlank(contactIdStr)) {
            return response;
        }

        Id recordId = (Id) contactIdStr;
        response.recordId = recordId;

        if (recipientType != 'Staff' && recipientType != 'Participant') {
            return response;
        }

        Schema.SObjectType sObjectType = recordId.getSObjectType();

        if (recipientType == 'Staff' && sObjectType == Staff__c.SObjectType) {
            Staff__c staff = [
                SELECT Id,
                        Name,
                        Last_Name__c,
                       NameToDisplay__c,
                       Date_Of_Birth__c,
                       AddressData__c,
                       Email_Address__c,
                       Contact_Number__c
                FROM Staff__c
                WHERE Id = :recordId
                LIMIT 1
            ];

            response.recordTypeName = 'Staff';
            response.fieldValues.put('FullName', staff.NameToDisplay__c);
            response.fieldValues.put('Name', staff.NameToDisplay__c);
            response.fieldValues.put('FirstName', staff.Name);
            response.fieldValues.put('LastName', staff.Last_Name__c);
            response.fieldValues.put('Email', staff.Email_Address__c);
            response.fieldValues.put('ContactNumber', staff.Contact_Number__c);
            response.fieldValues.put('Address', staff.AddressData__c);
            response.fieldValues.put(
                'DateOfBirth',
                staff.Date_Of_Birth__c == null ? null : String.valueOf(staff.Date_Of_Birth__c)
            );
        }
        else if (recipientType == 'Participant' && sObjectType == Client__c.SObjectType) {
            Client__c clientRec = [
                SELECT Id,
                       Name__c,
                        First_Name__c,
                        Last_Name__c,
                       Email__c,
                       AddressData__c,
                       Date_Of_Birth__c,
                       Contact_Number__c
                FROM Client__c
                WHERE Id = :recordId
                LIMIT 1
            ];

            response.recordTypeName = 'Client__c';
            response.fieldValues.put('FullName', clientRec.Name__c);
            response.fieldValues.put('Name', clientRec.Name__c);
            response.fieldValues.put('FirstName', clientRec.First_Name__c);
            response.fieldValues.put('LastName', clientRec.Last_Name__c);
            response.fieldValues.put('Email', clientRec.Email__c);
            response.fieldValues.put('ContactNumber', clientRec.Contact_Number__c);
            response.fieldValues.put('Address', clientRec.AddressData__c);
            response.fieldValues.put(
                'DateOfBirth',
                clientRec.Date_Of_Birth__c == null ? null : String.valueOf(clientRec.Date_Of_Birth__c)
            );
        }
        else if (recipientType == 'Participant' && sObjectType == New_Contact__c.SObjectType) {
            New_Contact__c contactRec = [
                SELECT Id,
                       Name,
                       Email__c,
                       Phone__c
                FROM New_Contact__c
                WHERE Id = :recordId
                LIMIT 1
            ];

            response.recordTypeName = 'New_Contact__c';
            response.fieldValues.put('FullName', contactRec.Name);
            response.fieldValues.put('Name', contactRec.Name);
            response.fieldValues.put('Email', contactRec.Email__c);
            response.fieldValues.put('ContactNumber', contactRec.Phone__c);
        }

        return response;
    }


@AuraEnabled
public static Map<String, String> storePdfRecord(String pdfUrl, Id parentRecordId, Id orgId, String documentName, String recipientJson, String fingerprint) {
    try {

        Participant_Template__c childRecord = new Participant_Template__c();
        childRecord.Template__c = parentRecordId;
        childRecord.File_Name__c = documentName;
        childRecord.AWS_Document__c = pdfUrl;
        childRecord.Organization__c = orgId;
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
                pdfUrl
        };

    } catch (Exception e) {

        throw new AuraHandledException(
            'Error storing PDF record: ' +
            e.getMessage()
        );
    }
}
@AuraEnabled
public static void deleteTemplate(Id templateId) {
    delete [SELECT Id FROM Participant_Template__c WHERE Id = :templateId LIMIT 1];
}

@AuraEnabled public static void saveCustomFieldConfig(Id orgId, String fieldConfig) {
    Organisation__c org = [
        SELECT Id,
        My_Templates_Custom_Fields_Config__c FROM Organisation__c WHERE Id = : orgId LIMIT 1
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
    Organisation__c org = [SELECT My_Templates_Custom_Fields_Config__c FROM Organisation__c WHERE Id = : orgId LIMIT 1];
    if (String.isBlank(org.My_Templates_Custom_Fields_Config__c)) {
        return;
    }
    List < Object > configs = (List < Object >)JSON.deserializeUntyped(org.My_Templates_Custom_Fields_Config__c);
    List < Object > updated = new List<Object>();
    for (Object obj : configs) {
        Map < String,
        Object > field = (Map < String, Object >)obj;
        if (String.valueOf(field.get('label')) != label) {
            updated.add(field);
        }
    }
    org.My_Templates_Custom_Fields_Config__c = JSON.serialize(updated);
    update org;
}

@AuraEnabled public static String getCustomFieldConfig(Id orgId) {
    return [SELECT My_Templates_Custom_Fields_Config__c FROM Organisation__c WHERE Id = : orgId LIMIT 1].My_Templates_Custom_Fields_Config__c;
}

@AuraEnabled
public static void saveTemplateShares(
    Id templateId,
    List<Id> staffIds
) {

    if (templateId == null || staffIds == null) {
        return;
    }

    List<Folder_Share__c> inserts =
        new List<Folder_Share__c>();

    /*
        Remove old shares first
    */

    List<Folder_Share__c> existingShares = [

        SELECT Id

        FROM Folder_Share__c

        WHERE Template__c = :templateId
        AND Type__c = 'Template'
    ];

    if (!existingShares.isEmpty()) {
        delete existingShares;
    }

    /*
        Insert new shares
    */

    for (Id staffId : staffIds) {

        Folder_Share__c fs =
            new Folder_Share__c();

        fs.Template__c = templateId;

        fs.Staff__c = staffId;

        fs.Type__c = 'Template';

        inserts.add(fs);
    }

    if (!inserts.isEmpty()) {
        insert inserts;
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
            Organisation__c org = [SELECT Name FROM Organisation__c WHERE Id = : orgId LIMIT 1];
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
        EmailRelayService.sendEmail('noreply@tesseractapps.com', toEmails, templateName + ' Has Been Shared With You', body, new List<String> {
            documentUrl
    }, ccEmails, null);
    return 'SUCCESS';
} catch (Exception ex) {
    throw new AuraHandledException(ex.getMessage());
}}



}