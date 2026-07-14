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
            WHERE Form_Type__c = 'Incident Register'           ORDER BY CreatedDate DESC ];    } catch (Exception e) {        System.debug('❌ Error fetching forms: ' + e.getMessage());        throw new AuraHandledException('Error retrieving forms: ' + e.getMessage());
    }
}


@AuraEnabled
public static void saveFormResponse(Id formId, String responseJson, String orgId, String clientId, String formName, String formType, String statusValue, Id assignedStaffId,  Id facilityId, List<Id> priorityStaffIds) {
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
    //manendra added
  createIncidentNotifications(response, priorityStaffIds);
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
        return new List<Incident_Register_Response__c>();    } catch (Exception e) {        throw new AuraHandledException(           'Error retrieving form responses: ' + e.getMessage()
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

    if (records.isEmpty()) {        return null;
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
        if (clientId == null) {            throw new AuraHandledException('Client ID cannot be null.');
        }

        return [
            SELECT Id, Name__c, Form_Type__c, Response_JSON__c, CreatedDate, Client_Id__c, Assigned_Staff__c, Status__c,Incident_Assigned_Staff__c,
            Incident_Assigned_Staff__r.Name,Incident_Form__c 
            FROM Incident_Register_Response__c
            WHERE Client_Id__c = :clientId            ORDER BY CreatedDate DESC        ];    } catch (Exception e) {       throw new AuraHandledException('Error retrieving form responses: ' + e.getMessage());
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

        update existingResponse;    } catch (Exception e) {       throw new AuraHandledException('Error updating form response: ' + e.getMessage());
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
        delete response;    } catch (Exception e) {        throw new AuraHandledException(           'Error deleting form response: ' + e.getMessage()
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

        if (staffList.isEmpty()) {         return staffList;        }        /* =====================================    📧 COLLECT STAFF EMAILS      =====================================*/       Set<String> staffEmails = new Set<String>();        for (Staff__c s : staffList) {         if (String.isNotBlank(s.Email_Address__c)) {          staffEmails.add(        s.Email_Address__c.trim().toLowerCase()       );         }       }        if (staffEmails.isEmpty()) {       return new List<Staff__c>();       }        Set<String> activeUserEmails = new Set<String>();      for (User u : [ SELECT Email FROM User WHERE IsActive = true AND Email != null AND Email IN :staffEmails ]) {   if (String.isNotBlank(u.Email)) {         activeUserEmails.add(              u.Email.trim().toLowerCase()        ); }}        List<Staff__c> finalStaff = new List<Staff__c>();        for (Staff__c s : staffList) {          if (       String.isNotBlank(s.Email_Address__c) &&          activeUserEmails.contains(            s.Email_Address__c.trim().toLowerCase()            )         ) {                finalStaff.add(s);           }       }       return finalStaff;

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
        return forms;    } catch (Exception e) {       System.debug('❌ Error fetching accessible forms: ' + e.getMessage());       throw new AuraHandledException('Error retrieving form records: ' + e.getMessage());
    }
}
@AuraEnabled
public static void grantAccessToStaff(List<Id> staffIds, List<String> selectedFormIds) {
    System.debug('🔹 Entering grantAccessToStaff() (Bulk Mode)...');

    if (staffIds == null || staffIds.isEmpty()) {        throw new AuraHandledException('Staff IDs cannot be null or empty.');
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

    if (String.isBlank(org.Organization_Logo__c)) {        return null;
    }

    Pattern p = Pattern.compile('<img[^>]+src="([^"]+)"');
    Matcher m = p.matcher(org.Organization_Logo__c);

    if (m.find()) {
        return m.group(1); /* 👈 RETURN RAW RELATIVE URL */    }    return null;
}






@AuraEnabled
public static List<Staff__c> getEmployeeData(String facilityId) {
    try {
        System.debug('▶️ getEmployeeData called');
        System.debug('🏢 Facility Id received: ' + facilityId);

        // -----------------------------------------------------
        // 1️⃣ Validate input
        // -----------------------------------------------------
        if (String.isBlank(facilityId)) {            System.debug('⚠️ Facility Id is null or empty');            return new List<Staff__c>();
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

        return staffList;    } catch (Exception e) {        System.debug('❌ Error in getEmployeeData: ' + e.getMessage());        throw new AuraHandledException(            'Error fetching staff data: ' + e.getMessage()
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

    if (staffIds == null || staffIds.isEmpty()) {        throw new AuraHandledException('No staff selected.');
    }

    if (formIds == null || formIds.isEmpty()) {        throw new AuraHandledException('No forms selected.');
    }

    // Query staff records
    List<Staff__c> staffList = [
        SELECT Id, Accessible_Forms__c
        FROM Staff__c
        WHERE Id IN :staffIds
    ];

    if (staffList.isEmpty()) {        throw new AuraHandledException('No matching staff records found.');
    }

    // Append + de-duplicate
    for (Staff__c staff : staffList) {

        Set<String> mergedFormIds = new Set<String>();

        if (!String.isBlank(staff.Accessible_Forms__c)) {            mergedFormIds.addAll(staff.Accessible_Forms__c.split(';'));
        }

        for (Id formId : formIds) {
            mergedFormIds.add(String.valueOf(formId));
        }

        staff.Accessible_Forms__c =            mergedFormIds.isEmpty() ? null: String.join(new List<String>(mergedFormIds),';' );
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

    if (layoutId == null) {       throw new AuraHandledException('Layout Id is required for deletion.');
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
                    ? client.Facility__r.Name: null
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

    if (res.getStatusCode() != 200) {        throw new AuraHandledException('Failed to fetch image');
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


// @AuraEnabled
// public static void sendFormDetailsToStaff(String emailAddress, String formDataHtml) {
//     try {
//         if (String.isNotBlank(emailAddress)) {
//             // Fetch Org-Wide Email
//             List<OrgWideEmailAddress> orgWideEmailList = [
//                 SELECT Id, Address 
//                 FROM OrgWideEmailAddress 
//                 WHERE Address = :System.Label.OrgWideEmailAddress 
//                 LIMIT 1
//             ];

//             if (orgWideEmailList.isEmpty()) {
//                 System.debug('❌ No OrgWideEmailAddress found for label: ' + System.Label.OrgWideEmailAddress);
//                 throw new AuraHandledException('Org-Wide Email Address not configured or verified.');
//             }

//             OrgWideEmailAddress orgWideEmail = orgWideEmailList[0];

//             // Compose Email
//             Messaging.SingleEmailMessage emailMessage = new Messaging.SingleEmailMessage();
//             emailMessage.setToAddresses(new String[] { emailAddress });
//             emailMessage.setSubject('You have been assigned a form response');
//             emailMessage.setHtmlBody(formDataHtml);
//             emailMessage.setOrgWideEmailAddressId(orgWideEmail.Id);

//             // Send Email
//             Messaging.sendEmail(new Messaging.SingleEmailMessage[] { emailMessage });

//             System.debug('✅ Email sent successfully to: ' + emailAddress + ' from: ' + orgWideEmail.Address);
//         } else {
//             System.debug('❌ Email address is blank.');
//             throw new AuraHandledException('Email address is empty.');
//         }
//     } catch (Exception e) {
//         System.debug('❌ Apex Exception in sendFormDetailsToStaff: ' + e.getMessage());
//         throw new AuraHandledException('Failed to send email: ' + e.getMessage());
//     }
// }


//For different email purpose only
@AuraEnabled
public static void sendFormDetailsToStaffEdit(
    String emailAddress,
    String formDataHtml,
    Id     orgId,
    String participantName,
    String assignedToName
) {
    try {

        // ── Step 1: Fetch Org-Wide Email ──────────────────────────────
        // List<OrgWideEmailAddress> orgWideEmailList = [
        //     SELECT Id, Address
        //     FROM   OrgWideEmailAddress
        //     WHERE  Address = :System.Label.OrgWideEmailAddress
        //     LIMIT  1
        // ];

        // if (orgWideEmailList.isEmpty()) {
        //     throw new AuraHandledException(
        //         'Org-Wide Email Address not configured or verified.'
        //     );
        // }
        // OrgWideEmailAddress orgWideEmail = orgWideEmailList[0];

        User currentUser = [
            SELECT Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        Organisation__c orgObj = [
            SELECT Email__c
            FROM Organisation__c
            WHERE Name = :currentUser.Organization_Name__c
            LIMIT 1
        ];

        String senderEmailAddress = orgObj.Email__c;

        // ── Step 2: Resolve field values ──────────────────────────────

        // Participant: from JS options[isSelected] — fallback to HTML scan
        String detectedParticipant = String.isNotBlank(participantName)
            ? participantName.trim(): extractFieldFromHtml(formDataHtml, 'participant');

        // Assigned To: from JS options[isSelected] — fallback to HTML scan
        String detectedAssignedTo = String.isNotBlank(assignedToName)
            ? assignedToName.trim() : extractFieldFromHtml(formDataHtml, 'assigned to');

        // Reported By: logged-in Salesforce user
        String detectedReportedBy = UserInfo.getName();

        // Reported On: server-side timestamp
        String detectedReportedOn = System.now().format('dd/MM/yyyy HH:mm');

        // Priority: extracted from rendered HTML summary
        String detectedPriority = extractFieldFromHtml(formDataHtml, 'priority');
        if (String.isNotBlank(detectedPriority)) {            detectedPriority = detectedPriority.trim().capitalize();
        }

        System.debug('🔍 Priority: '    + detectedPriority);
        System.debug('🔍 Participant: ' + detectedParticipant);
        System.debug('🔍 Assigned To: ' + detectedAssignedTo);
        System.debug('🔍 Reported By: ' + detectedReportedBy);
        System.debug('🔍 Reported On: ' + detectedReportedOn);

        // ── Step 3: Resolve org name ──────────────────────────────────
        String orgName = 'Your Organisation';
        if (orgId != null) {
            List<Organisation__c> orgList = [
                SELECT Name
                FROM   Organisation__c
                WHERE  Id = :orgId
                LIMIT  1
            ];
            if (!orgList.isEmpty()) {
                orgName = orgList[0].Name;
            }
        }

        // ── Step 4: Build email list ──────────────────────────────────
        // List<Messaging.SingleEmailMessage> emailsToSend = new List<Messaging.SingleEmailMessage>();

        List<Object> bulkEmails = new List<Object>();

        // ── Step 4a: Staff assignment email — structured HTML ─────────
        if (String.isNotBlank(emailAddress)) {
            String staffHtml = buildStaffAssignmentHtmlEdit(
                detectedParticipant,
                detectedAssignedTo,
                detectedPriority,
                detectedReportedBy,
                detectedReportedOn,
                orgName
            );

            // Messaging.SingleEmailMessage staffMsg = new Messaging.SingleEmailMessage();
            // staffMsg.setToAddresses(new String[]{ emailAddress });
            // staffMsg.setSubject('Incident Assigned to You Has Been Updated');
            // staffMsg.setHtmlBody(staffHtml);
            // staffMsg.setOrgWideEmailAddressId(orgWideEmail.Id);
            // emailsToSend.add(staffMsg);
            // System.debug('✅ Staff email queued for: ' + emailAddress);

            Map<String, Object> staffEmail =
                new Map<String, Object>();

            staffEmail.put(
                'fromEmail',
                senderEmailAddress
            );

            staffEmail.put(
                'toEmail',
                new List<String>{ emailAddress }
            );

            staffEmail.put(
                'subject',
                'Incident Assigned to You Has Been Updated'
            );

            staffEmail.put(
                'body',
                staffHtml
            );

            bulkEmails.add(staffEmail);
        }

        // ── Step 4b: Admin/manager notifications ─────────────────────
        if (orgId != null && String.isNotBlank(detectedPriority)) {            List<Organisation__c> orgConfigList = [ SELECT IR_Notification_Config__c FROM   Organisation__c WHERE  Id = :orgId LIMIT  1 ];             if (!orgConfigList.isEmpty() && String.isNotBlank(orgConfigList[0].IR_Notification_Config__c)) {             Map<String, Object> config;   try {          config = (Map<String, Object>) JSON.deserializeUntyped(       orgConfigList[0].IR_Notification_Config__c       );         } catch (Exception parseEx) {              System.debug('❌ IR_Notification_Config__c malformed: '   + parseEx.getMessage());              config = null;           }                if (config != null) {             Object rawIds = config.get(detectedPriority);

                    if (rawIds != null) {
                        List<Object> userIdObjs = (List<Object>) rawIds;
                        Set<Id> adminUserIds = new Set<Id>();

                        for (Object idObj : userIdObjs) {
                            String raw = String.valueOf(idObj).trim();
                            if (String.isNotBlank(raw)) {
                                try {
                                    adminUserIds.add((Id) raw);
                                } catch (Exception castEx) {
                                    System.debug('⚠️ Invalid User Id: ' + raw);
                                }
                            }
                        }

                        if (!adminUserIds.isEmpty()) {
                            List<User> adminUsers = [
                                SELECT Id, Name, Email
                                FROM   User
                                WHERE  Id      IN :adminUserIds
                                AND    IsActive = true
                                AND    Email   != null
                            ];

                            for (User u : adminUsers) {
                                String adminHtml = buildAdminNotificationHtml(
                                    detectedPriority,
                                    detectedParticipant,
                                    detectedAssignedTo,
                                    detectedReportedBy,
                                    detectedReportedOn,
                                    orgName
                                );

                                // Messaging.SingleEmailMessage adminMsg = new Messaging.SingleEmailMessage();
                                // adminMsg.setToAddresses(new String[]{ u.Email });
                                // adminMsg.setSubject(
                                //     'New Incident Notification — '
                                //     + detectedPriority + ' Priority'
                                // );
                                // adminMsg.setHtmlBody(adminHtml);
                                // adminMsg.setOrgWideEmailAddressId(orgWideEmail.Id);
                                // emailsToSend.add(adminMsg);

                                // System.debug('✅ Admin notification queued for: '
                                //     + u.Name + ' <' + u.Email + '>');
                                Map<String, Object> adminEmail =
                                    new Map<String, Object>();

                                adminEmail.put(
                                    'fromEmail',
                                    senderEmailAddress
                                );

                                adminEmail.put(
                                    'toEmail',
                                    new List<String>{ u.Email }
                                );

                                adminEmail.put(
                                    'subject',
                                    'New Incident Notification — ' +
                                    detectedPriority +
                                    ' Priority'
                                );

                                adminEmail.put(
                                    'body',
                                    adminHtml
                                );

                                bulkEmails.add(adminEmail);
                            }
                        }
                    } else {
                        System.debug('⚠️ No users configured for priority: '
                            + detectedPriority);
                    }
                }
            } else {
                System.debug('⚠️ No IR_Notification_Config__c for org: ' + orgId);
            }
        }

        // ── Step 5: Send all in one bulk call ─────────────────────────
        // if (!emailsToSend.isEmpty()) {
        //     Messaging.sendEmail(emailsToSend);
        //     System.debug('✅ Total emails sent: ' + emailsToSend.size()
        //         + ' (1 staff + ' + (emailsToSend.size() - 1) + ' admin(s))');
        // }

        if (!bulkEmails.isEmpty()) {

            Id jobId =
                System.enqueueJob(

                    new EmailRelayQueueable(
                        bulkEmails
                    )
                );

            System.debug(
                '✅ Incident Update Email Queue Created: ' +
                jobId
            );

            System.debug(
                '✅ Total Emails Queued: ' +
                bulkEmails.size()
            );
        }    } catch (AuraHandledException ahe) {    throw ahe;
    } catch (Exception e) {
        System.debug('❌ sendFormDetailsToStaff: ' + e.getMessage());
        throw new AuraHandledException('Failed to send email: ' + e.getMessage());
    }
}


@AuraEnabled
public static void sendFormDetailsToStaff(
    String emailAddress,
    String formDataHtml,
    Id     orgId,
    String participantName,
    String assignedToName
) {
    try {

        // ── Step 1: Fetch Org-Wide Email ──────────────────────────────
        // List<OrgWideEmailAddress> orgWideEmailList = [
        //     SELECT Id, Address
        //     FROM   OrgWideEmailAddress
        //     WHERE  Address = :System.Label.OrgWideEmailAddress
        //     LIMIT  1
        // ];

        // if (orgWideEmailList.isEmpty()) {
        //     throw new AuraHandledException(
        //         'Org-Wide Email Address not configured or verified.'
        //     );
        // }
        // OrgWideEmailAddress orgWideEmail = orgWideEmailList[0];

        // ── Step 2: Resolve field values ──────────────────────────────

        // Participant: from JS options[isSelected] — fallback to HTML scan
        String detectedParticipant = String.isNotBlank(participantName)
            ? participantName.trim(): extractFieldFromHtml(formDataHtml, 'participant');

        // Assigned To: from JS options[isSelected] — fallback to HTML scan
        String detectedAssignedTo = String.isNotBlank(assignedToName)
            ? assignedToName.trim(): extractFieldFromHtml(formDataHtml, 'assigned to');

        // Reported By: logged-in Salesforce user
        String detectedReportedBy = UserInfo.getName();

        // Reported On: server-side timestamp
        String detectedReportedOn = System.now().format('dd/MM/yyyy HH:mm');

        // Priority: extracted from rendered HTML summary
        String detectedPriority = extractFieldFromHtml(formDataHtml, 'priority');
        if (String.isNotBlank(detectedPriority)) {
            detectedPriority = detectedPriority.trim().capitalize();
        }

        System.debug('🔍 Priority: '    + detectedPriority);
        System.debug('🔍 Participant: ' + detectedParticipant);
        System.debug('🔍 Assigned To: ' + detectedAssignedTo);
        System.debug('🔍 Reported By: ' + detectedReportedBy);
        System.debug('🔍 Reported On: ' + detectedReportedOn);

        // ── Step 3: Resolve org name ──────────────────────────────────
        String orgName = 'Your Organisation';
        if (orgId != null) {
            List<Organisation__c> orgList = [
                SELECT Name
                FROM   Organisation__c
                WHERE  Id = :orgId
                LIMIT  1
            ];
            if (!orgList.isEmpty()) {
                orgName = orgList[0].Name;
            }
        }

        // ── Step 4: Build email list ──────────────────────────────────
        // List<Messaging.SingleEmailMessage> emailsToSend =
        //     new List<Messaging.SingleEmailMessage>();

        List<Object> bulkEmails = new List<Object>();

        User currentUser = [
            SELECT Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        Organisation__c orgObj = [
            SELECT Email__c
            FROM Organisation__c
            WHERE Name = :currentUser.Organization_Name__c
            LIMIT 1
        ];

        String senderEmailAddress = orgObj.Email__c;

        // ── Step 4a: Staff assignment email — structured HTML ─────────
        if (String.isNotBlank(emailAddress)) {
            String staffHtml = buildStaffAssignmentHtml(
                detectedParticipant,
                detectedAssignedTo,
                detectedPriority,
                detectedReportedBy,
                detectedReportedOn,
                orgName
            );

            // Messaging.SingleEmailMessage staffMsg = new Messaging.SingleEmailMessage();
            // staffMsg.setToAddresses(new String[]{ emailAddress });
            // staffMsg.setSubject('You have been assigned an incident');
            // staffMsg.setHtmlBody(staffHtml);
            // staffMsg.setOrgWideEmailAddressId(orgWideEmail.Id);
            // emailsToSend.add(staffMsg);
            // System.debug('✅ Staff email queued for: ' + emailAddress);

            Map<String, Object> staffEmail =
                new Map<String, Object>();

            staffEmail.put(
                'fromEmail',
                senderEmailAddress
            );

            staffEmail.put(
                'toEmail',
                new List<String>{ emailAddress }
            );

            staffEmail.put(
                'subject',
                'You have been assigned an incident'
            );

            staffEmail.put(
                'body',
                staffHtml
            );

            bulkEmails.add(staffEmail);
        }

        // ── Step 4b: Admin/manager notifications ─────────────────────
        if (orgId != null && String.isNotBlank(detectedPriority)) {

            List<Organisation__c> orgConfigList = [
                SELECT IR_Notification_Config__c
                FROM   Organisation__c
                WHERE  Id = :orgId
                LIMIT  1
            ];

            if (!orgConfigList.isEmpty()
                && String.isNotBlank(orgConfigList[0].IR_Notification_Config__c)) {

                Map<String, Object> config;
                try {
                    config = (Map<String, Object>) JSON.deserializeUntyped(
                        orgConfigList[0].IR_Notification_Config__c
                    );
                } catch (Exception parseEx) {
                    System.debug('❌ IR_Notification_Config__c malformed: '
                        + parseEx.getMessage());
                    config = null;
                }

                if (config != null) {
                    Object rawIds = config.get(detectedPriority);

                    if (rawIds != null) {
                        List<Object> userIdObjs = (List<Object>) rawIds;
                        Set<Id> adminUserIds = new Set<Id>();

                        for (Object idObj : userIdObjs) {
                            String raw = String.valueOf(idObj).trim();
                            if (String.isNotBlank(raw)) {
                                try {
                                    adminUserIds.add((Id) raw);
                                } catch (Exception castEx) {
                                    System.debug('⚠️ Invalid User Id: ' + raw);
                                }
                            }
                        }

                        if (!adminUserIds.isEmpty()) {
                            List<User> adminUsers = [
                                SELECT Id, Name, Email
                                FROM   User
                                WHERE  Id      IN :adminUserIds
                                AND    IsActive = true
                                AND    Email   != null
                            ];

                            for (User u : adminUsers) {
                                String adminHtml = buildAdminNotificationHtml(
                                    detectedPriority,
                                    detectedParticipant,
                                    detectedAssignedTo,
                                    detectedReportedBy,
                                    detectedReportedOn,
                                    orgName
                                );

                                // Messaging.SingleEmailMessage adminMsg =
                                //     new Messaging.SingleEmailMessage();
                                // adminMsg.setToAddresses(new String[]{ u.Email });
                                // adminMsg.setSubject(
                                //     'New Incident Notification — '
                                //     + detectedPriority + ' Priority'
                                // );
                                // adminMsg.setHtmlBody(adminHtml);
                                // adminMsg.setOrgWideEmailAddressId(orgWideEmail.Id);
                                // emailsToSend.add(adminMsg);

                                // System.debug('✅ Admin notification queued for: '
                                //     + u.Name + ' <' + u.Email + '>');

                                Map<String, Object> adminEmail =
                                    new Map<String, Object>();

                                adminEmail.put(
                                    'fromEmail',
                                    senderEmailAddress
                                );

                                adminEmail.put(
                                    'toEmail',
                                    new List<String>{ u.Email }
                                );

                                adminEmail.put(
                                    'subject',
                                    'New Incident Notification — ' +
                                    detectedPriority +
                                    ' Priority'
                                );

                                adminEmail.put(
                                    'body',
                                    adminHtml
                                );

                                bulkEmails.add(adminEmail);
                            }
                        }
                    } else {
                        System.debug('⚠️ No users configured for priority: '
                            + detectedPriority);
                    }
                }
            } else {
                System.debug('⚠️ No IR_Notification_Config__c for org: ' + orgId);
            }
        }

        // ── Step 5: Send all in one bulk call ─────────────────────────
        // if (!emailsToSend.isEmpty()) {
        //     Messaging.sendEmail(emailsToSend);
        //     System.debug('✅ Total emails sent: ' + emailsToSend.size()
        //         + ' (1 staff + ' + (emailsToSend.size() - 1) + ' admin(s))');
        // }

        if (!bulkEmails.isEmpty()) {

            Id jobId = System.enqueueJob(

                new EmailRelayQueueable(
                    bulkEmails
                )
            );

            System.debug(
                '✅ Incident Email Queue Created: ' +
                jobId
            );

            System.debug(
                '✅ Total Emails Queued: ' +
                bulkEmails.size()
            );
        }

    } catch (AuraHandledException ahe) {
        throw ahe;
    } catch (Exception e) {
        System.debug('❌ sendFormDetailsToStaff: ' + e.getMessage());
        throw new AuraHandledException('Failed to send email: ' + e.getMessage());
    }
}


// ─────────────────────────────────────────────────────────────────
// PRIVATE HELPER — Staff assignment email HTML
// Sent to the staff member who has been assigned the incident
// ─────────────────────────────────────────────────────────────────
public static String buildStaffAssignmentHtml(
    String participant,
    String assignedTo,
    String priority,
    String reportedBy,
    String reportedOn,
    String orgName
) {
    String safeParticipant = String.isNotBlank(participant) ? participant : 'N/A';
    String safeAssignedTo  = String.isNotBlank(assignedTo)  ? assignedTo  : 'N/A';
    String safeReportedBy  = String.isNotBlank(reportedBy)  ? reportedBy  : 'N/A';
    String safeReportedOn  = String.isNotBlank(reportedOn)
                                ? reportedOn : System.now().format('dd/MM/yyyy HH:mm');
    String safePriority    = String.isNotBlank(priority)    ? priority    : 'N/A';
    String safeOrgName     = String.isNotBlank(orgName)     ? orgName     : 'Your Organisation';

    String priorityColor   = safePriority == 'High'   ? '#c23934'
                           : safePriority == 'Medium' ? '#dd7a01'
                           :                            '#2e7d32';

    return
        '<!DOCTYPE html>'
      + '<html><head><meta charset="UTF-8"></head><body>'
      + '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;'
      + 'background:#ffffff;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">'

      // ── Header ──
      + '<div style="background:#002A52;padding:24px 28px;">'
      + '<h2 style="color:#ffffff;margin:0;font-size:20px;font-weight:700;">'
      + '📋 Incident Assigned to You'
      + '</h2>'
      + '</div>'

      // ── Body ──
      + '<div style="padding:28px 28px 20px;">'

      + '<p style="margin:0 0 20px;color:#333;font-size:14px;line-height:1.6;">'
      + 'Dear <strong>' + safeAssignedTo + '</strong>,</p>'

      + '<p style="margin:0 0 20px;color:#333;font-size:14px;line-height:1.6;">'
      + 'An incident has been assigned to you and requires your attention.</p>'

      // ── Details table ──
      + '<table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;">'

      // Priority
      + '<tr>'
      + '<td style="padding:12px 16px;background:#f3f4f6;font-weight:600;'
      + 'color:#333;width:160px;border:1px solid #e0e0e0;">Priority</td>'
      + '<td style="padding:12px 16px;border:1px solid #e0e0e0;">'
      + '<span style="display:inline-block;background:' + priorityColor + ';'
      + 'color:#fff;font-size:12px;font-weight:700;border-radius:12px;padding:3px 14px;">'
      + safePriority.toUpperCase()
      + '</span>'
      + '</td>'
      + '</tr>'

      // Participant
      + '<tr>'
      + '<td style="padding:12px 16px;background:#f3f4f6;font-weight:600;'
      + 'color:#333;border:1px solid #e0e0e0;">Participant</td>'
      + '<td style="padding:12px 16px;color:#333;border:1px solid #e0e0e0;">'
      + safeParticipant
      + '</td>'
      + '</tr>'

      // Assigned To
      + '<tr>'
      + '<td style="padding:12px 16px;background:#f3f4f6;font-weight:600;'
      + 'color:#333;border:1px solid #e0e0e0;">Assigned To</td>'
      + '<td style="padding:12px 16px;color:#333;border:1px solid #e0e0e0;">'
      + safeAssignedTo
      + '</td>'
      + '</tr>'

      // Reported By
      + '<tr>'
      + '<td style="padding:12px 16px;background:#f3f4f6;font-weight:600;'
      + 'color:#333;border:1px solid #e0e0e0;">Reported By</td>'
      + '<td style="padding:12px 16px;color:#333;border:1px solid #e0e0e0;">'
      + safeReportedBy
      + '</td>'
      + '</tr>'

      // Reported On
      + '<tr>'
      + '<td style="padding:12px 16px;background:#f3f4f6;font-weight:600;'
      + 'color:#333;border:1px solid #e0e0e0;">Reported On</td>'
      + '<td style="padding:12px 16px;color:#333;border:1px solid #e0e0e0;">'
      + safeReportedOn
      + '</td>'
      + '</tr>'

      + '</table>'

      + '<p style="margin:0 0 24px;color:#333;font-size:14px;line-height:1.6;">'
      + 'Please log in to the system to review the complete incident report, '
      + 'associated notes, and complete any required follow-up actions.</p>'

      + '<p style="margin:0;color:#333;font-size:14px;line-height:1.6;">'
      + 'Thank you,<br/>'
      + '<strong>' + safeOrgName + '</strong><br/>'
      + '</p>'

      + '</div>'

      // ── Footer ──
      + '<div style="padding:14px 28px;background:#f3f4f6;border-top:1px solid #e0e0e0;">'
      + '<p style="margin:0;font-size:11px;color:#999;">'
      + 'This is an automated notification. Please do not reply to this email.</p>'
      + '</div>'

      + '</div>'
      + '</body></html>';
}

// ─────────────────────────────────────────────────────────────────
// PRIVATE HELPER — Staff assignment edit email HTML
// Sent to the staff member who has been assigned the incident while editing
// ─────────────────────────────────────────────────────────────────
public static String buildStaffAssignmentHtmlEdit(
    String participant,
    String assignedTo,
    String priority,
    String reportedBy,
    String reportedOn,
    String orgName
) {
    String safeParticipant = String.isNotBlank(participant) ? participant : 'N/A';
    String safeAssignedTo  = String.isNotBlank(assignedTo)  ? assignedTo  : 'N/A';
    String safeReportedBy  = String.isNotBlank(reportedBy)  ? reportedBy  : 'N/A';
    String safeReportedOn  = String.isNotBlank(reportedOn)
                                ? reportedOn : System.now().format('dd/MM/yyyy HH:mm');
    String safePriority    = String.isNotBlank(priority)    ? priority    : 'N/A';
    String safeOrgName     = String.isNotBlank(orgName)     ? orgName     : 'Your Organisation';

    String priorityColor   = safePriority == 'High'   ? '#c23934'
                           : safePriority == 'Medium' ? '#dd7a01'
                           :                            '#2e7d32';

    return
        '<!DOCTYPE html>'
      + '<html><head><meta charset="UTF-8"></head><body>'
      + '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;'
      + 'background:#ffffff;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">'

      // ── Header ──
      + '<div style="background:#002A52;padding:24px 28px;">'
      + '<h2 style="color:#ffffff;margin:0;font-size:20px;font-weight:700;">'
      + '📋 Incident Update Notification'
      + '</h2>'
      + '</div>'

      // ── Body ──
      + '<div style="padding:28px 28px 20px;">'

      + '<p style="margin:0 0 20px;color:#333;font-size:14px;line-height:1.6;">'
      + 'Dear <strong>' + safeAssignedTo + '</strong>,</p>'

      + '<p style="margin:0 0 20px;color:#333;font-size:14px;line-height:1.6;">'
      + 'An incident has been assigned to you and requires your attention.</p>'

      // ── Details table ──
      + '<table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;">'

      // Priority
      + '<tr>'
      + '<td style="padding:12px 16px;background:#f3f4f6;font-weight:600;'
      + 'color:#333;width:160px;border:1px solid #e0e0e0;">Priority</td>'
      + '<td style="padding:12px 16px;border:1px solid #e0e0e0;">'
      + '<span style="display:inline-block;background:' + priorityColor + ';'
      + 'color:#fff;font-size:12px;font-weight:700;border-radius:12px;padding:3px 14px;">'
      + safePriority.toUpperCase()
      + '</span>'
      + '</td>'
      + '</tr>'

      // Participant
      + '<tr>'
      + '<td style="padding:12px 16px;background:#f3f4f6;font-weight:600;'
      + 'color:#333;border:1px solid #e0e0e0;">Participant</td>'
      + '<td style="padding:12px 16px;color:#333;border:1px solid #e0e0e0;">'
      + safeParticipant
      + '</td>'
      + '</tr>'

      // Assigned To
      + '<tr>'
      + '<td style="padding:12px 16px;background:#f3f4f6;font-weight:600;'
      + 'color:#333;border:1px solid #e0e0e0;">Assigned To</td>'
      + '<td style="padding:12px 16px;color:#333;border:1px solid #e0e0e0;">'
      + safeAssignedTo
      + '</td>'
      + '</tr>'

      // Reported By
      + '<tr>'
      + '<td style="padding:12px 16px;background:#f3f4f6;font-weight:600;'
      + 'color:#333;border:1px solid #e0e0e0;">Reported By</td>'
      + '<td style="padding:12px 16px;color:#333;border:1px solid #e0e0e0;">'
      + safeReportedBy
      + '</td>'
      + '</tr>'

      // Reported On
      + '<tr>'
      + '<td style="padding:12px 16px;background:#f3f4f6;font-weight:600;'
      + 'color:#333;border:1px solid #e0e0e0;">Reported On</td>'
      + '<td style="padding:12px 16px;color:#333;border:1px solid #e0e0e0;">'
      + safeReportedOn
      + '</td>'
      + '</tr>'

      + '</table>'

      + '<p style="margin:0 0 24px;color:#333;font-size:14px;line-height:1.6;">'
      + 'Please log in to the system to review the complete incident report, '
      + 'associated notes, and complete any required follow-up actions.</p>'

      + '<p style="margin:0;color:#333;font-size:14px;line-height:1.6;">'
      + 'Thank you,<br/>'
      + '<strong>' + safeOrgName + '</strong><br/>'
      + '</p>'

      + '</div>'

      // ── Footer ──
      + '<div style="padding:14px 28px;background:#f3f4f6;border-top:1px solid #e0e0e0;">'
      + '<p style="margin:0;font-size:11px;color:#999;">'
      + 'This is an automated notification. Please do not reply to this email.</p>'
      + '</div>'

      + '</div>'
      + '</body></html>';
}

// ─────────────────────────────────────────────────────────────────
// PRIVATE HELPER — Builds the admin notification email
// ─────────────────────────────────────────────────────────────────
public static String buildAdminNotificationHtml(
    String priority,
    String participant,
    String assignedTo,    // ← NEW PARAM
    String reportedBy,
    String reportedOn,
    String orgName
) {
    String safeParticipant = String.isNotBlank(participant) ? participant : 'N/A';
    String safeAssignedTo  = String.isNotBlank(assignedTo)  ? assignedTo  : 'N/A';  // ← NEW
    String safeReportedBy  = String.isNotBlank(reportedBy)  ? reportedBy  : 'N/A';
    String safeReportedOn  = String.isNotBlank(reportedOn)
                                ? reportedOn : System.now().format('dd/MM/yyyy HH:mm');
    String safePriority    = String.isNotBlank(priority)    ? priority    : 'N/A';
    String safeOrgName     = String.isNotBlank(orgName)     ? orgName     : 'Your Organisation';

    String priorityColor   = safePriority == 'High'   ? '#c23934' : safePriority == 'Medium' ? '#dd7a01': '#2e7d32';

    return
        '<!DOCTYPE html>'
      + '<html><head><meta charset="UTF-8"></head><body>'
      + '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;'
      + 'background:#ffffff;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">'

      // ── Header ──
      + '<div style="background:#002A52;padding:24px 28px;">'
      + '<h2 style="color:#ffffff;margin:0;font-size:20px;font-weight:700;">'
      + '🔔 New Incident Notification'
      + '</h2>'
      + '</div>'

      // ── Body ──
      + '<div style="padding:28px 28px 20px;">'

      + '<p style="margin:0 0 20px;color:#333;font-size:14px;line-height:1.6;">'
      + 'Dear Team,</p>'

      + '<p style="margin:0 0 20px;color:#333;font-size:14px;line-height:1.6;">'
      + 'An incident has been reported in the system and requires attention.</p>'

      // ── Details table ──
      + '<table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;">'

      // Priority
      + '<tr>'
      + '<td style="padding:12px 16px;background:#f3f4f6;font-weight:600;'
      + 'color:#333;width:160px;border:1px solid #e0e0e0;">Priority</td>'
      + '<td style="padding:12px 16px;border:1px solid #e0e0e0;">'
      + '<span style="display:inline-block;background:' + priorityColor + ';'
      + 'color:#fff;font-size:12px;font-weight:700;border-radius:12px;padding:3px 14px;">'
      + safePriority.toUpperCase()
      + '</span>'
      + '</td>'
      + '</tr>'

      // Participant
      + '<tr>'
      + '<td style="padding:12px 16px;background:#f3f4f6;font-weight:600;'
      + 'color:#333;border:1px solid #e0e0e0;">Participant</td>'
      + '<td style="padding:12px 16px;color:#333;border:1px solid #e0e0e0;">'
      + safeParticipant
      + '</td>'
      + '</tr>'

      // Assigned To ← NEW ROW
      + '<tr>'
      + '<td style="padding:12px 16px;background:#f3f4f6;font-weight:600;'
      + 'color:#333;border:1px solid #e0e0e0;">Assigned To</td>'
      + '<td style="padding:12px 16px;color:#333;border:1px solid #e0e0e0;">'
      + safeAssignedTo
      + '</td>'
      + '</tr>'

      // Reported By
      + '<tr>'
      + '<td style="padding:12px 16px;background:#f3f4f6;font-weight:600;'
      + 'color:#333;border:1px solid #e0e0e0;">Reported By</td>'
      + '<td style="padding:12px 16px;color:#333;border:1px solid #e0e0e0;">'
      + safeReportedBy
      + '</td>'
      + '</tr>'

      // Reported On
      + '<tr>'
      + '<td style="padding:12px 16px;background:#f3f4f6;font-weight:600;'
      + 'color:#333;border:1px solid #e0e0e0;">Reported On</td>'
      + '<td style="padding:12px 16px;color:#333;border:1px solid #e0e0e0;">'
      + safeReportedOn
      + '</td>'
      + '</tr>'

      + '</table>'

      + '<p style="margin:0 0 24px;color:#333;font-size:14px;line-height:1.6;">'
      + 'Please log in to the system to review the complete incident report, '
      + 'associated notes, and any required follow-up actions.</p>'

      + '<p style="margin:0;color:#333;font-size:14px;line-height:1.6;">'
      + 'Thank you,<br/>'
      + '<strong>' + safeOrgName + '</strong><br/>'
      + '</p>'

      + '</div>'

      // ── Footer ──
      + '<div style="padding:14px 28px;background:#f3f4f6;border-top:1px solid #e0e0e0;">'
      + '<p style="margin:0;font-size:11px;color:#999;">'
      + 'This is an automated notification. Please do not reply to this email.</p>'
      + '</div>'

      + '</div>'
      + '</body></html>';
}


// ─────────────────────────────────────────────────────────────────
// PRIVATE HELPER — Generic field extractor from HTML summary
// ─────────────────────────────────────────────────────────────────
private static String extractFieldFromHtml(String html, String fieldLabel) {
    if (String.isBlank(html) || String.isBlank(fieldLabel)) return null;

    String lowerHtml  = html.toLowerCase();
    String lowerLabel = fieldLabel.toLowerCase();

    Integer labelIdx = lowerHtml.indexOf(lowerLabel);
    if (labelIdx == -1) return null;

    Integer scanEnd  = Math.min(labelIdx + 400, lowerHtml.length());
    String  window   = html.substring(labelIdx, scanEnd);
    String  lowerWin = window.toLowerCase();

    Integer endLabelTd = lowerWin.indexOf('</td>');
    if (endLabelTd == -1) return null;

    Integer valueStart = lowerWin.indexOf('<td', endLabelTd);
    if (valueStart == -1) return null;

    Integer valueContentStart = lowerWin.indexOf('>', valueStart);
    if (valueContentStart == -1) return null;
    valueContentStart++;

    Integer valueEnd = lowerWin.indexOf('</td>', valueContentStart);
    if (valueEnd == -1) return null;

    String rawValue = window.substring(valueContentStart, valueEnd);
    rawValue = rawValue.replaceAll('<[^>]+>', '').trim();

    return String.isNotBlank(rawValue) ? rawValue : null;
}


@AuraEnabled(cacheable=true)
public static List<Map<String, Object>> getAdminUsersForOrg(Id orgId) {
    try {
        // Fetch org name first (to scope users to the right org)
        String orgName = [SELECT Name FROM Organisation__c WHERE Id = :orgId LIMIT 1].Name;

        List<User> adminUsers = [
            SELECT Id, Name, Email, User_Type__c, Full_Name__c
            FROM User
            WHERE IsActive = true
              AND (	User_Type__c = 'NDIS Org Admin' OR User_Type__c = 'Roster Manager')
              AND Organization_Name__c = :orgName
            ORDER BY Name ASC
        ];

        List<Map<String, Object>> result = new List<Map<String, Object>>();
        for (User u : adminUsers) {
            Map<String, Object> row = new Map<String, Object>();
            row.put('Id', u.Id);
            row.put('Name', u.Full_Name__c);
            row.put('Email', u.Email);
            row.put('UserType__c', u.User_Type__c);
            result.add(row);
        }
        return result;    } catch (Exception e) {        throw new AuraHandledException('Error fetching admin users: ' + e.getMessage());
    }
}

@AuraEnabled
public static void saveIncidentNotificationConfig(Id orgId, String configJson) {
    try {
        if (orgId == null) {            throw new AuraHandledException('Organisation ID is required.');
        }
        if (String.isBlank(configJson)) {            throw new AuraHandledException('Notification config cannot be blank.');
        }

        // Validate it is parseable JSON before saving
        try {
            JSON.deserializeUntyped(configJson);        } catch (Exception parseEx) {            throw new AuraHandledException('Invalid config format: ' + parseEx.getMessage());
        }

        List<Organisation__c> orgList = [
            SELECT Id
            FROM Organisation__c
            WHERE Id = :orgId
            LIMIT 1
        ];
        if (orgList.isEmpty()) {            throw new AuraHandledException('Organisation not found for ID: ' + orgId);
        }

        // Full overwrite — LWC sends complete High/Medium/Low map every time
        orgList[0].IR_Notification_Config__c = configJson;
        update orgList[0];

        System.debug('IR_Notification_Config__c saved for org: ' + orgId);
        System.debug('Config: ' + configJson);    } catch (AuraHandledException ahe) {        throw ahe;    } catch (Exception e) {        System.debug('saveIncidentNotificationConfig error: ' + e.getMessage());        throw new AuraHandledException('Error saving notification config: ' + e.getMessage());
    }
}

@AuraEnabled(cacheable=false)
public static String getIncidentNotificationConfig(Id orgId) {
    try {
        if (orgId == null) {            throw new AuraHandledException('Organisation ID is required.');
        }
        List<Organisation__c> orgList = [
            SELECT IR_Notification_Config__c
            FROM Organisation__c
            WHERE Id = :orgId
            LIMIT 1
        ];
        if (orgList.isEmpty() || String.isBlank(orgList[0].IR_Notification_Config__c)) {
            // Return empty structure so LWC always gets valid JSON
            return '{"High":[],"Medium":[],"Low":[]}';        }       return orgList[0].IR_Notification_Config__c;    } catch (AuraHandledException ahe) {        throw ahe;    } catch (Exception e) {        System.debug('getIncidentNotificationConfig error: ' + e.getMessage());        throw new AuraHandledException('Error retrieving notification config: ' + e.getMessage());
    }
}
//manendra added below method for creating notification when incident is assigned to staff while editing the incident record
    private static void createIncidentNotifications(
        Incident_Register_Response__c response,
        List<Id> priorityStaffIds
    ) {

        try {

            Set<Id> notifyStaffIds = new Set<Id>();

            // Assigned staff
            if (response.Incident_Assigned_Staff__c != null) {

                notifyStaffIds.add(
                    response.Incident_Assigned_Staff__c
                );
            }

            // Priority users
        
    if (
        priorityStaffIds != null &&
        !priorityStaffIds.isEmpty()
    ) {

        Set<String> userEmails =
            new Set<String>();

        // Fetch User Emails
        for (User u : [
            SELECT Id, Email
            FROM User
            WHERE Id IN :priorityStaffIds ]) {            if (String.isNotBlank(u.Email)) {      userEmails.add(u.Email.trim().toLowerCase() );
            }
        }

        // Match Staff by Email
        if (!userEmails.isEmpty()) {            for (Staff__c s : [ SELECT Id, Email_Address__c FROM Staff__c WHERE Email_Address__c IN :userEmails]) {              notifyStaffIds.add(s.Id);            }
        }
    }

            // Remove nulls safety
            notifyStaffIds.remove(null);

            // No recipients
            if (notifyStaffIds.isEmpty()) {                return;
            }
            System.debug(
                '🔥 Final notifyStaffIds: ' +
                notifyStaffIds
            );
            List<Notifications__c> notificationsToInsert =
                new List<Notifications__c>();

            for (Id staffId : notifyStaffIds) {

                Notifications__c notification =
                    new Notifications__c();
            notification.Title__c = 'New Incident Assigned';
                notification.Staff__c = staffId;
                notification.Record_Id__c = response.Id;
                notification.Type__c = 'Incident';
                notification.Is_Read__c = false;
                notification.Message__c =
                    'New Incident Assigned';
                notification.Module__c = 'Incident Register';

                notificationsToInsert.add(notification);
            }

        if (!notificationsToInsert.isEmpty()) {

        System.debug(
            '🔥 Notifications to insert count: ' +
            notificationsToInsert.size()
        );

        System.debug(
            '🔥 Notifications data: ' +
            notificationsToInsert
        );

        insert notificationsToInsert;

        System.debug(
            '✅ Incident notifications created: ' +
            notificationsToInsert.size()
        );
        List<Notification_Event__e> events =
    new List<Notification_Event__e>();

for (Notifications__c ntf : notificationsToInsert) {

    Notification_Event__e evt =
        new Notification_Event__e(

            Staff_Id__c =
                String.valueOf(
                    ntf.Staff__c
                ),

            Record_Id__c =
                ntf.Record_Id__c,
                  Module__c = 'Incident Register',

            Type__c =
                'Incident'
        );

    events.add(evt);
}

if (!events.isEmpty()) {

    EventBus.publish(events);    System.debug(  '🚀 Incident platform events published: ' +   events.size() );}   }        } catch (Exception e) {

            System.debug( '❌ createIncidentNotifications Error: ' +   e.getMessage()   );
        }
    }

    @AuraEnabled 
public static List<Id> getUnreadIncidentRecordIds(
    Id staffId
) {

    try {

        List<Id> incidentIds =
            new List<Id>();

        for (Notifications__c ntf : [

            SELECT Record_Id__c
            FROM Notifications__c
            WHERE Staff__c = :staffId
            AND Type__c = 'Incident'
            AND Is_Read__c = false

        ]) {

            if (ntf.Record_Id__c != null) {

                incidentIds.add(
                    ntf.Record_Id__c
                );
            }
        }

        return incidentIds;

    } catch (Exception e) {

        throw new AuraHandledException(
            e.getMessage()
        );
    }
}



public static void sendIncidentNotificationFromApi(
    Id orgId,
    Id assignedStaffId,
    String participantName,
    String assignedToName,
    String priority,
    Boolean isUpdate
) {

    try {

        List<Object> bulkEmails = new List<Object>();

        Staff__c assignedStaff = null;

        if (assignedStaffId != null) {            List<Staff__c> staffList = [SELECT Id,Name,Email_Address__c FROM Staff__c WHERE Id = :assignedStaffId LIMIT 1];           if (!staffList.isEmpty()) {       assignedStaff = staffList[0];            }
        }

        String orgName = 'Your Organisation';

        Organisation__c orgObj = [
            SELECT Id,
                   Name,
                   Email__c,
                   IR_Notification_Config__c
            FROM Organisation__c
            WHERE Id = :orgId
            LIMIT 1
        ];

        orgName = orgObj.Name;

        String senderEmail =
            orgObj.Email__c;

        String reportedBy =
            'Mobile Application';

        String reportedOn =
            System.now().format('dd/MM/yyyy HH:mm');

        // Staff Email
        if (assignedStaff != null &&
    String.isNotBlank(assignedStaff.Email_Address__c)) {

            String htmlBody;

            if (isUpdate) {

                htmlBody =
                    buildStaffAssignmentHtmlEdit(
                        participantName,
                        assignedToName,
                        priority,
                        reportedBy,
                        reportedOn,
                        orgName
                    );

            } else {

                htmlBody =
                    buildStaffAssignmentHtml(
                        participantName,
                        assignedToName,
                        priority,
                        reportedBy,
                        reportedOn,
                        orgName
                    );
            }

            bulkEmails.add(
                new Map<String,Object>{
                    'fromEmail' => senderEmail,
                    'toEmail'   => new List<String>{
                        assignedStaff.Email_Address__c
                    },
                    'subject'   => isUpdate
                        ? 'Incident Assigned to You Has Been Updated'
                        : 'You have been assigned an incident',
                    'body'      => htmlBody
                }
            );
        }

        // Admin Notifications
        if (String.isNotBlank(priority) &&
            String.isNotBlank(orgObj.IR_Notification_Config__c)) {

            Map<String,Object> config =
                (Map<String,Object>)JSON.deserializeUntyped(
                    orgObj.IR_Notification_Config__c
                );

            List<Object> rawIds =
                (List<Object>)config.get(priority);

            if (rawIds != null &&
                !rawIds.isEmpty()) {

                Set<Id> adminIds = new Set<Id>();

                for (Object obj : rawIds) {
                    adminIds.add(
                        (Id)String.valueOf(obj)
                    );
                }

                for (User u : [
                    SELECT Id, Email
                    FROM User
                    WHERE Id IN :adminIds
                    AND IsActive = true
                    AND Email != null
                ]) {

                    bulkEmails.add(
                        new Map<String,Object>{
                            'fromEmail' => senderEmail,
                            'toEmail'   => new List<String>{
                                u.Email
                            },
                            'subject'   =>
                                'New Incident Notification — ' +
                                priority +
                                ' Priority',
                            'body' =>
                                buildAdminNotificationHtml(
                                    priority,
                                    participantName,
                                    assignedToName,
                                    reportedBy,
                                    reportedOn,
                                    orgName
                                )
                        }
                    );
                }
            }
        }

        if (!bulkEmails.isEmpty()) {

            System.enqueueJob(
                new EmailRelayQueueable(
                    bulkEmails
                )
            );
        }

    } catch (Exception ex) {

        System.debug(
            'API Email Error: ' +
            ex.getMessage()
        );
    }
}

}