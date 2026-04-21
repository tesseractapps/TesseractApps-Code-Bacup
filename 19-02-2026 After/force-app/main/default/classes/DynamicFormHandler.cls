@RestResource(urlMapping='/FetchDynamicForms/*')
global class DynamicFormHandler {

@HttpGet
global static void getDynamicForms() {
    RestResponse res = RestContext.response;
    Map<String, Object> responseMap = new Map<String, Object>();

    try {
        // Get participantId from query params
        String participantId = RestContext.request.params.get('participantId');
        System.debug('📥 Received participantId: ' + participantId);

        if (String.isBlank(participantId)) {
            responseMap.put('isSuccess', false);
            responseMap.put('message', 'Missing required participantId parameter.');
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
            res.statusCode = 400;
            return;
        }

        // Try to fetch the participant record
        Client__c participant;
        try {
            participant = [
                SELECT Accessible_Forms__c 
                FROM Client__c 
                WHERE Id = :participantId 
                LIMIT 1
            ];
        } catch (Exception e) {
            responseMap.put('isSuccess', false);
            responseMap.put('message', 'Participant not found or invalid ID.');
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
            res.statusCode = 404;
            return;
        }

        if (String.isBlank(participant.Accessible_Forms__c)) {
            responseMap.put('isSuccess', true);
            responseMap.put('message', 'No accessible forms assigned.');
            responseMap.put('formIds', new List<String>());
            responseMap.put('recordCount', 0);
            responseMap.put('forms', new List<dynamicFormWrapper>());
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
            res.statusCode = 200;
            return;
        }

        // Sanitize and validate the form IDs
        List<String> rawIds = participant.Accessible_Forms__c.split('\n');
        List<String> cleanFormIds = new List<String>();
        for (String fid : rawIds) {
            if (!String.isBlank(fid)) {
                fid = fid.trim();
                if (fid.length() >= 15 && fid.length() <= 18) {
                    cleanFormIds.add(fid);
                }
            }
        }

        if (cleanFormIds.isEmpty()) {
            responseMap.put('isSuccess', true);
            responseMap.put('message', 'No valid form IDs found.');
            responseMap.put('formIds', new List<String>());
            responseMap.put('recordCount', 0);
            responseMap.put('forms', new List<dynamicFormWrapper>());
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
            res.statusCode = 200;
            return;
        }

        // Query only the valid forms
        List<Dynamic_Form__c> formList = [
            SELECT 
                Id,
                Name__c,
                Form_JSON__c,
                Form_Type__c,
                Org_Id__c,
                Status__c,
                CreatedBy.Name,
            	CreatedDate,
                LastModifiedBy.Name,
                Owner.Name
            FROM Dynamic_Form__c
            WHERE Id IN :cleanFormIds
            ORDER BY CreatedDate DESC
        ];

        // Wrap the forms into a clean response model
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
            dfw.CreatedDate= form.CreatedDate;
            dfw.LastModifiedBy = form.LastModifiedBy?.Name;
            dfw.Owner = form.Owner?.Name;
            wrapperList.add(dfw);
            returnedIds.add(form.Id);
        }

        // Final response map
        responseMap.put('isSuccess', true);
        responseMap.put('message', 'Accessible forms fetched successfully.');
        responseMap.put('formIds', returnedIds);
        responseMap.put('recordCount', wrapperList.size());
        responseMap.put('forms', wrapperList);

    } catch (Exception e) {
        responseMap.put('isSuccess', false);
        responseMap.put('message', 'Unhandled error: ' + e.getMessage());
        responseMap.put('error', e.getStackTraceString());
    }

    // Final response
    System.debug('📦 Final Response: ' + JSON.serialize(responseMap));
    res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
    res.statusCode = 200;
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
            // Get request body
            String requestBody = RestContext.request.requestBody.toString();

            if (String.isBlank(requestBody)) {
                responseMap.put('success', false);
                responseMap.put('message', 'Request body cannot be empty.');
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                res.statusCode = 400;
                return;
            }

            // Parse the input
            FormRequest input = (FormRequest) JSON.deserialize(requestBody, FormRequest.class);

            // Validate required fields
            if (input.formId == null || String.isBlank(input.responseJson)) {
                responseMap.put('success', false);
                responseMap.put('message', 'formId and responseJson are required.');
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                res.statusCode = 400;
                return;
            }

            // Fetch participant name if clientId is provided
            String participantName = '';
            if (String.isNotBlank(input.clientId)) {
                List<Client__c> clients = [
                    SELECT Name 
                    FROM Client__c 
                    WHERE Id = :input.clientId 
                    LIMIT 1
                ];
                if (!clients.isEmpty()) {
                    participantName = clients[0].Name;
                }
            }

            Dynamic_Form_Response__c response;

            if (String.isNotBlank(input.recordId)) {
                // Update existing record
                List<Dynamic_Form_Response__c> existingResponses = [
                    SELECT Id, Form_Reference__c, Response_JSON__c, Org_Id__c, Client_Id__c,
                           Name__c, Form_Type__c, Participant_Name__c
                    FROM Dynamic_Form_Response__c
                    WHERE Id = :input.recordId
                    LIMIT 1
                ];

                if (existingResponses.isEmpty()) {
                    responseMap.put('success', false);
                    responseMap.put('message', 'No record found with the provided recordId.');
                    res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                    res.statusCode = 404;
                    return;
                }

                response = existingResponses[0];
                response.Form_Reference__c = input.formId;
                response.Response_JSON__c = input.responseJson;
                response.Org_Id__c = input.orgId;
                response.Client_Id__c = input.clientId;
                response.Name__c = input.formName;
                response.Form_Type__c = input.formType;
                response.Participant_Name__c = participantName;

                update response;

                responseMap.put('message', 'Form response updated successfully.');
            } else {
                // Insert new record
                response = new Dynamic_Form_Response__c();
                response.Form_Reference__c = input.formId;
                response.Response_JSON__c = input.responseJson;
                response.Org_Id__c = input.orgId;
                response.Client_Id__c = input.clientId;
                response.Name__c = input.formName;
                response.Form_Type__c = input.formType;
                response.Participant_Name__c = participantName;

                insert response;

                responseMap.put('message', 'Form response saved successfully.');
            }

            responseMap.put('success', true);
            responseMap.put('recordId', response.Id);
            res.statusCode = 200;

        } catch (Exception e) {
            responseMap.put('success', false);
            responseMap.put('message', 'Error: ' + e.getMessage());
            res.statusCode = 500;
        }

        res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
    }

    // Wrapper class
    global class FormRequest {
        global Id formId;
        global String responseJson;
        global String orgId;
        global String clientId;
        global String formName;
        global String formType;
        global Id recordId; // optional for update
    }
    
    @HttpDelete
global static void deleteFormResponseById() {
    RestResponse res = RestContext.response;
    Map<String, Object> responseMap = new Map<String, Object>();

    try {
        // Use the custom query param 'delete_ID'
        String recordId = RestContext.request.params.get('delete_ID');
        System.debug('🗑️ Deletion Request for ID: ' + recordId);

        if (String.isBlank(recordId)) {
            responseMap.put('success', false);
            responseMap.put('message', 'Missing required delete_ID parameter.');
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
            res.statusCode = 400;
            return;
        }

        // Try to find the record
        Dynamic_Form_Response__c recordToDelete = [
            SELECT Id FROM Dynamic_Form_Response__c WHERE Id = :recordId LIMIT 1
        ];

        // Delete the record
        delete recordToDelete;

        responseMap.put('success', true);
        responseMap.put('message', 'Record deleted successfully.');
        res.statusCode = 200;

    } catch (QueryException qe) {
        responseMap.put('success', false);
        responseMap.put('message', 'Record not found or already deleted.');
        res.statusCode = 404;
    } catch (Exception e) {
        responseMap.put('success', false);
        responseMap.put('message', 'Error: ' + e.getMessage());
        res.statusCode = 500;
    }

    res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
}




}