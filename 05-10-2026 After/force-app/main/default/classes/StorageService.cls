public with sharing class StorageService {

    @AuraEnabled(cacheable=false)
    public static Map<String, Object> getStorageUsage(Id organisationId) {

        // 🔥 Endpoint from custom label
        String endpoint = System.Label.Tesseract_Domain + '/batch/storage';

        Http http = new Http();
        HttpRequest req = new HttpRequest();

        req.setEndpoint(endpoint);
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setHeader('Accept', 'application/json');

        // 🔥 IMPORTANT: orgId must be a01... and must end with "/"
        Map<String, Object> body = new Map<String, Object>{
            'env' => System.Label.Geo_SystemEnv,
            'orgs' => new List<String>{ String.valueOf(organisationId) + '/' }
        };

        String requestBody = JSON.serialize(body);
        req.setBody(requestBody);

        // 🔍 DEBUG (VERY IMPORTANT)
        System.debug('🔥 STORAGE REQUEST: ' + requestBody);

        HttpResponse res = http.send(req);

        System.debug('🔥 STATUS CODE: ' + res.getStatusCode());
        System.debug('🔥 STORAGE RESPONSE: ' + res.getBody());

        if (res.getStatusCode() == 200) {

            // 🔥 Parse response
            Map<String, Object> response =
                (Map<String, Object>) JSON.deserializeUntyped(res.getBody());

            return response;

        } else {
            throw new AuraHandledException(
                'Storage API failed: ' + res.getStatusCode() + ' → ' + res.getBody()
            );
        }
    }
}