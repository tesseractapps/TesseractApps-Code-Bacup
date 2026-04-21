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
                    hrefLink = 'https://secure.myob.com' + hrefLink;
                }
            System.debug('✅ Extracted hrefLink: ' + hrefLink);
                return authUrl;
            } else {
                System.debug('⚠️ Could not extract href link. Returning null.');
                return null;
            }

        } catch (Exception e) {
            System.debug('❌ Exception in getMyobAuthLink: ' + e.getMessage());
            return null;
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
            return res.getBody();

        } catch (Exception e) {
            System.debug('❌ Exception in exchangeMyobCodeForToken: ' + e.getMessage());
            return '{"error":"'+e.getMessage()+'"}';
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

            return res.getBody();

        } catch (Exception e) {
            System.debug('❌ Error refreshing token: ' + e.getMessage());
            return null;
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
                SELECT Id, First_Name__c, Email__c, Contact__c, ABN__c,
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

            payload.put('CompanyName', entityRec.First_Name__c);
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

            System.debug('🚀 createMyobInvoice START');
            System.debug('InvoiceId → ' + invoiceId);
            System.debug('CompanyFileUri → ' + companyFileUri);

            // 1️⃣ Fetch Organisation API Key
            User currentUser = [
                SELECT Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            Organisation__c orgRec = [
                SELECT Client_Id__c
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];

            String apiKey = orgRec.Client_Id__c;

            /* ------------------------------------------------------
            * 2️⃣ Refresh Token
            ------------------------------------------------------ */
            System.debug('🔄 Refreshing MYOB Token...');
            String refreshResponse = refreshMyobToken(refreshToken);

            if (String.isBlank(refreshResponse)) {throw new AuraHandledException('MYOB Token refresh failed.');
            }

            Map<String,Object> refreshed = (Map<String,Object>) JSON.deserializeUntyped(refreshResponse);
            String newAccessToken  = (String) refreshed.get('access_token');
            String newRefreshToken = (String) refreshed.get('refresh_token');

            System.debug('🆕 Access Token = ' + newAccessToken);
            System.debug('🆕 Refresh Token = ' + newRefreshToken);

            /* ------------------------------------------------------
            * 3️⃣ Make cftoken
            ------------------------------------------------------ */
            String cfUsername = 'Administrator';
            String cfPassword = '';
            String cftoken = EncodingUtil.base64Encode(Blob.valueOf(cfUsername + ':' + cfPassword));

            Http http = new Http();


            /* ------------------------------------------------------
            * 4️⃣ Fetch TAX CODES (FRE / GST)
            ------------------------------------------------------ */
            HttpRequest taxReq = new HttpRequest();
            taxReq.setEndpoint(companyFileUri + '/GeneralLedger/TaxCode');
            taxReq.setMethod('GET');
            taxReq.setHeader('Authorization', 'Bearer ' + newAccessToken);
            taxReq.setHeader('x-myobapi-key', apiKey);
            taxReq.setHeader('x-myobapi-version', 'v2');
            taxReq.setHeader('x-myobapi-cftoken', cftoken);
            taxReq.setHeader('Accept', 'application/json');

            HttpResponse taxRes = http.send(taxReq);

            Map<String, Object> taxMap = (Map<String, Object>) JSON.deserializeUntyped(taxRes.getBody());
            List<Object> taxItems = (List<Object>) taxMap.get('Items');

            String taxCodeUid = null;

            for (Object o : taxItems) {
                Map<String,Object> t = (Map<String,Object>) o;
                if ((String)t.get('Code') == 'FRE') {taxCodeUid = (String)t.get('UID');break;
                }
            }

            if (taxCodeUid == null) {
                for (Object o : taxItems) {
                    Map<String,Object> t = (Map<String,Object>) o;
                    if ((String)t.get('Code') == 'GST') {
                        taxCodeUid = (String)t.get('UID');
                        break;
                    }
                }
            }


            /* ------------------------------------------------------
            * 5️⃣ Fetch INCOME ACCOUNT UID
            ------------------------------------------------------ */
            HttpRequest accReq = new HttpRequest();
            accReq.setEndpoint(companyFileUri + '/GeneralLedger/Account');
            accReq.setMethod('GET');
            accReq.setHeader('Authorization', 'Bearer ' + newAccessToken);
            accReq.setHeader('x-myobapi-key', apiKey);
            accReq.setHeader('x-myobapi-version', 'v2');
            accReq.setHeader('x-myobapi-cftoken', cftoken);
            accReq.setHeader('Accept', 'application/json');

            HttpResponse accRes = http.send(accReq);

            Map<String, Object> accMap = (Map<String, Object>) JSON.deserializeUntyped(accRes.getBody());
            List<Object> accItems = (List<Object>) accMap.get('Items');

            String accountUid = null;

            for (Object o : accItems) {
                Map<String, Object> a = (Map<String, Object>) o;
                if (((String)a.get('Name')).contains('Service')) {
                    accountUid = (String)a.get('UID');
                    break;
                }
            }


            /* ------------------------------------------------------
            * 6️⃣ Fetch Salesforce Invoice & Lines
            ------------------------------------------------------ */
            Xero_or_Myob_Invoice__c inv = [
                SELECT Id, Name, Invoice_Date__c, Total_Amount__c, 
                    Xero_Entity__r.Xero_Contact_Id__c,
                    (SELECT Description__c, Quantity__c, Unit_Price__c, Total_Amount__c 
                    FROM Xero_Invoice_Entries__r)
                FROM Xero_or_Myob_Invoice__c
                WHERE Id = :invoiceId
                LIMIT 1
            ];

            // Build MYOB Line Items
            List<Object> lineItems = new List<Object>();

            String matchDescription = inv.Xero_Invoice_Entries__r[0].Description__c;

            for (Xero_Invoice_Entries__c e : inv.Xero_Invoice_Entries__r) {
                lineItems.add(new Map<String,Object>{
                    'Description' => e.Description__c,
                    'Total'       => e.Total_Amount__c,
                    'UnitPrice'   => e.Unit_Price__c,
                    'Quantity'    => e.Quantity__c,
                    'Account'     => new Map<String,Object>{'UID' => accountUid},
                    'TaxCode'     => new Map<String,Object>{'UID' => taxCodeUid}
                });
            }


            /* ------------------------------------------------------
            * 7️⃣ POST INVOICE TO MYOB (CREATE)
            ------------------------------------------------------ */
            Map<String,Object> invoiceBody = new Map<String,Object>{
                'Customer'      => new Map<String,Object>{'UID' => inv.Xero_Entity__r.Xero_Contact_Id__c},
                'Date'          => String.valueOf(inv.Invoice_Date__c),
                'TotalAmount'   => inv.Total_Amount__c,
                'InvoiceNumber' => inv.Name,
                'Lines'         => lineItems
            };

            HttpRequest req = new HttpRequest();
            req.setEndpoint(companyFileUri + '/Sale/Invoice/Service');
            req.setMethod('POST');
            req.setHeader('Authorization', 'Bearer ' + newAccessToken);
            req.setHeader('x-myobapi-key', apiKey);
            req.setHeader('x-myobapi-version', 'v2');
            req.setHeader('x-myobapi-cftoken', cftoken);
            req.setHeader('Content-Type', 'application/json');
            req.setBody(JSON.serialize(invoiceBody));

            HttpResponse res = http.send(req);

            System.debug('📩 Create Invoice Response → ' + res.getBody());


            /* ------------------------------------------------------
            * 8️⃣ FIND THE INVOICE IN MYOB — MATCH BY DESCRIPTION
            ------------------------------------------------------ */
            HttpRequest getReq = new HttpRequest();
            getReq.setEndpoint(companyFileUri + '/Sale/Invoice/Service');
            getReq.setMethod('GET');
            getReq.setHeader('Authorization', 'Bearer ' + newAccessToken);
            getReq.setHeader('x-myobapi-key', apiKey);
            getReq.setHeader('x-myobapi-version', 'v2');
            getReq.setHeader('x-myobapi-cftoken', cftoken);
            getReq.setHeader('Accept', 'application/json');

            HttpResponse getRes = http.send(getReq);

            Map<String,Object> getMap = (Map<String,Object>) JSON.deserializeUntyped(getRes.getBody());
            List<Object> invoices = (List<Object>) getMap.get('Items');

            String matchedUid = null;


            for (Object o : invoices) {
                Map<String,Object> m = (Map<String,Object>) o;

                List<Object> lines = (List<Object>) m.get('Lines');
                if (lines != null) {for (Object lineObj : lines) {Map<String,Object> line = (Map<String,Object>) lineObj;if (((String) line.get('Description')).contains(matchDescription)) {matchedUid = (String) m.get('UID');break;
                        }
                    }
                }
                if (matchedUid != null) break;
            }

            if (matchedUid == null) matchedUid = 'NOT-FOUND';

            // Save UID
            update new Xero_or_Myob_Invoice__c(
                Id = invoiceId,
                Xero_Innvoice_Id__c = matchedUid
            );

            System.debug('✅ Final MYOB UID Saved → ' + matchedUid);


            /* ------------------------------------------------------
            * 9️⃣ FINAL RETURN WRAPPER (YOUR REQUEST)
            ------------------------------------------------------ */
            Map<String,Object> result = new Map<String,Object>();
            result.put('access_token', newAccessToken);
            result.put('refresh_token', newRefreshToken);
            result.put('message', 'Invoice created & matched in MYOB → UID: ' + matchedUid);

            return JSON.serialize(result);

        } catch (Exception ex) {

            System.debug('💥 Error createMyobInvoice: ' + ex.getMessage());
            throw new AuraHandledException(ex.getMessage());
        }
    }

    
    ///------------------------------------------------------------------------

    @AuraEnabled
    public static Map<String, Object> createMyobTimesheet(
        String staffId,
        String startDateStr,
        String endDateStr,
        String accessToken,
        String refreshToken,
        String companyFileUri
    ) {

        System.debug('================== 🟦 MYOB Timesheet Submit START ==================');
        System.debug('Input Parameters - staffId: ' + staffId + ', startDate: ' + startDateStr + ', endDate: ' + endDateStr);

        // ---------------------------------------------------------
        // STEP 1 — Convert Date Strings
        // ---------------------------------------------------------
        Date startDate = Date.valueOf(startDateStr);
        Date endDate   = Date.valueOf(endDateStr);

        // ---------------------------------------------------------
        // STEP 2 — Fetch Staff Record
        // ---------------------------------------------------------
        Staff__c staff = [
            SELECT Id, Xero_Employee_ID__c, Name
            FROM Staff__c
            WHERE Id = :staffId
            LIMIT 1
        ];

        if (staff.Xero_Employee_ID__c == null) {
            throw new AuraHandledException('Staff does not have MYOB Employee UID.');
        }

        String employeeUid = staff.Xero_Employee_ID__c;

        // ---------------------------------------------------------
        // STEP 3 — Refresh MYOB Token
        // ---------------------------------------------------------
        Map<String, Object> refreshed =
            (Map<String, Object>) JSON.deserializeUntyped(
                refreshMyobToken(refreshToken)
            );

        String newAccessToken  = (String) refreshed.get('access_token');
        String newRefreshToken = (String) refreshed.get('refresh_token');

        // ---------------------------------------------------------
        // STEP 4 — Fetch Payroll Categories
        // ---------------------------------------------------------
        String payrollCategoryResponse =
            getPayrollCategories(companyFileUri, newAccessToken);

        if (String.isBlank(payrollCategoryResponse)) {
            throw new AuraHandledException('Unable to fetch MYOB Payroll Categories.');
        }

        Map<String, Object> payrollJson =
            (Map<String, Object>) JSON.deserializeUntyped(payrollCategoryResponse);

        List<Object> payrollItems =
            (List<Object>) payrollJson.get('Items');

        // ---------------------------------------------------------
        // STEP 5 — Fetch Approved Shifts
        // ---------------------------------------------------------
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

        if (shifts.isEmpty()) {
            throw new AuraHandledException('No approved shifts found for selected period.');
        }

        System.debug('📊 Found ' + shifts.size() + ' approved shifts');

        // ---------------------------------------------------------
        // STEP 6 — Identify Required Wage Categories and their Rates
        // ---------------------------------------------------------
        Set<String> requiredWageUids = new Set<String>();
        Map<String, Decimal> wageCategoryRates = new Map<String, Decimal>(); // Map UID to rate
        Map<String, String> wageCategoryNames = new Map<String, String>(); // For debugging

        // Variables for broken shift weighted average
        Decimal totalBrokenPay = 0;
        Decimal totalBrokenHours = 0;
        String brokenShiftUid = null;
        String brokenShiftName = null;

        for (ShiftwithStaff__c s : shifts) {

            String categoryToMatch;
            String matchedUid;
            String matchedName;

            // =====================================================
            // 🔴 HANDLE BROKEN SHIFTS DIFFERENTLY
            // =====================================================
            if (s.Broken_Shift__c == true) {
                categoryToMatch = 'broken shift';
                matchedUid = findWageCategoryUid(categoryToMatch, payrollItems);
                matchedName = getWageCategoryName(categoryToMatch, payrollItems);
                
                if (matchedUid != null) {
                    requiredWageUids.add(matchedUid);
                    
                    if (matchedName != null) {
                        wageCategoryNames.put(matchedUid, matchedName);
                        brokenShiftName = matchedName;
                        brokenShiftUid = matchedUid;
                    }
                    
                    // Use Broken_Rate_Per_Hrs__c for broken shifts
                    Decimal rate = s.Broken_Rate_Per_Hrs__c != null ? s.Broken_Rate_Per_Hrs__c : 0;
                    Decimal duration = s.Broken_Total_Duration__c != null ? s.Broken_Total_Duration__c : 0;
                    
                    totalBrokenPay += rate * duration;
                    totalBrokenHours += duration;
                    
                    System.debug('🔴 Broken Shift: Rate=' + rate + 
                                ', Hours=' + duration + 
                                ', Pay=' + (rate * duration));
                }
                
                continue; // Skip regular processing
            }
            
            // =====================================================
            // 🟢 REGULAR SHIFT PROCESSING
            // =====================================================
            categoryToMatch = s.Shift_Category__c != null
                ? s.Shift_Category__c.trim().toLowerCase()
                : '';

            system.debug('categoryToMatch >>>>>>'+ categoryToMatch);

            matchedUid = findWageCategoryUid(categoryToMatch, payrollItems);
            matchedName = getWageCategoryName(categoryToMatch, payrollItems);

            if (matchedUid != null) {

                requiredWageUids.add(matchedUid);
                
                if (matchedName != null) {
                    wageCategoryNames.put(matchedUid, matchedName);
                }

                System.debug('s.Custom_Rate_Per_Hrs__c >>>>>> ' + s.Custom_Rate_Per_Hrs__c);
                System.debug('s.Staff_Hourly_Rate__c >>>>>> ' + s.Staff_Hourly_Rate__c);

                // Decide Which Rate To Use for regular shifts
                // Priority: 1️⃣ Custom_Rate_Per_Hrs__c (if > 0) 2️⃣ Staff_Hourly_Rate__c
                Decimal rateToUse;

                if (s.Custom_Rate_Per_Hrs__c != null && s.Custom_Rate_Per_Hrs__c > 0) {
                    rateToUse = s.Custom_Rate_Per_Hrs__c;
                } else {
                    rateToUse = s.Staff_Hourly_Rate__c;
                }

                // Store Rate Safely
                if (rateToUse != null && rateToUse > 0) {

                    if (!wageCategoryRates.containsKey(matchedUid)) {

                        // First time storing this UID
                        wageCategoryRates.put(matchedUid, rateToUse);
                        System.debug('💰 Stored Initial Rate for UID ' + matchedUid + 
                                    ' (' + matchedName + '): ' + rateToUse);

                    } else {

                        Decimal existingRate = wageCategoryRates.get(matchedUid);

                        // If different rate detected, keep highest (safe for payroll)
                        if (existingRate != rateToUse) {

                            System.debug('⚠ Different rate detected for same Payroll UID.');
                            System.debug('Existing Rate: ' + existingRate);
                            System.debug('New Rate: ' + rateToUse);

                            Decimal finalRate = Math.max(existingRate, rateToUse);
                            wageCategoryRates.put(matchedUid, finalRate);

                            System.debug('💰 Updated to Higher Rate: ' + finalRate);
                        }
                    }
                } else {
                    System.debug('⚠ No valid rate found for UID ' + matchedUid);
                }
            } else {
                System.debug('❌ No matching Wage Category found for: ' + categoryToMatch);
            }
        }

        // =====================================================
        // 🔴 ADD BROKEN SHIFT WEIGHTED AVERAGE RATE
        // =====================================================
        if (totalBrokenHours > 0 && brokenShiftUid != null) {
            Decimal avgBrokenRate = (totalBrokenPay / totalBrokenHours).setScale(2);
            wageCategoryRates.put(brokenShiftUid, avgBrokenRate);
            
            System.debug('🩵 Broken Shift Weighted Average: $' + avgBrokenRate + 
                        ' per hour (Total Pay: $' + totalBrokenPay + 
                        ' / Total Hours: ' + totalBrokenHours + ')');
        }

        System.debug('📌 Required Wage UIDs: ' + requiredWageUids);
        System.debug('💰 Final Rates to Apply: ' + wageCategoryRates);

        // ---------------------------------------------------------
        // STEP 7 — Fetch Employee Payroll Details
        // ---------------------------------------------------------
        Map<String, Object> epd = getEmployeePayrollDetails(companyFileUri, newAccessToken, employeeUid);
        
        if (epd == null || epd.isEmpty()) {
            throw new AuraHandledException('Could not fetch Employee Payroll Details.');
        }

        String epdUid = (String) epd.get('UID');
        
        // ---------------------------------------------------------
        // STEP 8 — Update Wage Categories with their Rates
        // ---------------------------------------------------------
        Map<String, Object> wage = (Map<String, Object>) epd.get('Wage');
        Boolean updated = false;
        Integer categoriesAdded = 0;
        Integer categoriesUpdated = 0;

        if (wage != null) {

            // =====================================================
            // 1️⃣ Handle WageCategoryHourlyDetails (for rates)
            // =====================================================
            List<Object> hourlyDetails = (List<Object>) wage.get('WageCategoryHourlyDetails');

            if (hourlyDetails == null) {
                hourlyDetails = new List<Object>();
                wage.put('WageCategoryHourlyDetails', hourlyDetails);
            }

            // Build existing map for hourly details
            Map<String, Map<String, Object>> existingHourlyMap = new Map<String, Map<String, Object>>();

            for (Object obj : hourlyDetails) {
                Map<String, Object> w = (Map<String, Object>) obj;
                Map<String, Object> wageCat = (Map<String, Object>) w.get('WageCategory');

                if (wageCat != null) {
                    String existingUid = (String) wageCat.get('UID');
                    if (existingUid != null) {
                        existingHourlyMap.put(existingUid, w);
                    }
                }
            }

            // =====================================================
            // 2️⃣ Handle WageCategories (REQUIRED for timesheet)
            // =====================================================
            List<Object> wageCategories = (List<Object>) wage.get('WageCategories');
            
            if (wageCategories == null) {
                wageCategories = new List<Object>();
                wage.put('WageCategories', wageCategories);
            }

            // Build existing UID set for WageCategories
            Set<String> existingWageCatUids = new Set<String>();
            for (Object obj : wageCategories) {
                Map<String, Object> w = (Map<String, Object>) obj;
                String uid = (String) w.get('UID');
                if (uid != null) {
                    existingWageCatUids.add(uid);
                }
            }

            // =====================================================
            // 3️⃣ Process all required categories
            // =====================================================
            for (String uid : wageCategoryRates.keySet()) {

                Decimal newRate = wageCategoryRates.get(uid);
                String categoryName = wageCategoryNames.containsKey(uid) ? wageCategoryNames.get(uid) : 'Unknown';

                // ---------------------------------------------
                // Update WageCategoryHourlyDetails (for rates)
                // ---------------------------------------------
                if (existingHourlyMap.containsKey(uid)) {
                    // Update existing entry
                    Map<String, Object> existingEntry = existingHourlyMap.get(uid);
                    Decimal currentRate = (Decimal) existingEntry.get('HourlyRate');

                    if (currentRate == null || currentRate != newRate) {
                        existingEntry.put('HourlyRate', newRate);
                        updated = true;
                        categoriesUpdated++;
                        System.debug('🔄 Updated rate in HourlyDetails for ' + categoryName + ' → ' + newRate);
                    }
                } else {
                    // Add new entry to hourly details
                    Map<String, Object> newEntry = new Map<String, Object>();
                    newEntry.put('WageCategory', new Map<String, Object>{ 'UID' => uid });
                    newEntry.put('HourlyRate', newRate);
                    hourlyDetails.add(newEntry);
                    updated = true;
                    categoriesAdded++;
                    System.debug('➕ Added to HourlyDetails → ' + categoryName + ' : ' + newRate);
                }

                // ---------------------------------------------
                // Update WageCategories (REQUIRED for timesheet)
                // ---------------------------------------------
                if (!existingWageCatUids.contains(uid)) {
                    // Add to WageCategories (simple UID object)
                    Map<String, Object> newWageCat = new Map<String, Object>();
                    newWageCat.put('UID', uid);
                    wageCategories.add(newWageCat);
                    updated = true;
                    System.debug('➕ Added to WageCategories → ' + categoryName + ' (UID: ' + uid + ')');
                } else {
                    System.debug('✅ Already exists in WageCategories → ' + categoryName);
                }
            }
        }
        // ---------------------------------------------------------
        // STEP 9 — Perform PUT Update if changes were made
        // ---------------------------------------------------------
        if (updated) {
            System.debug('📤 Updating Employee Payroll Details...');
            System.debug('Categories Added: ' + categoriesAdded + ', Updated: ' + categoriesUpdated);
            
            try {
                putEmployeePayrollDetails(companyFileUri, newAccessToken, epdUid, epd);
                System.debug('✅ Successfully updated ' + (categoriesAdded + categoriesUpdated) + 
                            ' wage categories in MYOB');
                
                // 🔴 ADD THIS: Verify categories are assigned before proceeding
                System.debug('🔍 Verifying wage categories are now assigned in MYOB...');
                
                Boolean verified = verifyWageCategoriesAssigned(
                    companyFileUri,
                    newAccessToken,
                    employeeUid,
                    requiredWageUids,
                    5  // Try 5 times with 1-second intervals
                );
                
                if (!verified) {
                    System.debug('⚠️ Could not verify all categories, but proceeding anyway...');
                    // You can decide whether to throw an error or continue
                    // throw new AuraHandledException('Failed to verify wage categories in MYOB');
                }
                
            } catch (Exception e) {
                System.debug('❌ Failed to update Employee Payroll Details: ' + e.getMessage());
                throw new AuraHandledException('Failed to update wage category rates: ' + e.getMessage());
            }
        } else {
            System.debug('ℹ️ No rate updates needed - all wage categories already have correct rates');
        }

        // ---------------------------------------------------------
        // STEP 10 — Insert MYOB Timesheet
        // ---------------------------------------------------------
        System.debug('📝 Proceeding to insert timesheet...');
        
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

        // ---------------------------------------------------------
        // STEP 11 — Return Result
        // ---------------------------------------------------------
        Map<String, Object> resultMap = new Map<String, Object>();
        resultMap.put('accessToken', newAccessToken);
        resultMap.put('refreshToken', newRefreshToken);
        resultMap.put('timesheetResponse', timesheetResponse);
        resultMap.put('categoriesUpdated', categoriesUpdated);
        resultMap.put('categoriesAdded', categoriesAdded);

        System.debug('================== 🟢 MYOB Timesheet Submit END ==================');
        System.debug('Result: ' + JSON.serialize(resultMap));

        return resultMap;
    }

    // Add this helper method to get category names for better debugging
    public static String getWageCategoryName(String shiftCategory, List<Object> items) {
        if (items == null || String.isBlank(shiftCategory)) {
            return null;
        }
        
        for (Object obj : items) {
            Map<String, Object> cat = (Map<String, Object>) obj;
            String name = (String) cat.get('Name');
            String uid  = (String) cat.get('UID');
            
            if (name != null && name.toLowerCase().contains(shiftCategory.toLowerCase())) {
                return name;
            }
        }
        
        return null;
    }

    public static String getPayrollCategories(String companyFileUri, String newAccessToken) {

        System.debug('================ 🟦 GET PAYROLL CATEGORIES START ================');

        // ---------------------------------------------------------
        // STEP 1 — Generate Company File Token (CF Token)
        // MYOB requires a base64 encoded "username:"
        // ---------------------------------------------------------
        System.debug('🔐 STEP 1: Generating Company File Token (CF Token)...');

        String cftoken = EncodingUtil.base64Encode(Blob.valueOf('Administrator:'));

        // Log only first 25 chars for security
        Integer len = Math.min(25, cftoken.length());
        System.debug('🔐 CF Token (partial): ' + cftoken.substring(0, len) + '...');


        // ---------------------------------------------------------
        // STEP 2 — Get Current User Organisation
        // Used to fetch MYOB Client ID
        // ---------------------------------------------------------
        System.debug('👤 STEP 2: Fetching logged-in User Organisation...');

        User u = [
            SELECT Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        System.debug('User Organisation Name: ' + u.Organization_Name__c);


        // ---------------------------------------------------------
        // STEP 3 — Fetch Organisation Record (Client ID)
        // Client_Id__c = MYOB API Key
        // ---------------------------------------------------------
        System.debug('🏢 STEP 3: Fetching Organisation Client ID...');

        Organisation__c org = [
            SELECT Client_Id__c
            FROM Organisation__c
            WHERE Name = :u.Organization_Name__c
            LIMIT 1
        ];

        String clientId = org.Client_Id__c;

        System.debug('Client ID Retrieved Successfully');


        // ---------------------------------------------------------
        // STEP 4 — Build MYOB Endpoint
        // This endpoint returns Wage Payroll Categories
        // ---------------------------------------------------------
        String endpoint = companyFileUri + '/Payroll/PayrollCategory/Wage';

        System.debug('🌐 STEP 4: Endpoint → ' + endpoint);


        // ---------------------------------------------------------
        // STEP 5 — Prepare HTTP Request
        // ---------------------------------------------------------
        System.debug('📡 STEP 5: Preparing HTTP GET Request...');

        HttpRequest req = new HttpRequest();
        req.setEndpoint(endpoint);
        req.setMethod('GET');

        // Required MYOB headers
        req.setHeader('Authorization', 'Bearer ' + newAccessToken);
        req.setHeader('x-myobapi-key', clientId);
        req.setHeader('x-myobapi-version', 'v2');
        req.setHeader('x-myobapi-cftoken', cftoken);
        req.setHeader('Accept', 'application/json');

        System.debug('Headers Set Successfully');


        // ---------------------------------------------------------
        // STEP 6 — Send Request to MYOB
        // ---------------------------------------------------------
        try {
            System.debug('🚀 Sending request to MYOB...');

            Http http = new Http();
            HttpResponse res = http.send(req);

            System.debug('🔵 Response Status Code: ' + res.getStatusCode());

            // Log only first 1000 chars to avoid huge logs
            String responseBody = res.getBody();
            if (responseBody != null) {
                System.debug('🔵 Response Body (partial): ' + responseBody);
            }

            // ---------------------------------------------------------
            // STEP 7 — Handle Success / Failure
            // ---------------------------------------------------------
            if (res.getStatusCode() == 200) {

                System.debug('✅ Payroll Categories Retrieved Successfully');
                System.debug('================ 🟢 GET PAYROLL CATEGORIES END ================');
                return res.getBody();

            } else {

                System.debug('❌ MYOB API Error: ' + res.getStatus());
                System.debug('================ 🔴 GET PAYROLL CATEGORIES FAILED ================');
                return null;
            }

        } catch (Exception e) {

            System.debug('💥 Exception While Calling MYOB: ' + e.getMessage());
            System.debug('================ 🔴 GET PAYROLL CATEGORIES EXCEPTION ================');

            throw new AuraHandledException('Payroll category error: ' + e.getMessage());
        }
    }

    public static String findWageCategoryUid(String shiftCategory, List<Object> items) {

        System.debug('=========== 🟦 FIND WAGE CATEGORY START ===========');
        System.debug('Shift Category to Match: ' + shiftCategory);

        // ---------------------------------------------------------
        // STEP 1 — Validate Inputs
        // ---------------------------------------------------------
        if (items == null) {
            System.debug('⚠ Payroll Items list is NULL');
            System.debug('=========== 🔴 FIND WAGE CATEGORY END (NULL ITEMS) ===========');
                return null;
        }

        if (String.isBlank(shiftCategory)) {
            System.debug('⚠ Shift Category is NULL or Blank');
            System.debug('=========== 🔴 FIND WAGE CATEGORY END (BLANK CATEGORY) ===========');
            return null;
        }

        System.debug('Total Payroll Categories Available: ' + items.size());

        // ---------------------------------------------------------
        // STEP 2 — Loop Through Payroll Categories
        // ---------------------------------------------------------
        for (Object obj : items) {

            Map<String, Object> cat = (Map<String, Object>) obj;

            String name = (String) cat.get('Name');
            String uid  = (String) cat.get('UID');

            System.debug('Checking Category → Name: ' + name + ', UID: ' + uid);

            // ---------------------------------------------------------
            // STEP 3 — Case-Insensitive Match
            // Using contains() for flexible matching
            // ---------------------------------------------------------
            if (name != null &&
                name.toLowerCase().contains(shiftCategory.toLowerCase())) {

                System.debug('✅ MATCH FOUND');
                System.debug('Matched Shift Category: ' + shiftCategory);
                System.debug('Matched Payroll Category Name: ' + name);
                System.debug('Returning UID: ' + uid);
                System.debug('=========== 🟢 FIND WAGE CATEGORY END (FOUND) ===========');

                return uid;
            }
        }

        // ---------------------------------------------------------
        // STEP 4 — No Match Found
        // ---------------------------------------------------------
        System.debug('❌ No matching Wage Category found for: ' + shiftCategory);
        System.debug('=========== 🟡 FIND WAGE CATEGORY END (NOT FOUND) ===========');

        return null;
    }

    public static Map<String, Object> updateEmployeePayrollDetailsWithWageCategory(
        String companyFileUri,
        String accessToken,
        String employeeUid,
        String wageCategoryUid
    ) {

        System.debug('================== 🟧 UPDATE EmployeePayrollDetails START ==================');
        System.debug('Input → Employee UID: ' + employeeUid);
        System.debug('Input → Wage Category UID: ' + wageCategoryUid);
        System.debug('Input → Company File URI: ' + companyFileUri);

        // ---------------------------------------------------------
        // STEP 1 — Fetch EmployeePayrollDetails
        // ---------------------------------------------------------
        System.debug('📥 STEP 1: Fetching EmployeePayrollDetails...');

        Map<String, Object> epd =
            getEmployeePayrollDetails(companyFileUri, accessToken, employeeUid);

        if (epd == null || epd.isEmpty()) {
            System.debug('❌ EmployeePayrollDetails not found.');
            throw new AuraHandledException(
                'EmployeePayrollDetails not found for employee.'
            );
        }

        String epdUid = (String) epd.get('UID');
        System.debug('📄 EmployeePayrollDetails UID: ' + epdUid);

        // ---------------------------------------------------------
        // STEP 2 — Extract Wage Section
        // ---------------------------------------------------------
        System.debug('🔍 STEP 2: Extracting Wage Section...');

        Map<String, Object> wage = (Map<String, Object>) epd.get('Wage');

        if (wage == null) {
            System.debug('❌ Wage section missing in EmployeePayrollDetails.');
            throw new AuraHandledException(
                'EmployeePayrollDetails missing Wage section.'
            );
        }

        // ---------------------------------------------------------
        // STEP 3 — Handle Both Field Types (WageCategories and WageCategoryHourlyDetails)
        // ---------------------------------------------------------
        System.debug('📋 STEP 3: Checking both field types...');
        
        // Check WageCategories field first (primary for timesheet assignment)
        List<Object> wageCategories = (List<Object>) wage.get('WageCategories');
        Boolean usedWageCategories = true;
        
        if (wageCategories == null) {
            // Fall back to WageCategoryHourlyDetails
            wageCategories = (List<Object>) wage.get('WageCategoryHourlyDetails');
            usedWageCategories = false;
            System.debug('⚠ Using WageCategoryHourlyDetails field as fallback');
        }
        
        if (wageCategories == null) {
            System.debug('⚠ Both WageCategories and WageCategoryHourlyDetails are null. Initializing WageCategories.');
            wageCategories = new List<Object>();
            wage.put('WageCategories', wageCategories);
            usedWageCategories = true;
        }

        System.debug('Current Wage Categories Count: ' + wageCategories.size());

        // ---------------------------------------------------------
        // STEP 4 — Check if Wage Category Already Assigned (in either format)
        // ---------------------------------------------------------
        System.debug('🔎 STEP 4: Checking if Wage Category already exists...');

        Boolean exists = false;
        Map<String, Object> existingEntry = null;

        for (Object o : wageCategories) {
            Map<String, Object> w = (Map<String, Object>) o;
            
            // Check different possible structures
            String existingUid = null;
            
            // Structure 1: Direct UID field
            if (w.containsKey('UID')) {
                existingUid = (String) w.get('UID');
            }
            // Structure 2: Nested WageCategory object
            else if (w.containsKey('WageCategory')) {
                Map<String, Object> wageCat = (Map<String, Object>) w.get('WageCategory');
                if (wageCat != null) {
                    existingUid = (String) wageCat.get('UID');
                }
            }
            
            System.debug('Checking Existing Entry - UID: ' + existingUid);

            if (existingUid != null && existingUid.equals(wageCategoryUid)) {
                exists = true;
                existingEntry = w;
                System.debug('✅ Found existing entry with matching UID');
                break;
            }
        }

        if (exists) {
            System.debug('🟩 Wage Category already assigned — No PUT required.');
            System.debug('================== 🟢 UPDATE EmployeePayrollDetails END (NO UPDATE) ==================');
            return epd;
        }

        // ---------------------------------------------------------
        // STEP 5 — Add New Wage Category to WageCategories
        // ---------------------------------------------------------
        System.debug('➕ STEP 5: Adding Missing Wage Category UID: ' + wageCategoryUid + ' to WageCategories');

        // Create proper structure for WageCategories (simple UID object)
        Map<String, Object> newCat = new Map<String, Object>();
        newCat.put('UID', wageCategoryUid);
        wageCategories.add(newCat);

        System.debug('Updated WageCategories Count: ' + wageCategories.size());

        // ---------------------------------------------------------
        // STEP 6 — Also add to WageCategoryHourlyDetails for consistency
        // ---------------------------------------------------------
        System.debug('📋 STEP 6: Ensuring WageCategoryHourlyDetails is also updated...');
        
        List<Object> hourlyDetails = (List<Object>) wage.get('WageCategoryHourlyDetails');
        if (hourlyDetails == null) {
            hourlyDetails = new List<Object>();
            wage.put('WageCategoryHourlyDetails', hourlyDetails);
        }
        
        // Check if it exists in hourly details
        Boolean existsInHourly = false;
        for (Object obj : hourlyDetails) {
            Map<String, Object> h = (Map<String, Object>) obj;
            
            // Check direct UID
            if (h.containsKey('UID') && h.get('UID') == wageCategoryUid) {
                existsInHourly = true;
                break;
            }
            
            // Check nested WageCategory
            if (h.containsKey('WageCategory')) {
                Map<String, Object> cat = (Map<String, Object>) h.get('WageCategory');
                if (cat != null && cat.get('UID') == wageCategoryUid) {
                    existsInHourly = true;
                    break;
                }
            }
        }
        
        if (!existsInHourly) {
            Map<String, Object> newHourly = new Map<String, Object>();
            newHourly.put('WageCategory', new Map<String, Object>{ 'UID' => wageCategoryUid });
            hourlyDetails.add(newHourly);
            System.debug('➕ Added to WageCategoryHourlyDetails for consistency');
        }

        // ---------------------------------------------------------
        // STEP 7 — Prepare PUT Request
        // ---------------------------------------------------------
        System.debug('📤 STEP 7: Preparing PUT request to update MYOB...');

        String cftoken = EncodingUtil.base64Encode(Blob.valueOf('Administrator:'));
        Integer tokenLen = Math.min(25, cftoken.length());
        System.debug('CF Token (partial): ' + cftoken.substring(0, tokenLen) + '...');

        User u = [
            SELECT Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        Organisation__c org = [
            SELECT Client_Id__c
            FROM Organisation__c
            WHERE Name = :u.Organization_Name__c
            LIMIT 1
        ];

        String endpoint =
            companyFileUri + '/Contact/EmployeePayrollDetails/' + epdUid;

        System.debug('🌐 PUT Endpoint: ' + endpoint);

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

        System.debug('📦 PUT Request Body (partial): ' +
            requestBody.substring(0, Math.min(1000, requestBody.length()))
        );

        // ---------------------------------------------------------
        // STEP 8 — Execute PUT Call
        // ---------------------------------------------------------
        System.debug('🚀 STEP 8: Sending PUT request to MYOB...');

        Http http = new Http();
        HttpResponse res = http.send(req);

        System.debug('🔵 PUT Response Status Code: ' + res.getStatusCode());

        String responseBody = res.getBody();
        if (responseBody != null) {
            System.debug('🔵 PUT Response Body (partial): ' +
                responseBody.substring(0, Math.min(1000, responseBody.length()))
            );
        }

        // ---------------------------------------------------------
        // STEP 9 — Validate PUT Response
        // ---------------------------------------------------------
        if (res.getStatusCode() != 200 && res.getStatusCode() != 201) {

            System.debug('❌ PUT update failed.');
            
            // Parse error message if available
            if (responseBody != null) {
                try {
                    Map<String, Object> errorJson = (Map<String, Object>) JSON.deserializeUntyped(responseBody);
                    if (errorJson.containsKey('Errors')) {
                        List<Object> errors = (List<Object>) errorJson.get('Errors');
                        for (Object errObj : errors) {
                            Map<String, Object> err = (Map<String, Object>) errObj;
                            System.debug('❌ Error: ' + err.get('Message'));
                        }
                    }
                } catch (Exception ex) {
                    System.debug('❌ Could not parse error response');
                }
            }

            throw new AuraHandledException(
                'Failed to PUT EmployeePayrollDetails: ' + res.getStatusCode()
            );
        }

        System.debug('✅ Wage Category successfully assigned in both fields.');
        System.debug('================== 🟢 UPDATE EmployeePayrollDetails SUCCESS ==================');

        return epd;
    }    

    public static void updateEmployeePayrollDetailsWithAllMissing(
        String companyFileUri,
        String accessToken,
        String employeeUid,
        Set<String> requiredWageUids
    ) {

        System.debug('==================== 🟧 UPDATE ALL MISSING WAGE CATEGORIES START ====================');
        System.debug('➡ Employee UID: ' + employeeUid);
        System.debug('➡ Required Wage UIDs: ' + requiredWageUids);
        System.debug('➡ Company File URI: ' + companyFileUri);

        // ---------------------------------------------------------
        // STEP 1 — Fetch Employee Payroll Details
        // ---------------------------------------------------------
        System.debug('📥 STEP 1: Fetching EmployeePayrollDetails...');

        Map<String, Object> epd =
            getEmployeePayrollDetails(companyFileUri, accessToken, employeeUid);

        if (epd == null || epd.isEmpty()) {
            System.debug('❌ EmployeePayrollDetails not found. Aborting update.');
            System.debug('==================== 🔴 UPDATE ALL MISSING WAGE CATEGORIES END (NO EPD) ====================');
            return;
        }

        // Log partial EPD (prevent log overflow)
        String epdJson = JSON.serialize(epd);
        System.debug('📄 EmployeePayrollDetails (partial): ' +
            epdJson.substring(0, Math.min(1000, epdJson.length()))
        );

        String epdUid = (String) epd.get('UID');
        System.debug('📄 EmployeePayrollDetails UID: ' + epdUid);

        // ---------------------------------------------------------
        // STEP 2 — Extract Wage Section
        // ---------------------------------------------------------
        System.debug('🔍 STEP 2: Extracting Wage Section...');

        Map<String, Object> wage = (Map<String, Object>) epd.get('Wage');

        if (wage == null) {
            System.debug('❌ Wage section missing in EmployeePayrollDetails.');
            System.debug('==================== 🔴 UPDATE ALL MISSING WAGE CATEGORIES END (NO WAGE SECTION) ====================');
            return;
        }

        List<Object> existingCats = (List<Object>) wage.get('WageCategories');

        if (existingCats == null) {
            System.debug('⚠ WageCategories is NULL — initializing empty list.');
            existingCats = new List<Object>();
            wage.put('WageCategories', existingCats);
        }

        System.debug('📌 Existing Wage Categories Count: ' + existingCats.size());

        // ---------------------------------------------------------
        // STEP 3 — Build Existing UID Set
        // ---------------------------------------------------------
        Set<String> existingUids = new Set<String>();

        for (Object o : existingCats) {
            Map<String, Object> w = (Map<String, Object>) o;
            String uid = (String) w.get('UID');

            if (uid != null) {
                existingUids.add(uid);
            }
        }

        System.debug('📌 Existing Wage Category UIDs: ' + existingUids);

        // ---------------------------------------------------------
        // STEP 4 — Add Missing Wage Categories
        // ---------------------------------------------------------
        System.debug('➕ STEP 4: Checking for Missing Wage Categories...');

        Boolean updated = false;

        if (requiredWageUids != null) {

            for (String uid : requiredWageUids) {

                if (!existingUids.contains(uid)) {

                    System.debug('🟧 ADDING Missing Wage Category UID: ' + uid);

                    Map<String, Object> newCat = new Map<String, Object>();
                    newCat.put('UID', uid);

                    existingCats.add(newCat);
                    updated = true;

                } else {
                    System.debug('🟩 Wage Category already exists → ' + uid);
                }
            }
        } else {
            System.debug('⚠ Required Wage UIDs set is NULL.');
        }

        System.debug('📌 Wage Categories Count After Update: ' + existingCats.size());

        if (!updated) {
            System.debug('🟩 No new wage categories added — Skipping PUT.');
            System.debug('==================== 🟢 UPDATE ALL MISSING WAGE CATEGORIES END (NO CHANGE) ====================');
            return;
        }

        // ---------------------------------------------------------
        // STEP 5 — Perform PUT Update to MYOB
        // ---------------------------------------------------------
        System.debug('📤 STEP 5: Performing PUT update to MYOB...');

        try {

            putEmployeePayrollDetails(companyFileUri, accessToken, epdUid, epd);

            System.debug('✅ PUT update completed successfully.');

        } catch (Exception ex) {

            System.debug('❌ PUT update failed: ' + ex.getMessage());
            System.debug('==================== 🔴 UPDATE ALL MISSING WAGE CATEGORIES FAILED ====================');
            throw ex;
        }

        System.debug('==================== 🟢 UPDATE ALL MISSING WAGE CATEGORIES SUCCESS ====================');
    }

    public static Map<String, Object> getEmployeePayrollDetails(
        String companyFileUri,
        String accessToken,
        String employeeUid
    ) {

        System.debug('================== 🟦 GET EmployeePayrollDetails START ==================');
        System.debug('Input → Employee UID: ' + employeeUid);
        System.debug('Input → Company File Uri: ' + companyFileUri);

        // ---------------------------------------------------------
        // STEP 1 — Generate Company File Token
        // ---------------------------------------------------------
        System.debug('🔐 STEP 1: Generating CF Token...');
        String cftoken = EncodingUtil.base64Encode(Blob.valueOf('Administrator:'));

        Integer tokenLen = Math.min(25, cftoken.length());
        System.debug('CF Token (partial): ' + cftoken.substring(0, tokenLen) + '...');

        // ---------------------------------------------------------
        // STEP 2 — Fetch MYOB Client ID from Organisation
        // ---------------------------------------------------------
        System.debug('👤 STEP 2: Fetching User Organisation...');

        User u = [
            SELECT Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        System.debug('User Organisation Name: ' + u.Organization_Name__c);

        System.debug('🏢 STEP 3: Fetching Organisation Client ID...');

        Organisation__c org = [
            SELECT Client_Id__c
            FROM Organisation__c
            WHERE Name = :u.Organization_Name__c
            LIMIT 1
        ];

        String clientId = org.Client_Id__c;

        System.debug('Client ID Retrieved Successfully');

        // ---------------------------------------------------------
        // STEP 4 — Build Endpoint
        // NOTE: Avoid $filter (causes 502 error in MYOB)
        // ---------------------------------------------------------
        String endpoint = companyFileUri + '/Contact/EmployeePayrollDetails';
        System.debug('🌐 Endpoint: ' + endpoint);

        // ---------------------------------------------------------
        // STEP 5 — Prepare HTTP Request
        // ---------------------------------------------------------
        HttpRequest req = new HttpRequest();
        req.setEndpoint(endpoint);
        req.setMethod('GET');

        req.setHeader('Authorization', 'Bearer ' + accessToken);
        req.setHeader('x-myobapi-key', clientId);
        req.setHeader('x-myobapi-version', 'v2');
        req.setHeader('x-myobapi-cftoken', cftoken);
        req.setHeader('Accept', 'application/json');

        System.debug('📡 HTTP Request Prepared Successfully');

        // ---------------------------------------------------------
        // STEP 6 — Send Request
        // ---------------------------------------------------------
        Http http = new Http();
        System.debug('🚀 Sending request to MYOB...');

        HttpResponse res = http.send(req);

        System.debug('🔵 Response Status Code: ' + res.getStatusCode());

        // Log only first 1000 chars to prevent log overflow
        String rawBody = res.getBody();
        if (rawBody != null) {
            Integer bodyLen = Math.min(1000, rawBody.length());
            System.debug('🔵 Raw Body (partial): ' + rawBody.substring(0, bodyLen));
        }

        // ---------------------------------------------------------
        // STEP 7 — Validate Response
        // ---------------------------------------------------------
        if (res.getStatusCode() != 200) {

            System.debug('❌ API Call Failed');
            System.debug('================== 🔴 GET EmployeePayrollDetails FAILED ==================');

            throw new AuraHandledException(
                'Failed to fetch EmployeePayrollDetails. Status: ' +
                res.getStatusCode()
            );
        }

        // ---------------------------------------------------------
        // STEP 8 — Parse JSON Response
        // ---------------------------------------------------------
        System.debug('📦 Parsing JSON response...');

        Map<String, Object> json =
            (Map<String, Object>) JSON.deserializeUntyped(rawBody);

        List<Object> items = (List<Object>) json.get('Items');

        if (items == null) {
            System.debug('⚠ No Items found in response.');
            throw new AuraHandledException('No EmployeePayrollDetails found.');
        }

        System.debug('🔍 Total PayrollDetail Records Retrieved: ' + items.size());

        // ---------------------------------------------------------
        // STEP 9 — Filter for Specific Employee UID
        // ---------------------------------------------------------
        System.debug('🔎 Searching for matching Employee UID...');

        for (Object o : items) {

            Map<String, Object> rec = (Map<String, Object>) o;
            Map<String, Object> emp = (Map<String, Object>) rec.get('Employee');

            if (emp != null) {

                String empUid = (String) emp.get('UID');

                System.debug('Checking Record Employee UID: ' + empUid);

                if (employeeUid != null && employeeUid.equals(empUid)) {

                    System.debug('✅ MATCH FOUND for Employee UID: ' + employeeUid);
                    System.debug('================== 🟢 GET EmployeePayrollDetails SUCCESS ==================');

                    return rec;
                }
            }
        }

        // ---------------------------------------------------------
        // STEP 10 — No Matching Record Found
        // ---------------------------------------------------------
        System.debug('❌ No EmployeePayrollDetails found for UID: ' + employeeUid);
        System.debug('================== 🔴 GET EmployeePayrollDetails NOT FOUND ==================');

        throw new AuraHandledException(
            'EmployeePayrollDetails not found for UID: ' + employeeUid
        );
    }

    public static void updateEmployeeRate(
        String companyFileUri,
        String accessToken,
        String employeeUid,
        Decimal hourlyRate
    ) {

        System.debug('==================== 🟦 UPDATE EMPLOYEE RATE START ====================');
        System.debug('➡ Employee UID: ' + employeeUid);
        System.debug('➡ New Hourly Rate: ' + hourlyRate);
        System.debug('➡ Company File URI: ' + companyFileUri);

        // ---------------------------------------------------------
        // STEP 1 — Validate Hourly Rate
        // ---------------------------------------------------------
        if (hourlyRate == null || hourlyRate <= 0) {
            System.debug('⚠ Invalid Hourly Rate provided. Skipping update.');
            System.debug('==================== 🟡 UPDATE EMPLOYEE RATE END (INVALID RATE) ====================');
            return;
        }

        // ---------------------------------------------------------
        // STEP 2 — Fetch EmployeePayrollDetails
        // ---------------------------------------------------------
        System.debug('📥 STEP 2: Fetching EmployeePayrollDetails...');

        Map<String, Object> epd =
            getEmployeePayrollDetails(companyFileUri, accessToken, employeeUid);

        if (epd == null || epd.isEmpty()) {
            System.debug('❌ EmployeePayrollDetails not found. Aborting rate update.');
            System.debug('==================== 🔴 UPDATE EMPLOYEE RATE END (NO EPD) ====================');
            return;
        }

        String epdUid = (String) epd.get('UID');
        System.debug('📄 EmployeePayrollDetails UID: ' + epdUid);

        // ---------------------------------------------------------
        // STEP 3 — Extract Wage Section
        // ---------------------------------------------------------
        System.debug('🔍 STEP 3: Extracting Wage Section...');

        Map<String, Object> wage = (Map<String, Object>) epd.get('Wage');

        if (wage == null) {
            System.debug('❌ Wage section missing in EPD.');
            System.debug('==================== 🔴 UPDATE EMPLOYEE RATE END (NO WAGE SECTION) ====================');
            return;
        }

        Decimal existingRate = (Decimal) wage.get('HourlyRate');
        System.debug('Current Hourly Rate in MYOB: ' + existingRate);

        // ---------------------------------------------------------
        // STEP 4 — Update Hourly Rate
        // ---------------------------------------------------------
        wage.put('HourlyRate', hourlyRate);

        System.debug('🟧 Updating Hourly Rate from ' +
            existingRate + ' → ' + hourlyRate);

        // Log partial payload
        String epdJson = JSON.serialize(epd);
        System.debug('📦 Updated Payload (partial): ' +
            epdJson.substring(0, Math.min(1000, epdJson.length()))
        );

        // ---------------------------------------------------------
        // STEP 5 — Perform PUT Update
        // ---------------------------------------------------------
        System.debug('📤 STEP 5: Performing PUT update to MYOB...');

        try {

            putEmployeePayrollDetails(companyFileUri, accessToken, epdUid, epd);

            System.debug('✅ Hourly Rate successfully updated.');

        } catch (Exception ex) {

            System.debug('❌ Failed to update Hourly Rate: ' + ex.getMessage());
            System.debug('==================== 🔴 UPDATE EMPLOYEE RATE FAILED ====================');
            throw ex;
        }

        System.debug('==================== 🟢 UPDATE EMPLOYEE RATE SUCCESS ====================');
    }

    public static void putEmployeePayrollDetails(
        String companyFileUri,
        String accessToken,
        String epdUid,
        Map<String, Object> epdBody
    ) {

        System.debug('==================== 🟧 PUT EmployeePayrollDetails START ====================');
        System.debug('➡ EPD UID: ' + epdUid);
        System.debug('➡ Company File URI: ' + companyFileUri);

        if (String.isBlank(epdUid) || epdBody == null) { System.debug('❌ Invalid input parameters.'); throw new AuraHandledException('Invalid EmployeePayrollDetails payload.');}

        // ---------------------------------------------------------
        // STEP 1 — Build CF Token
        // ---------------------------------------------------------
        System.debug('🔐 STEP 1: Generating CF Token...');
        String cftoken = EncodingUtil.base64Encode(Blob.valueOf('Administrator:'));
        System.debug('CF Token (partial): ' +
            cftoken.substring(0, Math.min(20, cftoken.length())) + '...');

        // ---------------------------------------------------------
        // STEP 2 — Fetch MYOB Client ID
        // ---------------------------------------------------------
        System.debug('🏢 STEP 2: Fetching Organisation Client ID...');

        User u = [
            SELECT Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        Organisation__c org = [
            SELECT Client_Id__c
            FROM Organisation__c
            WHERE Name = :u.Organization_Name__c
            LIMIT 1
        ];

        String clientId = org.Client_Id__c;
        System.debug('Client ID Retrieved Successfully');

        // ---------------------------------------------------------
        // STEP 3 — Build Endpoint
        // ---------------------------------------------------------
        String endpoint = companyFileUri + '/Contact/EmployeePayrollDetails/' + epdUid;
        System.debug('🌐 PUT Endpoint: ' + endpoint);

        // ---------------------------------------------------------
        // STEP 4 — Serialize Payload
        // ---------------------------------------------------------
        String bodyJson = JSON.serialize(epdBody);

        System.debug('📦 PUT Payload (partial): ' +
            bodyJson.substring(0, Math.min(1500, bodyJson.length()))
        );

        // ---------------------------------------------------------
        // STEP 5 — Build HTTP Request
        // ---------------------------------------------------------
        HttpRequest req = new HttpRequest();
        req.setEndpoint(endpoint);
        req.setMethod('PUT');

        req.setHeader('Authorization', 'Bearer ' + accessToken);
        req.setHeader('x-myobapi-key', clientId);
        req.setHeader('x-myobapi-version', 'v2');
        req.setHeader('x-myobapi-cftoken', cftoken);
        req.setHeader('Content-Type', 'application/json');
        req.setHeader('Accept', 'application/json');

        req.setBody(bodyJson);

        // ---------------------------------------------------------
        // STEP 6 — Execute Callout
        // ---------------------------------------------------------
        System.debug('🚀 Sending PUT request to MYOB...');

        Http http = new Http();
        HttpResponse res = http.send(req);

        Integer statusCode = res.getStatusCode();
        String responseBody = res.getBody();

        System.debug('📩 Response Status Code: ' + statusCode);

        if (responseBody != null) {
            System.debug('📩 Response Body (partial): ' +
                responseBody.substring(0, Math.min(1500, responseBody.length()))
            );
        }

        // ---------------------------------------------------------
        // STEP 7 — Success Handling
        // ---------------------------------------------------------
        if (statusCode == 200 || statusCode == 201) {
            System.debug('==================== 🟢 PUT EmployeePayrollDetails SUCCESS ====================');
            return;
        }

        // ---------------------------------------------------------
        // STEP 8 — Error Handling
        // ---------------------------------------------------------
        String errMsg = 'Failed to update EmployeePayrollDetails (Status ' + statusCode + ')';

        try {

            if (String.isNotBlank(responseBody)) {

                Map<String, Object> errorJson =
                    (Map<String, Object>) JSON.deserializeUntyped(responseBody);

                if (errorJson.containsKey('Errors')) {

                    List<Object> errors =
                        (List<Object>) errorJson.get('Errors');

                    for (Object errObj : errors) {

                        Map<String, Object> err =
                            (Map<String, Object>) errObj;

                        String name    = (String) err.get('Name');
                        String message = (String) err.get('Message');
                        String details = (String) err.get('AdditionalDetails');

                        errMsg += '\n• ' + name + ': ' + message;

                        if (details != null) {
                            errMsg += ' (' + details + ')';
                        }
                    }
                }
            }

        } catch (Exception parseEx) {

            errMsg += '\n⚠ Could not parse MYOB error JSON: ' + parseEx.getMessage();

            if (responseBody != null) {
                errMsg += '\nRaw Body (partial): ' +
                    responseBody.substring(0, Math.min(1000, responseBody.length()));
            }
        }

        System.debug('❌ ERROR: ' + errMsg);
        System.debug('==================== 🔴 PUT EmployeePayrollDetails FAILED ====================');

        throw new AuraHandledException(errMsg);
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
        System.debug('➡ Employee UID: ' + employeeUid);
        System.debug('➡ Shift Count: ' + (shifts != null ? shifts.size() : 0));
        System.debug('➡ Start Date: ' + startDate + ' | End Date: ' + endDate);

        if (shifts == null || shifts.isEmpty()) { throw new AuraHandledException('No shifts available to insert.');
        }

        /*
        ---------------------------------------------------------
        STEP 1 — Group Shifts by Wage Category UID
        ---------------------------------------------------------
        */
        Map<String, List<Map<String, Object>>> categoryEntries =
            new Map<String, List<Map<String, Object>>>();

        Decimal totalBrokenPay = 0;
        Decimal totalBrokenHours = 0;
        List<ShiftwithStaff__c> brokenShifts = new List<ShiftwithStaff__c>();

        for (ShiftwithStaff__c s : shifts) {

            // =====================================================
            // 🔴 HANDLE BROKEN SHIFTS SEPARATELY
            // =====================================================
            if (s.Broken_Shift__c == true) { brokenShifts.add(s); Decimal rate = s.Broken_Rate_Per_Hrs__c != null ? s.Broken_Rate_Per_Hrs__c : 0; Decimal duration = s.Broken_Total_Duration__c != null ? s.Broken_Total_Duration__c : 0; totalBrokenPay += rate * duration; totalBrokenHours += duration; continue; // Skip regular processing
            }

            // =====================================================
            // 🟢 REGULAR SHIFT PROCESSING
            // =====================================================
            System.debug('🔎 Processing Shift → Date: ' + s.Date__c +
                        ', Category: ' + s.Shift_Category__c +
                        ', Hours: ' + s.Actual_Duration__c);

            String wageUid = findWageCategoryUid(s.Shift_Category__c, payrollItems);

            if (wageUid == null) { continue;
            }

            if (!categoryEntries.containsKey(wageUid)) {
                categoryEntries.put(wageUid, new List<Map<String, Object>>());
            }

            Datetime dt = Datetime.newInstance(
                s.Date__c.year(),
                s.Date__c.month(),
                s.Date__c.day()
            );

            String dateStr = dt.format('yyyy-MM-dd\'T\'00:00:00');

            Map<String, Object> entry = new Map<String, Object>{
                'Date' => dateStr,
                'Hours' => s.Actual_Duration__c,
                'Processed' => false
            };

            categoryEntries.get(wageUid).add(entry);
        }

        // =====================================================
        // 🔴 ADD BROKEN SHIFT AS A SEPARATE CATEGORY
        // =====================================================
        if (!brokenShifts.isEmpty() && totalBrokenHours > 0) { Decimal avgBrokenRate = (totalBrokenPay / totalBrokenHours).setScale(2); String brokenShiftUid = findWageCategoryUid('broken shift', payrollItems);if (brokenShiftUid != null) { if (!categoryEntries.containsKey(brokenShiftUid)) { categoryEntries.put(brokenShiftUid, new List<Map<String, Object>>()); }Map<Date, Decimal> brokenHoursByDate = new Map<Date, Decimal>(); for (ShiftwithStaff__c s : brokenShifts) { Decimal duration = s.Broken_Total_Duration__c != null ? s.Broken_Total_Duration__c : 0;Decimal existing = brokenHoursByDate.containsKey(s.Date__c)  ? brokenHoursByDate.get(s.Date__c)  : 0; brokenHoursByDate.put(s.Date__c, existing + duration); }for (Date shiftDate : brokenHoursByDate.keySet()) { Datetime dt = Datetime.newInstance( shiftDate.year(), shiftDate.month(), shiftDate.day() );String dateStr = dt.format('yyyy-MM-dd\'T\'00:00:00'); Map<String, Object> entry = new Map<String, Object>{ 'Date' => dateStr, 'Hours' => brokenHoursByDate.get(shiftDate).setScale(2),'Processed' => false }; categoryEntries.get(brokenShiftUid).add(entry);
                }
                
                System.debug('🩵 Added Broken Shift category with ' + brokenHoursByDate.size() + 
                            ' entries at avg rate $' + avgBrokenRate);
            } else {
                System.debug('⚠ Could not find "broken shift" wage category UID');
            }
        }

        if (categoryEntries.isEmpty()) { throw new AuraHandledException( 'No valid MYOB wage categories found for shifts.' );
        }

        System.debug('📌 Wage Categories Used: ' + categoryEntries.keySet());

        /*
        ---------------------------------------------------------
        STEP 2 — Build Final Lines Array
        ---------------------------------------------------------
        */
        List<Object> lines = new List<Object>();

        for (String wageUid : categoryEntries.keySet()) {

            Map<String, Object> line = new Map<String, Object>{
                'PayrollCategory' => new Map<String, Object>{ 'UID' => wageUid },
                'Notes' => 'Auto Timesheet',
                'Entries' => categoryEntries.get(wageUid)
            };

            lines.add(line);
        }

        System.debug('📝 Final Line Count: ' + lines.size());

        /*
        ---------------------------------------------------------
        STEP 3 — Build Final Timesheet Payload
        ---------------------------------------------------------
        */
        Datetime dtStart =
            Datetime.newInstance(startDate.year(), startDate.month(), startDate.day());

        Datetime dtEnd =
            Datetime.newInstance(endDate.year(), endDate.month(), endDate.day());

        String myobStart = dtStart.format('yyyy-MM-dd\'T\'00:00:00');
        String myobEnd   = dtEnd.format('yyyy-MM-dd\'T\'00:00:00');

        Map<String, Object> payload = new Map<String, Object>{
            'Employee' => new Map<String, Object>{ 'UID' => employeeUid },
            'StartDate' => myobStart,
            'EndDate' => myobEnd,
            'Lines' => lines
        };

        String payloadJson = JSON.serialize(payload);

        System.debug('📤 Timesheet Payload (partial): ' +
            payloadJson.substring(0, Math.min(2000, payloadJson.length()))
        );

        /*
        ---------------------------------------------------------
        STEP 4 — Build Endpoint
        ---------------------------------------------------------
        */
        List<String> parts = companyFileUri.split('/');

        if (!parts.contains('accountright')) { throw new AuraHandledException('Invalid MYOB Company File URI.');
        }

        String cfGuid = parts[parts.indexOf('accountright') + 1];

        String postEndpoint =
            'https://arl2.api.myob.com/accountright/' + cfGuid +
            '/Payroll/Timesheet/' + employeeUid +
            '?StartDate=' + EncodingUtil.urlEncode(myobStart, 'UTF-8') +
            '&EndDate=' + EncodingUtil.urlEncode(myobEnd, 'UTF-8');

        System.debug('🌐 PUT Endpoint: ' + postEndpoint);

        /*
        ---------------------------------------------------------
        STEP 5 — Prepare Callout
        ---------------------------------------------------------
        */
        String cftoken =
            EncodingUtil.base64Encode(Blob.valueOf('Administrator:'));

        User u = [
            SELECT Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        Organisation__c org = [
            SELECT Client_Id__c
            FROM Organisation__c
            WHERE Name = :u.Organization_Name__c
            LIMIT 1
        ];

        HttpRequest req = new HttpRequest();
        req.setEndpoint(postEndpoint);
        req.setMethod('PUT');

        req.setHeader('Authorization', 'Bearer ' + accessToken);
        req.setHeader('x-myobapi-key', org.Client_Id__c);
        req.setHeader('x-myobapi-version', 'v2');
        req.setHeader('x-myobapi-cftoken', cftoken);
        req.setHeader('Content-Type', 'application/json');
        req.setHeader('Accept', 'application/json');

        req.setBody(payloadJson);

        /*
        ---------------------------------------------------------
        STEP 6 — Execute Callout
        ---------------------------------------------------------
        */
        System.debug('🚀 Sending Timesheet PUT request...');

        HttpResponse res = new Http().send(req);

        Integer statusCode = res.getStatusCode();
        String responseBody = res.getBody();

        System.debug('📥 Response Status Code: ' + statusCode);

        if (responseBody != null) {
            System.debug('📥 Response Body (partial): ' +
                responseBody.substring(0, Math.min(1500, responseBody.length()))
            );
        }

        if (statusCode != 200 && statusCode != 201) {

            System.debug('❌ Timesheet insert failed.');

            throw new AuraHandledException(
                'Timesheet insert failed. Status: ' + statusCode
            );
        }

        System.debug('================== 🟢 INSERT MYOB Timesheet SUCCESS ==================');

        return new Map<String, Object>{
            'success' => true,
            'statusCode' => statusCode,
            'message' => 'Timesheet inserted successfully',
            'brokenShiftsProcessed' => brokenShifts.size()
        };
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
            if (attempt > 1) {
                Long waitStart = DateTime.now().getTime();
                while (DateTime.now().getTime() - waitStart < 1000) {
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
                                        assignedUids.add(uid);
                                        System.debug('✅ Found in WageCategoryHourlyDetails: ' + uid);
                                    }
                                } else {
                                    // Check if it's a direct UID entry
                                    String uid = (String) w.get('UID');
                                    if (uid != null) {
                                        assignedUids.add(uid);
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

}