public without sharing class FormController {
    @AuraEnabled
public static void saveForm(String formName, String formJson, String formType, String orgId) {
    Dynamic_Form__c form = new Dynamic_Form__c();
    form.Name__c = formName;
    form.Form_JSON__c = formJson;
    form.Form_Type__c = formType;
    form.Org_Id__c = orgId; // ✅ Save Org ID into the custom field

    insert form;
}



    @AuraEnabled(cacheable=true)
public static List<Dynamic_Form__c> getForms() {
    return [
        SELECT Id, Name__c, Form_JSON__c, Form_Type__c
        FROM Dynamic_Form__c
        WHERE Form_Type__c != 'Incident Register'
        ORDER BY CreatedDate DESC
    ];
}

    @AuraEnabled(cacheable=true)
    public static List<Dynamic_Form__c> getFormsByClient(Id clientId) {
        try {
            // ✅ If no clientId is provided, return all forms
            if (String.isEmpty(clientId)) {
                return getForms();
            }

            // ✅ Retrieve client record to get accessible form IDs
            Client__c client = [SELECT Accessible_Forms__c FROM Client__c WHERE Id = :clientId LIMIT 1];

            if (String.isEmpty(client.Accessible_Forms__c)) {
                return new List<Dynamic_Form__c>(); // No forms assigned
            }

            // ✅ Convert newline-separated form IDs into a List
            List<String> formIds = client.Accessible_Forms__c.split('\n');
            System.debug('🔹 Forms Available for Client (' + clientId + '): ' + formIds);

            // ✅ Query only the forms that match the accessible form IDs
            return [SELECT Id, Name__c, Form_JSON__c, Form_Type__c 
                    FROM Dynamic_Form__c 
                    WHERE Id IN :formIds 
                    ORDER BY CreatedDate DESC];

        } catch (Exception e) {
            System.debug('❌ Error fetching forms for client: ' + e.getMessage());
            throw new AuraHandledException('Error retrieving forms: ' + e.getMessage());
        }
    }

@AuraEnabled
public static void saveFormResponse(Id formId, String responseJson, String orgId, String clientId, String formName, String formType) {
    // ✅ Fetch participant name from Client__c
    String participantName = '';
    if (String.isNotBlank(clientId)) {
        Client__c clientRecord = [
            SELECT Name 
            FROM Client__c 
            WHERE Id = :clientId 
            LIMIT 1
        ];
        participantName = clientRecord != null ? clientRecord.Name : '';
    }

    // ✅ Create and save the response
    Dynamic_Form_Response__c response = new Dynamic_Form_Response__c();
    response.Form_Reference__c = formId;
    response.Response_JSON__c = responseJson;
    response.Org_Id__c = orgId;
    response.Client_Id__c = clientId;
    response.Name__c = formName;
    response.Form_Type__c = formType;
    response.Participant_Name__c = participantName;

    insert response;
}



    
    /**
 * ✅ Fetch all Form Responses (No filtering by Client)
 */
@AuraEnabled(cacheable=true)
public static List<Dynamic_Form_Response__c> getFormResponses() {
    try {
        return [
            SELECT Id, Name__c, Form_Type__c, Response_JSON__c, CreatedDate, Client_Id__c, Participant_Name__c
            FROM Dynamic_Form_Response__c
            ORDER BY CreatedDate DESC
        ];
    } catch (Exception e) {
        throw new AuraHandledException('Error retrieving all form responses: ' + e.getMessage());
    }
}

/**
 * ✅ Fetch Form Responses for a Specific Client
 */
@AuraEnabled(cacheable=true)
public static List<Dynamic_Form_Response__c> getFormResponsesByClient(Id clientId) {
    try {
        if (clientId == null) {
            throw new AuraHandledException('Client ID cannot be null.');
        }

        return [
            SELECT Id, Name__c, Form_Type__c, Response_JSON__c, CreatedDate, Client_Id__c,Participant_Name__c
            FROM Dynamic_Form_Response__c
            WHERE Client_Id__c = :clientId
            ORDER BY CreatedDate DESC
        ];
    } catch (Exception e) {
        throw new AuraHandledException('Error retrieving form responses: ' + e.getMessage());
    }
}


@AuraEnabled
public static void updateFormResponse(Id responseId, String responseJson) {
    try {
        // Fetch the existing form response record
        Dynamic_Form_Response__c existingResponse = [
            SELECT Id, Response_JSON__c 
            FROM Dynamic_Form_Response__c 
            WHERE Id = :responseId 
            LIMIT 1
        ];

        // Update the JSON field with the new data
        existingResponse.Response_JSON__c = responseJson;
        update existingResponse;

    } catch (Exception e) {
        throw new AuraHandledException('Error updating form response: ' + e.getMessage());
    }
}
@AuraEnabled
public static void deleteFormResponse(Id responseId) {
    try {
        // Check if the record exists
        Dynamic_Form_Response__c response = [
            SELECT Id FROM Dynamic_Form_Response__c WHERE Id = :responseId LIMIT 1
        ];
        
        // Delete the record
        delete response;
    } catch (Exception e) {
        throw new AuraHandledException('Error deleting form response: ' + e.getMessage());
    }
}

    /**
     * ✅ Fetch all Participants (Clients) 
     */
    /*@AuraEnabled(cacheable=true)
    public static List<Client__c> getParticipants() {
        try {
            return [
                SELECT Id, Name, Picture__c, Participant_Status__c, Accessible_Forms__c
                FROM Client__c
                ORDER BY Name
            ];
        } catch (Exception e) {
            System.debug('❌ Error fetching participants: ' + e.getMessage());
            throw new AuraHandledException('Error retrieving participants: ' + e.getMessage());
        }
    }*/
   
    @AuraEnabled(cacheable=true)
public static List<Map<String, Object>> getParticipants(String facilityId) {
    try {
        // 🔹 Filter participants by their own assigned Facility__c
        List<Client__c> clients = [
            SELECT Id, Name, Participant_Status__c, Accessible_Forms__c, Facility__c, Facility__r.Name,
                (SELECT Id, Staff__r.Id, Staff__r.Name, Staff__r.Picture__c, Staff__r.Email_Address__c, Staff__r.Facility__c, Staff__r.Facility__r.Name 
                 FROM Participant_Staff_Associations__r)
            FROM Client__c
            WHERE Facility__c = :facilityId
            ORDER BY Name
        ];

        List<Map<String, Object>> output = new List<Map<String, Object>>();

        for (Client__c client : clients) {
            Boolean hasMatchingFacility = false;
            List<Map<String, String>> staffList = new List<Map<String, String>>();

            // 🔹 Loop over associated staff and filter by staff's Facility__c
            if (client.Participant_Staff_Associations__r != null) {
                for (Participant_Staff_Association__c assoc : client.Participant_Staff_Associations__r) {
                    if (assoc.Staff__r != null) {
                        if (assoc.Staff__r.Facility__c == facilityId) {
                            hasMatchingFacility = true;

                            Map<String, String> staffMap = new Map<String, String>();
                            staffMap.put('name', assoc.Staff__r.Name);
                            staffMap.put('pictureUrl', assoc.Staff__r.Picture__c);
                            staffMap.put('email', assoc.Staff__r.Email_Address__c);
                            staffList.add(staffMap);
                        }
                    }
                }
            }

            // 🔹 Always include the participant
            Map<String, Object> clientMap = new Map<String, Object>();
            clientMap.put('Id', client.Id);
            clientMap.put('Name', client.Name);
            clientMap.put('Participant_Status__c', client.Participant_Status__c);
            clientMap.put('Accessible_Forms__c', client.Accessible_Forms__c);
            clientMap.put('Facility__c', client.Facility__c);
            clientMap.put('Facility_Name', client.Facility__r != null ? client.Facility__r.Name : null);
            clientMap.put('staffMembers', staffList);
            clientMap.put('hasMatchingFacilityStaff', hasMatchingFacility);
            output.add(clientMap);
        }

        return output;
    } catch (Exception e) {
        throw new AuraHandledException('Error retrieving participants: ' + e.getMessage());
    }
}





    /**
     * ✅ Fetch all Available Forms (Published Forms)
     */
    @AuraEnabled(cacheable=true)
public static List<Dynamic_Form__c> getAvailableForms() {
    try {
        return [
            SELECT Id, Name__c, DefaultIncident__c
            FROM Dynamic_Form__c
            WHERE Form_Type__c != 'Incident Register'
            ORDER BY CreatedDate DESC
        ];
    } catch (Exception e) {
        System.debug('❌ Error fetching forms: ' + e.getMessage());
        throw new AuraHandledException('Error retrieving forms: ' + e.getMessage());
    }
}

    /**
     * ✅ Fetch Accessible Forms for a Specific Participant
     */
    @AuraEnabled(cacheable=true)
public static List<Dynamic_Form__c> getAccessibleForms(Id participantId) {
    try {
        Client__c participant = [
            SELECT Accessible_Forms__c FROM Client__c WHERE Id = :participantId LIMIT 1
        ];

        if (String.isEmpty(participant.Accessible_Forms__c)) {
            return new List<Dynamic_Form__c>(); // No forms assigned
        }

        // Split newline-separated form IDs
        List<String> formIds = participant.Accessible_Forms__c.split('\n');

        // Query full form records including Form_JSON__c
        List<Dynamic_Form__c> forms = [
            SELECT Id, Name__c, Form_Type__c, Form_JSON__c
            FROM Dynamic_Form__c
            WHERE Id IN :formIds
        ];

        System.debug('🔹 Accessible Form Records: ' + forms);
        return forms;

    } catch (Exception e) {
        System.debug('❌ Error fetching accessible form records: ' + e.getMessage());
        throw new AuraHandledException('Error retrieving form records: ' + e.getMessage());
    }
}



    @AuraEnabled(cacheable=true)
    public static List<Dynamic_Form__c> getParticipantForms(Id participantId) {
        try {
            if (participantId == null) {
                throw new AuraHandledException('Participant ID is required.');
            }

            Client__c participant = [
                SELECT Accessible_Forms__c FROM Client__c WHERE Id = :participantId LIMIT 1
            ];

            if (String.isEmpty(participant.Accessible_Forms__c)) {
                return new List<Dynamic_Form__c>(); // Return empty list if no forms assigned
            }

            List<String> formIds = participant.Accessible_Forms__c.split('\n');

            return [
                SELECT Id, Name__c 
                FROM Dynamic_Form__c 
                WHERE Id IN :formIds
            ];

        } catch (Exception e) {
            System.debug('Error fetching participant forms: ' + e.getMessage());
            throw new AuraHandledException('Error retrieving participant forms: ' + e.getMessage());
        }
    }

    
@AuraEnabled
public static void grantAccessToParticipants(List<Id> participantIds, String formId) {
    System.debug('🔹 Entering grantAccessToParticipants() with Form ID: ' + formId);

    if (String.isBlank(formId)) {
        throw new AuraHandledException('Form ID cannot be blank.');
    }

    if (participantIds == null || participantIds.isEmpty()) {
        throw new AuraHandledException('No participant IDs provided.');
    }

    // Fetch all relevant participants in one query
    List<Client__c> participants = [
        SELECT Id, Accessible_Forms__c
        FROM Client__c
        WHERE Id IN :participantIds
    ];

    for (Client__c participant : participants) {
        Set<String> existingFormIds = new Set<String>();

        if (String.isNotBlank(participant.Accessible_Forms__c)) {
            existingFormIds.addAll(participant.Accessible_Forms__c.split('\n'));
        }

        existingFormIds.add(formId); // ✅ Add new form

        participant.Accessible_Forms__c = String.join(new List<String>(existingFormIds), '\n');
    }

    update participants;

    System.debug('✅ Successfully granted access to participants.');
}


    
public class FileUploadResponse {
    @AuraEnabled public String downloadUrl;
    @AuraEnabled public String previewUrl;
}

@AuraEnabled
public static FileUploadResponse uploadFileToSalesforce(String base64Data, String fileName, String contentType) {
    ContentVersion cv = new ContentVersion();
    cv.VersionData = EncodingUtil.base64Decode(base64Data);
    cv.Title = fileName;
    cv.PathOnClient = '/' + fileName;
    insert cv;

    ContentVersion insertedCV = [
        SELECT Id, ContentDocumentId 
        FROM ContentVersion 
        WHERE Id = :cv.Id 
        LIMIT 1
    ];

    FileUploadResponse response = new FileUploadResponse();

    // 🔹 Relative paths for both download and preview
    response.downloadUrl = '/sfc/servlet.shepherd/document/download/' + insertedCV.ContentDocumentId;
    response.previewUrl = '/sfc/servlet.shepherd/version/renditionDownload?rendition=ORIGINAL_JPG&versionId=' + insertedCV.Id;

    return response;
}
    
    @AuraEnabled(cacheable=true)
public static String getStaffEmailByName(String nameValue) {
    Staff__c staff = [
        SELECT Id, Name, Email_Address__c 
        FROM Staff__c 
        WHERE Name = :nameValue 
        LIMIT 1
    ];
    return staff.Email_Address__c;
}

@AuraEnabled(cacheable=true)
public static String getFacilityByUserEmail(String userEmail) {
    Staff__c staff = [
        SELECT Id, Email_Address__c, Facility__c 
        FROM Staff__c 
        WHERE Email_Address__c = :userEmail 
        LIMIT 1
    ];
    return staff.Facility__c;
}

@AuraEnabled
public static void sendFormDetailsToStaff(String emailAddress, String formDataHtml) {
    try {
        if (String.isNotBlank(emailAddress)) {
            // Fetch Org-Wide Email
            List<OrgWideEmailAddress> orgWideEmailList = [
                SELECT Id, Address 
                FROM OrgWideEmailAddress 
                WHERE Address = :System.Label.OrgWideEmailAddress 
                LIMIT 1
            ];

            if (orgWideEmailList.isEmpty()) {
                System.debug('❌ No OrgWideEmailAddress found for label: ' + System.Label.OrgWideEmailAddress);
                throw new AuraHandledException('Org-Wide Email Address not configured or verified.');
            }

            OrgWideEmailAddress orgWideEmail = orgWideEmailList[0];

            // Compose Email
            Messaging.SingleEmailMessage emailMessage = new Messaging.SingleEmailMessage();
            emailMessage.setToAddresses(new String[] { emailAddress });
            emailMessage.setSubject('You have been assigned a form response');
            emailMessage.setHtmlBody(formDataHtml);
            emailMessage.setOrgWideEmailAddressId(orgWideEmail.Id);

            // Send Email
            Messaging.sendEmail(new Messaging.SingleEmailMessage[] { emailMessage });

            System.debug('✅ Email sent successfully to: ' + emailAddress + ' from: ' + orgWideEmail.Address);
        } else {
            System.debug('❌ Email address is blank.');
            throw new AuraHandledException('Email address is empty.');
        }
    } catch (Exception e) {
        System.debug('❌ Apex Exception in sendFormDetailsToStaff: ' + e.getMessage());
        throw new AuraHandledException('Failed to send email: ' + e.getMessage());
    }
}





}