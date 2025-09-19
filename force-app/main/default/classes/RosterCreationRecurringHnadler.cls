public with sharing class RosterCreationRecurringHnadler {
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getNumberOfRecurrences(String typeOfRecur, Integer recurEvery, String endDate, String shiftDate, List<String> weeklyDays, Integer monthlyDay) {
        Map<String, Object> result = new Map<String, Object>();
        List<Date> recurrenceDates = new List<Date>();
        
        try {
            system.debug('typeOfRecur >> '+typeOfRecur);
            system.debug('recurEvery >> '+recurEvery);
            system.debug('endDate >>'+endDate);
            system.debug('shiftDate >>'+shiftDate);
            // Validate inputs
            if (String.isEmpty(typeOfRecur) || recurEvery == null || String.isEmpty(endDate) || String.isEmpty(shiftDate)) {
                throw new IllegalArgumentException('Invalid input parameters==>.');
            }
            
            // Convert date strings to Date objects
            Date shiftStartDate = Date.valueOf(shiftDate);
            Date recurEndDate = Date.valueOf(endDate);
            
            // Ensure start date is before or equal to end date
            if (shiftStartDate > recurEndDate) {
                throw new IllegalArgumentException('Start date cannot be after the end date.');
            }
            
            Decimal numberOfOccurrences = 0;
            
            switch on typeOfRecur {
                when 'Daily' {
                    Integer numberDays = shiftStartDate.daysBetween(recurEndDate);
                    numberOfOccurrences = numberDays / recurEvery;
                    if (Math.mod(numberDays, recurEvery) > 0) {
                        numberOfOccurrences += 1; // Add 1 if there’s a remainder
                    }
                    
                    // Generate recurrence dates
                    Date currentDate = shiftStartDate;
                    while (currentDate <= recurEndDate) {
                        recurrenceDates.add(currentDate);
                        currentDate = currentDate.addDays(recurEvery);
                    }
                }
                when 'Weekly' {
                    if (weeklyDays == null || weeklyDays.isEmpty()) {
                        throw new IllegalArgumentException('Weekly recurrence requires specific days.');
                    }
                    
                    Integer numberDays = shiftStartDate.daysBetween(recurEndDate);
                    Integer numberOfWeeks = numberDays / 7;
                    numberOfOccurrences = numberOfWeeks / recurEvery;
                    if (Math.mod(numberOfWeeks, recurEvery) > 0) {
                        numberOfOccurrences += 1;
                    }
                    
                    // Generate recurrence dates
                    for (Integer i = 0; i <= numberOfOccurrences; i++) {
                        Date baseWeekDate = shiftStartDate.addDays(i * recurEvery * 7);
                        for (String day : weeklyDays) {
                            Integer dayOfWeek = getDayOfWeek(day); // Helper method to get day index
                            Date weeklyDate = getNextDayOfWeek(baseWeekDate, dayOfWeek);
                            if (weeklyDate <= recurEndDate) {
                                recurrenceDates.add(weeklyDate);
                            }
                        }
                    }
                }
                when 'Monthly' {
                    if (monthlyDay == null || monthlyDay < 1 || monthlyDay > 31) {
                        throw new IllegalArgumentException('Monthly recurrence requires a valid day number (1-31).');
                    }
                    
                    Integer monthsBetween = shiftStartDate.monthsBetween(recurEndDate);
                    numberOfOccurrences = monthsBetween / recurEvery;
                    if (Math.mod(monthsBetween, recurEvery) > 0) {
                        numberOfOccurrences += 1;
                    }
                    
                    // Generate recurrence dates
                    for (Integer i = 0; i <= numberOfOccurrences; i++) {
                        Date monthlyBaseDate = shiftStartDate.addMonths(i * recurEvery);
                        Date monthlyRecurrenceDate = getMonthlyDate(monthlyBaseDate, monthlyDay); // Helper method for date
                        if (monthlyRecurrenceDate <= recurEndDate) {
                            recurrenceDates.add(monthlyRecurrenceDate);
                        }
                    }
                }
                
                when else {
                    throw new IllegalArgumentException('Invalid recurrence type. Choose Daily, Weekly, or Monthly.');
                }
            }
            
            // Populate success response
            result.put('isSuccess', true);
            result.put('NumberOfOccurrences', recurrenceDates.size());
            result.put('RecurrenceDates', recurrenceDates);
        } catch (Exception e) {
            // Handle errors and populate failure response
            result.put('isSuccess', false);
            result.put('NumberOfOccurrences', 0);
            result.put('RecurrenceDates', new List<Date>());
            result.put('failureMessage', e.getMessage());
        }
        system.debug('result >>'+ result);
        
        return result;
    }
    
    // Helper method to get day of the week index (1=Sunday, 7=Saturday)
    private static Integer getDayOfWeek(String dayName) {
        Map<String, Integer> dayMapping = new Map<String, Integer>{
            'Sunday' => 0, 'Monday' => 1, 'Tuesday' => 2, 'Wednesday' => 3,
                'Thursday' => 4, 'Friday' => 5, 'Saturday' => 6
                };
                    return dayMapping.get(dayName);
    }
    
    private static Date getNextDayOfWeek(Date startDate, Integer dayOfWeek) {
        // Get the current day of the week (1 = Monday, 7 = Sunday)
        Integer currentDayOfWeek = Integer.valueOf(
            DateTime.newInstance(startDate.year(), startDate.month(), startDate.day(), 0, 0, 0)
            .format('u')
        );
        // Calculate days to add
        Integer daysToAdd = dayOfWeek - currentDayOfWeek;
        if (daysToAdd < 0) {
            daysToAdd += 7; // Wrap around to the next week
        }
        // Only add days if `startDate` is not already the target day
        if (daysToAdd == 0) {
            return startDate;
        }
        return startDate.addDays(daysToAdd);
    }
    
    // Helper method to get a specific day of the month
    private static Date getMonthlyDate(Date baseDate, Integer dayOfMonth) {
        // Handle case where the desired day exceeds the number of days in the month
        Date lastDayOfMonth = Date.newInstance(baseDate.year(), baseDate.month(), 1).addMonths(1).addDays(-1);
        if (dayOfMonth > lastDayOfMonth.day()) {
            return lastDayOfMonth; // Return the last day of the month if the day exceeds the max days
        }
        return Date.newInstance(baseDate.year(), baseDate.month(), dayOfMonth);
    }
    
    @AuraEnabled
    public static Map<String, Object> HolidaysPopup(List<Date> recurrenceDates, Id StaffId) {
        Map<String, Object> result = new Map<String, Object>();
        
        Id currentUserId = UserInfo.getUserId();
        System.debug('Current User Id: ' + currentUserId);
        System.debug('recurrenceDates: ' + recurrenceDates);
        
        List<Staff__c> staffList = [ SELECT Id, Email_Address__c,Public_holiday_Hourly_Rate__c FROM Staff__c WHERE Id = :StaffId LIMIT 1]; 
        
        List<String> formattedDates = new List<String>();
        for (Date recurDate : recurrenceDates) {            
            string formattedDate = String.valueOf(recurDate.year()) + '-' +
                String.valueOf(recurDate.month()) + '-' +
                String.valueOf(recurDate.day()); 
            formattedDates.add(formattedDate);
        }
        
        System.debug('Formatted Recurrence Dates: ' + formattedDates);
        
        User currentUser = [
            SELECT Id, Name, Organization_Name__c
            FROM User
            WHERE Id = :currentUserId
            LIMIT 1
        ];
        
        String orgName = currentUser.Organization_Name__c;
        System.debug('Organization Name: ' + orgName);
        
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
        System.debug('Extracted State Code: ' + stateCode);
        System.debug('Extracted State Name: ' + stateName);
        System.debug('Extracted fullStateNames: ' + fullStateNames);
        Set<Date> recurrenceDateSet = new Set<Date>(recurrenceDates);
        List<Public_Holiday__c> rawHolidays = [
            SELECT Id, Name, Date__c, State__c,Holiday_Name__c
            FROM Public_Holiday__c
            WHERE Date__c IN :recurrenceDateSet
            ORDER BY Date__c ASC
        ];
        
        system.debug('rawHolidays >>'+rawHolidays);
        
        List<Public_Holiday__c> holidays = new List<Public_Holiday__c>();
        for (Public_Holiday__c holiday : rawHolidays) {
            for (String selectedState : fullStateNames) {
                if (holiday.State__c != null && holiday.State__c.contains(selectedState)) {
                    holidays.add(holiday);
                }
            }
        }
        system.debug('holidays >>'+holidays);
        
        result.put('holidays', holidays);
        result.put('Holidayrate', staffList);
        
        return result;
    }    
}