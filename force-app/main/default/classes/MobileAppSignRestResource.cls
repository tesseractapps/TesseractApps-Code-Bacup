@RestResource(urlMapping='/ShiftwithStaff__c/*')
global class MobileAppSignRestResource {
    @HttpGet
    global static List<ShiftwithStaff__c> doGet() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        string startdate = req.requestURI.substring(req.requestURI.lastIndexOf('/')+1);
        system.debug('start date'+startdate);
        Date sDate = Date.valueOf(startdate); 
        String UserEmail = UserInfo.getUserEmail(); 
        List<ShiftwithStaff__c> shiftList = [select id,Add_Shift__r.Start_Date__c,Add_Shift__r.Break__c,Add_Shift_Notes__c,SignIn_Notes__c,Type_of_shift__c,Add_Shift__r.End_Date__c,
                                             Shift_Type__c,Shift_Locations__c,Add_Shift__r.shift_Start_End_Time__c,Add_Shift__r.Start_time_Formula__c,Enable_Sign_In__c,
                                             Add_Shift__r.End_time_formula__c,status__c, Facility_Names__c,Role_formula__c,Log_Out_Date_Time__c,Log_In_Date_Time__c,FeedbackCheck__c,(SELECT Id,Full_Name__c from Services_and_Support_Plans__r limit 1)                                            
                                             from ShiftwithStaff__c
                                             where Staff__r.Email_Address__c=:UserEmail                                          
                                             and Add_Shift__r.Start_Date__c =:sDate and Attendence__c=true];
         SObjectAccessDecision decision =Security.stripInaccessible(AccessType.READABLE, shiftList);
        return (List<ShiftwithStaff__c>) decision.getRecords();
        //return shiftList;
    }
  
    @HttpPost
    global static string doPost(string loginTime,String signinId,string logOutTime,string feedBack, string signature, string supervisorRole,String shiftNotes, string SleepoverNightShiftHours,
                                          string nightShiftHourComments,string extendedComments) {
      Decimal finalSleepoverNightHours=0;
      if(SleepoverNightShiftHours !=null && SleepoverNightShiftHours !=''){
         
         List<String> sleepoverhoursparts = SleepoverNightShiftHours.split(':');
         finalSleepoverNightHours = Decimal.valueOf(sleepoverhoursparts[0]) + (Decimal.valueOf(sleepoverhoursparts[1]) / 60); 
      }
                                 
        if(loginTime != ''){
             return SignInController.updateSignInTime( loginTime, signinId,false); 
        }else if(logOutTime !=''){
             return SignInController.updateSignoutTime( logOutTime, signinId,shiftNotes,false,finalSleepoverNightHours,nightShiftHourComments,extendedComments);
        }else{
            try {
            ShiftwithStaff__c staffShift =  new ShiftwithStaff__c();
            staffShift.Id = signinId;
            staffShift.Client_Comments__c= feedBack;
            staffShift.Supervisor_Role__c = supervisorRole;
            staffShift.Client_Signature__c='<img src="'+signature+'">'; 
            staffShift.Client_SignTime__c= DateTime.now();
            staffshift.FeedbackCheck__c=true;
            update staffShift;
            return 'Updated Shift SignIn';
        } catch (Exception e) {
            return e.getMessage();
        }
        }
    }
}