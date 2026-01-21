@RestResource(urlMapping='/ParticipantJournel/*')
global  class mobileAppParticipantJournal {
	@HttpGet
    global static List<Client_Journel__c> fecthParticipantList(){ 
        List<Client_Journel__c> clientJournalList= new List<Client_Journel__c>();
          SObjectAccessDecision decision ;
         RestRequest req = RestContext.request;
        String recordIdParam = req.params.get('ParticipantId');
         system.debug('recordIdParam: ' + recordIdParam);
          if(recordIdParam != null && recordIdParam != '' ){
          //  clientJournalList=  ParticipantDetailsHandler.listOfClientjounel(recordIdParam);
          	clientJournalList=[select id,Description__c,CreatedDate__c,LastModifiedDate,createdDate,CreatedBy.Name,CreatedBy.SmallPhotoUrl,Care_Notes__c,staff__r.name,staff__r.Last_Name__c,staff__r.picture__c from Client_Journel__c where Client__c=:recordIdParam  Order by createdDate desc ];
           	decision = Security.stripInaccessible(AccessType.READABLE, clientJournalList);   
          }
       // return clientJournalList ;
        return (List<Client_Journel__c>) decision.getRecords();
        
    }
    @HttpPost
    global static string createClientJournel(String participantId,String journelId,String description, String typeOfnotes){
        
		string clientNotes =ParticipantDetailsHandler.saveDesc(participantId, journelId, description, typeOfnotes);
		return clientNotes ;       
        
    }
    
}