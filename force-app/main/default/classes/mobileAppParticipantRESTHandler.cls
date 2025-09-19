@RestResource(urlMapping='/ParticipantDetails/*')
global class mobileAppParticipantRESTHandler {
      @HttpGet
    global static List<Client__c> getClients() {
        // Retrieve parameters from the external system request
        RestRequest req = RestContext.request;
        String cname = req.params.get('cname');
        String isActiveParam = req.params.get('isActive');
        boolean isActive=Boolean.valueOf(isActiveParam);
         System.debug('Participant firstname in apex '+cname);   
         System.debug('isActive flag in apex rest '+isActive); 
        
        // Call the existing ClientSearchController.fetchFacilitiess method
        List<Client__c> clients = ClientSearchController.fetchFacilitiess(cname, isActive);
        
        return clients;
    }
    
     @HttpPost
    global static string  updateClientStatus(string IdValue,string status) {
        // Read the request body as JSON
        string clientStatus;
        if(IdValue != null && IdValue != '' && status != null && status != '' ){
          	 clientStatus= ClientSearchController.statusClient(IdValue, status); 
           
        }
         return clientStatus;
      
    }

}