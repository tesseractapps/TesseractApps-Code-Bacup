/*Test class:SubmissionsControllerTest*/
@RestResource(urlMapping='/rejectedReimbursementsList/*')
global class MobileRejectedReimbursementsApi {
	@HttpGet
    
    global static list<MobileReimbursementsApproval.reimbursementWrapper> getAllAprrovals(){
        RestRequest req = RestContext.request;
        string StartDate = (req.params.get('startDate'));
        list<MobileReimbursementsApproval.reimbursementWrapper> facilityWrapperList= new list<MobileReimbursementsApproval.reimbursementWrapper>();
        List<Reimbursement__c> getAllReimbursements=SubmissionsController.PendingReimbursementsForMobile(startDate) ;
        system.debug('rei list '+getAllReimbursements);
        for(Reimbursement__c rei:getAllReimbursements){
            MobileReimbursementsApproval.reimbursementWrapper reimWrapper = new MobileReimbursementsApproval.reimbursementWrapper();
            reimWrapper.ResId=rei.Id;
            reimWrapper.ResNo=rei.Name;
            reimWrapper.ShiftDate=rei.ShiftDate__c;
            reimWrapper.LoginTime=rei.Shift_login_time_Formula__c;
            reimWrapper.LogOutTime=rei.Shift_log_out_time_formula__c;
            reimWrapper.MileageInKm=rei.Mileage_Others__c;
            reimWrapper.Amount=rei.Amount__c;
			reimWrapper.shiftWithStaffId=rei.ShiftwithStaff__c;
           	reimWrapper.comments=rei.Comments__c;
            reimWrapper.ApproverComments=rei.Approver_Comments__c;
            reimWrapper.typeofVechile=rei.Type_of_Vehicle__c ;
            facilityWrapperList.add(reimWrapper);
           
        }
        return facilityWrapperList;
    }
}