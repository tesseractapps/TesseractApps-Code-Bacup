public class RosterRejectedShiftsAutoScheduleHandler {
     public class FinalAvailable {
        @AuraEnabled public String staffId;
        @AuraEnabled public String firstName;
        @AuraEnabled public String lastName;
      
        public FinalAvailable(String staffId, String firstName, String lastName) {
            this.staffId   = staffId;
            this.firstName = firstName;
            this.lastName  = lastName;
          
        }
    }
    
    @AuraEnabled
    public static void assignAutoShifts(string startDate,String endDate, String orgId,string AutoScheduleParameters){
        Date sDate = Date.valueOf(startDate); 
        Date eDate = Date.valueOf(endDate);
        
        List<RosterAutoScheduleHandler.AutoSchedulePrameterWrapper> parameters =(List<RosterAutoScheduleHandler.AutoSchedulePrameterWrapper>) JSON.deserialize( AutoScheduleParameters,List<RosterAutoScheduleHandler.AutoSchedulePrameterWrapper>.class);
        Boolean fatigue               = false;
        Boolean nominatedStaff        = false;
        String  riskSortOrder         = 'ASC';
        String  classificationSort    = 'ASC';
        String  employmentTypeFilter  = 'Full-time and part-time';
        Decimal  AutoscheduleParameterRadius=100;
        RosterAutoScheduleHandler.organisationalAutoSchedulePrameters osw= new  RosterAutoScheduleHandler.organisationalAutoSchedulePrameters ();
        for (RosterAutoScheduleHandler.AutoSchedulePrameterWrapper p : parameters) {
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
        
        String UserEmail = UserInfo.getUserEmail(); 
        list<Staff__c>	currentLoggedInStaff=StaffController.getStaffByEmail(UserEmail);
        Facility__c facValue= FacilityController.getfacilityById(currentLoggedInStaff[0].Facility__r.Id);
       // system.debug('fac value ' +facValue);
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
      //  system.debug('facValue '+facValue);
        List<ShiftwithStaff__c> rejectedList  =[
            SELECT Id, Staff__r.Email_Address__c, Staff__r.Name__c, Staff__r.Name,
            Facility__c, Add_Shift__r.Start_Date__c, Add_Shift__r.Break__c,
            Shift_Type__c, Add_Shift__r.Role__c, Add_Shift__r.Shift_Start_End_Time__c,
            Attendence__c, Add_Shift__r.Direction__r.Name,Add_Shift__r.Day_Name__c,Public_holiday__c,
            Add_Shift__r.Location__Latitude__s,Add_Shift__r.Location__Longitude__s,Add_Shift__r.Is_EOI__c,Add_Shift__r.Start_Time__c,Add_Shift__r.End_Time__c,
            Add_Shift__r.Public_holiday__c,Add_Shift__r.Shift_Type__c,Add_Shift__r.Quantity__c,Staff__r.Set_Hours__c,
            Duration__c, Add_Shift__r.Duration__c, Set_Hours__c,
            Log_In_Date_Time__c, Log_Out_Date_Time__c, Shift_Rejected__c,Date__c,End_Date__c,(SELECT Id, Services__c, State__c, Service_Users__c FROM Services_and_Support_Plans__r) 
            FROM ShiftwithStaff__c
            WHERE Attendence__c = false AND Shift_Rejected__c = true AND Add_Shift__r.Start_Date__c >= :sDate AND Add_Shift__r.Start_Date__c <= :eDate AND Staff__r.Facility__r.Organisation__c =:orgId
            ORDER BY Add_Shift__r.Start_Date__c ASC 
        ];
        system.debug('rejectedList '+rejectedList);
        
        Map<Id, ShiftwithStaff__c> rejectedShiftMap = new Map<Id, ShiftwithStaff__c>();
        Set<Date> rejectedDates = new Set<Date>();
        Map<Id, Id> shiftRejectedByStaff = new Map<Id, Id>();
        for (ShiftwithStaff__c s : rejectedList) {
            rejectedShiftMap.put(s.Id, s);
            rejectedDates.add(s.Date__c);
            if (s.Staff__c != null) {
                shiftRejectedByStaff.put(s.Id, s.Staff__c);
            }
        }
        
        String staffAvailQuery = 
            'SELECT Id, Staff__c, Staff__r.Name, Staff__r.Last_Name__c, Staff__r.Location__Latitude__s, Staff__r.Location__Longitude__s, Staff__r.Saturday_Hourly_Rate__c, Staff__r.Sunday_Hourly_Rate__c,Staff__r.Public_holiday_Hourly_Rate__c,Staff__r.Working_Hours_Rate__c,Staff__r.Afternoon_shift_Hourly_Rate__c,Staff__r.Night_shift_Hourly_Rate__c, ' +
            'Start_Date__c, Start_Time__c, End_Date__c, End_Time__c ' +
            'FROM Availability__c ' +
            'WHERE Start_Date__c IN :rejectedDates ' +
            'AND Staff__r.Type_of_Job__c = \'' + String.escapeSingleQuotes(employmentTypeFilter) + '\' ' +
            'ORDER BY Staff__r.Class_and_Paypont__c ' + classificationSort;
        
        List<Availability__c> staffAvails = Database.query(staffAvailQuery);
        
        // Step 2: Build staff map
        Set<Id> staffIds = new Set<Id>();
        for (Availability__c a : staffAvails) {
            staffIds.add(a.Staff__c);
        }
        
        Map<Id, Staff__c> staffMap = new Map<Id, Staff__c>(
            [SELECT Id, Name, Last_Name__c,Saturday_Hourly_Rate__c, Sunday_Hourly_Rate__c,Public_holiday_Hourly_Rate__c, Working_Hours_Rate__c,Afternoon_shift_Hourly_Rate__c, Night_shift_Hourly_Rate__c,
             (SELECT Id, Date__c, End_Date__c, End_Time__c 
              FROM ShiftwithStaffs__r 
              WHERE Attendence__c = true AND Date__c IN :rejectedDates)
             FROM Staff__c
             WHERE Id IN :staffIds]
        );
        
        // Step 3: Assignment
        Map<ShiftwithStaff__c,FinalAvailable> result = new Map<ShiftwithStaff__c,FinalAvailable>();
        Map<Id, Map<Date, List<Map<String, DateTime>>>> assignedBlocksMap = new Map<Id, Map<Date, List<Map<String, DateTime>>>>();
        
        for (ShiftwithStaff__c s : rejectedList) {
            DateTime startDT = DateTime.newInstanceGMT(s.Date__c, s.Add_Shift__r.Start_Time__c);
            DateTime endDT = DateTime.newInstanceGMT(s.End_Date__c, s.Add_Shift__r.End_Time__c);
            Date shiftDate = s.Date__c;
            
            // Geo from shift direction or location if needed
            Decimal lat = s.Add_Shift__r.Location__Latitude__s != null ?   s.Add_Shift__r.Location__Latitude__s  : 0;
            Decimal lon = s.Add_Shift__r.Location__Longitude__s != null ?  s.Add_Shift__r.Location__Longitude__s : 0;
            
            for (Availability__c avail : staffAvails) {
                if (shiftRejectedByStaff.containsKey(s.Id) && avail.Staff__c == shiftRejectedByStaff.get(s.Id)) {
                    continue;
                } 
                if (RosterAutoScheduleHandler.withinGeoRadius(lat, lon, avail.Staff__r.Location__Latitude__s, avail.Staff__r.Location__Longitude__s, AutoscheduleParameterRadius)
                    &&  coversWindowShift(avail, s)
                    && !RosterAutoScheduleHandler.hasTimeConflict(assignedBlocksMap, avail.Staff__c, shiftDate, startDT, endDT)
                    && (!fatigue || !RosterAutoScheduleHandler.tooTired(avail.Staff__c, startDT, staffMap))
                   ) {
                      addMatchCustom(s, avail, staffMap.get(avail.Staff__c), shiftDate, startDT, endDT, assignedBlocksMap, result);
                       break;
                   }
            }
        }
        
        // Step 4: Update shifts and service users
        List<ShiftwithStaff__c> updates = new List<ShiftwithStaff__c>();
        List<Services_and_Support_Plan__c> serviceUpdates = new List<Services_and_Support_Plan__c>();
        
        for (ShiftwithStaff__c shift : result.keySet()) {
            FinalAvailable assigned = result.get(shift);
            shift.Attendence__c = true;
            shift.Is_Auto_Schedule_Shift__c = true;
            shift.Shift_Rejected__c=false;
            shift.Staff__c = assigned.staffId;
            
            if (assigned.staffId != null && staffMap.containsKey(assigned.staffId)) {
                Decimal rate = RosterAutoScheduleHandler.getStaffHourlyRate(
                    shift.Shift_Type__c,
                    shift.Public_Holiday__c,
                    shift.Add_Shift__r.Day_Name__c,
                    staffMap,
                    assigned.staffId
                );
                shift.Staff_Final_Hourly_Rate__c = rate;
            }
            updates.add(shift);
				            
            
            for (Services_and_Support_Plan__c ssp : shift.Services_and_Support_Plans__r) {
                ssp.Service_Users__c = assigned.staffId;
               // ssp.Un_Assigned_Service__c = false;
                serviceUpdates.add(ssp);
            }
        }
        system.debug('updates ' +updates);
       if (!updates.isEmpty()) update updates;
       if (!serviceUpdates.isEmpty()) update serviceUpdates;
        
    }
     @AuraEnabled
    public static void addMatchCustom(
        ShiftwithStaff__c shift, Availability__c avail, SObject staffRec,
        Date reqDate, DateTime s, DateTime e,
        Map<Id, Map<Date, List<Map<String, DateTime>>>> blockMap,
        Map<ShiftwithStaff__c, FinalAvailable> outMap){
            FinalAvailable wrap = new FinalAvailable(
                avail.Staff__c,
                String.valueOf(staffRec.get('Name')),
                String.valueOf(staffRec.get('Last_Name__c'))
            );
            outMap.put(shift, wrap);
            RosterAutoScheduleHandler.addToAssignedBlocks(blockMap, avail.Staff__c, reqDate, s, e);
        }
    
    public static Boolean coversWindowShift(Availability__c staffAvail, ShiftwithStaff__c shiftReq) {
    DateTime shiftStart = DateTime.newInstanceGMT(shiftReq.Date__c, shiftReq.Add_Shift__r.Start_Time__c);
    DateTime shiftEnd   = DateTime.newInstanceGMT(shiftReq.End_Date__c, shiftReq.Add_Shift__r.End_Time__c);
    DateTime staffStart = DateTime.newInstanceGMT(staffAvail.Start_Date__c, staffAvail.Start_Time__c);
    DateTime staffEnd   = DateTime.newInstanceGMT(staffAvail.End_Date__c, staffAvail.End_Time__c);
    
    return (staffStart <= shiftStart && staffEnd >= shiftEnd);
}
    
}