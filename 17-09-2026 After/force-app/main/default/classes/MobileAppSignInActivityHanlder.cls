@RestResource(urlMapping='/signInActivityAPI/*')
global class MobileAppSignInActivityHanlder {
      @HttpPost
    global static void addActivity() {
        RestResponse res = RestContext.response;
        Map<String, Object> responseMap = new Map<String, Object>();
        try {
            // Read the request body as a JSON string
            RestRequest req = RestContext.request;
            String requestBody = req.requestBody.toString();

            if (String.isBlank(requestBody)) {
                responseMap.put('success', false);
                responseMap.put('message', 'Error: Request body cannot be empty.');
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }

            // Parse JSON request body
            Map<String, Object> requestData = (Map<String, Object>) JSON.deserializeUntyped(requestBody);
            String shiftStaffId = (String) requestData.get('shiftId');
            String activity = (String) requestData.get('activity');

            if (String.isBlank(shiftStaffId) || String.isBlank(activity)) {
                responseMap.put('success', false);
                responseMap.put('message', 'Error: shiftId and activity are required.');
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }

            // Call the existing method
            responseMap = SignInCheckListAndNotesHandler.addShiftActivity(shiftStaffId, activity);
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));

        } catch (Exception e) {
            responseMap.put('success', false);
            responseMap.put('message', 'Error processing activity addition: ' + e.getMessage());
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
        }
    }

    @HttpGet
    global static void getActivity() {
        RestResponse res = RestContext.response;
        Map<String, Object> responseMap = new Map<String, Object>();
        try {
            // Get request parameter
            RestRequest req = RestContext.request;
            String shiftWithStaffID = req.params.get('shiftId');

            if (String.isBlank(shiftWithStaffID)) {
                responseMap.put('success', false);
                responseMap.put('message', 'Error: shiftId is required.');
                responseMap.put('records', new List<Object>());
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }

            // Call the existing method
            responseMap = SignInCheckListAndNotesHandler.getActivityLog(shiftWithStaffID);
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));

        } catch (Exception e) {
            responseMap.put('success', false);
            responseMap.put('message', 'Error fetching activity logs: ' + e.getMessage());
            responseMap.put('records', new List<Object>());
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
        }
    }
}