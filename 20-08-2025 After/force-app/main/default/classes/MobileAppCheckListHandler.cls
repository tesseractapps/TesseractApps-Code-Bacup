@RestResource(urlMapping='/checkListAPI/*')
global class MobileAppCheckListHandler {
    @HttpGet
    global static void getCheckListdata() {
        RestResponse res = RestContext.response;
        Map<String, Object> responseMap = new Map<String, Object>();    
        try {
            // Get Request Object
            RestRequest req = RestContext.request;
            String AddShiftId = req.params.get('AddShiftId');  // Extract shiftId from query params
            
            if (String.isBlank(AddShiftId)) {
                responseMap.put('success', false);
                responseMap.put('message', 'Error: Shift ID is required and cannot be empty.');
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }
            
            // Call existing method to fetch checklist
            SignInCheckListAndNotesHandler.CheckListWrapper checkListData = SignInCheckListAndNotesHandler.getCheckListByShiftId(AddShiftId);
            
            // Convert response into JSON format
            responseMap.put('success', checkListData.success);
            responseMap.put('message', checkListData.message);
            responseMap.put('checklist', checkListData.checklist);
            
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
        } catch (Exception e) {
            responseMap.put('success', false);
            responseMap.put('message', 'Error processing checklist: ' + e.getMessage());
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
        }
    }
    
     @HttpPost
    global static void updateCheckListdata() {
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

            // Call the existing update method from SignInCheckListAndNotesHandler
            responseMap = SignInCheckListAndNotesHandler.updateCheckListRecords(requestBody);

            // Set the appropriate status code based on success or failure
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));

        } catch (Exception e) {
            responseMap.put('success', false);
            responseMap.put('message', 'Error processing checklist update: ' + e.getMessage());
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
        }
    }

}