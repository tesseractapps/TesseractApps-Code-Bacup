public class RosterCreationVersionTwo {
    public class ServiceWrapper {
        @AuraEnabled public String participantId;
        @AuraEnabled public String serviceType;
        @AuraEnabled public String serviceItem;
        @AuraEnabled public Decimal unitPrice;
        @AuraEnabled public Decimal billableHours;
        @AuraEnabled public Decimal amount;
        @AuraEnabled public Decimal hourlyRate;
        @AuraEnabled public String serviceItemValue;
        @AuraEnabled public String state;
        @AuraEnabled public String serviceItemName;
        @AuraEnabled public String serviceId;
        @AuraEnabled public string customshiftRefId;
        @AuraEnabled public string starttime;
        @AuraEnabled public string endtime;
    }

    public class AddressWrapper {
        @AuraEnabled public String street;
        @AuraEnabled public String citySuburb;
        @AuraEnabled public String country;
        @AuraEnabled public String provinceState;
        @AuraEnabled public String postalcode;
        @AuraEnabled public Decimal latitude;
        @AuraEnabled public Decimal longitude;
    }

    public class ShiftDetailsWrapper {
        @AuraEnabled public String AddShiftStartDate;
        @AuraEnabled public String AddShiftStaffValue;
        @AuraEnabled public String AddShiftFacilityValue;
        @AuraEnabled public String AddShiftRole;
        @AuraEnabled public String AddShiftType;
        @AuraEnabled public Integer AddShiftBreak;
        @AuraEnabled public Decimal AddShiftDuration;
        @AuraEnabled public String AddShiftStartTime;
        @AuraEnabled public String AddShiftStartTimeAMPM;
        @AuraEnabled public String AddShiftEndTime;
        @AuraEnabled public String AddShiftEndTimeAMPM;
        @AuraEnabled public Boolean AddShiftnotification;
        @AuraEnabled public Decimal AddShiftStaffHourlyRate;
        @AuraEnabled public Integer AddShiftQuantity;
        @AuraEnabled public String AddShiftNotes;
        @AuraEnabled public Boolean AddShiftEOI;
        @AuraEnabled public String AddShiftId;
        @AuraEnabled public Boolean AddShiftHoliday;
        @AuraEnabled public Boolean AddShiftEnterOtherLocation;
        @AuraEnabled public Boolean AddShiftParticipantAddressCheckbox;
        @AuraEnabled public String AddShiftEndDate;
        @AuraEnabled public String AddShiftTypeName;
        @AuraEnabled public String AddShiftStaffName;
        @AuraEnabled public String AddShiftFacilityName;
        @AuraEnabled public String AddShiftStatus ;
        // Add other fields as needed
    }

    public class StaffWrapper {
        @AuraEnabled public String staffId;
        @AuraEnabled public String staffLabel;
        @AuraEnabled public String participantId;
        @AuraEnabled public String participantLabel;
        @AuraEnabled public String role;
        @AuraEnabled public String shifttype;
        @AuraEnabled public String shiftnotes;
        @AuraEnabled public String starttime;
        @AuraEnabled public String starttimeAmPm;
        @AuraEnabled public String endtime;
        @AuraEnabled public String endtimeAmPm;
        @AuraEnabled public String startdate; // changed to String for parsing
        @AuraEnabled public String enddate;   // changed to String for parsing
        @AuraEnabled public Decimal hourlyrate;
        @AuraEnabled public String refId;
        @AuraEnabled public AddressWrapper address;
        @AuraEnabled public List<ServiceWrapper> services;
        @AuraEnabled public string shiftWithStaffId;
        @AuraEnabled public List<checkListWrapper> checkList;
        @AuraEnabled public Decimal duration;
        @AuraEnabled Public string addressSource;
        @AuraEnabled Public string unassignedRefId;
        @AuraEnabled Public boolean unassignedStatus;
        @AuraEnabled public string shiftnames;
        @AuraEnabled public string splitShiftRefId;
        @AuraEnabled public boolean staffPaidbreak;
        @AuraEnabled public decimal breakTime;
        @AuraEnabled public boolean enableTimeRounding;
        @AuraEnabled public boolean recurring;
        @AuraEnabled public boolean splitShifts;
    }

    public class AddShiftWrapper {
        @AuraEnabled public AddressWrapper shiftaddress;
        @AuraEnabled public ShiftDetailsWrapper shiftDetails;
        @AuraEnabled public String refId;
    }

    public class ShiftPayload {
        @AuraEnabled public AddShiftWrapper addShiftData;
        @AuraEnabled public List<StaffWrapper> staffRows;
        @AuraEnabled public Boolean isSplitShift;
        @AuraEnabled public Boolean isGroupShift;
        @AuraEnabled public Boolean isCustomShift;
        @AuraEnabled public boolean isRecurringShift;
        @AuraEnabled public boolean includeParticipants;
        @AuraEnabled public boolean  isEdit;
        @AuraEnabled public string LongShiftTimeSlots;
       
    }
    
    public class WeekDateRangeResult {
        @AuraEnabled public List<Date> originalWeekDates;
        @AuraEnabled public Date weekStart;
        @AuraEnabled public Date weekEnd;
        @AuraEnabled public Decimal totalDuration;
        @AuraEnabled public Decimal calculatedDuration;
       
    }
     public class checkListWrapper{
        public string description;
        public boolean mandatory;
        public string checkListId;
        public boolean isCreatedFromStatic;
        public string shiftWithStaffRefId;
    }
    public class StaffConflictWrapper {
        public String staffId;
        public String staffName;
        public List<ConflictDateWrapper> conflictDates;
    }
    
    public class ConflictDateWrapper {
        public String dateString;  // Changed from 'date'
        public String displayDate;
        public String reason;
    }
    
    @AuraEnabled
    public static String createShift(String jsonPayload, List<Date> recurrenceDates ,string staffDateConflictsJson) {
         if(recurrenceDates == null || recurrenceDates.isEmpty())
        throw new AuraHandledException('No recurrence dates provided.');

    ShiftPayload payload = (ShiftPayload) JSON.deserialize(jsonPayload, ShiftPayload.class);
  // Handle conflicts - with null/empty checks
    Map<String, Set<Date>> staffConflictDatesMap = new Map<String, Set<Date>>();
    
    if (String.isNotBlank(staffDateConflictsJson)) {
      
            List<StaffConflictWrapper> staffConflicts = (List<StaffConflictWrapper>) JSON.deserialize(staffDateConflictsJson,   List<StaffConflictWrapper>.class);
            
            if (staffConflicts != null && !staffConflicts.isEmpty()) {
                for (StaffConflictWrapper conflict : staffConflicts) {
                    if (conflict != null && String.isNotBlank(conflict.staffId) && conflict.conflictDates != null) {
                        Set<Date> conflictDates = new Set<Date>();
                        for (ConflictDateWrapper cd : conflict.conflictDates) {
                            if (cd != null && String.isNotBlank(cd.dateString)) {  // Changed to dateString
                                    conflictDates.add(Date.valueOf(cd.dateString));  // Changed to dateString
                                
                            }
                        }
                        staffConflictDatesMap.put(conflict.staffId, conflictDates);
                    }
                }
            }
          
    }

    // Rest of your method...

    AddShiftWrapper addShiftData = payload.addShiftData;
    List<StaffWrapper> staffRows = payload.staffRows;

    // Validate input
    if(staffRows == null || staffRows.isEmpty())
        throw new AuraHandledException('No staff provided.');

        Boolean isRecurring = payload.isRecurringShift;
        Boolean includeParticipants = payload.includeParticipants;
        Boolean isEdit = payload.isEdit; // new flag from payload
        
        Integer recurIndex = 0;
        
        List<Add_Shift__c> addShiftRecords = new List<Add_Shift__c>();
        Map<Date, Add_Shift__c> dateToAddShiftMap = new Map<Date, Add_Shift__c>();
        Map<Date,Integer> dateToAddShiftQuantity = new Map<Date,Integer>();

        for (Date recurDate : recurrenceDates) {
            Add_Shift__c addShift;
            
            // 🟢 NON-RECURRING CASE
            if (!isRecurring) {
                if (isEdit) {
                    // Editing: do not touch parent, only children later
                    addShift = new Add_Shift__c(Id = addShiftData.shiftDetails.AddShiftId);
                  //  addShift.Split_Shifts__c = payload.isSplitShift;
                    if(addShiftData.shiftDetails.AddShiftStatus =='Unassigned' )
                    addShift.Un_Assigned_Shift__c=false;
                    
                } else {
                    // Creating new parent
                    addShift = buildAddShiftRecord(addShiftData.shiftDetails, addShiftData.shiftaddress, addShiftData.refId,payload,recurDate,staffRows);
                    addShiftRecords.add(addShift);
                }
            }else {
                if (isEdit ==true && recurIndex == 0) {
                    // First day of recurring: always skip parent
                    addShift = new Add_Shift__c(Id = addShiftData.shiftDetails.AddShiftId);
                } else {
                    // Subsequent days
                    addShift = buildAddShiftRecord(addShiftData.shiftDetails, addShiftData.shiftaddress, addShiftData.refId,payload,recurDate,staffRows);
                        addShiftRecords.add(addShift);
                        
                        dateToAddShiftMap.put(recurDate, addShift);
                        recurIndex++;
                }
            }
            
            dateToAddShiftMap.put(recurDate, addShift);
            recurIndex++;
        }
        if(addShiftRecords.size()>0){
            insert  addShiftRecords;
        }
        
		
    // Reindex with inserted Ids
    for(Add_Shift__c a : addShiftRecords) {
        dateToAddShiftMap.put(a.Start_Date__c, a);
    }

    // Obtain unique staff Ids
    Set<Id> staffIds = new Set<Id>();
    for(StaffWrapper staff : staffRows){
        if(!String.isBlank(staff.staffId))
            staffIds.add(Id.valueOf(staff.staffId));
    }

   /* Map<Id, List<WeekDateRangeResult>> allowedDatesPerStaff = processMultipleStaffDates(
        new List<Id>(staffIds), recurrenceDates, addShiftData.shiftDetails.AddShiftStartTime, addShiftData.shiftDetails.AddShiftEndTime, 'Yes', isEdit
    );
     system.debug('allowedDatesPerStaff ' +allowedDatesPerStaff);
    
 
    Map<String, Set<Date>> staffAllowedDatesMap = new Map<String, Set<Date>>();
    for(StaffWrapper staff : staffRows){
        Set<Date> allowedDates = new Set<Date>();
        if(allowedDatesPerStaff.containsKey(Id.valueOf(staff.staffId))){
            for(WeekDateRangeResult wd : allowedDatesPerStaff.get(Id.valueOf(staff.staffId))){
                if(wd.originalWeekDates != null)
                    allowedDates.addAll(wd.originalWeekDates);
            }
        }
        staffAllowedDatesMap.put(staff.staffId, allowedDates);
    } */

        List<ShiftWithStaff__c> shiftStaffRecords = new List<ShiftWithStaff__c>();
        // List<Services_and_Support_Plan__c> servicesRecords = new List<Services_and_Support_Plan__c>();
        
        // NEW: Use maps for proper service-shift mapping
        Map<String, List<ServiceWrapper>> shiftRefToServicesMap = new Map<String, List<ServiceWrapper>>();
        Map<String, ShiftWithStaff__c> shiftRefToRecordIdMap = new Map<String, ShiftWithStaff__c>();
       
        Integer SplitRefIndex=0;
        
        
        string baseRefId = String.valueOf(DateTime.now().getTime());
        Integer childRecurIndex = 0;
        Map<String, List<checkListWrapper>> shiftRefToChecklistMap = new Map<String, List<checkListWrapper>>();
        Map<Id, Add_Shift_Checklist__c> checklistIdToRecord = new Map<Id, Add_Shift_Checklist__c>();
        List<Add_Shift_Checklist__c> newChecklists = new List<Add_Shift_Checklist__c>();
        list<string> UnassignedRefId= new list<string>();

// Iterate recurrence dates and all staff
        for (Date recurDate : recurrenceDates) {
            Add_Shift__c currentAddShift = dateToAddShiftMap.get(recurDate);
             Integer index = 0;
            for (Integer i = 0; i < staffRows.size(); i++) {
                StaffWrapper row = staffRows[i];
                if (row == null) continue;
                
                System.debug('Checking staff: ' + row.staffId + ' for date: ' + recurDate);
                
                Boolean hasConflict = staffConflictDatesMap.containsKey(row.staffId) && 
                    staffConflictDatesMap.get(row.staffId).contains(recurDate);
                
                if (hasConflict) {
                    System.debug('Skipping staff: ' + row.staffId + ' for date: ' + recurDate);
                    continue;
                }
                
                ShiftWithStaff__c sws = new ShiftWithStaff__c();
                
                // Use childRecurIndex for consistent child logic
                if (isEdit && childRecurIndex == 0 && row.shiftWithStaffId != null) {
                    // First day of recurring edit: UPSERT existing record
                    sws.Id = row.shiftWithStaffId;
                }
                if(row.shiftWithStaffId != null){
                    sws.Do_you_want_to_set_this_Recurring_Roster__c=row.recurring;
                  }else{
                        sws.Do_you_want_to_set_this_Recurring_Roster__c = payload.isRecurringShift;     
               }
                
                sws.Add_Shift__c = currentAddShift.Id;
                sws.Staff__c = row.staffId;
               sws.Role__c = row.role;
                sws.Shift_Category__c = row.shifttype;
                sws.SignIn_Notes__c = row.shiftnotes;
                sws.Staff_Final_Hourly_Rate__c = row.hourlyrate;
                
               
                sws.Attendence__c = true;
              //  sws.Start_Date__c = recurDate;
                sws.Type_of_Address__c= row.addressSource;
                
                sws.Shift_Start_Time__c=RosterCreation.convertToTime(row.starttime);
                sws.Shift_End_Time__c=RosterCreation.convertToTime(row.endtime);
                sws.Group_Shifts__c = payload.isGroupShift;
                system.debug('splitShiftRefId ==>' +row.splitShiftRefId);
                sws.Split_Shift_RefId__c= row.splitShifts ==true ? row.splitShiftRefId :null;
                sws.New_Split_Shift__c=row.splitShifts==true?true:false;
             
              
                sws.Shift_Address__Street__s=row.address.street;
                sws.Shift_Address__City__s=row.address.citySuburb;
                sws.Shift_Address__StateCode__s=row.address.provinceState;
                sws.Shift_Address__PostalCode__s=row.address.postalcode;
                sws.Shift_Address__CountryCode__s='AU';
                sws.Shift_Address__Latitude__s=row.address.latitude;
                sws.Shift_Address__Longitude__s=row.address.longitude;
                sws.Staff_Paid_Break__c =row.staffPaidbreak != null ? row.staffPaidbreak: false ;
                sws.Shift_Calculated_Duration__c=row.duration;
                sws.Shift_Break__c=row.breakTime==30 ?0.5 :0;
                sws.Shift_Name__c= row.shiftnames;
                sws.Time_Rounded_Off__c=row.enableTimeRounding;
              
                if(row.unassignedStatus !=null && row.unassignedStatus ==true){
                    sws.Un_Assigned_Shift__c=false;
                    sws.Status__c='Accepted';
                    UnassignedRefId.add(row.UnassignedRefId);
                }
                
                sws.Index__c=index;
                
                if (!String.isBlank(row.starttime)) {
                    sws.Shift_Start_Time__c = RosterCreation.convertToTime(row.starttime);
                }
                if (!String.isBlank(row.endtime)) {
                    sws.Shift_End_Time__c = RosterCreation.convertToTime(row.endtime);
                }
                Integer daysDifference = date.valueof(row.startdate).daysBetween(recurDate);
                if (daysDifference < 0) {
                    daysDifference = 0;
                }
                sws.Start_Date__c = date.valueOf(row.startdate).addDays(daysDifference);
                System.debug('Start Date set to: ' + sws.Start_Date__c);
                
                // Determine shift end date logic
                Date shiftEndDate;
                
                System.debug('Shift Type: ' + row.shifttype);
                  System.debug('endtimeAmPm: ' + row.endtimeAmPm);
                  System.debug('starttimeAmPm: ' + row.starttimeAmPm);
                if (row.shifttype == 'Night' || row.shifttype == 'Sleepover Shift' || row.shifttype == 'Custom') {
                    List<String> timeSplit = row.endtimeAmPm.toLowerCase().split(' ');
                    List<String> startTimeSplits = row.starttimeAmPm.split(' ');
                    
                    System.debug('End Time Split: ' + timeSplit);
                    System.debug('Start Time Split: ' + startTimeSplits);
                    
                    if (timeSplit[1] == 'am' && (startTimeSplits[1] != 'am' || row.shifttype == 'Custom')) {
                        shiftEndDate = sws.Start_Date__c.addDays(1);
                        System.debug('Shift ends next day due to AM/PM logic or Custom type');
                    } else {
                        shiftEndDate = sws.Start_Date__c;
                        System.debug('Shift ends same day');
                    }
                    
                    if (timeSplit[1] == 'pm' && row.shifttype == 'Custom') {
                        Integer startTotalMinutes = sws.Shift_Start_Time__c.hour() * 60 + sws.Shift_Start_Time__c.minute();
                        Integer endTotalMinutes = sws.Shift_End_Time__c.hour() * 60 + sws.Shift_End_Time__c.minute();
                        
                        System.debug('Start Total Minutes: ' + startTotalMinutes);
                        System.debug('End Total Minutes: ' + endTotalMinutes);
                        
                        if (startTotalMinutes > endTotalMinutes) {
                            shiftEndDate = sws.Start_Date__c.addDays(1);
                            System.debug('Shift ends next day due to Custom PM logic');
                        }
                    }
                } else {
                    shiftEndDate = sws.Start_Date__c;
                    System.debug('Shift type is not overnight, ends same day');
                }
                
                sws.Shift_End_Date__c = shiftEndDate;
                System.debug('Final Shift End Date set to: ' + sws.Shift_End_Date__c);
                DateTime dt = DateTime.newInstance(sws.Start_Date__c, Time.newInstance(0, 0, 0, 0));
                sws.Shift_Day_Name__c = dt.format('EEEE');
                
                
                
                // Create unique reference IDs
                String uniqueRefId;
                String shiftServiceRefId ;
                  uniqueRefId = row.staffId + '_' + baseRefId;
                if (payload.isSplitShift) {
                   // uniqueRefId = baseRefId + '_' + SplitRefIndex;
                    shiftServiceRefId  = row.staffId + '_' + String.valueOf(sws.Start_Date__c) + '_' + baseRefId+'_'+SplitRefIndex ;
                } else {
                  //
                    shiftServiceRefId = row.staffId + '_' + String.valueOf(sws.Start_Date__c) + '_' + baseRefId;
                }
                
                // Use the new field for service-shift mapping
                
                sws.Shift_To_Service_Ref_Id__c = shiftServiceRefId;
                sws.RefId__c = uniqueRefId;
               // if (addShiftData.shiftDetails.AddShiftType == 'Custom') {
                    sws = getLongShifts(payload.LongShiftTimeSlots, sws);
               // }
                
                
                // Ensure list exists
                if (!shiftRefToServicesMap.containsKey(shiftServiceRefId)) {
                    shiftRefToServicesMap.put(shiftServiceRefId, new List<ServiceWrapper>());
                }
                
                
                
                if (row.checkList != null && !row.checkList.isEmpty()) {
                    for (checkListWrapper item : row.checkList) {
                        if (!shiftRefToChecklistMap.containsKey(shiftServiceRefId)) {
                            shiftRefToChecklistMap.put(shiftServiceRefId, new List<checkListWrapper>());
                        }
                        shiftRefToChecklistMap.get(shiftServiceRefId).add(item);
                    }
                }
                
                
                if (row.services != null && row.services.size() > 0) {
                    for (Integer j = 0; j < row.services.size(); j++) {
                        ServiceWrapper originalSvc = row.services[j];
                        
                        Boolean shouldInclude = false;
                        String logPrefix = 'Service [' + j + '] - ';
                        
                        
                        if (!isRecurring) {
                            // Non-recurring: include only if participant exists
                            shouldInclude = !String.isBlank(originalSvc.participantId);
                            System.debug(logPrefix + 'Non-recurring shift. ParticipantId: ' + originalSvc.participantId + 
                                         ' | shouldInclude: ' + shouldInclude);
                        } else {
                            if (!isEdit) {
                                // 🔁 RECURRING CREATION: Include if participantId exists
                                // Create parent based on staffRows, and create child services linked to respective parent
                                shouldInclude = !String.isBlank(originalSvc.participantId);
                                System.debug(logPrefix + 'Recurring Creation. ParticipantId: ' + originalSvc.participantId + 
                                             ' | shouldInclude: ' + shouldInclude);
                            } else {
                                // 🔁 RECURRING EDIT
                                if (childRecurIndex == 0) {
                                    // First index: Always upsert (both parent and child records)
                                    shouldInclude = !String.isBlank(originalSvc.participantId);
                                    System.debug(logPrefix + 'Recurring Edit - First occurrence. ParticipantId: ' + originalSvc.participantId + 
                                                 ' | shouldInclude: ' + shouldInclude);
                                } else {
                                    // Subsequent indices
                                    if (!includeParticipants) {
                                        // 🔹 includeParticipants = false: Insert parent only (skip services)
                                        shouldInclude = false;
                                        System.debug(logPrefix + 'Recurring Edit - Subsequent occurrence. IncludeParticipants=false - Skipping service.');
                                    } else {
                                        // 🔹 includeParticipants = true: Upsert both parent and services
                                        shouldInclude = !String.isBlank(originalSvc.participantId);
                                        System.debug(logPrefix + 'Recurring Edit - Subsequent occurrence. IncludeParticipants=true. ParticipantId: ' + 
                                                     originalSvc.participantId + ' | shouldInclude: ' + shouldInclude);
                                    }
                                }
                            }
                        }
                        
                        if (!shouldInclude) {
                            System.debug(logPrefix + 'Skipping service. Not eligible for inclusion.');
                            continue;
                        }
                        // Clone the service wrapper
                        ServiceWrapper clonedSvc = new ServiceWrapper();
                        clonedSvc.participantId = originalSvc.participantId;
                        clonedSvc.serviceType = originalSvc.serviceType;
                        clonedSvc.serviceItem = originalSvc.serviceItem;
                        clonedSvc.unitPrice = originalSvc.unitPrice;
                        clonedSvc.billableHours = originalSvc.billableHours;
                        clonedSvc.amount = originalSvc.amount;
                        clonedSvc.hourlyRate = originalSvc.hourlyRate;
                        clonedSvc.serviceItemName = originalSvc.serviceItemName;
                        if (isRecurring && isEdit && childRecurIndex == 0) {
                            // First recurrence date: Include serviceId for upsert
                            clonedSvc.serviceId = originalSvc.serviceId;
                            System.debug(logPrefix + 'Including serviceId for first recurrence: ' + originalSvc.serviceId);
                        } else if (isRecurring && isEdit && childRecurIndex > 0) {
                            // Subsequent recurrence dates: Skip serviceId (will create new records)
                            clonedSvc.serviceId = null;
                            System.debug(logPrefix + 'Skipping serviceId for subsequent recurrence. Original serviceId: ' + originalSvc.serviceId);
                        } else {
                            // Non-recurring or recurring creation: Use original logic
                            clonedSvc.serviceId = originalSvc.serviceId;
                        }
                        clonedSvc.state = originalSvc.state;
                        clonedSvc.customshiftRefId=originalSvc.customshiftRefId;
                        if(originalSvc.customshiftRefId != null){
                            clonedSvc.startTime=originalSvc.startTime;
                            clonedSvc.endTime=originalSvc.endTime;
                        }
                        
                        shiftRefToServicesMap.get(shiftServiceRefId).add(clonedSvc);
                        // System.debug(logPrefix + 'Included service: ' +
                        //       'ParticipantId: ' + clonedSvc.participantId + ', ' +
                        //     'ServiceType: ' + clonedSvc.serviceType + ', ' +
                        //     'ServiceItem: ' + clonedSvc.serviceItem + ', ' +
                        //     'ServiceId: ' + clonedSvc.serviceId + ', ' +
                        //     'customshiftRefId: ' + clonedSvc.customshiftRefId  );
                    }
                }
                
                // Add the shift record
                shiftStaffRecords.add(sws);
                System.debug('Shift record added to shiftStaffRecords. Total count now: ' + shiftStaffRecords.size());
                
                
                // Increment quantity for this date
                Integer prevCount = 0;
                if (dateToAddShiftQuantity.containsKey(recurDate)) prevCount = dateToAddShiftQuantity.get(recurDate);
                dateToAddShiftQuantity.put(recurDate, prevCount + 1);
                
                index++;
                SplitRefIndex++;
            } // end staff loop
            childRecurIndex++; // Increment after processing all staff for this date
        } // end recurDate loop
        
        // Update parent shift quantities
        list<Add_Shift__C> UpdateQuanity = new list<Add_Shift__C>();
        Set<Id> parentShiftIds = new Set<Id>();
        Map<Id, Integer> existingChildrenCountMap = new Map<Id, Integer>();
        
        // Collect parent shift IDs that need quantity updates during edit
        if (isEdit) {
            for(Date dd : dateToAddShiftQuantity.keySet()) {
                Add_Shift__C adshift = dateToAddShiftMap.get(dd);
                if (adshift.Id != null) {
                    parentShiftIds.add(adshift.Id);
                }
            }
        }
        
        // Bulk query existing children counts outside the loop
       System.debug('=== STARTING SHIFT QUANTITY UPDATE PROCESS ===');

        if (!parentShiftIds.isEmpty()) {
            List<AggregateResult> existingCounts = [
                SELECT Add_Shift__c parentId, COUNT(Id) childCount 
                FROM ShiftWithStaff__c 
                WHERE Add_Shift__c IN :parentShiftIds 
                GROUP BY Add_Shift__c
            ];
            
            for (AggregateResult ar : existingCounts) {
                Id parentId = (Id)ar.get('parentId');
                Integer count = (Integer)ar.get('childCount');
                existingChildrenCountMap.put(parentId, count);
            }
        }
        
        // Now process quantity updates
        for(Date dd : dateToAddShiftQuantity.keySet()) {
            Add_Shift__C adshift = dateToAddShiftMap.get(dd);
            if (isEdit && adshift.Id != null) {
                // During edit: Use existing count + new children
                Integer existingCount = existingChildrenCountMap.containsKey(adshift.Id) ? existingChildrenCountMap.get(adshift.Id) : 0;
                Integer newChildrenForThisDate = 0;
                for (StaffWrapper staff : staffRows) {
                    if (staff.shiftWithStaffId == null) {
                        newChildrenForThisDate++;
                    }
                }
                adshift.Quantity__c = (existingCount + newChildrenForThisDate) == 0 ? 1 : (existingCount + newChildrenForThisDate);
                    } else {
                        // During create: Use the total count
                        adshift.Quantity__c = dateToAddShiftQuantity.get(dd);
                    }
            UpdateQuanity.add(adshift);
        }
        
        if (!UpdateQuanity.isEmpty()) {
            upsert UpdateQuanity;
        }
        
        // Upsert staff shift records
        upsert shiftStaffRecords;

// Create map of Shift_To_Service_Ref_Id__c to actual Shift record Id
    for (ShiftWithStaff__c shift : shiftStaffRecords) {
        shiftRefToRecordIdMap.put(shift.Shift_To_Service_Ref_Id__c, shift);
         system.debug(' shift.Shift_To_Service_Ref_Id__c  ==>' +shift.Shift_To_Service_Ref_Id__c);
    }
        if(!UnassignedRefId.isEmpty()){
             List<Availability__c> totalAvailabilityList = [
            SELECT Id, Assigned_Service_OR_Shift__c 
            FROM Availability__c 
            WHERE Id IN :UnassignedRefId];
             for (Availability__c av : totalAvailabilityList) {
            av.Assigned_Service_OR_Shift__c = true;
            }
            System.debug('totalAvailabilityList ' + totalAvailabilityList);
            if (!totalAvailabilityList.isEmpty()) update totalAvailabilityList;
        }
        
 
// Create services using the shift reference mapping
        Map<Id, Services_and_Support_Plan__c> serviceIdToRecord = new Map<Id, Services_and_Support_Plan__c>();
        List<Services_and_Support_Plan__c> newServices = new List<Services_and_Support_Plan__c>();
        
        if (shiftRefToServicesMap != null && !shiftRefToServicesMap.isEmpty()) {
            System.debug('🔧 Processing shiftRefToServicesMap. Total keys: ' + shiftRefToServicesMap.keySet().size());
            
            for (String shiftServiceRefId : shiftRefToServicesMap.keySet()) {
                System.debug('🔍 Processing shiftServiceRefId: ' + shiftServiceRefId);
                
                ShiftWithStaff__c shiftRecordId = shiftRefToRecordIdMap.get(shiftServiceRefId);
                
                if (shiftRecordId != null) {
                    System.debug('✅ Found shift record. Shift ID: ' + shiftRecordId.Id + ', Staff: ' + shiftRecordId.Staff__c + ', Date: ' + shiftRecordId.Start_Date__c);
                    
                    List<ServiceWrapper> servicesList = shiftRefToServicesMap.get(shiftServiceRefId);
                    System.debug('📋 Processing ' + servicesList.size() + ' services for shiftServiceRefId: ' + shiftServiceRefId);
                    
                    for (ServiceWrapper svc : servicesList) {
                        System.debug('🎯 Processing service. ParticipantId: ' + svc.participantId + ', ServiceId: ' + svc.serviceId + ', ServiceType: ' + svc.serviceType);
                        
                        if (String.isBlank(svc.participantId)) {
                            System.debug('⏭️ Skipping service - blank participantId');
                            continue;
                        }
                        
                        Services_and_Support_Plan__c service = new Services_and_Support_Plan__c();
                        if (svc.serviceId != null) {
                            service.Id = svc.serviceId;
                            System.debug('🔄 Updating existing service with ID: ' + svc.serviceId);
                        } else {
                            System.debug('🆕 Creating new service record');
                        }
                        
                        service.ShiftwithStaff__c = shiftRecordId.Id;
                        service.Client__c = svc.participantId;
                        service.Funds_Tracker__c = svc.serviceType;
                        service.Service_Users__c = shiftRecordId.Staff__c;
                        service.Date_of_Service__c = shiftRecordId.Start_Date__c;
                        
                        if(String.isNotEmpty(svc.customshiftRefId)) {
                            service.Start_Time_24_Format__c = RosterCreation.convertToTime(svc.starttime);
                            service.End_Time_24_Format__c = RosterCreation.convertToTime(svc.endtime);
                          //  System.debug('⏰ Using custom shift times. Start: ' + svc.starttime + ', End: ' + svc.endtime);
                        } else {
                            service.Start_Time_24_Format__c = shiftRecordId.Shift_Start_Time__c;
                            service.End_Time_24_Format__c = shiftRecordId.Shift_End_Time__c;
                          //  System.debug('⏰ Using shift times. Start: ' + shiftRecordId.Shift_Start_Time__c + ', End: ' + shiftRecordId.Shift_End_Time__c);
                        }
                        
                        service.Service_Type__c = svc.serviceItem;
                        service.Services__c = svc.serviceItemName;
                        service.State__c = svc.state;
                        service.Qty__c = svc.billableHours;
                        service.Status__c = 'Not Yet Invoiced';
                        service.Edited_Unit_Price__c = svc.unitPrice;
                        service.Custom_Shift_Reference_Id__c = svc.customshiftRefId;
                        service.Un_Assigned_Service__c=false;
                        
                        System.debug('📊 Service details - Type: ' + svc.serviceItem + ', Name: ' + svc.serviceItemName + ', State: ' + svc.state + ', Qty: ' + svc.billableHours + ', UnitPrice: ' + svc.unitPrice);
                        
                        if (service.Id != null) {
                            serviceIdToRecord.put(service.Id, service);
                            System.debug('💾 Added to serviceIdToRecord map with key: ' + service.Id);
                        } else {
                            newServices.add(service);
                            System.debug('💾 Added to newServices list. New services count: ' + newServices.size());
                        }
                    }
                } else {
                    System.debug('❌ No shift found for refId: ' + shiftServiceRefId);
                    System.debug('🔍 Available keys in shiftRefToRecordIdMap: ' + shiftRefToRecordIdMap.keySet());
                }
            }
            
            System.debug('✅ Completed processing shiftRefToServicesMap');
            System.debug('📊 Summary - serviceIdToRecord size: ' + serviceIdToRecord.size() + ', newServices size: ' + newServices.size());
        } else {
            System.debug('ℹ️ shiftRefToServicesMap is null or empty');
        }
        // Combine unique updates + inserts
        List<Services_and_Support_Plan__c> servicesRecords = new List<Services_and_Support_Plan__c>();
        servicesRecords.addAll(serviceIdToRecord.values());
        servicesRecords.addAll(newServices);
        
        System.debug('Total services to upsert: ' + servicesRecords.size());
        
        if (!servicesRecords.isEmpty()) {
            upsert servicesRecords;
        }
        
        if (shiftRefToChecklistMap != null && !shiftRefToChecklistMap.isEmpty()) {
            for (String shiftServiceRefId : shiftRefToChecklistMap.keySet()) {
                ShiftWithStaff__c shiftRecordId = shiftRefToRecordIdMap.get(shiftServiceRefId);
                
                if (shiftRecordId != null) {
                    for (checkListWrapper item : shiftRefToChecklistMap.get(shiftServiceRefId)) {
                        Add_Shift_Checklist__c checklist = new Add_Shift_Checklist__c();
                        
                        // Handle different scenarios
                        if (isEdit) {
                            if (isRecurring) {
                                // RECURRING EDIT: Only update first occurrence, create new for others
                                Boolean isFirstOccurrence = recurrenceDates.indexOf(shiftRecordId.Start_Date__c) == 0;
                                if (isFirstOccurrence && item.checkListId != null) {
                                    checklist.Id = item.checkListId; // Update existing
                                }
                                // Else: Create new (no ID set)
                            } else {
                                // NON-RECURRING EDIT: Update existing items
                                if (item.checkListId != null) {
                                    checklist.Id = item.checkListId; // Update existing
                                }
                                // Else: Create new (no ID set)
                            }
                        } else {
                            // CREATE scenario: Always create new
                            // No ID set, so it will be inserted
                        }
                        
                        checklist.Description__c = item.description;
                        checklist.Mandatory__c = item.mandatory;
                        checklist.Created_By_Static_Data__c = item.isCreatedFromStatic;
                        checklist.ShiftWithStaff__c = shiftRecordId.Id;
                        
                        if (checklist.Id != null) {
                            checklistIdToRecord.put(checklist.Id, checklist);
                        } else {
                            newChecklists.add(checklist);
                        }
                    }
                }
            }
        }
        // Combine unique updates + inserts for checklists
        List<Add_Shift_Checklist__c> checklistRecords = new List<Add_Shift_Checklist__c>();
        checklistRecords.addAll(checklistIdToRecord.values());
        checklistRecords.addAll(newChecklists);
        
        System.debug('Total checklists to upsert: ' + checklistRecords.size());
        
        if (!checklistRecords.isEmpty()) {
            upsert checklistRecords;
        }
   

    return 'Shift creation completed. Created ' + shiftStaffRecords.size() + ' shifts , ' + servicesRecords.size() + ' services and shifts ==>' +JSON.serialize(addShiftRecords);

       
    }

 /*@AuraEnabled
public static Map<Id, List<WeekDateRangeResult>> processMultipleStaffDates(
    List<Id> staffIds, List<Date> inputDates, string startTimeStr, string endTimeStr, String isAvailability,boolean isEditMode) {
    
    // Convert List<Id> to Set<Id> for internal processing
    Set<Id> staffIdSet = new Set<Id>(staffIds);
    
    Map<Id, List<WeekDateRangeResult>> staffAllowedDatesMap = new Map<Id, List<WeekDateRangeResult>>();

    if (staffIdSet.isEmpty() || inputDates == null || inputDates.isEmpty()) {
        return staffAllowedDatesMap;
    }
	//system.debug('start time ===>'+startTimeStr);
   // system.debug('end  time  ===>'+endTimeStr);
    // Parse times once
     Time parsedStart =  RosterCreation.convertToTime(startTimeStr);
    Time parsedEnd =  RosterCreation.convertToTime(endTimeStr);
   // Time parsedStart = AddShiftHandler.getTimeIn24HrFormat(startTimeStr != null ? startTimeStr.toLowerCase() : '');
   // Time parsedEnd = AddShiftHandler.getTimeIn24HrFormat(endTimeStr != null ? endTimeStr.toLowerCase() : '');

    if (parsedStart == null || parsedEnd == null) {
        return staffAllowedDatesMap; // Cannot proceed without valid times
    }

    Decimal fixedDailyDuration = Decimal.valueOf(
        DateTime.newInstance(Date.today(), parsedEnd).getTime() -
        DateTime.newInstance(Date.today(), parsedStart).getTime()
    ) / (1000 * 60 * 60);

    // Determine global date range for query
    Date globalStart = inputDates[0];
    Date globalEnd = inputDates[0];
    for (Date d : inputDates) {
        if (d < globalStart) globalStart = d;
        if (d > globalEnd) globalEnd = d;
    }

    // Bulk Query Shifts for all staff within date range
    List<ShiftwithStaff__c> allShifts = [
        SELECT Id, Date__c, Staff__c, Start_Time__c, End_Time__c, End_Date__c,
               Duration__c, Type_of_Shift__c, Attendence__c,
               Staff__r.Set_Hours__c, Staff__r.Restrict_Set_Hours__c, Status__c
        FROM ShiftwithStaff__c
        WHERE Staff__c IN :staffIdSet
        AND Date__c >= :globalStart AND Date__c <= :globalEnd
        AND Type_of_Shift__c != 'Sleepover Shift'
        AND Status__c != 'Unassigned'
        AND Attendence__c = true
    ];

    // Bulk Query Availabilities for all staff within date range
    List<Availability__c> allAvailabilities = [
        SELECT Id, Staff__c, Start_Date__c, Start_Time__c, End_Time__c, Shift_Type__c
        FROM Availability__c
        WHERE Staff__c IN :staffIdSet
        AND Start_Date__c >= :globalStart AND Start_Date__c <= :globalEnd
        AND Shift_Type__c != 'Sleepover Shift'
    ];

    // Bulk Query Staff records for Set Hours and Restrict flag
    Map<Id, Staff__c> staffMap = new Map<Id, Staff__c>([
        SELECT Id, Set_Hours__c, Restrict_Set_Hours__c
        FROM Staff__c
        WHERE Id IN :staffIdSet
    ]);

    // Group shifts by staffId and date for overlap checking
    Map<Id, Map<Date, List<ShiftwithStaff__c>>> shiftsByStaffDate = new Map<Id, Map<Date, List<ShiftwithStaff__c>>>();
    for (ShiftwithStaff__c s : allShifts) {
        if (!shiftsByStaffDate.containsKey(s.Staff__c)) {
            shiftsByStaffDate.put(s.Staff__c, new Map<Date, List<ShiftwithStaff__c>>());
        }
        Map<Date, List<ShiftwithStaff__c>> dateMap = shiftsByStaffDate.get(s.Staff__c);
        if (!dateMap.containsKey(s.Date__c)) {
            dateMap.put(s.Date__c, new List<ShiftwithStaff__c>());
        }
        dateMap.get(s.Date__c).add(s);
    }

    // Group availabilities by staffId and date for overlap checking
    Map<Id, Map<Date, List<Availability__c>>> availByStaffDate = new Map<Id, Map<Date, List<Availability__c>>>();
    for (Availability__c a : allAvailabilities) {
        if (!availByStaffDate.containsKey(a.Staff__c)) {
            availByStaffDate.put(a.Staff__c, new Map<Date, List<Availability__c>>());
        }
        Map<Date, List<Availability__c>> dateMap = availByStaffDate.get(a.Staff__c);
        if (!dateMap.containsKey(a.Start_Date__c)) {
            dateMap.put(a.Start_Date__c, new List<Availability__c>());
        }
        dateMap.get(a.Start_Date__c).add(a);
    }

    // Group inputDates by week for easier processing
    Map<String, Date> weekStartMap = new Map<String, Date>();
    Map<String, Date> weekEndMap = new Map<String, Date>();
    Map<String, List<Date>> weekToDates = new Map<String, List<Date>>();
    for (Date d : inputDates) {
        Integer dow = Integer.valueOf(DateTime.newInstance(d, Time.newInstance(0, 0, 0, 0)).format('u'));
        Date weekStart = d.addDays(-(dow - 1)); // Monday
        Date weekEnd = weekStart.addDays(6); // Sunday
        String weekKey = String.valueOf(weekStart);
        if (!weekToDates.containsKey(weekKey)) {
            weekToDates.put(weekKey, new List<Date>());
            weekStartMap.put(weekKey, weekStart);
            weekEndMap.put(weekKey, weekEnd);
        }
        weekToDates.get(weekKey).add(d);
    }

    // Loop over each staff, then each week to decide allowed dates
    for (Id staffId : staffIdSet) {
        List<WeekDateRangeResult> staffResults = new List<WeekDateRangeResult>();
        Staff__c staffRec = staffMap.get(staffId);
        Decimal setHours = staffRec != null && staffRec.Set_Hours__c != null ? staffRec.Set_Hours__c : 0;
        Boolean restrict = staffRec != null && staffRec.Restrict_Set_Hours__c != null ? staffRec.Restrict_Set_Hours__c : false;

        for (String weekKey : weekToDates.keySet()) {
            Date weekStart = weekStartMap.get(weekKey);
            Date weekEnd = weekEndMap.get(weekKey);
            List<Date> weekDates = weekToDates.get(weekKey);

            Decimal existingShiftDuration = 0;
            List<Date> allowedDates = new List<Date>();

            // Calculate total existing shift duration for staff in this week
            Map<Date, List<ShiftwithStaff__c>> shiftDates = shiftsByStaffDate.get(staffId);
            if (shiftDates != null) {
                for (Date d : shiftDates.keySet()) {
                    if (d >= weekStart && d <= weekEnd) {
                        for (ShiftwithStaff__c s : shiftDates.get(d)) {
                            existingShiftDuration += (s.Duration__c != null) ? s.Duration__c : 0;
                        }
                    }
                }
            }

            // Calculate total availability duration in this week
            Map<Date, List<Availability__c>> availDates = availByStaffDate.get(staffId);
            if (availDates != null) {
                for (Date d : availDates.keySet()) {
                    if (d >= weekStart && d <= weekEnd) {
                        for (Availability__c a : availDates.get(d)) {
                            if (a.Start_Time__c != null && a.End_Time__c != null) {
                                try {
                                    DateTime startDT = DateTime.newInstance(Date.today(), a.Start_Time__c);
                                    DateTime endDT = DateTime.newInstance(Date.today(), a.End_Time__c);
                                    Decimal duration = Decimal.valueOf((endDT.getTime() - startDT.getTime()) / (1000 * 60 * 60));
                                    existingShiftDuration += duration;
                                } catch (Exception e) {
                                    // Log or handle
                                }
                            }
                        }
                    }
                }
            }

            Decimal totalDuration = 0;
            
            // Check each date for overlaps and capacity
            for (Date dt : weekDates) {
                Boolean hasOverlap = false;
                
                // Convert proposed shift times to DateTime for overlap checking
                DateTime proposedStart = DateTime.newInstance(dt, parsedStart);
                DateTime proposedEnd = DateTime.newInstance(dt, parsedEnd);
                Boolean skipOverlapCheck = (isEditMode && inputDates != null && !inputDates.isEmpty() && dt == inputDates[0]);
                
                if (!skipOverlapCheck) {
                    
                // Check for overlapping shifts on this date
                    if (shiftDates != null && shiftDates.containsKey(dt) && !shiftDates.get(dt).isEmpty()) {
                        for (ShiftwithStaff__c existingShift : shiftDates.get(dt)) {
                            DateTime existingStart = DateTime.newInstance(
                                existingShift.Date__c, 
                                existingShift.Start_Time__c
                            );
                            DateTime existingEnd = DateTime.newInstance(
                                existingShift.End_Date__c != null ? existingShift.End_Date__c : existingShift.Date__c, 
                                existingShift.End_Time__c
                            );
                            
                            if (isShiftOverlap(proposedStart, proposedEnd, existingStart, existingEnd)) {
                                hasOverlap = true;
                                break;
                            }
                        }
                    }
                }
                // Check for overlapping availability (if availability checking is enabled)
                if (!hasOverlap && isAvailability == 'Yes' && availDates != null && availDates.containsKey(dt) && !availDates.get(dt).isEmpty()) {
                    for (Availability__c avail : availDates.get(dt)) {
                        if (avail.Start_Time__c != null && avail.End_Time__c != null) {
                            DateTime availStart = DateTime.newInstance(dt, avail.Start_Time__c);
                            DateTime availEnd = DateTime.newInstance(dt, avail.End_Time__c);
                            
                            // Check if proposed shift overlaps with availability
                            if (avail.Start_Time__c < parsedEnd && avail.End_Time__c > parsedStart) {
                                hasOverlap = true;
                                break;
                            }
                        }
                    }
                }
                
                // Skip this date if there's any overlap with existing shifts or availability
                if (hasOverlap) {
                    continue;
                }
                
                // Proceed with capacity calculations only if no overlaps
                Integer dayOfWeek = Integer.valueOf(DateTime.newInstance(dt, Time.newInstance(0, 0, 0, 0)).format('u'));
                Boolean isWeekend = (dayOfWeek == 6 || dayOfWeek == 7);
                Decimal projected = existingShiftDuration + totalDuration + fixedDailyDuration;

                if (!isWeekend && restrict && setHours > 0 && projected > setHours) {
                    // Skip date because it would violate set hours quota
                    continue;
                }
                totalDuration += fixedDailyDuration;
                allowedDates.add(dt);
            }

            if (!allowedDates.isEmpty()) {
                WeekDateRangeResult res = new WeekDateRangeResult();
                res.originalWeekDates = allowedDates;
                res.weekStart = weekStart;
                res.weekEnd = weekEnd;
                res.totalDuration = totalDuration.setScale(2);
                res.calculatedDuration = totalDuration.setScale(2);
                staffResults.add(res);
            }
        }

        staffAllowedDatesMap.put(staffId, staffResults);
    }
    return staffAllowedDatesMap;
}

// Helper method to check for shift time overlaps
    public static Boolean isShiftOverlap(DateTime start1, DateTime end1, DateTime start2, DateTime end2) {
        return (start1 < end2 && start2 < end1);
    }*/
   // Helper
        public static Add_Shift__c buildAddShiftRecord(ShiftDetailsWrapper shiftDetails, AddressWrapper shiftAddress,String refId,ShiftPayload payload, Date recurDate, List<StaffWrapper> staffRows) {
            Add_Shift__c addShift = new Add_Shift__c();
            addShift.RefId__c = refId;
            addShift.Role__c = shiftDetails.AddShiftRole;
            addShift.Start_Date__c = recurDate;
            addShift.Facility__c = shiftDetails.AddShiftFacilityValue;
            addShift.Start_Time_Text__c = shiftDetails.AddShiftStartTimeAMPM;
            addShift.End_Time_Text__c = shiftDetails.AddShiftEndTimeAMPM;
            addShift.Start_Time__c = RosterCreation.convertToTime(shiftDetails.AddShiftStartTime);
            addShift.End_Time__c = RosterCreation.convertToTime(shiftDetails.AddShiftEndTime);
          //  addShift.Split_Shifts__c = payload.isSplitShift;
            addShift.Shift_Type__c = shiftDetails.AddShiftType;
            addShift.Shift_Name__c = shiftDetails.AddShiftTypeName;
            DateTime dt = DateTime.newInstance(recurDate, Time.newInstance(0, 0, 0, 0));
            addShift.Day_Name__c = dt.format('EEEE');
            addShift.Shift_Notes__c = shiftDetails.AddShiftNotes;
            addShift.Location__Street__s = shiftAddress.street;
            addShift.Location__City__s = shiftAddress.citySuburb;
            addShift.Location__StateCode__s = shiftAddress.provinceState;
            addShift.Location__PostalCode__s = shiftAddress.postalcode;
            addShift.Location__Latitude__s = shiftAddress.latitude;
            addShift.Location__Longitude__s = shiftAddress.longitude;
            addShift.Location__CountryCode__s = 'AU';
            addShift.Is_EOI__c = shiftDetails.AddShiftEOI;
            addShift.Duration__c = shiftDetails.AddShiftDuration;
            addShift.Get_Facility__c = shiftDetails.AddShiftEnterOtherLocation;
            addShift.Participant_Address_checkbox__c = shiftDetails.AddShiftParticipantAddressCheckbox;
            addShift.Group_Shifts__c = payload.isGroupShift;
            if (payload.isRecurringShift) {
                addShift.Do_you_want_to_set_this_a_recurring_shif__c = true;
            }
            addShift.Quantity__c = staffRows != null ? staffRows.size() : 0;
            return addShift;
        }
    
  public static ShiftWithStaff__c getLongShifts(String longShiftTimeSlots, ShiftWithStaff__c shiftStaff) {
    Map<String, Object> longShiftDetails = new Map<String, Object>()  ;
     if (!String.isBlank(longShiftTimeSlots)) {
        longShiftDetails = (Map<String, Object>) JSON.deserializeUntyped(longShiftTimeSlots);
    }
  
    System.debug('longShiftDetails ' + longShiftDetails);

   // if (!longShiftDetails.isEmpty()) {
        if (longShiftDetails.containsKey('Morning')) {
            Map<String, Object> morningShift = (Map<String, Object>) longShiftDetails.get('Morning');
            String startTimeString = (String) morningShift.get('starttime');
            String endTimeString = (String) morningShift.get('endtime');
            // 🔍 Debug logs
         
                        // Assign values
                        shiftStaff.Long_Morning_Start_Time__c        = RosterCreation.convertToTime(startTimeString);
                        shiftStaff.Long_Morning_End_Time__c          = RosterCreation.convertToTime(endTimeString);
                        shiftStaff.Is_long_Morning__c                = true;
                        shiftStaff.Long_Morning_Index__c             = Integer.valueOf(morningShift.get('index'));
                        shiftStaff.Long_Morning_Hourly_Rate__c       = Decimal.valueOf((String) morningShift.get('hourlyrate'));
                        shiftStaff.Long_Morning_Shift_Duartion__c    = Decimal.valueOf(String.valueOf(morningShift.get('duration')));
                        shiftStaff.Is_long_Morning_Next_Day_Start__c = (Boolean) morningShift.get('isNextDayStart');
                        shiftStaff.Long_Morning_Start_Date_One__c    = Date.valueOf((String) morningShift.get('startDateOnly'));
                        shiftStaff.long_Morining_Service_Ref_Id__c   = String.valueOf(morningShift.get('id'));
                        
                        // 🔍 Final check after assignment
                        System.debug('Assigned shiftStaff fields (Morning): ' + JSON.serializePretty(shiftStaff));
                    }else{
                        shiftStaff.Long_Morning_Start_Time__c = null;
                        shiftStaff.Long_Morning_End_Time__c = null;
                        shiftStaff.Is_long_Morning__c = false;
                        shiftStaff.Long_Morning_Index__c=0;
                        shiftStaff.Long_Morning_Hourly_Rate__c =0;
                        shiftStaff.Long_Morning_Shift_Duartion__c = 0;
                        shiftStaff.Is_long_Morning_Next_Day_Start__c=false;
                         shiftStaff.Long_Morning_Start_Date_One__c=null;
                          shiftStaff.long_Morining_Service_Ref_Id__c='';
                    }
                    
                    if (longShiftDetails.containsKey('Afternoon')) {
                        Map<String, Object> afternoonShift = (Map<String, Object>) longShiftDetails.get('Afternoon');
                        String startTimeString = (String) afternoonShift.get('starttime');
                        String endTimeString = (String) afternoonShift.get('endtime');
                        shiftStaff.Long_Afternoon_Start_Time__c = RosterCreation.convertToTime(startTimeString);
                        shiftStaff.Long_Afternoon_End_Time__c = RosterCreation.convertToTime(endTimeString);
                        shiftStaff.Is_Long_Afternoon__c = true;
                        shiftStaff.Long_Afternoon_Index__c= integer.valueOf(afternoonShift.get('index'));
                        shiftStaff.Long_Afternoon_Hourly_Rate__c = Decimal.valueOf((String) afternoonShift.get('hourlyrate'));
                        shiftStaff.Long_Afternoon_Shift_Duartion__c = Decimal.valueOf(String.valueOf(afternoonShift.get('duration')));
                        shiftStaff.Is_Long_Afternoon_Next_Day_Start__c=((boolean)afternoonShift.get('isNextDayStart')); 
                        shiftStaff.Long_Afternoon_Start_Date_One__c=Date.valueOf((String)afternoonShift.get('startDateOnly'));
                          shiftStaff.long_Afternooon_Service_Ref_Id__c=String.valueOf(afternoonShift.get('id'));
                        
                    }else{
                        shiftStaff.Long_Afternoon_Start_Time__c = null;
                        shiftStaff.Long_Afternoon_End_Time__c = null;
                        shiftStaff.Is_Long_Afternoon__c = false;
                        shiftStaff.Long_Afternoon_Index__c=0;
                        shiftStaff.Long_Afternoon_Hourly_Rate__c = 0;
                        shiftStaff.Long_Afternoon_Shift_Duartion__c = 0;
                        shiftStaff.Is_Long_Afternoon_Next_Day_Start__c=false;
                        shiftStaff.Long_Afternoon_Start_Date_One__c=null;
                        shiftStaff.long_Afternooon_Service_Ref_Id__c='';
                    }
                    
                    if (longShiftDetails.containsKey('Night')) {
                          system.debug(' in Night ');
                        Map<String, Object> nightShift = (Map<String, Object>) longShiftDetails.get('Night');
                          system.debug(' nightShift' +nightShift);
                        String startTimeString = (String) nightShift.get('starttime');
                        String endTimeString = (String) nightShift.get('endtime');
                        shiftStaff.Long_Night_Start_Time__c = RosterCreation.convertToTime(startTimeString);
                        shiftStaff.Long_Night_End_Time__c = RosterCreation.convertToTime(endTimeString);
                        shiftStaff.Is_Long_Night_Shift__c = true;
                        shiftStaff.Long_Night_Index__c= integer.valueOf(nightShift.get('index'));
                        shiftStaff.Long_Night_Hourly_Rate__c = Decimal.valueOf((String) nightShift.get('hourlyrate'));
                        shiftStaff.Long_Night_Shift_Duartion__c = Decimal.valueOf(String.valueOf(nightShift.get('duration')));
                        shiftStaff.Is_Long_Night_Start_Next_Day__c=((boolean)nightShift.get('isNextDayStart'));
             			shiftStaff.Long_Night_Start_Date__c=Date.valueOf((String)nightShift.get('startDateOnly'));
                          shiftStaff.long_Night_Service_Ref_Id__c	=String.valueOf(nightShift.get('id'));
                    }else{
                        shiftStaff.Long_Night_Start_Time__c = null;
                        shiftStaff.Long_Night_End_Time__c = null;
                        shiftStaff.Is_Long_Night_Shift__c = false;
                        shiftStaff.Long_Night_Index__c=0;
                        shiftStaff.Long_Night_Hourly_Rate__c = 0;
                        shiftStaff.Long_Night_Shift_Duartion__c =0;
                        shiftStaff.Is_Long_Night_Start_Next_Day__c=false;
                        shiftStaff.Long_Night_Start_Date__c=null;
                          shiftStaff.long_Night_Service_Ref_Id__c='';
                    }
                    
                    if (longShiftDetails.containsKey('Sleepover Shift')) {
                        Map<String, Object> sleepoverShift = (Map<String, Object>) longShiftDetails.get('Sleepover Shift');
                        String startTimeString = (String) sleepoverShift.get('starttime');
                        String endTimeString = (String) sleepoverShift.get('endtime');
                        shiftStaff.Long_Sleepover_Start_Time__c = RosterCreation.convertToTime(startTimeString);
                        shiftStaff.Long_Sleepover_End_Time__c = RosterCreation.convertToTime(endTimeString);
                        shiftStaff.Is_Long_SleepOver__c = true;
                        shiftStaff.Long_Sleepover_index__c= integer.valueOf(sleepoverShift.get('index'));
                        shiftStaff.Long_Sleepover_Allowance__c = Decimal.valueOf((String) sleepoverShift.get('hourlyrate'));
                        shiftStaff.Long_Sleepover_Duartion__c = Decimal.valueOf(String.valueOf(sleepoverShift.get('duration')));
                        shiftStaff.Is_Long_Sleepover_Next_Day_Start__c=((boolean)sleepoverShift.get('isNextDayStart'));
                        shiftStaff.Long_Sleepover_Start_Date__c=Date.valueOf((String)sleepoverShift.get('startDateOnly'));
                          shiftStaff.long_Sleepover_Service_Ref_Id__c=String.valueOf(sleepoverShift.get('id'));
                    }else{
                        shiftStaff.Long_Sleepover_Start_Time__c = null;
                        shiftStaff.Long_Sleepover_End_Time__c = null;
                        shiftStaff.Is_Long_SleepOver__c = false;
                        shiftStaff.Long_Sleepover_index__c=0;
                        shiftStaff.Long_Sleepover_Allowance__c = 0;
                        shiftStaff.Long_Sleepover_Duartion__c = 0;
                         shiftStaff.Is_Long_Sleepover_Next_Day_Start__c=false;
                        shiftStaff.Long_Sleepover_Start_Date__c=null;
                          shiftStaff.long_Sleepover_Service_Ref_Id__c='';
                    }
                    
                    if (longShiftDetails.containsKey('Morning 2')) {
                        system.debug(' in morning 2');
                        Map<String, Object> morningShift = (Map<String, Object>) longShiftDetails.get('Morning 2');
                        system.debug(' in morning 2' +morningShift);
                        String startTimeString = (String) morningShift.get('starttime');
                        String endTimeString = (String) morningShift.get('endtime');
                        
                        shiftStaff.Long_Morning_Start_Time_Two__c = RosterCreation.convertToTime(startTimeString);
                        shiftStaff.Long_Morning_End_Time_Two__c = RosterCreation.convertToTime(endTimeString);
                        shiftStaff.Is_long_Morning_Shift_two__c = true;
                        shiftStaff.Long_Morning_Index_Two__c= integer.valueOf(morningShift.get('index'));
                        shiftStaff.Long_Morning_Rate_Two__c = Decimal.valueOf((String) morningShift.get('hourlyrate'));
                        shiftStaff.Long_Morning_Duartion_Two__c = Decimal.valueOf(String.valueOf(morningShift.get('duration')));
                        shiftStaff.Is_Long_Morning_Next_Day_Start_Two__c=((boolean)morningShift.get('isNextDayStart'));
                         shiftStaff.Long_Morning_Start_Date_Two__c=Date.valueOf((String)morningShift.get('startDateOnly'));
                          shiftStaff.long_Morning_2_Service_Ref_Id__c=String.valueOf(morningShift.get('id'));
                    }else{
                        shiftStaff.Long_Morning_Start_Time_Two__c = null;
                        shiftStaff.Long_Morning_End_Time_Two__c = null;
                        shiftStaff.Is_long_Morning_Shift_two__c = false;
                        shiftStaff.Long_Morning_Index_Two__c=0;
                        shiftStaff.Long_Morning_Rate_Two__c = 0;
                        shiftStaff.Long_Morning_Duartion_Two__c =0;
                        shiftStaff.Is_Long_Morning_Next_Day_Start_Two__c=false;
                         shiftStaff.Long_Morning_Start_Date_Two__c=null;
                          shiftStaff.long_Morning_2_Service_Ref_Id__c='';
                    }
                    
                    if (longShiftDetails.containsKey('Afternoon 2')) {
                        Map<String, Object> afternoonShift2 = (Map<String, Object>) longShiftDetails.get('Afternoon 2');
                        String startTimeString = (String) afternoonShift2.get('starttime');
                        String endTimeString = (String) afternoonShift2.get('endtime');
                        shiftStaff.Long_Afternoon_Start_Time_two__c = RosterCreation.convertToTime(startTimeString);
                        shiftStaff.Long_afternoon_End_Time_Two__c = RosterCreation.convertToTime(endTimeString);
                        shiftStaff.Is_Long_afternoon_shift_two__c = true;
                        shiftStaff.Long_Afternoon_Index_Two__c= integer.valueOf(afternoonShift2.get('index'));
                        shiftStaff.Long_Afternoon_Rate_Two__c = Decimal.valueOf((String) afternoonShift2.get('hourlyrate'));
                        shiftStaff.Long_Afternoon_Duration_Two__c = Decimal.valueOf(String.valueOf(afternoonShift2.get('duration')));
                         shiftStaff.Is_Long_Afternoon_Next_Day_Start_Two__c=((boolean)afternoonShift2.get('isNextDayStart'));
                         shiftStaff.Long_Afternoon_Start_Date_Two__c=Date.valueOf((String)afternoonShift2.get('startDateOnly'));
                          shiftStaff.long_Afternooon_Two_Service_Ref_Id__c=String.valueOf(afternoonShift2.get('id'));
                    }else{
                        shiftStaff.Long_Afternoon_Start_Time_two__c = null;
                        shiftStaff.Long_afternoon_End_Time_Two__c = null;
                        shiftStaff.Is_Long_afternoon_shift_two__c = false;
                        shiftStaff.Long_Afternoon_Index_Two__c=0;
                        shiftStaff.Long_Afternoon_Rate_Two__c = 0;
                        shiftStaff.Long_Afternoon_Duration_Two__c = 0; 
                        shiftStaff.Is_Long_Afternoon_Next_Day_Start_Two__c=false;
                        shiftStaff.Long_Afternoon_Start_Date_Two__c=null;
                          shiftStaff.long_Afternooon_Two_Service_Ref_Id__c='';
                    }
                    
                    
                //}
               return  shiftStaff;
    }


    
}