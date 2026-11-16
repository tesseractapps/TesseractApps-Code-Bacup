public with sharing class FirebaseUserService {
    @AuraEnabled(cacheable=true)  // ✅ Required for @wire
    public static String getFirestoreUsers() {
        Http http = new Http();
        HttpRequest request = new HttpRequest();
        request.setEndpoint(System.Label.FIREBASE_BASE_URL + '?key=' + System.Label.FIREBASE_API_KEY);
        request.setMethod('GET');
        request.setHeader('Content-Type', 'application/json');

        try {
            HttpResponse response = http.send(request);
            if (response.getStatusCode() == 200) {
                return response.getBody();  // ✅ Return the JSON response
            } else {
                throw new CalloutException('Error: ' + response.getBody());
            }
        } catch (Exception e) {
            throw new CalloutException('HTTP Callout Error: ' + e.getMessage());
        }
    }
}