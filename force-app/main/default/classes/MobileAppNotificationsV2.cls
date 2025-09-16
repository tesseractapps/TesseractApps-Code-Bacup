public class MobileAppNotificationsV2 {
   @AuraEnabled
    public static void generateAndSendNotification(string role,string strdate,string staffId) {
        String bearerToken = generateBearerToken(); // Generate Bearer Token
        List<string> emails = new list<string>();
        // List<string> tokens = new list<string>(); 
		List<String> res = strdate.split('-');
		string nwdt=res[2]+'-'+res[1]+'-'+res[0];
		system.debug(nwdt);
        String query = 'SELECT Id, Email_Address__c, Role__c FROM Staff__c WHERE Role__c INCLUDES (\'' + role + '\')';
        
        if (staffId != null && staffId != '') {
            query += ' AND Id = \'' + staffId + '\'';
        }
        
        List<Staff__c> staffList = Database.query(query);
        for (Staff__c s : staffList) {
            emails.add(s.Email_Address__c);
        }
       
        string orgname=[select id,Organization_Name__c from user where id=:UserInfo.getuserid()].Organization_Name__c;
        string body='New shift(s) have been created on '+nwdt+' for '+role+'. Please log in and accept if you are interested-Team '+orgname;
        for(user u: [select id,Mobile_device_token__c from user where email=:emails and Organization_Name__c =:orgname and   Mobile_device_token__c!= null ]){//Mobile_device_token__c
           // tokens.add(u.Mobile_device_token__c);
            if (String.isNotBlank(bearerToken)) {
                sendPushNotification(bearerToken, u.Mobile_device_token__c,body);
            } else {
                System.debug('Error: Failed to generate Bearer token.');
            }
        }
       
      
    }
   public static String generateBearerToken() {
    try {
        MobileNotification__mdt NotificationDetails =[select id,ClientEmail__c,FinalNotificationUrl__c,ScopeUrl__c,TokenUrl__c,AUDUrl__c, PrivateKey__c FROM MobileNotification__mdt limit 1];
        // 🔹 Replace these with actual values from your Firebase service account JSON file
        String privateKey = '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDAOCDNak67oRSv\nwVVb/taAvfuacm6mPHrnU+K17MAVp3TcssnEGip7eRtcMZB1Bp/MYm32KMjt6Wbt\nN0WleXrhYVlnYhIBkDeVG6nfiLpGH9nPnQvEr+JX3DNs86efDudJ+D22ewt+Q8Ue\nsQKuTxtx6GkOCWlqEeEt1BXfZa5vxIK49sMSc6L9bYuVhFQfMau89e2ujeTObODb\nJTp3dQhwrZ/bil9YBGZZsTFvoWPchoIDs1MHAoWgCmJr6U2Dj5O4QCszsHjiFabH\nO6ZxuU72az2pQgJV1QacPQ6AUVFJnw7tgEY9TQyP+C1KZ4Oq2TF4bcJEN2SVdAuv\naDv83eZVAgMBAAECggEAHGTuK4nloX/U/3Vut404gIIP9aurvrC2cw+IMNmNMmWv\nNJ7QgUBgQCcOrJrBvRfCaT2tAqzZqZNN2gLNLfl49mwb+dKZ2FNGcqdIe7XF1nAE\nC9AmGeLla5cinZiMjUl1Tw71hsw8UWWPa844GCmlYzkys5keUkXb3poytPJfRzEd\nTmhIALW3y92JqmPhpUaqQfLb+jXzG/xu56RplWrTwGCWeO6T5/P/eWOFdiX6diyJ\nrlE1Zl8IB7qWuoYb9AaDrzinAyzpYEyI4HJ/uYuuaoufM9a1W6jpgQpxLc6qIDpj\ntK1EymzueGOYzvIYusupM+wvCmYkq9d2CqoKkQLaDQKBgQDzuTTgDpPEGIoX4Hf8\nHT51Wq6kyVJ9Ux5KjUdGVMYC0knB3clIwQKZAfTpGYvpOQ+JhPLO8Nut/Pbc72GA\nQa/Cju6K39RphMrlQwpsNGgpIvHiHyBPbIiaSe6jpy0RDTYs9deTwlTdvnc/+O2f\nfTlCwRQ47ZhFt6cw+f2J4FI6twKBgQDJ5sd0nRHBmwycTMsUhP79/XI0X5aZfPVl\nWuv2d4597nPDgerz4cP3Ptoq8JT5Rc07vrIISfg8+ZwQVqrn/Pn6NXKRmmL13gWF\npg5541Gf77b6S2IpvSg3szktacq9xC8GpJLyvwrhmEBmSHzjVbqxgqn6jeI7gVLY\nzSkwYMkLUwKBgCCPBlxENkNFD/WenAjHE1f0FE6ZQnbRisNk2jewDX/E/etzKHea\nqTEtjL0zF3jBkazKYPF6Ra6Zk5TyObE7lTJFi+JrgmHSRpSX/yVzXtLYAz408EkL\n87fA1qtwItobTLh24ySvGk1BK4cVRxE+Vk7vojb0rpnpreEiFFe96t5DAoGBAKWH\nyvFFsYAcwasHntw06eaNO2vLDurKM1skvx60CKQgstKQmnPXHlaANlhMJKd2Xfxk\nrQv0sUw0jYortDU9CCnmVgcgH5BatgZMDcRK5eoNm+P7mACGcAmyq+cavDj3NmLo\n3P2eOaqZq/rv5UxxRf4xFXExkFCfB7BuDB34y/u3AoGAGnr9gEywNQS0HRwoNNlX\nU1cIDESV/Ah02X27hVgJ/ihPbYnKa3Yzf/iSDA1VcW7v+Hj95Ek5YsamGCdMrIDn\nmr4+r5bsrxFCZ3ZD9CZhhBB+TdnE6A7Q1sUsQXYDsF/L7tC+RMdM0bdq2LfaWcH0\neuiClnmpJu+MBR8pZ46pn28=\n-----END PRIVATE KEY-----\n';
         //String privateKey =NotificationDetails.PrivateKey__c;   
        String clientEmail = NotificationDetails.ClientEmail__c;
         privateKey = privateKey.replace('-----BEGIN PRIVATE KEY-----\n', '')
                               .replace('-----END PRIVATE KEY-----\n', '')
                               .replace('\n', '');
             // ✅ Ensure private key formatting
            privateKey = privateKey.replace('-----BEGIN PRIVATE KEY-----\n', '')
                                   .replace('-----END PRIVATE KEY-----\n', '')
                                   .replace('\n', '');
            
            // ✅ JWT Header
            Map<String, String> header = new Map<String, String>();
            header.put('alg', 'RS256');
            header.put('typ', 'JWT');
            String encodedHeader = EncodingUtil.base64Encode(Blob.valueOf(JSON.serialize(header)))
                                               .replace('+', '-').replace('/', '_').replace('=', '');
    
            // ✅ JWT Payload
            Map<String, Object> payload = new Map<String, Object>();
            payload.put('iss', clientEmail); // ✅ Must match `client_email` in JSON file
            payload.put('sub', clientEmail); // ✅ Required for Google service accounts
            payload.put('scope', NotificationDetails.ScopeUrl__c);
            payload.put('aud', NotificationDetails.AUDUrl__c);
            payload.put('exp', DateTime.now().addSeconds(3600).getTime() / 1000);
            payload.put('iat', DateTime.now().getTime() / 1000);
            String encodedPayload = EncodingUtil.base64Encode(Blob.valueOf(JSON.serialize(payload)))
                                                .replace('+', '-').replace('/', '_').replace('=', '');
    
            // ✅ Create unsigned JWT token
            String unsignedToken = encodedHeader + '.' + encodedPayload;
    
            // ✅ Decode private key correctly
            Blob privateKeyBlob = EncodingUtil.base64Decode(privateKey);
    
            // ✅ Sign JWT token using RSA-SHA256
            Blob signature = Crypto.sign('RSA-SHA256', Blob.valueOf(unsignedToken), privateKeyBlob);
            String encodedSignature = EncodingUtil.base64Encode(signature)
                                                  .replace('+', '-').replace('/', '_').replace('=', '');
    
            // ✅ Final JWT token
            String jwtToken = unsignedToken + '.' + encodedSignature;
    
            // ✅ Exchange JWT for a Bearer token via HTTP callout
            HttpRequest req = new HttpRequest();
            req.setEndpoint(NotificationDetails.TokenUrl__c);
            req.setMethod('POST');
            req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
            req.setBody(
                'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer' +
                '&assertion=' + jwtToken
            );
    
            Http http = new Http();
            HttpResponse res = http.send(req);
    
            if (res.getStatusCode() == 200) {
                Map<String, Object> responseBody = (Map<String, Object>)JSON.deserializeUntyped(res.getBody());
                return (String)responseBody.get('access_token'); // ✅ Return Bearer token
            } else {
                throw new CalloutException('Failed to generate Bearer token: ' + res.getBody());
            }
        } catch (Exception e) {
            System.debug('⚠️ Error generating Bearer token: ' + e.getMessage());
        }
        return null;
    }
    
     @Future(callout=true)
   public static void sendPushNotification(String bearerToken, String deviceToken,string body) {
        try {
            system.debug(' bearerToken '+bearerToken);
            MobileNotification__mdt NotificationDetails =[select id,ClientEmail__c,FinalNotificationUrl__c,ScopeUrl__c,TokenUrl__c,AUDUrl__c, PrivateKey__c FROM MobileNotification__mdt limit 1];
            HttpRequest req = new HttpRequest();
            req.setEndpoint(NotificationDetails.FinalNotificationUrl__c); // Replace <PROJECT_ID> with your Firebase project ID
            req.setMethod('POST');
            req.setHeader('Authorization', 'Bearer ' + bearerToken);
            req.setHeader('Content-Type', 'application/json');
 
            // Notification payload
            Map<String, Object> notificationPayload = new Map<String, Object>();
            
            notificationPayload.put('message', new Map<String, Object>{
                'token' => deviceToken,
                'notification' => new Map<String, Object>{
                    'title' => 'New shift(s) available',
                    'body' => body
                }
            });
 			system.debug('payload '+JSON.serialize(notificationPayload));
            req.setBody(JSON.serialize(notificationPayload));
 
            Http http = new Http();
            HttpResponse res = http.send(req);
              System.debug('Push notification sent successfully: ' + res.getBody());
            if (res.getStatusCode() == 200) {
                System.debug('Push notification sent successfully: ' + res.getBody());
            } else {
                throw new CalloutException('Failed to send push notification: ' + res.getBody());
            }
        } catch (Exception e) {
            System.debug('Error sending push notification: ' + e.getMessage());
        }
    }
}