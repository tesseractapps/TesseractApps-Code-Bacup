public class RosterAutoScheduleTriggerHandler {
    
    public static void createUnAssignedShifts(list<Availability__c> participantAvailabilityList,map<Id,Availability__c> AvaliablityMap){
        set<Id> availabilityIds= new set<Id>();
        set<Id> participantIdList =new set<Id>();
        set<Id> StaffIds= new set<Id>();
        List<Date> shiftDates = new list<Date>();
        list<Add_Shift__c> AddShiftList= new  list<Add_Shift__c>();
         list<ShiftwithStaff__c> ShiftWithStaffList= new  list<ShiftwithStaff__c>();
        List<Services_and_Support_Plan__c> serviceList = new List<Services_and_Support_Plan__c>();
         User objUser = [SELECT Id, Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];
       list<string> rolesList= new List<string>();
        list<Organisation__c> orgState = [SELECT Id,Address_Latest__StateCode__s FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1];
       
         list<Staff__c> totalStaffList= StaffController.StaffsRolesWiseList(orgState[0].Id, new List<string>(), rolesList,'');
        list<Id> allStaffId =new list<Id>();
        for(Staff__c ss:totalStaffList){
            allStaffId.add(ss.id);
        }
        for(Availability__c Avail:participantAvailabilityList){
            if(Avail.Participant__c !=null ){
                availabilityIds.add(Avail.Id); 
                shiftDates.add(Avail.Start_Date__c);
                participantIdList.add(Avail.Participant__c);
            }  
        }
           system.debug('availabilityIds '+participantAvailabilityList);
            map<Id,map<String,String>>  AvailabilityShiftMap= new map<Id,map<String,String>>();
            List<Add_Shift__c> existingAvaialibility = [
            SELECT Id, Un_Assigned_Shift__c,RefId__c,
            (SELECT Id, Un_Assigned_Shift__c,RefId__c,
                    (SELECT Id, Un_Assigned_Service__c FROM Services_and_Support_Plans__r limit 1)
                FROM ShiftwithStaffs__r limit 1)
        FROM Add_Shift__c  WHERE RefId__c IN:availabilityIds
            ];
            if(existingAvaialibility.size()>0){
                for(Add_Shift__c avaShift:existingAvaialibility){
                   map<String,String> shiftIdmap= new map<String,String>();
                    shiftIdmap.put('AddshiftId',avaShift.Id);
                    ShiftwithStaff__c ss=avaShift.ShiftwithStaffs__r[0];
                    shiftIdmap.put('shiftWithStaffId',ss.Id);
                    Services_and_Support_Plan__c service=ss.Services_and_Support_Plans__r[0];
                    shiftIdmap.put('ServiceId',service.Id);
                    AvailabilityShiftMap.put(avaShift.RefId__c,shiftIdmap);
                }
            }
     
           Map<Id, Client__c> participantMap = new Map<Id, Client__c>();
        if(participantIdList .size()>0){
            list<Client__c>Clients =[select id,Facility__c,Address__Street__s,Address__City__s,Address__StateCode__s,Address__CountryCode__s,Address__PostalCode__s  from Client__c where ID  In:participantIdList];
            
            for(Client__c cc:Clients){
                if(!participantMap.containsKey(cc.id)){
                    participantMap.put(cc.id,cc);
                }
            }
            
            system.debug('state code '+orgState[0].Address_Latest__StateCode__s);
            String stateFullCode=AddShiftHandler.getStateFullForm(orgState[0].Address_Latest__StateCode__s);
            List<Public_Holiday__c> holidayList=[SELECT Id, Date__c, State__c, Holiday_Name__c FROM Public_Holiday__c where Date__c IN :shiftDates and State__c INCLUDES (:stateFullCode) ];
            system.debug('state code '+holidayList);
            Map<Date, String> holidayMap = new Map<Date, String>();
            if (!holidayList.isEmpty()) {
                for (Public_Holiday__c holiday : holidayList) {
                    if (!holidayMap.containsKey(holiday.Date__c)) {
                        holidayMap.put(holiday.Date__c, holiday.Holiday_Name__c);
                    }
                }
            }
              for(Availability__c Avail:participantAvailabilityList){
                  system.debug('Avail ' +Avail.Address_Type__c);
              Add_Shift__c shift = new Add_Shift__c();
              if(AvailabilityShiftMap.containsKey(Avail.Id)){ 
                 shift= new Add_Shift__c(Id=AvailabilityShiftMap.get(Avail.Id).get('AddshiftId'));
              }
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
              shift.Location__Street__s =Avail.Address__Street__s;
              shift.Location__City__s =Avail.Address__City__s;
              shift.Location__StateCode__s = Avail.Address__StateCode__s;
              shift.Location__PostalCode__s =Avail.Address__PostalCode__s;
              shift.Location__Latitude__s=Avail.Geo_Location__Latitude__s;
              shift.Location__Longitude__s=Avail.Geo_Location__Longitude__s;   
              Datetime dt = Datetime.newInstance(shift.Start_Date__c, Time.newInstance(0, 0, 0, 0));
              shift.Day_Name__c = dt.format('EEEE');
              shift.Location__CountryCode__s = 'AU';
              shift.Is_EOI__c = false;
              shift.Shift_Notes__c = '';
              shift.Duration__c = AddShiftHandler.getDuartion(Avail.Start_Time__c, Avail.End_Time__c,Avail.Start_Date__c, Avail.Start_Date__c);
              shift.Public_holiday__c= holidayMap.containsKey(Avail.Start_Date__c) ?true:false;
              
              shift.Get_Facility__c=  Avail.Address_Type__c !='Facility'? true:false;
              shift.Participant_Address_checkbox__c=Avail.Address_Type__c =='Participant';
              AddShiftList.add(shift);
              
          }
        system.debug('AddShiftList' +AddShiftList);
        if(AddShiftList.size()>0){
           upsert AddShiftList;
            
            for (Add_Shift__c addShift: AddShiftList){
                ShiftwithStaff__c ss = new ShiftwithStaff__c();
                 if(AvailabilityShiftMap.containsKey(addShift.RefId__c)){ 
                 ss.Id=AvailabilityShiftMap.get(addShift.RefId__c).get('shiftWithStaffId');
                }
                ss.Shift_SCR__c=0;
                ss.Recurring_Date__c=addShift.Start_Date__c;
                ss.Add_Shift__c = addShift.Id;
                ss.Un_Assigned_Shift__c=true;
                ss.Staff__c = totalStaffList[0].Id;
                ss.Staff_Final_Hourly_Rate__c =0;
                ss.Attendence__c = false;
                ss.RefId__c = addShift.RefId__c;
                ShiftWithStaffList.add(ss);
                
            }
            
            if(ShiftWithStaffList.size()>0){
                upsert ShiftWithStaffList;
              for (ShiftwithStaff__c shiftStaff : ShiftWithStaffList) {
                
               Services_and_Support_Plan__c service = new Services_and_Support_Plan__c();
                  Availability__c avail = AvaliablityMap.get(shiftStaff.RefId__c);
                   if(AvailabilityShiftMap.containsKey(Avail.Id)){ 
                      service.Id=AvailabilityShiftMap.get(Avail.Id).get('ServiceId');
                   }else{
                    service.Client__c=avail.Participant__c;
                   }

                  service.Funds_Tracker__c = avail.Funds_Tracker__c;
                  service.Service_Users__c = shiftStaff.Staff__c;
                  service.Status__c = 'Not Yet Invoiced';
                  service.Date_of_Service__c = avail.Start_Date__c;
                  service.State__c = avail.State__c;
                  service.Start_Time_24_Format__c = avail.Start_Time__c;
                  service.End_Time_24_Format__c = avail.End_Time__c;
                  service.Service_Type__c = avail.NDIS_Support_Catalogue__c;
                 
                  Decimal duration = AddShiftHandler.getDuartion(avail.Start_Time__c, avail.End_Time__c,avail.Start_Date__c,  Avail.End_Date__c !=null?  Avail.End_Date__c :Avail.Start_Date__c);
                  service.Qty__c = duration;
                  service.Un_Assigned_Service__c=true;
                  service.ShiftwithStaff__c = shiftStaff.Id;
                  service.Services__c=avail.Funds_Tracker__c;
                  
                  // Add to list
                  serviceList.add(service);
              }
                if(serviceList.size()>0){
                   upsert serviceList;
                }
        
            } 
                        
        }
        }
    
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