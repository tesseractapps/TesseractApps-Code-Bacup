/*Test class:SubmissionsControllerTest*/
@RestResource(urlMapping='/ReimbursementsApprovalApi/*')
global class MobileReimbursementsApproval {
    /*@HttpGet
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
            System.debug(LoggingLevel.INFO, 
    'ApproverComments for Reimbursement ' + rei.Id + ' >>> ' + rei.Approver_Comments__c
);
            reimWrapper.odoMeterStart=rei.Odo_Meter_Start__c ;
            reimWrapper.OdoMeterEnd=rei.Odo_Meter_End__c ;
            facilityWrapperList.add(reimWrapper);
           
        }
        return facilityWrapperList;
        
    }*/
    
    @HttpGet
    global static List<reimbursementWrapper> getAllAprrovals(){ 

        RestRequest req = RestContext.request;

        System.debug('Start Date >>>> ' + req.params.get('startDate'));

        String startDate = req.params.get('startDate');

        List<reimbursementWrapper> facilityWrapperList = new List<reimbursementWrapper>();

        // EXISTING
        List<Reimbursement__c> getAllReimbursements = SubmissionsController.getAllReimbursementsforMobile(startDate);

        // STEP 1 : COLLECT IDS
        Set<Id> shiftWithStaffIds = new Set<Id>();
        Set<Id> reimbursementIds = new Set<Id>();

        for(Reimbursement__c rei : getAllReimbursements){

            reimbursementIds.add(rei.Id);

            if(rei.ShiftwithStaff__c != null){
                shiftWithStaffIds.add(rei.ShiftwithStaff__c);
            }
        }

        // STEP 2 : GET ALL SERVICES
        Map<Id, List<Id>> shiftServiceMap = new Map<Id, List<Id>>();
        Set<Id> allServiceIds = new Set<Id>();

        for(Services_and_Support_Plan__c service : [
            SELECT Id, Services_name__c, ShiftwithStaff__c FROM Services_and_Support_Plan__c
            WHERE ShiftwithStaff__c IN :shiftWithStaffIds
        ]){

            allServiceIds.add(service.Id);

            if(!shiftServiceMap.containsKey(service.ShiftwithStaff__c)){
                shiftServiceMap.put(service.ShiftwithStaff__c, new List<Id>());
            }

            shiftServiceMap.get(service.ShiftwithStaff__c).add(service.Id);
        }

        // STEP 3 : GET ALL PARTICIPANT REIMBURSEMENTS
        List<Participant_Reimbrusement__c> participantRows = [

            SELECT Id,
                   Reimbrusement_Id__c,
                   Services_and_Support_Plan__c,
                   Services_and_Support_Plan__r.Support_Item_Name__c,
                   Services_and_Support_Plan__r.Client__r.Name,
                   Reimbrusment_Support_item__c,
                   Reimbrusment_line_item__c,
                   Reimbrusment_Quantity__c,
                   Reimbrusment_Rate__c,
                   Reimbrusement_Amount__c

            FROM Participant_Reimbrusement__c

            WHERE Services_and_Support_Plan__c IN :allServiceIds
            AND Reimbrusement_Id__c IN :reimbursementIds
        ];

        // STEP 4 : CREATE COMPOSITE MAP
        Map<String, List<Participant_Reimbrusement__c>> participantMap = new Map<String, List<Participant_Reimbrusement__c>>();

        for(Participant_Reimbrusement__c pr : participantRows){

            String key = pr.Reimbrusement_Id__c + '_' + pr.Services_and_Support_Plan__c;

            if(!participantMap.containsKey(key)){
                participantMap.put(key, new List<Participant_Reimbrusement__c>());
            }

            participantMap.get(key).add(pr);
        }

        // STEP 5 : BUILD FINAL RESPONSE
        for(Reimbursement__c rei : getAllReimbursements){

            reimbursementWrapper reimWrapper = new reimbursementWrapper();

            // EXISTING FIELDS
            reimWrapper.ResId = rei.Id;
            reimWrapper.ResNo = rei.Name;
            reimWrapper.firstName = rei.ShiftwithStaff__r.Staff__r.NameToDisplay__c;
            reimWrapper.ShiftDate = rei.ShiftDate__c;
            reimWrapper.LoginTime = rei.Shift_login_time_Formula__c;
            reimWrapper.LogOutTime = rei.Shift_log_out_time_formula__c;
            reimWrapper.MileageInKm = rei.Mileage_Others__c;
            reimWrapper.CostPerKm = rei.Cost_per_KM__c;
            reimWrapper.mileageAmount = rei.Mileage_Amount__c;
            reimWrapper.Amount = rei.Amount__c;
            reimWrapper.TotalAmount = rei.Total_Amount__c;
            reimWrapper.Status = rei.Approval_Status__c;
            reimWrapper.AprrovedDate = rei.Approved_Date__c;
            reimWrapper.amzonUrl = rei.Amazon_file_URL__c;
            reimWrapper.comments = rei.Comments__c;
            reimWrapper.typeofVechile = rei.Type_of_Vehicle__c;
            reimWrapper.shiftWithStaffId = rei.ShiftwithStaff__c;
            reimWrapper.multipleExpenseJSON = rei.Multiple_Expenses__c;
            reimWrapper.activityTransportVechicleUsed = rei.Activity_Transport_Vehicle__c;
            reimWrapper.transportMethod = rei.Transport_Method__c;
            reimWrapper.travelEndTime = rei.Travel_End_Time_Formula__c;
            reimWrapper.travelStartTime = rei.Travel_Start_Time_Formula__c;
            reimWrapper.submittedDate = rei.Submitted_Date__c;
            reimWrapper.transportType = rei.Transport_Type__c;
            reimWrapper.ApproverComments = rei.Approver_Comments__c;
            reimWrapper.odoMeterStart = rei.Odo_Meter_Start__c;
            reimWrapper.OdoMeterEnd = rei.Odo_Meter_End__c;

            // NEW PARTICIPANTS
            reimWrapper.participants = new List<participantWrapper>();

            List<Id> serviceIds = shiftServiceMap.get(rei.ShiftwithStaff__c);

            if(serviceIds != null){

                for(Id serviceId : serviceIds){

                    String key = rei.Id + '_' + serviceId;

                    List<Participant_Reimbrusement__c> prs = participantMap.get(key);

                    if(prs != null){

                        for(Participant_Reimbrusement__c pr : prs){

                            participantWrapper pw = new participantWrapper();

                            pw.participantReimbursementId = pr.Id;
                            pw.serviceId = pr.Services_and_Support_Plan__c;
                            pw.supportItemName = pr.Services_and_Support_Plan__r.Support_Item_Name__c;
                            pw.clientName = pr.Services_and_Support_Plan__r.Client__r.Name;
                            pw.reimbursementSupportItem = pr.Reimbrusment_Support_item__c;
                            pw.reimbursementLineItem = pr.Reimbrusment_line_item__c;
                            pw.reimbursementQuantity = pr.Reimbrusment_Quantity__c;
                            pw.reimbursementRate = pr.Reimbrusment_Rate__c;
                            pw.reimbursementAmount = pr.Reimbrusement_Amount__c;

                            reimWrapper.participants.add(pw);
                        }
                    }
                }
            }

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
          public List<participantWrapper> participants;
         
    }
    
     global class participantWrapper {

        public Id participantReimbursementId;

        public Id serviceId;

        public String supportItemName;

        public String clientName;

        public String reimbursementSupportItem;

        public String reimbursementLineItem;

        public Decimal reimbursementQuantity;

        public Decimal reimbursementRate;

        public Decimal reimbursementAmount;
    }
	

}