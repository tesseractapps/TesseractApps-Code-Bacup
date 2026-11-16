@RestResource(urlMapping='/repositoryAccess/*')
global with sharing class MobileRepositoryAccessAPI {

    /* ======================================================
       REQUEST WRAPPERS
    ====================================================== */

    // Used for POST body
    global class ConsentRequest {
        public String action;
        public String typeOfAction;
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
            
            String repositoryIdParam =
                req.params.get('repositoryId');
            
            String repositoryAttachmentId =
                req.params.get('repositoryAttachmentId');
            
            Id userId = UserInfo.getUserId();
            
            List<Security_Privilege__c> sp = [
                
                SELECT User__c,
                View__c,
                Consent_Required__c,
                Consent_Status__c,
                Repository_Attachment__c,
                Repository__r.CreatedById
                
                FROM Security_Privilege__c
                
                WHERE Repository__c = :repositoryIdParam
                AND Repository_Attachment__c = :repositoryAttachmentId
                AND View__c = TRUE
                AND User__c = :userId
                
                LIMIT 1
            ];
            
            Map<String,Object> consentData =
                new Map<String,Object>();
            
            if(!sp.isEmpty()) {
                
                consentData.put(
                    'consentRequired',
                    sp[0].Consent_Required__c
                );
                
                consentData.put(
                    'consentStatus',
                    sp[0].Consent_Status__c
                );
            }
            else {
                
                consentData.put(
                    'consentRequired',
                    false
                );
                
                consentData.put(
                    'consentStatus',
                    null
                );
            }
            
            response.isSuccess = true;
            response.data = consentData;
            response.message = 'Success';
            
        }
        catch(Exception e) {
            
            response.isSuccess = false;
            response.message = e.getMessage();
        }
        
        res.statusCode = 200;
        res.responseBody =
            Blob.valueOf(JSON.serialize(response));
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
    
           if(body.typeOfAction == 'VIEW'){

            System.debug('📤 Calling markConsentAsViewed');
        
            Boolean consentRequired =
                RepositorySecurityHandler.markConsentAsViewed(
                    body.repositoryId,
                    body.attachmentId
                );
        
            response.isSuccess = true;
            response.data = consentRequired;
            response.message = 'Consent marked as viewed';
        }
        else if(body.typeOfAction == 'CONSENT'){
        
            System.debug('📤 Calling acceptConsent');
        
            RepositorySecurityHandler.acceptConsent(
                body.repositoryId,
                body.attachmentId
            );
        
            response.isSuccess = true;
            response.message = 'Consent accepted successfully';
        }
        else{
        
            throw new AuraHandledException(
                'Invalid typeOfAction. Allowed values: VIEW or CONSENT'
            );
        }
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