public with sharing class AgreementsHandler {
    @AuraEnabled(cacheable=false)
  public static List<ContentDocumentLink> fetchClientFiles(String clientId){
     return [SELECT LinkedEntityId, ContentDocument.CreatedDate, ContentDocument.Title, ContentDocument.ContentSize, ContentDocument.FileType 
                  FROM ContentDocumentLink  
              WHERE LinkedEntityId =: clientId];
  }
   @AuraEnabled  
  public static string UpdateFileSize(string clientId, string filesize) { 
      Service_Agreement__c pat= new Service_Agreement__c(id=clientId);
      pat.Size__c=filesize;
      update pat;
      return 'Updated';  
  }
  
  @AuraEnabled
  public static List<Service_Agreement__c> fetchRepositoryData(String clientId){
      List<Service_Agreement__c> listName = new List<Service_Agreement__c>();
      listName = [SELECT Name, Size__c,Comments__c,User_Name__c,Amazon_Url__c,Date_Format__c,key__c from Service_Agreement__c where Participant__c =:clientId order by createddate desc];
      return listName;
  }
  
  @AuraEnabled
  public static void deleteRepository(string repData){
      try {
          //delete repData;
          List<Service_Agreement__c> repList = [SELECT Name,Size__c,Comments__c,User_Name__c,Amazon_Url__c from Service_Agreement__c where id = :repData];
          delete repList;
      }
      catch(Exception ex) {
          throw new AuraHandledException(ex.getMessage());
      }
  }
  @AuraEnabled
  public static Map<ID, String> getRelatedFilesByRecordId(String clientId) {
      // Get record file IDs        
      List<ContentDocumentLink> files = [SELECT ContentDocumentId FROM ContentDocumentLink WHERE LinkedEntityId = :clientId];
      List<ID> fileIDs = new List<ID>();
      for (ContentDocumentLink docLink : files) {
          fileIDs.add(docLink.ContentDocumentId);
      }

      List<ContentVersion> docs = [SELECT ContentDocumentId, FileExtension, Title 
          FROM ContentVersion WHERE ContentDocumentId IN : fileIDs];
      Map<ID, String> mapIdTitle = new Map<ID, String>();
      for (ContentVersion docLink : docs) {
          mapIdTitle.put(docLink.ContentDocumentId, docLink.Title);
      }
      return mapIdTitle;
  }
    
    
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> checkSignatureStatus(Id recordId) {
        Map<String, Object> response = new Map<String, Object>();
        response.put('isSigned', false);
        response.put('signatureUrl', null);

        try {
            Offer_Template__c offer = [
                SELECT Id FROM Offer_Template__c WHERE ServiceId__c = :recordId LIMIT 1
            ];

            if (offer != null) {
                Child_Signatures__c latestSignature = [
                    SELECT Signature_URL__c FROM Child_Signatures__c 
                    WHERE Offer_Template__c = :offer.Id 
                    ORDER BY CreatedDate DESC 
                    LIMIT 1
                ];

                if (latestSignature != null && latestSignature.Signature_URL__c != null) {
                    response.put('isSigned', true);
                    response.put('signatureUrl', latestSignature.Signature_URL__c);
                }
            }
        } catch (Exception e) {
            System.debug('❌ Error checking signature status: ' + e.getMessage());
        }

        return response;
    }

}