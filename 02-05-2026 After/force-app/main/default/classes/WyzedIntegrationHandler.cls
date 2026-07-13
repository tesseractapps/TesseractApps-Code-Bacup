public class WyzedIntegrationHandler {

    // Fetch user + org details (no change to logic, just moved into method)
    public  static Organisation__c getOrgDetails() {
        User objUser = [
            SELECT Id, Organization_Name__c 
            FROM User 
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        return [
            SELECT Id,
                   Wyzed_Client_ID__c,
                   Wyzed_Client_Secret__c,
                   Wyzed_Redirect_URL__c,
                   Wyzed_SSO_Secret__c,
                   Wyzed_SSO_URL__c,
                   Wyzed_Tenant_ID__c
            FROM Organisation__c
            WHERE Name = :objUser.Organization_Name__c
            LIMIT 1
        ];
    }

    // KEEPING your labels exactly as-is
    public static final String WyzedLearnerMode = System.Label.WyzedLearnerMode;
    public static final String WyzedAdminModeValue = System.Label.WyzedAdminModeValue;
    public static final String WyzedStaffLearnerModeValue = System.Label.WyzedStaffLearnerModeValue;
    public static final String WyzedForceMode = System.Label.WyzedForceMode;
    public static final String WyzedForceValue = System.Label.WyzedForceValue;

    @AuraEnabled
    public static String encodeJWT(String uid,String firstname,String surname,String email,Boolean isAdmin) {

        // 🔹 NEW: fetch org details here
        Organisation__c orgDetails = getOrgDetails();

        String WYZED_SSO_SECRET = orgDetails.Wyzed_SSO_Secret__c;

        String alg = System.Label.wyzedAlgorithm;

        System.debug('uid '+uid);
        System.debug('firstname '+firstname);
        System.debug('surname '+surname);
        System.debug('email '+email);

        String exp = String.valueOf(DateTime.now().getTime() / 1000 + 300);

        Map<String, Object> header = new Map<String, Object>();
        header.put('alg', alg);
        header.put('typ', 'JWT');

        Map<String, Object> claims = new Map<String, Object>();
        claims.put('uid', uid);
        claims.put('firstname', firstname);
        claims.put('surname', surname);
        claims.put('email', email);

        if (isAdmin) {
            System.debug('isAdmin '+isAdmin);
            claims.put('mode', 'admin');
        } else {
            claims.put('mode', 'learner');
        }

        claims.put('exp', exp);

        System.debug('wyzed learner mode '+claims);

        String headerJson = JSON.serialize(header);
        String claimsJson = JSON.serialize(claims);

        String encodedHeader = EncodingUtil.base64Encode(Blob.valueOf(headerJson)).replace('=', '');
        String encodedClaims = EncodingUtil.base64Encode(Blob.valueOf(claimsJson)).replace('=', '');

        String dataToSign = encodedHeader + '.' + encodedClaims;

        String signature = EncodingUtil.base64Encode(
            Crypto.generateMac(
                'HMACSHA256',
                Blob.valueOf(dataToSign),
                Blob.valueOf(WYZED_SSO_SECRET)
            )
        ).replace('=', '');

        String token = dataToSign + '.' + signature;

        return token;
    }

 /*    @AuraEnabled
    public static String redirectToWyzedSSO(String uid,String firstname,String surname,String email,Boolean isAdmin) {

        // 🔹 NEW: fetch org details here
        Organisation__c orgDetails = getOrgDetails();

        String WYZED_SSO_URL = orgDetails.Wyzed_SSO_URL__c;
        String REDIRECT_URL = orgDetails.Wyzed_Redirect_URL__c;

        // Encode JWT (unchanged)
        String token = encodeJWT(uid,firstname,surname,email,isAdmin);

        // Build redirect URL (unchanged logic)
        String redirectUrl = WYZED_SSO_URL 
            + '?' + 'jwt=' + token 
            + '&redirect=' + EncodingUtil.urlEncode(REDIRECT_URL, 'UTF-8');

        System.debug('final redirecting url '+redirectUrl);

        return redirectUrl;
    } */
        @AuraEnabled
public static String redirectToWyzedSSO(String uid,String firstname,String surname,String email,Boolean isAdmin) {

    Organisation__c orgDetails = getOrgDetails();

    // ✅ VALIDATION (ADD THIS BLOCK)
    List<String> missingFields = new List<String>();

    if (String.isBlank(orgDetails.Wyzed_Client_ID__c)) {
        missingFields.add('Client ID');
    }
    if (String.isBlank(orgDetails.Wyzed_Client_Secret__c)) {
        missingFields.add('Client Secret');
    }
    if (String.isBlank(orgDetails.Wyzed_Redirect_URL__c)) {
        missingFields.add('Redirect URL');
    }
    if (String.isBlank(orgDetails.Wyzed_SSO_Secret__c)) {
        missingFields.add('SSO Secret');
    }
    if (String.isBlank(orgDetails.Wyzed_SSO_URL__c)) {
        missingFields.add('SSO URL');
    }
    if (String.isBlank(orgDetails.Wyzed_Tenant_ID__c)) {
        missingFields.add('Tenant ID');
    }

    if (!missingFields.isEmpty()) {
        throw new AuraHandledException(
            'Please fill Wyzed details in Admin Settings. Missing: ' 
            + String.join(missingFields, ', ')
        );
    }

    // 🔹 EXISTING LOGIC (keep same)
    String token = encodeJWT(uid,firstname,surname,email,isAdmin);

    String redirectUrl = orgDetails.Wyzed_SSO_URL__c 
        + '?jwt=' + token 
        + '&redirect=' + EncodingUtil.urlEncode(orgDetails.Wyzed_Redirect_URL__c, 'UTF-8');

    return redirectUrl;
}
}