public with sharing class AwardController {
    @AuraEnabled(cacheable=true)
    public static List<Award__c> getAwards(Id recordId, string orgId) {
        System.debug('recordid' +recordId);
        return [SELECT Id,Awards__c,Facility__r.Name,Staff__r.Name,Staff__r.Last_Name__c,Staff__r.Display_Nickname__c,Date__c,Issued_by__c,Certificate__c from Award__c where Staff__c  =: recordId AND Staff__r.Facility__r.Organisation__c  =: orgId ORDER BY CreatedDate DESC];
    }
    @AuraEnabled(cacheable=true)
    public static List<Award__c> getAwardsByOrg(string orgId) {
        System.debug('orgid' +orgId);
        return [SELECT Id,Awards__c,Facility__r.Name,Staff__r.Name,Staff__r.Last_Name__c,Staff__r.Display_Nickname__c,Date__c,Issued_by__c,Certificate__c from Award__c where 	Staff__r.Facility__r.Organisation__c  =: orgId ORDER BY CreatedDate DESC];
    }
    @AuraEnabled
    public static List<Staff__c> getStaffList(String orgId , String facilityId ) {
        //String currentUserEmail = UserInfo.getUserEmail();
        System.debug('orgid' +orgId);
        System.debug('facilityId' +facilityId);
        return [SELECT Id, Name,Last_Name__c,Facility__c, Facility_Name__c, Display_Nickname__c,Role__c, Email_Address__c,Class_and_Paypont__c FROM Staff__c WHERE Facility__r.Organisation__c = :orgid AND Facility__c =:facilityId];
        
    }
    
    @AuraEnabled
    public static List<Staff__c> getStaffListforRosterManager(
        String orgId, 
        String facilityId, 
        String shiftDate, 
        String startTime, 
        String endTime
    ) {
        System.debug('orgid => ' + orgId);
        System.debug('facilityId => ' + facilityId);
        System.debug('shiftDate => ' + shiftDate);
        System.debug('startTime => ' + startTime);
        System.debug('endTime => ' + endTime);
        
        // Parse date and find day of week
        Date parsedDate = parseDateDMY(shiftDate);
        Integer dayOfWeek = Integer.valueOf(
            DateTime.newInstance(parsedDate, Time.newInstance(0, 0, 0, 0)).format('u')
        ); 
        System.debug('📅 Day of Week: ' + dayOfWeek);
        
        List<Staff__c> staffList = new List<Staff__c>();
        
        if (dayOfWeek == 6 || dayOfWeek == 7) {
            // 📢 Weekend → Return all staff in organisation
            staffList = [
                SELECT Id, Name, Last_Name__c, Facility__c, Facility_Name__c, 
                Restrict_Set_Hours__c, Set_Hours__c, Display_Nickname__c, 
                Role__c, Email_Address__c, Class_and_Paypont__c
                FROM Staff__c
                WHERE Facility__r.Organisation__c = :orgId
            ];
            return staffList;
        } 
        else {
            // 📢 Weekday → filter staff by facility
            List<Staff__c> facilityStaff = [
                SELECT Id, Name, Last_Name__c, Facility__c, Facility_Name__c, 
                Restrict_Set_Hours__c, Set_Hours__c, Display_Nickname__c, 
                Role__c, Email_Address__c, Class_and_Paypont__c
                FROM Staff__c
                WHERE Facility__r.Organisation__c = :orgId
                AND Facility__c = :facilityId
            ];
            
            Time inputStartTime = AddShiftHandler.getTimeIn24HrFormat(startTime.toLowerCase());
            Time inputEndTime = AddShiftHandler.getTimeIn24HrFormat(endTime.toLowerCase());
            
            // Calculate week start/end dates
            Date weekStart = parsedDate.toStartOfWeek();
            Date weekEnd = weekStart.addDays(6);
            
            // Query availability for all staff in one go
            Map<Id, List<Availability__c>> staffAvailabilityMap = new Map<Id, List<Availability__c>>();
            for (Availability__c av : [
                SELECT Id, Staff__c, Start_Time__c, End_Time__c, Start_Date__c, Shift_Type__c 
                FROM Availability__c 
                WHERE Staff__c IN :facilityStaff
                AND Start_Date__c >= :weekStart
                AND Start_Date__c <= :weekEnd
                AND Shift_Type__c != 'Sleepover Shift'
            ]) {
                if (!staffAvailabilityMap.containsKey(av.Staff__c)) {
                    staffAvailabilityMap.put(av.Staff__c, new List<Availability__c>());
                }
                staffAvailabilityMap.get(av.Staff__c).add(av);
            }
            
            // Query shifts for all staff in one go
            Map<Id, List<ShiftwithStaff__c>> staffShiftMap = new Map<Id, List<ShiftwithStaff__c>>();
            for (ShiftwithStaff__c sws : [
                SELECT Id, Staff__c, Duration__c, Date__c, Start_Time__c, End_Time__c, 
                Type_of_Shift__c, Attendence__c, Status__c
                FROM ShiftwithStaff__c
                WHERE Staff__c IN :facilityStaff
                AND Date__c >= :weekStart
                AND Date__c <= :weekEnd
                AND Type_of_Shift__c != 'Sleepover Shift'
                AND Status__c != 'Unassigned'
                AND Attendence__c = true
            ]) {
                if (!staffShiftMap.containsKey(sws.Staff__c)) {
                    staffShiftMap.put(sws.Staff__c, new List<ShiftwithStaff__c>());
                }
                staffShiftMap.get(sws.Staff__c).add(sws);
            }
            
            // Final filtering logic
            for (Staff__c staff : facilityStaff) {
                List<Availability__c> availabilityList = staffAvailabilityMap.get(staff.Id);
                List<ShiftwithStaff__c> weekShifts = staffShiftMap.get(staff.Id);
                
                Boolean isAvailable = checkAvailability(availabilityList, inputStartTime, inputEndTime);
                Boolean hasNoConflicts = checkShiftConflicts(weekShifts, inputStartTime, inputEndTime);
                
                if (!isAvailable || !hasNoConflicts) {
                    staffList.add(staff);
                }
            }
        }
        
        return staffList;
    }
    
    public static Boolean checkAvailability(List<Availability__c> availabilityList, Time startTime, Time endTime) {
        if (availabilityList == null || availabilityList.isEmpty()) {
            return false;
        }
        for (Availability__c av : availabilityList) {
            if (av.Start_Time__c <= startTime && av.End_Time__c >= endTime) {
                return true;
            }
        }
        return false;
    }
    
    public static Boolean checkShiftConflicts(List<ShiftwithStaff__c> weekShifts, Time startTime, Time endTime) {
        if (weekShifts == null || weekShifts.isEmpty()) {
            return true;
        }
        for (ShiftwithStaff__c sws : weekShifts) {
            if (!(endTime <= sws.Start_Time__c || startTime >= sws.End_Time__c)) {
                return false; // Overlap
            }
        }
        return true;
    }
    
    public static Date parseDateDMY(String dateStr) {
        if (String.isBlank(dateStr)) {           throw new AuraHandledException('Date string is blank');
        }
        
        // Detect format by separator
        if (dateStr.contains('-')) { 
            // yyyy-MM-dd
            List<String> parts = dateStr.split('-');
            if (parts.size() == 3) {
                Integer year = Integer.valueOf(parts[0]);
                Integer month = Integer.valueOf(parts[1]);
                Integer day = Integer.valueOf(parts[2]);
                return Date.newInstance(year, month, day);
            }
        } else if (dateStr.contains('/')) { 
            // dd/MM/yyyy
            List<String> parts = dateStr.split('/');
            if (parts.size() == 3) {
                Integer day = Integer.valueOf(parts[0]);
                Integer month = Integer.valueOf(parts[1]);
                Integer year = Integer.valueOf(parts[2]);
                return Date.newInstance(year, month, day);
            }
        }
        
        throw new AuraHandledException('Invalid date format: ' + dateStr);
    }
    
    
}