/**
 * @description       : 
 * @author            : Raja Sekhar Reddy
 * @group             : 
 * @last modified on  : 06-18-2023
 * @last modified by  : Raja Sekhar Reddy
**/
public with sharing class ClientSearchController {
       // apex method to fetch participant records from salesforce database 
    @AuraEnabled(cacheable = true)
    public static list<Client__c> fetchFacilitiess(string cname, Boolean isTrue){ 
         User objUser = [ SELECT Phone, Id,Organization_Name__c FROM User WHERE Id = : UserInfo.getUserId() ];
        System.Debug('Controller User ' + objUser.Organization_Name__c);
         String UserEmail = UserInfo.getUserEmail();
        list<Client__c> listOfClients = new list<Client__c>();           
        String query = 'SELECT id,Facility__r.Name,Facility__r.Type_of_Service__c,Prefer_Nickname__c,Display_Nickname__c,ParticipantType__c,Facility__r.Status__c,Company__c,Primary_Name__c,Secondary_Name__c,Name__c,AddressData__c,Address1__c,Address2__c,Picture__c,Organization_Name__c,name,First_Name__c,Last_Name__c,Facility__c,Facility_Name__c,Status__c,Status_A__c,Contact_Number__c,Facility__r.Organisation__c,Address__Street__s,Address__City__s,Address__StateCode__s,Address__CountryCode__s,Address__PostalCode__s, Participant_Status__c,(SELECT Id, Risk_Index__c, Name ,Participant__c FROM Risk_Managements__r),Risk_Status__c,(Select  Id,Facility__c,Facility__r.Name, Active__c,Participant__c from Participant_Facilities__r WHERE Active__c = true ) FROM Client__c ';
        System.debug('Participant firstname '+cname);   
         System.debug('isActive flag '+isTrue); 
        if (!string.isBlank(cname)) {
             cname = '%' + cname + '%';
             query += 'WHERE Name LIKE :cname';
        } else {
            if(!Test.isRunningTest()){
            Organisation__c orgD = [select Id,name from Organisation__c where name=:objUser.Organization_Name__c];                    
            
                String trucatedStr = string.valueof(orgD.Id).substring(0,15);
                query += ' where Organization_Name__c  =: trucatedStr';               
            }
        }
        if (isTrue == true) {
            Staff__c loginStaff=[select Id from Staff__c where Email_Address__c=: UserEmail];
            system.debug('login staff '+loginStaff.Id );
            list<Participant_Staff_Association__c>  participantAssociationList= [select id ,Staff__c ,Staff__r.Name ,Participant__c,participant__r.name, Active__c from Participant_Staff_Association__c where Staff__c=:loginStaff.Id AND Active__c = true];
            system.debug('particinat list '+participantAssociationList);
            list<Id> participantId= new list<id>();
            
            if(participantAssociationList.size()>0){
                for(Participant_Staff_Association__c ps:participantAssociationList){
                    participantId.add(ps.Participant__c);
                    
                } 
            }
            system.debug('participantId '+participantId);
           query += ' AND Status__c =:isTrue AND Id in:participantId ';
        }        
         
       // system.debug(' query '+query);
         system.debug(' size '+listOfClients.size());
        listOfClients=Database.query(query);
        system.debug(' list '+listOfClients);
         system.debug(' size '+listOfClients.size());
        return listOfClients;        
    }
    @AuraEnabled
    public static string statusClient(String IdValue,String status){
        Client__c fact=new Client__c(Id=IdValue);
        system.debug('Status>>'+Boolean.valueOf(status));
        fact.Status__c=Boolean.valueOf(status);
        if(Boolean.valueOf(status) ==  true){
            fact.Status_A__c= 'Active';            
            system.debug('Status>>'+Boolean.valueOf(status));
            system.debug('status active>>>'+fact.Status_A__c);
        } else{
            fact.Status_A__c= 'In Active';
            system.debug('Status>>'+Boolean.valueOf(status));
            system.debug('status Inactive>>>'+fact.Status_A__c);
        }
        
        Update fact;
        return 'Partcipant Status is Updated';
    }
}