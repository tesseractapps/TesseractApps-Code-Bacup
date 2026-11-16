@RestResource(urlMapping='/ParticipantUserList/*')
global class mobileAppParticipantUser {
   @HttpGet
    global static List<User> getuserList(){
        User objUser = [ SELECT Phone, Id,Organization_Name__c FROM User WHERE Id = : UserInfo.getUserId() ];
        System.Debug('Controller User ' + objUser.Organization_Name__c);
        
        List<User> userList=[select id,Name,FirstName,LastName from User where Organization_Name__c =:objUser.Organization_Name__c and IsActive=true ];
        SObjectAccessDecision decision = Security.stripInaccessible(AccessType.READABLE, userList);
        return (List<User>) decision.getRecords();
       // return userList;
          
    }
    
    @HttpPost
    global static string insertAttachment(){
        RestRequest req = RestContext.request;
        string jsonString = req.requestBody.toString();
        system.debug('jsonString: ' + jsonString);
        boolean successCheck;
        string message;
         Attachment__c atch = new Attachment__c();
        try {
            // Deserialize the JSON string into a map
            Map<String, Object> data = (Map<String, Object>) JSON.deserializeUntyped(jsonString);
            // Extract values from the map
            string clientId=(String) data.get('clientId');
            String recordID = (String) data.get('recordID');
            String name = (String) data.get('name');
            String userId = (String) data.get('userId');
            String typeOfDocument = (String) data.get('typeOfDocument');
            String comments = (String) data.get('comments');
            String DocDate = (String) data.get('DocDate');
            String fileSize = (String) data.get('fileSize');
            String fileName = (String) data.get('fileName');
          // string base64= ( String ) JSON.deserializeUntyped(data.get('base64'));
            string base64=(String) data.get('base64'); 
           
            atch.Name = name;
            atch.Type__c = typeOfDocument;
            atch.Comments__c = comments;
            atch.Added_By__c=clientId;
            
            // Ensure the DocDate is in the correct format before assigning it
            if (DocDate != null && DocDate != '') {
                atch.Date__c = Date.valueOf(DocDate);
            }
            
            // Set User__c if userId is provided
            if (userId != null && userId != '') {
                atch.User__c = Id.valueOf(userId);
            }
            
            // If recordID is provided, perform an update; otherwise, insert a new record
            if (recordID != null && recordID != '') {
                atch.Id = recordID;
                update atch;
                message='Updated';
            } else {
                atch.Size__c=fileSize;
                insert atch;
                if(atch.id !=null && fileName !=null ){
                    AWSS3FileUploadController.uploadFile(string.valueof(base64), fileName, string.valueof(atch.id) ,'attach');  
                }
                 message='Created';
            }  
            successCheck = true;
            
        } catch (Exception e) {
            System.debug('Error: ' + e.getMessage());
            successCheck = false;
        }        
        // Return success or failure based on the result
        if(successCheck) {
            return message;
        } else {
            return 'Failure';
        }
    }  
        

}