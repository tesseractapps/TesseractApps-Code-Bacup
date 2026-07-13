@RestResource(urlMapping='/FetchDynamicForms/*')
global class DynamicFormHandler {
    
    @HttpGet
global static void getDynamicForms() {

    RestResponse res = RestContext.response;
    Map<String, Object> responseMap = new Map<String, Object>();
    res.addHeader('Content-Type', 'application/json');

    try {

        String audience = RestContext.request.params.get('audience');
        String recordId = RestContext.request.params.get('recordId');
        String formIdsParam = RestContext.request.params.get('formIds');

        List<Dynamic_Form__c> formList;

        // =========================================================
        // 🔹 BULK FETCH MODE (if formIds provided)
        // =========================================================
        if (String.isNotBlank(formIdsParam)) {

            List<String> rawIds = formIdsParam.split(',');
            Set<Id> formIds = new Set<Id>();

            for (String fid : rawIds) {
                if (!String.isBlank(fid)) {
                    fid = fid.trim();
                    if (fid.length() >= 15 && fid.length() <= 18) {
                        formIds.add((Id)fid);
                    }
                }
            }

            if (formIds.isEmpty()) {
                responseMap.put('isSuccess', false);
                responseMap.put('message', 'No valid formIds provided.');
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }

            formList = [
                SELECT 
                    Id,
                    Name__c,
                    Form_JSON__c,
                    Form_Type__c,
                    Org_Id__c,
                    Status__c,
                    Audience__c,
                    CreatedBy.Name,
                    CreatedDate,
                    LastModifiedBy.Name,
                    Owner.Name
                FROM Dynamic_Form__c
                WHERE Id IN :formIds
                ORDER BY CreatedDate DESC
            ];
        }

        // =========================================================
        // 🔹 NORMAL MODE (existing logic)
        // =========================================================
        else {

            if (String.isBlank(audience) || String.isBlank(recordId)) {
                responseMap.put('isSuccess', false);
                responseMap.put('message', 'Missing required audience or recordId parameter.');
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }

            if (audience != 'Participant' && audience != 'Staff') {
                responseMap.put('isSuccess', false);
                responseMap.put('message', 'Invalid audience value.');
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }

            String accessibleFormsField;

            if (audience == 'Participant') {

                Client__c participant = [
                    SELECT Accessible_Forms__c
                    FROM Client__c
                    WHERE Id = :recordId
                    LIMIT 1
                ];

                accessibleFormsField = participant.Accessible_Forms__c;

            } else {

                Staff__c staff = [
                    SELECT Accessible_Custom_Forms__c
                    FROM Staff__c
                    WHERE Id = :recordId
                    LIMIT 1
                ];

                accessibleFormsField = staff.Accessible_Custom_Forms__c;
            }

            if (String.isBlank(accessibleFormsField)) {
                responseMap.put('isSuccess', true);
                responseMap.put('message', 'No accessible forms assigned.');
                responseMap.put('formIds', new List<String>());
                responseMap.put('recordCount', 0);
                responseMap.put('forms', new List<dynamicFormWrapper>());
                res.statusCode = 200;
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }

            List<String> rawIds = accessibleFormsField.split('\n');
            Set<Id> cleanFormIds = new Set<Id>();

            for (String fid : rawIds) {
                if (!String.isBlank(fid)) {
                    fid = fid.trim();
                    if (fid.length() >= 15 && fid.length() <= 18) {
                        cleanFormIds.add((Id)fid);
                    }
                }
            }

            formList = [
                SELECT 
                    Id,
                    Name__c,
                    Form_JSON__c,
                    Form_Type__c,
                    Org_Id__c,
                    Status__c,
                    Audience__c,
                    CreatedBy.Name,
                    CreatedDate,
                    LastModifiedBy.Name,
                    Owner.Name
                FROM Dynamic_Form__c
                WHERE Id IN :cleanFormIds
                AND Audience__c = :audience
                ORDER BY CreatedDate DESC
            ];
        }

        // =========================================================
        // 🔹 Common Response Builder
        // =========================================================

        List<dynamicFormWrapper> wrapperList = new List<dynamicFormWrapper>();
        List<String> returnedIds = new List<String>();

        for (Dynamic_Form__c form : formList) {

            dynamicFormWrapper dfw = new dynamicFormWrapper();
            dfw.Id = form.Id;
            dfw.Name = form.Name__c;
            dfw.FormJSON = form.Form_JSON__c;
            dfw.FormType = form.Form_Type__c;
            dfw.OrgId = form.Org_Id__c;
            dfw.Status = form.Status__c;
            dfw.CreatedBy = form.CreatedBy?.Name;
            dfw.CreatedDate = form.CreatedDate;
            dfw.LastModifiedBy = form.LastModifiedBy?.Name;
            dfw.Owner = form.Owner?.Name;

            wrapperList.add(dfw);
            returnedIds.add(form.Id);
        }

        responseMap.put('isSuccess', true);
        responseMap.put('message', 'Forms fetched successfully.');
        responseMap.put('formIds', returnedIds);
        responseMap.put('recordCount', wrapperList.size());
        responseMap.put('forms', wrapperList);

        res.statusCode = 200;

    } catch (Exception e) {

        responseMap.put('isSuccess', false);
        responseMap.put('message', e.getMessage());
        res.statusCode = 500;
    }

    res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
}

    global class dynamicFormWrapper {
        global String Id;
        global String Name;
        global String FormJSON;
        global String FormType;
        global String OrgId;
        global String Status;
        global String CreatedBy;
        global Datetime CreatedDate;
        global String LastModifiedBy;
        global String Owner;
    }

    

@HttpPost
global static void saveFormResponseAPI() {

    RestResponse res = RestContext.response;
    Map<String, Object> responseMap = new Map<String, Object>();
    res.addHeader('Content-Type', 'application/json');

    try {

        String requestBody = RestContext.request.requestBody.toString();

        if (String.isBlank(requestBody)) {
            responseMap.put('success', false);
            responseMap.put('message', 'Request body cannot be empty.');
            res.statusCode = 400;
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
            return;
        }

        FormRequest input =
            (FormRequest) JSON.deserialize(requestBody, FormRequest.class);

        if (input.formId == null ||
            String.isBlank(input.responseJson) ||
            String.isBlank(input.audience)) {

            responseMap.put('success', false);
            responseMap.put('message', 'formId, responseJson and audience are required.');
            res.statusCode = 400;
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
            return;
        }

        // 🔹 Validate form audience
        Dynamic_Form__c form = [
            SELECT Audience__c
            FROM Dynamic_Form__c
            WHERE Id = :input.formId
            LIMIT 1
        ];

        if (form.Audience__c != input.audience) {
            throw new AuraHandledException('Form audience mismatch');
        }

        // -------------------------------------
        // CREATE or EDIT
        // -------------------------------------
        Dynamic_Form_Response__c response;
        Boolean isEdit = input.recordId != null;

        if (isEdit) {
            response = [
                SELECT Id, Response_JSON__c, Form_Response_From_Mobile__c
                FROM Dynamic_Form_Response__c
                WHERE Id = :input.recordId
                LIMIT 1
            ];
        } else {
            response = new Dynamic_Form_Response__c();
        }

        // -------------------------------------
        // AWS JSON Upload
        // -------------------------------------
        String key;

        if (isEdit && response.Response_JSON__c != null) {
            Map<String,Object> oldAws =
                (Map<String,Object>) JSON.deserializeUntyped(
                    response.Response_JSON__c
                );
            key = (String) oldAws.get('key');
        } else {
            key = generateAwsKey(input.orgId, 'customForm');
        }

        Map<String,Object> aws =
            uploadJsonToAws(
                input.responseJson,
                'docimgupld',
                key,
                isEdit
            );

        response.Response_JSON__c = JSON.serialize(aws);

        // -------------------------------------
        // FIELD MAPPING (APPLIES TO BOTH)
        // -------------------------------------
        response.Form_Reference__c = input.formId;
        response.Org_Id__c = input.orgId;
        response.Name__c = input.formName;
        response.Form_Type__c = input.formType;
        response.Status__c = input.status;

        // ✅ SHIFT ID (CREATE + EDIT)
        if (input.shiftId != null) {
            response.Form_Response_From_Mobile__c = input.shiftId;
        }

        // -------------------------------------
        // Audience Handling
        // -------------------------------------
        if (input.audience == 'Participant') {

            response.Client_Id__c = input.clientId;

            if (input.clientId != null) {
                Client__c c = [
                    SELECT Name FROM Client__c
                    WHERE Id = :input.clientId
                    LIMIT 1
                ];
                response.Participant_Name__c = c.Name;
            }

            response.Staff__c = null;
            response.Staff_Name__c = null;

        } else {

            response.Staff__c = input.staffId;

            if (input.staffId != null) {
                Staff__c s = [
                    SELECT Name FROM Staff__c
                    WHERE Id = :input.staffId
                    LIMIT 1
                ];
                response.Staff_Name__c = s.Name;
            }

            response.Client_Id__c = null;
            response.Participant_Name__c = null;
        }

        // -------------------------------------
        // SAVE
        // -------------------------------------
        if (isEdit) {
            update response;
        } else {
            insert response;
        }

        responseMap.put('success', true);
        responseMap.put('recordId', response.Id);
        res.statusCode = isEdit ? 200 : 201;

    } catch (Exception e) {
        res.statusCode = 500;
        responseMap.put('success', false);
        responseMap.put('message', e.getMessage());
    }

    res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
}

global class FormRequest {
    global Id formId;
    global String responseJson;
    global String orgId;
    global String clientId;
    global Id staffId;
    global String audience;
    global String formName;
    global String formType;
    global String status;
    global Id recordId;

    global Id shiftId;   // ✅ ADD THIS
}

    @HttpDelete
global static void deleteFormResponseById() {

    RestResponse res = RestContext.response;
    Map<String,Object> responseMap = new Map<String,Object>();

    try {

        String recordId =
            RestContext.request.params.get('delete_ID');

        Dynamic_Form_Response__c rec =
            [
                SELECT Id, Response_JSON__c
                FROM Dynamic_Form_Response__c
                WHERE Id = :recordId
                LIMIT 1
            ];

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
        res.statusCode = 200;

    } catch (Exception e) {

        res.statusCode = 500;
        responseMap.put('success', false);
        responseMap.put('message', e.getMessage());
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
        'CustomFormResponses/' +
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
                'application/json'
            );
    } else {
        presign =
            WordEditorController.getPresignedUrl(
                bucket,
                key,
                'application/json'
            );
    }

    HttpRequest putReq = new HttpRequest();
    putReq.setEndpoint(presign.uploadUrl);
    putReq.setMethod('PUT');
    putReq.setHeader('Content-Type', 'application/json');
    putReq.setBody(jsonPayload);
    putReq.setTimeout(120000);

    HttpResponse putRes =
        new Http().send(putReq);

    if (putRes.getStatusCode() < 200 ||
        putRes.getStatusCode() >= 300) {

        throw new AuraHandledException(
            'S3 upload failed: ' +
            putRes.getStatus() +
            ' ' +
            putRes.getBody()
        );
    }

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