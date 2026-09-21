public with sharing class MyobIntegrationController {

    @AuraEnabled(cacheable=false)
    public static String getMyobAuthLink(String redirectUrl) {
        try {

            system.debug('redirectUrl >>>>'+ redirectUrl);
            // Step 1: Get current user's organisation name
            User currentUser = [
                SELECT Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            // Step 2: Fetch MYOB Client ID and Secret from Organisation record
            Organisation__c orgRecord = [
                SELECT Client_Id__c, Client_Secret__c
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];

            String clientId = orgRecord.Client_Id__c;
            String redirectUri = EncodingUtil.urlEncode(redirectUrl, 'UTF-8');

            // Step 3: Build MYOB Authorization URL
            String authUrl = 'https://secure.myob.com/oauth2/account/authorize'
                + '?client_id=' + clientId
                + '&redirect_uri=' + redirectUri
                + '&response_type=code'
                + '&scope=sme-company-file sme-company-settings sme-payroll sme-contacts-employee sme-general-ledger sme-sales sme-timebilling sme-inventory sme-contacts-customer sme-contacts-supplier sme-contacts-personal sme-banking sme-purchases&prompt=consent';

            System.debug('🔹 Step 3: MYOB Authorization URL: ' + authUrl);

            // Step 4: Send the GET request
            Http http = new Http();
            HttpRequest req = new HttpRequest();
            req.setEndpoint(authUrl);
            req.setMethod('GET');
            req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
            HttpResponse res = http.send(req);

            System.debug('🔹 Step 4: Auth Response Status: ' + res.getStatusCode());
            System.debug('🔹 Step 4: Auth Response Body: ' + res.getBody());

            // Step 5: Extract the redirect <a href> from HTML
            String body = res.getBody();
            String hrefLink;
            if (body != null && body.contains('<a href=')) {
                Pattern p = Pattern.compile('<a href="([^"]+)"');
                Matcher m = p.matcher(body);
                if (m.find()) {
                    hrefLink = m.group(1);
                }
            }

            System.debug('✅ Extracted hrefLink: ' + hrefLink);

            // Step 6: Return fully qualified link
            if (!String.isBlank(hrefLink)) {
                if (!hrefLink.startsWith('http')) {
                    hrefLink = 'https://secure.myob.com' + hrefLink; }
            System.debug('✅ Extracted hrefLink: ' + hrefLink);
                return authUrl; } else { return null; } } catch (Exception e) { return null;
        }
    }

    @AuraEnabled(cacheable=false)
    public static String exchangeMyobCodeForToken(String code, String redirectUrl) {
        try {

            system.debug('code >>>>>>>'+ code);
            system.debug('redirectUrl >>>>>>>'+ redirectUrl);
            // Get org credentials
            User currentUser = [
                SELECT Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            Organisation__c orgRecord = [
                SELECT Client_Id__c, Client_Secret__c
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];

            String clientId = orgRecord.Client_Id__c;
            String clientSecret = orgRecord.Client_Secret__c;
            String redirectUri = redirectUrl;

            // Build the token request
            HttpRequest req = new HttpRequest();
            req.setEndpoint('https://secure.myob.com/oauth2/token');
            req.setMethod('POST');
            req.setHeader('Content-Type', 'application/x-www-form-urlencoded');

            String body = 'grant_type=authorization_code' +
                '&client_id=' + EncodingUtil.urlEncode(clientId, 'UTF-8') +
                '&client_secret=' + EncodingUtil.urlEncode(clientSecret, 'UTF-8') +
                '&redirect_uri=' + EncodingUtil.urlEncode(redirectUri, 'UTF-8') +
                '&code=' + EncodingUtil.urlEncode(code, 'UTF-8');
            req.setBody(body);
            
            System.debug('req body >>>>>>>>'+ body);

            Http http = new Http();
            HttpResponse res = http.send(req);

            System.debug('🔹 Token Response: ' + res.getBody());

            // ✅ Return full JSON response instead of only access token
            return res.getBody(); } catch (Exception e) { return '{"error":"'+e.getMessage()+'"}';
        }
    }

    @AuraEnabled(cacheable=false)
    public static String refreshMyobToken(String refreshToken) {
        try {

            User currentUser = [
                SELECT Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            Organisation__c orgRecord = [
                SELECT Client_Id__c, Client_Secret__c
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];

            String clientId = orgRecord.Client_Id__c;
            String clientSecret = orgRecord.Client_Secret__c;

            HttpRequest req = new HttpRequest();
            req.setEndpoint('https://secure.myob.com/oauth2/v1/authorize/');
            req.setMethod('POST');
            req.setHeader('Content-Type', 'application/x-www-form-urlencoded');

            String body =
                'client_id=' + clientId +
                '&client_secret=' + clientSecret +
                '&grant_type=refresh_token' +
                '&refresh_token=' + refreshToken;

            req.setBody(body);

            Http http = new Http();
            HttpResponse res = http.send(req);

            System.debug('🔄 Refresh Token Response: ' + res.getBody());

            return res.getBody(); } catch (Exception e) { return null;
        }
    }

    // 🔹 Step 3: Get specific company file details
    @AuraEnabled(cacheable=false)
    public static String getMyobCompanyFiles(String accessToken, String refreshToken, String businessId) {
        try {

            User currentUser = [
                SELECT Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            Organisation__c orgRecord = [
                SELECT Client_Id__c, Client_Secret__c
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];

            // 1️⃣ Refresh tokens FIRST
            String refreshResponse = refreshMyobToken(refreshToken);
            System.debug('♻️ Refresh Response: ' + refreshResponse);

            if (String.isBlank(refreshResponse)) {return null;
            }

            // 2️⃣ Convert refresh response to map
            Map<String, Object> refreshed =
                (Map<String, Object>) JSON.deserializeUntyped(refreshResponse);

            String newAccessToken  = (String) refreshed.get('access_token');
            String newRefreshToken = (String) refreshed.get('refresh_token');

            System.debug('🆕 NEW Access Token: ' + newAccessToken);
            System.debug('🆕 NEW Refresh Token: ' + newRefreshToken);

            // 3️⃣ Now call Company Files API with NEW access token
            HttpRequest req = new HttpRequest();
            req.setEndpoint('https://api.myob.com/accountright/' + businessId + '/');
            req.setMethod('GET');
            req.setHeader('Authorization', 'Bearer ' + newAccessToken);
            req.setHeader('x-myobapi-key', orgRecord.Client_Id__c);
            req.setHeader('x-myobapi-version', 'v2');
            req.setHeader('Accept', 'application/json');
            req.setHeader('Accept-Encoding', 'gzip,deflate');

            Http http = new Http();
            HttpResponse res = http.send(req);

            System.debug('📦 Company Files Response: ' + res.getBody());

            // 4️⃣ Prepare final JSON response
            Map<String, Object> fullResponse = new Map<String, Object>();
            fullResponse.put('access_token', newAccessToken);
            fullResponse.put('refresh_token', newRefreshToken);
            fullResponse.put('companyFiles', JSON.deserializeUntyped(res.getBody()));

            return JSON.serialize(fullResponse);} catch (Exception e) {return null;
        }
    }

    @AuraEnabled(cacheable=false)
    public static String getCompanyFileDetails(String accessToken, String companyFileGuid) {
        try {
            User currentUser = [
                SELECT Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            Organisation__c orgRecord = [
                SELECT Client_Id__c, Client_Secret__c
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];

            Http http = new Http();

            HttpRequest req1 = new HttpRequest();
            req1.setEndpoint('https://api.myob.com/accountright/' + companyFileGuid);
            req1.setMethod('GET');
            req1.setHeader('Authorization', 'Bearer ' + accessToken);
            req1.setHeader('x-myobapi-key', orgRecord.Client_Id__c);
            req1.setHeader('x-myobapi-version', 'v2');
            req1.setHeader('Accept', 'application/json');

            HttpResponse res1 = http.send(req1);

            System.debug('📄 Company File Response: ' + res1.getBody());

            try {
                String wageEndpoint =
                    'https://api.myob.com/accountright/' +
                    companyFileGuid +
                    '/Payroll/PayrollCategory/Wage';

                HttpRequest req2 = new HttpRequest();
                req2.setEndpoint(wageEndpoint);
                req2.setMethod('GET');
                req2.setHeader('Authorization', 'Bearer ' + accessToken);
                req2.setHeader('x-myobapi-key', orgRecord.Client_Id__c);
                req2.setHeader('x-myobapi-version', 'v2');
                req2.setHeader('Accept', 'application/json');

                HttpResponse res2 = http.send(req2);

                System.debug('📄 Wage Categories Response: ' + res2.getBody());
                saveMyobWageCategories(res2.getBody(), orgRecord.Id);}catch (Exception wageError) {
                System.debug('⚠️ Wage Categories Call Failed: ' + wageError.getMessage());
            }

            return res1.getBody();}catch (Exception e) {throw new AuraHandledException('Error fetching company file: ' + e.getMessage());
        }
    }

    // save wage categories
    public static void saveMyobWageCategories(String responseBody, Id orgId) {

        System.debug('================ MYOB Wage Category Sync START ================');
        System.debug('🏢 Organisation Id Received: ' + orgId);

        if (String.isBlank(responseBody)) {return;
        }

        System.debug('📨 Raw Wage Category Response: ' + responseBody);

        // Parse JSON
        Map<String, Object> jsonMap = (Map<String, Object>) JSON.deserializeUntyped(responseBody);

        if (!jsonMap.containsKey('Items')) {return;
        }

        List<Object> items = (List<Object>) jsonMap.get('Items');
        System.debug('📦 Total Wage Categories Received: ' + items.size());

        // Collect UID values
        Set<String> incomingUids = new Set<String>();

        for (Object obj : items) {
            Map<String, Object> item = (Map<String, Object>) obj;

            String uid = (String) item.get('UID');
            System.debug('🔎 Extracted UID: ' + uid);

            if (!String.isBlank(uid)) {
                incomingUids.add(uid);
            }
        }

        System.debug('🧩 Unique MYOB UIDs Extracted: ' + incomingUids);

        // ============================
        // IMPORTANT FIX #1:
        // Correct SOQL: IN :incomingUids
        // ============================

        List<MYOB_Payroll_Category__c> existingRecords = [
            SELECT Id, Wage_Categories_Id__c, Wage_Categories_Name__c, Organization__c
            FROM MYOB_Payroll_Category__c
            WHERE Wage_Categories_Id__c IN :incomingUids
        ];

        System.debug('📂 Existing SF Records Found: ' + existingRecords.size());

        // ============================
        // IMPORTANT FIX #2:
        // Map key = UID, not Salesforce Id
        // ============================
        Map<String, MYOB_Payroll_Category__c> existingMap = new Map<String, MYOB_Payroll_Category__c>();

        for (MYOB_Payroll_Category__c pc : existingRecords) {existingMap.put(pc.Wage_Categories_Id__c, pc);
        }

        System.debug('📂 Existing UID Map Keys: ' + existingMap.keySet());

        List<MYOB_Payroll_Category__c> toUpsert = new List<MYOB_Payroll_Category__c>();

        // Loop through MYOB response items
        for (Object obj : items) {

            Map<String, Object> item = (Map<String, Object>) obj;

            String uid = (String) item.get('UID');
            String name = (String) item.get('Name');

            System.debug('➡ Processing Item | UID: ' + uid + ' | Name: ' + name);

            if (String.isBlank(uid)) {continue;
            }

            MYOB_Payroll_Category__c record;

            // ============================
            // UPDATE IF EXISTS
            // ============================
            if (existingMap.containsKey(uid)) {record = existingMap.get(uid);record.Wage_Categories_Name__c = name;record.Organization__c = orgId;
            }

            // ============================
            // INSERT IF NEW
            // ============================
            else {
                System.debug('🟢 UID Not Found — Creating NEW: ' + uid);

                record = new MYOB_Payroll_Category__c();
                record.Wage_Categories_Id__c = uid;
                record.Wage_Categories_Name__c = name;
                record.Organization__c = orgId;
            }

            toUpsert.add(record);
        }

        System.debug('📥 Total Records to Upsert: ' + toUpsert.size());
        System.debug('📥 Upsert Payload: ' + toUpsert);

        if (!toUpsert.isEmpty()) {
            upsert toUpsert;
            System.debug('✅ Upsert Completed Successfully. Records Saved/Updated: ' + toUpsert.size());
        } else {
            System.debug('⚠ No Records to Upsert.');
        }

        System.debug('================ MYOB Wage Category Sync END ================');
    }  

    // 🔹 Step 4: Get employees from MYOB company file
    @AuraEnabled(cacheable=false)
    public static String getMyobEmployees(String accessToken, String refreshToken, String companyFileGuid) {
        try {
            System.debug('🔹 Incoming Access Token: ' + accessToken);
            System.debug('🔹 CompanyFileGuid: ' + companyFileGuid);

            // 1️⃣ Load org data
            User currentUser = [
                SELECT Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            Organisation__c orgRecord = [
                SELECT Client_Id__c, Client_Secret__c
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];

            // 2️⃣ Refresh the token FIRST
            String refreshResponse = refreshMyobToken(refreshToken);
            System.debug('♻️ Refresh Token Response: ' + refreshResponse);

            if (String.isBlank(refreshResponse)) {return null;
            }

            Map<String, Object> refreshed = 
                (Map<String, Object>) JSON.deserializeUntyped(refreshResponse);

            String newAccessToken  = (String) refreshed.get('access_token');
            String newRefreshToken = (String) refreshed.get('refresh_token');

            System.debug('🆕 NEW Access Token: ' + newAccessToken);
            System.debug('🆕 NEW Refresh Token: ' + newRefreshToken);

            // 3️⃣ Call MYOB EMPLOYEE API
            HttpRequest req = new HttpRequest();
            req.setEndpoint( companyFileGuid + '/Contact/Employee/');
            req.setMethod('GET');

            req.setHeader('Authorization', 'Bearer ' + newAccessToken);
            req.setHeader('x-myobapi-key', orgRecord.Client_Id__c);
            req.setHeader('x-myobapi-version', 'v2');
            req.setHeader('Accept-Encoding', 'gzip,deflate');
            req.setHeader('Accept', 'application/json');

            Http http = new Http();
            HttpResponse res = http.send(req);

            System.debug('👥 Employee Response: ' + res.getBody());

            // 4️⃣ FINAL WRAPPER to send back to JS
            Map<String, Object> response = new Map<String, Object>();
            response.put('access_token', newAccessToken);
            response.put('refresh_token', newRefreshToken);
            response.put('employees', JSON.deserializeUntyped(res.getBody()));

            return JSON.serialize(response);}catch (Exception e) {return null;
        }
    }

    // 🔹 Step 5: Get Customers from MYOB company file
    @AuraEnabled(cacheable=false)
    public static String getMyobCustomers(String accessToken, String refreshToken, String companyFileGuid) {
        try {

            // 1️⃣ Load Org details
            User currentUser = [
                SELECT Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            Organisation__c orgRecord = [
                SELECT Client_Id__c
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];

            // 2️⃣ Refresh Token
            String refreshResponse = refreshMyobToken(refreshToken);
            System.debug('♻️ Refresh Token Response: ' + refreshResponse);

            if (String.isBlank(refreshResponse)) {return null;
            }

            Map<String, Object> refreshed = 
                (Map<String, Object>) JSON.deserializeUntyped(refreshResponse);

            String newAccessToken  = (String) refreshed.get('access_token');
            String newRefreshToken = (String) refreshed.get('refresh_token');

            System.debug('🆕 NEW Access Token: ' + newAccessToken);
            System.debug('🆕 NEW Refresh Token: ' + newRefreshToken);

            // 3️⃣ Build Endpoint
            String endpoint = 'https://api.myob.com/accountright/' 
                                + companyFileGuid 
                                + '/Contact/Customer';

            HttpRequest req = new HttpRequest();
            req.setEndpoint(endpoint);
            req.setMethod('GET');

            req.setHeader('Authorization', 'Bearer ' + newAccessToken);
            req.setHeader('x-myobapi-key', orgRecord.Client_Id__c);
            req.setHeader('x-myobapi-version', 'v2');
            req.setHeader('Accept', 'application/json');
            req.setHeader('Accept-Encoding', 'gzip,deflate');

            Http http = new Http();
            HttpResponse res = http.send(req);

            System.debug('🔹 MYOB Customers Response: ' + res.getBody());

            // 4️⃣ Validate JSON (avoid HTML crash)
            Boolean isJson = res.getBody().startsWith('{') || res.getBody().startsWith('[');

            if (!isJson) {throw new AuraHandledException('MYOB returned invalid/non-JSON response');
            }

            // 5️⃣ Prepare unified wrapper response
            Map<String, Object> finalResponse = new Map<String, Object>();

            finalResponse.put('access_token', newAccessToken);
            finalResponse.put('refresh_token', newRefreshToken);
            finalResponse.put('customers', JSON.deserializeUntyped(res.getBody()));

            return JSON.serialize(finalResponse);}catch (Exception e) {return '{"error":"'+ e.getMessage() +'"}';
        }
    }

    // 🔹 Step 6: Get Suppliers from MYOB company file
    @AuraEnabled(cacheable=false)
    public static String getMyobSuppliers(String accessToken, String refreshToken, String companyFileGuid) {
        try {

            // 1️⃣ Load Org → API Key
            User currentUser = [
                SELECT Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            Organisation__c orgRecord = [
                SELECT Client_Id__c
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];

            // 2️⃣ Refresh Token
            String refreshResponse = refreshMyobToken(refreshToken);
            System.debug('♻️ Refresh Token Response: ' + refreshResponse);

            if (String.isBlank(refreshResponse)) {return null;
            }

            Map<String, Object> refreshed = 
                (Map<String, Object>) JSON.deserializeUntyped(refreshResponse);

            String newAccessToken  = (String) refreshed.get('access_token');
            String newRefreshToken = (String) refreshed.get('refresh_token');

            System.debug('🆕 NEW Access Token: ' + newAccessToken);
            System.debug('🆕 NEW Refresh Token: ' + newRefreshToken);

            // 3️⃣ Build endpoint
            String endpoint = 'https://api.myob.com/accountright/' 
                                + companyFileGuid 
                                + '/Contact/Supplier';

            HttpRequest req = new HttpRequest();
            req.setEndpoint(endpoint);
            req.setMethod('GET');

            req.setHeader('Authorization', 'Bearer ' + newAccessToken);   // FIXED!
            req.setHeader('x-myobapi-key', orgRecord.Client_Id__c);
            req.setHeader('x-myobapi-version', 'v2');
            req.setHeader('Accept', 'application/json');
            req.setHeader('Accept-Encoding', 'gzip,deflate');

            Http http = new Http();
            HttpResponse res = http.send(req);

            System.debug('🔹 MYOB Suppliers Response: ' + res.getBody());

            // 4️⃣ Validate MYOB response (prevent HTML parsing failure)
            Boolean isJson = res.getBody().startsWith('{') || res.getBody().startsWith('[');

            if (!isJson) {throw new AuraHandledException('MYOB returned invalid/non-JSON response');
            }

            // 5️⃣ Final wrapper to JS
            Map<String, Object> finalResponse = new Map<String, Object>();
            finalResponse.put('access_token', newAccessToken);
            finalResponse.put('refresh_token', newRefreshToken);
            finalResponse.put('suppliers', JSON.deserializeUntyped(res.getBody()));

            return JSON.serialize(finalResponse);}catch (Exception e) {return '{"error":"'+ e.getMessage() +'"}';
        }
    }

    @AuraEnabled(cacheable=false)
    public static String createMyobEmployee(String accessToken, String refreshToken, String companyFileUri, String staffId) {
        try {
            // 1️⃣ Load Org
            User currentUser = [
                SELECT Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            Organisation__c orgRecord = [
                SELECT Client_Id__c
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];

            // 2️⃣ Refresh Token
            String refreshResponse = refreshMyobToken(refreshToken);
            System.debug('♻️ Refresh Token Response: ' + refreshResponse);

            if (String.isBlank(refreshResponse)) {throw new AuraHandledException('Refresh token failed.');
            }

            Map<String, Object> refreshed =
                (Map<String, Object>) JSON.deserializeUntyped(refreshResponse);

            String newAccessToken  = (String) refreshed.get('access_token');
            String newRefreshToken = (String) refreshed.get('refresh_token');

            System.debug('🆕 NEW Access Token: ' + newAccessToken);
            System.debug('🆕 NEW Refresh Token: ' + newRefreshToken);

            // 3️⃣ Load Staff
            Staff__c staff = [
                SELECT Id, NameToDisplay__c, Name, Last_Name__c, 
                    Date_of_Birth__c, Email_Address__c, Contact_Number__c,
                    Address__Street__s, Address__City__s, Address__StateCode__s,
                    Address__CountryCode__s, Address__PostalCode__s,
                    Gender__c
                FROM Staff__c
                WHERE Id = :staffId
                LIMIT 1
            ];

            // 4️⃣ Prepare MYOB EMPLOYEE Payload
            Map<String, Object> payload = new Map<String, Object>();
            payload.put('IsIndividual', true);
            payload.put('FirstName', staff.Name);
            payload.put('LastName', staff.Last_Name__c);

            // Address Handling
            List<Object> addresses = new List<Object>();
            Map<String, Object> addr = new Map<String, Object>();

            if (staff.Email_Address__c != null)        addr.put('Email', staff.Email_Address__c);
            if (staff.Contact_Number__c != null)       addr.put('Phone1', staff.Contact_Number__c);
            if (staff.Address__Street__s != null)      addr.put('Street',    staff.Address__Street__s);
            if (staff.Address__City__s != null)        addr.put('City',      staff.Address__City__s);
            if (staff.Address__StateCode__s != null)   addr.put('State',     staff.Address__StateCode__s);
            if (staff.Address__CountryCode__s != null) addr.put('Country',   staff.Address__CountryCode__s);
            if (staff.Address__PostalCode__s != null)  addr.put('PostCode',  staff.Address__PostalCode__s);

            addresses.add(addr);
            payload.put('Addresses', addresses);

            // DOB → /Date(ms+0000)/
            if (staff.Date_of_Birth__c != null) {
                Date epoch = Date.newInstance(1970, 1, 1);
                Long days = epoch.daysBetween(staff.Date_of_Birth__c);
                Long millis = days * 86400000L;
                payload.put('DateOfBirth', '/Date(' + millis + '+0000)/');
            }

            if (staff.Gender__c != null) payload.put('Gender', staff.Gender__c);

            String body = JSON.serialize(payload);
            System.debug('📤 MYOB Employee payload: ' + body);

            // 5️⃣ Prepare Callout
            Http http = new Http();
            HttpRequest req = new HttpRequest();

            req.setEndpoint(companyFileUri + '/Contact/Employee');
            req.setMethod('POST');
            req.setHeader('Authorization', 'Bearer ' + newAccessToken);
            req.setHeader('x-myobapi-key', orgRecord.Client_Id__c);
            req.setHeader('x-myobapi-version', 'v2');
            req.setHeader('Content-Type', 'application/json');
            req.setHeader('Accept-Encoding', 'gzip,deflate');

            req.setBody(body);

            // 6️⃣ Send Callout
            HttpResponse res = http.send(req);
            System.debug('📥 MYOB Status: ' + res.getStatus() + ' (' + res.getStatusCode() + ')');
            System.debug('📥 MYOB Body: ' + res.getBody());

            // 7️⃣ SUCCESS BLOCK — Your requirement
            if (res.getStatusCode() == 200 || res.getStatusCode() == 201) {

                // Handle empty or invalid JSON bodies
                String responseBody = res.getBody();
                Object employeeResponse;

                if (String.isBlank(responseBody)) {employeeResponse = new Map<String, Object>();
                }
                else if (responseBody.startsWith('{') || responseBody.startsWith('[')) {
                    employeeResponse = JSON.deserializeUntyped(responseBody);}else {employeeResponse = responseBody;
                }

                // Wrapper for LWC
                Map<String, Object> finalResponse = new Map<String, Object>();
                finalResponse.put('access_token', newAccessToken);
                finalResponse.put('refresh_token', newRefreshToken);
                finalResponse.put('employee', employeeResponse);

                return JSON.serialize(finalResponse);
            }
            else {
                throw new AuraHandledException(
                    'MYOB create employee failed. Status: ' +
                    res.getStatusCode() + ' Body: ' + res.getBody()
                );
            }
        }
        catch (Exception e) {
            System.debug('❌ Error in createMyobEmployee: ' + e.getMessage());
            throw new AuraHandledException('Error creating MYOB employee: ' + e.getMessage());
        }
    }

    // 🔹 Helper: Get MYOB API Client ID from Organisation__c
    public static String getClientId() {

        // Get current user’s Organisation name
        User currentUser = [
            SELECT Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        if (String.isBlank(currentUser.Organization_Name__c)) {
            throw new AuraHandledException('User does not have Organization_Name__c set.');
        }

        // Fetch Organisation record
        Organisation__c orgRec = [
            SELECT Name, Client_Id__c
            FROM Organisation__c
            WHERE Name = :currentUser.Organization_Name__c
            LIMIT 1
        ];

        if (String.isBlank(orgRec.Client_Id__c)) {
            throw new AuraHandledException('Organisation Client_Id__c is missing.');
        }

        return orgRec.Client_Id__c;
    }

    @AuraEnabled
    public static String createEntityInMYOB(String entityId, String companyFileUri, String refreshToken, String accessToken) {
        try {
            System.debug('🚀 createEntityInMYOB START');
            System.debug('➡ entityId: ' + entityId);
            System.debug('➡ companyFileUri: ' + companyFileUri);

            // ------------------------------------------------------
            // 1️⃣ Load Entity
            // ------------------------------------------------------
            Xero_Entity__c entityRec = [
                SELECT Id, First_Name__c, Last_Name__c, Email__c, Contact__c, ABN__c,
                    Address_Latest__Street__s, Address_Latest__City__s,
                    Address_Latest__StateCode__s, Address_Latest__PostalCode__s
                FROM Xero_Entity__c
                WHERE Id = :entityId
                LIMIT 1
            ];
            System.debug('🧾 Loaded Entity: ' + JSON.serialize(entityRec));

            // ------------------------------------------------------
            // 2️⃣ Validate + Format ABN
            // ------------------------------------------------------
            String rawABN = entityRec.ABN__c;
            System.debug('🔎 Raw ABN = ' + rawABN);

            String cleanABN = null;
            Boolean abnValid = false;

            if (!String.isBlank(rawABN)) {
                // Remove non-digits (spaces, hyphens, etc.)
                cleanABN = rawABN.replaceAll('\\D', '');
                System.debug('🔧 Cleaned ABN = ' + cleanABN);

                abnValid = isValidABNForMyob(cleanABN);
            } else {
                System.debug('⚠️ ABN is NULL or EMPTY');
            }

            System.debug('🔎 ABN valid? = ' + abnValid);


            /* if (!abnValid) {throw new AuraHandledException('Invalid ABN: ' + rawABN);
            } */

            // Format ABN → always XX XXX XXX XXX
            String formattedABN = formatABN(cleanABN);
            System.debug('📌 Formatted ABN Sent to MYOB = ' + formattedABN);

            // ------------------------------------------------------
            // 3️⃣ Load Org > API Key
            // ------------------------------------------------------
            User currentUser = [
                SELECT Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            Organisation__c orgRecord = [
                SELECT Client_Id__c
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];

            String apiKey = orgRecord.Client_Id__c;
            System.debug('🔐 MYOB API Key: ' + apiKey);

            // ------------------------------------------------------
            // 4️⃣ Refresh Token
            // ------------------------------------------------------
            System.debug('🔄 Refreshing MYOB Token...');
            String refreshResponse = refreshMyobToken(refreshToken);
            System.debug('♻️ Refresh Token Response: ' + refreshResponse);

            if (String.isBlank(refreshResponse)) {throw new AuraHandledException('MYOB Token refresh failed.');
            }

            Map<String,Object> refreshed = (Map<String,Object>) JSON.deserializeUntyped(refreshResponse);
            String newAccessToken  = (String) refreshed.get('access_token');
            String newRefreshToken = (String) refreshed.get('refresh_token');

            System.debug('🆕 Access Token = ' + newAccessToken);
            System.debug('🆕 Refresh Token = ' + newRefreshToken);

            // ------------------------------------------------------
            // 5️⃣ Fetch Tax Codes (GST)
            // ------------------------------------------------------
            System.debug('📡 Fetching MYOB Tax Codes...');

            Http http = new Http();
            HttpRequest taxReq = new HttpRequest();
            taxReq.setEndpoint(companyFileUri + '/GeneralLedger/TaxCode');
            taxReq.setMethod('GET');
            taxReq.setHeader('Authorization', 'Bearer ' + newAccessToken);
            taxReq.setHeader('x-myobapi-key', apiKey);
            taxReq.setHeader('x-myobapi-version', 'v2');
            taxReq.setHeader('Accept', 'application/json');

            HttpResponse taxRes = http.send(taxReq);
            System.debug('📘 TaxCode Response Body = ' + taxRes.getBody());

            Map<String,Object> taxJson = (Map<String,Object>) JSON.deserializeUntyped(taxRes.getBody());
            List<Object> taxItems = (List<Object>) taxJson.get('Items');

            String gstUID;
            gstUID = null;

            for (Object o : taxItems) {
                Map<String,Object> row = (Map<String,Object>) o;
                if (row.get('Code') == 'GST') {
                    gstUID = (String) row.get('UID');
                    break;
                }
            }

            System.debug('🟢 GST TaxCode UID = ' + gstUID);

            if (gstUID == null) {throw new AuraHandledException('GST TaxCode not found.');
            }

            // ------------------------------------------------------
            // 6️⃣ Build Payload
            // ------------------------------------------------------
            Map<String,Object> payload = new Map<String,Object>();

            payload.put('CompanyName', entityRec.First_Name__c + ' ' + entityRec.Last_Name__c);
            payload.put('IsIndividual', false);

            Map<String,Object> addr = new Map<String,Object>();
            addr.put('Location', 1);
            addr.put('Street', entityRec.Address_Latest__Street__s);
            addr.put('City', entityRec.Address_Latest__City__s);
            addr.put('State', entityRec.Address_Latest__StateCode__s);
            addr.put('PostCode', entityRec.Address_Latest__PostalCode__s);
            addr.put('Country', 'Australia');
            addr.put('Phone1', entityRec.Contact__c);
            addr.put('Email', entityRec.Email__c);

            payload.put('Addresses', new List<Object>{ addr });

            Map<String,Object> selling = new Map<String,Object>();
            selling.put('ABN', formattedABN);
            selling.put('TaxCode', new Map<String,Object>{ 'UID' => gstUID });
            selling.put('FreightTaxCode', new Map<String,Object>{ 'UID' => gstUID });

            payload.put('SellingDetails', selling);

            System.debug('📤 FINAL PAYLOAD = ' + JSON.serializePretty(payload));

            // ------------------------------------------------------
            // 7️⃣ POST to MYOB
            // ------------------------------------------------------
            System.debug('📡 Sending POST to MYOB...');

            HttpRequest req = new HttpRequest();
            req.setEndpoint(companyFileUri + '/Contact/Customer');
            req.setMethod('POST');
            req.setHeader('Authorization', 'Bearer ' + newAccessToken);
            req.setHeader('x-myobapi-key', apiKey);
            req.setHeader('x-myobapi-version', 'v2');
            req.setHeader('Content-Type', 'application/json');
            req.setBody(JSON.serialize(payload));

            HttpResponse res = http.send(req);

            System.debug('📨 MYOB Status = ' + res.getStatus());
            System.debug('📨 MYOB Body = ' + res.getBody());

            String rawBody = res.getBody();
            Object customerResponse;
            String uid = null;

            if (String.isNotBlank(rawBody) && rawBody.startsWith('{')) {
                customerResponse = JSON.deserializeUntyped(rawBody);
                uid = (String)((Map<String,Object>)customerResponse).get('UID');} else {customerResponse = rawBody;
            }

            System.debug('🔑 Extracted MYOB UID = ' + uid);

            // ------------------------------------------------------
            // 8️⃣ Update Salesforce if UID exists
            // ------------------------------------------------------
            if (uid != null) {update new Xero_Entity__c(Id = entityId, Xero_Contact_Id__c = uid
                );
            }

            // ------------------------------------------------------
            // 9️⃣ Return Wrapper Response
            // ------------------------------------------------------
            Map<String,Object> wrapper = new Map<String,Object>();
            wrapper.put('uid', uid);
            wrapper.put('customer', customerResponse);
            wrapper.put('refresh_token', newRefreshToken);
            wrapper.put('access_token', newAccessToken);

            System.debug('📦 WRAPPER RETURNING = ' + JSON.serializePretty(wrapper));

            return JSON.serialize(wrapper);
        }
        catch (Exception e) {
            System.debug('❌ ERROR in createEntityInMYOB: ' + e.getMessage());
            throw new AuraHandledException(e.getMessage());
        }
    }

    // ------------------------------------------------------
    //  ABN Validator (ATO official)
    // ------------------------------------------------------
    public static Boolean isValidABNForMyob(String abn) {
        try {
            if (String.isBlank(abn) || abn.length() != 11) return false;

            Integer[] weights = new Integer[]{10,1,3,5,7,9,11,13,15,17,19};
            Integer sum = 0;

            for (Integer i = 0; i < 11; i++) {
                Integer digit = Integer.valueOf(abn.substring(i, i+1));
                if (i == 0) digit = digit - 1;
                sum += digit * weights[i];
            }

            return Math.mod(sum, 89) == 0;}catch (Exception e) {return false;
        }
    }
    
    public static String formatABN(String digits) {
        if (String.isBlank(digits) || digits.length() != 11) return digits;

        return digits.substring(0, 2) + ' ' +
            digits.substring(2, 5) + ' ' +
            digits.substring(5, 8) + ' ' +
            digits.substring(8, 11);
    }

    @AuraEnabled
    public static String createMyobInvoice(Id invoiceId, String accessToken, String refreshToken, String companyFileUri) {
        try {

            System.debug('🚀 ===== createMyobInvoice START =====');
            System.debug('📌 Input → invoiceId: ' + invoiceId);
            System.debug('📌 Input → companyFileUri: ' + companyFileUri);
            System.debug('📌 Input → accessToken: ' + accessToken);
            System.debug('📌 Input → refreshToken: ' + refreshToken);


            /* ------------------------------------------------------
            1️⃣ Fetch Organisation API Key
            ------------------------------------------------------ */
            System.debug('🔹 STEP 1 — Fetch Organisation API Key');

            User currentUser = [
                SELECT Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            System.debug('👤 Current User Id → ' + UserInfo.getUserId());
            System.debug('👤 User Org Name → ' + currentUser.Organization_Name__c);

            Organisation__c orgRec = [
                SELECT Client_Id__c
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];

            String apiKey = orgRec.Client_Id__c;
            System.debug('🔑 MYOB API Key → ' + apiKey);


            /* ------------------------------------------------------
            2️⃣ Refresh Token
            ------------------------------------------------------ */
            System.debug('🔹 STEP 2 — Refresh MYOB Token');

            System.debug('➡️ Calling refreshMyobToken() with refreshToken');
            String refreshResponse = refreshMyobToken(refreshToken);

            System.debug('📩 Refresh Response Raw → ' + refreshResponse);

            if (String.isBlank(refreshResponse)) { throw new AuraHandledException('MYOB Token refresh failed.');
            }

            Map<String,Object> refreshed =
                (Map<String,Object>) JSON.deserializeUntyped(refreshResponse);

            System.debug('📦 Parsed Refresh Response → ' + refreshed);

            String newAccessToken  = (String) refreshed.get('access_token');
            String newRefreshToken = (String) refreshed.get('refresh_token');

            System.debug('🆕 New Access Token → ' + newAccessToken);
            System.debug('🆕 New Refresh Token → ' + newRefreshToken);


            /* ------------------------------------------------------
            3️⃣ Make CF Token
            ------------------------------------------------------ */
            System.debug('🔹 STEP 3 — Generate cftoken');

            String cfUsername = 'Administrator';
            String cfPassword = '';

            System.debug('👤 CF Username → ' + cfUsername);

            String cftoken = EncodingUtil.base64Encode(
                Blob.valueOf(cfUsername + ':' + cfPassword)
            );

            System.debug('🔐 CF Token → ' + cftoken);

            Http http = new Http();
            System.debug('🌐 HTTP instance created');


            /* ------------------------------------------------------
            4️⃣ Fetch TAX CODES
            ------------------------------------------------------ */
            System.debug('🔹 STEP 4 — Fetch TAX Codes');

            HttpRequest taxReq = new HttpRequest();
            taxReq.setEndpoint(companyFileUri + '/GeneralLedger/TaxCode');
            taxReq.setMethod('GET');
            taxReq.setHeader('Authorization', 'Bearer ' + newAccessToken);
            taxReq.setHeader('x-myobapi-key', apiKey);
            taxReq.setHeader('x-myobapi-version', 'v2');
            taxReq.setHeader('x-myobapi-cftoken', cftoken);
            taxReq.setHeader('Accept', 'application/json');

            System.debug('➡️ Tax Request Endpoint → ' + taxReq.getEndpoint());
            System.debug('➡️ Tax Request Headers Prepared');

            HttpResponse taxRes = http.send(taxReq);

            System.debug('📩 Tax Response Status → ' + taxRes.getStatus());
            System.debug('📩 Tax Response Body → ' + taxRes.getBody());

            Map<String,Object> taxMap =
                (Map<String,Object>) JSON.deserializeUntyped(taxRes.getBody());

            List<Object> taxItems = (List<Object>) taxMap.get('Items');

            System.debug('📦 Tax Items Count → ' + (taxItems == null ? 0 : taxItems.size()));

            String taxCodeUid = null;

            for (Object o : taxItems) {
                Map<String,Object> t = (Map<String,Object>) o;
                System.debug('🔍 Checking Tax Code → ' + t.get('Code'));

                if ((String)t.get('Code') == 'FRE') { taxCodeUid = (String)t.get('UID'); break;
                }
            }

            if (taxCodeUid == null) {
                for (Object o : taxItems) {
                    Map<String,Object> t = (Map<String,Object>) o;
                    System.debug('🔍 Checking GST Tax Code → ' + t.get('Code'));

                    if ((String)t.get('Code') == 'GST') {
                        taxCodeUid = (String)t.get('UID');
                        System.debug('✅ Selected GST Tax UID → ' + taxCodeUid);
                        break;
                    }
                }
            }

            System.debug('🏷️ Final Tax UID → ' + taxCodeUid);


            /* ------------------------------------------------------
            5️⃣ Fetch INCOME ACCOUNT
            ------------------------------------------------------ */
            System.debug('🔹 STEP 5 — Fetch Income Account');

            HttpRequest accReq = new HttpRequest();
            accReq.setEndpoint(companyFileUri + '/GeneralLedger/Account');
            accReq.setMethod('GET');
            accReq.setHeader('Authorization', 'Bearer ' + newAccessToken);
            accReq.setHeader('x-myobapi-key', apiKey);
            accReq.setHeader('x-myobapi-version', 'v2');
            accReq.setHeader('x-myobapi-cftoken', cftoken);
            accReq.setHeader('Accept', 'application/json');

            System.debug('➡️ Account Request Endpoint → ' + accReq.getEndpoint());

            HttpResponse accRes = http.send(accReq);

            System.debug('📩 Account Response Status → ' + accRes.getStatus());
            System.debug('📩 Account Response Body → ' + accRes.getBody());

            Map<String,Object> accMap =
                (Map<String,Object>) JSON.deserializeUntyped(accRes.getBody());

            List<Object> accItems = (List<Object>) accMap.get('Items');

            System.debug('📦 Account Items Count → ' + (accItems == null ? 0 : accItems.size()));

            String accountUid = null;

            for (Object o : accItems) {
                Map<String,Object> a = (Map<String,Object>) o;
                System.debug('🔍 Checking Account → ' + a.get('Name'));

                if (((String)a.get('Name')).contains('Service')) {
                    accountUid = (String)a.get('UID');
                    System.debug('✅ Selected Service Account UID → ' + accountUid);
                    break;
                }
            }

            System.debug('🏦 Final Account UID → ' + accountUid);


            /* ------------------------------------------------------
            6️⃣ Fetch Salesforce Invoice
            ------------------------------------------------------ */
            System.debug('🔹 STEP 6 — Fetch Salesforce Invoice');

            Xero_or_Myob_Invoice__c inv = [
                SELECT Id, Name, Invoice_Date__c, Total_Amount__c,
                    Xero_Entity__r.Xero_Contact_Id__c,
                    (SELECT Description__c, Quantity__c, Unit_Price__c, Total_Amount__c
                    FROM Xero_Invoice_Entries__r)
                FROM Xero_or_Myob_Invoice__c
                WHERE Id = :invoiceId
                LIMIT 1
            ];

            System.debug('📄 Invoice Name → ' + inv.Name);
            System.debug('📅 Invoice Date → ' + inv.Invoice_Date__c);
            System.debug('💰 Invoice Total → ' + inv.Total_Amount__c);
            System.debug('👤 MYOB Contact UID → ' + inv.Xero_Entity__r.Xero_Contact_Id__c);

            List<Object> lineItems = new List<Object>();

            String matchDescription = inv.Xero_Invoice_Entries__r[0].Description__c;
            System.debug('🎯 Match Description → ' + matchDescription);

            for (Xero_Invoice_Entries__c e : inv.Xero_Invoice_Entries__r) {

                System.debug('➕ Line Item');
                System.debug('   Description → ' + e.Description__c);
                System.debug('   Qty → ' + e.Quantity__c);
                System.debug('   Unit Price → ' + e.Unit_Price__c);
                System.debug('   Total → ' + e.Total_Amount__c);

                lineItems.add(new Map<String,Object>{
                    'Description' => e.Description__c,
                    'Total'       => e.Total_Amount__c,
                    'UnitPrice'   => e.Unit_Price__c,
                    'Quantity'    => e.Quantity__c,
                    'Account'     => new Map<String,Object>{'UID' => accountUid},
                    'TaxCode'     => new Map<String,Object>{'UID' => taxCodeUid}
                });
            }


            Map<String,Object> invoiceBody = new Map<String,Object>{
                'Customer'      => new Map<String,Object>{ 'UID' => inv.Xero_Entity__r.Xero_Contact_Id__c },
                'Date'          => String.valueOf(inv.Invoice_Date__c),
                'TotalAmount'   => inv.Total_Amount__c,
                'InvoiceNumber' => inv.Name,
                'Lines'         => lineItems
            };

            System.debug('📤 Invoice Payload → ' + JSON.serializePretty(invoiceBody));


            HttpRequest req = new HttpRequest();
            req.setEndpoint(companyFileUri + '/Sale/Invoice/Service/?$top=1000');
            req.setMethod('POST');
            req.setHeader('Authorization', 'Bearer ' + newAccessToken);
            req.setHeader('x-myobapi-key', apiKey);
            req.setHeader('x-myobapi-version', 'v2');
            req.setHeader('x-myobapi-cftoken', cftoken);
            req.setHeader('Content-Type', 'application/json');
            req.setBody(JSON.serialize(invoiceBody));

            System.debug('➡️ Sending Create Invoice Request');

            HttpResponse res = http.send(req);

            System.debug('📩 Create Invoice Status → ' + res.getStatus());
            System.debug('📩 Create Invoice Response → ' + res.getBody());


            /* ------------------------------------------------------
            8️⃣ FIND INVOICE IN MYOB (WITH PAGINATION)
            ------------------------------------------------------ */
            System.debug('🔹 STEP 8 — Find Invoice in MYOB with Pagination');

            String matchedUid = null;
            Integer pageSize = 400;      // Maximum records per request
            Integer currentPage = 0;     // Start from first page
            Integer maxPages = 50;       // Safety limit (50 pages * 400 = 20,000 records)
            Integer totalRecordsChecked = 0;
            
            System.debug('🎯 Looking for invoice with description containing: ' + matchDescription);

            while (matchedUid == null && currentPage < maxPages) {
                
                Integer skip = currentPage * pageSize;
                System.debug('📄 Fetching page ' + (currentPage + 1) + ' - skipping ' + skip + ' records');
                
                HttpRequest getReq = new HttpRequest();
                getReq.setEndpoint(companyFileUri + '/Sale/Invoice/Service?$top=' + pageSize + '&$skip=' + skip);
                getReq.setMethod('GET');
                getReq.setHeader('Authorization', 'Bearer ' + newAccessToken);
                getReq.setHeader('x-myobapi-key', apiKey);
                getReq.setHeader('x-myobapi-version', 'v2');
                getReq.setHeader('x-myobapi-cftoken', cftoken);
                getReq.setHeader('Accept', 'application/json');
                
                HttpResponse getRes = http.send(getReq);
                
                System.debug('📩 Fetch Invoice List Status → ' + getRes.getStatus() + ' (Page ' + (currentPage + 1) + ')');
                
                // Check if request was successful
                if (getRes.getStatusCode() != 200) { break;
                }
                
                // Parse the response
                Map<String,Object> getMap = (Map<String,Object>) JSON.deserializeUntyped(getRes.getBody());
                List<Object> invoices = (List<Object>) getMap.get('Items');
                
                Integer recordsInPage = (invoices == null ? 0 : invoices.size());
                totalRecordsChecked += recordsInPage;
                
                System.debug('📦 MYOB Invoice Count in this page → ' + recordsInPage);
                System.debug('📊 Total records checked so far → ' + totalRecordsChecked);
                
                // If no invoices returned, we've reached the end
                if (invoices == null || invoices.isEmpty()) { break;
                }
                
                // Search through current page for matching invoice
                Boolean foundInThisPage = false;
                
                for (Object o : invoices) {
                    
                    Map<String,Object> m = (Map<String,Object>) o;
                    
                    // Get the invoice number for debugging
                    String invoiceNumber = (String) m.get('InvoiceNumber');
                    System.debug('🔍 Checking Invoice: ' + invoiceNumber);
                    
                    List<Object> lines = (List<Object>) m.get('Lines');
                    
                    if (lines != null && !lines.isEmpty()) { for (Object lineObj : lines) { Map<String,Object> line = (Map<String,Object>) lineObj;                           String lineDescription = (String) line.get('Description');
                            
                            // Debug first few line descriptions
                            if (lines.indexOf(lineObj) < 3) {
                                System.debug('🔍 Line Description Sample: ' + lineDescription);
                            }
                            
                            // NULL-SAFE MATCH using contains (case-insensitive for safety)
                            if (lineDescription != null && 
                                matchDescription != null && 
                                lineDescription.toLowerCase().contains(matchDescription.toLowerCase())) {
                                
                                matchedUid = (String) m.get('UID');
                                String matchedInvoiceNumber = (String) m.get('InvoiceNumber');
                                
                                System.debug('✅✅✅ MATCH FOUND! ✅✅✅');
                                System.debug('   → Invoice Number: ' + matchedInvoiceNumber);
                                System.debug('   → Invoice UID: ' + matchedUid);
                                System.debug('   → Found on page: ' + (currentPage + 1));
                                System.debug('   → Matching Description: ' + lineDescription);
                                
                                foundInThisPage = true;
                                break;
                            }
                        }
                    } else {
                        System.debug('⚠️ Invoice ' + invoiceNumber + ' has no line items');
                    }
                    
                    if (foundInThisPage) break;
                }
                
                // If no match found in this page, move to next page
                if (matchedUid == null) {
                    currentPage++;
                    if (recordsInPage == pageSize) {
                        System.debug('🔄 No match found on page ' + currentPage + ', moving to next page...');
                    } else {
                        System.debug('🏁 Received fewer than ' + pageSize + ' records, this was the last page');
                        break;
                    }
                }
            }

            // Handle case when no match was found
            if (matchedUid == null) {
                matchedUid = 'NOT-FOUND';
                System.debug('⚠️⚠️⚠️ NO MATCHING INVOICE FOUND ⚠️⚠️⚠️');
                System.debug('   → Searched through: ' + totalRecordsChecked + ' invoices');
                System.debug('   → Total pages checked: ' + (currentPage + 1));
                System.debug('   → Search description: ' + matchDescription);
            } else {
                System.debug('🎉 Successfully matched invoice after checking ' + totalRecordsChecked + ' records');
            }

            // Update Salesforce with the matched UID or NOT-FOUND
            update new Xero_or_Myob_Invoice__c(
                Id = invoiceId,
                Xero_Innvoice_Id__c = matchedUid
            );

            System.debug('💾 Saved MYOB UID to Salesforce → ' + matchedUid);


            /* ------------------------------------------------------
            9️⃣ FINAL RETURN
            ------------------------------------------------------ */
            Map<String,Object> result = new Map<String,Object>();
            result.put('access_token', newAccessToken);
            result.put('refresh_token', newRefreshToken);
            result.put('message', 'Invoice created & matched in MYOB → UID: ' + matchedUid);

            System.debug('✅ ===== createMyobInvoice END =====');

            return JSON.serialize(result);

        } catch (Exception ex) {

            System.debug('💥 ERROR createMyobInvoice');
            System.debug('❌ Message → ' + ex.getMessage());
            System.debug('📍 Stack → ' + ex.getStackTraceString());

            throw new AuraHandledException(ex.getMessage());
        }
    }

    @AuraEnabled
    public static String getMyobInvoices( String accessToken, String refreshToken, String companyFileUri ) {

        System.debug('🚀 ===== getMyobInvoices START =====');
        System.debug('🔑 AccessToken → ' + accessToken);
        System.debug('🔁 RefreshToken → ' + refreshToken);
        System.debug('🏢 CompanyFileUri → ' + companyFileUri);

        /* ------------------------------------------------------
        OPTIONAL — Refresh token first (RECOMMENDED)
        ------------------------------------------------------ */

        String refreshResponse = refreshMyobToken(refreshToken);

        Map<String,Object> refreshed =
            (Map<String,Object>) JSON.deserializeUntyped(refreshResponse);

        String newAccessToken  = (String) refreshed.get('access_token');
        String newRefreshToken = (String) refreshed.get('refresh_token');

        System.debug('🆕 New Access Token → ' + newAccessToken);
        System.debug('🆕 New Refresh Token → ' + newRefreshToken);

        /* ------------------------------------------------------
        MYOB API KEY
        ------------------------------------------------------ */

        Organisation__c orgRec = [
            SELECT Client_Id__c
            FROM Organisation__c
            LIMIT 1
        ];

        String apiKey = orgRec.Client_Id__c;

        String cftoken = EncodingUtil.base64Encode(
            Blob.valueOf('Administrator:')
        );

        Http http = new Http();

        HttpRequest req = new HttpRequest();
        req.setEndpoint(companyFileUri + '/Sale/Invoice/Service');
        req.setMethod('GET');
        req.setHeader('Authorization', 'Bearer ' + newAccessToken);
        req.setHeader('x-myobapi-key', apiKey);
        req.setHeader('x-myobapi-version', 'v2');
        req.setHeader('x-myobapi-cftoken', cftoken);
        req.setHeader('Accept', 'application/json');

        HttpResponse res = http.send(req);

        System.debug('📩 Status → ' + res.getStatus());
        System.debug('📩 Body → ' + res.getBody());

        /* ------------------------------------------------------
        RETURN UPDATED TOKENS + DATA
        ------------------------------------------------------ */

        Map<String,Object> result = new Map<String,Object>();
        result.put('access_token', newAccessToken);
        result.put('refresh_token', newRefreshToken);
        result.put('data', res.getBody());

        System.debug('✅ ===== getMyobInvoices END =====');

        return JSON.serialize(result);
    }

    @AuraEnabled
    public static Map<String, Object> createMyobTimesheet(
        String staffId,
        String startDateStr,
        String endDateStr,
        String accessToken,
        String refreshToken,
        String companyFileUri
    ) {
        try {
            System.debug('================== 🟦 MYOB Timesheet Submit START ==================');
            System.debug('📥 Input Parameters');
            System.debug('➡ staffId: ' + staffId);
            System.debug('➡ startDateStr: ' + startDateStr);
            System.debug('➡ endDateStr: ' + endDateStr);
            System.debug('➡ companyFileUri: ' + companyFileUri);
            System.debug('➡ accessToken Present?: ' + String.isNotBlank(accessToken));
            System.debug('➡ refreshToken Present?: ' + String.isNotBlank(refreshToken));

            // STEP 1 — Convert Dates
            Date startDate = Date.valueOf(startDateStr);
            Date endDate   = Date.valueOf(endDateStr);

            System.debug('================== 📅 STEP 1: DATE CONVERSION ==================');
            System.debug('✅ Converted Start Date: ' + startDate);
            System.debug('✅ Converted End Date: ' + endDate);

            // STEP 2 — Fetch Staff
            System.debug('================== 👤 STEP 2: FETCH STAFF ==================');

            Staff__c staff = [
                SELECT Id, Xero_Employee_ID__c, Name
                FROM Staff__c
                WHERE Id = :staffId
                LIMIT 1
            ];

            System.debug('✅ Staff Found');
            System.debug('➡ Staff Id: ' + staff.Id);
            System.debug('➡ Staff Name: ' + staff.Name);
            System.debug('➡ MYOB Employee UID: ' + staff.Xero_Employee_ID__c);

            if (staff.Xero_Employee_ID__c == null) { return buildResponse( false, 'Staff does not have MYOB Employee UID.', accessToken, refreshToken, null, 0, 0
                );
            }

            String employeeUid = staff.Xero_Employee_ID__c;

            // STEP 3 — Refresh Token
            System.debug('================== 🔄 STEP 3: REFRESH TOKEN ==================');

            String refreshResponse = refreshMyobToken(refreshToken);

            System.debug('📥 Refresh Token Raw Response: ' + refreshResponse);

            if (String.isBlank(refreshResponse)) { return buildResponse( false, 'MYOB token refresh failed.', accessToken, refreshToken, null, 0, 0
                );
            }

            Map<String, Object> refreshed =
                (Map<String, Object>) JSON.deserializeUntyped(refreshResponse);

            System.debug('✅ Token Refresh Success');
            System.debug('➡ Refreshed Map: ' + refreshed);

            String newAccessToken  = (String) refreshed.get('access_token');
            String newRefreshToken = (String) refreshed.get('refresh_token');

            System.debug('➡ New Access Token Present?: ' + String.isNotBlank(newAccessToken));
            System.debug('➡ New Refresh Token Present?: ' + String.isNotBlank(newRefreshToken));

            // STEP 4 — Payroll Categories
            System.debug('================== 💰 STEP 4: PAYROLL CATEGORIES ==================');

            String payrollCategoryResponse =
                getPayrollCategories(companyFileUri, newAccessToken);

            System.debug('📥 Payroll Category Response: ' + payrollCategoryResponse);

            if (String.isBlank(payrollCategoryResponse)) { return buildResponse( false, 'Unable to fetch MYOB Payroll Categories.', newAccessToken, newRefreshToken, null, 0, 0
                );
            }

            Map<String, Object> payrollJson =
                (Map<String, Object>) JSON.deserializeUntyped(payrollCategoryResponse);

            List<Object> payrollItems =
                (List<Object>) payrollJson.get('Items');

            System.debug('✅ Payroll Categories Loaded');
            System.debug('➡ Total Payroll Categories: ' + payrollItems.size());

            // STEP 5 — Fetch Approved Shifts
            System.debug('================== 🕒 STEP 5: FETCH APPROVED SHIFTS ==================');

            List<ShiftwithStaff__c> shifts = [
                SELECT Id,
                    Date__c,
                    Actual_Duration__c,
                    Broken_Extended_Duration__c,
                    Extended_Duration__c,
                    Variance_Rate__c,
                    Over_Time_Tier_One__c,
                    Over_Time_Tier_One_Rate__c,
                    Over_Time_Tier_Two__c,
                    Over_Time_Tier_Two_Rate__c,
                    Broken_Extended_Rate__c,
                    Broken_Shift_Allowance__c,
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
                ORDER BY Date__c
            ];

            System.debug('✅ Approved Shifts Count: ' + shifts);
            System.debug('✅ Approved Shifts Count: ' + shifts.size());

            if (shifts.isEmpty()) { return buildResponse( false, 'No approved shifts found for selected period.', newAccessToken, newRefreshToken, null, 0, 0
                );
            }

            for (ShiftwithStaff__c s : shifts) {
                System.debug('---------------- SHIFT ----------------');
                System.debug('➡ Shift Id: ' + s.Id);
                System.debug('➡ Date: ' + s.Date__c);
                System.debug('➡ Shift Category: ' + s.Shift_Category__c);
                System.debug('➡ Shift Type: ' + s.Shift_Type__c);
                System.debug('➡ Actual Duration: ' + s.Actual_Duration__c);
                System.debug('➡ Staff Hourly Rate: ' + s.Staff_Hourly_Rate__c);
                System.debug('➡ Custom Rate: ' + s.Custom_Rate_Per_Hrs__c);
                System.debug('➡ Broken Shift?: ' + s.Broken_Shift__c);
                System.debug('➡ Broken Duration: ' + s.Actual_Duration__c);
                System.debug('➡ Broken Over Time Duration: ' + s.Broken_Extended_Duration__c);
                System.debug('➡ Broken Over Time Rate: ' + s.Broken_Extended_Rate__c);
            }

            // STEP 6 — Wage Category Mapping
            System.debug('================== 🧾 STEP 6: WAGE CATEGORY MAPPING ==================');

            Set<String> requiredWageUids = new Set<String>();
            Map<String, Decimal> wageCategoryRates = new Map<String, Decimal>();
            Map<String, String> wageCategoryNames = new Map<String, String>();

            for (ShiftwithStaff__c s : shifts) {

                String categoryToMatch;
                String matchedUid;
                String matchedName;

                /* ==========================================
                BROKEN SHIFT
                ========================================== */

                if (s.Broken_Shift__c == true) {

                    String brokenShiftUid =
                        findWageCategoryUid(
                            'broken shift',
                            payrollItems
                        );

                    String brokenShiftName =
                        getWageCategoryName(
                            'broken shift',
                            payrollItems
                        );

                    if (brokenShiftUid != null) { requiredWageUids.add(brokenShiftUid); if (brokenShiftName != null) { wageCategoryNames.put( brokenShiftUid, brokenShiftName ); } wageCategoryRates.put( brokenShiftUid, s.Broken_Rate_Per_Hrs__c
                        );

                        System.debug(
                            '✅ Added Broken Shift Payroll Category'
                        );
                    }
                }

                /* ==========================================
                BROKEN OVER TIME SHIFT
                ========================================== */

                if (
                    s.Broken_Extended_Duration__c != null && s.Broken_Extended_Duration__c > 0 && s.Broken_Extended_Rate__c != null && s.Broken_Extended_Rate__c > 0 ) { String brokenOtUid = findWageCategoryUid( 'broken over time shift', payrollItems );                  String brokenOtName = getWageCategoryName('broken over time shift',payrollItems );      if (brokenOtUid != null) {            requiredWageUids.add(brokenOtUid);     if (brokenOtName != null) {         wageCategoryNames.put(brokenOtUid,brokenOtName);     }       wageCategoryRates.put(brokenOtUid, s.Broken_Extended_Rate__c);        System.debug('✅ Added Broken Over Time Shift Payroll Category' );
                    }
                }

                categoryToMatch = s.Shift_Category__c != null
                    ? s.Shift_Category__c.trim().toLowerCase()  : '';

                System.debug('➡ Category To Match: ' + categoryToMatch);

                matchedUid = findWageCategoryUid(categoryToMatch, payrollItems);
                matchedName = getWageCategoryName(categoryToMatch, payrollItems);

                System.debug('➡ Matched UID: ' + matchedUid);
                System.debug('➡ Matched Name: ' + matchedName);

                if (matchedUid != null) {

                requiredWageUids.add(matchedUid);

                if (matchedName != null) {
                    wageCategoryNames.put(matchedUid, matchedName);
                }

                Decimal rateToUse =
                    (s.Custom_Rate_Per_Hrs__c != null && s.Custom_Rate_Per_Hrs__c > 0) ? s.Custom_Rate_Per_Hrs__c
                    : s.Staff_Hourly_Rate__c;

                System.debug('➡ Final Rate Used: ' + rateToUse);

                if (rateToUse != null && rateToUse > 0) {
                    wageCategoryRates.put(matchedUid, rateToUse);
                }

                /* ==========================================
                OVERTIME TIER 1 (1.5x)
                ========================================== */

                if (
                    s.Over_Time_Tier_One__c != null &&
                    s.Over_Time_Tier_One__c > 0 && s.Over_Time_Tier_One_Rate__c != null && s.Over_Time_Tier_One_Rate__c > 0 ) { String ot15Uid = findWageCategoryUid( 'overtime (1.5x)', payrollItems );

                    String ot15Name =
                        getWageCategoryName(
                            'overtime (1.5x)',
                            payrollItems
                        );

                    System.debug('➡ OT 1.5 UID: ' + ot15Uid);
                    System.debug('➡ OT 1.5 Name: ' + ot15Name);

                    if (ot15Uid != null) {

                        requiredWageUids.add(ot15Uid);

                        wageCategoryRates.put(
                            ot15Uid,
                            s.Over_Time_Tier_One_Rate__c
                        );

                        if (ot15Name != null) {
                            wageCategoryNames.put(
                                ot15Uid,
                                ot15Name
                            );
                        }

                        System.debug('✅ Added Overtime (1.5x) Payroll Category');
                    }
                }

                /* ==========================================
                OVERTIME TIER 2 (2x)
                ========================================== */

                if (
                    s.Over_Time_Tier_Two__c != null && s.Over_Time_Tier_Two__c > 0 && s.Over_Time_Tier_Two_Rate__c != null && s.Over_Time_Tier_Two_Rate__c > 0
                ) {

                    System.debug('🔴 Overtime Tier 2 Found');
                    System.debug('➡ OT 2 Hours: ' + s.Over_Time_Tier_Two__c);
                    System.debug('➡ OT 2 Rate: ' + s.Over_Time_Tier_Two_Rate__c);

                    String ot2Uid =
                        findWageCategoryUid(
                            'overtime (2x)',
                            payrollItems
                        );

                    String ot2Name =
                        getWageCategoryName(
                            'overtime (2x)',
                            payrollItems
                        );

                    System.debug('➡ OT 2 UID: ' + ot2Uid);
                    System.debug('➡ OT 2 Name: ' + ot2Name);

                    if (ot2Uid != null) {

                        requiredWageUids.add(ot2Uid);

                        wageCategoryRates.put(
                            ot2Uid,
                            s.Over_Time_Tier_Two_Rate__c
                        );

                        if (ot2Name != null) {

                            wageCategoryNames.put(
                                ot2Uid,
                                ot2Name
                            );
                        }

                        System.debug(
                            '✅ Added Overtime (2x) Payroll Category'
                        );
                    }
                }

                /* ==========================================
                BROKEN OVERTIME SHIFT
                ========================================== */

                if (
                    s.Broken_Extended_Duration__c != null && s.Broken_Extended_Duration__c > 0 && s.Broken_Extended_Rate__c != null && s.Broken_Extended_Rate__c > 0
                ) {

                    System.debug('🟣 Broken Overtime Shift Found');
                    System.debug('➡ Broken OT Hours: ' + s.Broken_Extended_Duration__c);
                    System.debug('➡ Broken OT Rate: ' + s.Broken_Extended_Rate__c);

                    String brokenOtUid =
                        findWageCategoryUid(
                            'broken over time shift',
                            payrollItems
                        );

                    String brokenOtName =
                        getWageCategoryName(
                            'broken over time shift',
                            payrollItems
                        );

                    System.debug('➡ Broken OT UID: ' + brokenOtUid);
                    System.debug('➡ Broken OT Name: ' + brokenOtName);

                    if (brokenOtUid != null) {

                        requiredWageUids.add(brokenOtUid);

                        wageCategoryRates.put(
                            brokenOtUid,
                            s.Broken_Extended_Rate__c
                        );

                        if (brokenOtName != null) {

                            wageCategoryNames.put(
                                brokenOtUid,
                                brokenOtName
                            );
                        }

                        System.debug(
                            '✅ Added Broken Over Time Shift Payroll Category'
                        );
                    }
                }

                /* ==========================================
                EXTENDED SHIFT
                ========================================== */

                if (
                    s.Extended_Duration__c != null &&
                    s.Extended_Duration__c > 0 && s.Variance_Rate__c != null && s.Variance_Rate__c > 0
                ) {

                    System.debug('🟢 Extended Shift Found');
                    System.debug('➡ Extended Hours: ' + s.Extended_Duration__c);
                    System.debug('➡ Extended Rate: ' + s.Variance_Rate__c);

                    String extendedUid =
                        findWageCategoryUid(
                            'extended shift',
                            payrollItems
                        );

                    String extendedName =
                        getWageCategoryName(
                            'extended shift',
                            payrollItems
                        );

                    System.debug('➡ Extended UID: ' + extendedUid);
                    System.debug('➡ Extended Name: ' + extendedName);

                    if (extendedUid != null) {

                        requiredWageUids.add(extendedUid);

                        wageCategoryRates.put(
                            extendedUid,
                            s.Variance_Rate__c
                        );

                        if (extendedName != null) {

                            wageCategoryNames.put(
                                extendedUid,
                                extendedName
                            );
                        }

                        System.debug(
                            '✅ Added Extended Shift Payroll Category'
                        );
                    }
                }

            } else {

                System.debug('❌ No Wage Category Match Found For: ' + categoryToMatch);
            }
            }

            System.debug('✅ Required Wage UIDs: ' + requiredWageUids);
            System.debug('✅ Wage Category Rates: ' + wageCategoryRates);
            System.debug('✅ Wage Category Names: ' + wageCategoryNames);

            

            // STEP 7 — Employee Payroll Details
            System.debug('================== 👨‍💼 STEP 7: EMPLOYEE PAYROLL DETAILS ==================');

            Map<String, Object> epd =
                getEmployeePayrollDetails(
                    companyFileUri,
                    newAccessToken,
                    employeeUid
                );

            System.debug('📥 Employee Payroll Details: ' + epd);

            if (epd == null || epd.isEmpty()) {

                System.debug('❌ Employee Payroll Details Empty');

                return buildResponse(
                    false,
                    'Could not fetch Employee Payroll Details.',
                    newAccessToken,
                    newRefreshToken,
                    null,
                    0,
                    0
                );
            }

            /* =========================================================
            STEP 7A — ASSIGN ALL REQUIRED PAYROLL CATEGORIES
            ========================================================= */

            System.debug('================== 🟧 STEP 7A: UPDATE WAGE CATEGORIES ==================');
            System.debug('➡ Required Wage UIDs: ' + requiredWageUids);

            Boolean wageCategoriesUpdated =
                updateEmployeePayrollDetailsWithAllMissing(
                    companyFileUri,
                    newAccessToken,
                    employeeUid,
                    requiredWageUids
                );

            System.debug('➡ Wage Categories Updated: ' + wageCategoriesUpdated);

            if (!wageCategoriesUpdated) {

                System.debug('❌ Failed to assign payroll categories to employee');

                return buildResponse(
                    false,
                    'Failed to assign required payroll categories to employee.',
                    newAccessToken,
                    newRefreshToken,
                    null,
                    0,
                    0
                );
            }

            System.debug('✅ Payroll categories assigned successfully');
            System.debug('================ VERIFY EMPLOYEE AFTER UPDATE =================');

            Map<String, Object> verifyEmployee =
                getEmployeePayrollDetails(
                    companyFileUri,
                    newAccessToken,
                    employeeUid
                );

            System.debug(
                'VERIFY EMPLOYEE JSON: ' +
                JSON.serializePretty(verifyEmployee)
            );

            System.debug('================ END VERIFY =================');

            /* =========================================================
            STEP 8 — INSERT TIMESHEET
            ========================================================= */

            System.debug('================== 📤 STEP 8: INSERT TIMESHEET ==================');

            Map<String, Object> timesheetResponse =
                insertMyobTimesheet(
                    companyFileUri,
                    newAccessToken,
                    employeeUid,
                    startDate,
                    endDate,
                    shifts,
                    payrollItems
                );

            System.debug('📥 Timesheet Response: ' + timesheetResponse);

            // FIXED ERROR HANDLING
            if (
                timesheetResponse == null ||
                (timesheetResponse.containsKey('success') &&
                timesheetResponse.get('success') == false)
            ) {

                String errorMsg = 'Failed to send timesheet to MYOB.';

                if (
                    timesheetResponse != null &&
                    timesheetResponse.containsKey('message')
                ) {
                    errorMsg = String.valueOf(timesheetResponse.get('message'));
                }

                System.debug('❌ Timesheet Insert Failed');
                System.debug('➡ Error Message: ' + errorMsg);

                return buildResponse(
                    false,
                    errorMsg,
                    newAccessToken,
                    newRefreshToken,
                    timesheetResponse,
                    0,
                    0
                );
            }

            System.debug('================== ✅ MYOB TIMESHEET SUCCESS ==================');
            System.debug('✅ Timesheet sent successfully to MYOB');
            System.debug('📤 Final Response: ' + timesheetResponse);

            // SUCCESS
            return buildResponse(
                true,
                'Timesheet sent successfully to MYOB.',
                newAccessToken,
                newRefreshToken,
                timesheetResponse,
                0,
                0
            );

        } catch (Exception e) {

            System.debug('================== ❌ EXCEPTION OCCURRED ==================');
            System.debug('❌ Exception Message: ' + e.getMessage());
            System.debug('❌ Stack Trace: ' + e.getStackTraceString());
            System.debug('❌ Line Number: ' + e.getLineNumber());
            System.debug('❌ Cause: ' + e.getCause());

            return buildResponse(
                false,
                e.getMessage(),
                accessToken,
                refreshToken,
                null,
                0,
                0
            );
        }
    }

    // Add this helper method to get category names for better debugging
    public static String getWageCategoryName(String shiftCategory, List<Object> items) {

        System.debug('================== 🔍 getWageCategoryName START ==================');
        System.debug('➡ Input Shift Category: ' + shiftCategory);
        System.debug('➡ Total Items Received: ' + (items != null ? items.size() : 0));

        if (items == null || String.isBlank(shiftCategory)) { return null;
        }

        String normalizedShiftCategory = shiftCategory.toLowerCase().trim();

        System.debug('➡ Normalized Shift Category: ' + normalizedShiftCategory);

        Integer index = 0;

        for (Object obj : items) {

            index++;

            System.debug('---------------- CATEGORY ITEM #' + index + ' ----------------');

            Map<String, Object> cat = (Map<String, Object>) obj;

            System.debug('➡ Raw Category Object: ' + cat);

            String name = (String) cat.get('Name');
            String uid  = (String) cat.get('UID');

            System.debug('➡ Category Name: ' + name);
            System.debug('➡ Category UID: ' + uid);

            if (name != null) {

                String normalizedName = name.toLowerCase().trim();

                System.debug('➡ Normalized Name: ' + normalizedName);

                Boolean matched =
                    normalizedName.contains(normalizedShiftCategory);

                System.debug('➡ Match Found?: ' + matched);

                if (matched) {

                    System.debug('✅ Matching Wage Category Found');
                    System.debug('➡ Returning Name: ' + name);
                    System.debug('➡ Matching UID: ' + uid);

                    return name;
                }

            } else {

                System.debug('⚠ Category Name is NULL for UID: ' + uid);
            }
        }

        System.debug('❌ No Matching Wage Category Found');
        System.debug('➡ Shift Category Searched: ' + shiftCategory);

        return null;
    }

    public static String getPayrollCategories(String companyFileUri, String newAccessToken) {

        System.debug('================ 🟦 GET PAYROLL CATEGORIES START ================');

        try {

            // ---------------------------------------------------------
            // STEP 1 — Validate Inputs
            // ---------------------------------------------------------
            System.debug('📥 STEP 1: VALIDATE INPUTS');

            System.debug('➡ companyFileUri: ' + companyFileUri);
            System.debug('➡ accessToken Present?: ' + String.isNotBlank(newAccessToken));

            if (String.isBlank(companyFileUri)) { return null;
            }

            if (String.isBlank(newAccessToken)) { return null;
            }

            // ---------------------------------------------------------
            // STEP 2 — Generate Company File Token (CF Token)
            // ---------------------------------------------------------
            System.debug('🔐 STEP 2: Generating Company File Token (CF Token)...');

            String cftoken = EncodingUtil.base64Encode(
                Blob.valueOf('Administrator:')
            );

            Integer len = Math.min(25, cftoken.length());

            System.debug('✅ CF Token Generated');
            System.debug('🔐 CF Token Length: ' + cftoken.length());
            System.debug('🔐 CF Token (partial): ' +
                cftoken.substring(0, len) + '...'
            );

            // ---------------------------------------------------------
            // STEP 3 — Get Current User Organisation
            // ---------------------------------------------------------
            System.debug('👤 STEP 3: Fetching Logged-in User Organisation...');

            Id currentUserId = UserInfo.getUserId();

            System.debug('➡ Current User Id: ' + currentUserId);

            User u = [
                SELECT Organization_Name__c
                FROM User
                WHERE Id = :currentUserId
                LIMIT 1
            ];

            System.debug('✅ User Record Retrieved');
            System.debug('➡ User Organisation Name: ' + u.Organization_Name__c);

            if (String.isBlank(u.Organization_Name__c)) { return null;
            }

            // ---------------------------------------------------------
            // STEP 4 — Fetch Organisation Record
            // ---------------------------------------------------------
            System.debug('🏢 STEP 4: Fetching Organisation Record...');

            Organisation__c org = [
                SELECT Id,
                    Name,
                    Client_Id__c
                FROM Organisation__c
                WHERE Name = :u.Organization_Name__c
                LIMIT 1
            ];

            System.debug('✅ Organisation Record Found');
            System.debug('➡ Organisation Id: ' + org.Id);
            System.debug('➡ Organisation Name: ' + org.Name);
            System.debug('➡ Client ID Present?: ' +
                String.isNotBlank(org.Client_Id__c)
            );

            if (org == null) { return null;
            }

            if (String.isBlank(org.Client_Id__c)) { return null;
            }

            String clientId = org.Client_Id__c;

            System.debug('✅ Client ID Loaded Successfully');

            // ---------------------------------------------------------
            // STEP 5 — Build Endpoint
            // ---------------------------------------------------------
            System.debug('🌐 STEP 5: Building Endpoint');

            String endpoint =
                companyFileUri + '/Payroll/PayrollCategory/Wage';

            System.debug('➡ Endpoint: ' + endpoint);

            // ---------------------------------------------------------
            // STEP 6 — Prepare HTTP Request
            // ---------------------------------------------------------
            System.debug('📦 STEP 6: Preparing HTTP Request');

            HttpRequest req = new HttpRequest();

            req.setEndpoint(endpoint);
            req.setMethod('GET');

            req.setHeader('Authorization', 'Bearer ' + newAccessToken);
            req.setHeader('x-myobapi-key', clientId);
            req.setHeader('x-myobapi-version', 'v2');
            req.setHeader('x-myobapi-cftoken', cftoken);
            req.setHeader('Accept', 'application/json');

            System.debug('✅ HTTP Request Prepared');

            System.debug('➡ HTTP Method: GET');
            System.debug('➡ Authorization Header Present?: ' +
                String.isNotBlank(newAccessToken)
            );
            System.debug('➡ MYOB API Key Present?: ' +
                String.isNotBlank(clientId)
            );
            System.debug('➡ MYOB API Version: v2');
            System.debug('➡ Accept Header: application/json');

            // ---------------------------------------------------------
            // STEP 7 — Send Request
            // ---------------------------------------------------------
            System.debug('🚀 STEP 7: Sending Request to MYOB');

            Http http = new Http();

            Long startTime = DateTime.now().getTime();

            HttpResponse res = http.send(req);

            Long endTime = DateTime.now().getTime();

            System.debug('⏱ API Response Time(ms): ' +
                (endTime - startTime)
            );

            // ---------------------------------------------------------
            // STEP 8 — Handle Response
            // ---------------------------------------------------------
            System.debug('📥 STEP 8: Processing Response');

            Integer statusCode = res.getStatusCode();
            String status = res.getStatus();
            String responseBody = res.getBody();

            System.debug('🔵 Response Status Code: ' + statusCode);
            System.debug('🔵 Response Status: ' + status);

            if (responseBody != null) {

                System.debug('🔵 Response Length: ' +
                    responseBody.length()
                );

                System.debug('🔵 Response Body (partial): ' +
                    responseBody.substring(
                        0,
                        Math.min(2000, responseBody.length())
                    )
                );
            } else {

                System.debug('⚠ Response Body is NULL');
            }

            // ---------------------------------------------------------
            // STEP 9 — Success / Failure Handling
            // ---------------------------------------------------------
            if (statusCode == 200) {

                System.debug('================ 🟢 API SUCCESS ================');
                System.debug('✅ Payroll Categories Retrieved Successfully');

                try {

                    Map<String, Object> responseMap =
                        (Map<String, Object>) JSON.deserializeUntyped(responseBody);

                    List<Object> items =
                        (List<Object>) responseMap.get('Items');

                    System.debug('✅ Total Payroll Categories Received: ' +
                        (items != null ? items.size() : 0)
                    );

                    if (items != null) {

                        Integer count = 0;

                        for (Object item : items) {

                            count++;

                            Map<String, Object> category =
                                (Map<String, Object>) item;

                            System.debug(
                                '➡ Category #' + count +
                                ' | Name: ' + category.get('Name') +
                                ' | UID: ' + category.get('UID')
                            );

                            if (count >= 10) { break;
                            }
                        }
                    }

                } catch (Exception parseEx) {

                    System.debug('⚠ Unable to Parse Payroll Categories');
                    System.debug('⚠ Parse Error: ' + parseEx.getMessage());
                }

                System.debug('================ 🟢 GET PAYROLL CATEGORIES END ================');

                return responseBody;
            }

            // ---------------------------------------------------------
            // API FAILURE
            // ---------------------------------------------------------
            System.debug('================ 🔴 API FAILURE ================');

            System.debug('❌ MYOB API Error');
            System.debug('➡ Status Code: ' + statusCode);
            System.debug('➡ Status: ' + status);

            if (responseBody != null) {

                System.debug('➡ Error Response Body: ' + responseBody);
            }

            System.debug('================ 🔴 GET PAYROLL CATEGORIES FAILED ================');

            return null;

        } catch (Exception e) {

            // ---------------------------------------------------------
            // EXCEPTION HANDLING
            // ---------------------------------------------------------
            System.debug('================ 💥 EXCEPTION OCCURRED ================');

            System.debug('❌ Exception Message: ' + e.getMessage());
            System.debug('❌ Exception Type: ' + e.getTypeName());
            System.debug('❌ Line Number: ' + e.getLineNumber());
            System.debug('❌ Stack Trace: ' + e.getStackTraceString());
            System.debug('❌ Cause: ' + e.getCause());

            System.debug('================ 🔴 GET PAYROLL CATEGORIES EXCEPTION ================');

            return null;
        }
    }

    public static String findWageCategoryUid(String shiftCategory, List<Object> items) {

        System.debug('=========== 🟦 FIND WAGE CATEGORY UID START ===========');

        try {

            // ---------------------------------------------------------
            // STEP 1 — Input Validation
            // ---------------------------------------------------------
            System.debug('📥 STEP 1: VALIDATE INPUTS');

            System.debug('➡ Input Shift Category: ' + shiftCategory);
            System.debug('➡ Items List Present?: ' + (items != null));
            System.debug('➡ Items Count: ' + (items != null ? items.size() : 0));

            if (items == null || items.isEmpty()) { return null;
            }

            if (String.isBlank(shiftCategory)) { return null;
            }

            String searchCategory = shiftCategory.toLowerCase().trim();

            System.debug('✅ Normalized Search Category: ' + searchCategory);
            System.debug('✅ Total Payroll Categories Available: ' + items.size());

            // ---------------------------------------------------------
            // STEP 2 — Loop Through Payroll Categories
            // ---------------------------------------------------------
            System.debug('🔄 STEP 2: LOOP THROUGH PAYROLL CATEGORIES');

            Integer index = 0;

            for (Object obj : items) {

                index++;

                System.debug('---------------- CATEGORY ITEM #' + index + ' ----------------');

                if (obj == null) { continue;
                }

                Map<String, Object> cat =
                    (Map<String, Object>) obj;

                if (cat == null) { continue;
                }

                System.debug('➡ Raw Category Map: ' + cat);

                String name = (String) cat.get('Name');
                String uid  = (String) cat.get('UID');

                System.debug('➡ Category Name: ' + name);
                System.debug('➡ Category UID: ' + uid);

                // ---------------------------------------------------------
                // STEP 3 — Validate Category Fields
                // ---------------------------------------------------------
                if (String.isBlank(name)) { continue;
                }

                String normalizedName =
                    name.toLowerCase().trim();

                System.debug('➡ Normalized Category Name: ' + normalizedName);

                Boolean isMatched =
                    normalizedName.contains(searchCategory);

                System.debug('➡ Match Found?: ' + isMatched);

                // ---------------------------------------------------------
                // STEP 4 — Match Found
                // ---------------------------------------------------------
                if (isMatched) {

                    System.debug('================ 🟢 MATCH FOUND ================');

                    System.debug('✅ Matching Wage Category Located');
                    System.debug('➡ Shift Category Searched: ' + shiftCategory);
                    System.debug('➡ Matched Payroll Category Name: ' + name);
                    System.debug('➡ Returning UID: ' + uid);

                    System.debug('=========== 🟢 FIND WAGE CATEGORY UID END (FOUND) ===========');

                    return uid;
                }
            }

            // ---------------------------------------------------------
            // STEP 5 — No Match Found
            // ---------------------------------------------------------
            System.debug('================ 🟡 NO MATCH FOUND ================');

            System.debug('❌ No matching Wage Category found');
            System.debug('➡ Search Category: ' + shiftCategory);
            System.debug('➡ Total Categories Checked: ' + items.size());

            System.debug('=========== 🟡 FIND WAGE CATEGORY UID END (NOT FOUND) ===========');

            return null; } catch (Exception e) { return null;
        }
    }

    public static Map<String, Object> updateEmployeePayrollDetailsWithWageCategory(
        String companyFileUri,
        String accessToken,
        String employeeUid,
        String wageCategoryUid
    ) {

        System.debug('================== 🟧 UPDATE EmployeePayrollDetails START ==================');

        try {

            // ---------------------------------------------------------
            // STEP 1 — Validate Inputs
            // ---------------------------------------------------------
            System.debug('📥 STEP 1: VALIDATE INPUTS');

            System.debug('➡ Employee UID: ' + employeeUid);
            System.debug('➡ Wage Category UID: ' + wageCategoryUid);
            System.debug('➡ Company File URI: ' + companyFileUri);
            System.debug('➡ Access Token Present?: ' + String.isNotBlank(accessToken));

            if (String.isBlank(companyFileUri)) { return null;
            }

            if (String.isBlank(accessToken)) { return null;
            }

            if (String.isBlank(employeeUid)) { return null;
            }

            if (String.isBlank(wageCategoryUid)) { return null;
            }

            // ---------------------------------------------------------
            // STEP 2 — Fetch EmployeePayrollDetails
            // ---------------------------------------------------------
            System.debug('📥 STEP 2: Fetching EmployeePayrollDetails...');

            Map<String, Object> epd =
                getEmployeePayrollDetails(
                    companyFileUri,
                    accessToken,
                    employeeUid
                );

            System.debug('➡ EmployeePayrollDetails Response: ' + epd);

            if (epd == null || epd.isEmpty()) {

                System.debug('❌ EmployeePayrollDetails not found.');
                return null;
            }

            String epdUid = (String) epd.get('UID');

            System.debug('✅ EmployeePayrollDetails Retrieved');
            System.debug('➡ EmployeePayrollDetails UID: ' + epdUid);

            // ---------------------------------------------------------
            // STEP 3 — Extract Wage Section
            // ---------------------------------------------------------
            System.debug('🔍 STEP 3: Extracting Wage Section...');

            Map<String, Object> wage =
                (Map<String, Object>) epd.get('Wage');

            if (wage == null) { return null;
            }

            System.debug('✅ Wage Section Retrieved');
            System.debug('➡ Wage Object: ' + wage);

            // ---------------------------------------------------------
            // STEP 4 — Handle Both Field Types
            // ---------------------------------------------------------
            System.debug('📋 STEP 4: Checking Wage Category Fields...');

            List<Object> wageCategories =
                (List<Object>) wage.get('WageCategories');

            if (wageCategories == null) { wageCategories = (List<Object>) wage.get('WageCategoryHourlyDetails');

                System.debug('⚠ Using WageCategoryHourlyDetails as fallback');
            }

            if (wageCategories == null) { wageCategories = new List<Object>(); wage.put('WageCategories', wageCategories);
            }

            System.debug('✅ Current Wage Categories Count: ' +
                wageCategories.size()
            );

            // ---------------------------------------------------------
            // STEP 5 — Check Existing Category
            // ---------------------------------------------------------
            System.debug('🔍 STEP 5: Checking Existing Wage Categories...');

            Boolean exists = false;

            Integer wageIndex = 0;

            for (Object o : wageCategories) { wageIndex++; if (o == null) { continue; } Map<String, Object> w = (Map<String, Object>) o; if (w == null) { continue; }

                System.debug('➡ Wage Category Raw Map: ' + w);

                String existingUid = null;

                if (w.containsKey('UID')) {

                    existingUid = (String) w.get('UID');

                    System.debug('➡ UID Found Directly: ' + existingUid);

                } else if (w.containsKey('WageCategory')) {

                    Map<String, Object> wageCat =
                        (Map<String, Object>) w.get('WageCategory');

                    System.debug('➡ WageCategory Nested Map: ' + wageCat);

                    if (wageCat != null) {

                        existingUid =
                            (String) wageCat.get('UID');

                        System.debug('➡ Nested UID: ' + existingUid);
                    }
                }

                if (
                    existingUid != null &&
                    existingUid.equals(wageCategoryUid)
                ) {

                    exists = true;

                    System.debug('✅ Wage Category Already Exists');
                    System.debug('➡ Matching UID: ' + existingUid);

                    break;
                }
            }

            if (exists) { return epd;
            }

            // ---------------------------------------------------------
            // STEP 6 — Add New Wage Category
            // ---------------------------------------------------------
            System.debug('➕ STEP 6: Adding Missing Wage Category');

            Map<String, Object> newCat =
                new Map<String, Object>();

            newCat.put('UID', wageCategoryUid);

            wageCategories.add(newCat);

            System.debug('✅ Added New Wage Category');
            System.debug('➡ New Category Object: ' + newCat);
            System.debug('➡ Updated Wage Category Count: ' +
                wageCategories.size()
            );

            // ---------------------------------------------------------
            // STEP 7 — Update Hourly Details
            // ---------------------------------------------------------
            System.debug('🕒 STEP 7: Updating WageCategoryHourlyDetails');

            List<Object> hourlyDetails =
                (List<Object>) wage.get('WageCategoryHourlyDetails');

            if (hourlyDetails == null) {

                System.debug('⚠ WageCategoryHourlyDetails is NULL');

                hourlyDetails = new List<Object>();

                wage.put('WageCategoryHourlyDetails', hourlyDetails);

                System.debug('✅ Initialized WageCategoryHourlyDetails');
            }

            Boolean existsInHourly = false;

            Integer hourlyIndex = 0;

            for (Object obj : hourlyDetails) { hourlyIndex++; if (obj == null) { continue; } Map<String, Object> h = (Map<String, Object>) obj; if (h == null) { continue; }

                System.debug('➡ Hourly Detail Map: ' + h);

                if (
                    h.containsKey('UID') &&
                    String.valueOf(h.get('UID')) == wageCategoryUid
                ) {

                    existsInHourly = true;

                    System.debug('✅ Wage Category Exists Directly in Hourly Details');

                    break;
                }

                if (h.containsKey('WageCategory')) {

                    Map<String, Object> cat =
                        (Map<String, Object>) h.get('WageCategory');

                    System.debug('➡ Nested WageCategory: ' + cat);

                    if (
                        cat != null &&
                        String.valueOf(cat.get('UID')) == wageCategoryUid
                    ) {

                        existsInHourly = true;

                        System.debug('✅ Wage Category Exists in Nested Hourly Details');

                        break;
                    }
                }
            }

            if (!existsInHourly) {

                Map<String, Object> newHourly =
                    new Map<String, Object>();

                newHourly.put(
                    'WageCategory',
                    new Map<String, Object>{
                        'UID' => wageCategoryUid
                    }
                );

                hourlyDetails.add(newHourly);

                System.debug('➕ Added to WageCategoryHourlyDetails');
                System.debug('➡ New Hourly Detail: ' + newHourly);
            }

            System.debug('✅ Final Hourly Details Count: ' +
                hourlyDetails.size()
            );

            // ---------------------------------------------------------
            // STEP 8 — Prepare PUT Request
            // ---------------------------------------------------------
            System.debug('🌐 STEP 8: Preparing PUT Request');

            String cftoken =
                EncodingUtil.base64Encode(
                    Blob.valueOf('Administrator:')
                );

            System.debug('✅ CF Token Generated');

            User u = [
                SELECT Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            System.debug('➡ Logged-in User Organisation: ' +
                u.Organization_Name__c
            );

            Organisation__c org = [
                SELECT Id,
                    Name,
                    Client_Id__c
                FROM Organisation__c
                WHERE Name = :u.Organization_Name__c
                LIMIT 1
            ];

            System.debug('➡ Organisation Record: ' + org);

            if (org == null || String.isBlank(org.Client_Id__c)) { return null;
            }

            String endpoint =
                companyFileUri +
                '/Contact/EmployeePayrollDetails/' +
                epdUid;

            System.debug('➡ PUT Endpoint: ' + endpoint);

            HttpRequest req = new HttpRequest();

            req.setEndpoint(endpoint);
            req.setMethod('PUT');

            req.setHeader('Authorization', 'Bearer ' + accessToken);
            req.setHeader('x-myobapi-key', org.Client_Id__c);
            req.setHeader('x-myobapi-version', 'v2');
            req.setHeader('x-myobapi-cftoken', cftoken);
            req.setHeader('Content-Type', 'application/json');

            String requestBody = JSON.serialize(epd);

            req.setBody(requestBody);

            System.debug('✅ PUT Request Prepared');
            System.debug('➡ Request Body Length: ' +
                requestBody.length()
            );

            System.debug('➡ Request Body Preview: ' +
                requestBody.substring(
                    0,
                    Math.min(2000, requestBody.length())
                )
            );

            // ---------------------------------------------------------
            // STEP 9 — Execute PUT
            // ---------------------------------------------------------
            System.debug('🚀 STEP 9: Executing PUT Request');

            Http http = new Http();

            Long startTime = DateTime.now().getTime();

            HttpResponse res = http.send(req);

            Long endTime = DateTime.now().getTime();

            System.debug('⏱ PUT API Response Time(ms): ' +
                (endTime - startTime)
            );

            Integer statusCode = res.getStatusCode();

            System.debug('➡ PUT Status Code: ' + statusCode);
            System.debug('➡ PUT Status: ' + res.getStatus());

            String responseBody = res.getBody();

            if (responseBody != null) {

                System.debug(
                    '➡ PUT Response Body: ' +
                    responseBody.substring(
                        0,
                        Math.min(2000, responseBody.length())
                    )
                );
            }

            // ---------------------------------------------------------
            // STEP 10 — Validate Response
            // ---------------------------------------------------------
            System.debug('📋 STEP 10: Validating Response');

            if (
                statusCode != 200 && statusCode != 201 ) { return null;
            }

            System.debug('================ 🟢 UPDATE SUCCESS ================');

            System.debug('✅ Wage Category Successfully Assigned');
            System.debug('➡ Employee UID: ' + employeeUid);
            System.debug('➡ Assigned Wage Category UID: ' +
                wageCategoryUid
            );

            System.debug('================ 🟢 UPDATE EmployeePayrollDetails SUCCESS ==================');

            return epd; } catch (Exception e) {

            // ---------------------------------------------------------
            // EXCEPTION HANDLING
            // ---------------------------------------------------------
            System.debug('================ 💥 EXCEPTION OCCURRED ================');

            System.debug(
                '❌ Error in updateEmployeePayrollDetailsWithWageCategory: ' +
                e.getMessage()
            );

            System.debug('❌ Exception Type: ' + e.getTypeName());
            System.debug('❌ Line Number: ' + e.getLineNumber());
            System.debug('❌ Stack Trace: ' + e.getStackTraceString());
            System.debug('❌ Cause: ' + e.getCause());

            System.debug('================ 🔴 UPDATE EmployeePayrollDetails FAILED ==================');

            return null;
        }
    }  

    public static Boolean updateEmployeePayrollDetailsWithAllMissing(
        String companyFileUri,
        String accessToken,
        String employeeUid,
        Set<String> requiredWageUids
    ) {

        System.debug('==================== 🟧 UPDATE ALL MISSING WAGE CATEGORIES START ====================');

        try {

            // ---------------------------------------------------------
            // STEP 1 — Validate Inputs
            // ---------------------------------------------------------
            System.debug('📥 STEP 1: VALIDATE INPUTS');

            System.debug('➡ Company File URI: ' + companyFileUri);
            System.debug('➡ Access Token Present?: ' + String.isNotBlank(accessToken));
            System.debug('➡ Employee UID: ' + employeeUid);
            System.debug('➡ Required Wage UIDs: ' + requiredWageUids);

            if (String.isBlank(companyFileUri)) { return false;
            }

            if (String.isBlank(accessToken)) { return false;
            }

            if (String.isBlank(employeeUid)) { return false;
            }

            if (requiredWageUids == null || requiredWageUids.isEmpty()) { return false;
            }

            System.debug('✅ Input Validation Passed');
            System.debug('➡ Total Required Wage UIDs: ' + requiredWageUids.size());

            // ---------------------------------------------------------
            // STEP 2 — Fetch Employee Payroll Details
            // ---------------------------------------------------------
            System.debug('📥 STEP 2: Fetching EmployeePayrollDetails...');

            Map<String, Object> epd =
                getEmployeePayrollDetails(
                    companyFileUri,
                    accessToken,
                    employeeUid
                );

            System.debug('➡ EmployeePayrollDetails Response: ' + epd);

            if (epd == null || epd.isEmpty()) { return false;
            }

            String epdJson = JSON.serialize(epd);

            System.debug(
                '📄 EmployeePayrollDetails Length: ' +
                epdJson.length()
            );

            System.debug(
                '📄 EmployeePayrollDetails (partial): ' +
                epdJson.substring(
                    0,
                    Math.min(2000, epdJson.length())
                )
            );

            String epdUid = (String) epd.get('UID');

            System.debug('✅ EmployeePayrollDetails Retrieved');
            System.debug('➡ EmployeePayrollDetails UID: ' + epdUid);

            // ---------------------------------------------------------
            // STEP 3 — Extract Wage Section
            // ---------------------------------------------------------
            /* System.out.println('🔍 STEP 3: Extracting Wage Section'); */

            Map<String, Object> wage =
                (Map<String, Object>) epd.get('Wage');

            if (wage == null) { return false;
            }

            System.debug('✅ Wage Section Retrieved');
            System.debug('➡ Wage Object: ' + wage);

            List<Object> existingCats =
                (List<Object>) wage.get('WageCategories');

            if (existingCats == null) { existingCats = new List<Object>(); wage.put('WageCategories', existingCats);
            }

            System.debug('✅ Existing Wage Categories Count: ' +
                existingCats.size()
            );

            // ---------------------------------------------------------
            // STEP 4 — Build Existing UID Set
            // ---------------------------------------------------------
            System.debug('📋 STEP 4: Building Existing UID Set');

            Set<String> existingUids = new Set<String>();

            Integer existingIndex = 0;

            for (Object o : existingCats) {

                existingIndex++;

                System.debug('---------------- EXISTING CATEGORY #' +
                    existingIndex + ' ----------------'
                );

                if (o == null) { continue;
                }

                Map<String, Object> w =
                    (Map<String, Object>) o;

                if (w == null) { continue;
                }

                System.debug('➡ Existing Category Map: ' + w);

                String uid = (String) w.get('UID');

                System.debug('➡ Existing UID: ' + uid);

                if (uid != null) {

                    existingUids.add(uid);

                    System.debug('✅ Added to Existing UID Set');
                }
            }

            System.debug('✅ Final Existing UID Set: ' + existingUids);

            // ---------------------------------------------------------
            // STEP 5 — Add Missing Categories
            // ---------------------------------------------------------
            System.debug('➕ STEP 5: Adding Missing Wage Categories');

            Boolean updated = false;

            Integer addIndex = 0;

            for (String uid : requiredWageUids) {

                addIndex++;

                System.debug('---------------- REQUIRED UID #' +
                    addIndex + ' ----------------'
                );

                System.debug('➡ Checking UID: ' + uid);

                if (!existingUids.contains(uid)) {

                    Map<String, Object> newCat =
                        new Map<String, Object>();

                    newCat.put('UID', uid);

                    existingCats.add(newCat);

                    updated = true;

                    System.debug('➕ Added Missing Wage Category');
                    System.debug('➡ Added UID: ' + uid);
                    System.debug('➡ New Category Object: ' + newCat);

                } else {

                    System.debug('✅ UID Already Exists');
                    System.debug('➡ Existing UID: ' + uid);
                }
            }

            System.debug('➡ Was Any Update Performed?: ' + updated);

            // ---------------------------------------------------------
            // STEP 6 — Skip if No Changes
            // ---------------------------------------------------------
            if (!updated) { return true;
            }

            System.debug('✅ Updated Wage Categories Count: ' +
                existingCats.size()
            );

            // ---------------------------------------------------------
            // STEP 7 — Prepare PUT Payload
            // ---------------------------------------------------------
            System.debug('📦 STEP 7: Preparing PUT Payload');

            String finalPayload =
                JSON.serializePretty(epd);

            System.debug('📤 Final Payload Length: ' +
                finalPayload.length()
            );

            System.debug(
                '📤 Final Payload Preview: ' +
                finalPayload.substring(
                    0,
                    Math.min(3000, finalPayload.length())
                )
            );

            // ---------------------------------------------------------
            // STEP 8 — Execute PUT Update
            // ---------------------------------------------------------
            System.debug('🚀 STEP 8: Executing PUT Update');

            Long startTime = DateTime.now().getTime();

            putEmployeePayrollDetails(
                companyFileUri,
                accessToken,
                epdUid,
                epd
            );

            Long endTime = DateTime.now().getTime();

            System.debug('⏱ PUT Execution Time(ms): ' +
                (endTime - startTime)
            );

            // ---------------------------------------------------------
            // STEP 9 — Success
            // ---------------------------------------------------------
            System.debug('==================== 🟢 UPDATE SUCCESS ====================');

            System.debug('✅ PUT Update Completed Successfully');
            System.debug('➡ Employee UID: ' + employeeUid);
            System.debug('➡ Total Required Wage UIDs: ' +
                requiredWageUids.size()
            );
            System.debug('➡ Total Existing Wage UIDs: ' +
                existingUids.size()
            );
            System.debug('➡ Total Final Wage Categories: ' +
                existingCats.size()
            );

            System.debug('==================== 🟢 UPDATE ALL MISSING WAGE CATEGORIES SUCCESS ====================');

            return true; } catch (Exception ex) {

            // ---------------------------------------------------------
            // EXCEPTION HANDLING
            // ---------------------------------------------------------
            System.debug('==================== 💥 EXCEPTION OCCURRED ====================');

            System.debug(
                '❌ updateEmployeePayrollDetailsWithAllMissing Error: ' +
                ex.getMessage()
            );

            System.debug('❌ Exception Type: ' + ex.getTypeName());
            System.debug('❌ Line Number: ' + ex.getLineNumber());
            System.debug('❌ Stack Trace: ' + ex.getStackTraceString());
            System.debug('❌ Cause: ' + ex.getCause());

            System.debug('==================== 🔴 UPDATE ALL MISSING WAGE CATEGORIES FAILED ====================');

            return false;
        }
    }

    public static Map<String, Object> getEmployeePayrollDetails(
        String companyFileUri,
        String accessToken,
        String employeeUid
    ) {

        System.debug('================== 🟦 GET EmployeePayrollDetails START ==================');

        try {

            // ---------------------------------------------------------
            // STEP 1 — Validate Inputs
            // ---------------------------------------------------------
            System.debug('📥 STEP 1: VALIDATE INPUTS');

            System.debug('➡ Company File URI: ' + companyFileUri);
            System.debug('➡ Employee UID: ' + employeeUid);
            System.debug('➡ Access Token Present?: ' + String.isNotBlank(accessToken));

            if (String.isBlank(companyFileUri)) { return null;
            }

            if (String.isBlank(accessToken)) { return null;
            }

            if (String.isBlank(employeeUid)) { return null;
            }

            System.debug('✅ Input Validation Passed');

            // ---------------------------------------------------------
            // STEP 2 — Generate Company File Token
            // ---------------------------------------------------------
            System.debug('🔐 STEP 2: Generating Company File Token');

            String cftoken =
                EncodingUtil.base64Encode(
                    Blob.valueOf('Administrator:')
                );

            Integer tokenLen =
                Math.min(25, cftoken.length());

            System.debug('✅ Company File Token Generated');
            System.debug(
                '➡ CF Token (partial): ' +
                cftoken.substring(0, tokenLen) +
                '...'
            );

            // ---------------------------------------------------------
            // STEP 3 — Fetch Logged-in User
            // ---------------------------------------------------------
            System.debug('👤 STEP 3: Fetching Logged-in User');

            Id currentUserId = UserInfo.getUserId();

            System.debug('➡ Current User Id: ' + currentUserId);

            User u = [
                SELECT Id,
                    Name,
                    Organization_Name__c
                FROM User
                WHERE Id = :currentUserId
                LIMIT 1
            ];

            System.debug('✅ User Retrieved');
            System.debug('➡ User Name: ' + u.Name);
            System.debug('➡ User Organisation: ' +
                u.Organization_Name__c
            );

            if (u == null || String.isBlank(u.Organization_Name__c)) { return null;
            }

            // ---------------------------------------------------------
            // STEP 4 — Fetch Organisation Client ID
            // ---------------------------------------------------------
            System.debug('🏢 STEP 4: Fetching Organisation');

            Organisation__c org = [
                SELECT Id,
                    Name,
                    Client_Id__c
                FROM Organisation__c
                WHERE Name = :u.Organization_Name__c
                LIMIT 1
            ];

            System.debug('✅ Organisation Retrieved');
            System.debug('➡ Organisation Id: ' + org.Id);
            System.debug('➡ Organisation Name: ' + org.Name);
            System.debug('➡ Client ID Present?: ' +
                String.isNotBlank(org.Client_Id__c)
            );

            if (org == null || String.isBlank(org.Client_Id__c)) { return null;
            }

            String clientId = org.Client_Id__c;

            System.debug('✅ Client ID Loaded Successfully');

            // ---------------------------------------------------------
            // STEP 5 — Build Endpoint
            // ---------------------------------------------------------
            System.debug('🌐 STEP 5: Building Endpoint');

            String endpoint =
                companyFileUri +
                '/Contact/EmployeePayrollDetails';

            System.debug('➡ Endpoint: ' + endpoint);

            // ---------------------------------------------------------
            // STEP 6 — Prepare HTTP Request
            // ---------------------------------------------------------
            System.debug('📦 STEP 6: Preparing HTTP Request');

            HttpRequest req = new HttpRequest();

            req.setEndpoint(endpoint);
            req.setMethod('GET');

            req.setHeader(
                'Authorization',
                'Bearer ' + accessToken
            );

            req.setHeader(
                'x-myobapi-key',
                clientId
            );

            req.setHeader(
                'x-myobapi-version',
                'v2'
            );

            req.setHeader(
                'x-myobapi-cftoken',
                cftoken
            );

            req.setHeader(
                'Accept',
                'application/json'
            );

            System.debug('✅ HTTP Request Prepared');
            System.debug('➡ HTTP Method: GET');
            System.debug('➡ MYOB API Version: v2');
            System.debug('➡ Accept Header: application/json');

            // ---------------------------------------------------------
            // STEP 7 — Send Request
            // ---------------------------------------------------------
            System.debug('🚀 STEP 7: Sending Request to MYOB');

            Http http = new Http();

            Long startTime = DateTime.now().getTime();

            HttpResponse res = http.send(req);

            Long endTime = DateTime.now().getTime();

            System.debug('⏱ API Response Time(ms): ' +
                (endTime - startTime)
            );

            Integer statusCode = res.getStatusCode();

            System.debug('➡ Response Status Code: ' + statusCode);
            System.debug('➡ Response Status: ' + res.getStatus());

            String rawBody = res.getBody();

            if (rawBody != null) {

                Integer bodyLen =
                    Math.min(2000, rawBody.length());

                System.debug(
                    '➡ Response Body Length: ' +
                    rawBody.length()
                );

                System.debug(
                    '➡ Response Body (partial): ' +
                    rawBody.substring(0, bodyLen)
                );

            } else {

                System.debug('⚠ Response Body is NULL');
            }

            // ---------------------------------------------------------
            // STEP 8 — Validate API Response
            // ---------------------------------------------------------
            System.debug('📋 STEP 8: Validating API Response');

            if (statusCode != 200) { if (rawBody != null) {

                    System.debug('➡ Error Response Body: ' + rawBody);
                }

                return null;
            }

            System.debug('✅ API Response Valid');

            // ---------------------------------------------------------
            // STEP 9 — Parse JSON Response
            // ---------------------------------------------------------
            System.debug('🧾 STEP 9: Parsing JSON Response');

            Map<String, Object> json =
                (Map<String, Object>)
                JSON.deserializeUntyped(rawBody);

            if (json == null) { return null;
            }

            System.debug('✅ JSON Parsed Successfully');
            System.debug('➡ Root JSON Keys: ' + json.keySet());

            List<Object> items =
                (List<Object>) json.get('Items');

            if (items == null || items.isEmpty()) {

                System.debug('❌ No EmployeePayrollDetails Found');

                return null;
            }

            System.debug('✅ Total EmployeePayrollDetails Records: ' +
                items.size()
            );

            // ---------------------------------------------------------
            // STEP 10 — Find Matching Employee
            // ---------------------------------------------------------
            System.debug('🔍 STEP 10: Searching Matching Employee');

            Integer index = 0;

            for (Object o : items) {

                index++;

                System.debug('---------------- EMPLOYEE RECORD #' +
                    index + ' ----------------'
                );

                if (o == null) {continue;
                }

                Map<String, Object> rec =
                    (Map<String, Object>) o;

                if (rec == null) { continue;
                }

                System.debug('➡ Record Keys: ' + rec.keySet());

                Map<String, Object> emp =
                    (Map<String, Object>) rec.get('Employee');

                if (emp == null) {

                    System.debug('⚠ Employee Section is NULL');
                    continue;
                }

                System.debug('➡ Employee Object: ' + emp);

                String empUid =
                    (String) emp.get('UID');

                String empName =
                    (String) emp.get('Name');

                System.debug('➡ Employee UID: ' + empUid);
                System.debug('➡ Employee Name: ' + empName);

                Boolean matched =
                    employeeUid != null &&
                    employeeUid.equals(empUid);

                System.debug('➡ Match Found?: ' + matched);

                if (matched) {

                    System.debug('================ 🟢 MATCH FOUND ================');

                    System.debug('✅ Matching EmployeePayrollDetails Found');
                    System.debug('➡ Matched Employee UID: ' + empUid);
                    System.debug('➡ Employee Name: ' + empName);

                    String matchedJson =
                             System.JSON.serialize(rec);

                    System.debug(
                        '📄 Matched EmployeePayrollDetails: ' +
                        matchedJson.substring(
                            0,
                            Math.min(3000, matchedJson.length())
                        )
                    );

                    System.debug('================ 🟢 GET EmployeePayrollDetails SUCCESS ==================');

                    return rec;
                }
            }

            // ---------------------------------------------------------
            // STEP 11 — No Match Found
            // ---------------------------------------------------------
            System.debug('================ 🟡 NO MATCH FOUND ================');

            System.debug('❌ No matching EmployeePayrollDetails found');
            System.debug('➡ Employee UID Searched: ' + employeeUid);
            System.debug('➡ Total Records Checked: ' + items.size());

            System.debug('================ 🔴 GET EmployeePayrollDetails END ==================');

            return null;

        } catch (Exception e) {

            // ---------------------------------------------------------
            // EXCEPTION HANDLING
            // ---------------------------------------------------------
            System.debug('================ 💥 EXCEPTION OCCURRED ================');

            System.debug(
                '❌ Error in getEmployeePayrollDetails: ' +
                e.getMessage()
            );

            System.debug('❌ Exception Type: ' + e.getTypeName());
            System.debug('❌ Line Number: ' + e.getLineNumber());
            System.debug('❌ Stack Trace: ' + e.getStackTraceString());
            System.debug('❌ Cause: ' + e.getCause());

            System.debug('================ 🔴 GET EmployeePayrollDetails FAILED ==================');

            return null;
        }
    }

    public static Boolean updateEmployeeRate(
        String companyFileUri,
        String accessToken,
        String employeeUid,
        Decimal hourlyRate
    ) {

        System.debug('==================== 🟦 UPDATE EMPLOYEE RATE START ====================');

        try {

            // ---------------------------------------------------------
            // STEP 1 — Validate Inputs
            // ---------------------------------------------------------
            System.debug('📥 STEP 1: VALIDATE INPUTS');

            System.debug('➡ Company File URI: ' + companyFileUri);
            System.debug('➡ Access Token Present?: ' + String.isNotBlank(accessToken));
            System.debug('➡ Employee UID: ' + employeeUid);
            System.debug('➡ New Hourly Rate: ' + hourlyRate);

            if (String.isBlank(companyFileUri)) { return false;
            }

            if (String.isBlank(accessToken)) { return false;
            }

            if (String.isBlank(employeeUid)) { return false;
            }

            if (hourlyRate == null || hourlyRate <= 0) {

                System.debug('❌ Invalid Hourly Rate Provided');
                System.debug('➡ Hourly Rate: ' + hourlyRate);

                System.debug('==================== 🟡 UPDATE EMPLOYEE RATE END ====================');

                return false;
            }

            System.debug('✅ Input Validation Passed');

            // ---------------------------------------------------------
            // STEP 2 — Fetch EmployeePayrollDetails
            // ---------------------------------------------------------
            System.debug('📥 STEP 2: Fetching EmployeePayrollDetails');

            Map<String, Object> epd =
                getEmployeePayrollDetails(
                    companyFileUri,
                    accessToken,
                    employeeUid
                );

            System.debug('➡ EmployeePayrollDetails Response: ' + epd);

            if (epd == null || epd.isEmpty()) {

                System.debug('❌ EmployeePayrollDetails not found.');

                return false;
            }

            String epdUid = (String) epd.get('UID');

            System.debug('✅ EmployeePayrollDetails Retrieved');
            System.debug('➡ EmployeePayrollDetails UID: ' + epdUid);

            // ---------------------------------------------------------
            // STEP 3 — Extract Wage Section
            // ---------------------------------------------------------
            System.debug('🔍 STEP 3: Extracting Wage Section');

            Map<String, Object> wage =
                (Map<String, Object>) epd.get('Wage');

            if (wage == null) { return false;
            }

            System.debug('✅ Wage Section Retrieved');
            System.debug('➡ Wage Object: ' + wage);

            // ---------------------------------------------------------
            // STEP 4 — Read Existing Hourly Rate
            // ---------------------------------------------------------
            System.debug('📋 STEP 4: Reading Existing Hourly Rate');

            Decimal existingRate;

            try {

                Object existingRateObj =
                    wage.get('HourlyRate');

                System.debug('➡ Existing Rate Raw Value: ' +
                    existingRateObj
                );

                if (existingRateObj != null) {

                    existingRate =
                        Decimal.valueOf(
                            String.valueOf(existingRateObj) ); } } catch (Exception parseEx) {

                System.debug('⚠ Failed to Parse Existing Hourly Rate');
                System.debug('⚠ Parse Error: ' + parseEx.getMessage());
            }

            System.debug(
                '➡ Updating Hourly Rate From: ' +
                existingRate +
                ' → ' +
                hourlyRate
            );

            // ---------------------------------------------------------
            // STEP 5 — Skip Update if Same Rate
            // ---------------------------------------------------------
            if (
                existingRate != null &&
                existingRate == hourlyRate ) { return true;
            }

            // ---------------------------------------------------------
            // STEP 6 — Update Hourly Rate
            // ---------------------------------------------------------
            System.debug('✏ STEP 6: Updating Hourly Rate');

            wage.put('HourlyRate', hourlyRate);

            System.debug('✅ Hourly Rate Updated in Payload');
            System.debug('➡ Updated Hourly Rate: ' +
                wage.get('HourlyRate')
            );

            // ---------------------------------------------------------
            // STEP 7 — Serialize Payload
            // ---------------------------------------------------------
            System.debug('📦 STEP 7: Serializing Payload');

            String epdJson =
                JSON.serializePretty(epd);

            System.debug('📄 Payload Length: ' +
                epdJson.length()
            );

            System.debug(
                '📄 Updated Payload (partial): ' +
                epdJson.substring(
                    0,
                    Math.min(3000, epdJson.length())
                )
            );

            // ---------------------------------------------------------
            // STEP 8 — Perform PUT Update
            // ---------------------------------------------------------
            System.debug('🚀 STEP 8: Performing PUT Update');

            Long startTime = DateTime.now().getTime();

            putEmployeePayrollDetails(
                companyFileUri,
                accessToken,
                epdUid,
                epd
            );

            Long endTime = DateTime.now().getTime();

            System.debug('⏱ PUT Execution Time(ms): ' +
                (endTime - startTime)
            );

            // ---------------------------------------------------------
            // STEP 9 — Success
            // ---------------------------------------------------------
            System.debug('==================== 🟢 UPDATE SUCCESS ====================');

            System.debug('✅ Hourly Rate Successfully Updated');
            System.debug('➡ Employee UID: ' + employeeUid);
            System.debug('➡ Previous Hourly Rate: ' + existingRate);
            System.debug('➡ Updated Hourly Rate: ' + hourlyRate);

            System.debug('==================== 🟢 UPDATE EMPLOYEE RATE SUCCESS ====================');

            return true; } catch (Exception ex) {

            // ---------------------------------------------------------
            // EXCEPTION HANDLING
            // ---------------------------------------------------------
            System.debug('==================== 💥 EXCEPTION OCCURRED ====================');

            System.debug(
                '❌ Failed to update Hourly Rate: ' +
                ex.getMessage()
            );

            System.debug('❌ Exception Type: ' + ex.getTypeName());
            System.debug('❌ Line Number: ' + ex.getLineNumber());
            System.debug('❌ Stack Trace: ' + ex.getStackTraceString());
            System.debug('❌ Cause: ' + ex.getCause());

            System.debug('==================== 🔴 UPDATE EMPLOYEE RATE FAILED ====================');

            return false;
        }
    }

    public static Boolean putEmployeePayrollDetails(
        String companyFileUri,
        String accessToken,
        String epdUid,
        Map<String, Object> epdBody
    ) {

        System.debug('==================== 🟧 PUT EmployeePayrollDetails START ====================');

        try {

            // ---------------------------------------------------------
            // STEP 1 — Validate Inputs
            // ---------------------------------------------------------
            System.debug('📥 STEP 1: VALIDATE INPUTS');

            System.debug('➡ Company File URI: ' + companyFileUri);
            System.debug('➡ Access Token Present?: ' + String.isNotBlank(accessToken));
            System.debug('➡ EPD UID: ' + epdUid);
            System.debug('➡ EPD Body Present?: ' + (epdBody != null));

            if (String.isBlank(companyFileUri)) { return false;
            }

            if (String.isBlank(accessToken)) { return false;
            }

            if (String.isBlank(epdUid)) { return false;
            }

            if (epdBody == null) { return false;
            }

            System.debug('✅ Input Validation Passed');

            // ---------------------------------------------------------
            // STEP 2 — Build Company File Token
            // ---------------------------------------------------------
            System.debug('🔐 STEP 2: Building Company File Token');

            String cftoken =
                EncodingUtil.base64Encode(
                    Blob.valueOf('Administrator:')
                );

            System.debug('✅ CF Token Generated');

            System.debug(
                '➡ CF Token (partial): ' +
                cftoken.substring(
                    0,
                    Math.min(20, cftoken.length())
                ) +
                '...'
            );

            // ---------------------------------------------------------
            // STEP 3 — Fetch Logged-in User
            // ---------------------------------------------------------
            System.debug('👤 STEP 3: Fetching Logged-in User');

            Id currentUserId = UserInfo.getUserId();

            System.debug('➡ Current User Id: ' + currentUserId);

            User u = [
                SELECT Id,
                    Name,
                    Organization_Name__c
                FROM User
                WHERE Id = :currentUserId
                LIMIT 1
            ];

            System.debug('✅ User Retrieved');
            System.debug('➡ User Name: ' + u.Name);
            System.debug('➡ Organisation Name: ' +
                u.Organization_Name__c
            );

            if (u == null || String.isBlank(u.Organization_Name__c)) { return false;
            }

            // ---------------------------------------------------------
            // STEP 4 — Fetch Organisation
            // ---------------------------------------------------------
            System.debug('🏢 STEP 4: Fetching Organisation');

            Organisation__c org = [
                SELECT Id,
                    Name,
                    Client_Id__c
                FROM Organisation__c
                WHERE Name = :u.Organization_Name__c
                LIMIT 1
            ];

            System.debug('✅ Organisation Retrieved');
            System.debug('➡ Organisation Id: ' + org.Id);
            System.debug('➡ Organisation Name: ' + org.Name);
            System.debug('➡ Client ID Present?: ' +
                String.isNotBlank(org.Client_Id__c)
            );

            if (org == null || String.isBlank(org.Client_Id__c)) { return false;
            }

            String clientId = org.Client_Id__c;

            System.debug('✅ Client ID Loaded Successfully');

            // ---------------------------------------------------------
            // STEP 5 — Build Endpoint
            // ---------------------------------------------------------
            System.debug('🌐 STEP 5: Building Endpoint');

            String endpoint =
                companyFileUri +
                '/Contact/EmployeePayrollDetails/' +
                epdUid;

            System.debug('➡ Endpoint: ' + endpoint);

            // ---------------------------------------------------------
            // STEP 6 — Serialize Payload
            // ---------------------------------------------------------
            System.debug('📦 STEP 6: Serializing Payload');

            String bodyJson =
                System.JSON.serialize(epdBody);

            System.debug('✅ Payload Serialized');
            System.debug('➡ Payload Length: ' +
                bodyJson.length()
            );

            System.debug(
                '➡ Payload (partial): ' +
                bodyJson.substring(
                    0,
                    Math.min(3000, bodyJson.length())
                )
            );

            // ---------------------------------------------------------
            // STEP 7 — Prepare HTTP Request
            // ---------------------------------------------------------
            System.debug('📨 STEP 7: Preparing HTTP Request');

            HttpRequest req = new HttpRequest();

            req.setEndpoint(endpoint);
            req.setMethod('PUT');

            req.setHeader(
                'Authorization',
                'Bearer ' + accessToken
            );

            req.setHeader(
                'x-myobapi-key',
                clientId
            );

            req.setHeader(
                'x-myobapi-version',
                'v2'
            );

            req.setHeader(
                'x-myobapi-cftoken',
                cftoken
            );

            req.setHeader(
                'Content-Type',
                'application/json'
            );

            req.setHeader(
                'Accept',
                'application/json'
            );

            req.setBody(bodyJson);

            System.debug('✅ HTTP Request Prepared');
            System.debug('➡ Method: PUT');
            System.debug('➡ Content-Type: application/json');

            // ---------------------------------------------------------
            // STEP 8 — Execute Callout
            // ---------------------------------------------------------
            System.debug('🚀 STEP 8: Executing PUT Callout');

            Http http = new Http();

            Long startTime = DateTime.now().getTime();

            HttpResponse res = http.send(req);

            Long endTime = DateTime.now().getTime();

            System.debug('⏱ API Response Time(ms): ' +
                (endTime - startTime)
            );

            Integer statusCode = res.getStatusCode();

            String responseBody = res.getBody();

            System.debug('➡ Response Status Code: ' + statusCode);
            System.debug('➡ Response Status: ' + res.getStatus());

            if (responseBody != null) {

                System.debug(
                    '➡ Response Body Length: ' +
                    responseBody.length()
                );

                System.debug(
                    '➡ Response Body (partial): ' +
                    responseBody.substring(
                        0,
                        Math.min(3000, responseBody.length())
                    )
                );

            } else {

                System.debug('⚠ Response Body is NULL');
            }

            // ---------------------------------------------------------
            // STEP 9 — Success Handling
            // ---------------------------------------------------------
            if (statusCode == 200 || statusCode == 201) {

                System.debug('==================== 🟢 PUT SUCCESS ====================');

                System.debug('✅ PUT EmployeePayrollDetails SUCCESS');
                System.debug('➡ Updated EPD UID: ' + epdUid);

                System.debug('==================== 🟢 PUT EmployeePayrollDetails END ====================');

                return true;
            }

            // ---------------------------------------------------------
            // STEP 10 — Error Parsing
            // ---------------------------------------------------------
            System.debug('🔍 STEP 10: Parsing Error Response');

            String errMsg =
                'Failed to update EmployeePayrollDetails (Status ' +
                statusCode +
                ')';

            try {

                if (String.isNotBlank(responseBody)) {

                    Map<String, Object> errorJson =
                        (Map<String, Object>)
                        JSON.deserializeUntyped(responseBody);

                    System.debug('➡ Parsed Error JSON: ' + errorJson);

                    if (errorJson.containsKey('Errors')) {

                        List<Object> errors =
                            (List<Object>) errorJson.get('Errors');

                        System.debug('➡ Total Errors: ' + errors.size());

                        Integer errorIndex = 0;

                        for (Object errObj : errors) {

                            errorIndex++;

                            System.debug('---------------- ERROR #' +
                                errorIndex + ' ----------------'
                            );

                            Map<String, Object> err =
                                (Map<String, Object>) errObj;

                            System.debug('➡ Error Object: ' + err);

                            errMsg += '\n• ' +
                                String.valueOf(err.get('Name')) +
                                ': ' +
                                String.valueOf(err.get('Message'));
                        }
                    }
                }

            } catch (Exception parseEx) {

                System.debug('⚠ Error Parsing MYOB Response');
                System.debug('⚠ Parse Error: ' + parseEx.getMessage());
                System.debug('⚠ Parse Stack Trace: ' +
                    parseEx.getStackTraceString()
                );
            }

            // ---------------------------------------------------------
            // STEP 11 — Failure
            // ---------------------------------------------------------
            System.debug('==================== 🔴 PUT FAILED ====================');

            System.debug('❌ ' + errMsg);
            System.debug('➡ Final Status Code: ' + statusCode);

            System.debug('==================== 🔴 PUT EmployeePayrollDetails FAILED ====================');

            return false;

        } catch (Exception e) {

            // ---------------------------------------------------------
            // EXCEPTION HANDLING
            // ---------------------------------------------------------
            System.debug('==================== 💥 EXCEPTION OCCURRED ====================');

            System.debug(
                '❌ Error in putEmployeePayrollDetails: ' +
                e.getMessage()
            );

            System.debug('❌ Exception Type: ' + e.getTypeName());
            System.debug('❌ Line Number: ' + e.getLineNumber());
            System.debug('❌ Stack Trace: ' + e.getStackTraceString());
            System.debug('❌ Cause: ' + e.getCause());

            System.debug('==================== 🔴 PUT EmployeePayrollDetails EXCEPTION ====================');

            return false;
        }
    }

    public static Map<String, Object> insertMyobTimesheet(
        String companyFileUri,
        String accessToken,
        String employeeUid,
        Date startDate,
        Date endDate,
        List<ShiftwithStaff__c> shifts,
        List<Object> payrollItems
    ) {

        System.debug('================== 🟧 INSERT MYOB Timesheet START ==================');

        try {

            // ---------------------------------------------------------
            // STEP 1 — Validate Inputs
            // ---------------------------------------------------------
            System.debug('📥 STEP 1: VALIDATE INPUTS');

            System.debug('➡ Company File URI: ' + companyFileUri);
            System.debug('➡ Employee UID: ' + employeeUid);
            System.debug('➡ Start Date: ' + startDate);
            System.debug('➡ End Date: ' + endDate);
            System.debug('➡ Access Token Present?: ' + String.isNotBlank(accessToken));
            System.debug('➡ Shift Count: ' + (shifts != null ? shifts.size() : 0));
            System.debug('➡ Payroll Item Count: ' + (payrollItems != null ? payrollItems.size() : 0));

            if (String.isBlank(companyFileUri)) { return new Map<String, Object>{ 'success' => false, 'message' => 'Company File URI is missing.'
                };
            }

            if (String.isBlank(accessToken)) { return new Map<String, Object>{ 'success' => false, 'message' => 'Access token is missing.'
                };
            }

            if (String.isBlank(employeeUid)) { return new Map<String, Object>{ 'success' => false, 'message' => 'Employee UID is missing.'
                };
            }

            if (shifts == null || shifts.isEmpty()) { return new Map<String, Object>{ 'success' => false, 'message' => 'No shifts available to insert.'
                };
            }

            // ---------------------------------------------------------
            // STEP 2 — Initialize Containers
            // ---------------------------------------------------------
            System.debug('📦 STEP 2: Initializing Containers');

            Map<String, List<Map<String, Object>>> categoryEntries =
                new Map<String, List<Map<String, Object>>>();

            Decimal totalBrokenPay = 0;
            Decimal totalBrokenHours = 0;

            List<ShiftwithStaff__c> brokenShifts =
                new List<ShiftwithStaff__c>();

            System.debug('✅ Containers Initialized');

            // ---------------------------------------------------------
            // STEP 3 — Process Shifts
            // ---------------------------------------------------------
            System.debug('🔄 STEP 3: Processing Shifts');

            Integer shiftIndex = 0;

            for (ShiftwithStaff__c s : shifts) {

                shiftIndex++;

                System.debug('---------------- SHIFT #' +
                    shiftIndex + ' ----------------'
                );

                System.debug('➡ Shift Id: ' + s.Id);
                System.debug('➡ Shift Date: ' + s.Date__c);
                System.debug('➡ Shift Category: ' + s.Shift_Category__c);
                System.debug('➡ Actual Duration: ' + s.Actual_Duration__c);
                System.debug('➡ Broken Shift?: ' + s.Broken_Shift__c);

                /* =====================================================
                BROKEN SHIFT / BROKEN OVERTIME SHIFT
                ===================================================== */

                if (s.Broken_Shift__c == true) { brokenShifts.add(s); if ( s.Broken_Extended_Duration__c != null && s.Broken_Extended_Duration__c > 0 && s.Broken_Extended_Rate__c != null && s.Broken_Extended_Rate__c > 0 ) {

                        System.debug(
                            '🟣 Broken Over Time Shift Detected'
                        );

                        String brokenOtUid =
                            findWageCategoryUid(
                                'broken over time shift',
                                payrollItems
                            );

                        if (brokenOtUid != null) {

                            if (!categoryEntries.containsKey(brokenOtUid)) {

                                categoryEntries.put(
                                    brokenOtUid,
                                    new List<Map<String, Object>>()
                                );
                            }

                            String dateStr =
                                Datetime.newInstance(
                                    s.Date__c.year(),
                                    s.Date__c.month(),
                                    s.Date__c.day()
                                ).format('yyyy-MM-dd\'T\'00:00:00');

                            Map<String, Object> brokenOtEntry =
                                new Map<String, Object>{
                                    'Date' => dateStr,
                                    'Hours' => s.Broken_Extended_Duration__c,
                                    'Processed' => false
                                };

                            categoryEntries
                                .get(brokenOtUid)
                                .add(brokenOtEntry);

                            System.debug(
                                '✅ Added Broken Over Time Shift Entry'
                            );
                        }
                    }

                    continue;
                }

                // ---------------------------------------------------------
                // Find Wage Category UID
                // ---------------------------------------------------------
                String wageUid =
                    findWageCategoryUid(
                        s.Shift_Category__c,
                        payrollItems
                    );

                System.debug('➡ Wage UID: ' + wageUid);

                if (wageUid == null) {                  System.debug('❌ No Wage Category Found For Shift');                    continue;
                }

                // ---------------------------------------------------------
                // Initialize Category Entry
                // ---------------------------------------------------------
                if (!categoryEntries.containsKey(wageUid)) {

                    categoryEntries.put(
                        wageUid,
                        new List<Map<String, Object>>()
                    );

                    System.debug('✅ Created New Category Entry List');
                }

                String dateStr =
                    Datetime.newInstance(
                        s.Date__c.year(),
                        s.Date__c.month(),
                        s.Date__c.day()
                    ).format('yyyy-MM-dd\'T\'00:00:00');

                /* =====================================================
                REGULAR SHIFT ENTRY
                ===================================================== */

                Map<String, Object> entry =
                    new Map<String, Object>{
                        'Date' => dateStr,
                        'Hours' => s.Actual_Duration__c,
                        'Processed' => false
                    };

                categoryEntries.get(wageUid).add(entry);

                System.debug('✅ Regular Shift Entry Added');
                System.debug('➡ Entry: ' + entry);

                /* =====================================================
                OVERTIME TIER 1 (1.5x)
                ===================================================== */

                if (
                    s.Over_Time_Tier_One__c != null && s.Over_Time_Tier_One__c > 0
                ) {

                    System.debug('🟠 Processing Overtime (1.5x)');
                    System.debug('➡ OT Hours: ' + s.Over_Time_Tier_One__c);
                    System.debug('➡ OT Rate: ' + s.Over_Time_Tier_One_Rate__c);

                    String ot15Uid =
                        findWageCategoryUid(
                            'overtime (1.5x)',
                            payrollItems
                        );

                    System.debug('➡ OT 1.5 Wage UID: ' + ot15Uid);

                    if (ot15Uid != null) {

                        if (!categoryEntries.containsKey(ot15Uid)) {

                            categoryEntries.put(
                                ot15Uid,
                                new List<Map<String, Object>>()
                            );

                            System.debug(
                                '✅ Created Overtime (1.5x) Category Entry List'
                            );
                        }

                        Map<String, Object> otEntry =
                            new Map<String, Object>{
                                'Date' => dateStr,
                                'Hours' => s.Over_Time_Tier_One__c,
                                'Processed' => false
                            };

                        categoryEntries.get(ot15Uid).add(
                            otEntry
                        );

                        System.debug(
                            '✅ Overtime (1.5x) Entry Added'
                        );

                        System.debug(
                            '➡ OT Entry: ' + otEntry
                        );
                    } else {

                        System.debug(
                            '❌ Overtime (1.5x) Payroll Category Not Found'
                        );
                    }
                }

                /* =====================================================
                OVERTIME TIER 2 (2x)
                ===================================================== */

                if (
                    s.Over_Time_Tier_Two__c != null &&
                    s.Over_Time_Tier_Two__c > 0
                ) {

                    System.debug('🔴 Processing Overtime (2x)');
                    System.debug('➡ OT 2 Hours: ' + s.Over_Time_Tier_Two__c);

                    String ot2Uid =
                        findWageCategoryUid(
                            'overtime (2x)',
                            payrollItems
                        );

                    System.debug('➡ OT 2 Wage UID: ' + ot2Uid);

                    if (ot2Uid != null) {

                        if (!categoryEntries.containsKey(ot2Uid)) {

                            categoryEntries.put(
                                ot2Uid,
                                new List<Map<String, Object>>()
                            );

                            System.debug(
                                '✅ Created Overtime (2x) Category Entry List'
                            );
                        }

                        Map<String, Object> ot2Entry =
                            new Map<String, Object>{
                                'Date' => dateStr,
                                'Hours' => s.Over_Time_Tier_Two__c,
                                'Processed' => false
                            };

                        categoryEntries.get(ot2Uid).add(
                            ot2Entry
                        );

                        System.debug(
                            '✅ Added Overtime (2x) Entry'
                        );

                        System.debug(
                            '➡ OT 2 Entry: ' + ot2Entry
                        );
                    }
                }

                /* =====================================================
                BROKEN OVERTIME SHIFT
                ===================================================== */

                if (
                    s.Broken_Extended_Duration__c != null &&
                    s.Broken_Extended_Duration__c > 0
                ) {

                    System.debug('🟣 Processing Broken Over Time Shift');
                    System.debug('➡ Broken OT Hours: ' + s.Broken_Extended_Duration__c);

                    String brokenOtUid =
                        findWageCategoryUid(
                            'broken over time shift',
                            payrollItems
                        );

                    System.debug('➡ Broken OT Wage UID: ' + brokenOtUid);

                    if (brokenOtUid != null) {

                        if (!categoryEntries.containsKey(brokenOtUid)) {

                            categoryEntries.put(
                                brokenOtUid,
                                new List<Map<String, Object>>()
                            );

                            System.debug(
                                '✅ Created Broken OT Category Entry List'
                            );
                        }

                        Map<String, Object> brokenOtEntry =
                            new Map<String, Object>{
                                'Date' => dateStr,
                                'Hours' => s.Broken_Extended_Duration__c,
                                'Processed' => false
                            };

                        categoryEntries.get(brokenOtUid).add(
                            brokenOtEntry
                        );

                        System.debug(
                            '✅ Added Broken OT Entry'
                        );

                        System.debug(
                            '➡ Broken OT Entry: ' + brokenOtEntry
                        );
                    }
                }

                /* =====================================================
                EXTENDED SHIFT
                ===================================================== */

                if (
                    s.Extended_Duration__c != null &&
                    s.Extended_Duration__c > 0
                ) {

                    System.debug('🟢 Processing Extended Shift');
                    System.debug('➡ Extended Hours: ' + s.Extended_Duration__c);

                    String extendedUid =
                        findWageCategoryUid(
                            'extended shift',
                            payrollItems
                        );

                    System.debug('➡ Extended Shift Wage UID: ' + extendedUid);

                    if (extendedUid != null) {

                        if (!categoryEntries.containsKey(extendedUid)) {

                            categoryEntries.put(
                                extendedUid,
                                new List<Map<String, Object>>()
                            );

                            System.debug(
                                '✅ Created Extended Shift Category Entry List'
                            );
                        }

                        Map<String, Object> extendedEntry =
                            new Map<String, Object>{
                                'Date' => dateStr,
                                'Hours' => s.Extended_Duration__c,
                                'Processed' => false
                            };

                        categoryEntries.get(extendedUid).add(
                            extendedEntry
                        );

                        System.debug(
                            '✅ Added Extended Shift Entry'
                        );

                        System.debug(
                            '➡ Extended Entry: ' + extendedEntry
                        );
                    }
                }
            }

            // ---------------------------------------------------------
            // STEP 4 — Process Broken Shifts
            // ---------------------------------------------------------
            System.debug('⚠ STEP 4: Processing Broken Shifts');

            System.debug('➡ Broken Shift Count: ' + brokenShifts.size());
            System.debug('➡ Total Broken Hours: ' + totalBrokenHours);

            System.debug('➡ Broken Shift Count: ' + brokenShifts.size());

            if (!brokenShifts.isEmpty()) {

                String brokenShiftUid =
                    findWageCategoryUid(
                        'broken shift',
                        payrollItems
                    );

                System.debug('➡ Broken Shift Wage UID: ' + brokenShiftUid);

                if (brokenShiftUid != null) {

                    if (!categoryEntries.containsKey(brokenShiftUid)) {

                        categoryEntries.put(
                            brokenShiftUid,
                            new List<Map<String, Object>>()
                        );

                        System.debug('✅ Created Broken Shift Category');
                    }

                    Map<Date, Decimal> brokenHoursByDate =
                        new Map<Date, Decimal>();

                    for (ShiftwithStaff__c s : brokenShifts) {

                        Decimal duration =
                            s.Actual_Duration__c != null
                            ? s.Actual_Duration__c
                            : 0;

                        Decimal existing =
                            brokenHoursByDate.containsKey(s.Date__c)
                            ? brokenHoursByDate.get(s.Date__c)
                            : 0;

                        brokenHoursByDate.put(
                            s.Date__c,
                            existing + duration
                        );

                        System.debug(
                            '➡ Broken Hours Aggregated For Date ' +
                            s.Date__c +
                            ': ' +
                            brokenHoursByDate.get(s.Date__c)
                        );
                    }

                    for (Date shiftDate : brokenHoursByDate.keySet()) {

                        String dateStr =
                            Datetime.newInstance(
                                shiftDate.year(),
                                shiftDate.month(),
                                shiftDate.day()
                            ).format('yyyy-MM-dd\'T\'00:00:00');

                        Map<String, Object> brokenEntry =
                            new Map<String, Object>{
                                'Date' => dateStr,
                                'Hours' => brokenHoursByDate.get(shiftDate),
                                'Processed' => false
                            };

                        categoryEntries.get(brokenShiftUid).add(
                            brokenEntry
                        );

                        System.debug('✅ Broken Shift Entry Added');
                        System.debug('➡ Entry: ' + brokenEntry);
                    }
                } else {

                    System.debug(
                        '❌ Broken Shift Payroll Category Not Found'
                    );
                }
            }

            // ---------------------------------------------------------
            // STEP 5 — Validate Category Entries
            // ---------------------------------------------------------
            System.debug('📋 STEP 5: Validating Category Entries');

            System.debug('➡ Total Wage Categories: ' +
                categoryEntries.size()
            );

            if (categoryEntries.isEmpty()) {

                System.debug('❌ No Valid Wage Categories Found');

                return new Map<String, Object>{
                    'success' => false,
                    'message' => 'No valid MYOB wage categories found for shifts.'
                };
            }

            // ---------------------------------------------------------
            // STEP 6 — Build Lines
            // ---------------------------------------------------------
            System.debug('📦 STEP 6: Building Timesheet Lines');

            List<Object> lines = new List<Object>();

            for (String wageUid : categoryEntries.keySet()) {

                Map<String, Object> line =
                    new Map<String, Object>{
                        'PayrollCategory' =>
                            new Map<String, Object>{
                                'UID' => wageUid
                            },
                        'Notes' => 'Auto Timesheet',
                        'Entries' => categoryEntries.get(wageUid)
                    };

                lines.add(line);

                System.debug('✅ Line Added');
                System.debug('➡ Wage UID: ' + wageUid);
                System.debug('➡ Entry Count: ' +
                    categoryEntries.get(wageUid).size()
                );
            }

            // ---------------------------------------------------------
            // STEP 7 — Build Date Strings
            // ---------------------------------------------------------
            System.debug('📅 STEP 7: Building MYOB Date Strings');

            String myobStart =
                Datetime.newInstance(
                    startDate.year(),
                    startDate.month(),
                    startDate.day()
                ).format('yyyy-MM-dd\'T\'00:00:00');

            String myobEnd =
                Datetime.newInstance(
                    endDate.year(),
                    endDate.month(),
                    endDate.day()
                ).format('yyyy-MM-dd\'T\'00:00:00');

            System.debug('➡ MYOB Start Date: ' + myobStart);
            System.debug('➡ MYOB End Date: ' + myobEnd);

            // ---------------------------------------------------------
            // STEP 8 — Build Payload
            // ---------------------------------------------------------
            System.debug('📦 STEP 8: Building Payload');

            Map<String, Object> payload =
                new Map<String, Object>{
                    'Employee' =>
                        new Map<String, Object>{
                            'UID' => employeeUid
                        },
                    'StartDate' => myobStart,
                    'EndDate' => myobEnd,
                    'Lines' => lines
                };

            String payloadJson =
                System.JSON.serialize(payload);

            System.debug('✅ Payload Built');
            System.debug('➡ Payload Length: ' +
                payloadJson.length()
            );

            System.debug(
                '➡ Payload Preview: ' +
                payloadJson.substring(
                    0,
                    Math.min(4000, payloadJson.length())
                )
            );

            // ---------------------------------------------------------
            // STEP 9 — Extract Company File GUID
            // ---------------------------------------------------------
            System.debug('🔍 STEP 9: Extracting Company File GUID');

            List<String> parts =
                companyFileUri.split('/');

            System.debug('➡ URI Parts: ' + parts);

            String cfGuid =
                parts[parts.indexOf('accountright') + 1];

            System.debug('➡ Company File GUID: ' + cfGuid);

            // ---------------------------------------------------------
            // STEP 10 — Build Endpoint
            // ---------------------------------------------------------
            System.debug('🌐 STEP 10: Building Endpoint');

            String postEndpoint =
                'https://arl2.api.myob.com/accountright/' +
                cfGuid +
                '/Payroll/Timesheet/' +
                employeeUid +
                '?StartDate=' +
                EncodingUtil.urlEncode(myobStart, 'UTF-8') +
                '&EndDate=' +
                EncodingUtil.urlEncode(myobEnd, 'UTF-8');

            System.debug('➡ POST Endpoint: ' + postEndpoint);

            // ---------------------------------------------------------
            // STEP 11 — Generate CF Token
            // ---------------------------------------------------------
            System.debug('🔐 STEP 11: Generating CF Token');

            String cftoken =
                EncodingUtil.base64Encode(
                    Blob.valueOf('Administrator:')
                );

            System.debug('✅ CF Token Generated');

            // ---------------------------------------------------------
            // STEP 12 — Fetch Organisation
            // ---------------------------------------------------------
            System.debug('🏢 STEP 12: Fetching Organisation');

            User u = [
                SELECT Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            System.debug('➡ User Organisation: ' +
                u.Organization_Name__c
            );

            Organisation__c org = [
                SELECT Client_Id__c
                FROM Organisation__c
                WHERE Name = :u.Organization_Name__c
                LIMIT 1
            ];

            System.debug('➡ Client ID Present?: ' +
                String.isNotBlank(org.Client_Id__c)
            );

            // ---------------------------------------------------------
            // STEP 13 — Build HTTP Request
            // ---------------------------------------------------------
            System.debug('📨 STEP 13: Preparing HTTP Request');

            HttpRequest req = new HttpRequest();

            req.setEndpoint(postEndpoint);
            req.setMethod('PUT');

            req.setHeader(
                'Authorization',
                'Bearer ' + accessToken
            );

            req.setHeader(
                'x-myobapi-key',
                org.Client_Id__c
            );

            req.setHeader(
                'x-myobapi-version',
                'v2'
            );

            req.setHeader(
                'x-myobapi-cftoken',
                cftoken
            );

            req.setHeader(
                'Content-Type',
                'application/json'
            );

            req.setHeader(
                'Accept',
                'application/json'
            );

            req.setBody(payloadJson);

            System.debug('✅ HTTP Request Prepared');

            // ---------------------------------------------------------
            // STEP 14 — Execute API Call
            // ---------------------------------------------------------
            System.debug('🚀 STEP 14: Executing MYOB API Call');

            Long startTimeMs =
                DateTime.now().getTime();

            HttpResponse res =
                new Http().send(req);

            Long endTimeMs =
                DateTime.now().getTime();

            System.debug('⏱ API Response Time(ms): ' +
                (endTimeMs - startTimeMs)
            );

            Integer statusCode =
                res.getStatusCode();

            String responseBody =
                res.getBody();

            System.debug('➡ MYOB Status Code: ' + statusCode);
            System.debug('➡ MYOB Status: ' + res.getStatus());

            if (responseBody != null) {

                System.debug(
                    '➡ MYOB Body: ' +
                    responseBody.substring(
                        0,
                        Math.min(4000, responseBody.length())
                    )
                );
            }

            // ---------------------------------------------------------
            // STEP 15 — Success Handling
            // ---------------------------------------------------------
            if (statusCode >= 200 && statusCode < 300) {

                System.debug('================ 🟢 INSERT SUCCESS ================');

                System.debug('✅ Timesheet Inserted Successfully');
                System.debug('➡ Employee UID: ' + employeeUid);

                return new Map<String, Object>{
                    'success' => true,
                    'statusCode' => statusCode,
                    'message' => 'Timesheet inserted successfully',
                    'body' => responseBody
                };
            }

            // ---------------------------------------------------------
            // STEP 16 — Error Parsing
            // ---------------------------------------------------------
            System.debug('🔍 STEP 16: Parsing Error Response');

            String errorMsg = responseBody;

            try {

                Map<String, Object> err =
                    (Map<String, Object>)
                    JSON.deserializeUntyped(responseBody);

                System.debug('➡ Parsed Error JSON: ' + err);

                if (err.containsKey('Errors')) {

                    List<Object> errors =
                        (List<Object>) err.get('Errors');

                    System.debug('➡ Error Count: ' + errors.size());

                    if (!errors.isEmpty()) {

                        Map<String, Object> firstError =
                            (Map<String, Object>) errors[0];

                        errorMsg =
                            String.valueOf(
                                firstError.get('Message')
                            );

                        System.debug('➡ Parsed Error Message: ' + errorMsg);
                    }
                }

            } catch (Exception ex) {

                System.debug('⚠ Failed to Parse Error Response');
                System.debug('⚠ Parse Error: ' + ex.getMessage());
            }

            // ---------------------------------------------------------
            // STEP 17 — Failure
            // ---------------------------------------------------------
            System.debug('================ 🔴 INSERT FAILED ================');

            System.debug('❌ Failed to Insert MYOB Timesheet');
            System.debug('➡ Status Code: ' + statusCode);
            System.debug('➡ Error Message: ' + errorMsg);

            return new Map<String, Object>{
                'success' => false,
                'statusCode' => statusCode,
                'message' => errorMsg,
                'body' => responseBody
            };

        } catch (Exception e) {

            // ---------------------------------------------------------
            // EXCEPTION HANDLING
            // ---------------------------------------------------------
            System.debug('================ 💥 EXCEPTION OCCURRED ================');

            System.debug('❌ Exception Message: ' + e.getMessage());
            System.debug('❌ Exception Type: ' + e.getTypeName());
            System.debug('❌ Line Number: ' + e.getLineNumber());
            System.debug('❌ Stack Trace: ' + e.getStackTraceString());
            System.debug('❌ Cause: ' + e.getCause());

            return new Map<String, Object>{
                'success' => false,
                'message' => e.getMessage()
            };
        }
    }

    // Helper method to verify wage categories are assigned
    public static Boolean verifyWageCategoriesAssigned(
        String companyFileUri,
        String accessToken,
        String employeeUid,
        Set<String> requiredWageUids,
        Integer maxAttempts
    ) {
        System.debug('🔍 Verifying wage categories are assigned...');
        
        for (Integer attempt = 1; attempt <= maxAttempts; attempt++) {
            System.debug('⏱️ Verification attempt ' + attempt + ' of ' + maxAttempts);
            
            // Wait 1 second between attempts
            if (attempt > 1) { Long waitStart = DateTime.now().getTime(); while (DateTime.now().getTime() - waitStart < 1000) {
                    // Simple busy wait
                }
            }
            
            try {
                // Re-fetch employee payroll details
                Map<String, Object> epd = getEmployeePayrollDetails(
                    companyFileUri, 
                    accessToken, 
                    employeeUid
                );
                
                if (epd != null) {
                    Map<String, Object> wage = (Map<String, Object>) epd.get('Wage');
                    if (wage != null) {
                        Set<String> assignedUids = new Set<String>();
                        
                        // Check WageCategoryHourlyDetails
                        List<Object> wageCategories = (List<Object>) wage.get('WageCategoryHourlyDetails');
                        if (wageCategories != null) {
                            for (Object obj : wageCategories) {
                                Map<String, Object> w = (Map<String, Object>) obj;
                                Map<String, Object> wageCat = (Map<String, Object>) w.get('WageCategory');
                                
                                if (wageCat != null) {
                                    String uid = (String) wageCat.get('UID');
                                    if (uid != null) {
                                        assignedUids.add(uid); } } else { String uid = (String) w.get('UID'); if (uid != null) { assignedUids.add(uid);
                                        System.debug('✅ Found direct UID in WageCategoryHourlyDetails: ' + uid);
                                    }
                                }
                            }
                        }
                        
                        // Also check WageCategories field
                        List<Object> altCategories = (List<Object>) wage.get('WageCategories');
                        if (altCategories != null) {
                            for (Object obj : altCategories) {
                                Map<String, Object> w = (Map<String, Object>) obj;
                                String uid = (String) w.get('UID');
                                if (uid != null) {
                                    assignedUids.add(uid);
                                    System.debug('✅ Found in WageCategories: ' + uid);
                                }
                            }
                        }
                        
                        // Check if all required categories are assigned
                        if (assignedUids.containsAll(requiredWageUids)) {
                            System.debug('✅ All required wage categories are now assigned!');
                            return true;
                        } else {
                            Set<String> missing = new Set<String>(requiredWageUids);
                            missing.removeAll(assignedUids);
                            System.debug('⚠️ Still missing categories: ' + missing);
                        }
                    }
                }
            } catch (Exception e) {
                System.debug('⚠️ Error during verification: ' + e.getMessage());
            }
        }
        
        System.debug('❌ Failed to verify all categories after ' + maxAttempts + ' attempts');
        return false;
    }

    @AuraEnabled
    public static String getMyobInvoicesfromMYOB(String accessToken, String refreshToken, String companyFileUri) {
        try {

            System.debug('🚀 Fetching MYOB Invoices...');
            System.debug('📌 CompanyFileUri: ' + companyFileUri);

            // ---------------------------------------
            // 🔹 STEP 1: Get Org Credentials
            // ---------------------------------------
            User currentUser = [
                SELECT Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            Organisation__c orgRecord = [
                SELECT Client_Id__c, Client_Secret__c
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];

            // ---------------------------------------
            // 🔁 STEP 2: Refresh Token (Recommended)
            // ---------------------------------------
            String refreshResponse = refreshMyobToken(refreshToken);

            if (String.isBlank(refreshResponse)) { throw new AuraHandledException('Unable to refresh MYOB token');
            }

            Map<String, Object> refreshed =
                (Map<String, Object>) JSON.deserializeUntyped(refreshResponse);

            String newAccessToken  = (String) refreshed.get('access_token');
            String newRefreshToken = (String) refreshed.get('refresh_token');

            System.debug('🆕 New Access Token: ' + newAccessToken);

            // ---------------------------------------
            // 🔹 STEP 3: Generate CF Token
            // ---------------------------------------
            String cftoken = EncodingUtil.base64Encode(
                Blob.valueOf('Administrator:')
            );

            Http http = new Http();

            // ---------------------------------------
            // 🔹 STEP 4: FETCH ALL INVOICES WITH PAGINATION
            // ---------------------------------------
            List<Map<String, Object>> allInvoices = new List<Map<String, Object>>();
            Integer pageSize = 400;      // Maximum records per request
            Integer currentPage = 0;     // Start from first page
            Integer maxPages = 50;       // Safety limit (50 pages * 400 = 20,000 records)
            Integer totalRecordsFetched = 0;
            Boolean hasMorePages = true;
            
            System.debug('🔹 Starting pagination to fetch all invoices...');
            
            while (hasMorePages && currentPage < maxPages) {
                
                Integer skip = currentPage * pageSize;
                System.debug('📄 Fetching page ' + (currentPage + 1) + ' (skip: ' + skip + ', top: ' + pageSize + ')');
                
                HttpRequest req = new HttpRequest();
                String endpoint = companyFileUri + '/Sale/Invoice/Service?$top=' + pageSize + '&$skip=' + skip;
                req.setEndpoint(endpoint);
                req.setMethod('GET');
                req.setHeader('Authorization', 'Bearer ' + newAccessToken);
                req.setHeader('x-myobapi-key', orgRecord.Client_Id__c);
                req.setHeader('x-myobapi-version', 'v2');
                req.setHeader('x-myobapi-cftoken', cftoken);
                req.setHeader('Accept', 'application/json');
                
                HttpResponse res = http.send(req);
                
                System.debug('📡 Response Status (Page ' + (currentPage + 1) + '): ' + res.getStatusCode());
                
                if (res.getStatusCode() == 200) {
                    
                    Map<String, Object> responseMap = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                    List<Object> invoices = (List<Object>) responseMap.get('Items');
                    Integer totalCount = responseMap.containsKey('Count') ? (Integer) responseMap.get('Count') : 0;
                    
                    Integer recordsInPage = (invoices == null ? 0 : invoices.size());
                    totalRecordsFetched += recordsInPage;
                    
                    System.debug('📦 Page ' + (currentPage + 1) + ' → ' + recordsInPage + ' invoices');
                    System.debug('📊 Total fetched so far: ' + totalRecordsFetched + ' / ' + totalCount);
                    
                    // Add invoices from this page to the master list
                    if (invoices != null && !invoices.isEmpty()) {
                        for (Object inv : invoices) {
                            Map<String, Object> invoiceMap = (Map<String, Object>) inv;
                            allInvoices.add(invoiceMap);
                        }
                    }
                    
                    // Check if we've fetched all records
                    if (recordsInPage < pageSize || totalRecordsFetched >= totalCount) {
                        hasMorePages = false; } else { currentPage++; } } else { throw new AuraHandledException('MYOB API Error on page ' + (currentPage + 1) + ': ' + res.getBody());
                }
            }
            
            System.debug('✅ Total invoices fetched: ' + allInvoices.size());
            System.debug('✅ Total pages processed: ' + (currentPage + 1));

            // ---------------------------------------
            // 🔹 STEP 5: Prepare Final Response with ALL Invoices
            // ---------------------------------------
            Map<String, Object> finalResponse = new Map<String, Object>();
            
            // Return updated tokens
            finalResponse.put('access_token', newAccessToken);
            finalResponse.put('refresh_token', newRefreshToken);
            
            // Return all invoices data
            Map<String, Object> invoicesWrapper = new Map<String, Object>();
            invoicesWrapper.put('Items', allInvoices);
            invoicesWrapper.put('Count', allInvoices.size());
            invoicesWrapper.put('TotalPages', currentPage + 1);
            invoicesWrapper.put('PageSize', pageSize);
            
            finalResponse.put('invoices', invoicesWrapper);
            finalResponse.put('success', true);
            finalResponse.put('total_records', allInvoices.size());
            
            System.debug('✅ Returning ' + allInvoices.size() + ' invoices to JavaScript');

            return JSON.serialize(finalResponse); } catch (Exception e) { Map<String, Object> errorResponse = new Map<String, Object>(); errorResponse.put('success', false); errorResponse.put('error', e.getMessage()); errorResponse.put('access_token', accessToken); errorResponse.put('refresh_token', refreshToken); return JSON.serialize(errorResponse);
        }
    }

    private static Map<String, Object> buildResponse(
        Boolean success,
        String message,
        String accessToken,
        String refreshToken,
        Object data,
        Integer categoriesUpdated,
        Integer categoriesAdded
    ) {
        return new Map<String, Object>{
            'success' => success,
            'message' => message,
            'accessToken' => accessToken,
            'refreshToken' => refreshToken,
            'data' => data,
            'categoriesUpdated' => categoriesUpdated,
            'categoriesAdded' => categoriesAdded
        };
    }

}