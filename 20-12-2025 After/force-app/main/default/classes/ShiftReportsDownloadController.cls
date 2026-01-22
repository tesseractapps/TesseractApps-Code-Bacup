public with sharing class ShiftReportsDownloadController {
    
    public String staffName { get; set; }
    public String shiftDate { get; set; }
    public String shiftTime { get; set; }
    public String role { get; set; }
    public List<ReimbursementItem> reimbursements { get; set; }

    public List<ActivityLog> activityLogs { get; set; }
    public List<ServiceDelivered> services { get; set; }
    public List<String> shiftNotes { get; set; }
    public List<String> checklist { get; set; }
    
    // Replace the checklist with a single signature string
    public String signature { get; set; }

    public ShiftReportsDownloadController() {
        String shiftId = ApexPages.currentPage().getParameters().get('shiftId');

        if (String.isBlank(shiftId)) {
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'Shift ID is required.'));
            return;
        }

        Map<String, Object> result = ShiftReportsController.getAddShiftById(shiftId);
        System.debug('Shift data result: ' + result);

        ShiftwithStaff__c shift = (ShiftwithStaff__c) result.get('shiftwithstaffdata');
        List<Add_Shift_Checklist__c> checklistData = 
            (List<Add_Shift_Checklist__c>) JSON.deserialize((String)result.get('checklistdata'), List<Add_Shift_Checklist__c>.class);

        if (shift == null) return;

       // staffName = shift.Staff_Name__c;
        //staffName = shift.Staff__r.Display_Nickname__c;
        //shiftDate = String.valueOf(shift.Date__c);
        staffName = shift.Staff__r != null && shift.Staff__r.Display_Nickname__c != null 
        ? shift.Staff__r.Display_Nickname__c : '';
        
        shiftDate = shift.Date__c != null ? String.valueOf(shift.Date__c) : '';
        shiftTime = shift.Add_Shift__r != null ? shift.Add_Shift__r.Shift_Start_End_Time__c : '';
       role = shift.Add_Shift__r != null ? shift.Add_Shift__r.Role__c : '';
        
      /*  reimbursement = 0;
        if (shift.Reimbursements__r != null) {
            for (Reimbursement__c r : shift.Reimbursements__r) {
                reimbursement += (r.Total_Amount__c != null) ? r.Total_Amount__c : 0;
            }
        }*/
        reimbursements = new List<ReimbursementItem>();

        if (shift.Reimbursements__r != null) {
            for (Reimbursement__c r : shift.Reimbursements__r) {reimbursements.add(new ReimbursementItem(r.Type_of_Vehicle__c,                       r.Total_Amount__c != null ? r.Total_Amount__c : 0,r.Comments__c,r.Approval_Status__c            
                ));
            }
        }

        activityLogs = new List<ActivityLog>();
        if (shift.ShiftWithStaff_Activities__r != null) {
            for (ShiftWithStaff_Activity__c act : shift.ShiftWithStaff_Activities__r) {activityLogs.add(new ActivityLog(String.valueOf(act.CreatedDate.format()), act.Notes__c
                ));
            }
        }

        services = new List<ServiceDelivered>();
        if (shift.Services_and_Support_Plans__r != null) {
            for (Services_and_Support_Plan__c srv : shift.Services_and_Support_Plans__r) {services.add(new ServiceDelivered(srv.Start_Time_Formula__c,srv.Service_Type_Name__c,String.valueOf(srv.Qty__c)
                ));
            }
        }

        shiftNotes = new List<String>();
        if (shift.Add_Shift__r != null && !String.isBlank(shift.Add_Shift__r.Shift_Notes__c)) {shiftNotes.add(shift.Add_Shift__r.Shift_Notes__c);
        }

        checklist = new List<String>();
        for (Add_Shift_Checklist__c chk : checklistData) {checklist.add(chk.Description__c + (chk.Mandatory__c ? ' (Mandatory)' : ''));
        }

        // Dynamically assign your signature here
        // Example: Assume signature is stored on the shift record in a rich text field Signature__c
        signature = shift.Client_Signature__c != null ? shift.Client_Signature__c : 'No signature available';
    }

    public class ActivityLog {
        public String logTime { get; set; }
        public String task { get; set; }
        public ActivityLog(String logTimeStr, String taskText) {
            logTime = logTimeStr;
            task = taskText;
        }
    }

    public class ServiceDelivered {
        public String serviceTime { get; set; }
        public String service { get; set; }
        public String hours { get; set; }
        public ServiceDelivered(String serviceTimeStr, String serviceText, String hoursStr) {
            serviceTime = serviceTimeStr;
            service = serviceText;
            hours = hoursStr;
        }
    }
    public class ReimbursementItem {
        public String type { get; set; }
        public Decimal amount { get; set; }
    	public String comments { get; set; }
        public String status { get; set; }
        
        public ReimbursementItem(String vehicleType, Decimal amountValue, String comments, String approvedStatus) {
            this.type = vehicleType;
            this.amount = amountValue;
            this.comments = comments;
            this.status = approvedStatus;
        }
    }
}