@RestResource(urlMapping='/myAllocatedDetails/*')
global class mobileAppMyAllocatedShifts {    
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
            eDate = today.addDays(42); // 6-week window from today
        }
        system.debug(edate);
    /*    String endDate =DateTime.newInstance(
            edate.year(), edate.month(), edate.day()
        ).format('yyyy-MM-dd');  */
         String UserEmail = UserInfo.getUserEmail(); 
        List<ShiftwithStaff__c> shiftList = [select id,Add_Shift__r.Start_Date__c,Add_Shift__r.Break__c,Add_Shift__r.duration__c,Staff__r.Name,Staff__r.Last_Name__c,Staff__r.isStaffExpired__c,
                                             Shift_Type__c,Shift_Locations__c,Add_Shift__r.shift_Start_End_Time__c,Add_Shift__r.Start_time_Formula__c,End_time_formula__c,Start_time_Formula__c,
                                             Add_Shift__r.End_time_formula__c,status__c, Facility_Names__c,Role_formula__c,Log_Out_Date_Time__c,Log_In_Date_Time__c,FeedbackCheck__c                                            
                                             from ShiftwithStaff__c
                                             where Staff__r.Email_Address__c=:UserEmail                                          
                                             and Add_Shift__r.Start_Date__c >=:sDate and Add_Shift__r.Start_Date__c<=:eDate and Attendence__c=true];
        return shiftList;
       
    }

}