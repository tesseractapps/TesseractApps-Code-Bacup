public class ShiftwithStaffController {
    @AuraEnabled(cacheable=true)
    public static List<ShiftDataWrapper> getShiftData(String userId, Id facilityId) {
        system.debug('facilityId >>'+ facilityId);
         Id currentUserId = UserInfo.getUserId();       
        // Fetch the organization name associated with the user
        User userRecord = [SELECT Id, Name, Organization_Name__c FROM User WHERE Id = :currentUserId LIMIT 1];
        system.debug('userRecord >>'+ userRecord);
        // Ensure the Organization_Name__c field is not null
        if (String.isBlank(userRecord.Organization_Name__c)) {
            throw new AuraHandledException('The user does not have an organization name defined.');
        }
        
        // Query staff records for the organization
        List<Staff__c> staffRecords = [
            SELECT Id, Organization_Full_Name__c 
            FROM Staff__c 
            WHERE Organization_Full_Name__c = :userRecord.Organization_Name__c
        ];
        system.debug('staffRecords >>'+ staffRecords);
        
        // Ensure there are staff records for the organization
        if (staffRecords.isEmpty()) {
            throw new AuraHandledException('No staff records found for the user\'s organization.');
        }
        
        // Extract staff IDs into a Set for efficient querying
        Set<Id> staffIds = new Set<Id>();
        for (Staff__c staff : staffRecords) {
            staffIds.add(staff.Id);
        }
        
        // Get today's date
        Date today = Date.today();
        
        // Get the date for 3 days ago and 3 days later
        Date threeDaysAgo = today.addDays(-3);
        Date threeDaysLater = today.addDays(3);
        
        system.debug('threeDaysAgo >>'+ threeDaysAgo);
        system.debug('threeDaysLater >>'+ threeDaysLater);
        
        // Querying records from the last 7 days, dividing into past 3 days and future 3 days from the current date
        List<AggregateResult> results = [
            SELECT Date__c day, COUNT(Id) recordCount, Status__c status 
            FROM ShiftwithStaff__c 
            WHERE Date__c >= :threeDaysAgo 
                  AND Date__c <= :threeDaysLater 
                  AND Staff__c IN :staffIds
                  AND Add_Shift__r.Facility__c = :facilityId
            GROUP BY Date__c, Status__c 
            ORDER BY Date__c, Status__c
        ];

        
        // Process results into ShiftDataWrapper objects
        List<ShiftDataWrapper> shiftData = new List<ShiftDataWrapper>();
        for (AggregateResult result : results) {
            shiftData.add(new ShiftDataWrapper(
                (Date) result.get('day'),
                ((Long) result.get('recordCount')).intValue(), // Cast Long to Integer
                (String) result.get('status')
            ));
        }
        return shiftData;
    }
    
    // Wrapper class definition
    public class ShiftDataWrapper {
        @AuraEnabled
        public Date day { get; set; }
        @AuraEnabled
        public Integer recordCount { get; set; }
        @AuraEnabled
        public String status { get; set; }
        
        public ShiftDataWrapper(Date day, Integer recordCount, String status) {
            this.day = day;
            this.recordCount = recordCount;
            this.status = status;
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static List<ShiftWrapper> getStaffWeekData() {
        String userEmail = UserInfo.getUserEmail(); 
        System.debug('Entered getStaffWeekData method');
        System.debug('User Email: ' + userEmail);
        
        // Validate user email
        if (String.isBlank(userEmail)) {
            System.debug('Error: User email is null or empty');
            throw new AuraHandledException('User email cannot be null or empty.');
        }
        
        try {
            // Query shift data for the past 7 days
            System.debug('Querying ShiftwithStaff__c records...');
            List<AggregateResult> results = [
                SELECT Date__c day, 
                SUM(Duration__c) totalDuration, 
                SUM(Actual_Duration__c) actualDuration, 
                Status__c status
                FROM ShiftwithStaff__c
                WHERE Date__c = LAST_N_DAYS:7 
                AND Staff__r.Email_Address__c = :userEmail
                GROUP BY Date__c, Status__c
                ORDER BY Date__c, Status__c
            ];
            
            System.debug('Query Result - Aggregated Data: ' + results);
            
            // Process results into ShiftWrapper objects
            List<ShiftWrapper> shiftData = new List<ShiftWrapper>();
            for (AggregateResult result : results) {
                shiftData.add(new ShiftWrapper(
                    (Date) result.get('day'),
                    ((Double) result.get('totalDuration')), // Sum of Duration__c
                    ((Double) result.get('actualDuration')), // Sum of Actual_Duration__c
                    (String) result.get('status')
                ));
            }
            
            System.debug('Processed Shift Data: ' + shiftData);
            
            // Return the result
            System.debug('Exiting getStaffWeekData method successfully');
            return shiftData;
        } catch (Exception e) {
            System.debug('Error occurred in getStaffWeekData: ' + e.getMessage());
            throw new AuraHandledException('An error occurred while fetching shift data: ' + e.getMessage());
        }
    }
    
    // Wrapper class definition
    public class ShiftWrapper {
        @AuraEnabled
        public Date day { get; set; }
        @AuraEnabled
        public Double totalDuration { get; set; }
        @AuraEnabled
        public Double actualDuration { get; set; }
        @AuraEnabled
        public String status { get; set; }
        
        public ShiftWrapper(Date day, Double totalDuration, Double actualDuration, String status) {
            this.day = day;
            this.totalDuration = totalDuration;
            this.actualDuration = actualDuration;
            this.status = status;
        }
    }   
    
    @AuraEnabled(cacheable=true)
    public static List<gettimesheetDataWrapper> gettimesheetData(String userId, String selectedRange) {
        if (String.isBlank(userId)) {
            throw new AuraHandledException('User ID cannot be null or empty.');
        }

        User userRecord = [SELECT Id, Name, User_Type__c, Email, Organization_Name__c FROM User WHERE Id = :userId LIMIT 1];

        if (String.isBlank(userRecord.Organization_Name__c)) {
            throw new AuraHandledException('The user does not have an organization name defined.');
        }

        List<Staff__c> staffRecords = [
            SELECT Id, Organization_Full_Name__c 
            FROM Staff__c 
            WHERE Organization_Full_Name__c = :userRecord.Organization_Name__c
        ];

        List<Staff__c> staffList = [SELECT Id, Email_Address__c FROM Staff__c WHERE Email_Address__c = :userRecord.Email LIMIT 1];

        if (staffRecords.isEmpty()) {
            throw new AuraHandledException('No staff records found for the user\'s organization.');
        }

        Set<Id> staffIds = new Set<Id>();
        Integer numberOfWeeks = 1;
        if (String.isNotBlank(selectedRange) && selectedRange.endsWith('w')) {
            numberOfWeeks = Integer.valueOf(selectedRange.replace('w', ''));
        }

        Date today = Date.today();
        Date startOfRange = today.addDays(-7 * numberOfWeeks);
        Date endOfRange = today;

        List<AggregateResult> results = new List<AggregateResult>();

        if (userRecord.User_Type__c == 'ICT Admin') {
            for (Staff__c staff : staffRecords) {
                staffIds.add(staff.Id);
            }
            results = [
                SELECT Start_Date__c day, COUNT(Id) recordCount, Status__c status
                FROM Allocation__c 
                WHERE Start_Date__c >= :startOfRange AND Start_Date__c <= :endOfRange AND Staff__c IN :staffIds
                GROUP BY Start_Date__c, Status__c 
                ORDER BY Start_Date__c, Status__c
            ];
        } else {
            Id staffId = staffList[0].Id;
            results = [
                SELECT Start_Date__c day, COUNT(Id) recordCount, Status__c status
                FROM Allocation__c 
                WHERE Start_Date__c >= :startOfRange AND Start_Date__c <= :endOfRange AND Staff__c = :staffId
                GROUP BY Start_Date__c, Status__c 
                ORDER BY Start_Date__c, Status__c
            ];
        }

        List<gettimesheetDataWrapper> shiftData = new List<gettimesheetDataWrapper>();
        for (AggregateResult result : results) {
            Date day = (Date) result.get('day');
            String status = (String) result.get('status');
            Integer recordCount = ((Long) result.get('recordCount')).intValue();
            shiftData.add(new gettimesheetDataWrapper(day, recordCount, status));
        }

        return shiftData;
    }

    public class gettimesheetDataWrapper {
        @AuraEnabled public Date day { get; set; }
        @AuraEnabled public Integer recordCount { get; set; }
        @AuraEnabled public String status { get; set; }

        public gettimesheetDataWrapper(Date day, Integer recordCount, String status) {
            this.day = day;
            this.recordCount = recordCount;
            this.status = status;
        }
    }
    
    @AuraEnabled 
    public static list<ShiftwithStaff__c> getAllShiftWithSatff(String staffId,String StartDate,String EndDate){
        Date sDate = Date.valueOf(StartDate);
        Date eDate = Date.valueOf(EndDate);
        List<ShiftwithStaff__c> shifts = [select id,Staff__r.Email_Address__c,Staff__r.Name__c,Staff__r.Name,Staff__r.Enable_Geolocation__c,Staff__r.Role__c,Staff__r.Last_Name__c,Staff__r.picture__c,Facility__c,Add_Shift__r.Start_Date__c ,Actual_Duration__c,Add_Shift__r.Shift_Type__c,
                                          Shift_Type__c,Start_time_Formula__c,End_time_formula__c,Add_Shift__r.Shift_Start_End_Time__c,Attendence__c,Staff__c,Date__c,Shift_Wage__c,Add_Shift__r.Role__c,
                                          Staff__r.Set_Hours__c,Duration__c,Add_Shift__r.Duration__c,Log_In_Date_Time__c,Log_Out_Date_Time__c,Approval_Status__c,Actual_Duration_In_Hours_and_Mins__c,
                                          (SELECT Id,Client__c,Client__r.First_Name__c,Client__r.Last_Name__c,Client__r.Picture__c FROM Services_and_Support_Plans__r ORDER BY CreatedDate ASC LIMIT 1)
                                          from ShiftwithStaff__c where Add_Shift__r.Start_Date__c >=:sDate AND Add_Shift__r.Start_Date__c <=:eDate And  Staff__c =: staffId];
        return shifts;
    }
    
    @AuraEnabled
    public static void updateShiftDetails(Boolean enableGeolocation, Boolean enableSignin, String selectedComments, String staffId, String shiftwithstaffId) {
        try {
            
            Staff__c staff = [SELECT Id, Enable_Geolocation__c FROM Staff__c WHERE Id = :staffId LIMIT 1];
            staff.Enable_Geolocation__c = enableGeolocation;
            
            ShiftwithStaff__c ShiftwithStaff = [SELECT Id, Enable_Sign_In__c,Enable_Sign_In_Comments__c  FROM ShiftwithStaff__c WHERE Id = :shiftwithstaffId LIMIT 1];
            ShiftwithStaff.Enable_Sign_In__c = enableSignin;
            ShiftwithStaff.Enable_Sign_In_Comments__c = selectedComments;
            
            Update staff;
            Update ShiftwithStaff;
            List<Task> existingTasks = [SELECT Id,Status FROM Task WHERE WhatId = :shiftwithstaffId AND Subject = 'Enable Sign in for Shift' AND Status = 'New' LIMIT 1];
            if (!existingTasks.isEmpty()){
                existingTasks[0].Status='Completed';
            }
            update existingTasks;
        } catch (Exception e) {
            System.debug('❌ Error: ' + e.getMessage());
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    Public static void updatestaffName(List<ShiftwithStaff__c> updatedShiftwithStaffList){
        set<Id> shiftwithstaffId = new set<Id>();
        for(ShiftwithStaff__c shiftwithstaff : updatedShiftwithStaffList){
            shiftwithstaffId.add(shiftwithstaff.Id);
        }
        
        list<Services_and_Support_Plan__c> serviceList=[ SELECT Id,Services__c,State__c, Service_Users__c,Service_Users__r.picture__c,
                                                        Service_Users__r.Name, Resource_Name__c, Service_Type_Name__c, Lineitem__c,
                                                        Support_Item_Name__c, Date_of_Service__c,Qty__c,Unit_Price__c,GST__c,Amount__c,
                                                        Status__c,Available_Funds__c,Available_Fund__c,ShiftwithStaff__c,Participant_Name__c,
                                                        Client__c,Service_Type__c,Funds_Tracker__c,Start_Time_24_Format__c,
                                                        End_Time_24_Format__c,Start_Time_Formula__c,End_Time_Formula__c,ShiftwithStaff__r.Staff__c 
                                                        FROM Services_and_Support_Plan__c 
                                                        where ShiftwithStaff__c=:shiftwithstaffId];
        
        List<Services_and_Support_Plan__c> plansToUpdate = new List<Services_and_Support_Plan__c>();
        if(!serviceList.isEmpty()){
            for (Services_and_Support_Plan__c service : serviceList) { 
                if(service.Service_Users__c != null){
                    service.Service_Users__c = service.ShiftwithStaff__r.Staff__c;
                    plansToUpdate.add(service);
                } 
            }
        }
        
        if(!plansToUpdate.isEmpty()) {
            try {
                update plansToUpdate;
            } catch (DmlException e) {
                System.debug('Error during update: ' + e.getMessage());
            }    
        }        
    }
    
    @AuraEnabled
    public static string  deleteCheckList(list<string> checkListId){
        if(checkListId.size()>0){
            list<Add_Shift_Checklist__c> AddCheckList=[select id from Add_Shift_Checklist__c where id in:checkListId ];
            delete AddCheckList;
            
        }
        return 'checklist deleted';
        
    }
    
    @AuraEnabled(cacheable=true)
    public static Map<String, Integer> getShiftStatusSummary(
        DateTime startDateTime,
        DateTime endDateTime,
        String toggleLabel,
        List<String> facilitySearch,
        String facilityName,
        List<String> rolefilter,
        String roleName
    ) {
        System.debug('startDateTime >> ' + startDateTime);
        System.debug('endDateTime >> ' + endDateTime);
        System.debug('toggleLabel >> ' + toggleLabel);
        System.debug('facilitySearch >> ' + facilitySearch);
        System.debug('facilityName >> ' + facilityName);
        System.debug('roleName >> ' + roleName);
        
        Map<String, Integer> result = new Map<String, Integer>();
        
        if (toggleLabel != null && toggleLabel.toLowerCase() == 'false') {
            Date startDate = startDateTime.date();
            Date endDate = endDateTime.date();
            
            String baseCondition = 'Date__c >= :startDate AND Date__c <= :endDate';
            
            if (facilitySearch != null && !facilitySearch.isEmpty()) {
                baseCondition += ' AND Add_Shift__r.Facility__c IN :facilitySearch';
            } else if (String.isNotBlank(facilityName)) {
                baseCondition += ' AND Add_Shift__r.Facility__c = :facilityName';
            }
            
            if (rolefilter != null && !rolefilter.isEmpty()) {
                baseCondition += ' AND Role_formula__c IN :rolefilter';
            } else if (String.isNotBlank(roleName)) {
                baseCondition += ' AND Role_formula__c = :roleName';
            }
            
            // Count by Status__c
            String statusQuery = 'SELECT Status__c, COUNT(Id) recordCount FROM ShiftwithStaff__c WHERE ' + baseCondition + ' GROUP BY Status__c';
            List<AggregateResult> groupedResults = Database.query(statusQuery);
            
            for (AggregateResult ar : groupedResults) {
                String status = (String)ar.get('Status__c');
                Integer count = (Integer)ar.get('recordCount');
                if (status == 'null') {
                    status = 'InProgress';
                }
                system.debug('status >>'+ status);
                system.debug('count >>'+ count);
                result.put(status, count);
                system.debug('result >>'+ result);
            }
            
            // Count Un_Assigned_Shift__c = true
            String unassignedQuery = 'SELECT COUNT(Id) FROM ShiftwithStaff__c WHERE Un_Assigned_Shift__c = true AND ' + baseCondition;
            List<AggregateResult> unassignedResult = Database.query(unassignedQuery);
            Integer unassignedCount = (Integer)unassignedResult[0].get('expr0');
            result.put('Un_Assigned', unassignedCount);
            
            // Count Shift_Rejected__c = true
            String rejectedQuery = 'SELECT COUNT(Id) FROM ShiftwithStaff__c WHERE Shift_Rejected__c = true AND ' + baseCondition;
            List<AggregateResult> rejectedResult = Database.query(rejectedQuery);
            Integer rejectedCount = (Integer)rejectedResult[0].get('expr0');
            result.put('Rejected', rejectedCount);
        }
        
        System.debug('result >> ' + result);
        return result;
    }
    
    
    Public static void updateMyavailability(List<ShiftwithStaff__c> ShiftwithStaffList){
        Set<Id> staffIdSet = new Set<Id>();
        Set<Date> startDateSet = new Set<Date>();
        Set<Time> startTimeSet = new Set<Time>();
        Set<String> compositeKeySet = new Set<String>();
        
        for (ShiftwithStaff__c shift : ShiftwithStaffList) {
            if (shift.Staff__c != null && shift.Date__c != null && shift.Start_Time__c != null) {
                staffIdSet.add(shift.Staff__c);
                startDateSet.add(shift.Date__c);
                startTimeSet.add(shift.Start_Time__c);
                
                String key = shift.Staff__c + '-' + String.valueOf(shift.Date__c) + '-' + String.valueOf(shift.Start_Time__c);
                compositeKeySet.add(key);
            }
        }
        
        // Step 2: Query matching Availability__c records
        List<Availability__c> availabilityList = [
            SELECT Id, Staff__c, Start_Date__c, Start_Time__c, Assigned_Service_OR_Shift__c
            FROM Availability__c
            WHERE Staff__c IN :staffIdSet
            AND Start_Date__c IN :startDateSet
            AND Start_Time__c IN :startTimeSet
        ];
        
        // Step 3: Filter and update matching records
        List<Availability__c> recordsToUpdate = new List<Availability__c>();
        
        for (Availability__c avail : availabilityList) {
            String key = avail.Staff__c + '-' + String.valueOf(avail.Start_Date__c) + '-' + String.valueOf(avail.Start_Time__c);
            if (compositeKeySet.contains(key)) {
                avail.Assigned_Service_OR_Shift__c = true;
                recordsToUpdate.add(avail);
            }
        }
        
        // Step 4: Update in database
        if (!recordsToUpdate.isEmpty()) {
            update recordsToUpdate;
            System.debug('Updated Availability records: ' + recordsToUpdate.size());
        } else {
            System.debug('No Availability records matched.');
        }
    }
}