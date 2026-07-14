/*Test class:SubmissionsControllerTest*/
@RestResource(urlMapping='/rejectedReimbursementsList/*')
global class MobileRejectedReimbursementsApi {

    @HttpGet
    global static List<MobileReimbursementsApproval.reimbursementWrapper> getAllAprrovals() {

        RestRequest req = RestContext.request;
        System.debug('Start Date >>>> ' + req.params.get('startDate'));

        String startDate = req.params.get('startDate');

        List<MobileReimbursementsApproval.reimbursementWrapper> facilityWrapperList =
            new List<MobileReimbursementsApproval.reimbursementWrapper>();

        // Calling rejected reimbursements method
        List<Reimbursement__c> getAllReimbursements =
            SubmissionsController.PendingReimbursementsForMobile(startDate);

        System.debug('Rejected Reimbursements >>> ' + getAllReimbursements);

        for (Reimbursement__c rei : getAllReimbursements) {

            MobileReimbursementsApproval.reimbursementWrapper reimWrapper =
                new MobileReimbursementsApproval.reimbursementWrapper();

            reimWrapper.ResId = rei.Id;
            reimWrapper.ResNo = rei.Name;

            reimWrapper.firstName =
                rei.ShiftwithStaff__r.Staff__r.NameToDisplay__c;

            reimWrapper.ShiftDate = rei.ShiftDate__c;

            reimWrapper.LoginTime =
                rei.Shift_Login_time_formula__c;

            reimWrapper.LogOutTime =
                rei.Shift_log_out_time_formula__c;

            reimWrapper.MileageInKm =
                rei.Mileage_Others__c;

            reimWrapper.CostPerKm =
                rei.Cost_per_KM__c;

            reimWrapper.mileageAmount =
                rei.Mileage_Amount__c;

            reimWrapper.Amount =
                rei.Amount__c;

            reimWrapper.TotalAmount =
                rei.Total_Amount__c;

            reimWrapper.Status =
                rei.Approval_Status__c;

            reimWrapper.AprrovedDate =
                rei.Approved_Date__c;

            reimWrapper.amzonUrl =
                rei.Amazon_file_URL__c;

            reimWrapper.comments =
                rei.Comments__c;

            reimWrapper.typeofVechile =
                rei.Type_of_Vehicle__c;

            reimWrapper.shiftWithStaffId =
                rei.ShiftwithStaff__c;

            reimWrapper.multipleExpenseJSON =
                rei.Multiple_Expenses__c;

            reimWrapper.activityTransportVechicleUsed =
                rei.Activity_Transport_Vehicle__c;

            reimWrapper.transportMethod =
                rei.Transport_Method__c;

            reimWrapper.travelEndTime =
                rei.Travel_End_Time_Formula__c;

            reimWrapper.travelStartTime =
                rei.Travel_Start_Time_Formula__c;

            reimWrapper.submittedDate =
                rei.Submitted_Date__c;

            reimWrapper.transportType =
                rei.Transport_Type__c;

            reimWrapper.ApproverComments =
                rei.Approver_Comments__c;

            reimWrapper.odoMeterStart =
                rei.Odo_Meter_Start__c;

            reimWrapper.OdoMeterEnd =
                rei.Odo_Meter_End__c;

            facilityWrapperList.add(reimWrapper);
        }

        return facilityWrapperList;
    }
}