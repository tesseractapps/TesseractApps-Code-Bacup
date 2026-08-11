/**
 * ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
 * Class Name      : OZEDIController
 * Author          : Saran Kumar Reddy
 * Created Date    : Jun 25, 2026
 * Last Modified By: Saran Kumar Reddy
 * Last Modified On: Jul 28, 2026
 * Description     : This class implements for OZEDI Integration
 *                   
*/

public without sharing class OZEDIController {

    // ==========================================
    // Constants
    // ==========================================
    private static final String DEFAULT_COUNTRY = 'au';
    private static final String PAYMENT_METHOD_DIRECT_CREDIT = 'DirectCredit';
    private static final Integer MAX_MEMBERS_PER_REQUEST = 50;
    private static final String DEFAULT_BASE_URL = 'https://api-superstream.sandpit.ozedi.com.au';
    private static final Integer MAX_RETRY_ATTEMPTS = 3;
    private static final Integer RETRY_DELAY_MS = 5000; // 5 seconds

    /**
    * Authenticates with OZEDI and returns the Access Token.
    */
    public static String authenticateOZEDI() {

        System.debug(LoggingLevel.INFO, '===== OZEDI Authentication Started =====');

        // Read configuration from Custom Metadata
        OZEDI_Setting__mdt settings = OZEDI_Setting__mdt.getInstance('Default');

        if (settings == null) {
            throw new CalloutException('OZEDI Settings Custom Metadata record not found.');
        }

        if (String.isBlank(settings.Authentication_URL__c) ||
            String.isBlank(settings.Username__c) ||
            String.isBlank(settings.Password__c)) {

            throw new CalloutException(
                'OZEDI configuration is incomplete. Please verify the Custom Metadata record.'
            );
        }

        // Prepare Request
        HttpRequest request = new HttpRequest();
        request.setEndpoint(settings.Authentication_URL__c);
        request.setMethod('POST');
        request.setHeader('Content-Type', 'application/json');
        request.setTimeout(120000);

        Map<String, String> requestBody = new Map<String, String>{
            'username' => settings.Username__c,
            'password' => settings.Password__c
        };

        request.setBody(JSON.serialize(requestBody));

        try {

            Http http = new Http();
            HttpResponse response = http.send(request);

            System.debug(LoggingLevel.INFO,
                'Authentication Status Code : ' + response.getStatusCode());

            if (response.getStatusCode() != 200) {

                System.debug(LoggingLevel.ERROR,
                    'Authentication Failed : ' + response.getBody());

                throw new CalloutException(
                    'Authentication failed. Status Code: '
                    + response.getStatusCode()
                    + ', Response: '
                    + response.getBody()
                );
            }

            Map<String, Object> responseMap =
                (Map<String, Object>)JSON.deserializeUntyped(response.getBody());

            String accessToken = (String)responseMap.get('id_token');

            System.debug('accessToken >>>>>'+ accessToken);

            if (String.isBlank(accessToken)) {
                throw new CalloutException(
                    'Authentication succeeded but id_token was not found.'
                );
            }

            System.debug(LoggingLevel.INFO,
                'OZEDI Authentication Successful.');

            return accessToken;

        } catch (CalloutException ex) {

            System.debug(LoggingLevel.ERROR,
                'Callout Exception: ' + ex.getMessage());

            throw ex;

        } catch (Exception ex) {

            System.debug(LoggingLevel.ERROR,
                'Unexpected Exception: ' + ex.getMessage());

            throw new CalloutException(
                'Unexpected error during OZEDI authentication: '
                + ex.getMessage()
            );
        }
    }

    /**
    * Creates a new client in OZEDI for the current user's organisation.
    */
    @AuraEnabled
    public static String createClient() {

        System.debug(LoggingLevel.INFO, '===== OZEDI Create Client Started =====');

        // Get OZEDI configuration
        OZEDI_Setting__mdt settings = OZEDI_Setting__mdt.getInstance('Default');

        if (settings == null) {
            throw new CalloutException('OZEDI configuration not found.');
        }

        if (String.isBlank(settings.Client_Registration_URL__c)) {
            throw new CalloutException('Client Registration URL is missing.');
        }

        if (String.isBlank(settings.Account_Number__c)) {
            throw new CalloutException('Account Number is missing.');
        }

        // Authenticate and get Access Token
        String accessToken = authenticateOZEDI();

        // Get Current User
        User currentUser = [
            SELECT Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        if (String.isBlank(currentUser.Organization_Name__c)) {
            throw new AuraHandledException('Organization is not configured for the current user.');
        }

        // Get Organisation Record
        Organisation__c organisation = [
            SELECT Id,
                Name,
                Email__c,
                ABN__c,
                OZEDI_Client_Id__c
            FROM Organisation__c
            WHERE Name = :currentUser.Organization_Name__c
            LIMIT 1
        ];

        if (String.isBlank(organisation.Email__c)) {
            throw new AuraHandledException('Organisation Email is missing.');
        }

        if (String.isBlank(organisation.ABN__c)) {
            throw new AuraHandledException('Organisation ABN is missing.');
        }

        // Prepare Request
        HttpRequest request = new HttpRequest();
        request.setEndpoint(settings.Client_Registration_URL__c);
        request.setMethod('POST');
        request.setHeader('Authorization', 'Bearer ' + accessToken);
        request.setHeader('Content-Type', 'application/json');
        request.setTimeout(120000);

        Map<String, Object> requestBody = new Map<String, Object>{
            'account' => settings.Account_Number__c,
            'name' => organisation.Name,
            'email' => organisation.Email__c,
            'abn' => organisation.ABN__c,
            'contactType' => new List<String>{ 'NOTIFICATION' }
        };

        request.setBody(JSON.serialize(requestBody));

        System.debug(LoggingLevel.DEBUG,
            'Create Client Request: ' + JSON.serializePretty(requestBody));

        try {

            Http http = new Http();
            HttpResponse response = http.send(request);

            System.debug(LoggingLevel.INFO,
                'Status Code : ' + response.getStatusCode());

            System.debug(LoggingLevel.DEBUG,
                'Response : ' + response.getBody());

            if (response.getStatusCode() != 200 &&
                response.getStatusCode() != 201) {

                throw new CalloutException(
                    'Create Client Failed. Status Code: '
                    + response.getStatusCode()
                    + ', Response: '
                    + response.getBody()
                );
            }

            Map<String, Object> responseMap =
                (Map<String, Object>)JSON.deserializeUntyped(response.getBody());

            String clientId = String.valueOf(responseMap.get('client'));

            if (String.isNotBlank(clientId)) {

                organisation.OZEDI_Client_Id__c = clientId;
                update organisation;

                System.debug(LoggingLevel.INFO,
                    'Organisation updated with OZEDI Client Id.');
            }

            System.debug(LoggingLevel.INFO,
                '===== OZEDI Create Client Completed Successfully =====');

            return response.getBody();

        } catch (Exception ex) {

            System.debug(LoggingLevel.ERROR,
                'Create Client Exception: ' + ex.getMessage());

            throw new AuraHandledException(
                'Unable to create OZEDI Client. ' + ex.getMessage()
            );
        }
    }

    public static Boolean isValidABN(String abn) {
        if (String.isBlank(abn)) return false;
        abn = abn.replaceAll('\\D', '');
        if (abn.length() != 11) return false;

        Integer[] weights = new Integer[]{10,1,3,5,7,9,11,13,15,17,19};
        Integer sum = 0;
        for (Integer i = 0; i < 11; i++) {
            Integer digit = Integer.valueOf(abn.substring(i, i+1));
            if (i == 0) digit -= 1;
            sum += digit * weights[i];
        }
        return Math.mod(sum, 89) == 0;
    }

    @AuraEnabled
    public static String uploadMVR(Id employeeId) {
        
        System.debug('===== START uploadMVR =====');
        System.debug('Employee ID: ' + employeeId);
        Long startTime = DateTime.now().getTime();
        
        // Declare variables outside try-catch for scope
        String accessToken = null;
        Organisation__c org = null;
        Staff__c emp = null;
        HttpResponse res = null;
        String uploadUuid = null;
        String responseMessage = '';
        String errorDetails = '';
        Boolean hasErrors = false;
        String statusMessage = '';
        Boolean isUploadSuccessful = false;
        String currentStatus = 'UPLOADED'; // Default status
        String returnMessage = ''; // This will hold the final return value
        
         
            //==========================================
            // Step 1 - Authenticate
            //==========================================
            System.debug('Step 1: Starting OZEDI Authentication');
            Long authStartTime = DateTime.now().getTime();
            
            System.debug('Calling authenticateOZEDI() method...');
            accessToken = authenticateOZEDI();
            System.debug('Access Token retrieved successfully');
            
            Long authEndTime = DateTime.now().getTime();
            System.debug('Step 1 Complete - Auth Duration: ' + (authEndTime - authStartTime) + 'ms');
            
            //==========================================
            // Step 2 - Current User & Organisation
            //==========================================
            System.debug('Step 2: Querying Current User and Organisation');
            Long queryStartTime = DateTime.now().getTime();
            
            System.debug('Querying User with Id: ' + UserInfo.getUserId());
            User currentUser = [
                SELECT FirstName,
                    LastName,
                    Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
            ];
            System.debug('Current User Found: ' + currentUser.FirstName + ' ' + currentUser.LastName);
            System.debug('User Organization: ' + currentUser.Organization_Name__c);
            
            System.debug('Querying Organisation with Name: ' + currentUser.Organization_Name__c);
            org = [
                SELECT
                    Name,
                    Email__c,
                    ABN__c,
                    Contact_No__c,
                    OZEDI_Client_Id__c,
                    OZEDI_Account_Number__c,
                    Account_Number__c
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];
            System.debug('Organisation Found: ' + org.Name);
            System.debug('Organisation ABN: ' + org.ABN__c);
            System.debug('Organisation Client ID: ' + org.OZEDI_Client_Id__c);
            System.debug('Organisation Account Number: ' + org.Account_Number__c);
            System.debug('Organisation Contact No: ' + org.Contact_No__c);
            System.debug('Organisation Email: ' + org.Email__c);
            
            Long queryEndTime = DateTime.now().getTime();
            System.debug('Step 2 Complete - Query Duration: ' + (queryEndTime - queryStartTime) + 'ms');
            
            //==========================================
            // Step 3 - Staff
            //==========================================
            System.debug('Step 3: Querying Staff/Employee Record');
            Long staffQueryStartTime = DateTime.now().getTime();
            
            System.debug('Querying Staff with Id: ' + employeeId);
            emp = [
                SELECT
                    Name,
                    Last_Name__c,
                    Date_Of_Birth__c,
                    Address__Street__s,
                    Address__City__s,
                    Address__StateCode__s,
                    Address__CountryCode__s,
                    Address__PostalCode__s,
                    Gender__c,
                    Super_Fund_Name__c,
                    ESA__c,
                    Unique_Superannuation_Identifier__c,
                    Super_ABN__c,
                    Superannuation_Name__c,
                    Superannuation_Number__c,
                    OZEDI_Response__c,
                    OZEDI_Upload_UUID__c,
                    OZEDI_Upload_Date_Time__c
                FROM Staff__c
                WHERE Id = :employeeId
                LIMIT 1
            ];
            System.debug('Employee Found: ' + emp.Name + ' ' + emp.Last_Name__c);
            System.debug('Employee DOB: ' + emp.Date_Of_Birth__c);
            System.debug('Employee Gender: ' + emp.Gender__c);
            System.debug('Employee Super Fund: ' + emp.Superannuation_Name__c);
            System.debug('Employee Super ABN: ' + emp.Super_ABN__c);
            System.debug('Employee USI: ' + emp.Unique_Superannuation_Identifier__c);
            System.debug('Employee Super Number: ' + emp.Superannuation_Number__c);
            System.debug('Employee Address: ' + emp.Address__Street__s + ', ' + emp.Address__City__s + ', ' + emp.Address__StateCode__s + ' ' + emp.Address__PostalCode__s);
            System.debug('Employee Country: ' + emp.Address__CountryCode__s);
            System.debug('Employee Country: ' + emp.ESA__c);
            
            Long staffQueryEndTime = DateTime.now().getTime();
            System.debug('Step 3 Complete - Staff Query Duration: ' + (staffQueryEndTime - staffQueryStartTime) + 'ms');
            
            //==========================================
            // Validations
            //==========================================
            System.debug('Step 4: Validating Required Fields');
            Long validationStartTime = DateTime.now().getTime();
            
            System.debug('Validating Organisation ABN...');
            if(String.isBlank(org.ABN__c)) {
                System.debug('ERROR: Organisation ABN is blank');
                throw new AuraHandledException('Organisation ABN is mandatory.');
            }
            System.debug('Organisation ABN validated: ' + org.ABN__c);
            
            System.debug('Validating Organisation Name...');
            if(String.isBlank(org.Name)) {
                System.debug('ERROR: Organisation Name is blank');
                throw new AuraHandledException('Organisation Name is mandatory.');
            }
            System.debug('Organisation Name validated: ' + org.Name);
            
            System.debug('Validating Organisation ABN checksum...');
            if(!isValidABN(org.ABN__c)) {
                System.debug('ERROR: Organisation ABN fails checksum: ' + org.ABN__c);
                throw new AuraHandledException('Organisation ABN is invalid ' + org.ABN__c);
            }
            System.debug('Organisation ABN checksum validated: ' + org.ABN__c);
            
            System.debug('Validating Organisation Account Number...');
            if(String.isBlank(org.Account_Number__c)) {
                System.debug('ERROR: OZEDI Account Number is blank');
                throw new AuraHandledException('Organisation Account Number validated: ' + org.Account_Number__c);
            }
            System.debug('Organisation Account Number validated: ' + org.Account_Number__c);
            
            System.debug('Validating Super Fund Name...');
            if(String.isBlank(emp.Superannuation_Name__c)) {
                System.debug('ERROR: Super Fund Name is blank');
                throw new AuraHandledException('Super Fund Name is mandatory.');
            }
            System.debug('Super Fund Name validated: ' + emp.Superannuation_Name__c);
            
            System.debug('Validating Super ABN...');
            if (String.isBlank(String.valueOf(emp.Super_ABN__c))) {
                System.debug('ERROR: Super ABN is blank');
                throw new AuraHandledException('Super Fund ABN is mandatory.');
            }
            System.debug('Super ABN validated: ' + emp.Super_ABN__c);
            
            System.debug('Validating Super ABN checksum...');
            if(!isValidABN(String.valueOf(emp.Super_ABN__c))) {
                System.debug('ERROR: Super Fund ABN fails checksum: ' + emp.Super_ABN__c);
                throw new AuraHandledException('Super Fund ABN is invalid (fails ABN checksum): ' + emp.Super_ABN__c);
            }
            System.debug('Super ABN checksum validated: ' + emp.Super_ABN__c);
            
            /* System.debug('Validating USI...');
            if(String.isBlank(emp.Unique_Superannuation_Identifier__c)) {
                System.debug('ERROR: USI is blank');
                throw new AuraHandledException('Super Fund USI is mandatory.');
            } */
            System.debug('Super USI validated: ' + emp.Unique_Superannuation_Identifier__c);

            // ==========================================
            // CHECK 4: USI or ESA (At least one must be present)
            // ==========================================
            System.debug('Validating USI or ESA...');
            String usi = emp.Unique_Superannuation_Identifier__c;
            String esa = emp.ESA__c;

            if (String.isBlank(usi) && String.isBlank(esa)) {
                System.debug('ERROR: Both USI and ESA are blank');
                throw new AuraHandledException('Either Unique Superannuation Identifier (USI) or Electronic Service Address (ESA) is required for the super fund.');
            }

            if (String.isNotBlank(usi)) {
                System.debug('Super USI validated: ' + usi);
            }
            if (String.isNotBlank(esa)) {
                System.debug('Super ESA validated: ' + esa);
            }
            
            System.debug('Validating Employee Super Number...');
            if(String.isBlank(emp.Superannuation_Number__c)) {
                System.debug('ERROR: Superannuation Fund Member ID is mandatory');
                throw new AuraHandledException('Superannuation Fund Member ID is mandatory.');
            }
            System.debug('Super Number validated: ' + emp.Superannuation_Number__c);
            
            Long validationEndTime = DateTime.now().getTime();
            System.debug('Step 4 Complete - Validation Duration: ' + (validationEndTime - validationStartTime) + 'ms');
            System.debug('All required field validations PASSED');
            
            //==========================================
            // Phone
            //==========================================
            System.debug('Step 5: Processing Phone Number');
            String phoneServiceLine = '02';
            String senderPhone = '';
            String phoneArea = '';
            
            System.debug('Organisation Contact No: ' + (String.isNotBlank(org.Contact_No__c) ? org.Contact_No__c : 'BLANK'));
            
            if(!String.isBlank(org.Contact_No__c)){
                System.debug('Raw Phone Number: ' + org.Contact_No__c);
                String phone = org.Contact_No__c.replaceAll('\\D','');
                System.debug('Cleaned Phone Number (digits only): ' + phone);
                
                if(phone.startsWith('04')){
                    phoneServiceLine = '01';
                    senderPhone = phone.substring(2);
                    System.debug('Mobile phone detected - Service Line: ' + phoneServiceLine + ', Phone: ' + senderPhone);
                }
                else if(phone.startsWith('02')){
                    phoneServiceLine = '02';
                    senderPhone = phone.substring(2);
                    System.debug('Landline (02) detected - Service Line: ' + phoneServiceLine + ', Phone: ' + senderPhone);
                }
                else if(phone.startsWith('03') || phone.startsWith('07') || phone.startsWith('08')){
                    phoneServiceLine = '02';
                    senderPhone = phone.substring(2);
                    phoneArea = phone.substring(0, 2);
                    System.debug('Other area code detected - Service Line: ' + phoneServiceLine + ', Area: ' + phoneArea + ', Phone: ' + senderPhone);
                }
                else{
                    senderPhone = phone;
                    System.debug('Other phone number - Service Line: ' + phoneServiceLine + ', Phone: ' + senderPhone);
                }
            } else {
                System.debug('No Contact Number provided for Organisation');
            }
            
            System.debug('Final Phone Values - ServiceLine: ' + phoneServiceLine + ', Phone: ' + (String.isNotBlank(senderPhone) ? senderPhone : 'BLANK'));
            
            //==========================================
            // Gender
            //==========================================
            System.debug('Step 6: Processing Gender');
            String gender = '';
            
            System.debug('Original Gender value: ' + emp.Gender__c);
            
            if(emp.Gender__c == 'Male'){
                gender = 'M';
                System.debug('Gender mapped: Male -> M');
            }
            else if(emp.Gender__c == 'Female'){
                gender = 'F';
                System.debug('Gender mapped: Female -> F');
            }
            else{
                gender = emp.Gender__c;
                System.debug('Gender mapped (unchanged): ' + gender);
            }
            
            System.debug('Final Gender value: ' + gender);
            
            //==========================================
            // Build JSON according to OZEDI spec for MVR
            //==========================================
            System.debug('Step 7: Building Request JSON Payload for MVR');
            Long jsonBuildStartTime = DateTime.now().getTime();
            
            // Build the JSON string using concatenation
            String requestBody = 
                '{' +
                '"messageHeader":{' +
                    '"messageType":"MemberVerificationRequest"' +
                '},' +
                
                '"sender":{' +
                    '"abn":"' + escapeJson(org.ABN__c) + '",' +
                    '"organisationalName":"' + escapeJson(org.Name) + '",' +
                    '"emailAddress":"' + escapeJson(org.Email__c) + '",' +
                    '"givenName":"' + escapeJson(currentUser.FirstName) + '",' +
                    '"familyName":"' + escapeJson(currentUser.LastName) + '"';
            
            // Add sender phone if available
            if(String.isNotBlank(senderPhone)) {
                requestBody += ',' +
                    '"phone":{' +
                        '"phoneServiceLine":"' + escapeJson(phoneServiceLine) + '"';
                
                if(String.isNotBlank(phoneArea)) {
                    requestBody += ',"phoneArea":"' + escapeJson(phoneArea) + '"';
                }
                
                requestBody += ',"phone":"' + escapeJson(senderPhone) + '"' +
                    '}';
            }
            
            requestBody += 
                '},' +
                
                '"receiver":{' +
                    '"abn":"' + escapeJson(String.valueOf(emp.Super_ABN__c)) + '",' +
                    '"organisationalName":"' + escapeJson(emp.Superannuation_Name__c) + '",' +
                    '"uniqueSuperannuationIdentifier":"' + escapeJson(emp.Unique_Superannuation_Identifier__c) + '",' +
                    '"targetElectronicServiceAddress":"' + escapeJson(emp.ESA__c) + '"' +
                '},' +
                
                '"employers":[{';
            
            // Employer details
            requestBody += 
                    '"abn":"' + escapeJson(org.ABN__c) + '",' +
                    '"organisationalName":"' + escapeJson(org.Name) + '",' +
                    
                    '"members":[{';
            
            // Member details
            String birthDate = emp.Date_Of_Birth__c != null ? String.valueOf(emp.Date_Of_Birth__c) : '';
            
            requestBody += 
                        '"birthDate":"' + escapeJson(birthDate) + '",' +
                        '"superannuationFundMember":"' + escapeJson(emp.Superannuation_Number__c) + '",' +
                        '"taxFileNumberNotProvided":"N",' +
                        '"sex":"' + escapeJson(gender) + '",' +
                        
                        '"address":{' +
                            '"addressDetailsUsage":"RES",' +
                            '"addressLine1":"' + escapeJson(emp.Address__Street__s) + '"';
            
            // Add optional address fields
            if(String.isNotBlank(emp.Address__City__s)) {
                requestBody += ',"suburb":"' + escapeJson(emp.Address__City__s) + '"';
            }
            if(String.isNotBlank(emp.Address__StateCode__s)) {
                requestBody += ',"state":"' + escapeJson(emp.Address__StateCode__s) + '"';
            }
            if(String.isNotBlank(emp.Address__PostalCode__s)) {
                requestBody += ',"postCode":"' + escapeJson(emp.Address__PostalCode__s) + '"';
            }
            
            String countryCode = String.valueOf(emp.Address__CountryCode__s);
            if(String.isNotBlank(countryCode)) {
                requestBody += ',"country":"' + escapeJson(countryCode.toLowerCase()) + '"';
            } else {
                requestBody += ',"country":"' + DEFAULT_COUNTRY + '"';
            }
            
            requestBody += 
                        '},' +
                        
                        '"name":{' +
                            '"givenName":"' + escapeJson(emp.Name) + '",' +
                            '"familyName":"' + escapeJson(emp.Last_Name__c) + '"' +
                        '}' +
                    '}]' +
                '}]' +
            '}';
            
            System.debug('================ REQUEST JSON START ================');
            System.debug(requestBody);
            System.debug('================ REQUEST JSON END ==================');
            System.debug('JSON Payload Size: ' + requestBody.length() + ' characters');
            
            // Log ABN consistency check
            System.debug('ABN Consistency Check:');
            System.debug('  Sender ABN: ' + org.ABN__c);
            System.debug('  Employer ABN: ' + org.ABN__c);
            System.debug('  Match: YES (must match for MVR)');
            System.debug('  Receiver ABN: ' + emp.Super_ABN__c);
            
            Long jsonBuildEndTime = DateTime.now().getTime();
            System.debug('Step 7 Complete - JSON Build Duration: ' + (jsonBuildEndTime - jsonBuildStartTime) + 'ms');
            
            //==========================================
            // Call OZEDI - Upload Data from API Body
            //==========================================
            System.debug('Step 8: Making OZEDI API Call for MVR Upload (Body Upload)');
            Long apiCallStartTime = DateTime.now().getTime();
            OZEDI_Setting__mdt settings = OZEDI_Setting__mdt.getInstance('Default');

            if (settings == null) {
                throw new CalloutException('OZEDI configuration not found.');
            }

            if (String.isBlank(settings.Upload_MVR_URL__c)) {
                throw new CalloutException('Member Verification Request URL is missing.');
            }

            if (String.isBlank(settings.Account_Number__c)) {
                throw new CalloutException('Account Number is missing.');
            }
            
            String accountNumber = settings.Account_Number__c;
            
            // Body upload endpoint format with autoSendWhenReady=false
            String endpoint = settings.Upload_MVR_URL__c
                + accountNumber + '/'  // Account Number
                + org.OZEDI_Client_Id__c + '/'  // Client ID
                + org.ABN__c  // Sender ABN
                + '?autoSendWhenReady=false';  // false - Manual send required
            
            System.debug('Endpoint URL: ' + endpoint);
            System.debug('Account Number: ' + accountNumber);
            System.debug('Client ID: ' + org.OZEDI_Client_Id__c);
            System.debug('Sender ABN: ' + org.ABN__c);
            System.debug('autoSendWhenReady: false (Manual send required)');
            
            HttpRequest req = new HttpRequest();
            req.setEndpoint(endpoint);
            req.setMethod('POST');
            req.setHeader('Authorization','Bearer ' + accessToken);
            req.setHeader('Content-Type','application/json');
            req.setBody(requestBody);
            
            System.debug('Request Headers:');
            System.debug('  Authorization: Bearer [TOKEN]');
            System.debug('  Content-Type: application/json');
            System.debug('Request Body Length: ' + req.getBody().length() + ' characters');
            
            System.debug('Sending HTTP request...');
            Http http = new Http();
            res = http.send(req);
            
            Long apiCallEndTime = DateTime.now().getTime();
            System.debug('Step 8 Complete - API Call Duration: ' + (apiCallEndTime - apiCallStartTime) + 'ms');
            
            System.debug('===== RESPONSE =====');
            System.debug('Status Code: ' + res.getStatusCode());
            System.debug('Status: ' + res.getStatus());
            System.debug('Status Code Category: ' + (res.getStatusCode() >= 200 && res.getStatusCode() < 300 ? 'Success' : 'Error'));
            System.debug('Response Body Length: ' + (res.getBody() != null ? res.getBody().length() : 0) + ' characters');
            System.debug('Response Body:');
            System.debug(res.getBody());
            
            // Store the full response for later saving
            responseMessage = res.getBody();
            
            // Parse response to extract uploadUuid
            try {
                System.debug('Attempting to parse response as JSON...');
                Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(res.getBody());
                System.debug('Response parsed successfully');
                System.debug('Response keys: ' + responseMap.keySet());
                
                // Check for errors in response
                if(responseMap.containsKey('errors')) {
                    System.debug('ERROR: Response contains errors: ' + responseMap.get('errors'));
                    String errorMessage = 'OZEDI Error: ' + JSON.serialize(responseMap.get('errors'));
                    responseMessage = errorMessage;
                    errorDetails = errorMessage;
                    hasErrors = true;
                    
                    // Format errors for display and RETURN them
                    returnMessage = formatErrorMessages(responseMap.get('errors'));
                }
                // OZEDI returns uploadUuid in the response
                else if(responseMap.containsKey('uploadUuid')) {
                    uploadUuid = (String)responseMap.get('uploadUuid');
                    
                    System.debug('==========================================');
                    System.debug('Upload UUID: ' + uploadUuid);
                    System.debug('SUCCESS: Member Verification Request uploaded successfully');
                    System.debug('==========================================');
                    
                    // ==========================================================
                    // Step 9: AUTO-PROCESS MVR WORKFLOW (SYNC + BATCH)
                    // ==========================================================
                    System.debug('Step 9: Auto-processing MVR workflow');
                    
                    // 9a: Quick status check and process if ready
                    try {
                        System.debug('9a: Quick status check...');
                        Map<String, Object> statusResult = waitForMVRProcessing(uploadUuid);
                        
                        currentStatus = (String)statusResult.get('uploadStatus');
                        System.debug('Current Status: ' + currentStatus);
                        
                        // 9b: If ready, send remittance immediately
                        if (currentStatus == 'UPLOAD_READY' || currentStatus == 'UPLOAD_SEND_SUCCESS') {
                            System.debug('9b: Sending remittance immediately...');
                            Map<String, Object> sendResult = sendMVRRemittance(uploadUuid);
                            
                            if ((Boolean)sendResult.get('success')) {
                                System.debug('✅ Remittance sent successfully');
                                statusMessage = 'MVR processed and remittance sent successfully';
                                isUploadSuccessful = true;
                                currentStatus = 'UPLOAD_SEND_SUCCESS';
                                
                                // Get final status for response
                                try {
                                    HttpResponse statusResponse = getUploadStatus(uploadUuid);
                                    if (statusResponse.getStatusCode() == 200) {
                                        responseMessage = statusResponse.getBody();
                                    }
                                } catch (Exception statusEx) {
                                    System.debug('Status check after send: ' + statusEx.getMessage());
                                }
                                
                            } else {
                                String sendError = (String)sendResult.get('message');
                                System.debug('❌ Remittance send failed: ' + sendError);
                                statusMessage = 'Upload successful but remittance send failed: ' + sendError;
                                hasErrors = true;
                                errorDetails = sendError;
                                isUploadSuccessful = false;
                                String shortError = extractShortErrorMessage(sendError);
                                returnMessage = 'Remittance send failed: ' + shortError;
                            }
                            
                        } else if (currentStatus == 'UPLOAD_PRE_PROCESSING') {
                            System.debug('⏳ MVR still processing - Batch will handle monitoring');
                            statusMessage = 'MVR uploaded and being processed by OZEDI. The system will monitor automatically.';
                            isUploadSuccessful = true;
                            returnMessage = 'Upload successful. UUID: ' + uploadUuid + '. Status: ' + currentStatus;
                            
                        } else if (currentStatus == 'UPLOAD_FAILED' || currentStatus == 'UPLOAD_PRE_PROCESSING_FAILED') {
                            String errorMsg = (String)statusResult.get('errorDetails');
                            System.debug('❌ Processing failed: ' + errorMsg);
                            statusMessage = 'MVR processing failed';
                            hasErrors = true;
                            errorDetails = errorMsg;
                            isUploadSuccessful = false;
                            
                            // Get detailed errors
                            HttpResponse errorResponse = getUploadErrors(uploadUuid);
                            if (errorResponse.getStatusCode() == 200) {
                                String detailedErrors = errorResponse.getBody();
                                errorDetails = detailedErrors;
                                returnMessage = formatRawErrors(detailedErrors);
                            } else {
                                String shortError = extractShortErrorMessage(errorMsg);
                                returnMessage = 'MVR processing failed: ' + shortError;
                            }
                            
                        } else {
                            System.debug('Status: ' + currentStatus);
                            statusMessage = 'MVR status: ' + currentStatus + ' - Batch will monitor automatically.';
                            isUploadSuccessful = true;
                            returnMessage = 'Upload successful. UUID: ' + uploadUuid + '. Status: ' + currentStatus;
                        }
                        
                    } catch (Exception autoProcessEx) {
                        System.debug('Auto-processing error: ' + autoProcessEx.getMessage());
                        // Don't fail the upload - the batch will handle it
                        statusMessage = 'MVR uploaded. The system will monitor processing automatically.';
                        isUploadSuccessful = true;
                        returnMessage = 'Upload successful. UUID: ' + uploadUuid + '. Status: ' + currentStatus;
                        // Log the error but continue
                        System.debug('Continuing despite error: ' + autoProcessEx.getMessage());
                    }
                    
                    //==========================================
                    // SAVE RESPONSE TO STAFF RECORD (FORMATTED)
                    //==========================================
                    if (String.isNotBlank(uploadUuid)) {
                        try {
                            System.debug('Saving OZEDI response to Staff record...');
                            
                            Staff__c staffToUpdate = [SELECT Id, OZEDI_Response__c, OZEDI_Upload_UUID__c, OZEDI_Upload_Date_Time__c
                                                    FROM Staff__c 
                                                    WHERE Id = :employeeId 
                                                    LIMIT 1];
                            
                            // Build formatted response with current status
                            String formattedResponse = buildFormattedMVRResponse(
                                uploadUuid, 
                                currentStatus, 
                                DateTime.now()
                            );
                            
                            staffToUpdate.OZEDI_Response__c = formattedResponse;
                            System.debug('OZEDI_Response__c updated with formatted response');
                            
                            if (String.isNotBlank(uploadUuid)) {
                                staffToUpdate.OZEDI_Upload_UUID__c = uploadUuid;
                                System.debug('OZEDI_Upload_UUID__c updated with: ' + uploadUuid);
                            }
                            
                            if (String.isNotBlank(uploadUuid) && !hasErrors) {
                                staffToUpdate.OZEDI_Upload_Date_Time__c = DateTime.now();
                                System.debug('OZEDI_Upload_Date_Time__c updated');
                            }
                            
                            update staffToUpdate;
                            System.debug('Staff record updated successfully. ID: ' + staffToUpdate.Id);
                            
                            // Create activity log
                            createStaffPayrollActivity(
                                null,
                                'MVR Upload',
                                'MVR uploaded. Status: ' + statusMessage + (hasErrors ? ' (with errors)' : ''),
                                uploadUuid,
                                DateTime.now()
                            );
                            
                        } catch(Exception e) {
                            System.debug('ERROR saving response to Staff record: ' + e.getMessage());
                        }
                    }
                    
                    // Note: The batch class OZEDIMVRMonitorBatch will handle ongoing monitoring
                    
                    // If no error was set, set success message
                    if (String.isBlank(returnMessage)) {
                        returnMessage = 'Upload successful. UUID: ' + uploadUuid + '. Status: ' + statusMessage;
                    }
                    
                } else {
                    System.debug('WARNING: Response does not contain uploadUuid');
                    if(responseMap.containsKey('message')) {
                        String message = (String)responseMap.get('message');
                        System.debug('Response message: ' + message);
                        responseMessage = 'Message: ' + message + '\nResponse: ' + res.getBody();
                    }
                    isUploadSuccessful = false;
                    
                    if(responseMap.containsKey('error')) {
                        String errorMsg = (String)responseMap.get('error');
                        returnMessage = 'Upload Failed: ' + errorMsg;
                    } else {
                        returnMessage = 'Upload Failed: No upload UUID returned. Response: ' + res.getBody();
                    }
                }
                
            } catch(Exception e) {
                System.debug('Error parsing response: ' + e.getMessage());
                if(res.getStatusCode() != 200) {
                    String errorMsg = 'OZEDI API Error: Status ' + res.getStatusCode() + ' - ' + res.getStatus();
                    if(res.getBody() != null) {
                        errorMsg += '\nResponse: ' + res.getBody();
                    }
                    responseMessage = errorMsg;
                    errorDetails = errorMsg;
                    hasErrors = true;
                    isUploadSuccessful = false;
                    returnMessage = errorMsg;
                } else if(e instanceof AuraHandledException) {
                    returnMessage = e.getMessage();
                } else {
                    returnMessage = 'Error processing response: ' + e.getMessage();
                }
            }
            
            Long endTime = DateTime.now().getTime();
            System.debug('===== END uploadMVR =====');
            System.debug('Total Method Duration: ' + (endTime - startTime) + 'ms');
            System.debug('HTTP Status: ' + res.getStatusCode() + ' - ' + res.getStatus());
            
            if(uploadUuid != null) {
                System.debug('SUCCESS: MVR Upload UUID = ' + uploadUuid);
            }
            
            // Return the message (either success or error)
            return returnMessage;
            
         
    }


    /**
     * Extracts a short error message for display in toast notifications
     */
    public static String extractShortErrorMessage(String fullError) {
        if (String.isBlank(fullError)) {
            return 'Unknown error occurred.';
        }
        
        try {
            // Try to parse as JSON and extract first error
            Object parsed = JSON.deserializeUntyped(fullError);
            
            if (parsed instanceof List<Object>) {
                List<Object> errors = (List<Object>)parsed;
                if (!errors.isEmpty() && errors.get(0) instanceof Map<String, Object>) {
                    Map<String, Object> firstError = (Map<String, Object>)errors.get(0);
                    
                    // Try to get short description
                    String shortDesc = getErrorField(firstError, new List<String>{'shortDesc', 'Short Desc', 'description'});
                    if (String.isNotBlank(shortDesc)) {
                        // Clean up the description
                        shortDesc = shortDesc.replaceAll('^Error\\s+\\d+:', '').trim();
                        if (shortDesc.length() > 60) {
                            shortDesc = shortDesc.substring(0, 60) + '...';
                        }
                        return shortDesc;
                    }
                    
                    // Try to get error code
                    String errorCode = getErrorField(firstError, new List<String>{'errorCode', 'Error Code', 'code'});
                    if (String.isNotBlank(errorCode)) {
                        return 'Error Code: ' + errorCode;
                    }
                }
            } else if (parsed instanceof Map<String, Object>) {
                Map<String, Object> errorMap = (Map<String, Object>)parsed;
                
                // Try common error fields
                String message = getErrorField(errorMap, new List<String>{'message', 'error', 'errorMessage'});
                if (String.isNotBlank(message)) {
                    if (message.length() > 60) {
                        message = message.substring(0, 60) + '...';
                    }
                    return message;
                }
            }
            
            // If JSON parsing fails, take first line or first 60 characters
            if (fullError.contains('\n')) {
                String firstLine = fullError.split('\n')[0];
                if (firstLine.length() > 60) {
                    return firstLine.substring(0, 60) + '...';
                }
                return firstLine;
            }
            
            if (fullError.length() > 60) {
                return fullError.substring(0, 60) + '...';
            }
            
            return fullError;
            
        } catch (Exception e) {
            // If any error occurs, return a generic message
            return 'Error processing request. Please check OZEDI_Response__c field.';
        }
    }


    // ==========================================
    // BUILD FORMATTED MVR RESPONSE
    // ==========================================
    public static String buildFormattedMVRResponse(String uploadUuid, String status, DateTime timestamp) {
        
        String formattedResponse = '';
        
        // Header
        formattedResponse += '================= OZEDI MVR RESPONSE =================\n';
        formattedResponse += 'Timestamp: ' + timestamp.format() + '\n';
        formattedResponse += 'Upload UUID: ' + uploadUuid + '\n';
        formattedResponse += 'Upload Status: ' + status + '\n';
        formattedResponse += '\n';
        
        // Status line
        formattedResponse += 'Status: ' + status + '\n';
        formattedResponse += '========================================================\n';
        
        return formattedResponse;
    }

    // ==========================================
    // Helper Methods for Error Formatting
    // ==========================================

    /**
    * Formats error messages for display in Toast notifications
    * Handles multiple errors and extracts field information
    */
    public static String formatErrorMessages(Object errorsObject) {
        String formattedMessage = '';
        Integer errorCount = 0;
        
        try {
            List<Object> errorList = new List<Object>();
            
            // Handle different error formats
            if(errorsObject instanceof List<Object>) {
                errorList = (List<Object>)errorsObject;
            } else if(errorsObject instanceof Map<String, Object>) {
                errorList.add(errorsObject);
            } else if(errorsObject instanceof String) {
                // Try to parse string as JSON
                try {
                    Object parsed = JSON.deserializeUntyped((String)errorsObject);
                    if(parsed instanceof List<Object>) {
                        errorList = (List<Object>)parsed;
                    } else if(parsed instanceof Map<String, Object>) {
                        errorList.add(parsed);
                    }
                } catch(Exception e) {
                    return 'Upload Failed: ' + (String)errorsObject;
                }
            } else {
                return 'Upload Failed: ' + JSON.serialize(errorsObject);
            }
            
            // Process each error
            for(Integer i = 0; i < errorList.size(); i++) {
                Map<String, Object> error = (Map<String, Object>)errorList[i];
                errorCount++;
                
                // Extract error details - handle different field names
                String errorCode = getErrorField(error, new List<String>{'errorCode', 'Error Code', 'error_code', 'code'});
                String shortDesc = getErrorField(error, new List<String>{'shortDesc', 'Short Desc', 'short_desc', 'description'});
                String longDesc = getErrorField(error, new List<String>{'longDesc', 'Long Desc', 'long_desc', 'details', 'message'});
                String partId = getErrorField(error, new List<String>{'partId', 'Part ID', 'part_id', 'part'});
                String errorNo = getErrorField(error, new List<String>{'errorNo', 'Error No', 'error_no', 'number'});
                
                // Clean up shortDesc - remove extra formatting
                String cleanShortDesc = shortDesc;
                if (String.isNotBlank(cleanShortDesc)) {
                    // Remove leading/trailing spaces
                    cleanShortDesc = cleanShortDesc.trim();
                    // Remove any "Error X:" prefix if present
                    cleanShortDesc = cleanShortDesc.replaceAll('^Error\\s+\\d+:', '').trim();
                    // Remove any leading dashes or bullet points
                    cleanShortDesc = cleanShortDesc.replaceAll('^[-•]\\s*', '').trim();
                }
                
                // Clean up longDesc - remove extra formatting and clean up values
                String cleanLongDesc = longDesc;
                if (String.isNotBlank(cleanLongDesc)) {
                    cleanLongDesc = cleanLongDesc.trim();
                    // Remove any "R1 Member" or similar prefixes
                    cleanLongDesc = cleanLongDesc.replaceAll('^R\\d+\\s+Member\\s+', '').trim();
                    cleanLongDesc = cleanLongDesc.replaceAll('^Error\\s+\\d+:', '').trim();
                    cleanLongDesc = cleanLongDesc.replaceAll('^[-•]\\s*', '').trim();
                }
                
                // Clean up errorCode
                String cleanErrorCode = errorCode;
                if (String.isNotBlank(cleanErrorCode)) {
                    cleanErrorCode = cleanErrorCode.trim();
                }
                
                // Build user-friendly error message
                if (errorCount == 1) {
                    formattedMessage += 'Error ' + errorCount + ':\n';
                } else {
                    formattedMessage += '\nError ' + errorCount + ':\n';
                }
                
                if (String.isNotBlank(cleanShortDesc)) {
                    formattedMessage += '  • Issue: ' + cleanShortDesc + '\n';
                }
                
                // Clean up longDesc to extract clean field information
                String fieldInfo = extractCleanFieldInfo(cleanLongDesc, cleanShortDesc);
                if (String.isNotBlank(fieldInfo)) {
                    formattedMessage += '  • Details: ' + fieldInfo + '\n';
                } else if (String.isNotBlank(cleanLongDesc)) {
                    formattedMessage += '  • Details: ' + cleanLongDesc + '\n';
                }
                
                if (String.isNotBlank(cleanErrorCode)) {
                    formattedMessage += '  • Error Code: ' + cleanErrorCode + '\n';
                }
                
                // Extract affected fields from long description
                String affectedFields = extractAffectedFields(cleanLongDesc);
                if (String.isNotBlank(affectedFields)) {
                    formattedMessage += '  • Affected Fields: ' + affectedFields + '\n';
                }
            }
            
            // If no errors were processed but we had an error object
            if(errorCount == 0) {
                formattedMessage += 'Unknown error occurred. Please check the full response for details.\n';
                formattedMessage += 'Response: ' + JSON.serialize(errorsObject);
            }
            
        } catch(Exception e) {
            System.debug('Error parsing error messages: ' + e.getMessage());
            System.debug('Stack trace: ' + e.getStackTraceString());
            return 'Upload Failed. Please check the OZEDI_Response__c field for details.\nOriginal error: ' + e.getMessage();
        }
        
        return formattedMessage;
    }

    /**
     * Extracts clean field information from error description
     */
    public static String extractCleanFieldInfo(String longDesc, String shortDesc) {
        if (String.isBlank(longDesc) && String.isBlank(shortDesc)) return '';
        
        String text = longDesc;
        if (String.isBlank(text)) text = shortDesc;
        
        // Remove any prefixes like "R1 Member"
        text = text.replaceAll('^R\\d+\\s+Member\\s+', '').trim();
        
        // Look for specific patterns
        List<String> cleanInfo = new List<String>();
        
        // Check for TFN
        if (text.contains('TFN') || text.contains('Tax File Number')) {
            Pattern tfnPattern = Pattern.compile('TFN\\s+([0-9]+)');
            Matcher tfnMatcher = tfnPattern.matcher(text);
            if (tfnMatcher.find()) {
                cleanInfo.add('The Tax File Number ' + tfnMatcher.group(1) + ' is invalid');
            } else {
                cleanInfo.add('The Tax File Number provided is invalid');
            }
        }
        
        // Check for ABN
        if (text.contains('ABN') || text.contains('Australian Business Number')) {
            Pattern abnPattern = Pattern.compile('ABN\\s+([0-9]+)');
            Matcher abnMatcher = abnPattern.matcher(text);
            if (abnMatcher.find()) {
                cleanInfo.add('The ABN ' + abnMatcher.group(1) + ' is invalid');
            } else {
                cleanInfo.add('The ABN provided is invalid');
            }
        }
        
        // Check for USI
        if (text.contains('USI') || text.contains('Unique Superannuation Identifier')) {
            cleanInfo.add('The USI provided is invalid');
        }
        
        // Check for Member ID
        if (text.contains('Member') || text.contains('superannuationFundMember')) {
            cleanInfo.add('The Member ID provided is invalid');
        }
        
        // Check for Fund Name
        if (text.contains('Fund') && !text.contains('Member')) {
            cleanInfo.add('The Super Fund Name is invalid');
        }
        
        // Check for Date of Birth
        if (text.contains('birthDate') || text.contains('Date of Birth') || text.contains('DOB')) {
            cleanInfo.add('The Date of Birth is invalid');
        }
        
        // Check for Address
        if (text.contains('address') || text.contains('Address')) {
            if (text.contains('Line1') || text.contains('Street')) {
                cleanInfo.add('The Address (Street) is invalid');
            } else if (text.contains('suburb') || text.contains('City')) {
                cleanInfo.add('The Address (Suburb/City) is invalid');
            } else if (text.contains('state') || text.contains('State')) {
                cleanInfo.add('The Address (State) is invalid');
            } else if (text.contains('postCode') || text.contains('Postal')) {
                cleanInfo.add('The Address (Postal Code) is invalid');
            } else {
                cleanInfo.add('The Address is invalid');
            }
        }
        
        // Check for Name
        if (text.contains('givenName') || text.contains('familyName') || text.contains('Name')) {
            if (text.contains('givenName') || text.contains('First Name')) {
                cleanInfo.add('The First Name is invalid');
            } else if (text.contains('familyName') || text.contains('Last Name')) {
                cleanInfo.add('The Last Name is invalid');
            } else {
                cleanInfo.add('The Name is invalid');
            }
        }
        
        // Check for Gender/Sex
        if (text.contains('sex') || text.contains('Gender')) {
            cleanInfo.add('The Gender/Sex is invalid');
        }
        
        return String.join(cleanInfo, '; ');
    }

    /**
     * Extracts affected fields from error description
     */
    public static String extractAffectedFields(String longDesc) {
        if (String.isBlank(longDesc)) return '';
        
        List<String> fields = new List<String>();
        String text = longDesc;
        
        // Check for TFN
        if (text.contains('TFN') || text.contains('Tax File Number')) {
            Pattern tfnPattern = Pattern.compile('TFN\\s+([0-9]+)');
            Matcher tfnMatcher = tfnPattern.matcher(text);
            if (tfnMatcher.find()) {
                fields.add('Tax File Number (TFN): ' + tfnMatcher.group(1));
            } else {
                fields.add('Tax File Number (TFN)');
            }
        }
        
        // Check for ABN
        if (text.contains('ABN') || text.contains('Australian Business Number')) {
            Pattern abnPattern = Pattern.compile('ABN\\s+([0-9]+)');
            Matcher abnMatcher = abnPattern.matcher(text);
            if (abnMatcher.find()) {
                fields.add('Australian Business Number (ABN): ' + abnMatcher.group(1));
            } else {
                fields.add('Australian Business Number (ABN)');
            }
        }
        
        // Check for USI
        if (text.contains('USI') || text.contains('Unique Superannuation Identifier')) {
            fields.add('Unique Superannuation Identifier (USI)');
        }
        
        // Check for Superannuation Fund Member
        if (text.contains('Member') || text.contains('superannuationFundMember')) {
            fields.add('Superannuation Fund Member ID');
        }
        
        // Check for Fund Name
        if (text.contains('Fund') && !text.contains('Superannuation Fund Member')) {
            fields.add('Super Fund Name');
        }
        
        // Check for R1 part reference
        if (text.contains('R1')) {
            fields.add('Member/Employee Record (R1)');
        }
        
        // Check for H2 part reference
        if (text.contains('H2')) {
            fields.add('Receiver/Organisation Header (H2)');
        }
        
        // Check for H1 part reference
        if (text.contains('H1')) {
            fields.add('Sender/Organisation Header (H1)');
        }
        
        return String.join(fields, ', ');
    }

    /**
    * Helper method to get error field from map with multiple possible keys
    */
    public static String getErrorField(Map<String, Object> errorMap, List<String> possibleKeys) {
        for(String key : possibleKeys) {
            if(errorMap.containsKey(key) && errorMap.get(key) != null) {
                return String.valueOf(errorMap.get(key));
            }
        }
        return '';
    }

    /**
    * Extracts specific field information from error descriptions
    */
    public static String extractFieldInfo(String longDesc) {
        if(String.isBlank(longDesc)) return '';
        
        List<String> fieldDetails = new List<String>();
        
        // Check for TFN related errors
        if(longDesc.contains('TFN') || longDesc.contains('Tax File Number')) {
            // Extract TFN number
            List<String> tfnMatches = extractPattern(longDesc, 'TFN');
            List<String> taxFileMatches = extractPattern(longDesc, 'Tax File Number');
            
            if(!tfnMatches.isEmpty()) {
                fieldDetails.add('Tax File Number (TFN): ' + tfnMatches[0]);
            } else if(!taxFileMatches.isEmpty()) {
                fieldDetails.add('Tax File Number (TFN): ' + taxFileMatches[0]);
            } else {
                fieldDetails.add('Tax File Number (TFN)');
            }
        }
        
        // Check for ABN related errors
        if(longDesc.contains('ABN') || longDesc.contains('Australian Business Number')) {
            List<String> abnMatches = extractPattern(longDesc, 'ABN');
            if(!abnMatches.isEmpty()) {
                fieldDetails.add('Australian Business Number (ABN): ' + abnMatches[0]);
            } else {
                fieldDetails.add('Australian Business Number (ABN)');
            }
        }
        
        // Check for USI related errors
        if(longDesc.contains('USI') || longDesc.contains('Unique Superannuation Identifier')) {
            List<String> usiMatches = extractPattern(longDesc, 'USI');
            if(!usiMatches.isEmpty()) {
                fieldDetails.add('Unique Superannuation Identifier (USI): ' + usiMatches[0]);
            } else {
                fieldDetails.add('Unique Superannuation Identifier (USI)');
            }
        }
        
        // Check for Superannuation Fund Member related errors
        if(longDesc.contains('Member') || longDesc.contains('superannuationFundMember')) {
            List<String> superMatches = extractPattern(longDesc, 'Member');
            if(!superMatches.isEmpty() && superMatches[0].length() > 5) {
                fieldDetails.add('Superannuation Fund Member ID: ' + superMatches[0]);
            } else {
                fieldDetails.add('Superannuation Fund Member ID');
            }
        }
        
        // Check for Fund Name related errors
        if(longDesc.contains('Fund') && !longDesc.contains('Superannuation Fund Member')) {
            List<String> fundMatches = extractPattern(longDesc, 'Fund');
            if(!fundMatches.isEmpty() && fundMatches[0].length() >= 3) {
                fieldDetails.add('Super Fund Name: ' + fundMatches[0]);
            } else {
                fieldDetails.add('Super Fund Name');
            }
        }
        
        // Check for Birth Date related errors
        if(longDesc.contains('birthDate') || longDesc.contains('Date of Birth') || longDesc.contains('DOB')) {
            fieldDetails.add('Date of Birth');
        }
        
        // Check for Address related errors
        if(longDesc.contains('address') || longDesc.contains('Address')) {
            if(longDesc.contains('Line1') || longDesc.contains('Street')) {
                fieldDetails.add('Address (Street)');
            } else if(longDesc.contains('suburb') || longDesc.contains('City')) {
                fieldDetails.add('Address (Suburb/City)');
            } else if(longDesc.contains('state') || longDesc.contains('State')) {
                fieldDetails.add('Address (State)');
            } else if(longDesc.contains('postCode') || longDesc.contains('Postal')) {
                fieldDetails.add('Address (Postal Code)');
            } else {
                fieldDetails.add('Address');
            }
        }
        
        // Check for Name related errors
        if(longDesc.contains('givenName') || longDesc.contains('familyName') || longDesc.contains('Name')) {
            if(longDesc.contains('givenName') || longDesc.contains('First Name')) {
                fieldDetails.add('Given Name (First Name)');
            } else if(longDesc.contains('familyName') || longDesc.contains('Last Name')) {
                fieldDetails.add('Family Name (Last Name)');
            } else {
                fieldDetails.add('Name');
            }
        }
        
        // Check for Gender/Sex related errors
        if(longDesc.contains('sex') || longDesc.contains('Gender')) {
            fieldDetails.add('Gender/Sex');
        }
        
        // Check for Sender/Organisation fields
        if(longDesc.contains('sender') || longDesc.contains('Sender')) {if(longDesc.contains('ABN')) {fieldDetails.add('Sender ABN (Organisation ABN)');} else if(longDesc.contains('Name') || longDesc.contains('organisationalName')) {fieldDetails.add('Sender Organisation Name');} else if(longDesc.contains('email')) {fieldDetails.add('Sender Email Address');} else if(longDesc.contains('phone')) {fieldDetails.add('Sender Phone Number');} else {fieldDetails.add('Sender/Organisation Details');
            }
        }
        
        // Check for Receiver/Fund fields
        if(longDesc.contains('receiver') || longDesc.contains('Receiver')) {if(longDesc.contains('ABN')) {fieldDetails.add('Receiver ABN (Super Fund ABN)');} else if(longDesc.contains('Name') || longDesc.contains('organisationalName')) {fieldDetails.add('Receiver Organisation Name (Super Fund Name)');} else if(longDesc.contains('USI')) {fieldDetails.add('Receiver USI (Unique Superannuation Identifier)');} else {fieldDetails.add('Receiver/Super Fund Details');}
        }
        
        // Check for empty fields
        if(longDesc.contains('must not be empty') || longDesc.contains('cannot be empty') || longDesc.contains('is required')) {if(longDesc.contains('Organisation Name') || longDesc.contains('organisationalName')) {fieldDetails.add('Organisation Name is empty');}if(longDesc.contains('ABN')) {fieldDetails.add('ABN is empty');}if(longDesc.contains('USI')) {fieldDetails.add('USI is empty');}if(longDesc.contains('TFN') || longDesc.contains('Tax File Number')) {fieldDetails.add('TFN is empty');}if(longDesc.contains('Member') && !fieldDetails.contains('Member ID is empty')) {fieldDetails.add('Member ID is empty');}if(longDesc.contains('Receiver') || longDesc.contains('H2')) {fieldDetails.add('Receiver/Super Fund field is empty');}if(longDesc.contains('sender') || longDesc.contains('H1')) { fieldDetails.add('Sender/Organisation field is empty');}}
        
        // Check for invalid values
        if(longDesc.contains('invalid') || longDesc.contains('Invalid')) { if(longDesc.contains('ABN')) { fieldDetails.add('Invalid ABN provided');  } if(longDesc.contains('USI')) {fieldDetails.add('Invalid USI provided'); } if(longDesc.contains('TFN') || longDesc.contains('Tax File Number')) {fieldDetails.add('Invalid TFN provided'); }if(longDesc.contains('Member') && !fieldDetails.contains('Invalid Member ID')) {fieldDetails.add('Invalid Member ID provided');
            }
        }
        
        // Check for part references (H2, R1, S1, etc.)
        if(longDesc.startsWith('H2') || longDesc.contains('H2')) { fieldDetails.add('Receiver/Organisation Header (H2)');
        }
        if(longDesc.startsWith('R1') || longDesc.contains('R1')) {fieldDetails.add('Member/Employee Record (R1)');
        }
        if(longDesc.startsWith('S1') || longDesc.contains('S1')) {fieldDetails.add('Sender/Organisation Record (S1)');
        }
        if(longDesc.startsWith('H1') || longDesc.contains('H1')) {fieldDetails.add('Sender/Organisation Header (H1)');
        }
        
        // If no specific fields found, try to extract from the message
        if(fieldDetails.isEmpty()) {
            // Try to extract the field name from common patterns
            String fieldName = '';
            
            // Look for "The [field] is invalid" pattern
            Pattern fieldPattern = Pattern.compile('The\\s+([A-Za-z\\s]+)\\s+is\\s+invalid');
            Matcher fieldMatcher = fieldPattern.matcher(longDesc);
            if(fieldMatcher.find()) {
                fieldName = fieldMatcher.group(1).trim();
                fieldDetails.add(fieldName);
            }
            
            // Look for "[field] is missing" pattern
            Pattern missingPattern = Pattern.compile('([A-Za-z\\s]+)\\s+is\\s+missing');
            Matcher missingMatcher = missingPattern.matcher(longDesc);
            if(missingMatcher.find()) {
                fieldName = missingMatcher.group(1).trim();
                if(!fieldDetails.contains(fieldName)) {
                    fieldDetails.add(fieldName);
                }
            }
            
            // If still empty, try to get the part reference
            if(fieldDetails.isEmpty()) {
                // Extract the part reference from the start of the message
                String[] parts = longDesc.split(' ');
                for(String part : parts) {
                    if(part.startsWith('H') || part.startsWith('R') || part.startsWith('S')) {
                        if(part.length() == 2 && (part.substring(1).isNumeric())) {
                            if(part == 'H2') {
                                fieldDetails.add('Receiver Header (H2)');
                            } else if(part == 'R1') {
                                fieldDetails.add('Member Record (R1)');
                            } else if(part == 'S1') {
                                fieldDetails.add('Sender Record (S1)');
                            } else if(part == 'H1') {
                                fieldDetails.add('Sender Header (H1)');
                            }
                            break;
                        }
                    }
                }
            }
        }
        
        // Remove duplicates
        Set<String> uniqueFields = new Set<String>(fieldDetails);
        return String.join(new List<String>(uniqueFields), ', ');
    }

    /**
    * Helper method to extract values from text using Apex String methods
    * This replaces the Pattern.compile() approach
    */
    public static List<String> extractPattern(String text, String keyword) {
        List<String> results = new List<String>();
        
        try {
            Integer startIdx = text.indexOf(keyword);
            
            while(startIdx != -1) {
                // Look for quote after the keyword
                Integer quoteStart = text.indexOf('\'', startIdx);
                Integer quoteStart2 = text.indexOf('"', startIdx);
                
                // Use the first quote found
                Integer valueStart = -1;
                if(quoteStart != -1 && (quoteStart2 == -1 || quoteStart < quoteStart2)) {
                    valueStart = quoteStart + 1;
                } else if(quoteStart2 != -1 && (quoteStart == -1 || quoteStart2 < quoteStart)) {
                    valueStart = quoteStart2 + 1;
                }
                
                // If no quote found, try to find a number or alphanumeric value
                if(valueStart == -1) {
                    // Skip the keyword and any spaces
                    valueStart = startIdx + keyword.length();
                    while(valueStart < text.length()) {
                        String ch = text.substring(valueStart, valueStart + 1);
                        if(ch != ' ' && ch != ':') {
                            break;
                        }
                        valueStart++;
                    }
                }
                
                if(valueStart != -1 && valueStart < text.length()) {
                    // Find the end of the value
                    Integer valueEnd = -1;
                    
                    // If we started with a quote, look for the closing quote
                    if(valueStart > 0) {
                        String prevChar = text.substring(valueStart - 1, valueStart);
                        if(prevChar == '\'' || prevChar == '"') {
                            String quoteChar = prevChar;
                            valueEnd = text.indexOf(quoteChar, valueStart);
                        }
                    }
                    
                    // If no closing quote found, look for space, comma, or end of string
                    if(valueEnd == -1) {
                        valueEnd = valueStart;
                        while(valueEnd < text.length()) {
                            String ch = text.substring(valueEnd, valueEnd + 1);
                            if(ch == ' ' || ch == ',' || ch == ';' || ch == '.' || ch == '\n' || ch == '\r') {
                                break;
                            }
                            valueEnd++;
                        }
                    }
                    
                    // Extract the value
                    if(valueEnd > valueStart) {
                        String value = text.substring(valueStart, valueEnd).trim();
                        
                        // Clean up the value (remove quotes, etc.)
                        if(value.startsWith('\'') && value.endsWith('\'')) {
                            value = value.substring(1, value.length() - 1);
                        } else if(value.startsWith('"') && value.endsWith('"')) {
                            value = value.substring(1, value.length() - 1);
                        }
                        
                        // Only add if the value looks valid
                        if(String.isNotBlank(value) && value.length() >= 2) {
                            // For TFN, make sure it's numeric and 8-9 digits
                            if(keyword == 'TFN') {
                                if(value.length() >= 8 && value.length() <= 9 && value.isNumeric()) {
                                    results.add(value);
                                }
                            }
                            // For ABN, make sure it's 11 digits
                            else if(keyword == 'ABN') {
                                if(value.length() >= 11 && value.isNumeric()) {
                                    results.add(value);
                                }
                            }
                            // For USI, make sure it's alphanumeric
                            else if(keyword == 'USI') {
                                if(value.length() >= 10) {
                                    results.add(value);
                                }
                            }
                            // For Fund, make sure it's a reasonable length
                            else if(keyword == 'Fund') {
                                if(value.length() >= 3 && value.length() <= 100) {
                                    results.add(value);
                                }
                            }
                            // For Member, make sure it's a reasonable length
                            else if(keyword == 'Member') {
                                if(value.length() >= 3 && value.length() <= 50) {
                                    results.add(value);
                                }
                            } else {
                                results.add(value);
                            }
                        }
                    }
                }
                
                // Find the next occurrence
                startIdx = text.indexOf(keyword, startIdx + keyword.length());
            }
            
        } catch(Exception e) {
            System.debug('Error extracting pattern: ' + e.getMessage());
        }
        
        return results;
    }

    /**
    * Formats raw error responses for display
    */
    public static String formatRawErrors(String rawErrors) {
        String formattedMessage = 'Upload Failed with the following errors:\n\n';
        Integer errorCount = 0;
        
        try {
            // Try to parse as JSON
            if(rawErrors.startsWith('[') || rawErrors.startsWith('{')) {
                Object parsed = JSON.deserializeUntyped(rawErrors);
                
                if(parsed instanceof List<Object>) {
                    List<Object> errorList = (List<Object>)parsed;
                    
                    for(Integer i = 0; i < errorList.size(); i++) {
                        Map<String, Object> error = (Map<String, Object>)errorList[i];
                        errorCount++;
                        
                        // Try different field names
                        String errorCode = getErrorField(error, new List<String>{'Error Code', 'errorCode', 'code'});
                        String shortDesc = getErrorField(error, new List<String>{'Short Desc', 'shortDesc', 'description'});
                        String longDesc = getErrorField(error, new List<String>{'Long Desc', 'longDesc', 'details', 'message'});
                        
                        formattedMessage += 'Error ' + (i + 1) + ':\n';
                        if(String.isNotBlank(shortDesc)) {
                            formattedMessage += '  • Issue: ' + shortDesc + '\n';
                        }
                        if(String.isNotBlank(longDesc)) {
                            formattedMessage += '  • Details: ' + longDesc + '\n';
                        }
                        if(String.isNotBlank(errorCode)) {
                            formattedMessage += '  • Error Code: ' + errorCode + '\n';
                        }
                        
                        // Extract field info from long description
                        String fieldInfo = extractFieldInfo(longDesc);
                        if(String.isNotBlank(fieldInfo)) {
                            formattedMessage += '  • Affected Fields: ' + fieldInfo + '\n';
                        }
                        
                        formattedMessage += '\n';
                    }
                } else if(parsed instanceof Map<String, Object>) {
                    Map<String, Object> errorMap = (Map<String, Object>)parsed;
                    
                    // Check if it's a single error
                    if(errorMap.containsKey('shortDesc') || errorMap.containsKey('longDesc')) {
                        String shortDesc = getErrorField(errorMap, new List<String>{'shortDesc', 'Short Desc', 'description'});
                        String longDesc = getErrorField(errorMap, new List<String>{'longDesc', 'Long Desc', 'details', 'message'});
                        String errorCode = getErrorField(errorMap, new List<String>{'errorCode', 'Error Code', 'code'});
                        
                        formattedMessage += 'Error:\n';
                        if(String.isNotBlank(shortDesc)) {
                            formattedMessage += '  • Issue: ' + shortDesc + '\n';
                        }
                        if(String.isNotBlank(longDesc)) {
                            formattedMessage += '  • Details: ' + longDesc + '\n';
                        }
                        if(String.isNotBlank(errorCode)) {
                            formattedMessage += '  • Error Code: ' + errorCode + '\n';
                        }
                        
                        String fieldInfo = extractFieldInfo(longDesc);
                        if(String.isNotBlank(fieldInfo)) {
                            formattedMessage += '  • Affected Fields: ' + fieldInfo + '\n';
                        }
                    } else {
                        formattedMessage += JSON.serializePretty(errorMap);
                    }
                } else {
                    formattedMessage += rawErrors;
                }
            } else {
                // Not JSON - display as is
                formattedMessage += rawErrors;
            }
            
        } catch(Exception e) {
            System.debug('Error parsing raw errors: ' + e.getMessage());
            formattedMessage += rawErrors;
        }
        
        return formattedMessage;
    }

    /**
    * Formats single error for display
    */
    public static String formatSingleError(Map<String, Object> error) {
        String formattedMessage = 'Error:\n';
        
        String shortDesc = getErrorField(error, new List<String>{'shortDesc', 'Short Desc', 'description'});
        String longDesc = getErrorField(error, new List<String>{'longDesc', 'Long Desc', 'details', 'message'});
        String errorCode = getErrorField(error, new List<String>{'errorCode', 'Error Code', 'code'});
        
        if(String.isNotBlank(shortDesc)) {
            formattedMessage += '  • Issue: ' + shortDesc + '\n';
        }
        if(String.isNotBlank(longDesc)) {
            formattedMessage += '  • Details: ' + longDesc + '\n';
        }
        if(String.isNotBlank(errorCode)) {
            formattedMessage += '  • Error Code: ' + errorCode + '\n';
        }
        
        String fieldInfo = extractFieldInfo(longDesc);
        if(String.isNotBlank(fieldInfo)) {
            formattedMessage += '  • Affected Fields: ' + fieldInfo + '\n';
        }
        
        return formattedMessage;
    }


    //==========================================
    // Helper Methods
    //==========================================
    public static String escapeJson(String value) {
        if (value == null) return '';
        return value.replace('\\', '\\\\')
                    .replace('"', '\\"')
                    .replace('\n', '\\n')
                    .replace('\r', '\\r')
                    .replace('\t', '\\t');
    }

    // ==========================================
    // getUploadStatus
    // ==========================================
    public static HttpResponse getUploadStatus(String uploadUuid) {

        // Authenticate - returns token directly
        String accessToken = authenticateOZEDI();
        System.debug('Access Token retrieved successfully');

        // Get Organisation
        User currentUser = [
            SELECT Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
        ];

        Organisation__c org = [
            SELECT Name, OZEDI_Client_Id__c
            FROM Organisation__c
            WHERE Name = :currentUser.Organization_Name__c
            LIMIT 1
        ];

        OZEDI_Setting__mdt settings = OZEDI_Setting__mdt.getInstance('Default');

        if (settings == null) {
            throw new CalloutException('OZEDI configuration not found.');
        }

        if (String.isBlank(settings.Upload_Status_URL__c)) {
            throw new CalloutException('Upload Status URL is missing.');
        }

        HttpRequest req = new HttpRequest();

        String endpoint = settings.Upload_Status_URL__c +
            '/' + org.OZEDI_Client_Id__c +
            '/' + uploadUuid;

        System.debug('===== STATUS ENDPOINT =====');
        System.debug(endpoint);

        req.setEndpoint(endpoint);
        req.setMethod('GET');
        req.setHeader('Authorization', 'Bearer ' + accessToken);
        req.setHeader('Accept', 'application/json');

        Http http = new Http();
        HttpResponse res = http.send(req);

        System.debug('===== STATUS CODE =====');
        System.debug(res.getStatusCode());
        System.debug('===== STATUS RESPONSE =====');
        System.debug(res.getBody());

        return res;
    }

    // ==========================================
    // sendUpload
    // ==========================================
    public static HttpResponse sendUpload(String uploadUuid) {

        OZEDI_Setting__mdt settings = OZEDI_Setting__mdt.getInstance('Default');

        if (settings == null) {
            throw new CalloutException('OZEDI configuration not found.');
        }

        if (String.isBlank(settings.Send_Upload_URL__c)) {
            throw new CalloutException('Send Upload URL is missing.');
        }

        // Authenticate - returns token directly
        String accessToken = authenticateOZEDI();
        System.debug('Access Token retrieved successfully');

        // Get Organisation
        User currentUser = [
            SELECT Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
        ];

        Organisation__c org = [
            SELECT OZEDI_Client_Id__c
            FROM Organisation__c
            WHERE Name = :currentUser.Organization_Name__c
            LIMIT 1
        ]; HttpRequest req = new HttpRequest(); String endpoint = settings.Send_Upload_URL__c + '/' + org.OZEDI_Client_Id__c; System.debug('Send Endpoint: ' + endpoint); req.setEndpoint(endpoint); req.setMethod('POST'); req.setHeader('Authorization', 'Bearer ' + accessToken); req.setHeader('Content-Type', 'application/json'); req.setHeader('Accept', 'application/json'); String body = '{"uploadUuid":"' + uploadUuid + '"}'; System.debug('Request Body: ' + body); req.setBody(body); req.setTimeout(120000); Http http = new Http();HttpResponse res = http.send(req);System.debug('===== SEND STATUS =====');System.debug('Status Code: ' + res.getStatusCode());System.debug('Status: ' + res.getStatus()); System.debug('===== SEND RESPONSE =====');System.debug('Response Body: ' + res.getBody());return res;
    }

    // ==========================================
    // getUploadErrors
    // ==========================================
    public static HttpResponse getUploadErrors(String uploadUuid) {

        OZEDI_Setting__mdt settings = OZEDI_Setting__mdt.getInstance('Default');

        if (settings == null) {
            throw new CalloutException('OZEDI configuration not found.');
        }

        if (String.isBlank(settings.Upload_Error_URL__c)) {
            throw new CalloutException('Upload Error URL is missing.');
        }

        // Authenticate - returns token directly
        String accessToken = authenticateOZEDI();
        System.debug('Access Token retrieved successfully');

        // Get Organisation
        User currentUser = [
            SELECT Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        Organisation__c org = [
            SELECT OZEDI_Client_Id__c
            FROM Organisation__c
            WHERE Name = :currentUser.Organization_Name__c
            LIMIT 1
        ]; String endpoint = settings.Upload_Error_URL__c +  '/' + org.OZEDI_Client_Id__c +  '/' + uploadUuid;  System.debug('===== ERROR ENDPOINT ====='); System.debug(endpoint);  HttpRequest req = new HttpRequest(); req.setEndpoint(endpoint); req.setMethod('GET'); req.setHeader('Authorization', 'Bearer ' + accessToken); req.setHeader('Accept', 'application/json'); Http http = new Http(); HttpResponse res = http.send(req);  System.debug('===== ERROR RESPONSE ====='); System.debug('Status Code: ' + res.getStatusCode()); System.debug('Body: ' + res.getBody()); return res;
    }

    // ==========================================
    // MVR WORKFLOW HELPER METHODS
    // ==========================================

    /**
     * Waits for MVR processing with retry logic
     */
    public static Map<String, Object> waitForMVRProcessing(String uploadUuid) {
        
        System.debug('===== waitForMVRProcessing START =====');
        System.debug('Upload UUID: ' + uploadUuid);
        
        Map<String, Object> result = new Map<String, Object>();
        result.put('success', false);
        result.put('uploadStatus', '');
        result.put('message', '');
        result.put('errorDetails', '');
        result.put('fullResponse', '');
        
        if (String.isBlank(uploadUuid)) {
            result.put('message', 'Upload UUID is required');
            return result;
        }
        
        // Try up to MAX_RETRY_ATTEMPTS times
        for (Integer attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
            
            System.debug('Status check attempt ' + attempt + ' of ' + MAX_RETRY_ATTEMPTS);
            
            try {
                HttpResponse response = getUploadStatus(uploadUuid);
                
                if (response.getStatusCode() != 200) {
                    result.put('message', 'Status check failed with status: ' + response.getStatusCode());
                    result.put('errorDetails', response.getBody());
                    
                    if (attempt < MAX_RETRY_ATTEMPTS) {
                        System.debug('Retrying in ' + RETRY_DELAY_MS + 'ms...');
                        sleep(RETRY_DELAY_MS);
                        continue;
                    }
                    return result;
                }
                
                Map<String, Object> statusMap = 
                    (Map<String, Object>)JSON.deserializeUntyped(response.getBody());
                
                String uploadStatus = (String)statusMap.get('uploadStatus');
                result.put('uploadStatus', uploadStatus);
                result.put('fullResponse', response.getBody());
                
                // Check if there are errors
                if (statusMap.containsKey('errors')) {
                    String errors = JSON.serialize(statusMap.get('errors'));
                    result.put('errorDetails', errors);
                    
                    if (uploadStatus == 'UPLOAD_PRE_PROCESSING_FAILED' || 
                        uploadStatus == 'UPLOAD_FAILED') {
                        result.put('message', 'Upload failed: ' + errors);
                        return result;
                    }
                }
                
                // If upload is ready or failed, return immediately
                if (uploadStatus == 'UPLOAD_READY' || 
                    uploadStatus == 'UPLOAD_SEND_SUCCESS' ||
                    uploadStatus == 'UPLOAD_FAILED' ||
                    uploadStatus == 'UPLOAD_PRE_PROCESSING_FAILED') {
                    
                    result.put('success', true);
                    result.put('message', 'Status check completed');
                    return result;
                }
                
                // If still processing, wait and retry
                if (uploadStatus == 'UPLOAD_PRE_PROCESSING') {
                    if (attempt < MAX_RETRY_ATTEMPTS) {
                        System.debug('Upload still processing. Waiting ' + RETRY_DELAY_MS + 'ms...');
                        sleep(RETRY_DELAY_MS);
                        continue;
                    } else {
                        result.put('success', true);
                        result.put('message', 'Upload is still being processed. Please check status later.');
                        return result;
                    }
                }
                
                // For any other status
                result.put('success', true);
                result.put('message', 'Status: ' + uploadStatus);
                return result;
                
            } catch (Exception ex) {
                System.debug('Error checking status: ' + ex.getMessage());
                
                if (attempt < MAX_RETRY_ATTEMPTS) {
                    System.debug('Retrying after error...');
                    sleep(RETRY_DELAY_MS);
                } else {
                    result.put('message', 'Error checking status: ' + ex.getMessage());
                    return result;
                }
            }
        }
        
        result.put('success', false);
        result.put('message', 'Max retry attempts exceeded');
        return result;
    }

    /**
     * Sends MVR remittance to OZEDI
     */
    public static Map<String, Object> sendMVRRemittance(String uploadUuid) {
        
        System.debug('===== sendMVRRemittance START =====');
        System.debug('Upload UUID: ' + uploadUuid);
        
        Map<String, Object> result = new Map<String, Object>();
        result.put('success', false);
        result.put('message', '');
        result.put('errorDetails', '');
        result.put('response', '');
        
        try {
            HttpResponse response = sendUpload(uploadUuid);
            
            if (response.getStatusCode() != 200 && response.getStatusCode() != 201) {
                result.put('message', 'Send failed with status: ' + response.getStatusCode());
                result.put('errorDetails', response.getBody());
                return result;
            }
            
            String responseBody = response.getBody();
            
            // Parse response
            if (String.isNotBlank(responseBody)) {
                Map<String, Object> responseMap = 
                    (Map<String, Object>)JSON.deserializeUntyped(responseBody);
                
                if (responseMap.containsKey('errors')) {
                    String errors = JSON.serialize(responseMap.get('errors'));
                    result.put('message', 'Send failed with errors');
                    result.put('errorDetails', errors);
                    return result;
                }
                
                // Check for new upload UUID
                if (responseMap.containsKey('uploadUuid')) {
                    String newUuid = (String)responseMap.get('uploadUuid');
                    if (String.isNotBlank(newUuid) && !newUuid.equals(uploadUuid)) {
                        result.put('newUploadUuid', newUuid);
                    }
                }
            }
            
            // Update staff records with send status
            updateStaffWithSendStatus(uploadUuid, 'SENT');
            
            result.put('success', true);
            result.put('message', 'Remittance sent successfully');
            result.put('response', responseBody);
            
            return result;
            
        } catch (Exception ex) {
            result.put('success', false);
            result.put('message', 'Error sending remittance: ' + ex.getMessage());
            return result;
        }
    }

    /**
     * Updates staff records with send status
     */
    public static void updateStaffWithSendStatus(String uploadUuid, String status) {
        
        try {
            List<Staff__c> staffList = [
                SELECT Id, OZEDI_Upload_UUID__c, OZEDI_Response__c
                FROM Staff__c
                WHERE OZEDI_Upload_UUID__c = :uploadUuid
            ];
            
            if (!staffList.isEmpty()) {
                for (Staff__c staff : staffList) {
                    String currentResponse = staff.OZEDI_Response__c != null ? 
                        staff.OZEDI_Response__c : '';
                    staff.OZEDI_Response__c = currentResponse + 
                        '\n\nSend Status: ' + status + 
                        ' (Sent at: ' + DateTime.now() + ')';
                }
                update staffList;
                System.debug('Updated ' + staffList.size() + ' staff records with send status');
            }
        } catch (Exception ex) {
            System.debug('Error updating staff with send status: ' + ex.getMessage());
        }
    }

    /**
     * Creates Staff Payroll Activity Record
     */
    public static void createStaffPayrollActivity(String paySetId, String submissionType, String stpResponse, String stpRefId, DateTime stpDate) {
        try {
            if (String.isBlank(paySetId) && String.isBlank(stpRefId)) {
                System.debug('No paySetId or stpRefId provided. Creating activity with minimal data.');
            }

            Staff_Payroll_Activity__c activity = new Staff_Payroll_Activity__c();
            activity.Type_of_Submission__c = String.isNotBlank(submissionType) ? submissionType : 'Superannuation';
            activity.STP_Response__c = stpResponse;
            activity.Payroll_Setting__c = paySetId;
            
            if (String.isNotBlank(stpRefId)) {
                activity.STP_Ref_ID__c = stpRefId;
            }
            
            if (stpDate != null) {
                activity.STP_Date__c = stpDate.date();
            } else {
                activity.STP_Date__c = System.today();
            }
            
            activity.Payer_Declaration_Date__c = System.today();

            insert activity;
            System.debug('Staff Payroll Activity record created successfully. ID: ' + activity.Id);
            
        } catch (DmlException dmle) {
            System.debug('DML Error creating Staff Payroll Activity record: ' + dmle.getMessage());
        } catch (Exception ex) {
            System.debug('Error creating Staff Payroll Activity record: ' + ex.getMessage());
        }
    }

    /**
    * Sleep helper for retry logic
    * Note: System.sleep() is only available in asynchronous contexts (Queueable, Batch, Future)
    * In synchronous contexts, we use a simple loop with timestamp check
    */
    public static void sleep(Integer milliseconds) {
        if (Test.isRunningTest()) {
            return;
        }
        if (milliseconds == null || milliseconds <= 0) {
            return;
        }
        
        if (milliseconds > 10000) {
            milliseconds = 10000;
        }
        
        Long startTime = DateTime.now().getTime();
        Long endTime = startTime + milliseconds;
        
        while (DateTime.now().getTime() < endTime) {
            // Just loop and check time
        }
    }

    // ==========================================
    // QUEUEABLE FOR ASYNC MVR RESPONSE MONITORING
    // ==========================================

    public class MVRResponseMonitorQueueable implements Queueable {
        
        private String uploadUuid;
        
        public MVRResponseMonitorQueueable(String uuid) {
            this.uploadUuid = uuid;
        }
        
        public void execute(QueueableContext context) {
            System.debug('===== MVRResponseMonitorQueueable START =====');
            System.debug('Monitoring upload UUID: ' + uploadUuid);
            
            try {
                // Wait initial delay
                sleep(10000); // 10 seconds
                
                // Check status
                HttpResponse response = getUploadStatus(uploadUuid);
                
                if (response.getStatusCode() == 200) {
                    Map<String, Object> statusMap = 
                        (Map<String, Object>)JSON.deserializeUntyped(response.getBody());
                    
                    String uploadStatus = (String)statusMap.get('uploadStatus');
                    
                    if (uploadStatus == 'UPLOAD_READY' || uploadStatus == 'UPLOAD_SEND_SUCCESS') {
                        // Send remittance
                        System.debug('Sending remittance from queueable...');
                        Map<String, Object> sendResult = sendMVRRemittance(uploadUuid);
                        
                        if ((Boolean)sendResult.get('success')) {
                            System.debug('Remittance sent successfully from queueable');
                        } else {
                            System.debug('Remittance send failed from queueable: ' + sendResult.get('message'));
                        }
                    } else if (uploadStatus == 'UPLOAD_PRE_PROCESSING') {
                        // Re-queue with delay
                        System.debug('Still processing, re-queuing...');
                        System.enqueueJob(new MVRResponseMonitorQueueable(uploadUuid));
                    }
                }
            } catch (Exception ex) {
                System.debug('Error in MVR response monitor: ' + ex.getMessage());
            }
        }
    }

    // ==========================================
    // PROCESS SUPERANNUATION - SINGLE API CALL WITH MULTIPLE FUNDS AS ARRAY
    // ==========================================

    @AuraEnabled
    public static Map<String, Object> processSuperannuation(String paySetId) {
        
        System.debug('===== OZEDI Contribution Transaction Started =====');
        Long startTime = DateTime.now().getTime();
        
        Map<String, Object> result = new Map<String, Object>();
        result.put('success', false);
        result.put('message', '');
        result.put('uploadUuid', '');
        result.put('totalEmployees', 0);
        result.put('validEmployees', 0);
        result.put('failedEmployees', new List<Map<String, Object>>());
        result.put('successfulEmployees', new List<String>());
        result.put('fundGroups', new Map<String, Integer>());
        result.put('totalFunds', 0);
        result.put('requestBody', '');
        
        if (String.isBlank(paySetId)) {
            throw new AuraHandledException('Payrun Id is required.');
        }
        
        // ===========================================
        // COLLECT ALL DML OPERATIONS FOR LATER EXECUTION
        // ===========================================
        List<OZEDI_Validation_Log__c> logsToInsert = new List<OZEDI_Validation_Log__c>();
        List<OZEDI_Validation_Log__c> logsToUpdate = new List<OZEDI_Validation_Log__c>();
        List<Payroll_Setting__c> payrollsToUpdate = new List<Payroll_Setting__c>();
        List<Staff_Payroll_Activity__c> activitiesToInsert = new List<Staff_Payroll_Activity__c>();
        
        try {
            // ===========================================
            // Step 1: Authenticate once
            // ===========================================
            String accessToken = authenticateOZEDI();
            
            // ===========================================
            // Step 2: Get Payroll Setting
            // ===========================================
            Payroll_Setting__c payRun = [
                SELECT Id, Name, Organization__c, 
                    Period_End_Date__c, Period_Start_Date__c,
                    Status__c
                FROM Payroll_Setting__c
                WHERE Id = :paySetId
                LIMIT 1
            ];
            
            // ===========================================
            // Step 3: Get Organisation
            // ===========================================
            Organisation__c organisation = [
                SELECT Id, Name, ABN__c, Email__c, Contact_No__c,
                    OZEDI_Client_Id__c, Account_Number__c,
                    BSB__c, Account_Name__c
                FROM Organisation__c
                WHERE Id = :payRun.Organization__c
                LIMIT 1
            ];
            
            // ===========================================
            // Step 4: Get OZEDI Settings
            // ===========================================
            OZEDI_Setting__mdt settings = OZEDI_Setting__mdt.getInstance('Default');
            if (settings == null) {
                throw new CalloutException('OZEDI configuration not found.');
            }
            
            // ===========================================
            // Step 5: Query all employees
            // ===========================================
            List<Staff_Payroll_Setting__c> staffPayrolls = [
                SELECT Id, Name, Staff__c, 
                    Staff__r.Name, Staff__r.Last_Name__c,
                    Staff__r.Date_Of_Birth__c, Staff__r.Gender__c,
                    Staff__r.Superannuation_Name__c, Staff__r.Unique_Superannuation_Identifier__c,
                    Staff__r.Super_ABN__c, Staff__r.Superannuation_Number__c,
                    Staff__r.Email_Address__c, Staff__r.Contact_Number__c,
                    Staff__r.Address__Street__s, Staff__r.Address__City__s,
                    Staff__r.Address__StateCode__s, Staff__r.Address__PostalCode__s,
                    Staff__r.Address__CountryCode__s,
                    Staff__r.OZEDI_Upload_UUID__c,
                    Staff__r.OZEDI_Response__c,
                    Staff__r.OZEDI_Upload_Date_Time__c,
                    Staff__r.Account_Number__c, Staff__r.BSB__c, Staff__r.Account_Name__c,
                    Staff__r.Fund_Bank_Account_Number__c,
                    Staff__r.ESA__c, Staff__r.Fund_Bank_BSB__c,
                    Super_And_Voluntary_Supper_Annuation__c,
                    Staff__r.Emp_exit_date__c,
                    Payroll_Setting__r.Period_Start_Date__c,
                    Payroll_Setting__r.Period_End_Date__c
                FROM Staff_Payroll_Setting__c
                WHERE Payroll_Setting__c = :paySetId
            ];
            
            result.put('totalEmployees', staffPayrolls.size());
            
            if (staffPayrolls.isEmpty()) { result.put('message', 'No staff payroll records found for this pay run.'); Staff_Payroll_Activity__c activity = createActivityRecord( paySetId,  'Superannuation',  'No staff payroll records found for this pay run.',  null,  null); activitiesToInsert.add(activity); executeDML(logsToInsert, logsToUpdate, payrollsToUpdate, activitiesToInsert); return result;
            }
            
            // ===========================================
            // Step 6: Group employees by Super Fund ABN
            // ===========================================
            Map<String, List<Staff_Payroll_Setting__c>> fundGroups = new Map<String, List<Staff_Payroll_Setting__c>>();
            Map<String, String> fundNameMap = new Map<String, String>();
            Map<String, Staff__c> fundEmployeeMap = new Map<String, Staff__c>();
            Map<String, Decimal> fundTotals = new Map<String, Decimal>();
            
            for (Staff_Payroll_Setting__c sp : staffPayrolls) {
                String fundKey = sp.Staff__r.Super_ABN__c != null ? 
                    String.valueOf(sp.Staff__r.Super_ABN__c) : 'UNKNOWN';
                
                if (!fundGroups.containsKey(fundKey)) {
                    fundGroups.put(fundKey, new List<Staff_Payroll_Setting__c>());
                    fundNameMap.put(fundKey, sp.Staff__r.Superannuation_Name__c);
                    fundEmployeeMap.put(fundKey, sp.Staff__r);
                    fundTotals.put(fundKey, 0);
                }
                fundGroups.get(fundKey).add(sp);
                
                Decimal contribution = sp.Super_And_Voluntary_Supper_Annuation__c != null ? 
                    sp.Super_And_Voluntary_Supper_Annuation__c : 0;
                fundTotals.put(fundKey, fundTotals.get(fundKey) + contribution);
            }
            
            result.put('totalFunds', fundGroups.size());
            
            // ===========================================
            // Step 7: Validate each employee
            // ===========================================
            Map<String, List<Staff_Payroll_Setting__c>> validFundGroups = new Map<String, List<Staff_Payroll_Setting__c>>();
            Map<String, Decimal> validFundTotals = new Map<String, Decimal>();
            List<Map<String, Object>> failedEmployees = new List<Map<String, Object>>();
            List<Staff_Payroll_Setting__c> allValidEmployees = new List<Staff_Payroll_Setting__c>();
            
            for (Staff_Payroll_Setting__c sp : staffPayrolls) {
                Map<String, Object> validationResult = validateEmployeeForContribution(sp);
                
                String employeeName = sp.Staff__r.Name + ' ' + sp.Staff__r.Last_Name__c;
                String fundKey = sp.Staff__r.Super_ABN__c != null ? 
                    String.valueOf(sp.Staff__r.Super_ABN__c) : 'UNKNOWN';
                
                if ((Boolean)validationResult.get('valid')) {
                    if (!validFundGroups.containsKey(fundKey)) {
                        validFundGroups.put(fundKey, new List<Staff_Payroll_Setting__c>());
                        validFundTotals.put(fundKey, 0);
                    }
                    validFundGroups.get(fundKey).add(sp);
                    allValidEmployees.add(sp);
                    
                    Decimal contribution = sp.Super_And_Voluntary_Supper_Annuation__c != null ? 
                        sp.Super_And_Voluntary_Supper_Annuation__c : 0;
                    validFundTotals.put(fundKey, validFundTotals.get(fundKey) + contribution);
                    
                } else {
                    Map<String, Object> failure = new Map<String, Object>();
                    failure.put('staffPayrollId', sp.Id);
                    failure.put('employeeId', sp.Staff__c);
                    failure.put('employeeName', employeeName);
                    failure.put('errors', validationResult.get('errors'));
                    failure.put('errorTypes', validationResult.get('errorTypes'));
                    failure.put('fundName', fundNameMap.get(fundKey));
                    failure.put('fundABN', fundKey);
                    failedEmployees.add(failure);
                }
            }
            
            result.put('validEmployees', allValidEmployees.size());
            result.put('failedEmployees', failedEmployees);
            
            // ===========================================
            // COLLECT FAILED LOGS (NO DML YET)
            // ===========================================
            for (Map<String, Object> failure : failedEmployees) {
                Id staffPayrollId = (Id)failure.get('staffPayrollId');
                
                for (Staff_Payroll_Setting__c sp : staffPayrolls) {
                    if (sp.Id == staffPayrollId) {
                        List<String> errors = (List<String>)failure.get('errors');
                        
                        OZEDI_Validation_Log__c log = createValidationLogRecord(
                            sp, 
                            paySetId, 
                            null, 
                            false, 
                            String.join(errors, '; ')
                        );
                        logsToInsert.add(log);
                        break;
                    }
                }
            }
            
            // If no valid employees, return
            if (allValidEmployees.isEmpty()) {
                result.put('success', false);
                result.put('message', 'All employees failed validation.');
                
                Staff_Payroll_Activity__c activity = createActivityRecord(
                    paySetId, 
                    'Superannuation', 
                    'All ' + staffPayrolls.size() + ' employees failed validation.', 
                    null, 
                    null
                );
                activitiesToInsert.add(activity);
                
                executeDML(logsToInsert, logsToUpdate, payrollsToUpdate, activitiesToInsert);
                return result;
            }
            
            // ===========================================
            // Step 8: Build JSON bodies
            // ===========================================
            List<String> jsonObjects = new List<String>();
            
            for (String fundKey : validFundGroups.keySet()) {
                List<Staff_Payroll_Setting__c> fundEmployees = validFundGroups.get(fundKey);
                Staff__c representativeStaff = fundEmployeeMap.get(fundKey);
                Decimal fundTotal = validFundTotals.get(fundKey);
                
                Map<String, List<Staff_Payroll_Setting__c>> employerGroups = 
                    new Map<String, List<Staff_Payroll_Setting__c>>();
                
                for (Staff_Payroll_Setting__c sp : fundEmployees) {
                    String employerKey = organisation.ABN__c;
                    if (!employerGroups.containsKey(employerKey)) {
                        employerGroups.put(employerKey, new List<Staff_Payroll_Setting__c>());
                    }
                    employerGroups.get(employerKey).add(sp);
                }
                
                String fundJson = buildSingleFundContributionJSON(
                    organisation,
                    payRun,
                    representativeStaff,
                    fundEmployees,
                    employerGroups,
                    fundTotal
                );
                
                jsonObjects.add(fundJson);
            }
            
            String finalRequestBody = '[' + String.join(jsonObjects, ',') + ']';
            result.put('requestBody', finalRequestBody);
            
            // ===========================================
            // Step 9: Make the API call (NO DML before this!)
            // ===========================================
            String endpoint = buildContributionEndpoint(organisation, settings);
            
            HttpRequest request = new HttpRequest();
            request.setEndpoint(endpoint);
            request.setMethod('POST');
            request.setHeader('Authorization', 'Bearer ' + accessToken);
            request.setHeader('Content-Type', 'application/json');
            request.setTimeout(120000);
            request.setBody(finalRequestBody);
            
            Http http = new Http();
            HttpResponse response = http.send(request);
            
            System.debug('Response Status: ' + response.getStatusCode());
            System.debug('Response Body: ' + response.getBody());
            
            String uploadUuid = null;
            String detailedErrors = null;
            
            // ===========================================
            // Step 10: Handle API Response
            // ===========================================
            if (response.getStatusCode() == 200 || response.getStatusCode() == 201) {
                try {
                    Map<String, Object> responseMap = 
                        (Map<String, Object>)JSON.deserializeUntyped(response.getBody());
                    
                    uploadUuid = (String)responseMap.get('uploadUuid'); if (String.isNotBlank(uploadUuid)) { List<String> successfulNames = new List<String>(); for (Staff_Payroll_Setting__c sp : allValidEmployees) {successfulNames.add(sp.Staff__r.Name + ' ' + sp.Staff__r.Last_Name__c); OZEDI_Validation_Log__c log = createValidationLogRecord(sp,  paySetId,  uploadUuid,  true,  null ); logsToInsert.add(log);} payRun.OZEDI_Upload_UUID__c = uploadUuid; payRun.OZEDI_Upload_Status__c = 'UPLOAD_READY'; payRun.OZEDI_Upload_Date_Time__c = DateTime.now(); payrollsToUpdate.add(payRun); result.put('success', true); result.put('uploadUuid', uploadUuid); result.put('successfulEmployees', successfulNames); result.put('message', 'Successfully processed ' + allValidEmployees.size() +  ' employees across ' + validFundGroups.size() + ' funds.'); String activityMessage = 'Processed ' + allValidEmployees.size() +  ' employees across ' + validFundGroups.size() + ' funds.'; if (!failedEmployees.isEmpty()) { activityMessage += ' ' + failedEmployees.size() + ' employees failed validation.'; } activityMessage += ' UUID: ' + uploadUuid; Staff_Payroll_Activity__c activity = createActivityRecord( paySetId,  'Superannuation',  activityMessage,  uploadUuid,  DateTime.now() ); activitiesToInsert.add(activity);
                        
                    } else {
                        // No upload UUID - Need to get error details
                        String errorMsg = 'No upload UUID returned from OZEDI';
                        result.put('success', false);
                        result.put('message', errorMsg);
                        result.put('uploadStatus', 'NO_UUID');
                        
                        // ===========================================
                        // CALL ERROR API TO GET DETAILED ERRORS
                        // ===========================================
                        detailedErrors = getDetailedErrorMessages(accessToken, organisation, null, response);
                        
                        // Create failure logs with detailed errors
                        for (Staff_Payroll_Setting__c sp : allValidEmployees) {
                            String errorDetail = detailedErrors != null ? 
                                errorMsg + ' | Details: ' + detailedErrors : 
                                errorMsg;
                                
                            OZEDI_Validation_Log__c log = createValidationLogRecord(
                                sp, 
                                paySetId, 
                                null, 
                                false, 
                                errorDetail
                            );
                            logsToInsert.add(log); } }} catch (Exception parseEx) { String errorMsg = 'Error parsing response: ' + parseEx.getMessage();result.put('success', false); result.put('message', errorMsg); detailedErrors = getDetailedErrorMessages(accessToken, organisation, null, response);for (Staff_Payroll_Setting__c sp : allValidEmployees) {String errorDetail = detailedErrors != null ?  errorMsg + ' | Details: ' + detailedErrors :  errorMsg;OZEDI_Validation_Log__c log = createValidationLogRecord(sp, paySetId,  null,  false,  errorDetail ); logsToInsert.add(log);}} } else { String errorMsg = 'OZEDI API Error: ' + response.getStatusCode() + ' - ' + response.getStatus(); result.put('success', false); result.put('message', errorMsg); result.put('statusCode', response.getStatusCode());result.put('uploadStatus', 'API_ERROR'); detailedErrors = getDetailedErrorMessages(accessToken, organisation, null, response); for (Staff_Payroll_Setting__c sp : allValidEmployees) { String errorDetail = detailedErrors != null ?  errorMsg + ' | Details: ' + detailedErrors :  errorMsg + ' | Response: ' + response.getBody(); OZEDI_Validation_Log__c log = createValidationLogRecord(sp, paySetId,  null,  false, errorDetail);logsToInsert.add(log);}  Staff_Payroll_Activity__c activity = createActivityRecord( paySetId, 'Superannuation',  'Submission failed: ' + errorMsg + (detailedErrors != null ? ' | Details: ' + detailedErrors : ''), null,  null); activitiesToInsert.add(activity);
            }
            
            Long endTime = DateTime.now().getTime();
            System.debug('===== OZEDI Contribution Transaction Completed =====');
            System.debug('Total time: ' + (endTime - startTime) + 'ms');
            
            // ===========================================
            // EXECUTE ALL DML OPERATIONS AFTER CALLOUT
            // ===========================================
            executeDML(logsToInsert, logsToUpdate, payrollsToUpdate, activitiesToInsert);
            
            return result;
            
        } catch (Exception ex) {
            System.debug('Error: ' + ex.getMessage());
            System.debug('Stack trace: ' + ex.getStackTraceString());
            result.put('success', false);
            result.put('message', 'Error: ' + ex.getMessage());
            
            // ===========================================
            // Create failure logs for ALL employees on exception
            // ===========================================
            try {
                List<Staff_Payroll_Setting__c> staffPayrolls = [
                    SELECT Id, Name, Staff__c, Staff__r.Name, Staff__r.Last_Name__c
                    FROM Staff_Payroll_Setting__c
                    WHERE Payroll_Setting__c = :paySetId
                ];
                
                for (Staff_Payroll_Setting__c sp : staffPayrolls) {
                    OZEDI_Validation_Log__c log = createValidationLogRecord(
                        sp, 
                        paySetId, 
                        null, 
                        false, 
                        'System Error: ' + ex.getMessage()
                    );
                    logsToInsert.add(log);
                }
            } catch (Exception logEx) {
                System.debug('Error creating validation logs for employees: ' + logEx.getMessage());
            }

            Staff_Payroll_Activity__c activity = createActivityRecord(
                paySetId, 
                'Superannuation', 
                'Submission failed with error: ' + ex.getMessage(), 
                null, 
                null
            );
            activitiesToInsert.add(activity);
            
            executeDML(logsToInsert, logsToUpdate, payrollsToUpdate, activitiesToInsert);

            return result;
        }
    }


    /**
     * Gets detailed error messages from OZEDI Error API
     * This method should be called AFTER the main API call when errors occur
     */
    public static String getDetailedErrorMessages(
        String accessToken, 
        Organisation__c organisation, 
        String uploadUuid,
        HttpResponse originalResponse
    ) {
        
        System.debug('===== getDetailedErrorMessages START =====');
        
        String detailedErrors = null;
        
        try {
            // ===========================================
            // Check if we have an upload UUID from the response
            // ===========================================
            if (String.isBlank(uploadUuid) && originalResponse != null) {
                // Try to extract upload UUID from response body
                String responseBody = originalResponse.getBody();
                if (String.isNotBlank(responseBody)) {
                    try {
                        Map<String, Object> responseMap = 
                            (Map<String, Object>)JSON.deserializeUntyped(responseBody);
                        
                        if (responseMap.containsKey('uploadUuid')) {
                            uploadUuid = (String)responseMap.get('uploadUuid');
                        }
                    } catch (Exception e) {
                        System.debug('Could not extract upload UUID from response: ' + e.getMessage());
                    }
                }
            }
            
            // ===========================================
            // If we have an upload UUID, get errors from status/error API
            // ===========================================
            if (String.isNotBlank(uploadUuid)) {
                System.debug('Getting errors for upload UUID: ' + uploadUuid);
                
                // First try to get status
                HttpResponse statusResponse = getUploadStatus(uploadUuid);
                
                if (statusResponse.getStatusCode() == 200) {
                    Map<String, Object> statusMap = 
                        (Map<String, Object>)JSON.deserializeUntyped(statusResponse.getBody());
                    
                    // Check for errors in status response
                    if (statusMap.containsKey('errors')) {
                        Object errors = statusMap.get('errors');
                        detailedErrors = JSON.serialize(errors);
                        System.debug('Found errors in status response: ' + detailedErrors);
                    }
                    
                    // Check for error details
                    if (statusMap.containsKey('errorDetails')) {
                        Object errorDetails = statusMap.get('errorDetails');
                        if (detailedErrors != null) {
                            detailedErrors = detailedErrors + ' | ' + JSON.serialize(errorDetails);
                        } else {
                            detailedErrors = JSON.serialize(errorDetails);
                        }
                    }
                }
                
                // If status didn't give errors, try the error API
                if (String.isBlank(detailedErrors)) {
                    try {
                        HttpResponse errorResponse = getUploadErrors(uploadUuid);
                        
                        if (errorResponse.getStatusCode() == 200) {
                            detailedErrors = errorResponse.getBody();
                            System.debug('Got errors from error API: ' + detailedErrors);
                        }
                    } catch (Exception errorEx) {
                        System.debug('Error API call failed: ' + errorEx.getMessage());
                    }
                }
            }
            
            // ===========================================
            // If no upload UUID, try to parse errors from the original response
            // ===========================================
            if (String.isBlank(detailedErrors) && originalResponse != null) {
                String responseBody = originalResponse.getBody();
                
                if (String.isNotBlank(responseBody)) {
                    try {
                        Map<String, Object> responseMap = 
                            (Map<String, Object>)JSON.deserializeUntyped(responseBody);
                        
                        // Check for errors
                        if (responseMap.containsKey('errors')) {
                            Object errors = responseMap.get('errors');
                            detailedErrors = JSON.serialize(errors);
                            System.debug('Found errors in response body: ' + detailedErrors);
                        }
                        
                        // Check for message
                        if (responseMap.containsKey('message')) {
                            String message = (String)responseMap.get('message');
                            if (detailedErrors != null) {
                                detailedErrors = detailedErrors + ' | Message: ' + message;
                            } else {
                                detailedErrors = 'Message: ' + message;
                            }
                        }
                        
                        // Check for error
                        if (responseMap.containsKey('error')) {
                            String error = (String)responseMap.get('error');
                            if (detailedErrors != null) {
                                detailedErrors = detailedErrors + ' | Error: ' + error;
                            } else {
                                detailedErrors = 'Error: ' + error;
                            }
                        }
                    } catch (Exception e) {
                        System.debug('Could not parse error from response body: ' + e.getMessage());
                        
                        // If JSON parsing fails, try to extract error from text
                        if (responseBody.contains('error') || responseBody.contains('Error')) {
                            detailedErrors = responseBody.substring(0, Math.min(500, responseBody.length()));
                        }
                    }
                }
                
                // If still no errors, use the status code
                if (String.isBlank(detailedErrors)) {
                    detailedErrors = 'HTTP Status: ' + originalResponse.getStatusCode() + 
                        ' - ' + originalResponse.getStatus();
                }
            }
            
            // ===========================================
            // If we still don't have errors, provide a generic message
            // ===========================================
            if (String.isBlank(detailedErrors)) {
                detailedErrors = 'No detailed error information available. Please check OZEDI logs.';
            }
            
            System.debug('===== getDetailedErrorMessages END =====');
            System.debug('Detailed errors: ' + detailedErrors);
            
            return detailedErrors;
            
        } catch (Exception ex) {
            System.debug('Error getting detailed error messages: ' + ex.getMessage());
            
            // Return whatever error we have from the original response
            if (originalResponse != null) {
                return 'HTTP Status: ' + originalResponse.getStatusCode() + 
                    ' - ' + originalResponse.getBody();
            }
            
            return 'Error getting detailed error messages: ' + ex.getMessage();
        }
    }

    /**
     * Alternative method to get errors when you have a Payroll Setting ID
     */
    public static String getDetailedErrorMessagesFromPayrun(String paySetId) {
        
        System.debug('===== getDetailedErrorMessagesFromPayrun START =====');
        
        try {
            // Get the payroll setting
            Payroll_Setting__c payRun = [
                SELECT Id, OZEDI_Upload_UUID__c
                FROM Payroll_Setting__c
                WHERE Id = :paySetId
                LIMIT 1
            ];
            
            if (String.isNotBlank(payRun.OZEDI_Upload_UUID__c)) {
                // Get access token
                String accessToken = authenticateOZEDI();
                
                // Get organisation
                User currentUser = [
                    SELECT Organization_Name__c
                    FROM User
                    WHERE Id = :UserInfo.getUserId()
                    LIMIT 1
                ];
                
                Organisation__c org = [
                    SELECT OZEDI_Client_Id__c
                    FROM Organisation__c
                    WHERE Name = :currentUser.Organization_Name__c
                    LIMIT 1
                ];
                
                // Get detailed errors
                return getDetailedErrorMessages(accessToken, org, payRun.OZEDI_Upload_UUID__c, null);
            }
            
            return 'No OZEDI upload UUID found for this pay run.';
            
        } catch (Exception ex) {
            System.debug('Error getting detailed errors from payrun: ' + ex.getMessage());
            return 'Error: ' + ex.getMessage();
        }
    }

    /**
    * Builds a STANDARD OZEDI JSON for a SINGLE fund
    * This follows the exact OZEDI specification (ONE receiver, ONE payee)
    * Uses FUND BANK DETAILS from the employee record, NOT organisation details
    */
    public static String buildSingleFundContributionJSON(
        Organisation__c org,
        Payroll_Setting__c payRun,
        Staff__c representativeStaff,
        List<Staff_Payroll_Setting__c> fundEmployees,
        Map<String, List<Staff_Payroll_Setting__c>> employerGroups,
        Decimal fundTotal
    ) {
        
        // Format ABNs
        String orgABN = formatABN(org.ABN__c);
        String superABN = formatABN(representativeStaff.Super_ABN__c);
        
        // ==========================================
        // IMPORTANT: USE FUND BANK DETAILS FROM EMPLOYEE RECORD
        // NOT from Organisation!
        // ==========================================
        
        // Get fund bank details from the representative employee
        String fundAccountNumber = representativeStaff.Fund_Bank_Account_Number__c;
        String fundBSB = representativeStaff.Fund_Bank_BSB__c;
        String fundAccountName = representativeStaff.Superannuation_Name__c;
        String fundUSI = representativeStaff.Unique_Superannuation_Identifier__c;
        String fundESA = representativeStaff.ESA__c;
        
        // ==========================================
        // TRY TO FIND FUND BANK DETAILS FROM ANY EMPLOYEE IN THIS FUND
        // ==========================================
        if (String.isBlank(fundAccountNumber) || String.isBlank(fundBSB)) {
            for (Staff_Payroll_Setting__c sp : fundEmployees) {
                if (String.isNotBlank(sp.Staff__r.Fund_Bank_Account_Number__c) &&
                    String.isNotBlank(sp.Staff__r.Fund_Bank_BSB__c)) {
                    fundAccountNumber = sp.Staff__r.Fund_Bank_Account_Number__c;
                    fundBSB = sp.Staff__r.Fund_Bank_BSB__c;
                    fundAccountName = sp.Staff__r.Superannuation_Name__c;
                    fundUSI = sp.Staff__r.Unique_Superannuation_Identifier__c;
                    fundESA = sp.Staff__r.ESA__c;
                    System.debug('✅ Found fund bank details from employee: ' + 
                        sp.Staff__r.Name + ' ' + sp.Staff__r.Last_Name__c);
                    break;
                }
            }
        }
        
        // ==========================================
        // CLEAN BSB AND ACCOUNT NUMBER
        // ==========================================
        if (String.isNotBlank(fundBSB)) {
            fundBSB = fundBSB.replaceAll('\\D', '');
            if (fundBSB.length() != 6) {
                System.debug('⚠️ WARNING: BSB length is ' + fundBSB.length() + ' (expected 6). Will pad with zeros.');
                fundBSB = fundBSB.leftPad(6, '0');
            }
        }
        
        if (String.isNotBlank(fundAccountNumber)) {
            fundAccountNumber = fundAccountNumber.replaceAll('\\D', '');
        }
        
        // ==========================================
        // LOG FUND BANK DETAILS FOR DEBUGGING
        // ==========================================
        System.debug('===== FUND BANK DETAILS =====');
        System.debug('Fund Name: ' + representativeStaff.Superannuation_Name__c);
        System.debug('Fund ABN: ' + superABN);
        System.debug('Fund USI: ' + fundUSI);
        System.debug('Fund BSB: ' + fundBSB);
        System.debug('Fund Account Number: ' + fundAccountNumber);
        System.debug('Fund Account Name: ' + fundAccountName);
        System.debug('Fund ESA: ' + fundESA);
        System.debug('==============================');
        
        // ==========================================
        // CRITICAL: DO NOT USE ORGANISATION BANK DETAILS AS FALLBACK
        // If fund bank details are missing, throw an error
        // ==========================================
        if (String.isBlank(fundAccountNumber) || String.isBlank(fundBSB)) {
            String errorMsg = 'Fund Bank Details are missing for fund: ' + 
                representativeStaff.Superannuation_Name__c + 
                ' (ABN: ' + superABN + '). ' +
                'Please update Fund_Bank_Account_Number__c and Fund_Bank_BSB__c on the Staff records.';
            System.debug('❌ ERROR: ' + errorMsg);
            throw new AuraHandledException(errorMsg);
        }
        
        // Get user name
        String givenName = UserInfo.getFirstName() != null ? UserInfo.getFirstName() : '';
        String familyName = UserInfo.getLastName() != null ? UserInfo.getLastName() : '';
        
        // Format dates
        String transactionDate = String.valueOf(Date.today());
        
        // Build the JSON String - STANDARD OZEDI FORMAT
        String jsonBody = '{';
        
        // Comment-1
        jsonBody += '"Comment-1":"CTR for Fund: ' + escapeJson(representativeStaff.Superannuation_Name__c) + 
            ' (' + escapeJson(superABN) + ') - ' + fundEmployees.size() + ' employees",';
        
        // Message Header
        jsonBody += '"messageHeader":{';
        jsonBody += '"conversationId":"",';
        jsonBody += '"messageType":"ContributionTransactionRequest"';
        jsonBody += '},';
        
        // ==========================================
        // SENDER (H1)
        // ==========================================
        jsonBody += '"sender":{';
        jsonBody += '"Comment":"H1. Sender ABN must match Client ABN.",';
        jsonBody += '"abn":"' + escapeJson(orgABN) + '",';
        jsonBody += '"emailAddress":"' + escapeJson(org.Email__c) + '",';
        jsonBody += '"familyName":"' + escapeJson(familyName) + '",';
        jsonBody += '"givenName":"' + escapeJson(givenName) + '",';
        jsonBody += '"organisationalName":"' + escapeJson(org.Name) + '",';
        jsonBody += '"otherGivenName":"",';
        jsonBody += '"position":""';
        
        if (String.isNotBlank(org.Contact_No__c)) {
            jsonBody += ',"phone":' + buildPhoneJson(org.Contact_No__c);
        }
        jsonBody += '},';
        
        // ==========================================
        // RECEIVER (H2) - The Super Fund
        // ==========================================
        jsonBody += '"receiver":{';
        jsonBody += '"Comment":"H2 Fund details: ' + escapeJson(representativeStaff.Superannuation_Name__c) + '",';
        jsonBody += '"abn":"' + escapeJson(superABN) + '",';
        jsonBody += '"organisationalName":"' + escapeJson(representativeStaff.Superannuation_Name__c) + '",';
        jsonBody += '"targetElectronicServiceAddress":"' + escapeJson(fundESA) + '"';
        jsonBody += '},';
        
        // ==========================================
        // PAYER (H3) - Organisation details
        // ==========================================
        jsonBody += '"payer":{';
        jsonBody += '"Comment":"H3 Payer of the contributions.",';
        jsonBody += '"abn":"' + escapeJson(orgABN) + '",';
        jsonBody += '"accountName":"' + escapeJson(org.Account_Name__c) + '",';
        jsonBody += '"accountNumber":"' + escapeJson(org.Account_Number__c) + '",';
        jsonBody += '"bankName":"",';
        jsonBody += '"branchName":"",';
        jsonBody += '"bsb":"' + escapeJson(org.BSB__c) + '",';
        jsonBody += '"organisationalName":"' + escapeJson(org.Name) + '"';
        jsonBody += '},';
        
        // ==========================================
        // PAYEE (H4) - FUND'S BANK DETAILS (NOT ORGANISATION!)
        // ==========================================
        jsonBody += '"payee":{';
        jsonBody += '"Comment":"H4 Fund Banking Details for ' + 
            escapeJson(representativeStaff.Superannuation_Name__c) + '",';
        jsonBody += '"uniqueSuperannuationIdentifier":"' + escapeJson(fundUSI) + '",';
        jsonBody += '"abn":"' + escapeJson(superABN) + '",';
        jsonBody += '"accountName":"' + escapeJson(fundAccountName) + '",';
        jsonBody += '"accountNumber":"' + escapeJson(fundAccountNumber) + '",';  // FUND's account number
        jsonBody += '"amount":"' + formatAmountWithoutCommas(fundTotal) + '",';
        jsonBody += '"bankName":"",';
        jsonBody += '"bpayBillerCode":"",';
        jsonBody += '"branchName":"",';
        jsonBody += '"bsb":"' + escapeJson(fundBSB) + '",';  // FUND's BSB
        jsonBody += '"customerReferenceNumber":"",';
        jsonBody += '"paymentMethod":"' + PAYMENT_METHOD_DIRECT_CREDIT + '",';
        jsonBody += '"transactionDate":"' + transactionDate + '"';
        jsonBody += '},';
        
        // Comment-2
        jsonBody += '"Comment-2":"\'.employers\' is H5. \'.employers.members\' is R1. ' +
            '\'.employers.members.memberOtherDetails\' is R2.",';
        
        // ==========================================
        // EMPLOYERS (H5)
        // ==========================================
        jsonBody += '"employers":[';
        
        Integer employerCount = 0;
        for (String employerKey : employerGroups.keySet()) {
            List<Staff_Payroll_Setting__c> employerEmployees = employerGroups.get(employerKey);
            
            if (employerCount > 0) {
                jsonBody += ',';
            }
            
            jsonBody += '{';
            jsonBody += '"abn":"' + escapeJson(orgABN) + '",';
            jsonBody += '"organisationalName":"' + escapeJson(org.Name) + '",';
            jsonBody += '"superannuationFundGeneratedEmployerIdentifier":"' + 
                escapeJson(org.ABN__c + '_' + superABN) + '",';
            jsonBody += '"members":[';
            
            Integer memberCount = 0;
            for (Staff_Payroll_Setting__c sp : employerEmployees) {
                if (memberCount > 0) {
                    jsonBody += ',';
                }
                jsonBody += buildMemberJson(sp);
                memberCount++;
            }
            
            jsonBody += ']';
            jsonBody += '}';
            
            employerCount++;
        }
        
        jsonBody += ']';
        jsonBody += '}';
        
        return jsonBody;
    }

    /**
    * Builds Contribution Transaction JSONs - ONE PER UNIQUE SUPER FUND
    * Returns a List of JSON strings, one for each fund group
    */
    public static List<String> buildContributionRequestBodies(
        Organisation__c org,
        Payroll_Setting__c payRun,
        List<Staff_Payroll_Setting__c> staffPayrolls
    ) {
        
        List<String> jsonBodies = new List<String>();
        
        if (staffPayrolls == null || staffPayrolls.isEmpty()) {
            throw new AuraHandledException('No staff payroll records available.');
        }
        
        // ==========================================
        // GROUP EMPLOYEES BY SUPER FUND ABN
        // ==========================================
        Map<String, List<Staff_Payroll_Setting__c>> fundGroups = new Map<String, List<Staff_Payroll_Setting__c>>();
        Map<String, Staff__c> fundEmployeeMap = new Map<String, Staff__c>();
        Map<String, String> fundNameMap = new Map<String, String>();
        
        for (Staff_Payroll_Setting__c sp : staffPayrolls) {
            Staff__c staff = sp.Staff__r;
            String fundKey = staff.Super_ABN__c != null ? String.valueOf(staff.Super_ABN__c) : '';
            
            if (String.isBlank(fundKey)) {
                System.debug('Skipping employee with no Super ABN: ' + staff.Name + ' ' + staff.Last_Name__c);
                continue;
            }
            
            if (!fundGroups.containsKey(fundKey)) {
                fundGroups.put(fundKey, new List<Staff_Payroll_Setting__c>());
                fundEmployeeMap.put(fundKey, staff);
                fundNameMap.put(fundKey, staff.Superannuation_Name__c);
            }
            
            fundGroups.get(fundKey).add(sp);
        }
        
        System.debug('Fund Groups Found: ' + fundGroups.size());
        for (String key : fundGroups.keySet()) {
            System.debug('Fund ABN: ' + key + ' (' + fundNameMap.get(key) + ') - ' + 
                fundGroups.get(key).size() + ' employees');
        }
        
        if (fundGroups.isEmpty()) {
            throw new AuraHandledException('No valid super fund groups found.');
        }
        
        // ==========================================
        // BUILD ONE JSON PER FUND GROUP
        // ==========================================
        for (String fundKey : fundGroups.keySet()) {
            List<Staff_Payroll_Setting__c> fundEmployees = fundGroups.get(fundKey);
            Staff__c representativeStaff = fundEmployeeMap.get(fundKey);
            
            // Further group by employer (Organisation)
            Map<String, List<Staff_Payroll_Setting__c>> employerGroups = new Map<String, List<Staff_Payroll_Setting__c>>();
            
            for (Staff_Payroll_Setting__c sp : fundEmployees) {
                String employerKey = org.ABN__c; // Use organisation ABN
                if (!employerGroups.containsKey(employerKey)) {
                    employerGroups.put(employerKey, new List<Staff_Payroll_Setting__c>());
                }
                employerGroups.get(employerKey).add(sp);
            }
            
            // Build JSON for this specific fund
            String jsonBody = buildSingleFundContributionJSON(
                org, 
                payRun, 
                representativeStaff, 
                fundEmployees, 
                employerGroups
            );
            
            jsonBodies.add(jsonBody);
        }
        
        return jsonBodies;
    }

    /**
    * Builds a single JSON object for one specific super fund
    */
    public static String buildSingleFundContributionJSON(
        Organisation__c org,
        Payroll_Setting__c payRun,
        Staff__c representativeStaff,
        List<Staff_Payroll_Setting__c> allFundEmployees,
        Map<String, List<Staff_Payroll_Setting__c>> employerGroups
    ) {
        
        // Calculate total amount for this fund
        Decimal totalAmount = 0;
        for (Staff_Payroll_Setting__c sp : allFundEmployees) {
            Decimal contribution = sp.Super_And_Voluntary_Supper_Annuation__c != null ? 
                sp.Super_And_Voluntary_Supper_Annuation__c : 0;
            totalAmount += contribution;
        }
        
        // Format ABNs
        String orgABN = formatABN(org.ABN__c);
        String superABN = formatABN(representativeStaff.Super_ABN__c);
        
        // Get user name
        String givenName = UserInfo.getFirstName() != null ? UserInfo.getFirstName() : '';
        String familyName = UserInfo.getLastName() != null ? UserInfo.getLastName() : '';
        
        // Format dates
        String transactionDate = String.valueOf(Date.today());
        
        // Build the JSON String
        String jsonBody = '{';
        
        // Comment-1 - Fund identification
        jsonBody += '"Comment-1":"CTR for Fund ABN: ' + escapeJson(superABN) + ' (' + 
            escapeJson(representativeStaff.Superannuation_Name__c) + ') - ' + 
            allFundEmployees.size() + ' employees",';
        
        // Message Header
        jsonBody += '"messageHeader":{';
        jsonBody += '"conversationId":"",';
        jsonBody += '"messageType":"ContributionTransactionRequest"';
        jsonBody += '},';
        
        // ==========================================
        // SENDER (H1)
        // ==========================================
        jsonBody += '"sender":{';
        jsonBody += '"Comment":"H1. Sender ABN must match Client ABN.",';
        jsonBody += '"abn":"' + escapeJson(orgABN) + '",';
        jsonBody += '"emailAddress":"' + escapeJson(org.Email__c) + '",';
        jsonBody += '"familyName":"' + escapeJson(familyName) + '",';
        jsonBody += '"givenName":"' + escapeJson(givenName) + '",';
        jsonBody += '"organisationalName":"' + escapeJson(org.Name) + '",';
        jsonBody += '"otherGivenName":"",';
        jsonBody += '"position":""';
        
        // Add sender phone if available
        if (String.isNotBlank(org.Contact_No__c)) {
            jsonBody += ',"phone":' + buildPhoneJson(org.Contact_No__c);
        }
        
        jsonBody += '},';
        
        // ==========================================
        // RECEIVER (H2) - The Super Fund
        // ==========================================
        jsonBody += '"receiver":{';
        jsonBody += '"Comment":"H2 Fund details: ' + escapeJson(representativeStaff.Superannuation_Name__c) + '",';
        jsonBody += '"abn":"' + escapeJson(superABN) + '",';
        jsonBody += '"organisationalName":"' + escapeJson(representativeStaff.Superannuation_Name__c) + '",';
        jsonBody += '"targetElectronicServiceAddress":"' + escapeJson(representativeStaff.ESA__c) + '"';
        jsonBody += '},';
        
        // ==========================================
        // PAYER (H3)
        // ==========================================
        jsonBody += '"payer":{';
        jsonBody += '"Comment":"H3 Payer of the contributions.",';
        jsonBody += '"abn":"' + escapeJson(orgABN) + '",';
        jsonBody += '"accountName":"' + escapeJson(org.Account_Name__c) + '",';
        jsonBody += '"accountNumber":"' + escapeJson(org.Account_Number__c) + '",';
        jsonBody += '"bankName":"",';
        jsonBody += '"branchName":"",';
        jsonBody += '"bsb":"' + escapeJson(org.BSB__c) + '",';
        jsonBody += '"organisationalName":"' + escapeJson(org.Name) + '"';
        jsonBody += '},';
        
        // ==========================================
        // PAYEE (H4) - Fund's bank details
        // ==========================================
        jsonBody += '"payee":{';
        jsonBody += '"Comment":"H4 Fund Banking Details for ' + 
            escapeJson(representativeStaff.Superannuation_Name__c) + '",';
        jsonBody += '"uniqueSuperannuationIdentifier":"' + 
            escapeJson(representativeStaff.Unique_Superannuation_Identifier__c) + '",';
        jsonBody += '"abn":"' + escapeJson(superABN) + '",';
        jsonBody += '"accountName":"' + escapeJson(representativeStaff.Superannuation_Name__c) + '",';
        jsonBody += '"accountNumber":"' + escapeJson(representativeStaff.Fund_Bank_Account_Number__c) + '",';
        jsonBody += '"amount":"' + formatAmountWithoutCommas(totalAmount) + '",';
        jsonBody += '"bankName":"",';
        jsonBody += '"bpayBillerCode":"",';
        jsonBody += '"branchName":"",';
        jsonBody += '"bsb":"' + escapeJson(representativeStaff.Fund_Bank_BSB__c) + '",';
        jsonBody += '"customerReferenceNumber":"",';
        jsonBody += '"paymentMethod":"' + PAYMENT_METHOD_DIRECT_CREDIT + '",';
        jsonBody += '"transactionDate":"' + transactionDate + '"';
        jsonBody += '},';
        
        // Comment-2
        jsonBody += '"Comment-2":"\'.employers\' is H5. \'.employers.members\' is R1. ' +
            '\'.employers.members.memberOtherDetails\' is R2.",';
        
        // ==========================================
        // EMPLOYERS (H5) - One per employer within this fund
        // ==========================================
        jsonBody += '"employers":[';
        
        Integer employerCount = 0;
        for (String employerKey : employerGroups.keySet()) {
            List<Staff_Payroll_Setting__c> employerEmployees = employerGroups.get(employerKey);
            
            if (employerCount > 0) {
                jsonBody += ',';
            }
            
            // Build each employer
            jsonBody += '{';
            jsonBody += '"abn":"' + escapeJson(orgABN) + '",';
            jsonBody += '"organisationalName":"' + escapeJson(org.Name) + '",';
            jsonBody += '"superannuationFundGeneratedEmployerIdentifier":"' + 
                escapeJson(org.ABN__c + '_' + superABN) + '",';
            jsonBody += '"members":[';
            
            Integer memberCount = 0;
            for (Staff_Payroll_Setting__c sp : employerEmployees) {
                if (memberCount > 0) {
                    jsonBody += ',';
                }
                jsonBody += buildMemberJson(sp);
                memberCount++;
            }
            
            jsonBody += ']';
            jsonBody += '}';
            
            employerCount++;
        }
        
        jsonBody += ']';
        jsonBody += '}';
        
        return jsonBody;
    }

    /**
    * Extracts fund information from a JSON body for logging
    */
    public static String extractFundInfoFromJSON(String jsonBody) {
        try {
            // Try to extract fund name from Comment-1
            Pattern commentPattern = Pattern.compile('"Comment-1":"([^"]*)"');
            Matcher commentMatcher = commentPattern.matcher(jsonBody);
            if (commentMatcher.find()) {
                return commentMatcher.group(1);
            }
            
            // Try to extract receiver name
            Pattern receiverPattern = Pattern.compile('"receiver":\\{[^}]*"organisationalName":"([^"]*)"');
            Matcher receiverMatcher = receiverPattern.matcher(jsonBody);
            if (receiverMatcher.find()) {
                return 'Fund: ' + receiverMatcher.group(1);
            }
        } catch (Exception ex) {
            // Ignore parsing errors
        }
        return 'Unknown Fund';
    }

    /**
     * Validates employee for contribution transaction including MVR status
     */
    public static Map<String, Object> validateEmployeeForContribution(Staff_Payroll_Setting__c sp) {
    
        Map<String, Object> result = new Map<String, Object>();
        List<String> errors = new List<String>();
        List<String> errorTypes = new List<String>();
        Boolean isValid = true;
        
        Staff__c staff = sp.Staff__r;
        
        // ... existing validations ...
        
        // ==========================================
        // CHECK 8: Fund Bank Details (for H4 Payee)
        // ==========================================
        if (String.isBlank(staff.Fund_Bank_Account_Number__c)) {
            errors.add('Fund Bank Account Number is missing. Required for H4 Payee.');
            errorTypes.add('MISSING_FUND_BANK_ACCOUNT');
            isValid = false;
        }
        
        if (String.isBlank(staff.Fund_Bank_BSB__c)) {
            errors.add('Fund Bank BSB is missing. Required for H4 Payee.');
            errorTypes.add('MISSING_FUND_BANK_BSB');
            isValid = false;
        }
        
        // Validate BSB format (6 digits)
        if (String.isNotBlank(staff.Fund_Bank_BSB__c)) {
            String cleanBSB = staff.Fund_Bank_BSB__c.replaceAll('\\D', '');
            if (cleanBSB.length() != 6) {
                errors.add('Fund Bank BSB must be 6 digits. Current: ' + staff.Fund_Bank_BSB__c);
                errorTypes.add('INVALID_FUND_BANK_BSB');
                isValid = false;
            }
        }
        
        // Validate Account Number (must not be empty and should be reasonable)
        if (String.isNotBlank(staff.Fund_Bank_Account_Number__c)) {
            String cleanAccount = staff.Fund_Bank_Account_Number__c.replaceAll('\\D', '');
            if (cleanAccount.length() < 6) {
                errors.add('Fund Bank Account Number must be at least 6 digits. Current: ' + staff.Fund_Bank_Account_Number__c);
                errorTypes.add('INVALID_FUND_BANK_ACCOUNT');
                isValid = false;
            }
        }
        
        result.put('valid', isValid);
        result.put('errors', errors);
        result.put('errorTypes', errorTypes);
        
        return result;
    }

    /**
     * Creates or updates validation log for an employee
     * @param sp - Staff Payroll Setting record
     * @param paySetId - Payroll Setting ID
     * @param uploadUuid - OZEDI upload UUID (null if failed)
     * @param isSuccess - TRUE if employee was successfully processed
     * @param errorMessage - Error message if isSuccess is false
     */
    public static void createEmployeeValidationLog(
        Staff_Payroll_Setting__c sp,
        String paySetId,
        String uploadUuid,
        Boolean isSuccess,
        String errorMessage
    ) {
        
        try {
            // Check for existing log for this employee in this pay run
            List<OZEDI_Validation_Log__c> existingLogs = [
                SELECT Id, Validation_Status__c, Validation_Errors__c,
                    Error_Types__c, Processed_By_OZEDI__c, Upload_UUID__c
                FROM OZEDI_Validation_Log__c
                WHERE Staff_Payroll_Setting__c = :sp.Id
                AND Payroll_Setting__c = :paySetId
                ORDER BY CreatedDate DESC
                LIMIT 1
            ];
            
            OZEDI_Validation_Log__c log;
            Boolean isUpdate = false;
            
            if (!existingLogs.isEmpty()) {
                log = existingLogs[0];
                isUpdate = true;
            } else {
                log = new OZEDI_Validation_Log__c();
                log.Staff_Payroll_Setting__c = sp.Id;
                log.Employee__c = sp.Staff__c;
                log.Payroll_Setting__c = paySetId;
            }
            
            // Set common fields
            log.Validation_Date__c = DateTime.now();
            
            if (sp.Staff__r != null) {
                log.Super_Number__c = sp.Staff__r.Superannuation_Number__c;
                log.Super_ABN__c = sp.Staff__r.Super_ABN__c != null ? String.valueOf(sp.Staff__r.Super_ABN__c) : '';
                log.Super_Fund_Name__c = sp.Staff__r.Superannuation_Name__c;
                log.USI__c = sp.Staff__r.Unique_Superannuation_Identifier__c;
            }
            log.Contribution_Amount__c = sp.Super_And_Voluntary_Supper_Annuation__c;
            
            if (isSuccess) {
                // SUCCESS case - Employee was processed successfully
                log.Validation_Status__c = 'VALID';
                log.Processed_By_OZEDI__c = true;
                log.Upload_UUID__c = uploadUuid;
                log.Validation_Errors__c = null;
                log.Error_Types__c = null;
                
                System.debug('✅ Creating SUCCESS log for employee: ' + sp.Staff__r.Name + ' ' + sp.Staff__r.Last_Name__c);
                
            } else {
                // FAILURE case - Employee failed validation or API error
                log.Validation_Status__c = 'FAILED';
                log.Processed_By_OZEDI__c = false;
                
                // If we have an existing error, append to it
                if (isUpdate && String.isNotBlank(log.Validation_Errors__c)) {
                    log.Validation_Errors__c = log.Validation_Errors__c + '; ' + errorMessage;
                } else {
                    log.Validation_Errors__c = errorMessage;
                }
                
                // Determine error type
                if (errorMessage != null) {
                    if (errorMessage.contains('API Error') || errorMessage.contains('OZEDI API Error')) {
                        log.Error_Types__c = 'API_ERROR';
                    } else if (errorMessage.contains('System Error')) {
                        log.Error_Types__c = 'SYSTEM_ERROR';
                    } else if (errorMessage.contains('validation') || errorMessage.contains('missing') || errorMessage.contains('invalid')) {
                        log.Error_Types__c = 'VALIDATION_ERROR';
                    } else {
                        log.Error_Types__c = 'UNKNOWN_ERROR';
                    }
                }
                
                // Keep existing Upload UUID if any
                if (String.isBlank(uploadUuid) && isUpdate && String.isNotBlank(log.Upload_UUID__c)) {
                    // Keep existing UUID
                } else {
                    log.Upload_UUID__c = uploadUuid;
                }
                
                System.debug('❌ Creating FAILURE log for employee: ' + sp.Staff__r.Name + ' ' + sp.Staff__r.Last_Name__c);
                System.debug('   Error: ' + errorMessage);
            }
            
            // Upsert the log
            if (isUpdate) {
                update log;
                System.debug('Updated validation log: ' + log.Id);
            } else {
                insert log;
                System.debug('Created validation log: ' + log.Id);
            }
            
        } catch (Exception ex) {
            System.debug('Error creating validation log: ' + ex.getMessage());
            System.debug('Stack trace: ' + ex.getStackTraceString());
        }
    }

    /**
     * Creates a Validation Log record (without inserting)
    */
    public static OZEDI_Validation_Log__c createValidationLogRecord(
        Staff_Payroll_Setting__c sp,
        String paySetId,
        String uploadUuid,
        Boolean isSuccess,
        String errorMessage
    ) {
        
        OZEDI_Validation_Log__c log = new OZEDI_Validation_Log__c();
        log.Staff_Payroll_Setting__c = sp.Id;
        log.Employee__c = sp.Staff__c;
        log.Payroll_Setting__c = paySetId;
        log.Validation_Date__c = DateTime.now();
        
        if (sp.Staff__r != null) {
            log.Super_Number__c = sp.Staff__r.Superannuation_Number__c;
            log.Super_ABN__c = sp.Staff__r.Super_ABN__c != null ? String.valueOf(sp.Staff__r.Super_ABN__c) : '';
            log.Super_Fund_Name__c = sp.Staff__r.Superannuation_Name__c;
            log.USI__c = sp.Staff__r.Unique_Superannuation_Identifier__c;
        }
        log.Contribution_Amount__c = sp.Super_And_Voluntary_Supper_Annuation__c;
        
        if (isSuccess) {
            log.Validation_Status__c = 'VALID';
            log.Processed_By_OZEDI__c = true;
            log.Upload_UUID__c = uploadUuid;
            log.Validation_Errors__c = null;
            log.Error_Types__c = null;
        } else {
            log.Validation_Status__c = 'FAILED';
            log.Processed_By_OZEDI__c = false;
            log.Validation_Errors__c = errorMessage;
            log.Upload_UUID__c = uploadUuid;
            
            if (errorMessage != null) {
                if (errorMessage.contains('API Error') || errorMessage.contains('OZEDI API Error')) {
                    log.Error_Types__c = 'API_ERROR';
                } else if (errorMessage.contains('System Error')) {
                    log.Error_Types__c = 'SYSTEM_ERROR';
                } else if (errorMessage.contains('validation') || errorMessage.contains('missing') || errorMessage.contains('invalid')) {
                    log.Error_Types__c = 'VALIDATION_ERROR';
                } else {
                    log.Error_Types__c = 'UNKNOWN_ERROR';
                }
            }
        }
        
        return log;
    }

    /**
     * Creates an Activity record (without inserting)
     */
    public static Staff_Payroll_Activity__c createActivityRecord(
        String paySetId,
        String submissionType,
        String stpResponse,
        String stpRefId,
        DateTime stpDate
    ) {
        Staff_Payroll_Activity__c activity = new Staff_Payroll_Activity__c();
        activity.Type_of_Submission__c = String.isNotBlank(submissionType) ? submissionType : 'Superannuation';
        activity.STP_Response__c = stpResponse;
        activity.Payroll_Setting__c = paySetId;
        
        if (String.isNotBlank(stpRefId)) {
            activity.STP_Ref_ID__c = stpRefId;
        }
        
        if (stpDate != null) {
            activity.STP_Date__c = stpDate.date();
        } else {
            activity.STP_Date__c = System.today();
        }
        
        activity.Payer_Declaration_Date__c = System.today();
        
        return activity;
    }

    /**
     * Executes all collected DML operations
     */
    public static void executeDML(
        List<OZEDI_Validation_Log__c> logsToInsert,
        List<OZEDI_Validation_Log__c> logsToUpdate,
        List<Payroll_Setting__c> payrollsToUpdate,
        List<Staff_Payroll_Activity__c> activitiesToInsert
    ) {
        try {
            if (logsToInsert != null && !logsToInsert.isEmpty()) {
                insert logsToInsert;
                System.debug('Inserted ' + logsToInsert.size() + ' validation logs');
            }
            
            if (logsToUpdate != null && !logsToUpdate.isEmpty()) {
                update logsToUpdate;
                System.debug('Updated ' + logsToUpdate.size() + ' validation logs');
            }
            
            if (payrollsToUpdate != null && !payrollsToUpdate.isEmpty()) {
                update payrollsToUpdate;
                System.debug('Updated ' + payrollsToUpdate.size() + ' payroll settings');
            }
            
            if (activitiesToInsert != null && !activitiesToInsert.isEmpty()) {
                insert activitiesToInsert;
                System.debug('Inserted ' + activitiesToInsert.size() + ' activities');
            }
        } catch (DmlException dmle) {
            System.debug('DML Error: ' + dmle.getMessage());
            for (Integer i = 0; i < dmle.getNumDml(); i++) {
                System.debug('  DML ' + i + ': ' + dmle.getDmlMessage(i));
            }
            throw dmle;
        }
    }

    /**
     * Updates validation logs after successful OZEDI upload
     */
    public static void updateValidationLogsWithUpload(
        List<Staff_Payroll_Setting__c> validEmployees,
        String uploadUuid,
        String paySetId
    ) {

        if (validEmployees.isEmpty() || String.isBlank(uploadUuid)) {
            return;
        }

        Set<Id> validStaffPayrollIds = new Set<Id>();
        for (Staff_Payroll_Setting__c sp : validEmployees) {
            validStaffPayrollIds.add(sp.Id);
        }

        List<OZEDI_Validation_Log__c> logsToUpdate = [
            SELECT Id, Processed_By_OZEDI__c, Upload_UUID__c
            FROM OZEDI_Validation_Log__c
            WHERE Staff_Payroll_Setting__c IN :validStaffPayrollIds
            AND Payroll_Setting__c = :paySetId
            AND Processed_By_OZEDI__c = false
            AND Validation_Status__c = 'VALID'
        ];

        if (!logsToUpdate.isEmpty()) {
            for (OZEDI_Validation_Log__c log : logsToUpdate) {
                log.Processed_By_OZEDI__c = true;
                log.Upload_UUID__c = uploadUuid;
            }
            
            try {
                update logsToUpdate;
                System.debug('Updated ' + logsToUpdate.size() + ' validation logs with upload UUID');
            } catch (DmlException dmle) {
                System.debug('Failed to update validation logs: ' + dmle.getMessage());
            }
        }
    }

    /**
     * Builds the contribution endpoint URL using settings
     */
    public static String buildContributionEndpoint(Organisation__c org, OZEDI_Setting__mdt settings) {
        String baseUrl = settings.Contribution_URL__c != null ? settings.Contribution_URL__c : DEFAULT_BASE_URL;
        
        if (baseUrl.endsWith('/')) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        
        String accountNumber = settings.Account_Number__c != null ? settings.Account_Number__c : org.Account_Number__c;
        
        if (String.isBlank(accountNumber)) {
            throw new AuraHandledException(
                'OZEDI Account Number is missing. Please update the Custom Metadata or Organisation record.'
            );
        }

        if (String.isBlank(org.OZEDI_Client_Id__c)) {
            throw new AuraHandledException(
                'OZEDI Client ID is missing for the organisation. Please create a client first.'
            );
        }

        if (String.isBlank(org.ABN__c)) {
            throw new AuraHandledException(
                'Organisation ABN is missing. Please update the Organisation record.'
            );
        }

        // Removed autoSendWhenReady & autoPayWhenReady for multi-fund
        String endpoint = baseUrl + '/' +
            accountNumber + '/' +
            org.OZEDI_Client_Id__c + '/' +
            org.ABN__c;
        
        System.debug('Contribution Endpoint: ' + endpoint);
        return endpoint;
    }

    /**
     * Builds the Contribution Transaction JSON as a String
     */
    public static String buildContributionRequestBodyString(
        Organisation__c org,
        Payroll_Setting__c payRun,
        List<Staff_Payroll_Setting__c> staffPayrolls
    ) {

        if (staffPayrolls.isEmpty()) {
            throw new AuraHandledException('No staff payroll records available.');
        }

        // Calculate total properly
        Decimal totalAmount = 0;
        Map<String, Decimal> fundTotals = new Map<String, Decimal>();
        
        for (Staff_Payroll_Setting__c sp : staffPayrolls) {
            Decimal contribution = sp.Super_And_Voluntary_Supper_Annuation__c != null ? 
                sp.Super_And_Voluntary_Supper_Annuation__c : 0;
            
            String key = sp.Staff__c;
            if (!fundTotals.containsKey(key)) {
                fundTotals.put(key, contribution);
            }
        }
        
        for (Decimal value : fundTotals.values()) {
            totalAmount += value;
        }
        
        System.debug('Total Contribution Amount: ' + totalAmount);
        System.debug('Number of Unique Employees: ' + fundTotals.size());
        
        // Get first record for sender/receiver
        Staff_Payroll_Setting__c firstStaff = staffPayrolls[0];
        Staff__c firstEmployee = firstStaff.Staff__r;

        // Format dates as YYYY-MM-DD
        String transactionDate = String.valueOf(Date.today());
        
        // Format ABNs
        String orgABN = formatABN(org.ABN__c);
        String superABN = formatABN(firstEmployee.Super_ABN__c);

        // Get user name
        String givenName = UserInfo.getFirstName() != null ? UserInfo.getFirstName() : '';
        String familyName = UserInfo.getLastName() != null ? UserInfo.getLastName() : '';

        // Build the JSON String
        String jsonBody = '{';

        // Comment-1
        jsonBody += '"Comment-1":"This JSON document is for a JSON upload to SuperStream. Released: 10Mar2026",';

        // Message Header
        jsonBody += '"messageHeader":{';
        jsonBody += '"Comment":"These fields match MH in a TSV file.",';
        jsonBody += '"conversationId":"",';
        jsonBody += '"messageType":"ContributionTransactionRequest",';
        jsonBody += '"partId":"part_one_1"';
        jsonBody += '},';

        // Sender
        jsonBody += '"sender":{';
        jsonBody += '"Comment":"These fields match H1 in a TSV file. Sender ABN must match Client ABN.",';
        jsonBody += '"abn":"' + escapeJson(orgABN) + '",';
        jsonBody += '"emailAddress":"' + escapeJson(org.Email__c) + '",';
        jsonBody += '"familyName":"' + escapeJson(familyName) + '",';
        jsonBody += '"givenName":"' + escapeJson(givenName) + '",';
        jsonBody += '"organisationalName":"' + escapeJson(org.Name) + '",';
        jsonBody += '"otherGivenName":"",';
        jsonBody += '"position":""';

        // Add sender phone if available
        if (String.isNotBlank(org.Contact_No__c)) {
            jsonBody += ',"phone":' + buildPhoneJson(org.Contact_No__c);
        }

        jsonBody += '},';

        // Receiver
        jsonBody += '"receiver":{';
        jsonBody += '"Comment":"These fields match H2 in a TSV file.",';
        jsonBody += '"abn":"' + escapeJson(superABN) + '",';
        jsonBody += '"organisationalName":"' + escapeJson(firstEmployee.Superannuation_Name__c) + '",';
        jsonBody += '"targetElectronicServiceAddress":"' + escapeJson(firstEmployee.ESA__c) + '"';
        jsonBody += '},';

        // Payer
        jsonBody += '"payer":{';
        jsonBody += '"Comment":"These fields match H3 in a TSV file.",';
        jsonBody += '"abn":"' + escapeJson(orgABN) + '",';
        jsonBody += '"accountName":"' + escapeJson(org.Account_Name__c) + '",';
        jsonBody += '"accountNumber":"' + escapeJson(org.Account_Number__c) + '",';
        jsonBody += '"bankName":"",';
        jsonBody += '"branchName":"",';
        jsonBody += '"bsb":"' + escapeJson(org.BSB__c) + '",';
        jsonBody += '"organisationalName":"' + escapeJson(org.Name) + '"';
        jsonBody += '},';

        // Payee (H4)
        jsonBody += '"payee":{';
        jsonBody += '"Comment":"These fields match H4 in a TSV file.",';
        jsonBody += '"uniqueSuperannuationIdentifier":"' + escapeJson(firstEmployee.Unique_Superannuation_Identifier__c) + '",';
        jsonBody += '"abn":"' + escapeJson(superABN) + '",';
        jsonBody += '"accountName":"' + escapeJson(firstEmployee.Superannuation_Name__c) + '",';
        jsonBody += '"accountNumber":"' + escapeJson(firstEmployee.Fund_Bank_Account_Number__c) + '",';
        jsonBody += '"amount":"' + formatAmountWithoutCommas(totalAmount) + '",';
        jsonBody += '"bankName":"",';
        jsonBody += '"bpayBillerCode":"",';
        jsonBody += '"branchName":"",';
        jsonBody += '"bsb":"' + escapeJson(firstEmployee.Fund_Bank_BSB__c) + '",';
        jsonBody += '"customerReferenceNumber":"",';
        jsonBody += '"paymentMethod":"' + PAYMENT_METHOD_DIRECT_CREDIT + '",';
        jsonBody += '"transactionDate":"' + transactionDate + '"';
        jsonBody += '},';

        // Comment-2
        jsonBody += '"Comment-2":"\'.employers\' matches up to H5 in a TSV file. \'.employers.members\' matches up to R1 in a TSV file.",';

        // Employers (H5)
        jsonBody += '"employers":[';

        // Group by Super Fund ABN to avoid duplicates
        Map<String, List<Staff_Payroll_Setting__c>> fundGroups = new Map<String, List<Staff_Payroll_Setting__c>>();
        Set<Id> processedEmployees = new Set<Id>();
        
        for (Staff_Payroll_Setting__c sp : staffPayrolls) {
            if (processedEmployees.contains(sp.Staff__c)) {
                System.debug('Skipping duplicate employee: ' + sp.Staff__c);
                continue;
            }
            processedEmployees.add(sp.Staff__c);
            
            String fundKey = sp.Staff__r.Super_ABN__c != null ? String.valueOf(sp.Staff__r.Super_ABN__c) : '';
            if (String.isNotBlank(fundKey)) {
                if (!fundGroups.containsKey(fundKey)) {
                    fundGroups.put(fundKey, new List<Staff_Payroll_Setting__c>());
                }
                fundGroups.get(fundKey).add(sp);
            }
        }

        System.debug('Fund Groups: ' + fundGroups.size());
        System.debug('Unique Employees: ' + processedEmployees.size());

        Integer fundCount = 0;
        for (String fundABN : fundGroups.keySet()) {
            List<Staff_Payroll_Setting__c> fundMembers = fundGroups.get(fundABN);
            
            if (fundCount > 0) {
                jsonBody += ',';
            }

            jsonBody += '{';
            jsonBody += '"abn":"' + escapeJson(orgABN) + '",';
            jsonBody += '"organisationalName":"' + escapeJson(org.Name) + '",';
            jsonBody += '"superannuationFundGeneratedEmployerIdentifier":"",';
            jsonBody += '"members":[';

            Integer memberCount = 0;
            for (Staff_Payroll_Setting__c sp : fundMembers) {
                if (memberCount > 0) {
                    jsonBody += ',';
                }

                jsonBody += buildMemberJson(sp);
                memberCount++;
            }

            jsonBody += ']';
            jsonBody += '}';
            
            fundCount++;
        }

        jsonBody += ']';
        jsonBody += '}';

        return jsonBody;
    }


    /**
     * Formats a decimal amount as string with 2 decimal places and NO commas
     * This is required for OZEDI API which doesn't accept commas in numeric values
     */
    public static String formatAmountWithoutCommas(Decimal amount) {
        if (amount == null) return '0.00';
        // Use String.valueOf and format manually to avoid commas
        String formatted = amount.setScale(2).format();
        // Remove any commas that might be added by the format() method
        formatted = formatted.replaceAll(',', '');
        return formatted;
    }

    /**
     * Builds a single member JSON object as String
     */
    public static String buildMemberJson(Staff_Payroll_Setting__c sp) {
        Staff__c staff = sp.Staff__r;
        
        String birthDate = staff.Date_Of_Birth__c != null ? 
            String.valueOf(staff.Date_Of_Birth__c) : '';
            
        String payPeriodStart = sp.Payroll_Setting__r != null && 
            sp.Payroll_Setting__r.Period_Start_Date__c != null ?
            String.valueOf(sp.Payroll_Setting__r.Period_Start_Date__c) : '';

        String payPeriodEnd = sp.Payroll_Setting__r != null && 
            sp.Payroll_Setting__r.Period_End_Date__c != null ?
            String.valueOf(sp.Payroll_Setting__r.Period_End_Date__c) : '';

        String employmentEndDate = staff.Emp_exit_date__c != null ?
            String.valueOf(staff.Emp_exit_date__c) : '';

        String gender = mapGender(staff.Gender__c);
        Decimal contribution = sp.Super_And_Voluntary_Supper_Annuation__c != null ? 
            sp.Super_And_Voluntary_Supper_Annuation__c : 0;

        // Use Staff Record ID for unique member ID
        String uniqueMemberId = staff.Id;

        // Build member JSON
        String memberJson = '{';
        memberJson += '"name":{';
        memberJson += '"title":"",';
        memberJson += '"nameSuffix":"",';
        memberJson += '"givenName":"' + escapeJson(staff.Name) + '",';
        memberJson += '"otherGivenName":"",';
        memberJson += '"familyName":"' + escapeJson(staff.Last_Name__c) + '"';
        memberJson += '},';
        
        memberJson += '"birthDate":"' + escapeJson(birthDate) + '",';
        memberJson += '"superannuationFundMember":"' + escapeJson(staff.Superannuation_Number__c) + '",';
        memberJson += '"taxFileNumberNotProvided":"N",';
        memberJson += '"sex":"' + escapeJson(gender) + '",';
        memberJson += '"emailAddress":"' + escapeJson(staff.Email_Address__c) + '",';
        memberJson += '"memberId":"' + escapeJson(uniqueMemberId) + '",';
        memberJson += '"payrollNumber":"' + escapeJson(sp.Name) + '",';
        memberJson += '"payPeriodStart":"' + escapeJson(payPeriodStart) + '",';
        memberJson += '"payPeriodEnd":"' + escapeJson(payPeriodEnd) + '",';
        memberJson += '"employerContributionsSuperannuationGuarantee":"' + 
            formatAmountWithoutCommas(contribution) + '",';
        memberJson += '"employerContributionsAwardOrProductivity":"",';
        memberJson += '"employerContributionsSalarySacrificed":"",';
        memberJson += '"employerContributionsVoluntary":"",';
        memberJson += '"personalContributions":"",';
        memberJson += '"spouseContributions":"",';
        memberJson += '"childContributions":"",';
        memberJson += '"otherThirdPartyContributions":""';

        // Add employment end date if exists
        if (String.isNotBlank(employmentEndDate)) {
            memberJson += ',"employmentEndDate":"' + escapeJson(employmentEndDate) + '"';
        }

        // Address
        memberJson += ',"address":{';
        memberJson += '"addressDetailsUsage":"RES",';
        memberJson += '"addressLine1":"' + escapeJson(staff.Address__Street__s) + '",';
        memberJson += '"addressLine2":"",';
        memberJson += '"addressLine3":"",';
        memberJson += '"addressLine4":"",';
        memberJson += '"suburb":"' + escapeJson(staff.Address__City__s) + '",';
        memberJson += '"postCode":"' + escapeJson(staff.Address__PostalCode__s) + '",';
        memberJson += '"state":"' + escapeJson(staff.Address__StateCode__s) + '",';
        memberJson += '"country":"' + escapeJson(
            String.isNotBlank(staff.Address__CountryCode__s) ? 
            staff.Address__CountryCode__s.toLowerCase() : DEFAULT_COUNTRY
        ) + '"';
        memberJson += '}';

        // Phone if available
        if (String.isNotBlank(staff.Contact_Number__c)) {
            memberJson += ',"phone":' + buildPhoneJson(staff.Contact_Number__c);
        }

        // Member Other Details (empty for now)
        memberJson += ',"memberOtherDetails":[]';

        memberJson += '}';

        return memberJson;
    }

    /**
     * Builds phone JSON object as String
     */
    public static String buildPhoneJson(String rawPhone) {

        String cleaned = rawPhone.replaceAll('\\D', '');
        String serviceLine = '02';
        String area = '';
        String phoneNumber = cleaned;

        if (String.isBlank(cleaned)) {
            return '{"phoneServiceLine":"02","phone":""}';
        }

        if (cleaned.startsWith('04')) {
            serviceLine = '01';
            phoneNumber = cleaned.substring(2);
        } else if (cleaned.startsWith('02')) {
            serviceLine = '02';
            phoneNumber = cleaned.substring(2);
        } else if (cleaned.startsWith('03') ||
                   cleaned.startsWith('07') ||
                   cleaned.startsWith('08')) {
            serviceLine = '02';
            area = cleaned.substring(0, 2);
            phoneNumber = cleaned.substring(2);
        }

        String phoneJson = '{"phoneServiceLine":"' + serviceLine + '"';
        if (String.isNotBlank(area)) {
            phoneJson += ',"phoneArea":"' + area + '"';
        }
        phoneJson += ',"phone":"' + phoneNumber + '"}';

        return phoneJson;
    }

    /**
     * Formats an ABN - ensures it's a string and removes non-digit characters
     */
    public static String formatABN(Object abnObj) {
        if (abnObj == null) return '';
        String abn = String.valueOf(abnObj);
        return abn.replaceAll('\\D', '');
    }

    /**
     * Maps Salesforce gender values to OZEDI format.
     */
    public static String mapGender(String gender) {
        if (gender == 'Male') return 'M';
        if (gender == 'Female') return 'F';
        return gender != null ? gender : '';
    }

    /**
     * Calculates total contributions for a staff member.
     */
    public static Decimal calculateTotalContributions(Staff_Payroll_Setting__c sp) {
        Decimal total = 0;
        if (sp.Super_And_Voluntary_Supper_Annuation__c != null) {
            total += sp.Super_And_Voluntary_Supper_Annuation__c;
        }
        return total.setScale(2);
    }

    /**
     * Formats a decimal amount as string with 2 decimal places.
     */
    public static String formatAmount(Decimal amount) {
        if (amount == null) return '0.00';
        return amount.setScale(2).format();
    }

    /**
     * Checks the status of an uploaded contribution transaction.
     */
    @AuraEnabled
    public static Map<String, Object> checkContributionStatus(String uploadUuid) {
        System.debug('========== checkContributionStatus START ==========');
        System.debug('Input Upload UUID: ' + uploadUuid);

        if (String.isBlank(uploadUuid)) {
            System.debug('ERROR: Upload UUID is blank.');
            throw new AuraHandledException('Upload UUID is required.');
        }

        try {
            HttpResponse response = getUploadStatus(uploadUuid);

            System.debug('Response Status Code: ' + response.getStatusCode());
            System.debug('Response Status: ' + response.getStatus());

            if (response.getStatusCode() != 200) {
                System.debug('Non-200 status code: ' + response.getStatusCode());
                
                Map<String, Object> fallbackStatus = new Map<String, Object>();
                fallbackStatus.put('uploadStatus', 'UPLOAD_PROCESSING');
                fallbackStatus.put('message', 'Status check returned ' + response.getStatusCode() + '. Please check later.');
                fallbackStatus.put('uploadUuid', uploadUuid);
                fallbackStatus.put('statusCode', response.getStatusCode());
                
                return fallbackStatus;
            }

            String responseBody = response.getBody();
            System.debug('Response Body: ' + responseBody);
            
            Map<String, Object> statusMap;
            
            try {
                statusMap = (Map<String, Object>)JSON.deserializeUntyped(responseBody);
                System.debug('Successfully parsed JSON response');
            } catch (Exception jsonEx) {
                System.debug('Failed to parse JSON: ' + jsonEx.getMessage());
                
                Map<String, Object> fallbackStatus = new Map<String, Object>();
                fallbackStatus.put('uploadStatus', 'UPLOAD_PROCESSING');
                fallbackStatus.put('message', 'Upload is being processed. Please check status later.');
                fallbackStatus.put('uploadUuid', uploadUuid);
                fallbackStatus.put('rawResponse', responseBody);
                fallbackStatus.put('error', jsonEx.getMessage());
                
                return fallbackStatus;
            }

            String status = (String)statusMap.get('uploadStatus');
            System.debug('Upload Status from API: ' + status);

            String normalizedStatus = status;
            if (status == 'UPLOAD_SEND_SUCCESS' || status == 'UPLOAD_SENT') {
                normalizedStatus = 'SENT';
            }

            // Update payroll record if status has changed
            List<Payroll_Setting__c> payRuns = [
                SELECT Id, Name, OZEDI_Upload_Status__c, OZEDI_Upload_UUID__c
                FROM Payroll_Setting__c
                WHERE OZEDI_Upload_UUID__c LIKE :('%' + uploadUuid + '%')
                LIMIT 1
            ];

            if (!payRuns.isEmpty()) {
                payRuns[0].OZEDI_Upload_Status__c = normalizedStatus;
                update payRuns;
                System.debug('Payroll upload status updated to: ' + normalizedStatus);
            }

            System.debug('========== checkContributionStatus END ==========');
            return statusMap;

        } catch (Exception ex) {
            System.debug('Exception: ' + ex.getMessage());
            
            Map<String, Object> fallbackStatus = new Map<String, Object>();
            fallbackStatus.put('uploadStatus', 'UPLOAD_PROCESSING');
            fallbackStatus.put('message', 'Status check temporarily unavailable. Please check later.');
            fallbackStatus.put('uploadUuid', uploadUuid);
            fallbackStatus.put('error', ex.getMessage());
            
            return fallbackStatus;
        }
    }

    /**
     * Sends a prepared contribution transaction.
     */
    @AuraEnabled
    public static Map<String, Object> sendContribution(String uploadUuid) {
        System.debug('===== START sendContribution =====');
        System.debug('Upload UUID: ' + uploadUuid);
        
        Map<String, Object> result = new Map<String, Object>();
        result.put('success', false);
        result.put('message', '');
        result.put('statusCode', 0);
        
        if (String.isBlank(uploadUuid)) {
            result.put('message', 'Upload UUID is required.');
            result.put('success', false);
            return result;
        }

        try {
            HttpResponse response = sendUpload(uploadUuid);
            
            System.debug('Response Status Code: ' + response.getStatusCode());
            System.debug('Response Body: ' + response.getBody());

            if (response.getStatusCode() == 200 || response.getStatusCode() == 201) {
                String responseBody = response.getBody();
                
                if (String.isBlank(responseBody)) {
                    System.debug('WARNING: Empty response body received');
                    result.put('success', true);
                    result.put('message', 'Contribution sent successfully');
                    result.put('statusCode', response.getStatusCode());
                    
                    // Update status without calling status API
                    updateUploadStatus(uploadUuid, 'SENT');
                    
                    return result;
                }
                
                try {
                    Map<String, Object> responseMap = 
                        (Map<String, Object>)JSON.deserializeUntyped(responseBody);
                    
                    System.debug('Parsed Response: ' + JSON.serializePretty(responseMap));

                    // Update status without calling status API
                    updateUploadStatus(uploadUuid, 'SENT');

                    result.put('success', true);
                    result.put('message', 'Contribution sent successfully');
                    result.put('statusCode', response.getStatusCode());
                    result.put('response', responseMap);
                    
                    return result;
                    
                } catch (Exception parseEx) {
                    System.debug('Error parsing response: ' + parseEx.getMessage());
                    
                    result.put('success', true);
                    result.put('message', 'Contribution sent successfully');
                    result.put('statusCode', response.getStatusCode());
                    result.put('rawResponse', responseBody);
                    result.put('parseError', parseEx.getMessage());
                    
                    // Update status without calling status API
                    updateUploadStatus(uploadUuid, 'SENT');
                    
                    return result;
                }
            } else {
                result.put('success', false);
                result.put('message', 'Send failed: Status ' + response.getStatusCode() + ' - ' + response.getStatus());
                result.put('statusCode', response.getStatusCode());
                result.put('responseBody', response.getBody());
                
                throw new CalloutException('Send failed: Status ' + response.getStatusCode() + ' - ' + response.getBody());
            }

        } catch (Exception ex) {
            System.debug('Exception: ' + ex.getMessage());
            
            result.put('success', false);
            result.put('message', 'Failed to send contribution: ' + ex.getMessage());
            
            return result;
        }
    }

    /**
     * Gets validation history for a specific employee
     */
    @AuraEnabled
    public static List<OZEDI_Validation_Log__c> getValidationHistory(String staffPayrollId) {
        
        if (String.isBlank(staffPayrollId)) {
            throw new AuraHandledException('Staff Payroll ID is required.');
        }
        
        try {
            return [
                SELECT Id, Validation_Status__c, Validation_Errors__c, 
                       Error_Types__c, Validation_Date__c, Processed_By_OZEDI__c,
                       Contribution_Amount__c, Upload_UUID__c, Super_Number__c,
                       Super_ABN__c, Super_Fund_Name__c, USI__c
                FROM OZEDI_Validation_Log__c
                WHERE Staff_Payroll_Setting__c = :staffPayrollId
                ORDER BY Validation_Date__c DESC
                LIMIT 20
            ];
        } catch (Exception ex) {
            throw new AuraHandledException('Error retrieving validation history: ' + ex.getMessage());
        }
    }

    /**
     * Gets validation summary for a pay run
     */
    @AuraEnabled
    public static Map<String, Object> getValidationSummary(String paySetId) {
        
        Map<String, Object> result = new Map<String, Object>();
        result.put('paySetId', paySetId);
        result.put('totalValidations', 0);
        result.put('validCount', 0);
        result.put('failedCount', 0);
        result.put('processedCount', 0);
        result.put('latestValidationDate', null);
        
        if (String.isBlank(paySetId)) {
            throw new AuraHandledException('Payrun Id is required.');
        }
        
        try {
            List<AggregateResult> summary = [
                SELECT Validation_Status__c, 
                       COUNT(Id) total,
                       MAX(Validation_Date__c) latestDate
                FROM OZEDI_Validation_Log__c
                WHERE Payroll_Setting__c = :paySetId
                GROUP BY Validation_Status__c
            ];
            
            Integer validCount = 0;
            Integer failedCount = 0;
            Integer total = 0;
            DateTime latestDate = null;
            
            for (AggregateResult ar : summary) {
                String status = (String)ar.get('Validation_Status__c');
                Integer count = (Integer)ar.get('total');
                DateTime latest = (DateTime)ar.get('latestDate');
                
                if (status == 'VALID') {
                    validCount = count;
                } else if (status == 'FAILED') {
                    failedCount = count;
                }
                
                total += count;
                
                if (latest != null && (latestDate == null || latest > latestDate)) {
                    latestDate = latest;
                }
            }
            
            Integer processedCount = 0;
            List<AggregateResult> processedSummary = [
                SELECT COUNT(Id) total
                FROM OZEDI_Validation_Log__c
                WHERE Payroll_Setting__c = :paySetId
                AND Processed_By_OZEDI__c = true
            ];
            
            if (!processedSummary.isEmpty()) {
                processedCount = (Integer)processedSummary[0].get('total');
            }
            
            result.put('totalValidations', total);
            result.put('validCount', validCount);
            result.put('failedCount', failedCount);
            result.put('processedCount', processedCount);
            result.put('latestValidationDate', latestDate);
            
            return result;
            
        } catch (Exception ex) {
            throw new AuraHandledException('Error getting validation summary: ' + ex.getMessage());
        }
    }

    @AuraEnabled
    public static List<OZEDI_Validation_Log__c> getValidationLogs(String paySetId) {
        try {
            List<OZEDI_Validation_Log__c> logs = [
                SELECT Id, Name, CreatedDate, LastModifiedDate,
                    Contribution_Amount__c, CreatedById, Employee__c,
                    Employee__r.Name, Error_Types__c, LastModifiedById,
                    OwnerId, Payroll_Setting__c, Payroll_Setting__r.Name,
                    Processed_By_OZEDI__c, Staff_Payroll_Setting__c,
                    Staff_Payroll_Setting__r.Name, Super_ABN__c,
                    Super_Fund_Name__c, Super_Number__c, Upload_UUID__c,
                    USI__c, Validation_Date__c, Validation_Errors__c,
                    Validation_Status__c
                FROM OZEDI_Validation_Log__c
                WHERE Payroll_Setting__c = :paySetId
                ORDER BY Employee__c, CreatedDate DESC
            ];

            Map<Id, OZEDI_Validation_Log__c> latestEmployeeLogs = new Map<Id, OZEDI_Validation_Log__c>();

            for (OZEDI_Validation_Log__c log : logs) {
                if (log.Employee__c != null && !latestEmployeeLogs.containsKey(log.Employee__c)) {
                    latestEmployeeLogs.put(log.Employee__c, log);
                }
            }

            return latestEmployeeLogs.values();

        } catch (Exception e) {
            throw new AuraHandledException('Failed to get validation logs: ' + e.getMessage());
        }
    }

    /**
     * Generates error report for failed employees
     */
    public static String generateErrorReport(List<Map<String, Object>> failedEmployees) {
    
        if (failedEmployees == null || failedEmployees.isEmpty()) {
            return 'No errors to report.';
        }
        
        String report = '========== EMPLOYEE VALIDATION ERRORS ==========\n';
        report += 'Total Failed: ' + failedEmployees.size() + '\n\n';
        
        Integer count = 1;
        for (Map<String, Object> failure : failedEmployees) {
            String employeeName = (String)failure.get('employeeName');
            report += count + '. ' + employeeName + '\n';
            report += '   Errors:\n';
            
            List<String> errors = (List<String>)failure.get('errors');
            if (errors != null && !errors.isEmpty()) {
                for (String error : errors) {
                    report += '   - ' + error + '\n';
                }
            }
            report += '\n';
            count++;
        }
        
        report += '====================================================\n';
        
        return report;
    }

    /**
     * Generates error summary for failed employees
     */
    public static String generateErrorSummary(List<Map<String, Object>> failedEmployees) {
        
        if (failedEmployees == null || failedEmployees.isEmpty()) {
            return '';
        }
        
        String summary = '\n⚠️ FAILED EMPLOYEES SUMMARY:\n';
        summary += '----------------------------------------\n';
        
        Integer count = 1;
        for (Map<String, Object> failure : failedEmployees) {
            String employeeName = (String)failure.get('employeeName');
            List<String> errors = (List<String>)failure.get('errors');
            
            summary += count + '. ' + employeeName + '\n';
            if (errors != null && !errors.isEmpty()) {
                for (String error : errors) {
                    summary += '   • ' + error + '\n';
                }
            }
            summary += '\n';
            count++;
        }
        
        summary += '----------------------------------------\n';
        summary += '💡 Please fix the errors above and retry.\n';
        
        return summary;
    }

    /**
     * Retries specific failed contributions
     */
    @AuraEnabled
    public static Map<String, Object> retrySpecificFailedContributions(List<String> logIds, String paySetId) {
        
        System.debug('===== retrySpecificFailedContributions START =====');
        System.debug('Log IDs to retry: ' + logIds);
        System.debug('PaySetId: ' + paySetId);
        
        Map<String, Object> result = new Map<String, Object>();
        result.put('success', false);
        result.put('message', '');
        result.put('retriedEmployees', new List<String>());
        result.put('stillFailedEmployees', new List<Map<String, Object>>());
        result.put('retriedLogIds', new List<String>());
        
        if (logIds == null || logIds.isEmpty()) {
            result.put('message', 'No validation logs selected for retry.');
            result.put('success', false);
            return result;
        }
        
        if (String.isBlank(paySetId)) {
            result.put('message', 'Payroll Setting ID is required.');
            result.put('success', false);
            return result;
        }
        
        try {
            // Get selected logs
            List<OZEDI_Validation_Log__c> selectedLogs = [
                SELECT Id, Staff_Payroll_Setting__c, Employee__c,
                    Staff_Payroll_Setting__r.Id,
                    Staff_Payroll_Setting__r.Staff__r.Name,
                    Staff_Payroll_Setting__r.Staff__r.Last_Name__c,
                    Staff_Payroll_Setting__r.Staff__r.OZEDI_Upload_UUID__c,
                    Staff_Payroll_Setting__r.Staff__r.OZEDI_Response__c,
                    Validation_Status__c, Validation_Errors__c
                FROM OZEDI_Validation_Log__c
                WHERE Id IN :logIds
                AND Payroll_Setting__c = :paySetId
                AND Validation_Status__c = 'FAILED'
            ];
            
            System.debug('Found ' + selectedLogs.size() + ' selected logs');
            
            if (selectedLogs.isEmpty()) {
                result.put('message', 'No valid failed logs found for the selected IDs.');
                result.put('success', false);
                return result;
            }
            
            // Get the staff payroll records for these logs
            Set<Id> staffPayrollIds = new Set<Id>();
            Map<Id, OZEDI_Validation_Log__c> logMap = new Map<Id, OZEDI_Validation_Log__c>();
            
            for (OZEDI_Validation_Log__c log : selectedLogs) {
                staffPayrollIds.add(log.Staff_Payroll_Setting__c);
                logMap.put(log.Staff_Payroll_Setting__c, log);
            }
            
            List<Staff_Payroll_Setting__c> staffPayrolls = [
                SELECT Id, Name, Staff__c,
                    Staff__r.Name, Staff__r.Last_Name__c,
                    Staff__r.Superannuation_Number__c,
                    Staff__r.Super_ABN__c,
                    Staff__r.Superannuation_Name__c,
                    Staff__r.Unique_Superannuation_Identifier__c,
                    Staff__r.Date_Of_Birth__c,
                    Staff__r.Address__Street__s,
                    Staff__r.Address__City__s,
                    Staff__r.Address__StateCode__s,
                    Staff__r.Address__PostalCode__s,
                    Staff__r.Address__CountryCode__s,
                    Staff__r.Email_Address__c,
                    Staff__r.Contact_Number__c,
                    Staff__r.Emp_exit_date__c,
                    Staff__r.Gender__c,
                    Staff__r.OZEDI_Upload_UUID__c,
                    Staff__r.OZEDI_Response__c,
                    Staff__r.OZEDI_Upload_Date_Time__c,
                    Staff__r.ESA__c, 
                    Staff__r.Fund_Bank_BSB__c, 
                    Staff__r.Fund_Bank_Account_Number__c,
                    Super_And_Voluntary_Supper_Annuation__c,
                    Payroll_Setting__r.Period_Start_Date__c,
                    Payroll_Setting__r.Period_End_Date__c
                FROM Staff_Payroll_Setting__c
                WHERE Id IN :staffPayrollIds
            ];
            
            if (staffPayrolls.isEmpty()) {
                result.put('message', 'No staff payroll records found for the selected logs.');
                result.put('success', false);
                return result;
            }
            
            // Re-validate employees
            List<Staff_Payroll_Setting__c> nowValid = new List<Staff_Payroll_Setting__c>();
            List<Staff_Payroll_Setting__c> stillFailed = new List<Staff_Payroll_Setting__c>();
            List<Map<String, Object>> failedEmployees = new List<Map<String, Object>>();
            
            for (Staff_Payroll_Setting__c sp : staffPayrolls) {
                Map<String, Object> validationResult = validateEmployeeForContribution(sp);
                
                String employeeName = sp.Staff__r.Name + ' ' + sp.Staff__r.Last_Name__c;
                
                if ((Boolean)validationResult.get('valid')) {
                    nowValid.add(sp);
                } else {
                    stillFailed.add(sp);
                    Map<String, Object> failure = new Map<String, Object>();
                    failure.put('staffPayrollId', sp.Id);
                    failure.put('employeeId', sp.Staff__c);
                    failure.put('employeeName', employeeName);
                    failure.put('errors', validationResult.get('errors'));
                    failure.put('errorTypes', validationResult.get('errorTypes'));
                    failure.put('logId', logMap.get(sp.Id)?.Id);
                    failedEmployees.add(failure);
                }
            }
            
            // Process valid employees in a single call
            String uploadUuid = null;
            List<String> retriedNames = new List<String>();
            
            if (!nowValid.isEmpty()) {
                // Get Payroll Setting
                Payroll_Setting__c payRun = [
                    SELECT Id, Name, Organization__c, 
                        Period_End_Date__c, Period_Start_Date__c
                    FROM Payroll_Setting__c
                    WHERE Id = :paySetId
                    LIMIT 1
                ];
                
                // Get Organisation
                Organisation__c organisation = [
                    SELECT Id, Name, ABN__c, Email__c, Contact_No__c,
                        OZEDI_Client_Id__c, Account_Number__c,
                        BSB__c, Account_Name__c
                    FROM Organisation__c
                    WHERE Id = :payRun.Organization__c
                    LIMIT 1
                ];
                
                // Get OZEDI Settings
                OZEDI_Setting__mdt settings = OZEDI_Setting__mdt.getInstance('Default');
                
                // Authenticate
                String accessToken = authenticateOZEDI();
                
                // Build request for all valid employees
                String requestBody = buildContributionRequestBodyString(
                    organisation,
                    payRun,
                    nowValid
                );
                
                // Call OZEDI API
                String endpoint = buildContributionEndpoint(organisation, settings);
                
                HttpRequest request = new HttpRequest();
                request.setEndpoint(endpoint);
                request.setMethod('POST');
                request.setHeader('Authorization', 'Bearer ' + accessToken);
                request.setHeader('Content-Type', 'application/json');
                request.setTimeout(120000);
                request.setBody(requestBody);
                
                Http http = new Http();
                HttpResponse response = http.send(request);
                
                if (response.getStatusCode() == 200 || response.getStatusCode() == 201) {
                    Map<String, Object> responseMap = 
                        (Map<String, Object>)JSON.deserializeUntyped(response.getBody());
                    
                    String newUuid = (String)responseMap.get('uploadUuid');
                    
                    if (String.isNotBlank(newUuid)) {
                        uploadUuid = newUuid;
                        
                        // Auto-send
                        try {
                            HttpResponse sendResponse = sendUpload(newUuid);
                            System.debug('Send response: ' + sendResponse.getStatusCode());
                        } catch (Exception sendEx) {
                            System.debug('Error sending upload: ' + sendEx.getMessage());
                        }
                        
                        // Create validation logs for all valid employees
                        for (Staff_Payroll_Setting__c sp : nowValid) {
                            String employeeName = sp.Staff__r.Name + ' ' + sp.Staff__r.Last_Name__c;
                            retriedNames.add(employeeName);
                            createEmployeeValidationLog(sp, paySetId, newUuid, true, null);
                        }
                    }
                }
                
                if (String.isNotBlank(uploadUuid)) {
                    result.put('uploadUuid', uploadUuid);
                    result.put('success', true);
                    result.put('message', 'Successfully processed ' + retriedNames.size() + ' previously failed employees.');
                }
            } else {
                result.put('success', false);
                result.put('message', 'No employees passed validation. All ' + staffPayrolls.size() + ' still have errors.');
                result.put('stillFailedEmployees', failedEmployees);
                return result;
            }
            
            // Mark old logs as processed
            markLogsAsProcessed(logIds);
            result.put('retriedLogIds', logIds);
            
            // Build activity log
            String activityMessage = 'Retry: Processed ' + retriedNames.size() + ' employees.';
            if (!stillFailed.isEmpty()) {
                activityMessage += ' ' + stillFailed.size() + ' employees still have errors.';
            }
            createStaffPayrollActivity(paySetId, 'Superannuation Retry', activityMessage, uploadUuid, DateTime.now());
            
            result.put('retriedEmployees', retriedNames);
            if (!stillFailed.isEmpty()) {
                result.put('stillFailedEmployees', failedEmployees);
            }
            
            System.debug('===== retrySpecificFailedContributions END =====');
            return result;
            
        } catch (Exception ex) {
            System.debug('Error in retrySpecificFailedContributions: ' + ex.getMessage());
            result.put('success', false);
            result.put('message', 'Error during retry: ' + ex.getMessage());
            return result;
        }
    }

    /**
     * Mark validation logs as processed after retry
     */
    public static void markLogsAsProcessed(List<String> logIds) {
        try {
            List<OZEDI_Validation_Log__c> logsToUpdate = [
                SELECT Id, Processed_By_OZEDI__c
                FROM OZEDI_Validation_Log__c
                WHERE Id IN :logIds
            ];
            
            if (!logsToUpdate.isEmpty()) {
                for (OZEDI_Validation_Log__c log : logsToUpdate) {
                    log.Processed_By_OZEDI__c = true;
                }
                update logsToUpdate;
                System.debug('Marked ' + logsToUpdate.size() + ' logs as processed');
            }
        } catch (Exception ex) {
            System.debug('Error marking logs as processed: ' + ex.getMessage());
        }
    }

    /**
     * Gets employees who need MVR verification
     */
    @AuraEnabled
    public static Map<String, Object> getEmployeesNeedingMVR(String paySetId) {
        
        Map<String, Object> result = new Map<String, Object>();
        result.put('totalEmployees', 0);
        result.put('mvrCompleted', 0);
        result.put('mvrPending', 0);
        result.put('mvrFailed', 0);
        result.put('employees', new List<Map<String, Object>>());
        
        if (String.isBlank(paySetId)) {
            return result;
        }
        
        try {
            List<Staff_Payroll_Setting__c> staffPayrolls = [
                SELECT Id, Staff__c,
                    Staff__r.Name, Staff__r.Last_Name__c,
                    Staff__r.OZEDI_Upload_UUID__c,
                    Staff__r.OZEDI_Response__c,
                    Staff__r.OZEDI_Upload_Date_Time__c,
                    Super_And_Voluntary_Supper_Annuation__c
                FROM Staff_Payroll_Setting__c
                WHERE Payroll_Setting__c = :paySetId
            ];
            
            result.put('totalEmployees', staffPayrolls.size());
            
            List<Map<String, Object>> employeeList = new List<Map<String, Object>>();
            Integer mvrCompleted = 0;
            Integer mvrPending = 0;
            Integer mvrFailed = 0;
            
            for (Staff_Payroll_Setting__c sp : staffPayrolls) {
                Map<String, Object> emp = new Map<String, Object>();
                emp.put('staffId', sp.Staff__c);
                emp.put('employeeName', sp.Staff__r.Name + ' ' + sp.Staff__r.Last_Name__c);
                emp.put('ozediUploadUuid', sp.Staff__r.OZEDI_Upload_UUID__c);
                emp.put('ozediResponse', sp.Staff__r.OZEDI_Response__c);
                emp.put('ozediUploadDate', sp.Staff__r.OZEDI_Upload_Date_Time__c);
                emp.put('contributionAmount', sp.Super_And_Voluntary_Supper_Annuation__c);
                
                String mvrStatus = 'NOT_STARTED';
                if (String.isNotBlank(sp.Staff__r.OZEDI_Upload_UUID__c)) {
                    String response = sp.Staff__r.OZEDI_Response__c;
                    if (String.isNotBlank(response)) {
                        if (response.contains('ERROR') || response.contains('FAILED') || 
                            response.contains('error') || response.contains('failed')) {
                            mvrStatus = 'FAILED';
                            mvrFailed++;
                        } else {
                            mvrStatus = 'COMPLETED';
                            mvrCompleted++;
                        }
                    } else {
                        mvrStatus = 'PENDING';
                        mvrPending++;
                    }
                } else {
                    mvrPending++;
                }
                
                emp.put('mvrStatus', mvrStatus);
                employeeList.add(emp);
            }
            
            result.put('mvrCompleted', mvrCompleted);
            result.put('mvrPending', mvrPending);
            result.put('mvrFailed', mvrFailed);
            result.put('employees', employeeList);
            
            return result;
            
        } catch (Exception ex) {
            result.put('error', ex.getMessage());
            return result;
        }
    }

    // ==========================================
    // ABA FILE GENERATION
    // ==========================================

    /**
     * Generates ABA file for the given payroll setting
     * FIXED: Supports multiple UUIDs
     */
    @AuraEnabled
    public static Map<String, Object> generateABAFile(String paySetId) {
        
        System.debug('===== generateABAFile START =====');
        System.debug('PaySetId: ' + paySetId);
        
        Long startTime = DateTime.now().getTime();
        Map<String, Object> result = new Map<String, Object>();
        result.put('success', false);
        result.put('message', '');
        result.put('abaData', new List<Map<String, Object>>());
        result.put('fileName', '');
        result.put('fileContent', '');
        result.put('uploadUuid', '');
        result.put('uploadStatus', '');
        result.put('rawResponse', '');
        result.put('errorDetails', '');
        result.put('multipleUUIDs', false);
        result.put('abaFiles', new List<Map<String, Object>>());
        
        if (String.isBlank(paySetId)) {
            System.debug('ERROR: PaySetId is blank');
            result.put('message', 'Payroll Setting ID is required.');
            return result;
        }
        
        try {
            // Get Payroll Setting
            Payroll_Setting__c payRun = [
                SELECT Id, Name, Organization__c, 
                    Period_Start_Date__c, Period_End_Date__c
                FROM Payroll_Setting__c
                WHERE Id = :paySetId
                LIMIT 1
            ];
            
            // Get Organisation
            Organisation__c organisation = [
                SELECT Id, Name, ABN__c, Email__c, Contact_No__c,
                    OZEDI_Client_Id__c, Account_Number__c,
                    BSB__c, Account_Name__c
                FROM Organisation__c
                WHERE Id = :payRun.Organization__c
                LIMIT 1
            ];
            
            // Get OZEDI Settings
            OZEDI_Setting__mdt settings = OZEDI_Setting__mdt.getInstance('Default');
            
            // ==============================================
            // FIX: GROUP EMPLOYEES BY UPLOAD UUID
            // ==============================================
            
            // Get all validation logs for this pay run
            List<OZEDI_Validation_Log__c> validationLogs = [
                SELECT Id, Upload_UUID__c, Validation_Status__c, 
                    Employee__c, Contribution_Amount__c,
                    CreatedDate, Employee__r.Name, Employee__r.Last_Name__c,
                    Employee__r.Account_Number__c, Employee__r.BSB__c,
                    Employee__r.Account_Name__c
                FROM OZEDI_Validation_Log__c
                WHERE Payroll_Setting__c = :paySetId
                AND Validation_Status__c = 'VALID'
                AND Upload_UUID__c != NULL
                ORDER BY Upload_UUID__c, Employee__c
            ];
            
            // If no validation logs, try manual generation
            if (validationLogs.isEmpty()) {
                System.debug('No validation logs found - using manual generation');
                return generateManualABA(paySetId, payRun, organisation);
            }
            
            // ==============================================
            // GROUP BY UUID
            // ==============================================
            Map<String, List<OZEDI_Validation_Log__c>> uuidGroupMap = new Map<String, List<OZEDI_Validation_Log__c>>();
            
            for (OZEDI_Validation_Log__c log : validationLogs) {
                String uuid = log.Upload_UUID__c;
                if (String.isNotBlank(uuid)) {
                    if (!uuidGroupMap.containsKey(uuid)) {
                        uuidGroupMap.put(uuid, new List<OZEDI_Validation_Log__c>());
                    }
                    uuidGroupMap.get(uuid).add(log);
                }
            }
            
            System.debug('UUID Groups Found: ' + uuidGroupMap.size());
            for (String uuid : uuidGroupMap.keySet()) {
                System.debug('UUID: ' + uuid + ' has ' + uuidGroupMap.get(uuid).size() + ' employees');
            }
            
            // ==============================================
            // CASE 1: SINGLE UUID - Generate one ABA file
            // ==============================================
            if (uuidGroupMap.size() == 1) {
                String uploadUuid = new List<String>(uuidGroupMap.keySet())[0];
                List<OZEDI_Validation_Log__c> logs = uuidGroupMap.get(uploadUuid);
                
                System.debug('Single UUID found: ' + uploadUuid);
                System.debug('Employees in this UUID: ' + logs.size());
                
                // Get employee IDs
                Set<Id> employeeIds = new Set<Id>();
                for (OZEDI_Validation_Log__c log : logs) {
                    if (log.Employee__c != null) {
                        employeeIds.add(log.Employee__c);
                    }
                }
                
                // Get staff payroll records
                List<Staff_Payroll_Setting__c> staffPayrolls = [
                    SELECT Id, Name, Staff__c, 
                        Staff__r.Name, Staff__r.Last_Name__c,
                        Staff__r.Account_Number__c, Staff__r.BSB__c, 
                        Staff__r.Account_Name__c,
                        Super_And_Voluntary_Supper_Annuation__c
                    FROM Staff_Payroll_Setting__c
                    WHERE Payroll_Setting__c = :paySetId
                    AND Staff__c IN :employeeIds
                ];
                
                // If no staff payrolls found, try getting from validation logs
                if (staffPayrolls.isEmpty()) {
                    return generateManualABAFromLogs(paySetId, payRun, organisation, logs);
                }
                
                // Generate ABA for this UUID
                return generateABAForUUID(paySetId, payRun, organisation, uploadUuid, staffPayrolls, logs);
            }
            
            // ==============================================
            // CASE 2: MULTIPLE UUIDs - Generate multiple ABA files
            // ==============================================
            else {
                System.debug('Multiple UUIDs found: ' + uuidGroupMap.size());
                result.put('multipleUUIDs', true);
                result.put('message', 'Multiple upload UUIDs found. Generating separate ABA files.');
                
                List<Map<String, Object>> abaFiles = new List<Map<String, Object>>();
                List<Map<String, Object>> allAbaData = new List<Map<String, Object>>();
                String combinedFileContent = '';
                Integer totalEmployees = 0;
                
                for (String uploadUuid : uuidGroupMap.keySet()) {
                    List<OZEDI_Validation_Log__c> logs = uuidGroupMap.get(uploadUuid);
                    
                    System.debug('Processing UUID: ' + uploadUuid + ' with ' + logs.size() + ' employees');
                    
                    // Get employee IDs for this UUID
                    Set<Id> employeeIds = new Set<Id>();
                    for (OZEDI_Validation_Log__c log : logs) {
                        if (log.Employee__c != null) {
                            employeeIds.add(log.Employee__c);
                        }
                    }
                    
                    // Get staff payroll records
                    List<Staff_Payroll_Setting__c> staffPayrolls = [
                        SELECT Id, Name, Staff__c, 
                            Staff__r.Name, Staff__r.Last_Name__c,
                            Staff__r.Account_Number__c, Staff__r.BSB__c, 
                            Staff__r.Account_Name__c,
                            Super_And_Voluntary_Supper_Annuation__c
                        FROM Staff_Payroll_Setting__c
                        WHERE Payroll_Setting__c = :paySetId
                        AND Staff__c IN :employeeIds
                    ];
                    
                    // Generate ABA for this UUID
                    Map<String, Object> singleResult = generateABAForUUID(
                        paySetId, 
                        payRun, 
                        organisation, 
                        uploadUuid, 
                        staffPayrolls, 
                        logs
                    );
                    
                    if ((Boolean)singleResult.get('success')) {
                        Map<String, Object> fileInfo = new Map<String, Object>();
                        fileInfo.put('uploadUuid', uploadUuid);
                        fileInfo.put('fileName', singleResult.get('fileName'));
                        fileInfo.put('fileContent', singleResult.get('fileContent'));
                        fileInfo.put('employeeCount', staffPayrolls.size());
                        fileInfo.put('abaData', singleResult.get('abaData'));
                        
                        abaFiles.add(fileInfo);
                        
                        // Combine for display
                        allAbaData.addAll((List<Map<String, Object>>)singleResult.get('abaData'));
                        combinedFileContent += '===== FILE FOR UUID: ' + uploadUuid + ' =====\n\n';
                        combinedFileContent += (String)singleResult.get('fileContent');
                        combinedFileContent += '\n\n';
                        totalEmployees += staffPayrolls.size();
                    }
                }
                
                // Return combined result
                result.put('success', true);
                result.put('message', 'Generated ' + abaFiles.size() + ' ABA files for ' + totalEmployees + ' employees.');
                result.put('abaData', allAbaData);
                result.put('abaFiles', abaFiles);
                result.put('fileContent', combinedFileContent);
                result.put('fileName', 'SuperContribution_Multiple_' + DateTime.now().format('yyyyMMdd') + '.aba');
                result.put('uploadStatus', 'MULTIPLE_UUIDS');
                result.put('uploadUuid', 'MULTIPLE');
                result.put('totalEmployees', totalEmployees);
                result.put('uuidCount', uuidGroupMap.size());
                
                createStaffPayrollActivity(
                    paySetId,
                    'ABA Extract (Multiple UUIDs)',
                    'Generated ' + abaFiles.size() + ' ABA files for ' + totalEmployees + ' employees across ' + uuidGroupMap.size() + ' uploads.',
                    'MULTIPLE',
                    DateTime.now()
                );
                
                return result;
            }
            
        } catch (Exception ex) {
            System.debug('ERROR in generateABAFile: ' + ex.getMessage());
            result.put('success', false);
            result.put('message', 'Error generating ABA: ' + ex.getMessage());
            return result;
        }
    }

    /**
     * Generate ABA for a specific UUID
     */
    public static Map<String, Object> generateABAForUUID(
        String paySetId,
        Payroll_Setting__c payRun,
        Organisation__c organisation,
        String uploadUuid,
        List<Staff_Payroll_Setting__c> staffPayrolls,
        List<OZEDI_Validation_Log__c> validationLogs
    ) {
        
        Map<String, Object> result = new Map<String, Object>();
        result.put('success', false);
        result.put('message', '');
        result.put('abaData', new List<Map<String, Object>>());
        result.put('fileName', '');
        result.put('fileContent', '');
        result.put('uploadUuid', uploadUuid);
        result.put('uploadStatus', '');
        result.put('rawResponse', '');
        result.put('errorDetails', '');
        
        try {
            // If staffPayrolls is empty, try manual generation from logs
            if (staffPayrolls == null || staffPayrolls.isEmpty()) {
                return generateManualABAFromLogs(paySetId, payRun, organisation, validationLogs);
            }
            
            // Remove duplicate employees
            Set<Id> processedStaffIds = new Set<Id>();
            List<Staff_Payroll_Setting__c> uniqueStaffPayrolls = new List<Staff_Payroll_Setting__c>();
            
            for (Staff_Payroll_Setting__c sp : staffPayrolls) {
                if (!processedStaffIds.contains(sp.Staff__c)) {
                    processedStaffIds.add(sp.Staff__c);
                    uniqueStaffPayrolls.add(sp);
                }
            }
            
            System.debug('Unique employees for UUID ' + uploadUuid + ': ' + uniqueStaffPayrolls.size());
            
            // Build ABA file content
            String abaContent = buildABAFileContent(organisation, uniqueStaffPayrolls, payRun);
            
            // Parse ABA content
            List<Map<String, Object>> abaData = parseABAContent(abaContent, uniqueStaffPayrolls);
            
            String dateStr = DateTime.now().format('yyyyMMdd');
            String fileName = 'SuperContribution_' + uploadUuid.left(8) + '_' + dateStr + '.aba';
            
            result.put('success', true);
            result.put('message', 'ABA file generated successfully for UUID: ' + uploadUuid);
            result.put('abaData', abaData);
            result.put('fileName', fileName);
            result.put('fileContent', abaContent);
            result.put('uploadUuid', uploadUuid);
            result.put('uploadStatus', 'COMPLETED');
            result.put('employeeCount', uniqueStaffPayrolls.size());
            
            return result;
            
        } catch (Exception ex) {
            System.debug('Error generating ABA for UUID: ' + ex.getMessage());
            result.put('success', false);
            result.put('message', 'Error: ' + ex.getMessage());
            return result;
        }
    }

    /**
     * Generate ABA manually from validation logs
     */
    public static Map<String, Object> generateManualABAFromLogs(
        String paySetId,
        Payroll_Setting__c payRun,
        Organisation__c organisation,
        List<OZEDI_Validation_Log__c> validationLogs
    ) {
        
        System.debug('===== generateManualABAFromLogs START =====');
        System.debug('Validation logs count: ' + validationLogs.size());
        
        Map<String, Object> result = new Map<String, Object>();
        result.put('success', false);
        result.put('message', '');
        result.put('abaData', new List<Map<String, Object>>());
        result.put('fileName', '');
        result.put('fileContent', '');
        result.put('generatedBy', 'Manual From Logs');
        
        try {
            if (validationLogs == null || validationLogs.isEmpty()) {
                result.put('message', 'No validation logs found.');
                return result;
            }
            
            // Build employee list from logs
            List<Staff_Payroll_Setting__c> staffPayrolls = new List<Staff_Payroll_Setting__c>();
            
            for (OZEDI_Validation_Log__c log : validationLogs) {
                Staff_Payroll_Setting__c sp = new Staff_Payroll_Setting__c();
                sp.Staff__c = log.Employee__c;
                
                // Create a dummy staff object with available data
                Staff__c staff = new Staff__c(
                    Id = log.Employee__c,
                    Name = log.Employee__r != null ? log.Employee__r.Name : 'Unknown',
                    Last_Name__c = log.Employee__r != null ? log.Employee__r.Last_Name__c : 'Unknown',
                    Account_Number__c = log.Employee__r != null ? log.Employee__r.Account_Number__c : null,
                    BSB__c = log.Employee__r != null ? log.Employee__r.BSB__c : null,
                    Account_Name__c = log.Employee__r != null ? log.Employee__r.Account_Name__c : null
                );
                sp.Staff__r = staff;
                
                staffPayrolls.add(sp);
            }
            
            // Remove duplicates
            Set<Id> processedStaffIds = new Set<Id>();
            List<Staff_Payroll_Setting__c> uniqueStaffPayrolls = new List<Staff_Payroll_Setting__c>();
            
            for (Staff_Payroll_Setting__c sp : staffPayrolls) {
                if (!processedStaffIds.contains(sp.Staff__c)) {
                    processedStaffIds.add(sp.Staff__c);
                    uniqueStaffPayrolls.add(sp);
                }
            }
            
            // Build ABA file content
            String abaContent = buildABAFileContent(organisation, uniqueStaffPayrolls, payRun);
            
            // Parse ABA content
            List<Map<String, Object>> abaData = parseABAContent(abaContent, uniqueStaffPayrolls);
            
            String dateStr = DateTime.now().format('yyyyMMdd');
            String fileName = 'SuperContribution_Manual_' + dateStr + '.aba';
            
            result.put('success', true);
            result.put('message', 'ABA file generated manually from logs');
            result.put('abaData', abaData);
            result.put('fileName', fileName);
            result.put('fileContent', abaContent);
            result.put('generatedBy', 'Manual From Logs');
            result.put('employeeCount', uniqueStaffPayrolls.size());
            
            return result;
            
        } catch (Exception ex) {
            System.debug('Error generating manual ABA from logs: ' + ex.getMessage());
            result.put('success', false);
            result.put('message', 'Error: ' + ex.getMessage());
            return result;
        }
    }

    /**
     * Generate ABA manually as fallback
     */
    public static Map<String, Object> generateManualABA(
        String paySetId,
        Payroll_Setting__c payRun,
        Organisation__c organisation
    ) {
        
        System.debug('===== generateManualABA START =====');
        
        Map<String, Object> result = new Map<String, Object>();
        result.put('success', false);
        result.put('message', '');
        result.put('abaData', new List<Map<String, Object>>());
        result.put('fileName', '');
        result.put('fileContent', '');
        result.put('generatedBy', 'Manual Fallback');
        
        try {
            List<Staff_Payroll_Setting__c> staffPayrolls = [
                SELECT Id, Name, Staff__c, 
                    Staff__r.Name, Staff__r.Last_Name__c,
                    Staff__r.Account_Number__c, Staff__r.BSB__c, 
                    Staff__r.Account_Name__c,
                    Super_And_Voluntary_Supper_Annuation__c
                FROM Staff_Payroll_Setting__c
                WHERE Payroll_Setting__c = :paySetId
                AND Super_And_Voluntary_Supper_Annuation__c != NULL
                AND Super_And_Voluntary_Supper_Annuation__c > 0
            ];
            
            if (staffPayrolls.isEmpty()) {
                result.put('message', 'No employees found with superannuation for this pay run.');
                return result;
            }
            
            // Remove duplicate employees
            Set<Id> processedStaffIds = new Set<Id>();
            List<Staff_Payroll_Setting__c> uniqueStaffPayrolls = new List<Staff_Payroll_Setting__c>();
            
            for (Staff_Payroll_Setting__c sp : staffPayrolls) {
                if (!processedStaffIds.contains(sp.Staff__c)) {
                    processedStaffIds.add(sp.Staff__c);
                    uniqueStaffPayrolls.add(sp);
                }
            }
            
            // Build ABA file content
            String abaContent = buildABAFileContent(organisation, uniqueStaffPayrolls, payRun);
            
            // Parse ABA content
            List<Map<String, Object>> abaData = parseABAContent(abaContent, uniqueStaffPayrolls);
            
            String dateStr = DateTime.now().format('yyyyMMdd');
            String fileName = 'SuperContribution_Fallback_' + dateStr + '.aba';
            
            result.put('success', true);
            result.put('message', 'ABA file generated successfully (manual fallback)');
            result.put('abaData', abaData);
            result.put('fileName', fileName);
            result.put('fileContent', abaContent);
            result.put('generatedBy', 'Manual Fallback');
            result.put('employeeCount', uniqueStaffPayrolls.size());
            
            return result;
            
        } catch (Exception ex) {
            System.debug('Error in generateManualABA: ' + ex.getMessage());
            result.put('success', false);
            result.put('message', 'Error generating manual ABA: ' + ex.getMessage());
            return result;
        }
    }

    // ==========================================
    // ABA FILE GENERATION - HELPER METHODS (WORKAROUND)
    // ==========================================

    /**
     * Left justify and blank fill
     */
    public static String leftBlank(String value, Integer length) {
        if (value == null) value = '';
        if (value.length() > length) value = value.substring(0, length);
        // Build spaces manually
        String spaces = '';
        for (Integer i = 0; i < length - value.length(); i++) {
            spaces += ' ';
        }
        return value + spaces;
    }

    /**
     * Right justify and zero fill (for numeric fields)
     */
    public static String rightZero(String value, Integer length) {
        if (value == null) value = '';
        if (value.length() > length) value = value.substring(0, length);
        // Build zeros manually
        String zeros = '';
        for (Integer i = 0; i < length - value.length(); i++) {
            zeros += '0';
        }
        return zeros + value;
    }

    /**
     * Right justify and blank fill
     */
    public static String rightBlank(String value, Integer length) {
        if (value == null) value = '';
        if (value.length() > length) value = value.substring(0, length);
        // Build spaces manually
        String spaces = '';
        for (Integer i = 0; i < length - value.length(); i++) {
            spaces += ' ';
        }
        return spaces + value;
    }

    /**
     * Format BSB (XXX-XXX)
     */
    public static String formatBSB(String value) {
        if (value == null) value = '';
        String digits = value.replaceAll('\\D', '');
        if (digits.length() != 6) {
            digits = '999999';
        }
        return digits.substring(0, 3) + '-' + digits.substring(3, 6);
    }

    /**
     * Format date as DDMMYY
     */
    public static String formatDate(Date d) {
        if (d == null) d = Date.today();
        String day = String.valueOf(d.day());
        String month = String.valueOf(d.month());
        String year = String.valueOf(d.year()).substring(2, 4);
        
        // Pad manually
        if (day.length() < 2) day = '0' + day;
        if (month.length() < 2) month = '0' + month;
        
        return day + month + year;
    }

    /**
     * Format amount (in cents, right justified, zero filled)
     */
    public static String formatCentsAmount(Decimal amount) {
        if (amount == null) amount = 0;
        Integer cents = Math.round(amount * 100);
        return rightZero(String.valueOf(cents), 10);
    }

    /**
     * Builds ABA file content according to BOQ Direct Entry Specification
     * Each record must be exactly 120 characters
     * Must end with CRLF (carriage-return/line feed)
     */
    public static String buildABAFileContent(
        Organisation__c org,
        List<Staff_Payroll_Setting__c> staffPayrolls,
        Payroll_Setting__c payRun
    ) {
        
        System.debug('===== buildABAFileContent START =====');
        
        // Remove duplicates
        Set<Id> processedStaffIds = new Set<Id>();
        List<Staff_Payroll_Setting__c> uniqueStaffPayrolls = new List<Staff_Payroll_Setting__c>();
        
        for (Staff_Payroll_Setting__c sp : staffPayrolls) {
            if (!processedStaffIds.contains(sp.Staff__c)) {
                processedStaffIds.add(sp.Staff__c);
                uniqueStaffPayrolls.add(sp);
            }
        }
        
        System.debug('Unique employees: ' + uniqueStaffPayrolls.size());
        
        // ============================================
        // DESCRIPTIVE RECORD (Type 0)
        // ============================================
        
        String userId = org.Account_Number__c != null ? 
            org.Account_Number__c.replaceAll('\\D', '') : '';
        
        // Ensure User ID is 6 digits
        if (userId.length() < 6) {
            userId = rightZero(userId, 6);
        } else if (userId.length() > 6) {
            userId = userId.substring(0, 6);
        }
        
        String userName = org.Name != null ? org.Name : 'Unknown';
        String description = 'SUPER'; // Max 12 chars
        
        String processDate = formatDate(payRun.Period_End_Date__c != null ? 
            payRun.Period_End_Date__c : Date.today());
        
        String descriptiveRecord = 
            '0' +                                          // Char 1: Record Type
            leftBlank('', 17) +                            // Char 2-18: Blank
            '01' +                                         // Char 19-20: Sequence Number
            leftBlank('BQL', 3) +                          // Char 21-23: BQL
            leftBlank('', 7) +                             // Char 24-30: Blank
            leftBlank(userName, 26) +                      // Char 31-56: User Name
            rightZero(userId, 6) +                         // Char 57-62: User ID
            leftBlank(description, 12) +                   // Char 63-74: Description
            processDate +                                  // Char 75-80: Processing Date
            leftBlank('', 40);                             // Char 81-120: Blank
        
        // Ensure exactly 120 characters
        if (descriptiveRecord.length() > 120) {
            descriptiveRecord = descriptiveRecord.substring(0, 120);
        } else if (descriptiveRecord.length() < 120) {
            descriptiveRecord = leftBlank(descriptiveRecord, 120);
        }
        
        System.debug('Descriptive Record: ' + descriptiveRecord);
        System.debug('Descriptive Record Length: ' + descriptiveRecord.length());
        
        // ============================================
        // DETAIL RECORDS (Type 1)
        // ============================================
        
        List<String> detailRecords = new List<String>();
        Decimal totalCredits = 0;
        Integer recordCount = 0;
        
        // Trace BSB - User's BSB for return
        String traceBSB = org.BSB__c != null ? formatBSB(org.BSB__c) : '124-001';
        
        // Trace Account - User's account for return
        String traceAccount = org.Account_Number__c != null ? 
            rightBlank(org.Account_Number__c.replaceAll('\\D', '').substring(0, 9), 9) : 
            rightBlank('', 9);
        
        String remitterName = org.Name != null ? 
            leftBlank(org.Name, 16) : leftBlank('Payroll', 16);
        
        for (Staff_Payroll_Setting__c sp : uniqueStaffPayrolls) {
            Staff__c staff = sp.Staff__r;
            
            if (staff == null) continue;
            
            Decimal amount = sp.Super_And_Voluntary_Supper_Annuation__c;
            if (amount == null || amount <= 0) continue;
            
            // Get BSB
            String bsb = '999-999'; // Default
            if (staff.BSB__c != null && String.isNotBlank(staff.BSB__c)) {
                bsb = formatBSB(staff.BSB__c);
            }
            
            // Get Account Number
            String accountNumber = rightBlank('', 9);
            if (staff.Account_Number__c != null && String.isNotBlank(staff.Account_Number__c)) {
                accountNumber = rightBlank(
                    staff.Account_Number__c.replaceAll('\\D', '').substring(0, 9), 
                    9
                );
            }
            
            // Account Title (Name)
            String accountTitle = staff.Account_Name__c != null && 
                String.isNotBlank(staff.Account_Name__c) ? 
                staff.Account_Name__c : 
                staff.Name + ' ' + staff.Last_Name__c;
            accountTitle = leftBlank(accountTitle, 32);
            
            // Transaction Code: 50 = General Credit
            String transactionCode = '50';
            
            // Amount in cents
            String amountStr = formatCentsAmount(amount);
            
            // Lodgement Reference
            String reference = sp.Name != null ? sp.Name : 'SUPER';
            reference = leftBlank(reference, 18);
            
            // Indicator: Blank for normal
            String indicator = ' ';
            
            // Build detail record
            String detailRecord = 
                '1' +                                          // Char 1: Record Type
                bsb +                                          // Char 2-8: BSB
                accountNumber +                                // Char 9-17: Account Number
                indicator +                                    // Char 18: Indicator
                transactionCode +                              // Char 19-20: Transaction Code
                amountStr +                                    // Char 21-30: Amount
                accountTitle +                                 // Char 31-62: Account Title
                reference +                                    // Char 63-80: Reference
                traceBSB +                                     // Char 81-87: Trace BSB
                traceAccount +                                 // Char 88-96: Trace Account
                remitterName +                                 // Char 97-112: Remitter Name
                rightZero('0', 8);                             // Char 113-120: Withholding Tax
            
            // Ensure exactly 120 characters
            if (detailRecord.length() > 120) {
                detailRecord = detailRecord.substring(0, 120);
            } else if (detailRecord.length() < 120) {
                detailRecord = leftBlank(detailRecord, 120);
            }
            
            System.debug('Detail Record ' + (recordCount + 1) + ': ' + detailRecord);
            
            detailRecords.add(detailRecord);
            totalCredits += amount;
            recordCount++;
        }
        
        // ============================================
        // CONTRA RECORD (Self-balancing Debit)
        // ============================================
        
        // IMPORTANT: BOQ requires a self-balancing file
        // The last transaction must be a settling transaction to the BOQ account
        // This is the CONTRA record - a debit entry for the total amount
        
        if (totalCredits > 0) {
            
            // Use the same trace BSB and account for the contra record
            // This creates a debit to the user's account, balancing the credits
            
            String contraAccountTitle = leftBlank(org.Name != null ? org.Name : 'Contra Account', 32);
            String contraReference = leftBlank('CONTRA SUPER', 18);
            String contraAmount = formatCentsAmount(totalCredits);
            
            // Transaction Code: 13 = General Debit
            String contraRecord = 
                '1' +                                          // Char 1: Record Type
                traceBSB +                                     // Char 2-8: BSB (user's BSB)
                traceAccount +                                 // Char 9-17: Account Number (user's account)
                ' ' +                                          // Char 18: Indicator (blank)
                '13' +                                         // Char 19-20: Transaction Code (Debit)
                contraAmount +                                 // Char 21-30: Amount
                contraAccountTitle +                           // Char 31-62: Account Title
                contraReference +                              // Char 63-80: Reference
                traceBSB +                                     // Char 81-87: Trace BSB
                traceAccount +                                 // Char 88-96: Trace Account
                remitterName +                                 // Char 97-112: Remitter Name
                rightZero('0', 8);                             // Char 113-120: Withholding Tax
            
            // Ensure exactly 120 characters
            if (contraRecord.length() > 120) {
                contraRecord = contraRecord.substring(0, 120);
            } else if (contraRecord.length() < 120) {
                contraRecord = leftBlank(contraRecord, 120);
            }
            
            System.debug('Contra Record: ' + contraRecord);
            
            detailRecords.add(contraRecord);
            recordCount++;
        }
        
        // ============================================
        // FILE TOTAL RECORD (Type 7)
        // ============================================
        
        Integer totalCents = Math.round(totalCredits * 100);
        
        // For self-balancing file:
        // Net Total = Credit Total - Debit Total = 0
        // Credit Total = Debit Total = totalCredits
        
        String fileTotalRecord = 
            '7' +                                          // Char 1: Record Type
            '999-999' +                                    // Char 2-8: BSB Filler
            leftBlank('', 12) +                            // Char 9-20: Blank
            rightZero('0', 10) +                           // Char 21-30: Net Total (must be 0)
            rightZero(String.valueOf(totalCents), 10) +    // Char 31-40: Credit Total
            rightZero(String.valueOf(totalCents), 10) +    // Char 41-50: Debit Total
            leftBlank('', 24) +                            // Char 51-74: Blank
            rightZero(String.valueOf(recordCount), 6) +    // Char 75-80: Record Count
            leftBlank('', 40);                             // Char 81-120: Blank
        
        // Ensure exactly 120 characters
        if (fileTotalRecord.length() > 120) {
            fileTotalRecord = fileTotalRecord.substring(0, 120);
        } else if (fileTotalRecord.length() < 120) {
            fileTotalRecord = leftBlank(fileTotalRecord, 120);
        }
        
        System.debug('File Total Record: ' + fileTotalRecord);
        System.debug('File Total Record Length: ' + fileTotalRecord.length());
        System.debug('Total Credits: $' + totalCredits);
        System.debug('Total Records: ' + recordCount);
        
        // ============================================
        // ASSEMBLE ABA FILE
        // ============================================
        
        // Each record must be exactly 120 characters and separated by CRLF
        List<String> allRecords = new List<String>();
        allRecords.add(descriptiveRecord);
        allRecords.addAll(detailRecords);
        allRecords.add(fileTotalRecord);
        
        // Join with CRLF (carriage-return/line feed)
        String abaContent = String.join(allRecords, '\r\n') + '\r\n';
        
        System.debug('===== buildABAFileContent END =====');
        System.debug('ABA Content Length: ' + abaContent.length());
        
        return abaContent;
    }

    /**
     * Parses ABA content into structured data
     * FIXED: Removes duplicate employees during parsing
     */
    public static List<Map<String, Object>> parseABAContent(
        String abaContent, 
        List<Staff_Payroll_Setting__c> staffPayrolls
    ) {
        
        List<Map<String, Object>> result = new List<Map<String, Object>>();
        
        if (String.isBlank(abaContent)) {
            return result;
        }
        
        List<String> lines = abaContent.split('\n');
        
        // Create a map with unique employees
        Map<String, Staff_Payroll_Setting__c> staffMap = new Map<String, Staff_Payroll_Setting__c>();
        Set<Id> processedStaffIds = new Set<Id>();
        
        for (Staff_Payroll_Setting__c sp : staffPayrolls) {
            // Use Staff ID as the key for uniqueness
            if (!processedStaffIds.contains(sp.Staff__c)) {
                processedStaffIds.add(sp.Staff__c);
                String key = sp.Staff__r.Name + ' ' + sp.Staff__r.Last_Name__c;
                staffMap.put(key, sp);
            }
        }
        
        System.debug('Unique staff map size: ' + staffMap.size());
        
        for (String line : lines) {
            if (String.isBlank(line)) {
                continue;
            }
            
            // Parse detail records (starting with '1')
            if (line.startsWith('1')) {
                try {
                    String bsb = line.substring(1, Math.min(7, line.length()));
                    String accountNumber = line.substring(7, Math.min(16, line.length()));
                    String amountStr = line.substring(16, Math.min(26, line.length()));
                    String accountName = line.substring(26, Math.min(58, line.length()));
                    String reference = line.substring(58, Math.min(76, line.length()));
                    
                    Decimal amount = 0;
                    try {
                        amount = Decimal.valueOf(amountStr) / 100;
                    } catch (Exception e) {
                        amount = 0;
                    }
                    
                    Map<String, Object> record = new Map<String, Object>();
                    record.put('bsb', bsb);
                    record.put('accountNumber', accountNumber);
                    record.put('amount', amount);
                    record.put('accountName', accountName.trim());
                    record.put('reference', reference.trim());
                    
                    String employeeName = accountName.trim();
                    if (staffMap.containsKey(employeeName)) {
                        Staff_Payroll_Setting__c sp = staffMap.get(employeeName);
                        record.put('employeeName', sp.Staff__r.Name + ' ' + sp.Staff__r.Last_Name__c);
                        record.put('staffId', sp.Staff__c);
                    } else {
                        record.put('employeeName', employeeName);
                    }
                    
                    result.add(record);
                    
                } catch (Exception ex) {
                    System.debug('Error parsing ABA line: ' + ex.getMessage());
                }
            }
        }
        
        System.debug('Parsed ' + result.size() + ' ABA records');
        return result;
    }


    /**
     * Processes payment for a pay run with multiple UUIDs
     * This calls the OZEDI API: {{URL_SS2}}/uploads/send/{{client_id}}
     */
    @AuraEnabled
    public static Map<String, Object> processPayrunPayment(String paySetId) {
        
        System.debug('===== processPayrunPayment START =====');
        System.debug('PaySetId: ' + paySetId);
        
        Map<String, Object> result = new Map<String, Object>();
        result.put('success', false);
        result.put('message', '');
        result.put('paySetId', paySetId);
        result.put('uploadUuids', new List<String>());
        result.put('results', new List<Map<String, Object>>());
        result.put('successfulUuids', new List<String>());
        result.put('failedUuids', new List<Map<String, Object>>());
        result.put('skippedUuids', new List<Map<String, Object>>());
        result.put('allSuccess', false);
        result.put('partialSuccess', false);
        
        if (String.isBlank(paySetId)) {
            result.put('message', 'Payroll Setting ID is required.');
            return result;
        }
        
        try {
            // Get all valid UUIDs for this pay run
            List<OZEDI_Validation_Log__c> logs = [
                SELECT Id, Upload_UUID__c, Employee__c
                FROM OZEDI_Validation_Log__c
                WHERE Payroll_Setting__c = :paySetId
                AND Upload_UUID__c != NULL
                AND Upload_UUID__c != ''
                AND Validation_Status__c = 'VALID'
                AND Processed_By_OZEDI__c = true
            ];
            
            if (logs.isEmpty()) {
                // Try to get any UUIDs if no valid logs found
                logs = [
                    SELECT Id, Upload_UUID__c, Employee__c
                    FROM OZEDI_Validation_Log__c
                    WHERE Payroll_Setting__c = :paySetId
                    AND Upload_UUID__c != NULL
                    AND Upload_UUID__c != ''
                    LIMIT 1
                ];
                
                if (logs.isEmpty()) {
                    result.put('message', 'No upload UUIDs found for this pay run.');
                    result.put('success', false);
                    return result;
                }
            }
            
            // Get unique UUIDs
            Set<String> uniqueUuids = new Set<String>();
            for (OZEDI_Validation_Log__c log : logs) {
                if (String.isNotBlank(log.Upload_UUID__c)) {
                    uniqueUuids.add(log.Upload_UUID__c);
                }
            }
            
            List<String> uuidList = new List<String>(uniqueUuids);
            result.put('uploadUuids', uuidList);
            result.put('totalUuids', uuidList.size());
            result.put('multipleUuids', uuidList.size() > 1);
            
            System.debug('Found ' + uuidList.size() + ' UUID(s) to process');
            
            // Authenticate
            String accessToken = authenticateOZEDI();
            System.debug('Authentication successful');
            
            // Get Organisation for Client ID
            User currentUser = [
                SELECT Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];
            
            Organisation__c org = [
                SELECT OZEDI_Client_Id__c
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];
            
            if (String.isBlank(org.OZEDI_Client_Id__c)) {
                throw new CalloutException('OZEDI Client ID is missing for the organisation.');
            }
            
            // Get OZEDI Settings
            OZEDI_Setting__mdt settings = OZEDI_Setting__mdt.getInstance('Default');
            
            if (settings == null) {
                throw new CalloutException('OZEDI configuration not found.');
            }
            
            if (String.isBlank(settings.Send_Upload_URL__c)) {
                throw new CalloutException('Send Upload URL is missing.');
            }
            
            // Build endpoint: {{URL_SS2}}/uploads/send/{{client_id}}
            String endpoint = settings.Send_Upload_URL__c + '/' + org.OZEDI_Client_Id__c;
            System.debug('Send Endpoint: ' + endpoint);
            
            // Process each UUID
            List<Map<String, Object>> results = new List<Map<String, Object>>();
            List<String> successfulUuids = new List<String>();
            List<Map<String, Object>> failedUuids = new List<Map<String, Object>>();
            List<Map<String, Object>> skippedUuids = new List<Map<String, Object>>();
            
            for (String uploadUuid : uuidList) {
                
                Map<String, Object> singleResult = new Map<String, Object>();
                singleResult.put('uploadUuid', uploadUuid);
                singleResult.put('success', false);
                singleResult.put('message', '');
                singleResult.put('statusCode', 0);
                singleResult.put('errorDetails', '');
                singleResult.put('response', '');
                singleResult.put('skipped', false);
                
                try {
                    // ==========================================
                    // STEP 1: CHECK CURRENT STATUS FIRST
                    // ==========================================
                    System.debug('Checking status for UUID: ' + uploadUuid);
                    HttpResponse statusResponse = getUploadStatus(uploadUuid);
                    
                    String currentStatus = '';
                    Boolean alreadySent = false;
                    
                    if (statusResponse.getStatusCode() == 200) {
                        Map<String, Object> statusMap = 
                            (Map<String, Object>)JSON.deserializeUntyped(statusResponse.getBody());
                        
                        currentStatus = (String)statusMap.get('uploadStatus');
                        System.debug('Current status for ' + uploadUuid + ': ' + currentStatus);
                        
                        // Check if already sent
                        if (currentStatus == 'UPLOAD_SEND_SUCCESS' || 
                            currentStatus == 'UPLOAD_SENT' ||
                            currentStatus == 'SENT') {
                            
                            alreadySent = true;
                            singleResult.put('skipped', true);
                            singleResult.put('message', 'Upload already sent successfully (Status: ' + currentStatus + ')');
                            singleResult.put('success', true);
                            singleResult.put('response', statusResponse.getBody());
                            
                            // Add to skipped list
                            Map<String, Object> skipped = new Map<String, Object>();
                            skipped.put('uploadUuid', uploadUuid);
                            skipped.put('status', currentStatus);
                            skipped.put('message', 'Already sent successfully');
                            skippedUuids.add(skipped);
                            
                            // Still consider it successful for our purposes
                            successfulUuids.add(uploadUuid);
                            results.add(singleResult);
                            
                            System.debug('Skipped UUID ' + uploadUuid + ' - already sent');
                            continue;
                        }
                    }
                    
                    // ==========================================
                    // STEP 2: SEND THE UPLOAD IF NOT ALREADY SENT
                    // ==========================================
                    System.debug('Sending UUID: ' + uploadUuid);
                    
                    HttpRequest req = new HttpRequest();
                    req.setEndpoint(endpoint);
                    req.setMethod('POST');
                    req.setHeader('Authorization', 'Bearer ' + accessToken);
                    req.setHeader('Content-Type', 'application/json');
                    req.setHeader('Accept', 'application/json');
                    
                    String body = '{"uploadUuid":"' + uploadUuid + '"}';
                    req.setBody(body);
                    req.setTimeout(120000);
                    
                    Http http = new Http();
                    HttpResponse res = http.send(req);
                    
                    singleResult.put('statusCode', res.getStatusCode());
                    singleResult.put('response', res.getBody());
                    
                    System.debug('UUID: ' + uploadUuid + ' - Status: ' + res.getStatusCode());
                    
                    if (res.getStatusCode() == 200 || res.getStatusCode() == 201) {
                        singleResult.put('success', true);
                        singleResult.put('message', 'Upload sent successfully.');
                        successfulUuids.add(uploadUuid);
                        
                        // Update status in Payroll Setting
                        updateUploadStatus(uploadUuid, 'SENT');
                        
                    } else {
                        // Check if the error is because it's already sent
                        String responseBody = res.getBody();
                        if (responseBody != null && 
                            responseBody.contains('UPLOAD_SEND_SUCCESS')) {
                            
                            singleResult.put('success', true);
                            singleResult.put('message', 'Upload already sent successfully.');
                            singleResult.put('skipped', true);
                            successfulUuids.add(uploadUuid);
                            
                            // Add to skipped list
                            Map<String, Object> skipped = new Map<String, Object>();
                            skipped.put('uploadUuid', uploadUuid);
                            skipped.put('status', 'UPLOAD_SEND_SUCCESS');
                            skipped.put('message', 'Already sent successfully');
                            skippedUuids.add(skipped);
                            
                            System.debug('UUID ' + uploadUuid + ' already sent (from error response)');
                            
                        } else {
                            singleResult.put('message', 'Send failed with status: ' + res.getStatusCode());
                            singleResult.put('errorDetails', res.getBody());
                            failedUuids.add(singleResult);
                        }
                    }
                    
                } catch (Exception ex) {
                    System.debug('Error sending UUID ' + uploadUuid + ': ' + ex.getMessage());
                    singleResult.put('message', 'Error: ' + ex.getMessage());
                    singleResult.put('errorDetails', ex.getMessage());
                    failedUuids.add(singleResult);
                }
                
                results.add(singleResult);
                
                // Small delay between requests to avoid rate limiting
                if (uuidList.size() > 1) {
                    sleep(1000);
                }
            }
            
            result.put('results', results);
            result.put('successfulUuids', successfulUuids);
            result.put('failedUuids', failedUuids);
            result.put('skippedUuids', skippedUuids);
            result.put('successfulCount', successfulUuids.size());
            result.put('failedCount', failedUuids.size());
            result.put('skippedCount', skippedUuids.size());
            
            // Determine overall success
            if (failedUuids.isEmpty()) {
                result.put('success', true);
                result.put('allSuccess', true);
                result.put('message', 'All ' + uuidList.size() + ' uploads processed successfully. (' + skippedUuids.size() + ' were already sent)');
            } else if (successfulUuids.size() > 0) {
                result.put('success', true);
                result.put('partialSuccess', true);
                result.put('message', successfulUuids.size() + ' of ' + uuidList.size() + ' uploads processed successfully. (' + failedUuids.size() + ' failed)');
            } else {
                result.put('success', false);
                result.put('message', 'All ' + uuidList.size() + ' uploads failed.');
            }
            
            // Update pay run status if all successful
            if ((Boolean)result.get('allSuccess')) {
                updatePayrunStatus(paySetId, 'PAID');
            }
            
            // Create activity log
            String activityMessage = (String)result.get('message');
            createStaffPayrollActivity(
                paySetId,
                'Superannuation',
                'Payment Processing: ' + activityMessage + ' | Successful: ' + successfulUuids.size() + ' | Failed: ' + failedUuids.size() + ' | Skipped: ' + skippedUuids.size(),
                'MULTIPLE_UUIDS',
                DateTime.now()
            );
            
            System.debug('===== processPayrunPayment END =====');
            return result;
            
        } catch (Exception ex) {
            System.debug('Error processing payment: ' + ex.getMessage());
            result.put('success', false);
            result.put('message', 'Error: ' + ex.getMessage());
            result.put('errorDetails', ex.getMessage());
            return result;
        }
    }


    /**
     * Updates upload status for a specific UUID
     */
    public static void updateUploadStatus(String uploadUuid, String status) {
        
        try {
            List<Payroll_Setting__c> payRuns = [
                SELECT Id, OZEDI_Upload_Status__c
                FROM Payroll_Setting__c
                WHERE OZEDI_Upload_UUID__c = :uploadUuid
                LIMIT 1
            ];
            
            if (!payRuns.isEmpty()) {
                payRuns[0].OZEDI_Upload_Status__c = status;
                update payRuns[0];
                System.debug('Updated Payroll Setting ' + payRuns[0].Id + ' to status: ' + status);
            }
        } catch (Exception ex) {
            System.debug('Error updating upload status: ' + ex.getMessage());
        }
    }

    /**
     * Updates pay run status
     */
    public static void updatePayrunStatus(String paySetId, String status) {
        
        try {
            Payroll_Setting__c payRun = [
                SELECT Id, Status__c
                FROM Payroll_Setting__c
                WHERE Id = :paySetId
                LIMIT 1
            ];
            
            if (payRun != null) {
                payRun.Status__c = status;
                update payRun;
                System.debug('Updated Payrun ' + paySetId + ' to status: ' + status);
            }
        } catch (Exception ex) {
            System.debug('Error updating payrun status: ' + ex.getMessage());
        }
    }


}