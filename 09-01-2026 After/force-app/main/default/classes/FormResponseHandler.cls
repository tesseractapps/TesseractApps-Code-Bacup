@RestResource(urlMapping='/FormResponses/*')
global class FormResponseHandler {

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
}