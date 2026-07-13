public without sharing class IncidentRegisterControllerV2 {
    
        @AuraEnabled(cacheable=true)
public static List<Incident_Form__c> getForms() {
    return [
        SELECT Id, Name__c, Form_JSON__c, Form_Type__c, DefaultIncident__c
        FROM Incident_Form__c
        WHERE Form_Type__c = 'Incident Register'
        ORDER BY CreatedDate DESC
    ];
}
    
    
    
    @AuraEnabled(cacheable=true)
public static List<Incident_Form__c> getAvailableForms() {
    try {
        return [
            SELECT Id, Name__c, DefaultIncident__c
            FROM Incident_Form__c
            WHERE Form_Type__c = 'Incident Register'
            ORDER BY CreatedDate DESC
        ];
    } catch (Exception e) {
        System.debug('❌ Error fetching forms: ' + e.getMessage());
        throw new AuraHandledException('Error retrieving forms: ' + e.getMessage());
    }
}


@AuraEnabled
public static void saveFormResponse(Id formId, String responseJson, String orgId, String clientId, String formName, String formType, String statusValue, Id assignedStaffId,  Id facilityId) {
    Incident_Register_Response__c response = new Incident_Register_Response__c();
    response.Incident_Form__c = formId;
    response.Response_JSON__c = responseJson;
    response.Org_Id__c = orgId; 
    response.Client_Id__c = clientId; 
    response.Name__c = formName;    
    response.Form_Type__c = formType; 
    response.Facility__c = facilityId;
    response.Status__c = statusValue;
    response.Incident_Assigned_Staff__c = assignedStaffId;

    if (facilityId == null) {
    throw new AuraHandledException('Facility is required.');
}


    insert response;
}


@AuraEnabled
public static List<Incident_Register_Response__c> getFormResponses(
    Id orgId,
    Id facilityId
) {

    try {

        User u = [
            SELECT Id, Email, Profile.Name, User_Type__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        // ====================================
        // 👑 ADMIN CHECK (NOW INCLUDES ROSTER)
        // ====================================
        Boolean isOrgAdmin =
            u.User_Type__c == 'NDIS Org Admin' ||
            u.User_Type__c == 'Roster Manager';

        Id staffId;
        Id currentUserId = u.Id;

        // ====================================
        // 🔎 Resolve Staff for non-admin
        // ====================================
        if (!isOrgAdmin && u.Email != null) {

            List<Staff__c> staffList = [
                SELECT Id, Email_Address__c
                FROM Staff__c
                WHERE Email_Address__c = :u.Email
                LIMIT 1
            ];

            if (!staffList.isEmpty()) {
                staffId = staffList[0].Id;
            }
        }

        // ====================================
        // 🧱 BASE QUERY FILTER → ORG
        // ====================================
        String baseQuery =
            'SELECT Id, Name__c, Form_Type__c, Response_JSON__c, ' +
            'CreatedDate,CreatedById, CreatedBy.Name,CreatedBy.Full_Name__c, Client_Id__c, Org_Id__c, Assigned_Staff__c, Status__c, ' +
            'Incident_Assigned_Staff__c, ' +
            'Incident_Assigned_Staff__r.Name, ' +
            'Incident_Assigned_Staff__r.NameToDisplay__c, ' +
            'Incident_Form__c, ' +
            'Facility__c, ' +
            'Facility__r.Name ' +
            'FROM Incident_Register_Response__c ' +
            'WHERE Org_Id__c = :orgId ';

        // ====================================
        // 👑 ADMIN → ALL IN ORG + FACILITY
        // ====================================
        if (isOrgAdmin) {

            String adminQuery = baseQuery;

            // 🔥 Facility filter for admins too
            if (facilityId != null) {
                adminQuery +=
                    ' AND Facility__c = :facilityId ';
            }

            adminQuery +=
                ' ORDER BY CreatedDate DESC';

            return Database.query(adminQuery);
        }

        // ====================================
        // 👤 STAFF → ASSIGNED OR SUBMITTED + FACILITY
        // ====================================
        if (staffId != null) {

            String staffQuery =
                baseQuery;

            // Facility filter stays
            if (facilityId != null) {
                staffQuery +=
                    ' AND Facility__c = :facilityId ';
            }

            // Assigned OR Submitted by user
            staffQuery +=
                ' AND ( ' +
                ' Incident_Assigned_Staff__c = :staffId ' +
                ' OR CreatedById = :currentUserId ' +
                ' ) ';

            staffQuery +=
                ' ORDER BY CreatedDate DESC';

            return Database.query(staffQuery);
        }

        // ====================================
        // 🚫 fallback
        // ====================================
        return new List<Incident_Register_Response__c>();

    } catch (Exception e) {

        throw new AuraHandledException(
            'Error retrieving form responses: ' + e.getMessage()
        );
    }
}


    
@AuraEnabled
public static Incident_Register_Response__c getFormDetailsById(Id formId) {

    List<Incident_Register_Response__c> records = [
        SELECT
            Id,
            Name__c,
            Form_Type__c,
            Response_JSON__c,
            CreatedDate,
            CreatedBy.Name,
            Client_Id__c,
            Org_Id__c,
            Assigned_Staff__c,
            Status__c,
            Incident_Assigned_Staff__c,
            Incident_Assigned_Staff__r.Name,
            Incident_Form__c,
            History_Log__c,

            // 🔥 PULL FORM TEMPLATE TOO
            Incident_Form__r.Id,
            Incident_Form__r.Name__c,
            Incident_Form__r.Form_JSON__c,
            Incident_Form__r.Form_Type__c,
            Incident_Form__r.Status__c,
            Incident_Form__r.DefaultIncident__c

        FROM Incident_Register_Response__c
        WHERE Id = :formId
        LIMIT 1
    ];

    if (records.isEmpty()) {
        return null;
    }

    return records[0];
}



@AuraEnabled
public static Incident_Register_Response__c getPreviousFormData(Id responseId) {
    return [
        SELECT Id, Response_JSON__c, History_Log__c
        FROM Incident_Register_Response__c
        WHERE Id = :responseId
        LIMIT 1
    ];
}
    
@AuraEnabled
public static void updateFormWithHistory(String responseId, String responseJson, String historyLog, String statusValue, Id assignedStaffId) {
    Incident_Register_Response__c recordToUpdate = new Incident_Register_Response__c();
    recordToUpdate.Id = responseId;
    recordToUpdate.Response_JSON__c = responseJson;
    recordToUpdate.History_Log__c = historyLog;

    if (String.isNotBlank(statusValue)) {
        recordToUpdate.Status__c = statusValue;
    }

    if (assignedStaffId != null) {
    recordToUpdate.Incident_Assigned_Staff__c = assignedStaffId;
}


    update recordToUpdate;
}


/**
 * ✅ Fetch Form Responses for a Specific Client
 */
@AuraEnabled(cacheable=true)
public static List<Incident_Register_Response__c> getFormResponsesByClient(Id clientId) {
    try {
        if (clientId == null) {
            throw new AuraHandledException('Client ID cannot be null.');
        }

        return [
            SELECT Id, Name__c, Form_Type__c, Response_JSON__c, CreatedDate, Client_Id__c, Assigned_Staff__c, Status__c,Incident_Assigned_Staff__c,
            Incident_Assigned_Staff__r.Name,Incident_Form__c 
            FROM Incident_Register_Response__c
            WHERE Client_Id__c = :clientId
            ORDER BY CreatedDate DESC
        ];
    } catch (Exception e) {
        throw new AuraHandledException('Error retrieving form responses: ' + e.getMessage());
    }
}


@AuraEnabled
public static void updateFormResponse(Id responseId, String responseJson, String statusValue, Id assignedStaffId) {
    try {
        Incident_Register_Response__c existingResponse = [
            SELECT Id, Response_JSON__c, Status__c, Incident_Assigned_Staff__c
            FROM Incident_Register_Response__c
            WHERE Id = :responseId
            LIMIT 1
        ];

        existingResponse.Response_JSON__c = responseJson;
        existingResponse.Status__c = statusValue;
        existingResponse.Incident_Assigned_Staff__c = assignedStaffId;

        update existingResponse;

    } catch (Exception e) {
        throw new AuraHandledException('Error updating form response: ' + e.getMessage());
    }
}

@AuraEnabled
public static void deleteFormResponse(Id responseId) {

    try {

        // =============================
        // 🔎 Load record + AWS JSON
        // =============================
        Incident_Register_Response__c response = [
            SELECT Id, Response_JSON__c
            FROM Incident_Register_Response__c
            WHERE Id = :responseId
            LIMIT 1
        ];

        // =============================
        // ☁️ Delete AWS file first
        // =============================
        if (String.isNotBlank(response.Response_JSON__c)) {

            try {

                Map<String, Object> awsMeta =
                    (Map<String, Object>) JSON.deserializeUntyped(
                        response.Response_JSON__c
                    );

                // only if stored as aws meta object
                if (awsMeta.containsKey('bucket') && awsMeta.containsKey('key')) {

                    String bucket = (String) awsMeta.get('bucket');
                    String keyVal    = (String) awsMeta.get('key');

                    if (String.isNotBlank(bucket) && String.isNotBlank(keyVal)) {

                        System.debug(
                            '🗑️ Deleting AWS object: ' + bucket + '/' + keyVal
                        );

                       WordEditorController.deleteFromAws(
                        bucket,
                        keyVal
                    );
                    }
                }

            } catch (Exception awsEx) {

                // ⚠️ AWS delete failure should NOT block SF delete
                System.debug(
                    '⚠️ AWS delete failed — continuing Salesforce delete: ' +
                    awsEx.getMessage()
                );
            }
        }

        // =============================
        // 🗑️ Delete Salesforce record
        // =============================
        delete response;

    } catch (Exception e) {

        throw new AuraHandledException(
            'Error deleting form response: ' + e.getMessage()
        );
    }
}


    
@AuraEnabled(cacheable=true)
public static List<Staff__c> getStaffRecords(Id orgId) {

    try {

        // =====================================
        // 🔍 FETCH ORG NAME
        // =====================================
        String orgName = [
            SELECT Name
            FROM Organisation__c
            WHERE Id = :orgId
            LIMIT 1
        ].Name;

        // =====================================
        // 👥 FETCH STAFF BY ORG + ACTIVE
        // =====================================
        List<Staff__c> staffList = [
            SELECT Id,
                   Name,
                   Last_Name__c,
                   Picture__c,
                   Status__c,
                   Accessible_Forms__c,
                   Email_Address__c,
                   Facility__c,
                   Role__c,
                   Facility__r.Name
            FROM Staff__c
            WHERE Status__c = true
            AND Organization_Full_Name__c = :orgName
            AND Email_Address__c != null
            ORDER BY Name ASC
        ];

        if (staffList.isEmpty()) {
            return staffList;
        }

        // =====================================
        // 📧 COLLECT STAFF EMAILS
        // =====================================
        Set<String> staffEmails = new Set<String>();

        for (Staff__c s : staffList) {
            if (String.isNotBlank(s.Email_Address__c)) {
                staffEmails.add(
                    s.Email_Address__c.trim().toLowerCase()
                );
            }
        }

        if (staffEmails.isEmpty()) {
            return new List<Staff__c>();
        }

        // =====================================
        // 👤 FETCH ACTIVE USERS MATCHING EMAIL
        // =====================================
        Set<String> activeUserEmails = new Set<String>();

        for (User u : [
            SELECT Email
            FROM User
            WHERE IsActive = true
            AND Email != null
            AND Email IN :staffEmails
        ]) {
            if (String.isNotBlank(u.Email)) {
                activeUserEmails.add(
                    u.Email.trim().toLowerCase()
                );
            }
        }

        // =====================================
        // ✅ FINAL FILTER
        // =====================================
        List<Staff__c> finalStaff = new List<Staff__c>();

        for (Staff__c s : staffList) {
            if (
                String.isNotBlank(s.Email_Address__c) &&
                activeUserEmails.contains(
                    s.Email_Address__c.trim().toLowerCase()
                )
            ) {
                finalStaff.add(s);
            }
        }

        return finalStaff;

    } catch (Exception e) {

        throw new AuraHandledException(
            'Error retrieving staff records: ' + e.getMessage()
        );
    }
}



@AuraEnabled(cacheable=true)
public static List<Incident_Form__c> getAccessibleForms(Id staffId) {
    try {
        // 🔎 Fetch the staff member
        Staff__c staff = [
            SELECT Accessible_Forms__c
            FROM Staff__c
            WHERE Id = :staffId
            LIMIT 1
        ];

        // 🔁 Handle empty form list
        if (String.isBlank(staff.Accessible_Forms__c)) {
            return new List<Incident_Form__c>();
        }

        // 🔁 Split by semicolon
        List<String> formIds = staff.Accessible_Forms__c.split(';');

        // ✅ Query form details
        List<Incident_Form__c> forms = [
            SELECT Id, Name__c, Form_Type__c
            FROM Incident_Form__c
            WHERE Id IN :formIds
        ];

        System.debug('🔹 Accessible Forms for Staff: ' + forms);
        return forms;

    } catch (Exception e) {
        System.debug('❌ Error fetching accessible forms: ' + e.getMessage());
        throw new AuraHandledException('Error retrieving form records: ' + e.getMessage());
    }
}
@AuraEnabled
public static void grantAccessToStaff(List<Id> staffIds, List<String> selectedFormIds) {
    System.debug('🔹 Entering grantAccessToStaff() (Bulk Mode)...');

    if (staffIds == null || staffIds.isEmpty()) {
        throw new AuraHandledException('Staff IDs cannot be null or empty.');
    }

    System.debug('🔹 Granting Access to Staff List: ' + staffIds);
    System.debug('🔹 Selected Form IDs (overwrite): ' + selectedFormIds);

    List<Staff__c> staffToUpdate = [
        SELECT Id FROM Staff__c WHERE Id IN :staffIds
    ];

    String updatedValues = selectedFormIds != null && !selectedFormIds.isEmpty()
        ? String.join(selectedFormIds, ';')
        : null;

    for (Staff__c s : staffToUpdate) {
        s.Accessible_Forms__c = updatedValues;
    }

    update staffToUpdate;

    System.debug('✅ Updated ' + staffToUpdate.size() + ' staff records with form access: ' + updatedValues);
}

@AuraEnabled
public static void clearGrantedForms(Id staffId) {
    Staff__c staff = [SELECT Id, Accessible_Forms__c FROM Staff__c WHERE Id = :staffId LIMIT 1];
    staff.Accessible_Forms__c = null;
    update staff;
}


@AuraEnabled(cacheable=true)
public static String getOrgLogo(Id orgId) {

    Organisation__c org = [
        SELECT Organization_Logo__c
        FROM Organisation__c
        WHERE Id = :orgId
        LIMIT 1
    ];

    if (String.isBlank(org.Organization_Logo__c)) {
        return null;
    }

    Pattern p = Pattern.compile('<img[^>]+src="([^"]+)"');
    Matcher m = p.matcher(org.Organization_Logo__c);

    if (m.find()) {
        return m.group(1); // 👈 RETURN RAW RELATIVE URL
    }

    return null;
}






@AuraEnabled
public static List<Staff__c> getEmployeeData(String facilityId) {
    try {
        System.debug('▶️ getEmployeeData called');
        System.debug('🏢 Facility Id received: ' + facilityId);

        // -----------------------------------------------------
        // 1️⃣ Validate input
        // -----------------------------------------------------
        if (String.isBlank(facilityId)) {
            System.debug('⚠️ Facility Id is null or empty');
            return new List<Staff__c>();
        }

        // -----------------------------------------------------
        // 2️⃣ Fetch Staff by Facility ONLY (authoritative filter)
        // -----------------------------------------------------
        List<Staff__c> staffList = [
            SELECT Id,
                   Name,
                   Last_Name__c,
                   NameToDisplay__c,
                   Display_Nickname__c,
                   Contact_Number__c,
                   Email_Address__c,
                   Emergency_Phone_Number__c,
                   Facility__c
            FROM Staff__c
            WHERE Facility__c = :facilityId
            ORDER BY NameToDisplay__c ASC
        ];

        System.debug('👥 Staff records returned: ' + staffList.size());

        return staffList;

    } catch (Exception e) {
        System.debug('❌ Error in getEmployeeData: ' + e.getMessage());
        throw new AuraHandledException(
            'Error fetching staff data: ' + e.getMessage()
        );
    }
}



@AuraEnabled
public static void appendFormsToStaff(
    List<Id> staffIds,
    List<Id> formIds
) {

    System.debug('🚀 appendFormsToStaff invoked');
    System.debug('👥 Staff IDs: ' + staffIds);
    System.debug('📄 Form IDs to append: ' + formIds);

    if (staffIds == null || staffIds.isEmpty()) {
        throw new AuraHandledException('No staff selected.');
    }

    if (formIds == null || formIds.isEmpty()) {
        throw new AuraHandledException('No forms selected.');
    }

    // Query staff records
    List<Staff__c> staffList = [
        SELECT Id, Accessible_Forms__c
        FROM Staff__c
        WHERE Id IN :staffIds
    ];

    if (staffList.isEmpty()) {
        throw new AuraHandledException('No matching staff records found.');
    }

    // Append + de-duplicate
    for (Staff__c staff : staffList) {

        Set<String> mergedFormIds = new Set<String>();

        if (!String.isBlank(staff.Accessible_Forms__c)) {
            mergedFormIds.addAll(staff.Accessible_Forms__c.split(';'));
        }

        for (Id formId : formIds) {
            mergedFormIds.add(String.valueOf(formId));
        }

        staff.Accessible_Forms__c =
            mergedFormIds.isEmpty()
                ? null
                : String.join(
                    new List<String>(mergedFormIds),
                    ';'
                );
    }

    update staffList;

    System.debug(
        '✅ Updated ' + staffList.size() +
        ' staff records with appended form access.'
    );
}


@AuraEnabled
public static void deleteLayout(Id layoutId) {

    System.debug('🗑️ deleteLayout invoked. Layout Id = ' + layoutId);

    if (layoutId == null) {
        throw new AuraHandledException('Layout Id is required for deletion.');
    }

    try {

        Incident_Form_Template__c layoutToDelete = [
            SELECT Id, Name
            FROM Incident_Form_Template__c
            WHERE Id = :layoutId
            LIMIT 1
        ];

        delete layoutToDelete;

        System.debug('✅ Layout deleted successfully. Id = ' + layoutId);

    } catch (QueryException qe) {

        System.debug('❌ Layout not found: ' + qe.getMessage());

        throw new AuraHandledException(
            'Draft form no longer exists or was already deleted.'
        );

    } catch (Exception e) {

        System.debug('❌ Unexpected error in deleteLayout: ' + e.getMessage());

        throw new AuraHandledException(
            'Failed to delete draft form: ' + e.getMessage()
        );
    }
}


@AuraEnabled
public static Id saveForm(
    String formName,
    String formJson,
    String formType,
    String orgId
) {

    Incident_Form__c form = new Incident_Form__c();

    form.Name__c = formName;
    form.Form_JSON__c = formJson;
    form.Form_Type__c = formType;
    form.Org_Id__c = orgId;

    insert form;

    System.debug('✅ Incident form published with Id: ' + form.Id);

    return form.Id;
}

@AuraEnabled
public static Boolean doesPublishedFormExist(
    String formName,
    String orgId
) {

    Integer cnt = [
        SELECT COUNT()
        FROM Incident_Form__c
        WHERE Name__c = :formName
        AND Org_Id__c = :orgId
    ];

    return cnt > 0;
}

@AuraEnabled
public static List<Incident_Form__c> getFormsForUser(
    String userType,
    String userEmail,
    String orgId
) {

    System.debug('🚀 getFormsForUser invoked');
    System.debug(
        'UserType=' + userType +
        ', Email=' + userEmail +
        ', OrgId=' + orgId
    );

    String effectiveOrgId =
        String.isNotBlank(orgId)
            ? orgId
            : UserInfo.getOrganizationId();

    List<Incident_Form__c> results = new List<Incident_Form__c>();
    Set<Id> addedFormIds = new Set<Id>();

    // =====================================================
    // 🔓 ADMIN / MANAGER → ALL ORG FORMS
    // =====================================================

    if (
        userType == 'NDIS Org Admin' ||
        userType == 'Roster Manager'
    ) {

        List<Incident_Form__c> orgForms = [
            SELECT Id,
                   Name__c,
                   Form_JSON__c,
                   Form_Type__c,
                   CreatedDate,
                   CreatedBy.Name,
                   DefaultIncident__c,
                   Status__c
            FROM Incident_Form__c
            WHERE Form_Type__c = 'Incident Register'
            AND Org_Id__c = :effectiveOrgId
            ORDER BY CreatedDate DESC
        ];

        for (Incident_Form__c f : orgForms) {
            results.add(f);
            addedFormIds.add(f.Id);
        }
    }

    // =====================================================
    // 👩‍⚕️ STAFF FLOW
    // =====================================================

    if (
        userType != 'NDIS Org Admin' &&
        userType != 'Roster Manager'
    ) {

        if (String.isBlank(userEmail)) {
            throw new AuraHandledException(
                'Unable to determine user email.'
            );
        }

        List<Staff__c> staffList = [
            SELECT Id, Accessible_Forms__c
            FROM Staff__c
            WHERE Email_Address__c = :userEmail
            LIMIT 1
        ];

        // ⚠️ DO NOT EXIT METHOD — allow default forms later
        if (staffList.isEmpty()) {

            System.debug(
                '⚠️ No Staff found for email: ' + userEmail
            );

        } else {

            Staff__c staff = staffList[0];

            // ================================
            // 📦 STAFF WITH ASSIGNED FORMS
            // ================================

            if (String.isNotBlank(staff.Accessible_Forms__c)) {

                List<String> formIds =
                    staff.Accessible_Forms__c.split(';');

                List<Incident_Form__c> staffForms = [
                    SELECT Id,
                           Name__c,
                           Form_JSON__c,
                           Form_Type__c,
                           CreatedDate,
                           CreatedBy.Name,
                           DefaultIncident__c,
                           Status__c
                    FROM Incident_Form__c
                    WHERE Id IN :formIds
                    AND Org_Id__c = :effectiveOrgId
                    ORDER BY CreatedDate DESC
                ];

                for (Incident_Form__c f : staffForms) {
                    if (!addedFormIds.contains(f.Id)) {
                        results.add(f);
                        addedFormIds.add(f.Id);
                    }
                }
            }
        }
    }

    // =====================================================
    // 🔥 DEFAULT INCIDENT — ALWAYS LAST
    // (NO ORG FILTER)
    // =====================================================

    List<Incident_Form__c> defaultForms = [
        SELECT Id,
               Name__c,
               Form_JSON__c,
               Form_Type__c,
               CreatedDate,
               CreatedBy.Name,
               DefaultIncident__c,
               Status__c
        FROM Incident_Form__c
        WHERE Form_Type__c = 'Incident Register'
        AND Status__c = 'Default'
    ];

    for (Incident_Form__c df : defaultForms) {
        if (!addedFormIds.contains(df.Id)) {
            results.add(df);
            addedFormIds.add(df.Id);
        }
    }

    return results;
}




@AuraEnabled(cacheable=true)
public static List<Map<String, Object>> getParticipants(String facilityId) {

    try {

        System.debug('🚀 getParticipants called with facilityId=' + facilityId);

        if (String.isBlank(facilityId)) {
            throw new AuraHandledException('Facility Id is required.');
        }

        // ================================
        // 👥 Fetch Participants ONLY for facility
        // ================================

        List<Client__c> clients = [
            SELECT Id,
                   Name,
                   Display_Nickname__c,
                   Participant_Status__c,
                   Accessible_Forms__c,
                   Facility__c,
                   Facility__r.Name,
                   Status__c
            FROM Client__c
            WHERE Facility__c = :facilityId
              AND Status__c = true   // 🔥 ACTIVE ONLY
            ORDER BY Name
        ];

        // ================================
        // 🧱 Build simple response
        // ================================

        List<Map<String, Object>> output = new List<Map<String, Object>>();

        for (Client__c client : clients) {

            Map<String, Object> clientMap = new Map<String, Object>();

            clientMap.put('Id', client.Id);
            clientMap.put('Name', client.Name);
            clientMap.put('NickName', client.Display_Nickname__c);
            clientMap.put('Participant_Status__c', client.Participant_Status__c);
            clientMap.put('Accessible_Forms__c', client.Accessible_Forms__c);
            clientMap.put('Facility__c', client.Facility__c);
            clientMap.put(
                'Facility_Name',
                client.Facility__r != null
                    ? client.Facility__r.Name
                    : null
            );

            output.add(clientMap);
        }

        System.debug('✅ Participants returned=' + output.size());

        return output;

    } catch (Exception e) {

        System.debug('❌ getParticipants error: ' + e.getMessage());

        throw new AuraHandledException(
            'Error retrieving participants: ' + e.getMessage()
        );
    }
}
@AuraEnabled
public static String getStaffEmailById(Id staffId) {
    if (staffId == null) return null;

    Staff__c staff = [
        SELECT Email_Address__c
        FROM Staff__c
        WHERE Id = :staffId
        LIMIT 1
    ];

    return staff.Email_Address__c;
}


@AuraEnabled
public static String fetchImageAsBase64(String url) {
    Http h = new Http();
    HttpRequest req = new HttpRequest();
    req.setEndpoint(url);
    req.setMethod('GET');

    HttpResponse res = h.send(req);

    if (res.getStatusCode() != 200) {
        throw new AuraHandledException('Failed to fetch image');
    }

    Blob b = res.getBodyAsBlob();
    return EncodingUtil.base64Encode(b);
}

@AuraEnabled
public static List<Staff__c> getStaffsByOrg(Id recordId, Id facilityId) {

    // =====================================
    // 1️⃣ STAFF BY ORG + FACILITY + ACTIVE
    // =====================================
    List<Staff__c> staffList = [
        SELECT Id, Name, Last_Name__c, NameToDisplay__c,
               Email_Address__c, Status__c,
               Facility__r.Organisation__c
        FROM Staff__c
        WHERE Facility__r.Organisation__c = :recordId
        AND Id IN (
            SELECT Staff__c
            FROM Staff_Facility__c
            WHERE Facility__c = :facilityId
            AND Active__c = true
        )
        AND Status__c = true
        AND Email_Address__c != null
    ];

    if (staffList.isEmpty()) {
        return staffList;
    }

    // =====================================
    // 2️⃣ COLLECT STAFF EMAILS (SAFE)
    // =====================================
    Set<String> staffEmails = new Set<String>();

    for (Staff__c s : staffList) {
        if (String.isNotBlank(s.Email_Address__c)) {
            staffEmails.add(
                s.Email_Address__c.trim().toLowerCase()
            );
        }
    }

    if (staffEmails.isEmpty()) {
        return new List<Staff__c>();
    }

    // =====================================
    // 3️⃣ FETCH ACTIVE USERS FOR STAFF
    // =====================================
    Set<String> activeUserEmails = new Set<String>();

    for (User u : [
        SELECT Email
        FROM User
        WHERE IsActive = true
        AND Email != null
        AND Email IN :staffEmails
    ]) {
        if (String.isNotBlank(u.Email)) {
            activeUserEmails.add(
                u.Email.trim().toLowerCase()
            );
        }
    }

    // =====================================
    // 4️⃣ FINAL FILTER (SAFE)
    // =====================================
    List<Staff__c> finalStaff = new List<Staff__c>();

    for (Staff__c s : staffList) {

        if (
            String.isNotBlank(s.Email_Address__c) &&
            activeUserEmails.contains(
                s.Email_Address__c.trim().toLowerCase()
            )
        ) {
            finalStaff.add(s);
        }
    }

    return finalStaff;
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
        //throw new AuraHandledException('Failed to send email: ' + e.getMessage());
    }
}


}