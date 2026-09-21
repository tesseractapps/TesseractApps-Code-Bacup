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
        
        // User selected earning rates (staffId -> category -> earningRateId)
        public Map<String, Map<String, String>> selectedCategoryRates;

        // Cache for validated rates
        public Map<String, Boolean> validatedRates;
        
        // Cache for invalid rate errors
        public Map<String, String> invalidRateErrors;

        public ProcessingContext() {
            categoryToEarningRateMap = new Map<String, String>();

            employeePayloads = new List<Object>();
            timesheetPayloads = new List<Object>();

            employeeIdToStaffId = new Map<String, Id>();
            employeeIdToStaffName = new Map<String, String>();

            results = new List<StaffProcessingResult>();
            
            trackingItemId = null;
            selectedCategoryRates = new Map<String, Map<String, String>>();
            validatedRates = new Map<String, Boolean>();
            invalidRateErrors = new Map<String, String>();
        }
    }

    // ============================================================
    // HELPER: FORMAT DATE FOR DISPLAY
    // ============================================================
    public static String formatDateForDisplay(Date dt) {
        if (dt == null) return '';
        
        String day = String.valueOf(dt.day()).leftPad(2, '0');
        String month = String.valueOf(dt.month()).leftPad(2, '0');
        String year = String.valueOf(dt.year());
        
        return day + '/' + month + '/' + year;
    }

    // ============================================================
    // DAY NAME TO RATE KEY MAPPING (EXPANDED)
    // ============================================================
    public static Map<String, List<String>> getDayNameToRateKeys() {
        return new Map<String, List<String>>{
            'sunday' => new List<String>{'sunday', 'sun', 'weekend', 'weekend shift', 'public holiday'},
            'saturday' => new List<String>{'saturday', 'sat', 'weekend', 'weekend shift', 'public holiday'},
            'monday' => new List<String>{'monday', 'mon', 'weekday', 'general'},
            'tuesday' => new List<String>{'tuesday', 'tue', 'weekday', 'general'},
            'wednesday' => new List<String>{'wednesday', 'wed', 'weekday', 'general'},
            'thursday' => new List<String>{'thursday', 'thu', 'weekday', 'general'},
            'friday' => new List<String>{'friday', 'fri', 'weekday', 'general'},
            'weekend' => new List<String>{'weekend', 'saturday', 'sunday', 'sat', 'sun', 'public holiday'},
            'public holiday' => new List<String>{'public holiday', 'holiday', 'public'}
        };
    }

    // ============================================================
    // GET XERO PAYROLL CYCLE FOR STAFF
    // ============================================================
    public static Map<String, Object> getXeroPayrollCycleForStaff(
        String employeeId,
        Id staffId,
        String accessToken,
        String tenantId,
        Date startDate
    ) {
        if (String.isBlank(employeeId)) {
            System.debug('❌ Employee ID is blank');
            return null;
        }
        
        if (String.isBlank(accessToken)) {
            System.debug('❌ Access token is blank');
            return null;
        }
        
        if (String.isBlank(tenantId)) {
            System.debug('❌ Tenant ID is blank');
            return null;
        }
        
        if (startDate == null) {
            System.debug('❌ Start date is null');
            return null;
        }
        
        try {
            System.debug('🚀 ===== START getXeroPayrollCycleForStaff =====');
            System.debug('Employee ID: ' + employeeId);
            System.debug('Staff ID: ' + staffId);
            System.debug('Start Date: ' + startDate);
    
            Http http = new Http();
    
            // GET EMPLOYEE
            HttpRequest empReq = new HttpRequest();
            empReq.setEndpoint(
                'https://api.xero.com/payroll.xro/1.0/Employees/' +
                employeeId
            );
            empReq.setMethod('GET');
            empReq.setHeader('Authorization', 'Bearer ' + accessToken);
            empReq.setHeader('Xero-tenant-id', tenantId);
            empReq.setHeader('Accept', 'application/json');
    
            HttpResponse empRes = http.send(empReq);
    
            System.debug('Employee API Status: ' + empRes.getStatusCode());
            System.debug('Employee API Body: ' + empRes.getBody());
    
            if (empRes.getStatusCode() != 200) { return null;
            }
    
            Map<String, Object> empMap = (Map<String, Object>) JSON.deserializeUntyped(empRes.getBody());
    
            if (empMap == null) { return null;
            }
    
            List<Object> employees = (List<Object>) empMap.get('Employees');
    
            if (employees == null || employees.isEmpty()) { return null;
            }
    
            Map<String, Object> employee = (Map<String, Object>) employees[0];
    
            if (employee == null) { return null;
            }
    
            // 🔥 DEBUG: Log the entire employee object
            System.debug('📋 FULL EMPLOYEE JSON: ' + JSON.serializePretty(employee));
    
            String payrollCalendarId = (String) employee.get('PayrollCalendarID');
    
            System.debug('Payroll Calendar ID from employee: ' + payrollCalendarId);
    
            // 🔥 FIX: Try multiple ways to get the payroll calendar ID
            if (String.isBlank(payrollCalendarId)) { Map<String, Object> payTemplate = (Map<String, Object>) employee.get('PayTemplate'); if (payTemplate != null) {
                    payrollCalendarId = (String) payTemplate.get('PayrollCalendarID'); } if (String.isBlank(payrollCalendarId)) { Map<String, Object> employment = (Map<String, Object>) employee.get('Employment');
                    if (employment != null) { payrollCalendarId = (String) employment.get('PayrollCalendarID'); } }
                
                // Try from Employee's payroll calendar directly
                if (String.isBlank(payrollCalendarId)) {
                    // Check if there's a payroll calendar array
                    List<Object> payrollCalendars = (List<Object>) employee.get('PayrollCalendars');
                    if (payrollCalendars != null && !payrollCalendars.isEmpty()) {
                        Map<String, Object> firstCalendar = (Map<String, Object>) payrollCalendars[0];
                        payrollCalendarId = (String) firstCalendar.get('PayrollCalendarID');
                        System.debug('Payroll Calendar ID from PayrollCalendars array: ' + payrollCalendarId);
                    }
                }
            }
    
            if (String.isBlank(payrollCalendarId)) {
                System.debug('❌ Payroll Calendar ID is blank after all attempts');
                System.debug('📋 Employee has the following fields: ' + employee.keySet());
                return null;
            }
    
            // 🔥 TRY MULTIPLE WAYS TO GET THE PAYROLL CALENDAR
            Map<String, Object> calendar = null;
            String calendarType = null;
            String startDateRaw = null;
            Date anchorDate = null;
            
            // Method 1: Get specific calendar by ID (v1.0)
            try {
                System.debug('🔍 Method 1: Getting calendar by ID (v1.0)...');
                HttpRequest calReq1 = new HttpRequest();
                calReq1.setEndpoint(
                    'https://api.xero.com/payroll.xro/1.0/PayrollCalendars/' + payrollCalendarId
                );
                calReq1.setMethod('GET');
                calReq1.setHeader('Authorization', 'Bearer ' + accessToken);
                calReq1.setHeader('Xero-tenant-id', tenantId);
                calReq1.setHeader('Accept', 'application/json');
    
                HttpResponse calRes1 = http.send(calReq1);
                System.debug('📥 Calendar API v1.0 Status: ' + calRes1.getStatusCode());
                System.debug('📥 Calendar API v1.0 Body: ' + calRes1.getBody());
    
                if (calRes1.getStatusCode() == 200) {
                    Map<String, Object> calMap1 = (Map<String, Object>) JSON.deserializeUntyped(calRes1.getBody());
                    List<Object> calendars1 = (List<Object>) calMap1.get('PayrollCalendars');
                    if (calendars1 != null && !calendars1.isEmpty()) {
                        calendar = (Map<String, Object>) calendars1[0];
                        System.debug('✅ Successfully retrieved calendar using v1.0');
                    }
                }
            } catch (Exception e1) {
                System.debug('⚠️ Method 1 failed: ' + e1.getMessage());
            }
            
            // Method 2: Get specific calendar by ID (v2.0)
            if (calendar == null) { try { HttpRequest calReq2 = new HttpRequest(); calReq2.setEndpoint( 'https://api.xero.com/payroll.xro/2.0/PayrollCalendars/' + payrollCalendarId
                    ); calReq2.setMethod('GET'); calReq2.setHeader('Authorization', 'Bearer ' + accessToken); calReq2.setHeader('Xero-tenant-id', tenantId); calReq2.setHeader('Accept', 'application/json'); HttpResponse calRes2 = http.send(calReq2); if (calRes2.getStatusCode() == 200) { Map<String, Object> calMap2 = (Map<String, Object>) JSON.deserializeUntyped(calRes2.getBody()); List<Object> calendars2 = (List<Object>) calMap2.get('PayrollCalendars'); if (calendars2 != null && !calendars2.isEmpty()) { calendar = (Map<String, Object>) calendars2[0];
                            System.debug('✅ Successfully retrieved calendar using v2.0');
                        }
                    }
                } catch (Exception e2) {
                    System.debug('⚠️ Method 2 failed: ' + e2.getMessage());
                }
            }
    
            // Method 3: Get all calendars and find by ID
            if (calendar == null) { try { HttpRequest calReq3 = new HttpRequest(); calReq3.setEndpoint('https://api.xero.com/payroll.xro/1.0/PayrollCalendars'); calReq3.setMethod('GET'); calReq3.setHeader('Authorization', 'Bearer ' + accessToken); calReq3.setHeader('Xero-tenant-id', tenantId); calReq3.setHeader('Accept', 'application/json'); HttpResponse calRes3 = http.send(calReq3); if (calRes3.getStatusCode() == 200) { Map<String, Object> calMap3 = (Map<String, Object>) JSON.deserializeUntyped(calRes3.getBody()); List<Object> calendars3 = (List<Object>) calMap3.get('PayrollCalendars'); if (calendars3 != null && !calendars3.isEmpty()) { for (Object calObj : calendars3) { Map<String, Object> potentialCalendar = (Map<String, Object>) calObj; String calId = (String) potentialCalendar.get('PayrollCalendarID'); if (calId != null && calId.equals(payrollCalendarId)) { calendar = potentialCalendar; break;
                                }
                            }
                        }
                    }
                } catch (Exception e3) {
                    System.debug('⚠️ Method 3 failed: ' + e3.getMessage());
                }
            }
    
            if (calendar == null) { return null;
            }
    
            calendarType = (String) calendar.get('CalendarType');
            startDateRaw = (String) calendar.get('StartDate');
    
            // Try alternate field names
            if (String.isBlank(calendarType)) { calendarType = (String) calendar.get('calendarType');
            }
            if (String.isBlank(startDateRaw)) { startDateRaw = (String) calendar.get('startDate');
            }
    
            System.debug('Calendar Type: ' + calendarType);
            System.debug('Calendar StartDate Raw: ' + startDateRaw);
    
            // If startDateRaw is a date format like "2025-01-01" instead of epoch
            if (String.isNotBlank(startDateRaw) && !startDateRaw.startsWith('/Date')) {
                try { List<String> dateParts = startDateRaw.split('-'); if (dateParts.size() == 3) { Integer year = Integer.valueOf(dateParts[0]); Integer month = Integer.valueOf(dateParts[1]); Integer day = Integer.valueOf(dateParts[2]); anchorDate = Date.newInstance(year, month, day);
                        System.debug('✅ Parsed date from string: ' + anchorDate);
                    }
                } catch (Exception e) {
                    System.debug('⚠️ Could not parse date string: ' + e.getMessage());
                }
            }
    
            if (anchorDate == null) {
                anchorDate = parseXeroDate(startDateRaw);
            }
    
            if (anchorDate == null) { return null;
            }
    
            System.debug('Anchor Date: ' + anchorDate);
    
            // CALCULATE PAY PERIOD
            Integer cycleLength = 7;
    
            if (!String.isBlank(calendarType)) {
                if (calendarType.equalsIgnoreCase('FORTNIGHTLY')) { cycleLength = 14;
                } else if (calendarType.equalsIgnoreCase('WEEKLY')) {
                    cycleLength = 7; } else if (calendarType.equalsIgnoreCase('MONTHLY')) { Integer daysInMonth = Date.daysInMonth(startDate.year(), startDate.month()); Date monthStart = Date.newInstance(startDate.year(), startDate.month(), 1); Date monthEnd = Date.newInstance(startDate.year(), startDate.month(), daysInMonth); Map<String, Object> result = new Map<String, Object>(); result.put('payPeriodStart', monthStart); result.put('payPeriodEnd', monthEnd); result.put('calendarType', calendarType); return result;
                }
            }
    
            Integer daysBetween = anchorDate.daysBetween(startDate);
            Integer remainder = Math.mod(daysBetween, cycleLength);
    
            if (remainder < 0) { remainder += cycleLength;
            }
    
            Date payPeriodStart = startDate.addDays(-remainder);
            Date payPeriodEnd = payPeriodStart.addDays(cycleLength - 1);
    
            System.debug('Calculated Pay Period Start: ' + payPeriodStart);
            System.debug('Calculated Pay Period End: ' + payPeriodEnd);
    
            Map<String, Object> result = new Map<String, Object>();
            result.put('payPeriodStart', payPeriodStart);
            result.put('payPeriodEnd', payPeriodEnd);
            result.put('calendarType', calendarType);
    
            return result;
    
        } catch (Exception e) {
            System.debug('❌ getXeroPayrollCycleForStaff Error: ' + e.getMessage());
            System.debug('❌ Line Number: ' + e.getLineNumber());
            System.debug('❌ Stack Trace: ' + e.getStackTraceString());
            return null;
        }
    }

    // Helper class for return results
    public class XeroResult {
        @AuraEnabled public Id staffId { get; set; }
        @AuraEnabled public String staffName { get; set; }
        @AuraEnabled public Boolean success { get; set; }
        @AuraEnabled public String message { get; set; }
        
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
            
            this.showInPopup = false;
            this.payPeriodMismatch = false;
            this.suggestedStartDate = null;
            this.suggestedEndDate = null;
            this.suggestedStartDay = null;
            this.suggestedEndDay = null;
        }
    }

    // ============================================================
    // COMPARATOR CLASS FOR SORTING RATES ALPHABETICALLY BY NAME
    // ============================================================
    public class RateNameComparator implements System.Comparator<Map<String, Object>> {
        public Integer compare(Map<String, Object> rate1, Map<String, Object> rate2) {
            String name1 = (String) rate1.get('name');
            String name2 = (String) rate2.get('name');
            
            if (name1 == null && name2 == null) return 0;
            if (name1 == null) return -1;
            if (name2 == null) return 1;
            
            return name1.toLowerCase().compareTo(name2.toLowerCase());
        }
    }

    // ============================================================
    // FILTER RATES BY CATEGORY
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
        
        if (categoryLower.contains('sleepover')) {
            keywords.add('sleepover');
        }
        if (categoryLower.contains('morning')) {
            keywords.add('morning');
        }
        if (categoryLower.contains('afternoon')) { keywords.add('afternoon');
        }
        if (categoryLower.contains('night')) { keywords.add('night');
        }
        if (categoryLower.contains('broken')) {
            keywords.add('broken');
        }
        if (categoryLower.contains('custom')) {
            keywords.add('custom');
        }
        if (categoryLower.contains('general')) { keywords.add('general');
        }
        
        // Add day-specific keywords
        if (categoryLower.contains('sunday') || categoryLower.contains('sun')) {
            keywords.add('sunday');
        }
        if (categoryLower.contains('saturday') || categoryLower.contains('sat')) {
            keywords.add('saturday');
        }
        if (categoryLower.contains('weekend')) { keywords.add('weekend');
        }
        if (categoryLower.contains('weekday')) { keywords.add('weekday');
        }
        
        if (keywords.isEmpty()) {
            List<String> words = categoryLower.split(' ');
            for (String word : words) {
                if (word.length() > 2) {
                    keywords.add(word);
                }
            }
        }
        
        if (keywords.isEmpty()) { keywords.add(categoryLower);
        }
        
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
    // FETCH EARNING RATES FROM XERO API
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
            
            if (employees == null || employees.isEmpty()) { result.put('success', false); result.put('message', 'No employee found in Xero'); return result;
            }
            
            Map<String, Object> employee = (Map<String, Object>) employees[0];
            
            Set<String> assignedRateIds = new Set<String>();
            
            String ordinaryEarningsRateId = (String) employee.get('OrdinaryEarningsRateID');
            if (String.isNotBlank(ordinaryEarningsRateId)) {
                assignedRateIds.add(ordinaryEarningsRateId);
            }
            
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
                            if (currentRecord == null || !currentRecord) { continue;
                            }
                            
                            Boolean isValidUnits = false;
                            if (typeOfUnits == null) { isValidUnits = true;
                            } else if (typeOfUnits.equalsIgnoreCase('Hours') || typeOfUnits.equalsIgnoreCase('1')) {
                                isValidUnits = true;
                            }
                            
                            if (!isValidUnits) { continue;
                            }
                            
                            Decimal effectiveRate = null;
                            if (ratePerUnit != null) {
                                effectiveRate = ratePerUnit; } else if (fixedAmount != null) { effectiveRate = fixedAmount;
                            }
                            
                            if (effectiveRate != null && effectiveRate != 0) { continue;
                            }
                            
                            Map<String, Object> rateMap = new Map<String, Object>();
                            rateMap.put('id', rateId);
                            rateMap.put('name', name != null ? name : 'Unnamed Rate');
                            rateMap.put('rateType', rateType != null ? rateType : '');
                            rateMap.put('earningsType', earningsType != null ? earningsType : '');
                            rateMap.put('isCurrent', currentRecord != null ? currentRecord : false);
                            rateMap.put('typeOfUnits', typeOfUnits);
                            
                            if (ratePerUnit != null) {
                                rateMap.put('ratePerUnit', ratePerUnit); } else if (fixedAmount != null) { rateMap.put('ratePerUnit', fixedAmount); } else { rateMap.put('ratePerUnit', 0);
                            }
                            
                            rateMap.put('isAssigned', assignedRateIds.contains(rateId));
                            
                            allRatesList.add(rateMap);
                            
                            System.debug('✅ Added rate: ' + name + ' (Units: ' + typeOfUnits + ', Rate: ' + effectiveRate + ')');
                        }
                    }
                    
                    result.put('earningRates', allRatesList);
                    result.put('allRatesCount', allRatesList.size());
                    result.put('assignedRatesCount', assignedRateIds.size()); } else { result.put('earningRates', new List<Map<String, Object>>());
                }
            } else {
                System.debug('⚠️ Earnings Rates API v2.0 failed with status: ' + ratesRes.getStatusCode());
                result.put('earningRates', new List<Map<String, Object>>());
            }
            
            result.put('success', true);
            result.put('ordinaryEarningsRateId', ordinaryEarningsRateId);
            result.put('employeeId', xeroEmployeeId); } catch (Exception e) { result.put('success', false); result.put('message', e.getMessage()); result.put('earningRates', new List<Map<String, Object>>());
        }
        
        return result;
    }

    // ============================================================
    // BUILD FACILITY-SPECIFIC EARNING RATE MAP
    // ============================================================
    public static Map<String, Map<String, String>> buildFacilityRateMap(Id organisationId) {
        Map<String, Map<String, String>> facilityRateMap = new Map<String, Map<String, String>>();
        
        try {
            List<Facility_Xero_Setting__c> settings = [
                SELECT Id, Xero_Payitem__c, Xero_Payitem_Name__c, Category__c, Shift_Type__c,
                       Custom_Shift_Type__c, Custom_Rate_Type__c, Broken_Type__c, Sleepover_Type__c,
                       Facility_Role__c, Facility_Role__r.Id, Facility_Role__r.Role_Name__c,
                       Facility_Role__r.Facility__c, Facility_Role__r.Facility__r.Name,
                       Facility_Role__r.Facility__r.Organisation__c
                FROM Facility_Xero_Setting__c
                WHERE Facility_Role__c != null
                AND Facility_Role__r.Facility__r.Organisation__c = :organisationId
                AND Xero_Payitem__c != null
                AND Xero_Payitem__c != ''
            ];
            
            System.debug('📊 Found ' + settings.size() + ' Facility Xero Settings');
            
            for (Facility_Xero_Setting__c setting : settings) { String facilityId = setting.Facility_Role__r.Facility__c; if (String.isBlank(facilityId)) continue; if (!facilityRateMap.containsKey(facilityId)) { facilityRateMap.put(facilityId, new Map<String, String>()); } Map<String, String> rateMap = facilityRateMap.get(facilityId); if (!String.isBlank(setting.Category__c)) { String key = setting.Category__c.trim().toLowerCase(); rateMap.put(key, setting.Xero_Payitem__c); } if (!String.isBlank(setting.Shift_Type__c)) { String key = setting.Shift_Type__c.trim().toLowerCase(); rateMap.put(key, setting.Xero_Payitem__c); } if (!String.isBlank(setting.Custom_Shift_Type__c)) { String key = setting.Custom_Shift_Type__c.trim().toLowerCase(); rateMap.put(key, setting.Xero_Payitem__c); }
                
                // Map by Broken Type
                if (!String.isBlank(setting.Broken_Type__c)) {
                    String key = setting.Broken_Type__c.trim().toLowerCase();
                    rateMap.put(key, setting.Xero_Payitem__c);
                    System.debug('   ✅ Facility ' + facilityId + ' Broken Type "' + setting.Broken_Type__c + '" → ' + setting.Xero_Payitem__c);
                }
                
                // Map by Sleepover Type
                if (!String.isBlank(setting.Sleepover_Type__c)) {
                    String key = setting.Sleepover_Type__c.trim().toLowerCase();
                    rateMap.put(key, setting.Xero_Payitem__c);
                    System.debug('   ✅ Facility ' + facilityId + ' Sleepover Type "' + setting.Sleepover_Type__c + '" → ' + setting.Xero_Payitem__c);
                }
            }
            
            System.debug('📋 Facility Rate Map: ' + JSON.serializePretty(facilityRateMap));
            
        } catch (Exception e) {
            System.debug('❌ Error building facility rate map: ' + e.getMessage());
            System.debug('❌ Stack Trace: ' + e.getStackTraceString());
        }
        
        return facilityRateMap;
    }

    // ============================================================
    // FIND FACILITY-SPECIFIC RATE FOR CATEGORY (ENHANCED FOR DAYS)
    // ============================================================
    public static String findFacilityRateForCategory(
        String category,
        String facilityId,
        Map<String, Map<String, String>> facilityRateMap
    ) {
        if (String.isBlank(category)) return null;
        
        String categoryLower = category.toLowerCase().trim();
        
        // Comprehensive day name mapping
        Map<String, List<String>> dayNameVariations = new Map<String, List<String>>{
            'sunday' => new List<String>{'sunday', 'sun', 'weekend', 'weekend shift'},
            'saturday' => new List<String>{'saturday', 'sat', 'weekend', 'weekend shift'},
            'monday' => new List<String>{'monday', 'mon', 'weekday'},
            'tuesday' => new List<String>{'tuesday', 'tue', 'weekday'},
            'wednesday' => new List<String>{'wednesday', 'wed', 'weekday'},
            'thursday' => new List<String>{'thursday', 'thu', 'weekday'},
            'friday' => new List<String>{'friday', 'fri', 'weekday'},
            'weekend' => new List<String>{'weekend', 'saturday', 'sunday', 'sat', 'sun'}
        };
        
        Boolean isWeekend = categoryLower.equals('saturday') || categoryLower.equals('sunday') ||
                            categoryLower.equals('sat') || categoryLower.equals('sun') ||
                            categoryLower.contains('weekend');
        
        Boolean isWeekday = !isWeekend && (categoryLower.equals('monday') || categoryLower.equals('tuesday') ||
                                           categoryLower.equals('wednesday') || categoryLower.equals('thursday') ||
                                           categoryLower.equals('friday') || categoryLower.equals('mon') ||
                                           categoryLower.equals('tue') || categoryLower.equals('wed') ||
                                           categoryLower.equals('thu') || categoryLower.equals('fri') ||
                                           categoryLower.contains('weekday'));
        
        System.debug('🔍 findFacilityRateForCategory:');
        System.debug('   Category: ' + category);
        System.debug('   Facility ID: ' + facilityId);
        System.debug('   Is Weekend: ' + isWeekend);
        System.debug('   Is Weekday: ' + isWeekday);
        
        // 1. Try with the shift's facility
        if (String.isNotBlank(facilityId) && facilityRateMap.containsKey(facilityId)) { Map<String, String> rateMap = facilityRateMap.get(facilityId); if (rateMap.containsKey(categoryLower)) { return rateMap.get(categoryLower); } if (dayNameVariations.containsKey(categoryLower)) { List<String> variations = dayNameVariations.get(categoryLower); for (String variation : variations) { if (rateMap.containsKey(variation)) { return rateMap.get(variation); } } } if (isWeekend) { if (rateMap.containsKey('weekend')) { return rateMap.get('weekend'); } if (rateMap.containsKey('weekend shift')) { return rateMap.get('weekend shift'); } } if (isWeekday) { if (rateMap.containsKey('weekday')) { return rateMap.get('weekday'); } } for (String key : rateMap.keySet()) { String keyLower = key.toLowerCase().trim(); if (categoryLower.contains(keyLower) || keyLower.contains(categoryLower)) { return rateMap.get(key);
                }
            }
            
            // Day name matching (explicit)
            String[] dayNames = new String[]{'sunday', 'monday', 'tuesday', 'wednesday', 
                                             'thursday', 'friday', 'saturday'};
            for (String day : dayNames) {
                if (categoryLower.equals(day) || categoryLower.contains(day)) {
                    for (String key : rateMap.keySet()) {
                        String keyLower = key.toLowerCase().trim();
                        if (keyLower.equals(day) || keyLower.contains(day)) {
                            System.debug('   ✅ Day name match found for "' + category + '" in facility: ' + rateMap.get(key));
                            return rateMap.get(key);
                        }
                    }
                }
            }
        }
        
        // 2. Try to find any facility with this category (fallback)
        System.debug('🔍 Trying fallback across all facilities...');
        for (String facilityIdKey : facilityRateMap.keySet()) {
            Map<String, String> rateMap = facilityRateMap.get(facilityIdKey);
            
            // Exact match
            if (rateMap.containsKey(categoryLower)) {
                System.debug('   ✅ Found "' + category + '" in another facility (fallback): ' + rateMap.get(categoryLower));
                return rateMap.get(categoryLower);
            }
            
            // Check day name variations in fallback
            if (dayNameVariations.containsKey(categoryLower)) {
                List<String> variations = dayNameVariations.get(categoryLower);
                for (String variation : variations) {
                    if (rateMap.containsKey(variation)) {
                        System.debug('   ✅ Day name variation match in fallback for "' + category + '": ' + rateMap.get(variation));
                        return rateMap.get(variation);
                    }
                }
            }
            
            // Weekend fallback
            if (isWeekend && rateMap.containsKey('weekend')) {
                System.debug('   ✅ Weekend match in fallback for "' + category + '": ' + rateMap.get('weekend'));
                return rateMap.get('weekend');
            }
            
            // Weekday fallback
            if (isWeekday && rateMap.containsKey('weekday')) {
                System.debug('   ✅ Weekday match in fallback for "' + category + '": ' + rateMap.get('weekday'));
                return rateMap.get('weekday');
            }
            
            // Partial match fallback
            for (String key : rateMap.keySet()) {
                if (key.toLowerCase().contains(categoryLower) || categoryLower.contains(key.toLowerCase())) {
                    System.debug('   ✅ Found partial match in another facility (fallback): ' + rateMap.get(key));
                    return rateMap.get(key);
                }
            }
        }
        
        System.debug('   ❌ No matching rate found for category: ' + category);
        return null;
    }

    // ============================================================
    // VALIDATE EARNING RATE IS ACTIVE IN XERO
    // ============================================================
    public static Map<String, Object> isEarningRateActiveInXeroWithDetails(
        String rateId,
        String accessToken,
        String tenantId
    ) {
        Map<String, Object> result = new Map<String, Object>();
        result.put('isValid', false);
        result.put('rateName', '');
        result.put('message', '');
        
        if (String.isBlank(rateId) || String.isBlank(accessToken) || String.isBlank(tenantId)) { result.put('message', 'Missing required parameters for rate validation'); return result;
        }
        
        try {
            System.debug('🔍 Validating Earning Rate in Xero: ' + rateId);
            
            Http http = new Http();
            HttpRequest req = new HttpRequest();
            req.setEndpoint('https://api.xero.com/payroll.xro/2.0/EarningsRates/' + rateId);
            req.setMethod('GET');
            req.setHeader('Authorization', 'Bearer ' + accessToken);
            req.setHeader('Xero-tenant-id', tenantId);
            req.setHeader('Accept', 'application/json');
            
            HttpResponse res = http.send(req);
            
            System.debug('📥 Rate Validation Status: ' + res.getStatusCode());
            
            if (res.getStatusCode() != 200) {
                result.put('message', 'Rate not found in Xero (Status: ' + res.getStatusCode() + ')');
                return result;
            }
            
            // Parse response
            Map<String, Object> responseMap = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            
            // Check for BOTH "earningsRate" (singular) AND "earningsRates" (plural)
            List<Object> earningsRates = null;
            
            Object earningsRateObj = responseMap.get('earningsRate');
            if (earningsRateObj != null) {
                earningsRates = new List<Object>();
                earningsRates.add(earningsRateObj); } else { earningsRates = (List<Object>) responseMap.get('earningsRates');
            }
            
            if (earningsRates == null || earningsRates.isEmpty()) { result.put('message', 'No earnings rate data found in Xero response'); return result;
            }
            
            Map<String, Object> rate = (Map<String, Object>) earningsRates[0];
            
            // Get rate name
            String rateName = (String) rate.get('name');
            if (rateName == null) { rateName = (String) rate.get('Name');
            }
            if (String.isBlank(rateName)) { rateName = rateId;
            }
            result.put('rateName', rateName);
            
            // Check currentRecord
            Boolean currentRecord = (Boolean) rate.get('currentRecord');
            if (currentRecord == null) { currentRecord = (Boolean) rate.get('CurrentRecord');
            }
            
            if (currentRecord == null || !currentRecord) {
                result.put('isValid', false);
                result.put('message', 'The earning rate "' + rateName + '" is INACTIVE in Xero. Please activate this rate in Xero.');
                return result;
            }
            
            // Check type of units
            String typeOfUnits = (String) rate.get('typeOfUnits');
            if (typeOfUnits == null) { typeOfUnits = (String) rate.get('TypeOfUnits');
            }
            
            Boolean isValidUnits = false;
            if (typeOfUnits == null) { isValidUnits = true;
            } else if (typeOfUnits.equalsIgnoreCase('Hours') || typeOfUnits.equalsIgnoreCase('hours') || typeOfUnits.equalsIgnoreCase('1')) {
                isValidUnits = true;
            }
            
            if (!isValidUnits) { result.put('isValid', false); result.put('message', 'The earning rate "' + rateName + '" has invalid units "' + typeOfUnits + '". Expected "Hours".'); return result;
            }
            
            // Rate is valid
            result.put('isValid', true);
            result.put('message', 'Rate "' + rateName + '" is active and valid');
            
            System.debug('✅ Rate is ACTIVE and valid: ' + rateId + ' - ' + rateName);
            
            return result; } catch (Exception e) { result.put('message', 'Error validating rate: ' + e.getMessage()); return result;
        }
    }

    // ============================================================
    // VALIDATE AND GET ACTIVE RATE (WITH CACHING)
    // ============================================================
    public static String validateAndGetActiveRate(
        String matchedRateId,
        String xeroEmployeeId,
        ProcessingContext ctx
    ) {
        if (String.isBlank(matchedRateId)) {
            return null;
        }
        
        // Check if we've already validated this rate in this context
        if (ctx.validatedRates == null) {
            ctx.validatedRates = new Map<String, Boolean>();
        }
        
        // If already validated, return cached result
        if (ctx.validatedRates.containsKey(matchedRateId)) {
            Boolean isValid = ctx.validatedRates.get(matchedRateId);
            System.debug('🔄 Using cached validation for rate: ' + matchedRateId + ' = ' + isValid);
            return isValid ? matchedRateId : null;
        }
        
        // Validate rate with Xero - get full details
        Map<String, Object> validationResult = isEarningRateActiveInXeroWithDetails(
            matchedRateId,
            ctx.accessToken,
            ctx.tenantId
        );
        
        Boolean isValid = (Boolean) validationResult.get('isValid');
        String rateName = (String) validationResult.get('rateName');
        String message = (String) validationResult.get('message');
        
        ctx.validatedRates.put(matchedRateId, isValid);
        
        if (!isValid) {
            System.debug('❌ Rate ' + matchedRateId + ' is INACTIVE or invalid in Xero');
            System.debug('   Rate Name: ' + rateName);
            System.debug('   Message: ' + message);
            
            // Store the error details in context for later use
            if (ctx.invalidRateErrors == null) {
                ctx.invalidRateErrors = new Map<String, String>();
            }
            ctx.invalidRateErrors.put(matchedRateId, message);
            
            return null;
        }
        
        System.debug('✅ Rate ' + matchedRateId + ' is ACTIVE and valid');
        return matchedRateId;
    }

    // ============================================================
    // GET SELECTED RATE FOR CATEGORY (CASE-INSENSITIVE)
    // ============================================================
    public static String getSelectedRateForCategory(
        Map<String, String> selectedRates,
        String category
    ) {
        if (selectedRates == null || String.isBlank(category)) {
            return null;
        }
        
        String categoryLower = category.toLowerCase().trim();
        
        for (String key : selectedRates.keySet()) {
            if (key.toLowerCase().trim().equals(categoryLower)) {
                return selectedRates.get(key);
            }
        }
        
        for (String key : selectedRates.keySet()) {
            String keyLower = key.toLowerCase().trim();
            if (categoryLower.contains(keyLower) || keyLower.contains(categoryLower)) {
                return selectedRates.get(key);
            }
        }
        
        if (categoryLower.contains('sleepover')) { for (String key : selectedRates.keySet()) { if (key.toLowerCase().contains('sleepover')) { return selectedRates.get(key);
                }
            }
        }
        
        if (categoryLower.contains('broken')) { for (String key : selectedRates.keySet()) { if (key.toLowerCase().contains('broken')) { return selectedRates.get(key);
                }
            }
        }
        
        if (categoryLower.contains('saturday') || categoryLower.contains('sat')) { for (String key : selectedRates.keySet()) { String keyLower = key.toLowerCase(); if (keyLower.contains('saturday') || keyLower.contains('sat') || keyLower.contains('weekend')) {
                    return selectedRates.get(key);
                }
            }
        }
        
        if (categoryLower.contains('sunday') || categoryLower.contains('sun')) { for (String key : selectedRates.keySet()) { String keyLower = key.toLowerCase(); if (keyLower.contains('sunday') || keyLower.contains('sun') || keyLower.contains('weekend')) { return selectedRates.get(key);
                }
            }
        }
        
        return null;
    }

    // ============================================================
    // FIND MATCHING EARNING RATE
    // ============================================================
    public static String findMatchingEarningRate(
        String category,
        Map<String, String> categoryToEarningRateMap
    ) {
        if (String.isBlank(category) || categoryToEarningRateMap == null || categoryToEarningRateMap.isEmpty()) {
            return null;
        }

        String categoryLower = category.toLowerCase().trim();
        
        System.debug('🔍 Looking for earning rate for category: "' + category + '"');
        
        if (categoryToEarningRateMap.containsKey(categoryLower)) {
            String rateId = categoryToEarningRateMap.get(categoryLower);
            System.debug('   ✅ Exact match found: ' + rateId);
            return rateId;
        }
        
        if (categoryLower.contains('broken')) { for (String key : categoryToEarningRateMap.keySet()) { if (key.contains('broken')) { String rateId = categoryToEarningRateMap.get(key); return rateId;
                }
            }
        }
        
        if (categoryLower.contains('sleepover')) {
            for (String key : categoryToEarningRateMap.keySet()) {
                if (key.contains('sleepover')) {
                    String rateId = categoryToEarningRateMap.get(key);
                    System.debug('   ✅ Sleepover shift match found: ' + rateId + ' (key: ' + key + ')');
                    return rateId;
                }
            }
        }
        
        if (categoryLower.contains('saturday') || categoryLower.contains('sat')) { for (String key : categoryToEarningRateMap.keySet()) { if (key.contains('saturday') || key.contains('sat') || key.contains('weekend')) { String rateId = categoryToEarningRateMap.get(key); return rateId;
                }
            }
        }
        
        if (categoryLower.contains('sunday') || categoryLower.contains('sun')) { for (String key : categoryToEarningRateMap.keySet()) { if (key.contains('sunday') || key.contains('sun') || key.contains('weekend')) { String rateId = categoryToEarningRateMap.get(key);  return rateId;
                }
            }
        }
        
        for (String key : categoryToEarningRateMap.keySet()) {
            String keyLower = key.toLowerCase().trim();
            if (categoryLower.contains(keyLower) || keyLower.contains(categoryLower)) {
                String rateId = categoryToEarningRateMap.get(key);
                System.debug('   ✅ Partial match found: ' + rateId + ' (key: ' + key + ')');
                return rateId;
            }
        }
        
        List<String> categoryWords = categoryLower.split(' ');
        for (String word : categoryWords) {
            if (word.length() < 3) continue;
            for (String key : categoryToEarningRateMap.keySet()) {
                String keyLower = key.toLowerCase().trim();
                if (keyLower.contains(word)) { String rateId = categoryToEarningRateMap.get(key); return rateId;
                }
            }
        }
        
        System.debug('   ❌ No matching earning rate found for category: ' + category);
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

            // FIRST: Check at root level
            String ordinaryEarningsRateId =
                (String) employee.get('OrdinaryEarningsRateID');

            if (!String.isBlank(ordinaryEarningsRateId)) {
                System.debug('✅ Found Ordinary Earnings Rate ID at root level: ' + ordinaryEarningsRateId);
                
                Map<String, Object> validationResult = isEarningRateActiveInXeroWithDetails(
                    ordinaryEarningsRateId,
                    ctx.accessToken,
                    ctx.tenantId
                );
                
                Boolean isValid = (Boolean) validationResult.get('isValid');
                if (isValid) {
                    System.debug('✅ Ordinary Earnings Rate is ACTIVE and valid: ' + ordinaryEarningsRateId);
                    return ordinaryEarningsRateId;  } else { String rateName = (String) validationResult.get('rateName'); String message = (String) validationResult.get('message'); if (ctx.invalidRateErrors == null) {  ctx.invalidRateErrors = new Map<String, String>(); } ctx.invalidRateErrors.put(ordinaryEarningsRateId, message); return null; } } Map<String, Object> payTemplate = (Map<String, Object>) employee.get('PayTemplate'); if (payTemplate != null) { List<Object> earningsLines = (List<Object>) payTemplate.get('EarningsLines'); if (earningsLines != null && !earningsLines.isEmpty()) { for (Object rateObj : earningsLines) { Map<String, Object> rate = (Map<String, Object>) rateObj; String rateId = (String) rate.get('EarningsRateID'); String calculationType = (String) rate.get('CalculationType'); Decimal ratePerUnit = (Decimal) rate.get('RatePerUnit'); if (!String.isBlank(rateId)) { Map<String, Object> validationResult = isEarningRateActiveInXeroWithDetails(  rateId, ctx.accessToken, ctx.tenantId ); Boolean isValid = (Boolean) validationResult.get('isValid'); if (isValid) { return rateId; } else { String rateName = (String) validationResult.get('rateName'); String message = (String) validationResult.get('message'); if (ctx.invalidRateErrors == null) { ctx.invalidRateErrors = new Map<String, String>(); } ctx.invalidRateErrors.put(rateId, message);
                            }
                        }
                    }
                }
            }

            // THIRD: Check in EarningsRates array
            System.debug('⚠️ Checking EarningsRates array for Ordinary Earnings...');
            
            List<Object> earningsRates =
                (List<Object>) employee.get('EarningsRates');

            if (earningsRates != null && !earningsRates.isEmpty()) {
                
                System.debug('📊 Found ' + earningsRates.size() + ' earnings rates in array');
                
                for (Object rateObj : earningsRates) {
                    Map<String, Object> rate =
                        (Map<String, Object>) rateObj;

                    String rateName =
                        (String) rate.get('Name');
                    
                    String rateType =
                        (String) rate.get('RateType');
                    
                    String earningsType =
                        (String) rate.get('EarningsType');
                    
                    String rateId =
                        (String) rate.get('EarningsRateID');

                    System.debug(
                        '📋 Found Earnings Rate: ' +
                        rateName +
                        ' | RateType: ' + rateType +
                        ' | EarningsType: ' + earningsType +
                        ' | ID: ' + rateId
                    );

                    if (!String.isBlank(rateId)) {
                        Boolean isOrdinary = false;
                        
                        if (!String.isBlank(rateName) &&
                            (rateName.equalsIgnoreCase('Ordinary Earnings') ||
                             rateName.equalsIgnoreCase('Ordinary') ||
                             rateName.equalsIgnoreCase('Ordinary Rate'))) {
                            isOrdinary = true;
                        }
                        
                        if (!isOrdinary && !String.isBlank(earningsType) &&
                            (earningsType.equalsIgnoreCase('OrdinaryTimeEarnings') ||
                             earningsType.equalsIgnoreCase('ORDINARYTIMEEARNINGS'))) {
                            isOrdinary = true;
                        }
                        
                        if (!isOrdinary && !String.isBlank(rateType) &&
                            (rateType.equalsIgnoreCase('OrdinaryEarnings') ||
                             rateType.equalsIgnoreCase('ORDINARYEARNINGS'))) {
                            isOrdinary = true;
                        }
                        
                        if (isOrdinary) {
                            System.debug('✅ Found Ordinary Earnings Rate in array: ' + rateId + ' - ' + rateName);
                            
                            Map<String, Object> validationResult = isEarningRateActiveInXeroWithDetails(
                                rateId,
                                ctx.accessToken,
                                ctx.tenantId
                            );
                            
                            Boolean isValid = (Boolean) validationResult.get('isValid');
                            if (isValid) {
                                System.debug('✅ Ordinary Earnings Rate is ACTIVE and valid: ' + rateId);
                                return rateId;
                            } else {
                                String errorRateName = (String) validationResult.get('rateName');
                                String message = (String) validationResult.get('message');
                                System.debug('❌ Ordinary Earnings Rate is INACTIVE: ' + errorRateName);
                                System.debug('   Message: ' + message);
                                if (ctx.invalidRateErrors == null) {
                                    ctx.invalidRateErrors = new Map<String, String>();
                                }
                                ctx.invalidRateErrors.put(rateId, message);
                                return null;
                            }
                        }
                    }
                }

                // If no Ordinary Earnings found, use first active rate
                for (Object rateObj : earningsRates) {
                    Map<String, Object> rate =
                        (Map<String, Object>) rateObj;
                    
                    String rateId =
                        (String) rate.get('EarningsRateID');
                    
                    if (!String.isBlank(rateId)) {
                        Map<String, Object> validationResult = isEarningRateActiveInXeroWithDetails(
                            rateId,
                            ctx.accessToken,
                            ctx.tenantId
                        );
                        
                        Boolean isValid = (Boolean) validationResult.get('isValid');
                        String rateName = (String) validationResult.get('rateName');
                        
                        if (isValid) {
                            System.debug('⚠️ No Ordinary Earnings found, using first active rate as fallback: ' + rateId + ' - ' + rateName);
                            return rateId;
                        } else {
                            System.debug('⚠️ Rate ' + rateName + ' is INACTIVE, skipping');
                        }
                    }
                }
            }

            System.debug('❌ No active earnings rate found in Xero for this employee');
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
    // PROCESS SINGLE STAFF FOR BULK (FULLY FIXED WITH ORDINARY RATE FETCH)
    // ============================================================
    public static void processSingleStaffForBulk(
        Staff__c staff,
        ProcessingContext ctx
    ) {
        System.debug('🚀 ===== START processSingleStaffForBulk =====');

        if (staff == null || String.isBlank(staff.Xero_Employee_ID__c)) { String errorMsg = 'Staff ' + (staff != null ? staff.Display_Nickname__c : 'Unknown') +  ' has no Xero Employee ID. Please sync this staff with Xero first.'; throw new AuraHandledException(errorMsg);
        }

        String xeroEmployeeId = staff.Xero_Employee_ID__c;
        String ordinaryEarningsRateId = staff.Ordinary_Earnings_Rate_ID__c;

        // ============================================================
        // FETCH ORDINARY EARNINGS RATE FROM XERO (ALWAYS)
        // ============================================================
        System.debug('🔍 Fetching Ordinary Earnings Rate from Xero for: ' + staff.Display_Nickname__c);
        ordinaryEarningsRateId = fetchOrdinaryEarningsRateFromXero(xeroEmployeeId, ctx);
        
        if (String.isNotBlank(ordinaryEarningsRateId)) {
            System.debug('✅ Fetched Ordinary Earnings Rate: ' + ordinaryEarningsRateId);
            // 🔥 FIX: Don't update here - do it after all callouts are complete
            // Just store the ID on the staff object for later use
            staff.Ordinary_Earnings_Rate_ID__c = ordinaryEarningsRateId;
        } else {
            System.debug('⚠️ Could not fetch Ordinary Earnings Rate from Xero');
        }


        // ============================================================
        // BUILD FACILITY-SPECIFIC RATE MAP USING getOrganisationEarningRateSettings
        // ============================================================
        Map<Id, Map<String, Object>> organisationSettings = getOrganisationEarningRateSettings();
        Map<String, Map<String, String>> facilityRateMap = new Map<String, Map<String, String>>();
        
        // Convert organisation settings to facility rate map
        for (Id settingId : organisationSettings.keySet()) { Map<String, Object> settingData = organisationSettings.get(settingId); String facilityId = (String) settingData.get('Facility_Id'); String category = (String) settingData.get('Category__c'); String xeroPayitem = (String) settingData.get('Xero_Payitem__c'); String shiftType = (String) settingData.get('Shift_Type__c'); String customShiftType = (String) settingData.get('Custom_Shift_Type__c'); String brokenType = (String) settingData.get('Broken_Type__c'); String sleepoverType = (String) settingData.get('Sleepover_Type__c'); String customRateType = (String) settingData.get('Custom_Rate_Type__c'); if (String.isBlank(facilityId) || String.isBlank(xeroPayitem)) { continue; } if (!facilityRateMap.containsKey(facilityId)) { facilityRateMap.put(facilityId, new Map<String, String>()); } Map<String, String> rateMap = facilityRateMap.get(facilityId); if (String.isNotBlank(category)) { String key = category.trim().toLowerCase(); rateMap.put(key, xeroPayitem);
            } if (String.isNotBlank(shiftType)) { String key = shiftType.trim().toLowerCase(); rateMap.put(key, xeroPayitem); } if (String.isNotBlank(customShiftType)) { String key = customShiftType.trim().toLowerCase(); rateMap.put(key, xeroPayitem); } if (String.isNotBlank(brokenType)) { String key = brokenType.trim().toLowerCase(); rateMap.put(key, xeroPayitem); } if (String.isNotBlank(sleepoverType)) { String key = sleepoverType.trim().toLowerCase(); rateMap.put(key, xeroPayitem); } if (String.isNotBlank(customRateType)) { String key = customRateType.trim().toLowerCase(); rateMap.put(key, xeroPayitem);
                System.debug('   ✅ Facility ' + facilityId + ' Custom Rate Type "' + customRateType + '" → ' + xeroPayitem);
            }
        }
        
        System.debug('📋 Facility Rate Map: ' + JSON.serializePretty(facilityRateMap));

        // ============================================================
        // FETCH SHIFTS
        // ============================================================
        List<ShiftwithStaff__c> shifts = [
            SELECT Id,
                Date__c,
                Approval_Status__c,
                Shift_Category__c,
                Type_of_shift__c,
                Shift_Type__c,
                Shift_Facility__c,
                Shift_Day_Name__c,
                Public_holiday__c,
                
                Actual_Duration__c,
                Staff_Hourly_Rate__c,
                Staff_Final_Hourly_Rate__c,
                Custom_Rate_Per_Hrs__c,
                
                Sleepover_Shift_Hours__c,
                Sleepover_Shift_Hourly_Rate__c,
                
                Broken_Shift__c,
                Broken_Total_Duration__c,
                Broken_Rate_Per_Hrs__c,
                Broken_Extended_Duration__c,
                Broken_Extended_Rate__c,
                Broken_Shift_Allowance__c,
                
                Variance_Rate__c,
                Extended_Duration__c,
                
                Over_Time_Tier_One__c,
                Over_Time_Tier_One_Rate__c,
                Over_Time_Tier_Two__c,
                Over_Time_Tier_Two_Rate__c,
                
                Long_Morning_Shift_Duartion__c,
                Long_Morning_Hourly_Rate__c,
                Long_Morning_Rate_Two__c,
                Long_Morning_Duartion_Two__c,
                Long_Afternoon_Hourly_Rate__c,
                Long_Afternoon_Shift_Duartion__c,
                Long_Afternoon_Rate_Two__c,
                Long_Afternoon_Duration_Two__c,
                Long_Night_Hourly_Rate__c,
                Long_Night_Shift_Duartion__c,
                Long_Sleepover_Allowance__c,
                Long_Sleepover_Duartion__c
                
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

        // Get facility ID from shifts
        String shiftFacilityId = null;
        if (!shifts.isEmpty()) {
            shiftFacilityId = shifts[0].Shift_Facility__c;
            System.debug('🏢 Shift Facility ID: ' + shiftFacilityId);
        }

        // ============================================================
        // CATEGORY RATE CALCULATIONS WITH PRIORITY
        // ============================================================
        Map<String, Decimal> categoryTotalHours = new Map<String, Decimal>();
        Map<String, Integer> categoryShiftCount = new Map<String, Integer>();
        Map<String, Decimal> categoryRates = new Map<String, Decimal>();
        Map<String, String> categoryDayNameMap = new Map<String, String>();
        Map<String, String> categoryFacilityMap = new Map<String, String>();
        Map<String, Boolean> categoryIsPublicHoliday = new Map<String, Boolean>();

        Map<String, List<Decimal>> sleepoverCategoryData = new Map<String, List<Decimal>>();

        Decimal totalBrokenHours = 0;
        Decimal totalBrokenRate = 0;

        System.debug('========================================');
        System.debug('📊 PROCESSING SHIFTS FOR STAFF: ' + staff.Display_Nickname__c);
        System.debug('📅 Period: ' + ctx.startDate + ' to ' + ctx.endDate);
        System.debug('========================================');

        Boolean hasWeekendShifts = false;
        Set<String> weekendDaysFound = new Set<String>();

        for (ShiftwithStaff__c shift : shifts) {
            System.debug('========================================');
            System.debug('📋 Processing Shift: ' + shift.Id);
            System.debug('   Date: ' + shift.Date__c);
            System.debug('   Day Name: ' + shift.Shift_Day_Name__c);
            System.debug('   Category: ' + shift.Shift_Category__c);
            System.debug('   Type: ' + shift.Type_of_shift__c);
            System.debug('   Public Holiday: ' + shift.Public_holiday__c);
            System.debug('   Facility: ' + shift.Shift_Facility__c);
            System.debug('========================================');

            // ============================================================
            // DETERMINE CATEGORY KEY WITH PRIORITY
            // ============================================================
            String categoryKey;
            
            // BROKEN SHIFT - Keep as is
            if (shift.Broken_Shift__c) {
                Decimal rate = shift.Broken_Rate_Per_Hrs__c != null ? shift.Broken_Rate_Per_Hrs__c : 0;
                Decimal duration = shift.Broken_Total_Duration__c != null ? shift.Broken_Total_Duration__c : 0;

                totalBrokenHours += duration;
                if (rate != 0) {
                    totalBrokenRate = rate;
                }
                continue;
            }

            // SLEEPOVER SHIFT - Keep as is
            if (shift.Type_of_shift__c != null && 
                shift.Type_of_shift__c.equalsIgnoreCase('Sleepover Shift')) {
                
                String sleepoverKey = 'Sleepover Shift';
                Decimal effectiveRate = shift.Staff_Hourly_Rate__c != null ? shift.Staff_Hourly_Rate__c : 0;
                Decimal duration = shift.Actual_Duration__c != null ? shift.Actual_Duration__c : 0;
                
                Decimal ratePerHour = 0;
                if (duration > 0 && effectiveRate > 0) {
                    ratePerHour = (effectiveRate / duration).setScale(2);
                }
                
                System.debug('🛌 Sleepover Shift - Rate: ' + effectiveRate + ', Duration: ' + duration + ', Rate Per Hour: ' + ratePerHour);
                
                categoryDayNameMap.put(sleepoverKey, shift.Shift_Day_Name__c);
                categoryFacilityMap.put(sleepoverKey, shift.Shift_Facility__c);
                categoryIsPublicHoliday.put(sleepoverKey, shift.Public_holiday__c);
                
                if (!sleepoverCategoryData.containsKey(sleepoverKey)) {
                    sleepoverCategoryData.put(sleepoverKey, new List<Decimal>{0, 0});
                }

                List<Decimal> data = sleepoverCategoryData.get(sleepoverKey);
                data[0] += duration;
                if (ratePerHour != 0) {
                    data[1] = ratePerHour;
                }
                
                continue;
            }

            // ============================================================
            // 🔥 PRIORITY 1: PUBLIC HOLIDAY
            // ============================================================
            if (shift.Public_holiday__c == true) {
                categoryKey = 'Public Holiday';
                System.debug('   ✅ Using Public Holiday category');
            } 
            // ============================================================
            // 🔥 PRIORITY 2: WEEKEND (Saturday/Sunday)
            // ============================================================
            else if (shift.Shift_Day_Name__c != null && 
                    (shift.Shift_Day_Name__c.equalsIgnoreCase('Saturday') || 
                    shift.Shift_Day_Name__c.equalsIgnoreCase('Sunday'))) {
                // Use the day name as the category key
                categoryKey = shift.Shift_Day_Name__c; // "Saturday" or "Sunday"
                System.debug('   ✅ Using Weekend category: ' + categoryKey);
                
                if (categoryKey.equalsIgnoreCase('Saturday')) {
                    weekendDaysFound.add('saturday');
                } else if (categoryKey.equalsIgnoreCase('Sunday')) {
                    weekendDaysFound.add('sunday');
                }
                hasWeekendShifts = true;
            } 
            // ============================================================
            // 🔥 PRIORITY 3: USE SHIFT_CATEGORY__c (Morning, Afternoon, Night, General, Custom, etc.)
            // ============================================================
            else {
                if (String.isBlank(shift.Shift_Category__c)) {
                    System.debug('⚠️ Skipping shift with blank Category: ' + shift.Id);
                    continue;
                }
                // Keep the category name as is (preserve case for matching)
                categoryKey = shift.Shift_Category__c.trim();
                System.debug('   ✅ Using Shift Category: ' + categoryKey);
            }

            // Store day name and facility for this category
            categoryDayNameMap.put(categoryKey, shift.Shift_Day_Name__c);
            categoryFacilityMap.put(categoryKey, shift.Shift_Facility__c);
            categoryIsPublicHoliday.put(categoryKey, shift.Public_holiday__c);

            // Calculate rate and duration
            Decimal effectiveRate;
            Decimal duration = shift.Actual_Duration__c != null ? shift.Actual_Duration__c : 0;

            if (categoryKey.toLowerCase() == 'custom') {
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
            if (categoryKey.toLowerCase().contains('sleepover')) {
                if (!sleepoverCategoryData.containsKey(categoryKey)) {
                    sleepoverCategoryData.put(categoryKey, new List<Decimal>{0, 0});
                }

                List<Decimal> data = sleepoverCategoryData.get(categoryKey);
                data[0] += duration;
                if (effectiveRate != 0) {
                    data[1] = effectiveRate;
                }
                
                categoryDayNameMap.put(categoryKey, shift.Shift_Day_Name__c);
                categoryFacilityMap.put(categoryKey, shift.Shift_Facility__c);
                categoryIsPublicHoliday.put(categoryKey, shift.Public_holiday__c);
            } else {
                if (!categoryTotalHours.containsKey(categoryKey)) {
                    categoryTotalHours.put(categoryKey, 0);
                    categoryShiftCount.put(categoryKey, 0);
                    categoryRates.put(categoryKey, 0);
                }
                
                categoryTotalHours.put(categoryKey, categoryTotalHours.get(categoryKey) + duration);
                categoryShiftCount.put(categoryKey, categoryShiftCount.get(categoryKey) + 1);
                if (categoryRates.get(categoryKey) == 0 && effectiveRate != 0) {
                    categoryRates.put(categoryKey, effectiveRate);
                }
            }
        }

        // ============================================================
        // BUILD FINAL CATEGORY TO HOURLY RATE MAP
        // ============================================================
        Map<String, Decimal> categoryToHourlyRate = new Map<String, Decimal>();

        // Normal categories
        for (String categoryKey : categoryRates.keySet()) {
            Decimal rate = categoryRates.get(categoryKey);
            Decimal totalHours = categoryTotalHours.get(categoryKey);
            String dayName = categoryDayNameMap.get(categoryKey);
            Boolean isPublicHoliday = categoryIsPublicHoliday.get(categoryKey);
            
            categoryToHourlyRate.put(categoryKey, rate);
            System.debug('📊 Category: ' + categoryKey + 
                        ', Rate: ' + rate + 
                        ', Hours: ' + totalHours + 
                        ', Day: ' + dayName + 
                        ', Public Holiday: ' + isPublicHoliday);
        }

        // BROKEN SHIFT RATE
        if (totalBrokenHours > 0 && totalBrokenRate != 0) {
            categoryToHourlyRate.put('broken shift', totalBrokenRate);
            System.debug('📊 Broken Shift Rate: ' + totalBrokenRate + ', Hours: ' + totalBrokenHours);
        }

        // SLEEPOVER FINAL RATES
        for (String categoryKey : sleepoverCategoryData.keySet()) {
            List<Decimal> data = sleepoverCategoryData.get(categoryKey);
            Decimal totalHours = data[0];
            Decimal rate = data[1];
            
            if (rate != 0) {
                categoryToHourlyRate.put(categoryKey, rate);
                String dayName = categoryDayNameMap.get(categoryKey);
                System.debug('📊 Sleepover Category: ' + categoryKey + 
                            ', Rate: ' + rate + 
                            ', Hours: ' + totalHours + 
                            ', Day: ' + dayName);
            }
        }

        System.debug('✅ Final Category Rates: ' + JSON.serializePretty(categoryToHourlyRate));
        System.debug('📋 Category Day Name Map: ' + JSON.serializePretty(categoryDayNameMap));
        System.debug('📋 Category Facility Map: ' + JSON.serializePretty(categoryFacilityMap));

        // ============================================================
        // 🚨 VALIDATE WEEKEND RATES EXIST AND ARE ACTIVE
        // ============================================================
        if (hasWeekendShifts) {
            System.debug('🚨 Weekend shifts detected - validating weekend rates...');
            
            Map<String, String> weekendRateErrors = new Map<String, String>();
            Set<String> processedWeekendDays = new Set<String>();

            for (String weekendDay : weekendDaysFound) {
                if (processedWeekendDays.contains(weekendDay)) continue;
                processedWeekendDays.add(weekendDay);
                
                // Find a category that has this day
                String facilityIdForDay = shiftFacilityId;
                String sampleCategory = null;
                
                for (String category : categoryDayNameMap.keySet()) {
                    String dayName = categoryDayNameMap.get(category);
                    if (String.isNotBlank(dayName) && dayName.toLowerCase().contains(weekendDay.substring(0, 3))) {
                        sampleCategory = category;
                        if (String.isNotBlank(categoryFacilityMap.get(category))) {
                            facilityIdForDay = categoryFacilityMap.get(category);
                        }
                        break;
                    }
                }
                
                System.debug('🔍 Validating weekend rate for: ' + weekendDay + ' (Facility: ' + facilityIdForDay + ')');
                
                // Try to find the day-specific rate
                String dayRateId = findFacilityRateForCategory(weekendDay, facilityIdForDay, facilityRateMap);
                
                if (String.isBlank(dayRateId)) {
                    // ❌ No rate configured
                    String errorMsg = 
                        '❌ No earning rate configured for ' + weekendDay.substring(0, 1).toUpperCase() + weekendDay.substring(1) + 
                        ' shifts in Facility Xero Settings.\n\n' +
                        'Please create a Facility_Xero_Setting__c record with:\n' +
                        '  • Category__c = "' + weekendDay.substring(0, 1).toUpperCase() + weekendDay.substring(1) + '"' + '\n' +
                        '  • Xero_Payitem__c = [Valid Xero Earning Rate ID for ' + weekendDay.substring(0, 1).toUpperCase() + weekendDay.substring(1) + ']' + '\n' +
                        '  • Facility_Role__c = [Facility Role for ' + (String.isNotBlank(facilityIdForDay) ? facilityIdForDay : 'this facility') + ']';
                    
                    weekendRateErrors.put(weekendDay, errorMsg);
                    System.debug('❌ ' + errorMsg);
                    
                } else {
                    // Validate the rate is active in Xero
                    Map<String, Object> validationResult = isEarningRateActiveInXeroWithDetails(
                        dayRateId,
                        ctx.accessToken,
                        ctx.tenantId
                    );
                    
                    Boolean isValid = (Boolean) validationResult.get('isValid');
                    String rateName = (String) validationResult.get('rateName');
                    String message = (String) validationResult.get('message');
                    
                    if (!isValid) {
                        // ❌ Rate is INACTIVE in Xero
                        String errorMsg = 
                            '❌ The ' + weekendDay.substring(0, 1).toUpperCase() + weekendDay.substring(1) + 
                            ' earning rate is INACTIVE or not found in Xero.\n\n' +
                            'Rate ID: ' + dayRateId + '\n' +
                            'Rate Name: ' + (String.isNotBlank(rateName) ? rateName : 'Unknown') + '\n' +
                            'Error: ' + message + '\n\n' +
                            'Please activate this rate in Xero or update the Facility Xero Setting with a valid rate ID.';
                        
                        weekendRateErrors.put(weekendDay, errorMsg);
                        System.debug('❌ ' + errorMsg);
                        
                    } else {
                        System.debug('✅ ' + weekendDay + ' rate is ACTIVE: ' + rateName + ' (' + dayRateId + ')');
                    }
                }
            }

            // ============================================================
            // 🚨 IF WEEKEND RATE VALIDATION FAILS, BLOCK SUBMISSION
            // ============================================================
            if (!weekendRateErrors.isEmpty()) {
                System.debug('❌ Weekend rate validation failed for staff: ' + staff.Display_Nickname__c);
                
                String errorMessage = '❌ Cannot send timesheet to Xero: Weekend rates are not properly configured.\n\n';
                for (String day : weekendRateErrors.keySet()) {
                    errorMessage += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
                    errorMessage += weekendRateErrors.get(day) + '\n';
                }
                errorMessage += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
                errorMessage += '⚠️ To fix this issue:\n';
                errorMessage += '1. Go to Facility Xero Settings\n';
                errorMessage += '2. Create/update records for Saturday and Sunday categories\n';
                errorMessage += '3. Ensure the Xero earning rates are ACTIVE\n';
                errorMessage += '4. Try sending the timesheet again\n';
                
                StaffProcessingResult errorResult = new StaffProcessingResult(
                    staff.Id,
                    staff.Display_Nickname__c,
                    false,
                    errorMessage
                );
                errorResult.showInPopup = true;
                ctx.results.add(errorResult);
                return; // ⛔ STOP - don't send to Xero
            }
            
            System.debug('✅ Weekend rate validation passed for: ' + staff.Display_Nickname__c);
        }

        // ============================================================
        // GET USER-SELECTED RATES FOR THIS STAFF
        // ============================================================
        Map<String, String> staffSelectedRates = ctx.selectedCategoryRates != null 
            ? ctx.selectedCategoryRates.get(staff.Id) 
            : null;
        
        System.debug('📋 User-selected rates for staff ' + staff.Display_Nickname__c + ': ' + JSON.serialize(staffSelectedRates));

        // ============================================================
        // BUILD EMPLOYEE PAY TEMPLATE - WITH DAY-SPECIFIC RATES
        // ============================================================
        List<Object> earningsLines = new List<Object>();

        Set<String> addedRateIds = new Set<String>();
        
        Boolean ordinaryRateAdded = false;
        Decimal ordinaryRateValue = 0;
        
        List<String> failedCategories = new List<String>();

        // Get day name variations map
        Map<String, List<String>> dayNameVariations = getDayNameToRateKeys();

        for (String category : categoryToHourlyRate.keySet()) {

            String matchedEarningRateId = null;
            
            // Get day name and facility ID for this category
            String dayName = categoryDayNameMap.get(category);
            String categoryFacilityId = shiftFacilityId;
            if (String.isNotBlank(categoryFacilityMap.get(category))) {
                categoryFacilityId = categoryFacilityMap.get(category);
            }
            
            System.debug('🔍 Processing employee category: ' + category + 
                        ', Day: ' + dayName + 
                        ', Facility: ' + categoryFacilityId);
            
            // FIRST: Try user-selected rate
            if (staffSelectedRates != null) {
                matchedEarningRateId = getSelectedRateForCategory(staffSelectedRates, category);
            }
            
            if (String.isNotBlank(matchedEarningRateId)) {
                System.debug('✅ Using user-selected rate for category ' + category + ': ' + matchedEarningRateId);
                String validatedRateId = validateAndGetActiveRate(
                    matchedEarningRateId,
                    xeroEmployeeId,
                    ctx
                );
                if (String.isNotBlank(validatedRateId)) {
                    matchedEarningRateId = validatedRateId;
                } else {
                    System.debug('⚠️ User-selected rate is INACTIVE for category: ' + category);
                    matchedEarningRateId = null;
                }
            }
            
            // SECOND: Try day-specific rate (SUNDAY, SATURDAY, etc.)
            if (String.isBlank(matchedEarningRateId) && String.isNotBlank(dayName)) {
                String dayCategory = dayName.toLowerCase().trim();
                
                // Try all day name variations
                List<String> dayKeys = new List<String>{dayCategory};
                if (dayNameVariations.containsKey(dayCategory)) {
                    dayKeys.addAll(dayNameVariations.get(dayCategory));
                }
                
                for (String dayKey : dayKeys) {
                    matchedEarningRateId = findFacilityRateForCategory(
                        dayKey,
                        categoryFacilityId,
                        facilityRateMap
                    );
                    if (String.isNotBlank(matchedEarningRateId)) {
                        System.debug('✅ Found day-specific rate for category "' + category + 
                                    '" (Day: ' + dayName + ', Key: ' + dayKey + '): ' + matchedEarningRateId);
                        String validatedRateId = validateAndGetActiveRate(
                            matchedEarningRateId,
                            xeroEmployeeId,
                            ctx
                        );
                        if (String.isNotBlank(validatedRateId)) {
                            matchedEarningRateId = validatedRateId;
                            break;
                        } else {
                            System.debug('⚠️ Day-specific rate is INACTIVE for key: ' + dayKey);
                            matchedEarningRateId = null;
                        }
                    }
                }
            }
            
            // THIRD: Try facility-specific rate
            if (String.isBlank(matchedEarningRateId)) {
                matchedEarningRateId = findFacilityRateForCategory(
                    category,
                    categoryFacilityId,
                    facilityRateMap
                );
                if (String.isNotBlank(matchedEarningRateId)) {
                    System.debug('✅ Found facility-specific rate for category ' + category + ': ' + matchedEarningRateId);
                    String validatedRateId = validateAndGetActiveRate(
                        matchedEarningRateId,
                        xeroEmployeeId,
                        ctx
                    );
                    if (String.isNotBlank(validatedRateId)) {
                        matchedEarningRateId = validatedRateId;
                    } else {
                        System.debug('⚠️ Facility-specific rate is INACTIVE for category: ' + category);
                        matchedEarningRateId = null;
                    }
                }
            }
            
            // FOURTH: Try org config fallback
            if (String.isBlank(matchedEarningRateId)) {
                matchedEarningRateId = findMatchingEarningRate(category, ctx.categoryToEarningRateMap);
                if (String.isNotBlank(matchedEarningRateId)) {
                    System.debug('✅ Found matching rate from Facility_Xero_Setting for category ' + category + ': ' + matchedEarningRateId);
                    String validatedRateId = validateAndGetActiveRate(
                        matchedEarningRateId,
                        xeroEmployeeId,
                        ctx
                    );
                    if (String.isNotBlank(validatedRateId)) {
                        matchedEarningRateId = validatedRateId;
                    } else {
                        System.debug('⚠️ Matched rate is INACTIVE for category: ' + category);
                        matchedEarningRateId = null;
                    }
                }
            }
            
            // FIFTH: Use Ordinary rate as fallback
            if (String.isBlank(matchedEarningRateId) && String.isNotBlank(ordinaryEarningsRateId)) {
                System.debug('🔍 Using Ordinary Earnings Rate as fallback for category: ' + category);
                matchedEarningRateId = ordinaryEarningsRateId;
                String validatedRateId = validateAndGetActiveRate(
                    matchedEarningRateId,
                    xeroEmployeeId,
                    ctx
                );
                if (String.isNotBlank(validatedRateId)) {
                    matchedEarningRateId = validatedRateId;
                } else {
                    System.debug('⚠️ Ordinary Earnings Rate is INACTIVE for category: ' + category);
                    matchedEarningRateId = null;
                }
            }

            if (String.isBlank(matchedEarningRateId)) {
                System.debug('❌ No active rate found for category: ' + category);
                failedCategories.add(category);
                continue;
            }

            Decimal rateValue = categoryToHourlyRate.get(category);
            
            if (matchedEarningRateId.equals(ordinaryEarningsRateId)) {
                ordinaryRateAdded = true;
                ordinaryRateValue = rateValue;
                System.debug('✅ This rate IS the Xero Ordinary Earnings Rate with value: ' + rateValue);
            }
            
            if (addedRateIds.contains(matchedEarningRateId) && !matchedEarningRateId.equals(ordinaryEarningsRateId)) {
                System.debug('⏭️ Skipping duplicate rate: ' + matchedEarningRateId);
                continue;
            }
            
            if (matchedEarningRateId.equals(ordinaryEarningsRateId) && addedRateIds.contains(matchedEarningRateId)) {
                for (Integer j = 0; j < earningsLines.size(); j++) {
                    Map<String, Object> existingLine = (Map<String, Object>) earningsLines[j];
                    String existingRateId = (String) existingLine.get('EarningsRateID');
                    if (existingRateId.equals(ordinaryEarningsRateId)) {
                        Decimal existingValue = (Decimal) existingLine.get('RatePerUnit');
                        if (rateValue > existingValue) {
                            existingLine.put('RatePerUnit', rateValue);
                            ordinaryRateValue = rateValue;
                            System.debug('🔄 Updated Ordinary Earnings Rate value from ' + existingValue + ' to ' + rateValue);
                        }
                        break;
                    }
                }
                continue;
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

        // If there were any failed categories, skip this staff
        if (!failedCategories.isEmpty()) {
            System.debug('❌ Skipping staff due to inactive rates for categories: ' + failedCategories);
            
            String errorDetails = '';
            for (String category : failedCategories) {
                String rateId = null;
                Boolean hadRateButInactive = false;
                
                if (ctx.categoryToEarningRateMap != null) {
                    String categoryLower = category.toLowerCase().trim();
                    if (ctx.categoryToEarningRateMap.containsKey(categoryLower)) {
                        rateId = ctx.categoryToEarningRateMap.get(categoryLower);
                        hadRateButInactive = true;
                    } else {
                        for (String key : ctx.categoryToEarningRateMap.keySet()) {
                            if (key.toLowerCase().contains(categoryLower) || categoryLower.contains(key.toLowerCase())) {
                                rateId = ctx.categoryToEarningRateMap.get(key);
                                hadRateButInactive = true;
                                break;
                            }
                        }
                    }
                }
                
                if (hadRateButInactive && String.isNotBlank(rateId) && ctx.invalidRateErrors != null && ctx.invalidRateErrors.containsKey(rateId)) {
                    String errorMsg = ctx.invalidRateErrors.get(rateId);
                    errorDetails += '\n• ' + errorMsg;
                } else if (hadRateButInactive && String.isNotBlank(rateId)) {
                    errorDetails += '\n• Category "' + category + '" has rate ID "' + rateId + '" but it could not be validated. Please check this rate in Xero settings.';
                } else {
                    errorDetails += '\n• Category "' + category + '" has NO earning rate configured in Xero Settings. Please add a rate mapping for this category.';
                }
            }
            
            String errorMessage = 'Cannot send timesheet to Xero: Missing or inactive earning rates for categories: ' + String.join(failedCategories, ', ') + 
                '. Please configure valid rates in Xero settings.' + 
                (String.isNotBlank(errorDetails) ? '\n\nDetails:\n' + errorDetails : '');
            
            StaffProcessingResult errorResult = new StaffProcessingResult(
                staff.Id,
                staff.Display_Nickname__c,
                false,
                errorMessage
            );
            errorResult.showInPopup = true;
            ctx.results.add(errorResult);
            return;
        }

        // Ensure Xero Ordinary Earnings Rate is always included
        if (String.isNotBlank(ordinaryEarningsRateId)) {
            if (!ordinaryRateAdded) {
                earningsLines.add(
                    new Map<String, Object>{
                        'EarningsRateID' => ordinaryEarningsRateId,
                        'CalculationType' => 'ENTEREARNINGSRATE',
                        'RatePerUnit' => 0
                    }
                );
                System.debug('➕ Added Xero Ordinary Earnings Rate with 0 (not found in categories)');
            } else {
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
        // BUILD TIMESHEET HOURS MAP (FIXED - WITH NULL CHECKS)
        // ============================================================
        Map<String, Map<Date, Decimal>> categoryDateHoursMap = new Map<String, Map<Date, Decimal>>();

        System.debug('📊 Building categoryDateHoursMap from shifts...');

        for (ShiftwithStaff__c shift : shifts) {
            String categoryKey;
            Decimal duration;

            if (shift.Broken_Shift__c) {
                categoryKey = 'broken shift';
                duration = shift.Broken_Total_Duration__c != null ? shift.Broken_Total_Duration__c : 0;
            } else if (shift.Type_of_shift__c != null && shift.Type_of_shift__c.equalsIgnoreCase('Sleepover Shift')) {
                categoryKey = 'Sleepover Shift';
                duration = shift.Actual_Duration__c != null ? shift.Actual_Duration__c : 0;
            } else {
                if (String.isBlank(shift.Shift_Category__c)) {
                    System.debug('⚠️ Skipping shift with blank Category: ' + shift.Id);
                    continue;
                }

                if (shift.Public_holiday__c == true) {
                    categoryKey = 'Public Holiday';
                } else if (shift.Shift_Day_Name__c != null && 
                            (shift.Shift_Day_Name__c.equalsIgnoreCase('Saturday') || 
                            shift.Shift_Day_Name__c.equalsIgnoreCase('Sunday'))) {
                    categoryKey = shift.Shift_Day_Name__c;
                } else {
                    categoryKey = shift.Shift_Category__c.trim();
                }

                duration = shift.Actual_Duration__c != null ? shift.Actual_Duration__c : 0;
            }

            // ✅ FIX: Guard null Date and zero/null duration before Map.put
            if (shift.Date__c == null) {
                System.debug('⚠️ Skipping shift with null Date__c: ' + shift.Id);
                continue;
            }
            if (duration == null || duration == 0) {
                System.debug('⚠️ Skipping shift with null/zero duration: ' + shift.Id + ' category: ' + categoryKey);
                continue;
            }

            if (!categoryDateHoursMap.containsKey(categoryKey)) {
                categoryDateHoursMap.put(categoryKey, new Map<Date, Decimal>());
            }

            Map<Date, Decimal> dateMap = categoryDateHoursMap.get(categoryKey);
            Decimal existing = dateMap.containsKey(shift.Date__c) ? dateMap.get(shift.Date__c) : 0;
            dateMap.put(shift.Date__c, existing + duration);
            
            System.debug('📊 Added to categoryDateHoursMap: ' + categoryKey + ' | Date: ' + shift.Date__c + ' | Hours: ' + (existing + duration));
        }

        // ✅ CRITICAL: Check if categoryDateHoursMap is empty
        if (categoryDateHoursMap.isEmpty()) {
            System.debug('❌ categoryDateHoursMap is EMPTY! No shifts were processed.');
            String errorMsg = 'No valid shifts found for ' + staff.Display_Nickname__c + 
                '. Please check that shifts have proper categories.';
            throw new AuraHandledException(errorMsg);
        }

        System.debug('📊 categoryDateHoursMap keys: ' + categoryDateHoursMap.keySet());

        // ============================================================
        // TIMESHEET LINES - WITH DAY-SPECIFIC RATES (FIXED)
        // ============================================================
        List<Object> timesheetLines = new List<Object>();

        // 🔥 FIX: Do NOT use addedRateIds for timesheets - we need a line per category
        // Removed the addedRateIds variable that was causing duplicate skipping
        List<String> failedTimesheetCategories = new List<String>();

        for (String category : categoryDateHoursMap.keySet()) {
            System.debug('🔍 Processing timesheet category: ' + category + 
                        ', Day: ' + categoryDayNameMap.get(category) + 
                        ', Facility: ' + categoryFacilityMap.get(category));
            
            String earningRateId = null;
            
            // Get day name and facility ID for this category
            String dayName = categoryDayNameMap.get(category);
            String categoryFacilityId = categoryFacilityMap.get(category);
            if (String.isBlank(categoryFacilityId)) {
                categoryFacilityId = shiftFacilityId;
            }
            
            // FIRST: Try user-selected rate
            if (staffSelectedRates != null) {
                earningRateId = getSelectedRateForCategory(staffSelectedRates, category);
            }
            
            if (String.isNotBlank(earningRateId)) {
                System.debug('✅ Using user-selected rate for timesheet category ' + category + ': ' + earningRateId);
                String validatedRateId = validateAndGetActiveRate(
                    earningRateId,
                    xeroEmployeeId,
                    ctx
                );
                if (String.isNotBlank(validatedRateId)) {
                    earningRateId = validatedRateId;
                } else {
                    System.debug('⚠️ User-selected rate is INACTIVE for timesheet category: ' + category);
                    earningRateId = null;
                }
            }
            
            // SECOND: Try day-specific rate
            if (String.isBlank(earningRateId) && String.isNotBlank(dayName)) {
                String dayCategory = dayName.toLowerCase().trim();
                
                // Try exact day name first
                earningRateId = findFacilityRateForCategory(
                    dayCategory,
                    categoryFacilityId,
                    facilityRateMap
                );
                
                if (String.isBlank(earningRateId)) {
                    // Try day name variations
                    Map<String, List<String>> dayNameVariationsLocal = getDayNameToRateKeys();
                    List<String> dayKeys = dayNameVariationsLocal.containsKey(dayCategory) 
                        ? dayNameVariationsLocal.get(dayCategory) 
                        : new List<String>{dayCategory};
                    
                    for (String dayKey : dayKeys) {
                        earningRateId = findFacilityRateForCategory(
                            dayKey,
                            categoryFacilityId,
                            facilityRateMap
                        );
                        if (String.isNotBlank(earningRateId)) {
                            System.debug('✅ Found day-specific rate for timesheet category "' + category + 
                                        '" (Day: ' + dayName + ', Key: ' + dayKey + '): ' + earningRateId);
                            break;
                        }
                    }
                }
                
                if (String.isNotBlank(earningRateId)) {
                    String validatedRateId = validateAndGetActiveRate(
                        earningRateId,
                        xeroEmployeeId,
                        ctx
                    );
                    if (String.isNotBlank(validatedRateId)) {
                        earningRateId = validatedRateId;
                    } else {
                        System.debug('⚠️ Day-specific rate is INACTIVE for category: ' + category);
                        earningRateId = null;
                    }
                }
            }
            
            // THIRD: Try facility-specific rate
            if (String.isBlank(earningRateId)) {
                earningRateId = findFacilityRateForCategory(
                    category,
                    categoryFacilityId,
                    facilityRateMap
                );
                if (String.isNotBlank(earningRateId)) {
                    System.debug('✅ Found facility-specific rate for timesheet category ' + category + ': ' + earningRateId);
                    String validatedRateId = validateAndGetActiveRate(
                        earningRateId,
                        xeroEmployeeId,
                        ctx
                    );
                    if (String.isNotBlank(validatedRateId)) {
                        earningRateId = validatedRateId;
                    } else {
                        System.debug('⚠️ Facility-specific rate is INACTIVE for timesheet category: ' + category);
                        earningRateId = null;
                    }
                }
            }
            
            // FOURTH: Try org config fallback
            if (String.isBlank(earningRateId)) {
                earningRateId = findMatchingEarningRate(category, ctx.categoryToEarningRateMap);
                if (String.isNotBlank(earningRateId)) {
                    System.debug('✅ Found matching rate from Facility_Xero_Setting for timesheet category ' + category + ': ' + earningRateId);
                    String validatedRateId = validateAndGetActiveRate(
                        earningRateId,
                        xeroEmployeeId,
                        ctx
                    );
                    if (String.isNotBlank(validatedRateId)) {
                        earningRateId = validatedRateId;
                    } else {
                        System.debug('⚠️ Matched rate is INACTIVE for timesheet category: ' + category);
                        earningRateId = null;
                    }
                }
            }
            
            // FIFTH: Use Ordinary rate as fallback
            if (String.isBlank(earningRateId) && String.isNotBlank(ordinaryEarningsRateId)) {
                System.debug('🔍 Using Ordinary Earnings Rate as fallback for timesheet category: ' + category);
                earningRateId = ordinaryEarningsRateId;
                String validatedRateId = validateAndGetActiveRate(
                    earningRateId,
                    xeroEmployeeId,
                    ctx
                );
                if (String.isNotBlank(validatedRateId)) {
                    earningRateId = validatedRateId;
                } else {
                    System.debug('⚠️ Ordinary Earnings Rate is INACTIVE for timesheet category: ' + category);
                    earningRateId = null;
                }
            }
            
            if (String.isBlank(earningRateId)) {
                System.debug('❌ No active rate found for timesheet category: ' + category);
                failedTimesheetCategories.add(category);
                continue;
            }

            // ✅ Get units for this category
            Map<Date, Decimal> dateMap = categoryDateHoursMap.get(category);
            if (dateMap == null) {
                System.debug('⚠️ No date map found for category: ' + category);
                failedTimesheetCategories.add(category);
                continue;
            }

            List<Decimal> units = new List<Decimal>();
            for (Date d = ctx.startDate; d <= ctx.endDate; d = d.addDays(1)) {
                Decimal hrs = dateMap.containsKey(d) ? dateMap.get(d).setScale(2) : 0;
                units.add(hrs);
                if (hrs > 0) {
                    System.debug('   📅 ' + d + ': ' + hrs + ' hours');
                }
            }
            
            // Check if there are any hours for this category
            Decimal totalUnits = 0;
            for (Decimal u : units) {
                totalUnits += u;
            }
            
            if (totalUnits == 0) {
                System.debug('⚠️ No hours for category: ' + category + ', skipping');
                continue;
            }

            Decimal rateValue = categoryToHourlyRate.get(category);
            if (rateValue == null) {
                rateValue = 0;
            }

            // 🔥 FIX: REMOVED the duplicate check - we need a line for each category
            // The old code would skip if addedRateIds.contains(earningRateId)
            // This was causing the Saturday shift to be skipped

            Map<String, Object> timesheetLine = new Map<String, Object>{
                'EarningsRateID' => earningRateId,
                'NumberOfUnits' => units,
                'RatePerUnit' => rateValue
            };

            if (!String.isBlank(ctx.trackingItemId)) {
                timesheetLine.put('TrackingItemID', ctx.trackingItemId);
                System.debug('🏷️ Added Tracking Item ID to timesheet line: ' + ctx.trackingItemId);
            }

            timesheetLines.add(timesheetLine);
            
            System.debug('✅ Added timesheet line for category: ' + category + 
                        ' | Rate: ' + rateValue + 
                        ' | Earning Rate ID: ' + earningRateId + 
                        ' | Total Units: ' + totalUnits);
        }

        // If there were any failed timesheet categories, skip this staff
        if (!failedTimesheetCategories.isEmpty()) {
            System.debug('❌ Skipping staff timesheet due to inactive rates for categories: ' + failedTimesheetCategories);
            
            String errorDetails = '';
            for (String category : failedTimesheetCategories) {
                String rateId = null;
                Boolean hadRateButInactive = false;
                
                if (ctx.categoryToEarningRateMap != null) {
                    String categoryLower = category.toLowerCase().trim();
                    if (ctx.categoryToEarningRateMap.containsKey(categoryLower)) {
                        rateId = ctx.categoryToEarningRateMap.get(categoryLower);
                        hadRateButInactive = true;
                    } else {
                        for (String key : ctx.categoryToEarningRateMap.keySet()) {
                            if (key.toLowerCase().contains(categoryLower) || categoryLower.contains(key.toLowerCase())) {
                                rateId = ctx.categoryToEarningRateMap.get(key);
                                hadRateButInactive = true;
                                break;
                            }
                        }
                    }
                }
                
                if (hadRateButInactive && String.isNotBlank(rateId) && ctx.invalidRateErrors != null && ctx.invalidRateErrors.containsKey(rateId)) {
                    String errorMsg = ctx.invalidRateErrors.get(rateId);
                    errorDetails += '\n• ' + errorMsg;
                } else if (hadRateButInactive && String.isNotBlank(rateId)) {
                    errorDetails += '\n• Category "' + category + '" has rate ID "' + rateId + '" but it could not be validated.';
                } else {
                    errorDetails += '\n• Category "' + category + '" has NO earning rate configured in Facility Xero Settings.';
                }
            }
            
            String errorMessage = 'Cannot send timesheet to Xero: Missing or inactive earning rates for timesheet categories: ' + String.join(failedTimesheetCategories, ', ') + 
                '. Please configure valid rates in Xero settings.' + 
                (String.isNotBlank(errorDetails) ? '\n\nDetails:\n' + errorDetails : '');
            
            StaffProcessingResult errorResult = new StaffProcessingResult(
                staff.Id,
                staff.Display_Nickname__c,
                false,
                errorMessage
            );
            errorResult.showInPopup = true;
            ctx.results.add(errorResult);
            return;
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
                'Status' => 'APPROVED',
                'TimesheetLines' => timesheetLines
            }
        );

        System.debug('✅ Staff prepared: ' + staff.Display_Nickname__c);
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

            if (
                res.getStatusCode() != 200 &&
                res.getStatusCode() != 201
            ) {
                System.debug('❌ Xero Timesheet API Error - Status: ' + res.getStatusCode());
                System.debug('❌ Response Body: ' + res.getBody());
                
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
                System.debug('⚠️ parseXeroDate: rawDate is blank');
                return null;
            }

            Pattern p = Pattern.compile('(\\d+)');
            Matcher m = p.matcher(rawDate);

            if (!m.find()) {
                System.debug('⚠️ parseXeroDate: No numeric value found in: ' + rawDate);
                return null;
            }

            Long millis = Long.valueOf(m.group(1));

            if (millis == null || millis == 0) {
                System.debug('⚠️ parseXeroDate: Invalid millis value: ' + millis);
                return null;
            }

            Datetime epoch = Datetime.newInstanceGMT(1970, 1, 1, 0, 0, 0);
            Datetime dt = epoch.addSeconds(Integer.valueOf(millis / 1000));

            return dt.date(); } catch (Exception e) { return null;
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
    // SEND SELECTED PAY PERIOD TIMESHEETS (FIXED)
    // ============================================================
    @AuraEnabled
    public static List<StaffProcessingResult> sendSelectedPayPeriodTimesheets(
        List<String> staffIds,
        List<String> startDates,
        List<String> endDates,
        Map<String, Map<String, String>> categoryRateSelections
    ) {
        System.debug('🚀 ===== START sendSelectedPayPeriodTimesheets =====');
        System.debug('📊 categoryRateSelections: ' + JSON.serializePretty(categoryRateSelections));

        List<StaffProcessingResult> finalResults = new List<StaffProcessingResult>();

        try {

            System.debug('📊 Staff IDs JSON:\n' + JSON.serializePretty(staffIds));
            System.debug('📊 Start Dates JSON:\n' + JSON.serializePretty(startDates));
            System.debug('📊 End Dates JSON:\n' + JSON.serializePretty(endDates));

            if (staffIds == null || startDates == null || endDates == null ||
                staffIds.isEmpty() || startDates.isEmpty() || endDates.isEmpty()) {
                
                System.debug('⚠️ No valid resend requests received.');
                StaffProcessingResult failed = new StaffProcessingResult(
                    null, null, false, 'No staff selected for resend.'
                );
                failed.showInPopup = true;
                finalResults.add(failed);
                return finalResults;
            }

            if (staffIds.size() != startDates.size() || staffIds.size() != endDates.size()) {
                System.debug('❌ Payload size mismatch.');
                StaffProcessingResult failed = new StaffProcessingResult(
                    null, null, false, 'Invalid resend payload. Staff/date counts do not match.'
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
                trackingItemId = 'dummy_tracking_item_id'; } else { accessToken = XeroIntegrationController.getAccessTokenFromXero(); tenantId = XeroIntegrationController.getTenantId(accessToken); ProcessingContext tempCtx = new ProcessingContext(); tempCtx.accessToken = accessToken; tempCtx.tenantId = tenantId; trackingItemId = fetchTrackingItemIdFromXero(tempCtx);
                
                System.debug('🏷️ Tracking Item ID: ' + trackingItemId);
            }

            System.debug('🔹 Access Token Present: ' + !String.isBlank(accessToken));
            System.debug('🔹 Tenant ID: ' + tenantId);

            if (String.isBlank(accessToken) || String.isBlank(tenantId)) { StaffProcessingResult failed = new StaffProcessingResult( null, null, false, 'Missing Xero Access Token or Tenant ID.' ); failed.showInPopup = true; finalResults.add(failed); return finalResults;
            }

            // ============================================================
            // CURRENT USER ORG
            // ============================================================
            User currentUser = [SELECT Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
            System.debug('🏢 Current User Org: ' + currentUser.Organization_Name__c);

            Organisation__c orgRecord = [
                SELECT Id, Name
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];

            System.debug('🏢 Organisation Loaded: ' + orgRecord.Name);

            // ============================================================
            // BUILD EARNING RATE MAP - FROM FACILITY XERO SETTINGS ONLY
            // ============================================================
            Map<String, String> earningRateMap = new Map<String, String>();
            
            System.debug('📋 Building Earning Rate Map from Facility Xero Settings...');
            
            List<Facility_Role__c> facilityRoles = [
                SELECT Id, 
                    Role_Name__c,
                    Facility_Xero_Setting__r.Category__c,
                    Facility_Xero_Setting__r.Shift_Type__c,
                    Facility_Xero_Setting__r.Xero_Payitem__c,
                    Facility_Xero_Setting__r.Xero_Payitem_Name__c
                FROM Facility_Role__c
                WHERE Facility__r.Organisation__c = :orgRecord.Id
                AND Facility_Xero_Setting__c != null
                AND Facility_Xero_Setting__r.Xero_Payitem__c != null
                AND Facility_Xero_Setting__r.Xero_Payitem__c != ''
            ];
            
            System.debug('📊 Found ' + facilityRoles.size() + ' Facility Roles with Xero Settings');
            
            for (Facility_Role__c role : facilityRoles) { if (role.Facility_Xero_Setting__r != null) { String rateId = role.Facility_Xero_Setting__r.Xero_Payitem__c; if (String.isNotBlank(rateId)) { if (!String.isBlank(role.Facility_Xero_Setting__r.Category__c)) { String categoryKey = role.Facility_Xero_Setting__r.Category__c.trim().toLowerCase(); earningRateMap.put(categoryKey, rateId); } if (!String.isBlank(role.Facility_Xero_Setting__r.Shift_Type__c)) { String shiftKey = role.Facility_Xero_Setting__r.Shift_Type__c.trim().toLowerCase(); earningRateMap.put(shiftKey, rateId);
                            System.debug('   ✅ Mapped Shift Type: "' + role.Facility_Xero_Setting__r.Shift_Type__c + '" → ' + rateId);
                        }
                    }
                }
            }
            
            System.debug('📋 Total Earning Rate Mappings: ' + earningRateMap.size());
            System.debug('📋 Earning Rate Map (JSON): ' + JSON.serialize(earningRateMap));

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
                    Date parsedStartDate = Date.valueOf(startDates[i]);
                    Date parsedEndDate = Date.valueOf(endDates[i]);

                    System.debug('================================================');
                    System.debug('🔹 Processing Staff: ' + parsedStaffId);
                    System.debug('📅 Start Date: ' + parsedStartDate);
                    System.debug('📅 End Date: ' + parsedEndDate);
                    System.debug('================================================');

                    staff = [
                        SELECT Id, NameToDisplay__c, Display_Nickname__c, 
                            Xero_Employee_ID__c, Ordinary_Earnings_Rate_ID__c
                        FROM Staff__c
                        WHERE Id = :parsedStaffId
                        LIMIT 1
                    ];

                    System.debug('👤 Staff Loaded: ' + staff.Display_Nickname__c);

                    // ============================================================
                    // ✅ FIX: Check if Xero_Employee_ID__c is null
                    // ============================================================
                    if (String.isBlank(staff.Xero_Employee_ID__c)) {
                        System.debug('❌ Staff has no Xero Employee ID: ' + staff.Display_Nickname__c);
                        
                        StaffProcessingResult failed = new StaffProcessingResult(
                            staff.Id, 
                            staff.Display_Nickname__c, 
                            false,
                            '❌ This staff member is not synced with Xero. Please sync the staff record with Xero first.\n\n' +
                            'How to fix:\n' +
                            '1. Go to Staff Management\n' +
                            '2. Find "' + staff.Display_Nickname__c + '"\n' +
                            '3. Click "Sync with Xero"\n' +
                            '4. Try sending the timesheet again'
                        );
                        failed.showInPopup = true;
                        finalResults.add(failed);
                        continue; // Skip this staff
                    }

                    ctx = new ProcessingContext();
                    ctx.accessToken = accessToken;
                    ctx.tenantId = tenantId;
                    ctx.trackingItemId = trackingItemId;
                    ctx.startDate = parsedStartDate;
                    ctx.endDate = parsedEndDate;
                    ctx.orgRecord = orgRecord;
                    ctx.categoryToEarningRateMap = earningRateMap;
                    
                    if (categoryRateSelections != null) {
                        ctx.selectedCategoryRates = categoryRateSelections;
                        System.debug('📋 Selected Rates for Staff: ' + JSON.serializePretty(ctx.selectedCategoryRates));
                    }

                    System.debug('🔍 Fetching earnings rate from Xero for: ' + staff.Display_Nickname__c);
                    
                    String fetchedRateId = fetchOrdinaryEarningsRateFromXero(
                        staff.Xero_Employee_ID__c, ctx
                    );
                    
                    if (String.isBlank(fetchedRateId)) {
                        StaffProcessingResult failed = new StaffProcessingResult(
                            staff.Id, staff.Display_Nickname__c, false,
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
                            new Staff__c(Id = staff.Id, Ordinary_Earnings_Rate_ID__c = fetchedRateId)
                        );
                    }

                    System.debug('🚀 Calling processSingleStaffForBulk...');
                    processSingleStaffForBulk(staff, ctx); if (!ctx.employeePayloads.isEmpty()) { sendBulkEmployeePayTemplates(ctx); } if (!ctx.timesheetPayloads.isEmpty()) { sendBulkTimesheets(ctx); } finalResults.addAll(ctx.results);

                } catch (Exception ex) {

                    String errorMessage;
                    if (ex instanceof AuraHandledException) {
                        errorMessage = ex.getMessage();
                        if (errorMessage == 'Script-thrown exception') {
                            errorMessage = 'No approved shifts found for the selected period.';
                        }
                    } else {
                        errorMessage = ex.getTypeName() + ' | ' + ex.getMessage() + ' | Line: ' + ex.getLineNumber();
                    }

                    System.debug('💥 Staff Processing Error: ' + errorMessage);

                    StaffProcessingResult failed = new StaffProcessingResult(
                        parsedStaffId, staff != null ? staff.Display_Nickname__c : 'Unknown',
                        false, errorMessage
                    );
                    failed.showInPopup = true;
                    finalResults.add(failed);
                }
            }

            if (!staffToUpdateList.isEmpty()) {
                System.debug('🔄 Updating ' + staffToUpdateList.size() + ' staff records after callouts');
                try {
                    Database.update(staffToUpdateList, false); } catch (Exception updateEx) {
                    System.debug('❌ Failed to update staff records: ' + updateEx.getMessage());
                }
            }

            System.debug('✅ Final Results Count: ' + finalResults.size());
            System.debug('🚀 ===== END sendSelectedPayPeriodTimesheets =====');

            return finalResults; } catch (Exception e) { String exactError = e.getTypeName() + ' | ' + e.getMessage() + ' | Line: ' + e.getLineNumber(); StaffProcessingResult failed = new StaffProcessingResult(null, null, false, exactError); failed.showInPopup = true; finalResults.add(failed); return finalResults;
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
            System.debug('📋 ProcessingContext Details:');
            System.debug('   - Access Token Present: ' + (ctx.accessToken != null ? 'Yes' : 'No'));
            System.debug('   - Tenant ID: ' + ctx.tenantId);
            System.debug('   - Start Date: ' + ctx.startDate);
            System.debug('   - End Date: ' + ctx.endDate);

            Http http = new Http();

            System.debug('📡 Making API call to Xero Tracking Categories...');
            System.debug('📍 Endpoint: https://api.xero.com/api.xro/2.0/TrackingCategories');
            
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
            System.debug('📥 Response Body Length: ' + (res.getBody() != null ? res.getBody().length() : 0));

            if (res.getBody() != null) {
                try {
                    Object jsonObj = JSON.deserializeUntyped(res.getBody());
                    String formattedJson = JSON.serializePretty(jsonObj);
                    
                    System.debug('====================================================');
                    System.debug('📄 FULL XERO API RESPONSE (Formatted JSON):');
                    System.debug('====================================================');
                    System.debug(formattedJson);
                    System.debug('====================================================');
                    System.debug('📄 JSON Response Length: ' + formattedJson.length() + ' characters');
                    System.debug('====================================================');
                } catch (Exception formatEx) {
                    System.debug('⚠️ Could not format JSON, displaying raw response:');
                    System.debug(res.getBody());
                }
            }

            if (res.getStatusCode() != 200) {
                System.debug('❌ Failed to fetch tracking categories');
                System.debug('❌ Status Code: ' + res.getStatusCode());
                System.debug('❌ Response: ' + res.getBody());
                
                try {
                    Map<String, Object> errorMap = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                    System.debug('❌ Error Details: ' + JSON.serializePretty(errorMap));
                    if (errorMap.containsKey('Message')) {
                        System.debug('❌ Xero Error Message: ' + errorMap.get('Message'));
                    }
                    if (errorMap.containsKey('Type')) {
                        System.debug('❌ Xero Error Type: ' + errorMap.get('Type'));
                    }
                } catch (Exception parseEx) {
                    System.debug('⚠️ Could not parse error response: ' + parseEx.getMessage());
                }
                return null;
            }

            Map<String, Object> responseMap =
                (Map<String, Object>) JSON.deserializeUntyped(
                    res.getBody()
                );
            
            System.debug('📊 Response parsed successfully');
            System.debug('📊 Response Keys: ' + responseMap.keySet());

            List<Object> trackingCategories =
                (List<Object>) responseMap.get('TrackingCategories');

            if (trackingCategories == null || trackingCategories.isEmpty()) {
                System.debug('❌ No tracking categories found in Xero');
                System.debug('💡 Suggestion: Create a tracking category in Xero first');
                return null;
            }

            System.debug('📊 Found ' + trackingCategories.size() + ' tracking categories in Xero');
            
            System.debug('====================================================');
            System.debug('📄 COMPLETE XERO RESPONSE (with Tracking Categories):');
            System.debug('====================================================');
            System.debug(JSON.serializePretty(responseMap));
            System.debug('====================================================');

            System.debug('====================================================');
            System.debug('🔍 DETAILED TRACKING CATEGORIES ANALYSIS:');
            System.debug('====================================================');
            
            Integer categoryIndex = 0;
            Integer activeCategoryCount = 0;
            Integer totalOptionsCount = 0;
            Integer activeOptionsCount = 0;
            List<Map<String, String>> activeOptionsList = new List<Map<String, String>>();
            List<Map<String, String>> inactiveOptionsList = new List<Map<String, String>>();

            for (Object catObj : trackingCategories) {
                Map<String, Object> category =
                    (Map<String, Object>) catObj;

                String name = (String) category.get('Name');
                String categoryId = (String) category.get('TrackingCategoryID');
                String status = (String) category.get('Status');
                
                categoryIndex++;
                System.debug('📋 [' + categoryIndex + '] Processing Tracking Category:');
                System.debug('   📍 Name: ' + name);
                System.debug('   📍 ID: ' + categoryId);
                System.debug('   📍 Status: ' + status);
                
                System.debug('   📄 Full Category JSON: ' + JSON.serializePretty(category));

                if (!String.isBlank(status) && !status.equalsIgnoreCase('ACTIVE')) {
                    System.debug('⏭️ SKIPPING inactive category: ' + name + ' (Status: ' + status + ')');
                    System.debug('   💡 Only ACTIVE categories can be used');
                    continue;
                }
                
                activeCategoryCount++;
                System.debug('✅ Active category found: ' + name);

                List<Object> options =
                    (List<Object>) category.get('Options');
                
                if (options == null || options.isEmpty()) {
                    System.debug('⚠️ No options found for category: ' + name);
                    System.debug('   💡 Create at least one option in this category');
                    continue;
                }

                System.debug('📊 Found ' + options.size() + ' options for category: ' + name);
                totalOptionsCount += options.size();
                
                System.debug('   📄 All Options JSON: ' + JSON.serializePretty(options));

                Integer optionIndex = 0;
                for (Object optObj : options) {
                    Map<String, Object> option =
                        (Map<String, Object>) optObj;

                    String optionName = (String) option.get('Name');
                    String optionId = (String) option.get('TrackingOptionID');
                    String optionStatus = (String) option.get('Status');

                    optionIndex++;
                    System.debug('   [' + optionIndex + '] Option Details:');
                    System.debug('      📍 Name: ' + optionName);
                    System.debug('      📍 ID: ' + optionId);
                    System.debug('      📍 Status: ' + optionStatus);
                    System.debug('      📄 Full Option JSON: ' + JSON.serializePretty(option));

                    Boolean isActive = String.isBlank(optionStatus) || optionStatus.equalsIgnoreCase('ACTIVE');
                    
                    if (isActive) {
                        System.debug('      ✅ ACTIVE option found!');
                        activeOptionsCount++;
                        
                        Map<String, String> activeOption = new Map<String, String>();
                        activeOption.put('id', optionId);
                        activeOption.put('name', optionName);
                        activeOption.put('categoryName', name);
                        activeOption.put('categoryId', categoryId);
                        activeOption.put('status', optionStatus != null ? optionStatus : 'ACTIVE');
                        activeOptionsList.add(activeOption);
                        
                        System.debug('      🎯 RETURNING this active option');
                        System.debug('✅ SUCCESS: Using tracking option from Xero');
                        System.debug('   📍 Category: ' + name + ' (' + categoryId + ')');
                        System.debug('   📍 Option: ' + optionName + ' (' + optionId + ')');
                        System.debug('   📍 Status: ' + (optionStatus != null ? optionStatus : 'ACTIVE (default)'));
                        
                        return optionId;
                    } else {
                        System.debug('      ⏭️ INACTIVE option - Skipping (Status: ' + optionStatus + ')');
                        inactiveOptionsList.add(new Map<String, String>{
                            'id' => optionId,
                            'name' => optionName,
                            'status' => optionStatus
                        });
                    }
                }
            }

            System.debug('====================================================');
            System.debug('📊 TRACKING OPTIONS SUMMARY:');
            System.debug('   Total Categories: ' + categoryIndex);
            System.debug('   Active Categories: ' + activeCategoryCount);
            System.debug('   Total Options: ' + totalOptionsCount);
            System.debug('   Active Options: ' + activeOptionsCount);
            System.debug('   Inactive Options: ' + inactiveOptionsList.size());
            System.debug('====================================================');

            if (!inactiveOptionsList.isEmpty()) {
                System.debug('⚠️ INACTIVE OPTIONS FOUND (Cannot be used):');
                for (Map<String, String> inactive : inactiveOptionsList) {
                    System.debug('   - ' + inactive.get('name') + ' (' + inactive.get('id') + ') - Status: ' + inactive.get('status'));
                }
            }

            if (!activeOptionsList.isEmpty()) { for (Map<String, String> active : activeOptionsList) {
                    System.debug('   - ' + active.get('name') + ' (' + active.get('id') + ')');
                }
            }

            if (activeOptionsCount == 0) {
                System.debug('❌ NO ACTIVE TRACKING OPTIONS FOUND IN XERO');
                System.debug('====================================================');
                System.debug('💡 SUGGESTIONS TO FIX THIS ISSUE:');
                System.debug('   1. Check if tracking categories exist in Xero');
                System.debug('   2. Ensure tracking categories have Status = "ACTIVE"');
                System.debug('   3. Ensure options within categories have Status = "ACTIVE"');
                System.debug('   4. Create a new tracking category with an active option');
                System.debug('   5. Reactivate an existing tracking option');
                System.debug('====================================================');
                
                if (categoryIndex == 0) {
                    System.debug('💡 No tracking categories found in Xero at all');
                    System.debug('   Solution: Create a tracking category in Xero');
                } else if (activeCategoryCount == 0) {
                    System.debug('💡 Found categories but none are ACTIVE');
                    System.debug('   Solution: Activate an existing category in Xero');
                } else if (totalOptionsCount == 0) {
                    System.debug('💡 Found active categories but no options');
                    System.debug('   Solution: Create options within the category in Xero');
                } else if (activeOptionsCount == 0 && totalOptionsCount > 0) {
                    System.debug('💡 Found options but none are ACTIVE');
                    System.debug('   Solution: Activate an existing option in Xero');
                }
                
                return null;
            }

            System.debug('⚠️ Falling back to first available option from first active category');
            
            for (Object catObj : trackingCategories) {
                Map<String, Object> category = (Map<String, Object>) catObj;
                String status = (String) category.get('Status');
                
                if (!String.isBlank(status) && !status.equalsIgnoreCase('ACTIVE')) {
                    continue;
                }
                
                List<Object> options = (List<Object>) category.get('Options');
                if (options != null && !options.isEmpty()) {
                    Map<String, Object> firstOption = (Map<String, Object>) options[0];
                    String optionId = (String) firstOption.get('TrackingOptionID');
                    String optionName = (String) firstOption.get('Name');
                    String categoryName = (String) category.get('Name');
                    String categoryId = (String) category.get('TrackingCategoryID');
                    
                    System.debug('⚠️ WARNING: Using first available option (may be INACTIVE)');
                    System.debug('   📍 Category: ' + categoryName + ' (' + categoryId + ')');
                    System.debug('   📍 Option: ' + optionName + ' (' + optionId + ')');
                    System.debug('   ⚠️ This may cause "unable to find trackingCategoryId" error');
                    
                    return optionId;
                }
            }

            System.debug('❌ No tracking options available at all');
            return null;

        } catch (Exception e) {
            System.debug(
                '❌ ERROR in fetchTrackingItemIdFromXero: ' +
                e.getMessage()
            );
            System.debug(
                '❌ Error Type: ' +
                e.getTypeName()
            );
            System.debug(
                '❌ Line Number: ' +
                e.getLineNumber()
            );
            System.debug(
                '❌ Stack Trace: ' +
                e.getStackTraceString()
            );
            
            if (e.getMessage() != null) {
                if (e.getMessage().contains('System.CalloutException')) {
                    System.debug('❌ Callout Exception - Check network connectivity or Xero API availability');
                } else if (e.getMessage().contains('JSON')) {
                    System.debug('❌ JSON Parsing Error - Check response format from Xero');
                } else if (e.getMessage().contains('NullPointer')) {
                    System.debug('❌ Null Pointer Exception - Check if required fields are present in response');
                }
            }
            
            return null;
        }
    }

    // ============================================================
    // VALIDATE PAY PERIOD BEFORE RATE SELECTOR
    // ============================================================
    @AuraEnabled
    public static Map<String, Object> validatePayPeriodBeforeRateSelector(
        List<Id> staffIds,
        String startDateStr,
        String endDateStr
    ) {
        Map<String, Object> result = new Map<String, Object>();
        List<Map<String, Object>> validationResults = new List<Map<String, Object>>();
        Boolean allValid = true;
        Boolean hasMismatch = false;
        
        try {
            if (staffIds == null || staffIds.isEmpty()) {
                result.put('success', false);
                result.put('message', 'No staff IDs provided');
                return result;
            }
            
            if (String.isBlank(startDateStr) || String.isBlank(endDateStr)) { result.put('success', false); result.put('message', 'Start date or end date is missing'); return result;
            }
            
            Date startDate = Date.valueOf(startDateStr);
            Date endDate = Date.valueOf(endDateStr);
            
            if (startDate > endDate) { result.put('success', false); result.put('message', 'Start date cannot be after end date'); return result;
            }
            
            String accessToken = null;
            String tenantId = null;
            
            try {
                accessToken = XeroIntegrationController.getAccessTokenFromXero();
                System.debug('✅ Access Token obtained: ' + (String.isNotBlank(accessToken) ? 'Yes' : 'No'));
            } catch (Exception e) {
                System.debug('❌ Error getting access token: ' + e.getMessage());
                result.put('success', false);
                result.put('message', 'Failed to get Xero access token: ' + e.getMessage());
                return result;
            }
            
            if (String.isBlank(accessToken)) { result.put('success', false); result.put('message', 'Failed to get Xero access token. Please check your Xero connection.'); return result;
            }
            
            try {
                tenantId = XeroIntegrationController.getTenantId(accessToken); } catch (Exception e) { result.put('success', false); result.put('message', 'Failed to get Xero tenant ID: ' + e.getMessage()); return result;
            }
            
            if (String.isBlank(tenantId)) { result.put('success', false); result.put('message', 'Failed to get Xero tenant ID. Please check your Xero connection.'); return result;
            }
            
            for (Id staffId : staffIds) {
                Map<String, Object> staffResult = new Map<String, Object>();
                staffResult.put('staffId', staffId);
                staffResult.put('isValid', true);
                staffResult.put('payPeriodMismatch', false);
                staffResult.put('message', 'Pay period is valid');
                staffResult.put('showInPopup', false);
                
                try {
                    Staff__c staff = [SELECT Id, Display_Nickname__c, Xero_Employee_ID__c 
                                    FROM Staff__c WHERE Id = :staffId LIMIT 1];
                    
                    staffResult.put('staffName', staff.Display_Nickname__c);
                    staffResult.put('xeroEmployeeId', staff.Xero_Employee_ID__c);
                    
                    if (String.isBlank(staff.Xero_Employee_ID__c)) {
                        staffResult.put('isValid', false); staffResult.put('payPeriodMismatch', false); staffResult.put('showInPopup', true); staffResult.put('message', '❌ ' + staff.Display_Nickname__c + 
                            ' is not synced with Xero. Please sync this staff member with Xero before sending timesheets.'); allValid = false; validationResults.add(staffResult);
                        continue;
                    }
                    
                    Map<String, Object> xeroCycle = null;
                    try {
                        xeroCycle = getXeroPayrollCycleForStaff(
                            staff.Xero_Employee_ID__c,
                            staff.Id,
                            accessToken,
                            tenantId,
                            startDate ); } catch (Exception e) { staffResult.put('isValid', false); staffResult.put('payPeriodMismatch', false); staffResult.put('showInPopup', true); staffResult.put('message', '❌ Could not determine Xero pay cycle for ' +  staff.Display_Nickname__c + ': ' + e.getMessage()); allValid = false; validationResults.add(staffResult); continue;
                    }
                    
                   if (xeroCycle == null) { staffResult.put('isValid', false); staffResult.put('payPeriodMismatch', false); staffResult.put('showInPopup', true);
                        
                        // 🔥 FIX: More informative error message
                        String errorMsg = '❌ Could not determine Xero pay cycle for ' + 
                            staff.Display_Nickname__c + '. Please check the employee\'s payroll calendar in Xero.\n\n' +
                            'Possible causes:\n' +
                            '• Employee does not have a Payroll Calendar assigned in Xero\n' +
                            '• Employee is not active in Xero\n' +
                            '• The Payroll Calendar ID is missing or invalid\n\n' +
                            'Please verify in Xero:\n' +
                            '1. Go to Payroll → Employees\n' +
                            '2. Select "' + staff.Display_Nickname__c + '"\n' +
                            '3. Check the "Payroll Calendar" field\n' +
                            '4. If blank, assign a calendar and try again';
                        
                        staffResult.put('message', errorMsg);
                        allValid = false;
                        validationResults.add(staffResult);
                        continue;
                    }
                    
                    Date payPeriodStart = (Date) xeroCycle.get('payPeriodStart');
                    Date payPeriodEnd = (Date) xeroCycle.get('payPeriodEnd');
                    
                    if (payPeriodStart == null || payPeriodEnd == null) { staffResult.put('isValid', false); staffResult.put('payPeriodMismatch', false); staffResult.put('showInPopup', true); staffResult.put('message', '❌ Invalid pay period dates from Xero for ' +  staff.Display_Nickname__c); allValid = false; validationResults.add(staffResult); continue;
                    }
                    
                    staffResult.put('selectedStartDate', startDate);
                    staffResult.put('selectedEndDate', endDate);
                    staffResult.put('selectedStartDay', getDayName(startDate));
                    staffResult.put('selectedEndDay', getDayName(endDate));
                    staffResult.put('suggestedStartDate', payPeriodStart);
                    staffResult.put('suggestedEndDate', payPeriodEnd);
                    staffResult.put('suggestedStartDay', getDayName(payPeriodStart));
                    staffResult.put('suggestedEndDay', getDayName(payPeriodEnd));
                    
                    Boolean isStartValid = startDate >= payPeriodStart && startDate <= payPeriodEnd;
                    Boolean isEndValid = endDate >= payPeriodStart && endDate <= payPeriodEnd;
                    
                    if (!isStartValid || !isEndValid) {
                        staffResult.put('isValid', false);
                        staffResult.put('payPeriodMismatch', true);
                        staffResult.put('showInPopup', true);
                        staffResult.put('message', '⚠️ The selected timesheet period does not match ' + 
                            staff.Display_Nickname__c + '\'s Xero pay cycle. The correct pay period is ' +
                            formatDateForDisplay(payPeriodStart) + ' to ' + 
                            formatDateForDisplay(payPeriodEnd) + '.');
                        allValid = false;
                        hasMismatch = true; } } catch (Exception e) { staffResult.put('isValid', false); staffResult.put('payPeriodMismatch', false); staffResult.put('showInPopup', true); staffResult.put('message', '❌ Error validating ' + staffResult.get('staffName') +  ': ' + e.getMessage()); allValid = false;
                }
                
                validationResults.add(staffResult);
            }
            
            result.put('success', true);
            result.put('allValid', allValid);
            result.put('hasMismatch', hasMismatch);
            result.put('results', validationResults);
            result.put('selectedStartDate', startDate);
            result.put('selectedEndDate', endDate); } catch (Exception e) { result.put('success', false); result.put('message', 'Validation error: ' + e.getMessage()); result.put('results', new List<Map<String, Object>>());
        }
        
        return result;
    }

    // ============================================================
    // GET ALL EARNING RATE SETTINGS FOR THE CURRENT USER'S ORGANISATION
    // ============================================================
    public static Map<Id, Map<String, Object>> getOrganisationEarningRateSettings() {
        Map<Id, Map<String, Object>> settingsMap = new Map<Id, Map<String, Object>>();
        
        try {
            String currentUserId = UserInfo.getUserId();
            
            User currentUser = [
                SELECT Id, Organization_Name__c
                FROM User
                WHERE Id = :currentUserId
                LIMIT 1
            ];
            
            System.debug('👤 Current User: ' + currentUser.Id);
            System.debug('🏢 Organisation Name: ' + currentUser.Organization_Name__c);
            
            if (String.isBlank(currentUser.Organization_Name__c)) { return settingsMap;
            }
            
            Organisation__c org = [
                SELECT Id, Name 
                FROM Organisation__c 
                WHERE Name = :currentUser.Organization_Name__c 
                LIMIT 1
            ];
            
            if (org == null) { return settingsMap;
            }
            
            String organisationId = org.Id;
            System.debug('🏢 Organisation: ' + org.Name + ' (' + organisationId + ')');
            
            List<Facility_Xero_Setting__c> settings = [
                SELECT
                    Id,
                    Name,
                    Xero_Payitem__c,
                    Xero_Payitem_Name__c,
                    Category__c,
                    Shift_Type__c,
                    Custom_Shift_Type__c,
                    Custom_Rate_Type__c,
                    Broken_Type__c,
                    Sleepover_Type__c,
                    Facility_Role__c,
                    Facility_Role__r.Id,
                    Facility_Role__r.Role_Name__c,
                    Facility_Role__r.Facility__c,
                    Facility_Role__r.Facility__r.Name,
                    Facility_Role__r.Facility__r.Organisation__c
                FROM Facility_Xero_Setting__c
                WHERE Facility_Role__c != null
                AND Facility_Role__r.Facility__r.Organisation__c = :organisationId
            ];
            
            System.debug('📊 Found ' + settings.size() + ' Xero Settings with Facility Roles');
            
            for (Facility_Xero_Setting__c setting : settings) { Map<String, Object> settingData = new Map<String, Object>{ 'Id' => setting.Id, 'Name' => setting.Name, 'Xero_Payitem__c' => setting.Xero_Payitem__c, 'Xero_Payitem_Name__c' => setting.Xero_Payitem_Name__c, 'Category__c' => setting.Category__c, 'Shift_Type__c' => setting.Shift_Type__c, 'Custom_Shift_Type__c' => setting.Custom_Shift_Type__c, 'Broken_Type__c' => setting.Broken_Type__c, 'Facility_Role__c' => setting.Facility_Role__c, 'Facility_Role_Name__c' => setting.Facility_Role__r?.Role_Name__c, 'Facility_Name__c' => setting.Facility_Role__r?.Facility__r?.Name, 'Facility_Id' => setting.Facility_Role__r.Facility__c, 'Sleepover_Type__c' => setting.Sleepover_Type__c, 'Custom_Rate_Type__c' => setting.Custom_Rate_Type__c }; settingsMap.put(setting.Id, settingData);
                
                System.debug('✅ Found Setting: ' + setting.Name + 
                    ' | Rate ID: ' + setting.Xero_Payitem__c +
                    ' | Rate Name: ' + setting.Xero_Payitem_Name__c);
            }
            
            System.debug('✅ Total settings found: ' + settingsMap.size());
            
            // ============================================================
            // 🔥 ENHANCED JSON FORMATTED DEBUG OUTPUT
            // ============================================================
            System.debug('====================================================');
            System.debug('📄 COMPLETE ORGANISATION EARNING RATE SETTINGS (Formatted JSON):');
            System.debug('====================================================');
            
            // Convert to a serializable format
            Map<String, Object> serializableMap = new Map<String, Object>();
            for (Id settingId : settingsMap.keySet()) {  Map<String, Object> settingData = settingsMap.get(settingId); Map<String, Object> cleanData = new Map<String, Object>(); for (String key : settingData.keySet()) {Object value = settingData.get(key); if (value == null) { cleanData.put(key, ''); } else { cleanData.put(key, value); } } serializableMap.put(String.valueOf(settingId), cleanData);
            }
            
            // Pretty print the JSON
            String prettyJson = JSON.serializePretty(serializableMap);
            System.debug(prettyJson);
            System.debug('====================================================');
            System.debug('📄 JSON Length: ' + prettyJson.length() + ' characters');
            System.debug('====================================================');
            
            // Also log a summary of the settings in a readable format
            System.debug('📋 SETTINGS SUMMARY:');
            System.debug('====================================================');
            for (Id settingId : settingsMap.keySet()) {
                Map<String, Object> setting = settingsMap.get(settingId);
                System.debug('🔹 Setting ID: ' + settingId);
                System.debug('   📌 Name: ' + setting.get('Name'));
                System.debug('   📌 Rate ID: ' + setting.get('Xero_Payitem__c'));
                System.debug('   📌 Rate Name: ' + setting.get('Xero_Payitem_Name__c'));
                System.debug('   📌 Category: ' + setting.get('Category__c'));
                System.debug('   📌 Shift Type: ' + setting.get('Shift_Type__c'));
                System.debug('   📌 Facility: ' + setting.get('Facility_Name__c'));
                System.debug('   📌 Facility ID: ' + setting.get('Facility_Id'));
                System.debug('   📌 Facility Role: ' + setting.get('Facility_Role_Name__c'));
                System.debug('   ➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖');
            }
            System.debug('====================================================');
            
        } catch (Exception e) {
            System.debug('❌ Error getting organisation earning rate settings: ' + e.getMessage());
            System.debug('❌ Stack Trace: ' + e.getStackTraceString());
        }
        
        return settingsMap;
    }
}