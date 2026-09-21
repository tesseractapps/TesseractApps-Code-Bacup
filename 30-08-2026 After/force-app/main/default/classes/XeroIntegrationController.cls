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
                
                // Only add basic employee data (no additional API calls)
                for (Object empObj : employeesRaw) {
                    Map<String, Object> employee = (Map<String, Object>) empObj;
                    
                    // Format Date of Birth
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
                    
                    // Format Date of Birth
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
            // Parse Xero date format: /Date(timestamp+offset)/
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
            
            // Fallback: try parsing as regular date
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
                // Ignore parse error
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
            // 🔹 Query staff records (add WHERE clause if you want filtering)
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
            // 🔹 Query Entity records (add WHERE clause if you want filtering)
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
            // 🔹 Get the staff record from Salesforce with ALL fields including Staff Roles
            Staff__c staff = [
                SELECT Id, NameToDisplay__c, Name, Last_Name__c, Date_of_Birth__c, 
                Email_Address__c, Contact_Number__c, address__Street__s, address__City__s, 
                address__StateCode__s, Address__CountryCode__s, Address__PostalCode__s, Gender__c, Xero_Employee_ID__c,
                // 🔹 All additional fields
                Job_Title__c,
                TFN_number__c,
                Residency_Status__c,
                Tax_Free_Threshold__c,
                Superannuation_Name__c,
                Superannuation_Number__c,
                Account_Name__c,
                BSB__c,
                Account_Number__c,
                // 🔹 Get the primary Staff Role
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
            
            // 🔹 Get Employment Basis from the primary Staff Role
            // Valid values: FULLTIME, PARTTIME, CASUAL, LABOURHIRE, NONEMPLOYEE
            String employmentBasis = 'FULLTIME'; // Default fallback
            if (staff.StaffRoles__r != null && !staff.StaffRoles__r.isEmpty()) {
                SObject primaryRole = staff.StaffRoles__r[0];
                String typeOfJob = (String) primaryRole.get('Type_of_Job__c');
                if (String.isNotBlank(typeOfJob)) {
                    employmentBasis = mapEmploymentBasis(typeOfJob);
                }
            }
            
            // 🔹 Get Tax Free Threshold as Boolean
            Boolean taxFreeThreshold = true; // Default
            if (String.isNotBlank(staff.Tax_Free_Threshold__c)) {
                taxFreeThreshold = staff.Tax_Free_Threshold__c == 'Yes' || 
                                   staff.Tax_Free_Threshold__c == 'true' || 
                                   staff.Tax_Free_Threshold__c == '1';
            }
            
            // 🔹 Get access token & tenantId
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

            String employeeId;
            
            // 🔹 Check if employee already exists in Xero
            if (String.isNotBlank(staff.Xero_Employee_ID__c)) {
                employeeId = staff.Xero_Employee_ID__c;
                System.debug('🔹 Using existing employee: ' + employeeId);
            } else {
                // 🔹 Create new employee with all fields
                System.debug('🔹 Creating new employee');
                employeeId = createXeroEmployee(accessToken, tenantId, staff, employmentBasis, taxFreeThreshold);
            }
            
            // =============================================
            // 🔹 Update Salesforce (DML)
            // =============================================
            if (String.isNotBlank(employeeId)) {
                staff.Xero_Employee_ID__c = employeeId;
                update staff;
                System.debug('✅ Xero Employee processed with ID: ' + employeeId);
                return '✅ Employee created in Xero with ID: ' + employeeId;
            } else {
                throw new AuraHandledException('❌ Failed to get Employee ID from Xero');
            }
            
        } catch (AuraHandledException e) {
            System.debug('❌ AuraHandledException: ' + e.getMessage());
            throw e;

        } catch (Exception e) {
            System.debug('❌ Error creating Xero employee: ' + e.getMessage());

            throw new AuraHandledException(
                'Error creating Xero employee: ' + e.getMessage()
            );
        }
    }
    
    // 🔹 Method to CREATE a new employee with all available fields
    public static String createXeroEmployee(String accessToken, String tenantId, Staff__c staff, String employmentBasis, Boolean taxFreeThreshold) {
        Map<String, Object> employeeMap = new Map<String, Object>();
        
        // 🔹 Required fields
        employeeMap.put('FirstName', staff.Name);
        employeeMap.put('LastName', staff.Last_Name__c);
        employeeMap.put('DateOfBirth', '/Date(' + Datetime.newInstanceGmt(staff.Date_of_Birth__c.year(), staff.Date_of_Birth__c.month(), staff.Date_of_Birth__c.day()).getTime() + '+0000)/');
        
        // 🔹 Home Address - Required
        Map<String, Object> addressMap = new Map<String, Object>();
        addressMap.put('AddressLine1', String.isNotBlank(staff.address__Street__s) ? staff.address__Street__s : 'Unknown');
        addressMap.put('City', String.isNotBlank(staff.address__City__s) ? staff.address__City__s : 'Unknown');
        addressMap.put('Region', String.isNotBlank(staff.address__StateCode__s) ? staff.address__StateCode__s : 'NSW');
        addressMap.put('PostalCode', String.isNotBlank(staff.Address__PostalCode__s) ? staff.Address__PostalCode__s : '0000');
        addressMap.put('Country', String.isNotBlank(staff.Address__CountryCode__s) ? staff.Address__CountryCode__s : 'AU');
        employeeMap.put('HomeAddress', addressMap);
        
        // 🔹 Employment Type - At root level (Employee or Contractor)
        // Valid values: EMPLOYEE, CONTRACTOR
        employeeMap.put('EmploymentType', 'EMPLOYEE'); // Hardcoded or map from Salesforce
        
        // 🔹 Income Type - At root level
        // Valid values: SALARYANDWAGES, WORKINGHOLIDAYMAKER, NONEMPLOYEE, CLOSELYHELDPAYEES, LABOURHIRE
        employeeMap.put('IncomeType', 'SALARYANDWAGES'); // Hardcoded
        
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
        
        // 🔹 Tax Declaration
        Map<String, Object> taxDeclaration = new Map<String, Object>();
        taxDeclaration.put('EmploymentBasis', employmentBasis); // FULLTIME, PARTTIME, CASUAL, etc.
        taxDeclaration.put('TaxFreeThresholdClaimed', taxFreeThreshold);
        taxDeclaration.put('ResidencyStatus', String.isNotBlank(staff.Residency_Status__c) ? staff.Residency_Status__c : 'AUSTRALIANRESIDENT');
        
        // 🔹 TFN Handling
        if (String.isNotBlank(staff.TFN_number__c)) {
            // If TFN is provided, include TaxScaleType
            String tfn = staff.TFN_number__c;

            if (String.isNotBlank(tfn)) {
                tfn = tfn.replaceAll('\\s+', '');

                taxDeclaration.put('TaxFileNumber', tfn);
                taxDeclaration.put('TaxScaleType', 'REGULAR');
            }
        } else {
            // If no TFN, use NOTQUOTED and DON'T include TaxScaleType
            taxDeclaration.put('TFNExemptionType', 'NOTQUOTED');
        }
        
        employeeMap.put('TaxDeclaration', taxDeclaration);
        
        // 🔹 Bank Accounts (if available)
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
            bankAccount.put('Remainder', true);
            employeeMap.put('BankAccounts', new List<Map<String, Object>>{ bankAccount });
        }
        
        // 🔹 Superannuation (if available)
        /* if (String.isNotBlank(staff.Superannuation_Name__c) || String.isNotBlank(staff.Superannuation_Number__c)) {
            Map<String, Object> superMembership = new Map<String, Object>();
            if (String.isNotBlank(staff.Superannuation_Name__c)) {
                superMembership.put('SuperFundID', staff.Superannuation_Name__c);
            }
            if (String.isNotBlank(staff.Superannuation_Number__c)) {
                superMembership.put('EmployeeNumber', staff.Superannuation_Number__c);
            }
            employeeMap.put('SuperMemberships', new List<Map<String, Object>>{ superMembership });
        } */
        
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
    
    // 🔹 Helper method to map Employment Basis to Xero values
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
    
    // 🔹 Helper method for gender code
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
            // 🔹 Get the Entity record from Salesforce
            Xero_Entity__c entity = [
                SELECT Id,First_Name__c,Last_Name__c, Email__c, Contact__c,ABN__c,Card_Type__c,Organization__c,Xero_Contact_Id__c,Address_Latest__Street__s ,Address_Latest__City__s ,Address_Latest__StateCode__s,
                Address_Latest__CountryCode__s,Address_Latest__PostalCode__s 
                FROM Xero_Entity__c
                WHERE Id = :entityId
                LIMIT 1
            ];
            //String abn;
            
            // 🔹 Get access token & tenantId
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
            
            // 🔹 Build the JSON body in Xero format
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
            //List<Map<String, Object>> bodyList = new List<Map<String, Object>>{ contactMap };
            Map<String, Object> requestBody = new Map<String, Object>{
                'Contacts' => new List<Object>{ contactMap }
            };
                String bodyJSON = JSON.serialize(requestBody);
            System.debug('📤 Final JSON Body to send to Xero:\n' + bodyJSON);
            
            // 🔹 Make POST request to Xero
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
            
            System.debug('🔹 Xero Response: ' + res.getBody());
            
            if (res.getStatusCode() == 200 || res.getStatusCode() == 201) {
                // 🔹 Parse response
                Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                List<Object> contacts = (List<Object>) result.get('Contacts');
                
                if (!contacts.isEmpty()) {
                    Map<String, Object> contactsData = (Map<String, Object>) contacts[0];
                    String contactId = (String) contactsData.get('ContactID');
                    
                    // 🔹 Update Entity record in Salesforce
                    entity.Xero_Contact_Id__c = contactId;
                    //entity.ABN__c = abn;
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

        // Create new record
        Xero_Entity__c newEntity = new Xero_Entity__c();

        // Basic fields
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

        // Handle nested address
        Object addressObj = entityData.get('address');
        System.debug('📦 Raw Address Object → ' + addressObj);

        if (addressObj != null && addressObj instanceof Map<Object, Object>) { Map<Object, Object> rawAddress = (Map<Object, Object>)addressObj; for (Object key : rawAddress.keySet()) {
                System.debug('   ' + key + ' → ' + rawAddress.get(key));
            }

            // Convert to Map<String, Object>
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
            
            // 🔹 Query Entity records (add WHERE clause if you want filtering)
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

        // 🔹 Step 1: Build a structured map for incoming payload
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

        // 🔹 Step 2: Query existing Staff records
        List<Staff__c> existingStaffs = [
            SELECT Id, Xero_Employee_ID__c, Ordinary_Earnings_Rate_ID__c
            FROM Staff__c
            WHERE Id IN :incomingMap.keySet()
        ];

        List<Staff__c> staffToUpdate = new List<Staff__c>();

        // 🔹 Step 3: Apply updates
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

        // 🔹 Step 4: Update in Salesforce
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
            
            // 🔹 Get the invoice record from Salesforce with related data
            Xero_or_Myob_Invoice__c invoice = [
                SELECT Id, Invoice_Date__c, Name, Invoice_No__c, Invoice_Source__c, 
                    Is_Service_Invoice__c, Total_Amount__c, Xero_Innvoice_Id__c, 
                    Xero_Entity__c, Xero_Entity__r.First_Name__c,
                    Xero_Entity__r.Last_Name__c, Xero_Entity__r.Xero_Contact_Id__c,
                    (SELECT Id, Description__c, Invoice_Date__c, Line_Items__c, 
                            Quantity__c, Sub_Total__c, Tax_Amount__c,
                            Total_Amount__c, Tax_Inclusive__c, Unit_Price__c 
                        FROM Xero_Invoice_Entries__r 
                        WHERE Unit_Price__c != null AND Quantity__c != null),
                    (SELECT Id, Service_Type__c, Service_Type__r.Support_Item_Number__c, 
                            Service_Type__r.Name,
                            Participant_Name__c, Client__c, Client__r.NDIS_Participant_ID__c,
                            Client__r.Name
                        FROM Services_and_Support_Plans__r)
                FROM Xero_or_Myob_Invoice__c
                WHERE Id = :invoiceId AND Invoice_Source__c = 'Xero'
                LIMIT 1
            ];
            
            // 🔹 Get access token & tenantId
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
            
            // 🔹 Use the provided accountId or fallback to default
            String accountCode = '200'; // Default fallback
            String taxType = 'EXEMPTOUTPUT';
            
            // 🔹 If accountId is provided, fetch the account details from Xero
            if (String.isNotBlank(accountId)) {
                Map<String, Object> accountDetails = getXeroAccountDetails(accessToken, tenantId, accountId);
                if (accountDetails != null) {
                    // Get the account code from the fetched account
                    String fetchedAccountCode = (String) accountDetails.get('Code');
                    if (String.isNotBlank(fetchedAccountCode)) {
                        accountCode = fetchedAccountCode;
                    }
                    // Optionally get tax type from account
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
            
            // 🔹 Build line items with Support_Item_Number__c and NDIS Number
            List<Xero_Invoice_Entries__c> entries = invoice.Xero_Invoice_Entries__r;
            List<Services_and_Support_Plan__c> services = invoice.Services_and_Support_Plans__r;
            List<Map<String, Object>> lineItems = new List<Map<String, Object>>();
            
            // Cache to track which items we've already processed
            Map<String, Boolean> processedItems = new Map<String, Boolean>();
            
            for (Integer i = 0; i < entries.size(); i++) {
                Xero_Invoice_Entries__c entry = entries[i];
                String supportItemNumber = null;
                String enhancedDescription = entry.Description__c;
                
                // Debug: Log original description
                System.debug('🔍 Original Description [' + i + ']: ' + enhancedDescription);
                
                // Get Support_Item_Number__c and NDIS info if available
                if (i < services.size() && services[i] != null) {
                    Services_and_Support_Plan__c service = services[i];
                    
                    // Get Support Item Number
                    if (service.Service_Type__r != null) {
                        supportItemNumber = service.Service_Type__r.Support_Item_Number__c;
                    }
                    
                    // 🔹 Build NDIS participant info
                    String participantName = null;
                    String ndisNumber = null;
                    
                    // Get participant name from Client or Participant_Name__c field
                    if (service.Client__r != null) {
                        participantName = service.Client__r.Name;
                        ndisNumber = service.Client__r.NDIS_Participant_ID__c;
                        System.debug('🔍 Client Name: ' + participantName + ', NDIS Number: ' + ndisNumber);
                    } else if (String.isNotBlank(service.Participant_Name__c)) {
                        participantName = service.Participant_Name__c;
                        System.debug('🔍 Participant Name (from field): ' + participantName);
                    }
                    
                    // 🔹 Enhance description with NDIS Number at the END
                    if (String.isNotBlank(participantName) || String.isNotBlank(ndisNumber)) {
                        
                        // Check if NDIS number is already in the description
                        Boolean hasNdisInfo = false;
                        if (String.isNotBlank(ndisNumber) && enhancedDescription.contains('NDIS Number: ' + ndisNumber)) {
                            hasNdisInfo = true;
                        }
                        
                        // Only add NDIS info if not already present
                        if (!hasNdisInfo) {
                            String ndisInfo = '';
                            
                            // Case 1: We have both name and NDIS number
                            if (String.isNotBlank(participantName) && String.isNotBlank(ndisNumber)) {
                                // Check if name is already in description
                                if (enhancedDescription.contains(participantName)) {
                                    // Name is already there, just add NDIS number in parentheses
                                    // Find where the name appears and add NDIS number after it
                                    if (!enhancedDescription.contains('NDIS Number:')) {
                                        // Add NDIS number after the first occurrence of the name
                                        Integer nameIndex = enhancedDescription.indexOf(participantName);
                                        if (nameIndex >= 0) {
                                            Integer endOfName = nameIndex + participantName.length();
                                            // Check if there's already a space or punctuation after the name
                                            ndisInfo = ' (NDIS Number: ' + ndisNumber + ')';
                                            enhancedDescription = enhancedDescription.substring(0, endOfName) + ndisInfo + enhancedDescription.substring(endOfName);
                                        }
                                    }
                                } else {
                                    // Name not in description, add both
                                    ndisInfo = ' for ' + participantName + ' (NDIS Number: ' + ndisNumber + ')';
                                    enhancedDescription = enhancedDescription + ndisInfo;
                                }
                            }
                            // Case 2: Only name, no NDIS number
                            else if (String.isNotBlank(participantName) && !enhancedDescription.contains(participantName)) {
                                ndisInfo = ' for ' + participantName;
                                enhancedDescription = enhancedDescription + ndisInfo;
                            }
                            // Case 3: Only NDIS number, no name
                            else if (String.isNotBlank(ndisNumber) && !enhancedDescription.contains('NDIS Number: ' + ndisNumber)) {
                                ndisInfo = ' (NDIS Number: ' + ndisNumber + ')';
                                enhancedDescription = enhancedDescription + ndisInfo;
                            }
                        }
                    }
                }
                
                // Debug: Log enhanced description
                System.debug('🔍 Enhanced Description [' + i + ']: ' + enhancedDescription);
                
                // 🔹 Check if Support_Item_Number__c exists in Xero, create if not
                if (String.isNotBlank(supportItemNumber) && !processedItems.containsKey(supportItemNumber)) {
                    // Check if item exists in Xero
                    Boolean itemExists = checkXeroItem(accessToken, tenantId, supportItemNumber);
                    
                    if (!itemExists) {
                        // Create item in Xero using Support_Item_Number__c as ItemCode
                        createXeroItem(accessToken, tenantId, supportItemNumber, accountCode, taxType);
                    }
                    processedItems.put(supportItemNumber, true);
                }
                
                // 🔹 Build line item with enhanced description
                Map<String, Object> lineItem = new Map<String, Object>{
                    'Description'   => enhancedDescription,
                    'Quantity'      => entry.Quantity__c,
                    'UnitAmount'    => entry.Unit_Price__c,
                    'AccountCode'   => accountCode,
                    'TaxType'       => taxType
                };
                
                // Add ItemCode if Support_Item_Number__c is available
                if (String.isNotBlank(supportItemNumber)) {
                    lineItem.put('ItemCode', supportItemNumber);
                }
                
                lineItems.add(lineItem);
            }
            
            // 🔹 Build the JSON body in Xero format
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
            
            // 🔹 Make POST request to Xero
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
                // 🔹 Parse response
                Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                List<Object> invoices = (List<Object>) result.get('Invoices');
                
                if (!invoices.isEmpty()) {
                    Map<String, Object> invoiceData = (Map<String, Object>) invoices[0];
                    String xeroInvoiceId = (String) invoiceData.get('InvoiceID');
                    
                    // 🔹 Update invoice record in Salesforce
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

    // 🔹 Helper method to get account details from Xero
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
    

    // 🔹 Helper method to check if item exists in Xero using Support_Item_Number__c
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
                return false; // Item not found
            } else {
                System.debug('⚠️ Error checking item: ' + res.getBody());
                return false;
            }
        } catch (Exception e) {
            System.debug('❌ Error checking item existence: ' + e.getMessage());
            return false;
        }
    }

    // 🔹 Helper method to create item in Xero using Support_Item_Number__c
    public static void createXeroItem(String accessToken, String tenantId, String itemCode, 
                                    String accountCode, String taxType) {
        try {
            // Build the item object with Support_Item_Number__c as Code
            Map<String, Object> itemMap = new Map<String, Object>{
                'Code' => itemCode,  // This will be the Support_Item_Number__c
                'Name' => itemCode,  // Use Support_Item_Number__c as Name too
                'Description' => 'Item: ' + itemCode
            };
            
            // Add sales details
            Map<String, Object> salesDetails = new Map<String, Object>{
                'UnitPrice' => 0.00,
                'AccountCode' => accountCode,
                'TaxType' => taxType
            };
            
            itemMap.put('SalesDetails', salesDetails);
            
            // Wrap in Items object
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
    
    // get Xero EmployeeIds
    @AuraEnabled
    public static void updateXeroEntityIds(List<Map<String, String>> entityMappings) {

        System.debug('🚀 ===== updateXeroEntityIds START =====');
        System.debug('📥 Incoming entityMappings → ' + entityMappings);

        if (entityMappings == null || entityMappings.isEmpty()) {
            System.debug('⚠️ No entity mappings provided. Exiting.');
            return;
        }

        /* ------------------------------------------------------
        STEP 1 — Build Incoming Map
        ------------------------------------------------------ */
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

        /* ------------------------------------------------------
        STEP 2 — Query Existing Records
        ------------------------------------------------------ */
        System.debug('🔹 STEP 2 — Query Existing Xero_Entity__c Records');

        List<Xero_Entity__c> existingXeroEntities = [
            SELECT Id, Xero_Contact_Id__c
            FROM Xero_Entity__c
            WHERE Id IN :incomingMap.keySet()
        ];

        System.debug('📊 Records fetched → ' + existingXeroEntities.size());
        System.debug('📄 Existing records → ' + existingXeroEntities);


        List<Xero_Entity__c> entitiesToUpdate = new List<Xero_Entity__c>();


        /* ------------------------------------------------------
        STEP 3 — Determine Updates
        ------------------------------------------------------ */
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


        /* ------------------------------------------------------
        STEP 4 — Perform Update
        ------------------------------------------------------ */
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

            /* ---------------------------------------
            XERO INVOICES API
            --------------------------------------- */

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

                // 👉 You can process invoices here

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

                        /* saveSyncStatus(
                            orgRecord.Id,
                            successMsg
                        ); */

                        return successMsg;

                    } else {

                        String noConnectionMsg =
                            'Connected to Xero but no tenant connections found.';

                        /* saveSyncStatus(
                            orgRecord.Id,
                            noConnectionMsg
                        ); */

                        return noConnectionMsg;
                    }

                } else {

                    String connError =
                        'Token valid but connections check failed: ' +
                        connRes.getBody();

                    /* saveSyncStatus(
                        orgRecord.Id,
                        connError
                    ); */

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

                /* saveSyncStatus(
                    orgRecord.Id,
                    finalError
                ); */

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

            if (orgRecord != null) {

                /* saveSyncStatus(
                    orgRecord.Id,
                    unexpectedError
                ); */
            }

            return unexpectedError;

        } finally {

            System.debug('===== syncXero END =====');
        }
    }

    /* @AuraEnabled
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
                
                // Define which account types are allowed
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
                    
                    // Handle SystemAccount as String or Boolean
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
                    
                    // Skip system accounts
                    if (isSystemAccount) {
                        continue;
                    }
                    
                    // Only include ACTIVE accounts
                    if (accountStatus == null || !accountStatus.equals('ACTIVE')) {
                        continue;
                    }
                    
                    // Check if account type is in allowed list
                    Boolean isAllowedAccount = false;
                    
                    if (accountType != null) {
                        String upperType = accountType.toUpperCase();
                        if (allowedTypes.contains(upperType)) {
                            isAllowedAccount = true;
                        }
                    }
                    
                    // If not matched by type, check class for additional filtering
                    if (!isAllowedAccount && accountClass != null) {
                        String upperClass = accountClass.toUpperCase();
                        // Include REVENUE, ASSET, LIABILITY, EQUITY, EXPENSE classes
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
    } */

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
            req.setTimeout(120000);
            
            Http http = new Http();
            HttpResponse res = http.send(req);
            
            System.debug('🔹 Xero Accounts Response: ' + res.getBody());
            
            if (res.getStatusCode() == 200) {
                Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                List<Object> accountsRaw = (List<Object>) result.get('Accounts');
                
                if (accountsRaw == null) {
                    return new List<Map<String, Object>>();
                }
                
                // Modified allowedTypes - removed INCOME, SALES, OTHERINCOME, DIRECTINCOME, OTHERREVENUE
                Set<String> allowedTypes = new Set<String>{
                    'REVENUE', 'EQUITY', 'LIABILITY', 'CURRENTLIABILITY',
                    'NONCURRENTLIABILITY', 'ASSET', 'CURRENTASSET', 'FIXEDASSET',
                    'NONCURRENTASSET', 'EXPENSE', 'OTHEREXPENSE', 'COSTOFGOODSSOLD',
                    'DIRECTCOSTS'
                };
                
                // ✅ EXCLUDED TYPES - Accounts with these types will be filtered out
                Set<String> excludedTypes = new Set<String>{
                    'BANK'
                };
                
                List<Map<String, Object>> accounts = new List<Map<String, Object>>();
                
                for (Object accObj : accountsRaw) {
                    Map<String, Object> account = (Map<String, Object>) accObj;
                    
                    // Check SystemAccount - handles Boolean or String
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
                    
                    // Skip system accounts
                    if (isSystemAccount) continue;
                    
                    // Only include ACTIVE accounts
                    String accountStatus = (String) account.get('Status');
                    if (accountStatus == null || !accountStatus.equals('ACTIVE')) continue;
                    
                    // ✅ Check if account type is EXCLUDED first
                    String accountType = (String) account.get('Type');
                    if (accountType != null && excludedTypes.contains(accountType.toUpperCase())) {
                        continue; // Skip this account (e.g., BANK accounts)
                    }
                    
                    // Check if account type is allowed
                    Boolean isAllowedAccount = false;
                    
                    if (accountType != null && allowedTypes.contains(accountType.toUpperCase())) {
                        isAllowedAccount = true;
                    }
                    
                    // If not matched by type, check class (fallback)
                    if (!isAllowedAccount) {
                        String accountClass = (String) account.get('Class');
                        if (accountClass != null) {
                            String upperClass = accountClass.toUpperCase();
                            if (upperClass == 'REVENUE' || upperClass == 'ASSET' || 
                                upperClass == 'LIABILITY' || upperClass == 'EQUITY' || 
                                upperClass == 'EXPENSE') {
                                isAllowedAccount = true;
                            }
                        }
                    }
                    
                    if (isAllowedAccount) {
                        accounts.add(account);
                    }
                }
                
                System.debug('✅ Total Xero Accounts: ' + accounts.size());
                return accounts;
            } else {
                String errorMsg = '❌ Failed to fetch Xero accounts: ' + res.getBody();
                if (res.getStatusCode() == 401) {
                    errorMsg = 'Authentication expired. Please re-authenticate.';
                }
                throw new AuraHandledException(errorMsg);
            }
        } catch (Exception e) {
            System.debug('❌ Error fetching Xero accounts: ' + e.getMessage());
            throw new AuraHandledException('Error fetching Xero accounts: ' + e.getMessage());
        }
    }

}