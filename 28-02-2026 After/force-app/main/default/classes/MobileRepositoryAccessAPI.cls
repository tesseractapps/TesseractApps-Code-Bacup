@RestResource(urlMapping='/repositoryAccess/*')
global with sharing class MobileRepositoryAccessAPI {

    /* ======================================================
       REQUEST WRAPPERS
    ====================================================== */

    // Used for POST body
    global class ConsentRequest {
        public String action;        // REPORT or ACCEPT
        public Id repositoryId;
        public Id attachmentId;
    }

    // Common response
    global class ResponseWrapper {
        public Boolean isSuccess;
        public Object data;
        public String message;
    }

    /* ======================================================
       GET METHOD
       → Calls getUsersWithViewPermission()
       URL Example:
       /repositoryAccess?repositoryId=a0Txxx&roles=HR Admin,NDIS Staff
    ====================================================== */
    @HttpGet
    global static void getUsersWithPermissions() {

        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;

        ResponseWrapper response = new ResponseWrapper();

        try {


            String repositoryIdParam = req.params.get('repositoryId');
            String repositoryAttachmentId = req.params.get('repositoryAttachmentId');
            string userId=UserInfo.getUserId();

           List<Security_Privilege__c> sp = [ SELECT User__c, View__c, Consent_Required__c,Repository_Attachment__c, Repository__r.CreatedById FROM Security_Privilege__c WHERE Repository__c = :repositoryIdParam  AND 
             Repository_Attachment__c=:repositoryAttachmentId AND View__c = TRUE AND User__c=:userId limit 1];

            response.isSuccess = true;
            response.message = sp.size()>0 && sp[0].Consent_Required__c ==true ?'Consent is required':'Not required';

        } catch(Exception e){
            response.isSuccess = false;
            response.message = e.getMessage();
        }

        res.statusCode = 200;
        res.responseBody = Blob.valueOf(JSON.serialize(response));
    }


    
    @HttpPost
    global static void handleConsentActions() {
    
        System.debug('=========== 🚀 HANDLE CONSENT ACTION START ===========');
    
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
    
        ResponseWrapper response = new ResponseWrapper();
    
        try {
    
            System.debug('📥 Raw Request Body: ' + req.requestBody.toString());
    
            ConsentRequest body =
                (ConsentRequest) JSON.deserialize(
                    req.requestBody.toString(),
                    ConsentRequest.class
                );
    
            System.debug('🔄 Deserialized Body: ' + body);
            
            if(body != null){
                System.debug('📌 Repository Id: ' + body.repositoryId);
                System.debug('📌 Attachment Id: ' + body.attachmentId);
            }
    
            if(body == null ||
               body.repositoryId == null ||
               body.attachmentId == null){
    
                System.debug('⛔ Validation Failed: Missing repositoryId or attachmentId');
    
                throw new AuraHandledException(
                    'repositoryId and attachmentId are required'
                );
            }
    
            System.debug('📤 Calling RepositorySecurityHandler.acceptConsent()');
    
            RepositorySecurityHandler.acceptConsent(
                body.repositoryId,
                body.attachmentId
            );
    
            System.debug('✅ Consent accepted successfully');
    
            response.isSuccess = true;
            response.message = 'Consent accepted successfully';
    
        } 
        catch(Exception e){
    
            System.debug('❌ ERROR OCCURRED');
            System.debug('❌ Exception Message: ' + e.getMessage());
            System.debug('❌ Stack Trace: ' + e.getStackTraceString());
    
            response.isSuccess = false;
            response.message = e.getMessage();
        }
    
        res.statusCode = 200;
        res.responseBody = Blob.valueOf(JSON.serialize(response));
    
        System.debug('📤 Final Response: ' + JSON.serialize(response));
        System.debug('=========== ✅ HANDLE CONSENT ACTION END ===========');
    }
}