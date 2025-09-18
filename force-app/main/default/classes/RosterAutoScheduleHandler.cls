public class RosterAutoScheduleHandler {

    public class AutoSchedulePrameterWrapper {
        public String label;
        public String directionLabel;
        public String value;
        public Integer index;
       
    }
    public class organisationalAutoSchedulePrameters{
        public Integer RiskIndexOrder;
        public String  RiskIndexValue;
        public Integer ClassificationOrder;
        public String  ClassificationValue;
        public Integer EmploymentTypeOrder;
        public String EmploymentTypeValue;
        public Integer PreferredStaffOrder;
        public boolean PreferredStaffValue=false;
        public Integer FatigueManagementOrder;
        public boolean FatigueManagementValue=false;
        public decimal RadiusOrder;
        public decimal RadiusValue;
    }

    public class FinalAvailable {
        @AuraEnabled public String staffId;
        @AuraEnabled public String firstName;
        @AuraEnabled public String lastName;
        @AuraEnabled public String StaffAvailId;

        public FinalAvailable(String staffId, String firstName, String lastName,String StaffAvailId) {
            this.staffId   = staffId;
            this.firstName = firstName;
            this.lastName  = lastName;
            this.StaffAvailId =StaffAvailId;
        }
    }

    @AuraEnabled
    public static Map<Availability__c, FinalAvailable> assignShifts(String startDate, String endDate, String AutoScheduleParameters,list<string>facList) {
        Date sDate = Date.valueOf(startDate);
        Date eDate = Date.valueOf(endDate);

        List<AutoSchedulePrameterWrapper> parameters =(List<AutoSchedulePrameterWrapper>) JSON.deserialize( AutoScheduleParameters,List<AutoSchedulePrameterWrapper>.class);

        Boolean fatigue               = false;
        Boolean nominatedStaff        = false;
        String  riskSortOrder         = 'ASC';
        String  classificationSort    = 'ASC';
        String  employmentTypeFilter  = 'Full-time and part-time';
        Decimal  AutoscheduleParameterRadius=100;
	 organisationalAutoSchedulePrameters osw= new  organisationalAutoSchedulePrameters ();
          for (AutoSchedulePrameterWrapper p : parameters) {
            switch on p.label {
                when 'Fatigue Management' {
                    switch on p.value {
                        when 'true' {
                            fatigue = true;
                            osw.FatigueManagementOrder = p.index;
                            osw.FatigueManagementValue = fatigue;
                        }
                        when 'false' {
                            fatigue = false;
                            osw.FatigueManagementOrder = p.index;
                            osw.FatigueManagementValue = fatigue;
                        }
                    }
                }
                when 'Preferred Staff' {
                    switch on p.value {
                        when 'true' {
                            nominatedStaff = true;
                            osw.PreferredStaffOrder = p.index;
                            osw.PreferredStaffValue = nominatedStaff;
                        }
                        when 'false' {
                            nominatedStaff = false;
                            osw.PreferredStaffOrder = p.index;
                            osw.PreferredStaffValue = nominatedStaff;
                        }
                    }
                }
                when 'Risk Index' {
                    riskSortOrder = (p.directionLabel == 'Low to High') ? 'ASC' : 'DESC';
                    osw.RiskIndexOrder = p.index;
                    osw.RiskIndexValue = p.directionLabel;
                }
                when 'Classification' {
                    classificationSort = (p.directionLabel == 'Low to High') ? 'ASC' : 'DESC';
                    osw.ClassificationOrder = p.index;
                    osw.ClassificationValue = p.directionLabel;
                }
                when 'Employment Type' {
                    employmentTypeFilter = (p.value == 'Permanent') ? 'Full-time and part-time' : p.value;
                    osw.EmploymentTypeOrder = p.index;
                    osw.EmploymentTypeValue = p.value;
                }
                 when 'Geo Location' {
                   AutoscheduleParameterRadius = Decimal.valueof(p.value);
                    osw.RadiusOrder = p.index;
                    osw.RadiusValue = Decimal.valueof(p.value);
                }
               
            }
        }
        system.debug('organisationalAutoSchedulePrameters '+osw);

        User me = [
            SELECT Id, Organization_Name__c
            FROM   User
            WHERE  Id = :UserInfo.getUserId()
        ];

        Organisation__c org = [SELECT Id FROM Organisation__c WHERE Name = :me.Organization_Name__c LIMIT 1];
        String truncatedStr = String.valueOf(org.Id).substring(0, 15);
        String UserEmail = UserInfo.getUserEmail(); 
       	list<Staff__c>	currentLoggedInStaff=StaffController.getStaffByEmail(UserEmail);
		Facility__c facValue= FacilityController.getfacilityById(currentLoggedInStaff[0].Facility__r.Id);
        system.debug('fac value ' +facValue);
            facValue.Risk_Index_Order__c=osw.RiskIndexOrder;
            facValue.Risk_Index_Value__c=osw.RiskIndexValue;
        
            facValue.Classification_Order__c=osw.ClassificationOrder;
            facValue.Classification_Value__c=osw.ClassificationValue;
            
            facValue.Fatigue_Management_Order__c=osw.FatigueManagementOrder;
             facValue.Fatigue_Management_Value__c=osw.FatigueManagementValue;
            
            facValue.Preferred_Staff_Order__c=osw.PreferredStaffOrder;
            facValue.Preferred_Staff_Value__c=osw.PreferredStaffValue;
     
            facValue.Employment_Type_Order__c=osw.EmploymentTypeOrder;
            facValue.Employment_Type_Value__c=osw.EmploymentTypeValue;
            facValue.Radius_Order__c=osw.RadiusOrder;
            facValue.Radius_Value__c=osw.RadiusValue;
        update facValue;
            
        
        List<Services_and_Support_Plan__c> unassigned = [
            SELECT Id,Un_Assigned_Service__c, ShiftwithStaff__r.RefId__c,ShiftwithStaff__r.Un_Assigned_Shift__c,ShiftwithStaff__r.Staff__c,ShiftwithStaff__r.Attendence__c ,ShiftwithStaff__r.Add_Shift__r.Un_Assigned_Shift__c,ShiftwithStaff__r.Add_Shift__c,
            ShiftwithStaff__r.Add_Shift__r.Day_Name__c,ShiftwithStaff__r.Public_holiday__c,ShiftwithStaff__r.Add_Shift__r.Shift_Type__c
            FROM   Services_and_Support_Plan__c
            WHERE  Un_Assigned_Service__c = TRUE
            AND    Date_of_Service__c     >= :sDate
            AND    Date_of_Service__c     <= :eDate
        ];
		//system.debug
        List<Id> availabilityIds = new List<Id>();
        for (Services_and_Support_Plan__c ssp : unassigned){
            if (ssp.ShiftwithStaff__r != null && ssp.ShiftwithStaff__r.RefId__c != null){
                availabilityIds.add(ssp.ShiftwithStaff__r.RefId__c);
            }
        }
			system.debug('facList '+facList);
        if (availabilityIds.isEmpty()) return new Map<Availability__c, FinalAvailable>();

        String availQuery =
            'SELECT Id, Start_Date__c, Start_Time__c, End_Date__c, End_Time__c,Geo_Location__Latitude__s,Geo_Location__Longitude__s,' +
            '  Participant__r.Name__c, Participant__r.Risk_Status__c, Participant__r.Risk_Sort__c, Participant__r.Facility__c,' +
            '       Role__c,' +
            '       (SELECT Id, Staff__c,Staff__r.Last_Name__c,Staff__r.Location__Latitude__s  FROM Priority_Staffs__r' +
            '        WHERE Staff__r.Type_of_Job__c = \'' + employmentTypeFilter + '\'' +
            '        ORDER BY Priority__c,Staff__r.Class_and_Paypont__c ' + classificationSort + ')' +
            ' FROM  Availability__c' +
            ' WHERE Id IN :availabilityIds AND Participant__r.Facility__c IN :facList' +
            ' ORDER BY Start_Date__c ASC, Participant__r.Risk_Sort__c ' + riskSortOrder;

        List<Availability__c> availList = Database.query(availQuery);
        system.debug(' availList '+availList);

        Set<Id> facilityIds = new Set<Id>();
        Set<Date> availDates = new Set<Date>();
        Set<String> roles = new Set<String>();
        Map<Id, List<Id>> priorityMap = new Map<Id, List<Id>>();

        for (Availability__c a : availList){
            facilityIds.add(a.Participant__r.Facility__c);
            availDates.add(a.Start_Date__c);
            roles.add(a.Role__c);

            List<Id> plist = new List<Id>();
            for (Priority_Staff__c ps : a.Priority_Staffs__r) plist.add(ps.Staff__c);
            priorityMap.put(a.Id, plist);
        }

        String roleFilter = '';
        if (!roles.isEmpty()){
            List<String> pieces = new List<String>();
            for (String r : roles)
                pieces.add('Role__c INCLUDES (\'' + String.escapeSingleQuotes(r) + '\')');
            roleFilter = '(' + String.join(pieces,' OR ') + ')';
        }

        String staffQuery =
            'SELECT Id, Name, Last_Name__c,Saturday_Hourly_Rate__c, Sunday_Hourly_Rate__c,Public_holiday_Hourly_Rate__c, Working_Hours_Rate__c,Afternoon_shift_Hourly_Rate__c, Night_shift_Hourly_Rate__c,' +
            '       (SELECT Id, Date__c, Start_Time__c, End_Date__c, End_Time__c' +
            '        FROM ShiftwithStaffs__r WHERE Attendence__c = true' +
            '              AND Date__c IN :availDates)' +
            ' FROM   Staff__c' +
            ' WHERE  Organization_Name__c = :truncatedStr' +
            ' AND    Facility__r.Status__c = true' +
            ' AND    Status__c = true' +
            ' AND    Facility__c IN :facilityIds' +
            ' AND    Type_of_Job__c = \'' + employmentTypeFilter + '\'' +
            (roleFilter == '' ? '' : ' AND ' + roleFilter) +
            ' ORDER BY Class_and_Paypont__c ' + classificationSort;

        List<Staff__c> staffMaster = Database.query(staffQuery);
          system.debug(' staffMaster '+staffMaster);
        
        Map<Id, Staff__c> staffMap = new Map<Id, Staff__c>(staffMaster);
        String StaffAvilRolefilter = '';
        if (!roles.isEmpty()){
            List<String> pieces = new List<String>();
            for (String r : roles)
                pieces.add('Staff__r.Role__c INCLUDES (\'' + String.escapeSingleQuotes(r) + '\')');
            StaffAvilRolefilter = '(' + String.join(pieces,' OR ') + ')';
        }
        String staffAvailQuery =
            'SELECT Id, Staff__c, Staff__r.Name, Staff__r.Last_Name__c, Staff__r.Location__Latitude__s, Staff__r.Location__Longitude__s, ' +
            'Start_Date__c, Start_Time__c, End_Date__c, End_Time__c ' +
            'FROM Availability__c ' +
            'WHERE Start_Date__c >= :sDate AND Staff__r.Facility__c IN :facilityIds ' +
            'AND End_Date__c <= :eDate ' +
            'AND Staff__r.Type_of_Job__c = \'' + String.escapeSingleQuotes(employmentTypeFilter) + '\'' +
            (StaffAvilRolefilter == '' ? '' : ' AND ' + StaffAvilRolefilter) + ' ' +
            'ORDER BY Staff__r.Class_and_Paypont__c ' + classificationSort + ', Start_Date__c';
        
        List<Availability__c> staffAvails = Database.query(staffAvailQuery);

         system.debug(' staffAvails '+staffAvails);


        Map<Id, List<Availability__c>> sameDayMap = new Map<Id, List<Availability__c>>();
        for (Availability__c req : availList){
            List<Availability__c> matches = new List<Availability__c>();
            if (priorityMap.containsKey(req.Id)){
                for (Availability__c sa : staffAvails){
                    if (priorityMap.get(req.Id).contains(sa.Staff__c) &&
                        sa.Start_Date__c == req.Start_Date__c){
                        matches.add(sa);
                    }
                }
            }
            if (!matches.isEmpty()) sameDayMap.put(req.Id, matches);
        }
        
        Map<Availability__c, FinalAvailable> result = new Map<Availability__c, FinalAvailable>();
        Map<Id, Map<Date, List<Map<String, DateTime>>>> assignedBlocksMap = new Map<Id, Map<Date, List<Map<String, DateTime>>>>();
        
        for (Availability__c req : availList) {
            DateTime reqStart = DateTime.newInstanceGMT(req.Start_Date__c, req.Start_Time__c);
            DateTime reqEnd   = DateTime.newInstanceGMT(req.End_Date__c, req.End_Time__c);
            Date reqDate     = req.Start_Date__c;
            
            Boolean matched = false;
            system.debug('AutoscheduleParameterRadius ' +AutoscheduleParameterRadius);
            Decimal latReq = req.Geo_Location__Latitude__s;
            Decimal lonReq = req.Geo_Location__Longitude__s;
             SYSTEM.DEBUG(' Avail location initially   + latReq=' + latReq + ', lonReq=' + lonReq);
            // 1. Try Priority Staff (STRICT MATCHING)
            if (nominatedStaff && sameDayMap.containsKey(req.Id)) {
                matched = tryAssign(req, sameDayMap.get(req.Id), true, reqStart, reqEnd, reqDate,
                                    fatigue, staffMap, assignedBlocksMap, result,AutoscheduleParameterRadius);
            }
            
            // 2. Try General Availability (STRICT MATCHING)
            if (!matched) {
                matched = tryAssign(req, staffAvails, true, reqStart, reqEnd, reqDate,
                                    fatigue, staffMap, assignedBlocksMap, result,AutoscheduleParameterRadius);
            }
            
   
        }
        
       updateAssignedRecords(unassigned, result,staffMap);  
        return result;
    }
   public static void updateAssignedRecords( List<Services_and_Support_Plan__c> unassigned,Map<Availability__c, FinalAvailable> result, Map<Id, Staff__c> staffMap) {
    List<Add_Shift__c> shiftsToUpdate = new List<Add_Shift__c>();
    List<ShiftwithStaff__c> shiftStaffsToUpdate = new List<ShiftwithStaff__c>();
    List<Services_and_Support_Plan__c> supportPlansToUpdate = new List<Services_and_Support_Plan__c>();
    set<Id> availsId= new set<Id>();
    // Create a map to lookup results by Availability ID
    Map<Id, FinalAvailable> resultById = new Map<Id, FinalAvailable>();
    for (Availability__c avail : result.keySet()) {
        resultById.put(avail.Id, result.get(avail));
        availsId.add(avail.Id);
        availsId.add(result.get(avail).StaffAvailId);
    }
       system.debug('availsId ' +availsId);
       
     
    for (Services_and_Support_Plan__c ss : unassigned) {
        if (ss.ShiftwithStaff__r != null && 
            ss.ShiftwithStaff__r.RefId__c != null && 
            resultById.containsKey(ss.ShiftwithStaff__r.RefId__c)) {
            
            // Update Services_and_Support_Plan__c
            Services_and_Support_Plan__c sspNew = new Services_and_Support_Plan__c(
                Id = ss.Id,
                Un_Assigned_Service__c = false,
                Service_Users__c = resultById.get(ss.ShiftwithStaff__r.RefId__c).staffId
            );
            supportPlansToUpdate.add(sspNew);
            
            // Update ShiftwithStaff__c - CORRECTED: Using ShiftwithStaff__c's own ID
         
            ShiftwithStaff__c shift = new ShiftwithStaff__c(
                Id = ss.ShiftwithStaff__r.Id, 
                Un_Assigned_Shift__c = false,
                Attendence__c = true,
                Is_Auto_Schedule_Shift__c=true,
                Staff__c = resultById.get(ss.ShiftwithStaff__r.RefId__c).staffId // Assign staff here
                
            );
            Decimal rate =getStaffHourlyRate(ss.ShiftwithStaff__r.Add_Shift__r.Shift_Type__c,ss.ShiftwithStaff__r.Public_holiday__c,ss.ShiftwithStaff__r.Add_Shift__r.Day_Name__c,staffMap,resultById.get(ss.ShiftwithStaff__r.RefId__c).staffId);
                system.debug('rate ' +rate);
            shift.Staff_Final_Hourly_Rate__c=rate;
            shiftStaffsToUpdate.add(shift);
            
            // Update Add_Shift__c if exists
            if (ss.ShiftwithStaff__r.Add_Shift__c != null) {
                Add_Shift__c adshift = new Add_Shift__c(
                    Id = ss.ShiftwithStaff__r.Add_Shift__c,
                    Un_Assigned_Shift__c = false
                );
                shiftsToUpdate.add(adshift);
            }
        }
    }
    system.debug('supportPlansToUpdate ' +supportPlansToUpdate);
    system.debug('shiftStaffsToUpdate ' +shiftStaffsToUpdate);
    system.debug('shiftsToUpdate ' +shiftsToUpdate);
    // Perform updates
       if (!supportPlansToUpdate.isEmpty()) update supportPlansToUpdate;
      if (!shiftStaffsToUpdate.isEmpty()) update shiftStaffsToUpdate;
      if (!shiftsToUpdate.isEmpty()) update shiftsToUpdate;
       List<Availability__c> totalAvailabilityList =[select Id,Assigned_Service_OR_Shift__c from Availability__c where Id IN:availsId];
       for(Availability__c av:totalAvailabilityList){
           av.Assigned_Service_OR_Shift__c =true;
       }
       system.debug('totalAvailabilityList ' +totalAvailabilityList);
      if (!totalAvailabilityList.isEmpty()) update totalAvailabilityList;
}
    
  public static decimal getStaffHourlyRate(string ShiftType, boolean isHoliday, string dayname, Map<Id, Staff__c> staffMap, string staffId){
      		SYSTEM.DEBUG('ShiftType '+ShiftType);
      	    SYSTEM.DEBUG('isHoliday '+isHoliday);
            SYSTEM.DEBUG('staffMap '+staffMap);
            SYSTEM.DEBUG('staffId '+staffId);
            SYSTEM.DEBUG('dayname '+dayname);
      
            Decimal rate=0;
            
            if (isHoliday) {
                rate =staffMap.get(staffId).Public_holiday_Hourly_Rate__c ;
            } else {
                switch on dayname.toLowerCase() {
                    when 'saturday' {
                        rate = staffMap.get(staffId).Saturday_Hourly_Rate__c ;
                    }
                    when 'sunday' {
                        rate = staffMap.get(staffId).Sunday_Hourly_Rate__c;
                    }
                    when else {
                        switch on ShiftType.toLowerCase() {
                            when 'night' {
                                rate = staffMap.get(staffId).Night_shift_Hourly_Rate__c;
                            }
                            when 'afternoon' {
                                rate =staffMap.get(staffId).Afternoon_shift_Hourly_Rate__c;
                            }
                            when else {
                                if (dayname == 'monday' || dayname == 'tuesday' || dayname == 'wednesday' ||
                                    dayname == 'thursday' || dayname == 'friday') {
                                        rate = staffMap.get(staffId).Working_Hours_Rate__c;
                                    }
                            }
                        }
                    }
                }
            }
      return rate;
    } 

    public static Boolean tryAssign(
        Availability__c req,
        List<Availability__c> candidateAvails,
        Boolean mustFullyCover, // TRUE = strict matching
        DateTime reqStart,
        DateTime reqEnd,
        Date reqDate,
        Boolean fatigue,
        Map<Id, Staff__c> staffMap,
        Map<Id, Map<Date, List<Map<String, DateTime>>>> assignedBlocksMap,
        Map<Availability__c, FinalAvailable> outMap, Decimal AutoScheduleRadius
    ) {
        Decimal latReq = req.Geo_Location__Latitude__s;
        Decimal lonReq = req.Geo_Location__Longitude__s;
      //  SYSTEM.DEBUG(' Avail distance   + latReq=' + latReq + ', lonReq=' + lonReq);
        for (Availability__c cand : candidateAvails) {
            // Skip if strict matching is required and staff doesn't cover the shift
            if (!withinGeoRadius(latReq, lonReq, cand.Staff__r.Location__Latitude__s, cand.Staff__r.Location__Longitude__s,AutoScheduleRadius))
                continue;
            if (mustFullyCover && !coversWindow(cand, req)) continue;
            
            if (hasTimeConflict(assignedBlocksMap, cand.Staff__c, reqDate, reqStart, reqEnd)) continue;
            if (fatigue && tooTired(cand.Staff__c, reqStart, staffMap)) continue;
            
            addMatch(req, cand.Staff__c, cand.Staff__r, reqDate, reqStart, reqEnd, assignedBlocksMap, outMap,cand.Id);
            return true;
        }
        return false;
    }


   public static Boolean coversWindow(Availability__c staffAvail, Availability__c shiftReq) {
    DateTime shiftStart = DateTime.newInstanceGMT(shiftReq.Start_Date__c, shiftReq.Start_Time__c);
    DateTime shiftEnd   = DateTime.newInstanceGMT(shiftReq.End_Date__c, shiftReq.End_Time__c);
    DateTime staffStart = DateTime.newInstanceGMT(staffAvail.Start_Date__c, staffAvail.Start_Time__c);
    DateTime staffEnd   = DateTime.newInstanceGMT(staffAvail.End_Date__c, staffAvail.End_Time__c);
  // System.debug('Staff: '+staffAvail.Staff__r.Name +'===>' + staffStart + ' - ' + staffEnd + ' | Shift: ' + shiftStart + ' - ' + shiftEnd);
     boolean  check=(staffStart <= shiftStart && staffEnd >= shiftEnd);
    //   System.debug('check '+check);
    return check;
  }

    public static Boolean tooTired(Id staffId, DateTime newStart, Map<Id, Staff__c> staffMap){
        Staff__c st = staffMap.get(staffId);
        if (st == null) return false;
        DateTime latestEnd = null;
        for (ShiftwithStaff__c sh : st.ShiftwithStaffs__r){
            DateTime e = DateTime.newInstanceGMT(sh.End_Date__c, sh.End_Time__c);
            if (e < newStart && (latestEnd == null || e > latestEnd)) latestEnd = e;
        }
        if (latestEnd == null) return false;
        Long gap = newStart.getTime() - latestEnd.getTime();
        Decimal hrs = (Decimal)gap / (1000*60*60);
        return (hrs <= 8);
    }

    public static Boolean isTimeOverlap(DateTime availS, DateTime availE, DateTime bS, DateTime bE){
        return (bS <= availS && bE >= availE);
    }

    public static Boolean isShiftOverlap(DateTime availS, DateTime availE, DateTime bS, DateTime bE){
        return (availS < bE && bS < availE);
    }

    public static Boolean hasTimeConflict(
        Map<Id, Map<Date, List<Map<String, DateTime>>>> blockMap,
        Id staffId, Date d, DateTime s, DateTime e
    ){
        if (!blockMap.containsKey(staffId)) return false;
        if (!blockMap.get(staffId).containsKey(d)) return false;
        for (Map<String, DateTime> block : blockMap.get(staffId).get(d)){
            if (isShiftOverlap(s, e, block.get('start'), block.get('end'))) return true;
        }
        return false;
    }

    public static void addMatch(
        Availability__c req, Id staffId, SObject staffRec,
        Date reqDate, DateTime s, DateTime e,
        Map<Id, Map<Date, List<Map<String, DateTime>>>> blockMap,
        Map<Availability__c, FinalAvailable> outMap,Id StaffAvailId){
        FinalAvailable wrap = new FinalAvailable(
            staffId,
            String.valueOf(staffRec.get('Name')),
            String.valueOf(staffRec.get('Last_Name__c')),
            String.valueOf(StaffAvailId)
        );
        outMap.put(req, wrap);
        addToAssignedBlocks(blockMap, staffId, reqDate, s, e);
    }

    public static void addToAssignedBlocks(
        Map<Id, Map<Date, List<Map<String, DateTime>>>> blockMap,
        Id staffId, Date d, DateTime s, DateTime e){
        if (!blockMap.containsKey(staffId)) blockMap.put(staffId, new Map<Date, List<Map<String, DateTime>>>());
        if (!blockMap.get(staffId).containsKey(d)) blockMap.get(staffId).put(d, new List<Map<String, DateTime>>());
        blockMap.get(staffId).get(d).add(
            new Map<String, DateTime>{'start' => s, 'end' => e}
        );
    }
    public static Double geoKmBetween(Decimal lat1, Decimal lon1, Decimal lat2, Decimal lon2) {
        final Double R = 6371.0; // Earth radius in kilometers
        
        Double dLat = ((Double)(lat2 - lat1)) * Math.PI / 180;
        Double dLon = ((Double)(lon2 - lon1)) * Math.PI / 180;
        Double lat1Rad = ((Double)lat1) * Math.PI / 180;
        Double lat2Rad = ((Double)lat2) * Math.PI / 180;
        
        Double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        Double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    
    public static Boolean withinGeoRadius(
        Decimal latReq, Decimal lonReq,
        Decimal latStf, Decimal lonStf,
        Decimal AutoScheduleRadius
    ) {
        // Check for missing data
        if (latReq == null || lonReq == null || latStf == null || lonStf == null) {
            System.debug('⚠️ Missing coordinates: '+ ', latStf=' + latStf + ', lonStf=' + lonStf);
            return false;
        }
        System.debug('📍 Checking geo radius:');
        System.debug('    Availability Location → (' + latReq + ', ' + lonReq + ')');
        System.debug('    Staff Location        → (' + latStf + ', ' + lonStf + ')');
        // Calculate distance
        Double distanceKm = geoKmBetween(latReq, lonReq, latStf, lonStf);
       
        System.debug('    Calculated Distance   → ' + distanceKm + ' km');
        System.debug('    Radius Threshold      → ' + AutoScheduleRadius + ' km');
        
        Boolean withinRadius = distanceKm <= AutoScheduleRadius;
        System.debug('    ✅ Within Radius?      → ' + withinRadius);
        
        return withinRadius;
    }

     @AuraEnabled
    public static  Facility__c currnetLoggedInFcaility(string UserEmail){
        list<Staff__c>	currentLoggedInStaff=StaffController.getStaffByEmail(UserEmail);
        Facility__c facValue= FacilityController.getfacilityById(currentLoggedInStaff[0].Facility__r.Id);
        return facValue;
    }
    @AuraEnabled
    public static void publishShifts(String startDate, String endDate){
        Date sDate = Date.valueOf(startDate);
        Date eDate = Date.valueOf(endDate);
       list<ShiftwithStaff__c> shiftStaff=[SELECT Id,Role_formula__c,Staff__c, Date__c,Start_Time__c,End_Date__c,End_Time__c FROM ShiftwithStaff__c WHERE Is_Auto_Schedule_Shift__c = true  AND
                                       Date__c >=:sDate and End_Date__c <=:eDate];
        If(shiftStaff.size()>0){
            for(ShiftwithStaff__c shift :shiftStaff){
            MobileAppNotificationsV2.generateAndSendNotification(shift.Role_formula__c, string.valueof(shift.Date__c), string.valueof(shift.Staff__c));
        	} 
        }
        StaffEmailNotificationController.sendPublishNotifications(startDate,endDate);
       
    }
      @AuraEnabled
    public static Boolean preventStaffAvailabilityDuplicates(String startDate, String endDate, string startTime, string endTime, String staffId,String AvailId) {
        String[] strTimeSplit = startTime.split(':');
        Time startTime24Format = Time.newInstance( Integer.valueOf(strTimeSplit[0]) //hour
                                                  ,Integer.valueOf(strTimeSplit[1]) //min
                                                  ,0        //sec
                                                  ,0);
      
        
        String[] endTimeSplit = endTime.split(':');
        Time endTime24Format = Time.newInstance( Integer.valueOf(endTimeSplit[0]) //hour
                                                ,Integer.valueOf(endTimeSplit[1]) //min
                                                ,0         //sec
                                                ,0);
       
        Date sDate=StaffAvailabilityController.parseDate(startDate);
        Date eDate=StaffAvailabilityController.parseDate(endDate);
        
        DateTime newStartDateTime = DateTime.newInstanceGMT(sDate, startTime24Format);
        DateTime newEndDateTime = DateTime.newInstanceGMT(eDate, endTime24Format);
        
        List<Staff__c> staffList = [
            SELECT Id,
            (SELECT Id, Start_Date__c, End_Date__c, Start_Time__c, End_Time__c
             FROM Availabilities__r where Start_Date__c  IN (:sDate, :sDate.addDays(-1)) AND ID !=:AvailId ),
            (SELECT Id, Date__c, End_Date__c, Start_Time__c, End_Time__c, Attendence__c
             FROM ShiftwithStaffs__r
             WHERE Attendence__c = TRUE AND Date__c   IN (:sDate, :sDate.addDays(-1)))
            FROM Staff__c
            WHERE Id = :staffId
        ];
        system.debug('Availabilities__r '+staffList[0].Availabilities__r);
          system.debug('ShiftwithStaffs__r '+staffList[0].ShiftwithStaffs__r);
        
        for (Staff__c staff : staffList) {
            // Check overlap with Availabilities
            If(staff.Availabilities__r.size()>0){
                for (Availability__c avail : staff.Availabilities__r) {
                    Date availEndDate = avail.End_Date__c != null ? avail.End_Date__c : avail.Start_Date__c;
                    DateTime availStart = DateTime.newInstanceGMT(avail.Start_Date__c, avail.Start_Time__c);
                    DateTime availEnd = DateTime.newInstanceGMT(availEndDate, avail.End_Time__c);
                    system.debug('newStartDateTime==> ' + newStartDateTime);
                    system.debug('newEndDateTime==> ' + newEndDateTime);
                    system.debug('availStart==> ' + availStart);
                    system.debug('availEnd==> ' + availEnd);
                    if (newStartDateTime < availEnd && availStart < newEndDateTime) {
                         system.debug(' in if ');
                       
                        return true;
                    }
                }
            }
          
            if(staff.ShiftwithStaffs__r.size()>0){
                 for (ShiftwithStaff__c shift : staff.ShiftwithStaffs__r) {
                Date shiftEndDate = shift.End_Date__c != null ? shift.End_Date__c : shift.Date__c;
                DateTime shiftStart = DateTime.newInstanceGMT(shift.Date__c, shift.Start_Time__c);
                DateTime shiftEnd = DateTime.newInstanceGMT(shiftEndDate, shift.End_Time__c);
                 system.debug('newStartDateTime==> ' + newStartDateTime);
                    system.debug('newEndDateTime==> ' + newEndDateTime);
                    system.debug('availStart==> ' + shiftStart);
                    system.debug('availEnd==> ' + shiftEnd);
                if (newStartDateTime < shiftEnd && shiftStart < newEndDateTime) {
                    system.debug(' in else ');
                   
                    return true;
                }
            	}
            }
            // Check overlap with Shifts
           
        }
        
        return false;
    }
    


  
}