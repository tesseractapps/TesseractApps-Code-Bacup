@RestResource(urlMapping='/inProgressShifts/*')
global class MobileAppInProgressShifts {
    @HttpGet
    global static boolean doGet() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        // Extract end date from URI
        String endDate = req.requestURI.substring(req.requestURI.lastIndexOf('/') + 1);
        System.debug('Extracted endDate from URI: ' + endDate);
        
        // Convert to Date and calculate start date
        Date eDate = Date.valueOf(endDate);
        Date sDate = eDate.addDays(-1);
        System.debug('Parsed eDate: ' + eDate);
        System.debug('Calculated sDate (1 day before eDate): ' + sDate);
        
        // Get current user's email
        String UserEmail = UserInfo.getUserEmail();
        System.debug('Current User Email: ' + UserEmail);
        
        // Query shifts
        List<ShiftwithStaff__c> shiftList = [
            SELECT Id, Add_Shift__r.Start_Date__c, Add_Shift__r.Break__c, Add_Shift__r.duration__c,
            Staff__r.Name, Staff__r.Last_Name__c, Staff__r.isStaffExpired__c,
            Shift_Address__Latitude__s, Shift_Address__Longitude__s, Shift_Locations__c,
            Add_Shift__r.shift_Start_End_Time__c, Add_Shift__r.Start_time_Formula__c,
            End_time_formula__c, Start_time_Formula__c, Add_Shift__r.End_Date__c,
            Added_to_Calendar__c, Shift_Start_Time__c, Shift_End_Time__c,
            Start_Time_24_format__c, End_Time_24_format__c, Add_Shift__r.Shift_Type__c,
            Add_Shift__r.End_time_formula__c, Status__c, Facility_Names__c,
            Role_formula__c, Log_Out_Date_Time__c, Log_In_Date_Time__c, FeedbackCheck__c,
            Add_Shift__r.Start_Time__c, Add_Shift__r.End_Time__c, Start_Date__c,
            Shift_End_Date__c, Shift_Category__c
            FROM ShiftwithStaff__c
            WHERE Staff__r.Email_Address__c = :UserEmail
            AND Start_Date__c >= :sDate
            AND Start_Date__c <= :eDate
            AND Attendence__c = true
            AND Status__c = 'InProgress'
        ];
        
        System.debug('Number of shifts retrieved: ' + shiftList.size());
        if (!shiftList.isEmpty()) {
            System.debug('First shift record: ' + shiftList[0]);
        }
          System.debug('in progress falg: ' + (shiftList.size() > 0));
        
        return shiftList.size() > 0;
    }

}