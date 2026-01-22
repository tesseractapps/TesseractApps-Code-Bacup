public class WordEditorController {

    public class PresignResponse {
        @AuraEnabled public String uploadUrl;
        @AuraEnabled public String key;
    }

    @AuraEnabled(cacheable=false)
    public static PresignResponse getPresignedUrl(String bucketName, String key, String contentType) {
        return callPresign('https://tesseractapps.com/presign/put', bucketName, key, contentType);
    }

    @AuraEnabled(cacheable=false)
    public static PresignResponse getUpdatePresignedUrl(String bucketName, String key, String contentType) {
        // Same payload, different endpoint
        return callPresign('https://tesseractapps.com/presign/update', bucketName, key, contentType);
    }

    private static PresignResponse callPresign(String endpoint, String bucketName, String key, String contentType) {
        Map<String, Object> payload = new Map<String, Object>{
            'bucket'      => bucketName,
            'key'         => key,
            'contentType' => contentType
        };

        HttpRequest req = new HttpRequest();
        req.setEndpoint(endpoint);
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setBody(JSON.serialize(payload));
        req.setTimeout(120000);

        HttpResponse res = new Http().send(req);

        if (res.getStatusCode() < 200 || res.getStatusCode() >= 300) {
            throw new AuraHandledException('Presign failed: ' + res.getStatus() + ' ' + res.getBody());
        }

        return (PresignResponse) JSON.deserialize(res.getBody(), PresignResponse.class);
    }
}