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
            //filters.add('First_Name__c Like : fname');
            filters.add('(First_Name__c LIKE :fname OR First_Name__c = NULL)');
        }
        if(lastname !=NULL){
            string lname=lastname+'%';
           // filters.add('Last_Name__c Like : lname');
           filters.add('(Last_Name__c LIKE :lname OR Last_Name__c = NULL)');
           
        }
        filters.add('Organization_Name__c = : trucatedStr');
        
        String query= 'SELECT id,Name__c,Facility__r.Name,AddressData__c,Facility__r.Type_of_Service__c,ParticipantType__c,Facility__r.Status__c,Company__c,Organization_Name__c,Picture__c,name,First_Name__c,Last_Name__c,Facility__c,Status__c,Contact_Number__c,address__Street__s,address__City__s,address__StateCode__s,Address__CountryCode__s,Address__PostalCode__s,Facility__r.Organisation__c,Participant_Status__c FROM Client__c';
        if(filters.size() > 0) {
            query += ' WHERE ' + String.join(filters, ' AND ');
        } 
        lstClient = Database.query(query);
        //System.debug('role from query >> '+lstClient[0].Participant_Staff_Associations__r[0].Role__c);
        // System.debug('first client details >> '+lstClient);
        return lstClient;   
    }
    
     @AuraEnabled
    public static list<Client__c> fetchFacilitiessforissueregister(string recordId,String firstname,String lastname, String facilityid){ 
        list<Client__c> lstClient = new list<Client__c>();
        System.debug('Participant firstname '+firstname);
        System.debug('Participant lastname '+lastname);        
        System.debug('recordId '+recordId);
        String trucatedStr = recordId.substring(0,15);
        String[] filters = new String[0];
        if(firstname !=NULL){
            string fname=firstname+'%';
            //filters.add('First_Name__c Like : fname');
            filters.add('(First_Name__c LIKE :fname OR First_Name__c = NULL)');
        }
        if(lastname !=NULL){
            string lname=lastname+'%';
           // filters.add('Last_Name__c Like : lname');
           filters.add('(Last_Name__c LIKE :lname OR Last_Name__c = NULL)');
           
        }
        filters.add('Organization_Name__c = : trucatedStr');
            
        if (facilityid != null) {
            filters.add('Facility__c = :facilityid');
        }
         
        filters.add('Status__c = TRUE');
        
        String query= 'SELECT id,Name__c,Facility__r.Name,AddressData__c,Facility__r.Type_of_Service__c,ParticipantType__c,Facility__r.Status__c,Company__c,Organization_Name__c,Picture__c,name,First_Name__c,Last_Name__c,Facility__c,Status__c,Contact_Number__c,address__Street__s,address__City__s,address__StateCode__s,Address__CountryCode__s,Address__PostalCode__s,Facility__r.Organisation__c,Participant_Status__c FROM Client__c';
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
        list<Client__c> clientRecords= [SELECT id,Name__c,Facility__r.Type_of_Service__c,Facility__r.Name,AddressData__c,Preferred_Languages__c,Preferred_Nationality__c,Organization_Name__c,Picture__c,name,First_Name__c,Last_Name__c,Facility__c,Status__c,Contact_Number__c,address__Street__s,address__City__s,address__StateCode__s,Address__CountryCode__s,Address__PostalCode__s,Facility__r.Organisation__c,Primay_Contact_First_Name__c,Primay_Contact_Last_Name__c,Secondary_Contact_First_Name__c,Secondary_Contact_Last_Name__c,Date_Of_Birth__c,Primary_Contact_Number__c,Secondary_Contact_Number__c,Gendar__c,Age__c,
                                        NDIS_Participant_ID__c,Medicare_Card_ID__c,Passport_Details__c,Drivers_Licence__c,Photo_ID__c,State__c,Membership_Number__c,Insurance_Provider__c,Health_Concession_Cards__c,DVA_Card__c,Relationship__c,Primary_Email_ID__c,Secondary_Contact_Relationship__c,Secondary_Contact_Email_ID__C,(SELECT Id,Role__c FROM Participant_Staff_Associations__r ORDER BY CreatedDate DESC LIMIT 1)
                                        FROM Client__c WHERE Id = :recordId   LIMIT 1];//WITH SECURITY_ENFORCED
        
        // SObjectAccessDecision decision = Security.stripInaccessible(AccessType.READABLE, clientRecords);
        //return (List<Client__c>) decision.getRecords();
        return clientRecords;
    }
    
    @AuraEnabled(cacheable=true)
    public static list<Client__c> getClientByEmail(String email) {
        System.debug('Email >> '+email);
        list<Client__c> clientRecords= [SELECT Id,Name__c,Facility__r.Name,Facility__r.Type_of_Service__c,ParticipantType__c,AddressData__c,Organization_Name__c,Picture__c,name,First_Name__c,Last_Name__c,Facility__c,Status__c,Contact_Number__c,address__Street__s,address__City__s,address__StateCode__s,Address__CountryCode__s,Address__PostalCode__s,Facility__r.Organisation__c,Primay_Contact_First_Name__c,Primay_Contact_Last_Name__c,Secondary_Contact_First_Name__c,Secondary_Contact_Last_Name__c,Date_Of_Birth__c,Primary_Contact_Number__c,Secondary_Contact_Number__c,Gendar__c,Age__c,
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
    public static List<Map<String, Object>> getStaffData(String clientId, String facilityId, String role) {
        System.debug('get Facility > ' + facilityId);
        System.debug('get Role > ' + role);
        System.debug('getStaffData > ' + clientId);
        
        User objUser = [SELECT Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];
        String orgID = [SELECT Id FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1].Id;
        
        List<Map<String, Object>> staffData = new List<Map<String, Object>>();
        String query = 'SELECT Id, Name, Last_Name__c,Display_Nickname__c FROM Staff__c WHERE Facility__r.Organisation__c = :orgID';
        
        if (String.isNotBlank(facilityId)) {
            query += ' AND Facility__c = :facilityId';
        }
        if (String.isNotBlank(role)) {
            query += ' AND Role__c = :role';
        }   
        
        System.debug('Entire List Query >> ' + query);
        List<Staff__c> staffList = Database.query(query);
        System.debug('staffList >> ' + staffList);
        
        Set<Id> assignedStaffIds = new Set<Id>();
        
        // Only query assigned staff if clientId is provided
        if (String.isNotBlank(clientId)) {
            for (Participant_Staff_Association__c assoc : [
                SELECT Staff__c FROM Participant_Staff_Association__c 
                WHERE Participant__c = :clientId  AND Role__c = :role 
            ]) {
                assignedStaffIds.add(assoc.Staff__c);
            }
            System.debug('Assigned Staff Ids >> ' + assignedStaffIds);
        }
        
        // Prepare the response
        for (Staff__c staff : staffList) {
            Map<String, Object> staffRecord = new Map<String, Object>();
            staffRecord.put('Id', staff.Id);
            staffRecord.put('Name', staff.Name + ' ' + staff.Last_Name__c);
            
            // Only include isAssigned flag if clientId is provided
            if (String.isNotBlank(clientId)) {
                staffRecord.put('isAssigned', assignedStaffIds.contains(staff.Id));
            }
            
            staffData.add(staffRecord);
        }
        
        System.debug('Staff Data >> ' + staffData);
        return staffData;
    }
    
    // Wrapper class to handle complex LWC structure
    public class StaffAssignmentWrapper {
        @AuraEnabled public String Id;
        @AuraEnabled public String Name;
        @AuraEnabled public Map<String, Object> roleAssignments;
        @AuraEnabled public String rowClass;
    }
    
    @AuraEnabled
    public static void updateStaffAssignments(Id clientId, String assignmentsJSON) {
        System.debug('=== Method: updateStaffAssignments START ===');
        System.debug('Client ID received: ' + clientId);
        System.debug('Raw assignments JSON: ' + assignmentsJSON);
        
        /*if (clientId == null || String.isBlank(assignmentsJSON)) {
            throw new AuraHandledException('Client ID and assignments are required.');
        }*/
        
        List<Object> rawList = (List<Object>) JSON.deserializeUntyped(assignmentsJSON);
        List<StaffAssignmentWrapper> assignments = new List<StaffAssignmentWrapper>();
        Set<Id> staffIds = new Set<Id>();
        
        for (Object obj : rawList) {
            Map<String, Object> item = (Map<String, Object>) obj;
            StaffAssignmentWrapper wrapper = new StaffAssignmentWrapper();
            
            wrapper.Id = (String)item.get('Id');
            wrapper.Name = (String)item.get('Name');
            wrapper.rowClass = (String)item.get('rowClass');
            
            if (!String.isBlank(wrapper.Id)) {
                staffIds.add(wrapper.Id);
            }
            
            if (item.containsKey('roleAssignments') && item.get('roleAssignments') != null) {
                wrapper.roleAssignments = (Map<String, Object>) item.get('roleAssignments');
            }
            
            assignments.add(wrapper);
            
            System.debug('--- Parsed Wrapper ---');
            System.debug('Staff ID: ' + wrapper.Id);
            System.debug('Name: ' + wrapper.Name);
            System.debug('Row Class: ' + wrapper.rowClass);
            System.debug('Role Assignments: ' + JSON.serialize(wrapper.roleAssignments));
        }
        
        System.debug('Deserialized assignments count: ' + assignments.size());
        System.debug('Collected Staff IDs: ' + staffIds);
        
        // Query existing PSA records
        List<Participant_Staff_Association__c> psaList = [
            SELECT Id,Role__c,Participant__c, Staff__c, Active__c
            FROM Participant_Staff_Association__c
            WHERE Participant__c = :clientId AND Staff__c IN :staffIds
        ]; 
        
        System.debug('Queried existing PSA records count: ' + psaList.size());
        
        Map<String, Participant_Staff_Association__c> psaKeyMap = new Map<String, Participant_Staff_Association__c>();
         for (Participant_Staff_Association__c psa : psaList) {
            String key = psa.Staff__c + '|' + psa.Role__c;
            psaKeyMap.put(key, psa);
        } 
        
        List<Participant_Staff_Association__c> psaToUpsert = new List<Participant_Staff_Association__c>();
        
        for (StaffAssignmentWrapper wrapper : assignments) {
            if (wrapper.roleAssignments == null) continue;
            
            System.debug('--- Processing Staff: ' + wrapper.Id + ' ---');
            
            for (String roleName : wrapper.roleAssignments.keySet()) {
                Object valueObj = wrapper.roleAssignments.get(roleName);
                Boolean isActive = valueObj != null && Boolean.valueOf(String.valueOf(valueObj));
                String key = wrapper.Id + '|' + roleName;
                
                System.debug('Processing Role: ' + roleName + ' | Active: ' + isActive);
                
                if (psaKeyMap.containsKey(key)) {
                    // Update existing
                    Participant_Staff_Association__c psa = psaKeyMap.get(key);
                    System.debug('Found existing PSA for update. Id: ' + psa.Id);
                    psa.Active__c = isActive;
                    psaToUpsert.add(psa);
                    System.debug('Updating PSA: ' + psa.Id + ' | Role: ' + roleName + ' | Active__c: ' + isActive);
                } else {
                    // Insert new
                    Participant_Staff_Association__c newPSA = new Participant_Staff_Association__c();
                    newPSA.Participant__c = clientId;
                    newPSA.Staff__c = wrapper.Id;
                    newPSA.Role__c = roleName;
                    newPSA.Active__c = isActive;
                    
                    psaToUpsert.add(newPSA);
                    System.debug('Inserting new PSA: Staff = ' + wrapper.Id + ' | Role = ' + roleName + ' | Is_Active__c = ' + isActive);
                }
            }
        }
        
        if (!psaToUpsert.isEmpty()) {
            upsert psaToUpsert;
            System.debug('Upserted PSA count: ' + psaToUpsert.size());
        } else {
            System.debug('No PSA records to insert or update.');
        }
        
        System.debug('=== Method: updateStaffAssignments END ===');
    }
    
    
    /*@AuraEnabled
public static void updateStaffAssignments(Id clientId, String assignmentsJSON) {
System.debug('Client ID received: ' + clientId);
System.debug('Raw assignments JSON: ' + assignmentsJSON);

if (clientId == null || String.isBlank(assignmentsJSON)) {
throw new AuraHandledException('Client ID and assignments are required.');
}

// Deserialize to generic list
List<Object> rawList = (List<Object>) JSON.deserializeUntyped(assignmentsJSON);
List<StaffAssignmentWrapper> assignments = new List<StaffAssignmentWrapper>();

for (Object obj : rawList) {
Map<String, Object> item = (Map<String, Object>) obj;
StaffAssignmentWrapper wrapper = new StaffAssignmentWrapper();

wrapper.Id = (String)item.get('Id');
wrapper.Name = (String)item.get('Name');
wrapper.rowClass = (String)item.get('rowClass');

// roleAssignments is itself a nested map
if (item.containsKey('roleAssignments') && item.get('roleAssignments') != null) {
wrapper.roleAssignments = (Map<String, Object>) item.get('roleAssignments');
}

assignments.add(wrapper);
}

System.debug('Deserialized assignments count: ' + assignments.size());

for (StaffAssignmentWrapper wrapper : assignments) {
System.debug('----------------------------------------');
System.debug('Staff ID: ' + wrapper.Id);
System.debug('Name: ' + wrapper.Name);
System.debug('Row Class: ' + wrapper.rowClass);
System.debug('Role Assignments: ' + JSON.serialize(wrapper.roleAssignments));
}
}*/
    
    /* @AuraEnabled(cacheable=false)
public static Risk_Management__c getParticipantJournal(Id clientId) {        

// Try to get Extreme risk
List<Risk_Management__c> extremeList = [
SELECT Id, Risk_Index__c, Participant__c, Participant__r.Name__c, Participant__r.Current_Availability__c, 
Participant__r.Medications__c, Participant__r.Allergies__c, 
Participant__r.Notes__c, Participant__r.Unavailable_Date__c
FROM Risk_Management__c
WHERE Participant__c = :clientId AND Risk_Index__c = 'Extreme'
LIMIT 1
];

if (!extremeList.isEmpty()) {
return extremeList[0];
}

// Try to get Medium risk
List<Risk_Management__c> mediumList = [
SELECT Id, Risk_Index__c, Participant__c, Participant__r.Name__c, Participant__r.Current_Availability__c, 
Participant__r.Medications__c, Participant__r.Allergies__c, 
Participant__r.Notes__c, Participant__r.Unavailable_Date__c
FROM Risk_Management__c
WHERE Participant__c = :clientId AND Risk_Index__c = 'Medium'
LIMIT 1
];

if (!mediumList.isEmpty()) {
return mediumList[0];
}

// Default to Low risk
List<Risk_Management__c> lowList = [
SELECT Id, Risk_Index__c, Participant__c, Participant__r.Name__c, Participant__r.Current_Availability__c, 
Participant__r.Medications__c, Participant__r.Allergies__c, 
Participant__r.Notes__c, Participant__r.Unavailable_Date__c
FROM Risk_Management__c
WHERE Participant__c = :clientId AND Risk_Index__c = 'Low'
LIMIT 1
];

if (!lowList.isEmpty()) {
return lowList[0];
}

// If no records found at all
return null;
} */
    
    public class ParticipantJournalWrapper {
        @AuraEnabled public Client__c client;
        @AuraEnabled public Risk_Management__c riskRecord;
    }
    
    
    @AuraEnabled(cacheable=false)
    public static ParticipantJournalWrapper getParticipantJournal(Id clientId) {
        try {
            ParticipantJournalWrapper result = new ParticipantJournalWrapper();
            
            // Query the client with related risks
            Client__c clientWithRisks = [
                SELECT Id, Name__c, Medications__c, Allergies__c, Notes__c,
                Unavailable_Date__c, Current_Availability__c,
                (SELECT Id, Risk_Index__c, Participant__c
                 FROM Risk_Managements__r)
                FROM Client__c
                WHERE Id = :clientId
                LIMIT 1
            ];
            
            result.client = clientWithRisks;
            
            // Extract the risks and prioritize
            List<Risk_Management__c> risks = clientWithRisks.Risk_Managements__r;
            
            for (Risk_Management__c risk : risks) {
                if (risk.Risk_Index__c == 'Extreme') {
                    result.riskRecord = risk;
                    break;
                } else if (risk.Risk_Index__c == 'High' && result.riskRecord == null) {
                    result.riskRecord = risk;
                } else if (risk.Risk_Index__c == 'Low' && result.riskRecord == null) {
                    result.riskRecord = risk;
                }
                else if (risk.Risk_Index__c == 'Medium' && result.riskRecord == null) {
                    result.riskRecord = risk;
                }
            }
            
            return result;
            
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching participant journal: ' + e.getMessage());
        }
    }
    
    
    @AuraEnabled(cacheable=true)
    public static Client__c getParticipantdetails(Id clientId) {
        try {
            System.debug('Input clientId: ' + clientId);
            
            Client__c clientRecord = [
                SELECT Id,
                Name__c,
                Medications__c,
                Allergies__c,
                Notes__c,
                Unavailable_Date__c,
                Current_Availability__c,
                Address__Street__s,
                Address__City__s,
                Address__CountryCode__s,
                Address__StateCode__s,
                Address__PostalCode__s,
                Facility__r.Id,
                Facility__r.Name,
                Facility__r.Address__Street__s,
                Facility__r.Address__City__s,
                Facility__r.Address__CountryCode__s,
                Facility__r.Address__StateCode__s,
                Facility__r.Address__PostalCode__s
                FROM Client__c
                WHERE Id = :clientId
                LIMIT 1
            ];            
            return clientRecord;
            
        } catch (Exception e) {
            System.debug('Exception in getParticipantdetails: ' + e.getMessage());
            throw new AuraHandledException('Error fetching participant details: ' + e.getMessage());
        }
    }
    
    
    
    @AuraEnabled
    public static void saveStatusData(Boolean isAvailable, Boolean isUnavailable, Id clientId, String medications, String allergies, String notes, date unavailableDate) {
        try {
            Client__c client = [SELECT Id, Current_Availability__c,Medications__c,Allergies__c,Notes__c,Unavailable_Date__c FROM Client__c WHERE Id = :clientId LIMIT 1];
            
            // Set field values
            String availablepicklist;
            if(isAvailable == true){
                availablepicklist = 'Available';
            } else if(isUnavailable = true){
                availablepicklist = 'Unavailable';
            }
            client.Current_Availability__c = availablepicklist;
            client.Medications__c = medications;
            client.Allergies__c = allergies;
            client.Notes__c = notes;
            client.Unavailable_Date__c = unavailableDate;        
            
            update client;
            
            System.debug('Client updated: ' + client);
        } catch (Exception e) {
            System.debug('Error updating client: ' + e.getMessage());
            throw new AuraHandledException('Error updating client: ' + e.getMessage());
        }
    } 
   
    @AuraEnabled
    public static Map<String, Object> createClientsOnBulk(String templateType, List<Map<String, String>> records, String facilityId) {
        Map<String, Object> response = new Map<String, Object>();
        List<Map<String, String>> successRecords = new List<Map<String, String>>();
        List<Map<String, String>> failedRecords = new List<Map<String, String>>();
    
        try {
            List<Client__c> recordsToInsert = new List<Client__c>();
    
            for (Map<String, String> recordMap : records) {
                try {
                    Client__c client = new Client__c();
                    client.Facility__c = facilityId;
    				String firstName = recordMap.get('FirstName');
                    String lastName  = recordMap.get('LastName');
                    
                    String inputState = (String)recordMap.get('AddressState');
                    String stateCode;
                    
                    // Normalize input (make it lowercase and trim spaces)
                    if (inputState != null) {
                        inputState = inputState.toLowerCase().trim();
                    }
                    
                    // Default to null or the raw input if not found
                    if (String.isNotBlank(inputState)) {
                        if (inputState.contains('new south wales') || inputState.contains('nsw')) {
                            stateCode = 'NSW';
                        } else if (inputState.contains('victoria') || inputState.contains('vic')) {
                            stateCode = 'VIC';
                        } else if (inputState.contains('queensland') || inputState.contains('qld')) {
                            stateCode = 'QLD';
                        } else if (inputState.contains('western') || inputState.contains('wa')) {
                            stateCode = 'WA';
                        } else if (inputState.contains('south australia') || inputState.contains('sa')) {
                            stateCode = 'SA';
                        } else if (inputState.contains('tasmania') || inputState.contains('tas')) {
                            stateCode = 'TAS';
                        } else if (inputState.contains('australian capital') || inputState.contains('act')) {
                            stateCode = 'ACT';
                        } else if (inputState.contains('northern') || inputState.contains('nt')) {
                            stateCode = 'NT';
                        } else {
                            stateCode = inputState; // fallback to raw input if no match
                        }
                    }
                    
                    // Assign to your record
                    client.Address__StateCode__s = stateCode;

                    if (templateType == 'Client') {
                       
                        client.Name = firstName + ' ' + lastName;
                        client.First_Name__c = firstName;
                        client.Last_Name__c = lastName;
                        client.Gendar__c = recordMap.get('Gender');
                        client.Email__c = recordMap.get('EmailID');
                        client.Contact_Number__c = recordMap.get('ContactNumber');
                        client.Date_Of_Birth__c = parseDDMMYYYY(recordMap.get('DateofBirth'));
                        client.Address__Street__s = recordMap.get('AddressStreet');
                        client.Address__City__s = recordMap.get('AddressCity');
                       // client.Address__StateCode__s = recordMap.get('AddressState');
                        
                        client.Address__PostalCode__s = recordMap.get('AdressPostCode');
                        //client.Address__CountryCode__s = recordMap.get('AddressCountry');
                        client.Address__CountryCode__s = 'AU';
                        client.ParticipantType__c = '';
                        client.Status__c = TRUE;
    
                    } else if (templateType == 'Company') {
                        client.Name = recordMap.get('CompanyName');
                        client.Company__c = recordMap.get('CompanyName');
                        client.Start_Date__c = parseDDMMYYYY(recordMap.get('StartDate'));
                        client.Email__c = recordMap.get('EmailID');
                        client.Contact_Number__c = recordMap.get('ContactNumber');
                        client.Address__Street__s = recordMap.get('AddressStreet');
                        client.Address__City__s = recordMap.get('AddressCity');
                        //client.Address__StateCode__s = recordMap.get('AddressState');
                        client.Address__PostalCode__s = recordMap.get('AdressPostCode');
                        //client.Address__CountryCode__s = recordMap.get('AddressCountry');
                        client.Address__CountryCode__s = 'AU';
                        client.ParticipantType__c = 'Company';
                        client.Status__c = TRUE;
    
                    } else if (templateType == 'Individual') {
                        //client.Name = recordMap.get('FirstName');
                        //client.First_Name__c = recordMap.get('FirstName');
                        //client.Last_Name__c = recordMap.get('LastName');
                        client.Name = firstName + ' ' + lastName;
                        client.First_Name__c = firstName;
                        client.Last_Name__c = lastName;
                        client.Gendar__c = recordMap.get('Gender');
                        client.Email__c = recordMap.get('EmailID');
                        client.Contact_Number__c = recordMap.get('ContactNumber');
                        client.Date_Of_Birth__c = parseDDMMYYYY(recordMap.get('DateofBirth'));
                        client.Address__Street__s = recordMap.get('AddressStreet');
                        client.Address__City__s = recordMap.get('AddressCity');
                       // client.Address__StateCode__s = recordMap.get('AddressState');
                        client.Address__PostalCode__s = recordMap.get('AdressPostCode');
                        //client.Address__CountryCode__s = recordMap.get('AddressCountry');
                        client.Address__CountryCode__s = 'AU';
                        client.ParticipantType__c = 'Individual';
                        client.Status__c = TRUE;
    
                    } else {
                        throw new AuraHandledException('Unknown template type: ' + templateType);
                    }
    
                    recordsToInsert.add(client);
    
                } catch (Exception e) {
                    recordMap.put('ErrorMessage', e.getMessage());
                    failedRecords.add(recordMap);
                }
            }
    
            if (!recordsToInsert.isEmpty()) {
                try {
                    insert recordsToInsert;
                    // Mark all inserted records as success
                    for (Client__c c : recordsToInsert) {
                        Map<String, String> successMap = new Map<String, String>();
                        if (templateType == 'Client' || templateType == 'Individual') {
                            successMap.put('EmailID', c.Email__c);
                        } else if (templateType == 'Company') {
                            successMap.put('CompanyName', c.Name);
                        }
                        successRecords.add(successMap);
                    }
                } catch (DmlException de) {
                    // Handle partial successes
                    for (Integer i = 0; i < recordsToInsert.size(); i++) {
                        try {
                            insert recordsToInsert[i];
                            Map<String, String> successMap = new Map<String, String>();
                            if (templateType == 'Client' || templateType == 'Individual') {
                                successMap.put('EmailID', recordsToInsert[i].Email__c);
                            } else if (templateType == 'Company') {
                                successMap.put('CompanyName', recordsToInsert[i].Name);
                            }
                            successRecords.add(successMap);
                        } catch (Exception ex) {
                            Map<String, String> failedMap = new Map<String, String>();
                            failedMap.putAll(records.get(i));
                            failedMap.put('ErrorMessage', ex.getMessage());
                            failedRecords.add(failedMap);
                        }
                    }
                }
            }
    
            response.put('successRecords', successRecords);
            response.put('failedRecords', failedRecords);
    
        } catch (Exception ex) {
            throw new AuraHandledException('Error processing records: ' + ex.getMessage());
        }
    
        return response;
    }


      public static Date parseDDMMYYYY(String input) {
        List<String> parts = input.split('/');
        if (parts.size() != 3) return null;
        return Date.newInstance(
            Integer.valueOf(parts[2]), // year
            Integer.valueOf(parts[1]), // month
            Integer.valueOf(parts[0])  // day
        );
    }    
}