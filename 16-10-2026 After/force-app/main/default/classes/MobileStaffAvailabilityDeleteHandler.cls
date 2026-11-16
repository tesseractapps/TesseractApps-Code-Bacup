@RestResource(urlMapping='/myAvailabilityDeleteApi/*')
global class MobileStaffAvailabilityDeleteHandler {
     @HttpPost
     global static void deleteAvailability() { 
      
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
             String availabilityId = (String) requestData.get('availabilityId');
             if (String.isBlank(availabilityId)) {
                responseMap.put('success', false);
                responseMap.put('message', 'Error: AvailabilityId is required.');
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }
            list<Availability__c> availList=[select id from  Availability__c where Id=:availabilityId];
            if(availList.size()>0){
                delete availList;
                
                 responseMap.put('success', true);
                responseMap.put('message', 'Availability is Deleted Successfully.');
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
            }
        }  catch (Exception e) {
            responseMap.put('success', false);
            responseMap.put('message', 'Error processing activity addition: ' + e.getMessage());
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
        }
     }

}