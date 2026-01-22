public class MobileAppNotificationsV2 {
   @AuraEnabled
    public static void generateAndSendNotification(string role,string strdate,string staffId, boolean isRjectedAllocation,string rejectedStaffEmail,string facilityValue,string typeofshift,string ShiftId,Boolean groupShift,
                                                  string endDate,string shiftType,string startTime,string endTime,string address,decimal latitude,decimal longitude) {
       
 System.debug('--- START generateAndSendNotification ---');
    
    String bearerToken = generateBearerToken(); // Generate Bearer Token
    System.debug('Bearer Token: ' + bearerToken);

    List<String> emails = new List<String>();
    System.debug('Initial Email List: ' + emails);

    // Split and reformat start date
    List<String> res = strdate.split('-');
    String nwdt = res[2] + '-' + res[1] + '-' + res[0];
    System.debug('Formatted Start Date (nwdt): ' + nwdt);

    // Convert end date from yyyy-MM-dd to dd-MM-yyyy
    List<String> endParts = endDate.split('-');
    String formattedEndDate = endParts[2] + '-' + endParts[1] + '-' + endParts[0];
    System.debug('Formatted End Date: ' + formattedEndDate);

    // Create a map with all shift details
    Map<String, Object> shiftDetails = new Map<String, Object>{
        'role' => role,
        'startDate' => nwdt,
        'endDate' => formattedEndDate,
        'shiftType' => shiftType,
        'startTime' => startTime,
        'endTime' => endTime,
        'address' => address,
        'latitude' => latitude,
        'longitude' => longitude
    };
    System.debug('Shift Details Map: ' + shiftDetails);

    String shiftDetailsJson = JSON.serialize(shiftDetails);
    System.debug('Shift Details JSON: ' + shiftDetailsJson);

    // You can add more debug logs here depending on what happens next
    System.debug('--- END generateAndSendNotification ---');

                                            
          set<Id>staffIdList=new set<Id>();
        if(String.isNotBlank(ShiftId)){
             Add_Shift__c shift = [
            SELECT Id, Location__Street__s, Location__City__s, Location__PostalCode__s, Location__StateCode__s, Location__CountryCode__s,
            Facility__r.Name, Role__c, Start_Date__c, Start_Time__c, Start_time_Formula__c, End_Time__c, End_time_formula__c,
            Shift_Type__c, Is_EOI__c, Shift_Start_End_Time__c, EOI_staff__c,
            (SELECT Id, Staff__c, Shift_Address__Street__s, Shift_Address__City__s, Shift_Address__StateCode__s, Shift_Address__PostalCode__s, Shift_Address__CountryCode__s, Start_time_Formula__c, End_time_formula__c, Start_Date__c, Shift_End_Date__c, (SELECT Id, Service_Type_Name__c, Participant_Name__c FROM Services_and_Support_Plans__r)
             FROM ShiftwithStaffs__r)
            FROM Add_Shift__c
            WHERE Id = :ShiftId
            LIMIT 1
        ];
       
                if(groupShift==true){
                    for(ShiftwithStaff__c ss :shift.ShiftwithStaffs__r){
                        staffIdList.add(ss.staff__c);
                    }
                  }
        }
        
        
        String query = 'SELECT Id, Email_Address__c, Role__c FROM Staff__c WHERE Facility__c=:facilityValue AND Role__c INCLUDES (\'' + role + '\')';
        
        if (staffId != null && staffId != '') {
            query += ' AND Id = \'' + staffId + '\'';
        }
        if(groupShift==true){
            query += ' AND Id IN :staffIdList';
        }
        List<Staff__c> staffList = Database.query(query);
        system.debug(' staffList count '+staffList.size());
        for (Staff__c s : staffList) {
            if(isRjectedAllocation ==false){
                emails.add(s.Email_Address__c); 
            }
             if(isRjectedAllocation ==true &&  rejectedStaffEmail !=s.Email_Address__c ){
                emails.add(s.Email_Address__c); 
            }
           
        }
       
        string orgname=[select id,Organization_Name__c from user where id=:UserInfo.getuserid()].Organization_Name__c;
        // 🔹 Build dynamic message based on typeofshift
            String body;
            
            if (typeofshift == 'recurring') {
                body = 'Recurring shift(s) have been created on ' + nwdt +
                       ' for ' + role + '. Please check the shift details - Team ' + orgname;
            } else if (typeofshift == 'addShift') {
                body = 'A shift has been added on ' + nwdt +
                       ' for ' + role + '. Please check and confirm - Team ' + orgname;
            } else if (typeofshift == 'isEOI') {
                body = 'An Expression of Interest (EOI) shift is open on ' + nwdt +
                       ' for ' + role + '. Please submit your interest - Team ' + orgname;
            }else if (typeofshift == 'createShift') {
                body = 'A shift has been created on ' + nwdt +
                       ' for ' + role + '. Please check the shift details - Team ' + orgname;
            }else {
                // fallback (if typeofshift is null or unknown)
                body = 'New shift(s) have been created on ' + nwdt +
                       ' for ' + role + '. Please log in and accept if you are interested - Team ' + orgname;
            }

        
        list<User> userList=[select id,Name,Mobile_device_token__c,
                    (SELECT Id, CreatedDate, Mark_as_read_notifications__c
                     FROM My_Notifications__r
                     ORDER BY CreatedDate DESC
                     LIMIT 20) from user where email=:emails and Organization_Name__c =:orgname and   Mobile_device_token__c!= null ];
        system.debug(' users count '+userList.size());
           Map<Id, Integer> unreadCountMap = new Map<Id, Integer>();
             for (User u : userList) {
                  Integer unread = 0;
                                                      
                 if (u.getSObjects('My_Notifications__r') != null) {
                    for (My_Notification__c n : u.My_Notifications__r) {
                      if (n.Mark_as_read_notifications__c == false) {
                              unread++;
                           }
                       }
                  }
                  unreadCountMap.put(u.Id, unread);
                 System.debug('User ' + u.Id + ' unread (latest 20): ' + unread);
            }                                            
                                                     
        for(user u: userList){//Mobile_device_token__c
           // tokens.add(u.Mobile_device_token__c);
            System.debug('--- Processing User: ' + u.Name + ' (' + u.Id + ') ---');
            System.debug('✅ Bearer token is available, sending push notification');
            System.debug('   - Mobile Token: ' + u.Mobile_device_token__c);
            System.debug('   - Body: ' + body);
            Integer unread = unreadCountMap.containsKey(u.Id) ? unreadCountMap.get(u.Id) : 0;
            if (String.isNotBlank(bearerToken)) {
                System.debug('with in if ');
                sendPushNotification(bearerToken, u.Mobile_device_token__c,body,shiftDetailsJson,unread);
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
   public static void sendPushNotification(String bearerToken, String deviceToken,string body,String shiftDetailsJson,Integer unread) {
        try {
            system.debug(' bearerToken====> '+bearerToken);
            MobileNotification__mdt NotificationDetails =[select id,ClientEmail__c,FinalNotificationUrl__c,ScopeUrl__c,TokenUrl__c,AUDUrl__c, PrivateKey__c FROM MobileNotification__mdt limit 1];
            HttpRequest req = new HttpRequest();
            req.setEndpoint(NotificationDetails.FinalNotificationUrl__c); // Replace <PROJECT_ID> with your Firebase project ID
            req.setMethod('POST');
            req.setHeader('Authorization', 'Bearer ' + bearerToken);
            req.setHeader('Content-Type', 'application/json');
 
            // Notification payload
            Map<String, Object> notificationPayload = new Map<String, Object>();
            
           Map<String, Object> shiftDetails = (Map<String, Object>) JSON.deserializeUntyped(shiftDetailsJson);
            
            

            Map<String, String> dataPayload = new Map<String, String>();
            dataPayload.put('shiftDetails', shiftDetailsJson);
              dataPayload.put('unreadCount', string.valueof(unread));
            notificationPayload.put('message', new Map<String, Object>{
                'token' => deviceToken,
                'notification' => new Map<String, Object>{
                    'title' => 'New shift(s) available',
                    'body' => body
                  },
                    'data' => dataPayload
                   // 'unreadCount' =>unreadCount
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