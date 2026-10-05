public with sharing class DashboardBuilderController {

    public class NormalizedDataset {
        @AuraEnabled public List<String> labels { get; set; }
        @AuraEnabled public List<Decimal> values { get; set; }
        @AuraEnabled public List<SeriesData> series { get; set; }
        @AuraEnabled public Map<String, Object> metadata { get; set; }

        public NormalizedDataset() {
            this.labels = new List<String>();
            this.values = new List<Decimal>();
            this.series = new List<SeriesData>();
            this.metadata = new Map<String, Object>();
        }
    }

    public class SeriesData {
        @AuraEnabled public String name { get; set; }
        @AuraEnabled public List<Decimal> data { get; set; }

        public SeriesData(String name, List<Decimal> data) {
            this.name = name;
            this.data = data;
        }
    }

    @AuraEnabled
    public static String getLayout(Id staffId) {
        try {
            if (staffId == null) {
                return null;
            }
            Staff__c staff = [
                SELECT Id, Dashboard_Layout__c 
                FROM Staff__c 
                WHERE Id = :staffId 
                WITH SECURITY_ENFORCED
                LIMIT 1
            ];
            return staff.Dashboard_Layout__c;
        } catch (Exception e) {
            System.debug('Error in getLayout: ' + e.getMessage());
            return null;
        }
    }

    @AuraEnabled
    public static void saveLayout(Id staffId, String layoutJson) {
        if (staffId == null) {
            throw new AuraHandledException('Staff ID cannot be null');
        }
        try {
            Staff__c staff = [
                SELECT Id, Dashboard_Layout__c
                FROM Staff__c 
                WHERE Id = :staffId 
                WITH SECURITY_ENFORCED
                LIMIT 1
            ];
            staff.Dashboard_Layout__c = layoutJson;
            
            if (Schema.sObjectType.Staff__c.fields.Dashboard_Layout__c.isUpdateable()) {
                update staff;
            } else {
                throw new AuraHandledException('FLS validation failed: Dashboard_Layout__c is not updateable');
            }
        } catch (Exception e) {
            throw new AuraHandledException('Error saving layout: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static NormalizedDataset getNormalizedData(String widgetType, Id facilityId) {
        try {
            NormalizedDataset dataset = new NormalizedDataset();
            Id currentUserId = UserInfo.getUserId();
            User userRecord = [
                SELECT Id, Name, Email, Organization_Name__c, User_Type__c 
                FROM User 
                WHERE Id = :currentUserId 
                LIMIT 1
            ];
            String orgName = userRecord.Organization_Name__c;

            if (widgetType == 'signin') {
                Integer completedCount = 0;
                Integer inProgressCount = 0;
                Integer acceptedCount = 0;

                if (userRecord.User_Type__c == 'NDIS Staff') {
                    List<Staff__c> staffs = [SELECT Id FROM Staff__c WHERE Email_Address__c = :userRecord.Email LIMIT 1];
                    if (!staffs.isEmpty()) {
                        Id staffRecId = staffs[0].Id;
                        completedCount = [SELECT COUNT() FROM ShiftwithStaff__c WHERE ((Shift_Facility__c != NULL AND Shift_Facility__c = :facilityId) OR (Shift_Facility__c = NULL AND Add_Shift__r.Facility__c = :facilityId)) AND Status__c = 'Completed' AND Add_Shift__r.Facility__r.Organisation__r.Name = :orgName AND Date__c = TODAY AND Staff__c = :staffRecId];
                        inProgressCount = [SELECT COUNT() FROM ShiftwithStaff__c WHERE ((Shift_Facility__c != NULL AND Shift_Facility__c = :facilityId) OR (Shift_Facility__c = NULL AND Add_Shift__r.Facility__c = :facilityId)) AND Status__c = 'InProgress' AND Add_Shift__r.Facility__r.Organisation__r.Name = :orgName AND Date__c = TODAY AND Staff__c = :staffRecId];
                        acceptedCount = [SELECT COUNT() FROM ShiftwithStaff__c WHERE ((Shift_Facility__c != NULL AND Shift_Facility__c = :facilityId) OR (Shift_Facility__c = NULL AND Add_Shift__r.Facility__c = :facilityId)) AND Status__c = 'Accepted' AND Add_Shift__r.Facility__r.Organisation__r.Name = :orgName AND Date__c = TODAY AND Staff__c = :staffRecId];
                    }
                } else {
                    completedCount = [SELECT COUNT() FROM ShiftwithStaff__c WHERE ((Shift_Facility__c != NULL AND Shift_Facility__c = :facilityId) OR (Shift_Facility__c = NULL AND Add_Shift__r.Facility__c = :facilityId)) AND Status__c = 'Completed' AND Add_Shift__r.Facility__r.Organisation__r.Name = :orgName AND Date__c = TODAY];
                    inProgressCount = [SELECT COUNT() FROM ShiftwithStaff__c WHERE ((Shift_Facility__c != NULL AND Shift_Facility__c = :facilityId) OR (Shift_Facility__c = NULL AND Add_Shift__r.Facility__c = :facilityId)) AND Status__c = 'InProgress' AND Add_Shift__r.Facility__r.Organisation__r.Name = :orgName AND Date__c = TODAY];
                    acceptedCount = [SELECT COUNT() FROM ShiftwithStaff__c WHERE ((Shift_Facility__c != NULL AND Shift_Facility__c = :facilityId) OR (Shift_Facility__c = NULL AND Add_Shift__r.Facility__c = :facilityId)) AND Status__c = 'Accepted' AND Add_Shift__r.Facility__r.Organisation__r.Name = :orgName AND Date__c = TODAY];
                }

                dataset.labels = new List<String>{ 'Completed', 'In Progress', 'Accepted' };
                dataset.values = new List<Decimal>{ completedCount, inProgressCount, acceptedCount };
                dataset.series.add(new SeriesData('Sign In Status', dataset.values));
                dataset.metadata.put('totalCount', completedCount + inProgressCount + acceptedCount);

            } else if (widgetType == 'staff-status') {
                Integer activeCount = [
                    SELECT COUNT()
                    FROM Staff__c
                    WHERE Status__c = true
                    AND Organization_Full_Name__c = :orgName
                    AND Id IN (
                        SELECT Staff__c
                        FROM Staff_Facility__c
                        WHERE Facility__c = :facilityId
                          AND Active__c = true
                    )
                ];

                Integer inactiveCount = [
                    SELECT COUNT()
                    FROM Staff__c
                    WHERE Status__c = false
                    AND Organization_Full_Name__c = :orgName
                    AND Id IN (
                        SELECT Staff__c
                        FROM Staff_Facility__c
                        WHERE Facility__c = :facilityId
                    )
                ];

                Integer visaExpiryCount = [
                    SELECT COUNT()
                    FROM Staff__c
                    WHERE Status__c = true
                    AND Organization_Full_Name__c = :orgName
                    AND Id IN (
                        SELECT Staff__c
                        FROM Staff_Facility__c
                        WHERE Facility__c = :facilityId
                    )
                    AND Id IN (
                        SELECT Staff__c
                        FROM Child_Staff__c
                        WHERE Expiry_Date__c < TODAY
                    )
                ];

                Integer vacationCount = [
                    SELECT COUNT()
                    FROM Staff__c
                    WHERE Organization_Full_Name__c = :orgName
                    AND Id IN (
                        SELECT Staff__c
                        FROM Staff_Facility__c
                        WHERE Facility__c = :facilityId
                    )
                    AND Id IN (
                        SELECT Staff__c
                        FROM Leave__c
                        WHERE Status__c = 'Approved'
                        AND From__c <= TODAY
                        AND To__c >= TODAY
                    )
                ];

                dataset.labels = new List<String>{ 'Active', 'On Leave', 'Inactive', 'Docs Expiry' };
                dataset.values = new List<Decimal>{ activeCount, vacationCount, inactiveCount, visaExpiryCount };
                dataset.series.add(new SeriesData('Staff Count', dataset.values));
                dataset.metadata.put('totalCount', activeCount + vacationCount + inactiveCount);

            } else if (widgetType == 'participant') {
                List<Organisation__c> orgs = [SELECT Id FROM Organisation__c WHERE Name = :orgName LIMIT 1];
                if (!orgs.isEmpty()) {
                    String truncatedOrgId = String.valueOf(orgs[0].Id).substring(0, 15);
                    Integer activeCount = [
                        SELECT COUNT() 
                        FROM Client__c 
                        WHERE Status__c = true
                        AND Organization_Name__c = :truncatedOrgId
                        AND Id IN (
                            SELECT Participant__c
                            FROM Participant_Facility__c
                            WHERE Facility__c = :facilityId
                            AND Active__c = true
                        )
                    ];
                    Integer inactiveCount = [
                        SELECT COUNT() 
                        FROM Client__c 
                        WHERE Status__c = false
                        AND Organization_Name__c = :truncatedOrgId
                        AND Id IN (
                            SELECT Participant__c
                            FROM Participant_Facility__c
                            WHERE Facility__c = :facilityId
                            AND Active__c = true
                        )
                    ];

                    dataset.labels = new List<String>{ 'Active', 'Inactive' };
                    dataset.values = new List<Decimal>{ activeCount, inactiveCount };
                    dataset.series.add(new SeriesData('Participant Count', dataset.values));
                    dataset.metadata.put('totalCount', activeCount + inactiveCount);
                }

            } else if (widgetType == 'incident') {
                Integer openCount = 0;
                Integer inProgressCount = 0;
                Integer resolvedCount = 0;

                if (userRecord.User_Type__c == 'NDIS Staff' || userRecord.User_Type__c == 'ICT Staff' || userRecord.User_Type__c == 'Roster Admin' || userRecord.User_Type__c == 'HR Admin') {
                    openCount = [SELECT COUNT() FROM Incident_Register_Response__c WHERE Status__c = 'Open' AND Facility__c = :facilityId AND Facility__r.Organisation__r.Name = :orgName AND CreatedById = :userRecord.Id];
                    inProgressCount = [SELECT COUNT() FROM Incident_Register_Response__c WHERE Status__c = 'In-Progress' AND Facility__c = :facilityId AND Facility__r.Organisation__r.Name = :orgName AND CreatedById = :userRecord.Id];
                    resolvedCount = [SELECT COUNT() FROM Incident_Register_Response__c WHERE Status__c = 'Resolved' AND Facility__c = :facilityId AND Facility__r.Organisation__r.Name = :orgName AND CreatedById = :userRecord.Id];
                } else {
                    openCount = [SELECT COUNT() FROM Incident_Register_Response__c WHERE Status__c = 'Open' AND Facility__c = :facilityId AND Facility__r.Organisation__r.Name = :orgName];
                    inProgressCount = [SELECT COUNT() FROM Incident_Register_Response__c WHERE Status__c = 'In-Progress' AND Facility__c = :facilityId AND Facility__r.Organisation__r.Name = :orgName];
                    resolvedCount = [SELECT COUNT() FROM Incident_Register_Response__c WHERE Status__c = 'Resolved' AND Facility__c = :facilityId AND Facility__r.Organisation__r.Name = :orgName];
                }

                dataset.labels = new List<String>{ 'Open', 'In Progress', 'Resolved' };
                dataset.values = new List<Decimal>{ openCount, inProgressCount, resolvedCount };
                dataset.series.add(new SeriesData('Incidents Count', dataset.values));
                dataset.metadata.put('totalCount', openCount + inProgressCount + resolvedCount);

            } else if (widgetType == 'leave') {
                Integer requestedCount = 0;
                Integer approvedCount = 0;
                Integer rejectedCount = 0;

                Date firstDayOfMonth = Date.today().toStartOfMonth();
                Date lastDayOfMonth = Date.today().toStartOfMonth().addMonths(1).addDays(-1);

                List<Staff__c> staffList = [SELECT Id FROM Staff__c WHERE Organization_Full_Name__c = :orgName];
                AggregateResult[] results;

                if (userRecord.User_Type__c == 'HR Admin' || userRecord.User_Type__c == 'NDIS Org Admin' || userRecord.User_Type__c == 'ICT Admin' || userRecord.User_Type__c == 'Roster Manager' || userRecord.User_Type__c == 'Roster Coordinator') {
                    results = [SELECT Status__c, COUNT(Id) total FROM Leave__c WHERE Staff__r.Facility__c = :facilityId AND Staff__c IN :staffList AND Status__c IN ('Requested', 'Approved', 'Rejected') AND (leave_applied_date__c >= :firstDayOfMonth AND leave_applied_date__c <= :lastDayOfMonth) GROUP BY Status__c];
                } else {
                    List<Staff__c> currentStaffList = [SELECT Id FROM Staff__c WHERE Email_Address__c = :userRecord.Email LIMIT 1];
                    if (!currentStaffList.isEmpty()) {
                        Id currentStaffId = currentStaffList[0].Id;
                        results = [SELECT Status__c, COUNT(Id) total FROM Leave__c WHERE Staff__r.Facility__c = :facilityId AND Staff__c = :currentStaffId AND Status__c IN ('Requested', 'Approved', 'Rejected') AND (leave_applied_date__c >= :firstDayOfMonth AND leave_applied_date__c <= :lastDayOfMonth) GROUP BY Status__c];
                    }
                }

                if (results != null) {
                    for (AggregateResult ar : results) {
                        String status = (String) ar.get('Status__c');
                        Integer count = (Integer) ar.get('total');
                        if (status == 'Requested') requestedCount = count;
                        else if (status == 'Approved') approvedCount = count;
                        else if (status == 'Rejected') rejectedCount = count;
                    }
                }

                dataset.labels = new List<String>{ 'Requested', 'Approved', 'Rejected' };
                dataset.values = new List<Decimal>{ requestedCount, approvedCount, rejectedCount };
                dataset.series.add(new SeriesData('Leave Status', dataset.values));
                dataset.metadata.put('totalCount', requestedCount + approvedCount + rejectedCount);

            } else if (widgetType == 'performance') {
                Integer needReviewerCount = 0;
                Integer completedCount = 0;

                List<Staff__c> staffList = [SELECT Id FROM Staff__c WHERE Organization_Full_Name__c = :orgName AND Facility__c = :facilityId];

                if (userRecord.User_Type__c == 'NDIS Staff' || userRecord.User_Type__c == 'Roster Admin') {
                    List<Staff__c> staffList1 = [SELECT Id FROM Staff__c WHERE Organization_Full_Name__c = :orgName AND Email_Address__c = :userRecord.Email AND Facility__c = :facilityId LIMIT 1];
                    if (!staffList1.isEmpty()) {
                        needReviewerCount = [SELECT COUNT() FROM Performance__c WHERE Status__c = 'Need Reviewer Acceptance' AND Staff__c IN :staffList1];
                        completedCount = [SELECT COUNT() FROM Performance__c WHERE Status__c = 'Completed' AND Staff__c IN :staffList1];
                    }
                } else {
                    needReviewerCount = [SELECT COUNT() FROM Performance__c WHERE Status__c = 'Need Reviewer Acceptance' AND Staff__c IN :staffList];
                    completedCount = [SELECT COUNT() FROM Performance__c WHERE Status__c = 'Completed' AND Staff__c IN :staffList];
                }

                dataset.labels = new List<String>{ 'Reviewer Approval', 'Completed' };
                dataset.values = new List<Decimal>{ needReviewerCount, completedCount };
                dataset.series.add(new SeriesData('Performance Reviews', dataset.values));
                dataset.metadata.put('totalCount', needReviewerCount + completedCount);

            } else if (widgetType == 'rejectedshifts' || widgetType == 'rejectedShifts') {
                Integer totalCount = 0;
                Integer rejectedCount = 0;

                Date startDate = Date.today().toStartOfWeek();
                Date endDate = startDate.addDays(6);

                List<Staff__c> staffRecords = [SELECT Id FROM Staff__c WHERE Organization_Full_Name__c = :orgName];
                if (!staffRecords.isEmpty()) {
                   List<ShiftwithStaff__c> shiftRecords = [
                        SELECT Id, Attendence__c, Shift_Rejected__c
                        FROM ShiftwithStaff__c
                        WHERE Date__c >= :startDate
                        AND Date__c <= :endDate
                        AND Staff__c IN :staffRecords
                        AND (
                            (Shift_Facility__c != NULL AND Shift_Facility__c = :facilityId)
                            OR
                            (Shift_Facility__c = NULL AND Add_Shift__r.Facility__c = :facilityId)
                        )
                    ];
                    for (ShiftwithStaff__c record : shiftRecords) {
                        if (record.Attendence__c == true) {
                            totalCount++;
                        } else if (record.Attendence__c == false && record.Shift_Rejected__c == true) {
                            rejectedCount++;
                        }
                    }
                }

                dataset.labels = new List<String>{ 'Total Shifts', 'Rejected Shifts' };
                dataset.values = new List<Decimal>{ totalCount, rejectedCount };
                dataset.series.add(new SeriesData('Rejected Shifts', dataset.values));
                dataset.metadata.put('totalCount', totalCount);

            } else if (widgetType == 'shift') {
                Date startDate = Date.today().toStartOfWeek();
                Date endDate = startDate.addDays(6);

                List<Staff__c> staffRecords = [SELECT Id FROM Staff__c WHERE Organization_Full_Name__c = :orgName];
                
                dataset.labels = new List<String>();
                for (Integer i = 0; i < 7; i++) {
                    Date day = startDate.addDays(i);
                    String monthLabel = DateTime.newInstance(day.year(), day.month(), day.day()).format('MMM d');
                    dataset.labels.add(monthLabel);
                }

                List<Decimal> acceptedData = new List<Decimal>{0,0,0,0,0,0,0};
                List<Decimal> completedData = new List<Decimal>{0,0,0,0,0,0,0};
                List<Decimal> inProgressData = new List<Decimal>{0,0,0,0,0,0,0};
                List<Decimal> unassignedData = new List<Decimal>{0,0,0,0,0,0,0};

                if (!staffRecords.isEmpty()) {
                   List<AggregateResult> results = [
                       SELECT Date__c day, COUNT(Id) recordCount, Status__c status
                       FROM ShiftwithStaff__c
                       WHERE Date__c >= :startDate
                       AND Date__c <= :endDate
                       AND Staff__c IN :staffRecords
                       AND ((Shift_Facility__c != NULL AND Shift_Facility__c = :facilityId) OR (Shift_Facility__c = NULL AND Add_Shift__r.Facility__c = :facilityId))
                       AND Shift_Rejected__c = false
                       GROUP BY Date__c, Status__c
                   ];
                    for (AggregateResult ar : results) {
                        Date day = (Date) ar.get('day');
                        String status = (String) ar.get('status');
                        Integer count = ((Long) ar.get('recordCount')).intValue();
                        
                        Integer index = startDate.daysBetween(day);
                        if (index >= 0 && index < 7) {
                            if (status == 'Accepted') acceptedData[index] = count;
                            else if (status == 'Completed') completedData[index] = count;
                            else if (status == 'InProgress' || status == 'null' || status == null) inProgressData[index] = count;
                            else if (status == 'Unassigned') unassignedData[index] = count;
                        }
                    }
                }

                dataset.series.add(new SeriesData('Accepted', acceptedData));
                dataset.series.add(new SeriesData('Completed', completedData));
                dataset.series.add(new SeriesData('In Progress', inProgressData));
                dataset.series.add(new SeriesData('Unassigned', unassignedData));
                
                for (Integer i = 0; i < 7; i++) {
                    dataset.values.add(acceptedData[i] + completedData[i] + inProgressData[i] + unassignedData[i]);
                }

            } else if (widgetType == 'payroll') {
                dataset.labels = new List<String>();
                List<Decimal> finalisedData = new List<Decimal>();
                List<Decimal> submittedData = new List<Decimal>();
                List<Decimal> stpFiledData = new List<Decimal>();

                for (Integer i = 2; i >= 0; i--) {
                    Date monthDate = Date.today().addMonths(-i);
                    String monthLabel = DateTime.newInstance(monthDate.year(), monthDate.month(), 1).format('MMM yyyy');
                    dataset.labels.add(monthLabel);

                    Integer finalisedCount = [SELECT COUNT() FROM Payroll_Setting__c WHERE Status__c = 'Finalised' AND Org_Name__c = :orgName AND CALENDAR_MONTH(Next_Pay_Date__c) = :monthDate.month() AND CALENDAR_YEAR(Next_Pay_Date__c) = :monthDate.year()];
                    Integer submittedCount = [SELECT COUNT() FROM Payroll_Setting__c WHERE Status__c = 'Submitted' AND Org_Name__c = :orgName AND CALENDAR_MONTH(Next_Pay_Date__c) = :monthDate.month() AND CALENDAR_YEAR(Next_Pay_Date__c) = :monthDate.year()];
                    Integer stpFiledCount = [SELECT COUNT() FROM Payroll_Setting__c WHERE Status__c = 'STP Filed' AND Org_Name__c = :orgName AND CALENDAR_MONTH(Next_Pay_Date__c) = :monthDate.month() AND CALENDAR_YEAR(Next_Pay_Date__c) = :monthDate.year()];

                    finalisedData.add(finalisedCount);
                    submittedData.add(submittedCount);
                    stpFiledData.add(stpFiledCount);
                }

                dataset.series.add(new SeriesData('Finalised', finalisedData));
                dataset.series.add(new SeriesData('Submitted', submittedData));
                dataset.series.add(new SeriesData('STP Filed', stpFiledData));
                
                for (Integer i = 0; i < 3; i++) {
                    dataset.values.add(finalisedData[i] + submittedData[i] + stpFiledData[i]);
                }

            } else if (widgetType == 'icttimesheet') {
                Date startDate = Date.today().toStartOfWeek();
                Date endDate = startDate.addDays(6);

                List<Staff__c> staffRecords = [SELECT Id FROM Staff__c WHERE Organization_Full_Name__c = :orgName];
                
                dataset.labels = new List<String>();
                for (Integer i = 0; i < 7; i++) {
                    Date day = startDate.addDays(i);
                    String monthLabel = DateTime.newInstance(day.year(), day.month(), day.day()).format('MMM d');
                    dataset.labels.add(monthLabel);
                }

                List<Decimal> draftData = new List<Decimal>{0,0,0,0,0,0,0};
                List<Decimal> submittedData = new List<Decimal>{0,0,0,0,0,0,0};
                List<Decimal> approvedData = new List<Decimal>{0,0,0,0,0,0,0};
                List<Decimal> rejectedData = new List<Decimal>{0,0,0,0,0,0,0};

                if (!staffRecords.isEmpty()) {
                    Set<Id> staffIds = new Set<Id>();
                    for (Staff__c staff : staffRecords) {
                        staffIds.add(staff.Id);
                    }

                    List<AggregateResult> results = [
                        SELECT Start_Date__c day, COUNT(Id) recordCount, Status__c status
                        FROM Allocation__c
                        WHERE Start_Date__c >= :startDate
                        AND Start_Date__c <= :endDate
                        AND Staff__c IN :staffIds
                        GROUP BY Start_Date__c, Status__c
                    ];

                    for (AggregateResult ar : results) {
                        Date day = (Date) ar.get('day');
                        String status = (String) ar.get('status');
                        Integer count = ((Long) ar.get('recordCount')).intValue();

                        Integer index = startDate.daysBetween(day);
                        if (index >= 0 && index < 7) {
                            if (status == 'Draft') draftData[index] = count;
                            else if (status == 'Submitted') submittedData[index] = count;
                            else if (status == 'Approved') approvedData[index] = count;
                            else if (status == 'Rejected') rejectedData[index] = count;
                        }
                    }
                }

                dataset.series.add(new SeriesData('Draft', draftData));
                dataset.series.add(new SeriesData('Submitted', submittedData));
                dataset.series.add(new SeriesData('Approved', approvedData));
                dataset.series.add(new SeriesData('Rejected', rejectedData));

                for (Integer i = 0; i < 7; i++) {
                    dataset.values.add(draftData[i] + submittedData[i] + approvedData[i] + rejectedData[i]);
                }

            } else if (widgetType == 'fund') {
                Decimal spent = 0;
                Decimal remaining = 0;
                Boolean found = false;

                List<Participant_Facility__c> pfs = [
                    SELECT Participant__r.Id, Participant__r.Name__c, 
                           Participant__r.Total_Spent_Funds__c, Participant__r.Total_Available_Funds__c
                    FROM Participant_Facility__c 
                    WHERE Facility__c = :facilityId 
                    AND Active__c = true 
                    AND Participant__r.Status__c = true 
                    LIMIT 1
                ];

                if (!pfs.isEmpty()) {
                    spent = pfs[0].Participant__r.Total_Spent_Funds__c != null ? pfs[0].Participant__r.Total_Spent_Funds__c : 0;
                    remaining = pfs[0].Participant__r.Total_Available_Funds__c != null ? pfs[0].Participant__r.Total_Available_Funds__c : 0;
                    found = true;
                }

                if (!found) {
                    spent = 0;
                    remaining = 0;
                }

                dataset.labels = new List<String>{ 'Spent', 'Remaining' };
                dataset.values = new List<Decimal>{ spent, remaining };
                dataset.series.add(new SeriesData('Funding Status', dataset.values));
                dataset.metadata.put('totalCount', spent + remaining);
            } else if (widgetType == 'invoice') {
                Integer draftCount = [SELECT COUNT() FROM Invoice_Parent__c WHERE Status__c = 'Draft' AND Organization__r.Name = :orgName];
                Integer issuedCount = [SELECT COUNT() FROM Invoice_Parent__c WHERE Status__c = 'Issued' AND Organization__r.Name = :orgName];
                Integer receivedCount = [SELECT COUNT() FROM Invoice_Parent__c WHERE Status__c = 'Received' AND Organization__r.Name = :orgName];

                dataset.labels = new List<String>{ 'Draft', 'Issued', 'Received' };
                dataset.values = new List<Decimal>{ draftCount, issuedCount, receivedCount };
                dataset.series.add(new SeriesData('Invoice Status', dataset.values));
                dataset.metadata.put('totalCount', draftCount + issuedCount + receivedCount);
            } else {
                dataset.labels = new List<String>();
                dataset.values = new List<Decimal>();
                dataset.metadata.put('totalCount', 0);
            }

            return dataset;
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching normalized data: ' + e.getMessage());
        }
    }
}