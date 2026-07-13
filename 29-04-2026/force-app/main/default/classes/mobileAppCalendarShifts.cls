@RestResource(urlMapping='/myCalendarShifts/*')
global class mobileAppCalendarShifts {
		 @HttpGet
    global static list<ShiftwithStaff__c> doGet() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        string startdate = req.requestURI.substring(req.requestURI.lastIndexOf('/')+1);       
        Date sDate = Date.valueOf(startdate);
       // Date edate = sDate+7;  
        Date today = Date.today();
        Date eDate;
        
        // Apply dynamic end date logic
        if (sDate < today) {
            eDate = sDate.addDays(6); // 7-day window from past start date
        } else {
            eDate = today.addDays(7); // 6-week window from today
        }
        system.debug(edate);
    /*    String endDate =DateTime.newInstance(
            edate.year(), edate.month(), edate.day()
        ).format('yyyy-MM-dd');  */
         String UserEmail = UserInfo.getUserEmail(); 
        List<ShiftwithStaff__c> shiftList = [select id,Add_Shift__r.Start_Date__c,Add_Shift__r.Break__c,Add_Shift__r.duration__c,Staff__r.Name,Staff__r.Last_Name__c,Staff__r.isStaffExpired__c,Shift_Address__Latitude__s,Shift_Address__Longitude__s,
                                             Shift_Locations__c,Add_Shift__r.shift_Start_End_Time__c,Add_Shift__r.Start_time_Formula__c,End_time_formula__c,Start_time_Formula__c,Add_Shift__r.End_Date__c,Added_to_Calendar__c,Shift_Start_Time__c,Shift_End_Time__c,Start_Time_24_format__c,End_Time_24_format__c,
                                             Add_Shift__r.Shift_Type__c,Add_Shift__r.End_time_formula__c,status__c, Facility_Names__c,Role_formula__c,Log_Out_Date_Time__c,Log_In_Date_Time__c,FeedbackCheck__c , Add_Shift__r.Start_Time__c,Add_Shift__r.End_Time__c,Start_Date__c,Shift_End_Date__c,Shift_Category__c                                           
                                             from ShiftwithStaff__c
                                             where Staff__r.Email_Address__c=:UserEmail                                          
                                             and Start_Date__c >=:sDate and Start_Date__c<=:eDate and Attendence__c=true and  Added_to_Calendar__c =false and Status__c ='Accepted' ];
          SObjectAccessDecision decision =Security.stripInaccessible(AccessType.READABLE, shiftList);
        return (List<ShiftwithStaff__c>) decision.getRecords();
       // return shiftList;
       
    }
    
    
     @HttpPost
    global static void updAteCalendarShifts() {
        RestResponse res = RestContext.response;
        Map<String, Object> responseMap = new Map<String, Object>();

        try {
            // Read the request body as a JSON string
            RestRequest req = RestContext.request;
            String requestBody = req.requestBody.toString();
            
            if (String.isBlank(requestBody)) {
                responseMap.put('success', false);
                responseMap.put('message', 'Error: Request body cannot be empty.');
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }
             List<shiftWrapper> shiftDetails = 
                (List<shiftWrapper>) JSON.deserialize(requestBody, List<shiftWrapper>.class);
            list<ShiftwithStaff__c> UpdateToShiftDetails=new list<ShiftwithStaff__c>();
            for(shiftWrapper ss :shiftDetails){
                ShiftwithStaff__c shift= new ShiftwithStaff__c();
                shift.Id=ss.shifWithStaffId;
                shift.Added_to_Calendar__c=ss.addedTocalendar;
                UpdateToShiftDetails.add(shift);
            }
            if(!UpdateToShiftDetails.isEmpty()){
                update UpdateToShiftDetails;
            }
            
            responseMap.put('success', false);
            responseMap.put('message', 'Shifts Updated Successfully');
            
            // Set the appropriate status code based on success or failure
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));

        } catch (Exception e) {
            responseMap.put('success', false);
            responseMap.put('message', 'Error processing checklist update: ' + e.getMessage());
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
        }
    }
    
    global class shiftWrapper{
        global string shifWithStaffId;
        global boolean addedTocalendar;
    }

}