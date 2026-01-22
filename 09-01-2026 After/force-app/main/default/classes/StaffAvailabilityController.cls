public with sharing class StaffAvailabilityController {
    @AuraEnabled(cacheable=true)
    public static Staff__c getstaffId(String userId){
        User user = [SELECT Id, Email FROM User WHERE Id = :userId LIMIT 1];
        
        List<Staff__c> staffList = [ SELECT Id, Email_Address__c FROM Staff__c WHERE Email_Address__c = :user.Email LIMIT 1];
        
        return staffList[0];     
    }
    
   @AuraEnabled
    public static void saveStaffData(
        Id avaliableId, String shiftDateStr, String shiftType, Boolean isRecurring, List<String> weeklyDays, 
        String startTime, String endTime, Id staffId, String endDate, String typeOfRecur, Integer recurEvery,
        Integer monthlyDay, String shfitEndDate, String shiftName, String validationData, List<String> originalDates,string availableValue
    ) {
        System.debug('🚀 Starting saveStaffData...');
        System.debug('shiftDateStr >>> ' + shiftDateStr);
        System.debug('shiftType >>> ' + shiftType);
        System.debug('isRecurring >>> ' + isRecurring);
        System.debug('weeklyDays >>> ' + weeklyDays);
        System.debug('startTime >>> ' + startTime);
        System.debug('endTime >>> ' + endTime);
        System.debug('staffId >>> ' + staffId);
        System.debug('endDate >>> ' + endDate);
        System.debug('typeOfRecur >>> ' + typeOfRecur);
        System.debug('recurEvery >>> ' + recurEvery);
        System.debug('monthlyDay >>> ' + monthlyDay);
        System.debug('shfitEndDate >>> ' + shfitEndDate);
        System.debug('shiftName >>> ' + shiftName);
        System.debug('originalDates >>> ' + originalDates);
        
        try {
            // Process validation data if provided
            List<Date> conflictDates = new List<Date>();
            if (String.isNotBlank(validationData)) {
                Map<String, Object> validationResult = (Map<String, Object>) JSON.deserializeUntyped(validationData);
                if (validationResult != null && !validationResult.isEmpty()) {
                    for (String staffIdKey : validationResult.keySet()) {
                        Map<String, Object> dateConflicts = (Map<String, Object>) validationResult.get(staffIdKey);
                        
                        if (dateConflicts != null && !dateConflicts.isEmpty()) {
                            for (String dateString : dateConflicts.keySet()) {
                                Date formattedDate = convertToApexDateFormat(dateString);
                                if (formattedDate != null) {
                                    conflictDates.add(formattedDate);
                                }
                            }
                        }
                    }
                }
            }
            System.debug('✅ Extracted conflict dates: ' + conflictDates);
            
            List<Availability__c> availabilityList = new List<Availability__c>();
            
            // Validate inputs before parsing
            if (String.isBlank(shiftDateStr)) {
                System.debug('⚠️ shiftDateStr is NULL or blank!');
            }
            if (String.isBlank(shfitEndDate)) {
                System.debug('⚠️ shfitEndDate is NULL or blank!');
            }
            
            Date shiftDate;
            Date shiftEndDate;
            try {
                shiftDate = convertDate(shiftDateStr);
                shiftEndDate = convertDate(shfitEndDate);
                System.debug('✅ Parsed Dates: shiftDate=' + shiftDate + ', shiftEndDate=' + shiftEndDate);
            } catch (Exception e1) {
                System.debug('❌ Date conversion failed. shiftDateStr=' + shiftDateStr + ', shfitEndDate=' + shfitEndDate + ', error=' + e1.getMessage());
                throw e1;
            }
            
            if (avaliableId != null) {
                System.debug('🔍 Fetching Availability__c record for update, Id=' + avaliableId);
                Availability__c availabilityRecord = [
                    SELECT Id, Staff__c, Shift_Type__c, Start_Time__c, End_Time__c, Start_Date__c 
                    FROM Availability__c 
                    WHERE Id = :avaliableId 
                    LIMIT 1
                ];
                System.debug('✅ Found existing record: ' + availabilityRecord);
                
                availabilityRecord.Shift_Type__c = shiftType;
                availabilityRecord.Start_Time__c = parseTime(startTime);
                availabilityRecord.End_Time__c = parseTime(endTime);
                availabilityRecord.Shift_Name__c = shiftName;
                 availabilityRecord.Type__c=availableValue;
                availabilityList.add(availabilityRecord);
            } else {
                System.debug('🆕 Creating new Availability__c record...');
                Availability__c availabilityRecord = new Availability__c();
                availabilityRecord.Staff__c = staffId;
                availabilityRecord.Shift_Type__c = shiftType;
                availabilityRecord.Start_Time__c = parseTime(startTime);
                availabilityRecord.End_Time__c = parseTime(endTime);
                availabilityRecord.Start_Date__c = shiftDate;
                availabilityRecord.End_Date__c = shiftEndDate;
                availabilityRecord.Shift_Name__c = shiftName;
                availabilityRecord.Type__c=availableValue;
                availabilityList.add(availabilityRecord);
            }
            
            if (isRecurring && originalDates != null && !originalDates.isEmpty()) {
                System.debug('🔄 Handling Recurring Logic with original dates...');
                
                // Convert original dates string list to Date list
                List<Date> originalDateList = new List<Date>();
                for (String dateStr : originalDates) {
                    try {
                        Date d = Date.valueOf(dateStr);
                        originalDateList.add(d);
                    } catch (Exception e) {
                        System.debug('❌ Invalid date in originalDates: ' + dateStr);
                    }
                }
                
                System.debug('📅 Original dates to process: ' + originalDateList.size());
                System.debug('📅 Conflict dates to skip: ' + conflictDates.size());
                
                Date mainShiftDate = shiftDate;
                
                // Loop through original dates and skip conflict dates
                for (Date recurrenceDate : originalDateList) {
                    // Skip if it's a conflict date
                    if (conflictDates.contains(recurrenceDate)) {
                        System.debug('⏭️ Skipping conflict date: ' + recurrenceDate);
                        continue;
                    }
                    
                    // Skip main shift date (already added above)
                    if (recurrenceDate == mainShiftDate) {
                        System.debug('⏭️ Skipping main shift date: ' + recurrenceDate);
                        continue;
                    }
                    
                    // Create availability record for this date
                    Availability__c recurringAvailability = new Availability__c();
                    recurringAvailability.Staff__c = staffId;
                    recurringAvailability.Shift_Type__c = shiftType;
                    recurringAvailability.Start_Time__c = parseTime(startTime);
                    recurringAvailability.End_Time__c = parseTime(endTime);
                    recurringAvailability.Start_Date__c = recurrenceDate;
                    recurringAvailability.Shift_Name__c = shiftName;
                     recurringAvailability.Type__c=availableValue;
                    availabilityList.add(recurringAvailability);
                    System.debug('✅ Added recurring availability for date: ' + recurrenceDate);
                }
            }
            
            if (!availabilityList.isEmpty()) {
                upsert availabilityList;
                System.debug('✅ Upserted availability records: ' + availabilityList.size());
            } else {
                System.debug('⚠️ No availability records to save.');
            }
        } catch (Exception e) {
            System.debug('❌ Exception: ' + e.getMessage());
            System.debug('❌ Line number: ' + e.getStackTraceString());
        }
    }
    public static Date convertToApexDateFormat(String jsDateString) {
    try {
        // If already in YYYY-MM-DD format, convert to Date
        if (jsDateString.contains('-') && jsDateString.length() == 10) {return Date.valueOf(jsDateString);}
        
        // Convert from "Tue Oct 14 00:00:00 GMT 2025" to Date object
        List<String> dateParts = jsDateString.split(' ');
        if (dateParts.size() >= 6) {
            String monthName = dateParts[1]; // Oct
            String dayNumber = dateParts[2]; // 14
            String year = dateParts[5]; // 2025
            
            Map<String, String> monthMap = new Map<String, String>{
                'Jan' => '01', 'Feb' => '02', 'Mar' => '03', 'Apr' => '04',
                'May' => '05', 'Jun' => '06', 'Jul' => '07', 'Aug' => '08',
                'Sep' => '09', 'Oct' => '10', 'Nov' => '11', 'Dec' => '12'
            };
            
            String monthNumber = monthMap.get(monthName);
            if (monthNumber != null) {
                // Pad day with leading zero if needed
                if (dayNumber.length() == 1) {
                    dayNumber = '0' + dayNumber;
                }
                
                String dateString = year + '-' + monthNumber + '-' + dayNumber;
                return Date.valueOf(dateString);
            }
        }
        
        return null;
        
    } catch (Exception e) {
        System.debug('❌ Error converting date: ' + jsDateString);
        return null;
    }
}
    
    @AuraEnabled
    public static Availability__c handleSelectedAvailability(String availabilityId) {
        // Your logic here
        System.debug('Received Availability Id: ' + availabilityId);
        return [SELECT Id, Staff__c, Shift_Type__c, Start_Time__c, End_Time__c, Start_Date__c 
                FROM Availability__c 
                WHERE Id = :availabilityId 
                LIMIT 1];
    }
    
    Public static  list<Date> preventDuplicates(Date startDate,Date endDate, string strtTimeText, string endTimeText,String StaffId,list<Object> recurringDates,string shiftType){
        Time startTime = AddShiftHandler.getTimeIn24HrFormat(strtTimeText.toLowerCase());
        Time endTime = AddShiftHandler.getTimeIn24HrFormat(endTimeText.toLowerCase());
        list<Date>FinalRecurDates = new list<Date>();
        system.debug('recurringDates  '+recurringDates);
        system.debug('StaffId  '+StaffId);
        List<Date> castedDates = new List<Date>();
        for (Object obj : recurringDates) {
            if (obj instanceof Date) {
                castedDates.add((Date)obj);
            }
        }
        //  castedDates.add(castedDates[0].addDays(-1));
        list<Availability__c> existingAvail=[ SELECT Id, Start_Date__c, End_Date__c, Start_Time__c, End_Time__c
                                             FROM Availability__c  where  Start_Date__c IN :castedDates and staff__c =:StaffId];
        
        List<ShiftwithStaff__c> weekShifts = [
            SELECT Duration__c, Date__c, Staff__c, Staff__r.Email_Address__c,Start_Time__c,End_Time__c,End_Date__c,
            Type_of_Shift__c, Attendence__c, Staff__r.Set_Hours__c,
            Staff__r.Restrict_Set_Hours__c, Status__c
            FROM ShiftwithStaff__c
            WHERE Staff__c = :staffId
            AND Date__c IN :castedDates 
        ];
        
        for(Date RD : castedDates){
            Boolean isOverlapping = false;
            
            Date adjustedEndDate = ShiftDateCalculator.getAdjustedDate(RD,shiftType,startTime,endTime);
            
            DateTime recurStart = DateTime.newInstanceGMT(RD,startTime);
            DateTime recurEnd = DateTime.newInstanceGMT(adjustedEndDate, endTime);
            system.debug('newStartDateTime  '+recurStart);
            system.debug('newEndDateTime  '+recurEnd);
            
            for(Availability__c aval : existingAvail){
                if(RD == aval.Start_Date__c){
                    DateTime shiftStart = DateTime.newInstanceGMT(aval.Start_Date__c, aval.Start_Time__c);
                    DateTime shiftEnd = DateTime.newInstanceGMT(aval.End_Date__c, aval.End_Time__c);
                    if(isShiftOverlap(recurStart, recurEnd, shiftStart, shiftEnd)){
                        // isUpdating=true;
                        isOverlapping = true;
                        break;
                    }
                }
            }
            
            for(ShiftwithStaff__c shift : weekShifts){
                if(RD == shift.Date__c){
                    DateTime shiftStart = DateTime.newInstanceGMT(shift.Date__c, shift.Start_Time__c);
                    DateTime shiftEnd = DateTime.newInstanceGMT(shift.End_Date__c, shift.End_Time__c);
                    if(isShiftOverlap(recurStart, recurEnd, shiftStart, shiftEnd)){
                        // isUpdating=true;
                        isOverlapping = true;
                        break;
                    }
                }
            }
            
            if(!isOverlapping){
                FinalRecurDates.add(RD);     
            }
        }
        return  FinalRecurDates;
    }
    
    public static Time parseTime1(String timeStr) {
        System.debug('🔍 Parsing time: ' + timeStr);
        timeStr = timeStr.trim().toLowerCase();
        
        Boolean isPM = timeStr.endsWith('pm');
        Boolean isAM = timeStr.endsWith('am');
        
        if (!isPM && !isAM) {
            throw new IllegalArgumentException('Time must end with AM or PM');
        }
        
        timeStr = timeStr.replace('am', '').replace('pm', '').trim();
        List<String> parts = timeStr.split(':');
        
        Integer hour = Integer.valueOf(parts[0].trim());
        Integer minute = (parts.size() > 1) ? Integer.valueOf(parts[1].trim()) : 0;
        
        if (isPM && hour < 12) hour += 12;
        if (isAM && hour == 12) hour = 0;
        
        Time result = Time.newInstance(hour, minute, 0, 0);
        System.debug('✅ Parsed Time: ' + result);
        return result;
    } 
    
    public static List<Map<String, Object>> processFinalDates(
        List<Date> inputDates,
        Id staffId,
        String startTime,
        String endTime,
        String IsAvailability
    ) {
        System.debug('🔽 START processFinalDates 🔽');
        List<Map<String, Object>> processedDateRanges = new List<Map<String, Object>>();
        if (inputDates == null || inputDates.isEmpty()) return processedDateRanges;
        
        // Parse times
        Time parsedStart = AddShiftHandler.getTimeIn24HrFormat(startTime.toLowerCase());
        Time parsedEnd = AddShiftHandler.getTimeIn24HrFormat(endTime.toLowerCase());
        if (parsedStart == null || parsedEnd == null) {
            System.debug('❌ Invalid start or end time.');
            return processedDateRanges;
        }
        
        Decimal fixedDailyDuration = Decimal.valueOf(
            DateTime.newInstance(Date.today(), parsedEnd).getTime() -
            DateTime.newInstance(Date.today(), parsedStart).getTime()
        ) / (1000 * 60 * 60);
        System.debug('🕐 Fixed Daily Duration: ' + fixedDailyDuration + ' hours');
        
        // ------------------------------------------------------------------
        // 1. Compute all week start/end ranges up front
        // ------------------------------------------------------------------
        Map<String, Date> weekStartMap = new Map<String, Date>();
        Map<String, Date> weekEndMap = new Map<String, Date>();
        Map<String, List<Date>> weekToDates = new Map<String, List<Date>>();
        
        for (Date d : inputDates) {
            Integer dow = Integer.valueOf(DateTime.newInstance(d, Time.newInstance(0,0,0,0)).format('u'));
            Date weekStart = d.addDays(-(dow - 1));
            Date weekEnd = weekStart.addDays(6);
            String weekKey = String.valueOf(weekStart);
            
            if (!weekToDates.containsKey(weekKey)) {
                weekToDates.put(weekKey, new List<Date>());
                weekStartMap.put(weekKey, weekStart);
                weekEndMap.put(weekKey, weekEnd);
            }
            weekToDates.get(weekKey).add(d);
        }
        
        // ------------------------------------------------------------------
        // 2. Find earliest and latest date in inputDates
        // ------------------------------------------------------------------
        Date globalStart = inputDates[0];
        Date globalEnd   = inputDates[0];
        for (Date d : inputDates) {
            if (d < globalStart) globalStart = d;
            if (d > globalEnd)   globalEnd = d;
        }
        
        // ------------------------------------------------------------------
        // 3. Bulk query shifts and availabilities (only once)
        // ------------------------------------------------------------------
        List<ShiftwithStaff__c> allShifts = [
            SELECT Duration__c, Date__c, Staff__c, Type_of_Shift__c, Attendence__c,
            Staff__r.Set_Hours__c, Staff__r.Restrict_Set_Hours__c, Status__c
            FROM ShiftwithStaff__c
            WHERE Staff__c = :staffId
            AND Date__c >= :globalStart AND Date__c <= :globalEnd
            AND Type_of_Shift__c != 'Sleepover Shift'
            AND Status__c != 'Unassigned'
            AND Attendence__c = true
        ];
        
        List<Availability__c> allAvailabilities = [
            SELECT Start_Date__c, Start_Time__c, End_Time__c, Shift_Type__c
            FROM Availability__c
            WHERE Staff__c = :staffId
            AND Start_Date__c >= :globalStart AND Start_Date__c <= :globalEnd
            AND Shift_Type__c != 'Sleepover Shift'
        ];
        
        // ------------------------------------------------------------------
        // 4. Query Staff once
        // ------------------------------------------------------------------
        Staff__c staff = [
            SELECT Id, Restrict_Set_Hours__c, Set_Hours__c
            FROM Staff__c
            WHERE Id = :staffId LIMIT 1
        ];
        Decimal setHours = staff.Set_Hours__c != null ? staff.Set_Hours__c : 0;
        Boolean restrict = staff.Restrict_Set_Hours__c;
        
        // ------------------------------------------------------------------
        // 5. Process each week in-memory (same as before)
        // ------------------------------------------------------------------
        for (String weekKey : weekToDates.keySet()) {
            Date weekStart = weekStartMap.get(weekKey);
            Date weekEnd = weekEndMap.get(weekKey);
            List<Date> weekDates = weekToDates.get(weekKey);
            
            Decimal existingShiftDuration = 0;
            
            // Shifts in this week
            for (ShiftwithStaff__c s : allShifts) {
                if (s.Date__c >= weekStart && s.Date__c <= weekEnd) {
                    existingShiftDuration += (s.Duration__c != null) ? s.Duration__c : 0;
                }
            }
            
            // Availability in this week
            for (Availability__c a : allAvailabilities) {
                if (a.Start_Date__c >= weekStart && a.Start_Date__c <= weekEnd &&
                    a.Start_Time__c != null && a.End_Time__c != null) {
                        try {
                            DateTime startDT = DateTime.newInstance(Date.today(), a.Start_Time__c);
                            DateTime endDT = DateTime.newInstance(Date.today(), a.End_Time__c);
                            Decimal duration = (Decimal.valueOf(endDT.getTime() - startDT.getTime()) / (1000 * 60 * 60));
                            existingShiftDuration += duration;
                        } catch (Exception e) {
                            System.debug('❌ Error parsing availability: ' + e.getMessage());
                        }
                    }
            }
            
            // Now evaluate dates in this week
            Decimal totalDuration = 0;
            List<Date> allowedDates = new List<Date>();
            
            for (Date singleDate : weekDates) {
                Integer dow = Integer.valueOf(DateTime.newInstance(singleDate, Time.newInstance(0, 0, 0, 0)).format('u'));
                Boolean isWeekend = (dow == 6 || dow == 7);
                
                Decimal projected = existingShiftDuration + totalDuration + fixedDailyDuration;
                if (!isWeekend && restrict && setHours > 0 && projected > setHours) {
                    System.debug('🚫 ' + singleDate + ' skipped: would exceed set hours.');
                    continue;
                }
                
                totalDuration += fixedDailyDuration;
                allowedDates.add(singleDate);
            }
            
            if (!allowedDates.isEmpty()) {
                Map<String, Object> resultMap = new Map<String, Object>();
                resultMap.put('originalWeekDates', allowedDates);
                resultMap.put('weekStart', weekStart);
                resultMap.put('weekEnd', weekEnd);
                resultMap.put('totalDuration', totalDuration.setScale(2));
                resultMap.put('calculatedDuration', totalDuration.setScale(2));
                processedDateRanges.add(resultMap);
                
                System.debug('✅ Allowed Dates for Week: ' + allowedDates);
            } else {
                System.debug('⚠️ No allowed dates in week of ' + weekStart);
            }
        }
        
        System.debug('🏁 Finished Processing: ' + processedDateRanges.size() + ' week(s)');
        return processedDateRanges;
    }
    
    
    
    public static Boolean isShiftOverlap(DateTime recurStart, DateTime RecurEnd, DateTime ShiftStart, DateTime ShiftEnd){
        return (recurStart < ShiftEnd && ShiftStart < RecurEnd);
    }
    
    public static Date parseDate(String dateStr) {
        // Split the date string by "/"
        String[] dateParts = dateStr.split('/');
        
        // Get day, month, and year
        Integer day = Integer.valueOf(dateParts[0]);
        Integer month = Integer.valueOf(dateParts[1]);
        Integer year = Integer.valueOf(dateParts[2]);
        
        // Return the Date object in "yyyy-MM-dd" format
        return Date.newInstance(year, month, day);
    }
    
    public static Date convertDate(String dateStr) {
        List<String> dateParts = dateStr.split('/');
        Integer day = Integer.valueOf(dateParts[0]);
        Integer month = Integer.valueOf(dateParts[1]);
        Integer year = Integer.valueOf(dateParts[2]);
        return Date.newInstance(year, month, day);
    }    
    
    public static Time convertToTime(String timeStr) {
        if (String.isBlank(timeStr)) {
            return Time.newInstance(0, 0, 0, 0); // default to midnight
        }
        
        // Split the string into time and AM/PM
        List<String> parts = timeStr.trim().split(' ');
        if (parts.size() != 2) return null;
        
        String timePart = parts[0];
        String amPmPart = parts[1].toUpperCase();
        
        List<String> hm = timePart.split(':');
        Integer hour = Integer.valueOf(hm[0]);
        Integer minute = hm.size() > 1 ? Integer.valueOf(hm[1]) : 0;
        
        // Convert to 24-hour format
        if (amPmPart == 'PM' && hour != 12) hour += 12;
        if (amPmPart == 'AM' && hour == 12) hour = 0;
        
        return Time.newInstance(hour, minute, 0, 0);
    }   
    
    @AuraEnabled(cacheable=true)
    public static List<Availability__c> getServicesAndSupportPlansByDate(Id userId, String datePicker) {
        // Parse the passed string date to a Date object
        Date selectedDate;
        try {
            selectedDate = Date.valueOf(datePicker); // expects format 'YYYY-MM-DD'
            System.debug('selectedDate ==> ' + selectedDate);
        } catch (Exception e) {
            throw new AuraHandledException('Invalid date format provided: ' + datePicker);
        }
        
        // Step 1: Get the User's email
        User us = [SELECT Id, Email FROM User WHERE Id = :userId LIMIT 1];
        System.debug('userId ==> ' + userId);
        System.debug('userEmail ==> ' + us.Email);
        
        // Step 2: Get matching Staff__c using Email
        List<Staff__c> matchingStaffList = [
            SELECT Id, Name, Email_Address__c
            FROM Staff__c
            WHERE Email_Address__c = :us.Email
            LIMIT 1
        ];
        
        if (matchingStaffList.isEmpty()) {
            throw new AuraHandledException('No matching staff found for user email: ' + us.Email);
        }
        
        Id staffId = matchingStaffList[0].Id;
        System.debug('Matched Staff Id ==> ' + staffId);
        
        // Step 3: Query Availability__c for the selected date and matched staff
        List<Availability__c> availabilityList = [
            SELECT Id, Name, Start_Date__c, Start_Time__c, End_Time__c, Shift_Type__c, Staff__r.Name, Staff__c
            FROM Availability__c
            WHERE Staff__c = :staffId
            AND Start_Date__c = :selectedDate
        ];
        
        return availabilityList;
    }    
    
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getServiceType(Id clientId) {
        List<Map<String, String>> options = new List<Map<String, String>>();
        
        // Replace with your actual query logic
        for (Funds_Tracker__c c : [SELECT Id, Name FROM Funds_Tracker__c WHERE Client__c = :clientId  AND Status__c = 'Active'
           ]) {
            options.add(new Map<String, String>{
                'label' => c.Name,
                    'value' => c.Id
                    });
        }
        system.debug('options >> '+options);
        return options;   
        
    }
    
    /* @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getStaffOptions(String role, Id participantId) {
         System.debug('getStaffOptions CALLED with => role: ' + role + ', participantId: ' + participantId);
        // Step 1: Get related Participant_Staff_Association__c records for the given participant
        List<Participant_Staff_Association__c> psaRecords = [
            SELECT Staff__c, Staff__r.Name,Active__c
            FROM Participant_Staff_Association__c
            WHERE Participant__c = :participantId AND Role__c =:role AND Active__c = true
        ];
        system.debug(' psaRecords ==> '+psaRecords);
        
        // Step 2: Collect Staff IDs
        Set<Id> staffIds = new Set<Id>();
        for (Participant_Staff_Association__c psa : psaRecords) {
            staffIds.add(psa.Staff__c);
        }
        system.debug(' staffIds ==> '+staffIds);        
        // Step 3: Query Staff__c based on ID and Role
        //List<Staff__c> staffRecords = [
        //    SELECT Id, Name, Role__c, Last_Name__c, Classification_Level__c, SCR__c,Class_and_Paypont__c
        //    FROM Staff__c
        //    WHERE Id IN :staffIds 
        //];

        List<Staff__c> staffRecords = [
            SELECT Id, Name, Role__c, Last_Name__c, (Select Id, RoleName__c, Class_and_Paypont__c, Classification_Level__c From StaffRoles__r Where RoleName__c =: role), SCR__c
            FROM Staff__c
            WHERE Id IN :staffIds 
        ];
        
        // Step 4: Prepare data as List<Map<String, String>>
        List<Map<String, String>> results = new List<Map<String, String>>();
        for (Staff__c staff : staffRecords) {
            Map<String, String> staffData = new Map<String, String>();
            staffData.put('Id', staff.Id);
            staffData.put('Name', staff.Name);
            staffData.put('LastName', staff.Last_Name__c);
            staffData.put('Role', staff.Role__c);
            staffData.put('ClassicLevel', String.valueOf(staff.Classification_Level__c));
            staffData.put('SCR', String.valueOf(staff.SCR__c));
            staffData.put('ClassicLevelPoints', staff.Class_and_Paypont__c);
            results.add(staffData);
        }
        
        return results;
    } */

    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getStaffOptions(String role, Id participantId) {
        System.debug('getStaffOptions CALLED with => role: ' + role + ', participantId: ' + participantId);
    
        // Step 1: Get related Participant_Staff_Association__c records for the given participant
        List<Participant_Staff_Association__c> psaRecords = [
            SELECT Staff__c, Staff__r.Name, Active__c
            FROM Participant_Staff_Association__c
            WHERE Participant__c = :participantId
            AND Role__c = :role
            AND Active__c = true
        ];
        System.debug('🔹 psaRecords ==> ' + psaRecords);
    
        // Step 2: Collect Staff IDs
        Set<Id> staffIds = new Set<Id>();
        for (Participant_Staff_Association__c psa : psaRecords) {
            if (psa.Staff__c != null) {
                staffIds.add(psa.Staff__c);
            }
        }
        System.debug('🔹 staffIds ==> ' + staffIds);
    
        if (staffIds.isEmpty()) {
            System.debug('⚠️ No staff found for the given participant and role.');
            return new List<Map<String, String>>();
        }
    
        // Step 3: Query Staff__c records and related StaffRoles__r records
        List<Staff__c> staffRecords = [
            SELECT Id,
                   Name,
                   Last_Name__c,
                   Role__c,
                   SCR__c,
                   Gender__c,
                   Nationality__c,
                   Languages__c,
                   (SELECT Id, RoleName__c, Class_and_Paypont__c, Classification_Level__c
                    FROM StaffRoles__r
                    WHERE RoleName__c = :role)
            FROM Staff__c
            WHERE Id IN :staffIds
        ];
    
        System.debug('🔹 staffRecords ==> ' + staffRecords);
    
        // Step 4: Prepare data as List<Map<String, String>>
        List<Map<String, String>> results = new List<Map<String, String>>();
    
        for (Staff__c staff : staffRecords) {
            Map<String, String> staffData = new Map<String, String>();
            staffData.put('Id', staff.Id);
            staffData.put('Name', staff.Name);
            staffData.put('LastName', staff.Last_Name__c);
            staffData.put('Role', staff.Role__c); 
            staffData.put('SCR', String.valueOf(staff.SCR__c));
    
            // ✅ Newly added fields
            staffData.put('Gender', staff.Gender__c);
            staffData.put('Nationality', staff.Nationality__c);
            staffData.put('Languages', staff.Languages__c);
    
            // Handle related StaffRoles__r values safely
            if (staff.StaffRoles__r != null && !staff.StaffRoles__r.isEmpty()) {
                StaffRole__c roleRec = staff.StaffRoles__r[0]; 
                staffData.put('ClassicLevel', String.valueOf(roleRec.Classification_Level__c)); 
                staffData.put('ClassicLevelPoints', String.valueOf(roleRec.Class_and_Paypont__c)); 
            } else {
                staffData.put('ClassicLevel', '');
                staffData.put('ClassicLevelPoints', '');
            }
    
            results.add(staffData);
        }
    
        System.debug('✅ Final results => ' + results);
        return results;
    }


    
  public class CatalogueDataWrapper {
        @AuraEnabled public List<NDIS_Support_Catalogue__c> catalogueData { get; set; }
        @AuraEnabled public String statesCombined { get; set; }
        @AuraEnabled public Decimal amount { get; set; }
        @AuraEnabled public string  editedCatalogName{ get; set; }
        
        public CatalogueDataWrapper(List<NDIS_Support_Catalogue__c> catalogueData, String statesCombined,Decimal amount,string editedCatalogName) {
            this.catalogueData = catalogueData;
            this.statesCombined = statesCombined;
            this.amount = amount;
            this.editedCatalogName=editedCatalogName;
        }
    } 
    
    
    @AuraEnabled
    public static CatalogueDataWrapper getCatalogueData(string serviceType, string clientId) { 
        System.debug('serviceType >>' + serviceType);
        System.debug('clientId >>' + clientId);
        
        List<ClientFundTrackerJN__c> supportItems = [
            SELECT Id, NDIS_Support_Catalogue__c, Participant__c, Funds_Tracker__c, Funds_Tracker__r.State__c ,Amount__c,Edited_Catelog_Name__c
            FROM ClientFundTrackerJN__c 
            WHERE Participant__c = :clientId AND Funds_Tracker__c = :serviceType
        ];
        
        System.debug('Support Items: ' + supportItems);
        System.debug('State from Support Item: ' + supportItems[0].Funds_Tracker__r.State__c);
        
        String statesCombined = supportItems[0].Funds_Tracker__r.State__c;
        System.debug('statesCombined: ' + statesCombined);
        
        List<String> supportItemIds = new List<String>();
        for (ClientFundTrackerJN__c item : supportItems) {
            supportItemIds.add(item.NDIS_Support_Catalogue__c);
        }
        
        List<NDIS_Support_Catalogue__c> listNDISCatalog = [SELECT ID,Name,Support_Item_Name__c,Support_Category_Number__c,Start_Date__c,ACT__c,
                                                           NSW__c,NT__c,QLD__c,SA__c,TAS__c,VIC__c,WA__c,Support_Item_Number__c,
                                                           Available_fund__c 
                                                           from NDIS_Support_Catalogue__c Where Id IN:supportItemIds];
        
        //List<NDIS_Support_Catalogue__c> listNDISCatalog = Database.query(queryStr);
        System.debug('Number of records found: ' + listNDISCatalog.size());
        System.debug('List of NDIS Support Catalog: ' + listNDISCatalog);
        
        // Step 3: Return both the catalogue data and the state combined
        return new CatalogueDataWrapper(listNDISCatalog, statesCombined,supportItems[0].Amount__c,supportItems[0].Edited_Catelog_Name__c); 
    }
    
    
    @AuraEnabled
    public static void saveShiftData(Map<String, Object> shiftData) {
        try {
            
            System.debug('>> Processing shift data: ' + shiftData);
            System.debug('>> Processing shift data: ' + Date.valueOf((String)shiftData.get('todayDate')));
            List<Object> roleRows1 = (List<Object>)shiftData.get('staffList');
            
            system.debug('street >>'+ shiftData.get('street'));
            system.debug('country >>'+ shiftData.get('country'));
            system.debug('city >>'+ shiftData.get('city'));
            system.debug('province >>'+ shiftData.get('province'));
            system.debug('postalCode >>'+ shiftData.get('postalCode'));
            system.debug('Address Type >>'+ shiftData.get('AdddressType'));
            system.debug('Shift Name Type >>'+ shiftData.get('shiftName'));
            system.debug('Quantity >>'+ shiftData.get('Quantity'));
            
            
            for (Object roleRow : roleRows1) {
                Map<String, Object> roleData = (Map<String, Object>)JSON.deserializeUntyped(JSON.serialize(roleRow));
                System.debug('>> Role Data: ' + roleData);
                //String roleName = (String)shiftData.get('roleId');
                //System.debug('>> Role Name: ' + roleName);
            }
            
            
            if (shiftData.containsKey('recurringChecked') && (Boolean)shiftData.get('recurringChecked')) {
                System.debug('>> Handling recurring shift for clientId: ' + shiftData.get('clientId'));
                
                String typeOfRecur = (String)shiftData.get('recurringType');
                System.debug('>> Recurrence type: ' + typeOfRecur);
                
                Integer recurEvery;
                if (shiftData.containsKey('recurEvery') && shiftData.get('recurEvery') != null) {
                    String recurEveryStr = (String)shiftData.get('recurEvery');
                    if (String.isNotBlank(recurEveryStr)) {
                        recurEvery = Integer.valueOf(recurEveryStr);
                        System.debug('>> Recurrence every: ' + recurEvery);
                    }
                }
                
                String endDate = (String)shiftData.get('recurEndDate');
                System.debug('>> Recurrence end date: ' + endDate);
                
                String shiftDate = String.valueOf(Date.valueOf((String)shiftData.get('todayDate')));
                System.debug('>> Shift start date: ' + shiftDate);
                
                List<String> weeklyDays = new List<String>();
                if (shiftData.containsKey('selectedDays') && shiftData.get('selectedDays') != null) {
                    List<Object> rawList = (List<Object>) shiftData.get('selectedDays');
                    for (Object obj : rawList) {
                        if (obj != null) weeklyDays.add((String)obj);
                    }
                }
                System.debug('>> Selected weekly days: ' + weeklyDays);
                
                Integer monthlyDay;
                List<String> monthDayList = new List<String>();
                if (shiftData.containsKey('monthOfDay') && shiftData.get('monthOfDay') != null) {
                    Object rawValue = shiftData.get('monthOfDay');
                    if (rawValue instanceof String) {
                        monthDayList.add((String)rawValue);
                    } else if (rawValue instanceof List<Object>) {
                        for (Object obj : (List<Object>)rawValue) {
                            if (obj != null) monthDayList.add((String)obj);
                        }
                    }
                }
                if (!monthDayList.isEmpty() && String.isNotBlank(monthDayList[0])) {
                    monthlyDay = Integer.valueOf(monthDayList[0]);
                }
                System.debug('>> Selected monthly day: ' + monthlyDay);
                
                List<Map<String, Object>> roleRows = new List<Map<String, Object>>();
                if (shiftData.containsKey('roleRows') && shiftData.get('roleRows') != null) {
                    List<Object> rawList = (List<Object>) shiftData.get('roleRows');
                    for (Object item : rawList) {
                        Map<String, Object> rowMap = (Map<String, Object>) JSON.deserializeUntyped(JSON.serialize(item));
                        roleRows.add(rowMap);
                    }
                }
                System.debug('>> Role rows data: ' + roleRows);
                
                Map<String, Object> getRecurOccurrences = RosterCreationRecurringHnadler.getNumberOfRecurrences(
                    typeOfRecur, recurEvery, endDate, shiftDate, weeklyDays, monthlyDay
                );
                System.debug('>> Recurrence dates: ' + getRecurOccurrences);
                
                List<Availability__c> availabilitiesToInsert = new List<Availability__c>();
                //List<Priority_Staff__c> priorityStaffToInsert = new List<Priority_Staff__c>();
                
                List<Object> recurDates = (List<Object>) getRecurOccurrences.get('RecurrenceDates');
                System.debug('>> Recurrence dates extracted: ' + recurDates);
                String AvailableId = shiftData.containsKey('availabilityId') && shiftData.get('availabilityId') != null
                    ? (String)shiftData.get('availabilityId')
                    : null;
                system.debug('AvailableId >>'+AvailableId);
                for (Object dateObj : recurDates) {
                    System.debug('dateObj >> ' + dateObj);
                    System.debug('shiftDate >> ' + shiftDate);
                    //Date shiftDate = convertDate(shiftDate);
                    String shiftDateFormatted = String.valueOf(shiftDate);
                    Datetime dt = Datetime.valueOf(shiftDate + ' 00:00:00');
                    String localTime = dt.format('yyyy-MM-dd HH:mm:ss');
                    System.debug('Formatted Local Time >> ' + localTime);
                    if (AvailableId == null || (date.valueOf(dateObj) != null && date.valueOf(dateObj) != date.valueOf(shiftDateFormatted))) {
                        //System.debug('>> Processing date: ' + dateObj);
                        Availability__c availability = new Availability__c();
                        availability.Participant__c = (Id)shiftData.get('clientId');
                        availability.Shift_Type__c = (String)shiftData.get('shiftType');
                        availability.Start_Time__c = parseTime((String)shiftData.get('startTime'));
                        availability.End_Time__c = parseTime((String)shiftData.get('endTime'));
                        availability.Start_Date__c = Date.valueOf(dateObj);
                        availability.Address__Street__s = (String)shiftData.get('street');
                        availability.Address__PostalCode__s = (String)shiftData.get('postalCode');
                        availability.Address__StateCode__s = (String)shiftData.get('province');
                        availability.Address__CountryCode__s = 'AU';
                        availability.Address__City__s  =   (String)shiftData.get('city');
                        availability.Geo_Location__Latitude__s = (Decimal)shiftData.get('LocationLatitude');
                        availability.Geo_Location__Longitude__s = (Decimal)shiftData.get('LocationLongitude');
                        availability.Address_Type__c  = (String)shiftData.get('AdddressType');
                        availability.Shift_Name__c = (String)shiftData.get('shiftName');
                          availability.Facility__c = (String)shiftData.get('facility');
                        //availability.Quantity__c =(String)shiftData.get('quantity') !=null && (String)shiftData.get('quantity') !=''  ?Decimal.valueof((String)shiftData.get('quantity')) :1;
                        
                      try {
    Object qtyVal = shiftData.get('quantity');
    // ✅ Safely log value and type using String.valueOf()
    System.debug('✅ Raw qtyVal value: ' + String.valueOf(qtyVal) +
                 ', Type check → Decimal: ' + (qtyVal instanceof Decimal) +
                 ', Integer: ' + (qtyVal instanceof Integer) +
                 ', String: ' + (qtyVal instanceof String));

    if (qtyVal == null) {
        availability.Quantity__c = 1;
    } else if (qtyVal instanceof Decimal) {
        availability.Quantity__c = (Decimal) qtyVal;
    } else if (qtyVal instanceof Integer) {
        availability.Quantity__c = Decimal.valueOf((Integer) qtyVal);
    } else if (qtyVal instanceof String && String.isNotBlank((String) qtyVal)) {
        availability.Quantity__c = Decimal.valueOf((String) qtyVal);
    } else {
        availability.Quantity__c = 1;
    }

    System.debug('✅ Final Quantity__c: ' + availability.Quantity__c);
} catch (Exception e) {
    System.debug('❌ Quantity Handling Exception → ' + e.getMessage());
}



                        if (shiftData.containsKey('serviceTypeId')) availability.Funds_Tracker__c = (Id)shiftData.get('serviceTypeId');
                        if (shiftData.containsKey('regionState')) availability.State__c = (String)shiftData.get('regionState');
                        if (shiftData.containsKey('catalogId')) availability.NDIS_Support_Catalogue__c = (Id)shiftData.get('catalogId');
                       if (shiftData.containsKey('roleId')) availability.Role__c = (String)shiftData.get('roleId');
                         if (shiftData.containsKey('editedUnitPrice')) availability.Edited_Unit_Price__c =Decimal.valueof((String)shiftData.get('editedUnitPrice'));
                        
                        availabilitiesToInsert.add(availability);
                        System.debug('>> Added Availability record to insert: ' + availability);
                    }
                }
                
                System.debug('>> Inserting Availability__c records: ' + availabilitiesToInsert);
                insert availabilitiesToInsert;
                System.debug('>> Role rows data: 590 ' + roleRows1);
                Map<String, Priority_Staff__c> priorityStaffMap = new Map<String, Priority_Staff__c>();
                Map<Id, Priority_Staff__c> psMap = new Map<Id, Priority_Staff__c>();
                List<Priority_Staff__c> priorityStaffToInsert = new List<Priority_Staff__c>();
                Set<Id> usedIds = new Set<Id>();
                
                // Ensure Availability__c records are already inserted and have IDs
                for (Availability__c avail : availabilitiesToInsert) {
                    Integer i = 1; // Reset priority for each availability
                    Integer rowIndex = 0; // Track index of roleRows per availability
                    
                    for (Object roleRow : roleRows1) {
                        Map<String, Object> roleData = (Map<String, Object>)JSON.deserializeUntyped(JSON.serialize(roleRow));
                        System.debug('roleData >> ' + roleData);
                        
                        String staffId = (String)roleData.get('Staff__c');
                        String priorId = roleData.containsKey('Id') && roleData.get('Id') != null ? (String)roleData.get('Id') : null;
                        system.debug('roleData.containsKey >> Index >> '+ priorId + ' '+ rowIndex);
                        if (String.isNotBlank(staffId)) {
                            Priority_Staff__c ps = new Priority_Staff__c();
                            
                            // Use Id only for the 0th index
                            if (rowIndex == 0 && String.isNotBlank(priorId) && !usedIds.contains(priorId)) {
                                ps.Id = priorId;
                                usedIds.add(priorId);
                            } else {
                                ps.Id = null;
                            }
                            
                            ps.Availability__c = avail.Id;
                            ps.Staff__c = staffId;
                            ps.Priority__c = String.valueOf(i);
                            i++;
                            
                            priorityStaffToInsert.add(ps);
                        }
                        
                        rowIndex++; // Move to next index
                    }
                }
                
                System.debug('priorityStaffToInsert >> ' + priorityStaffToInsert);
                
                if (!priorityStaffToInsert.isEmpty()) {
                    upsert priorityStaffToInsert;
                }
                
                System.debug('>> Inserted ' + availabilitiesToInsert.size() + ' recurring Availability__c records.');
                System.debug('>> Upserted ' + priorityStaffToInsert.size() + ' Priority_Staff__c records.');
                return;
            }
            
            String availabilityId = (String)shiftData.get('availabilityId');
            Availability__c availability;
            if (availabilityId != null) {
                System.debug('>> Updating existing availability record with ID: ' + availabilityId);
                availability = [SELECT Id FROM Availability__c WHERE Id = :availabilityId LIMIT 1];
            } else {
                System.debug('>> Creating new availability record.');
                availability = new Availability__c();
            }
            
            //system.debug('')
            availability.Participant__c = (Id)shiftData.get('clientId');
            availability.Shift_Type__c = (String)shiftData.get('shiftType');
            availability.Start_Time__c = parseTime((String)shiftData.get('startTime'));
            availability.End_Time__c = parseTime((String)shiftData.get('endTime'));
            availability.Start_Date__c = Date.valueOf((String)shiftData.get('todayDate'));
            availability.Address__Street__s = (String)shiftData.get('street');
            availability.Address__PostalCode__s = (String)shiftData.get('postalCode');
            availability.Address__StateCode__s = (String)shiftData.get('province');
            availability.Address__CountryCode__s = 'AU';
            availability.Address__City__s  =   (String)shiftData.get('city');
            availability.Geo_Location__Latitude__s = (Decimal)shiftData.get('LocationLatitude');
            availability.Geo_Location__Longitude__s = (Decimal)shiftData.get('LocationLongitude');
            availability.Address_Type__c  = (String)shiftData.get('AdddressType');
            availability.Shift_Name__c = (String)shiftData.get('shiftName');
               availability.Facility__c = (String)shiftData.get('facility');
            //availability.Quantity__c = (String)shiftData.get('quantity') !=null && (String)shiftData.get('quantity') !=''  ?Decimal.valueof((String)shiftData.get('quantity')) :1;
            //
           try {
    Object qtyVal = shiftData.get('quantity');
    // ✅ Safely log value and type using String.valueOf()
    System.debug('✅ Raw qtyVal value: ' + String.valueOf(qtyVal) +
                 ', Type check → Decimal: ' + (qtyVal instanceof Decimal) +
                 ', Integer: ' + (qtyVal instanceof Integer) +
                 ', String: ' + (qtyVal instanceof String));

    if (qtyVal == null) {
        availability.Quantity__c = 1;
    } else if (qtyVal instanceof Decimal) {
        availability.Quantity__c = (Decimal) qtyVal;
    } else if (qtyVal instanceof Integer) {
        availability.Quantity__c = Decimal.valueOf((Integer) qtyVal);
    } else if (qtyVal instanceof String && String.isNotBlank((String) qtyVal)) {
        availability.Quantity__c = Decimal.valueOf((String) qtyVal);
    } else {
        availability.Quantity__c = 1;
    }

    System.debug('✅ Final Quantity__c: ' + availability.Quantity__c);
} catch (Exception e) {
    System.debug('❌ Quantity Handling Exception → ' + e.getMessage());
}


            
            if (shiftData != null && shiftData.containsKey('endDateShift') && shiftData.get('endDateShift') != null && String.valueOf(shiftData.get('endDateShift')).trim() != '') {
                availability.End_Date__c = Date.valueOf((String)shiftData.get('endDateShift'));
            }
            
            if (shiftData.containsKey('serviceTypeId')) availability.Funds_Tracker__c = (Id)shiftData.get('serviceTypeId');
            if (shiftData.containsKey('regionState')) availability.State__c = (String)shiftData.get('regionState');
            if (shiftData.containsKey('catalogId')) availability.NDIS_Support_Catalogue__c = (Id)shiftData.get('catalogId');
            if (shiftData.containsKey('roleId')) availability.Role__c = (String)shiftData.get('roleId');
            if (shiftData.containsKey('editedUnitPrice')) availability.Edited_Unit_Price__c =Decimal.valueof((String)shiftData.get('editedUnitPrice'));
            System.debug('>> Saved Availability__c with ID: ');
            upsert availability;
            System.debug('>> Saved Availability__c with ID: ' + availability.Id);
            List<Priority_Staff__c> PSList= [Select Id From Priority_Staff__c Where Availability__c =: availability.Id];
            //List<Priority_Staff__c> priorityStaffList = new List<Priority_Staff__c>();
            Map<String, Priority_Staff__c> psMap = new Map<String, Priority_Staff__c>();
            Integer i = 1;
            
            for (Object roleRow : roleRows1) {
                Map<String, Object> roleData = (Map<String, Object>)JSON.deserializeUntyped(JSON.serialize(roleRow));
                String staffId = (String)roleData.get('Staff__c');
                String priorId = (String)roleData.get('Id');
                
                system.debug('staffId ' + staffId);
                system.debug('priorId ' + priorId);
                
                if (String.isNotBlank(staffId)) {
                    Priority_Staff__c ps = new Priority_Staff__c();
                    
                    if (String.isNotBlank(priorId)) {
                        ps.Id = priorId;
                    }
                    
                    ps.Availability__c = availability.Id;
                    ps.Staff__c = staffId;
                    ps.Priority__c = String.valueOf(i);
                    i++;
                    
                    String key = String.isNotBlank(priorId) ? priorId : staffId + '_' + ps.Availability__c;
                    psMap.put(key, ps); // Ensures only one record per key
                }
            }
            
            List<Priority_Staff__c> priorityStaffList = psMap.values();
            System.debug('>> Upserting Priority_Staff__c records for non-recurring availability: ' + priorityStaffList);
            
            if (!priorityStaffList.isEmpty()) {
                upsert priorityStaffList;
            }
            
            System.debug('>> Upserted Priority_Staff__c records for non-recurring availability.');
        } catch (Exception e) {
            System.debug('!! Exception occurred: ' + e.getMessage());
            throw new AuraHandledException('Error saving availability: ' + e.getMessage());
        }
    }
    
    
    public static Time parseTime(String timeStr) {
        // Example: "08:30 AM"
        List<String> parts = timeStr.split(' ');
        String[] timeParts = parts[0].split(':');
        Integer hour = Integer.valueOf(timeParts[0]);
        Integer minute = Integer.valueOf(timeParts[1]);
        if (parts[1] == 'PM' && hour < 12) hour += 12;
        if (parts[1] == 'AM' && hour == 12) hour = 0;
        return Time.newInstance(hour, minute, 0, 0);
    }
    
    @AuraEnabled
    public static List<Availability__c> getParticipantAvailability(Id clientId, String datePicker) {
        System.debug('📌 Client ID: ' + clientId);
        Date startDate = Date.valueOf(datePicker).addDays(-30);
        Date endDate = Date.valueOf(datePicker).addDays(31);
        
        System.debug('📅 Start Date: ' + startDate + ', End Date: ' + endDate);
        
        //vamshi Added Quantity__c
        List<Availability__c> availabilityList = [
            SELECT Id,Role__c,Name, Staff__c, Participant__c, Start_Date__c, Address__Street__s, Address__PostalCode__s, Address__StateCode__s, 
            End_Date__c, Start_Time__c, End_Time__c, Type_of_User__c, Address__CountryCode__s, Address__City__s,Facility__c,
            Shift_Type__c, Funds_Tracker__c, State__c, NDIS_Support_Catalogue__c, Address_Type__c,Shift_Name__c,Quantity__c,
            (SELECT Id, Name, Availability__c,
             Staff__r.Name, Staff__c, Staff__r.Classification_Level__c, Staff__r.SCR__c,
             Staff__r.Last_Name__c, Staff__r.Class_and_Paypont__c,
             Priority__c
             FROM Priority_Staffs__r
             ORDER BY Priority__c ASC)
            FROM Availability__c
            WHERE Participant__c = :clientId
            AND Start_Date__c >= :startDate
            AND Start_Date__c <= :endDate
            AND Assigned_Service_OR_Shift__c = false
        ];// manendra

        
        // 🔁 Loop through and log each availability record
        for (Availability__c avail : availabilityList) {
            System.debug('🟢 Availability Record → Id: ' + avail.Id + ', Start_Date__c: ' + avail.Start_Date__c + ', Name: ' + avail.Name);
        }
        
        System.debug('🔢 Total records fetched: ' + availabilityList.size());
        return availabilityList;
    }
    
    @AuraEnabled
    public static List<Availability__c> getStaffAvailability(string datePicker) {
        String UserEmail = UserInfo.getUserEmail(); 
        
        Date startDate = Date.valueOf(datePicker) -31 ;
        Date endDate = Date.valueOf(datePicker)+31;
        
        
        return [SELECT Participant__c, Shift_Type__c,Shift_Name__c, Id, Start_Date__c, Start_Time__c, End_Time__c, Type_of_User__c, Funds_Tracker__c, State__c ,Assigned_Service_OR_Shift__c,Type__c  FROM Availability__c 
                WHERE Staff__r.Email_Address__c =:UserEmail AND Start_Date__c  >= :startDate  AND Start_Date__c  <= :endDate ];
    }
    
    @AuraEnabled
    public static String processSingleShift(
        Id avaliableId, 
        String shiftDate, 
        String startTime, 
        String endTime, 
        Id staffId, 
        Id shiftId
    ) {
        System.debug('🚀 Called processSingleShift');
        System.debug('🚀 avaliableId >> ' + avaliableId);
        System.debug('🚀 shiftDate >> ' + shiftDate);
        System.debug('🚀 startTime >> ' + startTime);
        System.debug('🚀 endTime >> ' + endTime);
        System.debug('🚀 staffId >> ' + staffId);
        System.debug('🚀 shiftId >> ' + shiftId);
        
        Map<String, Object> resultMap = new Map<String, Object>();
        
        Date parsedDate = parseDateDMY(shiftDate);
        Integer dayOfWeek = Integer.valueOf(
            DateTime.newInstance(parsedDate, Time.newInstance(0, 0, 0, 0)).format('u')
        ); 
        Date weekStart = parsedDate.addDays(-(dayOfWeek - 1));  // Monday
        Date weekEnd = weekStart.addDays(4);                   // Friday
        
        System.debug('📅 Week Start (Monday): ' + weekStart);
        System.debug('📅 Week End (Friday): ' + weekEnd);
        
        // 🚫 Weekend check: 6 = Saturday, 7 = Sunday
        if (dayOfWeek == 6 || dayOfWeek == 7) {
            resultMap.put('result', false);
            resultMap.put('message', 'Shifts are not allowed on weekends.');
            return JSON.serialize(resultMap);
        }
        
        Time inputStartTime = AddShiftHandler.getTimeIn24HrFormat(startTime.toLowerCase());
        Time inputEndTime = AddShiftHandler.getTimeIn24HrFormat(endTime.toLowerCase());
        
        Staff__c staff = [
            SELECT Id, Set_Hours__c, Restrict_Set_Hours__c 
            FROM Staff__c 
            WHERE Id = :staffId 
            LIMIT 1
        ];
        
        List<Availability__c> availabilityList;
        
        if (avaliableId != null) {
            availabilityList = [
                SELECT Id, Start_Time__c, End_Time__c, Start_Date__c, Shift_Type__c 
                FROM Availability__c 
                WHERE Staff__c = :staffId
                AND Start_Date__c >= :weekStart
                AND Start_Date__c <= :weekEnd
                AND Shift_Type__c != 'Sleepover Shift'
                AND Id = :avaliableId
            ];
        } else {
            availabilityList = [
                SELECT Id, Start_Time__c, End_Time__c, Start_Date__c, Shift_Type__c 
                FROM Availability__c 
                WHERE Staff__c = :staffId
                AND Start_Date__c >= :weekStart
                AND Start_Date__c <= :weekEnd
                AND Shift_Type__c != 'Sleepover Shift'
            ];
        }
        
        List<ShiftwithStaff__c> weekShifts;
        
        if (shiftId != null) {
            weekShifts = [
                SELECT Duration__c, Date__c, Start_Time__c, End_Time__c, Type_of_Shift__c, Attendence__c, Status__c
                FROM ShiftwithStaff__c
                WHERE Staff__c = :staffId
                AND Date__c >= :weekStart
                AND Date__c <= :weekEnd
                AND Type_of_Shift__c != 'Sleepover Shift'
                AND Status__c != 'Unassigned'
                AND Attendence__c = true
                AND Id = :shiftId
            ];   
        } else {
            weekShifts = [
                SELECT Duration__c, Date__c, Start_Time__c, End_Time__c, Type_of_Shift__c, Attendence__c, Status__c
                FROM ShiftwithStaff__c
                WHERE Staff__c = :staffId
                AND Date__c >= :weekStart
                AND Date__c <= :weekEnd
                AND Type_of_Shift__c != 'Sleepover Shift'
                AND Status__c != 'Unassigned'
                AND Attendence__c = true
            ];     
        }
        
        Decimal totalShiftDuration = 0;
        for (ShiftwithStaff__c shift : weekShifts) {
            if (shift.Start_Time__c != null && shift.End_Time__c != null) {
                totalShiftDuration += calculateDuration(parsedDate, shift.Start_Time__c, shift.End_Time__c);
            } else if (shift.Duration__c != null) {
                totalShiftDuration += shift.Duration__c;
            }
        }
        
        Decimal totalAvailabilityDuration = 0;
        for (Availability__c a : availabilityList) {
            if (a.Start_Time__c != null && a.End_Time__c != null) {
                totalAvailabilityDuration += calculateDuration(parsedDate, a.Start_Time__c, a.End_Time__c);
            }
        }
        
        Decimal inputDuration = calculateDuration(parsedDate, inputStartTime, inputEndTime);
        Decimal grandTotal = totalShiftDuration + totalAvailabilityDuration + inputDuration;
        
        System.debug('staff.Restrict_Set_Hours__c >> ' + staff.Restrict_Set_Hours__c);
        Boolean restriction = staff.Restrict_Set_Hours__c;
        Decimal setHours = staff.Set_Hours__c != null ? staff.Set_Hours__c : 0;
        Boolean isAllowed = true;
        
        if (restriction == true && setHours > 0 && setHours < grandTotal) {
            isAllowed = grandTotal >= setHours;
        } else {
            // Restriction not enabled → return false anyway
            isAllowed = false;
        }
        
        // Populate result map
        resultMap.put('shiftHours', totalShiftDuration.setScale(2));
        resultMap.put('availabilityHours', totalAvailabilityDuration.setScale(2));
        resultMap.put('inputHours', inputDuration.setScale(2));
        resultMap.put('grandTotal', grandTotal.setScale(2));
        resultMap.put('restrictSetHours', restriction);
        resultMap.put('setHours', setHours.setScale(2));
        resultMap.put('result', isAllowed);
        
        System.debug('📊 Result Map: ' + resultMap);
        return JSON.serialize(resultMap);
    }
    
    public static Decimal calculateDuration(Date baseDate, Time startTime, Time endTime) {
        DateTime startDT = DateTime.newInstance(baseDate, startTime);
        DateTime endDT = DateTime.newInstance(baseDate, endTime);
        
        // Handle overnight times (e.g. 11 PM to 2 AM next day)
        if (endDT.getTime() < startDT.getTime()) {
            endDT = endDT.addDays(1);
        }
        
        Long diffMillis = endDT.getTime() - startDT.getTime();
        Decimal hours = Decimal.valueOf(diffMillis) / (1000 * 60 * 60); // milliseconds to hours
        return hours.setScale(2); // optional: round to 2 decimals
    }
    
    public static Date parseDateDMY(String dmy) {
        List<String> parts = dmy.split('/');
        if (parts.size() == 3) {
            Integer day = Integer.valueOf(parts[0]);
            Integer month = Integer.valueOf(parts[1]);
            Integer year = Integer.valueOf(parts[2]);
            return Date.newInstance(year, month, day);
        } else {
            throw new AuraHandledException('Invalid date format: ' + dmy);
        }
    }

    @AuraEnabled
    public static void saveRoleOrder(List<String> newOrder) {
        User user = [SELECT Id, Email FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];  
        Staff__c staffList = [ SELECT Id, Email_Address__c,Role_Order__c FROM Staff__c WHERE Email_Address__c = :user.Email LIMIT 1];
        staffList.Role_Order__c = JSON.serialize(newOrder);
        update staffList;
    }

    @AuraEnabled(cacheable=false)
    public static String getRoleOrder() {

        // Get logged-in user & email
        User user = [
            SELECT Id, Email 
            FROM User 
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        // Get Staff record
        Staff__c staffRecord = [
            SELECT Id, Role_Order__c
            FROM Staff__c
            WHERE Email_Address__c = :user.Email
            LIMIT 1
        ];

        // Return JSON or null
        return staffRecord.Role_Order__c;
    }
    
}