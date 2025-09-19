/**
 * @description       : 
 * @author            : Raja Sekhar Reddy
 * @group             : 
 * @Test Class        : ClientDataControllerTest
 * @last modified on  : 06-22-2023
 * @last modified by  : Raja Sekhar Reddy
**/
public with sharing class ClientDataController {
     // apex method to fetch Client records from salesforce database 
    @AuraEnabled
    public static list<Client__c> fetchFacilitiess(string recordId,String firstname,String lastname){ 
        list<Client__c> lstClient = new list<Client__c>();
        System.debug('Participant firstname '+firstname);
        System.debug('Participant lastname '+lastname);        
        System.debug('recordId '+recordId);
        String trucatedStr = recordId.substring(0,15);
        String[] filters = new String[0];
        if(firstname !=NULL){
            string fname=firstname+'%';
            filters.add('First_Name__c Like : fname');
        }
        if(lastname !=NULL){
            string lname=lastname+'%';
            filters.add('Last_Name__c Like : lname');
        }
        filters.add('Organization_Name__c = : trucatedStr');
        
        String query= 'SELECT id,Name__c,Facility__r.Name,AddressData__c,Organization_Name__c,Picture__c,name,First_Name__c,Last_Name__c,Facility__c,Status__c,Contact_Number__c,address__Street__s,address__City__s,address__StateCode__s,Address__CountryCode__s,Address__PostalCode__s,Facility__r.Organisation__c,Participant_Status__c FROM Client__c';
        if(filters.size() > 0) {
            query += ' WHERE ' + String.join(filters, ' AND ');
        } 
        lstClient = Database.query(query);
        //System.debug('role from query >> '+lstClient[0].Participant_Staff_Associations__r[0].Role__c);
       // System.debug('first client details >> '+lstClient);
        return lstClient;   
    }
    @AuraEnabled(cacheable=true)
     public static list<Client__c> getClientById(Id recordId) {
        list<Client__c> clientRecords= [SELECT id,Name__c,Facility__r.Name,AddressData__c,Organization_Name__c,Picture__c,name,First_Name__c,Last_Name__c,Facility__c,Status__c,Contact_Number__c,address__Street__s,address__City__s,address__StateCode__s,Address__CountryCode__s,Address__PostalCode__s,Facility__r.Organisation__c,Primay_Contact_First_Name__c,Primay_Contact_Last_Name__c,Secondary_Contact_First_Name__c,Secondary_Contact_Last_Name__c,Date_Of_Birth__c,Primary_Contact_Number__c,Secondary_Contact_Number__c,Gendar__c,Age__c,
                        NDIS_Participant_ID__c,Medicare_Card_ID__c,Passport_Details__c,Drivers_Licence__c,Photo_ID__c,State__c,Membership_Number__c,Insurance_Provider__c,Health_Concession_Cards__c,DVA_Card__c,Relationship__c,Primary_Email_ID__c,Secondary_Contact_Relationship__c,Secondary_Contact_Email_ID__C,(SELECT Id, Role__c FROM Participant_Staff_Associations__r ORDER BY CreatedDate DESC LIMIT 1)
                		FROM Client__c WHERE Id = :recordId   LIMIT 1];//WITH SECURITY_ENFORCED
         
        // SObjectAccessDecision decision = Security.stripInaccessible(AccessType.READABLE, clientRecords);
        //return (List<Client__c>) decision.getRecords();
       return clientRecords;
    }

    @AuraEnabled(cacheable=true)
     public static list<Client__c> getClientByEmail(String email) {
         System.debug('Email >> '+email);
        list<Client__c> clientRecords= [SELECT Id,Name__c,Facility__r.Name,AddressData__c,Organization_Name__c,Picture__c,name,First_Name__c,Last_Name__c,Facility__c,Status__c,Contact_Number__c,address__Street__s,address__City__s,address__StateCode__s,Address__CountryCode__s,Address__PostalCode__s,Facility__r.Organisation__c,Primay_Contact_First_Name__c,Primay_Contact_Last_Name__c,Secondary_Contact_First_Name__c,Secondary_Contact_Last_Name__c,Date_Of_Birth__c,Primary_Contact_Number__c,Secondary_Contact_Number__c,Gendar__c,Age__c,
                        NDIS_Participant_ID__c,Medicare_Card_ID__c,Passport_Details__c,Drivers_Licence__c,Photo_ID__c,State__c,Membership_Number__c,Insurance_Provider__c,Health_Concession_Cards__c,DVA_Card__c,Relationship__c,Primary_Email_ID__c,Secondary_Contact_Relationship__c,Secondary_Contact_Email_ID__c
                		FROM Client__c where Email__c=:email];
         System.debug('Records >>'+ clientRecords);
       return clientRecords;
    }
    
    @AuraEnabled
    public static void statusClient(String IdValue,String status){
        Client__c fact=new Client__c(Id=IdValue);
        fact.Status__c=Boolean.valueOf(status);
        Update fact;
    } 
    
    @AuraEnabled
    public static void insertStaffRecords(String clientId, String roleId, List<String> selectedStaff) {        
        List<Participant_Staff_Association__c> clientList =new List<Participant_Staff_Association__c>();
        system.debug('Client Id >> '+clientId);
        System.debug('Role ID >> ' + roleId);
        system.debug('Selected Staff >> '+selectedStaff); 
    
        for(string sid:selectedStaff)
        {
            Participant_Staff_Association__c client=new Participant_Staff_Association__c();
            client.Staff__c=sid;
            client.Participant__c=clientId; 
            client.Role__c = roleId; 
            clientList.add(client);
        }
        system.debug('assign staff list'+clientList);
       /* if(clientList.size()>0){
            insert clientList;             
        } */
        
        try {
            if (clientList.size() > 0) {
                Database.SaveResult[] saveResults = Database.insert(clientList, false);
                for (Database.SaveResult sr : saveResults) {
                    if (!sr.isSuccess()) {
                        // Handle failed records here (e.g., log errors)
                        for (Database.Error err : sr.getErrors()) {
                            System.debug('Error: ' + err.getMessage());
                        }
                    }
                }
            }
        } catch (System.LimitException e) {
            System.debug('Limit exception: ' + e.getMessage());
            throw new AuraHandledException('A limit exception occurred. Please contact your administrator.');
        }

    }
    
    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getStaffData(String clientId, String facilityId , String role) {
        
        System.debug('get Facility >' +facilityId);
        System.debug('get Role>' +role);
        System.debug('getStaffData >' +clientId);
        User objUser = [ SELECT Organization_Name__c FROM User WHERE Id = : UserInfo.getUserId() ];
        string orgID = [Select id from Organisation__c where name=:objUser.Organization_Name__c limit 1].Id;
        List<Map<String, Object>> staffData = new List<Map<String, Object>>();
        //List<Staff__c> staffList = [SELECT Id, Name FROM Staff__c where Facility__r.Organisation__c =:orgID AND Facility__c = :facilityId  AND Role__c INCLUDES (:role) ];
        String query = 'SELECT Id, Name,Last_Name__c FROM Staff__c WHERE Facility__r.Organisation__c = :orgID';  
		
        // Apply filters based on facilityId and role
        if (facilityId != null && !String.isBlank(facilityId)) {
           query += ' AND Facility__c = :facilityId';
           System.debug('If facilityId >> '+query);
        }
        if (String.isNotBlank(role)) {
           query += ' AND Role__c INCLUDES (:role)';
           System.debug('If role >> '+query);
        }
        System.debug('Entire List Query >> '+query);
        
        List<Staff__c> staffList = Database.query(query);
        System.debug('staffList >> '+staffList);
        
        Set<Id> assignedStaffIds = new Set<Id>();
    
        // Fetch existing associations for the participant
        for (Participant_Staff_Association__c assoc : [
            SELECT Staff__c FROM Participant_Staff_Association__c WHERE Participant__c = :clientId
        ]) {
            assignedStaffIds.add(assoc.Staff__c);
        }
          System.debug('Assigned  Staff Ids' +assignedStaffIds);
        // Prepare the response with an 'isAssigned' flag
        for (Staff__c staff : staffList) {
            Map<String, Object> staffRecord = new Map<String, Object>();
            staffRecord.put('Id', staff.Id);
           // staffRecord.put('Name', staff.Name);
            staffRecord.put('Name', staff.Name + ' ' + staff.Last_Name__c);
            //staffRecord.put('Last Name', staff.Last_Name__c);
            staffRecord.put('isAssigned', assignedStaffIds.contains(staff.Id));
            staffData.add(staffRecord);
        }
        System.debug('Staff Data' +staffData);
        return staffData;
    } 
    
    @AuraEnabled
    public static void updateStaffAssignments(Id clientId, List<Id> staffIds,String roleId) {
        if (clientId == null || staffIds == null) {
            throw new AuraHandledException('Client ID and staff IDs are required.');
        }

        // Step 1: Query existing assignments
        List<Participant_Staff_Association__c> existingAssignments = [SELECT Id, Staff__c, Participant__c, Role__c  FROM Participant_Staff_Association__c
            WHERE Participant__c = :clientId];

        // Step 2: Create a set of current staff IDs from the existing assignments
        Set<Id> existingStaffIds = new Set<Id>();
        for (Participant_Staff_Association__c assignment : existingAssignments) {
            existingStaffIds.add(assignment.Staff__c);
        }

        // Step 3: Identify new assignments to be added
        List<Participant_Staff_Association__c> newAssignments = new List<Participant_Staff_Association__c>();
        for (Id staffId : staffIds) {
            if (!existingStaffIds.contains(staffId)) {
                newAssignments.add(new Participant_Staff_Association__c(
                    Participant__c = clientId,
                    Staff__c = staffId,
                    Role__c = roleId
                ));
            }
        }

        // Step 4: Identify assignments to be deleted
        List<Participant_Staff_Association__c> assignmentsToDelete = new List<Participant_Staff_Association__c>();
        for (Participant_Staff_Association__c assignment : existingAssignments) {
            if (!staffIds.contains(assignment.Staff__c)) {
                assignmentsToDelete.add(assignment);
            }
        }

        // Step 5: Perform DML operations
        if (!newAssignments.isEmpty()) {
            insert newAssignments;
        }
        if (!assignmentsToDelete.isEmpty()) {
            delete assignmentsToDelete;
        }
    }

	
}