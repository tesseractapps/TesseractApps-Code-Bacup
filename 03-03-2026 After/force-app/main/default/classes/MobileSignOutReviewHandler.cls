@RestResource(urlMapping='/signOutReviewApi/*')
global class MobileSignOutReviewHandler {
   
  global class ShiftSignOutReviewWrapper {
        global String shiftWithStaffId;
        global String staffName;
        global Date shiftDate;
        global String loginTime;
        global String logOutTime;
      global  string  shiftNotes;
        global List<ReimbursementWrapper> reimbursements = new List<ReimbursementWrapper>();
        global List<SignInNote> activities = new List<SignInNote>();
        global List<CheckListItem> checkLists = new List<CheckListItem>();
        global List<BreakInBreakOutWrapper> breaks = new List<BreakInBreakOutWrapper>();
    }

    global class ReimbursementWrapper {
        global String resId;
        global String resNo;
        global Decimal amount;
        global Decimal totalAmount;
        global String status;
        global string MileageInKm;
        global Decimal CostPerKm;
        global Decimal mileageAmount;
  
        global string AprrovedDate;
        global string amazonUrl;
        global string comments;
        global string shiftWithStaffId;
        global string ApproverComments;
        global string typeofVechile;
    }

    global class CheckListItem {
        global String checklistId;
        global String checkListNum;
        global Boolean isMandatory;
        global String description;
        global Boolean isCompleted;
    }

    global class SignInNote {
        global String signInNotesId;
        global String notes;
    }

    global class BreakInBreakOutWrapper {
        global String breakId;
        global String breakInTime;
        global Date breakStartDate;
        global String breakOutTime;
        global Date breakEndDate;
    }
    public static String formatToAmPm(Time t) {
    if (t == null) return null;
    // Use today's date just to format the time
    DateTime dt = DateTime.newInstance(Date.today(), t);
    return dt.format('hh:mm a');
}

 @HttpGet
    global static void getSignOutReview() {
        RestResponse res = RestContext.response;
        Map<String, Object> responseMap = new Map<String, Object>();

        try {
            String shiftWithStaffID = RestContext.request.params.get('shiftId');
            if (String.isBlank(shiftWithStaffID)) {
                responseMap.put('success', false);
                responseMap.put('message', 'shiftId is required');
                responseMap.put('record', null);
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }

            ShiftwithStaff__c shift = [
                SELECT Id,
                       Start_Date__c,
                       Start_time_Formula__c,
                       End_time_formula__c,
                       Login_Time_Formula__c,
                       Logout_Time_Formula__c,
                SignIn_Notes__c,
                       (SELECT Id, Name, Amount__c, Mileage_Others__c,Cost_per_KM__c, Mileage_Amount__c, Total_Amount__c, Approval_Status__c, Amazon_file_URL__c, Comments__c,
                        Type_of_Vehicle__c,Approved_Date__c FROM Reimbursements__r),
                       (SELECT Id, Notes__c FROM ShiftWithStaff_Activities__r),
                       (SELECT Id, Name, Mandatory__c, Description__c, Completed__c FROM Add_Shift_Checklists__r),
                       (SELECT Id, Break_Start_Time__c, Break_Start_Date__c, Break_End_Time__c, Break_End_Date__c FROM Break_Timings__r)
                FROM ShiftwithStaff__c
                WHERE Id = :shiftWithStaffID
                LIMIT 1
            ];

            ShiftSignOutReviewWrapper parent = new ShiftSignOutReviewWrapper();
            parent.shiftWithStaffId = String.valueOf(shift.Id);
            parent.shiftDate = shift.Start_Date__c;
            parent.loginTime = shift.Login_Time_Formula__c;
            parent.logOutTime = shift.Logout_Time_Formula__c ;
            parent.shiftNotes=shift.SignIn_Notes__c;

            // Reimbursements
            Decimal total = 0;
            if (shift.Reimbursements__r != null) {
                for (Reimbursement__c r : shift.Reimbursements__r) {
                    ReimbursementWrapper rw = new ReimbursementWrapper();
                    rw.resId = String.valueOf(r.Id);
                    rw.resNo = r.Name;
                    rw.amount = r.Amount__c;
                    rw.MileageInKm=r.Mileage_Others__c;
                    rw.CostPerKm=r.Cost_per_KM__c;
                    rw.mileageAmount = r.Mileage_Amount__c;
                    rw.totalAmount = r.Total_Amount__c ;
                    rw.status = r.Approval_Status__c;
                    rw.AprrovedDate=r.Approved_Date__c;
                    rw.amazonUrl = r.Amazon_file_URL__c;
                    rw.comments = r.Comments__c;
                    rw.typeofVechile = r.Type_of_Vehicle__c;
                    parent.reimbursements.add(rw);
            
                }
            }


            // Activities
            if (shift.ShiftWithStaff_Activities__r != null) {
                for (ShiftWithStaff_Activity__c a : shift.ShiftWithStaff_Activities__r) {
                    SignInNote sn = new SignInNote();
                    sn.signInNotesId = String.valueOf(a.Id);
                    sn.notes = a.Notes__c;
                    parent.activities.add(sn);
                }
            }

            // Checklists
            if (shift.Add_Shift_Checklists__r != null) {
                for (Add_Shift_Checklist__c c : shift.Add_Shift_Checklists__r) {
                    CheckListItem ci = new CheckListItem();
                    ci.checklistId = String.valueOf(c.Id);
                    ci.checkListNum = c.Name;
                    ci.isMandatory = c.Mandatory__c;
                    ci.description = c.Description__c;
                    ci.isCompleted = c.Completed__c;
                    parent.checkLists.add(ci);
                }
            }

            // Breaks
            if (shift.Break_Timings__r != null) {
                for (Break_Timings__c b : shift.Break_Timings__r) {
                    BreakInBreakOutWrapper bw = new BreakInBreakOutWrapper();
                    bw.breakId = String.valueOf(b.Id);
                    bw.breakInTime = formatToAmPm(b.Break_Start_Time__c);
                    bw.breakStartDate = b.Break_Start_Date__c;
                    bw.breakOutTime = formatToAmPm(b.Break_End_Time__c);
                    bw.breakEndDate = b.Break_End_Date__c;
                    parent.breaks.add(bw);
                }
            }

            responseMap.put('success', true);
            responseMap.put('message', 'Shift details retrieved');
            responseMap.put('record', parent);
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
            return;

        } catch (Exception e) {
            responseMap.put('success', false);
            responseMap.put('message', 'Error: ' + e.getMessage());
            responseMap.put('record', null);
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
            return;
        }
    }
}