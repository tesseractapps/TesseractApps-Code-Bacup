public class mobilePushNotificationController {    
  @AuraEnabled
    public static void sendPushNotification(string role,string strdate){   
        List<string> emails = new list<string>();
         List<string> tokens = new list<string>(); 
		List<String> res = strdate.split('-');
		string nwdt=res[2]+'-'+res[1]+'-'+res[0];
		system.debug(nwdt);
        List<Staff__c> staffList = Database.query('select id,Email_Address__c,Role__c from Staff__c where Role__c includes (\'' + role +'\')');
        for(Staff__c s: staffList){
            emails.add(s.Email_Address__c);
        }
        system.debug(emails);
        
        string orgname=[select id,Organization_Name__c from user where id=:UserInfo.getuserid()].Organization_Name__c;
        for(user u: [select id,Mobile_device_token__c from user where email=:emails and Organization_Name__c =:orgname and   Mobile_device_token__c!= null ]){//Mobile_device_token__c
            tokens.add(u.Mobile_device_token__c);
        }
        
        
        Http http = new Http();
        HttpRequest request = new HttpRequest();
        request.setEndpoint(System.Label.MobileNotificationEndPoint);
        request.setMethod('POST');
        request.setHeader('Content-Type', 'application/json');
        request.setHeader('Authorization', System.Label.MobileNotificationKey);
            
      string body='New shift(s) have been created on '+nwdt+' for '+role+'. Please log in and accept if you are interested-Team '+orgname;
        string title='New shift(s) available';
   	   // string jsonInput='{"registration_ids":'+JSON.serializePretty(tokens, True)+', "notification" : {"body" : "New shift is created. Please allocate if interested","title": "New shift available"  }, }';
         string jsonInput='{"registration_ids":'+JSON.serializePretty(tokens, True)+', "notification" : {"body" : '+JSON.serializePretty(body,True)+',"title": '+JSON.serializePretty(title,True)+'}, }';
        system.debug(jsonInput);
        request.setBody(jsonInput);
        HttpResponse response = http.send(request);
         System.debug('push notification body  '+response.getBody());
        if(response.getStatusCode() != 201) {
            System.debug('The status code returned was not expected: ' + response.getStatusCode() + ' ' + response.getStatus());
        } else {
            System.debug(response.getBody());
        }

      }
}