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
   private static HttpResponse callApi(String url, String method) {

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

    if (res.getStatusCode() == 401) {
        accessToken = null;
        token = getAccessToken();

        req.setHeader('Authorization', 'Bearer ' + token);
        res = http.send(req);
    }

    return res;
}
    // ============================================================
    // 📡 V3 API → Course Completions (GLOBAL API)
    // ============================================================

  /*   @AuraEnabled(cacheable=false)
    public static Map<String, Object> getCourseCompletions(Integer limitSize, String cursor) {
        Organisation__c orgDetails = WyzedIntegrationHandler.getOrgDetails();
        string  TENANT_ID= orgDetails.Wyzed_Tenant_ID__c;
        
        String path = '/v3_service/tenants/' + TENANT_ID + '/course_completions/?limit=' + limitSize;

        if (cursor != null && cursor != '') {
            path += '&cursor=' + EncodingUtil.urlEncode(cursor, 'UTF-8');
        }

        HttpResponse res = callApi(path, 'GET');

        if (res.getStatusCode() == 200) {

            Map<String, Object> responseMap =
                (Map<String, Object>) JSON.deserializeUntyped(res.getBody());

            return new Map<String, Object>{
                'records' => responseMap.get('course_completions'),
                'more' => responseMap.get('more'),
                'nextCursor' => responseMap.get('next_cursor')
            };

        } else {
            throw new AuraHandledException('Course Completions failed: ' + res.getBody());
        }
    }
 */
    // ============================================================
    // 📚 V1 API → Courses (TENANT DOMAIN)
    // ============================================================

   
   /*  public static String getUserSSOId(Integer userId) {
        Organisation__c orgDetails = WyzedIntegrationHandler.getOrgDetails();
       string  TENANT_ID= orgDetails.Wyzed_Tenant_ID__c;
        String path = '/v3_user/tenants/' + TENANT_ID + '/users/' + userId + '/sso';

        HttpResponse res = callApi(path, 'GET');

        if (res.getStatusCode() == 200) {

            Map<String, Object> data =
                (Map<String, Object>) JSON.deserializeUntyped(res.getBody());

            if (data.get('sso_info') != null) {
                Map<String, Object> sso =
                    (Map<String, Object>) data.get('sso_info');

                return (String) sso.get('sso_id');
            }

            return null;

        } else {
            throw new CalloutException('SSO API failed: ' + res.getBody());
        }
    } */

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
}