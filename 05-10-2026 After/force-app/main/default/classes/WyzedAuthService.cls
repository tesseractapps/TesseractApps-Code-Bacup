public class WyzedAuthService {

    // 🔐 Auth (ALWAYS global)
    private static final String AUTH_PATH = '/_services/auth/token';

    // 🧠 Token Cache
    private static String accessToken;
    private static Datetime tokenExpiry;

    /**
     * 🔑 Get Access Token (via Named Credential)
     */
    public static String getAccessToken() {

        if (accessToken != null && tokenExpiry != null && Datetime.now() < tokenExpiry) {
            return accessToken;
        }
        Organisation__c orgDetails = WyzedIntegrationHandler.getOrgDetails();

       String TENANT_ID = orgDetails.Wyzed_Tenant_ID__c;
        String CLIENT_ID = orgDetails.Wyzed_Client_ID__c;
        String CLIENT_SECRET = orgDetails.Wyzed_Client_Secret__c;

        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:Wyzed_API' + AUTH_PATH);
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');

        Map<String, Object> body = new Map<String, Object>{
            'grant_type' => 'client_credentials',
            'tenant_id' => Integer.valueOf(TENANT_ID),
            'client_id' => CLIENT_ID,
            'client_secret' => CLIENT_SECRET
        };

        req.setBody(JSON.serialize(body));

        Http http = new Http();
        HttpResponse res = http.send(req);

        if (res.getStatusCode() == 200) {
             System.debug('AUTH SUCCESS');

            Map<String, Object> responseMap =
                (Map<String, Object>) JSON.deserializeUntyped(res.getBody());

            accessToken = (String) responseMap.get('access_token');

            // buffer before expiry
            tokenExpiry = Datetime.now().addSeconds(270);
            system.debug(' access token '+accessToken);

            return accessToken;

        } else {
            System.debug('AUTH FAILED BODY: ' + res.getBody());
            System.debug('AUTH FAILED STATUS: ' + res.getStatusCode());
          
            throw new CalloutException('Auth failed: ' + res.getBody());
        }
    }

    /**
     * 🔁 Generic Call (handles BOTH v3 + tenant APIs)
     */
   public static HttpResponse callApi(String url, String method) {

    String token = getAccessToken();

    HttpRequest req = new HttpRequest();

    // 🔥 HANDLE FULL URL vs RELATIVE PATH
    if (url.startsWith('http')) {
        req.setEndpoint('callout:Wyzed_API/' + url);
    } else {
        req.setEndpoint('callout:Wyzed_API' + url);
    }

    req.setMethod(method);
    req.setHeader('Authorization', 'Bearer ' + token);
    req.setHeader('Content-Type', 'application/json');

    Http http = new Http();
    HttpResponse res = http.send(req);
      system.debug('response body==>'+res);

    if (res.getStatusCode() == 401) {
        accessToken = null;
        token = getAccessToken();

        req.setHeader('Authorization', 'Bearer ' + token);
        res = http.send(req);
    }

    return res;
}
  

@AuraEnabled(cacheable=false)
public static String getCoursesRaw() {
     Organisation__c orgDetails = WyzedIntegrationHandler.getOrgDetails();
      string  TENANT_ID= orgDetails.Wyzed_Tenant_ID__c;
    // String TENANT_ID='';

    String dynamicUrl = '/v3_service/tenants/' + TENANT_ID + '/courses/';

    HttpResponse res = callApi(dynamicUrl, 'GET');

    System.debug('STATUS: ' + res.getStatusCode());
    System.debug('RAW BODY: ' + res.getBody());

    if (res.getStatusCode() == 200) {
        return res.getBody(); // 🔥 return full JSON to LWC
    } else {
        throw new AuraHandledException('Courses API failed: ' + res.getBody());
    }
 }

@AuraEnabled(cacheable=false)
public static Map<String, Object> loadWyzedAndStaffData() {

    try {

        User currentUser = [
            SELECT Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        Organisation__c orgRecord = [
            SELECT
                Id,
                Wyzed_Tenant_ID__c
            FROM Organisation__c
            WHERE Name = :currentUser.Organization_Name__c
            LIMIT 1
        ];

        String tenantId = orgRecord.Wyzed_Tenant_ID__c;

        // =====================================================
        // 🔥 STEP 1 — GET ALL WYZED USERS
        // =====================================================

        List<Object> allUsers = new List<Object>();

        String cursor = null;
        Boolean hasMore = true;
        Integer iteration = 0;
        Integer maxIterations = 10;

        while (hasMore && iteration < maxIterations) {

            String path =
                '/v3_user/tenants/' +
                tenantId +
                '/users/?limit=200';

            if (cursor != null) {

                path +=
                    '&cursor=' +
                    EncodingUtil.urlEncode(cursor, 'UTF-8');
            }

            HttpResponse res =
                WyzedAuthService.callApi(path, 'GET');

            if (res.getStatusCode() != 200) {

                throw new AuraHandledException(
                    'Wyzed API failed: ' +
                    res.getBody()
                );
            }

            Map<String, Object> data =
                (Map<String, Object>)
                JSON.deserializeUntyped(res.getBody());

            List<Object> users =
                (List<Object>) data.get('users');

            if (users != null && !users.isEmpty()) {
                allUsers.addAll(users);
            }

            cursor = (String) data.get('next_cursor');

            hasMore = (Boolean) data.get('more');

            if (!hasMore || cursor == null) {
                break;
            }

            iteration++;
        }

        System.debug(
            '✅ Wyzed Users => ' +
            allUsers.size()
        );

        // =====================================================
        // 🔥 STEP 2 — EMAIL MAP
        // =====================================================

        Map<String, Map<String, Object>> wyzedByEmail =
            new Map<String, Map<String, Object>>();

        for (Object obj : allUsers) {

            Map<String, Object> user =
                (Map<String, Object>) obj;

            String email =
                String.valueOf(user.get('email'));

            if (!String.isBlank(email)) {

                wyzedByEmail.put(
                    email.trim().toLowerCase(),
                    user
                );
            }
        }

        // =====================================================
        // 🔥 STEP 3 — FETCH STAFF
        // =====================================================

        List<Staff__c> staffList = [

            SELECT
                Id,
                Name,
                NameToDisplay__c,
                Email_Address__c,
                Date_Of_Birth__c,
                Last_Name__c,
                Status__c,
                Organization_Name__c,
                Facility__c,
                Facility__r.Organisation__c,
                Contact_Number__c,
                Picture__c,
                Xero_Employee_ID__c,
                Wyzed_User_Id__c,
                Wyzed_Learner__c

            FROM Staff__c

            WHERE
                Facility__r.Organisation__c = :orgRecord.Id
                AND Status__c = true
        ];

        // =====================================================
        // 🔥 STEP 4 — UPDATE STAFF
        // =====================================================

        Map<String, Id> existingWyzedIdMap =
            new Map<String, Id>();

        for (Staff__c s : [

            SELECT Id, Wyzed_User_Id__c
            FROM Staff__c
            WHERE Wyzed_User_Id__c != null
             and
                Facility__r.Organisation__c = :orgRecord.Id

        ]) {

            existingWyzedIdMap.put(
                s.Wyzed_User_Id__c,
                s.Id
            );
        }

        List<Staff__c> staffToUpdate =
            new List<Staff__c>();

        for (Staff__c staff : staffList) {

            if (String.isBlank(staff.Email_Address__c)) {
                continue;
            }

            String emailKey =
                staff.Email_Address__c
                    .trim()
                    .toLowerCase();

            if (wyzedByEmail.containsKey(emailKey)) {

                Map<String, Object> wyzedUser =
                    wyzedByEmail.get(emailKey);

                String wyzedId =
                    String.valueOf(wyzedUser.get('id'));

                Boolean isLearner =
                    (Boolean) wyzedUser.get('is_learner');

                Boolean alreadyUsed =
                existingWyzedIdMap.containsKey(wyzedId)
                &&
                existingWyzedIdMap.get(wyzedId) != staff.Id;

            if (alreadyUsed) {

                System.debug(
                    'Skipping duplicate Wyzed Id => ' +
                    wyzedId
                );

                continue;
            }

            if (
                staff.Wyzed_User_Id__c != wyzedId
                ||
                staff.Wyzed_Learner__c != isLearner
            ) {

                staff.Wyzed_User_Id__c = wyzedId;

                staff.Wyzed_Learner__c = isLearner;

                staffToUpdate.add(staff);

                // 🔥 prevent duplicates in same transaction
                existingWyzedIdMap.put(
                    wyzedId,
                    staff.Id
                );
            }
            }
        }

        if (!staffToUpdate.isEmpty()) {

            update staffToUpdate;

            System.debug(
                '✅ Updated Staff => ' +
                staffToUpdate.size()
            );
        }

        // =====================================================
        // 🔥 STEP 5 — REQUERY UPDATED STAFF
        // =====================================================

        staffList = [

            SELECT
                Id,
                Name,
                NameToDisplay__c,
                Email_Address__c,
                Date_Of_Birth__c,
                Last_Name__c,
                Status__c,
                Organization_Name__c,
                Facility__c,
                Facility__r.Organisation__c,
                Contact_Number__c,
                Picture__c,
                Xero_Employee_ID__c,
                Wyzed_User_Id__c,
                Wyzed_Learner__c

            FROM Staff__c

            WHERE
                Facility__r.Organisation__c = :orgRecord.Id
                AND Status__c = true
        ];

        // =====================================================
        // 🔥 STEP 6 — RETURN BOTH
        // =====================================================

        Map<String, Object> response =
            new Map<String, Object>();

        response.put('staffList', staffList);
        response.put('wyzedUsers', allUsers);

        return response;

    } catch (Exception e) {

        throw new AuraHandledException(
            e.getMessage()
        );
    }
}

@AuraEnabled
public static String createLearnerMinimal(
    String firstname,
    String surname,
    String email,
    Boolean isLearner,
    Boolean isAdmin
) {
    Organisation__c orgDetails = WyzedIntegrationHandler.getOrgDetails();
    String TENANT_ID = orgDetails.Wyzed_Tenant_ID__c;

    String path = '/v3_user/tenants/' + TENANT_ID + '/users/';
    System.debug('email==>'+email);

    Map<String, Object> body = new Map<String, Object>{
        'firstname' => firstname,
        'surname' => surname,
        'email' => email,
        'is_random_password' => true,
         'is_learner' => isLearner,
         'is_admin' => isAdmin
    };

    HttpResponse res = callApiWithBody(path, 'POST', JSON.serialize(body));

    System.debug('Create Learner Response: ' + res.getBody());

    if (res.getStatusCode() == 200 || res.getStatusCode() == 201) {
        return res.getBody();
    } else {
        throw new AuraHandledException('Create Learner Failed: ' + res.getBody());
    }
}
public static HttpResponse callApiWithBody(String url, String method, String body) {

    String token = getAccessToken();

    HttpRequest req = new HttpRequest();

    req.setEndpoint('callout:Wyzed_API' + url);
    req.setMethod(method);

    req.setHeader('Authorization', 'Bearer ' + token);
    req.setHeader('Content-Type', 'application/json');

    if (body != null) {
        req.setBody(body);
    }

    Http http = new Http();
    HttpResponse res = http.send(req);

    // 🔁 Retry on 401
    if (res.getStatusCode() == 401) {
        accessToken = null;
        token = getAccessToken();

        req.setHeader('Authorization', 'Bearer ' + token);
        res = http.send(req);
    }

    return res;
}


   @AuraEnabled(cacheable=false)
    public static void updateWyzedId(string staffId, string wyzedId,boolean wyzedLearner){
        Staff__c st= new staff__C();
        st.Id=staffId;
        st.Wyzed_User_Id__c=wyzedId;
        st.Wyzed_Learner__c=wyzedLearner;
        update st;
    
   }


  
}