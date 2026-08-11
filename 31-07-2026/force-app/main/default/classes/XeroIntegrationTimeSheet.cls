public class XeroIntegrationTimeSheet { 

    // ============================================================
    // RESULT WRAPPER FOR LWC
    // ============================================================
    public class StaffProcessingResult {
        @AuraEnabled public Id staffId;
        @AuraEnabled public String staffName;
        @AuraEnabled public Boolean success;
        @AuraEnabled public String message;

        // Popup handling
        @AuraEnabled public Boolean showInPopup;

        // Pay period mismatch details
        @AuraEnabled public Boolean payPeriodMismatch;
        @AuraEnabled public Date suggestedStartDate;
        @AuraEnabled public Date suggestedEndDate;
        @AuraEnabled public String suggestedStartDay;
        @AuraEnabled public String suggestedEndDay;

        public StaffProcessingResult(
            Id staffId,
            String staffName,
            Boolean success,
            String message
        ) {
            this.staffId = staffId;
            this.staffName = staffName;
            this.success = success;
            this.message = message;

            // defaults
            this.showInPopup = false;

            this.payPeriodMismatch = false;
            this.suggestedStartDate = null;
            this.suggestedEndDate = null;
            this.suggestedStartDay = null;
            this.suggestedEndDay = null;
        }
    }

    // ============================================================
    // INTERNAL CONTEXT HOLDER
    // ============================================================
    public class ProcessingContext {
        public String accessToken;
        public String tenantId;
        public Date startDate;
        public Date endDate;
        public Organisation__c orgRecord;

        public Map<String, String> categoryToEarningRateMap;

        public List<Object> employeePayloads;
        public List<Object> timesheetPayloads;

        // Employee mapping for bulk response handling
        public Map<String, Id> employeeIdToStaffId;
        public Map<String, String> employeeIdToStaffName;

        // Final results returned to LWC
        public List<StaffProcessingResult> results;

        public ProcessingContext() {
            categoryToEarningRateMap = new Map<String, String>();

            employeePayloads = new List<Object>();
            timesheetPayloads = new List<Object>();

            employeeIdToStaffId = new Map<String, Id>();
            employeeIdToStaffName = new Map<String, String>();

            results = new List<StaffProcessingResult>();
        }
    }

    // ============================================================
    // BULK ENTRY METHOD
    // ============================================================
    @AuraEnabled
    public static List<StaffProcessingResult> insertBulkTimeSheet(
        List<Id> staffIds,
        String startDateStr,
        String endDateStr
    ) {
        System.debug('🚀 =========== START BULK insertBulkTimeSheet ===========');
        System.debug('🚀 Staff Count: ' + (staffIds == null ? 0 : staffIds.size()));
        System.debug('🚀 Start Date: ' + startDateStr);
        System.debug('🚀 End Date: ' + endDateStr);

        try {

            // ============================================================
            // VALIDATION
            // ============================================================
            if (staffIds == null || staffIds.isEmpty()) {
                StaffProcessingResult failed =
                    new StaffProcessingResult(
                        null,
                        null,
                        false,
                        'No staff selected.'
                    );

                failed.showInPopup = true;

                return new List<StaffProcessingResult>{ failed };
            }

            // ============================================================
            // CONTEXT
            // ============================================================
            ProcessingContext ctx = new ProcessingContext();

            ctx.startDate = Date.valueOf(startDateStr);
            ctx.endDate = Date.valueOf(endDateStr);

            System.debug('✅ Date Conversion Complete');
            System.debug('Start Date: ' + ctx.startDate);
            System.debug('End Date: ' + ctx.endDate);

            // ============================================================
            // XERO AUTH
            // ============================================================
            System.debug('🔹 Getting Xero credentials...');

            if (Test.isRunningTest()) {
                ctx.accessToken = 'dummy_access_token';
                ctx.tenantId = 'dummy_tenant_id';
            } else {
                ctx.accessToken =
                    XeroIntegrationController.getAccessTokenFromXero();

                ctx.tenantId =
                    XeroIntegrationController.getTenantId(ctx.accessToken);
            }

            if (
                String.isBlank(ctx.accessToken) ||
                String.isBlank(ctx.tenantId)
            ) {
                StaffProcessingResult failed =
                    new StaffProcessingResult(
                        null,
                        null,
                        false,
                        'Missing Xero Access Token or Tenant ID.'
                    );

                failed.showInPopup = true;

                return new List<StaffProcessingResult>{ failed };
            }

            System.debug('✅ Xero Credentials Ready');

            // ============================================================
            // CURRENT USER
            // ============================================================
            User currentUser = [
                SELECT Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            // ============================================================
            // ORGANISATION + EARNING RATES
            // ============================================================
            ctx.orgRecord = [
                SELECT Id,
                    Name,
                    (
                        SELECT Id,
                                Name,
                                Earning_Rate_ID__c
                        FROM Xero_Earning_Rates__r
                    )
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];

            for (Xero_Earning_Rate__c rate :
                ctx.orgRecord.Xero_Earning_Rates__r) {

                if (
                    !String.isBlank(rate.Name) &&
                    !String.isBlank(rate.Earning_Rate_ID__c)
                ) {
                    ctx.categoryToEarningRateMap.put(
                        rate.Name.trim().toLowerCase(),
                        rate.Earning_Rate_ID__c
                    );
                }
            }

            // ============================================================
            // STAFF QUERY
            // ============================================================
            List<Staff__c> staffList = [
                SELECT Id,
                    NameToDisplay__c,
                    Display_Nickname__c,
                    Xero_Employee_ID__c,
                    Ordinary_Earnings_Rate_ID__c
                FROM Staff__c
                WHERE Id IN :staffIds
            ];

            if (staffList.isEmpty()) {
                StaffProcessingResult failed =
                    new StaffProcessingResult(
                        null,
                        null,
                        false,
                        'No valid staff found.'
                    );

                failed.showInPopup = true;

                return new List<StaffProcessingResult>{ failed };
            }

            // ============================================================
            // PROCESS STAFF
            // ============================================================
            for (Staff__c staff : staffList) {
                try {

                    // Missing Xero Employee ID
                    if (String.isBlank(staff.Xero_Employee_ID__c)) {

                        StaffProcessingResult failed =
                            new StaffProcessingResult(
                                staff.Id,
                                staff.Display_Nickname__c,
                                false,
                                '❌ Missing Xero Employee ID for ' +
                                staff.Display_Nickname__c +
                                '. Please sync this staff record with Xero.'
                            );

                        failed.showInPopup = true;

                        ctx.results.add(failed);
                        continue;
                    }

                    // Missing Ordinary Earnings Rate
                    if (String.isBlank(staff.Ordinary_Earnings_Rate_ID__c)) {

                        StaffProcessingResult failed =
                            new StaffProcessingResult(
                                staff.Id,
                                staff.Display_Nickname__c,
                                false,
                                '❌ Missing Ordinary Earnings Rate ID for ' +
                                staff.Display_Nickname__c +
                                '. Please set it in Staff record.'
                            );

                        failed.showInPopup = true;

                        ctx.results.add(failed);
                        continue;
                    }

                    processSingleStaffForBulk(
                        staff,
                        ctx
                    );

                } catch (Exception ex) {

                    String errorMessage;

                    if (ex instanceof AuraHandledException) {

                        if (ex.getMessage() == 'Script-thrown exception') {
                            errorMessage =
                                'No approved shifts found for ' +
                                staff.Display_Nickname__c;
                        } else {
                            errorMessage = ex.getMessage();
                        }

                    } else {

                        errorMessage =
                            ex.getTypeName() +
                            ' | ' +
                            ex.getMessage() +
                            ' | Line: ' +
                            ex.getLineNumber();
                    }

                    StaffProcessingResult failed =
                        new StaffProcessingResult(
                            staff.Id,
                            staff.Display_Nickname__c,
                            false,
                            errorMessage
                        );

                    failed.showInPopup = true;

                    ctx.results.add(failed);
                }
            }

            // ============================================================
            // SEND EMPLOYEE PAY TEMPLATES
            // ============================================================
            if (!ctx.employeePayloads.isEmpty()) {
                sendBulkEmployeePayTemplates(ctx);
            }

            // ============================================================
            // SEND TIMESHEETS
            // ============================================================
            if (!ctx.timesheetPayloads.isEmpty()) {
                System.debug('===========================');
                System.debug('Employee Payload Size = ' + ctx.employeePayloads.size());
                System.debug('Timesheet Payload Size = ' + ctx.timesheetPayloads.size());
                System.debug('Current Result Size = ' + ctx.results.size());
                System.debug('===========================');
                sendBulkTimesheets(ctx);
                System.debug('After sendBulkTimesheets');
                System.debug('Result Size = ' + ctx.results.size());
                System.debug(JSON.serializePretty(ctx.results));
            }
            System.debug('Returning Results');
            System.debug(JSON.serializePretty(ctx.results));
            return ctx.results;

        } catch (Exception e) {

            String exactError =
                e.getTypeName() +
                ' | ' +
                e.getMessage() +
                ' | Line: ' +
                e.getLineNumber();

            StaffProcessingResult failed =
                new StaffProcessingResult(
                    null,
                    null,
                    false,
                    exactError
                );

            failed.showInPopup = true;

            return new List<StaffProcessingResult>{ failed };
        }
    }

    // ============================================================
    // PART 2 METHODS WILL COME NEXT
    // ============================================================
    public static void processSingleStaffForBulk(
        Staff__c staff,
        ProcessingContext ctx
    ) {
        System.debug('🚀 ===== START processSingleStaffForBulk =====');

        String xeroEmployeeId = staff.Xero_Employee_ID__c;
        String ordinaryEarningsRateId = staff.Ordinary_Earnings_Rate_ID__c;

        // ============================================================
        // STORE STAFF MAPPING FOR BULK RESPONSE HANDLING
        // ============================================================
        ctx.employeeIdToStaffId.put(
            xeroEmployeeId,
            staff.Id
        );

        ctx.employeeIdToStaffName.put(
            xeroEmployeeId,
            staff.Display_Nickname__c
        );

        // ============================================================
        // FETCH SHIFTS
        // ============================================================
        List<ShiftwithStaff__c> shifts = [
            SELECT Id,
                Date__c,
                Actual_Duration__c,
                Broken_Extended_Duration__c,
                Broken_Shift_Allowance__c,
                Broken_Extended_Rate__c,
                Shift_Category__c,
                Custom_Rate_Per_Hrs__c,
                Approval_Status__c,
                Staff_Hourly_Rate__c,
                Shift_Type__c,
                Broken_Rate_Per_Hrs__c,
                Broken_Shift__c,
                Broken_Total_Duration__c
            FROM ShiftwithStaff__c
            WHERE Staff__c = :staff.Id
            AND Date__c >= :ctx.startDate
            AND Date__c <= :ctx.endDate
            AND Approval_Status__c = 'Approved'
            AND (
                Broken_Shift__c = false
                OR (
                    Broken_Shift__c = true
                    AND Broken_Extended_Duration__c != NULL
                )
            )
            ORDER BY Date__c
        ];

        if (shifts.isEmpty()) {
            throw new AuraHandledException(
                'No approved shifts found for ' +
                staff.Display_Nickname__c
            );
        }

        // ============================================================
        // CATEGORY RATE CALCULATIONS
        // ============================================================
        Map<String, Decimal> categoryToHourlyRate =
            new Map<String, Decimal>();

        Map<String, List<Decimal>> sleepoverCategoryData =
            new Map<String, List<Decimal>>();

        Decimal totalBrokenPay = 0;
        Decimal totalBrokenHours = 0;

        for (ShiftwithStaff__c shift : shifts) {

            // BROKEN SHIFT
            if (shift.Broken_Shift__c) {

                Decimal rate =
                    shift.Broken_Rate_Per_Hrs__c != null
                    ? shift.Broken_Rate_Per_Hrs__c
                    : 0;

                Decimal duration =
                    shift.Broken_Total_Duration__c != null
                    ? shift.Broken_Total_Duration__c
                    : 0;

                Decimal pay = rate * duration;

                totalBrokenPay += pay;
                totalBrokenHours += duration;

                continue;
            }

            // NORMAL SHIFT
            if (String.isBlank(shift.Shift_Category__c)) { continue;
            }

            String categoryKey =
                shift.Shift_Category__c.trim().toLowerCase();

            Decimal effectiveRate;

            if (categoryKey == 'custom') {

                if (shift.Custom_Rate_Per_Hrs__c == null) {
                    continue;
                }

                effectiveRate = shift.Custom_Rate_Per_Hrs__c;

            } else {

                if (shift.Staff_Hourly_Rate__c == null) { continue;
                }

                effectiveRate = shift.Staff_Hourly_Rate__c;
            }

            // SLEEPOVER
            if (categoryKey.contains('sleepover')) {

                if (!sleepoverCategoryData.containsKey(categoryKey)) {
                    sleepoverCategoryData.put(
                        categoryKey,
                        new List<Decimal>{0, 0, 0}
                    );
                }

                List<Decimal> data =
                    sleepoverCategoryData.get(categoryKey);

                Decimal duration =
                    shift.Actual_Duration__c != null
                    ? shift.Actual_Duration__c : 0;

                Decimal pay =
                    duration > 0 ? effectiveRate * duration
                    : 0;

                data[0] += pay;
                data[1] += duration;
                data[2] += 1;

            } else {

                categoryToHourlyRate.put(
                    categoryKey,
                    effectiveRate.setScale(2)
                );
            }
        }

        // ============================================================
        // BROKEN SHIFT RATE
        // ============================================================
        if (totalBrokenHours > 0) { Decimal finalBrokenRate = (totalBrokenPay / totalBrokenHours).setScale(2); categoryToHourlyRate.put( 'broken shift', finalBrokenRate
            );
        }

        // ============================================================
        // SLEEPOVER FINAL RATES
        // ============================================================
        for (String categoryKey : sleepoverCategoryData.keySet()) {

            List<Decimal> data =
                sleepoverCategoryData.get(categoryKey);

            Decimal totalAmount = data[0];
            Decimal totalHours = data[1];
            Decimal shiftCount = data[2];

            if (totalHours > 0) { Decimal ratePerUnit = (totalAmount / totalHours).setScale(2); categoryToHourlyRate.put( categoryKey, ratePerUnit
                );

            } else if (shiftCount > 0) {

                Decimal averageRate =
                    (totalAmount / shiftCount).setScale(2);

                categoryToHourlyRate.put(
                    categoryKey,
                    averageRate
                );
            }
        }

        // ============================================================
        // BUILD EMPLOYEE PAY TEMPLATE
        // ============================================================
        List<Object> earningsLines =
            new List<Object>();

        for (String category : categoryToHourlyRate.keySet()) {

            String matchedEarningRateId =
                findMatchingEarningRate(
                    category,
                    ctx.categoryToEarningRateMap
                );

            if (String.isBlank(matchedEarningRateId)) {
                continue;
            }

            earningsLines.add(
                new Map<String, Object>{
                    'EarningsRateID' => matchedEarningRateId,
                    'CalculationType' => 'ENTEREARNINGSRATE',
                    'RatePerUnit' => categoryToHourlyRate.get(category)
                }
            );
        }

        Boolean hasOrdinaryRate = false;

        for (Object o : earningsLines) {
            Map<String, Object> row =
                (Map<String, Object>) o;

            if ((String) row.get('EarningsRateID') == ordinaryEarningsRateId) { hasOrdinaryRate = true; break;
            }
        }

        if (!hasOrdinaryRate) {
            earningsLines.add(
                new Map<String, Object>{
                    'EarningsRateID' => ordinaryEarningsRateId,
                    'CalculationType' => 'ENTEREARNINGSRATE',
                    'RatePerUnit' => 0
                }
            );
        }

        ctx.employeePayloads.add(
            new Map<String, Object>{
                'EmployeeID' => xeroEmployeeId,
                'PayTemplate' => new Map<String, Object>{
                    'EarningsLines' => earningsLines
                }
            }
        );

        // ============================================================
        // BUILD TIMESHEET HOURS MAP
        // ============================================================
        Map<String, Map<Date, Decimal>> categoryDateHoursMap =
            new Map<String, Map<Date, Decimal>>();

        for (ShiftwithStaff__c shift : shifts) {

            String categoryKey;
            Decimal duration;

            if (shift.Broken_Shift__c) { categoryKey = 'broken shift'; duration = shift.Broken_Total_Duration__c != null ? shift.Broken_Total_Duration__c : 0;

            } else {

                if (String.isBlank(shift.Shift_Category__c)) { continue;
                }

                categoryKey =
                    shift.Shift_Category__c.trim().toLowerCase();

                duration =
                    shift.Actual_Duration__c != null
                    ? shift.Actual_Duration__c : 0;
            }

            if (!categoryDateHoursMap.containsKey(categoryKey)) {
                categoryDateHoursMap.put(
                    categoryKey,
                    new Map<Date, Decimal>()
                );
            }

            Map<Date, Decimal> dateMap =
                categoryDateHoursMap.get(categoryKey);

            Decimal existing =
                dateMap.containsKey(shift.Date__c) ? dateMap.get(shift.Date__c)
                : 0;

            dateMap.put(
                shift.Date__c,
                existing + duration
            );
        }

        // ============================================================
        // TIMESHEET LINES
        // ============================================================
        List<Object> timesheetLines =
            new List<Object>();

        for (String category : categoryDateHoursMap.keySet()) {

            String earningRateId =
                findMatchingEarningRate(
                    category,
                    ctx.categoryToEarningRateMap
                );

            if (String.isBlank(earningRateId)) {
                earningRateId = ordinaryEarningsRateId;
            }

            List<Decimal> units =
                new List<Decimal>();

            for (
                Date d = ctx.startDate;
                d <= ctx.endDate;
                d = d.addDays(1)
            ) {
                Decimal hrs =
                    categoryDateHoursMap.get(category).containsKey(d)
                    ? categoryDateHoursMap.get(category).get(d).setScale(2)
                    : 0;

                units.add(hrs);
            }

            timesheetLines.add(
                new Map<String, Object>{
                    'EarningsRateID' => earningRateId,
                    'NumberOfUnits' => units
                }
            );
        }

        // ============================================================
        // PREVENT EMPTY TIMESHEET SUBMISSION
        // ============================================================
        if (timesheetLines.isEmpty()) { throw new AuraHandledException( 'No valid timesheet lines found for ' + staff.Display_Nickname__c
            );
        }

        // ============================================================
        // BUILD BULK TIMESHEET PAYLOAD
        // ============================================================
        ctx.timesheetPayloads.add(
            new Map<String, Object>{
                'EmployeeID' => xeroEmployeeId,
                'StartDate' => String.valueOf(ctx.startDate),
                'EndDate' => String.valueOf(ctx.endDate),
                'Status' => 'DRAFT',
                'TimesheetLines' => timesheetLines
            }
        );

        System.debug('✅ Staff prepared: ' + staff.Display_Nickname__c);
    }

    public static String findMatchingEarningRate(
        String category,
        Map<String, String> categoryToEarningRateMap
    ) {
        if (String.isBlank(category)) { return null;
        }

        if (category.equalsIgnoreCase('broken shift') &&
            categoryToEarningRateMap.containsKey('broken rate')) {

            return categoryToEarningRateMap.get('broken rate');
        }

        if (categoryToEarningRateMap.containsKey(category)) {
            return categoryToEarningRateMap.get(category);
        }

        if (category.toLowerCase().contains('sleepover')) {
            for (String key : categoryToEarningRateMap.keySet()) {
                if (key.contains('sleepover')) {
                    return categoryToEarningRateMap.get(key);
                }
            }
        }

        String cleanCategory =
            category.replaceAll('\\s+', '').toLowerCase();

        for (String key : categoryToEarningRateMap.keySet()) {

            String cleanKey =
                key.replaceAll('\\s+', '').toLowerCase();

            if (cleanKey.contains(cleanCategory) ||
                cleanCategory.contains(cleanKey)) {

                return categoryToEarningRateMap.get(key);
            }
        }

        return null;
    }

    // ============================================================
    // PART 3 METHODS WILL COME NEXT
    // ============================================================
    public static void sendBulkEmployeePayTemplates(
        ProcessingContext ctx
    ) {
        System.debug('🚀 ===== START sendBulkEmployeePayTemplates =====');

        try {

            if (ctx == null) {
                return;
            }

            if (
                ctx.employeePayloads == null ||
                ctx.employeePayloads.isEmpty() ) { return;
            }

            System.debug(
                '📊 Total Employee Payloads: ' +
                ctx.employeePayloads.size()
            );

            String employeePayloadJSON =
                JSON.serialize(ctx.employeePayloads);

            System.debug('📘 Employee Bulk Payload JSON:');
            System.debug(
                JSON.serializePretty(
                    JSON.deserializeUntyped(employeePayloadJSON)
                )
            );

            HttpRequest req = new HttpRequest();

            req.setEndpoint(
                'https://api.xero.com/payroll.xro/1.0/Employees'
            );

            req.setMethod('POST');

            req.setHeader(
                'Authorization',
                'Bearer ' + ctx.accessToken
            );

            req.setHeader(
                'Xero-tenant-id',
                ctx.tenantId
            );

            req.setHeader('Accept', 'application/json');

            req.setHeader(
                'Content-Type',
                'application/json'
            );

            req.setBody(employeePayloadJSON);

            Http http = new Http();
            HttpResponse res = http.send(req);

            System.debug(
                '📥 Employee Bulk Response Status: ' +
                res.getStatusCode()
            );

            System.debug(
                '📥 Employee Bulk Response Body: ' +
                res.getBody()
            );

            // SUCCESS
            if (
                res.getStatusCode() == 200 ||
                res.getStatusCode() == 201
            ) {
                System.debug('✅ Employee Bulk Update Success');
                return;
            }

            String body = res.getBody();

            System.debug('❌ Employee Bulk API Error');
            System.debug('❌ Response Body: ' + body);

            try {

                Map<String, Object> err =
                    (Map<String, Object>) JSON.deserializeUntyped(body);

                if (err.containsKey('Employees')) {

                    List<Object> failedEmployees =
                        (List<Object>) err.get('Employees');

                    for (Object obj : failedEmployees) {

                        Map<String, Object> employee =
                            (Map<String, Object>) obj;

                        String employeeId =
                            (String) employee.get('EmployeeID');

                        String errorMessage =
                            'Employee PayTemplate update failed';

                        if (employee.containsKey('ValidationErrors')) {

                            List<Object> validationErrors =
                                (List<Object>) employee.get('ValidationErrors');

                            if (!validationErrors.isEmpty()) {

                                Map<String, Object> firstError =
                                    (Map<String, Object>) validationErrors[0];

                                errorMessage =
                                    (String) firstError.get('Message');
                            }
                        }

                        StaffProcessingResult failed =
                            new StaffProcessingResult(
                                ctx.employeeIdToStaffId.get(employeeId),
                                ctx.employeeIdToStaffName.get(employeeId),
                                false,
                                errorMessage
                            );

                        failed.showInPopup = true;

                        ctx.results.add(failed);
                    }

                } else {

                    StaffProcessingResult failed =
                        new StaffProcessingResult(
                            null,
                            null,
                            false,
                            'Xero Employee API Error'
                        );

                    failed.showInPopup = true;

                    ctx.results.add(failed);
                }

            } catch (Exception parseEx) {

                System.debug(
                    '⚠️ Employee error parse failed: ' +
                    parseEx.getMessage()
                );

                String rawMessage = 'Xero Employee API Error';

                try { Map<String, Object> rawErr = (Map<String, Object>) JSON.deserializeUntyped(body); if ( rawErr != null && rawErr.containsKey('Message') ) { rawMessage = (String) rawErr.get('Message');
                    }
                } catch (Exception ignoreEx) {
                    System.debug(
                        '⚠️ Unable to read fallback Xero message'
                    );
                }

                StaffProcessingResult failed =
                    new StaffProcessingResult(
                        null,
                        'Xero',
                        false,
                        rawMessage
                    );

                failed.showInPopup = true;

                ctx.results.add(failed); } } catch (Exception e) {String exactError = e.getTypeName() + ' | ' + e.getMessage() + ' | Line: ' + e.getLineNumber(); StaffProcessingResult failed = new StaffProcessingResult( null, null, false, exactError); failed.showInPopup = true; ctx.results.add(failed);
        }
    }

    public static void sendBulkTimesheets(
        ProcessingContext ctx
    ) {
        System.debug('🚀 ===== START sendBulkTimesheets =====');

        try {
            if (ctx == null) {
                throw new AuraHandledException(
                    'Processing context is null.'
                );
            }

            if (
                ctx.timesheetPayloads == null ||
                ctx.timesheetPayloads.isEmpty() ) { return;
            }

            String payloadJSON =
                JSON.serialize(ctx.timesheetPayloads);

            System.debug(
                '📘 Timesheet Payload:\n' +
                JSON.serializePretty(
                    JSON.deserializeUntyped(payloadJSON)
                )
            );

            HttpRequest req = new HttpRequest();
            req.setEndpoint(
                'https://api.xero.com/payroll.xro/1.0/Timesheets'
            );
            req.setMethod('POST');
            req.setHeader(
                'Authorization',
                'Bearer ' + ctx.accessToken
            );
            req.setHeader(
                'Xero-tenant-id',
                ctx.tenantId
            );
            req.setHeader('Accept', 'application/json');
            req.setHeader('Content-Type', 'application/json');
            req.setBody(payloadJSON);

            Http http = new Http();
            HttpResponse res = http.send(req);

            System.debug(
                '📥 Xero Response Status: ' +
                res.getStatusCode()
            );

            System.debug(
                '📥 Xero Response Body: ' +
                res.getBody()
            );

            Map<String, Object> responseMap =
                (Map<String, Object>) JSON.deserializeUntyped(
                    res.getBody()
                );

            // Handle Xero ValidationException where Timesheets array is missing
            if (
                (res.getStatusCode() == 400 || res.getStatusCode() == 422) &&
                responseMap.containsKey('Message') && !responseMap.containsKey('Timesheets') ) { String xeroMessage = (String)responseMap.get('Message');

                System.debug('Top Level Xero Message: ' + xeroMessage);

                for (Object payloadObj : ctx.timesheetPayloads) {

                    Map<String, Object> payload =
                        (Map<String, Object>)payloadObj;

                    String employeeId =
                        (String)payload.get('EmployeeID');

                    StaffProcessingResult failed =
                        new StaffProcessingResult(
                            ctx.employeeIdToStaffId.get(employeeId),
                            ctx.employeeIdToStaffName.get(employeeId),
                            false,
                            xeroMessage
                        );

                    failed.showInPopup = true;

                    if (xeroMessage.toLowerCase().contains('already exists')) {

                        failed.message =
                            'This Time-sheet already exists in Xero.\n\n'
                            + 'Please update the existing timesheet in Xero instead of creating a new one.';
                    }

                    ctx.results.add(failed);
                }

                return;
            }

            // =====================================================
            // ERROR RESPONSE
            // =====================================================
            if (
                res.getStatusCode() != 200 &&
                res.getStatusCode() != 201
            ) {

                List<Object> failedTimesheets =
                    (List<Object>) responseMap.get('Timesheets');

                // Handle top-level errors where Timesheets is null
                if (failedTimesheets == null || failedTimesheets.isEmpty()) {

                    String xeroMessage = (String) responseMap.get('Message');

                    System.debug('Top Level Xero Message: ' + xeroMessage);

                    // Create a result for every employee in this request
                    for (String employeeId : ctx.employeeIdToStaffId.keySet()) {

                        Id staffId = ctx.employeeIdToStaffId.get(employeeId);
                        String staffName = ctx.employeeIdToStaffName.get(employeeId);

                        StaffProcessingResult failed =
                            new StaffProcessingResult(
                                staffId,
                                staffName,
                                false,
                                xeroMessage
                            );

                        failed.showInPopup = true;

                        if (!String.isBlank(xeroMessage) &&
                            xeroMessage.toLowerCase().contains('already exists')) {

                            failed.message =
                                'This Time-sheet already exists in Xero.\n\n'
                                + 'Please update the existing timesheet in Xero instead of creating a new one.';
                        }

                        ctx.results.add(failed);
                    }

                    return;
                }

                // Existing logic
                for (Object obj : failedTimesheets) {

                    Map<String, Object> ts =
                        (Map<String, Object>) obj;

                    String employeeId =
                        (String) ts.get('EmployeeID');

                    Id staffId =
                        ctx.employeeIdToStaffId.get(employeeId);

                    String staffName =
                        ctx.employeeIdToStaffName.get(employeeId);

                    String xeroMessage = 'Unknown Xero error';

                    List<Object> validationErrors =
                        (List<Object>) ts.get('ValidationErrors');

                    if (validationErrors != null && !validationErrors.isEmpty()) {

                        Map<String, Object> firstError =
                            (Map<String, Object>) validationErrors[0];

                        xeroMessage =
                            (String) firstError.get('Message'); } else if (ts.containsKey('Message')) { xeroMessage = (String) ts.get('Message');
                    }

                    StaffProcessingResult failed =
                        new StaffProcessingResult(
                            staffId,
                            staffName,
                            false,
                            xeroMessage
                        );

                    failed.showInPopup = true;

                    if (
                        !String.isBlank(xeroMessage) &&
                        xeroMessage.containsIgnoreCase('pay period')
                    ) {

                        failed.payPeriodMismatch = true;

                        Map<String, Object> xeroCycle =
                            getXeroPayrollCycle(
                                employeeId,
                                staffId,
                                ctx
                            );

                        if (
                            xeroCycle != null &&
                            xeroCycle.containsKey('payPeriodStart') &&
                            xeroCycle.containsKey('payPeriodEnd')
                        ) {

                            failed.suggestedStartDate =
                                (Date)xeroCycle.get('payPeriodStart');

                            failed.suggestedEndDate =
                                (Date)xeroCycle.get('payPeriodEnd');

                            failed.suggestedStartDay =
                                getDayName(failed.suggestedStartDate);

                            failed.suggestedEndDay =
                                getDayName(failed.suggestedEndDate);

                            failed.message =
                                'Selected dates do not match the employee pay period.';
                        }
                        else {

                            failed.payPeriodMismatch = false;
                            failed.message =
                                'Unable to determine the correct Xero pay period.';
                        }
                    }
                    else if (
                        !String.isBlank(xeroMessage) &&
                        xeroMessage.toLowerCase().contains('already exists')
                    ) {

                        failed.message =
                            'This Time-sheet already exists in Xero.\n\n'
                            + 'Please update the existing timesheet in Xero instead of creating a new one.';
                    }

                    ctx.results.add(failed);
                }

                return;
            }

            // =====================================================
            // SUCCESS
            // =====================================================
            List<Object> successTimesheets =
                (List<Object>) responseMap.get('Timesheets');

            if (
                successTimesheets == null ||
                successTimesheets.isEmpty()
            ) {
                return;
            }

            for (Object obj : successTimesheets) {

                Map<String, Object> ts =
                    (Map<String, Object>) obj;

                String employeeId =
                    (String) ts.get('EmployeeID');

                StaffProcessingResult success =
                    new StaffProcessingResult(
                        ctx.employeeIdToStaffId.get(
                            employeeId
                        ),
                        ctx.employeeIdToStaffName.get(
                            employeeId
                        ),
                        true,
                        'Timesheet sent successfully.'
                    );

                ctx.results.add(success);
            }

        } catch (Exception e) {
            System.debug(
                '💥 sendBulkTimesheets Error: ' +
                e.getMessage()
            );

            System.debug(
                '💥 Line: ' +
                e.getLineNumber()
            );

            throw new AuraHandledException(
                'Unexpected error while sending timesheets: ' +
                e.getMessage()
            );
        }
    }

    /* public static Map<String, Object> getXeroPayrollCycle(
        String employeeId,
        ProcessingContext ctx
    ) {
        try {

            Http http = new Http();

            // =====================================================
            // GET EMPLOYEE
            // =====================================================
            HttpRequest empReq = new HttpRequest();
            empReq.setEndpoint(
                'https://api.xero.com/payroll.xro/1.0/Employees/' +
                employeeId
            );
            empReq.setMethod('GET');
            empReq.setHeader(
                'Authorization',
                'Bearer ' + ctx.accessToken
            );
            empReq.setHeader(
                'Xero-tenant-id',
                ctx.tenantId
            );
            empReq.setHeader('Accept', 'application/json');

            HttpResponse empRes = http.send(empReq);

            if (empRes.getStatusCode() != 200) {
                return null;
            }

            Map<String, Object> empMap =
                (Map<String, Object>) JSON.deserializeUntyped(
                    empRes.getBody()
                );

            List<Object> employees =
                (List<Object>) empMap.get('Employees');

            if (employees == null || employees.isEmpty()) {
                return null;
            }

            Map<String, Object> emp =
                (Map<String, Object>) employees[0];

            String payrollCalendarId =
                (String) emp.get('PayrollCalendarID');

            if (String.isBlank(payrollCalendarId)) {
                return null;
            }

            // =====================================================
            // GET PAYROLL CALENDAR
            // =====================================================
            HttpRequest calReq = new HttpRequest();

            calReq.setEndpoint(
                'https://api.xero.com/payroll.xro/1.0/PayrollCalendars/' +
                payrollCalendarId
            );

            calReq.setMethod('GET');

            calReq.setHeader(
                'Authorization',
                'Bearer ' + ctx.accessToken
            );

            calReq.setHeader(
                'Xero-tenant-id',
                ctx.tenantId
            );

            calReq.setHeader('Accept', 'application/json');

            HttpResponse calRes = http.send(calReq);

            if (calRes.getStatusCode() != 200) {
                return null;
            }

            Map<String, Object> calMap =
                (Map<String, Object>) JSON.deserializeUntyped(
                    calRes.getBody()
                );

            List<Object> calendars =
                (List<Object>) calMap.get('PayrollCalendars');

            if (calendars == null || calendars.isEmpty()) {
                return null;
            }

            Map<String, Object> calendar =
                (Map<String, Object>) calendars[0];

            String calendarType =
                (String) calendar.get('CalendarType');

            String startDateRaw =
                (String) calendar.get('StartDate');

            Date anchorDate =
                parseXeroDate(startDateRaw);

            if (anchorDate == null) {
                return null;
            }

            // =====================================================
            // CALCULATE PAY PERIOD
            // =====================================================
            Date selectedDate = ctx.startDate;

            Integer cycleLength = 7;

            if (calendarType == 'FORTNIGHTLY') {
                cycleLength = 14;
            }

            Integer daysBetween =
                anchorDate.daysBetween(selectedDate);

            Integer remainder =
                Math.mod(daysBetween, cycleLength);

            if (remainder < 0) {
                remainder += cycleLength;
            }

            Date payPeriodStart =
                selectedDate.addDays(-remainder);

            Date payPeriodEnd =
                payPeriodStart.addDays(cycleLength - 1);

            Map<String, Object> result =
                new Map<String, Object>();

            result.put('payPeriodStart', payPeriodStart);
            result.put('payPeriodEnd', payPeriodEnd);
            result.put('calendarType', calendarType);

            System.debug(
                'Calculated Pay Period => ' +
                payPeriodStart +
                ' to ' +
                payPeriodEnd
            );

            return result;

        } catch (Exception e) {

            System.debug(
                'getXeroPayrollCycle Error: ' +
                e.getMessage()
            );

            return null;
        }
    } */

    public static Map<String, Object> getXeroPayrollCycle(
        String employeeId,
        Id staffId,
        ProcessingContext ctx
    ) {
        try {

            System.debug('🚀 ===== START getXeroPayrollCycle =====');
            System.debug('Employee ID: ' + employeeId);
            System.debug('Staff ID: ' + staffId);

            Http http = new Http();

            // =====================================================
            // GET EMPLOYEE
            // =====================================================
            HttpRequest empReq = new HttpRequest();
            empReq.setEndpoint(
                'https://api.xero.com/payroll.xro/1.0/Employees/' +
                employeeId
            );
            empReq.setMethod('GET');
            empReq.setHeader(
                'Authorization',
                'Bearer ' + ctx.accessToken
            );
            empReq.setHeader(
                'Xero-tenant-id',
                ctx.tenantId
            );
            empReq.setHeader('Accept', 'application/json');

            HttpResponse empRes = http.send(empReq);

            System.debug(
                'Employee API Status: ' +
                empRes.getStatusCode()
            );

            if (empRes.getStatusCode() != 200) { return null;
            }

            Map<String, Object> empMap =
                (Map<String, Object>) JSON.deserializeUntyped(
                    empRes.getBody()
                );

            List<Object> employees =
                (List<Object>) empMap.get('Employees');

            if (employees == null || employees.isEmpty()) { return null;
            }

            Map<String, Object> employee =
                (Map<String, Object>) employees[0];

            String payrollCalendarId =
                (String) employee.get('PayrollCalendarID');

            System.debug(
                'Payroll Calendar ID: ' +
                payrollCalendarId
            );

            if (String.isBlank(payrollCalendarId)) { return null;
            }

            // =====================================================
            // GET PAYROLL CALENDAR
            // =====================================================
            HttpRequest calReq = new HttpRequest();

            calReq.setEndpoint(
                'https://api.xero.com/payroll.xro/1.0/PayrollCalendars/' +
                payrollCalendarId
            );

            calReq.setMethod('GET');

            calReq.setHeader(
                'Authorization',
                'Bearer ' + ctx.accessToken
            );

            calReq.setHeader(
                'Xero-tenant-id',
                ctx.tenantId
            );

            calReq.setHeader('Accept', 'application/json');

            HttpResponse calRes = http.send(calReq);

            System.debug(
                'Calendar API Status: ' +
                calRes.getStatusCode()
            );

            System.debug(
                'Calendar API Body: ' +
                calRes.getBody()
            );

            if (calRes.getStatusCode() != 200) { return null;
            }

            Map<String, Object> calMap =
                (Map<String, Object>) JSON.deserializeUntyped(
                    calRes.getBody()
                );

            List<Object> calendars =
                (List<Object>) calMap.get('PayrollCalendars');

            if (calendars == null || calendars.isEmpty()) {  return null;
            }

            Map<String, Object> calendar =
                (Map<String, Object>) calendars[0];

            String calendarType =
                (String) calendar.get('CalendarType');

            String startDateRaw =
                (String) calendar.get('StartDate');

            System.debug(
                'Calendar Type: ' +
                calendarType
            );

            System.debug(
                'Calendar StartDate Raw: ' +
                startDateRaw
            );

            Date anchorDate =
                parseXeroDate(startDateRaw);

            if (anchorDate == null) {
                return null;
            }

            System.debug(
                'Anchor Date: ' +
                anchorDate
            );

            // =====================================================
            // CALCULATE PAY PERIOD
            // =====================================================
            Integer cycleLength = 7;

            if (
                !String.isBlank(calendarType) &&
                calendarType.equalsIgnoreCase('FORTNIGHTLY')
            ) {
                cycleLength = 14;
            }

            Date selectedDate = ctx.startDate;

            Integer daysBetween =
                anchorDate.daysBetween(selectedDate);

            Integer remainder =
                Math.mod(daysBetween, cycleLength);

            if (remainder < 0) {
                remainder += cycleLength;
            }

            Date payPeriodStart =
                selectedDate.addDays(-remainder);

            Date payPeriodEnd =
                payPeriodStart.addDays(
                    cycleLength - 1
                );

            System.debug(
                'Calculated Pay Period Start: ' +
                payPeriodStart
            );

            System.debug(
                'Calculated Pay Period End: ' +
                payPeriodEnd
            );

            // =====================================================
            // CHECK APPROVED SHIFTS
            // =====================================================
            List<ShiftwithStaff__c> approvedShifts = [
                SELECT Id
                FROM ShiftwithStaff__c
                WHERE Staff__c = :staffId
                AND Date__c >= :payPeriodStart
                AND Date__c <= :payPeriodEnd
                AND Approval_Status__c = 'Approved'
                LIMIT 1
            ];

            Boolean hasApprovedShifts =
                !approvedShifts.isEmpty();

            System.debug(
                'Has Approved Shifts: ' +
                hasApprovedShifts
            );

            // =====================================================
            // RETURN RESULT
            // =====================================================
            Map<String, Object> result =
                new Map<String, Object>();

            result.put(
                'payPeriodStart',
                payPeriodStart
            );

            result.put(
                'payPeriodEnd',
                payPeriodEnd
            );

            result.put(
                'calendarType',
                calendarType
            );

            result.put(
                'hasApprovedShifts',
                hasApprovedShifts
            );

            return result;

        } catch (Exception e) {

            System.debug(
                '❌ getXeroPayrollCycle Error: ' +
                e.getMessage()
            );

            System.debug(
                '❌ Line Number: ' +
                e.getLineNumber()
            );

            return null;
        }
    }

    public static Date parseXeroDate(String rawDate) {
        try {
            if (String.isBlank(rawDate)) {
                return null;
            }

            Pattern p = Pattern.compile('(\\d+)');
            Matcher m = p.matcher(rawDate);

            if (!m.find()) { return null;
            }

            Long millis = Long.valueOf(m.group(1));

            Datetime epoch =
                Datetime.newInstanceGMT(
                    1970,
                    1,
                    1,
                    0,
                    0,
                    0
                );

            Datetime dt =
                epoch.addSeconds(
                    Integer.valueOf(millis / 1000)
                );

            return dt.date(); } catch (Exception e) { return null;
        }
    }

    /* private static Map<String, Date> getEmployeePayPeriod(
        String employeeId,
        ProcessingContext ctx
    ) {
        try {
            System.debug('🚀 ===== START getEmployeePayPeriod =====');
            System.debug('Employee Id: ' + employeeId);
            System.debug('Selected Start Date: ' + ctx.startDate);

            Http http = new Http();

            HttpRequest req = new HttpRequest();
            req.setEndpoint(
                'https://api.xero.com/payroll.xro/1.0/Employees/' + employeeId
            );
            req.setMethod('GET');
            req.setHeader(
                'Authorization',
                'Bearer ' + ctx.accessToken
            );
            req.setHeader(
                'Xero-tenant-id',
                ctx.tenantId
            );
            req.setHeader('Accept', 'application/json');

            HttpResponse res = http.send(req);

            System.debug('Employee API Status: ' + res.getStatusCode());
            System.debug('Employee API Body: ' + res.getBody());

            if (res.getStatusCode() != 200) {
                return null;
            }

            Map<String, Object> empResponse =
                (Map<String, Object>) JSON.deserializeUntyped(
                    res.getBody()
                );

            List<Object> employees =
                (List<Object>) empResponse.get('Employees');

            if (employees == null || employees.isEmpty()) {
                return null;
            }

            Map<String, Object> emp =
                (Map<String, Object>) employees[0];

            String xeroStartDateRaw =
                (String) emp.get('StartDate');

            System.debug('Xero Employee StartDate Raw: ' + xeroStartDateRaw);

            if (String.isBlank(xeroStartDateRaw)) {
                return null;
            }

            Pattern p = Pattern.compile('(\\d+)');
            Matcher m = p.matcher(xeroStartDateRaw);

            if (!m.find()) {
                return null;
            }

            Long millis = Long.valueOf(m.group(1));

            Date xeroCycleAnchor =
                Datetime.newInstance(1970, 1, 1, 0, 0, 0)
                    .addMilliseconds(Integer.valueOf(millis))
                    .date();

            System.debug('Parsed Xero Anchor Date: ' + xeroCycleAnchor);

            Date selectedDate = ctx.startDate;

            Integer diff =
                Math.mod(
                    xeroCycleAnchor.daysBetween(selectedDate),
                    7
                );

            Date currentCycleStart =
                selectedDate.addDays(-diff);

            Date currentCycleEnd =
                currentCycleStart.addDays(6);

            Date previousCycleStart =
                currentCycleStart.addDays(-7);

            Date previousCycleEnd =
                currentCycleEnd.addDays(-7);

            System.debug(
                'Suggested Previous Cycle: ' +
                previousCycleStart +
                ' to ' +
                previousCycleEnd
            );

            Map<String, Date> result =
                new Map<String, Date>();

            result.put('start', previousCycleStart);
            result.put('end', previousCycleEnd);

            return result;

        } catch (Exception e) {
            System.debug(
                'getEmployeePayPeriod Error: ' +
                e.getMessage()
            );
            System.debug(
                'Line: ' +
                e.getLineNumber()
            );
            return null;
        }
    } */


    public static String getDayName(Date dt) {
        if (dt == null) { return null;
        }

        Datetime d = Datetime.newInstance(
            dt.year(),
            dt.month(),
            dt.day(),
            0,
            0,
            0
        );

        return d.format('EEEE');
    }

    // ============================================================
    // SEND SELECTED PAY PERIOD TIMESHEETS
    // ============================================================
    @AuraEnabled
    public static List<StaffProcessingResult> sendSelectedPayPeriodTimesheets(
        List<String> staffIds,
        List<String> startDates,
        List<String> endDates
    ) {
        System.debug('🚀 ===== START sendSelectedPayPeriodTimesheets =====');

        List<StaffProcessingResult> finalResults =
            new List<StaffProcessingResult>();

        try {

            System.debug(
                '📊 Staff IDs JSON:\n' +
                JSON.serializePretty(staffIds)
            );

            System.debug(
                '📊 Start Dates JSON:\n' +
                JSON.serializePretty(startDates)
            );

            System.debug(
                '📊 End Dates JSON:\n' +
                JSON.serializePretty(endDates)
            );

            if (
                staffIds == null ||
                startDates == null ||
                endDates == null ||
                staffIds.isEmpty() ||
                startDates.isEmpty() ||
                endDates.isEmpty()
            ) {
                System.debug('⚠️ No valid resend requests received.');

                StaffProcessingResult failed =
                    new StaffProcessingResult(
                        null,
                        null,
                        false,
                        'No staff selected for resend.'
                    );

                failed.showInPopup = true;
                finalResults.add(failed);

                return finalResults;
            }

            if (
                staffIds.size() != startDates.size() ||
                staffIds.size() != endDates.size() ) { StaffProcessingResult failed = new StaffProcessingResult( null, null, false, 'Invalid resend payload. Staff/date counts do not match.'); failed.showInPopup = true; finalResults.add(failed); return finalResults;
            }

            // ============================================================
            // XERO AUTH
            // ============================================================
            System.debug('🔹 Getting Xero credentials...');

            String accessToken;
            String tenantId;

            if (Test.isRunningTest()) {
                accessToken = 'dummy_access_token';
                tenantId = 'dummy_tenant_id'; } else { accessToken = XeroIntegrationController.getAccessTokenFromXero(); tenantId = XeroIntegrationController.getTenantId(accessToken);
            }

            System.debug(
                '🔹 Access Token Present: ' +
                !String.isBlank(accessToken)
            );

            System.debug(
                '🔹 Tenant ID: ' +
                tenantId
            );

            if (
                String.isBlank(accessToken) ||
                String.isBlank(tenantId) ) { StaffProcessingResult failed = new StaffProcessingResult( null, null, false, 'Missing Xero Access Token or Tenant ID.' ); failed.showInPopup = true; finalResults.add(failed); return finalResults;
            }

            // ============================================================
            // CURRENT USER ORG
            // ============================================================
            User currentUser = [
                SELECT Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            System.debug(
                '🏢 Current User Org: ' +
                currentUser.Organization_Name__c
            );

            Organisation__c orgRecord = [
                SELECT Id,
                    Name,
                    (
                        SELECT Id,
                            Name,
                            Earning_Rate_ID__c
                        FROM Xero_Earning_Rates__r
                    )
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];

            System.debug(
                '🏢 Organisation Loaded: ' +
                orgRecord.Name
            );

            Map<String, String> earningRateMap =
                new Map<String, String>();

            for (Xero_Earning_Rate__c rate :
                orgRecord.Xero_Earning_Rates__r) {

                if (
                    !String.isBlank(rate.Name) &&
                    !String.isBlank(rate.Earning_Rate_ID__c)
                ) {
                    earningRateMap.put(
                        rate.Name.trim().toLowerCase(),
                        rate.Earning_Rate_ID__c
                    );

                    System.debug(
                        '📋 Earning Rate Mapping: ' +
                        rate.Name +
                        ' → ' +
                        rate.Earning_Rate_ID__c
                    );
                }
            }

            System.debug(
                '📋 Total Earning Rate Mappings: ' +
                earningRateMap.size()
            );

            // ============================================================
            // PROCESS EACH STAFF
            // ============================================================
            for (Integer i = 0; i < staffIds.size(); i++) {

                try {

                    Id parsedStaffId =
                        Id.valueOf(staffIds[i]);

                    Date parsedStartDate =
                        Date.valueOf(startDates[i]);

                    Date parsedEndDate =
                        Date.valueOf(endDates[i]);

                    System.debug('================================================');
                    System.debug(
                        '🔹 Processing Staff: ' +
                        parsedStaffId
                    );
                    System.debug(
                        '📅 Start Date: ' +
                        parsedStartDate
                    );
                    System.debug(
                        '📅 End Date: ' +
                        parsedEndDate
                    );
                    System.debug('================================================');

                    Staff__c staff = [
                        SELECT Id,
                            NameToDisplay__c,
                            Display_Nickname__c,
                            Xero_Employee_ID__c,
                            Ordinary_Earnings_Rate_ID__c
                        FROM Staff__c
                        WHERE Id = :parsedStaffId
                        LIMIT 1
                    ];

                    System.debug(
                        '👤 Staff Loaded: ' +
                        staff.Display_Nickname__c
                    );

                    ProcessingContext ctx =
                        new ProcessingContext();

                    ctx.accessToken = accessToken;
                    ctx.tenantId = tenantId;
                    ctx.startDate = parsedStartDate;
                    ctx.endDate = parsedEndDate;
                    ctx.orgRecord = orgRecord;
                    ctx.categoryToEarningRateMap = earningRateMap;

                    // VALIDATION
                    if (String.isBlank(staff.Xero_Employee_ID__c)) {

                        StaffProcessingResult failed =
                            new StaffProcessingResult(
                                staff.Id,
                                staff.Display_Nickname__c,
                                false,
                                '❌ Missing Xero Employee ID for ' +
                                staff.Display_Nickname__c +
                                '. Please sync this staff record with Xero.'
                            );

                        failed.showInPopup = true;
                        finalResults.add(failed);
                        continue;
                    }

                    if (String.isBlank(staff.Ordinary_Earnings_Rate_ID__c)) {

                        StaffProcessingResult failed =
                            new StaffProcessingResult(
                                staff.Id,
                                staff.Display_Nickname__c,
                                false,
                                '❌ Missing Ordinary Earnings Rate ID for ' +
                                staff.Display_Nickname__c +
                                '. Please set it in Staff record.'
                            );

                        failed.showInPopup = true;
                        finalResults.add(failed);
                        continue;
                    }

                    System.debug(
                        '🚀 Calling processSingleStaffForBulk...'
                    );

                    processSingleStaffForBulk(
                        staff,
                        ctx
                    );

                    System.debug(
                        '📦 Employee Payload Count: ' +
                        ctx.employeePayloads.size()
                    );

                    System.debug(
                        '📦 Timesheet Payload Count: ' +
                        ctx.timesheetPayloads.size()
                    );

                    if (!ctx.employeePayloads.isEmpty()) {
                        System.debug(
                            '🚀 Sending Employee Pay Templates...'
                        );

                        sendBulkEmployeePayTemplates(ctx);
                    }

                    if (!ctx.timesheetPayloads.isEmpty()) {
                        System.debug(
                            '🚀 Sending Timesheets...'
                        );

                        sendBulkTimesheets(ctx);
                    }

                    System.debug(
                        '✅ Staff Results Count: ' +
                        ctx.results.size()
                    );

                    finalResults.addAll(ctx.results);

                } catch (Exception ex) {

                    String errorMessage;

                    if (ex instanceof AuraHandledException) { if (ex.getMessage() == 'Script-thrown exception') { errorMessage = 'No approved shifts found.'; } else { errorMessage = ex.getMessage();
                        }
                    } else {
                        errorMessage =
                            ex.getTypeName() +
                            ' | ' +
                            ex.getMessage() +
                            ' | Line: ' +
                            ex.getLineNumber();
                    }

                    System.debug(
                        '💥 Staff Processing Error: ' +
                        errorMessage
                    );

                    StaffProcessingResult failed =
                        new StaffProcessingResult(
                            null,
                            'Unknown',
                            false,
                            errorMessage
                        );

                    failed.showInPopup = true;
                    finalResults.add(failed);
                }
            }

            System.debug(
                '✅ Final Results Count: ' +
                finalResults.size()
            );

            System.debug(
                '🚀 ===== END sendSelectedPayPeriodTimesheets ====='
            );

            return finalResults;

        } catch (Exception e) {

            String exactError =
                e.getTypeName() +
                ' | ' +
                e.getMessage() +
                ' | Line: ' +
                e.getLineNumber();

            System.debug(
                '💥 FATAL ERROR in sendSelectedPayPeriodTimesheets: ' +
                exactError
            );

            StaffProcessingResult failed =
                new StaffProcessingResult(
                    null,
                    null,
                    false,
                    exactError
                );

            failed.showInPopup = true;
            finalResults.add(failed);

            return finalResults;
        }
    }


}