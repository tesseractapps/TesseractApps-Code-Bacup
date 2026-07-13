@RestResource(urlMapping='/ParticipantSnapShotAPI/*')
Global class MobileAppSnapShotHandler {
     @HttpGet
    global static void getParticipantSnapShot() {
        RestResponse res = RestContext.response;
        Map<String, Object> responseMap = new Map<String, Object>();    
        try {
            // Get Request Object
            RestRequest req = RestContext.request;
            String participantID = req.params.get('participantID');  // Extract shiftId from query params 
            system.debug('participantID '+participantID);
            participantID = participantID != null ? participantID.trim() : null;
            
            if (String.isBlank(participantID)) {
                responseMap.put('success', false);
                responseMap.put('message', 'Error: participantID is required and cannot be empty.');
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }
            
            // Call existing method to fetch checklist
            ClientDataController.ParticipantJournalWrapper participantData = ClientDataController.getParticipantJournal(ID.valueof(participantID));
                        system.debug('participantData '+participantData);
            StatusRequest statusData= new StatusRequest();
            statusData.isAvailable=participantData.client.Current_Availability__c =='Unavailable' ?false:true;
            statusData.participantID=participantData.client.Id;
            statusData.medications=participantData.client.Medications__c;
            statusData.allergies=participantData.client.Allergies__c;
            statusData.notes=participantData.client.Notes__c;
            statusData.unavailableDate=participantData.client.Unavailable_Date__c; 
            statusData.riskStatus =participantData.riskRecord.Risk_Index__c;
            // Convert response into JSON format
            responseMap.put('success', true);
            responseMap.put('message','participant Data fetched successfully');
            responseMap.put('SnapShotDetails',statusData);
            
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
        } catch (Exception e) {
            responseMap.put('success', false);
            responseMap.put('message', 'Error processing participant Data: ' + e.getMessage());
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

            // Deserialize the JSON into our wrapper class
            StatusRequest statusData = (StatusRequest)JSON.deserialize(requestBody, StatusRequest.class);

            // Validate required fields
            if (statusData.participantID == null) {
                 responseMap.put('success', false);
                responseMap.put('message', 'Error: participantID is required.');
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }

            // Call the saveStatusData method from the first class
            ClientDataController.saveStatusData(
                statusData.isAvailable,
                statusData.isUnavailable,
                statusData.participantID,
                statusData.medications,
                statusData.allergies,
                statusData.notes,
                statusData.unavailableDate,
                NULL
            );

            // Prepare success response
            responseMap.put('success', true);
            responseMap.put('message', 'Client status updated successfully');
            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));

        } catch (Exception e) {
             responseMap.put('success', false);
            responseMap.put('message', 'Error processing checklist: ' + e.getMessage());
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
        }
    }
    
     global class StatusRequest {
        global Boolean isAvailable;
        global Boolean isUnavailable;
        global Id participantID;
        global String medications;
        global String allergies;
        global String notes;
        global Date unavailableDate;
        global String riskStatus; 
    }

    

}