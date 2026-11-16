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
global static String doPost() {

    RestRequest req = RestContext.request;
    RestResponse res = RestContext.response;

    String jsonString = req.requestBody.toString();
    System.debug('jsonString: ' + jsonString);

    Boolean successCheck = false;

    List<responseWrapper> wRespList =
        (List<responseWrapper>) JSON.deserialize(
            jsonString,
            List<responseWrapper>.class
        );

    List<Add_Shift__c> accList = new List<Add_Shift__c>();

    // Get Facility once
    Facility__c facility;

    if (
        !wRespList.isEmpty() &&
        wRespList[0].isOtherLoc == false &&
        wRespList[0].facID != null &&
        wRespList[0].facID != ''
    ) {
        facility = [
            SELECT Id,
                   Name,
                   Address__Street__s,
                   Address__City__s,
                   Address__StateCode__s,
                   Address__PostalCode__s,
                   Address__CountryCode__s
            FROM Facility__c
            WHERE Id = :wRespList[0].facID
            LIMIT 1
        ];
    }

    for (responseWrapper wResp : wRespList) {

        Add_Shift__c obj = new Add_Shift__c();

        // =========================================
        // BASIC SHIFT DETAILS
        // =========================================

        obj.Quantity__c = wResp.Quantity;
        obj.Role__c = wResp.Role;
        obj.Start_Date__c = wResp.StartDate;

        obj.Start_Time_Text__c = wResp.Starttime;
        obj.End_Time_Text__c = wResp.Endtime;

        obj.Send_Notification__c = wResp.Notify;
        obj.Is_EOI__c = wResp.eoi;
        obj.Facility__c = wResp.facID;
        obj.Get_Facility__c = wResp.isOtherLoc;

        obj.Shift_Notes__c = wResp.Shiftnotes;
        obj.Shift_Name__c = wResp.ShiftName;
        obj.Shift_Type__c = wResp.ShiftType;

        // New records follow createShift behaviour
        if (wResp.Id == null || wResp.Id == '') {
            obj.Status__c = 'Broadcast';
        } else {
            obj.Id = wResp.Id;
        }

        // =========================================
        // FACILITY / OTHER LOCATION
        // =========================================

        if (wResp.isOtherLoc == false && facility != null) {

            obj.Location__Street__s =
                facility.Address__Street__s;

            obj.Location__City__s =
                facility.Address__City__s;

            obj.Location__StateCode__s =
                facility.Address__StateCode__s;

            obj.Location__PostalCode__s =
                facility.Address__PostalCode__s;

            obj.Location__CountryCode__s =
                facility.Address__CountryCode__s;

        } else {

            obj.Location__Street__s = wResp.Street;
            obj.Location__City__s = wResp.City;
            obj.Location__StateCode__s = wResp.State;
            obj.Location__PostalCode__s = wResp.PostalCode;
            obj.Location__CountryCode__s = 'AU';
        }

        // =========================================
        // START / END TIME
        // =========================================

        Time startTime;
        Time endTime;

        if (
            String.isNotBlank(wResp.Starttime) &&
            String.isNotBlank(wResp.Endtime)
        ) {

            startTime = parseMobileTime(wResp.Starttime);
            endTime = parseMobileTime(wResp.Endtime);

            obj.Start_Time__c = startTime;
            obj.End_Time__c = endTime;

            // =====================================
            // CALCULATE DURATION
            // =====================================

            Date endDate = wResp.StartDate;

            if (
                wResp.ShiftType == 'Night' ||
                wResp.ShiftType == 'Sleepover Shift' ||
                wResp.ShiftType == 'Custom'
            ) {
                if (endTime <= startTime) {
                    endDate = endDate.addDays(1);
                }
            }

            Datetime startDateTime =
                Datetime.newInstance(
                    wResp.StartDate,
                    startTime
                );

            Datetime endDateTime =
                Datetime.newInstance(
                    endDate,
                    endTime
                );

            Decimal durationHours =
                Decimal.valueOf(
                    endDateTime.getTime() -
                    startDateTime.getTime()
                ) / (1000 * 60 * 60);

            durationHours =
                durationHours.setScale(2);

            // =====================================
            // BREAK
            // =====================================
                String breakValue = '0';
                
                if (durationHours >= 5) {
                    breakValue = '30';
                }
                
                obj.Break__c = breakValue;
            Decimal breakHours = Decimal.valueOf(breakValue) / 60;

            // Duration stored after break
            obj.Duration__c =
                Math.max(
                    0,
                    durationHours - breakHours
                ).setScale(2);
        }

        // =========================================
        // DAY NAME
        // =========================================

        if (wResp.StartDate != null) {

            Datetime dt = Datetime.newInstance(
                wResp.StartDate,
                Time.newInstance(0, 0, 0, 0)
            );

            obj.Day_Name__c =
                dt.format('EEEE');
        }

        // =========================================
        // OTHER FIELDS FROM createShift()
        // =========================================

        obj.Shift_Geo_Location__c = 'Enabled';

        obj.Address_Not_Applicable__c =false;

        obj.Participant_Address_checkbox__c = false;

        // =========================================
        // OTHER LOCATION COUNTRY
        // =========================================

        if (
            String.isBlank(obj.Location__CountryCode__s)
        ) {
            obj.Location__CountryCode__s = 'AU';
        }

        accList.add(obj);
    }

    // =============================================
    // INSERT / UPDATE
    // =============================================

    try {

        if (!accList.isEmpty()) {

            if (
                wRespList[0].Id != null &&
                wRespList[0].Id != ''
            ) {
                update accList;
            } else {
                insert accList;
            }

            successCheck = true;
        }

    } catch (Exception e) {

        successCheck = false;

        System.debug(
            'Error in doPost: ' + e.getMessage()
        );

        System.debug(
            'Stack Trace: ' +
            e.getStackTraceString()
        );
    }

    return successCheck
        ? 'Success'
        : 'Failure';
}
        
        private static Time parseMobileTime(String timeValue) {
            
            if (String.isBlank(timeValue)) {
                return null;
            }
            
            String value = timeValue.trim().toLowerCase();
            
            List<String> parts = value.split(' ');
            
            String timePart = parts[0];
            String amPm =
                parts.size() > 1
                ? parts[1]
                : null;
            
            List<String> hm = timePart.split(':');
            
            Integer hour =
                Integer.valueOf(hm[0]);
            
            Integer minute =
                Integer.valueOf(hm[1]);
            
            if (amPm == 'am' && hour == 12) {
                hour = 0;
            } else if (
                amPm == 'pm' &&
                hour != 12
            ) {
                hour += 12;
            }
            
            return Time.newInstance(
                hour,
                minute,
                0,
                0
            );
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