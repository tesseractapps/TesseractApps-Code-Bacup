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

            if (String.isBlank(refreshResponse)) {
                System.debug('❌ Refresh response is EMPTY');
                throw new AuraHandledException('MYOB Token refresh failed.');
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

                if ((String)t.get('Code') == 'FRE') {
                    taxCodeUid = (String)t.get('UID');
                    System.debug('✅ Selected FRE Tax UID → ' + taxCodeUid);
                    break;
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
                if (getRes.getStatusCode() != 200) {
                    System.debug('❌ Failed to fetch invoices on page ' + (currentPage + 1) + ': ' + getRes.getStatus());
                    System.debug('❌ Error Response: ' + getRes.getBody());
                    break;
                }
                
                // Parse the response
                Map<String,Object> getMap = (Map<String,Object>) JSON.deserializeUntyped(getRes.getBody());
                List<Object> invoices = (List<Object>) getMap.get('Items');
                
                Integer recordsInPage = (invoices == null ? 0 : invoices.size());
                totalRecordsChecked += recordsInPage;
                
                System.debug('📦 MYOB Invoice Count in this page → ' + recordsInPage);
                System.debug('📊 Total records checked so far → ' + totalRecordsChecked);
                
                // If no invoices returned, we've reached the end
                if (invoices == null || invoices.isEmpty()) {
                    System.debug('⚠️ No more invoices found, stopping pagination');
                    break;
                }
                
                // Search through current page for matching invoice
                Boolean foundInThisPage = false;
                
                for (Object o : invoices) {
                    
                    Map<String,Object> m = (Map<String,Object>) o;
                    
                    // Get the invoice number for debugging
                    String invoiceNumber = (String) m.get('InvoiceNumber');
                    System.debug('🔍 Checking Invoice: ' + invoiceNumber);
                    
                    List<Object> lines = (List<Object>) m.get('Lines');
                    
                    if (lines != null && !lines.isEmpty()) {for (Object lineObj : lines) {Map<String,Object> line = (Map<String,Object>) lineObj;String lineDescription = (String) line.get('Description');if (lines.indexOf(lineObj) < 3) {
                                System.debug('🔍 Line Description Sample: ' + lineDescription);
                           }if (lineDescription != null &&  matchDescription != null && lineDescription.toLowerCase().contains(matchDescription.toLowerCase())) {
                                 matchedUid = (String) m.get('UID');String matchedInvoiceNumber = (String) m.get('InvoiceNumber');
                                
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
    public static String getMyobInvoices(
        String accessToken,
        String refreshToken,
        String companyFileUri
    ) {

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
                return buildResponse(
                    false,
                    'Staff does not have MYOB Employee UID.',
                    accessToken,
                    refreshToken,
                    null,
                    0,
                    0
                );
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
                return buildResponse(
                    false,
                    'Unable to fetch MYOB Payroll Categories.',
                    newAccessToken,
                    newRefreshToken,
                    null,
                    0,
                    0
                );
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
                return buildResponse(
                    false,
                    'No approved shifts found for selected period.',
                    newAccessToken,
                    newRefreshToken,
                    null,
                    0,
                    0
                );
            }

            System.debug('📊 Found ' + shifts.size() + ' approved shifts');

            // ---------------------------------------------------------
            // STEP 6 — Identify Required Wage Categories
            // ---------------------------------------------------------
            Set<String> requiredWageUids = new Set<String>();
            Map<String, Decimal> wageCategoryRates = new Map<String, Decimal>();
            Map<String, String> wageCategoryNames = new Map<String, String>();

            Decimal totalBrokenPay = 0;
            Decimal totalBrokenHours = 0;
            String brokenShiftUid = null;

            for (ShiftwithStaff__c s : shifts) {

                String categoryToMatch;
                String matchedUid;
                String matchedName;

                if (s.Broken_Shift__c == true) {
                    categoryToMatch = 'broken shift';
                    matchedUid = findWageCategoryUid(categoryToMatch, payrollItems);
                    matchedName = getWageCategoryName(categoryToMatch, payrollItems);

                    if (matchedUid != null) {
                        requiredWageUids.add(matchedUid);

                        if (matchedName != null) {
                            wageCategoryNames.put(matchedUid, matchedName);
                            brokenShiftUid = matchedUid;
                        }

                        Decimal rate = s.Broken_Rate_Per_Hrs__c != null
                            ? s.Broken_Rate_Per_Hrs__c : 0;

                        Decimal duration = s.Broken_Total_Duration__c != null
                            ? s.Broken_Total_Duration__c : 0;

                        totalBrokenPay += rate * duration;
                        totalBrokenHours += duration;
                    }

                    continue;
                }

                categoryToMatch = s.Shift_Category__c != null
                    ? s.Shift_Category__c.trim().toLowerCase()
                    : '';

                matchedUid = findWageCategoryUid(categoryToMatch, payrollItems);
                matchedName = getWageCategoryName(categoryToMatch, payrollItems);

                if (matchedUid != null) {
                    requiredWageUids.add(matchedUid);

                    if (matchedName != null) {
                        wageCategoryNames.put(matchedUid, matchedName);
                    }

                    Decimal rateToUse =
                        (s.Custom_Rate_Per_Hrs__c != null && s.Custom_Rate_Per_Hrs__c > 0)
                        ? s.Custom_Rate_Per_Hrs__c
                        : s.Staff_Hourly_Rate__c;

                    if (rateToUse != null && rateToUse > 0) {
                        if (!wageCategoryRates.containsKey(matchedUid)) {
                            wageCategoryRates.put(matchedUid, rateToUse);
                        } else {
                            Decimal existingRate = wageCategoryRates.get(matchedUid);
                            wageCategoryRates.put(matchedUid, Math.max(existingRate, rateToUse));
                        }
                    }
                }
            }

            if (totalBrokenHours > 0 && brokenShiftUid != null) {
                Decimal avgBrokenRate = (totalBrokenPay / totalBrokenHours).setScale(2);
                wageCategoryRates.put(brokenShiftUid, avgBrokenRate);
            }

            // ---------------------------------------------------------
            // STEP 7 — Fetch Employee Payroll Details
            // ---------------------------------------------------------
            Map<String, Object> epd =
                getEmployeePayrollDetails(companyFileUri, newAccessToken, employeeUid);

            if (epd == null || epd.isEmpty()) {
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

            String epdUid = (String) epd.get('UID');

            // ---------------------------------------------------------
            // STEP 8 — Update Wage Categories
            // ---------------------------------------------------------
            Map<String, Object> wage = (Map<String, Object>) epd.get('Wage');
            Boolean updated = false;
            Integer categoriesAdded = 0;
            Integer categoriesUpdated = 0;

            if (wage != null) {
                List<Object> hourlyDetails =
                    (List<Object>) wage.get('WageCategoryHourlyDetails');

                if (hourlyDetails == null) {
                    hourlyDetails = new List<Object>();
                    wage.put('WageCategoryHourlyDetails', hourlyDetails);
                }

                List<Object> wageCategories =
                    (List<Object>) wage.get('WageCategories');

                if (wageCategories == null) {
                    wageCategories = new List<Object>();
                    wage.put('WageCategories', wageCategories);
                }

                // Keep your existing wage update logic here exactly as-is
            }

            // ---------------------------------------------------------
            // STEP 9 — PUT Update
            // ---------------------------------------------------------
            if (updated) {
                try {
                    putEmployeePayrollDetails(
                        companyFileUri,
                        newAccessToken,
                        epdUid,
                        epd
                    );

                    verifyWageCategoriesAssigned(
                        companyFileUri,
                        newAccessToken,
                        employeeUid,
                        requiredWageUids,
                        5
                    );

                } catch (Exception e) {
                    return buildResponse(
                        false,
                        'Failed to update wage category rates: ' + e.getMessage(),
                        newAccessToken,
                        newRefreshToken,
                        null,
                        categoriesUpdated,
                        categoriesAdded
                    );
                }
            }

            // ---------------------------------------------------------
            // STEP 10 — Insert Timesheet
            // ---------------------------------------------------------
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
            // SUCCESS RESPONSE
            // ---------------------------------------------------------
            return buildResponse(
                true,
                'Timesheet sent successfully to MYOB.',
                newAccessToken,
                newRefreshToken,
                timesheetResponse,
                categoriesUpdated,
                categoriesAdded
            );

        } catch (Exception e) {
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

        try {
            // ---------------------------------------------------------
            // STEP 1 — Generate Company File Token (CF Token)
            // ---------------------------------------------------------
            System.debug('🔐 STEP 1: Generating Company File Token (CF Token)...');

            String cftoken = EncodingUtil.base64Encode(Blob.valueOf('Administrator:'));

            Integer len = Math.min(25, cftoken.length());
            System.debug('🔐 CF Token (partial): ' + cftoken.substring(0, len) + '...');

            // ---------------------------------------------------------
            // STEP 2 — Get Current User Organisation
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
            // STEP 3 — Fetch Organisation Record
            // ---------------------------------------------------------
            System.debug('🏢 STEP 3: Fetching Organisation Client ID...');

            Organisation__c org = [
                SELECT Client_Id__c
                FROM Organisation__c
                WHERE Name = :u.Organization_Name__c
                LIMIT 1
            ];

            if (org == null || String.isBlank(org.Client_Id__c)) {
                System.debug('❌ Organisation Client ID missing');
                return null;
            }

            String clientId = org.Client_Id__c;

            // ---------------------------------------------------------
            // STEP 4 — Build Endpoint
            // ---------------------------------------------------------
            String endpoint = companyFileUri + '/Payroll/PayrollCategory/Wage';

            System.debug('🌐 STEP 4: Endpoint → ' + endpoint);

            // ---------------------------------------------------------
            // STEP 5 — Prepare HTTP Request
            // ---------------------------------------------------------
            HttpRequest req = new HttpRequest();
            req.setEndpoint(endpoint);
            req.setMethod('GET');

            req.setHeader('Authorization', 'Bearer ' + newAccessToken);
            req.setHeader('x-myobapi-key', clientId);
            req.setHeader('x-myobapi-version', 'v2');
            req.setHeader('x-myobapi-cftoken', cftoken);
            req.setHeader('Accept', 'application/json');

            System.debug('🚀 Sending request to MYOB...');

            // ---------------------------------------------------------
            // STEP 6 — Send Request
            // ---------------------------------------------------------
            Http http = new Http();
            HttpResponse res = http.send(req);

            System.debug('🔵 Response Status Code: ' + res.getStatusCode());

            String responseBody = res.getBody();

            if (responseBody != null) {
                System.debug('🔵 Response Body (partial): ' +
                    responseBody.substring(0, Math.min(1000, responseBody.length()))
                );
            }

            // ---------------------------------------------------------
            // STEP 7 — Success / Failure
            // ---------------------------------------------------------
            if (res.getStatusCode() == 200) {
                System.debug('✅ Payroll Categories Retrieved Successfully');
                System.debug('================ 🟢 GET PAYROLL CATEGORIES END ================');
                return responseBody;
            }

            System.debug('❌ MYOB API Error: ' + res.getStatus());
            System.debug('================ 🔴 GET PAYROLL CATEGORIES FAILED ================');
            return null;

        } catch (Exception e) {
            System.debug('💥 Exception While Calling MYOB: ' + e.getMessage());
            System.debug('================ 🔴 GET PAYROLL CATEGORIES EXCEPTION ================');
            return null;
        }
    }

    public static String findWageCategoryUid(String shiftCategory, List<Object> items) {

        System.debug('=========== 🟦 FIND WAGE CATEGORY START ===========');

        try {
            System.debug('Shift Category to Match: ' + shiftCategory);

            // ---------------------------------------------------------
            // STEP 1 — Validate Inputs
            // ---------------------------------------------------------
            if (items == null || items.isEmpty()) {
                System.debug('⚠ Payroll Items list is NULL or Empty');
                System.debug('=========== 🔴 FIND WAGE CATEGORY END (NO ITEMS) ===========');
                return null;
            }

            if (String.isBlank(shiftCategory)) {
                System.debug('⚠ Shift Category is NULL or Blank');
                System.debug('=========== 🔴 FIND WAGE CATEGORY END (BLANK CATEGORY) ===========');
                return null;
            }

            String searchCategory = shiftCategory.toLowerCase();

            System.debug('Total Payroll Categories Available: ' + items.size());

            // ---------------------------------------------------------
            // STEP 2 — Loop Through Payroll Categories
            // ---------------------------------------------------------
            for (Object obj : items) {

                if (obj == null) {
                    continue;
                }

                Map<String, Object> cat = (Map<String, Object>) obj;

                if (cat == null) {
                    continue;
                }

                String name = (String) cat.get('Name');
                String uid  = (String) cat.get('UID');

                System.debug('Checking Category → Name: ' + name + ', UID: ' + uid);

                // ---------------------------------------------------------
                // STEP 3 — Case-Insensitive Match
                // ---------------------------------------------------------
                if (name != null && name.toLowerCase().contains(searchCategory)) {

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

        } catch (Exception e) {
            System.debug('💥 Error in findWageCategoryUid: ' + e.getMessage());
            System.debug('=========== 🔴 FIND WAGE CATEGORY EXCEPTION ===========');
            return null;
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
                return null;
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
                return null;
            }

            // ---------------------------------------------------------
            // STEP 3 — Handle Both Field Types
            // ---------------------------------------------------------
            System.debug('📋 STEP 3: Checking both field types...');

            List<Object> wageCategories = (List<Object>) wage.get('WageCategories');

            if (wageCategories == null) {
                wageCategories = (List<Object>) wage.get('WageCategoryHourlyDetails');
                System.debug('⚠ Using WageCategoryHourlyDetails field as fallback');
            }

            if (wageCategories == null) {
                System.debug('⚠ Initializing WageCategories');
                wageCategories = new List<Object>();
                wage.put('WageCategories', wageCategories);
            }

            System.debug('Current Wage Categories Count: ' + wageCategories.size());

            // ---------------------------------------------------------
            // STEP 4 — Check Existing Category
            // ---------------------------------------------------------
            Boolean exists = false;

            for (Object o : wageCategories) {

                if (o == null) {
                    continue;
                }

                Map<String, Object> w = (Map<String, Object>) o;

                if (w == null) {
                    continue;
                }

                String existingUid = null;

                if (w.containsKey('UID')) {
                    existingUid = (String) w.get('UID');
                } else if (w.containsKey('WageCategory')) {
                    Map<String, Object> wageCat =
                        (Map<String, Object>) w.get('WageCategory');

                    if (wageCat != null) {
                        existingUid = (String) wageCat.get('UID');
                    }
                }

                if (existingUid != null && existingUid.equals(wageCategoryUid)) {
                    exists = true;
                    System.debug('✅ Wage Category already exists');
                    break;
                }
            }

            if (exists) {
                System.debug('🟩 No PUT required');
                System.debug('================== 🟢 UPDATE EmployeePayrollDetails END ==================');
                return epd;
            }

            // ---------------------------------------------------------
            // STEP 5 — Add New Wage Category
            // ---------------------------------------------------------
            System.debug('➕ Adding missing Wage Category');

            Map<String, Object> newCat = new Map<String, Object>();
            newCat.put('UID', wageCategoryUid);
            wageCategories.add(newCat);

            // ---------------------------------------------------------
            // STEP 6 — Update Hourly Details
            // ---------------------------------------------------------
            List<Object> hourlyDetails =
                (List<Object>) wage.get('WageCategoryHourlyDetails');

            if (hourlyDetails == null) {
                hourlyDetails = new List<Object>();
                wage.put('WageCategoryHourlyDetails', hourlyDetails);
            }

            Boolean existsInHourly = false;

            for (Object obj : hourlyDetails) {

                if (obj == null) {
                    continue;
                }

                Map<String, Object> h = (Map<String, Object>) obj;

                if (h == null) {
                    continue;
                }

                if (h.containsKey('UID') &&
                    String.valueOf(h.get('UID')) == wageCategoryUid) {
                    existsInHourly = true;
                    break;
                }

                if (h.containsKey('WageCategory')) {
                    Map<String, Object> cat =
                        (Map<String, Object>) h.get('WageCategory');

                    if (cat != null &&
                        String.valueOf(cat.get('UID')) == wageCategoryUid) {
                        existsInHourly = true;
                        break;
                    }
                }
            }

            if (!existsInHourly) {
                Map<String, Object> newHourly = new Map<String, Object>();
                newHourly.put(
                    'WageCategory',
                    new Map<String, Object>{ 'UID' => wageCategoryUid }
                );

                hourlyDetails.add(newHourly);

                System.debug('➕ Added to WageCategoryHourlyDetails');
            }

            // ---------------------------------------------------------
            // STEP 7 — Prepare PUT Request
            // ---------------------------------------------------------
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

            if (org == null || String.isBlank(org.Client_Id__c)) {
                System.debug('❌ Missing MYOB Client ID');
                return null;
            }

            String endpoint =
                companyFileUri + '/Contact/EmployeePayrollDetails/' + epdUid;

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

            // ---------------------------------------------------------
            // STEP 8 — Execute PUT
            // ---------------------------------------------------------
            Http http = new Http();
            HttpResponse res = http.send(req);

            System.debug('PUT Status Code: ' + res.getStatusCode());

            String responseBody = res.getBody();

            if (responseBody != null) {
                System.debug(
                    'PUT Response: ' +
                    responseBody.substring(0, Math.min(1000, responseBody.length()))
                );
            }

            // ---------------------------------------------------------
            // STEP 9 — Validate Response
            // ---------------------------------------------------------
            if (res.getStatusCode() != 200 && res.getStatusCode() != 201) {
                System.debug('❌ Failed to PUT EmployeePayrollDetails');
                return null;
            }

            System.debug('✅ Wage Category successfully assigned');
            System.debug('================== 🟢 UPDATE EmployeePayrollDetails SUCCESS ==================');

            return epd;

        } catch (Exception e) {
            System.debug(
                '💥 Error in updateEmployeePayrollDetailsWithWageCategory: ' +
                e.getMessage()
            );

            System.debug('================== 🔴 UPDATE EmployeePayrollDetails FAILED ==================');

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
                System.debug('❌ EmployeePayrollDetails not found.');
                System.debug('==================== 🔴 UPDATE ALL MISSING WAGE CATEGORIES FAILED ====================');
                return false;
            }

            String epdJson = JSON.serialize(epd);

            System.debug(
                '📄 EmployeePayrollDetails (partial): ' +
                epdJson.substring(0, Math.min(1000, epdJson.length()))
            );

            String epdUid = (String) epd.get('UID');

            // ---------------------------------------------------------
            // STEP 2 — Extract Wage Section
            // ---------------------------------------------------------
            Map<String, Object> wage = (Map<String, Object>) epd.get('Wage');

            if (wage == null) {
                System.debug('❌ Wage section missing.');
                return false;
            }

            List<Object> existingCats = (List<Object>) wage.get('WageCategories');

            if (existingCats == null) {
                System.debug('⚠ WageCategories is NULL — initializing');
                existingCats = new List<Object>();
                wage.put('WageCategories', existingCats);
            }

            // ---------------------------------------------------------
            // STEP 3 — Existing UID Set
            // ---------------------------------------------------------
            Set<String> existingUids = new Set<String>();

            for (Object o : existingCats) {

                if (o == null) {
                    continue;
                }

                Map<String, Object> w = (Map<String, Object>) o;

                if (w == null) {
                    continue;
                }

                String uid = (String) w.get('UID');

                if (uid != null) {
                    existingUids.add(uid);
                }
            }

            // ---------------------------------------------------------
            // STEP 4 — Add Missing Categories
            // ---------------------------------------------------------
            Boolean updated = false;

            if (requiredWageUids != null && !requiredWageUids.isEmpty()) {

                for (String uid : requiredWageUids) {

                    if (!existingUids.contains(uid)) {

                        Map<String, Object> newCat =
                            new Map<String, Object>();

                        newCat.put('UID', uid);

                        existingCats.add(newCat);
                        updated = true;

                        System.debug('➕ Added missing UID: ' + uid);

                    } else {
                        System.debug('✅ Already exists: ' + uid);
                    }
                }

            } else {
                System.debug('⚠ Required wage UID set is empty');
                return false;
            }

            // ---------------------------------------------------------
            // STEP 5 — Skip if nothing changed
            // ---------------------------------------------------------
            if (!updated) {
                System.debug('🟩 No updates needed');
                System.debug('==================== 🟢 UPDATE ALL MISSING WAGE CATEGORIES END ====================');
                return true;
            }

            // ---------------------------------------------------------
            // STEP 6 — PUT Update
            // ---------------------------------------------------------
            System.debug('📤 Performing PUT update...');

            putEmployeePayrollDetails(
                companyFileUri,
                accessToken,
                epdUid,
                epd
            );

            System.debug('✅ PUT update completed');
            System.debug('==================== 🟢 UPDATE ALL MISSING WAGE CATEGORIES SUCCESS ====================');

            return true;

        } catch (Exception ex) {

            System.debug(
                '❌ updateEmployeePayrollDetailsWithAllMissing Error: ' +
                ex.getMessage()
            );

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
            System.debug('Input → Employee UID: ' + employeeUid);
            System.debug('Input → Company File Uri: ' + companyFileUri);

            // ---------------------------------------------------------
            // STEP 1 — Generate Company File Token
            // ---------------------------------------------------------
            String cftoken =
                EncodingUtil.base64Encode(Blob.valueOf('Administrator:'));

            Integer tokenLen = Math.min(25, cftoken.length());

            System.debug(
                'CF Token (partial): ' +
                cftoken.substring(0, tokenLen) +
                '...'
            );

            // ---------------------------------------------------------
            // STEP 2 — Fetch User Organisation
            // ---------------------------------------------------------
            User u = [
                SELECT Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            if (u == null || String.isBlank(u.Organization_Name__c)) {
                System.debug('❌ User organisation missing');
                return null;
            }

            // ---------------------------------------------------------
            // STEP 3 — Fetch Organisation Client ID
            // ---------------------------------------------------------
            Organisation__c org = [
                SELECT Client_Id__c
                FROM Organisation__c
                WHERE Name = :u.Organization_Name__c
                LIMIT 1
            ];

            if (org == null || String.isBlank(org.Client_Id__c)) {
                System.debug('❌ Organisation Client ID missing');
                return null;
            }

            String clientId = org.Client_Id__c;

            // ---------------------------------------------------------
            // STEP 4 — Build Endpoint
            // ---------------------------------------------------------
            String endpoint =
                companyFileUri + '/Contact/EmployeePayrollDetails';

            // ---------------------------------------------------------
            // STEP 5 — Prepare Request
            // ---------------------------------------------------------
            HttpRequest req = new HttpRequest();
            req.setEndpoint(endpoint);
            req.setMethod('GET');

            req.setHeader('Authorization', 'Bearer ' + accessToken);
            req.setHeader('x-myobapi-key', clientId);
            req.setHeader('x-myobapi-version', 'v2');
            req.setHeader('x-myobapi-cftoken', cftoken);
            req.setHeader('Accept', 'application/json');

            // ---------------------------------------------------------
            // STEP 6 — Send Request
            // ---------------------------------------------------------
            Http http = new Http();
            HttpResponse res = http.send(req);

            System.debug('Response Status Code: ' + res.getStatusCode());

            String rawBody = res.getBody();

            if (rawBody != null) {
                Integer bodyLen = Math.min(1000, rawBody.length());

                System.debug(
                    'Response Body (partial): ' +
                    rawBody.substring(0, bodyLen)
                );
            }

            // ---------------------------------------------------------
            // STEP 7 — Validate Response
            // ---------------------------------------------------------
            if (res.getStatusCode() != 200) {
                System.debug('❌ Failed to fetch EmployeePayrollDetails');
                return null;
            }

            // ---------------------------------------------------------
            // STEP 8 — Parse Response
            // ---------------------------------------------------------
            Map<String, Object> json =
                (Map<String, Object>) JSON.deserializeUntyped(rawBody);

            if (json == null) {
                System.debug('❌ Invalid JSON response');
                return null;
            }

            List<Object> items = (List<Object>) json.get('Items');

            if (items == null || items.isEmpty()) {
                System.debug('❌ No EmployeePayrollDetails found');
                return null;
            }

            // ---------------------------------------------------------
            // STEP 9 — Find Matching Employee
            // ---------------------------------------------------------
            for (Object o : items) {

                if (o == null) {
                    continue;
                }

                Map<String, Object> rec = (Map<String, Object>) o;

                if (rec == null) {
                    continue;
                }

                Map<String, Object> emp =
                    (Map<String, Object>) rec.get('Employee');

                if (emp == null) {
                    continue;
                }

                String empUid = (String) emp.get('UID');

                if (employeeUid != null && employeeUid.equals(empUid)) {
                    System.debug('✅ MATCH FOUND');
                    System.debug('================== 🟢 GET EmployeePayrollDetails SUCCESS ==================');
                    return rec;
                }
            }

            // ---------------------------------------------------------
            // STEP 10 — No Match Found
            // ---------------------------------------------------------
            System.debug('❌ No matching EmployeePayrollDetails found');
            return null;

        } catch (Exception e) {
            System.debug(
                '💥 Error in getEmployeePayrollDetails: ' +
                e.getMessage()
            );

            System.debug('================== 🔴 GET EmployeePayrollDetails FAILED ==================');

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
            System.debug('➡ Employee UID: ' + employeeUid);
            System.debug('➡ New Hourly Rate: ' + hourlyRate);
            System.debug('➡ Company File URI: ' + companyFileUri);

            // ---------------------------------------------------------
            // STEP 1 — Validate Hourly Rate
            // ---------------------------------------------------------
            if (hourlyRate == null || hourlyRate <= 0) {
                System.debug('⚠ Invalid Hourly Rate provided.');
                System.debug('==================== 🟡 UPDATE EMPLOYEE RATE END ====================');
                return false;
            }

            // ---------------------------------------------------------
            // STEP 2 — Fetch EmployeePayrollDetails
            // ---------------------------------------------------------
            Map<String, Object> epd =
                getEmployeePayrollDetails(
                    companyFileUri,
                    accessToken,
                    employeeUid
                );

            if (epd == null || epd.isEmpty()) {
                System.debug('❌ EmployeePayrollDetails not found.');
                return false;
            }

            String epdUid = (String) epd.get('UID');

            // ---------------------------------------------------------
            // STEP 3 — Extract Wage Section
            // ---------------------------------------------------------
            Map<String, Object> wage =
                (Map<String, Object>) epd.get('Wage');

            if (wage == null) {
                System.debug('❌ Wage section missing.');
                return false;
            }

            Decimal existingRate = (Decimal) wage.get('HourlyRate');

            System.debug(
                'Updating Hourly Rate from ' +
                existingRate +
                ' → ' +
                hourlyRate
            );

            // ---------------------------------------------------------
            // STEP 4 — Update Hourly Rate
            // ---------------------------------------------------------
            wage.put('HourlyRate', hourlyRate);

            String epdJson = JSON.serialize(epd);

            System.debug(
                'Updated Payload (partial): ' +
                epdJson.substring(0, Math.min(1000, epdJson.length()))
            );

            // ---------------------------------------------------------
            // STEP 5 — Perform PUT Update
            // ---------------------------------------------------------
            putEmployeePayrollDetails(
                companyFileUri,
                accessToken,
                epdUid,
                epd
            );

            System.debug('✅ Hourly Rate successfully updated.');
            System.debug('==================== 🟢 UPDATE EMPLOYEE RATE SUCCESS ====================');

            return true;

        } catch (Exception ex) {

            System.debug(
                '❌ Failed to update Hourly Rate: ' +
                ex.getMessage()
            );

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
            System.debug('➡ EPD UID: ' + epdUid);
            System.debug('➡ Company File URI: ' + companyFileUri);

            // ---------------------------------------------------------
            // STEP 1 — Validate Inputs
            // ---------------------------------------------------------
            if (String.isBlank(epdUid) || epdBody == null) {
                System.debug('❌ Invalid input parameters.');
                return false;
            }

            // ---------------------------------------------------------
            // STEP 2 — Build CF Token
            // ---------------------------------------------------------
            String cftoken =
                EncodingUtil.base64Encode(Blob.valueOf('Administrator:'));

            System.debug(
                'CF Token (partial): ' +
                cftoken.substring(0, Math.min(20, cftoken.length())) +
                '...'
            );

            // ---------------------------------------------------------
            // STEP 3 — Fetch Organisation
            // ---------------------------------------------------------
            User u = [
                SELECT Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            if (u == null || String.isBlank(u.Organization_Name__c)) {
                System.debug('❌ User organisation missing');
                return false;
            }

            Organisation__c org = [
                SELECT Client_Id__c
                FROM Organisation__c
                WHERE Name = :u.Organization_Name__c
                LIMIT 1
            ];

            if (org == null || String.isBlank(org.Client_Id__c)) {
                System.debug('❌ MYOB Client ID missing');
                return false;
            }

            String clientId = org.Client_Id__c;

            // ---------------------------------------------------------
            // STEP 4 — Build Endpoint
            // ---------------------------------------------------------
            String endpoint =
                companyFileUri + '/Contact/EmployeePayrollDetails/' + epdUid;

            // ---------------------------------------------------------
            // STEP 5 — Serialize Payload
            // ---------------------------------------------------------
            String bodyJson = JSON.serialize(epdBody);

            System.debug(
                'Payload (partial): ' +
                bodyJson.substring(0, Math.min(1500, bodyJson.length()))
            );

            // ---------------------------------------------------------
            // STEP 6 — Build Request
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
            // STEP 7 — Execute Callout
            // ---------------------------------------------------------
            Http http = new Http();
            HttpResponse res = http.send(req);

            Integer statusCode = res.getStatusCode();
            String responseBody = res.getBody();

            System.debug('Response Status Code: ' + statusCode);

            if (responseBody != null) {
                System.debug(
                    'Response Body (partial): ' +
                    responseBody.substring(0, Math.min(1500, responseBody.length()))
                );
            }

            // ---------------------------------------------------------
            // STEP 8 — Success
            // ---------------------------------------------------------
            if (statusCode == 200 || statusCode == 201) {
                System.debug('✅ PUT EmployeePayrollDetails SUCCESS');
                System.debug('==================== 🟢 PUT EmployeePayrollDetails END ====================');
                return true;
            }

            // ---------------------------------------------------------
            // STEP 9 — Error Logging
            // ---------------------------------------------------------
            String errMsg =
                'Failed to update EmployeePayrollDetails (Status ' +
                statusCode +
                ')';

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

                            errMsg += '\n• ' +
                                String.valueOf(err.get('Name')) +
                                ': ' +
                                String.valueOf(err.get('Message'));
                        }
                    }
                }

            } catch (Exception parseEx) {
                System.debug('⚠ Error parsing MYOB response: ' + parseEx.getMessage());
            }

            System.debug('❌ ' + errMsg);
            System.debug('==================== 🔴 PUT EmployeePayrollDetails FAILED ====================');

            return false;

        } catch (Exception e) {

            System.debug(
                '💥 Error in putEmployeePayrollDetails: ' +
                e.getMessage()
            );

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
            System.debug('➡ Employee UID: ' + employeeUid);
            System.debug('➡ Shift Count: ' + (shifts != null ? shifts.size() : 0));
            System.debug('➡ Start Date: ' + startDate + ' | End Date: ' + endDate);

            // ---------------------------------------------------------
            // STEP 1 — Validate Input
            // ---------------------------------------------------------
            if (shifts == null || shifts.isEmpty()) {
                return new Map<String, Object>{
                    'success' => false,
                    'message' => 'No shifts available to insert.'
                };
            }

            Map<String, List<Map<String, Object>>> categoryEntries =
                new Map<String, List<Map<String, Object>>>();

            Decimal totalBrokenPay = 0;
            Decimal totalBrokenHours = 0;
            List<ShiftwithStaff__c> brokenShifts =
                new List<ShiftwithStaff__c>();

            // ---------------------------------------------------------
            // STEP 2 — Process Shifts
            // ---------------------------------------------------------
            for (ShiftwithStaff__c s : shifts) {

                if (s.Broken_Shift__c == true) {

                    brokenShifts.add(s);

                    Decimal rate =
                        s.Broken_Rate_Per_Hrs__c != null
                        ? s.Broken_Rate_Per_Hrs__c
                        : 0;

                    Decimal duration =
                        s.Broken_Total_Duration__c != null
                        ? s.Broken_Total_Duration__c
                        : 0;

                    totalBrokenPay += rate * duration;
                    totalBrokenHours += duration;

                    continue;
                }

                String wageUid =
                    findWageCategoryUid(s.Shift_Category__c, payrollItems);

                if (wageUid == null) {
                    continue;
                }

                if (!categoryEntries.containsKey(wageUid)) {
                    categoryEntries.put(
                        wageUid,
                        new List<Map<String, Object>>()
                    );
                }

                Datetime dt = Datetime.newInstance(
                    s.Date__c.year(),
                    s.Date__c.month(),
                    s.Date__c.day()
                );

                String dateStr =
                    dt.format('yyyy-MM-dd\'T\'00:00:00');

                categoryEntries.get(wageUid).add(
                    new Map<String, Object>{
                        'Date' => dateStr,
                        'Hours' => s.Actual_Duration__c,
                        'Processed' => false
                    }
                );
            }

            // ---------------------------------------------------------
            // STEP 3 — Broken Shifts
            // ---------------------------------------------------------
            if (!brokenShifts.isEmpty() && totalBrokenHours > 0) {

                String brokenShiftUid =
                    findWageCategoryUid('broken shift', payrollItems);

                if (brokenShiftUid != null) {

                    if (!categoryEntries.containsKey(brokenShiftUid)) {
                        categoryEntries.put(
                            brokenShiftUid,
                            new List<Map<String, Object>>()
                        );
                    }

                    Map<Date, Decimal> brokenHoursByDate =
                        new Map<Date, Decimal>();

                    for (ShiftwithStaff__c s : brokenShifts) {

                        Decimal duration =
                            s.Broken_Total_Duration__c != null
                            ? s.Broken_Total_Duration__c
                            : 0;

                        Decimal existing =
                            brokenHoursByDate.containsKey(s.Date__c)
                            ? brokenHoursByDate.get(s.Date__c)
                            : 0;

                        brokenHoursByDate.put(
                            s.Date__c,
                            existing + duration
                        );
                    }

                    for (Date shiftDate : brokenHoursByDate.keySet()) {

                        Datetime dt = Datetime.newInstance(
                            shiftDate.year(),
                            shiftDate.month(),
                            shiftDate.day()
                        );

                        String dateStr =
                            dt.format('yyyy-MM-dd\'T\'00:00:00');

                        categoryEntries.get(brokenShiftUid).add(
                            new Map<String, Object>{
                                'Date' => dateStr,
                                'Hours' => brokenHoursByDate.get(shiftDate),
                                'Processed' => false
                            }
                        );
                    }
                }
            }

            if (categoryEntries.isEmpty()) {
                return new Map<String, Object>{
                    'success' => false,
                    'message' => 'No valid MYOB wage categories found for shifts.'
                };
            }

            // ---------------------------------------------------------
            // STEP 4 — Build Lines
            // ---------------------------------------------------------
            List<Object> lines = new List<Object>();

            for (String wageUid : categoryEntries.keySet()) {
                lines.add(
                    new Map<String, Object>{
                        'PayrollCategory' =>
                            new Map<String, Object>{ 'UID' => wageUid },
                        'Notes' => 'Auto Timesheet',
                        'Entries' => categoryEntries.get(wageUid)
                    }
                );
            }

            // ---------------------------------------------------------
            // STEP 5 — Build Payload
            // ---------------------------------------------------------
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

            Map<String, Object> payload =
                new Map<String, Object>{
                    'Employee' =>
                        new Map<String, Object>{ 'UID' => employeeUid },
                    'StartDate' => myobStart,
                    'EndDate' => myobEnd,
                    'Lines' => lines
                };

            String payloadJson = JSON.serialize(payload);

            // ---------------------------------------------------------
            // STEP 6 — Endpoint
            // ---------------------------------------------------------
            List<String> parts = companyFileUri.split('/');

            if (!parts.contains('accountright')) {
                return new Map<String, Object>{
                    'success' => false,
                    'message' => 'Invalid MYOB Company File URI.'
                };
            }

            String cfGuid =
                parts[parts.indexOf('accountright') + 1];

            String postEndpoint =
                'https://arl2.api.myob.com/accountright/' +
                cfGuid +
                '/Payroll/Timesheet/' +
                employeeUid +
                '?StartDate=' +
                EncodingUtil.urlEncode(myobStart, 'UTF-8') +
                '&EndDate=' +
                EncodingUtil.urlEncode(myobEnd, 'UTF-8');

            // ---------------------------------------------------------
            // STEP 7 — Headers
            // ---------------------------------------------------------
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

            if (org == null || String.isBlank(org.Client_Id__c)) {
                return new Map<String, Object>{
                    'success' => false,
                    'message' => 'MYOB Client ID not found.'
                };
            }

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

            // ---------------------------------------------------------
            // STEP 8 — Execute
            // ---------------------------------------------------------
            HttpResponse res = new Http().send(req);

            Integer statusCode = res.getStatusCode();

            if (statusCode != 200 && statusCode != 201) {
                return new Map<String, Object>{
                    'success' => false,
                    'message' => 'Timesheet insert failed. Status: ' + statusCode
                };
            }

            return new Map<String, Object>{
                'success' => true,
                'statusCode' => statusCode,
                'message' => 'Timesheet inserted successfully',
                'brokenShiftsProcessed' => brokenShifts.size()
            };

        } catch (Exception e) {

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

            if (String.isBlank(refreshResponse)) {
                throw new AuraHandledException('Unable to refresh MYOB token');
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
                        hasMorePages = false;
                        System.debug('🏁 Reached the end of records');
                    } else {
                        currentPage++;
                    }
                    
                } else {
                    System.debug('❌ Error fetching page ' + (currentPage + 1) + ': ' + res.getStatusCode());
                    System.debug('❌ Error Body: ' + res.getBody());
                    throw new AuraHandledException('MYOB API Error on page ' + (currentPage + 1) + ': ' + res.getBody());
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

            return JSON.serialize(finalResponse);

        } catch (Exception e) {
            System.debug('❌ Error fetching MYOB invoices: ' + e.getMessage());
            System.debug('📍 Stack Trace: ' + e.getStackTraceString());
            
            // Return error response
            Map<String, Object> errorResponse = new Map<String, Object>();
            errorResponse.put('success', false);
            errorResponse.put('error', e.getMessage());
            errorResponse.put('access_token', accessToken);
            errorResponse.put('refresh_token', refreshToken);
            
            return JSON.serialize(errorResponse);
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