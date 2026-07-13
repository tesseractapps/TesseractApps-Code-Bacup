public class EmailRelayService {
 
    private static final String RELAY_URL = System.Label.Tesseract_Domain;
    private static final String API_KEY   = System.Label.EmailRelayServiceAPIKey;
 
    // Register new client
    public static Map<String, Object> addClient(
        String clientName, String fromEmail, String fromName
    ) {
        Map<String, Object> payload = new Map<String, Object>{
            'clientName' => clientName,  // orgname
            'fromEmail'  => fromEmail,  //org email
            'fromName'   => fromName  //Displayname
        };
        HttpResponse res = makeRequest('POST', '/relay/client/register', payload);
        return (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
    }
 


    public static Map<String, Object> sendEmail(String fromEmail, List < String > toEmails, String subject, String body, List < String > attachments, List < String > ccEmails, List < String > bccEmails) {
    Map < String,
    Object > payload = new Map<String, Object> {
        'fromEmail' => fromEmail,
        'toEmail' => toEmails,
        'subject' => subject,
        'body' => body
    };
    // Optional attachments
    if (attachments != null && !attachments.isEmpty()) {
        payload.put('attachment', attachments);
    }
    // Optional CC
    if (ccEmails != null && !ccEmails.isEmpty()) {
        payload.put('ccEmail', ccEmails);
    }
    // Optional BCC
    if (bccEmails != null && !bccEmails.isEmpty()) {
        payload.put('bccEmail', bccEmails);
    }
    HttpResponse res = makeRequest('POST', '/relay/dispatch', payload);
    return(Map < String, Object >)JSON.deserializeUntyped(res.getBody());
}


// Send Bulk Emails
public static Map<String, Object> sendBulkEmails(List < Object > emails) { // Convert emails list to JSON
    String jsonBody = JSON.serialize(emails);
    // Multipart boundary
    String boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    // Multipart start body
    String body = '--' + boundary + '\r\n' + 'Content-Disposition: form-data; name="file"; filename="bulk-email.json"\r\n' + 'Content-Type: application/json\r\n\r\n';
    // Multipart ending
    String ending = '\r\n--' + boundary + '--';
    // Convert strings/blobs to hex
    String bodyHex = EncodingUtil.convertToHex(Blob.valueOf(body));
    String fileHex = EncodingUtil.convertToHex(Blob.valueOf(jsonBody));
    String endingHex = EncodingUtil.convertToHex(Blob.valueOf(ending));
    // Merge hex
    String fullHex = bodyHex + fileHex + endingHex;
    // Final blob
    Blob finalBlob = EncodingUtil.convertFromHex(fullHex);
    // HTTP request
    HttpRequest req = new HttpRequest();
    req.setEndpoint(RELAY_URL + '/bulk-email/upload');
    req.setMethod('POST');
    req.setHeader('Content-Type', 'multipart/form-data; boundary=' + boundary);
    req.setHeader('x-api-key', API_KEY);
    req.setTimeout(120000);
    req.setBodyAsBlob(finalBlob);
    Http http = new Http();
    HttpResponse res = http.send(req);
    return(Map < String, Object >)JSON.deserializeUntyped(res.getBody());
}




    // Check verification status
    public static Map<String, Object> checkStatus(String fromEmail) {
        HttpResponse res = makeRequest(
            'GET',
            '/relay/client/verify-status/' + EncodingUtil.urlEncode(fromEmail, 'UTF-8'),
            null
        );
        return (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
    }
 
    // Resend verification
    public static Map<String, Object> resendVerification(String fromEmail) {
        Map<String, Object> payload = new Map<String, Object>{
            'fromEmail' => fromEmail
        };
        HttpResponse res = makeRequest('POST', '/relay/client/resend-confirm', payload);
        return (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
    }
 
    // HTTP helper
    private static HttpResponse makeRequest(
        String method, String endpoint, Map<String, Object> body
    ) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(RELAY_URL + endpoint);
        req.setMethod(method);
        req.setHeader('Content-Type', 'application/json');
        req.setHeader('x-api-key', API_KEY);
        req.setTimeout(30000);
        if (body != null) req.setBody(JSON.serialize(body));
        return new Http().send(req);
    }
}