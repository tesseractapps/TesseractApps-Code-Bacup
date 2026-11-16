public class SmartReportsHandler {
        
    @AuraEnabled
    public static List<Facility_Role__c> getRolesByFacilities(List<Id> facilityIds) {

        if (facilityIds == null || facilityIds.isEmpty()) {
            return new List<Facility_Role__c>();
        }

        return [
            SELECT Id, Role_Name__c, Facility__c, Is_Active__c
            FROM Facility_Role__c
            WHERE Facility__c IN :facilityIds AND Is_Active__c = true
            ORDER BY Role_Name__c
        ];
    }

    @AuraEnabled
    public static List<Staff__c> getStaffByFacilityAndRoles( Id facilityId, List<String> roleNames, String employmentType ) {

        if (facilityId == null) {
            return new List<Staff__c>();
        }

        /* =====================================================
        * Logged in user's organisation
        * ===================================================== */
        User u = [
            SELECT Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        Id orgId = [
            SELECT Id
            FROM Organisation__c
            WHERE Name = :u.Organization_Name__c
            LIMIT 1
        ].Id;


        Boolean hasRoles =
            roleNames != null && !roleNames.isEmpty();

        Boolean filterEmployment =
            String.isNotBlank(employmentType) &&
            employmentType != 'All';


        /* =====================================================
        * Base query
        * ===================================================== */
        String soql =
            'SELECT Id, Name, Email_Address__c, State__c, Status__c, Display_Nickname__c ' +
            'FROM Staff__c ' +
            'WHERE Facility__r.Organisation__c = :orgId ' +
            'AND Status__c = true ' +
            'AND Id IN ( ' +
            '   SELECT Staff__c ' +
            '   FROM Staff_Facility__c ' +
            '   WHERE Facility__c = :facilityId ' +
            ')';


        /* =====================================================
        * Employment type filter
        * ===================================================== */
        if (filterEmployment) {

            if (employmentType == 'Full-time and part-time') {

                soql +=
                    ' AND Type_of_Job__c IN (\'Full-time\', \'Part-time\')';

            } else {

                soql +=
                    ' AND Type_of_Job__c = :employmentType';
            }
        }


        /* =====================================================
        * Role filter
        * ===================================================== */
        if (hasRoles) {

            soql +=
                ' AND Id IN ( ' +
                '   SELECT StaffRole_To_Staff__c ' +
                '   FROM StaffRole__c ' +
                '   WHERE RoleName__c IN :roleNames ' +
                ')';
        }


        /* =====================================================
        * Sorting
        * ===================================================== */
        soql += ' ORDER BY Name';


        System.debug('FINAL STAFF QUERY => ' + soql);


        /* =====================================================
        * Execute
        * ===================================================== */
        return Database.query(soql);
    }

    @AuraEnabled
    public static List<ShiftwithStaff__c> getShiftWithSmartStaffData( List<String> role, String employmentType, String startWeekDate, String endWeekDate, String location, List<Id> facilityIds,List<Id> staffIds) {
        try {

            system.debug('role >>> '+ role);
            system.debug('employmentType >>> '+ employmentType);
            system.debug('startWeekDate >>> '+ startWeekDate);
            system.debug('endWeekDate >>> '+ endWeekDate);
            system.debug('location >>> '+ location);
            system.debug('facilityIds >>> '+ facilityIds);
            system.debug('staffIds >>> '+ staffIds);


            /* =====================================================
            *  Date conversion
            * ===================================================== */
            Date startDate = Date.valueOf(startWeekDate);
            Date endDate   = Date.valueOf(endWeekDate);

            /* =====================================================
            *  Base Query
            * ===================================================== */
            String baseQuery =
                'SELECT ' +
                    'Id, Duration__c, Address__c, Start_Date__c, Date__c, Login_Time_Formula__c, Logout_Time_Formula__c, ' +
                    'Type_of_shift__c, Status__c, Role_formula__c, ' +
                    'Staff__c, Staff_Name__c, Shift_Type__c, SignIn_Notes__c, ' +
                    'Add_Shift__c, Client_Signature__c, ' +

                    /* ---------------- Staff ---------------- */
                    'Staff__r.Display_Nickname__c, ' +
                    'Staff__r.Type_of_Job__c, ' +

                    /* ---------------- Add Shift ---------------- */
                    'Add_Shift__r.Role__c, ' +
                    'Add_Shift__r.Shift_Start_End_Time__c, ' +
                    'Add_Shift__r.Get_Facility__c, ' +
                    'Add_Shift__r.Participant_Address_checkbox__c, ' +

                    /* ---------------- Children ---------------- */
                    '(SELECT Id, Notes__c, CreatedDate FROM ShiftWithStaff_Activities__r), ' +
                    '(SELECT Id, Total_Amount__c, Comments__c, Type_of_Vehicle__c, Approval_Status__c FROM Reimbursements__r), ' +
                    '(SELECT Id, Qty__c, Start_Time_Formula__c, Service_Type_Name__c, Client__c, Participant_Name__c FROM Services_and_Support_Plans__r), ' +
                    '(SELECT Mandatory__c, Description__c, Completed__c FROM Add_Shift_Checklists__r) ' +

                'FROM ShiftwithStaff__c ' +
                'WHERE Date__c >= :startDate ' +
                'AND Date__c <= :endDate ' +
                'AND Status__c = \'Completed\' ' +
                'AND ((Shift_Facility__c != NULL AND Shift_Facility__c IN :facilityIds) ' +
                'OR (Shift_Facility__c = NULL AND Add_Shift__r.Facility__c IN :facilityIds))';


            /* =====================================================
            *  Role filter
            * ===================================================== */
            if (role != null && !role.isEmpty() && !role.contains('All')) {
                baseQuery += ' AND Role_formula__c IN :role';
            }


            /* =====================================================
            *  Employment type filter
            * ===================================================== */
            if (String.isNotBlank(employmentType) && employmentType != 'All') {

                if (employmentType == 'Full-time and part-time') {
                    baseQuery +=
                        ' AND Staff__r.Type_of_Job__c IN (\'Full-time\', \'Part-time\')';
                } else {
                    baseQuery +=
                        ' AND Staff__r.Type_of_Job__c = :employmentType';
                }
            }


            /* =====================================================
            *  Location filter
            * ===================================================== */
            if (String.isNotBlank(location) && location != 'All') {

                if (location == 'Facility') {

                    baseQuery +=
                        ' AND (Add_Shift__c = null OR Add_Shift__r.Get_Facility__c = false)';

                } else if (location == 'Participant') {

                    baseQuery +=
                        ' AND Add_Shift__c != null' +
                        ' AND Add_Shift__r.Get_Facility__c = true' +
                        ' AND Add_Shift__r.Participant_Address_checkbox__c = true';

                } else if (location == 'Other') {

                    baseQuery +=
                        ' AND Add_Shift__c != null' +
                        ' AND Add_Shift__r.Get_Facility__c = true' +
                        ' AND Add_Shift__r.Participant_Address_checkbox__c = false';
                }
            }


            /* =====================================================
            *  Staff filter
            * ===================================================== */
            system.debug('staffIds >>>>'+ staffIds);
            if (staffIds != null && staffIds.size() == 1) {
                baseQuery += ' AND Staff__c IN :staffIds';
            }



            /* =====================================================
            *  Sorting
            * ===================================================== */
            baseQuery += ' ORDER BY Date__c DESC';

            System.debug('FINAL QUERY → ' + baseQuery);


            /* =====================================================
            *  Execute
            * ===================================================== */
            List<ShiftwithStaff__c> result = Database.query(baseQuery);
            System.debug('RESULT COUNT => ' + result.size());

            return result;

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<Exported_Template__c> getTemplatesByFacility( Id facilityId, String reportType ) {
        return [
            SELECT Id, Name, Template_JSON__c
            FROM Exported_Template__c
            WHERE ExportedTemplate_To_Facility__c = :facilityId
            AND Report_Module__c = true
            AND Report_Type__c = :reportType
            ORDER BY CreatedDate DESC
        ];
    }

    @AuraEnabled
    public static Exported_Template__c createTemplate( String templateName, Id facilityId, String templateJson, Id templateId, String reportType) {
        system.debug('reportType = ' + reportType);
        system.debug('templateName = ' + templateName);
        system.debug('facilityId = ' + facilityId);
        system.debug('templateId = ' + templateId);
        system.debug('templateJson = ' + templateJson);

        if (String.isBlank(templateName)) {
            throw new AuraHandledException('Template name is required.');
        }

        // -------------------------------------------------
        // If creating a NEW template, check for duplicates
        // -------------------------------------------------
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

        // -------------------------------------------------
        // Update existing template
        // -------------------------------------------------
        if (templateId != null) {

            tpl = [
                SELECT Id
                FROM Exported_Template__c
                WHERE Id = :templateId
                LIMIT 1
            ];

            tpl.Template_JSON__c = templateJson;
            tpl.Report_Type__c = reportType;

            update tpl;

        }
        // -------------------------------------------------
        // Create new template
        // -------------------------------------------------
        else {

            tpl = new Exported_Template__c(
                Name = templateName,
                ExportedTemplate_To_Facility__c = facilityId,
                Template_JSON__c = templateJson,
                Report_Module__c = true,
                Report_Type__c = reportType
            );

            insert tpl;
        }

        return tpl;
    }
    
    public class RejectedShiftWrapper {
        @AuraEnabled public ShiftwithStaff__c shift;
        @AuraEnabled public String reassignedStaffName;
        @AuraEnabled public Datetime reassignedDate;
    }

    @AuraEnabled
    public static List<RejectedShiftWrapper> getRejectedShiftsForSmartReports(
        String startDateStr,
        String endDateStr,
        Id orgId,
        List<Id> facilityIds,
        List<Id> staffIds,
        List<String> role
    ) {

        List<RejectedShiftWrapper> result = new List<RejectedShiftWrapper>();

        if (String.isBlank(startDateStr) || String.isBlank(endDateStr)) {
            return result;
        }

        if (facilityIds == null || facilityIds.isEmpty()) {
            return result;
        }

        Date startDate = Date.valueOf(startDateStr);
        Date endDate   = Date.valueOf(endDateStr);

        Boolean applyStaffFilter = (staffIds != null && !staffIds.isEmpty());

        /* -------------------------------------------------------
        1️⃣ Build SOQL
        ------------------------------------------------------- */

        String soql =
            'SELECT Id, Staff__c, Staff__r.Email_Address__c, Staff__r.Name__c, Staff__r.Name, LastModifiedDate, Role_formula__c, ' +
            'Staff__r.NameToDisplay__c, Staff__r.Display_Nickname__c, Facility__c, ' +
            'Add_Shift__r.Start_Date__c, Add_Shift__r.Break__c, Add_Shift__r.Facility__c, Add_Shift__r.Facility__r.Name, ' +
            'Shift_Type__c, Add_Shift__r.Role__c, Add_Shift__r.Shift_Start_End_Time__c, ' +
            'Attendence__c, Add_Shift__r.Direction__r.Name, RejectedComments__c, ' +
            'Add_Shift__r.Location__Street__s, Add_Shift__r.Is_EOI__c, Add_Shift__r.Start_Time__c, ' +
            'Add_Shift__r.End_Time__c, Add_Shift__r.Public_holiday__c, Add_Shift__r.Shift_Type__c, ' +
            'Add_Shift__r.Day_Name__c, Add_Shift__r.Quantity__c, Staff__r.Set_Hours__c, ' +
            'Duration__c, Add_Shift__r.Duration__c, Set_Hours__c, Log_In_Date_Time__c, ' +
            'Log_Out_Date_Time__c, Shift_Rejected__c, Date__c, End_Date__c, SignIn_Notes__c, ' +
            'Reassigned_Shift_Id__c, ' +
            '(SELECT Id, Notes__c, CreatedDate FROM ShiftWithStaff_Activities__r), ' +
            '(SELECT Mandatory__c, Description__c, Completed__c FROM Add_Shift_Checklists__r), ' +
            '(SELECT Id, Qty__c, Start_Time_Formula__c, Service_Type_Name__c, Client__c, Participant_Name__c ' +
            ' FROM Services_and_Support_Plans__r) ' +
            'FROM ShiftwithStaff__c ' +
            'WHERE Attendence__c = false ' +
            'AND Shift_Rejected__c = true ' +
            'AND Add_Shift__r.Start_Date__c >= :startDate ' +
            'AND Add_Shift__r.Start_Date__c <= :endDate ' +
            'AND Staff__r.Facility__r.Organisation__c = :orgId ' +
            'AND ((Shift_Facility__c != NULL AND Shift_Facility__c IN :facilityIds) ' +
             'OR (Shift_Facility__c = NULL AND Add_Shift__r.Facility__c IN :facilityIds)) ';

        if (applyStaffFilter) {
            soql += 'AND Staff__c IN :staffIds ';
        }

        if (role != null && !role.isEmpty() && !role.contains('All')) {
                soql += ' AND Role_formula__c IN :role ';
            }

        soql += 'ORDER BY Add_Shift__r.Start_Date__c DESC';

        /* -------------------------------------------------------
        2️⃣ Query rejected shifts
        ------------------------------------------------------- */

        List<ShiftwithStaff__c> rejectedShifts = Database.query(soql);

        if (rejectedShifts.isEmpty()) {
            return result;
        }

        /* -------------------------------------------------------
        3️⃣ Collect reassigned shift ids
        ------------------------------------------------------- */

        Set<Id> reassignedShiftIds = new Set<Id>();

        for (ShiftwithStaff__c sws : rejectedShifts) {
            if (String.isNotBlank(sws.Reassigned_Shift_Id__c)) {
                try {
                    reassignedShiftIds.add((Id)sws.Reassigned_Shift_Id__c);
                } catch (Exception e) {
                    // ignore invalid ids
                }
            }
        }

        /* -------------------------------------------------------
        4️⃣ Query reassigned shifts
        ------------------------------------------------------- */

        Map<Id, ShiftwithStaff__c> reassignedShiftMap = new Map<Id, ShiftwithStaff__c>();

        if (!reassignedShiftIds.isEmpty()) {

            for (ShiftwithStaff__c rs : [
                SELECT Id,
                    CreatedDate,
                    Staff__r.Name,
                    Staff__r.Display_Nickname__c
                FROM ShiftwithStaff__c
                WHERE Id IN :reassignedShiftIds
            ]) {
                reassignedShiftMap.put(rs.Id, rs);
            }
        }

        /* -------------------------------------------------------
        5️⃣ Build wrapper response
        ------------------------------------------------------- */

        for (ShiftwithStaff__c sws : rejectedShifts) {

            RejectedShiftWrapper wrap = new RejectedShiftWrapper();
            wrap.shift = sws;

            if (String.isNotBlank(sws.Reassigned_Shift_Id__c)) {

                ShiftwithStaff__c reassigned =
                    reassignedShiftMap.get((Id)sws.Reassigned_Shift_Id__c);

                if (reassigned != null) {

                    wrap.reassignedStaffName =
                        reassigned.Staff__r.Display_Nickname__c != null
                            ? reassigned.Staff__r.Display_Nickname__c
                            : reassigned.Staff__r.Name;

                    wrap.reassignedDate = reassigned.CreatedDate;
                }
            }

            result.add(wrap);
        }

        return result;
    }

    @AuraEnabled
    public static List<Reimbursement__c> getAllReimbursements( String startDate, String endDate, String status, List<Id> facilityIds ) {
        Date sDate = Date.valueOf(startDate);
        Date eDate = String.isBlank(endDate) ? sDate : Date.valueOf(endDate);

        User objUser = [
            SELECT Id, Organization_Name__c, User_Type__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
        ];

        String roleName = '';
        try {
            UserRole userRole = [
                SELECT Name
                FROM UserRole
                WHERE Id = :UserInfo.getUserRoleId()
            ];
            roleName = userRole.Name;
        } catch (Exception e) {
            roleName = 'Portal Account Partner User';
        }

        String orgName = [
            SELECT Name
            FROM Organisation__c
            WHERE Name = :objUser.Organization_Name__c
            LIMIT 1
        ].Name;

        String userEmail = UserInfo.getUserEmail();
        String userType  = objUser.User_Type__c;
        String userId    = UserInfo.getUserId();

        Set<Id> facilityIdSet = new Set<Id>();

        if (userType != 'NDIS Org Admin' && roleName != 'Portal Account Partner User') {

            List<Facility_Association__c> facAssociation =
                PortalUserController.getFacilityUserWise(userId, userType);

            for (Facility_Association__c fa : facAssociation) {
                if (fa.Facility__c != null) {
                    facilityIdSet.add(fa.Facility__c);
                }
            }
        }

        String query =
            'SELECT ' +
                'Id, Name, ShiftwithStaff__c, Others__c, Comments__c, ' +
                'ShiftwithStaff__r.Staff__r.NameToDisplay__c, ' +
                'Mileage_Amount__c, ' +
                'ShiftwithStaff__r.Add_Shift__r.Facility__c, ' +
                'ShiftwithStaff__r.Staff__r.picture__c, ' +
                'Amazon_file_URL__c, Shift_Login_Time__c, Shift_Logout_Time__c, ' +
                'Approval_Status__c, Amount__c, Mileage_Others__c, Cost_per_KM__c, ' +
                'Total_Amount__c, Fuel_Electric_Price__c, ' +
                'Approval_user__c, Approver_Comments__c, ShiftDate__c, ' +
                'Shift_Login_time_formula__c, Shift_log_out_time_formula__c, ' +
                'LastModifiedDate, Approved_Date__c, Type_of_Vehicle__c, ' +
                'ShiftwithStaff__r.Id ' +
            'FROM Reimbursement__c ' +
            'WHERE Organisation_Name__c = :orgName ' +
            'AND ShiftwithStaff__r.Add_Shift__r.Start_Date__c >= :sDate ' +
            'AND ShiftwithStaff__r.Add_Shift__r.Start_Date__c <= :eDate ' +
            'AND ((ShiftwithStaff__r.Shift_Facility__c != NULL AND ShiftwithStaff__r.Shift_Facility__c IN :facilityIds) ' +
             'OR (ShiftwithStaff__r.Shift_Facility__c = NULL AND ShiftwithStaff__r.Add_Shift__r.Facility__c IN :facilityIds)) ';

        /* -------------------------
        User / facility filter
        ------------------------- */

        if (roleName == 'Portal Account Partner User') {

            query +=
                'AND ShiftwithStaff__r.Staff__r.Email_Address__c = :userEmail ';

        } else if (userType != 'NDIS Org Admin') {

                if (!facilityIdSet.isEmpty()) {

                    query +=
                        'AND ((ShiftwithStaff__r.Shift_Facility__c != NULL AND ShiftwithStaff__r.Shift_Facility__c IN :facilityIdSet) ' +
                        'OR (ShiftwithStaff__r.Shift_Facility__c = NULL AND ShiftwithStaff__r.Add_Shift__r.Facility__c IN :facilityIdSet)) ';

                } else {
                    return new List<Reimbursement__c>();
                }
            }
                    /* -------------------------
        Status filter
        ------------------------- */

        if (!String.isBlank(status) && status != 'All') {

            System.debug('status in getAllReimbursements (filter) => ' + status);

            query +=
                'AND Approval_Status__c = :status ';

        } else if (status == 'All') {

            query +=
                'AND Approval_Status__c IN (\'Pending\', \'Approved\', \'Rejected\') ';
        }

        System.debug('status in getAllReimbursements final => ' + status);

        /* -------------------------
        Sorting
        ------------------------- */

        query +=
            'ORDER BY LastModifiedDate DESC';

        System.debug('FINAL QUERY => ' + query);

        return Database.query(query);
    }

    @AuraEnabled
    public static List<Staff__c> fetchStaffs(
        List<Id> facilityIds,
        String status,
        String employmentType,
        List<Id> staffIds,
        List<String> roleNames
    ) {

        System.debug('facilityIds => ' + facilityIds);
        System.debug('status => ' + status);
        System.debug('employmentType => ' + employmentType);

        if (facilityIds == null || facilityIds.isEmpty()) {
            return new List<Staff__c>();
        }

        String soql =
            'SELECT Id, Name, Email_Address__c, State__c, ' +
            'Status__c, Display_Nickname__c, Contact_Number__c, ' +
            'Gender__c, Date_Of_Birth__c, Type_of_Job__c ' +
            'FROM Staff__c ' +
            'WHERE Id IN ( ' +
            '   SELECT Staff__c FROM Staff_Facility__c ' +
            '   WHERE Facility__c IN :facilityIds ' +
            ')';

        // ---------------- Staff filter ----------------
        if (staffIds != null && !staffIds.isEmpty()) {
            soql += ' AND Id IN :staffIds';
        }

        // ---------------- Role filter ----------------
        if (roleNames != null && !roleNames.isEmpty()) {
            soql +=
                ' AND Id IN ( ' +
                '   SELECT StaffRole_To_Staff__c ' +
                '   FROM StaffRole__c ' +
                '   WHERE RoleName__c IN :roleNames ' +
                ')';
        }

        // ---------------- Employment filter ----------------
        if (String.isNotBlank(employmentType) && employmentType != 'All') {

            if (employmentType == 'Full-time and part-time') {
                soql +=
                    ' AND Type_of_Job__c IN (\'Full-time\', \'Part-time\')';
            } else {
                soql +=
                    ' AND Type_of_Job__c = :employmentType';
            }
        }

        // ---------------- Status filter (Boolean conversion) ----------------
        if (String.isNotBlank(status) && status != 'All') {

            Boolean statusValue;

            if (status.equalsIgnoreCase('Active')) {
                statusValue = true;
            } else if (status.equalsIgnoreCase('Inactive')) {
                statusValue = false;
            }

            if (statusValue != null) {
                soql += ' AND Status__c = :statusValue';
            }
        }

        System.debug('FINAL SOQL => ' + soql);

        return Database.query(soql);
    }

    @AuraEnabled
    public static List<Client__c> fetchFacilitiess(
        List<Id> facilityIds,
        String status
    ) {

        System.debug('facilityIds => ' + facilityIds);
        System.debug('status => ' + status);

        if (facilityIds == null || facilityIds.isEmpty()) {
            return new List<Client__c>();
        }

        String query =
            'SELECT Id, Name__c, Facility__r.Name, AddressData__c, Prefer_Nickname__c, Email__c, Gendar__c, ' +
            'Display_Nickname__c, Facility__r.Type_of_Service__c, ParticipantType__c, ' +
            'Facility__r.Status__c, Company__c, Organization_Name__c, Picture__c, Name, ' +
            'First_Name__c, Last_Name__c, Facility__c, Status__c, Contact_Number__c, ' +
            'Address__Street__s, Address__City__s, Address__StateCode__s, ' +
            'Address__CountryCode__s, Address__PostalCode__s, Facility__r.Organisation__c, ' +
            'Participant_Status__c, ' +
            '(SELECT Id, Facility__c, Facility__r.Name, Active__c, Participant__c ' +
            ' FROM Participant_Facilities__r ' +
            ' WHERE Active__c = true AND Facility__c IN :facilityIds) ' +
            'FROM Client__c ' +
            'WHERE Facility__c IN :facilityIds ';

        // 🔥 Convert String → Boolean
        if (String.isNotBlank(status) && status != 'All') {

            Boolean statusValue;

            if (status.equalsIgnoreCase('Active')) {
                statusValue = true;
            } 
            else if (status.equalsIgnoreCase('Inactive')) {
                statusValue = false;
            }

            if (statusValue != null) {
                query += ' AND Status__c = :statusValue';
            }
        }

        return Database.query(query);
    }

    @AuraEnabled
    public static List<StaffUtilizationData> getStaffUtilizationData(
        String facility,
        List<String> role,
        String employmentType,
        String startWeekDate,
        String endWeekDate
    ) {

        try {

            Id currentUserId = UserInfo.getUserId();
            System.debug('Current User ID: ' + currentUserId);

            List<User> userOrgName = [
                SELECT Id, Organization_Name__c, User_Type__c
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

            if (organisationList.isEmpty()) {
                throw new AuraHandledException('Organisation not found');
            }

            if (!Pattern.matches('\\d{4}-\\d{2}-\\d{2}', startWeekDate)
                || !Pattern.matches('\\d{4}-\\d{2}-\\d{2}', endWeekDate)) {
                throw new AuraHandledException('Date format must be yyyy-MM-dd');
            }

            Date startDate = Date.valueOf(startWeekDate);
            Date endDate   = Date.valueOf(endWeekDate);

            Integer numberOfDays = 0;
            for (Date d = startDate; d <= endDate; d = d.addDays(1)) {
                Integer dow = Integer.valueOf(
                    DateTime.newInstance(d, Time.newInstance(0, 0, 0, 0)).format('u')
                );
                if (dow != 6 && dow != 7) {
                    numberOfDays++;
                }
            }

            List<Staff__c> staffList = new List<Staff__c>();

            if (userOrgName[0].User_Type__c == 'NDIS Org Admin') {

                staffList = [
                    SELECT
                        Id,
                        Name,
                        Display_Nickname__c,
                        Set_Hours__c,
                        Class_and_Paypont__c,
                        Facility__c,
                        Role__c,
                        Type_of_Job__c,
                        Facility__r.Organisation__c,
                        (
                            SELECT
                                Id,
                                Duration__c,
                                Status__c,
                                Start_Date__c,
                                Day_Name__c
                            FROM ShiftwithStaffs__r
                            WHERE Date__c >= :startDate
                              AND Date__c <= :endDate
                              AND Day_Name__c != 'Sunday'
                              AND Day_Name__c != 'Saturday'
                        )
                    FROM Staff__c
                    WHERE Facility__r.Organisation__c = :organisationList[0].Id
                    ORDER BY Name ASC
                ];

            } else {

                List<Facility_Association__c> facilityAssociation = [
                    SELECT Facility__c
                    FROM Facility_Association__c
                    WHERE User__c = :userOrgName[0].Id
                      AND Active__c = true
                ];

                Set<Id> facilityIds = new Set<Id>();
                for (Facility_Association__c assoc : facilityAssociation) {
                    if (assoc.Facility__c != null) {
                        facilityIds.add(assoc.Facility__c);
                    }
                }

                if (!facilityIds.isEmpty()) {

                    staffList = [
                        SELECT
                            Id,
                            Name,
                            Display_Nickname__c,
                            Set_Hours__c,
                            Class_and_Paypont__c,
                            Facility__c,
                            Role__c,
                            Type_of_Job__c,
                            Facility__r.Organisation__c,
                            (
                                SELECT
                                    Id,
                                    Duration__c,
                                    Status__c,
                                    Start_Date__c,
                                    Day_Name__c
                                FROM ShiftwithStaffs__r
                                WHERE Date__c >= :startDate
                                  AND Date__c <= :endDate
                                  AND Day_Name__c != 'Sunday'
                                  AND Day_Name__c != 'Saturday'
                            )
                        FROM Staff__c
                        WHERE Facility__c IN :facilityIds
                        ORDER BY Name ASC
                    ];

                } else {
                    staffList = new List<Staff__c>();
                }
            }

            List<Staff__c> filteredList = new List<Staff__c>();

            for (Staff__c staff : staffList) {

                Boolean matches = true;

                if (String.isNotBlank(facility)
                    && facility != 'All'
                    && staff.Facility__c != facility) {

                    matches = false;
                }

                // -------- Role filter (multi select list) --------
                if (role != null && !role.isEmpty() && !role.contains('All')) {

                    if (String.isBlank(staff.Role__c)) {
                        matches = false;
                    } else {

                        Boolean roleMatch = false;
                        List<String> staffRoles = staff.Role__c.split(';');

                        for (String r : role) {
                            for (String sr : staffRoles) {
                                if (sr.trim().equalsIgnoreCase(r)) {
                                    roleMatch = true;
                                    break;
                                }
                            }
                            if (roleMatch) break;
                        }

                        if (!roleMatch) {
                            matches = false;
                        }
                    }
                }

                if (String.isNotBlank(employmentType)
                    && employmentType != 'All'
                    && staff.Type_of_Job__c != employmentType) {

                    matches = false;
                }

                if (matches) {
                    filteredList.add(staff);
                }
            }

            List<StaffUtilizationData> transformedData =
                new List<StaffUtilizationData>();

            for (Staff__c staff : filteredList) {
                transformedData.add(
                    transformStaffRecord(staff, numberOfDays)
                );
            }

            // ✅ ONLY StaffUtilizationData is returned
            return transformedData;

        } catch (Exception e) {
            throw new AuraHandledException(
                'Error fetching staff data: ' + e.getMessage()
            );
        }
    }

    private static StaffUtilizationData transformStaffRecord(
        Staff__c staff,
        Integer numberOfDays
    ) {

        StaffUtilizationData data = new StaffUtilizationData();

        data.id   = staff.Id;
        data.name = staff.Display_Nickname__c;

        Decimal baseSetHours =
            staff.Set_Hours__c != null ? staff.Set_Hours__c : 0;

        Decimal calculatedSetHours =
            (baseSetHours / 5) * numberOfDays;

        data.setHours =
            calculatedSetHours.setScale(2, RoundingMode.HALF_UP);

        data.staffClass     = 'N/A';
        data.rosteredHours  = 0;
        data.completedHours = 0;
        data.rhVariance     = 0;
        data.chVariance     = 0;

        Decimal totalRostered  = 0;
        Decimal totalCompleted = 0;

        if (staff.ShiftwithStaffs__r != null
            && !staff.ShiftwithStaffs__r.isEmpty()) {

            for (ShiftwithStaff__c shift : staff.ShiftwithStaffs__r) {

                if (shift.Duration__c != null) {

                    Decimal duration = shift.Duration__c;
                    totalRostered += duration;

                    if (shift.Status__c == 'Completed') {
                        totalCompleted += duration;
                    }
                }
            }
        }

        data.rosteredHours =
            totalRostered.setScale(2, RoundingMode.HALF_UP);

        data.completedHours =
            totalCompleted.setScale(2, RoundingMode.HALF_UP);

        data.classNumber = staff.Class_and_Paypont__c;

        if (totalRostered < data.setHours) {
            data.status = 'Under Rostered';
        } else if (totalRostered > data.setHours) {
            data.status = 'Over Rostered';
        } else {
            data.status = 'Fully Rostered';
        }

        data.rhVariance =
            (totalRostered - data.setHours)
                .setScale(2, RoundingMode.HALF_UP);

        data.chVariance =
            (totalCompleted - data.setHours)
                .setScale(2, RoundingMode.HALF_UP);

        return data;
    }

    public class StaffUtilizationData {
        @AuraEnabled public String  id { get; set; }
        @AuraEnabled public String  name { get; set; }
        @AuraEnabled public String  staffClass { get; set; }
        @AuraEnabled public String  classNumber { get; set; }
        @AuraEnabled public Decimal setHours { get; set; }
        @AuraEnabled public Decimal rosteredHours { get; set; }
        @AuraEnabled public Decimal completedHours { get; set; }
        @AuraEnabled public Decimal rhVariance { get; set; }
        @AuraEnabled public Decimal chVariance { get; set; }
        @AuraEnabled public String  status { get; set; }
    }

    @AuraEnabled
    public static void createFavorite(
        Id facilityId,
        String reportType,
        String filterKey,
        String filtersJson
    ) {

        Favorite_Report__c fav = new Favorite_Report__c();
        fav.Report_Type__c = reportType;
        fav.Filter_Key__c = filterKey;
        fav.Filters_JSON__c = filtersJson;
        fav.Facility__c = facilityId;

        insert fav;
    }

    @AuraEnabled
    public static void deleteFavorite(Id favoriteId) {
        delete [SELECT Id FROM Favorite_Report__c WHERE Id = :favoriteId];
    }

    @AuraEnabled
    public static Id createShiftReportLog(
        String startDate,
        String endDate,
        Id facilityId,
        String exportType,
        String reportType,
        String selectedDateRange,
        String filtersJson,
        String filterKey
    ) {
        try {

            System.debug('========== createShiftReportLog START ==========');

            Date parsedStartDate;
            Date parsedEndDate;

            if (!String.isBlank(startDate)) {
                parsedStartDate = Date.valueOf(startDate);
            }

            if (!String.isBlank(endDate)) {
                parsedEndDate = Date.valueOf(endDate);
            }

            Report_Export_Log__c log = new Report_Export_Log__c();

            if (parsedStartDate != null) {
                log.Start_Date__c = parsedStartDate;
            }

            if (parsedEndDate != null) {
                log.End_Date__c = parsedEndDate;
            }

            if (facilityId != null) {
                log.Facility__c = facilityId;
            }

            if (!String.isBlank(exportType)) {
                log.Export_Type__c = exportType;
            }

            if (!String.isBlank(reportType)) {
                log.Report_Type__c = reportType;
            }

            if (!String.isBlank(selectedDateRange)) {
                log.Date_Range__c = selectedDateRange;
            }

            if (!String.isBlank(filtersJson)) {
                log.Filters_JSON__c = filtersJson;
            }

            if (!String.isBlank(filterKey)) {
                log.Filter_Key__c = filterKey;
            }

            log.Exported_On__c = System.now();

            insert log;

            System.debug('✅ Report export log created: ' + log.Id);

            return log.Id; // ✅ RETURN ID

        } catch (Exception e) {

            System.debug('❌ Failed to create report export log: ' + e.getMessage());

            throw new AuraHandledException(
                'Unable to log report export: ' + e.getMessage()
            );
        }
    }

    @AuraEnabled
    public static Id updateShiftReportLog(Id exportId, Boolean isCompleted) {
        try {

            System.debug('========== Update Shift Report Log START ==========');
            System.debug('Export Id => ' + exportId);
            System.debug('Is Completed => ' + isCompleted);

            if (exportId == null) {
                throw new AuraHandledException('Export Id cannot be null');
            }

            Report_Export_Log__c log = [
                SELECT Id, Exported_On__c,Favourite__c
                FROM Report_Export_Log__c
                WHERE Id = :exportId
                LIMIT 1
            ];

            log.Favourite__c = isCompleted;

            update log;

            System.debug('✅ Report export log updated: ' + log.Id);

            return log.Id;

        } catch (Exception e) {

            System.debug('❌ Failed to update report export log: ' + e.getMessage());

            throw new AuraHandledException(
                'Unable to update report export: ' + e.getMessage()
            );
        }
    }

    @AuraEnabled
    public static List<Report_Export_Log__c> getFavoriteReports(Id facilityId) {

        List<Report_Export_Log__c> logList = [
            SELECT Id,
                Start_Date__c,
                End_Date__c,
                Export_Type__c,
                Report_Type__c,
                Exported_On__c,
                Date_Range__c,
                Filter_Key__c,
                Filters_JSON__c,
                CreatedDate,
                Favourite__c,
                CreatedBy.FirstName,
                CreatedBy.LastName
            FROM Report_Export_Log__c
            WHERE Facility__c = :facilityId 
            AND Favourite__c = true
            ORDER BY CreatedDate DESC
        ];

        return logList;
    }

    // Wrapper class
    public class ReportLogResponse {
        @AuraEnabled public List<Report_Export_Log__c> logs;
        @AuraEnabled public Integer totalCount;

        public ReportLogResponse(List<Report_Export_Log__c> logs, Integer totalCount) {
            this.logs = logs;
            this.totalCount = totalCount;
        }
    }

    @AuraEnabled
    public static ReportLogResponse getReportExportLogs(Id facilityId) {

        // Last 5 records
        List<Report_Export_Log__c> logList = [
            SELECT Id,
                Start_Date__c,
                End_Date__c,
                Export_Type__c,
                Report_Type__c,
                Exported_On__c,
                Date_Range__c,
                Filter_Key__c,
                Filters_JSON__c,
                CreatedDate,
                Favourite__c,
                CreatedBy.FirstName,
                CreatedBy.LastName
            FROM Report_Export_Log__c
            WHERE Facility__c = :facilityId
            ORDER BY CreatedDate DESC
        ];

        // Total count
        Integer totalRecords = [
            SELECT COUNT()
            FROM Report_Export_Log__c
            WHERE Facility__c = :facilityId
        ];

        return new ReportLogResponse(logList, totalRecords);
    }

    @AuraEnabled
    public static List<Report_Export_Log__c> getAllReportExportLogs(Id facilityId) {

        return [
            SELECT Id,
                Start_Date__c,
                End_Date__c,
                Export_Type__c,
                Report_Type__c,
                Exported_On__c,
                Date_Range__c,
                CreatedDate,
                CreatedBy.FirstName,
                CreatedBy.LastName
            FROM Report_Export_Log__c
            WHERE Facility__c = :facilityId
            ORDER BY CreatedDate DESC
        ];
    }

    @AuraEnabled
    public static String processStaffSelection(Id staffId) {

        System.debug('Received Staff Id: ' + staffId);

        List<StaffRole__c> roles = [
            SELECT Id, StaffRole_To_Staff__c, Active__c, RoleName__c
            FROM StaffRole__c
            WHERE StaffRole_To_Staff__c = :staffId
        ];

        if (roles.isEmpty()) {
            return 'No roles found';
        }

        return 'Found ' + roles.size() + ' role(s)';
    }

    @AuraEnabled
    public static List<Staff__c> sendFacilityToApex(List<Id> facilityIds) {

        System.debug('Received Facility Ids: ' + facilityIds);

        if (facilityIds == null || facilityIds.isEmpty()) {
            return new List<Staff__c>();
        }

        List<Staff__c> staffList = [
            SELECT Id, Name, Email_Address__c, State__c, Status__c, Display_Nickname__c
            FROM Staff__c
            WHERE Status__c = true
            AND Id IN (
                SELECT Staff__c
                FROM Staff_Facility__c
                WHERE Facility__c IN :facilityIds
            )
        ];

        return staffList;
    }

    @AuraEnabled
    public static List<Client__c> sendFacilityToApexforParticipant(List<Id> facilityIds) {

        System.debug('Received Facility Ids: ' + facilityIds);

        if (facilityIds == null || facilityIds.isEmpty()) {
            return new List<Client__c>();
        }

        List<Client__c> participantList = [
            SELECT Id, Name
            FROM Client__c
            WHERE Status__c = true
            AND Id IN (
                SELECT Participant__c
                FROM Participant_Facility__c
                WHERE Facility__c IN :facilityIds
            )
        ];

        return participantList;
    }

    @AuraEnabled
    public static List<Services_and_Support_Plan__c> getParticipantServiceDeliveryReport(
        List<Id> facilityIds,
        List<Id> participantIds,
        Date startDate,
        Date endDate
    ) {

        System.debug('facilityIds => ' + facilityIds);
        System.debug('participantIds => ' + participantIds);
        System.debug('startDate => ' + startDate);
        System.debug('endDate => ' + endDate);

        String query =
            'SELECT ' +
            'Id,' +
            'Participant_Name__c,' +
            'Client__c,' +
            'Date_of_Service__c,' +
            'Start_Time_Formula__c,' +
            'End_Time_Formula__c,' +
            'Qty__c,' +
            'Service_Type_Name__c,' +
            'Support_Item_Name__c,' +
            'Resource_Name__c,' +
            'ShiftwithStaff__c,' +
            'ShiftwithStaff__r.Id,' +
            'ShiftwithStaff__r.Facility__c,' +
            'ShiftwithStaff__r.Status__c,' +
            'ShiftwithStaff__r.Shift_Rejected__c,'+
            'ShiftwithStaff__r.Add_Shift__r.Facility__c ' +
            'FROM Services_and_Support_Plan__c ' +
            'WHERE Date_of_Service__c >= :startDate ' +
            'AND Date_of_Service__c <= :endDate';

        if (participantIds != null && !participantIds.isEmpty()) {
            query += ' AND Client__c IN :participantIds';
        }

       if (facilityIds != null && !facilityIds.isEmpty()) {
                query +=
                    ' AND ((ShiftwithStaff__r.Shift_Facility__c != NULL AND ShiftwithStaff__r.Shift_Facility__c IN :facilityIds) ' +
                    'OR (ShiftwithStaff__r.Shift_Facility__c = NULL AND ShiftwithStaff__r.Add_Shift__r.Facility__c IN :facilityIds))';
            }

        // Sort by date, then by start time
        query += ' ORDER BY Date_of_Service__c ASC, Start_Time_Formula__c ASC';

        System.debug('Query ==> ' + query);

        List<Services_and_Support_Plan__c> servicePlans =
            Database.query(query);

        System.debug('Records Found ==> ' + servicePlans.size());

        return servicePlans;
    }

    // In SmartReportsHandler.cls - update sendReportEmail method
    @AuraEnabled
    public static String sendReportEmail(String base64Data, String fileName, String toAddress, String ccAddress, String subject, String body, String exportType) {
        try {
            // Check if single email is enabled
            Boolean hasPermission = FeatureManagement.checkPermission('SendEmail');
            
            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
            
            // 🔥 FIX: Use setToAddresses instead of setToAddress
            if (String.isNotBlank(toAddress)) {
                mail.setToAddresses(new List<String>{toAddress});
            }
            
            if (String.isNotBlank(ccAddress)) {
                mail.setCcAddresses(new List<String>{ccAddress});
            }
            
            mail.setSubject(subject);
            mail.setPlainTextBody(body);
            
            // 🔥 FIX: Use setFileAttachments for base64 data
            if (String.isNotBlank(base64Data)) {
                // Decode base64 to blob
                Blob fileBlob = EncodingUtil.base64Decode(base64Data);
                Messaging.EmailFileAttachment attachment = new Messaging.EmailFileAttachment();
                attachment.setFileName(fileName);
                attachment.setBody(fileBlob);
                attachment.setContentType(exportType == 'PDF' ? 'application/pdf' : 'text/csv');
                mail.setFileAttachments(new List<Messaging.EmailFileAttachment>{attachment});
            }
            
            // 🔥 FIX: Use org-wide email address or set to false for single email
            mail.setUseSignature(false);
            
            // Try sending
            Messaging.sendEmail(new Messaging.SingleEmailMessage[]{mail});
            return 'Email sent successfully';
            
        } catch (Exception e) {
            System.debug('Error sending email: ' + e.getMessage());
            throw new AuraHandledException('Failed to send email: ' + e.getMessage());
        }
    }


@AuraEnabled
public static Map<String, Object> getGrossProfitMarginReport(List<Id> facilityIds, List<Id> participantIds, List<Id> staffIds, List<String> shiftTypes, Date startDate, Date endDate) {
    System.debug('===== getGrossProfitMarginReport START =====');
    System.debug('facilityId     : ' + facilityIds);
    System.debug('participantIds : ' + participantIds);
    System.debug('startDate      : ' + startDate);
    System.debug('endDate        : ' + endDate);

    // =========================================================
    // VALIDATION
    // =========================================================

    if (facilityIds == null) {
        throw new AuraHandledException('Facility is required.');
    }

    if (startDate == null || endDate == null) {
        throw new AuraHandledException(
            'Start date and end date are required.'
        );
    }

    if (startDate > endDate) {
        throw new AuraHandledException(
            'Start date cannot be greater than end date.'
        );
    }



    // =========================================================
    // PARTICIPANT FILTER
    // =========================================================

    Set<Id> selectedParticipantIds = new Set<Id>();

    if (participantIds != null) {
        for (Id participantId : participantIds) {
            if (participantId != null) {
                selectedParticipantIds.add(participantId);
            }
        }
    }

    Boolean participantFilterApplied =!selectedParticipantIds.isEmpty();

    System.debug( 'participantFilterApplied = ' + participantFilterApplied );

    // =========================================================
    // STAFF FILTER
    // =========================================================

    Set<Id> selectedStaffIds = new Set<Id>();

    if (staffIds != null) {
        for (Id staffId : staffIds) {
            if (staffId != null) {
                selectedStaffIds.add(staffId);
            }
        }
    }

    Boolean staffFilterApplied = !selectedStaffIds.isEmpty();


    // =========================================================
    // SHIFT TYPE FILTER
    // =========================================================

    Set<String> selectedShiftTypes = new Set<String>();

    if (shiftTypes != null) {
        for (String shiftType : shiftTypes) {
            if (!String.isBlank(shiftType)) {
                selectedShiftTypes.add(shiftType.trim());
            }
        }
    }

    Boolean shiftTypeFilterApplied = !selectedShiftTypes.isEmpty();

    System.debug('selectedStaffIds = ' + selectedStaffIds);
    System.debug('selectedShiftTypes = ' + selectedShiftTypes);

   

    String shiftQuery =
    'SELECT ' +
        'Id, ' +
        'Staff__c, ' +
        'Staff__r.Name, ' +
        'Staff__r.Display_Nickname__c, ' +
        'Facility__c, ' +
        'Add_Shift__c, ' +
        'Add_Shift__r.Start_Date__c, ' +
        'Add_Shift__r.Facility__c, ' +
        'Add_Shift__r.Status__c, ' +
        'Add_Shift__r.Shift_Type__c, ' +
        'Add_Shift__r.Duration__c, ' +
        'Add_Shift__r.Start_Time__c, ' +
        'Add_Shift__r.End_Time__c, ' +
        'Actual_Duration__c, ' +
        'End_Date__c, ' +
        'Staff_Final_Hourly_Rate__c, ' +
        'Sleepover_Shift_Hours__c, ' +
        'Sleepover_Shift_Hourly_Rate__c, ' +
        'Broken_Shift_Allowance__c, ' +
        'Broken_Extended_Duration__c, ' +
        'Broken_Extended_Rate__c, ' +
        'Variance_Rate__c, ' +
        'Extended_Duration__c, ' +
        'Over_Time_Tier_One__c, ' +
        'Over_Time_Tier_One_Rate__c, ' +
        'Over_Time_Tier_Two__c, ' +
        'Over_Time_Tier_Two_Rate__c, ' +
        'Long_Morning_Shift_Duartion__c, ' +
        'Long_Morning_Hourly_Rate__c, ' +
        'Long_Morning_Rate_Two__c, ' +
        'Long_Morning_Duartion_Two__c, ' +
        'Long_Afternoon_Hourly_Rate__c, ' +
        'Long_Afternoon_Shift_Duartion__c, ' +
        'Long_Afternoon_Rate_Two__c, ' +
        'Long_Afternoon_Duration_Two__c, ' +
        'Long_Night_Hourly_Rate__c, ' +
        'Long_Night_Shift_Duartion__c, ' +
        'Long_Sleepover_Allowance__c, ' +
        'Long_Sleepover_Duartion__c, ' +
        'Shift_Type__c,Sleepover_Night_Shift_Hourly_Rate__c,Broken_Shift__c, ' +
        'Shift_Category__c, ' +
        'Attendence__c, ' +
        'Date__c, ' +
        'Shift_Wage__c, ' +
        'Duration__c, ' +
        'Status__c ' +
    'FROM ShiftwithStaff__c ' +
    'WHERE Date__c >= :startDate ' +
    'AND Date__c <= :endDate ' +
    'AND ( ' +
        '(Shift_Facility__c != NULL ' +
            'AND Shift_Facility__c IN :facilityIds) ' +
        'OR ' +
        '(Shift_Facility__c = NULL ' +
            'AND Add_Shift__r.Facility__c IN :facilityIds) ' +
    ') ' +
    'AND Status__c IN (\'Completed\', \'Cancelled\', \'Unassigned\') ';

    if (!selectedStaffIds.isEmpty()) {
        shiftQuery += 'AND Staff__c IN :selectedStaffIds ';
    }

    if (!selectedShiftTypes.isEmpty()) {
        shiftQuery +=
            'AND ( ' +
                'Shift_Category__c IN :selectedShiftTypes ' +
            ') ';
    }

    List<ShiftwithStaff__c> shiftList = Database.query(shiftQuery);

    System.debug(
        'Completed shifts found = ' +
        shiftList.size()
    );

    // =========================================================
    // NO SHIFT DATA
    // =========================================================

    if (shiftList.isEmpty()) {
        return buildEmptyGrossProfitReport(
            facilityIds,
            startDate,
            endDate,
            selectedParticipantIds
        );
    }

    // =========================================================
    // SHIFT MAP
    // =========================================================

    Map<Id, ShiftwithStaff__c> shiftMap = new Map<Id, ShiftwithStaff__c>(shiftList);

    Set<Id> shiftIds = shiftMap.keySet();

    // =========================================================
    // 2. GET SERVICES FOR THE SHIFTS
    // =========================================================

    List<Services_and_Support_Plan__c> serviceList = [
        SELECT
            Id,
            Services__c,
            Services_name__c,
            Service_Type__c,
            Qty__c,Bill_Participant__c,
            Amount__c,
            Edited_Unit_Price__c,
            Date_of_Service__c,
            Client__c,
            Participant_Name__c,
            Status__c,
            ShiftwithStaff__c,
            Un_Assigned_Service__c,
            Start_Time_Formula__c
        FROM Services_and_Support_Plan__c
        WHERE ShiftwithStaff__c IN :shiftIds
        AND Date_of_Service__c >= :startDate
        AND Date_of_Service__c <= :endDate
    ];

    System.debug( 'Services found = ' +serviceList.size() );

    // =========================================================
    // 3. INITIALIZE TOTALS
    // =========================================================

    Decimal deliveredRecognisedBilling = 0;
    Decimal recognisedCancellationRevenue = 0;
    Decimal otherRecognisedServiceRevenue = 0;

    Decimal ordinaryStaffCost = 0;
    Decimal overtimeCost = 0;
    Decimal penaltyCost = 0;
    Decimal sleepoverCost = 0;
    Decimal brokenShiftCost = 0;
    Decimal minimumEngagementCost = 0;
    Decimal reimbursementCost = 0;

    // =========================================================
    // PARTICIPANT MAPS
    // =========================================================

    Map<Id, Decimal> participantRevenueMap =new Map<Id, Decimal>();

    Map<Id, Decimal> participantCostMap = new Map<Id, Decimal>();

    Map<Id, String> participantNameMap =new Map<Id, String>();

    // =========================================================
    // SERVICE MAPS
    // =========================================================

    Map<String, Decimal> serviceRevenueMap = new Map<String, Decimal>();

    Map<String, Decimal> serviceCostMap = new Map<String, Decimal>();

    // =========================================================
    // SHIFT REVENUE MAPS
    // =========================================================

    /*
     * Revenue for ALL participants on each shift.
     */
    Map<Id, Decimal> allShiftRevenueMap = new Map<Id, Decimal>();

    /*
     * Revenue only for selected participant(s).
     */
    Map<Id, Decimal> selectedShiftRevenueMap = new Map<Id, Decimal>();

    /*
     * Shifts containing selected participant services.
     */
    Set<Id> selectedShiftIds = new Set<Id>();

    // =========================================================
    // REVENUE NOT INCLUDED
    // =========================================================

    Integer unassignedShiftCount = 0;
    Decimal unassignedShiftValue = 0;

    Integer cancelledShiftCount = 0;
    Decimal cancelledShiftValue = 0;

    Integer deliveredUnbilledCount = 0;
    Decimal deliveredUnbilledValue = 0;

    // =========================================================
    // 4. PROCESS SERVICES
    // =========================================================

    for (Services_and_Support_Plan__c service : serviceList) {

        if (service.ShiftwithStaff__c == null) {
            continue;
        }

        // -----------------------------------------------------
        // SERVICE AMOUNT
        // -----------------------------------------------------

        Decimal serviceAmount = 0;

        if (service.Amount__c != null) {

            serviceAmount = service.Amount__c;

        } 

        if (serviceAmount < 0) {
            serviceAmount = 0;
        }

        if (service.Status__c == 'Cancelled' && service.Bill_Participant__c == false) {
            cancelledShiftCount++;
            cancelledShiftValue += serviceAmount;
            continue;
        }

        if ( service.Status__c == 'Cancelled' && service.Bill_Participant__c == true) {
            recognisedCancellationRevenue += serviceAmount;
            continue;
        }

        if (service.Un_Assigned_Service__c) {
            unassignedShiftCount++;
            unassignedShiftValue += serviceAmount;
            continue;
        }


        // -----------------------------------------------------
        // TOTAL SHIFT REVENUE
        //
        // Do this BEFORE participant filtering.
        // -----------------------------------------------------

        if ( !allShiftRevenueMap.containsKey(service.ShiftwithStaff__c)) {
            allShiftRevenueMap.put( service.ShiftwithStaff__c, 0);
        }

        allShiftRevenueMap.put(service.ShiftwithStaff__c, allShiftRevenueMap.get(service.ShiftwithStaff__c) + serviceAmount );

        // -----------------------------------------------------
        // PARTICIPANT FILTER
        // -----------------------------------------------------

        Boolean participantMatches = true;

        if (participantFilterApplied) {

            participantMatches =
                service.Client__c != null &&
                selectedParticipantIds.contains(
                    service.Client__c
                );
        }

        /*
         * If participant was selected and this service belongs
         * to another participant, ignore it.
         */
        if (!participantMatches) {
            continue;
        }

        // -----------------------------------------------------
        // SELECTED SHIFT
        // -----------------------------------------------------

        selectedShiftIds.add(
            service.ShiftwithStaff__c
        );

        if (
            !selectedShiftRevenueMap.containsKey(
                service.ShiftwithStaff__c
            )
        ) {
            selectedShiftRevenueMap.put(
                service.ShiftwithStaff__c,
                0
            );
        }

        selectedShiftRevenueMap.put(
            service.ShiftwithStaff__c,
            selectedShiftRevenueMap.get(
                service.ShiftwithStaff__c
            ) + serviceAmount
        );

        // -----------------------------------------------------
        // PARTICIPANT NAME
        // -----------------------------------------------------

        if (service.Client__c != null) {

            String participantName =
                service.Participant_Name__c;

            if (String.isBlank(participantName)) {
                participantName =
                    String.valueOf(
                        service.Client__c
                    );
            }

            participantNameMap.put(
                service.Client__c,
                participantName
            );
        }

        // =====================================================
        // RECOGNISED REVENUE
        // =====================================================

        if (service.Status__c == 'Invoice Generated') {

            deliveredRecognisedBilling +=
                serviceAmount;

            // -------------------------------------------------
            // PARTICIPANT REVENUE
            // -------------------------------------------------

            if (service.Client__c != null) {

                if (
                    !participantRevenueMap.containsKey(
                        service.Client__c
                    )
                ) {
                    participantRevenueMap.put(
                        service.Client__c,
                        0
                    );
                }

                participantRevenueMap.put(
                    service.Client__c,
                    participantRevenueMap.get(
                        service.Client__c
                    ) + serviceAmount
                );
            }

            // -------------------------------------------------
            // SERVICE REVENUE
            // -------------------------------------------------

            String serviceName =
                service.Services_name__c;

            if (String.isBlank(serviceName)) {
                serviceName =
                    service.Services__c;
            }

            if (String.isBlank(serviceName)) {
                serviceName = 'Other';
            }

            if (
                !serviceRevenueMap.containsKey(
                    serviceName
                )
            ) {
                serviceRevenueMap.put(
                    serviceName,
                    0
                );
            }

            serviceRevenueMap.put(
                serviceName,
                serviceRevenueMap.get(
                    serviceName
                ) + serviceAmount
            );

        } else {

            // -------------------------------------------------
            // DELIVERED BUT UNBILLED
            // -------------------------------------------------

            if (
                service.Status__c == 'Not Yet Invoiced' ||
                service.Status__c == 'Draft'
            ) {
                deliveredUnbilledCount++;
                deliveredUnbilledValue +=
                    serviceAmount;
            }
        }
    }

    

    // =========================================================
// 5. PROCESS STAFF COST
// =========================================================

for (ShiftwithStaff__c shift : shiftList) {

    // =====================================================
    // 1. CANCELLED
    // =====================================================
    if (shift.Status__c == 'Cancelled') {

       // cancelledShiftCount++;

        minimumEngagementCost +=
            shift.Shift_Wage__c != null
                ? shift.Shift_Wage__c
                : 0;

        continue;
    }


  
  


    // =====================================================
    // 3. PARTICIPANT FILTER
    // =====================================================
    if (
        participantFilterApplied &&
        !selectedShiftIds.contains(shift.Id)
    ) {
        continue;
    }


    // =====================================================
    // 4. SHIFT REVENUE
    // =====================================================
    Decimal totalShiftRevenue =
        allShiftRevenueMap.containsKey(shift.Id)
            ? allShiftRevenueMap.get(shift.Id)
            : 0;

    Decimal selectedShiftRevenue =
        selectedShiftRevenueMap.containsKey(shift.Id)
            ? selectedShiftRevenueMap.get(shift.Id)
            : 0;


    if (
        totalShiftRevenue <= 0 ||
        selectedShiftRevenue <= 0
    ) {
        continue;
    }


    // =====================================================
    // 5. BASE SHIFT WAGE
    // =====================================================
    Decimal shiftCost =shift.Shift_Wage__c != null ? shift.Shift_Wage__c : 0;

    if (shiftCost < 0) {
        shiftCost = 0;
    }


    // =====================================================
    // 6. COST ALLOCATION
    // =====================================================
    Decimal allocatedShiftCost = shiftCost;

    if (participantFilterApplied) {

        Decimal allocationRatio =
            selectedShiftRevenue /
            totalShiftRevenue;

        allocatedShiftCost =
            shiftCost * allocationRatio;
    }


    // =====================================================
    // 7. SLEEPOVER
    // =====================================================
    if (shift.Shift_Category__c == 'Sleepover Shift') {

        // Shift Wage is always ordinary/base cost
      //  ordinaryStaffCost += allocatedShiftCost;


        // Sleepover allowance
        Decimal sleepoverAllowance =
            shift.Staff_Final_Hourly_Rate__c != null
                ? shift.Staff_Final_Hourly_Rate__c
                : 0;


        // Active sleepover hours × sleepover hourly rate
        Decimal activeSleepoverCost =
            (
                shift.Sleepover_Shift_Hours__c != null
                    ? shift.Sleepover_Shift_Hours__c
                    : 0
            )
            *
            (
                shift.Sleepover_Night_Shift_Hourly_Rate__c != null
                    ? shift.Sleepover_Night_Shift_Hourly_Rate__c
                    : 0
            );


        // Allocate sleepover component
        Decimal allocatedSleepoverCost =
            sleepoverAllowance +
            activeSleepoverCost;

        if (participantFilterApplied) {

            Decimal allocationRatio =
                selectedShiftRevenue /
                totalShiftRevenue;

            allocatedSleepoverCost =
                allocatedSleepoverCost *
                allocationRatio;
        }


        sleepoverCost += allocatedSleepoverCost;

      //  continue;
    }


    // =====================================================
    // 8. OTHER SHIFT CATEGORIES
    // =====================================================

    // Every other category starts with Shift Wage
  // ordinaryStaffCost += allocatedShiftCost;
        if (shift.Shift_Category__c != 'Sleepover Shift') {
            if (shift.Broken_Shift__c == true) {
        
                brokenShiftCost += allocatedShiftCost;

                } else {

                    // Normal shift:
                // Shift Wage should be reflected under Ordinary Staff Cost
                    ordinaryStaffCost += allocatedShiftCost;
                }
        }
    // =====================================================
    // 9. OVERTIME
    // =====================================================

    Decimal shiftOvertimeCost = 0;


    if (
        shift.Over_Time_Tier_One__c != null &&
        shift.Over_Time_Tier_One_Rate__c != null
    ) {

        shiftOvertimeCost +=
            shift.Over_Time_Tier_One__c *
            shift.Over_Time_Tier_One_Rate__c;
    }


    if (
        shift.Over_Time_Tier_Two__c != null &&
        shift.Over_Time_Tier_Two_Rate__c != null
    ) {

        shiftOvertimeCost +=
            shift.Over_Time_Tier_Two__c *
            shift.Over_Time_Tier_Two_Rate__c;
    }


    if (participantFilterApplied) {

        Decimal allocationRatio =
            selectedShiftRevenue /
            totalShiftRevenue;

        shiftOvertimeCost =
            shiftOvertimeCost *
            allocationRatio;
    }


    overtimeCost += shiftOvertimeCost;


    // =====================================================
    // 10. EXTENDED / PENALTY
    // =====================================================

    Decimal shiftPenaltyCost = 0;


    if (
        shift.Extended_Duration__c != null &&
        shift.Variance_Rate__c != null
    ) {

        shiftPenaltyCost =
            shift.Extended_Duration__c *
            shift.Variance_Rate__c;
    }


    if (participantFilterApplied) {

        Decimal allocationRatio =
            selectedShiftRevenue /
            totalShiftRevenue;

        shiftPenaltyCost =
            shiftPenaltyCost *
            allocationRatio;
    }


    penaltyCost += shiftPenaltyCost;


    // =====================================================
    // 11. BROKEN SHIFT
    // =====================================================

    Decimal shiftBrokenCost = 0;


    if (shift.Broken_Shift_Allowance__c != null) {

        shiftBrokenCost +=
            shift.Broken_Shift_Allowance__c;
    }


    if (
        shift.Broken_Extended_Duration__c != null &&
        shift.Broken_Extended_Rate__c != null
    ) {

        shiftBrokenCost +=
            shift.Broken_Extended_Duration__c *
            shift.Broken_Extended_Rate__c;
    }


    if (participantFilterApplied) {

        Decimal allocationRatio =
            selectedShiftRevenue /
            totalShiftRevenue;

        shiftBrokenCost =
            shiftBrokenCost *
            allocationRatio;
    }


    brokenShiftCost += shiftBrokenCost;


    // =====================================================
    // 12. EXISTING PARTICIPANT COST ALLOCATION
    // =====================================================

    for (
        Services_and_Support_Plan__c service :
        serviceList
    ) {

        if (
            service.ShiftwithStaff__c !=
            shift.Id
        ) {
            continue;
        }

        if (service.Client__c == null) {
            continue;
        }

        if (
            participantFilterApplied &&
            !selectedParticipantIds.contains(
                service.Client__c
            )
        ) {
            continue;
        }

        Decimal serviceAmount = 0;

        if (service.Amount__c != null) {

            serviceAmount =
                service.Amount__c;

        } else if (
            service.Edited_Unit_Price__c != null
        ) {

            Decimal qty =
                service.Qty__c != null
                    ? service.Qty__c
                    : 1;

            serviceAmount =
                service.Edited_Unit_Price__c *
                qty;
        }

        if (serviceAmount <= 0) {
            continue;
        }

        Decimal participantAllocatedCost =
            allocatedShiftCost *
            (
                serviceAmount /
                selectedShiftRevenue
            );


        if (
            !participantCostMap.containsKey(
                service.Client__c
            )
        ) {

            participantCostMap.put(
                service.Client__c,
                0
            );
        }


        participantCostMap.put(
            service.Client__c,
            participantCostMap.get(
                service.Client__c
            ) + participantAllocatedCost
        );


        String serviceName =
            service.Services_name__c;

        if (String.isBlank(serviceName)) {
            serviceName =
                service.Services__c;
        }

        if (String.isBlank(serviceName)) {
            serviceName = 'Other';
        }


        if (
            !serviceCostMap.containsKey(
                serviceName
            )
        ) {

            serviceCostMap.put(
                serviceName,
                0
            );
        }


        serviceCostMap.put(
            serviceName,
            serviceCostMap.get(
                serviceName
            ) + participantAllocatedCost
        );
    }
}

    // =========================================================
    // 6. REIMBURSEMENTS
    // =========================================================

    List<Reimbursement__c> reimbursementList = [
        SELECT
            Id,
            ShiftwithStaff__c,
            Approval_Status__c,
            Total_Amount__c,
            Amount__c
        FROM Reimbursement__c
        WHERE ShiftwithStaff__c IN :shiftIds
        AND Approval_Status__c = 'Approved'
    ];

    for (
        Reimbursement__c reimbursement :
        reimbursementList
    ) {

        if (
            reimbursement.ShiftwithStaff__c == null
        ) {
            continue;
        }

        /*
         * If participant filter is active, only include
         * reimbursements belonging to selected participant shifts.
         */
        if (
            participantFilterApplied &&
            !selectedShiftIds.contains(
                reimbursement.ShiftwithStaff__c
            )
        ) {
            continue;
        }

        Decimal reimbursementAmount = 0;

        if (
            reimbursement.Total_Amount__c != null
        ) {

            reimbursementAmount =
                reimbursement.Total_Amount__c;

        } else if (
            reimbursement.Amount__c != null
        ) {

            reimbursementAmount =
                reimbursement.Amount__c;
        }

        if (reimbursementAmount <= 0) {
            continue;
        }

        Decimal allocatedReimbursement = reimbursementAmount;

        // -----------------------------------------------------
        // PARTICIPANT ALLOCATION
        // -----------------------------------------------------

        if (participantFilterApplied) {

            Decimal totalShiftRevenue =
                allShiftRevenueMap.containsKey(
                    reimbursement.ShiftwithStaff__c
                )
                ? allShiftRevenueMap.get(
                    reimbursement.ShiftwithStaff__c
                )
                : 0;

            Decimal selectedRevenue =
                selectedShiftRevenueMap.containsKey(
                    reimbursement.ShiftwithStaff__c
                )
                ? selectedShiftRevenueMap.get(
                    reimbursement.ShiftwithStaff__c
                )
                : 0;

            if (
                totalShiftRevenue > 0 &&
                selectedRevenue > 0
            ) {

                allocatedReimbursement =
                    reimbursementAmount *
                    (
                        selectedRevenue /
                        totalShiftRevenue
                    );

            } else {

                allocatedReimbursement = 0;
            }
        }

        reimbursementCost +=
            allocatedReimbursement;
    }

    // =========================================================
    // 6A. PARTICIPANT REIMBURSEMENT REVENUE
    // =========================================================

        Set<String> reimbursementIds = new Set<String>();

        for (Reimbursement__c reimbursement : reimbursementList) {
            
            if (reimbursement.Id == null) {
                continue;
            }

            // Same participant filter
            if ( participantFilterApplied && !selectedShiftIds.contains( reimbursement.ShiftwithStaff__c )) {
                continue;
            }

            reimbursementIds.add( String.valueOf(reimbursement.Id) );
         }

        if (!reimbursementIds.isEmpty()) {

            List<Participant_Reimbrusement__c> participantReimbursementList = [
                SELECT
                    Id,
                    Reimbrusement_Id__c,
                    Reimbrusement_Amount__c
                FROM Participant_Reimbrusement__c
                WHERE Reimbrusement_Id__c IN :reimbursementIds
            ];

            for (Participant_Reimbrusement__c participantReimbursement : participantReimbursementList) {

                if (participantReimbursement.Reimbrusement_Amount__c != null) {
                    otherRecognisedServiceRevenue += participantReimbursement.Reimbrusement_Amount__c;
                }
            }
        }

    // =========================================================
    // 7. TOTAL REVENUE
    // =========================================================

    Decimal totalRevenue = deliveredRecognisedBilling + recognisedCancellationRevenue + otherRecognisedServiceRevenue;

    // =========================================================
    // 8. TOTAL DIRECT COST
    // =========================================================

    Decimal totalDirectCost =
        ordinaryStaffCost +
        overtimeCost +
        penaltyCost +
        sleepoverCost +
        brokenShiftCost +
        minimumEngagementCost +
        reimbursementCost;

    // =========================================================
    // 9. GROSS PROFIT
    // =========================================================

    Decimal grossProfit =
        totalRevenue -
        totalDirectCost;

    // =========================================================
    // 10. GROSS PROFIT MARGIN
    // =========================================================

    Decimal grossProfitMargin = null;

    if (totalRevenue != 0) {

        grossProfitMargin =
            (
                grossProfit /
                totalRevenue
            ) * 100;
    }

    // =========================================================
    // 11. PARTICIPANT PROFITABILITY
    // =========================================================

    List<Map<String, Object>> participantProfitability =
        new List<Map<String, Object>>();

    Set<Id> profitabilityParticipantIds =
        new Set<Id>();

    profitabilityParticipantIds.addAll(
        participantRevenueMap.keySet()
    );

    for (
        Id participantId :
        profitabilityParticipantIds
    ) {

        Decimal participantRevenue =
            participantRevenueMap.containsKey(
                participantId
            )
                ? participantRevenueMap.get(
                    participantId
                )
                : 0;

        Decimal participantCost =
            participantCostMap.containsKey(
                participantId
            )
                ? participantCostMap.get(
                    participantId
                )
                : 0;

        Decimal participantProfit =
            participantRevenue -
            participantCost;

        Decimal participantMargin = null;

        if (participantRevenue != 0) {

            participantMargin =
                (
                    participantProfit /
                    participantRevenue
                ) * 100;
        }

        Map<String, Object> row =
            new Map<String, Object>();

        row.put(
            'participantId',
            participantId
        );

        row.put(
            'participantName',
            participantNameMap.containsKey(
                participantId
            )
                ? participantNameMap.get(
                    participantId
                )
                : '-'
        );

        row.put(
            'revenue',
            participantRevenue.setScale(2)
        );

        row.put(
            'directCost',
            participantCost.setScale(2)
        );

        row.put(
            'grossProfit',
            participantProfit.setScale(2)
        );

        row.put(
            'margin',
            participantMargin == null
                ? 0
                : participantMargin.setScale(2)
        );

        participantProfitability.add(row);
    }

    // =========================================================
    // 12. SERVICE / SUPPORT ITEM PROFITABILITY
    // =========================================================

    List<Map<String, Object>> serviceProfitability =
        new List<Map<String, Object>>();

    Set<String> serviceNames =
        new Set<String>();

    serviceNames.addAll(
        serviceRevenueMap.keySet()
    );

    serviceNames.addAll(
        serviceCostMap.keySet()
    );

    for (String serviceName : serviceNames) {

        Decimal revenue =
            serviceRevenueMap.containsKey(
                serviceName
            )
                ? serviceRevenueMap.get(
                    serviceName
                )
                : 0;

        Decimal cost =
            serviceCostMap.containsKey(
                serviceName
            )
                ? serviceCostMap.get(
                    serviceName
                )
                : 0;

        Decimal profit =
            revenue -
            cost;

        Decimal margin = null;

        if (revenue != 0) {

            margin =
                (
                    profit /
                    revenue
                ) * 100;
        }

        Map<String, Object> row =
            new Map<String, Object>();

        row.put(
            'serviceName',
            serviceName
        );

        row.put(
            'revenue',
            revenue.setScale(2)
        );

        row.put(
            'directCost',
            cost.setScale(2)
        );

        row.put(
            'grossProfit',
            profit.setScale(2)
        );

        row.put(
            'margin',
            margin == null
                ? null
                : margin.setScale(2)
        );

        serviceProfitability.add(row);
    }

    // =========================================================
    // 13. REVENUE NOT INCLUDED
    // =========================================================

    List<Map<String, Object>> revenueNotIncluded =
        new List<Map<String, Object>>();

    // ---------------------------------------------------------
    // UNASSIGNED SHIFTS
    // ---------------------------------------------------------

    Map<String, Object> unassignedRow =
        new Map<String, Object>();

    unassignedRow.put(
        'item',
        'Unassigned Shifts'
    );

    unassignedRow.put(
        'count',
        unassignedShiftCount
    );

    unassignedRow.put(
        'estimatedValue',
        unassignedShiftValue.setScale(2)
    );

    revenueNotIncluded.add(
        unassignedRow
    );

    // ---------------------------------------------------------
    // CANCELLED SHIFTS
    // ---------------------------------------------------------

    Map<String, Object> cancelledRow =
        new Map<String, Object>();

    cancelledRow.put(
        'item',
        'Cancelled Shifts (no charge recognised)'
    );

    cancelledRow.put(
        'count',
        cancelledShiftCount
    );

    cancelledRow.put(
        'estimatedValue',
        cancelledShiftValue.setScale(2)
    );

    revenueNotIncluded.add(
        cancelledRow
    );

    // ---------------------------------------------------------
    // DELIVERED BUT UNBILLED
    // ---------------------------------------------------------

    Map<String, Object> unbilledRow =
        new Map<String, Object>();

    unbilledRow.put(
        'item',
        'Delivered but Unbilled'
    );

    unbilledRow.put(
        'count',
        deliveredUnbilledCount
    );

    unbilledRow.put(
        'estimatedValue',
        deliveredUnbilledValue.setScale(2)
    );

    revenueNotIncluded.add(
        unbilledRow
    );

    // =========================================================
    // 14. REVENUE BREAKDOWN
    // =========================================================

    List<Map<String, Object>> revenueBreakdown =
        new List<Map<String, Object>>();

    revenueBreakdown.add(
        createGrossProfitRow(
            'Delivered & Recognised Billing',
            deliveredRecognisedBilling
        )
    );

    revenueBreakdown.add(
        createGrossProfitRow(
            'Recognised Cancellation / No-show Charges',
            recognisedCancellationRevenue
        )
    );

    revenueBreakdown.add(
        createGrossProfitRow(
            'Other Recognised Service Revenue',
            otherRecognisedServiceRevenue
        )
    );

    revenueBreakdown.add(
        createGrossProfitRow(
            'Total Revenue',
            totalRevenue
        )
    );

    // =========================================================
    // 15. DIRECT COST BREAKDOWN
    // =========================================================

    List<Map<String, Object>> directCostBreakdown =
        new List<Map<String, Object>>();

    directCostBreakdown.add(
        createGrossProfitRow(
            'Ordinary Staff Cost',
            ordinaryStaffCost
        )
    );

    directCostBreakdown.add(
        createGrossProfitRow(
            'Overtime',
            overtimeCost
        )
    );

    directCostBreakdown.add(
        createGrossProfitRow(
            'Extended/Penalty',
            penaltyCost
        )
    );

    directCostBreakdown.add(
        createGrossProfitRow(
            'Sleepover',
            sleepoverCost
        )
    );

    directCostBreakdown.add(
        createGrossProfitRow(
            'Broken Shift',
            brokenShiftCost
        )
    );

    directCostBreakdown.add(
        createGrossProfitRow(
            'Cancelled Shift',
            minimumEngagementCost
        )
    );

    directCostBreakdown.add(
        createGrossProfitRow(
            'Travel / Reimbursements',
            reimbursementCost
        )
    );

    directCostBreakdown.add(
        createGrossProfitRow(
            'Total Direct Cost',
            totalDirectCost
        )
    );

    // =========================================================
    // 16. FINAL RESULT
    // =========================================================

    Map<String, Object> result =
        new Map<String, Object>();

    // ---------------------------------------------------------
    // FILTERS
    // ---------------------------------------------------------

    result.put(
        'facilityId',
        facilityIds
    );

    result.put(
        'participantIds',
        new List<Id>(
            selectedParticipantIds
        )
    );

    result.put(
        'startDate',
        startDate
    );

    result.put(
        'endDate',
        endDate
    );

    // ---------------------------------------------------------
    // SUMMARY
    // ---------------------------------------------------------

    result.put(
        'recognisedRevenue',
        totalRevenue.setScale(2)
    );

    result.put(
        'directCosts',
        totalDirectCost.setScale(2)
    );

    result.put(
        'grossProfit',
        grossProfit.setScale(2)
    );

    result.put(
        'grossProfitMargin',
        grossProfitMargin == null
            ? null
            : grossProfitMargin.setScale(2)
    );

    // ---------------------------------------------------------
    // BREAKDOWNS
    // ---------------------------------------------------------

    result.put(
        'revenueBreakdown',
        revenueBreakdown
    );

    result.put(
        'directCostBreakdown',
        directCostBreakdown
    );

    result.put(
        'participantProfitability',
        participantProfitability
    );

    result.put(
        'serviceProfitability',
        serviceProfitability
    );

    result.put(
        'revenueNotIncluded',
        revenueNotIncluded
    );

    // ---------------------------------------------------------
    // COUNTS
    // ---------------------------------------------------------

    result.put(
        'shiftCount',
        shiftList.size()
    );

    result.put(
        'serviceCount',
        serviceList.size()
    );

    result.put(
        'participantCount',
        participantProfitability.size()
    );

    // =========================================================
    // DEBUG
    // =========================================================

    System.debug(
        '===== Gross Profit Result ====='
    );

    System.debug(
        'Recognised Revenue = ' +
        totalRevenue
    );

    System.debug(
        'Direct Cost = ' +
        totalDirectCost
    );

    System.debug(
        'Gross Profit = ' +
        grossProfit
    );

    System.debug(
        'Gross Margin = ' +
        grossProfitMargin
    );

    System.debug(
        'Participant Count = ' +
        participantProfitability.size()
    );

    System.debug(
        'Service Count = ' +
        serviceProfitability.size()
    );

    System.debug(
        '===== getGrossProfitMarginReport END ====='
    );

    return result;
}


// =============================================================
// HELPER: CREATE FINANCIAL ROW
// =============================================================

private static Map<String, Object> createGrossProfitRow(
    String category,
    Decimal amount
) {
    Map<String, Object> row =
        new Map<String, Object>();

    row.put(
        'category',
        category
    );

    row.put(
        'amount',
        amount == null
            ? 0
            : amount.setScale(2)
    );

    return row;
}


// =============================================================
// HELPER: EMPTY REPORT
// =============================================================

private static Map<String, Object> buildEmptyGrossProfitReport(
    List<Id> facilityIds,
    Date startDate,
    Date endDate,
    Set<Id> participantIds
) {
    Map<String, Object> result = new Map<String, Object>();

    result.put(
        'facilityId',
        facilityIds
    );

    result.put(
        'participantIds',
        new List<Id>(participantIds)
    );

    result.put(
        'startDate',
        startDate
    );

    result.put(
        'endDate',
        endDate
    );

    result.put(
        'recognisedRevenue',
        0
    );

    result.put(
        'directCosts',
        0
    );

    result.put(
        'grossProfit',
        0
    );

    result.put(
        'grossProfitMargin',
        null
    );

    result.put(
        'shiftCount',
        0
    );

    result.put(
        'serviceCount',
        0
    );

    result.put(
        'participantCount',
        0
    );

    result.put(
        'revenueBreakdown',
        new List<Map<String, Object>>()
    );

    result.put(
        'directCostBreakdown',
        new List<Map<String, Object>>()
    );

    result.put(
        'participantProfitability',
        new List<Map<String, Object>>()
    );

    result.put(
        'serviceProfitability',
        new List<Map<String, Object>>()
    );

    result.put(
        'revenueNotIncluded',
        new List<Map<String, Object>>()
    );

    return result;
}
    

}