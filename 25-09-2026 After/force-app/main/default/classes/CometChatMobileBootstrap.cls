@RestResource(urlMapping='/CometChatMobile/v2/bootstrap/*')
global with sharing class CometChatMobileBootstrap {

    @HttpGet
    global static void bootstrap() {
        try {
            // 1) Load current user (same idea as your LWC)
            User u = [
                SELECT Id, Name, Email, Phone,
                       Organization_Name__c,
                       CometChat_UID__c,
                       UserRole.Name
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];
            
            // Fetch Staff__c to get avatar URL
            Staff__c staffRec;
            List<Staff__c> staffList = [
                SELECT Id, Picture__c, Email_Address__c
                FROM Staff__c
                WHERE Email_Address__c = :u.Email
                LIMIT 1
            ];
            
            if (!staffList.isEmpty()) {
                staffRec = staffList[0];
            }
            
            String avatarUrl = staffRec != null ? staffRec.Picture__c : null;

            if (String.isBlank(u.Organization_Name__c)) {
                returnError(400, 'Organization_Name__c is empty for current user.');
                return;
            }

            // 2) Load org + CometChat creds (appID, authKey, region, variant, restApiKey)
            Organisation__c org = [
                SELECT Id,
                       Name,
                       CometChat_App_ID__c,
                       CometChat_AuthKey__c,
                       CometChat_Region__c,
                       CometChat_Variant_ID__c,
                       CometChat_REST_API_Key__c  // Text field storing REST API key
                FROM Organisation__c
                WHERE Name = :u.Organization_Name__c
                LIMIT 1
            ];

            if (String.isBlank(org.CometChat_App_ID__c) ||
                String.isBlank(org.CometChat_AuthKey__c) ||
                String.isBlank(org.CometChat_Region__c)) {
                returnError(400, 'CometChat app credentials are missing on Organisation__c.');
                return;
            }

            // 🔹 Map Salesforce User Role → CometChat Role ID
            String ccRole = 'default';
            if (u.UserRole != null && !String.isBlank(u.UserRole.Name)) {
                switch on u.UserRole.Name {
                    when 'Portal Account Partner Executive' {
                        ccRole = 'portal_account_partner_executive';
                    }
                    when 'Portal Account Partner User' {
                        ccRole = 'portal_account_partner_user';
                    }
                    when 'Portal Account Partner Manager' {
                        ccRole = 'portal_account_partner_manager';
                    }
                    when 'CEO' {
                        ccRole = 'ceo';
                    }
                    when else {
                        ccRole = 'default';
                    }
                }
            }

            // 3) Decide UID (but DO NOT create CometChat user or update SF here)
            Boolean hasUid      = !String.isBlank(u.CometChat_UID__c);
            String  proposedUid = hasUid ? u.CometChat_UID__c : generateUid(u.Id, u.Email);
            Boolean generated   = !hasUid; // similar meaning to old 'generatedUid' flag

            // 4) Build and send response (like your LWC COMETCHAT object)
            Map<String, Object> result = new Map<String, Object>{
                'user' => new Map<String, Object>{
                    'id'          => u.Id,
                    'name'        => u.Name,
                    'email'       => u.Email,
                    'phone'       => u.Phone,
                    'uid'         => u.CometChat_UID__c,  // may be null if not yet registered
                    'proposedUid' => proposedUid,         // what mobile should use to create/login
                    'hasUid'      => hasUid,              // tells mobile if it must create user
                    'userRole'    => ccRole,              // 🔹 mapped CometChat role
                    'avatarUrl'   => avatarUrl            // 🔹 Staff picture URL
                },
                'organisation' => new Map<String, Object>{
                    'id'        => org.Id,
                    'name'      => org.Name,
                    'appID'     => org.CometChat_App_ID__c,
                    'authKey'   => org.CometChat_AuthKey__c,
                    'appRegion' => org.CometChat_Region__c,
                    'variantID' => org.CometChat_Variant_ID__c,
                    'restApiKey'=> org.CometChat_REST_API_Key__c   // used by mobile to call CometChat REST
                },
                'generatedUid' => generated,
                'timestamp'    => Datetime.now().formatGmt('yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'')
            };

            sendResponse(200, result);

        } catch (Exception e) {
            returnError(500, 'Unexpected Error: ' + e.getMessage());
        }
    }


    @HttpPost
    global static void registerUid() {
        try {
            RestRequest req = RestContext.request;
            String rawBody = (req.requestBody != null) ? req.requestBody.toString() : null;
    
            if (String.isBlank(rawBody)) {
                returnError(400, 'Request body is empty.');
                return;
            }
    
            Map<String, Object> payload =
                (Map<String, Object>) JSON.deserializeUntyped(rawBody);
    
            String uid    = (String) payload.get('uid');
            String userId = (String) payload.get('userId'); // optional – can default to current user
    
            if (String.isBlank(uid)) {
                returnError(400, 'UID is required.');
                return;
            }
    
            // Default to current user if userId is not provided
            Id targetUserId = UserInfo.getUserId();
            if (!String.isBlank(userId)) {
                // Optional safety check: ensure caller only updates its own record
                if (userId != UserInfo.getUserId()) {
                    returnError(403, 'Not allowed to update another user.');
                    return;
                }
                targetUserId = userId;
            }
    
            User u = [
                SELECT Id, CometChat_UID__c
                FROM User
                WHERE Id = :targetUserId
                LIMIT 1
            ];
    
            u.CometChat_UID__c = uid;
            update u;
    
            Map<String, Object> resp = new Map<String, Object>{
                'success' => true,
                'userId'  => u.Id,
                'uid'     => uid
            };
    
            sendResponse(200, resp);
    
        } catch (Exception e) {
            returnError(500, 'Unexpected Error in registerUid: ' + e.getMessage());
        }
}



    // You are no longer using this in bootstrap, but you can keep it
    // in case you want server-side creation in some other flow.
    public static void createCometChatUser(
        String uid,
        User u,
        Organisation__c org,
        String ccRole,
        String avatarUrl
    ) {
        if (String.isBlank(org.CometChat_REST_API_Key__c)) {
            throw new CalloutException(
                'CometChat REST API key (CometChat_REST_API_Key__c) is missing on Organisation__c.'
            );
        }

        // Build endpoint like in JS: https://{appID}.api-{region}.cometchat.io/v3/users
        String endpoint = 'https://' +
                          org.CometChat_App_ID__c +
                          '.api-' +
                          org.CometChat_Region__c +
                          '.cometchat.io/v3/users';

        HttpRequest req = new HttpRequest();
        req.setMethod('POST');
        req.setEndpoint(endpoint);   // ⚠️ Must be allowed in Remote Site Settings
        req.setHeader('Content-Type', 'application/json');
        req.setHeader('apikey', org.CometChat_REST_API_Key__c);

        // Body mirrors your JS body
        Map<String, Object> body = new Map<String, Object>();
        body.put('uid', uid);
        body.put('name', String.isBlank(u.Name) ? 'Portal User' : u.Name);

        // use mapped role, fallback to default
        body.put('role', String.isBlank(ccRole) ? 'default' : ccRole);

        // add avatar if available
        if (!String.isBlank(avatarUrl)) {
            body.put('avatar', avatarUrl);
        }

        body.put('statusMessage', 'Hey there! I am using CometChat.');
        body.put('tags', new List<String>());
        body.put('withAuthToken', true);

        Map<String, Object> metaPrivate = new Map<String, Object>();
        metaPrivate.put('email', u.Email);
        metaPrivate.put('contactNumber', u.Phone);

        Map<String, Object> metadata = new Map<String, Object>();
        metadata.put('@private', metaPrivate);

        body.put('metadata', metadata);

        String bodyJson = JSON.serialize(body);
        req.setBody(bodyJson);

        System.debug('[CometChat REST] Creating user. Endpoint=' + endpoint);
        System.debug('[CometChat REST] Request body=' + bodyJson);

        Http http = new Http();
        HttpResponse res = http.send(req);

        Integer sc = res.getStatusCode();
        String respBody = res.getBody();
        System.debug('[CometChat REST] Status=' + sc + ', Body=' + respBody);

        if (sc == 200 || sc == 201) {
            // OK, user created
            return;
        }

        // If CometChat returns 409 (already exists) you may want to treat as success
        if (sc == 409) {
            System.debug('[CometChat REST] User already exists in CometChat, continuing.');
            return;
        }

        // Anything else is treated as error
        throw new CalloutException(
            'Failed to create CometChat user. Status=' + sc + ', Body=' + respBody
        );
    }


    // === UID generation (same as generateUserUID in JS) ===
    private static String generateUid(String userId, String email) {
        String uid = ('sf-' + userId).toLowerCase();
        if (!String.isBlank(email) && email.contains('@')) {
            String local = email.split('@')[0]
                                .toLowerCase()
                                .replaceAll('[^a-z0-9]', '');
            if (!String.isBlank(local)) {
                uid += '-' + local;
            }
        }
        return uid;
    }

    // === generic response helpers ===
    private static void sendResponse(Integer status, Object body) {
        RestResponse res = RestContext.response;
        res.statusCode = status;
        res.addHeader('Content-Type', 'application/json; charset=UTF-8');
        res.responseBody = Blob.valueOf(JSON.serialize(body));
    }

    private static void returnError(Integer status, String message) {
        sendResponse(status, new Map<String, Object>{
            'error'   => true,
            'status'  => status,
            'message' => message
        });
    }
}