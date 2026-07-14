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
        
        // Request body for access token
        String body = 'grant_type=client_credentials'
            + '&scope=accounting.transactions payroll.employees accounting.contacts payroll.timesheets payroll.employees payroll.employees.read payroll.payruns payroll.payruns.read payroll.payslip payroll.payslip.read payroll.settings payroll.settings.read payroll.timesheets payroll.timesheets.read';
        
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

    // STEP Get Employees
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
        
        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://api.xero.com/payroll.xro/1.0/Employees');
        req.setMethod('GET');
        req.setHeader('Authorization', 'Bearer ' + accessToken);
        req.setHeader('Xero-tenant-id', tenantId);
        req.setHeader('Accept', 'application/json');
        
        Http http = new Http();
        HTTPResponse res = http.send(req);
        
        System.debug('🔹 Employees Response: ' + res.getBody());
        
        if (res.getStatusCode() == 200) {
            Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            List<Object> employeesRaw = (List<Object>) result.get('Employees');
            
            List<Map<String, Object>> employees = new List<Map<String, Object>>();
            for (Object empObj : employeesRaw) {
                employees.add((Map<String, Object>) empObj);
            }
            
            System.debug('✅ Employees Count: ' + employees.size());
            return employees;
        } else {
            throw new AuraHandledException('❌ Failed to fetch Xero employees: ' + res.getBody());
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
            // 🔹 Get the staff record from Salesforce
            Staff__c staff = [
                SELECT Id, NameToDisplay__c, Name, Last_Name__c, Date_of_Birth__c, 
                Email_Address__c, Contact_Number__c,address__Street__s,address__City__s,address__StateCode__s,Address__CountryCode__s,Address__PostalCode__s,Gender__c
                FROM Staff__c
                WHERE Id = :staffId
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

            String genderCode;
            if (staff.Gender__c == 'Male') { genderCode = 'M';
            } else if (staff.Gender__c == 'Female') { genderCode = 'F';
            } else if (staff.Gender__c == 'Not Specified') { genderCode = 'N';
            } else if (staff.Gender__c == 'Indeterminate/Intersex/Unspecified') { genderCode = 'I';
            } else {
                genderCode = null; // fallback if value is blank or unknown
            }
            
            // 🔹 Build the JSON body in Xero format
            Map<String, Object> empMap = new Map<String, Object>{
                'FirstName' => staff.Name,
                    'LastName' => staff.Last_Name__c,
                    'Email' => staff.Email_Address__c,
                    'DateOfBirth' => '/Date(' + Datetime.newInstanceGmt(staff.Date_of_Birth__c.year(), staff.Date_of_Birth__c.month(), staff.Date_of_Birth__c.day()).getTime() + '+0000)/',
                    'Gender' => genderCode,
                    'HomeAddress' => new Map<String, Object>{
                        'AddressLine1' => staff.address__Street__s,
                            'City' => staff.address__City__s,
                            'Region' => staff.address__StateCode__s,
                            'PostalCode' => staff.Address__PostalCode__s,
                            'Country' => staff.Address__CountryCode__s
                            }
            };
                
                List<Map<String, Object>> bodyList = new List<Map<String, Object>>{ empMap };
                    String bodyJSON = JSON.serialize(bodyList);
            
            // 🔹 Make POST request to Xero
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
            
            System.debug('🔹 Xero Response: ' + res.getBody());
            
            System.debug('🔹 Xero Response: ' + res.getBody());
            
            if (res.getStatusCode() == 200 || res.getStatusCode() == 201) {
                // 🔹 Parse response
                Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                List<Object> employees = (List<Object>) result.get('Employees');
                
                if (!employees.isEmpty()) {
                    Map<String, Object> employeeData = (Map<String, Object>) employees[0];
                    String employeeId = (String) employeeData.get('EmployeeID');
                    
                    // 🔹 Update Staff record in Salesforce
                    staff.Xero_Employee_ID__c = employeeId;
                    update staff;
                    
                    System.debug('✅ Xero EmployeeID saved in Staff: ' + employeeId);
                    return '✅ Employee created in Xero with ID: ' + employeeId;
                } else {
                    throw new AuraHandledException('❌ No Employees returned in Xero response.');
                }
            } else {
                throw new AuraHandledException('❌ Xero API Error: ' + res.getBody());
            }
            
        } catch (Exception e) {
            System.debug('❌ Error creating Xero employee: ' + e.getMessage());
            throw new AuraHandledException('Error creating Xero employee: ' + e.getMessage());
        }
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
    public static String createOrUpdateXeroInvoice(Id invoiceId) {
        try {
            System.debug('invoiceId: ' + invoiceId);
            // 🔹 Get the invoice record from Salesforce
            Xero_or_Myob_Invoice__c invoice = [
                SELECT Id,Invoice_Date__c,Name,Invoice_No__c,Invoice_Source__c,Is_Service_Invoice__c,Total_Amount__c,Xero_Innvoice_Id__c,Xero_Entity__c, Xero_Entity__r.First_Name__c,
                Xero_Entity__r.Last_Name__c,Xero_Entity__r.Xero_Contact_Id__c,(SELECT Id,Description__c,Invoice_Date__c,Line_Items__c, Quantity__c,Sub_Total__c,Tax_Amount__c,
                                                                               Total_Amount__c, Tax_Inclusive__c,Unit_Price__c FROM Xero_Invoice_Entries__r where Unit_Price__c != null and Quantity__c != null  )
                FROM Xero_or_Myob_Invoice__c
                WHERE Id = :invoiceId and Invoice_Source__c= 'Xero'
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
            String accountCode = '200';
            String taxType = 'EXEMPTOUTPUT';
            String invoiceDateStr = invoice.Invoice_Date__c != null
                ? DateTime.newInstance(invoice.Invoice_Date__c, Time.newInstance(0, 0, 0, 0)).format('yyyy-MM-dd\'T\'HH:mm:ss\'Z\'', 'GMT') : DateTime.now().format('yyyy-MM-dd\'T\'HH:mm:ss\'Z\'', 'GMT');
            List<Map<String, Object>> lineItems = new List<Map<String, Object>>();
            for (Xero_Invoice_Entries__c entry : invoice.Xero_Invoice_Entries__r) {
                Map<String, Object> lineItem = new Map<String, Object>{
                    'Description'   => entry.Description__c,
                        'Quantity'      => entry.Quantity__c,
                        'UnitAmount'    => entry.Unit_Price__c,
                        'AccountCode'   =>accountCode,
                        'TaxType'       =>taxType 
                        // 'DiscountRate'  => entry.Discount__c != null ? entry.Discount__c : 0 // optional
                        };
                            lineItems.add(lineItem);
            }
            // 🔹 Build the JSON body in Xero format
            Map<String, Object> xeroInvoiceMap = new Map<String, Object>{
                'Type' => 'ACCREC',
                    'Contact' => new Map<String, Object>{
                        'ContactID' => invoice.Xero_Entity__r.Xero_Contact_Id__c
                            },
                                // 'Date' => '/Date(' + DateTime.now().getTime() + '+0000)/',
                                'Date' => invoice.Invoice_Date__c,
                                'DateString' => invoiceDateStr,
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
            
            System.debug('🔹 Xero Response: ' + res.getBody());
            
            if (res.getStatusCode() == 200 || res.getStatusCode() == 201) {
                // 🔹 Parse response
                Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                List<Object> invoices  = (List<Object>) result.get('Invoices');
                
                if (!Invoices.isEmpty()) {
                    Map<String, Object> invoiceData  = (Map<String, Object>) invoices[0];
                    String xeroInvoiceId = (String) invoiceData .get('InvoiceID');
                    
                    // 🔹 Update invoice record in Salesforce
                    invoice.Xero_Innvoice_Id__c  = xeroInvoiceId;
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
}