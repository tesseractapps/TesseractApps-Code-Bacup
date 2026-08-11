public without sharing class FormController {
    @AuraEnabled
public static void saveForm(String formName, String formJson, String formType, String orgId, String audience) {
    Dynamic_Form__c form = new Dynamic_Form__c();
    form.Name__c = formName;
    form.Form_JSON__c = formJson;
    form.Form_Type__c = formType;
    form.Org_Id__c = orgId;
    form.Audience__c = audience;

    insert form;
}

@AuraEnabled
public static Boolean doesPublishedFormExist(
    String formName,
    String orgId,
    String audience
) {

    Integer cnt = [
        SELECT COUNT()
        FROM Dynamic_Form__c
        WHERE Name__c = :formName
        AND Org_Id__c = :orgId
        AND Audience__c = :audience
    ];

    return cnt > 0;
}




    @AuraEnabled
public static List<Dynamic_Form__c> getForms(String orgId) {
    String effectiveOrgId = (orgId != null) ? orgId : UserInfo.getOrganizationId();
    return [
        SELECT Id,
               Name__c,
               Form_JSON__c,
               Form_Type__c,
               CreatedDate,
               CreatedById,
               CreatedBy.Name
        FROM Dynamic_Form__c
        WHERE Form_Type__c != 'Incident Register'
        AND Org_Id__c = :effectiveOrgId
        ORDER BY CreatedDate DESC
    ];
}


    @AuraEnabled(cacheable=true)
    public static List<Dynamic_Form__c> getFormsByClient(Id clientId,String orgId) {
        try {
            // ✅ If no clientId is provided, return all forms
            if (String.isEmpty(clientId)) {
                return getForms(orgId);
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
public static Dynamic_Form_Response__c saveFormResponse(
    Id formId, String responseJson, String orgId, String clientId, String formName, String formType, String status

) {
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

    Dynamic_Form_Response__c response = new Dynamic_Form_Response__c();
    response.Form_Reference__c = formId;
    response.Response_JSON__c = responseJson;
    response.Org_Id__c = orgId;
    response.Client_Id__c = clientId;
    response.Name__c = formName;
    response.Form_Type__c = formType;
    response.Participant_Name__c = participantName;
    response.Status__c = status;


    insert response;

    // ✅ return the inserted record with participant name
    return [
        SELECT Id, Participant_Name__c
        FROM Dynamic_Form_Response__c
        WHERE Id = :response.Id
        LIMIT 1
    ];
}





    
@AuraEnabled
public static List<Dynamic_Form_Response__c> getFormResponses() {
    try {
        return [
            SELECT Id, Name__c, Form_Type__c, Response_JSON__c, CreatedDate,
                   Client_Id__c, Participant_Name__c, CreatedBy.Name,
                   AWS_Url__c, AWS_Json__c
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
            SELECT Id, Name__c, Form_Type__c, Response_JSON__c, CreatedDate, Client_Id__c,Participant_Name__c,CreatedBy.Name,AWS_Url__c, AWS_Json__c, Status__c, Form_Reference__c,
                   Form_Reference__r.Form_JSON__c,LastModifiedBy.Full_Name__c
            FROM Dynamic_Form_Response__c
            WHERE Client_Id__c = :clientId
            ORDER BY CreatedDate DESC
        ];
    } catch (Exception e) {
        throw new AuraHandledException('Error retrieving form responses: ' + e.getMessage());
    }
}

@AuraEnabled(cacheable=false)
public static String getClientEmailByClientId(String clientId) {
    try {
        if (String.isBlank(clientId)) return null;

        // If your Client__c Id is stored as text, validate it looks like a SF Id
        if (clientId.length() != 15 && clientId.length() != 18) {
            throw new AuraHandledException('Invalid Client__c Id: ' + clientId);
        }

        Client__c c = [
            SELECT Email__c
            FROM Client__c
            WHERE Id = :clientId
            LIMIT 1
        ];

        return c.Email__c;

    } catch (Exception e) {
        throw new AuraHandledException('Error fetching Client email: ' + e.getMessage());
    }
}



@AuraEnabled
public static List<Dynamic_Form_Response__c> getFormResponsesFiltered(
    String audience,
    String orgId
) {
    try {

        String baseQuery =
            'SELECT Id, Name__c, Form_Type__c, Response_JSON__c, CreatedDate,' +
            '       Client_Id__c, Participant_Name__c,' +
            '       Staff__c, Staff_Name__c,' +
            '       CreatedBy.Name,' +
            '       AWS_Url__c, AWS_Json__c,' +
            '       Form_Reference__c,' +
            '       Form_Reference__r.Name__c,' +
            '       Form_Reference__r.CreatedDate,' + // ✅ ADD THIS
            '       Form_Reference__r.CreatedBy.Name,' + // ✅ ADD THIS (very useful)
            '       Form_Reference__r.Org_Id__c,' +
            '       Form_Reference__r.Audience__c,' +
            '       Status__c ' +
            'FROM Dynamic_Form_Response__c ';

        List<String> whereParts = new List<String>();
        whereParts.add('Status__c = \'Completed\'');

        // 👇 Audience Filter
        if (audience == 'Staff') {
         
            whereParts.add('Form_Reference__r.Audience__c = \'Staff\'');
        }
        else if (audience == 'Participant') {
            whereParts.add('Form_Reference__r.Audience__c = \'Participant\'');
        }


        // 👇 Org filter
        if (String.isNotBlank(orgId)) {
            whereParts.add('Form_Reference__r.Org_Id__c = :orgId');
        }

        if (!whereParts.isEmpty()) {
            baseQuery += ' WHERE ' + String.join(whereParts, ' AND ');
        }

        baseQuery += ' ORDER BY CreatedDate DESC';

        return Database.query(baseQuery);

    } catch (Exception e) {
        throw new AuraHandledException(
            'Error retrieving filtered form responses: ' + e.getMessage()
        );
    }
}



@AuraEnabled
public static Dynamic_Form_Response__c updateFormResponse(Id responseId, String responseJson, String status) {
    Dynamic_Form_Response__c existingResponse = [
        SELECT Id, Response_JSON__c, Participant_Name__c
        FROM Dynamic_Form_Response__c
        WHERE Id = :responseId
        LIMIT 1
    ];

    existingResponse.Response_JSON__c = responseJson;
    existingResponse.Status__c = status;
    update existingResponse;

    return [
        SELECT Id, Participant_Name__c
        FROM Dynamic_Form_Response__c
        WHERE Id = :existingResponse.Id
        LIMIT 1
    ];
}


@AuraEnabled
public static void updateAwsFields(Id responseId, String awsUrl, String awsJson) {
    try {
        Dynamic_Form_Response__c r = new Dynamic_Form_Response__c(
            Id = responseId,
            AWS_Url__c = awsUrl,
            AWS_Json__c = awsJson
        );
        update r;
    } catch (Exception e) {
        throw new AuraHandledException('Error updating AWS fields: ' + e.getMessage());
    }
}


@AuraEnabled
public static void deleteFormResponse(Id responseId) {
    try {
        // ============================
        // 🔍 Load response record
        // ============================
        Dynamic_Form_Response__c response = [
            SELECT Id, Response_JSON__c
            FROM Dynamic_Form_Response__c
            WHERE Id = :responseId
            LIMIT 1
        ];

        // ============================
        // 🗑️ Attempt AWS delete first
        // ============================
        if (!String.isBlank(response.Response_JSON__c)) {
            try {
                Map<String, Object> parsed =
                    (Map<String, Object>) JSON.deserializeUntyped(
                        response.Response_JSON__c
                    );

                if (
                    parsed != null &&
                    parsed.containsKey('bucket') &&
                    parsed.containsKey('key')
                ) {
                    String bucket = (String) parsed.get('bucket');
                    String keyVal = (String) parsed.get('key');

                    System.debug(
                        '🗑️ Deleting AWS response JSON: bucket=' +
                        bucket +
                        ', key=' +
                        keyVal
                    );

                    WordEditorController.deleteFromAws(
                        bucket,
                        keyVal
                    );
                } else {
                    System.debug(
                        '⚠️ Response_JSON__c does not appear to be AWS metadata — skipping AWS delete.'
                    );
                }

            } catch (Exception awsEx) {
                // ⚠️ Log but do NOT block Salesforce delete
                System.debug(
                    '⚠️ AWS delete skipped or failed: ' +
                    awsEx.getMessage()
                );
            }
        }

        // ============================
        // 🗑️ Delete Salesforce record
        // ============================
        delete response;

    } catch (Exception e) {
        throw new AuraHandledException(
            'Error deleting form response: ' + e.getMessage()
        );
    }
}

    
// @AuraEnabled
// public static List<Map<String, Object>> getParticipantsFilter(List<Id> facilityIds) {
//     try {
//         String userEmail = UserInfo.getUserEmail();

//         List<Staff__c> staffList = [
//             SELECT Id, Name, User_Type__c, Facility__c, Facility__r.Organisation__c
//             FROM Staff__c 
//             WHERE Email_Address__c = :userEmail
//             ORDER BY CreatedDate DESC
//             LIMIT 1
//         ];

//         if (staffList.isEmpty()) {
//             throw new AuraHandledException('No staff record found for current user');
//         }

//         Staff__c staffData = staffList[0];

//         System.debug('✅ Logged-in user type: ' + staffData.User_Type__c);
//         System.debug('✅ facilityIds passed: ' + facilityIds);

//         List<Client__c> clients = [
//             SELECT Id, Name, Display_Nickname__c, Picture__c,
//                    Participant_Status__c, Accessible_Forms__c,
//                    Facility__c, Facility__r.Name
//             FROM Client__c
//             WHERE Facility__c IN :facilityIds
//             AND Participant_Status__c = 'Active'
//             ORDER BY Name
//         ];

//         List<Map<String, Object>> output = new List<Map<String, Object>>();

//         for (Client__c client : clients) {
//             output.add(new Map<String, Object>{
//                 'Id' => client.Id,
//                 'Name' => client.Name,
//                 'NickName' => client.Display_Nickname__c,
//                 'Participant_Status__c' => client.Participant_Status__c,
//                 'Accessible_Forms__c' => client.Accessible_Forms__c,
//                 'Picture__c' => client.Picture__c,
//                 'Facility__c' => client.Facility__c,
//                 'Facility_Name' => client.Facility__r != null ? client.Facility__r.Name : null
//             });
//         }

//         return output;

//     } catch (Exception e) {
//         throw new AuraHandledException('Error retrieving participants: ' + e.getMessage());
//     }
// }

@AuraEnabled
public static List<Map<String, Object>> getParticipantsFilter(List<Id> facilityIds) {
    try {

        String userEmail = UserInfo.getUserEmail();

        // =====================================
        // STAFF (keep existing behaviour)
        // =====================================

        List<Staff__c> staffList = [
            SELECT Id,
                   Name,
                   User_Type__c,
                   Facility__c,
                   Facility__r.Organisation__c
            FROM Staff__c
            WHERE Email_Address__c = :userEmail
            ORDER BY CreatedDate DESC
            LIMIT 1
        ];

        if (staffList.isEmpty()) {
            throw new AuraHandledException(
                'No staff record found for current user'
            );
        }

        Staff__c staffData = staffList[0];

        System.debug('✅ Logged-in user type: ' + staffData.User_Type__c);
        System.debug('✅ facilityIds passed: ' + facilityIds);

        // =====================================
        // FETCH ACTIVE PARTICIPANTS
        // (NO facility filtering here anymore)
        // =====================================

        List<Client__c> clients = [
            SELECT Id,
                   Name,
                   Display_Nickname__c,
                   Picture__c,
                   Participant_Status__c,
                   Accessible_Forms__c
            FROM Client__c
            WHERE Participant_Status__c = 'Active'
            ORDER BY Name
        ];

        if (clients.isEmpty()) {
            return new List<Map<String, Object>>();
        }

        // =====================================
        // PARTICIPANT → FACILITIES
        // FROM JUNCTION OBJECT
        // =====================================

        Map<Id, List<String>> participantFacilities =
            new Map<Id, List<String>>();

        List<Participant_Facility__c> pfList = [
            SELECT Participant__c,
                   Facility__c,
                   Facility__r.Name
            FROM Participant_Facility__c
            WHERE Participant__c IN :clients
            AND Active__c = true
            AND Facility__c IN :facilityIds
        ];

        System.debug('🏢 ParticipantFacility count: ' + pfList.size());

        for (Participant_Facility__c pf : pfList) {

            if (!participantFacilities.containsKey(pf.Participant__c)) {
                participantFacilities.put(
                    pf.Participant__c,
                    new List<String>()
                );
            }

            participantFacilities
                .get(pf.Participant__c)
                .add(pf.Facility__r.Name);
        }

        // =====================================
        // BUILD OUTPUT
        // =====================================

        List<Map<String, Object>> output =
            new List<Map<String, Object>>();

        for (Client__c client : clients) {

            // skip if participant has no matching facility
            if (!participantFacilities.containsKey(client.Id)) {
                continue;
            }

            List<String> facilityNames =
                participantFacilities.get(client.Id);

            String facilityMultiline =
                String.join(facilityNames, '\n');

            output.add(new Map<String, Object>{
                'Id' => client.Id,
                'Name' => client.Name,
                'NickName' => client.Display_Nickname__c,
                'Participant_Status__c' => client.Participant_Status__c,
                'Accessible_Forms__c' => client.Accessible_Forms__c,
                'Picture__c' => client.Picture__c,

                // ⭐ MULTI FACILITY OUTPUT
                'Facility_Names' => facilityMultiline
            });
        }

        return output;

    } catch (Exception e) {
        throw new AuraHandledException(
            'Error retrieving participants: ' + e.getMessage()
        );
    }
}

  
   @AuraEnabled(cacheable=true)
public static List<Map<String, Object>> getParticipants(String facilityId) {
    try {
        if (String.isBlank(facilityId)) {
            throw new AuraHandledException('Facility Id is required');
        }

        /* =====================================================
           1️⃣ Identify current user & role
        ===================================================== */
        String userEmail = UserInfo.getUserEmail();

        Staff__c staffData = [
            SELECT Id,
                   User_Type__c,
                   Facility__c,
                   Facility__r.Organisation__c
            FROM Staff__c
            WHERE Email_Address__c = :userEmail
            ORDER BY CreatedDate DESC
            LIMIT 1
        ];

        Boolean isOrgAdmin = staffData.User_Type__c == 'NDIS Org Admin';
        Id organisationId = staffData.Facility__r?.Organisation__c;

        /* =====================================================
           2️⃣ Query participants SAFELY (FOR loop + LIMIT)
        ===================================================== */
        List<Client__c> clients = new List<Client__c>();

        if (isOrgAdmin && organisationId != null) {
            for (Client__c c : [
                SELECT Id,
                       Name,
                       Display_Nickname__c,
                       Participant_Status__c,
                       Accessible_Forms__c,
                       Facility__c,
                       Facility__r.Name,
                       (
                           SELECT Staff__r.Id,
                                  Staff__r.Name,
                                  Staff__r.Picture__c,
                                  Staff__r.Email_Address__c,
                                  Staff__r.Facility__c
                           FROM Participant_Staff_Associations__r
                       )
                FROM Client__c
                WHERE Facility__r.Organisation__c = :organisationId
                AND Participant_Status__c = 'Active'
                ORDER BY Name
                LIMIT 300
            ]) {
                clients.add(c);
            }
        } else {
            for (Client__c c : [
                SELECT Id,
                       Name,
                       Display_Nickname__c,
                       Participant_Status__c,
                       Accessible_Forms__c,
                       Facility__c,
                       Facility__r.Name,
                       (
                           SELECT Staff__r.Id,
                                  Staff__r.Name,
                                  Staff__r.Picture__c,
                                  Staff__r.Email_Address__c,
                                  Staff__r.Facility__c
                           FROM Participant_Staff_Associations__r
                       )
                FROM Client__c
                WHERE Facility__c = :facilityId
                AND Participant_Status__c = 'Active'
                ORDER BY Name
                LIMIT 300
            ]) {
                clients.add(c);
            }
        }

        /* =====================================================
           3️⃣ Build lightweight response for LWC
        ===================================================== */
        List<Map<String, Object>> output = new List<Map<String, Object>>();

        for (Client__c client : clients) {
            List<Map<String, String>> staffList = new List<Map<String, String>>();
            Boolean hasMatchingFacilityStaff = false;

            if (client.Participant_Staff_Associations__r != null) {
                for (Participant_Staff_Association__c assoc :
                     client.Participant_Staff_Associations__r) {

                    if (assoc.Staff__r != null &&
                        (isOrgAdmin || assoc.Staff__r.Facility__c == facilityId)) {

                        hasMatchingFacilityStaff = true;

                        staffList.add(new Map<String, String>{
                            'name' => assoc.Staff__r.Name,
                            'pictureUrl' => assoc.Staff__r.Picture__c,
                            'email' => assoc.Staff__r.Email_Address__c
                        });
                    }
                }
            }

            output.add(new Map<String, Object>{
                'Id' => client.Id,
                'Name' => client.Name,
                'NickName' => client.Display_Nickname__c,
                'Participant_Status__c' => client.Participant_Status__c,
                'Accessible_Forms__c' => client.Accessible_Forms__c,
                'Facility__c' => client.Facility__c,
                'Facility_Name' => client.Facility__r?.Name,
                'staffMembers' => staffList,
                'hasMatchingFacilityStaff' => hasMatchingFacilityStaff
            });
        }

        return output;

    } catch (Exception e) {
        throw new AuraHandledException('Error retrieving participants: ' + e.getMessage());
    }
}





    /**
     * ✅ Fetch all Available Forms (Published Forms)
     */
    @AuraEnabled
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
    @AuraEnabled
public static List<Dynamic_Form__c> getAccessibleForms(Id participantId) {
    try {
        Client__c participant = [
            SELECT Accessible_Forms__c,Name, Display_Nickname__c FROM Client__c WHERE Id = :participantId LIMIT 1
        ];

        if (String.isEmpty(participant.Accessible_Forms__c)) {
            return new List<Dynamic_Form__c>(); // No forms assigned
        }

        // Split newline-separated form IDs
        List<String> formIds = participant.Accessible_Forms__c.split('\n');

        // Query full form records including Form_JSON__c
        List<Dynamic_Form__c> forms = [
            SELECT Id, Name__c, Form_Type__c, Form_JSON__c,CreatedById,
                   CreatedBy.Name,
                   CreatedDate
            FROM Dynamic_Form__c
            WHERE Id IN :formIds
            ORDER BY CreatedDate DESC
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

@AuraEnabled
public static void revokeAccessFromParticipants(List<Id> participantIds, String formId) {
    System.debug('🔹 Entering revokeAccessFromParticipants() with Form ID: ' + formId);

    if (String.isBlank(formId)) {
        throw new AuraHandledException('Form ID cannot be blank.');
    }
    if (participantIds == null || participantIds.isEmpty()) {
        throw new AuraHandledException('No participant IDs provided.');
    }

    // Normalize the target key for robust comparison (accept both 15/18)
    final String key18 = normalize18(formId);
    final String key15 = (key18 != null && key18.length() >= 15) ? key18.substring(0, 15) : key18;

    // Fetch participants
    List<Client__c> participants = [
        SELECT Id, Accessible_Forms__c
        FROM Client__c
        WHERE Id IN :participantIds
        FOR UPDATE
    ];

    List<Client__c> toUpdate = new List<Client__c>();

    for (Client__c p : participants) {
        String current = (p.Accessible_Forms__c == null) ? '' : p.Accessible_Forms__c.replace('\r','');

        // Accept newlines, commas, semicolons or spaces as historical delimiters
        List<String> raw = new List<String>();
        if (String.isNotBlank(current)) {
            raw.addAll(current.split('[,;\\n\\t ]+'));
        }

        // Rebuild with everything EXCEPT the target form id
        Set<String> kept = new Set<String>();
        for (String token : raw) {
            String t = (token == null) ? '' : token.trim();
            if (t == '') continue;

            String t18 = normalize18(t);
            String t15 = (t18 != null && t18.length() >= 15) ? t18.substring(0, 15) : t18;

            // Keep only if it does NOT match our target (by 18 OR 15)
            if (!(t18 == key18 || t15 == key15)) {
                // Store canonically as 18 where possible
                kept.add((t18 != null && t18 != '') ? t18 : t);
            }
        }

        // Join with newline (same as your grant method)
        String updated = String.join(new List<String>(kept), '\n');
        if (updated != current) {
            p.Accessible_Forms__c = updated;
            toUpdate.add(p);
        }
    }

    if (!toUpdate.isEmpty()) {
        update toUpdate;
    }

    System.debug('✅ Successfully revoked access from participants. Updated records: ' + toUpdate.size());
}

/** Helper: normalize to 18-char Id if possible, otherwise trimmed token. */
private static String normalize18(String idStr) {
    if (String.isBlank(idStr)) return null;
    String s = idStr.trim();
    // If caller passed a 15-char Id, leave it; if 18, keep 18; if longer token, trim to 18 max
    if (s.length() > 18) s = s.substring(0, 18);
    return s;
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


@AuraEnabled(cacheable=true)
public static List<Client__c> getParticipantsByOrgId(Id orgid) {
    if (orgId == null) {
        throw new AuraHandledException('Missing Organisation Id');
    }

    try {
        // Step 1: Fetch facility IDs related to the given Organisation
        List<Facility__c> facilities = [
            SELECT Id, Name 
            FROM Facility__c 
            WHERE Organisation__c = :orgid
        ];

        if (facilities.isEmpty()) return new List<Client__c>();

        Set<Id> facilityIds = new Set<Id>();
        for (Facility__c fac : facilities) {
            facilityIds.add(fac.Id);
        }

        // Step 2: Fetch clients (participants) assigned to those facilities
        List<Client__c> clients = [
            SELECT Id, Name, Participant_Status__c, Facility__c, Facility__r.Name
            FROM Client__c
            WHERE Facility__c IN :facilityIds
            ORDER BY Name
        ];

        return clients;

    } catch (Exception e) {
        throw new AuraHandledException('Error fetching participants: ' + e.getMessage());
    }
    
    
    
    
}

@AuraEnabled
public static Map<String, Object> checkFormSignatureStatus(Id formResponseId) {
    Map<String, Object> response = new Map<String, Object>{
        'isSigned' => false,
        'signatureUrl' => null
    };

    try {
        Offer_Template__c offer = [
            SELECT Id,
                   All_Recipients__c,
                   Current_Recipient__c,
                   Current_Recipient_Status__c,
                   CreatedDate
            FROM Offer_Template__c
            WHERE Dynamic_Form_Response__c = :formResponseId
            ORDER BY CreatedDate DESC
            LIMIT 1
        ];

        String lastRecipientEmail = getLastEmailFromAllRecipients(offer.All_Recipients__c);
        String currentRecipientEmail = normalizeEmail(extractEmail(offer.Current_Recipient__c));

        Boolean isCompleted =
            String.isNotBlank(offer.Current_Recipient_Status__c) &&
            offer.Current_Recipient_Status__c.trim().equalsIgnoreCase('Completed');

        Boolean isLastRecipient =
            String.isNotBlank(lastRecipientEmail) &&
            String.isNotBlank(currentRecipientEmail) &&
            lastRecipientEmail == currentRecipientEmail;

        if (!(isCompleted && isLastRecipient)) return response;

        Child_Signatures__c latestSignature = [
            SELECT Signature_URL__c
            FROM Child_Signatures__c
            WHERE Offer_Template__c = :offer.Id
            ORDER BY CreatedDate DESC
            LIMIT 1
        ];

        if (latestSignature != null && String.isNotBlank(latestSignature.Signature_URL__c)) {
            response.put('isSigned', true);
            response.put('signatureUrl', latestSignature.Signature_URL__c);
        }

    } catch (Exception e) {
        System.debug('❌ Error checking form signature status: ' + e.getMessage());
    }

    return response;
}

/* -------------------- Helpers -------------------- */

private static String getLastEmailFromAllRecipients(String allRecipients) {
    if (String.isBlank(allRecipients)) return null;

    List<String> lines = allRecipients.split('[\\r\\n]+');

    for (Integer i = lines.size() - 1; i >= 0; i--) {
        String line = lines[i] != null ? lines[i].trim() : null;
        if (String.isBlank(line)) continue;

        String email = extractEmail(line);
        if (String.isNotBlank(email)) return normalizeEmail(email);
    }
    return null;
}

private static String extractEmail(String text) {
    if (String.isBlank(text)) return null;

    // Apex regex is case-insensitive by default
    Pattern p = Pattern.compile('([A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,})');
    Matcher m = p.matcher(text);

    if (m.find()) return m.group(1);

    // fallback: if it already looks like an email
    String t = text.trim();
    return (t.contains('@') && t.contains('.')) ? t : null;
}

private static String normalizeEmail(String email) {
    if (String.isBlank(email)) return null;
    return email.trim().toLowerCase();
}


@AuraEnabled
public static list<Facility__c> fetchFacilitiess(){ 

    list<Facility__c> lstFacility = new list<Facility__c>();
    Organisation__c orgNames =  new Organisation__c();
    
    User objUser = [
        SELECT Phone, Id, Organization_Name__c 
        FROM User 
        WHERE Id = :UserInfo.getUserId()
    ];
    
    orgNames = [
        SELECT id, Name, ABN__c, ACN__c, NDIS_Provider__c, Contact_No__c, 
               Email__c, Address__c 
        FROM Organisation__c 
        WHERE Name = :objUser.Organization_Name__c
    ];

    lstFacility = [
        SELECT id, name, Email__c, AddressData__c, Phone__c, Status__c, 
               Services__c, Organisation__r.name, Type_of_Service__c,
               Manager_Name__c, Address__Street__s, 
               Facility_Preferred_Name_Formula__c, 
               Participant_Preferred_Name_Formla__c, 
               Staff_Preferred_Name_Formula__c,
               Address__City__s, Address__StateCode__s, 
               Address__CountryCode__s, Address__PostalCode__s, 
               Organisation__r.Afternoon_Shift_End_Time__c,
               Organisation__r.Afternoon_Shift_Start_Time__c,
               Organisation__r.Custom_Shift_End_Time__c,
               Organisation__r.Custom_Shift_Start_Time__c,
               Organisation__r.General_Shift_End_time__c,
               Organisation__r.General_Shift_Start_Time__c,
               Organisation__r.Morning_Shift_End_Time__c,
               Organisation__r.Morning_Shift_Start_Time__c,
               Organisation__r.Night_Shift_Start_Time__c,
               Organisation__r.Night_Shift_End_Time__c,
               Shift_Penalty_Mode__c,
               Organisation__r.Sleepover_Start__c,
               Organisation__r.Sleepover_Shift_End_Time__c
        FROM Facility__c 
        WHERE Organisation__r.Id = :orgNames.Id  
              AND Status__c = TRUE
              AND Type_of_Service__c = 'NDIS'
        ORDER BY Name ASC
    ];
  
    return lstFacility;   
}












// For the form render staff LWC

@AuraEnabled
public static Staff__c getStaffForCurrentUser() {

    User u = [
        SELECT Email
        FROM User
        WHERE Id = :UserInfo.getUserId()
        LIMIT 1
    ];

    if (String.isBlank(u.Email)) return null;

    List<Staff__c> staff = [
        SELECT Id, NameToDisplay__c, Email_Address__c
        FROM Staff__c
        WHERE Email_Address__c = :u.Email
        LIMIT 1
    ];

    return staff.isEmpty() ? null : staff[0];
}




@AuraEnabled
public static List<Dynamic_Form__c> getAccessibleStaffForms(Id staffId) {
    try {

        Staff__c staff = [
            SELECT Accessible_Custom_Forms__c
            FROM Staff__c
            WHERE Id = :staffId
            LIMIT 1
        ];

        if (String.isBlank(staff.Accessible_Custom_Forms__c)) {
            return new List<Dynamic_Form__c>();
        }

        List<String> formIds = staff.Accessible_Custom_Forms__c.split('\n');

        return [
            SELECT Id,
                   Name__c,
                   Form_Type__c,
                   Form_JSON__c,
                   CreatedBy.Name,
                   CreatedDate
            FROM Dynamic_Form__c
            WHERE Id IN :formIds
              AND Audience__c = 'Staff'
            ORDER BY CreatedDate DESC
        ];

    } catch (Exception e) {
        throw new AuraHandledException(
            'Error retrieving staff accessible forms: ' + e.getMessage()
        );
    }
}

@AuraEnabled
public static Dynamic_Form_Response__c saveStaffFormResponse(
    Id formId,
    String responseJson,
    String orgId,
    Id staffId,
    String formName,
    String formType,
    String status

) {

    String staffName = '';

    if (staffId != null) {
        Staff__c staff = [
            SELECT Name
            FROM Staff__c
            WHERE Id = :staffId
            LIMIT 1
        ];

        staffName = staff != null ? staff.Name : '';
    }

    Dynamic_Form_Response__c response = new Dynamic_Form_Response__c();
    response.Form_Reference__c = formId;
    response.Response_JSON__c = responseJson;
    response.Org_Id__c = orgId;

    // 🔥 STAFF FIELDS
    response.Staff__c = staffId;
    response.Staff_Name__c = staffName;

    response.Name__c = formName;
    response.Form_Type__c = formType;
    response.Status__c = status;


    insert response;

    return [
        SELECT Id, Staff_Name__c
        FROM Dynamic_Form_Response__c
        WHERE Id = :response.Id
        LIMIT 1
    ];
}
@AuraEnabled
public static Dynamic_Form_Response__c updateStaffFormResponse(
    Id responseId,
    String responseJson,
    String status

) {

    Dynamic_Form_Response__c existingResponse = [
        SELECT Id,
               Response_JSON__c,
               Staff_Name__c
        FROM Dynamic_Form_Response__c
        WHERE Id = :responseId
        LIMIT 1
    ];

    existingResponse.Response_JSON__c = responseJson;
    existingResponse.Status__c = status;
    update existingResponse;

    return [
        SELECT Id,
               Staff_Name__c
        FROM Dynamic_Form_Response__c
        WHERE Id = :existingResponse.Id
        LIMIT 1
    ];
}
@AuraEnabled
public static List<Dynamic_Form_Response__c> getFormResponsesByStaff(Id staffId) {
    try {
        if (staffId == null) {
            throw new AuraHandledException('Staff ID cannot be null.');
        }

        return [
            SELECT Id,
                   Name__c,
                   Form_Type__c,
                   Response_JSON__c,
                   CreatedDate,
                   Staff__c,
                   Staff_Name__c,
                   CreatedBy.Name,
                   AWS_Url__c,
                   AWS_Json__c,
                   Status__c,
                   Form_Reference__c,
                   Form_Reference__r.Form_JSON__c
            FROM Dynamic_Form_Response__c
            WHERE Staff__c = :staffId
            ORDER BY CreatedDate DESC
        ];

    } catch (Exception e) {
        throw new AuraHandledException(
            'Error retrieving staff form responses: ' + e.getMessage()
        );
    }
}



 @AuraEnabled
    public static List<staff__c> getEmployeeData(String facilityid){
        System.debug('facilityid'+facilityid);
       // String orgId = CurrentUserOrganization.currentOrgId();
       // String organizationId = orgId.substring(0,15);
        User objUser = [ SELECT Organization_Name__c,Email FROM User WHERE Id = : UserInfo.getUserId() AND IsActive = TRUE ];
        System.debug('objUser detail : '+objUser);
        String email = objUser.Email;
        System.debug('getting email address :'+email);
       // string orgName = [Select id,Name from Organisation__c where name=:objUser.Organization_Name__c limit 1].Name; 
        List<User> listUsers = [ SELECT Organization_Name__c,Email FROM User WHERE Organization_Name__c =:objUser.Organization_Name__c AND IsActive = TRUE ];
        List<String> emailAddres = new List<String>();
        for(User u:listUsers){
            emailAddres.add(u.Email);
        }
        try {
            return [SELECT Id, Name,Last_Name__c,NameToDisplay__c, Display_Nickname__c, LastViewedDate,Contact_Number__c,Email_Address__c,Emergency_Phone_Number__c,Facility__c
             FROM staff__c WHERE Organization_Full_Name__c  =:objUser.Organization_Name__c AND Facility__c=:facilityid AND Email_Address__c =:emailAddres AND Status__c = true ORDER BY NameToDisplay__c ASC];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }





}