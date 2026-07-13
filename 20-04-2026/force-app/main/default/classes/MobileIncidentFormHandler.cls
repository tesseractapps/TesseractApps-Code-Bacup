@RestResource(urlMapping='/IncidentForms/*')
global without sharing class MobileIncidentFormHandler {
/*
@HttpGet
global static void handleGet() {

    RestRequest req = RestContext.request;
    RestResponse res = RestContext.response;

    Map<String, Object> responseMap = new Map<String, Object>();

    try {

        // ====================================================
        // Detect single vs list
        // ====================================================

        String lastSegment =
            req.requestURI != null
                ? req.requestURI.substringAfterLast('/')
                : '';

        Boolean isSingleFormRequest =
            String.isNotBlank(lastSegment) &&
            lastSegment.startsWith('a') &&
            lastSegment.length() >= 15;

       // ====================================================
        // 🟣 FETCH SUBMITTED RESPONSES
        // ====================================================
        
        if (lastSegment == 'responses') {
        
            User u = [
                SELECT Id,
                       Email,
                       User_Type__c,
                       Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
            ];
        
            Id orgId = null;
        
            if (String.isNotBlank(u.Organization_Name__c)) {
                orgId = [
                    SELECT Id
                    FROM Organisation__c
                    WHERE Name = :u.Organization_Name__c
                    LIMIT 1
                ].Id;
            }
        
            // 🔥 NEW — facility from params
            String facilityIdStr =
                req.params != null
                    ? req.params.get('facilityId')
                    : null;
        
            Id facilityId =
                String.isNotBlank(facilityIdStr)
                    ? (Id) facilityIdStr
                    : null;
        
            Boolean isAdmin =
                u.User_Type__c == 'NDIS Org Admin' ||
                u.User_Type__c == 'Roster Manager' ||
                u.User_Type__c == 'Facility Admin';
        
            List<Incident_Register_Response__c> responses;
        
            // ============================================
            // 👑 ADMIN — ORG + FACILITY + DEFAULT INCIDENT
            // ============================================
            if (isAdmin && orgId != null) {
        
                String adminSoql =
                    'SELECT Id, Name, Status__c, CreatedDate, Response_JSON__c, ' +
                    'Incident_Form__c, Incident_Form__r.Name__c, ' +
                    'Incident_Assigned_Staff__r.Name, Facility__c, Facility__r.Name ' +
                    'FROM Incident_Register_Response__c ' +
                    'WHERE Org_Id__c = :orgId ' +
                    'AND ( ' +
                    '     Incident_Form__r.Org_Id__c = :orgId ' +
                    '     OR Incident_Form__r.DefaultIncident__c = true ' +
                    ') ';
        
                if (facilityId != null) {
                    adminSoql +=
                        'AND Facility__c = :facilityId ';
                }
        
                adminSoql +=
                    'ORDER BY CreatedDate DESC';
        
                responses = Database.query(adminSoql);
        
            }
            // ============================================
            // 👤 STAFF — SUBMITTED BY USER + DEFAULT
            // ============================================
            else {
        
                String staffSoql =
                    'SELECT Id, Name, Status__c, CreatedDate, Response_JSON__c, ' +
                    'Incident_Form__c, Incident_Form__r.Name__c, ' +
                    'Incident_Assigned_Staff__r.Name, Facility__c, Facility__r.Name ' +
                    'FROM Incident_Register_Response__c ' +
                    'WHERE CreatedById = :UserInfo.getUserId() ' +
                    'AND Org_Id__c = :orgId ' +
                    'AND ( ' +
                    '     Incident_Form__r.Org_Id__c = :orgId ' +
                    '     OR Incident_Form__r.DefaultIncident__c = true ' +
                    ') ';
        
                if (facilityId != null) {
                    staffSoql +=
                        'AND Facility__c = :facilityId ';
                }
        
                staffSoql +=
                    'ORDER BY CreatedDate DESC';
        
                responses = Database.query(staffSoql);
            }
        
            responseMap.put('success', true);
            responseMap.put('recordCount', responses.size());
            responseMap.put('responses', responses);
        
            res.statusCode = 200;
            res.responseBody =
                Blob.valueOf(JSON.serialize(responseMap));
            return;
        }



        // ====================================================
        // 🔵 SINGLE FORM
        // ====================================================

        if (isSingleFormRequest) {

            Incident_Form__c form = [
                SELECT Id,
                       Name,
                       Name__c,
                       Form_JSON__c,
                       CreatedDate,
                       DefaultIncident__c,
                       Org_Id__c,
                       Status__c
                FROM Incident_Form__c
                WHERE Id = :lastSegment
                LIMIT 1
            ];

            responseMap.put('success', true);
            responseMap.put('form', form);

            res.statusCode = 200;
            res.responseBody =
                Blob.valueOf(JSON.serialize(responseMap));
            return;
        }

        // ====================================================
        // 🔐 Logged in User + Org
        // ====================================================

        User u = [
            SELECT Id,
                   Email,
                   User_Type__c,
                   Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
        ];

        String email = u.Email;

        Id orgId = null;

        if (String.isNotBlank(u.Organization_Name__c)) {

            orgId = [
                SELECT Id
                FROM Organisation__c
                WHERE Name = :u.Organization_Name__c
                LIMIT 1
            ].Id;
        }

        // ====================================================
        // Role detection
        // ====================================================

        Boolean isAdmin =
            u.User_Type__c == 'NDIS Org Admin';

        List<Incident_Form__c> forms = new List<Incident_Form__c>();

        // ====================================================
        // 🔓 ADMIN FLOW
        // ====================================================

        if (isAdmin && orgId != null) {

            forms = [
                SELECT Id,
                       Name,
                       Name__c,
                       Form_JSON__c,
                       CreatedDate,
                       DefaultIncident__c,
                       Org_Id__c,
                       Status__c
                FROM Incident_Form__c
                WHERE Org_Id__c = :orgId
                ORDER BY CreatedDate DESC
            ];
        }

        // ====================================================
        // 👩‍⚕️ STAFF FLOW
        // ====================================================

        if (!isAdmin && orgId != null) {

            List<Staff__c> staffList = [
                SELECT Id,
                       Accessible_Forms__c,
                       Organization__c
                FROM Staff__c
                WHERE User__r.Email = :email
                AND Organization__c = :orgId
                LIMIT 1
            ];

            if (!staffList.isEmpty()) {

                Staff__c staff = staffList[0];

                if (String.isNotBlank(staff.Accessible_Forms__c)) {

                    Set<Id> accessibleIds = new Set<Id>();

                    for (String idStr :
                        staff.Accessible_Forms__c.split(';')) {

                        if (String.isNotBlank(idStr)) {
                            accessibleIds.add(
                                (Id) idStr.trim()
                            );
                        }
                    }

                    if (!accessibleIds.isEmpty()) {

                        forms = [
                            SELECT Id,
                                   Name,
                                   Name__c,
                                   Form_JSON__c,
                                   CreatedDate,
                                   DefaultIncident__c,
                                   Org_Id__c,
                                   Status__c
                            FROM Incident_Form__c
                            WHERE Id IN :accessibleIds
                            AND Status__c = 'Published'
                            ORDER BY CreatedDate DESC
                        ];
                    }
                }
            }
        }

        // ====================================================
        // 🔥 ALWAYS APPEND DEFAULT INCIDENT (FOR ALL USERS)
        // ====================================================
        
        // Collect existing IDs
        Set<Id> existingIds = new Set<Id>();
        for (Incident_Form__c f : forms) {
            existingIds.add(f.Id);
        }
        
        // Fetch default forms (global)
        List<Incident_Form__c> defaultForms = [
            SELECT Id,
                   Name,
                   Name__c,
                   Form_JSON__c,
                   CreatedDate,
                   DefaultIncident__c,
                   Status__c
            FROM Incident_Form__c
            WHERE DefaultIncident__c = true
        ];
        
        // Append if missing
        for (Incident_Form__c df : defaultForms) {
            if (!existingIds.contains(df.Id)) {
                forms.add(df);
            }
        }


        // ====================================================
        // RESPONSE
        // ====================================================

        responseMap.put('success', true);
        responseMap.put('recordCount', forms.size());
        responseMap.put('forms', forms);

        res.statusCode = 200;

    } catch (Exception e) {

        responseMap.put('success', false);
        responseMap.put('message', e.getMessage());

        res.statusCode = 500;
    }

    res.responseBody =
        Blob.valueOf(JSON.serialize(responseMap));
}
*/
    
    @HttpGet
global static void handleGet() {

    RestRequest req = RestContext.request;
    RestResponse res = RestContext.response;

    Map<String, Object> responseMap = new Map<String, Object>();
    List<String> debugLogs = new List<String>();

    try {

        // ====================================================
        // Detect single vs list
        // ====================================================

        String lastSegment =
            req.requestURI != null
                ? req.requestURI.substringAfterLast('/') : '';

        debugLogs.add('lastSegment=' + lastSegment);

        Boolean isSingleFormRequest =
            String.isNotBlank(lastSegment) &&
            lastSegment.startsWith('a') &&
            lastSegment.length() >= 15;

        debugLogs.add('isSingleFormRequest=' + isSingleFormRequest);

        // ====================================================
        // 🟣 FETCH SUBMITTED RESPONSES
        // ====================================================
if (lastSegment == 'responses') {

    User u = [
        SELECT Id,
               Email,
               User_Type__c,
               Organization_Name__c
        FROM User
        WHERE Id = :UserInfo.getUserId()
    ];

    debugLogs.add('UserId=' + u.Id);
    debugLogs.add('UserType=' + u.User_Type__c);
    debugLogs.add('OrgNameOnUser=' + u.Organization_Name__c);

    // ================================
    // ORG RESOLUTION
    // ================================

    Id orgId = null;

    if (String.isNotBlank(u.Organization_Name__c)) {

        List<Organisation__c> orgList = [
            SELECT Id
            FROM Organisation__c
            WHERE Name = :u.Organization_Name__c
            LIMIT 1
        ];

        debugLogs.add('OrgLookupCount=' + orgList.size());

        if (!orgList.isEmpty()) { orgId = orgList[0].Id;
        }
    }

    debugLogs.add('ResolvedOrgId=' + orgId);

    // ================================
    // FACILITY PARAM
    // ================================

    String facilityIdStr =
        req.params != null
            ? req.params.get('facilityId') : null;

    debugLogs.add('facilityIdStr=' + facilityIdStr);

    Id facilityId = null;

    if (String.isNotBlank(facilityIdStr)) { try { facilityId = (Id) facilityIdStr; } catch (Exception ex) { debugLogs.add('FacilityIdCastFailed'); throw ex;
        }
    }

    debugLogs.add('ResolvedFacilityId=' + facilityId);

    // ================================
    // STAFF RESOLUTION VIA EMAIL
    // ================================

    Id staffId;

    List<Staff__c> staffLookup = [
        SELECT Id, Organization__c, Email_Address__c
        FROM Staff__c
        WHERE Email_Address__c = :u.Email
        AND Organization__c = :orgId
        LIMIT 1
    ];

    debugLogs.add('StaffLookupCount=' + staffLookup.size());

    if (!staffLookup.isEmpty()) { staffId = staffLookup[0].Id;
    }

    debugLogs.add('ResolvedStaffId=' + staffId);

    // ================================
    // ROLE
    // ================================

    Boolean isAdmin =
        u.User_Type__c == 'NDIS Org Admin' || u.User_Type__c == 'Roster Manager' || u.User_Type__c == 'Facility Admin';

    debugLogs.add('isAdmin=' + isAdmin);

    // ================================
    // DEBUG COUNTS
    // ================================

    if (orgId != null) { Integer orgTotal = [ SELECT count() FROM Incident_Register_Response__c WHERE Org_Id__c = :orgId ]; debugLogs.add('OrgTotalResponses=' + orgTotal);
    }

    if (staffId != null) { Integer staffAssigned = [ SELECT count() FROM Incident_Register_Response__c WHERE Incident_Assigned_Staff__c = :staffId ]; debugLogs.add('StaffAssignedResponses=' + staffAssigned);
    }

    List<Incident_Register_Response__c> responses;

    // ================================
    // CURRENT USER (FOR QUERY + FLAGS)
    // ================================

    Id currentUserId = UserInfo.getUserId();

    // ============================================
    // 👑 ADMIN — ORG + FACILITY + DEFAULT
    // ============================================

    if (isAdmin && orgId != null) {

        String adminSoql =
            'SELECT Id, Name, Status__c, CreatedDate, Response_JSON__c, CreatedById, ' +
            'Incident_Form__c, Incident_Form__r.Name__c, ' +
            'Incident_Assigned_Staff__c, Incident_Assigned_Staff__r.Name, ' +
            'Facility__c, Facility__r.Name ' +
            'FROM Incident_Register_Response__c ' +
            'WHERE Org_Id__c = :orgId ' +
            'AND (Incident_Form__r.Org_Id__c = :orgId ' +
            'OR Incident_Form__r.DefaultIncident__c = true) ';

        if (facilityId != null) {
            adminSoql += 'AND Facility__c = :facilityId ';
        }

        adminSoql += 'ORDER BY CreatedDate DESC';

        debugLogs.add('AdminSoqlBuilt');

        responses = Database.query(adminSoql);

        debugLogs.add('AdminResults=' + responses.size());
    }

    // ============================================
    // 👤 STAFF — ASSIGNED OR CREATED BY USER
    // ============================================

    else {

        if (staffId == null) {

            debugLogs.add('NoStaffRecordFound — returning empty list');
            responses = new List<Incident_Register_Response__c>();

        } else {

            String staffSoql =
                'SELECT Id, Name, Status__c, CreatedDate, Response_JSON__c, ' +
                'CreatedById, ' +
                'Incident_Form__c, Incident_Form__r.Name__c, ' +
                'Incident_Assigned_Staff__c, Incident_Assigned_Staff__r.Name, ' +
                'Facility__c, Facility__r.Name ' +
                'FROM Incident_Register_Response__c ' +
                'WHERE (Incident_Assigned_Staff__c = :staffId ' +
                'OR CreatedById = :currentUserId) ' +
                'AND Org_Id__c = :orgId ' +
                'AND (Incident_Form__r.Org_Id__c = :orgId ' +
                'OR Incident_Form__r.DefaultIncident__c = true) ';

            if (facilityId != null) {
                staffSoql += 'AND Facility__c = :facilityId ';
            }

            staffSoql += 'ORDER BY CreatedDate DESC';

            debugLogs.add('StaffSoqlBuilt');

            responses = Database.query(staffSoql);

            debugLogs.add('StaffResults=' + responses.size());
        }
    }

    // ================================
    // ADD FLAGS
    // ================================

    List<Map<String,Object>> wrappedResponses =
        new List<Map<String,Object>>();

    for (Incident_Register_Response__c r : responses) { Boolean canEdit = true; Boolean canDelete = isAdmin || r.CreatedById == currentUserId; Map<String,Object> row = (Map<String,Object>)JSON.deserializeUntyped(JSON.serialize(r)); row.put('canEdit', canEdit); row.put('canDelete', canDelete); wrappedResponses.add(row);
    }

    // ================================
    // FINAL RESPONSE
    // ================================

    responseMap.put('success', true);
    responseMap.put('recordCount', wrappedResponses.size());
    responseMap.put('responses', wrappedResponses);
    responseMap.put('debug', debugLogs);

    res.statusCode = 200;
    res.responseBody =
        Blob.valueOf(JSON.serialize(responseMap));
    return;
} 
        // ====================================================

        if (isSingleFormRequest) {

            Incident_Form__c form = [
                SELECT Id,
                       Name,
                       Name__c,
                       Form_JSON__c,
                       CreatedDate,
                       DefaultIncident__c,
                       Org_Id__c,
                       Status__c
                FROM Incident_Form__c
                WHERE Id = :lastSegment
                LIMIT 1
            ];

            responseMap.put('success', true);
            responseMap.put('form', form);

            res.statusCode = 200;
            res.responseBody =
                Blob.valueOf(JSON.serialize(responseMap));
            return;
        }

        // ====================================================
        // 🔐 Logged in User + Org
        // ====================================================

        User u = [
            SELECT Id,
                   Email,
                   User_Type__c,
                   Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
        ];

        String email = u.Email;

        Id orgId = null;

        if (String.isNotBlank(u.Organization_Name__c)) {

            orgId = [
                SELECT Id
                FROM Organisation__c
                WHERE Name = :u.Organization_Name__c
                LIMIT 1
            ].Id;
        }

        Boolean isAdmin =
            u.User_Type__c == 'NDIS Org Admin';

        List<Incident_Form__c> forms = new List<Incident_Form__c>();

        if (isAdmin && orgId != null) {

            forms = [
                SELECT Id,
                       Name,
                       Name__c,
                       Form_JSON__c,
                       CreatedDate,
                       DefaultIncident__c,
                       Org_Id__c,
                       Status__c
                FROM Incident_Form__c
                WHERE Org_Id__c = :orgId
                ORDER BY CreatedDate DESC
            ];
        }

        if (!isAdmin && orgId != null) {

            List<Staff__c> staffList = [
        SELECT Id,
               Accessible_Forms__c,
               Organization__c,
               Email_Address__c
        FROM Staff__c
        WHERE Email_Address__c = :email
        AND Organization__c = :orgId
        LIMIT 1
    ];

            if (!staffList.isEmpty()) { Staff__c staff = staffList[0]; if (String.isNotBlank(staff.Accessible_Forms__c)) { Set<Id> accessibleIds = new Set<Id>(); for (String idStr : staff.Accessible_Forms__c.split(';')) { if (String.isNotBlank(idStr)) { accessibleIds.add( (Id) idStr.trim()
                            );
                        }
                    }

                    if (!accessibleIds.isEmpty()) {

                        forms = [
                            SELECT Id,
                                   Name,
                                   Name__c,
                                   Form_JSON__c,
                                   CreatedDate,
                                   DefaultIncident__c,
                                   Org_Id__c,
                                   Status__c
                            FROM Incident_Form__c
                            WHERE Id IN :accessibleIds
                            ORDER BY CreatedDate DESC
                        ];
                    }
                }
            }
        }

        // ====================================================
        // 🔥 ALWAYS APPEND DEFAULT INCIDENT
        // ====================================================

        Set<Id> existingIds = new Set<Id>();
        for (Incident_Form__c f : forms) {
            existingIds.add(f.Id);
        }

        List<Incident_Form__c> defaultForms = [
            SELECT Id,
                   Name,
                   Name__c,
                   Form_JSON__c,
                   CreatedDate,
                   DefaultIncident__c,
                   Status__c
            FROM Incident_Form__c
            WHERE DefaultIncident__c = true
        ];

        for (Incident_Form__c df : defaultForms) {
            if (!existingIds.contains(df.Id)) {
                forms.add(df);
            }
        }

        responseMap.put('success', true);
        responseMap.put('recordCount', forms.size());
        responseMap.put('forms', forms);

        res.statusCode = 200; } catch (Exception e) { debugLogs.add('EXCEPTION=' + e.getMessage()); responseMap.put('success', false); responseMap.put('message', e.getMessage()); responseMap.put('debug', debugLogs); res.statusCode = 500;
    }

    res.responseBody =
        Blob.valueOf(JSON.serialize(responseMap));
}


    
@HttpPost
global static void submitIncidentResponse() {

    RestRequest req = RestContext.request;
    RestResponse res = RestContext.response;

    // -------------------------------
    // Empty body protection
    // -------------------------------
    if (req.requestBody == null ||
        String.isBlank(req.requestBody.toString())) { res.statusCode = 400; res.responseBody = Blob.valueOf( JSON.serialize( new Map<String,Object>{ 'success' => false, 'message' => 'Request body is empty'
                    }
                )
            );
        return;
    }

    Map<String,Object> body =
        (Map<String,Object>) JSON.deserializeUntyped(
            req.requestBody.toString()
        );

    Map<String,Object> responseMap = new Map<String,Object>();

    try {

        // -------------------------------
        // Required values
        // -------------------------------
        String formId     = (String) body.get('formId');
        String status     = (String) body.get('status');
        String jsonPayload = (String) body.get('json');

        // 🔥 orgId from payload
        String orgId = (String) body.get('orgId');

        if (String.isBlank(orgId)) {
            throw new AuraHandledException('orgId is required');
        }

        // -------------------------------
        // OPTIONAL values
        // -------------------------------
        String assignedStaffId =
            (String) body.get('assignedStaffId');

        String formType =
            (String) body.get('formType');

        String nameVal =
            (String) body.get('name');

        // 🔥 NEW — FACILITY
        String facilityId =
            (String) body.get('facilityId');

        // -------------------------------
        // Fetch Form (optional validation)
        // -------------------------------
        Incident_Form__c form = [
            SELECT Id, Org_Id__c
            FROM Incident_Form__c
            WHERE Id = :formId
            LIMIT 1
        ];

        if (form.Org_Id__c != orgId) {
            System.debug('⚠️ OrgId mismatch between form and request');
        }

        // -------------------------------
        // AWS upload
        // -------------------------------
        String key = generateAwsKey(orgId, 'submit');

        Map<String,Object> aws =
            uploadJsonToAws(jsonPayload, 'docimgupld', key, false);

        // -------------------------------
        // Insert response
        // -------------------------------
        Incident_Register_Response__c rec =
            new Incident_Register_Response__c();

        rec.Incident_Form__c = formId;
        rec.Status__c = status;
        rec.Response_JSON__c = JSON.serialize(aws);

        // 🔥 STORE ORG
        rec.Org_Id__c = orgId;

        // 🔥 STORE FACILITY (NEW)
        if (String.isNotBlank(facilityId)) {
            rec.Facility__c = facilityId;
        }

        // 🔥 OPTIONAL fields
        if (String.isNotBlank(assignedStaffId)) {
            rec.Incident_Assigned_Staff__c = assignedStaffId;
        }

        if (String.isNotBlank(formType)) {
            rec.Form_Type__c = formType;
        }

        if (String.isNotBlank(nameVal)) {
            rec.Name__c = nameVal;
        }

        insert rec;

        responseMap.put('success', true);
        responseMap.put('responseId', rec.Id);

        res.statusCode = 201;

    } catch (Exception e) {

        res.statusCode = 500;
        responseMap.put('success', false);
        responseMap.put('message', e.getMessage());
    }

    res.responseBody =
        Blob.valueOf(JSON.serialize(responseMap));
}

    
    
@HttpPut
global static void updateIncidentResponse() {

    RestRequest req = RestContext.request;
    RestResponse res = RestContext.response;

    // -------------------------------
    // Empty body protection
    // -------------------------------
    if (req.requestBody == null ||
        String.isBlank(req.requestBody.toString())) { res.statusCode = 400; res.responseBody = Blob.valueOf( JSON.serialize( new Map<String,Object>{ 'success' => false, 'message' => 'Request body is empty'
                    }
                )
            );
        return;
    }

    Map<String,Object> body =
        (Map<String,Object>) JSON.deserializeUntyped(
            req.requestBody.toString()
        );

    Map<String,Object> responseMap = new Map<String,Object>();

    try {

        // -------------------------------
        // Response Id from URL
        // -------------------------------
        String responseId =
            req.requestURI.substringAfterLast('/');

        if (String.isBlank(responseId)) { res.statusCode = 400; res.responseBody = Blob.valueOf( JSON.serialize( new Map<String,Object>{ 'success' => false, 'message' => 'Missing response id in URL'
                        }
                    )
                );
            return;
        }

        // -------------------------------
        // Fetch existing record
        // -------------------------------
        List<Incident_Register_Response__c> recList = [
            SELECT Id,
                   Response_JSON__c,
                   Incident_Form__c,
                   Status__c,
                   Incident_Assigned_Staff__c,
                   Form_Type__c,
                   Name__c
            FROM Incident_Register_Response__c
            WHERE Id = :responseId
            LIMIT 1
        ];

        if (recList.isEmpty()) { res.statusCode = 404; res.responseBody = Blob.valueOf( JSON.serialize( new Map<String,Object>{ 'success' => false, 'message' => 'Incident_Register_Response__c not found: ' + responseId
                        }
                    )
                );
            return;
        }

        Incident_Register_Response__c existing =
            recList[0];

        // -------------------------------
        // Extract AWS key safely
        // -------------------------------
        Map<String,Object> oldAws;

        try {
            oldAws =
                (Map<String,Object>) JSON.deserializeUntyped(
                    existing.Response_JSON__c ); } catch (Exception ex) { throw new AuraHandledException( 'Stored AWS payload is invalid JSON'
            );
        }

        String key = (String) oldAws.get('key');

        if (String.isBlank(key)) { throw new AuraHandledException( 'AWS key missing from stored response'
            );
        }

        // -------------------------------
        // Values from request
        // -------------------------------
        String statusValue =
            (String) body.get('status');

        String assignedStaffId =
            (String) body.get('assignedStaffId');

        String jsonPayload =
            (String) body.get('json');

        String formType =
            (String) body.get('formType');

        String nameVal =
            (String) body.get('name');

        String formId =
            (String) body.get('formId');

        // -------------------------------
        // Upload updated JSON only if sent
        // -------------------------------
        if (String.isNotBlank(jsonPayload)) {

            Map<String,Object> aws =
                uploadJsonToAws(
                    jsonPayload,
                    'docimgupld',
                    key,
                    true
                );

            existing.Response_JSON__c =
                JSON.serialize(aws);
        }

        // -------------------------------
        // Update allowed fields
        // -------------------------------
        if (String.isNotBlank(statusValue)) {
            existing.Status__c = statusValue;
        }

        if (String.isNotBlank(assignedStaffId)) { existing.Incident_Assigned_Staff__c = assignedStaffId;
        }

        if (String.isNotBlank(formType)) { existing.Form_Type__c = formType;
        }

        if (String.isNotBlank(nameVal)) { existing.Name__c = nameVal;
        }

        // ⚠️ Do NOT change Org on edit

        if (String.isNotBlank(formId)) { existing.Incident_Form__c = formId;
        }

        update existing;

        responseMap.put('success', true);
        responseMap.put('responseId', existing.Id);

        res.statusCode = 200; } catch (Exception e) { res.statusCode = 500;  responseMap.put('success', false); responseMap.put('message', e.getMessage());
    }

    res.responseBody =
        Blob.valueOf(JSON.serialize(responseMap));
}


@HttpDelete
global static void deleteIncidentResponse() {

    RestRequest req = RestContext.request;
    RestResponse res = RestContext.response;

    Map<String,Object> responseMap = new Map<String,Object>();

    try {

        String responseId =
            req.requestURI.substringAfterLast('/');

        Incident_Register_Response__c rec =
            [
                SELECT Id, Response_JSON__c
                FROM Incident_Register_Response__c
                WHERE Id = :responseId
                LIMIT 1
            ];

        // 🔥 delete AWS JSON first
        if (rec.Response_JSON__c != null) {

            Map<String,Object> aws =
                (Map<String,Object>)JSON.deserializeUntyped(
                    rec.Response_JSON__c
                );

            WordEditorController.deleteFromAws(
                (String)aws.get('bucket'),
                (String)aws.get('key')
            );
        }

        delete rec;

        responseMap.put('success', true);
        responseMap.put('message', 'Form deleted');

        res.statusCode = 200; } catch (Exception e) { res.statusCode = 500; responseMap.put('success', false); responseMap.put('message', e.getMessage());
    }

    res.responseBody =
        Blob.valueOf(JSON.serialize(responseMap));
}

private static String generateAwsKey(
    Id orgId,
    String type
) {

    Datetime dt =
        Datetime.newInstance(
            Date.today(),
            Time.newInstance(0, 0, 0, 0)
        );

    String dateStr =
        dt.format('dd-MM-yyyy');

    return
        'IncidentResponses/' +
        orgId +
        '/' +
        dateStr +
        '/' +
        type +
        '/' +
        Crypto.getRandomLong() +
        '.json';
}

private static Map<String,Object> uploadJsonToAws(
    String jsonPayload,
    String bucket,
    String key,
    Boolean isUpdate
) {

    WordEditorController.PresignResponse presign;

    if (isUpdate) {
        presign =
            WordEditorController.getUpdatePresignedUrl(
                bucket,
                key,
                'application/json' ); } else { presign = WordEditorController.getPresignedUrl( bucket, key, 'application/json'
            );
    }

    // 🚀 PUT JSON to S3
    HttpRequest putReq = new HttpRequest();
    putReq.setEndpoint(presign.uploadUrl);
    putReq.setMethod('PUT');
    putReq.setHeader('Content-Type', 'application/json');
    putReq.setBody(jsonPayload);
    putReq.setTimeout(120000);

    HttpResponse putRes =
        new Http().send(putReq);

    if (putRes.getStatusCode() < 200 ||
        putRes.getStatusCode() >= 300) { throw new AuraHandledException( 'S3 upload failed: ' + putRes.getStatus() + ' ' + putRes.getBody()
        );
    }

    // 📦 Return AWS metadata stored in Response_JSON__c
    Map<String,Object> awsPayload =
        new Map<String,Object>{
            'bucket'      => bucket,
            'key'         => presign.key,
            'url'         =>
                'https://' +
                bucket +
                '.s3.amazonaws.com/' +
                presign.key,
            'contentType' => 'application/json',
            'version'     => 'aws-v1'
        };

    return awsPayload;
}



}