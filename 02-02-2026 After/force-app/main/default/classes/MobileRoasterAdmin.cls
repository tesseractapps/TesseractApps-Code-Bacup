@RestResource(urlMapping='/roasterAdminDetails/*')
    global class MobileRoasterAdmin {
        @HttpGet
        global static Map<String, Map<String, List<String>>> doGet() {
            Map<String, Map<String, List<String>>> filterValues = new Map<String, Map<String, List<String>>>();
          
            User currentUser = [SELECT Id, Organization_Name__c, User_Type__c FROM User WHERE Id = :UserInfo.getUserId()];
            String userType = currentUser.User_Type__c;
            String userOrgName = currentUser.Organization_Name__c;
            String userId = UserInfo.getUserId();
            
            List<Facility_Role__c> fetchFacilityRoles = new List<Facility_Role__c>();
            fetchFacilityRoles = [SELECT Id, Name, Role_Name__c, Is_Active__c, Facility__c
                                  FROM Facility_Role__c
                                  WHERE Facility__r.Organisation__r.Name = :userOrgName AND Is_Active__c = true 
                                  ORDER BY Role_Name__c ASC];
            
            // Use Role_Name__c from Facility_Role__c instead of Staff picklist
            Map<String, List<String>> rolesMap = new Map<String, List<String>>();
            for (Facility_Role__c role : fetchFacilityRoles) { 
                //system.debug('role name ' +role);
                rolesMap.put(role.Role_Name__c, new List<String>());
            }
            filterValues.put('roles', rolesMap);
            
           
            
            Map<String, List<String>> facilityMap = new Map<String, List<String>>();
            Set<Id> allowedFacilityIds = new Set<Id>();
            
            // 3. If not NDIS Org Admin, filter by associated facilities
            if (userType != 'NDIS Org Admin') {
                list<Facility_Association__c>  facAssociation =PortalUserController.getFacilityUserWise(UserId,userType);
                for (Facility_Association__c fa : facAssociation) {
                    if (fa.Facility__c != null) {
                        allowedFacilityIds.add(fa.Facility__c);
                    }
                }
                if (allowedFacilityIds.isEmpty()) {
                    filterValues.put('facilities', facilityMap);
                    return filterValues; // return empty facility list
                }
            }
            
            // 4. Query facilities based on role
            List<Facility__c> facilities;
            if (userType == 'NDIS Org Admin') {
                facilities = [
                    SELECT Id, Name, Address__Street__s, Address__City__s, Address__StateCode__s, Address__PostalCode__s, Address__CountryCode__s 
                    FROM Facility__c 
                    WHERE Organisation__r.Name = :userOrgName AND Status__c = TRUE
                ];
            } else {
                facilities = [
                    SELECT Id, Name, Address__Street__s, Address__City__s, Address__StateCode__s, Address__PostalCode__s, Address__CountryCode__s 
                    FROM Facility__c 
                    WHERE Id IN :allowedFacilityIds AND Status__c = TRUE
                ];
            }
            
            // 5. Build facility map
            for (Facility__c f : facilities) {
                List<String> fvalues = new List<String>{
                    f.Id,
                        f.Address__Street__s,
                        f.Address__City__s,
                        f.Address__StateCode__s,
                        f.Address__PostalCode__s
                        };
                            facilityMap.put(f.Name, fvalues);
            }
            
            filterValues.put('facilities', facilityMap);
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
      obj.Shift_Name__c=wResp.ShiftName;
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
          global string ShiftName;

      }
        
        
      
    
    }