public class XeroIntegrationTimeSheet {

    @AuraEnabled
    public static void insertTimeSheet(String staffId, String startDateStr, String endDateStr) {
        System.debug('🚀 insertTimeSheet CALLED with => staffId=' + staffId + ', startDate=' + startDateStr + ', endDate=' + endDateStr);

        try {
            // 🔹 1. Get Staff details
            Staff__c staff = [
                SELECT Id, NameToDisplay__c, Display_Nickname__c, 
                    Xero_Employee_ID__c, Ordinary_Earnings_Rate_ID__c
                FROM Staff__c
                WHERE Id = :staffId
                LIMIT 1
            ];

            if (String.isBlank(staff.Xero_Employee_ID__c)) {
                throw new AuraHandledException('❌ Missing Xero Employee ID for ' + staff.Display_Nickname__c + '. Please sync this staff record with Xero.');
            }

            if (String.isBlank(staff.Ordinary_Earnings_Rate_ID__c)) {
                throw new AuraHandledException('❌ Missing Ordinary Earnings Rate ID for ' + staff.Display_Nickname__c + '. Please set it in Staff record.');
            }

            String xeroEmployeeId = staff.Xero_Employee_ID__c;
            String ordinaryEarningsRateId = staff.Ordinary_Earnings_Rate_ID__c;
            System.debug('👤 Xero Employee ID => ' + xeroEmployeeId);
            System.debug('🟢 Ordinary Earnings Rate ID => ' + ordinaryEarningsRateId);

            // 🔹 2. Get Xero connection info
            String accessToken = '';
            if (Test.isRunningTest()) {
                accessToken = 'dummy_access_id';
            } else{
            	accessToken = XeroIntegrationController.getAccessTokenFromXero();
            }
            String tenantId = '';
            if (Test.isRunningTest()) {
                tenantId = 'dummy_tenant_id';
            } else{
            	tenantId = XeroIntegrationController.getTenantId(accessToken);
            }
            System.debug('🔑 Access Token Present? ' + !String.isBlank(accessToken) + ', Tenant ID => ' + tenantId);

            if (String.isBlank(accessToken) || String.isBlank(tenantId)) {
                throw new AuraHandledException('❌ Missing Xero Access Token or Tenant ID.');
            }

            // 🔹 3. Convert dates
            Date startDate = Date.valueOf(startDateStr);
            Date endDate = Date.valueOf(endDateStr);
            System.debug('📅 Converted Dates => Start: ' + startDate + ', End: ' + endDate);

            // 🔹 4. Get user org info
            User currentUser = [
                SELECT Organization_Name__c 
                FROM User 
                WHERE Id = :UserInfo.getUserId()
            ];

            // 🔹 5. Get Organisation + Xero Earning Rates
            Organisation__c orgRecord = [
                SELECT Id, Name,
                    (SELECT Id, Name, Earning_Rate_ID__c FROM Xero_Earning_Rates__r)
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];

            // 🔹 Build map of earning rate names → IDs
            Map<String, String> categoryToEarningRateMap = new Map<String, String>();
            for (Xero_Earning_Rate__c rate : orgRecord.Xero_Earning_Rates__r) {
                if (!String.isBlank(rate.Name) && !String.isBlank(rate.Earning_Rate_ID__c)) {
                    categoryToEarningRateMap.put(rate.Name.trim().toLowerCase(), rate.Earning_Rate_ID__c);
                }
            }

            // 🔹 6. Fetch approved shifts
            List<ShiftwithStaff__c> shifts = [
                SELECT Id, Date__c, Actual_Duration__c, Shift_Category__c, 
                    Approval_Status__c, Staff_Hourly_Rate__c, Shift_Type__c
                FROM ShiftwithStaff__c
                WHERE Staff__c = :staffId
                AND Date__c >= :startDate
                AND Date__c <= :endDate
                AND Approval_Status__c = 'Approved'
                AND Shift_Category__c NOT IN ('Custom', 'Sleepover Shift')
                ORDER BY Date__c
            ];

            
            system.debug('shifts >>>'+ shifts.Size());

            if (shifts.isEmpty()) {
                throw new AuraHandledException('⚠️ No approved shifts found for this date range.');
            }

            // 🔹 7. Map category → hourly rate
            Map<String, Decimal> categoryToHourlyRate = new Map<String, Decimal>();
            for (ShiftwithStaff__c shift : shifts) {
                if (!String.isBlank(shift.Shift_Category__c) && shift.Staff_Hourly_Rate__c != null) {
                    categoryToHourlyRate.put(shift.Shift_Category__c.trim().toLowerCase(), shift.Staff_Hourly_Rate__c.setScale(2));
                }
            }

            // =====================================================================================
            // 🔹 8. UPDATE EMPLOYEE PAY TEMPLATE IN XERO (EarningsLines)
            // =====================================================================================
            if (!categoryToHourlyRate.isEmpty()) {
                HttpRequest payReq = new HttpRequest();
                String empEndpoint = 'https://api.xero.com/payroll.xro/1.0/Employees/' + xeroEmployeeId;
                payReq.setEndpoint(empEndpoint);
                payReq.setMethod('POST');
                payReq.setHeader('Authorization', 'Bearer ' + accessToken);
                payReq.setHeader('Xero-tenant-id', tenantId);
                payReq.setHeader('Accept', 'application/json');
                payReq.setHeader('Content-Type', 'application/json');

                List<Object> earningsLines = new List<Object>();
                for (String category : categoryToHourlyRate.keySet()) {
                    String matchedEarningRateId;

                    if (categoryToEarningRateMap.containsKey(category)) {
                        matchedEarningRateId = categoryToEarningRateMap.get(category);
                    } else {
                        String cleanCategory = category.replaceAll('\\s+', '').toLowerCase();
                        for (String existingName : categoryToEarningRateMap.keySet()) {
                            String cleanExisting = existingName.replaceAll('\\s+', '').toLowerCase();
                            if (cleanExisting.contains(cleanCategory) || cleanCategory.contains(cleanExisting)) {
                                matchedEarningRateId = categoryToEarningRateMap.get(existingName);
                                break;
                            }
                        }
                    }

                    if (String.isBlank(matchedEarningRateId)) continue;

                    earningsLines.add(new Map<String, Object>{
                        'EarningsRateID' => matchedEarningRateId,
                        'CalculationType' => 'ENTEREARNINGSRATE',
                        'RatePerUnit' => categoryToHourlyRate.get(category)
                    });
                }

                // 🩵 Always include the Ordinary Earnings Rate
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
                }

                // ✅ Send JSON as an array
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
                System.debug('🔹 Employee PayTemplate Response Code: ' + payRes.getStatusCode());
                System.debug('🔹 Employee PayTemplate Response Body: ' + payRes.getBody());

                if (payRes.getStatusCode() != 200 && payRes.getStatusCode() != 201) {
                    throw new AuraHandledException('❌ Xero Employee PayTemplate API Error: ' + payRes.getBody());
                }

                System.debug('✅ Employee PayTemplate successfully updated in Xero.');
            }

            // =====================================================================================
            // 🔹 9. TIMESHEET CREATION
            // =====================================================================================
            Map<String, Map<Date, Decimal>> categoryDateHoursMap = new Map<String, Map<Date, Decimal>>();
            for (ShiftwithStaff__c shift : shifts) {
                if (String.isBlank(shift.Shift_Category__c)) continue;
                String categoryKey = shift.Shift_Category__c.trim().toLowerCase();
                if (!categoryDateHoursMap.containsKey(categoryKey)) {
                    categoryDateHoursMap.put(categoryKey, new Map<Date, Decimal>());
                }
                Map<Date, Decimal> dateHours = categoryDateHoursMap.get(categoryKey);
                Decimal duration = (shift.Actual_Duration__c != null) ? shift.Actual_Duration__c : 0;
                dateHours.put(shift.Date__c, dateHours.containsKey(shift.Date__c) ? dateHours.get(shift.Date__c) + duration : duration);
            }

            List<Object> timesheetLines = new List<Object>();
            for (String category : categoryDateHoursMap.keySet()) {
                String earningRateId = ordinaryEarningsRateId; // Default to Ordinary rate
                String cleanCategory = category.replaceAll('\\s+', '').toLowerCase();

                for (String keyName : categoryToEarningRateMap.keySet()) {
                    String cleanKey = keyName.replaceAll('\\s+', '').toLowerCase();
                    if (cleanKey.contains(cleanCategory) || cleanCategory.contains(cleanKey)) {
                        earningRateId = categoryToEarningRateMap.get(keyName);
                        break;
                    }
                }

                Map<Date, Decimal> dateHours = categoryDateHoursMap.get(category);
                List<Decimal> numberOfUnits = new List<Decimal>();
                for (Date d = startDate; d <= endDate; d = d.addDays(1)) {
                    Decimal hrs = dateHours.containsKey(d) ? dateHours.get(d).setScale(2) : 0;
                    numberOfUnits.add(hrs);
                }

                timesheetLines.add(new Map<String, Object>{
                    'EarningsRateID' => earningRateId,
                    'NumberOfUnits' => numberOfUnits
                });
            }

            Map<String, Object> timesheet = new Map<String, Object>{
                'EmployeeID' => xeroEmployeeId,
                'StartDate' => startDateStr,
                'EndDate' => endDateStr,
                'Status' => 'DRAFT',
                'TimesheetLines' => timesheetLines
            };

            String timesheetJSON = JSON.serialize(new List<Object>{ timesheet });
            System.debug('📘 Final Timesheet JSON => ' + JSON.serializePretty(JSON.deserializeUntyped(timesheetJSON)));

            HttpRequest timeReq = new HttpRequest();
            timeReq.setEndpoint('https://api.xero.com/payroll.xro/1.0/Timesheets');
            timeReq.setMethod('POST');
            timeReq.setHeader('Authorization', 'Bearer ' + accessToken);
            timeReq.setHeader('Xero-tenant-id', tenantId);
            timeReq.setHeader('Accept', 'application/json');
            timeReq.setHeader('Content-Type', 'application/json');
            timeReq.setBody(timesheetJSON);

            Http timeHttp = new Http();
            HttpResponse timeRes = timeHttp.send(timeReq);
            System.debug('🔹 Timesheet Response Code: ' + timeRes.getStatusCode());
            System.debug('🔹 Timesheet Response Body: ' + timeRes.getBody());

            if (timeRes.getStatusCode() != 200 && timeRes.getStatusCode() != 201) {
                throw new AuraHandledException('❌ Xero Timesheet API Error: ' + timeRes.getBody());
            }

            System.debug('✅ Timesheet successfully created in Xero.');

        } catch (AuraHandledException e) {
            System.debug('⚠️ AuraHandledException: ' + e.getMessage());
            throw e;
        } catch (Exception e) {
            System.debug('💥 Exception in insertTimeSheet: ' + e.getMessage());
            System.debug(e.getStackTraceString());
            throw new AuraHandledException('Unexpected error while inserting timesheet: ' + e.getMessage());
        }
    }
   
}