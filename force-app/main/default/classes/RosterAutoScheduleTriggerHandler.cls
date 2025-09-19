public class RosterAutoScheduleTriggerHandler {
    
    public static void createUnAssignedShifts(list<Availability__c> participantAvailabilityList,map<Id,Availability__c> AvaliablityMap){
        set<Id> availabilityIds= new set<Id>();
        set<Id> participantIdList =new set<Id>();
        set<Id> StaffIds= new set<Id>();
        List<Date> shiftDates = new list<Date>();
        list<Add_Shift__c> AddShiftList= new  list<Add_Shift__c>();
         list<ShiftwithStaff__c> ShiftWithStaffList= new  list<ShiftwithStaff__c>();
        List<Services_and_Support_Plan__c> serviceList = new List<Services_and_Support_Plan__c>();
        map<Id, list<ID>> StaffAvailabilityMap = new  map<Id, list<ID>>();
         User objUser = [SELECT Id, Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];
          list<string> rolesList= new List<string>();
        for(Availability__c Avail:participantAvailabilityList){
            if(Avail.Role__c !=null)
            rolesList.add(Avail.Role__c);
        }
        list<Organisation__c> orgState = [SELECT Id,Address_Latest__StateCode__s FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1];
        
         list<Staff__c> totalStaffList= StaffController.StaffsRolesWiseList(orgState[0].Id, new List<string>(), rolesList,'');
        list<Id> allStaffId =new list<Id>();
         Map<Id, Staff__c> staffMap = new Map<Id, Staff__c>();
        for(Staff__c ss:totalStaffList){
            allStaffId.add(ss.id);
            if(!staffMap.containsKey(ss.id)){
               staffMap.put(ss.id,new staff__c()) ;
            }
            staffMap.put(ss.id,ss);
        }
        for(Availability__c Avail:participantAvailabilityList){
            if(Avail.Participant__c !=null ){
                availabilityIds.add(Avail.Id); 
                shiftDates.add(Avail.Start_Date__c);
                participantIdList.add(Avail.Participant__c);
                if(!StaffAvailabilityMap.containsKey(Avail.Id)){
                    StaffAvailabilityMap.put(Avail.Id, new list<Id>());
                }
                StaffAvailabilityMap.put(Avail.Id,allStaffId); 
            }
            
            
        }
        system.debug('availabilityIds '+participantAvailabilityList);
           Map<Id, Client__c> participantMap = new Map<Id, Client__c>();
        if(participantIdList .size()>0){
            list<Client__c>Clients =[select id,Facility__c,Address__Street__s,Address__City__s,Address__StateCode__s,Address__CountryCode__s,Address__PostalCode__s  from Client__c where ID  In:participantIdList];
            
            for(Client__c cc:Clients){
                if(!participantMap.containsKey(cc.id)){
                    participantMap.put(cc.id,cc);
                }
            }
            Map<Id, List<StaffOverlapWrapper>> OverlappingStaffData=getOverlappingShiftsAndStaffData(StaffAvailabilityMap);
            system.debug('prority staff '+StaffIds);
            
            
            List<Public_Holiday__c> holidayList=[SELECT Id, Date__c, State__c, Holiday_Name__c FROM Public_Holiday__c where Date__c IN :shiftDates and State__c INCLUDES (:orgState[0].Address_Latest__StateCode__s) ];
            Map<Date, String> holidayMap = new Map<Date, String>();
            if (!holidayList.isEmpty()) {
                for (Public_Holiday__c holiday : holidayList) {
                    if (!holidayMap.containsKey(holiday.Date__c)) {
                        holidayMap.put(holiday.Date__c, holiday.Holiday_Name__c);
                    }
                }
            }
              for(Availability__c Avail:participantAvailabilityList){
              Add_Shift__c shift = new Add_Shift__c();
              shift.Start_Date__c=Avail.Start_Date__c;
              shift.Facility__c=participantMap.get(Avail.Participant__c).Facility__c;
              shift.Start_Time__c=Avail.Start_Time__c;
              shift.End_Time__c=Avail.End_Time__c;
              DateTime myDateStartTime = DateTime.newInstance(Avail.Start_Date__c, Avail.Start_Time__c);
              String formattedStartTime = myDateStartTime.format('hh:mm a'); 
              shift.Start_Time_Text__c = formattedStartTime;
              DateTime myDateEndTime = DateTime.newInstance(Avail.Start_Date__c, Avail.End_Time__c);
              String formattedEndTime = myDateEndTime.format('hh:mm a'); 
              shift.End_Time_Text__c =formattedEndTime;
              shift.RefId__c=Avail.Id;
              shift.Shift_Type__c = Avail.Shift_Type__c;
              shift.Role__c = Avail.Role__c;
              shift.Quantity__c=1;
              shift.Un_Assigned_Shift__c=true;
              shift.Location__Street__s = participantMap.get(Avail.Participant__c).Address__Street__s;
              shift.Location__City__s = participantMap.get(Avail.Participant__c).Address__City__s;
              shift.Location__StateCode__s = participantMap.get(Avail.Participant__c).Address__StateCode__s;
              shift.Location__PostalCode__s =participantMap.get(Avail.Participant__c).Address__PostalCode__s;
              Datetime dt = Datetime.newInstance(shift.Start_Date__c, Time.newInstance(0, 0, 0, 0));
              shift.Day_Name__c = dt.format('EEEE');
              shift.Location__CountryCode__s = 'AU';
              shift.Is_EOI__c = false;
              shift.Shift_Notes__c = '';
              shift.Duration__c = AddShiftHandler.getDuartion(Avail.Start_Time__c, Avail.End_Time__c,Avail.Start_Date__c, Avail.End_Date__c !=null?  Avail.End_Date__c :Avail.Start_Date__c);
              shift.Public_holiday__c= holidayMap.containsKey(Avail.Start_Date__c) ?true:false;
              shift.Get_Facility__c=true;
              shift.Participant_Address_checkbox__c=true;
              AddShiftList.add(shift);
              
          }
        system.debug('AddShiftList' +AddShiftList);
        if(AddShiftList.size()>0){
            insert AddShiftList;
            
            for (Add_Shift__c addShift: AddShiftList){
                ShiftwithStaff__c ss = new ShiftwithStaff__c();
                ss.Shift_SCR__c=0;
                ss.Recurring_Date__c=addShift.Start_Date__c;
                ss.Add_Shift__c = addShift.Id;
                ss.Un_Assigned_Shift__c=true;
                //ss.Availability_Duration__c=addShift.Duration__c;
              
                list<StaffOverlapWrapper> staffList=OverlappingStaffData.get(addShift.RefId__c); 
                System.debug('StaffOverlapWrapper size' +staffList.size());
                string AvailableStaff ;
                for(StaffOverlapWrapper staff:staffList){
                      System.debug('hasOverlap' +staff.hasOverlap); 
                      
                    if(staff.hasOverlap==false){
                        AvailableStaff=staff.staffId; 
                         System.debug('AvailableStaff' +AvailableStaff); 
                        break ;
                    }
                    
                }
                 System.debug('AvailableStaff' +AvailableStaff); 
                ss.Staff__c = AvailableStaff;
                
                String day = addShift.Day_Name__c.toLowerCase();
                String shiftType = addShift.Shift_Type__c != null ? addShift.Shift_Type__c.toLowerCase() : '';
                 Decimal rate;
                  Staff__c staff = staffMap.get(AvailableStaff);
                system.debug('available staff '+staff);
                   boolean isPublicHoliday=false;
                    if(holidayMap.containsKey(addShift.Start_Date__c)) {
                       isPublicHoliday=true;
                    }
                    if (isPublicHoliday) {
                        rate = staff.Public_holiday_Hourly_Rate__c >0 ?staff.Public_holiday_Hourly_Rate__c :0;
                    } else {
                    switch on day {
                        when 'saturday' {
                            rate = staff.Saturday_Hourly_Rate__c >0?staff.Saturday_Hourly_Rate__c  :0;
                        }
                        when 'sunday' {
                            rate = staff.Sunday_Hourly_Rate__c >0 ?staff.Sunday_Hourly_Rate__c :0;
                        }
                        when else {
                            switch on shiftType {
                                when 'night' {
                                    rate = staff.Night_shift_Hourly_Rate__c >0 ? staff.Night_shift_Hourly_Rate__c :0;
                                }
                                when 'afternoon' {
                                    rate = staff.Afternoon_shift_Hourly_Rate__c >0?staff.Public_holiday_Hourly_Rate__c :0;
                                }
                                when else {
                                    if (day == 'monday' || day == 'tuesday' || day == 'wednesday' ||
                                        day == 'thursday' || day == 'friday') {
                                            rate = staff.Working_Hours_Rate__c >0 ? staff.Working_Hours_Rate__c:0;
                                        }
                                }
                            }
                        }
                    }
                }
            
            
                ss.Staff_Final_Hourly_Rate__c =rate;
                ss.Attendence__c = false;
                ss.RefId__c = addShift.RefId__c;
                ShiftWithStaffList.add(ss);
                
            }
            
            if(ShiftWithStaffList.size()>0){
                insert ShiftWithStaffList;
              for (ShiftwithStaff__c shiftStaff : ShiftWithStaffList) {
                
               Services_and_Support_Plan__c service = new Services_and_Support_Plan__c();
                  Availability__c avail = AvaliablityMap.get(shiftStaff.RefId__c);
                  service.Funds_Tracker__c = avail.Funds_Tracker__c;
                  service.Service_Users__c = shiftStaff.Staff__c;
                  service.Status__c = 'Not Yet Invoiced';
                  service.Date_of_Service__c = avail.Start_Date__c;
                  service.State__c = avail.State__c;
                  service.Start_Time_24_Format__c = avail.Start_Time__c;
                  service.End_Time_24_Format__c = avail.End_Time__c;
                  service.Service_Type__c = avail.NDIS_Support_Catalogue__c;
                  service.Client__c=avail.Participant__c;
                  Decimal duration = AddShiftHandler.getDuartion(avail.Start_Time__c, avail.End_Time__c,avail.Start_Date__c,  Avail.End_Date__c !=null?  Avail.End_Date__c :Avail.Start_Date__c);
                  system.debug('duration  ' +duration);
                 // system.debug('Availability_Duration__c ' +shiftStaff.Availability_Duration__c);
                  service.Qty__c = duration;
                       system.debug(' service.Qty__c  ' + service.Qty__c);
                  service.Un_Assigned_Service__c=true;
                  service.ShiftwithStaff__c = shiftStaff.Id;
                  service.Services__c=avail.Funds_Tracker__c;
                  
                  // Add to list
                  serviceList.add(service);
              }
                if(serviceList.size()>0){
                    insert serviceList;
                }
        
            } 
                        
        }
        }
    
    }
    
   @AuraEnabled
    public static Map<Id, List<StaffOverlapWrapper>> getOverlappingShiftsAndStaffData(Map<Id, List<Id>> StaffAvailabilityMap) {
        Map<Id, List<StaffOverlapWrapper>> resultMap = new Map<Id, List<StaffOverlapWrapper>>();
        Set<Id> availabilityIds = StaffAvailabilityMap.keySet();
        Set<Id> allStaffIds = new Set<Id>();
        
        for (List<Id> staffList : StaffAvailabilityMap.values()) {
            allStaffIds.addAll(staffList);
        }
        
        // Query all availability records with date/time info
        Map<Id, Availability__c> availabilityData = new Map<Id, Availability__c>(
            [SELECT Id, Start_Date__c, Start_Time__c, End_Date__c, End_Time__c, Shift_Type__c 
             FROM Availability__c 
             WHERE Id IN :availabilityIds]
        );
        
        Set<Date> allAvailabilityDates = new Set<Date>();
        
        for (Availability__c avail : availabilityData.values()) {
            Date startDate = avail.Start_Date__c;
           allAvailabilityDates.add(startDate);
        }
        
        // Query all relevant shifts in one go
        List<ShiftwithStaff__c> potentialShifts = [
            SELECT Staff__c, Date__c, Start_Time__c, End_Date__c, End_Time__c
            FROM ShiftwithStaff__c
            WHERE Attendence__c = true
            AND Staff__c IN :allStaffIds
            AND (
                (Date__c In:allAvailabilityDates) // Reasonable window — customize if needed
            )
        ];
        
        // Group shifts by staff
        Map<Id, List<ShiftwithStaff__c>> staffToShiftsMap = new Map<Id, List<ShiftwithStaff__c>>();
        for (ShiftwithStaff__c shift : potentialShifts) {
            if (!staffToShiftsMap.containsKey(shift.Staff__c)) {
                staffToShiftsMap.put(shift.Staff__c, new List<ShiftwithStaff__c>());
            }
            staffToShiftsMap.get(shift.Staff__c).add(shift);
        }
        
        // Loop over each availability and evaluate overlaps for its staff
        for (Id availabilityId : availabilityIds) {
            Availability__c avail = availabilityData.get(availabilityId);
            List<Id> staffList = StaffAvailabilityMap.get(availabilityId);
            List<StaffOverlapWrapper> overlapResults = new List<StaffOverlapWrapper>();
            
            if (avail == null || staffList == null) continue;
            
            // Build DateTime range
            DateTime startDateTime = DateTime.newInstance(avail.Start_Date__c, avail.Start_Time__c);
            Date endDate = (avail.End_Date__c != null) ? avail.End_Date__c : avail.Start_Date__c;
            DateTime endDateTime = DateTime.newInstance(endDate, avail.End_Time__c);
            
            for (Id staffId : staffList) {
                Boolean hasOverlap = false;
                List<ShiftwithStaff__c> existingShifts = staffToShiftsMap.get(staffId);
                
                if (existingShifts != null) {
                    for (ShiftwithStaff__c shift : existingShifts) {
                        DateTime shiftStart = DateTime.newInstance(shift.Date__c, shift.Start_Time__c);
                        Date shiftEndDate = (shift.End_Date__c != null) ? shift.End_Date__c : shift.Date__c;
                        DateTime shiftEnd = DateTime.newInstance(shiftEndDate, shift.End_Time__c);
                        system.debug('shift.Date__c >>'+shift.Date__c);
                        if (shiftStart <= endDateTime && shiftEnd >= startDateTime) {
                            hasOverlap = true;
                            break;
                        }
                    }
                }
                
                overlapResults.add(new StaffOverlapWrapper(staffId, hasOverlap));
            }
            
            resultMap.put(availabilityId, overlapResults);
        }
        
        return resultMap;
    }
    

   @AuraEnabled
public static void updateUnAssignedShifts(String startDate, String endDate) {
    Date sDate = Date.valueOf(startDate);
    Date eDate = Date.valueOf(endDate);

    List<Add_Shift__c> shiftsToUpdate = new List<Add_Shift__c>();
    List<ShiftwithStaff__c> shiftStaffsToUpdate = new List<ShiftwithStaff__c>();
    List<Services_and_Support_Plan__c> supportPlansToUpdate = new List<Services_and_Support_Plan__c>();

    List<Add_Shift__c> unAssignedShifts = [
        SELECT Id, Un_Assigned_Shift__c,
            (SELECT Id, Un_Assigned_Shift__c,
                    (SELECT Id, Un_Assigned_Service__c FROM Services_and_Support_Plans__r)
             FROM ShiftwithStaffs__r)
        FROM Add_Shift__c
        WHERE Un_Assigned_Shift__c = TRUE
        AND Start_Date__c >= :sDate AND Start_Date__c <= :eDate
    ];

    for (Add_Shift__c shift : unAssignedShifts) {
        shift.Un_Assigned_Shift__c = false;
        shiftsToUpdate.add(shift);

        for (ShiftwithStaff__c shiftStaff : shift.ShiftwithStaffs__r) {
           shiftStaff.Un_Assigned_Shift__c = false;
            shiftStaff.Attendence__c = true;
           shiftStaffsToUpdate.add(shiftStaff);

            for (Services_and_Support_Plan__c plan : shiftStaff.Services_and_Support_Plans__r) {
                plan.Un_Assigned_Service__c = false;
              //  plan.Assigned_Service__c=true;
                supportPlansToUpdate.add(plan);
            }
        }
    }

    if (!shiftsToUpdate.isEmpty()) {
        update shiftsToUpdate;
    }
    if (!shiftStaffsToUpdate.isEmpty()) {
        update shiftStaffsToUpdate;
    }
    if (!supportPlansToUpdate.isEmpty()) {
        update supportPlansToUpdate;
    }
}


 
    
   public class StaffOverlapWrapper {
    @AuraEnabled public String staffId;
    @AuraEnabled public Boolean hasOverlap;

    public StaffOverlapWrapper(String staffId, Boolean hasOverlap) {
        this.staffId = staffId;
        this.hasOverlap = hasOverlap;
    }
}
    
    

}