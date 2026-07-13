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
            reimWrapper.comments=rei.Comments__c;
            reimWrapper.typeofVechile=rei.Type_of_Vehicle__c ;
            reimWrapper.shiftWithStaffId=rei.ShiftwithStaff__c ;
            
             reimWrapper.multipleExpenseJSON=rei.Multiple_Expenses__c;
            reimWrapper.activityTransportVechicleUsed=rei.Activity_Transport_Vehicle__c;
            reimWrapper.transportMethod=rei.Transport_Method__c;
            reimWrapper.travelEndTime=rei.Travel_End_Time_Formula__c ;
            reimWrapper.travelStartTime=rei.Travel_Start_Time_Formula__c ;
            reimWrapper.submittedDate=rei.Submitted_Date__c ;
            reimWrapper.transportType=rei.Transport_Type__c ;
             reimWrapper.ApproverComments=rei.Approver_Comments__c ;
            reimWrapper.odoMeterStart=rei.Odo_Meter_Start__c ;
            reimWrapper.OdoMeterEnd=rei.Odo_Meter_End__c ;
            facilityWrapperList.add(reimWrapper);
           
        }
        return facilityWrapperList;
        
    }
    
   @HttpPost
    global static void updateReimbursements() {
    
        RestResponse res = RestContext.response;
        Map<String, Object> responseMap = new Map<String, Object>();
    
        try {
    
            RestRequest req = RestContext.request;
            Map<String, Object> requestBody =
                (Map<String, Object>) JSON.deserializeUntyped(req.requestBody.toString());
    
            // 🔹 Extract inputs
            Id reimbursementId = (Id) requestBody.get('reimburseId');
            String status = (String) requestBody.get('status');
            String comments = (String) requestBody.get('comments');
   
            List<Map<String, Object>> payloadList = new List<Map<String, Object>>();
            
            if (requestBody.containsKey('payloadList') && requestBody.get('payloadList') != null) {
                
                List<Object> rawList = (List<Object>) requestBody.get('payloadList');
                
                for (Object obj : rawList) {
                    payloadList.add((Map<String, Object>) obj);
                }
            }
    
            // 🔥 Call existing reusable method
            SubmissionsController.updateInvoiceAndReimbursementBulk(
                reimbursementId,
                payloadList,
                status,
                comments
            );
    
            // ✅ Success Response
            responseMap.put('isSuccess', true);
            responseMap.put('message', 'Updated Successfully');
    
            res.statusCode = 200;
    
        } catch (Exception e) {
    
            // ❌ Error Response
            responseMap.put('isSuccess', false);
            responseMap.put('message', e.getMessage());
    
            res.statusCode = 500;
        }
    
        res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
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
         global string transportType;
         global string travelStartTime;
         global string travelEndTime;
         global string transportMethod;
         global string activityTransportVechicleUsed;
         global string multipleExpenseJSON;
         global date submittedDate;
         global Decimal odoMeterStart;
         global decimal OdoMeterEnd;
         
         
    }
	

}