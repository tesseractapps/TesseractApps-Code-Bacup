public with sharing class StaffUtilizationController {
    
    @AuraEnabled(cacheable=true)
    public static StaffUtilizationResponse getStaffUtilizationData(
        String facility, String role, String employmentType,
        Integer pageNumber, Integer pageSize,
        String startWeekDate, String endWeekDate, String statusforApex
    ) {
        try {
            Id currentUserId = UserInfo.getUserId();
            System.debug('Current User ID: ' + currentUserId);
            
            List<User> userOrgName = [
                SELECT Id, Organization_Name__c, User_Type__c, Email
                FROM User
                WHERE Id = :currentUserId
                LIMIT 1
            ];
            if (userOrgName.isEmpty()) {
                throw new AuraHandledException('User not found');
            }
            
            List<Organisation__c> organisationList = [
                SELECT Id, Name
                FROM Organisation__c
                WHERE Name = :userOrgName[0].Organization_Name__c
            ];
            system.debug('organisationList >>'+ organisationList);
            if (organisationList.isEmpty()) {
                throw new AuraHandledException('Organisation not found');
            }
            
            // Date parsing and weekday calculation
            if (!Pattern.matches('\\d{4}-\\d{2}-\\d{2}', startWeekDate) || !Pattern.matches('\\d{4}-\\d{2}-\\d{2}', endWeekDate)) {
                throw new AuraHandledException('Date format must be yyyy-MM-dd');
            }
            
            Date startDate = Date.valueOf(startWeekDate);
            system.debug('startDate >>'+ startDate);
            Date endDate = Date.valueOf(endWeekDate);
            system.debug('endDate >>'+ endDate);
            
            Integer numberOfDays = 0;
            for (Date d = startDate; d <= endDate; d = d.addDays(1)) {
                Integer dow = Integer.valueOf(DateTime.newInstance(d, Time.newInstance(0, 0, 0, 0)).format('u'));
                if (dow != 6 && dow != 7) numberOfDays++; // Exclude Saturday (6) and Sunday (7)
            }
            
            // ✅ Staff List Declaration
            List<Staff__c> staffList = new List<Staff__c>();
            
            // ✅ Conditional Query
            if (userOrgName[0].User_Type__c == 'NDIS Org Admin') {
                staffList = [
                    SELECT Id, Name, Display_Nickname__c, Set_Hours__c, Class_and_Paypont__c,
                    Facility__c, Role__c, Type_of_Job__c, Facility__r.Organisation__c,
                    (SELECT Id, Duration__c, Status__c, Start_Date__c, Day_Name__c
                     FROM ShiftwithStaffs__r
                     WHERE Date__c >= :startDate AND Date__c <= :endDate
                     AND Day_Name__c != 'Sunday' AND Day_Name__c != 'Saturday')
                    FROM Staff__c
                    WHERE Facility__r.Organisation__c = :organisationList[0].Id
                    ORDER BY Name ASC
                ];
            } 
            else {
                // Get all facility associations for the staff
                List<Facility_Association__c> facilityAssociation = [
                    SELECT Id, Staff__c, Facility__c, User__c, Active__c
                    FROM Facility_Association__c 
                    WHERE User__c = :userOrgName[0].Id
                    AND Active__c = true
                ];
                
                // Extract Facility IDs into a Set
                Set<Id> facilityIds = new Set<Id>();
                for (Facility_Association__c assoc : facilityAssociation) {
                    if (assoc.Facility__c != null) {
                        facilityIds.add(assoc.Facility__c);
                    }
                }
                
                // Only query staff for associated facilities (if any)
                if (!facilityIds.isEmpty()) {
                    staffList = [
                        SELECT Id, Name, Display_Nickname__c, Set_Hours__c, Class_and_Paypont__c,
                        Facility__c, Role__c, Type_of_Job__c, Facility__r.Organisation__c,
                        (SELECT Id, Duration__c, Status__c, Start_Date__c, Day_Name__c
                         FROM ShiftwithStaffs__r
                         WHERE Date__c >= :startDate AND Date__c <= :endDate
                         AND Day_Name__c != 'Sunday' AND Day_Name__c != 'Saturday')
                        FROM Staff__c
                        WHERE Facility__c IN :facilityIds
                        ORDER BY Name ASC
                    ];
                } else {
                    staffList = new List<Staff__c>(); // fallback if no facilities found
                }
            }
            
            // ✅ Filtering
            List<Staff__c> filteredList = new List<Staff__c>();
            for (Staff__c staff : staffList) {
                Boolean matches = true;
                
                if (String.isNotBlank(facility) && facility != 'All' && staff.Facility__c != facility) matches = false;
                if (String.isNotBlank(role) && role != 'All' &&
                    (String.isBlank(staff.Role__c) || !(';' + staff.Role__c.toLowerCase() + ';').contains(';' + role.toLowerCase() + ';'))) {
                        matches = false;
                    }
                if (String.isNotBlank(employmentType) && employmentType != 'All' && staff.Type_of_Job__c != employmentType) matches = false;
                
                if (matches) filteredList.add(staff);
            }
            
            // ✅ Transform and filter by status
            List<StaffUtilizationData> transformedData = new List<StaffUtilizationData>();
            for (Staff__c staff : filteredList) {
                StaffUtilizationData data = transformStaffRecord(staff, numberOfDays);
                Boolean include = false;
                
                if (String.isBlank(statusforApex) || statusforApex == 'All') include = true;
                else if (statusforApex == 'Under Rostered' && data.status == 'Under Rostered') include = true;
                else if (statusforApex == 'Over Rostered' && data.status == 'Over Rostered') include = true;
                else if (statusforApex == 'Total Unallocated Hrs' && data.setHours > data.rosteredHours) include = true;
                else if (statusforApex == 'Total Overtime Hrs' && data.rhVariance > 0) include = true;
                
                if (include) transformedData.add(data);
            }
            
            // ✅ Pagination
            Integer totalRecords = transformedData.size();
            Integer offset = (pageNumber - 1) * pageSize;
            Integer endIndex = Math.min(offset + pageSize, totalRecords);
            
            List<StaffUtilizationData> paginatedData = new List<StaffUtilizationData>();
            for (Integer i = offset; i < endIndex; i++) {
                paginatedData.add(transformedData[i]);
            }
            
            // ✅ Metrics and response
            StaffMetrics metrics = calculateMetrics(filteredList);
            //StaffMetrics metrics = calculateMetricsFromTransformed(transformedData);
            Integer totalPages = (Integer)Math.ceil((Decimal)totalRecords / pageSize);
            
            return new StaffUtilizationResponse(paginatedData, metrics, totalRecords, totalPages, pageNumber);
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching staff data: ' + e.getMessage());
        }
    }
    
    
    @AuraEnabled
    public static String exportStaffData(String facility, String role, String employmentType, String startWeekDate, String endWeekDate, String statusforApex) {
        try {
            if (!Pattern.matches('\\d{4}-\\d{2}-\\d{2}', startWeekDate) || !Pattern.matches('\\d{4}-\\d{2}-\\d{2}', endWeekDate)) {
                throw new AuraHandledException('Date format must be yyyy-MM-dd');
            }
            
            Date startDate = Date.valueOf(startWeekDate);
            Date endDate = Date.valueOf(endWeekDate);
            
            system.debug('startDate >>'+ startDate);
            system.debug('endDate >>'+ endDate);
            
            Integer numberOfDays = 0;
            Date current = startDate;
            
            while (current <= endDate) {
                Integer dayOfWeek = Integer.valueOf(DateTime.newInstance(current, Time.newInstance(0, 0, 0, 0)).format('u'));
                if (dayOfWeek != 1 && dayOfWeek != 7) {
                    numberOfDays++;
                }
                current = current.addDays(1);
            }
            
            system.debug('numberOfDays >>'+ numberOfDays);
            
            // Get current user's org
            Id currentUserId = UserInfo.getUserId();
            List<User> userOrgName = [
                SELECT Id, Organization_Name__c, User_Type__c, Email
                FROM User
                WHERE Id = :currentUserId
                LIMIT 1
            ];
            
            if (userOrgName.isEmpty()) {
                throw new AuraHandledException('User not found.');
            }
            
            List<Organisation__c> organisationList = [
                SELECT Id, Name 
                FROM Organisation__c 
                WHERE Name = :userOrgName[0].Organization_Name__c
            ];
            
            system.debug('organisationList >>'+ organisationList);
            
            if (organisationList.isEmpty()) {
                throw new AuraHandledException('User organisation not found.');
            }
            
            // ✅ Staff List Declaration
            List<Staff__c> staffList = new List<Staff__c>();
            
            // Query staff          
            if (userOrgName[0].User_Type__c == 'NDIS Org Admin') {
                staffList = [
                    SELECT Id, Name, Display_Nickname__c, Set_Hours__c, Class_and_Paypont__c,
                    Facility__c, Role__c, Type_of_Job__c, Facility__r.Organisation__c,
                    (SELECT Id, Duration__c, Status__c, Start_Date__c, Day_Name__c
                     FROM ShiftwithStaffs__r
                     WHERE Date__c >= :startDate AND Date__c <= :endDate
                     AND Day_Name__c != 'Sunday' AND Day_Name__c != 'Saturday')
                    FROM Staff__c
                    WHERE Facility__r.Organisation__c = :organisationList[0].Id
                    ORDER BY Name ASC
                ];
            } else {
                // Get Staff record by matching email
                Staff__c staff = [SELECT Id, Email_Address__c FROM Staff__c WHERE Email_Address__c = :userOrgName[0].Email LIMIT 1];
                
                // Get all facility associations for the staff
                List<Facility_Association__c> facilityAssociation = [
                    SELECT Id, Staff__c, Facility__c, User__c, Active__c
                    FROM Facility_Association__c 
                    WHERE User__c = :userOrgName[0].Id
                    AND Active__c = true
                ];
                
                // Extract Facility IDs into a Set
                Set<Id> facilityIds = new Set<Id>();
                for (Facility_Association__c assoc : facilityAssociation) {
                    if (assoc.Facility__c != null) {
                        facilityIds.add(assoc.Facility__c);
                    }
                }
                
                // Only query staff for associated facilities (if any)
                if (!facilityIds.isEmpty()) {
                    staffList = [
                        SELECT Id, Name, Display_Nickname__c, Set_Hours__c, Class_and_Paypont__c,
                        Facility__c, Role__c, Type_of_Job__c, Facility__r.Organisation__c,
                        (SELECT Id, Duration__c, Status__c, Start_Date__c, Day_Name__c
                         FROM ShiftwithStaffs__r
                         WHERE Date__c >= :startDate AND Date__c <= :endDate
                         AND Day_Name__c != 'Sunday' AND Day_Name__c != 'Saturday')
                        FROM Staff__c
                        WHERE Facility__c IN :facilityIds
                        ORDER BY Name ASC
                    ];
                } else {
                    staffList = new List<Staff__c>(); // fallback if no facilities found
                }
            }
            
            // Filter list
            List<Staff__c> filteredList = new List<Staff__c>();
            for (Staff__c staff : staffList) {
                Boolean matches = true;
                
                if (String.isNotBlank(facility) && facility != 'All' && staff.Facility__c != facility) {
                    matches = false;
                }
                if (String.isNotBlank(role) && role != 'All') {if (String.isBlank(staff.Role__c) || !(';' + staff.Role__c.toLowerCase() + ';').contains(';' + role.toLowerCase() + ';')) {matches = false;
                        }
                }
                if (String.isNotBlank(employmentType) && employmentType != 'All' && staff.Type_of_Job__c != employmentType) {
                    matches = false;
                }
                
                if (matches) {
                    filteredList.add(staff);
                }
            }
            
            // CSV Header
            String csvContent = 'Staff Name, Set Hours, Rostered Hours, Completed Hours, RH Variance, CH Variance, Status\n';
            
            // Process and apply status filter
            for (Staff__c staff : filteredList) {
                StaffUtilizationData data = transformStaffRecord(staff, numberOfDays);
                Boolean include = false;
                system.debug('statusforApex >>'+ statusforApex);
                system.debug('data.status >>'+ data.status);
                if (String.isBlank(statusforApex) || statusforApex == 'All') {
                    include = true;
                    System.debug('✅ Included (All): ' + data.name);
                }
                else if (statusforApex == 'Under Rostered' && data.status == 'Under Rostered') {
                    include = true;
                    System.debug('✅ Included (Under Rostered): ' + data.name);
                }
                else if (statusforApex == 'Over Rostered' && data.status == 'Over Rostered') {
                    include = true;
                    System.debug('✅ Included (Over Rostered): ' + data.name);
                }
                else if (statusforApex == 'Total Unallocated Hrs' && data.setHours > data.rosteredHours) {
                    include = true;
                    System.debug('✅ Included (Total Unallocated Hrs): ' + data.name);
                }
                else if (statusforApex == 'Total Overtime Hrs' && data.rhVariance > 0) {
                    include = true;
                    System.debug('✅ Included (Total Overtime Hrs): ' + data.name);
                }
                else {
                    System.debug('⛔ Skipped: ' + data.name);
                }
                
                if (include) {
                    csvContent += '"' + data.name + '",'
                        + data.setHours + ','
                        + data.rosteredHours + ','
                        + data.completedHours + ','
                        + data.rhVariance + ','
                        + data.chVariance + ','
                        + data.status + '\n';
                }
            }
            
            return csvContent;
            
        } catch (Exception e) {
            throw new AuraHandledException('Error exporting staff data: ' + e.getMessage());
        }
    }
    
    
    private static StaffUtilizationData transformStaffRecord(Staff__c staff, Integer numberOfDays) {
        StaffUtilizationData data = new StaffUtilizationData();
        data.id = staff.Id;
        data.name = staff.Display_Nickname__c;
    
        system.debug('staff.Set_Hours__c >>' + staff.Set_Hours__c);
        
        Decimal baseSetHours = staff.Set_Hours__c != null ? staff.Set_Hours__c : 0;
        system.debug('baseSetHours >>' + baseSetHours);
        
        Decimal calculatedSetHours = (baseSetHours / 5) * numberOfDays;
        data.setHours = calculatedSetHours.setScale(2, RoundingMode.HALF_UP);
        system.debug('data.setHours >>' + data.setHours);
        
        data.staffClass = 'N/A';
        data.rosteredHours = 0;
        data.completedHours = 0;
        data.rhVariance = 0;
        data.chVariance = 0;
    
        Decimal totalRostered = 0;
        Decimal totalCompleted = 0;
    
        if (staff.ShiftwithStaffs__r != null && !staff.ShiftwithStaffs__r.isEmpty()) {for (ShiftwithStaff__c shift : staff.ShiftwithStaffs__r) {if (shift.Duration__c != null) {Decimal duration = shift.Duration__c;totalRostered += duration;
    
                    if (shift.Status__c == 'Completed') {
                        totalCompleted += duration;
                    }
                }
            }
        }
    
        data.rosteredHours = totalRostered.setScale(2, RoundingMode.HALF_UP);
        data.completedHours = totalCompleted.setScale(2, RoundingMode.HALF_UP);
        data.classNumber = staff.Class_and_Paypont__c;
    
        if (totalRostered < data.setHours) {
            data.status = 'Under Rostered';
        } else if (totalRostered > data.setHours) {
            data.status = 'Over Rostered';
        } else {
            data.status = 'Fully Rostered';
        }
    
        data.rhVariance = (totalRostered - data.setHours).setScale(2, RoundingMode.HALF_UP);
        data.chVariance = (totalCompleted - data.setHours).setScale(2, RoundingMode.HALF_UP);
    
        system.debug('data.status >> ' + data.status);
        return data;
    }
    
    private static StaffMetrics calculateMetrics(List<Staff__c> allStaff) {
        Integer overRostered = 0;
        Integer underRostered = 0;
        Integer fullyRostered = 0;
        Integer totalUnallocated = 0;
        Integer totalOvertime = 0;
        
        for (Staff__c staff : allStaff) {
            Integer setHours = staff.Set_Hours__c != null ? Integer.valueOf(staff.Set_Hours__c) : 0;
            Integer rosteredHours = 0;
            Integer completedHours = 0;
            
            if (staff.ShiftwithStaffs__r != null && !staff.ShiftwithStaffs__r.isEmpty()) {
                for (ShiftwithStaff__c shift : staff.ShiftwithStaffs__r) {
                    if (shift.Duration__c != null) {
                        Integer duration = Integer.valueOf(shift.Duration__c);
                        rosteredHours += duration;
                        
                        if (shift.Status__c != 'Completed') {
                            completedHours += duration;
                        }
                    }
                }
            }
            
            if (rosteredHours < setHours) {
                underRostered++;
                totalUnallocated += (setHours - rosteredHours);
            } else if (rosteredHours > setHours) {
                overRostered++;
            } else {
                fullyRostered++;
            }
            
            if (completedHours > setHours) {
                totalOvertime += (completedHours - setHours);
            }
        }
        
        StaffMetrics metrics = new StaffMetrics();
        metrics.underRostered = underRostered;
        metrics.overRostered = overRostered;
        metrics.fullyRostered = fullyRostered;
        metrics.totalUnallocatedHours = totalUnallocated;
        metrics.totalOvertimeHours = totalOvertime;
        
        return metrics;
    }    
    
    // Data classes
    public class StaffUtilizationResponse {
        @AuraEnabled public List<StaffUtilizationData> staffData { get; set; }
        @AuraEnabled public StaffMetrics metrics { get; set; }
        @AuraEnabled public Integer totalRecords { get; set; }
        @AuraEnabled public Integer totalPages { get; set; }
        @AuraEnabled public Integer currentPage { get; set; }
        
        public StaffUtilizationResponse(
            List<StaffUtilizationData> staffData,
            StaffMetrics metrics,
            Integer totalRecords,
            Integer totalPages,
            Integer currentPage
        ) {
            this.staffData = staffData;
            this.metrics = metrics;
            this.totalRecords = totalRecords;
            this.totalPages = totalPages;
            this.currentPage = currentPage;
        }
    }
    
    
    public class StaffUtilizationData {
        @AuraEnabled public String id { get; set; }
        @AuraEnabled public String name { get; set; }
        @AuraEnabled public String staffClass { get; set; }
        @AuraEnabled public String classNumber { get; set; }
        @AuraEnabled public Decimal setHours { get; set; }
        @AuraEnabled public Decimal rosteredHours { get; set; }
        @AuraEnabled public Decimal completedHours { get; set; }
        @AuraEnabled public Decimal rhVariance { get; set; }
        @AuraEnabled public Decimal chVariance { get; set; }
        @AuraEnabled public String status { get; set; }
    }

    
    public class StaffMetrics {
        @AuraEnabled public Integer underRostered { get; set; }
        @AuraEnabled public Integer overRostered { get; set; }
        @AuraEnabled public Integer fullyRostered { get; set; }
        @AuraEnabled public Integer totalUnallocatedHours { get; set; }
        @AuraEnabled public Integer totalOvertimeHours { get; set; }
    }
}