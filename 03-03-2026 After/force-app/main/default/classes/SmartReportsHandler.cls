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
                    'Id, Duration__c, Address__c, Start_Date__c, Date__c, ' +
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
                'AND Add_Shift__r.Facility__c IN :facilityIds';


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
        List<Id> staffIds
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
            'SELECT Id, Staff__c, Staff__r.Email_Address__c, Staff__r.Name__c, Staff__r.Name, LastModifiedDate, ' +
            'Staff__r.NameToDisplay__c, Staff__r.Display_Nickname__c, Facility__c, ' +
            'Add_Shift__r.Start_Date__c, Add_Shift__r.Break__c, Add_Shift__r.Facility__c, ' +
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
            'AND Add_Shift__r.Facility__c IN :facilityIds ';

        if (applyStaffFilter) {
            soql += 'AND Staff__c IN :staffIds ';
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
            'AND ShiftwithStaff__r.Add_Shift__r.Facility__c IN : facilityIds ';

        /* -------------------------
        User / facility filter
        ------------------------- */

        if (roleName == 'Portal Account Partner User') {

            query +=
                'AND ShiftwithStaff__r.Staff__r.Email_Address__c = :userEmail ';

        } else if (userType != 'NDIS Org Admin') {

            if (!facilityIdSet.isEmpty()) {

                query +=
                    'AND ShiftwithStaff__r.Add_Shift__r.Facility__c IN :facilityIdSet ';

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
    public static List<Favorite_Report__c> getFavoriteReports(Id facilityId) {

        return [
            SELECT Id, Name, Report_Type__c, Filters_JSON__c, Facility__c
            FROM Favorite_Report__c
            WHERE Facility__c = :facilityId
            ORDER BY CreatedDate DESC
        ];
    }

    @AuraEnabled
    public static void createShiftReportLog( Date startDate, Date endDate, Id facilityId, String exportType, String reportType, String selectedDateRange) {
        try {

            Report_Export_Log__c log = new Report_Export_Log__c();
            // Data from LWC
            log.Start_Date__c = startDate;
            log.End_Date__c = endDate;
            log.Facility__c = facilityId;
            log.Export_Type__c = exportType;
            log.Report_Type__c = reportType;
            log.Exported_On__c = System.now();
            log.Date_Range__c = selectedDateRange;

            insert log;

            System.debug('✅ Report export log created: ' + log.Id);

        } catch (Exception e) {
            System.debug('❌ Failed to create report export log: ' + e.getMessage());
            throw new AuraHandledException('Unable to log report export: ' + e.getMessage());
        }
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
                CreatedDate,
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

}