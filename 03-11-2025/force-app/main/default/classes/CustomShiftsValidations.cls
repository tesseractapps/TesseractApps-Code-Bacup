public class CustomShiftsValidations {
    public class ShiftSegment {
        public String shifttype;
        public String starttime; // "HH:mm:ssZ" format
        public String endtime;
        public string id;
        public string rateLabel;
        public string starttimeAmPm;
        public string endtimeAmPm;
        public string hourlyrate;
        public integer index;
        public String startTimeSelectedHour; // "09"
        public String startTimeselectedMinute; // "00"
        public String startTimeselectedAmPm; // true or false for AM/PM
        public String startTimdisplayTime; // "09:00 AM"
        
        public String endTimeselectedHour; // "05"
        public String endTimeselectedMinute; // "00"
        public String endTimeselectedAmPm; // true or false for AM/PM
        public String endTimeDdisplayTime; // "05:00 PM"
         public  boolean rowOnchangeOccured;
      
        
       
    }

    public class ValidationResult {
        @AuraEnabled public Boolean isValid = true;
        @AuraEnabled public String errorMessage;
        @AuraEnabled public String enrichedSegmentsJson;
    }

    @AuraEnabled
    public static ValidationResult validateSegments(
        Date shiftStartDate, String shiftStartTime,
        Date shiftEndDate, String shiftEndTime,
        String segmentsJson,string StaffId
    ) {
       // System.debug('=== STARTING VALIDATION ===');
       // System.debug('Shift Start Date: ' + shiftStartDate + ' Time: ' + shiftStartTime);
      //  System.debug('Shift End Date: ' + shiftEndDate + ' Time: ' + shiftEndTime);
        System.debug('Segments JSON: ' + segmentsJson);

        ValidationResult result = new ValidationResult();
        Staff__c staff = [SELECT Id, Public_holiday_Hourly_Rate__c, Saturday_Hourly_Rate__c, 
                Sunday_Hourly_Rate__c, Working_Hours_Rate__c, Afternoon_shift_Hourly_Rate__c,
               Night_shift_Hourly_Rate__c,Sleepover_Allowance__c FROM Staff__c WHERE Id = :staffId LIMIT 1];
        
        
        Id currentUserId = UserInfo.getUserId();
          list<Date> recurrenceDates = new list<Date>();
        //System.debug('Current User Id: ' + currentUserId);
      //  System.debug('recurrenceDates: ' + recurrenceDates);
        recurrenceDates.add(shiftStartDate);
        recurrenceDates.add(shiftEndDate);
        
        List<Staff__c> staffList = [ SELECT Id, Email_Address__c,Public_holiday_Hourly_Rate__c FROM Staff__c WHERE Id = :StaffId LIMIT 1]; 
        
        User currentUser = [
            SELECT Id, Name, Organization_Name__c
            FROM User
            WHERE Id = :currentUserId
            LIMIT 1
        ];
        
        String orgName = currentUser.Organization_Name__c;
       // System.debug('Organization Name: ' + orgName);
        
        Organisation__c org = [
            SELECT Id, Name, Address__c  // Add any fields you need
            FROM Organisation__c
            WHERE Name = :orgName
            LIMIT 1
        ];
        
        
        String stateCode = '';
        String stateName = '';
        Set<String> fullStateNames = new Set<String>();
        Map<String, String> stateMap = new Map<String, String>{
            'NSW' => 'New South Wales',
                'VIC' => 'Victoria',
                'QLD' => 'Queensland',
                'SA' => 'South Australia',
                'WA' => 'Western Australia',
                'TAS' => 'Tasmania',
                'ACT' => 'Australian Capital Territory',
                'NT' => 'Northern Territory'
                };
                    if (String.isNotBlank(org.Address__c)) {
                        List<String> parts = org.Address__c.split(',');
                        if (parts.size() >= 3) {
                            List<String> stateParts = parts[2].trim().split(' ');
                            if (!stateParts.isEmpty()) {
                                stateCode = stateParts[0].trim();  // This is the state code (e.g., "NSW")
                                if (stateMap.containsKey(stateCode)) {
                                    stateName = stateMap.get(stateCode);  // This is the full state name (e.g., "New South Wales")
                                    fullStateNames.add(stateName);
                                }
                            }
                        }
                    }
       // System.debug('Extracted State Code: ' + stateCode);
      //  System.debug('Extracted State Name: ' + stateName);
      //  System.debug('Extracted fullStateNames: ' + fullStateNames);
        Set<Date> recurrenceDateSet = new Set<Date>(recurrenceDates);
        List<Public_Holiday__c> rawHolidays = [
            SELECT Id, Name, Date__c, State__c,Holiday_Name__c
            FROM Public_Holiday__c
            WHERE Date__c IN :recurrenceDateSet
            AND State__c INCLUDES (:stateName) 
            ORDER BY Date__c ASC
        ];
        
       // system.debug('rawHolidays >>'+rawHolidays);
        
        Map<Date, Public_Holiday__c> holidaysByDate = new Map<Date, Public_Holiday__c>();
        for (Public_Holiday__c holiday : rawHolidays) {
            holidaysByDate.put(holiday.Date__c, holiday);
        }
        
        // 1. Parse input data
        List<ShiftSegment> segments;
        try {
            segments = (List<ShiftSegment>) JSON.deserialize(segmentsJson, List<ShiftSegment>.class);
            System.debug('Successfully parsed ' + segments.size() + ' segments');
        } catch (Exception e) {
            System.debug('JSON Parsing Error: ' + e.getMessage() + ' ' + e.getStackTraceString());
            result.isValid = false;
            result.errorMessage = 'Custom shift details are incomplete.';
            return result;
        }

        if (segments == null || segments.isEmpty()) {
            System.debug('Error: Empty segments array');
            result.isValid = false;
            result.errorMessage = 'Custom shift details are empty.';
            return result;
        }

        // 2. Convert shift boundaries to UTC for timezone-independent comparison
        DateTime shiftStartUTC = toDateTimeUTC(shiftStartDate, shiftStartTime);
        DateTime shiftEndUTC = toDateTimeUTC(shiftEndDate, shiftEndTime);
       // System.debug('Shift Start UTC: ' + shiftStartUTC + ' (' + shiftStartUTC.getTime() + ' ms)');
      ///  System.debug('Shift End UTC: ' + shiftEndUTC + ' (' + shiftEndUTC.getTime() + ' ms)');

        // 3. Validate each segment
        DateTime lastEndUTC = null;
        List<Map<String, Object>> enriched = new List<Map<String, Object>>();

        for (Integer i = 0; i < segments.size(); i++) {
            ShiftSegment seg = segments[i];
            System.debug('\n=== Processing Segment ' + (i+1) + ' ===');
            System.debug('Segment Type: ' + seg.shifttype);
            System.debug('Declared Start: ' + seg.starttime);
            System.debug('Declared End: ' + seg.endtime);
            System.debug('seg.hourlyrate: ' + seg.hourlyrate);
            System.debug('seg.rowOnchangeOccured: ' + seg.rowOnchangeOccured);
            // Convert segment times to UTC
            DateTime rowStartUTC, rowEndUTC;
            Date rowStartDate, rowEndDate;
            String rowStartDay, rowEndDay;
            
            if (i == 0) {
                // First row must match shift start
                rowStartUTC = shiftStartUTC;
                rowStartDate = shiftStartDate;
              //  System.debug('First row start (shift start): ' + rowStartUTC);
                
                rowEndUTC = calculateEndTime(rowStartUTC, seg.endtime);
                rowEndDate = rowEndUTC.date();
             //   System.debug('First row end calculated: ' + rowEndUTC);
                
                // Verify first row's start time matches the segment's declared start time
                DateTime declaredStart = toDateTimeUTC(shiftStartDate, seg.starttime);
               // System.debug('Declared start converted: ' + declaredStart + ' (' + declaredStart.getTime() + ' ms)');
                
                if (rowStartUTC.getTime() != declaredStart.getTime()) {
                   // System.debug('First row mismatch - Computed: ' + rowStartUTC.getTime() + ' vs Declared: ' + declaredStart.getTime());
                    result.isValid = false;
                    result.errorMessage = 'First row must start at shift start time.';
                    return result;
                }
            } else {
                // Subsequent rows start where previous ended
                rowStartUTC = lastEndUTC;
                rowStartDate = rowStartUTC.date();
             //   System.debug('Subsequent row start (from previous end): ' + rowStartUTC);
                
                rowEndUTC = calculateEndTime(rowStartUTC, seg.endTime);
                rowEndDate = rowEndUTC.date();
             //   System.debug('Row end calculated: ' + rowEndUTC);
                
                // Verify this row's declared start matches the actual computed start
                Date baseDate = rowStartUTC.date();
                DateTime declaredStart = toDateTimeUTC(baseDate, seg.starttime);
             //   System.debug('Declared start converted: ' + declaredStart + ' (' + declaredStart.getTime() + ' ms)');
                
                // Enhanced validation for gaps/overlaps
                if (rowStartUTC.getTime() != declaredStart.getTime()) {
                 //   System.debug('Computed start: ' + rowStartUTC + ' (' + rowStartUTC.getTime() + ' ms)');
                 //   System.debug('Declared start: ' + declaredStart + ' (' + declaredStart.getTime() + ' ms)');
                    
                    // Check if this creates a gap or overlap
                    if (declaredStart < rowStartUTC) {
                        result.errorMessage = 'Row ' + (i + 1) + ' overlaps with previous row. ' ;
                          //  'Expected start: ' + rowStartUTC.format('HH:mm') + 
                          //  ', Found: ' + declaredStart.format('HH:mm');
                    } else {
                        result.errorMessage = 'Row ' + (i + 1) + ' has a gap from previous row. ' ;
                         //   'Expected start: ' + rowStartUTC.format('HH:mm') + 
                          //  ', Found: ' + declaredStart.format('HH:mm');
                    }
                    result.isValid = false;
                    return result;
                }
            }
            
            // Get day names
            rowStartDay = DateTime.newInstance(rowStartDate, Time.newInstance(0, 0, 0, 0)).format('EEEE');
            rowEndDay = DateTime.newInstance(rowEndDate, Time.newInstance(0, 0, 0, 0)).format('EEEE');
            
            // Check for invalid time sequence (end before start)
            if (rowEndUTC <= rowStartUTC) {
               // System.debug('Invalid time sequence - End: ' + rowEndUTC + ' <= Start: ' + rowStartUTC);
                result.isValid = false;
                result.errorMessage = 'Row ' + (i + 1) + ' has end time (' + rowEndUTC.format('HH:mm') + 
                    ') before start time (' + rowStartUTC.format('HH:mm') + ')';
                return result;
            }
				
            Boolean isHoliday = holidaysByDate.containsKey(rowStartDate);
            Decimal calculatedRate = calculateHourlyRate(staff, seg.shifttype, rowStartDay, isHoliday); 
            
            // Add enriched data with dates and day names
            enriched.add(new Map<String, Object>{
                'shifttype' => seg.shifttype,
                    'startdate' => rowStartUTC.format('yyyy-MM-dd\'T\'HH:mm:ss.SSSZ'),
                    'enddate' => rowEndUTC.format('yyyy-MM-dd\'T\'HH:mm:ss.SSSZ'),
                    'startDateOnly' => rowStartDate,
                    'endDateOnly' => rowEndDate,
                     'isNextDayStart'=>shiftStartDate !=rowStartDate,
                    'startDay' => rowStartDay,
                    'endDay' => rowEndDay,
                    'duration' => Decimal.valueOf(rowEndUTC.getTime() - rowStartUTC.getTime()) / (1000 * 60 * 60),
                    'id'=>seg.id,
                    'rateLabel'=>seg.rateLabel,
                    'shifttype'=>seg.shifttype,
                    'starttimeAmPm' =>seg.starttimeAmPm,
                    'endtimeAmPm'=>seg.endtimeAmPm,
                    'starttime'=>seg.starttime,
                    'endtime'=>seg.endtime,
                    'hourlyrate' =>seg.rowOnchangeOccured==true ?string.valueof(seg.hourlyrate): string.valueof(calculatedRate),
                     'rowOnchangeOccured' =>seg.rowOnchangeOccured,
                    //'hourlyRate'=>seg.hourlyRate,
                    'index'=>seg.index,
                    'isHoliday' => isHoliday,
                    'holidayName' => isHoliday ? holidaysByDate.get(rowStartDate).Holiday_Name__c : null,
                    'calculatedRate' =>seg.rowOnchangeOccured==true ? Decimal.valueof(seg.hourlyrate) : calculatedRate,
                    'startTimeselectedHour' => seg.startTimeselectedHour,
                    'startTimeselectedMinute' => seg.startTimeselectedMinute,
                    'startTimeselectedAmPm' => seg.startTimeselectedAmPm,
                    'startTimdisplayTime' => seg.startTimdisplayTime,
                    
                    'endTimeselectedHour' => seg.endTimeselectedHour,
                    'endTimeselectedMinute' => seg.endTimeselectedMinute,
                    'endTimeselectedAmPm' => seg.endTimeselectedAmPm,
                    'endTimeDdisplayTime' => seg.endTimeDdisplayTime
                    });
            
            lastEndUTC = rowEndUTC;
           // System.debug('Processed successfully. Last end time now: ' + lastEndUTC);
            System.debug('Segment details: ' + JSON.serialize(enriched[i]));
        }
        // 4. Validate last segment matches shift end
        System.debug('\n=== Final Validation ===');
          System.debug('\n===ENriched '+enriched);
        System.debug('Last segment end: ' + lastEndUTC.getTime() + ' ms');
        System.debug('Shift end: ' + shiftEndUTC.getTime() + ' ms');
        
        if (lastEndUTC.getTime() != shiftEndUTC.getTime()) {
            System.debug('Final end time mismatch!');
            result.isValid = false;
            result.errorMessage = 'Last row end time does not match shift end time.';
            return result;
        }

        result.enrichedSegmentsJson = JSON.serialize(enriched);
        System.debug('=== VALIDATION SUCCESSFUL ===');
        System.debug('Enriched JSON: ' + result.enrichedSegmentsJson);
        return result;
    }

    // Convert to UTC DateTime for timezone-independent comparison
    private static DateTime toDateTimeUTC(Date baseDate, String timeStr) {
      //  System.debug('Converting to UTC - Date: ' + baseDate + ' Time: ' + timeStr);
        if (String.isBlank(timeStr)) return null;
        
        // Remove Z if present and parse time
        String cleanTime = timeStr.endsWith('Z') ? timeStr.substring(0, timeStr.length()-1) : timeStr;
        List<String> parts = cleanTime.split(':');
      //  System.debug('Time parts: ' + parts);
        
        // Create DateTime in user's timezone
        DateTime dt = DateTime.newInstance(
            baseDate,
            Time.newInstance(
                Integer.valueOf(parts[0]), // hour
                parts.size() > 1 ? Integer.valueOf(parts[1]) : 0, // minute
                parts.size() > 2 ? Integer.valueOf(parts[2]) : 0, // second
                0 // millisecond
            )
        );
        
      //  System.debug('Local DateTime: ' + dt);
        // Convert to UTC for consistent comparison
        DateTime utcDT = DateTime.newInstance(dt.getTime());
      //  System.debug('UTC DateTime: ' + utcDT);
        return utcDT;
    }

    // Calculate end time handling overnight cases
    private static DateTime calculateEndTime(DateTime startDT, String endTimeStr) {
      //  System.debug('Calculating end time - Start: ' + startDT + ' End: ' + endTimeStr);
        String cleanEndTime = endTimeStr.endsWith('Z') ? endTimeStr.substring(0, endTimeStr.length()-1) : endTimeStr;
        List<String> parts = cleanEndTime.split(':');
       // System.debug('End time parts: ' + parts);
        
        Time endTime = Time.newInstance(
            Integer.valueOf(parts[0]), // hour
            parts.size() > 1 ? Integer.valueOf(parts[1]) : 0, // minute
            parts.size() > 2 ? Integer.valueOf(parts[2]) : 0, // second
            0 // millisecond
        );
        
        DateTime endDT = DateTime.newInstance(startDT.date(), endTime);
      //  System.debug('Initial endDT: ' + endDT);
        
        // Handle overnight case (end time is earlier than start time in 24-hour clock)
        if (endDT <= startDT) {
          //  System.debug('Overnight case detected - adding 1 day');
            endDT = endDT.addDays(1);
        }
        
        DateTime utcEndDT = DateTime.newInstance(endDT.getTime()); // return as UTC
      //  System.debug('Final endDT (UTC): ' + utcEndDT);
        return utcEndDT;
    }
    
    public static Decimal calculateHourlyRate(Staff__c staff, String shiftType, String dayName, Boolean isHoliday) {
        Decimal hourlyRate = 0;
        
        if (isHoliday) {
            hourlyRate = staff.Public_holiday_Hourly_Rate__c != null ? staff.Public_holiday_Hourly_Rate__c : 0;
        } else {
            switch on dayName {
                when 'Saturday' {
                    hourlyRate = staff.Saturday_Hourly_Rate__c != null ? staff.Saturday_Hourly_Rate__c : 0;
                }
                when 'Sunday' {
                    hourlyRate = staff.Sunday_Hourly_Rate__c != null ? staff.Sunday_Hourly_Rate__c : 0;
                }
                when else {
                    switch on shiftType {
                        when 'General', 'Morning', 'Custom' {
                            hourlyRate = staff.Working_Hours_Rate__c != null ? staff.Working_Hours_Rate__c : 0;
                        }
                        when 'Afternoon' {
                            hourlyRate = staff.Afternoon_shift_Hourly_Rate__c != null ? staff.Afternoon_shift_Hourly_Rate__c : 0;
                        }
                        when 'Night' {
                            hourlyRate = staff.Night_shift_Hourly_Rate__c != null ? staff.Night_shift_Hourly_Rate__c : 0;
                        }
                         when 'Sleepover Shift' {
                            hourlyRate = staff.Sleepover_Allowance__c != null ? staff.Sleepover_Allowance__c : 0;
                        }
                        when else {
                            hourlyRate = staff.Working_Hours_Rate__c != null ? staff.Working_Hours_Rate__c : 0;
                        }
                    }
                }
            }
        }
        return hourlyRate;
    }
}