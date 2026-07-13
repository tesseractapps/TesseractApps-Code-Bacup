public class XeroIntegrationTimeSheet { 

    @AuraEnabled
    public static void insertTimeSheet(String staffId, String startDateStr, String endDateStr) {
        System.debug('🚀 =========== START insertTimeSheet ===========');
        System.debug('🚀 Parameters => staffId=' + staffId + ', startDate=' + startDateStr + ', endDate=' + endDateStr);

        try {
            // 🔹 1. Get Staff details
            System.debug('🔹 STEP 1: Fetching Staff details...');
            Staff__c staff = [
                SELECT Id, NameToDisplay__c, Display_Nickname__c, 
                    Xero_Employee_ID__c, Ordinary_Earnings_Rate_ID__c
                FROM Staff__c
                WHERE Id = :staffId
                LIMIT 1
            ];
            System.debug('✅ Staff found: ' + staff.Display_Nickname__c + ' (ID: ' + staff.Id + ')');

            if (String.isBlank(staff.Xero_Employee_ID__c)) {
                System.debug('❌ ERROR: Missing Xero Employee ID for staff: ' + staff.Display_Nickname__c);
                throw new AuraHandledException('❌ Missing Xero Employee ID for ' + staff.Display_Nickname__c + '. Please sync this staff record with Xero.');
            }

            if (String.isBlank(staff.Ordinary_Earnings_Rate_ID__c)) {
                System.debug('❌ ERROR: Missing Ordinary Earnings Rate ID for staff: ' + staff.Display_Nickname__c);
                throw new AuraHandledException('❌ Missing Ordinary Earnings Rate ID for ' + staff.Display_Nickname__c + '. Please set it in Staff record.');
            }

            String xeroEmployeeId = staff.Xero_Employee_ID__c;
            String ordinaryEarningsRateId = staff.Ordinary_Earnings_Rate_ID__c;
            System.debug('✅ Staff Xero Employee ID => ' + xeroEmployeeId);
            System.debug('✅ Staff Ordinary Earnings Rate ID => ' + ordinaryEarningsRateId);

            // 🔹 2. Get Xero connection info
            System.debug('🔹 STEP 2: Getting Xero connection info...');
            String accessToken = '';
            if (Test.isRunningTest()) {
                accessToken = 'dummy_access_id';
                System.debug('🔹 TEST MODE: Using dummy access token');
            } else {
                accessToken = XeroIntegrationController.getAccessTokenFromXero();
                System.debug('✅ Access token obtained: ' + (String.isBlank(accessToken) ? 'EMPTY' : 'PRESENT'));
            }
            
            String tenantId = '';
            if (Test.isRunningTest()) {
                tenantId = 'dummy_tenant_id';
                System.debug('🔹 TEST MODE: Using dummy tenant ID');
            } else {
                tenantId = XeroIntegrationController.getTenantId(accessToken);
                System.debug('✅ Tenant ID obtained: ' + (String.isBlank(tenantId) ? 'EMPTY' : tenantId));
            }

            if (String.isBlank(accessToken) || String.isBlank(tenantId)) {
                System.debug('❌ ERROR: Missing Xero credentials - AccessToken: ' + (String.isBlank(accessToken) ? 'EMPTY' : 'PRESENT') + 
                        ', TenantID: ' + (String.isBlank(tenantId) ? 'EMPTY' : 'PRESENT'));
                throw new AuraHandledException('❌ Missing Xero Access Token or Tenant ID.');
            }

            // 🔹 3. Convert dates
            System.debug('🔹 STEP 3: Converting dates...');
            Date startDate = Date.valueOf(startDateStr);
            Date endDate = Date.valueOf(endDateStr);
            System.debug('✅ Date conversion => Start: ' + startDate + ', End: ' + endDate);
            System.debug('✅ Date range covers ' + startDate.daysBetween(endDate) + ' days');

            // 🔹 4. Get user org info
            System.debug('🔹 STEP 4: Getting current user organization info...');
            User currentUser = [
                SELECT Organization_Name__c 
                FROM User 
                WHERE Id = :UserInfo.getUserId()
            ];
            System.debug('✅ Current user organization: ' + currentUser.Organization_Name__c);

            // 🔹 5. Get Organisation + Xero Earning Rates
            System.debug('🔹 STEP 5: Fetching organisation and Xero earning rates...');
            Organisation__c orgRecord = [
                SELECT Id, Name,
                    (SELECT Id, Name, Earning_Rate_ID__c FROM Xero_Earning_Rates__r)
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];
            System.debug('✅ Organisation found: ' + orgRecord.Name + ' (ID: ' + orgRecord.Id + ')');
            System.debug('✅ Number of Xero earning rates found: ' + orgRecord.Xero_Earning_Rates__r.size());

            // 🔹 Build map of earning rate names → IDs
            Map<String, String> categoryToEarningRateMap = new Map<String, String>();
            for (Xero_Earning_Rate__c rate : orgRecord.Xero_Earning_Rates__r) {
                if (!String.isBlank(rate.Name) && !String.isBlank(rate.Earning_Rate_ID__c)) {
                    String key = rate.Name.trim().toLowerCase();
                    categoryToEarningRateMap.put(key, rate.Earning_Rate_ID__c);
                    System.debug('📋 Earning Rate Mapping: "' + rate.Name + '" → ' + rate.Earning_Rate_ID__c);
                }
            }
            System.debug('✅ Total earning rate mappings: ' + categoryToEarningRateMap.size());

            // 🔹 6. Fetch approved shifts
            System.debug('🔹 STEP 6: Fetching approved shifts...');
            System.debug('📋 Query criteria: Staff=' + staffId + ', Date range=' + startDate + ' to ' + endDate);
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
                WHERE Staff__c = :staffId
                AND Date__c >= :startDate
                AND Date__c <= :endDate
                AND Approval_Status__c = 'Approved'
                AND (
                        Broken_Shift__c = false
                        OR
                        (Broken_Shift__c = true AND Broken_Extended_Duration__c != NULL)
                    )
                ORDER BY Date__c
            ];

            System.debug('✅ Total approved shifts found: ' + shifts.size());
            for (ShiftwithStaff__c shift : shifts) {
                System.debug('📅 Shift: ' + shift.Date__c + ' | Category: ' + shift.Shift_Category__c + ' | Custom Rate: ' + shift.Custom_Rate_Per_Hrs__c +  ' | Broken Shift Allowance : $' + shift.Broken_Shift_Allowance__c +
                        ' | Duration: ' + shift.Actual_Duration__c + ' | Rate: $' + shift.Staff_Hourly_Rate__c + ' | Broken Duration: ' + shift.Broken_Extended_Duration__c + ' | Broken Rate: $' + shift.Broken_Extended_Rate__c + ' | Broken Rate per Hrs: $' + shift.Broken_Rate_Per_Hrs__c);
            }

            if (shifts.isEmpty()) {
                System.debug('⚠️ WARNING: No approved shifts found for the date range');
                throw new AuraHandledException('⚠️ No approved shifts found for this date range.');
            }

            // 🔹 7. Map category → hourly rate (WITH SLEEPOVER HANDLING)
            System.debug('🔹 STEP 7: Processing shift categories and calculating rates...');
            Map<String, Decimal> categoryToHourlyRate = new Map<String, Decimal>();
            Map<String, List<Decimal>> sleepoverCategoryData = new Map<String, List<Decimal>>();
            
            System.debug('📊 First pass: Collecting shift data...');
            Decimal totalBrokenPay = 0;
            Decimal totalBrokenHours = 0;
            /* for (ShiftwithStaff__c shift : shifts) {

                if (String.isBlank(shift.Shift_Category__c)) {
                    System.debug('⚠️ Shift skipped: Missing category - ID=' + shift.Id);
                    continue;
                }

                String categoryKey = shift.Shift_Category__c.trim().toLowerCase();

                // --------------------------------------------------
                // Decide which rate should be used
                // --------------------------------------------------
                Decimal effectiveRate;

                if (categoryKey == 'custom') {
                    if (shift.Custom_Rate_Per_Hrs__c == null) {
                        System.debug('⚠️ Custom shift skipped: Custom_Rate_Per_Hrs__c is NULL - ID=' + shift.Id);
                        continue;
                    }

                    effectiveRate = shift.Custom_Rate_Per_Hrs__c;
                    System.debug('🟣 Using CUSTOM RATE for shift ' + shift.Id + ' → ' + effectiveRate);
                }
                else {
                    if (shift.Staff_Hourly_Rate__c == null) {
                        System.debug('⚠️ Shift skipped: Staff_Hourly_Rate__c is NULL - ID=' + shift.Id);
                        continue;
                    }

                    effectiveRate = shift.Staff_Hourly_Rate__c;
                    System.debug('🔵 Using NORMAL RATE for shift ' + shift.Id + ' → ' + effectiveRate);
                }

                // --------------------------------------------------
                // Sleepover Logic (Weighted Average)
                // --------------------------------------------------
                if (categoryKey.contains('sleepover')) {

                    if (!sleepoverCategoryData.containsKey(categoryKey)) {
                        sleepoverCategoryData.put(categoryKey, new List<Decimal>{0, 0, 0});
                    }

                    List<Decimal> data = sleepoverCategoryData.get(categoryKey);
                    Decimal duration = (shift.Actual_Duration__c != null) ? shift.Actual_Duration__c : 0;

                    data[0] = data[0] + effectiveRate; // ⭐ changed from Staff_Hourly_Rate__c
                    data[1] = data[1] + duration;
                    data[2] = data[2] + 1;

                    System.debug('📊 Updated sleepover data for ' + categoryKey +
                        ': Total Amount=$' + data[0] +
                        ', Total Hours=' + data[1] +
                        ', Shift Count=' + data[2]);
                }
                else {
                    // --------------------------------------------------
                    // Regular + Custom shifts go here
                    // --------------------------------------------------
                    Decimal hourlyRate = effectiveRate.setScale(2); // ⭐ changed
                    categoryToHourlyRate.put(categoryKey, hourlyRate);

                    System.debug('📋 Category: ' + categoryKey + ' → $' + hourlyRate);
                }
            } */
           String categoryName = 'Broken Shift';

            for (ShiftwithStaff__c shift : shifts) {

                // =====================================================
                // 🔴 1. HANDLE BROKEN SHIFTS FIRST
                // =====================================================
                if (shift.Broken_Shift__c) {

                    Decimal rate = shift.Broken_Rate_Per_Hrs__c != null
                        ? shift.Broken_Rate_Per_Hrs__c
                        : 0;

                    Decimal duration = shift.Broken_Total_Duration__c != null
                        ? shift.Broken_Total_Duration__c
                        : 0;

                    Decimal pay = rate * duration;

                    totalBrokenPay += pay;
                    totalBrokenHours += duration;

                    System.debug('🔴 Broken Shift ID: ' + shift.Id);
                    System.debug('   Broken Rate: ' + rate);
                    System.debug('   Broken Duration: ' + duration);
                    System.debug('   Broken Pay: ' + pay);

                    // ⭐ IMPORTANT: Use Broken Rate here
                    

                    continue; // Skip normal processing
                }

                // =====================================================
                // 🟢 2. NORMAL / CUSTOM SHIFT PROCESSING
                // =====================================================

                if (String.isBlank(shift.Shift_Category__c)) {
                    System.debug('⚠️ Shift skipped: Missing category - ID=' + shift.Id);
                    continue;
                }

                String categoryKey = shift.Shift_Category__c.trim().toLowerCase();

                // -----------------------------------------------------
                // Determine Effective Rate (Custom vs Normal)
                // -----------------------------------------------------
                Decimal effectiveRate;

                if (categoryKey == 'custom') {
                    if (shift.Custom_Rate_Per_Hrs__c == null) {
                        System.debug('⚠️ Custom shift skipped: No custom rate - ID=' + shift.Id);
                        continue;
                    }
                    effectiveRate = shift.Custom_Rate_Per_Hrs__c;
                    System.debug('🟣 Custom Shift Rate: ' + effectiveRate);
                }
                else {
                    if (shift.Staff_Hourly_Rate__c == null) {
                        System.debug('⚠️ Normal shift skipped: No hourly rate - ID=' + shift.Id);
                        continue;
                    }
                    effectiveRate = shift.Staff_Hourly_Rate__c;
                    System.debug('🔵 Normal Shift Rate: ' + effectiveRate);
                }

                // -----------------------------------------------------
                // Sleepover Handling (Weighted)
                // -----------------------------------------------------
                if (categoryKey.contains('sleepover')) {

                    if (!sleepoverCategoryData.containsKey(categoryKey)) {
                        // [0] = totalAmount
                        // [1] = totalHours
                        // [2] = shiftCount
                        sleepoverCategoryData.put(categoryKey, new List<Decimal>{0, 0, 0});
                    }


                    List<Decimal> data = sleepoverCategoryData.get(categoryKey);
                    
                    Decimal duration = shift.Actual_Duration__c != null
                        ? shift.Actual_Duration__c
                        : 0;

                    System.debug('🔵 Normal Shift Rate: ' + effectiveRate);
                    System.debug('🔵 duration: ' + duration);
                    Decimal pay = effectiveRate/duration;

                    data[0] += pay;       // Total pay
                    data[1] += duration;  // Total hours

                    System.debug('📊 Sleepover Updated: ' + categoryKey);
                }
                else {
                    // -------------------------------------------------
                    // Regular + Custom Shifts
                    // -------------------------------------------------
                    categoryToHourlyRate.put(categoryKey, effectiveRate.setScale(2));
                    System.debug('📋 Category Added: ' + categoryKey + ' → ' + effectiveRate);
                }
            }

            Decimal finalBrokenRate = 0;

            if (totalBrokenHours > 0) {
                finalBrokenRate = (totalBrokenPay / totalBrokenHours).setScale(2);
                totalBrokenHours = totalBrokenHours.setScale(2);
            }

            System.debug('==============================');
            System.debug('Total Broken Pay: ' + totalBrokenPay);
            System.debug('Total Broken Hours: ' + totalBrokenHours);
            System.debug('Final Broken Rate: ' + finalBrokenRate);
            System.debug('==============================');

            if (!categoryToHourlyRate.containsKey(categoryName)) {
                categoryToHourlyRate.put(categoryName, finalBrokenRate.setScale(2));
                System.debug('🩵 Added Broken Shift Category → ' + finalBrokenRate);
            }
            
            System.debug('📊 Sleepover categories found: ' + sleepoverCategoryData.size());
            
            // Calculate weighted average rates for sleepover categories
            System.debug('📊 Second pass: Calculating sleepover rates...');
            for (String categoryKey : sleepoverCategoryData.keySet()) { 
                List<Decimal> data = sleepoverCategoryData.get(categoryKey); 
                Decimal totalAmount = data[0]; 
                Decimal totalHours = data[1]; 
                Decimal shiftCount = data[2];

                system.debug('totalAmount >>>>>>>'+ totalAmount);
                system.debug('totalHours >>>>>>>'+ totalHours);
                system.debug('shiftCount >>>>>>>'+ shiftCount);
                
                if (totalHours > 0) {
                    // Calculate rate per unit: total amount ÷ total hours
                    Decimal ratePerUnit = totalAmount /* / totalHours */;
                    Decimal roundedRate = ratePerUnit.setScale(2);
                    categoryToHourlyRate.put(categoryKey, roundedRate);
                    System.debug('✅ Sleepover rate calculated: ' + categoryKey + 
                            ' → $' + roundedRate + '/hour (Total: $' + totalAmount + ' ÷ ' + totalHours + ' hours)');
                } else {
                    // Fallback: use average hourly rate if no hours recorded
                    Decimal averageRate = totalAmount / shiftCount;
                    Decimal roundedRate = averageRate.setScale(2);
                    categoryToHourlyRate.put(categoryKey, roundedRate);
                    System.debug('⚠️ Sleepover category with no hours: ' + categoryKey + 
                            ' → Using average rate: $' + roundedRate + '/shift (Total: $' + totalAmount + ' ÷ ' + shiftCount + ' shifts)');
                }
            }
            
            System.debug('📊 Final category rates:');
            for (String category : categoryToHourlyRate.keySet()) {
                System.debug('   • ' + category + ' → $' + categoryToHourlyRate.get(category) + '/hour');
            }
            System.debug('✅ Total categories with rates: ' + categoryToHourlyRate.size());

            /* // =====================================================================================
            // 🔹 8. UPDATE EMPLOYEE PAY TEMPLATE IN XERO (EarningsLines)
            // =====================================================================================
            System.debug('🔹 STEP 8: Updating Employee Pay Template in Xero...');
            if (!categoryToHourlyRate.isEmpty()) {
                HttpRequest payReq = new HttpRequest();
                String empEndpoint = 'https://api.xero.com/payroll.xro/1.0/Employees/' + xeroEmployeeId;
                System.debug('📡 Pay Template Endpoint: ' + empEndpoint);
                
                payReq.setEndpoint(empEndpoint);
                payReq.setMethod('POST');
                payReq.setHeader('Authorization', 'Bearer ' + accessToken);
                payReq.setHeader('Xero-tenant-id', tenantId);
                payReq.setHeader('Accept', 'application/json');
                payReq.setHeader('Content-Type', 'application/json');

                List<Object> earningsLines = new List<Object>();
                System.debug('📋 Building earnings lines...');
                
                for (String category : categoryToHourlyRate.keySet()) {
                    String matchedEarningRateId = null;

                    // Try direct match first
                    if (categoryToEarningRateMap.containsKey(category)) {
                        matchedEarningRateId = categoryToEarningRateMap.get(category); 
                    } else { String cleanCategory = category.replaceAll('\\s+', '').toLowerCase(); 
                    if (category.contains('sleepover')) {
                            // Look for any earning rate that contains "sleepover"
                            for (String existingName : categoryToEarningRateMap.keySet()) {
                                if (existingName.toLowerCase().contains('sleepover')) {
                                    matchedEarningRateId = categoryToEarningRateMap.get(existingName);
                                    System.debug('✅ Sleepover match: "' + category + '" → "' + existingName + '" → ' + matchedEarningRateId);
                                    break;
                                }
                            }
                        }
                        
                        // Original fuzzy matching for other categories
                        if (String.isBlank(matchedEarningRateId)) {
                            for (String existingName : categoryToEarningRateMap.keySet()) {
                                String cleanExisting = existingName.replaceAll('\\s+', '').toLowerCase();
                                if (cleanExisting.contains(cleanCategory) || cleanCategory.contains(cleanExisting)) {
                                    matchedEarningRateId = categoryToEarningRateMap.get(existingName);
                                    System.debug('✅ Fuzzy match: "' + category + '" → "' + existingName + '" → ' + matchedEarningRateId);
                                    break;
                                }
                            }
                        }
                    }

                    if (String.isBlank(matchedEarningRateId)) {
                        System.debug('⚠️ No earning rate match found for category: ' + category + ', skipping...');
                        continue;
                    }

                    Decimal ratePerUnit = categoryToHourlyRate.get(category);
                    earningsLines.add(new Map<String, Object>{
                        'EarningsRateID' => matchedEarningRateId,
                        'CalculationType' => 'ENTEREARNINGSRATE',
                        'RatePerUnit' => ratePerUnit
                    });
                    
                    System.debug('📋 Added earnings line: ' + matchedEarningRateId + ' → $' + ratePerUnit);
                }

                // 🩵 Always include the Ordinary Earnings Rate
                System.debug('🔍 Checking for Ordinary Earnings Rate in earnings lines...');
                Boolean hasOrdinaryRate = false;
                for (Object o : earningsLines) {
                    Map<String, Object> eLine = (Map<String, Object>) o;
                    if ((String) eLine.get('EarningsRateID') == ordinaryEarningsRateId) { hasOrdinaryRate = true;
                        System.debug('✅ Ordinary Earnings Rate already included');
                        break;
                    }
                }
                
                if (!hasOrdinaryRate) {
                    earningsLines.add(new Map<String, Object>{
                        'EarningsRateID' => ordinaryEarningsRateId,
                        'CalculationType' => 'ENTEREARNINGSRATE',
                        'RatePerUnit' => 0
                    });
                    System.debug('✅ Added Ordinary Earnings Rate with $0 rate: ' + ordinaryEarningsRateId);
                }

                // ✅ Send JSON as an array
                System.debug('📦 Building Pay Template JSON...');
                String payTemplateJSON = JSON.serialize(
                    new List<Object>{
                        new Map<String, Object>{
                            'EmployeeID' => xeroEmployeeId,
                            'PayTemplate' => new Map<String, Object>{
                                'EarningsLines' => earningsLines
                            }
                        }
                    }
                );
                
                System.debug('📋 Earnings lines count: ' + earningsLines.size());
                System.debug('📄 Pay Template JSON (first 500 chars): ' + payTemplateJSON.left(500));
                
                payReq.setBody(payTemplateJSON);

                System.debug('📡 Sending Pay Template update request to Xero...');
                Http payHttp = new Http();
                HttpResponse payRes = payHttp.send(payReq);
                
                System.debug('📥 Pay Template Response Status: ' + payRes.getStatusCode());
                System.debug('📥 Pay Template Response Body (first 1000 chars): ' + payRes.getBody().left(1000));

                if (payRes.getStatusCode() != 200 && payRes.getStatusCode() != 201) { 
                    throw new AuraHandledException('❌ Xero Employee PayTemplate API Error: ' + payRes.getBody());
                }

                System.debug('✅ Employee PayTemplate successfully updated in Xero.');
            } else {
                System.debug('⚠️ WARNING: No category rates to update in Pay Template');
            } */

            // =====================================================================================
            // 🔹 8. UPDATE EMPLOYEE PAY TEMPLATE IN XERO (EarningsLines)
            // =====================================================================================
            System.debug('🔹 STEP 8: Updating Employee Pay Template in Xero...');

            if (!categoryToHourlyRate.isEmpty()) {

                HttpRequest payReq = new HttpRequest();
                String empEndpoint = 'https://api.xero.com/payroll.xro/1.0/Employees/' + xeroEmployeeId;
                System.debug('📡 Pay Template Endpoint: ' + empEndpoint);

                payReq.setEndpoint(empEndpoint);
                payReq.setMethod('POST');
                payReq.setHeader('Authorization', 'Bearer ' + accessToken);
                payReq.setHeader('Xero-tenant-id', tenantId);
                payReq.setHeader('Accept', 'application/json');
                payReq.setHeader('Content-Type', 'application/json');

                List<Object> earningsLines = new List<Object>();
                System.debug('📋 Building earnings lines...');

                for (String category : categoryToHourlyRate.keySet()) {

                    String matchedEarningRateId = null;
                    Decimal ratePerUnit = categoryToHourlyRate.get(category);

                    // ============================================================
                    // ⭐ 1️⃣ IF BROKEN SHIFT → FORCE MAP TO "Broken Rate"
                    // ============================================================
                    System.debug('🔎 Processing category: ' + category);

                    if (category != null) {
                        System.debug('   → Category equals "Broken Shift"? '
                            + category.equalsIgnoreCase('Broken Shift'));
                    }

                    System.debug('   → Does map contain "Broken Rate"? '
                        + categoryToEarningRateMap.containsKey('Broken Rate'));

                    System.debug('   → Available earning rate keys: '
                        + categoryToEarningRateMap.keySet());

                    if (category != null &&
                        category.equalsIgnoreCase('Broken Shift')) {

                        String brokenKey = 'broken rate'; // lowercase to match map

                        if (categoryToEarningRateMap.containsKey(brokenKey)) {

                            matchedEarningRateId =
                                categoryToEarningRateMap.get(brokenKey);

                            System.debug('🩵 SUCCESS: Broken Shift mapped to broken rate');
                            System.debug('   → Matched EarningsRateID: '
                                + matchedEarningRateId);
                        } else {

                            System.debug('❌ "broken rate" key not found in map!');
                        }
                    }
                    else {
                        System.debug('❌ Broken Shift mapping condition NOT met');
                    }


                    // ============================================================
                    // 2️⃣ DIRECT MATCH
                    // ============================================================
                    if (String.isBlank(matchedEarningRateId) &&
                        categoryToEarningRateMap.containsKey(category)) {

                        matchedEarningRateId = categoryToEarningRateMap.get(category);
                    }

                    // ============================================================
                    // 3️⃣ SLEEPOVER SPECIAL MATCH
                    // ============================================================
                    if (String.isBlank(matchedEarningRateId) &&
                        category != null &&
                        category.toLowerCase().contains('sleepover')) {

                        for (String existingName : categoryToEarningRateMap.keySet()) {
                            if (existingName.toLowerCase().contains('sleepover')) {
                                matchedEarningRateId = categoryToEarningRateMap.get(existingName);
                                break;
                            }
                        }
                    }

                    // ============================================================
                    // 4️⃣ GENERAL FUZZY MATCH
                    // ============================================================
                    if (String.isBlank(matchedEarningRateId)) {

                        String cleanCategory = category.replaceAll('\\s+', '').toLowerCase();

                        for (String existingName : categoryToEarningRateMap.keySet()) {

                            String cleanExisting =
                                existingName.replaceAll('\\s+', '').toLowerCase();

                            if (cleanExisting.contains(cleanCategory) ||
                                cleanCategory.contains(cleanExisting)) {

                                matchedEarningRateId =
                                    categoryToEarningRateMap.get(existingName);
                                break;
                            }
                        }
                    }

                    // ============================================================
                    // 5️⃣ SKIP IF STILL NO MATCH
                    // ============================================================
                    if (String.isBlank(matchedEarningRateId)) {
                        System.debug('⚠️ No earning rate match for: ' + category);
                        continue;
                    }

                    // ============================================================
                    // 6️⃣ ADD TO EARNINGS LINES
                    // ============================================================
                    earningsLines.add(new Map<String, Object>{
                        'EarningsRateID' => matchedEarningRateId,
                        'CalculationType' => 'ENTEREARNINGSRATE',
                        'RatePerUnit' => ratePerUnit
                    });

                    System.debug('📋 Added earnings line: '
                                + matchedEarningRateId + ' → $' + ratePerUnit);
                }


                // ============================================================
                // 🩵 ALWAYS INCLUDE ORDINARY RATE
                // ============================================================
                Boolean hasOrdinaryRate = false;

                for (Object o : earningsLines) {
                    Map<String, Object> eLine = (Map<String, Object>) o;

                    if ((String) eLine.get('EarningsRateID') == ordinaryEarningsRateId) {
                        hasOrdinaryRate = true;
                        break;
                    }
                }

                if (!hasOrdinaryRate) {
                    earningsLines.add(new Map<String, Object>{
                        'EarningsRateID' => ordinaryEarningsRateId,
                        'CalculationType' => 'ENTEREARNINGSRATE',
                        'RatePerUnit' => 0
                    });

                    System.debug('✅ Added Ordinary Earnings Rate with $0');
                }

                // ============================================================
                // 📦 BUILD PAY TEMPLATE JSON
                // ============================================================
                String payTemplateJSON = JSON.serialize(
                    new List<Object>{
                        new Map<String, Object>{
                            'EmployeeID' => xeroEmployeeId,
                            'PayTemplate' => new Map<String, Object>{
                                'EarningsLines' => earningsLines
                            }
                        }
                    }
                );

                payReq.setBody(payTemplateJSON);

                Http payHttp = new Http();
                HttpResponse payRes = payHttp.send(payReq);

                if (payRes.getStatusCode() != 200 &&
                    payRes.getStatusCode() != 201) {

                    throw new AuraHandledException(
                        '❌ Xero Employee PayTemplate API Error: ' +
                        payRes.getBody()
                    );
                }

                System.debug('✅ Employee PayTemplate successfully updated in Xero.');

            } else {
                System.debug('⚠️ WARNING: No category rates to update');
            }


            /* // =====================================================================================
            // 🔹 9. TIMESHEET CREATION
            // =====================================================================================
            System.debug('🔹 STEP 9: Creating Timesheet in Xero...');
            System.debug('📊 Aggregating hours by category and date...');
            
            Map<String, Map<Date, Decimal>> categoryDateHoursMap = new Map<String, Map<Date, Decimal>>();
            for (ShiftwithStaff__c shift : shifts) {
                if (String.isBlank(shift.Shift_Category__c)) continue;
                String categoryKey = shift.Shift_Category__c.trim().toLowerCase();
                if (!categoryDateHoursMap.containsKey(categoryKey)) {
                    categoryDateHoursMap.put(categoryKey, new Map<Date, Decimal>());
                }
                Map<Date, Decimal> dateHours = categoryDateHoursMap.get(categoryKey);
                Decimal duration = (shift.Actual_Duration__c != null) ? shift.Actual_Duration__c : 0;
                Decimal existingHours = dateHours.containsKey(shift.Date__c) ? dateHours.get(shift.Date__c) : 0;
                dateHours.put(shift.Date__c, existingHours + duration);
                
                System.debug('📅 Shift: ' + shift.Date__c + ' | Category: ' + categoryKey + 
                        ' | Duration: ' + duration + 'h | Total for day: ' + dateHours.get(shift.Date__c) + 'h');
            }
            
            System.debug('📊 Total categories with hours: ' + categoryDateHoursMap.size());

            List<Object> timesheetLines = new List<Object>();
            System.debug('📋 Building timesheet lines...');
            
            for (String category : categoryDateHoursMap.keySet()) {
                String earningRateId = ordinaryEarningsRateId; // Default to Ordinary rate
                String cleanCategory = category.replaceAll('\\s+', '').toLowerCase();
                
                System.debug('🔍 Looking for earning rate for category: ' + category + ' (cleaned: ' + cleanCategory + ')');

                // SPECIAL HANDLING FOR SLEEPOVER IN TIMESHEET
                if (category.contains('sleepover')) { 
                    for (String keyName : categoryToEarningRateMap.keySet()) { 
                        if (keyName.toLowerCase().contains('sleepover')) { 
                            earningRateId = categoryToEarningRateMap.get(keyName);
                            System.debug('✅ Sleepover match for timesheet: "' + category + '" → "' + keyName + '" → ' + earningRateId);
                            break;
                        }
                    }
                }
                
                // Original matching for other categories
                if (earningRateId == ordinaryEarningsRateId) {
                    for (String keyName : categoryToEarningRateMap.keySet()) {
                        String cleanKey = keyName.replaceAll('\\s+', '').toLowerCase();
                        if (cleanKey.contains(cleanCategory) || cleanCategory.contains(cleanKey)) {
                            earningRateId = categoryToEarningRateMap.get(keyName);
                            System.debug('✅ Mapped category "' + category + '" → "' + keyName + '" → ' + earningRateId);
                            break;
                        }
                    }
                }
                
                if (earningRateId == ordinaryEarningsRateId) {
                    System.debug('ℹ️ Using Ordinary Earnings Rate for category: ' + category);
                }

                Map<Date, Decimal> dateHours = categoryDateHoursMap.get(category);
                List<Decimal> numberOfUnits = new List<Decimal>();
                
                System.debug('📅 Building hours for category: ' + category);
                for (Date d = startDate; d <= endDate; d = d.addDays(1)) {
                    Decimal hrs = dateHours.containsKey(d) ? dateHours.get(d).setScale(2) : 0;
                    numberOfUnits.add(hrs);
                    if (hrs > 0) {
                        System.debug('   • ' + d + ': ' + hrs + ' hours');
                    }
                }
                
                timesheetLines.add(new Map<String, Object>{
                    'EarningsRateID' => earningRateId,
                    'NumberOfUnits' => numberOfUnits
                });
                
                System.debug('📋 Added timesheet line for category: ' + category + ' (EarningsRateID: ' + earningRateId + ')');
                System.debug('   Total units across ' + numberOfUnits.size() + ' days');
            }

            System.debug('📦 Building timesheet object...');
            Map<String, Object> timesheet = new Map<String, Object>{
                'EmployeeID' => xeroEmployeeId,
                'StartDate' => startDateStr,
                'EndDate' => endDateStr,
                'Status' => 'DRAFT',
                'TimesheetLines' => timesheetLines
            };

            String timesheetJSON = JSON.serialize(new List<Object>{ timesheet });
            System.debug('📄 Timesheet JSON size: ' + timesheetJSON.length() + ' characters');
            System.debug('📘 Final Timesheet JSON (first 1000 chars): ' + timesheetJSON.left(1000));
            System.debug('📘 Formatted Timesheet JSON:');
            System.debug(JSON.serializePretty(JSON.deserializeUntyped(timesheetJSON)));

            HttpRequest timeReq = new HttpRequest();
            timeReq.setEndpoint('https://api.xero.com/payroll.xro/1.0/Timesheets');
            timeReq.setMethod('POST');
            timeReq.setHeader('Authorization', 'Bearer ' + accessToken);
            timeReq.setHeader('Xero-tenant-id', tenantId);
            timeReq.setHeader('Accept', 'application/json');
            timeReq.setHeader('Content-Type', 'application/json');
            timeReq.setBody(timesheetJSON);
            
            System.debug('📡 Sending timesheet creation request to Xero...');

            Http timeHttp = new Http();
            HttpResponse timeRes = timeHttp.send(timeReq);
            
            System.debug('📥 Timesheet Response Status: ' + timeRes.getStatusCode());
            System.debug('📥 Timesheet Response Body (first 1000 chars): ' + timeRes.getBody().left(1000)); */

            // =====================================================================================
            // 🔹 9. TIMESHEET CREATION
            // =====================================================================================

            System.debug('🔹 STEP 9: Creating Timesheet in Xero...');
            System.debug('📊 Aggregating hours by category and date...');

            Map<String, Map<Date, Decimal>> categoryDateHoursMap =
                new Map<String, Map<Date, Decimal>>();

            // =====================================================
            // 🔹 1️⃣ AGGREGATE HOURS
            // =====================================================
            for (ShiftwithStaff__c shift : shifts) {

                String categoryKey;
                Decimal duration;

                // -------------------------------------------------
                // 🔴 HANDLE BROKEN SHIFT FIRST
                // -------------------------------------------------
                if (shift.Broken_Shift__c == true) {

                    categoryKey = 'broken shift';

                    duration = shift.Broken_Total_Duration__c != null
                        ? shift.Broken_Total_Duration__c
                        : 0;

                    System.debug('🩵 Broken Shift Found');
                    System.debug('   Date: ' + shift.Date__c);
                    System.debug('   Duration: ' + duration);
                }
                else {

                    if (String.isBlank(shift.Shift_Category__c)) continue;

                    categoryKey = shift.Shift_Category__c.trim().toLowerCase();

                    duration = shift.Actual_Duration__c != null
                        ? shift.Actual_Duration__c
                        : 0;
                }

                if (!categoryDateHoursMap.containsKey(categoryKey)) {
                    categoryDateHoursMap.put(categoryKey, new Map<Date, Decimal>());
                }

                Map<Date, Decimal> dateHours = categoryDateHoursMap.get(categoryKey);

                Decimal existingHours = dateHours.containsKey(shift.Date__c)
                    ? dateHours.get(shift.Date__c)
                    : 0;

                dateHours.put(shift.Date__c, existingHours + duration);

                System.debug('📅 Shift: ' + shift.Date__c +
                    ' | Category: ' + categoryKey +
                    ' | Duration: ' + duration +
                    'h | Total for day: ' +
                    dateHours.get(shift.Date__c) + 'h');
            }

            System.debug('📊 Total categories with hours: '
                        + categoryDateHoursMap.size());


            // =====================================================
            // 🔹 2️⃣ BUILD TIMESHEET LINES
            // =====================================================

            List<Object> timesheetLines = new List<Object>();
            System.debug('📋 Building timesheet lines...');

            for (String category : categoryDateHoursMap.keySet()) {

                String earningRateId = ordinaryEarningsRateId; // default
                String cleanCategory = category.replaceAll('\\s+', '').toLowerCase();

                System.debug('🔍 Processing category: ' + category);

                // -------------------------------------------------
                // 🔴 FORCE BROKEN SHIFT → broken rate
                // -------------------------------------------------
                if (category.equalsIgnoreCase('broken shift')) {

                    for (String keyName : categoryToEarningRateMap.keySet()) {

                        if (keyName.toLowerCase() == 'broken rate') {

                            earningRateId =
                                categoryToEarningRateMap.get(keyName);

                            System.debug('🩵 Broken Shift mapped to Broken Rate: '
                                        + earningRateId);
                            break;
                        }
                    }
                }

                // -------------------------------------------------
                // 🟣 SLEEPOVER MATCH
                // -------------------------------------------------
                if (earningRateId == ordinaryEarningsRateId &&
                    category.contains('sleepover')) {

                    for (String keyName : categoryToEarningRateMap.keySet()) {

                        if (keyName.toLowerCase().contains('sleepover')) {

                            earningRateId =
                                categoryToEarningRateMap.get(keyName);

                            System.debug('✅ Sleepover mapped: '
                                        + keyName + ' → ' + earningRateId);
                            break;
                        }
                    }
                }

                // -------------------------------------------------
                // 🔵 GENERAL MATCH
                // -------------------------------------------------
                if (earningRateId == ordinaryEarningsRateId) {

                    for (String keyName : categoryToEarningRateMap.keySet()) {

                        String cleanKey =
                            keyName.replaceAll('\\s+', '').toLowerCase();

                        if (cleanKey.contains(cleanCategory) ||
                            cleanCategory.contains(cleanKey)) {

                            earningRateId =
                                categoryToEarningRateMap.get(keyName);

                            System.debug('✅ Category mapped: '
                                        + keyName + ' → ' + earningRateId);
                            break;
                        }
                    }
                }

                if (earningRateId == ordinaryEarningsRateId) {
                    System.debug('ℹ️ Using Ordinary Earnings Rate');
                }

                // -------------------------------------------------
                // BUILD DAILY UNITS ARRAY
                // -------------------------------------------------
                Map<Date, Decimal> dateHours =
                    categoryDateHoursMap.get(category);

                List<Decimal> numberOfUnits =
                    new List<Decimal>();

                for (Date d = startDate;
                    d <= endDate;
                    d = d.addDays(1)) {

                    Decimal hrs =
                        dateHours.containsKey(d)
                        ? dateHours.get(d).setScale(2)
                        : 0;

                    numberOfUnits.add(hrs);
                }

                timesheetLines.add(new Map<String, Object>{
                    'EarningsRateID' => earningRateId,
                    'NumberOfUnits'  => numberOfUnits
                });

                System.debug('📋 Timesheet line added → '
                            + earningRateId);
            }


            // =====================================================
            // 🔹 3️⃣ BUILD FINAL TIMESHEET OBJECT
            // =====================================================

            Map<String, Object> timesheet = new Map<String, Object>{
                'EmployeeID'    => xeroEmployeeId,
                'StartDate'     => startDateStr,
                'EndDate'       => endDateStr,
                'Status'        => 'DRAFT',
                'TimesheetLines'=> timesheetLines
            };

            String timesheetJSON =
                JSON.serialize(new List<Object>{ timesheet });

            System.debug('📘 Final Timesheet JSON:');
            System.debug(JSON.serializePretty(
                JSON.deserializeUntyped(timesheetJSON)
            ));

            HttpRequest timeReq = new HttpRequest();
            timeReq.setEndpoint(
                'https://api.xero.com/payroll.xro/1.0/Timesheets');
            timeReq.setMethod('POST');
            timeReq.setHeader('Authorization',
                'Bearer ' + accessToken);
            timeReq.setHeader('Xero-tenant-id', tenantId);
            timeReq.setHeader('Accept', 'application/json');
            timeReq.setHeader('Content-Type', 'application/json');
            timeReq.setBody(timesheetJSON);

            Http timeHttp = new Http();
            HttpResponse timeRes = timeHttp.send(timeReq);

            System.debug('📥 Timesheet Response Status: '
                        + timeRes.getStatusCode());
            System.debug('📥 Timesheet Response Body: '
                        + timeRes.getBody());


            if (timeRes.getStatusCode() != 200 && timeRes.getStatusCode() != 201) {

                String body = timeRes.getBody();

                System.debug('❌ ERROR: Timesheet API failed with status: ' + timeRes.getStatusCode());
                System.debug('❌ Full error response: ' + body);

                try {

                    Map<String, Object> err =
                        (Map<String, Object>) JSON.deserializeUntyped(body);

                    String message = (String) err.get('Message');

                    if (message != null &&
                        message.containsIgnoreCase('already exists')) {

                        // ✅ Show clean message to UI
                        throw new AuraHandledException('Timesheet already submitted.');
                    }

                } catch (AuraHandledException ahe) {
                    throw ahe; // rethrow our friendly message
                } catch (Exception ignore) {
                    // fall through
                }

                // fallback – original error
                throw new AuraHandledException(
                    'Xero Timesheet API Error: ' + body
                );
            }

            System.debug('✅ Timesheet successfully created in Xero.');
            System.debug('✅ =========== COMPLETED SUCCESSFULLY ===========');

        } catch (AuraHandledException e) {
            System.debug('⚠️ AuraHandledException caught: ' + e.getMessage());
            System.debug('❌ =========== FAILED WITH AURA EXCEPTION ===========');
            throw e;
        } catch (Exception e) {
            System.debug('💥 Unexpected Exception caught:');
            System.debug('💥 Message: ' + e.getMessage());
            System.debug('💥 Line: ' + e.getLineNumber());
            System.debug('💥 Stack Trace: ' + e.getStackTraceString());
            System.debug('❌ =========== FAILED WITH UNEXPECTED EXCEPTION ===========');
            throw new AuraHandledException('Unexpected error while inserting timesheet: ' + e.getMessage());
        }
    }
   
}