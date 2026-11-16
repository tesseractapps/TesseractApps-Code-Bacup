public with sharing class RosterReplicationConflictController {
   @AuraEnabled
        public static List<ShiftConflictWrapper> validateRosterTemplateReplication(
            List<Id> selectedShiftIds,
            List<Id> selectedServiceIds,
            Date sourceStartDate,
            Date sourceEndDate,
            Date destinationStartDate,
            Date destinationEndDate,
            List<String> facilityIdList
        ) {

        List<ShiftConflictWrapper> result = new List<ShiftConflictWrapper>();
         if (selectedShiftIds == null || selectedShiftIds.isEmpty()) {

                selectedShiftIds = new List<Id>();
                selectedServiceIds = new List<Id>();
                User objUser = [SELECT Id, Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];
                String orgID = [SELECT Id FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1].Id;

                List<ShiftWithStaff__c> templateShifts = [
                    SELECT Id,
                        (SELECT Id FROM Services_and_Support_Plans__r)
                    FROM ShiftWithStaff__c 
                    WHERE Date__c >= :sourceStartDate
                    AND Date__c <= :sourceEndDate
                    AND Shift_Rejected__c != true
                    AND Status__c != 'Unassigned' AND
                    Add_Shift__r.Facility__r.Organisation__c=:orgID
                ];

                Set<Id> shiftSet = new Set<Id>();
                Set<Id> serviceSet = new Set<Id>();

                for (ShiftWithStaff__c shift : templateShifts) {

                    shiftSet.add(shift.Id);

                    for (Services_and_Support_Plan__c svc :
                        shift.Services_and_Support_Plans__r) {

                        serviceSet.add(svc.Id);
                    }
                }

                selectedShiftIds.addAll(shiftSet);
                selectedServiceIds.addAll(serviceSet);
            }

            // Required validation after fallback
            if (selectedShiftIds.isEmpty() || sourceStartDate == null|| destinationStartDate == null || destinationEndDate == null) {
                return result;
            }

            Integer dateOffset = sourceStartDate.daysBetween(destinationStartDate);

            Set<Id> facilityIds = new Set<Id>();
            if (facilityIdList != null) {
                for (String facilityId : facilityIdList) {
                    if (String.isNotBlank(facilityId)) {
                        facilityIds.add((Id)facilityId);
                    }
                }
            }
        List<ShiftWithStaff__c> sourceShifts = [SELECT Id, Add_Shift__c, Staff__c, Staff__r.Display_Nickname__c, Role__c, Shift_Facility__c, Shift_Facility__r.Name, Shift_Facility__r.Organisation__c, Add_Shift__r.Facility__c, Add_Shift__r.Facility__r.Name, Add_Shift__r.Facility__r.Organisation__c, Date__c, End_Date__c, Start_Date__c, Shift_End_Date__c, Shift_Start_Time__c, Shift_End_Time__c, Add_Shift__r.Start_Time__c, Add_Shift__r.End_Time__c, Duration__c, Type_of_Shift__c, Shift_Start_End_Time__c
           ,(SELECT Id, Client__c,Participant_Name__c FROM Services_and_Support_Plans__r) FROM ShiftWithStaff__c WHERE Id IN :selectedShiftIds ORDER BY Start_Date__c ASC, Shift_Start_Time__c ASC];
        if (sourceShifts.isEmpty()) {
            return result;
        }
        Set<Id> staffIds = new Set<Id>();
        for (ShiftWithStaff__c shift : sourceShifts) {
            if (shift.Staff__c != null) {
                staffIds.add(shift.Staff__c);
            }
        }
        Map<Id, Staff__c> staffMap = new Map<Id, Staff__c>([SELECT Id, Display_Nickname__c, Set_Hours__c, Restrict_Set_Hours__c FROM Staff__c WHERE Id IN :staffIds]);
        Map<Id, ShiftConflictWrapper> wrapperByShift = new Map<Id, ShiftConflictWrapper>();
        for (ShiftWithStaff__c sourceShift : sourceShifts) {
            ShiftConflictWrapper wrapper = new ShiftConflictWrapper();
            wrapper.sourceShiftId = sourceShift.Id;
            wrapper.staffId = sourceShift.Staff__c;
            wrapper.staffName = sourceShift.Staff__r != null ? sourceShift.Staff__r.Display_Nickname__c : '';
            wrapper.roleName = sourceShift.Role__c;
            wrapper.sourceStartDate = getSourceStartDate(sourceShift);
            wrapper.sourceEndDate = getSourceEndDate(sourceShift);
            wrapper.destinationStartDate = wrapper.sourceStartDate != null ? wrapper.sourceStartDate.addDays(dateOffset) : null;
            wrapper.destinationEndDate = wrapper.sourceEndDate != null ? wrapper.sourceEndDate.addDays(dateOffset) : null;
            wrapper.sourceShiftName = sourceShift.Shift_Start_End_Time__c;
            wrapper.sourceShiftTime = sourceShift.Shift_Start_End_Time__c;
            wrapper.facilityName = sourceShift.Shift_Facility__r != null ? sourceShift.Shift_Facility__r.Name : (sourceShift.Add_Shift__r != null && sourceShift.Add_Shift__r.Facility__r != null ? sourceShift.Add_Shift__r.Facility__r.Name : '');


            // Collect participant names from child services
            Set<String> participantNames = new Set<String>();

            for (Services_and_Support_Plan__c service : sourceShift.Services_and_Support_Plans__r) {
                participantNames.add(service.Participant_Name__c);
            }

             wrapper.participantName = String.join(new List<String>(participantNames), ', ');

            wrapper.status = 'PENDING';
            wrapper.resolutionAllowed = false;
            wrapper.conflicts = new List<ConflictDetail>();
            wrapper.hasHardConflict = false;
            wrapper.destinationShifts = new List<DestinationShiftWrapper>();
            wrapperByShift.put(sourceShift.Id, wrapper);
            result.add(wrapper);
        }
        Map<Id, Id> shiftFacilityMap = new Map<Id, Id>();
        Map<Id, Id> shiftOrganisationMap = new Map<Id, Id>();
        Map<Id, String> shiftFacilityNameMap = new Map<Id, String>();
        for (ShiftWithStaff__c shift : sourceShifts) {
            Id facilityId;
            Id organisationId;
            String facilityName;
            if (shift.Shift_Facility__c != null) {
                facilityId = shift.Shift_Facility__c;
                facilityName = shift.Shift_Facility__r != null ? shift.Shift_Facility__r.Name : '';
                organisationId = shift.Shift_Facility__r != null ? shift.Shift_Facility__r.Organisation__c : null;
            } else {
                facilityId = shift.Add_Shift__r != null ? shift.Add_Shift__r.Facility__c : null;
                facilityName = shift.Add_Shift__r != null && shift.Add_Shift__r.Facility__r != null ? shift.Add_Shift__r.Facility__r.Name : '';
                organisationId = shift.Add_Shift__r != null && shift.Add_Shift__r.Facility__r != null ? shift.Add_Shift__r.Facility__r.Organisation__c : null;
            }
            shiftFacilityMap.put(shift.Id, facilityId);
            shiftOrganisationMap.put(shift.Id, organisationId);
            shiftFacilityNameMap.put(shift.Id, facilityName);
        }
        List<Child_Staff__c> staffDocuments = [SELECT Id, Staff__c, Document_Type__c, Expiry_Date__c, Status__c, Compliance__c FROM Child_Staff__c WHERE Staff__c IN :staffIds AND Is_Archived__c = false];
        Map<Id, Set<String>> submittedDocumentsByStaff = new Map<Id, Set<String>>();
        Map<Id, List<Child_Staff__c>> documentsByStaff = new Map<Id, List<Child_Staff__c>>();
        for (Child_Staff__c document : staffDocuments) {
            if (!submittedDocumentsByStaff.containsKey(document.Staff__c)) {
                submittedDocumentsByStaff.put(document.Staff__c, new Set<String>());
            }
            if (String.isNotBlank(document.Document_Type__c)) {
                submittedDocumentsByStaff.get(document.Staff__c).add(document.Document_Type__c);
            }
            if (!documentsByStaff.containsKey(document.Staff__c)) {
                documentsByStaff.put(document.Staff__c, new List<Child_Staff__c>());
            }
            documentsByStaff.get(document.Staff__c).add(document);
        }
        Set<Id> sourceFacilityIds = new Set<Id>();
        Set<Id> sourceOrganisationIds = new Set<Id>();
        sourceFacilityIds.addAll(shiftFacilityMap.values());
        sourceOrganisationIds.addAll(shiftOrganisationMap.values());
        sourceFacilityIds.remove(null);
        sourceOrganisationIds.remove(null);
        List<Facility_Compliance_Setting__c> complianceSettings = [SELECT Id, Facility__c, Facility__r.Name, Organisation__c, Roles__c, Org_Roles__c, Document_Name__c, Mandatory_Document__c, Visible_to_Staff__c, Org__c FROM Facility_Compliance_Setting__c WHERE Mandatory_Document__c = true AND Visible_to_Staff__c = true AND (Facility__c IN :sourceFacilityIds OR (Organisation__c IN :sourceOrganisationIds AND Org__c = true))];
        Map<Id, Map<String, Set<String>>> facilityMandatoryDocs = new Map<Id, Map<String, Set<String>>>();
        Map<Id, Map<String, Set<String>>> organisationMandatoryDocs = new Map<Id, Map<String, Set<String>>>();
        for (Facility_Compliance_Setting__c setting : complianceSettings) {
            if (setting.Facility__c != null && String.isNotBlank(setting.Roles__c)) {
                if (!facilityMandatoryDocs.containsKey(setting.Facility__c)) {
                    facilityMandatoryDocs.put(setting.Facility__c, new Map<String, Set<String>>());
                }
                for (String role : setting.Roles__c.split('[,;]')) {
                    role = role.trim();
                    if (String.isBlank(role)) {
                        continue;
                    }
                    String roleKey = role.toLowerCase();
                    if (!facilityMandatoryDocs.get(setting.Facility__c).containsKey(roleKey)) {
                        facilityMandatoryDocs.get(setting.Facility__c).put(roleKey, new Set<String>());
                    }
                    facilityMandatoryDocs.get(setting.Facility__c).get(roleKey).add(setting.Document_Name__c);
                }
            }
            if (setting.Organisation__c != null && String.isNotBlank(setting.Org_Roles__c)) {
                if (!organisationMandatoryDocs.containsKey(setting.Organisation__c)) {
                    organisationMandatoryDocs.put(setting.Organisation__c, new Map<String, Set<String>>());
                }
                for (String role : setting.Org_Roles__c.split('[,;]')) {
                    role = role.trim();
                    if (String.isBlank(role)) {
                        continue;
                    }
                    String roleKey = role.toLowerCase();
                    if (!organisationMandatoryDocs.get(setting.Organisation__c).containsKey(roleKey)) {
                        organisationMandatoryDocs.get(setting.Organisation__c).put(roleKey, new Set<String>());
                    }
                    organisationMandatoryDocs.get(setting.Organisation__c).get(roleKey).add(setting.Document_Name__c);
                }
            }
        }
        List<ShiftWithStaff__c> destinationShifts = [SELECT Id, Staff__c, Staff__r.Display_Nickname__c, Role__c, Shift_Facility__c, Shift_Facility__r.Name, Add_Shift__r.Facility__c, Add_Shift__r.Facility__r.Name, Start_Date__c, Shift_End_Date__c, Date__c, End_Date__c, Shift_Start_Time__c, Shift_End_Time__c, Start_Time__c, End_Time__c, Duration__c, Type_of_Shift__c, Status__c, Attendence__c, Shift_Rejected__c,Shift_Start_End_Time__c,(SELECT Id, Client__c,Participant_Name__c FROM Services_and_Support_Plans__r) FROM ShiftWithStaff__c WHERE Staff__c IN :staffIds AND Shift_Rejected__c != true AND ((Start_Date__c <= :destinationEndDate AND Shift_End_Date__c >= :destinationStartDate) OR (Date__c <= :destinationEndDate AND End_Date__c >= :destinationStartDate)) AND ((Status__c = 'Draft' AND Attendence__c = false) OR (Status__c != 'Unassigned' AND Attendence__c = true))];
        Map<Id, List<ShiftWithStaff__c>> destinationShiftsByStaff = new Map<Id, List<ShiftWithStaff__c>>();
        for (ShiftWithStaff__c destination : destinationShifts) {
            if (!destinationShiftsByStaff.containsKey(destination.Staff__c)) {
                destinationShiftsByStaff.put(destination.Staff__c, new List<ShiftWithStaff__c>());
            }
            destinationShiftsByStaff.get(destination.Staff__c).add(destination);
        }
        User currentUser = [SELECT Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
        String organisationStartDay;
        List<Organisation__c> organisations = [SELECT Id, Week_Start_Day__c FROM Organisation__c WHERE Name = :currentUser.Organization_Name__c LIMIT 1];
        if (!organisations.isEmpty()) {
            organisationStartDay = organisations[0].Week_Start_Day__c;
        }
        Date validationWeekStart;
        if (String.isNotBlank(organisationStartDay)) {
            validationWeekStart = RosterCreation.getCustomWeekStart(destinationStartDate, organisationStartDay);
        } else {
            validationWeekStart = destinationStartDate.toStartOfWeek();
        }
        Date validationWeekEnd = validationWeekStart.addDays(6);
        Map<String, Decimal> existingHoursMap = new Map<String, Decimal>();
        for (ShiftWithStaff__c destination : destinationShifts) {
            Date shiftDate = getDestinationStartDate(destination);
            if (shiftDate == null) {
                continue;
            }
            if (isWeekend(shiftDate)) {
                continue;
            }
            if (destination.Type_of_Shift__c == 'Sleepover Shift') {
                continue;
            }
            Date weekStart = String.isNotBlank(organisationStartDay) ? RosterCreation.getCustomWeekStart(shiftDate, organisationStartDay) : shiftDate.toStartOfWeek();
            String key = String.valueOf(destination.Staff__c) + '|' + String.valueOf(weekStart);
            Decimal duration = destination.Duration__c != null ? destination.Duration__c : 0;
            Decimal current = existingHoursMap.containsKey(key) ? existingHoursMap.get(key) : 0;
            existingHoursMap.put(key, current + duration);
        }
        Map<Id, Decimal> availableFundsById = new Map<Id, Decimal>();
        Set<Id> fundIds = new Set<Id>();
        if (selectedServiceIds != null && !selectedServiceIds.isEmpty()) {
            List<Services_and_Support_Plan__c> selectedServices = [SELECT Id, ShiftWithStaff__c, Funds_Tracker__c, Service_Type__c, Edited_Unit_Price__c, Qty__c FROM Services_and_Support_Plan__c WHERE Id IN :selectedServiceIds AND ShiftWithStaff__c IN :selectedShiftIds];
            for (Services_and_Support_Plan__c service : selectedServices) {
                if (service.Funds_Tracker__c != null) {
                    fundIds.add(service.Funds_Tracker__c);
                }
            }
            if (!fundIds.isEmpty()) {
                for (Funds_Tracker__c fund : [SELECT Id, Available_Funds__c FROM Funds_Tracker__c WHERE Id IN :fundIds]) {
                    availableFundsById.put(fund.Id, fund.Available_Funds__c != null ? fund.Available_Funds__c : 0);
                }
            }
            Map<Id, List<Services_and_Support_Plan__c>> servicesByShift = new Map<Id, List<Services_and_Support_Plan__c>>();
            for (Services_and_Support_Plan__c service : selectedServices) {
                if (!servicesByShift.containsKey(service.ShiftWithStaff__c)) {
                    servicesByShift.put(service.ShiftWithStaff__c, new List<Services_and_Support_Plan__c>());
                }
                servicesByShift.get(service.ShiftWithStaff__c).add(service);
            }
            Map<Id, Decimal> accumulatedFundUsage = new Map<Id, Decimal>();
            processHardConflicts(sourceShifts, wrapperByShift, staffMap, submittedDocumentsByStaff, documentsByStaff, shiftFacilityMap, shiftOrganisationMap, shiftFacilityNameMap, facilityMandatoryDocs, organisationMandatoryDocs, existingHoursMap, organisationStartDay, servicesByShift, availableFundsById, accumulatedFundUsage, dateOffset);
        } else {
            Map<Id, List<Services_and_Support_Plan__c>> emptyServicesMap = new Map<Id, List<Services_and_Support_Plan__c>>();
            Map<Id, Decimal> emptyFundMap = new Map<Id, Decimal>();
            Map<Id, Decimal> emptyUsageMap = new Map<Id, Decimal>();
            processHardConflicts(sourceShifts, wrapperByShift, staffMap, submittedDocumentsByStaff, documentsByStaff, shiftFacilityMap, shiftOrganisationMap, shiftFacilityNameMap, facilityMandatoryDocs, organisationMandatoryDocs, existingHoursMap, organisationStartDay, emptyServicesMap, emptyFundMap, emptyUsageMap, dateOffset);
        }
        for (ShiftWithStaff__c sourceShift : sourceShifts) {
            ShiftConflictWrapper wrapper = wrapperByShift.get(sourceShift.Id);
            if (wrapper == null) {
                continue;
            }
            if (wrapper.hasHardConflict) {
                continue;
            }
            if (sourceShift.Staff__c == null) {
                continue;
            }
            Date sourceStart = getSourceStartDate(sourceShift);
            Date sourceEnd = getSourceEndDate(sourceShift);
            if (sourceStart == null || sourceEnd == null) {
                continue;
            }
            Date destinationStart = sourceStart.addDays(dateOffset);
            Date destinationEnd = sourceEnd.addDays(dateOffset);
            Time startTime = sourceShift.Shift_Start_Time__c != null ? sourceShift.Shift_Start_Time__c : sourceShift.Add_Shift__r.Start_Time__c;
            Time endTime = sourceShift.Shift_End_Time__c != null ? sourceShift.Shift_End_Time__c : sourceShift.Add_Shift__r.End_Time__c;
            if (startTime == null || endTime == null) {
                continue;
            }
            DateTime proposedStart = DateTime.newInstanceGmt(destinationStart, startTime);
            DateTime proposedEnd = DateTime.newInstanceGmt(destinationEnd, endTime);
            List<ShiftWithStaff__c> staffDestinationShifts = destinationShiftsByStaff.containsKey(sourceShift.Staff__c) ? destinationShiftsByStaff.get(sourceShift.Staff__c) : new List<ShiftWithStaff__c>();
            for (ShiftWithStaff__c destination : staffDestinationShifts) {
                Date existingStartDate = getDestinationStartDate(destination);
                Date existingEndDate = getDestinationEndDate(destination);
                Time existingStartTime = destination.Shift_Start_Time__c != null ? destination.Shift_Start_Time__c : destination.Start_Time__c;
                Time existingEndTime = destination.Shift_End_Time__c != null ? destination.Shift_End_Time__c : destination.End_Time__c;
                if (existingStartDate == null || existingEndDate == null || existingStartTime == null || existingEndTime == null) {
                    continue;
                }
                DateTime existingStart = DateTime.newInstanceGmt(existingStartDate, existingStartTime);
                DateTime existingEnd = DateTime.newInstanceGmt(existingEndDate, existingEndTime);
                if (isOverlap(proposedStart, proposedEnd, existingStart, existingEnd)) {
                    wrapper.status = 'OVERLAP';
                    wrapper.resolutionAllowed = true;
                    wrapper.conflicts.add(new ConflictDetail('Shift Overlap', 'Warning', 'Destination shift overlaps with the source shift.'));
                    DestinationShiftWrapper destinationWrapper = new DestinationShiftWrapper();
                    destinationWrapper.shiftId = destination.Id;
                    destinationWrapper.staffId = destination.Staff__c;
                    destinationWrapper.staffName = destination.Staff__r != null ? destination.Staff__r.Display_Nickname__c : '';
                    destinationWrapper.startDate = existingStartDate;
                    destinationWrapper.endDate = existingEndDate;
                    destinationWrapper.startTime = existingStartTime;
                    destinationWrapper.endTime = existingEndTime;
                    destinationWrapper.roleName = destination.Role__c;
                    destinationWrapper.destinationStartEndTime = destination.Shift_Start_End_Time__c;
                    destinationWrapper.facilityName = destination.Shift_Facility__r != null ? destination.Shift_Facility__r.Name : (destination.Add_Shift__r != null && destination.Add_Shift__r.Facility__r != null ? destination.Add_Shift__r.Facility__r.Name : '');
                    // Destination Participant Names
                    Set<String> destinationParticipantNames = new Set<String>();

                    if (destination.Services_and_Support_Plans__r != null) {
                        for (Services_and_Support_Plan__c service : destination.Services_and_Support_Plans__r) {
                            if (String.isNotBlank(service.Participant_Name__c)) {
                                destinationParticipantNames.add(service.Participant_Name__c);
                            }
                     }
                    }

                    destinationWrapper.participantName =String.join(new List<String>(destinationParticipantNames), ', ');
                    wrapper.destinationShifts.add(destinationWrapper);
                }
            }
        }
        List<ShiftConflictWrapper> conflictResult = new List<ShiftConflictWrapper>();
        for (ShiftConflictWrapper wrapper : result) {
            if (wrapper.hasHardConflict || wrapper.status == 'OVERLAP') {
                conflictResult.add(wrapper);
            }
        }
        return conflictResult;
    }
    public static void processHardConflicts(List<ShiftWithStaff__c> sourceShifts, Map<Id, ShiftConflictWrapper> wrapperByShift, Map<Id, Staff__c> staffMap, Map<Id, Set<String>> submittedDocumentsByStaff, Map<Id, List<Child_Staff__c>> documentsByStaff, Map<Id, Id> shiftFacilityMap, Map<Id, Id> shiftOrganisationMap, Map<Id, String> shiftFacilityNameMap, Map<Id, Map<String, Set<String>>> facilityMandatoryDocs, Map<Id, Map<String, Set<String>>> organisationMandatoryDocs, Map<String, Decimal> existingHoursMap, String organisationStartDay, Map<Id, List<Services_and_Support_Plan__c>> servicesByShift, Map<Id, Decimal> availableFundsById, Map<Id, Decimal> accumulatedFundUsage, Integer dateOffset) {
        for (ShiftWithStaff__c sourceShift : sourceShifts) {
            ShiftConflictWrapper wrapper = wrapperByShift.get(sourceShift.Id);
            if (wrapper == null) {
                continue;
            }
            Id staffId = sourceShift.Staff__c;
            Date sourceStart = getSourceStartDate(sourceShift);
            Date sourceEnd = getSourceEndDate(sourceShift);
            if (sourceStart == null || sourceEnd == null) {
                continue;
            }
            Date destinationStart = sourceStart.addDays(dateOffset);
            Date destinationEnd = sourceEnd.addDays(dateOffset);
            if (documentsByStaff.containsKey(staffId)) {
                for (Child_Staff__c document : documentsByStaff.get(staffId)) {
                    if (document.Expiry_Date__c != null && document.Expiry_Date__c <= destinationStart && document.Compliance__c == true) {
                        wrapper.hasHardConflict = true;
                        wrapper.status = 'SKIPPED';
                        wrapper.resolutionAllowed = false;
                        wrapper.conflicts.add(new ConflictDetail('Expired Document', 'Error', '<b>' + document.Document_Type__c + '</b> has expired.'));
                    }
                }
            }
            Id facilityId = shiftFacilityMap.get(sourceShift.Id);
            Id organisationId = shiftOrganisationMap.get(sourceShift.Id);
            String facilityName = shiftFacilityNameMap.get(sourceShift.Id);
            String roleName = sourceShift.Role__c;
            Set<String> requiredDocuments = new Set<String>();
            if (facilityId != null && String.isNotBlank(roleName) && facilityMandatoryDocs.containsKey(facilityId)) {
                String roleKey = roleName.trim().toLowerCase();
                if (facilityMandatoryDocs.get(facilityId).containsKey(roleKey)) {
                    requiredDocuments.addAll(facilityMandatoryDocs.get(facilityId).get(roleKey));
                }
            }
            if (organisationId != null && String.isNotBlank(roleName) && organisationMandatoryDocs.containsKey(organisationId)) {
                String roleKey = roleName.trim().toLowerCase();
                if (organisationMandatoryDocs.get(organisationId).containsKey(roleKey)) {
                    requiredDocuments.addAll(organisationMandatoryDocs.get(organisationId).get(roleKey));
                }
            }
            Set<String> submittedDocuments = submittedDocumentsByStaff.containsKey(staffId) ? submittedDocumentsByStaff.get(staffId) : new Set<String>();
            for (String requiredDocument : requiredDocuments) {
                if (!submittedDocuments.contains(requiredDocument)) {
                    wrapper.hasHardConflict = true;
                    wrapper.status = 'SKIPPED';
                    wrapper.resolutionAllowed = false;
                    wrapper.conflicts.add(new ConflictDetail('Mandatory Document', 'Error', '<b>' + requiredDocument + '</b> document is required for facility <b>' + facilityName + '</b>'));
                }
            }
            Boolean weekend = isWeekend(destinationStart);
            Boolean sleepover = sourceShift.Type_of_Shift__c == 'Sleepover Shift';
            if (!weekend && !sleepover) {
                Staff__c staff = staffMap.get(staffId);
                if (staff != null && staff.Restrict_Set_Hours__c == true && staff.Set_Hours__c != null && staff.Set_Hours__c > 0) {
                    Date weekStart = String.isNotBlank(organisationStartDay) ? RosterCreation.getCustomWeekStart(destinationStart, organisationStartDay) : destinationStart.toStartOfWeek();
                    String hoursKey = String.valueOf(staffId) + '|' + String.valueOf(weekStart);
                    Decimal existingHours = existingHoursMap.containsKey(hoursKey) ? existingHoursMap.get(hoursKey) : 0;
                    Decimal proposedHours = sourceShift.Duration__c != null ? sourceShift.Duration__c : 0;
                    Decimal totalHours = existingHours + proposedHours;
                    if (totalHours > staff.Set_Hours__c) {
                        wrapper.hasHardConflict = true;
                        wrapper.status = 'SKIPPED';
                        wrapper.resolutionAllowed = false;
                        wrapper.conflicts.add(new ConflictDetail('Set Hours', 'Error', 'Set Hours: <b>' + staff.Set_Hours__c + ' hrs</b><br/>Current Hours: <b>' + totalHours + ' hrs</b>'));
                    } else {
                        existingHoursMap.put(hoursKey, totalHours);
                    }
                }
            }
            if (servicesByShift.containsKey(sourceShift.Id)) {
                Map<Id, Decimal> shiftFundUsage = new Map<Id, Decimal>();
                for (Services_and_Support_Plan__c service : servicesByShift.get(sourceShift.Id)) {
                    if (service.Funds_Tracker__c == null) {
                        continue;
                    }
                    Decimal serviceAmount = getServiceAmount(service);
                    Decimal currentUsage = shiftFundUsage.containsKey(service.Funds_Tracker__c) ? shiftFundUsage.get(service.Funds_Tracker__c) : 0;
                    shiftFundUsage.put(service.Funds_Tracker__c, currentUsage + serviceAmount);
                }
                Boolean fundExceeded = false;
                for (Id fundId : shiftFundUsage.keySet()) {
                    Decimal shiftAmount = shiftFundUsage.get(fundId);
                    Decimal previousUsage = accumulatedFundUsage.containsKey(fundId) ? accumulatedFundUsage.get(fundId) : 0;
                    Decimal availableAmount = availableFundsById.containsKey(fundId) ? availableFundsById.get(fundId) : 0;
                    Decimal totalUsage = previousUsage + shiftAmount;
                    if (totalUsage > availableAmount) {
                        fundExceeded = true;
                        wrapper.hasHardConflict = true;
                        wrapper.status = 'SKIPPED';
                        wrapper.resolutionAllowed = false;
                        wrapper.conflicts.add(new ConflictDetail('Fund Exceeds', 'Error', 'Fund exceeds available amount. Used: <b>$' + totalUsage.setScale(2) + '</b>, Available: <b>$' + availableAmount.setScale(2) + '</b>'));
                    }
                }
                if (!fundExceeded) {
                    for (Id fundId : shiftFundUsage.keySet()) {
                        Decimal previousUsage = accumulatedFundUsage.containsKey(fundId) ? accumulatedFundUsage.get(fundId) : 0;
                        accumulatedFundUsage.put(fundId, previousUsage + shiftFundUsage.get(fundId));
                    }
                }
            }
        }
    }
    public static Decimal getServiceAmount(Services_and_Support_Plan__c service) {
        Decimal unitPrice = service.Edited_Unit_Price__c != null ? service.Edited_Unit_Price__c : 0;
        Decimal quantity = service.Qty__c != null ? service.Qty__c : 1;
        return unitPrice * quantity;
    }
    public static Date getSourceStartDate(ShiftWithStaff__c shift) {
        if (shift.Start_Date__c != null) {
            return shift.Start_Date__c;
        }
        return shift.Date__c;
    }
    public static Date getSourceEndDate(ShiftWithStaff__c shift) {
        if (shift.Shift_End_Date__c != null) {
            return shift.Shift_End_Date__c;
        }
        return shift.End_Date__c != null ? shift.End_Date__c : shift.Date__c;
    }
    public static Date getDestinationStartDate(ShiftWithStaff__c shift) {
        if (shift.Start_Date__c != null) {
            return shift.Start_Date__c;
        }
        return shift.Date__c;
    }
    public static Date getDestinationEndDate(ShiftWithStaff__c shift) {
        if (shift.Shift_End_Date__c != null) {
            return shift.Shift_End_Date__c;
        }
        return shift.End_Date__c != null ? shift.End_Date__c : shift.Date__c;
    }
    public static Boolean isOverlap(DateTime firstStart, DateTime firstEnd, DateTime secondStart, DateTime secondEnd) {
        return firstStart < secondEnd && firstEnd > secondStart;
    }
    public static Boolean isWeekend(Date dateValue) {
        Integer dayOfWeek = Integer.valueOf(DateTime.newInstance(dateValue, Time.newInstance(0, 0, 0, 0)).format('u'));
        return dayOfWeek == 6 || dayOfWeek == 7;
    }
    public class ShiftConflictWrapper {
        @AuraEnabled
        public Id sourceShiftId;
        @AuraEnabled
        public Id staffId;
        @AuraEnabled
        public String staffName;
        @AuraEnabled
        public String roleName;
        @AuraEnabled
        public String sourceShiftName;
        @AuraEnabled
        public Date sourceStartDate;
        @AuraEnabled
        public Date sourceEndDate;
        @AuraEnabled
        public Date destinationStartDate;
        @AuraEnabled
        public Date destinationEndDate;
        @AuraEnabled
        public String status;
        @AuraEnabled
        public Boolean hasHardConflict;
        @AuraEnabled
        public Boolean resolutionAllowed;
        @AuraEnabled
        public List<ConflictDetail> conflicts;
        @AuraEnabled public String sourceShiftTime;
        @AuraEnabled public String participantName;
        @AuraEnabled public List<DestinationShiftWrapper> destinationShifts;
          @AuraEnabled public String facilityName;
    }
    public class DestinationShiftWrapper {
        @AuraEnabled
        public Id shiftId;
        @AuraEnabled
        public Id staffId;
        @AuraEnabled
        public String staffName;
        @AuraEnabled
        public Date startDate;
        @AuraEnabled
        public Date endDate;
        @AuraEnabled
        public Time startTime;
        @AuraEnabled
        public Time endTime;
        @AuraEnabled
        public String roleName;
        @AuraEnabled
        public String facilityName;
         @AuraEnabled
        public String destinationStartEndTime;
           @AuraEnabled
         public String participantName;
    }
    public class ConflictDetail {
        @AuraEnabled
        public String type;
        @AuraEnabled
        public String severity;
        @AuraEnabled
        public String message;
        public ConflictDetail(String type, String severity, String message) {
            this.type = type;
            this.severity = severity;
            this.message = message;
        }
    }
}