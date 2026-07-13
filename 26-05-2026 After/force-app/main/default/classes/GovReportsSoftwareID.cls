public class GovReportsSoftwareID {
    private static final String TOKEN_URL =System.Label.GovReportsTokenEndPoint;
    private static final String SOFTWARE_ID_URL = System.Label.GovReportsSoftwareId;
    
    // Static ABN for now
   // private static final String ABN_NUMBER = '15603031803';

    // Application credentials
    private static final String APPLICATION_KEY =  System.Label.GovReportsApplicationKey;
    private static final String CONSUMER_KEY =  System.Label.GovReportsConsumerKey;
    private static final String CONSUMER_SECRET =  System.Label.GovReportsConsumerSecret;

    /**
     * Generate JWT Token from GovReports API
     */
    @AuraEnabled
    public static String generateToken() {
        try {
            // Prepare request body
            Map<String, String> requestBody = new Map<String, String>();
            requestBody.put('ApplicationKey', APPLICATION_KEY);
            requestBody.put('ConsumerKey', CONSUMER_KEY);
            requestBody.put('ConsumerSecret', CONSUMER_SECRET);

            // Convert request to JSON
            String requestJson = JSON.serialize(requestBody);

            // Create HTTP request
            HttpRequest req = new HttpRequest();
            req.setEndpoint(TOKEN_URL);
            req.setMethod('POST');
            req.setHeader('Content-Type', 'application/json');
            req.setBody(requestJson);

            // Send HTTP request
            Http http = new Http();
            HttpResponse res = http.send(req);
            System.debug('Token Response: ' + res.getBody());

            if (res.getStatusCode() == 200) {
                // Parse JSON response
                Map<String, Object> responseMap = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());

                if (Boolean.valueOf(responseMap.get('IsSuccess').toString())) {
                    return (String) responseMap.get('Result'); // Return JWT Token
                } else {
                    return 'Error: Failed to generate token';
                }
            } 
            return 'HTTP Error: ' + res.getStatus() + ' - ' + res.getBody();
        } catch (Exception e) {
            return 'Exception: ' + e.getMessage();
        }
    }

    /**
     * Generate Software ID using JWT Token and ABN
     */
    @AuraEnabled
    public static String generateSoftwareID(String ABN_NUMBER) {
        try {
            // Step 1: Get JWT Token
            String jwtToken = generateToken();
            if (jwtToken.startsWith('Error') || jwtToken.startsWith('HTTP')) {
                return JSON.serialize(new Map<String, Object>{
                    'IsSuccess' => false,
                        'Message'   => 'Failed to retrieve token: ' + jwtToken
                        });
            }
            
            // Step 2: Call Software ID API
            HttpRequest req = new HttpRequest();
            req.setEndpoint(SOFTWARE_ID_URL);
            req.setMethod('POST');
            req.setHeader('Content-Type', 'text/plain');  
            req.setHeader('Authorization', 'Bearer ' + jwtToken);
            req.setHeader('Accept', 'application/json');
            req.setHeader('User-Agent', 'Apex-Client');
            
            req.setBody(ABN_NUMBER);
            
            Http http = new Http();
            HttpResponse res = http.send(req);
            
            System.debug('Software ID Response: ' + res.getBody());
            
            if (res.getStatusCode() == 200) {
                return res.getBody(); // Pass full response as JSON string to LWC
            } else {
                return JSON.serialize(new Map<String, Object>{
                    'IsSuccess' => false,
                        'Message'   => 'HTTP Error: ' + res.getStatus() + ' - ' + res.getBody()
                        });
            }
        } catch (Exception e) {
            return JSON.serialize(new Map<String, Object>{
                'IsSuccess' => false,
                    'Message'   => 'Exception: ' + e.getMessage()
                    });
        }
    }

}