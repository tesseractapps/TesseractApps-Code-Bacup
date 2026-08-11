/* test class :AllocationCopyTest */
@RestResource(urlMapping='/getMytimeSheetApi/')
global class MobileAppMyTimeSheet {
     @HttpGet
    global static void getMytimeSheetRecords() {
        RestResponse res = RestContext.response;
        
        try {
            RestRequest req = RestContext.request;
            Map<String, String> requestParams = req.params;

            // Get request params
           // String orgName = requestParams.get('orgName');
            String staffId = requestParams.get('staffId');
            String startDateStr = requestParams.get('startDate');
            String endDateStr = requestParams.get('endDate');
            String pageNoParam = requestParams.get('pageNo');

            Integer pageNo = (pageNoParam != null && pageNoParam != '') ? Integer.valueOf(pageNoParam) : 1;
            Integer perPage = 100;
            Integer offsetValue = (pageNo - 1) * perPage;

            Date startDate = (startDateStr != null && startDateStr != '') ? Date.valueOf(startDateStr) : null;
            Date endDate = (endDateStr != null && endDateStr != '') ? Date.valueOf(endDateStr) : null;

            // Build base query
            String baseQuery = 'FROM Allocation__c where Status__c=\'Approved\' ';
            
            if (staffId != null && staffId != '') {
                baseQuery += ' AND Staff__c=:staffId';
            }

            if (startDate != null && endDate != null) {
                baseQuery += ' AND Start_Date__c >= :startDate AND End_Date__c <= :endDate';
            }

            // Count total records
            Integer totalResult = Database.countQuery('SELECT COUNT() ' + baseQuery);
            Integer totalPages = (Integer)Math.ceil((Decimal)totalResult / perPage);

            // Add fields to select + LIMIT/OFFSET
            String dataQuery = 'SELECT id,name,End_Date__c,Start_Date__c,Staff__c,Shift_Type__c,Working_Hours__c,Start_Time_Formula__c,LastModifiedBy.Name,ICT_TimeSheet__r.Approver_Name__c,Extended_Hours__c,End_Date_Time__c,Shift_time_AMPM__c,Status__c,Start_time__c,End_time__c,Break__c,ICT_TimeSheet__r.Status__c,Status_Formula__c,Comments__c,Start_Date_Time__c,Staff__r.Type_of_User__c ' +
                baseQuery + 
                ' order by Start_Date__c ASC LIMIT :perPage OFFSET :offsetValue';

            List<Allocation__c> records = Database.query(dataQuery);

            // Clean up inaccessible fields
            SObjectAccessDecision access = Security.stripInaccessible(AccessType.READABLE, records);
            List<Allocation__c> timeSheetRecords = (List<Allocation__c>)access.getRecords();
            List<ICTTimeSheetWrapper> wrappedList = new List<ICTTimeSheetWrapper>();
            for (Allocation__c a : timeSheetRecords) {
                wrappedList.add(new ICTTimeSheetWrapper(a));
            }

            // Build response
            Map<String, Object> responseMap = new Map<String, Object>{
                'data' => wrappedList,
                'totalResult' => totalResult,
                'pageNo' => pageNo,
                'totalPages' => totalPages,
                'perPage' => perPage
            };

            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
            res.statusCode = 200;
        } catch (Exception e) {
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, Object>{
                'error' => true,
                'message' => e.getMessage()
            }));
            res.statusCode = 200;
        }
    }
    
    public class ICTTimeSheetWrapper {
    public String id;
    public String startDate;
    public String endDate;
    public String approvedBy;
    public Decimal hours;

    public ICTTimeSheetWrapper(Allocation__c alloc) {
        this.id = alloc.Id;
        this.startDate = alloc.Start_Date__c != null ? String.valueOf(alloc.Start_Date__c) : 'N/A';
        this.endDate = alloc.End_Date__c != null ? String.valueOf(alloc.End_Date__c) : 'N/A';
        this.hours = alloc.Working_Hours__c != null ? alloc.Working_Hours__c : 0;

        if (alloc.Staff__r != null && alloc.Staff__r.Type_of_User__c == 'ICT User') {
            this.approvedBy = (alloc.ICT_TimeSheet__r != null) ? alloc.ICT_TimeSheet__r.Approver_Name__c : 'No Data';
        } else {
            this.approvedBy = (alloc.LastModifiedBy != null) ? alloc.LastModifiedBy.Name : 'N/A';
        }
    }
}

}