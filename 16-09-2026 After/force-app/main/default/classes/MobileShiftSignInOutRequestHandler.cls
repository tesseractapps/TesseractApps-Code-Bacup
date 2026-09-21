@RestResource(urlMapping='/shiftSignInOutRequestApi/*')
global with sharing class MobileShiftSignInOutRequestHandler {

    //==========================================================
    // Wrapper
    //==========================================================
    global class ShiftSignInOutRequestWrapper {
        global String shiftWithStaffId;
        global String staffId;
        global String staffName;
        global String staffRole;
        global String shiftType;
        global Date shiftDate;
        global String shiftTimings;

        global Boolean enableSignIn;
        global Boolean enableSignOut;
        global Boolean enableGeoLocation;

        global String signOutComments;
        global String signInComments;

        // Sign In related
        global Boolean isAtLocation;
        global String distanceFromLocation;
    }
    global class ShiftSignInOutUpdateRequest {
        global Boolean enableGeolocation;
        global Boolean enableSignin;
        global Boolean enableSignout;
        global String ApproverSignInComments;
        global String ApproverSignOutComments;
        global String staffId;
        global String shiftwithstaffId;
    }

    //==========================================================
    // GET API
    //==========================================================
    @HttpGet
    global static void getShiftSignInOutRequest() {

        RestResponse res = RestContext.response;
        Map<String,Object> responseMap = new Map<String,Object>();

        try {

            String shiftId = RestContext.request.params.get('shiftId');

            if (String.isBlank(shiftId)) {
                responseMap.put('success', false);
                responseMap.put('message', 'shiftId is required');
                responseMap.put('record', null);

                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }

            ShiftwithStaff__c shift = [
                SELECT  Id,
                        Staff__c,
                        Staff__r.NameToDisplay__c,
                        Role__c,
                        Shift_Category__c,
                        Start_Date__c,
                        Shift_Start_End_Time__c,
                        Shift_Geo_Location__c,
                        Enable_Sign_In__c,
                        Enable_Sign_Out__c,
                       Enable_Sign_In_Comments__c,
                       Request_sign_in_comments__c,
                        Request_sign_out_comments__c,
                        Is_at_location__c,
                        Distance_from_location__c
                FROM ShiftwithStaff__c
                WHERE Id = :shiftId
                LIMIT 1
            ];

            ShiftSignInOutRequestWrapper wrapper =
                new ShiftSignInOutRequestWrapper();

            wrapper.shiftWithStaffId = shift.Id;
            wrapper.staffId = shift.Staff__c;
            wrapper.staffName = shift.Staff__r != null
                ? shift.Staff__r.NameToDisplay__c
                : null;

            wrapper.staffRole = shift.Role__c;
            wrapper.shiftType = shift.Shift_Category__c;
            wrapper.shiftDate = shift.Start_Date__c;
            wrapper.shiftTimings = shift.Shift_Start_End_Time__c;

            wrapper.enableGeoLocation =
                shift.Shift_Geo_Location__c == 'Enabled';

            wrapper.enableSignIn = shift.Enable_Sign_In__c;
            wrapper.signInComments=shift.Request_sign_in_comments__c;
            wrapper.enableSignOut = shift.Enable_Sign_Out__c;

            wrapper.signOutComments = shift.Request_sign_out_comments__c;

            wrapper.isAtLocation = shift.Is_at_location__c;
            wrapper.distanceFromLocation = shift.Distance_from_location__c;

            responseMap.put('success', true);
            responseMap.put('message', 'Shift details retrieved successfully');
            responseMap.put('record', wrapper);

            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));

        } catch (Exception e) {

            responseMap.put('success', false);
            responseMap.put('message', 'Error: ' + e.getMessage());
            responseMap.put('record', null);

            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
        }
    }
    @HttpPost
    global static void updateShiftSignInOutRequest() {
        
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        Map<String, Object> responseMap = new Map<String, Object>();
        
        try {
            
            ShiftSignInOutUpdateRequest requestBody =
                (ShiftSignInOutUpdateRequest) JSON.deserialize(
                    req.requestBody.toString(),
                    ShiftSignInOutUpdateRequest.class
                );
            
            // Validation
            if (requestBody == null || String.isBlank(requestBody.shiftwithstaffId)) {
                
                responseMap.put('success', false);
                responseMap.put('message', 'shiftwithstaffId is required');
                
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }
            
            // Call existing controller method
            ShiftwithStaffController.updateShiftDetails(
                requestBody.enableGeolocation,
                requestBody.enableSignin,
                requestBody.enableSignout,
                requestBody.ApproverSignInComments,
                requestBody.ApproverSignOutComments,
                requestBody.staffId,
                requestBody.shiftwithstaffId
            );
            
            responseMap.put('success', true);
            responseMap.put('message', 'Shift Sign In/Sign Out settings updated successfully.');
            
            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
            
        } catch (Exception e) {
            
            responseMap.put('success', false);
            responseMap.put('message', 'Error: ' + e.getMessage());
            
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
        }
   
    }

}