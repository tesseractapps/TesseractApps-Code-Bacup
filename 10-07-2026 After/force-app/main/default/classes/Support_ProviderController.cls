public with sharing class Support_ProviderController {
    @AuraEnabled
    public static Id saveProvider(Map<String, Object> providerData) {
        try {
            // Check incoming data
            System.debug('>>> providerData RAW: ' + providerData);
            if (providerData == null) {
                throw new AuraHandledException('providerData is NULL from LWC');
            }
            // Debug all expected keys
            for (String key : providerData.keySet()) {
                System.debug('>>> Key: ' + key + ' | Value: ' + providerData.get(key));
            }
            User currentUser = [
                SELECT Id, Email, Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];
            System.debug('>>> Current User Email: ' + currentUser.Email);

            List<Organisation__c> organisationList = [
                SELECT Id, Name
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];
            System.debug('>>> Staff Lookup Result: ' + organisationList);
            if (organisationList.isEmpty()) {
                throw new AuraHandledException('No Organisation Found');
            }
            Organisation__c Org = organisationList[0];
            System.debug('>>> Org Id: ' + Org.Id);
            Support_Provider__c provider = new Support_Provider__c();
            if (providerData.containsKey('Id')) {
                System.debug('>>> Provider Id for Edit: ' + providerData.get('Id'));
                provider.Id = (Id) providerData.get('Id');
            }
            provider.Name = (String) providerData.get('Name');
            provider.Current_Capacity__c = (String) providerData.get('Current_Capacity__c');
            provider.Service_Type__c = (String) providerData.get('Service_Type__c');
            provider.Registration_Number__c = (String) providerData.get('Registration_Number__c');
            provider.ABN__c = (String) providerData.get('ABN__c');
            provider.Contact_Email__c = (String) providerData.get('Contact_Email__c');
            provider.Phone__c = (String) providerData.get('Phone__c');
            provider.Status__c = (String) providerData.get('Status__c');
            provider.Industry_Type__c = (String) providerData.get('Industry_Type__c');
            provider.Organization__c = Org.Id;        
            System.debug('>>> FINAL PROVIDER OBJECT: ' + provider);
            upsert provider;
            System.debug('>>> SAVED PROVIDER ID: ' + provider.Id);
            return provider.Id;
        } catch (Exception ex) {
            System.debug('>>> ERROR OCCURRED: ' + ex.getMessage());
            System.debug('>>> STACK TRACE: ' + ex.getStackTraceString());
            throw new AuraHandledException('Error saving Provider: ' + ex.getMessage());
        }
    }

     @AuraEnabled
    public static List<Map<String, Object>> getProviders(String selectedServiceType) {
        // Get logged-in user
      /*  User u = [
            SELECT Email 
            FROM User 
            WHERE Id = :UserInfo.getUserId()
        ];
        Staff__c staff = [
            SELECT Id
            FROM Staff__c
            WHERE Email_Address__c = :u.Email
            LIMIT 1
        ];

        if (staff == null) {
            throw new AuraHandledException('No Staff record found for your email.');
        }*/
         User u = [
            SELECT Id, Email, UserRole.Name, Organization_Name__c 
            FROM User 
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];
    
        // Identify Org Admin role
       // Boolean isOrgAdmin = (currentUser.UserRole.Name == 'CEO' ||  currentUser.UserRole.Name == 'Portal Account Partner Executive');
        // System.debug('isOrgAdmin'+isOrgAdmin);
    
        // 2. Get Staff__c record based on User email
        Staff__c staff = [
            SELECT Id, Email_Address__c 
            FROM Staff__c 
            WHERE Email_Address__c = :u.Email
            LIMIT 1
        ];
    
        // 3. Get organization record
        Organisation__c orgRecord = [
            SELECT Id 
            FROM Organisation__c 
            WHERE Name = :u.Organization_Name__c 
            LIMIT 1
        ];
        
        // Query all providers for this staff
       List<Support_Provider__c> providers = [
            SELECT 
                Id,
                Name,
                Contact_Email__c,
                Status__c,
                Service_Type__c,
                Service_Offerings__c,
                Registration_Number__c,
                Phone__c,
                ABN__c,
                Address__Street__s,
                Address__City__s,
                Address__StateCode__s,
                Address__PostalCode__s,
                Address__CountryCode__s,
                Current_Capacity__c
            FROM Support_Provider__c
            WHERE Organization__c = :orgRecord.Id AND Status__c='Active'
            ORDER BY Name
        ];
        
        if(!String.isBlank(selectedServiceType)){
            List<Support_Provider__c> filteredProviders =new List<Support_Provider__c>();
            for(Support_Provider__c provider : providers){
                if(String.isBlank(provider.Service_Type__c ) ){
                    continue;
                }
                List<String> serviceTypes = provider.Service_Type__c.split(';');

                if(serviceTypes.contains( selectedServiceType)){
                    filteredProviders.add(provider);
                }
            }

            providers = filteredProviders;
        }
    
        // Query related clients using the updated lookup field
        Map<Id, List<Support_Client__c>> mapProviderClients = new Map<Id, List<Support_Client__c>>();
        List<Support_Client__c> clients = [
            SELECT Id, Name, SupportClient_To_Provider__c
            FROM Support_Client__c
            WHERE SupportClient_To_Provider__c IN :providers
        ];
        for (Support_Client__c c : clients) {
            if (!mapProviderClients.containsKey(c.SupportClient_To_Provider__c)) {
                mapProviderClients.put(c.SupportClient_To_Provider__c, new List<Support_Client__c>());
            }
            mapProviderClients.get(c.SupportClient_To_Provider__c).add(c);
        }
        List<Map<String, Object>> results = new List<Map<String, Object>>();
        for (Support_Provider__c p : providers) {

            List<Support_Client__c> related = mapProviderClients.get(p.Id);
            if (related == null) related = new List<Support_Client__c>();

            // Get initials for up to 3 participants
            List<String> initials = new List<String>();
            Integer maxToShow = Math.min(3, related.size());

            for (Integer i = 0; i < maxToShow; i++) {
                initials.add(getInitials(related[i].Name));
            }
            Integer extraCount = related.size() > 3 ? related.size() - 3 : 0;

            // If no participants, show nothing
            if (related.isEmpty()) {
                initials = new List<String>();
                extraCount = 0;
            }
       results.add(new Map<String, Object>{
            'id' => p.Id,
            'name' => p.Name,
            'email' => p.Contact_Email__c,
            'status' => p.Status__c,
            'serviceType' => p.Service_Type__c,
            'serviceOfferings' => p.Service_Offerings__c,
            'registrationNumber' => p.Registration_Number__c,
            'phone' => p.Phone__c,
            'abn' => p.ABN__c,
            'street' => p.Address__Street__s,
            'city' => p.Address__City__s,
            'province' => p.Address__StateCode__s,
            'postalcode' => p.Address__PostalCode__s,
            'country' => p.Address__CountryCode__s,
            'capacity' => p.Current_Capacity__c,
            'participantAvatars' => initials,
            'participantExtra' => extraCount
        });

        }
        return results;
    }

    private static String getInitials(String name) {
        if (String.isBlank(name)) return '';
        List<String> parts = name.split(' ');
        String i1 = parts[0].substring(0,1).toUpperCase();
        String i2 = parts.size() > 1 ? parts[1].substring(0,1).toUpperCase() : '';
        return i1 + i2;
    }

    @AuraEnabled
    public static Map<String, Object> getProvidersPaged(
        Integer pageSize,
        Integer pageNumber,
        String searchKey
    ) {
        Map<String, Object> response = new Map<String, Object>();
        try {
            if (pageSize == null || pageSize <= 0) {
                pageSize = 10;
            }
            if (pageNumber == null || pageNumber <= 0) {
                pageNumber = 1;
            }

            if (String.isBlank(searchKey)) {
                searchKey = '';
            }
            
            String searchPattern = '%' + searchKey + '%';

            Integer offsetVal = (pageNumber - 1) * pageSize;

            User currentUser = [
                SELECT Email, Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            /* Staff__c staff = [
                SELECT Id
                FROM Staff__c
                WHERE Email_Address__c = :u.Email
                LIMIT 1
            ]; */

            Organisation__c organisationList = [
                SELECT Id, Name
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];

            if (organisationList == null) {
                throw new AuraHandledException('No Organisation record found for logged-in user.');
            }
            List<Support_Provider__c> providers = [
                SELECT 
                    Id,
                    Name,
                    Contact_Email__c,
                    Status__c,
                    Service_Type__c,
                    Service_Offerings__c,
                    Registration_Number__c,
                    Industry_Type__c,
                    Phone__c,
                    ABN__c,
                    Organization__c,
                    Address__Street__s,
                    Address__City__s,
                    Address__StateCode__s,
                    Address__PostalCode__s,
                    Address__CountryCode__s,
                    Current_Capacity__c
                FROM Support_Provider__c
                WHERE Organization__c = :organisationList.Id
                AND (
                    Name LIKE :searchPattern
                    OR Contact_Email__c LIKE :searchPattern
                )
                ORDER BY Name
                LIMIT :pageSize
                OFFSET :offsetVal
            ];

            Integer totalCount = [
                SELECT COUNT()
                FROM Support_Provider__c
                WHERE Organization__c = :organisationList.Id
            ];

            Integer totalPages = (Integer)Math.ceil(
                (Decimal)totalCount / pageSize
            );
            Map<Id, List<Support_Client__c>> mapProviderClients = new Map<Id, List<Support_Client__c>>();
            if (!providers.isEmpty()) {
                List<Support_Client__c> clients = [
                    SELECT Id, Name, SupportClient_To_Provider__c
                    FROM Support_Client__c
                    WHERE SupportClient_To_Provider__c IN :providers
                ];

                for (Support_Client__c c : clients) {
                    if (!mapProviderClients.containsKey(c.SupportClient_To_Provider__c)) {
                        mapProviderClients.put(
                            c.SupportClient_To_Provider__c,
                            new List<Support_Client__c>()
                        );
                    }
                    mapProviderClients.get(c.SupportClient_To_Provider__c).add(c);
                }
            }
            List<Map<String, Object>> results = new List<Map<String, Object>>();

            for (Support_Provider__c p : providers) {
                List<Support_Client__c> related =
                    mapProviderClients.containsKey(p.Id)
                    ? mapProviderClients.get(p.Id)
                    : new List<Support_Client__c>();

                // Participant initials (max 3)
                List<String> initials = new List<String>();
                Integer maxToShow = Math.min(3, related.size());

                for (Integer i = 0; i < maxToShow; i++) {
                    initials.add(getInitials(related[i].Name));
                }

                Integer extraCount = related.size() > 3
                    ? related.size() - 3
                    : 0;

                if (related.isEmpty()) {
                    initials = new List<String>();
                    extraCount = 0;
                }

                results.add(new Map<String, Object>{
                    'id' => p.Id,
                    'name' => p.Name,
                    'email' => p.Contact_Email__c,
                    'status' => p.Status__c,
                    'serviceType' => p.Service_Type__c,
                    'serviceOfferings' => p.Service_Offerings__c,
                    'registrationNumber' => p.Registration_Number__c,
                    'phone' => p.Phone__c,
                    'abn' => p.ABN__c,
                    'street' => p.Address__Street__s,
                    'city' => p.Address__City__s,
                    'province' => p.Address__StateCode__s,
                    'postalcode' => p.Address__PostalCode__s,
                    'country' => p.Address__CountryCode__s,
                    'capacity' => p.Current_Capacity__c,
                    'industryType' => p.Industry_Type__c,
                    'participantAvatars' => initials,
                    'participantExtra' => extraCount
                });
            }

            response.put('status', 'SUCCESS');
            response.put('records', results);
            response.put('totalCount', totalCount);
            response.put('pageNumber', pageNumber);
            response.put('pageSize', pageSize);
            response.put('totalPages', totalPages);
        }
        catch (Exception e) {
            System.debug('Exception in getProvidersPaged: ' + e.getMessage());
            System.debug('Stack Trace: ' + e.getStackTraceString());
            response.put('status', 'ERROR');
            response.put('message', e.getMessage());
        }
        return response;
    }

    public class DashboardMetricsWrapper {
        @AuraEnabled public Integer activeParticipants;
        @AuraEnabled public Integer activeGoals;
        @AuraEnabled public Integer highPriorityTasks;
        @AuraEnabled public Integer totalParticipants;  
        @AuraEnabled public Decimal totalBudgetAllocated;
        @AuraEnabled public Decimal totalBudgetSpent;
        @AuraEnabled public Decimal totalBudgetRemaining;
        @AuraEnabled public String  budgetUtilizationPercent;
    }

    @AuraEnabled
    public static DashboardMetricsWrapper getDashboardMetrics() {

        DashboardMetricsWrapper result = new DashboardMetricsWrapper();

        try {

            /* =========================================
            1️⃣ Resolve Logged-in Staff
            ========================================= */
            User currentUser = [
                SELECT Id, Email, Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            List<Organisation__c> orgRecord = [
                SELECT Id 
                FROM Organisation__c 
                WHERE Name = :currentUser.Organization_Name__c 
                LIMIT 1
            ];

            if (orgRecord.isEmpty()) {
                return result;
            }

            Id staffId = orgRecord[0].Id;

            /* =========================================
            2️⃣ Active Participants Count
            ========================================= */
            result.activeParticipants = [
                SELECT COUNT()
                FROM Support_Client__c
                WHERE Organization__c = :staffId
                AND Status__c = 'Active'
            ];

            /* =========================================
            3️⃣ Active Goals Count
            ========================================= */
            result.activeGoals = [
                SELECT COUNT()
                FROM Support_Goals__c
                WHERE SupportClient_To_Goals__r.Organization__c = :staffId
                AND SupportClient_To_Goals__r.Status__c = 'Active'
                AND Status__c = 'Active'
            ];

            /* =========================================
            4️⃣ Total Participants
            ========================================= */
            result.totalParticipants = [
                SELECT COUNT()
                FROM Support_Client__c
                WHERE Organization__c = :staffId
            ];

            /* =========================================
            5️⃣ High Priority Tasks
            ========================================= */
            result.highPriorityTasks = [
                SELECT COUNT()
                FROM Support_Notes__c
                WHERE Organization__c = :staffId
                AND Created_From__c = 'Task'
                AND Entry_Date__c >= :Date.today()
            ];

            /* =========================================
            6️⃣ Budget Utilization
            ========================================= */
            Decimal totalDurationHours = 0;
            Decimal totalBillableDurationHours = 0;

            List<Support_Notes__c> notes = [
                SELECT Billable__c, Duration_Hours__c
                FROM Support_Notes__c
                WHERE Organization__c = :staffId
                AND Entry_Date__c >= :Date.today()
            ];

            for (Support_Notes__c note : notes) {
                Decimal hours = 0;

                if (note.Duration_Hours__c != null) {
                    hours = Decimal.valueOf(note.Duration_Hours__c);
                }

                totalDurationHours += hours;

                if (note.Billable__c == true) {
                    totalBillableDurationHours += hours;
                }
            }

            result.budgetUtilizationPercent =
                String.valueOf(totalBillableDurationHours.intValue()) +
                '/' +
                String.valueOf(totalDurationHours.intValue());

        } catch (Exception e) {
            throw new AuraHandledException(
                'Error loading dashboard metrics: ' + e.getMessage()
            );
        }

        return result;
    }

}