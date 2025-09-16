public with sharing class StaffAvailabilityController {
    @AuraEnabled(cacheable=true)
    public static Staff__c getstaffId(String userId){
        User user = [SELECT Id, Email FROM User WHERE Id = :userId LIMIT 1];
        
        List<Staff__c> staffList = [ SELECT Id, Email_Address__c FROM Staff__c WHERE Email_Address__c = :user.Email LIMIT 1];
        
        return staffList[0];     
    }
    
    /*@AuraEnabled
public static void saveStaffData(Id avaliableId, String shiftDateStr, String shiftType, Boolean isRecurring, List<String> weeklyDays, 
String startTime, String endTime, Id staffId, String endDate, String typeOfRecur, Integer recurEvery,
Integer monthlyDay,String shfitEndDate) {
System.debug('Starting saveStaffData 1...');
try {
System.debug('Starting saveStaffData...');
System.debug('Shift Type: ' + shiftType);
System.debug('Shift Date: ' + shiftDateStr);
System.debug('Is Recurring: ' + isRecurring);
System.debug('Weekly Days: ' + weeklyDays);
System.debug('Start Time: ' + startTime);
System.debug('End Time: ' + endTime);
System.debug('Staff ID: ' + staffId);
System.debug('End Date: ' + endDate);
System.debug('Recurrence Every: ' + recurEvery);
System.debug('Type of Recurrence: ' + typeOfRecur);
System.debug('Available ID: ' + avaliableId);
System.debug('Monthly Day: ' + monthlyDay);

// Create list to hold both single and recurring availability records
List<Availability__c> availabilityList = new List<Availability__c>();

// Create or fetch the non-recurring availability record
Availability__c availabilityRecord;
if (avaliableId != null) {
availabilityRecord = [
SELECT Id, Staff__c, Shift_Type__c, Start_Time__c, End_Time__c, Start_Date__c 
FROM Availability__c 
WHERE Id = :avaliableId 
LIMIT 1
];
System.debug('Fetched existing availability record with ID: ' + avaliableId);
availabilityRecord.Shift_Type__c = shiftType;
availabilityRecord.Start_Time__c = parseTime(startTime);
availabilityRecord.End_Time__c = parseTime(endTime);
availabilityList.add(availabilityRecord);
SYSTEM.DEBUG('availabilityList >> '+availabilityList);
// If it's a recurring shift, process recurring availability
if (isRecurring) {
System.debug('Handling Recurring Logic...');

Date shiftDate = convertDate(shiftDateStr);
String shiftDateFormatted = String.valueOf(shiftDate);

System.debug('Converted Shift Date: ' + shiftDateFormatted);
string shiftDateFormatted1 = shiftDateFormatted +' '+ '00:00:00';
system.debug('Converted Shift Date: 1 >> '+ shiftDateFormatted1);
DateTime shiftDateTime;
String shiftDateTimeFormatted;                                                 

Map<String, Object> recurrenceResult = RosterCreationRecurringHnadler.getNumberOfRecurrences(
typeOfRecur, recurEvery, endDate, shiftDateFormatted, weeklyDays, monthlyDay
);

if (recurrenceResult != null && recurrenceResult.containsKey('RecurrenceDates')) {
List<Object> recurrenceDates = (List<Object>) recurrenceResult.get('RecurrenceDates');

System.debug('Recurrence Dates: ' + recurrenceDates);

list<Date> finaldates= preventDuplicates(shiftDate,convertDate(shfitEndDate),startTime, endTime,staffId,recurrenceDates,shiftType);

List<Map<String, Object>> filteredDatesWithRange = processFinalDates(finaldates, staffId, startTime, endTime, 'Yes');
system.debug('filteredDatesWithRange >>'+ filteredDatesWithRange);

System.debug('Recurrence final Dates in Edit: ' + filteredDatesWithRange);
for (Object dateObj : filteredDatesWithRange) {
if(date.valueOf(dateObj) != date.valueOf(shiftDateFormatted1)){
system.debug('dateObj >>'+dateObj);
system.debug('shiftDateTimeFormatted >>'+shiftDateFormatted1);
Date recurrenceDate = Date.valueOf(String.valueOf(dateObj));
System.debug('Recurring Date: ' + recurrenceDate);

Availability__c recurringAvailability = new Availability__c();
recurringAvailability.Staff__c = staffId;
recurringAvailability.Shift_Type__c = shiftType;
recurringAvailability.Start_Time__c = parseTime(startTime);
recurringAvailability.End_Time__c = parseTime(endTime);
recurringAvailability.Start_Date__c = recurrenceDate; 
SYSTEM.DEBUG('availabilityList >> '+availabilityList);
availabilityList.add(recurringAvailability);
SYSTEM.DEBUG('availabilityList >> '+availabilityList);
}
}

} else {
System.debug('No recurrence dates found.');
}
}
} 
else {
availabilityRecord = new Availability__c();
System.debug('Creating a new availability record');
Date shiftDate = convertDate(shiftDateStr);
Date ShiftEndDate = convertDate(shfitEndDate);
String shiftDateFormatted = String.valueOf(shiftDate);
System.debug('Converted Shift Date: ' + shiftDateFormatted);
availabilityRecord.Staff__c = staffId;
availabilityRecord.Shift_Type__c = shiftType;
availabilityRecord.Start_Time__c = parseTime(startTime);
availabilityRecord.End_Time__c = parseTime(endTime);
availabilityRecord.Start_Date__c = shiftDate;
availabilityRecord.End_Date__c = ShiftEndDate;

availabilityList.add(availabilityRecord);

// If it's a recurring shift, process recurring availability
if (isRecurring) {
System.debug('Handling Recurring Logic...');
System.debug('Converted Shift Date: ' + shiftDateFormatted);
Date shiftDate1 = convertDate(shiftDateStr);
String shiftDateFormatted3 = String.valueOf(shiftDate);

System.debug('Converted Shift Date: ' + shiftDateFormatted);
string shiftDateFormatted2 = shiftDateFormatted +' '+ '00:00:00';
system.debug('Converted Shift Date: 1 >> '+ shiftDateFormatted2);

Map<String, Object> recurrenceResult = RosterCreationRecurringHnadler.getNumberOfRecurrences(
typeOfRecur, recurEvery, endDate, shiftDateFormatted, weeklyDays, monthlyDay
);

if (recurrenceResult != null && recurrenceResult.containsKey('RecurrenceDates')) {
List<Object> recurrenceDates = (List<Object>) recurrenceResult.get('RecurrenceDates');

System.debug('Recurrence Dates: ' + recurrenceDates);
list<Date> finaldates= preventDuplicates(shiftDate,convertDate(shfitEndDate),startTime, endTime,staffId,recurrenceDates,shiftType);

List<Map<String, Object>> filteredDatesWithRange = processFinalDates(finaldates, staffId, startTime, endTime, 'Yes');
system.debug('filteredDatesWithRange >>'+ filteredDatesWithRange);

System.debug('Recurrence final Dates: ' + filteredDatesWithRange);
for (Object dateObj : filteredDatesWithRange) {
if(date.valueOf(dateObj) != date.valueOf(shiftDateFormatted2)){
Date recurrenceDate = Date.valueOf(String.valueOf(dateObj));
System.debug('Recurring Date: ' + recurrenceDate);

Availability__c recurringAvailability = new Availability__c();
recurringAvailability.Staff__c = staffId;
recurringAvailability.Shift_Type__c = shiftType;
recurringAvailability.Start_Time__c = parseTime(startTime);
recurringAvailability.End_Time__c = parseTime(endTime);
recurringAvailability.Start_Date__c = recurrenceDate;
//recurringAvailability.End_Date__c = ShiftEndDate;

availabilityList.add(recurringAvailability);
}
} 
} else {
System.debug('No recurrence dates found.');
} 
}
}

if (!availabilityList.isEmpty()) {
System.debug('Saving/Upserting Availability Records: ' + availabilityList);
upsert availabilityList;
system.debug('availabilityList >>'+availabilityList);
} else {
System.debug('No availability records to save.');
}  

}

catch (Exception e) {
System.debug('Exception occurred: ' + e.getMessage());
// throw new AuraHandledException('Error saving staff data: ' + e.getMessage());
}
}*/
    
    @AuraEnabled
    public static void saveStaffData(Id avaliableId, String shiftDateStr, String shiftType, Boolean isRecurring, List<String> weeklyDays, 
                                     String startTime, String endTime, Id staffId, String endDate, String typeOfRecur, Integer recurEvery,
                                     Integer monthlyDay, String shfitEndDate) {
                                         System.debug('Starting saveStaffData...');
                                         try {
                                             List<Availability__c> availabilityList = new List<Availability__c>();
                                             
                                             Date shiftDate = convertDate(shiftDateStr);
                                             Date shiftEndDate = convertDate(shfitEndDate);
                                             String shiftDateFormatted = String.valueOf(shiftDate);
                                             String shiftDateFormattedDT = shiftDateFormatted + ' 00:00:00';
                                             
                                             if (avaliableId != null) {
                                                 Availability__c availabilityRecord = [
                                                     SELECT Id, Staff__c, Shift_Type__c, Start_Time__c, End_Time__c, Start_Date__c 
                                                     FROM Availability__c 
                                                     WHERE Id = :avaliableId 
                                                     LIMIT 1
                                                 ];
                                                 availabilityRecord.Shift_Type__c = shiftType;
                                                 availabilityRecord.Start_Time__c = parseTime(startTime);
                                                 availabilityRecord.End_Time__c = parseTime(endTime);
                                                 availabilityList.add(availabilityRecord);
                                             } else {
                                                 Availability__c availabilityRecord = new Availability__c();
                                                 availabilityRecord.Staff__c = staffId;
                                                 availabilityRecord.Shift_Type__c = shiftType;
                                                 availabilityRecord.Start_Time__c = parseTime(startTime);
                                                 availabilityRecord.End_Time__c = parseTime(endTime);
                                                 availabilityRecord.Start_Date__c = shiftDate;
                                                 availabilityRecord.End_Date__c = shiftEndDate;
                                                 availabilityList.add(availabilityRecord);
                                             }
                                             
                                             if (isRecurring) {
                                                 System.debug('Handling Recurring Logic...');
                                                 
                                                 Map<String, Object> recurrenceResult = RosterCreationRecurringHnadler.getNumberOfRecurrences(
                                                     typeOfRecur, recurEvery, endDate, shiftDateFormatted, weeklyDays, monthlyDay
                                                 );
                                                 
                                                 if (recurrenceResult != null && recurrenceResult.containsKey('RecurrenceDates')) {
                                                     List<Object> recurrenceDates = (List<Object>) recurrenceResult.get('RecurrenceDates');
                                                     List<Date> finaldates = preventDuplicates(shiftDate, shiftEndDate, startTime, endTime, staffId, recurrenceDates, shiftType);
                                                     
                                                     List<Map<String, Object>> filteredDatesWithRange = processFinalDates(finaldates, staffId, startTime, endTime, 'Yes');
                                                     system.debug('filteredDatesWithRange >>'+ filteredDatesWithRange);
                                                     Date mainShiftDate = shiftDate;
                                                     
                                                     for (Map<String, Object> weekMap : filteredDatesWithRange) {
                                                         if (weekMap.containsKey('originalWeekDates')) {
                                                             List<Object> weekDates = (List<Object>) weekMap.get('originalWeekDates');
                                                             
                                                             for (Object dateObj : weekDates) {
                                                                 system.debug('dateObj >>'+ dateObj);
                                                                 Date recurrenceDate;
                                                                 try {
                                                                     recurrenceDate = (Date) dateObj;
                                                                 } catch (Exception e) {
                                                                     System.debug('❌ Invalid recurrence date object: ' + dateObj);
                                                                     continue;
                                                                 }
                                                                 
                                                                 if (recurrenceDate != mainShiftDate) {
                                                                     Availability__c recurringAvailability = new Availability__c();
                                                                     recurringAvailability.Staff__c = staffId;
                                                                     recurringAvailability.Shift_Type__c = shiftType;
                                                                     recurringAvailability.Start_Time__c = parseTime(startTime);
                                                                     recurringAvailability.End_Time__c = parseTime(endTime);
                                                                     recurringAvailability.Start_Date__c = recurrenceDate;
                                                                     availabilityList.add(recurringAvailability);
                                                                     System.debug('✅ Added recurring: ' + recurringAvailability);
                                                                 }
                                                             }
                                                         }
                                                     }
                                                 } else {
                                                     System.debug('⚠️ No recurrence dates found.');
                                                 }
                                             }
                                             
                                             if (!availabilityList.isEmpty()) {
                                                 upsert availabilityList;
                                                 System.debug('✅ Upserted availability records: ' + availabilityList);
                                             } else {
                                                 System.debug('⚠️ No availability records to save.');
                                             }
                                         } catch (Exception e) {
                                             System.debug('❌ Exception: ' + e.getMessage());
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
        System.debug('📥 Input Dates: ' + inputDates);
        System.debug('👤 Staff ID: ' + staffId);
        System.debug('🕒 Time Range: ' + startTime + ' → ' + endTime);
        
        List<Map<String, Object>> processedDateRanges = new List<Map<String, Object>>();
        Set<String> processedWeekKeys = new Set<String>();
        
        if (inputDates == null || inputDates.isEmpty()) return processedDateRanges;
        
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
        
        // Iterate each input date by week
        for (Date d : inputDates) {
            Integer dow = Integer.valueOf(DateTime.newInstance(d, Time.newInstance(0,0,0,0)).format('u'));
            Date weekStart = d.addDays(-(dow - 1));
            Date weekEnd = weekStart.addDays(6);
            String weekKey = String.valueOf(weekStart);
            
            if (processedWeekKeys.contains(weekKey)) continue;
            processedWeekKeys.add(weekKey);
            
            List<Date> weekDates = new List<Date>();
            for (Date dateIn : inputDates) {
                if (dateIn >= weekStart && dateIn <= weekEnd) {
                    weekDates.add(dateIn);
                }
            }
            
            System.debug('📆 Week: ' + weekStart + ' to ' + weekEnd + ' → Dates: ' + weekDates);
            
            List<ShiftwithStaff__c> allShifts1 = [
            SELECT Duration__c, Date__c, Staff__c, Type_of_Shift__c, Attendence__c,
            Staff__r.Set_Hours__c, Staff__r.Restrict_Set_Hours__c, Status__c
            FROM ShiftwithStaff__c
            WHERE Staff__c = :staffId
            AND Date__c >= :weekStart AND Date__c <= :weekEnd
            AND Type_of_Shift__c != 'Sleepover Shift'
            AND Status__c != 'Unassigned'
            AND Attendence__c = true
        ];
        System.debug('📄 Total Shifts Fetched: ' + allShifts1.size());
            
            // Fetch relevant Availability__c
            List<Availability__c> allAvailabilities1 = [
                SELECT Start_Date__c, Start_Time__c, End_Time__c, Shift_Type__c
                FROM Availability__c
                WHERE Staff__c = :staffId
                AND Start_Date__c >= :weekStart AND Start_Date__c <= :weekEnd
                AND Shift_Type__c != 'Sleepover Shift'
            ];
            System.debug('🟦 Total Availability Fetched: ' + allAvailabilities1.size());
            
            Decimal existingShiftDuration = 0;
            if (allShifts1 != null) {
                for (ShiftwithStaff__c s : allShifts1) {
                    existingShiftDuration += (s.Duration__c != null) ? s.Duration__c : 0;
                }
            }
            
            if (allAvailabilities1 != null) {
                for (Availability__c a : allAvailabilities1) {
                    if (a.Start_Time__c != null && a.End_Time__c != null) {
                        try {
                            DateTime startDT = DateTime.newInstance(Date.today(), a.Start_Time__c);
                            DateTime endDT = DateTime.newInstance(Date.today(), a.End_Time__c);
                            Decimal duration = (Decimal.valueOf(endDT.getTime() - startDT.getTime()) / (1000 * 60 * 60));
                            existingShiftDuration += duration;
                            System.debug('🟦 Availability on ' + a.Start_Date__c + ': ' + duration + ' hrs');
                        } catch (Exception e) {
                            System.debug('❌ Error parsing availability: ' + e.getMessage());
                        }
                    }
                }
            }
            
            System.debug('🧮 Total existing hours (Shifts + Avails): ' + existingShiftDuration);
            
            // Staff Config
            Staff__c staff = [
                SELECT Id, Restrict_Set_Hours__c, Set_Hours__c
                FROM Staff__c
                WHERE Id = :staffId LIMIT 1
            ];
            Decimal setHours = staff.Set_Hours__c != null ? staff.Set_Hours__c : 0;
            Boolean restrict = staff.Restrict_Set_Hours__c;
            System.debug('📏 SetHours: ' + setHours + ', Restriction: ' + restrict);
            
            // Date evaluation
            Decimal totalDuration = 0;
            List<Date> allowedDates = new List<Date>();
            
            for (Date singleDate : weekDates) {
                Integer dow1 = Integer.valueOf(DateTime.newInstance(singleDate, Time.newInstance(0, 0, 0, 0)).format('u'));
                Boolean isWeekend = (dow1 == 6 || dow1 == 7); // Saturday or Sunday
            
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
        for (Funds_Tracker__c c : [SELECT Id, Name FROM Funds_Tracker__c WHERE Client__c = :clientId]) {
            options.add(new Map<String, String>{
                'label' => c.Name,
                    'value' => c.Id
                    });
        }
        system.debug('options >> '+options);
        return options;   
        
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getStaffOptions(String role, Id participantId) {
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
        List<Staff__c> staffRecords = [
            SELECT Id, Name, Last_Name__c, Role__c, Classification_Level__c, SCR__c,Class_and_Paypont__c
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
    }
    
    public class CatalogueDataWrapper {
        @AuraEnabled public List<NDIS_Support_Catalogue__c> catalogueData { get; set; }
        @AuraEnabled public String statesCombined { get; set; }
        
        public CatalogueDataWrapper(List<NDIS_Support_Catalogue__c> catalogueData, String statesCombined) {
            this.catalogueData = catalogueData;
            this.statesCombined = statesCombined;
        }
    } 
    
    
    @AuraEnabled
    public static CatalogueDataWrapper getCatalogueData(Id serviceType, Id clientId) { 
        System.debug('serviceType >>' + serviceType);
        System.debug('clientId >>' + clientId);
        
        List<ClientFundTrackerJN__c> supportItems = [
            SELECT Id, NDIS_Support_Catalogue__c, Participant__c, Funds_Tracker__c, Funds_Tracker__r.State__c 
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
        return new CatalogueDataWrapper(listNDISCatalog, statesCombined); 
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
                        if (shiftData.containsKey('serviceTypeId')) availability.Funds_Tracker__c = (Id)shiftData.get('serviceTypeId');
                        if (shiftData.containsKey('regionState')) availability.State__c = (String)shiftData.get('regionState');
                        if (shiftData.containsKey('catalogId')) availability.NDIS_Support_Catalogue__c = (Id)shiftData.get('catalogId');
                        if (shiftData.containsKey('roleId')) availability.Role__c = (String)shiftData.get('roleId');
                        
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
                    
                    for (Object roleRow : roleRows1) { Map<String, Object> roleData = (Map<String, Object>)JSON.deserializeUntyped(JSON.serialize(roleRow));String staffId = (String)roleData.get('Staff__c'); String priorId = roleData.containsKey('Id') && roleData.get('Id') != null ? (String)roleData.get('Id') : null;
                      

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
            if (shiftData != null && shiftData.containsKey('endDateShift') && shiftData.get('endDateShift') != null && String.valueOf(shiftData.get('endDateShift')).trim() != '') {
                availability.End_Date__c = Date.valueOf((String)shiftData.get('endDateShift'));
            }
            
            if (shiftData.containsKey('serviceTypeId')) availability.Funds_Tracker__c = (Id)shiftData.get('serviceTypeId');
            if (shiftData.containsKey('regionState')) availability.State__c = (String)shiftData.get('regionState');
            if (shiftData.containsKey('catalogId')) availability.NDIS_Support_Catalogue__c = (Id)shiftData.get('catalogId');
            if (shiftData.containsKey('roleId')) availability.Role__c = (String)shiftData.get('roleId');
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
        
        List<Availability__c> availabilityList = [
            SELECT Id, Name, Staff__c, Participant__c, Start_Date__c, Address__Street__s, Address__PostalCode__s, Address__StateCode__s, 
            End_Date__c, Start_Time__c, End_Time__c, Type_of_User__c, Address__CountryCode__s, Address__City__s,
            Shift_Type__c, Funds_Tracker__c, State__c, NDIS_Support_Catalogue__c, Address_Type__c, Role__c,
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
        ];
        
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
        
        
        return [SELECT Participant__c, Shift_Type__c, Id, Start_Date__c, Start_Time__c, End_Time__c, Type_of_User__c, Funds_Tracker__c, State__c ,Assigned_Service_OR_Shift__c  FROM Availability__c 
                WHERE Staff__r.Email_Address__c =:UserEmail AND Start_Date__c  >= :startDate  AND Start_Date__c  <= :endDate ];
    }
    
    @AuraEnabled
    public static String processSingleShift(Id avaliableId, String shiftDate, String startTime, String endTime, Id staffId) {
        System.debug('🚀 Called processSingleShift');
        Map<String, Object> resultMap = new Map<String, Object>();
        
        Date parsedDate = parseDateDMY(shiftDate);
        Integer dayOfWeek = Integer.valueOf(DateTime.newInstance(parsedDate, Time.newInstance(0, 0, 0, 0)).format('u')); 
        Date weekStart = parsedDate.addDays(-(dayOfWeek - 1));  // Monday
        Date weekEnd = weekStart.addDays(4);                   // Friday
        
        System.debug('📅 Week Start (Monday): ' + weekStart);
        System.debug('📅 Week End (Friday): ' + weekEnd);
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

        List<ShiftwithStaff__c> weekShifts = [
            SELECT Duration__c, Date__c, Start_Time__c, End_Time__c, Type_of_Shift__c, Attendence__c,Status__c
            FROM ShiftwithStaff__c
            WHERE Staff__c = :staffId
            AND Date__c >= :weekStart
            AND Date__c <= :weekEnd
            AND Type_of_Shift__c != 'Sleepover Shift'
            AND Status__c != 'Unassigned'
            AND Attendence__c = true
        ];
        
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
        
        Boolean restriction = staff.Restrict_Set_Hours__c;
        Decimal setHours = staff.Set_Hours__c != null ? staff.Set_Hours__c : 0;
        Boolean isAllowed = true;
        
        if (restriction && setHours > 0 && setHours < grandTotal) {
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
    
}