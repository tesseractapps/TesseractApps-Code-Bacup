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
      List<ShiftwithStaff__c> shiftList = [  SELECT
                    /* Existing fields - DO NOT REMOVE */
                    Id, Add_Shift__r.Start_Date__c, Add_Shift__r.Break__c, Add_Shift__r.Duration__c, Staff__r.Name, Staff__r.Last_Name__c,
                    Staff__r.isStaffExpired__c, Date__c, Shift_Geo_Location__c, Shift_Type__c, Shift_Locations__c, Add_Shift__r.Shift_Start_End_Time__c, Add_Shift__r.Start_time_Formula__c, End_time_formula__c, Start_time_Formula__c, Add_Shift__r.Facility__r.Enable_Shift_Rejection__c, Add_Shift__r.End_time_formula__c, Status__c, Facility_Names__c,Role_formula__c, Log_Out_Date_Time__c, Log_In_Date_Time__c, FeedbackCheck__c,
            
                    /* Existing Services query - kept */
                    (SELECT Id, Full_Name__c, Client__r.Display_Nickname__c,Service_Type_Name__c FROM Services_and_Support_Plans__r),
            
                    /* NEW fields from second query */
                    Shift_Name__c, Add_Shift_Notes__c, SignIn_Notes__c, Type_of_shift__c, Add_Shift__r.End_Date__c,  Shift_Address__City__s, Shift_Address__Street__s, Shift_Address__CountryCode__s, Shift_Address__GeocodeAccuracy__s, Shift_Address__Latitude__s, Shift_Address__Longitude__s,  Shift_Address__StateCode__s,Shift_Address__PostalCode__s, Staff_Paid_Break__c, Shift_Break__c, Enable_Sign_In__c, Enable_Sign_Out__c, Start_Date__c, Shift_End_Date__c, Shift_Start_Time__c, Shift_End_Time__c, Start_Time_24_format__c,End_Time_24_format__c, Add_Shift__r.Facility__c, Staff__c, Add_Shift__r.Facility__r.Organisation__c,SIL__c,
            
                    /* Existing Shift_Geo_Location__c already present above */
            
                    Shift_Facility__r.Cost_per_Km_Fuel__c, Shift_Facility__r.Cost_per_Km_Electric__c,  Add_Shift__r.Facility__r.Cost_per_Km_Fuel__c, Add_Shift__r.Facility__r.Cost_per_Km_Electric__c,  Add_Shift__r.Facility__r.Enable_Sign_In_Request__c, Add_Shift__r.Facility__r.Enable_Sign_out_Request__c,
                    (SELECT Id, Description__c, Care_Notes__c, CreatedDate, CreatedBy.Name, Reason__c FROM Client_Journels__r ORDER BY CreatedDate DESC ),  
                    ( SELECT Id, Break_Start_Time__c, Break_End_Time__c FROM Break_Timings__r WHERE Break_Start_Time__c != null AND Break_End_Time__c = null ORDER BY CreatedDate DESC LIMIT 1)
            
                FROM ShiftwithStaff__c
            
                /* WHERE CONDITION - COMPLETELY UNCHANGED */
                WHERE Staff__r.Email_Address__c = :UserEmail
                AND Date__c >= :sDate
                AND Date__c <= :eDate
                AND Attendence__c = true
            ];
        return shiftList;
       
    }

}