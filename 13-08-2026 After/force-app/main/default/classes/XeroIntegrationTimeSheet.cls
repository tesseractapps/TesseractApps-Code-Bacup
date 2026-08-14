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

        // New fields for Ordinary Earnings Rate handling
        @AuraEnabled public Boolean needsOrdinaryEarningsRateSync;
        @AuraEnabled public String fetchedOrdinaryEarningsRateId;

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
            this.needsOrdinaryEarningsRateSync = false;
            this.fetchedOrdinaryEarningsRateId = null;
        }
    }

    // ============================================================
    // EARNING RATE SELECTION WRAPPER
    // ============================================================
    public class EarningRateSelection {
        @AuraEnabled public String category;
        @AuraEnabled public String selectedEarningRateId;
        @AuraEnabled public List<EarningRateOption> availableRates;
        
        public EarningRateSelection() {
            this.availableRates = new List<EarningRateOption>();
        }
    }
    
    public class EarningRateOption {
        @AuraEnabled public String id;
        @AuraEnabled public String name;
        @AuraEnabled public String type;
        @AuraEnabled public Decimal ratePerUnit;
        @AuraEnabled public Boolean isMatched;
        @AuraEnabled public Boolean isOrdinary;
        
        public EarningRateOption() {
            this.isMatched = false;
            this.isOrdinary = false;
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

        // Tracking Item ID
        public String trackingItemId;
        
        // ✅ User selected earning rates (staffId -> category -> earningRateId)
        public Map<String, Map<String, String>> selectedCategoryRates;

        public ProcessingContext() {
            categoryToEarningRateMap = new Map<String, String>();

            employeePayloads = new List<Object>();
            timesheetPayloads = new List<Object>();

            employeeIdToStaffId = new Map<String, Id>();
            employeeIdToStaffName = new Map<String, String>();

            results = new List<StaffProcessingResult>();
            
            trackingItemId = null;
            selectedCategoryRates = new Map<String, Map<String, String>>();  // ← ADD THIS
        }
    }

    // ============================================================
    // NEW METHOD: INSERT BULK TIMESHEET WITH SELECTED RATES (FIXED)
    // ============================================================
    @AuraEnabled
    public static List<XeroResult> insertBulkTimeSheetWithSelectedRates(
        List<Id> staffIds,
        String startDateStr,
        String endDateStr,
        Map<Id, Map<String, String>> categoryRateSelections
    ) {
        System.debug('🚀 =========== START insertBulkTimeSheetWithSelectedRates ===========');
        System.debug('🚀 Staff Count: ' + staffIds?.size());
        System.debug('🚀 Start Date: ' + startDateStr);
        System.debug('🚀 End Date: ' + endDateStr);
        System.debug('📋 Rate Selections: ' + JSON.serialize(categoryRateSelections));
        
        List<XeroResult> results = new List<XeroResult>();
        
        try {
            // Convert dates
            Date startDate = Date.valueOf(startDateStr);
            Date endDate = Date.valueOf(endDateStr);
            System.debug('✅ Date Conversion Complete');
            System.debug('Start Date: ' + startDate);
            System.debug('End Date: ' + endDate);
            
            // Get Xero credentials using existing method
            System.debug('🔹 Getting Xero credentials...');
            String accessToken = XeroIntegrationController.getAccessTokenFromXero();
            String tenantId = XeroIntegrationController.getTenantId(accessToken);
            
            if (String.isBlank(accessToken) || String.isBlank(tenantId)) {
                for (Id staffId : staffIds) {
                    XeroResult error = new XeroResult(
                        staffId,
                        'Unknown Staff',
                        false,
                        'Failed to get Xero credentials. Please check your Xero connection.'
                    );
                    error.showInPopup = true;
                    results.add(error);
                }
                return results;
            }
            System.debug('✅ Xero Credentials Ready');
            
            // Create temporary context for tracking item
            ProcessingContext tempCtx = new ProcessingContext();
            tempCtx.accessToken = accessToken;
            tempCtx.tenantId = tenantId;
            
            // Get tracking item ID
            String trackingItemId = fetchTrackingItemIdFromXero(tempCtx);
            System.debug('🏷️ Tracking Item ID: ' + trackingItemId);
            
            // Process each staff member
            for (Id staffId : staffIds) {
                try {
                    System.debug('🔄 Processing staff: ' + staffId);
                    
                    // Get staff details
                    Staff__c staff = [SELECT Id, NameToDisplay__c, Display_Nickname__c, Xero_Employee_ID__c, Ordinary_Earnings_Rate_ID__c 
                                    FROM Staff__c WHERE Id = :staffId LIMIT 1];
                    
                    String staffName = staff.Display_Nickname__c != null ? staff.Display_Nickname__c : staff.NameToDisplay__c;
                    String xeroEmployeeId = staff.Xero_Employee_ID__c;
                    
                    if (String.isBlank(xeroEmployeeId)) {
                        XeroResult error = new XeroResult(
                            staffId,
                            staffName,
                            false,
                            'Not synced with Xero. Please sync before sending timesheets.'
                        );
                        error.showInPopup = true;
                        results.add(error);
                        continue;
                    }
                    
                    // Get approved shifts for this staff
                    List<ShiftwithStaff__c> shifts = [
                        SELECT Id, Date__c, Actual_Duration__c, Broken_Extended_Duration__c, 
                            Broken_Shift_Allowance__c, Broken_Extended_Rate__c, Shift_Category__c,
                            Custom_Rate_Per_Hrs__c, Approval_Status__c, Staff_Hourly_Rate__c,
                            Shift_Type__c, Broken_Rate_Per_Hrs__c, Broken_Shift__c, Broken_Total_Duration__c,
                            Type_of_shift__c
                        FROM ShiftwithStaff__c 
                        WHERE Staff__c = :staffId 
                        AND Date__c >= :startDate 
                        AND Date__c <= :endDate 
                        AND Approval_Status__c = 'Approved'
                        AND (Broken_Shift__c = FALSE OR (Broken_Shift__c = TRUE AND Broken_Extended_Duration__c != NULL))
                        ORDER BY Date__c ASC
                    ];
                    
                    if (shifts.isEmpty()) {
                        XeroResult error = new XeroResult(
                            staffId,
                            staffName,
                            false,
                            'No approved shifts found for this period.'
                        );
                        error.showInPopup = true;
                        results.add(error);
                        continue;
                    }
                    
                    // 🔥 CRITICAL FIX: Get rate selections for this staff
                    Map<String, String> staffRateSelections = categoryRateSelections?.get(staffId);
                    if (staffRateSelections == null || staffRateSelections.isEmpty()) {
                        XeroResult error = new XeroResult(
                            staffId,
                            staffName,
                            false,
                            'No earning rate selections found.'
                        );
                        error.showInPopup = true;
                        results.add(error);
                        continue;
                    }
                    
                    System.debug('📋 Staff rate selections: ' + JSON.serialize(staffRateSelections));
                    
                    // Get the ordinary earnings rate as fallback
                    String ordinaryRateId = staff.Ordinary_Earnings_Rate_ID__c;
                    
                    // ============================================================
                    // 🔥 FIX: Calculate rates per category and build timesheet
                    // ============================================================
                    
                    // Build category to hours map
                    Map<String, Map<Date, Decimal>> categoryDateHoursMap = new Map<String, Map<Date, Decimal>>();
                    Map<String, Decimal> categoryRateMap = new Map<String, Decimal>();
                    
                    for (ShiftwithStaff__c shift : shifts) {
                        String categoryKey;
                        Decimal duration;
                        Decimal ratePerHour;
                        
                        if (shift.Broken_Shift__c) {
                            categoryKey = 'broken shift';
                            duration = shift.Broken_Total_Duration__c != null ? shift.Broken_Total_Duration__c : 0;
                            ratePerHour = shift.Broken_Rate_Per_Hrs__c != null ? shift.Broken_Rate_Per_Hrs__c : 0;
                        } else if (shift.Type_of_shift__c != null && shift.Type_of_shift__c.equalsIgnoreCase('Sleepover Shift')) {
                            categoryKey = 'Sleepover Shift';
                            duration = shift.Actual_Duration__c != null ? shift.Actual_Duration__c : 0;
                            
                            // 🔥 FIX: Staff_Hourly_Rate__c is the total allowance, divide by duration to get rate per hour
                            Decimal totalAllowance = shift.Staff_Hourly_Rate__c != null ? shift.Staff_Hourly_Rate__c : 0;
                            if (duration > 0 && totalAllowance > 0) {
                                ratePerHour = (totalAllowance / duration).setScale(2);
                            } else {
                                ratePerHour = 0;
                            }
                        }   else {
                            if (String.isBlank(shift.Shift_Category__c)) {
                                continue;
                            }
                            categoryKey = shift.Shift_Category__c.trim().toLowerCase();
                            duration = shift.Actual_Duration__c != null ? shift.Actual_Duration__c : 0;
                            ratePerHour = shift.Staff_Hourly_Rate__c != null ? shift.Staff_Hourly_Rate__c : 0;
                        }
                        
                        // Store the rate for this category (weighted average if multiple shifts)
                        if (!categoryRateMap.containsKey(categoryKey)) {
                            categoryRateMap.put(categoryKey, 0);
                        }
                        categoryRateMap.put(categoryKey, ratePerHour);
                        
                        if (!categoryDateHoursMap.containsKey(categoryKey)) {
                            categoryDateHoursMap.put(categoryKey, new Map<Date, Decimal>());
                        }
                        
                        Map<Date, Decimal> dateMap = categoryDateHoursMap.get(categoryKey);
                        Decimal existing = dateMap.containsKey(shift.Date__c) ? dateMap.get(shift.Date__c) : 0;
                        dateMap.put(shift.Date__c, existing + duration);
                    }
                    
                    // Build timesheet lines for each category
                    List<Object> timesheetLines = new List<Object>();
                    Set<String> addedRateIds = new Set<String>();
                    
                    for (String category : categoryDateHoursMap.keySet()) {
                        // 🔥 FIX: Get the selected rate from UI for this category
                        String earningRateId = staffRateSelections.get(category);
                        
                        // If no selection found, try case-insensitive match
                        if (String.isBlank(earningRateId)) {
                            earningRateId = getSelectedRateForCategory(staffRateSelections, category);
                        }
                        
                        // If still no selection, use ordinary rate as fallback
                        if (String.isBlank(earningRateId)) {
                            earningRateId = ordinaryRateId;
                            System.debug('⚠️ No selected rate for category ' + category + ', using ordinary rate: ' + earningRateId);
                        } else {
                            System.debug('✅ Using selected rate for category ' + category + ': ' + earningRateId);
                        }
                        
                        // Skip if already added
                        if (addedRateIds.contains(earningRateId)) {
                            continue;
                        }
                        
                        // Build units array for the week
                        List<Decimal> units = new List<Decimal>();
                        for (Date d = startDate; d <= endDate; d = d.addDays(1)) {
                            Map<Date, Decimal> dateMap = categoryDateHoursMap.get(category);
                            Decimal hours = dateMap != null && dateMap.containsKey(d) ? dateMap.get(d).setScale(2) : 0;
                            units.add(hours);
                        }
                        
                        // Get the actual rate value for this category
                        Decimal rateValue = categoryRateMap.get(category);
                        if (rateValue == null) {
                            rateValue = 0;
                        }
                        
                        System.debug('📊 Category: ' + category + ', Rate ID: ' + earningRateId + ', Rate Value: ' + rateValue + ', Hours: ' + units);
                        
                        // Create timesheet line with RatePerUnit
                        Map<String, Object> timesheetLine = new Map<String, Object>{
                            'EarningsRateID' => earningRateId,
                            'NumberOfUnits' => units,
                            'RatePerUnit' => rateValue  // ✅ Sends the actual rate to Xero
                        };
                        
                        // Add tracking item if available
                        if (!String.isBlank(trackingItemId)) {
                            timesheetLine.put('TrackingItemID', trackingItemId);
                        }
                        
                        timesheetLines.add(timesheetLine);
                        addedRateIds.add(earningRateId);
                    }
                    
                    // ============================================================
                    // 🔥 CRITICAL FIX: Also update the Pay Template with selected rates
                    // ============================================================
                    
                    // Build earnings lines for pay template using selected rates
                    List<Object> earningsLines = new List<Object>();
                    Set<String> addedEarningRateIds = new Set<String>();
                    
                    for (String category : categoryRateMap.keySet()) {
                        String earningRateId = staffRateSelections.get(category);
                        if (String.isBlank(earningRateId)) {
                            earningRateId = getSelectedRateForCategory(staffRateSelections, category);
                        }
                        if (String.isBlank(earningRateId)) {
                            continue;
                        }
                        
                        if (addedEarningRateIds.contains(earningRateId)) {
                            continue;
                        }
                        
                        Decimal rateValue = categoryRateMap.get(category);
                        if (rateValue == null) {
                            rateValue = 0;
                        }
                        
                        earningsLines.add(
                            new Map<String, Object>{
                                'EarningsRateID' => earningRateId,
                                'CalculationType' => 'ENTEREARNINGSRATE',
                                'RatePerUnit' => rateValue
                            }
                        );
                        addedEarningRateIds.add(earningRateId);
                    }
                    
                    // Ensure Ordinary Earnings Rate is included
                    if (!addedEarningRateIds.contains(ordinaryRateId) && String.isNotBlank(ordinaryRateId)) {
                        earningsLines.add(
                            new Map<String, Object>{
                                'EarningsRateID' => ordinaryRateId,
                                'CalculationType' => 'ENTEREARNINGSRATE',
                                'RatePerUnit' => 0
                            }
                        );
                    }
                    
                    // Send Employee Pay Template update
                    if (!earningsLines.isEmpty()) {
                        List<Object> employeePayload = new List<Object>();
                        employeePayload.add(
                            new Map<String, Object>{
                                'EmployeeID' => xeroEmployeeId,
                                'PayTemplate' => new Map<String, Object>{
                                    'EarningsLines' => earningsLines
                                }
                            }
                        );
                        
                        System.debug('📘 Employee Pay Template Payload: ' + JSON.serializePretty(employeePayload));
                        
                        // Send pay template
                        HttpRequest empReq = new HttpRequest();
                        empReq.setEndpoint('https://api.xero.com/payroll.xro/1.0/Employees');
                        empReq.setMethod('POST');
                        empReq.setHeader('Authorization', 'Bearer ' + accessToken);
                        empReq.setHeader('Xero-tenant-id', tenantId);
                        empReq.setHeader('Accept', 'application/json');
                        empReq.setHeader('Content-Type', 'application/json');
                        empReq.setBody(JSON.serialize(employeePayload));
                        
                        Http http = new Http();
                        HttpResponse empRes = http.send(empReq);
                        
                        System.debug('📥 Employee Pay Template Response Status: ' + empRes.getStatusCode());
                        if (empRes.getStatusCode() != 200 && empRes.getStatusCode() != 201) {
                            System.debug('⚠️ Pay Template update failed: ' + empRes.getBody());
                        }
                    }
                    
                    // Build timesheet payload
                    List<Map<String, Object>> timesheetPayload = new List<Map<String, Object>>();
                    timesheetPayload.add(new Map<String, Object>{
                        'EmployeeID' => xeroEmployeeId,
                        'StartDate' => startDateStr,
                        'EndDate' => endDateStr,
                        'Status' => 'DRAFT',
                        'TimesheetLines' => timesheetLines
                    });
                    
                    System.debug('📘 Timesheet Payload: ' + JSON.serializePretty(timesheetPayload));
                    
                    // Send to Xero
                    HttpRequest req = new HttpRequest();
                    req.setEndpoint('https://api.xero.com/payroll.xro/1.0/Timesheets');
                    req.setMethod('POST');
                    req.setHeader('Authorization', 'Bearer ' + accessToken);
                    req.setHeader('Xero-tenant-id', tenantId);
                    req.setHeader('Accept', 'application/json');
                    req.setHeader('Content-Type', 'application/json');
                    req.setBody(JSON.serialize(timesheetPayload));
                    
                    Http http2 = new Http();
                    HttpResponse response = http2.send(req);
                    
                    System.debug('📥 Xero Response Status: ' + response.getStatusCode());
                    System.debug('📥 Xero Response Body: ' + response.getBody());
                    
                    if (response.getStatusCode() == 200 || response.getStatusCode() == 201) {
                        XeroResult success = new XeroResult(
                            staffId,
                            staffName,
                            true,
                            'Timesheet sent successfully'
                        );
                        results.add(success);
                        System.debug('✅ Timesheet sent successfully for: ' + staffName);
                    } else {
                        // Parse error response
                        String errorMsg = 'Xero returned error: ' + response.getStatusCode();
                        Boolean isPayPeriodMismatch = false;
                        Date suggestedStart = null;
                        Date suggestedEnd = null;
                        String suggestedStartDay = null;
                        String suggestedEndDay = null;
                        
                        try {
                            Map<String, Object> errorResponse = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
                            
                            // Extract specific validation error
                            String specificErrorMessage = null;
                            if (errorResponse.containsKey('Timesheets')) {
                                List<Object> timesheets = (List<Object>) errorResponse.get('Timesheets');
                                if (timesheets != null && !timesheets.isEmpty()) {
                                    Map<String, Object> firstTimesheet = (Map<String, Object>) timesheets[0];
                                    if (firstTimesheet.containsKey('ValidationErrors')) {
                                        List<Object> validationErrors = (List<Object>) firstTimesheet.get('ValidationErrors');
                                        if (validationErrors != null && !validationErrors.isEmpty()) {
                                            Map<String, Object> firstError = (Map<String, Object>) validationErrors[0];
                                            specificErrorMessage = (String) firstError.get('Message');
                                        }
                                    }
                                }
                            }
                            
                            String rawMessage = specificErrorMessage;
                            if (String.isBlank(rawMessage) && errorResponse.containsKey('Message')) {
                                rawMessage = (String) errorResponse.get('Message');
                            }
                            
                            // Check for pay period mismatch
                            if (rawMessage != null && (rawMessage.containsIgnoreCase('pay period') || 
                                rawMessage.containsIgnoreCase('period doesn\'t correspond'))) {
                                
                                isPayPeriodMismatch = true;
                                errorMsg = 'The selected timesheet period does not match this person\'s Xero pay cycle.';
                                
                                Map<String, Object> xeroCycle = getXeroPayrollCycleForStaff(
                                    xeroEmployeeId,
                                    staffId,
                                    accessToken,
                                    tenantId,
                                    startDate
                                );
                                
                                if (xeroCycle != null && xeroCycle.containsKey('payPeriodStart') && 
                                    xeroCycle.containsKey('payPeriodEnd')) {
                                    suggestedStart = (Date) xeroCycle.get('payPeriodStart');
                                    suggestedEnd = (Date) xeroCycle.get('payPeriodEnd');
                                    suggestedStartDay = getDayName(suggestedStart);
                                    suggestedEndDay = getDayName(suggestedEnd);
                                    
                                    String formattedStartDate = formatDateForDisplay(suggestedStart);
                                    String formattedEndDate = formatDateForDisplay(suggestedEnd);
                                    errorMsg = 'The selected timesheet period does not match this person\'s Xero pay cycle.\n' +
                                        'The correct pay period is ' + formattedStartDate + ' to ' + formattedEndDate + '.';
                                }
                            } else if (rawMessage != null && rawMessage.containsIgnoreCase('already exists')) {
                                errorMsg = 'This timesheet already exists in Xero. Please delete the existing timesheet in Xero and try again.';
                            } else if (String.isNotBlank(specificErrorMessage)) {
                                errorMsg = specificErrorMessage;
                            } else if (rawMessage != null) {
                                errorMsg = rawMessage;
                            }
                            
                        } catch (Exception e) {
                            System.debug('⚠️ Error parsing Xero response: ' + e.getMessage());
                            errorMsg = 'Xero API Error: ' + response.getStatusCode();
                        }
                        
                        XeroResult error = new XeroResult(
                            staffId,
                            staffName,
                            false,
                            errorMsg
                        );
                        error.showInPopup = isPayPeriodMismatch;
                        error.payPeriodMismatch = isPayPeriodMismatch;
                        error.suggestedStartDate = suggestedStart;
                        error.suggestedEndDate = suggestedEnd;
                        error.suggestedStartDay = suggestedStartDay;
                        error.suggestedEndDay = suggestedEndDay;
                        results.add(error);
                        System.debug('❌ Failed to send timesheet for: ' + staffName + ' - Error: ' + errorMsg);
                    }
                    
                } catch (Exception e) {
                    System.debug('❌ Error processing staff ' + staffId + ': ' + e.getMessage());
                    String staffName = 'Unknown Staff';
                    try {
                        Staff__c staff = [SELECT NameToDisplay__c FROM Staff__c WHERE Id = :staffId LIMIT 1];
                        staffName = staff.NameToDisplay__c;
                    } catch (Exception ex) {}
                    
                    XeroResult error = new XeroResult(
                        staffId,
                        staffName,
                        false,
                        'Error: ' + e.getMessage()
                    );
                    error.showInPopup = true;
                    results.add(error);
                }
            }
            
        } catch (Exception e) {
            System.debug('❌ Fatal error: ' + e.getMessage());
            for (Id staffId : staffIds) {
                String staffName = 'Unknown Staff';
                try {
                    Staff__c staff = [SELECT NameToDisplay__c FROM Staff__c WHERE Id = :staffId LIMIT 1];
                    staffName = staff.NameToDisplay__c;
                } catch (Exception ex) {}
                
                XeroResult error = new XeroResult(
                    staffId,
                    staffName,
                    false,
                    'System error: ' + e.getMessage()
                );
                error.showInPopup = true;
                results.add(error);
            }
        }
        
        System.debug('📊 Final Results: ' + JSON.serialize(results));
        return results;
    }

    // ============================================================
    // HELPER: FORMAT DATE FOR DISPLAY (e.g., "20/07/2026")
    // ============================================================
    public static String formatDateForDisplay(Date dt) {
        if (dt == null) return '';
        
        String day = String.valueOf(dt.day()).leftPad(2, '0');
        String month = String.valueOf(dt.month()).leftPad(2, '0');
        String year = String.valueOf(dt.year());
        
        return day + '/' + month + '/' + year;
    }

    // ============================================================
    // GET XERO PAYROLL CYCLE FOR STAFF (FOR PAY PERIOD DETECTION)
    // ============================================================
    public static Map<String, Object> getXeroPayrollCycleForStaff(
        String employeeId,
        Id staffId,
        String accessToken,
        String tenantId,
        Date startDate
    ) {
        try {
            System.debug('🚀 ===== START getXeroPayrollCycleForStaff =====');
            System.debug('Employee ID: ' + employeeId);
            System.debug('Staff ID: ' + staffId);
            System.debug('Start Date: ' + startDate);

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
                'Bearer ' + accessToken
            );
            empReq.setHeader(
                'Xero-tenant-id',
                tenantId
            );
            empReq.setHeader('Accept', 'application/json');

            HttpResponse empRes = http.send(empReq);

            System.debug(
                'Employee API Status: ' +
                empRes.getStatusCode()
            );

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

            Map<String, Object> employee =
                (Map<String, Object>) employees[0];

            String payrollCalendarId =
                (String) employee.get('PayrollCalendarID');

            System.debug(
                'Payroll Calendar ID: ' +
                payrollCalendarId
            );

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
                'Bearer ' + accessToken
            );

            calReq.setHeader(
                'Xero-tenant-id',
                tenantId
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

            Integer daysBetween =
                anchorDate.daysBetween(startDate);

            Integer remainder =
                Math.mod(daysBetween, cycleLength);

            if (remainder < 0) {
                remainder += cycleLength;
            }

            Date payPeriodStart =
                startDate.addDays(-remainder);

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

            return result;

        } catch (Exception e) {
            System.debug(
                '❌ getXeroPayrollCycleForStaff Error: ' +
                e.getMessage()
            );
            System.debug(
                '❌ Line Number: ' +
                e.getLineNumber()
            );
            return null;
        }
    }

    // Helper class for return results
    public class XeroResult {
        @AuraEnabled public Id staffId { get; set; }
        @AuraEnabled public String staffName { get; set; }
        @AuraEnabled public Boolean success { get; set; }
        @AuraEnabled public String message { get; set; }
        
        // 🔥 ADD THESE FIELDS FOR POPUP HANDLING (SAME AS StaffProcessingResult)
        @AuraEnabled public Boolean showInPopup { get; set; }
        @AuraEnabled public Boolean payPeriodMismatch { get; set; }
        @AuraEnabled public Date suggestedStartDate { get; set; }
        @AuraEnabled public Date suggestedEndDate { get; set; }
        @AuraEnabled public String suggestedStartDay { get; set; }
        @AuraEnabled public String suggestedEndDay { get; set; }
        
        public XeroResult(Id staffId, String staffName, Boolean success, String message) {
            this.staffId = staffId;
            this.staffName = staffName;
            this.success = success;
            this.message = message;
            
            // Default values
            this.showInPopup = false;
            this.payPeriodMismatch = false;
            this.suggestedStartDate = null;
            this.suggestedEndDate = null;
            this.suggestedStartDay = null;
            this.suggestedEndDay = null;
        }
    }

    // ============================================================
    // FETCH STAFF EARNING RATES FOR UI (FROM XERO API)
    // ============================================================
    @AuraEnabled
    public static Map<String, Object> getStaffEarningRatesForUI(
        Id staffId,
        String startDateStr,
        String endDateStr
    ) {
        Map<String, Object> result = new Map<String, Object>();
        
        try {
            System.debug('🚀 ===== START getStaffEarningRatesForUI =====');
            System.debug('📍 Staff ID: ' + staffId);
            System.debug('📅 Start Date: ' + startDateStr);
            System.debug('📅 End Date: ' + endDateStr);
            
            // Get staff record
            Staff__c staff = [
                SELECT Id, 
                    Display_Nickname__c, 
                    Xero_Employee_ID__c,
                    Ordinary_Earnings_Rate_ID__c
                FROM Staff__c
                WHERE Id = :staffId
                LIMIT 1
            ];
            
            if (staff == null) {
                result.put('success', false);
                result.put('message', 'Staff not found');
                return result;
            }
            
            if (String.isBlank(staff.Xero_Employee_ID__c)) {
                result.put('success', false);
                result.put('message', 'Staff has no Xero Employee ID. Please sync this staff with Xero first.');
                return result;
            }
            
            // Get Xero credentials
            String accessToken = XeroIntegrationController.getAccessTokenFromXero();
            String tenantId = XeroIntegrationController.getTenantId(accessToken);
            
            if (String.isBlank(accessToken) || String.isBlank(tenantId)) {
                result.put('success', false);
                result.put('message', 'Failed to get Xero credentials. Please check your Xero connection.');
                return result;
            }
            
            // =====================================================
            // SINGLE API CALL: Fetch ALL earning rates from Xero
            // =====================================================
            System.debug('🔍 Fetching ALL earning rates from Xero (single API call)...');
            
            HttpRequest ratesReq = new HttpRequest();
            ratesReq.setEndpoint('https://api.xero.com/payroll.xro/2.0/EarningsRates');
            ratesReq.setMethod('GET');
            ratesReq.setHeader('Authorization', 'Bearer ' + accessToken);
            ratesReq.setHeader('Xero-tenant-id', tenantId);
            ratesReq.setHeader('Accept', 'application/json');
            
            Http http = new Http();
            HttpResponse ratesRes = http.send(ratesReq);
            
            System.debug('📥 Earnings Rates API Status: ' + ratesRes.getStatusCode());
            
            List<Map<String, Object>> allEarningRates = new List<Map<String, Object>>();
            String ordinaryRateId = staff.Ordinary_Earnings_Rate_ID__c;
            
            if (ratesRes.getStatusCode() == 200) {
                Map<String, Object> ratesMap = (Map<String, Object>) JSON.deserializeUntyped(ratesRes.getBody());
                List<Object> earningsRatesDetailed = (List<Object>) ratesMap.get('earningsRates');
                
                if (earningsRatesDetailed != null && !earningsRatesDetailed.isEmpty()) {
                    System.debug('📊 Found ' + earningsRatesDetailed.size() + ' earning rates in Xero');
                    
                    for (Object rateObj : earningsRatesDetailed) {
                        Map<String, Object> rate = (Map<String, Object>) rateObj;
                        String rateId = (String) rate.get('earningsRateID');
                        String name = (String) rate.get('name');
                        String rateType = (String) rate.get('rateType');
                        Decimal ratePerUnit = (Decimal) rate.get('ratePerUnit');
                        Decimal fixedAmount = (Decimal) rate.get('fixedAmount');
                        Boolean currentRecord = (Boolean) rate.get('currentRecord');
                        String typeOfUnits = (String) rate.get('typeOfUnits');
                        
                        System.debug('📋 Rate: ID=' + rateId + ', Name=' + name + ', Type=' + rateType + 
                                ', Current=' + currentRecord + ', Units=' + typeOfUnits + 
                                ', Rate=' + ratePerUnit + ', Fixed=' + fixedAmount);
                        
                        if (String.isNotBlank(rateId)) {
                            // FILTER 1: Only show active rates
                            if (currentRecord == null || !currentRecord) {
                                System.debug('⏭️ Skipping inactive rate: ' + name);
                                continue;
                            }
                            
                            // FILTER 2: Type of Units should be "Hours" or null
                            Boolean isValidUnits = false;
                            if (typeOfUnits == null) {
                                isValidUnits = true;
                            } else if (typeOfUnits.equalsIgnoreCase('Hours') || typeOfUnits.equalsIgnoreCase('1')) {
                                isValidUnits = true;
                            }
                            
                            if (!isValidUnits) {
                                System.debug('⏭️ Skipping rate with invalid units: ' + name + ' (Units: ' + typeOfUnits + ')');
                                continue;
                            }
                            
                            // FILTER 3: Rate per Unit should be 0 or null
                            Decimal effectiveRate = null;
                            if (ratePerUnit != null) {
                                effectiveRate = ratePerUnit;
                            } else if (fixedAmount != null) {
                                effectiveRate = fixedAmount;
                            }
                            
                            if (effectiveRate != null && effectiveRate != 0) {
                                System.debug('⏭️ Skipping rate with non-zero rate: ' + name + ' (Rate: ' + effectiveRate + ')');
                                continue;
                            }
                            
                            // RATE PASSED ALL FILTERS - ADD TO LIST
                            Map<String, Object> rateMap = new Map<String, Object>();
                            rateMap.put('id', rateId);
                            rateMap.put('name', name != null ? name : 'Unnamed Rate');
                            rateMap.put('rateType', rateType != null ? rateType : '');
                            rateMap.put('isCurrent', currentRecord != null ? currentRecord : false);
                            rateMap.put('typeOfUnits', typeOfUnits);
                            
                            if (ratePerUnit != null) {
                                rateMap.put('ratePerUnit', ratePerUnit);
                            } else if (fixedAmount != null) {
                                rateMap.put('ratePerUnit', fixedAmount);
                            } else {
                                rateMap.put('ratePerUnit', 0);
                            }
                            
                            // Check if this is the ordinary rate
                            if (ordinaryRateId != null && ordinaryRateId.equals(rateId)) {
                                rateMap.put('isOrdinary', true);
                            } else {
                                rateMap.put('isOrdinary', false);
                            }
                            
                            rateMap.put('isAssigned', false);
                            rateMap.put('isMatched', false);
                            
                            allEarningRates.add(rateMap);
                            System.debug('✅ Added rate: ' + name + ' (Units: ' + typeOfUnits + ', Rate: ' + effectiveRate + ')');
                        }
                    }
                }
                
                System.debug('✅ Found ' + allEarningRates.size() + ' total earning rates in Xero after filtering');
                
            } else {
                System.debug('⚠️ Earnings Rates API v2.0 failed with status: ' + ratesRes.getStatusCode());
                result.put('success', false);
                result.put('message', 'Failed to fetch earning rates from Xero. Status: ' + ratesRes.getStatusCode());
                result.put('earningRates', new List<Map<String, Object>>());
                result.put('categories', new List<Map<String, Object>>());
                return result;
            }
            
            // =====================================================
            // Get shift categories for this staff
            // =====================================================
            Date startDate = Date.valueOf(startDateStr);
            Date endDate = Date.valueOf(endDateStr);
            
            List<AggregateResult> shiftCategories = [
                SELECT Shift_Category__c
                FROM ShiftwithStaff__c
                WHERE Staff__c = :staffId
                AND Date__c >= :startDate
                AND Date__c <= :endDate
                AND Approval_Status__c = 'Approved'
                AND Shift_Category__c != null
                GROUP BY Shift_Category__c
            ];
            
            List<String> categories = new List<String>();
            for (AggregateResult ar : shiftCategories) {
                String category = (String) ar.get('Shift_Category__c');
                if (String.isNotBlank(category)) {
                    categories.add(category.trim());
                }
            }
            
            // Check if NO SHIFTS found for this staff in the selected period
            Integer totalShiftsInPeriod = [
                SELECT COUNT()
                FROM ShiftwithStaff__c
                WHERE Staff__c = :staffId
                AND Date__c >= :startDate
                AND Date__c <= :endDate
                AND Approval_Status__c = 'Approved'
            ];
            
            System.debug('📊 Total shifts in period: ' + totalShiftsInPeriod);
            System.debug('📊 Categories found: ' + categories);
            
            // =====================================================
            // CASE 1: No shifts at all in the period
            // =====================================================
            if (totalShiftsInPeriod == 0) {
                System.debug('⚠️ No approved shifts found for staff in selected period.');
                
                // Create a default category with all available rates
                Map<String, Object> catMap = new Map<String, Object>();
                catMap.put('category', 'General');
                
                // Filter rates - include all active rates
                List<Map<String, Object>> filteredRates = new List<Map<String, Object>>();
                for (Map<String, Object> rate : allEarningRates) {
                    Boolean isCurrent = (Boolean) rate.get('isCurrent');
                    if (isCurrent != null && isCurrent) {
                        filteredRates.add(rate);
                    }
                }
                
                catMap.put('matchedRateId', ordinaryRateId);
                catMap.put('availableRates', filteredRates);
                catMap.put('hasRates', !filteredRates.isEmpty());
                catMap.put('message', 'No approved shifts found for this period. Please select a rate for the default category.');
                
                List<Map<String, Object>> categoryOptions = new List<Map<String, Object>>();
                categoryOptions.add(catMap);
                
                result.put('success', true);
                result.put('staffId', staff.Id);
                result.put('staffName', staff.Display_Nickname__c);
                result.put('categories', categoryOptions);
                result.put('earningRates', allEarningRates);
                result.put('ordinaryEarningsRateId', ordinaryRateId);
                result.put('xeroEmployeeId', staff.Xero_Employee_ID__c);
                result.put('hasRates', !allEarningRates.isEmpty());
                result.put('noShiftsFound', true);
                
                System.debug('✅ No shifts found - returning default category with all rates');
                return result;
            }
            
            // =====================================================
            // CASE 2: Shifts found but no categories
            // =====================================================
            if (categories.isEmpty()) {
                System.debug('⚠️ Shifts found but no categories. Adding default "General" category.');
                categories.add('General');
            }
            
            // =====================================================
            // Build category to earning rate options
            // =====================================================
            List<Map<String, Object>> categoryOptions = new List<Map<String, Object>>();
            
            for (String category : categories) {
                Map<String, Object> catMap = new Map<String, Object>();
                catMap.put('category', category);
                
                // Filter earning rates based on category
                List<Map<String, Object>> filteredRates = filterRatesByCategory(category, allEarningRates);
                
                // If no rates found, show all rates as fallback
                if (filteredRates.isEmpty()) {
                    System.debug('⚠️ No matching rates for category: ' + category + '. Showing all rates as fallback.');
                    filteredRates = allEarningRates;
                }
                
                catMap.put('matchedRateId', ordinaryRateId);
                catMap.put('availableRates', filteredRates);
                catMap.put('hasRates', !filteredRates.isEmpty());
                
                if (filteredRates.isEmpty()) {
                    catMap.put('message', 'No earning rates found. Please create a rate in Xero with Type of Units = "Hours" and Rate per Unit = 0.');
                }
                
                categoryOptions.add(catMap);
            }
            
            result.put('success', true);
            result.put('staffId', staff.Id);
            result.put('staffName', staff.Display_Nickname__c);
            result.put('categories', categoryOptions);
            result.put('earningRates', allEarningRates);
            result.put('ordinaryEarningsRateId', ordinaryRateId);
            result.put('xeroEmployeeId', staff.Xero_Employee_ID__c);
            result.put('hasRates', !allEarningRates.isEmpty());
            result.put('noShiftsFound', false);
            
            System.debug('✅ Successfully fetched earning rates for ' + categories.size() + ' categories');
            System.debug('📋 Categories: ' + JSON.serialize(categories));
            System.debug('📋 Earning Rates Count: ' + allEarningRates.size());
            
        } catch (Exception e) {
            System.debug('❌ Error in getStaffEarningRatesForUI: ' + e.getMessage());
            System.debug('❌ Line: ' + e.getLineNumber());
            result.put('success', false);
            result.put('message', e.getMessage());
            result.put('categories', new List<Map<String, Object>>());
            result.put('earningRates', new List<Map<String, Object>>());
        }
        
        return result;
    }

    // ============================================================
    // HELPER: Filter rates by category
    // ============================================================
    public static List<Map<String, Object>> filterRatesByCategory(
        String category,
        List<Map<String, Object>> earningRates
    ) {
        if (String.isBlank(category) || earningRates == null || earningRates.isEmpty()) {
            return new List<Map<String, Object>>();
        }
        
        String categoryLower = category.toLowerCase().trim();
        List<String> keywords = new List<String>();
        
        // Add keywords based on category
        if (categoryLower.contains('sleepover')) {
            keywords.add('sleepover');
        }
        if (categoryLower.contains('morning')) {
            keywords.add('morning');
        }
        if (categoryLower.contains('afternoon')) {
            keywords.add('afternoon');
        }
        if (categoryLower.contains('night')) {
            keywords.add('night');
        }
        if (categoryLower.contains('broken')) {
            keywords.add('broken');
        }
        if (categoryLower.contains('custom')) {
            keywords.add('custom');
        }
        if (categoryLower.contains('general')) {
            keywords.add('general');
        }
        
        // If no specific keywords, split by spaces
        if (keywords.isEmpty()) {
            List<String> words = categoryLower.split(' ');
            for (String word : words) {
                if (word.length() > 2) {
                    keywords.add(word);
                }
            }
        }
        
        // If still no keywords, use the category itself
        if (keywords.isEmpty()) {
            keywords.add(categoryLower);
        }
        
        // Filter rates that match any keyword
        List<Map<String, Object>> filtered = new List<Map<String, Object>>();
        
        for (Map<String, Object> rate : earningRates) {
            String rateName = (String) rate.get('name');
            if (String.isNotBlank(rateName)) {
                String rateNameLower = rateName.toLowerCase().trim();
                Boolean isMatch = false;
                
                for (String keyword : keywords) {
                    if (rateNameLower.contains(keyword)) {
                        isMatch = true;
                        break;
                    }
                }
                
                if (isMatch) {
                    filtered.add(rate);
                }
            }
        }
        
        return filtered;
    }

    // ============================================================
    // FETCH EARNING RATES FROM XERO API - UPDATED WITH CORRECT ENDPOINT
    // ============================================================
    public static Map<String, Object> fetchEarningRatesFromXeroAPI(
        String xeroEmployeeId,
        String accessToken,
        String tenantId
    ) {
        Map<String, Object> result = new Map<String, Object>();
        
        try {
            System.debug('🚀 ===== START fetchEarningRatesFromXeroAPI =====');
            System.debug('🔍 Employee ID: ' + xeroEmployeeId);
            
            Http http = new Http();
            
            // =====================================================
            // GET EMPLOYEE DETAILS FROM XERO
            // =====================================================
            HttpRequest empReq = new HttpRequest();
            empReq.setEndpoint(
                'https://api.xero.com/payroll.xro/1.0/Employees/' + xeroEmployeeId
            );
            empReq.setMethod('GET');
            empReq.setHeader('Authorization', 'Bearer ' + accessToken);
            empReq.setHeader('Xero-tenant-id', tenantId);
            empReq.setHeader('Accept', 'application/json');
            
            HttpResponse empRes = http.send(empReq);
            
            System.debug('📥 Employee API Status: ' + empRes.getStatusCode());
            
            if (empRes.getStatusCode() != 200) {
                result.put('success', false);
                result.put('message', 'Failed to fetch employee details from Xero. Status: ' + empRes.getStatusCode());
                return result;
            }
            
            Map<String, Object> empMap = (Map<String, Object>) JSON.deserializeUntyped(empRes.getBody());
            List<Object> employees = (List<Object>) empMap.get('Employees');
            
            if (employees == null || employees.isEmpty()) {
                result.put('success', false);
                result.put('message', 'No employee found in Xero');
                return result;
            }
            
            Map<String, Object> employee = (Map<String, Object>) employees[0];
            
            // =====================================================
            // COLLECT RATES ASSIGNED TO EMPLOYEE (FOR REFERENCE)
            // =====================================================
            Set<String> assignedRateIds = new Set<String>();
            
            // 1. Check root level Ordinary Earnings Rate
            String ordinaryEarningsRateId = (String) employee.get('OrdinaryEarningsRateID');
            if (String.isNotBlank(ordinaryEarningsRateId)) {
                assignedRateIds.add(ordinaryEarningsRateId);
            }
            
            // 2. Check PayTemplate EarningsLines
            Map<String, Object> payTemplate = (Map<String, Object>) employee.get('PayTemplate');
            if (payTemplate != null) {
                List<Object> earningsLines = (List<Object>) payTemplate.get('EarningsLines');
                if (earningsLines != null && !earningsLines.isEmpty()) {
                    for (Object rateObj : earningsLines) {
                        Map<String, Object> rate = (Map<String, Object>) rateObj;
                        String rateId = (String) rate.get('EarningsRateID');
                        if (String.isNotBlank(rateId)) {
                            assignedRateIds.add(rateId);
                        }
                    }
                }
            }
            
            // 3. Check EarningsRates array in employee
            List<Object> earningsRates = (List<Object>) employee.get('EarningsRates');
            if (earningsRates != null && !earningsRates.isEmpty()) {
                for (Object rateObj : earningsRates) {
                    Map<String, Object> rate = (Map<String, Object>) rateObj;
                    String rateId = (String) rate.get('EarningsRateID');
                    if (String.isNotBlank(rateId)) {
                        assignedRateIds.add(rateId);
                    }
                }
            }
            
            // =====================================================
            // FETCH ALL EARNING RATES FROM XERO API V2.0
            // =====================================================
            System.debug('🔍 Fetching all Earnings Rates from Xero API v2.0...');
            
            HttpRequest ratesReq = new HttpRequest();
            ratesReq.setEndpoint('https://api.xero.com/payroll.xro/2.0/EarningsRates');
            ratesReq.setMethod('GET');
            ratesReq.setHeader('Authorization', 'Bearer ' + accessToken);
            ratesReq.setHeader('Xero-tenant-id', tenantId);
            ratesReq.setHeader('Accept', 'application/json');
            
            HttpResponse ratesRes = http.send(ratesReq);
            
            System.debug('📥 Earnings Rates API Status: ' + ratesRes.getStatusCode());
            
            if (ratesRes.getStatusCode() == 200) {
                Map<String, Object> ratesMap = (Map<String, Object>) JSON.deserializeUntyped(ratesRes.getBody());
                List<Object> earningsRatesDetailed = (List<Object>) ratesMap.get('earningsRates');
                
                if (earningsRatesDetailed != null && !earningsRatesDetailed.isEmpty()) {
                    System.debug('📊 Found ' + earningsRatesDetailed.size() + ' earning rates in Xero');
                    
                    // Build list of ALL rates from API
                    List<Map<String, Object>> allRatesList = new List<Map<String, Object>>();
                    
                    for (Object rateObj : earningsRatesDetailed) {
                        Map<String, Object> rate = (Map<String, Object>) rateObj;
                        String rateId = (String) rate.get('earningsRateID');
                        String name = (String) rate.get('name');
                        String rateType = (String) rate.get('rateType');
                        String earningsType = (String) rate.get('earningsType');
                        Decimal ratePerUnit = (Decimal) rate.get('ratePerUnit');
                        Decimal fixedAmount = (Decimal) rate.get('fixedAmount');
                        Boolean currentRecord = (Boolean) rate.get('currentRecord');
                        String typeOfUnits = (String) rate.get('typeOfUnits');
                        
                        System.debug('📋 Rate: ID=' + rateId + ', Name=' + name + ', Type=' + rateType + 
                                ', Current=' + currentRecord + ', Units=' + typeOfUnits + 
                                ', Rate=' + ratePerUnit + ', Fixed=' + fixedAmount);
                        
                        if (String.isNotBlank(rateId)) {
                            // =====================================================
                            // FILTER 1: Only show active rates (currentRecord = true)
                            // =====================================================
                            if (currentRecord == null || !currentRecord) {
                                System.debug('⏭️ Skipping inactive rate: ' + name);
                                continue;
                            }
                            
                            // =====================================================
                            // FILTER 2: Type of Units should be "Hours" or null
                            // =====================================================
                            // For RatePerUnit types, typeOfUnits should be "Hours"
                            // For FixedAmount types, typeOfUnits can be null
                            Boolean isValidUnits = false;
                            if (typeOfUnits == null) {
                                // FixedAmount type - allow null
                                isValidUnits = true;
                            } else if (typeOfUnits.equalsIgnoreCase('Hours') || typeOfUnits.equalsIgnoreCase('1')) {
                                // RatePerUnit type - should be "Hours" or "1"
                                isValidUnits = true;
                            }
                            
                            if (!isValidUnits) {
                                System.debug('⏭️ Skipping rate with invalid units: ' + name + ' (Units: ' + typeOfUnits + ')');
                                continue;
                            }
                            
                            // =====================================================
                            // FILTER 3: Rate per Unit should be 0 or null
                            // =====================================================
                            Decimal effectiveRate = null;
                            if (ratePerUnit != null) {
                                effectiveRate = ratePerUnit;
                            } else if (fixedAmount != null) {
                                effectiveRate = fixedAmount;
                            }
                            
                            // Only include rates where rate is 0 or null
                            if (effectiveRate != null && effectiveRate != 0) {
                                System.debug('⏭️ Skipping rate with non-zero rate: ' + name + ' (Rate: ' + effectiveRate + ')');
                                continue;
                            }
                            
                            // =====================================================
                            // RATE PASSED ALL FILTERS - ADD TO LIST
                            // =====================================================
                            Map<String, Object> rateMap = new Map<String, Object>();
                            rateMap.put('id', rateId);
                            rateMap.put('name', name != null ? name : 'Unnamed Rate');
                            rateMap.put('rateType', rateType != null ? rateType : '');
                            rateMap.put('earningsType', earningsType != null ? earningsType : '');
                            rateMap.put('isCurrent', currentRecord != null ? currentRecord : false);
                            rateMap.put('typeOfUnits', typeOfUnits);
                            
                            // Use ratePerUnit if available, otherwise fixedAmount
                            if (ratePerUnit != null) {
                                rateMap.put('ratePerUnit', ratePerUnit);
                            } else if (fixedAmount != null) {
                                rateMap.put('ratePerUnit', fixedAmount);
                            } else {
                                rateMap.put('ratePerUnit', 0);
                            }
                            
                            // Check if this rate is assigned to the employee
                            rateMap.put('isAssigned', assignedRateIds.contains(rateId));
                            
                            allRatesList.add(rateMap);
                            
                            System.debug('✅ Added rate: ' + name + ' (Units: ' + typeOfUnits + ', Rate: ' + effectiveRate + ')');
                        }
                    }
                    
                    result.put('earningRates', allRatesList);
                    result.put('allRatesCount', allRatesList.size());
                    result.put('assignedRatesCount', assignedRateIds.size());
                    
                    System.debug('✅ Found ' + allRatesList.size() + ' total earning rates in Xero after filtering');
                    System.debug('📌 Assigned to employee: ' + assignedRateIds.size());
                    
                } else {
                    System.debug('⚠️ No earning rates found in response');
                    result.put('earningRates', new List<Map<String, Object>>());
                }
            } else {
                System.debug('⚠️ Earnings Rates API v2.0 failed with status: ' + ratesRes.getStatusCode());
                result.put('earningRates', new List<Map<String, Object>>());
            }
            
            result.put('success', true);
            result.put('ordinaryEarningsRateId', ordinaryEarningsRateId);
            result.put('employeeId', xeroEmployeeId);
            
        } catch (Exception e) {
            System.debug('❌ Error in fetchEarningRatesFromXeroAPI: ' + e.getMessage());
            System.debug('❌ Line: ' + e.getLineNumber());
            result.put('success', false);
            result.put('message', e.getMessage());
            result.put('earningRates', new List<Map<String, Object>>());
        }
        
        return result;
    }

    // ============================================================
    // PROCESS SINGLE STAFF WITH SELECTED RATES
    // ============================================================
    public static void processSingleStaffForBulkWithSelectedRates(
        Staff__c staff,
        ProcessingContext ctx
    ) {
        System.debug('🚀 ===== START processSingleStaffForBulkWithSelectedRates =====');

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
            String errorMsg = 'No approved shifts found for ' + staff.Display_Nickname__c;
            System.debug('⚠️ ' + errorMsg);
            throw new AuraHandledException(errorMsg);
        }

        // ============================================================
        // CATEGORY RATE CALCULATIONS - WEIGHTED AVERAGE
        // ============================================================
        Map<String, Decimal> categoryTotalPay = new Map<String, Decimal>();
        Map<String, Decimal> categoryTotalHours = new Map<String, Decimal>();
        Map<String, Integer> categoryShiftCount = new Map<String, Integer>();

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
            if (String.isBlank(shift.Shift_Category__c)) {
                continue;
            }

            String categoryKey =
                shift.Shift_Category__c.trim().toLowerCase();

            Decimal effectiveRate;
            Decimal duration = shift.Actual_Duration__c != null ? shift.Actual_Duration__c : 0;

            if (categoryKey == 'custom') {

                if (shift.Custom_Rate_Per_Hrs__c == null) {
                    continue;
                }

                effectiveRate = shift.Custom_Rate_Per_Hrs__c;

            } else {

                if (shift.Staff_Hourly_Rate__c == null) {
                    continue;
                }

                effectiveRate = shift.Staff_Hourly_Rate__c;
            }

            // SLEEPOVER - Keep separate handling
            if (categoryKey.contains('sleepover')) {

                if (!sleepoverCategoryData.containsKey(categoryKey)) {
                    sleepoverCategoryData.put(
                        categoryKey,
                        new List<Decimal>{0, 0, 0}
                    );
                }

                List<Decimal> data =
                    sleepoverCategoryData.get(categoryKey);

                Decimal pay = duration > 0 ? effectiveRate * duration : 0;

                data[0] += pay;      // Total pay
                data[1] += duration; // Total hours
                data[2] += 1;        // Shift count

            } else {
                
                Decimal pay = duration > 0 ? effectiveRate * duration : 0;
                
                if (!categoryTotalPay.containsKey(categoryKey)) {
                    categoryTotalPay.put(categoryKey, 0);
                    categoryTotalHours.put(categoryKey, 0);
                    categoryShiftCount.put(categoryKey, 0);
                }
                
                categoryTotalPay.put(
                    categoryKey, 
                    categoryTotalPay.get(categoryKey) + pay
                );
                
                categoryTotalHours.put(
                    categoryKey, 
                    categoryTotalHours.get(categoryKey) + duration
                );
                
                categoryShiftCount.put(
                    categoryKey, 
                    categoryShiftCount.get(categoryKey) + 1
                );
            }
        }

        // ============================================================
        // CALCULATE WEIGHTED AVERAGE RATES FOR EACH CATEGORY
        // ============================================================
        Map<String, Decimal> categoryToHourlyRate = new Map<String, Decimal>();

        for (String categoryKey : categoryTotalPay.keySet()) {
            
            Decimal totalPay = categoryTotalPay.get(categoryKey);
            Decimal totalHours = categoryTotalHours.get(categoryKey);
            Integer shiftCount = categoryShiftCount.get(categoryKey);
            
            Decimal averageRate;
            
            if (totalHours > 0) {
                averageRate = (totalPay / totalHours).setScale(2);
            } else if (shiftCount > 0) {
                averageRate = (totalPay / shiftCount).setScale(2);
            } else {
                averageRate = 0;
            }
            
            categoryToHourlyRate.put(categoryKey, averageRate);
        }

        // BROKEN SHIFT RATE (Weighted Average)
        if (totalBrokenHours > 0) {
            Decimal finalBrokenRate =
                (totalBrokenPay / totalBrokenHours).setScale(2);
            categoryToHourlyRate.put(
                'broken shift',
                finalBrokenRate
            );
        }

        // SLEEPOVER FINAL RATES
        for (String categoryKey : sleepoverCategoryData.keySet()) {

            List<Decimal> data =
                sleepoverCategoryData.get(categoryKey);

            Decimal totalAmount = data[0];
            Decimal totalHours = data[1];
            Decimal shiftCount = data[2];

            if (totalHours > 0) {
                Decimal ratePerUnit =
                    (totalAmount / totalHours).setScale(2);
                categoryToHourlyRate.put(
                    categoryKey,
                    ratePerUnit
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

        System.debug('✅ Final Category Rates: ' + JSON.serializePretty(categoryToHourlyRate));

        // ============================================================
        // BUILD EMPLOYEE PAY TEMPLATE WITH SELECTED RATES
        // ============================================================
        List<Object> earningsLines =
            new List<Object>();

        // Get selected rates for this staff
        Map<String, String> staffSelectedRates = ctx.selectedCategoryRates != null 
            ? ctx.selectedCategoryRates.get(staff.Id) 
            : null;

        for (String category : categoryToHourlyRate.keySet()) {

            String matchedEarningRateId = null;
            
            // Use selected rate if available
            if (staffSelectedRates != null && staffSelectedRates.containsKey(category)) {
                matchedEarningRateId = staffSelectedRates.get(category);
                System.debug('✅ Using user-selected rate for category ' + category + ': ' + matchedEarningRateId);
            } else {
                // Fallback to matching logic
                matchedEarningRateId =
                    findMatchingEarningRate(
                        category,
                        ctx.categoryToEarningRateMap
                    );
                System.debug('⚠️ Using matched rate for category ' + category + ': ' + matchedEarningRateId);
            }

            if (String.isBlank(matchedEarningRateId)) {
                System.debug('⚠️ No earning rate for category: ' + category);
                continue;
            }

            Decimal rateValue = categoryToHourlyRate.get(category);

            earningsLines.add(
                new Map<String, Object>{
                    'EarningsRateID' => matchedEarningRateId,
                    'CalculationType' => 'ENTEREARNINGSRATE',
                    'RatePerUnit' => rateValue
                }
            );
        }

        Boolean hasOrdinaryRate = false;

        for (Object o : earningsLines) {
            Map<String, Object> row =
                (Map<String, Object>) o;

            if ((String) row.get('EarningsRateID') == ordinaryEarningsRateId) {
                hasOrdinaryRate = true;
                break;
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

            if (shift.Broken_Shift__c) {

                categoryKey = 'broken shift';

                duration =
                    shift.Broken_Total_Duration__c != null
                    ? shift.Broken_Total_Duration__c
                    : 0;

            } else {

                if (String.isBlank(shift.Shift_Category__c)) {
                    continue;
                }

                categoryKey =
                    shift.Shift_Category__c.trim().toLowerCase();

                duration =
                    shift.Actual_Duration__c != null
                    ? shift.Actual_Duration__c
                    : 0;
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
                dateMap.containsKey(shift.Date__c)
                ? dateMap.get(shift.Date__c)
                : 0;

            dateMap.put(
                shift.Date__c,
                existing + duration
            );
        }

        // ============================================================
        // TIMESHEET LINES WITH SELECTED RATES AND RATE PER UNIT 🔥 FIXED
        // ============================================================
        List<Object> timesheetLines =
            new List<Object>();

        for (String category : categoryDateHoursMap.keySet()) {

            String earningRateId = null;
            
            // Use selected rate if available
            if (staffSelectedRates != null && staffSelectedRates.containsKey(category)) {
                earningRateId = staffSelectedRates.get(category);
                System.debug('✅ Using user-selected rate for timesheet category ' + category + ': ' + earningRateId);
            } else {
                // Fallback to matching logic
                earningRateId =
                    findMatchingEarningRate(
                        category,
                        ctx.categoryToEarningRateMap
                    );
                System.debug('⚠️ Using matched rate for timesheet category ' + category + ': ' + earningRateId);
            }

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

            // 🔥 FIX: Get the rate value for this category
            Decimal rateValue = categoryToHourlyRate.get(category);
            if (rateValue == null) {
                rateValue = 0;
            }

            // 🔥 FIX: Create timesheet line with RatePerUnit
            Map<String, Object> timesheetLine = new Map<String, Object>{
                'EarningsRateID' => earningRateId,
                'NumberOfUnits' => units,
                'RatePerUnit' => rateValue  // ✅ THIS WAS MISSING - NOW ADDED
            };

            // Add Tracking Item ID if available
            if (!String.isBlank(ctx.trackingItemId)) {
                timesheetLine.put('TrackingItemID', ctx.trackingItemId);
                System.debug('🏷️ Added Tracking Item ID to timesheet line: ' + ctx.trackingItemId);
            }

            timesheetLines.add(timesheetLine);
        }

        // ============================================================
        // PREVENT EMPTY TIMESHEET SUBMISSION
        // ============================================================
        if (timesheetLines.isEmpty()) {
            String errorMsg = 'No valid timesheet lines found for ' + staff.Display_Nickname__c;
            System.debug('⚠️ ' + errorMsg);
            throw new AuraHandledException(errorMsg);
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

        System.debug('✅ Staff prepared with selected rates: ' + staff.Display_Nickname__c);
    }

    // ============================================================
    // HELPER: FIND MATCHING EARNING RATE FROM LIST
    // ============================================================
    public static String findMatchingEarningRateFromList(
        String category,
        List<Map<String, Object>> earningRates
    ) {
        if (String.isBlank(category) || earningRates == null || earningRates.isEmpty()) {
            return null;
        }
        
        String categoryLower = category.toLowerCase().trim();
        
        // First try exact match on name
        for (Map<String, Object> rate : earningRates) {
            String rateName = (String) rate.get('name');
            if (String.isNotBlank(rateName) && 
                rateName.toLowerCase().trim().equals(categoryLower)) {
                return (String) rate.get('id');
            }
        }
        
        // Try contains match
        for (Map<String, Object> rate : earningRates) {
            String rateName = (String) rate.get('name');
            if (String.isNotBlank(rateName)) {
                String rateNameLower = rateName.toLowerCase().trim();
                if (rateNameLower.contains(categoryLower) || 
                    categoryLower.contains(rateNameLower)) {
                    return (String) rate.get('id');
                }
            }
        }
        
        // Try special cases
        if (categoryLower.contains('sleepover')) {
            for (Map<String, Object> rate : earningRates) {
                String rateName = (String) rate.get('name');
                if (String.isNotBlank(rateName) && 
                    rateName.toLowerCase().trim().contains('sleepover')) {
                    return (String) rate.get('id');
                }
            }
        }
        
        if (categoryLower.equals('broken shift')) {
            for (Map<String, Object> rate : earningRates) {
                String rateName = (String) rate.get('name');
                if (String.isNotBlank(rateName) && 
                    rateName.toLowerCase().trim().contains('broken')) {
                    return (String) rate.get('id');
                }
            }
        }
        
        return null;
    }

    // ============================================================
    // FETCH ORDINARY EARNINGS RATE FROM XERO
    // ============================================================
    public static String fetchOrdinaryEarningsRateFromXero(
        String xeroEmployeeId,
        ProcessingContext ctx
    ) {
        try {
            System.debug('🚀 ===== START fetchOrdinaryEarningsRateFromXero =====');
            System.debug('🔍 Employee ID: ' + xeroEmployeeId);

            Http http = new Http();

            // =====================================================
            // GET EMPLOYEE DETAILS FROM XERO
            // =====================================================
            HttpRequest empReq = new HttpRequest();
            empReq.setEndpoint(
                'https://api.xero.com/payroll.xro/1.0/Employees/' +
                xeroEmployeeId
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
                '📥 Employee API Status: ' +
                empRes.getStatusCode()
            );

            if (empRes.getStatusCode() != 200) {
                System.debug('❌ Failed to fetch employee details');
                return null;
            }

            Map<String, Object> empMap =
                (Map<String, Object>) JSON.deserializeUntyped(
                    empRes.getBody()
                );

            List<Object> employees =
                (List<Object>) empMap.get('Employees');

            if (employees == null || employees.isEmpty()) {
                System.debug('❌ No employee found in response');
                return null;
            }

            Map<String, Object> employee =
                (Map<String, Object>) employees[0];

            // =====================================================
            // CHECK FOR ORDINARY EARNINGS RATE AT ROOT LEVEL
            // =====================================================
            String ordinaryEarningsRateId =
                (String) employee.get('OrdinaryEarningsRateID');

            if (!String.isBlank(ordinaryEarningsRateId)) {
                System.debug('✅ Found Ordinary Earnings Rate ID at root level: ' + ordinaryEarningsRateId);
                return ordinaryEarningsRateId;
            }

            // =====================================================
            // IF NOT FOUND AT ROOT, CHECK IN PAYTEMPLATE EARNINGSLINES
            // =====================================================
            System.debug('⚠️ OrdinaryEarningsRateID not found at root level, checking PayTemplate...');
            
            Map<String, Object> payTemplate =
                (Map<String, Object>) employee.get('PayTemplate');

            if (payTemplate != null) {
                List<Object> earningsLines =
                    (List<Object>) payTemplate.get('EarningsLines');

                if (earningsLines != null && !earningsLines.isEmpty()) {
                    
                    System.debug('📊 Found ' + earningsLines.size() + ' earnings lines in PayTemplate');
                    
                    // Look for the first earnings line that has RatePerUnit > 0 or is the primary rate
                    for (Object rateObj : earningsLines) {
                        Map<String, Object> rate =
                            (Map<String, Object>) rateObj;

                        String rateId =
                            (String) rate.get('EarningsRateID');
                        
                        String calculationType =
                            (String) rate.get('CalculationType');
                        
                        Decimal ratePerUnit =
                            (Decimal) rate.get('RatePerUnit');

                        System.debug(
                            '📋 Found Earnings Line: ' +
                            'ID: ' + rateId +
                            ' | Type: ' + calculationType +
                            ' | Rate: ' + ratePerUnit
                        );

                        // Use the first earnings line that has a rate or is not zero
                        if (!String.isBlank(rateId)) {
                            // Prefer rates that have a positive value or are the primary rate
                            if (ratePerUnit != null && ratePerUnit > 0) {
                                System.debug('✅ Using earnings rate from PayTemplate: ' + rateId + ' (Rate: ' + ratePerUnit + ')');
                                return rateId;
                            }
                        }
                    }

                    // If no rate with positive value found, use the first one
                    if (!earningsLines.isEmpty()) {
                        Map<String, Object> firstRate =
                            (Map<String, Object>) earningsLines[0];
                        
                        String firstRateId =
                            (String) firstRate.get('EarningsRateID');
                        
                        if (!String.isBlank(firstRateId)) {
                            System.debug('⚠️ Using first earnings rate from PayTemplate as fallback: ' + firstRateId);
                            return firstRateId;
                        }
                    }
                }
            }

            // =====================================================
            // CHECK IN EARNINGS RATES ARRAY (Alternative)
            // =====================================================
            System.debug('⚠️ Checking EarningsRates array...');
            
            List<Object> earningsRates =
                (List<Object>) employee.get('EarningsRates');

            if (earningsRates != null && !earningsRates.isEmpty()) {
                
                System.debug('📊 Found ' + earningsRates.size() + ' earnings rates in array');
                
                // Look for Ordinary Earnings Rate
                for (Object rateObj : earningsRates) {
                    Map<String, Object> rate =
                        (Map<String, Object>) rateObj;

                    String rateName =
                        (String) rate.get('Name');
                    
                    String rateType =
                        (String) rate.get('RateType');
                    
                    String rateId =
                        (String) rate.get('EarningsRateID');

                    System.debug(
                        '📋 Found Earnings Rate: ' +
                        rateName +
                        ' | Type: ' +
                        rateType +
                        ' | ID: ' +
                        rateId
                    );

                    // Check if this is the Ordinary Earnings Rate
                    if (!String.isBlank(rateName) &&
                        rateName.equalsIgnoreCase('Ordinary Earnings')) {

                        System.debug('✅ Found Ordinary Earnings Rate in array: ' + rateId);
                        return rateId;
                    }

                    // Alternative check by RateType
                    if (!String.isBlank(rateType) &&
                        rateType.equalsIgnoreCase('ORDINARYEARNINGS')) {

                        System.debug('✅ Found Ordinary Earnings Rate by type in array: ' + rateId);
                        return rateId;
                    }
                }

                // If no Ordinary Earnings found, use the first available rate
                if (!earningsRates.isEmpty()) {
                    Map<String, Object> firstRate =
                        (Map<String, Object>) earningsRates[0];
                    
                    String firstRateId =
                        (String) firstRate.get('EarningsRateID');
                    
                    if (!String.isBlank(firstRateId)) {
                        System.debug('⚠️ Using first rate from array as fallback: ' + firstRateId);
                        return firstRateId;
                    }
                }
            }

            // =====================================================
            // NO EARNINGS RATE FOUND AT ALL
            // =====================================================
            System.debug('❌ No earnings rate found in Xero for this employee');
            return null;

        } catch (Exception e) {
            System.debug(
                '❌ Error in fetchOrdinaryEarningsRateFromXero: ' +
                e.getMessage()
            );
            System.debug(
                '❌ Line: ' +
                e.getLineNumber()
            );
            return null;
        }
    }

    // ============================================================
    // PROCESS SINGLE STAFF FOR BULK (ORIGINAL)
    // ============================================================
    public static void processSingleStaffForBulk(
        Staff__c staff,
        ProcessingContext ctx
    ) {
        System.debug('🚀 ===== START processSingleStaffForBulk =====');

        String xeroEmployeeId = staff.Xero_Employee_ID__c;
        String ordinaryEarningsRateId = staff.Ordinary_Earnings_Rate_ID__c;

        // ============================================================
        // 🔥 CRITICAL: Fetch the ACTUAL Ordinary Earnings Rate from Xero
        // ============================================================
        String xeroOrdinaryRateId = fetchOrdinaryEarningsRateFromXero(xeroEmployeeId, ctx);
        
        if (String.isBlank(xeroOrdinaryRateId)) {
            String errorMsg = 'Could not fetch Ordinary Earnings Rate from Xero for ' + staff.Display_Nickname__c;
            System.debug('❌ ' + errorMsg);
            throw new AuraHandledException(errorMsg);
        }
        
        System.debug('✅ Fetched Ordinary Earnings Rate from Xero: ' + xeroOrdinaryRateId);
        
        // Use the Xero rate ID for the Pay Template
        String ordinaryRateIdToUse = xeroOrdinaryRateId;
        
        // Store staff mapping for bulk response handling
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
                Broken_Total_Duration__c,
                Type_of_shift__c
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
            String errorMsg = 'No approved shifts found for ' + staff.Display_Nickname__c;
            System.debug('⚠️ ' + errorMsg);
            throw new AuraHandledException(errorMsg);
        }

        // ============================================================
        // CATEGORY RATE CALCULATIONS - WEIGHTED AVERAGE
        // ============================================================
        Map<String, Decimal> categoryTotalPay = new Map<String, Decimal>();
        Map<String, Decimal> categoryTotalHours = new Map<String, Decimal>();
        Map<String, Integer> categoryShiftCount = new Map<String, Integer>();

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

            // SLEEPOVER SHIFT - Check by Type_of_shift__c
            if (shift.Type_of_shift__c != null && 
                shift.Type_of_shift__c.equalsIgnoreCase('Sleepover Shift')) {
                
                String categoryKey = 'Sleepover Shift';
                Decimal effectiveRate = shift.Staff_Hourly_Rate__c != null ? shift.Staff_Hourly_Rate__c : 0;
                Decimal duration = shift.Actual_Duration__c != null ? shift.Actual_Duration__c : 0;
                
                // 🔥 FIX: Calculate rate per hour (effectiveRate / duration)
                Decimal ratePerHour = 0;
                if (duration > 0 && effectiveRate > 0) {
                    ratePerHour = (effectiveRate / duration).setScale(2);
                }
                
                // Calculate pay using the rate per hour
                Decimal pay = duration > 0 ? ratePerHour * duration : 0;
                
                System.debug('🛌 Sleepover Shift - Rate: ' + effectiveRate + ', Duration: ' + duration + ', Rate Per Hour: ' + ratePerHour + ', Pay: ' + pay);
                
                if (!sleepoverCategoryData.containsKey(categoryKey)) {
                    sleepoverCategoryData.put(
                        categoryKey,
                        new List<Decimal>{0, 0, 0}
                    );
                }

                List<Decimal> data =
                    sleepoverCategoryData.get(categoryKey);

                data[0] += pay;      // Total pay
                data[1] += duration; // Total hours
                data[2] += 1;        // Shift count
                
                continue;
            }

            // NORMAL SHIFT
            if (String.isBlank(shift.Shift_Category__c)) {
                continue;
            }

            String categoryKey =
                shift.Shift_Category__c.trim().toLowerCase();

            Decimal effectiveRate;
            Decimal duration = shift.Actual_Duration__c != null ? shift.Actual_Duration__c : 0;

            if (categoryKey == 'custom') {

                if (shift.Custom_Rate_Per_Hrs__c == null) {
                    continue;
                }

                effectiveRate = shift.Custom_Rate_Per_Hrs__c;

            } else {

                if (shift.Staff_Hourly_Rate__c == null) {
                    continue;
                }

                effectiveRate = shift.Staff_Hourly_Rate__c;
            }

            // SLEEPOVER - Keep separate handling (by Shift_Category__c as fallback)
            if (categoryKey.contains('sleepover')) {

                if (!sleepoverCategoryData.containsKey(categoryKey)) {
                    sleepoverCategoryData.put(
                        categoryKey,
                        new List<Decimal>{0, 0, 0}
                    );
                }

                List<Decimal> data =
                    sleepoverCategoryData.get(categoryKey);

                Decimal pay = duration > 0 ? effectiveRate * duration : 0;

                data[0] += pay;      // Total pay
                data[1] += duration; // Total hours
                data[2] += 1;        // Shift count

            } else {
                
                Decimal pay = duration > 0 ? effectiveRate * duration : 0;
                
                if (!categoryTotalPay.containsKey(categoryKey)) {
                    categoryTotalPay.put(categoryKey, 0);
                    categoryTotalHours.put(categoryKey, 0);
                    categoryShiftCount.put(categoryKey, 0);
                }
                
                categoryTotalPay.put(
                    categoryKey, 
                    categoryTotalPay.get(categoryKey) + pay
                );
                
                categoryTotalHours.put(
                    categoryKey, 
                    categoryTotalHours.get(categoryKey) + duration
                );
                
                categoryShiftCount.put(
                    categoryKey, 
                    categoryShiftCount.get(categoryKey) + 1
                );
            }
        }

        // ============================================================
        // CALCULATE WEIGHTED AVERAGE RATES FOR EACH CATEGORY
        // ============================================================
        Map<String, Decimal> categoryToHourlyRate = new Map<String, Decimal>();

        for (String categoryKey : categoryTotalPay.keySet()) {
            
            Decimal totalPay = categoryTotalPay.get(categoryKey);
            Decimal totalHours = categoryTotalHours.get(categoryKey);
            Integer shiftCount = categoryShiftCount.get(categoryKey);
            
            System.debug('📊 Category: ' + categoryKey);
            System.debug('   Total Pay: ' + totalPay);
            System.debug('   Total Hours: ' + totalHours);
            System.debug('   Shift Count: ' + shiftCount);
            
            Decimal averageRate;
            
            if (totalHours > 0) {
                averageRate = (totalPay / totalHours).setScale(2);
                System.debug('   Weighted Average Rate (by hours): ' + averageRate);
            } else if (shiftCount > 0) {
                averageRate = (totalPay / shiftCount).setScale(2);
                System.debug('   Simple Average Rate (by shift count): ' + averageRate);
            } else {
                averageRate = 0;
            }
            
            categoryToHourlyRate.put(categoryKey, averageRate);
        }

        // ============================================================
        // BROKEN SHIFT RATE (Weighted Average)
        // ============================================================
        if (totalBrokenHours > 0) {

            Decimal finalBrokenRate =
                (totalBrokenPay / totalBrokenHours).setScale(2);

            categoryToHourlyRate.put(
                'broken shift',
                finalBrokenRate
            );
            
            System.debug('📊 Broken Shift:');
            System.debug('   Total Pay: ' + totalBrokenPay);
            System.debug('   Total Hours: ' + totalBrokenHours);
            System.debug('   Weighted Average Rate: ' + finalBrokenRate);
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

            System.debug('📊 Sleepover Category: ' + categoryKey);
            System.debug('   Total Pay: ' + totalAmount);
            System.debug('   Total Hours: ' + totalHours);
            System.debug('   Shift Count: ' + shiftCount);

            if (totalHours > 0) {

                Decimal ratePerUnit =
                    (totalAmount / totalHours).setScale(2);

                categoryToHourlyRate.put(
                    categoryKey,
                    ratePerUnit
                );
                
                System.debug('   Weighted Average Rate (by hours): ' + ratePerUnit);

            } else if (shiftCount > 0) {

                Decimal averageRate =
                    (totalAmount / shiftCount).setScale(2);

                categoryToHourlyRate.put(
                    categoryKey,
                    averageRate
                );
                
                System.debug('   Simple Average Rate (by shift count): ' + averageRate);
            }
        }

        System.debug('✅ Final Category Rates: ' + JSON.serializePretty(categoryToHourlyRate));

        // ============================================================
        // GET USER-SELECTED RATES FOR THIS STAFF
        // ============================================================
        Map<String, String> staffSelectedRates = ctx.selectedCategoryRates != null 
            ? ctx.selectedCategoryRates.get(staff.Id) 
            : null;
        
        System.debug('📋 User-selected rates for staff ' + staff.Display_Nickname__c + ': ' + JSON.serialize(staffSelectedRates));

        // ============================================================
        // BUILD EMPLOYEE PAY TEMPLATE - USE SELECTED RATES
        // ============================================================
        List<Object> earningsLines = new List<Object>();

        // Keep track of rates already added to avoid duplicates
        Set<String> addedRateIds = new Set<String>();
        
        // Flag to track if Ordinary Earnings Rate has been added
        Boolean ordinaryRateAdded = false;
        Decimal ordinaryRateValue = 0;

        for (String category : categoryToHourlyRate.keySet()) {

            String matchedEarningRateId = null;
            
            // ✅ FIRST: Try to use user-selected rate (case-insensitive match)
            matchedEarningRateId = getSelectedRateForCategory(staffSelectedRates, category);
            
            if (String.isNotBlank(matchedEarningRateId)) {
                System.debug('✅ Using user-selected rate for category ' + category + ': ' + matchedEarningRateId);
            }
            
            // ✅ SECOND: Try to find matching rate from org config (fallback)
            if (String.isBlank(matchedEarningRateId)) {
                matchedEarningRateId = findMatchingEarningRate(category, ctx.categoryToEarningRateMap);
                System.debug('⚠️ Using matched rate for category ' + category + ': ' + matchedEarningRateId);
            }
            
            // ✅ THIRD: 🔥 CRITICAL - Use the Xero Ordinary Rate if no match found
            if (String.isBlank(matchedEarningRateId)) {
                matchedEarningRateId = ordinaryRateIdToUse;
                System.debug('⚠️ Using Xero Ordinary Rate as fallback for category ' + category + ': ' + matchedEarningRateId);
            }

            // Skip if still blank
            if (String.isBlank(matchedEarningRateId)) {
                System.debug('⚠️ No earning rate for category: ' + category);
                continue;
            }

            Decimal rateValue = categoryToHourlyRate.get(category);
            
            // 🔥 CRITICAL: Check if this is the Xero Ordinary Earnings Rate
            if (matchedEarningRateId.equals(ordinaryRateIdToUse)) {
                ordinaryRateAdded = true;
                ordinaryRateValue = rateValue;
                System.debug('✅ This rate IS the Xero Ordinary Earnings Rate with value: ' + rateValue);
            }
            
            // Skip if this rate ID was already added (except if it's the ordinary rate, we'll handle it specially)
            if (addedRateIds.contains(matchedEarningRateId) && !matchedEarningRateId.equals(ordinaryRateIdToUse)) {
                System.debug('⏭️ Skipping duplicate rate: ' + matchedEarningRateId);
                continue;
            }
            
            // If ordinary rate was already added with a different category, update its value if this one is higher
            if (matchedEarningRateId.equals(ordinaryRateIdToUse) && addedRateIds.contains(matchedEarningRateId)) {
                // Find the existing ordinary rate in earningsLines and update its value
                for (Integer j = 0; j < earningsLines.size(); j++) {
                    Map<String, Object> existingLine = (Map<String, Object>) earningsLines[j];
                    String existingRateId = (String) existingLine.get('EarningsRateID');
                    if (existingRateId.equals(ordinaryRateIdToUse)) {
                        Decimal existingValue = (Decimal) existingLine.get('RatePerUnit');
                        // Keep the higher value (if new value is higher, update it)
                        if (rateValue > existingValue) {
                            existingLine.put('RatePerUnit', rateValue);
                            ordinaryRateValue = rateValue;
                            System.debug('🔄 Updated Ordinary Earnings Rate value from ' + existingValue + ' to ' + rateValue);
                        }
                        break;
                    }
                }
                continue; // Skip adding a new line
            }

            System.debug('✅ Adding Earning Line:');
            System.debug('   Category: ' + category);
            System.debug('   Rate: ' + rateValue);
            System.debug('   Earning Rate ID: ' + matchedEarningRateId);

            earningsLines.add(
                new Map<String, Object>{
                    'EarningsRateID' => matchedEarningRateId,
                    'CalculationType' => 'ENTEREARNINGSRATE',
                    'RatePerUnit' => rateValue
                }
            );
            
            addedRateIds.add(matchedEarningRateId);
        }

        // 🔥 CRITICAL FIX: Ensure Xero Ordinary Earnings Rate is always included
        if (String.isNotBlank(ordinaryRateIdToUse)) {
            if (!ordinaryRateAdded) {
                // Not added at all - add it with 0
                earningsLines.add(
                    new Map<String, Object>{
                        'EarningsRateID' => ordinaryRateIdToUse,
                        'CalculationType' => 'ENTEREARNINGSRATE',
                        'RatePerUnit' => 0
                    }
                );
                System.debug('➕ Added Xero Ordinary Earnings Rate with 0 (not found in categories)');
            } else {
                // Already added, but make sure it has a value (even if 0)
                System.debug('✅ Xero Ordinary Earnings Rate already included with value: ' + ordinaryRateValue);
            }
        } else {
            System.debug('⚠️ WARNING: No Xero Ordinary Earnings Rate ID found!');
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

            if (shift.Broken_Shift__c) {

                categoryKey = 'broken shift';

                duration =
                    shift.Broken_Total_Duration__c != null
                    ? shift.Broken_Total_Duration__c
                    : 0;

            } else if (shift.Type_of_shift__c != null && 
                    shift.Type_of_shift__c.equalsIgnoreCase('Sleepover Shift')) {
                
                categoryKey = 'Sleepover Shift';
                duration = shift.Actual_Duration__c != null ? shift.Actual_Duration__c : 0;

            } else {

                if (String.isBlank(shift.Shift_Category__c)) {
                    continue;
                }

                categoryKey =
                    shift.Shift_Category__c.trim().toLowerCase();

                duration =
                    shift.Actual_Duration__c != null
                    ? shift.Actual_Duration__c
                    : 0;
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
                dateMap.containsKey(shift.Date__c)
                ? dateMap.get(shift.Date__c)
                : 0;

            dateMap.put(
                shift.Date__c,
                existing + duration
            );
        }

        // ============================================================
        // TIMESHEET LINES - USE SELECTED RATES WITH RATE PER UNIT 🔥 FIXED
        // ============================================================
        List<Object> timesheetLines = new List<Object>();

        // Reset added rate set for timesheet lines
        addedRateIds = new Set<String>();

        for (String category : categoryDateHoursMap.keySet()) {

            String earningRateId = null;
            
            // ✅ FIRST: Try to use user-selected rate (case-insensitive match)
            earningRateId = getSelectedRateForCategory(staffSelectedRates, category);
            
            if (String.isNotBlank(earningRateId)) {
                System.debug('✅ Using user-selected rate for timesheet category ' + category + ': ' + earningRateId);
            }
            
            // ✅ SECOND: Try to find matching rate from org config (fallback)
            if (String.isBlank(earningRateId)) {
                earningRateId = findMatchingEarningRate(category, ctx.categoryToEarningRateMap);
                System.debug('⚠️ Using matched rate for timesheet category ' + category + ': ' + earningRateId);
            }
            
            // ✅ THIRD: 🔥 Use Xero Ordinary Rate as last resort
            if (String.isBlank(earningRateId)) {
                earningRateId = ordinaryRateIdToUse;
                System.debug('⚠️ Using Xero Ordinary Rate as fallback for timesheet category ' + category + ': ' + earningRateId);
            }

            if (String.isBlank(earningRateId) || addedRateIds.contains(earningRateId)) {
                if (String.isBlank(earningRateId)) {
                    System.debug('⚠️ No earning rate for timesheet category: ' + category);
                } else {
                    System.debug('⏭️ Skipping duplicate timesheet line for rate: ' + earningRateId);
                }
                continue;
            }

            List<Decimal> units = new List<Decimal>();

            for (Date d = ctx.startDate; d <= ctx.endDate; d = d.addDays(1)) {
                Decimal hrs = categoryDateHoursMap.get(category).containsKey(d)
                    ? categoryDateHoursMap.get(category).get(d).setScale(2)
                    : 0;
                units.add(hrs);
            }

            // 🔥 FIX: Get the rate value for this category
            Decimal rateValue = categoryToHourlyRate.get(category);
            if (rateValue == null) {
                rateValue = 0;
            }

            // 🔥 FIX: Create timesheet line with RatePerUnit
            Map<String, Object> timesheetLine = new Map<String, Object>{
                'EarningsRateID' => earningRateId,
                'NumberOfUnits' => units,
                'RatePerUnit' => rateValue  // ✅ THIS WAS MISSING - NOW ADDED
            };

            // Add Tracking Item ID if available
            if (!String.isBlank(ctx.trackingItemId)) {
                timesheetLine.put('TrackingItemID', ctx.trackingItemId);
                System.debug('🏷️ Added Tracking Item ID to timesheet line: ' + ctx.trackingItemId);
            }

            timesheetLines.add(timesheetLine);
            addedRateIds.add(earningRateId);
        }

        // ============================================================
        // PREVENT EMPTY TIMESHEET SUBMISSION
        // ============================================================
        if (timesheetLines.isEmpty()) {
            String errorMsg = 'No valid timesheet lines found for ' + staff.Display_Nickname__c;
            System.debug('⚠️ ' + errorMsg);
            throw new AuraHandledException(errorMsg);
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

    // ============================================================
    // FIND MATCHING EARNING RATE
    // ============================================================
    public static String findMatchingEarningRate(
        String category,
        Map<String, String> categoryToEarningRateMap
    ) {
        if (String.isBlank(category)) {
            return null;
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
    // SEND BULK EMPLOYEE PAY TEMPLATES
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
                ctx.employeePayloads.isEmpty()
            ) {
                System.debug('⚠️ No employee payloads to send.');
                return;
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

                try {
                    Map<String, Object> rawErr =
                        (Map<String, Object>) JSON.deserializeUntyped(body);

                    if (
                        rawErr != null &&
                        rawErr.containsKey('Message')
                    ) {
                        rawMessage =
                            (String) rawErr.get('Message');
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

                ctx.results.add(failed);
            }

        } catch (Exception e) {

            System.debug(
                '💥 Unexpected Error in sendBulkEmployeePayTemplates'
            );

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

            ctx.results.add(failed);
        }
    }

    // ============================================================
    // SEND BULK TIMESHEETS
    // ============================================================
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
                ctx.timesheetPayloads.isEmpty()
            ) {
                System.debug('⚠️ No timesheet payloads found.');
                return;
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

            // =====================================================
            // ERROR RESPONSE
            // =====================================================
            if (
                res.getStatusCode() != 200 &&
                res.getStatusCode() != 201
            ) {
                System.debug('❌ Xero Timesheet API Error - Status: ' + res.getStatusCode());
                System.debug('❌ Response Body: ' + res.getBody());
                
                // Try to get error message from response
                String globalErrorMessage = null;
                if (responseMap.containsKey('Message')) {
                    globalErrorMessage = (String) responseMap.get('Message');
                } else if (responseMap.containsKey('Type')) {
                    globalErrorMessage = (String) responseMap.get('Type');
                }
                
                List<Object> failedTimesheets =
                    (List<Object>) responseMap.get('Timesheets');

                if (failedTimesheets == null) {
                    failedTimesheets = new List<Object>();
                    
                    // If no timesheets in response, create a generic error
                    if (globalErrorMessage != null) {
                        StaffProcessingResult failed =
                            new StaffProcessingResult(
                                null,
                                'Xero',
                                false,
                                globalErrorMessage
                            );
                        failed.showInPopup = true;
                        ctx.results.add(failed);
                    }
                    return;
                }

                for (Object obj : failedTimesheets) {

                    Map<String, Object> ts =
                        (Map<String, Object>) obj;

                    String employeeId =
                        (String) ts.get('EmployeeID');

                    Id staffId =
                        ctx.employeeIdToStaffId.get(employeeId);

                    String staffName =
                        ctx.employeeIdToStaffName.get(employeeId);

                    String xeroMessage =
                        'Unknown Xero error';

                    List<Object> validationErrors =
                        (List<Object>) ts.get(
                            'ValidationErrors'
                        );

                    if (
                        validationErrors != null &&
                        !validationErrors.isEmpty()
                    ) {
                        Map<String, Object> firstError =
                            (Map<String, Object>) validationErrors[0];

                        xeroMessage =
                            (String) firstError.get('Message');
                    } else if (globalErrorMessage != null) {
                        xeroMessage = globalErrorMessage;
                    }

                    StaffProcessingResult failed =
                        new StaffProcessingResult(
                            staffId,
                            staffName,
                            false,
                            xeroMessage
                        );

                    failed.showInPopup = true;

                    // ============================================
                    // PAY PERIOD MISMATCH
                    // ============================================
                    if (
                        !String.isBlank(xeroMessage) &&
                        (xeroMessage.containsIgnoreCase('pay period') ||
                        xeroMessage.containsIgnoreCase('period doesn\'t correspond'))
                    ) {

                        failed.payPeriodMismatch = true;

                        Map<String, Object> xeroCycle =
                            getXeroPayrollCycle(
                                employeeId,
                                staffId,
                                ctx
                            );

                        System.debug(
                            'Xero Cycle JSON: ' +
                            JSON.serializePretty(xeroCycle)
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
                                getDayName(
                                    failed.suggestedStartDate
                                );

                            failed.suggestedEndDay =
                                getDayName(
                                    failed.suggestedEndDate
                                );

                            failed.message =
                                'The selected timesheet period does not match this staff member\'s Xero pay cycle (' +
                                failed.suggestedStartDay +
                                ' to ' +
                                failed.suggestedEndDay +
                                ').\n' +
                                'Please select the correct period: ' +
                                failed.suggestedStartDate +
                                ' to ' +
                                failed.suggestedEndDate +
                                '.';
                        }
                        else {

                            failed.payPeriodMismatch = false;

                            failed.message =
                                'Unable to determine the correct Xero pay period. Please check the employee\'s payroll calendar in Xero.';
                        }
                    }

                    // ============================================
                    // DUPLICATE
                    // ============================================
                    else if (
                        !String.isBlank(xeroMessage) &&
                        xeroMessage.containsIgnoreCase(
                            'already exists'
                        )
                    ) {
                        failed.message =
                            'This timesheet already exists in Xero. Please delete the existing timesheet in Xero and try again.';
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
            
            System.debug(
                '💥 Stack Trace: ' +
                e.getStackTraceString()
            );

            // Add the error to results
            StaffProcessingResult failed =
                new StaffProcessingResult(
                    null,
                    'Xero',
                    false,
                    'Error sending timesheet: ' + e.getMessage()
                );
            failed.showInPopup = true;
            ctx.results.add(failed);
        }
    }

    // ============================================================
    // GET XERO PAYROLL CYCLE
    // ============================================================
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

            Map<String, Object> employee =
                (Map<String, Object>) employees[0];

            String payrollCalendarId =
                (String) employee.get('PayrollCalendarID');

            System.debug(
                'Payroll Calendar ID: ' +
                payrollCalendarId
            );

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

            System.debug(
                'Calendar API Status: ' +
                calRes.getStatusCode()
            );

            System.debug(
                'Calendar API Body: ' +
                calRes.getBody()
            );

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

    // ============================================================
    // PARSE XERO DATE
    // ============================================================
    public static Date parseXeroDate(String rawDate) {
        try {
            if (String.isBlank(rawDate)) {
                return null;
            }

            Pattern p = Pattern.compile('(\\d+)');
            Matcher m = p.matcher(rawDate);

            if (!m.find()) {
                return null;
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

            return dt.date();

        } catch (Exception e) {
            System.debug(
                'parseXeroDate Error: ' +
                e.getMessage()
            );
            return null;
        }
    }

    // ============================================================
    // GET DAY NAME
    // ============================================================
    public static String getDayName(Date dt) {
        if (dt == null) {
            return null;
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
        List<String> endDates,
        Map<Id, Map<String, String>> categoryRateSelections
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
            
            System.debug(
                '📊 Category Rate Selections: ' +
                JSON.serializePretty(categoryRateSelections)
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
                staffIds.size() != endDates.size()
            ) {
                System.debug('❌ Payload size mismatch.');

                StaffProcessingResult failed =
                    new StaffProcessingResult(
                        null,
                        null,
                        false,
                        'Invalid resend payload. Staff/date counts do not match.'
                    );

                failed.showInPopup = true;
                finalResults.add(failed);

                return finalResults;
            }

            // ============================================================
            // XERO AUTH
            // ============================================================
            System.debug('🔹 Getting Xero credentials...');

            String accessToken;
            String tenantId;
            String trackingItemId;

            if (Test.isRunningTest()) {
                accessToken = 'dummy_access_token';
                tenantId = 'dummy_tenant_id';
                trackingItemId = 'dummy_tracking_item_id';
            } else {
                accessToken =
                    XeroIntegrationController.getAccessTokenFromXero();

                tenantId =
                    XeroIntegrationController.getTenantId(accessToken);
                
                // Create a temporary context for fetching tracking item
                ProcessingContext tempCtx = new ProcessingContext();
                tempCtx.accessToken = accessToken;
                tempCtx.tenantId = tenantId;
                
                trackingItemId = fetchTrackingItemIdFromXero(tempCtx);
                
                System.debug(
                    '🏷️ Tracking Item ID: ' +
                    trackingItemId
                );
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
                String.isBlank(tenantId)
            ) {
                System.debug('❌ Missing Xero credentials');

                StaffProcessingResult failed =
                    new StaffProcessingResult(
                        null,
                        null,
                        false,
                        'Missing Xero Access Token or Tenant ID.'
                    );

                failed.showInPopup = true;
                finalResults.add(failed);

                return finalResults;
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
            List<Staff__c> staffToUpdateList = new List<Staff__c>();

            for (Integer i = 0; i < staffIds.size(); i++) {

                Id parsedStaffId = null;
                Staff__c staff = null;
                ProcessingContext ctx = null;

                try {

                    parsedStaffId = Id.valueOf(staffIds[i]);

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

                    staff = [
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

                    ctx = new ProcessingContext();

                    ctx.accessToken = accessToken;
                    ctx.tenantId = tenantId;
                    ctx.trackingItemId = trackingItemId;
                    ctx.startDate = parsedStartDate;
                    ctx.endDate = parsedEndDate;
                    ctx.orgRecord = orgRecord;
                    ctx.categoryToEarningRateMap = earningRateMap;

                    // ============================================================
                    // ✅ PRESERVE RATE SELECTIONS FOR BULK MODE
                    // ============================================================
                    if (categoryRateSelections != null && categoryRateSelections.containsKey(parsedStaffId)) {
                        if (ctx.selectedCategoryRates == null) {
                            ctx.selectedCategoryRates = new Map<String, Map<String, String>>();
                        }
                        ctx.selectedCategoryRates.put(parsedStaffId, categoryRateSelections.get(parsedStaffId));
                        System.debug('📋 Added selected rates for staff: ' + parsedStaffId);
                        System.debug('📋 Rate selections: ' + JSON.serialize(ctx.selectedCategoryRates.get(parsedStaffId)));
                    }

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

                    // Check if Ordinary Earnings Rate exists
                    if (String.isBlank(staff.Ordinary_Earnings_Rate_ID__c)) {
                        
                        System.debug('🔍 Fetching earnings rate from Xero for: ' + staff.Display_Nickname__c);
                        
                        String fetchedRateId = fetchOrdinaryEarningsRateFromXero(
                            staff.Xero_Employee_ID__c,
                            ctx
                        );
                        
                        if (String.isBlank(fetchedRateId)) {
                            StaffProcessingResult failed =
                                new StaffProcessingResult(
                                    staff.Id,
                                    staff.Display_Nickname__c,
                                    false,
                                    '❌ Please update the Ordinary Earnings Rate ID in Xero for ' +
                                    staff.Display_Nickname__c + '. The employee exists in Xero but has no earnings rate configured.'
                                );

                            failed.showInPopup = true;
                            failed.needsOrdinaryEarningsRateSync = true;

                            finalResults.add(failed);
                            continue;
                        } else {
                            System.debug('✅ Fetched earnings rate from Xero: ' + fetchedRateId);
                            
                            staff.Ordinary_Earnings_Rate_ID__c = fetchedRateId;
                            
                            staffToUpdateList.add(
                                new Staff__c(
                                    Id = staff.Id,
                                    Ordinary_Earnings_Rate_ID__c = fetchedRateId
                                )
                            );
                        }
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

                    if (ex instanceof AuraHandledException) {
                        errorMessage = ex.getMessage();
                        if (errorMessage == 'Script-thrown exception') {
                            errorMessage = 'No approved shifts found for the selected period.';
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
                            parsedStaffId,
                            staff != null ? staff.Display_Nickname__c : 'Unknown',
                            false,
                            errorMessage
                        );

                    failed.showInPopup = true;
                    finalResults.add(failed);
                }
            }

            // ============================================================
            // UPDATE STAFF RECORDS AFTER ALL CALLOUTS
            // ============================================================
            if (!staffToUpdateList.isEmpty()) {
                System.debug('🔄 Updating ' + staffToUpdateList.size() + ' staff records after callouts');
                try {
                    Database.update(staffToUpdateList, false);
                    System.debug('✅ Staff records updated successfully');
                } catch (Exception updateEx) {
                    System.debug('❌ Failed to update staff records: ' + updateEx.getMessage());
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

    // ============================================================
    // FETCH TRACKING ITEM ID FROM XERO
    // ============================================================
    public static String fetchTrackingItemIdFromXero(
        ProcessingContext ctx
    ) {
        try {
            System.debug('🚀 ===== START fetchTrackingItemIdFromXero =====');

            Http http = new Http();

            // =====================================================
            // GET TRACKING CATEGORIES FROM XERO
            // =====================================================
            HttpRequest req = new HttpRequest();
            req.setEndpoint(
                'https://api.xero.com/api.xro/2.0/TrackingCategories'
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

            System.debug(
                '📥 Tracking Categories API Status: ' +
                res.getStatusCode()
            );

            if (res.getStatusCode() != 200) {
                System.debug('❌ Failed to fetch tracking categories');
                System.debug('❌ Response: ' + res.getBody());
                return null;
            }

            Map<String, Object> responseMap =
                (Map<String, Object>) JSON.deserializeUntyped(
                    res.getBody()
                );

            List<Object> trackingCategories =
                (List<Object>) responseMap.get('TrackingCategories');

            if (trackingCategories == null || trackingCategories.isEmpty()) {
                System.debug('❌ No tracking categories found in Xero');
                return null;
            }

            System.debug('📊 Found ' + trackingCategories.size() + ' tracking categories in Xero');

            // =====================================================
            // ITERATE THROUGH CATEGORIES TO FIND FIRST ACTIVE ONE
            // =====================================================
            for (Object catObj : trackingCategories) {
                Map<String, Object> category =
                    (Map<String, Object>) catObj;

                String name = (String) category.get('Name');
                String categoryId = (String) category.get('TrackingCategoryID');
                String status = (String) category.get('Status');
                
                System.debug(
                    '📋 Processing Tracking Category: ' +
                    'Name: ' + name +
                    ' | ID: ' + categoryId +
                    ' | Status: ' + status
                );

                // Skip if status is not ACTIVE (if status exists)
                if (!String.isBlank(status) && !status.equalsIgnoreCase('ACTIVE')) {
                    System.debug('⏭️ Skipping inactive category: ' + name);
                    continue;
                }

                // Get the options for this category
                List<Object> options =
                    (List<Object>) category.get('Options');
                
                if (options == null || options.isEmpty()) {
                    System.debug('⚠️ No options found for category: ' + name);
                    continue;
                }

                System.debug('📊 Found ' + options.size() + ' options for category: ' + name);

                // =====================================================
                // FIND FIRST ACTIVE OPTION IN THIS CATEGORY
                // =====================================================
                for (Object optObj : options) {
                    Map<String, Object> option =
                        (Map<String, Object>) optObj;

                    String optionName = (String) option.get('Name');
                    String optionId = (String) option.get('TrackingOptionID');
                    String optionStatus = (String) option.get('Status');

                    System.debug(
                        '📋 Found Option: ' +
                        'Name: ' + optionName +
                        ' | ID: ' + optionId +
                        ' | Status: ' + optionStatus
                    );

                    // Return the first active option
                    if (String.isBlank(optionStatus) || optionStatus.equalsIgnoreCase('ACTIVE')) {
                        System.debug('✅ SUCCESS: Using tracking option from Xero');
                        System.debug('   📍 Category: ' + name + ' (' + categoryId + ')');
                        System.debug('   📍 Option: ' + optionName + ' (' + optionId + ')');
                        return optionId;
                    }
                }

                // If no active options, use the first one from this category
                if (!options.isEmpty()) {
                    Map<String, Object> firstOption =
                        (Map<String, Object>) options[0];
                    
                    String optionId =
                        (String) firstOption.get('TrackingOptionID');
                    String optionName =
                        (String) firstOption.get('Name');
                    
                    System.debug('⚠️ No active options found, using first available option: ' + optionName + ' (' + optionId + ')');
                    System.debug('   From Category: ' + name + ' (' + categoryId + ')');
                    return optionId;
                }
            }

            System.debug('❌ No active tracking options found in Xero');
            return null;

        } catch (Exception e) {
            System.debug(
                '❌ Error in fetchTrackingItemIdFromXero: ' +
                e.getMessage()
            );
            System.debug(
                '❌ Line: ' +
                e.getLineNumber()
            );
            System.debug(
                '❌ Stack Trace: ' +
                e.getStackTraceString()
            );
            return null;
        }
    }

    // ============================================================
    // HELPER: Get selected rate for category (case-insensitive)
    // ============================================================
    public static String getSelectedRateForCategory(
        Map<String, String> selectedRates,
        String category
    ) {
        if (selectedRates == null || String.isBlank(category)) {
            return null;
        }
        
        // Try exact match first
        if (selectedRates.containsKey(category)) {
            return selectedRates.get(category);
        }
        
        // Try case-insensitive match
        String categoryLower = category.toLowerCase();
        for (String key : selectedRates.keySet()) {
            if (key.toLowerCase().equals(categoryLower)) {
                return selectedRates.get(key);
            }
        }
        
        // Try partial match (e.g., "Sleepover Shift" vs "sleepover")
        for (String key : selectedRates.keySet()) {
            String keyLower = key.toLowerCase();
            if (categoryLower.contains(keyLower) || keyLower.contains(categoryLower)) {
                return selectedRates.get(key);
            }
        }
        
        return null;
    }
}