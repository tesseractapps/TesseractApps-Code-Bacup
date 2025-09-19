@RestResource(urlMapping='/roasterAdminDetails/*')
    global class MobileRoasterAdmin {
          @HttpGet
        global static map<string,map<string,List<string>>> doGet() {
            map<string,map<string,List<string>>> filterValues = new map<string,map<string,List<string>>>();               
            Schema.DescribeFieldResult fieldResult = Staff__c.role__c.getDescribe();      
            List<Schema.PicklistEntry> values = fieldResult.getPicklistValues();
            map<string,List<string>>rolesMap =new map<string,List<string>>();
            for( Schema.PicklistEntry v : values) {         
            rolesMap.put(v.getLabel(),new List<string>{});
         }
             filterValues.put('roles',rolesMap);        
             map<string,List<string>>facilityMap =new map<string,List<string>>();
             string orgname = [ SELECT Phone, Id,Organization_Name__c FROM User WHERE Id = : UserInfo.getUserId()].Organization_Name__c;       
             for( Facility__c f : [SELECT id,name,Address__Street__s,Address__City__s, Address__StateCode__s,Address__PostalCode__s,Address__CountryCode__s FROM Facility__c where Organisation__r.name=:orgname AND Status__c=TRUE]) {
                  list<string> fvalues =new list<string>();              
                 facilityMap.put(f.name,new list<string>{f.id,f.Address__Street__s,f.Address__City__s, f.Address__StateCode__s,f.Address__PostalCode__s} );
                
              }
            filterValues.put('facilities',facilityMap);           
            return filterValues;
        }
        
       @HttpPost
    global static string doPost() {       
      RestRequest req = RestContext.request;
      RestResponse res = Restcontext.response;
      string jsonString=req.requestBody.tostring();
      system.debug('jsonString'+jsonString);
      boolean successCheck;
      List<responseWrapper> wRespList=(List<responseWrapper>) JSON.deserialize(jsonString,List<responseWrapper>.class);
      Add_Shift__c obj=new Add_Shift__c();
      List<Add_Shift__c> accList= new List<Add_Shift__c>();
      for(responseWrapper wResp: wRespList){
      obj.Quantity__c=wResp.Quantity;
      obj.Role__c=wResp.Role;
      obj.Start_Date__c=wResp.StartDate;
     // obj.Start_time_picklist__c=wResp.Starttime;
     // obj.End_time_picklist__c=wResp.Endtime;
       obj.Start_Time_Text__c=wResp.Starttime;
       obj.End_Time_Text__c=wResp.Endtime;
      obj.Send_Notification__c=wResp.Notify;    
      obj.Is_EOI__c=wResp.eoi;
      obj.Facility__c=wResp.facID;  
      obj.Get_Facility__c=wResp.isOtherLoc; 
      obj.Location__Street__s=wResp.Street;
      obj.Location__City__s=wResp.City;                
      obj.Location__CountryCode__s='AU';
      obj.Location__StateCode__s=wResp.State;
      obj.Location__PostalCode__s=wResp.PostalCode;
      obj.Shift_Notes__c=wResp.Shiftnotes;
          // new parameters added by praveen
        // Convert StartDate to Datetime to get the day name
        if (wResp.StartDate != null) {
            Datetime dt = Datetime.newInstance(wResp.StartDate, Time.newInstance(0, 0, 0, 0));
            obj.Day_Name__c = dt.format('EEEE'); // Gets the full day name (e.g., Monday)
        }
      obj.Shift_Type__c=wResp.ShiftType;
          if(wResp.Id != '' && wResp.Id!=null){ 
               obj.Id=wResp.Id;                
          }          
      accList.add(obj);
      }
      try{
      if(accList.size() > 0){
      if(wRespList[0].Id != '' && wRespList[0].Id!=null){ 
        update accList;
       }  else{
      Insert accList;
      }
      successCheck=true;
      }
      }catch(Exception e){
      successCheck=false;          
      }
      if(successCheck)
      return 'Success';
      else
      return 'Failure';
      }

      global class responseWrapper{
          global integer Quantity;
          global string Role;
          global date StartDate;
          global string Starttime;
          global string Endtime;
          global boolean Notify;
      	  global boolean eoi;
          global string facID; 
          global string Id;
          global boolean isOtherLoc;       
          global string Street;
          global string City;    
          global string State;
          global string PostalCode;
          // new parameters added by praveen
         // global string DayName;
          global string ShiftType;
          global string Shiftnotes;

      }
        
        
      
    
    }