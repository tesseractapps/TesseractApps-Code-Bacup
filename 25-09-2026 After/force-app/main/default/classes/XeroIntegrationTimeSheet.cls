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

            if (empRes.getStatusCode() != 200) {
                System.debug('❌ Employee API returned: ' + empRes.getStatusCode());
                System.debug('❌ Response: ' + empRes.getBody());
                return null;
            }

            Map<String, Object> empMap = (Map<String, Object>) JSON.deserializeUntyped(empRes.getBody());

            if (empMap == null) {
                System.debug('❌ Failed to parse employee response');
                return null;
            }

            List<Object> employees = (List<Object>) empMap.get('Employees');

            if (employees == null || employees.isEmpty()) {
                System.debug('❌ No employees found in response');
                return null;
            }

            Map<String, Object> employee = (Map<String, Object>) employees[0];

            if (employee == null) {
                System.debug('❌ Employee object is null');
                return null;
            }

            String payrollCalendarId = (String) employee.get('PayrollCalendarID');

            System.debug('Payroll Calendar ID: ' + payrollCalendarId);

            if (String.isBlank(payrollCalendarId)) {
                System.debug('❌ Payroll Calendar ID is blank');
                return null;
            }

            // GET PAYROLL CALENDAR
            HttpRequest calReq = new HttpRequest();
            calReq.setEndpoint(
                'https://api.xero.com/payroll.xro/1.0/PayrollCalendars/' +
                payrollCalendarId
            );
            calReq.setMethod('GET');
            calReq.setHeader('Authorization', 'Bearer ' + accessToken);
            calReq.setHeader('Xero-tenant-id', tenantId);
            calReq.setHeader('Accept', 'application/json');

            HttpResponse calRes = http.send(calReq);

            System.debug('Calendar API Status: ' + calRes.getStatusCode());
            System.debug('Calendar API Body: ' + calRes.getBody());

            if (calRes.getStatusCode() != 200) {
                System.debug('❌ Calendar API returned: ' + calRes.getStatusCode());
                return null;
            }

            Map<String, Object> calMap = (Map<String, Object>) JSON.deserializeUntyped(calRes.getBody());

            if (calMap == null) {
                System.debug('❌ Failed to parse calendar response');
                return null;
            }

            List<Object> calendars = (List<Object>) calMap.get('PayrollCalendars');

            if (calendars == null || calendars.isEmpty()) {
                System.debug('❌ No calendars found');
                return null;
            }

            Map<String, Object> calendar = (Map<String, Object>) calendars[0];

            if (calendar == null) {
                System.debug('❌ Calendar object is null');
                return null;
            }

            String calendarType = (String) calendar.get('CalendarType');
            String startDateRaw = (String) calendar.get('StartDate');

            System.debug('Calendar Type: ' + calendarType);
            System.debug('Calendar StartDate Raw: ' + startDateRaw);

            Date anchorDate = parseXeroDate(startDateRaw);

            if (anchorDate == null) {
                System.debug('❌ Failed to parse anchor date: ' + startDateRaw);
                return null;
            }

            System.debug('Anchor Date: ' + anchorDate);

            // CALCULATE PAY PERIOD
            Integer cycleLength = 7;

            if (!String.isBlank(calendarType) && calendarType.equalsIgnoreCase('FORTNIGHTLY')) {
                cycleLength = 14;
            }

            Integer daysBetween = anchorDate.daysBetween(startDate);
            Integer remainder = Math.mod(daysBetween, cycleLength);

            if (remainder < 0) {
                remainder += cycleLength;
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
        
        // Add day-specific keywords
        if (categoryLower.contains('sunday') || categoryLower.contains('sun')) {
            keywords.add('sunday');
        }
        if (categoryLower.contains('saturday') || categoryLower.contains('sat')) {
            keywords.add('saturday');
        }
        if (categoryLower.contains('weekend')) {
            keywords.add('weekend');
        }
        if (categoryLower.contains('weekday')) {
            keywords.add('weekday');
        }
        
        if (keywords.isEmpty()) {
            List<String> words = categoryLower.split(' ');
            for (String word : words) {
                if (word.length() > 2) {
                    keywords.add(word);
                }
            }
        }
        
        if (keywords.isEmpty()) {
            keywords.add(categoryLower);
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
            
            if (employees == null || employees.isEmpty()) {
                result.put('success', false);
                result.put('message', 'No employee found in Xero');
                return result;
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
                            if (currentRecord == null || !currentRecord) {
                                System.debug('⏭️ Skipping inactive rate: ' + name);
                                continue;
                            }
                            
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
                            
                            Map<String, Object> rateMap = new Map<String, Object>();
                            rateMap.put('id', rateId);
                            rateMap.put('name', name != null ? name : 'Unnamed Rate');
                            rateMap.put('rateType', rateType != null ? rateType : '');
                            rateMap.put('earningsType', earningsType != null ? earningsType : '');
                            rateMap.put('isCurrent', currentRecord != null ? currentRecord : false);
                            rateMap.put('typeOfUnits', typeOfUnits);
                            
                            if (ratePerUnit != null) {
                                rateMap.put('ratePerUnit', ratePerUnit);
                            } else if (fixedAmount != null) {
                                rateMap.put('ratePerUnit', fixedAmount);
                            } else {
                                rateMap.put('ratePerUnit', 0);
                            }
                            
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
    // FIND FACILITY-SPECIFIC RATE FOR CATEGORY (WITH ROLE)
    // ============================================================
    public static String findFacilityRateForCategory(
        String category,
        String facilityId,
        String roleName,
        Map<String, Map<String, String>> facilityRateMap
    ) {
        if (String.isBlank(category)) return null;
        
        String categoryLower = category.toLowerCase().trim();
        String roleKey = String.isNotBlank(roleName) ? roleName.trim() : null;
        
        System.debug('🔍 findFacilityRateForCategory:');
        System.debug('   Category: ' + category);
        System.debug('   Facility ID: ' + facilityId);
        System.debug('   Role: "' + roleKey + '"');
        
        // 1. Try with the shift's facility
        if (String.isNotBlank(facilityId) && facilityRateMap.containsKey(facilityId)) {
            Map<String, String> rateMap = facilityRateMap.get(facilityId);
            
            // ✅ Try combined key: Role + Category (CASE-SENSITIVE for role)
            if (String.isNotBlank(roleKey)) {
                String combinedKey = roleKey + '|' + categoryLower;
                if (rateMap.containsKey(combinedKey)) {
                    System.debug('   ✅ Exact match found for Role "' + roleKey + '" + Category "' + category + '": ' + rateMap.get(combinedKey));
                    return rateMap.get(combinedKey);
                }
            }
            
            // Try with just category (fallback)
            if (rateMap.containsKey(categoryLower)) {
                System.debug('   ✅ Category match found (no role): ' + rateMap.get(categoryLower));
                return rateMap.get(categoryLower);
            }
        }
        
        System.debug('   ❌ No matching rate found for Role "' + roleKey + '" + Category "' + category + '"');
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
        
        if (String.isBlank(rateId) || String.isBlank(accessToken) || String.isBlank(tenantId)) {
            result.put('message', 'Missing required parameters for rate validation');
            return result;
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
                earningsRates.add(earningsRateObj);
            } else {
                earningsRates = (List<Object>) responseMap.get('earningsRates');
            }
            
            if (earningsRates == null || earningsRates.isEmpty()) {
                result.put('message', 'No earnings rate data found in Xero response');
                return result;
            }
            
            Map<String, Object> rate = (Map<String, Object>) earningsRates[0];
            
            // Get rate name
            String rateName = (String) rate.get('name');
            if (rateName == null) {
                rateName = (String) rate.get('Name');
            }
            if (String.isBlank(rateName)) {
                rateName = rateId;
            }
            result.put('rateName', rateName);
            
            // Check currentRecord
            Boolean currentRecord = (Boolean) rate.get('currentRecord');
            if (currentRecord == null) {
                currentRecord = (Boolean) rate.get('CurrentRecord');
            }
            
            if (currentRecord == null || !currentRecord) {
                result.put('isValid', false);
                result.put('message', 'The earning rate "' + rateName + '" is INACTIVE in Xero. Please activate this rate in Xero.');
                return result;
            }
            
            // Check type of units
            String typeOfUnits = (String) rate.get('typeOfUnits');
            if (typeOfUnits == null) {
                typeOfUnits = (String) rate.get('TypeOfUnits');
            }
            
            Boolean isValidUnits = false;
            if (typeOfUnits == null) {
                isValidUnits = true;
            } else if (typeOfUnits.equalsIgnoreCase('Hours') || typeOfUnits.equalsIgnoreCase('hours') || typeOfUnits.equalsIgnoreCase('1')) {
                isValidUnits = true;
            }
            
            if (!isValidUnits) {
                result.put('isValid', false);
                result.put('message', 'The earning rate "' + rateName + '" has invalid units "' + typeOfUnits + '". Expected "Hours".');
                return result;
            }
            
            // Rate is valid
            result.put('isValid', true);
            result.put('message', 'Rate "' + rateName + '" is active and valid');
            
            System.debug('✅ Rate is ACTIVE and valid: ' + rateId + ' - ' + rateName);
            
            return result;
            
        } catch (Exception e) {
            System.debug('❌ Error validating rate: ' + e.getMessage());
            result.put('message', 'Error validating rate: ' + e.getMessage());
            return result;
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
        
        if (categoryLower.contains('sleepover')) {
            for (String key : selectedRates.keySet()) {
                if (key.toLowerCase().contains('sleepover')) {
                    return selectedRates.get(key);
                }
            }
        }
        
        if (categoryLower.contains('broken')) {
            for (String key : selectedRates.keySet()) {
                if (key.toLowerCase().contains('broken')) {
                    return selectedRates.get(key);
                }
            }
        }
        
        if (categoryLower.contains('saturday') || categoryLower.contains('sat')) {
            for (String key : selectedRates.keySet()) {
                String keyLower = key.toLowerCase();
                if (keyLower.contains('saturday') || keyLower.contains('sat') || keyLower.contains('weekend')) {
                    return selectedRates.get(key);
                }
            }
        }
        
        if (categoryLower.contains('sunday') || categoryLower.contains('sun')) {
            for (String key : selectedRates.keySet()) {
                String keyLower = key.toLowerCase();
                if (keyLower.contains('sunday') || keyLower.contains('sun') || keyLower.contains('weekend')) {
                    return selectedRates.get(key);
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
        
        if (categoryLower.contains('broken')) {
            for (String key : categoryToEarningRateMap.keySet()) {
                if (key.contains('broken')) {
                    String rateId = categoryToEarningRateMap.get(key);
                    System.debug('   ✅ Broken shift match found: ' + rateId + ' (key: ' + key + ')');
                    return rateId;
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
        
        if (categoryLower.contains('saturday') || categoryLower.contains('sat')) {
            for (String key : categoryToEarningRateMap.keySet()) {
                if (key.contains('saturday') || key.contains('sat') || key.contains('weekend')) {
                    String rateId = categoryToEarningRateMap.get(key);
                    System.debug('   ✅ Saturday/Weekend match found: ' + rateId + ' (key: ' + key + ')');
                    return rateId;
                }
            }
        }
        
        if (categoryLower.contains('sunday') || categoryLower.contains('sun')) {
            for (String key : categoryToEarningRateMap.keySet()) {
                if (key.contains('sunday') || key.contains('sun') || key.contains('weekend')) {
                    String rateId = categoryToEarningRateMap.get(key);
                    System.debug('   ✅ Sunday/Weekend match found: ' + rateId + ' (key: ' + key + ')');
                    return rateId;
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
                if (keyLower.contains(word)) {
                    String rateId = categoryToEarningRateMap.get(key);
                    System.debug('   ✅ Word match found: ' + rateId + ' (key: ' + key + ', word: ' + word + ')');
                    return rateId;
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
                    return ordinaryEarningsRateId;
                } else {
                    String rateName = (String) validationResult.get('rateName');
                    String message = (String) validationResult.get('message');
                    System.debug('❌ Ordinary Earnings Rate is INACTIVE: ' + rateName);
                    System.debug('   Message: ' + message);
                    if (ctx.invalidRateErrors == null) {
                        ctx.invalidRateErrors = new Map<String, String>();
                    }
                    ctx.invalidRateErrors.put(ordinaryEarningsRateId, message);
                    return null;
                }
            }

            // SECOND: Check in PayTemplate
            System.debug('⚠️ OrdinaryEarningsRateID not found at root level, checking PayTemplate...');
            
            Map<String, Object> payTemplate =
                (Map<String, Object>) employee.get('PayTemplate');

            if (payTemplate != null) {
                List<Object> earningsLines =
                    (List<Object>) payTemplate.get('EarningsLines');

                if (earningsLines != null && !earningsLines.isEmpty()) {
                    
                    System.debug('📊 Found ' + earningsLines.size() + ' earnings lines in PayTemplate');
                    
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

                        if (!String.isBlank(rateId)) {
                            Map<String, Object> validationResult = isEarningRateActiveInXeroWithDetails(
                                rateId,
                                ctx.accessToken,
                                ctx.tenantId
                            );
                            
                            Boolean isValid = (Boolean) validationResult.get('isValid');
                            if (isValid) {
                                System.debug('✅ Using active earnings rate from PayTemplate as ordinary rate: ' + rateId);
                                System.debug('   Rate Name: ' + validationResult.get('rateName'));
                                return rateId;
                            } else {
                                String rateName = (String) validationResult.get('rateName');
                                String message = (String) validationResult.get('message');
                                System.debug('⚠️ Rate ' + rateName + ' is INACTIVE: ' + message);
                                if (ctx.invalidRateErrors == null) {
                                    ctx.invalidRateErrors = new Map<String, String>();
                                }
                                ctx.invalidRateErrors.put(rateId, message);
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
    // FIND EXACT MATCHING RATE FOR SHIFT - STRICT MODE (NO FALLBACK)
    // ⚠️ EXACT MATCH ONLY - NO FALLBACKS - CASE SENSITIVE
    // ============================================================
    public static String findExactRateForShift(
        String category,
        String dayName,
        String facilityId,
        String roleName,
        Map<String, Map<String, String>> facilityRateMap,
        Map<String, Map<String, Map<String, String>>> facilityRoleRateMap
    ) {
        if (String.isBlank(category) || String.isBlank(dayName) || String.isBlank(facilityId)) {
            return null;
        }

        String categoryLower = category.toLowerCase().trim();
        String dayNameLower = dayName.toLowerCase().trim();
        String roleNameExact = String.isNotBlank(roleName) ? roleName.trim() : null;

        System.debug('🔍 findExactRateForShift (STRICT MODE):');
        System.debug('   Category: ' + category);
        System.debug('   Day Name: ' + dayName);
        System.debug('   Facility ID: ' + facilityId);
        System.debug('   Role Name (Case-Sensitive): "' + roleNameExact + '"');

        // ============================================================
        // SCENARIO 0 (NEW): ALREADY-NAMESPACED KEY
        // Handles: broken|allowance, broken|fixed rate,
        //          sleepover|allowance, sleepover|fixed rate,
        //          customshift|..., customrate|...
        // The caller is responsible for disambiguating Broken vs Sleepover.
        // ============================================================
        if (categoryLower.startsWith('broken|')
            || categoryLower.startsWith('sleepover|')
            || categoryLower.startsWith('customshift|')
            || categoryLower.startsWith('customrate|')) {

            System.debug('   🔑 Namespaced key detected: "' + categoryLower + '"');

            if (String.isBlank(roleNameExact) || !facilityRoleRateMap.containsKey(facilityId)) {
                System.debug('   ❌ Role blank OR facility not found in role map');
                return null;
            }

            Map<String, Map<String, String>> roleMap = facilityRoleRateMap.get(facilityId);

            if (!roleMap.containsKey(roleNameExact)) {
                System.debug('   ❌ Role "' + roleNameExact + '" NOT FOUND in facility role map');
                return null;
            }

            Map<String, String> rateMap = roleMap.get(roleNameExact);

            if (rateMap.containsKey(categoryLower)) {
                String rateId = rateMap.get(categoryLower);
                System.debug('   ✅ Found namespaced rate via "' + categoryLower
                    + '" with Role "' + roleNameExact + '": ' + rateId);
                return rateId;
            }

            System.debug('   ❌ Namespaced key "' + categoryLower + '" NOT found for Role "'
                + roleNameExact + '"');
            return null;
        }

        // ============================================================
        // SCENARIO 0.5: BROKEN SUB-TYPE passed as raw "allowance" or "fixed rate"
        // (Legacy callers that haven't been updated to pass namespaced keys.)
        // Try "broken|<subtype>" first.
        // ============================================================
        Boolean isBrokenSubTypeRaw =
            categoryLower.equals('allowance') ||
            categoryLower.equals('fixed rate');

        if (isBrokenSubTypeRaw) {
            System.debug('   🔧 Broken sub-type (raw) detected: ' + category);

            if (String.isNotBlank(roleNameExact) && facilityRoleRateMap.containsKey(facilityId)) {
                Map<String, Map<String, String>> roleMap = facilityRoleRateMap.get(facilityId);

                if (roleMap.containsKey(roleNameExact)) {
                    Map<String, String> rateMap = roleMap.get(roleNameExact);
                    String brokenKey = 'broken|' + categoryLower;

                    if (rateMap.containsKey(brokenKey)) {
                        String rateId = rateMap.get(brokenKey);
                        System.debug('   ✅ Found Broken sub-type via "' + brokenKey + '": ' + rateId);
                        return rateId;
                    }

                    System.debug('   ⚠️ No Broken sub-type key "' + brokenKey
                        + '"; will fall through to Sleepover logic');
                }
            }
            // Do NOT return — fall through to Sleepover handling below
        }

        // ============================================================
        // SCENARIO 1: BROKEN SHIFT - Match by Broken Type
        // ============================================================
        Boolean isBroken = categoryLower.equals('broken') ||
                        categoryLower.equals('broken shift') ||
                        categoryLower.contains('broken');

        if (isBroken) {
            System.debug('   🔧 Broken shift detected.');

            if (String.isBlank(roleNameExact) || !facilityRoleRateMap.containsKey(facilityId)) {
                System.debug('   ❌ Role is blank OR facility not found in role map');
                return null;
            }

            Map<String, Map<String, String>> roleMap = facilityRoleRateMap.get(facilityId);

            if (!roleMap.containsKey(roleNameExact)) {
                System.debug('   ❌ Role "' + roleNameExact + '" NOT FOUND in facility role map');
                return null;
            }

            Map<String, String> rateMap = roleMap.get(roleNameExact);

            // ✅ FIRST: namespaced broken key  broken|<broken_type>
            String brokenKey = 'broken|' + categoryLower;
            if (rateMap.containsKey(brokenKey)) {
                String rateId = rateMap.get(brokenKey);
                System.debug('   ✅ Found Broken rate via namespaced key "' + brokenKey + '": ' + rateId);
                return rateId;
            }

            // ✅ SECOND: plain "broken" category key
            if (rateMap.containsKey('broken')) {
                String rateId = rateMap.get('broken');
                System.debug('   ✅ Found match via Category "broken" with Role "'
                    + roleNameExact + '": ' + rateId);
                return rateId;
            }

            System.debug('   ❌ No match found for Broken shift with Role "' + roleNameExact + '"');
            return null;
        }

        // ============================================================
        // SCENARIO 2: SLEEPOVER SHIFT - Match by Sleepover Type
        // Handles "sleepover" OR raw "allowance"/"fixed rate" sub-types
        // ============================================================
        Boolean isSleepover = categoryLower.equals('sleepover') ||
                            categoryLower.contains('sleepover') ||
                            isBrokenSubTypeRaw;

        if (isSleepover) {
            // If raw sub-type was passed, prefix with "sleepover|"
            String searchKey = isBrokenSubTypeRaw
                ? 'sleepover|' + categoryLower
                : categoryLower;

            System.debug('   🛌 Sleepover shift detected. Looking for: "' + searchKey + '"');

            if (String.isBlank(roleNameExact) || !facilityRoleRateMap.containsKey(facilityId)) {
                System.debug('   ❌ Role is blank OR facility not found in role map');
                return null;
            }

            Map<String, Map<String, String>> roleMap = facilityRoleRateMap.get(facilityId);

            if (!roleMap.containsKey(roleNameExact)) {
                System.debug('   ❌ Role "' + roleNameExact + '" NOT FOUND in facility role map');
                return null;
            }

            Map<String, String> rateMap = roleMap.get(roleNameExact);

            // Try namespaced key
            if (rateMap.containsKey(searchKey)) {
                String rateId = rateMap.get(searchKey);
                System.debug('   ✅ EXACT MATCH found for "' + searchKey
                    + '" with Role "' + roleNameExact + '": ' + rateId);
                return rateId;
            }

            // Fallback: plain "sleepover"
            if (rateMap.containsKey('sleepover')) {
                String rateId = rateMap.get('sleepover');
                System.debug('   ✅ Found plain "sleepover" match: ' + rateId);
                return rateId;
            }

            System.debug('   ❌ No match found for "' + searchKey
                + '" with Role "' + roleNameExact + '"');
            return null;
        }

        // ============================================================
        // SCENARIO 3: WEEKDAY - Match by Category (PRIORITY)
        // ============================================================
        Boolean isWeekday = dayNameLower.equals('monday') ||
                            dayNameLower.equals('tuesday') ||
                            dayNameLower.equals('wednesday') ||
                            dayNameLower.equals('thursday') ||
                            dayNameLower.equals('friday');

        if (isWeekday) {
            Set<String> allowedWeekdayCategories = new Set<String>{
                'general', 'morning', 'afternoon', 'night'
            };

            String searchCategory = categoryLower;

            if (dayNameLower.equals(categoryLower)) {
                searchCategory = 'general';
            }

            if (searchCategory.contains('_')) {
                String[] parts = searchCategory.split('_');
                if (parts.size() >= 2) {
                    searchCategory = parts[0];
                }
            }

            if (!allowedWeekdayCategories.contains(searchCategory) &&
                !searchCategory.equals('weekday')) {
                System.debug('   ❌ Category "' + category + '" is not allowed for weekdays');
                return null;
            }

            if (String.isBlank(roleNameExact) || !facilityRoleRateMap.containsKey(facilityId)) {
                System.debug('   ❌ Role is blank OR facility not found in role map');
                return null;
            }

            Map<String, Map<String, String>> roleMap = facilityRoleRateMap.get(facilityId);

            if (!roleMap.containsKey(roleNameExact)) {
                System.debug('   ❌ Role "' + roleNameExact + '" NOT FOUND in facility role map');
                return null;
            }

            Map<String, String> rateMap = roleMap.get(roleNameExact);

            if (rateMap.containsKey(searchCategory)) {
                String rateId = rateMap.get(searchCategory);
                System.debug('   ✅ Found Category match for "' + searchCategory
                    + '" with Role "' + roleNameExact + '": ' + rateId);
                return rateId;
            }

            System.debug('   ❌ No Category match found for "' + searchCategory
                + '" with Role "' + roleNameExact + '"');
            return null;
        }

        // ============================================================
        // SCENARIO 4: WEEKEND - STRICT MATCH (NO FALLBACKS)
        // ============================================================
        Boolean isWeekend = dayNameLower.equals('saturday') ||
                            dayNameLower.equals('sunday');

        if (isWeekend) {
            System.debug('   🗓️ Weekend shift detected.');

            String searchKey = categoryLower;
            String shiftCategoryOnly = null;

            if (categoryLower.contains('_')) {
                String[] parts = categoryLower.split('_');
                if (parts.size() >= 2) {
                    shiftCategoryOnly = parts[1];
                    System.debug('   Extracted Shift Category: "' + shiftCategoryOnly + '"');
                }
            }

            System.debug('   Looking for EXACT Combined Key: "' + searchKey
                + '" (Category + Shift Category)');

            if (String.isBlank(roleNameExact) || !facilityRoleRateMap.containsKey(facilityId)) {
                System.debug('   ❌ Role is blank OR facility not found in role map');
                return null;
            }

            Map<String, Map<String, String>> roleMap = facilityRoleRateMap.get(facilityId);

            if (!roleMap.containsKey(roleNameExact)) {
                System.debug('   ❌ Role "' + roleNameExact + '" NOT FOUND in facility role map');
                return null;
            }

            Map<String, String> rateMap = roleMap.get(roleNameExact);

            if (rateMap.containsKey(searchKey)) {
                String rateId = rateMap.get(searchKey);
                System.debug('   ✅ EXACT MATCH found for "' + searchKey
                    + '" with Role "' + roleNameExact + '": ' + rateId);
                return rateId;
            }

            System.debug('   ❌ NO EXACT MATCH found for "' + dayName
                + '" with Role "' + roleNameExact + '"');
            return null;
        }

        // ============================================================
        // SCENARIO 5: PUBLIC HOLIDAY
        // ============================================================
        Boolean isPublicHoliday = categoryLower.equals('public holiday') ||
                                categoryLower.contains('public') ||
                                categoryLower.contains('holiday');

        if (isPublicHoliday) {
            if (String.isBlank(roleNameExact) || !facilityRoleRateMap.containsKey(facilityId)) {
                System.debug('   ❌ Role is blank OR facility not found in role map');
                return null;
            }

            Map<String, Map<String, String>> roleMap = facilityRoleRateMap.get(facilityId);

            if (!roleMap.containsKey(roleNameExact)) {
                System.debug('   ❌ Role "' + roleNameExact + '" NOT FOUND in facility role map');
                return null;
            }

            Map<String, String> rateMap = roleMap.get(roleNameExact);

            String searchKey = 'public holiday';
            if (rateMap.containsKey(searchKey)) {
                String rateId = rateMap.get(searchKey);
                System.debug('   ✅ EXACT MATCH found for Public Holiday: ' + rateId);
                return rateId;
            }

            if (rateMap.containsKey('holiday')) {
                String rateId = rateMap.get('holiday');
                System.debug('   ✅ Found "holiday" match: ' + rateId);
                return rateId;
            }

            System.debug('   ❌ No match found for Public Holiday');
            return null;
        }

        // ============================================================
        // SCENARIO 6: REGULAR SHIFTS - STRICT MATCH BY CATEGORY ONLY
        // ============================================================
        System.debug('   📋 Regular shift detected. Looking for Category match only.');

        if (String.isBlank(roleNameExact) || !facilityRoleRateMap.containsKey(facilityId)) {
            System.debug('   ❌ Role is blank OR facility not found in role map');
            return null;
        }

        Map<String, Map<String, String>> roleMap = facilityRoleRateMap.get(facilityId);

        if (!roleMap.containsKey(roleNameExact)) {
            System.debug('   ❌ Role "' + roleNameExact + '" NOT FOUND in facility role map');
            return null;
        }

        Map<String, String> rateMap = roleMap.get(roleNameExact);

        String searchKey = categoryLower;

        if (rateMap.containsKey(searchKey)) {
            String rateId = rateMap.get(searchKey);
            System.debug('   ✅ Found Category match for "' + category + '": ' + rateId);
            return rateId;
        }

        if (categoryLower.equals('general')) {
            for (String key : rateMap.keySet()) {
                if (key.toLowerCase().equals('general')) {
                    String rateId = rateMap.get(key);
                    System.debug('   ✅ Found General match: ' + rateId);
                    return rateId;
                }
            }
        }

        if (categoryLower.contains('weekend') ||
            categoryLower.contains('saturday') ||
            categoryLower.contains('sunday')) {

            String dayKey = dayNameLower;
            if (rateMap.containsKey(dayKey)) {
                String rateId = rateMap.get(dayKey);
                System.debug('   ✅ Found Day match for "' + dayName + '": ' + rateId);
                return rateId;
            }

            if (rateMap.containsKey('weekend')) {
                String rateId = rateMap.get('weekend');
                System.debug('   ✅ Found Weekend match: ' + rateId);
                return rateId;
            }
        }

        System.debug('   ❌ No match found for Category "' + category
            + '" with Role "' + roleNameExact + '"');
        return null;
    }

    // ============================================================
    // HELPER: Find rate by Category ONLY (not Shift Type)
    // ============================================================
    public static String findRateByCategoryOnly(
        Map<String, String> rateMap,
        String searchKey,
        String facilityId,
        String roleName
    ) {
        Set<String> validCategoryKeys = new Set<String>{
            'general', 'morning', 'afternoon', 'night', 
            'saturday', 'sunday', 'weekend', 'public holiday'
        };
        
        if (validCategoryKeys.contains(searchKey) && rateMap.containsKey(searchKey)) {
            return rateMap.get(searchKey);
        }
        
        return null;
    }

    // ============================================================
    // BUILD FACILITY-ROLE-SPECIFIC EARNING RATE MAP (CASE-SENSITIVE)
    // ============================================================
    public static Map<String, Map<String, Map<String, String>>> buildFacilityRoleRateMap(Id organisationId) {
        System.debug('🔨 ===== START buildFacilityRoleRateMap =====');
        System.debug('   Organisation ID: ' + organisationId);

        // Structure: facilityId → roleName → rateMap
        Map<String, Map<String, Map<String, String>>> facilityRoleRateMap =
            new Map<String, Map<String, Map<String, String>>>();

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
                OverTime_Type__c,
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

        System.debug('📋 Found ' + settings.size() + ' Facility Xero Settings');

        // ✅ Regular shift types that are allowed to write the plain category key
        Set<String> regularShiftTypes = new Set<String>{
            'general', 'morning', 'night', 'afternoon'
        };

        // ✅ Allowed Category__c values for writing the plain "General" key
        Set<String> allowedGeneralCategories = new Set<String>{
            'general', 'saturday', 'sunday', 'public holiday'
        };

        // ✅ Plain weekday shift types allowed to write a bare shift-type key
        Set<String> plainWeekdayShiftTypes = new Set<String>{
            'general', 'morning', 'afternoon', 'night'
        };

        for (Facility_Xero_Setting__c setting : settings) {
            String facilityId  = setting.Facility_Role__r.Facility__c;
            String roleName    = setting.Facility_Role__r.Role_Name__c;
            String xeroPayitem = setting.Xero_Payitem__c;

            if (String.isBlank(facilityId) || String.isBlank(roleName) || String.isBlank(xeroPayitem)) {
                System.debug('   ⏭️ Skipping setting ' + setting.Id + ' (missing facility/role/payitem)');
                continue;
            }

            if (!facilityRoleRateMap.containsKey(facilityId)) {
                facilityRoleRateMap.put(facilityId, new Map<String, Map<String, String>>());
            }
            Map<String, Map<String, String>> roleMap = facilityRoleRateMap.get(facilityId);

            if (!roleMap.containsKey(roleName)) {
                roleMap.put(roleName, new Map<String, String>());
            }
            Map<String, String> rateMap = roleMap.get(roleName);

            // ============================================================
            // Determine whether this setting is a REGULAR setting.
            // ============================================================
            Boolean isRegularSetting =
                !String.isBlank(setting.Shift_Type__c)
                && regularShiftTypes.contains(setting.Shift_Type__c.trim().toLowerCase())
                && String.isBlank(setting.Custom_Shift_Type__c)
                && String.isBlank(setting.Custom_Rate_Type__c)
                && String.isBlank(setting.Broken_Type__c)
                && String.isBlank(setting.Sleepover_Type__c)
                && String.isBlank(setting.OverTime_Type__c);

            // ============================================================
            // ✅ REGULAR CATEGORY KEY
            // ============================================================
            if (!String.isBlank(setting.Category__c) && isRegularSetting) {
                String categoryKey = setting.Category__c.trim().toLowerCase();

                if (allowedGeneralCategories.contains(categoryKey)) {
                    rateMap.put(categoryKey, xeroPayitem);
                    System.debug('   ✅ [CATEGORY] Facility: ' + facilityId
                        + ' | Role: "' + roleName + '"'
                        + ' | Category: "' + setting.Category__c + '"'
                        + ' → ' + xeroPayitem);

                    // Weekend combined key
                    if (!String.isBlank(setting.Shift_Type__c)
                        && (categoryKey.equals('saturday') || categoryKey.equals('sunday'))) {
                        String shiftTypeKey = setting.Shift_Type__c.trim().toLowerCase();
                        String combinedKey = categoryKey + '_' + shiftTypeKey;
                        rateMap.put(combinedKey, xeroPayitem);
                        System.debug('   ✅ [CATEGORY+SHIFT] Combined Key: "' + combinedKey + '" → ' + xeroPayitem);
                    }
                } else {
                    System.debug('   ⏭️ Skipping Category__c = "' + setting.Category__c
                        + '" (not in allowed General categories)');
                }
            }

            // ============================================================
            // ✅ SHIFT TYPE KEY (bare) — including "afternoon"
            // ============================================================
            if (!String.isBlank(setting.Shift_Type__c) && isRegularSetting) {
                String shiftTypeKey = setting.Shift_Type__c.trim().toLowerCase();
                String categoryKeyForShiftType =
                    String.isNotBlank(setting.Category__c)
                        ? setting.Category__c.trim().toLowerCase()
                        : null;

                Boolean categoryAllowsShiftTypeKey =
                    categoryKeyForShiftType == null
                    || categoryKeyForShiftType == shiftTypeKey;

                if (plainWeekdayShiftTypes.contains(shiftTypeKey)
                    && categoryAllowsShiftTypeKey
                    && !rateMap.containsKey(shiftTypeKey)) {

                    rateMap.put(shiftTypeKey, xeroPayitem);
                    System.debug('   ✅ [SHIFT_TYPE] Facility: ' + facilityId
                        + ' | Role: "' + roleName + '"'
                        + ' | Shift Type: "' + setting.Shift_Type__c + '"'
                        + ' → ' + xeroPayitem);
                } else {
                    System.debug('   ⏭️ Skipping bare Shift Type key "' + shiftTypeKey
                        + '" (Category=' + categoryKeyForShiftType
                        + ', alreadyPresent=' + rateMap.containsKey(shiftTypeKey) + ')');
                }
            }

            // ============================================================
            // ✅ CUSTOM SHIFT TYPE (namespaced)
            // ============================================================
            if (!String.isBlank(setting.Custom_Shift_Type__c)) {
                String customShiftKey = 'customshift|' + setting.Custom_Shift_Type__c.trim().toLowerCase();
                rateMap.put(customShiftKey, xeroPayitem);
                System.debug('   ✅ [CUSTOM SHIFT] Facility: ' + facilityId
                    + ' | Role: "' + roleName + '"'
                    + ' | Custom Shift Type: "' + setting.Custom_Shift_Type__c + '"'
                    + ' → key: "' + customShiftKey + '" → ' + xeroPayitem);
            }

            // ============================================================
            // ✅ BROKEN TYPE (namespaced)
            // ============================================================
            if (!String.isBlank(setting.Broken_Type__c)) {
                String brokenSubType = setting.Broken_Type__c.trim().toLowerCase();
                String brokenKey = 'broken|' + brokenSubType;
                rateMap.put(brokenKey, xeroPayitem);
                System.debug('   ✅ [BROKEN] Facility: ' + facilityId
                    + ' | Role: "' + roleName + '"'
                    + ' | Broken Type: "' + setting.Broken_Type__c + '"'
                    + ' → key: "' + brokenKey + '" → ' + xeroPayitem);

                if (!rateMap.containsKey('broken')) {
                    rateMap.put('broken', xeroPayitem);
                    System.debug('   ✅ [BROKEN] Stored plain "broken" fallback → ' + xeroPayitem);
                }
            }

            // ============================================================
            // ✅ SLEEPOVER TYPE (namespaced)
            // ============================================================
            if (!String.isBlank(setting.Sleepover_Type__c)) {
                String sleepoverKey = 'sleepover|' + setting.Sleepover_Type__c.trim().toLowerCase();
                rateMap.put(sleepoverKey, xeroPayitem);
                System.debug('   ✅ [SLEEPOVER] Facility: ' + facilityId
                    + ' | Role: "' + roleName + '"'
                    + ' | Sleepover Type: "' + setting.Sleepover_Type__c + '"'
                    + ' → key: "' + sleepoverKey + '" → ' + xeroPayitem);
            }

            // ============================================================
            // ✅ CUSTOM RATE TYPE (namespaced)
            // ============================================================
            if (!String.isBlank(setting.Custom_Rate_Type__c)) {
                String customRateKey = 'customrate|' + setting.Custom_Rate_Type__c.trim().toLowerCase();
                rateMap.put(customRateKey, xeroPayitem);
                System.debug('   ✅ [CUSTOM RATE] Facility: ' + facilityId
                    + ' | Role: "' + roleName + '"'
                    + ' | Custom Rate Type: "' + setting.Custom_Rate_Type__c + '"'
                    + ' → key: "' + customRateKey + '" → ' + xeroPayitem);
            }

            // ============================================================
            // ✅ OVERTIME TYPE (namespaced ONLY)
            //
            // ⚠️ FIX: we NO LONGER write the bare otTypeKey
            //    ("overtime rate 1", "overtime rate 2"). That bare write
            //    collided with category keys when OverTime_Type__c was
            //    set to a category name (e.g. "Afternoon"), silently
            //    shadowing the real regular-afternoon pay item.
            //
            //    Only the scoped key "<otType>|<category>" is written.
            //    If Category__c is blank, we write "__ot__|<otType>".
            // ============================================================
            if (!String.isBlank(setting.OverTime_Type__c)) {
                String otTypeKey = setting.OverTime_Type__c.trim().toLowerCase();

                if (!String.isBlank(setting.Category__c)) {
                    String categoryLower = setting.Category__c.trim().toLowerCase();
                    String scopedKey = otTypeKey + '|' + categoryLower;
                    rateMap.put(scopedKey, xeroPayitem);
                    System.debug('   ✅ [OVERTIME SCOPED] Facility: ' + facilityId
                        + ' | Role: "' + roleName + '"'
                        + ' | OverTime Type: "' + setting.OverTime_Type__c + '"'
                        + ' | Category: "' + setting.Category__c + '"'
                        + ' → key: "' + scopedKey + '" → ' + xeroPayitem);
                } else {
                    String scopedKey = '__ot__|' + otTypeKey;
                    rateMap.put(scopedKey, xeroPayitem);
                    System.debug('   ✅ [OVERTIME NO-CATEGORY] Facility: ' + facilityId
                        + ' | Role: "' + roleName + '"'
                        + ' | OverTime Type: "' + setting.OverTime_Type__c + '"'
                        + ' → key: "' + scopedKey + '" → ' + xeroPayitem);
                }
            }
        }

        // ============================================================
        // ✅ DIAGNOSTIC — detect bare-key shadowing
        // ============================================================
        Set<String> reservedCategories = new Set<String>{
            'general','morning','afternoon','night',
            'saturday','sunday','weekend','public holiday'
        };

        for (String facId : facilityRoleRateMap.keySet()) {
            Map<String, Map<String, String>> roleMapDiag = facilityRoleRateMap.get(facId);
            for (String role : roleMapDiag.keySet()) {
                Map<String, String> rm = roleMapDiag.get(role);
                for (String cat : reservedCategories) {
                    if (rm.containsKey(cat)) {
                        String id = rm.get(cat);
                        for (String k : rm.keySet()) {
                            if (k.contains('|') && k.endsWith('|' + cat) && rm.get(k) == id) {
                                System.debug('⚠️ COLLISION: bare key "' + cat
                                    + '" in ' + facId + '/' + role
                                    + ' resolves to the same rate as "' + k + '" (' + id + ')');
                            }
                        }
                    }
                }
            }
        }

        System.debug('📋 Facility Role Rate Map (final): ' + JSON.serializePretty(facilityRoleRateMap));
        System.debug('🔨 ===== END buildFacilityRoleRateMap =====');
        return facilityRoleRateMap;
    }

    // ============================================================
    // FIND CUSTOM RATE FOR SHIFT
    // ⚠️ UNCHANGED — still used by Custom / Sleepover / Broken shifts
    // ============================================================
    public static String findCustomRateForShift(
        String customType,
        String roleName,
        Map<String, Map<String, Map<String, String>>> facilityRoleRateMap
    ) {
        if (String.isBlank(customType) || String.isBlank(roleName) || facilityRoleRateMap == null) {
            System.debug('❌ findCustomRateForShift: Missing required parameters');
            return null;
        }

        String customTypeLower = customType.toLowerCase().trim();
        String roleNameExact = roleName.trim();

        System.debug('🔍 findCustomRateForShift (CUSTOM SHIFT):');
        System.debug('   Custom Type: ' + customType);
        System.debug('   Role Name (Case-Sensitive): "' + roleNameExact + '"');

        // ✅ ONLY the exact namespaced "customrate|<type>" key — no fallbacks
        String namespacedRateKey = 'customrate|' + customTypeLower;

        for (String facilityId : facilityRoleRateMap.keySet()) {
            Map<String, Map<String, String>> roleMap = facilityRoleRateMap.get(facilityId);
            if (!roleMap.containsKey(roleNameExact)) {
                continue;
            }

            Map<String, String> rateMap = roleMap.get(roleNameExact);

            if (rateMap.containsKey(namespacedRateKey)) {
                String rateId = rateMap.get(namespacedRateKey);
                System.debug('   ✅ Found via namespaced key "' + namespacedRateKey +
                            '" with Role "' + roleNameExact + '": ' + rateId);
                return rateId;
            }
        }

        System.debug('   ❌ No custom rate found for "' + customType +
                    '" with Role "' + roleNameExact + '"');
        return null;
    }


    // ============================================================
    // FIND CUSTOM RATE FOR SHIFT
    // ⚠️ UNCHANGED — still used by Over Time
    // ============================================================
    public static String findCustomRateForShift(
        String customType,
        String category,
        String roleName,
        Map<String, Map<String, Map<String, String>>> facilityRoleRateMap
    ) {
        if (String.isBlank(customType) || String.isBlank(category) ||
            String.isBlank(roleName) || facilityRoleRateMap == null) {
            System.debug('❌ findCustomRateForShift(category-aware): Missing required parameters');
            return null;
        }

        String customTypeLower = customType.toLowerCase().trim();
        String categoryLower   = category.toLowerCase().trim();
        String roleNameExact   = roleName.trim();
        String combinedKey     = customTypeLower + '|' + categoryLower;

        System.debug('🔍 findCustomRateForShift (CATEGORY-AWARE, STRICT):');
        System.debug('   Custom Type : ' + customType);
        System.debug('   Category    : ' + category);
        System.debug('   Role Name   : "' + roleNameExact + '"');
        System.debug('   Looking for : "' + combinedKey + '"');

        for (String facilityId : facilityRoleRateMap.keySet()) {
            Map<String, Map<String, String>> roleMap = facilityRoleRateMap.get(facilityId);

            if (!roleMap.containsKey(roleNameExact)) {
                continue;
            }

            Map<String, String> rateMap = roleMap.get(roleNameExact);

            // ✅ ONLY step — the exact combined key must exist
            if (rateMap.containsKey(combinedKey)) {
                String rateId = rateMap.get(combinedKey);
                System.debug('   ✅ Exact (Type+Category) match: "' + combinedKey +
                            '" with Role "' + roleNameExact + '": ' + rateId);
                return rateId;
            }
        }

        System.debug('   ❌ No category-scoped rate found for key "' + combinedKey +
                    '" with Role "' + roleNameExact + '" (no fallbacks)');
        return null;
    }

    public static void processSingleStaffForBulk(
        Staff__c staff,
        ProcessingContext ctx
    ) {
        System.debug('🚀 ===== START processSingleStaffForBulk =====');

        if (staff == null || String.isBlank(staff.Xero_Employee_ID__c)) {
            String errorMsg = 'Staff ' + (staff != null ? staff.Display_Nickname__c : 'Unknown') + 
                ' has no Xero Employee ID. Please sync this staff with Xero first.';
            System.debug('❌ ' + errorMsg);
            throw new AuraHandledException(errorMsg);
        }

        String xeroEmployeeId = staff.Xero_Employee_ID__c;
        String ordinaryEarningsRateId = staff.Ordinary_Earnings_Rate_ID__c;

        // ============================================================
        // FETCH ORDINARY EARNINGS RATE FROM XERO
        // ============================================================
        System.debug('🔍 Fetching Ordinary Earnings Rate from Xero for: ' + staff.Display_Nickname__c);
        ordinaryEarningsRateId = fetchOrdinaryEarningsRateFromXero(xeroEmployeeId, ctx);
        
        if (String.isNotBlank(ordinaryEarningsRateId)) {
            System.debug('✅ Fetched Ordinary Earnings Rate: ' + ordinaryEarningsRateId);
            staff.Ordinary_Earnings_Rate_ID__c = ordinaryEarningsRateId;
        } else {
            System.debug('⚠️ Could not fetch Ordinary Earnings Rate from Xero');
        }

        // ============================================================
        // BUILD FACILITY-SPECIFIC RATE MAP
        // ============================================================
        Map<Id, Map<String, Object>> organisationSettings = getOrganisationEarningRateSettings();
        Map<String, Map<String, String>> facilityRateMap = new Map<String, Map<String, String>>();
        
        Map<String, Map<String, Map<String, String>>> facilityRoleRateMap = buildFacilityRoleRateMap(ctx.orgRecord.Id);
        
        for (Id settingId : organisationSettings.keySet()) {
            Map<String, Object> settingData = organisationSettings.get(settingId);
            
            String facilityId = (String) settingData.get('Facility_Id');
            String category = (String) settingData.get('Category__c');
            String xeroPayitem = (String) settingData.get('Xero_Payitem__c');
            String shiftType = (String) settingData.get('Shift_Type__c');
            String customShiftType = (String) settingData.get('Custom_Shift_Type__c');
            String brokenType = (String) settingData.get('Broken_Type__c');
            String sleepoverType = (String) settingData.get('Sleepover_Type__c');
            String customRateType = (String) settingData.get('Custom_Rate_Type__c');
            String roleName = (String) settingData.get('Facility_Role__r.Role_Name__c');
            String overTimeType = (String) settingData.get('OverTime_Type__c');
            
            if (String.isBlank(facilityId) || String.isBlank(xeroPayitem)) {
                continue;
            }
            
            if (!facilityRateMap.containsKey(facilityId)) {
                facilityRateMap.put(facilityId, new Map<String, String>());
            }
            
            Map<String, String> rateMap = facilityRateMap.get(facilityId);
            
            if (String.isNotBlank(category)) {
                String key = category.trim().toLowerCase();
                rateMap.put(key, xeroPayitem);
                System.debug('   ✅ Facility ' + facilityId + ' Category "' + category + '" → ' + xeroPayitem);
                
                if (String.isNotBlank(shiftType)) {
                    String shiftTypeKey = shiftType.trim().toLowerCase();
                    if (key.equals('saturday') || key.equals('sunday')) {
                        String combinedKey = key + '_' + shiftTypeKey;
                        rateMap.put(combinedKey, xeroPayitem);
                        System.debug('   ✅ Combined Key: "' + combinedKey + '" → ' + xeroPayitem);
                    }
                }
            }
            
            if (String.isNotBlank(shiftType)) {
                String key = shiftType.trim().toLowerCase();
                if (!rateMap.containsKey(key)) {
                    rateMap.put(key, xeroPayitem);
                    System.debug('   ✅ Facility ' + facilityId + ' Shift Type "' + shiftType + '" → ' + xeroPayitem);
                }
            }
            
            if (String.isNotBlank(customShiftType)) {
                String key = customShiftType.trim().toLowerCase();
                rateMap.put(key, xeroPayitem);
                System.debug('   ✅ Facility ' + facilityId + ' Custom Shift Type "' + customShiftType + '" → ' + xeroPayitem);
            }
            
            if (String.isNotBlank(brokenType)) {
                String key = brokenType.trim().toLowerCase();
                rateMap.put(key, xeroPayitem);
                System.debug('   ✅ Facility ' + facilityId + ' Broken Type "' + brokenType + '" → ' + xeroPayitem);
            }
            
            if (String.isNotBlank(sleepoverType)) {
                String key = sleepoverType.trim().toLowerCase();
                rateMap.put(key, xeroPayitem);
                System.debug('   ✅ Facility ' + facilityId + ' Sleepover Type "' + sleepoverType + '" → ' + xeroPayitem);
            }
            
            if (String.isNotBlank(customRateType)) {
                String key = customRateType.trim().toLowerCase();
                rateMap.put(key, xeroPayitem);
                System.debug('   ✅ Facility ' + facilityId + ' Custom Rate Type "' + customRateType + '" → ' + xeroPayitem);
            }
            
            if (String.isNotBlank(overTimeType)) {
                String key = overTimeType.trim().toLowerCase();
                rateMap.put(key, xeroPayitem);
                System.debug('   ✅ Facility ' + facilityId + ' OverTime Type "' + overTimeType + '" → ' + xeroPayitem);
            }
        }
        
        System.debug('📋 Facility Rate Map: ' + JSON.serializePretty(facilityRateMap));
        System.debug('📋 Facility Role Rate Map: ' + JSON.serializePretty(facilityRoleRateMap));

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
                Role_formula__c,
                
                Actual_Duration__c,
                Staff_Hourly_Rate__c,
                Staff_Final_Hourly_Rate__c,
                Custom_Rate_Per_Hrs__c,
                
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
                Long_Sleepover_Duartion__c,
                
                Sleepover_Night_shift_hours__c,
                Sleepover_Night_Shift_Hourly_Rate__c,
                
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
                Over_Time_Tier_Two_Rate__c
                
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

        String shiftFacilityId = null;
        if (!shifts.isEmpty()) {
            shiftFacilityId = shifts[0].Shift_Facility__c;
            System.debug('🏢 Shift Facility ID: ' + shiftFacilityId);
        }

        // ============================================================
        // CATEGORY RATE CALCULATIONS - GROUP BY ROLE + CATEGORY
        // ============================================================
        Map<String, Decimal> combinedKeyTotalHours = new Map<String, Decimal>();
        Map<String, Integer> combinedKeyShiftCount = new Map<String, Integer>();
        Map<String, Decimal> combinedKeyRates = new Map<String, Decimal>();
        Map<String, String> combinedKeyDayNameMap = new Map<String, String>();
        Map<String, String> combinedKeyFacilityMap = new Map<String, String>();
        Map<String, Boolean> combinedKeyIsPublicHoliday = new Map<String, Boolean>();
        Map<String, String> combinedKeyRoleMap = new Map<String, String>();
        Map<String, Boolean> combinedKeyIsSleepover = new Map<String, Boolean>();
        Map<String, String> combinedKeySleepoverType = new Map<String, String>();
        Map<String, Boolean> combinedKeyIsCustom = new Map<String, Boolean>();
        Map<String, String> combinedKeyCustomType = new Map<String, String>();

        Map<String, Decimal> categoryTotalHours = new Map<String, Decimal>();
        Map<String, Integer> categoryShiftCount = new Map<String, Integer>();
        Map<String, Decimal> categoryRates = new Map<String, Decimal>();
        Map<String, String> categoryDayNameMap = new Map<String, String>();
        Map<String, String> categoryFacilityMap = new Map<String, String>();
        Map<String, Boolean> categoryIsPublicHoliday = new Map<String, Boolean>();
        Map<String, String> categoryRoleMap = new Map<String, String>();

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
            System.debug('   Role: "' + shift.Role_formula__c + '"');
            System.debug('   Staff_Final_Hourly_Rate__c: ' + shift.Staff_Final_Hourly_Rate__c);
            System.debug('   Actual_Duration__c: ' + shift.Actual_Duration__c);
            System.debug('   Broken_Shift_Allowance__c: ' + shift.Broken_Shift_Allowance__c);
            System.debug('   Broken_Shift__c: ' + shift.Broken_Shift__c);
            System.debug('   Over_Time_Tier_One__c: ' + shift.Over_Time_Tier_One__c);
            System.debug('   Over_Time_Tier_One_Rate__c: ' + shift.Over_Time_Tier_One_Rate__c);
            System.debug('   Over_Time_Tier_Two__c: ' + shift.Over_Time_Tier_Two__c);
            System.debug('   Over_Time_Tier_Two_Rate__c: ' + shift.Over_Time_Tier_Two_Rate__c);
            System.debug('========================================');

            String categoryKey;
            String roleKey = shift.Role_formula__c;
            Boolean isCustomShift = false;
            String customTypeValue = null;
            String customKeySuffix = null;
            
            // ============================================================
            // ✅ CHECK FOR OVERTIME SHIFT (Tier 1 and Tier 2)
            // ============================================================
            Boolean isOverTimeShiftTier1 = false;
            Boolean isOverTimeShiftTier2 = false;
            Decimal overTimeDurationTier1 = 0;
            Decimal overTimeRateTier1 = 0;
            Decimal overTimeDurationTier2 = 0;
            Decimal overTimeRateTier2 = 0;

            if (shift.Over_Time_Tier_One__c != null && shift.Over_Time_Tier_One__c > 0 &&
                shift.Over_Time_Tier_One_Rate__c != null && shift.Over_Time_Tier_One_Rate__c > 0) {
                isOverTimeShiftTier1 = true;
                overTimeDurationTier1 = shift.Over_Time_Tier_One__c;
                overTimeRateTier1 = shift.Over_Time_Tier_One_Rate__c;
                System.debug('   ✅ OVERTIME TIER 1 DETECTED: Duration=' + overTimeDurationTier1 + ', Rate=' + overTimeRateTier1);
            }

            if (shift.Over_Time_Tier_Two__c != null && shift.Over_Time_Tier_Two__c > 0 &&
                shift.Over_Time_Tier_Two_Rate__c != null && shift.Over_Time_Tier_Two_Rate__c > 0) {
                isOverTimeShiftTier2 = true;
                overTimeDurationTier2 = shift.Over_Time_Tier_Two__c;
                overTimeRateTier2 = shift.Over_Time_Tier_Two_Rate__c;
                System.debug('   ✅ OVERTIME TIER 2 DETECTED: Duration=' + overTimeDurationTier2 + ', Rate=' + overTimeRateTier2);
            }

            // ============================================================
            // ✅ PROCESS OVERTIME TIER 1
            // ============================================================
            if (isOverTimeShiftTier1) {
                String baseCategory = shift.Shift_Category__c != null ? shift.Shift_Category__c.trim() : 'General';
                String categoryKeyOverTime = 'OverTime_' + baseCategory;
                String overTimeCombinedKey = (String.isNotBlank(roleKey) ? roleKey.trim() : 'NO_ROLE') + '|' + categoryKeyOverTime;

                System.debug('   🕐 OVERTIME TIER 1 SHIFT PROCESSED:');
                System.debug('      Day: ' + shift.Shift_Day_Name__c);
                System.debug('      Category: ' + baseCategory);
                System.debug('      Duration: ' + overTimeDurationTier1);
                System.debug('      Rate: ' + overTimeRateTier1);
                System.debug('      Combined Key: ' + overTimeCombinedKey);

                combinedKeyDayNameMap.put(overTimeCombinedKey, shift.Shift_Day_Name__c);
                combinedKeyFacilityMap.put(overTimeCombinedKey, shift.Shift_Facility__c);
                combinedKeyIsPublicHoliday.put(overTimeCombinedKey, shift.Public_holiday__c);
                combinedKeyRoleMap.put(overTimeCombinedKey, roleKey);
                combinedKeyIsCustom.put(overTimeCombinedKey, true);
                combinedKeyCustomType.put(overTimeCombinedKey, 'OverTime Rate 1');

                if (!combinedKeyTotalHours.containsKey(overTimeCombinedKey)) {
                    combinedKeyTotalHours.put(overTimeCombinedKey, 0);
                    combinedKeyShiftCount.put(overTimeCombinedKey, 0);
                    combinedKeyRates.put(overTimeCombinedKey, 0);
                }

                combinedKeyTotalHours.put(overTimeCombinedKey, combinedKeyTotalHours.get(overTimeCombinedKey) + overTimeDurationTier1);
                combinedKeyShiftCount.put(overTimeCombinedKey, combinedKeyShiftCount.get(overTimeCombinedKey) + 1);
                if (combinedKeyRates.get(overTimeCombinedKey) == 0 && overTimeRateTier1 != 0) {
                    combinedKeyRates.put(overTimeCombinedKey, overTimeRateTier1);
                }
            }

            // ============================================================
            // ✅ PROCESS OVERTIME TIER 2
            // ============================================================
            if (isOverTimeShiftTier1) {
                String baseCategory = shift.Shift_Category__c != null ? shift.Shift_Category__c.trim() : 'General';
                String categoryKeyOverTime = 'OverTime_' + baseCategory;
                String overTimeCombinedKey = (String.isNotBlank(roleKey) ? roleKey.trim() : 'NO_ROLE') + '|' + categoryKeyOverTime;

                System.debug('   🕐 OVERTIME TIER 1 SHIFT PROCESSED:');
                System.debug('      Day: ' + shift.Shift_Day_Name__c);
                System.debug('      Category: ' + baseCategory);
                System.debug('      Duration: ' + overTimeDurationTier1);
                System.debug('      Rate: ' + overTimeRateTier1);
                System.debug('      Combined Key: ' + overTimeCombinedKey);

                combinedKeyDayNameMap.put(overTimeCombinedKey, shift.Shift_Day_Name__c);
                combinedKeyFacilityMap.put(overTimeCombinedKey, shift.Shift_Facility__c);
                combinedKeyIsPublicHoliday.put(overTimeCombinedKey, shift.Public_holiday__c);
                combinedKeyRoleMap.put(overTimeCombinedKey, roleKey);
                combinedKeyIsCustom.put(overTimeCombinedKey, true);
                combinedKeyCustomType.put(overTimeCombinedKey, 'OverTime Rate 1');

                if (!combinedKeyTotalHours.containsKey(overTimeCombinedKey)) {
                    combinedKeyTotalHours.put(overTimeCombinedKey, 0);
                    combinedKeyShiftCount.put(overTimeCombinedKey, 0);
                    combinedKeyRates.put(overTimeCombinedKey, 0);
                }

                combinedKeyTotalHours.put(overTimeCombinedKey, combinedKeyTotalHours.get(overTimeCombinedKey) + overTimeDurationTier1);
                combinedKeyShiftCount.put(overTimeCombinedKey, combinedKeyShiftCount.get(overTimeCombinedKey) + 1);
                if (combinedKeyRates.get(overTimeCombinedKey) == 0 && overTimeRateTier1 != 0) {
                    combinedKeyRates.put(overTimeCombinedKey, overTimeRateTier1);
                }
            }

            // ============================================================
            // ✅ PROCESS BROKEN SHIFT
            // ============================================================
            if (shift.Broken_Shift__c) {
                String categoryKeyBroken = 'Broken';
                Decimal allowance = shift.Broken_Shift_Allowance__c != null ? shift.Broken_Shift_Allowance__c : 0;
                
                if (allowance > 0) {
                    String combinedKeyAllowance = (String.isNotBlank(roleKey) ? roleKey.trim() : 'NO_ROLE') + '|' + categoryKeyBroken + '|Allowance';
                    combinedKeyDayNameMap.put(combinedKeyAllowance, shift.Shift_Day_Name__c);
                    combinedKeyFacilityMap.put(combinedKeyAllowance, shift.Shift_Facility__c);
                    combinedKeyIsPublicHoliday.put(combinedKeyAllowance, shift.Public_holiday__c);
                    combinedKeyRoleMap.put(combinedKeyAllowance, roleKey);
                    
                    if (!combinedKeyTotalHours.containsKey(combinedKeyAllowance)) {
                        combinedKeyTotalHours.put(combinedKeyAllowance, 0);
                        combinedKeyShiftCount.put(combinedKeyAllowance, 0);
                        combinedKeyRates.put(combinedKeyAllowance, 0);
                    }
                    combinedKeyTotalHours.put(combinedKeyAllowance, combinedKeyTotalHours.get(combinedKeyAllowance) + 1);
                    combinedKeyShiftCount.put(combinedKeyAllowance, combinedKeyShiftCount.get(combinedKeyAllowance) + 1);
                    if (combinedKeyRates.get(combinedKeyAllowance) == 0 && allowance != 0) {
                        combinedKeyRates.put(combinedKeyAllowance, allowance);
                    }
                }
                
                Decimal regularRate = shift.Staff_Final_Hourly_Rate__c != null ? shift.Staff_Final_Hourly_Rate__c : 0;
                Decimal regularDuration = shift.Actual_Duration__c != null ? shift.Actual_Duration__c : 0;
                String combinedKeyRegular = (String.isNotBlank(roleKey) ? roleKey.trim() : 'NO_ROLE') + '|' + categoryKeyBroken + '|Regular';
                
                combinedKeyDayNameMap.put(combinedKeyRegular, shift.Shift_Day_Name__c);
                combinedKeyFacilityMap.put(combinedKeyRegular, shift.Shift_Facility__c);
                combinedKeyIsPublicHoliday.put(combinedKeyRegular, shift.Public_holiday__c);
                combinedKeyRoleMap.put(combinedKeyRegular, roleKey);
                
                if (!combinedKeyTotalHours.containsKey(combinedKeyRegular)) {
                    combinedKeyTotalHours.put(combinedKeyRegular, 0);
                    combinedKeyShiftCount.put(combinedKeyRegular, 0);
                    combinedKeyRates.put(combinedKeyRegular, 0);
                }
                combinedKeyTotalHours.put(combinedKeyRegular, combinedKeyTotalHours.get(combinedKeyRegular) + regularDuration);
                combinedKeyShiftCount.put(combinedKeyRegular, combinedKeyShiftCount.get(combinedKeyRegular) + 1);
                if (combinedKeyRates.get(combinedKeyRegular) == 0 && regularRate != 0) {
                    combinedKeyRates.put(combinedKeyRegular, regularRate);
                }
                
                continue;
            }

            // ✅ SLEEPOVER SHIFT
            if (shift.Type_of_shift__c != null && 
                shift.Type_of_shift__c.equalsIgnoreCase('Sleepover Shift')) {
                
                categoryKey = 'Sleepover';
                String combinedKeyBase = (String.isNotBlank(roleKey) ? roleKey.trim() : 'NO_ROLE') + '|' + categoryKey;
                
                Boolean hasRate = shift.Sleepover_Night_Shift_Hourly_Rate__c != null && shift.Sleepover_Night_Shift_Hourly_Rate__c != 0;
                Boolean hasHours = shift.Sleepover_Night_shift_hours__c != null && shift.Sleepover_Night_shift_hours__c != 0;
                
                if (hasRate && hasHours) {
                    String combinedKey = combinedKeyBase + '|FixedRate';
                    combinedKeyIsSleepover.put(combinedKey, true);
                    combinedKeySleepoverType.put(combinedKey, 'Fixed Rate');
                    
                    combinedKeyDayNameMap.put(combinedKey, shift.Shift_Day_Name__c);
                    combinedKeyFacilityMap.put(combinedKey, shift.Shift_Facility__c);
                    combinedKeyIsPublicHoliday.put(combinedKey, shift.Public_holiday__c);
                    combinedKeyRoleMap.put(combinedKey, roleKey);
                    
                    Decimal effectiveRate = shift.Sleepover_Night_Shift_Hourly_Rate__c;
                    Decimal duration = shift.Sleepover_Night_shift_hours__c;
                    
                    if (!combinedKeyTotalHours.containsKey(combinedKey)) {
                        combinedKeyTotalHours.put(combinedKey, 0);
                        combinedKeyShiftCount.put(combinedKey, 0);
                        combinedKeyRates.put(combinedKey, 0);
                    }
                    combinedKeyTotalHours.put(combinedKey, combinedKeyTotalHours.get(combinedKey) + duration);
                    combinedKeyShiftCount.put(combinedKey, combinedKeyShiftCount.get(combinedKey) + 1);
                    if (combinedKeyRates.get(combinedKey) == 0 && effectiveRate != 0) {
                        combinedKeyRates.put(combinedKey, effectiveRate);
                    }
                }
                
                String combinedKeyAllowance = combinedKeyBase + '|Allowance';
                combinedKeyIsSleepover.put(combinedKeyAllowance, true);
                combinedKeySleepoverType.put(combinedKeyAllowance, 'Allowance');
                
                combinedKeyDayNameMap.put(combinedKeyAllowance, shift.Shift_Day_Name__c);
                combinedKeyFacilityMap.put(combinedKeyAllowance, shift.Shift_Facility__c);
                combinedKeyIsPublicHoliday.put(combinedKeyAllowance, shift.Public_holiday__c);
                combinedKeyRoleMap.put(combinedKeyAllowance, roleKey);
                
                Decimal effectiveRateAllowance = shift.Staff_Final_Hourly_Rate__c != null ? shift.Staff_Final_Hourly_Rate__c : 0;
                Decimal durationAllowance = 1;
                
                if (!combinedKeyTotalHours.containsKey(combinedKeyAllowance)) {
                    combinedKeyTotalHours.put(combinedKeyAllowance, 0);
                    combinedKeyShiftCount.put(combinedKeyAllowance, 0);
                    combinedKeyRates.put(combinedKeyAllowance, 0);
                }
                combinedKeyTotalHours.put(combinedKeyAllowance, combinedKeyTotalHours.get(combinedKeyAllowance) + durationAllowance);
                combinedKeyShiftCount.put(combinedKeyAllowance, combinedKeyShiftCount.get(combinedKeyAllowance) + 1);
                if (combinedKeyRates.get(combinedKeyAllowance) == 0 && effectiveRateAllowance != 0) {
                    combinedKeyRates.put(combinedKeyAllowance, effectiveRateAllowance);
                }
                
                continue;
            }

            // ============================================================
            // ✅ HANDLE CUSTOM SHIFT
            // ============================================================
            if (shift.Shift_Category__c != null && 
                shift.Shift_Category__c.equalsIgnoreCase('Custom')) {
                
                // PROCESS MORNING RATE 1
                if (shift.Long_Morning_Shift_Duartion__c != null && 
                    shift.Long_Morning_Shift_Duartion__c > 0 &&
                    shift.Long_Morning_Hourly_Rate__c != null && 
                    shift.Long_Morning_Hourly_Rate__c > 0) {
                    
                    categoryKey = 'Custom_Morning_1';
                    isCustomShift = true;
                    customTypeValue = 'Morning Rate 1';
                    customKeySuffix = 'Morning_Rate_1';
                    
                    Decimal duration = shift.Long_Morning_Shift_Duartion__c != null ? shift.Long_Morning_Shift_Duartion__c : 0;
                    Decimal effectiveRate = shift.Long_Morning_Hourly_Rate__c != null ? shift.Long_Morning_Hourly_Rate__c : 0;
                    String combinedKey = (String.isNotBlank(roleKey) ? roleKey.trim() : 'NO_ROLE') + '|' + categoryKey;
                    
                    combinedKeyIsCustom.put(combinedKey, true);
                    combinedKeyCustomType.put(combinedKey, customTypeValue);
                    combinedKeyDayNameMap.put(combinedKey, shift.Shift_Day_Name__c);
                    combinedKeyFacilityMap.put(combinedKey, shift.Shift_Facility__c);
                    combinedKeyIsPublicHoliday.put(combinedKey, shift.Public_holiday__c);
                    combinedKeyRoleMap.put(combinedKey, roleKey);
                    
                    if (!combinedKeyTotalHours.containsKey(combinedKey)) {
                        combinedKeyTotalHours.put(combinedKey, 0);
                        combinedKeyShiftCount.put(combinedKey, 0);
                        combinedKeyRates.put(combinedKey, 0);
                    }
                    combinedKeyTotalHours.put(combinedKey, combinedKeyTotalHours.get(combinedKey) + duration);
                    combinedKeyShiftCount.put(combinedKey, combinedKeyShiftCount.get(combinedKey) + 1);
                    if (combinedKeyRates.get(combinedKey) == 0 && effectiveRate != 0) {
                        combinedKeyRates.put(combinedKey, effectiveRate);
                    }
                }
                
                // PROCESS MORNING RATE 2
                if (shift.Long_Morning_Duartion_Two__c != null && 
                    shift.Long_Morning_Duartion_Two__c > 0 &&
                    shift.Long_Morning_Rate_Two__c != null && 
                    shift.Long_Morning_Rate_Two__c > 0) {
                    
                    categoryKey = 'Custom_Morning_2';
                    isCustomShift = true;
                    customTypeValue = 'Morning Rate 2';
                    customKeySuffix = 'Morning_Rate_2';
                    
                    Decimal duration = shift.Long_Morning_Duartion_Two__c != null ? shift.Long_Morning_Duartion_Two__c : 0;
                    Decimal effectiveRate = shift.Long_Morning_Rate_Two__c != null ? shift.Long_Morning_Rate_Two__c : 0;
                    String combinedKey = (String.isNotBlank(roleKey) ? roleKey.trim() : 'NO_ROLE') + '|' + categoryKey;
                    
                    combinedKeyIsCustom.put(combinedKey, true);
                    combinedKeyCustomType.put(combinedKey, customTypeValue);
                    combinedKeyDayNameMap.put(combinedKey, shift.Shift_Day_Name__c);
                    combinedKeyFacilityMap.put(combinedKey, shift.Shift_Facility__c);
                    combinedKeyIsPublicHoliday.put(combinedKey, shift.Public_holiday__c);
                    combinedKeyRoleMap.put(combinedKey, roleKey);
                    
                    if (!combinedKeyTotalHours.containsKey(combinedKey)) {
                        combinedKeyTotalHours.put(combinedKey, 0);
                        combinedKeyShiftCount.put(combinedKey, 0);
                        combinedKeyRates.put(combinedKey, 0);
                    }
                    combinedKeyTotalHours.put(combinedKey, combinedKeyTotalHours.get(combinedKey) + duration);
                    combinedKeyShiftCount.put(combinedKey, combinedKeyShiftCount.get(combinedKey) + 1);
                    if (combinedKeyRates.get(combinedKey) == 0 && effectiveRate != 0) {
                        combinedKeyRates.put(combinedKey, effectiveRate);
                    }
                }
                
                // PROCESS AFTERNOON RATE 1
                if (shift.Long_Afternoon_Shift_Duartion__c != null && 
                    shift.Long_Afternoon_Shift_Duartion__c > 0 &&
                    shift.Long_Afternoon_Hourly_Rate__c != null && 
                    shift.Long_Afternoon_Hourly_Rate__c > 0) {
                    
                    categoryKey = 'Custom_Afternoon_1';
                    isCustomShift = true;
                    customTypeValue = 'Afternoon Rate 1';
                    customKeySuffix = 'Afternoon_Rate_1';
                    
                    Decimal duration = shift.Long_Afternoon_Shift_Duartion__c != null ? shift.Long_Afternoon_Shift_Duartion__c : 0;
                    Decimal effectiveRate = shift.Long_Afternoon_Hourly_Rate__c != null ? shift.Long_Afternoon_Hourly_Rate__c : 0;
                    String combinedKey = (String.isNotBlank(roleKey) ? roleKey.trim() : 'NO_ROLE') + '|' + categoryKey;
                    
                    combinedKeyIsCustom.put(combinedKey, true);
                    combinedKeyCustomType.put(combinedKey, customTypeValue);
                    combinedKeyDayNameMap.put(combinedKey, shift.Shift_Day_Name__c);
                    combinedKeyFacilityMap.put(combinedKey, shift.Shift_Facility__c);
                    combinedKeyIsPublicHoliday.put(combinedKey, shift.Public_holiday__c);
                    combinedKeyRoleMap.put(combinedKey, roleKey);
                    
                    if (!combinedKeyTotalHours.containsKey(combinedKey)) {
                        combinedKeyTotalHours.put(combinedKey, 0);
                        combinedKeyShiftCount.put(combinedKey, 0);
                        combinedKeyRates.put(combinedKey, 0);
                    }
                    combinedKeyTotalHours.put(combinedKey, combinedKeyTotalHours.get(combinedKey) + duration);
                    combinedKeyShiftCount.put(combinedKey, combinedKeyShiftCount.get(combinedKey) + 1);
                    if (combinedKeyRates.get(combinedKey) == 0 && effectiveRate != 0) {
                        combinedKeyRates.put(combinedKey, effectiveRate);
                    }
                }
                
                // PROCESS AFTERNOON RATE 2
                if (shift.Long_Afternoon_Duration_Two__c != null && 
                    shift.Long_Afternoon_Duration_Two__c > 0 &&
                    shift.Long_Afternoon_Rate_Two__c != null && 
                    shift.Long_Afternoon_Rate_Two__c > 0) {
                    
                    categoryKey = 'Custom_Afternoon_2';
                    isCustomShift = true;
                    customTypeValue = 'Afternoon Rate 2';
                    customKeySuffix = 'Afternoon_Rate_2';
                    
                    Decimal duration = shift.Long_Afternoon_Duration_Two__c != null ? shift.Long_Afternoon_Duration_Two__c : 0;
                    Decimal effectiveRate = shift.Long_Afternoon_Rate_Two__c != null ? shift.Long_Afternoon_Rate_Two__c : 0;
                    String combinedKey = (String.isNotBlank(roleKey) ? roleKey.trim() : 'NO_ROLE') + '|' + categoryKey;
                    
                    combinedKeyIsCustom.put(combinedKey, true);
                    combinedKeyCustomType.put(combinedKey, customTypeValue);
                    combinedKeyDayNameMap.put(combinedKey, shift.Shift_Day_Name__c);
                    combinedKeyFacilityMap.put(combinedKey, shift.Shift_Facility__c);
                    combinedKeyIsPublicHoliday.put(combinedKey, shift.Public_holiday__c);
                    combinedKeyRoleMap.put(combinedKey, roleKey);
                    
                    if (!combinedKeyTotalHours.containsKey(combinedKey)) {
                        combinedKeyTotalHours.put(combinedKey, 0);
                        combinedKeyShiftCount.put(combinedKey, 0);
                        combinedKeyRates.put(combinedKey, 0);
                    }
                    combinedKeyTotalHours.put(combinedKey, combinedKeyTotalHours.get(combinedKey) + duration);
                    combinedKeyShiftCount.put(combinedKey, combinedKeyShiftCount.get(combinedKey) + 1);
                    if (combinedKeyRates.get(combinedKey) == 0 && effectiveRate != 0) {
                        combinedKeyRates.put(combinedKey, effectiveRate);
                    }
                }
                
                // PROCESS NIGHT RATE 1
                if (shift.Long_Night_Shift_Duartion__c != null && 
                    shift.Long_Night_Shift_Duartion__c > 0 &&
                    shift.Long_Night_Hourly_Rate__c != null && 
                    shift.Long_Night_Hourly_Rate__c > 0) {
                    
                    categoryKey = 'Custom_Night_1';
                    isCustomShift = true;
                    customTypeValue = 'Night Rate 1';
                    customKeySuffix = 'Night_Rate_1';
                    
                    Decimal duration = shift.Long_Night_Shift_Duartion__c != null ? shift.Long_Night_Shift_Duartion__c : 0;
                    Decimal effectiveRate = shift.Long_Night_Hourly_Rate__c != null ? shift.Long_Night_Hourly_Rate__c : 0;
                    String combinedKey = (String.isNotBlank(roleKey) ? roleKey.trim() : 'NO_ROLE') + '|' + categoryKey;
                    
                    combinedKeyIsCustom.put(combinedKey, true);
                    combinedKeyCustomType.put(combinedKey, customTypeValue);
                    combinedKeyDayNameMap.put(combinedKey, shift.Shift_Day_Name__c);
                    combinedKeyFacilityMap.put(combinedKey, shift.Shift_Facility__c);
                    combinedKeyIsPublicHoliday.put(combinedKey, shift.Public_holiday__c);
                    combinedKeyRoleMap.put(combinedKey, roleKey);
                    
                    if (!combinedKeyTotalHours.containsKey(combinedKey)) {
                        combinedKeyTotalHours.put(combinedKey, 0);
                        combinedKeyShiftCount.put(combinedKey, 0);
                        combinedKeyRates.put(combinedKey, 0);
                    }
                    combinedKeyTotalHours.put(combinedKey, combinedKeyTotalHours.get(combinedKey) + duration);
                    combinedKeyShiftCount.put(combinedKey, combinedKeyShiftCount.get(combinedKey) + 1);
                    if (combinedKeyRates.get(combinedKey) == 0 && effectiveRate != 0) {
                        combinedKeyRates.put(combinedKey, effectiveRate);
                    }
                }
                
                // PROCESS CUSTOM SLEEPOVER RATE 1
                if (shift.Long_Sleepover_Allowance__c != null && 
                    shift.Long_Sleepover_Allowance__c > 0) {
                    
                    categoryKey = 'Custom_Sleepover_1';
                    isCustomShift = true;
                    customTypeValue = 'Sleepover Rate 1';
                    customKeySuffix = 'Sleepover_Rate_1';
                    
                    Decimal duration = 1;
                    Decimal effectiveRate = shift.Long_Sleepover_Allowance__c != null ? shift.Long_Sleepover_Allowance__c : 0;
                    String combinedKey = (String.isNotBlank(roleKey) ? roleKey.trim() : 'NO_ROLE') + '|' + categoryKey;
                    
                    combinedKeyIsCustom.put(combinedKey, true);
                    combinedKeyCustomType.put(combinedKey, customTypeValue);
                    combinedKeyDayNameMap.put(combinedKey, shift.Shift_Day_Name__c);
                    combinedKeyFacilityMap.put(combinedKey, shift.Shift_Facility__c);
                    combinedKeyIsPublicHoliday.put(combinedKey, shift.Public_holiday__c);
                    combinedKeyRoleMap.put(combinedKey, roleKey);
                    
                    if (!combinedKeyTotalHours.containsKey(combinedKey)) {
                        combinedKeyTotalHours.put(combinedKey, 0);
                        combinedKeyShiftCount.put(combinedKey, 0);
                        combinedKeyRates.put(combinedKey, 0);
                    }
                    combinedKeyTotalHours.put(combinedKey, combinedKeyTotalHours.get(combinedKey) + duration);
                    combinedKeyShiftCount.put(combinedKey, combinedKeyShiftCount.get(combinedKey) + 1);
                    if (combinedKeyRates.get(combinedKey) == 0 && effectiveRate != 0) {
                        combinedKeyRates.put(combinedKey, effectiveRate);
                    }
                }
                
                if (!isCustomShift) {
                    System.debug('⚠️ Custom shift has no valid custom fields populated: ' + shift.Id);
                    continue;
                }
                
                continue;
            }

            // ============================================================
            // DETERMINE CATEGORY KEY (Regular Shifts)
            // ============================================================
            if (shift.Public_holiday__c == true) {
                categoryKey = 'Public Holiday';
            } 
            else if (shift.Shift_Day_Name__c != null && 
                    (shift.Shift_Day_Name__c.equalsIgnoreCase('Saturday') || 
                    shift.Shift_Day_Name__c.equalsIgnoreCase('Sunday'))) {
                String dayName = shift.Shift_Day_Name__c;
                String shiftCategory = shift.Shift_Category__c != null ? shift.Shift_Category__c.trim() : 'General';
                categoryKey = dayName + '_' + shiftCategory;
                
                if (shiftCategory.equalsIgnoreCase('General')) {
                    weekendDaysFound.add(dayName.toLowerCase());
                }
                hasWeekendShifts = true;
            } 
            else {
                if (String.isBlank(shift.Shift_Category__c)) {
                    System.debug('⚠️ Skipping shift with blank Category: ' + shift.Id);
                    continue;
                }
                categoryKey = shift.Shift_Category__c.trim();
            }

            String combinedKey = (String.isNotBlank(roleKey) ? roleKey.trim() : 'NO_ROLE') + '|' + categoryKey;

            combinedKeyDayNameMap.put(combinedKey, shift.Shift_Day_Name__c);
            combinedKeyFacilityMap.put(combinedKey, shift.Shift_Facility__c);
            combinedKeyIsPublicHoliday.put(combinedKey, shift.Public_holiday__c);
            combinedKeyRoleMap.put(combinedKey, roleKey);

            // ============================================================
            // ✅ FIXED: SUBTRACT OVERTIME HOURS FROM REGULAR DURATION
            //    (applies to ALL days — weekdays, weekends, public holidays)
            // ============================================================
            Decimal duration;
            if (isCustomShift) {
                if (customTypeValue != null && customTypeValue.contains('Morning Rate 1')) {
                    duration = shift.Long_Morning_Shift_Duartion__c != null ? shift.Long_Morning_Shift_Duartion__c : 0;
                } else if (customTypeValue != null && customTypeValue.contains('Morning Rate 2')) {
                    duration = shift.Long_Morning_Duartion_Two__c != null ? shift.Long_Morning_Duartion_Two__c : 0;
                } else if (customTypeValue != null && customTypeValue.contains('Afternoon Rate 1')) {
                    duration = shift.Long_Afternoon_Shift_Duartion__c != null ? shift.Long_Afternoon_Shift_Duartion__c : 0;
                } else if (customTypeValue != null && customTypeValue.contains('Afternoon Rate 2')) {
                    duration = shift.Long_Afternoon_Duration_Two__c != null ? shift.Long_Afternoon_Duration_Two__c : 0;
                } else if (customTypeValue != null && customTypeValue.contains('Night Rate 1')) {
                    duration = shift.Long_Night_Shift_Duartion__c != null ? shift.Long_Night_Shift_Duartion__c : 0;
                } else if (customTypeValue != null && customTypeValue.contains('Sleepover Rate 1')) {
                    duration = 1;
                } else {
                    duration = 0;
                }
            } else {
                // ✅ Regular hours = Actual_Duration__c (OT is ADDITIVE, not a slice)
                duration = shift.Actual_Duration__c != null ? shift.Actual_Duration__c : 0;
            }

            Decimal effectiveRate;
            if (isCustomShift) {
                if (customTypeValue != null && customTypeValue.contains('Morning Rate 1')) {
                    effectiveRate = shift.Long_Morning_Hourly_Rate__c != null ? shift.Long_Morning_Hourly_Rate__c : 0;
                } else if (customTypeValue != null && customTypeValue.contains('Morning Rate 2')) {
                    effectiveRate = shift.Long_Morning_Rate_Two__c != null ? shift.Long_Morning_Rate_Two__c : 0;
                } else if (customTypeValue != null && customTypeValue.contains('Afternoon Rate 1')) {
                    effectiveRate = shift.Long_Afternoon_Hourly_Rate__c != null ? shift.Long_Afternoon_Hourly_Rate__c : 0;
                } else if (customTypeValue != null && customTypeValue.contains('Afternoon Rate 2')) {
                    effectiveRate = shift.Long_Afternoon_Rate_Two__c != null ? shift.Long_Afternoon_Rate_Two__c : 0;
                } else if (customTypeValue != null && customTypeValue.contains('Night Rate 1')) {
                    effectiveRate = shift.Long_Night_Hourly_Rate__c != null ? shift.Long_Night_Hourly_Rate__c : 0;
                } else if (customTypeValue != null && customTypeValue.contains('Sleepover Rate 1')) {
                    effectiveRate = shift.Long_Sleepover_Allowance__c != null ? shift.Long_Sleepover_Allowance__c : 0;
                } else {
                    effectiveRate = 0;
                }
            } else {
                effectiveRate = shift.Staff_Final_Hourly_Rate__c != null ? shift.Staff_Final_Hourly_Rate__c : 0;

                // ✅ Diagnostic only — do NOT substitute OT rate here
                if (effectiveRate == 0 && (isOverTimeShiftTier1 || isOverTimeShiftTier2)) {
                    System.debug('   ⚠️ OverTime shift with regular rate = 0. '
                        + 'Staff_Final_Hourly_Rate__c is null/0. '
                        + 'This shift will produce a regular line with 0 rate.');
                }
            }

            if (!combinedKeyTotalHours.containsKey(combinedKey)) {
                combinedKeyTotalHours.put(combinedKey, 0);
                combinedKeyShiftCount.put(combinedKey, 0);
                combinedKeyRates.put(combinedKey, 0);
            }
            combinedKeyTotalHours.put(combinedKey, combinedKeyTotalHours.get(combinedKey) + duration);
            combinedKeyShiftCount.put(combinedKey, combinedKeyShiftCount.get(combinedKey) + 1);
            if (combinedKeyRates.get(combinedKey) == 0 && effectiveRate != 0) {
                combinedKeyRates.put(combinedKey, effectiveRate);
            }
        }

        // ============================================================
        // BUILD FINAL CATEGORY TO HOURLY RATE MAP
        // ============================================================
        Map<String, Decimal> categoryToHourlyRate = new Map<String, Decimal>();

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

        System.debug('✅ Final Category Rates: ' + JSON.serializePretty(categoryToHourlyRate));

        // ============================================================
        // VALIDATE WEEKEND RATES
        // ============================================================
        if (hasWeekendShifts) {
            System.debug('🚨 Weekend shifts detected - validating weekend rates...');
            
            Map<String, String> weekendRateErrors = new Map<String, String>();
            Set<String> processedWeekendDays = new Set<String>();

            for (String weekendDay : weekendDaysFound) {
                if (processedWeekendDays.contains(weekendDay)) continue;
                processedWeekendDays.add(weekendDay);
                
                String facilityIdForDay = shiftFacilityId;
                String sampleCombinedKey = null;
                String sampleRole = null;
                String sampleShiftCategory = null;
                
                for (String combinedKey : combinedKeyDayNameMap.keySet()) {
                    String dayName = combinedKeyDayNameMap.get(combinedKey);
                    if (String.isNotBlank(dayName) && dayName.toLowerCase().contains(weekendDay.substring(0, 3))) {
                        sampleCombinedKey = combinedKey;
                        if (String.isNotBlank(combinedKeyFacilityMap.get(combinedKey))) {
                            facilityIdForDay = combinedKeyFacilityMap.get(combinedKey);
                        }
                        sampleRole = combinedKeyRoleMap.get(combinedKey);
                        
                        if (String.isNotBlank(sampleCombinedKey) && sampleCombinedKey.contains('|')) {
                            String[] parts = sampleCombinedKey.split('\\|');
                            if (parts.size() >= 2) {
                                String categoryPart = parts[1];
                                if (categoryPart.contains('_')) {
                                    String[] catParts = categoryPart.split('_');
                                    if (catParts.size() >= 2) {
                                        sampleShiftCategory = catParts[1];
                                    }
                                }
                            }
                        }
                        break;
                    }
                }
                
                String categoryKey = sampleCombinedKey != null ? sampleCombinedKey.split('\\|')[1] : weekendDay;
                
                String dayRateId = findExactRateForShift(
                    categoryKey,
                    weekendDay,
                    facilityIdForDay,
                    sampleRole,
                    facilityRateMap,
                    facilityRoleRateMap
                );
                
                if (String.isBlank(dayRateId)) {
                    String errorMsg = 
                        '❌ NO EARNING RATE FOUND for ' + weekendDay.substring(0, 1).toUpperCase() + weekendDay.substring(1) + 
                        ' shifts in Facility Xero Settings.\n\n' +
                        'Required: A Xero Setting record with:\n' +
                        '  • Category = "' + weekendDay.substring(0, 1).toUpperCase() + weekendDay.substring(1) + '"' + '\n' +
                        '  • Shift Type = "' + (sampleShiftCategory != null ? sampleShiftCategory.substring(0, 1).toUpperCase() + sampleShiftCategory.substring(1) : 'General') + '"' + '\n' +
                        '  • Pay Item = [Valid Xero Earning Rate ID]\n' +
                        '  • Role Name = "' + sampleRole + '" (CASE-SENSITIVE)';
                    
                    weekendRateErrors.put(weekendDay, errorMsg);
                    System.debug('❌ ' + errorMsg);
                    
                } else {
                    Map<String, Object> validationResult = isEarningRateActiveInXeroWithDetails(
                        dayRateId,
                        ctx.accessToken,
                        ctx.tenantId
                    );
                    
                    Boolean isValid = (Boolean) validationResult.get('isValid');
                    String rateName = (String) validationResult.get('rateName');
                    String message = (String) validationResult.get('message');
                    
                    if (!isValid) {
                        String errorMsg = 
                            '❌ The ' + weekendDay.substring(0, 1).toUpperCase() + weekendDay.substring(1) + 
                            ' earning rate is INACTIVE or not found in Xero.\n\n' +
                            'Rate ID: ' + dayRateId + '\n' +
                            'Rate Name: ' + (String.isNotBlank(rateName) ? rateName : 'Unknown') + '\n' +
                            'Error: ' + message;
                        
                        weekendRateErrors.put(weekendDay, errorMsg);
                        System.debug('❌ ' + errorMsg);
                    } else {
                        System.debug('✅ ' + weekendDay + ' rate is ACTIVE: ' + rateName + ' (' + dayRateId + ')');
                    }
                }
            }

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
                errorMessage += '2. Create/update records for Saturday and Sunday categories with Shift Types\n';
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
                return;
            }
            
            System.debug('✅ Weekend rate validation passed for: ' + staff.Display_Nickname__c);
        }

        // ============================================================
        // BUILD EMPLOYEE PAY TEMPLATE
        // ============================================================
        Map<String, String> rateIdByRoleCategory = new Map<String, String>();
        Map<String, Decimal> rateValueByRoleCategory = new Map<String, Decimal>();

        for (ShiftwithStaff__c shift : shifts) {
            String shiftRole = shift.Role_formula__c;
            String categoryKey;
            String sleepoverType = null;
            Boolean isCustomShift = false;
            String customTypeValue = null;
            String customKeySuffix = null;
            
            // ✅ CHECK FOR OVERTIME TIER 1
            Boolean isOverTimeShiftTier1 = false;
            if (shift.Over_Time_Tier_One__c != null && shift.Over_Time_Tier_One__c > 0 &&
                shift.Over_Time_Tier_One_Rate__c != null && shift.Over_Time_Tier_One_Rate__c > 0) {
                isOverTimeShiftTier1 = true;
            }

            if (isOverTimeShiftTier1 && shift.Shift_Day_Name__c != null) {
                String dayNameLower = shift.Shift_Day_Name__c.toLowerCase().trim();
                Boolean isWeekday = dayNameLower.equals('monday') || dayNameLower.equals('tuesday') || 
                                    dayNameLower.equals('wednesday') || dayNameLower.equals('thursday') || 
                                    dayNameLower.equals('friday');
                
                if (isWeekday) {
                    String baseCategory = shift.Shift_Category__c != null ? shift.Shift_Category__c.trim() : 'General';
                    String categoryKeyOverTime = 'OverTime_' + baseCategory;
                    String combinedKey = (String.isNotBlank(shiftRole) ? shiftRole.trim() : 'NO_ROLE') + '|' + categoryKeyOverTime;
                    
                    String rateId = findCustomRateForShift('OverTime Rate 1', baseCategory, shiftRole, facilityRoleRateMap);
                    
                    if (String.isBlank(rateId) && facilityRoleRateMap.containsKey(shift.Shift_Facility__c)) {
                        Map<String, Map<String, String>> roleMap = facilityRoleRateMap.get(shift.Shift_Facility__c);
                        if (roleMap.containsKey(shiftRole)) {
                            Map<String, String> roleRateMap = roleMap.get(shiftRole);
                            String expectedKey = 'overtime rate 1|' + baseCategory.toLowerCase().trim();
                            if (roleRateMap.containsKey(expectedKey)) {
                                rateId = roleRateMap.get(expectedKey);
                                System.debug('   ✅ [PayTemplate] OT Tier 1 via exact scoped key: ' + rateId);
                            }
                        }
                    }
                    
                    if (String.isNotBlank(rateId) && !rateIdByRoleCategory.containsKey(combinedKey)) {
                        rateIdByRoleCategory.put(combinedKey, rateId);
                        Decimal rateValue = shift.Over_Time_Tier_One_Rate__c != null ? shift.Over_Time_Tier_One_Rate__c : 0;
                        rateValueByRoleCategory.put(combinedKey, rateValue);
                        System.debug('✅ Combined Key (OverTime Tier 1): ' + combinedKey + ' | Rate ID: ' + rateId + ' | Rate Value: ' + rateValue);
                    }
                }
            }

            // ✅ CHECK FOR OVERTIME TIER 2
            Boolean isOverTimeShiftTier2 = false;
            if (shift.Over_Time_Tier_Two__c != null && shift.Over_Time_Tier_Two__c > 0 &&
                shift.Over_Time_Tier_Two_Rate__c != null && shift.Over_Time_Tier_Two_Rate__c > 0) {
                isOverTimeShiftTier2 = true;
            }

            if (isOverTimeShiftTier2 && shift.Shift_Day_Name__c != null) {
                String dayNameLower = shift.Shift_Day_Name__c.toLowerCase().trim();
                Boolean isWeekday = dayNameLower.equals('monday') || dayNameLower.equals('tuesday') || 
                                    dayNameLower.equals('wednesday') || dayNameLower.equals('thursday') || 
                                    dayNameLower.equals('friday');
                
                if (isWeekday) {
                    String baseCategory = shift.Shift_Category__c != null ? shift.Shift_Category__c.trim() : 'General';
                    String categoryKeyOverTime = 'OverTime_Tier2_' + baseCategory;
                    String combinedKey = (String.isNotBlank(shiftRole) ? shiftRole.trim() : 'NO_ROLE') + '|' + categoryKeyOverTime;
                    
                    String rateId = findCustomRateForShift('OverTime Rate 2', baseCategory, shiftRole, facilityRoleRateMap);
                    
                    if (String.isBlank(rateId) && facilityRoleRateMap.containsKey(shift.Shift_Facility__c)) {
                        Map<String, Map<String, String>> roleMap = facilityRoleRateMap.get(shift.Shift_Facility__c);
                        if (roleMap.containsKey(shiftRole)) {
                            Map<String, String> roleRateMap = roleMap.get(shiftRole);
                            String expectedKey = 'overtime rate 2|' + baseCategory.toLowerCase().trim();
                            if (roleRateMap.containsKey(expectedKey)) {
                                rateId = roleRateMap.get(expectedKey);
                                System.debug('   ✅ [PayTemplate] OT Tier 2 via exact scoped key: ' + rateId);
                            }
                        }
                    }
                    
                    if (String.isNotBlank(rateId) && !rateIdByRoleCategory.containsKey(combinedKey)) {
                        rateIdByRoleCategory.put(combinedKey, rateId);
                        Decimal rateValue = shift.Over_Time_Tier_Two_Rate__c != null ? shift.Over_Time_Tier_Two_Rate__c : 0;
                        rateValueByRoleCategory.put(combinedKey, rateValue);
                        System.debug('✅ Combined Key (OverTime Tier 2): ' + combinedKey + ' | Rate ID: ' + rateId + ' | Rate Value: ' + rateValue);
                    }
                }
            }
            
            // ============================================================
            // ✅ FIXED: BROKEN SHIFT — use namespaced keys
            // ============================================================
            if (shift.Broken_Shift__c) {
                Decimal allowance = shift.Broken_Shift_Allowance__c != null ? shift.Broken_Shift_Allowance__c : 0;
                Decimal regularRate = shift.Staff_Final_Hourly_Rate__c != null ? shift.Staff_Final_Hourly_Rate__c : 0;
                String dayName = shift.Shift_Day_Name__c != null ? shift.Shift_Day_Name__c : 'Monday';
                String facilityId = shift.Shift_Facility__c != null ? shift.Shift_Facility__c : shiftFacilityId;

                // ✅ ALLOWANCE — namespaced broken key
                if (allowance > 0) {
                    String combinedKeyAllowance = (String.isNotBlank(shiftRole) ? shiftRole.trim() : 'NO_ROLE')
                        + '|' + 'Broken' + '|Allowance';

                    String rateId = findExactRateForShift(
                        'broken|allowance',
                        dayName,
                        facilityId,
                        shiftRole,
                        facilityRateMap,
                        facilityRoleRateMap
                    );

                    // Fallback: plain 'broken'
                    if (String.isBlank(rateId)) {
                        rateId = findExactRateForShift(
                            'broken',
                            dayName,
                            facilityId,
                            shiftRole,
                            facilityRateMap,
                            facilityRoleRateMap
                        );
                    }

                    if (String.isNotBlank(rateId) && !rateIdByRoleCategory.containsKey(combinedKeyAllowance)) {
                        rateIdByRoleCategory.put(combinedKeyAllowance, rateId);
                        rateValueByRoleCategory.put(combinedKeyAllowance, allowance);
                        System.debug('✅ [BROKEN Allowance] Key: ' + combinedKeyAllowance
                            + ' | Rate ID: ' + rateId + ' | Amount: ' + allowance);
                    }
                }

                // ✅ REGULAR (Fixed Rate) — namespaced broken key
                String combinedKeyRegular = (String.isNotBlank(shiftRole) ? shiftRole.trim() : 'NO_ROLE')
                    + '|' + 'Broken' + '|Regular';

                String rateIdRegular = findExactRateForShift(
                    'broken|fixed rate',
                    dayName,
                    facilityId,
                    shiftRole,
                    facilityRateMap,
                    facilityRoleRateMap
                );

                // Fallback: plain 'broken'
                if (String.isBlank(rateIdRegular)) {
                    rateIdRegular = findExactRateForShift(
                        'broken',
                        dayName,
                        facilityId,
                        shiftRole,
                        facilityRateMap,
                        facilityRoleRateMap
                    );
                }

                if (String.isNotBlank(rateIdRegular) && !rateIdByRoleCategory.containsKey(combinedKeyRegular)) {
                    rateIdByRoleCategory.put(combinedKeyRegular, rateIdRegular);
                    rateValueByRoleCategory.put(combinedKeyRegular, regularRate);
                    System.debug('✅ [BROKEN Regular] Key: ' + combinedKeyRegular
                        + ' | Rate ID: ' + rateIdRegular + ' | Rate: ' + regularRate);
                }
            }
            // ✅ SLEEPOVER SHIFT
            else if (shift.Type_of_shift__c != null && 
                shift.Type_of_shift__c.equalsIgnoreCase('Sleepover Shift')) {
                categoryKey = 'Sleepover';
                
                Boolean hasRate = shift.Sleepover_Night_Shift_Hourly_Rate__c != null && shift.Sleepover_Night_Shift_Hourly_Rate__c != 0;
                Boolean hasHours = shift.Sleepover_Night_shift_hours__c != null && shift.Sleepover_Night_shift_hours__c != 0;
                sleepoverType = (hasRate && hasHours) ? 'Fixed Rate' : 'Allowance';
            } 
            // ✅ CUSTOM SHIFT
            else if (shift.Shift_Category__c != null && shift.Shift_Category__c.equalsIgnoreCase('Custom')) {
                
                if (shift.Long_Morning_Shift_Duartion__c != null && 
                    shift.Long_Morning_Shift_Duartion__c > 0 &&
                    shift.Long_Morning_Hourly_Rate__c != null && 
                    shift.Long_Morning_Hourly_Rate__c > 0) {
                    isCustomShift = true;
                    customTypeValue = 'Morning Rate 1';
                    categoryKey = 'Custom_Morning_1';
                    
                    String combinedKey = (String.isNotBlank(shiftRole) ? shiftRole.trim() : 'NO_ROLE') + '|' + categoryKey;
                    String rateId = findCustomRateForShift(customTypeValue, shiftRole, facilityRoleRateMap);
                    
                    if (String.isNotBlank(rateId) && !rateIdByRoleCategory.containsKey(combinedKey)) {
                        rateIdByRoleCategory.put(combinedKey, rateId);
                        Decimal rateValue = shift.Long_Morning_Hourly_Rate__c != null ? shift.Long_Morning_Hourly_Rate__c : 0;
                        rateValueByRoleCategory.put(combinedKey, rateValue);
                    }
                }
                
                if (shift.Long_Morning_Duartion_Two__c != null && 
                    shift.Long_Morning_Duartion_Two__c > 0 &&
                    shift.Long_Morning_Rate_Two__c != null && 
                    shift.Long_Morning_Rate_Two__c > 0) {
                    isCustomShift = true;
                    customTypeValue = 'Morning Rate 2';
                    categoryKey = 'Custom_Morning_2';
                    
                    String combinedKey = (String.isNotBlank(shiftRole) ? shiftRole.trim() : 'NO_ROLE') + '|' + categoryKey;
                    String rateId = findCustomRateForShift(customTypeValue, shiftRole, facilityRoleRateMap);
                    
                    if (String.isNotBlank(rateId) && !rateIdByRoleCategory.containsKey(combinedKey)) {
                        rateIdByRoleCategory.put(combinedKey, rateId);
                        Decimal rateValue = shift.Long_Morning_Rate_Two__c != null ? shift.Long_Morning_Rate_Two__c : 0;
                        rateValueByRoleCategory.put(combinedKey, rateValue);
                    }
                }
                
                if (shift.Long_Afternoon_Shift_Duartion__c != null && 
                    shift.Long_Afternoon_Shift_Duartion__c > 0 &&
                    shift.Long_Afternoon_Hourly_Rate__c != null && 
                    shift.Long_Afternoon_Hourly_Rate__c > 0) {
                    isCustomShift = true;
                    customTypeValue = 'Afternoon Rate 1';
                    categoryKey = 'Custom_Afternoon_1';
                    
                    String combinedKey = (String.isNotBlank(shiftRole) ? shiftRole.trim() : 'NO_ROLE') + '|' + categoryKey;
                    String rateId = findCustomRateForShift(customTypeValue, shiftRole, facilityRoleRateMap);
                    
                    if (String.isNotBlank(rateId) && !rateIdByRoleCategory.containsKey(combinedKey)) {
                        rateIdByRoleCategory.put(combinedKey, rateId);
                        Decimal rateValue = shift.Long_Afternoon_Hourly_Rate__c != null ? shift.Long_Afternoon_Hourly_Rate__c : 0;
                        rateValueByRoleCategory.put(combinedKey, rateValue);
                    }
                }
                
                if (shift.Long_Afternoon_Duration_Two__c != null && 
                    shift.Long_Afternoon_Duration_Two__c > 0 &&
                    shift.Long_Afternoon_Rate_Two__c != null && 
                    shift.Long_Afternoon_Rate_Two__c > 0) {
                    isCustomShift = true;
                    customTypeValue = 'Afternoon Rate 2';
                    categoryKey = 'Custom_Afternoon_2';
                    
                    String combinedKey = (String.isNotBlank(shiftRole) ? shiftRole.trim() : 'NO_ROLE') + '|' + categoryKey;
                    String rateId = findCustomRateForShift(customTypeValue, shiftRole, facilityRoleRateMap);
                    
                    if (String.isNotBlank(rateId) && !rateIdByRoleCategory.containsKey(combinedKey)) {
                        rateIdByRoleCategory.put(combinedKey, rateId);
                        Decimal rateValue = shift.Long_Afternoon_Rate_Two__c != null ? shift.Long_Afternoon_Rate_Two__c : 0;
                        rateValueByRoleCategory.put(combinedKey, rateValue);
                    }
                }
                
                if (shift.Long_Night_Shift_Duartion__c != null && 
                    shift.Long_Night_Shift_Duartion__c > 0 &&
                    shift.Long_Night_Hourly_Rate__c != null && 
                    shift.Long_Night_Hourly_Rate__c > 0) {
                    isCustomShift = true;
                    customTypeValue = 'Night Rate 1';
                    categoryKey = 'Custom_Night_1';
                    
                    String combinedKey = (String.isNotBlank(shiftRole) ? shiftRole.trim() : 'NO_ROLE') + '|' + categoryKey;
                    String rateId = findCustomRateForShift(customTypeValue, shiftRole, facilityRoleRateMap);
                    
                    if (String.isNotBlank(rateId) && !rateIdByRoleCategory.containsKey(combinedKey)) {
                        rateIdByRoleCategory.put(combinedKey, rateId);
                        Decimal rateValue = shift.Long_Night_Hourly_Rate__c != null ? shift.Long_Night_Hourly_Rate__c : 0;
                        rateValueByRoleCategory.put(combinedKey, rateValue);
                    }
                }
                
                if (shift.Long_Sleepover_Allowance__c != null && 
                    shift.Long_Sleepover_Allowance__c > 0) {
                    isCustomShift = true;
                    customTypeValue = 'Sleepover Rate 1';
                    categoryKey = 'Custom_Sleepover_1';
                    
                    String combinedKey = (String.isNotBlank(shiftRole) ? shiftRole.trim() : 'NO_ROLE') + '|' + categoryKey;
                    String rateId = findCustomRateForShift(customTypeValue, shiftRole, facilityRoleRateMap);
                    
                    if (String.isNotBlank(rateId) && !rateIdByRoleCategory.containsKey(combinedKey)) {
                        rateIdByRoleCategory.put(combinedKey, rateId);
                        Decimal rateValue = shift.Long_Sleepover_Allowance__c != null ? shift.Long_Sleepover_Allowance__c : 0;
                        rateValueByRoleCategory.put(combinedKey, rateValue);
                    }
                }
                
                if (isCustomShift) {
                    continue;
                }
            }
            // ✅ REGULAR SHIFT (Public Holiday / Weekend / Weekday)
            else if (shift.Public_holiday__c == true) {
                categoryKey = 'Public Holiday';
            } else if (shift.Shift_Day_Name__c != null && 
                        (shift.Shift_Day_Name__c.equalsIgnoreCase('Saturday') || 
                        shift.Shift_Day_Name__c.equalsIgnoreCase('Sunday'))) {
                String dayName = shift.Shift_Day_Name__c;
                String shiftCategory = shift.Shift_Category__c != null ? shift.Shift_Category__c.trim() : 'General';
                categoryKey = dayName + '_' + shiftCategory;
            } else {
                categoryKey = shift.Shift_Category__c != null ? shift.Shift_Category__c.trim() : null;
            }
            
            if (String.isBlank(categoryKey)) continue;
            
            // SLEEPOVER PAY TEMPLATE
            if (shift.Type_of_shift__c != null && 
                shift.Type_of_shift__c.equalsIgnoreCase('Sleepover Shift')) {
                
                Boolean hasRate = shift.Sleepover_Night_Shift_Hourly_Rate__c != null && shift.Sleepover_Night_Shift_Hourly_Rate__c != 0;
                Boolean hasHours = shift.Sleepover_Night_shift_hours__c != null && shift.Sleepover_Night_shift_hours__c != 0;
                
                if (hasRate && hasHours) {
                    String combinedKeyFixed = (String.isNotBlank(shiftRole) ? shiftRole.trim() : 'NO_ROLE') + '|' + categoryKey + '|FixedRate';
                    String rateIdFixed = findExactRateForShift(
                        'sleepover|fixed rate',
                        shift.Shift_Day_Name__c != null ? shift.Shift_Day_Name__c : 'Monday',
                        shift.Shift_Facility__c != null ? shift.Shift_Facility__c : shiftFacilityId,
                        shiftRole,
                        facilityRateMap,
                        facilityRoleRateMap
                    );
                    
                    if (String.isNotBlank(rateIdFixed) && !rateIdByRoleCategory.containsKey(combinedKeyFixed)) {
                        rateIdByRoleCategory.put(combinedKeyFixed, rateIdFixed);
                        rateValueByRoleCategory.put(combinedKeyFixed, shift.Sleepover_Night_Shift_Hourly_Rate__c);
                    }
                }
                
                String combinedKeyAllowance = (String.isNotBlank(shiftRole) ? shiftRole.trim() : 'NO_ROLE') + '|' + categoryKey + '|Allowance';
                String rateIdAllowance = findExactRateForShift(
                    'sleepover|allowance',
                    shift.Shift_Day_Name__c != null ? shift.Shift_Day_Name__c : 'Monday',
                    shift.Shift_Facility__c != null ? shift.Shift_Facility__c : shiftFacilityId,
                    shiftRole,
                    facilityRateMap,
                    facilityRoleRateMap
                );
                
                if (String.isNotBlank(rateIdAllowance) && !rateIdByRoleCategory.containsKey(combinedKeyAllowance)) {
                    rateIdByRoleCategory.put(combinedKeyAllowance, rateIdAllowance);
                    Decimal rateValue = shift.Staff_Final_Hourly_Rate__c != null ? shift.Staff_Final_Hourly_Rate__c : 0;
                    rateValueByRoleCategory.put(combinedKeyAllowance, rateValue);
                }
            } 
            // REGULAR SHIFT PAY TEMPLATE
            else {
                String combinedKey = (String.isNotBlank(shiftRole) ? shiftRole.trim() : 'NO_ROLE') + '|' + categoryKey;
                
                String rateId = findExactRateForShift(
                    categoryKey.toLowerCase().trim(),
                    shift.Shift_Day_Name__c != null ? shift.Shift_Day_Name__c : 'Monday',
                    shift.Shift_Facility__c != null ? shift.Shift_Facility__c : shiftFacilityId,
                    shiftRole,
                    facilityRateMap,
                    facilityRoleRateMap
                );
                
                if (String.isNotBlank(rateId) && !rateIdByRoleCategory.containsKey(combinedKey)) {
                    rateIdByRoleCategory.put(combinedKey, rateId);
                    Decimal rateValue = shift.Staff_Final_Hourly_Rate__c != null ? shift.Staff_Final_Hourly_Rate__c : 0;
                    rateValueByRoleCategory.put(combinedKey, rateValue);
                    System.debug('✅ Combined Key (Regular): ' + combinedKey + ' | Rate ID: ' + rateId + ' | Rate Value: ' + rateValue);
                }
            }
        }

        // ============================================================
        // BUILD EARNINGS LINES
        // ============================================================
        List<Object> earningsLines = new List<Object>();
        Map<String, Decimal> rateIdToHighestRate = new Map<String, Decimal>();
        Map<String, List<String>> rateIdToCategories = new Map<String, List<String>>();
        
        Boolean ordinaryRateAdded = false;
        Decimal ordinaryRateValue = 0;
        List<String> failedCombinedKeys = new List<String>();
        Map<String, String> failedCategoryDetails = new Map<String, String>();

        for (String combinedKey : rateIdByRoleCategory.keySet()) {
            String matchedEarningRateId = rateIdByRoleCategory.get(combinedKey);
            
            if (String.isBlank(matchedEarningRateId)) {
                failedCombinedKeys.add(combinedKey);
                failedCategoryDetails.put(combinedKey, 'No rate found for: ' + combinedKey);
                continue;
            }
            
            String role = 'NO_ROLE';
            String category = combinedKey;
            if (combinedKey.contains('|')) {
                List<String> parts = combinedKey.split('\\|');
                if (parts.size() >= 2) {
                    role = parts[0];
                    category = parts[1];
                }
            }
            
            String validatedRateId = validateAndGetActiveRate(
                matchedEarningRateId,
                xeroEmployeeId,
                ctx
            );
            
            if (String.isBlank(validatedRateId)) {
                failedCombinedKeys.add(combinedKey);
                failedCategoryDetails.put(combinedKey, 'Rate is INACTIVE in Xero: ' + matchedEarningRateId);
                continue;
            }
            
            Decimal rateValue = rateValueByRoleCategory.get(combinedKey);
            if (rateValue == null) rateValue = 0;
            
            if (!rateIdToCategories.containsKey(validatedRateId)) {
                rateIdToCategories.put(validatedRateId, new List<String>());
            }
            rateIdToCategories.get(validatedRateId).add(role + ' + ' + category + ' (' + rateValue + ')');
            
            if (!rateIdToHighestRate.containsKey(validatedRateId) || 
                rateValue > rateIdToHighestRate.get(validatedRateId)) {
                rateIdToHighestRate.put(validatedRateId, rateValue);
            }
            
            if (validatedRateId.equals(ordinaryEarningsRateId)) {
                ordinaryRateAdded = true;
                ordinaryRateValue = rateValue;
            }
        }

        for (String rateId : rateIdToHighestRate.keySet()) {
            Decimal rateValue = rateIdToHighestRate.get(rateId);
            List<String> categories = rateIdToCategories.get(rateId);
            
            System.debug('   Rate ID: ' + rateId + ' | Rate: ' + rateValue + ' | Used for: ' + String.join(categories, ', '));
            
            earningsLines.add(
                new Map<String, Object>{
                    'EarningsRateID' => rateId,
                    'CalculationType' => 'ENTEREARNINGSRATE',
                    'RatePerUnit' => rateValue
                }
            );
        }

        if (!failedCombinedKeys.isEmpty()) {
            String errorDetails = '';
            Set<String> uniqueErrors = new Set<String>();
            
            for (String combinedKey : failedCombinedKeys) {
                String detail = failedCategoryDetails.get(combinedKey);
                if (String.isNotBlank(detail) && !uniqueErrors.contains(detail)) {
                    uniqueErrors.add(detail);
                    errorDetails += '\n• ' + detail;
                }
            }
            
            String errorMessage = '❌ Cannot send timesheet to Xero: Missing earning rates for shifts.\n' + errorDetails;
            
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

        if (String.isNotBlank(ordinaryEarningsRateId)) {
            if (!rateIdToHighestRate.containsKey(ordinaryEarningsRateId)) {
                earningsLines.add(
                    new Map<String, Object>{
                        'EarningsRateID' => ordinaryEarningsRateId,
                        'CalculationType' => 'ENTEREARNINGSRATE',
                        'RatePerUnit' => 0
                    }
                );
                System.debug('➕ Added Xero Ordinary Earnings Rate with 0');
            }
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
        Map<String, Map<Date, Decimal>> categoryDateHoursMap = new Map<String, Map<Date, Decimal>>();

        for (ShiftwithStaff__c shift : shifts) {
            String categoryKey;
            String roleKey;
            Decimal duration;
            Boolean isCustomShift = false;
            String customTypeValue = null;
            String customKeySuffix = null;
            
            Boolean isOverTimeShiftTier1 = false;
            if (shift.Over_Time_Tier_One__c != null && shift.Over_Time_Tier_One__c > 0 &&
                shift.Over_Time_Tier_One_Rate__c != null && shift.Over_Time_Tier_One_Rate__c > 0) {
                isOverTimeShiftTier1 = true;
            }

            if (isOverTimeShiftTier1 && shift.Shift_Day_Name__c != null) {
                String dayNameLower = shift.Shift_Day_Name__c.toLowerCase().trim();
                Boolean isWeekday = dayNameLower.equals('monday') || dayNameLower.equals('tuesday') || 
                                    dayNameLower.equals('wednesday') || dayNameLower.equals('thursday') || 
                                    dayNameLower.equals('friday');
                
                if (isWeekday) {
                    String baseCategory = shift.Shift_Category__c != null ? shift.Shift_Category__c.trim() : 'General';
                    String categoryKeyOverTime = 'OverTime_' + baseCategory;
                    roleKey = shift.Role_formula__c;
                    duration = shift.Over_Time_Tier_One__c != null ? shift.Over_Time_Tier_One__c : 0;
                    
                    String combinedKey = (String.isNotBlank(roleKey) ? roleKey.trim() : 'NO_ROLE') + '|' + categoryKeyOverTime;
                    
                    if (duration > 0) {
                        if (!categoryDateHoursMap.containsKey(combinedKey)) {
                            categoryDateHoursMap.put(combinedKey, new Map<Date, Decimal>());
                        }
                        Map<Date, Decimal> dateMap = categoryDateHoursMap.get(combinedKey);
                        Decimal existing = dateMap.containsKey(shift.Date__c) ? dateMap.get(shift.Date__c) : 0;
                        dateMap.put(shift.Date__c, existing + duration);
                    }
                }
            }

            Boolean isOverTimeShiftTier2 = false;
            if (shift.Over_Time_Tier_Two__c != null && shift.Over_Time_Tier_Two__c > 0 &&
                shift.Over_Time_Tier_Two_Rate__c != null && shift.Over_Time_Tier_Two_Rate__c > 0) {
                isOverTimeShiftTier2 = true;
            }

            if (isOverTimeShiftTier2 && shift.Shift_Day_Name__c != null) {
                String dayNameLower = shift.Shift_Day_Name__c.toLowerCase().trim();
                Boolean isWeekday = dayNameLower.equals('monday') || dayNameLower.equals('tuesday') || 
                                    dayNameLower.equals('wednesday') || dayNameLower.equals('thursday') || 
                                    dayNameLower.equals('friday');
                
                if (isWeekday) {
                    String baseCategory = shift.Shift_Category__c != null ? shift.Shift_Category__c.trim() : 'General';
                    String categoryKeyOverTime = 'OverTime_Tier2_' + baseCategory;
                    roleKey = shift.Role_formula__c;
                    duration = shift.Over_Time_Tier_Two__c != null ? shift.Over_Time_Tier_Two__c : 0;
                    
                    String combinedKey = (String.isNotBlank(roleKey) ? roleKey.trim() : 'NO_ROLE') + '|' + categoryKeyOverTime;
                    
                    if (duration > 0) {
                        if (!categoryDateHoursMap.containsKey(combinedKey)) {
                            categoryDateHoursMap.put(combinedKey, new Map<Date, Decimal>());
                        }
                        Map<Date, Decimal> dateMap = categoryDateHoursMap.get(combinedKey);
                        Decimal existing = dateMap.containsKey(shift.Date__c) ? dateMap.get(shift.Date__c) : 0;
                        dateMap.put(shift.Date__c, existing + duration);
                    }
                }
            }

            // BROKEN SHIFT
            if (shift.Broken_Shift__c) {
                String roleKeyBroken = shift.Role_formula__c;
                Decimal allowance = shift.Broken_Shift_Allowance__c != null ? shift.Broken_Shift_Allowance__c : 0;
                Decimal regularDuration = shift.Actual_Duration__c != null ? shift.Actual_Duration__c : 0;
                String categoryKeyBroken = 'Broken';
                
                if (allowance > 0) {
                    String combinedKeyAllowance = (String.isNotBlank(roleKeyBroken) ? roleKeyBroken.trim() : 'NO_ROLE') + '|' + categoryKeyBroken + '|Allowance';
                    Decimal durationAllowance = 1;
                    
                    if (!categoryDateHoursMap.containsKey(combinedKeyAllowance)) {
                        categoryDateHoursMap.put(combinedKeyAllowance, new Map<Date, Decimal>());
                    }
                    Map<Date, Decimal> dateMapAllowance = categoryDateHoursMap.get(combinedKeyAllowance);
                    Decimal existingAllowance = dateMapAllowance.containsKey(shift.Date__c) ? dateMapAllowance.get(shift.Date__c) : 0;
                    dateMapAllowance.put(shift.Date__c, existingAllowance + durationAllowance);
                }
                
                String combinedKeyRegular = (String.isNotBlank(roleKeyBroken) ? roleKeyBroken.trim() : 'NO_ROLE') + '|' + categoryKeyBroken + '|Regular';
                Decimal durationRegular = regularDuration;
                
                if (durationRegular > 0) {
                    if (!categoryDateHoursMap.containsKey(combinedKeyRegular)) {
                        categoryDateHoursMap.put(combinedKeyRegular, new Map<Date, Decimal>());
                    }
                    Map<Date, Decimal> dateMapRegular = categoryDateHoursMap.get(combinedKeyRegular);
                    Decimal existingRegular = dateMapRegular.containsKey(shift.Date__c) ? dateMapRegular.get(shift.Date__c) : 0;
                    dateMapRegular.put(shift.Date__c, existingRegular + durationRegular);
                }
                
                continue;
            } 
            else if (shift.Type_of_shift__c != null && shift.Type_of_shift__c.equalsIgnoreCase('Sleepover Shift')) {
                categoryKey = 'Sleepover';
                roleKey = shift.Role_formula__c;
                
                Boolean hasRate = shift.Sleepover_Night_Shift_Hourly_Rate__c != null && shift.Sleepover_Night_Shift_Hourly_Rate__c != 0;
                Boolean hasHours = shift.Sleepover_Night_shift_hours__c != null && shift.Sleepover_Night_shift_hours__c != 0;
                
                if (hasRate && hasHours) {
                    String combinedKeyFixed = (String.isNotBlank(roleKey) ? roleKey.trim() : 'NO_ROLE') + '|' + categoryKey + '|FixedRate';
                    Decimal durationFixed = shift.Sleepover_Night_shift_hours__c;
                    
                    if (!categoryDateHoursMap.containsKey(combinedKeyFixed)) {
                        categoryDateHoursMap.put(combinedKeyFixed, new Map<Date, Decimal>());
                    }
                    Map<Date, Decimal> dateMapFixed = categoryDateHoursMap.get(combinedKeyFixed);
                    Decimal existingFixed = dateMapFixed.containsKey(shift.Date__c) ? dateMapFixed.get(shift.Date__c) : 0;
                    dateMapFixed.put(shift.Date__c, existingFixed + durationFixed);
                }
                
                String combinedKeyAllowance = (String.isNotBlank(roleKey) ? roleKey.trim() : 'NO_ROLE') + '|' + categoryKey + '|Allowance';
                Decimal durationAllowance = 1;
                
                if (!categoryDateHoursMap.containsKey(combinedKeyAllowance)) {
                    categoryDateHoursMap.put(combinedKeyAllowance, new Map<Date, Decimal>());
                }
                Map<Date, Decimal> dateMapAllowance = categoryDateHoursMap.get(combinedKeyAllowance);
                Decimal existingAllowance = dateMapAllowance.containsKey(shift.Date__c) ? dateMapAllowance.get(shift.Date__c) : 0;
                dateMapAllowance.put(shift.Date__c, existingAllowance + durationAllowance);
                
                continue;
            } 
            else if (shift.Shift_Category__c != null && shift.Shift_Category__c.equalsIgnoreCase('Custom')) {
                
                if (shift.Long_Morning_Shift_Duartion__c != null && 
                    shift.Long_Morning_Shift_Duartion__c > 0 &&
                    shift.Long_Morning_Hourly_Rate__c != null && 
                    shift.Long_Morning_Hourly_Rate__c > 0) {
                    isCustomShift = true;
                    customTypeValue = 'Morning Rate 1';
                    roleKey = shift.Role_formula__c;
                    categoryKey = 'Custom_Morning_1';
                    duration = shift.Long_Morning_Shift_Duartion__c != null ? shift.Long_Morning_Shift_Duartion__c : 0;
                    
                    String combinedKey = (String.isNotBlank(roleKey) ? roleKey.trim() : 'NO_ROLE') + '|' + categoryKey;
                    if (!categoryDateHoursMap.containsKey(combinedKey)) {
                        categoryDateHoursMap.put(combinedKey, new Map<Date, Decimal>());
                    }
                    Map<Date, Decimal> dateMap = categoryDateHoursMap.get(combinedKey);
                    Decimal existing = dateMap.containsKey(shift.Date__c) ? dateMap.get(shift.Date__c) : 0;
                    dateMap.put(shift.Date__c, existing + duration);
                }
                
                if (shift.Long_Morning_Duartion_Two__c != null && 
                    shift.Long_Morning_Duartion_Two__c > 0 &&
                    shift.Long_Morning_Rate_Two__c != null && 
                    shift.Long_Morning_Rate_Two__c > 0) {
                    isCustomShift = true;
                    customTypeValue = 'Morning Rate 2';
                    roleKey = shift.Role_formula__c;
                    categoryKey = 'Custom_Morning_2';
                    duration = shift.Long_Morning_Duartion_Two__c != null ? shift.Long_Morning_Duartion_Two__c : 0;
                    
                    String combinedKey = (String.isNotBlank(roleKey) ? roleKey.trim() : 'NO_ROLE') + '|' + categoryKey;
                    if (!categoryDateHoursMap.containsKey(combinedKey)) {
                        categoryDateHoursMap.put(combinedKey, new Map<Date, Decimal>());
                    }
                    Map<Date, Decimal> dateMap = categoryDateHoursMap.get(combinedKey);
                    Decimal existing = dateMap.containsKey(shift.Date__c) ? dateMap.get(shift.Date__c) : 0;
                    dateMap.put(shift.Date__c, existing + duration);
                }
                
                if (shift.Long_Afternoon_Shift_Duartion__c != null && 
                    shift.Long_Afternoon_Shift_Duartion__c > 0 &&
                    shift.Long_Afternoon_Hourly_Rate__c != null && 
                    shift.Long_Afternoon_Hourly_Rate__c > 0) {
                    isCustomShift = true;
                    customTypeValue = 'Afternoon Rate 1';
                    roleKey = shift.Role_formula__c;
                    categoryKey = 'Custom_Afternoon_1';
                    duration = shift.Long_Afternoon_Shift_Duartion__c != null ? shift.Long_Afternoon_Shift_Duartion__c : 0;
                    
                    String combinedKey = (String.isNotBlank(roleKey) ? roleKey.trim() : 'NO_ROLE') + '|' + categoryKey;
                    if (!categoryDateHoursMap.containsKey(combinedKey)) {
                        categoryDateHoursMap.put(combinedKey, new Map<Date, Decimal>());
                    }
                    Map<Date, Decimal> dateMap = categoryDateHoursMap.get(combinedKey);
                    Decimal existing = dateMap.containsKey(shift.Date__c) ? dateMap.get(shift.Date__c) : 0;
                    dateMap.put(shift.Date__c, existing + duration);
                }
                
                if (shift.Long_Afternoon_Duration_Two__c != null && 
                    shift.Long_Afternoon_Duration_Two__c > 0 &&
                    shift.Long_Afternoon_Rate_Two__c != null && 
                    shift.Long_Afternoon_Rate_Two__c > 0) {
                    isCustomShift = true;
                    customTypeValue = 'Afternoon Rate 2';
                    roleKey = shift.Role_formula__c;
                    categoryKey = 'Custom_Afternoon_2';
                    duration = shift.Long_Afternoon_Duration_Two__c != null ? shift.Long_Afternoon_Duration_Two__c : 0;
                    
                    String combinedKey = (String.isNotBlank(roleKey) ? roleKey.trim() : 'NO_ROLE') + '|' + categoryKey;
                    if (!categoryDateHoursMap.containsKey(combinedKey)) {
                        categoryDateHoursMap.put(combinedKey, new Map<Date, Decimal>());
                    }
                    Map<Date, Decimal> dateMap = categoryDateHoursMap.get(combinedKey);
                    Decimal existing = dateMap.containsKey(shift.Date__c) ? dateMap.get(shift.Date__c) : 0;
                    dateMap.put(shift.Date__c, existing + duration);
                }
                
                if (shift.Long_Night_Shift_Duartion__c != null && 
                    shift.Long_Night_Shift_Duartion__c > 0 &&
                    shift.Long_Night_Hourly_Rate__c != null && 
                    shift.Long_Night_Hourly_Rate__c > 0) {
                    isCustomShift = true;
                    customTypeValue = 'Night Rate 1';
                    roleKey = shift.Role_formula__c;
                    categoryKey = 'Custom_Night_1';
                    duration = shift.Long_Night_Shift_Duartion__c != null ? shift.Long_Night_Shift_Duartion__c : 0;
                    
                    String combinedKey = (String.isNotBlank(roleKey) ? roleKey.trim() : 'NO_ROLE') + '|' + categoryKey;
                    if (!categoryDateHoursMap.containsKey(combinedKey)) {
                        categoryDateHoursMap.put(combinedKey, new Map<Date, Decimal>());
                    }
                    Map<Date, Decimal> dateMap = categoryDateHoursMap.get(combinedKey);
                    Decimal existing = dateMap.containsKey(shift.Date__c) ? dateMap.get(shift.Date__c) : 0;
                    dateMap.put(shift.Date__c, existing + duration);
                }
                
                if (shift.Long_Sleepover_Allowance__c != null && 
                    shift.Long_Sleepover_Allowance__c > 0) {
                    isCustomShift = true;
                    customTypeValue = 'Sleepover Rate 1';
                    roleKey = shift.Role_formula__c;
                    categoryKey = 'Custom_Sleepover_1';
                    duration = 1;
                    
                    String combinedKey = (String.isNotBlank(roleKey) ? roleKey.trim() : 'NO_ROLE') + '|' + categoryKey;
                    if (!categoryDateHoursMap.containsKey(combinedKey)) {
                        categoryDateHoursMap.put(combinedKey, new Map<Date, Decimal>());
                    }
                    Map<Date, Decimal> dateMap = categoryDateHoursMap.get(combinedKey);
                    Decimal existing = dateMap.containsKey(shift.Date__c) ? dateMap.get(shift.Date__c) : 0;
                    dateMap.put(shift.Date__c, existing + duration);
                }
                
                if (isCustomShift) {
                    continue;
                }
            }
            else {
                if (String.isBlank(shift.Shift_Category__c)) {
                    continue;
                }

                if (shift.Public_holiday__c == true) {
                    categoryKey = 'Public Holiday';
                } else if (shift.Shift_Day_Name__c != null && 
                            (shift.Shift_Day_Name__c.equalsIgnoreCase('Saturday') || 
                            shift.Shift_Day_Name__c.equalsIgnoreCase('Sunday'))) {
                    String dayName = shift.Shift_Day_Name__c;
                    String shiftCategory = shift.Shift_Category__c != null ? shift.Shift_Category__c.trim() : 'General';
                    categoryKey = dayName + '_' + shiftCategory;
                } else {
                    categoryKey = shift.Shift_Category__c.trim();
                }
                
                roleKey = shift.Role_formula__c;

                // ============================================================
                // ✅ FIXED: SUBTRACT OT HOURS FROM REGULAR DURATION
                //    (applies to ALL days — weekdays, weekends, public holidays)
                // ============================================================
                // ✅ Regular hours = Actual_Duration__c (OT is ADDITIVE)
                duration = shift.Actual_Duration__c != null ? shift.Actual_Duration__c : 0;

                if (shift.Date__c == null || duration == null || duration == 0) {
                    continue;
                }

                String combinedKey = (String.isNotBlank(roleKey) ? roleKey.trim() : 'NO_ROLE') + '|' + categoryKey;

                if (!categoryDateHoursMap.containsKey(combinedKey)) {
                    categoryDateHoursMap.put(combinedKey, new Map<Date, Decimal>());
                }

                Map<Date, Decimal> dateMap = categoryDateHoursMap.get(combinedKey);
                Decimal existing = dateMap.containsKey(shift.Date__c) ? dateMap.get(shift.Date__c) : 0;
                dateMap.put(shift.Date__c, existing + duration);
            }
        }

        if (categoryDateHoursMap.isEmpty()) {
            String errorMsg = 'No valid shifts found for ' + staff.Display_Nickname__c;
            throw new AuraHandledException(errorMsg);
        }

        // ============================================================
        // TIMESHEET LINES — STRICT CATEGORY-SCOPED MATCHING
        // ============================================================
        List<Object> timesheetLines = new List<Object>();
        List<String> failedTimesheetCategories = new List<String>();
        Map<String, String> failedTimesheetDetails = new Map<String, String>();

        for (String combinedKey : categoryDateHoursMap.keySet()) {
            String role = null;
            String category = null;
            String subCategory = null;
            Boolean isCustomShift = false;
            String customTypeValue = null;
            
            if (combinedKey.contains('|')) {
                List<String> parts = combinedKey.split('\\|');
                if (parts.size() >= 2) {
                    role = parts[0];
                    category = parts[1];
                }
                if (parts.size() >= 3) {
                    subCategory = parts[2];
                }
            }
            
            if (String.isBlank(category)) continue;
            
            if (category.contains('OverTime_Tier2_')) {
                isCustomShift = true;
                customTypeValue = 'OverTime Rate 2';
            }
            else if (category.contains('OverTime_')) {
                isCustomShift = true;
                customTypeValue = 'OverTime Rate 1';
            }
            else if (category.contains('Broken')) {
                isCustomShift = false;
                customTypeValue = null;
            }
            else if (category.contains('Custom_Morning_1')) {
                isCustomShift = true;
                customTypeValue = 'Morning Rate 1';
            } else if (category.contains('Custom_Morning_2')) {
                isCustomShift = true;
                customTypeValue = 'Morning Rate 2';
            } else if (category.contains('Custom_Afternoon_1')) {
                isCustomShift = true;
                customTypeValue = 'Afternoon Rate 1';
            } else if (category.contains('Custom_Afternoon_2')) {
                isCustomShift = true;
                customTypeValue = 'Afternoon Rate 2';
            } else if (category.contains('Custom_Night_1')) {
                isCustomShift = true;
                customTypeValue = 'Night Rate 1';
            } else if (category.contains('Custom_Sleepover_1')) {
                isCustomShift = true;
                customTypeValue = 'Sleepover Rate 1';
            }
            
            String dayName = combinedKeyDayNameMap.get(combinedKey);
            String categoryFacilityId = combinedKeyFacilityMap.get(combinedKey);
            if (String.isBlank(categoryFacilityId)) {
                categoryFacilityId = shiftFacilityId;
            }
            
            String categoryRole = role;
            
            String earningRateId = null;
            
            // ============================================================
            // ✅ OVERTIME TIER 1 — STRICT CATEGORY-SCOPED ONLY
            // ============================================================
            if (isCustomShift && customTypeValue == 'OverTime Rate 1') {
                String baseCategory = category.contains('_')
                    ? category.substring(category.indexOf('_') + 1)
                    : 'General';

                String expectedKey = 'overtime rate 1|' + baseCategory.toLowerCase().trim();

                earningRateId = findCustomRateForShift('OverTime Rate 1', baseCategory, categoryRole, facilityRoleRateMap);

                if (String.isBlank(earningRateId) && facilityRoleRateMap.containsKey(categoryFacilityId)) {
                    Map<String, Map<String, String>> roleMap = facilityRoleRateMap.get(categoryFacilityId);
                    if (roleMap.containsKey(categoryRole)) {
                        Map<String, String> rateMap = roleMap.get(categoryRole);
                        if (rateMap.containsKey(expectedKey)) {
                            earningRateId = rateMap.get(expectedKey);
                            System.debug('   ✅ OT Tier 1 via exact scoped key: ' + earningRateId + ' (key: ' + expectedKey + ')');
                        }
                    }
                }

                if (String.isNotBlank(earningRateId)) {
                    String validatedRateId = validateAndGetActiveRate(earningRateId, xeroEmployeeId, ctx);
                    if (String.isNotBlank(validatedRateId)) {
                        earningRateId = validatedRateId;
                    } else {
                        earningRateId = null;
                    }
                }

                if (String.isBlank(earningRateId)) {
                    if (!failedTimesheetCategories.contains(category)) {
                        failedTimesheetCategories.add(category);
                        failedTimesheetDetails.put(category,
                            '❌ No Xero Setting found for OverTime Rate 1 with Role "' + categoryRole + '".\n\n' +
                            'Looked for key: "' + expectedKey + '"\n' +
                            'In facility: ' + categoryFacilityId + '\n\n' +
                            'Required record on Facility_Xero_Setting__c:\n' +
                            '  • Shift_Type__c      = "OverTime"\n' +
                            '  • OverTime_Type__c   = "OverTime Rate 1"\n' +
                            '  • Category__c        = "' + baseCategory + '"\n' +
                            '  • Xero_Payitem__c    = [Valid Xero Earning Rate ID]\n' +
                            '  • Facility_Role__r.Role_Name__c = "' + categoryRole + '"'
                        );
                    }
                    continue;
                }
            }
            // ============================================================
            // ✅ OVERTIME TIER 2 — STRICT CATEGORY-SCOPED ONLY
            // ============================================================
            else if (isCustomShift && customTypeValue == 'OverTime Rate 2') {
                String baseCategory = category.contains('_')
                    ? category.substring(category.lastIndexOf('_') + 1)
                    : 'General';

                String expectedKey = 'overtime rate 2|' + baseCategory.toLowerCase().trim();

                earningRateId = findCustomRateForShift('OverTime Rate 2', baseCategory, categoryRole, facilityRoleRateMap);

                if (String.isBlank(earningRateId) && facilityRoleRateMap.containsKey(categoryFacilityId)) {
                    Map<String, Map<String, String>> roleMap = facilityRoleRateMap.get(categoryFacilityId);
                    if (roleMap.containsKey(categoryRole)) {
                        Map<String, String> rateMap = roleMap.get(categoryRole);
                        if (rateMap.containsKey(expectedKey)) {
                            earningRateId = rateMap.get(expectedKey);
                            System.debug('   ✅ OT Tier 2 via exact scoped key: ' + earningRateId + ' (key: ' + expectedKey + ')');
                        }
                    }
                }

                if (String.isNotBlank(earningRateId)) {
                    String validatedRateId = validateAndGetActiveRate(earningRateId, xeroEmployeeId, ctx);
                    if (String.isNotBlank(validatedRateId)) {
                        earningRateId = validatedRateId;
                    } else {
                        earningRateId = null;
                    }
                }

                if (String.isBlank(earningRateId)) {
                    if (!failedTimesheetCategories.contains(category)) {
                        failedTimesheetCategories.add(category);
                        failedTimesheetDetails.put(category,
                            '❌ No Xero Setting found for OverTime Rate 2 with Role "' + categoryRole + '".\n\n' +
                            'Looked for key: "' + expectedKey + '"\n' +
                            'In facility: ' + categoryFacilityId + '\n\n' +
                            'Required record on Facility_Xero_Setting__c:\n' +
                            '  • Shift_Type__c      = "OverTime"\n' +
                            '  • OverTime_Type__c   = "OverTime Rate 2"\n' +
                            '  • Category__c        = "' + baseCategory + '"\n' +
                            '  • Xero_Payitem__c    = [Valid Xero Earning Rate ID]\n' +
                            '  • Facility_Role__r.Role_Name__c = "' + categoryRole + '"'
                        );
                    }
                    continue;
                }
            }
            // ============================================================
            // ✅ FIXED: BROKEN SHIFT — use namespaced keys
            // ============================================================
            else if (category.contains('Broken')) {
                Boolean isAllowance = subCategory != null && subCategory.contains('Allowance');
                String searchCategory = isAllowance ? 'broken|allowance' : 'broken|fixed rate';

                earningRateId = findExactRateForShift(
                    searchCategory,
                    dayName != null ? dayName : 'Monday',
                    categoryFacilityId,
                    categoryRole,
                    facilityRateMap,
                    facilityRoleRateMap
                );

                // Fallback: plain 'broken'
                if (String.isBlank(earningRateId)) {
                    earningRateId = findExactRateForShift(
                        'broken',
                        dayName != null ? dayName : 'Monday',
                        categoryFacilityId,
                        categoryRole,
                        facilityRateMap,
                        facilityRoleRateMap
                    );
                }

                if (String.isNotBlank(earningRateId)) {
                    String validatedRateId = validateAndGetActiveRate(earningRateId, xeroEmployeeId, ctx);
                    if (String.isNotBlank(validatedRateId)) {
                        earningRateId = validatedRateId;
                    } else {
                        earningRateId = null;
                    }
                }

                if (String.isBlank(earningRateId)) {
                    if (!failedTimesheetCategories.contains(category)) {
                        failedTimesheetCategories.add(category);
                        failedTimesheetDetails.put(category,
                            '❌ No Xero Setting found for Broken shifts with Role "' + categoryRole + '".\n\n' +
                            'Required record:\n' +
                            '  • Broken_Type__c = "' + (isAllowance ? 'Allowance' : 'Fixed Rate') + '"\n' +
                            '  • Pay Item = [Valid Xero Earning Rate ID]\n' +
                            '  • Role Name = "' + categoryRole + '" (CASE-SENSITIVE)'
                        );
                    }
                    continue;
                }
            }
            // CUSTOM SHIFT
            else if (isCustomShift && String.isNotBlank(customTypeValue)) {
                earningRateId = findCustomRateForShift(customTypeValue, categoryRole, facilityRoleRateMap);
                
                if (String.isNotBlank(earningRateId)) {
                    String validatedRateId = validateAndGetActiveRate(earningRateId, xeroEmployeeId, ctx);
                    if (String.isNotBlank(validatedRateId)) {
                        earningRateId = validatedRateId;
                    } else {
                        earningRateId = null;
                    }
                }
                
                if (String.isBlank(earningRateId)) {
                    if (!failedTimesheetCategories.contains(category)) {
                        failedTimesheetCategories.add(category);
                        failedTimesheetDetails.put(category, 
                            '❌ No Xero Setting found for Custom shift type "' + customTypeValue + '" with Role "' + categoryRole + '".'
                        );
                    }
                    continue;
                }
            }
            // SLEEPOVER SHIFT
            else if (category.contains('Sleepover')) {
                Boolean isFixedRate = (subCategory != null && subCategory.contains('FixedRate'));
                String searchCategory = isFixedRate ? 'sleepover|fixed rate' : 'sleepover|allowance';
                
                earningRateId = findExactRateForShift(
                    searchCategory,
                    dayName != null ? dayName : 'Monday',
                    categoryFacilityId,
                    categoryRole,
                    facilityRateMap,
                    facilityRoleRateMap
                );
                
                if (String.isNotBlank(earningRateId)) {
                    String validatedRateId = validateAndGetActiveRate(earningRateId, xeroEmployeeId, ctx);
                    if (String.isNotBlank(validatedRateId)) {
                        earningRateId = validatedRateId;
                    } else {
                        earningRateId = null;
                    }
                }
                
                if (String.isBlank(earningRateId)) {
                    if (!failedTimesheetCategories.contains(category)) {
                        failedTimesheetCategories.add(category);
                        failedTimesheetDetails.put(category, 
                            '❌ No Facility Xero Setting found for Sleepover (' + (isFixedRate ? 'Fixed Rate' : 'Allowance') + ') with Role "' + categoryRole + '".'
                        );
                    }
                    continue;
                }
            }
            // REGULAR SHIFT — WEEKDAY / WEEKEND / OTHER
            else if (String.isNotBlank(dayName)) {
                String dayNameLower = dayName.toLowerCase().trim();
                
                Boolean isWeekday = dayNameLower.equals('monday') || dayNameLower.equals('tuesday') || 
                                    dayNameLower.equals('wednesday') || dayNameLower.equals('thursday') || 
                                    dayNameLower.equals('friday');
                
                Boolean isWeekend = dayNameLower.equals('saturday') || dayNameLower.equals('sunday');
                
                if (isWeekday) {
                    String searchCategory = category.toLowerCase().trim();
                    
                    Set<String> allowedWeekdayCategories = new Set<String>{
                        'general', 'morning', 'afternoon', 'night'
                    };
                    
                    if (searchCategory.contains('_')) {
                        String[] parts = searchCategory.split('_');
                        if (parts.size() >= 2) {
                            searchCategory = parts[0];
                        }
                    }
                    
                    if (!allowedWeekdayCategories.contains(searchCategory) && !searchCategory.equals('weekday')) {
                        failedTimesheetDetails.put(category, 'Category "' + category + '" is not valid for weekdays.');
                        failedTimesheetCategories.add(category);
                        continue;
                    }
                    
                    earningRateId = findExactRateForShift(
                        searchCategory,
                        dayName,
                        categoryFacilityId,
                        categoryRole,
                        facilityRateMap,
                        facilityRoleRateMap
                    );
                    
                    if (String.isNotBlank(earningRateId)) {
                        String validatedRateId = validateAndGetActiveRate(earningRateId, xeroEmployeeId, ctx);
                        if (String.isNotBlank(validatedRateId)) {
                            earningRateId = validatedRateId;
                        } else {
                            failedTimesheetDetails.put(category, 'The earning rate for "' + category + '" on ' + dayName + ' is INACTIVE in Xero.');
                            earningRateId = null;
                        }
                    } else {
                        failedTimesheetDetails.put(category, 
                            'No Xero Setting found for "' + category + '" on ' + dayName + 
                            ' with Role "' + categoryRole + '". Please create a Xero Setting with Category = "' + category + 
                            '" and Pay Item = [Valid Rate ID].');
                    }
                }
                else if (isWeekend) {
                    earningRateId = findExactRateForShift(
                        category,
                        dayName,
                        categoryFacilityId,
                        categoryRole,
                        facilityRateMap,
                        facilityRoleRateMap
                    );
                    
                    if (String.isNotBlank(earningRateId)) {
                        String validatedRateId = validateAndGetActiveRate(earningRateId, xeroEmployeeId, ctx);
                        if (String.isNotBlank(validatedRateId)) {
                            earningRateId = validatedRateId;
                        } else {
                            failedTimesheetDetails.put(category, 'The earning rate for "' + category + '" on ' + dayName + ' is INACTIVE in Xero.');
                            earningRateId = null;
                        }
                    } else {
                        failedTimesheetDetails.put(category, 
                            'No Xero Setting found for "' + category + ' with Role "' + categoryRole + '".');
                    }
                }
                else {
                    earningRateId = findExactRateForShift(
                        category.toLowerCase().trim(),
                        dayName,
                        categoryFacilityId,
                        categoryRole,
                        facilityRateMap,
                        facilityRoleRateMap
                    );
                    
                    if (String.isNotBlank(earningRateId)) {
                        String validatedRateId = validateAndGetActiveRate(earningRateId, xeroEmployeeId, ctx);
                        if (String.isNotBlank(validatedRateId)) {
                            earningRateId = validatedRateId;
                        } else {
                            earningRateId = null;
                        }
                    }
                }
            } else {
                earningRateId = findExactRateForShift(
                    category.toLowerCase().trim(),
                    'weekday',
                    categoryFacilityId,
                    categoryRole,
                    facilityRateMap,
                    facilityRoleRateMap
                );
            }
            
            if (String.isBlank(earningRateId)) {
                if (!failedTimesheetCategories.contains(category)) {
                    failedTimesheetCategories.add(category);
                }
                continue;
            }

            Map<Date, Decimal> dateMap = categoryDateHoursMap.get(combinedKey);
            if (dateMap == null) {
                failedTimesheetCategories.add(category);
                continue;
            }

            List<Decimal> units = new List<Decimal>();
            for (Date d = ctx.startDate; d <= ctx.endDate; d = d.addDays(1)) {
                Decimal hrs = dateMap.containsKey(d) ? dateMap.get(d).setScale(2) : 0;
                units.add(hrs);
            }
            
            Decimal totalUnits = 0;
            for (Decimal u : units) {
                totalUnits += u;
            }
            
            if (totalUnits == 0) {
                continue;
            }

            Decimal rateValue = 0;
            
            if (category.contains('OverTime_') || category.contains('OverTime_Tier2_')) {
                rateValue = combinedKeyRates.get(combinedKey);
                if (rateValue == null) rateValue = 0;
            } else if (category.contains('Broken')) {
                rateValue = combinedKeyRates.get(combinedKey);
                if (rateValue == null) rateValue = 0;
            } else if (isCustomShift && String.isNotBlank(customTypeValue)) {
                for (ShiftwithStaff__c s : shifts) {
                    if (s.Shift_Category__c != null && s.Shift_Category__c.equalsIgnoreCase('Custom')) {
                        if (customTypeValue.equals('Morning Rate 1') &&
                            s.Long_Morning_Shift_Duartion__c != null && 
                            s.Long_Morning_Shift_Duartion__c > 0 &&
                            s.Long_Morning_Hourly_Rate__c != null && 
                            s.Long_Morning_Hourly_Rate__c > 0) {
                            rateValue = s.Long_Morning_Hourly_Rate__c != null ? s.Long_Morning_Hourly_Rate__c : 0;
                            break;
                        } else if (customTypeValue.equals('Morning Rate 2') &&
                                s.Long_Morning_Duartion_Two__c != null && 
                                s.Long_Morning_Duartion_Two__c > 0 &&
                                s.Long_Morning_Rate_Two__c != null && 
                                s.Long_Morning_Rate_Two__c > 0) {
                            rateValue = s.Long_Morning_Rate_Two__c != null ? s.Long_Morning_Rate_Two__c : 0;
                            break;
                        } else if (customTypeValue.equals('Afternoon Rate 1') &&
                                s.Long_Afternoon_Shift_Duartion__c != null && 
                                s.Long_Afternoon_Shift_Duartion__c > 0 &&
                                s.Long_Afternoon_Hourly_Rate__c != null && 
                                s.Long_Afternoon_Hourly_Rate__c > 0) {
                            rateValue = s.Long_Afternoon_Hourly_Rate__c != null ? s.Long_Afternoon_Hourly_Rate__c : 0;
                            break;
                        } else if (customTypeValue.equals('Afternoon Rate 2') &&
                                s.Long_Afternoon_Duration_Two__c != null && 
                                s.Long_Afternoon_Duration_Two__c > 0 &&
                                s.Long_Afternoon_Rate_Two__c != null && 
                                s.Long_Afternoon_Rate_Two__c > 0) {
                            rateValue = s.Long_Afternoon_Rate_Two__c != null ? s.Long_Afternoon_Rate_Two__c : 0;
                            break;
                        } else if (customTypeValue.equals('Night Rate 1') &&
                                s.Long_Night_Shift_Duartion__c != null && 
                                s.Long_Night_Shift_Duartion__c > 0 &&
                                s.Long_Night_Hourly_Rate__c != null && 
                                s.Long_Night_Hourly_Rate__c > 0) {
                            rateValue = s.Long_Night_Hourly_Rate__c != null ? s.Long_Night_Hourly_Rate__c : 0;
                            break;
                        } else if (customTypeValue.equals('Sleepover Rate 1') &&
                                s.Long_Sleepover_Allowance__c != null && 
                                s.Long_Sleepover_Allowance__c > 0) {
                            rateValue = s.Long_Sleepover_Allowance__c != null ? s.Long_Sleepover_Allowance__c : 0;
                            break;
                        }
                    }
                }
            } else if (category.contains('Sleepover')) {
                Boolean isFixedRate = (subCategory != null && subCategory.contains('FixedRate'));
                if (isFixedRate) {
                    for (ShiftwithStaff__c s : shifts) {
                        if (s.Type_of_shift__c == 'Sleepover Shift') {
                            rateValue = s.Sleepover_Night_Shift_Hourly_Rate__c != null ? s.Sleepover_Night_Shift_Hourly_Rate__c : 0;
                            break;
                        }
                    }
                } else {
                    for (ShiftwithStaff__c s : shifts) {
                        if (s.Type_of_shift__c == 'Sleepover Shift') {
                            rateValue = s.Staff_Final_Hourly_Rate__c != null ? s.Staff_Final_Hourly_Rate__c : 0;
                            break;
                        }
                    }
                }
            } else {
                rateValue = combinedKeyRates.get(combinedKey);
                if (rateValue == null) rateValue = 0;
            }

            Map<String, Object> timesheetLine = new Map<String, Object>{
                'EarningsRateID' => earningRateId,
                'NumberOfUnits' => units,
                'RatePerUnit' => rateValue
            };

            if (!String.isBlank(ctx.trackingItemId)) {
                timesheetLine.put('TrackingItemID', ctx.trackingItemId);
            }

            timesheetLines.add(timesheetLine);
            
            System.debug('✅ Added timesheet line for category: ' + category + 
                        ' | Role: "' + categoryRole + '"' +
                        ' | Rate: ' + rateValue + 
                        ' | Earning Rate ID: ' + earningRateId + 
                        ' | Total Units: ' + totalUnits);
        }

        if (!failedTimesheetCategories.isEmpty()) {
            String errorDetails = '';
            Set<String> uniqueErrors = new Set<String>();
            
            for (String category : failedTimesheetCategories) {
                String detail = failedTimesheetDetails.get(category);
                if (String.isNotBlank(detail)) {
                    if (!uniqueErrors.contains(detail)) {
                        uniqueErrors.add(detail);
                        errorDetails += '\n• ' + detail;
                    }
                } else {
                    errorDetails += '\n• Category "' + category + '" has NO earning rate configured.';
                }
            }
            
            String errorMessage = '❌ Cannot send timesheet to Xero: Missing earning rates for timesheet lines.\n' + errorDetails;
            
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

        if (timesheetLines.isEmpty()) {
            String errorMsg = 'No valid timesheet lines found for ' + staff.Display_Nickname__c;
            throw new AuraHandledException(errorMsg);
        }

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

            return dt.date();

        } catch (Exception e) {
            System.debug('❌ parseXeroDate Error: ' + e.getMessage());
            System.debug('❌ Raw date: ' + rawDate);
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
                trackingItemId = 'dummy_tracking_item_id';
            } else {
                accessToken = XeroIntegrationController.getAccessTokenFromXero();
                tenantId = XeroIntegrationController.getTenantId(accessToken);
                
                ProcessingContext tempCtx = new ProcessingContext();
                tempCtx.accessToken = accessToken;
                tempCtx.tenantId = tenantId;
                trackingItemId = fetchTrackingItemIdFromXero(tempCtx);
                
                System.debug('🏷️ Tracking Item ID: ' + trackingItemId);
            }

            System.debug('🔹 Access Token Present: ' + !String.isBlank(accessToken));
            System.debug('🔹 Tenant ID: ' + tenantId);

            if (String.isBlank(accessToken) || String.isBlank(tenantId)) {
                System.debug('❌ Missing Xero credentials');
                StaffProcessingResult failed = new StaffProcessingResult(
                    null, null, false, 'Missing Xero Access Token or Tenant ID.'
                );
                failed.showInPopup = true;
                finalResults.add(failed);
                return finalResults;
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
            
            for (Facility_Role__c role : facilityRoles) {
                if (role.Facility_Xero_Setting__r != null) {
                    String rateId = role.Facility_Xero_Setting__r.Xero_Payitem__c;
                    if (String.isNotBlank(rateId)) {
                        if (!String.isBlank(role.Facility_Xero_Setting__r.Category__c)) {
                            String categoryKey = role.Facility_Xero_Setting__r.Category__c.trim().toLowerCase();
                            earningRateMap.put(categoryKey, rateId);
                            System.debug('   ✅ Mapped Category: "' + role.Facility_Xero_Setting__r.Category__c + '" → ' + rateId);
                        }
                        if (!String.isBlank(role.Facility_Xero_Setting__r.Shift_Type__c)) {
                            String shiftKey = role.Facility_Xero_Setting__r.Shift_Type__c.trim().toLowerCase();
                            earningRateMap.put(shiftKey, rateId);
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
                    processSingleStaffForBulk(staff, ctx);

                    System.debug('📦 Employee Payload Count: ' + ctx.employeePayloads.size());
                    System.debug('📦 Timesheet Payload Count: ' + ctx.timesheetPayloads.size());

                    if (!ctx.employeePayloads.isEmpty()) {
                        System.debug('🚀 Sending Employee Pay Templates...');
                        sendBulkEmployeePayTemplates(ctx);
                    }

                    if (!ctx.timesheetPayloads.isEmpty()) {
                        System.debug('🚀 Sending Timesheets...');
                        sendBulkTimesheets(ctx);
                    }

                    System.debug('✅ Staff Results Count: ' + ctx.results.size());
                    finalResults.addAll(ctx.results);

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
                    Database.update(staffToUpdateList, false);
                    System.debug('✅ Staff records updated successfully');
                } catch (Exception updateEx) {
                    System.debug('❌ Failed to update staff records: ' + updateEx.getMessage());
                }
            }

            System.debug('✅ Final Results Count: ' + finalResults.size());
            System.debug('🚀 ===== END sendSelectedPayPeriodTimesheets =====');

            return finalResults;

        } catch (Exception e) {

            String exactError = e.getTypeName() + ' | ' + e.getMessage() + ' | Line: ' + e.getLineNumber();
            System.debug('💥 FATAL ERROR in sendSelectedPayPeriodTimesheets: ' + exactError);

            StaffProcessingResult failed = new StaffProcessingResult(null, null, false, exactError);
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

            if (!activeOptionsList.isEmpty()) {
                System.debug('⚠️ Active options found but not returned (should not happen):');
                for (Map<String, String> active : activeOptionsList) {
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
            
            if (String.isBlank(startDateStr) || String.isBlank(endDateStr)) {
                result.put('success', false);
                result.put('message', 'Start date or end date is missing');
                return result;
            }
            
            Date startDate = Date.valueOf(startDateStr);
            Date endDate = Date.valueOf(endDateStr);
            
            if (startDate > endDate) {
                result.put('success', false);
                result.put('message', 'Start date cannot be after end date');
                return result;
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
            
            if (String.isBlank(accessToken)) {
                result.put('success', false);
                result.put('message', 'Failed to get Xero access token. Please check your Xero connection.');
                return result;
            }
            
            try {
                tenantId = XeroIntegrationController.getTenantId(accessToken);
                System.debug('✅ Tenant ID obtained: ' + (String.isNotBlank(tenantId) ? 'Yes' : 'No'));
            } catch (Exception e) {
                System.debug('❌ Error getting tenant ID: ' + e.getMessage());
                result.put('success', false);
                result.put('message', 'Failed to get Xero tenant ID: ' + e.getMessage());
                return result;
            }
            
            if (String.isBlank(tenantId)) {
                result.put('success', false);
                result.put('message', 'Failed to get Xero tenant ID. Please check your Xero connection.');
                return result;
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
                        staffResult.put('isValid', false);
                        staffResult.put('payPeriodMismatch', false);
                        staffResult.put('showInPopup', true);
                        staffResult.put('message', '❌ ' + staff.Display_Nickname__c + 
                            ' is not synced with Xero. Please sync this staff member with Xero before sending timesheets.');
                        allValid = false;
                        validationResults.add(staffResult);
                        continue;
                    }
                    
                    Map<String, Object> xeroCycle = null;
                    try {
                        xeroCycle = getXeroPayrollCycleForStaff(
                            staff.Xero_Employee_ID__c,
                            staff.Id,
                            accessToken,
                            tenantId,
                            startDate
                        );
                    } catch (Exception e) {
                        System.debug('❌ Error getting pay cycle for ' + staff.Display_Nickname__c + ': ' + e.getMessage());
                        staffResult.put('isValid', false);
                        staffResult.put('payPeriodMismatch', false);
                        staffResult.put('showInPopup', true);
                        staffResult.put('message', '❌ Could not determine Xero pay cycle for ' + 
                            staff.Display_Nickname__c + ': ' + e.getMessage());
                        allValid = false;
                        validationResults.add(staffResult);
                        continue;
                    }
                    
                    if (xeroCycle == null) {
                        staffResult.put('isValid', false);
                        staffResult.put('payPeriodMismatch', false);
                        staffResult.put('showInPopup', true);
                        staffResult.put('message', '❌ Could not determine Xero pay cycle for ' + 
                            staff.Display_Nickname__c + '. Please check the employee\'s payroll calendar in Xero.');
                        allValid = false;
                        validationResults.add(staffResult);
                        continue;
                    }
                    
                    Date payPeriodStart = (Date) xeroCycle.get('payPeriodStart');
                    Date payPeriodEnd = (Date) xeroCycle.get('payPeriodEnd');
                    
                    if (payPeriodStart == null || payPeriodEnd == null) {
                        staffResult.put('isValid', false);
                        staffResult.put('payPeriodMismatch', false);
                        staffResult.put('showInPopup', true);
                        staffResult.put('message', '❌ Invalid pay period dates from Xero for ' + 
                            staff.Display_Nickname__c);
                        allValid = false;
                        validationResults.add(staffResult);
                        continue;
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
                        hasMismatch = true;
                    }
                    
                } catch (Exception e) {
                    System.debug('❌ Error validating staff ' + staffId + ': ' + e.getMessage());
                    System.debug('❌ Stack trace: ' + e.getStackTraceString());
                    staffResult.put('isValid', false);
                    staffResult.put('payPeriodMismatch', false);
                    staffResult.put('showInPopup', true);
                    staffResult.put('message', '❌ Error validating ' + staffResult.get('staffName') + 
                        ': ' + e.getMessage());
                    allValid = false;
                }
                
                validationResults.add(staffResult);
            }
            
            result.put('success', true);
            result.put('allValid', allValid);
            result.put('hasMismatch', hasMismatch);
            result.put('results', validationResults);
            result.put('selectedStartDate', startDate);
            result.put('selectedEndDate', endDate);
            
        } catch (Exception e) {
            System.debug('❌ FATAL Validation error: ' + e.getMessage());
            System.debug('❌ Stack trace: ' + e.getStackTraceString());
            result.put('success', false);
            result.put('message', 'Validation error: ' + e.getMessage());
            result.put('results', new List<Map<String, Object>>());
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
            
            if (String.isBlank(currentUser.Organization_Name__c)) {
                System.debug('⚠️ User has no Organisation Name');
                return settingsMap;
            }
            
            Organisation__c org = [
                SELECT Id, Name 
                FROM Organisation__c 
                WHERE Name = :currentUser.Organization_Name__c 
                LIMIT 1
            ];
            
            if (org == null) {
                System.debug('⚠️ Organisation not found: ' + currentUser.Organization_Name__c);
                return settingsMap;
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
                    OverTime_Type__c,
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
            
            for (Facility_Xero_Setting__c setting : settings) {
                Map<String, Object> settingData = new Map<String, Object>{
                    'Id' => setting.Id,
                    'Name' => setting.Name,
                    'Xero_Payitem__c' => setting.Xero_Payitem__c,
                    'Xero_Payitem_Name__c' => setting.Xero_Payitem_Name__c,
                    'Category__c' => setting.Category__c,
                    'Shift_Type__c' => setting.Shift_Type__c,
                    'Custom_Shift_Type__c' => setting.Custom_Shift_Type__c,
                    'Broken_Type__c' => setting.Broken_Type__c,
                    'Facility_Role__c' => setting.Facility_Role__c,
                    'Facility_Role_Name__c' => setting.Facility_Role__r?.Role_Name__c,
                    'Facility_Name__c' => setting.Facility_Role__r?.Facility__r?.Name,
                    'Facility_Id' => setting.Facility_Role__r.Facility__c,
                    'Sleepover_Type__c' => setting.Sleepover_Type__c,
                    'Custom_Rate_Type__c' => setting.Custom_Rate_Type__c,
                    'OverTime_Type__c' => setting.OverTime_Type__c
                };
                
                settingsMap.put(setting.Id, settingData);
                
                System.debug('✅ Found Setting: ' + setting.Name + 
                    ' | Rate ID: ' + setting.Xero_Payitem__c +
                    ' | Rate Name: ' + setting.Xero_Payitem_Name__c);
            }
            
            System.debug('✅ Total settings found: ' + settingsMap.size());
            
        } catch (Exception e) {
            System.debug('❌ Error getting organisation earning rate settings: ' + e.getMessage());
            System.debug('❌ Stack Trace: ' + e.getStackTraceString());
        }
        
        return settingsMap;
    }
}