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
        User currentUser = [SELECT Id, Organization_Name__c, User_Type__c FROM User WHERE Id = :UserInfo.getUserId()];
        String userType = currentUser.User_Type__c;
        String userOrgName = currentUser.Organization_Name__c;
        String userId = UserInfo.getUserId();
        
        // Call the existing ClientSearchController.fetchFacilitiess method
        List<Client__c> clients = ClientSearchController.fetchFacilitiess(cname, isActive);
        if (userType =='Roster Manager' ||  userType =='Facility Admin'  ) {
            Set<Id> accessibleFacilityIds = MobileRoasterAdminShiftStaff.getAccessibleFacilityIds();
            List<Client__c> filteredClients = new List<Client__c>();
            for (Client__c c : clients) {
                if (c.Facility__c != null && accessibleFacilityIds.contains(c.Facility__c)) {
                    filteredClients.add(c);
                }
            }
        clients = filteredClients;
    }
        
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