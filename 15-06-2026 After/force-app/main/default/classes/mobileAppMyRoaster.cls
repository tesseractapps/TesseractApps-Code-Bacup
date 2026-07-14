@RestResource(urlMapping='/roasterDetails/*')
global class mobileAppMyRoaster {
    @HttpGet
    global static List<Add_Shift__c> doGet() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        // Extract start date from request
        String startdate = req.requestURI.substring(req.requestURI.lastIndexOf('/') + 1); 
        Date today = Date.today();
        Date sDate = Date.valueOf(startdate);
        Date eDate;
        if (sDate < today) {
            eDate = sDate.addDays(6); // 7 days window for past dates
        } else {
            eDate = today.addDays(42); // 6 weeks from today for today/future dates
        }
        // Format end date for any specific logic
        String endDate = DateTime.newInstance(eDate.year(), eDate.month(), eDate.day()).format('yyyy-MM-dd');
        
        // Step 1: Get all shifts for the week
        List<Add_Shift__c> shiftlist = AddShiftController.roleBasedShift(startdate, endDate);
        system.debug('shiftlist '+shiftlist.size());
        
        // Step 2: Get current user's staff ID
        String email = [SELECT Email FROM User WHERE Id = :UserInfo.getUserId()].Email;
        String staffId = [SELECT Id FROM Staff__c WHERE Email_Address__c = :email LIMIT 1].Id;
        
        // Step 3: Build a map of shift IDs to their start/end times
        Map<Id, List<Time>> shiftTimeMap = new Map<Id, List<Time>>();
        Set<Date> shiftDates = new Set<Date>();
        
        for (Add_Shift__c shift : shiftlist) {
            shiftTimeMap.put(shift.Id, new List<Time>{shift.Start_Time__c, shift.End_Time__c});
            shiftDates.add(shift.Start_Date__c);
        }
        
        // Step 4: Query all ShiftwithStaff__c for those dates and current staff
        List<ShiftwithStaff__c> matchingShiftStaff = [
            SELECT Id, Add_Shift__c, Date__c,End_Date__c, Start_Time__c, End_Time__c 
            FROM ShiftwithStaff__c 
            WHERE Attendence__c = true 
            AND Date__c IN :shiftDates 
            AND Staff__c = :staffId
        ];
        system.debug('matchingShiftStaff' +matchingShiftStaff);
        
        // Step 5: Track which shifts the staff already attended
        Set<Id> alreadyAttendedShiftIds = new Set<Id>();
        
        Map<Date, List<Time[]>> attendedTimeRanges = new Map<Date, List<Time[]>>();
        for (ShiftwithStaff__c s : matchingShiftStaff) {
            if (!attendedTimeRanges.containsKey(s.Date__c)) {
                attendedTimeRanges.put(s.Date__c, new List<Time[]>());
            }
            attendedTimeRanges.get(s.Date__c).add(new Time[]{s.Start_Time__c, s.End_Time__c});
        }

		// Now compare each shift with attended ones on same day
        List<Add_Shift__c> finalList = new List<Add_Shift__c>();
        
        for (Add_Shift__c shift : shiftlist) {
            Boolean conflict = false;
            
            // Build DateTime for this shift
            DateTime shiftStartDT = DateTime.newInstance(shift.Start_Date__c, shift.Start_Time__c);
            DateTime shiftEndDT = DateTime.newInstance(shift.End_Date__c, shift.End_Time__c);
            
            for (ShiftwithStaff__c s : matchingShiftStaff) {
                DateTime attendedStartDT = DateTime.newInstance(s.Date__c, s.Start_Time__c);
                DateTime attendedEndDT = DateTime.newInstance(s.End_Date__c, s.End_Time__c);
                
                // Check for any overlap
                if (shiftStartDT < attendedEndDT && shiftEndDT > attendedStartDT) {
                    conflict = true;
                    break;
                }
            }
            
            if (!conflict) {
                finalList.add(shift);
            }
        }
    
          system.debug('finalList '+finalList.size());
        return finalList;
    }

    
    @HttpPost
    global static string doPost(string shiftId,boolean EOI,string deviceToken) {
        if(!String.isBlank(deviceToken)){
            user u= new user();
            u.id=UserInfo.getUserId();
            u.Mobile_device_token__c=deviceToken;
            try{
                update u; 
                return 'updated';
            }catch(DmlException e) {
                System.debug('device token not updated: ' + e.getMessage());
                return e.getMessage();
            }
        
    }else{
        return AddShiftController.handleAllocation( shiftId, EOI);
        
         /*String UserEmail = UserInfo.getUserEmail(); 
        string staffId=[SELECT id,Name,role__c 
                        FROM Staff__c 
                        WHERE Email_Address__c =:UserEmail].Id;
			Add_shift__c shiftlist=[select id,Start_Date__c,Start_Time__c,End_Time__c from Add_shift__c where id=:shiftId and staff__c=:staffId limit 1]; 
        	 List<ShiftwithStaff__c> availStaff=[select Staff__c from ShiftwithStaff__c where 
                                                Attendence__c= true and Date__c=:shiftlist.Start_Date__c and
                                                Start_Time__c <:shiftlist.End_Time__c and End_Time__c>: shiftlist.Start_Time__c and staff__c=:StaffID];
             system.debug('available staff'+availStaff);
            
			if(availStaff.size()>0){ 
				return 'Shift is not available';
			}else{
			 return	AddShiftController.handleAllocation( shiftId, EOI);
			}
			*/
          
    	}
	}
    
  
}