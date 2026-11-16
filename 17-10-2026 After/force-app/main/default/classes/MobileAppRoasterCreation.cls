@RestResource(urlMapping='/rosterCreation/*')
global class MobileAppRoasterCreation {
    @HttpGet
    global static Map<String, List<String>> getRosterTimings() {
          User currentUser = [SELECT Id, Organization_Name__c, User_Type__c,Email FROM User WHERE Id = :UserInfo.getUserId()];
           String userType = currentUser.User_Type__c;
         Map<String, List<String>> timingsMap = new Map<String, List<String>>();
 
            List<Facility__c> getFaciliitesList = HrHomeHandler.fetchFacilitiess();
            
            // Correct initialization of list and removal of extra period
            timingsMap.put('General', new List<String>{
                getFaciliitesList[0].Organisation__r.General_Shift_Start_Time__c, 
                    getFaciliitesList[0].Organisation__r.General_Shift_End_time__c
                    });
            timingsMap.put('Morning', new List<String>{
                getFaciliitesList[0].Organisation__r.Morning_Shift_Start_Time__c, 
                    getFaciliitesList[0].Organisation__r.Morning_Shift_End_Time__c
                    });
            timingsMap.put('Custom', new List<String>{
                getFaciliitesList[0].Organisation__r.Custom_Shift_Start_Time__c, 
                    getFaciliitesList[0].Organisation__r.Custom_Shift_End_Time__c
                    });
            timingsMap.put('Afternoon', new List<String>{
                getFaciliitesList[0].Organisation__r.Afternoon_Shift_Start_Time__c, 
                    getFaciliitesList[0].Organisation__r.Afternoon_Shift_End_Time__c
                    });
            timingsMap.put('Night', new List<String>{
                getFaciliitesList[0].Organisation__r.Night_Shift_Start_Time__c, 
                    getFaciliitesList[0].Organisation__r.Night_Shift_End_Time__c
                    });
            timingsMap.put('Sleepover', new List<String>{
                getFaciliitesList[0].Organisation__r.Sleepover_Start__c, 
                    getFaciliitesList[0].Organisation__r.Sleepover_Shift_End_Time__c
                    });
            
            // Debug statement for further checking
            System.debug('timingsMap: ' + timingsMap);
             
        return timingsMap;
    }
}