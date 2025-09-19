public with sharing class StaffAvailabilityController {
    @AuraEnabled(cacheable=true)
    public static Staff__c getstaffId(String userId){
        User user = [SELECT Id, Email FROM User WHERE Id = :userId LIMIT 1];
        
        List<Staff__c> staffList = [ SELECT Id, Email_Address__c FROM Staff__c WHERE Email_Address__c = :user.Email LIMIT 1];
        
        return staffList[0];     
    }
    
    @AuraEnabled
    public static void saveStaffData(Id avaliableId, String shiftDateStr, String shiftType, Boolean isRecurring, List<String> weeklyDays, 
                                     String startTime, String endTime, Id staffId, String endDate, String typeOfRecur, Integer recurEvery,
                                     Integer monthlyDay) {
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
                                                     
                                                     for (Object dateObj : recurrenceDates) {
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
                                                 String shiftDateFormatted = String.valueOf(shiftDate);
                                                 System.debug('Converted Shift Date: ' + shiftDateFormatted);
                                                 availabilityRecord.Staff__c = staffId;
                                                 availabilityRecord.Shift_Type__c = shiftType;
                                                 availabilityRecord.Start_Time__c = parseTime(startTime);
                                                 availabilityRecord.End_Time__c = parseTime(endTime);
                                                 availabilityRecord.Start_Date__c = shiftDate;
                                                
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
                                                     
                                                     for (Object dateObj : recurrenceDates) {
                                                         if(date.valueOf(dateObj) != date.valueOf(shiftDateFormatted2)){
                                                         Date recurrenceDate = Date.valueOf(String.valueOf(dateObj));
                                                         System.debug('Recurring Date: ' + recurrenceDate);
                                                         
                                                         Availability__c recurringAvailability = new Availability__c();
                                                         recurringAvailability.Staff__c = staffId;
                                                         recurringAvailability.Shift_Type__c = shiftType;
                                                         recurringAvailability.Start_Time__c = parseTime(startTime);
                                                         recurringAvailability.End_Time__c = parseTime(endTime);
                                                         recurringAvailability.Start_Date__c = recurrenceDate;
                                                         
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
                                             //throw new AuraHandledException('Error saving staff data: ' + e.getMessage());
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
    
    @AuraEnabled
    public static List<Map<String, String>> getStaffOptions(String role, Id participantId) {
        // Step 1: Get related Participant_Staff_Association__c records for the given participant
        List<Participant_Staff_Association__c> psaRecords = [
            SELECT Id, Staff__c, Staff__r.Name, Participant__c, Role__c
            FROM Participant_Staff_Association__c
            WHERE Participant__c = :participantId
        ];
        
        
        // Step 2: Collect Staff IDs
        Set<Id> staffIds = new Set<Id>();
        for (Participant_Staff_Association__c psa : psaRecords) {
            system.debug('psa Record'+psa.Staff__r.Name);
            staffIds.add(psa.Staff__c);
        }
        
        // Step 3: Query Staff__c based on ID and Role
        List<Staff__c> staffRecords = [
            SELECT Id, Name, Last_Name__c, Role__c
            FROM Staff__c
            WHERE Id IN :staffIds AND Role__c INCLUDES (:role)
        ];
        
        System.debug('🔍 Filtered Staff Records: ' + staffRecords);
        
        // Step 4: Prepare list of options for picklist
        List<Map<String, String>> staffOptions = new List<Map<String, String>>();
        for (Staff__c staff : staffRecords) {
            Map<String, String> option = new Map<String, String>();
            option.put('label', staff.Name + ' ' + staff.Last_Name__c);
            option.put('value', staff.Id);
            staffOptions.add(option);
        }
        
        return staffOptions;
    }
    
    /* @AuraEnabled(cacheable=true)
public static  List<NDIS_Support_Catalogue__c> getCatalogueData(Id serviceType, Id clientId) { 
system.debug('serviceType >>'+serviceType);
system.debug('clientId >>'+clientId);
List<ClientFundTrackerJN__c> supportItems = [
SELECT Id,NDIS_Support_Catalogue__c,Participant__c,Funds_Tracker__c,Funds_Tracker__r.State__c FROM ClientFundTrackerJN__c 
WHERE Participant__c =:clientId AND Funds_Tracker__c = :serviceType];

System.Debug('Support Items :'+supportItems);
System.Debug('Support Items :'+supportItems[0].Funds_Tracker__r.State__c);

String statesCombined = supportItems[0].Funds_Tracker__r.State__c;

System.Debug('statesCombined :'+statesCombined);

List<String> supportItemIds = new List<String>();
for (ClientFundTrackerJN__c item : supportItems) {
supportItemIds.add(item.NDIS_Support_Catalogue__c);
}

String queryStr = 'SELECT Id, Name, Support_Item_Name__c, Support_Category_Number__c, Start_Date__c, ' +
' ' + statesCombined + ' ' +
'FROM NDIS_Support_Catalogue__c ' +
'WHERE Id IN: supportItemIds';

// Step 2: Execute it dynamically
List<NDIS_Support_Catalogue__c> listNDISCatalog = Database.query(queryStr);
System.debug('Number of records found: ' + listNDISCatalog.size());
System.Debug('List of NDIS Support Catalog :'+listNDISCatalog); 
return listNDISCatalog; 
}*/
    
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
            //System.debug('>> Processing shift data: ' + Date.valueOf((String)shiftData.get('endDateShift')));
            System.debug('>> Processing shift data: ' + Date.valueOf((String)shiftData.get('todayDate')));
            List<Object> roleRows1 = (List<Object>)shiftData.get('roleRows');
            System.debug('>> Role rows data: ' + roleRows1);
            
            for (Object roleRow : roleRows1) {
                Map<String, Object> roleData = (Map<String, Object>)JSON.deserializeUntyped(JSON.serialize(roleRow));
                System.debug('>> Role Data: ' + roleData);
                String roleName = (String)shiftData.get('roleId');
                System.debug('>> Role Name: ' + roleName);
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
                List<Priority_Staff__c> priorityStaffToInsert = new List<Priority_Staff__c>();
                
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
                
                for (Availability__c avail : availabilitiesToInsert) {
                    for (Map<String, Object> row : roleRows) {
                        String staffId = (String)row.get('selectedStaff');
                        String priorityStr = String.valueOf(row.get('priority'));
                        system.debug('staffId >>'+staffId);
                		if(staffId != null && staffId != '' ){
                            Priority_Staff__c ps = new Priority_Staff__c();
                            ps.Availability__c = avail.Id;
                            ps.Staff__c = staffId;
                            ps.Priority__c = priorityStr;
                            
                            // Set unique external key for upsert
                            //ps.Unique_External_Key__c = avail.Id + '_' + staffId;
                            
                            priorityStaffToInsert.add(ps);
                            System.debug('>> Added Priority_Staff__c record for staff ' + staffId);
                        }
                    }
                }
                
                System.debug('>> Upserting Priority_Staff__c records: ' + priorityStaffToInsert);
                upsert priorityStaffToInsert;
                
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
            System.debug('>> Updating existing availability record with ID: ' + availabilityId);
            availability.Shift_Type__c = (String)shiftData.get('shiftType');
            System.debug('>> Updating existing availability record with ID: ' + availabilityId);
            availability.Start_Time__c = parseTime((String)shiftData.get('startTime'));
            System.debug('>> Updating existing availability record with ID: ' + availabilityId);
            availability.End_Time__c = parseTime((String)shiftData.get('endTime'));
            System.debug('>> Updating existing availability record with ID: ' + availabilityId);
            availability.Start_Date__c = Date.valueOf((String)shiftData.get('todayDate'));
            System.debug('>> Updating existing availability record with ID: ' + availabilityId);
            if (shiftData != null && shiftData.containsKey('endDateShift') && shiftData.get('endDateShift') != null && String.valueOf(shiftData.get('endDateShift')).trim() != '') {
                availability.End_Date__c = Date.valueOf((String)shiftData.get('endDateShift'));
            } 
            System.debug('>> Updating existing availability record with ID: ' + availabilityId);
            
            if (shiftData.containsKey('serviceTypeId')) availability.Funds_Tracker__c = (Id)shiftData.get('serviceTypeId');
            if (shiftData.containsKey('regionState')) availability.State__c = (String)shiftData.get('regionState');
            if (shiftData.containsKey('catalogId')) availability.NDIS_Support_Catalogue__c = (Id)shiftData.get('catalogId');
            if (shiftData.containsKey('roleId')) availability.Role__c = (String)shiftData.get('roleId');
            System.debug('>> Saved Availability__c with ID: ');
            upsert availability;
            System.debug('>> Saved Availability__c with ID: ' + availability.Id);
            List<Priority_Staff__c> PSList= [Select Id From Priority_Staff__c Where Availability__c =: availability.Id];
            List<Priority_Staff__c> priorityStaffList = new List<Priority_Staff__c>();
            for (Object roleRow : roleRows1) {
                Map<String, Object> roleData = (Map<String, Object>)JSON.deserializeUntyped(JSON.serialize(roleRow));
                String staffId = (String)roleData.get('selectedStaff');
                String priorityStr = String.valueOf(roleData.get('priority'));
                system.debug('staffId >>'+staffId);
                if(staffId != null && staffId != '' ){
                    System.debug('>> Added Priority_Staff__c record for non-recurring staff ' + staffId);
                    Priority_Staff__c ps = new Priority_Staff__c();
                    ps.Availability__c = availability.Id;
                    ps.Staff__c = staffId;
                    ps.Priority__c = priorityStr;
                    //ps.Unique_External_Key__c = availability.Id + '_' + staffId;
                    
                    priorityStaffList.add(ps);
                    
                }
                
            }
            
            System.debug('>> Upserting Priority_Staff__c records for non-recurring availability: ' + priorityStaffList);
            //upsert priorityStaffList;
            if(priorityStaffList.size() > 0){
                delete PSList;
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
    public static List<Availability__c> getParticipantAvailability(Id clientId, string datePicker) {
        system.debug('client id'+clientId);
        Date startDate = Date.valueOf(datePicker) -30 ;
        Date endDate = Date.valueOf(datePicker)+30;
        
        
        return [SELECT Id, Name, Staff__c, Participant__c, Start_Date__c, 
                End_Date__c, Start_Time__c, End_Time__c, Type_of_User__c,
                Shift_Type__c, Funds_Tracker__c, State__c, NDIS_Support_Catalogue__c, 
                Role__c,(SELECT Id, Name,Availability__c,
                         Staff__r.Name,Staff__c,
                         Priority__c FROM Priority_Staffs__r) FROM Availability__c 
                WHERE Participant__c  = :clientId AND Start_Date__c  >= :startDate  AND Start_Date__c  <= :endDate ];
    }
    
    @AuraEnabled
    public static List<Availability__c> getStaffAvailability(Id clientId, string datePicker) {
        system.debug('client id'+clientId);
        Date startDate = Date.valueOf(datePicker) -30 ;
        Date endDate = Date.valueOf(datePicker)+30;
        
        
        return [SELECT Participant__c, Shift_Type__c, Id, Start_Date__c, Start_Time__c, End_Time__c, Type_of_User__c, Funds_Tracker__c, State__c FROM Availability__c 
                WHERE Participant__c  = :clientId AND Start_Date__c  >= :startDate  AND Start_Date__c  <= :endDate ];
    }
}