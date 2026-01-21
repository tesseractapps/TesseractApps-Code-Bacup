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
    
}