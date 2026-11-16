@RestResource(urlMapping='/LeaveCalculationAPI/*')
global class MobileLeaveCalculator {

    @HttpGet
    global static void getLeaveDuration() {

        RestResponse res = RestContext.response;
        Map<String, Object> result = new Map<String, Object>();

        try {
            /* -------------------------------------------------
             * 1. FETCH CURRENT STAFF
             * ------------------------------------------------- */
            String userEmail = UserInfo.getUserEmail();
            List<Staff__c> staffList =
                StaffController.getStaffByEmail(userEmail);

            if (staffList.isEmpty()) {
                result.put('errorMessage',
                    'Staff details not found for the current user.');
                sendResponse(res, result);
                return;
            }

            Staff__c staff = staffList[0];

            /* -------------------------------------------------
             * 2. READ REQUEST PARAMETERS
             * ------------------------------------------------- */
            RestRequest req = RestContext.request;

            Date fromDate = Date.valueOf(req.params.get('fromDate'));
            Date toDate   = Date.valueOf(req.params.get('toDate'));

            String leaveType    = req.params.get('leaveType');
            String durationType = req.params.get('durationType');
            String state        = req.params.get('state');
            String startTime    = req.params.get('startTime'); // optional
            String endTime      = req.params.get('endTime');   // optional

            /* -------------------------------------------------
             * 3. DATE VALIDATION
             * ------------------------------------------------- */
            if (toDate < fromDate) {
                result.put('errorMessage',
                    'You cannot set a to-date that precedes the from-date.');
                sendResponse(res, result);
                return;
            }

            /* -------------------------------------------------
             * 4. OVERLAP VALIDATION
             * ------------------------------------------------- */
            List<Leave__c> duplicates = [
                SELECT Id
                FROM Leave__c
                WHERE Staff__c = :staff.Id
                  AND (From__c <= :toDate AND To__c >= :fromDate)  AND Status__c NOT IN ('Rejected', 'Cancelled', 'Withdrawn')
            ];

            if (!duplicates.isEmpty()) {
                result.put(
                    'errorMessage',
                    'A leave request with overlapping dates already exists.'
                );
                sendResponse(res, result);
                return;
            }

            /* -------------------------------------------------
             * 5. CALL CENTRAL LEAVE CALCULATOR
             * ------------------------------------------------- */
            LeaveCalculationService.Result calcResult =
                LeaveCalculationService.calculate(
                    fromDate,
                    toDate,
                    state,
                    leaveType,
                    durationType,
                    startTime,
                    endTime,
                    staff.Annual_leave_Accrued__c,
                    staff.Personal_Leave_Accur__c,
                    staff.Facility__r
                         .Organisation__r
                         .Negative_Balance__c
                );

            /* -------------------------------------------------
             * 6. RETURN RESULT
             * ------------------------------------------------- */
            sendResponse(res, calcResult);

        } catch (Exception e) {
            result.put('errorMessage', e.getMessage());
            sendResponse(res, result);
        }
    }
        @HttpPost
    global static void updateLeaveStatusMobile() {
    
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        Map<String, Object> responseMap = new Map<String, Object>();
    
        try {
    
            // Validate request body
            if (req.requestBody == null || String.isBlank(req.requestBody.toString())) {
                responseMap.put('success', false);
                responseMap.put('message', 'Request body is required.');
    
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }
    
            LeaveStatusUpdateRequest requestBody = (LeaveStatusUpdateRequest) JSON.deserialize(req.requestBody.toString(),LeaveStatusUpdateRequest.class);
    
            // Validation
            if (String.isBlank(requestBody.leaveId)) {
                responseMap.put('success', false);
                responseMap.put('message', 'leaveId is required.');
    
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }
    
            // Call existing Apex method
            LeaveController.updateLeaveStatus( (Id)requestBody.leaveId, requestBody.statusValue, requestBody.cancelComments);
    
            responseMap.put('success', true);
            responseMap.put('message', 'Leave status updated successfully.');
    
            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
    
        } catch (Exception e) {
    
            responseMap.put('success', false);
            responseMap.put('message', 'Error: ' + e.getMessage());
    
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
        }
    }

    /* ---------------------------------------------------------
     * COMMON RESPONSE HANDLER
     * --------------------------------------------------------- */
    public static void sendResponse(
        RestResponse res,
        Object payload
    ) {
        res.statusCode = 200;
        res.responseBody =
            Blob.valueOf(JSON.serialize(payload));
    }
       global class LeaveStatusUpdateRequest {
        global String leaveId;
        global String statusValue;
        global String cancelComments;
    }
}