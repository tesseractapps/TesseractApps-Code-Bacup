public class WyzedIntegrationHandler {
     
     public static final String WYZED_SSO_URL = System.Label.wyzedSSOURL;
     
   	 public static final String WYZED_SSO_SECRET = System.Label.wyzedSSOSecret;
     public static final String WyzedLearnerMode = System.Label.WyzedLearnerMode;
     public static final String WyzedAdminModeValue = System.Label.WyzedAdminModeValue;
     public static final String WyzedStaffLearnerModeValue = System.Label.WyzedStaffLearnerModeValue;
     public static final String WyzedForceMode = System.Label.WyzedForceMode;
     public static final String WyzedForceValue = System.Label.WyzedForceValue;
    // You can redirect the user to a specific course in Wyzed after the SSO flow
 
    public static final String REDIRECT_URL = System.Label.wyzedRedirectURL;
   //  public static final String REDIRECT_URL='' ;
      @AuraEnabled
      public static String encodeJWT(String uid,String firstname,String surname,String email,boolean isAdmin) {
       
          String alg = System.Label.wyzedAlgorithm;
          system.debug('uid '+uid);
          system.debug('uid '+firstname);
          system.debug('uid '+surname);
          system.debug('uid '+email);
          
          String exp = String.valueOf(DateTime.now().getTime() / 1000 + 300); // 5 minutes in the future
          
          Map<String, Object> header = new Map<String, Object>();
          header.put('alg', alg);
          header.put('typ', 'JWT');
          
          Map<String, Object> claims = new Map<String, Object>();
          claims.put('uid', uid);
          claims.put('firstname', firstname);
          claims.put('surname', surname);
          claims.put('email', email);
          if (isAdmin) {
              system.debug('isAdmin '+isAdmin);
              claims.put('mode', 'admin'); 
             // claims.put('admin', True); 
          } else {
              claims.put('mode', 'learner');  
             // claims.put('learner',  True); 
          }
          
          claims.put('exp', exp);
          system.debug(' wyzed learner mode  '+claims);
          
          String headerJson = JSON.serialize(header);
          String claimsJson = JSON.serialize(claims);
          
          String encodedHeader = EncodingUtil.base64Encode(Blob.valueOf(headerJson)).replace('=', '');
          String encodedClaims = EncodingUtil.base64Encode(Blob.valueOf(claimsJson)).replace('=', '');
          
          String dataToSign = encodedHeader + '.' + encodedClaims;
          String signature = EncodingUtil.base64Encode(Crypto.generateMac('HMACSHA256', Blob.valueOf(dataToSign), Blob.valueOf(WYZED_SSO_SECRET))).replace('=', '');
          
          String token = dataToSign + '.' + signature;
          
          return token;
      }
    
      @AuraEnabled
     public static string  redirectToWyzedSSO(String uid,String firstname,String surname,String email,boolean isAdmin) {
        // Encode the SSO token
        String token = encodeJWT(uid,firstname,surname,email,isAdmin);
        
        // Create the redirect URL
      //  String finalRedirectUrl;
       String redirectUrl = WYZED_SSO_URL + '?' + 'jwt=' + token + '&redirect=' + EncodingUtil.urlEncode(REDIRECT_URL, 'UTF-8');
      
      /*   if (isAdmin) {
           
            finalRedirectUrl = WYZED_SSO_URL + '?jwt=' + token; 
        } else {
            finalRedirectUrl = WYZED_SSO_URL + '?jwt=' + token + '&redirect=' + EncodingUtil.urlEncode(REDIRECT_URL, 'UTF-8');
        } */
       
       system.debug('final redirecting url '+redirectUrl);
         return redirectUrl;
    }

  

}