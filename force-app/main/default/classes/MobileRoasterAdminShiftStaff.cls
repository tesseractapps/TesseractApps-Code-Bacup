@RestResource(urlMapping='/roasterAdminShiftStaffDetails/*')
global class MobileRoasterAdminShiftStaff {
@HttpPost
global static list<Add_Shift__c> doPost(string staff, list<string> statusList,string role,String startDate,string facility) {  
  List<Add_Shift__c> shiftStaffList=new  List<Add_Shift__c>();
  User objUser = [ SELECT Organization_Name__c FROM User WHERE Id = : UserInfo.getUserId() ];
  string orgID = [Select id from Organisation__c where name=:objUser.Organization_Name__c limit 1].Id; 
  List<String> res = startDate.split('-');
  system.debug(res);
 // date stDate =Date.newInstance(Integer.valueOf(res[0]), Integer.valueOf(res[1]), Integer.valueOf(res[2]));
    Date stDate = Date.valueOf(startDate);
  system.debug(stDate);
    try {      
          string query2='select id,Allocated__c,Quantity__c, Un_Allocated__c, Start_Date__c,End_Date__c, Start_Time__c,Send_Notification__c, Get_Facility__c,End_Time__c,';
            query2=query2+'Facility_Name__c,Break__c, Duration__c, role__c, Shift_Start_End_Time__c,Location__Street__s, Location__City__s,Shift_Type__c,Day_Name__c,';                
            query2=query2+'Location__CountryCode__s,Location__StateCode__s, Location__PostalCode__s,Start_Time_Text__c,End_Time_Text__c, End_time_picklist__c,Start_time_picklist__c, Is_EOI__c,Shift_Notes__c,';
            query2=query2+'(select id,Staff__r.Email_Address__c,Staff__c,Staff__r.Name,Staff__r.Last_Name__c,Facility__c,Shift_Type__c,Shift_Wage__c,';
            query2=query2+'Attendence__c,Full_Name__c,Status__c,Staff__r.Set_Hours__c,Break__c,Date__c,Staff_Hourly_Rate__c,Duration__c,Comments__c,Add_Shift__c,';
            query2=query2+'State__c,Start_time_Formula__c,End_time_formula__c,Actual_Duration__c';
            query2=query2+' from ShiftwithStaffs__r where staff__c != null';
            if(staff != null && staff !='' ){
                  string staffName ='%'+staff+'%' ;
                  query2 =query2+' AND Full_Name__c like : staffName ' ; 
              }
            if(statusList.size()>0){
              query2 =query2+' AND Status__c In:statusList ' ;
            }
            
            query2=query2+' and Attendence__c=true ) from Add_Shift__c where Facility__r.Organisation__c=:orgID and Start_Date__c=:stDate and Role__c=:role';
            if(facility != null && facility !='' ){
                  query2 =query2+' AND Facility_Name__c= : facility ' ; 
            }
            system.debug('query2==>'+query2);
            shiftStaffList =database.query(query2);
            System.debug('shiftList==>'+shiftStaffList); 
            System.debug(shiftStaffList.size());
      
        } catch (Exception e) {
    		system.debug('mobile roasteradminShiftStaff error: '+e);
        } 
    	SObjectAccessDecision decision =Security.stripInaccessible(AccessType.READABLE, shiftStaffList);
     	return (List<Add_Shift__c>) decision.getRecords();
       // return shiftStaffList;
  }
            
@HttpGet
global static list<StaffWrapper> doGet() {  
    RestRequest req = RestContext.request;
    RestResponse res = Restcontext.response;
    Map<String, String> requestParam = req.params;
    string Role=requestParam.get('Role');
    Date startDate=date.valueOf(requestParam.get('strtdt'));
    string startime=requestParam.get('strttim');
    string endtime=requestParam.get('endtim');           
    string shiftid=requestParam.get('shiftid');
    boolean isEoi=boolean.valueof(requestParam.get('isEoi'));
    String[] strTimeSplit = startime.split(':');
    Time sttime = Time.newInstance( Integer.valueOf(strTimeSplit[0]) //hour
                                  ,Integer.valueOf(strTimeSplit[1]) //min
                                  ,0                                //sec
                                  ,0);   
    String[] endTimeSplit = endtime.split(':');
    Time edtime = Time.newInstance( Integer.valueOf(endTimeSplit[0]) //hour
                                  ,Integer.valueOf(endTimeSplit[1]) //min
                                  ,0                                //sec
                                  ,0);   
    list<Staff__c>stafflist = new list<Staff__c>();
    if(isEoi ==true){
      stafflist=AddShiftController.getEOIStaff( Role,shiftid);
    }
    else{
      stafflist=AddShiftController.getAvailableStaff( Role, startDate,  sttime,  edtime);
    }
    Add_Shift__c addShift=[select id,Duration__c,Day_Name__c,Shift_Type__c from Add_Shift__c where id=:shiftid];
    list<StaffWrapper> finalStaffList = new list<StaffWrapper>();
    for(Staff__c ss :stafflist){
        StaffWrapper staff = new StaffWrapper();
       	list<ShiftwithStaff__c> shiftwithstaff= new list<ShiftwithStaff__c>();
        staff.Id=ss.id; 
        staff.fullName=ss.Name +' '+ss.Last_Name__c;
        staff.duration=addShift.Duration__c !=null?addShift.Duration__c :0;
        staff.facilityname=ss.Facility_Name__c;
        staff.status=ss.Status__c;
        staff.activeOrInactive=ss.Active_or_Non_Active__c;
        
        if(addShift.Day_Name__c=='Saturday'){
            staff.Hourlyrate =ss.Saturday_Hourly_Rate__c !=null ? ss.Saturday_Hourly_Rate__c :0 ; 
        }else if(addShift.Day_Name__c=='Sunday'){
            staff.Hourlyrate =ss.Sunday_Hourly_Rate__c !=null ? ss.Sunday_Hourly_Rate__c :0 ;
        }else if(addShift.Shift_Type__c=='General' || addShift.Shift_Type__c=='Morning' || addShift.Shift_Type__c=='Custom'){
            staff.Hourlyrate =ss.Working_Hours_Rate__c !=null? ss.Working_Hours_Rate__c :0 ;   
        }else if(addShift.Shift_Type__c=='Afternoon'){
            staff.Hourlyrate =ss.Afternoon_shift_Hourly_Rate__c !=null ? ss.Afternoon_shift_Hourly_Rate__c :0 ; 
        }else if(addShift.Shift_Type__c=='Night'){
            staff.Hourlyrate =ss.Night_shift_Hourly_Rate__c !=null ? ss.Night_shift_Hourly_Rate__c :0 ; 
        }else{
            staff.Hourlyrate =ss.Working_Hours_Rate__c !=null ? ss.Working_Hours_Rate__c :0 ; 
          
        }
        staff.RateKeyName='Final_Overall_Rate__c'; 
        system.debug('duartion '+addShift.Duration__c);
        // system.debug('duartion '+addShift.Duration__c);
        
        staff.shiftWage=addShift.Duration__c !=null ?addShift.Duration__c :0*staff.Hourlyrate;
        if(isEoi==false){
          staff.shiftwithstaff=shiftwithstaff;
        }else{
           staff.shiftwithstaff=ss.ShiftwithStaffs__r; 
        }
        finalStaffList.add(staff);
    }
    
    return finalStaffList;          
  }
    global class StaffWrapper {
    global String Id ;
    global String fullName ;
    global decimal Hourlyrate;
    global String activeOrInactive ;
    global Boolean status ;
    global String facilityname ;
   	global decimal duration;
    global decimal shiftWage;
    global string RateKeyName;
    global list<ShiftwithStaff__c> shiftwithstaff;
}
}