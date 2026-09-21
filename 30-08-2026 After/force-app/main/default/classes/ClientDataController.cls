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
        
        String query= 'SELECT id,Participant_UID__c,Name__c,Facility__r.Name,AddressData__c,Prefer_Nickname__c,Display_Nickname__c,Facility__r.Type_of_Service__c,ParticipantType__c,Facility__r.Status__c,Company__c,Organization_Name__c,Picture__c,name,First_Name__c,Last_Name__c,Facility__c,Status__c,Contact_Number__c,address__Street__s,address__City__s,address__StateCode__s,Address__CountryCode__s,Address__PostalCode__s,Facility__r.Organisation__c,Participant_Status__c,(Select  Id,Facility__c,Facility__r.Name, Active__c,Participant__c from Participant_Facilities__r WHERE Active__c = true )  FROM Client__c';
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
        
        String query= 'SELECT id,Participant_UID__c,Name__c,Facility__r.Name,AddressData__c,Facility__r.Type_of_Service__c,Prefer_Nickname__c,Display_Nickname__c,ParticipantType__c,Facility__r.Status__c,Company__c,Organization_Name__c,Picture__c,name,First_Name__c,Last_Name__c,Facility__c,Status__c,Contact_Number__c,address__Street__s,address__City__s,address__StateCode__s,Address__CountryCode__s,Address__PostalCode__s,Facility__r.Organisation__c,Participant_Status__c FROM Client__c';
        if(filters.size() > 0) {
            query += ' WHERE ' + String.join(filters, ' AND ');
        } 
        lstClient = Database.query(query);
        //System.debug('role from query >> '+lstClient[0].Participant_Staff_Associations__r[0].Role__c);
        // System.debug('first client details >> '+lstClient);
        return lstClient;   
    }
    @AuraEnabled(cacheable=true)
    // public static List<Client__c> getClientById(Id recordId) {
    public static List<Client__c> getClientById(String recordId) {
        Id validId;
        try {
            validId = (Id) recordId;
        } catch (Exception e) {
            validId = null;
        }    

        List<Client__c> clientRecords = [
            SELECT Id,
                Participant_UID__c,
                Name__c,
                Facility__r.Type_of_Service__c,
                Facility__r.Name,
                AddressData__c,
                Preferred_Languages__c,
                Preferred_Nationality__c,
                Organization_Name__c,
                Picture__c,
                Name,
                First_Name__c,
                Last_Name__c,
                Facility__c,
                Status__c,
                Preferred_Gender__c,
                Contact_Number__c,
                Address__Street__s,
                Address__City__s,
                Address__StateCode__s,
                Address__CountryCode__s,
                Address__PostalCode__s,
                Facility__r.Organisation__c,
                Primay_Contact_First_Name__c,
                Primay_Contact_Last_Name__c,
                Secondary_Contact_First_Name__c,
                Secondary_Contact_Last_Name__c,
                Date_Of_Birth__c,
                Primary_Contact_Number__c,
                Secondary_Contact_Number__c,
                Gendar__c,
                Age__c,
                NDIS_Participant_ID__c,
                Medicare_Card_ID__c,
                Passport_Details__c,
                Drivers_Licence__c,
                Photo_ID__c,
                State__c,
                Membership_Number__c,
                Insurance_Provider__c,
                Health_Concession_Cards__c,
                DVA_Card__c,
                Relationship__c,
                Primary_Email_ID__c,
                Secondary_Contact_Relationship__c,
                Secondary_Contact_Email_ID__c,
                Type_of_Participant__c,
                ParticipantType__c,
            	CRN__c,
            	IRN__c,
            	Expiry_Date__c,My_Aged_Care_ID__c,
                Client_with_User__c,
                // ⭐ Existing child relationship
                (SELECT Id, Role__c
                    FROM Participant_Staff_Associations__r
                    ORDER BY CreatedDate DESC
                    LIMIT 1),
                     (SELECT Id, Facility__c,Participant__c,Facility__r.Name
                    FROM Participant_Facilities__r where Active__c =true ),

                // ⭐ NEW: Participant Contacts child records
                (SELECT Id,
                        First_Name__c,
                        Last_Name__c,
                        Email__c,
                        Contact_Type__c,
                        Contact_Number__c,
                        Notify__c
                    FROM Participant_Contacts__r)   // <-- Use your actual Child Relationship Name here

            FROM Client__c
            // WHERE Id = :recordId
            WHERE (Id = :validId OR Participant_UID__c = :recordId)
            LIMIT 1
        ];

        return clientRecords;
    }

    
    @AuraEnabled(cacheable=true)
    public static list<Client__c> getClientByEmail(String email) {
        System.debug('Email >> '+email);
        list<Client__c> clientRecords= [SELECT Id,Participant_UID__c,Name__c,Facility__r.Name,Facility__r.Type_of_Service__c,ParticipantType__c,AddressData__c,Organization_Name__c,Picture__c,name,First_Name__c,Last_Name__c,Facility__c,Status__c,Contact_Number__c,address__Street__s,address__City__s,address__StateCode__s,Address__CountryCode__s,Address__PostalCode__s,Facility__r.Organisation__c,Primay_Contact_First_Name__c,Primay_Contact_Last_Name__c,Secondary_Contact_First_Name__c,Secondary_Contact_Last_Name__c,Date_Of_Birth__c,Primary_Contact_Number__c,Secondary_Contact_Number__c,Gendar__c,Age__c,
                                        NDIS_Participant_ID__c,Medicare_Card_ID__c,Passport_Details__c,Drivers_Licence__c,Photo_ID__c,State__c,Membership_Number__c,Insurance_Provider__c,Health_Concession_Cards__c,DVA_Card__c,Relationship__c,Primary_Email_ID__c,Secondary_Contact_Relationship__c,Secondary_Contact_Email_ID__c,CRN__c,IRN__c,Expiry_Date__c
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
    public static List<Services_and_Support_Plan__c> checkFutureServices(Id clientId) {
    
        List<Services_and_Support_Plan__c> shifts = [
            SELECT Date_of_Service__c, Status__c
            FROM Services_and_Support_Plan__c
            WHERE Client__c = :clientId
            AND Date_of_Service__c >= :Date.today()
            AND Status__c != 'Draft' AND Un_Assigned_Service__c =false 
        ];
    
        return shifts;
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

    /*
    @AuraEnabled(cacheable=false)
    public static void updateParticipantContacts(Id clientId, String contactData) {

        System.debug('▶️ Entering updateParticipantContacts');
        System.debug('🟦 clientId: ' + clientId);
        System.debug('🟦 raw contactData JSON: ' + contactData);

        List<Object> rawList = (List<Object>) JSON.deserializeUntyped(contactData);
        System.debug('🟩 Parsed JSON (rawList): ' + rawList);

        List<Map<String, Object>> Participantcontacts = new List<Map<String, Object>>();

        for (Object obj : rawList) {
            Participantcontacts.add((Map<String, Object>) obj);
        }
        System.debug('🟩 Participantcontacts after casting: ' + Participantcontacts);

        List<Participant_Contact__c> contactListToUpsert = new List<Participant_Contact__c>();

        for (Map<String, Object> row : Participantcontacts) {

            System.debug('🔹 Processing row: ' + row);

            if (row.get('contactType') != null && row.get('contactType') != '') {

                Participant_Contact__c c = new Participant_Contact__c();

                // ⭐ Assign Id if coming from LWC (update scenario)
                if (row.containsKey('id') && row.get('id') != null && String.valueOf(row.get('id')).length() == 18)  {
                    c.Id = (String)row.get('id');
                    System.debug('✳️ Existing record detected — Id assigned: ' + c.Id);
                } else {
                    System.debug('🆕 New record (no Id provided)');
                }

                c.First_Name__c   = (String)row.get('firstName');
                c.Last_Name__c    = (String)row.get('lastName');
                c.Email__c        = (String)row.get('email');
                c.Contact_Type__c = (String)row.get('contactType');
                c.Contact_Number__c = (String)row.get('contactNumber');
                c.Notify__c = (Boolean)row.get('notify');
                c.Participant__c  = clientId;

                System.debug('➡️ Prepared Participant_Contact__c record: ' + c);

                contactListToUpsert.add(c);
            } else {
                System.debug('⚠️ Skipped row (missing contactType): ' + row);
            }
        }

        System.debug('🟧 Final contactListToUpsert: ' + contactListToUpsert);

        if (!contactListToUpsert.isEmpty()) {
            System.debug('🚀 Performing UPSERT on ' + contactListToUpsert.size() + ' records...');
            upsert contactListToUpsert;
            System.debug('✅ Upsert completed successfully.');
        } else {
            System.debug('⚠️ No records to upsert.');
        }

        System.debug('🏁 Exiting updateParticipantContacts');
    }
    */

@AuraEnabled(cacheable=false)
public static List<Id> updateParticipantContacts(
    Id clientId,
    String contactData
) {

    System.debug('▶️ Entering updateParticipantContacts');
    System.debug('🟦 clientId: ' + clientId);
    System.debug('🟦 raw contactData JSON: ' + contactData);

    List<Object> rawList =
        (List<Object>) JSON.deserializeUntyped(contactData);

    System.debug('🟩 Parsed JSON (rawList): ' + rawList);

    List<Map<String, Object>> Participantcontacts =
        new List<Map<String, Object>>();

    for (Object obj : rawList) {

        Participantcontacts.add(
            (Map<String, Object>) obj
        );
    }

    System.debug(
        '🟩 Participantcontacts after casting: ' +
        Participantcontacts
    );

    List<Participant_Contact__c> contactListToUpsert =
        new List<Participant_Contact__c>();

    // ========================================
    // VALID ROWS
    // ========================================

    List<Map<String, Object>> validRows =
        new List<Map<String, Object>>();

    for (Map<String, Object> row : Participantcontacts) {

        System.debug('🔹 Processing row: ' + row);

        if (
            row.get('contactType') != null &&
            row.get('contactType') != ''
        ) {

            Participant_Contact__c c =
                new Participant_Contact__c();

            // ========================================
            // ID HANDLING
            // ========================================

            String contactId;

            if (
                row.containsKey('id') &&
                row.get('id') != null
            ) {

                contactId =
                    String.valueOf(row.get('id'));

            } else if (
                row.containsKey('Id') &&
                row.get('Id') != null
            ) {

                contactId =
                    String.valueOf(row.get('Id'));
            }

            // ========================================
            // EXISTING RECORD
            // ========================================

            if (
                contactId != null &&
                contactId.length() >= 15
            ) {

                c.Id = contactId;

                System.debug(
                    '✳️ Existing record detected — Id assigned: ' +
                    c.Id
                );

            } else {

                System.debug(
                    '🆕 New record (no Id provided)'
                );
            }

            // ========================================
            // FIELD MAPPING
            // ========================================

            c.First_Name__c =
                (String) row.get('firstName');

            c.Last_Name__c =
                (String) row.get('lastName');

            c.Email__c =
                (String) row.get('email');

            c.Contact_Type__c =
                (String) row.get('contactType');

            c.Contact_Number__c =
                (String) row.get('contactNumber');

            c.Notify__c =
                (Boolean) row.get('notify');

            c.Participant__c =
                clientId;

            System.debug(
                '➡️ Prepared Participant_Contact__c record: ' +
                c
            );

            contactListToUpsert.add(c);

            validRows.add(row);

        } else {

            System.debug(
                '⚠️ Skipped row (missing contactType): ' +
                row
            );
        }
    }

    System.debug(
        '🟧 Final contactListToUpsert: ' +
        contactListToUpsert
    );

    // ========================================
    // UPSERT CONTACTS
    // ========================================

    if (!contactListToUpsert.isEmpty()) {

        System.debug(
            '🚀 Performing UPSERT on ' +
            contactListToUpsert.size() +
            ' records...'
        );

        upsert contactListToUpsert;

        System.debug(
            '✅ Upsert completed successfully.'
        );

        // ========================================
        // STORE SAVED IDS
        // ========================================

        List<Id> savedContactIds =
            new List<Id>();

        for (
            Participant_Contact__c con :
            contactListToUpsert
        ) {

            savedContactIds.add(con.Id);
        }

        System.debug(
            '🟢 savedContactIds: ' +
            savedContactIds
        );

        // ========================================
        // ATTACHMENTS
        // ========================================

        List<Attachment__c> docsToInsert =
            new List<Attachment__c>();

        for (
            Integer i = 0;
            i < contactListToUpsert.size();
            i++
        ) {

            Participant_Contact__c savedContact =
                contactListToUpsert[i];

            Map<String, Object> row =
                validRows[i];

            System.debug(
                '📎 Processing attachments for contact: ' +
                savedContact.Id
            );

            if (
                row.containsKey('uploadedFiles') &&
                row.get('uploadedFiles') != null
            ) {

                List<Object> uploadedFiles =
                    (List<Object>) row.get('uploadedFiles');

                System.debug(
                    '📂 uploadedFiles: ' +
                    uploadedFiles
                );

                for (Object fileObj : uploadedFiles) {

                    Map<String, Object> fileMap =
                        (Map<String, Object>) fileObj;

                    // ========================================
                    // SKIP EXISTING ATTACHMENTS
                    // ========================================

                    if (
                        fileMap.containsKey('attachmentId') &&
                        fileMap.get('attachmentId') != null
                    ) {

                        System.debug(
                            '⏭ Existing attachment skipped'
                        );

                        continue;
                    }

                    // ========================================
                    // INSERT NEW ATTACHMENTS
                    // ========================================

                    Attachment__c doc =
                        new Attachment__c();

                    doc.Participant_Contact__c =
                        savedContact.Id;

                    doc.File_Name__c = 
                        (String) fileMap.get('fileName');

                    doc.Name =
                        (String) fileMap.get('attachmentName');

                    doc.Amazon_file_URL__c =
                        (String) fileMap.get('url');

                    doc.Key__c =
                        (String) fileMap.get('key');

                    doc.Type__c =
                        (String) fileMap.get('type');
                    
                    doc.Other_Comments__c =
                        (String) fileMap.get('otherComments');

                    // ========================================
                    // EXPIRY DATE
                    // ========================================

                    Object expiryDateObj =
                        fileMap.get('expiryDate');

                    if (expiryDateObj != null) {

                        String expiryDate =
                            String.valueOf(expiryDateObj).trim();

                        if (!String.isBlank(expiryDate)) {

                            try {

                                // Expected format:
                                // yyyy-MM-dd

                                doc.Expiry_Date__c =
                                    Date.valueOf(expiryDate);

                                System.debug(
                                    '✅ Expiry Date Saved: ' +
                                    doc.Expiry_Date__c
                                );

                            } catch (Exception e) {

                                System.debug(
                                    '❌ Invalid expiry date format: ' +
                                    expiryDate
                                );

                                System.debug(
                                    '❌ Exception: ' +
                                    e.getMessage()
                                );
                            }
                        }
                    }

                    doc.User__c = 
                        (String) fileMap.get('userId');

                    doc.Comments__c =
                        (String) fileMap.get('comments');

                    doc.Added_By__c = clientId;

                    docsToInsert.add(doc);

                    System.debug(
                        '📄 New Attachment Prepared: ' +
                        doc
                    );
                }
            }
        }

        // ========================================
        // INSERT ATTACHMENTS
        // ========================================

        if (!docsToInsert.isEmpty()) {

            System.debug(
                '🚀 Inserting Attachments: ' +
                docsToInsert.size()
            );

            insert docsToInsert;

            System.debug(
                '✅ Attachments inserted successfully'
            );

        } else {

            System.debug(
                '⚠️ No new attachments to insert.'
            );
        }

        System.debug(
            '🏁 Exiting updateParticipantContacts'
        );

        return savedContactIds;
    }

    System.debug('⚠️ No records to upsert.');

    return new List<Id>();
}

    public class ParticipantJournalWrapper {
        @AuraEnabled public Client__c client;
        @AuraEnabled public Risk_Management__c riskRecord;
    }
    
    
    @AuraEnabled(cacheable=false)
    // public static ParticipantJournalWrapper getParticipantJournal(Id clientId) {
    //     try {
    public static ParticipantJournalWrapper getParticipantJournal(String clientId) {
        try {
            Id validId;
            try {
                validId = (Id) clientId;
            } catch (Exception e) {
                validId = null;
            }    
            ParticipantJournalWrapper result = new ParticipantJournalWrapper();
            
            // Query the client with related risks
            Client__c clientWithRisks = [
                SELECT Id,Participant_UID__c,Display_Nickname__c, Name__c, Medications__c, Allergies__c, Notes__c,Unavailable_Start_Date__c,
                Unavailable_Date__c, Current_Availability__c,
                (SELECT Id, Risk_Index__c, Participant__c
                 FROM Risk_Managements__r)
                FROM Client__c
                // WHERE Id = :clientId
                WHERE (Id = :validId OR Participant_UID__c = :clientId)       
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
    // public static Client__c getParticipantdetails(Id clientId) {
    //     try {
    //         System.debug('Input clientId: ' + clientId);
            
    public static Client__c getParticipantdetails(String clientId) {
        try {
            System.debug('Input clientId: ' + clientId);
            Id validId;
            try {
                validId = (Id) clientId;
            } catch (Exception e) {
                validId = null;
            }    
            Client__c clientRecord = [
                SELECT Id,
                Participant_UID__c,
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
                // WHERE Id = :clientId
                WHERE (Id = :validId OR Participant_UID__c = :clientId)                
                LIMIT 1
            ];            
            return clientRecord;
            
        } catch (Exception e) {
            System.debug('Exception in getParticipantdetails: ' + e.getMessage());
            throw new AuraHandledException('Error fetching participant details: ' + e.getMessage());
        }
    }
    
    
    
    @AuraEnabled
        public static void saveStatusData( Boolean isAvailable,Boolean isUnavailable, Id clientId, String medications, String allergies, String notes, Date unavailableStartDate, Date unavailableEndDate
        ) {
            try {
                Client__c client = new Client__c();
                client.Id=clientId;

                String availablepicklist;

                if (isAvailable == true) {
                    availablepicklist = 'Available';
                } else if (isUnavailable == true) { // ✅ FIXED
                    availablepicklist = 'Unavailable';
                }

                client.Current_Availability__c = availablepicklist;
                client.Medications__c = medications;
                client.Allergies__c = allergies;
                client.Notes__c = notes;
                client.Unavailable_Start_Date__c = unavailableStartDate;
                client.Unavailable_Date__c = unavailableEndDate;

                update client;

            } catch (Exception e) {
                throw new AuraHandledException('Error updating client: ' + e.getMessage());
            }
        }
   
    @AuraEnabled
    public static Map<String, Object> createClientsOnBulk(String templateType, List<Map<String, String>> records, String facilityId) {
        Map<String, Object> response = new Map<String, Object>();
        List<Map<String, Object>> results = new List<Map<String, Object>>();

        try {
            List<Client__c> clientsToInsert = new List<Client__c>();
            List<Map<String, String>> rowTracker = new List<Map<String, String>>();

            /* ---------------------------------------
            STEP 1 — Build Client Objects
            ------------------------------------------ */
            for (Map<String, String> recordMap : records) {
                try {
                    Client__c client = new Client__c();
                    client.Facility__c = facilityId;

                    String firstName = recordMap.get('FirstName');
                    String lastName  = recordMap.get('LastName');

                    // State Normalization
                    String inputState = recordMap.get('AddressState');
                    String stateCode;

                    if (inputState != null) inputState = inputState.toLowerCase().trim();

                    if (String.isNotBlank(inputState)) {
                        if (inputState.contains('nsw')) stateCode = 'NSW';
                        else if (inputState.contains('vic')) stateCode = 'VIC';
                        else if (inputState.contains('qld')) stateCode = 'QLD';
                        else if (inputState.contains('wa')) stateCode = 'WA';
                        else if (inputState.contains('sa')) stateCode = 'SA';
                        else if (inputState.contains('tas')) stateCode = 'TAS';
                        else if (inputState.contains('act')) stateCode = 'ACT';
                        else if (inputState.contains('nt')) stateCode = 'NT';
                        else stateCode = inputState;
                    }

                    client.Address__StateCode__s = stateCode;

                    /* -----------------------
                    Populate Fields
                    ------------------------- */
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
                        client.Address__PostalCode__s = recordMap.get('AdressPostCode');
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
                        client.Address__PostalCode__s = recordMap.get('AdressPostCode');
                        client.Address__CountryCode__s = 'AU';
                        client.ParticipantType__c = 'Company';
                        client.Status__c = TRUE;

                    } else if (templateType == 'Individual') {

                        client.Name = firstName + ' ' + lastName;
                        client.First_Name__c = firstName;
                        client.Last_Name__c = lastName;
                        client.Gendar__c = recordMap.get('Gender');
                        client.Email__c = recordMap.get('EmailID');
                        client.Contact_Number__c = recordMap.get('ContactNumber');
                        client.Date_Of_Birth__c = parseDDMMYYYY(recordMap.get('DateofBirth'));
                        client.Address__Street__s = recordMap.get('AddressStreet');
                        client.Address__City__s = recordMap.get('AddressCity');
                        client.Address__PostalCode__s = recordMap.get('AdressPostCode');
                        client.Address__CountryCode__s = 'AU';
                        client.ParticipantType__c = 'Individual';
                        client.Status__c = TRUE;
                    }

                    clientsToInsert.add(client);
                    rowTracker.add(recordMap);

                } catch (Exception buildError) {
                    Map<String, String> updatedRow = new Map<String, String>();
                    updatedRow.putAll(recordMap);
                    updatedRow.put('ProcessedStatus', 'Error ❌: ' + buildError.getMessage());

                    results.add(new Map<String, Object>{
                        'Status' => 'Error',
                        'Message' => buildError.getMessage(),
                        'Row' => updatedRow
                    });
                }
            }

         
        /* ---------------------------------------
        STEP 2 — Bulk Insert Partial Success
        ------------------------------------------ */
        if (!clientsToInsert.isEmpty()) {

            Database.SaveResult[] saveResults =
                Database.insert(clientsToInsert, false);

            List<Participant_Contact__c> contactsToInsert =
                new List<Participant_Contact__c>();

            List<Participant_Facility__c> participantFacilitiesToInsert =
                new List<Participant_Facility__c>();

            for (Integer i = 0; i < saveResults.size(); i++) {

                Map<String, String> row = rowTracker[i];

                if (saveResults[i].isSuccess()) {

                    Id clientId = saveResults[i].getId();

                    // Create Participant Facility
                    Participant_Facility__c pf = new Participant_Facility__c();
                    pf.Participant__c = clientId;
                    pf.Facility__c = facilityId;
                    pf.Active__c = true;

                    participantFacilitiesToInsert.add(pf);

                    // Create Primary Contact
                    if (templateType == 'Client') {

                        Participant_Contact__c pc = new Participant_Contact__c();

                        pc.Participant__c = clientId;
                        pc.First_Name__c = row.get('PrimaryContactFirstName');
                        pc.Last_Name__c = row.get('PrimaryContactLastName');
                        pc.Email__c = row.get('PrimaryContactEmail');
                        pc.Contact_Number__c = row.get('PrimaryContactNumber');
                        pc.Contact_Type__c = 'Primary';

                        contactsToInsert.add(pc);
                    }

                    Map<String, String> updatedRow = new Map<String, String>();
                    updatedRow.putAll(row);
                    updatedRow.put('ProcessedStatus', 'Success ✅');
                    results.add(new Map<String, Object>{
                        'Status' => 'Success',
                        'Message' => 'Client created successfully.',
                        'Row' => updatedRow
                    });

                } else {

                    Database.Error err = saveResults[i].getErrors()[0];

                    Map<String, String> updatedRow = new Map<String, String>();
                    updatedRow.putAll(row);

                    updatedRow.put(
                        'ProcessedStatus',
                        'Error ❌: ' + err.getMessage()
                    );

                    results.add(new Map<String, Object>{
                        'Status' => 'Error',
                        'Message' => err.getMessage(),
                        'Row' => updatedRow
                    });
                }
            }

            if (!contactsToInsert.isEmpty()) {
                insert contactsToInsert;
            }

            if (!participantFacilitiesToInsert.isEmpty()) {
                insert participantFacilitiesToInsert;
            }
      }

            response.put('results', results);
            return response;

        } catch (Exception ex) {
            throw new AuraHandledException('Unexpected Error: ' + ex.getMessage());
        }
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
    
    @AuraEnabled
    public static void deleteContacts(List<String> contactIds) {
        System.debug('contactIds '+contactIds);
        if (contactIds == null || contactIds.isEmpty()) {
            return;
        }
    
        List<Participant_Contact__c> contactsToDelete = [
            SELECT Id
            FROM Participant_Contact__c
            WHERE Id IN :contactIds
        ];
    
        if (!contactsToDelete.isEmpty()) {
            delete contactsToDelete;
        }
    }

    @AuraEnabled
    public static Map<String, String> getTabPreferredNames(Id facilityId) {
        Map<String, String> result = new Map<String, String>();

        if (facilityId == null) {
            return result;
        }

        Facility__c fac = [
            SELECT
                Journal_Preferred_Name__c,
                Attachments_Preferred_Name__c,
                Forms_Preferred_Name__c,
                Feedback_Preferred_Name__c,
                Services_Preferred_Name__c,
                Details_Preferred_Name__c,
                Funds_Preferred_Name__c,
                Schedule_Preferred_Name__c,
                Risk_Preferred_Name__c
            FROM Facility__c
            WHERE Id = :facilityId
            LIMIT 1
        ];

        result.put('journal', fac.Journal_Preferred_Name__c);
        result.put('attachments', fac.Attachments_Preferred_Name__c);
        result.put('forms', fac.Forms_Preferred_Name__c);
        result.put('feedback', fac.Feedback_Preferred_Name__c);
        result.put('services', fac.Services_Preferred_Name__c);
        result.put('details', fac.Details_Preferred_Name__c);
        result.put('funds', fac.Funds_Preferred_Name__c);
        result.put('schedule', fac.Schedule_Preferred_Name__c);
        result.put('risk', fac.Risk_Preferred_Name__c);

        return result;
    }

    @AuraEnabled
    public static void saveTabPreferredName(
        Id facilityId,
        String tabKey,
        String preferredName,
        String scope // 'FACILITY' | 'ORG'
    ) {
        if (facilityId == null || String.isBlank(tabKey)) {
            return;
        }

        // ❌ Empty validation
        if (String.isBlank(preferredName)) {
            throw new AuraHandledException(
                'Preferred name cannot be empty for tab: ' + tabKey
            );
        }

        // ❌ Length validation
        if (preferredName.length() > 30) {
            throw new AuraHandledException(
                'Tab name cannot exceed 30 characters.'
            );
        }

        // 🔹 Fetch facility + organisation
        Facility__c baseFacility = [
            SELECT Id, Organisation__c
            FROM Facility__c
            WHERE Id = :facilityId
            LIMIT 1
        ];

        List<Facility__c> facilitiesToUpdate = new List<Facility__c>();

        // 🔹 Scope resolution
        if (scope == 'ORG') {
            System.debug('SCOPE: ORG branch entered');
            facilitiesToUpdate = [
                SELECT Id,
                    Journal_Preferred_Name__c,
                    Attachments_Preferred_Name__c,
                    Forms_Preferred_Name__c,
                    Feedback_Preferred_Name__c,
                    Services_Preferred_Name__c,
                    Details_Preferred_Name__c,
                    Funds_Preferred_Name__c,
                    Schedule_Preferred_Name__c,
                    Risk_Preferred_Name__c
                FROM Facility__c
                WHERE Organisation__c = :baseFacility.Organisation__c
            ];

            System.debug('ORG facilities found: ' + facilitiesToUpdate.size());
        } else {
            System.debug('SCOPE: FACILITY branch entered');
            facilitiesToUpdate.add(
                new Facility__c(Id = baseFacility.Id)
            );
        }

        // 🔹 Apply tab value
        for (Facility__c fac : facilitiesToUpdate) {
            switch on tabKey {
                when 'journal' {
                    fac.Journal_Preferred_Name__c = preferredName;
                }
                when 'attachments' {
                    fac.Attachments_Preferred_Name__c = preferredName;
                }
                when 'forms' {
                    fac.Forms_Preferred_Name__c = preferredName;
                }
                when 'feedback' {
                    fac.Feedback_Preferred_Name__c = preferredName;
                }
                when 'details' {
                    fac.Details_Preferred_Name__c = preferredName;
                }
                when 'services' {
                    fac.Services_Preferred_Name__c = preferredName;
                }
                when 'funds' {
                    fac.Funds_Preferred_Name__c = preferredName;
                }
                when 'schedule' {
                    fac.Schedule_Preferred_Name__c = preferredName;
                }
                when 'risk' {
                    fac.Risk_Preferred_Name__c = preferredName;
                }
              /*  when else {
                    throw new AuraHandledException(
                        'Unsupported tabKey: ' + tabKey
                    );
                }*/
            }
        }

        if (!facilitiesToUpdate.isEmpty()) {
            update facilitiesToUpdate;
        }
    }

}