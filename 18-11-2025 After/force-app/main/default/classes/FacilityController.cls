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
        
        return [SELECT id,Name,Email__c,AddressData__c,Phone__c,Status__c,Services__c,Organisation__r.name,Picture__c,
                Manager_Name__c,Address__Street__s,
                Address__City__s,Address__StateCode__s,Address__CountryCode__s,Address__PostalCode__s,Use_Org_ABN__c,ABN__c
                FROM Facility__c where  Organisation__c  =: recordId order by name asc];
    }
    
    @AuraEnabled
    public static List<Facility__c> fetchFacilitiesByOrgIdCommunity(String recordId, String firstname){
        if(recordId=='' || recordId ==null){
            User objUser = [ SELECT Phone, Id,Organization_Name__c FROM User WHERE Id = : UserInfo.getUserId() ];
            List<Organisation__c> orgNames = [Select id, Name,ABN__c,ACN__c,NDIS_Provider__c,Contact_No__c,Email__c,Address__c from Organisation__c where name=:objUser.Organization_Name__c]; // Can include multiple fields, 
            if(orgNames.size()>0)
                recordId = orgNames[0].Id;
        } 
        list<Facility__c> facilityList = new list<Facility__c>();
        System.debug('firstname '+firstname);        
        System.debug('recordId '+recordId);
        String trucatedStr = recordId.substring(0,15);
        String[] filters = new String[0];
        if(firstname !=NULL){
            string fname='%'+firstname+'%';
            filters.add('Name Like : fname');
        }       
        filters.add('Organisation__c = : trucatedStr');
        
        String query='SELECT id,Name,Email__c,AddressData__c,Phone__c,Status__c,Services__c,Picture__c,Organisation__r.name,Manager_Name__c,Address__Street__s,Address__City__s,Address__StateCode__s,Address__CountryCode__s,Address__PostalCode__s,facility_status__c,Use_Org_ABN__c,ABN__c,BMS_Identifier__c,Software_Id__c,Agent_Name__c,Tax_Agency__c,Agent_Number__c,Afternoon_Shift_Color__c,Custom_Shift_Color__c,General_Shift_Color__c,Morning_Shift_Color__c,Night_Shift_Color__c,Sleepover_Shift_Color__c,Cost_per_Km_Fuel__c,';
        query+= 'Cost_per_Km_Electric__c,General_Shift_Start_Time__c,General_Shift_End_Time__c,Morning_Shift_Start_Time__c,Morning_Shift_End_Time__c,Afternoon_Shift_Start_Time__c,Afternoon_Shift_End_Time__c,Night_Shift_Start_Time__c,Night_Shift_End_Time__c,Custom_Shift_Start_Time__c,Custom_Shift_End_Time__c,Sleepover_Shift_Strat_Time__c,Sleepover_Shift_End_Time__c FROM Facility__c';
        if(filters.size() > 0) {
            query += ' WHERE ' + String.join(filters, ' AND ');
        } 
        system.debug('query>>>>'+query);           
        facilityList=Database.query(query);
        
        return facilityList;   
        
        //return [SELECT id,Name,Email__c,AddressData__c,Phone__c,Status__c,Services__c,Organisation__r.name,Manager_Name__c,Address__Street__s,Address__City__s,Address__StateCode__s,Address__CountryCode__s,Address__PostalCode__s FROM Facility__c where  Organisation__c  =: recordId order by name asc];
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
                General_Shift_Color__c,Afternoon_Shift_Color__c,Custom_Shift_Color__c,Morning_Shift_Color__c,Night_Shift_Color__c,Sleepover_Shift_Color__c, Preferred_Staff_Value__c, Risk_Index_Order__c, Risk_Index_Value__c,Radius_Order__c,Radius_Value__c,Type_of_Service__c FROM Facility__c WHERE Id =:facId];
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


    
}