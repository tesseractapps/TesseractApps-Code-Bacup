public with sharing class XeroIntegrationController {
    
    // STEP Get access token
    public static String getAccessTokenFromXero() {
        User currentUser = [
            SELECT Organization_Name__c 
            FROM User 
            WHERE Id = :UserInfo.getUserId()
        ];

        System.debug('🔹currentUser : '+ currentUser.Organization_Name__c);
        
        Organisation__c orgRecord = [
            SELECT Client_Id__c, Client_Secret__c 
            FROM Organisation__c 
            WHERE Name = :currentUser.Organization_Name__c
            LIMIT 1
        ];
        
        // Build Basic token
        String combined = orgRecord.Client_Id__c + ':' + orgRecord.Client_Secret__c;
        String basicToken = 'Basic ' + EncodingUtil.base64Encode(Blob.valueOf(combined));

        String scope =
            'accounting.attachments accounting.attachments.read ' +
            'accounting.budgets.read accounting.contacts accounting.contacts.read ' +
            'accounting.reports.tenninetynine.read accounting.settings accounting.settings.read ' +
            'assets assets.read files files.read ' +
            'payroll.employees payroll.employees.read payroll.payruns payroll.payruns.read ' +
            'payroll.payslip payroll.payslip.read payroll.settings payroll.settings.read ' +
            'payroll.timesheets payroll.timesheets.read projects projects.read ' +
            'accounting.invoices accounting.payments accounting.banktransactions accounting.manualjournals ' +
            'accounting.invoices.read accounting.payments.read accounting.banktransactions.read accounting.manualjournals.read ' +
            'accounting.reports.aged.read accounting.reports.balancesheet.read ' +
            'accounting.reports.banksummary.read accounting.reports.budgetsummary.read ' +
            'accounting.reports.executivesummary.read accounting.reports.profitandloss.read ' +
            'accounting.reports.taxreports.read accounting.reports.trialbalance.read';

        String body =
            'grant_type=client_credentials' +
            '&scope=' + EncodingUtil.urlEncode(scope, 'UTF-8');

        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://identity.xero.com/connect/token');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
        req.setHeader('Authorization', basicToken);
        req.setBody(body);
        
        Http http = new Http();
        HTTPResponse res = http.send(req);
        
        System.debug('🔹 Token Response: ' + res.getBody());
        
        if (res.getStatusCode() == 200) {
            Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            String accessToken = (String) result.get('access_token');
            return accessToken;
        } else {
            throw new AuraHandledException('❌ Xero Token Request Failed: ' + res.getBody());
        }
    }
    
    // STEP Get Tenant Id
    public static String getTenantId(String accessToken) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://api.xero.com/connections');
        req.setMethod('GET');
        req.setHeader('Authorization', 'Bearer ' + accessToken);
        req.setHeader('Accept', 'application/json');
        
        Http http = new Http();
        HTTPResponse res = http.send(req);
        
        System.debug('🔹 Connections Response: ' + res.getBody());
        
        if (res.getStatusCode() == 200) {
            List<Object> connectionList = (List<Object>) JSON.deserializeUntyped(res.getBody());
            if (!connectionList.isEmpty()) {
                Map<String, Object> connection = (Map<String, Object>) connectionList[0];
                String tenantId = (String) connection.get('tenantId');
                System.debug('🏢 Tenant ID: ' + tenantId);
                return tenantId;
            } else {
                throw new AuraHandledException('⚠️ No Xero connections found.');
            }
        } else {
            throw new AuraHandledException('❌ Failed to fetch Xero connections: ' + res.getBody());
        }
    }

    @AuraEnabled
    public static String syncXeroEarningsRates() {

        System.debug('🔄 Starting syncXeroEarningsRates...');

        String accessToken = getAccessTokenFromXero();
        String tenantId   = getTenantId(accessToken);

        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://api.xero.com/payroll.xro/2.0/earningsRates');
        req.setMethod('GET');
        req.setHeader('Authorization', 'Bearer ' + accessToken);
        req.setHeader('Xero-tenant-id', tenantId);
        req.setHeader('Accept', 'application/json');

        Http http = new Http();
        HttpResponse res;

        try {
            res = http.send(req);
        } catch (Exception e) {
            throw new AuraHandledException('HTTP callout error: ' + e.getMessage());
        }

        if (res.getStatusCode() != 200) {
            throw new AuraHandledException(
                '❌ API call failed with status ' + res.getStatusCode()
            );
        }

        try {

            Object bodyObj = JSON.deserializeUntyped(res.getBody());
            System.debug('getBody >>>>> \n' + JSON.serializePretty(bodyObj));

            Map<String, Object> responseMap =
                (Map<String, Object>) bodyObj;

            List<Object> earningsRates =
                (List<Object>) responseMap.get('earningsRates');

            if (earningsRates == null || earningsRates.isEmpty()) {
                return '⚠️ No earnings rates found in response.';
            }

            // ----------------------------------------------------
            // Get organisation
            // ----------------------------------------------------
            User currentUser = [
                SELECT Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
            ];

            Organisation__c orgRecord;

            if (currentUser.Organization_Name__c != null) {
                orgRecord = [
                    SELECT Id
                    FROM Organisation__c
                    WHERE Name = :currentUser.Organization_Name__c
                    LIMIT 1
                ];
            }

            // ----------------------------------------------------
            // Collect earningRateIDs (only W1 reportable)
            // ----------------------------------------------------
            Set<String> earningRateIds = new Set<String>();

            for (Object rateObj : earningsRates) {

                Map<String, Object> rateMap =
                    (Map<String, Object>) rateObj;

                Boolean isReportableAsW1 =
                    rateMap.containsKey('isReportableAsW1')
                        ? (Boolean) rateMap.get('isReportableAsW1')
                        : null;

                if (isReportableAsW1 != true) {
                    continue;
                }

                String earningRateId =
                    (String) rateMap.get('earningsRateID');

                if (!String.isBlank(earningRateId)) {
                    earningRateIds.add(earningRateId);
                }
            }

            if (earningRateIds.isEmpty()) {
                return '⚠️ No valid (W1 reportable) earnings rates to process.';
            }

            // ----------------------------------------------------
            // Query existing records
            // ----------------------------------------------------
            Map<String, Xero_Earning_Rate__c> existingMap =
                new Map<String, Xero_Earning_Rate__c>();

            for (Xero_Earning_Rate__c rec : [
                SELECT Id, Earning_Rate_ID__c
                FROM Xero_Earning_Rate__c
                WHERE Earning_Rate_ID__c IN :earningRateIds
                AND Organization__c = :orgRecord.Id
            ]) {
                existingMap.put(rec.Earning_Rate_ID__c, rec);
            }

            List<Xero_Earning_Rate__c> toInsert = new List<Xero_Earning_Rate__c>();
            List<Xero_Earning_Rate__c> toUpdate = new List<Xero_Earning_Rate__c>();

            // ----------------------------------------------------
            // Build records
            // ----------------------------------------------------
            for (Object rateObj : earningsRates) {

                Map<String, Object> rateMap =
                    (Map<String, Object>) rateObj;

                Boolean isReportableAsW1 =
                    rateMap.containsKey('isReportableAsW1')
                        ? (Boolean) rateMap.get('isReportableAsW1')
                        : null;

                if (isReportableAsW1 != true) {
                    System.debug(
                        '⏭ Skipping because isReportableAsW1 is false/null. earningRateID='
                        + rateMap.get('earningsRateID')
                    );
                    continue;
                }

                String earningRateId =
                    (String) rateMap.get('earningsRateID');

                if (String.isBlank(earningRateId)) {
                    continue;
                }

                Xero_Earning_Rate__c record = new Xero_Earning_Rate__c();

                record.Earning_Rate_ID__c = earningRateId;
                record.Name              = (String) rateMap.get('name');
                record.Earnings_Type__c  = (String) rateMap.get('earningsType');
                record.Rate_Type__c      = (String) rateMap.get('rateType');
                record.Type_Of_Units__c  = (String) rateMap.get('typeOfUnits');
                record.Expense_Account_ID__c =
                    (String) rateMap.get('expenseAccountID');

                record.is_Subject_To_Tax__c =
                    rateMap.get('isSubjectToTax') == null
                        ? false
                        : (Boolean) rateMap.get('isSubjectToTax');

                record.is_Subject_To_Super__c =
                    rateMap.get('isSubjectToSuper') == null
                        ? false
                        : (Boolean) rateMap.get('isSubjectToSuper');

                if (orgRecord != null) {
                    record.Organization__c = orgRecord.Id;
                }

                if (existingMap.containsKey(earningRateId)) {

                    record.Id =
                        existingMap.get(earningRateId).Id;

                    toUpdate.add(record);

                } else {

                    toInsert.add(record);
                }
            }

            if (!toUpdate.isEmpty()) {
                update toUpdate;
            }

            if (!toInsert.isEmpty()) {
                insert toInsert;
            }

            return '✅ Sync completed. '
                + toUpdate.size() + ' updated, '
                + toInsert.size() + ' inserted.';

        } catch (Exception e) {

            throw new AuraHandledException(
                '❌ Error processing response: ' + e.getMessage()
            );
        }
    }
   
    // STEP Get Employees - OPTIMIZED (only basic list)
    @AuraEnabled
    public static List<Map<String, Object>> getXeroEmployees() {
        String accessToken;
        String tenantId;            
        if (Test.isRunningTest()) {
            accessToken = 'dummy_access_id';
            tenantId = 'dummy_access_id';
            System.debug('🔹 TEST MODE: Using dummy access token');
        } else {
            accessToken = getAccessTokenFromXero();
            tenantId = getTenantId(accessToken);
            System.debug('✅ Access token obtained: ' + (String.isBlank(accessToken) ? 'EMPTY' : 'PRESENT'));
        }
        
        List<Map<String, Object>> allEmployees = new List<Map<String, Object>>();
        Integer page = 1;
        Integer pageSize = 100;
        Boolean hasMoreRecords = true;
        
        while (hasMoreRecords) {
            String endpoint = 'https://api.xero.com/payroll.xro/1.0/Employees' 
                            + '?page=' + page 
                            + '&pageSize=' + pageSize;
            
            HttpRequest req = new HttpRequest();
            req.setEndpoint(endpoint);
            req.setMethod('GET');
            req.setHeader('Authorization', 'Bearer ' + accessToken);
            req.setHeader('Xero-tenant-id', tenantId);
            req.setHeader('Accept', 'application/json');
            
            Http http = new Http();
            HttpResponse res = http.send(req);
            
            System.debug('🔹 Page ' + page + ' Response: ' + res.getBody());
            
            if (res.getStatusCode() == 200) {
                Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                List<Object> employeesRaw = (List<Object>) result.get('Employees');
                
                if (employeesRaw == null || employeesRaw.isEmpty()) {
                    hasMoreRecords = false;
                    break;
                }
                
                for (Object empObj : employeesRaw) {
                    Map<String, Object> employee = (Map<String, Object>) empObj;
                    
                    String dob = (String) employee.get('DateOfBirth');
                    String formattedDOB = formatXeroDate(dob);
                    employee.put('FormattedDateOfBirth', formattedDOB);
                    
                    allEmployees.add(employee);
                }
                
                if (employeesRaw.size() < pageSize) {
                    hasMoreRecords = false;
                } else {
                    page++;
                }
            } else {
                throw new AuraHandledException('❌ Failed to fetch Xero employees: ' + res.getBody());
            }
        }
        
        System.debug('✅ Total Employees Retrieved: ' + allEmployees.size());
        return allEmployees;
    }

    // 🔹 Fetch full employee details on demand (only when user clicks "Add to System")
    @AuraEnabled
    public static Map<String, Object> getFullXeroEmployee(String employeeId) {
        try {
            String accessToken;
            String tenantId;            
            if (Test.isRunningTest()) {
                accessToken = 'dummy_access_id';
                tenantId = 'dummy_access_id';
                System.debug('🔹 TEST MODE: Using dummy access token');
            } else {
                accessToken = getAccessTokenFromXero();
                tenantId = getTenantId(accessToken);
                System.debug('✅ Access token obtained: ' + (String.isBlank(accessToken) ? 'EMPTY' : 'PRESENT'));
            }
            
            String endpoint = 'https://api.xero.com/payroll.xro/1.0/Employees/' + employeeId;
            
            HttpRequest req = new HttpRequest();
            req.setEndpoint(endpoint);
            req.setMethod('GET');
            req.setHeader('Authorization', 'Bearer ' + accessToken);
            req.setHeader('Xero-tenant-id', tenantId);
            req.setHeader('Accept', 'application/json');
            
            Http http = new Http();
            HttpResponse res = http.send(req);
            
            System.debug('🔹 Full Employee Details Response for ' + employeeId + ': ' + res.getStatusCode());
            
            if (res.getStatusCode() == 200) {
                Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                List<Object> employees = (List<Object>) result.get('Employees');
                
                if (employees != null && !employees.isEmpty()) {
                    Map<String, Object> employee = (Map<String, Object>) employees[0];
                    
                    String dob = (String) employee.get('DateOfBirth');
                    String formattedDOB = formatXeroDate(dob);
                    employee.put('FormattedDateOfBirth', formattedDOB);
                    
                    return employee;
                }
            }
        } catch (Exception e) {
            System.debug('⚠️ Error fetching full details for employee: ' + e.getMessage());
        }
        
        return null;
    }

    // 🔹 Helper method to format Xero Date - FIXED
    public static String formatXeroDate(String xeroDateString) {
        if (String.isBlank(xeroDateString)) return null;
        
        try {
            Integer startIdx = xeroDateString.indexOf('(');
            Integer endIdx = xeroDateString.indexOf('+');
            
            if (startIdx != -1 && endIdx != -1 && endIdx > startIdx) {
                String timestampStr = xeroDateString.substring(startIdx + 1, endIdx);
                Long timestamp = Long.valueOf(timestampStr);
                
                DateTime dt = DateTime.newInstance(timestamp);
                Date d = dt.date();
                
                String day = String.valueOf(d.day());
                if (day.length() == 1) day = '0' + day;
                
                String month = String.valueOf(d.month());
                if (month.length() == 1) month = '0' + month;
                
                String year = String.valueOf(d.year());
                
                return day + '/' + month + '/' + year;
            }
            
            try {
                Date parsedDate = Date.parse(xeroDateString);
                if (parsedDate != null) {
                    String day = String.valueOf(parsedDate.day());
                    if (day.length() == 1) day = '0' + day;
                    
                    String month = String.valueOf(parsedDate.month());
                    if (month.length() == 1) month = '0' + month;
                    
                    String year = String.valueOf(parsedDate.year());
                    return day + '/' + month + '/' + year;
                }
            } catch (Exception ex) {
            }
            
            return null;
        } catch (Exception e) {
            System.debug('⚠️ Error parsing DateOfBirth: ' + xeroDateString + ' - ' + e.getMessage());
            return null;
        }
    }
    
    // get Staff from System
    @AuraEnabled
    public static List<Staff__c> fetchStaffList() {
        try {
            
            User currentUser = [
                SELECT Organization_Name__c 
                FROM User 
                WHERE Id = :UserInfo.getUserId()
            ];
            
            Organisation__c orgRecord = [
                SELECT Client_Id__c, Client_Secret__c 
                FROM Organisation__c 
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];
            
            List<Staff__c> staffList = [
                SELECT Id, Name, NameToDisplay__c,Email_Address__c,Date_Of_Birth__c, Last_Name__c, Status__c, Organization_Name__c, Facility__c,Facility__r.Organisation__c, Contact_Number__c, Picture__c, Xero_Employee_ID__c,Wyzed_User_Id__c FROM Staff__c
                Where Facility__r.Organisation__c =: orgRecord.Id AND Status__c = true
            ];
            
            System.debug('✅ Staff records fetched: ' + staffList.size());
            return staffList;
            
        } catch (Exception e) {
            System.debug('❌ Error fetching staff list: ' + e.getMessage());
            throw new AuraHandledException('Error fetching staff list: ' + e.getMessage());
        }
    }
    
    // get Entity from System
    @AuraEnabled
    public static List<Xero_Entity__c> fetchEntityList() {
        try {
            
            User currentUser = [
                SELECT Organization_Name__c 
                FROM User 
                WHERE Id = :UserInfo.getUserId()
            ];
            
            Organisation__c orgRecord = [
                SELECT Client_Id__c, Client_Secret__c 
                FROM Organisation__c 
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];
            
            List<Xero_Entity__c> entityList = [
                SELECT Id,First_Name__c,Last_Name__c, Email__c, Contact__c,ABN__c,Card_Type__c,Organization__c,Xero_Contact_Id__c  FROM Xero_Entity__c
                Where Organization__c =: orgRecord.Id 
            ];
            
            System.debug('✅ Entity records fetched: ' + entityList.size());
            return entityList;
            
        } catch (Exception e) {
            System.debug('❌ Error fetching Entity list: ' + e.getMessage());
            throw new AuraHandledException('Error fetching Entity list: ' + e.getMessage());
        }
    }
    
    // STEP Post Employees                          
    @AuraEnabled
    public static String createOrUpdateXeroEmployee(Id staffId) {
        try {
            Staff__c staff = [
                SELECT Id, NameToDisplay__c, Name, Last_Name__c, Date_of_Birth__c,
                    Email_Address__c, Contact_Number__c,
                    address__Street__s, address__City__s,
                    address__StateCode__s, Address__CountryCode__s, Address__PostalCode__s,
                    Gender__c, Xero_Employee_ID__c,
                    Job_Title__c,
                    TFN_number__c,
                    Residency_Status__c,
                    Tax_Free_Threshold__c,
                    Superannuation_Name__c,
                    Superannuation_Number__c,
                    Account_Name__c,
                    BSB__c,
                    Account_Number__c,
                    (
                        SELECT Id, Type_of_Job__c, Primary__c
                        FROM StaffRoles__r
                        WHERE Primary__c = true
                        LIMIT 1
                    )
                FROM Staff__c
                WHERE Id = :staffId
                LIMIT 1
            ];

            String employmentBasis = 'FULLTIME';
            if (staff.StaffRoles__r != null && !staff.StaffRoles__r.isEmpty()) {
                SObject primaryRole = staff.StaffRoles__r[0];
                String typeOfJob = (String) primaryRole.get('Type_of_Job__c');
                if (String.isNotBlank(typeOfJob)) {
                    employmentBasis = mapEmploymentBasis(typeOfJob);
                }
            }

            Boolean taxFreeThreshold = true;
            if (String.isNotBlank(staff.Tax_Free_Threshold__c)) {
                taxFreeThreshold = staff.Tax_Free_Threshold__c == 'Yes'
                                || staff.Tax_Free_Threshold__c == 'true'
                                || staff.Tax_Free_Threshold__c == '1';
            }

            String accessToken;
            String tenantId;
            if (Test.isRunningTest()) {
                accessToken = 'dummy_access_id';
                tenantId = 'dummy_access_id';
                System.debug('🔹 TEST MODE: Using dummy access token');
            } else {
                accessToken = getAccessTokenFromXero();
                tenantId = getTenantId(accessToken);
                System.debug('✅ Access token obtained: '
                    + (String.isBlank(accessToken) ? 'EMPTY' : 'PRESENT'));
            }

            String employeeId;
            Boolean isNewEmployee = false;

            if (String.isNotBlank(staff.Xero_Employee_ID__c)) {
                System.debug('🔹 Updating existing Xero employee: ' + staff.Xero_Employee_ID__c);
                employeeId = updateXeroEmployee(
                    accessToken, tenantId, staff, employmentBasis, taxFreeThreshold
                );
            } else {
                System.debug('🔹 Creating new Xero employee');
                isNewEmployee = true;
                employeeId = createXeroEmployee(
                    accessToken, tenantId, staff, employmentBasis, taxFreeThreshold
                );
            }

            if (String.isNotBlank(employeeId)) {
                staff.Xero_Employee_ID__c = employeeId;
                update staff;

                String verb = isNewEmployee ? 'created' : 'updated';
                System.debug('✅ Xero Employee ' + verb + ' with ID: ' + employeeId);
                return '✅ Employee ' + verb + ' in Xero with ID: ' + employeeId;
            } else {
                throw new AuraHandledException('❌ Failed to get Employee ID from Xero');
            }

        } catch (AuraHandledException e) {
            System.debug('❌ AuraHandledException: ' + e.getMessage());
            throw e;

        } catch (Exception e) {
            System.debug('❌ Error syncing Xero employee: ' + e.getMessage());
            throw new AuraHandledException(
                'Error syncing Xero employee: ' + e.getMessage()
            );
        }
    }
        
    public static String createXeroEmployee(String accessToken, String tenantId, Staff__c staff, String employmentBasis, Boolean taxFreeThreshold) {
        Map<String, Object> employeeMap = new Map<String, Object>();
        
        employeeMap.put('FirstName', staff.Name);
        employeeMap.put('LastName', staff.Last_Name__c);
        employeeMap.put('DateOfBirth', '/Date(' + Datetime.newInstanceGmt(staff.Date_of_Birth__c.year(), staff.Date_of_Birth__c.month(), staff.Date_of_Birth__c.day()).getTime() + '+0000)/');
        
        Map<String, Object> addressMap = new Map<String, Object>();
        addressMap.put('AddressLine1', String.isNotBlank(staff.address__Street__s) ? staff.address__Street__s : 'Unknown');
        addressMap.put('City', String.isNotBlank(staff.address__City__s) ? staff.address__City__s : 'Unknown');
        addressMap.put('Region', String.isNotBlank(staff.address__StateCode__s) ? staff.address__StateCode__s : 'NSW');
        addressMap.put('PostalCode', String.isNotBlank(staff.Address__PostalCode__s) ? staff.Address__PostalCode__s : '0000');
        addressMap.put('Country', String.isNotBlank(staff.Address__CountryCode__s) ? staff.Address__CountryCode__s : 'AU');
        employeeMap.put('HomeAddress', addressMap);
        
        employeeMap.put('EmploymentType', 'EMPLOYEE');
        employeeMap.put('IncomeType', 'SALARYANDWAGES');
        
        if (String.isNotBlank(staff.Email_Address__c)) {
            employeeMap.put('Email', staff.Email_Address__c);
        }
        if (String.isNotBlank(staff.Gender__c)) {
            employeeMap.put('Gender', getGenderCode(staff.Gender__c));
        }
        if (String.isNotBlank(staff.Job_Title__c)) {
            employeeMap.put('JobTitle', staff.Job_Title__c);
        }
        
        Map<String, Object> taxDeclaration = new Map<String, Object>();
        taxDeclaration.put('EmploymentBasis', employmentBasis);
        taxDeclaration.put('TaxFreeThresholdClaimed', taxFreeThreshold);
        taxDeclaration.put('ResidencyStatus', String.isNotBlank(staff.Residency_Status__c) ? staff.Residency_Status__c : 'AUSTRALIANRESIDENT');
        
        if (String.isNotBlank(staff.TFN_number__c)) {
            String tfn = staff.TFN_number__c;

            if (String.isNotBlank(tfn)) {
                tfn = tfn.replaceAll('\\s+', '');

                taxDeclaration.put('TaxFileNumber', tfn);
                taxDeclaration.put('TaxScaleType', 'REGULAR');
            }
        } else {
            taxDeclaration.put('TFNExemptionType', 'NOTQUOTED');
        }
        
        employeeMap.put('TaxDeclaration', taxDeclaration);
        
        if (String.isNotBlank(staff.Account_Name__c) || String.isNotBlank(staff.BSB__c) || String.isNotBlank(staff.Account_Number__c)) {
            Map<String, Object> bankAccount = new Map<String, Object>();
            if (String.isNotBlank(staff.Account_Name__c)) {
                bankAccount.put('AccountName', staff.Account_Name__c);
            }
            if (String.isNotBlank(staff.BSB__c)) {
                bankAccount.put('BSB', staff.BSB__c);
            }
            if (String.isNotBlank(staff.Account_Number__c)) {
                bankAccount.put('AccountNumber', staff.Account_Number__c);
            }
            bankAccount.put('StatementText', 'Pay Cheque');
            bankAccount.put('Remainder', true);
            employeeMap.put('BankAccounts', new List<Map<String, Object>>{ bankAccount });
        }
        
        List<Map<String, Object>> bodyList = new List<Map<String, Object>>{ employeeMap };
        String bodyJSON = JSON.serialize(bodyList);
        
        System.debug('🔹 Create Employee Body: ' + bodyJSON);
        
        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://api.xero.com/payroll.xro/1.0/Employees');
        req.setMethod('POST');
        req.setHeader('Authorization', 'Bearer ' + accessToken);
        req.setHeader('Xero-tenant-id', tenantId);
        req.setHeader('Accept', 'application/json');
        req.setHeader('Content-Type', 'application/json');
        req.setBody(bodyJSON);
        
        Http http = new Http();
        HttpResponse res = http.send(req);
        
        System.debug('🔹 Create Response Status: ' + res.getStatusCode());
        System.debug('🔹 Create Response Body: ' + res.getBody());
        
        if (res.getStatusCode() != 200 && res.getStatusCode() != 201) {
            throw new AuraHandledException('❌ Xero Create API Error: ' + res.getBody());
        }
        
        Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
        List<Object> employees = (List<Object>) result.get('Employees');
        
        if (employees == null || employees.isEmpty()) {
            throw new AuraHandledException('❌ No Employees returned in Xero response.');
        }
        
        Map<String, Object> employeeData = (Map<String, Object>) employees[0];
        return (String) employeeData.get('EmployeeID');
    }

    public static String updateXeroEmployee(
        String accessToken,
        String tenantId,
        Staff__c staff,
        String employmentBasis,
        Boolean taxFreeThreshold
    ) {
        if (String.isBlank(staff.Xero_Employee_ID__c)) {
            throw new AuraHandledException(
                '❌ Cannot update Xero employee: Xero_Employee_ID__c is blank.'
            );
        }

        String xeroEmployeeId = staff.Xero_Employee_ID__c;

        Map<String, Object> employeeMap = new Map<String, Object>();

        employeeMap.put('EmployeeID', xeroEmployeeId);
        employeeMap.put('FirstName',  staff.Name);
        employeeMap.put('LastName',   staff.Last_Name__c);

        // 🔹 DOB — required
        employeeMap.put(
            'DateOfBirth',
            '/Date(' +
            Datetime.newInstanceGmt(
                staff.Date_of_Birth__c.year(),
                staff.Date_of_Birth__c.month(),
                staff.Date_of_Birth__c.day()
            ).getTime() + '+0000)/'
        );

        // ============================================================
        // 🔹 HOME ADDRESS  (required with fallbacks)
        // ============================================================
        Map<String, Object> addressMap = new Map<String, Object>();
        addressMap.put('AddressLine1',
            String.isNotBlank(staff.address__Street__s)
                ? staff.address__Street__s : 'Unknown'
        );
        addressMap.put('City',
            String.isNotBlank(staff.address__City__s)
                ? staff.address__City__s : 'Unknown'
        );
        addressMap.put('Region',
            String.isNotBlank(staff.address__StateCode__s)
                ? staff.address__StateCode__s : 'NSW'
        );
        addressMap.put('PostalCode',
            String.isNotBlank(staff.Address__PostalCode__s)
                ? staff.Address__PostalCode__s : '0000'
        );
        addressMap.put('Country',
            String.isNotBlank(staff.Address__CountryCode__s)
                ? staff.Address__CountryCode__s : 'AU'
        );
        employeeMap.put('HomeAddress', addressMap);

        // 🔹 REQUIRED for Xero Payroll AU updates
        employeeMap.put('EmploymentType', 'EMPLOYEE');
        employeeMap.put('IncomeType',     'SALARYANDWAGES');

        // 🔹 Optional fields
        if (String.isNotBlank(staff.Email_Address__c)) {
            employeeMap.put('Email', staff.Email_Address__c);
        }
        if (String.isNotBlank(staff.Gender__c)) {
            employeeMap.put('Gender', getGenderCode(staff.Gender__c));
        }
        if (String.isNotBlank(staff.Job_Title__c)) {
            employeeMap.put('JobTitle', staff.Job_Title__c);
        }

        // ============================================================
        // 🔹 TAX DECLARATION
        // ============================================================
        Map<String, Object> taxDeclaration = new Map<String, Object>();
        taxDeclaration.put('EmploymentBasis', employmentBasis);
        taxDeclaration.put('TaxFreeThresholdClaimed', taxFreeThreshold);
        taxDeclaration.put('ResidencyStatus',
            String.isNotBlank(staff.Residency_Status__c)
                ? staff.Residency_Status__c : 'AUSTRALIANRESIDENT'
        );

        if (String.isNotBlank(staff.TFN_number__c)) {
            String tfn = staff.TFN_number__c.replaceAll('\\s+', '');
            taxDeclaration.put('TaxFileNumber', tfn);
            taxDeclaration.put('TaxScaleType',  'REGULAR');
        } else {
            taxDeclaration.put('TFNExemptionType', 'NOTQUOTED');
        }

        employeeMap.put('TaxDeclaration', taxDeclaration);


            Map<String, Object> bankAccount = new Map<String, Object>();
            bankAccount.put('AccountName',   staff.Account_Name__c);
            bankAccount.put('BSB',           staff.BSB__c);
            bankAccount.put('AccountNumber', staff.Account_Number__c);
            bankAccount.put('StatementText', 'Pay Cheque');
            bankAccount.put('Remainder',     true);

            employeeMap.put('BankAccounts',
                new List<Map<String, Object>>{ bankAccount }
            );

        // ============================================================
        // 🔹 SERIALIZE + SEND
        // ============================================================
        List<Map<String, Object>> bodyList =
            new List<Map<String, Object>>{ employeeMap };
        String bodyJSON = JSON.serialize(bodyList);

        System.debug('🔹 Update Employee Body: ' + bodyJSON);

        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://api.xero.com/payroll.xro/1.0/Employees');
        req.setMethod('POST');
        req.setHeader('Authorization',   'Bearer ' + accessToken);
        req.setHeader('Xero-tenant-id',  tenantId);
        req.setHeader('Accept',          'application/json');
        req.setHeader('Content-Type',    'application/json');
        req.setBody(bodyJSON);

        Http http = new Http();
        HttpResponse res = http.send(req);

        System.debug('🔹 Update Response Status: ' + res.getStatusCode());
        System.debug('🔹 Update Response Body: '   + res.getBody());

        // ============================================================
        // 🔹 ERROR HANDLING  —  extract + throw as AuraHandledException
        // ============================================================
        if (res.getStatusCode() != 200 && res.getStatusCode() != 201) {

            // 1) Recursively harvest every "Message" key from the response.
            String detailedError = extractXeroError(res.getBody());

            // 2) Build the final message.
            String finalMessage =
                '❌ Xero Update API Error: ' + detailedError;

            // 3) Log for debugging.
            System.debug('❌ Final Aura error message: ' + finalMessage);
            System.debug('❌ Raw Xero response body:    ' + res.getBody());

            // 4) Attach the message explicitly and throw.
            AuraHandledException ahe = new AuraHandledException(finalMessage);
            ahe.setMessage(finalMessage);
            throw ahe;
        }

        // ============================================================
        // 🔹 PARSE SUCCESS RESPONSE
        // ============================================================
        Map<String, Object> result =
            (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
        List<Object> employees = (List<Object>) result.get('Employees');

        if (employees == null || employees.isEmpty()) {
            throw new AuraHandledException(
                '❌ No Employees returned in Xero update response.'
            );
        }

        Map<String, Object> employeeData =
            (Map<String, Object>) employees[0];
        return (String) employeeData.get('EmployeeID');
    }
    
    public static String mapEmploymentBasis(String value) {
        if (String.isBlank(value)) return 'FULLTIME';
        
        String upperValue = value.toUpperCase();
        
        if (upperValue.contains('FULL') || upperValue.contains('FULL-TIME')) {
            return 'FULLTIME';
        } else if (upperValue.contains('PART') || upperValue.contains('PART-TIME')) {
            return 'PARTTIME';
        } else if (upperValue.contains('CASUAL')) {
            return 'CASUAL';
        } else if (upperValue.contains('LABOUR') || upperValue.contains('HIRE')) {
            return 'LABOURHIRE';
        } else if (upperValue.contains('NON') || upperValue.contains('NON-EMPLOYEE')) {
            return 'NONEMPLOYEE';
        } else {
            return 'FULLTIME';
        }
    }
    
    public static String getGenderCode(String gender) {
        if (gender == 'Male') return 'M';
        if (gender == 'Female') return 'F';
        if (gender == 'Not Specified') return 'N';
        if (gender == 'Indeterminate/Intersex/Unspecified') return 'I';
        return null;
    }
    
    // STEP Get Contacts
    @AuraEnabled
    public static List<Map<String, Object>> getXeroContacts() {
        String accessToken;
        String tenantId;            
        if (Test.isRunningTest()) {
            accessToken = 'dummy_access_id';
            tenantId = 'dummy_access_id';
            System.debug('🔹 TEST MODE: Using dummy access token');
        } else {
            accessToken = getAccessTokenFromXero();
            tenantId = getTenantId(accessToken);
            System.debug('✅ Access token obtained: ' + (String.isBlank(accessToken) ? 'EMPTY' : 'PRESENT'));
        }
        
        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://api.xero.com/api.xro/2.0/Contacts');
        req.setMethod('GET');
        req.setHeader('Authorization', 'Bearer ' + accessToken);
        req.setHeader('Xero-tenant-id', tenantId);
        req.setHeader('Accept', 'application/json');
        
        Http http = new Http();
        HTTPResponse res = http.send(req);
        
        System.debug('🔹 Contacts Response: ' + res.getBody());
        
        if (res.getStatusCode() == 200) {
            Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            List<Object> contactsRaw = (List<Object>) result.get('Contacts');
            
            List<Map<String, Object>> contacts = new List<Map<String, Object>>();
            for (Object empObj : contactsRaw) {
                contacts.add((Map<String, Object>) empObj);
            }
            
            System.debug('✅ Contacts Count: ' + contacts.size());
            return contacts;
        } else {
            throw new AuraHandledException('❌ Failed to fetch Xero Contact: ' + res.getBody());
        }
    }
    
    // STEP Post Contacts
    @AuraEnabled
    public static String createOrUpdateXeroContacts(Id entityId) {
        try {
            Xero_Entity__c entity = [
                SELECT Id,First_Name__c,Last_Name__c, Email__c, Contact__c,ABN__c,Card_Type__c,Organization__c,Xero_Contact_Id__c,Address_Latest__Street__s ,Address_Latest__City__s ,Address_Latest__StateCode__s,
                Address_Latest__CountryCode__s,Address_Latest__PostalCode__s 
                FROM Xero_Entity__c
                WHERE Id = :entityId
                LIMIT 1
            ];
            
            String accessToken;
            String tenantId;            
            if (Test.isRunningTest()) {
                accessToken = 'dummy_access_id';
                tenantId = 'dummy_access_id';
                System.debug('🔹 TEST MODE: Using dummy access token');
            } else {
                accessToken = getAccessTokenFromXero();
                tenantId = getTenantId(accessToken);
                System.debug('✅ Access token obtained: ' + (String.isBlank(accessToken) ? 'EMPTY' : 'PRESENT'));
            }
            
            Map<String, Object> contactMap = new Map<String, Object>{
                'Name' =>  entity.First_Name__c + ' ' + entity.Last_Name__c,
                    'FirstName' => String.isNotBlank(entity.First_Name__c) ? entity.First_Name__c : '',
                        
                        'LastName' => String.isNotBlank(entity.Last_Name__c)  ? entity.Last_Name__c : '',
                            'EmailAddress' => entity.Email__c,
                            'Addresses' => new List<Map<String, Object>>{
                                new Map<String, Object>{
                                    'AddressType' => 'POBOX', 
                                        'AddressLine1' => entity.Address_Latest__Street__s,
                                        'City' => entity.Address_Latest__City__s,
                                        'Region' => entity.Address_Latest__StateCode__s,
                                        'PostalCode' => entity.Address_Latest__PostalCode__s,
                                        'Country' => entity.Address_Latest__CountryCode__s
                                        }
                            },
                                
                                'Phones' => new List<Map<String, Object>>{
                                    new Map<String, Object>{
                                        'PhoneType' => 'MOBILE',
                                            'PhoneNumber' => entity.Contact__c
                                            }
                                },
                                    'TaxNumber' => entity.ABN__c
                                    };
                                        
                                        System.debug('📦 Contact Map: ' + JSON.serializePretty(contactMap));
            Map<String, Object> requestBody = new Map<String, Object>{
                'Contacts' => new List<Object>{ contactMap }
            };
                String bodyJSON = JSON.serialize(requestBody);
            System.debug('📤 Final JSON Body to send to Xero:\n' + bodyJSON);
            
            HttpRequest req = new HttpRequest();
            req.setEndpoint('https://api.xero.com/api.xro/2.0/Contacts');
            req.setMethod('POST');
            req.setHeader('Authorization', 'Bearer ' + accessToken);
            req.setHeader('Xero-tenant-id', tenantId);
            req.setHeader('Accept', 'application/json');
            req.setHeader('Content-Type', 'application/json');
            req.setBody(bodyJSON);
            
            Http http = new Http();
            HttpResponse res = http.send(req);
            
            System.debug('🔹 Xero Response: ' + res.getBody());
            
            if (res.getStatusCode() == 200 || res.getStatusCode() == 201) {
                Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                List<Object> contacts = (List<Object>) result.get('Contacts');
                
                if (!contacts.isEmpty()) {
                    Map<String, Object> contactsData = (Map<String, Object>) contacts[0];
                    String contactId = (String) contactsData.get('ContactID');
                    
                    entity.Xero_Contact_Id__c = contactId;
                    update entity;
                    
                    System.debug('✅ Xero contactId saved in Entity: ' + contactId);
                    return '✅ Contact created in Xero with ID: ' + contactId;
                } else {
                    throw new AuraHandledException('❌ No Contact returned in Xero response.');
                }
            } else {
                throw new AuraHandledException('❌ Xero API Error: ' + res.getBody());
            }
            
        } catch (Exception e) {
            System.debug('❌ Error creating Xero Contact: ' + e.getMessage());
            throw new AuraHandledException('Error creating Xero Contact: ' + e.getMessage());
        }
    }
    
    // STEP Save Entity
    @AuraEnabled
    public static void saveEntity(Map<String, Object> entityData, String orgId) {

        System.debug('🚀 ENTER saveEntity()');
        System.debug('📥 Incoming entityData → ' + JSON.serialize(entityData));
        System.debug('🏢 orgId → ' + orgId);

        Xero_Entity__c newEntity = new Xero_Entity__c();

        newEntity.First_Name__c = (String)entityData.get('firstName');
        newEntity.Last_Name__c = (String)entityData.get('lastName');
        newEntity.Email__c = (String)entityData.get('email');
        newEntity.Contact__c = (String)entityData.get('contactNo');
        newEntity.ABN__c = (String)entityData.get('abn');
        newEntity.Card_Type__c = 'Customer';
        newEntity.Organization__c = orgId;

        System.debug('📝 Basic Mapped Fields: '
            + ' firstName=' + newEntity.First_Name__c
            + ', lastName=' + newEntity.Last_Name__c
            + ', email=' + newEntity.Email__c
            + ', contact=' + newEntity.Contact__c
            + ', abn=' + newEntity.ABN__c
        );

            newEntity.Xero_Contact_Id__c = (String)entityData.get('xeroId');
            System.debug('🔗 Using XERO Contact ID → ' + newEntity.Xero_Contact_Id__c);

        Object addressObj = entityData.get('address');
        System.debug('📦 Raw Address Object → ' + addressObj);

        if (addressObj != null && addressObj instanceof Map<Object, Object>) { Map<Object, Object> rawAddress = (Map<Object, Object>)addressObj; for (Object key : rawAddress.keySet()) {
                System.debug('   ' + key + ' → ' + rawAddress.get(key));
            }

            Map<String, Object> address = new Map<String, Object>();
            for (Object key : rawAddress.keySet()) {
                address.put(String.valueOf(key), rawAddress.get(key));
            }

            System.debug('🏠 Parsed Address Map → ' + address);

            newEntity.Address_Latest__Street__s = (String)address.get('street');
            newEntity.Address_Latest__City__s = (String)address.get('city');
            newEntity.Address_Latest__StateCode__s = (String)address.get('province');
            newEntity.Address_Latest__PostalCode__s = (String)address.get('postalCode');
            newEntity.Address_Latest__CountryCode__s = 'AU';

            System.debug('🏠 Final Entity Address → '
                + newEntity.Address_Latest__Street__s + ', '
                + newEntity.Address_Latest__City__s + ', '
                + newEntity.Address_Latest__StateCode__s + ' '
                + newEntity.Address_Latest__PostalCode__s + ' (AU)'
            );
        }
        else {
            System.debug('⚠️ No valid address found → skipping address mapping.');
        }

        System.debug('📤 FINAL Xero_Entity__c object before insert → ' + newEntity);

        insert newEntity;

        System.debug('✅ INSERT SUCCESSFUL — New Entity ID → ' + newEntity.Id);
    }
    
    // get Xero Entity
    @AuraEnabled
    public static List<Xero_Entity__c> fetchXeroEntityList(String orgId) {
        try {
            
            List<Xero_Entity__c> entityList = [
                SELECT Id,First_Name__c,Last_Name__c, Email__c, Contact__c,ABN__c,Card_Type__c,Organization__c,Xero_Contact_Id__c  FROM Xero_Entity__c
                Where Organization__c =: orgId And Xero_Contact_Id__c != null
            ];
            
            System.debug('✅ Entity records fetched: ' + entityList.size());
            return entityList;
            
        } catch (Exception e) {
            System.debug('❌ Error fetching Entity list: ' + e.getMessage());
            throw new AuraHandledException('Error fetching Entity list: ' + e.getMessage());
        }
    }
    
    // get Xero EmployeeIds
    @AuraEnabled
    public static void updateXeroEmployeeIds(List<Map<String, String>> staffMappings) {
        if (staffMappings == null || staffMappings.isEmpty()) return;

        Map<Id, Map<String, String>> incomingMap = new Map<Id, Map<String, String>>();
        for (Map<String, String> entry : staffMappings) {
            String staffId = entry.get('systemStaffId');
            system.debug('staffId >>>>>'+ staffId);
            String xeroId = entry.get('xeroEmployeeId');
            system.debug('xeroId >>>>>'+ xeroId);
            String ordinaryEarningsRateId = entry.get('ordinaryEarningsRateId');
            system.debug('ordinaryEarningsRateId >>>>>'+ ordinaryEarningsRateId);

            if (String.isNotBlank(staffId) && String.isNotBlank(xeroId)) {
                incomingMap.put(Id.valueOf(staffId), new Map<String, String>{
                    'xeroId' => xeroId,
                    'ordinaryEarningsRateId' => ordinaryEarningsRateId
                });
            }
        }

        if (incomingMap.isEmpty()) return;

        List<Staff__c> existingStaffs = [
            SELECT Id, Xero_Employee_ID__c, Ordinary_Earnings_Rate_ID__c
            FROM Staff__c
            WHERE Id IN :incomingMap.keySet()
        ];

        List<Staff__c> staffToUpdate = new List<Staff__c>();

        for (Staff__c staff : existingStaffs) {
            Map<String, String> incoming = incomingMap.get(staff.Id);
            String newXeroId = incoming.get('xeroId');
            String newOrdinaryRateId = incoming.get('ordinaryEarningsRateId');

            Boolean needsUpdate = false;

            if (String.isNotBlank(newXeroId)
                && staff.Xero_Employee_ID__c != newXeroId) {

                staff.Xero_Employee_ID__c = newXeroId;
                needsUpdate = true;
            }


            if (String.isNotBlank(newOrdinaryRateId)
                && staff.Ordinary_Earnings_Rate_ID__c != newOrdinaryRateId) {

                staff.Ordinary_Earnings_Rate_ID__c = newOrdinaryRateId;
                needsUpdate = true;
            }


            if (needsUpdate) {
                staffToUpdate.add(staff);
            }
        }

        if (!staffToUpdate.isEmpty()) {
            try {
                update staffToUpdate;
                System.debug('✅ Updated Staff Records Count: ' + staffToUpdate.size());
            } catch (DmlException e) {
                System.debug('❌ Failed to update Staff: ' + e.getMessage());
                throw new AuraHandledException('Failed to update Staff records: ' + e.getMessage());
            }
        } else {
            System.debug('ℹ️ No Staff records required update.');
        }
    }

    
    // STEP Post Invoice
    @AuraEnabled
    public static String createOrUpdateXeroInvoice(Id invoiceId, String accountId) {
        try {
            System.debug('invoiceId: ' + invoiceId);
            System.debug('accountId: ' + accountId);
            
            Xero_or_Myob_Invoice__c invoice = [
                SELECT Id, Invoice_Date__c, Name, Invoice_No__c, Invoice_Source__c, Is_Create_Manage_Invoice__c,Participant__c,
                    Is_Service_Invoice__c, Total_Amount__c, Xero_Innvoice_Id__c, 
                    Xero_Entity__c, Xero_Entity__r.First_Name__c,
                    Xero_Entity__r.Last_Name__c, Xero_Entity__r.Xero_Contact_Id__c,
                    (SELECT Id, Description__c, Invoice_Date__c, Line_Items__c, 
                            Quantity__c, Sub_Total__c, Tax_Amount__c,
                            Total_Amount__c, Tax_Inclusive__c, Unit_Price__c 
                        FROM Xero_Invoice_Entries__r 
                        ORDER BY Sl_no__c ASC NULLS LAST),
                    (SELECT Id, Service_Type__c, Service_Type__r.Support_Item_Number__c, 
                            Service_Type__r.Name,
                            Participant_Name__c, Client__c, Client__r.NDIS_Participant_ID__c,
                            Client__r.Name
                        FROM Services_and_Support_Plans__r)
                FROM Xero_or_Myob_Invoice__c
                WHERE Id = :invoiceId AND Invoice_Source__c = 'Xero'
                LIMIT 1
            ];

            Boolean isAdhocInvoice = invoice.Is_Create_Manage_Invoice__c == true && invoice.Participant__c == null;
            System.debug(' isAdhocInvoice: ' + isAdhocInvoice);
            
            String accessToken;
            String tenantId;            
            if (Test.isRunningTest()) {
                accessToken = 'dummy_access_id';
                tenantId = 'dummy_access_id';
                System.debug('🔹 TEST MODE: Using dummy access token');
            } else {
                accessToken = getAccessTokenFromXero();
                tenantId = getTenantId(accessToken);
                System.debug('✅ Access token obtained: ' + (String.isBlank(accessToken) ? 'EMPTY' : 'PRESENT'));
            }
            
            String accountCode = '200';
            String taxType = 'EXEMPTOUTPUT';
            
            if (String.isNotBlank(accountId)) {
                Map<String, Object> accountDetails = getXeroAccountDetails(accessToken, tenantId, accountId);
                if (accountDetails != null) {
                    String fetchedAccountCode = (String) accountDetails.get('Code');
                    if (String.isNotBlank(fetchedAccountCode)) {
                        accountCode = fetchedAccountCode;
                    }
                    String fetchedTaxType = (String) accountDetails.get('TaxType');
                    if (String.isNotBlank(fetchedTaxType)) {
                        taxType = fetchedTaxType;
                    }
                    System.debug('✅ Using account: ' + accountCode + ' - ' + accountDetails.get('Name'));
                }
            }
            
            String invoiceDateStr = invoice.Invoice_Date__c != null
                ? DateTime.newInstance(invoice.Invoice_Date__c, Time.newInstance(0, 0, 0, 0)).format('yyyy-MM-dd\'T\'HH:mm:ss\'Z\'', 'GMT') 
                : DateTime.now().format('yyyy-MM-dd\'T\'HH:mm:ss\'Z\'', 'GMT');
            
            List<Xero_Invoice_Entries__c> entries = invoice.Xero_Invoice_Entries__r;
            List<Services_and_Support_Plan__c> services = invoice.Services_and_Support_Plans__r;
            List<Map<String, Object>> lineItems = new List<Map<String, Object>>();
            
            Map<String, Boolean> processedItems = new Map<String, Boolean>();
            
            for (Integer i = 0; i < entries.size(); i++) {
                Xero_Invoice_Entries__c entry = entries[i];
                String supportItemNumber = null;
                String enhancedDescription = entry.Description__c;
                
                System.debug('🔍 Original Description [' + i + ']: ' + enhancedDescription);
                
                if (i < services.size() && services[i] != null) {
                    Services_and_Support_Plan__c service = services[i];
                    
                    if (service.Service_Type__r != null) {
                        supportItemNumber = service.Service_Type__r.Support_Item_Number__c;
                    }
                    
                    String participantName = null;
                    String ndisNumber = null;
                    
                    if (service.Client__r != null) {
                        participantName = service.Client__r.Name;
                        ndisNumber = service.Client__r.NDIS_Participant_ID__c;
                    } else if (String.isNotBlank(service.Participant_Name__c)) {
                        participantName = service.Participant_Name__c;
                    }
                    
                    if (String.isNotBlank(participantName) || String.isNotBlank(ndisNumber)) {
                        
                        Boolean hasNdisInfo = false;
                        if (String.isNotBlank(ndisNumber) && enhancedDescription.contains('NDIS Number: ' + ndisNumber)) {
                            hasNdisInfo = true;
                        }
                        
                        if (!hasNdisInfo) {
                            String ndisInfo = '';
                            
                            if (String.isNotBlank(participantName) && String.isNotBlank(ndisNumber)) {
                                if (enhancedDescription.contains(participantName)) {
                                    if (!enhancedDescription.contains('NDIS Number:')) {
                                        Integer nameIndex = enhancedDescription.indexOf(participantName);
                                        if (nameIndex >= 0) {
                                            Integer endOfName = nameIndex + participantName.length();
                                            ndisInfo = ' (NDIS Number: ' + ndisNumber + ')';
                                            enhancedDescription = enhancedDescription.substring(0, endOfName) + ndisInfo + enhancedDescription.substring(endOfName);
                                        }
                                    }
                                } else {
                                    ndisInfo = ' for ' + participantName + ' (NDIS Number: ' + ndisNumber + ')';
                                    enhancedDescription = enhancedDescription + ndisInfo;
                                }
                            }
                            else if (String.isNotBlank(participantName) && !enhancedDescription.contains(participantName)) {
                                ndisInfo = ' for ' + participantName;
                                enhancedDescription = enhancedDescription + ndisInfo;
                            }
                            else if (String.isNotBlank(ndisNumber) && !enhancedDescription.contains('NDIS Number: ' + ndisNumber)) {
                                ndisInfo = ' (NDIS Number: ' + ndisNumber + ')';
                                enhancedDescription = enhancedDescription + ndisInfo;
                            }
                        }
                    }
                }
                if (String.isBlank(supportItemNumber) && String.isNotBlank(entry.Line_Items__c)) {
                    supportItemNumber = entry.Line_Items__c;
                    System.debug(' Line_Items__c as supportItemNumber [' + i + ']: ' + supportItemNumber);
                }
                
                System.debug('🔍 Enhanced Description [' + i + ']: ' + enhancedDescription);
                
                if (String.isNotBlank(supportItemNumber) && !processedItems.containsKey(supportItemNumber)) {
                    System.debug('🔵 Processing Support Item Number: ' + supportItemNumber);
                    System.debug('🔵 Account Code: ' + accountCode + ' | Tax Type: ' + taxType);

                    Boolean itemExists = checkXeroItem(accessToken, tenantId, supportItemNumber);
                    System.debug('🟦 checkXeroItem result for "' + supportItemNumber + '": ' + itemExists);

                    if (!itemExists) {
                        System.debug('🟨 Item "' + supportItemNumber + '" does NOT exist in Xero. Attempting to create...');
                        try {
                            createXeroItem(accessToken, tenantId, supportItemNumber, accountCode, taxType);
                            System.debug('🟩 Successfully created Xero item: ' + supportItemNumber);
                        } catch (Exception itemEx) {
                            System.debug('❌ ERROR creating Xero item "' + supportItemNumber + '": ' + itemEx.getMessage());
                            System.debug('❌ Stack trace: ' + itemEx.getStackTraceString());
                            throw itemEx;
                        }
                    } else {
                        System.debug('🟩 Item "' + supportItemNumber + '" already exists in Xero — skipping creation.');
                    }

                    processedItems.put(supportItemNumber, true);
                    System.debug('🔵 Marked "' + supportItemNumber + '" as processed. Total processed so far: ' + processedItems.size());

                } else {
                    if (String.isBlank(supportItemNumber)) {
                        System.debug('⚠️ Skipped: supportItemNumber is blank/null.');
                    } else if (processedItems.containsKey(supportItemNumber)) {
                        System.debug('⚠️ Skipped: "' + supportItemNumber + '" was already processed in this run.');
                    }
                }
                Decimal safeQuantity = entry.Quantity__c != null ? entry.Quantity__c : 0;
                Decimal safeUnitPrice = entry.Unit_Price__c != null ? entry.Unit_Price__c : 0;
                
                Map<String, Object> lineItem = new Map<String, Object>{
                    'Description'   => enhancedDescription,
                    'Quantity'      => safeQuantity,
                    'UnitAmount'    => safeUnitPrice,
                    'AccountCode'   => accountCode,
                    'TaxType'       => taxType
                };
                
                if (String.isNotBlank(supportItemNumber)) {
                    lineItem.put('ItemCode', supportItemNumber);
                }
                
                lineItems.add(lineItem);
            }
            
            Map<String, Object> xeroInvoiceMap = new Map<String, Object>{
                'Type' => 'ACCREC',
                'Contact' => new Map<String, Object>{
                    'ContactID' => invoice.Xero_Entity__r.Xero_Contact_Id__c
                },
                'Date' => invoice.Invoice_Date__c,
                'DateString' => invoiceDateStr,
                'InvoiceNumber' => invoice.Invoice_No__c,
                'LineAmountTypes' => 'Inclusive',
                'LineItems' => lineItems
            };
            
            System.debug('📦 xeroInvoiceMap: ' + JSON.serializePretty(xeroInvoiceMap));
            
            Map<String, Object> invoiceWrapper = new Map<String, Object>{
                'Invoices' => new List<Object>{ xeroInvoiceMap }
            };
            String bodyJSON = JSON.serialize(invoiceWrapper);
            System.debug('📤 Final JSON Body to send to Xero:\n' + bodyJSON);
            
            HttpRequest req = new HttpRequest();
            req.setEndpoint('https://api.xero.com/api.xro/2.0/Invoices');
            req.setMethod('POST');
            req.setHeader('Authorization', 'Bearer ' + accessToken);
            req.setHeader('Xero-tenant-id', tenantId);
            req.setHeader('Accept', 'application/json');
            req.setHeader('Content-Type', 'application/json');
            req.setBody(bodyJSON);
            
            Http http = new Http();
            HttpResponse res = http.send(req);
            
            System.debug('🔹 Xero Response: ' + res.getBody());
            
            if (res.getStatusCode() == 200 || res.getStatusCode() == 201) {
                Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                List<Object> invoices = (List<Object>) result.get('Invoices');
                
                if (!invoices.isEmpty()) {
                    Map<String, Object> invoiceData = (Map<String, Object>) invoices[0];
                    String xeroInvoiceId = (String) invoiceData.get('InvoiceID');
                    
                    invoice.Xero_Innvoice_Id__c = xeroInvoiceId;
                    update invoice;
                    
                    System.debug('✅ Xero invoiceId saved in invoice: ' + invoiceId);
                    return '✅ invoice created in Xero with ID: ' + invoiceId;
                } else {
                    throw new AuraHandledException('❌ No invoice returned in Xero response.');
                }
            } else {
                throw new AuraHandledException('❌ Xero API Error: ' + res.getBody());
            }
            
        } catch (Exception e) {
            System.debug('❌ Error creating Xero invoice: ' + e.getMessage());
            throw new AuraHandledException('Error creating Xero invoice: ' + e.getMessage());
        }
    }

    public static Map<String, Object> getXeroAccountDetails(String accessToken, String tenantId, String accountId) {
        try {
            HttpRequest req = new HttpRequest();
            req.setEndpoint('https://api.xero.com/api.xro/2.0/Accounts/' + accountId);
            req.setMethod('GET');
            req.setHeader('Authorization', 'Bearer ' + accessToken);
            req.setHeader('Xero-tenant-id', tenantId);
            req.setHeader('Accept', 'application/json');
            
            Http http = new Http();
            HttpResponse res = http.send(req);
            
            if (res.getStatusCode() == 200) {
                Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                List<Object> accounts = (List<Object>) result.get('Accounts');
                if (accounts != null && !accounts.isEmpty()) {
                    return (Map<String, Object>) accounts[0];
                }
            }
            return null;
        } catch (Exception e) {
            System.debug('⚠️ Error fetching account details: ' + e.getMessage());
            return null;
        }
    }
    
    public static Boolean checkXeroItem(String accessToken, String tenantId, String itemCode) {
        try {
            String endpoint = 'https://api.xero.com/api.xro/2.0/Items/' + EncodingUtil.urlEncode(itemCode, 'UTF-8');
            
            HttpRequest req = new HttpRequest();
            req.setEndpoint(endpoint);
            req.setMethod('GET');
            req.setHeader('Authorization', 'Bearer ' + accessToken);
            req.setHeader('Xero-tenant-id', tenantId);
            req.setHeader('Accept', 'application/json');
            
            Http http = new Http();
            HttpResponse res = http.send(req);
            
            System.debug('🔹 Check Item Response for ' + itemCode + ': ' + res.getStatusCode());
            
            if (res.getStatusCode() == 200) {
                Map<String, Object> response = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                List<Object> items = (List<Object>) response.get('Items');
                return items != null && !items.isEmpty();
            } else if (res.getStatusCode() == 404) {
                return false;
            } else {
                System.debug('⚠️ Error checking item: ' + res.getBody());
                return false;
            }
        } catch (Exception e) {
            System.debug('❌ Error checking item existence: ' + e.getMessage());
            return false;
        }
    }

    public static void createXeroItem(String accessToken, String tenantId, String itemCode, 
                                    String accountCode, String taxType) {
        try {
            Map<String, Object> itemMap = new Map<String, Object>{
                'Code' => itemCode,
                'Name' => itemCode,
                'Description' => 'Item: ' + itemCode
            };
            
            Map<String, Object> salesDetails = new Map<String, Object>{
                'UnitPrice' => 0.00,
                'AccountCode' => accountCode,
                'TaxType' => taxType
            };
            
            itemMap.put('SalesDetails', salesDetails);
            
            Map<String, Object> itemsWrapper = new Map<String, Object>{
                'Items' => new List<Object>{ itemMap }
            };
            
            String bodyJSON = JSON.serialize(itemsWrapper);
            System.debug('📤 Creating Xero Item with Support_Item_Number__c: ' + bodyJSON);
            
            HttpRequest req = new HttpRequest();
            req.setEndpoint('https://api.xero.com/api.xro/2.0/Items');
            req.setMethod('POST');
            req.setHeader('Authorization', 'Bearer ' + accessToken);
            req.setHeader('Xero-tenant-id', tenantId);
            req.setHeader('Accept', 'application/json');
            req.setHeader('Content-Type', 'application/json');
            req.setBody(bodyJSON);
            
            Http http = new Http();
            HttpResponse res = http.send(req);
            
            if (res.getStatusCode() == 200 || res.getStatusCode() == 201) {
                System.debug('✅ Item created successfully with Support_Item_Number__c: ' + itemCode);
            } else {
                System.debug('⚠️ Failed to create item: ' + res.getBody());
                throw new AuraHandledException('Failed to create Xero item: ' + res.getBody());
            }
            
        } catch (Exception e) {
            System.debug('❌ Error creating Xero item: ' + e.getMessage());
            throw new AuraHandledException('Error creating Xero item: ' + e.getMessage());
        }
    }
    
    @AuraEnabled
    public static void updateXeroEntityIds(List<Map<String, String>> entityMappings) {

        System.debug('🚀 ===== updateXeroEntityIds START =====');
        System.debug('📥 Incoming entityMappings → ' + entityMappings);

        if (entityMappings == null || entityMappings.isEmpty()) {
            System.debug('⚠️ No entity mappings provided. Exiting.');
            return;
        }

        System.debug('🔹 STEP 1 — Build Incoming Map');

        Map<Id, String> incomingMap = new Map<Id, String>();

        for (Map<String, String> entry : entityMappings) {

            System.debug('➡️ Processing entry → ' + entry);

            String entityId = entry.get('systemEntityId');
            String xeroId   = entry.get('xeroEntityId');

            System.debug('   systemEntityId → ' + entityId);
            System.debug('   xeroEntityId → ' + xeroId);

            if (String.isNotBlank(entityId) && String.isNotBlank(xeroId)) {

                Id sfId = Id.valueOf(entityId);
                incomingMap.put(sfId, xeroId);

                System.debug('✅ Added to incomingMap → ' + sfId + ' → ' + xeroId);

            } else {
                System.debug('⚠️ Skipped entry due to blank values');
            }
        }

        System.debug('📦 Final incomingMap → ' + incomingMap);

        if (incomingMap.isEmpty()) {
            System.debug('⚠️ incomingMap is empty. Nothing to process.');
            return;
        }

        System.debug('🔹 STEP 2 — Query Existing Xero_Entity__c Records');

        List<Xero_Entity__c> existingXeroEntities = [
            SELECT Id, Xero_Contact_Id__c
            FROM Xero_Entity__c
            WHERE Id IN :incomingMap.keySet()
        ];

        System.debug('📊 Records fetched → ' + existingXeroEntities.size());
        System.debug('📄 Existing records → ' + existingXeroEntities);


        List<Xero_Entity__c> entitiesToUpdate = new List<Xero_Entity__c>();

        System.debug('🔹 STEP 3 — Determine Which Records Need Update');

        for (Xero_Entity__c entity : existingXeroEntities) {

            String existingXeroId = entity.Xero_Contact_Id__c;
            String newXeroId = incomingMap.get(entity.Id);

            System.debug('🔍 Checking Entity → ' + entity.Id);
            System.debug('   Existing Xero ID → ' + existingXeroId);
            System.debug('   Incoming Xero ID → ' + newXeroId);

            entity.Xero_Contact_Id__c = newXeroId;
            entitiesToUpdate.add(entity);

            System.debug('✅ Marked for update → ' + entity.Id);           
        }

        System.debug('📦 entitiesToUpdate Count → ' + entitiesToUpdate.size());
        System.debug('📄 entitiesToUpdate → ' + entitiesToUpdate);

        System.debug('🔹 STEP 4 — Perform DML Update');

        if (!entitiesToUpdate.isEmpty()) {

            try {

                System.debug('➡️ Updating records...');
                update entitiesToUpdate;

                System.debug('✅ Update successful');

            } catch (DmlException e) {

                System.debug('💥 DML ERROR');
                System.debug('❌ Message → ' + e.getMessage());
                System.debug('📍 Stack → ' + e.getStackTraceString());

                throw new AuraHandledException(
                    'Failed to update Staff records: ' + e.getMessage()
                );
            }

        } else {
            System.debug('⚠️ No records required updating');
        }

        System.debug('✅ ===== updateXeroEntityIds END =====');
    }

    @AuraEnabled
    public static String processInoviceStatus() {

        System.debug('🚀 Xero Apex called');

        String accessToken = getAccessTokenFromXero();
        String tenantId = getTenantId(accessToken);

        System.debug('🔑 Access Token present: ' +
            (String.isBlank(accessToken) ? 'NO' : 'YES'));
        System.debug('🏢 Tenant ID: ' + tenantId);

        if (String.isBlank(accessToken) || String.isBlank(tenantId)) {
            return '❌ Missing access token or tenant ID';
        }

        try {

            String endpoint =
                'https://api.xero.com/api.xro/2.0/Invoices';

            HttpRequest req = new HttpRequest();
            req.setEndpoint(endpoint);
            req.setMethod('GET');

            req.setHeader('Authorization', 'Bearer ' + accessToken);
            req.setHeader('xero-tenant-id', tenantId);
            req.setHeader('Accept', 'application/json');

            System.debug('📡 Sending request to Xero Invoices API');

            Http http = new Http();
            HttpResponse res = http.send(req);

            System.debug('📥 Status Code: ' + res.getStatusCode());
            System.debug('📥 Response Body: ' + res.getBody());

            if (res.getStatusCode() == 200) {

                Map<String, Object> result =
                    (Map<String, Object>) JSON.deserializeUntyped(res.getBody());

                List<Object> invoices =
                    (List<Object>) result.get('Invoices');

                System.debug('📄 Total Invoices: ' + invoices.size());

                return res.getBody();

            } else {

                System.debug('❌ Xero API Error: ' + res.getBody());
                return 'Error: ' + res.getBody();
            }

        } catch (Exception e) {

            System.debug('🔥 Exception: ' + e.getMessage());
            return 'Exception: ' + e.getMessage();
        }
    } 

    @AuraEnabled
    public static String syncXero(String clientId, String clientSecret) {

        System.debug('===== syncXero START =====');

        Organisation__c orgRecord;

        try {

            User currentUser = [
                SELECT Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
            ];

            orgRecord = [
                SELECT Id, Name, Xero_MYOB_Sync_Status__c
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];

            String combined = clientId + ':' + clientSecret;
            String basicToken =
                'Basic ' + EncodingUtil.base64Encode(Blob.valueOf(combined));

            HttpRequest req = new HttpRequest();
            req.setEndpoint('https://identity.xero.com/connect/token');
            req.setMethod('POST');
            req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
            req.setHeader('Authorization', basicToken);
            String scope =
                'accounting.attachments accounting.attachments.read ' +
                'accounting.budgets.read accounting.contacts accounting.contacts.read ' +
                'accounting.reports.tenninetynine.read accounting.settings accounting.settings.read ' +
                'assets assets.read files files.read ' +
                'payroll.employees payroll.employees.read payroll.payruns payroll.payruns.read ' +
                'payroll.payslip payroll.payslip.read payroll.settings payroll.settings.read ' +
                'payroll.timesheets payroll.timesheets.read projects projects.read ' +
                'accounting.invoices accounting.payments accounting.banktransactions accounting.manualjournals ' +
                'accounting.invoices.read accounting.payments.read accounting.banktransactions.read accounting.manualjournals.read ' +
                'accounting.reports.aged.read accounting.reports.balancesheet.read ' +
                'accounting.reports.banksummary.read accounting.reports.budgetsummary.read ' +
                'accounting.reports.executivesummary.read accounting.reports.profitandloss.read ' +
                'accounting.reports.taxreports.read accounting.reports.trialbalance.read';

            req.setBody(
                'grant_type=client_credentials' +
                '&scope=' + EncodingUtil.urlEncode(scope, 'UTF-8')
            );

            HttpResponse res = (new Http()).send(req);

            System.debug('Status Code: ' + res.getStatusCode());
            System.debug('Response Body: ' + res.getBody());

            if (res.getStatusCode() == 200) {

                Map<String, Object> tokenResult =
                    (Map<String, Object>)JSON.deserializeUntyped(res.getBody());

                String accessToken =
                    (String)tokenResult.get('access_token');

                HttpRequest connReq = new HttpRequest();
                connReq.setEndpoint('https://api.xero.com/connections');
                connReq.setMethod('GET');
                connReq.setHeader(
                    'Authorization',
                    'Bearer ' + accessToken
                );
                connReq.setHeader('Accept', 'application/json');

                HttpResponse connRes =
                    (new Http()).send(connReq);

                if (connRes.getStatusCode() == 200) {

                    List<Object> connections =
                        (List<Object>)JSON.deserializeUntyped(
                            connRes.getBody()
                        );

                    if (!connections.isEmpty()) {

                        String successMsg =
                            'Xero synced successfully! ' +
                            connections.size() +
                            ' connection(s) found.';

                        return successMsg;

                    } else {

                        String noConnectionMsg =
                            'Connected to Xero but no tenant connections found.';

                        return noConnectionMsg;
                    }

                } else {

                    String connError =
                        'Token valid but connections check failed: ' +
                        connRes.getBody();

                    return connError;
                }

            } else {

                String finalError;

                try {

                    Map<String, Object> errResult =
                        (Map<String, Object>)JSON.deserializeUntyped(
                            res.getBody()
                        );

                    String errMsg =
                        errResult.containsKey('error_description')
                        ? (String)errResult.get('error_description')
                        : (
                            errResult.containsKey('error')
                            ? (String)errResult.get('error')
                            : 'Unknown error'
                        );

                    finalError =
                        'Xero sync failed: ' + errMsg;

                } catch (Exception ex) {

                    finalError =
                        'Xero auth failed: ' + res.getBody();
                }

                System.debug('Saving Error: ' + finalError);

                Organisation__c verifyOrg = [
                    SELECT Xero_MYOB_Sync_Status__c
                    FROM Organisation__c
                    WHERE Id = :orgRecord.Id
                ];

                System.debug(
                    'VERIFY AFTER SAVE = ' +
                    verifyOrg.Xero_MYOB_Sync_Status__c
                );

                return finalError;
            }

        } catch (Exception e) {

            String unexpectedError =
                'Unexpected error: ' + e.getMessage();

            return unexpectedError;

        } finally {

            System.debug('===== syncXero END =====');
        }
    }

    @AuraEnabled
    public static List<Map<String, Object>> getXeroAccounts() {
        try {
            String accessToken = getAccessTokenFromXero();
            String tenantId = getTenantId(accessToken);
            
            if (String.isBlank(accessToken) || String.isBlank(tenantId)) {
                throw new AuraHandledException('Failed to get Xero authentication credentials.');
            }
            
            HttpRequest req = new HttpRequest();
            req.setEndpoint('https://api.xero.com/api.xro/2.0/Accounts');
            req.setMethod('GET');
            req.setHeader('Authorization', 'Bearer ' + accessToken);
            req.setHeader('Xero-tenant-id', tenantId);
            req.setHeader('Accept', 'application/json');
            
            Http http = new Http();
            HttpResponse res = http.send(req);
            
            System.debug('🔹 Xero Accounts Response: ' + res.getBody());
            
            if (res.getStatusCode() == 200) {
                Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                List<Object> accountsRaw = (List<Object>) result.get('Accounts');
                
                Set<String> allowedTypes = new Set<String>{
                    'REVENUE',
                    'INCOME', 
                    'SALES',
                    'OTHERINCOME',
                    'DIRECTINCOME',
                    'OTHERREVENUE',
                    'EQUITY',
                    'LIABILITY',
                    'CURRENTLIABILITY',
                    'NONCURRENTLIABILITY',
                    'ASSET',
                    'CURRENTASSET',
                    'FIXEDASSET',
                    'NONCURRENTASSET',
                    'EXPENSE',
                    'OTHEREXPENSE',
                    'COSTOFGOODSSOLD',
                    'DIRECTCOSTS'
                };
                
                List<Map<String, Object>> accounts = new List<Map<String, Object>>();
                
                for (Object accObj : accountsRaw) {
                    Map<String, Object> account = (Map<String, Object>) accObj;
                    
                    String accountType = (String) account.get('Type');
                    String accountClass = (String) account.get('Class');
                    String accountStatus = (String) account.get('Status');
                    
                    Boolean isSystemAccount = false;
                    Object systemAccountObj = account.get('SystemAccount');
                    
                    if (systemAccountObj != null) {
                        if (systemAccountObj instanceof Boolean) {
                            isSystemAccount = (Boolean) systemAccountObj;
                        } else if (systemAccountObj instanceof String) {
                            String systemAccountStr = ((String) systemAccountObj).toLowerCase();
                            isSystemAccount = systemAccountStr == 'true' || systemAccountStr == '1';
                        }
                    }
                    
                    if (isSystemAccount) {
                        continue;
                    }
                    
                    if (accountStatus == null || !accountStatus.equals('ACTIVE')) {
                        continue;
                    }
                    
                    Boolean isAllowedAccount = false;
                    
                    if (accountType != null) {
                        String upperType = accountType.toUpperCase();
                        if (allowedTypes.contains(upperType)) {
                            isAllowedAccount = true;
                        }
                    }
                    
                    if (!isAllowedAccount && accountClass != null) {
                        String upperClass = accountClass.toUpperCase();
                        if (upperClass == 'REVENUE' || 
                            upperClass == 'ASSET' || 
                            upperClass == 'LIABILITY' || 
                            upperClass == 'EQUITY' || 
                            upperClass == 'EXPENSE') {
                            isAllowedAccount = true;
                        }
                    }
                    
                    if (isAllowedAccount) {
                        accounts.add(account);
                    }
                }
                
                System.debug('✅ Total Xero Accounts: ' + accounts.size());
                return accounts;
            } else {
                throw new AuraHandledException('❌ Failed to fetch Xero accounts: ' + res.getBody());
            }
        } catch (Exception e) {
            System.debug('❌ Error fetching Xero accounts: ' + e.getMessage());
            throw new AuraHandledException('Error fetching Xero accounts: ' + e.getMessage());
        }
    }


    // ============================================================
    // ✅ NEW: UPDATE STAFF IN SYSTEM FROM XERO
    // ============================================================
    @AuraEnabled
    public static Map<String, Object> updateStaffInSystemFromXero(List<String> xeroEmployeeIds) {
        Map<String, Object> response = new Map<String, Object>();
        List<Map<String, String>> successList = new List<Map<String, String>>();
        List<Map<String, String>> failedList  = new List<Map<String, String>>();

        try {
            if (xeroEmployeeIds == null || xeroEmployeeIds.isEmpty()) {
                throw new AuraHandledException('No employee IDs provided.');
            }

            String accessToken;
            String tenantId;
            if (Test.isRunningTest()) {
                accessToken = 'dummy_access_id';
                tenantId = 'dummy_access_id';
            } else {
                accessToken = getAccessTokenFromXero();
                tenantId = getTenantId(accessToken);
            }

            // 🔹 Fetch each Xero employee's full details
            Map<String, Map<String, Object>> xeroEmployeeMap = new Map<String, Map<String, Object>>();
            for (String empId : xeroEmployeeIds) {
                Map<String, Object> emp = fetchFullXeroEmployeeById(accessToken, tenantId, empId);
                if (emp != null) {
                    xeroEmployeeMap.put(empId, emp);
                }
            }

            if (xeroEmployeeMap.isEmpty()) {
                throw new AuraHandledException('No Xero employees could be fetched.');
            }

            // 🔹 Fetch matching Staff records
            List<Staff__c> staffRecords = [
                SELECT Id, Xero_Employee_ID__c,
                    Name, Last_Name__c, Email_Address__c,
                    Date_of_Birth__c, Gender__c, Job_Title__c, Contact_Number__c,
                    address__Street__s, address__City__s, address__StateCode__s,
                    Address__PostalCode__s, Address__CountryCode__s,
                    TFN_number__c, Residency_Status__c, Tax_Free_Threshold__c,
                    Account_Name__c, BSB__c, Account_Number__c
                FROM Staff__c
                WHERE Xero_Employee_ID__c IN :xeroEmployeeMap.keySet()
            ];

            if (staffRecords.isEmpty()) {
                throw new AuraHandledException('No matching Staff records found in Salesforce.');
            }

            // 🔹 Map records by Xero ID for quick lookup
            Map<String, Staff__c> staffByXeroId = new Map<String, Staff__c>();
            for (Staff__c s : staffRecords) {
                staffByXeroId.put(s.Xero_Employee_ID__c, s);
            }

            // 🔹 Apply Xero values + update one-by-one (partial success mode)
            for (String xeroId : xeroEmployeeIds) {
                Map<String, Object> emp = xeroEmployeeMap.get(xeroId);
                Staff__c staff = staffByXeroId.get(xeroId);

                if (emp == null || staff == null) {
                    Map<String, String> failItem = new Map<String, String>();
                    failItem.put('xeroId', xeroId);
                    failItem.put('name', emp != null
                        ? ((String) emp.get('FirstName') + ' ' + (String) emp.get('LastName'))
                        : xeroId);
                    failItem.put('reason', 'No matching Salesforce record for this Xero employee.');
                    failedList.add(failItem);
                    continue;
                }

                try {
                    // ---- Apply fields ----
                    if (emp.get('FirstName') != null) staff.Name = (String) emp.get('FirstName');
                    if (emp.get('LastName')  != null) staff.Last_Name__c = (String) emp.get('LastName');
                    if (emp.get('Email')     != null) staff.Email_Address__c = (String) emp.get('Email');
                    if (emp.get('JobTitle')  != null) staff.Job_Title__c = (String) emp.get('JobTitle');

                    String mobile = (String) emp.get('Mobile');
                    if (String.isNotBlank(mobile)) {
                        staff.Contact_Number__c = mobile;
                    } else {
                        Map<String, Object> ph = extractPrimaryPhone(emp);
                        if (ph != null && ph.get('PhoneNumber') != null) {
                            staff.Contact_Number__c = (String) ph.get('PhoneNumber');
                        }
                    }

                    if (emp.get('Gender') != null) {
                        String sfGender = mapXeroGenderToSalesforce((String) emp.get('Gender'));
                        if (sfGender != null) staff.Gender__c = sfGender;
                    }

                    if (emp.get('DateOfBirth') != null) {
                        Date dob = parseXeroDateToDate((String) emp.get('DateOfBirth'));
                        if (dob != null) staff.Date_of_Birth__c = dob;
                    }

                    Map<String, Object> addr = extractPrimaryAddress(emp);
                    if (addr != null) {
                        if (addr.get('AddressLine1') != null) staff.address__Street__s     = (String) addr.get('AddressLine1');
                        if (addr.get('City') != null)         staff.address__City__s       = (String) addr.get('City');
                        if (addr.get('Region') != null)       staff.address__StateCode__s  = (String) addr.get('Region');
                        if (addr.get('PostalCode') != null)   staff.Address__PostalCode__s = (String) addr.get('PostalCode');
                        if (addr.get('Country') != null) {
                            String countryCode = mapCountryToIsoCode((String) addr.get('Country'));
                            if (String.isNotBlank(countryCode)) {
                                staff.Address__CountryCode__s = countryCode;
                            }
                        }
                    }

                    Map<String, Object> tax = (Map<String, Object>) emp.get('TaxDeclaration');
                    if (tax != null) {
                        if (tax.get('TaxFileNumber') != null) {
                            staff.TFN_number__c = (String) tax.get('TaxFileNumber');
                        }
                    }

                    List<Object> banks = (List<Object>) emp.get('BankAccounts');
                    if (banks != null && !banks.isEmpty()) {
                        Map<String, Object> bank = (Map<String, Object>) banks[0];
                        if (bank.get('AccountName') != null)   staff.Account_Name__c   = (String) bank.get('AccountName');
                        if (bank.get('BSB') != null)           staff.BSB__c            = (String) bank.get('BSB');
                        if (bank.get('AccountNumber') != null) staff.Account_Number__c = (String) bank.get('AccountNumber');
                    }

                    // ---- Partial-success DML ----
                    Database.SaveResult sr = Database.update(staff, false);

                    String displayName = ((String) emp.get('FirstName') + ' ' + (String) emp.get('LastName')).trim();
                    if (String.isBlank(displayName)) displayName = staff.Id;

                    if (sr.isSuccess()) {
                        Map<String, String> okItem = new Map<String, String>();
                        okItem.put('xeroId', xeroId);
                        okItem.put('name', displayName);
                        okItem.put('recordId', staff.Id);
                        okItem.put('reason', 'Updated successfully.');
                        successList.add(okItem);
                    } else {
                        Map<String, String> errItem = new Map<String, String>();
                        errItem.put('xeroId', xeroId);
                        errItem.put('name', displayName);
                        errItem.put('recordId', staff.Id);

                        List<String> errMsgs = new List<String>();
                        for (Database.Error err : sr.getErrors()) {
                            errMsgs.add(err.getMessage());
                        }
                        errItem.put('reason', String.join(errMsgs, ' | '));
                        failedList.add(errItem);
                    }

                } catch (Exception innerEx) {
                    Map<String, String> errItem = new Map<String, String>();
                    errItem.put('xeroId', xeroId);
                    errItem.put('name', (String) emp.get('FirstName') + ' ' + (String) emp.get('LastName'));
                    errItem.put('reason', innerEx.getMessage());
                    failedList.add(errItem);
                }
            }

            response.put('successList', successList);
            response.put('failedList', failedList);
            response.put('successCount', successList.size());
            response.put('failedCount', failedList.size());
            response.put('totalCount', successList.size() + failedList.size());

            return response;

        } catch (AuraHandledException e) {
            throw e;
        } catch (Exception e) {
            System.debug('❌ updateStaffInSystemFromXero error: ' + e.getMessage());
            throw new AuraHandledException('Failed to update employees: ' + e.getMessage());
        }
    }


    // ============================================================
    // ✅ NEW: UPDATE ENTITIES (CONTACTS) IN SYSTEM FROM XERO
    // ============================================================
    @AuraEnabled
    public static Map<String, Object> updateEntitiesInSystemFromXero(List<String> xeroContactIds) {
        Map<String, Object> response = new Map<String, Object>();
        List<Map<String, String>> successList = new List<Map<String, String>>();
        List<Map<String, String>> failedList  = new List<Map<String, String>>();

        try {
            if (xeroContactIds == null || xeroContactIds.isEmpty()) {
                throw new AuraHandledException('No contact IDs provided.');
            }

            String accessToken;
            String tenantId;
            if (Test.isRunningTest()) {
                accessToken = 'dummy_access_id';
                tenantId = 'dummy_access_id';
            } else {
                accessToken = getAccessTokenFromXero();
                tenantId = getTenantId(accessToken);
            }

            HttpRequest req = new HttpRequest();
            req.setEndpoint('https://api.xero.com/api.xro/2.0/Contacts');
            req.setMethod('GET');
            req.setHeader('Authorization', 'Bearer ' + accessToken);
            req.setHeader('Xero-tenant-id', tenantId);
            req.setHeader('Accept', 'application/json');

            HttpResponse res = new Http().send(req);
            if (res.getStatusCode() != 200) {
                throw new AuraHandledException('Failed to fetch contacts: ' + res.getBody());
            }

            Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            List<Object> allContacts = (List<Object>) result.get('Contacts');

            Map<String, Map<String, Object>> contactsById = new Map<String, Map<String, Object>>();
            for (Object c : allContacts) {
                Map<String, Object> contact = (Map<String, Object>) c;
                String cid = (String) contact.get('ContactID');
                if (xeroContactIds.contains(cid)) {
                    contactsById.put(cid, contact);
                }
            }

            if (contactsById.isEmpty()) {
                throw new AuraHandledException('No matching Xero contacts found.');
            }

            List<Xero_Entity__c> entities = [
                SELECT Id, Xero_Contact_Id__c,
                    First_Name__c, Last_Name__c, Email__c,
                    Contact__c, ABN__c,
                    Address_Latest__Street__s, Address_Latest__City__s,
                    Address_Latest__StateCode__s, Address_Latest__PostalCode__s,
                    Address_Latest__CountryCode__s
                FROM Xero_Entity__c
                WHERE Xero_Contact_Id__c IN :contactsById.keySet()
            ];

            Map<String, Xero_Entity__c> entityByXeroId = new Map<String, Xero_Entity__c>();
            for (Xero_Entity__c e : entities) {
                entityByXeroId.put(e.Xero_Contact_Id__c, e);
            }

            for (String xeroId : xeroContactIds) {
                Map<String, Object> contact = contactsById.get(xeroId);
                Xero_Entity__c entity = entityByXeroId.get(xeroId);

                if (contact == null || entity == null) {
                    Map<String, String> failItem = new Map<String, String>();
                    failItem.put('xeroId', xeroId);
                    failItem.put('name', contact != null ? (String) contact.get('Name') : xeroId);
                    failItem.put('reason', 'No matching Salesforce contact record.');
                    failedList.add(failItem);
                    continue;
                }

                try {
                    if (contact.get('FirstName') != null)    entity.First_Name__c = (String) contact.get('FirstName');
                    if (contact.get('LastName') != null)     entity.Last_Name__c  = (String) contact.get('LastName');
                    if (contact.get('EmailAddress') != null) entity.Email__c      = (String) contact.get('EmailAddress');
                    if (contact.get('TaxNumber') != null)    entity.ABN__c        = (String) contact.get('TaxNumber');

                    List<Object> phones = (List<Object>) contact.get('Phones');
                    if (phones != null && !phones.isEmpty()) {
                        Map<String, Object> phone = (Map<String, Object>) phones[0];
                        if (phone.get('PhoneNumber') != null) {
                            entity.Contact__c = (String) phone.get('PhoneNumber');
                        }
                    }

                    List<Object> addresses = (List<Object>) contact.get('Addresses');
                    if (addresses != null && !addresses.isEmpty()) {
                        Map<String, Object> addr = (Map<String, Object>) addresses[0];
                        if (addr.get('AddressLine1') != null) entity.Address_Latest__Street__s     = (String) addr.get('AddressLine1');
                        if (addr.get('City') != null)         entity.Address_Latest__City__s       = (String) addr.get('City');
                        if (addr.get('Region') != null)       entity.Address_Latest__StateCode__s  = (String) addr.get('Region');
                        if (addr.get('PostalCode') != null)   entity.Address_Latest__PostalCode__s = (String) addr.get('PostalCode');
                        if (addr.get('Country') != null) {
                            String countryCode = mapCountryToIsoCode((String) addr.get('Country'));
                            if (String.isNotBlank(countryCode)) {
                                entity.Address_Latest__CountryCode__s = countryCode;
                            }
                        }
                    }

                    Database.SaveResult sr = Database.update(entity, false);
                    String displayName = ((String) contact.get('Name')).trim();
                    if (String.isBlank(displayName)) displayName = entity.Id;

                    if (sr.isSuccess()) {
                        Map<String, String> okItem = new Map<String, String>();
                        okItem.put('xeroId', xeroId);
                        okItem.put('name', displayName);
                        okItem.put('recordId', entity.Id);
                        okItem.put('reason', 'Updated successfully.');
                        successList.add(okItem);
                    } else {
                        Map<String, String> errItem = new Map<String, String>();
                        errItem.put('xeroId', xeroId);
                        errItem.put('name', displayName);
                        errItem.put('recordId', entity.Id);

                        List<String> errMsgs = new List<String>();
                        for (Database.Error err : sr.getErrors()) {
                            errMsgs.add(err.getMessage());
                        }
                        errItem.put('reason', String.join(errMsgs, ' | '));
                        failedList.add(errItem);
                    }

                } catch (Exception innerEx) {
                    Map<String, String> errItem = new Map<String, String>();
                    errItem.put('xeroId', xeroId);
                    errItem.put('name', (String) contact.get('Name'));
                    errItem.put('reason', innerEx.getMessage());
                    failedList.add(errItem);
                }
            }

            response.put('successList', successList);
            response.put('failedList', failedList);
            response.put('successCount', successList.size());
            response.put('failedCount', failedList.size());
            response.put('totalCount', successList.size() + failedList.size());

            return response;

        } catch (AuraHandledException e) {
            throw e;
        } catch (Exception e) {
            throw new AuraHandledException('Failed to update contacts: ' + e.getMessage());
        }
    }

    // ============================================================
    // ✅ UPDATE STAFF IN XERO FROM SYSTEM
    // Pushes Salesforce Staff__c values to the matching Xero employee.
    // Requires Xero_Employee_ID__c to be set on the Staff record.
    // ============================================================
    @AuraEnabled
    public static Map<String, Object> updateStaffInXeroFromSystem(List<String> xeroEmployeeIds) {
        Map<String, Object> response = new Map<String, Object>();
        List<Map<String, String>> successList = new List<Map<String, String>>();
        List<Map<String, String>> failedList  = new List<Map<String, String>>();

        try {
            if (xeroEmployeeIds == null || xeroEmployeeIds.isEmpty()) {
                throw new AuraHandledException('No employee IDs provided.');
            }

            String accessToken;
            String tenantId;
            if (Test.isRunningTest()) {
                accessToken = 'dummy_access_id';
                tenantId    = 'dummy_access_id';
            } else {
                accessToken = getAccessTokenFromXero();
                tenantId    = getTenantId(accessToken);
            }

            List<Staff__c> staffRecords = [
                SELECT Id, Xero_Employee_ID__c,
                    Name, Last_Name__c, Email_Address__c,
                    Date_of_Birth__c, Gender__c, Job_Title__c, Contact_Number__c,
                    address__Street__s, address__City__s, address__StateCode__s,
                    Address__PostalCode__s, Address__CountryCode__s,
                    TFN_number__c, Residency_Status__c, Tax_Free_Threshold__c,
                    Account_Name__c, BSB__c, Account_Number__c
                FROM Staff__c
                WHERE Xero_Employee_ID__c IN :xeroEmployeeIds
            ];

            Map<String, Staff__c> staffByXeroId = new Map<String, Staff__c>();
            for (Staff__c s : staffRecords) {
                staffByXeroId.put(s.Xero_Employee_ID__c, s);
            }

            for (String xeroId : xeroEmployeeIds) {

                Staff__c staff = staffByXeroId.get(xeroId);

                // ---- No matching Salesforce record ----
                if (staff == null) {
                    Map<String, String> errItem = new Map<String, String>();
                    errItem.put('xeroId', xeroId);
                    errItem.put('name', xeroId);
                    errItem.put('reason', 'No matching Salesforce Staff record for this Xero ID.');
                    failedList.add(errItem);
                    continue;
                }

                String displayName = (
                    (String.isBlank(staff.Name) ? '' : staff.Name) + ' ' +
                    (String.isBlank(staff.Last_Name__c) ? '' : staff.Last_Name__c)
                ).trim();
                if (String.isBlank(displayName)) displayName = staff.Id;

                // ---- Pre-validate required fields ----
                List<String> missingFields = new List<String>();
                if (String.isBlank(staff.Name))         missingFields.add('First Name');
                if (String.isBlank(staff.Last_Name__c)) missingFields.add('Last Name');
                if (staff.Date_of_Birth__c == null)     missingFields.add('Date of Birth');

                if (!missingFields.isEmpty()) {
                    Map<String, String> errItem = new Map<String, String>();
                    errItem.put('xeroId', xeroId);
                    errItem.put('name', displayName);
                    errItem.put('reason', 'Missing required field(s): ' + String.join(missingFields, ', '));
                    failedList.add(errItem);
                    continue;
                }

                try {
                    // ============================================================
                    // BUILD EMPLOYEE PAYLOAD (TOP-LEVEL FIELDS)
                    // ============================================================
                    Map<String, Object> employeeMap = new Map<String, Object>();
                    employeeMap.put('EmployeeID', xeroId);
                    employeeMap.put('FirstName', staff.Name);
                    employeeMap.put('LastName',  staff.Last_Name__c);

                    // 🔹 DOB — required
                    employeeMap.put(
                        'DateOfBirth',
                        '/Date(' +
                        Datetime.newInstanceGmt(
                            staff.Date_of_Birth__c.year(),
                            staff.Date_of_Birth__c.month(),
                            staff.Date_of_Birth__c.day()
                        ).getTime() + '+0000)/'
                    );

                    // 🔹 Home Address — required with sensible fallbacks
                    Map<String, Object> addressMap = new Map<String, Object>();
                    addressMap.put('AddressLine1', String.isNotBlank(staff.address__Street__s)      ? staff.address__Street__s      : 'Unknown');
                    addressMap.put('City',         String.isNotBlank(staff.address__City__s)        ? staff.address__City__s        : 'Unknown');
                    addressMap.put('Region',       String.isNotBlank(staff.address__StateCode__s)   ? staff.address__StateCode__s   : 'NSW');
                    addressMap.put('PostalCode',   String.isNotBlank(staff.Address__PostalCode__s)  ? staff.Address__PostalCode__s  : '2000');
                    addressMap.put('Country',      String.isNotBlank(staff.Address__CountryCode__s) ? staff.Address__CountryCode__s : 'AU');
                    employeeMap.put('HomeAddress', addressMap);

                    // 🔹 REQUIRED for Xero Payroll AU updates
                    employeeMap.put('EmploymentType', 'EMPLOYEE');
                    employeeMap.put('IncomeType', 'SALARYANDWAGES');

                    // 🔹 Optional fields
                    if (String.isNotBlank(staff.Email_Address__c))  employeeMap.put('Email',    staff.Email_Address__c);
                    if (String.isNotBlank(staff.Job_Title__c))      employeeMap.put('JobTitle', staff.Job_Title__c);
                    if (String.isNotBlank(staff.Gender__c))         employeeMap.put('Gender',   getGenderCode(staff.Gender__c));
                    if (String.isNotBlank(staff.Contact_Number__c)) employeeMap.put('Mobile',   staff.Contact_Number__c);

                    // ============================================================
                    // 🔹 TAX DECLARATION  (ONLY tax-related keys go here)
                    // ============================================================
                    Map<String, Object> taxDeclaration = new Map<String, Object>();
                    taxDeclaration.put('EmploymentBasis', 'FULLTIME');
                    taxDeclaration.put(
                        'ResidencyStatus',
                        String.isNotBlank(staff.Residency_Status__c)
                            ? staff.Residency_Status__c : 'AUSTRALIANRESIDENT'
                    );

                    if (String.isNotBlank(staff.Tax_Free_Threshold__c)) {
                        Boolean claimed =
                            staff.Tax_Free_Threshold__c == 'Yes'
                            || staff.Tax_Free_Threshold__c == 'true'
                            || staff.Tax_Free_Threshold__c == '1';
                        taxDeclaration.put('TaxFreeThresholdClaimed', claimed);
                    }

                    if (String.isNotBlank(staff.TFN_number__c)) {
                        String tfn = staff.TFN_number__c.replaceAll('\\s+', '');
                        taxDeclaration.put('TaxFileNumber', tfn);
                        taxDeclaration.put('TaxScaleType',  'REGULAR');
                    } else {
                        taxDeclaration.put('TFNExemptionType', 'NOTQUOTED');
                    }

                    employeeMap.put('TaxDeclaration', taxDeclaration);

                    // ============================================================
                    // 🔹 BANK ACCOUNTS  (TOP-LEVEL — NOT inside TaxDeclaration)
                    // ============================================================
                    if (String.isNotBlank(staff.Account_Name__c)
                        || String.isNotBlank(staff.BSB__c)
                        || String.isNotBlank(staff.Account_Number__c)) {

                        Map<String, Object> bankAccount = new Map<String, Object>();
                        if (String.isNotBlank(staff.Account_Name__c))   bankAccount.put('AccountName',   staff.Account_Name__c);
                        if (String.isNotBlank(staff.BSB__c))            bankAccount.put('BSB',           staff.BSB__c);
                        if (String.isNotBlank(staff.Account_Number__c)) bankAccount.put('AccountNumber', staff.Account_Number__c);
                        bankAccount.put('StatementText', 'Pay Cheque');
                        bankAccount.put('Remainder', true);

                        // ✅ Top-level key on employeeMap
                        employeeMap.put('BankAccounts', new List<Map<String, Object>>{ bankAccount });
                    }

                    // ============================================================
                    // 🔹 SERIALIZE + SEND TO XERO
                    // ============================================================
                    String requestBody = JSON.serialize(
                        new List<Map<String, Object>>{ employeeMap }
                    );

                    HttpRequest req = new HttpRequest();
                    req.setEndpoint('https://api.xero.com/payroll.xro/1.0/Employees');
                    req.setMethod('POST');
                    req.setHeader('Authorization', 'Bearer ' + accessToken);
                    req.setHeader('Xero-tenant-id', tenantId);
                    req.setHeader('Accept', 'application/json');
                    req.setHeader('Content-Type', 'application/json');
                    req.setBody(requestBody);

                    HttpResponse res = new Http().send(req);

                    Map<String, String> item = new Map<String, String>();
                    item.put('xeroId',   xeroId);
                    item.put('name',     displayName);
                    item.put('recordId', staff.Id);

                    if (res.getStatusCode() == 200 || res.getStatusCode() == 201) {
                        item.put('reason', 'Updated in Xero successfully.');
                        successList.add(item);
                    } else {
                        String xeroError = extractXeroError(res.getBody());
                        System.debug('❌ Xero error for ' + displayName + ': ' + res.getBody());
                        item.put('reason', 'Xero error: ' + xeroError);
                        failedList.add(item);
                    }

                } catch (Exception innerEx) {
                    Map<String, String> errItem = new Map<String, String>();
                    errItem.put('xeroId', xeroId);
                    errItem.put('name',   displayName);
                    errItem.put('reason', innerEx.getMessage());
                    failedList.add(errItem);
                }
            }

            response.put('successList',  successList);
            response.put('failedList',   failedList);
            response.put('successCount', successList.size());
            response.put('failedCount',  failedList.size());
            response.put('totalCount',   successList.size() + failedList.size());

        } catch (AuraHandledException e) {
            throw e;
        } catch (Exception e) {
            throw new AuraHandledException('Failed to update employees in Xero: ' + e.getMessage());
        }

        // ✅ Always reached when no unhandled exception occurred
        return response;
    }

    public static String extractXeroError(String responseBody) {
        if (String.isBlank(responseBody)) return 'Unknown error.';

        try {
            Object parsed = JSON.deserializeUntyped(responseBody);
            Set<String> messages = new Set<String>();
            collectMessages(parsed, messages);

            // Drop the generic "A validation exception occurred" since it adds no value
            messages.remove('A validation exception occurred');

            if (messages.isEmpty()) {
                return 'Xero returned an error but no details were provided.';
            }

            return String.join(new List<String>(messages), ' | ');

        } catch (Exception ex) {
            System.debug('⚠️ extractXeroError parse error: ' + ex.getMessage());
            return responseBody;
        }
    }

    /**
     * Recursively walk any JSON structure and collect all values under any "Message" key.
     */
    public static void collectMessages(Object node, Set<String> messages) {
        if (node == null) return;

        if (node instanceof Map<String, Object>) {
            Map<String, Object> m = (Map<String, Object>) node;

            // Capture "Message" values (both top-level and inside ValidationErrors)
            if (m.containsKey('Message') && m.get('Message') != null) {
                messages.add(String.valueOf(m.get('Message')));
            }

            // Recurse into all children
            for (Object v : m.values()) {
                collectMessages(v, messages);
            }
        } else if (node instanceof List<Object>) {
            for (Object item : (List<Object>) node) {
                collectMessages(item, messages);
            }
        }
    }

    // ============================================================
    // ✅ UPDATE ENTITIES (CONTACTS) IN XERO FROM SYSTEM
    // Pushes Salesforce Xero_Entity__c values to Xero contacts.
    // ============================================================
    @AuraEnabled
    public static Map<String, Object> updateEntitiesInXeroFromSystem(List<String> xeroContactIds) {
        Map<String, Object> response = new Map<String, Object>();
        List<Map<String, String>> successList = new List<Map<String, String>>();
        List<Map<String, String>> failedList  = new List<Map<String, String>>();

        try {
            if (xeroContactIds == null || xeroContactIds.isEmpty()) {
                throw new AuraHandledException('No contact IDs provided.');
            }

            String accessToken;
            String tenantId;
            if (Test.isRunningTest()) {
                accessToken = 'dummy_access_id';
                tenantId = 'dummy_access_id';
            } else {
                accessToken = getAccessTokenFromXero();
                tenantId = getTenantId(accessToken);
            }

            List<Xero_Entity__c> entities = [
                SELECT Id, Xero_Contact_Id__c,
                    First_Name__c, Last_Name__c, Email__c,
                    Contact__c, ABN__c,
                    Address_Latest__Street__s, Address_Latest__City__s,
                    Address_Latest__StateCode__s, Address_Latest__PostalCode__s,
                    Address_Latest__CountryCode__s
                FROM Xero_Entity__c
                WHERE Xero_Contact_Id__c IN :xeroContactIds
            ];

            Map<String, Xero_Entity__c> entityByXeroId = new Map<String, Xero_Entity__c>();
            for (Xero_Entity__c e : entities) {
                entityByXeroId.put(e.Xero_Contact_Id__c, e);
            }

            for (String xeroId : xeroContactIds) {
                Xero_Entity__c entity = entityByXeroId.get(xeroId);

                if (entity == null) {
                    Map<String, String> errItem = new Map<String, String>();
                    errItem.put('xeroId', xeroId);
                    errItem.put('name', xeroId);
                    errItem.put('reason', 'No matching Salesforce Contact record for this Xero ID.');
                    failedList.add(errItem);
                    continue;
                }

                try {
                    // Build Contact payload
                    Map<String, Object> contactMap = new Map<String, Object>();
                    contactMap.put('ContactID', xeroId);
                    contactMap.put('Name', (entity.First_Name__c + ' ' + (entity.Last_Name__c == null ? '' : entity.Last_Name__c)).trim());
                    contactMap.put('FirstName', entity.First_Name__c);
                    contactMap.put('LastName',  entity.Last_Name__c);

                    if (String.isNotBlank(entity.Email__c)) contactMap.put('EmailAddress', entity.Email__c);
                    if (String.isNotBlank(entity.ABN__c))   contactMap.put('TaxNumber', entity.ABN__c);

                    if (String.isNotBlank(entity.Contact__c)) {
                        contactMap.put('Phones', new List<Map<String, Object>>{
                            new Map<String, Object>{
                                'PhoneType' => 'MOBILE',
                                'PhoneNumber' => entity.Contact__c
                            }
                        });
                    }

                    if (String.isNotBlank(entity.Address_Latest__Street__s)
                        || String.isNotBlank(entity.Address_Latest__City__s)) {
                        contactMap.put('Addresses', new List<Map<String, Object>>{
                            new Map<String, Object>{
                                'AddressType' => 'POBOX',
                                'AddressLine1' => entity.Address_Latest__Street__s,
                                'City' => entity.Address_Latest__City__s,
                                'Region' => entity.Address_Latest__StateCode__s,
                                'PostalCode' => entity.Address_Latest__PostalCode__s,
                                'Country' => entity.Address_Latest__CountryCode__s
                            }
                        });
                    }

                    // Xero update: POST to /Contacts with ContactID in body
                    HttpRequest req = new HttpRequest();
                    req.setEndpoint('https://api.xero.com/api.xro/2.0/Contacts');
                    req.setMethod('POST');
                    req.setHeader('Authorization', 'Bearer ' + accessToken);
                    req.setHeader('Xero-tenant-id', tenantId);
                    req.setHeader('Accept', 'application/json');
                    req.setHeader('Content-Type', 'application/json');
                    req.setBody(JSON.serialize(new Map<String, Object>{
                        'Contacts' => new List<Object>{ contactMap }
                    }));

                    HttpResponse res = new Http().send(req);

                    Map<String, String> item = new Map<String, String>();
                    item.put('xeroId', xeroId);
                    item.put('name', (entity.First_Name__c + ' ' + (entity.Last_Name__c == null ? '' : entity.Last_Name__c)).trim());
                    item.put('recordId', entity.Id);

                    if (res.getStatusCode() == 200 || res.getStatusCode() == 201) {
                        item.put('reason', 'Updated in Xero successfully.');
                        successList.add(item);
                    } else {
                        String xeroError = res.getBody();
                        try {
                            Map<String, Object> errMap = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                            if (errMap.containsKey('Message')) {
                                xeroError = (String) errMap.get('Message');
                            }
                        } catch (Exception ex) { }
                        item.put('reason', 'Xero error: ' + xeroError);
                        failedList.add(item);
                    }

                } catch (Exception innerEx) {
                    Map<String, String> errItem = new Map<String, String>();
                    errItem.put('xeroId', xeroId);
                    errItem.put('name', (entity.First_Name__c + ' ' + (entity.Last_Name__c == null ? '' : entity.Last_Name__c)).trim());
                    errItem.put('reason', innerEx.getMessage());
                    failedList.add(errItem);
                }
            }

            response.put('successList', successList);
            response.put('failedList', failedList);
            response.put('successCount', successList.size());
            response.put('failedCount', failedList.size());
            response.put('totalCount', successList.size() + failedList.size());

            return response;

        } catch (AuraHandledException e) {
            throw e;
        } catch (Exception e) {
            throw new AuraHandledException('Failed to update contacts in Xero: ' + e.getMessage());
        }
    }


    // ============================================================
    // 🔹 NEW HELPERS
    // ============================================================

    public static Map<String, Object> fetchFullXeroEmployeeById(String accessToken, String tenantId, String employeeId) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://api.xero.com/payroll.xro/1.0/Employees/' + employeeId);
        req.setMethod('GET');
        req.setHeader('Authorization', 'Bearer ' + accessToken);
        req.setHeader('Xero-tenant-id', tenantId);
        req.setHeader('Accept', 'application/json');

        HttpResponse res = new Http().send(req);
        if (res.getStatusCode() == 200) {
            Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            List<Object> emps = (List<Object>) result.get('Employees');
            if (emps != null && !emps.isEmpty()) {
                return (Map<String, Object>) emps[0];
            }
        }
        return null;
    }

    public static Date parseXeroDateToDate(String xeroDate) {
        if (String.isBlank(xeroDate)) return null;
        try {
            Integer startIdx = xeroDate.indexOf('(');
            Integer endIdx = xeroDate.indexOf('+');
            if (startIdx != -1 && endIdx != -1 && endIdx > startIdx) {
                Long ts = Long.valueOf(xeroDate.substring(startIdx + 1, endIdx));
                return DateTime.newInstance(ts).date();
            }
        } catch (Exception e) {
            System.debug('⚠️ Error parsing Xero date: ' + e.getMessage());
        }
        return null;
    }

    public static String mapXeroGenderToSalesforce(String gender) {
        if (gender == 'M') return 'Male';
        if (gender == 'F') return 'Female';
        if (gender == 'N') return 'Not Specified';
        if (gender == 'I') return 'Indeterminate/Intersex/Unspecified';
        return null;
    }

    public static Map<String, Object> extractPrimaryAddress(Map<String, Object> emp) {
        List<Object> addresses = (List<Object>) emp.get('Addresses');
        if (addresses != null && !addresses.isEmpty()) {
            for (Object a : addresses) {
                Map<String, Object> addr = (Map<String, Object>) a;
                if (addr.get('AddressType') == 'STREET') return addr;
            }
            return (Map<String, Object>) addresses[0];
        }
        Object homeAddr = emp.get('HomeAddress');
        if (homeAddr != null) return (Map<String, Object>) homeAddr;
        return null;
    }

    public static Map<String, Object> extractPrimaryPhone(Map<String, Object> emp) {
        List<Object> phones = (List<Object>) emp.get('Phones');
        if (phones != null && !phones.isEmpty()) {
            for (Object p : phones) {
                Map<String, Object> phone = (Map<String, Object>) p;
                String type = (String) phone.get('PhoneType');
                if (type == 'MOBILE' || type == 'DEFAULT') return phone;
            }
            return (Map<String, Object>) phones[0];
        }
        return null;
    }

    // ============================================================
    // 🔹 Map country name → ISO code (used for Salesforce compound address fields)
    // ============================================================
    public static String mapCountryToIsoCode(String country) {
        if (String.isBlank(country)) return null;
        String c = country.trim().toUpperCase();
        
        // Already a 2-letter ISO code
        if (c.length() == 2) return c;
        
        Map<String, String> countryMap = new Map<String, String>{
            'AUSTRALIA'          => 'AU',
            'AUSTRALIA (AU)'     => 'AU',
            'NEW ZEALAND'        => 'NZ',
            'UNITED STATES'      => 'US',
            'USA'                => 'US',
            'UNITED STATES OF AMERICA' => 'US',
            'UNITED KINGDOM'     => 'GB',
            'UK'                 => 'GB',
            'GREAT BRITAIN'      => 'GB',
            'CANADA'             => 'CA',
            'INDIA'              => 'IN',
            'CHINA'              => 'CN',
            'JAPAN'              => 'JP',
            'SINGAPORE'          => 'SG',
            'PHILIPPINES'        => 'PH',
            'SOUTH AFRICA'       => 'ZA',
            'IRELAND'            => 'IE',
            'GERMANY'            => 'DE',
            'FRANCE'             => 'FR',
            'ITALY'              => 'IT',
            'SPAIN'              => 'ES',
            'BRAZIL'             => 'BR',
            'MEXICO'             => 'MX',
            'MALAYSIA'           => 'MY',
            'INDONESIA'          => 'ID',
            'THAILAND'           => 'TH',
            'VIETNAM'            => 'VN',
            'HONG KONG'          => 'HK',
            'KOREA'              => 'KR',
            'SOUTH KOREA'        => 'KR',
            'PAKISTAN'           => 'PK',
            'BANGLADESH'         => 'BD',
            'SRI LANKA'          => 'LK',
            'NEPAL'              => 'NP',
            'PAPUA NEW GUINEA'   => 'PG',
            'FIJI'               => 'FJ'
        };
        
        return countryMap.containsKey(c) ? countryMap.get(c) : c;
    }
}