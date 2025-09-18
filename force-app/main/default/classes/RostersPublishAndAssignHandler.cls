public with sharing class RostersPublishAndAssignHandler {
    @AuraEnabled
    public static Map<String, Object> rosterPublish(string addshiftData,string startdate, string enddate,list<string>facilityVal, List<Id> selectedStaffIds){
        system.debug('selectedStaffIds >>'+ selectedStaffIds);
        Map<String, Object> response = new Map<String, Object>();
        try {
            List<Add_Shift__c> addShiftList = new List<Add_Shift__c>();
            RosterCreation.addShiftWrapper addShift = (RosterCreation.addShiftWrapper) System.JSON.deserialize(addshiftData, RosterCreation.addShiftWrapper.class);
            RosterAddShiftService.RosterServiceHandler rsh = new RosterAddShiftService.RosterServiceHandler();
            rsh.SplitShift=false;
            Add_Shift__c shift = RosterCreation.createShift(addShift,rsh,false);
            shift.Quantity__c=addShift.shiftDetails.AddShiftQuantity;
            shift.Public_holiday__c=addShift.shiftDetails.AddShiftHoliday;
            shift.Service_Details__c = addShift.shiftDetails.selectedServiceInfoJson;
            shift.EOI_Staff__c = selectedStaffIds != null && !selectedStaffIds.isEmpty() ? String.join(selectedStaffIds, ',') : null;
            shift.Id= addShift.shiftDetails.AddShiftId;
            addShiftList.add(shift);
            if (!addShiftList.isEmpty()) {
                if(addShift.shiftDetails.AddShiftId ==null){
                     insert addShiftList;
                }else{
                    update addShiftList;
                }
                response.put('isSuccess', true);
                response.put('shift message', 'Shifts created successfully.');
                response.put('shiftid', addShiftList[0].Id);
                string role='All';
                string staffList=getStaffHourlyRates(addShiftList,startdate,enddate,facilityVal);
                response.put('staffHourlyRates', staffList);
            }
            
        } catch (Exception e) {
            // Set failure response
            response.put('isSuccess', false);
            response.put('message', 'Failed to create shifts: ' + e.getMessage());
            System.debug('Error: ' + e.getMessage());
        }
        
        // Return response as JSON
        return response;
    }
 @AuraEnabled 
 public static string  getStaffHourlyRates(List<Add_Shift__c> addShiftList,string startdate, string enddate,list<string>facilityVal) {
        list<string> fac=facilityVal;
     	system.debug('fac ' +fac);
        List<StaffWrapper> finalStaffList = new List<StaffWrapper>();
    
        try {
            // Debugging input list
            System.debug('addShiftList: ' + addShiftList);
        List<Staff__c> stafflist = new List<Staff__c>();
            string Role;
               Role= addShiftList[0].Role__c;
            try {
                if (addShiftList[0].Is_EOI__c == true) {
                    stafflist = AddShiftController.getEOIStaff(Role,String.valueOf(addShiftList[0].Id));
                } else {
                    stafflist = AddShiftController.getAvailableStaff(Role,addShiftList[0].Start_Date__c,addShiftList[0].Start_Time__c,addShiftList[0].End_Time__c);
                }
            } catch (Exception e) {
                System.debug('Error fetching staff list: ' + e.getMessage());
                return e.getMessage();
            }
            Set<Id> staffIds = new Set<Id>();
            for (Staff__c ss : stafflist) {
                     staffIds.add(ss.Id);               
            }
            Date sDate = Date.valueOf(startdate);
            Date eDate = Date.valueOf(enddate);
            list<ShiftwithStaff__c> staffOneWeekShifts=[select id,Staff__r.Email_Address__c,Staff__r.Name__c,Facility__c,Add_Shift__r.Start_Date__c ,Actual_Duration__c,End_Date__c,
                Shift_Type__c,Attendence__c,Staff__c,Date__c,Shift_Wage__c,
                Staff__r.Set_Hours__c,Duration__c
                from ShiftwithStaff__c where Add_Shift__r.Start_Date__c >=:sDate AND Add_Shift__r.Start_Date__c <=:eDate and Staff__c in:staffIds];
            SYSTEM.DEBUG('staffIds'+staffIds);
            map<id,decimal> staffHours= new map<id,decimal>();
                for (ShiftWithStaff__c shift : staffOneWeekShifts) {
                    if (!staffHours.containsKey(shift.Staff__c)) {
                        staffHours.put(shift.Staff__c,0);
                    }
                    staffHours.put(shift.Staff__c, staffHours.get(shift.Staff__c) +(shift.Duration__c != null ? shift.Duration__c : 0));
     
                }
             List<ShiftwithStaff__c> allPreviousShifts =new  List<ShiftwithStaff__c>();
            // Fetch all previous shifts in one query and store them in a map
            Map<Id, List<ShiftwithStaff__c>> staffShiftMap = new Map<Id, List<ShiftwithStaff__c>>();
            if (!staffIds.isEmpty()) {
               allPreviousShifts = [SELECT Id, Staff__c, Duration__c, Log_Out_Date_Time__c, Add_Shift__r.End_Date__c
                     FROM ShiftwithStaff__c
                     WHERE Staff__c IN :staffIds 
                     AND Add_Shift__c != :addShiftList[0].Id
                     AND (Date__c = :addShiftList[0].Start_Date__c 
                          OR Date__c = :addShiftList[0].Start_Date__c - 1)
                     ORDER BY CreatedDate DESC];                
                 system.debug(' previous shifts '+allPreviousShifts);
                
                // Group shifts by Staff ID
                for (ShiftwithStaff__c shift : allPreviousShifts) {
                    if (!staffShiftMap.containsKey(shift.Staff__c)) {
                        staffShiftMap.put(shift.Staff__c, new List<ShiftwithStaff__c>());
                    }
                    staffShiftMap.get(shift.Staff__c).add(shift);
                }
            }
    			Integer serialNumber = 1;
            for (Staff__c ss : stafflist) {
                try {
                    //system.debug(' fcaility contains '+facilityVal.contains(string.valueof(ss.Facility__c)));
                  if(facilityVal.contains(string.valueof(ss.Facility__c))){
                            StaffWrapper staff = new StaffWrapper();
                    List<ShiftwithStaff__c> shiftwithstaff = new List<ShiftwithStaff__c>();
                     List<AddShiftController.ShiftWithStaffWrapper> Eoishiftwithstaff = new List<AddShiftController.ShiftWithStaffWrapper>();
    
                    // Assigning basic staff details with null checks
                    staff.Id = ss.Id;
                    staff.serialNumber = serialNumber; 
                    serialNumber++; // Increment serial number
                   // staff.fullName = (ss.Name != null ? ss.Name : '') + ' ' + (ss.Last_Name__c != null ? ss.Last_Name__c : '');
                     staff.fullName =ss.Display_Nickname__c;
                    staff.duration = (addShiftList[0].Duration__c != null) ? 
                                      addShiftList[0].Duration__c : 0;
                    staff.facilityname = (ss.Facility_Name__c != null) ? 
                                         ss.Facility_Name__c : 'Unknown';
                    staff.status = (ss.Status__c != null) ? ss.Status__c : false;
                    staff.activeOrInactive = (ss.Active_or_Non_Active__c != null) ? 
                                             ss.Active_or_Non_Active__c : 'Inactive';
                    staff.role=ss.Role__c !=null ?ss.Role__c :'';
                    staff.ClassAndLevel=ss.Class_and_Paypont__c ;
                    staff.scr=ss.SCR__c != null ? ss.SCR__c.setScale(2, RoundingMode.HALF_UP) : 0.0.setScale(2, RoundingMode.HALF_UP);
     				staff.isDisable = (ss.Status__c == null ||ss.Status__c == false) ? true : false;
                    staff.setHoursIndicator= staffHours.get(ss.id) >ss.Set_Hours__c ?true:false;
                    staff.assignedHours=staffHours.get(ss.id) >0?staffHours.get(ss.id) :0;
                    // Determine hourly rate using switch statement for Day_Name__c
                        // Retrieve previous shifts from the pre-fetched map
                    Decimal totalHours = 0;
                    time lastLogouttime;
                    if (staffShiftMap.containsKey(ss.Id)) {
    
                        if (staffShiftMap.containsKey(ss.Id) && !staffShiftMap.get(ss.Id).isEmpty()) {
                            List<ShiftwithStaff__c> staffShifts = staffShiftMap.get(ss.Id);
                            
                            // Get the most recent shift for this staff
                            ShiftwithStaff__c lastShift = staffShifts[0]; // Since they are ordered by CreatedDate DESC
                            
                            if (lastShift.Log_Out_Date_Time__c != null) {
                                Date shiftDate = addShiftList[0].Start_Date__c;
                                DateTime newShiftStartDateTime = DateTime.newInstanceGmt(shiftDate, addShiftList[0].Start_Time__c);
                                DateTime prevShiftLogInDatetime = DateTime.newInstanceGmt(lastShift.Add_Shift__r.End_Date__c, lastShift.Log_Out_Date_Time__c);
                                
                                Decimal timeDifferenceInMillis = Decimal.valueOf(newShiftStartDateTime.getTime() - prevShiftLogInDatetime.getTime());
                                Decimal timeDifferenceInHours = timeDifferenceInMillis / (1000 * 60 * 60); // Convert to hours
                                
                                staff.twoShiftsDurationinHours = timeDifferenceInHours;
                                
                                if (timeDifferenceInHours < 0) {
                                    System.debug('Negative time difference detected! No fatigue.');
                                    staff.exceedsLimit = false;
                                } else if (timeDifferenceInHours <= 8) {
                                    staff.exceedsLimit = true;
                                }
                            }
                        }
                    }
                    if (addShiftList[0].Public_holiday__c) { 
                        // Apply Holiday Rate
                        staff.Hourlyrate = (ss.Public_holiday_Hourly_Rate__c != null) ? ss.Public_holiday_Hourly_Rate__c : 0; 
                    } else {
                        switch on addShiftList[0].Day_Name__c { 
                            when 'Saturday' {
                                staff.Hourlyrate = (ss.Saturday_Hourly_Rate__c != null) ? 
                                                   ss.Saturday_Hourly_Rate__c : 0;
                            }
                            when 'Sunday' {
                                staff.Hourlyrate = (ss.Sunday_Hourly_Rate__c != null) ? 
                                                   ss.Sunday_Hourly_Rate__c : 0;
                            }
                            when else {
                                // Determine hourly rate using switch statement for Shift_Type__c
                                switch on addShiftList[0].Shift_Type__c {
                                    when 'General', 'Morning', 'Custom' {
                                        staff.Hourlyrate = (ss.Working_Hours_Rate__c != null) ? 
                                                           ss.Working_Hours_Rate__c : 0;
                                    }
                                    when 'Afternoon' {
                                        staff.Hourlyrate = (ss.Afternoon_shift_Hourly_Rate__c != null) ? 
                                                           ss.Afternoon_shift_Hourly_Rate__c : 0;
                                    }
                                    when 'Night' {
                                        staff.Hourlyrate = (ss.Night_shift_Hourly_Rate__c != null) ? 
                                                           ss.Night_shift_Hourly_Rate__c : 0;
                                    }
                                    when 'Sleepover Shift' {
                                        staff.Hourlyrate = (ss.Sleepover_Allowance__c != null) ? 
                                                           ss.Sleepover_Allowance__c : 0;
                                    }
                                    when else {
                                        staff.Hourlyrate = (ss.Working_Hours_Rate__c != null) ? 
                                                           ss.Working_Hours_Rate__c : 0;
                                    }
                                }
                            }
                        }
                    }
    
                    // Calculate shift wage
                    staff.shiftWage = addShiftList[0].Shift_Type__c !='Sleepover Shift' ? staff.duration * staff.Hourlyrate : staff.Hourlyrate;
     				staff.duration=staff.duration ;
                    staff.shiftId=addShiftList[0].Id;
                    staff.shiftDate=addShiftList[0].Start_Date__c;
                    staff.quantity=addShiftList[0].Quantity__c;
                    if(ss.ShiftwithStaffs__r.size()>0){
                        for(ShiftwithStaff__c shiftstaff:ss.ShiftwithStaffs__r){
                            AddShiftController.ShiftWithStaffWrapper shift =new   AddShiftController.ShiftWithStaffWrapper();
                            shift.staffId=shiftstaff.Staff__c;
                            shift.id=shiftstaff.Id;
                            Eoishiftwithstaff.add(shift);
                        }  
                    }
                       
                    
                     staff.shiftwithstaff = Eoishiftwithstaff;
                    // Add staff to final list
                    finalStaffList.add(staff);
                     //  System.debug('Staff list: ' + finalStaffList);
                    }
                
                } catch (Exception e) {
                    System.debug('Error processing staff record: ' + ss.Id + ', Error: ' + e.getMessage());
                }
            }
        } catch (Exception e) {
            System.debug('Unexpected error: ' + e.getMessage());
        }
    		System.debug('Staff list: ' + finalStaffList);
        return JSON.serialize(finalStaffList);
    }
 
    
   
    
    public class StaffWrapper {
    public integer serialNumber=0;
    public String Id ;
    public String fullName ;
    public decimal Hourlyrate;
    public String activeOrInactive ;
    public Boolean status ;
    public String facilityname ;
   	public decimal duration;
    public decimal shiftWage;
    public Decimal scr=0;
    public string className='';
    public string role;
    public boolean isDisable;
    public boolean isAllocate=false;
    public string shiftId;
    public date shiftDate;
    public decimal quantity;
    public string  ClassAndLevel;
   	public boolean exceedsLimit;
    public decimal assignedHours; 
    public boolean setHoursIndicator=false;
    public decimal twoShiftsDurationinHours;
    public List<AddShiftController.ShiftWithStaffWrapper> shiftwithstaff;
}

}