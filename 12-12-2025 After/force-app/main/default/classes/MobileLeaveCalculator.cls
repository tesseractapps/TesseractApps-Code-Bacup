/* Test class:ServiceSupportPlanHandlerTest*/
@RestResource(urlMapping='/LeaveCalculationAPI/*')
global  class MobileLeaveCalculator {
    @HttpGet
    global static void getLeaveDuration() {
        RestResponse res = RestContext.response; // Create the response object
        Map<String, Object> result = new Map<String, Object>(); // To store the results
        
        try {
            // Get current user's email
            String userEmail = UserInfo.getUserEmail(); 
            List<Staff__c> staffDetails = StaffController.getStaffByEmail(userEmail);

            // Ensure staff details are found
            if (staffDetails.isEmpty()) {
                result.put('errorMessage', 'Staff details not found for the current user.');
                result.put('saveButtonDisable', true);
                res.responseBody = Blob.valueOf(JSON.serialize(result));
                res.statusCode = 200; // Bad Request
                return;
            }

            // Staff details and leave balances
            String employeeId = staffDetails[0].Id;
            Decimal annualBalance = staffDetails[0].Annual_Leave__c != null ? staffDetails[0].Annual_Leave__c : 0;
            Decimal sickBalance = staffDetails[0].Sick_Leave__c != null ? staffDetails[0].Sick_Leave__c : 0;
            Decimal parentalBalance = staffDetails[0].Parental_Leave__c != null ? staffDetails[0].Parental_Leave__c : 0;
            Decimal otherBalance = staffDetails[0].Bereavement_Leave__c != null ? staffDetails[0].Bereavement_Leave__c : 0;

            // Extract query parameters from the request
            RestRequest req = RestContext.request;
            Map<String, String> requestParams = req.params;
            Date fromDate = Date.valueOf(requestParams.get('fromDate'));
            Date toDate = Date.valueOf(requestParams.get('toDate'));
            String leaveType = requestParams.get('leaveType');

            // Check for overlapping leave records
            List<Leave__c> duplicateLeaves = [
                SELECT Id, From__c, To__c, Type_of_Leave__c 
                FROM Leave__c 
                WHERE 
                    Staff__c = :employeeId AND
                    (From__c <= :toDate AND To__c >= :fromDate)
            ];

            if (!duplicateLeaves.isEmpty()) {
                result.put('errorMessage', 'A leave request with overlapping dates already exists for this staff member.');
                res.responseBody = Blob.valueOf(JSON.serialize(result));
                res.statusCode = 200; // Conflict
                return;
            }

            // Validate date logic
            if (toDate < fromDate) {
                result.put('errorMessage', 'You cannot set a to-date that precedes the from-date.');
                res.responseBody = Blob.valueOf(JSON.serialize(result));
                res.statusCode = 200; // Bad Request
                return;
            } else {
                result.put('errorMessage', '');
            }

            // Calculate duration (business days)
            Integer duration = calculateBusinessDays(fromDate, toDate);
            result.put('duration', duration);

            // Determine leave balance
            Decimal leaveBalance;
            if (leaveType == 'Annual Leave') {
                leaveBalance = annualBalance;
            } else if (leaveType == 'Sick Leave') {
                leaveBalance = sickBalance;
            } else if (leaveType == 'Parental Leave') {
                leaveBalance = parentalBalance;
            } else if (leaveType == 'Other Leave') {
                leaveBalance = otherBalance;
            } else {
                result.put('errorMessage', 'Leave type not recognized.');
                res.responseBody = Blob.valueOf(JSON.serialize(result));
                res.statusCode = 200; // Bad Request
                return;
            }

            Decimal remainingBalance = leaveBalance - duration;
            result.put('balance', Math.max(remainingBalance, 0));
            result.put('paid', Math.min(leaveBalance, duration));
            result.put('unpaid', Math.max(0, -remainingBalance));
            result.put('successMessage', 'Leave calculated successfully.');

            // Serialize and send the success response
            res.responseBody = Blob.valueOf(JSON.serialize(result));
            res.statusCode = 200; // OK
        } catch (Exception ex) {
            result.put('errorMessage', 'An error occurred: ' + ex.getMessage());
            result.put('saveButtonDisable', true);
            res.responseBody = Blob.valueOf(JSON.serialize(result));
            res.statusCode = 200; // Internal Server Error
        }
    }
    
    private static Integer calculateBusinessDays(Date startDate, Date endDate) {
        Integer businessDays = 0;
        Date currentDate = startDate;
        
        while (currentDate <= endDate) {
            // Exclude weekends
            if (currentDate.toStartOfWeek().addDays(5) >= currentDate) {
                businessDays++;
            }
            currentDate = currentDate.addDays(1);
        }
        
        return businessDays;
    }

}