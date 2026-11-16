@RestResource(urlMapping='/ParticipantAttachment/*')
global class mobileAppParticipantAttatchment {
     @HttpGet
    global static List<Attachment__c> getClientAttatchment(){
        list<Attachment__c> clientAttchlist= new list<Attachment__c>();
        SObjectAccessDecision decision ;
        RestRequest req = RestContext.request;
        String recordIdParam = req.params.get('ParticipantId');
        system.debug('recordIdParam: ' + recordIdParam);
        if(recordIdParam != null && recordIdParam != '' ){
           // clientAttchlist=  ClientAttachmentHandler.fetchRepositoryData(recordIdParam);
           clientAttchlist=  [SELECT Name,Type__c, Size__c,comments__c,USer_Name__c,Amazon_file_URL__c,Date__c,Date_Format__c,User__c from Attachment__c where Added_By__c = :recordIdParam  order by createddate desc];
           decision = Security.stripInaccessible(AccessType.READABLE, clientAttchlist); 
        }
        //return clientAttchlist ;
         return (List<Attachment__c>) decision.getRecords();
    } 

}