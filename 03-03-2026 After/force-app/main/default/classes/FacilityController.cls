/**
* @description       : 
* @author            : Raja Sekhar Reddy
* @group             : 
* @Test Class        : FacilityControllerTest
* @last modified on  : 07-14-2023
* @last modified by  : Raja Sekhar Reddy
**/
public with sharing class FacilityController {
    @AuraEnabled
    public static List<Facility__c> fetchFacilitiesByOrgId(String recordId){
        if(recordId=='' || recordId ==null){
            User objUser = [ SELECT Phone, Id,Organization_Name__c FROM User WHERE Id = : UserInfo.getUserId() ];
            List<Organisation__c> orgNames = [Select id, Name,ABN__c,ACN__c,NDIS_Provider__c,Contact_No__c,Email__c,Address__c from Organisation__c where name=:objUser.Organization_Name__c]; // Can include multiple fields, 
            if(orgNames.size()>0)
                recordId = orgNames[0].Id;
        }
        
        return [SELECT id,Name,Email__c,AddressData__c,Phone__c,Status__c,Services__c,Organisation__r.name,Picture__c,Enable_Shift_Rejection__c,
                Manager_Name__c,Address__Street__s,
                Address__City__s,Address__StateCode__s,Address__CountryCode__s,Address__PostalCode__s,Use_Org_ABN__c,ABN__c,Shift_Penalty_Mode__c,Shift_Cancellation_Period__c
                FROM Facility__c where  Organisation__c  =: recordId order by name asc];
    }
    
    @AuraEnabled
public static List<Facility__c> fetchFacilitiesByOrgIdCommunity(String recordId, String firstname) {

    if (String.isBlank(recordId)) {
        User objUser = [
            SELECT Phone, Id, Organization_Name__c 
            FROM User 
            WHERE Id = :UserInfo.getUserId()
        ];

        List<Organisation__c> orgNames = [
            SELECT Id, Name, ABN__c, ACN__c, NDIS_Provider__c, Contact_No__c, Email__c, Address__c 
            FROM Organisation__c 
            WHERE Name = :objUser.Organization_Name__c
        ];

        if (!orgNames.isEmpty()) {
            recordId = orgNames[0].Id;
        }
    }

    List<Facility__c> facilityList = new List<Facility__c>();

    System.debug('firstname ' + firstname);
    System.debug('recordId ' + recordId);

    String truncatedStr = recordId != null ? recordId.substring(0, 15) : null;

    List<String> filters = new List<String>();

    // 🔹 Only add Name filter if firstname is NOT blank
    if (!String.isBlank(firstname)) {
        String fname = '%' + firstname.trim() + '%';
        filters.add('Name LIKE :fname');
    }

    // 🔹 Always filter by organisation
    filters.add('Organisation__c = :truncatedStr');

    String query = 'SELECT Id, Name, Email__c, AddressData__c, Phone__c, Status__c, Services__c,Enable_Shift_Rejection__c, ' +
        'Picture__c, Organisation__r.Name, Manager_Name__c, Address__Street__s, Address__City__s, ' +
        'Address__StateCode__s, Address__CountryCode__s, Address__PostalCode__s, Facility_Status__c, ' +
        'Use_Org_ABN__c, ABN__c, BMS_Identifier__c, Software_Id__c, Agent_Name__c, Tax_Agency__c, ' +
        'Agent_Number__c, Afternoon_Shift_Color__c, Custom_Shift_Color__c, General_Shift_Color__c, ' +
        'Morning_Shift_Color__c, Night_Shift_Color__c, Sleepover_Shift_Color__c, Cost_per_Km_Fuel__c, ' +
        'Cost_per_Km_Electric__c, General_Shift_Start_Time__c, General_Shift_End_Time__c, ' +
        'Morning_Shift_Start_Time__c, Morning_Shift_End_Time__c, Afternoon_Shift_Start_Time__c, ' +
        'Afternoon_Shift_End_Time__c, Night_Shift_Start_Time__c, Night_Shift_End_Time__c, ' +
        'Custom_Shift_Start_Time__c, Custom_Shift_End_Time__c, Sleepover_Shift_Strat_Time__c, ' +
        'Sleepover_Shift_End_Time__c, Type_of_Service__c, Selected_Documents__c, Selected_Trainings__c,Shift_Penalty_Mode__c ' +
        'FROM Facility__c';

    if (!filters.isEmpty()) {
        query += ' WHERE ' + String.join(filters, ' AND ');
    }

    System.debug('query>>>>' + query);

    facilityList = Database.query(query);

    return facilityList;
}

    
    
    @AuraEnabled
    public static void statusFacility(String IdValue,String status){
        Facility__c fact=new Facility__c(Id=IdValue);
        fact.Status__c=Boolean.valueOf(status);
        Update fact;
    }
    
    @AuraEnabled
    public static Facility__c getfacilityById(String facId) {
        if (String.isBlank(facId)) {
            throw new AuraHandledException('Invalid recordId');
        }
        system.debug('record id ==> ' + facId); 
        return [SELECT Id, Manager_Name__c ,Classification_Order__c,Classification_Value__c, Employment_Type_Order__c,Employment_Type_Value__c,Fatigue_Management_Order__c,Fatigue_Management_Value__c, Preferred_Staff_Order__c,General_Shift_Start_Time__c,General_Shift_End_Time__c,Morning_Shift_Start_Time__c,Morning_Shift_End_Time__c,Afternoon_Shift_Start_Time__c,Afternoon_Shift_End_Time__c,Night_Shift_Start_Time__c,Night_Shift_End_Time__c,Custom_Shift_Start_Time__c,Custom_Shift_End_Time__c,Sleepover_Shift_Strat_Time__c,Sleepover_Shift_End_Time__c, Cost_per_Km_Electric__c, Cost_per_Km_Fuel__c,
                General_Shift_Color__c,Afternoon_Shift_Color__c,Custom_Shift_Color__c,Morning_Shift_Color__c,Night_Shift_Color__c,Sleepover_Shift_Color__c, Preferred_Staff_Value__c, Risk_Index_Order__c, Risk_Index_Value__c,Radius_Order__c,Radius_Value__c,Type_of_Service__c, Selected_Documents__c, Selected_Trainings__c FROM Facility__c WHERE Id =:facId];
    }
    
    @AuraEnabled
    public static void savefacilityRoles(Id facilityId, List<Map<String, Object>> options) {
        System.debug('📥 Incoming options: ' + options);
        System.debug('📥 FacilityId received: ' + facilityId);
        
        if (options == null || options.isEmpty()) {
            System.debug('⚠️ No options to process.');
            return;
        }
        
        // Step 1: Collect unique labels from incoming options
        Set<String> labels = new Set<String>();
        for (Map<String, Object> opt : options) {
            String label = (String) opt.get('label');
            if (String.isNotBlank(label)) {
                labels.add(label);
            }
        }
        System.debug('📝 Unique labels to process: ' + labels);
        
        // Step 2: Query existing roles for this facility and these labels
        Map<String, Facility_Role__c> existingRolesMap = new Map<String, Facility_Role__c>();
        for (Facility_Role__c r : [
            SELECT Id, Role_Name__c, Facility__c, Is_Active__c
            FROM Facility_Role__c
            WHERE Facility__c = :facilityId AND Role_Name__c IN :labels
        ]) {
            existingRolesMap.put(r.Role_Name__c, r);
        }
        System.debug('📦 Existing roles from Salesforce: ' + existingRolesMap);
        
        // Step 3: Prepare map to deduplicate roles to upsert
        Map<String, Facility_Role__c> rolesMap = new Map<String, Facility_Role__c>();
        
        for (Map<String, Object> opt : options) {
            String label = (String) opt.get('label');
            Boolean checked = (Boolean) opt.get('checked');
            System.debug('➡️ Processing option: ' + opt);
            
            if (String.isNotBlank(label)) {
                if (rolesMap.containsKey(label)) {
                    // Already added, update checked if needed
                    rolesMap.get(label).Is_Active__c = checked;
                    System.debug('🔄 Duplicate label found in options, updating checked: ' + label);
                } else if (existingRolesMap.containsKey(label)) {
                    // Update existing role
                    Facility_Role__c role = existingRolesMap.get(label);
                    role.Is_Active__c = checked;
                    rolesMap.put(label, role);
                    System.debug('✏️ Updating existing role: ' + label + ' with checked=' + checked);
                } else {
                    // New role
                    Facility_Role__c role = new Facility_Role__c(
                        Facility__c = facilityId,
                        Role_Name__c = label,
                        Is_Active__c = checked
                    );
                    rolesMap.put(label, role);
                    System.debug('➕ Adding new role: ' + label + ' with checked=' + checked);
                }
            }
        }
        
        // Step 4: Upsert all roles
        List<Facility_Role__c> rolesToUpsert = rolesMap.values();
        System.debug('📤 Roles to upsert: ' + rolesToUpsert);
        
        if (!rolesToUpsert.isEmpty()) {
            upsert rolesToUpsert;
            System.debug('✅ Upserted Roles successfully: ' + rolesToUpsert);
        } else {
            System.debug('⚠️ No roles to upsert.');
        }
    }
    
    
    @AuraEnabled
    public static List<Facility_Role__c> getFacilityRoles(Id facilityId) {
        System.debug('📥 Fetching Facility Roles for FacilityId: ' + facilityId);
        
        return [
            SELECT Id, Name, Role_Name__c,Is_Active__c, Facility__c
            FROM Facility_Role__c
            WHERE Facility__c = :facilityId
        ];
    }
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getServicesData(Id facilityId) {
        Map<String, Object> response = new Map<String, Object>();

        // 1️⃣ Get all picklist values of Services__c
        List<String> allServices = new List<String>();
        Schema.DescribeFieldResult fieldResult = Schema.Facility__c.Services__c.getDescribe();
        for (Schema.PicklistEntry entry : fieldResult.getPicklistValues()) {
            allServices.add(entry.getLabel());
        }

        // 2️⃣ Get saved Services__c for the given Facility (if editing)
        List<String> savedServices = new List<String>();
        if (facilityId != null) {
            Facility__c facility = [
                SELECT Services__c 
                FROM Facility__c 
                WHERE Id = :facilityId 
                LIMIT 1
            ];
            if (facility.Services__c != null) {
                savedServices = facility.Services__c.split(';');
            }
        }

        // 3️⃣ Add to response map
        response.put('allServices', allServices);
        response.put('savedServices', savedServices);

        return response;//manendra
    }
    @AuraEnabled
    public static List<Facility_Role__c> fetchBulkRoles(list<string> facilityIDList){
        List<Facility_Role__c>  fetchFacilityRoles = new   List<Facility_Role__c> ();
        fetchFacilityRoles=[SELECT Id, Name, Role_Name__c,Is_Active__c, Facility__c
                            FROM Facility_Role__c
                            WHERE Facility__c IN :facilityIDList and Is_Active__c=true ORDER BY Role_Name__c ASC];
        
        return fetchFacilityRoles;
    }


    /* @AuraEnabled
    public static Map<String, Object> createFacilityOnBulk( List<Map<String, String>> records) {
       System.debug('records >>'+ records.size());
        Map<String, Object> response = new Map<String, Object>();
        List<Map<String, String>> successRecords = new List<Map<String, String>>();
        List<Map<String, String>> failedRecords = new List<Map<String, String>>();
    
        try {
            User currentUser = [SELECT Id, Organization_Name__c, TimeZoneSidKey, LocaleSidKey, EmailEncodingKey, LanguageLocaleKey 
                                FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
            
            Organisation__c org = [SELECT Id,ABN__c FROM Organisation__c WHERE Name = :currentUser.Organization_Name__c LIMIT 1];
            
            List<Facility__c> recordsToInsert = new List<Facility__c>();
    
            for (Map<String, String> recordMap : records) {
                try {
                    Facility__c fac = new Facility__c();
                  
                    String inputState = (String)recordMap.get('AddressState');
                    String stateCode;
                    Boolean useOrgAbn = recordMap.get('UseOrgABN') == 'Active' || recordMap.get('UseOrgABN') == 'true' || recordMap.get('UseOrgABN') == 'Yes';
                    // Normalize input (make it lowercase and trim spaces)
                    if (inputState != null) {
                        inputState = inputState.toLowerCase();
                        //System.debug('inputState >>'+ inputState);
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
                       // System.debug('inputState111 >>'+ inputState);
                    }
                    
                    // Assign to your record
                   
					fac.Name = recordMap.get('FacilityName');
                    fac.Phone__c = recordMap.get('ContactNumber');
                    fac.Manager_Name__c =  recordMap.get('ManagerName');
                    fac.Email__c = recordMap.get('EmailID');
                    fac.Status__c = TRUE;
                    fac.Organisation__c  = org.Id;
                    fac.Use_Org_ABN__c = useOrgAbn;
                    if(useOrgAbn){
                       fac.ABN__c = org.ABN__c;
                    } else {
                       fac.ABN__c =recordMap.get('ABN');
                    }
                    fac.Type_of_Service__c =  recordMap.get('TypeofService');
                    
                    String servicesStr = recordMap.get('Services');
                   // System.debug('servicesStr >>'+ servicesStr);
                    
                    if (String.isNotBlank(servicesStr)) {
                        // Replace commas with semicolons, trim spaces, remove duplicate semicolons
                        
                        servicesStr = servicesStr.replace(',', ';');
                        servicesStr = servicesStr.replaceAll(';;+', ';'); // remove multiple semicolons if any
						//servicesStr = servicesStr.trim();
                    
                        fac.Services__c = servicesStr;
                        //System.debug('servicesStr111 >>'+ servicesStr);
                    }
                    
                   // fac.Services__c = recordMap.get('Services');
                   // fac.Services__c = recordMap.get('Role');
                    
                    fac.Address__StateCode__s = stateCode;
                    fac.Address__Street__s =  recordMap.get('AddressStreet');
                    fac.Address__City__s =  recordMap.get('AddressCity');
                    
                    fac.Address__PostalCode__s =  recordMap.get('AdressPostCode');
                    fac.Address__CountryCode__s = 'AU';
                   
                    
                    recordsToInsert.add(fac);
                    //System.debug('recordsToInsert >>'+ recordsToInsert);
                   // successRecords.add(recordMap);
                } catch (Exception e) {
                   // Map<String, String> record = records[emailToIndexMap.get(insertedContact.Email)];
                    recordMap.put('ErrorMessage', 'Facility creation failed: ' + e.getMessage());
                    failedRecords.add(recordMap);
                }
            }
           
 			// Insert all Facility
            //insert recordsToInsert;
            if (!recordsToInsert.isEmpty()) {
                Database.SaveResult[] results = Database.insert(recordsToInsert, false);
    
                for (Integer i = 0; i < results.size(); i++) {
                    if (results[i].isSuccess()) {
                        Map<String, String> successMap = new Map<String, String>();
                        successMap.put('EmailID', recordsToInsert[i].Email__c);
                        successMap.put('FacilityName', recordsToInsert[i].Name);
                        successRecords.add(successMap);
                    } else {
                        Map<String, String> failedMap = new Map<String, String>();
                        failedMap.putAll(records.get(i));
                        failedMap.put('EmailID', recordsToInsert[i].Email__c);
                        failedMap.put('FacilityName', recordsToInsert[i].Name);
                        failedMap.put('ErrorMessage', results[i].getErrors()[0].getMessage());
                        failedRecords.add(failedMap);
                    }
                }
            }
            
            List<Facility_Role__c> roleRecordsToInsert = new List<Facility_Role__c>();
            for (Integer i = 0; i < recordsToInsert.size(); i++) {
                Facility__c insertedFac = recordsToInsert[i];
                Map<String, String> sourceRecord = records[i];
                String roleString = sourceRecord.get('Role');
                 //System.debug('roleString >>'+ roleString);
                if (String.isNotBlank(roleString)) {
                    List<String> roles = roleString.split(',');
                    for (String r : roles) {
                        String roleName =String.valueOf(r);
                       // System.debug('roleName >>'+ roleName);
                        if (String.isNotBlank(roleName)) {
                            Facility_Role__c roleRecord = new Facility_Role__c();
                            roleRecord.Facility__c = insertedFac.Id;
                            roleRecord.Role_Name__c = roleName;
                            roleRecord.Is_Active__c = true;
                            roleRecordsToInsert.add(roleRecord);
                        }
                    }
                }
            }
            //System.debug('roleRecordsToInsert >>'+ roleRecordsToInsert);
            if (!roleRecordsToInsert.isEmpty()) {
                insert roleRecordsToInsert;
            }

            response.put('successRecords', successRecords);
            response.put('failedRecords', failedRecords);
            
        } catch (Exception ex) {
            throw new AuraHandledException('Error while processing records: ' + ex.getMessage());
        }
        
        return response;
    } */

    @AuraEnabled
    public static Map<String, Object> createFacilityOnBulk(List<Map<String, String>> records) {
        System.debug('records >>' + records.size());
        Map<String, Object> response = new Map<String, Object>();
        List<Map<String, String>> successRecords = new List<Map<String, String>>();
        List<Map<String, String>> failedRecords = new List<Map<String, String>>();

        try {
            User currentUser = [
                SELECT Id, Organization_Name__c, TimeZoneSidKey, LocaleSidKey, EmailEncodingKey, LanguageLocaleKey 
                FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1
            ];
            
            Organisation__c org = [
                SELECT Id, ABN__c 
                FROM Organisation__c 
                WHERE Name = :currentUser.Organization_Name__c 
                LIMIT 1
            ];

            // 🔹 Step 1: Collect all email IDs from incoming records
            Set<String> inputEmails = new Set<String>();
            for (Map<String, String> rec : records) {
                if (String.isNotBlank(rec.get('EmailID'))) {
                    inputEmails.add(rec.get('EmailID').trim().toLowerCase());
                }
            }

            // 🔹 Step 2: Fetch all existing facilities in this Organisation__c with those emails
            Map<String, Facility__c> existingFacilitiesByEmail = new Map<String, Facility__c>();
            if (!inputEmails.isEmpty()) {
                for (Facility__c f : [
                    SELECT Id, Name, Email__c 
                    FROM Facility__c 
                    WHERE Organisation__c = :org.Id 
                    AND Email__c IN :inputEmails
                ]) {
                    existingFacilitiesByEmail.put(f.Email__c.toLowerCase(), f);
                }
            }

            List<Facility__c> recordsToInsert = new List<Facility__c>();

            // 🔹 Step 3: Iterate through incoming records
            for (Map<String, String> recordMap : records) {
                try {
                    String inputEmail = recordMap.get('EmailID');
                    if (String.isNotBlank(inputEmail) && existingFacilitiesByEmail.containsKey(inputEmail.toLowerCase())) {
                        // ❌ Duplicate found → skip
                        recordMap.put('ErrorMessage', 'Duplicate Facility found for this Email under the same Organisation.');
                        failedRecords.add(recordMap);
                        continue;
                    }

                    // ---- Existing facility creation logic ----
                    Facility__c fac = new Facility__c();
                    String inputState = (String)recordMap.get('AddressState');
                    String stateCode;
                    Boolean useOrgAbn = recordMap.get('UseOrgABN') == 'Active' || recordMap.get('UseOrgABN') == 'true' || recordMap.get('UseOrgABN') == 'Yes';

                    if (inputState != null) inputState = inputState.toLowerCase();

                    if (String.isNotBlank(inputState)) {
                        if (inputState.contains('new south wales') || inputState.contains('nsw')) stateCode = 'NSW';
                        else if (inputState.contains('victoria') || inputState.contains('vic')) stateCode = 'VIC';
                        else if (inputState.contains('queensland') || inputState.contains('qld')) stateCode = 'QLD';
                        else if (inputState.contains('western') || inputState.contains('wa')) stateCode = 'WA';
                        else if (inputState.contains('south australia') || inputState.contains('sa')) stateCode = 'SA';
                        else if (inputState.contains('tasmania') || inputState.contains('tas')) stateCode = 'TAS';
                        else if (inputState.contains('australian capital') || inputState.contains('act')) stateCode = 'ACT';
                        else if (inputState.contains('northern') || inputState.contains('nt')) stateCode = 'NT';
                        else stateCode = inputState;
                    }

                    fac.Name = recordMap.get('FacilityName');
                    fac.Phone__c = recordMap.get('ContactNumber');
                    fac.Manager_Name__c = recordMap.get('ManagerName');
                    fac.Email__c = inputEmail;
                    fac.Status__c = true;
                    fac.Organisation__c = org.Id;
                    fac.Use_Org_ABN__c = useOrgAbn;
                    fac.ABN__c = useOrgAbn ? org.ABN__c : recordMap.get('ABN');
                    fac.Type_of_Service__c = recordMap.get('TypeofService');

                    String servicesStr = recordMap.get('Services');
                    if (String.isNotBlank(servicesStr)) {
                        servicesStr = servicesStr.replace(',', ';');
                        servicesStr = servicesStr.replaceAll(';;+', ';');
                        fac.Services__c = servicesStr;
                    }

                    fac.Address__StateCode__s = stateCode;
                    fac.Address__Street__s = recordMap.get('AddressStreet');
                    fac.Address__City__s = recordMap.get('AddressCity');
                    fac.Address__PostalCode__s = recordMap.get('AdressPostCode');
                    fac.Address__CountryCode__s = 'AU';

                    recordsToInsert.add(fac);
                } catch (Exception e) {
                    recordMap.put('ErrorMessage', 'Facility creation failed: ' + e.getMessage());
                    failedRecords.add(recordMap);
                }
            }

            // 🔹 Step 4: Insert facilities
            if (!recordsToInsert.isEmpty()) {
                Database.SaveResult[] results = Database.insert(recordsToInsert, false);

                for (Integer i = 0; i < results.size(); i++) {
                    if (results[i].isSuccess()) {
                        Map<String, String> successMap = new Map<String, String>();
                        successMap.put('EmailID', recordsToInsert[i].Email__c);
                        successMap.put('FacilityName', recordsToInsert[i].Name);
                        successRecords.add(successMap);
                    } else {
                        Map<String, String> failedMap = new Map<String, String>();
                        failedMap.putAll(records.get(i));
                        failedMap.put('ErrorMessage', results[i].getErrors()[0].getMessage());
                        failedRecords.add(failedMap);
                    }
                }
            }

            // 🔹 Step 5: Create Facility_Role__c records
            List<Facility_Role__c> roleRecordsToInsert = new List<Facility_Role__c>();
            for (Integer i = 0; i < recordsToInsert.size(); i++) {
                Facility__c insertedFac = recordsToInsert[i];
                Map<String, String> sourceRecord = records[i];
                String roleString = sourceRecord.get('Role');
                if (String.isNotBlank(roleString)) {
                    for (String r : roleString.split(',')) {
                        String roleName = r.trim();
                        if (String.isNotBlank(roleName)) {
                            Facility_Role__c roleRecord = new Facility_Role__c(
                                Facility__c = insertedFac.Id,
                                Role_Name__c = roleName,
                                Is_Active__c = true
                            );
                            roleRecordsToInsert.add(roleRecord);
                        }
                    }
                }
            }

            if (!roleRecordsToInsert.isEmpty()) {
                insert roleRecordsToInsert;
            }

            response.put('successRecords', successRecords);
            response.put('failedRecords', failedRecords);
        } catch (Exception ex) {
            throw new AuraHandledException('Error while processing records: ' + ex.getMessage());
        }

        return response;
    }

  public class ComplianceSettingWrapper {
    @AuraEnabled public String complianceType;
    @AuraEnabled public Boolean isActive;
    @AuraEnabled public Boolean applyToSpecificRoles;
    @AuraEnabled public String rolesCommaSeparated;

    @AuraEnabled public Decimal valueNumber1;
    @AuraEnabled public Decimal valueNumber2;
    @AuraEnabled public Boolean valueBoolean1;
    }

    @AuraEnabled(cacheable=false)
    public static String saveFacilityComplianceSettings(List<ComplianceSettingWrapper> settings, Id facilityId) {

        if (facilityId == null) {
            throw new AuraHandledException('Facility Id is required.');
        }
        if (settings == null || settings.isEmpty()) {
            throw new AuraHandledException('No compliance settings were provided.');
        }

        // 1. Query existing compliance records for this facility
        Map<String, Facility_Compliance_Setting__c> existingMap = new Map<String, Facility_Compliance_Setting__c>();

        for (Facility_Compliance_Setting__c rec : [
            SELECT Id, Compliance_Type__c
            FROM Facility_Compliance_Setting__c
            WHERE Facility__c = :facilityId
        ]) {
            existingMap.put(rec.Compliance_Type__c, rec);
        }

        List<Facility_Compliance_Setting__c> recordsToInsert = new List<Facility_Compliance_Setting__c>();
        List<Facility_Compliance_Setting__c> recordsToUpdate = new List<Facility_Compliance_Setting__c>();

        // 2. Loop through incoming settings (one per tab)
        for (ComplianceSettingWrapper w : settings) {

            if (String.isBlank(w.complianceType)) {
                throw new AuraHandledException('One of the settings is missing the complianceType.');
            }

            Facility_Compliance_Setting__c rec;

            // Existing record?
            if (existingMap.containsKey(w.complianceType)) {
                rec = existingMap.get(w.complianceType);
            } else {
                rec = new Facility_Compliance_Setting__c();
                rec.Facility__c = facilityId;
                rec.Compliance_Type__c = w.complianceType;
                recordsToInsert.add(rec);
            }

            // Common fields
            rec.Is_Active__c                     = w.isActive;
            rec.Apply_to_specific_roles__c       = w.applyToSpecificRoles;
            rec.Roles__c                         = w.rolesCommaSeparated;

            // Tab-specific assignments
            applyTabSpecificValues(rec, w);

            // If it's an update
            if (rec.Id != null) {
                recordsToUpdate.add(rec);
            }
        }

        // 3. Perform DML operations
        if (!recordsToInsert.isEmpty()) {
            insert recordsToInsert;
        }
        if (!recordsToUpdate.isEmpty()) {
            update recordsToUpdate;
        }

        return 'SUCCESS';
    }

    private static void applyTabSpecificValues(
        Facility_Compliance_Setting__c rec,
        ComplianceSettingWrapper w
    ) {
        switch on w.complianceType {

            when 'Maximum Consecutive Days' {
                rec.Max_Consecutive_Days__c = w.valueNumber1;
            }

            when 'Minimum Hours Between Shifts' {
                rec.Min_Hours_Between_Shifts__c = w.valueNumber1;
            }

            when 'Maximum Hours Per Week' {
                rec.Max_Hours_Per_Week__c = w.valueNumber1;
            }

            when 'Maximum Hours Per Shift' {
                rec.Max_Hours_Per_Shift__c = w.valueNumber1;
            }

            when 'Require Break Every (hours)' {
                rec.Require_Break_Everyhours__c = w.valueNumber1;
            }

            when 'Break Duration (minutes)' {
                rec.Break_Duration_minutes__c = w.valueNumber1;
            }

            when 'Max Late Clock In (minutes)' {
                rec.Max_Late_Clock_In_minutes__c = w.valueNumber1;
            }

            when 'Allowed Late Instances Per Month' {
                rec.Allowed_Late_Instances_Per_Month__c = w.valueNumber1;
            }

            when 'Max Missed Shifts Per Month' {
                rec.Max_Missed_Shifts_Per_Month__c = w.valueNumber1;
            }

            when 'Require Excuse for Missed Shifts' {
                rec.Require_excuse_for_missed__c = w.valueBoolean1;
            }

            when else {
                // Optional: validate unknown complianceType
                // throw new AuraHandledException('Unknown compliance type: ' + w.complianceType);
            }
        }
    }
    @AuraEnabled(cacheable=true)
public static List<ComplianceSettingWrapper> loadFacilityComplianceSettings(Id facilityId) {

    if (facilityId == null) {
        throw new AuraHandledException('Facility Id is required for loading.');
    }

    List<ComplianceSettingWrapper> response = new List<ComplianceSettingWrapper>();

    List<Facility_Compliance_Setting__c> records = [
        SELECT 
            Id,
            Compliance_Type__c,
            Is_Active__c,
            Apply_to_specific_roles__c,
            Roles__c,
            Max_Consecutive_Days__c,
            Min_Hours_Between_Shifts__c,
            Max_Hours_Per_Week__c,
            Max_Hours_Per_Shift__c,
            Require_Break_Everyhours__c,
            Break_Duration_minutes__c,
            Max_Late_Clock_In_minutes__c,
            Allowed_Late_Instances_Per_Month__c,
            Max_Missed_Shifts_Per_Month__c,
            Require_excuse_for_missed__c
        FROM Facility_Compliance_Setting__c
        WHERE Facility__c = :facilityId
    ];

    for (Facility_Compliance_Setting__c rec : records) {

        ComplianceSettingWrapper w = new ComplianceSettingWrapper();
        w.complianceType = rec.Compliance_Type__c;
        w.isActive = rec.Is_Active__c;
        w.applyToSpecificRoles = rec.Apply_to_specific_roles__c;
        w.rolesCommaSeparated = rec.Roles__c;

        // TAB SPECIFIC FIELDS
        switch on rec.Compliance_Type__c {

            when 'Maximum Consecutive Days' {
                w.valueNumber1 = rec.Max_Consecutive_Days__c;
            }

            when 'Minimum Hours Between Shifts' {
                w.valueNumber1 = rec.Min_Hours_Between_Shifts__c;
            }

            when 'Maximum Hours Per Week' {
                w.valueNumber1 = rec.Max_Hours_Per_Week__c;
            }

            when 'Maximum Hours Per Shift' {
                w.valueNumber1 = rec.Max_Hours_Per_Shift__c;
            }

            when 'Mandatory Break Requirements' {
                w.valueNumber1 = rec.Require_Break_Everyhours__c;
                w.valueNumber2 = rec.Break_Duration_minutes__c;
            }

            when 'Clock In/Out Accuracy' {
                w.valueNumber1 = rec.Max_Late_Clock_In_minutes__c;
                w.valueNumber2 = rec.Allowed_Late_Instances_Per_Month__c;
            }

            when 'Shift Attendance Tracking' {
                w.valueNumber1 = rec.Max_Missed_Shifts_Per_Month__c;
                w.valueBoolean1 = rec.Require_excuse_for_missed__c;
            }

            when else {
                // No additional fields
            }
        }

        response.add(w);
    }

    return response;
}
   
  /*  @AuraEnabled
    public static Id doesCompanyExist(Id facilityId) {
        List<Company__c> companies = [
            SELECT Id
            FROM Company__c
            WHERE Facility__c = :facilityId
            LIMIT 1
        ];
    
        return companies.isEmpty() ? null : companies[0].Id;
    }*/
    @AuraEnabled
    public static Map<String, Object> getCompanyAndEntityStatus(Id facilityId) {
        Map<String, Object> result = new Map<String, Object>();
    
        List<Company__c> companies = [
            SELECT Id,Company_Name__c,
                (SELECT Id, First_Name__c,Name__c,Last_Name__c FROM Entity_Profile__r LIMIT 1)
            FROM Company__c
            WHERE Facility__c = :facilityId
            LIMIT 1
        ];
    
        if (companies.isEmpty()) {
            result.put('companyExists', false);
            result.put('companyId', null);
            result.put('companyName',null);
            result.put('entityExists', false);
            result.put('entityId', null);
        } else {
            Company__c comp = companies[0];
            result.put('companyExists', true);
            result.put('companyId', comp.Id);
            result.put('companyName',comp.Company_Name__c);
            if (comp.Entity_Profile__r != null && !comp.Entity_Profile__r.isEmpty()) {
                Entity_Profile__c ent = comp.Entity_Profile__r[0];
                String entityName;
                if (!String.isBlank(ent.Name__c)) {
                    entityName = ent.Name__c;
                } else {
                    entityName = ent.First_Name__c + ' ' + ent.Last_Name__c;
                }
                result.put('entityExists', true);
                result.put('entityId', comp.Entity_Profile__r[0].Id);
                result.put('entityName', entityName);
            } else {
                result.put('entityExists', false);
                result.put('entityId', null);
            }
        }
    
        return result;
    }
    @AuraEnabled
    public static void updateFundTrackerWithEntity(
        Id fundTrackerId,
        Id entityId
    ) {
        if (fundTrackerId == null || entityId == null) {
            throw new AuraHandledException('FundTrackerId or EntityId missing');
        }

        Funds_Tracker__c ft = [
            SELECT Id, Entity_Profile__c
            FROM Funds_Tracker__c
            WHERE Id = :fundTrackerId
            LIMIT 1
        ];

        ft.Entity_Profile__c = entityId;
        update ft;
    }
    
    @AuraEnabled
    public static Map<String, Object> getServiceLineItem(String ServiceDate, Id recordId) {
        System.debug('recordId ==> ' + recordId);
        System.debug('ServiceDate ==> ' + ServiceDate);

        Map<String, Object> response = new Map<String, Object>();

        // 🔹 Facility
        Facility__c facility = [
            SELECT Id, Name, Type_of_Service__c
            FROM Facility__c
            WHERE Id = :recordId
            LIMIT 1
        ];

        // 🔹 Financial year calculation
        Date sDate = Date.valueOf(ServiceDate);
        Integer fyStartYear =
            (sDate < Date.newInstance(sDate.year(), 7, 1))
            ? sDate.year() - 1
            : sDate.year();

        Date financialStartDate = Date.newInstance(fyStartYear, 7, 1);

        Map<Id, NDIS_Support_Catalogue__c> resultMap =
            new Map<Id, NDIS_Support_Catalogue__c>();

        // 🔹 Financial year catalogues
        for (NDIS_Support_Catalogue__c rec : [
            SELECT Id, Name, Support_Item_Name__c, Start_Date__c,
                ACT__c, NSW__c, NT__c, QLD__c, SA__c, TAS__c, VIC__c, WA__c,
                Facility__c, Support_Item_Number__c
            FROM NDIS_Support_Catalogue__c
            WHERE Start_Date__c = :financialStartDate
        ]) {
            resultMap.put(rec.Id, rec);
        }

        // 🔹 Facility-specific catalogues
        for (NDIS_Support_Catalogue__c rec : [
            SELECT Id, Name, Support_Item_Name__c, Start_Date__c,
                ACT__c, NSW__c, NT__c, QLD__c, SA__c, TAS__c, VIC__c, WA__c,
                Facility__c, Support_Item_Number__c
            FROM NDIS_Support_Catalogue__c
            WHERE Facility__c = :recordId
        ]) {
            resultMap.put(rec.Id, rec);
        }

        // 🔹 Build response
        response.put('facility', facility);
        response.put('catalogues', resultMap.values());

        return response;
    }
    
    @AuraEnabled
    public static Map<String, Object> createEntityOnBulk(
        List<Map<String, String>> records
    ) {
        Map<String, Object> response = new Map<String, Object>();
        List<Map<String, String>> successRecords = new List<Map<String, String>>();
        List<Map<String, String>> failedRecords = new List<Map<String, String>>();
    
        try {
            /* =====================================================
           1️⃣ COLLECT INCOMING EMAILS
           ===================================================== */
        Set<String> incomingEmails = new Set<String>();
        for (Map<String, String> rec : records) {
            if (String.isNotBlank(rec.get('Email'))) {
                incomingEmails.add(rec.get('Email').toLowerCase());
            }
        }

        /* =====================================================
           2️⃣ QUERY EXISTING EMAILS FROM DB
           ===================================================== */
        Set<String> existingEmails = new Set<String>();
        if (!incomingEmails.isEmpty()) {
            for (Entity_Profile__c ep : [
                SELECT Email__c
                FROM Entity_Profile__c
                WHERE Email__c IN :incomingEmails
            ]) {
                if (ep.Email__c != null) {
                    existingEmails.add(ep.Email__c.toLowerCase());
                }
            }
        }

            
            
            
            
            
            List<Entity_Profile__c> entities = new List<Entity_Profile__c>();
    
            for (Map<String, String> rec : records) {
                try {
                    
                    String email = rec.get('Email');

                // 🔴 SKIP if email already exists in DB
                if (
                    String.isNotBlank(email) &&
                    existingEmails.contains(email.toLowerCase())
                ) {
                    rec.put(
                        'ErrorMessage',
                        'Email already exists in the system'
                    );
                    failedRecords.add(rec);
                    continue;
                }
                    
                    
                    
                    Entity_Profile__c e = new Entity_Profile__c();
                     String inputState = (String)rec.get('AddressState');
                     String stateCode;
                     
                     if (inputState != null) inputState = inputState.toLowerCase();

                     if (String.isNotBlank(inputState)) {
                        if (inputState.contains('new south wales') || inputState.contains('nsw')) stateCode = 'NSW';
                        else if (inputState.contains('victoria') || inputState.contains('vic')) stateCode = 'VIC';
                        else if (inputState.contains('queensland') || inputState.contains('qld')) stateCode = 'QLD';
                        else if (inputState.contains('western') || inputState.contains('wa')) stateCode = 'WA';
                        else if (inputState.contains('south australia') || inputState.contains('sa')) stateCode = 'SA';
                        else if (inputState.contains('tasmania') || inputState.contains('tas')) stateCode = 'TAS';
                        else if (inputState.contains('australian capital') || inputState.contains('act')) stateCode = 'ACT';
                        else if (inputState.contains('northern') || inputState.contains('nt')) stateCode = 'NT';
                        else stateCode = inputState;
                    }
    
                    e.Designation__c = rec.get('Type');
                    e.Name__c = rec.get('Name');
                    e.First_Name__c = rec.get('FirstName');
                    e.Last_Name__c = rec.get('LastName');
                    e.Contact__c = rec.get('ContactNumber');
                    e.Email__c = rec.get('Email');
                    e.To_Email__c = rec.get('ToEmail');
                    e.cc__c = rec.get('CcEmail');
                   // e.Tax_Code__c           = rec.get('TaxCode');
                    //e.AccountList__c        = rec.get('AccountList');
                    e.Card_Type__c='Customer';
                    if (String.isNotBlank(rec.get('CompanyId'))) {
                        e.Company__c = rec.get('CompanyId');
                    }
    
                 // 🔹 Address (atomic only)
                   e.Address_Latest__Street__s      = rec.get('AddressStreet');
                   e.Address_Latest__City__s        = rec.get('AddressCity');
                   e.Address_Latest__StateCode__s   = stateCode;
                   e.Address_Latest__PostalCode__s  = rec.get('AddressPostCode');
                  // e.Address_Latest__CountryCode__s = rec.get('AddressCountry');
    				 e.Address_Latest__CountryCode__s ='AU';
                    // 🔥 Financial
                    e.Tax_Code__c           = rec.get('TaxCode');
                    e.AccountList__c        = rec.get('Accountlist');
                    //e.Tax__c = Decimal.valueOf(rec.get('TaxRate'));
                    String taxRateStr = rec.get('TaxRate');
                    if (String.isNotBlank(taxRateStr)) {
                        taxRateStr = taxRateStr.replace('%', '').trim();
                        e.Tax__c = Decimal.valueOf(taxRateStr);
                    }
                    e.Accounting_Ledger_Items__c = rec.get('AccountItemId');
                    e.Include_Org_Email__c = rec.get('IncludeOrgEmail') == 'true';
    
                    entities.add(e);
                } catch (Exception ex) {
                    rec.put('ErrorMessage', ex.getMessage());
                    failedRecords.add(rec);
                }
            }
    
            if (!entities.isEmpty()) {
                insert entities;
                for (Entity_Profile__c e : entities) {
                    Map<String, String> s = new Map<String, String>();
                    s.put('Email', e.Email__c);
                    successRecords.add(s);
                }
            }
    
            response.put('successRecords', successRecords);
            response.put('failedRecords', failedRecords);
            response.put('isSuccess', true);
    
        } catch (Exception e) {
            throw new AuraHandledException(
                'Entity bulk creation failed: ' + e.getMessage()
            );
        }
    
        return response;
    }
@AuraEnabled(cacheable=true)
public static String getOrgEmailForBulk(Id companyId) {
    if (companyId == null) return null;

    Company__c comp = [
        SELECT Organization__r.Email__c
        FROM Company__c
        WHERE Id = :companyId
        LIMIT 1
    ];

    return comp.Organization__r.Email__c;
}


}