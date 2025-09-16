/* Test class:ServiceSupportPlanHandlerTest*/
@RestResource(urlMapping='/getLeavesAPI/')
global class MobileLeaveManagementHandler {
    @HttpGet
    global static void getLeaves() {
        RestResponse res = RestContext.response;
        
        try {
            // Fetch query parameters
            RestRequest req = RestContext.request;
            Map<String, String> requestParams = req.params;
            String yearParam = requestParams.get('year');
            String monthParam = requestParams.get('month');
            String allLeavesParam = requestParams.get('allleaves'); // New parameter
            String pageNoParam = requestParams.get('pageNo'); // New parameter

            Integer year = (yearParam != null && yearParam != '') ? Integer.valueOf(yearParam) : null;
            Integer month = (monthParam != null && monthParam != '') ? Integer.valueOf(monthParam) : null;
            Integer pageNo = (pageNoParam != null && pageNoParam != '') ? Integer.valueOf(pageNoParam) : 1; // Default to page 1
            
            // Fixed limit value (perPage)
            Integer perPage = 100;

            // Determine startDate and endDate
            Date today = Date.today();
            Date startDate;
            Date endDate;
            
            if (year != null && month != null) {
                startDate = Date.newInstance(year, month, 1);
                endDate = startDate.addMonths(1).addDays(-1);
            } else if (year != null) {
                startDate = Date.newInstance(year, 1, 1);
                endDate = Date.newInstance(year, 12, 31);
            } else if (month != null) {
                startDate = Date.newInstance(today.year(), month, 1);
                endDate = startDate.addMonths(1).addDays(-1);
            }

            // Fetch current user details
            String userEmail = UserInfo.getUserEmail();
            User objUser = [SELECT User_Type__c,Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];
             system.debug('objUser in leave'+objUser);
            // String roleName = [SELECT Name FROM UserRole WHERE Id = :UserInfo.getUserRoleId()].Name;
            String orgID = [SELECT Id FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1].Id;
            system.debug('orgID in leave'+orgID);
            String userType = objUser.User_Type__c;
            String userId = UserInfo.getUserId();
            Set<Id> facilityIdSet = new Set<Id>();
            if (userType == 'Facility Admin' || userType == 'Roster Manager' ||  userType == 'HR Admin'  ) {
                list<Facility_Association__c>  facAssociation =PortalUserController.getFacilityUserWise(UserId,userType);
                for (Facility_Association__c fa : facAssociation) {
                    if (fa.Facility__c != null) {
                        facilityIdSet.add(fa.Facility__c);
                    }
                }
            }

            // Base query for counting total records
            String baseQuery = 'SELECT COUNT() FROM Leave__c WHERE ';
            String dataQuery = 'SELECT Id,Name, Type_of_Leave__c, Staff__c, From__c, To__c, Reason__c, Status__c, Leave_Document__c, leave_applied_date__c, ' +
                               'Staff__r.Name, Staff__r.Last_Name__c, Staff__r.Gender__c, Staff__r.Age__c, Staff__r.Annual_Leave__c, ' +
                               'Staff__r.Primary_Contact_First_Name__c, Staff__r.Primary_Contact_Last_Name__c, Staff__r.Secondary_Contact_First_Name__c, Staff__r.Secondary_Contact_Last_Name__c, ' +
                               'Staff__r.Sick_Leave__c, Staff__r.Parental_Leave__c, Staff__r.Bereavement_Leave__c, Duration__c,Balance__c, Approved_by__c, Comments__c,Paid_Leave__c,Unpaid_Leave__c FROM Leave__c WHERE ';

            // Check the `allleaves` parameter
            Boolean allLeaves = (allLeavesParam != null && allLeavesParam.toLowerCase() == 'true');

            if (allLeaves) {
                
                if (userType != 'NDIS Org Admin') {
                    // Fetch all leaves based on the organization
                    baseQuery += 'Staff__r.Facility__r.Organisation__c = :orgID AND Staff__r.Facility__c IN:facilityIdSet AND leave_applied_date__c >= :startDate ' +
                        'AND leave_applied_date__c <= :endDate';
                    dataQuery += 'Staff__r.Facility__r.Organisation__c = :orgID AND Staff__r.Facility__c IN:facilityIdSet AND leave_applied_date__c >= :startDate ' +
                        'AND leave_applied_date__c <= :endDate';
                }else{
                    // Fetch all leaves based on the organization
                    baseQuery += 'Staff__r.Facility__r.Organisation__c = :orgID AND leave_applied_date__c >= :startDate ' +
                        'AND leave_applied_date__c <= :endDate';
                    dataQuery += 'Staff__r.Facility__r.Organisation__c = :orgID AND leave_applied_date__c >= :startDate ' +
                        'AND leave_applied_date__c <= :endDate';
                }
              
            } else {
                // Fetch leaves for the current user by email
                baseQuery += 'Staff__r.Email_Address__c = :userEmail AND leave_applied_date__c >= :startDate ' +
                             'AND leave_applied_date__c <= :endDate';
                dataQuery += 'Staff__r.Email_Address__c = :userEmail AND leave_applied_date__c >= :startDate ' +
                             'AND leave_applied_date__c <= :endDate';
            }

            // Count total records
            Integer totalResult = Database.countQuery(baseQuery);
			
            Integer totalPages = (Integer)Math.ceil((Decimal)totalResult / perPage);
            Integer offsetvalue = (pageNo - 1) * perPage;
            // Add LIMIT and OFFSET to data query
             dataQuery += ' order by leave_applied_date__c desc';
            dataQuery += ' LIMIT :perPage  OFFSET :offsetvalue';

            // Fetch paginated data
            List<Leave__c> leaves = Database.query(dataQuery);

            // Strip inaccessible fields
            SObjectAccessDecision decision = Security.stripInaccessible(AccessType.READABLE, leaves);
            List<Leave__c> accessibleRecords = (List<Leave__c>) decision.getRecords();

            // Calculate pagination details
            // Calculate pagination details
           


            // Count statuses by iterating through the list
             // Initialize status counts with default values
            Map<String, Integer> statusCounts = new Map<String, Integer>{
                'Approved' => 0,
                'Rejected' => 0,
                'Requested' => 0
            };

            // Count statuses by iterating through the list
            for (Leave__c leave : accessibleRecords) {
                String status = leave.Status__c;
                if (statusCounts.containsKey(status)) {
                    statusCounts.put(status, statusCounts.get(status) + 1);
                }
            }

            // Prepare response map
            Map<String, Object> responseMap = new Map<String, Object>();
            responseMap.put('data', accessibleRecords);
            responseMap.put('totalResult', totalResult);
            responseMap.put('pageNo', pageNo);
            responseMap.put('totalPages', totalPages);
            responseMap.put('perPage', perPage);
            responseMap.put('statusCounts', statusCounts);
            responseMap.put('statusCounts', statusCounts);


            // Serialize response to JSON and set it in the response body
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
            res.statusCode = 200; // OK

        } catch (Exception e) {
            // Handle errors and set the response
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, Object>{
                'error' => true,
                'message' => e.getMessage()
            }));
            res.statusCode = 200; // Bad Request
        }
    }
    @HttpPost
    global static void insertLeaves() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        string jsonString = req.requestBody.toString();
        leaveWrapper leaveWrapperList = (leaveWrapper) JSON.deserialize(jsonString, leaveWrapper.class);
        Map<String, Object> responseMap = new Map<String, Object>();
        
        try {
            if (leaveWrapperList != null ) {
                Leave__c lc = new Leave__c();
                lc.Status__c = leaveWrapperList.status;
                lc.Comments__c = leaveWrapperList.comments;
                
                if (leaveWrapperList.isUpdate == true) {
                    lc.Id = leaveWrapperList.LeaveId; 
                    lc.Approved_by__c=UserInfo.getName();
                    update lc;
                    responseMap.put('error', false);
                    responseMap.put('message', 'Leave record updated successfully. LeaveId: ' + lc.Id);
                } else {
                    lc.Type_of_Leave__c = leaveWrapperList.typeOfleave;
                    lc.Reason__c = leaveWrapperList.reason;
                    lc.From__c = leaveWrapperList.fromDate;
                    lc.To__c = leaveWrapperList.toDate; 
                    lc.Duration__c = leaveWrapperList.duration;
                    lc.Balance__c = leaveWrapperList.balance;
                    lc.Paid_Leave__c = leaveWrapperList.paidLeave;  
                    lc.Unpaid_Leave__c = leaveWrapperList.unpaidLeave;
                    lc.Staff__c=leaveWrapperList.staffId;
                    
                    insert lc;
                    
                    if (lc.Id != null && leaveWrapperList.fileName != null) {
                        String fileName = leaveWrapperList.fileName.trim().replaceAll('\\s+', '_');
                        AWSS3FileUploadController.uploadFile(leaveWrapperList.base64, fileName, String.valueOf(lc.Id), 'leave');
                    }
                    
                    responseMap.put('error', false);
                    responseMap.put('message', 'Leave record created successfully. LeaveId: ' + lc.Id);
                }
            } else {
                responseMap.put('error', true);
                responseMap.put('message', 'Request body is empty or invalid.');
            }
        } catch (Exception e) {
            responseMap.put('error', true);
            responseMap.put('message', e.getMessage());
        }
        
        res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
        res.statusCode = 200;
    }

    global class leaveWrapper {
        global string typeOfleave;
        global string reason;
        global date fromDate;
        global date toDate;
        global decimal duration;
        global decimal balance;
        global decimal paidLeave;
        global decimal unpaidLeave;
        global string status;
        global string comments;
        global boolean isUpdate;
        global Id LeaveId;
        global String fileName;
        global String base64;
        global Id staffId;
    }

}