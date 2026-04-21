/*Test class:SubmissionsControllerTest*/
@RestResource(urlMapping='/ReimbursementsApprovalApi/*')
global class MobileReimbursementsApproval {
    @HttpGet
    global static list<reimbursementWrapper> getAllAprrovals(){
        RestRequest req = RestContext.request;
        system.debug('Start Date >>>>'+ req.params.get('startDate'));
        string StartDate = (req.params.get('startDate'));
        list<reimbursementWrapper> facilityWrapperList= new list<reimbursementWrapper>();
        List<Reimbursement__c> getAllReimbursements=SubmissionsController.getAllReimbursementsForMobile(startDate) ;
        for(Reimbursement__c rei:getAllReimbursements){
            reimbursementWrapper reimWrapper = new reimbursementWrapper();
            reimWrapper.ResId=rei.Id;
            reimWrapper.ResNo=rei.Name;
            reimWrapper.firstName=rei.ShiftwithStaff__r.Staff__r.NameToDisplay__c;
            reimWrapper.ShiftDate=rei.ShiftDate__c;
            reimWrapper.LoginTime=rei.Shift_login_time_Formula__c;
            reimWrapper.LogOutTime=rei.Shift_log_out_time_formula__c;
            reimWrapper.MileageInKm=rei.Mileage_Others__c;
            reimWrapper.CostPerKm=rei.Cost_per_KM__c;
            reimWrapper.mileageAmount=rei.Mileage_Amount__c;
            reimWrapper.Amount=rei.Amount__c;
            reimWrapper.TotalAmount=rei.Total_Amount__c;
            reimWrapper.Status=rei.Approval_Status__c;
            reimWrapper.AprrovedDate=rei.Approved_Date__c;
            reimWrapper.amzonUrl=rei.Amazon_file_URL__c;
            reimWrapper.comments=rei.Approver_Comments__c;
            reimWrapper.typeofVechile=rei.Type_of_Vehicle__c ;
            facilityWrapperList.add(reimWrapper);
           
        }
        return facilityWrapperList;
        
    }
    
     @HttpPost
    global static string updateReimbursements(){
        try{
            
            RestRequest req = RestContext.request;
            Map<String, Object> requestBody = (Map<String, Object>) JSON.deserializeUntyped(req.requestBody.toString());
            String status = (String) requestBody.get('status');
            String reimburseId = (String) requestBody.get('reimburseId');
            String comments = (String) requestBody.get('comments');
            system.debug('status'+status);
             system.debug('reimburseId'+reimburseId);

            Reimbursement__c rei = new Reimbursement__c();
            rei.id=reimburseId;
            rei.Approver_Comments__c=comments;
            rei.Approval_Status__c=status;  
            update rei;
           
        }catch(exception e){
           return e.getMessage();
        }
         return 'Updated';	     
        
    }
    
     global class reimbursementWrapper{
         global id ResId;
         global string ResNo;
         global string firstName;
         global date ShiftDate;
         global string LoginTime;
         global string LogOutTime;
         global string MileageInKm;
         global Decimal CostPerKm;
         global Decimal mileageAmount;
         global Decimal Amount;
         global decimal TotalAmount;
         global string Status;
         global string AprrovedDate;
         global string amzonUrl;
         global string comments;
         global string shiftWithStaffId;
         global string ApproverComments;
         global string typeofVechile;
         
    }
	

}