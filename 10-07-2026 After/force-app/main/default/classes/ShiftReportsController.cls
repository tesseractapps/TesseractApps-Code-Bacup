public without sharing class ShiftReportsController {
    
    @AuraEnabled(cacheable=true)
    public static List<ShiftwithStaff__c> getShiftWithStaffData(
        String role, String employmentType, 
        String startWeekDate, String endWeekDate , String location ,  List<Id> facilityIds , String signStatus                 
    ) {
        System.debug('role: ' + role);
        System.debug('employmentType: ' + employmentType);
        System.debug('startWeekDate: ' + startWeekDate);
        System.debug('endWeekDate: ' + endWeekDate);
        System.debug('location: ' + location);
        System.debug(' Facility IDs passed  : ' + facilityIds);
        System.debug('signStatus: ' + signStatus);
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

            String baseQuery = 
                'SELECT Id, Duration__c, Type_of_shift__c, Status__c, Start_Date__c,Date__c, Role_formula__c, Staff__c,Shift_Start_End_Time__c, ' +
                'Log_In_Date_Time__c, Log_Out_Date_Time__c, Shift_Start_Time__c, Shift_End_Time__c, ' +
                'Staff_Name__c, Shift_Type__c, Add_Shift__r.Shift_Start_End_Time__c, Staff__r.Display_Nickname__c,' +
                'Add_Shift__r.Get_Facility__c, Add_Shift__r.Participant_Address_checkbox__c, ' +
                '(SELECT Id,Client__c, Participant_Name__c, Participant_Forms__c  FROM Services_and_Support_Plans__r) ' +
                'FROM ShiftwithStaff__c WHERE Date__c >= :startDate AND Date__c <= :endDate ' +
                'AND Staff__r.Facility__r.Organisation__c = :organisationId ' +
                //  ' AND Status__c = \'Completed\' AND Staff__r.Facility__c IN :facilityIds';
                ' AND Status__c = \'Completed\' AND Add_Shift__r.Facility__c IN :facilityIds';
            // 'AND (Role_formula__c = :role OR Staff__r.Type_of_Job__c = :employmentType)';
            
            if (String.isNotBlank(role) && role != 'All') {
                baseQuery += ' AND Role_formula__c = :role';
            }
            /*  if (String.isNotBlank(employmentType) && employmentType != 'All') {
                baseQuery += ' AND Staff__r.Type_of_Job__c = :employmentType';
            } */
            if (String.isNotBlank(employmentType) && employmentType != 'All') {
    baseQuery += ' AND Staff__c IN (SELECT StaffRole_To_Staff__c FROM StaffRole__c WHERE Type_of_Job__c = :employmentType)';
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
            if (String.isNotBlank(signStatus) && signStatus != 'All') {

            if (signStatus == 'Sign In Enabled') {
            baseQuery += ' AND Enable_Sign_In__c = true';

            } else if (signStatus == 'Sign Out Enabled') {
            baseQuery += ' AND Enable_Sign_Out__c = true';
            }

            }
            baseQuery += ' ORDER BY Date__c DESC';
            
            List<ShiftwithStaff__c> shiftList = Database.query(baseQuery);
            if (signStatus == 'Late Sign In') {

    List<ShiftwithStaff__c> filteredList = new List<ShiftwithStaff__c>();

    for (ShiftwithStaff__c shift : shiftList) {

        if (
            shift.Log_In_Date_Time__c != null &&
            shift.Shift_Start_Time__c != null &&
            shift.Log_In_Date_Time__c > shift.Shift_Start_Time__c
        ) {
            filteredList.add(shift);
        }
    }

    shiftList = filteredList;

} else if (signStatus == 'Early Sign Out') {

    List<ShiftwithStaff__c> filteredList = new List<ShiftwithStaff__c>();

    for (ShiftwithStaff__c shift : shiftList) {

        if (
            shift.Log_Out_Date_Time__c != null &&
            shift.Shift_End_Time__c != null &&
            shift.Log_Out_Date_Time__c < shift.Shift_End_Time__c
        ) {
            filteredList.add(shift);
        }
    }

    shiftList = filteredList;
}
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
        
        ShiftwithStaff__c addShiftdata=[SELECT Id,Staff_Name__c,Add_Shift__r.Shift_Notes__c,Add_Shift__c,SignIn_Notes__c,Add_Shift__r.Start_Date__c , Staff__r.Display_Nickname__c,Shift_Start_End_Time__c, 
                                        Add_Shift__r.Shift_Start_End_Time__c,Client_Signature__c,Date__c,Status__c,Add_Shift__r.Role__c,
                                        (SELECT Id,Notes__c,CreatedDate FROM ShiftWithStaff_Activities__r),
                                        (SELECT Id,Total_Amount__c,Comments__c,Type_of_Vehicle__c,Approval_Status__c  FROM Reimbursements__r),
                                        (SELECT Id,Qty__c,Start_Time_Formula__c,SIL_Service_Name__c,SIL_Service__c, Service_Type_Name__c,Client__c,Participant_Forms__c FROM Services_and_Support_Plans__r)
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
    
/*     @AuraEnabled
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
    } */
   @AuraEnabled
public static List<Map<String, String>> getformsByStaff(
    String staffId,
    Date StartDate,
    String ClientId
) {
    List<Map<String, String>> result = new List<Map<String, String>>();

    // 🔥 Get the exact shift (same as your view)
    List<ShiftwithStaff__c> shifts = [
        SELECT Id,
            (SELECT Participant_Forms__c, Participant_Name__c
             FROM Services_and_Support_Plans__r
             WHERE Client__c = :ClientId)
        FROM ShiftwithStaff__c
        WHERE Staff__c = :staffId
        AND Date__c = :StartDate
    ];

    // Debug (very important)
    System.debug('Shifts found: ' + shifts.size());

    Set<Id> formIds = new Set<Id>();

    for (ShiftwithStaff__c shift : shifts) {
        if (shift.Services_and_Support_Plans__r != null) {
            for (Services_and_Support_Plan__c s : shift.Services_and_Support_Plans__r) {

                System.debug('Participant Forms RAW: ' + s.Participant_Forms__c);

                if (String.isNotBlank(s.Participant_Forms__c)) {
                    for (String f : s.Participant_Forms__c.split(',')) {
                        try {
                            formIds.add((Id)f.trim());
                        } catch (Exception e) {
                            System.debug('Invalid Form Id: ' + f);
                        }
                    }
                }
            }
        }
    }

    System.debug('Collected Form Ids: ' + formIds);

    if (formIds.isEmpty()) {
        return result; // 🔥 no forms found
    }

    Map<Id, Dynamic_Form__c> formMap = new Map<Id, Dynamic_Form__c>(
        [SELECT Id, Name__c FROM Dynamic_Form__c WHERE Id IN :formIds]
    );

    // 🔥 Build final response (IMPORTANT KEYS)
    for (ShiftwithStaff__c shift : shifts) {
        if (shift.Services_and_Support_Plans__r != null) {
            for (Services_and_Support_Plan__c s : shift.Services_and_Support_Plans__r) {

                if (String.isNotBlank(s.Participant_Forms__c)) {

                    for (String f : s.Participant_Forms__c.split(',')) {

                        Id formId;
                        try {
                            formId = (Id)f.trim();
                        } catch (Exception e) {
                            continue;
                        }

                        if (formMap.containsKey(formId)) {

                            Map<String, String> row = new Map<String, String>();

                            row.put('Name__c', formMap.get(formId).Name__c); // ✅ FORM NAME
                            row.put('Participant_Name__c', s.Participant_Name__c); // ✅ PARTICIPANT

                            result.add(row);
                        }
                    }
                }
            }
        }
    }

    System.debug('Final Forms Result: ' + result);

    return result;
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
                        'SELECT Id, Duration__c, Address__c, Type_of_shift__c, Status__c,Shift_Start_End_Time__c, ' +
                        'Start_Date__c, Date__c, Role_formula__c, Staff__c, Staff_Name__c, Log_In_Date_Time__c, Log_Out_Date_Time__c, ' +
                        'Shift_Type__c, SignIn_Notes__c, Add_Shift__c, Client_Signature__c, ' +
                        'Add_Shift__r.Role__c, Add_Shift__r.Shift_Start_End_Time__c, ' +
                        'Add_Shift__r.Get_Facility__c, Add_Shift__r.Participant_Address_checkbox__c, ' +
                        'Staff__r.Display_Nickname__c, ' +
                        '(SELECT Id, Notes__c, CreatedDate FROM ShiftWithStaff_Activities__r), ' +
                        '(SELECT Id, Total_Amount__c, Comments__c, Type_of_Vehicle__c, Approval_Status__c FROM Reimbursements__r), ' +
                        '(SELECT Id, Qty__c, Start_Time_Formula__c, Service_Type_Name__c, Client__c, Participant_Name__c, Participant_Forms__c FROM Services_and_Support_Plans__r), ' +
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

                    System.debug('allStaffIds >>>>>'+ allStaffIds);
                    
                    List<Incident_Register_Response__c> allIncidentResponses = [
                        SELECT Id, Name, Name__c, Status__c, CreatedDate, Incident_Assigned_Staff__c,Facility__c
                        FROM Incident_Register_Response__c
                        WHERE Incident_Assigned_Staff__c IN :allStaffIds
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
        // STEP 1: Collect all Form IDs
Set<Id> allFormIds = new Set<Id>();

for (ShiftwithStaff__c shift : allShifts) {
    if (shift.Services_and_Support_Plans__r != null) {
        for (Services_and_Support_Plan__c s : shift.Services_and_Support_Plans__r) {

            if (String.isNotBlank(s.Participant_Forms__c)) {

                for (String f : s.Participant_Forms__c.split(',')) {
                    if (String.isNotBlank(f)) {
                        try {
                            allFormIds.add((Id)f.trim());
                        } catch (Exception e) {
                            System.debug('Invalid Form Id: ' + f);
                        }
                    }
                }
            }
        }
    }
}

// STEP 2: Query Form Names
Map<Id, Dynamic_Form__c> formMapById = new Map<Id, Dynamic_Form__c>();

if (!allFormIds.isEmpty()) {
    formMapById = new Map<Id, Dynamic_Form__c>(
        [SELECT Id, Name__c,Form_Type__c FROM Dynamic_Form__c WHERE Id IN :allFormIds]
    );
}
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
                        shiftDetail.put('participants', getParticipants(shift.Services_and_Support_Plans__r));
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
                        
                        
                    /*      
                        List<Case> shiftCases = new List<Case>();
                        for (Case c : allCases) {
                            if (c.Staffid__c == shift.Staff__c &&
                                c.CreatedDate >= shiftStart &&
                                c.CreatedDate <= shiftEnd) {
                                    shiftCases.add(c);
                                }
                        }
                        shiftDetail.put('incidents', shiftCases); */
                        /* ---- INCIDENTS (MERGED) ---- */
        List<Map<String, String>> incidentList = new List<Map<String, String>>();

        // 🔹 CASES
        for (Case c : allCases) {
            if (c.Staffid__c == shift.Staff__c &&
                c.CreatedDate >= shiftStart &&
                c.CreatedDate <= shiftEnd) {

                Map<String, String> inc = new Map<String, String>();
                inc.put('name', c.CaseNumber);
                inc.put('status', String.isNotBlank(c.Status_1__c) ? c.Status_1__c : c.Status);
                inc.put('priority', c.Priority);

                incidentList.add(inc);
            }
        }

        // 🔹 INCIDENT REGISTER RESPONSE
        for (Incident_Register_Response__c irr : allIncidentResponses) {
            System.debug('👉 IRR RECORD: ' + irr.Id);
            System.debug('IRR Staff: ' + irr.Incident_Assigned_Staff__c);
            System.debug('Shift Staff: ' + shift.Staff__c);

            System.debug('IRR Date: ' + irr.CreatedDate.date());
            System.debug('Shift Date: ' + shift.Date__c);
            SYSTEM.DEBUG('Shift Start: ' + shiftStart);
            SYSTEM.DEBUG('Shift End: ' + shiftEnd);
            if (irr.Incident_Assigned_Staff__c == shift.Staff__c && irr.CreatedDate.date() >= shiftStart && irr.CreatedDate.date() <= shiftEnd) {

                Map<String, String> inc = new Map<String, String>();
                inc.put('name', String.isNotBlank(irr.Name__c) ? irr.Name__c : irr.Name);
                inc.put('status', irr.Status__c);
                inc.put('priority', '');

                incidentList.add(inc);
            }
        }

        System.debug('👉 INCIDENTS for shift ' + shift.Id + ' => ' + incidentList);
        shiftDetail.put('incidents', incidentList);
                        
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
/*                         List<Dynamic_Form_Response__c> shiftForms = new List<Dynamic_Form_Response__c>();
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
                        
                        shiftDetail.put('forms', shiftForms); */
List<String> formList = new List<String>();

// For PDF (table format)
List<Map<String, String>> formTableList = new List<Map<String, String>>();
Set<Id> addedFormIds = new Set<Id>();

if (shift.Services_and_Support_Plans__r != null) {
    for (Services_and_Support_Plan__c s : shift.Services_and_Support_Plans__r) {

        if (String.isNotBlank(s.Participant_Forms__c)) {

            for (String f : s.Participant_Forms__c.split(',')) {

                if (String.isNotBlank(f)) {

                    Id formId;
                    try {
                        formId = (Id)f.trim();
                    } catch (Exception e) {
                        continue;
                    }

                    if (!addedFormIds.contains(formId) && formMapById.containsKey(formId)) {

                        Dynamic_Form__c formRec = formMapById.get(formId);

                        // ✅ CSV FORMAT
                        String formData = 'Form Name: ' + formRec.Name__c +
                                          '\nForm Type: ' + formRec.Form_Type__c;
                        formList.add(formData);

                        // ✅ PDF TABLE FORMAT
                        Map<String, String> formMap = new Map<String, String>();
                        formMap.put('name', formRec.Name__c);
                        formMap.put('type', formRec.Form_Type__c);
                        formTableList.add(formMap);

                        addedFormIds.add(formId);
                    }
                }
            }
        }
    }
}

// store both
shiftDetail.put('forms', formList);           // CSV
shiftDetail.put('formsTable', formTableList); // PDF
                        
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
            

            public List<Map<String, Object>> shiftDetails {get; set;}
            public Boolean showShiftInformation {get; set;}
            public Boolean showIncidentRegister {get; set;}
            public Boolean showForms {get; set;}
            public Boolean showParticipantJournal {get; set;}
            public Boolean showActivityLogs {get; set;}
            public Boolean showServicesDelivered {get; set;}
            public Boolean showReimbursements {get; set;}
            public Boolean showShiftNotes {get; set;}
            public Boolean showChecklist {get; set;}
            public Boolean showSignature {get; set;}
           public String orgName {get; set;}
            public String orgLogo {get; set;}
            public String orgAddress {get; set;}

            public String startDate {get; set;}
            public String endDate {get; set;}

            public ShiftReportsController() {

            if (ApexPages.currentPage() != null) {

                // 🔥 ALWAYS read header params first (IMPORTANT FIX)
                orgName = ApexPages.currentPage().getParameters().get('orgName');
                startDate = ApexPages.currentPage().getParameters().get('startDate');
                endDate = ApexPages.currentPage().getParameters().get('endDate');

                String shiftIdsParam = ApexPages.currentPage().getParameters().get('shiftIds');
                String sectionsParam = ApexPages.currentPage().getParameters().get('sections');

                // ===============================
                // ORGANISATION LOGO + ADDRESS
                // ===============================

                User objUser = [
                    SELECT Id, Organization_Name__c
                    FROM User
                    WHERE Id = :UserInfo.getUserId()
                    LIMIT 1
                ];


                List<Organisation__c> orgList = [
                    SELECT Id,
                        Name,
                        Organization_Logo__c,
                        Address_Latest__Street__s,
                        Address_Latest__City__s,
                        Address_Latest__StateCode__s,
                        Address_Latest__PostalCode__s,
                        Address_Latest__CountryCode__s
                    FROM Organisation__c
                    WHERE Name = :objUser.Organization_Name__c
                    LIMIT 1
                ];


                if(!orgList.isEmpty()){

                    Organisation__c org = orgList[0];

                    orgName = org.Name;

                    orgLogo = org.Organization_Logo__c;


                    List<String> addressParts = new List<String>();

                    if(!String.isBlank(org.Address_Latest__Street__s))
                        addressParts.add(org.Address_Latest__Street__s);

                    if(!String.isBlank(org.Address_Latest__City__s))
                        addressParts.add(org.Address_Latest__City__s);

                    if(!String.isBlank(org.Address_Latest__StateCode__s))
                        addressParts.add(org.Address_Latest__StateCode__s);

                    if(!String.isBlank(org.Address_Latest__PostalCode__s))
                        addressParts.add(org.Address_Latest__PostalCode__s);

                    if(!String.isBlank(org.Address_Latest__CountryCode__s))
                        addressParts.add(org.Address_Latest__CountryCode__s);


                    orgAddress = String.join(addressParts, ', ');
                }

                if (shiftIdsParam != null) {

                    List<String> shiftIds = shiftIdsParam.split(',');

                    Map<String, Object> result = getAllExportData(
                        null, null, null, null, null, null, shiftIds
                    );

                    shiftDetails = (List<Map<String, Object>>) result.get('shiftDetails');

                    // 🔹 Handle sections
                    if (sectionsParam != null) {

                        Map<String, Object> sections =
                            (Map<String, Object>) JSON.deserializeUntyped(sectionsParam);

                        showShiftInformation = (Boolean) sections.get('shiftInformation');
                        showIncidentRegister = (Boolean) sections.get('incidentRegister');
                        showForms = (Boolean) sections.get('forms');
                        showParticipantJournal = (Boolean) sections.get('participantJournal');
                        showActivityLogs = (Boolean) sections.get('activityLogs');
                        showServicesDelivered = (Boolean) sections.get('servicesDelivered');
                        showReimbursements = (Boolean) sections.get('reimbursements');
                        showShiftNotes = (Boolean) sections.get('shiftNotes');
                        showChecklist = (Boolean) sections.get('Checklist');
                        showSignature = (Boolean) sections.get('Signature');

                    } else {
                        // 🔥 fallback → show all sections (important safety)
                        showShiftInformation = true;
                        showIncidentRegister = true;
                        showForms = true;
                        showParticipantJournal = true;
                        showActivityLogs = true;
                        showServicesDelivered = true;
                        showReimbursements = true;
                        showShiftNotes = true;
                        showChecklist = true;
                        showSignature = true;
                    }
                }
            }
        }


    public static  String cleanHtml(String input) {
        if (input == null) return '';
        return input.replaceAll('<[^>]*>', '');
    }
    public  static  String getParticipants(List<Services_and_Support_Plan__c> plans) {
        if (plans == null || plans.isEmpty()) return '';

        List<String> names = new List<String>();

        for (Services_and_Support_Plan__c p : plans) {
            if (p.Participant_Name__c != null) {
                names.add(p.Participant_Name__c);
            }
        }

        return String.join(names, ', ');
    }  

    }