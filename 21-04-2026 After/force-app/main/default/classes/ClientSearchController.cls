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
        String query =
                'SELECT Id, ' +
                'Facility__r.Name, Facility__r.Type_of_Service__c, Facility__r.Status__c, ' +
                'Facility__r.Organisation__c, ' +
                'Email__c, Prefer_Nickname__c, Display_Nickname__c, ParticipantType__c, ' +
                'Company__c, Primary_Name__c, Secondary_Name__c, Name__c, ' +
                'AddressData__c, Address1__c, Address2__c, Picture__c, ' +
                'Organization_Name__c, First_Name__c, Last_Name__c, ' +
                'Facility__c, Facility_Name__c, Status__c, Status_A__c, ' +
                'Contact_Number__c, ' +
                'Address__Street__s, Address__City__s, Address__StateCode__s, ' +
                'Address__CountryCode__s, Address__PostalCode__s, ' +
                'Participant_Status__c, Risk_Status__c, ' +

                '(SELECT Id, Risk_Index__c, Name, Participant__c FROM Risk_Managements__r), ' +

                '(SELECT Id, Facility__c, Facility__r.Name, Active__c, Participant__c ' +
                ' FROM Participant_Facilities__r WHERE Active__c = true), ' +

                '(SELECT Id, Name, First_Name__c, Last_Name__c, Email__c, ' +
                ' Contact_Number__c, Contact_Type__c, Notify__c ' +
                ' FROM Participant_Contacts__r Where Contact_Type__c = \'Guardian\') ' +

                'FROM Client__c';
           
        System.debug('Participant firstname '+cname);   
         System.debug('isActive flag '+isTrue); 
        if (!string.isBlank(cname)) {
             cname = '%' + cname + '%';
             query += ' WHERE Name LIKE :cname';
        } else {
            if(!Test.isRunningTest()){ Organisation__c orgD = [select Id,name from Organisation__c where name=:objUser.Organization_Name__c];    String trucatedStr = string.valueof(orgD.Id).substring(0,15); query += ' where Organization_Name__c  =: trucatedStr';               
            }
        }
        if (isTrue == true) {
            Staff__c loginStaff=[select Id from Staff__c where Email_Address__c=: UserEmail];
            system.debug('login staff '+loginStaff.Id );
            list<Participant_Staff_Association__c>  participantAssociationList= [select id ,Staff__c ,Staff__r.Name ,Participant__c,participant__r.name, Active__c from Participant_Staff_Association__c where Staff__c=:loginStaff.Id AND Active__c = true];
            system.debug('particinat list '+participantAssociationList);
            list<Id> participantId= new list<id>();
            
            if(participantAssociationList.size()>0){ for(Participant_Staff_Association__c ps:participantAssociationList){ participantId.add(ps.Participant__c);
                    
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

    
    @AuraEnabled(cacheable=true)
    public static ClientPaginationWrapper fetchParticipantWithPagination( String searchText, List<Id> facilityIds, Boolean isTrue, Integer pageSize, Integer pageNumber, Integer refreshKey, Boolean isActive){ 
    system.debug('facilityIds >>>>>>>>>>>>>>>' + facilityIds);
    String userEmail = UserInfo.getUserEmail();

    List<String> filters = new List<String>();

    if (String.isNotBlank(searchText)) {
        String searchLike = '%' + searchText + '%';

        filters.add(
            '(' +
                ' Display_Nickname__c LIKE :searchLike ' +
                'OR Contact_Number__c LIKE :searchLike ' +
                'OR ParticipantType__c LIKE :searchLike' +
            ')'
        );

        // 🔥 Facility name search separately (adds IDs)
        List<Participant_Facility__c> matchedFacilities = [
            SELECT Participant__c
            FROM Participant_Facility__c
            WHERE Active__c = true
            AND Facility__r.Name LIKE :searchLike
        ];

        Set<Id> facilityMatchedIds = new Set<Id>();

        for (Participant_Facility__c pf : matchedFacilities) { if (pf.Participant__c != null) { facilityMatchedIds.add(pf.Participant__c);
            }
        }

        if (!facilityMatchedIds.isEmpty()) { filters.add('(Id IN :facilityMatchedIds)');
        }
    }
    if (isActive != null) {
       filters.add('Status__c = :isActive');
     }

    // 🏢 Facility filter (multi-select)
   /*  if (facilityIds != null && !facilityIds.isEmpty()) {
        filters.add(
            'Id IN (SELECT Participant__c FROM Participant_Facility__c ' +
            'WHERE Active__c = true AND Facility__c IN :facilityIds)'
        );
    } */

    User loggedInUser = [
            SELECT Id, Email, User_Type__c 
            FROM User 
            WHERE Id = :UserInfo.getUserId()
        ];

    // 🔒 Existing logic (UNCHANGED)
    if (loggedInUser.User_Type__c == 'NDIS Staff') {
        system.debug('isTrue >>>>>>>>>>>>>>>' + isTrue);

        Staff__c loginStaff = [
            SELECT Id FROM Staff__c 
            WHERE Email_Address__c = :userEmail 
            LIMIT 1
        ];

        system.debug('isTrue >>>>>>>>>>>>>>>' + loginStaff.Id);

        List<Participant_Staff_Association__c> participantAssociationList = [
            SELECT Participant__c 
            FROM Participant_Staff_Association__c 
            WHERE Staff__c = :loginStaff.Id 
            AND Active__c = true
        ];

        

        List<Id> participantId = new List<Id>();

        for (Participant_Staff_Association__c ps : participantAssociationList) {
            system.debug('isTrue >>>>>>>>>>>>>>>' + ps);
            participantId.add(ps.Participant__c);
        }

        system.debug('isTrue >>>>>>>>>>>>>>>' + participantId);

        //filters.add('Status__c = :isTrue');

        if (!participantId.isEmpty()) {
            filters.add('Id IN :participantId');
        } else {
            filters.add('Id = null'); // no access
        }
    }
            

        if (loggedInUser.User_Type__c == 'NDIS Participants') { Set<Id> allowedParticipantIds = new Set<Id>(); for (Client__c c : [ SELECT Id FROM Client__c WHERE Email__c = :loggedInUser.Email]) { allowedParticipantIds.add(c.Id);} for (Participant_Contact__c pc : [
                SELECT Participant__c 
                FROM Participant_Contact__c 
                WHERE Email__c = :loggedInUser.Email
                AND Contact_Type__c = 'Guardian'
            ]) {
                if (pc.Participant__c != null) {
                    allowedParticipantIds.add(pc.Participant__c);
                }
            }

            system.debug('allowedParticipantIds >>>>>>>>'+ allowedParticipantIds);
            // 🔒 Apply restriction
            if (!allowedParticipantIds.isEmpty()) {
                filters.add('Id IN :allowedParticipantIds');
            } else {
                filters.add('Id = null'); // no access
            }
        }

       ClientPaginationWrapper result = new ClientPaginationWrapper();

        // 🔥 BASE QUERY (DEFAULT FACILITY FILTER APPLIED)
        String baseQuery;

        if(loggedInUser.User_Type__c != 'NDIS Participants'){
            baseQuery =
                ' FROM Client__c WHERE Id IN (' +
                'SELECT Participant__c FROM Participant_Facility__c ' +
                'WHERE Active__c = true AND Facility__c != null AND Facility__c IN :facilityIds ' +
                ')';
        } else {
            baseQuery =
                ' FROM Client__c WHERE Id IN (' +
                'SELECT Participant__c FROM Participant_Facility__c ' +
                'WHERE Active__c = true ' +
                ')';
        }

        // Append other filters
        if (!filters.isEmpty()) {
            baseQuery += ' AND ' + String.join(filters, ' AND ');
        }

        system.debug('baseQuery >>>>>>>'+ baseQuery);
        // 🔹 COUNT QUERY
        String countQuery = 'SELECT COUNT() ' + baseQuery;
        result.totalRecords = Database.countQuery(countQuery);


        // 🔹 OFFSET calculation
        Integer offsetVal = (pageNumber - 1) * pageSize;

            // 🔹 MAIN DATA QUERY
        String query =
            'SELECT Id, ' +
            'Facility__r.Name, Facility__r.Type_of_Service__c, Facility__r.Status__c, ' +
            'Facility__r.Organisation__c, ' +
            'Email__c, Prefer_Nickname__c, Display_Nickname__c, ParticipantType__c, ' +
            'Company__c, Primary_Name__c, Secondary_Name__c, Name__c, ' +
            'AddressData__c, Address1__c, Address2__c, Picture__c, ' +
            'Organization_Name__c, First_Name__c, Last_Name__c, ' +
            'Facility__c, Facility_Name__c, Status__c, Status_A__c, ' +
            'Contact_Number__c, ' +
            'Address__Street__s, Address__City__s, Address__StateCode__s, ' +
            'Address__CountryCode__s, Address__PostalCode__s, ' +
            'Participant_Status__c, Risk_Status__c, ' +

            '(SELECT Id, Risk_Index__c, Name, Participant__c FROM Risk_Managements__r), ' +

            '(SELECT Id, Facility__c, Facility__r.Name, Active__c, Participant__c ' +
            ' FROM Participant_Facilities__r WHERE Active__c = true), ' +

            '(SELECT Id, Name, First_Name__c, Last_Name__c, Email__c, ' +
            ' Contact_Number__c, Contact_Type__c, Notify__c ' +
            ' FROM Participant_Contacts__r WHERE Contact_Type__c = \'Guardian\') ' +

            baseQuery +
            ' ORDER BY Display_Nickname__c ASC ' +
            ' LIMIT :pageSize OFFSET :offsetVal';

        // 🔹 EXECUTE
        result.records = Database.query(query);

        return result;
}
    public class ClientPaginationWrapper {
        @AuraEnabled public List<Client__c> records;
        @AuraEnabled public Integer totalRecords;
    }

}