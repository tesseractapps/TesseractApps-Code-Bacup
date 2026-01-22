public class SplitShiftValidations {
    public class ShiftSegment {
        public String id;
        public String shifttype;
        public String starttime; 
        public String endtime;   
        public String rateLabel;
        public Decimal hourlyRate;
        public Boolean rowOnchangeOccured;
        public Integer index;
        public String startTimeSelectedHour;    
        public String startTimeSelectedMinute;  
        public String startTimeSelectedAmPm;   
        public String startTimeDisplayTime;    
        public String endTimeSelectedHour;     
        public String endTimeSelectedMinute;   
        public String endTimeSelectedAmPm;    
        public String endTimeDisplayTime; 
        public boolean rowBillableHoursChanged;
        public decimal billablehours;
    }

    public class ValidationResult {
        @AuraEnabled public Boolean isValid = true;
        @AuraEnabled public String errorMessage;
        @AuraEnabled public List<EnrichedSegment> enrichedSegments;
    }

    public class EnrichedSegment {
        @AuraEnabled public String id;
        @AuraEnabled public String rowShiftType;
        @AuraEnabled public String startTime;
        @AuraEnabled public String endTime;
        @AuraEnabled public DateTime startDateTime;
        @AuraEnabled public DateTime endDateTime;
        @AuraEnabled public Date startDate;
        @AuraEnabled public Date endDate;
        @AuraEnabled public String startDay;
        @AuraEnabled public String endDay;
        @AuraEnabled public Decimal duration;
        @AuraEnabled public Decimal hourlyRate;
        @AuraEnabled public String rateLabel;
        @AuraEnabled public Boolean isHoliday;
        @AuraEnabled public String holidayName;
        @AuraEnabled public Boolean isNextDay;
        @AuraEnabled public string shifttype;
    }

    @AuraEnabled 
    public static ValidationResult validateAndEnrichShifts(
        Date shiftStartDate, String shiftStartTime,
        Date shiftEndDate, String shiftEndTime,
        String segmentsJson, String staffId,string role
    ) {
        ValidationResult result = new ValidationResult();
        result.enrichedSegments = new List<EnrichedSegment>();
        
        try {
            System.debug('=== STARTING VALIDATION ===');
            System.debug('shiftStartDate: ' + shiftStartDate + ', shiftStartTime: ' + shiftStartTime);
            System.debug('shiftEndDate: ' + shiftEndDate + ', shiftEndTime: ' + shiftEndTime);
            System.debug('staffId: ' + staffId);
            
            // Parse input segments
            System.debug('Parsing segments JSON...');
            List<ShiftSegment> segments = (List<ShiftSegment>) JSON.deserialize(segmentsJson, List<ShiftSegment>.class);
            System.debug('Parsed ' + segments.size() + ' segments');
            
            if (segments == null || segments.isEmpty()) {
                result.isValid = false;
                result.errorMessage = 'No shift segments provided.';
                return result;
            }

            // Get staff rate information
            System.debug('Getting staff rates for: ' + staffId);
            Staff__c staff = getStaffRates(staffId,role);
              StaffRole__c roleRec = (staff.StaffRoles__r != null && !staff.StaffRoles__r.isEmpty()) 
                        ? staff.StaffRoles__r[0] 
                        : null;
            System.debug('Staff record: ' + staff);
            
            // Get holiday information (using the same approach as working code)
            System.debug('Getting holidays for date range...');
            Map<Date, Public_Holiday__c> holidaysByDate = getHolidaysByDate(shiftStartDate, shiftEndDate);
            System.debug('Found ' + holidaysByDate.size() + ' holidays');
            
            // Convert shift boundaries to UTC (using the working approach)
            System.debug('Converting shift boundaries to UTC...');
            DateTime shiftStartUTC = toDateTimeUTC(shiftStartDate, shiftStartTime);
            DateTime shiftEndUTC = toDateTimeUTC(shiftEndDate, shiftEndTime);
            System.debug('Shift Start UTC: ' + shiftStartUTC);
            System.debug('Shift End UTC: ' + shiftEndUTC);
            
            DateTime lastEndUTC = null;
            
            for (Integer i = 0; i < segments.size(); i++) {
                System.debug('=== Processing segment ' + (i+1) + ' ===');
                ShiftSegment seg = segments[i];
                System.debug('Segment ID: ' + seg.id);
                System.debug('Segment shifttype: ' + seg.shifttype);
                System.debug('Segment starttime: ' + seg.starttime);
                System.debug('Segment endtime: ' + seg.endtime);
                
                if (String.isBlank(seg.starttime) || String.isBlank(seg.endtime)) {
                    result.isValid = false;
                    result.errorMessage = 'Row ' + (i + 1) + ' must have both start and end times specified.';
                    return result;
                }
                
                EnrichedSegment enriched = new EnrichedSegment();
                
                // Set basic segment info
                enriched.id = seg.id;
                enriched.shifttype = seg.shifttype;
                enriched.rateLabel = seg.rateLabel;
                enriched.startTime = seg.starttime;
                enriched.endTime = seg.endtime;
                
                DateTime rowStartUTC, rowEndUTC;
                Date rowStartDate, rowEndDate;
                
                if (i == 0) {
                    // First row must match shift start
                    rowStartUTC = shiftStartUTC;
                    rowStartDate = shiftStartDate;
                    System.debug('First row start (shift start): ' + rowStartUTC);
                    
                    rowEndUTC = calculateEndTime(rowStartUTC, seg.endtime);
                    rowEndDate = rowEndUTC.date();
                    System.debug('First row end calculated: ' + rowEndUTC);
                    
                    // Verify first row's start time matches the segment's declared start time
                    DateTime declaredStart = toDateTimeUTC(shiftStartDate, seg.starttime);
                    System.debug('Declared start converted: ' + declaredStart + ' (' + declaredStart.getTime() + ' ms)');
                    
                    if (rowStartUTC.getTime() != declaredStart.getTime()) {
                        System.debug('First row mismatch - Computed: ' + rowStartUTC.getTime() + ' vs Declared: ' + declaredStart.getTime());
                        result.isValid = false;
                        result.errorMessage = 'First row must start at shift start time.';
                        return result;
                    }
                } else {
                    // Subsequent rows start where previous ended
                    rowStartUTC = lastEndUTC;
                    rowStartDate = rowStartUTC.date();
                    System.debug('Subsequent row start (from previous end): ' + rowStartUTC);
                    
                    rowEndUTC = calculateEndTime(rowStartUTC, seg.endtime);
                    rowEndDate = rowEndUTC.date();
                    System.debug('Row end calculated: ' + rowEndUTC);
                    
                    // Verify this row's declared start matches the actual computed start
                    Date baseDate = rowStartUTC.date();
                    DateTime declaredStart = toDateTimeUTC(baseDate, seg.starttime);
                    System.debug('Declared start converted: ' + declaredStart + ' (' + declaredStart.getTime() + ' ms)');
                    
                    // Enhanced validation for overlaps (gaps are allowed)
                    if (rowStartUTC.getTime() != declaredStart.getTime()) {
                        System.debug('Computed start: ' + rowStartUTC + ' (' + rowStartUTC.getTime() + ' ms)');
                        System.debug('Declared start: ' + declaredStart + ' (' + declaredStart.getTime() + ' ms)');
                        
                        // Check if this creates an overlap (gap is allowed, but overlap is not)
                        if (declaredStart < rowStartUTC) {
                            result.errorMessage = 'Row ' + (i + 1) + ' overlaps with previous row.';
                            result.isValid = false;
                            return result;
                        }
                        // If there's a gap (declaredStart > rowStartUTC), we allow it and just use the declared start time
                        else {
                            System.debug('Gap detected - using declared start time instead of continuous time');
                            rowStartUTC = declaredStart;
                            rowStartDate = rowStartUTC.date();
                            
                            // Recalculate end time based on the new start time
                            rowEndUTC = calculateEndTime(rowStartUTC, seg.endtime);
                            rowEndDate = rowEndUTC.date();
                            System.debug('Adjusted row end calculated: ' + rowEndUTC);
                        }
                    }
                }
                
                // Set the calculated times
                enriched.startDateTime = rowStartUTC;
                enriched.endDateTime = rowEndUTC;
                enriched.startDate = rowStartDate;
                enriched.endDate = rowEndDate;
                
                // Check if this segment spans multiple days
                enriched.isNextDay = enriched.startDate != enriched.endDate;
                System.debug('isNextDay: ' + enriched.isNextDay);
                
                // Get day names
                enriched.startDay = DateTime.newInstance(enriched.startDate, Time.newInstance(0, 0, 0, 0)).format('EEEE');
                enriched.endDay = DateTime.newInstance(enriched.endDate, Time.newInstance(0, 0, 0, 0)).format('EEEE');
                System.debug('startDay: ' + enriched.startDay + ', endDay: ' + enriched.endDay);
                
                // Calculate duration in hours
                Decimal calculatedDuartion=Decimal.valueOf(enriched.endDateTime.getTime() - enriched.startDateTime.getTime()) / (1000 * 60 * 60);
                enriched.duration = seg.rowBillableHoursChanged==true?seg.billablehours :calculatedDuartion; 
                System.debug('duration: ' + enriched.duration + ' hours');
                
                // Check for holiday
                enriched.isHoliday = holidaysByDate.containsKey(enriched.startDate);
                enriched.holidayName = enriched.isHoliday ? holidaysByDate.get(enriched.startDate).Holiday_Name__c : null;
                System.debug('isHoliday: ' + enriched.isHoliday + ', holidayName: ' + enriched.holidayName);
                
                // Calculate hourly rate
                System.debug('Calculating hourly rate...');
                System.debug('rowOnchangeOccured: ' + seg.rowOnchangeOccured);
                System.debug('hourlyRate: ' + seg.hourlyRate);
                
                Boolean hasCustomRate = (seg.rowOnchangeOccured != null && seg.rowOnchangeOccured == true) && seg.hourlyRate != null;
                System.debug('hasCustomRate: ' + hasCustomRate);
                
              
                    System.debug('Calculating rate using CustomShiftsValidations...');
                    enriched.hourlyRate = CustomShiftsValidations.calculateHourlyRate(staff,roleRec, seg.shifttype, enriched.startDay, enriched.isHoliday);
                    System.debug('Calculated rate: ' + enriched.hourlyRate);
                
                
                // Validate time sequence
                if (enriched.endDateTime <= enriched.startDateTime) {
                    System.debug('ERROR: End time before start time');
                    result.isValid = false;
                    result.errorMessage = 'Row ' + (i + 1) + ' has end time before start time.';
                    return result;
                }
                
                result.enrichedSegments.add(enriched);
                lastEndUTC = enriched.endDateTime;
                System.debug('Segment processed successfully. lastEndUTC: ' + lastEndUTC);
            }
            
            // Validate last segment ends at shift end time (with tolerance)
            System.debug('Validating final end time...');
            System.debug('lastEndUTC: ' + lastEndUTC);
            System.debug('shiftEndUTC: ' + shiftEndUTC);
            
            Long timeDifference = Math.abs(lastEndUTC.getTime() - shiftEndUTC.getTime());
            if (timeDifference > 1000) { // Allow 1 second tolerance
                System.debug('ERROR: Last row end time mismatch. Difference: ' + timeDifference + 'ms');
                result.isValid = false;
                result.errorMessage = 'Last row end time does not match shift end time.';
                return result;
            }
            
            System.debug('=== VALIDATION COMPLETED SUCCESSFULLY ===');
            
        } catch (Exception e) {
            System.debug('EXCEPTION CAUGHT: ' + e.getMessage());
            System.debug('Exception type: ' + e.getTypeName());
            System.debug('Line number: ' + e.getLineNumber());
            System.debug('Stack trace: ' + e.getStackTraceString());
            
            result.isValid = false;
            result.errorMessage = 'Validation error: ' + e.getMessage();
        }
        
        return result;
    }
    
    // Use the same helper methods as your working code
    private static DateTime toDateTimeUTC(Date baseDate, String timeStr) {
        if (String.isBlank(timeStr)) return null;
        
        // Remove Z if present and parse time
        String cleanTime = timeStr.endsWith('Z') ? timeStr.substring(0, timeStr.length()-1) : timeStr;
        List<String> parts = cleanTime.split(':');
        
        // Create DateTime in user's timezone
        DateTime dt = DateTime.newInstance(
            baseDate,
            Time.newInstance(
                Integer.valueOf(parts[0]),
                parts.size() > 1 ? Integer.valueOf(parts[1]) : 0,
                parts.size() > 2 ? Integer.valueOf(parts[2]) : 0,
                0
            )
        );
        
        // Convert to UTC for consistent comparison
        return DateTime.newInstance(dt.getTime());
    }

    // Calculate end time handling overnight cases (same as working code)
    public static DateTime calculateEndTime(DateTime startDT, String endTimeStr) {
        if (String.isBlank(endTimeStr)) return null;
        
        String cleanEndTime = endTimeStr.endsWith('Z') ? endTimeStr.substring(0, endTimeStr.length()-1) : endTimeStr;
        List<String> parts = cleanEndTime.split(':');
        
        Time endTime = Time.newInstance(
            Integer.valueOf(parts[0]),
            parts.size() > 1 ? Integer.valueOf(parts[1]) : 0,
            parts.size() > 2 ? Integer.valueOf(parts[2]) : 0,
            0
        );
        
        DateTime endDT = DateTime.newInstance(startDT.date(), endTime);
        
        // Handle overnight case (end time is earlier than start time in 24-hour clock)
        if (endDT <= startDT) {
            endDT = endDT.addDays(1);
        }
        
        return DateTime.newInstance(endDT.getTime()); // return as UTC
    }
    
    public static Staff__c getStaffRates(String staffId,string role) {
        return [SELECT Id, Public_holiday_Hourly_Rate__c, Saturday_Hourly_Rate__c, 
                       Sunday_Hourly_Rate__c, Working_Hours_Rate__c, Afternoon_shift_Hourly_Rate__c,
                       Night_shift_Hourly_Rate__c, Sleepover_Allowance__c ,(SELECT Id, RoleName__c,Afternoon_Shift_Hourly_Rate__c,Hourly_Rate__c,Night_Shift_Hourly_Rate__c,Public_Holiday_Hourly_Rate__c,Saturday_Hourly_Rate__c,Sleepover_Allowance__c,Sunday_Hourly_Rate__c, Active__c FROM StaffRoles__r WHERE Active__c = true AND RoleName__c =:role )

                FROM Staff__c 
                WHERE Id = :staffId 
                LIMIT 1];
    }
    
    public static Map<Date, Public_Holiday__c> getHolidaysByDate(Date startDate, Date endDate) {
        Map<Date, Public_Holiday__c> holidaysMap = new Map<Date, Public_Holiday__c>();
        
        // Get organization state for holiday filtering (same logic as working code)
        String stateName = getOrganizationState();
        if (String.isBlank(stateName)) return holidaysMap;
        
        // Get holidays within date range for the organization's state
        List<Public_Holiday__c> holidays = [
            SELECT Id, Name, Date__c, State__c, Holiday_Name__c
            FROM Public_Holiday__c
            WHERE Date__c >= :startDate AND Date__c <= :endDate
            AND State__c INCLUDES (:stateName)
        ];
        
        for (Public_Holiday__c holiday : holidays) {
            holidaysMap.put(holiday.Date__c, holiday);
        }
        
        return holidaysMap;
    }
    
    public static String getOrganizationState() {
        Id currentUserId = UserInfo.getUserId();
        User currentUser = [SELECT Id, Organization_Name__c FROM User WHERE Id = :currentUserId LIMIT 1];
        
        if (String.isBlank(currentUser.Organization_Name__c)) return null;
        
        Organisation__c org = [SELECT Id, Address__c FROM Organisation__c WHERE Name = :currentUser.Organization_Name__c LIMIT 1];
        
        if (String.isBlank(org.Address__c)) return null;
        
        // Extract state from address (same logic as working code)
        List<String> addressParts = org.Address__c.split(',');
        if (addressParts.size() >= 3) {
            List<String> stateParts = addressParts[2].trim().split(' ');
            if (!stateParts.isEmpty()) {
                String stateCode = stateParts[0].trim();
                Map<String, String> stateMap = new Map<String, String>{
                    'NSW' => 'New South Wales', 'VIC' => 'Victoria', 'QLD' => 'Queensland',
                    'SA' => 'South Australia', 'WA' => 'Western Australia', 'TAS' => 'Tasmania',
                    'ACT' => 'Australian Capital Territory', 'NT' => 'Northern Territory'
                };
                return stateMap.get(stateCode);
            }
        }
        
        return null;
    }
}