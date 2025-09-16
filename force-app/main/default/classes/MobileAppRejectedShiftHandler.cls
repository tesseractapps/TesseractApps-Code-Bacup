@RestResource(urlMapping='/RejectedShiftsAPI/*')
global class MobileAppRejectedShiftHandler {
     @HttpPost
    global static void  rejectShifts() {
        RestResponse res = RestContext.response;
        Map<String, Object> responseMap = new Map<String, Object>();
        try {
            RestRequest req = RestContext.request;
            String requestBody = req.requestBody.toString();
            system.debug('requestBody' +requestBody);

            if (String.isBlank(requestBody)) {
                responseMap.put('success', false);
                responseMap.put('message', 'Error: Request body cannot be empty.');
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }

            // Deserialize JSON into wrapper class
            rejectedShiftWrapper rejectedShift = (rejectedShiftWrapper) JSON.deserialize(requestBody, rejectedShiftWrapper.class);
            
            if (rejectedShift == null || String.isBlank(rejectedShift.shiftStaffID) ||  String.isBlank(rejectedShift.RejectedComments) ) {
                responseMap.put('success', false);
                responseMap.put('message', 'Error: shiftStaffID and comments are required.');
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }
            ShiftwithStaff__c shiftStaff = [SELECT Id, Attendence__c, Comments__c FROM ShiftwithStaff__c WHERE Id = :rejectedShift.shiftStaffID LIMIT 1];
            shiftStaff.Attendence__c = false;
            shiftStaff.RejectedComments__c = rejectedShift.RejectedComments;
            shiftStaff.Shift_Rejected__c=true;
            update shiftStaff;
            
            responseMap.put('success', true);
            responseMap.put('message', 'Shift Rejected successfully.');
            responseMap.put('recordId', shiftStaff.Id);
        } catch (Exception e) {
            responseMap.put('success', false);
            responseMap.put('message', 'Error: ' + e.getMessage());
        }
        res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
   }

 global class rejectedShiftWrapper {
        public String shiftStaffID;
        public String RejectedComments;
       
    }
    

}