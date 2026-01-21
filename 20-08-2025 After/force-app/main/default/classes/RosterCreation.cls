public with sharing class RosterCreation {
    @AuraEnabled
    public static Map<String, Object> createAddShift(String addshiftData, Boolean isRecurring, String typeOfRecur, Integer recurEvery, String endDate, String shiftDate,
                                                     List<String> weeklyDays, Integer monthlyDay, String servicesJsonData, String checkListJsonData, Boolean isUpdate, Boolean includeParticipants, List<Date> recurrenceDates,boolean isSingleClass,boolean RecurringWithIncludeAndNewParticipants) {
                                                         Map<String, Object> response = new Map<String, Object>();
                                                         Map<String, RosterAddShiftService.RosterServiceHandler> rosterServiceMap = new Map<String, RosterAddShiftService.RosterServiceHandler>();
                                                         system.debug('recurrenceDates >>'+recurrenceDates);
                                                         Boolean addShiftupdateFlag = isUpdate;
                                                         Boolean shiftWithStaffUpdateFlag = isUpdate; 
                                                         list<Date> FinalRecurDates= new list<Date>();                                                
                                                         
                                                         try {
                                                             
                                                             List<RosterAddShiftService.RosterServiceHandler> rosterServices = (List<RosterAddShiftService.RosterServiceHandler>) System.JSON.deserialize(servicesJsonData, List<RosterAddShiftService.RosterServiceHandler>.class);
                                                             List<Add_Shift__c> addShiftList = new List<Add_Shift__c>();
                                                             List<Date> allFinalDates = new List<Date>();
                                                             addShiftWrapper addShift = (addShiftWrapper) System.JSON.deserialize(addshiftData, addShiftWrapper.class);
                                                             system.debug('addShift.shiftDetails.AddShiftType '+addShift.shiftDetails.AddShiftType);
                                                             system.debug('addShift.AddShiftStaffValue '+addShift.shiftDetails.AddShiftStaffValue);
                                                             recurrenceDates.sort();
                                                             system.debug('recurrenceDates '+recurrenceDates);
                                                             if(isRecurring){
                                                                 list<ShiftwithStaff__c> existingShiftList=[ SELECT Id, Date__c, Start_Time__c, End_Date__c, End_Time__c FROM ShiftwithStaff__c WHERE Attendence__c = true AND Date__c IN :recurrenceDates and
                                                                                                            staff__c =:addShift.shiftDetails.AddShiftStaffValue];
                                                                 boolean isUpdating=addShiftupdateFlag;
                                                                 
                                                                 boolean firstRecord=true;
                                                                 Set<Date> allRecurrenceDates = new Set<Date>(recurrenceDates);
                                                                 Id availStaffId = addShift.shiftDetails.AddShiftStaffValue;
                                                                 
                                                                 // Query all Availability records for the staff and all relevant dates at once
                                                                 Map<Date, List<Availability__c>> availabilityByDate = new Map<Date, List<Availability__c>>();
                                                                 for (Availability__c avail : [
                                                                     SELECT Start_Time__c, End_Time__c, Start_Date__c 
                                                                     FROM Availability__c 
                                                                     WHERE Staff__c = :availStaffId 
                                                                     AND Start_Date__c IN :allRecurrenceDates
                                                                 ]) {
                                                                     if (!availabilityByDate.containsKey(avail.Start_Date__c)) {
                                                                         availabilityByDate.put(avail.Start_Date__c, new List<Availability__c>());
                                                                     }
                                                                     availabilityByDate.get(avail.Start_Date__c).add(avail);
                                                                 }
                                                                 system.debug('existingShiftList '+existingShiftList);
                                                                 for (Integer i = 0; i < recurrenceDates.size(); i++) {
                                                                     Date RD = recurrenceDates[i];
                                                                     Boolean isOverlapping = false;
                                                                     Date shiftEndDate;
                                                                     
                                                                     System.debug('Processing recurrence date: ' + RD);
                                                                     
                                                                     // Determine correct end date based on shift type
                                                                     if (addShift.shiftDetails.AddShiftType == 'Night' || 
                                                                         addShift.shiftDetails.AddShiftType == 'Sleepover Shift' || 
                                                                         addShift.shiftDetails.AddShiftType == 'Custom') {
                                                                             
                                                                             List<String> timeSplit = addShift.shiftDetails.AddShiftEndTimeAMPM.toLowerCase().split(' ');
                                                                             List<String> startTimeSplits = addShift.shiftDetails.AddShiftStartTimeAMPM.split(' ');
                                                                             
                                                                             if (timeSplit[1] == 'am' && 
                                                                                 (startTimeSplits[1] != 'am' || addShift.shiftDetails.AddShiftType == 'Custom')) {
                                                                                     shiftEndDate = RD.addDays(1);
                                                                                     System.debug('Shift spans to next day. New end date: ' + shiftEndDate);
                                                                                 } else {
                                                                                     shiftEndDate = RD;
                                                                                 }
                                                                         } else {
                                                                             shiftEndDate = RD;
                                                                         }
                                                                     
                                                                     DateTime recurStart = DateTime.newInstanceGMT(RD, addShift.shiftDetails.AddShiftStartTime);
                                                                     DateTime recurEnd = DateTime.newInstanceGMT(shiftEndDate, addShift.shiftDetails.AddShiftEndTime);
                                                                     
                                                                     System.debug('Recur Start: ' + recurStart + ', Recur End: ' + recurEnd);
                                                                     
                                                                     // Skip overlap check for first date during update
                                                                     if (isUpdating && i == 0) {
                                                                         FinalRecurDates.add(RD);
                                                                         System.debug('Update mode: first date auto-added without overlap check -> ' + RD);
                                                                         continue;
                                                                     }
                                                                     
                                                                     // Check overlap for all other dates
                                                                     for (ShiftwithStaff__c ss : existingShiftList) {
                                                                         if (RD == ss.Date__c) {
                                                                             DateTime shiftStart = DateTime.newInstanceGMT(ss.Date__c, ss.Start_Time__c);
                                                                             DateTime shiftEnd = DateTime.newInstanceGMT(ss.End_Date__c, ss.End_Time__c);
                                                                             
                                                                             System.debug('Checking overlap with existing shift: ' + shiftStart + ' to ' + shiftEnd);
                                                                             
                                                                             if (isShiftOverlap(recurStart, recurEnd, shiftStart, shiftEnd)) {
                                                                                 isOverlapping = true;
                                                                                 System.debug('Overlap found for date: ' + RD + ' — skipping this date.');
                                                                                 break;
                                                                             }
                                                                         }
                                                                     }
                                                                     
                                                                     if (!isOverlapping) {
                                                                         Boolean availabilityMatch = true; // Assume allowed unless overlap found
                                                                         
                                                                     /*    List<Availability__c> availabilityList = [
                                                                             SELECT Start_Time__c, End_Time__c
                                                                             FROM Availability__c
                                                                             WHERE Staff__c = :addShift.shiftDetails.AddShiftStaffValue
                                                                             AND Start_Date__c = :RD
                                                                         ]; */
                                                                        List<Availability__c> availabilityList = availabilityByDate.get(RD);
                                                                         
                                                                          if (availabilityList != null && !availabilityList.isEmpty()) {
                                                                             for (Availability__c avail : availabilityList) {
                                                                                 if (avail.Start_Time__c != null && avail.End_Time__c != null) {
                                                                                     if (avail.Start_Time__c < addShift.shiftDetails.AddShiftEndTime &&
                                                                                         avail.End_Time__c > addShift.shiftDetails.AddShiftStartTime) {
                                                                                             // Found overlapping availability → do NOT allow shift
                                                                                             availabilityMatch = false;
                                                                                             System.debug('Shift overlaps with availability on: ' + RD);
                                                                                             break;
                                                                                         }
                                                                                 }
                                                                             }
                                                                         }
                                                                         
                                                                         if (availabilityMatch) {
                                                                             FinalRecurDates.add(RD);
                                                                             System.debug('Date passed availability check and added: ' + RD);
                                                                         } else {
                                                                             System.debug('Date failed availability check. Skipping: ' + RD);
                                                                         }
                                                                     }
                                                                     
                                                                 }
                                                                 System.debug('FinalRecurDates ' + FinalRecurDates);

                                                                 String formattedStartTime = addShift.shiftDetails.AddShiftStartTimeAMPM;
                                                                 String formattedEndTime = addShift.shiftDetails.AddShiftEndTimeAMPM;
                                                                 Id staffId = (Id) addShift.shiftDetails.AddShiftStaffValue;
                                                                 
                                                                 List<Map<String, Object>> filteredDatesWithRange = StaffAvailabilityController.processFinalDates(
                                                                     FinalRecurDates, 
                                                                     staffId,
                                                                     formattedStartTime, 
                                                                     formattedEndTime, 
                                                                     'Yes'
                                                                 );
                                                                 system.debug('filteredDatesWithRange >>'+ filteredDatesWithRange);
                                                                 for (Map<String, Object> weekMap : filteredDatesWithRange) {
                                                                    if (weekMap.containsKey('originalWeekDates')) {
                                                                        List<Date> weekDates = (List<Date>) weekMap.get('originalWeekDates');
                                                                        allFinalDates.addAll(weekDates);
                                                                    }
                                                                }
                                                                
                                                                System.debug('📅 All Final Dates: ' + allFinalDates);

                                                             }
                                                             
                                                             for (RosterAddShiftService.RosterServiceHandler rsh : rosterServices) {
                                                                 rosterServiceMap.put(rsh.id, rsh);
                                                                 if (isRecurring) {
                                                                     // Map<String, Object> getRecurOccurrences = RosterCreationRecurringHnadler.getNumberOfRecurrences(typeOfRecur, recurEvery, endDate, shiftDate, weeklyDays, monthlyDay);
                                                                     //system.debug('getRecurOccurrences >>'+getRecurOccurrences);
                                                                     if (allFinalDates.size()> 0) {
                                                                         //List<Date> dateList = (List<Date>) getRecurOccurrences.get('RecurrenceDates');
                                                                         for (Date eachDate : allFinalDates) {
                                                                             system.debug('eachDate >>'+eachDate);
                                                                             Add_Shift__c shift = createShift(addShift, rsh, addShiftupdateFlag);
                                                                             shift.Start_Date__c = eachDate;
                                                                             Datetime dt = Datetime.newInstance(eachDate, Time.newInstance(0, 0, 0, 0));
                                                                             shift.Day_Name__c = dt.format('EEEE');
                                                                             shift.Do_you_want_to_set_this_a_recurring_shif__c=true;
                                                                             if (addShiftupdateFlag) {
                                                                                 addShiftupdateFlag = false;
                                                                             }
                                                                             system.debug('shift >>'+shift);
                                                                             addShiftList.add(shift);
                                                                         }
                                                                     }
                                                                 } else {
                                                                     
                                                                     Add_Shift__c shift = createShift(addShift, rsh, addShiftupdateFlag);
                                                                     if (rsh.SplitShift && addShiftupdateFlag==true) {
                                                                         addShiftupdateFlag = false;
                                                                     }
                                                                     shift.Public_holiday__c=addShift.shiftDetails.AddShiftHoliday;
                                                                     addShiftList.add(shift);
                                                                 }
                                                             }
                                                             
                                                             if (!addShiftList.isEmpty()) {
                                                                 upsert addShiftList;
                                                                 system.debug('addShiftList >>'+addShiftList);
                                                                 response.put('AddShiftSuccess', true);
                                                                 response.put('AddShiftMessage', 'Shifts created successfully.');
                                                                 
                                                                 // Call createOrUpdateShiftWithStaff and get the response
                                                                 String shiftStaffResponse = createOrUpdateShiftWithStaff(rosterServiceMap, addShiftList, checkListJsonData, isUpdate, includeParticipants,isSingleClass,RecurringWithIncludeAndNewParticipants);
                                                                 Map<String, Object> shiftStaffResponseMap = (Map<String, Object>) JSON.deserializeUntyped(shiftStaffResponse);
                                                                 
                                                                 if (shiftStaffResponseMap.containsKey('isSuccess') && (Boolean) shiftStaffResponseMap.get('isSuccess')) {
                                                                     response.put('ShiftWithStaffSuccess', true);
                                                                     response.put('ShiftWithStaffMessage', 'Shifts with staff processed successfully.');
                                                                     response.put('shiftWithstaffResult',shiftStaffResponseMap.get('shiftwithStaffList'));
                                                                 } else {
                                                                     response.put('ShiftWithStaffSuccess', false);
                                                                     response.put('ShiftWithStaffMessage', 'Error processing shift staff: ' + shiftStaffResponseMap.get('shiftWithstaffMessage'));
                                                                     
                                                                 }
                                                             } else {
                                                                 response.put('AddShiftSuccess', false);
                                                                 response.put('AddShiftMessage', 'No shifts were created.');
                                                             }
                                                             
                                                             response.put('isSuccess', response.containsKey('AddShiftSuccess') && response.containsKey('ShiftWithStaffSuccess') &&
                                                                          (Boolean) response.get('AddShiftSuccess') && (Boolean) response.get('ShiftWithStaffSuccess'));
                                                             response.put('AddShiftResult',JSON.serialize(addShiftList));
                                                             
                                                         } catch (Exception e) {
                                                             response.put('isSuccess', false);
                                                             response.put('message', 'Failed to process shifts: ' + e.getMessage());
                                                         }
                                                         
                                                         return response;
                                                     }
    public static Boolean isShiftOverlap(DateTime recurStart, DateTime RecurEnd, DateTime ShiftStart, DateTime ShiftEnd){
        return (recurStart < ShiftEnd && ShiftStart < RecurEnd);
    }
    
    
    @AuraEnabled
    public static Add_Shift__c createShift(addShiftWrapper addShift, RosterAddShiftService.RosterServiceHandler rsh, Boolean addShiftupdateFlag) {
        Add_Shift__c shift = new Add_Shift__c();
        
        if (addShiftupdateFlag == true && addShift.shiftDetails.AddShiftId != null) {
            system.debug('if addShiftupdateFlag ' + addShiftupdateFlag);
            system.debug('if condition ' + addShift.shiftDetails.AddShiftId);
            shift = new Add_Shift__c(Id = addShift.shiftDetails.AddShiftId);  // Only for the first shift
            // Reset the flag to false after processing
            // Ensure subsequent shifts are treated as new records
        } else {
            system.debug('else condition');
            shift = new Add_Shift__c();
        }
        
        system.debug('final addShiftupdateFlag ' + addShiftupdateFlag);  // It will now be correctly updated per method call
        shift.Start_Date__c = addShift.shiftDetails.AddShiftStartDate;
        shift.Facility__c = addShift.shiftDetails.AddShiftFacilityValue;
        shift.RefId__c = rsh.id;
        shift.Quantity__c = addShift.shiftDetails.AddShiftQuantity;
        if (rsh.SplitShift) {
            shift.Start_Time__c = rsh.startTime;
            shift.Start_Date__c=rsh.serviceDate;
            shift.End_Time__c = rsh.endTime;
            shift.Start_Time_Text__c = rsh.startTimeAMPM.toLowerCase();
            shift.End_Time_Text__c = rsh.endTimeAMPM.toLowerCase();
            shift.Split_Shifts__c = rsh.SplitShift;
            shift.Split_Shift_Color__c=rsh.splitShiftColor;
            shift.Split_Shift_Height__c=rsh.splitShiftHeight;
        } else {
            shift.Start_Time__c = addShift.shiftDetails.AddShiftStartTime;
            shift.End_Time__c = addShift.shiftDetails.AddShiftEndTime;
            shift.Start_Time_Text__c = addShift.shiftDetails.AddShiftStartTimeAMPM.toLowerCase();
            shift.End_Time_Text__c = addShift.shiftDetails.AddShiftEndTimeAMPM.toLowerCase();
        }
        shift.Shift_Type__c = addShift.shiftDetails.AddShiftType;
        shift.Shift_Name__c = addShift.shiftDetails.AddShiftTypeName;
        shift.Role__c = addShift.shiftDetails.AddShiftRole;
        shift.Location__Street__s = addShift.shiftaddress.street;
        shift.Location__City__s = addShift.shiftaddress.citySuburb;
        shift.Location__StateCode__s = addShift.shiftaddress.provinceState;
        shift.Location__PostalCode__s = addShift.shiftaddress.postalcode;
        Datetime dt = Datetime.newInstance(shift.Start_Date__c, Time.newInstance(0, 0, 0, 0));
        shift.Day_Name__c = dt.format('EEEE');
        shift.Location__CountryCode__s = 'AU';
        shift.Location__Latitude__s=addShift.shiftaddress.latitude;
        shift.Location__Longitude__s=addShift.shiftaddress.longitude;
        shift.Is_EOI__c = addShift.shiftDetails.AddShiftEOI;
        shift.Shift_Notes__c = addShift.shiftDetails.AddShiftNotes;
        shift.Duration__c = addShift.shiftDetails.AddShiftDuration;
        
        shift.Get_Facility__c=addShift.shiftDetails.AddShiftEnterOtherLocation;
        shift.Participant_Address_checkbox__c=addShift.shiftDetails.AddShiftParticipantAddressCheckbox;
        return shift;
    }
    
    
    @AuraEnabled
    public static String createOrUpdateShiftWithStaff(
        Map<String, RosterAddShiftService.RosterServiceHandler> rosterServiceMap,
        List<Add_Shift__c> addShiftsListInput,
        String checkListJsonData,
        Boolean shiftWithStaffUpdateFlag,
        Boolean includeParticipants,
        Boolean isSingleClass,
        boolean RecurringWithIncludeAndNewParticipants
    ) {
        Map<String, Object> response = new Map<String, Object>();
        String shiftWithStaffId;
        Map<Id, Date> recurringDates = new Map<Id, Date>();
        
        try {
            Set<Id> shiftIds = new Set<Id>();
            for (Add_Shift__c shift : addShiftsListInput) {
                shiftIds.add(shift.Id);
            }
            
            List<Add_Shift__c> addShiftsList = [
                SELECT Id, RefId__c, Start_Date__c, Do_you_want_to_set_this_a_recurring_shif__c,
                Split_Shift_Color__c, Split_Shift_Height__c, Split_Shifts__c,End_Date__c,Start_Time__c,End_Time__c,
                Facility__c, Facility__r.Organisation__c,
                Facility__r.Organisation__r.Enable_Time_Rounding__c
                FROM Add_Shift__c
                WHERE Id IN :shiftIds
            ];
            
            List<ShiftwithStaff__c> shiftWithStaffList = new List<ShiftwithStaff__c>();
            List<Add_Shift_Checklist__c> checklistRecords = new List<Add_Shift_Checklist__c>();
            List<CheckListWrapper> checkList;
            if (String.isNotBlank(checkListJsonData)) {
                checkList = (List<CheckListWrapper>) System.JSON.deserialize(checkListJsonData, List<CheckListWrapper>.class);
            }
            
            Set<String> shiftWithStaffIdSet = new Set<String>();
            Set<String> checkListIdSet = new Set<String>();
            Boolean addShiftChecklistUpdateFlag = shiftWithStaffUpdateFlag;
            Boolean servceRecurFlag = shiftWithStaffUpdateFlag;
            Boolean checkListFlag = shiftWithStaffUpdateFlag;
            
            for (Add_Shift__c shift : addShiftsList) {
                 SYSTEM.DEBUG(' addShiftChecklistUpdateFlag  ' +addShiftChecklistUpdateFlag);
                ShiftwithStaff__c shiftStaff;
                if (addShiftChecklistUpdateFlag && rosterServiceMap.get(shift.RefId__c).shiftWithStaffId != null) {
                    shiftStaff = new ShiftwithStaff__c(Id = rosterServiceMap.get(shift.RefId__c).shiftWithStaffId);
                    addShiftChecklistUpdateFlag = false;
                    shiftWithStaffId = rosterServiceMap.get(shift.RefId__c).shiftWithStaffId;
                    SYSTEM.DEBUG(' IN IF SHIFT STAFF  ');
                } else {
                      SYSTEM.DEBUG(' IN else SHIFT STAFF  ');
                    shiftStaff = new ShiftwithStaff__c();
                    shiftStaff.Shift_SCR__c = 0;
                }
                
                shiftStaff.Recurring_Date__c = shift.Start_Date__c;
                shiftStaff.Add_Shift__c = shift.Id;
                shiftStaff.Do_you_want_to_set_this_Recurring_Roster__c = shift.Do_you_want_to_set_this_a_recurring_shif__c;
                shiftStaff.Staff_Final_Hourly_Rate__c = rosterServiceMap.get(shift.RefId__c).serviceStffaHourlyRate;
                shiftStaff.Staff__c = rosterServiceMap.get(shift.RefId__c).StaffId;
                shiftStaff.Attendence__c = true;
                shiftStaff.Split_Shift_Color__c = shift.Split_Shift_Color__c;
                shiftStaff.Split_Shift_Height__c = shift.Split_Shift_Height__c;
                shiftStaff.RefId__c = shift.RefId__c;
                shiftStaff.Start_Date__c = shift.Start_Date__c;
                shiftStaff.Shift_End_Date__c = shift.End_Date__c;
                shiftStaff.Shift_Start_Time__c = shift.Start_Time__c;
                shiftStaff.Shift_End_Time__c = shift.End_Time__c;
                
                if (shift.Start_Date__c != null && shift.Start_Time__c != null) {
                    // Combine date and time (automatically in UTC)
                    Datetime utcstartDateTime = Datetime.newInstance(shift.Start_Date__c, shift.Start_Time__c);
                
                    // ✅ Store directly without converting
                    shiftStaff.Shift_Start_DateTime_Stored__c = utcstartDateTime;
                
                    // Optional debug
                    System.debug('✅ Stored Shift_Start_DateTime_Stored__c (UTC): ' + utcstartDateTime);
                }
                
                if (shift.End_Date__c != null && shift.End_Time__c != null) {
                    // Combine date and time (automatically in UTC)
                    Datetime utcEndDateTime = Datetime.newInstance(shift.End_Date__c, shift.End_Time__c);
                
                    // ✅ Store directly without converting
                    shiftStaff.Shift_End_DateTime_Stored__c = utcEndDateTime;
                
                    // Optional debug
                    System.debug('✅ Stored Shift_End_DateTime_Stored__c (UTC): ' + utcEndDateTime);
                }
                
                if (shift.Facility__r != null && shift.Facility__r.Organisation__r != null) {
                    system.debug('shiftStaff.Time_Rounded_Off__c >>'+ shift.Facility__r.Organisation__r.Enable_Time_Rounding__c);
                    shiftStaff.Time_Rounded_Off__c = shift.Facility__r.Organisation__r.Enable_Time_Rounding__c;
                    system.debug('shiftStaff.Time_Rounded_Off__c >>'+ shiftStaff.Time_Rounded_Off__c);
                }
                
                Map<String, Object> longShiftDetails = (Map<String, Object>) JSON.deserializeUntyped(rosterServiceMap.get(shift.RefId__c).LongShiftTimeSlots);
                system.debug('longShiftDetails ' +longShiftDetails);
                if (!longShiftDetails.isEmpty()) {
                    if (longShiftDetails.containsKey('Morning')) {
                        Map<String, Object> morningShift = (Map<String, Object>) longShiftDetails.get('Morning');
                        String startTimeString = (String) morningShift.get('startTime');
                        String endTimeString = (String) morningShift.get('endTime');
                        
                        shiftStaff.Long_Morning_Start_Time__c = convertToTime(startTimeString);
                        shiftStaff.Long_Morning_End_Time__c = convertToTime(endTimeString);
                        shiftStaff.Is_long_Morning__c = true;
                        shiftStaff.Long_Morning_Index__c= integer.valueOf(morningShift.get('index'));
                        shiftStaff.Long_Morning_Hourly_Rate__c = Decimal.valueOf((String) morningShift.get('hourlyRate'));
                        shiftStaff.Long_Morning_Shift_Duartion__c = Decimal.valueOf(String.valueOf(morningShift.get('duration')));
                        shiftStaff.Is_long_Morning_Next_Day_Start__c=((boolean)morningShift.get('isNextDayStart'));
                         shiftStaff.Long_Morning_Start_Date_One__c=Date.valueOf((String)morningShift.get('startDateOnly'));
                        
                    }else{
                        shiftStaff.Long_Morning_Start_Time__c = null;
                        shiftStaff.Long_Morning_End_Time__c = null;
                        shiftStaff.Is_long_Morning__c = false;
                        shiftStaff.Long_Morning_Index__c=0;
                        shiftStaff.Long_Morning_Hourly_Rate__c =0;
                        shiftStaff.Long_Morning_Shift_Duartion__c = 0;
                        shiftStaff.Is_long_Morning_Next_Day_Start__c=false;
                         shiftStaff.Long_Morning_Start_Date_One__c=null;
                    }
                    
                    if (longShiftDetails.containsKey('Afternoon')) {
                        Map<String, Object> afternoonShift = (Map<String, Object>) longShiftDetails.get('Afternoon');
                        String startTimeString = (String) afternoonShift.get('startTime');
                        String endTimeString = (String) afternoonShift.get('endTime');
                        shiftStaff.Long_Afternoon_Start_Time__c = convertToTime(startTimeString);
                        shiftStaff.Long_Afternoon_End_Time__c = convertToTime(endTimeString);
                        shiftStaff.Is_Long_Afternoon__c = true;
                        shiftStaff.Long_Afternoon_Index__c= integer.valueOf(afternoonShift.get('index'));
                        shiftStaff.Long_Afternoon_Hourly_Rate__c = Decimal.valueOf((String) afternoonShift.get('hourlyRate'));
                        shiftStaff.Long_Afternoon_Shift_Duartion__c = Decimal.valueOf(String.valueOf(afternoonShift.get('duration')));
                        shiftStaff.Is_Long_Afternoon_Next_Day_Start__c=((boolean)afternoonShift.get('isNextDayStart')); 
                        shiftStaff.Long_Afternoon_Start_Date_One__c=Date.valueOf((String)afternoonShift.get('startDateOnly'));
                        
                    }else{
                            shiftStaff.Long_Afternoon_Start_Time__c = null;
                            shiftStaff.Long_Afternoon_End_Time__c = null;
                            shiftStaff.Is_Long_Afternoon__c = false;
                            shiftStaff.Long_Afternoon_Index__c=0;
                            shiftStaff.Long_Afternoon_Hourly_Rate__c = 0;
                            shiftStaff.Long_Afternoon_Shift_Duartion__c = 0;
                           shiftStaff.Is_Long_Afternoon_Next_Day_Start__c=false;
                           shiftStaff.Long_Afternoon_Start_Date_One__c=null;
                    }
                    
                    if (longShiftDetails.containsKey('Night')) {
                          system.debug(' in Night ');
                        Map<String, Object> nightShift = (Map<String, Object>) longShiftDetails.get('Night');
                          system.debug(' nightShift' +nightShift);
                        String startTimeString = (String) nightShift.get('startTime');
                        String endTimeString = (String) nightShift.get('endTime');
                        shiftStaff.Long_Night_Start_Time__c = convertToTime(startTimeString);
                        shiftStaff.Long_Night_End_Time__c = convertToTime(endTimeString);
                        shiftStaff.Is_Long_Night_Shift__c = true;
                        shiftStaff.Long_Night_Index__c= integer.valueOf(nightShift.get('index'));
                        shiftStaff.Long_Night_Hourly_Rate__c = Decimal.valueOf((String) nightShift.get('hourlyRate'));
                        shiftStaff.Long_Night_Shift_Duartion__c = Decimal.valueOf(String.valueOf(nightShift.get('duration')));
                        shiftStaff.Is_Long_Night_Start_Next_Day__c=((boolean)nightShift.get('isNextDayStart'));
             			shiftStaff.Long_Night_Start_Date__c=Date.valueOf((String)nightShift.get('startDateOnly'));
                    }else{
                        shiftStaff.Long_Night_Start_Time__c = null;
                        shiftStaff.Long_Night_End_Time__c = null;
                        shiftStaff.Is_Long_Night_Shift__c = false;
                        shiftStaff.Long_Night_Index__c=0;
                        shiftStaff.Long_Night_Hourly_Rate__c = 0;
                        shiftStaff.Long_Night_Shift_Duartion__c =0;
                        shiftStaff.Is_Long_Night_Start_Next_Day__c=false;
                        shiftStaff.Long_Night_Start_Date__c=null;
                    }
                    
                    if (longShiftDetails.containsKey('Sleepover Shift')) {
                        Map<String, Object> sleepoverShift = (Map<String, Object>) longShiftDetails.get('Sleepover Shift');
                        String startTimeString = (String) sleepoverShift.get('startTime');
                        String endTimeString = (String) sleepoverShift.get('endTime');
                        shiftStaff.Long_Sleepover_Start_Time__c = convertToTime(startTimeString);
                        shiftStaff.Long_Sleepover_End_Time__c = convertToTime(endTimeString);
                        shiftStaff.Is_Long_SleepOver__c = true;
                        shiftStaff.Long_Sleepover_index__c= integer.valueOf(sleepoverShift.get('index'));
                        shiftStaff.Long_Sleepover_Allowance__c = Decimal.valueOf((String) sleepoverShift.get('hourlyRate'));
                        shiftStaff.Long_Sleepover_Duartion__c = Decimal.valueOf(String.valueOf(sleepoverShift.get('duration')));
                        shiftStaff.Is_Long_Sleepover_Next_Day_Start__c=((boolean)sleepoverShift.get('isNextDayStart'));
                        shiftStaff.Long_Sleepover_Start_Date__c=Date.valueOf((String)sleepoverShift.get('startDateOnly'));
                    }else{
                        shiftStaff.Long_Sleepover_Start_Time__c = null;
                        shiftStaff.Long_Sleepover_End_Time__c = null;
                        shiftStaff.Is_Long_SleepOver__c = false;
                        shiftStaff.Long_Sleepover_index__c=0;
                        shiftStaff.Long_Sleepover_Allowance__c = 0;
                        shiftStaff.Long_Sleepover_Duartion__c = 0;
                         shiftStaff.Is_Long_Sleepover_Next_Day_Start__c=false;
                        shiftStaff.Long_Sleepover_Start_Date__c=null;
                    }
                    
                    if (longShiftDetails.containsKey('Morning 2')) {
                        system.debug(' in morning 2');
                        Map<String, Object> morningShift = (Map<String, Object>) longShiftDetails.get('Morning 2');
                        system.debug(' in morning 2' +morningShift);
                        String startTimeString = (String) morningShift.get('startTime');
                        String endTimeString = (String) morningShift.get('endTime');
                        
                        shiftStaff.Long_Morning_Start_Time_Two__c = convertToTime(startTimeString);
                        shiftStaff.Long_Morning_End_Time_Two__c = convertToTime(endTimeString);
                        shiftStaff.Is_long_Morning_Shift_two__c = true;
                        shiftStaff.Long_Morning_Index_Two__c= integer.valueOf(morningShift.get('index'));
                        shiftStaff.Long_Morning_Rate_Two__c = Decimal.valueOf((String) morningShift.get('hourlyRate'));
                        shiftStaff.Long_Morning_Duartion_Two__c = Decimal.valueOf(String.valueOf(morningShift.get('duration')));
                        shiftStaff.Is_Long_Morning_Next_Day_Start_Two__c=((boolean)morningShift.get('isNextDayStart'));
                         shiftStaff.Long_Morning_Start_Date_Two__c=Date.valueOf((String)morningShift.get('startDateOnly'));
                    }else{
                        shiftStaff.Long_Morning_Start_Time_Two__c = null;
                        shiftStaff.Long_Morning_End_Time_Two__c = null;
                        shiftStaff.Is_long_Morning_Shift_two__c = false;
                        shiftStaff.Long_Morning_Index_Two__c=0;
                        shiftStaff.Long_Morning_Rate_Two__c = 0;
                        shiftStaff.Long_Morning_Duartion_Two__c =0;
                        shiftStaff.Is_Long_Morning_Next_Day_Start_Two__c=false;
                         shiftStaff.Long_Morning_Start_Date_Two__c=null;
                    }
                    
                    if (longShiftDetails.containsKey('Afternoon 2')) {
                        Map<String, Object> afternoonShift2 = (Map<String, Object>) longShiftDetails.get('Afternoon 2');
                        String startTimeString = (String) afternoonShift2.get('startTime');
                        String endTimeString = (String) afternoonShift2.get('endTime');
                        shiftStaff.Long_Afternoon_Start_Time_two__c = convertToTime(startTimeString);
                        shiftStaff.Long_afternoon_End_Time_Two__c = convertToTime(endTimeString);
                        shiftStaff.Is_Long_afternoon_shift_two__c = true;
                        shiftStaff.Long_Afternoon_Index_Two__c= integer.valueOf(afternoonShift2.get('index'));
                        shiftStaff.Long_Afternoon_Rate_Two__c = Decimal.valueOf((String) afternoonShift2.get('hourlyRate'));
                        shiftStaff.Long_Afternoon_Duration_Two__c = Decimal.valueOf(String.valueOf(afternoonShift2.get('duration')));
                         shiftStaff.Is_Long_Afternoon_Next_Day_Start_Two__c=((boolean)afternoonShift2.get('isNextDayStart'));
                         shiftStaff.Long_Afternoon_Start_Date_Two__c=Date.valueOf((String)afternoonShift2.get('startDateOnly'));
                    }else{
                        shiftStaff.Long_Afternoon_Start_Time_two__c = null;
                        shiftStaff.Long_afternoon_End_Time_Two__c = null;
                        shiftStaff.Is_Long_afternoon_shift_two__c = false;
                        shiftStaff.Long_Afternoon_Index_Two__c=0;
                        shiftStaff.Long_Afternoon_Rate_Two__c = 0;
                        shiftStaff.Long_Afternoon_Duration_Two__c = 0; 
                        shiftStaff.Is_Long_Afternoon_Next_Day_Start_Two__c=false;
                        shiftStaff.Long_Afternoon_Start_Date_Two__c=null;
                    }
                    
                    
                }
                
                shiftStaff.Index__c = rosterServiceMap.get(shift.RefId__c).index;
                shiftWithStaffList.add(shiftStaff);
                
                if (checkList != null && checkList.size() > 0) {
                    for (CheckListWrapper item : checkList) {
                        if (String.isNotEmpty(item.description)) {
                            Add_Shift_Checklist__c check;
                            if (checkListFlag && item.checkListId != null) {
                                check = new Add_Shift_Checklist__c(Id = item.checkListId);
                                checkListFlag = (shift.Do_you_want_to_set_this_a_recurring_shif__c == true || shift.Split_Shifts__c == true) ? false : true;
                            } else {
                                check = new Add_Shift_Checklist__c();
                            }
                            check.Description__c = item.description;
                            check.Mandatory__c = item.mandatory;
                            check.Add_Shift__c = shift.Id;
                            checklistRecords.add(check);
                        }
                    }
                }
            }
            
            if (!shiftWithStaffList.isEmpty()) {
                upsert shiftWithStaffList;
                
                Boolean isRecurring = addShiftsList[0].Do_you_want_to_set_this_a_recurring_shif__c;
                
                if (includeParticipants) {
                    Boolean callRecurringService = (isRecurring && shiftWithStaffUpdateFlag);
                    Boolean callNormalService = !callRecurringService;
                    
                    if (isSingleClass) {
                        String servicesResponse = RosterAddShiftService.createServices(rosterServiceMap, shiftWithStaffList, servceRecurFlag,RecurringWithIncludeAndNewParticipants);
                        Map<String, Object> servicesResponseMap = (Map<String, Object>) JSON.deserializeUntyped(servicesResponse);
                        
                        if (servicesResponseMap.containsKey('isSuccess') && (Boolean) servicesResponseMap.get('isSuccess')) {
                            response.put('isSuccess', true);
                            response.put('ServicesMessage', 'Service created successfully');
                        } else {
                            response.put('isSuccess', false);
                            response.put('ServiceErrormessage', 'Error in creating services: ' + servicesResponseMap.get('servicemessage'));
                        }
                    } else {
                        Map<String, Object> recurServiceResponse = RosterCreationRecuringService.createRecurringServices(shiftWithStaffId, shiftWithStaffList, recurringDates);
                        if (recurServiceResponse.containsKey('isSuccess') && (Boolean) recurServiceResponse.get('isSuccess')) {
                            response.put('isSuccess', true);
                            response.put('ServicesMessage', 'Service created successfully');
                        } else {
                            response.put('isSuccess', false);
                            response.put('ServiceErrormessage', 'Error in creating services: ' + recurServiceResponse.get('ServicesMessage'));
                        }
                    }
                }
                
                if(includeParticipants ==false &&RecurringWithIncludeAndNewParticipants ==true){
                      String servicesResponse = RosterAddShiftService.createServices(rosterServiceMap, shiftWithStaffList, servceRecurFlag,RecurringWithIncludeAndNewParticipants);
                      Map<String, Object> recurServiceResponse = RosterCreationRecuringService.createRecurringServices(shiftWithStaffId, shiftWithStaffList, recurringDates);
                        if (recurServiceResponse.containsKey('isSuccess') && (Boolean) recurServiceResponse.get('isSuccess')) {
                            response.put('isSuccess', true);
                            response.put('ServicesMessage', 'Service created successfully');
                        } else {
                            response.put('isSuccess', false);
                            response.put('ServiceErrormessage', 'Error in creating services: ' + recurServiceResponse.get('ServicesMessage'));
                        }
                    
                }
            }
            
            if (!checklistRecords.isEmpty()) {
                upsert checklistRecords;
            }
            
            response.put('isSuccess', true);
            response.put('shiftWithstaffMessage', 'Shift with staff processed successfully.');
            response.put('shiftwithStaffList', JSON.serialize(shiftWithStaffList));
        } catch (Exception e) {
            response.put('isSuccess', false);
            response.put('shiftWithstaffMessage', 'Failed to create shift with staff: ' + e.getMessage());
        }
        
        return JSON.serialize(response);
    }
    
    
    @AuraEnabled
    public static boolean getFatigueData(String staffId, String strtTimeText, String startdate) {
        boolean fatigueBoolean = false; // Default value to prevent null return
        List<ShiftwithStaff__c> allPreviousShifts = new List<ShiftwithStaff__c>();
        Time lastLogouttime;
        
        // Validate input parameters
        if (String.isBlank(staffId) || String.isBlank(strtTimeText) || String.isBlank(startdate)) {
            System.debug('One or more input values are null or empty.');
            return false;
        }
        
        // Convert string time to Time format
        Time startTime = AddShiftHandler.getTimeIn24HrFormat(strtTimeText);
        if (startTime == null) {
            System.debug('Invalid start time format.');
            return false;
        }
        
        // Fetch the last shift of the staff member
        allPreviousShifts = [
            SELECT Id, Staff__c, Duration__c, Log_Out_Date_Time__c, Add_Shift__r.End_Date__c  
            FROM ShiftwithStaff__c  
            WHERE Staff__c = :staffId  AND (Date__c = :Date.valueof(startdate )
                                            OR Date__c = :Date.valueof(startdate ) - 1)
            ORDER BY CreatedDate DESC
            LIMIT 1
        ];
        
        System.debug('Previous shifts: ' + allPreviousShifts);
        
        // If no previous shift found, return false
        if (allPreviousShifts.isEmpty()) {
            System.debug('No previous shifts found. No fatigue detected.');
            return false;
        }
        
        ShiftwithStaff__c lastShift = allPreviousShifts[0];
        
        // Ensure previous shift has required fields
        if (lastShift.Log_Out_Date_Time__c == null || lastShift.Add_Shift__r == null || lastShift.Add_Shift__r.End_Date__c == null) {
            System.debug('Previous shift data incomplete. No fatigue detected.');
            return false;
        }
        
        lastLogouttime = lastShift.Log_Out_Date_Time__c;
        
        // Convert start date and calculate time difference
        Date shiftDate = Date.valueOf(startdate);
        DateTime newShiftStartDateTime = DateTime.newInstanceGmt(shiftDate, startTime);
        DateTime prevShiftLogInDatetime = DateTime.newInstanceGmt(lastShift.Add_Shift__r.End_Date__c, lastLogouttime);
        
        System.debug('startTime: ' + startTime);
        System.debug('lastLogouttime: ' + lastLogouttime);
        System.debug('previous shift date: ' + lastShift.Add_Shift__r.End_Date__c);
        System.debug('shiftDate: ' + shiftDate);
        System.debug('newShiftStartDateTime: ' + newShiftStartDateTime);
        System.debug('prevShiftLogInDatetime: ' + prevShiftLogInDatetime);
        
        // Calculate time difference in hours
        Decimal timeDifferenceInMillis = Decimal.valueOf(newShiftStartDateTime.getTime() - prevShiftLogInDatetime.getTime());
        Decimal timeDifferenceInHours = timeDifferenceInMillis / (1000 * 60 * 60); // Convert to hours
        
        System.debug('Time Difference in Hours (Corrected): ' + timeDifferenceInHours);
        
        // Negative time difference means an invalid shift sequence
        if (timeDifferenceInHours < 0) {
            System.debug('Negative time difference detected! No fatigue.');
            return false;
        }
        
        // If the time difference is <= 8 hours, consider it fatigue
        if (timeDifferenceInHours <= 8) {
            fatigueBoolean = true;
        }
        
        return fatigueBoolean;
    }
    
    public class checkListWrapper{
        public string description;
        public boolean mandatory;
        public string checkListId;
    }
    
    
    // Wrapper classes
    public class addShiftWrapper {
        public addShiftAddressWrapper shiftaddress;
        public AddShiftBasicDetailsWrapper shiftDetails;
    }
    
    
    public class addShiftAddressWrapper {
        public String street;
        public String citySuburb;
        public String country;
        public String provinceState;
        public String postalcode;
        public Decimal latitude;
        public Decimal longitude;
        
    }
    
    public class AddShiftBasicDetailsWrapper {
        public Date AddShiftStartDate;
        public String AddShiftFacilityValue;
        public String AddShiftParticipantValue;
        public String AddShiftRole;
        public Time AddShiftStartTime;
        public String AddShiftStartTimeAMPM;
        public String AddShiftEndTimeAMPM;
        public string AddShiftStaffValue;
        public Time AddShiftEndTime;
        public String AddShiftType;
        public String AddShiftNotes;
        public integer AddShiftQuantity;
        public boolean AddShiftEOI;
        public decimal AddShiftDuration;
        public string AddShiftId;
        public boolean AddShiftHoliday;
        public boolean AddShiftEnterOtherLocation;
        public boolean AddShiftParticipantAddressCheckbox;
        public string selectedServiceInfoJson;
        public string AddShiftTypeName;
    }
    @AuraEnabled
    public static List<Funds_Tracker__c> getFundsData(list<string> fundsId){
        system.debug('fundsId >>'+ fundsId);
        List<Funds_Tracker__c> fundsList = [SELECT Id,Name, Available_Funds__c, Spent_Amt__c FROM Funds_Tracker__c WHERE Id IN :fundsId];
        return fundsList ;
        
    } 
    
    public static Time convertToTime(String timeString) {
        timeString = timeString.replace('Z', '');
        List<String> parts = timeString.split(':');
        
        return Time.newInstance(
            Integer.valueOf(parts[0]),
            Integer.valueOf(parts[1]),
            Integer.valueOf(parts[2]),
            0
        );
    }
    
    
    
    
}