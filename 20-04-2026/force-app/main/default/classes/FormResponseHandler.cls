@RestResource(urlMapping='/FormResponses/*')
global class FormResponseHandler {
/*
    @HttpGet
    global static void getFormResponsesByClientAPI() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        Map<String, Object> responseMap = new Map<String, Object>();

        try {
            String clientId = req.params.get('clientId');
            System.debug('📥 Received clientId: ' + clientId);

            if (String.isBlank(clientId)) {
                responseMap.put('success', false);
                responseMap.put('message', 'Missing required clientId parameter.');
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }

            List<Dynamic_Form_Response__c> responses = [
                SELECT Id, Name__c, Form_Type__c,Form_Reference__c, Response_JSON__c, CreatedDate, Client_Id__c, Participant_Name__c
                FROM Dynamic_Form_Response__c
                WHERE Client_Id__c = :clientId
                ORDER BY CreatedDate DESC
            ];

            responseMap.put('success', true);
            responseMap.put('message', 'Form responses fetched successfully.');
            responseMap.put('recordCount', responses.size());
            responseMap.put('responses', responses);
            res.statusCode = 200;

        } catch (Exception e) {
            responseMap.put('success', false);
            responseMap.put('message', 'Error: ' + e.getMessage());
            responseMap.put('error', e.getStackTraceString());
            res.statusCode = 500;
        }

        res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
    }
    
*/

@HttpGet
global static void getFormResponsesByAudienceAPI() {

    RestRequest req = RestContext.request;
    RestResponse res = RestContext.response;
    Map<String, Object> responseMap = new Map<String, Object>();

    res.addHeader('Content-Type', 'application/json');

    try {

        // 🔹 Get params
        String audience  = req.params.get('audience');
        String recordId  = req.params.get('recordId');
        String responseId = req.params.get('responseId'); // ⭐ NEW (optional)

        System.debug('📥 Audience: ' + audience);
        System.debug('📥 RecordId: ' + recordId);
        System.debug('📥 ResponseId: ' + responseId);

        // 🔹 Validate input
        if (String.isBlank(audience) || String.isBlank(recordId)) {

            responseMap.put('success', false);
            responseMap.put(
                'message',
                'Missing required audience or recordId parameter.'
            );

            res.statusCode = 400;
            res.responseBody =
                Blob.valueOf(JSON.serialize(responseMap));
            return;
        }

        if (audience != 'Participant' && audience != 'Staff') { responseMap.put('success', false); responseMap.put( 'message', 'Invalid audience value. Must be Participant or Staff.'); res.statusCode = 400; res.responseBody = Blob.valueOf(JSON.serialize(responseMap)); return; }

        List<Dynamic_Form_Response__c> responses;

        // ==================================================
        // 🔹 Fetch based on audience
        // ==================================================

        if (audience == 'Participant') {

            if (String.isNotBlank(responseId)) {

                // ⭐ Fetch specific response
                responses = [
                    SELECT Id,
                           Name__c,
                           Form_Type__c,
                           Form_Reference__c,
                           Response_JSON__c,
                           CreatedDate,
                           Client_Id__c,
                           Participant_Name__c,
                           Status__c,
                    	   Form_Response_From_Mobile__c
                    FROM Dynamic_Form_Response__c
                    WHERE Client_Id__c = :recordId
                    AND Id = :responseId
                    ORDER BY CreatedDate DESC
                ];

            } else {

                // Existing functionality (UNCHANGED)
                responses = [
                    SELECT Id,
                           Name__c,
                           Form_Type__c,
                           Form_Reference__c,
                           Response_JSON__c,
                           CreatedDate,
                           Client_Id__c,
                           Participant_Name__c,
                           Status__c,
                           Form_Response_From_Mobile__c
                    FROM Dynamic_Form_Response__c
                    WHERE Client_Id__c = :recordId
                    ORDER BY CreatedDate DESC
                ];
            }

        } else {

            if (String.isNotBlank(responseId)) {

                // ⭐ Fetch specific response
                responses = [
                    SELECT Id,
                           Name__c,
                           Form_Type__c,
                           Form_Reference__c,
                           Response_JSON__c,
                           CreatedDate,
                           Staff__c,
                           Staff_Name__c,
                           Status__c
                    FROM Dynamic_Form_Response__c
                    WHERE Staff__c = :recordId
                    AND Id = :responseId
                    ORDER BY CreatedDate DESC
                ];

            } else {

                // Existing functionality (UNCHANGED)
                responses = [
                    SELECT Id,
                           Name__c,
                           Form_Type__c,
                           Form_Reference__c,
                           Response_JSON__c,
                           CreatedDate,
                           Staff__c,
                           Staff_Name__c,
                           Status__c
                    FROM Dynamic_Form_Response__c
                    WHERE Staff__c = :recordId
                    ORDER BY CreatedDate DESC
                ];
            }
        }

        // 🔹 Response
        responseMap.put('success', true);
        responseMap.put('message', 'Form responses fetched successfully.');
        responseMap.put('recordCount', responses.size());
        responseMap.put('responses', responses);

        res.statusCode = 200; } catch (Exception e) { responseMap.put('success', false); responseMap.put('message', 'Error: ' + e.getMessage()); responseMap.put('error', e.getStackTraceString()); res.statusCode = 500;
    }

    res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
}
   
}