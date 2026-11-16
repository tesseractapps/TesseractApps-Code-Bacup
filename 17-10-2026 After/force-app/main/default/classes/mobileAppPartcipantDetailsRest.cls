@RestResource(urlMapping='/FetchPartcipant/*')
global class mobileAppPartcipantDetailsRest {
     @HttpGet
    global static List<Client__c> fecthParticipantList(){
        list<Client__c> participantlsit = new list <Client__c>();
         SObjectAccessDecision decision ;
        RestRequest req = RestContext.request;
        String recordIdParam = req.params.get('recordId'); // Fetch the parameter as String
        system.debug('recordIdParam: ' + recordIdParam);
      
        if(recordIdParam != '' ){
            ID recID = Id.valueOf(recordIdParam);
            system.debug('recID: ' + recID);
            participantlsit =[SELECT id,Name__c,Facility__r.Name,AddressData__c,Organization_Name__c,Picture__c,name,First_Name__c,Last_Name__c,Facility__c,Status__c,Contact_Number__c,address__Street__s,address__City__s,address__StateCode__s,Address__CountryCode__s,Address__PostalCode__s,Facility__r.Organisation__c,Primay_Contact_First_Name__c,Primay_Contact_Last_Name__c,Secondary_Contact_First_Name__c,Secondary_Contact_Last_Name__c,Date_Of_Birth__c,Primary_Contact_Number__c,Secondary_Contact_Number__c,Gendar__c,Age__c,
                        		NDIS_Participant_ID__c,Medicare_Card_ID__c,Passport_Details__c,Drivers_Licence__c,Photo_ID__c,State__c,Membership_Number__c,Insurance_Provider__c,Health_Concession_Cards__c,DVA_Card__c,Relationship__c,Primary_Email_ID__c,Secondary_Contact_Relationship__c,Secondary_Contact_Email_ID__c,(SELECT Id, Facility__c, Facility__r.Name, Active__c, Participant__c FROM Participant_Facilities__r WHERE Active__c = true)
                				FROM Client__c WHERE Id = :recID LIMIT 1];
            
             decision = Security.stripInaccessible(AccessType.READABLE, participantlsit); 
            
            //participantlsit=ClientDataController.getClientById(recID);  
        }
       return (List<Client__c>) decision.getRecords();
       //return participantlsit;
        
    }

}