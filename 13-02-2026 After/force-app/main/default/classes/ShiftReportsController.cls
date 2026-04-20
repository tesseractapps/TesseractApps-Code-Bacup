public without sharing class ShiftReportsController {
    
    @AuraEnabled(cacheable=true)
    public static List<ShiftwithStaff__c> getShiftWithStaffData(
        String role, String employmentType, 
        String startWeekDate, String endWeekDate , String location ,  List<Id> facilityIds                 
    ) {
        System.debug('role: ' + role);
        System.debug('employmentType: ' + employmentType);
        System.debug('startWeekDate: ' + startWeekDate);
        System.debug('endWeekDate: ' + endWeekDate);
        System.debug('location: ' + location);
        System.debug(' Facility IDs passed  : ' + facilityIds);
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
            System.debug('organisationList: ' + organisationList);
            if (organisationList.isEmpty()) {
                throw new AuraHandledException('Organisation not found');
            }
            String organisationId = organisationList[0].Id;
            
            // Date parsing and weekday calculation
            if (!Pattern.matches('\\d{4}-\\d{2}-\\d{2}', startWeekDate) || !Pattern.matches('\\d{4}-\\d{2}-\\d{2}', endWeekDate)) {
                throw new AuraHandledException('Date format must be yyyy-MM-dd');
            }
            
            Date startDate = Date.valueOf(startWeekDate);
            Date endDate = Date.valueOf(endWeekDate);
            System.debug('startDate: ' + startDate);
            System.debug('endDate: ' + endDate);
            /*List<ShiftwithStaff__c> shiftList = new List<ShiftwithStaff__c>(); 

shiftList = [
SELECT Id, Duration__c, Type_of_shift__c,Status__c, Start_Date__c, Role_formula__c,Staff__c,Staff_Name__c,Shift_Type__c,Add_Shift__r.Shift_Start_End_Time__c,
Add_Shift__r.Get_Facility__c, Add_Shift__r.Participant_Address_checkbox__c, (SELECT Id,Participant_Name__c FROM Services_and_Support_Plans__r)
FROM ShiftwithStaff__c
WHERE Start_Date__c >= :startDate AND Start_Date__c <= :endDate AND Staff__r.Facility__r.Organisation__c = :organisationList[0].Id
AND (Role_formula__c = :role OR Staff__r.Type_of_Job__c = :employmentType)

];*/
            String baseQuery = 
                'SELECT Id, Duration__c, Type_of_shift__c, Status__c, Start_Date__c,Date__c, Role_formula__c, Staff__c, ' +
                'Staff_Name__c, Shift_Type__c, Add_Shift__r.Shift_Start_End_Time__c, Staff__r.Display_Nickname__c,' +
                'Add_Shift__r.Get_Facility__c, Add_Shift__r.Participant_Address_checkbox__c, ' +
                '(SELECT Id,Client__c, Participant_Name__c FROM Services_and_Support_Plans__r) ' +
                'FROM ShiftwithStaff__c WHERE Date__c >= :startDate AND Date__c <= :endDate ' +
                'AND Staff__r.Facility__r.Organisation__c = :organisationId ' +
              //  ' AND Status__c = \'Completed\' AND Staff__r.Facility__c IN :facilityIds';
                ' AND Status__c = \'Completed\' AND Add_Shift__r.Facility__c IN :facilityIds';
            // 'AND (Role_formula__c = :role OR Staff__r.Type_of_Job__c = :employmentType)';
            
            if (String.isNotBlank(role) && role != 'All') {
                baseQuery += ' AND Role_formula__c = :role';
            }
            if (String.isNotBlank(employmentType) && employmentType != 'All') {
                baseQuery += ' AND Staff__r.Type_of_Job__c = :employmentType';
            }
            if (String.isNotBlank(location) && location != 'All') {
                // Add condition based on location
                if (location == 'Facility') {
                    baseQuery += ' AND Add_Shift__r.Get_Facility__c = false';
                } else if (location == 'Participant') {
                    baseQuery += ' AND Add_Shift__r.Get_Facility__c = true AND Add_Shift__r.Participant_Address_checkbox__c = true';
                } else if (location == 'Other') {
                    baseQuery += ' AND Add_Shift__r.Get_Facility__c = true AND Add_Shift__r.Participant_Address_checkbox__c = false';
                }
            } 
            baseQuery += ' ORDER BY Date__c DESC';
            
            List<ShiftwithStaff__c> shiftList = Database.query(baseQuery);
            Integer totalCount = shiftList.size();
            System.debug('Total Shift Count => ' + totalCount);
            
            return  shiftList;
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching staff data: ' + e.getMessage());
        }
    }
    @AuraEnabled
    public static map<string,object> getAddShiftById(string shiftId){
        map<string,object> shiftWithStaffData=new map<string,object>();
        
        ShiftwithStaff__c addShiftdata=[SELECT Id,Staff_Name__c,Add_Shift__r.Shift_Notes__c,Add_Shift__c,SignIn_Notes__c,Add_Shift__r.Start_Date__c , Staff__r.Display_Nickname__c, 
                                        Add_Shift__r.Shift_Start_End_Time__c,Client_Signature__c,Date__c,Status__c,Add_Shift__r.Role__c,
                                        (SELECT Id,Notes__c,CreatedDate FROM ShiftWithStaff_Activities__r),
                                        (SELECT Id,Total_Amount__c,Comments__c,Type_of_Vehicle__c,Approval_Status__c  FROM Reimbursements__r),
                                        (SELECT Id,Qty__c,Start_Time_Formula__c, Service_Type_Name__c,Client__c FROM Services_and_Support_Plans__r)
                                        FROM ShiftwithStaff__c WHERE Id = :shiftId];
        
        list<Add_Shift_Checklist__c> addShiftCheckList=[select id ,Description__c,Mandatory__c,Add_Shift__c from Add_Shift_Checklist__c where Add_Shift__c=:addShiftdata.Add_Shift__c OR ShiftwithStaff__c =:shiftId];
        shiftWithStaffData.put('shiftwithstaffdata',addShiftdata);
        shiftWithStaffData.put('checklistdata',JSON.serialize(addShiftCheckList));
        
        return shiftWithStaffData;
    }
    
    @AuraEnabled
    public static Map<String, Object> getShiftWithCases(String shiftId) {
        Map<String, Object> response = new Map<String, Object>();
        
        try {
            ShiftwithStaff__c shiftRec = [ SELECT Id,Name,Staff__c,Staff_Name__c,Staff__r.Name,Staff__r.Display_Nickname__c, Add_Shift__c,Add_Shift__r.Start_Date__c,
                                          Add_Shift__r.Shift_Start_End_Time__c,Log_In_Date_Time__c,Log_Out_Date_Time__c,Date__c
                                          FROM ShiftwithStaff__c
                                          WHERE Id = :shiftId
                                          LIMIT 1
                                         ];
            if (shiftRec == null || shiftRec.Staff__c == null) {
                response.put('status', 'error');
                response.put('message', 'Shift or Staff not found.');
                return response;
            }
            
            // Prefer Add_Shift__r.Start_Date__c as base date, fallback to ShiftwithStaff.Date__c
            Date baseDate = shiftRec.Add_Shift__r?.Start_Date__c != null ? shiftRec.Add_Shift__r.Start_Date__c : shiftRec.Date__c;
            if (baseDate == null) {
                response.put('status', 'error');
                response.put('message', 'Shift date is missing.');
                return response;
            }
            
            // Log_In_Date_Time__c and Log_Out_Date_Time__c are DateTime fields, extract time part only
            if (shiftRec.Log_In_Date_Time__c == null || shiftRec.Log_Out_Date_Time__c == null) {
                response.put('status', 'error');
                response.put('message', 'Shift login or logout time is missing.');
                return response;
            }
            
            Time logInTime = Time.newInstance(shiftRec.Log_In_Date_Time__c.hour(), shiftRec.Log_In_Date_Time__c.minute(), shiftRec.Log_In_Date_Time__c.second(), 0);
            Time logOutTime = Time.newInstance(shiftRec.Log_Out_Date_Time__c.hour(), shiftRec.Log_Out_Date_Time__c.minute(), shiftRec.Log_Out_Date_Time__c.second(), 0);
            
            // Combine baseDate with login and logout times to get full Datetime
            Datetime shiftStart = Datetime.newInstance(baseDate, logInTime);
            Datetime shiftEnd = Datetime.newInstance(baseDate, logOutTime);
            
            // If logout is before login, it means shift crosses midnight, so add 1 day to shiftEnd
            if (shiftEnd < shiftStart) {
                shiftEnd = shiftEnd.addDays(1);
            }
            
            System.debug('Shift Start: ' + shiftStart);
            System.debug('Shift End: ' + shiftEnd);
            
            // Query Case records assigned to staff and created within shift window
            List<Case> caseList = [
                SELECT Id, CaseNumber, Subject, Status, CreatedDate, Assign_to__c
                FROM Case
                WHERE Assign_to__c = :shiftRec.Staff__c
                AND CreatedDate >= :shiftStart
                AND CreatedDate <= :shiftEnd
                ORDER BY CreatedDate ASC
            ];
            
            // Build response map
            response.put('status', 'success');
            response.put('shiftRecord', shiftRec);
            response.put('incidentCount', caseList.size());
            response.put('incidents', caseList);
            
        } catch (Exception ex) {
            System.debug('Error in getShiftWithCases: ' + ex.getMessage());
            response.put('status', 'error');
            response.put('message', ex.getMessage());
        }
        
        return response;
    }
    
    @AuraEnabled
    public static List<Case> getCasesByStaff(String staffId,  Date StartDate) {
        DateTime startOfDay = DateTime.newInstance(StartDate, Time.newInstance(0, 0, 0, 0));
        DateTime endOfDay   = DateTime.newInstance(StartDate, Time.newInstance(23, 59, 59, 999));
        
        return [
            SELECT Id, CaseNumber, Subject, Status, CreatedDate, Assign_to__c,Status_1__c,Priority
            FROM Case
            WHERE Staffid__c = :staffId  AND CreatedDate >= :startOfDay
            AND CreatedDate <= :endOfDay
            
            
        ];
    }
    
    @AuraEnabled
    public static List<Client_Journel__c> getjournalsByStaff(String staffId,  Date StartDate, String ClientId) {
        DateTime startOfDay = DateTime.newInstance(StartDate, Time.newInstance(0, 0, 0, 0));
        DateTime endOfDay   = DateTime.newInstance(StartDate, Time.newInstance(23, 59, 59, 999));
        
        return [
            SELECT Care_Notes__c, Id, Description__c, Staff__c,is_Locked__c FROM Client_Journel__c 
            WHERE Staff__c = :staffId AND is_Locked__c = true AND Client__c = :ClientId  AND CreatedDate >= :startOfDay 
            AND CreatedDate <= :endOfDay
        ];
    }
    
    @AuraEnabled
    public static List<Dynamic_Form_Response__c> getformsByStaff(String staffId,  Date StartDate, String ClientId) {
        DateTime startOfDay = DateTime.newInstance(StartDate, Time.newInstance(0, 0, 0, 0));
        DateTime endOfDay   = DateTime.newInstance(StartDate, Time.newInstance(23, 59, 59, 999));
        Staff__c staff = [SELECT Email_Address__c  FROM Staff__c  WHERE Id = :staffId  LIMIT 1];
        User u = [SELECT Id FROM User WHERE Email = :staff.Email_Address__c  LIMIT 1];
        
        return [SELECT Id, Name__c, Form_Type__c, Response_JSON__c, CreatedDate, Client_Id__c, Participant_Name__c,CreatedBy.Name
                FROM Dynamic_Form_Response__c 
                WHERE CreatedById = :u.Id  AND Client_Id__c = :ClientId  AND  CreatedDate >= :startOfDay
                AND CreatedDate <= :endOfDay
               ];
    }
    // save template start
    @AuraEnabled
    public static Exported_Template__c createTemplate(
        String templateName,
        Id facilityId,
        String templateJson,
        Id templateId
    ) {
        if (templateId == null) {
            List<Exported_Template__c> existingTemplates = [
                SELECT Id
                FROM Exported_Template__c
                WHERE ExportedTemplate_To_Facility__c = :facilityId
                AND Name = :templateName
                LIMIT 1
            ];
            
            if (!existingTemplates.isEmpty()) {
                throw new AuraHandledException(
                    'Template with this name already exists. Please choose a different name.'
                );
            }
        }
        Exported_Template__c tpl;
        
        if (templateId != null) {
            tpl = [
                SELECT Id
                FROM Exported_Template__c
                WHERE Id = :templateId
                LIMIT 1
            ];
            tpl.Template_JSON__c = templateJson;
        } else {
            tpl = new Exported_Template__c(
                Name = templateName,
                ExportedTemplate_To_Facility__c = facilityId,
                Template_JSON__c = templateJson
            );
        }
        
        upsert tpl;
        return tpl;
    }
    
    @AuraEnabled
    public static List<Exported_Template__c> getTemplatesByFacility(Id facilityId) {
        return [
            SELECT Id, Name, Template_JSON__c
            FROM Exported_Template__c
            WHERE ExportedTemplate_To_Facility__c = :facilityId 
            AND Report_Module__c =  false
            ORDER BY CreatedDate DESC
        ];
    }
    
    @AuraEnabled
    public static void deleteTemplate(Id templateId) {
        delete [SELECT Id FROM Exported_Template__c WHERE Id = :templateId];
    }
    // Add this method to your ShiftReportsController class
    @AuraEnabled
    public static Map<String, Object> getAllExportData(
        String role, 
        String employmentType, 
        String startWeekDate, 
        String endWeekDate, 
        String location, 
        List<Id> facilityIds,
        List<String> shiftIds
    ) {
        Map<String, Object> allData = new Map<String, Object>();
        
        try {
            System.debug('Starting getAllExportData for ' + shiftIds.size() + ' shifts');
            
            /* =========================
1. Fetch ALL shifts
========================= */
            String baseQuery =
                'SELECT Id, Duration__c, Address__c, Type_of_shift__c, Status__c, ' +
                'Start_Date__c, Date__c, Role_formula__c, Staff__c, Staff_Name__c, ' +
                'Shift_Type__c, SignIn_Notes__c, Add_Shift__c, Client_Signature__c, ' +
                'Add_Shift__r.Role__c, Add_Shift__r.Shift_Start_End_Time__c, ' +
                'Add_Shift__r.Get_Facility__c, Add_Shift__r.Participant_Address_checkbox__c, ' +
                'Staff__r.Display_Nickname__c, ' +
                '(SELECT Id, Notes__c, CreatedDate FROM ShiftWithStaff_Activities__r), ' +
                '(SELECT Id, Total_Amount__c, Comments__c, Type_of_Vehicle__c, Approval_Status__c FROM Reimbursements__r), ' +
                '(SELECT Id, Qty__c, Start_Time_Formula__c, Service_Type_Name__c, Client__c, Participant_Name__c FROM Services_and_Support_Plans__r), ' +
                '(SELECT Mandatory__c, Description__c, Completed__c FROM Add_Shift_Checklists__r) ' +
                'FROM ShiftwithStaff__c WHERE Id IN :shiftIds';
            
            List<ShiftwithStaff__c> allShifts = Database.query(baseQuery);
            
            /* =========================
2. Collect IDs
========================= */
            Set<Id> allStaffIds = new Set<Id>();
            Set<Id> allClientIds = new Set<Id>();
            
            for (ShiftwithStaff__c shift : allShifts) {
                allStaffIds.add(shift.Staff__c);
                for (Services_and_Support_Plan__c s : shift.Services_and_Support_Plans__r) {
                    if (s.Client__c != null) {
                        allClientIds.add(s.Client__c);
                    }
                }
            }
            Map<Id, Id> staffToUserMap = new Map<Id, Id>();

            List<Staff__c> staffList = [
                SELECT Id, Email_Address__c
                FROM Staff__c
                WHERE Id IN :allStaffIds
            ];
            
            Set<String> staffEmails = new Set<String>();
            for (Staff__c s : staffList) {
                if (s.Email_Address__c != null) {
                    staffEmails.add(s.Email_Address__c.toLowerCase());
                }
            }
            
            Map<String, Id> emailToUserIdMap = new Map<String, Id>();
            if (!staffEmails.isEmpty()) {
                for (User u : [
                    SELECT Id, Email
                    FROM User
                    WHERE Email IN :staffEmails
                ]) {
                    emailToUserIdMap.put(u.Email.toLowerCase(), u.Id);
                }
            }
            
            for (Staff__c s : staffList) {
                if (s.Email_Address__c != null &&
                    emailToUserIdMap.containsKey(s.Email_Address__c.toLowerCase())) {
                        staffToUserMap.put(
                            s.Id,
                            emailToUserIdMap.get(s.Email_Address__c.toLowerCase())
                        );
                    }
            }
            /* =========================
            3. Bulk fetch data (NO DAY_ONLY)
            ========================= */
            List<Case> allCases = [
                SELECT Id, CaseNumber, Status, CreatedDate,
                Staffid__c, Status_1__c, Priority
                FROM Case
                WHERE Staffid__c IN :allStaffIds
            ];
            
            List<Client_Journel__c> allJournals = [
                SELECT Id, Care_Notes__c, Description__c,
                Staff__c, Client__c, CreatedDate
                FROM Client_Journel__c
                WHERE Staff__c IN :allStaffIds
                AND Client__c IN :allClientIds
                AND is_Locked__c = true
            ];
            
            List<Dynamic_Form_Response__c> allForms = [
                SELECT Id, Name__c, Form_Type__c, Response_JSON__c,
                CreatedDate, Client_Id__c, Participant_Name__c,CreatedById
                FROM Dynamic_Form_Response__c
                WHERE Client_Id__c IN :allClientIds
            ];
            //system.debug('AllForms'+allForms[0].CreatedById);
            /* =========================
4. Build response per shift
========================= */
            List<Map<String, Object>> shiftDetails = new List<Map<String, Object>>();
            
            for (ShiftwithStaff__c shift : allShifts) {
                Map<String, Object> shiftDetail = new Map<String, Object>();
                shiftDetail.put('shift', shift);
                
                shiftDetail.put(
                    'checklist',
                    shift.Add_Shift_Checklists__r != null
                    ? shift.Add_Shift_Checklists__r
                    : new List<Add_Shift_Checklist__c>()
                );
                
                // ✅ ONLY time logic
                Date baseDate = shift.Date__c;
                
                Datetime shiftStart = Datetime.newInstance(
                    baseDate,
                    Time.newInstance(0, 0, 0, 0)
                );
                
                Datetime shiftEnd = Datetime.newInstance(
                    baseDate,
                    Time.newInstance(23, 59, 59, 999)
                );
                
                
                /* ---- INCIDENTS ---- */
                List<Case> shiftCases = new List<Case>();
                for (Case c : allCases) {
                    if (c.Staffid__c == shift.Staff__c &&
                        c.CreatedDate >= shiftStart &&
                        c.CreatedDate <= shiftEnd) {
                            shiftCases.add(c);
                        }
                }
                shiftDetail.put('incidents', shiftCases);
                
                /* ---- JOURNALS ---- */
                List<Client_Journel__c> shiftJournals = new List<Client_Journel__c>();
                for (Client_Journel__c j : allJournals) {
                    if (j.Staff__c == shift.Staff__c &&
                        j.CreatedDate >= shiftStart &&
                        j.CreatedDate <= shiftEnd) {
                            shiftJournals.add(j);
                        }
                }
                shiftDetail.put('journals', shiftJournals);
                Set<Id> shiftClientIds = new Set<Id>();
                if (shift.Services_and_Support_Plans__r != null) {
                    for (Services_and_Support_Plan__c s : shift.Services_and_Support_Plans__r) {
                        if (s.Client__c != null) {
                            shiftClientIds.add(s.Client__c);
                        }
                    }
                }
                List<Dynamic_Form_Response__c> shiftForms = new List<Dynamic_Form_Response__c>();
                Id shiftUserId = staffToUserMap.get(shift.Staff__c);
system.debug('userId'+shiftUserId);
                // Only attach forms created by THIS staff for THIS participant
                if (shiftUserId != null && !shiftClientIds.isEmpty()) {
                    for (Dynamic_Form_Response__c f : allForms) {
                        if (
                            f.CreatedById == shiftUserId &&
                            f.Client_Id__c != null &&
                            shiftClientIds.contains(f.Client_Id__c) &&
                            f.CreatedDate >= shiftStart &&
                            f.CreatedDate <= shiftEnd
                        ) {
                            shiftForms.add(f);
                        }
                    }
                }
                
                shiftDetail.put('forms', shiftForms);
                
                shiftDetails.add(shiftDetail);
            }
            
            allData.put('shiftDetails', shiftDetails);
            allData.put('status', 'success');
            
        } catch (Exception e) {
            allData.put('status', 'error');
            allData.put('message', e.getMessage());
        }
        
        return allData;
    }
    
}