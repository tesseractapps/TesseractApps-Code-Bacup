@RestResource(urlMapping='/rosterCreation/*')
global class MobileAppRoasterCreation {
    @HttpGet
    global static Map<String, List<String>> getRosterTimings() {
          User currentUser = [SELECT Id, Organization_Name__c, User_Type__c,Email FROM User WHERE Id = :UserInfo.getUserId()];
           String userType = currentUser.User_Type__c;
         Map<String, List<String>> timingsMap = new Map<String, List<String>>();
        if (userType == 'NDIS Org Admin') { 
            
            
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
            
        }else{
            list<Staff__c> staffDetails= StaffController.getStaffByEmail(currentUser.Email);
            system.debug(' fcaility Id '+staffDetails[0].Facility__r.Id);
            Facility__c fac=FacilityController.getfacilityById(staffDetails[0].Facility__r.Id);
            
            // Correct initialization of list and removal of extra period
            timingsMap.put('General', new List<String>{
                fac.General_Shift_Start_Time__c, 
                    fac.General_Shift_End_Time__c
                    });
            timingsMap.put('Morning', new List<String>{
                fac.Morning_Shift_Start_Time__c, 
                    fac.Morning_Shift_End_Time__c
                    });
            timingsMap.put('Custom', new List<String>{
                fac.Custom_Shift_Start_Time__c, 
                    fac.Custom_Shift_End_Time__c
                    });
            timingsMap.put('Afternoon', new List<String>{
                fac.Afternoon_Shift_Start_Time__c, 
                    fac.Afternoon_Shift_End_Time__c
                    });
            timingsMap.put('Night', new List<String>{
                fac.Night_Shift_Start_Time__c, 
                    fac.Night_Shift_End_Time__c
                    });
            timingsMap.put('Sleepover', new List<String>{
                fac.Sleepover_Shift_Strat_Time__c, 
                    fac.Sleepover_Shift_End_Time__c
                    });
            
            // Debug statement for further checking
            System.debug('timingsMap in staff: ' + timingsMap);
             
        } 
        
       
        return timingsMap;
    }
}