/* TEST CLASS PayRunHandlerTest2 */
@RestResource(urlMapping='/getPaySlipApi/')
global class MobileMyProfilePaySlipHandler {
	 @HttpGet
    global static void getPayrollRecords() {
        RestResponse res = RestContext.response;
        
        try {
           // User objUser = [SELECT Id, Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];
           // String orgID = [SELECT Id FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1].Id;
            // string orgName=objUser.Organization_Name__c;
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
            String baseQuery = 'FROM Staff_Payroll_Setting__c WHERE Payroll_Setting__r.Status__c IN (\'Submitted\', \'STP Filed\')';
            
            if (staffId != null && staffId != '') {
                baseQuery += ' AND Staff__c = :staffId';
            }

            if (startDate != null && endDate != null) {
                baseQuery += ' AND Pay_Date__c >= :startDate AND Pay_Date__c <= :endDate';
            }

            // Count total records
            Integer totalResult = Database.countQuery('SELECT COUNT() ' + baseQuery);
            Integer totalPages = (Integer)Math.ceil((Decimal)totalResult / perPage);

            // Add fields to select + LIMIT/OFFSET
            String dataQuery = 'SELECT Id, Name, Staff__r.Name, Staff__r.Last_Name__c, Amazon_URL__c, Gross_Salary_Display__c, Total_Hours__c, Tax__c, Super_Annuation_Final__c, Reimbursements__c, Super_And_Voluntary_Supper_Annuation__c, Post_Tax_Formula__c, Pre_Tax_Formula__c, Staff__c, Payroll_Setting__r.Period_Start_Date__c, Payroll_Setting__r.Period_End_Date__c, Payroll_Setting__r.Next_Pay_Date__c, Net_Pay__c, Resource_Name__c, Start_Date__c, End_Date__c, Pay_Date__c, Last_Tax_YTD__c, Last_Superannuation_YTD__c, Last_Taxable_Gross_Salary_YTD__c, Last_Net_Pay_Salary__c, Last_Salary_Wages_YTD__c, Last_Pre_Tax_YTD__c, Last_Post_Tax_YTD__c, Payroll_Setting__r.Status__c, Pay_Event_Indicator__c, Finalised_Formula__c, Current_Tax_YTD__c, Current_Superannuation_YTD__c, Current_Taxble_Gross_Salary_YTD__c, Current_Net_Pay_Salary_YTD__c, Current_Pre_Tax_YTD__c, Current_Post_Tax_YTD__c, Current_Super_and_Voluntaryannuation_YTD__c ' +
                baseQuery + 
                ' ORDER BY Pay_Date__c ASC LIMIT :perPage OFFSET :offsetValue';

            List<Staff_Payroll_Setting__c> records = Database.query(dataQuery);

            // Clean up inaccessible fields
            SObjectAccessDecision access = Security.stripInaccessible(AccessType.READABLE, records);
            List<Staff_Payroll_Setting__c> payslipRecords = (List<Staff_Payroll_Setting__c>)access.getRecords();
            List<PayrollWrapper> wrappedRecords = new List<PayrollWrapper>();
            for (Staff_Payroll_Setting__c rec : payslipRecords) {
                wrappedRecords.add(new PayrollWrapper(rec));
            }

            // Build response
            Map<String, Object> responseMap = new Map<String, Object>{
                'data' => wrappedRecords,
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
    
    public class PayrollWrapper {
    public String sName { get; set; }
    public Date StartDate { get; set; }
    public Date endDate { get; set; }
    public Date nextPayDate { get; set; }
    public Decimal totalHours { get; set; }
    public Decimal preTax { get; set; }
    public Decimal postTax { get; set; }
    public Decimal grossSalary { get; set; }
    public Decimal tax { get; set; }
    public Decimal reimbursement { get; set; }
    public Decimal superAnnuation { get; set; }
    public Decimal voluntarySuper { get; set; }
    public Decimal netPay { get; set; }
    public String amazonUrl { get; set; }
    public String id { get; set; }

    public PayrollWrapper(Staff_Payroll_Setting__c rec) {
        this.sName = rec.Staff__r.Name + ' ' + rec.Staff__r.Last_Name__c;
        this.StartDate = rec.Payroll_Setting__r.Period_Start_Date__c;
        this.endDate = rec.Payroll_Setting__r.Period_End_Date__c;
        this.nextPayDate = rec.Payroll_Setting__r.Next_Pay_Date__c;
        this.totalHours = rec.Total_Hours__c;
        this.preTax = rec.Pre_Tax_Formula__c;
        this.postTax = rec.Post_Tax_Formula__c;
        this.grossSalary = rec.Gross_Salary_Display__c;
        this.tax = rec.Tax__c;
        this.reimbursement = rec.Reimbursements__c;
        this.superAnnuation = rec.Super_Annuation_Final__c;
        this.voluntarySuper = rec.Super_And_Voluntary_Supper_Annuation__c;
        this.netPay = rec.Net_Pay__c;
        this.amazonUrl = rec.Amazon_URL__c;
        this.id = rec.Id;
    }
    }
}